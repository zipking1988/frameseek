"""The full page/API engine uses annotated synthetic evidence, never model calls."""

import asyncio
import shutil
import subprocess

import httpx
import pytest

from frameseek.api import create_app
from frameseek.config import Settings
from frameseek.media import frames, probe
from frameseek.occurrences import checkpoint, plan_source, save_index


@pytest.fixture
def anyio_backend():
    return "asyncio"


async def setup_index_page(tmp_path, monkeypatch, event_fixture=False):
    monkeypatch.setenv("FS_DATA_DIR", str(tmp_path / "workspace"))
    for key in (
        "FS_SHARED_LEDGER_SSH",
        "FS_SHARED_LEDGER_LOCAL_OWNER",
        "FS_PUBLIC_ORIGIN",
        "FS_RUNTIME_FILE",
        "FS_VISUAL_SEARCH",
    ):
        monkeypatch.delenv(key, raising=False)
    # No runtime, provider, keys or mock model transport is installed.
    app = create_app(Settings(mode="fixture"))
    client = httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test")
    session = (await client.get("/api/session")).json()
    client.headers["x-fs-csrf"] = session["csrf"]
    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        pytest.skip("FFmpeg required")
    clip = tmp_path / "source.mp4"
    subprocess.run(
        [
            ffmpeg,
            "-v",
            "error",
            "-f",
            "lavfi",
            "-i",
            "testsrc2=size=128x72:rate=2",
            "-t",
            "12",
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            str(clip),
        ],
        check=True,
        timeout=20,
    )
    upload = await client.post(
        "/api/videos", content=clip.read_bytes(), headers={"content-type": "video/mp4"}
    )
    video = upload.json()["id"]
    for _ in range(100):
        state = (await client.get(f"/api/videos/{video}")).json()
        if state["job"]["state"] not in ("queued", "probing"):
            break
        await asyncio.sleep(0.02)
    ws = app.state.workspace
    source = ws.owned("videos", video, session["owner_id"])
    directory = ws.root / video
    metadata = probe(directory)
    index = plan_source(
        directory, video, source["generation"], metadata, "SYNTHETIC MANUAL ANNOTATIONS / NO MODEL"
    )
    # Decode every real2FPS frame in one-second bounded windows. Hand-authored
    # annotations exercise retrieval semantics only, not recognition accuracy.
    catalog = index.model_dump()
    for i, frame in enumerate(catalog["frames"]):
        decoded = frames(
            directory, video, metadata, {"start": frame["t"], "end": frame["end"]}, 1, f"qa{i}"
        )[0]
        assert decoded["t"] == frame["t"]
        frame.update({k: decoded[k] for k in ("file", "frame_id", "uri")})
    from frameseek.occurrences import ObservationIndex

    if event_fixture:
        catalog["event_aliases"] = {"搬运": "lift", "开门": "door_open"}
        catalog["event_rules"] = [
            {
                "kind": "door_open",
                "before": [
                    {"field": "kind", "value": "door"},
                    {"field": "state", "value": "closed"},
                ],
                "after": [{"field": "kind", "value": "door"}, {"field": "state", "value": "open"}],
            }
        ]
    index = ObservationIndex.model_validate(catalog)
    annotations = []
    for i, frame in enumerate(index.frames):
        positive = i < 4 or 8 <= i < 12 or i >= 20
        facts = {
            "kind": ["person"],
            "color": ["white" if positive else "blue"],
            "garment": ["jersey"],
        }
        annotations.append(
            {
                "frame_id": frame.frame_id,
                "inventory_complete": True,
                "subjects": [{"id": "frame_local", "facts": facts}],
            }
        )
    if event_fixture:
        for i, row in enumerate(annotations):
            row["event_inventory_complete"] = True
            row["subjects"] = [
                {
                    "id": "door",
                    "track_id": "door-track",
                    "entity_id": "door-entity",
                    "facts": {
                        "kind": ["door"],
                        "state": ["open" if i in (4, 5, 6, 16, 17, 18) else "closed"],
                    },
                }
            ]
            if i in (0, 1, 8, 9, 20, 21):
                row["subjects"].append(
                    {
                        "id": "parcel",
                        "track_id": "track-one",
                        "entity_id": "entity-one",
                        "facts": {"kind": ["parcel"], "event": ["lift"]},
                        "event_keys": {"lift": "first" if i < 10 else "second"},
                    }
                )
    for offset in range(0, len(annotations), 8):
        index = checkpoint(index, annotations[offset : offset + 8], index.snapshot())
    save_index(directory / f"observations-g{source['generation']}.json", index)
    with ws.db() as c:
        c.execute("UPDATE jobs SET state='ready' WHERE video=?", (video,))
    desk = (
        await client.post(
            "/api/investigations", json={"video_id": video, "title": "离线全片索引验收 · 合成标注"}
        )
    ).json()
    return app, client, video, desk, session, index


@pytest.mark.anyio
async def test_owned_semantic_occurrences_and_durable_zero_model_chat(tmp_path, monkeypatch):
    app, client, video, desk, session, index = await setup_index_page(tmp_path, monkeypatch)
    try:
        with app.state.agent.ledger._connect() as c:
            calls_before = c.execute("SELECT count(*) FROM attempts").fetchone()[0]
        for question in (
            "找出穿白色球衣的人，列出所有出现时间",
            "find people wearing white jersey, list all times",
        ):
            first = await client.post(
                f"/api/videos/{video}/occurrences/search",
                json={"question": question, "generation": 1, "limit": 1},
            )
            assert first.status_code == 200, first.text
            page = first.json()
            assert page["total_occurrences"] == 3
            assert page["occurrences"][0]["start"] == 0 and page["occurrences"][0]["end"] == 2
            assert page["coverage"]["exhaustive_under_index"]
            next_page = (
                await client.post(
                    f"/api/videos/{video}/occurrences/search",
                    json={
                        "question": question,
                        "generation": 1,
                        "offset": 1,
                        "limit": 2,
                        "snapshot": page["snapshot"],
                    },
                )
            ).json()
            assert [(h["start"], h["end"]) for h in next_page["occurrences"]] == [(4, 6), (10, 12)]
            for hit in next_page["occurrences"]:
                assert (await client.get(hit["evidence"][0]["uri"])).status_code == 200
        body = {
            "engine": "index",
            "investigation_id": desk["id"],
            "request_id": "offline_index_1",
            "generation": 0,
            "question": "找出穿白色球衣的人，列出所有出现时间",
        }
        assert (await client.post("/api/index-chat/prepare", json=body)).json()["kind"] == "ready"
        sent = await client.post("/api/index-chat", json=body)
        assert sent.status_code == 200, sent.text
        result = sent.json()
        assert result["response"]["status"] == "partial" and len(result["response"]["events"]) == 3
        assert result["engine"] == "index" and result["index_search"]["model_requests_sent"] == 0
        assert (await client.post("/api/index-chat", json=body)).json() == result
        conflict = await client.post("/api/index-chat", json=body | {"question": "blue jersey"})
        assert conflict.status_code == 409
        follow = await client.post(
            "/api/index-chat",
            json=body
            | {
                "request_id": "offline_follow",
                "question": "同样条件",
                "parent_request_id": body["request_id"],
            },
        )
        assert follow.status_code == 200 and follow.json()["usedContext"]
        assert len(follow.json()["response"]["events"]) == 3
        restored = (await client.get(f"/api/investigations/{desk['id']}/requests")).json()
        assert len(restored["items"]) == 2
        with app.state.agent.ledger._connect() as c:
            assert c.execute("SELECT count(*) FROM attempts").fetchone()[0] == calls_before == 0
        bad = await client.post(
            f"/api/videos/{video}/occurrences/search",
            json={"question": "white jersey jumping", "generation": 1},
        )
        assert bad.json()["kind"] == "clarification_required"
        assert (
            await client.post(
                f"/api/videos/{video}/occurrences/search",
                json={"question": "white jersey", "generation": 99},
            )
        ).status_code == 409
        assert (
            await client.post("/api/index-chat", json=body, headers={"x-fs-csrf": "bad"})
        ).status_code == 403
        async with httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app), base_url="http://test"
        ) as other:
            s = (await other.get("/api/session")).json()
            other.headers["x-fs-csrf"] = s["csrf"]
            assert (await other.post("/api/index-chat", json=body)).status_code == 404
    finally:
        await client.aclose()


def test_data_driven_arbitrary_semantic_alias_and_same_subject_binding():
    from test_occurrences import catalog, checkpoint, observation

    from frameseek.occurrences import ObservationIndex, search_occurrences
    from frameseek.semantic_search import resolve_conditions

    index = catalog(1)
    index = checkpoint(
        index,
        [observation(0, subjects=[{"id": "statue", "facts": {"材质": ["铜"], "类别": ["雕塑"]}}])],
        index.snapshot(),
    )
    data = index.model_dump()
    data["query_aliases"] = {
        "metal sculpture": [{"field": "材质", "value": "铜"}, {"field": "类别", "value": "雕塑"}],
        "铜像": [{"field": "材质", "value": "铜"}, {"field": "类别", "value": "雕塑"}],
    }
    index = ObservationIndex.model_validate(data)
    for question in ("find all metal sculpture", "找出铜像，列出所有出现时间"):
        conditions, problems = resolve_conditions(index, question)
        assert not problems and len(conditions) == 2
        assert search_occurrences(index, conditions)["total_occurrences"] == 1


@pytest.mark.anyio
async def test_event_count_ranking_replay_evidence_and_recovery_without_models(
    tmp_path, monkeypatch
):
    app, client, video, desk, session, index = await setup_index_page(
        tmp_path, monkeypatch, event_fixture=True
    )
    body = {
        "engine": "index",
        "investigation_id": desk["id"],
        "request_id": "event-count",
        "generation": 0,
        "question": "搬运多少次？",
    }
    try:
        assert (await client.post("/api/index-chat/prepare", json=body)).json()["kind"] == "ready"
        response = await client.post("/api/index-chat", json=body)
        assert response.status_code == 200, response.text
        result = response.json()
        assert result["index_search"]["aggregation"]["unique_events"] == 2
        assert result["index_search"]["aggregation"]["repeated_clips"] == 1
        assert "归并为2组事件" in result["response"]["answer"]
        assert len(result["response"]["events"]) == 3
        for event in result["response"]["events"]:
            for frame in event["evidence"]:
                assert (await client.get(frame["uri"])).status_code == 200
        assert (await client.post("/api/index-chat", json=body)).json() == result
        ranked = (
            await client.post(
                "/api/index-chat",
                json=body | {"request_id": "event-ranking", "question": "谁搬运最多？"},
            )
        ).json()
        assert ranked["index_search"]["aggregation"]["ranking_complete"]
        assert "entity-one：2组" in ranked["response"]["answer"]
        transitioned = (
            await client.post(
                "/api/index-chat",
                json=body | {"request_id": "state-transitions", "question": "开门多少次？"},
            )
        ).json()
        assert transitioned["index_search"]["aggregation"]["unique_events"] == 2
        assert transitioned["index_search"]["aggregation"]["exact_under_index"]
        restored = (await client.get(f"/api/investigations/{desk['id']}/requests")).json()
        assert len(restored["items"]) == 3
        assert (
            await client.post(
                "/api/index-chat",
                json=body | {"request_id": "unauthorized"},
                headers={"x-fs-csrf": "wrong"},
            )
        ).status_code == 403
        with app.state.agent.ledger._connect() as c:
            assert c.execute("SELECT count(*) FROM attempts").fetchone()[0] == 0
    finally:
        await client.aclose()
