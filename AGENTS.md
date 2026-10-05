# Working on FrameSeek

## Product and scope

FrameSeek is a desktop video investigation agent. Its central workspace is a spatial canvas of questions, evidence frames and conclusions, with multi-turn context and a source player. Preserve this product direction; a mobile application is outside the current scope.

The default `fixture` mode uses explicitly labeled synthetic demo answers and sends no model requests. Upload, media preflight, private playback and durable investigation storage work locally. NVIDIA/Nebius agent integration is covered by mock transports; live model quality, paid resource calibration and production deployment are still unverified.

## Read before changing behavior

- [README.md](README.md): setup, workflow and repository map.
- [ARCHITECTURE.md](ARCHITECTURE.md): technical requirements and evidence/budget contracts. Implementation status does not waive requirements.
- [docs/WORKSPACE_RUNTIME.md](docs/WORKSPACE_RUNTIME.md): current implementation and live-runtime prerequisites.
- [DESIGN.md](DESIGN.md): selected desktop canvas direction and design history; use the current-status note when older entries differ.
- [docs/api.md](docs/api.md), [docs/configuration.md](docs/configuration.md), and [docs/errors.md](docs/errors.md): public interfaces and configuration.
- [TODOS.md](TODOS.md) and [docs/autoplan/IMPLEMENTATION_TASKS.md](docs/autoplan/IMPLEMENTATION_TASKS.md): remaining acceptance work.

## Source map

| Location | Responsibility |
| --- | --- |
| `src/frameseek/api.py`, `routes.py` | FastAPI app, owned HTTP operations, workers and media delivery |
| `workspace.py` | SQLite investigations, ownership, revisions, generation and expiry |
| `agent.py`, `attempts.py` | Model adapters, retrieval/evidence pipeline and approved-budget reservations |
| `evaluation.py`, `readiness.py` | Offline artifact scoring and readonly local dispatch prerequisites |
| `media.py`, `media_limits.py`, `windows.py` | Isolated decoding, real timestamps, bounded sampling and window planning |
| `schema.py`, `config.py`, `preflight.py` | Output contracts, finite settings and readiness reporting |
| `frontend/workbench.jsx` | Authored React workbench components |
| `src/frameseek/static/app.js`, `workspace.js` | Player/session UI and durable client orchestration |
| `static/workbench-model.js`, `static/investigation-canvas.js` | Shared UI state and canvas geometry/navigation |
| `scripts/build_frontend.mjs` | React bundle and static asset content hashes |
| `tests/` | Pytest integration/contracts and Node frontend regressions |

Paths beginning with `static/` above are relative to `src/frameseek/`. Historical `docs/*/source-before/` files and patches are review evidence, not production source.

## Development commands

Use Python 3.13 and the committed `uv.lock`. Node.js 20+ is needed for frontend development, not for serving the committed build. FFmpeg/ffprobe are needed for uploaded-media preflight and real evidence extraction.

```sh
make setup
make preflight
make run                    # http://127.0.0.1:8765; one API/worker process
make test                   # backend; isolated fixtures/mock transports
make check                  # Ruff lint/format and schema drift
make eval-check             # offline unrun templates; NOT_ACCEPTED expected
make agent-check            # readonly prerequisites; no calls or approvals
npm ci --ignore-scripts
npm test                    # all frontend regressions
npm run build               # bundle and static content hashes
```

After editing authored frontend JS, JSX or CSS, run `npm run build` and include the resulting `static/index.html` hashes and generated bundle/license changes if any. Do not manually edit `static/workbench.js`; edit its JSX source. Preserve third-party licenses. After changing output models, run `make schema` and review the generated schema changes.

Run relevant existing tests for behavioral changes. Add focused regressions for actual failure modes, especially asynchronous ownership, worker lifecycle, budget accounting and evidence validation. Documentation-only edits need link/command/whitespace checks rather than new tests. Keep verification claims specific: mocks establish integration behavior, not live model quality or GPU cost/performance.

## Invariants to preserve

- **Evidence:** keep schema version 0.1 and the four final statuses (`ok`, `partial`, `no_result`, `error`). Query-control pending/unknown envelopes are separate. References use actual decoded frames and absolute source-video timestamps. Validate model output before accepting evidence; preserve verified partial results when later stages fail. Never substitute demo answers for real sources or infer unverified identities.
- **Ownership:** session cookie, CSRF/Origin checks and owner/expiry checks protect every private source, frame, job, query and investigation. Keep SQLite revision CAS, video generations and request idempotency. Validate stale context anchors; cancellation/deletion must prevent late publication and release worker capacity.
- **Async UI:** check investigation identity and navigation epoch after awaits. Capture context when submitting a question. Preserve drafts typed during a query and drain old-desk edits before navigation restores another desk. Do not let continuously advancing playback keep save draining indefinitely.
- **Paid calls:** all model dispatch goes through the approved-budget ledger. Owner and deployment reservations are atomic; unknown/dispatched attempts are not automatically resent or refunded. Completed cached ingest work is not charged again at admission, but zero-new-call resumes still require active approvals. Keep configuration/checkpoints/frame names generation-specific.
- **Media/resources:** retain upload/storage/decoder/time/window/sampling bounds and process isolation. Use one API/worker process per workspace; do not introduce multiple Uvicorn workers against it. Mac isolation is locally verified; Linux/deployed isolation needs separate proof.
- **Providers:** retain the approved NVIDIA/Nebius architecture. Media goes only to explicitly configured self-hosted hosts; Nebius Token Factory receives text. Do not enable live requests, install spending approvals, provision GPUs or raise budgets without explicit authorization covering finite numeric spending and calibration prerequisites. A private code push does not provide that authorization.

## Repository hygiene and delivery

Keep `.frameseek-data/`, `.frameseek-eval/`, uploaded private media, session databases, `.env`, private runtime/approval records, caches, `.venv/` and `node_modules/` out of Git. `.env.example` and `docs/runtime.example.json` are templates, not operational approvals; `.env` is not automatically loaded.

Inspect `git status` before edits and preserve unrelated work. Follow the user's authorized commit/push scope, keep the repository private, and never force-push or publish it without an explicit request. Update current docs when behavior changes, distinguish design history from current behavior, and report what passed plus material verification limits. Do not label the project a complete MVP or GO while live acceptance requirements remain open.
