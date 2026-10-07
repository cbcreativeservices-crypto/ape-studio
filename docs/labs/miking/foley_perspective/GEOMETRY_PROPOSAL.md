# F05 Foley Perspective and Multiple Microphones: GEOMETRY PROPOSAL

Status: PROPOSAL. Frame F + Foley stage (`foley_footsteps/GEOMETRY_PROPOSAL.md`); stereo arrays = Lab 5's
**stereo-array tool** (`lessons/shared/ensemble/stereoArray.ts`, `ArrayArt.tsx`) placed in frame F (frame F's axes
match frame S on purpose, so `arrayCapsules(id, opts, { c, face, tilt })` works unchanged). The **moving-source
path** is the shared path tool from `field_moving_passby/GEOMETRY_PROPOSAL.md` §2 (built once by group 2, used here
at Foley-stage scale).

## 1. Scene
- Origin = the START of a marked action path on the stage: a key ring carried across a 2000 mm zone left → right
  at hand height (L53 exercise), or steps across the pit (F01 stage, two pits wide = 2400 mm path). Path length
  drawing default.
- The learner **scrubs** the source along the path with a finger (no loop, D8); readouts update.

## 2. The four arrangements (STARTING SETUPS)

| Setup | Geometry | Class | Role |
|---|---|---|---|
| One mono mic | short shotgun at r ∈ [914, 1829] from the path centre, in front, aimed at the centre (Roesch) | SOURCED (MIX-2005) | **ONE MIC** (worked example) |
| Close + room | close mic as ONE MIC; room LDC at r = 3000 (drawing default), 2000 high | method SOURCED (MIX-2005, HECKER, ASE-CROSS) | **TWO MICS** ("two perspectives, not left/right") |
| XY | `arrayCapsules('xy', { angle: 90 })` at r = 1500 from the path centre (drawing default), facing the path | angle SOURCED (DPA-STEREO, RODE-BAR); distance drawing default | ANOTHER START ("XY pair") |
| ORTF | `arrayCapsules('ortf')` (locked 170 mm / 110°, recording angle 95°) at r = 2000 | SOURCED geometry; distance drawing default | **FARTHER BACK · STUDIO** (the wider, farther pair) |
| M/S | `arrayCapsules('ms')` forward cardioid + side figure-8; width control | SOURCED matrix (DPA-STEREO) | ANOTHER START |
| Live | one source-proximate directional mic at a fixed station (F01 `zone.f01.close`), PA + wedge | method SOURCED (S-AUTOMIX, S-LIVE) | **CLOSE · LIVE** |

## 3. Readouts (all from the drawing; "a simplified picture" said once)
- Per mic: distance and arrival angle to the moving source; inverse-square level along the path.
- Close + room: Δt (`twoMic.deltaTms`) and the ideal comb, redrawn as the source moves ("any one alignment is only
  locally true", L31); polarity switch with the honest note.
- XY: inter-channel LEVEL difference from the two cardioid gains at the arrival angles (`polar.gain`) → image dot.
  ORTF: level difference + Δt (`dtLR`). M/S: decoded L/R level from M and S gains with the width factor; mono sum =
  M only (DERIVED from the matrix).
- "Near/far is not left/right" sorting check (practice page).
- Live: NOM penalty 10·log10(NOM) and the "+9 dB noise for 8 open mics" fact as words.

## 4. New for this lesson (built by group 2, shared)
- The **path tool** in frame F (shared with F07/F08 in frame G).
- An **image readout** (`lessons/shared/field/stereoImage.ts`): level-only (XY, M/S) and level + time (ORTF/AB)
  image position — model labelled simplified; pure and tested.

## 5. Owner list
XY default distance; the stereo image dot as a simplified model (approve).
