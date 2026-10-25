# Historical GPU smoke proposal — superseded for the local test

2026-10-24: The user selected Token Factory Nemotron 3.5 Super VL and prohibited GPU rental. Follow [Token Factory local preparation](TOKEN_FACTORY_LOCAL.md). All GPU allocations below are historical, unapproved proposals.

Checked 2026-10-24 (Asia/Tokyo). No resources created, approvals installed,
model requests sent, or live deployment verified by this preparation.

## Latest user constraint and smaller-model candidate

The user subsequently requested a smaller NVIDIA model and explicitly ruled out
personal spending: use only their reported USD 125 credits, preserving access
through the announced results date (2027-01-11 12:00 PT, or 2027-01-12 05:00 JST).
The USD 10 envelope below was never approved. It is historical proposal only.
The credit balance, product eligibility, expiry and overage behavior are not
verified. GPU quota is not credit. Do not provision based on quota availability.

For a first functional test, evaluate `nvidia/Cosmos-Reason2-2B` before Omni.
NVIDIA lists 24 GB minimum GPU memory; Reason2-8B lists 32 GB and is a fallback
candidate if 2B fails. Reason2 has been superseded by Cosmos 3, but retains
documented vLLM serving instructions. Hugging Face model access requires user
license/account acceptance. Basketball accuracy, Chinese captions, strict JSON,
and FrameSeek's timestamped multi-image input remain untested. Dense review can
send up to 128 images: the documented 8k–16k context examples must not be assumed
to accommodate this. Bounded sampling/window adaptation requires validation.

L40S Intel at 8 vCPU / 32 GiB costs $1.5484/hour on demand, before storage/tax.
A smaller model does not reduce this hourly rent; it may reduce execution time.
At that rate USD 125 covers only about 80.7 compute hours, not continuous hosting
until January. This calculation assumes credits actually cover AI Cloud.
Prefer short scheduled test sessions, local evidence storage and removal of
disposable disks. Availability of a judging endpoint must be checked against
competition requirements before selecting an offline-only submission.

The competition FAQ describes the published promotional credits as Token
Factory credits, while a separate organizer forum reply discusses Cloud credits
requiring a USD 25 top-up. These do not establish what the user's USD 125 covers.
Clarify the actual account grant before selecting a paid deployment route.
Do not assume AI Cloud credits pay for Token Factory, or vice versa.

- [Reason2-2B model card](https://huggingface.co/nvidia/Cosmos-Reason2-2B)
- [Reason2-8B model card](https://huggingface.co/nvidia/Cosmos-Reason2-8B)
- [Reason2 serving guide](https://github.com/nvidia-cosmos/cosmos-reason2)
- [Competition credit FAQ](https://nebiusglobalaihackathon.devpost.com/details/faqs)
- [Organizer Cloud-credit reply](https://nebiusglobalaihackathon.devpost.com/forum_topics/45232-nebius-serverless)

## Proposed allocation

Use one on-demand `gpu-rtx6000-a`, preset `1gpu-24vcpu-218gb`, in the existing
`default-project-eu-south1` project: 96 GB GPU memory, 24 vCPUs, 218 GiB host RAM.
Keep the desktop application, single API/worker process, SQLite and original
video on the Mac for this first test. Connect to authenticated model services
over SSH loopback tunnels; do not expose inference ports publicly. Preserve the
existing default CLI project; use explicit project IDs for future operations.

The recommendation is an engineering inference from the vendor's FP8 hardware
guidance and current cost/capacity, not a measured FrameSeek benchmark.

## Read-only quota and capacity results

Nebius CLI 0.12.294, active profile `frameseek`. Queried project platform lists,
project and tenant quota allowances, and tenant resource advice.
Capacity observations were marked fresh, effective 2026-10-24 10:40 UTC.

| Candidate | Region | Tenant GPU limit / usage | On-demand single-GPU advice |
| --- | --- | --- | --- |
| RTX PRO 6000 | eu-south1 | 32 / unused | 32 available; high |
| L40S Intel or AMD | eu-north1 | 32 / unused (shared GPU type quota) | 6 per returned preset; low |
| H100 | eu-north1 | 32 / unused | 32 per returned fabric; high |
| H200 | eu-north1 | 32 / unused | 22; medium |

Do not add availability numbers across presets or fabrics. They may describe
shared capacity. Project responses contain no explicit numeric GPU override;
the tenant allowances and capacity advice supply the usable planning evidence.
This is not a capacity reservation or a successful allocation test.
For eu-south1, tenant allowances also show 12 VMs, 5 TiB network SSD and 3 public
IPv4 addresses, all reported unused. Recheck immediately before provisioning.

## Price comparison

Public USD on-demand prices, excluding taxes and other model services:

| Candidate preset | Compute per hour | Two compute hours |
| --- | ---: | ---: |
| RTX PRO 6000, 24 vCPU / 218 GiB | $1.80 | $3.60 |
| L40S Intel, 8 vCPU / 32 GiB | $1.5484 | $3.0968 |
| L40S AMD, 16 vCPU / 96 GiB | $1.8172 | $3.6344 |
| H100, 16 vCPU / 200 GiB | $4.50 | $9.00 |
| H200, 16 vCPU / 200 GiB | $5.40 | $10.80 |

L40S includes separately priced host CPU/RAM. For example AMD is
`1.35 + 16*0.01 + 96*0.0032` USD/hour.
A proposed 200 GiB network SSD adds `200*0.071/730`, approximately $0.01945/hour
or $14.20 per 730 hours if retained. Two hours of RTX plus this disk is about
$3.64 before taxes and text inference. Downloads, boot, idle time and failures
consume the runtime allowance too. This is not an all-in quote or a cost cap.
No account-specific credits, discounts, tax rate or Token Factory entitlement
have been verified. Avoid preemptible instances for the first integration test;
their interruption and variable pricing complicate calibration.

## Build sequence and unresolved gates

1. Prepare a GPU host with NVIDIA drivers and a compatible container runtime.
   Pin the OS image and inference container digest before launch. NVIDIA's
   current Omni card requires vLLM 0.20.0 and gives an RTX-specific
   `--moe-backend triton` workaround.
2. Serve `nvidia/Nemotron-3-Nano-Omni-30B-A3B-Reasoning-FP8` at a pinned model
   revision. Begin with concurrency one and bounded context/media input.
   Validate image-array requests, JSON output and peak VRAM through the existing
   FrameSeek adapter. Do not copy the vendor's unrestricted local-media path or
   high-concurrency example into this deployment.
3. Resolve and pin the NVIDIA embedding and reranking models and their matching
   `/embeddings` and `/rerank` services. Measure whether all three services fit
   on this GPU; do not assume co-residency or silently allocate a second GPU.
4. Verify the configured Nemotron text model, permissions, prices and separate
   backend credential in Nebius Token Factory. CLI federation login is not proof
   of a usable Token Factory API key. Only text goes to Token Factory.
5. Prepare a supplier API stop/delete procedure with an independent deadline
   controller and evidence of bounded release. Guest shutdown is insufficient:
   the instance recovery policy can restart it. Stop/delete through the Nebius
   API and reconcile final state; disks remain billable until deleted.
   A laptop timer, application timeout or billing alert is not a hard cost cap.
6. Obtain explicit finite calibration and execution authorization before any
   paid allocation. Proposed review envelope: USD 10 total including startup,
   calibration, idle, model calls, storage, taxes and release; at most one GPU,
   two hours from allocation, 10 primary and 40 total model calls, valid for 24
   hours from approval. These are proposed ceilings, not installed approvals.
   Unknown pricing, unverified release bounds or exhausted limits block launch.
7. After approved calibration establishes conservative bounds, create private
   runtime configuration and owner/deployment ledger approvals according to
   [WORKSPACE_RUNTIME.md](WORKSPACE_RUNTIME.md). No placeholder calibration
   reference or artificial expiry extension is valid proof.
8. Upload an authorized local copy of the 384-second test video. First verify a
   short visual sample, then index the full clip using actual scene windows,
   no more than 120 seconds each and five-second overlap. Test timestamped
   follow-ups, cancellation and partial results. ASR remains disabled for this
   first visual test. Do not claim verified player identities from appearance.
9. Export evidence, revoke test approvals, stop/delete the test allocation and
   delete its disposable disk after needed artifacts are copied. Confirm
   supplier state and billing. Unknown release status blocks further dispatch.

No runnable provisioning script is included yet: exact image/model revisions,
embedding/rerank deployments, Token Factory access, and cutoff calibration still
need resolution. This document starts deployment preparation without presenting
an untested VM as a ready chat backend. Existing Gemini/GCP preparation is
unchanged; this test does not require moving the durable workspace to Linux.

## Sources

- [Nebius public pricing](https://nebius.com/prices)
- [Detailed compute/storage pricing and stopped-VM billing](https://docs.nebius.com/compute/resources/pricing)
- [NVIDIA Omni model card and serving instructions](https://huggingface.co/nvidia/Nemotron-3-Nano-Omni-30B-A3B-Reasoning-BF16)
- [Nebius instance recovery semantics](https://github.com/nebius/api/blob/main/nebius/compute/v1/instance.proto)
- [FrameSeek runtime requirements](WORKSPACE_RUNTIME.md)
- [FrameSeek architecture](../ARCHITECTURE.md)
