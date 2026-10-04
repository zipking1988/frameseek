# FrameSeek 开发体验评审

## Step 0A：Persona / 范围

Product type为API/service及贡献者部署文档，模式DX POLISH；没有外部SDK产品或托管试用服务的授权范围。典型开发者为独立Python开发者/赛事评审，在Mac或Linux启动UI和契约演示，再接Nebius GPU，预期一条明确路径和可诊断失败；根据原架构、排期与C12推断，不能称为用户访谈结果。当前没有README、包配置、CLI、运行输出、CHANGELOG或代码；已有源架构、产品文档、计划与TODOS。无历史DX分数、无跨项目学习、无测得TTHW。

## Step 0B：Developer Perspective

“我看到这份设计要从视频里找事件，再让我点击原画面核对。模型输入长度、时间戳和隐私限制写得很清楚，这使我知道作者考虑了真实边界。我在Mac上想先看一次问答和证据跳转，然后再把真正的视频送到Nebius。我找不到可执行的快速开始，因为当前项目确实只有设计文档，尚无README和包定义；这是当前已观察的缺项，不能推断未来命令会报什么错误。我希望不必先申请GPU、下载几十GB权重，才知道播放器和JSON长什么样。计划要求fixture演示，所以我愿意先运行明确标为演示的素材，但我不会把固定答案理解成模型能力。接入真实服务时，我需要知道哪个地址、模型revision、密钥和显存检查是必要的，哪些设置可以改，哪些边界必须守住。遇到失败时，我想看到失败阶段和下一步修复，而不是只有error。我也希望重新运行不会把同一视频重复扣费，升级后能知道索引需不需要重建。这里除文档缺项外均是对新开发者期待的预测，尚未通过实际上手观察验证。”

以上为本轮推断叙事，autoplan按P5采用为评审视角，不是假定用户确认或已测体验。

## Step 0C：竞争参照与时钟

Aside未安装，已复用本轮探测，用网页查询一手文档。竞品文档只证明步骤，没有新用户计时，不能用SDK代码长度宣称2分钟完成视频索引。对FrameSeek选择既定C2本地fixture作为最先到达的开发反馈，完整计时起点包含源码获取、说明阅读、前置条件、安装及首次运行，终点为醒目标记的演示查询和证据回跳；目标2–5分钟，未测，缺Python/网络慢可导致不达标。真实路径另计账户/配额、镜像、模型下载、真实摄取到证据回跳，时间未知，不能用fixture替代。

| 工具 | 起点→结果 | 时间/证据 | DX选择 | 来源 |
|---|---|---|---|---|
| TwelveLabs | 账户/SDK/上传索引→时间片段搜索 | 未测；官方说明步骤 | 复制完整SDK搜索示例，先索引再查询 | [官方快速开始](https://docs.twelvelabs.io/docs/get-started/quickstart/search) |
| NVIDIA NIM | GPU/Docker/镜像→服务首请求 | 未测；官方说明前置条件 | GPU路径先检查前置条件，不假装无安装 | [官方前置条件](https://docs.nvidia.com/nim/large-language-models/latest/get-started/prerequisites.html) |
| FrameSeek当前 | 两份设计文档→无可运行结果 | unknown，不可计时 | 尚未实现 | 本工作区 |
| FrameSeek计划 | 完整冷启动→带标记fixture问答/seek | 目标2–5min，估计有依赖阻碍 | make setup / make demo | C12、X01 |

选择Competitive目标由autoplanP5授权，不授权遥测、重复监控或新托管渠道。预计已有Python/Make环境可能5分钟内完成，完全干净机器时间未知，必须保留该差异。正式计时结果未测前不写“冠军级DX”。

## Step 0D/E：首次价值与模式

首次价值是查询马上出现一条可点击的事件证据，在已标记的演示素材上核对，同时能查看同一输出契约。最低成本载体是原C12的fixture模式，不新增云沙盒、收费试用或公共SDK。原生视频与静态UI使本地反馈不必依赖GPU；通过真实preflight后才开放real模式，禁止失败时静默切演示。DX POLISH由autoplan明确选择，不靠评分压力扩大范围。

## Step 0F：九阶段旅程

| 阶段 | 开发者动作 | 已见缺项/风险 | 本计划处置 |
|---|---|---|---|
| Discover | README了解用途/能力 | README未实现 | D1顶部说明视频证据闭环、Nebius/NVIDIA职责 |
| Evaluate | 演示查询/seek | fixture承诺未有命令 | 独立演示模式、无GPU/付费调用 |
| Install | 安装锁定依赖 | 包与支持平台未定 | setup验证声明的Python，轻量默认依赖 |
| Hello world | 本地一次查询 | 尚不可运行/计时unknown | 完整冷启动计时，2–5min目标 |
| Integrate | 上传/轮询/问答 | 无公共端点表 | 冻结X02接口与cookie/幂等约定 |
| Debug | 根据错误修复 | errors字段无对象结构 | X03错误目录＋request_id，不泄露原文 |
| Upgrade | 更新代码/模型 | schema版本已有、兼容规则缺 | X05应用/存储/索引版本和回滚 |
| Scale | 增大视频与请求 | 原预算/资源限制 | 清楚并发/队列/预算保护，不新增分布式部署 |
| Migrate | 替换已授权模型接口 | revision/接口文档缺 | 受限adapter示例与索引重建策略 |

## Step 0G：首次上手混淆报告

这是计划角色扮演，不是运行轨迹。T+0:00看到ARCHITECTURE.md部署和待验证列表；T+0:30查找README，当前无该文件；T+1:00希望找到fixture启动命令，现有C12只有交付承诺；T+2:00不知道如何配置model endpoint或获得ready；T+3:00只能返回设计文档，不能认定成功。X01–X04将这些缺项变成精确命令、配置和教程，实际时间仍待冷启动测量。不存在捕获到的错误文案，以下均清楚标记为推荐契约。

## Step 0.5：独立声音

Native INPUT dx ad7552a30697bf03e3a69df7a1a380cdfaa05a465fdf84d98b93f8bfec1b652f，完整440行，完成5项发现：快速开始high、公共接口high、错误high、文档medium、配置medium。外部模型unavailable（under_codex），没有跨模型确认。主要代理与outside关系不能用名字推断为Claude和Codex两个家族。

| 维度 | Native | 外部 | 共识 |
|---|---|---|---|
| Getting started<5min | high不可执行，不能估时 | unavailable | N/A |
| API可猜测 | high公共端点未定 | unavailable | N/A |
| 错误可修复 | high错误结构未定 | unavailable | N/A |
| 文档可找到 | medium教程/示例未全 | unavailable | N/A |
| 升级安全 | 未明确判定 | unavailable | N/A |
| 环境摩擦 | medium配置规则缺 | unavailable | N/A |

## Pass 1：Getting Started — 2→8

Pass1 Hall of Fame已读；取“一个明确入口”和先体验的原则，不套用付费模型无前置条件的假设。拟定三步：源码进入项目后`make setup`，`make demo`，打开终端给出的本地URL提交演示问题并点击证据；计时仍包括进入项目之前的获取/阅读。setup只安装本地UI/服务/fixture所需依赖，真实模型依赖分离，缺Python给准确版本与安装文档，缺ffmpeg只阻止real预检，不阻止静态fixture。预期标记`MODE=fixture`与URL只是拟定输出，不是已捕获日志。X01是原C12具体化，不新增服务；真实路径为setup→配置→preflight→worker/app→真实smoke，不能压缩成2分钟承诺。

## Pass 2：API/CLI — 3→8

Pass2参考已读，采用一致名词资源和幂等键，不把Agent内部工具暴露为公共接口。冻结下表，FastAPI生成OpenAPI供开发者查请求类型，但public debug默认关闭，媒体授权每次检查。上传返回202只表示已收取并建任务，ready才可问；轮询2秒起、失败指数退避到10秒、尊重Retry-After，无无限无界重试。支持curl cookie jar示例贯通完整生命周期，不为评分新增多语言SDK。

| 操作 | 拟定接口 | 返回/语义 |
|---|---|---|
| 会话主体 | POST /api/session | 随机主体cookie＋CSRF token；本地演示独立主体 |
| 上传 | POST /api/videos | multipart；Idempotency-Key；202 video_id/job_id/generation |
| 状态 | GET /api/jobs/{job_id} | stage/progress/capabilities/errors；已完成段数 |
| 重试/取消 | POST /api/jobs/{job_id}/retry 或 /cancel | 同素材任务，状态合法才受理；取消停止未来调度 |
| 对话 | POST /api/chat | video_id/session_id/generation/request_id/question；同步最终响应 |
| 重置 | POST /api/chat-sessions/{id}/reset | 新generation，旧请求不能提交 |
| 证据媒体 | GET /media/{video_id}/… | 主体校验、Range、expires检查；不暴露文件路径 |
| 删除 | DELETE /api/videos/{id} | 墓碑先禁止读；清理进度/失败可见；重复删除幂等 |

## Pass 3：Errors — 4→9

Pass3参考已读；三条主要路径分别为预算预检、模型超时和输出repair后仍失败。当前运行文案unknown，拟定错误对象code/stage/message/cause/retryable/suggested_action/docs_url/request_id；cause未知明说unknown，错误目录用本地有效文档路由/锚点，禁止假链接。预算例：“需要32个窗口，当前上限30；未开始推理；换更短素材，或等待批准预算调整”；超时例：“视频回看超时；服务未在期限内完成；检查服务健康后用新请求重试，旧尝试仍计预算”；schema例：“输出无法校验，一次文本修复仍失败；见request_id；检查schema/模型revision，不显示思维原文”。HTTP输入/授权/不存在/未ready/过期/限流/模型失败分别400或422、401/403、404、409、410、429、502/504；无命中200，partial有合法证据200，不能将失败一律包成200error。结构字段与C02输出同在0.1首个冻结版本，错误与查询日志无原文/密钥/内部路径。

## Pass 4：Docs — 3→8

Pass4参考已读；使用README先导与Markdown参考，浏览器Ctrl/Cmd-F和目录可找到内容，不新建文档站搜索。README含用途、fixture/real区别、快速开始和主要限制；docs/getting-started.md为完整教程，docs/api.md、configuration.md、errors.md、evaluation.md、deployment.md逐步展开。四status、score/level互斥、降级、语言、ready/failed/cancelled/expired示例均来自可校验fixture，不让partial数值示例成为唯一模板。D1文档随包/配置出现，D2–3教程随真实切片，D4–12接口/错误随实现，D21–24只完成部署材料与发布校对。

## Pass 5：Upgrade — 2→8

Pass5参考已读；当前无已发布客户端，0.1可在首次冻结之前补全，但必须在CHANGELOG记录新增契约。区分应用版本、输出schema、SQLite迁移、索引模型revision/采样配置hash，加载不兼容索引须返回重建要求。升级前停止新任务、快照仍需保留的数据，在到期/删除名单上保持禁读，迁移有事务与失败回滚；模型变更新generation重建再原子发布，不覆写旧可读索引。初期没有复杂外部API弃用/codemod需求；将来破坏已发布契约时提供迁移说明，不能以没有用户为由放任版本漂移。

## Pass 6：Environment — 3→8

Pass6参考已读；Python包和受限model adapter提供类型与mock，静态HTML/JS减少Node构建前置条件。D1实际验证支持的Python及Mac/Linux，锁定CPU基础依赖和GPU镜像/额外依赖；本机Python3.14仅是检测结果，不能当依赖兼容结论。make test跑确定性contract/生命周期测试，make eval-fixture与make eval-real分开，real须显式配置且不在普通CI中花费云预算。配置参考规定env>配置文件>默认，密钥仅env，最终有效配置脱敏；scene阈值0.3、coarse帧12（可8–16）、candidate_k10/rerank_k5为待实测默认，120s/1FPS/128帧和当前30/3预算保持不可绕过。

## Pass 7：Community — 2→7

Pass7参考已读；项目目前没有用户、社区、响应者或开源发布，不能编造。原提交物要求公有源码、LICENSE、README、模型归属；计划补充简短贡献指南/复现测试说明及错误报告模板，不新增Discord或专人运营承诺。实际开源许可与所有媒体/模型权利清单在发布前确认，当前不把计划文件等同已发布许可。成本只报实测公式/有效配置和预算，未知云价明确未知；缺成熟生态使此维度保持7，不能为分数扩建平台。

## Pass 8：Measurement — 2→8

Pass8参考已读；用本地手工计时表记录起始环境、读文档/安装/下载/启动/第一次成功各阶段，fixture与real严格分开。至少一次Mac和一次Linux冷启动检查，失败或未达标如实记录，不把warm命令运行时当人类上手。缺新用户时作者自测标author/self-test，不编造访谈样本；后续真实反馈通过错误报告，未授权产品遥测。2–5分钟是目标，达不到就报告原因，不能靠删前置步骤过关；无自动release gate或周期监控扩展。

## DX Scorecard

| Dimension | Initial | Plan after | Prior/trend |
|---|---|---|---|
| Getting started | 2 | 8 | 无历史 |
| API/CLI | 3 | 8 | 无历史 |
| Errors | 4 | 9 | 无历史 |
| Documentation | 3 | 8 | 无历史 |
| Upgrade | 2 | 8 | 无历史 |
| Environment | 3 | 8 | 无历史 |
| Community | 2 | 7 | 无历史 |
| Measurement | 2 | 8 | 无历史 |

Overall算术均值2.625→8/10（计划，不是实测）。TTHW当前unknown→fixture目标2–5min，真实unknown；competitive rank是目标非成绩；magical moment designed via C2 fixture；API/service、DX POLISH。原则覆盖：明确入口、动手教程、错误修复、可覆盖defaults但硬边界校验、完整上下文示例、证据回跳；社区规模仍未知。

## DX Implementation Checklist

- [ ] 完整fixture冷启动2–5min目标，记录前置条件和所有失败；real另计。
- [ ] setup单命令、demo明确fixture，无外部模型付费请求；首次证据可回跳。
- [ ] 全生命周期cookie/CSRF/幂等示例和错误目录，例子可运行可校验。
- [ ] 每可调配置有单位/范围/优先级，hard limits和budget不能绕过。
- [ ] 文档随对应功能完成，schema/模型revision对应，CHANGELOG和升级回滚指南。
- [ ] Mac/Linux环境与无GPU测试、非交互CI；无需TypeScript SDK，采用浏览器JS。
- [ ] LICENSE/归属/媒体权利发布前核查；贡献与错误报告指南。
- [ ] 文档目录及浏览器查找可用；社区频道/付费free-tier/遥测/codemod不在当前范围。

## NOT in scope / Implementation Tasks

外部SDK、多语言覆盖、云沙盒、文档站、社区运营、付费套餐、遥测、分布式scale不进入MVP；源V1/V2 TODO保持，不新增DX延期债务。拟定端点/命令都是待实现承诺，未声称存在。

- [ ] **T1 P1 human 2天 / CC 2小时**：实现轻量fixture/real快速开始、preflight与配置。Files: pyproject.toml, Makefile, .env.example, README.md, scripts/preflight.py。Verify: 冷启动两平台、模式明确、普通测试不花云费。
- [ ] **T2 P1 human 1天 / CC 1小时**：冻结HTTP与错误对象，完整cookie生命周期示例。Files: src/frameseek/api.py, schema.py, docs/api.md, docs/errors.md。Verify: OpenAPI/四status/错误/幂等/schema fixture。
- [ ] **T3 P2 human 1天 / CC 1小时**：随功能文档、升级/索引版本/迁移与手工DX计时。Files: docs/*, CHANGELOG.md, CONTRIBUTING.md。Verify: 示例执行、升级失败回滚、记录两种TTHW。

## 决策与完成状态

X01–X06逐项Mechanical，autoplanP1/P5依据既有C12交付展开；X02只定义既定端点，不新增开发者API产品。没有新增User Challenge或Taste，源预算U1仍未决。全部8passes与9阶段完成，native5问题已补，outside unavailable；尚无执行结果。状态DONE_WITH_CONCERNS：上手时间未知、GPU/account不可实测、生态新项目；记录后交工程评审验证新增契约一致性。
