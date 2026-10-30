# FrameSeek

2026-10-29: the home page (`/`) now introduces the sports video workflow, with
basketball-first illustrative imagery. **Explore the preview** opens the in-page basketball example; **Open workspace** leads to `/workspace`,
which retains the existing desktop investigation, saved sources and ownership
checks. The marketing preview is explicitly illustrative and makes no model
requests; the workspace still starts with the labeled synthetic demo. The
landing page and reviewed workspace release are deployed to framefix.net.

2026-10-24: 用户授权新增 `provider=tokenfactory` 与 `allow_tokenfactory_media`，仅向固定 Token Factory API 发送本机抽帧 JPEG。使用 Nemotron 3.5 Super VL 公共 API 和 Qwen3 Embedding 8B 文本检索；不租 GPU、不自动启用付费请求。配置、预算待确认项与篮球测试见 [Token Factory 本地准备](docs/TOKEN_FACTORY_LOCAL.md)。原自托管及 Gemini 路线保持独立。

2026-10-24 live smoke: Token Factory indexed the basketball source and produced two visually checked evidence answers, including a contextual follow-up. The USD1/30-call test stopped after 21 attempts; following the user’s reconciliation request, the same caps resumed with nine attempts remaining. Sparse sampling and one rejected planner response limit this result; see [test record](docs/TOKEN_FACTORY_LOCAL.md#final-smoke-result-2026-10-24).

A desktop video investigation workspace: ask questions, follow up on earlier answers, and arrange verified frames and conclusions on a spatial canvas.

FrameSeek connects conversation to its source video. Questions form investigation paths; evidence can be pinned, compared side by side, played at its original timestamp and exported with notes.

![FrameSeek investigation canvas](docs/local-tools-20261005/canvas.png)

## Current status

2026-10-29 reusable-index refactor: an experimental opt-in local route builds a
sampled VideoKnowledge index after upload and reuses it for evidence-backed
questions and bounded local follow-up checks. A separate local browser test
indexed the complete basketball source and checked original-time evidence;
the default runtime and hosted service have not switched to this route. The
new Token Factory base-index adapter is connected to the job runner behind
explicit trusted configuration and is mock-tested. Its live calibration and
the 20-case human-reviewed quality gate remain open; it is disabled on the
deployed service. See [the real and synthetic test record](docs/qa/KNOWLEDGE_REFACTOR_20261029.md).

2026-10-28 event evaluation: offline event/replay scoring and reviewed-score delta
proposals are available as separate evaluation tools. They do not turn citations
into confirmed counts or claim a trained model. See [training readiness and actual
seed-case limits](docs/EVENT_TRAINING_READINESS.md).

2026-10-25 cloud integration: the optional Token Factory sampled compiler reuses
the on-device engine's scene/selection/verification logic through the existing
approved ledger. It exposes owned cloud-chat prepare/async routes and a cloud
engine option. This does not authorize new calls or establish live cloud model
quality; exhausted approvals remain blocked. See [cloud runtime](docs/CLOUD_VISION.md).

2026-10-25 actual local page: optional free on-device recognition compiled the
basketball source into49 windows/385 sampled frames. Question-specific pixel
checks repair caption omissions, and all accepted references use original source
times. White-jersey search, a blue-jersey/yellow-headband conjunction, bounded
negative lookup and player seeking have actual source-page evidence. This is not
exhaustive original-frame recall, entity tracking or exact event-count acceptance.
The old12-turn eviction was removed; original chats were restored and history
now uses owned query references within the existing bounded storage contract.
See [actual results and incident recovery](docs/qa/LOCAL_VISION_20261025.md).

2026-10-25 local runtime: an opt-in **本机视觉 · 免费** route can compile
sampled visual observations with independently installed on-device MLX weights,
then answer with original-time frame references. It has no paid API fallback and
does not modify Token Factory approvals. Setup and accuracy limits are documented
in [local vision](docs/LOCAL_VISION.md). This is a local Mac capability, not a
deployment or exhaustive-recognition acceptance claim.

2026-10-25 local page: **索引问答 · 不调用模型** now appends durable index
answers and opens an interactive occurrence timeline with conditions, coverage,
evidence and complete output pagination. It reads structured source indexes when
available; legacy caption results remain unverified. Bilingual concept alignment
and source-defined arbitrary aliases require no model dispatch. Actual basketball
still lacks full-source object observations; zero-model retrieval cannot fill that
gap. See [page acceptance and limits](docs/qa/FULL_VIDEO_INDEX_OFFLINE_20261025.md#page-integration-supersedes-the-offline-only-boundary--2026-10-25).

2026-10-25 core search: **查找已有画面 · 不调用模型** searches the owned
frame-level caption index and opens candidate images/timestamps without spending
model allowance. Optional trusted Token Factory visual search verifies up to8
saved candidates with one vision request, retaining the original budget ledger.
Same-subject criteria and frame-local evidence are validated; sparse-index recall,
live recognition quality and exhaustive counts are not accepted. See
[core scope](docs/VIDEO_CTRL_F_ENGINE.md) and [QA evidence](docs/qa/CTRL_F_20261025.md).

2026-10-25: [code review and dev delivery](docs/CODE_REVIEW_20261025.md) fixes six
admission/UI issues; 239 backend and 130 frontend tests pass. The private local
runtime shares the existing cumulative $20 / 40-call ledger: 40 calls used, none
remaining. The historical smoke results below do not describe a fresh budget.
The reviewed fixes and optional single-call Token Factory path are now deployed
to framefix.net; see the latest deployment record for preservation checks.

2026-10-24: [framefix.net](https://framefix.net) is running on one Nebius CPU VM.
The basketball source, index and original remaining Token Factory budget were
migrated for the user's private browser test. One online vision request succeeded
after transient upstream 503 responses. See [live deployment and budget status](docs/NEBIUS_LIVE_STATUS.md).
Gift-credit expiry and no-card billing protection still await support confirmation.

The local workspace supports multiple uploaded sources, media preflight, private playback, persistent investigations and the desktop canvas. NVIDIA/Nebius ingestion and multi-turn query adapters are implemented and tested with mock transports.

The **AI Builder Cup edition** adds a selectable native Gemini adapter and a stateless Google Cloud ingress with a separate durable workspace backend. Both model routes use the same ownership, evidence and approved-budget contracts. Implementation is locally tested with mocked Gemini responses; no live Gemini calls or GCP resources have been started. See [AI Builder Cup setup and demo plan](docs/AI_BUILDER_CUP.md) and [Google Cloud deployment preparation](docs/deployment.md).

**The default is `fixture`: no model requests and no GPU provisioning.** Demo answers are preset and visibly labeled. Uploaded sources can be checked and played in this mode; they cannot receive demo answers. Live model/revision permissions, approved numeric budgets, resource cutoff calibration, quality and performance acceptance remain pending. This is not complete-MVP or production-readiness acceptance.

## Quick start

Requirements: Python 3.13, [uv](https://docs.astral.sh/uv/), and `make`. Uploaded-video preflight requires FFmpeg and ffprobe on `PATH`. The bundled synthetic demo does not require them. Local macOS execution is verified; Linux media isolation still needs deployment validation.

```sh
git clone https://github.com/zipking1988/frameseek.git
cd frameseek
make setup
make preflight
make run
```

The [FrameSeek repository](https://github.com/zipking1988/frameseek) is public. A separate [hackathon source repository](https://github.com/zipking1988/frameseek-hackathon) contains the deployed application code without the operational history. Open [localhost:8765](http://127.0.0.1:8765/). `make demo` starts the same server as `make run`. Stop it with Ctrl+C. Use one API/worker process per storage directory.

Useful local endpoints:

| Endpoint | Purpose |
| --- | --- |
| `/` | Sports video landing page |
| `/workspace` | Investigation workspace |
| `/health` | Effective settings, local tools, readiness blockers and recorded model calls |
| `/docs` | Interactive API reference |
| `/openapi.json` | Implemented operations and answer/control schemas |
| `/docs/errors` | Error guidance |

## Try the workspace

1. Open **演示库** (demo library) and choose an investigation path. The demo uses an 18-second synthetic video made from three static scenes, not a real continuous parcel movement.
2. Select a question card and follow a suggested question, or start another supported demo question. Each card retains its own context and evidence.
3. Click a time range or evidence frame to seek the original video. Pin evidence or a conclusion, compare two frames, and add notes.
4. Rename, arrange, fold or move investigation paths. Shift-click selects multiple cards for batch movement, named groups and alignment. Undo/redo restores layout operations; search locates questions, evidence and groups. Use the minimap, **聚焦选中** (focus selected), and **适应视图** (fit canvas).
5. Export a captured investigation report from **发现 → 导出调查记录** as Markdown, JSON or HTML with optional offline evidence images. See [canvas and report controls](docs/CANVAS_AND_REPORTS.md).
6. Use **调查库** (investigations) to create or restore work. Use **素材库** (sources) to upload, rename, inspect or delete videos.

Each investigation stores up to100 questions without silent eviction, up to 8 findings, notes, layout, path metadata, viewport, draft and player position in local SQLite. Default retention is 24 hours. Ownership follows the browser's session cookie; clearing it does not transfer access to an old investigation. There is no account-based cross-device sync.

Uploads are limited to 500 MiB per file, 10 sources/1 GiB per owner and 4 GiB across the service. Preflight checks duration, dimensions, audio and scene/window boundaries, then decodes timestamped previews. Failed or cancelled preflight can be explicitly retried. Uploaded-source analysis requires an explicitly configured route. Paid model routes
also require approved budgets; the opt-in on-device route uses locally installed
weights without paid API calls.

The product currently targets desktop browsers. A phone UI is outside this version's scope.

## Development and verification

Node.js 20+ is needed only when developing the frontend; the server serves committed local build artifacts without a CDN or Node runtime.

```sh
make test          # backend contracts, ownership, media, persistence and mocked agents
make check         # Ruff lint/format and generated-contract drift
make eval-fixture  # four synthetic output-contract examples; not a model evaluation
make eval-check    # offline diagnostic templates; deliberately NOT_ACCEPTED
make agent-check   # read-only local prerequisites; exit 2 until configured/approved

npm ci --ignore-scripts
npm test           # frontend state, canvas and asynchronous persistence regressions
npm run build      # React bundle and static asset content hashes
```

Edit `frontend/workbench.jsx` for React components. Authored player, canvas and persistence code lives in `src/frameseek/static/`. Rebuild after changing JSX, JS or CSS; commit the generated bundle and updated `index.html` asset hashes. Do not edit the compiled `workbench.js` directly. Output-model changes require `make schema` followed by `make check`.

The initial import review verified **109 backend and 71 frontend tests**; see [its findings and coverage limits](docs/CODE_REVIEW_20261004.md). Current tooling verification is recorded in [the local-tools review](docs/LOCAL_TOOLS_REVIEW_20261005.md). These checks use isolated fixtures/mock transports and do not establish live model quality, GPU cost or hour-long performance.

## Architecture

```text
Desktop canvas + React workbench
              │ owned HTTP operations
              ▼
FastAPI ─── SQLite investigations / jobs / queries
   │
   ├── isolated FFmpeg preflight / timestamped media
   └── approved attempt ledger
              │
              ▼
coarse vision → embeddings / optional ASR → published index
              │
              ▼
BM25 + vector retrieval → rerank → bounded visual review → answer + evidence
```

| Location | Responsibility |
| --- | --- |
| `src/frameseek/api.py`, `routes.py`, `workspace.py` | App, owned APIs, workers and durable storage |
| `src/frameseek/agent.py`, `attempts.py` | NVIDIA/Nebius adapters, retrieval and budget reservations |
| `src/frameseek/gemini.py`, `gateway.py`, `server.py` | Native Gemini wire format, stateless Google Cloud ingress and guarded container startup |
| `src/frameseek/media*.py`, `windows.py` | Media isolation, sampling and window planning |
| `src/frameseek/schema.py`, `config.py`, `preflight.py`, `readiness.py` | Output contracts, settings, deployment blockers and local dispatch prerequisites |
| `src/frameseek/evaluation.py`, `eval/` | Offline versioned evaluation and unrun diagnostic templates |
| `frontend/workbench.jsx` | React workbench components |
| `src/frameseek/static/` | Authored browser modules, styles and committed build |
| `tests/` | Python and Node regression suites |
| `docs/` | Contracts, implementation plans and verification evidence |

Private media is served through owner/expiry checks. Writes require CSRF and same-origin checks. Revision CAS prevents silent cross-tab overwrites; generations and idempotent requests protect against late results. Unknown paid attempts are retained and do not automatically resend.

## Configuration and live models

Settings precedence is environment variables → `[frameseek]` TOML → defaults. `FRAMESEEK_CONFIG` selects the TOML file; `.env.example` documents variables, but the application does **not** automatically load `.env`.

```sh
FRAMESEEK_COARSE_FRAMES=8 make preflight
FRAMESEEK_CONFIG=/absolute/path/config.toml make preflight
```

`FS_DATA_DIR` selects private storage (default `.frameseek-data/`). `FS_RUNTIME_FILE` selects a trusted runtime configuration. Keep credentials and operational runtime/approval records outside Git. See [configuration](docs/configuration.md) and the [live runtime guide](docs/WORKSPACE_RUNTIME.md).

Live mode needs verified NVIDIA/self-hosted media endpoints, Nebius text configuration, fixed model revisions, calibrated conservative costs, supplier-side resource cutoff evidence and explicitly approved owner/deployment budgets. `docs/runtime.example.json` is an intentionally blocked template; its placeholder values are neither prices nor approvals. Changing `FRAMESEEK_MODE`, ordinary settings or browser requests cannot authorize spending.

For the Gemini route, choose `provider: "gemini"` in a private runtime based on `docs/runtime.gemini.example.json`; the template also remains blocked. This route sends locally sampled JPEGs to Google's Gemini API only when `allow_google_media` is explicitly enabled. It requires backend-only `GEMINI_API_KEY`, verified models/revisions/cost bounds and the same two-level approved budgets. It currently provides visual investigation, without audio transcription. Omitting `provider` retains the original NVIDIA/Nebius route. Changing providers requires rebuilding the source index; there is no automatic cross-provider fallback.

```sh
FRAMESEEK_MODE=real make preflight
```

The `preflight` CLI currently always exits with code 2 in real mode and reports outstanding deployment acceptance blockers; it is not a dynamic readiness gate for a configured deployment. The app refuses unconfigured real mode rather than falling back to demo answers. FrameSeek does not provision or release GPU instances. Use **模型与预算**, owned `GET /api/runtime/status`, or `make agent-check` for dynamic local prerequisites. The readiness command accepts `--owner EXISTING_OWNER_ID` to inspect existing owner/deployment approvals; it creates no records or model requests. Passing it does not verify live quality, billing cutoff or deployment. Follow the [runtime guide](docs/WORKSPACE_RUNTIME.md) before any paid execution or deployment.

## Project documentation

- [AGENTS.md](AGENTS.md): coding-agent guidance, commands and invariants.
- [ARCHITECTURE.md](ARCHITECTURE.md): authoritative technical requirements.
- [Product scope](profile.md) and [interface direction/history](DESIGN.md).
- [API and schemas](docs/api.md), [configuration](docs/configuration.md), [errors](docs/errors.md).
- [Current runtime/workflow](docs/WORKSPACE_RUNTIME.md) and [code review](docs/CODE_REVIEW_20261004.md).
- [Offline evaluation](docs/evaluation.md), [canvas/report controls](docs/CANVAS_AND_REPORTS.md) and [local tools verification](docs/LOCAL_TOOLS_REVIEW_20261005.md).
- [Implementation tasks](docs/autoplan/IMPLEMENTATION_TASKS.md), [test plan](docs/autoplan/test-plan-20261004.md) and [TODOS.md](TODOS.md).
- [Design QA](design-qa.md) and dated screenshot/test folders under `docs/`.

Historical D1 and design entries describe their state at that date; current runtime documentation takes precedence for implementation status. Remaining acceptance includes live multimodal evaluation, one-hour indexing/performance, provider billing/cutoff reconciliation, Linux isolation and deployed HTTPS/storage/backup validation.

No project license has been selected. Third-party font, icon and React license notices remain with the assets. CPU dependencies are locked in `uv.lock`; GPU models, inference images and licenses need separate validation before release.
