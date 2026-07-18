# SPIKE 0 KICKOFF — NATIVE AUDIO CAPTURE MODULE (`ape-dsp`)
**For: Claude Code client-build session · From: backend/governance session · Date: 2026-07-09**
**Authorized by: Prof. Booth ruling Q1 (2026-07-09) — see `MEASUREMENT_TOOLS_RULINGS_Q1_Q5_2026_07_09_v1.md`**
**Timebox: 1 week. Runs in parallel with launch work — ⚠️ LAUNCH-CRITICAL ITEMS KEEP PRIORITY on any conflict (QR wiring · S3/S4-Media shells · D-1 pass · S1/S7 wiring · smoke-test support).**

---

## 1. STANDING RULES (unchanged)
No backend changes from this session — route any DB need to the governance chat. `expo-av` permanently banned. Repo stays out of OneDrive. Restart Metro after creating the module directory. Specs are authoritative: `AUDIO_MEASUREMENT_TOOLS_TECH_RESEARCH_2026_07_09_v1.md` (engineering, esp. §1–§4) + `AUDIO_MEASUREMENT_TOOLS_RESEARCH_2026_07_09_v1.md` §1 (shared foundations).

## 2. OBJECTIVE
Prove the Option-A architecture on Booth's iPhone: a custom **Expo Module** (Swift) + **portable C++ DSP core** delivering measurement-grade PCM frames to JS at display rate. This is an infrastructure spike — **no tool UIs, no visual design** (existing ToolsHub/INFO screens untouched).

## 3. DELIVERABLES
1. **D1 — Module scaffold:** `modules/ape-dsp` (Expo Modules API, Swift + C++), building in the EAS dev-build pipeline; **new dev build on Booth's iPhone**.
2. **D2 — Capture session:** `AVAudioSession` `.playAndRecord` + mode **`.measurement`**, with post-activation **verification** (surface a `processedInput` flag if measurement mode is not honored); Bluetooth-input detection → `bluetoothInput` flag; read-back of actual sample rate + IO buffer duration; route-change + interruption handlers (pause/resume + engine reset).
3. **D3 — RT-safe pipeline:** `AVAudioEngine` input tap → mono float32 → **lock-free SPSC ring buffer** (≥2 s, power-of-two, drop-oldest + dropped-frames counter). Nothing else on the audio thread.
4. **D4 — Proof engine:** minimal DSP on the analysis thread — dBFS RMS + peak with peak-hold (per tech spec §5.1 unweighted path) — publishing a versioned frame `{version, sequence, settingsEpoch, rmsDb, peakDb, peakHoldDb, flags}` via atomic swap.
5. **D5 — Bridge:** pull-based JSI/Expo frame access capped at ≤30 Hz; reused buffers; no per-callback events.
6. **D6 — Debug screen** (dev-only route, no design language required): live dBFS numbers, sample rate, route name, measurement-mode status, dropped-frames counter, 10-minute soak timer.

## 4. SUCCESS CRITERIA (all on-device, Booth's iPhone)
- S1: measurement mode verified active on built-in mic; `processedInput=false`.
- S2: 10-minute soak — 0 dropped frames, stable memory, no JS-thread jank (nav remains fluid).
- S3: silent room vs speech vs loud clap — plausible dBFS movement; peak-hold latches; reset works.
- S4: unplug/replug wired mic + incoming-call interruption → clean pause/resume, no crash, flags correct.
- S5: analysis-thread CPU within budget on the A13 baseline (Q5 ruling; Booth's device is above baseline — record numbers).
- S6: `npx tsc --noEmit` clean; bundle HTTP 200.

## 5. FALLBACK TRIGGER (Q1 ruling)
If by **day 5** the module cannot deliver stable ring-buffered PCM on-device (New-Architecture/JSI blockers — risk R-1), STOP and evaluate `react-native-audio-api` (tech spec §2.3 Option B). Report either outcome to the governance chat via the normal hand-off doc.

## 6. EXPLICIT NON-GOALS
No FFT/RTA/spectrogram/RT60 DSP yet · no weighting filters · no calibration UI · no telemetry wiring (T-1 deploy deferred until engine build) · no changes to locked screens or nav · no `expo-audio` interaction (separate, playback-only, Spring).

## 7. REPORT BACK
Hand-off doc per the established pattern: what built, S1–S6 results with numbers, deviations from tech spec §1–§4, New-Architecture gotchas discovered (they become Known Gotchas), and the EAS build/version identifier.

*End of kickoff brief.*
