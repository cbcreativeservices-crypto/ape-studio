# Crowdsourced Microphone Catalog — Plan (Tier A + Tier B)

**Date:** 2026-08-21
**Status:** PROPOSAL for owner sign-off. Post-launch (Phase 3b). Nothing implemented.
**Owner decision:** approved the approach (Tier A + Tier B); this is the detailed Tier B plan with Tier A as its foundation.
**Depends on:** Phase 2 device-identity keying (D3) + the Android `MicrophoneInfo` record (C2) from [AUDIO_MEASUREMENT_CHAIN_PLAN_2026_08_21.md](AUDIO_MEASUREMENT_CHAIN_PLAN_2026_08_21.md).

---

## The core reframe (why this works)

Uncalibrated users can't give absolute truth — almost none own a calibrator or a measurement mic. So we do **not** crowdsource raw *measurements*. We crowdsource:

- **Tier A — device metadata** (automatic, zero-effort, no reference needed): what the *device itself reports*.
- **Tier B — calibration *offsets*** (opt-in, reference-gated): one number per user, aggregated into a **per-model median** that becomes a robust *starting* profile. Statistical truth from many noisy samples.

The product of both is a **three-tier device trust model** — **LAB → COMMUNITY → GENERIC** — that feeds the validity engine's "characterized vs generic" input and lets a brand-new install of a common phone start far closer to correct than `NOMINAL_OFFSET = 100`.

---

## Tier A — device metadata (the foundation)

Collected on first measurement run (with consent), zero user effort, **no reference required**:

| Field | Source |
|---|---|
| Device model + OS/build | `expo-device` / OS |
| Android `MicrophoneInfo` | manufacturer-**declared** sensitivity, frequency response, location/orientation, directionality, mic id/address, **DIRECT/PROCESSED** |
| Capture path actually chosen | `UNPROCESSED` vs `VOICE_RECOGNITION` (Android), `.measurement` honored (iOS) |
| Native sample rate, stable buffer | engine readback |
| Measured noise floor | a quiet moment during the session |

This is exactly the **Device Microphone Capability Record** (Phase 2 C2). Tier A alone materially improves factory starting profiles and the "characterized vs generic" tiering — even before a single offset is contributed.

---

## Tier B — crowdsourced calibration offsets (the detailed plan)

### 1. The contribution payload (what leaves the device)
Emitted **only** when a user finishes a calibration AND opts in for that contribution:

```
{
  contributionId: <random, anonymous, NOT an account id>,
  deviceKey: { model, osBuild, captureMode, gainState, micId, appProfileVersion },
  offsetDb: <the dBFS→SPL number the user set>,
  nominalStart: <what they started from>,
  referenceQuality: 'calibrator' | 'type1_2_meter' | 'consumer_app' | 'eyeballed',
  micInfo: <Tier A MicrophoneInfo snapshot>,
  noiseFloorDb, nativeSampleRate,
  createdAt
}
```

**Never sent:** raw audio (already our rule), account id, name/email, precise geo, device serial. No PII of any kind.

### 2. Aggregation (server/edge)
- Group by `deviceKey` (model + captureMode + gainState + appProfileVersion — a capture-mode or app change starts a fresh key so stale offsets never leak forward).
- **Robust stats, not mean:** MEDIAN offset + MAD (median absolute deviation) for spread; reject outliers beyond `k·MAD`.
- **Weight by `referenceQuality`** (calibrator > Type-1/2 meter > consumer app > eyeballed).
- **Publish a community profile for a key only when** it clears a bar: ≥ N contributions (start ~20–30), enough of them reference-grade, and MAD under a tolerance. Below the bar → the key stays GENERIC (`insufficient`).
- Published catalog row: `{ deviceKey → { suggestedOffsetDb, spreadDb, contributionCount, referenceMix, tier, lastUpdated } }`.

### 3. Device trust tiers (feeds the validity engine)
| Tier | Meaning | How it's used |
|---|---|---|
| **LAB** (gold) | We bench-characterized it (Phase 3 E1/E2) | Validated offset + `Cdevice(f)` may apply |
| **COMMUNITY** (silver) | Enough consistent contributions | Offered as a **starting** offset, never silently applied |
| **GENERIC** (bronze) | Unknown | Honest `NOMINAL_OFFSET` + "uncalibrated estimate" |

### 4. How a community profile is applied — **no-fake-corrections**
A community offset is a **suggested starting point**, surfaced in the calibration screen, never applied as truth:

> *"Community starting point for Pixel 8 Pro: **+X dB** (from N calibrations, spread ±Y). Tap to use, then verify against your own reference."*

The user still owns their calibration. The catalog **never** presents itself as certified, always shows tier + count + spread, and this stays inside the existing honesty governance (dBA/dBC, "approximate always"). A wrong crowd number is worse than none — hence the reference-quality weighting, the outlier rejection, and the publish bar.

### 5. Governance / consent / privacy — **the gating decision**
- **Opt-in per contribution.** After calibrating: *"Contribute this calibration anonymously to help others with your phone?"* — showing the exact payload. Default **OFF**. Plus a persistent settings toggle.
- **Anonymized:** random `contributionId`, no account link, no PII, no audio, no precise location.
- **The off-device path** is the real decision: today calibration is *device-local only* and the backend is forbidden from holding calibration. Tier B needs an upload path. Two options:
  - **(a)** A **narrow, dedicated anonymous-contributions table/endpoint**, isolated from user/account data. (The "no calibration in the DB" rule was about *account-linked user* calibration; anonymous aggregate *device* data is arguably a different category — but this needs an explicit governance ruling to amend the stance.)
  - **(b)** A **separate lightweight service** (e.g. a Supabase edge function) that only ingests anonymous contributions and serves the aggregated catalog, keeping the main frozen backend untouched.
- This is a **"publishing user data" action class** → it must not ship without the consent flow + a governance ruling.

### 6. Client UX
- Post-calibration opt-in prompt (payload shown).
- Calibration screen offers the community starting point when one exists for the device key.
- Settings: *"Contribute anonymized calibration data"* (default off).
- Catalog is fetched + cached; works offline on last-known.

### 7. Data integrity / anti-abuse
- Reference-quality weighting + `k·MAD` outlier rejection.
- Per-device dedupe / rate-limit (one device can't spam the median).
- Schema-versioned; re-aggregate on `appProfileVersion` change (a capture-path change invalidates old offsets).
- A device that later reports different `MicrophoneInfo` → new key (guards against a silent HW/OS change corrupting a profile — the same lesson as the per-model iPhone finding).

---

## Build order (MVP → full)

| Step | What | Depends on |
|---|---|---|
| 1 | **Tier A record** (client-side Device Microphone Capability Record; no upload yet) | Phase 2 C2/D3 |
| 2 | **Consent flow + upload** (opt-in prompt, settings toggle, the chosen backend path) | governance ruling |
| 3 | **Aggregation service** (median/MAD, weighting, publish bar) | step 2 |
| 4 | **Community starting-point UX** (offer in calibration screen; trust-tier labels) | step 3 |
| 5 | **Feed trust tier into the validity engine** (LAB/COMMUNITY/GENERIC) | Phase 1 validity |

Tier A (step 1) can begin as soon as Phase 2's device-identity work lands — it's the same record. Steps 2+ are gated on the backend/consent decision and are firmly post-launch.

---

## Open decisions for the owner
1. **Backend path (the big one):** amend the frozen backend with a narrow anonymous-contributions table (5a), or a separate ingest/serve service (5b)? This touches the frozen-backend + "no calibration in the DB" governance and needs a ruling.
2. **Consent default:** opt-in per contribution, default OFF (my strong recommendation) — confirm.
3. **Publish bar:** minimum contributions (~20–30?) and reference-quality mix before a community profile goes live.
4. **Geo:** collect any coarse region, or nothing? (I recommend nothing — stays clean.)
5. **Incentive:** nudge contribution ("help improve accuracy for your phone"), or purely passive opt-in?

---

## How this composes with the rest
- Reuses **Phase 2** device-identity keying (D3) + `MicrophoneInfo` (C2) — Tier A *is* that record.
- Feeds **Phase 1** validity engine (the trust tier is a new validity input).
- Complements **Phase 3** bench characterization: bench = LAB/gold tier + the ground truth that validates community medians; crowdsourcing = broad COMMUNITY/silver coverage the bench never could reach. Turns Android fragmentation into a compounding moat.
