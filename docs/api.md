# API与输出契约

## Public pages — local change, 2026-10-29

`GET /` serves the sports landing page; `GET /workspace` serves the existing
desktop investigation UI. Both are HTML pages excluded from OpenAPI. The landing
page and its illustrative frame-preview controls make no API/model requests and
do not initialize a private session. The workspace initializes its existing
session normally. Private media and all owned API operations retain their
session, expiry, CSRF and Origin requirements. This page split is not yet deployed.

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
The older offline-only implementation is documented in
`docs/qa/FULL_VIDEO_INDEX_OFFLINE_20261025.md`; the owned HTTP routes described
below are the newer implementation.

### Indexed occurrence search and zero-model chat (2026-10-25)

`POST /api/videos/{id}/occurrences/search` accepts `question`, source `generation`,
`offset`, `limit` (1–100), `snapshot` and optional up-to12 explicit `conditions`
(`field`, `value`, `operator:is|is_not|contains|color_item`). `contains` is
restricted to visible text; `color_item` has the binding rules below.
Owned/CSRF/Origin checks apply. Private
observation artifacts are validated against the original source SHA256, duration
and generation. The response distinguishes `indexed_occurrences`,
`index_candidates` and `clarification_required`; only structured observations can
become evidence. Caption fallback is explicitly incomplete and unverified.
For structured results, `structured_conditions_evaluated:true` means the
conditions were evaluated against the stored observations. `verified_matches`
remains false: it does not imply that an independent reviewer confirmed the
underlying visual recognition. See the coverage fields for sampling limits.

`POST /api/index-chat/prepare` and `/api/index-chat` accept the existing ChatInput
fields plus `engine:"index"`. They do not invoke provider adapters or install/use
model approvals. They append owned, generation-bound, idempotent query records;
responses retain schema0.1 and carry outer `engine`, `source_generation` and small
`index_search` metadata for restoring the timeline. Numeric model caps and model
request payload hashing are unchanged. Chat returns up to20 indexed intervals;
use the timeline endpoint for complete output pagination. No arbitrary semantic
or full-source recognition guarantee follows from this zero-model retrieval route.

If an owned bounded supplement completed for the exact question and context,
and the current index contains that same validated supplement, but its
conditions still cannot be resolved, chat saves
an unconfirmed `no_result` answer. It reports the number of sampled frames
checked and does not claim the target is absent. A repeated identical question
can reuse this completed supplement, including after a later version carries it
forward. Failed, unknown, other-context and unverified lineage jobs are not used
as proof. No new model request is made for reuse.
The same request ID cannot be reused with a different question or context;
an index answer cannot be published while its supplement is still running.
For this unconfirmed outcome, `index_search.checked_frames` contains only the
version-bound sampled frames actually checked by that supplement. They are
navigation aids, not answer events or evidence that the requested target is
present or absent. The server validates each private source frame before use.

When one indexed garment field contains several explicit variants of the same
color/item pair, generated conditions can use `operator: "color_item"` with a
canonical value such as `"blue jersey"`. It matches only a single observed
garment value with that item and color. Conjoined colors, such as
`"blue yellow jersey"`, must all occur in that same observed value; separate
items or subjects cannot be combined. Values mixing multiple garment types are
not combined. It can also match a single item and its explicitly named
`<field>_color` value on the same subject; missing, uncertain or multiple values
are not guessed. Explicit `is` filters still require exact values, and all conditions
must match one frame-local subject. This operator describes indexed observations,
not an independently verified or exhaustive video result.

For the bounded generic `clothing` query, an explicitly colored jersey or shirt
can satisfy the body-clothing condition. A hat or headband alone cannot. This
is not an exhaustive clothing taxonomy, and an unbound generic color remains
uncertain rather than proving an item's color.

Gender-qualified terms such as `man` and `女人` require a corresponding
frame-local indexed value; a generic `person` alone is insufficient. These
labels describe what the extractor recorded and do not establish a person's
identity or a verified demographic attribute.

For a saved index answer, occurrence search accepts `answer_request_id` to
reopen that answer's original knowledge version. The server resolves the version
from the owned completed answer and checks its investigation, source and
generation; clients cannot supply an arbitrary version. Ordinary searches use
the latest published version. This preserves the original evidence context when
a later supplement publishes a newer index.
If the saved answer did not record a knowledge version, the endpoint returns
409 `index_answer_version_unavailable`; it does not silently substitute the
current version. The UI offers an explicit new lookup against the latest index.

An explicitly written range with invalid seconds, or a range accompanied by
additional unquoted timestamps, is rejected as ambiguous before dispatch. The
parser accepts one valid range; it does not silently broaden multiple ranges
into an unscoped search. Quoted video text is not treated as a range.
An explicit point such as `在05:09` or `at 05:09` uses the half-open interval
from that timestamp to one second later (clipped at the video end). Results
still reference actual sampled-frame times. “Before”, “after” and approximate
time wording are not interpreted as that one-second interval.

For a fully enumerated source catalog, a scoped search includes a presentation
frame that starts before the requested range but remains visible inside it. Its
occurrence is clipped to the range; the evidence retains its original decoded
timestamp. Because Answer 0.1 requires evidence inside its event, the answer
event can begin at that earlier frame timestamp and explains the overlap in its
summary. Sampled indexes treat frames as points and do not infer such intervals.

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

2026-10-28 本地新增 `POST /api/auto-chat/prepare`，接受 ChatInput，返回只读
`engine`（index/local/cloud/model）、`route_message`、准入 `kind` 和
`model_requests_sent:0`。自动路由不发模型请求或创建预算；实际执行继续使用原端点，
仍需其拥有权、代际和预算检查。详见 [自动路由](AUTO_ROUTING.md)。

### 基础索引状态（重构中）

`GET /api/videos/{video}` 和 `GET /api/videos` 返回 `knowledge_status`；
`GET /api/videos/{video}/knowledge` 返回同一状态，仍受素材拥有权和有效期保护。
新上传素材从 `waiting_probe` 进入 `waiting_processor`；预检失败为 `failed`。
旧素材没有任务时为 `not_started`。这些状态不代表模型处理已经启动：
通用提取器、后台任务、索引聊天和有界补查已在隔离 fixture 中接通；本机视觉
仅通过可信运行环境显式设置 `FS_KNOWLEDGE_LOCAL=1` 进行实验。默认服务及
Token Factory 基础索引可由可信运行环境显式开启，但默认关闭且尚未完成真实
校准和验收；参见 [配置](configuration.md)。默认服务的 `version` 为空，覆盖标为
`not_indexed`；不得将预检完成解释为索引完成。测试模式内的 build/cancel 接口只
操作当前拥有者的任务，取消不会改变视频代际；合成回答标注 `synthetic_fixture`。
`unknown` 表示中断后结果不明，不得自动重发。语音能力在基础索引中标为未启用。
本机索引模式的 `processor_available` 表示本机补查处理器配置是否可用；
其他模式为 `null`，不代表云端可用或已获预算批准。处理器不可用时，已发布的
索引仍可查询；不能补查的部分保留不确定性。
启用 `FS_KNOWLEDGE_TOKENFACTORY=1` 后，即使当前运行时配置为其他提供商，
统一索引门槛仍然生效；不会回退到旧聊天路径。只有匹配的 Token Factory
配置和相应校准、预算准入才能启动云端处理。

实验性的 `POST /api/videos/{video}/ocr-candidates` 默认关闭，仅在可信环境
设置 `FS_OCR_CANDIDATES=1` 且系统已安装 Tesseract 时可用。它只接受含引号
文字和不超过 8 秒的明确时段，或单个明确时间点（按一秒范围处理），最多处理 8 张已有索引帧；结果是未核实候选，
不写回索引、不调用云端模型。该接口检查素材拥有权、CSRF、代际和索引版本，
并报告处理失败帧。首版只配置英文识别，Linux 隔离环境尚未验收。
为避免将未支持的文字误报为已搜索，OCR 候选仅接受 ASCII 文字；包含中文、
其他非 ASCII 字符的请求返回 `ocr_english_text_only`，仍可使用已有索引查询。
索引检索返回 `ocr_eligible` 表示问题格式及该时段的已索引帧数量是否符合这一入口；
它不代表 OCR 已启用或已运行。没有帧、超过 8 帧、额外的物体或颜色条件及显式
属性筛选均不会交给仅支持文字的 OCR。
结构化检索还会每页返回最多 8 张
`uncertain_candidates`：单个主体至少满足一项条件，其余条件仍不明确且没有
已知矛盾。这些只是供用户回看的线索，不计入匹配、回答证据或完整覆盖。
`uncertain_candidate_next_offset` 用于独立分页；后续请求须携带相同的查询快照。
也可在同一快照下传入 `candidate_time`（视频秒数）定位该时间起的候选；不能与
非零 `candidate_offset` 同用，时间必须在视频范围内。
首种分割方式未找到文字时会尝试第二种，整次处理有 20 秒期限；超时帧按失败
报告，不能视作未出现文字。
两种方式均未找到时，还可用 FFmpeg 对整帧作有尺寸限制的临时放大后复查；
结果仍引用原帧，并在处理完成后移除临时图像。

实验模式的自动聊天准备在属性不足时可返回 `supplement_plan`：最多两段、候选帧
以及关联的索引版本；候选仅供定位，不能作为事实或证明视频不存在其他内容。
找不到有依据的候选时返回覆盖缺口，不发模型请求、不重扫全片。实验模式的页面
可以调用本机或 fixture 补查器并将结果发布为新版本；旧版本继续可读，不会把
不同主体的属性拼在一起。Token Factory 的局部补查仅在另有匹配校准和现有
两级预算准入时可用；新提取格式的真实费用校准仍未完成。
实验链路与小范围实测不能作为全片真实视频识别质量验收的证据。

对 Token Factory，`auto-chat/prepare` 会在补查前只读检查校准、已保存回复及
两级预算，并返回本次最多新增请求数和费用上界。配置或预算不满足时返回
`budget_blocked`；存在结果未知的调用时返回 `supplement_unknown`。准备接口
不发送模型请求、也不预留额度；执行时仍重新检查并逐次预留。
同一问题若在旧计划下留有未配对或无效的调用回执，新计划不会绕过它；若旧
回执已完成但无法安全映射到新计划，也会停止并要求核对，不重复计费调用。

调查的 `GET /api/investigations/{id}/requests` 同时返回本调查、当前素材代际
的未转成回答的 `supplements`，包括原始提问（旧记录可能为空）。页面恢复正在
处理的任务；已完成的补查仅走已有索引生成回答。未知结果不自动重发，切换
调查后不写入旧调查的回答或覆盖新草稿。
`POST /api/investigations/{id}/supplements/{request_id}/cancel` 对运行中的任务
返回 `cancelled`；若处理已结束，则返回实际终态（如 `done` 或 `unknown`），
不会改写结果或重发调用。不存在的任务仍返回冲突。
同一调查、素材代际、问题文本、父问题及索引版本下，重复提问复用已完成的
补查，即使仍有未确认的画面也不会自动再启动一轮；不同上下文、已取消或
结果未知的任务不会被当作已完成结果复用。覆盖缺口仍会明确显示。

补查记录及原始问题继承拥有会话、调查和素材的有效期。显式删除调查或素材时，
同一事务清理失效补查记录；周期清理及新补查准入也会回收失效记录，避免过期
历史永久占用 1,000 条存储容量。仍有效的完成及未知记录保留，以维持幂等恢复；
此存储容量不是模型请求预算。准入再次在事务内核对拥有权、有效期和代际，
防止删除之后重建私人请求。清理不会退还或改写付费调用账本和未知预留。
