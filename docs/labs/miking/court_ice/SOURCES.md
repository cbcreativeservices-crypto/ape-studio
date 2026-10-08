# B14 Court, Racket and Ice Sports: SOURCES

Lesson: `source_text/B14-Court-Racket-and-Ice-Sports-Miking-Technique.txt`. Checked 2026-10-07. Keys:
`commentators/SOURCES.md` §0.

| Line | Claim | Status |
|---|---|---|
| L14 | FIBA: obstructions at least 2 m from the court | CONFIRMED (Medium, FIBA wording read in earlier editions; 2026 article numbers 2.2/2.5.1 not re-read) |
| L17 / L86 | FIVB: free zone ≥ 3 m; free playing space ≥ 7 m; World/Official 5 m sides, 6.5 m ends, 12.5 m height; play may continue beyond the free zone (Rule 9) | CONFIRMED numbers (Medium, rule mirrors); Rule 9 retrieval point PRACTICE |
| L20 / L109 | ITF Rule 2 Case 1: net-post attachments only as approved Player Analysis Technology | UNSOURCED (ITF PDF not re-read) |
| L23 / L113 | BWF Law 1.5 posts not extending into the court; Law 13.3 | UNSOURCED (not re-read) |
| L26 / L129 | DEL Rule 1.3 smooth ice-facing boards; IIHF PDF not retrievable | UNSOURCED (not re-read) |
| L55 | boundary mic: short direct + reflected paths reduce comb filtering of a raised mic | CONFIRMED physics (DPA boundary-layer definition not re-read; DERIVED tool below) |
| L131 | contact transducer: check input impedance; no phantom unless specified | PRACTICE (safety for equipment) |
| L164 | MKH 416: P48 48 V ± 4 V; 25 mV/Pa at 1 kHz; 130 dB SPL | CONFIRMED SN-416 |
| L167 | MX391/C with its preamp: cardioid boundary; 11–52 V DC; 119 dB SPL at 1 kHz, 1 % THD, 1 kΩ | CONFIRMED S-MX391 (preamp RK100PK/RK202PK required) |
| L170 | VP83F peaks between −12 and −6 dB | CONFIRMED S-VP83F (Medium) |
| L155 | NWS ≥ 30 min after last thunder; open rain shelters unsuitable | CONFIRMED NWS-LTG |
| L180 | practice line: A/B/C 2, 5, 8 m inside; M 3 m outside → 5, 8, 11 m | CONFIRMED arithmetic |
| L183 | 30° off-axis trial | TRIAL |
| L114 | BWF 2027 edition date note | internal note only |

## Derived (for the boundary tool)
A mic raised h above a hard floor hears a reflection; for sound arriving perpendicular to the floor the extra path is
2h, first cancellation at c/(4h): h = 0.30 m → 286 Hz; h = 0.10 m → 858 Hz; h = 0.01 m → 8.6 kHz. At grazing incidence
the path difference shrinks toward zero. A capsule at the surface (boundary) moves the first notch above the audio band —
the "ideal model" the app draws. CONFIRMED by geometry (C-SOUND).
