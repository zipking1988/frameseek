"""FrameSeek: fixture workspace plus owned media and explicitly gated real agents."""

import asyncio
import os
from contextlib import asynccontextmanager, suppress
from pathlib import Path
from urllib.parse import urlparse

from fastapi import FastAPI
from fastapi.responses import FileResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.trustedhost import TrustedHostMiddleware

from frameseek import __version__
from frameseek.agent import load_runtime
from frameseek.config import Settings, load_settings
from frameseek.demo import catalog
from frameseek.preflight import report
from frameseek.routes import register
from frameseek.schema import Answer, QueryControl


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings if settings is not None else load_settings()
    runtime = load_runtime()
    if settings.mode != "fixture" and (runtime is None or runtime.blockers()):
        raise RuntimeError("Real mode is blocked; run make preflight to see unmet prerequisites")

    @asynccontextmanager
    async def lifespan(app):
        async def cleanup_loop():
            while True:
                await asyncio.sleep(60)
                try:
                    await asyncio.to_thread(app.state.workspace.cleanup)
                except OSError:
                    app.state.cleanup_failed = True

        await asyncio.to_thread(app.state.workspace.cleanup)
        cleanup = asyncio.create_task(cleanup_loop())
        yield
        cleanup.cancel()
        with suppress(asyncio.CancelledError):
            await cleanup

    app = FastAPI(
        lifespan=lifespan, title="FrameSeek — investigation workspace", version=__version__
    )
    hosts = ["127.0.0.1", "localhost", "[::1]", "test", "testserver"]
    public_origin = os.environ.get("FS_PUBLIC_ORIGIN")
    if public_origin:
        parsed = urlparse(public_origin)
        if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password:
            raise RuntimeError("Public deployment requires an explicit HTTPS origin")
        hosts.append(parsed.hostname)
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=hosts)
    static = Path(__file__).parent / "static"
    app.mount("/static", StaticFiles(directory=static), name="static")
    # Only original public synthetic frames; no private user media is exposed here.
    app.mount(
        "/media/demo_parcel/frames",
        StaticFiles(directory=static / "demo" / "frames"),
        name="demo-frames",
    )

    register(app, settings, Path(os.environ.get("FS_DATA_DIR", ".frameseek-data")), runtime)

    @app.get("/", include_in_schema=False)
    def index():
        return FileResponse(static / "index.html")

    @app.get("/demo/catalog")
    def demo_catalog():
        return catalog()

    @app.get("/demo/video")
    def demo_video():
        return FileResponse(static / "demo" / "parcel.mp4", media_type="video/mp4")

    @app.get("/health")
    def health():
        result = report(settings)
        result["workspace"] = {
            "persistent": True,
            "ttl_hours": settings.ttl_hours,
            "private_media": True,
            "cleanup_failed": getattr(app.state, "cleanup_failed", False),
        }
        with app.state.agent.ledger._connect() as c:
            result["model_requests_sent"] = c.execute(
                "SELECT count(*) FROM attempts WHERE "
                "state IN ('dispatched','completed','unknown') AND kind!='allocation'"
            ).fetchone()[0]
        return result

    @app.get("/docs/errors", response_class=PlainTextResponse, include_in_schema=False)
    def errors():
        return (
            "invalid_config: correct the named configuration boundary; no supplied values logged.\n"
            "real_blocked: run read-only preflight; confirm budget and finish model setup.\n"
            "unknown: do not resend a paid attempt automatically.\n"
            "csrf_rejected/origin_rejected: reload the local session; "
            "cross-origin writes rejected.\n"
            "revision_conflict: another tab changed this investigation; reload before saving.\n"
            "upload_limit/storage_limit: remove an old source or choose a smaller video.\n"
            "invalid_media/media_timeout/media_isolation_unavailable: "
            "reselect or re-encode media.\n"
            "video_not_ready/real_blocked: complete model configuration and approved budget.\n"
            "stale_chat_generation/invalid_context_anchor: "
            "select a current verified question.\n"
            "expired_or_deleted: media and linked investigations are no longer available.\n"
        )

    # Preserve frozen answer/control contracts alongside the implemented operations.
    original_openapi = app.openapi

    def openapi():
        document = original_openapi()
        schemas = document.setdefault("components", {}).setdefault("schemas", {})
        for model in (Answer, QueryControl):
            schema = model.model_json_schema(ref_template="#/components/schemas/{model}")
            schemas.update(schema.pop("$defs", {}))
            schemas[model.__name__] = schema
        return document

    app.openapi = openapi
    return app
