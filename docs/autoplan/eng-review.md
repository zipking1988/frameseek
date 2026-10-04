# FrameSeek 工程评审

## Step 0 — Scope Challenge / What already exists

已重新完整读取本阶段不可变输入432行，INPUT `eng 1268557c431b53f42607263f39eb0b95ff22c7367be13709cbf3e246b2fe6a8e`。工作区仍只有产品/架构和本轮评审文档；没有应用、测试、Git历史、依赖定义或已运行的接口。下述引用是计划缺口证据，未来文件路径是任务目标，不能称为已观察运行故障。复用源文档的三层管线、四状态、五个内部工具和现有C/G/X义务；不会重建ffmpeg、FAISS或播放器。

复杂度检查：完整MVP约16个Python模块、3个静态资源及评测/测试/文档，超过8文件阈值。候选A是按每个阶段另建服务、消息中间件及通用插件；候选B是一个Python包、一个FastAPI入口、一个SQLite持久worker，模型服务保持原自托管边界。自动选择B（P2保留范围，P5显式且少组件）；保留全部摄取、双通道混合检索、zoom、Agent、多轮和证据UI。模块按数据边界拆分，不能把所有状态塞进一个handler，也不增加Redis/Celery/微服务。

已有方案可复用：SQLite WAL允许读者与单写者并行，仍须短事务和处理BUSY，数据库与索引只在单节点本地盘；这不证明多机扩展。[SQLite WAL](https://www.sqlite.org/wal.html)。请求内BackgroundTasks不能充当本项目要求的崩溃恢复任务账本；选SQLite队列和独立worker是基于现有单机规模的工程推断。[FastAPI官方文档](https://fastapi.tiangolo.com/tutorial/background-tasks/)。ffprobe提供帧/包时间字段，VFR证据按PTS而非帧序号换算。[ffprobe文档](https://ffmpeg.org/ffprobe.html)。没有成熟代码可做行数、复用收益或N+1实测。

## Step 0.5 — Dual Voices

独立native完整读取447行提示，终态返回匹配INPUT，完成6项发现：资源总量、未知推理完成状态、诊断排期、澄清协议、visited/cache语义、评测分母。外部Codex声音unavailable：当前under_codex且安装指令面向其他宿主，未启动嵌套外部进程。native使用同一宿主、模型身份unknown，不冒称Claude或跨模型共识；主代理分析不是第二个外部声音。6项均转成E01–E06，单声音关键风险明确保留。

| ENG dimension | Native | Outside | Consensus |
|---|---|---|---|
| Architecture | P1资源/推理账本/里程碑冲突 | unavailable | N/A |
| Tests | P2评测、缓存、澄清用例缺 | unavailable | N/A |
| Performance | 总量与Agent循环未闭合 | unavailable | N/A |
| Security | 全局限额无法靠匿名主体限额替代 | unavailable | N/A |
| Error paths | unknown推理与clarification语义缺 | unavailable | N/A |
| Deployment | durable幂等不足以保证外部exactly-once | unavailable | N/A |

## Section 1 — Architecture

```text
Browser static (fixture / real distinctly labelled)
   | cookie + CSRF + owner/video/session generation
   v
api.py ---- schema.py / config.py / auth.py
   |                 |
   | prepare intent  +---- typed errors + admission limits
   | final chat
   +---- agent.py --> retrieval.py --> index.py (FAISS + BM25)
   |       |             |                 |
   |       +---- validation.py <---- media.py (absolute PTS)
   |       +---- models.py ---- self-host GPU / cloud text only
   |                |
   |           attempts.py (reserve/dispatch/complete/unknown)
   v
storage.py (SQLite: owners, jobs, manifests, requests, tombstones)
   ^       | short transaction + generation CAS
   |       v
jobs.py / worker.py --> ingest.py --> windows.py / media.py
   |                         |
   +---- lifecycle.py <------ index generation publication
          expiry + delete + bounded cleanup retries
eval/run.py + baselines.py read explicit dataset/protocol/revisions
```

A1 P1（计划缺口，confidence8）：checkpoint:403/404只有阶段幂等及有限单输入，399只有3次zoom，没有部署全局并发、排队、磁盘、文本调用/循环总量。匿名用户可开多个主体绕过每主体限制，10倍负载可使OOM或队列无界。选择统一admission及D1有效限额表；全局GPU并发初值1、摄取worker1、摄取排队2、每会话查询1，查询没有空闲slot时429，另有全局query slot。real必须冻结非零有限磁盘/上传/时长/像素/问题/Agent step、文本调用token和墙钟上限，未设值preflight失败。替代是仅靠timeout或每主体限额，拒绝，因为不能约束总资源；超时/预算按已有证据partial，否则error，不能no_result。E01覆盖。

A2 P1（confidence9，推理到持久化之间存在失败窗口）：checkpoint:403“重试同job_id+阶段去重”不能证明云服务只执行一次。先提交attempt预算与reserved，dispatch后落dispatched，返回落completed；崩溃/连接丢失落unknown并保持已扣费尝试，不能自动再发。worker恢复CAS领取阶段lease，过期lease不授权重发unknown；只有供应商实际验证幂等键才可按该语义复取，否则向用户显示不确定/允许在剩余预算内明确新尝试。替代是无条件retry失败阶段，拒绝，因为重复计费和漏计预算；E02与故障注入测试闭环。它仍不能承诺外部exactly-once。

A3 P1（confidence9，依赖冲突）：checkpoint:412将完整索引D4–6、检索D7–9，而414要求D2–3跨窗真实候选召回。将最小多窗处理、真实caption/ASR候选检索与跨窗合并提前到诊断切片，不能人工填入真值窗口，后续阶段加固完整索引与优化。真实四类八问全部依实际路径验证才GO；不用“合法JSON”替代。E03只是将既定验收的依赖前移，范围不减，GPU未知仍可NO-GO。

A4 P2（confidence9，契约冲突）：checkpoint:400四查询状态和422歧义选择不能把没有事件的澄清硬塞partial。暂定Taste C6：新增POST /api/chat/prepare控制响应kind=ready或clarification_required，返回服务器验证的事件/时间候选；POST /api/chat仍返回已执行查询的四状态。prepare不做zoom，若需查询改写文本请求计入同一intent账本；ready也可能产生合法新独立问题，不要求每问都有锚点。歧义直接提交/chat为409 precondition控制错误，保留问题且未执行查询。替代是一个/chat端点用独立控制envelope，四状态同样不变，客户端分支更复杂；最终门可覆盖。E04禁止新增第五查询status和猜测身份。

A5 P2（confidence8）：checkpoint:148/378以visited_segments去重会让新问题跳过旧窗口；失败也可能被误当“已检查”。分别记录candidate、successful_review、question_checked_ranges和returned_events。缓存匹配video/index_generation、采样PTS/window、规范问题、prompt/model revision/config hash，失败/unknown不存成功缓存；还有别的吗只去重已返回同事件，不略过所有旧sid。替代是会话sid布尔集合，拒绝，因无法支撑新问题语义；E05。

A6 P2（confidence9）：checkpoint:396指标目标存在但多事件/负样本/失败的分母未冻结。E06定义固定协议与一对一事件匹配，诊断前就写标注，不等看到模型结果再改规则。保留全部目标、真实集、基线和三消融，nohit问题单独测假阳性，所有timeout/失败留在完成率和正样本IoU分母。替代是从成功输出计算P95或随意挑事件，拒绝，因为可以虚增成绩。

安全审查与扩展边界：API、worker和媒体读取都经过同一owner/generation/expiry授权，不让内部工具自行信任模型提供的sid；工具参数必须属于当前索引清单。cookie在真实部署Secure/HttpOnly/SameSite，所有mutation校验CSRF及Origin，fixture只绑定localhost。文件名不作路径、subprocess argv不经shell、限制输出及超时，拒任意URL与路径穿越。WAL有busy timeout和有限重试，模型网络期间不持有DB写事务；吞吐满时清楚429，初版没有横向扩容承诺。

## Section 2 — Code Quality

Q1 P2（confidence9）：早期task中的web/与app/static/命名冲突，将静态资源归到src/frameseek/static/，同一套fixture和real渲染不同数据源。schema/config、模型adapter、时间转换各有唯一责任；api不再嵌模型提示，worker不直接渲染UI。没有现存代码可声明DRY重复；新的auth gate被媒体、chat、job等多调用点需要，选择共享一处是降低漏授权风险，净行数可能增加且未估计节省。E07约束和针对两类caller的越权回归，不建通用“framework”。

Q2 P2（confidence9）：checkpoint:196的“同一人还出现过吗”及146人物属性记忆会暗示身份能力，违反C10/G05。将源示例改成事件后续/相似动作、记忆保存已验证事件和物体锚点；不把不认识的人命名成身份id。source:238静音即低分也不等价于C14按直接证据支撑，应删除这一断言。E08用baseline唯一span替换，原源文件批准前保留，所有C/G/X块原文保留。

Q3 P2（confidence8）：source:323时长/窗口长度的成本估计忽略5秒overlap、scene count与失败尝试。改为实际N和账本attempt，粗标注重试额度D1另冻结且默认0（有失败则任务failed，用户明确重试且在已批准有限额度内才可新dispatch）；原30 primary-window保护不变，U1不在普通配置放开。成本unknown不填价；E09还要求errors建议动作不得自动重新付费。命名request_id、attempt_id、job_id、index_generation、chat_generation不同字段，不能一个generation无区别同时比较。

## Section 3 — Test Review（完整分支映射）

实际重新读取的是全部受影响计划输入；未来src/tests均不存在，现有覆盖为0而非100%。下表24个路径簇都为GAP，选择在对应实现任务加入必要测试（P1）；测试只验证已接受MVP要求，未给可逆文档改动新增镜像测试。完整断言和失败注入保存在docs/autoplan/test-plan-20261003.md及可写私有state副本。新项目采用pytest作为Python测试框架（待D1安装兼容验证），HTTP测试通过app边界，浏览器测试原生video与真实seek，不以mock player替代媒体回跳。测试图与test ledger逐项对应，不能把“无代码”当无测试分析。

```text
setup/config [01] -> mode fixture [02] / real preflight [03]
owner/session [04] -> upload duplicate/new [05]
  -> probe valid/invalid [06] -> windows/VFR/tail [07]
  -> ASR visual channels [08] -> durable worker [09]
  -> paid attempt completed/unknown [10] -> publish CAS [11]
  -> ready index version [12] -> prepare clear/ambiguous [13]
  -> hybrid candidate [14] -> bounded tools/zoom [15]
  -> cache new/same/more [16] -> evidence/support/merge [17]
  -> JSON/repair/four statuses [18] -> HTTP errors [19]
  -> UI upload/chat/generation [20] -> seek/focus/audio [21]
  -> expiry/delete/rollback [22] -> responsive/a11y [23]
  -> metrics/baselines/ablations/perf [24]
```

| ID | Flow与branch | 类型/拟定文件 | 存在/处置 |
|---|---|---|---|
| 01 | 优先级、单位、非法硬边界、秘密脱敏 | unit test_config.py | 无；加 |
| 02 | 无密钥fixture、模式切换独立会话、固定答案标记 | integration test_modes.py＋browser | 无；加 |
| 03 | real有/无权限、版本、GPU容量、语言 | integration test_preflight.py＋实机smoke | 无；加 |
| 04 | cookie/CSRF/Origin/多主体/工具sid越权 | HTTP test_auth.py | 无；加 |
| 05 | 新/同幂等payload/冲突payload、上传中断 | integration test_api.py | 无；加 |
| 06 | 恶意路径/坏媒体/零时长/超字节像素/超N/磁盘 | unit＋integration test_media.py/test_limits.py | 无；加 |
| 07 | 连续3600s=32窗、scene更多、尾段、VFR PTS、跨窗 | unit test_windows.py/test_media.py | 无；加 |
| 08 | 无音轨/静音/不支持/失败、视觉差音频兜底/全失败 | integration test_ingest.py | 无；加 |
| 09 | queued每阶段、重复worker、lease、取消/刷新/恢复 | integration test_jobs.py | 无；加 |
| 10 | 扣预算前后、dispatch前后/返回丢失崩溃、unknown | fault injection test_attempts.py | 无；加 |
| 11 | 完整/缺artifact、旧gen、删除或到期与发布两顺序 | integration test_jobs.py/test_lifecycle.py | 无；加 |
| 12 | compatible/模型变更/采样变更/rebuild原子切换 | integration test_index.py | 无；加 |
| 13 | 独立问题/0或多锚点/选择/伪造/重置后旧intent | HTTP＋browser test_context.py | 无；加 |
| 14 | 双通道/单通道警告/BM25+vector/rerank空与失败 | unit＋fixture test_retrieval.py | 无；加 |
| 15 | >120拆窗、3attempt/扩窗/重试、循环/非法tool/deadline | unit＋fault test_agent.py/test_limits.py | 无；加 |
| 16 | 相同/不同问题、失败不hit、rev变更、more非穷尽 | unit＋integration test_cache.py | 无；加 |
| 17 | frame事件范围、score xor level、无据剔除/同事件冲突 | unit test_validation.py | 无；加 |
| 18 | ok/partial/no_result/error、空、JSON block、repair0/1/失败 | unit test_schema.py＋fixture eval | 无；加 |
| 19 | 400/401/403/404/409/410/429/502/504和可用docs link | HTTP test_api.py | 无；加 |
| 20 | 五状态、双提交/草稿、刷新/迟到/重置/换视频 | browser test_ui_flows | 无；加 |
| 21 | event-start/frame-time、保持play、seek失败/音频/焦点 | browser＋真实媒体 smoke | 无；加 |
| 22 | 所有派生TTL、重启清理/失败重试、rollback不复活 | integration test_lifecycle.py/test_migrations.py | 无；加 |
| 23 | 320/768/1024/200%、long文本、键盘/读屏/reduced motion | browser＋manual checklist | 无；加 |
| 24 | 诊断8问、正负多事件metric、timeouts、全基线/三消融 | unit test_metrics.py＋eval-real | 无；加 |

LLM/prompt变化需要：确定性schema/status/evidence fixtures；四类真实诊断；10视频30问开发集；独立冻结报告集目标30/100且披露规模；ASR关键词、固定混合一次zoom和Agent基线；双通道、zoom、混合检索三个消融；中文问题/语音/画面文字分开；含prompt injection、噪音、跨窗、negative、失败/timeout；成本/显存/冷warm性能和人工任务计时。fixture不计真实质量。每次更换prompt/model/revision/采样/检索config重跑相关固定集，最终全集D17–20，GPU无权限则明确not run。

## Section 4 — Performance

P1 无当前SQL可确认N+1，但每候选逐条查询帧/ASR再重复解码是计划热点。检索批量读取top-k段与证据metadata，向量/BM25按generation持有，不为每问重建；先记录call count和阶段耗时再优化，不能凭估计发明吞吐。有限候选和缓存仍不能跳过所需事件；测试批量/逐条语义一致及候选完整性。

P2 全视频解码到内存风险最大。流式ffmpeg采样/逐窗处理，单次Omni保留≤128个缩放帧，不缓存全视频decoded像素；音频分块有offset，临时文件继承TTL。模型权重是否同卡可共部署必须测峰值，不以F2重量简单相加证明。先GPU串行；加载失败/OOM只可已验证降级或清楚失败。

P3 cache key按E05完整隔离，限字节/条数及TTL，不保留已删owner媒体。缓存证据metadata/受限结果，不保存无界prompt或用户原文日志；命中仍重新授权和到期检查。缓存失效/重启影响耗时但不得影响真实结果边界，冷warm分别报告。

P4 P95≤15秒仍是目标，不把60秒操作timeout当达标。以HTTP受理到最终响应计时，包含检索/队列/文本/zoom/校验，用户端播放器另计；拒绝率、完成率、失败/超时数同时报告，困难查询不剔除。D2–3开始阶段计时，D7–9初报显存/费用，D17–20冻结；小时目标U1未解决则blocked。E10约束，不新增长期监控产品。

## Failure Modes Registry

| Paths | Realistic failure | 处理/测试 | 用户可见 | Critical gap after plan |
|---|---|---|---|---|
| 01–03 | missing Python/secret/GPU/unsupported revision | preflight refuse、01–03 | setup说明/real不可用 | no |
| 04–05 | 越权、CSRF、幂等collision、上传中断 | reject＋payload hash、04–05 | 403/409/retry | no |
| 06–08 | decode失败、N超预算、PTS错、丢失通道 | preflight/manifest、06–08 | 原因/能力警告 | no |
| 09 | worker崩溃或取消仍调度 | durable lease/终态检查、09 | 同job恢复/取消进度 | no |
| 10 | 云执行了但本地结果unknown | attempt预扣/不自动重发、10 | 明确不确定与剩余额度 | no |
| 11–12 | 半索引ready/旧gen覆写/版本不兼容 | manifest CAS/rebuild、11–12 | 未ready/重建要求 | no |
| 13 | 猜身份、过期choice、prepare消耗隐形重试 | typed控制/验证/同账本、13 | 澄清/409 | no |
| 14–16 | 候选空/模型循环/新问题错误cache | channel检查/总限制/完整key、14–16 | nohit仅成功；否则error/partial | no |
| 17–19 | 幻觉证据、混分、JSON repair失败 | validation/互斥/一次repair、17–19 | unresolved/request_id | no |
| 20–21 | 迟到结果/seek失败/焦点丢失 | gen guard/真实播放器、20–21 | 保持草稿/重载/时刻 | no |
| 22 | 过期仍可读/rollback复活/清理失败 | 墓碑/expiry每读检查/重试、22 | 410/清理未完成 | no |
| 23 | 小屏遮输入/键盘无法seek | responsive/text buttons、23 | 等价可操作流程 | no |
| 24 | 只算成功样本/把fixture算模型质量 | 固定分母与raw outcomes、24 | 测量缺口如实报告 | no |

输入存在两类可能静默且无指定回归的critical gaps（unknown云尝试与错误visited缓存）；本轮E02/E05处理及测试使计划层为0。实际实现/运行测试仍全未完成，不能宣称系统安全通过；U1是已明确blocked方向问题，不是静默缺口。

## NOT in scope / TODOS

保持源V2多视频/复杂上下文、身份/说话人分离、bbox/领域API、分布式扩容四组TODO，已有what/why/pros/cons/context/effort/dependencies完整，工程复核不新增扩张。公共SDK、收费服务、社区运营、自动遥测/cron也不进入MVP。保留所有v1，不将缺GPU或时间紧直接转换成削范围；真实GO失败再呈方向选择。

## Worktree / Dependency strategy

当前nongit不能创建真实worktree，以下为实施时建立Git后的组织建议，不是已启动并行任务。

| Step | Modules | Depends on |
|---|---|---|
| S0 契约/包/config/auth基线 | core, docs | — |
| S1 backend切片→jobs/index→agent/lifecycle | core, storage, ingest, retrieval | S0 |
| S2 UI状态/证据/响应式 | static | S0的fixture契约 |
| S3 固定标注与metric基线 | eval | S0的schema |
| S4 真链路integration/eval/deployment | core, static, eval, docs | S1/S2/S3 |

潜在3 lanes：A=S1，B=S2，C=S3；S0先完成再launch A+B+C，三者合并后S4。schema、api、models、README及deployment共享，修改放A并将变更先合入B/C，不能同时改共享文件。真实GPU与人工标注是串行瓶颈，并行不会把未知模型性能压成可保证工期；当前评审不调度实施。

## Implementation Tasks

估计基于新项目单机实现，CC时间不含账户批准/GPU等待/人工标注；不是27天保证。8任务派生自明确发现，详细范围同时进入accepted E块，既有任务与本轮重叠由最终aggregator合并。

- [ ] **T1 P1 human ~1天 / CC ~2小时** — resource — 全局admission与有限Agent调用账本。Files: src/frameseek/config.py, attempts.py, models.py, tests/test_limits.py。Verify: 10x多主体负载、OOM/循环/timeout不越界。（A1/P2）
- [ ] **T2 P1 human ~1天 / CC ~2小时** — durable — 持久attempt、query幂等与worker lease。Files: src/frameseek/storage.py, jobs.py, attempts.py, tests/test_attempts.py。Verify: dispatch前后及response丢失、两worker竞态。（A2）
- [ ] **T3 P1 human ~1天 / CC ~2小时+标注** — diagnostic — 前置真实跨窗候选与完整GO依赖。Files: src/frameseek/ingest.py, retrieval.py, eval/diagnostics.json, eval/run.py。Verify: 四类8问真实候选/证据/无幻觉，不使用seed truth。（A3）
- [ ] **T4 P1 human ~6小时 / CC ~1小时** — context — 实现typed澄清与按问题/revision缓存。Files: src/frameseek/api.py, schema.py, agent.py, cache.py, tests/test_context.py, test_cache.py。Verify: 伪choice/迟到/新问题/unknown缓存拒绝。（A4/A5）
- [ ] **T5 P1 human ~1天 / CC ~2小时** — eval — 冻结指标分母及24路径回归计划。Files: eval/run.py, baselines.py, docs/evaluation.md, tests/test_metrics.py, tests/*。Verify: 多事件/nohit/失败/timeout fixture及原真实套件。（A6/Test）
- [ ] **T6 P2 human ~4小时 / CC ~45分钟** — organization — 统一package assets/共享authorization/安全示例。Files: src/frameseek/auth.py, static/*, ARCHITECTURE.md, profile.md。Verify: 所有caller拥有权检查、旧doc同步、身份不猜。（Q1/Q2）
- [ ] **T7 P1 human ~6小时 / CC ~1小时+实机** — performance — 流式采样/批量检索/成本与阶段实测。Files: src/frameseek/media.py, index.py, retrieval.py, eval/run.py, docs/deployment.md。Verify: 原目标、RSS/VRAM、actual N/attempt成本、冷warm/完成率。（Q3/P1–4）
- [ ] **T8 P1 human ~6小时 / CC ~1小时** — lifecycle — 原子manifest、expiry/删除/升级全链闭环。Files: src/frameseek/lifecycle.py, storage.py, jobs.py, tests/test_lifecycle.py, test_migrations.py。Verify: 双顺序竞态/全部派生TTL/backup不复活。（Architecture/X05）

## Decision ledger / Approval readiness

D35–D47按autoplan P1/P2/P5逐项自动决定，唯一本轮taste为C6澄清控制接口；U1继承CEO未决，不新增User Challenge。E01–E12是每条完整接受义务和verification，不靠task摘要授权。必要测试源于对应已有或本轮明确接受行为，pytest是新项目默认测试实现选择，没有付费CI或额外产品策略。Approval readiness: PASS（D35–D47授权依据为用户本轮autoplan及其auto-decision override；C6暂定；U1未授权预算修改）。这表示自动计划决策齐全，最终用户批准仍pending。

## Completion Summary

Step0 scope accepted as-is；Architecture 6 issues；Code Quality 3 issues；Test完整图24 gaps、现有测试0；Performance 4 issues。NOT in scope / What already exists / TODOS完整。两个输入critical gaps已给处理和回归，最终计划critical gaps0、实现仍未验证。本轮unresolved方向0，继承U1及C1–C6暂定taste；outside unavailable，native completed6。潜在3parallel lanes、S0/S4及共享模块sequential，当前nongit不能启动worktree。Lake Score N/A（无独立coverage选项评分，不伪造10/10）。Review logs依autoplan parent延后最终批准，不写clean。

## GSTACK REVIEW REPORT

Skill: plan-eng-review；Mode: FULL_REVIEW；Status: DONE_WITH_CONCERNS；Issues: 13 primary（6 architecture/3 code/4 performance）与24覆盖簇缺口，native6为其中重叠输入而非额外加总。Persistence: 本报告与test plan已保存，accepted要求合入活动计划后经完整packet语义核对。Unresolved: 本轮0方向、继承U1=1；Taste C6暂定，所有实现验证未运行。Critical gaps: planned0；Outside provider Codex unavailable/host codex，native in-host completed unknown model；Consensus N/A。Final approval pending。
