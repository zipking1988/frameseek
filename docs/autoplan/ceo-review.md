
### CEO 独立战略结果与处置
INPUT ceo 8fd1f5444e4f3f450e9b3114489bcb3e0e0ba8c828ef4b12cb8060055abc0267，native ceo_voice完整读428行32236bytes输入，输出5项：Critical预算矛盾→U1保持未决；High闸门只验证格式→C17真实诊断；High需求未验证→C18三类任务人工计时；High缺简单替代基线→C18同集三方案；High性能发现太晚→C19提前测量。全5项已作处置，U1一项待用户，C17–19未宣称已实现。
外部voice=unavailable/under_codex，本机未启动嵌套CLI。只有native和parent两次同宿主检查，不能称为不同模型共识；critical预算finding仍然可行动。

### CEO DUAL VOICES — CONSENSUS TABLE
| Dimension | native（Codex宿主） | 外部Codex CLI | Consensus |
|---|---|---|---|
| Premises valid | 语言/采样/预算有待证前提 | unavailable | N/A |
| Right problem | 证据复核问题成立，需任务验证 | unavailable | N/A |
| Scope calibration | 全MVP保留，U1小时阻塞 | unavailable | N/A |
| Alternatives | 简单基线需比较 | unavailable | N/A |
| Competitive risks | 不可宣称首创检索 | unavailable | N/A |
| 6-month trajectory | 需提前用户价值/性能验证 | unavailable | N/A |

### CEO Section 1：Architecture Review
两份文档已有三层逻辑，却没有摄取worker和索引发布的边界；C08/C13将可查询版本定义为完整通道manifest。一次小时摄取和多个查询争抢同GPU是明确的首个瓶颈，C06/C19以实际显存/串行调度验证而不新增集群。32窗/30次的矛盾是当前唯一需用户改变原预算的方向项U1，保持blocked；不把文档中的架构图视为已部署系统。
```text
Browser -> FastAPI (owner/request boundary) -> SQLite jobs/videos/sessions
              |                                    ^
              | query READY generation             | atomic manifest
              v                                    |
   retrieve (BM25 + FAISS) <- index files <- Ingest worker
              |                                  | probe/frame/audio
              v                                  v
     rerank -> bounded zoom -> validate     Self-host GPU Omni/ASR/Embed
              |                                  |
              +---- text only ----> Token Factory Ultra/Super
              v
     schema envelope + private evidence URI -> Browser video.seek
```
Before只有文档，After新增单应用/worker/模型服务；不混入跨视频服务、说话人身份服务。10x并发先限制单GPU队列与视频占用；100x能力不在本次承诺，需之后容量设计。

### CEO Section 2：Error & Rescue Map
检查上传、解码、采样、转写、标注、向量、检索、回看、输出、会话和删除12条失败路径。各条失败需命名而不是一段catch-all，C02/C04/C08/C13/C15明确用户结果与恢复路径。模型拒答、空内容、坏JSON、schema无效和证据不成立各是不同错误；有合法证据才允许partial，纯失败不能成为no_result。
| METHOD/CODEPATH（计划接口） | Failure / class | Rescue | 用户结果 | 验证 |
|---|---|---|---|---|
| upload_video | TooLarge/InvalidMedia | 拒绝且清理临时文件 | 具体限制/文件错误 | 零字节/伪MIME/超限 |
| probe_video | MediaDecodeError/Timeout | 标记failed，可重新上传 | 无法解码 | 损坏视频 |
| sample_frames | MissingPTS/FrameMissing | 不发布visual通道 | 视觉不可用警告/failed | VFR/尾帧 |
| transcribe | UnsupportedLanguage/ASRTimeout | 有视觉则显式降级 | 音轨未处理 | 中文/噪声/无轨 |
| caption | EmptyResponse/ModelRefusal | 有限尝试，否则不publish | 模型不可用 | refusal/empty |
| embed_and_publish | DimensionMismatch/StorageError | staging隔离，失败可重试 | 索引失败 | 写中断 |
| retrieve | IndexGenerationMismatch | 不查询错误版，返回409 | 视频暂不可查 | 旧缓存 |
| zoom | BudgetExceeded/ModelTimeout | 全局3尝试；有证据partial | 未检查范围 | 3次封顶 |
| build_answer | JSONDecode/SchemaInvalid | 文本repair一次，再error | 输出处理失败 | 半JSON/NaN |
| apply_turn | StaleSessionVersion | 不追加，返回冲突 | 已重置/请重试 | 迟到响应 |
| read_media | NotOwned/Expired/Deleted | 禁止读，不泄露路径 | 不可访问 | 跨主体/过期 |
| delete_or_expire | CleanupError | 先不可读，再可恢复清理 | 删除处理中 | worker竞态 |
以上为必需计划处理，实际rescued/tested均未实现；不能将“计划有救援”误报为线上已覆盖。
```text
model call -> refusal/empty/error -> typed error -> bounded retry -> partial/error
           -> content -> last JSON -> schema -> valid evidence -> answer
                                      | invalid
                                      v
                            ONE text repair -> validate -> error if still invalid
```

### CEO Section 3：Security & Threat Model
上传与解码引入文件和资源耗尽入口（高影响），必须参数数组调用ffmpeg、限制字节/时长/像素、解码超时与私有存储。媒体ID直接访问和跨会话数据泄漏是高影响风险，C09逐端点校验拥有权，不能只在聊天接口拦截。视频文字/台词可能含要求工具越权的内容，这些只能当待分析的数据；日志仅元数据且TTL/级联清理，密钥环境注入与云请求留存政策仍需D1核对。
| 威胁 | likelihood / impact | 计划防护 | 需证明 |
|---|---|---|---|
| 媒体ID越权 | Med/High | 会话拥有权与文件路由同一校验 | A/B主体读取/删除都隔离 |
| 文件/命令注入与解码炸弹 | Med/High | 限额/超时/subprocess list | 路径穿越/畸形视频被拒 |
| 媒体提示攻击 | Med/Med | 工具参数独立校验，媒体无权限 | 字幕要求泄密不能执行 |

### CEO Section 4：Data Flow & Interaction Edge Cases
逐节点检查输入为空、超限、失败、重复、部分索引和过期数据；所有shadow路径都必须回到明确状态。共享数据最危险的不是单个SQLite写，而是worker已拿到generation以后遇到删除，或query等待模型时遇到会话重置；提交时再次校验才能拒绝迟到结果。原文的visited_segments支持“还有别的吗”，只有已成功回看的窗口才计入，超时或未看过的候选不能被永久排除。
```text
UPLOAD -> validate -> probe -> sample/ASR -> index staging -> publish -> query
  nil/empty -> 422    decode error -> failed     crash -> resume staged generation
  duplicate -> same job result                  deleted/expired -> no publish
QUERY -> owner/ready -> resolve -> retrieve -> zoom -> evidence/schema -> commit turn
  bad input -> 422      stale -> 409    budget/timeout -> partial/error

Order A: worker computes(g=1) | delete tombstones(g=2) | worker CAS(g=1) REJECT
Order B: worker publishes(g=1)| delete tombstones(g=2) | query/media owner check REJECT
Order A: query awaits model(s=1)| reset session(s=2) | query commit(s=1) REJECT
Order B: query commits(s=1)     | reset session(s=2) | old UI response dropped by version
```
| 交互 | 8项edge case | 行为 |
|---|---|---|
| 上传 | 双击/重复网络提交 | same request/job；不重复收费 |
| 索引 | 离开页面/刷新 | 任务持久化，回来查状态 |
| 重试 | failed/仍在queued | 只恢复失败阶段，队列有可见状态 |
| 查询 | 双提交/迟到响应 | 单会话序列版本，不重复追加 |
| 换视频 | 老答案返回 | video/session/request三者匹配才显示 |
| 证据 | 过期URI/删后缓存 | 显示不可用，禁止再访问 |
| 结果 | 0/大列表 | no_result或稳定排序分组；不加载所有帧 |
| 删除 | 与publish/retry竞态 | 墓碑+generation，拒绝復活 |

### CEO Section 5：Code Quality Review
没有代码可做逐函数质量评价，不能写“代码无问题”。计划采用显式小模块分离时间/契约、摄取、检索、对话和存储，避免十个M模块各建一个服务；重复的分窗和授权检查只允许一个共享入口。配置边界、schema和模型适配器职责必须清楚，核心方法超过五种分支时以阶段函数拆分，但无需框架化抽象。

### CEO Section 6：Test Review
已有指标但没有实现级回归路径，C02–C19把可观察结果映射到测试。最放心的端到端不是随便问一句得到JSON，而是真实已标注片段可召回、经zoom得到受支持事件、证据点击回到原视频且删除后所有URI不可访问。最恶意的测试是把删除/重置放在模型await中间，释放worker后不能写回；Chaos测试杀摄取进程再重启仍不发布半索引。
```text
upload/owner -> decode/windows/PTS -> ASR/caption -> publish -> retrieve -> zoom -> answer -> seek
 Unit: limits   duration/overlap     offset/empty    CAS       fusion      budget    schema/support
 Integration: ffmpeg fixture        adapters        DB/files generation             private media
 E2E: supported real diagnostic -> answer/evidence/seek; then delete -> media 404/410
 Eval: >=10videos/30QA + 3 required ablations + simple baselines, frozen actual report set
```
构成应为大量纯函数unit、少量DB/ffmpeg integration和两三条产品E2E；线上模型测试独立于确定性CI，记录revision而不靠外部延迟硬assert。随机/时间测试使用固定fixture和可控时钟，负例和跨窗事件不能只出现在手工demo。

### CEO Section 7：Performance Review
三个最慢路径为Omni回看/thinking、全视频标注与ASR/Embed串行争GPU；无实測p99，不编造数值。粗扫窗口数必须按真实分窗算而不是duration/120，召回缓存键必须含video_generation/model_revision/schema/query，否则会读过期结果。视频和帧流式/分块处理，SQLite按video/generation/time建索引，候选先有限召回再批量rerank；连接和GPU并发有上限，C19提前验证原15秒和30分钟目标。

### CEO Section 8：Observability & Debuggability Review
当前只有trace示例，还缺操作层阶段耗时、预算和失败码三项可诊断信息。C12/C19要求request/job_id与stage贯通，指标包括队列等待、索引失败率、调用次数、schema repair、有效回答率、证据支撑和过期清理积压；不为这些观测引入新服务。部署文档提供每个错误码的检查/重试动作和本地报告面板或CLI汇总，阈值由预检配置，不假造运营告警已配置。

### CEO Section 9：Deployment & Rollout Review
新项目没有既存迁移可审，但仍会遇到schema/index版本不一致与模型镜像更新两种风险。先固化模型镜像/revision、存储schema与manifest版本，再部署worker和API，真实smoke后才让上传可用；fixture只能用于开发。回滚保留上个应用/镜像/索引manifest并关新任务入口，不能把半成品generation切到ready；短期单实例停机维护可接受，非零停机SaaS承诺。
```text
preflight -> model health -> DB/schema -> worker/API -> real smoke -> enable upload
fail -> block ingress -> restore previous app/model -> select previous READY manifest -> smoke
new generation staged -------------------- not published until all capabilities valid
```

### CEO Section 10：Long-Term Trajectory Review
模块与契约可逆性约4/5，供应商/模型适配器替换可保持结果schema，实际权重许可/成本不可由代码回滚。两项债务是未校准支持度和中文感知能力，均以明确边界和评测留痕，不伪装已解决。未来多视频/身份/API用相同video_id/generation/证据契约扩展；本次不实现分布式平台，也不为了未来加入通用workflow系统。

### CEO Section 11：Design & UX Review
用户先看到当前视频和索引状态，再看到问题与答案，最后逐条核验证据，不应该先展示模型工具日志。上传、索引、聊天和证据都覆盖loading/empty/error/success/partial；partial不能只靠黄色颜色提示，还需文字说明未查范围。原生播放器、键盘可点证据、手机视频在前聊天在后是最小可用体验；设计阶段会细化而不宣称已渲染可访问性通过。
```text
empty -> upload -> indexing -> ready -> ask -> reviewing -> answer (+ evidence seek)
            | fail       | fail                     | no_result/error/partial
            v            v                          v
          retry        retry                    clarify/ask more/reset
any state -> delete/expire -> unavailable (cannot seek hidden cached media)
```

### CEO NOT in scope
原文延后7类：跨视频知识库、复杂人物关联/re-id、说话人分离、bbox、实时流、领域词表增强、开发者公开API。新扫描的分布式运营平台也延后，当前单GPU场景不需要新infra；企业级合规宣称和未授权Cosmos救援是拒绝项，不进TODO。原MVP中的隐私、zoom、追问、评测与播放器不延后。

### CEO What already exists / Dream state delta / Stale diagrams
现有仅源文档和本机ffmpeg/ffprobe；没有app helpers、数据库或测试可借。原架构三层图保留逻辑；扩窗3次已由baseline修正为共享budget，原图还有预算表已检查，没有源代码ASCII注释待更新。距12个月理想仍差多视频/语言/校准/身份能力，但已规划可信单视频闭环与扩展契约。

### CEO Failure Modes Registry
| Codepath | Failure | Planned rescued/test? | 用户可见 | metadata log | Critical gap |
|---|---|---|---|---|---|
| upload/probe | invalid/too large/timeout | yes / pending implementation | 具体失败 | yes planned | no in plan |
| sample/ASR | PTS错/缺语音/不支持 | yes / pending | capability warning | yes planned | no in plan |
| caption/embed | empty/OOM/shape | yes / pending | failed/retry | yes planned | no in plan |
| publish | half index/stale write | CAS / pending | not ready | yes planned | no in plan |
| query/zoom | budget/timeout/injection | global budget / pending | partial/error | yes planned | no in plan |
| schema/evidence | bad JSON/unsupported claim | repair/reject / pending | error/unresolved | yes planned | no in plan |
| reset/delete/expire | late response/resurrection | tombstone/version / pending | unavailable | yes planned | no in plan |
| hourly admission | >=32windows vs cap30 | reject / arithmetic verified only | BUDGET_EXCEEDED | yes planned | U1 user blocker |

### CEO Implementation Tasks
- [ ] T1 (P1, human ~4h / CC ~1h) 环境与实际模型预检；Files: README.md, .env.example, scripts/preflight.py, docs/deployment.md；Verify: 目录/health/真实片段输出、峰值显存、语言分项报告。
- [ ] T2 (P1, human ~6h / CC ~45min) 输出/时间/支持契约及文档同步；Files: src/frameseek/schema.py, src/frameseek/media.py, tests/test_schema.py, ARCHITECTURE.md, profile.md；Verify: 四状态、互斥支持字段、绝对秒/证据归属、repair仅一次。
- [ ] T3 (P1, human ~1d / CC ~2h) 持久摄取/分窗/能力manifest与全局budget；Files: src/frameseek/ingest.py, jobs.py, storage.py, agent.py, tests/test_ingest.py；Verify: 无音轨/VFR/低清兜底、32窗拒绝、单query最多3视频推理。
- [ ] T4 (P1, human ~1d / CC ~3h + 标注) 真实诊断集与简单基线；Files: eval/diagnostics.json, eval/run.py, eval/annotations/；Verify: 至少8问4类、正例召回负例不编事件；不能fixture替代。
- [ ] T5 (P1, human ~1d / CC ~90min) 媒体拥有权/TTL/删除竞态；Files: src/frameseek/api.py, storage.py, jobs.py, tests/test_lifecycle.py；Verify: 跨主体拒绝、全部派生过期、publish/delete两序。
- [ ] T6 (P1, human ~1d / CC ~3h) 早期性能与完整评测；Files: eval/run.py, eval/baselines.py, docs/evaluation.md；Verify: D2–3初测/D7–9阶段报告、原开发集+三消融/冻结集，失败完成率单报。
- [ ] T7 (P2, human ~4h / CC ~45min) 证据/五状态/引用与重置UI；Files: web/index.html, web/app.js, web/styles.css；Verify: seek/原音频复核、迟到结果、键盘与手机布局。
- [ ] T8 (P1, human ~4h / CC ~60min) 部署/回滚/赛事提交材料；Files: docs/deployment.md, README.md, LICENSE；Verify: 真模型闭环smoke、删除后媒体不可读、复现命令与demo一致。
任务估算为人工与AI辅助工程估计，标注/排队/GPU响应需另计；硬件不确定不能按脚手架压缩比承诺。

### CEO Completion Summary
| Item | Result |
|---|---|
| Mode | SELECTIVE EXPANSION；来自autoplan override |
| System Audit | 文档greenfield；无Git/代码/测试/历史，ffmpeg可用 |
| Step0 | spec两次，6→9/10，10问题修复确认；C01–19，U1未决 |
| Arch | 2风险，budget U1仍待用户，发布边界已规划 |
| Errors | 12失败入口，0未规划救援；实现/测试均未开始 |
| Security | 3威胁、2高影响；补验证计划 |
| Data/UX | 8edge cases，竞态两种完成顺序规划 |
| Quality | 2结构问题；没有代码可逐函数评价 |
| Tests | unit/integration/e2e/eval图；3原空白补验证义务 |
| Perf | 3慢路径，数字待实跑 |
| Observability | 3缺口补阶段/预算/错误码，无新infra |
| Deployment | 2版本风险，deploy/rollback图 |
| Future | 可逆4/5，2显式技术债 |
| Design | 2信息/状态问题，已计划补齐 |
| NOT in scope | 8 deferred类，2拒绝类；源MVP保留 |
| What exists / dream | 已写，缺多视频/身份/语言/校准 |
| Error registry | 12rows，0未规划critical，实际覆盖unknown |
| Failure registry | 8rows，1用户预算blocker |
| Scope proposals | S1–S7七项，六接受（四源行为补全、两Taste）、一既定延期族；U1单独pending |
| TODOS | 源V1/V2和分布式运营延期待保存 |
| CEO plan | scope已写，最终摘要即将写 |
| Outside | unavailable under_codex，native completed，consensus全N/A |
| Lake Score | N/A，无coverage问答工具调用；自动选择完整原则留audit |
| Diagrams | 7（架构/错误/数据与交错/测试/deploy/rollback/用户状态） |
| Unresolved | 1 U1；Taste C1/C2暂定最终可覆盖；模型实跑未通过 |
| Approval readiness | 计划审阅可交付；U1明确pending，不能无条件CLEAR |

| D18 | ceo | D2–3四类诊断集 C17 | Mechanical | P1/P2 | 原真实闸门应证明产品价值 | 合法JSON就GO |
| D19 | ceo | 简单基线与三类任务 C18 | Mechanical | P1/P3 | 复用开发集，不新infra | 单demo证明通用 |
| D20 | ceo | 前置实测 C19 | Mechanical | P1/P6 | 早发现延迟/准确退步 | 提交前才测 |
