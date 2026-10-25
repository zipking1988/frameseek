# FrameSeek night QA — 2026-10-25 JST

User authorized autonomous testing/fixes while asleep. Existing cumulative limits
remain USD5 and 40 model requests; no GPU, new budget, index rebuild, unknown replay
or private repository publication. Start: 29 consumed requests, USD0.668047 occupied.
Current budget version: `tf_basketball_usd5_40_20261025`. Re-check before live dispatch.

## Scope and evidence

- Production: https://framefix.net, current owned basketball source, new clearly
  named QA investigation to avoid rearranging the user's main desk.
- Local: isolated fixture-only service and mock transports; no production secrets.
- Existing dirty checkout is preserved. No commits or stashes authorized/needed.
  QA skill's clean-tree/commit workflow is superseded by the user's instruction to
  continue routine work autonomously and the repository's preservation requirements.
- Screenshots and private financial/model artifacts remain ignored under
  `.frameseek/qa-night-20261025/` or the remote private workspace.

## Checks (in progress)

| Check | State |
| --- | --- |
| Full backend offline regressions | 215 passed |
| Frontend regressions / build / schema checks | 102 passed; build, Ruff and schema drift checks passed |
| Fixture navigation, deletion, resizing, refresh, drafts | deletion → refresh → restore retained answer and draft; both splitters respond to keyboard; A → new B → A → refresh → B retained independent drafts and A evidence |
| New production explicit-time question with evidence and seek | 01:00–01:12 partial, 8 frames; loading/completion feedback repaired and actual paused target image verified online |
| Contextual follow-up anchored to verified frames | 01:01–01:09 partial, 7 frames; persisted parent verified; 2 calls |
| Alternate early/middle source window | 03:00–03:10 partial, 8 frames; numeric wording defect below |
| Audio unavailable refusal without a model request | confirmed ledger stayed at 35; precise explanation fixed and mock regression passed |
| Pending/unknown recovery controls after completion | stale action fixed; deterministic unknown → cancel → fresh success regression passed |
| Budget counters / ownership unchanged by UI-only actions | prior 29 baseline preserved; 6 new completed calls, no new unknown; post-deployment both scopes verified 35/40 and USD0.884047 |

## Confirmed investigations

1. The previously completed successful production round left “恢复查询” visible
   with no active request. The stale recovery action is misleading. Reproduce in
   isolated regression before fixing; no paid call is needed for reproduction.
2. Saved panel widths are restored without checking a smaller viewport. Test
   reload at smaller desktop widths before deciding whether a fix is needed.

## Follow-up

A thread heartbeat will continue at hourly intervals, at most six scheduled runs,
quiet when unchanged. Read this report first and do not repeat completed paid tests.

## Results and changes — first overnight pass

Three real chat turns completed through the new approval version without re-ingest,
using two model calls each and no JSON repair. Their statuses are `partial`, with
explicit sparse-sampling and missing-transcript warnings. The second question has
its real first-query parent in durable storage. No identities were inferred.

Current ledger: **35/40 requests; USD0.884047 occupied of USD5**, leaving five
requests and USD4.115953. Occupancy includes conservative completed reservations
and all historical unknown reservations; it is not a provider invoice. The six
new responses report an uncached token-price estimate of **USD0.0116496** in total.
No reconciliation/refund was applied during this pass. Do not re-run these paid
questions. Prefer offline work now and keep the five calls available for useful
acceptance or the user's tests.

Fixed:
- Fresh completed queries hide a recovery button left visible by an older unknown
  request. The regression also verifies exactly one new dispatch and one explicit
  cancellation; navigation ownership checks remain in place.
- Restored widths are bounded by the current desktop viewport after restoring
  panel visibility. A real-function VM regression proves wide-desktop values
  cannot reduce the center below 420px on a 1280px desktop. Actual window resizing
  across viewports was not available through the browser tool.
- Missing audio now explains that no reliable transcript exists and no model call
  or new model cost occurred; the mock transport and attempt count stay unchanged.
  Previously it misleadingly displayed a generic investigation failure.

Outstanding findings:
- At 03:00 the answer says the right-hand number decreases from 14 to 23. This is
  internally inconsistent, so numeric temporal analysis is not accepted as reliable.
  Do not hard-code basketball corrections or claim all model answers are accurate.
- The in-app browser sometimes kept the previous paused video image while its
  clock and buffered ranges had already changed to 03:00. Playing then pausing
  refreshed to the correct later court scene. This may be a WebKit/compositor or
  application interaction; root cause is not established. Investigate offline
  without autoplay/audio or additional model calls, and do not call seeking fully
  verified until the displayed paused frame is confirmed.

Ignored screenshot evidence: `round1-evidence.png`, `round2-followup.png`,
`round3-scoreboard-loaded.png`, `round3-playback-refresh.png` under
`.frameseek/qa-night-20261025/`. The main user's investigation was not rearranged;
these five questions live in a separate named night-QA desk.

Final deployment verified: existing single service active, no in-flight queries were
interrupted, and the new audio explanation is visible online. A second differently
worded audio question still left both ledger scopes at 35/40 and USD0.884047.
Final package: ignored `dist/night-qa-final-20261025.tar.gz`.
Additional screenshot: `audio-refusal-fixed.png`.

Next heartbeat: focus on offline paused-seek repaint reproduction and the
zero-evidence trace label (currently “模型回看” even for the audio guard that made
no calls). Do not infer paid activity from that label. Keep the five remaining
calls for useful acceptance rather than repeating successful tests. The isolated
fixture service remains on port8766 (no secrets) and its QA tab is retained for
continuation. The production tab remains on the separate QA investigation.


## Heartbeat pass — October 25, approximately 01:20 JST

No model requests dispatched. Read-only verification of both active ledger scopes
still reports 35/40 and USD0.884047; no queries were running before deployment.

Confirmed and fixed misleading inspector provenance: the old label selected
“模型回看” solely from `query.mode === real`, including the audio guard that had
made zero calls. The real-query summary now says “画面证据” when evidence exists,
and “未生成有效证据” when empty; its process heading says “证据检查”. Synthetic
queries retain “预设匹配”. This makes no inference about paid activity from mode
or an empty evidence list. Three actual Inspector SSR regressions cover audio
refusal, failed vision and real-vs-fixture labels. All 98 frontend tests, build,
Ruff, schema drift and whitespace checks pass. No backend behavior changed in
this heartbeat; the prior 215 backend tests are still the latest full run.

Paused-frame investigation: reproduced a black paused preview once on the local
fixture, then tested removing the redundant pause after setting currentTime.
The candidate worked, but restoring the original implementation also passed
00:13 → 00:00 → 00:13 with correct left/right box images. Therefore that hypothesis
was not established; the experimental code change was reverted and is NOT a fix.
The prior intermittent production observation remains open. No autoplay workaround
or synthetic substitution was introduced. Local control screenshots are ignored
`seek-control-original.png` and `seek-control-original-right.png`.

Release prepared/deployed: ignored `dist/night-qa-basis-20261025.tar.gz`.
Next: non-paid browser verification of updated provenance, and further bounded
paused-seek checks. Avoid repeated known-successful paid questions.

Post-deploy browser verification passed: the saved zero-call audio question now
shows “这轮依据 0 张证据 · 未生成有效证据”; expanded details say “证据检查”,
not model review. Proof: ignored `basis-no-false-model-review.png`. No new query
was submitted. Keep the remaining five model requests. The next scheduled pass
should investigate only the still-open intermittent paused frame or another
reproducible gap; do not repeat this completed UI fix.


## Heartbeat pass — October 25, approximately 02:20 JST

Completed remaining navigation persistence coverage on the isolated fixture
service only. Renamed existing A, immediately created B, typed a distinct B draft,
returned to A via the library, refreshed A, and reopened B. A retained its original
question, evidence, paused 00:13, 400px source width and original draft. B remained
an empty investigation with its separate draft. No new question was submitted.
Proof: ignored `navigation-draft-preserved.png`.

Browser warning/error logs for both the fixture and production tabs were empty.
No new failure or reproducible paused-seek root cause was established. No behavior,
approval, runtime, TTL, deployment or model requests changed in this pass; therefore
no repeated build or full test run was needed. The last verified ledger remains
35/40 and USD0.884047, with five requests kept for useful acceptance/user tests.
The production site was not navigated or its questions modified. Next checks
should remain bounded and avoid repeating completed navigation/paid tests.

## Heartbeat pass — October 25, approximately 03:20 JST

Further bounded, zero-model isolation of the paused-frame issue:
- Reused saved production evidence; seeking from 03:05 to 01:00 again changed
  the displayed clock while retaining the old basketball image. A fresh temporary
  production tab restoring the same QA desk behaved similarly. This is now a
  repeatable observation on this basketball source in the in-app browser, not
  merely a one-time screenshot. No question or paid request was submitted.
- A temporary standalone localhost page used only a native video element and
  currentTime buttons against the public synthetic demo. It had no FrameSeek
  JavaScript, private media, or autoplay. Both 00:13 and 00:06 fired `seeked`,
  readyState4/paused=true, and displayed the correct right/center box frame.
  Thus the observed failure is not established as a generic native seek failure.
- Checked the original preview poster (actual timestamp0). It is different from
  the stale image observed after restoring 03:05, so a permanently displayed
  original poster is not a sufficient explanation.

The remaining hypotheses include basketball codec/keyframe handling and the
in-app browser's paused/offscreen presentation path. Their internal cause has
NOT been proven. No playback workaround, forced autoplay, media re-encode,
frontend change or deployment was introduced. Do not claim this issue is fixed.
Evidence: ignored `seek-0318-first.png`, `seek-isolated-control-right.png`,
`seek-fresh-tab-0100.png`, and `preview-frame0.jpg`. The temporary standalone
server on8767 and both temporary browser tabs were closed after testing; the
original QA tabs and isolated fixture service on8766 remain available.

No approval or spending limits changed; the last verified ledger remains35/40,
USD0.884047. Prior98 frontend /215 backend verification is unchanged. Future
passes should not repeat this matrix without a new diagnostic hypothesis.


## Heartbeat pass — October 25, approximately 04:20 JST

New diagnostic hypothesis: distinguish source/codec corruption from the deployed
media path and workbench seek handling. Used the existing original basketball
file in the isolated fixture service; uploaded it through the normal owned UI.
Only preflight ran. The page explicitly reported no configured model/budget and
no model requests. Original local and deployed source SHA256 checksums match.

Controls:
- Browser-native document for the owned local basketball media displayed the
  correct 01:01.9 image after a paused native scrub (GS97/TOR101). This native
  media document initially auto-played by browser behavior; it was promptly
  paused and closed after testing. No autoplay workaround was added to FrameSeek.
- A temporary same-origin control page used the same protected media URL with
  no workbench scripts, `preload=auto` and NO autoplay. Before any play, seeking
  to60 fired seeked/readyState4/paused=true and rendered the correct close-up.
  Adding the application's `currentTime=t; pause()` sequence also rendered correctly.
- A temporary copy of the actual workbench page added only a data-time=60 test
  button, using the unmodified production seek function with the uploaded real
  source. It displayed the correct01:00 image while remaining paused.

These findings rule against a corrupt/different source file and against a
universal codec or redundant-pause failure. They do NOT yet prove whether the
remaining deployed-only observation is remote media delivery, saved-workspace
interaction, or browser presentation timing. Nginx config review confirmed proxy
cache/buffering/next-upstream retries disabled. A bounded journal scan exposed no
matching video HTTP errors; absence of logs is not proof of correct delivery.
No speculative code/config/media changes were shipped.

Proof is ignored under the QA directory: `basketball-native-only-seek.png`,
`owned-preplay-seek.png`, `owned-preplay-pause-seek.png`,
`local-actual-workbench-seek.png`. All three temporary browser tabs and both
local-only HTML diagnostic files were removed. The diagnostic local upload
remains ownership-protected under the fixture workspace's normal expiry; it was
not indexed, mirrored to any provider, or substituted with synthetic answers.
No live query, approval, budget, runtime or source TTL changed. Prior98 frontend
and215 backend test results remain the latest runs; no behavior changed in this
pass. Further work should target deployed range/delivery or persisted-workspace
interaction, not repeat the now-passing local controls.

## Heartbeat pass — October 25, approximately 05:25 JST

Added temporary, range-only Nginx diagnostics to distinguish missing range support
from slow target-data availability. Logs recorded only status/range/content-range,
length/byte counts, elapsed time and upstream status; no URI, cookie, owner,
question or body. Original Nginx config was backed up privately, then restored;
`nginx -t` and reload passed both times. Diagnostic format/map were removed and
private log retained at600 permissions under the existing workspace.

Observed206 from both proxy and upstream, correct total source length118484710,
initial and later byte ranges. One range transfer remained open19.343s before
cancellation; this alone is not a measurement of end-user seek latency. After
browser buffers covered01:00 with readyState4, the paused player DID render the
correct01:00 close-up without playing. Proof: `remote-range-settled.png`.
Thus some previous stale-frame observations can be explained by asynchronous
remote loading, though this does not establish the full network/compositor cause.

Confirmed application defect: `seek()` announced “已定位” immediately after
assigning currentTime, before the target data/seek completed, presenting an old
frame as if the jump was finished. Fixed the feedback contract: show loading,
complete only after the media is not seeking, has decoded data and is within
0.25s of the current target. Guard against old completion events; clear pending
state on errors/source change/reload, preserve pause, and allow native scrubbing
to replace a pending target. No autoplay or re-encoding was introduced.

Four focused async regressions cover buffering, late older completion, source
failure, and native scrub replacement. All102 frontend tests, build, Ruff/schema
checks pass. No backend behavior changed; prior215 backend tests remain latest.
Read-only verification before deployment: both ledger scopes35/40, USD0.884047;
no running query. No model was called or approval/TTL modified.
Final release: ignored `dist/night-seek-ready-final-20261025.tar.gz`. An earlier
same-named draft package was intentionally not overwritten; the final package
has the native-scrub regression/fix included. No commit or push was made.

Post-deploy browser check: clicking saved01:10 evidence now visibly shows
“正在定位 01:10 · 等待画面加载…” while the remote range loads, instead of claiming
the old image is a completed jump. Screenshot: ignored `seek-ready-online.png`.

The same online check then transitioned to “已定位 01:10 · 保持暂停” after target
data arrived (actual timestamp70.5s, readyState3, paused=true). The screenshot
shows the corresponding court frame rather than the old close-up. Completion
proof: `seek-ready-complete-online.png`. This validates the repaired loading /
completion feedback path for this range. It does not prove all network conditions
or all model numeric answers. The remaining model temporal-number inconsistency
is still an explicit acceptance limitation. Both prior unknown reservations and
five remaining request slots are preserved.


## Final bounded overnight check — October 25, approximately 06:20 JST

Six scheduled follow-ups are now complete. Read-only final audit confirms both
active scopes remain35/40, USD0.884047 occupied ofUSD5; attempts are31 completed
and4 historical unknown, with no running query. Both production services are
active. Temporary Nginx diagnostic config is absent; original config is restored.
No model calls were made by the six hourly follow-ups. The preceding three chat
turns used six new completed calls total, estimatedUSD0.0116496 by returned tokens.
Ledger occupancy is not an actual provider invoice or statement of credit expiry.

Delivered five focused fixes across the night: recovery-button cleanup, bounded
width restoration, explicit no-transcript/no-call audio errors, non-misleading
basis labels, and seek loading/completion feedback. Latest verification102 frontend
tests,215 backend tests, build, Ruff/schema drift and whitespace checks passed.
Full backend tests preceded the final frontend-only fixes; they were not rerun
without a backend change. All fixes are deployed to the existing single process.

Remaining acceptance limitation: model temporal-number wording can be internally
inconsistent (14 decreases to23). No generic accuracy guarantee or complete-MVP
acceptance is claimed. Network seek latency also varies; completed target display
and truthful loading feedback were verified, not every network condition.
Five model calls remain, normally enough for about two short specified-window
questions if both use two calls; they are not five full chat turns. All existing
unknown reservations, limits and source/calibration validity are unchanged. Current
validity ends2026-10-25 20:25:50 JST; no extension was performed.

The isolated fixture server on8766 and its agent-owned tab were stopped/closed.
Its owned test data and prior original files were not deleted; no private data or
secrets entered Git. The online QA tab remains available; the user's original
main investigation was preserved. No commit, push, GPU or new resource was created.

The bounded night automation was deleted through the app after its six runs,
preventing repeat diagnostics or duplicate paid tests. This ends the scheduled
night pass, not all remaining product/model acceptance work. Future work should
start from the recorded limitation instead of replaying completed tests.


## User-authorized daytime repair — evidence suggestions and review, 2026-10-25

The user requested video-specific recommendations, no extra model calls, and
autonomous fixes while away. Cached answers and real saved frames now drive
separate basketball and box recommendations, with bounded original-video times
and a visible replayable basis. Existing chips remain fill-only and draft guarded.
A text-consistency guard now flags the recorded14-to23 countdown wording while
preserving the model's original answer/status; portable reports retain that caution.
This mitigates misleading presentation, not the underlying model visual accuracy.

124 frontend regressions, build and Ruff/contracts pass. Local and production
checks covered topic changes, exact326.1-second local replay /180-second online
replay, box00:06 provenance, retained chats and a successful offline HTML export
with23 embedded frames. No new paid question or re-ingest. The active cumulative
user allowance remains USD20 /40 calls;35 consumed requests and unknown reserves
are untouched. Full private source/query/chat/ledger/config fingerprints match the
pre-release snapshot. No new resource, credit, automation, commit or push.

Remaining acceptance work still includes human review of visual model answers and
end-to-end live quality; the rule-based caution is not general numeric/video
validation. No complete-MVP or judging outcome is claimed. The offline HTML is a
private evidence fallback, not a recording of live model execution.


## Deployed demo journey regression — 2026-10-25 JST

User requested a complete basketball/box workflow check without models or added
fees. Exercised https://framefix.net in the existing browser owner session and
existing investigations only. No production code change was necessary: no new
reproducible failure was found in this bounded UI regression.

- Basketball: scoreboard/clock questions derived from saved evidence; clicking
  a question filled the composer, kept five cached turns, and disabled the other
  question chips while a draft existed. Evidence replay remained available.
- Reload restored the basketball draft and five turns after asynchronous desk
  loading completed. Switching to the box restored its one cached fixture turn
  and its own box followups; switching back restored the basketball draft.
- Box: clicking its followup filled only; reload restored that draft. Existing
  reference00:10 replayed at10 seconds, and right-side source frame00:13 at13.
  Basis00:06 returned to the box scene. Synthetic provenance stayed visible.
- Basketball: existing03:08 reference sought188.867 source seconds; a subsequent
  03:01 reference sought181.267, confirming the final click wins. Basis03:00
  replayed180 seconds paused, readyState3/4 with a visible decoded frame. No
  completion claim was made from the initial transient readyState0/1 state.
- Both test drafts were cleared back to their original empty values. Another
  source round trip and reload verified cleanup and independent restored chat.
  Final browser view is basketball, selected cached question3, paused03:00,
  empty composer, save indicator '已保存 ✓'. Console error/warning log was empty.

`npm test`:124/124 passed. Readonly before/after production fingerprints match
for video,13 query rows, all five investigations' chat content (records/hidden
flags/pins/notes), budgets,35 attempts,25 settlements and private configuration.
Investigation row count stayed5; normal selection/playback/revision metadata
changed. Zero model requests, indexing, calibration, approvals, resources or
paid operations were performed. All unknown reservations remain untouched.

Private evidence: `.frameseek/demo-flow-qa-20261025/{before,after,verified}.json`,
`basketball.png` and `box.png`. This is cached-answer/fixture UX verification,
not new live inference acceptance: the earlier numeric answer contradiction
remains flagged, and box answers remain explicitly synthetic.


## Failed-query explanation and draft recovery — 2026-10-25 JST

User reported repeated unsatisfactory answers and the composer text asking them
for a complete question. Readonly production query audit found13 saved requests:
6 partial,7 error (one invalid_tool_request, two analysis_failed, two
query_cancelled, two audio_channel_unavailable). These are historical requests,
not13 independent quality trials. Some sparse-sampled answers also contain
unverified/inconsistent numeric claims. The preceding UI journey pass did not
establish answer quality. Known prior truncation diagnostics and the earlier
reasoning-effort fix remain documented above; generic historical analysis_failed
records alone do not establish a503, budget failure or current provider cause.

Fixed the misleading selected-failure composer label: it now retains the original
question rather than requiring the user to rewrite it. Inspector explains known
error codes without changing saved responses or pretending the failed search
proved no relevant footage exists. Unknown errors explicitly retain uncertainty.
Retry editing fills an empty draft, preserves existing edits, emits the normal
input event for autosave and never submits/retries automatically. Verified an
existing failed audio question online: original question recovered, survived
reload, then the test draft was cleared back to its original empty value.

125 frontend regressions, build, Ruff/format/schema checks pass. Static-only
release with rollback /srv/frameseek/failure-explanation-20261025/; all9 serving
asset hashes match. Full deployment audit unchanged; after browser verification
chat/query/video/ledger/config fingerprints remain unchanged and attempts35.
No model call, new resource, approval, financial-limit or historical-data change.
Private audit and screenshot: .frameseek/failure-explanation-20261025/.
This repairs explanation/recovery only; reliable open-ended video answering,
whole-video temporal coverage and numeric visual quality are not accepted.


## Local real-video questions blocked before model — 2026-10-25 JST

User supplied two new local failures for “谁投的3分最多？”. Readonly SQLite
inspection identifies both as real_blocked, not a model no-result. The localhost
service was intentionally left in fixture mode without FS_RUNTIME_FILE during
no-model UI development. Historical real-source answers could be restored, but
chat/prepare incorrectly returned ready and let agent.query fail afterward.

Fixed prepare admission for real sources when mode/runtime prerequisites are
missing: return runtime_blocked with an explicit no-dispatch message, preserving
the existing draft without creating a query/card. Owned source and generation
validation remain before this guard. Existing real_blocked records now explain
the pre-model failure rather than guessing its cause. No runtime enabled, key
installed, approval changed or paid call made. Local service restarted with the
same fixture-only configuration; online service not changed in this pass.

Real browser test on localhost clicked Send with that question and received the
configuration-blocked notice, retained the question and4 visible turns, and
created no query. The original two failed request IDs remain latest; original
draft restored afterward. Existing basketball/box records and tombstones remain.
Private screenshot: .frameseek/local-runtime-block-20261025/verified.png.

The request to identify the most frequent three-point scorer also requires
validated player identities, makes/misses and temporal count coverage; current
sparse sampled evidence does not establish those capabilities. No statistic was
fabricated and no paid verification was attempted. This patch fixes local
admission, not general sports statistics accuracy.


## Restore localhost real chat without a second budget — 2026-10-25

Explicit user authorization: enable their own submissions, keep cumulative USD20 /
40 requests, no budget reset/model test/automatic retry. Added a local-only shared
ledger SSH adapter and private allowlisted central ledger helper. All mutations
still use original AttemptLedger atomic owner+global accounting; no approval,
refund or reset method exists on the adapter. Readonly snapshots are ephemeral,
query_only SQLite for existing readiness/health interfaces. Key stays local.
The shared local route refuses JSON repair as well as transport retry.

Offline tests cover alternating online/local reservations reaching the same40
cap from35, preserved unknown reservation/idempotency, owner/version binding,
readonly snapshots, denied administrative methods, SSH timeout with one call
only, and malformed model JSON with no second request. No live paid dispatch.

Started the loopback service using the private current runtime and existing key.
Current local source generation/models/segments matched the production index,
with no missing frames; synchronized its existing budget-version binding only.
Original local SQLite was backed up; no chats or local historical budgets reset.
User edits observed during this work were preserved, including their current
unsent draft. Browser readonly Model/Budget dialog confirms all prerequisites.
Central before/after audit shows35 attempts and every budget/settlement/chat/query
fingerprint unchanged. Actual provider connectivity is intentionally untested.
Private proof: .frameseek/shared-local-chat-20261025/ready.png.

Final offline regression:230 backend tests and125 frontend tests pass; Ruff,
format and schema-drift checks pass. No browser Send/chat/model test was run
during this restoration. Local service session remains on127.0.0.1:8765.


## User-triggered real browser E2E — 2026-10-25 JST

User challenged the readiness-only restoration and explicitly requested an actual
page E2E. Root cause of new failures: full-search queries reserve up to8 requests,
but the restored ledger initially had5 remaining; the user's successful short
scoreboard question used2, leaving3. The selected/generic “继续这个问题” went
through full search and failed budget admission. This was not exhausted USD20.
UI queryFailureReason also omitted budget_blocked and falsely said cause unknown.

Fixes: budget_blocked now gets its actual category explanation. Content-free
“继续这个问题” is clarified before dispatch, without adding a failed card.
New /chat/prepare requests get the same readonly per-query budget plan used by
execution; insufficient whole-query admission states required/remaining calls,
retains the draft and creates no query. Existing idempotent pending/unknown/done
requests bypass fresh-budget admission after payload hash validation, so cached
recovery remains possible. Direct /chat retains structured terminal error format.
A local short-window query with JSON repair disabled now admits exactly2 calls,
not3; financial caps and accounting are unchanged. Full-search bounds remain
conservative. No unknown dispatch is retried or refunded.

Actual browser E2E performed in the existing local main basketball investigation,
not via direct provider script: captured original draft, clicked “另起问题”, filled
05:25–05:28 competition-clock question, clicked Send once. Request
829fdcc844bc4a9eb559a3f7a7d594ff completed partial, with exactly two completed
central attempts (zoom0/answer), no repair/retry and3 unique evidence frames.
The UI showed pending, then returned the answer and references. Clicking05:26
sought326.0 seconds paused with readyState4. Refresh restored task9 and the answer.
Original draft was restored only into an otherwise empty composer.

Visual review of original decoded JPEGs confirms bottom game clock17.4 at325s,
16.4 at326s and15.7 at327s, matching the requested answer. However, the model
volunteered incorrect upper-left shot-clock values10.2/9.9/5.9. Those claims are
not accepted: visible upper-left digits are10/9/9 (bottom shot clock11/10/9).
Original model response/evidence remain unchanged, not silently corrected. Thus
this proves a working single-clock E2E and also demonstrates continuing numeric
hallucination risk. It does not establish general answer quality or sports counts.

Central audit:37→39 calls, money occupancy1584047→2284047 USD_MICRO; cap remains
USD20 /40. One request remains, insufficient for another normal two-call round.
No further model dispatch. Unknown reservations and settlements unchanged;
production query/chat/media/config hashes unchanged because inference ran local
against the shared central ledger. Private audit, result and screenshot:
.frameseek/live-e2e-20261025/{before,after}.json, result.json, answer-and-seek.png.
Verification:231 backend tests,125 frontend tests, build, Ruff/format/schema checks
passed. Offline regressions cover no-call clarification/admission, remaining-count
explanation and short-window two-call admission; original idempotent replay and
budget failure tests also pass. No new resource, cap, approval or index work.


## Autonomous usability pass, paid calls preserved — 2026-10-25 JST

User asked to keep testing/fixing while away, without more permission. The finite
USD20/40 limit remains; this pass deliberately preserves the last1 request rather
than treating broad autonomy as a cap increase. Full remote before/after audit is
identical:39 attempts,2284047 USD_MICRO occupancy, all budgets/unknown states/
settlements/config/media/chat hashes unchanged. No provider request this pass.

Local changes:
- Short explicit Token Factory windows on the shared local route now use exactly
  one vision request. Frame/schema-validated observations directly form the
  answer; no second text rewrite, JSON repair or retry. Admission reserves one
  vision cost. The default production route retains its previous behavior.
- Vision instructions request Chinese, requested attributes only, and separate
  timestamp/value observations tied only to the corresponding frame IDs. This is
  a prompt improvement, not proof that numeric hallucinations have disappeared.
- A narrow static-attribute question referring to a prior single unique verified
  frame can reuse its one-second source window. Multi-frame ambiguity, broad
  statistics, identity/whole-video questions do not silently inherit this scope.
- Successfully reviewed short-window no-match returns bounded no_result with the
  sampling limitation in its answer, retaining schema0.1's empty unresolved list.
  Malformed/foreign evidence still errors; no invented source/frame is accepted.
- Unsupported highest-scorer/three-point ranking questions now get a capability
  explanation before dispatch/card creation. Content-free followups clarify free.
- Composer shows remaining requests and the short-window reservation count.
  Exhausted caps have an explicit message. Late snapshots cannot overwrite a new
  investigation's UI or draft; synthetic box hides the paid budget banner.
- Editing clears only stale preflight notices (not pending/unknown controls).
  Switching source clears stale player question heading and previous notices.
  Setup text no longer tells indexed users to analyze again.

Verification:235 backend and127 frontend regressions, frontend build, Ruff/format
and schema checks passed. New integration mocks exercise one remaining call,
valid references/actual decoded source times, no-match, foreign frame rejection,
no text synthesis/repair, zero remaining budget reporting and cached idempotent
restore without another call. Context helper tests reject multiple anchors,
nonfinite/invalid anchors and broad queries. Frontend regressions exercise
no-card/no-dispatch preflight and stale budget response isolation.

Also replayed the actual already-completed vision response from prior live E2E
request829fdcc844bc4a9eb559a3f7a7d594ff through observation/frame validation;
its3 original source frames validate. Saved as recorded-vision-validation.json.
This is offline reuse of a real saved response, not another live inference and
not a semantic accuracy fix for its known wrong extra shot-clock numbers.

Browser on actual localhost: “继续这个问题” clarified with the same7 visible turns;
“谁投的3分最多？” explained unsupported full tracking, also7 turns; both drafts
retained and no query/attempt created. Editing cleared the old notice. Budget
banner shows1/40 and one request for a short window. Box restored its1 cached
synthetic turn, hid paid banner, and basis replay sought6sec; basketball restored
its separate history/draft. Original draft was preserved. Private screenshots and
before/after audit: .frameseek/usability-polish-20261025/.

The new one-call path is offline/mocked and saved-response validated, NOT newly
paid-live accepted. The last request remains for the user; once spent, no further
model chat is possible under the unchanged40 cap. No claim of unrestricted
basketball statistics, complete MVP, model-quality acceptance or winning readiness.
