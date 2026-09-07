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

### Step 4 — open the dashboard and finish

Your private URL (swap in your slug):
`https://yjgolswjggmlpeowvtxr.supabase.co/functions/v1/admin-codes/7q4me8hkyuxsdj3phyo1ev15`

1. Sign in with the admin account.
2. First time only: scan the QR with your authenticator app (Google Authenticator, Authy, 1Password…),
   then enter the 6-digit code → Verify.
3. Enter your passphrase (kept only in that tab).
4. Generate codes.

Bookmark the URL privately. It is unlisted and not linked anywhere.

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
