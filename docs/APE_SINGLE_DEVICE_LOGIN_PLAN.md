# APE Single-Device Login — Plan (2026-08-21)

Owner ruling (from the debug-audit #2 decision): **one account may be actively
used on only one device at a time.** If a user signs in on a new device, a prompt
warns that continuing will log out the previous device. Goal: 1 user = 1 active
device = no shared-credential simultaneous use.

## Why this came up
The audit flagged that device-local stores show the previous user's data until
relaunch on a shared device. The two synchronous module caches were fixed
(deckOrder, settings). This feature is the owner's broader answer to
account-sharing — it makes "another device using the same account" the thing
that's prevented, rather than trying to perfectly reset every store.

## Approach (frozen-backend-friendly)

Supabase issues one refresh-token session per sign-in and does NOT natively
enforce single-session. Options:

- **A — server-enforced (robust):** a small `active_device` record per user
  (device id + issued_at). On sign-in, the client registers its device id via an
  RPC that overwrites the record; a lightweight check (on launch / on focus /
  via a Realtime subscription) detects when `active_device` no longer matches
  this device → force sign-out locally with an explanatory screen. Needs an
  owner-run table + 1-2 RPCs (narrow amendment, access-code pattern). Optionally
  Supabase Auth admin `signOut(scope)` server-side to revoke the old session.
- **B — client-cooperative (lighter, weaker):** store the device id in a
  per-user row; the new device sets it, the old device notices on next
  foreground and signs itself out. No hard token revocation (a fully-offline old
  device stays until it reconnects). Simpler; good enough for casual sharing.

**Recommendation: A** if the goal is genuinely preventing concurrent use
(credential-sharing control); B if it's mainly a UX nicety.

## Build steps (option A)
**Backend (owner-run SQL):**
- `active_device(user_id uuid pk, device_id text, updated_at timestamptz)` +
  `claim_device(p_device_id text)` (upserts, returns ok) + read via RLS or a
  `current_device()` helper.

**App:**
1. Stable device id (e.g. `expo-application` / a persisted uuid in a KEEP-listed
   `ape:deviceId`).
2. On successful sign-in (AuthScreen create/login/OTP paths): call
   `claim_device(deviceId)`.
3. A guard (launch + on app-foreground, or a Realtime subscription on the row):
   if the server device_id != this device, run the existing sign-out +
   `clearLocalAccountData` flow and show a "Signed in on another device" screen.
4. The "continue → logs out other device" PROMPT on sign-in when a different
   active device already exists (claim returns the prior device info).

## Interactions
- Ties into the account-switch wipe already in place (`clearLocalAccountData` +
  the queue-clear + store resets added 2026-08-21) — a forced sign-out reuses
  that path, so no cross-account leakage.
- Guests are exempt (no account).

**NEXT:** owner picks A / B, then this becomes a turnkey build.
