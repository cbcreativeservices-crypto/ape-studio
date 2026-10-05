# A10 Harmonica: GEOMETRY PROPOSAL (three signal paths; amp = the SPK module)

## 1. Frame H (mm)
Origin **H0 = centre of the harmonica's hole face** (the mouth side). +x out of the back of the harmonica (the
direction sound leaves the cover-plate openings toward the cupped hands / mic); +y down; +z along the comb
toward hole 10. Harmonica body 102 long (SOURCED), height × depth drawing default 26 × 28. Player standing,
H0 at mouth height W (0, −1550, 0) (drawing default).

## 2. Paths (source-path selector)
1. **Acoustic stand mic**: `zone.hm.stand` d ∈ [150, 300] from H0 at mouth/hand height, just outside the hand
   envelope — **lesson trial, not a published figure** (label exactly so). Hand envelope `env.hm.hands`:
   ellipsoid 140 × 120 × 120 around the harmonica (drawing default) for open / half-cupped / cupped states.
   Breath cone from the lips (drawing default half-angle 20°, length 200) — aim "slightly off the breath stream".
2. **Cupped harp mic**: bullet mic in the hands, grille against the harmonica's back. Sizes: 520DX Ø 63 × 82.6
   (SOURCED); HB52 not drawn until its manual is read (Low). Cupped states change the drawn hand chamber
   only (no fake acoustics). Pattern badge: "omnidirectional — no rear null" (520DX).
3. **Amp speaker mic**: reuse **SPK Part A** unchanged (frame C, Celestion 12-in reference, '65 Deluxe Reverb
   combo from C02 as the default amp; zones `zone.cab.boundary` [25.4, 50.8] from the speaker on the dust-cap
   line, `zone.cab.pga27`, `zone.cab.sm57.*`). Tag every amp zone "guitar-amp source (Mills/Shure)".

## 3. Feedback/safety layer
Distance and angle from the cupped mic to the amp and wedges (readout); 520DX knob position slider with the
rule "set monitors so no feedback at maximum knob" (SOURCED). Signal-path tracer: hi-Z ¼-in → amp input OK;
→ console mic input "needs A95U-type transformer" (SOURCED); speaker output → mic input blocked (SPK rule).

## 4. Owner list
Harmonica height/depth; whether to show HB52; hygiene note (none sourced).
