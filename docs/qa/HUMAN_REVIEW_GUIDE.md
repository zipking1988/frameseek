# Private sampled-frame review: operator guide

This is an internal quality check, not a judge-accessible demo. The review page
contains private copies of basketball frames. Keep the page, labels and report
local; do not publish or share them without checking rights. The synthetic box
cases are labelled as synthetic. Do not present them as real-video accuracy.

The current 22-case packet contains **no human labels**. Its real and synthetic
cases are evaluated separately. Matching an extracted frame does not prove the
system found every occurrence in the video. The model may miss items between
samples, and this evaluation does not establish event counting or cross-shot
identity tracking.

## Review the packet

1. Open `.frameseek-eval/review-draft-20261029/private-review-expanded-20261029.html`
   on the same machine. This file is ignored by Git and embeds the sampled images.
2. Enter the actual reviewer's name. For each question, click an image to enlarge
   it, then mark every sampled frame **符合**, **不符合**, or **不确定** based on
   the image itself. Do not consult the separate prediction file while reviewing.
   Do not guess: a case with any uncertain frame stays unreviewed.
3. Enter the visible duration in seconds when the target or distractor is visible.
   The acceptance contract requires at least one second. Do not infer a duration
   that was not checked in the source video.
4. For the case marked **追问页面核验**, actually perform the follow-up in the
   app, then record its original request ID, resolved question and evidence
   location. For **时间跳转页面核验**, select the cited frame and record the
   actual player time and the verification evidence location. Only tick the
   corresponding box after performing that check. A screenshot or local test
   record must identify the actual source and index version. These fields are
   self-attested; the page does not perform the checks for the reviewer.
5. Download the JSON periodically. If interrupted, reopen the same review page
   and use **继续先前审核** to import the saved JSON. Import replaces selections
   on the current page after validating case and source identities. Export again
   after further edits. Keep each reviewer's records separate.

## Score without a model

Use the original packet and the same private workspace that supplied its
immutable source and index versions. The following paths describe the isolated
workspace prepared on 2026-10-29 and may not exist on another machine:

```sh
uv run --frozen python scripts/score_knowledge_review.py \
  --workspace /var/folders/r8/_c2g_ryj0zj7zz_2574kqzzr0000gn/T/frameseek-full-ready-8s0qogbx \
  --cases .frameseek-eval/review-draft-20261029/unreviewed-cases-expanded-20261029.json \
  --reviewed /absolute/path/to/frameseek-human-review.json \
  --output .frameseek-eval/review-draft-20261029/human-review-report.json
```

The output file must not already exist. The scorer rechecks ownership, expiry,
source fingerprints, original index versions and frame membership, then
recomputes predictions. It does not call a model or establish reviewer identity.
Read the separate real/synthetic metrics, unscored cases, issues, follow-up and
seek evidence before interpreting acceptance. Do not change the original packet
or index version to make a score pass.

The prepared workspace's owner session and earliest source expire at
**2026-10-30 00:52 Japan time**. Once expired, the scorer intentionally refuses
to use those records even if the embedded review page still opens. No expiry has
been extended. A new legitimate, owned evaluation dataset and packet are needed
if the records expire before review; do not alter timestamps to bypass the check.
