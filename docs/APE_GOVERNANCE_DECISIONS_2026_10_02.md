# AP&E — governance decisions, 2026-10-01 → 2026-10-02

Continues `APE_GOVERNANCE_DECISIONS_2026_09_25.md` (D23–D43). Numbering carries
on at D44. Engineering lessons from the same days live in
`APE_ENGINEERING_LESSONS.md`. This file records what was DECIDED.

---

## D44 · Refund ends membership the same day; cancel ends it at the end of the paid cycle

**Owner:** *"refund CANCELS subscription same day. ALWAYS. there is no grace
period"* — *"for annual or monthly cancellation means membership ends at end of
cycle period"* — *"refund stops immediately - they didnt pay so there is no
period of time expected."*

**Ruled:**
- **Refund (Apple or Google, with or without revoke):** the entitlement is set to `status='refunded'` and `member_since` is cleared on the day the store reports it. A refunded account is not a member.
- **Cancel:** renewal stops, and access runs to `expires_at`.
- **Certificates:** a refund revokes the certificates earned during the refunded membership. This is store-notifications v5, deployed by A (3fdbebec). An exam submitted after a refund awards nothing; that needs the owner's SQL paste (Downloads/2026-10-02_REFUND_CERT_FIX).
- **Client:** the app re-reads the tier every time it returns to the foreground, and arms a timer that ends access at `expires_at`.

## D45 · Guest work carries to the account signed into in the SAME session

**Owner:** *"if in same session guest signs in then current session is saved and stored."*

**Ruled:**
- **What carries:** lab work a guest does in one app session (credit, pages, answers, notes, saved designs) is written to the account they sign into before closing the app.
- **What never carries:**
  - work done in a members-only preview;
  - work to a different identity after a sign-out;
  - work from before a relaunch.
- **Mechanism:** `src/features/lab/sessionCarry.ts`.
- **Study progress done without an account** still does not transfer, and the Paywall says so.

## D46 · Drum Tuning Lab lives in Pitch & Tuning

**Owner:** *"no put it in Pitch & Tuning."*

**Ruled:**
- Placement: members-only, with preview behaviour like Mastering and Room Design.
- Sound: a physically modelled membrane synth (no recordings yet).
- Recordings: the drum-tuning recording add-on (DRM-00…09) is drafted for the engineer and not yet sent.

## D47 · Bugs are closed by PATTERN, in one shared place, with a guard test (Option A)

**Owner:** *"look for patterns … then go systematically through the whole app"* —
then *"do option a"* (shared fixes over per-site fixes).

**Ruled:** the house helpers below are the ONLY accepted way to do these things. Each has a ratchet test that fails when the mistake is written again, and every ratchet allowlist may only shrink.

| Job | Use | Guard test |
|---|---|---|
| Device-local saved data | `createLocalStore` (`src/features/storage/localStore.ts`) | `localStoreGuards_20261002`, `accountWipeRegistry` |
| Starting any sound | `startFenced` / `armFence` (`src/features/audio/startFenced.ts`) | `startFence20261002` |
| Any Supabase call | the bounded fetch in `src/lib/supabase.ts` (`createBoundedFetch`) | `supabaseFetchBounded` |
| Leaving a screen | `safeGoBack(navigation)` (`src/lib/safeGoBack.ts`) | `patternP9b_20261002` |
| Android BACK | `useBackWhileFocused` (`src/lib/useBackWhileFocused.ts`) | `patternP13_20261002` |
| Opening a modal screen from a dialog or popup | `useModalHandoff` / `opensModalScreen` (`src/lib/confirm.ts`) | `patternP5_20261002` |
| An async button | `useLatchedPress` / `createInFlightLatch` (`src/lib/latch.ts`) | `patternP9_20261002` |
| Membership-dependent behaviour | `useTier()` (`src/features/commercial/tier.ts`) | `patternP8_20261002` |
| "Saved" / ✓ claims | gated on a write result | `patternP6_20261002` |
| Decorative animation | `useDecorativeMotion()` (`src/features/settings/decorativeMotion.ts`) | `patternP10b_20261002` |
| Value text that may not fit | `fitValue(fontSize)` (`src/theme/legibility.ts`) | `patternP14_20261002` |
| Calculator fields and results | a sign/range class on every field; `snapWhole` for counts | `patternP16_20261002` |

The catalog of record is `docs/bughunt/PATTERN_CATALOG_2026_10_02.md`.

## D48 · Consistency and learning outcomes decide the open calls

**Owner:** *"do all of your recommendations - favor consistency, and learning outcomes."*

**Ruled:**
- **Animation:**
  - Under Reduce animations AND under Low-Light, every DECORATIVE loop stops.
  - A display whose moving image IS the lesson (Harmonograph, oscilloscope trace, wave pulse, MicCutaway) keeps running.
  - Self-starting rigs with a designed still version (the Amp rig, the Harmonics playhead) count as decorative.
  - Lesson displays that already go still under Reduce animations stay still, for accessibility.
- **"SEE WHAT'S LEFT":** every module-lab hub has it (Meter, Cymatics, Digital, EQ, Gain, Wave, Amp).
- **Hearing exposure screen:** it says when earlier listening today could not be read.
- **Careers:** collapsed rows show "PE LICENSE" / "DEGREE REQ.", like "LICENSED".
- **Gear art:** the "FIRE ALARM" sticker stays as drawing texture, like the gearArt panel legends.
- **Calculators:** the corrections are approved (FIR taps 801→800, treatment panels 24→23), and so are the refusals of fractional counts and out-of-range input.

## D49 · Publish path for 2026-10-02: submit builds 33 / 16, then update

**Owner:** chose *"Submit 33/16, then update."*

**Ruled:**
- **Why:** testers ran iOS 32 / Android 15. The 2026-10-02 code only fits the runtimes of iOS 33 (e8e3455b) / Android 16 (22976b0e), because of the headphone-unplug native change.
- **Published:** the OTA was published to `production` and `preview` for those runtimes.
- **Submitting** is the owner's or A's act (`eas submit`), never ccode's, without an in-the-moment go.
- **Status:** everything since that OTA (the pattern hunt waves 1–4) is committed and pushed, NOT published.
