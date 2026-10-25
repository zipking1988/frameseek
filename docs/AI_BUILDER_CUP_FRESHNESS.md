# AI Builder Cup development-history review

Reviewed locally on 2026-10-11. No GCP resources were started, no repository
visibility was changed, and no commits, pushes, fetches or organizer messages
were made. Existing working-tree changes were preserved.

## Finding

The available local evidence supports FrameSeek having been designed and
implemented during the published AI Builder Cup building period. It does not
establish unconditional eligibility or prove that every submitted asset was
created from scratch during that period.

The official [timeline](https://aibuildercup.com/) lists registration from
2026-09-01 and prototype building/submission from 2026-09-07 to 2026-10-18.
The [FAQ](https://aibuildercup.com/Faqs.html) excludes pre-existing projects and
work begun before launch. The [formal terms](https://docs.google.com/document/d/e/2PACX-1vRm7ChZ6Ij9fG7uFDkxzUMpwgVeBmnQ6cMDnAIEEX84AiLBOOQ9cYbl3S5OzFBbcVb8TF55s-eVpiXb/pub)
require fresh code and original assets created during the official timeline,
and also exclude pre-existing products and ongoing projects. The rules do not
explicitly resolve the case of a project initially intended for another event
but created entirely within this event's development period.

## Evidence timeline

Times below use Malaysia time (UTC+08). Git stores the observed commit dates in
UTC+09; these have been converted rather than treated as local Malaysia times.

| Date/time | Evidence | Meaning and limit |
| --- | --- | --- |
| 2026-10-02 23:12:51 | `ARCHITECTURE.md` macOS file birth time | Earliest observed tracked-file creation metadata; copying/moving files can preserve or replace such metadata. |
| 2026-10-03 | `docs/autoplan/FINAL_REVIEW-20261003.md` and planning artifacts | Design/review work before the first implementation commit, still within the event period. |
| 2026-10-04 10:15:06 | `docs/autoplan/APPROVAL.md` embedded UTC timestamp | Local implementation authorization, not event registration or organizer approval. |
| 2026-10-04 10:16:51 | `src/frameseek/__init__.py` macOS birth time | Earliest observed tracked production/test/script file creation metadata. |
| 2026-10-04 | `docs/D1_STATUS.md:3` | Explicitly records October 4 as the first implementation day. |
| 2026-10-04 19:41:10 | Original initial commit `f765e0d` | Retained in the reflog/object store; amended 37 seconds later. |
| 2026-10-04 19:41:47 | Current root commit `619f425` | Initial import: 320 files and 47,393 insertions, including historical documents and review artifacts. This is not proof that work began at commit time. |
| 2026-10-05 | Commits `e936793`, `4b53361`, `b88fc0a` | Subsequent canvas/report/readiness work and review fixes. |
| 2026-10-11 | Uncommitted Gemini adapter and deployment preparation | Current additive AI Builder Cup route; does not reset the earlier project creation date. |

## Git checks

- The repository is not shallow. No replace refs or grafts were found.
- All local refs contain five reachable commits. Inspection of all local commit
  objects found six commits, including the original amended initial commit.
- The earliest author and committer dates among these six are October 4, 2026.
- The reflog records the initial commit on October 4 and later local push updates
  on October 4/5. Those are historical records; this audit performed no push.
- Object integrity checking passed. Dangling trees and the amended initial
  commit exist; none supplied an earlier commit date. Trees have no inherent
  creation timestamps.
- A date-token scan of tracked root/document Markdown, JSON and JSONL files,
  excluding historical source snapshots, found no `2026-MM-DD` or `2026/MM/DD`
  tokens earlier than September 7. This limited scan is not a provenance audit.

## Remaining uncertainty

Git dates and filesystem timestamps can be changed, and an initial import can
contain older work. Local records therefore corroborate a timeline rather than
independently prove original authorship or the absence of earlier copies.
Third-party dependencies/assets and any code imported from outside this checkout
have not been exhaustively audited.

The October 3 architecture snapshot names Nebius/NVIDIA as the original target
event. That does not establish work before AI Builder Cup launched, but the
organizer should clarify whether the broader exclusion of ongoing projects
applies to this situation. Preserve the real history and disclose the original
route rather than claiming the project began with the Gemini addition.

Suggested clarification text (prepared only; not sent):

> We began designing FrameSeek on October 2–3, 2026 and implementing it on
> October 4, within your September 7–October 18 building period. It was initially
> intended for a Nebius/NVIDIA hackathon. We added a Gemini route on October 11
> and have not deployed either cloud route. Assuming no project-specific code or
> original assets predate your event, is this eligible under your fresh-project
> rule, or does your exclusion of ongoing projects also cover this situation?

This finding covers project freshness only. Live Google AI execution, required
deployment, submission artifacts and other eligibility conditions remain
separate requirements.
