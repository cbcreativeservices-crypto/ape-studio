# Module-shell labs — code audit (Track B, overnight 2026-09-14b)

Deep source reads (every page/scene/engine). Grades + only real findings.

| Lab | Grade | Critical | Major | Notable |
|---|---|---|---|---|
| Amplifier Principles (8) | A | 0 | 0 | mod2 device-terminal simplification (owner glance) |
| Ear Training (8) | A | 0 | 0 | minor: "flute-like" analogy for triangle (loose) |
| Tuning & Temperament (14) | A | 0 | 0 | every ratio/comma/cents verified from first principles; ch4 completion path slightly looser than its comment |
| Beginning Mixing (16) | A | 0 | 0 | real offline DSP; constant-power pan law verified |
| Advanced Mixing (20) | A | 0 | 0 | genuine BS.1770 LUFS miniature; "shelf" wording nit (pagesAdvD:356 peaking boost) |
| EQ Lab | A | 0 | 0 | FindFrequency L4 judges freq+gain not Q (owner glance) |
| Bass Guitar Physics | B+→A− | 0 | 1 FIXED | wavelength line fixed this run; E-string-specific wrongHint remains (minor) |
| Speech & Voice | A | 0 | 0 | formants = literal Peterson & Barney; doc-comment count nit |
| Smart Processors / De-Esser | A | 0 | 0 | benign double-shuffle; 6 planned members honestly disabled |
| Tube Reference (40×2) | A | 0 | 0 | pentode/beam-tetrode 40/40 correct; no fabricated specs; stale "30"/"10" doc comments; dead TubeGlyph |

## Verified-correct high-risk claims (spot list)
- Pythagorean comma 23.46¢ vs syntonic 21.51¢ kept distinct throughout Tuning.
- Meantone fifth ⁴√5 (696.58¢), wolf 737.64¢, ET third +13.69¢ — all correct.
- Peterson & Barney vowel formants exact (/i/ 270/2290/3010, /ɑ/ 730/1090/2440…).
- Bass H5 = pure major third 14¢ flat of tempered — correct and honestly taught.
- Pan law constant-power (0.5g² all positions; hard-pan = −3 dB) — correct.
- LUFS: K-weighting +4dB@1681Hz, HP@38Hz, 400ms/75% blocks, −0.691 offset.

## Minor / owner-glance items (not fixed — logged to _owner_items.md)
- Bass: 2nd CheckQuestion wrongHint hard-codes E-string numbers (5×41.2=206.0Hz,
  G♯3 207.65); shown for H5 on any string. Concept correct; only the hint's
  numbers are E-specific. Copy edit → owner.
- Amplifier mod2 DeviceDiagram BJT in=COLLECTOR/out=EMITTER power-flow simplification.
- EQ FindFrequency L4 pass judges frequency+gain direction/amount but not Q.
- Advanced Mixing pagesAdvD:356 calls a 2–4kHz PEAKING boost a "shelf".
- Tube Reference: stale "30 cards"/"10-topic" doc comments (user-facing says 40);
  dead TubeGlyph code; failReason not reset on Image 404 (defaults to net message).
- Speech SpeechLabScreen.tsx:4 "Ten visual modules" (ships 11) — comment only.

## Cognition / honesty (worth preserving)
Every lab: teach-before-test, per-distractor feedback, shuffled options,
pervasive illustrative/estimate/conceptual labeling, defensive playback engines
(double-tap guard, superseded-render, unmount dispose). No conditional-hook
hazards, no SVG-black, no DSP-unmount leaks found in any module-shell lab.
