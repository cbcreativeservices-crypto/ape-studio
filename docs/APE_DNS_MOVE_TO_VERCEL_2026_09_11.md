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
| **Resend (outbound email)** | `CNAME send → send.forge.rmta.net`, `CNAME rsend → rsend.forge.rmta.net`, `TXT resend._domainkey` | **VERIFY BEFORE DROPPING.** Resend appears nowhere in the live tree (`src/`, `web/`, `supabase/`, `package.json`) — only in ARCHIVED governance docs marked "Not started". **But a Supabase Auth custom-SMTP setting lives in the dashboard, not in code**, so absence from the repo does not prove it is unused. If Supabase Auth sends through Resend, dropping these breaks signup confirmation and password reset. Check: Supabase Dashboard → Authentication → Emails → SMTP Settings. |
| **Google site verification** | `TXT @ google-site-verification=…` | Search Console ownership lost. |

## Records to KEEP — proaudiotrainingacademy.com

| Type | Host | Value |
|---|---|---|
| A | `@` | `216.198.79.1` |
| CNAME | `www` | `54da1ac47f698e0f.vercel-dns-017.com` |
| MX | `@` | `smtp.google.com` **priority 1** |
| TXT | `@` | `google-site-verification=AoQOlne1VxOLcSE-42v125d5-3tViCMtAe0TtUbW4Vs` |
| TXT | `_dmarc` | `v=DMARC1; p=none` |
| TXT | `google._domainkey` | the `v=DKIM1;k=rsa;p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A…` key — **copy from the Bluehost panel, never retype** |
| CNAME | `send` | `send.forge.rmta.net` — **only if Resend is in use** |
| CNAME | `rsend` | `rsend.forge.rmta.net` — **only if Resend is in use** |
| TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADC…` — **only if Resend is in use**; copy from the panel |

**ADD (currently missing):** `TXT` `@` → `v=spf1 include:_spf.google.com ~all`

There is **no SPF record at all** today — Google is sending unauthenticated and
DMARC `p=none` enforces nothing. If Resend turns out to be live, re-verify the
domain in the Resend dashboard after the move and let it state its own records
rather than guessing at the include.

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
| 0a | Supabase Dashboard → Authentication → Emails → SMTP | **Settle the Resend question first.** If custom SMTP points at Resend, the `send`/`rsend`/`resend._domainkey` records are load-bearing. If it is Supabase's built-in sender, they are dead and get dropped. |
| 0b | Bluehost → each academy domain → DNS | Zone exports already captured (2026-09-11 screenshots). Re-export if anything changes before the move. |
| 0c | Bluehost DNS | Drop every TTL to **300s**, then wait out the OLD TTL (up to 4h here; the panel warns 24–48h) before step 3. |
| 0d | Bluehost DNS → `.com` | ✅ **DONE 2026-09-11.** Deleted the `mail` and `autodiscover` A records (both were → `162.241.216.17`). Verified in the panel: MX `smtp.google.com`, apex A, `www` and the DKIM TXT all intact. Public resolvers still served the old answers immediately after (TTLs were 1h and 4h; the panel warns 24–48h), so re-check before assuming it propagated. **`.co` still has the same two records** — not yet touched. |
| 1 | Vercel → Domains (team `pro-audio-training-academy`) | Set each academy domain to use **Vercel DNS**. Use the nameserver pair **Vercel displays** — do not assume it. |
| 2 | Vercel → DNS records | Create the KEEP table above **before** touching nameservers. MX first. Verify the DKIM string pasted without truncation or added whitespace. |
| 3 | Bluehost → `.online` → Nameservers | **Canary.** Switch `.online` only. Two records, redirect-only, no mail — a failure here costs nothing. |
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
- Do not drop the Resend records until step 0a has answered the question.
- Do not retype the DKIM keys by hand; copy them.
- Do not touch the personal domains on the same account.
