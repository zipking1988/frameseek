"""D1 local development shell. Video/chat/media endpoints land with their workers."""

from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles

from frameseek import __version__
from frameseek.config import Settings, load_settings
from frameseek.demo import catalog
from frameseek.preflight import report
from frameseek.schema import Answer, QueryControl


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings if settings is not None else load_settings()
    if settings.mode != "fixture":
        raise RuntimeError("Real mode is blocked; run make preflight to see unmet prerequisites")
    app = FastAPI(title="FrameSeek — local fixture demo", version=__version__)
    static = Path(__file__).parent / "static"
    app.mount("/static", StaticFiles(directory=static), name="static")
    # Only original public synthetic frames; no private user media is exposed here.
    app.mount(
        "/media/demo_parcel/frames",
        StaticFiles(directory=static / "demo" / "frames"),
        name="demo-frames",
    )

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
        return report(settings)

    @app.get("/docs/errors", response_class=PlainTextResponse, include_in_schema=False)
    def errors():
        return (
            "invalid_config: correct the named configuration boundary; no supplied values logged.\n"
            "real_blocked: run read-only preflight; confirm budget and finish model setup.\n"
            "unknown: do not resend a paid attempt automatically.\n"
            "D1 only: query/media/job HTTP error handling is not yet implemented.\n"
        )

    # Publish both contracts without inventing an unimplemented /api/chat operation.
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
