# FrameSeek on Nebius CPU — framefix.net

**2026-10-24 update:** The user subsequently authorized starting an initial month
without waiting for the support reply. The CPU VM now serves the fixture app at
https://framefix.net with valid TLS. See [live status](NEBIUS_LIVE_STATUS.md). The
preparation findings below remain historical checks, not proof of gift expiry or
card-charge protection.

Prepared 2026-10-24 (Asia/Tokyo). **Not deployed. No paid resources, DNS changes,
quota requests or additional model calls were made. A support request was later
submitted with explicit user authorization; see the support record below.** This is
the current NVIDIA/Nebius deployment route; the separate Google Cloud preparation
remains inactive. The existing local USD1/30-request approval is not a hosting
budget or a public deployment approval.

## Verified account and cost findings

Read-only CLI and the signed-in console agree:

| Region | Non-GPU vCPU quota / used | Small CPU platforms |
| --- | --- | --- |
| eu-west2 (existing selected project) | 200 / 0 | cpu-d3, minimum 2 vCPU / 8 GiB |
| eu-west1, eu-south1, me-west1, uk-south1, uk-south2, us-north1 | 200 / 0 each | Not individually priced/configured here |
| eu-north1 | 0 / 0 | cpu-e2 and cpu-d3, minimum 2 vCPU / 8 GiB |
| eu-north2, us-central1 | 0 / 0 each | Not selected |

eu-west2 also has unused quota for 12 VMs, 32 disks, 5 TiB Network SSD and
3 public IPv4 addresses. Its VM and disk lists returned empty. Quota is not a
capacity reservation or a deployment guarantee.

AI Cloud transactions show a $125 balance: **$100 “Credits for Devpost hackathon
participants” adjustment on September 27, plus $25 card payment**. The latter is
user-funded cash, not a gift. Do not assume all $125 is promotional, or that the
separate Token Factory balance can fund Compute.

**Grant expiry is unverified.** The transaction view has no expiry field; the
public promo documentation explains redemption expiry, not this grant's spending
expiry. The relevant connected emails did not supply an expiry for this grant.
The current event FAQ describes Token Factory promotions, not the account's
specific AI Cloud adjustment. Neither “90 days” nor “never expires” is established.
The ordering of grant versus cash consumption also needs written confirmation.

Prices effective October 1 were cross-checked against the console price list:

| Proposed resource | Calculation | Cost |
| --- | --- | --- |
| cpu-d3 2 vCPU / 8 GiB | 2 × $0.015 + 8 × $0.0045 | $0.066/hour |
| 20 GiB boot + 20 GiB workspace Network SSD | 40 × $0.071 | $2.84/730 hours |
| One public IPv4 | Console eu-west2 IP-hour row | $0/hour currently |
| Virtual Networks | Official current service pricing | Free currently |
| Combined compute + disks | $0.066 + $2.84/730 | $0.06989041/hour |

No load balancer, managed database, registry, snapshot service or GPU is proposed.
Network pricing must be rechecked at launch; this estimate does not use Object
Storage pricing as a proxy for VM traffic. Rates exclude tax and can change.

For a planning start of **2026-10-25 00:00 JST**:

| End | Hours | CPU + RAM | 40 GiB disks | Total before tax |
| --- | ---: | ---: | ---: | ---: |
| Judging ends: Dec 16, 2026 05:00 JST | 1,253 | $82.70 | $4.87 | **$87.57** |
| Announced: Jan 12, 2027 05:00 JST | 1,901 | $125.47 | $7.40 | **$132.86** |

The event rules put judging end at Dec 15 noon PT and announcement on/about
Jan 11 noon PT. The user's requested January availability is longer than the
published required testing period. Do not silently shorten that goal. Starting
after submission solely to save money would leave the required working link
unavailable; it is not a complete submission plan.

**$100 does not cover continuous hosting through announcement at these rates.**
Even the full $125 would be short for this proposal. The cheaper eu-north1 Intel
option would be $121.46 including the same disks over 1,901 hours, still above
the gift-only $100 and currently blocked by zero CPU quota. A smaller platform
than 2/8 was not listed. Staying through judging fits arithmetically within $100
before tax, but remains conditional on credit validity, drawdown order, extra
costs and explicit hosting authorization. A grant extension alone does not solve
the January amount shortfall; additional gift credit or an approved shorter
availability plan would be needed. No such change is approved here.

Budgets send alerts, not hard cutoffs. The provider may charge the linked card
on its billing schedule/threshold. Stopping the app or even the VM does not stop
disk charges. Before launch, define a finite total cap, conservative stop margin,
provider-side stop verification and authorized disk/backup disposition. Do not
install an application-only timer and claim it guarantees zero card charges.

## Prepared configuration

```text
https://framefix.net
    -> Nginx TLS on one Nebius CPU VM
    -> 127.0.0.1:8765, one Uvicorn workspace/worker
    -> /srv/frameseek/workspace on a mounted persistent block disk
    -> Token Factory (only after separately authorized live setup)
```

- [plan.json](../deploy/nebius/plan.json): reviewable resource shape and unresolved
  spending/expiry fields. It is **not** a provider creation payload.
- [frameseek.service](../deploy/nebius/frameseek.service): native Linux systemd
  service, one process, loopback only, unprivileged account, required data mount,
  private permissions, bounded memory/tasks. It will not start without an
  operator-created `/etc/frameseek/deployment-reviewed` marker.
- [workspace.env.example](../deploy/nebius/workspace.env.example): exact public
  origin `https://framefix.net`, fixture initially, no key/runtime/approval.
- [nginx.conf.example](../deploy/nebius/nginx.conf.example): TLS, fixed Host,
  no proxy retries/cache, streaming upload/range passthrough, 500 MiB upload cap.
  It exposes no private-file directory. Nginx terminates TLS on the same host;
  the unrelated GCP gateway and its 30 MiB limit are not used.
- [dns-records.example.csv](../deploy/nebius/dns-records.example.csv): pending apex
  A-record replacement. DNS is currently on `01..04.dnsv.jp`; apex A resolves to
  `216.150.1.1`. No AAAA or CAA answer was observed. No DNS change was applied.

Only public TCP 80/443 and SSH from a reviewed administrator IP are proposed.
Do not open 8765. Keep nameservers/MX/TXT unchanged. Once a static IP and the
host pass review, replace the apex A record with that IP; do not leave both old
and new addresses. If an AAAA record is later present, resolve it deliberately
before enabling HTTPS. No `www` alias is required by this template.

## Installation sequence for a later authorized deployment

Local preparation now includes two executable workflows:

```sh
mkdir -p dist
python3 deploy/nebius/package_release.py dist/frameseek-nebius.tar.gz
# On the separately approved Linux VM, after the manual prerequisites below:
bash deploy/nebius/install_service.sh --check
bash deploy/nebius/install_service.sh --install
```

The archive uses explicit application/configuration roots and includes a SHA-256
manifest. It excludes local environments, media, SQLite databases and runtime
approvals; it is private and is not uploaded by the command. Review its contents
before any transfer. Existing output files are never overwritten. The installer
requires the review marker, dedicated mounted data disk, service account, Python
3.13 environment and host tools. It refuses to replace an existing environment or
unit. Installation only copies the fixture environment and service unit and reloads
systemd; it does not provision resources, configure DNS/TLS, start/enable the
service, install a key or approve model spending. Host checks do not establish
decoder isolation or full deployment acceptance.

1. Resolve the gift-credit and hosting authorization blockers above. Choose an
   official supported Linux image and exact project/subnet/SSH key. No cloud-init
   or Terraform apply is supplied that could accidentally create resources.
2. On the separately approved VM, use Python 3.13, committed `uv.lock`, FFmpeg,
   ffprobe, bubblewrap, Nginx and a reviewed ACME client. Install the private
   reviewed release at `/opt/frameseek`; run `uv sync --frozen --no-dev` there.
   The server needs no Node build when using the committed static bundle.
3. Create the unprivileged `frameseek` account. Mount the dedicated 20 GiB ext4
   workspace disk by UUID at `/srv/frameseek`, with mount failure blocking startup.
   Create its `workspace` subdirectory owned by frameseek with mode 0700. Keep the
   code read-only to this account. Install the environment file as root-owned
   mode 0600, and the unit without enabling it yet.
4. Validate bubblewrap with the actual systemd policy and hostile/real media.
   It must retain file and network isolation. Do not disable isolation, enable
   privileged containers or globally weaken namespace policy to pass a smoke.
   Native deployment avoids assuming nested Docker namespaces work.
5. For TLS bootstrap, temporarily install only the two HTTP server blocks and
   serve ACME files from `/var/www/acme`. Obtain a valid certificate after the
   authorized DNS cutover; then install the full Nginx configuration and validate
   with `nginx -t`. Configure certificate renewal and Nginx reload. Never deploy
   the temporary validation certificate used in local syntax tests.
6. Verify Secure/HttpOnly cookies, same-origin/CSRF, cross-owner denials, HTTP
   Range/206 playback, upload limits, cancellation, process restart and SQLite
   backup restoration. Stop the old process before each replacement; never run
   overlapping workers against the workspace. Keep backup expiry/deletion rules.
7. Fixture is a transport/UI check, **not** a real basketball chat submission.
   Enabling real mode requires a fresh reviewed Token Factory runtime with fixed
   bounds and explicit host/owner/deployment budget handling. Keep the key only
   in `/etc/frameseek/secrets.env`, not in Nginx, frontend or repository.

Local test authorization is not automatically portable: copying its ledger while
leaving localhost active could duplicate available spending. Browser owner cookies
also do not transfer from localhost to framefix.net. Do not reset the ledger,
create blanket visitor approvals or re-index paid media without an explicit
migration and remaining-budget decision.

Source TTL remains 24 hours (maximum supported 168). Hosting until January does
not keep today's basketball source or its private browser session alive until
January. Judge access, demo-source retention/re-upload and finite model budget
must be resolved before claiming an always-available working demo. No TTL bypass
or automatic paid refresh is installed by these templates.

## Support request — submitted 2026-10-24

With explicit user authorization, submitted private billing ticket
[M297448313](https://console.nebius.com/support/issues/M297448313), status Open.
Requested an additional $50 (gift total $150), grant validity through at least
January 12, 2027 23:59 JST (January 31 buffer requested), gift-first drawdown,
and a gift-only billing block preventing cash/card charges. No paid commitment
or provisioning was authorized. No approval or billing protection is confirmed
until Nebius replies.

The earlier planning question, expanded in the submitted ticket, was:

> My AI Cloud balance contains a $100 adjustment described as “Credits for Devpost
> hackathon participants”, credited September 27, 2026, and a separate $25 card
> payment. What is the exact expiry timestamp of that $100 adjustment? Is the
> promotional balance consumed before the $25 cash balance? Can the gift cover
> CPU VMs, persistent disks and applicable taxes? Is a gift-only hard spending
> limit available that prevents card charges? I need availability through January
> 11, 2027 at 20:00 UTC; can the grant be extended and supplemented to cover it?

The submitted ticket is visible only to the requester within the tenant (and
Nebius support). Screenshot evidence is kept in ignored private local storage.
No blanket email notification subscription was enabled.

## Sources and verification limits

- Signed-in AI Cloud transactions, Pricing and Limits, checked 2026-10-24;
  read-only `quotas quota-allowance list`, `compute platform list`, `compute
  instance list`, `compute disk list`.
- [Compute prices](https://docs.nebius.com/compute/resources/pricing)
- [Network prices](https://docs.nebius.com/vpc/resources/pricing)
- [Promo redemption](https://docs.nebius.com/signup-billing/payments/promo-codes)
- [Billing threshold](https://docs.nebius.com/signup-billing/payments/threshold)
- [Budgets](https://docs.nebius.com/signup-billing/budgets)
- [Taxes](https://docs.nebius.com/signup-billing/payments/taxes)
- [Event rules](https://nebiusglobalaihackathon.devpost.com/rules)
- [Event FAQ](https://nebiusglobalaihackathon.devpost.com/details/faqs)

Local template checks cannot establish actual Nebius Linux media isolation,
performance, grant eligibility, TLS/DNS correctness or provider-side cost cutoff.
No production-ready or deployed claim is made.

Preparation verification: JSON parsing, the actual application Settings parser,
HTTPS-origin validation, both cost calculations and `git diff --check` passed.
Nginx runtime syntax validation was attempted using the official local container
image, but Docker failed to pull it with a containerd metadata I/O error. No
Docker reset/data deletion was attempted. Therefore `nginx -t`, systemd execution
and Linux media isolation remain unverified; these are launch blockers, not passes.
