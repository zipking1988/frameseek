# Nebius deployment record

## Current release — 2026-10-30 JST, investigation recovery

Code commit `67805ac` is deployed on the existing single-process Nebius server
and pushed to the private development repository. The same application source
is available publicly in [frameseek-hackathon](https://github.com/zipking1988/frameseek-hackathon)
at commit `6c61f27`. The release protects verified evidence across
query cancellation and recovery, binds new query artifacts to their source and
request identity, checks source generations for follow-ups, and releases worker
capacity on additional failure paths. An explicit same-request retry is available
in the current page after an interrupted submission. The compatibility limits for
older unidentified partial checkpoints and source generations are documented in
[the workspace runtime guide](WORKSPACE_RUNTIME.md).

Release validation passed 610 local backend and 232 frontend tests, the frontend
build, lint, format and schema checks. On Linux, an isolated fixture precheck
passed without using production data. Before restart there were no running or
unknown queries or active ingest/index/supplement jobs. Both installed code
trees matched the release; logical hashes of the private databases, original
videos and evidence frames, and private configuration were unchanged across the
switch. Public `/`, `/workspace` and `/health` returned 200, and the served
`workspace.js` matched the release hash. The previous code and consistent SQLite
backups are retained under `/srv/frameseek/releases/67805ac-20261030-0019/backup`;
rollback must preserve the live ledger and workspace rather than restore old
database copies over new work.

No model question, new GPU, resource provisioning or budget change was made;
the model counter remained 40 and GPU resources started remained zero. These
checks do not establish live model quality, exhaustive video recall or renewed
spending authorization. The three unrelated local hackathon-video files were not
included in this release.

## Previous release — 2026-10-30 JST

The reviewed code from `61ab279` was deployed on the original single-process
Nebius server. The sports landing page is at `/` and the existing investigation
workspace is at `/workspace`. The deployment passed a separate Linux fixture
precheck, source and installed-package hash comparisons, and protected-data and
private-configuration fingerprints before and after installation. The browser
restored the six-turn basketball investigation and its original video and
successfully jumped to the saved 03:00 evidence. No question was submitted.

SSH was recovered by updating its administrator IP using a temporary CPU rescue
instance, which was stopped and deleted after approximately 319 seconds. Its
rough additional cost is $0.006 before tax based on observed unit rates; final
billing is pending. The original managed boot-disk specification, running VM and
both original disk identities were verified, with no temporary VM or disk left.
The previously approved $0.20 cumulative gift-credit-only recovery limit was
not increased; the rough total across all four rescues is about $0.14 before tax.
No model calls, budget changes, GPUs or top-ups were made. The 40/40 model
request limit remains exhausted, and new basic-index processors are still disabled
pending calibration and human quality acceptance.

## GitHub push and interrupted server recovery — 2026-10-29 JST

The reviewed code, including the evidence-retention and historical-follow-up
fixes, was pushed to private GitHub main as commit `61ab279`. The frozen release
passed 562 backend and 212 frontend tests, frontend build, lint, formatting and
schema checks. The three unrelated hackathon-video files remain local and were
not included. At that point the landing page and latest fixes were not yet
deployed; the subsequent deployment is recorded above.

The administrator's public IP changed, and SSH to the existing VM timed out.
A third temporary CPU rescue instance was created within the previously approved
$0.20 cumulative gift-credit-only recovery allowance. Its cleanup watchdog failed
to identify the instance after the turn was interrupted; it ran for approximately
79 minutes before being stopped and deleted. This was an operational error. The
original VM remained running, and the rescue never attached the original boot or
workspace disks. A subsequent cloud inventory showed only the original VM and its
two original disks. The final rescue invoice is not yet available. The payment
balance moved from $116.57 to $116.41 during this interval, including normal
usage of the original server; that difference is not the rescue charge alone.

The two earlier rescues were estimated at $0.043891 before tax. Applying the
usage-page CPU, RAM and disk unit rates to the third rescue's approximately
79-minute lifetime gives an additional rough $0.09 before tax; actual billing,
taxes and posting remain to be confirmed. No model requests, model-budget changes,
GPUs or top-ups were made. The new basic-index processors remain disabled pending
calibration and real-material human evaluation; the existing model allowance is
still 40/40 requests used. Continue deployment only after management connectivity
is restored and the available recovery allowance is rechecked.

## Previous release — 2026-10-29 JST

The reviewed supplement-retention/admission fixes were deployed to the existing
single-process service at framefix.net. Current-IP SSH was recovered, the original
VM/disk specification restored, and both temporary CPU rescue machines and their
boot disks deleted. Their combined conservative estimate is $0.043891 before tax
within the user's $0.20 gift-credit-only recovery authorization; the provider's
final invoice is pending. No GPU, top-up or model request was added.

All 16 investigations' history/drafts, 14 query rows, the original video, private
configuration, 40 attempts, six budget records and 25 settlements are preserved.
Cached basketball evidence and the synthetic box player were checked in-browser;
a stale box-duration label was fixed and its 00:13 position restored after refresh.
555 backend / 210 frontend regressions, build and final checks passed. New basic
index processors remain disabled pending calibration and human quality acceptance;
the $20/40 model allowance is unchanged and all 40 requests are already used.
See [release, recovery and limitations](qa/SUPPLEMENT_RETENTION_FIX_20261029.md).

## Support and billing check — 2026-10-29 JST

Ticket M297448313 has a 26 October support reply. Support says eligible
promotional credits are consumed first, then positive balance; after that, the
linked card is charged when the negative-balance threshold is reached. Budgets
provide alerts only and do not enforce a hard stop. The earlier reply declined
the requested additional $50. Exact grant expiry and an extension through
January were not confirmed. This check did not reply to or close the ticket.

The payments page showed a combined $117.71 balance, starting from $125.00 and
$7.29 consumption including tax. The original $125 comprised $100 promotional
credit and a $25 card payment. If all posted consumption drew from the grant,
the implied remaining promotional portion is $92.71, subject to account details,
posting delays and expiry. The usage page showed $7.18 before tax for about
102.7 VM-hours (205.41 vCPU-hours at 2 vCPUs), approximately $1.68 per day at
that observed rate, excluding future tax or price changes. This does not show
gift-only funding through the January announcement. No resource, budget, card
or support-ticket setting was changed during this read-only check.

Latest local code review, 2026-10-25: six admission/UI defects fixed; 239 backend
and 130 frontend regressions pass. Local single-process service restarted and
saved basketball records/draft/player restored without sending. Shared allowance
remains39/40 and2284047/20000000 USD_MICRO occupied. The subsequent authorized
production sync is recorded in the final section below. See [review record](CODE_REVIEW_20261025.md).
Earlier entries below are historical snapshots, not current spending approvals.

Updated 2026-10-24. The user authorized starting hosting now for an initial month
while support ticket M297448313 remains pending, with migration as a fallback.
The previous requirement to wait for the support reply before provisioning was
superseded. This does not approve extra model spending or GPU rental.

- VM: `frameseek-web`, `computeinstance-e04s1dcymxted7baz3`.
- Project: `project-e04mfegfbc00mjjm9jhejn`, eu-west2.
- Created: 2026-10-24 12:58:18 UTC.
- Regular cpu-d3, 2 vCPU / 8 GiB, no GPU.
- Ubuntu 24.04, 20 GiB SSD boot disk, separate 20 GiB SSD workspace disk.
- Static public IPv4: `213.239.171.82`.
- Console creation estimate: $0.09/hour, $65.70/730 hours before tax.
  This is an estimate, not a provider hard cap or final invoice.
- SSH: ubuntu, existing user-authorized local ED25519 public key. Private key
  remains on the Mac. SSH connectivity verified.
- Workspace mounted at `/srv/frameseek`, ext4 with nodev/nosuid.
- Python 3.13.12 and locked application dependencies installed. Single-process
  fixture service active and enabled, bound only to 127.0.0.1:8765. Health returned
  200 and the public synthetic demo video supported Range/206.
- Host firewall denies incoming traffic except web ports 80/443 and SSH from
  the deployment administrator's current IPv4. The API port is not exposed.
- Ubuntu's user namespace restriction remains enabled. A dedicated AppArmor
  profile permits user namespaces for `/usr/bin/bwrap`; no global sysctl bypass.
  Under the service's user, NoNewPrivileges, filesystem and resource policies,
  real FFprobe decoded a generated one-second clip. Separate sandbox checks
  confirmed host files are hidden and the network namespace has no routes.
- Linux decoder fixes: resolve bubblewrap to its absolute executable path for
  the exec wrapper, and read-only-bind loader cache/alternatives used by Ubuntu
  FFmpeg libraries. macOS real sampling regression and Ruff passed.
- Public site: https://framefix.net. Valid Let's Encrypt certificate issued for
  apex and www, expiring 2027-01-22. Renewal timer and validated Nginx reload hook
  configured. HTTP and www redirect to the canonical HTTPS apex.
- Nginx configuration validation passed. Browser verification covered synthetic
  demo answers, rendered evidence images, visible video and timestamp seeking.
  This establishes fixture behavior, not live model chat acceptance.
- DNS: retain existing `01.dnsv.jp` through `04.dnsv.jp`; replace apex A with
  `213.239.171.82`. User completed the changes on お名前.com. All four authoritative
  servers subsequently returned the new address, and www CNAME is framefix.net.
  One early certificate challenge failed during propagation; issuance succeeded
  after authoritative servers converged. No certificate validation was bypassed.

At the time of creation, grant expiry, gift priority and card protection were
unresolved; the later support reply is recorded above. Starting this VM does not establish that
gift credits cover January. No recurring follow-up has been scheduled. Review
continuation/migration within the initial month, by November 24, 2026. Stopping
the VM alone does not remove disk charges.

## Token Factory migration — October 24, 2026

The user subsequently authorized using only the previous remaining model budget
online. The service now runs in real mode with Token Factory runtime and a
root-only environment credential. Original basketball source, five-window index,
evidence frames and three prior query records were migrated to the current
browser's private owner. No re-ingestion or new model question was dispatched.

The original budget version, $1 / 30-call caps, 21 consumed calls, 19 completed
attempts, two unknown attempts and settlements were preserved. Both online scopes
retain $0.528482 occupied and $0.471518 remaining, with nine calls left. Unknown
reservations were not refunded. Both local approval scopes are revoked and the
local API process was stopped before transfer. Owner reassignment and backups
are recorded privately; no cookies, keys or private identifiers belong in docs.

The same-day calibration envelope was reused for this user-authorized remaining
test only. Online validity ends at the original source expiry (October 25,
2026, approximately 20:25 JST); no source TTL or numeric spending cap was raised.
Frozen ingest checkpoints were preserved, not rewritten as new calibration.
Six-call / $0.109 whole-query admission passed without dispatch. Nine calls
usually permit one complete new question, not nine chat turns.

Browser checks restored the named NBA investigation and played the private video
at 05:26 alongside existing evidence. `/api/session` reports Token Factory with
real readiness for that owner. A different session has no approved budget and
receives 404 for the private source. Cumulative dispatch count remains 21.

**External availability limitation:** free GET checks of the official model
catalog returned HTTP503 from both Mac and VM. VM GET method checks of chat and
embedding paths also returned 503. Configuration readiness is not evidence of
successful online inference; no paid POST was sent to test the current outage.
The remaining approved allowance stays scoped to the user's current browser.
Do not automatically retry unknown paid attempts or increase limits.

## Upstream recovery and live vision check

Later on October 24, the user requested diagnosis and verification using only
the existing remainder. The documented API address matched the fixed configured
origin. Cloud/local credential fingerprints matched. Free authenticated model
catalog checks first recovered locally, then on the VM; repeated VM checks with
the original headers returned 200 with upstream request IDs. DNS, key, API host
and application code did not change. The earlier 503 HTML originated at the
upstream gateway, without application request IDs. These observations support a
transient upstream issue, but do not establish Nebius's internal incident cause.
Do not infer authentication success from catalog availability alone.

Exactly one successful cloud vision request then went through `Provider.call`
and the original ledger. It sent the saved JPEG at absolute source time 326.1s
to the same Nemotron model and fixed API host. The response matched frame ID and
timestamp, reporting GS 106 / TOR 105, fourth quarter 16.3s; elapsed time was
3.28 seconds. This validates online vision transport, not a new full chat turn
or exhaustive basketball analysis. No full new chat was submitted on the user's
behalf, leaving its call allowance for personal testing.

Returned usage was 1,054 input and 1,055 completion tokens (871 reasoning tokens
included). At the previously recorded uncached rates, estimated incremental cost
is $0.0012657, not a finalized provider invoice. Its completed reservation was
settled to 2,532 micro-USD (2x margin, rounded up). Both scope counters are now
22/30 calls and $0.531014 occupied, leaving **8 calls and $0.468986**. Both old
unknown reservations remain retained, local scopes remain revoked, and the
original dollar/call caps and source expiry remain unchanged. Read-only admission
for a six-call/$0.109 whole query passed. No automatic inference retry was added.
Private proof is `/srv/frameseek/workspace/tokenfactory-recovery-verification.json`.

## Full browser chat test — did not pass

The user next authorized one complete browser chat round using the remainder,
with no cap increase. A new independent question asked for the ball handler's
jersey color, position and nearby defense at source time 05:20–05:40, with
timestamped evidence and no inferred player identities. It was submitted once
through framefix.net; no retry or resume action was taken.

Request `9650ecb8dfc44947916f269e0e308328` completed embedding, reranking and
planning (`inspect:[0]`). Its visual-review attempt `zoom0` became unknown;
there is no cached successful response or verified partial-result file. The
query is unknown with no result. The page preserved the question and displayed
the no-automatic-repeat warning. A new answer, evidence match and new-answer
timestamp jump therefore **were not accepted**. This is a failure of the complete
round despite the preceding successful single-image diagnostic. The retained
records do not establish whether this particular vision failure was an HTTP503,
timeout, invalid response or truncation; do not invent a more specific cause.

The existing accepted evidence was separately tested: the player was moved to
00:03 and the prior 05:26 evidence clicked. After seeking finished, the actual
video showed GS106/TOR105, fourth quarter16.3s, matching that old citation.
This proves existing playback/seek behavior only, not a new answer for this test.

The round used four model calls: three completed and one unknown. Completed
usage was conservatively settled with the existing 2x uncached-rate margin to
7,933 micro-USD; the unknown vision reservation retains its full 60,000 units.
Total counters are **26/30 calls, $0.598947 occupied, $0.401053 remaining** in
both scopes. Unknown reservations and all call counts were retained. Read-only
whole-query admission with only four calls left was denied; no new dispatch
occurred. No allowance was added and no further paid testing was attempted.

Private accounting evidence: `/srv/frameseek/workspace/full-chat-test-audit.json`.
Local browser proof: `.frameseek/nebius-support/full-chat-unknown.png` and
`full-chat-existing-evidence-seek.png`. These files are not public repository assets.

## Offline investigation and diagnostic repair

The user prohibited further model calls and budget increases during investigation.
Both online scopes were revoked; their original counters, caps, settlements and
unknown reservations remain unchanged (26 calls, $0.598947 occupied). No live
model connectivity or inference request was used during this repair.

The historical vision response cannot be recovered: the query has no result,
the vision attempt is unknown without a response cache, and no verified partial
file exists. Service/proxy logs provide no corresponding upstream response;
there was no service restart. The concrete, reproducible code defect is loss of
diagnosis: HTTP errors, timeouts, response decoding and adapter rejection were
collapsed to `model_unknown` without retaining their causes. This does not prove
which of those caused the historical call to fail.

Provider now saves bounded, body-free metadata to private per-attempt diagnostic
files and structured service logs, including response status, safe request ID,
finish reason, usage and failure stage. Public answer/query schemas, output caps,
retry policy and budget behavior are unchanged. Offline mock regression covers
503, timeout, truncated output, invalid JSON, output-size limits, privacy and
diagnostic-write failure, plus full query/8-image visual failure and no replay.
Tests failed before the diagnostic repair and passed after it. Full backend:
200 passed; Ruff, formatting and contract exports passed. This fixes the
observability defect; live stability and the lost historical cause remain
unverified. Paid dispatch remains paused pending explicit further instructions.


## Failed-turn follow-up recovery (2026-10-24)

A real turn with no verified events was still offered as a follow-up anchor. The
server correctly rejected it with `context_has_no_verified_anchor`; the composer
showed that internal error instead of explaining recovery. Such cards remain
selectable, but now use “重新提问” and submit no parent anchor. The retry action
copies the original question only into an empty draft and never dispatches a
request by itself. Verified partial results remain eligible for follow-up.
Real-error cards no longer suggest unrelated synthetic parcel questions.
The server anchor guard and all budget limits remain unchanged. Offline frontend
regressions cover context selection, draft preservation and explicit retry.

Deployed the frontend recovery fix and verified on framefix.net: selecting question
4 and pressing “重新提问” preserves the user's “继续问题4” draft, focuses the
composer and explains that the submission is a new question. No Send/Resume
button was pressed. All 88 frontend tests, frontend build and `make check` passed.
The readonly production ledger still shows both scopes inactive, 26/30 consumed
calls and USD 0.598947 occupied; no additional model call or approval was made.

## Explicit-time query cost optimization (2026-10-24)

The user authorized one new basketball chat test using only the original remaining
USD 0.401053 / four model requests. No new cap or GPU resource is authorized.
Token Factory questions containing one unambiguous MM:SS range of at most 60
seconds now bypass embedding, generative reranking and planning. They decode that
exact bounded window, validate visual observations and frame references, then
synthesize the answer. Normal dispatch uses two calls; admission conservatively
requires three, including the existing shared single JSON repair. With the current
runtime bounds this is at most USD 0.084 reserved, within the unchanged ledger.
No new trace channel is added to schema 0.1: direct-window results have no retrieval
channels and explicitly disclose limited sampled coverage. Other queries keep the
retrieval path. Invalid/reversed or out-of-source explicit ranges fail before calls;
ambiguous/long ranges use the original bounded search path. Unknown attempts still
remain charged and cannot be replayed. Budget rejection now has a distinct
`budget_blocked` error and Chinese explanation, rather than an unexplained 502.
Offline regressions reproduce the original four-call admission failure, verify
real decoded timestamps/media ownership, two-call success, three-call syntax
repair, unknown no replay and rejection of invented frame IDs.


The first optimized live attempt (`1ee4416035264885b89b1b1d03f11b0f`) used only
one vision call before stopping. Its diagnostic proves HTTP200,
`finish_reason=length`, prompt_tokens=8209, completion_tokens=4096 and
`tokenfactory_incomplete_response` at normalization after 11.202 seconds. This
is output truncation, not a 503 or absence of visible evidence. The original
attempt stays unknown/reserved and is never replayed/refunded. Both budget scopes
were paused at 27 calls / USD0.658947 occupied, leaving three calls / USD0.341053.

The official Token Factory OpenAPI `ChatCompletionRequest` explicitly supports
`reasoning_effort=none`; its completion cap includes both visible and reasoning
tokens: https://api.tokenfactory.nebius.com/openapi.json. NVIDIA documents this
model's configurable reasoning and the risk of output truncation with small
budgets: https://docs.nvidia.com/nim/large-language-models/latest/get-started/advanced/get-started-nemotron-3.5-super-vl.html.
Query chat requests now select non-reasoning output while keeping the 4096-token
cap, default service tier, model, media limits and existing financial caps.
Ingest stays unchanged. This changes the request payload; it does not retry an
existing unknown attempt. Truncated output remains rejected.

After 214 backend tests, 88 frontend tests, Ruff/format/schema checks passed, the
non-reasoning query adapter was deployed. A new request with the changed wire
payload (`c1b7d7a1aea04574a875023e299c18e8`) completed successfully: vision HTTP200 /
finish=stop in 4.757s (8217 prompt / 1609 completion tokens), synthesis HTTP200 /
finish=stop in 0.427s (1887 prompt / 78 completion tokens). Exactly two calls, no
repair. The response is `partial`, three events, eight unique decoded frames at
320.0, 322.5, 325.0, 327.5, 330.0, 332.5, 335.0 and 337.5 source seconds. The browser
shows the blue jersey / right perimeter / nearby white defender answer and sparse
coverage warnings. Clicking its 05:20 evidence jumps the original paused source
to 05:20; the visible court frame supports that sampled description. This is one
successful sampled round, not a full motion or whole-video quality evaluation.

Total new dispatches this optimization session: three (one truncated + two
successful), within the original four-call remainder. Both budget scopes were
revoked after completion: 29/30 used calls, USD0.730947 occupied, leaving one call /
USD0.269053. The USD0.132 increase is conservative ledger reservation, not a claim
about actual provider billing. No cap was raised; no unknown cost was refunded.
The remaining single call cannot admit another complete three-call-bounded query.
Private body-free audit: `/srv/frameseek/workspace/optimized-window-test-audit.json`.
Browser proof: ignored `.frameseek/nebius-support/optimized-window-success.png`.

## Reconciliation after 29 attempts (2026-10-24)

The user requested actual-charge verification and personal continuation without
additional budget. No model was called during reconciliation. Refreshed official
Transactions now shows USD0.07 Consumption and USD0.07 Trial offset; trial balance
USD0.93 (two days left), account balance USD125.00 unchanged. The Usage table still
states last updated 13:07 UTC and reports input USD0.022323, output USD0.0266193,
embedding USD0.00002456 = USD0.04896686 for that earlier snapshot. It therefore
must not be represented as complete usage for the later calls or a final invoice.
Known recorded response usage through the optimization test is estimated at
USD0.06489683 using uncached published prices; unknown calls with no usage remain
unpriced and reserved. Official Prices confirms Nemotron USD0.30/M input,
USD0.90/M output (cached USD0.06/M is not used for conservative reconciliation).

The last successful two-call round has observed usage worth USD0.0045495 at those
rates. Trusted completed-only settlement retains twice that amount, rounded up
per attempt (USD0.009100), replacing its USD0.072000 initial reservation. This
releases USD0.062900 within the same budget: occupied USD0.668047, remaining
USD0.331953. Both scope counters remain 29/30 and inactive. All four unknown
attempts retain USD0.560000 in full; none is refunded or replayed. The private
evidence is `/srv/frameseek/workspace/reconciliation-29-completed-evidence.json`.
No approval cap or version changed; no personal-test dispatch was enabled.

The one remaining authorized model call cannot admit the current complete query
(two ordinary calls plus one repair admission slot). Available money does not
restore consumed requests. Continuing several personal chats would require an
explicit revised call ceiling while keeping the total USD1 envelope, all consumed
counters and unknown reservations; this has not been applied or inferred from a
reconciliation request.

The user then explicitly approved: “同意，总共最多 40 次，美元上限仍为 $1”.
A trusted operator amendment changed only `call_cap` 30→40 for the deployment
and the current online owner, then resumed both scopes through `resume_existing`.
The original version/index/checkpoints, USD1 cap, used calls=29, occupied money
USD0.668047, primary caps/counters and all attempt/settlement records were kept.
Pre/post transaction assertions verified all other budget fields unchanged and
attempt row count still 29. The amendment and authorization are recorded privately
in `approval-amendment-total40-usd1-unchanged.json` and append-only resumption
references. No HTTP approval endpoint, source-code change, index rebuild, new
budget pool, service restart or model request was introduced. Personal testing
now has 11 model calls and USD0.331953 of conservative envelope remaining. The
money bound can stop admission before all 11 calls are used. Short explicit-time
questions normally use two calls and reserve capacity for one possible repair;
roughly three to four more such rounds fit without further settlement, fewer if
repairs or upstream failures consume reservations. Do not promise a fixed count.

## USD5 approval and desktop controls (2026-10-25)

The user explicitly set the total monetary cap to USD5 while retaining the
40-request cap. A fresh approved version `tf_basketball_usd5_40_20261025` carries
forward the full prior used counters (29 requests, USD0.668047 occupied), primary
counts and all unknown reservations. Both previous scope records are sealed
inactive; the two new scopes are active with the carried consumption, leaving
11 requests / USD4.331953, rather than a fresh five-dollar pool. Existing attempt
and settlement rows are unchanged. The ready source's query-budget binding and
trusted runtime were moved to the new version; its manifest retains the original
ingest budget provenance. The original frozen ingestion configuration, actual
source, decoded frames, index and generation were not regenerated. New manifest
binding is not a claim that ingestion occurred under the new approval.
Private SQLite backups and authorization/migration audit are under
`/srv/frameseek/workspace/approval-usd5-carry-history/`. No model dispatch occurred.

Desktop question cards now expose recoverable deletion; removed records stay in
the bounded snapshot with a tombstone, are filtered from canvas/outline/reports,
and are not resurrected by completed-request recovery. Saved findings keep their
source. Both sidebars have pointer/keyboard resizing and saved per-investigation
widths. Frontend regression coverage includes deletion/restore, draft/child/pin
preservation, history recovery, report provenance and bounded widths. Generated
frontend assets and content hashes were rebuilt; Ruff/schema checks passed.

Final verification: 93 frontend tests, build and Ruff/schema checks passed. On
framefix.net, question4 was deleted, restored at its old position, then deleted
again as the user marked it unwanted. Browser refresh retained the task4
tombstone and saved widths (494/437px); pointer drag and focused arrow-key resize
both worked (final478/453px). The page was left on the successful question7 with
“已删除的问题” expanded and “恢复问题4” visible. Private source playback remains at
320s. Readonly SQLite verification confirmed old approval inactive, new USD5
approval active, 29/40 consumed calls, unchanged USD0.668047 occupied and exactly
29 actual attempt rows. No model request was sent during these changes. Proof:
ignored `.frameseek/nebius-support/cards-resizable-panels-usd5.png`.


## Autonomous night QA — October 25 JST

User authorized routine tests and fixes while asleep, retaining cumulative USD5
and 40 model requests. Three new bounded chat turns succeeded (including a real
contextual follow-up), using six calls total. The audio question correctly made
zero model calls. Current occupancy is USD0.884047 and 35/40 requests; this is a
conservative ledger value, not invoiced usage. New response-token usage estimates
USD0.0116496 before provider invoice reconciliation. No unknown reservation was
released, no index rebuilt, and no validity period extended.

Recovery-button cleanup, width restoration on smaller desktops and clearer audio
errors have regression coverage. See [night QA](qa/NIGHT_TEST_20261025.md) for
remaining paused-video repaint and model numeric-wording concerns. These checks
do not establish complete live model quality. A bounded hourly thread follow-up
(maximum six scheduled runs) was authorized and created for unfinished QA; it is
separate from any hosting-cost or support-ticket monitor.


### Overnight pass closed — October 25, 06:20 JST

The six bounded hourly follow-ups finished and the night automation was removed.
The production service remains active. Final audit:35/40 requests andUSD0.884047
occupied in each active ledger scope,31 completed and4 retained historical unknown
attempts; no in-flight query. No new model dispatch occurred in the hourly passes.
Five focused UI/feedback fixes are deployed, including verified asynchronous seek
loading/completion feedback. Latest checks are102 frontend tests and215 backend
tests, with build/Ruff/schema checks passing. Model temporal-number consistency
remains an acceptance limitation; see the night report. The existing source/runtime
validity still endsOctober25,20:25:50 JST, and has not been extended. The temporary
local fixture service was stopped; production hosting and budget caps were unchanged.

## Explicit January renewal — October25,2026

The user asked to cover the January announcement and explicitly specified a
cumulative model cap ofUSD20 /40 requests, with no top-up. The previous deployed
cap wasUSD5, so a fresh approval version `tf_basketball_usd20_40_20261025` carries
all35 prior calls, USD0.884047 occupied, unchanged primary counters, attempts,
settlements and all four unknown reservations. Both old scope records are sealed
inactive. This isUSD20 total, notUSD5+20, and not a new40-call allowance.

The current owner's basketball source, active investigations and server session
are explicitly retained until **2027-01-13 00:00 JST**, covering the announced
January11 12:00PT time (January12 05:00JST). New investigations for that source
inherit the same cutoff; ordinary new uploads remain on default TTL. Deleted or
expired data cannot be revived and other owners are not extended. Session cookie
refresh now uses the authenticated server cutoff so an old24-hour browser cookie
does not lose access to the retained source.

Trusted runtime validity uses the same cutoff, with a new dated authorization /
conservative cost-envelope record. Original same-day calibration, frozen ingest
config, generation, source file, index and frames are preserved. No new empirical
calibration or January model-quality claim was fabricated. The official model
catalog GET returned the configured aliases, and the official model detail UI
showed current uncached inputUSD0.30/M and outputUSD0.90/M. Chat-role reservations
now conservatively cover the full1,048,576-token context plus4,096 output tokens
at those rates:USD0.3182592 bounded byUSD0.35 per attempt. This reservation change
is not a provider charge; no new paid call occurred. Alias revisions/future prices
remain external limitations; this renewal does not extend provider credits or
provide a provider/card-level spending guarantee.

Private backups, counter fingerprints and authorization audit are under the
existing server workspace's `renewal-january-20261025/`. No credentials or private
owner IDs are committed. The current account UI separately displayed aUSD0.93
trial with2 days left andUSD125 account balance; that is not proof theUSD125 grant
or hosting credits last untilJanuary. The existing hosting/support-ticket funding
uncertainty remains separate from the local retention/model cutoff.

Validation:226 backend tests,102 frontend tests, Ruff/format/schema checks passed.
The existing single service was stopped only after confirming no query was running,
then updated. No new model request, GPU, cloud resource, account top-up, commit or
push was performed.

Post-deploy verification: both active scopes are40 total calls /USD20, retaining
35 calls andUSD0.884047; attempt and settlement table fingerprints exactly match
the private pre-migration backup. The one basketball source and two associated
investigations use the January cutoff; an unrelated demo retains its original
24-hour expiry. Current owner session and runtime both use the January cutoff.
The trusted service environment reports no runtime blockers, and a three-call
specified-window admission passes read-only without dispatch or reservation.
Browser refresh restored the existing private basketball investigation, source
playback and all model/budget readiness checks. The cookie refresh path was covered
by the backend regression; no cookie or key was inspected or exposed in browser
automation. Ignored proof: `.frameseek/retention-renewal-20261025/online-readiness-renewed.png`.


## Navigation static update — 2026-10-25 JST

User authorized syncing the local navigation to production while preserving media
and chat. Updated only app.js, index.html, workbench.css, workbench.js and its
license in both the source tree and the installed Python package's static folder.
The service serves the installed package, so source-only changes are insufficient.
No service restart, runtime change, model call or data migration was performed.
Before/after read-only hashes matched for videos (1), investigations (5), queries
(13), budgets (6), attempts (35), settlements (25), and private configuration.
Private backups: /srv/frameseek/navigation-20261025/. Public HTML now contains
切换调查 and 更多操作. CI/CD remains disabled; the private repo defaults to main,
with no Actions workflow, while current local work is on dev and uncommitted.
The user explicitly deferred CI/CD.


## Video picker and delete confirmation — 2026-10-25 JST

User authorized deploying the tested local thumbnail picker and recoverable-delete
confirmation, without model calls or loss of basketball/history. Deployed exactly
7 static assets (app.js, workspace.js, investigation-canvas.js, workbench.css,
workbench.js, its license and index.html) to source and installed package. All
serving-package hashes match the local build (113 frontend regressions passed).
No restart, backend change, ownership migration, approval or runtime update.

Before/after deployment, every recorded hash matched for videos (1), investigations
(5), queries (13), budgets (6), attempts (35), settlements (25), and private config.
Backups and rollback archives: /srv/frameseek/picker-confirm-20261025/. Browser
checks restored the existing basketball QA investigation, opened deletion with
Cancel focused, and cancelled without deleting a question. The picker restored
the existing box investigation and its saved fixture answer; no ingest or model
question was submitted. Private evidence: .frameseek/picker-confirm-deploy-20261025/.
CI/CD remains deferred.


## Compact header and composer suggestions — 2026-10-25 JST

Explicitly authorized frontend-only release of the tested local header and
fill-only suggestions. Published 8 static files including workbench-model.js to
source and installed package; serving hashes match the local 117-test build.
Rollback archives: /srv/frameseek/header-suggestions-20261025/. No service restart,
backend/model/runtime update, data migration, approval installation, or CI/CD.

Before/after deployment all audited table/config hashes matched. Browser checks:
suggestion clicked -> text filled, other chips disabled, five basketball QA cards
unchanged -> draft saved and restored after refresh -> test draft cleared back to
its original empty value -> box restored one existing fixture turn and separate
demo followups -> basketball restored its five prior turns. No form submission.
Final audit matched chat records (including hidden flags), pins, notes, video/query
rows, budget/attempt/settlement tables and private config. Attempts remain 35;
no model request, calibration or indexing was performed. Private before/after
audits and screenshot: .frameseek/header-suggestions-deploy-20261025/.


## Evidence-specific suggestions and review export — 2026-10-25 JST

Under the user's autonomous repair authorization, shipped deterministic,
evidence-grounded recommendations and numerical-text review cautions after 124
frontend regressions, build, Ruff and contract checks. Cached followups stay first;
otherwise verified saved-frame timestamps and answer/caption topics provide
scoreboard/clock/jersey or box-position questions. The UI exposes its existing
frame basis and distinguishes rule-based questions from model-written followups.
Hidden/failed/foreign records and invalid/external frames cannot supply a basis.
No filename classification, model dispatch or index refresh was used.

The known QA wording '14 decreases to23' now gets a text-only caution beside the
original answer and an existing-evidence replay action. The original query, final
status and evidence are unchanged. Portable JSON/Markdown/HTML reports retain the
caution; this is not a claim of live visual revalidation or general model accuracy.

Browser verification: current selected basketball questions offer topic-specific
bounded time windows, basis replay seeks180 seconds without adding a query, box
restores its own two fixture followups with00:06 basis and one existing turn, and
basketball retains all five QA turns. The app exported a private offline HTML
backup containing23 inline JPEGs, error/partial states, source timestamps and
text-review notes. The saved copy has no scripts and is ignored by Git:
.frameseek/evidence-recommendations-20261025/basketball-evidence-backup.html.

Rollback archives: /srv/frameseek/evidence-recommendations-20261025/ and
/srv/frameseek/evidence-report-20261025/. Nine serving assets match the final
local manifest. No service restart, cloud resource, approval, runtime, retention,
repository publication or CI/CD action. Full chat-content and ledger fingerprints
remain unchanged, including35 prior model requests and every unknown reservation.
Private validation evidence is under .frameseek/evidence-report-deploy-20261025/.


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


## Local shared-ledger E2E update — 2026-10-25

Current cumulative ledger is39/40 requests,2284047/20000000 USD_MICRO occupied.
The user first spent2 calls on a local short-window scoreboard question, then
explicitly authorized the agent to perform one real browser E2E. The latter spent
exactly2 calls on local task9,05:25–05:28, completed partial with3 reference frames,
seek and refresh recovery verified. No repair/retry or cap increase. Unknown
reservations unchanged. One remaining call is insufficient for another ordinary
chat; stop live testing. See latest NIGHT_TEST_20261025.md entry and private
.frameseek/live-e2e-20261025/ for the exact query and audit.

Game-clock readings matched all3 inspected frames, but extra unrequested
shot-clock numbers were wrong. Answer quality is still not accepted as generally
reliable. Local preparation now explains per-query required/remaining calls and
clarifies content-free followups before creating failed cards. These latest
admission/backend/UI fixes run locally only; production package was not changed.


## Local single-call usability optimization

Latest pass preserves39/40 attempts and2284047/20000000 USD_MICRO occupancy;
zero additional paid calls. Local short windows now use one vision call with
validated observations as the answer and no text rewrite/repair/retry. Budget is
visible in the composer. Context/unsupported-statistics/clarification and bounded
no-match handling improved.235 backend /127 frontend regressions pass. New route
has not been paid-live revalidated; the final1 call is left for the user.
These changes run locally only; the production workspace package was untouched.
See the latest NIGHT_TEST_20261025.md entry for scope, evidence and limitations.

## Reviewed fixes deployed — 2026-10-25

User authorized syncing the reviewed fixes to framefix.net while preserving
basketball and box conversations, with no model calls or budget increase.
Deployed the reviewed package to both source and installed Python package under
the existing single-process service. Locked dependency files matched the host;
no dependency install, new VM, GPU or resource provisioning was needed.
Rollback code, environment and SQLite backups remain private under
`/srv/frameseek/review-release-20261025/backup`.

Added trusted `FS_DIRECT_OBSERVATIONS=1` support for the existing Token Factory
ledger so production uses the same one-vision-call short-window route as local.
It disables repair/text rewrite without replacing the ledger or changing any
approval, cap, amount, identity or unknown reservation. Other providers reject
this flag. Default behavior without it is unchanged. This deployment changes only
that flag in workspace.env; runtime.json and secrets.env stay byte-identical.
240 backend tests, focused admission/single-call regressions and make check pass;
the previously built frontend passed130 tests and was not edited again.

Browser verification on the existing private session restored five basketball
turns and one box turn. Suggested questions filled only and the temporary test
draft was cleared to its original empty value. Basketball basis sought180 seconds;
box reference sought10 seconds, paused with decoded frames. Box reload restored
one turn and10 seconds; switching back restored basketball's five turns. No Send,
analysis, retry or model operation was used. Original historical answers remain
unchanged, including their recorded quality limitations.

Before/after fingerprints match for chat content across all seven investigations,
13 query rows, source video,39 model attempts, budgets and25 settlements. Ordinary
UI selection/playback/revision metadata changed during browser checks. Total
allowance remains $20 /40 requests,39 used and2284047 USD_MICRO occupied. One
request remains for the user; no new paid inference acceptance is claimed.
All deployed package hashes matched the release. Private audits/screenshots:
`.frameseek/deploy-reviewed-20261025/`.

## Ctrl+F search increment — 2026-10-25

Core direction is conversational video search, not a basketball-specific engine.
Deployed validated frame-level index retrieval, free owned candidate browsing,
and optional one-call same-subject visual verification for broad questions.
`FS_VISUAL_SEARCH=1` is enabled in both existing local and online trusted runtime
environments; it does not modify the original ledger, provider/model identity or
numeric approvals. No index rebuild or extra extraction was performed.

263 backend /136 frontend tests, build, Ruff/format/schema and diff checks pass.
Isolated labelled mock browser QA exercised chat and followups; actual local and
online basketball pages exercised free candidate retrieval only. Both searched40
saved frames, displayed8 loaded images and sought original timestamps. Online
source round-trip restored five basketball turns and one box turn; local retained
seven visible basketball turns and the original question draft. Immediate-refresh
and in-flight-save draft recovery received regressions and native code review.

Before/after online fingerprints match for chat content,13 queries, original
video,39 attempts, all budgets,25 settlements, runtime.json and secrets.env.
The environment gained only the trusted search policy flag; no budget version,
cap, balance, unknown reservation or credential changed. Cumulative allowance
remains $20 /40 requests with39 used and2284047 USD_MICRO occupied. Local video
and query fingerprints and both ledger-scope snapshots also remain unchanged.

Rollback source/package/env/SQLite backups are private at
`/srv/frameseek/ctrlf-core-release-20261025/backup`; final frontend patches have
their own static backups in the same release directory. Serving asset hashes
were checked against the local build. No resource provisioning or model call.

This is an integration/search increment, not acceptance of exhaustive recall,
object identity continuity or arbitrary-question correctness. The underlying
index remains sparse, and no new paid recognition was run. See
[engine scope](VIDEO_CTRL_F_ENGINE.md) and [QA evidence](qa/CTRL_F_20261025.md).


## Final authorized live appearance search — 2026-10-25

One real online question, “找出穿白色球衣的人，列出出现时间”, completed via
Token Factory with eight verified sampled frames. All eight original images
visibly contain white basketball jerseys, all eight reference buttons sought
the exact original timestamps, and refresh preserved the new question6 and
previous visible chats. This establishes this positive case only, not exhaustive
appearance recall or arbitrary-question accuracy. See
[the live QA record](qa/CTRL_F_20261025.md#authorized-final-live-request--2026-10-25).

Cumulative request use is now40/40. No retries or additional model stages were
sent, no budget cap was raised, and the $20 total cap remains. Further paid
requests are blocked; saved answers, evidence playback and free cached candidate
browsing remain available. Private media/configuration fingerprints are unchanged.

## Local zero-model index page integration — 2026-10-25

Localhost now connects the observation index to owned occurrence search, durable
index chat and the interactive paginated timeline. It was not deployed to Nebius.
Browser integration passed on explicitly annotated synthetic sources with no
provider configured. Actual local basketball adds one zero-model index answer;
its bilingual description search returns19 candidates and explicitly reports
missing full-source object observations. All3 local sources and9 prior query rows
retain their fingerprints. Production attempts/budgets/settlements/queries,
source and private configuration hashes match the40/40 snapshot unchanged.
See [page acceptance](qa/FULL_VIDEO_INDEX_OFFLINE_20261025.md).

## Local event reasoning and player recovery — 2026-10-25

Local event counts now consume explicit action observations and data-driven
same-track state transitions. Adjacent frames merge into events; explicit
canonical replay associations deduplicate counts while preserving all original
clips. Counts, entity grouping, evidence and recovery passed isolated synthetic
browser checks with zero provider configuration.307 backend/140 frontend tests,
build, lint/format/schema and diff checks pass.

The compact current-video recovery button now aligns with the canvas toolbar;
the canvas rail also opens the source panel. Basketball and box histories and
all original drafts remain preserved. A QA cookie-host collision was recovered
without moving ownership, extending validity or changing the ledger; the
isolated harness now uses a distinct cookie name and localhost. See
[event QA and remaining recognition gaps](qa/EVENT_ENGINE_OFFLINE_20261025.md).

This is NOT acceptance of automatic raw-video event recognition or basketball
three-point totals. Actual basketball still lacks full event observations, and
no new model calls, budget changes or online deployment were made. The existing
$20/40 cap and40/40 request use remain unchanged.

## Free local visual runtime and replica recovery — 2026-10-25

The local Mac now has an opt-in, independently installed MLX visual compiler.
It decodes real source frames, caches source/generation-specific scene packets
and uses owned asynchronous local-chat routes. It has no Token Factory fallback
or paid-budget mutation. See [runtime](LOCAL_VISION.md) and
[actual QA / failures / remaining acceptance](qa/LOCAL_VISION_20261025.md).
This capability has not been deployed to the Nebius Linux CPU service.

During actual local testing the replica crossed its stale October25 retention
cutoff; cleanup removed it and its new visual cache. The online January grant and
retained source were intact. The API was stopped, the authoritative source/hash/
owner mapping and pre-existing grant were verified, and the original local source,
index and10 original query rows were restored from retained media/private backup.
The query fingerprint matches the pre-test baseline. The local source, linked desk
and existing session now use the already-authorized January13 00:00JST cutoff.
This does not create a public expired-data revival path or weaken cleanup checks.
No original paid ingest was recharged/rebuilt. Paid attempt, budget and settlement
fingerprints remain unchanged. Actual local page acceptance subsequently passed
white-jersey search (49 groups/377 citations), same-person blue-jersey/yellow-
headband search (05:08–05:10), negative scoped presence search, original score
citation playback, refresh/video navigation and draft/history preservation.
A12-record desk cap was repaired with owned compact query references (100-record
capacity,no silent eviction); original history was recovered from durable rows
and private backup.319 backend/143 frontend tests and build/checks passed.
These are local Mac results, not a new framefix.net deployment. Exact action
counts/ranking and exhaustive original-frame recall remain unaccepted. See the
linked QA report for evidence, incidents and limitations.


## Cloud sampled compiler deployment — 2026-10-25

The existing CPU service now exposes optional Token Factory cloud-chat prepare
and async execution, sharing the sampled compiler with the Mac implementation.
The cloud engine option is present on framefix.net. Existing private source,
queries and financial ledgers were preserved; no new model calls, approvals,
resources or GPU rentals occurred.325 backend/143 frontend tests and build/checks
pass. Actual page submission correctly stops before dispatch on exhausted budget.

This is deployed integration and admission acceptance, not real cloud model
quality acceptance. Current full-source path requires49 new scene calls and a
conservative106-call/$37.10 total envelope. Existing approval remains$20/40,
40 used; the $2.634047 occupied amount is not a new actual invoice. No cap was
changed. See [cloud QA and remaining blocker](qa/CLOUD_VISION_20261025.md).

## Conversation reading interface deployed — 2026-10-28

The user-authorized static-only release is live at framefix.net: chronological
question/answer/evidence reading view, retained canvas switch, and canvas composer
click/focus or card follow-up entering conversation with context/draft retained.
All eight frontend release files were backed up and replaced in both source and
installed static directories. The existing single-process service remained active;
no backend, runtime secrets, data or spending approvals were installed or replaced.
Rollback archives remain privately on the same server.

Deployment-time fingerprints were identical for videos, queries, investigations,
model attempts, budgets, settlements and all three private configuration files.
Browser acceptance then restored the existing six-turn basketball QA desk, switched
to its genuine empty box desk and back, retained the original empty drafts, verified
canvas-input focus entering conversation and sought a real citation to exactly60s.
Normal layout/context/player autosaves changed investigation rows during acceptance;
query/media/financial/configuration fingerprints remained unchanged. No question was
submitted and no model request was made.151 frontend regressions and build passed;
served asset bytes match the local release. This is UI deployment acceptance, not
new model quality or exhaustive event-count acceptance. Private verification evidence:
`.frameseek/reading-deploy-20261028/`.
