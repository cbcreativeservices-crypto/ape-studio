# AP&E — Governance & Decisions Log (2026-08-17, covering 2026-08-16 evening → 08-17)

Rulings of record from the artwork-completion + UI-polish session
(`audio-tools-engine`). Successor to `APE_GOVERNANCE_DECISIONS_2026_08_16.md`;
earlier logs stand. R-numbers restart per house style.

## R1 — CABLE LAB CONNECTOR IMAGERY COMPLETE (48/48) + XLR GALLERY

All 30 owner-produced images uploaded + HTTP-200 verified; `connectorImages.ts`
maps every ConnectorId (18 pre-existing + 30 new + usb_c_power/poe reuse).
`mini_xlr` = nickel FEMALE (owner ruling; black male parked `_unused-`).
euroblock/opticalcon/mini-xlr are `.png`. XLR card renders a tappable
MALE/FEMALE/CABLE gallery (`CONNECTOR_IMAGE_GALLERIES` — generic, any connector
can join). Unmapped still renders nothing (no-placeholder rule upheld).

## R2 — LAB IMAGE PRODUCTION PROGRAM (owner-scoped)

Survey of all labs/tools produced two lists. LIST B (genuinely new): Tier 1+2
= 23 prompts RATIFIED + in production at ChatGPT
(`docs/art/APE_LAB_IMAGES_TIER1-2_2026_08_16.md`, reference-search companion
`..._REFERENCE_SEARCH_2026_08_16.md`); Tier 3 SHELVED to post-launch. LIST A
(wire ~30 existing bucket photos into labs) awaits the owner's explicit GO.
From 2026-08-17 image return/creation runs in a DEDICATED session — handoff of
record: `docs/art/APE_LAB_IMAGES_HANDOFF_2026_08_17.md`.

## R3 — AMPLITUDE ORIENTATION ENHANCEMENTS (final state)

- Musical dynamics on the level scale: `pp mp f fff` only (ppp/p/mf/ff
  removed, positions held), engraved **Bravura SMuFL** glyphs (asset + OFL in
  `assets/fonts/`; canonical codepoints E520/E521/E522), drawn in **Skia at an
  exact baseline** (RN <Text> clipped/hid them — root-caused, not tunable), now
  ABOVE the bar between quiet/loud, each mark colored to the gradient below it.
- Bar row: quiet/loud above; below the bar "less ──▶ more" with the gradient
  arrow spanning EXACTLY the bar width.
- Reusable `AmplitudeArrow` (Skia; gradient or solid; right/up/down/left;
  dotted) on the six views: waveform + oscilloscope ↑AND↓ (both phases, edge
  gutter so data is never covered), level meter + RTA ↑, SPL →, spectrogram =
  NO amplitude arrow; instead a dotted gray time axis "past ←···· now" (live
  scroll semantics; display right edge lands on the "o" of now).
- LEVEL-BAR RAMP STANDARD (app-wide precedent): any bar whose SIZE encodes a
  level shows the ramp CLIMBING to its peak color (peak only at the tip) —
  `rampColors`/`rampColorsSymmetric` in `features/tools/levelColor.ts`. Applied:
  amplitude cards, MultiMeter SPL fill, HarmonicStems stem, gainViz V+H stage
  meters, foundations DragSlider (levelTint only), foundations per-harmonic
  waveform strokes. Segmented meters/gradients/points/text/2-D fields audited
  and left as-is (already correct).

## R4 — NAVIGATION TRANSITION STANDARD (two transitions only)

"Switching areas FADES, opening content PUSHES." Fade-through (~280ms after the
41% slow-down) between: bottom-nav tabs (TabBar stationary), Splash/Auth/Main,
Dashboard⇄Certificates(Awards), Dashboard⇄Tools(ToolsHub), Glossary⇄Dashboard.
Push (platform-native horizontal; iOS `simple_push` @490ms since UIKit
`default` duration is fixed; Android platform-paced) = the default for all
drill-ins. Reduce Motion: pushes → 170ms fade. No zoom/bounce/shared-element
anywhere. Swipe-back: enabled ONLY on a slider-free pilot set (ToolInfo/Learn/
Concept/Library, AudioLearning, EarLab, LabCategory, TubeReference/TubeCard,
AmplitudeLab) — the 2026-08-11 gestureEnabled:false ruling still governs
slider screens. OPEN: Android predictive back needs a manifest opt-in at the
next EAS dev build. SSoT: `src/navigation/reduceMotionNav.ts`.

## R5 — HOME CAROUSEL FEATURED-CARD SHIMMER (final recipe)

Centered card only: border light-sweep, 97% arc from the LOWER-LEFT corner,
clockwise, 1670ms pass, fade-in first 17%, fade-out 67%→99%, whole trace 57%
dimmer (SHIMMER_MASTER 0.43), repeat every **37s**, first pass ~1.2s after a
card lands. Skia sweep-gradient stroke; SR-hidden; reduce-motion skips; taps
pass through. All parameters are named constants in CourseSelectionScreen.

## R6 — PROGRESS NAV ICON FADER ANIMATION

ACTIVE Progress tab only: the PNG swaps for a code-drawn replica whose three
fader BLOCKS drift slowly (4.2/5.4/6.2s legs, desynced, continuous —
resetBeforeIteration:false fixed the periodic snap); tracks never move. Normal
drift stays BELOW the top 1/4 of travel; at most ONE excursion into it per
3 MINUTES (rotating fader, module-guarded across remounts), still never fully
up. Static PNG everywhere else; reduce-motion static; SR-hidden; still shows
no user data (static-glyph ruling upheld). JS driver on web only (react-native-
web's vendored NativeAnimatedHelper lacks its own Platform import — web-preview
third-party defect; device unaffected).

## R7 — JOG WHEEL FEEL (Dashboard expanded rotary)

Kept CLEAN SSL dial (tick-ring experiment removed — owner: not asked for).
Tracking: finger deltas → continuous unbounded target; grab = 50ms glide (no
teleport); slow motion = direct set (no animation object — owner: engage only
when needed); fast motion = stiff UI-thread spring (1800/90, overshoot-clamped)
filling frames between JS touch events on high-refresh displays. Detents 45°,
300ms step throttle, haptics, dead-zone, tap-outside-close all unchanged.

## R8 — DASHBOARD INSTANT LANDING (stale-while-revalidate)

`features/dashboard/dashboardCache.ts` (module-scope; registered in
resetAllLocalStores so account switches never flash stale data). Dashboard
seeds from cache → paints instantly on return/remount; `load()` cold-spinners
ONLY with nothing to show; silent-refresh failures never replace good content
with the error screen; the focus refetch defers via InteractionManager until
the landing transition completes.

## Process note

Owner reprimand of record (2026-08-16): twice the assistant declared a visual
result good/"approved" from a glance while glyphs were clipped. Standing
correction in assistant memory (`verify-before-claiming-done`): never claim
done/working/approved without genuine verification; approval is the owner's
word alone; examine screenshots edge-to-edge before responding.
