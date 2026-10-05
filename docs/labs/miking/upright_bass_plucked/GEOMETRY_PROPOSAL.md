# C06a Upright Bass, plucked: GEOMETRY PROPOSAL (C06b reuses it)

Status: PROPOSAL. Uses the **BOWED-STRING FAMILY** (`violin/GEOMETRY_PROPOSAL.md` §1–§3) with the
double-bass column (body 1162, bouts 700/366/545, ribs 207–224, string 1115 SOURCED MET-EBERLE as
TRIAL; stop 665, bridge 160, endpin 250 drawing defaults).

## 1. Standing posture (ILLUSTRATIVE, drawing defaults)

World W: origin on the floor at the endpin tip; +y down; +x toward the audience; the bassist stands at
x = −350, slightly to the bass's treble side (z = −150). Instrument leans back toward the player 15° and
turns 20° so the top faces forward-right. Bridge centre ≈ (−60, −900, 0) (DERIVED from the defaults:
endpin 250 + tail-to-bridge 497 + tilt). Plucking hand region: x′ (frame B) ∈ [+60, +300] above the
bridge on the fingerboard end, string plane ± 60 — `env.ub.pluck`. Left hand on the neck. Feet zone
600 × 400 around the endpin.

## 2. Zones (each verified)

"Above the bridge" (survey ambiguity): the booklets say "just above bridge", so the proposal reads it as
a mic in front of the top at a height a little ABOVE the bridge (frame B x ≈ +60 … +150), aimed at the
bridge/upper f-hole area. Alternative reading (mic at bridge height, angled down) is listed for the owner.

| Zone id | Position (frame B) | Verification | Source |
|---|---|---|---|
| `zone.ub.shure.front` (start) | x ∈ [+60, +150] (drawing default), y = 0, z = 152.4–304.8 in front of the strings | **CONFIRMED** L9 | S-BWS, S-REC, S-LIVE |
| `zone.ub.shure.fhole` | a few inches from the treble f-hole: in front of `bw.fhole.R`, d drawing default 50–100 | CONFIRMED (no number) | S-BWS |
| `zone.ub.dpa.under` | clip on the E and G strings between bridge and tailpiece; capsule under the strings by the bridge (z ∈ (0, 160)), or angled to an f-hole | CONFIRMED | DPA-DB, DPA-BC4099, DPA-MOUNT, NEU-MCM |
| `zone.ub.live.clips` | low-profile mic on the tailpiece, an f-hole, or the ridge above the waist; never on the bridge | CONFIRMED (L-safety) | S-RHYTHM |
| `zone.ub.higher` / `.far` | toward the fingerboard / overall view — no numbers | lesson only | — |

Keep-outs: bridge (no clip), `env.ub.pluck`, endpin r 150, the player's feet, stand tipping arc (a stand
must not be able to fall onto the instrument: stand height < distance to the bass, DERIVED check).

## 3. UNKNOWNS for the owner

Modern bass size (Eberle 1734 drawn as TRIAL), stop, bridge height, endpin length, lean/turn, the
"above the bridge" reading (proposal: a little above the bridge, in front).
