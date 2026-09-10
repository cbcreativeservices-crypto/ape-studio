# Wave F — Release-Readiness Report & Verdict (2026-09-10)

> **UPDATE 2026-09-10:** the A-1/A-2 CRITICAL/HIGH RLS blocker has been **RESOLVED**
> — owner applied the write-lockdown migration; all four `own_*` policies verified
> live as `SELECT`. The original verdict below was NOT RELEASE READY *because of
> A-1*; with A-1 closed, the remaining gate is **E-3** (confirm EAS production env
> vars) plus a device re-verify of the credential journey, after which this moves to
> **RELEASE READY WITH ACCEPTED RISKS** (the rest are should-fix/defer, no CRITICAL).

Synthesis of Waves A–E (this overnight run) against the plan
`docs/APE_RELEASE_READINESS_QA_PLAN_2026_09_10.md`, reconciled to what ape-studio
actually is (commercial study app — no bookings/equipment/clock-in/faculty;
single-user; backend frozen; pre-launch). Per-wave detail in `waveA…waveE`.

## Executive summary
- **Security:** one **CRITICAL** release-blocker (credential forge via RLS) — the
  app trusts a client-writable table for certificate/program awards. Otherwise the
  security posture is strong (secrets clean, fails-closed, RLS enabled everywhere,
  prior notification leak resolved).
- **Data integrity:** DB constraints solid; one HIGH calc bug **fixed** this run
  (Profile >100%); one MED client/server divergence filed.
- **Functional / nav / auth:** no crash-on-normal-use found; one MED hang risk
  **fixed** (Home spinner); the rest are MED/LOW hardening, filed.
- **Performance / UI / a11y / memory:** covered by the 2026-09-09 launch audit +
  this session's punch-list (gallery virtualized, offline cards, render-perf,
  a11y); no new blockers.
- **Production config:** clean except 2 deep-link reach gaps + 1 build-env
  **verification** (EAS prod env vars) that is itself a release-gate.

## Defect summary (this run)
| Severity | Open (filed) | Fixed this run |
| --- | --- | --- |
| CRITICAL | 1 (A-1) | 0 |
| HIGH | 1 (A-2) | 1 (B-1 Profile %) |
| MED | 7 (A-3, B-2, E-1, E-2, E-3·verify, D-1, D-2, D-3) | 1 (C-1 Home hang) |
| LOW | ~13 (A-4/5, B-3/4/5/6/7, C-2/3/4, D-4/5/6/7) | — |

(Fixed this run are in addition to the full punch-list #1–#7 already closed this
session.)

## RELEASE BLOCKERS (MUST FIX before release)
1. **A-1 [CRITICAL] Credential forge via RLS.** An authenticated user can write
   their own `student_achievement_progress.status='complete'` directly (REST API,
   shipped anon key + their JWT); an AFTER-trigger runs `evaluate_user_credentials`,
   which awards certs/programs by trusting those rows → **forged credentials**.
   Fix = owner-approved RLS migration: `own_achievement_progress` (+ A-2 siblings)
   **ALL → SELECT**, leaving writes to the SECURITY-DEFINER RPCs (client already
   writes only via RPCs — non-breaking). **Backend frozen → needs owner go.**
2. **A-2 [HIGH]** (same migration) `own_method_progress` / `own_badges` /
   `own_quiz_attempts` ALL → SELECT (forge method-progress / badges / quiz rows).
3. **E-3 [MED·verify] EAS production env.** Confirm `EXPO_PUBLIC_SUPABASE_URL` +
   `EXPO_PUBLIC_SUPABASE_ANON_KEY` are set for the `production` profile in EAS
   (not in `eas.json`; `.env` is git-ignored) — else the production build can't
   reach Supabase. Release-gate.

## SHOULD FIX before release
- **A-3** `get_scenario_items` anon-executable — confirm scenarios are free/preview;
  revoke anon if members-only.
- **E-1 / E-2** deep-link reach: iOS `associatedDomains` missing; Android intent
  filters omit `/topics`. Fold into the `labs/*` deep-link task (proposal doc +
  morning reminder). Scheme works; https links don't.
- **B-2** program-with-electives progress under-reports (server/contract: expose
  `is_elective` from `award_required_topics`).
- **D-1** no re-auth navigation on silent SIGNED_OUT (labs/tools strand).
- **D-2** Splash getSession hang timeout.
- **D-3** offline auth error copy (5 raw `error.message` sites).
- **D-6** verify Supabase reset email template carries `{{ .Token }}`.

## CAN DEFER (LOW)
A-4 (institutional RLS remnants) · A-5 (~250 backup tables) · B-3 (Profile count
v3-scope) · B-4 (inert required_passes) · B-5 (nearest-credential ranking) · B-6
(100% meter pre-quiz) · B-7 (credential display lag) · C-2 (Gallery loading state)
· C-3 (Enrollment browse no-catch) · C-4 (profile persist) · D-4/D-5/D-7.

## FIXED during this run (safe, tsc + 296 tests green, committed)
- **B-1** Profile overall % >100% → denominator = live v3 topic count + clamp
  (`baa7efb`).
- **C-1** CourseSelection (Home) infinite-spinner risk → `resolved` now always
  flips via `.finally()` (`6f46d8f`).

## NOT TESTABLE from Claude Code (owner / real devices)
Per the plan §3: device/OS/tablet matrix, real cellular throttling, on-device
battery/CPU/memory + crash profiling (no crash reporter wired — a SHOULD-FIX in its
own right), interruption testing, live authenticated per-user RLS probing (needs
test-user JWTs; A-1/A-2 were proven by policy+trigger+function analysis instead),
and builds/store submission (owner-GO only). These are owner/device tasks, not
PASS/FAIL-able here.

## Release Readiness Matrix
| Area | Verdict |
| --- | --- |
| Functional / navigation | PASS (delta verified; C-1 fixed) |
| Data integrity (DB constraints) | PASS |
| Progress/cert/achievement calc | PASS after B-1 fix (B-2 MED open) |
| Supabase RLS / authorization | **FAIL — A-1 CRITICAL** (analysis; live probe owner-side) |
| Secrets / client trust / logging | PASS |
| Auth / session | PASS with MED hardening filed (D-1/D-2/D-3) |
| Entitlement tiers | PASS |
| Production config | PASS except E-3 verify (release-gate) + E-1/E-2 deep links |
| Perf / UI / a11y / memory | PASS (prior audit + this session) |
| Device / crash / store | NOT TESTABLE here → owner/device |

## FINAL VERDICT: **NOT RELEASE READY**
One CRITICAL release-blocker remains: **A-1 — a student can forge certificates and
programs** by writing their own progress rows, because the award path trusts a
client-writable table. This is a security-model flaw that is exploitable at launch
regardless of today's zero-user count, so it blocks release.

**The single action that clears the blocker** is one small, owner-approved RLS
migration (four `own_*` policies ALL → SELECT, bundling A-1 + A-2). The client
already writes those tables only through SECURITY-DEFINER RPCs, so the change is
non-breaking; verify afterward with a full study→quiz→credential journey on device.
Plus the E-3 build-env verification (EAS production env vars) as a release-gate.

After A-1/A-2 are patched and E-3 confirmed, with the SHOULD-FIX items triaged,
the app would move to **RELEASE READY WITH ACCEPTED RISKS** (the remaining MEDs are
hardening, not blockers). No other CRITICAL was found; the app is otherwise
well-hardened.
