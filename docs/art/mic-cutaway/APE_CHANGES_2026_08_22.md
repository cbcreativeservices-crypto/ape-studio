# APE amendments to `dynamic_mic_capsule_cutaway` — 2026-08-22 (Computer A)

Applied after the four-axis deep review (`docs/APE_MIC_CUTAWAY_REVIEW_2026_08_21.md`).
Computer B's originals in this folder are **untouched**; every change is encoded in
`patch_mic_cutaway.mjs`, which regenerates all outputs from the pristine files:

| File | What it is |
|---|---|
| `mic_cutaway_wide.svg` | Patched wide master (lab / desktop view), viewBox `0 0 480 398` |
| `mic_cutaway_phone.svg` | Portrait phone variant, viewBox `24 20 268 378`, heavier hatch |
| `preview_wide.html` / `preview_phone.html` | Original preview harness with the patched SVGs spliced in |

Verified in-browser 2026-08-22: labels on, zero console errors, live label-dot
machinery (roll dot / dx-shift) confirmed working over the rebuilt label DOM;
no text collisions or crop clipping (checked numerically via `getBBox()`).

## Changes (fold back into `build_mic.py` / `gen_spec_mic.py` when regenerating)

1. **On-screen honesty caveat (MUST).** New always-visible `<g id="caveat">` under the
   drawing: motion is a simplified `v ∝ p` model, travel exaggerated ~1,000×, output
   assumes a connected load; a real cardioid is mass-controlled with displacement
   ≈180° behind front pressure. The §0(ii) honesty note now travels with the artwork.
2. **Phone variant (MUST).** Portrait crop `24 20 268 378` centered on capsule+gap;
   hatch strokes 0.42→0.68 / 0.35→0.55 and hatch opacities raised so material coding
   survives phone rendering. Labels render ≥12px at a 375-px-wide phone.
3. **Label re-layout (SHOULD).** Right-column labels moved from x≈294-298 to x=190
   with short elbow leaders (≤40 units — no more 140-unit runs across the wavefield);
   all label text gets a `paint-order="stroke"` dark halo; `textLength`/`lengthAdjust`
   squeeze removed (natural widths, per the RN-port review). Pole-region trio fanned to
   true targets: MAGNETIC GAP → gap slot (140.5,232); PHASE-SHIFT PASSAGE → the felt
   slot through the pole plate r64→72 (140.5,248); POLE PLATE → the steel below
   (140.5,266). Bottom band re-rowed (HOUSING joins BACK PLATE/MAGNET on y340;
   HUMBUCKING COIL x65 / VOICE COIL x141 so the phone crop doesn't clip). Copy:
   "OUTPUT TERMINALS"→"OUTPUT LUGS", "BACK PLATE / CUP"→"BACK PLATE" (crop width).
4. **Diaphragm PET tone cooled (SHOULD).** `gDia` `#e8d9b8/#c7a96c/#7a5a2c` →
   `#e3decf/#ada584/#5f5942`; `gDiaIn`, film stroke, sheen, clamp wedges neutralized
   to match. Command amber now solely owns the energy story. Voice-coil copper stays
   (physically honest); APE sets copper as the coil convention going forward — align
   the loudspeaker cutaway if it used blue.
5. **Dead defs removed (NIT).** `gHum`, `gAOring`.
6. **Citations.** Bauer US 2,237,298 confirmed (filed as B. Baumzweiger); Seeler
   US 3,132,713 / 3,240,883 correctly scoped to Unidyne III. ⚠️ "RCA BK-16A" could not
   be verified anywhere on the web (no BK-16 in RCA archives) — see the annotation in
   `REPORT_dynamic_mic.md`; re-check the printed Standard Handbook ch. 4.1 model number.
   Humbucking-coil history, if ever cited in learner copy: Electro-Voice (Al Kahn),
   1934, EV V-1 — no patent (adapted from ~1892 wattmeter prior art).

## Not changed
- All animated ids, keyframes, dash chain, timing — untouched (implementation review
  verified them numerically; the preview `render()` runs unmodified).
- The wide master keeps the full wavefield; the phone file is the same drawing with a
  different viewBox + hatch weights, so both track a single source of truth.
