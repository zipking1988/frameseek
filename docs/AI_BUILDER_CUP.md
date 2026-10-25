# AI Builder Cup edition

Prepared locally on 2026-10-11. This edition adds a selectable Gemini adapter; it
does not replace the NVIDIA/Nebius route. No GCP resources, credentials, spending
approvals or live model calls were created during implementation.

## Current implementation

The existing source library, upload/preflight, desktop canvas, investigations,
follow-up context, evidence player and exports use the same owned HTTP APIs.
`FRAMESEEK_MODE` still defaults to `fixture`. Fixture responses remain synthetic
and cannot answer questions about an uploaded source.

Select the model route only through a trusted private `FS_RUNTIME_FILE`:

| Runtime provider | Media and models |
| --- | --- |
| `nvidia_nebius` (default if omitted) | Existing self-hosted NVIDIA vision/embedding/reranking/optional ASR, Nebius text |
| `gemini` | Native Gemini API for frame descriptions, visual verification, text planning and synthesis; Gemini embeddings; Gemini text relevance selection |

Gemini uses `models.generateContent` and `models.batchEmbedContents` through the
existing HTTP transport and approved-budget ledger. It has no SDK retry path or
Files API uploads. The original video stays on the workspace backend; only
bounded, locally decoded JPEG frames and their actual IDs/absolute timestamps
reach the Google vision model. Planning, embeddings, relevance selection and
answer synthesis send text only. Unknown/dispatched attempts remain charged and
are not automatically resent. Cached completed work is reused under the same
generation and active approvals. A provider change requires a new index
generation; indices from the two routes are never mixed.

The Gemini edition currently supports visual video investigation, including
visible text. **Audio transcription is not configured.** Audio questions are
rejected with `audio_channel_unavailable`, not answered using invented speech.
Relevance selection is performed by Gemini over candidate descriptions; it is
not a dedicated reranker model and does not invent relevance scores.

Gemini generation is bounded to 4,096 output tokens, 128 images per call, a
19 MiB serialized inline request and 4 MiB streamed output. The prototype embeds
up to 100 complete source windows in one synchronous batch; more windows are
rejected before ingestion model calls, never truncated into a partial ready
index. Existing 120-second windows, 5-second overlap, 1 FPS, three total zoom
attempts and one syntax-repair attempt remain in force.

Embedding requests explicitly disable automatic truncation. Oversized model
inputs must fail, not silently produce vectors from only part of a description.

## Prepare configuration without making calls

Copy [runtime.gemini.example.json](runtime.gemini.example.json) to private storage
outside the repository. It is deliberately blocked: media transmission is off,
calibration references are empty, validity is expired, and the model IDs/revisions
need verification. `max_cost_micro: 1` is a placeholder, not a price or approval.
Do not enable it simply by extending the expiry.

Before a later explicitly authorized live run, the operator must:

1. Choose account-available image/JSON-capable Gemini generation model IDs and
   verify their revisions, input limits and structured-output behavior. The
   template's `gemini-embedding-001` ID also needs account/permission verification.
2. Supply `GEMINI_API_KEY` privately in the backend environment. Do not put it in
   the browser, runtime JSON, Git, gateway, deck or chat. `.env` is not loaded.
3. Set `allow_google_media: true` deliberately for this route, acknowledging that
   sampled source frames are sent to Google's Gemini API. Check the account's
   data-use terms before using private footage; use authorized nonprivate test
   footage for the first smoke.
4. Obtain explicit numeric calibration and execution approval: currency, total
   money, primary/total calls, validity and conservative per-role cost bounds
   including batch size, image/input tokens, output/thinking tokens and any
   repair. Record verified provider controls in `resource_cutoff_reference`.
   An HTTP timeout or cloud billing alert is not a supplier hard spending cap.
5. Record both deployment `*` and existing session-owner approvals using the
   trusted budget tool described in [WORKSPACE_RUNTIME.md](WORKSPACE_RUNTIME.md).
   Configuration cannot install approvals. Use a distinct Gemini budget version.

These read-only checks do not create resources, approvals or model requests:

```sh
FS_RUNTIME_FILE=/absolute/private/path/gemini-runtime.json make preflight
FS_RUNTIME_FILE=/absolute/private/path/gemini-runtime.json \
  FRAMESEEK_MODE=real make agent-check
```

An unconfigured template must remain blocked. `preflight` reports outstanding
deployment acceptance and still exits 2 in real mode; `agent-check` checks local
dispatch prerequisites, not model quality. For existing approvals, add
`--owner EXISTING_OWNER_ID` to `python -m frameseek.readiness`.

## Later live smoke, after authorization

Start one backend using the verified private runtime and real mode. In the UI:

1. Upload a short, authorized real video. For the planned Cloud Run ingress,
   keep the file below 30 MiB. Check real duration, PTS previews and window count.
2. Open **Models and budget / 模型与预算** and verify it says Gemini, then start
   analysis from the source library. Wait for a complete ready index.
3. Ask a visible-fact question with a manually known answer. Check each returned
   frame in the source player at its absolute timestamp; document mismatches.
4. Select that question and ask a follow-up with a pronoun. Confirm the selected
   context, save a finding and export the report. Refresh and restore the desk.
5. Test one negative/uncertain question, an audio question and cancellation.
   Missing evidence must not become a fabricated positive or global negative.
6. Record actual model/revision, request outcomes, provider usage/billing,
   conservative reserved costs and playback review in ignored private artifacts.
   Do not reuse mock outputs as live acceptance evidence.

The implementation tests use actual local video decoding with mocked Gemini
HTTP responses. They prove adapter/API/ownership/context/ledger behavior, not
Gemini quality, latency, account access, cloud isolation or billing.

## Local verification (2026-10-11)

- `make test`: **153 passed**, including Gemini upload/index/follow-up/evidence
  contracts, foreign-owner denial, invented-frame rejection, incomplete/unknown
  response non-replay and original NVIDIA/Nebius cache-only resume with old
  runtime checkpoints. All model transports are mocks.
- `npm test`: **85 passed**; `npm run build` rebuilt authored browser assets.
- `make check`: Ruff lint/format and generated answer/control contracts passed;
  schema remains 0.1 with the same four final statuses.
- Local gateway/real workspace ASGI regressions passed for per-browser cookie
  isolation, Secure cookies, Origin/CSRF, private Range playback, binary bodies,
  declared/streamed size limits, explicit failure/no retry and startup guards.
- Python wheel built with the adapters/gateway and committed frontend/license
  assets. Cloud Run template YAML parsed; document links, nine static hashes and
  `git diff --check` passed. The blocked Gemini readiness check returned exit 2,
  sent zero model requests and created no private storage.
- Docker daemon was unavailable. No container image build, Linux sandbox run,
  GCP deployment, paid calibration or live Gemini run is claimed.

## Submission preparation

Recommended theme: **Future of Work & Enterprise Productivity**. The story is
an investigator moving from a video question to source-backed frames, follow-up
paths and a portable investigation record. A focused short-video flow is the
prototype target; original NVIDIA/Nebius hour-long acceptance stays open.

The event lists prototype submission on **2026-10-18**. Required materials are a
working deployed prototype URL, public GitHub source, a video strictly under
three minutes, and a deck (PDF) explaining the problem, architecture, business
case and limits. Submit materials in English. The repository remains private;
this implementation does not authorize publishing it. Confirm the exact closing
time in the registered dashboard, because the public schedule lacks a timezone.
Sources: [FAQ](https://aibuildercup.com/Faqs.html),
[requirements and rubric](https://aibuildercup.com/themes.html),
[timeline](https://aibuildercup.com/).

Demo outline: 20 seconds on the user's problem, 100 seconds on the real
question → verified frame → follow-up → report flow, 30 seconds on Gemini and
Google Cloud architecture, 20 seconds on scope and next steps. Capture a backup
of the working real flow. Label the offline fixture separately as synthetic.
No live evidence or hosted URL is currently claimed.

See [Google Cloud preparation](deployment.md) for the container/gateway design
and remaining deployment acceptance. This remains a prototype implementation,
not complete MVP or production GO.

## API references

- [Gemini generateContent](https://ai.google.dev/api/generate-content)
- [Gemini embeddings](https://ai.google.dev/api/embeddings)
- [Gemini structured output](https://ai.google.dev/gemini-api/docs/structured-output)
- [Inline images](https://ai.google.dev/gemini-api/docs/image-understanding)
