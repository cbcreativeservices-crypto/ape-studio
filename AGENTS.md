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
- Decorative animation → `useDecorativeMotion()`. Value text → `fitValue()` (≥ 9 pt). Calc fields → a sign/range class; counts → `snapWhole`.
- Supabase calls are bounded at the client (src/lib/supabase.ts). Do not create another client.
Run the tests with `node --test --test-timeout=120000 "test/**/*.test.ts"`. Never edit package.json scripts (fingerprint risk). Catalog: docs/bughunt/PATTERN_CATALOG_2026_10_02.md.
