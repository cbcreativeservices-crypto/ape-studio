# Wave D — Authentication + session (release-readiness QA, 2026-09-10)

Scope: login/logout/reset, token-expiry-during-use, cold-start session restore,
offline-during-auth, single-device, account deletion, guest mode. Code review.
The auth architecture is careful and defensive; findings are the real gaps. No
fixes auto-applied here (each needs owner judgment or device verification); all
filed. (The related CourseSelection `resolved` hang was fixed in Wave C.)

## FILED — MED

### D-1 [MED] No auto re-auth / navigation on silent session loss
When the refresh token is expired/revoked (single-device displacement, password
changed elsewhere, server revoke), Supabase emits a silent `SIGNED_OUT`. Three
listeners react (EntitlementProvider → anonymous, accountLocalSync → wipe local,
AudioOutputGate) but **none navigate to Auth**. The user is left on whatever
protected screen they were on (a lab/tool/module) with a dead session; recovery
exists only via Dashboard/Courses/Calc error states ("Back to Login") — **lab/tool
screens have no such escape**. Not a crash (caps re-lock), but a confusing degraded
state. **Recommend (owner — behavioral, needs care against spurious logouts):** a
root auth-state listener that resets to Splash/Auth on an *unexpected* SIGNED_OUT,
mirroring `SingleDeviceGuard`. Filed rather than auto-applied because "unexpected"
needs judgment.

### D-2 [MED] Splash `getSession()` has no hang timeout
`src/screens/SplashScreen.tsx:36` handles getSession **rejecting**
(`.catch(()=>({data:{session:null}}))`) but not getSession **hanging** (never
settling). It reads through `expo-secure-store`; a stalled keychain call leaves
`await sessionP` pending past the 2.5s timer → app stuck on Splash, unrecoverable.
**Recommend:** `Promise.race([sessionP, timeout→null])` so a stalled read defaults
to the signed-out route. Filed (boot path = high blast radius; verify on device).

### D-3 [MED] Five raw `error.message` returns in `auth/api.ts` (offline jargon)
Offline surfaces the developer string "Network request failed" instead of
actionable copy:
- `src/features/auth/api.ts:77` signIn · `:72` ensureSession already-registered ·
  `:98` requestPasswordReset · `:107` verifyRecoveryOtp (NOTE: `AuthScreen.tsx:315`
  already overrides this with friendly copy — so the OTP path is fine) · `:113`
  updatePassword.
**Recommend:** a shared network-error mapper (detect offline → "You appear to be
offline — reconnect and try again.") at these call sites. Filed — the prior audit
marked auth message-mapping as needs-judgment (which strings to map), and new
user-facing copy is owner-domain. Signup + access-code paths already map to
friendly copy.

## FILED — LOW
- **D-4** `auth/api.ts:58-73` — "Create Account" with an existing email + matching
  password silently signs into the EXISTING account, with no "you joined an
  existing account" message. Idempotent by design, but can surprise.
- **D-5** Logout/delete reset to Splash replays the intentional 2.5s splash hold
  before Auth. UX nit.
- **D-6** `auth/api.ts:96-99` — password reset depends on the Supabase dashboard
  email template carrying `{{ .Token }}`; if unset, the 6-digit OTP flow dead-ends.
  **Verify the template before launch** (config, not code).
- **D-7** `DeleteAccountButton.tsx:73-80` — if the `delete_my_account` RPC succeeds
  but the subsequent signOut/clear throws, the catch shows "Could not delete
  account… try again", misleading the user into retrying an already-deleted
  account. Treat post-RPC failures as "deleted, cleanup incomplete."

## Verified GOOD
- **Client config**: `autoRefreshToken:true`, `persistSession:true`,
  start/stopAutoRefresh gated on AppState foreground → normal token expiry
  auto-refreshes.
- **Cold start**: SplashScreen routes `session ? Main : Auth` via `navigation.reset`
  (no back); font-error boot guard falls through; EntitlementProvider `resolved`
  keeps first paint neutral (no member anonymous-flash). Race handled (except the
  D-2 hang edge).
- **Single-device**: claim/guard fails OPEN on every RPC (missing migration/offline/
  error → no spurious logout); displacement prompts + signs out cleanly.
- **Account-switch local wipe**: `clearLocalAccountData`/`accountLocalSync` thorough,
  correct ordering; guest wipe preserves only Career Finder + device calibration per
  owner rulings.
- **Guest mode**: caps all-false (no gated content); guest→real-login re-derives
  tier correctly (`devOverrode` cleared on SIGNED_IN; `setEntitlement` is
  `__DEV__`-only, so the stuck-anonymous trap is dev/web-only).
- **Account deletion**: 5s press-and-hold + confirm dialog → RPC → signOut → clear →
  reset to Splash; failure surfaced.
- **Logout**: fully clears session + local state; protected screens unreachable after
  (reset to Auth).

## Filed items → owner
| ID | Sev | Action |
| --- | --- | --- |
| D-1 | MED | Root listener → reset to Auth on unexpected SIGNED_OUT (labs/tools have no escape today) |
| D-2 | MED | Add a hang timeout to Splash getSession (device-verify) |
| D-3 | MED | Shared offline-error mapper for the 5 raw `error.message` sites |
| D-4 | LOW | Message when create-account joins an existing account |
| D-5 | LOW | (optional) skip the 2.5s splash replay on logout |
| D-6 | LOW·verify | Confirm Supabase reset email template carries `{{ .Token }}` |
| D-7 | LOW | Post-RPC delete-cleanup error messaging |
