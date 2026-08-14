# AP&E — Governance & Decisions Log (2026-08-13)

Rulings of record from the nav-chrome / UI-icon dev cycle
(`audio-tools-engine` branch). Successor to
`APE_GOVERNANCE_DECISIONS_2026_08_12.md`; the measurement-tools / SPL / lab
rulings in that log stand unchanged. Owner rulings issued in the Claude Code dev
session on 2026-08-13. The R-number series below restarts at R1 per house style
(each dated log numbers its own).

> Scope note: this log covers **navigation/chrome icon art** and a working
> practice. It does not touch the v3-curriculum or measurement-honesty rulings in
> the earlier logs — those stand.

## New rulings (owner, 2026-08-13)

### R1 — NAV ICON ART = BUNDLED RASTER, SINGLE SOURCE OF TRUTH
The four navigation icons (HOME, STUDY, PROGRESS, PROFILE) are now **bundled
transparent PNGs**, replacing the previous hand-drawn SVG `Path` / styled-`View`
glyphs. Owner-approved on device 2026-08-13 (commit `d410ee0`).

- **Art:** `assets/icons/nav/nav-home.png` (amber house), `nav-study.png` (blue
  headphones), `nav-progress.png` (white faders), `nav-profile.png` (green
  person) — 144×144, transparent.
- **Single source of truth = two funnel components.** All icon art lives in
  `src/components/nav/NavIcon.tsx` (all 4 glyphs) and `src/components/HomeIcon.tsx`
  (the shared house, reused for the "add to Home screen" toggle). Every other
  location — the bottom `TabBar`, the ToolsHub secondary nav row, Dashboard,
  TopicDeckSheet, Awards, Enrollment (Study ×6 + Home toggles), HomeSetupSheet —
  renders through these two components and updates automatically.
- **Behavior preserved:** active tab = full color + iOS glow; inactive = dimmed
  (0.4 opacity); labels + label colors unchanged. `HomeIcon` maps `filled` →
  opacity 1 (on Home) vs 0.35 (off) since a raster can't outline/recolor; its
  `color` prop is retained for call-site compatibility but no longer tints.
- **Re-skin procedure:** replace the PNG at the same path/filename and eyeball on
  device. No per-call art edits.

### R2 — PROGRESS TAB ICON CARRIES NO PROGRESS SEMANTICS
The PROGRESS tab glyph is **purely decorative/static**. It does not track, show,
or mutate any user progress. The prior album / silver-record progression feature
is **fully discarded** (superseding the 2026-08-07 "fixed silver record" note,
which is itself retired). The tab still routes to the Achievements stack; only
the icon's meaning changed.

## Working practice (owner, 2026-08-13)

- **Full absolute file paths to the owner.** Any path handed to the owner as an
  instruction (where to drop/save/find a file) must be a complete absolute
  Windows path from `C:\`, never relative or abbreviated. (Clickable
  repo-relative links in prose are fine; instructional paths are not.)
