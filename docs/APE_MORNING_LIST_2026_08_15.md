# Morning continue-list — 2026-08-15

Written end of 2026-08-14. Both platforms (iOS + Android) have the native audio
engine **LIVE and on-device verified** (meters + audio output). Last commit:
`d6814b5`. Below is exactly where to resume.

## Locations
- **📍 PC terminal** = PowerShell in `C:\Users\profe\dev\ape-studio` (all commands).
- **📱 iPhone** and **📱 Pixel** = the two test devices (all taps + eyeballing).
- Metro (Expo dev server) was left **running in the background on port 8081**. It
  may still be up (reconnect the dev clients to `http://192.168.0.227:8081`); if
  not, start it: `npx expo start`.

## Uncommitted work to verify, THEN commit (3 files)
1. `src/screens/tools/WaveformScreen.tsx` — **Waveform trace ported to Skia**
   (fixes the coarse/jagged Android render; iOS unchanged). **JS — hot-reloads.**
2. `modules/ape-dsp/android/src/main/cpp/ApeDspJni.cpp` — **capture auto-recovery
   watchdog** (Android). **Native — needs an Android rebuild.**
3. `modules/ape-dsp/android/src/main/java/.../ApeDspModule.kt` — **`bluetoothInput`
   honesty flag** wired. **Native — needs an Android rebuild.**

## Morning steps

| # | 📍 Where | Do this |
|---|---|---|
| 1 | 📱 Pixel + 📱 iPhone | Reconnect to Metro (`192.168.0.227:8081`). Open **Waveform Viewer** on BOTH. Pixel trace should now be **smooth/fine like the iPhone**; confirm iPhone did NOT regress. Toggle COLORS off/on; make a loud sound (crisp red clip ticks). |
| 2 | 📍 PC terminal | Build the Android dev client with the native hardening: `npx eas-cli build --platform android --profile development` (~15–25 min). If it fails to COMPILE, paste the EAS error (this build is the compile-check for the blind native changes). |
| 3 | 📱 Pixel | Install the new APK. Sanity: meters + generator still work. **Watchdog test:** start SPL/RTA, plug in wired/BT headphones, then **unplug mid-measurement → capture should auto-recover** (meters resume) instead of needing STOP→START. **BT flag test:** connect a Bluetooth mic → the "unsupported input" warning should appear. |
| 4 | 📍 PC terminal | Once #1–#3 look good, tell Claude to **commit + push** the 3 files (or do it yourself). Nothing is committed until verified. |

## Housekeeping / lower priority
- **`src/config/devMode.ts` → `devFastComplete`**: was a ~48h dev aid slated to
  flip to `false` around now (2026-08-15). Check + flip if you're past the window.
- **Skia deprecation warnings** in the console (`SkPath.moveTo/lineTo/close is
  deprecated`) are pre-existing app-wide tech debt (not from today) — a future
  cleanup, not urgent.
- **SCREEN_STATUS.md**: the 8 tool rows are 🔵 (iOS-verified). After you're happy
  with the full on-device pass on both phones, they can move to 🟢 (signed off).
- `interrupted` flag on Android left `false` on purpose (the JS doesn't consume
  it; interruptions surface as `captureStalled` via the new watchdog).

## What today accomplished (for context when you wake up)
Audio engine went LIVE on **both** iOS and Android — all 8 measurement tools +
all tone/noise output verified. Fixed: the generator-silence root cause (iOS
`mode as? Int` bridge bug), fixed-reference amplitude displays (your integrity
rule), the Harmonic Lab crash + scroll. Added: Android capture watchdog + BT
flag, and the Skia waveform render. Governance/memory all updated.
