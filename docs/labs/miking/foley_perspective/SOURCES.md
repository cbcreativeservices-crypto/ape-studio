# F05 Foley Perspective and Multiple Microphones: SOURCES (technical reference)

Lesson: `docs/labs/miking/source_text/F05-Foley-Perspective-and-Multiple-Microphones-Miking-Technique.txt`.
Checked 2026-10-07 (Claude, preparation pass). Keys and rules: `foley_footsteps/SOURCES.md` §0. Stereo-array facts
already in `full_orchestra/SOURCES.md` §A (ORTF recording angle 95°, AB, NOS/DIN, Decca) are reused, not repeated.

## a. Facts read today

| Fact | Value (exact) | Source | Confidence |
|---|---|---|---|
| Footstep distance (Warner) | "The mic will typically be between three and six feet away on a mic stand, in front and/or to the side, but only about 15 degrees or so." (Mix, Blair Jackson, 1 Sep 2005) | MIX-2005 | Medium |
| Close + far (Fantasy/Skywalker) | "two mics: one close and one far away" | MIX-2005 | Medium |
| Close shotgun + room (Warner) | "KMR 82 shotguns" close, "a Neumann U67 functioning as room microphone" | MIX-2005 | Medium |
| Stereo ambience mics (C5) | small-capsule stereo mics for ambience; "three-mic configurations (left, center, right)" for close work | MIX-2005 (summary) | Low (summary wording) |
| XY | "a pair of first-order cardioid microphones is arranged at a 90° angle (±45°)"; wider sources → narrower angles; "no comb filtering effects summing XY signals to mono" | DPA-STEREO | High |
| ORTF | "two first-order cardioid microphones spaced 17 cm (7 in) and angled ±110°"; ORTF "provides the recording with a wider stereo image than XY stereo while still preserving a reasonable amount of mono information" | DPA-STEREO | High (but see D-ORTF) |
| ORTF (2nd maker) | "the critical 17cm distance for ORTF"; "110 degrees for ORTF placement"; "90 degrees for X-Y" | RODE-BAR | High |
| AB example | "a recording angle of ±70° can be achieved by spacing the cardioid microphones 20 cm" | DPA-STEREO | High |
| M/S | Left = M + S, Right = M − S, each "divided by √2"; "MS is coincident and mono compatible (… the S-signal cancels out when summed to mono)" | DPA-STEREO | High |
| Open mics | "eight open microphones would contain 9 dB more background noise and reverberation than a single open microphone"; "The margin for stable (feedback-free) operation reduces every time another microphone is opened"; comb filtering "sounds hollow, diffuse, and thin" | S-AUTOMIX | High |
| Polarity ≠ delay | "a phase shift requires a time shift, i.e., a delay, which is not involved in swopping polarity" | DPA-POL | High |

## b. Lesson claims checked

| Claim (line) | Verdict | Evidence / correction |
|---|---|---|
| L5 Hecker distance with camera; Cross depth/space; others prefer farther [1–3] | **CONFIRMED** | HECKER, ASE-CROSS, OUP-MW. |
| L15 close + room as separate channels [1, 4] | **CONFIRMED** | MIX-2005, HECKER. |
| L18 XY close together without touching; level-based image; strong mono [5] | **CONFIRMED** | DPA-STEREO (90°, no comb in mono). **Gap**: no angle given → add 90° default (F05-C2). |
| L21 ORTF "specified spacing and angle" (not given) [5] | **INCOMPLETE** | **F05-C3**: state 17 cm and 110° between the capsules' axes (55° each side); recording angle 95° (Lab 5 register). |
| L24 Mix 2005: "three to six feet from footsteps" [4] | **CONFIRMED + detail** | Add "in front and/or to the side, about 15°" (F05-C4). |
| L26 do not hard-pan close and room | PRACTICE / reasoning | Keep (no source contradicts). |
| L28 M/S: L = M + S, R = M − S; mono sum cancels Side [5] | **CONFIRMED** | DPA-STEREO. |
| L30 comb filtering when one source arrives at two mics at different times; changes as the source moves [6] | **CONFIRMED (Batch 1/5 S-REC)**; S-AUTOMIX describes the sound | Physics: `twoMic.ts`. |
| L31 polarity diagnostic only; a fixed delay aligns one moment [6, 7] | **CONFIRMED** (DPA-POL; ASE-ELEM "time-align them") | ASE-EDWARD not re-read. |
| L32 DPA: ORTF wider than XY with reasonable mono [5] | **CONFIRMED** | DPA-STEREO. |
| L35 extra open mics: more room/noise, feedback risk, comb [8] | **CONFIRMED** | S-AUTOMIX. |
| L51 floor stands; qualified personnel for overhead rigging; no moving a stand into an active cue | PRACTICE (exact safety) | Keep. |

## c. Corrections (builder logs each)
- **F05-C1** Institutional wording: header; "Students compare" (L3); "The classroom trial" (L24); "Guided teaching
  exercise"; "labels stereo and close-plus-room comparisons as classroom trials" (L85); "Student observation sheet".
- **F05-C2** Add the XY starting angle: 90° between the capsules (two makers); wider sources → narrower angle.
- **F05-C3** Add ORTF geometry (170 mm, 110° included = ±55°) — F06 already states it.
- **F05-C4** L24 add Roesch's "in front and/or to the side, about 15 degrees".
- **F05-C5** Ref [6] is a fragile hashed PDF URL — record the Shure publications page instead (record only).
- **F05-C6** Cross-link B08 (Lab 7) → drop until it ships.

## d. Disagreements
- **D-ORTF** (internal): DPA-STEREO writes "angled ±110°", which read literally would be 220° included. The
  standard ORTF (SCHOEPS, RØDE, Lab 5 register) is 110° INCLUDED. F06 L30 states this correctly. The app uses
  110° included; DPA's wording is not quoted to learners.
- **D-XY**: DPA/RØDE 90° vs Lab 5's XY range 90–135° (`full_orchestra/SOURCES.md`). Default 90°, adjustable within
  90–135° in the array tool.
