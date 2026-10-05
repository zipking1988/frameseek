# Offline evaluation artifacts

The evaluator scores a frozen dataset and a recorded run locally. It never invokes a model, provisions a GPU, grants budget, or claims a mock run proves live quality. The templates deliberately have draft annotations, no video hashes and no run results.

```sh
make eval-check  # validates/scores the unrun templates; NOT_ACCEPTED is expected
mkdir -m 700 .frameseek-eval
cp eval/diagnostics.template.json .frameseek-eval/dataset.json
uv run --frozen python -m frameseek.evaluation validate \
  --dataset .frameseek-eval/dataset.json
uv run --frozen python -m frameseek.evaluation score \
  --dataset .frameseek-eval/dataset.json --run .frameseek-eval/run.json \
  --output .frameseek-eval/report.json
```

Private datasets, annotations, source manifests and results belong in ignored `.frameseek-eval/`. Output files use mode 0600 and refuse overwrite. Input artifacts are bounded to 16 MiB each. Exit 2 means invalid input or unavailable output; exit 0 means scoring completed, **not acceptance**. Read `diagnostic_gate.status` and `gaps`.

## Prepare a dataset

`Dataset` in `src/frameseek/evaluation.py` defines the versioned schema; unknown fields, duplicate IDs, undeclared sources and nonfinite values are rejected. Each source declares its video ID, `real`/`synthetic` provenance and file SHA-256. Use `shasum -a 256 /absolute/path/video.mp4` locally; do not include private source media in Git.

A diagnostic dataset needs at least two human-reviewed questions in each category: `short_visual`, `speech`, `cross_window`, `no_match`. Record query/audio/on-screen-text languages. Human annotation supplies absolute source-video event intervals and all relevant window IDs for positive questions. Negatives contain no positive events/windows. `annotation_state: reviewed` requires an `annotated_by` identity and frozen source hashes; incomplete annotations remain `draft`.

Validation prints a canonical dataset hash, including normalized schema defaults. Copy that hash into `Run.dataset_sha256`. Editing questions, annotations, source identities or languages invalidates the run binding. The file's raw-byte hash is not this canonical hash.

## Record a run

`Run` records mode, model revisions, configuration hash, currency unit and one result per case. A result has outcome `completed`, `timeout`, `rejected` or `failed`; omitted cases are counted as `missing`. Retain final schema-0.1 response, the pre-repair raw structured response, ordered retrieval window IDs, full completed-request wall time and reconciled cost in integer micro-units when available. `null` means unobserved, never zero. For an error, retain `error_code` and any verified partial response.

The CLI consumes recorded artifacts; it does not currently execute baseline/ablation pipelines or automatically collect raw model/retrieval traces. These must come from an authorized instrumented real run, with the evidence/cost contracts in [ARCHITECTURE](../ARCHITECTURE.md). Do not reconstruct missing traces from final answers. Labels are `asr_keyword`, `hybrid_one_zoom`, `full_agent`, `no_audio`, `no_zoom`, `no_hybrid`; labels alone do not establish that those experiments ran. Score comparable runs against the same frozen dataset and disclose model/configuration differences. Development and report splits retain their original scale requirements (10 videos/30 questions and target 30/100); the diagnostic template is not a replacement.

For evidence review, list every observable event claim in `claims`, indexed by `event_index`, and mark `supported` true/false only after human frame/audio review. Use `null` for unreviewed claims. Set `claim_inventory_complete` only when the reviewer confirms the entire observable claim inventory is represented, `reviewed_by` to their identity, `reviewed_response_sha256` to `digest(result.response)` and `playback_verified` only after source playback. Hashing a response or asserting completeness cannot itself prove human review. Updating an answer requires re-review.

## Read the metrics

- **Recall@5:** relevant ground-truth windows covered by the first five ordered candidates, macro-averaged over all reviewed positives. Failure/timeout/missing cases score zero; a completed case with missing retrieval trace leaves the aggregate unknown rather than removing it.
- **IoU@0.5 question success:** every annotated event needs a distinct matching predicted interval. A broad interval cannot satisfy multiple truth events. Failed/timeout/missing cases score zero even if they retain partial evidence.
- **Negatives:** correct completed `no_result` and false-positive event rates are separate, over all reviewed negatives. Failed cases do not become correct negatives.
- **Schema:** raw and final rates use the same total-request denominator. Missing raw outputs cannot inflate the raw rate; `schema_raw_observed` discloses availability. No raw observations yields null. Valid retained error envelopes may satisfy the output contract without satisfying task-success metrics.
- **Evidence accuracy:** supported/total observable claims, only when all returned-event claim inventories are complete, response-bound and reviewed. Otherwise null. Verified partial claims remain independently measurable when the overall task fails.
- **Latency:** nearest-rank P95 among completed requests with observed full wall time; always show completion rate and observed count. Failed/timeout/rejected/missing counts stay visible and are not silently folded into a successful-only headline.
- **Cost:** total only when every request has an observed amount and a declared currency; partial observed totals/counts are labeled separately.

`GO` applies only to the declared diagnostic artifacts when all four categories, real-source/run declarations, candidate/event coverage, correct negatives and bound human claim/playback reviews meet the checks. The evaluator cannot authenticate a declaration of live execution, inspect supplier billing, verify model permissions, or prove a reviewer actually played the video. Its report explicitly limits this gate to diagnostics. Full MVP, live performance/cost and production deployment acceptance remain separate and open.
