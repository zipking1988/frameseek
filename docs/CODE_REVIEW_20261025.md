# Code review and dev delivery — 2026-10-25

Scope: the current dev branch against origin/main, including all accumulated
uncommitted provider, budget, workspace, frontend, deployment-template and test
changes. User authorized review, fixes and pushing dev; main and production
deployment are outside this delivery. Repository remains private.

## Confirmed findings fixed

| Finding | Fix and regression evidence |
| --- | --- |
| Invalid explicit time windows raised an unhandled error during chat preparation. | Return an actionable clarification without creating a query or dispatching. `test_chat_admission.py` covers reversed and out-of-duration ranges. |
| Shared-ledger outages could raise HTTP500 in readiness/preparation and mask why sending failed. | Report unavailable capacity without inventing balances; preserve input and fail closed. Admission tests cover both endpoints and zero dispatch. |
| A card's suggested followup could use the currently selected unrelated turn. | Select the suggestion's originating turn only after successful draft fill; preserve an existing draft and its context. Frontend state regression covers both paths. |
| Narrow-window inspector visibility was restored using the desktop-only class. | Snapshot actual visibility and normalize both responsive classes when restoring. Frontend state tests cover narrow and wide layouts. |
| Completed indexing left source-picker and budget readiness labels stale. | Refresh both after the owned terminal watcher transition. Persistence regression verifies guarded updates. |
| Admission reserved repair requests even when the shared route disables repairs. | Exclude disabled repair calls and cost in ingest and ordinary query admission. Shared-ledger tests cover enabled/disabled policies; default behavior is preserved. |

Budget, frontend and provider slices received separate reviews, followed by a
fresh read-only adversarial pass over all six fixes. That final pass found no
remaining actionable issue in those fixes. All reviewers used the same Codex
harness; an independent cross-model outside review was not available, so this
is not a claim of completing that external gate.

## Verification

- `uv run --frozen pytest -q`: **239 passed**.
- `npm test`: **130 passed**.
- `npm run build`, `make check`, `git diff --check`: passed.
- Restarted the existing single-process local real-mode service. Browser reload
  restored the basketball investigation's seven visible cards, original draft,
  saved state and ready player at approximately 326 seconds. No Send action.
- Read-only readiness check confirmed both original ledger scopes remain active,
  with **39/40 requests** and **2,284,047/20,000,000 USD_MICRO occupied**. This is
  conservative ledger occupancy, not a reconciliation of the provider invoice.
  No model dispatch, retry, budget reset, approval installation or extra resource.
- Private browser evidence stays outside Git at
  `.frameseek/code-review-20261025/local-restored.png`.

Live answer quality remains limited: prior extra shot-clock numbers were wrong;
whole-video player statistics are unsupported. The latest single-call local
route is regression-tested with mocks and saved responses, not newly paid-live
revalidated. One request is deliberately left for the user. No claim of zero
bugs or general production/model-quality acceptance is made. Private runtime,
keys, ledger databases, uploaded video and chat storage are excluded from delivery.
