# FrameSeek 调查工作台 · Design QA

final result: passed

本轮是用户批准的既有界面改进：从回答卡片画布，推进为视频、问题、独立证据、结论与记录联动的桌面工作台。不是通用 Agent 或真实视频检索验收。

**Comparison Target**

- 直接修改来源：`docs/workbench-refinement-20261004/before.jpg`，原页面真实捕获；同一18秒合成视频、三轮完整时间线、选中第三轮。
- 已选择的视觉方向参考：`docs/canvas-ideation-20261004/01-investigation-threads.png`。保留本地字体、海军蓝／橙色、真实视频帧、空间关系。用户批准常驻视频和检查器、独立证据与结论，因此区域排列变化属于本轮要求，不做原图排列的像素级复刻。
- Implementation: http://127.0.0.1:8765/
- 同状态新页面：`docs/workbench-refinement-20261004/timeline-final.jpg`。
- Before / after pixels: 2164 × 1344；CSS viewport 2164 × 1344，截图有效密度1，没有拉伸或裁切页面。
- Full comparison: `comparison-full.jpg`，4328 × 1344，原页面与改后页面同一输入中查看。
- 多对象迭代比较：`comparison-group-fix.jpg`，4328 × 1344，均为前后对比三轮、保存0秒／13秒证据和partial结论、同一笔记。
- Focused comparison: `comparison-details.jpg`，2140 × 445，发现区域与底部输入的联合比较；仅裁切QA细节，没有改动素材。
- 最终交付：`docs/workbench-refinement-20261004/final.jpg`，三轮问答、两帧证据、独立结论、分组和笔记，真实播放器约13秒暂停。

**Findings / Comparison History**

1. [P1, fixed] 多对象取景让证据卡片底部被输入框盖住。`grouped-first.jpg` 可见证据移除按钮位于输入下方。取景改为按工作台上方留白和底部240px空间计算；`grouped-final.jpg` 所有卡片底边最高1104px，输入顶边1133px，至少28px间隔。联合局部比较确认来源、移除与记录内容完整。
2. [P2, fixed] 问题到下方证据从右侧出线形成回弯，关系难读。先前截图有大回环和穿过节点附近的斜线。现在下方证据连接从问题底边至证据顶边，分组上方有清晰的三条来源线。`comparison-group-fix.jpg` 与最终截图确认。
3. [P1, fixed] 1200×800中检查器被浮动输入覆盖，选中卡片的追问操作也在输入下方。小桌面检查器打开时为其预留296px；新结果按真实输入位置计算可读缩放与取景。`small-desktop-final.jpg`：选中卡片底边565px、输入顶边589px；输入右边880px、检查器左边904px；卡片94%可读缩放。
4. [P2, fixed] 本地文件模式下固定素材缩略图不能继续可见。打开本地parcel.mp4实际验证：输入禁用、问答与发现0项、素材胶片display:none。返回演示恢复；没有将合成答案套到本地文件。
5. [P2, fixed] 原生拖入在当前浏览器未产生保存结果。改为指针捕获拖动，保留点击保存作为键盘路径；真实从右侧0秒引用拖到画布，出现finding-1、独立证据卡片与发现1。拖动不会同时误触视频定位。
6. [P2, fixed] 载入新调查后检查器可能保留旧页签和成功提示。会话epoch变化重置页签和提示，实体状态与页面一致。

无未解决P0/P1/P2界面问题。

**Required Fidelity Surfaces**

- Fonts / typography：Instrument Sans和系统中文。画布问题17px、答案14px／1.8；侧面主体12–17px，辅助标签9–11px。较小桌面主动显示所选卡片，完整概览为用户可选。长问题可换行；名称可编辑，分组名称与笔记是React受控输入。
- Spacing / layout rhythm：56px导航、304px素材区、296px检查器，主画布保留独立区域。侧栏使用分隔线与列表，问题、证据、结论保持独立对象；不是重复嵌套卡片。输入避开侧面板和所选对象。检查器可收起，素材可收起／恢复。
- Colors / tokens：继续海军蓝／橙色方向，工作区#101a24、抬高面#182633、线#2d4050、辅助#9aaebf。选中及时间保持橙色；独立证据偏深蓝、结论偏暖灰，partial结论保留待核实文字。
- Image quality / assets：没有新占位图或手工图像。MP4及0／6／10／13秒JPEG来自已有合成视频，比例16:9。对照使用真实0秒与13秒画面；本地Instrument与Phosphor SVG沿用。Canvas 2D边线和分组框表达实际对象关系和几何范围。
- Copy / content：查看范围、固定样例匹配和未确认项明确呈现来源；不模拟模型工作或实时推理。记录包括合成标记、时间、来源问题和未确认项。刷新清空会话的限制在发现页明确说明。

**Primary Interactions Tested**

- 原有三轮路径、旧卡片选择与范围同步、独立证据和partial结论保存／移除／重新保存；证据集合去重、8项上限、当前12轮限制有自动测试。
- 指针拖入、框选来源关联、按对象分组、调查／分组命名、笔记。
- 两帧对照弹窗、关闭、时间回看；点击13秒真实currentTime=13，来源问题保留。
- 调查记录弹窗完整显示内容，复制后真实提示“Markdown 已复制”。
- 原生dialog的Escape／焦点返回，检查器页签键盘箭头切换；减少动态偏好关闭进场动画。
- 本地文件只播放且禁止检索和预设证据；返回演示恢复。
- 1200×800和正常桌面，测试后viewport已恢复。浏览器错误日志为空。
- 83项Python测试、31项Node测试通过；ruff、格式与合同导出检查通过。React本地构建成功，不使用CDN。

**Follow-up Polish / Test Gap**

- 当前IAB自动化未提供Blob文件下载完成事件，不能确认文件是否落盘；记录预览与Markdown复制已实际验证。下载按钮发起浏览器下载并提供明确复制回退，不声称已保存。
- 手机页面、真实模型、上传／索引、跨刷新持久化均不在本轮。

**Implementation Checklist**

- 已完成上述可见问题修复、联合截图重检、主操作浏览器验证和必要自动检查。
- React源码为`frontend/workbench.jsx`，用`npm run build`更新本地包与内容哈希。原页面和旧QA报告已备份。
