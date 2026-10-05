# C09a Violin / Fiddle: GEOMETRY PROPOSAL — and the BOWED-STRING FAMILY

Status: PROPOSAL. Sources: `violin/SOURCES.md` (family keys in §0 there). Value classes:
`acoustic_guitar/GEOMETRY_PROPOSAL.md` header. Viola (C09b), Cello (C09c), Upright bass plucked/bowed
(C06a/b) reuse §1–§3 with their own parameter rows.

## 1. Frame B (instrument frame, mm) — whole family

- Origin **B0 = the bridge's centre line on the top plate** (where the bridge feet line crosses the
  instrument's centre line), at the top surface.
- **+x** along the centre line toward the neck / scroll. **+y** across the top toward the highest string
  (E on violin, A on viola/cello, G on bass). **+z** out of the top (the front normal).
- The bridge stands at x = 0 from z = 0 to z = h_bridge; the string plane passes over it.
- Posture places frame B in the world (W: +y down, floor at y = 0 for seated/standing players): §4.
- Views: **front** (looking at the top: screen X = x, Y = y), **side** (screen X = x, Y = z) and a
  **player view** in W.

## 2. Family parameters

| Parameter | Violin | Viola | Cello | Double bass | Class / source |
|---|---|---|---|---|---|
| Body length | 358 | 388 | 755 | 1162 | MET-PIQUE / MET-BANKS / MET-VUILL / MET-EBERLE (TRIAL for modern instruments) |
| Overall length | 590 | drawing default 660 | 1240 incl. retracted endpin (other cello, MET-VC-AT) | 1966 | MET-PIQUE / — / MET-VC-AT TRIAL / MET-EBERLE |
| Lower / middle / upper bout | 203 / 110 / 165 | 229.5 / 132 / 185 | 439 / 236 / 342 | 700 / 366 / 545 | violin: lower = MET-FRANC overall width (TRIAL), middle/upper drawing defaults; others SOURCED (Met) |
| Rib height | 30 | 35 | drawing default 120 | 207–224 (upper 207, middle 224, lower 220) | MET-FRANC / MET-BANKS / — / MET-EBERLE |
| Stop (body neck-edge → bridge) | 195 | 215 | 400 | 665 | drawing defaults (UNKNOWN) |
| Body neck edge x / tail x | +195 / −163 | +215 / −173 | +400 / −355 | +665 / −497 | DERIVED from body length and stop |
| Vibrating string length | drawing default 328 | 352 | drawing default 690 | 1115 | MET-BANKS / MET-EBERLE SOURCED; others UNKNOWN |
| Bridge height h_bridge | 33 | 36 | 90 | 160 | drawing defaults |
| f-holes | x ∈ [−45, +40] at y = ±48 | ±55 | ±110 | ±170 | drawing defaults |
| Tailpiece | x ∈ [−150, −45] | [−160, −50] | [−330, −110] | [−460, −170] | drawing defaults |
| Endpin | — | — | out-length drawing default 300 | drawing default 250 | |
| Bow length | drawing default 750 | 740 | 715 | 749 | bass SOURCED (MET-DBBOW 74.9 cm); others UNKNOWN |
| Lowest open string | G3 196.0 Hz | C3 130.8 Hz | C2 65.41 Hz | E1 41.20 Hz | PHYS-ET (DPA-VC "65Hz", DPA-DB "41 Hz") |

## 3. Shared anchors and envelopes

`bw.bridge` (0,0,0)…(0,0,h_bridge) · `bw.contact` = bowing point, x ∈ [+10, +0.25·stop] at the string
plane (drawing default) · `bw.fhole.L/R` · `bw.tailpiece` · `bw.fingerboard.end` (x = drawing default
0.45·stop) · `bw.top.centre` (x = −0.25·body, 0, 0) · `bw.side.treble` (y = +half lower bout) ·
`bw.side.bass` · `bw.scroll`.

**Bow envelope `env.bw.bow`** (ILLUSTRATIVE): the bow hair crosses the strings at `bw.contact` and travels
its full length both ways along ±y′ (y′ = y tilted by the string-crossing angle, drawing default ±25°
from the highest to the lowest string). Volume = slab x ∈ contact ± 20, z ∈ string plane ± 40, y′ ∈
[−bow, +bow]; the frog/hand adds a sphere r 80 at each end. No mic, gooseneck or stand may enter it
(L-safety in all four lessons).

**Hand envelope `env.bw.leftHand`**: fingerboard x ∈ [fingerboard.end, nut], ±70 around the neck.

## 4. Violin posture (ILLUSTRATIVE, drawing defaults)

Standing player, W origin on the floor under the player's left shoulder. Violin tail under the chin at
(0, −1450, 0); the centre line points forward-left 45° from the player's facing direction and rises 10°
toward the scroll; the top rolls 30° toward the player's right. Head sphere r 110 at (−60, −1600, −80).
Chin rest at the tail on the bass side; shoulder rest under the back. Seated option: shift y by +450.

## 5. Violin starting zones (each verified)

| Zone id | Position | Verification | Source |
|---|---|---|---|
| `zone.vn.front` (studio start) | in front of and above the instrument, aimed at the bridge/top; d = 500–1200 from `bw.bridge` | **TRIAL kept as the lesson's own** (L9); it sits inside Shure's "1-6 feet (30 cm - 2 m)" for strings | lesson trial; S-PGA27 band |
| `zone.vn.geos` | 300 in front of `bw.contact` (along +z, in W rotated with the top) | not in lesson — a sourced session figure; recommend adding | GEOS |
| `zone.vn.overhead` | above the player, aimed down at the instrument; d drawing default 600–1200 | CONFIRMED L9 ("overhead aim from above") | NEU-KMAD |
| `zone.vn.side` (reinforcement) | "a few inches" from the treble side rib: y = +101.5 + (50…100) at x ≈ 0 — the 50–100 band is a drawing default, not a published figure | **CONFIRMED** L9 (Shure gives no number) | S-BWS, S-REC, S-LIVE |
| `zone.vn.clip` | VC4099 on the left (bass) side rib, gooseneck capsule aimed at the bridge or the f-hole, away from the head; fits 35–55 deep (violin rib 30 + arching: check — DERIVED fit is at the low edge, owner check) | CONFIRMED L36 | DPA-MOUNT |
| `zone.vn.mhs` | holder between tailpiece and bridge, x ∈ [−45, −5], capsule over or under the strings | CONFIRMED | DPA-MHS, S-BWS |
| `zone.vn.underBridge` | capsule under the strings by the bridge, x ≈ −10, z ∈ (0, h_bridge) | CONFIRMED | DPA-VLN |

## 6. Readouts

Distance to the bridge (grille front), height above the top, angle from the top normal, inside/outside
the bow envelope (fail state "move it", never blocking), clip fit, mono/blend panel (spot + main).

## 7. UNKNOWNS for the owner

Stop lengths, bridge heights, bow lengths (except bass), rib height of the cello, posture angles,
modern-instrument sizes (Met museum instruments used as TRIAL). Whether to add the GE-OS 30 cm figure.
VC4099 fit on a violin: rib 30 mm + arching ≈ total depth UNKNOWN (DPA lists violin, so it fits).
