# Weekly Concept — EMAIL transport (2026-08-29)

**DOMAIN RULE (owner 2026-08-29): company email uses the COMPANY domain
`proaudiotrainingacademy.com` ONLY.** The owner's personal domain must never
appear as sender, reply-to, or in any DNS connected to the academy. (An early
draft of this doc named the personal domain — that guidance is dead; see the
cleanup section if anything was already added from it.)

The `on-weekly-concept` edge function sends the weekly concept over TWO
independent transports, both gated by the user's `notify_weekly_concept`:

| Transport | Gate | What arrives |
|---|---|---|
| Push | `push_enabled` + `expo_push_token` | Teaser notification; full card opens in the app |
| Email | `email_enabled` + `RESEND_API_KEY` secret set | The FULL concept card (dark/amber HTML + plain-text) |

A user with both gets both. A user with neither is skipped. Each delivery row
records `status` (best of the attempted transports) and `email_status`
(the email's own outcome). If the `email_status` column doesn't exist yet the
function falls back to recording push-only — nothing breaks.

Provider: **Resend**. From: `notifications@proaudiotrainingacademy.com`
(no mailbox needed — sending is domain-verified, not mailbox-based).
`reply_to` is only attached when the `EMAIL_REPLY_TO` secret is set — set it to
a COMPANY inbox (e.g. `info@proaudiotrainingacademy.com`) once one exists.

## Recommended: a company inbox that stays private

Create `info@proaudiotrainingacademy.com` at the company domain's mail host
and set it to FORWARD to whatever inbox you actually read. Server-side
forwarding is invisible to recipients — the public only ever sees the company
address. Then: `npx supabase secrets set EMAIL_REPLY_TO=info@proaudiotrainingacademy.com --project-ref yjgolswjggmlpeowvtxr`

## Owner setup — run once

| # | Where 📍 | What |
|---|---|---|
| 1 | 📍 https://resend.com | Create the account (free tier: 3,000 emails/month). |
| 2 | 📍 Resend dashboard → Domains → Add Domain | Add `proaudiotrainingacademy.com`. Resend shows 2–3 DNS records (DKIM TXT + SPF for its sending subdomain). |
| 3 | 📍 Wherever proaudiotrainingacademy.com's DNS is managed | Add those records exactly as shown. They do NOT touch MX — any existing mail receiving is unaffected. Verification usually completes in minutes. |
| 4 | 📍 Resend dashboard → API Keys | Create a key (sending-only permission is enough). Copy it. |
| 5 | 📍 Terminal at `C:\Users\profe\dev\ape-studio` | `npx supabase secrets set RESEND_API_KEY=<the key> --project-ref yjgolswjggmlpeowvtxr` |
| 6 | 📍 Supabase SQL editor | `alter table public.notification_concept_deliveries add column if not exists email_status text;` |
| 7 | 📍 Terminal at `C:\Users\profe\dev\ape-studio` | `npx supabase functions deploy on-weekly-concept --project-ref yjgolswjggmlpeowvtxr` |

Optional env overrides: `EMAIL_FROM` (default
`AP&E Pro Audio Training <notifications@proaudiotrainingacademy.com>`) and
`EMAIL_REPLY_TO` (no default — omitted unless set).

## Cleanup — disconnecting the personal domain (if it was added anywhere)

1. 📍 Resend dashboard → Domains: if the personal domain is listed, open it →
   **Remove domain**. (An unverified, never-sent domain entry has no public
   footprint; removing it erases the association entirely.)
2. 📍 Bluehost → the personal domain's DNS Zone Editor: delete any records
   that were added for Resend — typically a TXT named `resend._domainkey`
   and an MX + TXT on the `send.` subdomain. Touch nothing else; if none were
   added, there is nothing to remove.
3. No forwarding was ever configured anywhere — nothing reroutes.
4. The Resend ACCOUNT's login email is never shown to recipients; only the
   sending domain is public. The account itself does not need to change.

## Testing before the domain is verified

Resend's sandbox sender works immediately: set
`EMAIL_FROM="AP&E <onboarding@resend.dev>"` as a secret — it can deliver ONLY
to the email address on your Resend account, which is exactly right for a
self-test. Remove the override once the company domain verifies.

## Still pending before the weekly pipeline is LIVE

- Concept sequence review (the standing hold on activating the cron).
- pg_cron activation (POSTs to the function every 15 min with the service key).
- A real end-to-end sandbox test: subscribe on a device, set the send time a
  few minutes out, run the function once manually, confirm push + email.
