# 通用视频对话 Agent — 系统架构

> 定位：**任意视频**上传后用白话对话检索与理解，输出带时间戳的结构化结果，支持多轮上下文。不限行业场景。
> 目标赛事：Nebius × NVIDIA Global AI Hackathon（提交截止 2026-10-30）
> 状态：架构 v3（事实与假设分离，待实跑校准）

**权威版本声明**：本文档是技术契约的**唯一权威来源** —— 包括 输出 schema、模型职责、窗口硬约束、结构化提取流程、评测口径、数据流与隐私。
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
│  5 验证：证据不足 → 扩窗重试（上限 3，仍须 ≤120s）       │
│  6 合成：结构化 JSON + 白话回答 + 引用                   │
└───────────────────────────────────────────────────────┘
```

**为什么粗标注只抽 8–16 帧**：全视频密集标注对 1 小时视频 = 30 次全量 Omni 调用，成本与时延都不可接受。粗扫便宜、密集只在候选段上做 —— 这是当前方案在**成本、时延与精度之间的主要平衡策略**。后续可引入分层采样、多级粒度索引、查询驱动的动态索引等策略。

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
6. **输出阶段合并重叠区事件并去重**（按 `support_score` 取高者）。

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
3. 结果按时间合并，重叠区事件去重（取 `support_score` 高者）；
4. **绝不把超长片段直接发给模型** —— 否则直接违反 F1；
5. 扩窗重试同样受此约束，且**单次查询子窗口数上限 3**。

### 3.3 多轮上下文状态

| 状态 | 内容 |
|---|---|
| `turns[]` | 原始对话 |
| `resolved_query` | 每轮由 Ultra 改写的独立查询（去指代） |
| `entity_memory` | 已提及的人物 / 物体 / 事件 → id + 属性 + 首次出现时间戳 |
| `visited_segments` | 已看过的段（避免重复烧钱，也支撑"还有别的吗"） |

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
  "followups": ["他之后去了哪里？", "同一人还出现过吗？"],
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
- **无 ASR 时** `evidence_coverage` 仅按视觉证据计算，**不补默认值**（静音视频本就该拿低分）。
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
| 粗标注 GPU 时间 | `视频时长 / 窗口长度 × 单次 Omni 调用耗时` | TBD |
| zoom GPU 时间 | `子窗口数 × 单次耗时` | TBD |
| 存储占用 | 证据帧 + 向量 + 索引 + ASR 转写 | TBD |
| 单次查询成本 | `GPU 时间 × 计费单价 + Token Factory token 成本` | TBD |

### 7.2 预算阈值与临时保护（★ 决策依据）

金额上限待 Nebius 配额与单价确认后填写；**在此之前以调用次数上限作为临时保护机制**：

| 项目 | 暂定上限 |
|---|---|
| 单小时视频最大 Omni 调用数 | 30（粗标注）+ 重试上限 |
| **单次查询最大 zoom 子窗口数** | **3** |
| **最大扩窗重试次数** | **3** |
| 单小时视频索引成本 | 待配额与单价确认 |
| 单次查询成本 | 待配额与单价确认 |

成本控制杠杆（按优先级）：粗标注抽帧数 → zoom 子窗口上限 → 候选 k → 缓存命中率 → 窗口长度。

---

## 8. 排期（10/03 → 10/30，27 天）

> 关键改动：在 D2–3 插入**垂直切片里程碑**，先拿到可展示的最小闭环，再横向扩展。

| 天 | 任务 | 出口 |
|---|---|---|
| **D1** | 环境、权限、**Omni 与 Cosmos 访问权限同步确认**、Token Factory 目录核对 | Nebius 可跑；明确 Cosmos 是否已授权 |
| **D2–3** | **垂直切片**：单窗口 → ASR / Omni → 结构化 JSON → 播放器跳转 | **GO/NO-GO 闸门** |
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
| 4 | **时间竞争**（若 10/15 另有 GCP 场提交） | 实际只剩约两周 → 砍掉前端打磨与聚合特性，只保垂直切片 |
| 5 | **中文能力未实测**（F9） | 与 GO/NO-GO 同测；若弱，demo 走英文、中文作为能力声明 |
| 6 | **成本失控** | §7.2 调用次数上限 + `visited_segments` 去重 + 缓存 |
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
