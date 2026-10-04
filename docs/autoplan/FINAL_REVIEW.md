# /autoplan Review Complete — APPROVED — D55:A

计划保持通用单视频对话Agent全部MVP：摄取/ASR/视觉粗标注→混合索引→受控zoom/Agent→时间证据/JSON/追问。实现组织为FastAPI单应用、SQLite持久worker及独立模型服务，先真实可核对切片，再完整流程与评测；不把fixture当模型表现。

## Decisions Made

52个独立决策：44 Mechanical自动决定、7 Taste暂定、1 User Challenge已按D49:A解决；53项审计记录另含同一U1提出与human答复两条，不重复算新挑战。D50–54是本轮工程执行边界。最终整份计划已按D55:A批准，费用/校准数值仍待D1明确确认。

## U1 resolution — human D49:A

2026-10-04用户明确选择A：实际完整窗口数N＋已批准有限primary调用/金额准入；确认具体额度前仍primary30、coarse额外retry0。连续3600s至少32窗，镜头可能更多，不能固定32即宣称所有小时可支持。未知计费/上界/权限、额度不足则拒绝真实推理；本次政策批准不授权具体收费或校准。E13覆盖历史C05/C16/G02/X06/E09的旧30永久/方向pending描述，其余原义务完整保留。

新Eng完整复核已完成：独立native4点（媒体隔离、GPU占用费用、公平调度、断线查询恢复）＋parent原子预算竞态均映射E14–18与29簇测试。小时性能/模型可用性仍待真实测量，政策冲突已解决，无新未答User Challenge，不再推荐重复B2。

## Your Choices — 七个默认选择（D55:A已接受）

1. C1（CEO）：本地复制事件时间引用；P2/P5。替代是只复制JSON，少按钮但复核引用更费事，不新增分享服务。
2. C2（CEO）：带持续标记的本地fixture模式；P3/P5。替代是只走真实GPU路径，较少模式代码但开发者需先有GPU账户；真实GO仍必做。
3. C3（Design）：桌面视频60%/问答40%；P5。替代50/50或聊天优先，影响可视证据面积，不改变手机单列。
4. C4（Design）：浅色主题、IBM Plex/Noto Sans SC及fallback；P5。替代中性系统字体/不同配色，字体打包与DESIGN规范需同步。
5. C5（Design）：证据seek维持播放/暂停；P5。替代点击即播，减少操作但可能突然出声；时间定位必须相同。
6. C6（Eng）：独立prepare澄清控制协议；P5。替代单chat端点独立控制envelope，四查询status不变；客户端分支/文档随选择调整。

7. C7（Eng第2轮）：query/ingest各一个attempt公平1:1交替、各类FIFO；P3/P5。替代2:1偏query，可能降低查询等待但减少摄取吞吐；两者均需有限deadline/队列并实测原P95与小时目标。

## Review Scores / Voice Coverage

| Phase | 评审结果（计划层） | Host | Native | Outside provider/status | Consensus |
|---|---|---|---|---|---|
| CEO | spec 6→9/10，两次规格检查确认10问题修复；策略11sections完整，U1已resolvedA | codex | 完成5 findings，另spec两次 | Codex unavailable: under_codex | N/A |
| Design | 七维Step0=4；六passes4/5/4/3/2/2→8/9/8/8/8/9，overall=min六passes=8；没有approved PNG | codex | 完成6 findings | Codex unavailable | N/A |
| DX | 八维2/3/4/3/2/3/2/2→8/8/9/8/8/8/7/8；mean8/10 | codex | 完成5 findings | Codex unavailable | N/A |
| Eng | 第2轮完整review：architecture3/code0/perf2新问题；29测试路径簇；计划critical gap0，原E01–12带入 | codex | 第2轮完成4 findings，首轮6为历史 | Codex unavailable under_codex | N/A |

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


最新phase输出26项（CEO8、Design3、Eng12、DX3），原22项完整保留＋4项工程预算复核任务。latest run per phase选择Eng20261004，其余20261003；nongit/unknown＋两次已绑定run_id替代不存在的commit-window。仅component/sorted-files/title完全匹配去重0项，非完全重叠保留并标记；Files只在renderer按E07归一，不改历史JSONL。全部unchecked，工时不能相加，CC不含GPU/授权/人工等待。

- [ ] **CEO-T8 (P1, human: 4h / CC: 1h)** — 交付 — 部署回滚及赛事材料
  - Surfaced by: ceo-review — C12真实可复现交付
  - Files: docs/deployment.md, README.md, LICENSE
  - Possible duplicate/shared files: CEO-T1, Eng-T9, Eng-T10, Eng-T7, DX-T1, DX-T3；合并实现但保留各验收。
- [ ] **CEO-T2 (P1, human: 6h / CC: 45min)** — 契约 — schema/时间/支持与文档一致
  - Surfaced by: ceo-review — C02-C03/C14契约漂移
  - Files: src/frameseek/schema.py, src/frameseek/media.py, ARCHITECTURE.md, profile.md
  - Possible duplicate/shared files: Eng-T4, Eng-T10, Eng-T7, Eng-T12, DX-T2, Eng-T6；合并实现但保留各验收。
- [ ] **CEO-T3 (P1, human: 1d / CC: 2h)** — 摄取 — 持久分窗/能力manifest与预算
  - Surfaced by: ceo-review — C08/C13半索引和预算放大
  - Files: src/frameseek/ingest.py, src/frameseek/jobs.py, src/frameseek/storage.py, src/frameseek/agent.py
  - Possible duplicate/shared files: CEO-T5, Eng-T9, Eng-T4, Eng-T3, Eng-T2, Eng-T8, Eng-T12, Eng-T11；合并实现但保留各验收。
- [ ] **CEO-T1 (P1, human: 4h / CC: 1h)** — 环境 — 真实模型与配额预检
  - Surfaced by: ceo-review — C06模型/云能力尚未验证
  - Files: scripts/preflight.py, README.md, docs/deployment.md
  - Possible duplicate/shared files: CEO-T8, Eng-T9, Eng-T10, Eng-T7, DX-T1, DX-T3；合并实现但保留各验收。
- [ ] **CEO-T5 (P1, human: 1d / CC: 90min)** — 生命周期 — 拥有权/TTL与删除竞态
  - Surfaced by: ceo-review — C09/C15隐私闭环
  - Files: src/frameseek/api.py, src/frameseek/storage.py, tests/test_lifecycle.py
  - Possible duplicate/shared files: CEO-T3, Eng-T9, Eng-T4, Eng-T2, Eng-T8, Eng-T12, DX-T2；合并实现但保留各验收。
- [ ] **CEO-T6 (P1, human: 1d / CC: 3h)** — 评测 — 早期基线/原指标与消融
  - Surfaced by: ceo-review — C18/C19发现性能风险太晚
  - Files: eval/run.py, eval/baselines.py, docs/evaluation.md
  - Possible duplicate/shared files: CEO-T4, Eng-T3, Eng-T5, Eng-T7, Eng-T11；合并实现但保留各验收。
- [ ] **CEO-T4 (P1, human: 1d / CC: 3h + 标注)** — 诊断 — 四类真实问题诊断集
  - Surfaced by: ceo-review — C17合法JSON不能证明核心价值
  - Files: eval/diagnostics.json, eval/run.py
  - Possible duplicate/shared files: CEO-T6, Eng-T3, Eng-T5, Eng-T7, Eng-T11；合并实现但保留各验收。
- [ ] **Design-T2 (P1, human: 1天 / CC: 1小时)** — evidence-player — 实现证据定位与过期删除失效
  - Surfaced by: design-review — H1/H4
  - Files: src/frameseek/static/index.html, src/frameseek/static/app.js, src/frameseek/static/styles.css
  - Possible duplicate/shared files: Design-T1, Eng-T12, CEO-T7, Design-T3；合并实现但保留各验收。
- [ ] **Design-T1 (P1, human: 2天 / CC: 2小时)** — ui-state — 实现上传任务与问答状态恢复
  - Surfaced by: design-review — H2/H3/M5/M6
  - Files: src/frameseek/static/index.html, src/frameseek/static/app.js, src/frameseek/static/styles.css
  - Possible duplicate/shared files: Design-T2, Eng-T12, CEO-T7, Design-T3；合并实现但保留各验收。
- [ ] **Eng-T9 (P1, human: 1d / CC: 2h + 实机)** — budget — 实现已批准实际窗口预算与完整GPU费用账本
  - Surfaced by: eng-review — D49:A/E13; A9/E18; P5/E15
  - Files: src/frameseek/config.py, src/frameseek/attempts.py, src/frameseek/storage.py, docs/configuration.md, docs/deployment.md, tests/test_budget.py, tests/test_resources.py
  - Possible duplicate/shared files: CEO-T8, CEO-T3, CEO-T1, CEO-T5, Eng-T2, Eng-T8, Eng-T10, Eng-T7, Eng-T1, Eng-T11, DX-T3；合并实现但保留各验收。
- [ ] **Eng-T4 (P1, human: 6h / CC: 1h)** — context — typed澄清与按问题/revision缓存
  - Surfaced by: eng-review — A4-A5/E04-E05
  - Files: src/frameseek/api.py, src/frameseek/schema.py, src/frameseek/agent.py, src/frameseek/cache.py, tests/test_context.py, tests/test_cache.py
  - Possible duplicate/shared files: CEO-T2, CEO-T3, CEO-T5, Eng-T12, DX-T2；合并实现但保留各验收。
- [ ] **Eng-T3 (P1, human: 1d / CC: 2h + 标注)** — diagnostic — 前置真实跨窗候选与GO依赖
  - Surfaced by: eng-review — A3/E03
  - Files: src/frameseek/ingest.py, src/frameseek/retrieval.py, eval/diagnostics.json, eval/run.py
  - Possible duplicate/shared files: CEO-T3, CEO-T6, CEO-T4, Eng-T5, Eng-T7, Eng-T11；合并实现但保留各验收。
- [ ] **Eng-T2 (P1, human: 1d / CC: 2h)** — durable — 持久attempt、query幂等与worker lease
  - Surfaced by: eng-review — A2/E02
  - Files: src/frameseek/storage.py, src/frameseek/jobs.py, src/frameseek/attempts.py, tests/test_attempts.py
  - Possible duplicate/shared files: CEO-T3, CEO-T5, Eng-T9, Eng-T8, Eng-T12, Eng-T1, Eng-T11；合并实现但保留各验收。
- [ ] **Eng-T5 (P1, human: 1d / CC: 2h)** — eval — 冻结指标分母及24路径回归
  - Surfaced by: eng-review — A6/Test/E06/E11
  - Files: eval/run.py, eval/baselines.py, docs/evaluation.md, tests/test_metrics.py, tests/*
  - Possible duplicate/shared files: CEO-T6, CEO-T4, Eng-T3, Eng-T7, Eng-T11；合并实现但保留各验收。
- [ ] **Eng-T8 (P1, human: 6h / CC: 1h)** — lifecycle — 原子manifest及expiry删除升级闭环
  - Surfaced by: eng-review — Architecture/X05/E12
  - Files: src/frameseek/lifecycle.py, src/frameseek/storage.py, src/frameseek/jobs.py, tests/test_lifecycle.py, tests/test_migrations.py
  - Possible duplicate/shared files: CEO-T3, CEO-T5, Eng-T9, Eng-T2, Eng-T12, Eng-T11；合并实现但保留各验收。
- [ ] **Eng-T10 (P1, human: 6h / CC: 1h + 双平台)** — media — 隔离并限制媒体预检子进程
  - Surfaced by: eng-review — A7/E14; native1
  - Files: src/frameseek/media.py, src/frameseek/config.py, tests/test_media_isolation.py, docs/deployment.md
  - Possible duplicate/shared files: CEO-T8, CEO-T2, CEO-T1, Eng-T9, Eng-T7, Eng-T1, DX-T3；合并实现但保留各验收。
- [ ] **Eng-T7 (P1, human: 6h / CC: 1h + 实机)** — performance — 流式采样批量检索成本阶段实测
  - Surfaced by: eng-review — Q3/P1-P4/E09-E10
  - Files: src/frameseek/media.py, src/frameseek/index.py, src/frameseek/retrieval.py, eval/run.py, docs/deployment.md
  - Possible duplicate/shared files: CEO-T8, CEO-T2, CEO-T1, CEO-T6, CEO-T4, Eng-T9, Eng-T3, Eng-T5, Eng-T10, Eng-T11, DX-T3；合并实现但保留各验收。
- [ ] **Eng-T12 (P1, human: 6h / CC: 1h)** — recovery — 冻结同请求查询恢复控制协议
  - Surfaced by: eng-review — A8/E17; native4
  - Files: src/frameseek/api.py, src/frameseek/schema.py, src/frameseek/jobs.py, src/frameseek/static/app.js, docs/api.md, docs/errors.md, tests/test_query_recovery.py
  - Possible duplicate/shared files: CEO-T2, CEO-T3, CEO-T5, Design-T2, Design-T1, Eng-T4, Eng-T2, Eng-T8, DX-T2, CEO-T7, Design-T3, Eng-T11；合并实现但保留各验收。
- [ ] **Eng-T1 (P1, human: 1d / CC: 2h)** — resource — 全局admission与有限Agent调用账本
  - Surfaced by: eng-review — A1/E01
  - Files: src/frameseek/config.py, src/frameseek/attempts.py, src/frameseek/models.py, tests/test_limits.py
  - Possible duplicate/shared files: Eng-T9, Eng-T2, Eng-T10, Eng-T11；合并实现但保留各验收。
- [ ] **DX-T2 (P1, human: 1天 / CC: 1小时)** — api-contract — 冻结HTTP错误契约和客户端示例
  - Surfaced by: devex-review — DX2/DX3 Pass2/3
  - Files: src/frameseek/api.py, src/frameseek/schema.py, docs/api.md, docs/errors.md
  - Possible duplicate/shared files: CEO-T2, CEO-T5, Eng-T4, Eng-T12；合并实现但保留各验收。
- [ ] **DX-T1 (P1, human: 2天 / CC: 2小时)** — dev-environment — 实现双模式快速开始预检配置
  - Surfaced by: devex-review — DX1/DX5 Pass1/6
  - Files: pyproject.toml, Makefile, .env.example, README.md, scripts/preflight.py
  - Possible duplicate/shared files: CEO-T8, CEO-T1；合并实现但保留各验收。
- [ ] **CEO-T7 (P2, human: 4h / CC: 45min)** — UI — 证据五状态/引用重置
  - Surfaced by: ceo-review — C11错误/partial区分
  - Files: src/frameseek/static/index.html, src/frameseek/static/app.js, src/frameseek/static/styles.css
  - Possible duplicate/shared files: Design-T2, Design-T1, Eng-T12, Design-T3；合并实现但保留各验收。
- [ ] **Design-T3 (P2, human: 1天 / CC: 1小时)** — ui-system — 实现响应式可访问性与主题
  - Surfaced by: design-review — Pass4/5/6 TasteC3–5
  - Files: src/frameseek/static/index.html, src/frameseek/static/app.js, src/frameseek/static/styles.css, DESIGN.md
  - Possible duplicate/shared files: Design-T2, Design-T1, Eng-T12, CEO-T7；合并实现但保留各验收。
- [ ] **Eng-T6 (P2, human: 4h / CC: 45min)** — organization — 统一package assets和共享授权安全示例
  - Surfaced by: eng-review — Q1-Q2/E07-E08
  - Files: src/frameseek/auth.py, src/frameseek/static/*, ARCHITECTURE.md, profile.md
  - Possible duplicate/shared files: CEO-T2；合并实现但保留各验收。
- [ ] **Eng-T11 (P2, human: 4h / CC: 45min + 实机)** — scheduler — 按单次attempt公平调度查询与摄取
  - Surfaced by: eng-review — P6/E16; native3; Taste C7
  - Files: src/frameseek/jobs.py, src/frameseek/attempts.py, tests/test_scheduler.py, eval/run.py
  - Possible duplicate/shared files: CEO-T3, CEO-T6, CEO-T4, Eng-T9, Eng-T3, Eng-T2, Eng-T5, Eng-T8, Eng-T7, Eng-T12, Eng-T1；合并实现但保留各验收。
- [ ] **DX-T3 (P2, human: 1天 / CC: 1小时)** — docs-migration — 交付分阶段文档版本迁移与冷启动测量
  - Surfaced by: devex-review — DX4 Pass4/5/8
  - Files: docs/getting-started.md, docs/configuration.md, docs/deployment.md, CHANGELOG.md, CONTRIBUTING.md
  - Possible duplicate/shared files: CEO-T8, CEO-T1, Eng-T9, Eng-T10, Eng-T7；合并实现但保留各验收。

## Implementation order / risk

D1冻结包/schema/控制类型/配置、媒体保护、预算批准流程和真实模型预检；D2–3真实四类8问含最小跨窗候选；D4–6完整索引/manifest/TTL；D7–9混合检索/zoom/阶段成本与混合负载；D10–12多轮；D13–16UI；D17–20全部冻结评测/三消融；D21–24部署回滚/真实smoke/材料。实际开始日映射D序，10/03不算已实施一天，截止不推迟也不能压缩掉验收；人力/GPU/预算未知，差距如实提交。批准计划后先同步根ARCHITECTURE/profile再实现，免费fixture与本地合同工作可先行；真实运行仍受数字/校准批准与技术preflight。

## Pre-gate verification

此前CEO全11sections/前提/救援/失败registry/NOTscope/existing/dream/completion/consensus；Design7维/litmus/决策；DX8维/旅程/叙事/TTHW/checklist/consensus保存。当前Eng invocation2已完整2180行方法、独立terminal native、四主sections、架构与代码/用户测试图、29簇测试artifact、失败registry、完整任务/依赖/TODO/approval-ledger/terminal report保存。close packet497行请求后补读截断320–447并完整语义核对，原C/G/X/E01–13保留，E14–18行为/条件/验证全部合入Implementation；parent Phase3 completion已实际发送，再读Phase4 aggregator。原root source未变；所有tests/realGPU/deploy未执行，logs按parent最终批准后才写。

## Final Approval Gate D55

建议A批准修订整份计划（含C1–C7默认）；接下来同步技术契约并开始D1本地实现/预检。A并不授权具体call/money数字、无限收费、未确认校准或立即部署。B可指定覆盖默认或条款，重跑受影响phase且Eng最后；C逐项问解释后再回最终门；D修改方案（受影响phase＋Eng，至多3cycles）；E拒绝重做。B2仍是原技能路径，但U1已经解决且没有新挑战，当前无需执行；不把B2再当待回答预算选择。依≤4 groups第一组A/B/C/D，E作为下一组选项保留不丢弃。


## Human decision

# Final plan approval

Human answer `A` to D55, timestamp 2026-10-04T02:15:06.929396+00:00.
State: APPROVED. All seven provisional defaults C1–C7 accepted. D49:A budget direction remains approved.
Authorized next work: sync technical contracts, D1 local foundations and read-only preflight.
Numeric call/money/calibration limits remain unapproved. No paid execution or deployment authorized by this decision.
Approved Implementation SHA256: c18b134271f9ba2bd20b52534c63f3d04b9ee03cee9bb023067009e0904fc6d3.
All implementation tasks remain unchecked until individually verified; plan approval is not a test or model benchmark pass.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|---|---|---|---|---|---|
| CEO Review | /autoplan | scope/strategy | 1 | issues_open, approved mapped work | spec9/10; native5; U1 resolved |
| Outside Review | guarded Codex provider | independent voice | 0 complete | unavailable under_codex | missing all four phases |
| Eng Review | /autoplan | architecture/tests | 2 | issues_open, approved mapped work | 5 primary + 29 test gaps, native4, planned critical0 |
| Design Review | /autoplan | UI/UX | 1 | issues_open, defaults approved | plan8/10, native6, pixels unverified |
| DX Review | /autoplan | developer experience | 1 | issues_open, defaults approved | plan8/10, native5, TTHW unknown |

**OUTSIDE COVERAGE:** host codex; outside provider Codex unavailable; native in-host complete in all phases, model identity unknown; consensus N/A.
**VERDICT:** APPROVED implementation plan under human D55:A; begin D1. Implementation/testing and real model/performance remain unverified; eng review required for ship.
**UNRESOLVED DECISIONS:**
- Explicit finite numeric call/money/calibration budget confirmation is required before paid work; U1 direction and C1–C7 defaults are resolved.
