# TODOS

## AI Builder Cup（2026-10-11 增量）

- [x] 保留 NVIDIA/Nebius，增加 native Gemini provider、只读准备状态和明确媒体边界；本地 mock 合同验证，不是实跑验收。
- [x] 准备有界无状态 Cloud Run gateway、单持久后端容器与惰性配置模板；禁止 workspace 使用 Cloud Run 临时盘。
- [ ] 凭据/模型版本/有限校准及执行费用授权后，以真实短视频完成 Gemini 问答、追问与人工播放核对。
- [ ] GCP项目/有限资源开支授权后，验证容器、Linux解码隔离、持久盘、TLS、恢复与入口部署；本轮禁止启动GCP。
- [ ] 确认赛事接受分离式Cloud Run入口/GCP后端；准备英文deck、<3分钟真实演示和公开源码/部署URL，公开操作仍待用户授权。
- 详见 [AI Builder Cup准备](docs/AI_BUILDER_CUP.md) 与 [部署准备](docs/deployment.md)。原26项任务与小时级验收保持开放。

## V1/V2（来源profile.md既定范围）

### 多视频与复杂上下文

**What:** 多视频与复杂上下文。

**Why:** 扩展单视频之外的资产检索。

**Context:** MVP仅同视频；以video_id/generation/session契约扩展，不在当前30次预算问题未决时混入。

**Pros:** 扩展已证明核心能力。
**Cons:** 增加独立数据/部署与评测成本。
**Effort:** human XL / CC L
**Priority:** P2
**Depends on:** 单视频MVP与评测通过

### 身份关联与说话人分离

**What:** 身份关联与说话人分离。

**Why:** 可靠回答人物跨片段关联。

**Context:** 当前不能由衣着/代词猜身份；说话人归属不是ASR。需独立授权与评测。

**Pros:** 扩展已证明核心能力。
**Cons:** 增加独立数据/部署与评测成本。
**Effort:** human XL / CC L
**Priority:** P3
**Depends on:** 实体/说话人标注和隐私评估

### bbox、领域增强和公开开发API

**What:** bbox、领域增强和公开开发API。

**Why:** 满足后续空间定位及集成需求。

**Context:** 原V2可选功能；将开放API与内部MVP应用接口区分。实时流没有当前交付计划。

**Pros:** 扩展已证明核心能力。
**Cons:** 增加独立数据/部署与评测成本。
**Effort:** human L / CC M
**Priority:** P3
**Depends on:** 单视频MVP与真实需求

### 分布式运营/容量平台

**What:** 分布式运营/容量平台。

**Why:** 在实测并发超过单机时扩容。

**Context:** CEO扫描延后项：当前无10x用户负载证据，单应用+worker足够；触发条件GPU队列超SLO。

**Pros:** 扩展已证明核心能力。
**Cons:** 增加独立数据/部署与评测成本。
**Effort:** human XL / CC L
**Priority:** P3
**Depends on:** 可重复负载测量

## Pending live acceptance and follow-up

- 2026-10-05：评测CLI/模板和本机模型准备诊断已落地；真实基线/消融执行、raw/retrieval轨迹自动采集、四类八问真人标注与回放、1小时性能/费用及供应商停费证明仍待端点与有限数值授权。参见 docs/evaluation.md。
- CI按用户本轮要求延期；当前运行所有本地检查，后续可在独立授权范围补GitHub Actions，无需由本次交付推断部署授权。

## Completed

- 首轮浅色 Agent 工作台已完成技术验证，但用户拒绝视觉方向，已由下项取代。
- 2026-10-04：用户选择概念1影像控制台，已实现深色大幅视频与多轮演示会话、逐轮证据回看、上下文重置保护；见 design-qa.md。真实模型多轮/持久会话仍按原实施清单推进。

- 2026-10-04：概念1后续8项可用性发现已由 /design-review 修复（分支N/A，无Git）；详见 docs/DESIGN_REVIEW.md 当前有效报告。

- 2026-10-04：调查与多素材持久化、上传预检、私有播放、预算守卫下的真实摄取/多轮接口及 mock 集成已实现；初始仓库代码评审修复了任务生命周期、模型输入边界与前端异步恢复问题。真实模型质量、费用、性能及部署隔离验收仍待完成；见 docs/WORKSPACE_RUNTIME.md 和 docs/CODE_REVIEW_20261004.md。

- 2026-10-05：布局撤销/重做、多选/批量移动、命名对象分组、对齐/搜索/快捷键、Markdown/JSON/离线HTML报告、本机模型准备页面和离线评测框架已实现；验证与代码评审见 docs/LOCAL_TOOLS_REVIEW_20261005.md。
