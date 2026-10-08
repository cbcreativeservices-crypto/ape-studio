# F13 Room Acoustics and Reverberation: GEOMETRY PROPOSAL

Status: PROPOSAL, no app code.

## 1. Frames
Scene frame F indoors: a room plan (metres) + section. Frame M objects.

## 2. Drawable model
| Item | Geometry | Class |
|---|---|---|
| Rooms (variants): studio/booth, rehearsal/concert space, venue with installed PA | plan sizes drawing default; reuse `roomdesign/roomModel.ts` room shapes where they fit | drawing default |
| Test source: omni (dodecahedron-like generic) on a stand at a performer position; or the installed PA | generic | PRACTICE |
| Receivers A, B (+ "after change" pass) | omni measurement mic on stand; height drawing default 1.2 m seated ear (MEYER-MAPP) | SOURCED (Meyer seated height used as a sensible listener height, labelled "seated ear height") |
| Keep-outs | people/stands out of the direct path; wall/corner proximity flag (drawing default 1 m) | PRACTICE / default |
| Curtains, door, panels (room state toggles) | toggles change only the label/state log — no invented RT change | — |

## 3. Non-placement pages
- **Decay reader**: a MODEL decay curve (labelled "a simplified example") with a noise floor slider; the tool fits
  T20 (−5…−25, ×3), T30 (−5…−35, ×2), EDT (0…−10, ×6) and refuses T30 below 45 dB range, T20 below 35 dB
  (RA-T). Same model per band (125 Hz–4 kHz octaves) with drawing-default band floors. Reuse `features/tools/learn/rt60.ts`
  maths if it exists there; otherwise new pure module `shared/measure/decay.ts` with tests.
- **Label maker**: "room only" vs "system + room" result label (the PA variant must carry the PA name/preset).

## 4. STARTING SETUPS
ONE MIC: receiver A at a seated position, omni, source at the performer position. TWO MICS: A and B (move only the
receiver). CLOSE · LIVE: installed-PA variant at a listener seat (system + room). FARTHER BACK · STUDIO: booth comparison
before/after panels. ANOTHER START: avoid-this example: mic in a corner / centre of room only.

## 5. Shared / new
REUSE frame M, scene frame F, calc `rt60`/`eyring`/`drr` (optional "predict" card), Learn concept text. NEW: decay
reader (`decay.ts`), room-state log fields.
