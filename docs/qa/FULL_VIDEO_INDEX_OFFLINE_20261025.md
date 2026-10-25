# Full-video occurrence indexing — offline increment, 2026-10-25

## Root cause and delivered boundaries

The old ingest captions only40 basketball frames. Chat verifies at most8 frames
per request. Searching those descriptions or removing a display limit cannot
recover unobserved appearances. No real video was rescanned in this increment.

New `frameseek.occurrences` is an offline observation compiler/search engine:

- An isolated, bounded ffprobe pass enumerates actual presentation timestamps,
  including short/VFR frames; no inferred FPS grid. A full catalog must begin at
  zero, preserve contiguous ordinals/PTS intervals and reach the verified video
  end. Missing/ambiguous tail duration fails closed. A plan has **zero visual
  observations**. It does not create JPEGs or modify the existing sparse index.
- Arbitrary frame-local subjects carry arbitrary fact names/values and uncertain
  fields. Conjunctions apply to one subject; unknown facts cannot satisfy negation.
  No basketball/object/color dictionary or video-specific answer.
- A complete extraction plan lists every catalog frame in batches of at most8.
  Completed batches survive private0600 atomic artifact writes/reloads. Snapshot
  CAS, source SHA256, video generation and extractor revision prevent stale
  writers, replacement of completed work or reuse with another source/config.
  This is not a provider dispatch loop: future paid workers must independently
  enforce the existing ledger and unknown/dispatched-attempt prohibition.
- Search traverses all observations and paginates **output**, rather than selecting
  top-k input frames. Neighboring positive presentation frames can form visibility
  intervals. Cuts, missing frames and unknown/nonmatching frames break continuity.
  Sparse catalogs retain points with `end:null`; no invented ranges. Equal subject
  IDs across frames never assert identity continuity. Long intervals retain two
  representative references plus the full supporting frame count.
- Coverage reports reviewed/missing/uncertain frame IDs and whether the catalog
  covers the source. `exhaustive_under_index` requires every source frame and a
  complete, unambiguous supplied object inventory. This is a contract about the
  indexed observations, **not a measured recognition-accuracy guarantee**.

The owned `/search-index` API additionally supports `all_saved`, `offset`,
`limit` and query/index-bound `snapshot`. The workbench now searches all saved
caption records in source-time order, with a load-more button. This remains
explicitly **lexical, unverified candidate browsing**, not the new structured
occurrence engine or automatic semantic understanding.

## Offline commands

These commands never load runtime credentials, approvals or model adapters.
Use a separate private artifact directory; do not write into an operational
manifest or install an approval. A full source plan can be much larger than a
sparse index and may fail the64MiB artifact/216000-frame bound; never truncate.

```sh
uv run --frozen python -m frameseek.occurrences plan \
  --source-directory /private/test-source --metadata /private/metadata.json \
  --video vid_example --generation 1 --extractor-revision offline-annotated-v1 \
  --output /private/observations.json

uv run --frozen python -m frameseek.occurrences checkpoint \
  --index /private/observations.json --batch /private/annotated-batch.json \
  --expected-snapshot SNAPSHOT_FROM_PREVIOUS_COMMAND

uv run --frozen python -m frameseek.occurrences search \
  --index /private/observations.json --conditions /private/conditions.json
```

An explicit conditions file is an AND list, for example
`[{"field":"clothing","value":"white"},{"field":"kind","value":"person"}]`.
It must use the observation vocabulary. This increment does not implement an
automatic natural-language-to-predicate compiler, multilingual semantic retrieval
or visual extractor. Manual/fixture annotations are not real recognition.

## Verification

-291 backend tests and138 frontend tests passed; build, Ruff, formatting, schema
  export and whitespace checks passed. All provider transports in the suite use
  isolated mocks; no operational ledger is installed or reset.
- Full-plan resume/CAS and reload, arbitrary fields across different domains,
  same-subject AND, unknown negation, repeated appearances, short and final-frame
  appearances, cuts, unreviewed gaps, sparse catalogs, end-to-end offline command
  search, bounded long-interval evidence and95-hit pagination have regressions.
- A real generated2-second10FPS clip was decoded into20 original-time catalog
  entries and3 pending batches; zero observations/JPEGs were fabricated. Separate
  VFR timing fixtures preserve sub-second frames and reject invalid PTS.
- Isolated localhost:8766 browser: synthetic parcel clip, prominently labelled
  MOCK. Queried all8 saved descriptions without Send; sought15.75s (readyState4,
  paused), retaining the typed question and zero chat cards. Pagination and late
  responses across navigation are covered by frontend regressions. QA reported
  zero real requests; its2 mock ingest requests touched no operational workspace.
- Local service was restarted with the existing private launcher (no `--check`
  dispatch admission bypass). Before/after fingerprints match for all3 sources,
  9 query rows and8 investigations. Browser reload restored seven basketball
  cards, the original draft “整个比赛 多少个3分球投入？” and40/40 exhausted
  budget banner. Private screenshot: `local-preserved.png` in the same QA folder.
  Private screenshot: `.frameseek/full-index-offline-20261025/candidate-browser.png`.

## Not yet accepted

Real basketball still has a sparse index. Its full occurrence timeline has **not**
been generated, and no deployment or existing-index migration was performed.
The structured engine is usable through offline artifacts/CLI, not connected to
production chat or upload ingestion. The next integration requires a budgeted,
generation-safe visual extractor/JPEG worker plus grounded query interpretation,
followed by annotated real-clip recall/precision and temporal-boundary evaluation.
This work intentionally made zero model calls and changed no approved limits.

## Actual local page recheck — user-requested acceptance

On the user's existing basketball page (127.0.0.1:8765, tab17), used the actual
input and **查找已有画面** button, without Send:

- `white jersey` returned0 caption candidates. No cross-language semantic search.
- `找出穿白色球衣的人，列出所有出现时间` returned40/40 caption candidates,
  including descriptions without a confirmed white-jersey subject. Broad lexical
  token overlap is not criterion matching or full-source occurrence recognition.
- Clicked05:58 candidate: actual player358.433333s, readyState4. Returned using
  the existing05:26 reference to326s, readyState4. Restored original draft
  “整个比赛 多少个3分球投入？”; seven visible chat cards retained.

**Product acceptance: FAIL / incomplete.** Existing candidate browsing and seeking
work, but the requested full-source semantic chat journey is not implemented.
Backend/frontend test counts must not be described as this journey passing.
No model request was sent. Private screenshot:
`.frameseek/page-acceptance-20261025/incomplete-semantic-search.png`.

## Page integration supersedes the offline-only boundary — 2026-10-25

The latest increment connects the engine to owned HTTP APIs, the actual composer,
existing durable query history, original player and a paginated interactive timeline.
The default upload-source composer now selects **索引问答 · 不调用模型**.
Explicit **模型分析 · 使用预算** remains on the original guarded route.

- `POST /api/videos/{id}/occurrences/search`: source/generation-bound full indexed
  observation traversal, same-subject predicates, original-time evidence, coverage,
  clarification, property filters, immutable pagination snapshots. It reads private
  `observations-gN.json` artifacts bound to the original source SHA256 and duration.
- `POST /api/index-chat/prepare` and `/api/index-chat`: no provider/runtime/approval
  dispatch; results append to existing owned query history atomically with request
  idempotency, payload conflict/history bounds and source/chat generation checks.
  Existing model request hashing is unchanged. Index responses use schema0.1 and
  never promote caption candidates to verified evidence events. Chat shows up to20
  intervals; the timeline continues through all output pages.
- The timeline exposes original references, clickable range markers, conditions,
  reviewed/missing/uncertain frames, original extraction provenance and explicit
  full-coverage limits. Unknown query conditions require clarification. Explicit
  chosen properties replace the text question and are labelled accordingly.
- General bilingual visual concepts and per-index arbitrary multilingual aliases
  align questions to source facts. All conditions must ground in the index and
  apply to one subject. Legacy caption search requires ALL interpreted concepts,
  replacing the previous any-character overlap. This is bounded concept alignment,
  **not acceptance of arbitrary paraphrases, dense-vector semantic recall or new
  visual recognition**. No local or hosted model was executed.

### Actual browser acceptance

An isolated localhost:8766 service used **no runtime, provider, credentials or mock
model transport**. Its uploaded generated clips have real decoded frame PTS and
explicitly synthetic manual object labels. A persistent warning identifies this
as integration evidence, not recognition-quality evidence.

1. Sent the Chinese whole-video white-jersey question from the actual composer:
   three indexed intervals,00:00–00:02,00:04–00:06,00:10–00:12. Opened the saved
   answer timeline; all three seek buttons produced exact0/4/10s, paused, ready4.
2. Refreshed: saved chat and default zero-model mode restored. Sent the English
   equivalent: the same three intervals and a second durable chat card.
3. Switched to the separately annotated parcel source. `find red box` found48
   intervals. Loaded40→48/48; all48 result rows and48 timeline markers appeared,
   including the final11.75s occurrence. Click sought11.75 exactly, ready4.
4. Withheld one annotation in the synthetic fixture only: UI reported95/96 frames,
   one missing frame and incomplete coverage, with47 matching intervals. Restored
   the disposable fixture afterward; no operational index was edited.
5. `red box jumping` requested clarification instead of ignoring `jumping`.
   Selected explicit `color:red` AND `kind:parcel` via actual checkboxes and Apply:
   retrieval resumed with clearly stated selected conditions.
6. Switched between the two sources: independent chat cards and the unsent
   `red box jumping` draft restored. No chat or draft crossed sources.
7. QA status after browser operations: real_model_requests0, provider_configured
   false, synthetic_annotations true, operational_workspace_used false.

Private screenshots/seek checks: `.frameseek/index-page-20261025/`.

### Actual existing basketball workspace, no model

The real localhost:8765 page retained seven prior cards and original draft
“整个比赛 多少个3分球投入？”. Sent one **index** question using the composer;
it added one durable index answer, without replacing the old chats. Chinese and
English white-jersey descriptions both retrieve19 matching caption candidates
from40 saved descriptions, rather than the old40/40 and0/40 respectively.
The answer and timeline explicitly state that a complete object-observation index
is missing; these are not confirmed full-source appearance intervals. Original
draft and326s playback position were restored. No operational full-scan, source
index replacement, retention extension, budget change or model call was made.

The complete structured page workflow passes on annotated integration data.
Real-video all-occurrence recognition remains unaccepted until actual full-source
observations exist and recall/boundaries are independently evaluated. The new page
connection does not waive this gap, and no synthetic annotations were installed
for the real basketball or box videos.


Latest preservation audit: all3 operational source rows and all9 pre-existing
local query rows match their before-test fingerprints. One new local index query
was appended. Production attempt/budget/settlement/source/query and private
configuration fingerprints match the prior40/40 audit exactly; no deployment was
performed. Later UI regression corrected the contradictory no-result announcement
for caption candidates: index results now have index-specific labels and do not
claim new model review. Aggregate/count/ranking questions remain explicit
clarifications, not fabricated zero-occurrence answers. The original draft and
326s playback position are preserved.

Final verification:297 backend tests and140 frontend regressions passed;
`npm run build`, Ruff, format, schema export and whitespace checks passed.
The no-provider QA service reported0 attempts and was stopped, and its temporary
browser tab was closed. The actual local workspace remains running with8 cards,
original draft,326s player position, saved state and default index mode. Its
budget banner explains that free index retrieval remains available at40/40.
