# 调查、素材与真实 Agent 实施状态

2026-10-04。新增功能已在本机运行；默认仍为 fixture。真实模型端点、数字预算、供应商权限与资源停费校准尚未提供，未发送真实模型请求，也未创建 GPU。

## 可使用的工作流

- 顶部调查库：新建、命名、切换、恢复和删除调查。标题、最近12轮问题、8项发现、笔记、卡片位置、路径名称、折叠、画布视角、面板、输入草稿和播放器位置保存到 SQLite；浏览器只保存当前调查 ID。新调查保留上一份调查。
- 素材库：上传多段视频，可重命名，各自拥有独立调查和证据。500 MiB/文件、每主体最多10段素材/1 GiB、全服务4 GiB，上传180秒超时。删除素材级联禁用并清理原文件、帧、模型结果、索引及关联调查；删除操作在界面有确认。
- 上传完成后，ffprobe 检查真实时长、像素与音轨，ffmpeg 检查镜头变化、生成完整120秒/5秒重叠窗口和实际解码 PTS 预览。未配置模型显示“等待模型配置”，问答关闭，禁止套用演示结果。摄取失败保留原素材；未完成预检的失败或取消素材可以显式“重新预检”，不会调用模型。
- 模型配置与批准预算齐备后，在素材库“开始分析”：逐窗粗标注 → 向量索引 → 可配置逐窗 ASR → 原子发布完整 manifest。只有全视觉通道完成且帧文件存在才 ready。ASR 未配置/失败时只声明视觉能力；音轨问题不以视觉回答冒充。
- 真实查询：服务端验证所选旧轮次 → BM25/向量融合 → rerank → 文本规划选择最多3段 → 自托管视觉回看 → 文本整理 → schema0.1。引用使用本次回看的实际帧与原视频绝对时间。部分检查不会变成“全视频不存在”的结论。
- 同 request_id 同载荷返回原结果；运行中为独立202控制 envelope；结果不确定为409 unknown，不自动重发。恢复查询只读取已持久状态/结果。显式新请求结束旧 unknown，并保留此前已验证的部分证据。切换调查先取消当前查询，取消后禁止后续 dispatch、保留已验证证据和已发生费用；已发出的单次 HTTP 不假装退款或供应商停费。

会话使用 HttpOnly/SameSite=Strict cookie，所有写入检查 CSRF/Origin；私有视频、帧、任务、问答、调查按拥有权校验。默认24小时，到期先禁读再清理，FRAMESEEK_TTL_HOURS 可设1–168。没有账户跨设备同步；清除会话 cookie 后不能接管原调查。SQLite CAS 检测多页面保存冲突，不覆盖另一页的修改。

## 模型与费用配置

保持 ARCHITECTURE 的 NVIDIA/Nebius 选择，不配置其他云视觉供应商。所有视觉帧和音频仅发送到明确列出的自托管主机；Nebius Token Factory 只接收文本。模型名称必须等于实际服务暴露的 ID，并固定 revision。

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
