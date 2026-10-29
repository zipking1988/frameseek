# Reusable knowledge index: local QA, 2026-10-29

This is a development check, not the 20-case acceptance run.

- Isolated workspace and browser on `localhost:8778`; original user workspace,
  budgets and production deployment were not changed.
- A six-second basketball clip was created from approximately 05:04–05:10 of the
  original. The clip has its own zero-based timestamps; those are not original
  video timestamps. The only visual inference used the installed local model.
- Upload automatically completed one base-index segment. The page held new chat
  during indexing while the video remained playable. The question “找出视频中出现的人”
  returned six sampled positions; clicking 00:01 moved the clip player to 00:01.
- The earlier extraction contract returned blue jerseys in only four of six sampled
  clip frames. Manual inspection showed blue jerseys in all six frames. After a
  revised prompt, schema and compound-attribute matching, a new independent run
  returned all six. This is a six-frame, single-query observation, not a general
  precision/recall result and not proof of full-video coverage.
- Synthetic fixture page checks exercised bounded supplement, its updated version,
  follow-up and evidence recovery. Synthetic observations are not recognition
  quality evidence. Paid Token Factory was not called; the new contract has no
  verified production cost calibration.
- An initial real multi-attribute question (“蓝色球衣并戴黄色头带”) remained
  unanswered after a multi-image supplement. Inspection showed that the model
  reused descriptions across frames and returned separate values for the garment
  and its color. The follow-up implementation now verifies one candidate frame
  at a time. A subsequent isolated real-frame test recognized the visible
  headband at approximately 05:09, but also reported one at 05:04 where the wide
  shot did not provide clear evidence. The model output did not reliably include
  a person type and used inconsistent color fields. A second local yes/no/uncertain
  check returned no for the 05:04 frame and yes for 05:09. After adding per-frame
  verification and attribute normalization, an isolated browser run returned one
  match at clip 00:05; clicking it displayed the blue jersey and yellow headband.
  The clip begins at approximately 05:04 in the original. This is one case only,
  not proof that other wide shots or attributes meet the accuracy threshold.
- A separate 18-second synthetic box video was uploaded to an isolated local
  workspace and built into three base segments using the local model. On the page,
  “视频里箱子出现在哪些时间？请列出画面证据。” initially caused an unnecessary
  supplement: the parser treated the words for “which times” and “visual evidence”
  as object attributes. The in-progress local-only supplement was explicitly
  stopped and its ambiguous receipt retained. After fixing the parser, a separate
  workspace copy using the same completed index returned 18 sampled timestamps
  without a new model call. A second wording reused the index, selecting 00:01
  moved the player to 00:01, and both answers survived reload. This synthetic
  example is not a substitute for a human-labelled quality evaluation.
- A page query for a brown box then exposed another unnecessary supplement:
  the English indexed attribute `brown` was not mapped to Chinese “棕色”. After
  adding that general color alias, a separate page run answered from the existing
  index with zero new calls. A regression also checks that a box cannot inherit
  a different subject's color. Three sampled box frames were visually inspected;
  this is not a full 18-frame or human-labelled quality assessment.
- “有没有” was incorrectly parsed as a negative constraint because it contains
  “没有”. The parser now recognizes this existence-question form while retaining
  actual negations. A separate page run of “视频里面有没有棕色箱子？” returned
  the same indexed evidence with zero new calls; a regression checks that
  “有没有不戴红色帽子的人” remains a negative condition.
- In the isolated page, a follow-up “它出现在哪些时间？” after the brown-box
  question reused the indexed description and returned evidence without a new
  call. The prepare and execution paths now resolve this narrowly defined
  follow-up consistently. Ambiguous multi-subject contexts are rejected, and
  the answer states that matching the earlier description does not establish
  that an object is the same individual across shots.
- Quoted visible-text queries now match substrings of the structured `text`
  field only; ordinary descriptions cannot satisfy them. Synthetic integration
  checks verify that an indexed match goes straight to retrieval without new
  model calls. Real-source text accuracy and the browser flow are still to be
  checked after the full basketball index is published.
- The same page test found that the source picker and library displayed
  “可以提问” immediately after preflight even while knowledge indexing ran.
  They now use the separate knowledge status and show segment progress; a
  frontend regression covers both locations and the transition to ready.

Further multi-attribute basketball tests, real and synthetic box evaluation,
labelled 20-case suite, whole-source acceptance, production deployment and
cloud-path calibration remain required before enabling this by default.
The offline `knowledge_evaluation.score_cases` helper reports real and synthetic
scores separately. It requires an independently supplied catalog from the owned,
validated index version, matching source fingerprints and versions, all sampled
frames in each declared time scope, distinct question/scope cases, and human-review
metadata. It also checks the case count, category coverage and precision/recall
thresholds. A catalog cannot itself establish who reviewed a case, the accuracy of
the label or whether the selection is representative. Its unit tests use synthetic
scoring data and are not acceptance cases.

## Full basketball source: isolated local page check

- A byte-for-byte copy of the 06:24 original completed all 49 base segments in
  a separate local workspace. The existing user sources and investigations were
  not changed. The sampled timestamps in this test are original-video times.
- The page question for `NBA FINALS` between 01:12 and 01:14 used the existing
  index, returned 01:12 and 01:13, and a click moved the player to 01:12. The
  01:12 original frame visibly contains that text. No new model call was needed.
- The first real multi-attribute supplement incorrectly rejected 05:09 even
  though the blue jersey and yellow headband are visible. The verifier had been
  sent the time and output-format instructions as if they were visual features;
  a new local-only supplement contract strips those instructions and requests
  separately named item colors. Its stored verification accepted 05:09 and
  05:10. A second bug prevented the query engine from joining `headwear` with
  `headwear_color`; after fixing that, the page reused the stored supplement,
  returned both original timestamps, and clicking 05:10 showed the matching
  original frame. These are two sampled frames in one selected interval, not a
  20-case human-labelled evaluation or proof of all appearances.
- Sending the same basketball question again returned the same two timestamps;
  the local supplement receipt count stayed at 30 before and after. Reloading
  recovered the three page answers and the 05:10 player position.
- A subsequent “他出现在哪些时间？” follow-up kept the earlier 05:04–05:12
  scope, returned 05:09 and 05:10 from the same index with no new model call,
  and explicitly avoided asserting a cross-shot identity.
- A later page regression showed that “继续这个问题” after that follow-up could
  start a new local supplement despite unchanged index and conditions. The test
  stopped it; one local dispatch remained unknown and was retained, not replayed.
  After the routing fix, the page returned the same 05:09 and 05:10 from the
  existing index with no further inference. This did not involve a paid call.
- An offline regression found that two unbound color values and two clothing
  items on one subject could be incorrectly combined into colored garments if
  no compound facts existed anywhere in the index. Such a query now requires an
  explicit item/color binding and may need supplement or clarification. The
  trusted synthetic integration fixture was updated to record its intended
  garment/color pairs explicitly; this is not new real-world accuracy evidence.
- No Token Factory request was sent and no paid ledger was changed. The two
  local supplement contracts, including the initial failed one, are retained in
  the isolated test workspace; there was no retry of an unknown cloud dispatch.

## Local processor identity hardening

The local knowledge processor now fingerprints tokenizer, preprocessing and
other model configuration files alongside the weights. It refuses a model file
change during hashing or inference, and replaces an idle local worker whose
loaded revision cannot be established. A cancelled or failed base job whose
existing checkpoint belongs to a different processor identity is not silently
restarted or recharged; restoring the matching processor permits resume. This
changes local processor identity, not already published index contents. Existing
published versions and previous answers remain readable; a controlled migration
is still needed if an operator wants to replace a completed index. Synthetic tests
cover file mutation, worker replacement and preservation of checkpointed work.
An isolated two-second synthetic upload also completed its one-segment index
using the updated local processor, and the earlier basketball answers remained
visible after restart. No cloud inference or budget change occurred.

## Review gate integrity

The offline scoring gate now requires a catalog from the validated source and
index version, all sampled frames in each declared scope, distinct questions,
and reviewed follow-up and seek records. Seek records must reference a sampled
frame and show the player landing within 0.25 seconds of its timestamp. These
records are reviewer attestations; the scorer does not independently verify
the recording or establish that the cases are representative. Synthetic scorer
tests are not the 20 human-labelled real/synthetic quality cases, which remain
outstanding. No model request was sent for these checks.

## Cloud extraction preflight

The Token Factory knowledge processor now derives admission from its own
source-matched checkpoint store rather than caller-provided window counts.
Saved replies are reusable only after validating their frame records, source,
extractor and response structure; an unanswered dispatch remains blocked.
The check does not reserve budget or make a model request. An explicitly gated
Token Factory base worker now uses this preflight in the upload workflow.
Synthetic HTTP transport tests cover upload, one indexed batch, two index-only
questions, cancellation after a saved response, and rejection without an active
approval. These tests establish wiring, not live model quality. The feature is
off by default; real extraction calibration and live acceptance remain open.
Cloud supplement execution is also wired behind its own calibration contract;
isolated mock tests cover the bounded plan, cached responses, both ledger scopes
and HTTP upload-to-answer flow. No real request or ledger change was made.

## Index and budget status clarity

The workspace now distinguishes an index waiting for configuration or budget
from a completed index, and identifies the cloud supplement path as cloud-based.
The playable-video status uses completed media metadata instead of an unrelated
legacy analysis state. A supplement budget wait keeps the draft and explains the
reason without automatically retrying. The isolated basketball page was reloaded:
its six saved answers, 05:10 position and ready local index remained visible.
Cloud-budget states were verified with frontend fixtures, not a live cloud call.

## Supplement publication after cancellation

An interruption between writing a supplement checkpoint and updating its
database version could leave a checkpoint ahead of the published index. The
supplement worker now reads its explicitly published base version and stages a
separate immutable candidate; only the existing owner/generation/revision CAS
can select that candidate. Cancellation or a failed CAS leaves the old version
and checkpoint intact. A synthetic regression interrupts immediately after
staging, then resumes from saved receipts without another model call. The same
published-version input is used by cloud preflight. This does not validate live
recognition quality or change existing history or budgets.

## Restart recovery

On workspace restart, an interrupted base-index job is now marked manually
resumable only when its generation-specific durable dispatch markers all have
saved responses (or no dispatch marker exists). An unpaired marker, missing
cache directory, symlink or inspection error remains `unknown` and cannot be
automatically resent. Resumption still validates saved response structure and
requires current approvals before any paid dispatch. Isolated restart and
compiler tests cover both classifications; no live call was made.

## Reuse of visible subject–object relationships

The real local basketball index already contained `action=holding basketball`,
but a Chinese question about a person holding a basketball could not resolve
it. The parser now maps supported bilingual action/object terms only when one
subject has the combined relation as one recorded fact; it does not pair facts
across subjects or assign a person's color to the object. On the isolated page,
“视频里有没有拿着篮球的人？” returned 16 sampled index hits without inference;
the 01:28 evidence button sought to 01:28, whose saved frame visibly shows a
player holding the ball. This spot check is not verification of all 16 hits or
the required human-labelled quality evaluation. The source video was not
reindexed and no cloud call was made.

## Read-only cloud supplement admission

The automatic chat preparation endpoint now checks supplement calibration,
durable receipts and both budget scopes before asking the worker to start. It
returns a worst-case request and cost estimate when admitted, and blocks missing
configuration, insufficient authorization or unknown receipts without dispatch.
The page shows the request upper bound during cloud processing. Execution still
rechecks admission and reserves each attempt. Synthetic HTTP and frontend tests
exercise the no-approval and missing-calibration cases; no live model call or
budget modification was made.

## Refresh while a supplement is running

The owned investigation request list now exposes unfinished supplement state
and the original input for new jobs. On refresh, the page can recover a running
job or turn an already completed supplement into an index-only answer. Unknown
or failed jobs are not resent; a draft edited during recovery is preserved, and
switching investigations prevents a late answer from being posted. Older jobs
without stored input remain readable but cannot be automatically reconstructed.
HTTP ownership tests and frontend deferred-request fixtures cover these cases.
In a separate browser session with a two-second synthetic clip and an explicitly
labelled delayed fixture processor, a page refresh during supplement processing
showed the running task and preserved its input; after completion, “恢复查询”
returned the labelled synthetic answer, and a second refresh retained it. No
real model, user media or paid ledger was used. This is not a live paid-model or
human quality test.

A follow-up page regression confirmed that, after recovery, the unchanged
submitted question is cleared so it cannot accidentally be sent as a follow-up.
A draft edited during recovery remains intact; the separate deferred-input test
covers that case. The synthetic answer and empty composer survived refresh.

During the isolated page check, clicking the 01:28 evidence initially did not
schedule a save for the playback position. Explicit evidence seeks now trigger
the existing debounced save without treating continuous playback as an edit.
After the saved indicator appeared, a page reload restored 01:28 and all seven
test answers. The running-supplement refresh branch remains covered by mocked
HTTP/frontend regressions and the synthetic browser flow rather than a live
cloud call. The same browser check found that preflight metadata was labelled
incomplete while model configuration was pending; that label is now corrected.

## Cross-window sampling

The old compiler enforced the one-frame-per-second interval within each
8-second window but not between adjacent windows. New extraction filters
boundary-conflicting decoded frames before any inference and refuses publication
if the global spacing is invalid. Frame identity, timestamp and within-window
spacing are also structurally checked before dispatch. If a short window has no eligible frame, the
job stops with completed checkpoints intact; it does not send an empty batch.
For a final window shorter than one second, the preceding new batch now keeps an
earlier eligible sample where possible, leaving room for the tail sample. A real
FFmpeg variable-frame-rate synthetic clip (8.4 seconds, sampled at 0–6 and 8
seconds) was indexed with a labelled fixture processor; its isolated browser
page displayed the 00:08 evidence and sought to that time. The fixture's person
labels are synthetic and establish no recognition quality.
Previously saved responses are never silently reinterpreted or resent, and
historical published versions remain readable. Synthetic boundary regressions
cover filtering, interrupted receipts, an empty final window and old versions.
The previously tested basketball index has no sub-second neighboring samples;
it was not rebuilt or reprocessed.

## Unreviewed quality-case preparation

A private, ignored draft packet now contains 20 unlabelled sampled-frame cases:
10 from the existing basketball source and 10 from the synthetic box source.
Frame references retain their exact source/index version and time; no media was
copied or published. Sixteen cases produced index-only predictions and four
required clarification. Predictions are stored separately from the unlabelled
review packet. The scorer now requires an explicit, consistent yes/no review
for every sampled frame, so an omitted frame cannot silently count as negative.
The packet is a draft, not human-reviewed ground truth or an accuracy result;
the required follow-up and seek reviews also remain outstanding. No model call,
index rebuild, approval change or cloud dispatch was made.

The draft can be rendered with `scripts/prepare_knowledge_review.py`, using an
active private workspace and the unreviewed packet. It verifies ownership,
source fingerprints, index versions, exact sampled frame references and expiry;
the generated standalone page embeds those images, hides predictions and blocks
network connections. The page and its downloaded labels contain private data
and must stay local. A synthetic browser test checked that “uncertain” exports
as unreviewed and an explicit yes exports a positive label; no real case was
labelled by the test. A human must still perform the real reviews, verify source
classification and collect follow-up/seek evidence. The separate prediction
records must be matched to the same source, question, scope and index before
scoring; they are index-only results, not browser-journey verification.

`scripts/score_knowledge_review.py --workspace WORKSPACE --cases PACKET
--reviewed LABELS --output REPORT` rechecks those bindings and recomputes the
sampled-index predictions rather than accepting predictions from the labels.
Clarification cases are reported separately and prevent acceptance. An offline
run against the still-unreviewed packet counted zero reviewed cases and four
clarifications; it did not produce accuracy figures. Its acceptance scope is
limited to reviewed sampled-index results: reviewer identity and real/synthetic
classification are self-attested, and browser journeys and production-model
quality are not scored. The script sends no model requests and writes a private
report without overwriting existing files.

## Known concepts absent from the index

Queries for a known object kind or an object's color no longer require the
specific value to have appeared in a prior observation, provided the index
actually uses the corresponding `kind` or `color` field. Matching still binds
all requested conditions to the same subject, and incomplete inventory and
sampling remain uncertain. This does not infer color-to-garment or cross-frame
identity. On the isolated synthetic-box page, “有没有人物？” returned no indexed
match with an explicit incomplete-coverage warning and zero model calls. The
four previously clarifying draft cases now produce zero index hits, but none
has been human-reviewed, so this is not a recognition-quality result. The
older private prediction and unreviewed-score files predate this fix; rerun the
scorer after review instead of treating them as current results. The production
service and user workspace were not modified.

A subsequent read-only rescore of the same unlabelled packet against its exact
original isolated workspace produced zero clarification cases, zero reviewed
cases and 20 `not_human_reviewed` issues. The private recheck report is
`unreviewed-score-recheck.json` beside the packet. It remains **not accepted**;
zero clarifications is not a precision or recall result. No model was called,
and the original packet, source versions and user workspace were not changed.

## Composer tools layout

At a 1280×720 isolated browser viewport, opening the conversation tools and
advanced settings squeezed the settings copy into a narrow vertical column.
The conversation menu now uses a bounded vertical layout; the canvas settings
open as a separate panel instead of expanding the composer. Switching views
closes the advanced settings. Both expanded states and the view transition were
checked in the isolated synthetic-box page; no question or model was sent.

## Reusing an index when the local processor is unavailable

An enabled local knowledge route previously became disabled when the local
vision processor was missing, which made a ready published index inaccessible
to unified chat. The opt-in route now remains active and serves existing index
results; a missing processor stops supplemental work and does not cause a
legacy model call. The source status distinguishes queryable existing knowledge
from unavailable local supplementation. In an isolated browser workspace, with
local vision disabled and the saved synthetic-box index intact, a question
returned 18 sampled timestamps and reported zero model calls. This verifies
index reuse, not recognition accuracy or cloud availability.

## Cloud provider mismatch

With the Token Factory knowledge route explicitly enabled, a different valid
runtime provider previously disabled the knowledge gate and could expose the
legacy chat path. The opt-in now keeps the unified gate active even when the
provider is mismatched; the existing processor checks still refuse to dispatch
without Token Factory configuration. An isolated HTTP test with a Gemini mock
runtime verifies the old chat route is rejected, the unbuilt index is reported
as not ready, and no model request is sent. It does not exercise a live provider.

## Explicit time ranges can locate missing text

An AI inspection of the isolated basketball source found “NBA FINALS” visibly
present at 05:04 and 05:11, while the corresponding published observations did
not record a `text` fact. The index therefore missed these frames; this was an
extraction gap, not evidence that the text was absent. For a short explicit
time range covering at most two existing windows, supplement planning can now
use that user-specified location even when no indexed term provides a lead.
It selects only sampled frames within the range; without a bounded location it
does not automatically scan the whole source. A synthetic processor test
verifies that a newly observed text fact can be searched and reused while the
old version remains unchanged. The real basketball frames were not reprocessed,
and the new plan is not a claim that the extraction miss has been fixed or that
production inference has passed acceptance.

The bounded missing-text path was also exercised through an isolated browser
page with a two-second generated test pattern and an explicitly synthetic
fixture processor. The fixture invented `EXIT` for testing; the video itself
does not contain that text, so this checks control flow only. After the first
question, the page returned 00:00 and 00:01 with synthetic provenance; clicking
00:01 sought the player. Repeating the question returned the same timestamps
without adding dispatch markers (five before and after, including base and
fixture supplement). Refresh retained both answers and the 00:01 position.
No real model or cloud call was made.

An exploratory local OCR check used the installed Tesseract English data on the
eight already-extracted frames from 05:04–05:12, through the existing media
sandbox. It made no provider request and changed no index. With page-segmentation
mode 11, the exact phrase was returned for 05:04, 05:05, 05:07, 05:08 and 05:11;
mode 6 additionally returned it at 05:06. Neither mode returned it at 05:09 or
05:10, although an AI visual inspection of 05:09 could read the small broadcast
overlay. OCR also returned unrelated and garbled text. This is a small exploratory
check, not a human-reviewed accuracy measurement. It suggests a possible
model-free *candidate* source, but OCR output cannot be treated as verified
text evidence. Tesseract availability and Linux sandbox behavior still need
verification.

The optional OCR candidate path is now connected to the index timeline when
`FS_OCR_CANDIDATES=1` and Tesseract is available. It is off by default and is
not deployed. It processes at most eight saved frames in an explicit range of
up to eight seconds using sandboxed English OCR; output is labelled unverified,
does not modify knowledge, and reports failed frames. In the isolated basketball
page, the original 05:04–05:12 query yielded five OCR candidate frames and a
click on 05:11 sought the original player. This is not exhaustive recognition
and does not replace the uncompleted human quality acceptance. No provider
calls were sent. Ownership, CSRF and generation checks were covered by HTTP
tests; Linux execution and production deployment remain unverified.

The OCR candidate search now tries a second segmentation mode only when the
first has no exact match, with a 20-second overall deadline and explicit failed
frame reporting. On the same isolated basketball page it returned six candidate
times, adding 05:06 to the earlier five; 05:09 and 05:10 were still missed.
The extra mode may also introduce false positives, so every result remains an
unverified candidate. Synthetic tests cover fallback, deadline exhaustion and
frame-path checks; the page is not a human-labelled accuracy evaluation.

The timeline now binds asynchronous OCR and pagination results to the selected
filter revision. If a user changes filters while either request is in flight,
the old result can no longer replace the newer results. Deferred-network
frontend tests exercise both races; this does not cancel an already running OCR
process or constitute a live-model quality test.

The candidate action is also available when the index already has some
matches. It keeps those observations visible and adds only OCR frame IDs not
already represented by them, marked as unverified. In an isolated real-source
page check for 01:12–01:14, both observed frames remained visible and the same
two OCR matches were not duplicated. A synthetic UI regression separately
checks that a distinct candidate remains alongside an existing observation.

For a frame with no match in either normal-resolution pass, the optional OCR
path now tries a bounded full-frame enlargement, without video-specific crops.
On the isolated basketball page, this produced candidates for all eight sampled
frames from 05:04 through 05:11, including the previously missed 05:09–05:10.
The temporary resized image is removed and the returned reference remains the
original indexed frame. This one query is not evidence of general recall or
precision; results remain candidates and the 20-second deadline still applies.
The new fallback has not been validated on the deployed Linux host.

## Local visual supplement on the real text miss

On a separate copy of the full basketball workspace, a local Qwen visual
supplement for 05:04–05:06 initially extracted `NBA FINALS` but its verifier
rejected both frames. The verifier prompt still included the output instruction
“出现时间”, which is not itself a visible condition. The visual-question
normalizer now removes that trailing instruction while preserving quoted text.
Separately, repeated provider subject labels are assigned distinct frame-local
IDs without combining their facts. After those changes, a new local-only page
run returned 05:04 and 05:05; 05:04 sought to the original video time, and a
follow-up used the saved index with zero additional model calls. Refresh retained
both results and the playback position. This is two frames in one source, not
the human-reviewed acceptance set. The original user workspace, cloud service,
budgets and approvals were not modified.

The changed supplement prompt uses contract v6 and requires a matching new
cloud calibration; an old v5 calibration is rejected. A v5 dispatched receipt
without a saved response blocks the v6 attempt rather than being automatically
resent. Fixture tests cover that guard and duplicate-label isolation. No cloud
calibration or live Token Factory call was performed.

## Fresh local upload and index reuse

A clean, isolated local workspace and browser session uploaded an 18-second
synthetic box video through the page. Preflight completed and the local Qwen
processor built three base segments; the page kept new chat disabled while
indexing and enabled it when ready. “视频里有没有箱子？” returned 18 sampled
times from the index; clicking 00:01 sought the original local video. A
follow-up “它出现在哪些时间？” returned the same indexed times and reported no
new model call. The workspace had three base dispatch receipts and no
supplement jobs after both questions. Refresh retained both answers, a draft,
and the 00:01 playback position. This is a synthetic source with local model
inference, not a fresh judge-accessible production session, human-reviewed
quality measurement, or Token Factory execution. No cloud request was made.

## English questions against the existing index

In the isolated synthetic-box workspace, the browser submitted “Is there a box
in the video?” followed by “When does it appear?”. Both read the existing index
and returned 18 sampled references with zero new model calls; the follow-up
retained the distinction between matching a description and tracking an identity.
A reference sought to 00:00, and a page refresh preserved both answers. The
local visual processor was disabled for this check; no cloud request was made.
The interface and answers remain in Chinese, and this narrow language check is
not the required human-reviewed recognition-quality evaluation.

## English time ranges

The common English forms `from 00:04 to 00:06` and `between 00:04 and 00:06`
now use the same bounded parser as Chinese ranges. A bare pair joined by `and`
is not assumed to be a range. In the isolated synthetic-box browser session,
“Find a box from 00:04 to 00:06” returned only the sampled frames at 00:04 and
00:05, and “When does it appear?” retained that range. Both used the saved
index with zero new model calls. This is a scoped retrieval check, not a
real-material accuracy result or a production Token Factory test.

The optional OCR button now recognizes the same English time-range forms as the
backend and appears only for a valid range of at most eight seconds within the
video. In the isolated synthetic-box page, after reloading the rebuilt frontend,
`Find text "EXIT" from 00:04 to 00:06` exposed the OCR action; running it examined
two saved frames, reported zero candidates and zero failed frames, and sent no
cloud request. Frontend tests additionally cover the `between ... and ...` form,
invalid ranges and the existing late-result race. This does not establish OCR
accuracy or enable the optional feature in production.

## Quoted timestamps versus search scope

Quoted visible text is now excluded from time-range parsing while its characters
and offsets remain intact for text retrieval. In an isolated browser session,
`Find text "00:04 to 00:06" from 00:08 to 00:10` retained the quoted string as
the text condition and searched two sampled frames in the specified scope; the
optional OCR action was also available. Regression tests verify that a quoted
range alone cannot become a video scope, and that a separate scope still works.
This check used a synthetic video and no model or cloud calls.

## Bound attributes in new local base indexes

The existing basketball index stores examples such as `garment=jersey` and
`color=white` separately. Without an explicit item/color relationship, those
facts do not safely establish the color of a specific garment. New local base
builds now use a v4 extraction prompt requesting a single value such as
`garment=white jersey`. Old v3 local jobs are resumed with their original prompt
only when their full source/generation/model/cache identity matches; completed
published versions are untouched. The local supplement processor and its receipt
identity remain v3, and Token Factory base extraction remains separately
calibrated v3; no paid calibration or call was made.

In an isolated page, a new two-second clip cut from basketball source 01:20–01:22
was uploaded and indexed by the local Qwen model. After the one base receipt,
separate questions for white and blue jerseys each returned the two indexed clip
frames at 00:00 and 00:01 with zero additional model calls; clicking 00:01
sought to that time **in the clip**, not the original full source. No supplement
receipt was created. A separate one-frame exploratory inference produced both
colored jersey values but also described white headbands that need verification.
This is not a human-reviewed accuracy score, a full-video result, or a production
Token Factory validation. Existing basketball and box histories were not changed.

## Token Factory v4 preparation

The bound-attribute prompt is now available to the opt-in Token Factory worker
under a distinct `video_knowledge_extraction_v4` calibration contract. A v3
calibration does not authorize v4 and vice versa. The cache key and provider
request identity include the matching extraction configuration; a resumed job
with a different prompt configuration fails before a new dispatch. Existing
unknown markers remain blocked. Mock-only tests cover v3/v4 upload-to-answer,
the absence of synthetic approvals, both ledger scopes, and cached response
reuse. No real v4 calibration, live Token Factory request, budget increase,
new approval, or deployment has been performed. The v4 production path and its
recognition quality therefore remain unverified.

## Text search condition display

The timeline labels a visible-text substring predicate as “包含” (contains)
instead of “是” (equals). A local browser test uploaded the synthetic box clip
into an isolated workspace with an explicitly synthetic extractor that supplied
`EXIT SIGN`, then searched for `EXIT`; the page showed `text 包含 EXIT` and the
fixture's sampled results. The synthetic text was injected by the test and does
not establish that those words are visible in the clip. No model was called.

## Multicolor clothing and object-color extraction

In exploratory local inference on the original basketball 05:09 frame, the model
returned `garment=blue and yellow jersey` together with `headwear=yellow
headband` on one subject. The prior structured compiler could not match the
single-item multicolor value to a blue-jersey query. It now accepts each color
when exactly one garment type is present in that one observed value; values
containing multiple garment types remain ambiguous and cannot cross-bind colors.
A fixture regression checks the same-subject and distractor cases. This is not
an independent human accuracy review.

On an isolated synthetic-box frame, the v4 local prompt omitted the visible box
color; an exploratory revised prompt returned `kind=box, color=brown`. New local
base builds now use that revised v5 prompt. V3/v4 checkpoint identities and
supplement receipts remain unchanged; the Token Factory v5 code path requires
its own calibration. In a separate local page test, a newly created two-second
synthetic box clip completed its v5 base index, and a brown-box question returned
00:00 and 00:01 with zero new model calls; clicking 00:01 sought within the clip.
There was one local base dispatch and no supplement dispatch. The clip and model
output are not a human-reviewed accuracy benchmark. No cloud request, paid
calibration, approval, budget change, or deployment was made.

## Multiple indexed forms of one garment

A source may contain both `blue jersey` and `blue and yellow jersey` in the
same garment field. Previously the parser treated the two indexed values as an
ambiguity and returned no results. The new bounded `color_item` condition
matches either single-item value on the same frame-local subject. Values that
mix garment types remain uncertain, and an explicit `is` filter remains exact.
An isolated browser test used synthetic extractor outputs for a two-second
basketball clip: the blue-jersey question returned both saved frame references
with zero model calls. This checks retrieval of fixture facts only; it does not
establish the visual model's accuracy. No cloud request or existing source
modification occurred.

## Mixed compound and named item colors

A base observation can store `headwear=yellow headband`, while a verified
supplement can store `headwear=headband` with `headwear_color=yellow`. The
retriever now handles both forms when they refer to the same field, without
combining facts across subjects or guessing among multiple items or colors.
Missing and uncertain named colors remain unknown. An isolated browser test used
synthetic extractor outputs for these two forms on a short basketball clip; a
blue-jersey/yellow-headband query returned both saved frame references with no
model call. The fixture facts are not a visual-recognition accuracy result.

## Repeating a completed supplement

The automatic planner now reuses a completed supplement when owner, investigation,
source generation, desk epoch, exact question, parent context and published index
version all match. It does not treat cancelled or unknown jobs as completed, and
an unresolved result remains a coverage gap. An isolated page test used a
24-second synthetic video and a synthetic processor: the first question examined
at most two windows and returned 16 sampled matches, while an identical new
question reused those matches. The test workspace remained at one supplement job
and 32 synthetic dispatch receipts before and after the second question; no real
provider or model was called. Integration tests additionally exercise different
parent contexts and synthetic cloud budget restrictions.

## Unknown receipts across supplement plans

A supplement request's durable markers now cover both the old and current prompt
contracts across every plan ID. An unpaired or invalid response blocks dispatch;
completed receipts from another plan also block a new plan when their frame
mapping cannot be safely reused. The guard is checked again after acquiring the
worker slot to cover a concurrent plan appearing while waiting. Mock tests cover
local execution, Token Factory preflight, valid cached resume and this race.

In an isolated browser workspace, a synthetic unmatched marker was inserted for
a different plan before asking the same test question. The page reported that
the result was unfinished or unknown and retained the question; the workspace
remained at 33 synthetic markers (32 prior completed markers plus the injected
one), with no new dispatch marker. This was a fixture-only test; no cloud or
local visual model call, real budget change or production modification occurred.

## Multiple colors on one garment

Chinese and English conjunctions such as blue and yellow jersey now require
both colors on one recorded garment value, rather than combining separate
garments or people. Partial or ambiguous values remain uncertain. A regression
checks both languages and cross-binding cases. An isolated browser test uploaded
a two-second clip with deliberately synthetic blue-and-yellow fixture facts;
the page returned its two indexed frames with zero model calls. An earlier
fixture with only blue facts entered supplement and did not complete; the input
was retained. Neither result measures real visual recognition quality.

## Mixed certainty within a frame

The supplement planner previously skipped an entire frame when any one subject
matched, even if another subject in that same frame had missing attributes.
It now retains the confirmed hit while allowing bounded candidate selection for
the uncertain subject. A fixture regression checks the mixed-subject case and
ensures an entirely confirmed frame is not selected. This establishes planning
behavior only, not recognition accuracy or real-world completeness.

## Preserve existing evidence when supplement cannot finish

When a supplement is blocked by budget or ends failed/unknown, and the original
index already has matches, chat can display those matches instead of hiding
them. The UI reports the unfinished supplement and does not resend it. A
failed/unknown supplement is recorded in the answer metadata without claiming
that the overall attempt made zero model calls. With no existing matches, the
question remains in the composer. Synthetic frontend and API regressions cover
these paths; no provider call or production deployment was made.

An isolated browser test exercised this path with a two-second clip and a
synthetic processor: the base index contained one matching and one uncertain
subject per frame, and the supplement deliberately returned an unknown error.
The page showed the two existing frame references and the unfinished warning;
clicking 00:01 sought to that time, and refreshing retained the answer. One
synthetic dispatch marker remained after refresh, with no automatic resend.
The synthetic facts do not establish visual recognition quality.

## Do not infer a subject from the whole-frame description

New supplements no longer fill a missing `kind=person` solely because the
frame-level description mentions a person and contains one structured subject.
The caption can refer to something other than that subject, so missing subject
kind remains unknown. Synthetic regressions cover the missing-kind case and a
separately explicit person with multiple clothing attributes. Existing published
versions and historical answers are not rewritten by this change.

When a supplement contains a generic color and an uncolored second clothing
item, it no longer invents a color/garment compound. If the second item has
its own explicit color, the existing named binding remains usable. Synthetic
regressions exercise both cases; this is not proof that model descriptions are
accurate, and earlier published versions are unchanged.

Named item colors now use the same item-binding check for every subject in a
search, even when only one example was available while compiling the query.
A synthetic regression checks that `yellow headband` matches a person with one
yellow headband but not another person with both a headband and a hat and only
one unassigned headwear color. The latter remains uncertain.

## Historical answer index version

Opening the index timeline from a saved answer now resolves its original version
from that owned answer instead of silently using the newest supplemented index.
The server checks the investigation, video and source generation. Fixture API
regressions compare old and current versions after a supplement, and frontend
regressions verify the saved answer anchor is sent. This does not establish a
real-media accuracy or production deployment result.

An isolated browser test saved a `person` answer, then used a synthetic
processor to supplement a `red hat` question and publish a new version. The
first answer's timeline offered only the original `kind: person` attribute;
the second answer's timeline also offered the new `garment: red hat` attribute.
The 00:00 and 00:01 references remained visible. This verifies version routing
in the page with synthetic facts, not the accuracy of the pictured clip.

The historical-index API regression also checks that a different session cannot
read the original owner's video through an answer anchor; it receives HTTP 404.

## Read-only recheck of an existing full basketball index

The previously created isolated local basketball workspace still reports 49/49
base segments ready. A read-only query of its published version with the current
retriever returned 51 sampled time points for blue jerseys and 52 for white
jerseys; both explicitly reported incomplete coverage. The yellow-headband
question could not be grounded in that version's structured fields. These counts
are indexed observations, not manually verified ground truth or a claim that
all appearances were found. No extraction, new model call, change to the source
workspace, or cloud request was performed by this recheck.

The prior index's 05:08–05:09 descriptions mention a yellow headband, but its
structured observations omit the headband color. The supplement planner now
uses caption terms only to rank windows that already have a grounded subject;
captions remain unverified leads and do not become facts. A read-only plan for
the full-video yellow-headband question selected 03:20–03:28 and 05:04–05:12,
instead of relying solely on chronological tie-breaking. No supplement was run,
so this is not a confirmed answer or a quality score. Synthetic tests cover
ranking and the requirement that captions alone cannot authorize a scan.

Candidate grounding also accepts equivalent values such as `person` and
`player` when they normalize to one concept in the same field. Previously,
seeing both labels could make that concept look ambiguous and prevent bounded
supplement planning. A synthetic regression checks both subjects remain
eligible leads; it does not treat them as verified matches.

## Real local supplement: missing subject kind

On an isolated copy of the full basketball workspace, the page asked for a
person wearing a yellow headband from 05:09 to 05:10. The local processor made
two calls (one extraction and one verification); no cloud call was made. The
extractor recorded `headwear=headband` and `headwear_color=yellow`, and the
verifier returned yes, but the extracted subject omitted `kind=person`. The
current binding rules therefore returned no confirmed match, with an incomplete
coverage warning. The frame-level description mentioned a person, but it was
not promoted into a subject fact. This is a reproducible recognition/contract
gap, not a successful real-video answer. The source workspace and its records
were not modified; the test used a private copy and no re-indexing.

The local supplement now uses a separately identified v7 prompt that asks the
model to explicitly supply each subject's type. Existing v5/v6 unknown receipts
remain blocking. A valid v6 receipt can resume under its original prompt when
its recorded plan still matches; completed calls are reused, while mismatched
plans and competing contract receipts block dispatch. Fixture regressions cover
the resume and conflict paths, including a v7 dispatch appearing while a v6
resume waits for its worker slot; the resumed task sends no duplicate call.
The Token Factory supplement prompt and calibration contract remain v6. On a
fresh isolated copy of the same real basketball source, the same 05:09–05:10
question made two local calls; the extractor supplied `kind=person` with the
yellow headband, and the page displayed a 05:09 reference. Clicking it sought
the player to the original 05:09, and refresh retained the answer. This is one
real sampled frame, not a human-reviewed accuracy benchmark or full-video recall
result. No cloud call, budget change, re-indexing, or production deployment was
performed.

After restarting the isolated workspace, the identical question was sent as a
new independent turn on the page. It returned the same 05:09 reference with
`本次模型调用0次`. The workspace still contained one completed supplement job
and two original dispatch markers, confirming that this repeat did not run a
new visual inference. This is a cache-reuse check for that one frame, not a
general accuracy measurement.

New index answers now include up to three actual cited frame timestamps in the
answer text, labeled as partial when more are available. An isolated browser
repeated the already indexed real-video question and displayed `00:05:09` in
the answer and `05:09` on the evidence button, with no new model call. The
existing historical answers were not rewritten. Timestamps identify sampled
frames, not continuous visibility or a guarantee of complete recall.

A synthetic regression also checks five distinct fractional-second citations:
the answer labels the three displayed times as partial while retaining all five
exact timestamps in its evidence events. It does not treat omitted times as
absent from the video.

On that same isolated real-video page, the follow-up `他什么时候出现？` used
the previous yellow-headband description and its 05:09–05:10 scope, returned
the 05:09 reference, and disclosed that cross-shot identity was not established.
The existing two supplement dispatch markers remained unchanged. This tests one
supported follow-up form; it does not establish arbitrary follow-up support.

The same isolated real-video workspace then queried 05:08–05:10. Planning
selected only the unconfirmed 05:08 frame and preserved the existing 05:09
observation. The local extractor proposed a yellow headband at 05:08, but its
independent verifier answered `no`; the page returned only the 05:09 reference
and retained the incomplete-coverage notice. Two new local dispatch receipts
were recorded for the new frame, not a repeat of 05:09. Inspection of 05:08
showed a wide shot where the proposed headband was not clearly discernible;
this is an agent observation, not human-reviewed ground truth. No cloud model
or original user workspace was touched.

## Full local regression after the follow-up and receipt changes

The backend suite passed 488 tests, the frontend suite passed 177 tests, and
lint, formatting and exported-contract checks passed. These automated tests use
fixtures and mocks where applicable. They do not replace the uncompleted
human-reviewed recognition evaluation, real Token Factory calibration or a
judge-accessible production test. No model calls were made by these checks.

## Supplement dispatch while waiting for the processor

The supplement worker now checks for unresolved receipts again after acquiring
the shared processor slot. A fixture regression simulates an unknown receipt
appearing for another frame of the same plan while the worker waits; it stops
before inference and leaves the receipt untouched. The focused supplement,
budget and job tests passed (38 tests), as did `make check`. This is a fixture
concurrency regression, not a new live-model or browser acceptance test.

## Local processor availability

The video status endpoint previously reported the local knowledge processor as
available whenever the underlying vision files were configured, even if the
knowledge processor was disabled. It now also checks the explicit local
knowledge switch and only recognizes fixture processors marked as such. A
fixture regression verifies both enabled and disabled states; the existing
index-reuse regression also passes when the processor is unavailable. The
status and job suites passed 14 tests, and `make check` passed. No model calls
or production changes were made.

## Evidence-seek acceptance check

The review scorer previously accepted a seek to any sampled frame, even when
that frame was not returned as evidence by the answer. It now requires the
checked frame to be among the recorded predictions as well as verifying the
original timestamp and player position. A synthetic regression exercises the
previous false pass. The evaluation and review-page suites passed 17 tests;
`make check` passed. This strengthens the acceptance gate but is not a human
review or a real browser validation of the judge workflow.

## Object-color binding in combined questions

The question compiler could consume a color while binding it to clothing and
then overlook that the same color also qualified a held object. For example,
red headwear plus an uncolored `holding basketball` fact could incorrectly
satisfy a request for both a red hat and a red basketball. The compiler now
tracks each color occurrence when deciding whether a held-object relationship
is sufficiently grounded. If a red hat and an uncolored holding relation are
both explicitly recorded on one person, that combination can now be queried;
asking for a red held object still requires evidence of its color. Synthetic
Chinese and English regressions and the semantic-search, planning and index-chat
suites passed 35 tests; `make check` passed. No model or production service was
used.

## Mixed clothing representations in the real basketball index

Read-only inspection of the isolated 385-frame basketball index found that early
segments stored `garment=jersey` and `color=white` separately, whereas some
later segments stored `garment=white jersey`. When only one bound spelling was
available, the question compiler used exact equality and classified the earlier
representation as a definite mismatch. It now uses the color-item predicate
for either one or several bound spellings. Separate generic colors remain
unconfirmed, not positive evidence; they can be selected for bounded review
even when another subject in the same frame already matches. On the existing
real index, the 00:00 subjects now return unknown while the bound white jerseys
at 01:28 remain positive; the planner proposed two bounded windows and sent zero
model requests. A synthetic same-frame regression and the semantic, planning,
index-chat and occurrence suites passed 63 tests; `make check` passed. No index
was rebuilt, and this is not a human-reviewed recall measurement.

On the isolated copy, a browser asked for people wearing white jerseys with
the local processor disabled. The page returned 52 sampled indexed time points,
showed an incomplete-coverage warning and zero new calls, and the first
reference sought the player to 01:28. The answer survived refresh. Its timeline
exposed a misleading `385 / 385 frames checked` label, so the page now calls
these indexed observations and explicitly says they are sampled, not a
frame-by-frame examination. After rebuilding, the browser showed the corrected
wording. The workspace persistence suite passed 70 tests. This page test did
not assess recognition accuracy or inspect every cited frame; no model call or
production change was made.

The 01:28 source JPEG was also visually inspected by the agent and contains
people wearing white jerseys; this is not an independent human annotation.
The sampled-index answer and timeline now explicitly label matching time
points as sampled frames, not counts of people or events. In the isolated
browser, a new white-jersey question displayed this wording, cited 01:28–01:30,
and reported zero model calls. The old saved answer was left unchanged. The
index-chat and occurrence suites passed 31 tests, the workspace suite passed
70, the frontend build and `make check` passed. This does not validate the
other cited frames or establish recognition precision or recall.

## Time scope crossing a source-frame boundary

For a fully enumerated frame catalog, a frame whose original timestamp is just
before a query's start may still be displayed within the requested range. The
old search omitted it. The search now includes intersecting presentation
intervals, clips the returned occurrence to the requested range, and retains
the decoded frame's original timestamp. Schema 0.1 requires evidence timestamps
inside an answer event, so the answer event includes that original first-frame
timestamp and its summary explains why it precedes the selected range. Sampled
indexes still use point timestamps and never infer a continuous interval. A
synthetic scoped regression plus occurrence, index-chat and semantic suites
passed 54 tests; `make check` passed. This is not a real-video browser test.

## Real local supplement for an earlier ambiguous frame

On the isolated basketball copy, the page asked for people in white jerseys in
00:00–00:01. The original observation separated `garment=jersey` from a generic
`color=white`, so it was not accepted as bound evidence. The local processor
performed a bounded supplement and verification: two new local dispatch
receipts were recorded, and the page cited 00:00. The source JPEG visibly
contains white jerseys on agent inspection; this is not independent human
review. Selecting the citation sought the player to 00:00. Repeating the same
question returned the same result with zero model calls, and the receipt count
remained six (four earlier, two new). Refresh preserved both answers and the
player position. This confirms one scoped recovery, not full-video recall or
the 20-case quality gate. No cloud call, budget modification, original workspace
change, re-indexing, or production deployment was performed.

In the same isolated workspace, `他们什么时候出现？` now resolves a single
unambiguous prior visual description and retains its explicit time scope. An
isolated browser followed the 00:00–00:01 white-jersey answer with this question;
it cited 00:00, disclosed that cross-shot identity was unconfirmed, and reported
zero model calls. Chinese plural and English `they` forms have fixture tests;
mixed-subject context remains ambiguous. The score-event, index-chat and job
suites passed 21 tests and `make check` passed. This does not establish general
pronoun resolution or recognition quality.

## Ambiguous colors in supplemental subject facts

A supplemental extractor can return one generic `color` beside both a garment
and a held object. The former binding heuristic could attach that color to the
garment even when the object was another possible referent. The compiler now
leaves this generic color unbound when a held object is present, including
objects outside the built-in vocabulary; an explicitly named garment color can
still be used. Existing published versions and answers are not rewritten.
Fixture regressions cover a basketball and an umbrella. Supplement, job and
semantic suites passed 55 tests, and `make check` passed. This is a conservative
ambiguity guard, not a new real-video accuracy evaluation; no model was called.

## Three additional real sampled-frame misses

The existing unreviewed draft's original index-only predictions returned no
matches in the selected 01:20–01:28 white-jersey, 02:40–02:48 blue-jersey and
05:20–05:28 white-jersey cases. Agent inspection of the first source frame in
each scope showed the requested color. On the isolated basketball copy, three
new page queries each restricted the scope to that first second. Local bounded
supplement and verification returned 01:20, 02:40 and 05:20 respectively;
the 05:20 citation sought the player to 05:20, and all three answers survived
refresh. Six new local dispatch receipts were created across these three queries;
there were no cloud calls. These are three agent-inspected examples, not human
labels, not checks of every frame in each eight-second case, and not a passing
recall measurement. The original user workspace and production were untouched.

With the local processor disabled, a new page question using different wording
asked whether the video contains white jerseys. It reused the current index and
returned 55 sampled points, including the previously supplemented 00:00,
01:20 and 05:20, with zero model calls. Loading the second timeline page exposed
05:20. Opening the earlier saved answer's timeline still returned its original
52-point index version. This demonstrates reuse across these two query wordings
and preservation of that historical version; it does not establish complete
recall, human review, or a live production workflow.

The English form `Find a person in a white jersey` previously left `in` as an
unmatched condition. The parser now recognizes `in` only when immediately
followed by an optional article and an explicit clothing item, preserving the
color and leaving spatial relations such as `in a room` unresolved. On the
isolated real-basketball page, that exact English question reused the current
index, returned 55 sampled points with timestamps and zero model calls. The
interface and answer remain Chinese. Semantic, planning and index-chat suites
passed 37 tests, and `make check` passed; this is not broad English-language
acceptance or a human-reviewed recognition score.

`男人` / `女人` and `man` / `woman` are now parsed as a person plus a distinct
recorded gender-related condition. A fixture verifies that a generic person is
not promoted to a match, a different recorded label is excluded, and a `kind`
value of `man` can satisfy the person condition. These are extractor labels,
not proof of identity or a person's actual gender. Existing indexes without the
attribute still require clarification or a bounded supplement. The semantic,
occurrence, planning and follow-up suites passed 69 tests; `make check` passed.
No real-media or model test was performed for this change.

Subsequent real-page testing found that local v7 described a man at 05:09 but
omitted the corresponding structured attribute, so the query correctly did
not return a match. Local supplement contract v8 explicitly asks for the label
only when requested and visually supported. A differently worded scoped query
then recorded `gender=male` and yellow headwear on one subject, passed the
separate verifier, cited 05:09, and sought the player there. On restart with
the local processor disabled, the previously retained `男人` question reused
the new index with zero model calls and stated that identity and gender
identity were not verified. The original attempt and the new query each used
two local calls; no cloud call was made. The v8 request identity is distinct;
tests cover reuse of valid v7 receipts under the original prompt and prevent
unknown or competing older receipts from being silently retried. The supplement,
budget and job suites passed 41 tests; index-chat, supplement and budget suites
passed 34, and `make check` passed. This is one sampled frame and does not
establish a person's identity or a human-reviewed quality score. Token Factory
continues to use its separately calibrated v6 contract.

The structured search now accepts generic `衣服` / `clothes` when an existing
subject explicitly has a colored jersey or shirt. A fixture checks that a white
hat on a blue-shirted person and a separate white-shirted non-person do not
produce a match. In the isolated basketball page, `找出穿白色衣服的人` reused
the existing index, returned 55 sampled points and reported zero model calls.
The semantic, occurrence, planning and supplement suites passed 83 tests and
`make check` passed. This is a limited body-clothing vocabulary, not arbitrary
clothing recognition or a human-reviewed quality score.

## Dispatch state after a late budget error

Base and supplement processors write a durable marker before invoking the
processor. An exception after that point previously could be shown as a normal
failure or budget wait even though no durable response existed; resume then
discovered an unknown receipt. Both paths now report an unknown dispatch
immediately and retain the marker, including when the exception is a late budget
denial. This is intentionally conservative: the worker cannot prove from that
marker alone that the provider did not send. A fixture regression confirms a
second attempt does not invoke the processor. The compiler, supplement, job and
budget suites passed 48 tests and `make check` passed. No model or production
service was used.

## Full regression after recent changes

The complete backend suite passed 496 tests and the frontend suite passed 178
tests. These include fixtures and mocked provider transports; they do not prove
live recognition quality, paid-provider calibration, deployment readiness or
the human-reviewed acceptance gate. No live model calls were made by the suites.

## Multi-attribute local supplement and reuse

A synthetic regression checks that a red hat, white clothing and a male label
must belong to the same subject, including distractors and separate subjects.
Local supplement contract v9 asks the extractor to combine each item's color
and name within the existing five-fact limit. Older receipts retain their
original prompt and request identity; an added regression covers v8 resume.
Token Factory's contract is unchanged.

In the isolated real basketball page, a 05:09–05:10 query for a man with a
blue jersey and yellow headband used two local inference calls. The extractor
and verifier identified the same subject, but the first result missed it because
`blue jersey with yellow trim` was not interpreted as a blue jersey. The
retriever now recognizes only that narrowly specified trim pattern; a yellow
trim is not treated as a yellow jersey. After restarting with local vision
disabled, the same page question reused the saved observation, returned 05:09
and reported zero model calls. The old answer remains unchanged. This is one
real sampled frame, not a human-reviewed quality score or proof of exhaustive
coverage. No cloud calls or changes to the original user data were made.
The relevant semantic, occurrence, supplement, planning and budget tests passed
96 tests, and `make check` passed.

A later isolated browser session restored the saved multi-attribute result with
local vision disabled. Selecting a different saved citation first moved the
player to 00:00; selecting this result's 05:09 citation then displayed
`已定位 05:09 · 保持暂停`. This checks source-time navigation and saved-answer
restoration for the one tested frame, without another model request.

After the multi-attribute fix, the full backend suite passed 505 tests and the
frontend suite passed 178 tests. These are automated regressions with fixtures
and mocks, not the required independent human-reviewed recognition evaluation.

## Short-range supplement planning with an existing hit

Synthetic planning regressions exposed a missed gap: in a short explicitly
specified range, a confirmed match could suppress supplemental checks of other
incomplete frames when those frames had no grounded subject. Planning now adds
such frames to the bounded scope, including when another uncertain subject was
already selected. Existing confirmed frames and complete unambiguous negatives
are excluded from this fallback, and frame IDs remain deduplicated and ordered.
The existing two-window limit, request admission and cache checks still apply.
The relevant planning, supplement, budget, routing and index-chat suites passed
50 tests, and `make check` passed. These are synthetic tests; this change has not
been exercised on a fresh real page or deployed. No model call was made.

An isolated browser then exercised this path using a synthetic 12-second video
and fixture extractor: the base supplied one match at 00:00 and no observations
at 00:01–00:02. Submitting the scoped question invoked exactly two simulated
single-frame extractions and two fixture verifications, and the answer retained
00:00 alongside 00:01 and 00:02. Repeating the question reported zero model
calls; selecting 00:01 sought the player there, and both answers survived reload.
A focused compiler/supplement integration regression now covers retention and
reuse. These are simulated observations, not real-video recognition accuracy;
no cloud or local model was called.

A subsequent isolated real-basketball page run asked for a man in a blue jersey
and yellow headband from 05:08 to 05:11. The result retained the existing 05:09
match and added 05:10; selecting 05:10 moved the original player there. The
local extractor reviewed three sampled frames with three separate local
verifications (six local calls, no cloud calls). The 05:08 extraction proposed
a match but its verifier rejected it. The 05:09 frame was also re-examined
because its indexed observations included another uncertain subject; the
existing positive observation remained preserved. Repeating the same question
returned the same two times with zero model calls. This is a single scoped real
example, not evidence of complete recall or independent human review.

## Visible text in an explicitly bounded scope

The automatic route previously stopped at the first existing text match even
when a short specified interval contained other incomplete observations. It
now permits the same bounded supplement planner for text-time listings when
the explicit scope spans at most two eight-second windows. Unscoped text hits
continue to use existing observations directly. Normal admission and reuse
rules remain in force. An owned API regression covers an existing text hit and
one incomplete frame. On an isolated synthetic browser page, a scope with one
existing `EXIT` observation and two missing observations returned 00:00, 00:01
and 00:02 after two simulated extraction/verification pairs; a repeated
question reported zero model calls. The relevant backend suites passed 59 tests,
and `make check` passed. No actual model or production service was used; this
does not assess real text recognition accuracy.

A separate real-basketball browser query for `NBA FINALS` in 01:12–01:16
returned the four pre-existing sampled observations at 01:12, 01:13, 01:14 and
01:15 with zero model calls. Expanding the evidence displayed all four, and
selecting 01:15 moved the original player to 01:15. This interval already had
all four positive observations, so it did not exercise the new missing-text
supplement branch; the latter remains demonstrated by synthetic page testing.
This is not human-reviewed OCR accuracy or proof of full-video coverage.

A real-basketball page run then exercised the missing-text branch across two
index windows: `NBA FINALS` at 01:19–01:21 had an existing 01:19 match but no
text observation at 01:20. One local extraction and one local verification
added 01:20 while retaining 01:19. The page sought to 01:20 on selecting the
new evidence; the selected player frame showed the scoreboard graphic. Repeating
the exact question returned both times with zero additional model calls. No
cloud model was called. This is one real two-frame example, not independent
human-labelled OCR accuracy or proof of exhaustive coverage.

The auto route previously failed to plan a supplement for natural time
questions such as `什么时候出现` and `when does ... appear` if there was
already an index hit. Routing now recognizes these time-query forms as well as
explicit `找出`/`find` wording, while preserving the same bounded planner,
provider admission, and repeat-use rules. API regressions cover Chinese and
English scoped text questions. In an isolated synthetic browser, the Chinese
question returned the pre-existing 00:00 observation plus the simulated
supplement at 00:01–00:02. No real model or production service was used. The
relevant suites passed 30 tests and `make check` passed; this is not a general
natural-language quality claim.

The private human-review page now opens an enlarged local image when a frame
is selected, making small visual details easier to inspect while predictions
remain hidden. A synthetic browser check verified the modal, its image and time,
Escape dismissal and keyboard focus returning to the selected thumbnail. The
review and evaluation suites passed 17 tests; `make check` and `npm run build`
passed. Existing generated private review files were not overwritten; a new page
must be generated to include this change. No case was labelled, no model was
called, and no human-review acceptance claim is made.

The private review page also supports resuming from its exported JSON. It checks
case identity, source/index version, question and frame IDs before applying any
labels; a mismatched file leaves current selections unchanged. Unknown and
unfilled frames remain unreviewed. An isolated synthetic browser check restored
reviewer, duration and labels from a valid file, then rejected a changed question
without overwriting the visible selections. The review/evaluation suites passed
17 tests; `make check` and the frontend build passed. Existing private pages
were not replaced, no real labels were generated, and no model was called.

Two executable frontend regressions now exercise the review-page import and
export handlers: a partially labelled packet stays unreviewed after resume,
and a changed index version rejects the entire import without changing the
existing labels. They use a synthetic DOM and cases; the earlier browser check
covers the actual file chooser. The complete Node suite passed 180 tests and
`make check` passed. This adds no human labels or model calls.

The original 20 unlabelled draft cases were re-evaluated against their original
immutable index versions with the current retrieval code. All 20 now produce
sampled-index predictions, including the four that previously required
clarification; source fingerprints and versions were checked. Predictions were
written to a separate private file, and a new private review page includes the
zoom and resume controls. The unlabelled packet was scored only as a pipeline
check: zero cases reviewed, 20 issues and `accepted=false`; no accuracy score or
human acceptance is claimed. No model call or original packet modification was
made. The private page contains real video frames and must remain local.

The original 20-case draft lacked explicit multi-attribute, follow-up and seek
coverage. A separate, expanded private packet adds two real-source cases, one
for a blue jersey and yellow headband on the same subject and one for quoted
text with follow-up/seek review categories. All 22 have computable sampled-index
predictions, but none is human-labelled. The review page now accepts explicit
human-entered follow-up and seek evidence, preserves those fields when resuming,
and leaves them absent until the reviewer checks them. It does not perform the
browser checks or attest that they happened. Synthetic browser and automated
resume tests exercised these fields. The unreviewed expanded score has zero
reviewed cases, 22 issues, and `accepted=false`; this is not an accuracy result.
The Node suite passed 181 tests; `npm run build`, `make check`, and whitespace
checks passed. No model or production service was used.

An isolated browser check used a delayed synthetic processor to stop a
supplement while its first extraction was in flight. After the delayed response
arrived, the page retained the draft and previous answer, did not publish a
late answer, and showed the send control again. Both draft and answer survived
refresh. The private test database retained the earlier completed supplement's
active version and recorded the interrupted task as cancelled with no published
version. This was a fixture-only check; it does not establish live-provider
cancellation or billing behavior and made no model call.

The natural-question routing change also exposed a literal/intent collision:
asking whether the quoted text `WHEN` exists could be mistaken for a time-listing
request and trigger an unnecessary supplement. The router now excludes quoted
video text when detecting search intent, while passing the unmodified question
to retrieval. An owned API regression verifies the collision and preserves real
Chinese/English time-query behavior. An isolated synthetic browser answered the
existence question from the existing index with zero calls. The relevant suites
passed 30 tests and `make check` passed. No model or production service was used.

An owned API regression now verifies that a quoted visible string containing a
clock-like range (`01:00-02:00`) remains text to find, rather than becoming a
video-time filter. It returned evidence with no time scope. The relevant
knowledge-job, window, semantic and index-chat suites passed 64 tests; `make
check` passed. No model request was made.

A read-only process check on 2026-10-29 found the existing local listener on
127.0.0.1:8765 was started without `FS_KNOWLEDGE_LOCAL=1`; it uses the legacy
local path, not the opt-in upload-time knowledge path tested above. It was not
restarted or reconfigured: enabling the new gate would change behavior for
existing unindexed sources, and the real human-quality and production acceptance
gates remain open. Existing chat/data and the running service were left intact.

## Short-scope supplement planning

Two synthetic planning regressions exposed gaps when a short requested interval
had no confirmed hit. The planner could recheck a complete negative inventory
because a subject matched only part of the question, and it could omit an empty,
incomplete frame when a different frame supplied a candidate. Planning now
skips complete unambiguous negatives and includes incomplete sampled frames in
the bounded short scope, even without an existing hit. Incomplete negative
inventories remain eligible for checking. The planner still treats candidates as
leads, not confirmed facts, and does not expand a short scope into a full scan.
The knowledge planning, supplement, index chat and job suites passed 54 tests;
`make check` and `git diff --check` passed. In a separate isolated browser with
a synthetic processor and test video, a 00:00–00:02 query with one incomplete
subject and one empty incomplete observation produced two simulated supplement
checks and returned both sampled timestamps. Selecting 00:01 sought the player
to 00:01; refreshing retained the answer. Asking the same question again returned
both frames with zero additional simulated calls. The complete-negative branch
was tested at the planning level, not through this page. No real model request,
budget change or production deployment was performed for these changes;
real-video accuracy and cost remain unverified.

## Natural-language request phrasing

The user's example asking for a man in a red hat and white clothing, followed
by “可以帮我列出来 并且知道timeline”, previously failed structured retrieval:
the conversational request words were treated as visual attributes. The parser
now recognizes those request phrases while retaining the person, gender, garment,
hat and color conditions. A synthetic regression verifies the attributes must
belong to the same subject and excludes distracting subjects. On an isolated
page with a synthetic processor and synthetic annotations, the exact example
returned indexed sampled times without a new model call; selecting 00:01 sought
to 00:01. The synthetic annotations are not visual recognition results. The
semantic, occurrence, planning, index chat and job suites passed 85 tests, and
`make check` passed. The full backend suite also passed 511 tests before this
final language-only change. No cloud request or production change was made.

## Evidence replay and unsent context

On the isolated real-basketball test workspace, replaying an older answer's
frame changed the selected reply context even though an unrelated draft remained
in the input. This could send that draft as a follow-up to the wrong answer.
Conversation evidence buttons now seek without selecting a different question;
explicit “追问这条回答” remains the way to select a follow-up context. After
the change, clicking a 05:09 frame moved the player to 05:09 while retaining the
existing question-7 context and unsent text. The isolated test's earlier draft
context was restored afterward. A focused frontend regression and 16 related
tests passed, the frontend was rebuilt, and `make check` passed. This test used
saved real evidence and did not send a question or call a model. It does not
establish recognition accuracy or change the online application.

The same context switch occurred from the canvas frame and interval controls.
Those controls now seek without selecting another question. A browser test in
an isolated synthetic workspace selected a different question, retained an
unsent draft, then replayed a visible older frame: the player reached 00:06 and
both the draft and its selected follow-up remained unchanged. Automated tests
also exercise the interval control; its page click was not visibly confirmed.
During that page check, two suggested synthetic questions were found not to
resolve to their own preset answers. Explicit aliases now cover those two
suggestions; a separate isolated browser confirmed the right-side suggestion
fills without sending, then returns its labelled preset answer on send, and the
forklift question returns its labelled no-result answer. These are fixture
results, not live recognition. The frontend was rebuilt, all 185 Node tests and
`make check` passed, and no cloud model or production service was used.

An isolated synthetic page also exposed a duplicate-turn display error: two
identical preset questions share a query ID, so the reply chip showed the first
turn after the second was selected. The chip now uses the actual selected source
turn ID as well as the query and video IDs. In the browser, two identical
questions displayed “问题 2” for the second, switched correctly between “问题
1” and “问题 2”, and retained the second selection after refresh. This changes
presentation only; existing query and context records are not rewritten. A
focused regression checks duplicate IDs and missing turn IDs. No real model or
production service was used.

## Real-source uncertainty check

An independent local inspection of the existing basketball index's sampled
01:28–01:35 range found that the “person holding a basketball” query matched
all eight frames. At 01:33 the ball is obscured in the displayed image, so this
agent could not visually confirm the relationship from that frame alone. A
separate local single-frame verifier returned `yes` at 01:28 and `no` at 01:33;
that disagreement is a quality warning, not a human label or proof that either
model response is correct. It used two local model calls and no cloud calls.

A subsequent eight-frame local recheck of that same range returned `yes` at
01:28–01:30, `no` at 01:31, `yes` at 01:32, `no` at 01:33, and `yes` at
01:34–01:35, whereas the existing multi-image base record matched all eight.
In the base response, the same person/garment/action fact appears in each of
the eight independent frame entries. Those observations identify a potentially
repeated-description failure mode; they do not prove why the model produced it
or establish which verifier labels are correct. “Holding” versus dribbling also
requires a consistent annotation definition. This additional check used eight
local calls only; no saved index or historical answer was altered, and these
machine-generated labels were not entered into the human-review packet.

New index-chat answers now identify matching as an index record and explicitly
say that recognition accuracy is unverified when the coverage metadata says so.
Historical saved answers are unchanged. A browser check against a copied private
basketball workspace returned the warning alongside 16 sampled hits and zero
new model calls; the earlier saved answer remained unchanged. Seventy relevant
backend tests and `make check` passed. This does not fix or measure recognition
accuracy, does not satisfy the 20-case human-review gate, and was not deployed.

## Real-source text extraction experiment

The original immutable base index records no `NBA FINALS` text in the eight
sampled frames at 05:04–05:11. Visual inspection by the agent found that text
legible at 05:04, 05:08 and 05:09; these observations are not human review labels.
The original extractor used all four subject slots in several frames, but two
frames had only two subjects and still had no text, so the slot limit alone
does not explain the misses.

One offline local experiment amended the prompt to reserve a subject slot for
legible text, without changing the four-subject schema or any saved index. For
the eight frames in one call it returned `NBA FINALS` at 05:08 and 05:09, but
not at 05:04. Its 05:08 text also claimed a shot-clock value of 24 whereas the
displayed frame reads 16, consistent with a possible cross-frame mix-up; the
cause is not established. A separate per-frame experiment with the same prompt
reported the target text at 05:04 but omitted it at 05:08. These are three
local-model calls total, not a human-labelled benchmark, and they show that the
prompt change alone is not reliable enough to adopt. Existing checkpoints,
budgets and production were not modified; no cloud request was sent.

For comparison, the existing optional, bounded Tesseract candidate path was run
against a separate copy of the same index and the exact 05:04–05:12 text query.
It returned candidate references for all eight sampled seconds, checked all
eight and reported no processing failures or model calls. The candidate path
deliberately marks them unverified; the agent visually inspected three of those
frames, not all eight. This is a promising way to locate missed text, but it
does not establish OCR precision, whole-video recall, or a human-reviewed score.
It does not automatically insert OCR strings as facts into the base index.

The text-candidate UI had a separate version issue: an old saved answer could
show its historical index while the OCR endpoint searched the current index,
without distinguishing the two. The page now rejects mixing results when those
version identifiers differ and provides a “查看最新索引” action. An isolated
browser test created a fixture answer, published a later fixture supplement,
opened the old answer and confirmed the version warning. Selecting the new
action queried the latest index; its OCR search then completed without the
warning, reporting zero candidates in the synthetic test video. The original
answer remained intact. All 188 Node tests, the frontend build and `make check`
passed. No cloud model was called; this is not a real OCR accuracy evaluation.

When optional OCR is configured and a short quoted-text index query returns no
result, the answer now offers a direct “查找文字候选” action. Selecting it opens
the index view and starts the bounded OCR search once; it does not turn OCR
candidates into facts or send a model request. An isolated browser using a copy
of the real basketball index exercised the previously missed 05:04–05:12
`NBA FINALS` question: the action returned eight explicitly unverified OCR
candidates, and selecting 05:09 moved the player to 05:09. Only sampled frames
are covered. The workspace suite passed 73 tests, the frontend was rebuilt, and
`make check` passed. This does not establish OCR precision or human-reviewed
recall, and the change is not deployed.

## Expired or changed task context

An isolated worker regression reproduced a stuck state: if a video or owner
became unavailable before a claimed base job or supplement worker began, it
returned while the database still said `indexing` or `running`. Workers now
transition their own still-active run to `cancelled` when their context is no
longer valid, including after processing or a failed publication CAS. A worker
whose context changes while a dispatch result is unknown records `unknown`
instead; existing explicit cancellation or newer runs are not overwritten. No
receipt is refunded or resent by this change. Fixture-only tests cover the stale
initial context and an unknown dispatch during a context change; the knowledge
jobs, scheduler, budget and supplement suites passed 46 tests, and `make check`
passed. No page test or live-provider call was made for this change.

A further fixture regression simulates expiry between the final active check
and the guarded base-index publication update. The worker ends as `cancelled`
with no published database version instead of remaining `indexing`. The full
backend suite passed 513 tests before this additional regression; afterward the
knowledge job, budget and Token Factory mock suites passed 29 tests and
`make check` passed. This does not establish live-provider billing behavior.

A subsequent isolated browser test exercised navigation during a delayed
synthetic supplement. It reproduced a separate UI bug: the old supplement was
cancelled, but the new investigation still showed “停止处理”. Cancelling the
owned request now clears its stop and resume controls only if it is still the
same active request. On retest, the new investigation showed no stale stop
control, and returning to the original investigation restored its draft. After
the delayed fixture result arrived, the database still showed `cancelled`, the
active index version was unchanged, and no late answer appeared. The frontend
was rebuilt, all 186 Node tests and `make check` passed. This was an isolated
synthetic processor; no model call or production change occurred.

A related completion/cancellation race was reproduced through the fixture API:
after a supplement completed, its cancel endpoint returned 409, which could
block investigation navigation. The endpoint now atomically returns the actual
terminal state without changing it; running tasks still cancel normally, while
unknown states stay unknown. The composer reports a completed-before-stop
result instead of claiming it was stopped and retains the draft. A fixture API
regression verifies the completed version remains available, and a separate
regression verifies unknown state and error remain unchanged. The backend
job/budget/Token Factory mock suites passed 29 tests, all 187 Node tests passed,
the frontend was rebuilt, and `make check` passed. The race has not been
reproduced through a live provider; no paid call was made.

An isolated browser subsequently reproduced this completion race with a quick
synthetic supplement and the normal two-second status polling interval. Clicking
stop after the fixture job completed displayed the completed-before-stop message
and retained the input. Refresh recovered one answer with the same completed
index version; the fixture log showed two extraction and two verification calls
before stopping, with no new calls during recovery. The database retained one
`done` supplement and one `done` answer. This tests the local page and fixture
worker, not provider latency, real billing or recognition accuracy.

The completed-before-stop path now immediately recovers the already-published
index answer, without requiring the user to reopen or refresh the investigation.
In a new isolated browser run, the same fixture race displayed the answer and
“已恢复补查结果” immediately after stop. A deferred-network regression confirms
that a newer draft survives and no supplement is dispatched during recovery;
the workspace suite passed 71 tests, the frontend was rebuilt, and `make check`
passed. This remains a synthetic timing test, not live-provider validation.

Local OCR candidate lookup is now offered for eligible short, quoted text
queries even when an indexed answer already has matches. It preserves the
indexed results and marks additional OCR results as unverified candidates.
An isolated browser test using a copy of the real basketball index and video
opened an older answer: the app detected that its index version differed from
the current one and did not mix evidence. After switching to the current index,
the two existing 01:12 and 01:13 matches remained visible; local OCR examined
two frames and found no additional candidates. A separate real-video test of
05:04–05:12 found eight unverified OCR candidates after an indexed no-result.
These are targeted interaction checks, not evidence of full-video text recall.
The frontend build, all 190 Node tests and `make check` passed. No cloud model
was called and neither production data nor the existing budget was changed.

Follow-up regression checks cover direct OCR when an indexed hit already exists:
the original hit remains and the same frame is not added twice. Legacy results
without an index version now also require switching to the current index before
showing current OCR candidates; their provenance cannot be verified as the same
version. The frontend was rebuilt and all 75 workspace persistence tests passed.
This version-missing case was verified with a fixture, not a real browser run.

An API review found that opening an older answer without a recorded version
could silently query the latest index. The endpoint now rejects that anchor,
and the UI offers an explicit latest-index lookup while retaining the old
answer. A fixture integration test exercises the historical and current
versions after a supplement, plus the unversioned case; 14 knowledge-job
tests and 76 workspace tests passed. The frontend was rebuilt. This new
fallback has not been deployed.

An isolated browser check then used a copy of the basketball workspace with
one saved answer's index-version field deliberately removed. Opening its index
showed the missing-version explanation and the explicit latest-index button.
Selecting that button returned two sampled matches, and replaying the first
located the player at 01:12 while the original answer remained visible. This
checks the UI fallback using real copied video and existing observations; the
modified answer was a test fixture, not a naturally occurring migration case.
No model was called and the user's workspace was not modified.

The OCR results previously replaced the index coverage and provenance text,
even while retaining the indexed results. The coverage display now retains the
index information and appends the separate OCR processing counts. A regression
test checks both lines; an isolated browser test of the copied basketball
video showed the original 8/8 indexed-frame coverage together with eight
unverified OCR candidates and 0 failed OCR frames. Frontend build, 76 workspace
tests, and `make check` passed. No model request or production change occurred;
this check does not measure OCR precision or recall.

The structured-search API used `verified_matches:true` for matching indexed
facts even though the underlying recognition had not been independently
verified. It now reports `structured_conditions_evaluated:true` separately
and leaves `verified_matches:false`, including for event results. Automatic
routing still uses structured evaluation and coverage to choose retrieval;
this metadata change does not certify recognition or initiate extra calls.
Fixture API, routing, index-chat and event-search tests passed (29 total),
including explicit assertions on both verification fields; `make check` passed.
No live-provider or production test was performed for this change.

Common question phrasing such as “穿白色球衣的人有哪些？” previously left
question words as literal visual conditions and failed retrieval. The parser
now handles a bounded set of Chinese and English question forms while keeping
unknown visual actions and negations intact. In an isolated browser using a
copy of the real basketball workspace, that Chinese question returned 52
sampled index hits and visible source-time citations, explicitly noting that
these are not a count of people and that recognition remains unverified. It
used no model calls. Forty-seven semantic, planning and index-chat tests passed;
this is not an evaluation of general language understanding or recognition
accuracy. Production and the original workspace were not modified.

The optional local OCR action now also accepts explicit single-time questions,
matching the backend's one-second scope while excluding approximate, negated and
relative-time forms. A bare Chinese “找文字” is recognized without stripping
unknown visual descriptions. On a copied real-basketball page, “在05:09找文字
‘NBA FINALS’” returned no indexed match, then local OCR displayed one unverified
05:09 candidate; selecting it sought to 05:09. The frontend was rebuilt, 89
relevant Node tests and 57 OCR, parser and index tests passed, as did `make check`.
This test used no model or cloud call and does not establish OCR accuracy.

The OCR action previously used only a browser-side time and quote heuristic,
so an old answer could offer the action for a question with unsupported extra
visual conditions. Index search now returns a server-validated eligibility
flag; the dialog does not dispatch OCR when that flag is false. New answers
also hide an ineligible action, while older answers can still reopen their
index and receive the current decision. In a copied real-basketball page, an
existing single-time text answer still opened its unverified 05:09 OCR candidate.
Fixture regressions cover extra color and explicit filters, plus a stale button
that must not dispatch. Twenty-three backend and 90 targeted frontend tests,
the frontend build, and `make check` passed. An earlier full run passed 529
backend and 194 frontend tests before this final change; no cloud call or
production change occurred.

OCR eligibility now also checks that a published knowledge index has one to
eight sampled frames in the requested scope. This avoids presenting an action
that would fail for a gap with no sampled frames; an older answer that invokes
the action receives a clear explanation without a model call. A fixture covers
empty, valid and over-limit frame sets and the stale-button fallback. In the
copied real-basketball page, the valid 05:09 text query still returned its one
unverified OCR candidate. The frontend was rebuilt; 24 relevant backend tests,
90 frontend tests and `make check` passed. No cloud request, user-data change
or production deployment occurred. The real basketball index had no empty
whole-second gap, so the gap itself was tested with a synthetic fixture only.

The user's local port 8765 was still running a backend started before the
recent changes. After checking that no query or media job was active, a
private SQLite backup was created and that one local process was restarted
with its recovered runtime settings. The database row counts for videos,
investigations and all 32 saved queries matched before and after. The served
HTML matches the current frontend build and health reported the same 21 logged
model attempts before and after; no model request was made. Existing local
settings remain fixture mode with local vision configured and the new knowledge
index mode disabled, so this is not a live-provider or new-index acceptance
test. No media, budget, expiry or production settings were changed.

The shared time-range parser previously treated malformed seconds or a range
with extra timestamps as no explicit scope. It now rejects those cases instead
of silently broadening them; quoted text remains excluded from parsing.
Ninety-eight parser, admission, index and planning tests passed, including a
mock paid-admission check confirming no dispatch. An isolated page test on a
copy of the basketball workspace displayed an invalid-range explanation for
05:20–05:99 and returned the unchanged question to the editor. No model call
or production change was made. Multiple ranges are not supported as one query.

An isolated real-basketball page test asked for a blue jersey and red headband
at 05:09–05:10, where the agent saw a yellow headband. The local extractor
described the yellow headband and returned no matching subject; this used one
local call and no cloud calls. The page did not report a red-headband match,
but its feedback presented unresolved parsing details instead of clearly saying
the bounded supplement had already run. That feedback now states that the
checked frames did not yield a confirmed match and may still contain misses.
After restarting the isolated server, the page recovered the retained question
and showed the new message without another model receipt. A fixture regression
also confirms no repeated call; `make check` passed. This is one agent-inspected
negative example, not human annotation or an overall accuracy measurement.

The completed-but-unresolved supplement now creates a durable `no_result`
conversation answer instead of leaving only a clarification popup. It states
that the sampled check did not confirm a match and may miss appearances; the
trace counts the actual frames from the version-bound supplement. Reuse is
restricted to the same owner, investigation, video generation, question,
parent and index version. In the isolated real-basketball browser, the earlier
red-headband check recovered into the conversation and survived refresh without
another local model receipt. Fixture regressions cover the first result,
identical reuse with no new calls, and a different question; 52 job, supplement,
index-chat and workspace tests and `make check` passed. No cloud call or
production change was made. This does not prove the target absent or establish
recognition accuracy.

An explicit single-time question such as “在05:09找出穿蓝色球衣并戴黄色头带的人”
now searches the one-second interval beginning at that time, using original
sample timestamps. Relative or approximate wording is not interpreted as that
interval. On an isolated real-basketball page with the local processor disabled,
the question returned the previously indexed 05:09 frame, replayed at 05:09,
and reported zero model calls. The parser, index, follow-up, OCR and admission
fixture suites passed 121 tests before two additional approximate-time cases;
this checks one real sampled frame, not general recognition quality.

Unconfirmed completed supplements now retain a separate list of their actual
checked source frames for replay. The conversation labels them as sampled
frames, not matching evidence; they are not added to Answer events. The server
checks the version-bound frame references and rejects missing files, and the
client rejects foreign or malformed frame URLs. In the isolated basketball page,
reusing the red-headband check showed its 05:09 frame, sought to 05:09 and kept
the replay after refresh; no new model call was made. The frontend was rebuilt,
194 frontend tests, 42 relevant backend tests and `make check` passed. This is
one negative example, not a recognition-quality benchmark or production test.

An API review found that an index answer could reuse an existing supplement's
request ID with a different question, or publish a partial index answer while
that same supplement was still running. Request identity is now checked against
the original supplement payload, owner, investigation, source generation and
desk epoch, including again at publication. A running supplement cannot be
published as a completed answer. A fixture integration regression holds a
worker open, verifies both rejection paths and no saved query, then checks the
unknown-dispatch path still preserves existing partial evidence. Forty-five
job, index, supplement and routing tests and `make check` passed before the
additional running-with-existing-evidence regression, which also passed. No
cloud call or production change was made.

A completed supplement can now be reused after another supplement publishes a
new index version, provided the old and current content-hash-validated versions both
contain the same validated supplement. Owner, investigation, source generation,
question and parent must still match. In a copied real-basketball workspace, a
new local green-headband check published another version; repeating the earlier
red-headband question returned its existing checked 05:09 frame with no new
supplement job or model call. Fixture regressions cover both positive and
unconfirmed prior results, different questions, and a missing old version;
an unverifiable prior version returns 409 rather than dispatching again.
Ninety-nine relevant tests, the additional missing-version regression and
`make check` passed. No cloud call or production change occurred.

OCR candidate eligibility now checks both the question and the number of sampled
frames in its scope. Empty scopes and scopes with more than eight frames no
longer offer the operation; a stale action explains why it cannot run. An
isolated browser test on a copied basketball workspace checked the existing
05:09 text candidate and source timestamp without cloud calls. Empty and
oversized scopes were checked with fixtures, not real-video examples. The
targeted backend suite passed 24 tests, the frontend suite passed 90 tests,
the frontend build and `make check` passed. These checks do not establish the
required human-reviewed recognition quality or enable the new index on the
user's existing service.

A retained OCR action now also explains when OCR has since been disabled or
the index search requires clarification. Previously those paths could leave
the user looking at results without saying that OCR had not run. Two frontend
fixture regressions cover these cases and verify that no OCR request is sent;
92 targeted frontend tests, the frontend build and `make check` passed. This
change has not been verified on the production site.

The optional OCR processor runs Tesseract with English data only. It previously
accepted a Chinese or other non-ASCII literal and could misleadingly report a
completed search with no candidates despite not supporting that script. It now
rejects those literals before running OCR; existing indexed observations remain
searchable. Fixture tests cover Chinese, mixed Chinese/English, and accented
text. Twenty-five targeted backend tests, 92 frontend tests, the build and
`make check` passed. This does not add Chinese OCR or measure OCR accuracy.

A bounded supplement-planning regression found that a confirmed subject could
hide another subject with no grounded attributes in the same sampled frame:
the short-range fallback skipped any frame with a positive match, even when
another subject remained uncertain. The fallback retains that frame for
bounded review for multi-condition queries. Forty planning and supplement fixture tests and `make check`
passed; planning alone sends no model request. This fixture does not establish
real-video recognition quality.

An upload-to-chat synthetic integration test now verifies that a bounded
question can preserve an existing match while planning a review for another
unidentified subject in that same sampled frame. It also exposed that “列出画面”
was treated as an unknown visual condition; the parser now treats that exact
phrase as an output request. Forty-five integration, parser and planning tests
and `make check` passed. The test verifies the plan without dispatching a
supplement; it is not a real-model or browser quality evaluation.

The same wording was subsequently sent through an isolated browser using a
synthetic source and processor. The UI entered bounded supplement processing;
the synthetic supplement did not complete, and the UI retained the existing
00:00 index evidence with a clear incomplete warning instead of silently
retrying. Its evidence button sought to 00:00 and the answer survived reload.
This checks the failure path and persistence only, not a successful supplement,
real recognition quality, or production behavior. No cloud model was called.

A later full regression exposed that the same fallback unnecessarily scheduled
an already matching text frame when another subject lacked a text field. The
rule was narrowed to multi-condition questions; a single-condition positive
remains a hit without that redundant supplement. The earlier browser fixture
above predates this narrowing and does not validate the current single-condition
route. Updated multi-condition integration and text-planning regressions pass.
The subsequent full backend suite passed 535 tests and the frontend suite
passed 203 tests. These are fixture regressions, not paid-provider validation.

Before that narrowing, after correcting the synthetic test processor to return the expected separate
verification response, a fresh isolated browser run of that same question
completed its bounded synthetic supplement. The answer cited the updated 00:00
source frame, labelled the supplement as synthetic, sought to 00:00 and survived
reload. This verifies a synthetic success path; it does not establish real
recognition quality or production readiness. No cloud model was called.

The indexing progress watcher previously stopped silently after one hour even
if the index was still running, leaving chat locked until the workspace was
reopened. It now continues while that knowledge job is active and the same
investigation is open. A newer watcher invalidates older in-flight responses so
they cannot overwrite a completed status. Frontend fixture tests simulate more
than one hour and a delayed stale response; all 81 workspace persistence tests,
the frontend build and `make check` passed. A network error can still stop the
watcher; this change has not been deployed or tested with an hour-long job.

The watcher now retries only its read-only progress request after transient
network, 429 or server errors, with three bounded backoff attempts. It does not
restart indexing or resend a model request. Authorization errors and exhausted
retries stop with a message to reopen the video; navigation invalidates the
watcher. Eighty-four workspace persistence tests, the frontend build and
`make check` passed. These are simulated transport failures, not a live outage
or a production deployment.

An isolated browser check subsequently simulated two HTTP 503 responses during
index progress reads. The page showed its reconnect message, then observed the
synthetic job become ready and enabled the question field without a page reload.
The test manually changed a fixture job's status; it does not prove that a real
long-running index completes or that production networking behaves the same way.

An agent-only inspection of eight saved basketball samples at 05:04–05:11
compared two same-subject queries against the existing published index. The
blue-jersey/yellow-headband query returned 05:09 and 05:10; the white-jersey/
yellow-headband query returned no sampled hits. The agent could visually
confirm the blue jersey and yellow headband in the two close-ups, but could not
reliably assess the smaller figures in the other samples. This is a limited
distractor check, not human annotation, proof of absence, a recall score, or
a new model call. The original source and index were not modified.

The existing local 127.0.0.1:8765 service was restarted to load the current
backend fixes after checking that no jobs or queries were running and making
SQLite online backups in a private temporary directory. The original fixture
runtime and local-vision configuration were retained; the new knowledge-index
gate remains disabled pending its quality acceptance. HTTP returned 200 and
the post-restart database still contained 3 videos, 11 investigations, 32
completed queries and 21 historical model attempts. No model request, approval,
budget, media, or production service was changed. Record counts do not by
themselves prove every draft or answer renders correctly.

An agent inspection of the existing basketball index found no white-jersey or
blue-jersey hits for 05:20–05:28, although both colors are visible in the
sampled court views. In an isolated copy, the page asked for a white jersey at
05:20. The local processor performed one extraction and one verification call,
published a supplement and returned the source frame at 05:20; clicking replay
sought to 05:20 and the answer survived reload. Repeating the same question
returned that frame with no additional local receipts. This is a single-frame
agent-inspected recovery, not a human-reviewed recall or whole-video quality
result. No cloud call or original workspace change was made.

Inspection of the original 05:20 and 05:21 base observations explains the
white- and blue-jersey retrieval gap: each subject has a `garment=jersey` fact
and a separate generic `color` fact, but no fact binds that color to the
jersey. The strict retriever therefore correctly treats the garment color as
uncertain rather than assigning a person's generic color to clothing. The later
single-frame supplement recovered one verified-by-model observation; it does
not repair or validate the other seven sampled frames. The separate color and
garment fields were left unchanged, and no historical answer was rewritten.

For explicit scopes of at most eight seconds, the index timeline now separately
offers up to eight partial-subject candidate frames. They are marked for human
review and never counted as matching observations or answer evidence. In an
isolated copy of the real basketball workspace, the 05:20–05:28 white-jersey
query displayed eight uncertain candidates and zero confirmed indexed matches;
selecting 05:20 sought the player to 05:20. This used no model calls and did not
modify the original workspace. Sixty-one backend and 85 frontend targeted
tests, the frontend build and `make check` passed. The feature is not full-video
search, not a human-reviewed accuracy result, and has not been deployed.

A synthetic API regression also checks candidate provenance across versions:
the historical answer's immutable index yields two uncertain leads, while the
new index after a supplement yields two matches and no uncertain leads for the
same scoped, explicitly structured conditions. The test and `make check` passed;
it does not attest to recognition accuracy or exercise a real provider.

Candidate browsing now covers the entire indexed video, with eight candidates
per page and the same version-bound snapshot on subsequent requests. In an
isolated basketball page, an unscoped white-jersey query showed 52 sampled
index matches and 326 separate uncertain leads; the second candidate page
loaded and its 00:08 button sought to 00:08. Those large candidate counts
illustrate limited base-index precision and are not a claim that all are white
jerseys. This used existing data and no model calls; it is not a human-reviewed
quality score or a deployed feature. Seventy-eight targeted backend tests,
86 workspace frontend tests, the frontend build and `make check` passed.

Additional frontend regressions hold a candidate-page response while the user
changes attribute filters, and simulate a changed index version on a later
page. Stale or mismatched candidates are not appended; the latter displays a
load-failure notice. Eighty-eight workspace persistence tests and `make check`
passed. These are controlled asynchronous tests, not a real-provider run.

Matching results and uncertain candidates now have separate groups, and later
matching pages are inserted before the candidate group. An isolated browser
check using the saved basketball index loaded the second matching page and
confirmed its 05:56 result remained above the labelled candidate group. No
model was called. Eighty-nine workspace frontend tests, the frontend build and
`make check` passed; this presentation change is not deployed.

Candidate browsing now has a time-jump control, so a long list need not be
traversed eight frames at a time. A real-basketball isolated page opened the
saved whole-video query, entered 05:20, displayed uncertain candidates from
05:20 onward and sought the original player to 05:20. The same-version
snapshot remains required; candidates are still not answer evidence. Fifty
targeted backend tests, 90 workspace frontend tests, the frontend build and
`make check` passed. No model was called, no original workspace was changed,
and this feature is not deployed.

Additional fixture regressions verify that a candidate time jump rejects a
different query snapshot, that a different owner cannot read either the
candidate request or its frame, and that an older candidate-page response
cannot overwrite a newer time jump. The focused API test, 91 workspace frontend
tests and `make check` passed. No model was called.

The full suite exposed an interleaving in video detail reads: metadata could be
read before preflight committed while job state was read after completion. The
detail endpoint now reads source, preflight job and knowledge job from one
SQLite snapshot. A controlled interleaving regression reproduces the timing and
checks both the old and new consistent states; the upload test and 36 related
tests passed. A full run before this fix had one failure out of 536 tests; that
run is not claimed as passing after the fix. A subsequent full backend run
passed all 538 tests after the snapshot fix and search optimization.

Separately, repeated subject-condition verdicts are now cached only within a
single search, capped at 4,096 entries. On this Mac, the same 385-sample
basketball query took approximately 0.43–0.45 seconds before and 0.025 seconds
after in three local process measurements, with the same 52 matches and 326
uncertain leads. This narrow timing is not a production benchmark or a visual
quality score. Sixty-four focused retrieval tests and `make check` passed.

The video library endpoint had the same possible preflight interleaving as
the detail endpoint. It now reads each owned source, preflight job and
knowledge job from one SQLite snapshot. The deterministic interleaving test
now covers both endpoints; 15 status/workspace tests and `make check` passed.
This has not been deployed or tested under production concurrency.

### 真实素材补查：主色与多色装饰（本机隔离测试）

- 在隔离工作区的篮球视频上查询 05:21–05:28 白色球衣，首次使用本机视觉完成 7 次提取和 7 次复核；没有云端模型调用。原结果返回 5 个抽样时点。检查已保存的结构化观察发现，05:22 和 05:27 的白色球衣分别带有多色 accents，检索器未能区分衣服主色与装饰色。
- 修正通用服装描述中多色 trim/accents 的主色解析，保留同一主体属性绑定，不把装饰色当作主色。针对白色与红、蓝、黑装饰添加回归测试。
- 重启隔离测试服务后在页面重新发送同一问题：复用现有观察，返回 7 个抽样时点；点击新增的 05:22 引用，播放器定位到 05:22 并保持暂停。提取／复核记录仍分别为 27／23，重复查询未增加本机或云端模型调用。旧答案保持原样。
- 这只是一个真实片段的针对性回归，不代表整片逐帧覆盖，也不是人工标注质量验收；20 条人工案例及精度／召回门槛仍待完成。用户原始工作区、预算和线上服务未因本次测试修改。

After the multi-color accent fix, a fresh full local regression run passed
540 backend tests (`make test`) and 209 frontend tests (`npm test`), and
`make check` passed. These tests include mocked provider and budget paths; they
are not evidence of live Token Factory availability, human-reviewed retrieval
quality, or a judge-accessible deployment. No paid model request was made.

A controlled planning regression exposed a same-frame edge case for a
single-condition, explicitly time-scoped query: one matching subject caused a
second subject with an unknown attribute to be skipped during bounded
supplement planning. The planner now retains the frame as a candidate when
another subject is unknown, while still skipping already resolved frames. The
new regression failed before the fix and passes afterward; 49 planning,
supplement, automatic-routing and index-chat tests plus `make check` passed.
This is a fixture-level result, not a real-material quality measurement. No
model calls, budgets, original data, or deployed service were changed.

An additional fixture regression covers the same uncertainty without a user
specified time range: when one subject matches and a second subject in that
same frame has no grounded attributes, the earlier planner dropped that frame.
The confirmed match now locates a bounded candidate for the unknown subject;
it does not establish that the second subject matches, and unrelated frames
with no grounded lead are not added. The regression failed before the change
and passed afterward. Fifty targeted planning, supplement, index-chat and
automatic-routing tests and `make check` passed. This is an offline fixture
result; no model calls or deployed changes were made.

**Correction to the preceding two planner notes:** Broader upload-to-chat
integration exposed an important distinction that the earlier unit tests missed.
For a single-condition appearance-time query, a frame already has its answer
when one subject matches. Rechecking that timestamp merely because another
subject lacks the field also caused a text subject to trigger unnecessary
person or OCR supplements. The single-condition changes described above were
reverted. A short explicit range can still locate genuinely unmatched frames;
multi-condition unknown-subject planning remains covered. The product does not
claim to count people or identify all subjects in a frame. New unit and API
regressions verify reuse of the existing matched frame without a new processor
call. All 57 knowledge-job, planning and supplement tests and `make check`
passed after the correction. No real model call or deployment was made.

### Real basketball blue-jersey supplement (isolated local page)

On the existing isolated copy, the published index initially had no structured
blue-jersey hits for 05:21–05:28. The page submitted that scoped question and
ran a bounded local Qwen supplement: 7 new extraction and 7 new verification
receipts, no cloud requests. It returned sampled frames at 05:21, 05:25,
05:26 and 05:27. Clicking 05:25 sought the source player to 05:25; the answer
survived refresh. Repeating the same question returned the same four frames
with zero model calls and the receipt counts unchanged (34 extraction, 30
verification in the isolated workspace).

The contact sheet inspected by the agent also appears to show blue jerseys at
05:22–05:24, so the result may have missed visible matches. This observation is
not independent human review or an acceptance score; it is evidence against
claiming complete recall. The original user workspace, budgets and production
service were not changed. This local test does not validate Token Factory.

The saved 05:21–05:28 local receipts showed that the three omitted blue-jersey
frames were actually extracted and verified as `blue jersey with number 0`;
the color/item matcher rejected that extra suffix. The matcher now recognizes
a narrowly formatted numeric-number suffix for the item's primary color without
turning the number into a separately verified fact or matching another color.
A regression reproduces the original miss and checks that an unrelated number
or color is not inferred. The same isolated browser question then reused the
existing published observations and returned seven sampled times (05:21–05:27)
without another model call; the added 05:22 frame sought to 05:22 and the answer
survived refresh. The old four-frame answer was not rewritten. Receipt counts
stayed at 34 extraction and 30 verification; no cloud call occurred. Ninety-four
retrieval, occurrence, planning and knowledge-job tests and `make check` passed.
This is a focused real-video check, not independent human acceptance or proof
of full-video recall, and it is not deployed.

A read-only scan of the isolated basketball index after the number-suffix fix
examined 1,492 garment, headwear and accessory values. Of these, 203 contained
both a recognized color and item; none of those 203 had remaining unrecognized
words after the narrowly supported primary-item parsing. The other values may
lack color or item information and are not counted as verified matches. This
format scan does not measure whether the visual model was correct or complete.
It sent no model requests and did not modify the index.

After the number-suffix fix, the full local backend regression suite passed
543 tests. A later request authorized copying the candidate source to a private
staging directory on the existing Nebius host. The staged 88-file source/package
manifest matched local bytes and all 48 Python source files parsed on the host;
the serving process and configuration were not switched. HTTPS remained 200.
A subsequent attempt to run an isolated Linux fixture smoke could not connect to
SSH (two connection timeouts), while HTTPS still returned 200; therefore this is
not a Linux functional acceptance. The two review findings and the human-reviewed
quality gate remain open. No budget or model call was added.

A local Linux container smoke used Python 3.13 and dependencies exported from
`uv.lock`, with one Uvicorn worker, an isolated temporary workspace, read-only
container filesystem, no external network, and no GPU. HTTP checks passed for
fixture health/session, the homepage, synthetic demo evidence, byte-range video
playback, unauthorized private media, and a chat POST without CSRF. The first
smoke assertion incorrectly expected 401 for a request that already had a
session; the corrected check separately verified 401 without a session and 404
for a different owner's media. No model call occurred. This is a local Linux
container, not the Nebius host or real-model/decoder-isolation acceptance.
A fresh SSH connection to the existing host still timed out; no firewall or
server settings were changed.

The two post-review supplement-retention findings were reproduced against a
disposable synthetic Workspace using the actual cleanup and admission methods:
after cleanup, 1,000 completed synthetic supplement rows still caused the next
supplement to return `knowledge_supplement_capacity` (429), and the rows still
contained their synthetic question bodies. No user data was used. These remain
unfixed under the user's review instruction not to fix issues without a later
request. No model was called. A new SSH attempt to the existing host timed out;
no access-control settings were changed.

A separate no-network local Linux container included Debian FFmpeg and
bubblewrap, with all capabilities dropped and no-new-privileges. A generated
one-second synthetic MP4 was valid to FFmpeg, but this container's kernel policy
prevented bubblewrap from creating a namespace. The actual sandboxed probe
failed closed (`invalid_media`), and an HTTP upload reached a terminal failed
preflight instead of reporting the index ready; health reported zero model
requests. The error is generic and does not identify the namespace restriction.
This is a test of the local container policy, not the existing Nebius host's
AppArmor/user-namespace policy. No security restriction was weakened, and no
server, original media or budget changed.

A later read-only connectivity check found that HTTPS still returned 200 while
SSH continued to time out. The Nebius CLI requested an interactive browser
login rather than returning VM status; the pending authentication was stopped
without selecting an account or changing access. The cause of the SSH timeout
remains unverified. The existing host and firewall were not modified.

A subsequent read-only submission-preparation check confirmed through the
repository API that the existing GitHub repository remains private. A narrow
pattern check of authored frontend and application source found no PEM private
key block, Google API-key-shaped literal or `sk-`-shaped literal; this is not a
complete secret, history, asset-rights, or license audit. No GitHub visibility,
repository content, or publication state was changed. The existing Nebius
console tab reports an expired session; no account was selected.
