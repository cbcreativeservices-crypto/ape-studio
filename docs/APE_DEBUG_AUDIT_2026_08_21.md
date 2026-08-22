# APE Debugging Audit — 2026-08-21 (PM)

Owner-requested risk sweep: known issues/bugs common to apps on this exact stack
(individually and in combination), verified against the real code. Five parallel
auditors covered distinct failure domains. SIMPLE+SAFE fixes were applied (all
typecheck clean, `tsc --noEmit` exit 0); everything else is listed for owner
decision below.

**Stack audited:** React 19.2.3, react-native 0.86.2 (New Architecture / Fabric
ON), expo 57.0.15, reanimated 4.5.1 + worklets 0.10.1, @shopify/react-native-skia
2.6.2, react-native-screens 4.26, @supabase/supabase-js 2.110, expo-sqlite 57,
@react-native-async-storage/async-storage 2.2, react-native-view-shot 5.1,
react-native-svg 15.15, expo-speech-recognition ^56.0.1, react-native-keyboard-controller 1.21.9.

**Headline:** the codebase is unusually disciplined — most classic pitfalls
(orientation restore, modal+orientation iOS crash, deep-link scheme, div-by-zero,
raw-string renders, svg gradient-id collisions, animation/listener teardown, RN
supabase token-refresh) are ALREADY handled correctly. The real defects clustered
in persistence/data-integrity and the supabase entitlement read.

---

## ✅ APPLIED — SIMPLE + SAFE (this commit)

| # | Fix | Severity | Files |
|---|-----|----------|-------|
| A | **Cross-account offline-queue contamination.** SQLite study/quiz queues carry no user id and were NOT cleared on account switch → User A's queued batches replayed under User B (wrong-account credit). Added `clearQueuedBatches`/`clearQueuedSubmissions`, called from `resetAllLocalStores`. | DATA-LOSS / integrity | studyQueueStorage.native.ts + .ts, submissionQueueStorage.native.ts + .ts, clearLocalAccountData.ts |
| B | **`scenarioExempt` clobber.** `markScenariosExempt` wrote without hydrating first → could overwrite the stored set with one id (lost exemptions → quizzes re-lock). Now hydrates first. | DATA-LOSS | scenarioExempt.ts |
| C | **`replayQueue` poison-parse wedge.** `JSON.parse(events_json)` ran outside the try, so a corrupt row threw before the drop logic — wedging the queue AND aborting the live flush every cycle. Parse now guarded; bad group dropped. | HANG | sync.ts |
| D | **Unguarded `JSON.parse` (×4).** Corrupt stored values could throw — notably in the SIGNUP migration path (blocking account creation). Guarded: commercialAuth favorites migration, Dashboard `learnIntrosSeen`, Glossary `recent`, Flashcards local prefs (bad pref no longer surfaces as "could not load topic"). | CRASH / UX | commercialAuth.ts, DashboardScreen.tsx, GlossaryScreen.tsx, FlashcardsScreen.tsx |
| E | **Uncleared auto-advance timers (×3).** Matching's timer fires `LayoutAnimation.configureNext`, which is GLOBAL — after unmount it animated the NEXT screen's layout on Fabric. All three now tracked + cleared on unmount, deferred work gated by a mounted ref. | UX / LEAK | QuizScreen.tsx, MatchingScreen.tsx, FillInBlankScreen.tsx |
| F | **Dashboard `load()` async-after-unmount.** setStates after `await` with no mounted guard (logout during a slow fetch). Guarded. | LEAK | DashboardScreen.tsx |
| G | **Entitlement read demoted paying members.** The `entitlements` read ignored `error` (dead catch) → a transient RLS/network blip silently downgraded an academy member to free; and it took row `[0]` with no `.order()` so an old expired row could read as lapsed. Now: don't downgrade on error, and scan ALL rows for any active+non-expired ⇒ academy. Applied to both the effect and `refreshEntitlement`. | DATA-LOSS / UX | EntitlementProvider.tsx |
| H | **Enrollment sync silent failure.** `sync_my_enrollments` error was discarded (dead catch); a failed FINAL sync left the server master list (which gates v3 study/quiz) stale with no retry. Now checks `error` + bounded exponential backoff retry. | DATA-LOSS | enrollmentStore.ts |
| I | **Quiz options unchecked casts.** `question.options as MatchingOptions`/`as string[]` then `.lefts.map`/`.map`/`.filter` — a malformed RPC payload would crash the render. Added runtime shape guards (bad payload renders empty, not a crash). | CRASH (latent) | QuizScreen.tsx |
| J | **Empty `IN ()` guard** on `deleteQueuedBatches` (invalid SQL if ever called with []). | LATENT | studyQueueStorage.native.ts |

---

## 🟡 NEEDS DECISION — for the owner (ranked)

### Medium

1. **`expo-speech-recognition@^56` on an SDK-57 project.** The only expo pkg off
   the `~57` line — an SDK-56 native module in an SDK-57/RN-0.86 host can crash at
   native init or first call. It's used for glossary dictation and is GUARDED at
   entry (try/require → renders no mic if the module throws at import), so a
   *missing* module is safe; the residual risk is a *present-but-mismatched*
   module in a build that bundles it. **Action:** `npx expo install expo-speech-recognition`
   to pull an SDK-57-aligned version if published; otherwise keep the guard and
   device-test dictation on a build that actually bundles it before relying on it.
   Files: package.json, app.json plugin, GlossaryDictation.tsx.

2. **Stores stale after account switch (in-memory not reset).** These persist an
   `ape:*` key (so a cold launch is correct) but are NOT in `resetAllLocalStores`,
   so the PREVIOUS user's value shows until relaunch: `deckOrderStore`
   (`ape:deckOrder`), `settings/store` (+ its `hapticsOn`/`micReleaseOnBackground`
   module mirrors), `calcPrefs`, waveform/color prefs, glossary recent. No server
   data leak — visual staleness only, most visible on a shared device. **Decide**
   which deserve a `resetLocal()` added to the switch path.

3. **`npx expo install --check`.** Confirm the non-expo native deps (skia 2.6.2,
   reanimated 4.5.1, worklets 0.10.1, keyboard-controller 1.21.9, view-shot 5.1)
   are all flagged compatible with RN 0.86 / React 19.2 before the next build. No
   in-code incompatibility was found; this is a one-command verification.

### Low

4. **`measurementStore` device-vs-account semantics.** `ape:toolMeasurements` is
   documented "device-local, tied to the mic" yet is wiped on every account switch
   → the saved-measurement library is destroyed on user switch. Confirm intended
   (defensible as personal data, but contradicts the "device-local" framing).

5. **EntitlementProvider double-derive on cold start.** The effect calls
   `getSession().then(deriveAndApply)` AND subscribes to `onAuthStateChange`
   (which fires `INITIAL_SESSION`) → two entitlement reads + two local-wipe passes
   per launch (benign — guards make it idempotent). Could rely on `INITIAL_SESSION`
   alone. Left as a decision because the cold-start seed ordering is delicate.

6. **SQLite queues have no column migrations.** Both queue tables use only
   `CREATE TABLE IF NOT EXISTS`; if a row shape ever gains a column, upgraded
   installs won't `ALTER` and inserts will throw. Add a `PRAGMA user_version`
   migration step before any future queue-shape change.

7. **Hydration races** in `lastStudyLocation.ts`, `paceStore.ts`,
   `exposureMonitor.ts` — they set `hydrated = true` BEFORE awaiting the read, so a
   write landing mid-load can be overwritten by the stale stored value (low
   likelihood). Sibling stores that flip the flag AFTER the await
   (enrollmentStore, homeCardsStore) are the correct pattern to port.

8. **MatchingScreen card-collapse uses `LayoutAnimation` `delete`+`opacity`** —
   the least-reliable LayoutAnimation path on Fabric (mount/unmount animations are
   the buggy ones; `update` is reliable). Works today; the after-unmount global
   fire is already fixed (E). Optional: migrate to a Reanimated `Layout`/exiting
   animation (app already depends on Reanimated 4).

9. **Dead `react-native-qrcode-svg` dependency** — installed, never imported (only
   a stale comment references it). Remove from package.json if QR isn't near-term,
   or wire it.

10. **Dead `try/catch` cosmetics** around `.single()` on `users`
    (dashboard/api.ts, commercialDashboard.ts) and several read-only selects with
    unchecked `error` (profile completeCount, settings user select, TrophyScreen,
    glossary fetchDetails) — all currently guarded/defensive, so behavior is
    correct; the dead catches are just misleading. Cosmetic cleanup only.

11. **`deviceProfile` crowdsource queue swept on account switch** — anonymous,
    device-keyed queue is minor data loss on switch (consent reset to OFF is the
    correct privacy default). Note only.

12. **`exposureMonitor` app-lifetime AppState/output listeners** never removed —
    by design (single root singleton, `booted` guard). Leave as-is; flagged only
    so it's not mistaken for a miss.

---

## ✔ Verified CLEAN (checked, no action)

RN supabase token-refresh (startAutoRefresh/stopAutoRefresh wired to AppState);
url-polyfill import ordering; `.single()`/`.maybeSingle()` usage; empty `.in()`
(supabase emits `in.()` = zero rows, guarded anyway); all auth subscriptions
unsubscribe; mic/DSP warm session (generation counter, both cleanups); RAF loops;
`withRepeat(-1)`/`Animated.loop` teardown; no `findNodeHandle`/`setNativeProps`;
`setLayoutAnimationEnabledExperimental` correctly Android-guarded; Skia SKIA_READY
web fallback + no per-frame allocation; view-shot `collapsable={false}`; svg
`.svgrrc` `svgo:false`; keyboard-controller Fabric provider + safe fallback; no
`<Modal supportedOrientations>` (prior iOS crash gone); orientation lock/restore +
R5 closing-phase pattern; no deep-link-scheme reliance; div-by-zero guards; Set/Map
serialization; NaN/undefined not persisted; no StrictMode (React 19 double-invoke
not active); device-hardware KEEP allowlist (`ape:splCalOffset`) + onboarding-flag
preservation correct.
