# B01 Radio, Podcast and Studio Hosts: GEOMETRY PROPOSAL — defines the SEATED TALKER + DESK family (frame B)

Status: PROPOSAL, no app code. Sources: `radio_host/SOURCES.md` (§0 keys). Value classes SOURCED / DERIVED /
TRIAL / UNKNOWN as `lead_vocal/GEOMETRY_PROPOSAL.md`; an UNKNOWN the picture needs is a **drawing default**
(`placeholder: true`, never a readout). Learner text: suggested starting points, no brands (generic types only).

## 1. Frame B (broadcast talker) — used by B01, B02, B06, B07 (seated) and B03/B05 (standing variant)

- **Reuse frame V** (`lessons/shared/voice/voiceSpec.ts`): origin = lip point, +x mouth axis, +y down, +z left.
  The head is the existing line-art head (HEAD_C, HEAD_R, NOSE, CHIN).
- **NEW once (shared/broadcast/talkerPose.ts): the SEATED talker** — a seated `PlayerPose` (`posture: 'seated'`
  already exists in players/playerPose.ts) with the voice head; chair, desk top and desk edge in the same frame.
  Seat height, desk height, lip height above desk: UNKNOWN → drawing defaults (adult; e.g. desk 740 mm, lip 450 mm
  above the desk top), owner list.
- **NEW once: HEAD TURN** `yaw ψ ∈ [−60°, +60°]` and `pitch θ ∈ [−25°, +10°]` (reading down) rotate the mouth axis
  about the neck; mics fixed to the desk/boom (B01) or to the chest (B02/B05) stay put → DERIVED readouts:
  mouth-to-capsule distance r(ψ, θ) and off-axis angle. This one control teaches B01 "turning", B02 "head turns",
  B05 "chest vs head" and B06 "turning to a neighbour". Turn limits are drawing defaults.

## 2. Parts and where sound leaves (MEET IT)
Mouth (direct speech), breath jet (plosive cone, illustrative, Lab 5 drawing default), the desk top (a REFLECTOR,
drawn as an image-source path), chair/arm/paper/keyboard (mechanical noise sources, tap-to-name), room surfaces
(one wall, one ceiling line), the second host.

## 3. Mics (generic types; new ones → shared/broadcast/broadcastMics.ts)
| Type id | What | Pattern | Body | Class |
|---|---|---|---|---|
| `bcDynEnd` (NEW) | end-address broadcast dynamic on a boom arm | cardioid | length/diameter UNKNOWN (no spec read) → drawing default | pattern SOURCED (S-SM7B-UG class); body placeholder |
| `vocLdc` (REUSE, voiceMics) | side-address condenser | cardioid | existing | reuse |
| `vocDynCard` (REUSE) | handheld-style dynamic on a desk stand | cardioid | existing | reuse |
| `boomArm` (NEW mount) | desk-clamped spring arm (2 segments + clamp) | — | segment lengths UNKNOWN → drawing default | mount |
| `popScreen` (REUSE Lab 5) | pop screen ≥ 100 mm from the mic (N-POP) | — | — | reuse |

## 4. Zones (distance lip point → capsule front; aim on the mouth axis unless stated)
| Zone id | Geometry | Class / source |
|---|---|---|
| `zone.b01.dynClose` | r ∈ [25.4, 152.4], end-address | SOURCED S-SM7B-UG (conv.) |
| `zone.b01.dynPod` | r ∈ [101.6, 152.4] | SOURCED R-POD (conv.) |
| `zone.b01.condPod` | r ∈ [152.4, 203.2], side-address front toward the mouth | SOURCED R-POD (conv.) |
| `zone.b01.offBreath` | same r, capsule ~10–20° to the side of or above the breath jet, still aimed at the mouth | direction SOURCED (R-POD "very slight angle"); angle UNKNOWN → drawing default 15° |
| `zone.b01.multi` | each host r < 152.4; mics turned away from each other | SOURCED R-BLEED |

## 5. STARTING SETUPS (roles, `engine/setups.ts`)
- ONE MIC = `dynPod` on a boom arm, aimed slightly past the mouth (worked example).
- TWO MICS = two hosts across a desk, each `multi`, rear of each mic toward the other host (plan view).
- CLOSE · LIVE = `dynClose` (live talk show, closer = more margin).
- FARTHER BACK · STUDIO = `condPod` side-address in a quiet room.
- ANOTHER START = pop screen + `offBreath`.

## 6. Readouts and physics (all DERIVED from the drawing)
- r, off-axis angle, proximity indicator (monotone, directional only), level change vs r (inverse square,
  −6 dB/doubling, S-LIVE) — the only number.
- **Desk reflection (NEW once, shared):** image source of the mouth in the desk plane → path difference Δd, Δt =
  Δd / c (CALC-C 343.21 m/s) → first comb notch f = 1/(2Δt) labelled "a simplified picture" (reuse
  `engine/physics/twoMic.ts`). Used by B01, B02, B06, B07.
- **Two hosts:** each mic hears the other host later: Δt and notch via twoMic; 3:1 ratio shown as a NOTE (never graded).
- NOM / gain-margin panel (Lab 5, no feedback simulation) for the live talk-show variant.

## 7. Clearance (collision)
Head/neck/torso solids (voicePose), desk box, script/paper zone on the desk (keep-out for the mic, sight-line cone
from eyes to a screen = keep-out, drawing default), arm clamp on the desk edge.

## 8. Owner list
Seated dims (drawing defaults); turn limits; default distance 100 mm (D-HOST1); show the desk-reflection notch?
