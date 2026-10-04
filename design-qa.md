# FrameSeek 完整菜单与调查检查器 · 2026-10-04

final result: passed

## Findings

- [P2，已修复] 原图标栏只包含调查、素材、文档，工作区功能难以发现。增加可展开完整菜单与独立发现入口，分组连接现有功能；菜单显示实际调查名称、轮次和发现数量，支持Escape、外部点击和关闭按钮。source-findings.jpg → after-menu.jpg、comparison-navigation.jpg。
- [P2，已修复] 原问题详情把三段固定流程置于结论之前，证据图过小。改为问题／状态、继续追问、当前结论、未知项、引用画面、可展开依据的顺序；扩大文字与证据图，保留原结果及来源。comparison-context-detail.jpg、partial-context.jpg。
- [P2，已修复] 原发现面板是单一平铺列表，难以辨别类型及回溯来源。增加真实计数、类型筛选、时间排序、独立发现卡片、来源问题和回看动作。原集合、笔记、对照和导出继续工作。comparison-findings-detail.jpg。
- [P2，已修复] 点击发现来源后旧按钮离开DOM，键盘焦点落到页面。跳转后聚焦“当前问题”tab；菜单或图标入口打开面板也聚焦对应tab。browser-proof.json记录sourceFocus=inspector-context-tab。
- [P2，已修复] 扩大检查器后CSS变量覆盖收起状态，隐藏面板仍占344px。closed-inspector-first.jpg：画布右边1820、视口2164。为收起状态恢复更具体的宽度规则；closed-inspector-final.jpg：画布右边2164，面板display=none。已实际查看comparison-closed-inspector.jpg，展开仍恢复344px。

## Visual truth and evidence

- 视觉依据为用户标注的现有工作台；本轮仅修改菜单和两个检查器状态。源截图docs/menu-inspector-20261004/source-context.jpg、source-findings.jpg，原源码和旧QA报告保留在source-before/。
- 实现截图after-context.jpg、after-findings.jpg、after-menu.jpg。
- 源和实现均2164×1344像素，CSS视口2164×1344，密度1，无尺寸归一化。正式比较均双路径、6问题、3发现、首路径折叠、7/9可见对象，选择原问题01，素材栏收起、13秒暂停、同一分组和笔记。均主动适应视图；53%→52%是检查器296px→344px的授权变化。
- 已实际查看comparison-context.jpg、comparison-findings.jpg全图，以及comparison-context-detail.jpg、comparison-findings-detail.jpg、comparison-navigation.jpg细节配对。最初context实现截图意外为100%取景，已重拍52%同状态截图并重新查看配对，不以该取景差异判断视觉问题。
- 1200×800、密度1的小桌面验证见small-menu-findings.jpg；面板320px、菜单左64／右348／底739，筛选控件位于901–1180。输入右758、面板左880，未溢出。临时视口已重置，最终2164×1344。

## Required fidelity surfaces

- 字体：沿用本地Instrument Sans与中文系统回退。问题19px、结论13px、证据说明12px、辅助10px；与原17px问题／11px证据说明相比是本轮明确的可读性调整。长问题自然换行，来源按钮截断保留可访问名称。
- 留白：保留56px图标栏、60px顶栏、浮动输入和原画布。菜单284px且有最大高度；右侧344px／小桌面320px，20px内容边距，证据图112px／100px、12px间隔。面板内部滚动，关闭归还空间。
- 色彩：保留海军蓝、橙色与原灰蓝边线。结论及证据使用现有抬高面，partial保留暖色未知提示；没有改动画布图像或关系数据。
- 素材：原合成视频与0/6/10/13秒证据帧保持不变，16:9。菜单和发现使用Phosphor官方list／stack SVG，沿用现有MIT许可，没有生成素材、CSS绘图或伪造图标。
- 内容：原问题、答案、未知项、来源、分组和笔记保留；依据仍明确合成视频、预设匹配和未执行模型推理。菜单不新增未实现的账户／项目／设置页面，仍为当前页面会话。

## Primary interactions and validation

- 完整菜单打开／关闭、Escape归还焦点、外部点击关闭，素材入口双向切换，画布入口取景，问题／发现入口打开实际面板，菜单演示入口打开原演示库。
- 筛选证据显示2项、结论显示1项；按时间排序得到00:00／00:13。筛选不修改原集合或导出数据。
- 来源跳转选择问题06并聚焦对应tab；继续追问聚焦输入且保留测试草稿和正确上下文。
- 原生依据展开有3项，保留3段事件／4张证据与未确认项；回看13秒、两帧对照有2图、调查记录预览可用。
- 宽桌面收起／打开检查器及空间归还，小桌面菜单与发现筛选没有横向溢出。
- 最终预览保留原双路径示例、名称、3项发现、分组与笔记；菜单打开、发现面板可见，草稿恢复为空。
- 控制台错误[]，浏览器坐标与状态见docs/menu-inspector-20261004/browser-proof.json。
- 前端测试46/46通过，新增面板导航共享状态、筛选排序不改原集合、小桌面导航展开及焦点测试。npm run build、JavaScript语法检查、make check通过，记录见frontend-tests.txt、checks.txt。后端未修改，本轮未重复运行后端测试。

## Open Questions

无阻塞问题。真实模型、持久化和手机页面仍按原范围，不包含在本轮。

## Implementation Checklist

- 已完成菜单、问题详情、发现集合三处修改。
- 已完成同状态全图／细节对照、问题修复后复查及小桌面验证。
- 已保持本地服务与用户预览打开。

## Follow-up Polish

两帧对照仍使用先保存的两张证据；更多证据时可后续增加对照对象选择。本轮未穷尽8项全部长文本组合。


## 调查与素材工作流交付 · 2026-10-04

- 保留已选无限画布与完整菜单；新增调查库、素材库、自动保存状态、真实上传及重命名。
- 实际浏览器完成两份仓库合成视频上传、真实 FFmpeg 预检、名称修改及独立调查切换，未调用模型。两份上传样例用于管理验证，不能算两种模型质量样本。
- 原双路径调查恢复6轮、3项发现和笔记；刷新前后9张卡片坐标、画布视角、分组、笔记、findings tab、素材收起状态和13秒暂停位置逐项一致。证据见 `docs/workspace-20261004/refresh-proof.json`。
- 真实 Agent 的完整索引、多轮上下文、媒体归属、费用准入、幂等/pending/unknown/reset/取消仅在 mock transport 测试验证；部署校准和实测未完成。
- `make test`: 94 passed；`npm test`: 47 passed；`make check`与`npm run build`通过。测试隔离临时存储，不改运行调查。
- 截图：`docs/workspace-20261004/source-library.png`、`investigation-library.png`、`restored-canvas.png`。默认本机24小时TTL；无跨设备账户同步。
