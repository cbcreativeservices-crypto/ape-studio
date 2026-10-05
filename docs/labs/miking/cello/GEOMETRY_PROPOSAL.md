# C09c Cello: GEOMETRY PROPOSAL

Status: PROPOSAL. Uses the **BOWED-STRING FAMILY** (`violin/GEOMETRY_PROPOSAL.md` §1–§3) with the cello
column (body 755, bouts 439/236/342 SOURCED MET-VUILL; stop 400, bridge 90, rib 120, endpin 300, bow 715
drawing defaults).

## 1. Seated posture (ILLUSTRATIVE, drawing defaults)

World W: origin on the floor at the endpin tip; +y down; +x toward the audience; +z to the player's left
(audience's right) — the cellist faces +x.
- Chair seat 460 high; player's hips at x = −450.
- Instrument: endpin tip at (0, 0, 0); body tail 300 up the endpin; the instrument leans back toward
  the player by 25° from vertical and turns 10° to the player's left; the top faces the audience.
- Resulting bridge centre ≈ (−150, −620, 0) and string plane facing +x (DERIVED from the defaults).
- Knees at z = ±180 against the lower bouts; left hand on the neck; bow arm on the player's right
  (z < 0) sweeping `env.bw.bow`.
- Music stand: 600 in front of the player at 1100 high (drawing default) — a sight-line keep-out.

## 2. Zones (each verified)

| Zone id | Position | Verification | Source |
|---|---|---|---|
| `zone.vc.shure` (start) | 304.8 from `bw.bridge`, in front of the top (+x in W) at bridge height, offset laterally to clear the bow (drawing default 150 toward the player's left) | **CONFIRMED** (distance); direction = lesson reading | S-BWS, S-REC, S-LIVE |
| `zone.vc.clip` | C-CLIP / 4099C or MC 2 on the C and A strings between bridge and tailpiece; gooseneck curves below the strings so the capsule sits between bridge and fingerboard **under** the string plane (z ∈ (0, h_bridge)), clear of the bow | CONFIRMED; survey's art question answered: the gooseneck runs under the strings | DPA-VC, DPA-MOUNT, DPA-CCLIP, NEU-MC2 |
| `zone.vc.fhole` | clip capsule angled to an f-hole for highest output | CONFIRMED | DPA-MOUNT |
| `zone.vc.far` | solo in a good room: farther, no number (drawing default 600–1500) | lesson L9 (no number) | — |

Keep-outs: `env.bw.bow`, endpin and its floor contact (r 150 around the tip), chair legs, the player's
feet; "never tug a cable across a cello" → cable may not cross the instrument's front.

UNKNOWN: endpin length, seat height, tilt and turn, rib height, stop, bridge height.
