<!-- /autoplan restore point: "/private/tmp/frameseek-autoplan-state/projects/frameseek/nongit-autoplan-restore-20261003.md" -->
## Implementation plan
# 通用视频对话 Agent — 系统架构

> 定位：**任意视频**上传后用白话对话检索与理解，输出带时间戳的结构化结果，支持多轮上下文。不限行业场景。
> 目标赛事：Nebius × NVIDIA Global AI Hackathon（提交截止 2026-10-30）
> 状态：架构 v3（事实与假设分离，待实跑校准）

**契约关系**：本文件为待批准实施计划，以根目录 ARCHITECTURE.md 为原始技术契约来源；后附的已接受义务为具体实现补充。最终批准后，在实现前将冲突条款和已批准补充同步到 ARCHITECTURE.md，使其继续作为唯一技术契约；未批准的用户方向调整不能同步。
`profile.md` 只做产品层概述，引用本文档时**使用章节名而非编号**（编号会漂移）。

---

## 0. 已核实事实与当前假设

> ⚠️ 本节区分「已读源」与「待验证」。凡标注**待确认 / 待实跑**者，均为假设，不得作为设计承诺使用。

| 编号 | 结论 | 状态 | 证据 / 验证方式 |
|---|---|---|---|
| **F1** | Omni 单次视频输入 **≤ 2 分钟**；1080p 采样至多 **1 FPS / 128 帧**；720p 可 2 FPS / 256 帧 | ✅ 已读源 | `nvidia/Nemotron-3-Nano-Omni-30B-A3B-Reasoning-BF16` 模型卡 README，读取日期 **2026-10-03** |
| **F2** | 权重与最低 GPU 建议：BF16 62GB（1×H100 80GB）· FP8 33GB（1×L40S 48GB）· NVFP4 21GB（1×RTX 5090 / Jetson Thor） | ⚠️ 已读源，**非实测** | 同上（厂商建议值；实际显存占用与吞吐需实测） |
| **F3** | 许可 = NVIDIA Open Model Agreement，**可商用**、全球、**非门控** | ✅ 已读源 | 模型卡 + HF API `gated=false`，2026-10-03 |
| **F4** | Nemotron 3 Ultra / Super / Nano（非 Omni）config 中无 vision 字段 → **纯文本** | ✅ 已读源 | HF `config.json`，2026-10-03 |
| **F5** | NVIDIA 无通用目标检测 / open-vocabulary grounding / SAM 类开源权重 | ⚠️ 已检索，**非穷尽** | HF API `author=nvidia`，检索词 detect / grounding / dino / sam，2026-10-03 |
| **F6** | vLLM 能启动 Omni（Mamba2-Transformer 混合 MoE） | ❌ **待实跑** | 需 smoke test；对应 GO/NO-GO 闸门 |
| **F7** | Token Factory 目录含 Ultra / Super 文本模型 | ❌ **待确认** | 需控制台核对具体模型名与版本 |
| **F8** | Nebius AI Cloud 可用 Serverless Endpoint / DevPod 部署自托管 vLLM | ❌ **待确认** | 需确认配额、镜像与价格 |
| **F9** | 模型对中文白话的理解质量 | ❌ **待实测** | 与 GO/NO-GO 同时测 |

### 0.1 F1 的完整取值（模型卡摘录）

模型：`nvidia/Nemotron-3-Nano-Omni-30B-A3B-Reasoning`（31B / A3B，Mamba2-Transformer 混合 MoE，256k 上下文）

| 项 | 值 |
|---|---|
| 输入模态 | Video / Audio / Image / Text |
| 输出模态 | **仅 Text** |
| 视频 | mp4，单次 ≤ 2 分钟；1080p ≤ 1 FPS / 128 帧；720p ≤ 2 FPS / 256 帧 |
| 音频 | wav/mp3，≤ 1 小时，≥8kHz |
| 视觉塔 / 语音塔 | CRADIO v4-H / Parakeet |
| 推理参数 | Thinking: temp 0.6 / top_p 0.95 / max_tokens 20480 / reasoning_budget 16384；Instruct: temp 0.2 / top_k 1 / max_tokens 1024 |
| 官方定位 | video+speech analysis、dense captions、video search and summarization |

**推论**：不存在"把一小时视频塞进 Omni"这条路径。系统必须是检索驱动的 agent —— 先廉价缩小候选，再只对少数 **≤120s** 窗口做受控密集采样回看。

### 0.2 F5 的检索结果

`author=nvidia` 下检索 detect / grounding / dino / sam，仅得：
- `nvidia/RT-DETR-Hand-Detector-v1`（只检测手）
- `nvidia/Cosmos-Embed1-448p-anomaly-detection`（异常检测嵌入，非检测框）

→ 空间定位（bbox）**无法用纯 NVIDIA 开源模型实现**。但赛事规则只要求「至少 1 个 NVIDIA 开源模型」，混入 YOLO / Grounding-DINO **合规**。决策见「诚实的能力边界」。

---

## 1. 三层架构

```
┌─ A. 摄取层（离线，Nebius GPU Job）─────────────────────┐
│  ffprobe → 音轨分离 → Parakeet ASR(带词级时间)          │
│  镜头切分(ffmpeg scene detect)                          │
│  ★ 窗口化：优先镜头边界，硬上限 120s，相邻重叠 5s       │
│  粗标注：每窗口 8–16 帧 → Omni 短描述 + 实体抽取         │
└───────────────────────────────────────────────────────┘
                 ↓ segments[]（t0,t1,caption,asr,entities）
┌─ B. 索引层 ───────────────────────────────────────────┐
│  Nemotron-3-Embed → 向量库(FAISS) + BM25 混合           │
│  llama-nemotron-rerank-1b-v2 → 精排                     │
└───────────────────────────────────────────────────────┘
                 ↓ 候选段
┌─ C. 查询层（在线，Token Factory Ultra/Super 编排）───────┐
│  1 上下文管理：多轮 → 查询改写 + 指代消解（"他/后来"）  │
│  2 规划：选工具 retrieve / zoom / asr_search            │
│  3 检索+重排 → top-k 段                                  │
│  4 精修：Omni 对一个或多个 ≤120s 子窗口                  │
│     做受控密集采样回看（1080p ≤1 FPS/128 帧）           │
│  5 验证：初次、扩窗与失败重试共享全局3次zoom预算       │
│  6 合成：结构化 JSON + 白话回答 + 引用                   │
└───────────────────────────────────────────────────────┘
```

**为什么粗标注只抽 8–16 帧**：1小时连续视频按120s/5s至少需要32次窗口调用，镜头切分可能更多；U1方向已按用户D49:A改为实际N＋已批准有限预算预检。具体额度未确认前仍保留30保护，费用未知/额度不足拒绝真实推理（E13），不截尾。密集回看的成本与时延更高，需要实测。粗扫便宜、密集只在候选段上做 —— 这是当前方案在**成本、时延与精度之间的主要平衡策略**。后续可引入分层采样、多级粒度索引、查询驱动的动态索引等策略。

---

## 2. 摄取层（A）

### 2.1 步骤

| 步骤 | 工具 | 输出 |
|---|---|---|
| 元信息 | ffprobe | duration / fps / 分辨率 / 是否有音轨 |
| 音轨 | ffmpeg -vn | wav 16k 单声道 |
| ASR | `nvidia/parakeet-tdt-0.6b-v3` | `{start,end,text}[]` |
| 镜头切分 | ffmpeg `select='gt(scene,...)'`（阈值可调） | 镜头起点数组 |
| **窗口化** | 见 §2.2 硬规则 | `Segment{video_id, idx, t0, t1}` |
| 粗标注 | Omni，8–16 均匀采样帧，**instruct 模式**（temp 0.2 / max 1024） | 1–3 句描述 + 实体列表 + 显著性分 |

### 2.2 窗口化硬规则（★ 关键约束）

```
MAX_OMNI_VIDEO_SECONDS = 120      # F1：Omni 单次视频输入上限
ZOOM_OVERLAP_SECONDS   = 5        # 相邻窗口重叠，用于跨边界事件合并
```

1. **优先在镜头边界切分**（避免把一个镜头从中间断开）。
2. **任何窗口不得超过 120 秒** —— 这是硬约束，不可因"不跨镜头"而违反。
3. **单镜头超过 120 秒时强制按 120 秒硬切**（此时硬切不可避免，优先保证 F1）。
4. **相邻窗口保留 5 秒重叠**。
5. **ASR 词块按时间范围复制到相邻重叠窗口**，保证跨边界语音上下文连续。
6. **输出阶段合并重叠区同一事件并去重**；支持度按C14同类型比较规则，无可比值时保留证据并标注冲突，禁止伪造分数。

> 规则 1 与规则 3 的优先级：规则 2/3 更高。**"不跨镜头硬切"只在镜头本身 ≤120s 时成立。**

### 2.3 吞吐

⚠️ **待 benchmark，非承诺**。目标是实测后将「1 小时视频索引」控制在 **30 分钟以内**（与 `profile.md` 初始验收指标一致）。"数分钟完成"仅是待验证的优化目标，**不作为当前承诺**。

---

## 3. 查询层（C）：Agent 循环

### 3.1 工具集（给 Ultra 的 function schema）

| 工具 | 作用 | 后端 |
|---|---|---|
| `retrieve(query, k, time_range?)` | 语义 + 关键词混合检索 + rerank | Embed + FAISS + rerank |
| `read_segment(sid)` | 取该段粗描述与 ASR | 本地表 |
| `zoom(sid, t0, t1, question)` | **Omni 受控密集采样回看** | vLLM Endpoint |
| `asr_search(pattern)` | 台词 / 语音关键词检索 | Parakeet 转写 |
| `answer(...)` | 终止并输出 | — |

### 3.2 `zoom` 的长度约束行为（★ 关键约束）

服务端**必须**校验 `t1 - t0 <= MAX_OMNI_VIDEO_SECONDS`：

1. 超长请求**自动改写**为若干带 `ZOOM_OVERLAP_SECONDS` 重叠的 ≤120s 子窗口；
2. 逐个子窗口调用 Omni；
3. 结果按时间合并，仅同一事件在重叠区去重，使用C14支持类型规则，不比较混合类型分数；
4. **绝不把超长片段直接发给模型** —— 否则直接违反 F1；
5. 初始回看、扩窗与失败重试共享**单次查询3次zoom视频推理尝试**；子窗口数也不得超过3；调用前扣预算，超额按C04明确partial/error，不静默截断。

### 3.3 多轮上下文状态

| 状态 | 内容 |
|---|---|
| `turns[]` | 原始对话 |
| `resolved_query` | 每轮由 Ultra 改写的独立查询（去指代） |
| `entity_memory` | 已验证事件 / 物体锚点与可观察属性；未知人物不推断身份 |
| `visited_segments` | 按问题区分候选、成功回看、检查范围和已返回事件；缓存须完整key匹配（E05） |

---

## 4. 输出契约

> 契约版本 `schema_version = "0.1"`，实现见 `src/frameseek/schema.py`。产品层说明见 `profile.md`。

```json
{
  "schema_version": "0.1",
  "status": "partial",
  "timebase": "video_absolute_seconds",
  "answer": "在 00:12:34 到 00:12:41 之间，画面中有人拿起桌上的物件并带出画面。",
  "events": [
    {
      "video_id": "v_001",
      "start": 754.0,
      "end": 761.0,
      "start_hms": "00:12:34",
      "end_hms": "00:12:41",
      "action": "拿起物件并带出画面",
      "summary": "……",
      "support_score": 0.72,
      "evidence": [
        {
          "t": 756.0,
          "t_hms": "00:12:36",
          "frame_id": "v_001_f756_0",
          "uri": "/media/v_001/frames/756.0.jpg",
          "caption": "……",
          "asr": null
        }
      ]
    }
  ],
  "unresolved": ["无法确认该物件之后是否被放回"],
  "followups": ["该动作之后发生了什么？", "还有相似动作吗？"],
  "trace": {
    "visible": {
      "channels": ["asr_keyword", "visual_vector"],
      "segments_reviewed": 3,
      "evidence_segments": 1
    },
    "debug": null
  },
  "errors": []
}
```

### 4.1 关键字段约定

| 约定 | 说明 |
|---|---|
| `timebase` | 固定 `"video_absolute_seconds"`：**所有时间字段均为相对视频起点的绝对秒数**，非窗口内偏移。内部计算一律用秒，`*_hms` 仅用于展示 |
| `frame_id` vs `uri` | 前者是稳定标识（程序引用、去重），后者是对外可访问地址；**不在响应中暴露内部文件路径** |
| `status` | `ok` / `partial` / `no_result` / `error`。`partial`（有 `unresolved`）是常态而非异常 |
| `unresolved` | **agent 必须能说"不确定"** —— 产品诚实度，也是评审 Quality of Idea 的加分项 |

### 4.2 `support_score` 的计算口径

```
support_score = 0.5 * evidence_coverage
              + 0.3 * temporal_consistency
              + 0.2 * model_score
```

| 分量 | 定义 | 范围 |
|---|---|---|
| `evidence_coverage` | 声明时间区间内被证据帧 / ASR 片段覆盖的比例 | 0–1 |
| `temporal_consistency` | 多次回看或相邻重叠窗口之间，时间边界的一致程度 | 0–1 |
| `model_score` | 模型自评置信度（**未校准**） | 0–1 |

规则：

- 固定 0–1，保留 2 位小数。
- **无 ASR 时** `evidence_coverage` 仅按视觉证据计算，**不补默认值**；按直接证据支撑程度判断，不因静音默认低分。
- 分数**会随 zoom 次数变化**（回看越多 coverage 越高）→ 因此它**仅用于排序与提示，不代表事实正确率**。
- 未经评测集校准；校准前**不跨 schema 版本比较**。
- ⚠️ **降级规则**：若三项分量任一无法稳定计算，退化为 `"support_level": "high" | "medium" | "low"`，**绝不输出伪精确的 0.72**。

### 4.3 `trace` 的两层设计

| 层 | 字段 | 暴露范围 |
|---|---|---|
| `visible` | `channels` / `segments_reviewed` / `evidence_segments` | **默认返回给所有用户** |
| `debug` | `tool_calls[]`（完整工具轨迹、参数、耗时） | 仅开发者模式或服务端日志，**默认 `null`** |

理由：

- 完整工具参数可能泄露内部 ID、检索原文或系统提示 → 不进 `visible`。
- `omni_calls` 这类计数易被误解为账单 → 不向普通用户暴露。
- 内部工具名未来变更时，**不应破坏 `visible` 契约** → 只暴露通道与计数。

### 4.4 从 thinking 模式到结构化 JSON 的提取链

reasoning 模式输出常含长文本或不严格 JSON，必须有确定性的提取与失败路径：

1. Omni **thinking 模式**生成内部分析；
2. 受控提示要求输出限定格式（独立 JSON 代码块）；
3. 服务端提取**最后一个** JSON 块；
4. 用 JSON Schema 校验；
5. 失败 → 执行**一次** repair（原文 + 校验错误回灌）；
6. 仍失败 → 返回 `status: "error"` 或 `status: "partial"` 并填充 `errors`，**禁止静默解析、禁止返回半成品**；
7. **对外不暴露思维过程**，只保留：结论、证据、结构化字段、必要的简短理由。

---

## 5. 模型职责对照表（模型 — 输入 — 输出 — 调用阶段 — 部署位置）

| 模型 | 输入 | 输出 | 调用阶段 | 部署位置 | 备注 |
|---|---|---|---|---|---|
| **Nemotron-3-Nano-Omni-30B-A3B-Reasoning** | 采样帧序列 / **≤120s** 视频片段（可选带音轨）+ 文本提示 | 文本：短描述 / 实体 / 结构化 JSON | **A 粗标注**（instruct）<br>**C zoom 精修**（thinking） | AI Cloud 自托管 vLLM | 链路中**唯一**能吃视频的模型；受 F1 约束 |
| `parakeet-tdt-0.6b-v3` | wav 16k 单声道 | `{start, end, text}[]`（词级时间戳） | **A 摄取**（一次性） | 自托管 | ASR；**不做说话人分离** |
| `Nemotron-3-Embed-1B` / `-8B`<br>或 `llama-nemotron-embed-1b-v2` | 文本块（粗标注描述 / ASR 片段） | 稠密向量 | **A 索引构建**<br>**C 检索** | 自托管 | 视觉与语音两通道文本统一编码 |
| `llama-nemotron-rerank-1b-v2` | (query, 候选文本) 对 | 相关性分数 | **C 检索后精排** | 自托管 | 混合召回后统一精排 |
| **Nemotron-3-Ultra / Super** | **纯文本**：查询、对话历史、候选段描述、转写片段、工具返回 | 文本：查询改写 / 工具调用 / 最终结构化 JSON | **C 全部编排** | Token Factory API | **不接触视频帧与音轨** |

### 5.1 数据流边界（赛事硬门槛 + 隐私）

```
视频文件 ──┐
           ├─▶ [自托管 GPU]  帧/音轨 → Omni / Parakeet / Embed / Rerank
           │                              │
           │                              ▼  文本（描述、转写、查询）
           │                        [Token Factory]  Ultra / Super 编排
           │                              │
           └──────────────────────────────▼──────▶ 结构化响应
```

- **原始视频帧与音轨不出自托管环境**；发往云端编排 API 的**只有文本**。
- 赛事两条硬门槛同时满足：运行时 = Nebius（AI Cloud + Token Factory）；模型 = NVIDIA 开源（Nemotron 3 / Parakeet）。
- 数据保留、访问控制、加密、日志脱敏与级联删除策略见 `profile.md`「数据生命周期与隐私」，当前标记为**待落实**。

### 5.2 备选与降级

| 情况 | 备选 |
|---|---|
| Omni 实跑不达预期（GO/NO-GO 未过） | **优先采用已验证的 Omni 降级配置**（换精度 / 减抽帧 / 缩短窗口 / 关闭 thinking）。<br>`Cosmos-Reason2-8B` **仅在 D1 前已取得 HF 授权且完成冒烟测试**时才作为 Plan B —— **未获批的模型不视为可用救援路径** |
| 需要 bbox 空间定位 | 引入 YOLO / Grounding-DINO（非 NVIDIA，但规则只需 ≥1 个 NVIDIA 模型，合规）；列为 V2 可选"精度模式" |
| Ultra 不可达 | 降级到 Super；再降级为规则式查询改写 + 单通道检索 |

### 5.3 关于「全 NVIDIA」的准确表述

**核心模型调用（感知、转写、向量化、重排、编排）均采用 NVIDIA 发布的模型。**
`ffmpeg`、`FAISS`、`SQLite`、`FastAPI`、`vLLM` 属于**基础设施 / 开源软件组件**，不是模型。
若启用可选 bbox 精度模式，则会引入非 NVIDIA 的检测模型 —— 此时该表述不再成立，需单独声明。
若"开源模型"在赛事规则中有正式定义，以**赛事原文**为准，不自行扩大含义。

---

## 6. 诚实的能力边界

| 需求 | 处理 | 原因 |
|---|---|---|
| **目标检测 / bbox** | v1 不做；V2 可选"精度模式"引入 YOLO / Grounding-DINO | F5：无 NVIDIA 开源检测权重；规则允许第三方，但会拖垮主线 |
| **跨视频人物属性聚合统计** | 降级为实验特性 | 误差累积 + 人物属性推断（隐私敏感）。v1 只支持"出现次数 / 时长"这类可验证计数 |
| **帧级精度** | **只承诺秒级** | 受控密集采样：1080p ≤1 FPS / 128 帧。事件**落在两次采样之间时边界存在误差**；`support_score` 不代表帧级精度 |
| **全视频一次性理解** | 不支持 | F1：120s 硬上限 |
| **说话人归属** | v1 不承诺 | Parakeet 是 ASR，不做 diarization |
| **实时流** | 不支持 | 离线文件上传 |

> 措辞约定：统一使用「**受控密集采样回看**」，不使用"高帧率""逐帧"等易造成过高预期的表述。

---

## 7. 部署与成本（Nebius）

- **Omni**：AI Cloud Serverless Endpoint 或 DevPod，vLLM。开发建议 **FP8 + 1×L40S 48GB**；BF16 + H100 80GB 做效果上限对比（均为 F2 厂商建议值，**待实测**）。
- **Ultra/Super**：Token Factory API，按 token（F7 待确认）。
- **Embed / rerank / Parakeet**：与 Omni 同机或更小 GPU。
- **向量库**：FAISS + SQLite 同机部署，保证「运行在 Nebius 上」这条硬门槛成立。
- **前端**：FastAPI + 聊天 UI（播放器时间轴标记，点击可 seek 到证据帧）。

### 7.1 成本估算框架（⚠️ 待实测）

先固化公式，不预先编造数字：

| 项 | 计算方式 | 实测值 |
|---|---|---|
| 粗标注 GPU 时间 | `实际窗口/attempt账本 × 实测各次 Omni GPU 耗时` | TBD |
| zoom GPU 时间 | `子窗口数 × 单次耗时` | TBD |
| 存储占用 | 证据帧 + 向量 + 索引 + ASR 转写 | TBD |
| 单次查询成本 | `GPU 时间 × 计费单价 + Token Factory token 成本` | TBD |

### 7.2 预算阈值与临时保护（★ 决策依据）

金额上限待 Nebius 配额与单价确认后填写；**在此之前以调用次数上限作为临时保护机制**：

| 项目 | 暂定上限 |
|---|---|
| 单小时视频最大 Omni 调用数 | 实际N须在已确认primary调用/金额封顶内；D1实测后确认数值，确认前primary cap30；额外重试初值0（E13） |
| **单次查询最大 zoom 子窗口数** | **3** |
| **全局zoom推理尝试预算** | **3，包含初始、扩窗及失败重试** |
| 单小时视频索引成本 | 待配额与单价确认 |
| 单次查询成本 | 待配额与单价确认 |

成本控制杠杆（按优先级）：粗标注抽帧数 → zoom 子窗口上限 → 候选 k → 缓存命中率 → 窗口长度。

---

## 8. 排期（10/03 → 10/30，27 天）

> 关键改动：在 D2–3 插入**垂直切片里程碑**，先拿到可展示的最小闭环，再横向扩展。

| 天 | 任务 | 出口 |
|---|---|---|
| **D1** | 环境、权限、**Omni 与 Cosmos 访问权限同步确认**、Token Factory 目录核对 | Nebius 可跑；明确 Cosmos 是否已授权 |
| **D2–3** | **垂直切片**：单窗闭环＋最小多窗摄取/真实候选召回/跨窗证据 → JSON → 播放器跳转（E03） | **四类8问 GO/NO-GO 闸门** |
| D4–6 | 单视频摄取与索引（镜头切分 / 窗口化 / 粗标注 / Embed / FAISS） | 1 个完整视频可索引 |
| D7–9 | 检索 + zoom 子窗口链路 | 单轮问答可跑通 |
| D10–12 | Agent 编排 + schema + 多轮上下文 | 多轮可跑通 |
| D13–16 | 前端：聊天 + 时间轴 + 证据帧回跳 | 可演示 |
| D17–20 | 开发集 + 指标测量 + ablation | 有数字 + 有对照结论 |
| D21–24 | 加固、Demo 视频（≤3min）、README、LICENSE、Nebius feedback | 提交物齐 |
| D25–27 | 缓冲与提交材料 | — |

**GO/NO-GO 判定顺序**：未过时**优先采用已验证的 Omni 降级配置**；Cosmos 仅在已授权且通过冒烟测试时才考虑切换。

---

## 9. 风险

| # | 风险 | 应对 |
|---|---|---|
| 1 | **GO/NO-GO 未过**（Omni 实跑不达预期） | 最大风险。D2–3 必须验证，不拖到 D10。降级路径见 §5.2 |
| 2 | **事实未核实项集中暴露**（vLLM 兼容性 F6、Token Factory 目录 F7、Nebius 配额 F8） | D1 一次性确认；任一不成立都会改变部署形态 |
| 3 | **Cosmos 未获授权** | 不得视为救援路径；Plan B 只能是 Omni 降级配置 |
| 4 | **时间竞争**（若另有提交冲突） | 仅交垂直切片属于未完成MVP；任何范围缩减须另经用户决定，当前计划仍保留C01全部范围 |
| 5 | **中文能力未实测**（F9） | 分别测中文查询、音轨、画面文字；若弱可依原降级演示英文，中文只披露实际测试和限制，不声明未证明的能力 |
| 6 | **成本失控** | §7.2 实际attempt预算 + E01总资源admission + E05按问题/版本缓存 |
| 7 | **性能承诺落空** | 索引耗时为 benchmark 目标（§2.3），非承诺 |
| 8 | **trace 契约漂移** | `visible` 只含通道与计数，内部工具名变更不破坏对外契约（§4.3） |
| 9 | **评审视角** | Stage One 是扣题筛查，README 顶部必须讲清「哪一步跑在 Nebius、用了哪个 NVIDIA 模型」，避免被判 superficial rebrand |

---

## 10. 待验证清单

- [ ] **F6** vLLM 能否启动 Omni（Mamba2-Transformer 混合 MoE）及最低版本
- [ ] **F7** Token Factory 目录中的 Ultra / Super 具体模型名与版本
- [ ] **F8** Nebius AI Cloud GPU 配额、镜像与价格（L40S / H100）
- [ ] **F9** Omni / Ultra 对中文白话的理解质量
- [ ] Omni 在 ≤120s 片段上能否稳定输出**可解析的结构化 JSON**（对应 §4.4 提取链）
- [ ] Cosmos-Reason2 的 HF 授权是否能在 D1 前取得
- [ ] 1 小时视频索引的真实吞吐（校准 §2.3 的 30 分钟目标）
- [ ] `support_score` 三个分量能否稳定计算，否则退化为 `support_level`

<!-- autoplan-accepted:ceo -->
- C01：保留profile.md所有MVP项（上传、镜头切分/分窗、ASR、粗标注/索引、自然语言检索、zoom、证据、JSON、unresolved、简单追问），先单窗口真实切片，再长视频；验收保留Recall@5≥80%、IoU@0.5问题占比≥70%、schema≥99%、单小时索引≤30min、查询P95≤15s、证据准确率≥90%的未实测目标。开发集至少10视频/30问答；独立冻结报告集目标30/100且如实披露规模；必做双通道、zoom、混合检索三项消融，不降目标。
- C02：ARCHITECTURE.md为技术契约；统一profile.md错误引用路径和no_result示例，所有四种status均保留schema_version、timebase、trace.visible/debug和errors。ok必须有有效结果且无unresolved；partial只用于有有效结果且存在未解决项；no_result仅用于检索/回看成功但没有证据命中；没有有效结果而处理失败为error。测试四状态、空响应、repair一次后失败、debug默认null及JSON Schema校验；未知项不得静默填默认值。
- C03：保持≤120s、5s重叠、1080p≤1FPS/128帧限制；全部时间为原视频绝对秒数。抽帧必须保留显式PTS和窗口偏移，ASR分块保留偏移/去重；测试无音轨、静音、VFR、窗口边界、尾段和跨窗事件，证据必须指向真实帧并落在视频/事件范围内。
- C04：query全局最多3次zoom视频推理尝试，包含扩窗与失败重试；repair使用文本路径一次并计入独立总请求账本，不额外看视频。预算在工具调度前统一检查，不由模型绕过；超长请求拆分需先检查预算，不能静默截断；budget耗尽保留已验证结果为partial，否则error，说明未检查范围，禁止宣称全视频不存在事件。
- C05：保留原粗标注30次保护，在启动前按实际窗口数估算；超过预算拒绝任务并显示所需窗口/调用数，U1预算修改保持待用户批准。至少测试3600秒连续素材计算32窗以及更多镜头场景，不漏尾段、不以半索引冒充完成。
- C06：D1记录Nebius账户可见模型ID、可用GPU/配额、推理镜像版本、峰值显存、请求耗时与费用，不把权重最低显存当共部署证明。vLLM以官方0.20.0说明起测；Omni/Cosmos替代仅按原授权条件启用，失败优先已验证Omni降级。D2–3真实片段输入得到可校验时间/证据与播放器跳转才可GO；fixture不算模型实测。
- C07：分别评测中文问题、中文语音和中文画面文字，官方仅支持英文的Omni以及不含中文的Parakeet不承诺中文效果。不支持音轨时显式语言警告并按原文允许降级，不把转写失败当无语音；主验收使用可验证的受支持语言样本，中文能力报告实际结果。规则式降级和英文演示须清楚标记，保留通用机制方向。
- C08：异步摄取以SQLite持久化queued/probing/transcribing/captioning/indexing/ready/failed/cancelled状态，重试同job_id+阶段去重；只有对应version的全部必需数据原子发布后可查询。删除先墓碑禁止读取，再清理视频/帧/向量/转写/会话/日志引用；worker提交前检查删除和generation，防止删除后复活。测试重复上传/重试、崩溃恢复以及删除与发布两种交错顺序。
- C09：实现既定隐私要求：所有上传/聊天/状态/视频/帧/删除端点按会话主体拥有权校验；临时与证据媒体默认24小时TTL可配置，查询日志仅request_id、阶段、耗时、错误码不含原文。私有存储/HTTPS/部署磁盘加密检查，帧和音轨只能流向自托管服务，云编排只接文本；媒体内容按不可信数据处理，不能指挥工具越权。有限上传字节/时长/像素/问题长度（D1预算确定值），无shell插值，禁止路径穿越与任意URL摄取。测试跨主体、失效会话、恶意文件和帧URI访问；企业合规不能在未验证供应商保留政策前声称完成。
- C10：三项支持度不可稳定计算时按原文使用support_level，不得杜撰小数；提供证据是否支撑具体声明的规则和标注，不将模型自评当正确率。跨窗合并只针对同一可验证事件，保留证据与原始时间并对冲突边界写unresolved；未知人物不能借代词推断身份。
- C11：UI须覆盖上传/索引/问答/证据的loading、empty、error、success、partial；显示具体阶段与可用重试，不编造剩余时间；支持原生播放器键盘操作、可复制时间引用（暂定Taste C1）、重置会话。新会话默认当前视频，只有同视频已验证结果可作指代锚点；指代不清要求澄清，换视频清状态；测试双提交、刷新/离开、迟到响应、还有别的吗以及无结果。
- C12：项目提供本地fixture模式（暂定Taste C2），真实/fixture醒目标记；开发命令、预检、schema fixture、受限模型接口、可重复评测、模型revision/配置清单和部署/回滚操作文档都需随MVP交付。所有假设与测试结果分别记录，真实benchmark不含fixture；上线Smoke包括视频上传到证据跳转及删除后不可取媒体。

- C13：补全源profile.md降级输入要求：入库先检测可解码性/时长/分辨率和视觉可用性；低清/遮挡导致视觉不可靠时使用可用ASR通道，不编造视觉描述。转写置信度有模型原始字段则保留，无字段则标记unknown，不伪造分数；证据支持跳转同视频原音频复核。按capabilities原子发布artifact manifest：usable_visual要求帧映射+caption+视觉文本索引，usable_audio要求可用转写+音频文本索引；至少一通道完整且对应全部段已处理才ready。audio_absent、audio_silent、audio_unsupported、audio_failed独立记录；仅在另一通道完整时允许已声明的降级ready，记录缺失覆盖和warning，查询无法满足该通道问题时error/partial而非no_result。测试低清音频兜底、噪声、无音轨、全通道失败、转写失败和原音频跳转。
- C14：支持字段互斥选择support_score或support_level；三项测量可靠才可输出score，否则只用level。low=证据只支撑事件部分可观察声明，未支撑项移入unresolved；medium=保留的事件声明均有直接证据但边界或上下文未独立复核；high=保留声明有直接证据且已由相邻窗口/独立复核确认边界。无直接证据不输出该事件。合并仅针对经同事件规则确认的结果：同类score取高、同类level按high>medium>low；混合类型不推算数值，以直接证据完整性、边界复核、再以稳定frame_id顺序选可比代表，保留证据并对边界冲突写unresolved。测试各level、无证据剔除、互斥字段、score/level混合和稳定去重。源正文相关budget/权威/中文/去重/范围条款的baseline替换按记录执行，不影响原始文件；批准后实现前同步根ARCHITECTURE.md与profile.md。
- C15：原始视频、音轨、临时帧、证据帧、caption/ASR、向量/索引、缓存、关联会话和按视频关联的日志均继承视频expires_at，默认24小时可配置。到期走C08同一墓碑+级联删除路径；媒体/查询每次检查expires_at，不等待清理worker才禁止访问；重启恢复清理，失败显式记录metadata并重试。测试全部派生存储TTL、到期与发布竞态、删除后缓存不可读；无主体/视频ID的汇总指标不属于可回链原文日志。
- C16：排期出口按依赖补齐：D1预检/项目schema/配置与预算拒绝；D2–3真实切片附证据和原音轨回跳、时间与schema验证、最小会话拥有权与私有媒体；D4–6持久任务/原子版本/TTL/删除竞态并入完整索引；D7–9混合召回/zoom总账/支持等级；D10–12指代与代际会话保护；D13–16五状态/可访问播放器/引用和重置；D17–20保留原评测集和三消融；D21–24部署加密检查/回滚/真实smoke/赛事材料，D25–27缓冲。U1未决时小时级目标明确blocked，短视频切片和不超30窗完整索引可继续；不以fixture或短视频结果替代小时目标。

- C17：加强原D2–3 GO闸门：至少4类真实诊断问题（短暂视觉动作、语音主导事件、跨窗事件、真实无命中），每类至少2问，答案/证据/时间人工标注并保存；候选必须至少召回每个正样本的标注窗口，负样本不得输出无据事件，所有返回时间/证据可播放核对。不是统计性能达标声明，也不能替代C01完整开发集；系统性粗标注漏召回即NO-GO并修订采样/索引，再用同一诊断集复核。若需要改既定范围/模型，留用户方向决定。
- C18：在原开发集上增加最小基线和用户任务验证：同一问题集比较ASR关键词检索、固定混合检索后一次zoom、完整Agent；前三项既定消融仍必做。记录查找成功、证据准确、耗时和成本，不把无法支持视觉任务的纯ASR用于相同能力宣称；至少视觉定位、发言检索、上一轮追问三个任务类记录人工拖进度条与系统查找/复核耗时。禁止伪造受访者或线上使用数据，文档附标注/计时方法；不以验证演示选择缩减通用MVP。
- C19：性能验证前置到D2–3记录真实阶段与总耗时，D7–9发布初步成本/延迟/显存报告并逐步跑开发集；D17–20仍作冻结最终测量。失败/超时单列完成率，不通过剔除困难问题满足P95；冷启动按原规定另报。无范围变更优化顺序为GPU串行调度/批处理、缓存、粗抽帧配置、有限候选/已验证Omni降级；所有优化重跑同集，对准确率回退或原目标不满足提交差距，不静默降低指标。
<!-- /autoplan-accepted:ceo -->

<!-- autoplan-accepted:design -->
- G01：界面为单视频操作工作区：持续显示产品名、当前视频、可用通道与到期；桌面视频60%/问答40%（Taste C3），回答先结论后按时间排序事件行，行含描述、时间范围、证据图或原话、支持等级；JSON/技术详情次级可查看复制，支持等级解释为证据支持程度而非正确率。上传空页为主操作，显示实际输入限制/格式/语言/保留期，未ready解释为何不能问；fixture入口与每条演示结果持续标记，切回真实建立独立会话。验证首屏操作、长名称/转写、真实与fixture切换和证据直接回跳。
- G02：上传字节进度与服务端处理阶段区分，轻量客户端限制检查后上传，文件到达后做ffprobe/镜头/窗口预检。预算拒绝显示所需N与当前30次限制并可重新选文件，不裁剪/改上限；queued/probing/transcribing/captioning/indexing显示真实阶段与已完成段数，不编ETA。取消停止后续调度、保留已计费尝试记录，不承诺云请求撤销；刷新恢复同一任务，阶段失败保留素材并可重试同job。测试上传中断、预检拒绝、取消、刷新/崩溃恢复、重试不重计已完成阶段和ready前不可问。
- G03：按C02四status呈现：ok结论与证据；partial先已验证结果，再未确认事项及未检查范围；no_result仅成功查找无支持证据，显示本次检查范围/通道并建议换具体动作或台词；error说明本次未完成和重试/request_id，不得得出无事件。就绪视频持续显示缺失/静音/不支持/失败音轨等能力警告，相关问题旁重复原因；异常不清空历史已验证结果。测试每种状态、budget耗尽、语言和音轨缺失，不把未查完作为全视频无命中。
- G04：时间范围点击定位事件起点；证据缩略图定位证据绝对时刻；分别突出事件区间与当前证据位置，原音轨可复核。定位维持原播放/暂停状态（Taste C5）；显示加载、seek失败和重载，成功播报时刻且焦点留在触发按钮。到期或删除的旧回答标为证据不可用、禁止旧URI回跳与相关追问，重新上传须重新索引验证，不能自动恢复旧证据。测试两种seek、缓冲失败、过期/删除、静音与用户播放状态。
- G05：歧义追问保留原问题，展示已验证事件/时间候选供选择，不自动确认人物身份；建议追问采用可验证事件表述。“还有别的吗”列新增事件与本次范围，无新增不宣称穷尽；每会话只一条在途查询，提交按钮忙碌且保留下一问草稿，重置/换视频递增generation，迟到结果不插入新会话。重置与删除按钮区分，删除先说明媒体与关联会话清理后确认。测试歧义、快速双提交、草稿、迟到结果、重置、换视频和删除说明。
- G06：≥1024px两区，768–1023px视频上/问答下，≤767px单列，移动端不固定大播放器挡输入；320px、长内容、200%缩放无页面横向溢出。原生video controls；全部操作button/link，44px触摸目标，可见焦点/可见表单标签，语义landmark，aria-live polite播状态变化，错误说明可读且不抢输入焦点，时间轴有等价时间文本按钮；不用颜色作为唯一状态。验证键盘全流程、屏幕阅读器、触屏、视口与缩放；实际渲染后再确认对比与视觉质量。
- G07：轻量本地CSS变量和主题（Taste C4）：background #f5f7fa、surface #fff、text #17212b、muted #53616f、accent #006d77、border #c7d2da；IBM Plex Sans Latin UI/Noto Sans SC中文，许可打包或稳定fallback避免外部字体网络依赖，正文16px、辅助标签≥14px且对比≥4.5:1，间距4/8/12/16/24/32，按钮6px圆角。主题化焦点、选择、光标、visited链接与tabular时间数字，少量定位/状态过渡从可见内容开始且reduced-motion禁用；不用装饰渐变/发光/卡片拼贴。最终批准后写DESIGN.md，检验实际计算对比；HTML草图暂定且未批准，不算图片或像素验收。
<!-- /autoplan-accepted:design -->

<!-- autoplan-accepted:dx -->
- X01：提供三步本地fixture快速开始：获取源码/读说明后make setup、make demo、打开输出URL提问与证据回跳；命令输出持续MODE=fixture，不依赖GPU/外部模型付费调用，缺ffmpeg仅阻止real。实际支持Python由D1验证并固定，缺前置条件显示版本/安装文档。完整计时包含源码获取、阅读、前置条件、安装和首次标记演示问答/seek；目标2–5分钟未测，缺Python/网络影响记录，不截为warm命令时间。real独立setup→配置→preflight→worker/app→真实smoke，账户/配额/镜像/权重加载时间全部计入，unknown不得宣称5min或用fixture代替；不自动real失败降级fixture。至少Mac/Linux各一次冷启动记录，作者自测明确标记，无产品遥测或自动上手release gate。
- X02：冻结既定公共接口：POST /api/session随机主体cookie+CSRF；POST /api/videos multipart Idempotency-Key返回202 video_id/job_id/generation（仅建任务），GET /api/jobs/{job_id}阶段/真实进度/capabilities/errors；POST /api/jobs/{id}/retry与/cancel合法状态才受理；POST /api/chat含video_id/session_id/generation/request_id/question返回同步最终响应；POST /api/chat-sessions/{id}/reset新generation；GET /media/{video_id}/…拥有权/Range/到期检查；DELETE /api/videos/{id}幂等墓碑+异步清理进度。Agent内部retrieve/read_segment/zoom/asr_search不作为公共用户接口；轮询2秒起、错误退避至10秒尊重Retry-After，有最大等待和明确停止。提供完整curl cookie jar与CSRF示例、类型/OpenAPI、重复请求/失效主体/ready前/跨主体/取消重试测试；不新增SDK或公开API产品范围。
- X03：errors对象冻结code/stage/message/cause/retryable/suggested_action/docs_url/request_id，未知cause显式unknown，problem+cause+fix+有效本地文档入口。覆盖预检/预算/语言通道/模型超时/repair失败/非ready/expired/deleted/限流；HTTP输入400/422、认证401/403、不存在404、未ready409、到期410、限流429、无有效证据的模型失败502/504；no_result和有有效证据partial为200。四status原C02保持，错误例与响应在首个0.1冻结版本同步，无内部路径/密钥/思维原文/用户原文日志。测试每类状态映射、retryable/错误目录链接、repair一次、超时预算计数，不能隐含自动重试云视频请求。
- X04：D1随包配置写README/快速开始，D2–3随切片写完整教程，D4–12随功能写API/配置/错误，D21–24完成部署/评测/材料校对。docs/getting-started.md、api.md、configuration.md、errors.md、evaluation.md、deployment.md与README目录形成可找到的参考；浏览器查找即可，不新建文档站。提供可校验四status、score/level互斥、通道降级、语言、任务生命周期fixture和原视频seek例子；命令/例子全部运行校验，未实现输出标proposed。CHANGELOG/CONTRIBUTING与错误报告指南随公开提交物，实际许可/归属/媒体权利发布前核查，不宣称已开源或成熟社区。
- X05：记录应用版本、schema0.1、SQLite迁移版本、index_generation、模型revision/采样配置hash；兼容索引才能读，不兼容显示重建要求。模型/config变化新generation构建并原子发布，迁移升级先停止新任务、事务迁移和备份必要状态，失败回滚；删除/到期禁读名单不能因回滚复活。首次冻结前补全schema并CHANGELOG，之后破坏契约须版本/迁移说明，当前无已发布客户端不新增codemod。测试索引版本不匹配、迁移失败回滚、到期与回滚交错，不能自动覆写索引或恢复已删除媒体。
- X06：本地CPU服务/fixture基础依赖与LinuxGPU推理额外依赖分开锁定，make test/eval-fixture不付费、eval-real须显式配置和preflight，Mac/Linux支持由D1验证，Windows未知不宣称。配置优先env>配置文件>默认、密钥仅env，preflight输出脱敏最终配置/来源/单位/合法范围；scene阈值0.3、coarse_frames12可8–16、candidate_k10/rerank_k5、TTL24h可配置为待实测默认。120s/1FPS/128帧和当前30粗标注/3zoom保护硬校验，U1不能普通config绕过。受限adapter类型+mock支持已授权模型替换，debug只授权开发模式，部署不默认公开debug；测试config优先/边界/无密钥fixture/硬限制拒绝/示例adapter与独立fixture-real评测。
<!-- /autoplan-accepted:dx -->

<!-- autoplan-accepted:eng -->
- E01：在原C09单输入限制外补全单机总资源admission；全局GPU推理并发初值1、摄取worker1、待摄取队列2、每会话在途查询1，全局query slot有限，无空slot则429/Retry-After不无限排队。D1冻结有效配置表的磁盘总量/每主体量、上传字节/时长/像素/问题长度、Agent步骤/全部模型请求数/输入输出token/墙钟期限及cleanup重试上限，real任何必需限额未设或非有限合法值则preflight拒绝。所有文本规划/改写/repair、zoom和重试在统一admission/账本计数，C04的3视频尝试和1文本repair不变；deadline/budget结束按有已验证结果partial、否则error并说明未查范围。测试10倍多主体/排队/磁盘/OOM/无限tool loop/token/timeout，不能靠新cookie绕过部署总量；限额默认是待D1实测的保护配置，不是性能达标。
- E02：所有付费模型调用持久记录attempt_id、kind、video/index_generation、chat_generation/request_id、预算、provider标识及reserved/dispatched/completed/unknown状态；调度前事务预扣预算，未知/连接丢失/崩溃保持已扣且禁止自动重发。只有实际验证供应商幂等语义才按原id复取，否则用户明确发起新尝试且有剩余已批准预算才dispatch；不承诺外部exactly-once。worker阶段CAS领取lease，过期lease不自动重复unknown调用；query按owner/session/chat_generation/request_id原子去重并比较payload hash，同载荷返回同请求状态/结果，不同载荷409。测试预算提交/dispatch/返回丢失/持久结果前后crash、双worker及重复query；恢复/取消/删除保留元数据账本而不能恢复已失效内容，账本按C15统一TTL。
- E03：补足C16/C17排期依赖：D2–3除单窗真实闭环，还必须有最小多窗口摄取、真实caption/ASR候选检索和跨窗合并，诊断4类每类至少2问以实际candidate列表核对标注窗，不能seed真值或fixture。D4–6仍完成持久化/完整双通道索引加固，D7–9仍完成混合召回/zoom预算与优化，C01全范围和指标不削减。诊断系统性漏召回即NO-GO，用同集调整采样/索引复核，scope/model改变另交用户。测试真实候选与跨窗证据、negative无幻觉、全部时间可回跳；最小链路不可冒充全量完成。
- E04：暂定Taste C6用POST /api/chat/prepare作为查询前控制协议，响应kind=ready或clarification_required，必要时返回已验证事件/时间候选及绑定owner/video/session/chat_generation的intent_id；清楚独立新问题可ready且不要求已有锚点。prepare不做视频zoom；若需要文本改写仍计入同intent统一模型账本，重复prepare幂等，无隐形预算重置。POST /api/chat接question/intent及可选服务器验证event anchor，执行后仍只使用C02四查询status；未解决歧义直接提交返回409 precondition控制错误并保留原问，未开始执行不能捏造partial/error/no_result查询结果。选择只接受同视频/同会话/同代际仍有效已验证事件，未知人物不能变身份；reset/switch/delete/expiry使旧intent失效。测试0/多候选、独立新问、伪anchor、旧intent、原问保留、prepare重复账本、reset后迟到结果；首个schema0.1冻结前补类型/文档。可行替代为单/chat端点独立控制envelope，最终门可覆盖暂定接口形式，四状态语义不变。
- E05：将原visited_segments拆成候选记录、成功review、按问题checked_ranges和returned_events，失败/unknown不能写成功review。结果缓存key至少包含video/index_generation、窗口范围/实际采样PTS、规范问题、prompt/model revision和采样/检索config hash；仅完全匹配且重新owner/expiry校验才复用，失败无成功缓存，大小/条数/TTL有限且删除级联失效。新问题不得因sid见过而跳过；还有别的吗只按已返回同事件去重，仍检查必要旧窗，说明范围且不称穷尽。测试同/不同问题、失败/unknown、revision/config变化、旧代际/跨主体/expiry/delete缓存以及跨窗同/不同事件。
- E06：在第一次真实诊断/benchmark前冻结标注、指标与版本：正负分类、绝对事件区间、相关窗口、可观察声明和支持帧/原话，人工复核/分歧记录。Recall@5按正问题相关标注窗口top5覆盖率先per-question再macro；IoU@0.5问题成功需一对一匹配覆盖全部ground-truth事件且每个IoU≥.5，positive漏项/失败/timeout记0，negative另报正确无命中和假阳性。证据准确率为所有返回可观察claims由对应证据直接支撑的比例，空返回分母0时N/A且另报positive任务完成/完整性，不能全error虚过。schema以固定总请求分母分别报raw/一次repair后；失败/timeout/拒绝与完成率独立，P95成功耗时含全部服务阶段且不剔困难问题、冷warm另报。保留C01真实集目标/全部原指标、C18三基线和三既定消融，fixture不计真实质量；测试多事件/重复匹配/边界/nohit/幻觉/失败/timeout/空分母及统一baseline输出。任何协议变化在看结果前版本化并同步契约。
- E07：代码组织为单包src/frameseek、一个FastAPI入口、一个SQLite持久worker，外部模型服务保持既定自托管/云文本边界，不引入Redis/Celery/微服务或通用插件。静态资源统一src/frameseek/static/index.html、app.js、styles.css，前阶段task中的web/及app/static/作为同一目标的别名归一。schema/config/auth/媒体时间/模型adapter分别单一责任；shared auth gate用于api及media/job/chat/tool授权，不让模型传sid越权。query request_id、attempt_id、job_id、index_generation和chat_generation明确区分；测试各caller跨主体/expiry/gen拒绝及cookie CSRF/Origin，真实cookie Secure/HttpOnly/SameSite，fixture只localhost。SQLite短事务/WAL/busy timeout/有限重试，模型网络调用不占写事务；测试竞争写入无静默丢失。
- E08：baseline仅修正源示例与已有约束：entity_memory保存已验证事件/物体的锚点和可观察属性，不推断未知人物身份；visited_segments文字按E05拆分；followups改为该动作后发生什么/还有相似动作；无ASR只按可用视觉证据计算而不能认定静音天然低分。保持C14 score/level定义互斥与不伪精确，C/G/X已接受块完整原文保留。测试例子schema有效、身份不猜、静音视觉直接证据与score/level条件，批准后实现前同步根ARCHITECTURE.md/profile.md。
- E09：成本按实际window count/attempt ledger及真实GPU耗时和token计算，包含5s overlap、镜头、失败/unknown和重试；N实际预检，不以duration/120取整估计。原30 primary coarse-window保护和U1未决原方向保持；另有限coarse重试额度D1预算表冻结、初值0，失败显示failed且无自动付费重试，用户明确重试也须已有批准的剩余额度。未知价格/权限/耗时标unknown，不能填预设成本；测试3600s=32及scene更多、失败/unknown ledger和预算拒绝无dispatch。
- E10：流式逐窗解码/采样，不把全视频decoded帧置内存，单次Omni≤128帧且缩放≤1080p，音频块保留offset、临时artifact继承TTL；GPU先串行、共部署必须测峰值显存，只有已验证降级配置可启用。检索批量取top-k段/证据metadata，FAISS/BM25按generation读取不每问重建，缓存大小/TTL有限且key按E05。D2–3记录阶段总耗时，D7–9初报cost/VRAM，D17–20原集原目标；query P95从受理到最终含所有服务阶段，timeout/reject/失败完成率独立，播放器延迟另报。不用timeout替代15s目标，不把短片替代blocked小时目标；测试采样RSS/VRAM、批量等价、cold/warm、超额可诊断及原质量不回退。
- E11：完整测试计划24路径簇逐项覆盖setup/config、模式、real preflight、owner/CSRF、upload/query幂等、媒体/总资源、窗口/PTS、通道、worker/lease、attempt crash、manifest竞态、索引版本、澄清、混合候选、zoom/tool预算、cache、证据/support、schema四status/repair、HTTP错误、UI迟到/草稿、真实seek/音频、所有TTL/rollback、响应式/可访问性、metric/baseline/消融。当前全部未实现，不声称测试通过；新项目pytest为默认Python测试实现，D1验证兼容并锁定；make test/eval-fixture免费，real显式配置预算。人工browser清单含320/768/1024/200%、键盘/读屏/触屏/44px/contrast≥4.5/reduced motion；真实播放器currentTime/play/paused/expired必须核对。诊断4类8问、开发10/30及独立报告30/100目标、中文三类、prompt injection/noise/cross-window/negative、三基线三消融和性能费用套件全部保留；prompt/model/config变更重跑固定相关集，D17–20完整冻结。
- E12：升级/回滚与清理遵循C08/C15/X05：新索引manifest完整且generation CAS才发布，旧worker、删除或expiry不得发布；所有媒体及派生物/关联会话/日志/缓存和含该素材备份统一到期清理，读取先检查expires/tombstone即使worker未清理也禁止。删除/到期禁读记录不能因恢复旧备份或迁移回滚消失，backup恢复须先重放当前有效删除/expiry边界；清理失败有元数据状态和有限重试、重启恢复，不把已禁读误称文件已清干净。测试publish/delete及expiry双交错顺序、缺artifact不得ready、全部派生TTL、清理失败/重启和迁移失败回滚不复活。实施先冻结core接口；UI/static和eval可在接口后分离并行，shared core/api/schema/docs改动顺序合并，当前nongit不创建worktree、不标实现完成。
- E13：用户D49明确选择A（2026-10-04 Asia/Tokyo），U1预算政策方向已解决：以实际完整窗口数N和已批准的有限primary粗标注调用/金额预算决定摄取准入，替代历史C05/C16/G02/X06/E09中“30为永久上限/U1方向待决定”的当前政策；其余各条原文和行为仍保留。N来自ffprobe/scene/≤120s窗口/5s重叠/尾段完整生成，3600s连续至少32、scene可能更多。D1实测模型单价/计费方式、耗时/显存/配额并冻结具体call和money上限，数值需明确确认；未确认前effective primary cap仍30，必需成本/资源值未知或不足则拒绝真实摄取推理，不能将本次政策选择当价格/无限调用授权。超过有效调用或保守费用预算显示actual N、当前cap及可执行说明，不裁尾、不半索引ready、不以short/fixture替代hour验收。已确认budget配置须有版本/确认记录，服务端按该版本检查，客户端不能提交较大cap；普通配置不能跳过确认门。额外coarse重试独立有限预算、初值0，失败/unknown仍计账且不自动重复；query zoom全局3（含扩窗/retry）和一次文本repair、统一总资源限额保持。32只是连续小时必要值，预算允许才可运行scene更多的小时视频。测试N=30/31/32及scene更多、未确认/未知价格/足额/不足额、调用及金额任一超额、伪造请求cap拒绝、原30过渡、失败/unknown/重试计数和所有完整ready条件；D1只允许在另外确认的有限校准预算内测量，零测量权限不自动付费。此条仅批准计划预算方向，完整计划/实施/部署仍待最终门。
- E14：ffprobe/scene/ffmpeg解码属于不可信媒体预检，每个子进程在可信元数据之前就受有限墙钟、CPU/RSS、stdout/stderr字节、临时磁盘及有限并发保护；使用argv不用shell、最小权限和仅任务目录文件访问，禁止网络协议与媒体外部引用，不能只靠protocol whitelist代替文件隔离。Mac/Linux各验证可用隔离与进程组kill/清理，缺必需隔离或限额则real预检拒绝，fixture不宣称保护已生效。超限/畸形文件给明确code/stage/request_id，不进入模型调用；子进程及子孙可终止，临时产物按TTL和失败清理。测试畸形/截断/伪元数据/挂起/无限输出/外部网络或文件引用/10倍并发/取消，断言资源边界、无外泄及零推理dispatch。
- E15：D1根据实际确认的部署计费方式冻结有限预算及价格版本，费用包括GPU资源分配、启动/加载/空闲、失败启动、保留实例、计费最小单位/舍入、存储和全部ASR/Embed/rerank/文本/视频尝试；按资源时长收费不能只算推理耗时，按请求收费也不能重复算同一资源费。每个资源allocation_id持久记录起止、批准预算/截止时间和未知释放状态；启动前预留保守最长占用成本和停止/释放余量。最大运行期限与供应商侧停止/释放机制必须在有确认预算的校准中验证；仅应用finally或HTTP超时不足以保证停费，不能验证有限费用上界则拒绝该real部署形态。崩溃后恢复对账/释放，停止失败保留unknown预算不再dispatch，向操作者明确资源仍可能收费；金额封顶是已验证执行准入边界，不冒充供应商绝对账单保证。测启动失败、零请求空闲、实例保留、应用崩溃/停机、重复释放、释放失败与最终账单归集，校准也计这些费用，价格或权限未知不付费。
- E16：GPU并发1按单个有界attempt调度，不让整个摄取job占GPU；现有worker/SQLite管理有限等待队列。暂定Taste C7：查询与摄取均有待运行且符合准入时按1:1交替，每类按入队次序；一类空则服务另一类，非抢占正在运行attempt。每次dispatch重新检查owner/expiry/generation、预算、剩余deadline和经校准的保守attempt时长/结束余量，无法在期限内开始则按C02已据partial否则error，不启动必然超期调用。全局query slot满仍429，不扩大队列；取消/reset/到期等待者剔除并安全释放仅未dispatch预留。公平等待界依有限队列和有界attempt，不能承诺15s；记录查询与摄取排队/执行及P95/吞吐，真实共负载回归两类无饥饿、持续多主体、取消/到期、截止前无法开始。可行替代2:1偏查询有限权重，牺牲摄取吞吐换查询等待；最终门可覆盖权重，但有界公平规则不得省略。
- E17：首个schema0.1冻结前补全POST /api/chat同request_id的恢复控制协议，query执行状态与attempt状态独立持久。新受理请求仍等待同步最终四status；同owner/session/chat_generation/request_id/payload恢复，执行中返回HTTP202独立kind=query_control,state=pending、request_id、Retry-After及恢复动作，unknown返回HTTP409同kind,state=unknown和不自动重发说明；这两个控制envelope不含查询status、不计作模型回答，不增加第五状态。最终完成返回同一200回答或原最终错误及相同有效结果，查询worker持有有期限lease负责结束；断线不创建新付费任务。重启后只恢复确定未dispatch步骤/复用已持久结果；任一已dispatch结果未知则控制unknown，除实际验证供应商幂等复取或同request明确不确定终态处理外不得再次dispatch。用户明确新尝试必须新request_id、剩余已批准预算、同会话先结束旧request为有证据partial否则error；同payload重发不是重试授权。控制轮询按X02有限退避/最大等待，unknown停止自动轮询并显示说明/保留草稿；reset/switch/delete/expiry先拒绝旧代际恢复，跨主体不得泄露结果。测双重复POST、payload不同409、断线/响应丢失、持久完成前后crash、unknown无重发、恢复deadline、旧gen及有/无有效证据终态，类型/文档/错误目录/UI一起验证。
- E18：预算按owner及部署总额度双重准入，以服务端已批准budget_version固定job manifest和每次attempt。用SQLite短事务原子reserve调用次数和保守金额/资源占用，模型网络不在写事务内；多job/query/校准并发共享总额度，匿名新cookie不能绕过，普通env/file或请求不能制造批准记录。金额以明确币种/单位的整数最小预算单位和保守向上舍入计算，拒绝NaN/负数/无穷/混币种/未知单价或计费量上界；批准表覆盖所有模型阶段而非仅coarse。一次allocation资源费只记一次，attempt费用按实际计费形态归集，unknown持续占预留，不靠缺结果释放预算。每次dispatch同时核对冻结版本与仍有效批准，额度降低/撤销立即停止未来调用，提升必须新批准记录；旧job不得因配置热改得到新额度。已dispatch不能假称取消费用，上界无法保证则不启真实部署。测试两个并发请求争最后额度只一个dispatch、任一call/money不足零dispatch、不同主体总额度、批准伪造/版本变化/撤销/降额、所有模型及GPU费无漏重算、unknown不释放、舍入与非法金额、校准独立预算，以及N30/31/32/scene更多完整索引。E13是当前U1政策唯一覆盖条款，E14–18具体化其保护，其他C/G/X/E原文义务完整保留。
<!-- /autoplan-accepted:eng -->
## Review record

### Intake 与方法读取记录
- SOURCE_PLAN: ARCHITECTURE.md；ACTIVE_PLAN: docs/IMPLEMENTATION_PLAN.md；产品背景: profile.md。原始文件均保持不变；架构与产品文档在 docs/autoplan/inputs 留存。
- 基准分支 main（技能回退值）；当前非 Git 仓库，无 origin、历史、stash、diff、CLAUDE.md、AGENTS.md 或旧 TODOS.md。不能把缺少历史解释为已验证代码质量。
- 已有设计输入: ARCHITECTURE.md（问题、约束、替代方案和排期）及 profile.md（用户问题、MVP、验收）。不因文件名不同重复启动 office-hours。
- UI_REQUIRED=true：播放器、聊天 UI、时间轴交互与状态均在源文档；DX_REQUIRED=true：init scope 哈希 6f854ee1b1c4aa7e4da6a5719302575198263f92ba9bcfea3bffbdfb4cd961ea，API×5、endpoint×3、agent×5、action×1、debug×2，共16次。
- CEO 方法文件已逐段读取至 EOF：1–600、601–1200、1201–1800、1801–2400、2401–2495；255–305 缺失显示段再次补读。工具为 shell 文件读取，本宿主没有原生 Read 工具。
- 模式 SELECTIVE EXPANSION，由 autoplan CEO override 授权；implementation-ready 深度。全部文件为计划中的新增文件，无可复用应用代码；预计 MVP 约20–30文件，不能套用少量文件的改动成本承诺。
- 参考好的模式: ARCHITECTURE.md 窗口约束、输出提取链、事实/假设分离。避免: profile.md no_result 的旧 trace 形态，凭模型名猜测语言能力，以及把原始内容写入日志。
- Exa 未配置（Unknown MCP server 'exa'）；Aside 未安装。已转为内置网页搜索并引用一手资料。未启用跨项目学习；本项目无旧评审/决策。
- 外部 Codex CLI preflight=under_codex，面向 Claude 的安装不得嵌套启动自身；outside_status=unavailable，修复方式 setup --host codex。本会话 native agent 可用，模型身份不据脚本名字声称为 Claude。

### CEO Step 0A：前提挑战
真实问题是使用者无法快速复核长视频里具体发生的事。成功不是生成摘要，而是用户在一次检索和一次点击后看到支撑事件的画面/台词。什么都不做意味着仍需要拖时间轴，检索结果也不能被复核。
P1「视频语义检索本身稀缺」不成立：TwelveLabs 官方已提供自然语言检索与起止秒数。FrameSeek 的差异应由自托管感知、受限候选回看、公开不确定性和可复现消融证明，不能宣称首创视频搜索。
P2「中文仅需实测一下」有重大语言缺口：Omni 模型卡仅声明 English only，Parakeet v3 的25种语言不含中文。用户原来的通用方向保留；中文提问、中文音轨、中文画面文字分别测试，失败明确 unsupported_language，不能用翻译问题掩盖音轨不支持。
P3「30次足以索引一小时」与120s/5s冲突：连续最大窗口步长115s，需要32窗；按镜头边界还可能更多。原30次保护继续成立，预估超额不得悄悄启动/漏掉尾部；预算调整为未批准提案 U1。
P4「所有模型同一L40S即可同时部署」未证明：权重最低显存不包括KV cache和其他模型。D1记录实际配置与峰值显存，必要时串行调度；用户预算和云配额仍未知。
P5「15秒查询目标」尚无实测且thinking最多20k tokens可能主导耗时。保留原验收目标，先测阶段耗时，不把超时伪装为无结果或调整指标过关。

### CEO Step 0B：现有能力与复用
| 子问题 | 已有 | 复用/新增 |
|---|---|---|
| 产品范围、schema示例、架构 | 两份源文档 | 保留为输入，生成实施与验收规格 |
| 视频解析/转码/抽帧 | 本机ffmpeg 8.1、ffprobe | Python subprocess 参数数组调用，不重写解码器 |
| 数据库/HTTP/schema/检索 | 源计划指定SQLite、FastAPI、FAISS、BM25 | 复用标准库/依赖；没有现有应用实现可复用 |
| GPU推理 | 只有部署设想 | Linux Nebius 实跑，不把本机Mac当CUDA主机 |
| 交互播放器 | 浏览器原生video | 原生seek和控件，避免自造播放器 |

### CEO Step 0C/D：理想状态与替代方案
```text
现在：两份文档，无可运行系统
  -> 本计划：单视频上传、检索、回看、证据、简单追问与冻结评测
  -> 12个月：多视频索引、经过校准的支持度、身份/语言能力可选扩展
```
A保留检索驱动粗扫+zoom：符合用户既定方向，复用源模型职责，维护清晰，推荐。B纯ASR检索：能简化但无法视觉事件定位，缺少MVP既定能力，拒绝作为完整替代，仅容许声明降级。C全视频密集分析：模型时长、成本和隐私约束不变，且没有证据证明更合适，拒绝。三种方案覆盖度 A=10/10（计划完整但实跑未证）、B=5/10、C=7/10（成本不可行）。A由用户源架构与autoplan原则4/5授权，未新改模型或产品方向。

### CEO Step 0F/G：范围与相邻体验
复杂度检查：不用微服务/Redis/Kubernetes；一个FastAPI应用、SQLite状态与一个独立摄取worker，GPU服务作为外部受限接口。首次真实切片把schema、绝对时间和证据URI做成一条链，后续扩展索引复用同一输出。范围仍含全体MVP能力和前三项消融；垂直切片只是顺序，不是范围缩减。
10x价值来自将“答案”变成可以逐条点击的证据，而不是增加对话功能数量。平台潜力是以后同一结果契约服务多视频和API，但这次不实现该扩展。
| Proposal ID | 机会 | Effort / risk | 处置与依据 |
|---|---|---|---|
| S1 | 索引分阶段进度与可恢复重试 | human S / CC S，低 | 接受；源文档已要求异步进度，补齐失败路径 |
| S2 | 一键回到当前证据时间点 | human S / CC S，低 | 接受；原播放器跳转的完整体验 |
| S3 | 结果明确区分没找到、没查完、不能判断 | human S / CC S，低 | 接受；原status/unresolved的必需呈现 |
| S4 | 证据可复制为时间区间与原话 | human S / CC S，低 | 暂定接受，Taste C1；新界面小扩展，不建立外部分享服务 |
| S5 | 重新开始对话与保持当前视频 | human S / CC S，低 | 接受；源文档已要求可重置上下文 |
| S6 | 开发演示fixture模式 | human M / CC S，低 | 接受，Taste C2；本机无CUDA时验证UI/契约，明确标记不能算真实模型验收 |
| S7 | 跨视频/身份关联/说话人分离/bbox/API | human XL / CC L，高 | 原文已延后，记录TODOS，未改变范围 |

### 官方证据（2026-10-03读取；推论明确标注）
- [Omni官方模型卡](https://huggingface.co/nvidia/Nemotron-3-Nano-Omni-30B-A3B-Reasoning-BF16)：视频输入2分钟、采样限制与原架构相符；语言声明 English only；部署说明要求vLLM 0.20.0。文档支持≠本项目实跑成功。
- [Parakeet官方模型卡](https://huggingface.co/nvidia/parakeet-tdt-0.6b-v3)：支持25种欧洲语言，不含中文，词/段时间戳；本项目需分块推理和偏移校验。
- [Nebius官方模型目录说明](https://nebius.com/services/token-factory/models/nvidia-nemotron-models-inference)：Super/Ultra公开服务，Omni dedicated-only；不据此认定用户账户有该模型/配额，D1读取账户目录确定ID。
- [TwelveLabs搜索文档](https://docs.twelvelabs.io/docs/guides/search)：已可按自然语言返回start/end，首创性应落在证据与评测机制而非检索本身。
- [赛事官方规则](https://nebiusglobalaihackathon.devpost.com/rules)：截止2026-10-30 10:00 PDT，即日本2026-10-31 02:00；项目内部仍以10/30完成为缓冲。提交物需可运行演示、公有源码及许可、README、少于3分钟的视频、工具反馈。赛道暂推荐Apps and Agents，提交时由用户确定。
三层综合：Layer1使用分窗+检索+缓存等成熟做法；Layer2竞争者已有时间片段搜索，不应夸大新颖性；Layer3稀疏描述可能漏掉短事件，zoom无法找回根本没召回的窗口，因此测视觉短事件子集，并保留ASR通道，不能只测演示问题。

### Pending User Direction：U1 调用预算
当前原文30次粗标注上限保持。提议改为预估N(duration,scene_boundaries)后使用可配置预算，1小时连续窗口至少32次，并在开始前显示预算。理由是保证尾部覆盖；盲点是用户真实云预算未知，错误增加费用。未批准前预算不足返回BUDGET_EXCEEDED，不部分索引后声称可查询完整视频；受影响路径不得通过GO闸门。此处是同宿主评审提案，不宣称两个不同模型一致。

<!-- autoplan-accepted:ceo -->
- C01：保留profile.md所有MVP项（上传、镜头切分/分窗、ASR、粗标注/索引、自然语言检索、zoom、证据、JSON、unresolved、简单追问），先单窗口真实切片，再长视频；验收保留Recall@5≥80%、IoU@0.5问题占比≥70%、schema≥99%、单小时索引≤30min、查询P95≤15s、证据准确率≥90%的未实测目标。开发集至少10视频/30问答；独立冻结报告集目标30/100且如实披露规模；必做双通道、zoom、混合检索三项消融，不降目标。
- C02：ARCHITECTURE.md为技术契约；统一profile.md错误引用路径和no_result示例，所有四种status均保留schema_version、timebase、trace.visible/debug和errors。ok必须有有效结果且无unresolved；partial只用于有有效结果且存在未解决项；no_result仅用于检索/回看成功但没有证据命中；没有有效结果而处理失败为error。测试四状态、空响应、repair一次后失败、debug默认null及JSON Schema校验；未知项不得静默填默认值。
- C03：保持≤120s、5s重叠、1080p≤1FPS/128帧限制；全部时间为原视频绝对秒数。抽帧必须保留显式PTS和窗口偏移，ASR分块保留偏移/去重；测试无音轨、静音、VFR、窗口边界、尾段和跨窗事件，证据必须指向真实帧并落在视频/事件范围内。
- C04：query全局最多3次zoom视频推理尝试，包含扩窗与失败重试；repair使用文本路径一次并计入独立总请求账本，不额外看视频。预算在工具调度前统一检查，不由模型绕过；超长请求拆分需先检查预算，不能静默截断；budget耗尽保留已验证结果为partial，否则error，说明未检查范围，禁止宣称全视频不存在事件。
- C05：保留原粗标注30次保护，在启动前按实际窗口数估算；超过预算拒绝任务并显示所需窗口/调用数，U1预算修改保持待用户批准。至少测试3600秒连续素材计算32窗以及更多镜头场景，不漏尾段、不以半索引冒充完成。
- C06：D1记录Nebius账户可见模型ID、可用GPU/配额、推理镜像版本、峰值显存、请求耗时与费用，不把权重最低显存当共部署证明。vLLM以官方0.20.0说明起测；Omni/Cosmos替代仅按原授权条件启用，失败优先已验证Omni降级。D2–3真实片段输入得到可校验时间/证据与播放器跳转才可GO；fixture不算模型实测。
- C07：分别评测中文问题、中文语音和中文画面文字，官方仅支持英文的Omni以及不含中文的Parakeet不承诺中文效果。不支持音轨时显式语言警告并按原文允许降级，不把转写失败当无语音；主验收使用可验证的受支持语言样本，中文能力报告实际结果。规则式降级和英文演示须清楚标记，保留通用机制方向。
- C08：异步摄取以SQLite持久化queued/probing/transcribing/captioning/indexing/ready/failed/cancelled状态，重试同job_id+阶段去重；只有对应version的全部必需数据原子发布后可查询。删除先墓碑禁止读取，再清理视频/帧/向量/转写/会话/日志引用；worker提交前检查删除和generation，防止删除后复活。测试重复上传/重试、崩溃恢复以及删除与发布两种交错顺序。
- C09：实现既定隐私要求：所有上传/聊天/状态/视频/帧/删除端点按会话主体拥有权校验；临时与证据媒体默认24小时TTL可配置，查询日志仅request_id、阶段、耗时、错误码不含原文。私有存储/HTTPS/部署磁盘加密检查，帧和音轨只能流向自托管服务，云编排只接文本；媒体内容按不可信数据处理，不能指挥工具越权。有限上传字节/时长/像素/问题长度（D1预算确定值），无shell插值，禁止路径穿越与任意URL摄取。测试跨主体、失效会话、恶意文件和帧URI访问；企业合规不能在未验证供应商保留政策前声称完成。
- C10：三项支持度不可稳定计算时按原文使用support_level，不得杜撰小数；提供证据是否支撑具体声明的规则和标注，不将模型自评当正确率。跨窗合并只针对同一可验证事件，保留证据与原始时间并对冲突边界写unresolved；未知人物不能借代词推断身份。
- C11：UI须覆盖上传/索引/问答/证据的loading、empty、error、success、partial；显示具体阶段与可用重试，不编造剩余时间；支持原生播放器键盘操作、可复制时间引用（暂定Taste C1）、重置会话。新会话默认当前视频，只有同视频已验证结果可作指代锚点；指代不清要求澄清，换视频清状态；测试双提交、刷新/离开、迟到响应、还有别的吗以及无结果。
- C12：项目提供本地fixture模式（暂定Taste C2），真实/fixture醒目标记；开发命令、预检、schema fixture、受限模型接口、可重复评测、模型revision/配置清单和部署/回滚操作文档都需随MVP交付。所有假设与测试结果分别记录，真实benchmark不含fixture；上线Smoke包括视频上传到证据跳转及删除后不可取媒体。

- C13：补全源profile.md降级输入要求：入库先检测可解码性/时长/分辨率和视觉可用性；低清/遮挡导致视觉不可靠时使用可用ASR通道，不编造视觉描述。转写置信度有模型原始字段则保留，无字段则标记unknown，不伪造分数；证据支持跳转同视频原音频复核。按capabilities原子发布artifact manifest：usable_visual要求帧映射+caption+视觉文本索引，usable_audio要求可用转写+音频文本索引；至少一通道完整且对应全部段已处理才ready。audio_absent、audio_silent、audio_unsupported、audio_failed独立记录；仅在另一通道完整时允许已声明的降级ready，记录缺失覆盖和warning，查询无法满足该通道问题时error/partial而非no_result。测试低清音频兜底、噪声、无音轨、全通道失败、转写失败和原音频跳转。
- C14：支持字段互斥选择support_score或support_level；三项测量可靠才可输出score，否则只用level。low=证据只支撑事件部分可观察声明，未支撑项移入unresolved；medium=保留的事件声明均有直接证据但边界或上下文未独立复核；high=保留声明有直接证据且已由相邻窗口/独立复核确认边界。无直接证据不输出该事件。合并仅针对经同事件规则确认的结果：同类score取高、同类level按high>medium>low；混合类型不推算数值，以直接证据完整性、边界复核、再以稳定frame_id顺序选可比代表，保留证据并对边界冲突写unresolved。测试各level、无证据剔除、互斥字段、score/level混合和稳定去重。源正文相关budget/权威/中文/去重/范围条款的baseline替换按记录执行，不影响原始文件；批准后实现前同步根ARCHITECTURE.md与profile.md。
- C15：原始视频、音轨、临时帧、证据帧、caption/ASR、向量/索引、缓存、关联会话和按视频关联的日志均继承视频expires_at，默认24小时可配置。到期走C08同一墓碑+级联删除路径；媒体/查询每次检查expires_at，不等待清理worker才禁止访问；重启恢复清理，失败显式记录metadata并重试。测试全部派生存储TTL、到期与发布竞态、删除后缓存不可读；无主体/视频ID的汇总指标不属于可回链原文日志。
- C16：排期出口按依赖补齐：D1预检/项目schema/配置与预算拒绝；D2–3真实切片附证据和原音轨回跳、时间与schema验证、最小会话拥有权与私有媒体；D4–6持久任务/原子版本/TTL/删除竞态并入完整索引；D7–9混合召回/zoom总账/支持等级；D10–12指代与代际会话保护；D13–16五状态/可访问播放器/引用和重置；D17–20保留原评测集和三消融；D21–24部署加密检查/回滚/真实smoke/赛事材料，D25–27缓冲。U1未决时小时级目标明确blocked，短视频切片和不超30窗完整索引可继续；不以fixture或短视频结果替代小时目标。

- C17：加强原D2–3 GO闸门：至少4类真实诊断问题（短暂视觉动作、语音主导事件、跨窗事件、真实无命中），每类至少2问，答案/证据/时间人工标注并保存；候选必须至少召回每个正样本的标注窗口，负样本不得输出无据事件，所有返回时间/证据可播放核对。不是统计性能达标声明，也不能替代C01完整开发集；系统性粗标注漏召回即NO-GO并修订采样/索引，再用同一诊断集复核。若需要改既定范围/模型，留用户方向决定。
- C18：在原开发集上增加最小基线和用户任务验证：同一问题集比较ASR关键词检索、固定混合检索后一次zoom、完整Agent；前三项既定消融仍必做。记录查找成功、证据准确、耗时和成本，不把无法支持视觉任务的纯ASR用于相同能力宣称；至少视觉定位、发言检索、上一轮追问三个任务类记录人工拖进度条与系统查找/复核耗时。禁止伪造受访者或线上使用数据，文档附标注/计时方法；不以验证演示选择缩减通用MVP。
- C19：性能验证前置到D2–3记录真实阶段与总耗时，D7–9发布初步成本/延迟/显存报告并逐步跑开发集；D17–20仍作冻结最终测量。失败/超时单列完成率，不通过剔除困难问题满足P95；冷启动按原规定另报。无范围变更优化顺序为GPU串行调度/批处理、缓存、粗抽帧配置、有限候选/已验证Omni降级；所有优化重跑同集，对准确率回退或原目标不满足提交差距，不静默降低指标。
<!-- /autoplan-accepted:ceo -->

<!-- AUTONOMOUS DECISION LOG -->
### Decision Audit Trail
| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|---|---|---|---|---|---|
| D01 | ceo | 保留完整MVP与先切片顺序 C01 | Mechanical | P1/P6 | 用户既定方向，切片不等于砍scope | 纯ASR替代 |
| D02 | ceo | 四状态完整输出契约 C02 | Mechanical | P1/P5 | 同一接口处理成功/空/失败 | 旧no_result trace |
| D03 | ceo | 绝对时间与采样元数据 C03 | Mechanical | P1 | 秒级定位依赖正确映射 | 帧序号当秒数 |
| D04 | ceo | 全局zoom尝试预算 C04 | Mechanical | P1/P5 | 防止分窗/重试乘法放大 | 每工具单独限3 |
| D05 | ceo | 粗标注预估与U1保留 C05 | User Challenge | 用户原约束 | 30次保护不能自动提高 | 漏尾部/自动加预算 |
| D06 | ceo | 实跑闸门 C06 | Mechanical | P1/P3 | 文档支持与本账户能力分离 | 默认云可用 |
| D07 | ceo | 分离三种中文能力 C07 | Mechanical | P1 | 官方语言范围有证据 | 翻译问题冒充中文ASR |
| D08 | ceo | 持久状态与删除竞态 C08 | Mechanical | P1/P5 | 原异步与级联删除要可证明 | 内存后台任务 |
| D09 | ceo | 最小隐私闭环 C09 | Mechanical | P1 | 落实原隐私承诺 | 日志存原文 |
| D10 | ceo | 支持等级与保守合并 C10 | Mechanical | P1/P5 | 源文档已允许降级 | 伪精确得分 |
| D11 | ceo | 可复制本地时间引用 C11 | Taste | P2/P5 | 一处引用按钮小扩展 | 独立分享服务 |
| D12 | ceo | fixture模式 C12 | Taste | P3/P5 | Mac可验证契约，GPU实跑仍必需 | 全部开发依赖GPU |

### 六栏决策台账
| ID/owner | 契约与证据 | 当前 | 提议 | 状态 | 授权与范围 |
|---|---|---|---|---|---|
| C01–C03/CEO | profile MVP+架构契约 | 原全部范围/硬限制 | 补实现和测试 | 自动接受 | 用户开始autoplan + P1/P5，不改变原方向 |
| C04/CEO | zoom与重试各3缺全局账本 | 局部上限 | 全局3次视频推理 | 自动接受 | P1/P5，保持最大窗口数与重试上限 |
| U1/用户 | 源30次 vs 分窗32 | 保留30次 | 可配置预估预算 | 待最终用户决定 | 禁止默认增加费用 |
| C06–C10/CEO | 官方/源隐私/降级 | 原约束 | 明确验证与失败路径 | 自动接受 | P1/P3/P5，未换模型 |
| C11/CEO | 源播放器/重置 | 原流程 | 本地复制引用 | 暂定Taste C1 | P2，最终可覆盖 |
| C12/CEO | 本机Mac无CUDA | 真实闸门保留 | fixture开发模式 | 暂定Taste C2 | P3，最终可覆盖 |

<!-- autoplan-baseline-edits:ceo {"sourceSha256":"6f854ee1b1c4aa7e4da6a5719302575198263f92ba9bcfea3bffbdfb4cd961ea","replacements":[{"oldText":"**权威版本声明**：本文档是技术契约的**唯一权威来源** —— 包括 输出 schema、模型职责、窗口硬约束、结构化提取流程、评测口径、数据流与隐私。","newText":"**契约关系**：本文件为待批准实施计划，以根目录 ARCHITECTURE.md 为原始技术契约来源；后附的已接受义务为具体实现补充。最终批准后，在实现前将冲突条款和已批准补充同步到 ARCHITECTURE.md，使其继续作为唯一技术契约；未批准的用户方向调整不能同步。"},{"oldText":"│  5 验证：证据不足 → 扩窗重试（上限 3，仍须 ≤120s）       │","newText":"│  5 验证：初次、扩窗与失败重试共享全局3次zoom预算       │"},{"oldText":"6. **输出阶段合并重叠区事件并去重**（按 `support_score` 取高者）。","newText":"6. **输出阶段合并重叠区同一事件并去重**；支持度按C14同类型比较规则，无可比值时保留证据并标注冲突，禁止伪造分数。"},{"oldText":"3. 结果按时间合并，重叠区事件去重（取 `support_score` 高者）；","newText":"3. 结果按时间合并，仅同一事件在重叠区去重，使用C14支持类型规则，不比较混合类型分数；"},{"oldText":"5. 扩窗重试同样受此约束，且**单次查询子窗口数上限 3**。","newText":"5. 初始回看、扩窗与失败重试共享**单次查询3次zoom视频推理尝试**；子窗口数也不得超过3；调用前扣预算，超额按C04明确partial/error，不静默截断。"},{"oldText":"| **最大扩窗重试次数** | **3** |","newText":"| **全局zoom推理尝试预算** | **3，包含初始、扩窗及失败重试** |"},{"oldText":"| 4 | **时间竞争**（若 10/15 另有 GCP 场提交） | 实际只剩约两周 → 砍掉前端打磨与聚合特性，只保垂直切片 |","newText":"| 4 | **时间竞争**（若另有提交冲突） | 仅交垂直切片属于未完成MVP；任何范围缩减须另经用户决定，当前计划仍保留C01全部范围 |"},{"oldText":"| 5 | **中文能力未实测**（F9） | 与 GO/NO-GO 同测；若弱，demo 走英文、中文作为能力声明 |","newText":"| 5 | **中文能力未实测**（F9） | 分别测中文查询、音轨、画面文字；若弱可依原降级演示英文，中文只披露实际测试和限制，不声明未证明的能力 |"},{"oldText":"**为什么粗标注只抽 8–16 帧**：全视频密集标注对 1 小时视频 = 30 次全量 Omni 调用，成本与时延都不可接受。","newText":"**为什么粗标注只抽 8–16 帧**：1小时连续视频按120s/5s至少需要32次窗口调用，镜头切分可能更多；当前30次粗标注保护与完整小时索引冲突，U1待用户决定，预算不足预检拒绝。密集回看的成本与时延更高，需要实测。"}]} -->

### Spec Review Loop：attempt 1
独立native规格代理读完scope和408行当前实施输入，评分6/10，10项问题；没有应用代码可审。逐项处置：1输入质量/原音轨/置信度→C13；2派生TTL→C15；3budget冲突→baseline+C04；4authority→baseline+C14同步；5中文宣称→baseline+C07；6支持等级→C14；7ready必需artifact→C13；8未批准砍scope→baseline+C16；9小时目标→U1明确blocked，保留原预算；10排期依赖→C16。全部10项已应用候选修订，reviewer-confirmed fixed尚为0，等待第二次完整review；U1不是自动通过。
| D13 | ceo | 降级能力manifest与音轨复核 C13 | Mechanical | P1 | 源profile要求遗漏必须补全 | 空ASR当成功 |
| D14 | ceo | 支持类型/合并与authority同步 C14 | Mechanical | P1/P5 | 有fallback就须定义消费规则 | level转伪分数 |
| D15 | ceo | 全部派生数据TTL C15 | Mechanical | P1 | 原TTL要求含向量日志 | 只删媒体 |
| D16 | ceo | 出口依赖和未通过目标 C16 | Mechanical | P1/P6 | 实施顺序不能遗漏已接受义务 | 缩MVP逃避目标 |

### Spec Review Loop：attempt 2 与文档自动决策
独立native ceo_spec_2完整读scope和413行31288bytes的当前Implementation，评分9/10，五项全部PASS，确认第一轮10项全部已解决；0个新阻塞建议，提出engineering细化same-event规则/视觉可用性阈值。修复确认数10，剩余规格问题0；U1仍pending不是规格遗漏，实跑未完成不是计划通过证明。
D17：按autoplan普通机械决策自动选择“认可当前scope文档，继续0I”，仅认可C01–C16和明确的provisional Taste，不批准U1或实施；来源autoplan P1/P6。

### CEO Step 0I：实施中的时间序列
| 时间 | 会遇到的问题 | 当前处置 | human / CC |
|---|---|---|---|
| H1基础 | 本机Python3.14与GPU依赖未兼容；云模型ID/配额未知 | 本机fixture与LinuxGPU分开依赖锁；D1完成预检，未验证不能GO | ~4h / ~60min（云验证不能按代码生成比压缩） |
| H2–3核心 | 绝对时间、语音分块偏移、repair/status歧义 | C02–C04、C13–C14变成schema与有明确assertion的fixture | ~8h / ~60min |
| H4–5集成 | 查询看到半索引、删除后worker复活、超过预算 | 原子manifest/generation、墓碑、共享账本；U1待最终用户 | ~8h / ~90min |
| H6+验收 | 稀疏短事件漏召回、中文不支持、真实p95过高 | 保留三消融/原指标，失败如实报告；不使用fixture过闸门 | ~2d / ~4h + 实测等待 |
后续细化仍在CEO/设计/DX/工程顺序内，当前不预写后续阶段结论。预计全部MVP需约15–20人日，CC实现/验证约3–5工作日加云等待/人工标注；不是保证工期。
| D17 | ceo | scope文档认可与继续0I | Mechanical | P6 | spec9/10且原方向/未决项保留 | 重复中间审批 |

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

# FrameSeek 界面设计评审

评审输入：design 94bb5ebb174160d9178c4b698ab13cf7d4be3628d321a4c3da419d033054c4e9。独立代理完整读取432行输入，完成6项发现；外部模型 unavailable（under_codex），共识 N/A。仅审计划，没有应用代码或实际界面可作视觉验收。

## Step 0：范围和已有能力

初始完整度4/10：源计划定义播放器、聊天和时间轴，CEO补齐四种响应状态，但具体布局、恢复动作和手机行为尚空缺。10分需要每个关键状态都有呈现、动作和验收，且视觉参考经过实际用户确认与渲染检查。当前无 DESIGN.md、组件库、历史设计评审或可复用应用代码；复用浏览器 video 原生控件、表单、链接及语义化区域，不开发自定义播放器。

所有7个维度均评审，由autoplan替代中间选择。gstack designer已探测存在，但generate返回“No OpenAI API key found”，因此没有生成图片、没有视觉模型检查、没有 approved mockup。降级布局证据为临时状态目录中的 DESIGN_SKETCH.html；草图只是待确认方向，不能用它证明视觉品质或用户批准。

## Step 0.5：独立声音与设计检验

独立代理：H1层级，H2等待恢复，H3状态语义，H4播放/失效，M5追问，M6首次/演示入口。每项都与既定MVP相连，不要求额外产品模块。外部声音 unavailable；下表“主审”是本轮计划分析，不能充当第二模型，native未给出的七项答案不能代填。

| 检验 | Native明确结论 | 外部 | 主审输入判断 | 共识 |
|---|---|---|---|---|
| 首屏产品可识别 | 未单独评分 | unavailable | 未规定标题与状态层级 | N/A |
| 强视觉锚点 | 层级不足H1 | unavailable | 播放器可承担，尺寸未规定 | N/A |
| 扫读理解 | 层级不足H1 | unavailable | 应用区标题和事件行不足 | N/A |
| 每区一个任务 | 未单独评分 | unavailable | 需播放器/问答/详情区分 | N/A |
| 卡片必要 | 建议事件卡 | unavailable | 采用可选择事件行，避免嵌套卡 | N/A |
| 动效有目的 | 未单独评分 | unavailable | 未规定，不需要装饰动画 | N/A |
| 去除阴影仍成立 | 未单独评分 | unavailable | 计划未指定皮肤，像素不可验 | N/A |

## Pass 1：信息架构 — 4→8

原文给出了两个核心区域，却没有让证据获得足够的阅读和操作优先级。推荐桌面视频工作区60%、问答40%作为Taste C3；反向聊天主区也可行，但会降低复核画面的面积。按P5明确规定回答先一句结论，随后按时间排序的事件行，每行含描述、时间范围、证据和支持等级；JSON与检索技术详情收进“查看结构化结果/查找详情”，不让模型术语挡住操作。结果行是可选择证据的实际交互，不是装饰卡片；不能把全部状态叠成卡片墙。8分是实施规格完整度，尚欠用户视觉确认和渲染检查。

```text
FrameSeek / 当前视频 / 可用能力 / 到期时间
├─视频工作区（原视频、原音轨、原生控件、时间轴命中）
└─提问区（可见标签、输入、提问、重置）
  ├─一句结论
  ├─事件行→时间范围/证据帧→原视频核对
  ├─尚未确认/未检查范围
  └─次级：查找详情 / JSON / 复制时间引用
```

## Pass 2：交互状态 — 5→9

四种API结果语义已有约束，但不同状态若只改变一个颜色标签，用户仍会把未查完误读为没有事件。原上传/索引进度补成明确操作：选文件、上传字节进度、服务端预检、处理阶段、开放提问；预检在文件到达后进行，客户端只做轻量格式/字节筛查，不能承诺上传前已知镜头数。查询失败不清掉已验证历史，重试复用任务身份；取消停止后续推理、标明已计费尝试，不承诺撤回正在运行的云请求。状态表直接规定用户看到的内容，最终仍须实际端到端验证。

| 功能 | loading | empty | error | success | partial |
|---|---|---|---|---|---|
| 上传 | 字节进度/取消上传 | 上传视频为主按钮，显示实际限制和保留期 | 格式/尺寸/解码错误，重新选文件 | 文件到达，进入预检 | 不把残缺上传当完成；清理临时文件 |
| 索引 | 真实阶段及已完成段数；取消，刷新恢复 | 未选视频说明下一步 | 预算拒绝展示N与30上限；阶段失败可重试 | 可提问，显示可用通道 | 合法降级ready显示长期能力警告；未完整索引不ready |
| 问答 | 当前问题“正在查找”；防双提交 | 已就绪显示示例问题，不替用户提交 | “本次查找未完成”，重试入口/request_id | 结论＋证据事件行 | 已验证结果在先，未确认项/未检查范围紧随 |
| 无命中 | 同问答 | 完成查找但无支持证据，提示换具体动作或台词 | 不把错误归为无命中 | 显示本次已检查范围/通道 | 尚未查完不能用无命中结论 |
| 证据播放 | 原生loading，seek待定 | 尚无可核对证据 | 播放/定位失败，重载；到期不可重试旧URI | 对应事件范围/帧位置突出 | 部分媒体可用，逐证据说明不可用原因 |
| 会话/澄清 | 只允许一条在途查询，保留下一问草稿 | 当前视频的新对话 | 失效/视频切换清锚点，保留可见原因 | 选择候选事件后重新提交原问题 | 新增事件＋本次范围，不能宣称穷尽全视频 |

## Pass 3：旅程与情绪 — 4→8

用户前三秒应看到上传和当前视频，前五分钟应完成一次可复核定位，而长期信任取决于系统是否如实解释缺失证据。30分钟索引目标意味着等待本身是主要体验，不能只给无限旋转图标。取消、刷新恢复、保留失败素材和明确重试减少失去进度的焦虑；fixture持续标记则避免演示误导。按既定能力建立下列旅程，不添加注册、订阅或协作范围。

| 步骤 | 用户动作 | 可能感受 | 已规定支持 |
|---|---|---|---|
| 1 | 进入/选视频 | 不知道支持什么 | 显示实际配置限制、语言能力、保留期 |
| 2 | 上传/等待 | 担心卡住 | 字节进度与处理阶段区分；可取消/恢复 |
| 3 | 第一问 | 期待直接找到 | 有标签输入、清楚可问状态 |
| 4 | 查看事件 | 怀疑正确性 | 紧邻时间证据/支持等级/未确认项 |
| 5 | 点击复核 | 想确认同一事件 | 原视频seek、突出范围和证据位置 |
| 6 | 追问 | 期望延续上下文 | 歧义候选选择，换视频清状态 |
| 7 | 到期/删除 | 不知道为何打不开 | 旧回答“证据已不可用”，重新上传重新验证 |

## Pass 4：通用模板风险 — 3→8

本界面分类为 OPERATE：用户要完成视频检索任务，没有营销首页范围。初始没有具体皮肤，不能从两句话推断已有漂亮界面；七项hard rejection没有足够输入证据证明触发，不能把“未规定”判成像素已通过。暂定用浅色中性工作区、单一蓝绿强调色、行式事件结果、无装饰渐变/发光/卡片拼贴，产品名和当前视频持续可见。原视频是视觉锚点；仅状态变化和定位高亮需要反馈，内容始终可见，减少动态偏好下取消过渡。皮肤Taste C4仍可由用户推翻；8分对应具体可实施规则，不是视觉验收。

## Pass 5：设计系统 — 2→8

没有 DESIGN.md 使字体、间距、支持等级表达很容易随组件漂移。推荐一个轻量本地CSS变量表，不引入新组件平台；暂定IBM Plex Sans用于Latin UI，Noto Sans SC用于中文，16px正文、14px以上辅助标签并确保4.5:1对比，4/8/12/16/24/32间距，按钮6px圆角。主题建议background #f5f7fa、surface #ffffff、text #17212b、muted #53616f、accent #006d77、border #c7d2da；色值须在实现中验证对比度，不能仅凭声明验收。避免外部字体网络依赖，打包许可字体或稳定fallback；焦点、选中文字、光标、时间数字、visited链接与表面配套，颜色之外用文本和图标表达状态。C4将这套视觉取值保持暂定，创建正式DESIGN.md须待最终批准。

## Pass 6：响应式与可访问性 — 2→9

只写“支持键盘”不能保证提交、选择证据和澄清都可操作。桌面≥1024px采用两区，768–1023px视频在上、问答在下，≤767px一列，先保持当前播放器，再可直接滚至证据，避免固定大播放器遮住输入；320px、长文件名、长转写、200%缩放无横向页面溢出。所有操作用真实button/link，目标≥44px，焦点可见，主要区域使用landmark，阶段更新aria-live polite且只播状态变化，错误可读且不抢走输入焦点。时间轴命中还必须有等价文本按钮，不能只靠精细拖动；seek成功维持用户播放状态（Taste C5），点击结果后仍保留触发控件焦点并播报定位时刻。屏幕阅读器/键盘/触屏和自动对比测试留作D13–16验收，未运行不得标pass。

## Pass 7：决定登记

| 决定 | 分类/处置 | 推荐与替代 | 不明确的后果 |
|---|---|---|---|
| H1信息层级/桌面比例 | Mechanical具体字段；Taste C3比例 | 60/40视频优先；替代50/50或聊天优先 | 原视频复核被埋没 |
| H2等待/恢复 | Mechanical P1/P5 | 阶段+重试+取消；拒绝无限spinner | 用户丢进度 |
| H3四状态文案 | Mechanical 原C02/C13 | 根据有效证据区分；拒绝统一“没找到” | 错误安心感 |
| H4播放失效 | Mechanical范围/到期；Taste C5播放 | 事件起点/帧时刻，保持播放状态；替代点击播放 | 意外声音/旧证据错误 |
| M5澄清与在途 | Mechanical P5 | 候选时间按钮，不猜身份；在途禁新提交保留草稿 | 迟到结果污染会话 |
| M6空页/fixture | Mechanical 原C09/C12 | 上传主操作、演示持续标记、删除与重置分开 | 演示误认为真实 |
| 皮肤/字体 | Taste C4 | 轻量浅色工具界面；替代深色或现有品牌 | 无明确视觉参考 |

每项机械建议由autoplan授权逐项选择，未等待额外导航许可；C3/C4/C5均暂定，最终门可推翻。没有新增User Challenge；U1原30调用限制继续有效。没有界面相关follow-up需要新增TODOS；实现和验证归入本计划任务。

## NOT in scope

- 营销首页/定价/注册：源MVP仅操作界面。
- 定制播放器、波形编辑、片段导出：与原证据回跳无关。
- 外部分享服务：C1仅复制引用，不发布私有媒体。
- 新增协作或多视频导航：原V1/V2延期保持。

## Implementation Tasks

- [ ] **T1 P1，human 2天 / CC 2小时**：实现上传/任务/问答状态与恢复，含预算拒绝和能力警告。Files: app/static/index.html, app/static/app.js, app/static/styles.css。Verify: 覆盖状态表全部格及刷新/取消/重试。
- [ ] **T2 P1，human 1天 / CC 1小时**：实现证据事件行、原视频/音频seek、到期与删除失效。Files同T1。Verify: 事件与帧分别定位、加载错误、expired/deleted不能复用。
- [ ] **T3 P2，human 1天 / CC 1小时**：补齐响应式、键盘、屏幕阅读器与主题；依据最终C3–C5。Files同T1及DESIGN.md。Verify: 320/768/1024px、200%缩放、键盘、44px目标、对比度、减动态。

## Completion Summary

Step0 4/10；Pass1 4→8，Pass2 5→9，Pass3 4→8，Pass4 3→8，Pass5 2→8，Pass6 2→9；overall=min六项=2→8。7项决策已记录，6项代理问题覆盖；3个设计Taste暂定，外部覆盖不可用。NOT in scope 4项，what already exists已写，TODOS新增0，tasks3，mockups图片0/批准0，HTML草图1且未批准。计划层规格已补齐，像素/真实可访问性仍需实现后验证；不是clean视觉验收。


<!-- autoplan-accepted:design -->
- G01：界面为单视频操作工作区：持续显示产品名、当前视频、可用通道与到期；桌面视频60%/问答40%（Taste C3），回答先结论后按时间排序事件行，行含描述、时间范围、证据图或原话、支持等级；JSON/技术详情次级可查看复制，支持等级解释为证据支持程度而非正确率。上传空页为主操作，显示实际输入限制/格式/语言/保留期，未ready解释为何不能问；fixture入口与每条演示结果持续标记，切回真实建立独立会话。验证首屏操作、长名称/转写、真实与fixture切换和证据直接回跳。
- G02：上传字节进度与服务端处理阶段区分，轻量客户端限制检查后上传，文件到达后做ffprobe/镜头/窗口预检。预算拒绝显示所需N与当前30次限制并可重新选文件，不裁剪/改上限；queued/probing/transcribing/captioning/indexing显示真实阶段与已完成段数，不编ETA。取消停止后续调度、保留已计费尝试记录，不承诺云请求撤销；刷新恢复同一任务，阶段失败保留素材并可重试同job。测试上传中断、预检拒绝、取消、刷新/崩溃恢复、重试不重计已完成阶段和ready前不可问。
- G03：按C02四status呈现：ok结论与证据；partial先已验证结果，再未确认事项及未检查范围；no_result仅成功查找无支持证据，显示本次检查范围/通道并建议换具体动作或台词；error说明本次未完成和重试/request_id，不得得出无事件。就绪视频持续显示缺失/静音/不支持/失败音轨等能力警告，相关问题旁重复原因；异常不清空历史已验证结果。测试每种状态、budget耗尽、语言和音轨缺失，不把未查完作为全视频无命中。
- G04：时间范围点击定位事件起点；证据缩略图定位证据绝对时刻；分别突出事件区间与当前证据位置，原音轨可复核。定位维持原播放/暂停状态（Taste C5）；显示加载、seek失败和重载，成功播报时刻且焦点留在触发按钮。到期或删除的旧回答标为证据不可用、禁止旧URI回跳与相关追问，重新上传须重新索引验证，不能自动恢复旧证据。测试两种seek、缓冲失败、过期/删除、静音与用户播放状态。
- G05：歧义追问保留原问题，展示已验证事件/时间候选供选择，不自动确认人物身份；建议追问采用可验证事件表述。“还有别的吗”列新增事件与本次范围，无新增不宣称穷尽；每会话只一条在途查询，提交按钮忙碌且保留下一问草稿，重置/换视频递增generation，迟到结果不插入新会话。重置与删除按钮区分，删除先说明媒体与关联会话清理后确认。测试歧义、快速双提交、草稿、迟到结果、重置、换视频和删除说明。
- G06：≥1024px两区，768–1023px视频上/问答下，≤767px单列，移动端不固定大播放器挡输入；320px、长内容、200%缩放无页面横向溢出。原生video controls；全部操作button/link，44px触摸目标，可见焦点/可见表单标签，语义landmark，aria-live polite播状态变化，错误说明可读且不抢输入焦点，时间轴有等价时间文本按钮；不用颜色作为唯一状态。验证键盘全流程、屏幕阅读器、触屏、视口与缩放；实际渲染后再确认对比与视觉质量。
- G07：轻量本地CSS变量和主题（Taste C4）：background #f5f7fa、surface #fff、text #17212b、muted #53616f、accent #006d77、border #c7d2da；IBM Plex Sans Latin UI/Noto Sans SC中文，许可打包或稳定fallback避免外部字体网络依赖，正文16px、辅助标签≥14px且对比≥4.5:1，间距4/8/12/16/24/32，按钮6px圆角。主题化焦点、选择、光标、visited链接与tabular时间数字，少量定位/状态过渡从可见内容开始且reduced-motion禁用；不用装饰渐变/发光/卡片拼贴。最终批准后写DESIGN.md，检验实际计算对比；HTML草图暂定且未批准，不算图片或像素验收。
<!-- /autoplan-accepted:design -->

| D21 | design | Taste | C3 桌面视频60/问答40 | 暂定接受，最终门可调整 | 播放器为证据锚点；可改50/50或聊天优先 |

| D22 | design | Mechanical | 等待恢复 | 暂定接受，最终门可调整 | H2按原异步进度补全恢复 |

| D23 | design | Mechanical | 状态语义 | 暂定接受，最终门可调整 | H3沿用原C02/C13 |

| D24 | design | Mechanical | 证据失效 | 暂定接受，最终门可调整 | H4沿用时间与TTL契约 |

| D25 | design | Taste | C5 seek维持播放状态 | 暂定接受，最终门可调整 | 避免自动声音；可改点击即播放 |

| D26 | design | Mechanical | 澄清与在途 | 暂定接受，最终门可调整 | M5按P5单请求和代际保护 |

| D27 | design | Mechanical | 空页与演示 | 暂定接受，最终门可调整 | M6已有C09/C12范围 |

| D28 | design | Taste | C4 轻量浅色主题 | 暂定接受，最终门可调整 | 缺少既有DESIGN；取值暂定可推翻 |

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

<!-- autoplan-accepted:dx -->
- X01：提供三步本地fixture快速开始：获取源码/读说明后make setup、make demo、打开输出URL提问与证据回跳；命令输出持续MODE=fixture，不依赖GPU/外部模型付费调用，缺ffmpeg仅阻止real。实际支持Python由D1验证并固定，缺前置条件显示版本/安装文档。完整计时包含源码获取、阅读、前置条件、安装和首次标记演示问答/seek；目标2–5分钟未测，缺Python/网络影响记录，不截为warm命令时间。real独立setup→配置→preflight→worker/app→真实smoke，账户/配额/镜像/权重加载时间全部计入，unknown不得宣称5min或用fixture代替；不自动real失败降级fixture。至少Mac/Linux各一次冷启动记录，作者自测明确标记，无产品遥测或自动上手release gate。
- X02：冻结既定公共接口：POST /api/session随机主体cookie+CSRF；POST /api/videos multipart Idempotency-Key返回202 video_id/job_id/generation（仅建任务），GET /api/jobs/{job_id}阶段/真实进度/capabilities/errors；POST /api/jobs/{id}/retry与/cancel合法状态才受理；POST /api/chat含video_id/session_id/generation/request_id/question返回同步最终响应；POST /api/chat-sessions/{id}/reset新generation；GET /media/{video_id}/…拥有权/Range/到期检查；DELETE /api/videos/{id}幂等墓碑+异步清理进度。Agent内部retrieve/read_segment/zoom/asr_search不作为公共用户接口；轮询2秒起、错误退避至10秒尊重Retry-After，有最大等待和明确停止。提供完整curl cookie jar与CSRF示例、类型/OpenAPI、重复请求/失效主体/ready前/跨主体/取消重试测试；不新增SDK或公开API产品范围。
- X03：errors对象冻结code/stage/message/cause/retryable/suggested_action/docs_url/request_id，未知cause显式unknown，problem+cause+fix+有效本地文档入口。覆盖预检/预算/语言通道/模型超时/repair失败/非ready/expired/deleted/限流；HTTP输入400/422、认证401/403、不存在404、未ready409、到期410、限流429、无有效证据的模型失败502/504；no_result和有有效证据partial为200。四status原C02保持，错误例与响应在首个0.1冻结版本同步，无内部路径/密钥/思维原文/用户原文日志。测试每类状态映射、retryable/错误目录链接、repair一次、超时预算计数，不能隐含自动重试云视频请求。
- X04：D1随包配置写README/快速开始，D2–3随切片写完整教程，D4–12随功能写API/配置/错误，D21–24完成部署/评测/材料校对。docs/getting-started.md、api.md、configuration.md、errors.md、evaluation.md、deployment.md与README目录形成可找到的参考；浏览器查找即可，不新建文档站。提供可校验四status、score/level互斥、通道降级、语言、任务生命周期fixture和原视频seek例子；命令/例子全部运行校验，未实现输出标proposed。CHANGELOG/CONTRIBUTING与错误报告指南随公开提交物，实际许可/归属/媒体权利发布前核查，不宣称已开源或成熟社区。
- X05：记录应用版本、schema0.1、SQLite迁移版本、index_generation、模型revision/采样配置hash；兼容索引才能读，不兼容显示重建要求。模型/config变化新generation构建并原子发布，迁移升级先停止新任务、事务迁移和备份必要状态，失败回滚；删除/到期禁读名单不能因回滚复活。首次冻结前补全schema并CHANGELOG，之后破坏契约须版本/迁移说明，当前无已发布客户端不新增codemod。测试索引版本不匹配、迁移失败回滚、到期与回滚交错，不能自动覆写索引或恢复已删除媒体。
- X06：本地CPU服务/fixture基础依赖与LinuxGPU推理额外依赖分开锁定，make test/eval-fixture不付费、eval-real须显式配置和preflight，Mac/Linux支持由D1验证，Windows未知不宣称。配置优先env>配置文件>默认、密钥仅env，preflight输出脱敏最终配置/来源/单位/合法范围；scene阈值0.3、coarse_frames12可8–16、candidate_k10/rerank_k5、TTL24h可配置为待实测默认。120s/1FPS/128帧和当前30粗标注/3zoom保护硬校验，U1不能普通config绕过。受限adapter类型+mock支持已授权模型替换，debug只授权开发模式，部署不默认公开debug；测试config优先/边界/无密钥fixture/硬限制拒绝/示例adapter与独立fixture-real评测。
<!-- /autoplan-accepted:dx -->

| D29 | dx | Mechanical | 完整双模式快速开始及计时 | 接受 | P1/P5补齐C12，原预算与方向保持 |

| D30 | dx | Mechanical | HTTP lifecycle契约 | 接受 | P1/P5补齐C12，原预算与方向保持 |

| D31 | dx | Mechanical | 问题原因修复错误对象 | 接受 | P1/P5补齐C12，原预算与方向保持 |

| D32 | dx | Mechanical | 随功能教程和示例 | 接受 | P1/P5补齐C12，原预算与方向保持 |

| D33 | dx | Mechanical | 版本迁移与索引重建 | 接受 | P1/P5补齐C12，原预算与方向保持 |

| D34 | dx | Mechanical | 轻量依赖及受限配置 | 接受 | P1/P5补齐C12，原预算与方向保持 |


### Phase 3 — Full engineering review

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


<!-- autoplan-accepted:eng -->
- E01：在原C09单输入限制外补全单机总资源admission；全局GPU推理并发初值1、摄取worker1、待摄取队列2、每会话在途查询1，全局query slot有限，无空slot则429/Retry-After不无限排队。D1冻结有效配置表的磁盘总量/每主体量、上传字节/时长/像素/问题长度、Agent步骤/全部模型请求数/输入输出token/墙钟期限及cleanup重试上限，real任何必需限额未设或非有限合法值则preflight拒绝。所有文本规划/改写/repair、zoom和重试在统一admission/账本计数，C04的3视频尝试和1文本repair不变；deadline/budget结束按有已验证结果partial、否则error并说明未查范围。测试10倍多主体/排队/磁盘/OOM/无限tool loop/token/timeout，不能靠新cookie绕过部署总量；限额默认是待D1实测的保护配置，不是性能达标。
- E02：所有付费模型调用持久记录attempt_id、kind、video/index_generation、chat_generation/request_id、预算、provider标识及reserved/dispatched/completed/unknown状态；调度前事务预扣预算，未知/连接丢失/崩溃保持已扣且禁止自动重发。只有实际验证供应商幂等语义才按原id复取，否则用户明确发起新尝试且有剩余已批准预算才dispatch；不承诺外部exactly-once。worker阶段CAS领取lease，过期lease不自动重复unknown调用；query按owner/session/chat_generation/request_id原子去重并比较payload hash，同载荷返回同请求状态/结果，不同载荷409。测试预算提交/dispatch/返回丢失/持久结果前后crash、双worker及重复query；恢复/取消/删除保留元数据账本而不能恢复已失效内容，账本按C15统一TTL。
- E03：补足C16/C17排期依赖：D2–3除单窗真实闭环，还必须有最小多窗口摄取、真实caption/ASR候选检索和跨窗合并，诊断4类每类至少2问以实际candidate列表核对标注窗，不能seed真值或fixture。D4–6仍完成持久化/完整双通道索引加固，D7–9仍完成混合召回/zoom预算与优化，C01全范围和指标不削减。诊断系统性漏召回即NO-GO，用同集调整采样/索引复核，scope/model改变另交用户。测试真实候选与跨窗证据、negative无幻觉、全部时间可回跳；最小链路不可冒充全量完成。
- E04：暂定Taste C6用POST /api/chat/prepare作为查询前控制协议，响应kind=ready或clarification_required，必要时返回已验证事件/时间候选及绑定owner/video/session/chat_generation的intent_id；清楚独立新问题可ready且不要求已有锚点。prepare不做视频zoom；若需要文本改写仍计入同intent统一模型账本，重复prepare幂等，无隐形预算重置。POST /api/chat接question/intent及可选服务器验证event anchor，执行后仍只使用C02四查询status；未解决歧义直接提交返回409 precondition控制错误并保留原问，未开始执行不能捏造partial/error/no_result查询结果。选择只接受同视频/同会话/同代际仍有效已验证事件，未知人物不能变身份；reset/switch/delete/expiry使旧intent失效。测试0/多候选、独立新问、伪anchor、旧intent、原问保留、prepare重复账本、reset后迟到结果；首个schema0.1冻结前补类型/文档。可行替代为单/chat端点独立控制envelope，最终门可覆盖暂定接口形式，四状态语义不变。
- E05：将原visited_segments拆成候选记录、成功review、按问题checked_ranges和returned_events，失败/unknown不能写成功review。结果缓存key至少包含video/index_generation、窗口范围/实际采样PTS、规范问题、prompt/model revision和采样/检索config hash；仅完全匹配且重新owner/expiry校验才复用，失败无成功缓存，大小/条数/TTL有限且删除级联失效。新问题不得因sid见过而跳过；还有别的吗只按已返回同事件去重，仍检查必要旧窗，说明范围且不称穷尽。测试同/不同问题、失败/unknown、revision/config变化、旧代际/跨主体/expiry/delete缓存以及跨窗同/不同事件。
- E06：在第一次真实诊断/benchmark前冻结标注、指标与版本：正负分类、绝对事件区间、相关窗口、可观察声明和支持帧/原话，人工复核/分歧记录。Recall@5按正问题相关标注窗口top5覆盖率先per-question再macro；IoU@0.5问题成功需一对一匹配覆盖全部ground-truth事件且每个IoU≥.5，positive漏项/失败/timeout记0，negative另报正确无命中和假阳性。证据准确率为所有返回可观察claims由对应证据直接支撑的比例，空返回分母0时N/A且另报positive任务完成/完整性，不能全error虚过。schema以固定总请求分母分别报raw/一次repair后；失败/timeout/拒绝与完成率独立，P95成功耗时含全部服务阶段且不剔困难问题、冷warm另报。保留C01真实集目标/全部原指标、C18三基线和三既定消融，fixture不计真实质量；测试多事件/重复匹配/边界/nohit/幻觉/失败/timeout/空分母及统一baseline输出。任何协议变化在看结果前版本化并同步契约。
- E07：代码组织为单包src/frameseek、一个FastAPI入口、一个SQLite持久worker，外部模型服务保持既定自托管/云文本边界，不引入Redis/Celery/微服务或通用插件。静态资源统一src/frameseek/static/index.html、app.js、styles.css，前阶段task中的web/及app/static/作为同一目标的别名归一。schema/config/auth/媒体时间/模型adapter分别单一责任；shared auth gate用于api及media/job/chat/tool授权，不让模型传sid越权。query request_id、attempt_id、job_id、index_generation和chat_generation明确区分；测试各caller跨主体/expiry/gen拒绝及cookie CSRF/Origin，真实cookie Secure/HttpOnly/SameSite，fixture只localhost。SQLite短事务/WAL/busy timeout/有限重试，模型网络调用不占写事务；测试竞争写入无静默丢失。
- E08：baseline仅修正源示例与已有约束：entity_memory保存已验证事件/物体的锚点和可观察属性，不推断未知人物身份；visited_segments文字按E05拆分；followups改为该动作后发生什么/还有相似动作；无ASR只按可用视觉证据计算而不能认定静音天然低分。保持C14 score/level定义互斥与不伪精确，C/G/X已接受块完整原文保留。测试例子schema有效、身份不猜、静音视觉直接证据与score/level条件，批准后实现前同步根ARCHITECTURE.md/profile.md。
- E09：成本按实际window count/attempt ledger及真实GPU耗时和token计算，包含5s overlap、镜头、失败/unknown和重试；N实际预检，不以duration/120取整估计。原30 primary coarse-window保护和U1未决原方向保持；另有限coarse重试额度D1预算表冻结、初值0，失败显示failed且无自动付费重试，用户明确重试也须已有批准的剩余额度。未知价格/权限/耗时标unknown，不能填预设成本；测试3600s=32及scene更多、失败/unknown ledger和预算拒绝无dispatch。
- E10：流式逐窗解码/采样，不把全视频decoded帧置内存，单次Omni≤128帧且缩放≤1080p，音频块保留offset、临时artifact继承TTL；GPU先串行、共部署必须测峰值显存，只有已验证降级配置可启用。检索批量取top-k段/证据metadata，FAISS/BM25按generation读取不每问重建，缓存大小/TTL有限且key按E05。D2–3记录阶段总耗时，D7–9初报cost/VRAM，D17–20原集原目标；query P95从受理到最终含所有服务阶段，timeout/reject/失败完成率独立，播放器延迟另报。不用timeout替代15s目标，不把短片替代blocked小时目标；测试采样RSS/VRAM、批量等价、cold/warm、超额可诊断及原质量不回退。
- E11：完整测试计划24路径簇逐项覆盖setup/config、模式、real preflight、owner/CSRF、upload/query幂等、媒体/总资源、窗口/PTS、通道、worker/lease、attempt crash、manifest竞态、索引版本、澄清、混合候选、zoom/tool预算、cache、证据/support、schema四status/repair、HTTP错误、UI迟到/草稿、真实seek/音频、所有TTL/rollback、响应式/可访问性、metric/baseline/消融。当前全部未实现，不声称测试通过；新项目pytest为默认Python测试实现，D1验证兼容并锁定；make test/eval-fixture免费，real显式配置预算。人工browser清单含320/768/1024/200%、键盘/读屏/触屏/44px/contrast≥4.5/reduced motion；真实播放器currentTime/play/paused/expired必须核对。诊断4类8问、开发10/30及独立报告30/100目标、中文三类、prompt injection/noise/cross-window/negative、三基线三消融和性能费用套件全部保留；prompt/model/config变更重跑固定相关集，D17–20完整冻结。
- E12：升级/回滚与清理遵循C08/C15/X05：新索引manifest完整且generation CAS才发布，旧worker、删除或expiry不得发布；所有媒体及派生物/关联会话/日志/缓存和含该素材备份统一到期清理，读取先检查expires/tombstone即使worker未清理也禁止。删除/到期禁读记录不能因恢复旧备份或迁移回滚消失，backup恢复须先重放当前有效删除/expiry边界；清理失败有元数据状态和有限重试、重启恢复，不把已禁读误称文件已清干净。测试publish/delete及expiry双交错顺序、缺artifact不得ready、全部派生TTL、清理失败/重启和迁移失败回滚不复活。实施先冻结core接口；UI/static和eval可在接口后分离并行，shared core/api/schema/docs改动顺序合并，当前nongit不创建worktree、不标实现完成。
- E13：用户D49明确选择A（2026-10-04 Asia/Tokyo），U1预算政策方向已解决：以实际完整窗口数N和已批准的有限primary粗标注调用/金额预算决定摄取准入，替代历史C05/C16/G02/X06/E09中“30为永久上限/U1方向待决定”的当前政策；其余各条原文和行为仍保留。N来自ffprobe/scene/≤120s窗口/5s重叠/尾段完整生成，3600s连续至少32、scene可能更多。D1实测模型单价/计费方式、耗时/显存/配额并冻结具体call和money上限，数值需明确确认；未确认前effective primary cap仍30，必需成本/资源值未知或不足则拒绝真实摄取推理，不能将本次政策选择当价格/无限调用授权。超过有效调用或保守费用预算显示actual N、当前cap及可执行说明，不裁尾、不半索引ready、不以short/fixture替代hour验收。已确认budget配置须有版本/确认记录，服务端按该版本检查，客户端不能提交较大cap；普通配置不能跳过确认门。额外coarse重试独立有限预算、初值0，失败/unknown仍计账且不自动重复；query zoom全局3（含扩窗/retry）和一次文本repair、统一总资源限额保持。32只是连续小时必要值，预算允许才可运行scene更多的小时视频。测试N=30/31/32及scene更多、未确认/未知价格/足额/不足额、调用及金额任一超额、伪造请求cap拒绝、原30过渡、失败/unknown/重试计数和所有完整ready条件；D1只允许在另外确认的有限校准预算内测量，零测量权限不自动付费。此条仅批准计划预算方向，完整计划/实施/部署仍待最终门。
- E14：ffprobe/scene/ffmpeg解码属于不可信媒体预检，每个子进程在可信元数据之前就受有限墙钟、CPU/RSS、stdout/stderr字节、临时磁盘及有限并发保护；使用argv不用shell、最小权限和仅任务目录文件访问，禁止网络协议与媒体外部引用，不能只靠protocol whitelist代替文件隔离。Mac/Linux各验证可用隔离与进程组kill/清理，缺必需隔离或限额则real预检拒绝，fixture不宣称保护已生效。超限/畸形文件给明确code/stage/request_id，不进入模型调用；子进程及子孙可终止，临时产物按TTL和失败清理。测试畸形/截断/伪元数据/挂起/无限输出/外部网络或文件引用/10倍并发/取消，断言资源边界、无外泄及零推理dispatch。
- E15：D1根据实际确认的部署计费方式冻结有限预算及价格版本，费用包括GPU资源分配、启动/加载/空闲、失败启动、保留实例、计费最小单位/舍入、存储和全部ASR/Embed/rerank/文本/视频尝试；按资源时长收费不能只算推理耗时，按请求收费也不能重复算同一资源费。每个资源allocation_id持久记录起止、批准预算/截止时间和未知释放状态；启动前预留保守最长占用成本和停止/释放余量。最大运行期限与供应商侧停止/释放机制必须在有确认预算的校准中验证；仅应用finally或HTTP超时不足以保证停费，不能验证有限费用上界则拒绝该real部署形态。崩溃后恢复对账/释放，停止失败保留unknown预算不再dispatch，向操作者明确资源仍可能收费；金额封顶是已验证执行准入边界，不冒充供应商绝对账单保证。测启动失败、零请求空闲、实例保留、应用崩溃/停机、重复释放、释放失败与最终账单归集，校准也计这些费用，价格或权限未知不付费。
- E16：GPU并发1按单个有界attempt调度，不让整个摄取job占GPU；现有worker/SQLite管理有限等待队列。暂定Taste C7：查询与摄取均有待运行且符合准入时按1:1交替，每类按入队次序；一类空则服务另一类，非抢占正在运行attempt。每次dispatch重新检查owner/expiry/generation、预算、剩余deadline和经校准的保守attempt时长/结束余量，无法在期限内开始则按C02已据partial否则error，不启动必然超期调用。全局query slot满仍429，不扩大队列；取消/reset/到期等待者剔除并安全释放仅未dispatch预留。公平等待界依有限队列和有界attempt，不能承诺15s；记录查询与摄取排队/执行及P95/吞吐，真实共负载回归两类无饥饿、持续多主体、取消/到期、截止前无法开始。可行替代2:1偏查询有限权重，牺牲摄取吞吐换查询等待；最终门可覆盖权重，但有界公平规则不得省略。
- E17：首个schema0.1冻结前补全POST /api/chat同request_id的恢复控制协议，query执行状态与attempt状态独立持久。新受理请求仍等待同步最终四status；同owner/session/chat_generation/request_id/payload恢复，执行中返回HTTP202独立kind=query_control,state=pending、request_id、Retry-After及恢复动作，unknown返回HTTP409同kind,state=unknown和不自动重发说明；这两个控制envelope不含查询status、不计作模型回答，不增加第五状态。最终完成返回同一200回答或原最终错误及相同有效结果，查询worker持有有期限lease负责结束；断线不创建新付费任务。重启后只恢复确定未dispatch步骤/复用已持久结果；任一已dispatch结果未知则控制unknown，除实际验证供应商幂等复取或同request明确不确定终态处理外不得再次dispatch。用户明确新尝试必须新request_id、剩余已批准预算、同会话先结束旧request为有证据partial否则error；同payload重发不是重试授权。控制轮询按X02有限退避/最大等待，unknown停止自动轮询并显示说明/保留草稿；reset/switch/delete/expiry先拒绝旧代际恢复，跨主体不得泄露结果。测双重复POST、payload不同409、断线/响应丢失、持久完成前后crash、unknown无重发、恢复deadline、旧gen及有/无有效证据终态，类型/文档/错误目录/UI一起验证。
- E18：预算按owner及部署总额度双重准入，以服务端已批准budget_version固定job manifest和每次attempt。用SQLite短事务原子reserve调用次数和保守金额/资源占用，模型网络不在写事务内；多job/query/校准并发共享总额度，匿名新cookie不能绕过，普通env/file或请求不能制造批准记录。金额以明确币种/单位的整数最小预算单位和保守向上舍入计算，拒绝NaN/负数/无穷/混币种/未知单价或计费量上界；批准表覆盖所有模型阶段而非仅coarse。一次allocation资源费只记一次，attempt费用按实际计费形态归集，unknown持续占预留，不靠缺结果释放预算。每次dispatch同时核对冻结版本与仍有效批准，额度降低/撤销立即停止未来调用，提升必须新批准记录；旧job不得因配置热改得到新额度。已dispatch不能假称取消费用，上界无法保证则不启真实部署。测试两个并发请求争最后额度只一个dispatch、任一call/money不足零dispatch、不同主体总额度、批准伪造/版本变化/撤销/降额、所有模型及GPU费无漏重算、unknown不释放、舍入与非法金额、校准独立预算，以及N30/31/32/scene更多完整索引。E13是当前U1政策唯一覆盖条款，E14–18具体化其保护，其他C/G/X/E原文义务完整保留。
<!-- /autoplan-accepted:eng -->

### Eng invocation 1 baseline edit history (already applied; do not replay)

```text
<!-- autoplan-baseline-edits:eng {"sourceSha256":"1291bfdee4cd63a4d96189a84541661ac23abe4892d44fc787ed06d8e1dc6442","replacements":[{"oldText":"| `entity_memory` | 已提及的人物 / 物体 / 事件 → id + 属性 + 首次出现时间戳 |","newText":"| `entity_memory` | 已验证事件 / 物体锚点与可观察属性；未知人物不推断身份 |"},{"oldText":"| `visited_segments` | 已看过的段（避免重复烧钱，也支撑\"还有别的吗\"） |","newText":"| `visited_segments` | 按问题区分候选、成功回看、检查范围和已返回事件；缓存须完整key匹配（E05） |"},{"oldText":"\"followups\": [\"他之后去了哪里？\", \"同一人还出现过吗？\"]","newText":"\"followups\": [\"该动作之后发生了什么？\", \"还有相似动作吗？\"]"},{"oldText":"**不补默认值**（静音视频本就该拿低分）。","newText":"**不补默认值**；按直接证据支撑程度判断，不因静音默认低分。"},{"oldText":"`视频时长 / 窗口长度 × 单次 Omni 调用耗时`","newText":"`实际窗口/attempt账本 × 实测各次 Omni GPU 耗时`"},{"oldText":"30（粗标注）+ 重试上限","newText":"30个primary粗标注窗口；额外重试额度初值0，D1预算表冻结有限额度（E09），U1仍未决"},{"oldText":"| **D2–3** | **垂直切片**：单窗口 → ASR / Omni → 结构化 JSON → 播放器跳转 | **GO/NO-GO 闸门** |","newText":"| **D2–3** | **垂直切片**：单窗闭环＋最小多窗摄取/真实候选召回/跨窗证据 → JSON → 播放器跳转（E03） | **四类8问 GO/NO-GO 闸门** |"},{"oldText":"§7.2 调用次数上限 + `visited_segments` 去重 + 缓存","newText":"§7.2 实际attempt预算 + E01总资源admission + E05按问题/版本缓存"}]} -->
```

### Eng Decision Audit Trail
| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|---|---|---|---|---|---|
| D35 | eng | E01总资源和调用上限 | Mechanical | P1/P5 | C09安全预算具体化 | 无界队列/仅每主体限额 |
| D36 | eng | E02未知attempt不自动重发 | Mechanical | P1/P5 | 云执行不能靠本地幂等证明 | 失败阶段自动再付费 |
| D37 | eng | E03诊断依赖前移 | Mechanical | P1/P2 | 已接受C17不能缺真实检索 | 假candidate/延迟GO |
| D38 | eng | E04 prepare控制协议 | Taste C6 | P5 | 四查询状态语义保持 | 可行单端点控制envelope |
| D39 | eng | E05问题/版本缓存 | Mechanical | P1/P5 | visited不能跳过新问题 | sid布尔去重 |
| D40 | eng | E06冻结指标分母 | Mechanical | P1 | 原目标可被可比检验 | 只挑成功输出 |
| D41 | eng | E07单包/单worker组织 | Mechanical | P2/P5 | 原规模无需消息平台 | 微服务/通用插件 |
| D42 | eng | E08修正身份/静音示例 | Mechanical | P1/P5 | 与C10/G05/C14一致 | 暗示人物识别 |
| D43 | eng | E09实际窗口成本 | Mechanical | P1 | 5秒重叠/unknown算预算 | 时长除120粗估/无限retry |
| D44 | eng | E10流式/批量/实测 | Mechanical | P1/P5 | 现有目标可验证 | 未测吞吐保证 |
| D45 | eng | E11完整24路径与suite | Mechanical | P1 | 对已接受行为逐项验证 | happy path-only |
| D46 | eng | E12删除/rollback闭环 | Mechanical | P1/P5 | 原TTL不能因backup复活 | 盲还原旧state |
| D47 | eng | 原四TODO保留/不扩分布式 | Mechanical | P2/P5 | 原方向优先、无新扩展 | 时间紧削MVP |



### Consolidated decision count / D17 table repair
| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|---|---|---|---|---|---|
| D17 | ceo | 认可spec attempt2并继续review | Mechanical | P1/P6 | 原叙述已自动接受，仅补同一决定表行；10问题确认修复，U1仍pending | 将9/10当GPU通过 |

Audit计数47项唯一ID，40 Mechanical、6 Taste、1 User Challenge。D17没有改变已接受义务或形成新决定。

### Phase 4 — Final synthesis

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


### D49 / U1 resolution — 2026-10-04 Asia/Tokyo

State: approved policy direction, numeric spending limits pending D1 measurements.
Actual answer: human user replied exactly `A` to D49 on 2026-10-04; selected option A in docs/autoplan/U1_BUDGET_DECISION.md. Prior B2 was navigation only.
Accepted scope: replace permanent fixed-30 primary-window admission with approved configurable finite call/cost budget and actual full window count preflight; retain 30 protection until numeric values explicitly confirmed; unknown/insufficient budget refuses inference; no partial index ready; no unlimited spend. Extra retries separately bounded default0; query zoom still global3 including retries; existing sampling/privacy/quality/time targets unchanged. This does not approve implementation, any price, deployment or entire plan.
History: CEO U1 pending and final D48.1 B2 route remain historical records, now superseded for policy only; source root docs unchanged pending final approval.

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|---|---|---|---|---|---|
| D49 | user/eng | U1 actual-window finite budget policy | User Challenge resolved A | Human explicit answer | Hour needs≥32 windows; numeric spend still pending | Keep permanent30 / silent truncation / unlimited spend |

### Eng rerun Step 0 — scope preparation

Target docs/IMPLEMENTATION_PLAN.md retains the complete single-video MVP. File inventory again found no application, pyproject, tests, Git, CLAUDE.md or AGENTS.md; root documents and review artifacts remain only authored evidence. Reuse the current schema/manifest/attempt/admission design, SQLite and ffmpeg responsibilities, not a new service. Delta targets proposed config.py, ingest.py, attempts.py, schema.py, api.py, docs/configuration.md and tests/test_limits.py; complete MVP still exceeds8 future files and2 components. Autoplan P2/P5 keeps the current single Python package/app/worker structure, with no cuts or additional services. Source code/history not available is not runtime failure proof.

TODOS four groups remain deferred with existing dispositions. Distribution remains Mac/Linux local fixture and Nebius Linux real, dependency versions/cold-start/support unknown until D1; no SDK/billing platform/extra endpoint required by U1. Previously sourced SQLite WAL/ffprobe/FastAPI boundary evidence remains applicable, no new framework/concurrency pattern selected. No new research claim, model execution or paid call during this rerun.

### Eng invocation 2 amendment under D49:A

<!-- autoplan-baseline-edits:eng {"sourceSha256":"20353b35a8cfd4377f36c03aeae3f8f1f035d8cf2405a414f11fc546043bc340","replacements":[{"oldText":"**为什么粗标注只抽 8–16 帧**：1小时连续视频按120s/5s至少需要32次窗口调用，镜头切分可能更多；当前30次粗标注保护与完整小时索引冲突，U1待用户决定，预算不足预检拒绝。密集回看的成本与时延更高，需要实测。","newText":"**为什么粗标注只抽 8–16 帧**：1小时连续视频按120s/5s至少需要32次窗口调用，镜头切分可能更多；U1方向已按用户D49:A改为实际N＋已批准有限预算预检。具体额度未确认前仍保留30保护，费用未知/额度不足拒绝真实推理（E13），不截尾。密集回看的成本与时延更高，需要实测。"},{"oldText":"30个primary粗标注窗口；额外重试额度初值0，D1预算表冻结有限额度（E09），U1仍未决","newText":"实际N须在已确认primary调用/金额封顶内；D1实测后确认数值，确认前primary cap30；额外重试初值0（E13）"}]} -->

E13 precisely supersedes the prior fixed30/pending U1 clauses for current policy; history blocks remain verbatim. Numeric spend/measurement permission and entire-plan approval remain pending. Source docs unchanged.


### Eng invocation 2 Decision Audit Trail
| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|---|---|---|---|---|---|
| D50 | eng2 | E14 isolated bounded media preflight | Mechanical | P1/P5 | input processing is untrusted before probe | metadata-only limits / network refs |
| D51 | eng2 | E17 same-ID query control recovery | Mechanical | P5 | E02 states need protocol distinct from four answers | silent paid resend / fifth answer status |
| D52 | eng2 | E18 atomic owner/global approved budget | Mechanical | P1/P5 | concurrent requests must not overdraw last credit | client/config grant / unknown release |
| D53 | eng2 | E15 all allocation/start/idle fees | Mechanical | P1/P5 | approved budget covers actual deployment bill | infer idle free / HTTP timeout stops GPU |
| D54 | eng2 | E16 bounded 1:1 attempt scheduling | Taste C7 | P3/P5 | finite fair default simple for query+ingest | viable query-weighted2:1 surfaced gate |

### Phase 3 invocation 2 — Full review

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


### Phase 4 invocation 2 — Final synthesis

# /autoplan Review Complete — PENDING USER APPROVAL

计划保持通用单视频对话Agent全部MVP：摄取/ASR/视觉粗标注→混合索引→受控zoom/Agent→时间证据/JSON/追问。实现组织为FastAPI单应用、SQLite持久worker及独立模型服务，先真实可核对切片，再完整流程与评测；不把fixture当模型表现。

## Decisions Made

52个独立决策：44 Mechanical自动决定、7 Taste暂定、1 User Challenge已按D49:A解决；53项审计记录另含同一U1提出与human答复两条，不重复算新挑战。D50–54是本轮工程执行边界。最终整份计划仍待批准，费用/校准数值仍待D1明确确认。

## U1 resolution — human D49:A

2026-10-04用户明确选择A：实际完整窗口数N＋已批准有限primary调用/金额准入；确认具体额度前仍primary30、coarse额外retry0。连续3600s至少32窗，镜头可能更多，不能固定32即宣称所有小时可支持。未知计费/上界/权限、额度不足则拒绝真实推理；本次政策批准不授权具体收费或校准。E13覆盖历史C05/C16/G02/X06/E09的旧30永久/方向pending描述，其余原义务完整保留。

新Eng完整复核已完成：独立native4点（媒体隔离、GPU占用费用、公平调度、断线查询恢复）＋parent原子预算竞态均映射E14–18与29簇测试。小时性能/模型可用性仍待真实测量，政策冲突已解决，无新未答User Challenge，不再推荐重复B2。

## Your Choices — 七个暂定Taste

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


### Human final approval D55:A

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


## 2026-10-04 用户选定视觉与多轮交互补充

用户选择概念1「影像控制台」，明确输入必须是持续多轮对话，不能是一问一任务。桌面改为大幅视频左侧、持续对话右侧，输入固定在对话底部；保留原文与各轮证据，旧轮可独立回看，当前视频的新对话清空上下文。移动端切换视频与对话且保留草稿。视觉目标：docs/design-ideation-20261004/concept-01-multiturn.png。

当前只提前交付fixture前端与有限上下文脚本（中央→那后来呢→谁搬的）；最近12轮存在当前页面内。此实现不替代D10–12的真实查询改写/指代消解/锚点/澄清、持久session/generation与TTL验收，不变更模型/预算/媒体保护范围。原单视频多轮MVP目标保持。
