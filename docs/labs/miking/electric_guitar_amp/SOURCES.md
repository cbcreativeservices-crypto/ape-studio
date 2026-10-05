# C02 Electric Guitar Amplifier: SOURCES (technical reference)

Lesson: `docs/labs/miking/source_text/Electric-Guitar-Amplifier-Miking-Technique.txt` (L<line>).
Rules and shared keys (S-PGA27, S-REC, S-LIVE, S-RHYTHM, S-BESTGTR, OSHA, PHYS-ET): `acoustic_guitar/SOURCES.md`.
Speaker family keys (CEL-V30, MAR-MX112, MAR-1960A, AMP-410, S-MILLS, S-SM57-UG): `speaker_leslie/SOURCES.md`.
Checked 2026-10-04 by Claude.

| Key | Source | URL | Status 2026-10-04 |
|---|---|---|---|
| S-MILLS | Shure, John Mills, "Miking Guitar Amps: Tips from Sound Pro John Mills", "June 26, 2013" (lesson [1]) | https://www.shure.com/en-US/insights/miking-guitar-amps-tips-from-sound-pro-john-mills | 200, read |
| SN-906-2020 | Sennheiser e 906 manual 07/2020 (lesson [2]) | lesson URL https://www.sennheiser.com/globalassets/digizuite/40699-en-e906_manual_07_2020_en.pdf is **DEAD (404)**. Read the Internet Archive copy of the same URL: https://web.archive.org/web/2024/https://www.sennheiser.com/globalassets/digizuite/40699-en-e906_manual_07_2020_en.pdf | archived copy read |
| SN-906-DOC | Sennheiser online manual, e 906 "Operation", footer "v1.3 \| 04/2026" | https://docs.cloud.sennheiser.com/en-us/evolution-wired/manual-e906-using.html | 200 (replacement for the dead PDF) |
| FEN-65DR-MAN | Fender '65 Deluxe Reverb manual, rev C (lesson [6]) | https://www.fmicassets.com/Damroot/Original/10001/021740_gamp_manual_all_revC.pdf | 200, read |
| S-PHANTOM | Shure, "What Is Phantom Power…" (lesson [7]) | https://www.shure.com/en-ASIA/insights/what-is-phantom-power-why-do-i-need-it | 200 (not re-read; no number used) |

## a. Placement (verifying the lesson)

| Fact | Value | Source | Checked | Confidence | Notes |
|---|---|---|---|---|---|
| One-mic start | "place the mic right on the line between the dust cover and the speaker cone" | S-MILLS | 2026-10-04 | High | L7 CONFIRMED |
| Lateral trend | "The more you move a mic toward the center of the speaker, the brighter it will sound… the more you move it to the edge, the duller it will sound." | S-MILLS | 2026-10-04 | High | L7/L19 say "smoother"; Shure says "duller" (same as Batch 1 speaker finding) |
| Mills two-mic | KSM27 "about 1 to 2 inches away from the line"; Beta 56A "right on the line"; "Both mics are about 1/2 inch from the grill cloth" | S-MILLS | 2026-10-04 | High | 25.4–50.8 and 12.7 mm (conv.). The "1 to 2 inches" is lateral offset from the line, the "1/2 inch" is the grille distance (my reading, Medium). |
| Rear of open back | "place a mic on the back of the cabinet… very dull, but thick… Don't forget to swap the polarity" | S-MILLS | 2026-10-04 | High | No distance → UNKNOWN. L38 CONFIRMED. |
| PGA27 amps | "Amplifiers 1-6 inches (2-15 cm) Aim towards the center of the speaker for a clear, aggressive sound, or towards the edge of the speaker for a mellow sound." | S-PGA27 p.4 | 2026-10-04 | High | L28 CONFIRMED (25.4–152.4 mm conv.; Shure prints 2–15 cm) |
| e 906 positions | A "directed towards the dome… many trebles, aggressive"; B "directed towards the middle between dome and edge… good starting position… If necessary, turn the microphone by approx. 30° towards the edge"; C "towards the edge… less trebles, more lower mids, smoother" | SN-906-2020 p.4, SN-906-DOC | 2026-10-04 | High | L7 "region between the dome and cone edge" CONFIRMED. Note: B is the MIDDLE between dome and edge, not Mills' dust-cap line. |
| e 906 "hang in front of an amp" | not found in either manual text | SN-906-2020, SN-906-DOC | 2026-10-04 | — | L28 attributes "designed to hang in front of an amp" to [2]: **not in the manual**. Source it elsewhere (product page not checked) or drop "designed to hang". The manual says "The front of the microphone must face the guitar amplifier." |
| e 906 monitor null | "postion your monitor loudspeakers in the angle area of the highest cancellation of the microphone (approx. 120°)" | SN-906-2020 p.5 | 2026-10-04 | High | |
| e 906 body | "super-cardioid"; Dimensions "55 x 34 x 134 mm"; Weight "140 g"; presence filter mid "4.2 kHz" | SN-906-2020 p.7, SN-906-DOC | 2026-10-04 | High | Flat side-address outline for the mic family |
| Live guitar cab | "point the microphone straight into the cabinet and directly at the speaker's voice coil… or put the mic on the edge of the speaker and angle it into the voice coil… In both cases, you should place the mic right up against the grille." | S-RHYTHM | 2026-10-04 | High | Optional live zone; d ≈ 0 |
| SM57 amp rows | 25 mm close, 150–300, 600–900 | `speaker_leslie/SOURCES.md` S-SM57-UG | 2026-10-04 (Batch 1) | High | |

## b. Amplifier and speaker (geometry)

| Fact | Value | Source | Checked | Confidence | Notes |
|---|---|---|---|---|---|
| '65 Deluxe Reverb dimensions | "HEIGHT: 17-1/2 in (44.5 cm)", "WIDTH: 24-1/2 in (62.2 cm)", "DEPTH: 9-1/2 in (24.1 cm)", "WEIGHT: 42 lb (19.1 kg)" | FEN-65DR-MAN p. specs | 2026-10-04 | High | Resolves Batch 1's FEN-65DR (403) gap: the combo is now sourced from the manual |
| Speaker | "SPEAKER COMPLEMENT: 12-inch, 8Ω, Jensen C12K" | FEN-65DR-MAN | 2026-10-04 | High | Draw with the CEL-V30 12-in sizes (TRIAL; C12K sizes not read) |
| Internal jack | "A speaker must always be connected at this jack when the amplifier is ON. A speaker impedance load of 8Ω should be used" | FEN-65DR-MAN | 2026-10-04 | High | L47 CONFIRMED |
| Ventilation | "Maintain at least 6 inches (15.25 cm) of unobstructed air space behind the unit" | FEN-65DR-MAN | 2026-10-04 | High | 152.4 mm (conv.); Fender prints 15.25 cm. Keep-out behind the combo. |
| Output power | "22W at 8Ω" | FEN-65DR-MAN | 2026-10-04 | High | |
| Open or closed back | not stated | FEN-65DR-MAN | | UNKNOWN | drawing default: open back (the lesson's rear-mic step needs one) |
| Speaker position on the baffle | not stated | | | UNKNOWN | drawing default below |

## c. Hearing

OSHA 85 dBA 8-h TWA (`acoustic_guitar/SOURCES.md` §c): L46 CONFIRMED ("exposure over 85 decibels can
damage your hearing"; HCP at 85 dBA TWA).

## d. Disagreements

- **D-EG1** Mills "duller" toward the edge vs PGA27 "mellow" vs e 906 "smoother" vs the SM57 guide's
  opposite claim (Batch 1 speaker note). Keep the majority: centre brighter, edge darker.
- **D-EG2** Starting lateral point: Mills = dust-cap/cone line; e 906 = middle between dome and edge.
  Two adjacent zones, not one.
