# Resume point — 2026-09-01 (owner restarting the machine)

Everything below is COMMITTED AND PUSHED to `origin/audio-tools-engine`
(head `0517cd1`). Nothing is in flight; no uncommitted work of mine exists.
The dirty files in `git status` (app.json, web/*, supabase/*, three docs) are
the OWNER'S own pre-existing edits from before this session — leave them.

## Restart checklist (both die with the machine)

| Step | Where 📍 | What |
|---|---|---|
| 1 | 📍 terminal in `C:\Users\profe\dev\ape-studio` | Phone Metro: `npx expo start --dev-client --clear` (port 8081) — run it as a background task Claude can read |
| 2 | 📍 same folder | Web preview: `expo-dev` from `.claude/launch.json` (port 8090) via preview_start |
| 3 | 📍 browser | Web tier: `localStorage.setItem('ape:dev:entitlement','academy')` + reload |

## ⚠ Owner action still outstanding

**Run `docs/APE_CALC_WEEKLY_LIMIT_5_2026_09_01.SQL`.** The calculator weekly
allowance is server-authoritative; the client now says 5 but the server still
enforces 10 until this runs. Safe to re-run (create-or-replace, no data
touched).

## DONE this session (owner decisions 1-3 of 7)

- **1 + 2 RATIFIED** (`088849b`): compressor example now says **9 dB** of gain
  reduction (with the subtraction shown so it can't drift back); RF link-budget
  example now **−47.2 dBm → 47.8 dB**.
- **3 DONE** (`0517cd1`): Calculator Laboratory is `alwaysFree` — opens for
  every tier, no lock glyph, no preview overlay (it had inherited the Advanced
  Training section's members-only lock; that, not the cap, was the real bug).
  Free allowance 10 → **5**, halfway nudge rescaled to `ceil(limit/2)` (it was
  hardcoded to fire at 5 and would have collided with the last-credit dialog),
  and all three cap dialogs now route through the confirm shim so they work on
  web. Plus the SQL above for the server side.

## NEXT — resume here, in this order

### Decision 4 — guest SAVE gating (owner chose: grey + 🔒 → membership)
Half-built. `useSaveGate()` was DESIGNED but NOT yet written to
`src/screens/tools/ToolLockUi.tsx` (grep returns 0 — start there). Shape:
```ts
export function useSaveGate(): { locked: boolean; label: (base: string) => string; prompt: () => void }
// locked = useToolsLocked(); label prefixes 🔒 when locked;
// prompt() = confirmDialog(MEMBERSHIP_REQUIRED, '…', 'See membership', → Paywall, { cancelText: 'Not now' })
```
Then wire 8 save controls — each has a handler to guard (early-return
`saveGate.prompt()`) and a label of the exact shape
`{justSaved ? 'SAVED ✓' : '<BASE>'}` → `saveGate.label('<BASE>')`:
| File | Handler | Label base | Note |
|---|---|---|---|
| SplMeterScreen | `onSaveLog` | SAVE LOG | label appears **twice** (full + small layout) |
| WaveformScreen | `onSave` | SAVE SNAPSHOT | |
| SpectrogramScreen | `onSaveSnapshot` | SAVE SNAPSHOT | |
| FrequencyCounterScreen | `onSave` ×2 (two scopes) | SAVE | both need the hook + guard |
| Rt60Screen | `onSave` (plain fn, not useCallback) | SAVE | GlassButton `label=` prop |
| RtaScreen | `onSaveTrace` | SAVE | dock action key `label:` |
| MultiMeterScreen | `confirmSnapshot` | SAVE | sheet button `<Text>SAVE</Text>` |

### Decision 5 — preview marking gate (owner chose: gate the client)
Central fix: in `src/features/lab/labCompletion.ts` `markLabUnit()`, early-return
when `getLabPreview().active` (from `src/features/lab/labPreviewStore.ts` — a
synchronous read, and preview mode only happens for non-members opening a
locked lab). `markLabReviewed` routes through `markLabUnit`, so it's covered.
No import cycle: labPreviewStore imports only react.

### Decision 6 — topic deep-linking (owner's fuller spec)
Three behaviors:
1. Tapping a **course/topic card** on the menu → Dashboard opens **that card's
   topic** loaded.
2. Bottom nav **[STUDY]** → always returns to the **last known topic** so the
   user continues where they were.
3. In **Enrollments**, the study icon inside a topic container → Dashboard with
   **that container's topic** loaded (per-container link).

Mechanism sketch: persist a pending target gs (e.g. `ape:pendingTopicGs`) at the
tap sites (`CourseSelectionScreen.openPublicCourse/openCourse/openTopic`,
Enrollments per-topic study icon); `DashboardScreen.load()` (~line 817, where it
computes `orderedIds` + `getLastTopicIndex`) consumes and clears it, overriding
the index when the gs is in the deck; STUDY tab keeps today's last-known
behavior. Note `switchMode` (DashboardScreen ~866) is currently DEAD CODE and
`setLastCourse`/`setLastPublicCourse` are written but never read — clean up or
use them. Honors the 2026-07-23 ruling: the deck stays the enrollment deck; only
the starting POSITION follows the tap.

### Decision 7 — guest = 100% wiped (owner: strict, includes ALL app settings)
My proposed KEEP-listing of `ape:settings` is **REJECTED** — do not do it.
Verify instead that the wipe is genuinely total for a no-account guest:
`src/features/account/clearLocalAccountData.ts` KEEP list currently spares
`ape:intro:*` and `ape:coach:*` (onboarding/coach-mark flags) — under the
owner's rule ("we don't remember ANYTHING until an account exists") those should
also be wiped for guests. `ape:deviceId` is device identity required by the
single-device security feature — keep it, but flag it to the owner. Dev-only
`ape:dev:entitlement` is `__DEV__`-gated and fine.

### Yellow batch — APPROVED, not started
FindFrequency "0 dB applied" verdict · schedule-stepper AM/PM carry · remaining
web-dead `Alert.alert` sites → `src/lib/confirm.ts` (library/exposure deletes,
gen-cap unlock, lapsed-card notice; AuthScreen takeover prompt LAST — its
Cancel path has a `signOut` side effect, needs care) · **root error boundary**
(any uncaught error currently white-screens the whole app) · guest Settings
honesty (status GUEST not FREE; hide Log out/DELETE/Student ID when
sessionless; "Sign in to manage notifications") · glossary term-row
button-in-button (device responder check first) · BPM dash above ~600 in
Sound/Tuner · Vd cm³ unit · MultiMeter catalog copy still says "Every level is
dBFS".

## NEW WORKSTREAM — feedback email system (owner, mid-session)

Not started. Owner wants:
- App feedback goes to **info@proaudiotrainingacademy.com**.
- Three intake aliases forwarding into it: **feedback@**, **corrections@**,
  **suggestions@** — each carrying metadata (app screen, ids, date/time,
  device, app version).
- **Gmail rules** bucketing each alias into its own processing bucket
  (all suggestions together, all corrections together).
- Owner wants this driven with **Claude in Chrome** against his already-signed-in
  Bluehost + Gmail (I never enter credentials; he stays logged in, I drive).
  Creating forwarders/filters = account-settings changes → confirm as we go.
- Code side: `src/lib/feedback.ts` line ~15 `SUPPORT_EMAIL` is currently
  `profechano@yahoo.com`; route by `FeedbackKind` to the three aliases and
  enrich the metadata block. Two open questions for the owner: send FROM three
  addresses vs one tagged address, and the final subject-line convention.

**IAP store setup: owner says "getting close but not yet."**
