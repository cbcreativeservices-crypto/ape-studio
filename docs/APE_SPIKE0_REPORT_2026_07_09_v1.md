# SPIKE 0 REPORT-BACK — `ape-dsp` NATIVE AUDIO CAPTURE MODULE
**From:** Claude Code client-build session · **To:** backend/governance session
**Date:** 2026-07-09 (kickoff + completion SAME DAY — timebox was 1 week, fallback trigger day 5)
**Verdict: ✅ OPTION A VALIDATED ON-DEVICE. Fallback (react-native-audio-api) NOT needed.**
**Authorization:** Booth ruling Q1 (`MEASUREMENT_TOOLS_RULINGS_Q1_Q5_2026_07_09_v1.md`);
kickoff brief `APE_SPIKE0_KICKOFF_BRIEF_2026_07_09_v1.md`.

---

## 1. WHAT WAS BUILT (deliverables D1–D6 — all shipped)

- **D1 Module scaffold:** `modules/ape-dsp` (Expo Modules API, local module, autolinked).
  Swift wrapper + ObjC++ facade + pure C++17 core (portable — no platform deps), building
  clean in the existing EAS dev-build pipeline.
- **D2 Capture session:** `AVAudioSession` `.playAndRecord` + mode `.measurement` with
  **post-activation verification** (`processedInput` flag), Bluetooth-input detection,
  actual sample-rate / IO-buffer read-back, route-change + interruption handling.
- **D3 RT-safe pipeline:** `AVAudioEngine` input tap → mono float32 mix → lock-free SPSC
  ring (2^18 frames ≈ 5.5 s @ 48 kHz, dropped-frames counter). The audio thread does ring
  writes ONLY.
- **D4 Proof engine:** analysis thread (50 ms drain) → RMS + peak + full-rate peak-hold in
  dBFS (log-floored, power-domain math) → versioned frame
  `{version, sequence, settingsEpoch, rmsDb, peakDb, peakHoldDb, droppedFrames, flags}`.
- **D5 Bridge:** pull-based **synchronous** Expo `Function` returning a small frame dict;
  JS polls at 10 Hz (≤30 Hz cap honored). No per-callback events.
- **D6 Debug screen:** dev-only route (`DspDebug`, `__DEV__` row on ToolsHub): live meters,
  session verification readouts, warning flags, dropped-frames, soak timer — plus (added
  during the spike) `stopReason` and a rolling **native event log** that proved decisive.
- **Beyond-brief addition (field-driven): recovery watchdog** — see Finding F2.

**EAS builds:** final = **`8da2e16a-2942-4e47-8c65-8cba5d41659a`** (2026-07-09 21:49 PT,
SDK 57, dev profile, internal). History: `8456e8b8` errored (Swift type),
`d97dc50f` first success, `60c43d3a` route-filter fix, `8d5e6b08` instrumentation,
`8da2e16a` watchdog. (One duplicate `6125f937` canceled — operator error, no cost beyond queue.)

## 2. SUCCESS CRITERIA — RESULTS (on Booth's iPhone, above A13 baseline)

| # | Criterion | Result |
|---|---|---|
| S1 | Measurement mode verified, `processedInput=false` | ✅ "VERIFIED" on-screen; 48 000 Hz + 10.0 ms read-backs; built-in mic route |
| S2 | 10-min soak: 0 dropped frames, stable | ✅ **11:08 soak, droppedFrames = 0**, no stall, no jank, no heat reported |
| S3 | Plausible dBFS movement; peak-hold latches; reset works | ✅ silent-room ≈ −70 dBFS RMS / speech ≈ −55 / clap latched peak-hold (see F1); reset verified |
| S4 | Route + interruption recovery, flags correct | ✅ USB mic in: clean restart in ~200 ms onto `AppleUSBAudioEngine:GeneralPlus`; USB out: ~300 ms back to built-in. Phone call: see F2 — watchdog stall-detect + auto-recovery after hang-up, user-confirmed live meters resumed |
| S5 | Analysis CPU within budget | ✅ indirect: 11-min continuous run, zero drops, fluid UI (dedicated CPU% overlay deferred to engine build) |
| S6 | tsc clean; bundle 200 | ✅ throughout |

## 3. FINDINGS OF RECORD (platform truths the engine build must honor)

- **F1 — Digital peaks EXCEED 0 dBFS on overload.** A hard clap latched peak-hold at
  **+12.7 dBFS**. In measurement mode iOS delivers the raw float pipeline; SRC/filter
  overshoot on clipped transients exceeds nominal full scale. Production meters MUST accept
  and display >0 dBFS honestly (feeds the §4.2 clip-indicator design; never clamp silently).
- **F2 — iOS interruption notifications are UNRELIABLE (reproduced 3×).** An incoming call
  seized the mic with **no `interruption BEGAN` delivered**; the input route flapped to
  `uid=nil` and capture silently stalled. Consequence: notification-driven pause/resume is
  insufficient. **Architecture answer (implemented):** intent-driven recovery watchdog —
  `desiredRunning` (user intent) + 2 s native timer: stalled → teardown+restart; dead →
  restart when an input route exists; explicit `shouldResume=false` respected. Verified
  end-to-end: stall detected ≤2 s into the call, honest "waiting" state during it,
  automatic live recovery after hang-up.
- **F3 — Tap buffer size is advisory (confirming tech spec §2.1).** Requested 1024-frame
  buffers; iOS delivers ~4800-frame (~100 ms) chunks. Analysis frames therefore publish at
  ~10/s. All timing must derive from actual delivery, never the request.
- **F4 — iOS fires a route-change notification for YOUR OWN session activation**
  (`.categoryChange`, reason 3). Reacting to it kills a healthy session (this was the first
  field bug). Handlers must filter to device reasons (1/2/8) + verify the input UID changed.
- **F5 — Background timer suspension:** during the answered call the app backgrounded and
  the watchdog's dispatch timer suspended (log gap), resuming on foreground. Acceptable for
  MVP (tools pause on background per spec §6); any future background logging feature must
  not rely on dispatch timers.

## 4. DEVIATIONS FROM THE TECH SPEC (documented per brief §7)

- **Ring overrun = drop-NEWEST + counter** (spec said drop-oldest). Drop-oldest breaks the
  SPSC lock-free invariant (producer would move the consumer's tail). With a 5.5 s ring
  drained every 50 ms, overrun implies a >5 s analysis stall, where the distinction is
  immaterial; the counter records it either way. Recommend ratifying as the standing design.
- **Bridge payload = small dictionary via synchronous Function** (spec §4.1 imagined JSI
  typed arrays with pinned buffers). Correct for Spike-0 frame sizes (~12 scalars at 10 Hz);
  typed-array/pinned-buffer transport becomes REQUIRED at RTA/spectrogram frame sizes —
  scheduled for the engine build, frame schema already versioned for the migration.
- **Not attempted (out of scope per brief §6):** FFT/weighting/calibration/telemetry, and
  the D6 CPU% overlay (S5 evidenced by soak instead).

## 5. ENGINEERING GOTCHAS → Known Gotchas registry

1. ObjC `size_t` imports to Swift as `Int` (NOT `UInt`) — cost build #1.
2. Expo's `Module` base class must not be assumed NSObject: use **block-based**
   NotificationCenter observers, never `#selector`.
3. F4 above (self-triggered route change) — the single most dangerous default.
4. `eas-cli` must run from the project directory — Claude-session background shells reset cwd.
5. expo.dev build pages can transiently show "something went wrong" — the build may be fine;
   verify with `eas build:view <id>` before rebuilding.
6. Metro must be restarted after creating `modules/ape-dsp` (known new-directory gotcha —
   applied).
7. No New-Architecture/JSI blockers encountered (risk R-1 did not materialize) — Expo
   Modules API on SDK 57 handled the sync-function bridge without custom JSI work.

## 6. RECOMMENDED NEXT STEPS (for governance sequencing)

1. **Declare Spike 0 CLOSED — Option A adopted** (this doc = the §7 report-back).
2. Engine build (separate work order): weighting filters + FFT backend + per-tool engines
   per tech spec §5, typed-array bridge, CPU% overlay, golden-vector CI tests (§8).
3. T-1 telemetry deploy remains DEFERRED to the engine build per the Q3 ruling.
4. Fold F1–F5 into the Project's Known Gotchas / tech spec erratum at the next
   coordinated governance bump.
5. Launch-critical items retain priority in the Claude Code session per the Q1 ruling.

*End of Spike-0 report.*
