# C08 Electric Bass Amplifier: GEOMETRY PROPOSAL

Status: PROPOSAL. Sources: `electric_bass_amp/SOURCES.md`. Reuses the **SPEAKER FAMILY** (frame C,
`speaker_leslie/GEOMETRY_PROPOSAL.md` Part A) and the C02 zone vocabulary
(`electric_guitar_amp/GEOMETRY_PROPOSAL.md`). Only the bass-specific parts are listed.

## 1. Cabinet and drivers

| Item | Value (mm) | Class |
|---|---|---|
| `cab.bass.410hlf` outer | W 762 × H 609.6 × D 482.6 | SOURCED AMP-410 |
| Woofer centres | (y, z) = (±150, ±170) from the baffle centre | drawing default (speaker module) |
| 10-in woofer | R_cone 117.9, R_dust 42, R_surround 107 | drawing default = CEL-V30 values × 10/12 (UNKNOWN) |
| Horn | centre (y −235, z 0) i.e. above the top pair; mouth 100 × 60 | drawing default |
| Rear port / open back | flag `rearPort` drawing default off | lesson L41 mentions both; model UNKNOWN |
| Head on top | Venture-type head, drawing default 330 × 75 × 250 | UNKNOWN |
| Optional 1×15 | for the S-RHYTHM 10/15 comparison: drawing default 15-in cone R 180 in a 600 × 600 × 450 box | UNKNOWN (no 15-in cabinet sourced) — or omit and teach the 10/15 point in words |

## 2. Zones (frame C on the chosen woofer)

| Zone id | Lateral | d (mm) | Verification | Source |
|---|---|---|---|---|
| `zone.bass.boundary` (start) | r = R_dust | 25.4–152.4 | CONFIRMED L9 as a start; the boundary itself is borrowed from S-MILLS (guitar) | S-PGA27, S-MILLS |
| `zone.bass.breathing` | any r | 101.6–457.2 | **CONFIRMED** L9 (Shure "4 - 18 inches") | S-BASSREC |
| `zone.bass.center` / `.edge` | r = 0 / r = R_surround − 10 | as chosen | CONFIRMED L17/L20 ("bite" / "warm") | S-BASSREC |
| `zone.bass.horn` | on the horn axis | close | CONFIRMED L26 (S-RHYTHM "on the horn for more high-end definition") | S-RHYTHM |
| `zone.bass.far` | condenser "further away" | no number; drawing default 600–1000 | CONFIRMED L40 (no number) | S-BASSREC |

The two bands overlap 101.6–152.4: show both, the overlap is the natural first try.

## 3. DI and signal path (not geometry; a labelled chain)

Bass → (pedals) → J48 INPUT/THRU → amp INPUT; J48 XLR → console (needs 48 V; pad −15 dB; low-cut
−6 dB at 80 Hz). Amp DI XLR (Pre/Post; −20 dB) → console. Speaker jack → cabinet ONLY (speaker cable).
Unsafe-patch stop: any speaker-level jack → mic/line/DI input (L43). Acoustic path delay readout:
d_total / c from the shared calculator constant (no fixed delay is taught, L37).

## 4. Player envelope (ILLUSTRATIVE)

Standing bassist 800–1500 in front of the cabinet, offset z −800 (drawing default); feet/pedal zone as
C02; long neck sweep: keep stands ≥ 300 from the headstock path (drawing default; a 34-in-scale bass is
~1150 long overall — UNKNOWN, not sourced here).

## 5. UNKNOWNS for the owner

10-in and 15-in speaker sizes, horn size and position, whether to draw a 1×15 at all, rear port.
