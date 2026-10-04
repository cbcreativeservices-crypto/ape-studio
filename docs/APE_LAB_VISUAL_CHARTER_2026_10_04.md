# AP&E Lab Visual Charter — the final pre-launch lab (2026-10-04)

**Status: STANDING for the final pre-launch lab and every revision of it.**
Source: the owner's visual and animation quality prompt (2026-10-04), adapted to
this codebase. It EXTENDS `APE_VISUAL_STANDARDS_2026_07_29.md` (illustrated real
objects, upper-left light, palette tokens). It does not replace it or the house
rules in `AGENTS.md`. Where the two documents differ, the stricter rule wins.

Order of work, every figure: **references → technical model → static geometry
(verified) → motion → rendered inspection → refine → review → deliver.**

---

## 1. The stack: verified in package.json on 2026-10-04

| Piece | Installed | Use it for |
|---|---|---|
| Expo SDK | ~57.0.23 (RN 0.86.3, React 19.2.3, New Architecture) | Versioned docs: docs.expo.dev/versions/v57.0.0 |
| `@shopify/react-native-skia` | 2.6.2 | Every technical scene: paths, gradients, clips, masks, shaders, text in the drawing |
| `react-native-reanimated` | 4.5.1 | Shared values, `useDerivedValue`, `useFrameCallback`, timing and springs on the UI thread |
| `react-native-worklets` | 0.10.1 | The worklet runtime under Reanimated 4 |
| `react-native-svg` | 15.15.4 | Static icon assets only, never a lab scene |
| `react-native-gesture-handler` | **NOT INSTALLED** | (none). See G1 |

Consequences:

- **Gestures use PanResponder plus the house finger rule** (`rack/laneFinger.ts`:
  follow the finger that grabbed, ignore a second finger). Pinch zoom does not
  exist. Full screen zooms in STEPS plus scroll (`rack/StageFullScreen.tsx`).
- **G1 (owner decision).** Adding Gesture Handler is a native dependency. It
  moves the runtime fingerprint, so the lab could ship only in a new store
  build, never as an over-the-air update. The default is no new native
  dependency. The queued Reanimated 4.5.5 / Worklets 0.10.4 bump also waits for
  the next native build.
- Skia on the web preview runs through CanvasKit (WebAssembly). It is close to
  the phone, but it is NOT the native renderer. A web check is evidence about
  the drawing, never proof of phone performance.

## 2. Three layers, kept apart

For each figure, keep three files. The model and geometry files are pure
TypeScript with no React Native imports, so tests can reach them directly.

1. **`model.ts`: the technical truth.** Parts, terminals, connections,
   quantities, allowed states, and units. Every part and connection gets a
   stable string id (`amp.out.L`, `xlr.pin2`). Every fact carries a `src` key
   into the lab's SOURCES file. A fact without a source is marked `unknown`
   and never drawn as if known.
2. **`geometry.ts`: where things are.** A documented coordinate system: origin,
   units (design units at a stated reference width), y-down, and the
   reference box. It holds anchors (named points per terminal and pivot),
   paths built ONCE (`Skia.Path` in a memo or at module scope), and bounds.
   Labels, hit areas, highlights and moving parts are all DERIVED from these
   anchors, so they stay aligned at every zoom step and every frame.
3. **`scene.tsx` + `motion.ts`: how it looks and moves.** Colours, gradients,
   type and effects come from the existing tokens. Motion is one state or
   timeline value, and every visual reads from it.

Junction versus crossing is part of the MODEL: a junction dot exists only
where the model says the conductors connect. A highlight or path reveal that
runs through a crossing must not draw a dot or a T at that point.

## 3. Sources: `docs/labs/<lab>/SOURCES.md`

- One row per fact cluster: what it is, the source (file and page/figure, or a
  standard and its clause, or a URL), the date checked, and who checked it.
- References are inspected at full resolution: crop and zoom them. An
  unreadable marking is logged as UNKNOWN with exactly what is needed.
- When references disagree, both sides are logged. Nothing is resolved by
  guessing. Unaffected work continues.
- **Simplifications register:** every exaggeration of time, scale,
  displacement or speed, and how the learner is told about it (badge,
  caption, or the ⚖️ accuracy note).
- **Images:** a photo or raster is never the authority for a schematic or
  anatomy. Image folders are touched only with the owner's explicit go, folder
  by folder.

## 4. Accuracy gates, audio-specific (on top of the prompt's §technical_accuracy)

- Levels: dBu, dBV, dBFS and SPL references come from `calcUnits.ts`
  (`DBU_REF_V`, `P_REF_PA`). Any equation that is shared with a calculator
  calls the calculator's function and never copies it (calculators are the
  source of truth).
- Meters and loudness colour come from `levelColor.ts`, pinned to the absolute
  scale. Peak red is `#ff5a48`.
- Waveforms are real signals on a real time base (`renderOverview` /
  meterEngine), never stylized squiggles. A speaker cone moves in time with
  the particles, bands and graph that it drives.
- Polarity, phase, pin numbering (XLR pin 2 hot, and so on), signal direction,
  grounding and safety markings are checked against the reference. No ratings
  or certifications are invented.
- Needle and number come from one value through one scale function. Any
  smoothing is ballistic and documented, the same as the meter it imitates
  (VU 300 ms, PPM, and so on).

## 5. Motion

- **Classify every loop.** A LESSON display that the learner started is exempt
  from reduced motion, and listed in `test/patternP10b_20261002.test.ts`
  with its reason. A DECORATIVE loop reads `useDecorativeMotion()` and stops
  under reduced motion and in Low-Light mode.
- **One clock.** Each scene runs one phase or timeline shared value (the
  `usePhaseClock` pattern). Parameter changes keep phase continuous, so
  nothing snaps or strobes. Readouts, needles, highlights and traces all
  derive from it.
- Rigid parts rotate about the verified pivot and stop at the mechanical
  limits, and are never deformed. Interface chrome may spring; instruments
  and mechanisms follow their model.
- No shape morph whose in-between frames show parts or connections that do not
  exist. Use a crossfade or a staged reveal instead.
- A signal-flow overlay is labelled as an overlay. Moving dots never claim
  electron speed or propagation speed unless the model supports that claim.
- Every major animation can be paused, stepped, restarted, and (where it makes
  sense) scrubbed. Under reduced motion, step controls carry the lesson.
- An animation stops when the screen loses focus or the app goes to the
  background, and it resumes without a jump.
- Each major animation gets a written spec: what the learner should
  understand, what changes, what stays fixed, the model behind it, timing and
  easing, the constraints, what an interruption does, and how to inspect key
  states.

## 6. Look

- The house language: upper-left light, gradients for form, rim highlights,
  amber `#ffc64d` accent, blue `#6fa8ff` energy, green `#5bff85` good, red
  `#ff6b5e` problem. Glow goes on lamps and LEDs, never over a symbol, scale or
  terminal.
- Live displays sit on the **Rack Unit**: display pinned at the top, a well
  that scrolls between, controls docked at the bottom. Full screen is a working
  surface and EVERYTHING zooms (D35). A cropped readout drops its label, never
  its number (D36, `BezelReadouts`).
- Display text is at least 9 pt at 390 wide after fit scaling (`fitValue`).
- Nothing in the background competes with the technical information.
- First draft is never final. Inspect the rendered result and refine it.

## 7. Performance

- No per-frame React state. Shared values and `useDerivedValue` only. Meters
  drive shared values on each animation frame.
- Geometry and paths are built once. Per-frame work happens in worklets. Node
  counts stay sane for mid-range phones.
- **Measuring** (frame rate is never claimed from how it looks):
  - Android: the owner's Pixel, through adb, on an installed RELEASE build.
    `dumpsys gfxinfo` may not count Skia surface frames. If it doesn't, a
    dev-only frame-time probe (timings from `useFrameCallback`, logged to
    logcat) is the instrument, and it is removed before handover.
  - iPhone: cannot be reached from here. iOS frame rate is reported as NOT
    MEASURED.
  - A lab that is not yet published can only reach the phone through an update
    the owner chooses to publish. Until then, phone results are "not yet
    measured".
- Target: a sustained 60 fps on the Pixel, and 120 fps only where it costs
  nothing in accuracy or battery.

## 8. Accessibility

- Every `<Canvas>` that teaches carries `accessible` with an
  `accessibilityLabel` and a live text summary of its current state. **Today
  only 2 of the 24 Canvas files do. The new lab must not add to that gap.**
- Controls are native components with labels, roles and values.
- No distinction relies on colour alone. Pair colour with shape, dash, label or
  position.
- Reduced motion keeps every lesson state reachable through steps.

## 9. Verification protocol (receipts, not claims)

1. `npx tsc --noEmit` is clean. Full suite:
   `node --test --test-timeout=120000 "test/**/*.test.ts"`.
2. **Invariant tests on the model and geometry**, checking the real
   relationships and never re-running the implementation:
   - part and terminal counts match the source;
   - every connection joins two terminals that exist;
   - pin numbering and orientation are correct;
   - no junction appears where the model has a crossing;
   - every anchor is still attached after each zoom step and transform;
   - a scale round-trips (value → angle → value);
   - every state in a timeline is a legal model state.
3. **Rendered inspection** in the web preview (`#labpreview/<Screen>`, own
   server). The built-in pane is a hidden page, so animation frames run at
   about 3 per second there. Frame series (start, middle, end, interrupted,
   repeated, reduced motion) are captured with Playwright when it is free.
   Sizes: 390×844 portrait, landscape, iPad 1024×1366. Each capture is opened
   and checked before it is handed over.
4. **Compare with the references** side by side for every equipment figure.
5. **Reviews before handover:** an audio-expert pass, a cognitive/learning pass,
   and a skeptical VISUAL pass using this charter as the checklist. Any
   invented part, wrong connection, unsupported number, misleading motion,
   unreadable essential label, or unsupported API FAILS the review and is
   fixed before "done".

## 10. Delivery, every phase

1. The deliverable for that phase.
2. The rendering stack and the techniques used, in plain words.
3. The sources: the lab's SOURCES file, with UNKNOWNS and simplifications.
4. The evidence: test receipts, captures (in Downloads), any measured
   performance with device and build, and an explicit list of what was NOT
   verified.

## 11. Needed from the owner before or with the spec

- **Reference material** for each piece of equipment and each system in the
  lab: manuals, schematics, datasheets, and the standards to follow. Anything
  the spec names without a reference goes into the UNKNOWN list.
- **G1:** stay on PanResponder (ships over the air), or add Gesture Handler in
  a native build (pinch zoom and richer gestures, but store build only).
- **Device proof:** whether the Pixel will be connected, and how the owner
  wants the lab to reach it before launch.
