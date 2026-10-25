# API与输出契约

2026-10-11：Gemini 与 NVIDIA/Nebius 复用同一组私有上传/分析/查询/恢复接口及 schema0.1。`GET /api/session`、`GET /api/runtime/status`、`GET /health` 新增 `provider`（`gemini` / `nvidia_nebius`）。准备状态仍只读，不证明真实模型调用或云部署；provider只能由可信runtime配置选择，客户端请求不能覆盖。Google Cloud入口保持相同接口，`GET /gateway/health` 只报告入口存活、不探测后端；具体部署边界见 [deployment.md](deployment.md)。

当前本地服务包含公开合成演示、拥有权保护的会话/调查/上传/任务/查询操作，以及私有媒体读取。具体端点和输入模型见运行服务的 `/docs` 与 `/openapi.json`；下文workspace接口与 [运行指南](WORKSPACE_RUNTIME.md) 描述当前实现。默认fixture不发送模型请求，上传素材未就绪时禁止问答，不使用演示答案。

仅 `demo_parcel` 合成媒体公开。私有素材、帧、任务、查询和调查校验会话拥有权及到期时间；写入还校验CSRF/Origin。浏览器选择文件后以原始视频字节上传并预检，不是仅blob播放。

导出文件：[Answer](schema/answer-0.1.json)、[QueryControl](schema/query-control-0.1.json)、[四状态合成样例](schema/fixtures-0.1.json)。修改模型后运行`make schema`重新生成；`make check`会检测导出漂移。

Answer始终包含schema_version、status、timebase、answer、events、unresolved、followups、trace及errors。事件时间与证据时间使用原视频绝对秒数，人类时间必须等价；证据须在事件区间且属于同一视频。support_score与support_level互斥，公开debug为null，未测量支持分量时必须使用level。

JSON Schema检查字段、状态组合与support互斥/非空；时间等价、证据区间/视频归属和计数关系由服务端Pydantic校验补充。仅通过JSON Schema不足以证明证据有效，上传与模型输出另外经过服务端验证；真实模型证据质量仍需实跑验收。

| 最终status | 必须满足 |
|---|---|
| ok | 有合法事件，无unresolved或处理错误 |
| partial | 有合法事件和unresolved |
| no_result | 成功查找无证据命中；events/unresolved/errors为空 |
| error | 无合法事件，至少一条结构化失败信息 |

查询恢复控制：kind=query_control，state=pending（带2–10秒重试间隔）或unknown（停止自动轮询）。不含status，不增加第五种最终回答；HTTP202/409、同request_id恢复、持久lease/完成结果与未知不重发已实现。

固定合同样例：运行`make eval-fixture`。其事件、URI与说明均为合成样例，未证明真实证据或模型效果。

完整owner/CSRF/代际/幂等要求见ARCHITECTURE.md中的X02、E04和E17。


## 2026-10-04 workspace endpoints

See [runtime/workflow](WORKSPACE_RUNTIME.md). GET /api/session initializes cookie/CSRF; owned investigation CRUD uses PUT revision CAS. POST /api/videos accepts bounded raw video bytes, not a URL; GET /api/videos/{id} exposes actual job stages. POST analyze/retry/cancel and DELETE use the same owner/CSRF gate. Private /media/{id}/video supports Range; /media/{id}/frames/{file} checks owner and expiry. POST /api/chat/prepare validates context, POST /api/chat executes one idempotent request; GET /api/investigations/{id}/requests restores durable query controls/results without model dispatch. OpenAPI publishes the concrete input models alongside frozen Answer/QueryControl.

切换调查时 `POST /api/investigations/{id}/requests/{request_id}/cancel`：按会话拥有权终止当前查询，保留已验证的部分证据或明确取消错误。已发出的单次调用仍记账；后续模型阶段不再 dispatch。取消结果持久化且幂等，迟到模型结果不能覆盖它。

## Local readiness status

Owned `POST /api/videos/{id}/search-index` accepts `{question, generation}` and
returns `kind:index_candidates`, original saved frame descriptions/timestamps,
`verified_matches:false`, index fingerprint/coverage and `model_requests_sent:0`.
It requires CSRF/Origin and active source ownership/expiry, rejects stale source
generation, and creates no query, provider attempt or approval. Results are
candidate samples, not proof that all question conditions are met or absent.
Video detail responses now expose their source generation for this check.

Owned `GET /api/runtime/status` returns mode, local checks/model roles, runtime blockers, `dispatch_prerequisites_met`, `live_verified:false` and `model_requests_sent_by_check:0`; responses use `Cache-Control: no-store`. It reveals credential presence, never values or endpoint URLs, and reads existing current-owner/deployment budget records without authorizing calls. `dispatch_prerequisites_met` is a local prerequisite summary; each real operation still checks actual required calls/resources atomically. It is not provider connectivity, quality, billing or deployment acceptance. Use the workspace **模型与预算** dialog or the CLI in [WORKSPACE_RUNTIME](WORKSPACE_RUNTIME.md).

## Token Factory provider (2026-10-24)

Session/runtime status may return `provider: "tokenfactory"`. No new write endpoint
or spending approval API is introduced. The existing upload → preflight → explicit
analysis → chat workflow uses public Nemotron vision/text and Qwen text embeddings,
with the same ownership, evidence, idempotency and two-level approved budget ledger.
See [local preparation](TOKEN_FACTORY_LOCAL.md). Media consent in trusted runtime
is independent of numeric spending approval; both are required before dispatch.

`GET /api/session` also refreshes the existing valid session cookie to the remaining
lifetime of its server record. It does not roll server expiry or ownership forward.
An explicitly authorized offline source-retention extension is recorded separately;
there is no HTTP endpoint for extending retention or approving spend. Default TTL
remains unchanged. See [configuration](configuration.md#explicit-retention-for-an-existing-source).


`POST /api/chat/prepare` returns `kind: runtime_blocked` with a displayable
message for an owned real-video investigation if real mode/runtime prerequisites
are unavailable. No query or model attempt is created. Fixture investigations
remain separate; saved results can still be restored without enabling models.

New chat preparation may return `clarification_required`, `capability_blocked`,
`budget_unavailable` or `budget_blocked`
without creating a query or reserving an attempt. Budget preparation uses the
same bounded query plan as execution and reports required/remaining request
counts; amount/approval checks still apply. A matching existing idempotent request
can be restored even when a fresh request would exceed budget. Local shared
ledger mode disables JSON repair and uses validated vision observations directly,
so a short explicit window admits one call. Disabled repairs do not count toward
ingest or ordinary-query admission. Invalid or reversed time windows request
clarification without dispatch. If the shared ledger cannot be read, preparation
returns `budget_unavailable`; runtime status reports `budget_status: unavailable`
without budget amounts or available capacity. Neither path bypasses approval.

### Full saved-caption browsing (offline increment, 2026-10-25)

Owned, CSRF/Origin-protected `POST /api/videos/{id}/search-index` accepts the
existing `question` and `generation` plus `all_saved:true`, `offset` (default0),
`limit` (1–100, default40) and optional64-hex `snapshot`. Continuations require
the query/index-bound snapshot from the first page; changed/stale snapshots
return409. The response contains `total_candidates`, `next_offset`, `snapshot`
and `all_source_occurrences_verified:false`. It searches all saved descriptions,
returns lexical candidates in time order and sends zero model requests. It does
not certify full-source appearances or interpret structured object attributes.
The separate structured occurrence engine currently has an offline CLI only;
see `docs/qa/FULL_VIDEO_INDEX_OFFLINE_20261025.md`.

### Indexed occurrence search and zero-model chat (2026-10-25)

`POST /api/videos/{id}/occurrences/search` accepts `question`, source `generation`,
`offset`, `limit` (1–100), `snapshot` and optional up-to12 explicit `conditions`
(`field`, `value`, `operator:is|is_not`). Owned/CSRF/Origin checks apply. Private
observation artifacts are validated against the original source SHA256, duration
and generation. The response distinguishes `indexed_occurrences`,
`index_candidates` and `clarification_required`; only structured observations can
become evidence. Caption fallback is explicitly incomplete and unverified.

`POST /api/index-chat/prepare` and `/api/index-chat` accept the existing ChatInput
fields plus `engine:"index"`. They do not invoke provider adapters or install/use
model approvals. They append owned, generation-bound, idempotent query records;
responses retain schema0.1 and carry outer `engine`, `source_generation` and small
`index_search` metadata for restoring the timeline. Numeric model caps and model
request payload hashing are unchanged. Chat returns up to20 indexed intervals;
use the timeline endpoint for complete output pagination. No arbitrary semantic
or full-source recognition guarantee follows from this zero-model retrieval route.

### Optional on-device visual chat (2026-10-25)

`GET /api/session` includes `local_vision_ready`. When enabled in trusted process
configuration, owned/CSRF/Origin-protected `POST /api/local-chat/prepare` and
`POST /api/local-chat` accept the existing ChatInput without an extra `engine`
field. Preparation does not run inference. Chat uses one serialized local worker
and returns a `query_control` pending envelope with progress in `suggested_action`;
repeating the same request polls without dispatching another job. Completed
responses use schema0.1 and outer `engine:"local"`, source generation and the
existing durable query format. Cancellation, stale source/desk generations and
expired ownership prevent publication. Unknown interrupted work is not silently
resent. No remote provider fallback, spending approval or paid-budget mutation is
available through these endpoints. See [local runtime and limits](LOCAL_VISION.md).


### Durable query-reference snapshots (2026-10-25)

`GET /api/session` advertises `query_reference_snapshots:true`. For uploaded
sources, a saved record/finding may use `query:{id,parentTurn?}` instead of copying
the complete answer. Only a completed query belonging to the authenticated owner
and the same investigation resolves. Full legacy answers are still validated
against their canonical query response; evidence findings still require an exact
canonical frame. State storage keeps compact references. GET and PUT responses
expand full canonical answers for compatibility. Query references cannot grant
access to another owner, source or investigation.

Snapshots retain up to100 records and8 findings with the existing1MiB encoded
state bound. The desktop store no longer silently evicts the oldest card after
round12. At capacity it preserves old records. Request recovery returns up to100
owned records, aligned with the existing query-history bound. These are storage
bounds, not changes to model/spending approvals.


## Cloud sampled visual chat

With trusted `FS_CLOUD_VISION=1`, `/api/session` exposes `cloud_vision_ready`.
`POST /api/cloud-chat/prepare` and `/api/cloud-chat` use ChatInput and the existing
owned asynchronous query-control protocol. Prepare reports a conservative
`estimate` and `ready`, `capability_blocked` or `budget_blocked`, without dispatch.
The execution route repeats admission and uses the original approved two-level
ledger. Results have `engine: "cloud"` and schema0.1; source images and timestamps
remain authoritative. This is a Token Factory inference/indexing path, not model
training. See [cloud compiler](CLOUD_VISION.md).
