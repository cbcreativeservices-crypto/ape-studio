# A06 Flute (metal + wooden): GEOMETRY PROPOSAL — and the EDGE-TONE family (flute, piccolo)

Value classes / drawing-default rule: `trumpet/GEOMETRY_PROPOSAL.md` header. Sources: `flute/SOURCES.md`.

## 1. Frame F (mm)
Origin **F0 = centre of the embouchure hole**. **+x** along the flute toward the foot end (to the player's
right). **+y** down. **+z** away from the player (forward, toward the audience). The cork is at x = −17
(SOURCED). Flute held roughly horizontal to the player's right, rolled so the embouchure faces the lips;
the tube axis yaws 10–15° back toward the player (drawing default).

## 2. Variants (one parameter row each)

| Parameter | Metal Boehm | Wooden keyed (grenadilla) | Simple-system wooden | Class / source |
|---|---|---|---|---|
| Overall length | 660 | 660 | drawing default 600 | PL-2010 / Y-HUB-PICC; simple-system UNKNOWN |
| Bore Ø | 19 | 19 | drawing default 19 (conical body) | PL-2010 "approx. 19 mm"; wooden same (lesson L: "tone holes sized similarly") |
| Embouchure → foot end | x ∈ [0, 643] (660 − 17) | same | drawing default | DERIVED |
| Joints | head / body / foot (3 pieces) | same | head + body (drawing default) | SOURCED (Y-HUB-PICC) |
| Left hand / right hand regions | LH x ∈ [180, 300], RH x ∈ [360, 500] | same | finger holes only | drawing defaults |
| Keys | Boehm keys (drawn as cups) | keys | open finger holes, few/no keys | words SOURCED (lesson), layout drawing default |

## 3. Radiation / register layer
- Sources: embouchure hole (always active, breath + jet), first open hole (moves with fingering), foot end
  (all-closed lowest notes). First-open-hole position x_k ≈ 655.9·2^(−k/12) − 17 for the first register
  (DERIVED from the half-wave C4 length, ILLUSTRATIVE).
- Cutoff "a little above 2 kHz" (UNSW-FLUTE): above it, more radiation from further holes/foot.
- Measured trend (PL-2010): strongest front-downward and to the player's right; tag "measured trend".
- **Air-jet cone `env.fl.jet`**: from the lips across the embouchure hole along +x/−z, cone half-angle 15°,
  length 150 (drawing default) — a capsule inside it shows "breath noise" (L19 "out of the air jet").

## 4. Zones (each verified)

| Zone id | Region | Verdict / source |
|---|---|---|
| `zone.fl.dpa.close` | 50–100 from the tube, aimed at the point x = ½·x_LH (halfway mouthpiece→left hand, LH = 240 default ⇒ aim ≈ x 120) | CONFIRMED, DPA-FLUTE |
| `zone.fl.shure.close` | "a few inches" in front of the region x ∈ [0, x_firstHole] | CONFIRMED words (no number) |
| `zone.fl.behindHead` | behind and slightly above the head, aimed at the finger holes | CONFIRMED (DPA-FLUTE, S-REC) |
| `zone.fl.front1m` | ≈ 1000 in front, at head height | CONFIRMED, DPA-FLUTE |
| `zone.fl.mdat` | 609.6–1219.2 in front, aimed between lip plate and left hand; "never at the end" marker on the foot | ADD, MDAT |
| `zone.fl.uclip` | strap around the foot end, capsule pointed at the keys | CONFIRMED, DPA-FLUTE |
| `zone.fl.headset` | head-fixed capsule near the embouchure | CONFIRMED, DPA-FLUTE |

## 5. Envelopes
Head turn ±20° yaw with the flute (drawing default) — no boom where the head or foot joint can strike it;
hands; wooden variant: no-clamp zones on joints, no covering of holes (lesson safety).

## 6. Owner list
Hand-region defaults; jet-cone size; simple-system dimensions; whether to show the MDAT zone.
