# Academy DNS → Vercel nameservers (run-list, 2026-09-11)

**Why:** the three academy domains have their DNS at Bluehost
(`ns1/ns2.bluehost.com`), on the same account whose hosting box
(`162.241.216.17`) has **`channingbooth.com` as its primary site**. On
2026-09-11 the owner tapped the app's share-footer link on a phone and landed on
`https://channingbooth.com/website_4bb34a4e/` — the shared server's catch-all
serving the primary (Weebly Builder) site under the academy's name. Deleting the
leftover `.co` website entry did not change that; only separation does. This
violates the standing hard rule that the academy must never connect to the
owner's personal domain.

**Scope:** move DNS hosting for the three academy domains to Vercel. Registration
stays at Bluehost. The personal domains are NOT touched.

---

## ⚠️ Read before starting

1. **Email is Google Workspace.** `MX 1 → smtp.google.com`.
   `info@proaudiotrainingacademy.com` is the app's support/feedback address
   (`sendFeedback`). **If the MX records are not live at Vercel BEFORE the
   nameserver switch, incoming mail bounces.** Pre-build the zone first — this is
   the single most important ordering rule here.
2. **DNS does not allow zone transfer**, so the record list below is what could
   be enumerated from outside. **Export/screenshot the full Bluehost zone first**
   — only that panel is authoritative.
3. Keep the Bluehost zone **intact** until verification passes. It is the rollback.

## Findings to fix DURING the move (not just a like-for-like copy)

| Finding | Why it matters | Action |
|---|---|---|
| `mail.proaudiotrainingacademy.com` → **162.241.216.17** | Points at the personal-site box. A live academy→personal link. | Drop it (mail is Google). |
| `autodiscover.proaudiotrainingacademy.com` → **162.241.216.17** | Mail clients auto-configure from this — could aim an academy mailbox at the personal box. | Drop it, or point at Google. |
| `MX 10 → proaudiotrainingacademy.com` | Bluehost default; the apex now resolves to Vercel, which accepts no mail. Harmless only because prio 1 wins. | Drop it. |
| **No SPF record at the apex** | Google Workspace is sending with no SPF. Hurts deliverability; DMARC `p=none` enforces nothing. | Add `v=spf1 include:_spf.google.com ~all`. |
| `webmail` / `ftp` / `cpanel` CNAMEs → apex | Bluehost service names the academy no longer uses. | Drop. |
| DMARC is `p=none` | Monitoring only. | Out of scope; revisit after SPF has been live a while. |

## The zone to recreate at Vercel — proaudiotrainingacademy.com

| Type | Host | Value | Note |
|---|---|---|---|
| A | `@` | `216.198.79.1` | Vercel. May be auto-managed once the domain is in the project. |
| CNAME | `www` | `54da1ac47f698e0f.vercel-dns-017.com` | Vercel-generated; let Vercel set this if it offers to. |
| MX | `@` | `smtp.google.com` priority **1** | **Google Workspace — must exist before cutover.** |
| TXT | `@` | `google-site-verification=AoQOlne1VxOLcSE-42v125d5-3tViCMtAe0TtUbW4Vs` | Google ownership proof. |
| TXT | `@` | `v=spf1 include:_spf.google.com ~all` | **NEW — currently missing.** |
| TXT | `_dmarc` | `v=DMARC1; p=none` | Copy as-is. |
| TXT | `google._domainkey` | `v=DKIM1;k=rsa;p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAobwhktVYPQwQbNFsVTsl2IZ//zOXqPzJM3E9V/wQJAdHh25rOE7waMzjiYACF/8R7EoqFKgHIo9vClBbR2BNx6zG38Uw8yimxJ4YDWnrEmKkBCOOkRn6qbz7qIXAjWFLMY/t+CLTE0r/pBGk/+S2UxdmNUTHZL/KBSCIxUkIBYIbOO+F00/C389chKbF/nI+9GLDOXWN8JorFgh+aUcCUEbMO6S2gKJjlOhd1dIRxeWjs/IQssgAXAjBAs4EVupdSYZ0+ww8AAB+L08jSrnoiO7fKoOuXMZsdAeqARxY3Q2ZMx99glXXCKSAohAnbypytPlsmE89g6Nr8osEKBmLBwIDAQAB` | Public key, not a secret. Must be byte-exact or DKIM fails. |

`.co` and `.online` are redirect-only (A `@` → `216.198.79.1`, no mail). Simpler.

---

## Run-list

| # | Where | What |
|---|---|---|
| 0a | Bluehost → Domains → each academy domain → DNS | **Export or screenshot the full zone** for all three. This is the rollback record and the authoritative list. |
| 0b | Bluehost DNS | Lower TTL on every record to **300s**. Wait for the OLD TTL to expire (often 24–48h) before step 2, so the cutover is fast and reversible. |
| 0c | — | Optional quick win, no cutover needed: delete `mail` and `autodiscover` A records now. Removes two live academy→personal-box links immediately. |
| 1 | Vercel → Domains (team `pro-audio-training-academy`) | For each academy domain, choose to let **Vercel host the DNS**. Vercel shows its nameserver pair (typically `ns1.vercel-dns.com` / `ns2.vercel-dns.com`) — **use the pair Vercel displays**, do not assume. |
| 2 | Vercel → Domains → DNS records | **Create every record from the table above BEFORE touching nameservers.** MX first. Verify the DKIM string pasted without truncation or added whitespace. |
| 3 | Bluehost → Domains → *domain* → Nameservers | Switch from `ns1/ns2.bluehost.com` to the Vercel pair. Do **`.online` first** as the canary — it is redirect-only and carries no mail. |
| 4 | Terminal | Verify the canary before proceeding (commands below). |
| 5 | Bluehost | Repeat step 3 for `.co`, then **`.com` last** — the `.com` is the one carrying mail and the live site. |
| 6 | Terminal + mail | Verify all three (below). **Send a test email to `info@proaudiotrainingacademy.com` from an outside address and confirm it arrives.** |
| 7 | Wait | Leave the Bluehost zones untouched for **7 days** as rollback. Reverting = switching the nameservers back. |
| 8 | Bluehost | After the window, remove the stale academy zones. **Never remove the domains themselves** — registration stays. |

## Verification commands

```
nslookup -type=NS proaudiotrainingacademy.com 8.8.8.8
nslookup -type=MX proaudiotrainingacademy.com 8.8.8.8
nslookup -type=TXT google._domainkey.proaudiotrainingacademy.com 8.8.8.8
curl -sSL -o /dev/null -w "%{url_effective} %{http_code}\n" https://proaudiotrainingacademy.com
```

Expected after the move: NS = Vercel's pair · MX = `smtp.google.com` prio 1 ·
DKIM present and byte-identical · the URL still lands on
`https://www.proaudiotrainingacademy.com/` (401 while the site gate is closed —
that is expected, not a failure).

And the point of the whole exercise:

```
curl -sS -o /dev/null -w "%{http_code}\n" -H "Host: proaudiotrainingacademy.com" http://162.241.216.17/
```

This will still answer while the hosting plan exists — the catch-all is the
server's, not a record. What the move buys is that **no academy name resolves
there any more**, so a stale cache is the only way to reach it, and that ages out.

## Do NOT

- Do not remove the academy domains from Bluehost **registration**.
- Do not switch nameservers before the Vercel zone is fully populated — mail bounces.
- Do not retype the DKIM key by hand; copy it.
- Do not touch the personal domains on the same account.
