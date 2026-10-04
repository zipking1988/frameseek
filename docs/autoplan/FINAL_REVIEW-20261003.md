# /autoplan Review Complete — PENDING USER APPROVAL

计划保持通用单视频对话Agent全部MVP：摄取/ASR/视觉粗标注→混合索引→受控zoom/Agent→时间证据/JSON/追问。实现组织为FastAPI单应用、SQLite持久worker及独立模型服务，先真实可核对切片，再完整流程与评测；不把fixture当模型表现。

## Decisions Made

47项记录：40 Mechanical自动决定、6 Taste暂定、1 User Challenge待用户。D17原先只以叙述记录，本汇总补为表格；没有新方向决定。审核通过表示计划完成，不等于已实现或最终批准。

## User Challenge U1 — 一小时视频与30次粗标注上限冲突

原方向：≤120s窗口、相邻5s重叠、完整小时支持、粗标注30次保护。3600s连续视频按ceil((3600-120)/115)+1至少32窗，scene切分可更多，不能截尾冒充完成。CEO独立native指出且工程核验；外部声音缺失，不能写“两模型确认”。

建议：按实际N做预估并设置用户批准的有限调用/金额封顶，超额拒绝，费用/配额D1实测后确定；32不是通用所有小时的充分额度，不能以config默许无上限开销。盲点：尚无GPU账户/价目/采样效果实测，可能单窗延迟就无法满足原目标。若建议不合适，继续30保护、拒绝超预算素材；完整小时验收明确blocked。原方向在明确改变前仍有效。

## Your Choices — 六个暂定Taste

1. C1（CEO）：本地复制事件时间引用；P2/P5。替代是只复制JSON，少按钮但复核引用更费事，不新增分享服务。
2. C2（CEO）：带持续标记的本地fixture模式；P3/P5。替代是只走真实GPU路径，较少模式代码但开发者需先有GPU账户；真实GO仍必做。
3. C3（Design）：桌面视频60%/问答40%；P5。替代50/50或聊天优先，影响可视证据面积，不改变手机单列。
4. C4（Design）：浅色主题、IBM Plex/Noto Sans SC及fallback；P5。替代中性系统字体/不同配色，字体打包与DESIGN规范需同步。
5. C5（Design）：证据seek维持播放/暂停；P5。替代点击即播，减少操作但可能突然出声；时间定位必须相同。
6. C6（Eng）：独立prepare澄清控制协议；P5。替代单chat端点独立控制envelope，四查询status不变；客户端分支/文档随选择调整。

## Review Scores / Voice Coverage

| Phase | 评审结果（计划层） | Host | Native | Outside provider/status | Consensus |
|---|---|---|---|---|---|
| CEO | spec 6→9/10，两次规格检查确认10问题修复；策略11sections完整，U1未决 | codex | 完成5 findings，另spec两次 | Codex unavailable: under_codex | N/A |
| Design | 七维Step0=4；六passes4/5/4/3/2/2→8/9/8/8/8/9，overall=min六passes=8；没有approved PNG | codex | 完成6 findings | Codex unavailable | N/A |
| DX | 八维2/3/4/3/2/3/2/2→8/8/9/8/8/8/7/8；mean8/10 | codex | 完成5 findings | Codex unavailable | N/A |
| Eng | architecture6/code3/perf4；24测试路径簇；计划critical gap0 | codex | 完成6 findings | Codex unavailable | N/A |

所有phase无skip；native为同宿主独立上下文，具体model identity unknown，不称Claude完成。外部覆盖缺失使评审DONE_WITH_CONCERNS，不能标无风险双模型PASS。图像工具因无OpenAI API key未产图，HTML草图未批准，像素验收未完成。DX完整冷启动TTHW unknown，fixture目标2–5分钟未测，real unknown；当前无应用/测试可运行。

## Cross-Phase Themes

- CEO与Eng：真实价值需跨窗候选与证据验证，合法JSON/演示不能证明召回；诊断和基线前置。
- CEO与Eng，Design承接：预算在所有尝试前检查，未知云完成状态不自动重复付费；UI显示未查范围。
- Design与Eng：追问锚点、单在途、generation拒迟到结果与已删证据失效必须贯通。
- DX与Eng：公共HTTP/控制响应/错误/重复请求均有明确类型，fixture和real区别必须可诊断。
- CEO与Eng：目标未实测，费用/显存/完成率/失败样本不能隐去，先同集验证再优化。

## Deferred to TODOS.md

原V1/V2四组：多视频与复杂上下文（先证明单视频）、身份/说话人分离（独立标注/隐私边界）、bbox/领域增强/公开API（后续需求与模型）、分布式容量平台（真实单机负载触发）。不删MVP、不新增付费产品或遥测任务。完整what/why/effort/dependencies已存TODOS.md。

## Implementation Tasks (aggregated across phases)



本次22条原始任务，按priority/phase排序、仅exact-match去重（0条完全重复）。未相同的重叠保留，不能把22条工时相加；Files在实施时按E07归一，不修改历史task。当前无Git，过滤键明确为本轮run_id、branch=nongit、commit=unknown，替代空commit-window，不混入其他任务。全部unchecked。

- [ ] **CEO-T8 (P1, human: 4h / CC: 1h)** — 部署回滚及赛事材料
  - Surfaced by: ceo-review — C12真实可复现交付
  - Files: docs/deployment.md, README.md, LICENSE
  - Possible duplicate/shared files: CEO-T1, Eng-T7, DX-T1, DX-T3；共同实现但逐项保留验收。
- [ ] **CEO-T2 (P1, human: 6h / CC: 45min)** — schema/时间/支持与文档一致
  - Surfaced by: ceo-review — C02-C03/C14契约漂移
  - Files: src/frameseek/schema.py, src/frameseek/media.py, ARCHITECTURE.md, profile.md
  - Possible duplicate/shared files: Eng-T4, Eng-T7, DX-T2, Eng-T6；共同实现但逐项保留验收。
- [ ] **CEO-T3 (P1, human: 1d / CC: 2h)** — 持久分窗/能力manifest与预算
  - Surfaced by: ceo-review — C08/C13半索引和预算放大
  - Files: src/frameseek/ingest.py, src/frameseek/jobs.py, src/frameseek/storage.py, src/frameseek/agent.py
  - Possible duplicate/shared files: CEO-T5, Eng-T4, Eng-T3, Eng-T2, Eng-T8；共同实现但逐项保留验收。
- [ ] **CEO-T1 (P1, human: 4h / CC: 1h)** — 真实模型与配额预检
  - Surfaced by: ceo-review — C06模型/云能力尚未验证
  - Files: scripts/preflight.py, README.md, docs/deployment.md
  - Possible duplicate/shared files: CEO-T8, Eng-T7, DX-T1, DX-T3；共同实现但逐项保留验收。
- [ ] **CEO-T5 (P1, human: 1d / CC: 90min)** — 拥有权/TTL与删除竞态
  - Surfaced by: ceo-review — C09/C15隐私闭环
  - Files: src/frameseek/api.py, src/frameseek/storage.py, tests/test_lifecycle.py
  - Possible duplicate/shared files: CEO-T3, Eng-T4, Eng-T2, Eng-T8, DX-T2；共同实现但逐项保留验收。
- [ ] **CEO-T6 (P1, human: 1d / CC: 3h)** — 早期基线/原指标与消融
  - Surfaced by: ceo-review — C18/C19发现性能风险太晚
  - Files: eval/run.py, eval/baselines.py, docs/evaluation.md
  - Possible duplicate/shared files: CEO-T4, Eng-T3, Eng-T5, Eng-T7；共同实现但逐项保留验收。
- [ ] **CEO-T4 (P1, human: 1d / CC: 3h + 标注)** — 四类真实问题诊断集
  - Surfaced by: ceo-review — C17合法JSON不能证明核心价值
  - Files: eval/diagnostics.json, eval/run.py
  - Possible duplicate/shared files: CEO-T6, Eng-T3, Eng-T5, Eng-T7；共同实现但逐项保留验收。
- [ ] **Design-T2 (P1, human: 1天 / CC: 1小时)** — 实现证据定位与过期删除失效
  - Surfaced by: design-review — H1/H4
  - Files: src/frameseek/static/index.html, src/frameseek/static/app.js, src/frameseek/static/styles.css
  - Possible duplicate/shared files: Design-T1, CEO-T7, Design-T3；共同实现但逐项保留验收。
- [ ] **Design-T1 (P1, human: 2天 / CC: 2小时)** — 实现上传任务与问答状态恢复
  - Surfaced by: design-review — H2/H3/M5/M6
  - Files: src/frameseek/static/index.html, src/frameseek/static/app.js, src/frameseek/static/styles.css
  - Possible duplicate/shared files: Design-T2, CEO-T7, Design-T3；共同实现但逐项保留验收。
- [ ] **Eng-T4 (P1, human: 6h / CC: 1h)** — typed澄清与按问题/revision缓存
  - Surfaced by: eng-review — A4-A5/E04-E05
  - Files: src/frameseek/api.py, src/frameseek/schema.py, src/frameseek/agent.py, src/frameseek/cache.py, tests/test_context.py, tests/test_cache.py
  - Possible duplicate/shared files: CEO-T2, CEO-T3, CEO-T5, DX-T2；共同实现但逐项保留验收。
- [ ] **Eng-T3 (P1, human: 1d / CC: 2h + 标注)** — 前置真实跨窗候选与GO依赖
  - Surfaced by: eng-review — A3/E03
  - Files: src/frameseek/ingest.py, src/frameseek/retrieval.py, eval/diagnostics.json, eval/run.py
  - Possible duplicate/shared files: CEO-T3, CEO-T6, CEO-T4, Eng-T5, Eng-T7；共同实现但逐项保留验收。
- [ ] **Eng-T2 (P1, human: 1d / CC: 2h)** — 持久attempt、query幂等与worker lease
  - Surfaced by: eng-review — A2/E02
  - Files: src/frameseek/storage.py, src/frameseek/jobs.py, src/frameseek/attempts.py, tests/test_attempts.py
  - Possible duplicate/shared files: CEO-T3, CEO-T5, Eng-T8, Eng-T1；共同实现但逐项保留验收。
- [ ] **Eng-T5 (P1, human: 1d / CC: 2h)** — 冻结指标分母及24路径回归
  - Surfaced by: eng-review — A6/Test/E06/E11
  - Files: eval/run.py, eval/baselines.py, docs/evaluation.md, tests/test_metrics.py, tests/*
  - Possible duplicate/shared files: CEO-T6, CEO-T4, Eng-T3, Eng-T7；共同实现但逐项保留验收。
- [ ] **Eng-T8 (P1, human: 6h / CC: 1h)** — 原子manifest及expiry删除升级闭环
  - Surfaced by: eng-review — Architecture/X05/E12
  - Files: src/frameseek/lifecycle.py, src/frameseek/storage.py, src/frameseek/jobs.py, tests/test_lifecycle.py, tests/test_migrations.py
  - Possible duplicate/shared files: CEO-T3, CEO-T5, Eng-T2；共同实现但逐项保留验收。
- [ ] **Eng-T7 (P1, human: 6h / CC: 1h + 实机)** — 流式采样批量检索成本阶段实测
  - Surfaced by: eng-review — Q3/P1-P4/E09-E10
  - Files: src/frameseek/media.py, src/frameseek/index.py, src/frameseek/retrieval.py, eval/run.py, docs/deployment.md
  - Possible duplicate/shared files: CEO-T8, CEO-T2, CEO-T1, CEO-T6, CEO-T4, Eng-T3, Eng-T5, DX-T3；共同实现但逐项保留验收。
- [ ] **Eng-T1 (P1, human: 1d / CC: 2h)** — 全局admission与有限Agent调用账本
  - Surfaced by: eng-review — A1/E01
  - Files: src/frameseek/config.py, src/frameseek/attempts.py, src/frameseek/models.py, tests/test_limits.py
  - Possible duplicate/shared files: Eng-T2；共同实现但逐项保留验收。
- [ ] **DX-T2 (P1, human: 1天 / CC: 1小时)** — 冻结HTTP错误契约和客户端示例
  - Surfaced by: devex-review — DX2/DX3 Pass2/3
  - Files: src/frameseek/api.py, src/frameseek/schema.py, docs/api.md, docs/errors.md
  - Possible duplicate/shared files: CEO-T2, CEO-T5, Eng-T4；共同实现但逐项保留验收。
- [ ] **DX-T1 (P1, human: 2天 / CC: 2小时)** — 实现双模式快速开始预检配置
  - Surfaced by: devex-review — DX1/DX5 Pass1/6
  - Files: pyproject.toml, Makefile, .env.example, README.md, scripts/preflight.py
  - Possible duplicate/shared files: CEO-T8, CEO-T1；共同实现但逐项保留验收。
- [ ] **CEO-T7 (P2, human: 4h / CC: 45min)** — 证据五状态/引用重置
  - Surfaced by: ceo-review — C11错误/partial区分
  - Files: src/frameseek/static/index.html, src/frameseek/static/app.js, src/frameseek/static/styles.css
  - Possible duplicate/shared files: Design-T2, Design-T1, Design-T3；共同实现但逐项保留验收。
- [ ] **Design-T3 (P2, human: 1天 / CC: 1小时)** — 实现响应式可访问性与主题
  - Surfaced by: design-review — Pass4/5/6 TasteC3–5
  - Files: src/frameseek/static/index.html, src/frameseek/static/app.js, src/frameseek/static/styles.css, DESIGN.md
  - Possible duplicate/shared files: Design-T2, Design-T1, CEO-T7；共同实现但逐项保留验收。
- [ ] **Eng-T6 (P2, human: 4h / CC: 45min)** — 统一package assets和共享授权安全示例
  - Surfaced by: eng-review — Q1-Q2/E07-E08
  - Files: src/frameseek/auth.py, src/frameseek/static/*, ARCHITECTURE.md, profile.md
  - Possible duplicate/shared files: CEO-T2；共同实现但逐项保留验收。
- [ ] **DX-T3 (P2, human: 1天 / CC: 1小时)** — 交付分阶段文档版本迁移与冷启动测量
  - Surfaced by: devex-review — DX4 Pass4/5/8
  - Files: docs/getting-started.md, docs/configuration.md, docs/deployment.md, CHANGELOG.md, CONTRIBUTING.md
  - Possible duplicate/shared files: CEO-T8, CEO-T1, Eng-T7；共同实现但逐项保留验收。

## Implementation order / risk

D1包/schema/配置与真实模型预检；D2–3真实8问诊断切片含最小跨窗候选；D4–6完整摄取/manifest/TTL；D7–9混合检索/zoom/性能初测；D10–12多轮；D13–16UI；D17–20冻结全部评测/消融；D21–24部署回滚/真实smoke/赛事材料；D25–27缓冲。Day索引继承原排期，实施开始时映射实际日期，已过去的10/03不算已完成一天，不能削验收伪称赶上。时间/GPU/人工标注未测，若不能完成必须报告差距与用户方向选择。

## Pre-gate verification

CEO全sections/前提/救援/失败registry/NOT scope/existing/dream/completion/consensus；Design七维/每问题决策/litmus；DX八维/旅程/叙事/TTHW/checklist/consensus；Eng代码缺席已说明、架构图/24路径图/测试artifact/registry/TODO/completion/consensus均保存。四phase先close packet完整回读、语义核对并依次发布；未决U1及C1–C6仍pending/provisional。原source docs未写改，accepted C/G/X各块保留，Eng补全E01–12。当前未开展实施、真实GPU、测试执行或部署，review logs依parent仅在批准后写；这些不是“tests pass”。

## Final Approval Gate

建议先B2解决U1，再重跑Eng确认预算变化；A允许批准其他计划但不会自动改变30次保护或将小时目标标完成。A approve as-is；B approve with overrides（指出C1–C6/具体条款后重跑受影响phase＋Eng）；B2 resolve user challenges（逐一选保留或调整U1，重跑Eng）；C interrogate（先解释再回门）；D revise（修改后重跑受影响phase＋Eng，至多3轮）；E reject（重新开始）。没有最终批准不能同步源技术契约或称实施可ship。

## GSTACK REVIEW REPORT

Skill: autoplan；Host: codex；Status: REVIEW_COMPLETE_PENDING_APPROVAL / DONE_WITH_CONCERNS。Run: frameseek-autoplan-20261003；Completed CEO/Design/DX/Eng，outside unavailable all4，native completed all4，consensus confirmed0/disagree0（N/A，不是已确认无分歧）。47 decisions=40 mechanical+6 taste+1 pending user challenge；source root unchanged；22 aggregated exact-match task rows；24 test clusters unimplemented/unrun；4 TODO groups；models/GPU/language/performance/cost unknown；U1 hourly goal blocked。Approval: pending。Review dashboard logs not yet written per parent final gate rule。
