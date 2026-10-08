# B11 Athletes, Coaches and Officials: GEOMETRY PROPOSAL

Status: PROPOSAL. Reuses frame V and the broadcast mic set; adds a **body-worn layout** (torso frame T).

## 1. Frame T (torso) — new, shared with Lab 7 part 1 B05 if it does not already define one
- Origin = lip point (frame V), +y down. Generic adult line-art figure, front + side views (charter: real figure, no
  primitive stand-in; generic kit, no team marks, no brands).
- Landmarks (all drawing defaults, `placeholder: true`, no sourced anthropometry read): sternum, collar line, waist/belt,
  small of the back, shoulders, ear.
- Equipment overlays as **keep-out regions** (hatched, "never mount here"): helmet, shoulder pads, shin pads, contact
  zones. These are illustrative regions, not rule geometry.

## 2. Positions
| Token | Where | Class |
|---|---|---|
| `bw.lav.chest` | sternum / collar, capsule toward the mouth, clear of fabric edges | PRACTICE; offset default 200 mm below lip point |
| `bw.headset` | boom at the mouth corner (coach) | SOURCED placement (S-SM2) |
| `bw.pack` | approved low-profile location: small of back or belt | PRACTICE; default small of the back |
| `bw.cable` | strain-relief loop + slack path from mic to pack; no exposed loop | drawn path; slack length default |
| `bw.antenna` | straight, not coiled | PRACTICE |
| `bw.official.pa` | official's announcement headset/mic with a drawn ON/OFF route to PA and/or broadcast | routing panel (`commentators/` §4) |
| `bw.fallback` | perimeter boom / post-event handheld | links to B10/B13 |

## 3. Readouts
Mouth-to-capsule distance with head turn (DERIVED change in dB between facing and turned, inverse square only),
"what changes" words for rub/sweat/breath. Route map: mic → transmitter → receiver → isolated channel → approved path,
with the private officials' circuit drawn as a separate, closed path (cannot be routed to program in the tool).

## 4. Starting setups
ONE MIC: approved chest lav on a coach. CLOSE · LIVE: coach headset boom. ANOTHER START: official's announcement mic
routed to PA. FALLBACK: perimeter/interview when a mount is refused. No TWO-MIC setup except the "lav + headset open
on one voice" warning (Δt + notches DERIVED).

## 5. Practice
"Permission sheet" observation fields (athlete / coach / official rows, no-mount alternative) — the shared Lab 7
worksheet (summary §3).
