# FrameSeek sports landing — 2026-10-29

final result: passed

The later local English judge rehearsal verified the exact preset center question,
its contextual English follow-up, replay at 00:06 and 00:13, and restoration after
refresh. The landing page now links to the English guide. These checks sent zero
FrameSeek model requests and do not establish a live sports judge flow. The private
2:20 narrated review cut and its publication limits are recorded in
[HACKATHON_VIDEO.md](docs/HACKATHON_VIDEO.md).

## Findings

- [P2, fixed] The first hero crop brought the ball into the navigation. The image
  now starts 68px lower inside the clipped hero. The heading/body gap and primary
  button width also match the selected composition more closely.
- [P2, fixed] Initial question headers were too wide, evidence images too tall,
  and question/evidence relationships were missing. Narrowed the headers, increased
  pane padding, changed evidence crops to 1.85:1 and added Canvas 2D links derived
  only from each sample question's actual evidence elements. Post-fix comparison
  shows the intended hierarchy and connections.
- No actionable P0/P1/P2 findings remain in the checked states.

## Source and implementation evidence

The user selected the **first displayed generated image** from this conversation's
three concepts. Visual truth: `docs/sports-landing-20261029/selected-option-1.png`.
Implementation: `http://127.0.0.1:8781/`, screenshot
`docs/sports-landing-20261029/desktop-final.png`.

The source is 946 × 1663 pixels, proportionally normalized to 1440 × 2531 for
comparison. The implementation is 1440 × 2650 pixels at a 1440 × 1000 CSS viewport,
density 1. Its additional 119px comes from the explicit illustration disclosure
and compact footer. No image was stretched non-proportionally. Both captures show
the default Questions tab, 05:10 shot illustration selected, sequence paused.

Full-view comparison actually opened: `comparison-final.jpg` (2880 × 2650).
Focused comparisons actually opened: `hero-comparison-final.jpg` (2880 × 928)
and `workspace-comparison-final.jpg` (2880 × 858). Each contains the normalized
source on the left and browser-rendered implementation on the right. Focused
views were necessary to assess headline wrapping, player framing, card density,
icons and relationship links.

Additional evidence in the same folder: `canvas-preview.png`, `desktop-1200.png`
(1200 × 2339 at a 1200 × 900 CSS viewport), `narrow-390.png` (390 × 3076 at a
390 × 844 CSS viewport), `narrow-preview.png`, and `workspace-entry.png`.
The narrow page is responsive marketing, not a new mobile application.

## Required fidelity surfaces

- **Fonts/typography:** existing local Instrument Sans is loaded; no substitute
  webfont. Hero uses approximately 125px/750 at 1440px, tight tracking and two-line
  wrapping; body approximately 28px. Navigation, labels and evidence use the same
  family with smaller optical weights. Primary copy stays readable and unclipped.
- **Spacing/layout:** retained the large right-side athlete, left-aligned headline,
  two-line evidence statement, wide source-and-questions preview and three-column
  workflow. Desktop margins are 72px in the hero and 48px around sections. The
  1200px layout retains the desktop split; 390px stacks the preview and workflow
  without horizontal overflow or hidden persistent controls.
- **Colors/tokens:** navy `#0b1c28`, functional orange `#ff702e`, light text
  `#f1f4f7`, muted bluegray `#a7b8c8`, fine bluegray rules. Focus rings and selected
  frames use orange. No synthetic CSS imagery or decorative gradient substitutes.
- **Images/icons:** four individually generated basketball photographs match the
  selected lighting and subject. JPEG assets preserve their proportions and have
  no obvious compression defects. Existing official Phosphor icons retain their
  license. The source-like frames and timestamps are explicitly illustrative;
  no private video or real-player identity was used. Camera framing differs
  slightly from the original generated mock, which is acceptable regeneration
  variation. See `assets.md` for dimensions, paths and prompt art direction.
- **Copy/content:** preserves the selected hero and evidence-first framing.
  Unsupported statistics, athlete recognition and coaching guarantees are absent.
  The page explains that its sports preview is illustrative and the actual
  workspace starts with the existing labeled synthetic demo. Uploaded-video
  analysis still requires configuration. Nothing implies live acceptance passed.

## Interactions and accessibility checked

- Header/hero workspace CTA reaches `/workspace`; existing upload, source player,
  conversation/canvas controls and synthetic-demo labels render there. The brand
  link returns to the landing page. No storage migration or ownership change.
- How it works navigates to `/#how-it-works`; workspace navigation targets the
  preview section. All primary CTA links use the same-origin workspace route.
- Clicking the pass evidence changes the player image to `pass.jpg`, caption and
  selected thumbnail to 05:03. Native range Home then ArrowRight selects the same
  frame. Sequence playback advances and stops automatically at its final frame.
- Questions/Canvas switches show the corresponding panel; ArrowLeft from Canvas
  selects Questions and returns keyboard focus to its tab.
- Semantic controls, accessible labels/alt text, visible focus styling, native
  range keyboard behavior and reduced-motion CSS are present. Headline, CTA and
  preview controls remain usable at the checked narrow width. No external
  accessibility audit or exhaustive zoom/browser matrix is claimed.
- Browser console checked: no entries. Visible images at 1200px all loaded;
  document and viewport widths matched at both 1200 and 390px.

Recorded interaction evidence: `browser-proof.json`. Final isolated preview health
reports fixture mode and **0 FrameSeek model requests**; `verification.json` records
the result and current CSS/JS hashes. Promotional images used built-in ImageGen,
separately from FrameSeek's provider/budget path.

## Comparison history

1. `comparison-first.jpg` and `hero-comparison-first.jpg`, using
   `desktop-first.png` (1440 × 2660): blocked by the two P2 findings above;
   contemporaneous details in `review-first.md`.
2. Applied hero positioning, spacing, evidence proportions and actual relationship
   rendering fixes. Recaptured `desktop-final.png`; opened the combined full,
   hero and workspace comparisons above. No blocking drift remained.

## Validation and limits

- `npm test`: 209 passed.
- Focused backend API/gateway/workspace regressions: 27 passed.
- `npm run build`, `make check` (Ruff lint/format and schema drift), JavaScript
  syntax and `git diff --check`: passed.
- Public-page regression checks that `/` does not set a session cookie, retains
  a working `/workspace` link, serves the four illustration assets, leaves private
  investigation access unauthorized and dispatches no FrameSeek model request.
- Preview uses a separate ignored workspace and one API/worker process; the
  already-running private workspace was not restarted or migrated.
- Local implementation only. No push, deployment, cloud provisioning, budget
  approval or live sports-recognition validation was performed.

## Open questions

No blocking design question. Publishing was not requested.

## Implementation checklist

- Selected direction implemented in the existing FastAPI/static project.
- Landing CSS/JS receive content hashes from the existing frontend build.
- Browser comparison, primary interactions and smaller layouts checked.
- Original workbench, session/CSRF/ownership and provider boundaries preserved.
- Local preview remains running for review.

## Follow-up polish

P3: future marketing material could use rights-cleared footage from a real sports
investigation. The current generated sequence is intentionally an illustration.


---

<!-- Earlier reports retained below without modification. -->

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

## Conversation reading view — 2026-10-28, selected displayed option2

Source: `.frameseek/reading-view-20261028/selected-design.png` (1629×966).
Implementation: local127.0.0.1:8765, existing authenticated basketball desk.
First same-size comparison: `.frameseek/design-audit-20261028/comparison-01.png`.
The model's actual saved response and real source images are retained; fabricated
mock chat exchanges/player metadata are intentionally not copied into product data.

First-pass findings (blocking): P1 the resized viewport leaves current evidence
under the floating composer; P2 default source column is narrower than reference;
P2 context chip floats outside the composer rather than belonging to its form.
The initial default inspector duplication was also found and corrected: stored
canvas inspector preference no longer opens the conversation inspector implicitly.
Pending re-capture after correcting layout and resize focus.

Current iteration final result: blocked

### Final local comparison and interaction pass

Final result: passed for the selected desktop reading-view implementation.

- Compared the exact selected option 2 and implementation together at equal
  1629×966 pixels, without browser chrome: private `comparison-final.png`.
  Focused answer/evidence/composer comparison: `comparison-details.png`.
- Typography: existing Instrument Sans / system Chinese fallback, bold answer
  hierarchy and quieter coverage text; no new font downloads. The original saved
  answer `1个` is retained, explicitly prefixed as an estimate. No mock exchanges,
  identities or fabricated count verification were added.
- Layout: source column follows the selected roughly one-third split; answer and
  two evidence images share one reading lane. Fixed resize selection visibility,
  duplicate inspector, detached context chip and source/history scroll coupling.
  Player remains visible while the recent-question list scrolls independently.
- Colors/icons: preserved dark navy surfaces, muted secondary text, orange answer
  mark and active tab. Reused bundled icon assets, with labeled native buttons,
  native disclosure controls and visible focus treatments.
- Images: actual private evidence at 01:41 and 01:42, original 16:9 aspect ratio,
  lazy loaded. The reference's fabricated second crop is intentionally replaced
  by the genuine saved frame. Timestamp footer sits below images so controls do
  not cover the scoreboard.
- Interaction: native wheel moved conversation scrollTop from 11597 to 10631;
  details opens; delete confirmation cancels without deletion; 377 references
  expand and collapse; 01:41/01:42 buttons seek to 101/102 seconds; canvas/view
  reload and context removal preserve draft; basketball→box→basketball restores
  22 basketball turns and its draft. Box is the genuine empty owned desk, not
  seeded with fake history. Player panel closes/reopens normally. Final test
  draft restored to the original empty value and saved.
- Regression: 150 frontend tests pass, frontend build and `make check` pass.
  New gesture regression verifies conversation input is not captured by canvas
  pan/zoom handlers. Time-reading questions are not mislabeled event counts.
- Preservation: before/after hashes match for all 27 queries, 3 videos,
  21 model attempts, 2 budgets and 19 settlements. No model dispatch or budget
  changes. No deployment, commit or push in this design task.
- Verification limit: this pass establishes local rendering and interaction with
  existing answers. It does not establish model-answer accuracy or full-video
  event-count quality. Existing canvas remains available; no mobile redesign.

### Canvas-to-conversation composer entry — 2026-10-28

Clicking the canvas composer body or focusing its textarea now opens the conversation
view. Canvas card “继续追问” follows the same path through textarea focus. Engine,
menu and other toolbar controls keep their own behavior. No submit is triggered.
Browser verified direct textarea click and card follow-up: conversation active,
textarea focused, existing context and temporary draft retained, 22 turns unchanged.
Temporary draft restored to empty and saved. Screenshot: private
`composer-entry.png`. Frontend regression suite: 151 passed; build passed.
Final result: passed.

### Explicit quoted replies — 2026-10-28

Scoped follow-up to the user's audit feedback; existing desktop reading layout is
preserved. The approved interaction replaces the implicit 接着 chip with a quoted
answer: question number, original question, answer excerpt and visible 取消引用.
A group label names the quoted question; ordinary and quoted input placeholders
are distinct. Invalid/hidden/foreign source contexts are not inferred by matching
question text. Failed real turns without an evidence anchor offer 重新编辑问题
rather than implying a usable quoted reply.

Same2267×1344 viewport capture, same original question25 and empty draft, compared
together in private `followup-audit-20261028/quote-comparison.png`; focused crop
`final-detail.png`. Typography uses existing fonts, palette uses existing navy and
orange tokens, and quote spacing deliberately replaces a filter-like pill with a
left-border reply block. No new imagery/icons were invented. Quote copy is actual
saved answer content; long question/answer lines truncate visually with full title.
Composer/evidence scroll clearance increased for the taller quoted block.

Actual page checks: question24 shows its own `1个` answer; same-titled question25
shows `无法确定`; cancel leaves typed draft byte-for-byte and restores normal
placeholder; original empty draft restored; refresh restores question25 quote.
No submit/model request, deletion, source edit, deployment or budget change.
152 frontend regressions and frontend build pass. This tests local interaction;
no full screen-reader/contrast conformance or new model quality claim is made.
Final result: passed for the scoped quoted-reply change.

### Automatic engine selection — local 2026-10-28

Scoped composer edit keeps the approved reading view, fonts, colors and evidence
imagery. The engine selector moved into More tools / Advanced settings; the primary
composer shows Auto and manual override shows Manual. Actual backend read-only
routing and dispatch are implemented, not a hidden unchanged selector. Label sizes
and icon assets reuse the existing design. Browser verified default Auto, access
to advanced controls, synthetic zero-model positive submission, and capability
rejection preserving the submitted draft. Existing basketball23 turns, question25
quote and original empty draft remain; source/query/financial hashes match.
Private screenshots: `auto-route-20261028/local-auto.png`, `composer-auto.png`,
`fixture-auto-answer.png`, `fixture-blocked.png`. No actual model inference or
online deployment. Test counts and material limits: docs/AUTO_ROUTING.md.
