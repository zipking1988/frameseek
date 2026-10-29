# Opt-in on-device video answering

> Current VideoKnowledge path (2026-10-29): when `FS_KNOWLEDGE_LOCAL=1`
> is configured, upload-time indexing builds the reusable base first. Chat
> searches that index and may run bounded local supplements. The legacy
> local-chat route described below remains available for deployments without
> this index; it should not be confused with the new upload-time pipeline.
> Local supplement contract v9 combines each item's color and type to fit the
> existing per-subject limit. Older receipts keep their original prompt and are
> never automatically replayed when their outcome is unknown. See
> [current runtime status](WORKSPACE_RUNTIME.md) and the
> [test record](qa/KNOWLEDGE_REFACTOR_20261029.md) for verification limits.

FrameSeek can run a separately installed MLX vision runtime on an Apple Silicon
Mac. This route performs real local image inference, caches scene observations,
and answers questions with references to decoded frames at original video times.
It does not use the Token Factory adapter or its spending ledger, and has no
remote fallback. The normal NVIDIA/Nebius provider remains available separately.

## Configuration

The API environment does not depend on MLX. Install the optional runtime and model
weights independently, then set these trusted process environment variables:

```sh
FS_LOCAL_VISION=1
FS_LOCAL_VISION_PYTHON=/absolute/path/to/local-runtime/bin/python
FS_LOCAL_VISION_MODEL=/absolute/path/to/downloaded/model
```

The interpreter and weights must already exist. Neither the API nor the browser
installs models, downloads weights, creates approvals, or changes paid budgets.
The worker runs with Hugging Face offline mode enabled and provider credential
environment variables removed. Communication uses private stdin/stdout, with no
additional network listener. The API remains one process per workspace.

The local development runtime used on 2026-10-25 is `mlx-vlm==0.7.10` and
`mlx-community/Qwen3-VL-4B-Instruct-4bit`, revision
`2fd8dacbdb8f1e54b8c005f081ec5bf79c56376b`. Runtime packages and downloaded weights
are private ignored files under `.frameseek/local-vision/`, not repository assets.
This optional local compiler does not replace the NVIDIA/Nebius configuration.

## Behavior and storage

When configured, the input engine offers **本机视觉 · 免费**. Sending a question
uses the same owned source and investigation, CSRF checks and durable query
storage as the other chat routes. `POST /api/local-chat/prepare` checks readiness
without inference. `POST /api/local-chat` starts one local worker job and returns a
pending query envelope; repeating the same request polls its state rather than
starting another job. A completed answer retains the existing schema 0.1.

The first question scans consecutive eight-second windows over the source's full
duration, using up to eight decoded frames per window. Completed visual packets
are cached by source hash, source generation, compiler version and model config.
Later questions reuse them. A semantic selector processes small batches and may
only select existing observation IDs. The server expands every selected
observation's actual frame references; the model never generates source times.
For appearance-time questions, source frames not covered by the selected captions
receive question-specific local pixel checks. Batch negatives receive independent
single-image confirmation to reduce image-index omissions. These receipts are
also cached. Explicit source-time ranges constrain returned references and pixel
checks; the paid route's existing60-second default remains unchanged.
Evidence references are validated again before publication. Source/desk generation,
expiry and cancellation are checked throughout processing and before publication.
Drafts and other investigations remain independently stored.

Local packets and raw output stay inside the private source directory. A started
packet without a receipt is treated as interrupted/unknown and is not silently
resent. Completed packets are not re-inferred when resuming after a known format
failure. Local jobs never fall back to paid API calls. Search summaries use the generated
query-condition label and actual matching group/frame counts, not free-form
model-generated time lists or invented identities. A no-match response describes
the searched index/sampling scope and does not certify absolute absence from the
original video. Valid partial evidence is retained when later retrieval or answer
editing fails. Long sources group adjacent index windows to fit the existing
100-event contract without dropping frame/time references; such groups are not
unique people or deduplicated event counts.

## Accuracy and verification limits

Scanning the full duration is not the same as examining every original frame.
Brief appearances can be missed between sampled frames. Local model descriptions
may misread small text, clothing numbers, occluded actions or relationships.
Time references establish where the supporting images came from; they do not by
themselves prove the model's interpretation.

Answers must retain uncertainty and show evidence. An exact event count or person
ranking requires sufficiently clear observations, event deduplication, replay
handling and identity continuity. A score change alone does not establish a
particular made shot. Do not advertise exhaustive occurrence recall or perfect
counting from this sampled compiler.

Mock tests verify lifecycle, ownership, idempotence, caching and reference contracts;
they do not establish recognition quality. Real page checks and factual image
inspection must be recorded separately in `docs/qa/`.


## Stopping local processing

The composer shows **停止处理** while an asynchronous request is running. Stopping
preserves the draft and interrupts the free local worker, including model startup.
Only that explicitly cancelled job's newly created interrupted markers are cleared
for a later user-initiated request. Existing unknown receipts are preserved; this
does not resend or refund any paid attempt. The previous request cannot publish a
late answer over a newer submission. See [actual page verification](qa/COMPOSER_STOP_20261028.md).

## Experimental reusable knowledge index

In a separate workspace, trusted `FS_KNOWLEDGE_LOCAL=1` with the existing local
vision settings enables the experimental upload-time index and bounded local
supplement. It runs on the installed on-device model and does not enable cloud
spending. Existing videos require an explicit build; uploaded videos begin after
preflight. A fingerprint of model weights, tokenizer, preprocessing and model
configuration, together with the extraction contract revision, binds new
checkpoints to the configured processor. If that identity changes, an ordinary
resume does not silently rebuild an existing checkpoint. Published versions and
their historical answers stay readable. The page keeps playback available while
the index builds and requires the completed base index before a new question.

This flag is not enabled in the existing user workspace or production. The full
basketball source and synthetic fixture flows have been exercised in isolated
local workspaces, but the required 20 independently annotated cases and
recognition-quality threshold remain open. See the [QA record](qa/KNOWLEDGE_REFACTOR_20261029.md).
Token Factory for this contract still requires matching cost calibration and is
not enabled by this flag. A separate adapter has mock coverage for preflight and
the existing provider's per-call reservation path; no production calibration or
live Token Factory run has been performed for this extraction contract. These
limitations must be cleared before switching the default workspace or claiming
whole-video recognition quality.

New upload-time local knowledge builds use a versioned v5 prompt that asks for
clothing color and item in one observed value, such as `garment=blue jersey`,
and asks separately for visible object colors. Matching interrupted v3 and v4
builds resume with their original prompts and caches;
published indexes are not rebuilt automatically. Supplement receipt identities
are unchanged. Token Factory has separate v4/v5 code paths requiring their own
calibrations; no real v4/v5 calibration has been performed. Recognition quality
still requires human review.
