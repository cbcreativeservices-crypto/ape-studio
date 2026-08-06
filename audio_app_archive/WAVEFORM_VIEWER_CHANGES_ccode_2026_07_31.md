# Waveform Viewer — Change Spec for ccode
_2026-07-31 · Machine A → ccode (client app) · grounded in 10:07 screenshots_

App source is not in Machine A's workspace, so this is a spec, not a patch. Three changes, priority order below.

---

## 1. Clip Overruns → tappable to reset the count
**Current:** the `CLIP OVERRUNS` stat card is display-only (shows `8`).
**Change:** make the card a tap target. On tap, reset the overrun counter to `0` and clear the "input clipping detected" warning state; counting resumes immediately on the next overrun.
**Acceptance:**
- Tapping the `CLIP OVERRUNS` card sets the displayed count to `0`.
- The amber "Input clipping detected…" advisory clears until a new overrun occurs.
- Reset affects only the counter/warning — capture, peak, zoom, and window are untouched.
- Add a subtle affordance (e.g. small "tap to reset" caption or pressed-state feedback) so it reads as interactive.
**Note:** reset the same state variable the detector increments; don't also zero the running peak-hold unless you want that too (recommend: no).

## 2. Default vertical zoom = ×2 (not ×4)
**Current:** initial ZOOM defaults higher than intended (spec was ×4; screenshots show ×6 active).
**Change:** set the initial/default ZOOM state to **×2** on first load of the viewer.
**Acceptance:**
- Opening the Waveform Viewer fresh shows **×2** highlighted and the trace drawn at ×2.
- ×1/×2/×4/×6/FREEZE all still work; only the default changes.
- Zoom remains display-only (does not change captured audio level) — keep the existing "Vertical zoom changes display size, not audio level" note.

## 3. Waveform resolution — render a dense trace, not a blocky envelope
**Problem (see screenshots 1–2):** the trace draws as a coarse, chunky filled blob — a few wide rectangular segments across the 2 s window. It reads as heavy downsampling / too few horizontal bins. The intended look (screenshot 3, DAW-style) is a fine, sample-dense waveform where individual transients and cycles are visible as a crisp thin trace.

**Likely root cause:** the draw loop buckets the sample buffer into far fewer bins than the canvas has horizontal pixels (or reuses a low-rate meter buffer), then fills wide rectangles. Result = stair-stepped envelope.

**Change — draw one min/max column per horizontal pixel:**
- Size the capture/display buffer to the full window: `samples = windowSeconds × sampleRate` (e.g. 2 s × 48 kHz = 96,000 samples). Keep capturing at the native audio callback rate — do not decimate before drawing.
- For each horizontal pixel column `x` (0…canvasWidth-1), map to its sample range `[x·N/W, (x+1)·N/W)`, compute **min and max** amplitude in that range, and draw a vertical line/segment from min→max for that column. This is standard peak/envelope waveform rendering and gives the dense trace in screenshot 3.
- Use a 1 px (device-pixel-aware) stroke; render on a canvas sized to `width × devicePixelRatio` so it's crisp on the phone's retina display (a CSS-pixel-only canvas will look blurry/blocky).
- Keep the existing vertical dBFS gridlines (−18/−24/−30) and the amplitude→dBFS mapping unchanged; this is purely a horizontal-resolution/rendering fix.
- Zoom ×N should scale the **vertical** amplitude mapping only (as today); it must not reduce horizontal sample resolution.

**Acceptance:**
- At the 2 s window, transients render as distinct narrow spikes with visible detail between them (compare screenshot 3), not 4–6 wide blocks.
- No stair-stepping on the leading/trailing edges of bursts.
- Trace stays crisp (no blur) on-device; performance stays smooth at the audio callback rate (throttle the *redraw* to ~30–60 fps via requestAnimationFrame if needed — decimate the *draw*, never the *capture*).
- Peak dBFS readout unchanged in behavior.

---

## Out of scope / unchanged
Levels remain dBFS uncalibrated-approximate (keep both advisories). Window buttons (0.5–4 s) keep changing display window only, capture unchanged. No DB involvement — all three are client-side.
