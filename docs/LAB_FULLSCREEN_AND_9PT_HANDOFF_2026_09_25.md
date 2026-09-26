# Handoff — FULL SCREEN + 9 pt labels for eleven more labs (2026-09-25, late night)

**Read this whole file before touching code.** It is the brief for a NEW session. Everything
below was measured or read from the code on 2026-09-25; line numbers are from commit
`376666c0` (branch `audio-tools-engine`) and will drift — search, don't trust blindly.

**The owner's words:** *"the new lab has several screens with text too small to read… these
displays may need to be enlarged so the user can see them and make use of them"* → *"do both - 9 pt
minimum"* (Sound Systems, done) → *"create handoff for new session with all details of improving
and updating to full screen for"* the labs in §4.

---

## 0 · Rules that apply to this job (non-negotiable)

- **9 pt minimum on every lab display** — memory `feedback_lab_display_text_9pt`. Rendered size =
  authored font size × the scale the drawing is drawn at. **Measure it** (§6), never estimate it.
  Must hold at phone width **375 and 390**, normal height (≥ 700 tall). Short phones (SE 375×667)
  are reported, not required — FULL SCREEN covers them.
- **Never publish.** Commit + push only. `eas update` only when the owner says "update the phones"
  in that moment (memory `feedback_never_publish_unasked`). A `git push` rebuilds the live website
  (`web/` untouched = same site) — that is fine.
- **No new npm packages.** A native package (e.g. react-native-gesture-handler for pinch) moves the
  runtime fingerprint = no over-the-air updates until a new build. Zoom is STEPS + scroll.
- **Images:** never touch image files without the owner naming the folder and saying go.
- **Rack Unit law** (memory `feedback_labs_use_rack_layout`): display pinned above, reading well
  between, controls docked below; nothing floats over the glass — the FULL SCREEN button sits on
  the faceplate beside HIDE DISPLAY, never on the drawing.
- **Accuracy:** every label you shorten, move or drop must keep its meaning; nothing taught may be
  lost (move sub-captions into the lab's text/cards instead). Every lab gets the audio-expert +
  cognitive review pass before handover (memory `feedback_lab_expert_review_pass`).
- **Labs never block navigation**; `PagedLab.tsx` behaviour is shared by 30 labs — do not change it.
- **Other sessions:** `docs/CROSS_SESSION_HANDOFF.md` is the shared log with Computer A; a commit
  hook adds a "sync channel" stub — fill its two lines ("nothing — client only" / "nothing").

---

## 1 · Done means

For every screen in §4 marked **BOTH**:
1. Every word on the display renders **≥ 9 pt** at 375 and 390 wide (measured, before/after table).
2. The display has a **FULL SCREEN** view (zoom 1× / 1.5× / 2× / 3×, drag to pan, all
   orientations, the honesty badge rides along, still interactive) — and the LABELS GROW in it
   (see the Skia caveat, §3.3 — this is the trap).
3. No overlapping labels, nothing clipped, screenshots looked at (not just numbers).
4. `npx tsc --noEmit -p .` clean, `npm test` all passing (1,991 today).
5. A report `docs/APE_LAB_LEGIBILITY_PASS_<date>.md`: the table, every moved/shortened label with
   where its meaning now lives, anything not reached and why.
6. Committed and pushed. NOT published — end by asking the owner "update the phones?".

---

## 2 · The reference implementation — Sound Systems (shipped 2026-09-25)

Commits: `987cf20e` (FULL SCREEN), `54e48aee` (labels to 9 pt), report
`docs/APE_SOUND_SYSTEMS_LEGIBILITY_PASS_2026_09_25.md`. Read both diffs first.

How it works today:
- `src/screens/lab/rack/rackTypes.ts` — `RackStage.onEnlarge?: () => void` (opt-in).
- `src/screens/lab/rack/RackUnit.tsx` — when `stage.onEnlarge` is set and the display is shown, a
  "⤢ FULL SCREEN" button sits beside "▴ HIDE DISPLAY" (a row of two flex:1 buttons; labs without it
  render exactly as before).
- `src/screens/lab/soundsystems/StageFullScreen.tsx` — a `DimModal` (all orientations, low-light
  wash): top bar DISPLAY + zoom chips 1×/1.5×/2×/3× + ✕; two nested ScrollViews for panning;
  calls the SAME `render(w, h)` at the zoomed size, so page state and taps stay live; hint line
  hidden in landscape; badge at the bottom.
- `src/screens/lab/soundsystems/stageAspect.ts` — context `StageAspectReport {aspect(a,pad), fixed()}`.
  `StageFit` (a drawing of fixed aspect, in `soundsystems/rackLayout.tsx`) reports its aspect so
  the zoomed canvas is exactly the drawing's shape (no empty margins); `StageBox` (view-built text)
  reports `fixed()` and gets NO button (its text doesn't grow); `SsRack.fullScreen: false` opts a
  page out. Drawings that paint the whole (w, h) themselves report nothing and zoom as a box.
- Measured result, ROUTE 1 channel strip: smallest label 5.6 / 8.5 / 11.4 / 17.2 pt at 1× / 1.5× /
  2× / 3× (before the label redraw); after the redraw every glass is ≥ 9 pt.

---

## 3 · Step 1 — make FULL SCREEN shared (do this before any lab)

### 3.1 Move the pieces into the shared rack folder
- `soundsystems/StageFullScreen.tsx` → `src/screens/lab/rack/StageFullScreen.tsx` (imports only
  DimModal, theme tokens, stageAspect).
- `soundsystems/stageAspect.ts` → `src/screens/lab/rack/stageAspect.ts`.
- `StageFit` / `StageBox` (`soundsystems/rackLayout.tsx` ~l.132–157) → `rack/` too.
- Repoint imports: `soundsystems/rackLayout.tsx` and the 7 page files that import StageFit/StageBox
  (`pagesBuild, pagesLearnA/B/C, pagesOperate, pagesRoute, pagesTroubleshoot`).

### 3.2 Put the full-screen state INSIDE RackUnit (recommended)
Rather than wiring a `full` state into every host (waveLayout, cymatics rackLayout, LabShell, the
direct `<RackUnit>` callers in meter/EQ/Foundations/Mic Principles), give `RackStage` an opt-in
`fullScreen?: boolean` and let RackUnit own the modal + the StageAspectReport provider (the logic in
`soundsystems/rackLayout.tsx` l.~92–121 moves into RackUnit). Keep it **opt-in** so the other ~20
labs are untouched. Migrate Sound Systems to it and re-check its 52 pages still show the button
where they did (drawings yes; ROUTE 2/4–7 bus columns, LEARN 14 power band, OPERATE 1/5 power rack
no).

### 3.3 ⚠️ The Skia trap — labels that DON'T grow
Wave Physics, the Meter lab, Foundations and Mic Principles draw with a Skia `<Canvas>` and lay
React Native `<Text>` labels ON TOP at a fixed pt size. Zooming the box gives the picture more room
but those labels stay the same size. Two things are needed:
- **On the glass:** raise every overlay label to ≥ 9 pt (declutter where they collide).
- **In full screen:** labels must scale with the zoom. Recommended: `StageFullScreen` provides a
  `StageTextScale` context (= rendered width ÷ the glass width the stage would get at 1×, so 1 on
  the glass); the overlay label helpers multiply their fontSize by it. One place per lab:
  - Meter lab: `Lbl` helper `src/screens/lab/meter/vizMeters.tsx` ~l.172–194 (default size 8 at ~l.180).
  - Wave Physics: styles `wallLabel` / `msLabel` / `dbLabel` / `sceneLabel` in
    `src/screens/lab/wave/vizWave.tsx` ~l.2041–2066; overlay at ~l.1545–1568.
  - Foundations: `tickText` 8.5 (`foundations/viz.tsx` ~l.170–175), styles ~l.2350–2408,
    EqualLoudness 7.5/7 (~l.2724, 2767).
  - Mic Principles: `ResponseCurveView` axis text 8.5/8 (`micspeaker/viz.tsx` ~l.1428, 1529, 1558).

### 3.4 ⚠️ The SVG trap — `preserveAspectRatio="none"`
De-Esser, Speech, Envelope and the Amp `WavePanel` draw `<Svg width="100%" height={H}
viewBox="0 0 340 H" preserveAspectRatio="none">`. Stretch the width and the TEXT stretches sideways
(distorted glyphs) while its height stays put. For full screen, pass a height scaled with the width
(keep the ratio) — or switch those charts to the default "meet" with a proper viewBox height.
EQ's `ResponseCurveGraph` (`features/lab/fxViz.tsx`) has the opposite problem: viewBox height =
pixel height with "meet", so it caps at 1:1 and the 8 pt scale never grows — make its height scale
with the width, or it will not enlarge.

### 3.5 Labs NOT in the Rack Unit (no glass, no HIDE DISPLAY row)
Cable Install, De-Esser, Speech, Envelope, Amplifier and the Mic Principles Capsule tab draw their
figures inline in a scrolling page. They need a small shared wrapper, e.g.
`<ExpandableFigure render={(w, h) => …} aspect={…}>` in `src/screens/lab/kit/`: the figure as now,
plus a "⤢ FULL SCREEN" button directly under it (not over it), opening the same
`StageFullScreen`. These figures are width-driven SVG, so rendering them wider scales their text —
once the `preserveAspectRatio` issue (§3.4) is handled.

---

## 4 · The labs — measured numbers, where the code is, what to do

Numbers: smallest text on the display at 390 wide, from the survey
(`Downloads/2026-09-25_LAB_DISPLAY_TEXT_SURVEY.md`). "BOTH" = labels to ≥ 9 AND full screen.

### 4.1 Cable Dressing & Installation — worst (stages 9–13)
- Frame: its own stepped page. `cableinstall/CableInstallLabScreen.tsx` ~l.334 ScrollView, width via
  onLayout ~l.335, `<Body width={width}/>` ~l.382 from `scenes/index.tsx`. Stage → scene in
  `registry.ts`. All art is react-native-svg, width-driven (h from aspect) → re-renderable bigger.
- | Stage | Smallest | Under 9 | Art (file) | Small label sizes |
  |---|---|---|---|---|
  | 5 Support | 7.8 | 1 ("MAX SAG") | `SpanArt` in `SupportsScene.tsx` (viewBox 360×132) | 8.5 |
  | 7 Walls | 8.9 | 3 (A/B/C markers) | `RoomSvg` in `WallsScene.tsx` (360×200) | 9 / 10 |
  | 9 Floor | 7.0 | 25 of 26 | `StagePlan` 360×205, `FohPlan`/`BackstagePlan` 360×210, `CoilArt` 360×150 (`FloorScene.tsx`) | 8, 7.5, 7 |
  | 10 Signal | 6.5 | 5 of 5 | `FieldArt` 360×150, `CrossPreview` 120×64 (`EmiScene.tsx`) | 8.5, 7.5, 6.5 |
  | 11 Building | **5.5** | 6 of 6 | `BuildingArt` 360×224, h = w×0.62 (`FireScene.tsx`, 5.5 at ~l.392) | 8.5 → 5.5 |
  | 12 Identify | 6.5 | 8 of 8 | `SystemArt` 360×150, `SlackArt` 220×110 (`LabelScene.tsx`, 5.5 at ~l.451) | 7.5 → 5.5 |
  | 13 Final Inspection | 7.9 | 19 of 20 | `FacilityScene` 360×240, h = w×0.66 (`InspectScene.tsx`) | 8.5, 8 |
- Do: redraw labels to ≥ 9 (360-unit drawings render ~340 wide → author ≥ 9.6 units); add the
  ExpandableFigure (§3.5) to stages 9–13 (and 5/7 if cheap). Stage 13 has tappable numbered markers
  — full screen must keep them tappable (it will: same render).
- ⚠️ The Final Inspection finding cards now have photos (`data/defectArt.ts`); five were unwired
  today pending Computer C remakes — don't touch the photos.

### 4.2 De-Esser & Sibilance Control (8 of 9 pages)
- Frame: `PagedLab` — `deesser/DeEsserLabScreen.tsx` ~l.444, PAGES ~l.428–438.
- Art: `deesser/deEsserViz.tsx` (W = 340): `FrameStrip`, `HissDbStrip`, `DetectorTrace` (H 178),
  `BandSpectrum`, `PathDiagram` (H 160, not stretched). Labels 8.5 throughout (selected 9.5).
- Survey: pages 1–8 all 8.5 pt, 9–54 labels each (page 2 "Why EQ Is Not Enough": 54, crowded).
- Do: labels ≥ 9 (and declutter page 2); fix `preserveAspectRatio="none"` (§3.4); ExpandableFigure.

### 4.3 Wave Physics (all 16 modules)
- Frame: `wave/modules/waveLayout.tsx` ~l.87 mounts `<RackUnit stage={{render, size:'L'}}>` (no
  onEnlarge); modules `modWaveA.tsx` / `modWaveB.tsx` pass `stage: (w, h) => <RoomView…>`.
- Art: Skia canvas (`wave/vizWave.tsx`: `RoomSceneView`, `BarrierSceneView`, `GradientSceneView`)
  + RN overlay labels: wall 8, ray arrival ms 8 / dB 9, scene 8.
- Survey: wall labels 8 pt on every module (4–9 per page). **Reflection, Echo, Reverberation: the
  ray labels ("19.9 ms −5 dB") are ~7 pt by eye AND overlap each other** — needs decluttering
  (show labels for the first N / the selected ray, or stagger), not just a bigger font. Echo's
  bezel values are also truncated ("14.6 …").
- Do: overlay labels ≥ 9 + StageTextScale (§3.3); fullScreen on the shared rack; fix ray-label
  collisions.

### 4.4 Visual Audio Analysis — the meter lab (9 of 11 modules)
- Frame: direct `<RackUnit stage={{size:'L', render}}>` in `meter/modules/modMeterA.tsx`
  (Waveform, Peak, VU, Loudness), `modMeterB.tsx` (Spectrum, Spectrogram, Waterfall),
  `modMeterC.tsx` (Phase, Stereo, Scope, Signal Detective).
- Art: Skia in `meter/vizMeters.tsx` and `vizSpectral.tsx`; labels via the `Lbl` helper (default 8).
- | Module | Smallest | Under 9 |
  |---|---|---|
  | Peak Meter | **6.5** (dB scale) | 14 |
  | Spectrum | 8 | 14 |
  | Phase / Correlation | 7 | 8 |
  | Waveform | 7 | 6 |
  | Signal Detective | 7 | 6 |
  | Spectrogram | 7.5 | 5 |
  | Stereo | 7 | 3 |
  | Scope | 7 | 2 |
  | VU | 6.5 | 1 ("PEAK" lamp — font fix only) |
  | Loudness 9, Waterfall 10 | fine | 0 |
- Do: `Lbl` floor 9 + StageTextScale; fullScreen. ⚠️ `vizMeters.tsx` is shared with the SPL/tools
  meters (the LED "STACK" full screen ~l.2852 belongs to the SPL tool) — check every tool that uses
  `Lbl` still fits after the floor (RTA, SPL, Waveform tool).

### 4.5 Speech & Voice (9 of 11 pages)
- Frame: `PagedLab` — `speech/SpeechLabScreen.tsx` (PAGES ~l.10), pages in
  `speechPagesA.tsx` / `speechPagesB.tsx`.
- Art: `speech/speechViz.tsx` — `HeadCrossSection` (300×320, height 340), `VocalFolds` (340×130,
  stretched), `SpectrumBars`, `FormantChart`, `TraceChart`, `RangeBars` (W 340, 100 % width,
  `preserveAspectRatio="none"`). Labels 8.5 / 9.
- Survey: pages 2–10 at 8.5 (1–17 labels; page 4 Vowels & Formants 17). Page 1 anatomy at 9 —
  full screen optional.
- Do: labels ≥ 9, §3.4, ExpandableFigure.

### 4.6 Foundations of Sound — course (9 modules) + Playground
- Frame: `foundations/FoundationsCourseScreen.tsx` — 14 direct `<RackUnit>`s, each
  `render: (w, h) => <MxStage…>` (one `render: () =>` near ~l.1352 is a dock tray, not a stage).
  Playground: `FoundationsPlaygroundScreen.tsx` ~l.583, `size:'L'`, `<StageViz w h…>`.
- Art: Skia (`foundations/viz.tsx`) + RN overlay: `tickText` 8.5, styles 8.5/8/9, EqualLoudness
  7.5/7. `DualDomainView` uses fixed `DD_H` heights (won't grow — handle).
- | Screen | Smallest | Under 9 |
  |---|---|---|
  | Module 9 Loudness vs Amplitude | **7** — scale and "YOU SEND" overlap the curve | 12 |
  | Module 11 Harmonics | 8.5 | 7 |
  | Module 6 Wavelength | 8.5 | 3 |
  | Modules 2, 3, 4, 10, 14 | 8.5 ("+ / − PRESSURE") | 2 |
  | Playground | 8.5 — three views stacked in one 250 pt box | 7 |
- Do: overlay floor + StageTextScale; fix the module 9 overlap; fullScreen (the Playground gains the
  most — consider letting full screen show its three views at full height each).

### 4.7 Mic Principles (Off-Axis, Proximity; Capsule optional)
- Frame: `micspeaker/MicPrinciplesLabScreen.tsx` — Proximity `<RackUnit>` ~l.708 (render ~l.727):
  `ProximityApproachView` over `ResponseCurveView`; Off-Axis `<RackUnit>` ~l.820: `OffAxisMicView`
  (height min(110, h×0.42)) over `ResponseCurveView`. Capsule: own ScrollView → `MicCutaway`
  (SvgXml, width-driven) — not in the rack.
- Survey: Off-Axis 8 pt / 12 labels, Proximity 8 pt / 12 labels (the dB/Hz scale); Capsule 9.7
  (dense — full screen optional).
- Do: `ResponseCurveView` axis ≥ 9 + StageTextScale; fullScreen; ExpandableFigure for Capsule.

### 4.8 Amplifier lab (modules 1, 2, 5, 6, 7)
- Frame: own page — `amp/AmpModuleScreen.tsx` ~l.101 ScrollView → `<Component/>`
  (`amp/modules/index.ts` mod1–mod8).
- Art: SVG. Module diagrams: viewBox 360 wide, `width="100%"`, fixed heights (mod2 150); labels
  8.5–9.5 (render 7.8). `AmpRig.tsx` `WavePanel` W 340 × PANEL_H 58, `preserveAspectRatio="none"`.
- Survey: 7.8 pt, 5–8 labels (module 7 "Real-world operation": gain-chain boxes and "% of clip"
  tiny).
- Do: labels ≥ 9, ExpandableFigure, §3.4 for WavePanel.

### 4.9 EQ Lab — the frequency scale (11 of 15 modules)
- The scale `FREQ_TICKS = [50, 200, 1000, 5000, 20000]` is `SvgText fontSize={8}` in
  `src/features/lab/fxViz.tsx` (~l.172 and ~l.291) inside `ResponseCurveGraph`
  (`<Svg width="100%" height={H+14} viewBox="0 0 320 H+14">`). Modules pass
  `height={max(80, h-26)}` (e.g. `eq/modules/ParametricControls.tsx`).
- ⚠️ `ResponseCurveGraph` is also used by `fxLabConfigs.tsx` (Reverb/Delay/Chorus/… "designed
  response" graphs) and Wave `modWaveA.tsx` — one fix, many labs; re-measure them all.
- Do: tick labels ≥ 9 (check they still fit between ticks at 375); make the graph scale with
  width (§3.4); fullScreen on the EQ racks.

### 4.10 Oscillator Lab (Explore) and Envelope Lab — small
- Oscillator: `OscillatorLabScreen.tsx` → `LabShell` → RackUnit (`LabShell.tsx` ~l.434 passes
  `stage={rack.stage}`). `HarmonicBars` has NO viewBox; H1–H12 are `SvgText fontSize={8}` — pass a
  scale or raise to 9 (12 bars at 375 — check spacing). `TravelingWaveStrip` sizes itself via
  onLayout.
- Envelope: `PagedLab` (`envelope/EnvelopeLabScreen.tsx`), `EnvelopeChart.tsx`
  (`preserveAspectRatio="none"`, height prop 150); "90 % / 10 %" `Tag` default 8.5 → 9.

---

## 5 · Suggested order (one lab per commit, re-measure after each)
1. Shared FULL SCREEN in `rack/` + RackUnit opt-in + `ExpandableFigure` + `StageTextScale`; migrate
   Sound Systems; re-measure Sound Systems (must stay ≥ 9 everywhere, button where it was).
2. Cable Install (worst). 3. De-Esser. 4. Wave Physics (incl. ray-label collisions). 5. Meter lab
   (check the SPL/RTA tools after touching `Lbl`). 6. Speech. 7. Foundations. 8. Mic Principles.
   9. Amplifier. 10. EQ (then re-measure Reverb/Delay/Chorus/Flanger/Phaser and Wave).
   11. Oscillator + Envelope.
Background agents are fine for single labs (the Sound Systems redraw took one agent ~50 min);
give each the §0 rules, the §6 harness, and forbid it from editing `rack/`, `kit/` and other labs.

---

## 6 · How to measure (the harness that produced every number above)

- Start the web preview: `preview_start` with name **`ape-web`** (port 8091). If another chat's
  server is already on 8091, open it with `preview_start {url}` and never stop it.
- Set the tab to **390×844** (`resize_window`), then **375×812**; reset to desktop when done.
- Harness routes: `#soundsystemspreview`, `#eqmodulepreview`, `#micprinciplespreview`,
  `#cableinstallpreview` and more (App.tsx ~l.300–480). Change the query string (`?v=x`) to force a
  full load; HMR picks up edits. Other labs: Home → OPEN LABS → the lab (dev bypasses on). The full
  app root sometimes renders BLANK in the preview (seen twice on 2026-09-25) — use a harness hash.
- The Cable Install lab resumes at its last stage on reload.
- Built-in browser `javascript_tool` calls time out at ~45 s — one page or mode per call.
- Playwright is SHARED with background agents: one `browser_run_code_unsafe` call per sequence.
- In-page measure (display = everything above the HIDE DISPLAY button; SVG text scaled by its
  viewBox fit; RN text as is). For non-rack labs, bound the region to the figure instead:
```js
window.__m2 = () => {
  const hide=[...document.querySelectorAll('div')].find(d=>d.children.length===0 && /HIDE DISPLAY|SHOW DISPLAY/.test(d.textContent) && d.getBoundingClientRect().width>0);
  if(!hide) return null; const bottom=hide.getBoundingClientRect().top; const top=80; const out=[];
  for (const s of document.querySelectorAll('svg')){ const r=s.getBoundingClientRect(); if(!(r.width>40 && r.top<bottom && r.bottom>top)) continue; const vb=(s.getAttribute('viewBox')||'').split(/[ ,]+/).map(Number); const sc = vb.length===4? Math.min(r.width/vb[2], r.height/vb[3]) : 1;
    for (const t of s.querySelectorAll('text')){ const tr=t.getBoundingClientRect(); if(tr.width===0) continue; const fs=parseFloat(t.getAttribute('font-size')||t.style.fontSize||getComputedStyle(t).fontSize); const txt=t.textContent.trim(); if(txt) out.push({px:+(fs*sc).toFixed(2), txt:txt.slice(0,24)}); } }
  for (const e of document.querySelectorAll('div,span')){ if(e.children.length) continue; const txt=e.textContent.trim(); if(!txt) continue; const r=e.getBoundingClientRect(); if(!(r.width>0 && r.top>=top && r.bottom<=bottom)) continue; out.push({px:parseFloat(getComputedStyle(e).fontSize), txt:txt.slice(0,24)}); }
  out.sort((a,b)=>a.px-b.px); return {n:out.length, u9:out.filter(o=>o.px<8.95).length, min:out[0]? out[0].px+' '+out[0].txt : '-'};
};
```
  ⚠️ With `preserveAspectRatio="none"` the viewBox fit is not uniform — use `getScreenCTM()` (the
  Sound Systems agent did: `fontSize × Math.hypot(ctm.a, ctm.b)`), and check the vertical scale too.
  Words painted INTO a Skia canvas cannot be measured — judge by screenshot and say so.
- LOOK at a screenshot of every redrawn display, at 390 and 375, and in full screen at 1× and 2×.

---

## 7 · Out of scope for this job (noted, not asked for)
- **Font-fix-only labs** (zoom won't help — plain text): Gain Staging (8–8.5, "SIG/CLIP" ×15 on
  Multiple Gain Stages), dynamics labs' gain-reduction meter (8), Digital Audio captions (8–8.5),
  Mixing console page (7.5, 96 labels), Calculator header (8.5), Patchbay (8.9 — one-step bump),
  VU "PEAK" (6.5), Reverb/Delay decay graphs below the display (7). The owner has not asked for
  these yet — list them at the end of the report as the next candidates.
- **Sound Systems leftovers:** bezel values truncated at 375 ("REVERB HEA…", "SMALL POWERED-LOU…")
  — the shared `BezelReadouts`; LEARN 18's arrival timeline in the reading well prints ~5 pt.
- Not measured by the survey: Ear Training "See it" pictures (need audio), Connector lab steps 2+,
  Pre/Post-Production after starting a project, interacted states of every lab.

## 8 · State at hand-off
- HEAD `376666c0` + this file, pushed. Tree clean apart from the long-standing untracked image
  folders (`assets/exports`, `assets/compc-*`, `assets/group-5-defect-library`,
  `assets/Certificate_Squares` — leave them).
- Phones: last OTA 2026-09-25 ~23:15 PDT (local clock) ("Dashboard: required topics say REQUIRED FOR EVERY
  CERTIFICATE"), both channels, Pixel proven. Publishing routine: `docs/SESSION_HANDOFF_2026-09-25C.md`
  §8 (restore the pre-fix Swift file for the fingerprint, then `git checkout` it back — until the
  owner orders a build for `427a0897`).
- The Pixel runs the Play-signed internal-testing build 14 on channel `production`; do not sideload
  dev/preview builds onto it.
