# F08 Moving Sources and Pass-bys: SOURCES (technical reference)

Lesson: `docs/labs/miking/source_text/F08-Moving-Sources-and-Pass-bys-Miking-Technique.txt` (`cat -n` lines).
Checked 2026-10-07 (Claude, preparation pass). Keys and rules: `foley_footsteps/SOURCES.md` §0; field family:
`field_ambience/`. F08 defines the shared **moving-source path tool** (F01/F05/F07/F08; Lab 7).
No setback, angle, speed or headroom number exists (L74 says so). The student exercise is a WALKING performer; the
vehicle session is paper only (L45).

## a. Facts read today

| Fact | Value (exact) | Source | Confidence |
|---|---|---|---|
| Doppler, moving source | f_o = f_s · v / (v ∓ v_s), "−" approaching, "+" receding (eq. 17.18); worked example uses "340 m/s" | OSX-DOPPLER | High |
| Work-zone hazards | workers "are exposed to hazards from outside and inside the work zone"; "Falls, electrical, struck-by, and caught between"; risk "from passing motor vehicle traffic"; traffic control per the MUTCD "PART 6: TEMPORARY TRAFFIC CONTROL" | OSHA-WZ | High |
| Noise | NIOSH REL 85 dBA over 8 h, 3 dB exchange | NIOSH-NOISE | High |
| Lightning | NWS-LTG | NWS-LTG | High |
| XY / ORTF / M/S | DPA-STEREO (XY 90°; ORTF 17 cm, wider than XY with reasonable mono; M/S mono-compatible) | DPA-STEREO | High |
| Example interference-tube shotgun | "Ø 19 x 250 mm", "Super-cardioid/lobar" | SEN-416 specs (search summary) | Low — drawing default only |

DERIVED (c = 343.21 m/s, CALC-C; walking speed 1.4 m/s is a **drawing default**, not sourced): approaching factor
343.21 / (343.21 − 1.4) = 1.00410 (+7.1 cents); receding 343.21 / 344.61 = 0.99594 (−7.0 cents); total swing
≈ 14 cents. At 20 m/s (≈ 72 km/h, drawing default): +6.2 % / −5.5 % (≈ +104 / −98 cents). The lesson's "walking
speed may produce little audible shift" (L26) is consistent.

## b. Lesson claims checked

| Claim (line) | Verdict | Evidence / correction |
|---|---|---|
| L5 exterior pass-bys vs onboard vehicle sounds (Wu, Potter) [1, 2] | **NOT RE-READ** (Sound Devices 403) | Practice accounts; no geometry depends on them. |
| L6 no lesson on an active roadway; no asking a driver to change speed [3] | **CONFIRMED in substance** (OSHA-WZ struck-by / traffic hazards) | Exact safety, keep. |
| L12–L22 four arrangements | PRACTICE (lesson's own, sound) | Geometry drawing default. |
| L15/L18 XY or M/S at one point; ORTF/spaced pair breadth [4] | **CONFIRMED** | DPA-STEREO. |
| L21 tracked directional mic (MKH 416 cited) [5] | **WRONG LINK** (404) | Specs page found; brand never in learner text (F08-C3). |
| L24 start/end mics are separate perspectives, comb if combined | **CONFIRMED** (physics; S-AUTOMIX comb) | `twoMic.ts`. |
| L26 level rise/fall; Doppler: approach higher, recession lower; not created by panning; walking little shift; RPM changes pitch separately [6] | **CONFIRMED** | OSX-DOPPLER; DERIVED numbers above. |
| L27 HPF removes real low-frequency vehicle body; headroom for the loudest moment [1, 7] | PRACTICE (SD 403) | Keep. |
| L29 wind protection, stands secure [3, 8] | CONFIRMED (CORNELL-ACC for wind; RODE-WIND not re-read) | — |
| L31 synchronise independent recorders by clock/timecode and a common event [2] | PRACTICE (SD 403) | Keep. |
| L37 OSHA: passing traffic a serious hazard; an exercise cannot create its own traffic control with a stand or cone [3] | **CONFIRMED** (OSHA-WZ: traffic control per MUTCD Part 6) | Keep exact. |
| L38 NIOSH hearing protection; NWS thunder [9, 10] | **CONFIRMED** | NIOSH-NOISE, NWS-LTG. |

## c. Corrections (builder logs each)
- **F08-C1** Institutional wording: header; "This lesson's student exercise" (L34); "a course exercise" (L37);
  "Guided teaching exercise"; "this classroom exercise" (L45); "Pass criterion: the student"; "Student observation
  sheet".
- **F08-C2** Add a worked Doppler size for walking (about ±7 cents) as a model number, and keep "do not assign a
  Doppler number to an uncontrolled pass" (L44) for real recordings.
- **F08-C3** Ref [5] dead link → maker specs page (record only).
- **F08-C4** Cross-links to Lab 7 and F09 → drop until they ship.

## d. Disagreements
None in the sources. Tension to teach (L72): a tracked mic holds the subject; a fixed pair lets it cross the image.
