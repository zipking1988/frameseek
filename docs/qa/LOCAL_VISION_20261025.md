# Actual on-device recognition — 2026-10-25

## Authorization and runtime

After clarification, the user asked to proceed with free local recognition and
prioritize usable answers. No paid budget was reset or increased. The existing
Token Factory $20/40-call allowance, attempts and settlements remain unchanged.
No GPU was rented, remote model API called, or production deployment performed.

A separate private Python3.13 runtime uses mlx-vlm0.7.10 and locally downloaded
public weights. NVIDIA Cosmos-Reason1-7B4bit was tested on actual basketball frames;
its team/clothing attributions were inaccurate and its observations were not
accepted as product evidence. The active local compiler uses
Qwen3-VL-4B-Instruct4bit, pinned revision documented in `../LOCAL_VISION.md`.
This preserves the separate NVIDIA/Nebius provider.

## Reproduced failures and repairs

- First actual page scan stopped at segment5 because unconstrained generation
  returned malformed JSON. Its raw receipt is preserved privately; four completed
  packets were reused rather than regenerated. Added constrained JSON generation,
  frame-index enums and bounded output shapes. A transport regression caught and
  fixed the initially omitted schema field in the stdin RPC request.
- A real49-segment final-schema protocol test exposed unsupported `oneOf` in
  llguidance. Switched to disjoint `anyOf` alternatives (unique segment consts),
  preserving segment-specific frame enums. The actual local model then returned
  valid constrained output. This protocol test is not a recognition-quality test.
- Local answer receipts/checkpoints prevent silently redispatching an interrupted
  unknown synthesis. Ownership, generation, cancellation, idempotence, no-paid-
  fallback and known-failure durability have focused regression coverage.

## Actual source page test

Source: the user's private basketball video, generation2, original duration about
6m24s. Used the existing original local investigation, not a synthetic substitute.
The submitted question asks for people wearing white jerseys with original-time
image citations and no guessed identities. The scan covers49 consecutive windows,
up to8 real decoded frames per window. The original user draft
`整个比赛 多少个3分球投入？` and05:26 player position were checked during processing.

Actual post-recovery page acceptance passed for appearance search:

- White jerseys:49 groups,377 original-frame citations from385 sampled frames
  across49 windows. Page clicks00:49 and04:48 seek to49 and288 seconds.
- Same-subject compound condition, blue jersey AND yellow headband, scoped05:04–
  05:12:one group with citations308,309,310 seconds. Actual05:09 playback visibly
  shows both attributes on the same person. No identity was requested or inferred.
- Forklift negative control scoped05:04–05:12: no_result,zero citations; explicitly
  limited to inspected samples rather than asserting absolute original absence.
- Refresh and basketball→box→basketball retain20 visible basketball cards, the
  original first answer, original recoverable deletions and the exact draft
  `整个比赛 多少个3分球投入？`. This owner's box baseline remains zero records;
  another owner's demo investigation is not merged.
- Original stored score citation05:26 still seeks to326.1 seconds.

Final UI regressions exposed a successful seek leaving the player above the
source pane's scroll position, and huge canvas cards rendering every result.
Explicit player reveal/seek now resets that pane to its top without taking focus
or clearing drafts. Local/index canvas cards preview one group; the inspector,
structured answer and durable response retain every reference. Actual page test
confirms377 inspector references,one canvas preview and visible player at49s.

Private screenshots: `.frameseek/local-vision/white-jersey-page.png` and
`blue-yellow-compound.png`. These are actual source-page captures, not mocks.

## Preservation and limitations

Private local before/after fingerprints show unchanged attempts(21 rows),
budgets(2),settlements(19). The remote shared ledger matches the existing40-call
baseline in `.frameseek/ctrlf-live-final-20261025/after.json` for all three tables;
the older35-call migration snapshot is not the baseline for this task. No new
paid calls were dispatched, and the $20/40 cap was not changed.
Artifacts and runtime remain ignored private local files.

This sampled compiler cannot establish exhaustive appearances between sampled
frames, perfect actor continuity or exact three-point totals merely by existing.
Small text, clothing numbers and relationships can be misread. Its output must
retain uncertainty and cite original images; factual inspection remains required.

## Retention incident during the real page test

The local replica still used the old cutoff, 2026-10-25 20:25:50 JST, although the
online owner/source had an explicit January grant issued earlier that day. The
local cleanup loop crossed that stale cutoff and removed the replica, its query
rows and newly generated local visual cache. This interrupted acceptance. No
online source, online chat or paid ledger was changed.

The API was stopped. Recovery used the retained remote original/frames/index,
verified SHA256 against the existing local original backup, verified source
identity/generation and the existing local/remote owner binding, and restored the
original10 query rows and basketball desk from the private pre-test SQLite
backup. Their query-table fingerprint matches the pre-test baseline exactly.
Only the already-authorized January retention was reconciled; the authoritative
grant predates the stale local cutoff. Local session/source/desk now share the
same 2027-01-13 00:00 JST cutoff. This was an operator backup restoration, not a
new expired-source revival endpoint or a change to cleanup/ownership policy.
The recovered source's original bytes and generation are unchanged; free visual
cache reconstruction is required because those new derived files were lost.

Private recovery audit and authoritative grant proof are under
`.frameseek/local-retention-recovery-20261025/`. Attempts, budgets and settlements
still exactly match their pre-test hashes. The original paid ingest/index was
restored and has not been rebuilt or charged again.

Additional actual failures: the first large synthesis repeated free-text time
ranges beyond source duration and hit its token boundary, and a later synthesis
cited non-existent frames in the short final segment, discarding48 valid segments.
The local compiler now uses a single compact JSON grammar, concise relevant
summaries, authoritative per-segment available frame IDs and server-derived
citation times. Invalid references are excluded while retaining valid partial
evidence; an all-invalid answer still fails closed. Focused regressions cover
both mixed-validity and all-invalid outputs. Subsequent real appearance-search
acceptance is recorded above; exact event totals/ranking remain unaccepted.


## History persistence repair and final checks

Actual testing exposed the old12-record client/server snapshot cap silently
removing original cards from the desk as new tests accumulated. Query rows were
still durable. The real-source wire format now saves owned query references and
expands authoritative answers on read, retaining the existing1MiB state bound,
CSRF,owner/desk checks,exact evidence-pin validation and revision CAS. History
capacity is100 records, aligned with existing query retention; reaching it refuses
new cards rather than silently evicting old ones. This is not a model-call limit.

Operator recovery merged original10 rows and their hidden flags with completed
local tests, preserving draft and canvas state. The desk now contains22 records,
20 visible. Original query fingerprints remain equal to backup. Private backup:
`.frameseek/local-vision/before-complete-history-restore.sqlite3`.

Final automated checks:319 backend tests,143 frontend tests,frontend build,
Ruff/format/schema-drift checks and `git diff --check` passed. Tests cover local
transport,source/generation and ownership guards,unknown receipts,partial
reference validation,sampled-frame holes,range parsing,all-reference retention,
compact history ownership and player reveal. Mock tests do not prove recognition
quality; the actual page checks above establish only the inspected cases.

The sampled visual index supports generic attribute/presence queries without
basketball-specific answers. It does not establish exhaustive frame-level recall,
unique-person tracking,completed-action deduplication or correct three-point
counts/ranking. First ingest is slow (about18 minutes of local inference on this
machine); cached queries are faster. Runtime is Mac MLX and local-only; no deploy,
commit,push,new cloud resource or paid-budget installation occurred in this task.
