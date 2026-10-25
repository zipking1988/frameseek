# Cloud video compiler — Token Factory

The optional `FS_CLOUD_VISION=1` capability runs the same sampled scene compiler
as the on-device engine through the existing Token Factory provider and atomic
owner/deployment attempt ledger. It requires trusted real-mode Token Factory
configuration, media permission, valid calibration and existing active approvals.
It does not provision a GPU, train weights or install/reset any approval.

`POST /api/cloud-chat/prepare` accepts the ordinary owned ChatInput and returns
`ready`, `capability_blocked` or `budget_blocked`. It hashes the original source,
checks generation/configuration-specific cached packets and reports an estimate
without reserving budget or sending requests. `POST /api/cloud-chat` repeats
admission server-side; skipping prepare cannot bypass it. Async query polling,
context ownership, cancellation, navigation generations and durable recovery use
the same contracts as local chat. Dispatch rechecks owner/source/query activity.

The compiler covers the source with eight-second windows, at most eight decoded
JPEGs each. Scene packets are reusable across questions. Semantic selection uses
bounded batches of those observations. Appearance queries check uncovered sampled
frames, without automatic per-negative single-frame fanout, and the grounded
answer cites original decoded frame IDs/timestamps. This does not guarantee
frame-level exhaustive recall, unique identities, action counts or rankings.

All requests use `Provider.call`, the fixed official HTTPS origin, inline JPEG
validation, existing per-attempt calibrated maxima and no automatic JSON repair
or retry. Unknown/dispatched receipts are never resent or refunded. Cloud caches
are separate from both local MLX caches and original paid ingest checkpoints;
source hash, generation, runtime/model revision and compiler revision bind them.
Full original media is not uploaded to Token Factory.

The estimate conservatively includes uncached scene packets, one text selection
per eight windows, up to one batch verification
per window for appearance queries, and one answer editor. It is a worst-case
admission envelope, not actual charge or a new spending approval. Cached scene
packets reduce admission; completed HTTP request IDs replay the saved answer.
The existing provider's token ceiling and calibrated monetary maximum apply.

Current deployment acceptance is recorded in `qa/CLOUD_VISION_20261025.md`.
No live recognition-quality claim can follow from mock transport tests or a
budget-blocked page submission. Exhausted approval must remain visibly blocked.

The cloud transport does not copy the free local engine's automatic single-image
checks for every batch negative. That would multiply paid calls by up to nine
per window. Batch negatives remain explicitly uncertain; this cost choice is not
recognition-quality acceptance, and absence is never asserted for the full video.
