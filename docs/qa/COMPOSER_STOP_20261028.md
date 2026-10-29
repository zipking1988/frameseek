# Composer stop control — 2026-10-28

The reported grey send button was observed during a real local index query.
The task later completed and cleared its submitted draft normally. The UI had
no stop control: busy state disabled sending for the entire local scan, making
normal processing look like an inert composer.

Added a visible “停止处理” button while an async request is active. It uses the
existing owned cancellation endpoint, preserves the current draft and restores
sending after cancellation. Submission identity guards prevent an old poll or
finally block from publishing a late answer, overwriting a notice or unlocking
a newer query. Cancellation failure leaves an explicit retryable stop control.

Free local cancellation interrupts its own loading/running MLX worker and releases
capacity when that worker exits. The callback registry is keyed by owned desk and
request, with cleanup before capacity is released. Explicitly cancelled local work
clears only markers created during that job; older unknown markers and completed
receipts remain. Paid requests, unknown paid reservations and approvals are not
modified or automatically retried.

Actual page test used a separate named QA investigation on the existing basketball
source. Sending showed the stop button. Editing a next draft and clicking stop
preserved that exact draft, set aria-busy=false, hid stop and enabled send. A
subsequent local request was accepted and completed with “球衣为蓝色”, citing
05:09. Another in-flight request was stopped successfully. The original NBA desk
was restored with21 visible cards, its original empty draft and local engine.
No source, original chat or draft was deleted. No paid model calls occurred.

326 backend tests and144 frontend regressions passed; focused local/cloud tests
also passed after covering cancellation during model initialization. Frontend
build, lint/format, schema drift and whitespace checks passed. Private screenshots:
`.frameseek/composer-stop-20261028/processing.png` and `stopped.png`.
This is a local fix; it has not been deployed or pushed automatically.
