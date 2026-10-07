# F10 Spatial and Specialist Field Pickup: GEOMETRY PROPOSAL

Status: PROPOSAL, no app code.

## 1. Frames
Scene frame F (plan view mostly; metres; scene front arrow, "north" only when relevant per L139). Array geometry in
mm from the array centre, reusing `lessons/shared/ensemble/stereoArray.ts` (`arrayCapsules`, `includedAngle`,
`arrivals`, `dtLR`).

## 2. Drawable model
| Item | Geometry | Class |
|---|---|---|
| Dummy head (generic line-art, two ear points, face direction) | ear spacing drawing default 150 mm; head height drawing default 1.6 m standing listener (F14 uses MEYER 1.7 m standing / 1.2 m seated — align to those) | DERIVED/ drawing default |
| In-ear rig on a person | ear points on a frame V head | Lab 5 head |
| 5.0 array (L/C/R + Ls/Rs) | positions drawing default (no source spacing); labelled "an example layout" | UNKNOWN → default |
| Compact surround unit | single body, five capsule arrows + "LFE derived" tag | generic |
| Double M/S | 3 capsules near-coincident: front card, rear card, side fig-8 with **positive lobe marked** | PRACTICE |
| IRT Cross / Hamasaki Square | square of 4 capsules; size drawing default | UNKNOWN |
| FOA tetrahedral mic | 4 capsules (FLU, FRD, BLD, BRU convention), orientation marker, upright / upside-down / endfire | CONFIRMED concept; capsule labels generic |
| Moving source path (walker) | from part 1 (F08) path tool if built; else a fixed walk path scrubbed by finger (no loop) | part 1 shared |

## 3. Non-placement pages (chain rack from frame M)
- **A-format drill**: drag four capsule tracks into order; pick FuMa or ambiX; catch a swapped channel; catch a
  full-range channel sent to LFE. Gains must be matched/linked (refuse unlinked).
- **Destination check**: headphones / 5.0 / stereo / mono: what each loses.

## 4. STARTING SETUPS
ONE MIC: dummy head at the listener point facing scene front. TWO MICS: FOA mic + separate close mono (the lesson's
"array does not isolate a source"). CLOSE · LIVE: none (spatial arrays kept out of PA — routing note instead).
FARTHER BACK · STUDIO: 5.0 front/rear array. ANOTHER START: Double M/S; IRT/Hamasaki add-on.

## 5. Shared / new
REUSE stereoArray (add presets `dms`, `foa`, `binaural`, `surround50`, `irt`, `hamasaki` — dims as drawing defaults
except where SOURCED), Lab 1/5 M/S decode. NEW: channel-map drill (shared with Lab 7 broadcast), FOA art.

## 6. Owner list
Hydrophone/contact scope stays with F16/F04 (D-6B-4). Array examples without sourced spacings drawn as "example
layout" — D-6B-7.
