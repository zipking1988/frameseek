# Token Factory local preparation — 2026-10-24

User authorized Nemotron 3.5 Super VL and locally decoded JPEG transmission to
Token Factory, explicitly requiring budget confirmation before any paid call and
prohibiting GPU rental. This supersedes the old GPU smoke proposal for this test.
The original preparation installed no approval. The later USD1/30-attempt user
approval and live smoke run are recorded below. Mock tests alone are not live quality acceptance.

## Runtime and boundaries

Use `provider: "tokenfactory"` and explicit `allow_tokenfactory_media: true` in a
private runtime derived from [runtime.tokenfactory.example.json](runtime.tokenfactory.example.json).
The committed template keeps consent false and calibration expired. The selected local
private configuration enables the authorized media exception but retains expired
calibration and an unapproved budget version. Run the local UI in fixture mode until
credentials, conservative numeric cost bounds and explicit two-level approvals are ready.
Uploaded real sources do not receive synthetic answers.

All four roles use only `https://api.tokenfactory.nebius.com/v1`, without redirects:

| Role | Model | Payload |
| --- | --- | --- |
| Coarse vision / visual review | `nvidia/Nemotron-3.5-Super-VL` | Local JPEGs + frame IDs / absolute timestamps |
| Planning / synthesis | Same Nemotron | Text only |
| Rerank | Same Nemotron via chat completion | Text descriptions / candidate indices |
| Embeddings | `Qwen/Qwen3-Embedding-8B` | Text only; query retrieval instruction |

These public model IDs were observed in the authenticated catalog on 2026-10-24.
No dedicated endpoint is needed. Model IDs are aliases, not verified immutable
revisions; recording a fabricated revision or cost calibration is not allowed.
Credentials use backend-only `NEBIUS_API_KEY`; never paste keys into chat or commit
them. The application does not automatically load `.env`.

Only inline JPEG data URLs from the local extraction pipeline are allowed in vision
requests: max 8 frames and 19 MiB serialized request body. The public endpoint
rejected 12 images during the authorized 2026-10-24 smoke test; coarse and review
sampling now both respect 8. This is sparse sampling, not exhaustive action detection. No original video,
audio, external media URL or Files API upload. Generation caps at 4096 completion
tokens including reasoning. Truncation/refusal/redirect/transport failure leaves
attempts unknown, without automatic retry/refund. Existing bounded JSON repair
still applies to completed but malformed answers and requires a fresh reservation.
Embeddings accept at most 100 complete window descriptions, at most 8000 UTF-8 bytes
per description, 80,000 UTF-8 bytes total including query instructions; oversized input
fails explicitly, never silently truncates. Generation text is capped at 20,000 UTF-8
bytes including the system prompt. Requests use the default price tier; they cannot
automatically upgrade to the over-limit tier. Response usage is retained in private caches. Long
or unusually verbose sources may therefore need a future reviewed batching design.
ASR is unsupported. Original NVIDIA/Nebius and Gemini routes remain selectable.
Provider changes require index rebuilds; generation checkpoints remain frozen.

## Basketball test

Source: https://www.youtube.com/watch?v=I9Zj_0-7qQI
2019 NBA Finals Game 5, Warriors vs Raptors, approximately 384 seconds.
Use the full source from time zero, even though the shared link starts at 2 seconds;
all evidence times refer to the full source. Downloaded source and H.264 playback
copy are local/private and excluded from Git. The UI's upload/preflight only probes,
plans windows and extracts previews; it does not run inference.

Prepare these questions without inventing expected visual answers:

1. 这段视频有哪些投篮命中的片段？给出视频时间和画面证据。
2. 第一个片段之后发生了什么？ (follow up on the selected answer)
3. 找一个能清楚读到记分牌的画面，说明可见比分；看不清就说明。
4. 解说员说了什么？ (must report unavailable audio channel)

After numeric calibration/test spending approval: analyze once, ask the first three
questions, replay every cited frame/time and record actual input/output usage,
latency, evidence validity and remaining credits. Repeated identical request IDs
must not dispatch twice. Do not run this checklist now.

## Prepared local state

The full basketball source was imported through the browser into the local owned
workspace. Local FFmpeg preflight completed: 06:24, 1280×720, five planned windows;
the original preparation waited for model configuration. The authorized live run
subsequently built the five-window index. Investigation:
`NBA 篮球视频 · Nemotron 测试`. A private H.264 source copy is retained under
`.frameseek/basketball-I9Zj_0-7qQI.mp4` for re-import after workspace TTL expiry.
The workspace default retention remains 24 hours; the private source copy is not
an indexed result or an approval.

Put the Token Factory API key in the local `.env.tokenfactory` file, on the single
`NEBIUS_API_KEY=` line. This file is ignored by Git and must have permissions 0600.
Enter the key in your local editor, never in chat, a shell command, or runtime JSON.
The preparation commands explicitly load it using uv's dotenv loader; they do not
source the file as shell code. No credential is sent to the frontend.

Check local readiness without contacting the provider:

```sh
make tokenfactory-check
```

Exit 2 is expected while calibration and budget approvals are missing. This checks
credential presence only, not whether the provider accepts the key.
Stop the existing server before restarting the prepared UI from this checkout:

```sh
make run-tokenfactory-prepare
```

The local runtime is ignored by Git, mode 0600, and contains no key. Credentials
are now configured locally and the USD1/30-attempt approval was installed after
explicit user consent. Public serving revision remains an unpinned alias;
setting media consent alone cannot dispatch.

Approved by the user on 2026-10-24 and installed locally: USD 1 total and at most
30 model attempts, including calibration, ingestion, repairs and chat. Target one
index build and up to three questions as the remaining allowance permits. Stop at
either limit, with no automatic extension. This is the approved spending ceiling,
not a calibrated cost estimate or a guarantee of three completed answers. Both
owner and deployment limits cover this same envelope;
provider billing/cutoff and conservative attempt bounds still need verification.

Verification: 172 backend tests, 85 frontend regressions, build, Ruff and generated
contract drift checks passed. The earlier tests use mock model transports. Browser preparation verified
upload/preflight, restored investigation, selected Token Factory configuration and
disabled analysis; `/health` reported zero model requests and zero GPUs started.

## Before the first real request

- Securely configure the API key locally; confirm model access/revision semantics.
- Confirm exact grant expiry, automatic top-up settings and provider billing controls.
- Present a finite calibration/test amount and call cap for user approval; derive
  conservative per-attempt upper bounds from actual request limits. Catalog unit
  pricing alone is not a calibrated upper bound.
- Install owner and deployment approvals only after explicit numeric approval;
  switch to real mode and explicitly start analysis. No GPU provisioning.

Catalog prices observed: Nemotron input $0.30/M, output $0.90/M; Qwen embeddings
$0.01/M input. These are reference rates, not an installed budget or measured video cost.

References: [API schema](https://api.tokenfactory.nebius.com/openapi.json),
[Nemotron catalog](https://tokenfactory.nebius.com/models/catalog/image2text/nvidia%2FNemotron-3.5-Super-VL),
[Qwen catalog](https://tokenfactory.nebius.com/models/catalog/embedding/Qwen%2FQwen3-Embedding-8B).

## Authorized live smoke run

The user approved USD 1 / 30 total attempts including calibration, with no GPU.
Private records are under `.frameseek/tokenfactory-test/`; no key or private media
is committed. The first 12-image request returned HTTP 400; its USD 0.35 worst-case
reservation is retained. An 8-image calibration returned 7,952 prompt / 2,606
completion tokens, but the diagnostic recorder mishandled compressed-response
headers. Its response is retained and USD 0.09 reservation remains unknown, not
refunded or automatically retried. A fresh video generation is used for the
explicit subsequent run. Public serving revision is still an unpinned alias.

For this bounded smoke run, each visual attempt reserves USD 0.06, text/rerank
USD 0.012, embeddings USD 0.001. The private dated calibration record explains
input bounds, published processor patch limits, output cap and safety margin.
The smoke server uses eight coarse frames and one retrieval candidate to fit
the remaining approved envelope. These are conservative ledger reservations,
not actual billing; unknown reservations remain consumed. Live quality is still
being evaluated, and sparse frames cannot prove all made shots.

The live run also exposed an FFmpeg seek bug: output `-t` with `-copyts`
truncated later absolute-time windows. The duration limit now applies to input
decoding. A real 12–18 second seek regression fails before the fix and passes
afterwards; all later basketball windows produce eight valid source timestamps.
The interrupted index resumed from its completed first window without another
model call for that window. Verification: 175 backend tests, 86 frontend tests,
Ruff and contract drift checks passed.

## Final smoke result (2026-10-24)

- Full 384-second source indexed (five windows); three user questions submitted.
- First answer: source 326.1s scoreboard GS 106 / TOR 105. Browser replay verified.
- First follow-up correctly carried context but the planner returned an answer
  instead of candidate indices. The invalid response was rejected, with no invented evidence.
- Added an explicit internal planner system instruction. A fresh follow-up returned
  16.3 seconds remaining in the fourth quarter, citing the same source 326.1s
  frame. `usedContext=true`; browser replay agrees. Both accepted answers are
  `partial`, explicitly limited to sparse visual evidence and no audio transcription.
- Total: 21 model attempts (19 completed, 2 unknown), including calibration.
  Ledger reserves USD 0.960 of the approved USD 1.000. The next whole-query
  reservation requires USD 0.109 and was verified denied without dispatch.
  Both approval scopes were revoked after all attempts became terminal.
- Known provider token usage at uncached catalog rates totals approximately
  USD 0.048967, including the recorded calibration response. This is an estimate,
  not the provider invoice; HTTP400 had no usage, and unknown reservations were
  not refunded. No GPUs/dedicated endpoints were created.
- Private response records, usage summary and browser screenshot are in
  `.frameseek/tokenfactory-test/`. Local server remains available to review saved
  evidence; additional paid calls require a new explicit authorization.
- Full backend suite: 175 passed; frontend: 86 passed. After the planner prompt
  adjustment, 40 focused provider/agent tests passed again; Ruff, format and
  contract drift checks passed. This smoke does not establish exhaustive shot
  detection, production reliability or immutable serving revision reproducibility.

## Reconciliation and user continuation (2026-10-24)

The user asked to reconcile charges and continue personal testing without increasing
USD 1 or 30 attempts. The console currently shows USD 0.01 consumption offset by
USD 0.01 trial credit, account USD 125 and trial USD 0.99. The usage table has no
request breakdown yet; the downloaded monthly PDF is a snapshot, not a finalized
invoice for all 21 attempts. The USD 0.048967 figure remains a token-based estimate.

The original ledger only accumulated reservations; it had no completed-attempt
settlement path. Trusted local administration now supports `settle` and `resume`.
Schema v2 adds append-only settlement and resumption records, preserving v1 budgets
and attempts. Settlement validates completed state, owner, version, currency and
payload hash, reduces both scope counters atomically, and preserves the original
attempt amount for idempotency. It never refunds calls or unknown attempts, never
activates approvals, and repeated settlement cannot refund twice. Resume requires
an explicit human authorization reference and retains all caps/counters. Neither
operation is exposed over HTTP or ordinary runtime configuration.

For the 19 completed attempts, uncached-rate token usage with a 2x retained margin
replaces USD 0.520 reservations with USD 0.088482. Two unknown attempts keep the
full USD 0.440. Original approval resumes with USD 0.528482 occupied and
USD 0.471518 available, still 21/30 attempts consumed. One whole query currently
reserves six attempts (including possible repair) and USD 0.109; read-only admission
passed. No inference was sent during reconciliation. Remaining nine attempts
usually allow one additional complete chat turn, not nine chat messages. Current
calibration expires at 2026-10-24 21:55 JST; no expiry extension was installed.

Private audit/backup: `.frameseek/tokenfactory-test/settlement-evidence.json`,
`settlement-records.json`, `attempts-before-settlement.sqlite3`, billing screenshot.
Verification: 191 backend tests and Ruff/format/schema checks passed, including
concurrent/idempotent settlement, unknown-state rejection, two-scope rollback,
v1 migration and same-budget resumption. This is a conservative reconciliation,
not an assertion that the provider has finalized the bill.


## Restored real localhost chat with the central ledger — 2026-10-25

The user explicitly authorized restoring localhost real chat, cumulative USD20 /
40 model requests, no reset and no automatic model tests or retries. The old
local21-call USD1 approval remains inactive and untouched. Do not re-enable it.
The running loopback workspace uses the current already-approved runtime copied
verbatim from production (same validity and calibration), the existing local key,
and a `SharedLedger` adapter to production's original atomic two-scope ledger.
Its read-only binding maps the existing local owner to the existing approved
online owner; no approval/resumption/settlement/budget install is exposed by RPC.
The private helper uses the operator's existing SSH connection, no listening
port or new cloud resource. It accepts only admit/reserve/transition/read and
readonly reporting. SSH failures fail closed without retries. Unknown attempts
remain reserved. Local JSON repair is disabled, so malformed output cannot
trigger an extra automatic model request. Other routes retain existing behavior.

Private configuration/start command (contains no inline key):
`uv run --frozen python .frameseek/shared-local-chat-20261025/start.py`
The launcher reads the existing .env.tokenfactory locally, binds127.0.0.1:8765,
and selects real mode and shared ledger. Plain `make run` still defaults to the
safe fixture configuration. Do not run a second workspace on the same DB.

The existing local basketball source generation, models and index segments were
compared against production and matched exactly. All indexed frames were present;
only the manifest's existing approved budget binding was synchronized from
production. No index rebuilt and no retention/calibration extended. Local chats,
drafts and hidden flags remain in the existing SQLite store. Backup and private
runtime/binding/screenshot are under .frameseek/shared-local-chat-20261025/.

Readonly checks show both central scopes active at35/40 calls and884047/20000000
USD_MICRO occupied. Full central ledger/data/config fingerprints remain identical
before/after setup: no reserve, inference, approval change or model test occurred.
Browser Model/Budget dialog shows real-mode prerequisites met; model connectivity
was deliberately not exercised. Remaining5 calls are model requests, not5 chats;
whole-query admission may still reject requests needing more calls than remain.

Do not copy the current ledger into a separately writable local budget. Keep SSH
available; losing access must block calls rather than fall back to a local ledger.


### Single-call local short-window mode

The shared local ledger now sets direct_observations=True and allow_repairs=False.
For explicit windows of at most60seconds, a single bounded vision call returns
Chinese observations after frame-ID/schema validation; those observations become
the final answer without a text rewrite. A narrow visible-attribute followup may
reuse a unique prior source frame; ambiguous multi-frame or broad questions keep
the original bounded retrieval path. No automatic repair/retry is enabled.
Current ledger remains39/40, so one such local request can fit. This new route
has mock/saved-response validation; no new paid live test was performed.
The input area displays the read-only central request remainder. Unsupported
player ranking/statistics are explained without a model attempt.
