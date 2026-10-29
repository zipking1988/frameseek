# Supplement retention and admission fixes — 2026-10-29 JST

The user authorized fixing the two review findings and continuing deployment.
No model requests, approval changes or refunds are part of this release.

## Changes

- Supplement inputs are removed when the owning session, investigation or video
  expires or is deleted. Explicit deletion uses the same transaction as the
  tombstone; startup/periodic cleanup uses the same pruning rule.
- Admission reclaims invalid records before checking the existing 1,000-record
  storage bound. Live completed and unknown requests keep their identity and
  remain idempotent; a storage bound still applies to valid retained history.
- Admission rechecks the live owner, source generation and investigation epoch
  inside its write transaction. A stale caller cannot recreate a private input
  after deletion or expiry.
- Late worker completion and unknown results cannot recreate a deleted job or
  publish its candidate index. Paid attempt reservations and receipts are not
  modified by this pruning.

## Verification

Twelve focused regressions cover deletion of investigations/videos, expiry of
each owning context, preservation of another owner's completed and unknown
jobs, byte-equivalent synthetic ledger contents, recovery after 1,000 expired
jobs, preservation of the live history bound, stale admission and late workers.
Nine of the initial ten cases failed before the fix; all twelve pass afterward.

A frozen candidate of the reviewed application plus these fixes passed all
555 backend tests and 209 frontend tests. Its frontend build passed. The first
snapshot test run lacked the three public runtime example files and the authored
frontend source; those validation inputs were copied into the isolated candidate
before the successful full run. No operational runtime or private data was copied.
The candidate excludes a separate concurrent marketing-homepage change.

These are integration and lifecycle checks with synthetic data/mock processors.
The previously required real-material human quality evaluation remains open.

## Deployment state

Deployed to the existing single-process Nebius service. The live release and
rollback copies are private at `/srv/frameseek/review-retention-20261029-r2`.
All 88 source/package files match the final frozen manifest in both the source
tree and installed Python package. A concurrent marketing-homepage change was
excluded. No Git commit or push was performed.

The first installation exposed a packaging error: implicit archive directories
inherited mode 0700 under the private deployment umask, so the service account
could not import the application. Code was rolled back and the systemd restart
limit reset; no database or ledger rollback occurred. The corrected archive
contains explicit 0755 directories and 0644 code files. Permission regression,
read/traverse checks under the actual service account, and an isolated Linux
fixture startup passed. The latter returned 200 for the page, health, bundle,
demo video and session, with zero model requests and a disposable data directory.

Actual page testing also reproduced a stale duration label after switching from
basketball to the synthetic box video. The source switch now resets the demo's
metadata before its media-load event. A focused regression and all 210 frontend
tests pass; both local and frozen frontend builds passed. Only `app.js` and its
`index.html` content hash were changed in the static follow-up; no backend restart
or data write was needed for that patch.

Online browser verification restored the existing six-turn basketball desk,
replayed the 03:00 evidence, and opened the existing empty synthetic box desk.
Box playback sought 00:13; the corrected 18-second metadata and paused 00:13
position survived refresh. During a network change, a save error was followed by
a revision conflict; the existing reopen action recovered the committed 00:13
state. This did not establish which transport response was lost. No question,
retry, model analysis or index build was submitted.

Before/after deployment fingerprints match exactly for 16 investigations,
14 queries, one real video, 40 attempts, six budget rows, 25 settlements and all
three private runtime/configuration files. A later post-browser audit also
confirmed all 16 desks' records, pins, notes and original drafts are preserved;
only ordinary selection, playback and revision metadata may change. Unknown
attempt reservations remain unchanged. The financial allowance remains $20/40,
with 40 requests already used. New knowledge processors remain disabled pending
calibration and real-material human acceptance; this is not acceptance of new
model-answer quality or a completed basic index.

## Authorized management recovery

The root cause of the initial SSH timeout was an administrator IP mismatch.
The user's $0.20 cumulative gift-credit-only recovery authorization covered two
temporary CPU rescue instances after the Mac's public IP changed again during
the work. Only the SSH IPv4 allow rule was updated; existing keys, passwords,
web-port rules, private configuration and the separate workspace data disk were
preserved. The original boot disk was temporarily represented as an existing
disk for safe rescue attachment, then restored to its original managed spec.

The second rescue's cleanup watchdog superseded a simultaneous manual stop,
deleted the temporary instance and its own boot disk, and started the original
VM. The original boot-disk lifecycle was restored afterward. Final cloud checks
show only the original VM and its original two disks, with the original VM spec,
static IP and resource size unchanged. Current-IP SSH and the service are active.
The conservative combined rescue estimate is $0.043891 before tax, within the
$0.20 authorization; the final provider invoice is not yet available. Billing
showed $100 hackathon credit and $8.07 consumption, and official support had
confirmed promotional credits are consumed first. No card setting, top-up, GPU,
model approval, request cap or currency cap was changed.

Private evidence is under `.frameseek/review-release-20261029.cX6IiC/`, including
the frozen manifests, protected-row audits, cloud cleanup/cost audits, install
log and browser screenshots. This recovery and cached-page verification does
not resolve the previously open January grant-expiry or real-recognition gates.
