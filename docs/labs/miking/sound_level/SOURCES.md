# F12 Sound Level and Environmental Noise: SOURCES (technical reference)

Lesson: `source_text/F12-Sound-Level-and-Environmental-Noise-Miking-Technique.txt` (`cat -n` lines).
Checked 2026-10-07. Keys: `measurement_mics/SOURCES.md` §0.

| # | Line | Claim | Status |
|---|---|---|---|
| 1 | L5 | ISO 1996-2 / 1996-1 scopes | NOT RE-READ (403); consistent |
| 2 | L6 | OSHA: area vs personal sampling | CONFIRMED (OSHA-G quotes) |
| 3 | L10–21 | LAeq,T energy average ≠ arithmetic mean of dB; LAFmax/LASmax; L10/L50/L90 exceedance; LCpeak ≠ fast max | CONFIRMED (definitions; calc `leq` implements the energy average) |
| 4 | L26 | FHWA 1.5 m height for a defined procedure | CONFIRMED (FHWA-FG "5 ft (1.5 m) above the ground") — method-specific, as the lesson says |
| 5 | L27 | FHWA distinguishes facade vs open positions | CONFIRMED; numbers now available: ≥ 10 ft (3 m) from the building side; 6.6 ft (2 m) from the facade midpoint; one close to but not touching (FHWA-FG) |
| 6 | L33 | NPS excludes intervals over 5 m/s | CONFIRMED (NPS-RM47 "greater than 5 m/s or 11 mph") |
| 7 | L34 | Ordinary dB subtraction invalid; energy subtraction only when sufficiently separated | CONFIRMED (physics). FHWA threshold numbers NOT quoted by the lesson and not re-read → the app refuses below a drawing-default 3 dB separation **labelled "the method you use sets this"** (D-6B-8) |
| 8 | L37 | FHWA field guide logs IDs, height, weather, times, pre/post checks | CONFIRMED in substance (FHWA-FG) |
| 9 | L41 | NWS: shelter when thunder is heard, until 30 min after last thunder | CONFIRMED (NWS-LTG: "last lightning or thunder") |
| 10 | L84/86 refs [4], [6] | Two references, same URL | WRONG (duplicate ref) → merge |
| 11 | L5, L46, L51 | "classroom exercise", "Student" | WRONG (wording) |
| 12 | — | Meter class; SLM orientation | UNKNOWN in the lesson (gap); app uses F11's field-type orientation rule as PRACTICE ("point the mic as its data says") |
| 13 | L50 | No LCpeak reference number (row) | gap only |

Corrections: #9 wording, #10 duplicate ref, #11 wording; enrichment #5 (FHWA facade numbers) optional.
