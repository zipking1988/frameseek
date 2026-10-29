# Automatic question routing — local 2026-10-28

The composer defaults to Auto. Manual index/local/cloud/model choices are inside
More question tools → Advanced settings. Selecting an override is explicit and
never grants spending. No model configuration or approval is installed by this UI.

`POST /api/auto-chat/prepare` uses ChatInput and existing session, CSRF/origin,
owned source, desk generation and parent-request validation. It is read-only:
no query publication, inference, attempt reservation or remote model request.
A reused request ID is stopped and referred to recovery, not routed to another
provider. Source/context generation and foreign-video checks remain enforced.

Policy:
1. Explicit audio questions go to the existing model/audio readiness checks;
   local pictures do not substitute for an unavailable audio channel.
2. Use index chat only for a completely parsed structured occurrence result with
   complete source-frame review and exhaustive-under-index coverage. Event/ranking
   requests additionally need exact-under-index / complete ranking association.
   Sparse captions, similar images, missing observations and clarification results
   cannot qualify. These are index coverage conditions, not a new claim of perfect
   underlying visual recognition.
3. Otherwise prefer the configured free local visual runtime. If unavailable,
   choose the configured cloud compiler and run its existing read-only full-budget
   admission. With neither, use ordinary model readiness/admission.
4. Frontend dispatches to exactly the selected existing endpoint using the original
   question, request ID, owned desk/generation and captured context. Each endpoint
   retains its own execution-time checks, atomic ledger and idempotency. There is
   no failed-call fallback cascade or automatic model resend. Pending status polls
   keep their original route and ID. Navigation invalidates delayed plan results.

The policy is deterministic source-evidence/capability routing, not an extra paid
LLM planner call. Scope is current capabilities; it does not add a missing event
recognizer, guarantee arbitrary-question answers or remove financial limits.

## Verification

- 350 backend tests passed before the final model-parent follow-up fix; the6
  affected routing/index tests passed again afterward; focused routing integration also verifies cross-owner
  denial, CSRF, stale desk generation, no prepare-side query writes, existing-ID
  recovery and cloud budget refusal without provider dispatch.
- 155 frontend tests pass, including single-route dispatch, no paid fallback after
  budget refusal and ignoring a plan received after navigation. Build and lint,
  formatting/schema drift and whitespace checks pass.
- Actual browser: original local desk defaults Auto; manual choices are reachable
  only in Advanced settings; original question25 quote and empty draft restored.
- Isolated localhost:8772 synthetic test workspace: sent a white-jersey question
  in Auto; returned3 annotated occurrence intervals via index with0 model calls.
  An unsupported visual question stayed in the input after fixture runtime
  rejection; the first answer remained intact. This proves routing/UI behavior
  on test annotations, not live model quality. Temporary fixture service stopped.
- Original source/query/attempt/budget/settlement row fingerprints are unchanged
  across restart and page inspection. Existing single API service restarted
  with the same fixture/local-vision settings; private data and runtime files were
  not replaced. No actual local or cloud model inference was executed this task.

Private evidence: `.frameseek/auto-route-20261028/`. This increment is local only;
no framefix.net deployment, commit or push was performed.
