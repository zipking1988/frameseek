"""Owned, expiring investigations. SQLite CAS prevents silent tab overwrites."""

import hashlib
import json
import re
import secrets
import sqlite3
import time
from contextlib import contextmanager
from pathlib import Path

from fastapi import HTTPException


def ident(prefix=""):
    return prefix + secrets.token_hex(16)


def digest(value):
    return hashlib.sha256(value.encode()).hexdigest()


class Workspace:
    def __init__(self, root: Path, ttl_hours=24):
        self.root = root.resolve()
        self.root.mkdir(parents=True, exist_ok=True, mode=0o700)
        self.root.chmod(0o700)
        self.ttl = ttl_hours * 3600
        self.path = self.root / "workspace.sqlite3"
        with self.db() as c:
            c.executescript("""
            CREATE TABLE IF NOT EXISTS sessions(
              id TEXT PRIMARY KEY, csrf TEXT NOT NULL, expires REAL NOT NULL);
            CREATE TABLE IF NOT EXISTS investigations(
              id TEXT PRIMARY KEY, owner TEXT NOT NULL, video TEXT NOT NULL,
              title TEXT NOT NULL, revision INTEGER NOT NULL, state TEXT NOT NULL,
              updated REAL NOT NULL, expires REAL NOT NULL, deleted INTEGER DEFAULT 0);
            CREATE TABLE IF NOT EXISTS videos(
              id TEXT PRIMARY KEY, owner TEXT NOT NULL, name TEXT NOT NULL,
              bytes INTEGER NOT NULL, generation INTEGER NOT NULL DEFAULT 1,
              metadata TEXT NOT NULL DEFAULT '{}', manifest TEXT,
              expires REAL NOT NULL, deleted INTEGER DEFAULT 0);
            CREATE TABLE IF NOT EXISTS jobs(
              id TEXT PRIMARY KEY, video TEXT NOT NULL, generation INTEGER NOT NULL,
              state TEXT NOT NULL, completed INTEGER DEFAULT 0, total INTEGER DEFAULT 0,
              error TEXT, lease REAL, budget TEXT, updated REAL NOT NULL);
            CREATE TABLE IF NOT EXISTS queries(
              id TEXT NOT NULL, investigation TEXT NOT NULL, owner TEXT NOT NULL,
              generation INTEGER NOT NULL, hash TEXT NOT NULL, state TEXT NOT NULL,
              result TEXT, http INTEGER DEFAULT 200, updated REAL NOT NULL,
              PRIMARY KEY(owner,id));
            """)
            columns = {row[1] for row in c.execute("PRAGMA table_info(queries)")}
            if "input" not in columns:
                c.execute("ALTER TABLE queries ADD COLUMN input TEXT")
            # A lost in-flight call is never replayed on process restart.
            c.execute(
                "UPDATE jobs SET state='failed',error='unknown',lease=NULL "
                "WHERE state IN ('probing','transcribing','captioning','indexing')"
            )
            c.execute(
                "UPDATE jobs SET state='failed',error='interrupted',lease=NULL WHERE state='queued'"
            )
            c.execute("UPDATE queries SET state='unknown' WHERE state='running'")
        self.path.chmod(0o600)

    @contextmanager
    def db(self):
        c = sqlite3.connect(self.path, timeout=5)
        c.row_factory = sqlite3.Row
        c.execute("PRAGMA journal_mode=WAL")
        c.execute("PRAGMA busy_timeout=5000")
        try:
            with c:
                yield c
        finally:
            c.close()

    def session(self, token=None):
        with self.db() as c:
            if token:
                row = c.execute("SELECT * FROM sessions WHERE id=?", (digest(token),)).fetchone()
                if row and row["expires"] > time.time():
                    return dict(row), None
            if (
                c.execute(
                    "SELECT count(*) FROM sessions WHERE expires>?", (time.time(),)
                ).fetchone()[0]
                >= 1000
            ):
                raise HTTPException(429, "session_capacity")
            token = ident()
            row = {"id": digest(token), "csrf": ident(), "expires": time.time() + self.ttl}
            c.execute("INSERT INTO sessions VALUES(?,?,?)", tuple(row.values()))
            return row, token

    def authenticate(self, token):
        if not token:
            raise HTTPException(401, "session_required")
        with self.db() as c:
            row = c.execute("SELECT * FROM sessions WHERE id=?", (digest(token),)).fetchone()
        if not row or row["expires"] <= time.time():
            raise HTTPException(401, "session_expired")
        return dict(row)

    def owner_active(self, owner):
        with self.db() as c:
            row = c.execute("SELECT expires FROM sessions WHERE id=?", (owner,)).fetchone()
        return bool(row and row["expires"] > time.time())

    def owned(self, table, key, owner):
        if table not in {"videos", "investigations"}:
            raise ValueError("Invalid owned table")
        with self.db() as c:
            row = c.execute(
                f"SELECT * FROM {table} WHERE id=? AND owner=?", (key, owner)
            ).fetchone()
        if not row:
            raise HTTPException(404, "not_found")
        if row["deleted"] or row["expires"] <= time.time():
            raise HTTPException(410, "expired_or_deleted")
        return dict(row)

    def create(self, owner, video="demo_parcel", title="未命名调查"):
        expiry = time.time() + self.ttl
        if video != "demo_parcel":
            expiry = min(expiry, self.owned("videos", video, owner)["expires"])
        key = ident("desk_")
        with self.db() as c:
            if (
                c.execute(
                    "SELECT count(*) FROM investigations WHERE owner=? AND deleted=0 AND expires>?",
                    (owner, time.time()),
                ).fetchone()[0]
                >= 50
            ):
                raise HTTPException(429, "investigation_limit")
            c.execute(
                "INSERT INTO investigations VALUES(?,?,?,?,?,?,?,?,0)",
                (key, owner, video, title, 0, "{}", time.time(), expiry),
            )
        return self.get(key, owner)

    def get(self, key, owner):
        row = self.owned("investigations", key, owner)
        row["state"] = json.loads(row["state"])
        row.pop("owner")
        return row

    def save(self, key, owner, revision, state):
        old = self.owned("investigations", key, owner)
        encoded = json.dumps(state, ensure_ascii=False, allow_nan=False, separators=(",", ":"))
        if len(encoded.encode()) > 1024 * 1024:
            raise HTTPException(413, "investigation_too_large")
        with self.db() as c:
            updated = c.execute(
                "UPDATE investigations SET state=?,title=?,revision=revision+1,"
                "updated=? WHERE id=? AND owner=? AND revision=? AND deleted=0 "
                "AND expires>?",
                (
                    encoded,
                    str(state.get("title", old["title"]))[:80],
                    time.time(),
                    key,
                    owner,
                    revision,
                    time.time(),
                ),
            )
            if updated.rowcount != 1:
                raise HTTPException(409, "revision_conflict")
        return self.get(key, owner)

    def list(self, table, owner):
        if table not in {"videos", "investigations"}:
            raise ValueError("Invalid table")
        with self.db() as c:
            rows = c.execute(
                f"SELECT * FROM {table} WHERE owner=? AND deleted=0 AND expires>?",
                (owner, time.time()),
            ).fetchall()
        result = []
        for row in rows:
            item = dict(row)
            for key in ("state", "owner", "manifest"):
                item.pop(key, None)
            if "metadata" in item:
                item["metadata"] = json.loads(item["metadata"])
                item["job"] = self.job(item["id"], owner)
            result.append(item)
        return sorted(result, key=lambda x: x.get("updated", x["expires"]), reverse=True)

    def job(self, video, owner):
        self.owned("videos", video, owner)
        with self.db() as c:
            row = c.execute(
                "SELECT * FROM jobs WHERE video=? ORDER BY updated DESC LIMIT 1", (video,)
            ).fetchone()
        return dict(row) if row else None

    def valid_generation(self, video, owner, generation):
        return self.owned("videos", video, owner)["generation"] == generation

    def stage(self, video, owner, generation, state, **updates):
        if not self.valid_generation(video, owner, generation):
            raise HTTPException(409, "stale_generation")
        fields = {"state": state, "updated": time.time(), **updates}
        if not set(fields) <= {
            "state",
            "updated",
            "completed",
            "total",
            "error",
            "budget",
            "lease",
        }:
            raise ValueError("Invalid job update")
        with self.db() as c:
            result = c.execute(
                "UPDATE jobs SET "
                + ",".join(k + "=?" for k in fields)
                + " WHERE video=? AND generation=? AND EXISTS(SELECT 1 FROM videos "
                "WHERE id=? AND deleted=0 AND expires>? AND generation=?)",
                (*fields.values(), video, generation, video, time.time(), generation),
            )
            if result.rowcount != 1:
                raise HTTPException(409, "stale_generation")

    def publish(self, video, owner, generation, manifest):
        row = self.owned("videos", video, owner)
        metadata = json.loads(row["metadata"])
        segments = manifest.get("segments", [])
        windows = metadata.get("windows", [])
        if (
            not windows
            or len(segments) != len(windows)
            or manifest.get("capabilities", {}).get("visual") != "ready"
        ):
            raise HTTPException(409, "incomplete_manifest")
        for segment, window in zip(segments, windows, strict=True):
            if (segment["start"], segment["end"]) != (
                window["start"],
                window["end"],
            ) or not segment.get("frames"):
                raise HTTPException(409, "incomplete_manifest")
            for frame in segment["frames"]:
                if (
                    not re.fullmatch(r"[a-zA-Z0-9_-]+\.jpg", frame["file"])
                    or not (self.root / video / "frames" / frame["file"]).is_file()
                ):
                    raise HTTPException(409, "missing_artifact")
        with self.db() as c:
            c.execute("BEGIN IMMEDIATE")
            result = c.execute(
                "UPDATE videos SET manifest=? WHERE id=? AND owner=? "
                "AND generation=? AND deleted=0 AND expires>?",
                (json.dumps(manifest, allow_nan=False), video, owner, generation, time.time()),
            )
            if result.rowcount != 1:
                raise HTTPException(409, "stale_generation")
            c.execute(
                "UPDATE jobs SET state='ready',updated=?,lease=NULL WHERE video=? AND generation=?",
                (time.time(), video, generation),
            )

    def delete(self, table, key, owner):
        self.owned(table, key, owner)
        with self.db() as c:
            c.execute("BEGIN IMMEDIATE")
            c.execute(f"UPDATE {table} SET deleted=1 WHERE id=? AND owner=?", (key, owner))
            if table == "videos":
                c.execute(
                    "UPDATE videos SET generation=generation+1,manifest=NULL WHERE id=?", (key,)
                )
                c.execute("UPDATE investigations SET deleted=1,state='{}' WHERE video=?", (key,))
                c.execute(
                    "UPDATE jobs SET state='cancelled',updated=? WHERE video=?", (time.time(), key)
                )
            else:
                c.execute("UPDATE investigations SET state='{}' WHERE id=?", (key,))
            c.execute(
                "DELETE FROM queries WHERE investigation IN "
                "(SELECT id FROM investigations WHERE deleted=1 OR expires<=?)",
                (time.time(),),
            )

    def cleanup(self):
        import shutil

        with self.db() as c:
            expired = c.execute(
                "SELECT id FROM videos WHERE deleted=1 OR expires<=?", (time.time(),)
            ).fetchall()
            c.execute("UPDATE videos SET deleted=1,manifest=NULL WHERE expires<=?", (time.time(),))
            c.execute(
                "UPDATE investigations SET deleted=1,state='{}' WHERE expires<=?", (time.time(),)
            )
            c.execute(
                "DELETE FROM queries WHERE investigation IN "
                "(SELECT id FROM investigations WHERE deleted=1)"
            )
            c.execute(
                "DELETE FROM queries WHERE owner IN (SELECT id FROM sessions WHERE expires<=?)",
                (time.time(),),
            )
            c.execute("DELETE FROM sessions WHERE expires<=?", (time.time(),))
        for row in expired:
            shutil.rmtree(self.root / row["id"], ignore_errors=False) if (
                self.root / row["id"]
            ).exists() else None
