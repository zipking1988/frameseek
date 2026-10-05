# API与输出契约

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

Owned `GET /api/runtime/status` returns mode, local checks/model roles, runtime blockers, `dispatch_prerequisites_met`, `live_verified:false` and `model_requests_sent_by_check:0`; responses use `Cache-Control: no-store`. It reveals credential presence, never values or endpoint URLs, and reads existing current-owner/deployment budget records without authorizing calls. `dispatch_prerequisites_met` is a local prerequisite summary; each real operation still checks actual required calls/resources atomically. It is not provider connectivity, quality, billing or deployment acceptance. Use the workspace **模型与预算** dialog or the CLI in [WORKSPACE_RUNTIME](WORKSPACE_RUNTIME.md).
