# Tools & Analysis hub — LIVE tile previews (overnight build 2026-08-19)

Owner spec (2026-08-19, overnight session): the 8 tool-card miniature displays
come alive. This doc is the morning handoff. **See "Revision 2 — field
feedback" at the bottom for the changes made after your first look** (SPL
sensitivity, MultiMeter re-layout, RT60 continuous, tuner made real-time,
waveform 2× zoom); the body below describes the original build.

> After Revision 2 the split is **6 live mic cards** (SPL, MultiMeter,
> Waveform, RTA, Spectrogram, **Tuner**) + **2 scripted DEMO cards** (Tone/Noise
> Gen, RT60).

## What was built

| Piece | File (all under `C:\Users\profe\dev\ape-studio\`) | What it does |
| --- | --- | --- |
| Shared engine | `src\screens\tools\hubPreviewEngine.ts` | ONE mic/DSP session + ONE 80 ms (~12.5 Hz) tick for all live cards. Auto-starts on entering the hub (OS mic prompt on first visit), force-stops on leave/background/tile-tap, resumes on return. A tiny external store feeds the minis so ticks never re-render the screen. |
| Live minis | `src\screens\tools\hubPreviewsLive.tsx` | SPL (ballistic needle + LED ladder + peak lamp), MultiMeter (level bar, 30-band RTA, mini spectrogram, mini scope), Waveform (3 s envelope), RTA (31 bars + peak holds), Spectrogram (~7 s live heat history). Chrome is a **verbatim port of the approved strip artwork** — only the data layers move. |
| Simulated minis | `src\screens\tools\hubPreviewsSim.tsx` | Tone/Noise Gen: sine→square→triangle→saw→noise tour, seamless scroll, 6–14 s per shape. RT60: repeating plotted measurement (impulse → decay draw → fit line + noise floor → clear). Tuner: scripted string-tuning events with overshoot → settles green in the in-tune window. All drift independently with randomized start offsets. |
| Shared bits | `src\screens\tools\hubPreviewShared.tsx` | Art color ramps, ambient/vignette, the tiny **DEMO** tag. |
| Wiring | `src\screens\tools\ToolsHubScreen.tsx` | ToolStrip now routes sim/live/static; tiles pass `live`/`active`; `onActivate` releases the hub mic BEFORE navigating (deterministic handoff to the tool's own engine). |

Rendering is 100 % react-native-svg + RN Animated (native driver) — the hub
stays Skia-free (dense-screen render rule), works on the web preview, and
cannot crash a pre-Skia dev client. Steady state ≈ 200 dynamic SVG nodes,
well inside the ≤~700 budget; needles ride the native driver between ticks.

## Integrity + honesty

- Live minis mount ONLY while real frames flow. `absent` (web/stale client),
  `spike`, `denied`, `error` → the card rests on the static artwork. No fake
  meters, ever (§1.7).
- The three scripted cards carry a small dim **DEMO** tag (bottom-right of the
  display) — the ToolDemo-badge precedent at tile scale. §1.7 requires
  simulated visuals to be labeled; remove/restyle it if you want a different
  treatment, it's one component (`DemoTag` in `hubPreviewShared.tsx`).

## Rulings made overnight (flag if wrong)

1. ✅ **DECIDED (owner, 2026-08-19 morning): the hub mic feeds the DOSIMETER,
   and that is correct.** With the menu mic hot, the exposure monitor counts
   ordinary room sound (≥45 dB SPL est.) as environmental exposure — browsing
   the tools menu accrues daily dose on the DosimeterChip shown above the
   tiles, exactly as designed. No exempt flag; the behavior stands as-is.
2. **Mic auto-starts on the hub** (your spec §6) — an explicit exemption to
   the "user starts DSP" default, noted in code comments as owner order
   2026-08-19. Also: the **speaker is force-muted** while the hub mic is hot
   (feedback interlock) — irrelevant on the menu, tones resume once you leave.
3. **Auto-resume on refocus** — returning to the hub restarts the previews
   without a tap (denied mic never re-prompts; it just rests). Resume is
   deferred 400 ms past focus so a closing tool's engine teardown always
   lands first; a dead-capture watchdog (one auto-recovery per visit, then an
   honest rest on the static art) covers every remaining race.
4. **Zero-glyph strips kept** — no numeric readouts were added to the minis
   (Booth §6). The tuner mini shows no note letters; the needle tells the story.
5. **RTA mini draws 30 bars, not the art's 31** — the engine emits exactly 30
   third-octave bands, so the mini uses the MultiMeter strip's 30-bar geometry
   (same plot span, indistinguishable at tile size) instead of leaving a
   permanently dead 31st column.

## Adversarial review (overnight)

An 8-angle multi-agent review ran over the diff; 10 findings confirmed, 9
fixed on the spot (teardown races, a permission re-prompt loop on Android, the
DEMO tag sitting in the tile crop's hidden band, LED-ladder headroom mapping,
VU needle red-zone alignment, a sim-loop deadlock class, render-phase state
skew, zombie animation loops). The 10th was ruling #1 above — the owner
confirmed it as correct behavior, so nothing changed.

## Verified overnight

- `npx tsc --noEmit` clean; Metro web bundle clean (1896 modules).
- ToolsHub renders on the web preview (guest mode): all 8 tiles, DEMO tags on
  exactly the three scripted cards, zero new console errors.
- RT60 demo cycle runs (curve plots, fit + floor appear, clears, repeats).
- Lifecycle gating proven: with the app hidden/backgrounded every preview
  loop stops (this is why a hidden browser pane shows no motion — rAF and
  ResizeObserver freeze; that's the spec behaving, not a bug).
- ApeDsp is absent on web, so the five live cards correctly rest on static
  art there — live behavior needs the phone.

## Morning phone pass (the acceptance test)

1. Open Tools & Analysis → expect the OS mic prompt (first time only).
2. Speak/clap: SPL needle swings (fast up, slow settle) + LED ladder + peak
   lamp; MultiMeter bar/RTA/scope/spectrogram move together; Waveform reacts;
   RTA bars rise with peak-hold caps; Spectrogram paints your audio.
3. Watch quietly: Tone/Noise Gen cycles waveform types; RT60 plots and
   repeats; Tuner "tunes a string" and settles green — all off-sync from each
   other, silent.
4. Tap into any tool → tool works exactly as before (hub mic hands off).
   Return → previews resume.
5. Background the app → return: previews resume; no double meters, no stuck
   needles.

⚠️ Requires the CURRENT EAS dev build (ape-dsp v7). On the stale client the
live cards will just rest on their static artwork — that's the honest state.

---

## Revision 2 — field feedback (2026-08-19, after first phone look)

Six changes from your notes; all typecheck-clean and web-verified (live mic
behavior needs the phone):

1. **SPL VU meter "does not move" → fixed.** The needle was anchored so 0 VU
   needed a near-full-scale (−18 dBFS) signal; re-anchored to the **real SPL
   meter's default (−40 dBFS** = its RANGE 60 − offset 100), and the LED
   ladder / peak-hold / peak-lamp moved to a lively −62…−12 dBFS window. Normal
   room speech now swings the needle and lights the ladder; claps hit the peak
   lamp. If it feels too hot or too cold, it's two constants (`SPL_LIVE0`,
   `SPL_LED_FLOOR/SPAN` in `hubPreviewsLive.tsx`).
2. **Pro Audio MultiMeter re-laid-out** so it no longer reads like the RTA tile
   below it: now a slim **level bar on top, RTA on the LEFT, spectrogram on the
   RIGHT** — three different instruments side by side.
3. **RT60 no longer clears/pauses.** The decay curve, fitted line, and noise
   floor stay drawn permanently; the only motion is a glowing "measurement
   head" that sweeps down the curve and wraps seamlessly — continuous, no
   blanking.
4. **Tuner is now REAL-TIME**, not a scripted demo. The needle and cents cursor
   track live pitch from the mic (whistle, sing, or tune a real string in front
   of the phone). It moved from the DEMO set to the live set and lost its DEMO
   tag (it's a genuine meter now); pitch detection is enabled on the shared
   engine.
5. **Waveform now defaults to ×2 zoom** (matching the Waveform tool's own
   default) — quiet signals read twice as tall, loud transients clip at the
   panel edge.
6. Only **two** DEMO cards remain (Tone/Noise Gen, RT60) — verified on the hub.

Updated phone check: step 2 above now also covers the tuner (whistle a steady
note → needle homes toward centre and greens when in tune) and the MultiMeter
(RTA left, spectrogram right). Step 3 now only watches the two DEMO cards; RT60
should sweep continuously with no blanking.
