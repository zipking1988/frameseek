# Deployment preparation

2026-10-24: the current requested deployment is **Nebius AI Cloud CPU hosting at
framefix.net**, with Token Factory inference. See [Nebius cost/quota findings and
deployment templates](NEBIUS_DEPLOYMENT.md). No cloud resources or DNS changes
have been made. The Google Cloud route below is separate historical preparation.

## Google Cloud deployment preparation

Prepared 2026-10-11; **not deployed**. The user has no GCP setup yet and explicitly
requested no GCP startup. No project, billing link, API enablement, secret, image
push, VM, disk, network, Cloud Run service or model call has been created.
The files below are inert preparation, not spending approval.

## Preserve the existing workspace runtime

The current workspace has one API/worker process, local private source files and
SQLite WAL databases for sessions, investigations and the approved attempt
ledger. Running this component on Cloud Run's ephemeral filesystem would lose
ownership and financial state. Cloud Run autoscaling or overlapping revisions
would also split that state. Limiting replicas to one does not provide durable
storage or prevent overlapping rollout instances. NFS/GCS mounts are not a safe
drop-in SQLite WAL backend: Cloud Run NFS mounts have no locking, and SQLite WAL
requires same-host shared memory.

Preparation therefore keeps the workspace unchanged behind a stateless ingress:

```text
Browser ─HTTPS─> Cloud Run gateway ─HTTPS + private shared token─>
  one Google Compute Engine backend ─> local persistent disk + isolated decoder
                                  └─> Google Gemini API (approved calls only)
```

This is a proposed GCP topology, not deployed-platform or competition eligibility
proof. The prototype is served through Cloud Run and its workload remains on
Google Cloud. Verify the event's acceptance of this split topology before
submission; do not claim a fully serverless workspace. A future Cloud Run-only
backend would require a separate durable database/media/worker migration with
equivalent CAS, ownership, generation and atomic budget behavior.

## Prepared files

- [Dockerfile](../Dockerfile): Python 3.13, frozen `uv.lock`, committed frontend,
  FFmpeg/ffprobe and bubblewrap, nonroot UID 10001; no Node or GPU requirement.
  Workspace startup requires an explicit `FS_DATA_DIR` volume mount by default
  (`FS_REQUIRE_DATA_MOUNT=1`); a mounted volume still needs durability validation.
- [.dockerignore](../.dockerignore): an allowlist excluding private media,
  databases, credentials, approval records, evaluation data and unrelated drafts.
- `frameseek.server`: binds `0.0.0.0:$PORT`, defaults to workspace and fixture,
  always runs one Uvicorn process. Workspace startup refuses Cloud Run's
  `K_SERVICE` before opening storage, even when invoked directly via the factory.
- `frameseek.gateway`: streams HTTP without copying storage or starting workers,
  follows no redirects and has no retry/model/cloud SDK path.
- [gateway.service.example.yaml](../deploy/gcp/gateway.service.example.yaml):
  Cloud Run ingress template with placeholder image/origins/secret. Its replica,
  memory and CPU values are review candidates, not approved cloud spending.

The local Docker daemon was unavailable during preparation. Container image
build, Linux decoder execution and cloud TLS/network behavior are not verified.
The local Python/ASGI tests exercise the gateway and real workspace together.

## Configuration boundaries

| Component | Required configuration |
| --- | --- |
| Gateway | `FS_COMPONENT=gateway`, `FS_PUBLIC_ORIGIN`, `FS_BACKEND_ORIGIN`, private `FS_GATEWAY_TOKEN`, `PORT` |
| Workspace | `FS_COMPONENT=workspace`, same `FS_PUBLIC_ORIGIN` and private `FS_GATEWAY_TOKEN`, persistent `FS_DATA_DIR`, trusted `FS_RUNTIME_FILE`, backend-only `GEMINI_API_KEY`, `FRAMESEEK_MODE=real` only after prerequisites |

Both origins must be exact HTTPS origins without credentials, path, query or
fragment. They must differ. The shared token must be 32–256 printable ASCII
characters, generated privately later, never copied into this repository.
Store it using a reviewed secret mechanism. It grants ingress access, not media
ownership or model spending; the backend still requires the browser's private
session cookie, CSRF and public-Origin checks.

The gateway discards client-supplied forwarding metadata and gateway tokens,
sets the canonical public Host and injects its private token. It preserves
Range requests, status codes, cookie headers, cache headers, request bodies and
streamed bytes. Backend cookies are Secure whenever a public HTTPS origin is
configured. No public-origin rewriting can bypass the existing CSRF/ownership
checks. With `FS_GATEWAY_TOKEN` configured, all direct backend requests require
the token; an unavailable backend produces an explicit 502.

The gateway limits request bodies to **30 MiB** because its Uvicorn HTTP/1 server
is subject to Cloud Run's 32 MiB HTTP/1 request limit. Oversized declared or
streamed bodies return `gateway_upload_limit_30_mib`; they are never silently
truncated. The original direct local workspace's 500 MiB limit remains intact.
The first cloud prototype should use short files below 30 MiB. Do not raise this
limit without an independently tested larger-upload transport.

## Before any future deployment

1. Obtain explicit authorization for a GCP project, region, resource configuration,
   finite total spending and shutdown policy. Separately approve Gemini calls and
   calibration. Cloud billing alerts are not hard spending cutoffs.
2. Build/review the image and dependencies locally, then select an immutable image
   digest. Provision/push only when separately authorized.
3. Prepare one GCP Linux backend with a persistent local block filesystem (not
   GCS/NFS), appropriate private ownership/permissions and one service process.
   Stop the old workspace before replacement; never run rolling replicas against
   the same SQLite workspace. Back up using a consistent SQLite backup method.
4. Verify bubblewrap namespace/file/network isolation on that exact Linux host
   and container policy. Do not disable decoder isolation or add privileged
   container mode to make a smoke pass. Reject uploads if isolation is unavailable.
5. Terminate backend HTTPS with a valid reviewed certificate, preserve the
   gateway's canonical Host and restrict ingress/network access. The shared token
   does not replace TLS, firewall controls or session ownership. Keep the Gemini
   key and runtime/approval files solely on the durable backend.
6. Validate media deletion/expiry, cookie/CSRF/Origin, CAS, cancellation, database
   restart, unknown-attempt reconciliation and backup restoration on the backend.
7. Configure the public Cloud Run ingress and secret reference only after the
   backend passes. Test forwarding, spoofed headers, uploads, ranges, session
   persistence across gateway restarts and free authorized judge access.
8. Run the authorized real-video smoke in [AI_BUILDER_CUP.md](AI_BUILDER_CUP.md),
   retain billing/quality proof and verify the event's deployment requirements.

Rollback keeps the same durable backend/ledger and stops the replacement before
restoring a reviewed version. A gateway rollback never resets or refunds model
attempts. Revoke approvals to prevent subsequent model dispatch; independently
stop/delete cloud resources under the authorized shutdown plan to stop hosting
costs. Application timeout/cancellation cannot prove supplier-side stopped billing.

No deploy script or CI auto-deployment has been installed. At present there is no
deployed live URL and no live Gemini acceptance result.

## Primary references

- [Cloud Run container filesystem/lifecycle](https://cloud.google.com/run/docs/container-contract)
- [Cloud Run NFS locking limitation](https://cloud.google.com/run/docs/configuring/services/nfs-volume-mounts)
- [Cloud Run request/response limits](https://cloud.google.com/run/quotas)
- [SQLite WAL same-host requirement](https://www.sqlite.org/wal.html)
