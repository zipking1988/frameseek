# 通用视频对话 Agent — 系统架构

> 定位：**任意视频**上传后用白话对话检索与理解，输出带时间戳的结构化结果，支持多轮上下文。不限行业场景。
> 目标赛事：Nebius × NVIDIA Global AI Hackathon（提交截止 2026-10-30）
> 状态：架构v3，D55:A已批准；桌面调查/素材/Agent接口已实施，D1真实权限与预算校准待完成。实现与验收边界见docs/WORKSPACE_RUNTIME.md。
> 2026-10-11：用户另行授权 AI Builder Cup / Gemini 版本，同时保留 NVIDIA/Nebius 原路线，禁止本轮启动 GCP。新增路线的适用契约见下方“AI Builder Cup 增量”；下文原模型/云/权限条款继续约束 `nvidia_nebius`，不作为 Gemini 路线的模型或自托管要求。
> 当前解释规则：C/G/X/E保留评审时的原文；预算政策以E13–E18为准。D55:A已接受C1–C7默认选择并完成整体批准，历史“暂定/待最终门”不再是未答方向；具体付费数值仍未批准。

**权威版本声明**：本文件是技术契约的唯一权威来源。已按用户D55:A批准并同步完整C/G/X/E01–E18义务（2026-10-04）；评审过程保留于docs/IMPLEMENTATION_PLAN.md的Review record。数字预算未确认前仍执行E13–E18保护，批准计划不等于实现或性能通过。
`profile.md` 只做产品层概述，引用本文档时**使用章节名而非编号**（编号会漂移）。

---

## 0. 已核实事实与当前假设

### Token Factory JPEG 例外（2026-10-24）

用户明确批准 Nemotron 3.5 Super VL 本地聊天集成，以及把本机解码的 JPEG 发往 Token Factory；实际花额度前另行确认有限数字预算，禁止租 GPU。新增独立 `provider=tokenfactory`，默认不启用 `allow_tokenfactory_media`。唯一允许 origin/path 是 `https://api.tokenfactory.nebius.com/v1`，不跟随重定向；视觉仅 inline JPEG，禁止原视频/音频/远程媒体 URL。2026-10-24 实测公共端点每请求最多8图；该路线粗抽帧与回看遵守8帧上限并明确稀疏采样限制。原 `nvidia_nebius` 的自托管规则不因此扩大。视觉、规划、合成与生成式重排用指定 Nemotron，文本向量用 Qwen3 Embedding 8B 公共 API。保留两级预算、校准、unknown 不重发、代际与真实帧证据合同；不同 provider 必须重建索引。仅 mock 验证，不代表真实质量或费用验收。详情见 [本地准备](docs/TOKEN_FACTORY_LOCAL.md)。

### AI Builder Cup 增量（2026-10-11）

- runtime 增加显式 `provider=gemini`；省略仍为 `nvidia_nebius`。默认 `fixture`、schema0.1、四状态、拥有权/CSRF/Origin、CAS、代际、幂等、取消、有限预算账本和 unknown 不重发/不退款约束均不变。此授权覆盖代码与部署准备，不覆盖任何付费模型实跑、数字审批安装、GCP资源创建或公开仓库。
- Gemini 的视觉粗标注/回看使用本机有界解码的 JPEG 与实际帧ID/绝对时间，经明确 `allow_google_media=true` 后可发往唯一允许的 Google Gemini API HTTPS origin。原视频仍保存在私有后端；不用外链/Files API。该路线是原“媒体仅自托管”规则的已授权、明确限定例外，不扩大 NVIDIA/Nebius 媒体发送范围。
- Gemini 生成调用负责候选描述重排、文本规划与合成；向量由 Gemini embedding 生成。所有模型请求复用原账本/公平调度/有限调用预算，无 SDK 自动重试。视觉1FPS/128帧、120秒窗口/5秒重叠、最多3次zoom、最多1次repair仍保留。每次inline请求最多19MiB，输出4096tokens；embedding每批最多100完整窗口，超限在摄取模型调用前拒绝，不截尾，且禁止供应商静默截短embedding输入。
- 新索引 manifest 记录 provider，跨路线必须重建；旧无provider的manifest按 NVIDIA/Nebius 解释。Gemini 当前仅视觉，不提供 ASR/说话人/身份确认。字幕和可见文字属于视觉证据，不冒充音轨理解。
- Google Cloud 准备采用无状态 Cloud Run 入口 → 单 GCP 持久磁盘后端，入口不保存数据库、不运行worker、不持有模型密钥。使用 HTTPS、私有入口令牌、Secure cookie 与原拥有权控制；HTTP/1入口上传最多30MiB。不能把原 SQLite/WAL 与预算账本直接放入 Cloud Run 临时盘/NFS；workspace在Cloud Run环境拒绝启动。Linux隔离/费用/TLS/恢复/赛事平台符合性仍待实证。
- 实现/准备文档：[AI_BUILDER_CUP.md](docs/AI_BUILDER_CUP.md)、[deployment.md](docs/deployment.md)。mock 合同测试不证明 Gemini 质量、账单或部署；原小时级 NVIDIA/Nebius MVP/验收义务仍开放。

### 原 NVIDIA/Nebius 事实与假设

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
| 单次查询/完整部署成本 | 依据D1核对的计费形态：GPU分配/启动/加载/空闲/失败占用与停止余量＋全部模型token/请求＋存储，按E15/E18归集、避免重复计费 | TBD |

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

- G01：界面为单视频操作工作区：持续显示产品名、当前视频、可用通道与到期；桌面视频60%/问答40%（Taste C3），回答先结论后按时间排序事件行，行含描述、时间范围、证据图或原话、支持等级；JSON/技术详情次级可查看复制，支持等级解释为证据支持程度而非正确率。上传空页为主操作，显示实际输入限制/格式/语言/保留期，未ready解释为何不能问；fixture入口与每条演示结果持续标记，切回真实建立独立会话。验证首屏操作、长名称/转写、真实与fixture切换和证据直接回跳。
- G02：上传字节进度与服务端处理阶段区分，轻量客户端限制检查后上传，文件到达后做ffprobe/镜头/窗口预检。预算拒绝显示所需N与当前30次限制并可重新选文件，不裁剪/改上限；queued/probing/transcribing/captioning/indexing显示真实阶段与已完成段数，不编ETA。取消停止后续调度、保留已计费尝试记录，不承诺云请求撤销；刷新恢复同一任务，阶段失败保留素材并可重试同job。测试上传中断、预检拒绝、取消、刷新/崩溃恢复、重试不重计已完成阶段和ready前不可问。
- G03：按C02四status呈现：ok结论与证据；partial先已验证结果，再未确认事项及未检查范围；no_result仅成功查找无支持证据，显示本次检查范围/通道并建议换具体动作或台词；error说明本次未完成和重试/request_id，不得得出无事件。就绪视频持续显示缺失/静音/不支持/失败音轨等能力警告，相关问题旁重复原因；异常不清空历史已验证结果。测试每种状态、budget耗尽、语言和音轨缺失，不把未查完作为全视频无命中。
- G04：时间范围点击定位事件起点；证据缩略图定位证据绝对时刻；分别突出事件区间与当前证据位置，原音轨可复核。定位维持原播放/暂停状态（Taste C5）；显示加载、seek失败和重载，成功播报时刻且焦点留在触发按钮。到期或删除的旧回答标为证据不可用、禁止旧URI回跳与相关追问，重新上传须重新索引验证，不能自动恢复旧证据。测试两种seek、缓冲失败、过期/删除、静音与用户播放状态。
- G05：歧义追问保留原问题，展示已验证事件/时间候选供选择，不自动确认人物身份；建议追问采用可验证事件表述。“还有别的吗”列新增事件与本次范围，无新增不宣称穷尽；每会话只一条在途查询，提交按钮忙碌且保留下一问草稿，重置/换视频递增generation，迟到结果不插入新会话。重置与删除按钮区分，删除先说明媒体与关联会话清理后确认。测试歧义、快速双提交、草稿、迟到结果、重置、换视频和删除说明。
- G06：≥1024px两区，768–1023px视频上/问答下，≤767px单列，移动端不固定大播放器挡输入；320px、长内容、200%缩放无页面横向溢出。原生video controls；全部操作button/link，44px触摸目标，可见焦点/可见表单标签，语义landmark，aria-live polite播状态变化，错误说明可读且不抢输入焦点，时间轴有等价时间文本按钮；不用颜色作为唯一状态。验证键盘全流程、屏幕阅读器、触屏、视口与缩放；实际渲染后再确认对比与视觉质量。
- G07：轻量本地CSS变量和主题（Taste C4）：background #f5f7fa、surface #fff、text #17212b、muted #53616f、accent #006d77、border #c7d2da；IBM Plex Sans Latin UI/Noto Sans SC中文，许可打包或稳定fallback避免外部字体网络依赖，正文16px、辅助标签≥14px且对比≥4.5:1，间距4/8/12/16/24/32，按钮6px圆角。主题化焦点、选择、光标、visited链接与tabular时间数字，少量定位/状态过渡从可见内容开始且reduced-motion禁用；不用装饰渐变/发光/卡片拼贴。最终批准后写DESIGN.md，检验实际计算对比；HTML草图暂定且未批准，不算图片或像素验收。

- X01：提供三步本地fixture快速开始：获取源码/读说明后make setup、make demo、打开输出URL提问与证据回跳；命令输出持续MODE=fixture，不依赖GPU/外部模型付费调用，缺ffmpeg仅阻止real。实际支持Python由D1验证并固定，缺前置条件显示版本/安装文档。完整计时包含源码获取、阅读、前置条件、安装和首次标记演示问答/seek；目标2–5分钟未测，缺Python/网络影响记录，不截为warm命令时间。real独立setup→配置→preflight→worker/app→真实smoke，账户/配额/镜像/权重加载时间全部计入，unknown不得宣称5min或用fixture代替；不自动real失败降级fixture。至少Mac/Linux各一次冷启动记录，作者自测明确标记，无产品遥测或自动上手release gate。
- X02：冻结既定公共接口：POST /api/session随机主体cookie+CSRF；POST /api/videos multipart Idempotency-Key返回202 video_id/job_id/generation（仅建任务），GET /api/jobs/{job_id}阶段/真实进度/capabilities/errors；POST /api/jobs/{id}/retry与/cancel合法状态才受理；POST /api/chat含video_id/session_id/generation/request_id/question返回同步最终响应；POST /api/chat-sessions/{id}/reset新generation；GET /media/{video_id}/…拥有权/Range/到期检查；DELETE /api/videos/{id}幂等墓碑+异步清理进度。Agent内部retrieve/read_segment/zoom/asr_search不作为公共用户接口；轮询2秒起、错误退避至10秒尊重Retry-After，有最大等待和明确停止。提供完整curl cookie jar与CSRF示例、类型/OpenAPI、重复请求/失效主体/ready前/跨主体/取消重试测试；不新增SDK或公开API产品范围。
- X03：errors对象冻结code/stage/message/cause/retryable/suggested_action/docs_url/request_id，未知cause显式unknown，problem+cause+fix+有效本地文档入口。覆盖预检/预算/语言通道/模型超时/repair失败/非ready/expired/deleted/限流；HTTP输入400/422、认证401/403、不存在404、未ready409、到期410、限流429、无有效证据的模型失败502/504；no_result和有有效证据partial为200。四status原C02保持，错误例与响应在首个0.1冻结版本同步，无内部路径/密钥/思维原文/用户原文日志。测试每类状态映射、retryable/错误目录链接、repair一次、超时预算计数，不能隐含自动重试云视频请求。
- X04：D1随包配置写README/快速开始，D2–3随切片写完整教程，D4–12随功能写API/配置/错误，D21–24完成部署/评测/材料校对。docs/getting-started.md、api.md、configuration.md、errors.md、evaluation.md、deployment.md与README目录形成可找到的参考；浏览器查找即可，不新建文档站。提供可校验四status、score/level互斥、通道降级、语言、任务生命周期fixture和原视频seek例子；命令/例子全部运行校验，未实现输出标proposed。CHANGELOG/CONTRIBUTING与错误报告指南随公开提交物，实际许可/归属/媒体权利发布前核查，不宣称已开源或成熟社区。
- X05：记录应用版本、schema0.1、SQLite迁移版本、index_generation、模型revision/采样配置hash；兼容索引才能读，不兼容显示重建要求。模型/config变化新generation构建并原子发布，迁移升级先停止新任务、事务迁移和备份必要状态，失败回滚；删除/到期禁读名单不能因回滚复活。首次冻结前补全schema并CHANGELOG，之后破坏契约须版本/迁移说明，当前无已发布客户端不新增codemod。测试索引版本不匹配、迁移失败回滚、到期与回滚交错，不能自动覆写索引或恢复已删除媒体。
- X06：本地CPU服务/fixture基础依赖与LinuxGPU推理额外依赖分开锁定，make test/eval-fixture不付费、eval-real须显式配置和preflight，Mac/Linux支持由D1验证，Windows未知不宣称。配置优先env>配置文件>默认、密钥仅env，preflight输出脱敏最终配置/来源/单位/合法范围；scene阈值0.3、coarse_frames12可8–16、candidate_k10/rerank_k5、TTL24h可配置为待实测默认。120s/1FPS/128帧和当前30粗标注/3zoom保护硬校验，U1不能普通config绕过。受限adapter类型+mock支持已授权模型替换，debug只授权开发模式，部署不默认公开debug；测试config优先/边界/无密钥fixture/硬限制拒绝/示例adapter与独立fixture-real评测。

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
