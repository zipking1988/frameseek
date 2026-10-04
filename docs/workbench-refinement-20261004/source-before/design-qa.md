# FrameSeek 桌面调查画布 · Design QA

final result: passed

本轮范围为用户选择的第1张桌面画布方案及其交互实现。不是完整真实视频Agent验收。

**Comparison Target**

- Source visual truth: /Applications/MAMP/htdocs/frameseek/docs/canvas-ideation-20261004/01-investigation-threads.png
- Implementation: http://127.0.0.1:8765/
- Screenshot: /Applications/MAMP/htdocs/frameseek/docs/canvas-build-20261004/qa-final.jpg
- Source / implementation: 1487 × 1058 pixels，CSS viewport 1487 × 1058；截图有效密度1，无缩放或裁切整屏证据。
- State: 三轮真实UI操作，中央→那后来呢→谁搬的；选中第二轮13秒证据，播放器暂停约13秒，输入草稿「谁搬的？」。
- Canvas internal view: 93% 自动取景（是产品交互状态，不是截图密度归一化）；100%可恢复。
- Full-view joint comparison: /Applications/MAMP/htdocs/frameseek/docs/canvas-build-20261004/comparison-final.jpg，左为选中方案，右为实际浏览器。
- Focused joint comparison: /Applications/MAMP/htdocs/frameseek/docs/canvas-build-20261004/comparison-detail.jpg。原图和实际画面的第二轮问题、答案、证据图、橙色状态与追问入口并列检查，使用原始像素裁切，未放大模糊小字。

**Findings / Comparison History**

1. [P1, fixed] 证据浮窗遮住第三张卡片。首轮 comparison-first.jpg / qa-first.jpg 显示浮窗延伸至第三轮问题和答案。修复：播放器移至右上80px，限制高度370px并保留内部滚动；关系布局把第三轮向下错开，整理时收起播放器。qa-final.jpg 联合对比确认三个问题与答案均可见。
2. [P2, fixed] 卡片密度使第三轮底部和输入重叠。首轮截图显示下方卡片被浮动输入遮盖。修复：压缩重复来源行及次级间距，未确认详情进入展开区，适应视图为底部操作预留空间，输入宽度660px。最终图保留主体、证据、直接追问与引用入口，各区域可操作。
3. [P1, fixed] 1200×800桌面输入遮住第二轮「谁搬的？」按钮，点击无法进入第三轮。small-desktop-before.jpg / 本轮AX显示只生成2轮。修复：较矮桌面新结果采用88%可读比例并取景当前卡片；small-desktop-after.jpg及AX显示完整3轮，第三轮追问按钮位于输入上方。其余卡片可平移回看。
4. [P2, fixed] 播放后时间提示仍陈述先前seek时的暂停状态。修复：timeupdate、play、pause更新实际时间与播放状态；本轮约13.17s的暂停状态与可见时间一致，不将证据选中等同于一直停留在证据时间。

最终无未解决的P0/P1/P2设计差异。

**Required Fidelity Surfaces**

- Fonts / typography: 本地Instrument Sans加系统中文，问题19px、答案16px、主操作13px。源图粗细与层级保留；联合局部对比确认问题与结论可读。主体随画布93%缩放约14.9px，窄桌面88%约14.1px。生成图中的「回答」行在真实产品中保留FrameSeek来源，顶部持续声明预设演示。
- Spacing / layout rhythm: 全幅空间画布、左上素材、小工具栏、三张错开卡片、实际追问连线、右上证据播放器、底部浮动输入，与选中结构一致。为直接追问、引用展开和真实视频控件增加少量高度，属于功能实现带来的有意差异。没有手机版流程。
- Colors / tokens: 使用已有海军蓝、抬高面、灰蓝边线、白色文字与功能橙。选中卡片和当前引用保持橙色，输入焦点和按钮焦点可辨识，发送箭头为黑色。背景保持纯色，不用代码伪造源图装饰网格。
- Image quality / asset fidelity: 使用真实合成MP4及其0、6、10、13秒JPEG帧，比例16:9，无拉伸、占位图或虚构人物。源图对仓库图的生成改写不作为视频事实；第三轮实际证据13秒，未复制生成图虚构的16秒帧。官方Phosphor图标与本地字体保留，连线为实际父子轮次的功能图形数据。
- Copy / content: 当前问题、时间范围和真实预设回答保持一致。「无法确认搬运者」可见；顶部明确无模型调用。本地素材明确未索引，问答不可用。界面名称改为调查画布，与用户批准的结构一致。

**Primary Interactions Tested In Browser**

- 空态示例→第一轮→卡片建议「那后来呢？」→「谁搬的？」：三轮生成并保留各自证据。
- 选中第一轮后输入「看看证据」：新分支返回中央00:05–00:11而非最新的右侧，证据不串轮次。
- 鼠标拖动卡片（位置变为约176.25,214.53），方向键再右移10px；真实DOM位置更新。
- 空白处拖动：plane变换更新，卡片及连线一起平移。
- 视频时间整理：中央两轮先于右侧两轮；问题内容不改变，父子关系仍保留。追问关系整理已在最终源码重载后通过UI复验。
- 放大/缩小、适应视图可操作；纯模型测试覆盖缩放中心不漂移、负坐标取景及12轮链全局适应。
- 点击第二轮13秒证据：真实video.currentTime=13，保持暂停；播放/暂停后约13.17且readyState=4。浮窗显示对应问题；关闭后恢复原证据焦点，草稿「保留这段追问」保留。
- 不支持的问题保留原草稿和4张卡片，没有模型调用或假回答。
- 打开仓库合成MP4作为本地文件：卡片清空、输入禁用、显示未索引；返回演示恢复空态，旧问题上下文清空。
- Codex IAB console warn/error查询为空。本轮没有通过浏览器读取隐藏应用状态、改变DOM或注入测试操作。
- 桌面viewport：1487×1058、1200×800；默认2164×1344检查空态和多轮画布。临时viewport在交付前复位。

**Validation**

- Frontend: node --test，20 passed / 0 failed，日志 docs/canvas-build-20261004/frontend-tests.txt。
- Backend: make test，82 passed。旧首页文案断言更新为当前调查画布名称，fixture健康与schema边界不变。
- make check：Ruff lint、59文件格式、契约导出一致。

**Intentional Constraints / Follow-up Polish**

- 这是现有项目中的桌面界面改版，没有新建另一套项目或引入后端模型请求。
- 预设演示、真实上传/索引未接入；最近12轮只属于当前页面，刷新清空。自由拖动可以手动形成空间分组，未实现命名群组、多选比较、协作或持久化，不声称这些能力已交付。
- [P3] 原图更宽的输入框、细网格和不同的浮窗原生控件不逐像素复制；当前保留所选空间结构和既有视觉系统，以不遮挡操作为准。
- 本轮不是跨浏览器、完整读屏、真实手机或真实模型验证。既有fallback单测不等于手机产品交付。

**Implementation Checklist**

- [x] 选中方案1，沿用已选品牌语言和真实素材。
- [x] 卡片问答、明确上下文、证据播放器、拖动、平移、缩放、整理和重置可用。
- [x] 完成同视图整屏与局部联合对比，修复P1/P2并复验。
- [x] 前后端检查完成；本地预览持续运行。


**评审演示库追加验证 · 2026-10-04**

- 新增6条路径：位置追踪、完整时间线、前后对比、多主题分支、反向核查、无结果与恢复；共17个预设问题。每个入口实际载入3轮，旧画布被替换，角色与状态正确。
- 真实UI验证：选中根卡片再追问胶带，生成第4轮；点击结束证据，播放器currentTime=13，保持暂停。无结果、失败、恢复在独立三轮中分别显示no_result/error/ok；恢复是载入已有预设结果。
- 1200×800初始关系排列只有40%，文字过小。修复：预设默认横向展开，分支87%、最多证据的时间线73%；卡片底边565px，输入顶边572px。全局连线保持原父轮次，跨卡片路径从上方绕行。
- 原生dialog六个入口完整可见；Escape关闭后焦点回到演示库入口。较小桌面测试完成后已恢复默认viewport。浏览器错误日志为空。
- backend83项、frontend24项通过，ruff和契约导出检查通过。证据与日志位于 docs/demo-library-20261004。
- 范围：使用同一个18秒合成素材探索不同调查方式；不代表多个真实领域的视频样本或通用模型能力。
