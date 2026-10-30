# 调查、素材与真实 Agent 实施状态

## Current synthetic demo

New workspaces use `demo_basketball`: generated court, pass and shot stills in
an 18-second video, with English preset answers and frames extracted at 00:00,
00:06 and 00:13. The demo sends no model requests and does not prove continuous
play or shot outcome. The legacy `demo_parcel` catalog and media remain available
for existing investigations; unparameterized demo endpoints keep their prior
parcel behavior for cached clients. The real Nemotron basketball results are
separate private history and are not presented as a new model response.

## 当前状态（2026-10-29）

本地源码首页 `/` 现为体育视频落地页；现有调查工作台位于 `/workspace`。
“Open workspace” 连接原工作台，不迁移调查、素材或会话记录。营销页面的篮球图像、
问题和时间均明确标为示意，控件仅切换本页静态帧；不会初始化私有会话或调用
FrameSeek 模型。进入工作台后仍由原会话、拥有权与预算路径控制。此落地页已部署至现有服务；部署记录见
[Nebius 发布记录](NEBIUS_LIVE_STATUS.md)。新基础索引处理器在该服务仍处于禁用状态，
原模型质量与生产验收边界不变。

当前源码包含可复用的 `VideoKnowledge v1` 上传索引，和下方较早的 manifest
摄取路径并存。该索引功能需由可信服务配置显式启用：本机使用
`FS_KNOWLEDGE_LOCAL=1` 及已配置的本机视觉；Token Factory 使用
`FS_KNOWLEDGE_TOKENFACTORY=1` 及匹配版本的私有校准。媒体预检完成只表示
视频可播放，不表示索引已完成；启用索引时，全部必要分段校验并发布后才开放
新聊天，旧回答和播放器仍可使用。状态、恢复、取消与补查接口详见
[API 文档](api.md#基础索引状态重构中)。

基础索引每 8 秒最多采样 8 帧，并保留原视频解码时间；查询优先使用已保存
观察，必要时只补查可定位的有限窗口。采样和模型观察都可能漏检或出错，
不能据此宣称逐帧完整、跨镜头身份一致或事件统计准确。语音转写未纳入该
索引能力。新本机索引使用 v5 属性绑定和物体颜色提示；Token Factory 各版本分别要求
对应校准。旧检查点和历史答案不会因版本切换自动重建。

本机短片段页面测试和 Token Factory 模拟传输验证已完成；真实素材的人审
质量验收、Token Factory v4 真实校准、评审可访问的完整流程仍未完成。
测试证据与限制见 [索引重构记录](qa/KNOWLEDGE_REFACTOR_20261029.md) 和
[评审准备草稿](HACKATHON_JUDGE_DRAFT.md)。以下旧日期记录描述当时实现，
与当前路径不同之处以本节和对应专项文档为准。

2026-10-24: 用户授权新增 `provider=tokenfactory` 与 `allow_tokenfactory_media`，仅向固定 Token Factory API 发送本机抽帧 JPEG。使用 Nemotron 3.5 Super VL 公共 API 和 Qwen3 Embedding 8B 文本检索；不租 GPU、不自动启用付费请求。配置、预算待确认项与篮球测试见 [Token Factory 本地准备](TOKEN_FACTORY_LOCAL.md)。原自托管及 Gemini 路线保持独立。

2026-10-05 历史记录：新增功能已在本机运行；默认仍为 fixture。当时尚未提供真实模型端点、数字预算、供应商权限与资源停费校准，未发送真实模型请求，也未创建 GPU。

2026-10-11 增量：按用户授权新增 Gemini / AI Builder Cup 路线，保留原 NVIDIA/Nebius。`FS_RUNTIME_FILE` 中 `provider=gemini` 选择 Google native REST 适配；省略为 `nvidia_nebius`。本轮仅本地实现与 mock 验证，不创建 GCP 或真实模型请求。Google 帧发送需明确 `allow_google_media`，同样受两级预算/校准/代际保护；仅视觉，不支持音轨转写。准备与限制见 [AI Builder Cup](AI_BUILDER_CUP.md) 和 [部署准备](deployment.md)。下方“自托管媒体/既定 Nebius”段落适用于原路线，Gemini 的已授权媒体边界以新文档与 ARCHITECTURE 增量为准。

## 可使用的工作流

- 工作台启动时先显示恢复状态，等上次调查及其素材载入后再显示内容，避免短暂显示默认箱子演示；连接失败时提供重新加载，不替换已保存调查。
- 顶部调查库：新建、命名、切换、恢复和删除调查。标题、最多100轮问题（不再静默淘汰早期记录）、8项发现、笔记、卡片位置、命名对象分组、路径名称、折叠、画布视角、面板、输入草稿和播放器位置保存到 SQLite；浏览器只保存当前调查 ID。新调查保留上一份调查。
- 素材库：上传多段视频，可重命名，各自拥有独立调查和证据。500 MiB/文件、每主体最多10段素材/1 GiB、全服务4 GiB，上传180秒超时。删除素材级联禁用并清理原文件、帧、模型结果、索引及关联调查；删除操作在界面有确认。
- 上传完成后，ffprobe 检查真实时长、像素与音轨，ffmpeg 检查镜头变化、生成完整120秒/5秒重叠窗口和实际解码 PTS 预览。未配置模型显示“等待模型配置”，问答关闭，禁止套用演示结果。摄取失败保留原素材；未完成预检的失败或取消素材可以显式“重新预检”，不会调用模型。
- 模型配置与批准预算齐备后，在素材库“开始分析”：逐窗粗标注 → 向量索引 → 可配置逐窗 ASR → 原子发布完整 manifest。只有全视觉通道完成且帧文件存在才 ready。ASR 未配置/失败时只声明视觉能力；音轨问题不以视觉回答冒充。
- 真实查询：服务端验证所选旧轮次 → BM25/向量融合 → rerank → 文本规划选择最多3段 → 自托管视觉回看 → 文本整理 → schema0.1。引用使用本次回看的实际帧与原视频绝对时间。部分检查不会变成“全视频不存在”的结论。
- 同 request_id 同载荷返回原结果；运行中为独立202控制 envelope；结果不确定为409 unknown，不自动重发。恢复查询只读取已持久状态/结果。显式新请求结束旧 unknown，并保留此前已验证的部分证据。停止或切换调查时，取消响应中已完成或已验证的部分回答立即保存到原调查；取消后禁止后续 dispatch，并保留已发生费用。已发出的单次 HTTP 不假装退款或供应商停费。

查询的部分证据检查点与抽帧绑定素材代际、调查和请求身份，防止复用请求 ID 时混入旧证据。早期缺少身份元数据的部分检查点无法可靠归属，不能自动恢复；已保存的完整回答和旧证据帧仍可查看。付费 attempt 身份保持原规则，未知调用不会因检查点变更而重发。

追问锚点必须属于同一素材的当前代际。旧回答没有记录代际时，仅初始代际可继续用作锚点；素材重建后仍可回看旧回答，但须从当前代际重新建立证据再追问。

如果提交时连接中断，且本页恢复列表中暂时找不到该请求，可由用户点击恢复，使用原请求 ID 和原载荷重试；服务端按同一身份去重。已知 `unknown` 和补查不会这样重发。用于这项重试的载荷副本只保留在当前页面内，刷新后不提供这项重试。

会话使用 HttpOnly/SameSite=Strict cookie，所有写入检查 CSRF/Origin；私有视频、帧、任务、问答、调查按拥有权校验。默认24小时，到期先禁读再清理，FRAMESEEK_TTL_HOURS 可设1–168。没有账户跨设备同步；清除会话 cookie 后不能接管原调查。SQLite CAS 检测多页面保存冲突，不覆盖另一页的修改。

## 新增本地工具（2026-10-05）

- 画布支持 Shift 多选、批量移动、命名对象分组、对齐/等距、60步布局撤销/重做、当前调查搜索和快捷键说明。布局持久化，撤销历史不跨刷新，也不撤销模型请求/答案/笔记；详见 [画布与报告](CANVAS_AND_REPORTS.md)。
- 发现面板可导出 Markdown、JSON、离线 HTML。包含当前保留问题及发现来源、原视频精确时间、画面/语音文字证据、未确认项，支持最多24帧/16 MiB内嵌图片；不会生成源视频或音轨副本。
- `make eval-check` 验证四类八问的未运行模板，预期 `NOT_ACCEPTED`。离线评测保留失败/缺失分母、Recall@5、IoU逐事件覆盖、负样本、人工证据复核、P95完成率及费用缺口；详见 [评测说明](evaluation.md)。真实实验与自动轨迹采集仍待授权/端点/标注。
- 顶部“模型与预算”、拥有权保护的 `GET /api/runtime/status`、`make agent-check` 仅读取模式、视频工具、模型/凭据存在性、端点限制、校准引用/有效期和当前主体/部署剩余额度。CLI可传 `--owner` 查看已有会话审批，未满足前提退出2。它不创建审批、不连接模型；通过也不等于模型实跑/费用/性能/部署GO。原 `make preflight` 的固定部署阻塞报告保持独立。

## 模型与费用配置

原自托管路线的视觉帧和音频仅发送到明确列出的自托管主机，文本检索可使用
Nebius Token Factory。Token Factory 视觉与 Gemini 是后续单独授权的路线：
必须通过对应可信配置明确启用，且只向各自固定官方 API 发送本机解码 JPEG。
详见 [Token Factory](TOKEN_FACTORY_LOCAL.md) 和 [Gemini](AI_BUILDER_CUP.md)。
模型名称必须等于实际服务暴露的 ID，并固定 revision。

`docs/runtime.example.json` **是不可运行的模板**：占位主机、过期校准、空引用会阻止调用。`max_cost_micro:1` 是占位值，必须替换为经校准的每阶段保守费用上界，涵盖最大输入/输出、全部资源分配、启动、空闲、失败与释放余量，不能当作单价。`valid_until` 是校准失效的 Unix 时间；`resource_cutoff_reference` 必须指向实际验证过的供应商侧截止/释放记录。应用 HTTP 超时不证明 GPU 已停止计费。

```sh
# 文件中只有地址、模型、费用上界和校准记录引用，密钥使用环境变量。
export FS_RUNTIME_FILE=/absolute/private/path/runtime.json
export FRAMESEEK_MODE=real
# 在本机终端配置 NVIDIA_*_API_KEY 和 NEBIUS_API_KEY，避免把密钥写进项目或聊天。
make run
```

此程序不会部署或释放 Nebius 实例。部署操作者必须先提供有限校准预算、供应商侧停费机制与实际验证记录；未经验证的部署形态继续拒绝。Mac 的文件/网络隔离已用实际 FFmpeg 检查；Linux需要 bwrap、namespace 和部署限额验证，当前没有 Linux 实跑证据。

预算审批不能由 `/api`、普通环境变量或 runtime 文件生成。必须先获得用户对币种、总金额、primary/总调用上限及校准费用的明确批准，再由可信本机操作者记录部署 `*` 和 `/api/session` 返回的 `owner_id` 两条同版本 `ApprovedBudget`，字段为 scope/version/approval_reference/primary_calls/model_calls/money_units/currency_unit。金额单位为整数微币种，例如 USD_MICRO；两级预算共同生效，unknown 不释放额度。

```sh
uv run python -m frameseek.budget_admin show
# 以下安装只应在数值明确批准后由操作者执行，不是运行服务的自动步骤。
uv run python -m frameseek.budget_admin install --file /private/approved-records.json \
  --scope APPROVED_OWNER_ID --confirm-approved-reference APPROVAL_REFERENCE
uv run python -m frameseek.budget_admin revoke --scope APPROVED_OWNER_ID --version APPROVED_VERSION
```

整任务先检查实际窗口数、总模型次数和保守金额，之后每个 attempt 事务预扣，再调度。同 generation 的显式摄取恢复仅检查尚未预扣的工作，完成的 checkpoint/cache 不重复占预算；即使零新增调用仍必须存在有效批准。unknown/dispatched 或结果缓存缺失不会自动重发。配置与粗采样数量按 generation 冻结；取消后的新 generation 使用独立 checkpoint 与帧名称，保留旧证据文件。服务重启将未开始的 queued 任务标记 interrupted，不自动重放。查询与摄取在单模型 attempt 上1:1轮换，等待队列最多16，全局查询槽2；调用有总墙钟限额。模型配置/版本变化要求重建索引，不复用旧语义向量。服务仅支持一个 API/worker 进程；不可使用多个 Uvicorn workers。

接口依据 [NVIDIA Omni HTTP API](https://docs.nvidia.com/nim/vision-language-models/1.7.0/examples/nemotron-3-nano-omni-30b-a3b-reasoning/api.html)、[vLLM rerank](https://docs.vllm.ai/en/stable/models/pooling_models/scoring/)、[NVIDIA Parakeet NIM](https://docs.nvidia.com/nim/speech/26.02.0/asr/deploy-asr-models/parakeet-tdt.html)、[Nebius Token Factory API](https://api.tokenfactory.nebius.com/docs)。ASR adapter 要求 word 时间戳的规范化 JSON；部署响应格式和支持语言需在实跑校准中验证，不声称 Parakeet TDT v3 支持中文，也没有说话人识别。

## 验证与仍待验收的内容

`make test` 覆盖拥有权/CSRF、上传、畸形素材、窗口/PTS、媒体Range、删除与过期、持久化/CAS、预算保护，以及 mock transport 上的摄取→多轮查询→证据、请求重复、pending/unknown、reset迟到、取消后不再调用。`npm test` 覆盖空间快照与已有交互。浏览器证明保存在 `docs/workspace-20261004`。

mock 输入与回复仅存在测试中，未作为真实页面回答或质量指标。未完成的真实验收仍包括模型权限/revision smoke、中文/音轨通道、诊断4类8问、1小时完整索引、固定评测与消融、费用/VRAM/P95、供应商停费/崩溃对账、Linux隔离、部署HTTPS/磁盘加密与备份恢复。不得将本次集成标成完整 MVP 或 GO。原26项任务与 ARCHITECTURE 指标没有删减。

代码审查后的本地验证：109 项后端测试、71 项前端测试、lint/format、合同导出、构建通过。详见 [初始导入评审](CODE_REVIEW_20261004.md)。

2026-10-05 本地工具及评审修复记录见 [LOCAL_TOOLS_REVIEW_20261005.md](LOCAL_TOOLS_REVIEW_20261005.md)。CI按用户要求延期；未提供服务器或数值预算，未执行付费模型。


### Local source selector and recovery — 2026-10-25

The source player now has an owned video dropdown plus the public box fixture.
It reuses `openSource` / `openDesk` and saves existing edits before navigating.
Each video's last chosen investigation is remembered in localStorage and validated
against the authenticated investigation list before restoring; the browser hint
never grants ownership. A failed switch resets the selected value and retains the
current draft. Late list responses cannot mutate another desk's selector.

The user's current local preview session could not see its basketball record,
which remained under the earlier local session. Explicitly authorized, offline
operator recovery moved that active basketball video and the earlier basketball
and box investigations, with their query rows, to the current local owner. A
private SQLite backup and before/after audit are retained under the ignored
`.frameseek/local-source-recovery-20261025/`. No automatic cross-session discovery
or public recovery endpoint was added. Query payloads, investigation state,
revisions, expiries, source bytes, jobs, sessions and budget consumption were
preserved. The local old paid approvals remain inactive; the preview runs fixture
mode with no runtime key loaded. Restoration is not a spending authorization.
The original box investigation has one turn; basketball has three. This local
change does not synchronize source data with production.

Verification: 109 frontend regressions, build and Ruff/schema checks; browser
checks cover video switching and restoration. No model dispatch or re-ingestion.

The local selector's visible control was subsequently upgraded to a thumbnail
button and owned video popup, retaining the hidden native select as the adapter
to existing navigation. Keyboard arrows/Home/End, selected-item focus, Escape and
outside dismissal are supported; switching still uses the same save/restore path.
Card headers now show a bordered 删除 label instead of ×. No user question was
deleted as part of this visual adjustment. 110 frontend regressions passed.


### Compact header and composer suggestions — local preview, 2026-10-25

Investigation actions now live beside the editable title; source management lives
in the source picker. Header persistence shows one saved indicator while errors
retain their retry action; analysis mode lives by the source. Existing IDs and
owned library/save/restore paths are retained.

Composer chips use cached followups only from the selected, visible, same-video
answer with evidence and an ok/partial status; at most three distinct questions.
Fixture followups retain their synthetic label. Empty/failed/mismatched answers
fall back to explicitly labelled examples, not newly generated recommendations.
Clicks fill the composer only, guarded against drafts and disabled inputs; no
auto-submit or context change. Legacy card/empty-state suggestions also fill only.
Input events schedule normal draft persistence. Existing response schema already
contains followups: no provider call, prompt/schema change or new indexing occurs.


### Evidence-grounded recommendations — 2026-10-25

The earlier generic fallback is replaced when valid saved evidence exists. Sources
are selected from visible same-video ok/partial records, preferring the selected
record then most recent usable record. Frames require matching event video IDs,
owned relative media paths and finite in-range absolute timestamps. Existing
followups remain preferred; without a selected context real cached followups get
a concrete time-window prefix. Otherwise observations in saved answers/captions
select bounded scoreboard, clock, jersey/court or box-position questions. Filename
and investigation titles never determine the topic. UI distinguishes cached
model followups, deterministic questions based on saved evidence, fixture paths
and truly unanalysed generic fallback. No additional model call, prompt change,
indexing, expiry or approval installation.

A thumbnail/timestamp source control reuses the existing player seek path without
filling or sending a question. Question chips remain fill-only and draft guarded.
An additional text-only consistency check highlights explicit contradictory numeric
trend phrases, such as 14 decreasing to23. It preserves the original answer and
status, offers existing evidence for review, and does not claim video verification
or rewrite historical queries. This is a targeted guard for the recorded QA defect,
not a general correctness guarantee or a completed live-acceptance claim.


2026-10-25 history repair: uploaded-source snapshots now store owned query references
rather than duplicating answer payloads. GET/PUT responses still expand complete
answers for clients. Owner/investigation and canonical-evidence validation, CAS
and the1MiB snapshot bound remain enforced. Session capability
`query_reference_snapshots` gates compact client writes. Recovery covers the
existing100-query history bound; reaching capacity preserves old records rather
than evicting them. The paid $20/40 ledger is unrelated and unchanged.


Workspace language: interface controls and newly requested model observations and synthesized answers use English. Existing investigations retain their original questions, answers, and evidence descriptions; indexed and deterministic responses may still contain their original language. Model output language is prompt-guided and has not been verified with live calls.
