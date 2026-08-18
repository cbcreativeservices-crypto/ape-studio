# AP&E — Governance & Decisions Log (2026-08-17B, audio-tools UI + tube-cards session)

Rulings of record from the Measurement-Tools menu redesign + Tube Reference
2-page rebuild session (`audio-tools-engine`). Successor to
`APE_GOVERNANCE_DECISIONS_2026_08_17.md` (the earlier artwork/UI-polish session
of the same day); earlier logs stand. R-numbers restart per house style.

## R1 — TUBE REFERENCE LIBRARY: 30 → 40 TUBES, TWO PAGES EACH (APPROVED)

The corrected owner card set replaces the earlier error-laden cards. Registry
`src/screens/lab/tube/tubeRefs.ts` is now **40 tubes**; schema changed from a
single `file` to a shared **`stem`** + `tubePageUrl(stem, page)` + `TUBE_PAGES = 2`.
Each tube has two pages `<stem>-p1.png` / `-p2.png`.

- **10 new tubes (31–40):** 6CA7, 7189, 5881, 7581A, 7408, **2A3-40**, 845W,
  6FQ7, 7044, 7119. Their browse metadata (family/base/role/alternates) was
  filled from standard references and **OWNER-APPROVED 2026-08-17**. Electrical
  specs stay in the card image only (source-of-truth rule upheld); nothing
  electrical is keyed. `// VERIFY` markers cleared on approval.
- **#28 renamed 5R4GY → 5R4** to match the corrected set (alt keeps `5R4GY`/
  `5R4GB` so search still hits).
- **Viewer (`TubeCardScreen`):** per-tube **PAGE 1 / PAGE 2** toggle in its own
  fixed row above the image (never overlaying it — same rule as the nav bar), a
  ≤3-word category label to its left, zoom + page reset on tube/page change,
  and prefetch of the other page + neighbours' page 1.
- **Image delivery — OPTIMIZED via Supabase image transformation (Pro plan):**
  cards are served from `…/storage/v1/render/image/public/tube-diagrams/<file>?width=2048&quality=75&format=webp`
  → ~882 KB PNG becomes ~190 KB WebP (~4.6× smaller), CDN-cached, **no
  re-upload**. `format=webp` is explicit because RN's `Image` may not send an
  `Accept: image/webp` header (without it the transform falls back to PNG).
  Source-of-truth PNGs (2160×3840) are untouched in the bucket. Width 2048 ≈ the
  2160 source so pinch-zoom stays legible.
- **Upload:** owner uploaded the 80 files to the public `tube-diagrams` bucket.
  Helper `scripts/upload-tube-diagrams.mjs` (dependency-free, service-role key
  via env, upserts) remains for future re-uploads.
- **SCREEN_STATUS:** TubeReference + TubeCard moved 🔵 → 🟢 (owner sign-off).

## R2 — MEASUREMENT-TOOL CARD STRIPS (SVG ASSET PIPELINE + SVGO BAN)

The 8 per-tool 2:1 "display strip" SVGs are real `.svg` files in
`assets/tool-strips/`, imported as components via **`react-native-svg-transformer`**
(new devDep + `metro.config.js` + root `declarations.d.ts`).

- **CRITICAL — `.svgrrc.js` sets `svgo: false`.** The transformer's default SVGO
  re-minifies gradient ids down to `a,b,c…`, which **collides across the 8
  strips inlined on one screen (web/react-native-web)** and reinstates the
  design team's "D-A" bug (tile 06's blue→red mirror ramp rendered flat). With
  SVGO off, the hand-suffixed ids (`mir_b06`, `amb_b06`, …) survive and every
  tile keeps its own gradients. **Do not re-enable SVGO on these files.**
  (Native scopes ids per `<Svg>` so the bug is web-only, but the app builds for
  web — verified fixed at the SVGR-transform level.)

## R3 — AUDIO TOOLS MENU (ToolsHub) VISUAL SYSTEM — REAL-PANEL LOOK

The 8 tools now read as recessed glass **displays cut into one gray rack panel**,
reusing the dashboard's study-method-panel language so the two screens match.

- **Panel** = the dashboard `BlackFaceBg` face: medium-gray vertical gradient +
  the identical 130-speck deterministic bead-blast grit + lit-top / shadow-bottom
  lips, drawn in pixel space. Darkened well below the dashboard gray per owner
  (`#16161a/#222227/#08080c`). **Outer panel corners stay SQUARE**; its drop
  shadow lives on a wrapper view (a rounded `overflow:hidden` panel can't cast
  its own shadow on iOS).
- **Tiles = cutouts** (dashboard `cutoutMount`: black cut-edges, thicker top/left)
  with a **two-radius nested corner** — outer frame **10**, inner glass display
  **11**: the rounder inner corner shows through while the dark cavity peeks in
  the 1-pt corner gap. The 2:1 strip is cropped to **2.5:1**, trimming only the
  strips' safe top/bottom margin (all plot content sits inside y 104–920 of
  1024 — nothing lost).
- **Glass overlay** per tile = the dashboard `GlassScreen` recipe (smoked tint +
  sheen→dim + top-left specular + edge glares); the dim was lightened per owner,
  and the press "power-on" glow peak reduced 39%.
- **Press interaction mirrors the dashboard SwitchButtons:** the display sinks
  **1px** into its recess + a **Rigid haptic on touch-down** (gated by Settings ›
  Haptics via `hapticsEnabled()`), then the screen **illuminates** (a power-on
  glow ramps up), holds a beat, then navigates — reusing the switches' exact
  `Haptics.impactAsync(Rigid)` call.
- **Layout:** 2-across order top→down = SPL · MultiMeter / Waveform · RTA /
  Spectrogram · Noise Gen / RT60 · Freq Counter (via a `TILE_ORDER` list; shared
  `TOOLS` data untouched). Titles use the hero "Measurement & Analysis" face
  (Oswald Medium), smaller + centered, two-topic names split at the slash. The
  "N tools available" line was removed and the hero tightened; the accuracy ⓘ
  chip moved from the screen header to the hero's top-right, above the dosimeter.
- **Orphaned pending cleanup:** the old `ToolIcon` + `ICON_COLOR` (superseded by
  the strips) are left in the file for a later cleanup pass, per the
  don't-delete-in-this-pass convention.

## R4 — MEASUREMENT-STRIPS WORK ORDER CLOSED

The 2026-08-17 CCODE work order (`CCODE_WORK_ORDER_MEASUREMENT_TOOL_STRIPS`) is
**CLOSED / superseded**. Its deliverable — the 8 per-tool 2:1 display strips —
shipped (R2) and the screen they live on (**ToolsHub**) is **owner-signed-off
2026-08-17** (SCREEN_STATUS 🟢). The two acceptance items left open at handoff
resolve as follows:

- **Colorblind / high-contrast / dark modes (work-order criterion 9 / R-4):** the
  strips are **fixed-palette SVG images** — they render identically in every
  Settings display mode. They cannot break; they simply do not adapt. This is the
  work order's own accepted caveat (R-4) — confirmed and accepted.
- **Tile-04 (spectrogram) vector weight (criterion 8 / R-3):** never surfaced as
  jank — the screen scrolls and its press animation runs smoothly on device, and
  it was signed off. No PNG swap needed.

The strips were also cropped 2:1 → 2.5:1 and reframed as recessed glass displays
(R3), so the work order's original "full-width 2:1 inset" layout (D-1) was
superseded by owner direction during the redesign. No open items remain.

## Process note

Consistent with `verify-before-claiming-done`: a real **web-only regression**
(the SVGO gradient-id collision, R2) was caught and fixed at the transform level
before the work was called done. The browser preview pane would not render for
screenshots this session, so visual acceptance of the ToolsHub redesign is by
the owner on device; code changes were type-checked and Metro-bundle-verified
each step.
