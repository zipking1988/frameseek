# Initial repository code review — 2026-10-04

Scope: the full initial import, because the workspace had no Git history or remote. The maintainer authorized review, defect fixes, a new private repository and a push to main. Historical screenshots/source backups are provenance, not current production code.

## Review and fixes

The core pass reviewed production Python, authored JavaScript/React, build scripts and contracts. Independent native specialists covered security/ownership, API/data/validation/testing, and frontend performance/design/simplification. Supported defects were fixed with regressions:

- Worker lifecycle: deleting or cancelling before worker entry always releases capacity. Dispatch captures generation; cancellation cannot let an old worker publish into a new generation. Restarted queued jobs become interrupted rather than remaining pending forever or replaying.
- Snapshot input: non-list records/pins return 422 instead of an unhandled server error.
- Model trust boundary: malformed chat envelopes, captions, embedding indices/dimensions, rerank output, observations, synthesis and ASR words become controlled errors. Invalid synthesis retains already verified partial evidence.
- Resume admission: completed cached ingest work is not counted against remaining budget again. Zero-new-call resumes still require active approvals. Unknown/dispatched work and missing completed-result caches do not resend.
- Generation isolation: frozen configuration/checkpoints and coarse frame names are generation-specific. Changed coarse sampling cannot silently reuse old-generation artifacts or overwrite old evidence timestamps.
- Request identifiers: the maximum accepted request ID produces bounded zoom frame identifiers compatible with the answer schema.
- Source deletion: cancel the active request before tombstoning its source; failed deletion preserves the active investigation and future saves.
- Frontend ownership: navigation, recovery, source watchers and query responses check investigation identity/epoch after awaits; latest source selection wins. Busy state and answers cannot cross into another desk.
- Recovery: recover only the newest 12 completed results, preserve existing turn/finding IDs, restore the submitted parent, and persist newly recovered results immediately. Pending request identity remains available for recovery/cancellation.
- Input/context: capture question ancestry at submission and preserve edits typed while awaiting a reply. Recovery preserves drafts.
- Save/navigation: drain edits made during an in-flight save before allowing navigation to restore another investigation.
- Retry UI: failed/cancelled preflight has an explicit fixture-safe retry; indexed cancellation uses budget-gated analysis. Reopening a processing source resumes status watching.

## Verification

- `make test`: 109 backend tests passed.
- `make check`: Ruff lint/format and contract export checks passed.
- `npm test`: 71 frontend tests passed (24 new persistence regressions).
- `npm run build`: passed; authored asset content hashes rebuilt.
- JavaScript syntax and Git whitespace checks passed.
- Browser reload restored the existing six-question, three-finding investigation and note; screenshot in `code-review-20261004/preview.png`.
- Local health remains fixture mode: zero model requests and zero GPU resources started.
- Pre-push tracked-file scan found no common credential signatures, private runtime databases/configuration, or files above GitHub's 100 MiB limit. Session databases/uploads, .env, .venv and node_modules remain ignored.

Logs and browser proof are in `docs/code-review-20261004/`. Regression additions are in `tests/test_agent.py`, `tests/test_workspace.py` and `tests/workspace_persistence.test.cjs`.

## Coverage limits and plan completion

This review used independent native passes in the same Codex harness; it is not a cross-model review. Outside-model review is unavailable under this host and no nested provider process was started. Automated design detection was ready but refused the unborn repository's missing base; manual design review completed. The fresh adversarial pass reviewed tests/demo fixtures in summary mode; it also read production `fixtures.py` contract samples in a bulk production-source read, which is disclosed rather than represented as summary-only coverage.

The final fresh native adversarial pass completed without edits: **NO_FINDINGS — no remaining substantiated P1/P2 defects**. It reread the final full persistence implementation after the navigation fix. This initial-import workflow cannot claim a normal base-branch PR review binding. There is no PR or public deployment.

Local workspace functionality and mocked NVIDIA/Nebius integration are implemented. Live model/revision/permission calibration, finite approved numeric budgets, provider resource cutoff proof, real multimodal quality/evaluation, hour-long performance, Linux isolation and deployed HTTPS/backups remain unverified. They retain their existing requirements in ARCHITECTURE and the implementation plan; this private code push is not complete-MVP or GO acceptance.
