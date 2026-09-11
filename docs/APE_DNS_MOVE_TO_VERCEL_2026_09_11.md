# Academy DNS → Vercel nameservers (run-list, 2026-09-11)

**Why:** the three academy domains have their DNS at Bluehost
(`ns1/ns2.bluehost.com`), on the account whose hosting box `162.241.216.17` has
**`channingbooth.com` as its primary site**. On 2026-09-11 the owner tapped the
app's share-footer link on a phone and landed on
`https://channingbooth.com/website_4bb34a4e/` — the shared server's catch-all
serving the primary (Weebly Builder) site under the academy's name. Deleting the
leftover `.co` website entry did not change it; the catch-all belongs to the
server, not to a record. Only separation fixes it. This violates the standing
hard rule that the academy must never connect to the owner's personal domain.

**Scope:** move DNS hosting for the three academy domains to Vercel.
Registration stays at Bluehost. Personal domains are not touched.

**Source of truth:** zone exports the owner screenshotted from the Bluehost DNS
panel, 2026-09-11. DNS allows no zone transfer, so those panels — not an
external query — are authoritative. Every record below came from them.

---

## Three dependencies that must survive the move

| Dependency | Evidence | Consequence if lost |
|---|---|---|
| **Google Workspace email** | `MX → smtp.google.com` (priority 1) | `info@proaudiotrainingacademy.com` is the app's own support/feedback address (`sendFeedback`). Incoming mail bounces. |
| **Resend (outbound email)** | `CNAME send → send.forge.rmta.net`, `CNAME rsend → rsend.forge.rmta.net`, `TXT resend._domainkey` | ✅ **RESOLVED 2026-09-11 — Resend IS LIVE. KEEP ALL THREE.** The `on-weekly-concept` edge function calls the Resend API directly (`https://api.resend.com/emails`, `RESEND_API_KEY`) and sends **from `notifications@proaudiotrainingacademy.com`**. Dropping these breaks the weekly-concept email. Note it is NOT Supabase Auth SMTP, which is where this doc originally said to look — the answer was in the edge function source. |
| **Google site verification** | `TXT @ google-site-verification=…` | Search Console ownership lost. |

## Records to KEEP — proaudiotrainingacademy.com

| Type | Host | Value |
|---|---|---|
| ~~A~~ | ~~`@`~~ | ⚠️ **DO NOT RE-CREATE.** `216.198.79.1` is the Bluehost-side pointer *to* Vercel. On Vercel DNS the apex is served by an **auto-managed `ALIAS @`** that Vercel creates itself; a hand-added A record here would fight it and trigger a "Wildcard Domain Override" prompt. |
| ~~CNAME~~ | ~~`www`~~ | ⚠️ **DO NOT RE-CREATE**, same reason — Vercel auto-creates an `ALIAS *` wildcard that answers `www`. |
| MX | `@` | `smtp.google.com` **priority 1** |
| TXT | `@` | `google-site-verification=AoQOlne1VxOLcSE-42v125d5-3tViCMtAe0TtUbW4Vs` |
| TXT | `_dmarc` | `v=DMARC1; p=none` |
| TXT | `google._domainkey` | `v=DKIM1;k=rsa;p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAobwhktVYPQwQbNFsVTsl2IZ//zOXqPzJM3E9V/wQJAdHh25rOE7waMzjiYACF/8R7EoqFKgHIo9vClBbR2BNx6zG38Uw8yimxJ4YDWnrEmKkBCOOkRn6qbz7qIXAjWFLMY/t+CLTE0r/pBGk/+S2UxdmNUTHZL/KBSCIxUkIBYIbOO+F00/C389chKbF/nI+9GLDOXWN8JorFgh+aUcCUEbMO6S2gKJjlOhd1dIRxeWjs/IQssgAXAjBAs4EVupdSYZ0+ww8AAB+L08jSrnoiO7fKoOuXMZsdAeqARxY3Q2ZMx99glXXCKSAohAnbypytPlsmE89g6Nr8osEKBmLBwIDAQAB` |
| CNAME | `send` | `send.forge.rmta.net` — **REQUIRED (Resend is live)** |
| CNAME | `rsend` | `rsend.forge.rmta.net` — **REQUIRED (Resend is live)** |
| TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC9T702d5o6ggkcMlpajjWjGyrHVLCENAvUnkbL2fffGOZCuD8ABu+aZkGuQrc0MIGO3qmZFy0awvEEbBThN8yCwUnqxYp8bctxQO+c37zncLuuKVZQNsAe9K0r30oUAbUarQy1ZKGWaRkasTsrGDaTtQ9n9LzD6mLd6Tij8U5KLQIDAQAB` — **REQUIRED (Resend is live)** |

**SPF — DEFERRED to AFTER the move, deliberately.** There is still no SPF record
at all. It was originally listed as an ADD during the migration; on reflection
that mixes two changes and muddies the rollback, so the cutover stays
like-for-like (minus dead cruft) and SPF lands as its own deliberate step
afterwards, verified against Resend's dashboard.

When it does land, `v=spf1 include:_spf.google.com ~all` at the apex is the
right shape: Resend aligns via the `send` CNAME, whose target carries Resend's
own SPF and MX, so the apex record only has to authorise Google.

There is **no SPF record at all** today — and that now matters more, because
**two** senders use this domain: Google Workspace and Resend
(`notifications@proaudiotrainingacademy.com`). DMARC `p=none` enforces nothing,
so nothing is broken today, but any move toward enforcement needs SPF first.
After the nameserver move, **re-verify the domain in the Resend dashboard** and
let Resend state its own records rather than guessing at the include.

## Records to DROP — Bluehost service cruft, none of it used

`proaudiotrainingacademy.com`: A `autoconfig`, `autodiscover`, `localhost`,
`mail`, `ssh`, `webdisk`, `whm` · CNAME `cpanel`, `ftp`, `imap`, `pop`, `smtp`,
`webmail` · **MX `@` → `proaudiotrainingacademy.com`** (Bluehost default; the
apex now resolves to Vercel, which accepts no mail) · SRV `_autodiscover._tcp`
→ `cpanelemaildiscovery.cpanel.net`.

**`mail` and `autodiscover` point straight at the personal-site box**, and
`autodiscover` is what mail clients read to configure themselves. These are live
academy→personal links today and can be deleted immediately, with no cutover.

## proaudiotrainingacademy.co

Keep only: A `@` → `216.198.79.1` and `www` → the same. Drop everything else:
the same Bluehost cruft, **both MX records** (no mail on `.co`), the stale
`TXT _acme-challenge.webmail`, and the `_autodiscover._tcp` SRV.

## proaudiotrainingacademy.online

**Already clean** — only `A @` and `A www` → `216.198.79.1`. Nothing to
preserve, no mail, no verification records. This is why it is the canary.

---

## Run-list

| # | Where | What |
|---|---|---|
| 0a | — | ✅ **DONE 2026-09-11. Resend is LIVE and all three records are load-bearing.** Evidence: the `on-weekly-concept` edge function POSTs to `https://api.resend.com/emails` with `RESEND_API_KEY`, sending from `notifications@proaudiotrainingacademy.com`. No dashboard check needed. |
| 0b | Bluehost → each academy domain → DNS | Zone exports already captured (2026-09-11 screenshots). Re-export if anything changes before the move. |
| 0c | Bluehost DNS | ⚠️ **CORRECTED 2026-09-11 — this step was largely pointless as first written and is now OPTIONAL.** The original said to drop every record TTL to 300s. That does **not** speed up a nameserver change: how long resolvers keep using Bluehost is governed by the **NS delegation TTL** (measured at 5688s still running, plus the `.com` registry's own delegation TTL, typically 48h), not by the A/MX/TXT TTLs inside the zone. Lowering ~40 records by hand in a live zone would buy almost nothing and risk a fat-finger. **The real safety is that BOTH zones serve identical records during the overlap** — which is already step 8's 7-day window. If you want faster NS propagation, lower the **NS record TTL only** (one record per zone), if Bluehost lets you edit it. Otherwise skip straight to step 1. |
| 0d | Bluehost DNS → `.com` | ✅ **DONE 2026-09-11.** Deleted the `mail` and `autodiscover` A records (both were → `162.241.216.17`). Verified in the panel: MX `smtp.google.com`, apex A, `www` and the DKIM TXT all intact. Public resolvers still served the old answers immediately after (TTLs were 1h and 4h; the panel warns 24–48h), so re-check before assuming it propagated. **`.co` done too** — same two records deleted from that zone, apex/`www` intact. ⚠️ Side effect to close later: the `.co` still has `MX @ → mail.proaudiotrainingacademy.co`, which is now a DANGLING pointer. Harmless (no mail runs on `.co`, and bouncing is honest) but both `.co` MX records are already on the DROP list for the migration. |
| 1 | Vercel → Domains (team `pro-audio-training-academy`) | ✅ **DONE 2026-09-11.** All three academy domains are on **Vercel DNS**. Nameservers as displayed by Vercel: `ns1.vercel-dns.com` / `ns2.vercel-dns.com` (identical for all three). Each panel says *"This domain is registered with a third party — nameserver changes must be made with your domain's registrar"*, which is the expected state until step 3. |
| 2 | Vercel → DNS records | ✅ **DONE 2026-09-11 — `.com` zone built and verified row by row.** 12 rows: the 7 hand-entered KEEP records (`MX @ smtp.google.com` pri 1 · `TXT @` google-site-verification · `TXT _dmarc` · `TXT google._domainkey` 408 chars · `TXT resend._domainkey` 218 chars · `CNAME send` · `CNAME rsend`), all TTL 60, plus **5 Vercel auto-managed rows nobody typed**: 3 × `CAA @` (pki.goog, sectigo.com, letsencrypt.org) and 2 × ALIAS (`@` and `*`). Both DKIM keys were length- **and** checksum-verified against the Bluehost originals before submit (Google 408 chars, Resend 218 chars — both MATCH). `.co` and `.online` need **no records at all** (redirect-only); each shows the same 3 auto CAA and nothing else. ⚠️ The Vercel record table **paginates at 3 rows behind a "Load More" button** — a glance at that panel shows a third of the zone and reads as data loss. Always expand before judging. |
| 3 | Bluehost → `.online` → Nameservers | **Canary. NOT YET DONE — this is where the owner picks the work back up.** Switch `.online` only. Two records, redirect-only, no mail — a failure here costs nothing. Expect resolvers to take up to ~48h to all move across; that is the registry delegation TTL, not a fault. ⚠️ **The one thing the canary is really testing:** `.com` carries auto-managed `ALIAS @` and `ALIAS *` rows, but `.co` and `.online` carry **only CAA** — no apex record of any kind. Vercel is expected to answer a connected redirect-domain's apex from its nameservers without a visible row, but that is **unverified**, and if it is wrong the apex goes NXDOMAIN the moment the delegation moves. Verify `.online` resolves and redirects before touching `.co`, and never run steps 3–6 in one sitting. |
| 4 | Terminal | Verify the canary (below). Do not proceed until it passes. |
| 5 | Bluehost → `.co` → Nameservers | Switch `.co`. Verify. |
| 6 | Bluehost → `.com` → Nameservers | Switch **last** — this one carries the mail, the DKIM and the live site. |
| 7 | Terminal + mail | Verify all three. **Send a test email to `info@proaudiotrainingacademy.com` from an outside address and confirm it arrives.** If Resend is live, send one through it too. |
| 8 | — | Leave the Bluehost zones **intact for 7 days** as rollback. Reverting = switching nameservers back. |
| 9 | Bluehost | After the window, remove the stale academy zones. **Never remove the domains themselves** — registration stays at Bluehost. |

## Verification

    nslookup -type=NS  proaudiotrainingacademy.com 8.8.8.8
    nslookup -type=MX  proaudiotrainingacademy.com 8.8.8.8
    nslookup -type=TXT google._domainkey.proaudiotrainingacademy.com 8.8.8.8
    nslookup -type=TXT proaudiotrainingacademy.com 8.8.8.8

Expected: NS = Vercel's pair · MX = `smtp.google.com` priority 1 · DKIM present
and byte-identical · SPF now present · and the site still lands on
`https://www.proaudiotrainingacademy.com/` with **401 while the site gate is
closed, which is expected, not a failure**.

## What this does and does not buy

This still answers afterwards, and that is not a bug:

    curl -sS -o /dev/null -w "%{http_code}" -H "Host: proaudiotrainingacademy.com" http://162.241.216.17/

The catch-all belongs to the server, and it persists while the hosting plan
exists. What the move buys is that **no academy name resolves there any more** —
a stale cache becomes the only route to it, and that ages out. It turns the hard
rule from true-by-configuration into true-by-structure.

## Do NOT

- Do not remove the academy domains from Bluehost **registration**.
- Do not switch nameservers before the Vercel zone is populated — mail bounces.
- **Do not drop the Resend records at all** — step 0a proved they are live.
- Do not retype the DKIM keys by hand; copy them.
- Do not touch the personal domains on the same account.
