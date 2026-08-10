# Tube Reference — build spec (handoff for Fable) · 2026-08-09

Owner is redoing/expanding the Vacuum Tube lab with **30 full-screen tube spec
cards** (owner-produced PNGs, 2160×3840, 9:16, dark theme matching the app).
This doc is the agreed design + data so the build needs no re-derivation.

## Decisions (owner, 2026-08-09)
1. **Keep the concepts lab + ADD a "Tube Reference" section.** The existing
   interactive `VacuumTubeLabScreen` (10 Skia sections: Inside → Classics) STAYS.
   The 30 cards become a new browsable REFERENCE, and the old 8-tube "Classics"
   teaser section is retired / replaced by a link into the reference.
2. **Browse = grouped list + search.** Rows grouped by family, each showing the
   tube + alt-names + base. Search matches short name, alt-names, and family codes
   (e.g. "12AX7", "ECC83", "GZ34", "CV5220").
3. **All member-gated.** The whole reference is an Academy-membership feature —
   gate with the existing entitlement provider; non-members get the paywall
   prompt (mirror the pattern in `CalcLabScreen.onNewWorkflow`).
4. **Viewer** = full-screen card, **pinch-zoom + pan** (pin tables / ratings are
   dense), **swipe left/right** between tubes; images from Storage via cached
   `expo-image`. Loading + error states.

## Images / storage
- **Bucket:** `tube-diagrams` (public read) — ALREADY CREATED in Supabase project
  `yjgolswjggmlpeowvtxr`. 5 MB limit, png/webp/jpeg.
- **Files:** flat, original names `01-12AX7.png` … `30-EZ80.png`.
- **Public URL:**
  `https://yjgolswjggmlpeowvtxr.supabase.co/storage/v1/object/public/tube-diagrams/<file>`
- Serve from Storage (do NOT bundle ~27 MB into the app). `expo-image` caches.

## Data principle — specs stay in the image
The registry stores ONLY what the list/search need: **name, alt-names, family,
base, role, file**. Do NOT re-key the electrical specs (heater V, max plate,
dissipation, gain, PIV…) into code — the **card image is the single source of
truth** for specs, so there is no second copy to drift (consistent with the calc
source-of-truth standard). Card headers are authoritative for exact alt-names /
role; the table below is transcribed from the cards + domain knowledge — verify
against each card during build.

## Proposed data model
```ts
export type TubeFamily = 'preamp' | 'power' | 'dht' | 'rectifier';
export type TubeRef = {
  id: string;        // 'e12ax7' or '12ax7' (route param; keep url-safe)
  num: number;       // 1..30 display order
  short: string;     // '12AX7'
  name: string;      // header line, e.g. '12AX7 / ECC83'
  alt: string[];     // searchable alternates incl. CV / mil numbers
  family: TubeFamily;
  base: string;      // 'Noval (9-pin)' | 'Octal (8-pin)' | 'UX4 (4-pin)' | '4-pin jumbo'
  role: string;      // subtitle, e.g. 'Dual high-gain triode — preamp'
  file: string;      // '01-12AX7.png'
};
```
Family group labels + order: **Preamp / Small-Signal Triodes** (1–9) ·
**Power Pentodes & Beam Tetrodes** (10–19) · **Directly-Heated Triodes** (20–23)
· **Rectifiers** (24–30).

## Tube registry (transcribe/confirm against card headers)
| # | file | short | family | base | alt-names | role |
|---|------|-------|--------|------|-----------|------|
| 1 | 01-12AX7.png | 12AX7 | preamp | Noval 9-pin | ECC83, 7025 | Dual high-gain triode — preamp |
| 2 | 02-12AY7.png | 12AY7 | preamp | Noval 9-pin | 6072 | Dual medium-mu triode — preamp |
| 3 | 03-12AT7.png | 12AT7 | preamp | Noval 9-pin | ECC81 | Dual triode — preamp / phase inverter |
| 4 | 04-5751.png | 5751 | preamp | Noval 9-pin | 12AX7 family (μ70) | Dual triode — preamp (lower-gain 12AX7 sub) |
| 5 | 05-12BH7.png | 12BH7 | preamp | Noval 9-pin | 12BH7A | Dual medium-mu triode — driver |
| 6 | 06-6CG7.png | 6CG7 | preamp | Noval 9-pin | 6FQ7 | Dual triode — driver (6SN7 in Noval) |
| 7 | 07-5687.png | 5687 | preamp | Noval 9-pin | 7044 | Dual triode — high-current driver |
| 8 | 08-6SN7.png | 6SN7 | preamp | Octal 8-pin | 6SN7GTB, CV181 | Dual medium-mu triode — driver |
| 9 | 09-6SL7.png | 6SL7 | preamp | Octal 8-pin | 6SL7GT | Dual high-mu triode — preamp |
| 10 | 10-EL84.png | EL84 | power | Noval 9-pin | 6BQ5 | Power pentode — audio output |
| 11 | 11-EL34.png | EL34 | power | Octal 8-pin | 6CA7 | Power pentode — audio output |
| 12 | 12-KT77.png | KT77 | power | Octal 8-pin | EL34 upgrade | Kinkless tetrode — audio output |
| 13 | 13-6L6GC.png | 6L6GC | power | Octal 8-pin | 5881, 7581 | Beam power tetrode — audio output |
| 14 | 14-6V6GT.png | 6V6GT | power | Octal 8-pin | 6V6 | Beam power tetrode — audio output |
| 15 | 15-KT66.png | KT66 | power | Octal 8-pin | 6L6 family | Beam tetrode — audio output |
| 16 | 16-KT88.png | KT88 | power | Octal 8-pin | CV5220 | Beam power tetrode — audio output |
| 17 | 17-6550.png | 6550 | power | Octal 8-pin | 6550A | Beam power tetrode — audio output |
| 18 | 18-KT120.png | KT120 | power | Octal 8-pin | — | Beam power tetrode — audio output |
| 19 | 19-KT150.png | KT150 | power | Octal 8-pin | — | Beam power tetrode — audio output |
| 20 | 20-300B.png | 300B | dht | UX4 4-pin | WE300B | Directly-heated triode — SE output |
| 21 | 21-2A3.png | 2A3 | dht | UX4 4-pin | — | Directly-heated triode — SE output |
| 22 | 22-845.png | 845 | dht | 4-pin jumbo (top-cap anode) | — | Directly-heated transmitting triode — SE |
| 23 | 23-211.png | 211 | dht | 4-pin jumbo (top-cap anode) | VT-4C | Directly-heated transmitting triode — SE |
| 24 | 24-5AR4.png | 5AR4 | rectifier | Octal 8-pin | GZ34, CV1377 | Full-wave rectifier — B+ supply |
| 25 | 25-GZ37.png | GZ37 | rectifier | Octal 8-pin | CV378 | Full-wave rectifier — B+ supply |
| 26 | 26-5U4GB.png | 5U4GB | rectifier | Octal 8-pin | 5U4G | Full-wave rectifier — B+ supply |
| 27 | 27-5Y3GT.png | 5Y3GT | rectifier | Octal 8-pin | 5Y3 | Full-wave rectifier — B+ supply |
| 28 | 28-5R4GY.png | 5R4GY | rectifier | Octal 8-pin | 5R4GB | Full-wave rectifier — B+ supply |
| 29 | 29-EZ81.png | EZ81 | rectifier | Noval 9-pin | 6CA4 | Full-wave rectifier — B+ supply |
| 30 | 30-EZ80.png | EZ80 | rectifier | Noval 9-pin | 6V4 | Full-wave rectifier — B+ supply |

## Build slices
- **A. Registry** — `src/screens/lab/tube/tubeRefs.ts`: the 30 `TubeRef` entries
  above + a `tubeImageUrl(file)` helper returning the public Storage URL.
- **B. Browse screen** — `TubeReferenceScreen`: grouped list by family + search
  box (match short/alt/family). Academy gate via the entitlement provider;
  non-members → paywall prompt. Header matches app lab-screen chrome (back, title,
  AccuracyNote optional).
- **C. Viewer** — `TubeCardScreen` (route param = tube id): `expo-image` from
  Storage, pinch-zoom + pan (`react-native-gesture-handler` + `reanimated`),
  horizontal swipe/pager between tubes in registry order; loading + error states.
- **D. Wiring** — register both routes; add a "TUBE REFERENCE →" entry from the
  fundamentals lab (replace the old 8-tube Classics section's link), and from the
  lab hub if appropriate.
- **E. Polish** — image caching/prefetch of neighbours, a11y labels, the gate UX,
  landscape/large-text sanity.

## Verify (per repo convention)
`cd ape-studio && npx tsc --noEmit --pretty false` (EXIT 0) + Metro bundle 200.
Native RN — not browser-observable, so no browser verification.
