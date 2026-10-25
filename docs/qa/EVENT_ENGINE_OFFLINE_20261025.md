# Event reasoning and player recovery — 2026-10-25 JST

Status: partial implementation; real-video semantic recognition is NOT accepted.
No model dispatch, spending approval, limit, retention extension or deployment.

## Implemented locally

- Optional trusted action observations, source-wide track/entity references,
  explicit canonical event keys and per-frame event-inventory coverage in the
  private generation/source-bound observation artifact.
- Data-driven state-transition rules (before/after predicates on the same track).
  An observed rising state triggers once, rather than once per still-positive
  frame. Unknown predicates, missing frames, cuts and identity changes do not
  prove transitions. Event semantics come from existing observations, not pixels.
- Continuous event observations on a track merge only across contiguous decoded
  source-frame intervals. An explicit canonical event key can associate replay
  evidence with its original event; visually similar clothing or frame-local IDs
  never establish this link. Separate source clips retain their original PTS.
- Count and stable-entity grouping flow through the owned zero-model index chat,
  existing idempotent query/CAS persistence, evidence inspector and timeline.
  Pagination does not truncate statistics. Unknown qualifiers are not discarded.
- Complete source catalog, complete event inventories and resolved event identity
  are required for exact counts under the supplied index. Partial grouping counts
  are labelled as such and cannot establish a whole-video total or winner.
- A compact 32px current-video button appears when the source panel is collapsed.
  It aligns with the other canvas tools. The canvas rail also restores the player;
  panel changes now explicitly notify persistence.

## Page verification

An isolated no-provider workspace, explicitly labelled **synthetic annotations**,
was tested through the actual browser and HTTP routes:

1. `开门多少次？`: two rising state transitions became two events at source2s/8s.
   Source frames loaded and a reference sought exactly2s.
2. `搬运多少次？`: three evidence clips became two events; the explicit replay
   association removed one duplicate from the count without hiding its source clip.
3. `谁搬运最多？`: the existing entity reference grouped the two events. No person
   name or identity was inferred. A reference sought exactly10s.
4. Refresh restored all three chats, inspector answer, a separately typed draft
   and10s playback position. The isolated ledger reported zero model attempts.

This proves the temporal reasoning and page integration on supplied annotations,
not automatic interpretation of new raw videos. Test evidence is private under
`.frameseek/composer-polish-20261025/`.

## Actual data and limits

The basketball source currently contains40 sparse captioned frames and no full
per-frame action/event observation artifact. None of those captions directly
records an individual made three-pointer. Score changes do not prove shot type,
actor identity or absence of omitted/replayed events. No fake event annotations
were added to basketball or the box demo. Therefore the actual basketball
three-point total and player ranking remain unsupported, and this work must not
be described as completing that capability or as a verified raw-video recognizer.
Automatic visual recognition, automatic identity tracking and unlabelled replay
recognition remain open. No model was invoked to fill those data gaps.

## Session isolation incident and recovery

The first temporary QA page used127.0.0.1 on another port. Cookies are scoped by
host rather than port; its fixture session replaced the operational browser
cookie. Original data remained intact. The original owner, CSRF, expiry, source
and budget bindings were recovered via an offline-only bearer reissue. The helper
has no HTTP issuance endpoint, keeps one recovery token per existing unexpired
owner, and never moves ownership or extends validity. Private token material was
not printed and the temporary one-use loopback recovery server was shut down.

The QA harness now uses localhost and a separate `fs_qa_session` namespace. It
ignores operational session cookies. Regressions verify recovered ownership,
CSRF enforcement, private draft recovery, unchanged expiry, previous recovery
credential invalidation, and expired-session rejection.

Fingerprints for all local videos, query rows, attempt rows, settlements and
budgets match before/after. Records, pins, notes and drafts across all9 preexisting
investigations match the recovery backup (including the accidental empty fixture
session desk). The restored operational basketball page shows8 visible cards,
the original unsent draft and326s playback. No production data or configuration
was written; cumulative allowance stays$20/40 requests, already40/40 used.

## Checks

- 307 backend tests passed, including event continuity, explicit replay keys,
  state transitions, uncertain gaps, foreign identities, pagination/snapshots,
  same-owner session recovery, owned durable API chat and media evidence.
- 140 frontend regressions passed, including canvas restoration of the player,
  preflight feedback, draft retention and existing persistence contracts.
- Frontend build, Ruff lint/format, schema export check and diff whitespace passed.

No commit, push, online deployment or additional live inference acceptance.
