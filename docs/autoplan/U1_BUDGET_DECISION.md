# D49 — U1 budget policy decision

Human reply selected B2 (resolve user challenge) on 2026-10-04 Asia/Tokyo. This routes to the U1 decision; it does not approve a larger call or money budget, the whole plan, or implementation.

## A — Accept configurable bounded admission (recommended)

Replace the fixed 30 primary coarse-window rule as a permanent limit with explicit deployment budget configuration. Compute the complete actual window count N after media/scene probing, including overlap and tail; admit only when the approved primary-call cap covers N and the conservative cost/resource estimate fits the approved budget. No silent partial indexing. Additional retries remain separately bounded with default zero; query zoom remains three attempts including retry/expansion. Unknown dispatch completion is still charged conservatively and never auto-replayed.

This answer approves the policy direction, not any price or unlimited calls. Determine numerical call/money caps from first real measurements and available quota during D1; keep current 30 protection until those values are explicitly confirmed. Missing values or insufficient budget reject a real task before inference. Thus hourly execution stays operationally blocked until deployment configuration is ready, while its design no longer assumes 30 calls can index a full hour. Preserve all original quality and time targets as unmeasured targets.

Benefit: supports complete hourly admission when the measured, finite budget permits, including scene counts above 32. Cost: needs actual price/timing/resource calibration and an approved cap before long real jobs can run. No new public billing product or paid work is authorized by this decision.

## B — Keep fixed 30 primary windows

Keep current limit and preflight rejection unchanged. At 120 seconds with 5-second overlap, 30 continuous windows cover at most 3455 seconds (57m35s); scenes can reduce admitted duration. Full-hour indexing and the associated hourly target remain explicitly blocked, without clipping tails or presenting a partial index as ready. Other MVP work can proceed after final plan approval.

Benefit: retains the original call protection without choosing a larger budget. Cost: the one-hour admission conflict remains, and this is not a completed full MVP acceptance.

## State

Approved policy: A, by the human reply `A` to D49 on 2026-10-04 Asia/Tokyo. Carry this exact scope into the engineering rerun. Numeric spending caps remain pending D1 measurements and explicit confirmation; current30 protection remains active until then. Entire plan and implementation are still pending final approval. The B alternative is retained for history, not selected.
