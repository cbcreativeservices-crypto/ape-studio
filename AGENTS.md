# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## BUILD RULE (owner, 2026-09-05, after two violations — "I ALWAYS WILL TELL YOU EXPLICITLY WHEN I WANT TO START A BUILD")
NEVER run `eas build` (any profile, any platform), `eas submit`, or any other billed/external action on my own reading of a message. "We need to build", "then build new versions", a task list, a deadline, a demo — NONE of these are the cue. The ONLY cue is the owner saying, in that moment, in their own words, to start the build now. When work reaches the build step: ask ONE line, then WAIT. Written in nine places at the owner's instruction so it is never missed.


## HOUSE HELPERS — use them, never hand-roll (governance D47, 2026-10-02)
Each one closes a bug class app-wide, and a ratchet test fails if you bypass it. Ratchet allowlists may only SHRINK.
- Device-local saved data → `createLocalStore` (src/features/storage/localStore.ts). A failed read is UNREADABLE and is never overwritten.
- Starting any sound → `startFenced` / `armFence` (src/features/audio/startFenced.ts).
- Leaving a screen → `safeGoBack(navigation)` (src/lib/safeGoBack.ts). Android BACK → `useBackWhileFocused`.
- Modal screen from a dialog/popup → `useModalHandoff` or `opensModalScreen` (src/lib/confirm.ts). Async button → `useLatchedPress` (src/lib/latch.ts).
- Membership decisions → `useTier()` (src/features/commercial/tier.ts). "Saved"/✓ only from a write result.
  - Gating members-only content → `useMemberGate()`: open | locked | checking | unconfirmed. Content opens only on 'open'; a 🔒 or upsell shows only on 'locked'; 'checking' reads "Checking your account…"; 'unconfirmed' reads `MEMBERSHIP_NOT_CONFIRMED` (D52).
  - Upsell copy → `useUpsellAllowed()`. Guest WORDING ("not signed in") → `useGuestWording()`. Never decide either from `resolved` alone.
  - Session reads that must tell "stalled" from "signed out" → `safeSessionResult()` (src/lib/getSessionSafe.ts).
- A list screen has three faces: loading / UNREADABLE / truly empty. A failed read is never shown as "nothing saved". A screen that saves a whole object never saves before it has loaded.
- Calc physical references come from one shared constant (calcUnits.ts: `DBU_REF_V`, `P_REF_PA`). An impossible result (negative length, a gauge past 4/0, …) is refused or explained in words, never printed as a number (D53).
- Decorative animation → `useDecorativeMotion()`. Value text → `fitValue()` (≥ 9 pt). Calc fields → a sign/range class; counts → `snapWhole`.
- Supabase calls are bounded at the client (src/lib/supabase.ts). Do not create another client.
- "Later, off the render path" → `runSoon()` (src/lib/afterInteractions.ts): a real macrotask, or `{ idleTimeoutMs }` for pre-warming. Never `InteractionManager` (a same-tick microtask stub in RN 0.86, removed in SDK 58; ratchet). Never open a SQLite database at module scope — open on first use.
- Guest work → it is EPHEMERAL (D57). The guest wipe keeps only `GUEST_KEEP` (meters, device id, intro flags; `keepsThroughWipe` in clearLocalAccountData.ts). Same-session carry → `holdSessionWork`; a removal after sign-in → `releaseSessionWork` (src/features/lab/sessionCarry.ts). Never treat an UNKNOWN session as a guest.
- Guest "not saved" reminders → `GuestStartReminder` / `remindAsGuest(tier, useGuestWording().guest)` (src/features/lab/). One popup per activity per session; an inline note in Low-Light.
- A popup that must wait for another surface (intro, welcome) → a `hold` prop plus `rootModalHoldMs`; never present during a dismiss (`useScreenIntro().owed`).
- Design and lab builds run on Opus 5.5 at HIGH effort, only after the owner's explicit go (D56).
Run the tests with `node --test --test-timeout=120000 "test/**/*.test.ts"`. Never edit package.json scripts (fingerprint risk). Catalog: docs/bughunt/PATTERN_CATALOG_2026_10_02.md.
