# D1本地实施记录

2026-10-04。本记录承接[D55:A批准](autoplan/APPROVAL.md)，实际实施从今天计D1，不把前一天的评审算作已交付开发日。状态为**本地基础完成，D1真实环境资格核对待完成**；不是MVP完成或D2–3 GO。

最新交付：桌面画布、调查持久化、多视频素材库、私有媒体、有限媒体预检、完整索引与 NVIDIA/Nebius 多轮问答适配器已实现。后端94项、前端47项测试通过；模型链路仅用 mock transport 验证，真实模型请求0、GPU启动0。服务可在具备有效 runtime 与明确批准预算后启用真实模式；当前仍为 fixture。实际状态与配置见 [WORKSPACE_RUNTIME](WORKSPACE_RUNTIME.md)，浏览器证据见 `docs/workspace-20261004`。

尚待真实端点权限、有限数值预算、计费/停费校准、音轨与模型质量评测、1小时性能和 Linux/生产部署验收。原26项任务没有整体打勾。

## 首次基础交付记录（历史）

以下保留最初 D1 的实施情况，后续实现以以上最新交付及 WORKSPACE_RUNTIME 为准。

后续同日修正：原技术状态首页已替换为可操作的fixture工作区。示例问答、真实合成媒体播放/seek、四状态呈现和本地文件隔离现已实现，最终本地测试为82项。以下81项与原首页检查保留为首次基础交付记录；当前界面和补充验证以[PREVIEW_STATUS](PREVIEW_STATUS.md)为准。

## 已完成

| 本地基础 | 实际行为与验证 |
|---|---|
| 包与CPU依赖 | 单一Python包、FastAPI开发服务、`uv.lock`；本机Python 3.13.12、uv 0.10.12安装成功；GPU推理依赖与权重未安装 |
| 有限配置 | env > TOML > 默认；未知项、非法数值和布尔限额拒绝；120秒/5秒重叠/1 FPS/128帧及30/0/3/1保护不可由普通配置升额；错误不回显输入 |
| 输出契约 | 四最终状态、绝对秒与人类时间等价、证据区间/视频归属、support字段互斥、公开debug为null；pending/unknown独立控制类型；2份JSON Schema与4份合成样例可重生成并检查漂移 |
| 完整分窗 | 连续3600秒为32窗；镜头边界可产生更多窗；尾部覆盖、5秒重叠、每窗≤120秒；这是纯时间规划，尚未解码真实视频或验证VFR PTS |
| 本地attempt账本 | SQLite WAL与短事务；owner/部署总量原子预留，争最后额度只有一个成功；撤销/降额阻止尚未dispatch；unknown重启后保留且不可自动重发；版本不兼容拒绝隐式重建 |
| 预检与服务 | 仅fixture开发服务；真实模式固定拒绝启动；预检只检查本地配置/工具并列出缺项，没有联系模型供应商或分配GPU |
| 文档同步 | ARCHITECTURE/profile承接批准条款；完整Answer示例经Pydantic和JSON Schema校验；README/API/配置/错误区分当前与未来能力 |

SQLite批准记录与金额仅存在于合成测试。当前没有HTTP批准接口、真实审批工作流、供应商费用估计、资源释放控制或模型dispatcher；不能据此批准真实支出。默认30窗保护的本地检查不是收费准入。

## 已运行验证

- `make test`：**81 passed**，本机macOS / Python 3.13.12，0.45秒。覆盖配置15、分窗22、schema24、账本17、本地API3项。
- `make check`：ruff lint、格式检查及schema导出一致性通过。
- localhost实际进程启动：`/`、`/health`、`/openapi.json`、`/docs`、`/docs/errors`均HTTP200；OpenAPI仅公开已实现的`/health`业务路径，没有虚构chat操作。
- fixture CLI预检退出0；real CLI预检退出2，`real_ready=false`。模型请求0，GPU资源启动0。
- 四状态固定样例通过JSON Schema与服务端校验；profile两份、ARCHITECTURE一份完整回答示例也通过相同校验。样例媒体URI没有对应真实素材。

锁定的主要基础版本：FastAPI 0.142.2、Pydantic 2.13.5、Uvicorn 0.54.0、pytest 9.1.1、ruff 0.16.10、jsonschema 4.26.0。依赖来源版本由`uv.lock`记录；只验证本机安装，Linux冷启动与2–5分钟首次成功体验尚未测量。

这些测试只完成[29路径簇](autoplan/test-plan-20261004.md)的局部基础：01配置、02/03模式与预检、07时间分窗、10 attempt持久状态、17/18输出合同、25原子预算、29恢复控制类型。并未覆盖这些簇的完整HTTP/worker/真实执行断言；[26项综合任务](autoplan/IMPLEMENTATION_TASKS.md)仍未逐项验收，不整体打勾。

## 待完成与下一步

D1还需要取得真实模型/修订访问权限，核对Nebius账户GPU/配额及推理镜像兼容性，并实现和验证媒体隔离与有限CPU/RSS/磁盘/输出/进程时限。服务端批准版本、单价/计费单位、GPU分配/启动/加载/空闲/失败占用、停止余量与释放上界也需核对；具体调用/金额/校准预算仍待单独确认。

上传、会话拥有权、CSRF、真实摄取/PTS、持久任务/lease、TTL/删除、检索与模型adapter、查询HTTP恢复、公平GPU调度、问答UI与证据播放器均在后续实现。具备权限、有限预算与技术准入后，再按批准计划执行D2–3真实四类8问和最小跨窗候选诊断；不以fixture成绩替代真实GO或小时级验收。

启动与复现命令见[README](../README.md)。本地开发服务仅绑定`127.0.0.1:8765`，没有部署。

## autoplan收尾

CEO → Design → DX → Eng四阶段完成，D55:A接受整份计划与C1–C7默认。原生独立上下文复核发现数依次5 / 6 / 5 / 4；外部独立模型复核在当前Codex环境不可用，跨模型共识N/A，不宣称双模型一致。完整决策、任务及8条评审日志见[批准记录](autoplan/APPROVAL.md)和[最终评审](autoplan/FINAL_REVIEW.md)。批准计划不等于工程实现或真实指标通过。
