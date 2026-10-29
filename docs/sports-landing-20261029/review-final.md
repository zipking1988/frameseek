# FrameSeek sports landing — 2026-10-29

final result: passed

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
