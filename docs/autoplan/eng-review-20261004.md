# FrameSeek — Full Engineering Review, invocation 2

Date 2026-10-04 Asia/Tokyo；scope docs/IMPLEMENTATION_PLAN.md完整MVP＋D49:A预算政策。方法2180行全部载入；盲审input 1bc1dee66dce653f78530994687cb4e191b0d217e3f5416753d60c72839dc88b；native完整461行返回匹配INPUT的4项；outside Codex under_codex unavailable，未启动同宿主CLI，不推断不同模型家族。固定amendment checkpoint为autoplan-eng-swCeUO/eng-implementation.md，native snapshot不覆写。原CEO/Design/DX及E01–13全部保留，不以差分摘要取代完整评审。

## Step 0 — Scope Challenge / What already exists

再次核对文件清单：只有ARCHITECTURE.md/profile.md、TODOS和评审文档；没有应用、Git、AGENTS/CLAUDE、pyproject或测试。因而只有计划行为可评审，不能报告实际代码bug、测试通过或已测性能。完整范围涉及超过8个未来文件和多个组件，依据autoplan P2/P5保持single Python package/FastAPI/SQLite worker，无范围裁剪、无新服务。原source根文档在最终批准前不改；后续D1预算数字仍需确认。

已存在的是C/G/X/E约束和test-plan，而非运行中的系统。复用ffmpeg/ffprobe媒体职责、SQLite短事务/WAL、现有attempt和auth规划；没有可重用的第一方函数，也不能给出不存在的调用位置/净删行数。部署候选仍需账户确认，fixture Mac/Linux与real Linux兼容由D1验证。

## Section 1 — Architecture

```text
static UI -> api.py -> shared owner/CSRF/generation gate
    | upload                  | chat prepare / same-ID recover
    v                         v
isolated media subprocess     query request lease/state
    -> full window manifest   -> candidate/index/cache
    -> N + approved budget    -> bounded planned model/tool attempts
                 \           /
                  budget reserve transaction (owner + global)
                     -> fair single-attempt GPU scheduler
                     -> paid dispatch ledger / resource allocation ledger
                     -> completed result | unknown (no automatic resend)
    ingest -> complete artifacts + CAS ready | failed/cancelled
    query  -> validate -> four-status final | separate pending/unknown control
lifecycle -> tombstone/expiry checks -> finite cleanup/rollback boundary
deployment -> finite resource cutoff/release + crash reconciliation
```

A7 P1 confidence8（plan，native1）：E01/C09约束上传却未充分约束读取可信元数据之前的媒体程序。把ffprobe/scene/decode均纳入E14隔离和有限CPU/RSS/output/wall-clock/process-group边界；最小权限只能访问任务目录且禁网络/外部引用，Mac/Linux缺保护时real禁用。替代只按文件大小/元数据拒绝不能防挂起或外部引用；不选。输入错误和超限明确返回，不消耗模型预算，畸形及10x预检的故障测试作为必需proof。D50机械P1/P5接受。

A8 P2 confidence8（native4）：同步chat最终响应与重复请求恢复状态是不同契约，四status不能表示pending。E17保持同POST请求ID和独立控制envelope，执行中202+Retry-After、结果未知409，最终回答仍四status；生命周期lease和deadline负责结束，不以刷新触发云重发。替代新增查询状态GET可行但当前没有此公共endpoint需求；沿已有E02同POST重放恢复职责具体化，无另建服务/SDK。持久结果复用、payload冲突/owner/gen检查及unknown明确新尝试都需回归；D51机械P5接受。

A9 P1 confidence8（parent新增）：E13配置有批准记录，但仅检查预检N与一次attempt不足以防两请求同时拿最后额度，亦未写预算降额后旧job的行为。E18 owner和global短事务同时reserve，job冻结版本，每次dispatch重新检查批准仍有效；所有阶段、校准和GPU占用共同记账，未知保留预留，确认记录不能由配置制造。替代逐请求读剩余额度然后异步减会超额；拒绝。整数货币单位/币种/保守舍入、撤销或降额停止future、配置升额需新批准及最后额度竞态均测；D52机械P1/P5接受。

其他架构完整核对：C08/C13 manifest按完整可用通道发布；E12删除/expiry与publish的两种交错、备份恢复不复活；E02分阶段lease、unknown不重发，E05按问题/代际缓存。共享auth在API/媒体/工具所有caller入口，模型给的sid不构成授权。上游模型是单点故障，只有已验证降级可启用，不把不可用模型称Plan B。图中隔离、资源生命周期、控制恢复和预算竞态对应下面failure registry，无静默未处理分支。

## Section 2 — Code Quality

No new separate issues found。完整核对single-package/static路径、schema/config/auth/adapter/time职责与E07已指定短事务，所有媒体操作不用shell，query/attempt/job/index/chat ID明确分开。E18显式money单位、E17独立控制类型、E14单一subprocess boundary是新行为的直接实现要求，不重复计为Code Quality缺陷。未来api和worker两个拟定caller可复用attempt reservation，二者契约同为批准版本＋owner/global原子reserve；先实现attempts.py，再接两个caller及共享合同/分别HTTP与worker故障测试，模型网络位于事务外。

没有现存函数可提取：移除0实现行，新增实现/测试行数未知，总变化预期增长，不能宣称节省。已有auth和attempt模块职责足够，不创建通用budget框架或跨进程抽象；media subprocess isolation与model network adapter安全边界不同，拒绝合并为一个泛化runner。预算价格表/version不会静默热改；可诊断error及未知状态保留，具体代码ASCII图将写入attempts.py/jobs.py/media.py/api.py与deployment说明。

## Section 3 — Test Review

Test step1在独立tool调用完整重新读当前446行Implementation input；截断部分378–425成功补读。路径从配置/主体/上传/预检，经完整窗口/通道/索引/attempt到查询/证据/四状态/媒体读取/TTL逐支跟踪。Test framework再次inventory没有检测到安装或代码，沿已接受E11默认pytest待D1锁兼容；未安装也不写测试代码。Test step2将双click、离开断线、慢网、双tab、stale/reset/expiry、空输入/空候选/长文本和真实seek映射至UI与HTTP分支。

```text
CODE PATHS [all GAP]                              USER FLOWS [all GAP]
01 config -> 02 fixture / 03 real preflight      start without keys / clear real refusal
04 auth -> 05 upload/query ID -> 06 input/N      double submit / wrong-owner/stale rejection [E2E]
 -> 26 isolated probe -> 07 PTS/windows         malformed upload / cancel / visible error [E2E]
 -> 25 budget policy -> 08 usable channels      required N and effective cap / audio warning
 -> 09 worker lease -> 10 attempt ledger        refresh/crash restore / unknown explanation [E2E]
 -> 27 allocation fees -> 28 fair scheduler     ingest + query together / no indefinite wait [E2E]
 -> 11 publish CAS -> 12 index revision         ready vs failed / new generation / delete [E2E]
13 prepare -> 14 hybrid -> 15 bounded tools     ambiguity choices / real diagnostic [EVAL]
 -> 16 exact cache -> 17 support + merge        new question / more results / no fake negatives [EVAL]
 -> 18 four final statuses -> 19 HTTP errors    known evidence or uncertainty / docs action [E2E]
 -> 29 pending/unknown query recovery           disconnect/repost / same result / no new charge [E2E]
 -> 20 UI generation -> 21 real player seek    draft preserved / late result rejected / audio [E2E]
 -> 22 TTL/backup -> 23 responsive/a11y         old URI blocked / keyboard/small screens [E2E]
 -> 24 frozen metrics/baselines/ablations       no filtered failures or fixture quality [EVAL]
Legend GAP=unimplemented/unrun; E2E=integration/browser; EVAL=real model suite.
COVERAGE 0/29 path clusters. This is cluster mapping, not measured line coverage.
```

Test step3所有29簇无实际覆盖，质量星级N/A；不存在运行代码需保持的旧测试，但C/G/X/E已批准断言是回归契约，不删除。Test step4完整ASCII路径与用户流程同时映射；Test step5为每簇指定类型/未来文件/具体断言，写docs/autoplan/test-plan-20261004.md及private state projects/frameseek/zip-nongit-eng-review-test-plan-20261004.md，旧24簇全带入并补25–29。采用app边界HTTP/integration和真实视频browser，不靠mock证明解码/seek/停费；预算和媒体隔离重要集成必须有故障注入。Perf新契约D53/D54接受后更新测试，不另加未授权产品行为。

LLM suite保持C01/C17/C18/E11全部范围：四类8问真实诊断、10视频30问开发、30/100目标独立报告；三基线与双通道/zoom/混合检索三消融；中文query/audio/screentext分开、noisy/negative/cross-window/prompt-injection、schema raw与repair/证据/冷warm成本显存。prompt/model/config改变重跑相关固定集，最终完整集D17–20；fixture不算真实质量。新25–29以确定性故障与真实部署校准检验预算及执行，不伪造模型性能。预算数值未获批则这些real检查标not run，免费合同检查可在实施后运行。

## Section 4 — Performance

P5 P1 confidence8（native2）：source7.1只按GPU推理时长估算无法覆盖按分配时长收费的部署。E15分别冻结计费单位/价格/启动空闲失败/占用上界和释放余量，resource allocation持久起止、provider有限停机机制在批准校准中验证；不能保证有限停费则该real形态不可启用。HTTP timeout不等于云资源释放，崩溃/finally失败需要恢复对账并标unknown；不承诺本地账本可绝对封顶供应商欠费。拒绝以duration×单价推断空闲免费，D53机械P1/P5接受并测停费故障。

P6 P2 confidence8（native3）：E01 GPU1限制并发未定义两类工作互相等待的界，整job锁GPU会使query的P95被32+连续调用拖垮。E16暂定C7公平1:1 attempt交替、各类FIFO、一类空时另一类继续，正在执行的attempt不可抢占；有限queue/attempt/deadline使等待可界定，不能替代实测15s指标。可行2:1偏query也有界，换更低query等待但hour吞吐下降，因此D54按P3/P5暂定为Taste并在最终门给替代。需混合负载验证查询与摄取均无饥饿，并独立报告queue/service/P95和摄取吞吐。

其他热点复核E10流式逐窗≤128帧、不整段解码到RAM；FAISS/BM25按generation复用，top-k证据批量取，不每问建索引。没有SQL可声称N+1实测，未知模型共卡VRAM不能只加权重证明；peak RSS/VRAM、冷热cache、预算reserve争用和媒体解码阶段分别计时。Cache按E05 owner/gen/prompt/model/config/PTS/问题完整key，有限TTL/字节，不能跳过相同sid的新问题。C01所有目标不减，混合负载15s及小时30min均待真实验证，D49解决的是政策冲突而非性能达标或金额批准。

## Failure Modes Registry

| path | Failure | Handling + tests | User sees | Silent critical gap after mapping |
|---|---|---|---|---|
| 01–03 | missing/invalid config, key, GPU | preflight fail; config/mode/preflight tests | prerequisites + no automatic paid fallback | no |
| 04–05 | owner/CSRF/stale/duplicate collision | reject/atomic payload hash; HTTP/integration | 403/409 and preserved draft | no |
| 06–08,26 | malformed/hung media, bad PTS, failed channel | E14 kill/cleanup; full manifest and time tests | probe error/capability warning, no inference | no |
| 09–10 | lease/crash/unknown dispatch | ledger/leases/no automatic resend; fault tests | unknown and remaining approved budget | no |
| 11–12,22 | incomplete ready, stale publish, deleted backup restore | CAS/tombstone/expiry; both-order race tests | failed/not ready/410 | no |
| 13–16 | wrong anchor, no candidate, tool loop, wrong cache | E04/E05/C04; context/retrieval/limit/cache tests | clarify or checked-range/error/partial | no |
| 17–19 | unsupported claim/repair failure | validation/four statuses; schema/evidence/error tests | evidence + uncertainty / diagnostic error | no |
| 20–21,23 | late response, broken seek/focus, inaccessible mobile | gen guards/native media/manual checklist | preserved draft/seek error/equivalent controls | no |
| 24 | empty-denominator success or hidden failure | fixed metrics + baselines/ablations | measured gap, not false performance | no |
| 25 | unknown/forged/revoked budget or two final-credit requests | E13/E18 atomic reserve/fail closed; race tests | effective cap/N and refusal | no |
| 27 | idle/failed-start/crash leaves billed GPU | E15 provider cutoff + persistent reconcile; real fault calibration | still charging/unknown, refuse future work | no |
| 28 | ingest monopolizes/query starves ingestion | E16 bounded fair attempt dispatch; mixed-load tests | bounded wait/429/deadline result | no |
| 29 | lost reply causes duplicate paid inference | E17 query state/control/idempotent result; crash/repost tests | pending/unknown + explicit action | no |

Critical gaps planned0 after handling+tests mapping. Before amendment媒体边界和计费资源泄漏为潜在critical gaps2；当前实现不存在且29簇全未跑，不能称保护已通过。

## NOT in scope / TODOS

四组原TODO（多视频/复杂上下文、身份/diarization、bbox/领域/公开API、分布式容量）保持既有完整what/why/pros/cons/context/both efforts/dependencies。没有新TODO提案，审批工具/业务支付平台/SDK/Redis/Celery/遥测不进入本次。隔离与预算账本、调度及恢复属于原MVP安全/持久执行边界，不新增收费产品；schema0.1尚未发布，调整没有已发布客户端迁移债。

## Workspaces / Dependency table

| Step | Modules | Depends on |
|---|---|---|
| S0 freeze schema/config/auth/budget definitions | core, docs | final plan approval |
| S1 backend attempts/media/jobs/retrieval/lifecycle | core, storage, ingest, retrieval | S0; real execution also numeric budget |
| S2 UI fixture/status/evidence | static | S0 schemas/control types |
| S3 annotation/metrics/baselines | eval | S0 schema |
| S4 real integration/performance/deployment | core, static, eval, docs | S1/S2/S3 + confirmed quota/budget |

潜在3 lanes A=S1/B=S2/C=S3，先S0，再launch三lane，等待合并后S4；core/api/schema/config/README共享修改顺序由A合入B/C，不能同时改共享文件。当前nongit不创建worktree，未启动实施。真实GPU校准/标注仍是外部及串行依赖，不保证AI估时能替代。

## Consensus / Independent voice reconciliation

| Native finding | Parent assessment | Accepted | Outside | Confirmed cross-model |
|---|---|---|---|---|
| 1 media preflight limits | agree A7 | E14 / D50 | unavailable under_codex | N/A |
| 2 allocation billing | agree P5 | E15 / D53 | unavailable under_codex | N/A |
| 3 query/ingest scheduling | agree P6, C7 provisional rule | E16 / D54 | unavailable under_codex | N/A |
| 4 synchronous request recovery | agree A8 | E17 / D51 | unavailable under_codex | N/A |

Parent新增A9/E18，不冒充native已验证它。四native建议均进入具体行为/故障断言，不只保存一段摘要；completed native result verbatim saved eng-native-20261004.md。没有outside complete结果，不产跨模型同意/分歧数量。

## Implementation Tasks

保留原T1–T8范围、provenance和efforts，标题/Files不重写；新T9–T12分别来自预算、媒体边界、调度及查询恢复。估时是未来单机工程：human及CC均不含预算批准/供应商等待/实机/人工标注，非工期承诺；现无代码不能声称实现完成。

- [ ] **T1 (P1, human: ~1d / CC: ~2h)** — resource — 全局admission与有限Agent调用账本
  - Surfaced by: A1/E01
  - Files: src/frameseek/config.py, src/frameseek/attempts.py, src/frameseek/models.py, tests/test_limits.py
  - Verify: 原E01–E12及29路径簇对应断言，原完整范围保留

- [ ] **T2 (P1, human: ~1d / CC: ~2h)** — durable — 持久attempt、query幂等与worker lease
  - Surfaced by: A2/E02
  - Files: src/frameseek/storage.py, src/frameseek/jobs.py, src/frameseek/attempts.py, tests/test_attempts.py
  - Verify: 原E01–E12及29路径簇对应断言，原完整范围保留

- [ ] **T3 (P1, human: ~1d / CC: ~2h + 标注)** — diagnostic — 前置真实跨窗候选与GO依赖
  - Surfaced by: A3/E03
  - Files: src/frameseek/ingest.py, src/frameseek/retrieval.py, eval/diagnostics.json, eval/run.py
  - Verify: 原E01–E12及29路径簇对应断言，原完整范围保留

- [ ] **T4 (P1, human: ~6h / CC: ~1h)** — context — typed澄清与按问题/revision缓存
  - Surfaced by: A4-A5/E04-E05
  - Files: src/frameseek/api.py, src/frameseek/schema.py, src/frameseek/agent.py, src/frameseek/cache.py, tests/test_context.py, tests/test_cache.py
  - Verify: 原E01–E12及29路径簇对应断言，原完整范围保留

- [ ] **T5 (P1, human: ~1d / CC: ~2h)** — eval — 冻结指标分母及24路径回归
  - Surfaced by: A6/Test/E06/E11
  - Files: eval/run.py, eval/baselines.py, docs/evaluation.md, tests/test_metrics.py, tests/*
  - Verify: 原E01–E12及29路径簇对应断言，原完整范围保留

- [ ] **T6 (P2, human: ~4h / CC: ~45min)** — organization — 统一package assets和共享授权安全示例
  - Surfaced by: Q1-Q2/E07-E08
  - Files: src/frameseek/auth.py, src/frameseek/static/*, ARCHITECTURE.md, profile.md
  - Verify: 原E01–E12及29路径簇对应断言，原完整范围保留

- [ ] **T7 (P1, human: ~6h / CC: ~1h + 实机)** — performance — 流式采样批量检索成本阶段实测
  - Surfaced by: Q3/P1-P4/E09-E10
  - Files: src/frameseek/media.py, src/frameseek/index.py, src/frameseek/retrieval.py, eval/run.py, docs/deployment.md
  - Verify: 原E01–E12及29路径簇对应断言，原完整范围保留

- [ ] **T8 (P1, human: ~6h / CC: ~1h)** — lifecycle — 原子manifest及expiry删除升级闭环
  - Surfaced by: Architecture/X05/E12
  - Files: src/frameseek/lifecycle.py, src/frameseek/storage.py, src/frameseek/jobs.py, tests/test_lifecycle.py, tests/test_migrations.py
  - Verify: 原E01–E12及29路径簇对应断言，原完整范围保留

- [ ] **T9 (P1, human: ~1d / CC: ~2h + 实机)** — budget — 实现已批准实际窗口预算与完整GPU费用账本
  - Surfaced by: D49:A/E13; A9/E18; P5/E15
  - Files: src/frameseek/config.py, src/frameseek/attempts.py, src/frameseek/storage.py, docs/configuration.md, docs/deployment.md, tests/test_budget.py, tests/test_resources.py
  - Verify: N30/31/32/scene；最后额度并发；未知/伪造/降额；启动空闲崩溃停费校准

- [ ] **T10 (P1, human: ~6h / CC: ~1h + 双平台)** — media — 隔离并限制媒体预检子进程
  - Surfaced by: A7/E14; native1
  - Files: src/frameseek/media.py, src/frameseek/config.py, tests/test_media_isolation.py, docs/deployment.md
  - Verify: 畸形/挂起/外部引用/无限输出/10x；kill子孙清理；保护缺失零推理

- [ ] **T11 (P2, human: ~4h / CC: ~45min + 实机)** — scheduler — 按单次attempt公平调度查询与摄取
  - Surfaced by: P6/E16; native3; Taste C7
  - Files: src/frameseek/jobs.py, src/frameseek/attempts.py, tests/test_scheduler.py, eval/run.py
  - Verify: 1:1两类无饥饿、单类继续、取消/到期/剩余deadline拒绝、原P95与吞吐

- [ ] **T12 (P1, human: ~6h / CC: ~1h)** — recovery — 冻结同请求查询恢复控制协议
  - Surfaced by: A8/E17; native4
  - Files: src/frameseek/api.py, src/frameseek/schema.py, src/frameseek/jobs.py, src/frameseek/static/app.js, docs/api.md, docs/errors.md, tests/test_query_recovery.py
  - Verify: 断线/双POST/持久前后crash；pending/unknown独立四状态；预算无新dispatch；reset拒绝

## Decision ledger / Approval readiness

D49:A是human实际政策回答，不等于整体批准/价格/放开付费。D50/E14、D51/E17、D52/E18、D53/E15依据autoplan六原则机械具体化既定安全、恢复及有限预算边界；D54/E16按P3/P5暂定Taste C7，替代及影响放最终门。所有测试验证对应同条行为，无未授权新产品策略；E01–13和C/G/X原文完整携带。Approval readiness: PASS（checked D49 actual A＋D50–54 authorized autoplan decisions；C1–C7 provisional，entire-plan approval pending；numeric budget/calibration separately required D1）。

## Suppressed findings

无额外安全/生命周期框架，已有E07/E12提供auth及CAS边界；尚无应用不能声称代码重复、SQL N+1或旧测试失效。未重复计算native/parent相同四项，未以U1方向已解决视为小时性能已达标。

## Completion Summary

Step0 scope accepted as-is；Architecture3 new issues；CodeQuality0 new issues；Test完整代码＋用户图29 GAP簇，现有0；Performance2 new issues。Primary unique5，native4 overlap，不相加为9；issues_found含29 planned test gaps=34。NOT in scope / What already exists / 4 TODO groups retained；0 new TODO proposals。Input潜在critical2映射处理/测试后planned0，运行保护未测。Unresolved new policy0，U1 direction resolvedA，C1–7 taste provisional，D1 numeric budgets not yet approved，整体最终门pending。Outside Codex unavailable under_codex，native completed4 unknown model identity；consensus N/A。Parallel3 potential lanes，S0/S4/shared modules sequential，nongit无worktree。Lake Score N/A（kind choices，没有coverage score）。Review logs按parent延后最终批准。

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|---|---|---|---|---|---|
| CEO Review | /autoplan → /plan-ceo-review | Scope & strategy | 1 | DONE_WITH_CONCERNS, not logged | spec6→9；native5；U1现resolvedA |
| Outside Review | Codex guarded provider | Independent 2nd opinion | 0 complete | unavailable under_codex | current eng no external coverage |
| Eng Review | /autoplan → /plan-eng-review | Full architecture & tests | 2 | DONE_WITH_CONCERNS, not logged | 5 primary＋29 test GAP簇；native4；planned critical0 |
| Design Review | /plan-design-review | UI/UX | 1 | provisional8/10, not logged | native6；PNG/pixel未完成 |
| DX Review | /plan-devex-review | Developer journey | 1 | provisional8/10, not logged | native5；完整cold TTHW unknown |

**OUTSIDE COVERAGE:** host codex, provider Codex unavailable under_codex in eng invocation2；native in-host independent context complete4，model identity unknown。不声称Claude或不同模型完成。
**VERDICT:** complete planning output, final approval pending；实际工程代码/测试尚不存在，review logs未写，eng review required for ship。
**UNRESOLVED DECISIONS:**
- C1–C7 remain provisional until whole-plan gate; numeric call/money/calibration limits require explicit D1 confirmation; no new open policy challenge.
