# Local investigation tools: review and verification

2026-10-05. User selected offline evaluation, real-agent preparation, professional canvas tools and portable reports; CI is deferred. Implementation remains in fixture mode. No live endpoint, finite numeric spending authorization or calibration approval was supplied, so no model requests or GPU provisioning were performed.

## Delivered and scope

- Versioned offline dataset/run validation and scoring, a deliberately unrun four-category/eight-question diagnostic template, fixed denominators, one-to-one event matching, human-response-bound claim review, completion/latency/cost disclosure. CLI reads artifacts; real baseline/ablation execution and automatic raw/retrieval trace collection remain pending.
- Owned, no-store runtime readiness API, readonly CLI and workspace model/budget preparation dialog. They inspect existing prerequisites without network calls, credentials disclosure or approval installation. Passing is not live acceptance.
- Desktop canvas Shift selection, batch mouse/keyboard movement, named groups, alignment/spacing, bounded layout history, search and shortcut help. Groups/layout persist; history is session-only and cannot replay queries or restore deleted evidence.
- Captured Markdown/JSON/offline HTML reports with original source times, speech/caption observations, retained pin origins, unresolved/error states and bounded optional embedded raster frames. HTML can be printed to PDF in the browser; no native PDF generator or video/audio embedding.

See [evaluation contracts](evaluation.md), [canvas/report usage](CANVAS_AND_REPORTS.md) and [runtime prerequisites](WORKSPACE_RUNTIME.md).

## Defects fixed during review

| Defect | Fix and evidence |
| --- | --- |
| Raw schema rate excluded missing responses from its denominator | All dataset requests remain in the denominator; observed count remains explicit. `test_raw_schema_uses_all_requests_even_when_raw_outputs_are_missing` |
| Failed/timeout outcomes with retained responses counted as positive/negative task success | Require completed outcomes for IoU/correct-negative success; retain verified partial claim metrics separately. `test_failed_outcomes_cannot_count_retained_responses_as_task_success` |
| Shift-deselecting a nonprimary card made that removed card the follow-up context | Preserve the remaining primary/context; production-handler regression in `investigation_canvas.test.cjs` |
| Folded alignment moved a selected hidden child twice | Align visible nodes and translate each folded subtree once. Focused hidden-child alignment regression |
| Group label DOM was replaced during keyboard activation, losing focus | Keep keyed group buttons; browser Enter activation retains the same focused group label |
| Repeated fixture query IDs dropped distinct conversation rounds from reports | Key report assembly by turn ID, retain actual request IDs and pin origins; repeated-ID regression |
| Human exports floored subsecond intervals and omitted ASR-only support | Preserve millisecond timestamps, caption and source speech; fractional/ASR regression |
| Deduplicated frame images could lose another round’s observation | Retain per-turn observations and render distinct descriptions; differing-observation regression |
| Report dialog used the UI bridge without a snapshot method | Capture through `FrameSeekSessionUI`; browser verified all three format downloads |
| Holding Shift before a title drag deselected the card and prevented free placement | Keep title drag selection stable; reserve Shift toggling for selection/body clicks. Focused pointerdown regression |
| Keyboard movement retained an unused node lookup | Remove unused lookup |

Review used the gstack review checklist and seven in-host specialist lenses (testing, security, performance, maintainability, API contracts, design, simplification), plus an in-host adversarial pass. Final testing/API/security/design/performance/adversarial checks returned no remaining concrete findings after fixes; maintainability/simplification found no unresolved structural issue. This is not independent cross-provider agreement: no outside model CLI was launched from this Codex host. Fixtures in the adversarial pass were inspected in summary mode, not expanded as attack content. Live/model/deployment limits remain open; review is DONE_WITH_CONCERNS for those coverage limits.

## Executed verification

- `make test`: **125 passed**; isolated backend fixtures/mock transports.
- `npm test`: **85 passed**; canvas, report, state and asynchronous persistence regressions.
- `make check`: Ruff lint/format and generated schema exports passed.
- `npm run build`: committed React bundle and static content hashes rebuilt; third-party notices preserved.
- `make eval-check`: template structure accepted; scoring correctly reports `NOT_ACCEPTED` with missing annotations/results and no live proof.
- `make agent-check`: expected exit 2 in fixture mode; no private storage/approvals/model requests created by the check.
- `git diff --check`, current-document link checks and static content-hash verification passed.

Browser checks on localhost used a separate synthetic-demo investigation, preserving the earlier desk: Shift multi-select; group create/undo/redo; batch keyboard and mouse drag; search by group name/Enter result; refresh restoring group geometry with empty history; keyed group keyboard focus; readonly readiness; Markdown/JSON downloads; HTML download with **3/3** embedded frames. Downloaded JSON declared synthetic provenance and excluded drafts; actual HTML file contained three raster data images, no script, and unresolved items. The browser download-event helper timed out, but the real files were verified in Downloads. Original downloaded files are not committed.

Screenshots: [canvas](local-tools-20261005/canvas.png), [report](local-tools-20261005/report.png), [readiness](local-tools-20261005/readiness.png). Source audio, live endpoints, real annotation quality, supplier billing/cutoff, hour-long performance, Linux isolation and deployment security/backup remain unverified.

## Delivery branch update

The user changed the target to `dev` after the previously authorized main push of `e936793` completed. Further review fixes and delivery records are applied to dev only; no force push or main-history rewrite. The subsequent title-drag review fixed Shift-held free placement and reran the full frontend suite/build; backend behavior is unchanged.
