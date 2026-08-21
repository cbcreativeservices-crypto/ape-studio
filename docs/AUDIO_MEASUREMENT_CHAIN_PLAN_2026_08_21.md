# Audio Measurement Chain — Plan (grounded audit + fry order)

**Date:** 2026-08-21
**Source:** Owner's "Audio Engine Research" doc (20 recommendations) mapped against the **actual `ape-dsp` v7 engine** via a 4-way code audit (native RT path · capture contract · shared DSP/precompute · calibration/validity).
**Status:** PROPOSAL for owner sign-off. Nothing here is implemented yet.

---

## TL;DR

The research's core thesis — *stop treating the phone as `mic → number → analyzer`; treat it as a **validated capture chain*** — is correct and already our house instinct (no-fake-meters, dBA/dBC honesty, one-warm-mic-stream).

The audit's headline: **most of the hard, correctness-critical foundation is already built.** The remaining work is **depth** — device identity, a second (frequency-response) calibration term, a richer validity signal, a startup health probe, and integration-integrity fixes — plus a **long-game device-characterization program**. This is not an engine rebuild.

---

## What's already fried (do NOT rebuild — lock these as invariants)

| Recommendation | Reality in `ape-dsp` v7 |
|---|---|
| #1 iOS `.measurement` mode | **Set AND verified** post-activation (`ApeDspModule.swift:409,463`); surfaced as `processedInput`. |
| #1/#2 Android raw path | Requests Oboe **`UNPROCESSED`**, gates on the OS support property, **reads the preset back to confirm**, falls back to **`VOICE_RECOGNITION`** — never silent `DEFAULT` (`ApeDspModule.kt:149`, `ApeDspJni.cpp:232,253`). |
| #4/#12 actual sample rate | Requested → **read back** → every coeff (A/C weighting, ballistics, pitch, RT60, FFT bins) derived from the **actual** hardware rate. Capture at native rate; OS resampling disabled. |
| #9 one mic → one engine → many views | ONE SPSC ring + ONE analysis thread + **ONE FFT/tick** feeding RTA + spectrogram + harmonics + RTA-piano; SPL is time-domain; tuner is YIN. No tool re-captures or re-transforms natively. |
| #10 RT callback does nothing | Both callbacks = mono-mix into a **preallocated lock-free SPSC ring** + return. No alloc/lock/log/FFT/bridge. |
| #11 precompute FFT setup | FFT twiddles/bit-reversal/Hann/scratch built **once** in ctor, reused; rebuilt only on size change. |
| #13/#14 rate decoupling | Capture / DSP (20 Hz) / display (15–30 Hz) cleanly 3-way decoupled; meters via RAF→SharedValues to dodge React lag. |
| route/interruption | Full route-change + interruption revalidation on both platforms (iOS restart+`reset()`, Android Oboe reopen). |
| honesty layer | Mature + pervasive: "approximate always," clipping-invalidates, gray-out unresolvable bands, dBA/dBC/relative tags everywhere. |
| validity skeleton | `quality.ts` `evaluateQuality()` already emits **VALID / CAUTION / INVALID** from flags. |

**Implication:** Burner #1 (capture contract) is ~70% done; the validity engine already exists in skeleton; the shared-DSP architecture is done. Effort is freed for depth.

---

## The gaps (what we actually fry), grouped

### Group A — Integration integrity (the "beautiful-but-wrong" fixes)
- **A1. Leq/exposure/RT60 are NOT invalidated on a mid-session dropout.** `processChunk` keeps accumulating `leqZSum_/leqCount_` through ring overruns; `droppedFrames` is surfaced but never triggers a reset. A long dosimeter run can look perfect over an incomplete signal. *(Highest-integrity gap; squarely no-fake-meters.)*
- **A2. `droppedFrames` is computed but unused for validity** (only shown in `DspDebugScreen`). Trivial to wire in.
- **A3. Buffering is fixed, not adaptive.** Ring overruns are counted but never enlarge the ring; Oboe `getXRunCount()` is unused; no output-underrun tracking. (#5/#13)
- **A4. Analysis worker is a plain `std::thread`** — no QoS/priority elevation. Cheap determinism win. (#10-adjacent)

### Group B — Validity engine (extend the existing `quality.ts`, don't rebuild)
- **B1. Add inputs** it doesn't yet consider: sample-rate-confirmed, SNR-above-noise-floor, **dropout** (A2), route-unchanged, orientation, characterized-device.
- **B2. Evolve** the flag-combiner toward a confidence signal (**VALID / LIMITED / INVALID** or a score) surfaced through the existing honesty UI — no new lecture.

### Group C — Capture depth & health
- **C1. Startup capture-health probe (200–500 ms gate):** DC offset, stuck/silent signal, gain movement, sample-rate confirm, reject a PROCESSED channel. Feeds validity. (#8) — currently MISSING (only *continuous* clip/stall checks exist).
- **C2. Android `MicrophoneInfo` interrogation** (API 28+): sensitivity, freq response, location/orientation, mic id/address, **DIRECT vs PROCESSED** mapping. Completely absent today. (#2/#3)
- **C3. iOS depth:** pin built-in mic / read data source + input gain; re-enforce (not just report) `.measurement` if the OS refuses. (#1)

### Group D — Two-part calibration + device identity (the architectural change)
- **D1. Split calibration** into **level** (`dBFS→SPL`, exists) **+ separate frequency-response `Cdevice(f)`**, kept separate in math **and** storage. Today it's a single scalar `{offsetDb,setAt}`; `NOMINAL_OFFSET=100` is hardcoded in **3** places. (#4)
- **D2. Apply `Cdevice(f)`** to the frequency-domain tools (RTA/spectrum/spectrogram) — **only** when a genuinely characterized profile exists; otherwise stay honestly "relative/uncalibrated." (#5)
- **D3. Key calibration + profiles by exact device identity** (model + mic/source + capture mode + gain state + profile version) and add a **per-device profile registry** + a **"characterized vs generic device"** flag (feeds validity). (#4/#18) — MISSING today (one global offset, hardcoded `'phone microphone'` strings).

### Group E — Device-characterization program (the long game / competitive asset)
- **E1. Bench fixture + protocol:** reference speaker + measurement mic + rotation stage + thermal + dropout tests; automated sweep/pink/1 kHz/stepped-SPL/angular runs. (#19)
- **E2. Per-model profiles** (Pixel-first, then iPhone): freq response, 1 kHz sensitivity, noise floor, THD-vs-level, **acoustic-clipping onset**, directivity, native rate, stable buffer. Populate the D3 registry. (#5/#18)
- **E3. Per-device acoustic-clipping onset → "reliable range exceeded"** (vs waiting for 0 dBFS); lower precision near the noise floor. (#16)
- **E4. Orientation-aware mic aiming** ("aim this edge at the source") + HF-directivity/obstruction heuristic, from accelerometer + the mic's physical orientation. (#6)

### Group F — Efficiency (opportunistic; do when already in those files)
- **F1. iOS FFT → Accelerate/vDSP.** Currently a scalar radix-2 loop (`Fft.hpp`); the whole spectral path rides it 20×/s. **Biggest iOS perf/thermal win.** (#11)
- **F2. Dedup the 1/6-oct logic** — `RtaScreen.tsx` has a byte-identical private copy of `sixthOctave.ts`. Pure dedup, zero behavior change. (known tech debt)
- **F3. Cache per-consumer spectrum re-aggregation**; consolidate RTA's *two* spectrum intervals; cache `OctaveBands::bands()` table (rebuilt every tick).
- **F4. Thermal/battery-adaptive display downshift** — drop the *visual* rate first under thermal pressure, never the PCM path. (#14) — none today.

---

## Fry order (phased)

Effort: **S** ≤ a day · **M** a few days · **L** week+ (or hardware/ongoing). Launch = should land before commercial launch.

### Phase 1 — Integrity & correctness (ship first; cheap, high-integrity, no new hardware)
| Item | What | Effort | Launch? |
|---|---|---|---|
| A1 | Invalidate Leq/exposure/RT60 integration on discontinuity (mark segment invalid / end interval) | M | **Yes** |
| A2 | Wire `droppedFrames` into the validity flags | S | **Yes** |
| A4 | QoS/priority-elevate the analysis worker thread | S | Yes |
| A3 | Adaptive buffering + read Oboe `getXRunCount()`; enlarge ring on sustained overrun | M | Yes |
| C1 | Startup 200–500 ms capture-health probe → feeds validity | M | **Yes** |
| B1/B2 | Extend `quality.ts` with the new inputs; surface VALID/LIMITED/INVALID | M | **Yes** |

*Rationale: this is real, shippable measurement-integrity value with no dependence on bench data — and A1 is the one that could otherwise ship a dosimeter/Leq that lies over a dropout.*

### Phase 2 — Device identity & two-part calibration (architecture ready; curves come in Phase 3)
| Item | What | Effort | Launch? |
|---|---|---|---|
| D1 | Split calibration into level + `Cdevice(f)` (separate math + storage); dedup `NOMINAL_OFFSET` | M | Yes (plumbing) |
| C2 | Android `MicrophoneInfo` interrogation → Device Microphone Capability Record | M | Yes |
| D3 | Device-identity keying + per-device profile registry + characterized/generic flag | M | Yes |
| D2 | Apply `Cdevice(f)` to RTA/spectrum/spectrogram **only when characterized** | M | Gated on Phase 3 data |
| C3 | iOS mic pin / input-gain read / `.measurement` re-enforce | S–M | Optional |

*Strategic call: build the **slots** now (keyed, separate, honest defaults = identity/null curve), but a real `Cdevice(f)` curve requires Phase 3. **A wrong correction is worse than none** — so D2 stays inert until a genuinely characterized profile exists (no-fake-corrections = no-fake-meters).*

### Phase 3 — Characterization program (post-launch; hardware + ongoing; competitive moat)
| Item | What | Effort | Launch? |
|---|---|---|---|
| E1 | Bench fixture + automated protocol | L (hardware) | No |
| E2 | Per-model Pixel (then iPhone) profiles → populate registry | L (ongoing) | No |
| E3 | Acoustic-clipping onset → "reliable range exceeded"; noise-floor precision | M | No |
| E4 | Orientation-aware mic aiming + obstruction heuristic | M | No |

### Phase 4 — Efficiency (opportunistic; not blocking)
| Item | What | Effort | Launch? |
|---|---|---|---|
| F1 | iOS FFT → vDSP/Accelerate | M | Nice-to-have |
| F2 | Dedup 1/6-oct (RtaScreen ↔ sixthOctave.ts) | S | Yes (cheap) |
| F3 | Cache spectrum re-aggregation; merge RTA intervals; cache band table | S–M | No |
| F4 | Thermal/battery-adaptive display downshift | M | No |

---

## Recommended first fry (highest leverage, cheapest, most on-brand)

1. **A2** — wire `droppedFrames` into validity (S). Instant integrity signal from data we already have.
2. **A1** — invalidate Leq/exposure on discontinuity (M). Kills the "beautiful-but-wrong long run." Most important integrity fix.
3. **C1 + B1/B2** — startup health probe feeding an extended VALID/LIMITED/INVALID (M). Turns the honest-but-shallow contract into a genuine validity gate.
4. **F2** — dedup the 1/6-oct copy (S). Free cleanup while we're in the tools.

Phase 2 (calibration split + device identity) is the bigger architectural lift; worth doing pre-launch as *scaffolding* so the Phase 3 curves have somewhere to land, but it delivers little user-visible accuracy until we characterize devices.

---

## Open decisions for the owner

1. **Scope for now:** all of Phase 1, or just the "first fry" 1–4?
2. **Phase 2 timing:** build the two-part calibration + device-registry scaffolding pre-launch (ready but inert), or defer until we commit to the bench program?
3. **Bench program (Phase 3):** are we willing to invest in a reference measurement mic + calibrator + a controlled space? Even a *single* reference mic in a quiet room yields a rough per-Pixel-model curve and starts the moat. (Confidence per the research: high that self-measuring Pixels is the right call; no trustworthy public Pixel curves exist to borrow.)
4. **Standing watch:** the research offered to "monitor mobile audio measurement changes." Want a periodic check (Apple/Google audio API + measurement-app research) set up, or handle ad hoc?

---

## Evidence base
Grounded in a 4-agent read of `modules/ape-dsp/` (iOS `ApeDspModule.swift`/`ApeDspCore.mm`, Android `ApeDspModule.kt`/`ApeDspJni.cpp`, C++ core `EngineHub.hpp`/`SpscRing.hpp`/`Fft.hpp`/`OctaveBands.hpp`/`Ballistics.hpp`/`Pitch.hpp`), `src/features/tools/engine/` (`useDspEngine.ts`, `micSession.ts`, `useRafFrameLoop.ts`), `src/features/tools/measure/calibrationStore.ts`, `quality.ts`/`types.ts`, `sixthOctave.ts`, and the tool screens. Engine version = **7** (`EngineHub.hpp:56`).
