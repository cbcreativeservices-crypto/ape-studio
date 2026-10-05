# A02a Tenor trombone: SOURCES — also the SLIDE keys used by Bass trombone

Lesson: `source_text/Trombone-Miking-Technique-Research.txt` (L<line>). Rules and Lab 3 keys:
`trumpet/SOURCES.md` §0. Checked 2026-10-05 by Claude.

| Key | Source | URL | Status |
|---|---|---|---|
| Y-TBN-MECH | Yamaha, "The Structure of the Trombone: How to Play the Scale" (lesson [1]) | https://www.yamaha.com/en/musical_instrument_guide/trombone/mechanism/mechanism004.html | 200 |
| Y-HUB-TBN | Yamaha Hub, "What's the Difference Between Alto, Tenor and Bass Trombones?" | https://hub.yamaha.com/winds/brass/whats-the-difference-between-alto-tenor-and-bass-trombones/ | 200 |
| Y-TBN-PLAY3 | Yamaha, "Playing a Tenorbass Trombone or Bass Trombone" | https://www.yamaha.com/en/musical_instrument_guide/trombone/play/play003.html | 200 |
| Y-YSL354 | Yamaha YSL-354 specs | https://usa.yamaha.com/products/musical_instruments/winds/trombones/ysl-354/specs.html | 200 |

## a. Placement

| Lesson claim | Verdict | Source words | mm |
|---|---|---|---|
| L7 DPA 30–50 cm slightly off axis | **CONFIRMED** | DPA-TPT (trumpet *and* trombone page) | 300–500 |
| L7 Shure 1–2 ft | **CONFIRMED** | S-BWS lists "trumpet, cornet, trombone, tuba"; S-LIVE/S-REC brass row | 304.8–609.6 |
| L7/L17 DPA "about 3 m" | **CONFIRMED** | "try to mic the trumpet or trombone from 3 m away, this also smoothes out and creates "fatness"" | 3000 |
| L21 clip between centre and edge | **CONFIRMED** | DPA-MOUNT | — |
| MDAT (ADD) | ADD | "Trombone — Place the microphone in front of the instrument about 2-4 feet… off axis from the bell" | 609.6–1219.2 |
| L11 "above or to the side of the slide's sweep, aimed across the bell" | **lesson inference** (L8, L83 say so) — no source; keep labelled | — | — |
| L20 cardioid vs supercardioid rear | CONFIRMED | `trumpet/SOURCES.md` §0.1 | 125° |
| Range/SPL (ADD) | ADD | "Trombone \| E (82.4 Hz) / C² (523 Hz) \| … 104 dB" (DPA-TABLE) | — |

## b. Slide and instrument

| Fact | Value | Source | Confidence |
|---|---|---|---|
| Positions | "The slide has seven positions, counted in order from the 1st position (toward you) to the 7th position (fully extended)." "there are no position markers on the tubing." | Y-TBN-MECH | High — L6 CONFIRMED |
| Tube length | tenor and bass "are the same size in terms of total length (both are 2.7 meters)" | Y-HUB-TBN | High |
| Tube length (second source) | "The overall length of 2.75 m is twice that of the trumpet" | PL-2010 §5.3 | High (D-TB1: 2.7 vs 2.75 m) |
| Bell diameter | YSL-354 "204.4mm（8''）" | Y-YSL354 | High |
| Bell diameter (literature) | "The bell diameter in tenor trombones is around 18 cm" | PL-2010 §5.3 | High (D-TB2: 180 vs 204.4 — model-dependent) |
| F attachment | "Tenor trombones are sometimes made with F-attachments" | Y-HUB-TBN | High (trigger on "trigger-equipped tenor", L21) |
| Directivity | "The 125 and 250 Hz octave bands radiate far more omnidirectionally in all planes than with the trumpet… The front region is emphasized beginning from 500 Hz. At the 1 kHz and higher octave bands the directivity is highly concentrated in the bell direction." "The radiation remains over -6 dB of the maximum in all directions up to 400 Hz" | PL-2010 §5.3 | High |
| Megaphone above ~700–800 Hz | "the trombone begins to function as a megaphone, rather than a resonator, above about 700 or 800 Hz" | UNSW-BRASS | High |
| Slide length, slide-tube spacing, bell-section length, overall closed length | UNKNOWN | — | drawing defaults |

## c. DERIVED slide positions (ILLUSTRATIVE — equal temperament on a sourced tube length)

Each position lowers the pitch one semitone; the slide adds tube on both legs, so the slide travel for
n semitones is s_n = (L/2)·(2^(n/12) − 1). With L = 2700 (Y-HUB-TBN): **s = 0, 80.3, 165.3, 255.4, 350.9,
452.0, 559.2 mm** (positions 1–7). With L = 2750 (PL-2010) the 7th is 569.5. Simplifications: acoustic
length ≠ physical length (mouthpiece, bell end-correction), real positions are found "by feel" — so the
build draws the **proportions** (0, 0.144, 0.296, 0.457, 0.627, 0.808, 1) times a 7th-position travel
of 559.2 (DERIVED, TRIAL), labelled "approximate".

Cross-check (bass trombone, Y-TBN-PLAY3 "When set to F, the slide is reduced to six positions over the
entire length of the slide"): with the F attachment the tube is L·2^(5/12) = 3604 mm and the ideal 6th
position needs 603 mm — more than the 559 mm of the open 7th, which is why only six fit (the ideal model
over-reaches by ~8 %; drawn as "approximately the full slide").
