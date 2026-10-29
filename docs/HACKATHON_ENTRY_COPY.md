# FrameSeek hackathon entry copy

Prepared 2026-10-29 for the Nebius x NVIDIA Global AI Hackathon. The project is a
draft. The basketball landing page and English guide are local changes; no new
model spending or repository publication is authorized by this document.

## Project name

FrameSeek — Basketball Film Room

## Elevator pitch

A desktop film room for basketball: ask questions about footage, replay cited
frames, and keep follow-up questions connected to the evidence.

## Project story

### Inspiration

Basketball film contains useful details that are difficult to find again. A coach,
player or analyst may remember a jersey, a scoreboard or a moment before a play,
but still has to scrub through the recording. We wanted a film room where a
question leads back to the footage that supports the answer.

### What it does

FrameSeek is a desktop video investigation workspace. Users can upload a recording,
ask about visible details, inspect cited source frames and replay their original
timestamps. Follow-up questions stay connected to the earlier answer. Conversation
and spatial canvas views present the same investigation, and saved findings can
be organized and exported with their references.

The basketball-focused interface is designed for inspecting evidence. It does not
claim complete shot counts, player identity tracking or automatic coaching advice.

### How we built it

The backend uses Python, FastAPI and SQLite. FFmpeg and ffprobe preflight uploaded
media and decode bounded samples with original video timestamps. A React workbench
connects the source player, questions and evidence. Evidence references and model
output are validated before publication; interrupted work preserves valid partial
results. Private sources remain protected by session ownership and expiry checks.

The NVIDIA route uses Nemotron 3.5 Super VL through Nebius Token Factory for visual
inspection and answer generation, with Qwen3 Embedding 8B for text retrieval. The
application is hosted on a Nebius AI Cloud CPU instance; this route does not rent
a dedicated GPU. Model requests pass through finite owner and deployment budgets.

### What has been demonstrated

An earlier limited Nemotron/Token Factory basketball run returned scoreboard
evidence at source time 05:26.1 and a contextual follow-up. These saved answers
were partial and used sparse sampling. The newer reusable basketball index was
tested separately with a local Qwen processor; those results are not Nemotron
results or a controlled model comparison.

The currently available public synthetic parcel demo uses preset answers and no
model calls. It demonstrates the question, cited frame, replay and saved-workspace
interaction. The sports images on the landing page are illustrative. A fresh-judge
live sports-analysis flow is not yet verified.

### Challenges we faced

A plausible answer is not enough: its frame must belong to the correct video and
seek to the correct time. Sampling can miss a short appearance, and a number of
cited images is not a count of unique events. We also had to handle cancellation,
late responses, persistent edits and uncertain model attempts without silently
repeating paid requests or replacing real answers with synthetic ones.

### Accomplishments and lessons

The workspace joins questions and playback into a reviewable investigation rather
than a disconnected chat transcript. Uploads, private playback, saved investigations
and original-time evidence navigation work locally. The cloud integration has
recorded limited real evidence as well as explicit failures; mock regressions cover
the surrounding contracts. We learned to distinguish valid output structure from
visual correctness, and to preserve uncertainty alongside useful evidence.

### What is next

The immediate goal is a repeatable NVIDIA/Nebius basketball workflow that a fresh
judge can operate. Next come human-reviewed sports examples, measured review-time
comparisons and broader testing across recordings. Event counting, identity
tracking and additional sports remain outside the demonstrated scope.

## Built with

Python, FastAPI, React, JavaScript, SQLite, FFmpeg, Nebius AI Cloud,
Nebius Token Factory, NVIDIA Nemotron, Qwen3 Embedding.

## Try it out

Current hosted application: https://framefix.net

Local rebuilt landing: http://127.0.0.1:8781/

Only the hosted URL belongs in Devpost. The local landing and English follow-up
changes are not deployed yet. A public source URL and public demo-video URL must
come from their actual published results, not placeholders.

## Additional information answers

**Track:** Best apps and agents.

**Models and variant choice:** NVIDIA Nemotron 3.5 Super VL was used through
Token Factory for visual inspection and text reasoning. This avoids managing a
dedicated GPU for the prototype. Qwen3 Embedding 8B provides text embeddings for
retrieval. The newer local Qwen visual-index experiment is a separate route.
No controlled size/variant benchmark has been completed.

**Output quality evidence:** The limited real run found a readable basketball
scoreboard and supported a follow-up, but returned partial results, sparse
coverage and a rejected planner response. Later cloud work encountered an
uncertain vision attempt and budget blocking. A defensible numeric quality
rating requires the submitter's own review; no general accuracy score is claimed.

**Adaptation approach:** Prompt engineering with frame IDs, original timestamps,
bounded samples and schema validation. No Nemotron fine-tuning or training was
performed. Failed or unknown requests are not automatically replayed.

**Comparison with other models:** Local Qwen was used in a separate reusable-index
experiment. Different pipeline versions and prompts prevent a fair head-to-head
speed, quality or cost claim.

**Useful Nebius capabilities:** Token Factory provided a hosted NVIDIA vision and
reasoning API; Nebius AI Cloud hosts the one-process CPU web application with
persistent workspace storage. No autoscaling, dedicated GPU deployment or
serverless-job performance result is claimed.

**Recommended improvements:** Clear immutable model revisions, explicit image and
reasoning-token limits, structured diagnostics for rejected/truncated responses,
and supplier-enforced spending cutoffs would make bounded video workflows easier
to operate and explain.

**What we hope to see from Nemotron:** More reliable temporal action recognition,
calibrated uncertainty, consistent binding of attributes to the same visible
subject, and stronger frame-linked evidence output.

**Tavily:** No runtime Tavily integration is present; do not enter that prize.

**AI development tools:** OpenAI Codex assisted implementation, debugging,
documentation and tests. OpenAI ImageGen created the explicitly illustrative
basketball marketing assets. These development tools are separate from the
application's NVIDIA/Token Factory and local-Qwen execution paths.

The submitter must personally supply residence, individual/team/organization
status, numeric experience/recommendation ratings, prior-project history and
eligibility declarations. Do not infer residence from a timezone or claim IRL
event attendance without confirmation.

## Two minute fifty second recording script

Use only footage cleared for the intended audience. Rehearse the exact available
flow first. This is a script, not a completed recording or a verified live demo.

| Time | Screen | Narration and action |
| --- | --- | --- |
| 00:00–00:20 | Landing page | “Finding one moment in game film still means scrubbing through a recording. FrameSeek connects a question to footage you can inspect.” |
| 00:20–00:45 | Workspace | Identify the actual processor and source. Explain question, evidence and source-player layout. Label a saved result or synthetic fallback before showing it. |
| 00:45–01:35 | Verified real sports flow, when available | Ask one bounded, already-rehearsed visible-detail question. Read its actual answer, click a cited frame, and show the source player at the matching timestamp. If only saved evidence is available, explicitly present it as saved evidence rather than a new response. |
| 01:35–02:05 | Follow-up and canvas | Select the answer, ask the rehearsed contextual follow-up and switch to the canvas. Show the actual relationship and original timestamps. Do not improvise an untested counting question. |
| 02:05–02:30 | Architecture/provenance | “The NVIDIA route uses Nemotron through Token Factory; the app runs on Nebius. FrameSeek bounds sampling, validates references and accounts for model requests.” Distinguish any local Qwen example. |
| 02:30–02:50 | Evidence and close | “Sampling can miss moments. We preserve uncertainty and let the reviewer return to the footage. Next is a repeatable judge workflow and measured sports evaluation.” |

**Fallback:** use a recording of a real completed flow, labeled as recorded. If
only the synthetic parcel flow is available, label it preset/no-model and explain
that it demonstrates interaction rather than sports recognition. Do not substitute
the marketing illustrations for real model evidence.

## Remaining release decisions

1. Approve the exact clean source archive and a project license before any public
   repository is created. The original repository remains private.
2. Provide a real public video URL after reviewing and publishing the recording.
3. Verify a fresh judge's actual sports path and its authorized model capacity.
4. Resolve hosting continuity through the required judging period.
5. Complete the personal declarations in Devpost, review the final materials and
   submit personally at the final agreement step.
