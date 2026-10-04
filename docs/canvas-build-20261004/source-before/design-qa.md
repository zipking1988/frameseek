# 影像控制台与多轮会话设计 QA

2026-10-04。用户选定概念1，并要求多轮；本报告评价选择稿的实现与可操作性，不替代用户审美认可或真实模型验收。

## Comparison target and evidence

- Source visual truth: `/Applications/MAMP/htdocs/frameseek/docs/design-ideation-20261004/concept-01-multiturn.png`，1487×1058px，无浏览器边框。
- Implementation: `http://127.0.0.1:8765/`；截图 `/Applications/MAMP/htdocs/frameseek/docs/design-ideation-20261004/desktop-final.jpg`，1487×1058px；CSS viewport 1487×1058，devicePixelRatio=1。源与实现等像素比较，无密度缩放。
- State: 包裹中央问题→「那后来呢？」；两轮完整记录；暂停在00:13，第二轮及该轮证据选中。当前素材是合成演示，回答/追问为固定脚本。
- Full-view: source和desktop-final由同一次工具调用作为两幅图片输入，比较大区域比例、文字、色彩和素材。早期 desktop-first 是1440×1024，比例近似，仅用于发现内容密度问题，不以尺寸差异作为缺陷；desktop-second与final均为源的原尺寸。
- Focused inspection: 最终等像素图片中，右侧 x1006–1487 的问题/答案/来源标记、下方composer，以及左侧品牌/视频标题/帧标签均能直接读清；在同一比较输入中重点查看这些区域。无需另存放大裁切，避免把浏览器裁切接口返回的空画面当作有效证据。
- Responsive captures: `docs/design-ideation-20261004/mobile-chat.jpg`、`mobile-video.jpg`（375×812）；`tablet-chat.jpg`（768×1024）。这些是实现的适配验证，来源稿没有对应手机设计，不宣称手机逐像素匹配。

## Findings and comparison history

1. **[P1, fixed] 两轮记录挤出首屏。** desktop-first默认展示状态、范围、全部帧、复制与结构化入口，且常驻示例占用输入上方空间；源稿同时显示两轮。修复：开始会话后收起全局示例；默认只显示首帧，额外证据/引用/JSON/建议追问进入可展开区；去掉重复桌面素材上下文。desktop-second仍截掉第一问，暂不通过；进一步缩小证据、调整间距并保留18px正文，desktop-final两轮完整可见，chat scrollTop=0。
2. **[P2, fixed] 手机视频展开时后方输入仍在辅助技术树中。** 先前移动验证中AX仍暴露被盖住的composer。修复：仅在手机视频视图隐藏chat-content与composer-area；返回按钮仍可达，草稿保留。后续AX只含素材区与返回入口。
3. **[P2, fixed] 1px额外页面滚动。** 初始手机截图出现整体滚动条，root scrollHeight比viewport高1px。修复：状态提示sr-only定位到top/left=0。最终手机rootHeight=812、viewportHeight=812，没有额外页面滚动。
4. **[P2, fixed] 手机展开入口缺少折叠指示。** 增大summary点击范围时使用flex移除了原生marker。修复为list-item与44px点击高度；最终mobile-chat能看见原生折叠箭头。

最终没有未处理的P0/P1/P2发现。下述差异明确接受为实现约束，不代表逐像素复刻：

- 使用原生video控制条及实际时间线，保留浏览器播放/全屏能力；控制条外观与生成稿不同。
- 不加入未实现的设置/素材库路由；「素材」打开实际本地文件。用户文字标签取代生成稿的装饰头像，不伪造人物。
- 下方保留全部3个合成片段，便于任意定位；生成稿只展示2张选中相关帧。
- 输入为空时发送按钮禁用；不会因为来源稿画了亮色按钮就伪造可提交状态。
- 生成的仓库素材保持相同机位/工具/灯光/包裹；实际三种位置约31%/50%/67%，不冒充源图的精确坐标或真实搬运动作。

## Required fidelity surfaces

- **Fonts/typography:** 本地Instrument Sans，系统中文回退；品牌38px/750、素材30px/650、对话25px/650、答案18px/1.6、输入16px。接近源的粗品牌与清晰正文；两轮问题/答案均不截断，次要元数据为10–14px，保留较弱层级。完整跨平台字形与200%缩放未验收。
- **Spacing/layout:** 84px顶栏、72px窄栏、约32%右侧会话；左侧影像主导，右侧固定composer、记录独立滚动。主边距24px；最终同尺寸两轮完整可见；375/768/1440/1487均未检测到横向溢出。
- **Colors/tokens:** 深蓝#111f2b、抬高面#1c2d3b、边线#344a5d、浅字#f1f4f7、辅助#a7b8c8、橙#ff702e；重点落在证据与当前轮次，partial保留独立暖色说明。没有亮色SaaS卡片墙。
- **Image quality/assets:** 原始生成图片1672×941，MP4实际1600×900，比例保持；JPG证据从同一视频提取。仓库/工作台/封箱包裹符合来源方向。没有代码绘制的仓库、伪图像、手绘SVG或文字图标；UI图标来自Phosphor官方MIT库，字体OFL均随包保存。
- **Copy/content:** 「视频对话」「新对话」「继续聊这段视频」符合持续会话。保留真实提交原文「那后来呢？」与预设追问来源。未接入问题不伪造结果，unknown保留草稿；身份无法确认明确列出。合成素材与预设来源持续可见。

## Primary interactions and validation

- 两轮→第三轮「谁搬的？」承接最新包裹话题，显示partial与未确认身份。
- 点击旧轮00:06：time=6、paused=true、选中旧轮，触发按钮保留焦点。更多证据中的00:10，播放时time约10.34、paused=false。
- 未知问题保留输入不追加回答；切换叉车话题后「那后来呢？」不沿用旧包裹上下文；新对话后同追问提示先完整提问。
- 固定失败样例追加后保留旧轮，no_result与error独立。
- 本项目合成MP4模拟本地文件：blob播放、输入禁用、旧轮清空，返回演示恢复；没有读取个人文件。
- 手机视频/对话切换保留草稿，后方控件隐藏；原生焦点、button/label/details、aria-current/pressed和polite状态提示保留。
- 最终浏览器warn/error日志为空。后端82项测试；Node原6项＋新5项通过；ruff/format/schema一致性通过。原测试与CI未修改。
- `/health`: mode=fixture、real_ready=false、model_requests_sent=0、gpu_resources_started=0。

## Implementation checklist

- [x] 选定方向与多轮输入落地，来源稿/旧源码保留。
- [x] 逐轮证据回看、有限上下文、重置与话题保护。
- [x] 生成素材编码与证据提取，同源时间校验。
- [x] 实际浏览器、手机/平板、控制状态与回归验证。
- [x] README/DESIGN/预览记录同步；真实模型验收继续原计划。

## Follow-up polish and limits

P3：不同浏览器原生控制条外观与源稿仍会不同。真实模型通用多轮、持久会话/恢复、完整屏幕阅读器、系统软键盘、跨浏览器与缩放验收仍属于后续实施，当前交付不宣称完成。

final result: passed

## 2026-10-04 后续 design-review

当前概念1已修复8项可用性问题，来源字号12px、入口44px、手机焦点恢复、首轮入口分组、长文件名换行、正确追问恢复提示及发送图标对比度。新增4项回归；82个Python与15个Node测试通过。历史截图仍用于已选概念参考，当前实际图及完整证据见 /Users/zip/.gstack/projects/frameseek/designs/design-audit-20261004/135757-multiturn-review/design-audit-localhost.md。真实MVP验收与外部独立评审未由此替代。
