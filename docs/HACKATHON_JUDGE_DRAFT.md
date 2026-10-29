# FrameSeek — submission draft

## Preparation update — 2026-10-29

The existing Devpost draft was renamed **FrameSeek — Basketball Film Room**.
Its sports-focused pitch, 526-word English story, Python tag and current hosted
application link were saved and read back. The entry remains DRAFT, and no final
submission or eligibility declaration was made. [Entry copy](HACKATHON_ENTRY_COPY.md)
includes the prepared technical feedback and a timed recording script.

A 2:20 private review video now has ElevenLabs English narration and captions;
see [video notes](HACKATHON_VIDEO.md). Its basketball scene contains archived
canvas text with broadcast images excluded, and the new UI flow is explicitly
synthetic. A public video URL remains unresolved. No new FrameSeek inference was
executed.

The user subsequently uploaded the cut to YouTube and entered its URL in Devpost.
The saved project details now include that URL and three captioned gallery images
in cover/replay/canvas order. The entry remains DRAFT, 3/5 steps. Independent
signed-out playback and fresh-judge sports acceptance remain unverified; see the
current [media update](HACKATHON_VIDEO.md#submission-media-update--2026-10-29).

A private 184-file source candidate was prepared from explicit source roots and
blocked runtime templates. It excludes the Git database, private media, operational
environments, budgets, databases and billing/support records. A proposed MIT text
is included only as `LICENSE.MIT.proposed`; no project license or public repository
has been selected or created. The original repository remains private.

**Status: not ready to submit.** This document is a working draft, not a claim
that the project meets the organizer's requirements. It records the evidence
available in the repository on 2026-10-29. Recheck the final rules and all links
before submitting.

The [official rules](https://nebiusglobalaihackathon.devpost.com/rules) specify
an October 30, 2026, 10:00 a.m. Pacific submission deadline (October 31,
2:00 a.m. Japan time). They require free judge access until the judging period
ends on December 15, and an English translation of submitted materials that are
not in English. The user separately wants hosting through the January results;
the existing credit record does not prove that duration is funded.

## Project description

FrameSeek is a desktop video investigation workspace. A user asks a question
about an uploaded video and can replay a cited frame at its original video
timestamp. Follow-up questions and evidence remain associated with the video;
the canvas presents the investigation as connected questions and evidence.

The intended use is to help a person find and inspect relevant moments in a
long recording. The system should distinguish observations from uncertain or
unreviewed parts of the video. A sampled index is not a claim that every frame,
event, or person has been identified.

Candidate category: **Best Apps and Agents**. Confirm the final category and
eligibility against the organizer's rules before submitting.

The official review uses a first-stage viability and required-technology check,
followed by four equally weighted criteria: technological implementation,
design, potential impact, and quality of the idea. A compelling saved demo is
not evidence that a fresh judge can operate the submitted project.

## Evidence for the NVIDIA and Nebius integration

A previous real Token Factory smoke used NVIDIA Nemotron 3.5 Super VL. The
basketball test located a scoreboard at source time 05:26.1 and answered a
follow-up using that frame. The saved results were marked partial and used sparse
sampling; one invalid planner response was rejected. See
[the recorded smoke](TOKEN_FACTORY_LOCAL.md#final-smoke-result-2026-10-24).

The hosted application uses a Nebius CPU instance. The older optional
Token Factory cloud-chat path is deployed behind the existing budget checks,
but the recorded approved request count was exhausted: the documented live
acceptance stopped before dispatch. See [cloud acceptance](qa/CLOUD_VISION_20261025.md).
Do not present the earlier smoke as a newly verified working judge session.

The newer upload-time VideoKnowledge index was tested separately on a local Mac
with an on-device Qwen model, **not NVIDIA Nemotron**. It indexed a copy of the
full basketball video and returned a frame with a blue jersey and yellow headband
at 05:09 and 05:10; the 05:10 citation sought to the correct source time. A
synthetic box video was also used to check index reuse. See
[local test evidence](qa/KNOWLEDGE_REFACTOR_20261029.md). These tests do not
establish Token Factory quality, production readiness, or human-reviewed
20-case accuracy.

## Suggested three-minute video outline

An [English interface and rehearsal guide](JUDGE_REHEARSAL_EN.md) is available
as an internal draft. It is not a verified judge-access workflow.

This is a script for a future recording, not a recording or a verified demo link.
Do not include footage without the right to use and publish it.

| Time | Material | Evidence to show |
| --- | --- | --- |
| 0:00–0:20 | Problem | A long video is difficult to search by visible details. |
| 0:20–0:45 | Product | Ask a question, see an answer with source frames, and seek to the timestamp. |
| 0:45–1:30 | Demonstration | Show an actually available judge-accessible flow and its provenance. Label synthetic data or saved results clearly. |
| 1:30–2:00 | NVIDIA and Nebius | Show the real Nemotron / Token Factory path and explain which recorded example it produced; distinguish any separate local-model example. |
| 2:00–2:30 | Design | Explain reusable sampled observations, bounded follow-up checks, original timestamps, and uncertainty. |
| 2:30–2:50 | Limitations | Explain that sampling can miss appearances and that event counts, identity tracking and speech are not established. |

Only use this outline after rehearsing the exact available experience and making a
backup recording. Do not call a local-only preview a public demo.

## Submission gates

- [ ] Verify the final official rules, deadline, category and required disclosure
  for work that existed before the submission period.
- [ ] Provide a working judge-accessible URL and verify a fresh judge session can
  complete the chosen flow. A localhost-only preview or another user's private
  saved investigation is not sufficient.
- [ ] Establish an authorized, calibrated NVIDIA/Nebius execution path with
  adequate existing budget, or document precisely what a judge can run. Do not
  increase spending limits or enable a paid path without the required authority.
- [ ] Complete the specified human-reviewed quality evaluation; report real and
  synthetic data separately, including misses and sampling limits.
- [ ] Obtain an appropriate license decision and prepare an independently
  reviewed public repository. No project license is currently selected, and
  the existing repository must remain private until publication is explicitly
  authorized. Check all media and third-party rights before release.
- [ ] Record and publish an accurate video of at most three minutes, prepare the
  required Nebius/NVIDIA feedback and disclose prior work. Publication is a
  separate action; this draft does not authorize it.
- [ ] Supply English text, testing instructions, and an English video or
  translation. Confirm the video and its source materials are cleared for
  public display under the official rules.

On 2026-10-29 a read-only attempt to revisit Nebius support issue M297448313
redirected to sign-in. Google presented multiple accounts without identifying
which one owns this Nebius tenant, so no account was selected. The issue's
current response and any extension of hosting credits remain unverified.

The exact hosting-credit expiry remains unresolved. Support confirmed that
budgets only alert and the linked card can be charged after credits and positive
balance are exhausted; the requested additional $50 was declined. See the
[billing check](NEBIUS_LIVE_STATUS.md#support-and-billing-check--2026-10-29-jst).
Do not promise gift-only hosting through the judging period on current evidence.

On 2026-10-29 JST, a read-only HTTPS check returned HTTP 200 with certificate
validation successful for the hosted home page. The public health response
reported `mode: real`, `provider: tokenfactory`, and `real_ready: false`. This
is service reachability and its own readiness report, not a live chat,
fresh-judge workflow, budget reconciliation, or quality acceptance. No model
request was sent. The local `make agent-check` run without operational runtime
environment reported fixture mode and blocked paid prerequisites; it does not
describe the separately configured running server.

A fresh cookie-free HTTP check on 2026-10-29 found that the public synthetic
catalog and byte-range demo video are reachable. The public catalog labels the
video synthetic and provides 17 preset questions; its first question is Chinese.
The local English guide URL returned 404 on the deployed site, and the deployed
demo script did not contain the guide's exact English example. This is not an
interactive browser acceptance and does not establish that an English-speaking
judge can complete the flow. Do not send judges the local guide as an online
instruction without reconciling and verifying the deployed experience.

A separate Chrome browser session was used for an interactive check of the
currently deployed synthetic parcel demo. It showed a preset Chinese answer
with evidence; selecting 00:06 sought the player to 00:06. Entering the exact
English question in the local guide returned the on-screen message that the
question is not a demo example, retained the draft, and stated no model was
called. The public health counter remained 40 before and after. This browser
session showed the synthetic demo rather than the user's basketball history,
but it is not proof of a clean independent judge account or a general
English-language experience. No paid query was sent.
