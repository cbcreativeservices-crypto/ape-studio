# A01a Trumpet: SOURCES (technical reference) — also the LAB 3 GENERAL KEYS and the BRASS FAMILY keys

Lesson: `docs/labs/miking/source_text/Trumpet-Miking-Technique-Research.txt` (L<line>).
Survey: `docs/labs/miking/survey/lab3.md`. Checked 2026-10-05 by Claude (technical-reference pass;
pages fetched with curl and read as text; PDFs read with pdftotext).

Rules (same as `kick/SOURCES.md`): values copied exactly; conversions mine, marked "(conv.)",
1 in = 25.4 mm exactly; UNKNOWN is never filled with a guess; anything the drawing needs that no
source gives is a **drawing default, not a published figure** (`placeholder: true`).
Confidence: High = maker/author document read in full today; Medium = read today but needs
interpretation (stated); Low = snippet/retailer only — never used for geometry.
Verdicts on lesson claims: **CONFIRMED / DIFFERENT / UNREACHABLE** (+ ADD = sourced fact the lesson lacks).

## 0. Lab 3 general keys (every Lab 3 folder points here)

| Key | Source | URL | Status 2026-10-05 |
|---|---|---|---|
| S-BWS | Shure, "How to Choose the Best Mics for Brass, Wind, and String Instruments" | https://www.shure.com/en-US/insights/how-to-choose-the-best-mics-for-brass-wind-and-string-instruments | 200, read |
| S-LIVE | Shure, *Microphone Techniques for Live Sound Reinforcement* (PDF), wind/brass table pp. 25–26 | https://www.shure.com/damfiles/default/global/documents/publications/en/performance-production/microphone_techniques_for_live_sound_reinforcement_english.pdf-3df433145fca686a736beeb5da588efa.pdf | 200, read (pdftotext) |
| S-REC | Shure, *Microphone Techniques for Recording* (PDF), Woodwinds p. 13, Brass p. 14 | see `snare/SOURCES.md` (…microphone_techniques_for_recording_english.pdf-bb0469…) | 200, read |
| S-POLAR | Shure, "Microphone Directionality and Polar Pattern Basics" | https://www.shure.com/en-US/insights/microphone-directionality-polar-pattern-basics | 200, read |
| S-HYPER | Shure, "Specialist Polar Patterns: Hypercardioid and Subcardioid" | https://www.shure.com/en-US/insights/specialist-polar-patterns-hypercardioid-and-subcardioid | 200, read |
| DPA-TPT | DPA, "How to mic a trumpet and trombone" | https://www.dpamicrophones.com/mic-university/how-to-mic/how-to-mic-a-trumpet-and-trombone/ | 200, read |
| DPA-MOUNT | DPA, "How to mount the 4099 instrument microphone on various instruments" (brass, sax, woodwind, wireless sections) | https://www.dpamicrophones.com/mic-university/how-to-mic/how-to-mount-the-4099-instrument-microphone-on-various-instruments/ | 200, read |
| DPA-TABLE | DPA, "Acoustical Characteristics of Musical Instruments" (table: range, SPL, dynamic range) | https://www.dpamicrophones.com/mic-university/background-knowledge/acoustical-characteristics-of-musical-instruments/ | 200, table read from page HTML |
| DPA-WWB | DPA, "How to mic woodwinds and brass" (general close-miking article) | https://www.dpamicrophones.com/mic-university/how-to-mic/how-to-mic-woodwinds-and-brass/ | 200, read |
| DPA-VIB | DPA, "Measuring how vibrations affect microphones" | https://www.dpamicrophones.com/mic-university/technology/measuring-how-vibrations-affect-microphones/ | 200, read |
| MDAT | Music Director's Audio Toolkit, "Individual Instrument Microphone Positioning" | https://www.musicdirectorstoolkit.com/getting-started/individual-instruments | 200, read (practice guide — Medium authority) |
| ROY-BRASS | Royer Labs, "Recording Brass" | https://royerlabs.com/recording-brass/ | 200, read |
| ROY-ORCH | Royer Labs, "Recording Orchestra" | https://royerlabs.com/recording-orchestra/ | 200, read |
| PL-2010 | J. Pätynen, T. Lokki, "Directivities of Symphony Orchestra Instruments", *Acta Acustica united with Acustica* 96 (2010) 138–167 (author PDF) | https://users.aalto.fi/~ktlokki/Publs/patynen_aaua_2010.pdf | 200, read (pdftotext) — the **sourced directivity data** for Lab 3 |
| UNSW-BRASS | J. Wolfe, UNSW Music Acoustics, "Brass instrument (lip reed) acoustics" | https://newt.phys.unsw.edu.au/jw/brassacoustics.html | 200, read |
| UNSW-SAX | UNSW, "Saxophone acoustics: an introduction" | https://newt.phys.unsw.edu.au/jw/saxacoustics.html | 200, read |
| UNSW-FLUTE | UNSW, "Flute acoustics" | https://newt.phys.unsw.edu.au/jw/fluteacoustics.html | 200, read |
| UNSW-CL | UNSW, "Clarinet acoustics" | https://newt.phys.unsw.edu.au/jw/clarinetacoustics.html | 200, read |
| Y-HUB-BRASS | Yamaha Hub, "The Brass Family, Explained" | https://hub.yamaha.com/winds/brass/the-brass-family-explained/ | 200 |
| NIOSH | CDC/NIOSH musicians' hearing bulletin (lesson [7]) | https://www.cdc.gov/niosh/bulletin/2015/musicians-hearing-loss.html | not re-read today (403 to curl in Batch 2; WebFetch read then) |
| SPK | Lab speaker/Leslie module | `speaker_leslie/SOURCES.md`, `GEOMETRY_PROPOSAL.md` | in repo |

### 0.1 Polar-pattern facts every Lab 3 lesson uses (resolves survey flag 3d-4)

| Fact | Value | Source | Confidence |
|---|---|---|---|
| Supercardioid null | "the supercardioid is least sensitive at 125 degrees and the hypercardioid at 110 degrees" | S-POLAR (same words in S-HYPER) | High |
| Cardioid null | "least sensitive at the rear (180 degrees off-axis)" | S-POLAR | High |
| Front angles | "115 degrees for the supercardioid and 105 degrees for the hypercardioid" | S-POLAR, S-HYPER | High |
| Frequency caveat | "at 1Khz, the mic may well be supercardioid, but at 150Hz - the performance might be closer to omnidirectional" | S-POLAR | High |

**Verdict:** a supercardioid's nulls lie on a cone **125° off the front axis, i.e. off-rear (rear-oblique)**,
symmetrical about the axis — **not "side nulls"**. Lessons Trumpet L47 ("off-rear nulls") CONFIRMED;
Piccolo L38, Soprano Clarinet L36, Bass Clarinet L39, Bassoon L37 ("side nulls"/"side rejection")
**DIFFERENT → fix the wording**. S-HYPER, cited by the woodwind lessons, does state the supercardioid 125°
figure, so the reference fits; only the wording is wrong. The lab draws the IDEAL 125.26° shape
(`SOURCES_SHARED.md` §3, D-SC).

### 0.2 Sourced directivity (PL-2010) — the only measured radiation data used in Lab 3

Abstract: "directivities of the strings and woodwind instruments are noticed to change with the played tone
while the brass instruments radiate constantly in the direction of the bell. Playing dynamics was not found
to affect the directivity". Per-instrument rows are quoted in each lesson's file. Method: 22 microphones
around the player in an anechoic room; octave-band patterns. Draw radiation **qualitatively** with a
"measured trend, not to scale" tag; never as a polar plot with numbers beyond those quoted.

## a. Trumpet placement (verifying the lesson)

| Lesson claim | Verdict | Source words | Conv. (mm) |
|---|---|---|---|
| L7 DPA "30–50 cm … slightly off axis" | **CONFIRMED** | "For a well balanced sound, position the microphone 30 to 50 cm from the bell, slightly off axis." (DPA-TPT) | 300–500 |
| L7 Shure "1–2 ft (about 30–60 cm)" | **CONFIRMED** | "start by placing the microphone 1 to 2 feet from the bell" (S-BWS); S-LIVE/S-REC brass row "1 to 2 feet from bell… On-axis to bell sounds bright; to one side sounds natural or mellow" | 304.8–609.6 |
| L7 on-axis brighter / off-axis softer | **CONFIRMED** | "On-axis = brighter and more defined, Off-axis = softer with less bite" (S-BWS) | — |
| L14 "several-meter trial" | **DIFFERENT** (number exists) | "if the recording room is large enough try to mic the trumpet or trombone from 3 m away" (DPA-TPT) → write "about 3 m" as the Trombone lessons do (survey 3d-1) | 3000 |
| L86 DPA "close back-of-bell option" | **CONFIRMED (no number)** | "you may try to mic the trumpet from the close proximity back side of the bell" (DPA-TPT) | none |
| DPA aim angle (ADD) | ADD | "point the brilliance peak on the microphone down or to the side. This can be up to 45º" (DPA-TPT) | 0–45° |
| DPA "if too bright" (ADD) | ADD | "If the sound is too bright, try not to position the mic in the center of the bell." | — |
| L8 overload | **CONFIRMED** | crest factor "can exceed 20 dB"; peaks "in excess of 140 dB!"; mic "hits the ceiling" → "smear" (DPA-TPT) | — |
| L17 clip aim | **CONFIRMED** | "do not point the microphone directly into the center of the bell, but position it between the center position and the bell's edge. All types of mutes can be used together with the 4099." (DPA-MOUNT, "For trumpet, trombone, and instruments of similar sizes") | — |
| L17 Shure horn clamps | **CONFIRMED** | BETA 98H/C "clip right on the horn"; PGA98H "horn clamp" (S-BWS) | — |
| Wireless low cut (ADD) | ADD | "When running wireless, it is recommended to use a low-cut filter at 80 Hz in the transmitter… built into the adapter supplied with 4099G, 4099V, 4099S and 4099T" (DPA-MOUNT) | 80 Hz |
| MDAT 2–4 ft (survey 3d-2) | **ADD to Trumpet** | "Trumpet/Flugelhorn — Place the microphone in front of the instrument about 2-4 feet. Aim the microphone so that it is off axis from the bell… aiming it at the edge of the bell" (MDAT) | 609.6–1219.2 |
| Royer ribbon start (ADD, optional) | ADD | "anywhere from 2 to 5 feet in front of the instrument and about 6 inches below the line of sight of the bell" (ROY-BRASS) | 609.6–1524; 152.4 below |
| L16/L47 supercardioid "rear pickup lobe" / "off-rear nulls" | **CONFIRMED** | §0.1 | 125° |
| SPL figure (ADD) | ADD | trumpet "0.5 m from bell piece: normal; forte: 108 dB; extreme forte: 128 dB" (DPA-TABLE) | — |
| Range (ADD) | ADD | "E (165 Hz) / D³ (1175 Hz)" (DPA-TABLE); E3 = 164.81 Hz (PHYS-ET, DERIVED) | — |
| L51 NIOSH | CONFIRMED in earlier passes (not re-read) | NIOSH | — |
| L2 header | **FIX** | strip "Pro Audio Training Academy" (house rule, Batches 1–4) | — |

## b. Trumpet dimensions and physics

| Fact | Value | Source | Confidence | Notes |
|---|---|---|---|---|
| Bell diameter | "123mm (4-7/8")" (YTR-2330) | Y-YTR2330 https://usa.yamaha.com/products/musical_instruments/winds/trumpets/bb_trumpets/ytr-2330/specs.html | High | default trumpet bell Ø 123 |
| Bore | "ML 11.65mm (0.459")" | Y-YTR2330 | High | |
| Tube length | "the total length is approximately 1.4 m" | PL-2010 §5.2 | High | drawn only as a label |
| Overall length, valve block, leadpipe, bell flare profile | UNKNOWN | — | — | drawing defaults (GEOMETRY §2) |
| Bell directivity | "bells… make the high frequency radiation from brass instruments rather directional… a brass instrument is substantially louder if it is pointing at you" | UNSW-BRASS | High | |
| Measured trumpet pattern | "The radiation patterns at separate octave bands are particularly symmetrical with regard to the instrument axis… At 1 kHz and above the directivity is increased in the front direction"; dynamics "not found to cause any changes to the trumpet directivity" | PL-2010 §5.2 | High | |
| Player hears the back | "The players' entire reference is from hearing their trumpet sound from the wrong side of the instrument, the back side." | DPA-TPT | High | L6 CONFIRMED |
| Pickup mute | Yamaha SILENT Brass (lesson [6]) | not re-read | — | separate signal path; no geometry used |

## c. Sources not reachable today
NIOSH (not re-fetched). Every number above was read today.
