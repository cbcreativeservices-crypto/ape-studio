# SPL/VU tool refactor — verified plan (2026-08-19)

Diagnosis + plan from an 8-agent investigation (4 investigate → synthesize → 3 adversarial
verifiers). All three verifiers rejected the naive "route-split" refactor; this plan folds
in their corrections. Owner decisions: **Full VU free-rotates** (portrait stacked /
landscape side-by-side); **digital readout fullscreen keeps rotating**.

## Confirmed root causes
- **Architecture:** the SPL tool builds UI from stacked **native Modals** (always-open home
  Modal `vuOpen`, settings Modal, readout Modal) + a **global imperative orientation lock**,
  inside a screen that's already a native-stack route — fighting `react-native-screens`
  (which owns iOS orientation and ignores `expo-screen-orientation`).
- **Pixel dies every edit (S4):** dev-time Android Fast-Refresh fault. The always-open Modal
  is a separate Android *Dialog window*; HMR deltas into it crash the host with no red-box →
  client wedges → Metro sees no Android bundle requests → uninstall wipes the wedge. iOS is
  same-surface, so immune. (Skia/worklet reload-teardown is a possible co-factor — confirm.)
- **Flat-on-table (S1):** `unlockAsync` = follow-accelerometer; flat = ambiguous → no
  committed orientation.
- **Rotate jank (S2):** `useWindowDimensions` at the root re-renders the whole 2,300-line
  screen + rebuilds every Skia path each rotation; imperative lock races the OS animation.
- **Sideways/blank on close (S3):** home Modal advertises landscape; overlay unmounts sync
  while re-lock is async → home paints sideways; home meters swapped for blank placeholders
  → fresh canvas re-mounts blank.

## HARD CONSTRAINTS the verifiers surfaced (do NOT violate)
1. **Mic lifecycle (spec S18):** `useDspEngine` stops capture on BLUR and never auto-restarts
   (privacy). So Full VU must **stay in the same screen** (no separate route that blurs the
   base) — or the meters freeze/blank and measurement restarts. Keep it in-tree.
2. **Single live meter:** keep the owner's rule — never animate two live Skia meter pairs at
   once. Home meters PAUSE (not just hidden-but-animating) while Full VU is up.
3. **app.json `orientation: "default"` is load-bearing** — the app-level mask must keep
   landscape or iOS Full VU crashes ("no common orientation"). NEVER tighten to "portrait".
4. **Preserve the shipped digital-readout landscape rotation** (owner 2026-08-17).
5. **Android `orientation:'all'` is sensor-based** — with system auto-rotate OFF it won't
   rotate. Free-rotate is the owner's choice; document that auto-rotate must be on, or add a
   definite-orientation default.
6. **De-modalized Views:** add hardware-BACK handling (BackHandler) that Modals gave for free;
   re-check z-order vs the App-root overlays (AudioBorderFrame / ExposureCheckin / LowLightDim).

## Phased plan (each phase committed + owner-verified on device before the next)

**Phase 0 — immediate relief (owner, no code):** on the Pixel, turn OFF Fast Refresh while
editing SplMeterScreen; full Reload (`r`) after each save; recover a wedge with
`adb shell am force-stop com.cbcreativeservices.apestudio` (or `pm clear`), NOT uninstall;
`npx expo start -c` if Metro wedges.

**Confirm S4 cause (owner, cheap):** Fast-Refresh-edit a Skia screen with NO Modal (RTA /
a Wave lab) on the Pixel. If it ALSO black-screens → S4 is Skia/worklet teardown, not the
Modal, and Phase 1 won't fully fix it (promote the Skia patch). One `adb logcat` during a
save gives the native signature.

**Phase 1 — de-modalize (fixes S4 if Modal is the cause; prerequisite for declarative
orientation).** Remove the always-open home `<Modal vuOpen>`; render base SPL as a normal
screen with in-tree view state (`home | digital`). Convert the settings popup and the
readout-fullscreen from `<Modal>` to in-tree absolute-fill Views. Full VU stays in-tree
(already is). Add BackHandler for the ex-modal Views. Keep ALL engine/measurement/handler
logic byte-for-byte. Preserve the single-live-meter pause. tsc + bundle + on-device retest
(home, digital, Full VU, settings, readout, back button, the audio red-frame/exposure/low-
light overlays).

**Phase 2 — declarative orientation (fixes S1/S3, removes the imperative fight).** Add the
`react-native-screens` per-screen `orientation` option to the SplMeter route, set
**dynamically** via `navigation.setOptions({ orientation })`: `'all'` when Full VU OR the
readout-fullscreen is open (free-rotate), `'portrait'` otherwise. KEEP the imperative
`screenOrientationSafe` path as a fallback until the declarative option is confirmed driving
rotation on the Pixel with a fresh build; only then delete the boot lock + effects. Keep
app.json `'default'`. Decide Full VU's row/col layout from a DEFINITE orientation (default
portrait when ambiguous), not stale root `winW<winH`.

**Phase 3 — isolate dimensions + de-jank (S2).** Move `useWindowDimensions` reads down to the
fullscreen leaves; `React.memo` the meter components; stop the whole-tree re-render on rotate.

**Phase 4 — Android hardening (watch).** If readout shows artifacts, swap
`mixBlendMode:'multiply'`+`isolation` for a plain rgba overlay; consider a Skia patch bump;
verify landscape safe-area/edge-to-edge insets on the Pixel.

## Prereq build
A fresh EAS `development` build is needed for on-device orientation (the installed client
predates the module + `default` manifest). Phase 1's de-modalization + Phase 0 relief do not
need it; Phases 2-3 orientation testing do.
