# Fixes applied — overnight 2026-09-14b

One line per fix (commit + what). Newest at bottom.

- (pre-pass) bddc99c1 mic capsule black-smear fixed + device-verified
- (pre-pass) be0f2cc6 mic cutaway generator hardened (self-contained defs)
- (pre-pass) dc5deb61 removed redundant Patchbay PLANNED placeholder
- 956538d1 FX-rack duplicate ANIM_BADGE removed (FxLabScreen.tsx, all 12 labs)

## Bass Guitar Physics — harmonics-mode wavelength (MAJOR, code auditor Track B)
- `src/screens/lab/BassLabScreen.tsx:340` printed `λ = 2 × vibrating length`
  unconditionally. Correct in FRETTED mode (one lobe); WRONG in HARMONICS mode,
  where the string rings over its full length in n lobes so λ = 2L/n. In a lab
  titled "THE EXACT NUMBERS" this showed the fundamental's wavelength while a
  harmonic sounded. Fixed: line is now mode-aware (fretted → 2×vib length;
  harmonics → 2×full length ÷ n, n lobes). tsc clean, suite 1171 green.

## Mic/Fundamentals code auditor — safe fixes (commit below)
- `MicPrinciplesLabScreen.tsx` §-number comments corrected after the STEREO
  reorder: Plosives 5→6, Handling 6→7, Stereo 7→5 (comments only; dev-guard
  already proves keys match units.ts).
- `AmplitudeOrientation.tsx:728` CheckRta tallest-bar detection used float-equality
  `h === 0.92`; now `Math.max(...H)` (robust if the H array is ever edited).
tsc clean, suite 1171 green.
