# Audio Tools — session consolidation, 2026-08-19

Branch: `audio-tools-engine`. Work on the live measurement tools (SPL gauge, VU, MultiMeter, Waveform) plus the shared mic engine and a new browser-preview capability. All changes committed + pushed. This doc is the durable record; per-line detail is in git.

## Standards established / reaffirmed (governance)

- **Never default a level label to dBFS** — use **dBA/dBC** (+ honesty notice); dBFS is only for genuine digital readings. This REAFFIRMS the 2026-08-12 SPL ruling (`APE_GOVERNANCE_DECISIONS_2026_08_12.md` R1) and now applies app-wide incl. saved snapshots.
- **Notices at the very bottom** of a tool screen (so their changing height never reflows the meters/controls above).
- **Multi-option settings = compact value-button → chooser popup** (VU-fullscreen style), not rows of chips.
- **Landscape fullscreen = controls in a LEFT column**, visual fills the rest, ✕ top-right, **front-camera inset** (`camInset = max(insets.left, insets.right, insets.top)`), content gated on `winW >= winH`.
- **Reset lives in the readout container** (tap-to-reset + in-container hint), not a separate button.

## Per-tool changes

| Tool | What changed |
|---|---|
| **SPL 3D gauge** | 26 segments (was 13); yellow zone restored (studio: 85–95 CRITICAL IMPACT yellow, 96–99 HIGH orange, 100+ red); zone-coloured WARNING subtitle on orange/red/yellow; gold tiles + shimmer + sparkle unified (`goldActive`, can't appear apart); solid segments (LCD covers inner walls); landscape fullscreen (chips left, camera inset) |
| **Full VU / SPL home** | fullscreen camera inset; (VU list items 3–12 still tabled — `VU_CHANGE_ORDERS_TABLED_2026_08_18.md`) |
| **MultiMeter** | default **61-band 1/6-oct** RTA (derived from FFT via shared `src/features/tools/sixthOctave.ts`); primary readout → **dBC** (SPL·LCF) + ⓘ honesty; dB scale under the horizontal meter; SMART DETECTION → bottom; all dBFS labels → dBC / "relative dB" |
| **Waveform Viewer** | web-safe (SVG fallback when no Skia/CanvasKit); legend → top; notices → bottom; RESET CLIP removed → tap-the-container; PEAK/notes dBFS → relative; ZOOM/WINDOW → compact popups; landscape fullscreen with left controls; **custom trace-colour picker** (12-swatch, Academy-gated, persisted via `useWaveColorPref`) |
| **RTA** | dBFS sweep: weighting unit `dBFS`/`dBFS(A)`/`dBFS(C)` → `dB`/`dBA`/`dBC`; PEAK HOLD → `dB`; subtitle/unit/note reworded to "relative, uncalibrated, not SPL" |
| **Spectrogram** | dBFS sweep: subtitle/unit/OBS-MAX/PEAK/legend/scale-note → "relative dB" (colour anchor stays 0 dB full-scale per fixed-reference governance) |
| **SPL / VU** | already defaults to dBA (dBFS kept as a selectable digital option); accuracy note reworded off dBFS |
| **Mic engine (all tools)** | warm mic session across the tools section (adopt, don't cold-restart — kills the 5–10s open); user setting "Release mic in the background" (+ foreground resume); hub force-restarts on resume (fixes frozen previews); permission `check()` before `request()`; deferred start |

## Dev capability

Browser-iterate tools via `modules/ape-dsp/apeDspSim.ts` (web sim) + `src/screens/tools/ToolPreview.tsx` + `App.tsx` hash routes `#gaugepreview` / `#multimeterpreview` / `#waveformpreview`. Skia tools need a `SKIA_READY` SVG fallback.

## Open items (TODO)

1. **iOS MultiMeter randomly reverts to START** — interim resilience auto-resume added; root cause needs the Metro log line (blur vs remount vs JS/SVG error). Not from the warm-session change (that doesn't touch state→idle).
2. VU change orders 3–12 (tabled, thought-out sequence) — `VU_CHANGE_ORDERS_TABLED_2026_08_18.md`. #8 blocked on owner colour-scheme images; #11 confirm; #12 skins design.
3. Pre-launch cleanups: temp KT88 promo tube; RtaScreen still has its own copy of the 1/6-oct derivation (dedupe to `sixthOctave.ts`).

The Waveform Viewer's own request list (rev 24) is now COMPLETE: legend-top, notices-bottom, in-container clip reset, dBFS→relative, ZOOM/WINDOW popups, fullscreen, and the custom colour picker.

## Verify on device (not web-testable)

Warm-mic-session + background-release + frozen-hub fix + all fullscreen/orientation + camera-inset changes are native-only — confirm on the iPhone/Pixel: fast tool opens, tools-menu tiles live (not frozen) on return, fullscreens landscape with left controls clear of the lens, needle/segment/sparkle behaviour.

Memory: [[never-default-dbfs]], [[audio-tool-ui-standards]], [[tool-web-preview]], [[mic-warm-session]], [[integrity-and-governance]].
