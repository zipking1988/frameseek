"""Session-owned workspace, upload/jobs, private media and idempotent chat."""

import asyncio
import fcntl
import json
import os
import re
import shutil
import threading
import time
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, ConfigDict, Field

from frameseek.agent import Agent, AgentError
from frameseek.attempts import BudgetDenied
from frameseek.demo import catalog
from frameseek.media import MAX_UPLOAD, MediaError, frames, probe, scene_windows
from frameseek.schema import Answer
from frameseek.workspace import Workspace, digest, ident

Key = Annotated[str, Field(pattern=r"^[a-zA-Z0-9_-]{1,128}$")]
_PROCESS_LOCKS = {}


class Input(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True, allow_inf_nan=False)


class NewInvestigation(Input):
    video_id: Key = "demo_parcel"
    title: str = Field(default="未命名调查", max_length=80)


class SaveInvestigation(Input):
    revision: int = Field(ge=0)
    state: dict


class RenameVideo(Input):
    name: str = Field(min_length=1, max_length=180)


class ChatInput(Input):
    investigation_id: Key
    request_id: Key
    generation: int = Field(ge=0)
    question: str = Field(min_length=1, max_length=4000)
    parent_request_id: Key | None = None


def unknown_final(request_id):
    return {
        "id": request_id,
        "question": "先前的查询结果不确定",
        "mode": "real",
        "response": {
            "schema_version": "0.1",
            "status": "error",
            "timebase": "video_absolute_seconds",
            "answer": "先前调用结果不确定，已结束恢复。",
            "events": [],
            "unresolved": [],
            "followups": [],
            "trace": {
                "visible": {"channels": [], "segments_reviewed": 0, "evidence_segments": 0},
                "debug": None,
            },
            "errors": [
                {
                    "code": "model_unknown",
                    "stage": "query",
                    "message": "调用结果不确定",
                    "cause": "unknown",
                    "retryable": False,
                    "suggested_action": "显式发起新的尝试。",
                    "docs_url": "/docs/errors",
                    "request_id": request_id,
                }
            ],
        },
    }


def register(app, settings, root, runtime=None, transport=None):
    root = root.resolve()
    root.mkdir(parents=True, exist_ok=True, mode=0o700)
    if str(root) in _PROCESS_LOCKS:
        raise RuntimeError("One API/worker instance is allowed per private workspace")
    lock = os.open(root / "serve.lock", os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW, 0o600)
    try:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        os.close(lock)
        raise RuntimeError("Another API/worker process owns this workspace") from None
    _PROCESS_LOCKS[str(root)] = lock
    app.state.process_lock = lock
    ws = Workspace(root, settings.ttl_hours)
    agent = Agent(ws, settings, runtime, transport)
    app.state.workspace, app.state.agent = ws, agent
    router = APIRouter()
    upload_gate = asyncio.Semaphore(2)
    worker_lock = threading.Lock()
    workers = set()

    def owned(request: Request):
        session = ws.authenticate(request.cookies.get("fs_session"))
        if request.method not in {"GET", "HEAD"}:
            origin = request.headers.get("origin")
            if origin and origin != str(request.base_url).rstrip("/"):
                raise HTTPException(403, "origin_rejected")
            if not request.headers.get("x-fs-csrf") or not __import__("secrets").compare_digest(
                request.headers["x-fs-csrf"], session["csrf"]
            ):
                raise HTTPException(403, "csrf_rejected")
        return session["id"]

    owner_dependency = Depends(owned)

    def run_job(video, owner, generation, analysis=False):
        directory = ws.root / video
        try:
            row = ws.owned("videos", video, owner)
            if row["generation"] != generation:
                raise HTTPException(409, "stale_generation")
            if analysis:
                agent.ingest(video, owner, expected_generation=generation)
            else:
                ws.stage(video, owner, generation, "probing", lease=time.time() + 180)
                metadata = scene_windows(directory, probe(directory), settings.scene_threshold)
                previews = frames(
                    directory,
                    video,
                    metadata,
                    {"start": 0.0, "end": metadata["duration"]},
                    8,
                    "preview",
                )
                metadata["preview"] = previews
                with ws.db() as c:
                    c.execute(
                        "UPDATE videos SET metadata=? WHERE id=? AND generation=? AND deleted=0",
                        (json.dumps(metadata), video, generation),
                    )
                ws.stage(
                    video,
                    owner,
                    generation,
                    "awaiting_configuration",
                    total=len(metadata["windows"]),
                    error="real_blocked",
                    lease=None,
                )
        except (
            MediaError,
            AgentError,
            BudgetDenied,
            HTTPException,
            KeyError,
            ValueError,
            TypeError,
            IndexError,
            OSError,
        ):
            try:
                import sys

                error = sys.exception()
                code = (
                    str(error) if isinstance(error, (MediaError, AgentError)) else "analysis_failed"
                )
                ws.stage(video, owner, generation, "failed", error=code[:100], lease=None)
            except HTTPException:
                pass
        finally:
            with worker_lock:
                workers.discard(video)

    def dispatch(video, owner, analysis=False):
        with worker_lock:
            if video in workers:
                raise HTTPException(409, "job_running")
            if len(workers) >= 2:
                raise HTTPException(429, "worker_capacity")
            row = ws.owned("videos", video, owner)
            with ws.db() as c:
                lease = c.execute(
                    "UPDATE jobs SET lease=?,state='queued',error=NULL WHERE video=? "
                    "AND generation=? AND (lease IS NULL OR lease<?) "
                    "AND EXISTS(SELECT 1 FROM videos WHERE id=? AND generation=? "
                    "AND deleted=0 AND expires>?)",
                    (
                        time.time() + 3600,
                        video,
                        row["generation"],
                        time.time(),
                        video,
                        row["generation"],
                        time.time(),
                    ),
                )
                if lease.rowcount != 1:
                    raise HTTPException(409, "job_running")
            workers.add(video)
        threading.Thread(
            target=run_job, args=(video, owner, row["generation"], analysis), daemon=True
        ).start()

    @router.get("/api/session")
    def session(request: Request, response: Response):
        row, token = ws.session(request.cookies.get("fs_session"))
        if token:
            response.set_cookie(
                "fs_session",
                token,
                httponly=True,
                samesite="strict",
                secure=request.url.scheme == "https",
                max_age=ws.ttl,
            )
        response.headers["Cache-Control"] = "no-store"
        blockers = runtime.blockers() if runtime else ["model_endpoints_missing"]
        if settings.mode != "real":
            blockers.append("fixture_mode_no_model_requests")
        if runtime and not blockers:
            try:
                agent.ledger.admit_cost(
                    row["id"], runtime.budget_version, 1, 1, runtime.currency_unit
                )
            except BudgetDenied:
                blockers.append("budget_not_approved_or_insufficient")
        else:
            blockers.append("budget_not_approved")
        return {
            "csrf": row["csrf"],
            "owner_id": row["id"],
            "expires": row["expires"],
            "real_ready": not blockers,
            "blockers": sorted(set(blockers)),
            "ttl_hours": settings.ttl_hours,
        }

    @router.get("/api/investigations")
    def investigations(owner=owner_dependency):
        return {"items": ws.list("investigations", owner)}

    @router.post("/api/investigations", status_code=201)
    def new_investigation(body: NewInvestigation, owner=owner_dependency):
        return ws.create(owner, body.video_id, body.title)

    @router.get("/api/investigations/{key}")
    def investigation(key: str, owner=owner_dependency):
        return ws.get(key, owner)

    @router.put("/api/investigations/{key}")
    def save_investigation(key: str, body: SaveInvestigation, owner=owner_dependency):
        desk = ws.owned("investigations", key, owner)
        state = body.state
        if set(state) - {
            "epoch",
            "title",
            "groupTitle",
            "note",
            "records",
            "selectedId",
            "pins",
            "local",
            "inspectorTab",
            "sourceInfo",
            "canvas",
            "ui",
        }:
            raise HTTPException(422, "invalid_snapshot")
        if type(state.get("epoch", 0)) is not int or not 0 <= state.get("epoch", 0) <= 2**53 - 1:
            raise HTTPException(422, "invalid_snapshot")
        try:
            if not isinstance(state.get("records", []), list) or not isinstance(
                state.get("pins", []), list
            ):
                raise ValueError
            if len(state.get("records", [])) > 12 or len(state.get("pins", [])) > 8:
                raise HTTPException(422, "snapshot_limit")
            for record in [*state.get("records", []), *state.get("pins", [])]:
                if not re.fullmatch(r"(?:task|finding)-[0-9]{1,9}", record["id"]):
                    raise ValueError
                query = record["query"]
                if not isinstance(query["question"], str) or len(query["question"]) > 4000:
                    raise ValueError
                answer = Answer.model_validate(query["response"])
                if any(event.video_id != desk["video"] for event in answer.events):
                    raise ValueError
                if record.get("kind") == "evidence" and not any(
                    frame.model_dump(mode="json") == record.get("frame")
                    for event in answer.events
                    for frame in event.evidence
                ):
                    raise ValueError
                if desk["video"] == "demo_parcel":
                    canonical = next(
                        (q for q in catalog()["queries"] if q["id"] == query["id"]), None
                    )
                    if (
                        not canonical
                        or canonical["response"] != query["response"]
                        or query.get("mode") == "real"
                    ):
                        raise ValueError
                else:
                    with ws.db() as c:
                        original = c.execute(
                            "SELECT result FROM queries WHERE id=? AND owner=? "
                            "AND investigation=? AND state='done'",
                            (query["id"], owner, key),
                        ).fetchone()
                    if (
                        not original
                        or json.loads(original["result"])["response"] != query["response"]
                    ):
                        raise ValueError
            # Spatial state is plain finite JSON; never stored HTML or executable code.
            encoded = json.dumps(state, allow_nan=False)
            if len(encoded.encode()) > 1024**2:
                raise HTTPException(413, "investigation_too_large")
            if not isinstance(state.get("title", ""), str) or not isinstance(
                state.get("note", ""), str
            ):
                raise ValueError
        except (ValueError, KeyError, TypeError):
            raise HTTPException(422, "invalid_snapshot") from None
        return ws.save(key, owner, body.revision, state)

    @router.delete("/api/investigations/{key}", status_code=204)
    def remove_investigation(key: str, owner=owner_dependency):
        ws.delete("investigations", key, owner)

    @router.get("/api/videos")
    def videos(owner=owner_dependency):
        return {"items": ws.list("videos", owner)}

    @router.post("/api/videos", status_code=201)
    async def upload(request: Request, owner=owner_dependency):
        name = request.headers.get("x-file-name", "video")
        from urllib.parse import unquote

        name = Path(unquote(name).replace("\\", "/")).name[:180] or "video"
        content_type = request.headers.get("content-type", "")
        if not content_type.startswith("video/") and content_type != "application/octet-stream":
            raise HTTPException(415, "video_required")
        try:
            size = int(request.headers.get("content-length", "0"))
        except ValueError:
            raise HTTPException(400, "invalid_upload_length") from None
        if size > MAX_UPLOAD:
            raise HTTPException(413, "upload_limit")
        async with upload_gate:
            video, job = ident("vid_"), ident("job_")
            directory = ws.root / video
            with ws.db() as c:
                c.execute("BEGIN IMMEDIATE")
                used = c.execute(
                    "SELECT count(*),coalesce(sum(bytes),0) FROM videos "
                    "WHERE owner=? AND deleted=0 AND expires>?",
                    (owner, time.time()),
                ).fetchone()
                total = c.execute(
                    "SELECT coalesce(sum(bytes),0) FROM videos WHERE deleted=0 AND expires>?",
                    (time.time(),),
                ).fetchone()[0]
                if (
                    used[0] >= 10
                    or used[1] + MAX_UPLOAD > 1024**3
                    or total + MAX_UPLOAD > 4 * 1024**3
                ):
                    raise HTTPException(429, "storage_limit")
                c.execute(
                    "INSERT INTO videos(id,owner,name,bytes,expires) VALUES(?,?,?,?,?)",
                    (video, owner, name, MAX_UPLOAD, time.time() + ws.ttl),
                )
            directory.mkdir(mode=0o700)
            received = 0
            try:
                with (directory / "original").open("wb") as f:
                    async with asyncio.timeout(180):
                        async for chunk in request.stream():
                            received += len(chunk)
                            if received > MAX_UPLOAD:
                                raise HTTPException(413, "upload_limit")
                            f.write(chunk)
                if not received:
                    raise HTTPException(400, "empty_upload")
                with ws.db() as c:
                    c.execute("UPDATE videos SET bytes=? WHERE id=?", (received, video))
                    c.execute(
                        "INSERT INTO jobs(id,video,generation,state,updated) "
                        "VALUES(?,?,1,'queued',?)",
                        (job, video, time.time()),
                    )
                dispatch(video, owner)
            except BaseException:
                with ws.db() as c:
                    c.execute("UPDATE videos SET deleted=1 WHERE id=?", (video,))
                shutil.rmtree(directory, ignore_errors=True)
                raise
            return {"id": video, "name": name, "bytes": received, "job": ws.job(video, owner)}

    @router.get("/api/videos/{video}")
    def video_detail(video: str, owner=owner_dependency):
        row = ws.owned("videos", video, owner)
        return {
            "id": video,
            "name": row["name"],
            "metadata": json.loads(row["metadata"]),
            "job": ws.job(video, owner),
            "expires": row["expires"],
            "capabilities": json.loads(row["manifest"])["capabilities"]
            if row["manifest"]
            else None,
        }

    @router.patch("/api/videos/{video}")
    def rename_video(video: str, body: RenameVideo, owner=owner_dependency):
        ws.owned("videos", video, owner)
        name = body.name.strip()
        if not name:
            raise HTTPException(422, "name_required")
        with ws.db() as c:
            c.execute(
                "UPDATE videos SET name=? WHERE id=? AND owner=? AND deleted=0",
                (name, video, owner),
            )
        return {"id": video, "name": name}

    @router.post("/api/videos/{video}/analyze", status_code=202)
    def analyze(video: str, owner=owner_dependency):
        row = ws.owned("videos", video, owner)
        job = ws.job(video, owner)
        if settings.mode != "real" or not runtime or runtime.blockers():
            raise HTTPException(409, "real_blocked")
        if not json.loads(row["metadata"]).get("windows"):
            raise HTTPException(409, "preflight_required")
        if job["state"] == "ready":
            return job
        if job["error"] in {"unknown", "model_unknown", "unknown_attempt_do_not_resend"}:
            raise HTTPException(409, "unknown_attempt_do_not_resend")
        try:
            agent.admit_ingest(video, owner)
        except BudgetDenied:
            raise HTTPException(409, "budget_not_approved_or_insufficient") from None
        except AgentError as error:
            raise HTTPException(409, str(error)) from None
        dispatch(video, owner, True)
        return ws.job(video, owner)

    @router.post("/api/videos/{video}/retry", status_code=202)
    def retry_probe(video: str, owner=owner_dependency):
        row = ws.owned("videos", video, owner)
        if ws.job(video, owner)["state"] not in {"failed", "cancelled"} or row["manifest"]:
            raise HTTPException(409, "retry_not_available")
        if json.loads(row["metadata"]).get("windows"):
            raise HTTPException(409, "use_analyze_for_model_retry")
        dispatch(video, owner)
        return ws.job(video, owner)

    @router.post("/api/videos/{video}/cancel", status_code=202)
    def cancel(video: str, owner=owner_dependency):
        ws.owned("videos", video, owner)
        with ws.db() as c:
            c.execute("BEGIN IMMEDIATE")
            c.execute(
                "UPDATE videos SET generation=generation+1,manifest=NULL WHERE id=?", (video,)
            )
            c.execute(
                "UPDATE jobs SET state='cancelled',error='cancelled',lease=NULL,"
                "generation=(SELECT generation FROM videos WHERE id=?),updated=? WHERE video=?",
                (video, time.time(), video),
            )
        return ws.job(video, owner)

    @router.delete("/api/videos/{video}", status_code=204)
    def delete_video(video: str, owner=owner_dependency):
        ws.delete("videos", video, owner)
        ws.cleanup()

    @router.get("/media/{video}/video")
    def private_video(video: str, owner=owner_dependency):
        ws.owned("videos", video, owner)
        return FileResponse(ws.root / video / "original", headers={"Cache-Control": "no-store"})

    @router.get("/media/{video}/frames/{file}")
    def private_frame(video: str, file: str, owner=owner_dependency):
        ws.owned("videos", video, owner)
        if not re.fullmatch(r"[a-zA-Z0-9_-]+\.jpg", file):
            raise HTTPException(404, "not_found")
        path = ws.root / video / "frames" / file
        if not path.is_file():
            raise HTTPException(404, "not_found")
        return FileResponse(path, media_type="image/jpeg", headers={"Cache-Control": "no-store"})

    def prior(body, owner, desk):
        if body.parent_request_id is None:
            return None
        with ws.db() as c:
            row = c.execute(
                "SELECT * FROM queries WHERE owner=? AND id=? AND investigation=? "
                "AND generation=? AND state='done'",
                (owner, body.parent_request_id, desk["id"], body.generation),
            ).fetchone()
        if not row:
            raise HTTPException(409, "invalid_context_anchor")
        result = json.loads(row["result"])
        if not result["response"]["events"]:
            raise HTTPException(409, "context_has_no_verified_anchor")
        return {"question": result["question"], "events": result["response"]["events"]}

    @router.get("/api/investigations/{key}/requests")
    def query_requests(key: str, owner=owner_dependency):
        desk = ws.owned("investigations", key, owner)
        generation = json.loads(desk["state"]).get("epoch", 0)
        with ws.db() as c:
            rows = c.execute(
                "SELECT * FROM queries WHERE investigation=? AND owner=? "
                "AND generation=? ORDER BY updated DESC LIMIT 20",
                (key, owner, generation),
            ).fetchall()
        return {
            "items": [
                {
                    "id": r["id"],
                    "state": r["state"],
                    "input": json.loads(r["input"]) if r["input"] else None,
                    "result": json.loads(r["result"]) if r["result"] else None,
                }
                for r in rows
            ]
        }

    @router.post("/api/chat/prepare")
    def prepare(body: ChatInput, owner=owner_dependency):
        desk = ws.owned("investigations", body.investigation_id, owner)
        state = json.loads(desk["state"])
        if body.generation != state.get("epoch", 0):
            raise HTTPException(409, "stale_chat_generation")
        context = prior(body, owner, desk)
        if (
            re.search(r"^(它|他|她|那里|那之后|然后呢|后来呢|中间呢|那个)", body.question)
            and not context
        ):
            return {
                "kind": "clarification_required",
                "message": "请选中有证据的问题，或明确要查找的物体与时间。",
            }
        return {"kind": "ready", "request_id": body.request_id}

    @router.post("/api/investigations/{key}/requests/{request_id}/cancel")
    def cancel_query(key: str, request_id: Key, owner=owner_dependency):
        desk = ws.owned("investigations", key, owner)
        with ws.db() as c:
            c.execute("BEGIN IMMEDIATE")
            row = c.execute(
                "SELECT * FROM queries WHERE id=? AND owner=? AND investigation=?",
                (request_id, owner, key),
            ).fetchone()
            if not row:
                raise HTTPException(404, "request_not_found")
            if row["state"] == "done":
                return json.loads(row["result"])
            terminal = unknown_final(request_id)
            terminal["video_id"] = desk["video"]
            terminal["question"] = json.loads(row["input"])["question"]
            terminal["response"]["answer"] = "本轮查找已取消，未生成有效证据。"
            terminal["response"]["errors"][0].update(
                code="query_cancelled",
                message="查找已取消",
                suggested_action="如需继续，请显式提交新问题。",
            )
            progress = ws.root / desk["video"] / (request_id + "_verified.json")
            if progress.is_file():
                verified = Answer.model_validate_json(progress.read_text()).model_dump(mode="json")
                if all(event["video_id"] == desk["video"] for event in verified["events"]):
                    terminal["response"] = verified
            c.execute(
                "UPDATE queries SET state='done',result=?,http=200,updated=? "
                "WHERE id=? AND owner=?",
                (json.dumps(terminal, ensure_ascii=False), time.time(), request_id, owner),
            )
        return terminal

    @router.post("/api/chat")
    def chat(body: ChatInput, owner=owner_dependency):
        desk = ws.owned("investigations", body.investigation_id, owner)
        if desk["video"] == "demo_parcel":
            raise HTTPException(409, "demo_uses_explicit_fixtures")
        generation = json.loads(desk["state"]).get("epoch", 0)
        if generation != body.generation:
            raise HTTPException(409, "stale_chat_generation")
        context = prior(body, owner, desk)
        if prepare(body, owner)["kind"] != "ready":
            raise HTTPException(409, "clarification_required")
        payload_hash = digest(body.model_dump_json())
        with ws.db() as c:
            c.execute("BEGIN IMMEDIATE")
            old = c.execute(
                "SELECT * FROM queries WHERE id=? AND owner=?", (body.request_id, owner)
            ).fetchone()
            if old:
                if old["hash"] != payload_hash:
                    raise HTTPException(409, "request_payload_conflict")
                if old["state"] == "done":
                    return JSONResponse(json.loads(old["result"]), status_code=old["http"])
                return JSONResponse(
                    {
                        "kind": "query_control",
                        "state": "pending" if old["state"] == "running" else "unknown",
                        "request_id": body.request_id,
                        "retry_after_seconds": 3 if old["state"] == "running" else None,
                        "suggested_action": "同一请求恢复结果"
                        if old["state"] == "running"
                        else "调用结果不确定，请勿自动重发",
                    },
                    status_code=202 if old["state"] == "running" else 409,
                    headers={"Retry-After": "3"} if old["state"] == "running" else None,
                )
            if (
                c.execute("SELECT count(*) FROM queries WHERE owner=?", (owner,)).fetchone()[0]
                >= 100
                or c.execute("SELECT count(*) FROM queries").fetchone()[0] >= 1000
            ):
                raise HTTPException(429, "query_history_limit")
            # A user-submitted new request explicitly ends an older unknown
            # execution; it never redispatches the old attempt ID.
            unknowns = c.execute(
                "SELECT id,input FROM queries WHERE investigation=? "
                "AND owner=? AND generation=? AND state='unknown'",
                (desk["id"], owner, generation),
            ).fetchall()
            for old_query in unknowns:
                terminal = unknown_final(old_query["id"])
                terminal["video_id"] = desk["video"]
                progress = ws.root / desk["video"] / (old_query["id"] + "_verified.json")
                if progress.is_file():
                    verified = Answer.model_validate_json(progress.read_text()).model_dump(
                        mode="json"
                    )
                    if all(event["video_id"] == desk["video"] for event in verified["events"]):
                        terminal["response"] = verified
                if old_query["input"]:
                    terminal["question"] = json.loads(old_query["input"])["question"]
                c.execute(
                    "UPDATE queries SET state='done',result=?,http=? WHERE id=? AND owner=?",
                    (
                        json.dumps(terminal),
                        200 if terminal["response"]["status"] == "partial" else 502,
                        old_query["id"],
                        owner,
                    ),
                )
            if not agent.slots.acquire(blocking=False):
                raise HTTPException(429, "query_capacity")
            c.execute(
                "INSERT INTO queries(id,investigation,owner,generation,hash,state,updated,input) "
                "VALUES(?,?,?,?,?,'running',?,?)",
                (
                    body.request_id,
                    desk["id"],
                    owner,
                    generation,
                    payload_hash,
                    time.time(),
                    body.model_dump_json(),
                ),
            )
        status = 200
        try:

            def chat_guard():
                active = ws.owned("investigations", desk["id"], owner)
                if json.loads(active["state"]).get("epoch", 0) != generation:
                    raise HTTPException(409, "stale_chat_generation")
                with ws.db() as c:
                    request = c.execute(
                        "SELECT state FROM queries WHERE id=? AND owner=?",
                        (body.request_id, owner),
                    ).fetchone()
                if not request or request["state"] != "running":
                    raise AgentError("query_cancelled")

            answer = agent.query(
                desk["video"], owner, body.question, body.request_id, context, guard=chat_guard
            )
        except (
            AgentError,
            BudgetDenied,
            ValueError,
            KeyError,
            HTTPException,
            TypeError,
            IndexError,
        ) as error:
            code = str(error) if isinstance(error, AgentError) else "analysis_failed"
            if code in {"model_unknown", "unknown_attempt_do_not_resend"}:
                with ws.db() as c:
                    c.execute(
                        "UPDATE queries SET state='unknown',updated=? WHERE id=? AND owner=? "
                        "AND state='running'",
                        (time.time(), body.request_id, owner),
                    )
                    cancelled = c.execute(
                        "SELECT state,result,http FROM queries WHERE id=? AND owner=?",
                        (body.request_id, owner),
                    ).fetchone()
                if cancelled and cancelled["state"] == "done":
                    return JSONResponse(
                        json.loads(cancelled["result"]), status_code=cancelled["http"]
                    )
                return JSONResponse(
                    {
                        "kind": "query_control",
                        "state": "unknown",
                        "request_id": body.request_id,
                        "retry_after_seconds": None,
                        "suggested_action": "调用结果不确定，不会自动重复扣费；原问题已保留。",
                    },
                    status_code=409,
                )
            status = 409 if code in {"video_not_ready", "real_blocked"} else 502
            answer = {
                "schema_version": "0.1",
                "status": "error",
                "timebase": "video_absolute_seconds",
                "answer": "本轮查找未完成，未生成有效证据。",
                "events": [],
                "unresolved": [],
                "followups": [],
                "trace": {
                    "visible": {"channels": [], "segments_reviewed": 0, "evidence_segments": 0},
                    "debug": None,
                },
                "errors": [
                    {
                        "code": code if re.fullmatch(r"[a-z_]+", code) else "analysis_failed",
                        "stage": "query",
                        "message": "查找未完成",
                        "cause": "unknown",
                        "retryable": False,
                        "suggested_action": "检查素材就绪状态、模型配置和剩余预算。",
                        "docs_url": "/docs/errors",
                        "request_id": body.request_id,
                    }
                ],
            }
        finally:
            agent.slots.release()
        # Reset/delete/expiry while the request ran must suppress late results.
        current = ws.owned("investigations", desk["id"], owner)
        if json.loads(current["state"]).get("epoch", 0) != generation:
            raise HTTPException(409, "stale_chat_generation")
        result = {
            "id": body.request_id,
            "question": body.question,
            "response": answer,
            "mode": "real",
            "video_id": desk["video"],
            "usedContext": bool(context),
        }
        with ws.db() as c:
            c.execute("BEGIN IMMEDIATE")
            previous = c.execute(
                "SELECT state,result,http FROM queries WHERE id=? AND owner=?",
                (body.request_id, owner),
            ).fetchone()
            if previous and previous["state"] == "done":
                return JSONResponse(json.loads(previous["result"]), status_code=previous["http"])
            c.execute(
                "UPDATE queries SET state='done',result=?,http=?,updated=? WHERE id=? AND owner=?",
                (
                    json.dumps(result, ensure_ascii=False),
                    status,
                    time.time(),
                    body.request_id,
                    owner,
                ),
            )
        return JSONResponse(result, status_code=status)

    app.include_router(router)
    return ws
