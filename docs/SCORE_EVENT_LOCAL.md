# Local score-assisted event answering — 2026-10-28

This increment addresses the actual repeated count failure, not the composer UI.
The old sampled-caption search missed a visible shot around04:04, and the literal
continuation “继续这个问题” bypassed the original count intent. The selected frames
were then relabeled with the query condition, producing irrelevant evidence.

## Implemented local path

- Explicit continuation commands resolve to the owned original question before
  retrieval, aggregation classification or budget admission. New results keep the
  original user input and a resolved-question field. Old continuation chains are
  walked with owned desk/query generation, video/source generation and cycle/depth
  checks; historical records are not rewritten. Fresh independent questions are
  not replaced with the prior question. Cloud admission uses the resolved intent.
- Trusted opt-in `FS_SCORE_OCR_BIN` points to a locally compiled Apple Vision OCR
  worker. Source is `src/frameseek/score_ocr.swift`; compile on macOS with:
  `swiftc -O src/frameseek/score_ocr.swift -o PRIVATE_PATH/score-ocr`.
  No model/data download or credential is used. This worker is not installed on
  Nebius Linux by this change. No remote/paid fallback is added.
- For supported score-value shot count wording, reuse original generation-specific
  decoded source frames. OCR reads dynamic team labels, scores, period and clock;
  supports split label/value tokens and sub-minute decimal clocks. No team names,
  source filename, answer count or event times are hardcoded in source.
- Stable score increases are proposals, not completed shots. Bounded OCR gaps may
  produce a review proposal but do not establish an event. Reset clocks, changed
  labels, score corrections and insufficient reading stability are excluded by
  the proposal layer. Partial OCR coverage is reported explicitly.
- Each proposal receives a separate chronological-image visual review with the
  existing free local model. Confirmed-shot counts and scoreboard-change counts
  remain separate. A rejected/uncertain action never becomes a confirmed shot;
  independently read scoreboard changes remain reportable as scoreboard records,
  with their own before/after evidence. Supporting image indexes are validated;
  timestamps come only from decoded frames/OCR, never the model's narrative.
  Score update time is separate from the earlier shot frames.
- Repeated identical score transitions are deduplicated. Completed OCR/review
  receipts are reused. Unknown inference-start markers are never resent or
  refunded. Later failure preserves already verified events. Cancellation and
  source fingerprint/generation checks still gate publication.

The result is partial evidence-backed observed-event counting, not an exact
full-game total or exhaustive original-frame recognition. It is a score-display
adapter, not a general solution to every action or entity-ranking question.
Replays or score corrections can remain ambiguous; OCR may miss a change.
Intervals are reviewed clips, not frame-accurate release/net-crossing timestamps.
The score-delta shortcut is local-only; the cloud sampled compiler keeps its
original route and approval/atomic ledger rules.

## Real source evidence (private)

The385 original sampled frames contain325 parseable scoreboard readings. OCR
proposed four +3 changes, with first visible new scores at59,168,246 and273s.
These are measured candidates, not embedded constants. The user's04:04 marker
is near the246s score update. The withdrawn00:01 marker was not installed as a
positive or a negative training label. Actual page acceptance and final model
review results are recorded below after completion.

Private native OCR probe/scan/candidates and before-page preservation fingerprints
are under `.frameseek/score-ocr-20261028/`. This is local development only: no GPU
rental, cloud model request, paid allowance change, training, push or deployment.

## Actual page outcome and remaining failure

Both completed local action-review prompt versions rejected all4 proposed shots.
Some narratives contradicted their own observations or read scores in reverse.
These failures are retained; the work does NOT establish successful shot-action
recognition, and no forced positive model result or training label was inserted.
Eight free local verification receipts were completed over the two implementations;
the final page run reused receipts and added0 new model calls. No remote calls.

The final user-facing answer gives the real measured score-update statistic:
4 single-side +3 records (TOR1, GS3), updates at00:59,02:48,04:06,04:33. It explicitly
calls this a scoreboard-based shot estimate and states0 passed action reviews /
4 unconfirmed. There are60 unreadable samples among385. The page retains8 exact
original before/after score-frame references instead of210 irrelevant citations.
This is partial core progress, not completion of reliable general event recognition.

Actual browser submitted the original continuation and the full count question;
final answer saved as question29. Expanded all8 references, verified seeks to
59/168/246/273 seconds, restored245-second paused player position, and kept the
original empty draft. All pre-test source/query rows and all paid ledger rows have
unchanged hashes. Three actual test questions were appended; failed iterations
were not deleted or rewritten. Private evidence: page-result.png, seek-proof.json
and preservation-after.json in the dated private directory.

356 backend tests,155 frontend tests and build/lint/format/schema/whitespace checks
pass. No frontend source changed this increment. The existing server runs one API
process with the local OCR opt-in; no deployment, GPU rental, paid budget change,
training or push occurred.
