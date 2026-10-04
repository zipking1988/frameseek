# API与输出契约（D1）

当前为本地fixture交互服务：`GET /`、`GET /health`、`GET /docs`、`GET /openapi.json`、`GET /docs/errors`，以及`GET /demo/catalog`固定问答目录、`GET /demo/video`合成视频（支持Range请求）、`/static/*`静态界面和`/media/demo_parcel/frames/*`公开合成帧。只有demo_parcel媒体公开；没有真实用户素材存储或读取接口。session、upload、jobs、chat和delete接口未实现，返回404。

`/openapi.json`包含Answer与QueryControl的数据合同、health和demo读取路径，不包含未实现的chat操作。浏览器提问仅匹配已下载的固定问答目录，未知问题保留草稿并提示演示边界；本地文件通过blob URL播放，不上传，也不能提问。`docs/schema/`保存同一模型生成的JSON Schema；schema版本0.1仍属开发期，完整请求/worker协议在对应实现阶段冻结。

导出文件：[Answer](schema/answer-0.1.json)、[QueryControl](schema/query-control-0.1.json)、[四状态合成样例](schema/fixtures-0.1.json)。修改模型后运行`make schema`重新生成；`make check`会检测导出漂移。

Answer始终包含schema_version、status、timebase、answer、events、unresolved、followups、trace及errors。事件时间与证据时间使用原视频绝对秒数，人类时间必须等价；证据须在事件区间且属于同一视频。support_score与support_level互斥，公开debug为null，未测量支持分量时必须使用level。

JSON Schema检查字段、状态组合与support互斥/非空；时间等价、证据区间/视频归属和计数关系由服务端Pydantic校验补充。仅通过JSON Schema不足以证明证据有效，上传与模型输出仍需后续真实验证。

| 最终status | 必须满足 |
|---|---|
| ok | 有合法事件，无unresolved或处理错误 |
| partial | 有合法事件和unresolved |
| no_result | 成功查找无证据命中；events/unresolved/errors为空 |
| error | 无合法事件，至少一条结构化失败信息 |

future查询恢复控制：kind=query_control，state=pending（带2–10秒重试间隔）或unknown（停止自动轮询）。不含status，不增加第五种最终回答；HTTP202/409、同request_id恢复、持久lease/完成结果与未知不重发在后续任务实现，当前只有类型与测试。

固定合同样例：运行`make eval-fixture`。其事件、URI与说明均为合成样例，未证明真实证据或模型效果。

将随后续功能交付的接口清单及完整owner/CSRF/代际/幂等要求见ARCHITECTURE.md中的X02、E04和E17。


## 2026-10-04 workspace endpoints

See [runtime/workflow](WORKSPACE_RUNTIME.md). GET /api/session initializes cookie/CSRF; owned investigation CRUD uses PUT revision CAS. POST /api/videos accepts bounded raw video bytes, not a URL; GET /api/videos/{id} exposes actual job stages. POST analyze/retry/cancel and DELETE use the same owner/CSRF gate. Private /media/{id}/video supports Range; /media/{id}/frames/{file} checks owner and expiry. POST /api/chat/prepare validates context, POST /api/chat executes one idempotent request; GET /api/investigations/{id}/requests restores durable query controls/results without model dispatch. OpenAPI publishes the concrete input models alongside frozen Answer/QueryControl.

切换调查时 `POST /api/investigations/{id}/requests/{request_id}/cancel`：按会话拥有权终止当前查询，保留已验证的部分证据或明确取消错误。已发出的单次调用仍记账；后续模型阶段不再 dispatch。取消结果持久化且幂等，迟到模型结果不能覆盖它。
