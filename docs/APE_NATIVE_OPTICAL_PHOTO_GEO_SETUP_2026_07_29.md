# Native backends — Optical Hz counter · Snapshot photo · Snapshot GPS
## Setup + build steps (owner runs these) — 2026-07-29

Three native capabilities were added as **source**. They are inert on the
current installed clients (every consumer is gated behind an availability check,
so nothing crashes) and turn on only after the steps below produce a NEW dev
build installed on the device.

> ⚠️ I (the assistant) cannot run `expo prebuild` / EAS builds or test native
> code — the TypeScript surface compiles and bundles clean, but the Swift /
> Kotlin and the camera/GPS behavior MUST be validated on-device after the build.

## What was added
- **`modules/ape-optical/`** — a NEW local Expo module (Swift + Kotlin) that
  opens the camera and reports mean-frame **luminance** over time. The
  Light-Pulse frequency counter estimates the flash rate from that series (in
  JS, by autocorrelation). Auto-linked by Expo like `ape-dsp` (no app.json
  plugin needed).
- **Snapshot photo** — via the official **`expo-image-picker`** (system camera).
- **Snapshot GPS** — via the official **`expo-location`**.
- **Permission popup** — a pre-permission explainer with an "Always allow —
  don't ask me again" choice, persisted per capability
  (`src/features/permissions/`).
- **app.json** — added `NSCameraUsageDescription`,
  `NSLocationWhenInUseUsageDescription` (iOS) and `CAMERA` /
  `ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION` (Android).

## Steps
1. **Install the two official packages (SDK-correct versions):**
   ```bash
   cd C:/Users/profe/dev/ape-studio
   npx expo install expo-location expo-image-picker
   ```
   `npx expo install` pins the versions that match Expo SDK 57 (do NOT
   hand-pick versions). This is why they are NOT in package.json yet — the
   app compiles/runs without them (features gated off) until this runs.

2. **(Optional but recommended) add their config plugins** to `app.json`
   `plugins` so their permission strings/manifests are managed by the plugin
   too. The raw permission strings are already in app.json, so this is belt-
   and-braces:
   ```json
   "plugins": [
     "expo-sqlite", "expo-font", "expo-status-bar",
     ["expo-image-picker", { "cameraPermission": "Add a photo of the room to a measurement snapshot. No photo is uploaded." }],
     ["expo-location", { "locationWhenInUsePermission": "Tag a measurement snapshot with where it was taken. Stored on-device, never shared automatically." }]
   ]
   ```

3. **Prebuild + build a NEW dev client** (native fingerprint changed — the old
   client can't load the new modules):
   ```bash
   npx expo prebuild -p android         # and -p ios if building for iPhone
   npx eas-cli build --platform android --profile development --non-interactive --no-wait
   ```
   (iOS: EAS iOS quota resets Aug 1 per the standing handoff; build when
   available.) Install the resulting APK/dev client on the Pixel/iPhone.

4. **Validate on-device** (the only real test of the native code):
   - **Light Pulse:** Tools → Frequency Counter → Light Pulse → START CAMERA.
     The pre-permission popup should appear (and "Always allow" should stop it
     re-appearing). Point at a slow flashing LED / a phone strobe app set to a
     KNOWN slow rate (e.g. 5–10 Hz) and confirm the Hz readout matches. Confirm
     it refuses / warns above ~half the camera frame rate (fps shown as
     MAX RESOLVABLE). Confirm STOP releases the camera (indicator light off).
   - **Snapshot photo/GPS:** MultiMeter → SNAPSHOT → ADD PHOTO (system camera
     opens, thumbnail appears) and TAG LOCATION (a fix appears). Save, then open
     the Measurement Library and confirm the snapshot shows the photo-attached
     + location lines.

## Honesty / privacy notes (already enforced in code)
- Light-Pulse measures **overall image brightness only** — no photo or video is
  recorded by the counter; the disclaimer is on-screen.
- Snapshot photo/GPS are **opt-in per snapshot**, stored **on-device** with the
  measurement, never auto-uploaded. The permission copy says so.
- Camera-frame flicker is capped at ~fps/2 (Nyquist); rolling shutter can alias
  faster flicker — disclosed in the UI. Suitable for slow indicators / strobes /
  marked rotating machinery, not audio-rate signals.

## Rollback
Everything is behind availability gates. To disable without reverting code:
don't ship the new build (installed clients keep showing the honest
"needs the next dev build" states). To remove entirely: delete
`modules/ape-optical/`, the `src/features/permissions/` + `capture/` files, the
app.json permission additions, and revert the two screen wirings.
