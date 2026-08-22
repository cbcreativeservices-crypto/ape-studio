# APE QR Credential + Transcript Lookup — Plan (2026-08-21)

Owner ruling: **HIGH PRIORITY.** Every signed-up user gets a QR code, permanently
used for their transcript/credential look-up. Build into: (1) Profile screen,
(2) Pro Registry (Directory) screen, (3) a website QR look-up system. This
replaces the honest "pending" QR placeholders added earlier on 2026-08-21.

## What already exists (reuse, don't rebuild)

- **`users.qr_token`** (uuid, NOT NULL, `default gen_random_uuid()`) — a stable
  per-user token, ideal as the permanent lookup key.
- **`users.verify_code`** (text) — a second per-user identifier; likely the
  human-typeable code the current verifier accepts.
- **`public_verify_credentials(p_code text)`** RPC — anon-safe, PII-minimal,
  returns `{holder_label, credential_type, credential_name, level_or_tier,
  track, earned_at}[]`. Consumed by `web/lib/verify.ts` → the website `/verify`
  page. `normalizeCode()` uppercases + maps O→0, I/L→1.
- **`react-native-qrcode-svg`** (6.3.21) + `react-native-svg` (15.15) — installed,
  ready to render QR in the app. (Do NOT remove — this feature uses it.)

## The ONE design decision to confirm first (blocks the build)

The QR must encode a URL the website resolves to a transcript. The lookup key is
either `qr_token` (uuid, opaque, not human-typeable) or `verify_code` (short,
human-typeable, what `public_verify_credentials` already takes). Options:

- **A — verify_code (fastest):** QR encodes
  `https://proaudiotrainingacademy.com/verify?code=<verify_code>`. Reuses
  `public_verify_credentials` AS-IS; the /verify page already renders results.
  Website work is minimal. Con: the QR carries the same short code a person could
  type/guess.
- **B — qr_token (most robust):** QR encodes
  `https://proaudiotrainingacademy.com/registry/<qr_token>`. Opaque, unguessable,
  stable for life. Requires a NEW anon RPC `public_verify_by_token(p_token uuid)`
  (or extend the existing one) — a small owner-run backend addition.
- **C — both:** token in the QR/URL, verify_code as the manual fallback on the
  page.

**Recommendation: B (or C).** A permanent public credential link should be an
opaque token, not a short guessable code. Needs one small backend RPC.

## Build steps (once the key is chosen)

**Backend (owner-run SQL, only if B/C):**
- `public_verify_by_token(p_token uuid)` — SECURITY DEFINER, returns the same
  shape as `public_verify_credentials`, keyed on `users.qr_token`. Anon execute.

**App (React Native):**
1. Expose the user's token client-side: confirm `own_user` RLS lets a user read
   their own `users.qr_token` / `verify_code` (add to the existing users select).
2. Shared `<CredentialQR value={url} />` component (react-native-qrcode-svg).
3. **Profile screen** (`ProfileScreen.tsx`) — replace the "QR pending" tile
   (added 2026-08-21) with the real QR + the user's registry id.
4. **Pro Registry / Directory** (`DirectoryScreen.tsx`) — replace the "pending
   issuance" block with the real QR + verification URL once issued.

**Website (`web/`):**
5. `/registry/[token]` route (or extend `/verify`) that calls the lookup RPC and
   renders the public transcript/credentials (mirror `web/lib/verify.ts` +
   the `/verify` page). Handle not-found / error states.
6. Link it from the site nav if it should be publicly discoverable.

## Notes
- This UN-DOES the earlier "pending" placeholders — that was the correct honest
  state while no backend existed; now the backend key (qr_token) is confirmed to
  exist, so the real QR is warranted.
- Keep the payload PII-minimal (holder_label only), matching the existing
  verifier's privacy posture.
- Follows the frozen-backend "narrow amendment" pattern (like access codes / mic
  catalog) if option B/C adds the token RPC.

**NEXT:** owner picks A / B / C, then this becomes a turnkey build.
