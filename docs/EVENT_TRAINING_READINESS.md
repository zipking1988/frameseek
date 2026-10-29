# Event recognition evaluation and training readiness

2026-10-28: first offline evaluation increment, not a trained recognizer or a
completed chat counting feature. No paid inference/training/model download, GPU rental,
new budget approval, production data mutation or online deployment in this task.
One bounded comparison uses the already-installed free on-device model, with
8 chronological original frames from04:00–04:07. It is multi-image inference,
not a native dense-video model or proof of exhaustive temporal recognition.
The prompt excludes reviewed scores and labels; the raw result and unknown-start
marker are kept privately. No automatic resend is allowed after an interruption.
The existing reading interface and all prior uncommitted fixes are retained.

## What is runnable

`frameseek.event_evaluation` validates an explicit event benchmark and scores saved
predictions, with source fingerprints, reviewed intervals and separate development /
held-out splits. A source group (e.g. original game/recording) may not cross splits,
even through different file encodes. Correct group annotation is still required;
the validator cannot discover video lineage from pixels. Labels use arbitrary
source-defined action names, original timestamps, evidence and canonical replay IDs.
No basketball-specific answer times or totals are embedded in production code.

Metrics use temporal IoU and maximum one-to-one matching. Duplicate predictions
cannot match one label twice. Reports include missed events, false positives,
uncertain/unreviewed predictions, canonical count errors per source/action and
incorrect replay merges. Errors from different actions cannot cancel each other.
Unreviewed regions are not negatives. Partial review cannot establish full-source
recall, and matching the total alone cannot establish localization or correct replay
associations. A score report does not automatically conclude that training is needed.

`frameseek.score_transitions` separately proposes stable scoreboard deltas from
explicit trusted timestamped readings. It requires two readings before and after,
consistent side labels/period/continuous segment, monotonic clock and bounded gaps.
Delta is a task parameter, not a basketball constant. It does NOT perform OCR or
prove that an increase came from one shot: action verification and replay analysis
are still required. Corrections, free throws and repeated coverage remain possible.

```sh
uv run --frozen pytest -q tests/test_event_evaluation.py tests/test_score_transitions.py
uv run --frozen python -m frameseek.event_evaluation BENCHMARK.json RUN.json
```

Artifacts are strict offline input models; the public Answer schema remains0.1.
The evaluator does not import labels into source indexes, alter chat or grant calls.

## Actual basketball seed case (private)

User withdrew00:01; it is not a positive or independently reviewed negative label.
The remaining user candidate near04:04 was inspected through an isolated14s clip
(03:58–04:12) and14 real decoded frames with original PTS. Assistant visual review
finds an outside-arc shot sequence and the scoreboard changing from GS100/TOR103
to GS103/TOR103 by04:06. The event interval is deliberately broad (04:00–04:07),
separate from scoreboard update time; frame-accurate release/net-crossing labels
are not established. This is a provisional single-reviewer development annotation,
not an independently annotated training set or a held-out acceptance result.

Private benchmark, baseline, report, reviewed score proposals, frame contact sheet
and review page are under `.frameseek/event-eval-20261028/`. The copied original
hard link was removed after isolated decoding; the review folder retains only the
short derivative and evidence. Original workspace/index files were not written.
The standalone loopback review server is an inspection aid, not a new chat mode.
Browser playback and original-time buttons04:01/04:04/04:06 were exercised; seeking
required HTTP Range206 support, added to the isolated review server. No API route
or live chat submission was used.

The stored answer "无法确定" provides zero confirmed event predictions for this
reviewed region. Its baseline has one miss and count error1. The210 low-support
condition-tagged references are not relabeled as210 positive event detections.
This is one observed failure, not a global model-recall estimate.

## Before any fine-tuning

1. Expand annotations to positives, misses, near-misses, replay, free throws,
   scoreboard corrections/occlusion, camera cuts and non-sports events. Require
   independent review before treating provisional labels as training truth.
2. Partition by original game/recording, not random neighboring frames. Freeze a
   held-out set and track extractor/model/config versions and source hashes.
3. Compare saved outputs of the existing general visual model, continuous-window
   action recognition and scoreboard+action fusion on the same set. New inference
   must follow its own authorization and existing paid ledger rules.
4. If correctly sampled continuous footage is still misrecognized, evaluate
   pretrained action/detector alternatives and then targeted adapter fine-tuning.
   If recognition succeeds but counting fails, repair temporal association/replay
   logic. Both defects can coexist; no blanket "training unnecessary" claim.
5. Inspect candidate dataset label definitions, provenance, redistribution and
   use permissions before acquisition. FineSports is a relevant action-localization
   research lead; its52 action classes do not by themselves establish three-point
   makes, scoreboard transitions or replay dedup labels. HF MultiSubjects is a
   single-person basketball action lead, not equivalent to broadcast-game counting.
   No dataset has been downloaded or represented as an approved training corpus.

Research starting points:
- https://openaccess.thecvf.com/content/CVPR2024/html/Xu_FineSports_A_Multi-person_Hierarchical_Sports_Video_Dataset_for_Fine-grained_Action_CVPR_2024_paper.html
- https://huggingface.co/datasets/Henu-Software/Henu-MultiSubjects

Remaining: automatic trustworthy scoreboard reading, continuous event extraction,
replay recognition, independent multi-source labels, held-out evaluation, actual
model comparisons and any training. The new evaluator/proposal component is not
connected as a manufactured counting answer in chat.

## Bounded actual local-model comparison result

One invocation of the existing Qwen3-VL4B4-bit local worker, with8 chronological
images at240–247s and no supplied annotation/score answer, returned shot=true,
made=true, three_pointer=true, GS100/TOR103 before and GS103/TOR103 after.
Those recognition/score fields agree with this provisional development review.
The result nevertheless fails exact temporal grounding: its narrative claims the
new score at245s, while the original245s image still reads100/103;246s reads103/103.
Its shot-release boundary is also not independently established. No retries or
extra comparison calls were sent; completed receipt is retained. No paid model
calls, ledger changes, training or chat edits occurred. The worker was terminated
after this isolated comparison. The local runtime emitted a semaphore-cleanup
warning at worker shutdown, with the complete result already saved.

This gives a concrete first distinction: the installed model can recognize this
bounded positive example, while the earlier full-source answer abstained; temporal
attribution still fails. Prioritize extraction/aggregation and source-time checking,
then measure across independent positives/negatives/holdouts before deciding on
fine-tuning. It does not establish that training is never needed.

Verification:347 backend tests pass on the final implementation, including21
new event-evaluation/score-transition tests; Ruff/format/schema drift and whitespace
checks pass. No production/frontend behavior changed in this increment.

2026-10-28 follow-up: [local score-assisted event path](SCORE_EVENT_LOCAL.md) adds
real OCR proposals and bounded shot verification; earlier missing-engine notes
above remain historical. Coverage and counting limitations still apply.
