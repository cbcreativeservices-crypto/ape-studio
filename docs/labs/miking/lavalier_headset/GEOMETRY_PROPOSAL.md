# B05 Lavalier, Headset and Concealed Pickup: GEOMETRY PROPOSAL — defines the BODY-WORN family

## 1. Frame
Frame V talker, standing (voicePose SINGER_SIDE/TOP) and seated (`radio_host` §1). Head turn ψ/θ is the key
control: body-worn mics on the torso stay put; headworn mics rotate with the head.

## 2. Body-worn mounts (NEW once → shared/broadcast/bodyWorn.ts; used by B02, B05, B06, B07; later B10/B11)
| Mount point | Where (frame V) | Class |
|---|---|---|
| `mount.sternum` | centre chest on the mid-sagittal plane, 125–250 mm from the lip point (down and slightly forward) | SOURCED S-PASTOR 127–203 / SN-ME2 250 / S-CHURCH ~203 (D-LAV1); torso surface from voicePose solids |
| `mount.lapel` | lapel edge, offset ±60–90 mm from the mid-plane (drawing default) | PRACTICE (lesson: "offset lapel … rehearse turns") |
| `mount.collar`, `mount.tie`, `mount.neckline` | garment edge points | PRACTICE (S-LAVPICK names shirt/tie/collar; no numbers) |
| `mount.concealed` | same points behind one fabric layer (drawn) | PRACTICE |
| `mount.headset` | capsule 20–30 mm from the mouth corner, outside the breath jet, on a boom from an ear hook/headband | SOURCED SN-ME3 (D-HS1) |
| transmitter pack | belt/waist, antenna per manual (drawn, text only) | PRACTICE |

Clothing: one jacket/shirt garment layer over the torso (drawing default), the clip, cable with the BROADCAST LOOP
and a secondary loop (R-LAV) drawn as real cable paths — a "cable strain" check: the loop absorbs a sit/stand move.

## 3. Mics (NEW)
`lavOmni` (miniature omni, Ø/length UNKNOWN → drawing default; REUSE `miniOmni` art from Lab 4 if the size fits),
`lavCard` (miniature directional; orientation matters), `hsOmni` (REUSE `vocHeadset`), `hsCard` (headworn cardioid).

## 4. Readouts (DERIVED)
- r(ψ, θ) and off-axis angle for chest vs headworn as the head turns (the lesson's core); level change in dB
  (inverse square) between facing forward and a 45° turn.
- Breath-jet hit: ON when the capsule is inside the illustrative jet cone (Lab 5 drawing default).
- Lectern + body mic both open: Δt and first notch (twoMic) → "mute one".
- Live variant: NOM + gain-margin panel; headworn vs chest r feeds the PAG distance term (S-LIVE formula, Lab 5).

## 5. Setups
ONE MIC = visible omni lav at `mount.sternum` (upside-down clip trial as a note); TWO MICS = lav + boom safety
(cross-link B04) or lectern + headset (mute one); CLOSE · LIVE = `hsOmni`/`hsCard` at the mouth corner;
FARTHER BACK = — ; ANOTHER START = concealed lav, lapel lav.

## 6. Safety in plain words
Consent before fitting; wardrobe approves garment changes; skin-safe adhesive only on skin; never a bodypack lav into
48 V phantom except through its specified adapter; the wearer can remove it.

## 7. Owner list
Garment drawing (one generic jacket + shirt); show the transmitter pack; omit hairline/wig placement (lesson calls it
specialist) — proposed omit.
