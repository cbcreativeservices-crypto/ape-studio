# Access-code dashboard — setup & use (2026-09-07)

A standalone, owner-only web dashboard to generate month / year / lifetime membership codes on demand.
No SQL, no app. It is one Supabase edge function (`admin-codes`) that serves the page and enforces every
action server-side. It touches none of your `web/` project.

## Security (how the five layers are enforced)

Every generate / disable action is refused unless ALL of these pass, checked on the server, not the browser:
1. You are signed in with a valid account.
2. Your session is two-factor verified (authenticator app / TOTP).
3. Your account email is on the admin allowlist (`ADMIN_EMAILS`).
4. The extra passphrase (`ADMIN_PASSPHRASE`) is correct.
5. Your network passes the location allowlist (`ADMIN_IP_ALLOW`) — LEFT OFF by default (loosened), so it
   never locks you out; turn it on later if you want.
The page itself is served only at a secret path (`ADMIN_URL_SLUG`) and is marked no-index. The code
generator is service-role-only and unreachable by any browser. Until the secrets below are set, the page
404s and nothing can be minted.

## One-time setup

### Step 1 — set four secrets (Supabase dashboard, click-based)

Open Project Settings → Edge Functions → Secrets:
https://supabase.com/dashboard/project/yjgolswjggmlpeowvtxr/settings/functions
Add each as a Name / Value:

| Secret name | Value to enter | What it does |
|---|---|---|
| `ADMIN_EMAILS` | the email of the account you'll sign in with (comma-separate more than one) | only these accounts can act |
| `ADMIN_PASSPHRASE` | a strong secret you choose | required with every action |
| `ADMIN_URL_SLUG` | a long random string, e.g. `7q4me8hkyuxsdj3phyo1ev15` | the secret path in your URL |
| `ADMIN_IP_ALLOW` | leave UNSET | optional location lock; empty = allow anywhere |

CLI alternative (from `C:\Users\profe\dev\ape-studio`, if you prefer the terminal):
```bash
cd "C:\Users\profe\dev\ape-studio"
npx supabase secrets set ADMIN_EMAILS="you@example.com" ADMIN_PASSPHRASE="choose-a-strong-phrase" ADMIN_URL_SLUG="7q4me8hkyuxsdj3phyo1ev15" --project-ref yjgolswjggmlpeowvtxr
```

### Step 2 — make sure two-factor is available

The dashboard uses Supabase's built-in authenticator-app 2FA, which is on by default. If enrollment fails
in Step 4, enable it here: Authentication → Sign In / Providers → Multi-Factor (TOTP) → on.

### Step 3 — have an admin account

You need a normal Supabase account (email + password, email confirmed) whose email you put in
`ADMIN_EMAILS`. Use your existing account or create one for admin.

### Step 4 — open the console (a local page) and finish

Supabase's functions domain refuses to render HTML (it force-serves plain text to
stop phishing on their host), so the console is a LOCAL page you open in your
browser rather than a hosted URL. It is more private this way — the page lives
only on your machine — and it still calls the hardened server for everything.

Open (and bookmark) this file:
`C:Usersprofedevape-studioadmin-consolepro-audio-access-codes.html`
(as a browser address: `file:///C:/Users/profe/dev/ape-studio/admin-console/pro-audio-access-codes.html`)

1. It opens to the dark "Access Codes" sign-in.
2. Sign in with the account whose email is in `ADMIN_EMAILS` (must have a password).
3. First time only: scan the QR with your authenticator app, enter the 6-digit code, Verify.
4. Enter your passphrase and Generate a code to test.

Note: with the local page, the `ADMIN_URL_SLUG` secret is no longer needed (it only
gated the disabled hosted page). You can leave it set; it is harmless.

Prefer a real hosted URL instead of a local file? Tell me and I'll move the page to
Supabase Storage (a private, same-origin URL that renders) — a couple of dashboard clicks.

## Using it

- Pick a plan (Lifetime / 1 year / 1 month), how many codes, seats per code, and a label, then Generate.
  Copy the codes and hand them out.
- Seats per code = how many people can redeem one code (an employer/institutional deal is one code with
  many seats). Individual handouts = many codes with 1 seat each.
- "All codes" lists everything with usage; Disable/Enable turns a code off or back on.
- Recipients redeem in the app on Create Account or Settings → MEMBERSHIP; membership activates at once.

## Changing things later
- New passphrase / slug / admin: update the secret in Step 1. Changing the slug changes your URL.
- Turn on the location lock: set `ADMIN_IP_ALLOW` to your IP(s), e.g. `203.0.113.7` or a prefix
  `203.0.113.*` (comma-separate several). Leave unset to allow anywhere.
