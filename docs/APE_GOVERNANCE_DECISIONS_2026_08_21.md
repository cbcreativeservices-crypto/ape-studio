# APE Governance Decisions — 2026-08-21

Owner-ratified rulings from the measurement-chain + customization session.
Source plans: `AUDIO_MEASUREMENT_CHAIN_PLAN_2026_08_21.md`,
`CROWDSOURCED_MIC_CATALOG_PLAN_2026_08_21.md`.

---

## R1 — Measurement continuity & validity (Phase 1, SHIPPED)

The quality system gains two flags and a continuity discipline:

- **`capture_dropout`** (severity **caution**): the stream dropped/overran samples
  this capture — instantaneous readings survive, but held/integrated values
  (peak-hold, Leq, exposure) are suspect. Driven by the engine's monotonic
  per-capture `droppedFrames` counter.
- **`dead_input`** (severity **invalid**): the startup capture-health probe
  (first ~0.5 s of every fresh capture) found a stuck/dead input — constant
  samples with callbacks still arriving (distinct from `captureStalled` = no
  callbacks). Exposed as `getInfo().health.{inputStuck, dcOffset, probeReady}`.
- **Continuity rule:** time-integrated results must not silently span a gap.
  RT60 baselines `droppedFrames` at ARM (a pre-ARM dropout cannot poison a clean
  re-armed capture — same discipline as `clipRuns`); the Listening Exposure
  Monitor latches `hadGap` per session and DISCLOSES the dose as a conservative
  estimate. Window-scoped tools must baseline session-cumulative counters at
  their own capture start.
- Native hardening shipped with this: QoS-elevated analysis worker (iOS
  USER_INITIATED / Android setpriority) and an adaptive Oboe input buffer that
  grows one burst on new OS-reported xruns (continuity outranks a few ms of
  display latency).

## R2 — Community Microphone Catalog (consent + no-fake-corrections)

Owner approved Tier A (device metadata) + Tier B (calibration-offset
contributions). Binding rules:

1. **Opt-in, default OFF**, per-contribution consent with the payload disclosed;
   revoking consent clears anything queued. Settings toggle: "COMMUNITY MIC
   CATALOG".
2. **Anonymous by construction** — random contribution id; never an account id,
   PII, audio, or location. Reference quality (calibrator / SPL meter / consumer
   app / eyeballed) is captured and weights aggregation.
3. **Backend exception (narrow):** the frozen-backend / "no calibration in the
   DB" rule is AMENDED for this feature only — an isolated, anonymous,
   INSERT-only table (`mic_calibration_contributions`) plus a privacy-safe
   aggregated view (`mic_catalog_public`, trusted-reference MEDIAN, publish bar
   ≥10 trusted). Raw rows are never client-readable. That rule remains in force
   for account-linked user calibration. Migration: `docs/MIC_CATALOG_2026_08_21.sql`
   (OWNER runs it; the feature is inert until then; post-launch, not
   launch-blocking).
4. **No-fake-corrections:** a community offset is a *suggested starting point*
   ("Community start: +X dB · N calibrations — tap to use, then fine-tune"),
   never silently applied, never presented as certified. Device trust tiers:
   LAB (bench) → COMMUNITY → GENERIC.
5. Device identity: Android model via PlatformConstants, iOS hardware model via
   uname (`getInfo().model`), Android `MicrophoneInfo` (manufacturer-declared,
   may be unknown, never a calibration substitute) via `getMicrophoneInfo()`.

## R3 — Member customization: COLOR COMPLETE; skins are owner-personal

- Colour customization (member-only, discreet wheel, gate popup for
  non-members) is COMPLETE across the approved scope: waveform trace, RTA bars,
  LED meter (level fill: loudness ramp / 4 schemes / flat + average marker),
  tuner in-tune colour. A full-spectrum hue-wheel picker ("＋ SPECTRUM") joins
  the curated swatches everywhere.
- **Auto-off rule:** picking a custom colour automatically disables the COLORS
  level-ramp toggle so the choice shows immediately — the user must never have
  to turn COLORS off manually first.
- The member recolour remains the sanctioned exception to the amplitude-ramp
  standard, for the MOVING visual only; readout text, spectrogram, and RT60
  stay on the standard. White peak-hold caps and the purple-by-default average
  marker keep reference roles (avg is recolourable; the cap is not).
- **SKINS (VU/tuner faces): the owner builds these personally.** Four mockup
  directions (vintage cream, black modern, blue studio, brushed metal) were
  approved as reference. Assistants do not build skins unless explicitly asked.

## R4 — RTA resolution & averaging

- **HI-RES mode** (RESOLUTION STD/HI-RES): doubles the FFT 8192 → 16384 — the
  existing Q5 ceiling, which is REAFFIRMED as the cap — halving bin width so
  1/6-oct sub-bass bands resolve to ~30 Hz. The meta line always discloses the
  live FFT size; the slower response is disclosed in the settings note.
- Grayed low-frequency bands are a RESOLUTION limit (band narrower than a bin),
  not a microphone limit — a better/external mic does not change them; external
  mic support remains future work under the capture-contract plan.
- **5 SEC** averaging option added (α 0.016) alongside FAST/MED/SLOW.
- The RTA display is **no longer tap-to-START/STOP** (accidental freezes);
  START/STOP is the explicit button only.

## R5 — Fullscreen exit discipline (ghost-flash fix)

A landscape-only fullscreen must not unmount before the OS finishes rotating
back to portrait: close enters a CLOSING phase (opaque cover stays up, content
hidden, 700 ms fallback) and unmounts only when the window is actually portrait.
Applied to Full VU, fullscreen gauge, fullscreen readout, and Waveform. Any new
landscape fullscreen must follow the same pattern.

## R6 — Build & tooling hygiene

- `.easignore` added (EAS upload 819 MB → fraction; it REPLACES .gitignore for
  uploads, so it mirrors the standard ignores — keep in sync).
- Metro `blockList` (ROOT-anchored — a bare `/web/` pattern would break
  node_modules resolution) excludes `web/`, `audio_app_archive/`,
  `machineA_ingest/`; fixes the watcher crash from `web/.next` cache paths.
- Expo SDK 57 packages updated to current patch versions (expo 57.0.15, RN
  0.86.2, reanimated 4.5.1, screens 4.26, worklets 0.10.1, dev-client 57.0.14).
  Native-module patch bumps fully land with the next dev build.
- Dev builds 2026-08-21 (both platforms) compiled GREEN with the Phase 1 native
  batch + catalog native additions.

## Outstanding (owner)

1. Run `docs/MIC_CATALOG_2026_08_21.sql` (whenever; pre-catalog-launch).
2. Device pass: NO INPUT probe, dropout caveat, fullscreen-exit fix, LED/tuner
   colours + spectrum wheel, contribute prompt, Pixel capture feel.
3. Pre-launch (already tracked): remove the KT88 promo tube; VU change orders
   3–12 tabled; Phase 2 calibration scaffolding deferred until commit.

---

# Launch-Triage Session — 2026-08-21 (PM)

Full-code launch triage separating true engine gates from assets/polish. Detail
+ file:line in `docs/APE_LAUNCH_TRIAGE_2026_08_21.md`; this section records the
rulings. All code changes typecheck clean (`tsc --noEmit`).

## R7 — Six engine gates fixed (were tester-blocking)

- **E1** EAS env vars were entirely absent → any cloud build would boot-crash;
  `EXPO_PUBLIC_SUPABASE_URL/ANON_KEY` added to all three environments. **DONE.**
- **E2** Password reset was a black hole (no URL scheme). Ruling: in-app OTP
  recovery (`verifyOtp type:'recovery'` → `updateUser`), no deep link. Requires
  the Reset Password email template to carry `{{ .Token }}`. **DONE.**
- **E3** Duplicate-achievement 0% wedge (gs3060 Professional Audio Safety, an
  auto-enrolled free topic): the Dashboard item-count now mirrors the study
  fetch's sibling-name union so the denominator is never falsely 0.
- **E4** No-scenario topics could never satisfy the quiz gate. Ruling: a topic
  CONFIRMED empty (homework loaded, zero questions) is marked exempt
  (device-local `scenarioExempt` store) and satisfies the scenarios term; a load
  ERROR never exempts. Meter shows 100% for exempt topics.
- **E5** Non-network study-progress rejections were dropped silently. Ruling:
  enqueue to the durable queue on any rejection (one durable retry; replayQueue
  stays the poison-drop arbiter). `record_scenario_answer` / `credit_time_trial`
  gained the missing `{error}` checks (supabase-js returns, never throws).
- **E6** Empty study screens (Matching / FIB / Quiz) trapped users on a
  header-less stack → now show a Back exit.

## R8 — Access / promo codes are a LAUNCH feature (frozen-backend amendment)

Owner ruling: the access/promo code is NOT vestigial — it comps free Academy
accounts (influencers), bulk seats, and event/convention offers, and must ship
at launch. Narrow amendment to the frozen backend (mic-catalog precedent):
`access_codes` + `access_code_redemptions` tables + `redeem_access_code()`
SECURITY DEFINER RPC (`docs/APE_ACCESS_CODES_2026_08_21.sql`, RUN 2026-08-21).
GRANT/comp codes are functional now; DISCOUNT codes return `discount_pending`
until the IAP checkout flow exists. Client: redeem on Create Account + Settings →
MEMBERSHIP.

## R9 — Two gating idioms are DELIBERATE, now centralized

`caps.*` = bypass-aware ladder (lock-free screen testing); real academy standing
= member-perk / training gates kept lockable so the owner can test the FREE
experience under caps-bypass (per ToolLockUi). Not a bug — but centralized into
one documented `EntitlementProvider.isMember` (real standing, NOT bypass-aware);
~11 ad-hoc sites now consume it. Behavior-neutral.

## R10 — No fabricated credentials

The Directory Registry ID / verification URL / issue date and the Profile
Student-ID QR were hardcoded/fabricated (same ID for every user, server sync
pending). Ruling: show an honest "pending issuance" state — never present a
fabricated, verifiable-looking credential. Real values fill in when the Registry
backend ships.

## Outstanding (owner) — launch-triage

1. Device pass on the fixed flows (password reset, gs3060 unlock, scenarios
   exemption, empty-topic exits, promo redemption, pending credentials).
2. IAP purchase path — the one remaining PAID-launch blocker; turnkey notes in
   the triage doc (backend is purchase-ready; use react-native-iap + a
   validate-purchase edge function; no RevenueCat needed).
