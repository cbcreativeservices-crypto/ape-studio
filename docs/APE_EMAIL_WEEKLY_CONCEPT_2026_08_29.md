# Weekly Concept — EMAIL transport (2026-08-29)

The `on-weekly-concept` edge function now sends the weekly concept over TWO
independent transports, both gated by the user's `notify_weekly_concept`:

| Transport | Gate | What arrives |
|---|---|---|
| Push | `push_enabled` + `expo_push_token` | Teaser notification; full card opens in the app |
| Email | `email_enabled` + `RESEND_API_KEY` secret set | The FULL concept card (dark/amber HTML + plain-text) |

A user with both gets both. A user with neither is skipped. Each delivery row
records `status` (best of the attempted transports) and `email_status`
(the email's own outcome). If the `email_status` column doesn't exist yet the
function falls back to recording push-only — nothing breaks.

Provider: **Resend** (chosen 2026-08-29). From: `notifications@channingbooth.com`
(no mailbox needed — sending is domain-verified, not mailbox-based).
Replies go to `info@channingbooth.com` via the `reply_to` header.

## Owner setup — run once (all in ~15 min)

| # | Where 📍 | What |
|---|---|---|
| 1 | 📍 https://resend.com | Create the account (free tier: 3,000 emails/month). |
| 2 | 📍 Resend dashboard → Domains → Add Domain | Add `channingbooth.com`. Resend shows 2–3 DNS records (DKIM TXT + SPF for its sending subdomain). |
| 3 | 📍 Your DNS host (wherever channingbooth.com's DNS lives) | Add those records exactly as shown. They do NOT touch MX — `info@` receiving is unaffected. Verification usually completes in minutes. |
| 4 | 📍 Resend dashboard → API Keys | Create a key (sending-only permission is enough). Copy it. |
| 5 | 📍 Terminal at `C:\Users\profe\dev\ape-studio` | `npx supabase secrets set RESEND_API_KEY=<the key> --project-ref yjgolswjggmlpeowvtxr` |
| 6 | 📍 Supabase SQL editor | `alter table public.notification_concept_deliveries add column if not exists email_status text;` |
| 7 | 📍 Terminal at `C:\Users\profe\dev\ape-studio` | `npx supabase functions deploy on-weekly-concept --project-ref yjgolswjggmlpeowvtxr` |

Optional env overrides (only if you want different addresses):
`EMAIL_FROM` (default `AP&E Pro Audio Training <notifications@channingbooth.com>`)
and `EMAIL_REPLY_TO` (default `info@channingbooth.com`) via `supabase secrets set`.

## Testing before the domain is verified

Resend's sandbox sender works immediately: set
`EMAIL_FROM="AP&E <onboarding@resend.dev>"` as a secret — it can deliver ONLY
to the email address on your Resend account, which is exactly right for a
self-test. Swap to the real domain (remove the override) once DNS verifies.

## Still pending before the weekly pipeline is LIVE

- Concept sequence review (the standing hold on activating the cron).
- pg_cron activation (POSTs to the function every 15 min with the service key).
- A real end-to-end sandbox test: subscribe on a device, set the send time a
  few minutes out, run the function once manually, confirm push + email.
