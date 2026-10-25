# FrameSeek core: conversational Ctrl+F for video

User clarification, 2026-10-25 JST: the primary goal is open-vocabulary video
search and understanding through chat. Given a description such as a person
wearing a red hat and white clothing, return matching occurrences on the source
timeline, evidence frames and direct replay. Basketball statistics are a later
aggregation capability, not the engine's first acceptance target.

## Delivered increment, not full recognition acceptance

`visual_search.py` now compiles a validated reusable frame-level view of the
existing persisted index, ranks arbitrary-language questions locally and adds
temporal exploration. It has no object/event dictionary or video-specific answer.
`POST /api/videos/{id}/search-index` returns explicitly unverified candidate
frames and original descriptions/timestamps without any provider call, approval
or ledger change. The page exposes this as **查找已有画面 · 不调用模型**.

Trusted Token Factory `FS_VISUAL_SEARCH=1` enables one vision-only verification
request over at most eight indexed candidates for a broad question. It retains
the existing two-scope ledger, original index/model generation and idempotency;
no automatic repair, retry, embedding, rerank, planner or text rewrite call.
The verifier derives criteria from the user's unchanged question and checks all
criteria on the same frame-local subject. Failed/uncertain criteria are excluded.
Independent timestamps yield separate evidence events rather than continuous
presence across an unobserved gap. Followups retain verified prior context.
The flag is server-only and rejected for other providers in both ledger modes.

This increment does **not** make sparse caption-only indexes into complete
object inventories, guarantee semantic recall for arbitrary paraphrases, prove
absence over an unexamined video, or supply full-event counts/identity tracking.
Both candidate UI and answer text distinguish retrieval coverage from verified
evidence. Whole-source aggregation is routed away from ordinary sampling using
generic query grammar rather than a basketball-specific branch.

263 backend and136 frontend tests pass. Browser QA exercised the new chat path
only through an explicitly labelled isolated mock transport; the real basketball
page exercised free index search and timestamp replay without model dispatch.
See [QA record](qa/CTRL_F_20261025.md). The full acceptance suite below remains
the target; do not call this universal video-understanding acceptance.

## Current gap

The existing player, private media, investigation storage, canvas, evidence
navigation and budget ledger remain useful. Ingestion currently stores sparse
frame captions joined into broad window descriptions and text embeddings.
Retrieval ranks those descriptions and examines a bounded few candidate windows.
This is not a validated exhaustive attribute/entity search engine. In particular,
two different people can jointly satisfy a bag of caption words without either
person satisfying the requested description, and sparse samples cannot justify
claiming continuous visibility or absence throughout an unreviewed interval.
Passing interface/mock tests has not established the desired search accuracy.

The unfinished event-count prototype is paused outside production source under
the ignored private working directory. It has not been deployed or connected to
chat. No source index, history, budget or media was changed by that prototype.

## Required engine boundaries

1. **Persistent visual observations.** Compile bounded, timestamped evidence for
   objects, appearance attributes, spatial relationships, actions, visible text
   and speech when actually supported. Bind attributes to an observed object,
   not a whole caption. Store frame references, source generation, model/config
   provenance and explicitly unexamined coverage. Unknown attributes stay unknown.
   No fixed event list, video-specific timestamps or hardcoded answers.
2. **Reusable index.** Preserve compiled observations independently of a question.
   Combine semantic retrieval with structured attribute/relation filtering.
   Validate source generations and reuse completed work rather than restarting
   paid ingest. Existing sparse indexes remain legacy artifacts; do not silently
   relabel them as complete object indexes or automatically rebuild them.
3. **Grounded query interpretation.** Resolve chat into criteria, conjunctions,
   relations, time scope and multi-turn references. Preserve distinctions between
   'a red hat AND white shirt on the same person' and separate people matching
   separate criteria. Identity continuity across cuts requires evidence, not
   assumptions. No query-specific source-code branch for basketball or boxes.
4. **Evidence verification and timeline.** Rank candidates, verify the requested
   criteria where needed and return source times with replayable evidence.
   Consolidate supported neighboring hits without spanning unobserved gaps.
   Return observed times/ranges and coverage limits separately. A top-k list is
   not 'all occurrences'; an empty sample is not 'does not exist in the video'.
5. **Conversation and aggregation.** Followups reuse the selected object/evidence
   and compiled knowledge. Event counting operates above verified occurrences,
   with explicit event boundaries and replay deduplication, after search works.

Paid extraction/verification must retain the current two-scope ledger, unknown
attempt rules and finite user authorization. Existing USD20/40 limits are not
increased. Offline development does not authorize running local models either.

## First acceptance suite

Use multiple independently annotated clips and hold out a clip/attribute
combination. Synthetic/mock observations establish contracts only; separately
score real decoded frames and visually reviewed source times before acceptance.

| Query/condition | Required outcome |
| --- | --- |
| Red hat and white clothing on one person | Match only an object satisfying both; retain evidence for each criterion. |
| Red hat on person A, white clothing on person B | Reject the combined-person match. |
| Similar clothing, different color | Exclude distractors; uncertainty for occluded/unclear color. |
| Several appearances across the source | Return supported occurrences, explicitly label any limited retrieval coverage. |
| Brief appearance, cut or occlusion | Measure missed events; never bridge an unobserved gap as continuous presence. |
| 'When does that person appear again?' | Resolve prior object only within owned source/generation; ambiguous continuity stays uncertain. |
| No match | Distinguish no match in reviewed coverage from verified full-source absence. |
| Box/person/vehicle/action questions | Same engine and contracts; no basketball-specific dispatch. |
| Repeat query and refresh | Reuse index and saved evidence; preserve conversations and drafts. |

Measure occurrence recall, precision and temporal localization against annotated
source evidence, including negative/distractor examples. Do not replace these
with frontend test counts or a single successful scoreboard answer.

## vindex reference assessment

Read [repository](https://github.com/vaibhav-space/vindex),
[pipeline](https://github.com/vaibhav-space/vindex/blob/main/vindex/compiler/pipeline.py),
[captioner](https://github.com/vaibhav-space/vindex/blob/main/vindex/extractors/vlm_caption/vlm_captioner.py)
and [relationship resolver](https://github.com/vaibhav-space/vindex/blob/main/vindex/compiler/relationship_resolver.py).
Its reusable typed observation/compiler/artifact boundary is relevant. The code
includes caption, OCR, ASR, object and motion extraction stages; this is not proof
of quality for FrameSeek's target queries. The captioner emits scene descriptions;
the inspected resolver links OCR/caption overlap, not persistent people and
clothing. Its stated product boundary excludes chat. Therefore it is a reference
or potential extraction adapter, not a verified drop-in Ctrl+F/chat engine.
No third-party code, models or dependencies have been installed or executed.

## Full-source offline observation engine — 2026-10-25

The next offline increment adds actual-PTS full-source scan planning, resumable
private structured-observation artifacts, same-subject predicate matching and
exhaustive observation traversal with paginated occurrence intervals. Sparse
samples, missing work and uncertain fields remain explicit. The workbench's
separate free caption browser now supports all saved records and pagination.

This does not populate real-video observations or replace the live eight-frame
verification path. The new engine is currently an offline artifact/CLI boundary;
visual extraction and natural-language predicate compilation still need integration
and independent recognition evaluation. No model calls or budget changes were
made. See [implementation and verification](qa/FULL_VIDEO_INDEX_OFFLINE_20261025.md).

### Current page connection

The offline-only statement above is superseded by the page-integration record in
[QA acceptance](qa/FULL_VIDEO_INDEX_OFFLINE_20261025.md#page-integration-supersedes-the-offline-only-boundary--2026-10-25).
Owned occurrence search, zero-model composer chat, durable restoration, explicit
property filters and the paginated original-time timeline now use the observation
engine directly. Concept alignment includes general bilingual normalization and
arbitrary aliases supplied by a trusted source index. Legacy captions stay
unverified; real full-source observations are not fabricated or automatically
re-extracted. The real basketball index remains sparse.

## Local event reasoning increment (2026-10-25)

Private observation indexes may now carry trusted track/entity references,
canonical event keys, event completeness and data-driven state-transition rules.
The existing owned index-chat and occurrence timeline can count these events,
group by supplied entity references and exclude explicitly linked replay clips
from counts. This does not create new visual observations, infer identities from
clothing, or recognize unlabelled replays. Full source/event coverage is required
before a count can be exact under the index. Raw basketball shot recognition and
full-match counting remain unaccepted. See
[offline event/page QA](qa/EVENT_ENGINE_OFFLINE_20261025.md).


## Actual optional local visual engine (2026-10-25)

The opt-in on-device route now compiles owned original frames and selects
question-relevant observation IDs in small batches. It expands every matching
observation's actual support frames. Appearance/presence questions directly check
remaining sampled frames, with independent single-frame confirmation for batch
negatives. Query/source/generation-specific receipts prevent silently repeating
unknown work. Source timestamps are computed from decoder metadata; search
summaries use actual matches and a query-condition label, not invented model time
lists. General targets and conjunctions are not basketball-specific branches.
See [runtime](LOCAL_VISION.md) and [actual page acceptance](qa/LOCAL_VISION_20261025.md).
This does not establish original-frame exhaustive recall or unique-entity/event
counts. The default fixture and zero-model caption-search routes remain separate.
