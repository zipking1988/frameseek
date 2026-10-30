# 错误与恢复

## Gemini 与 Google Cloud 入口（2026-10-11）

- `google_media_not_enabled` / `gemini_endpoint_not_allowed` / `invalid_gemini_model`：私有runtime尚未明确启用Google帧发送，或端点/模型ID非法；不会dispatch。不要从浏览器解除保护。
- `gemini_embedding_input_limit` / `gemini_request_limit`：完整窗口批次超过100，或inline请求超过19MiB；显式拒绝，不截尾发布ready。选择较短素材或以后实现经评审的完整有界批次方案。
- `gemini_inline_jpeg_required`：只允许本机解码的inline JPEG，不抓取外部媒体URL。
- `gemini_incomplete_response` / `invalid_gemini_response`：模型安全阻断、输出截短或格式无效。若已dispatch则作为 `model_unknown` 保留费用，禁止自动重发；已有verified部分按原恢复协议保留。
- `gemini_asr_not_supported`：当前 Gemini 路线只有视觉，音轨问题不能用视觉回答冒充。
- `audio_channel_unavailable`：素材没有可靠音轨转写，无法回答解说内容；该检查在模型调用前完成，不产生新的模型请求或费用。可以改问可见画面。
- `gateway_auth_required`（401）：后端未收到有效私有入口token；token不能替代用户cookie/CSRF/拥有权。只由操作者检查服务端配置。
- `workspace_backend_unavailable`（502）：入口无法连接持久后端；不切换fixture，不重试模型请求。
- `gateway_upload_limit_30_mib`（413）：Cloud Run HTTP/1入口只接收≤30MiB请求体，本地直接上传仍保留500MiB上限。
- workspace在`K_SERVICE`环境启动拒绝：必须使用无状态gateway和持久单后端，不把SQLite预算/调查放进Cloud Run临时盘。


| 当前入口 | 原因 | 恢复动作 |
|---|---|---|
| invalid_config / 退出码2 | TOML不可读、未知字段、非法类型或保护限额 | 检查配置名称/类型；不通过普通配置批准新额度 |
| real预检 / 退出码2 | model、权限、预算、GPU费用上界及媒体保护未就绪 | 补实际信息并完成校准/实现，不能自动fixture代替real |
| BudgetDenied（内部） | 缺批准、额度不足、币种/载荷冲突、撤销或非法状态 | 不dispatch；重新核对有效批准与同请求身份 |
| unknown attempt（内部） | dispatch前后结果不确定 | 保留预算，禁止自动重新dispatch；供应商验证复取或明确新尝试尚待接入 |
| worker_start_failed（503） | 本机无法启动后台线程 | 素材预检、索引、补查或本机/云端视觉查询未能启动；检查系统资源后可显式重试。补查和查询使用新请求 ID，原 ID 保留失败结果以保证幂等 |

模型适配器已实现；fixture 模式不发送模型请求，真实调用需要可信配置和有效的两级预算批准。配置错误不输出输入值、密钥或路径。SQLite 繁忙有有限等待，异常不得绕过预算开启模型调用。

最终回答使用 `ok`、`partial`、`no_result`、`error` 四种状态；查询恢复使用独立的 `pending` / `unknown` 控制信封。`pending` 可按提示读取状态；`unknown` 停止自动轮询和重发，并保留已预留的预算。取消或恢复时保留已有的已验证证据和用户草稿。具体接口和状态码见 [API 文档](api.md)，运行条件见 [工作区运行指南](WORKSPACE_RUNTIME.md)。`/docs/errors` 提供本地简要说明。

后台预检发生意外异常时，任务结束并释放租约；分析或查询阶段的未预期异常保守标为 `unknown`，不能自动重发可能已经派出的调用。已有费用和证据继续受账本与原恢复规则保护。

## Token Factory（2026-10-24）

- `tokenfactory_media_not_enabled` / `tokenfactory_endpoint_not_allowed` / `tokenfactory_model_not_allowed`：未明确启用本机 JPEG 发送、地址不等于固定官方 API 或模型不在本路线白名单；调用前拒绝。
- `tokenfactory_inline_jpeg_required` / `frame_limit` / `tokenfactory_request_limit`：拒绝外链、非 JPEG、超过8帧或19MiB请求；预留/调用前校验。
- `tokenfactory_embedding_input_limit`：超过100完整窗口或单文本8000 UTF-8字节；不截尾、不静默发布完整索引。
- `tokenfactory_asr_not_supported`：本路线不发送音频，不能回答音轨问题。
- `tokenfactory_incomplete_response` / `invalid_tokenfactory_response`：截断、拒绝、工具调用或无效回复；已dispatch的调用标记unknown，禁止自动重发或退款。

### 私有模型调用诊断

对已 dispatch 的调用，操作者现在可在服务日志中的 `model_attempt` 和私有
`model-results/<sha256(attempt_id)>.diagnostic.json` 查询有界诊断元数据。
记录阶段、HTTP 状态、经过格式白名单检查的上游请求 ID、结束原因、有限整数
token 用量、响应字节数与耗时。不记录请求/响应正文、JPEG、密钥、异常原文或推理内容；
文件权限为 0600，并随所属私有素材目录按原 TTL 清理，不新增公开读取接口。

- `http_status`：HTTP 失败；用 `http_status` 与上游请求 ID 区分 503 等响应。
- `timeout` / `transport`：本地有限超时或传输失败，不推断供应商是否完成或收费。
- `response_json_invalid`：JSON 解码失败；`stage` 区分外层响应与适配器内部解析。
- `internal_error`：dispatch 后出现未预期的内部异常（例如结果缓存写入失败）；调用标记为 unknown，诊断不包含异常原文。
- `tokenfactory_incomplete_response` 加 `finish_reason=length`：供应商返回截断；
  不提高 4096 输出上限，不接受残缺证据，不自动重新调用。
- `model_output_limit`：响应超过现有 4 MiB 边界，维持拒绝行为。

HTTP/API 的 `model_unknown` 和恢复控制协议保持不变。诊断不释放 unknown 金额、
不退调用数、不创建审批，也不能让完成或未知请求重新 dispatch。诊断文件写入失败
只写不含路径/异常原文的告警，不把已完成结果变成重试。旧调用没有这些记录时，
不能依据新离线模拟反推它的实际失败原因。
