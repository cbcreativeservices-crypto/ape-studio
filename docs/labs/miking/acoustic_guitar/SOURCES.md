# C01 Acoustic Guitar (steel 6, 12-string, nylon): SOURCES (technical reference)

Lab: Miking Labs, Lab 4 Chordophones, scope C01.
Lesson: `docs/labs/miking/source_text/Acoustic-Guitar-Miking-Technique.txt` (cited below as L<line>).
Model: `kick/SOURCES.md` rules. Checked 2026-10-04 by Claude (technical-reference pass, no app code).
Owner ruling: the app shows only "recommended starting points" (no citations); this file stays exact.

Rules: values copied as printed; "(conv.)" = my metric conversion, 1 in = 25.4 mm exactly, nothing
rounded. UNKNOWN is never filled with a guess; the geometry file may give a **drawing default, not a
published figure** (`placeholder: true`). Confidence: High = maker/primary document read in full today;
Medium = read today but needs interpretation, or a retailer/museum listing; Low = snippet only (never
drawn).

## 0. Lab 4 shared source keys (other Lab 4 lessons point here)

| Key | Source | URL | Status 2026-10-04 |
|---|---|---|---|
| S-PGA27 | Shure, PGA27 user guide, "Version: 3.2 (2025-H)", 8 pp. (lesson [1]) | https://pubs.shure.com/view/guide/PGA27/en-US.pdf (HTML twin https://www.shure.com/en-US/docs/guide/PGA27 renders only the menu to a fetcher) | 200, PDF read in full |
| S-REC | Shure, "Microphone Techniques for Recording", ©2014, AL25697 8/14 | https://content-files.shure.com/dievision/archive/damfiles/default/global/documents/publications/en/performance-production/microphone_techniques_for_recording_english.pdf-bb0469316afdb6118691d2f3f5e3ff01.pdf (the shure.com/damfiles twin in the Piano and Harp lessons also 200) | 200, read in full |
| S-LIVE | Shure, "Microphone Techniques for Live Sound Reinforcement", ©2014, AL25698 8/14 | https://content-files.shure.com/Pubs/microphone-techniques-for-live-sound-reinforcement/microphone_techniques_for_live_sound_reinforcement_english.pdf | 200, read in full |
| S-RHYTHM | Shure, Karen Stackpole (update), "Miking the Rhythm Section", dated "September 21, 2009" | https://www.shure.com/nl-NL/insights/miking-the-rhythm-section (es-LATAM twin also 200) | 200 |
| S-BESTGTR | Shure, "How to Choose the Best Mics for the Guitar" (lesson [3]) | https://www.shure.com/en-US/insights/how-to-choose-the-best-mics-for-the-guitar | 200 |
| S-STEREO | Shure, "Common Techniques for Stereo Miking" (lesson [7]) | https://www.shure.com/en-US/insights/common-techniques-for-stereo-miking | 200 |
| S-SECRETS | Shure, "Microphone Choice and Placement Secrets for Recording" (lesson [4]) | https://www.shure.com/en-US/insights/microphone-choice-and-placement-secrets-for-recording | 200 |
| DPA-AG | DPA, Bo Brinck, "How to mic an acoustic guitar" (no date on page) (lesson [2]) | https://www.dpamicrophones.com/mic-university/how-to-mic/how-to-mic-an-acoustic-guitar/ | 200 |
| DPA-MOUNT | DPA, "How to mount the 4099 instrument microphone on various instruments" (lesson [8]) | https://www.dpamicrophones.com/mic-university/how-to-mic/how-to-mount-the-4099-instrument-microphone-on-various-instruments/ | 200, read in full |
| DPA-STEREO | DPA, "Stereo recording techniques and setups" | https://www.dpamicrophones.com/mic-university/audio-production/stereo-recording-techniques-and-setups/ | 200 |
| OSHA | OSHA, "Occupational Noise Exposure" (Lab 4 lessons' hearing ref) | https://www.osha.gov/noise/ | 200 |
| PHYS-ET | Equal-tempered pitch, A4 = 440 Hz: f = 440·2^((n−49)/12); fret position from the nut d_n = L·(1 − 2^(−n/12)) | arithmetic, no URL | DERIVED, exact formulas |

## 1. Guitar-specific source keys

| Key | Source | URL | Status 2026-10-04 |
|---|---|---|---|
| TAY-DN | Taylor Guitars, "Dreadnought" body-shape page | https://taylorguitars.com/guitars/acoustic/features/shapes/dreadnought | 200 |
| TAY-REC | Taylor Wood&Steel 2020 issue 3, Gabriel O'Brien, "An Introduction to Recording Acoustic Guitar" | https://woodandsteel.taylorguitars.com/issue/2020-issue-3/feature-story/an-introduction-to-recording-acoustic-guitar/ | 200 |
| MAR-HD12 | Martin, HD12-28 12-String (lesson [5]) | https://www.martinguitar.com/guitars/standard-series/HD12-28.html | 200 |
| ELD-C5 | Elderly Instruments, Cordoba C5 Classical Guitar listing (retailer) | https://elderly.com/products/cordoba-c5-classical-guitar | 200 (cordobaguitars.com/guitars/c5/ gives 404) |
| YMH-NYL | Yamaha Hub, nylon vs steel (lesson [6] source 1) | https://hub.yamaha.com/guitars/g-acoustic/nylon-string-vs-steel-string-guitars/ | 200 to curl; not used for numbers |
| YMH-MECH | Yamaha, classical guitar mechanism page (lesson [6] source 2) | https://www.yamaha.com/en/musical_instrument_guide/classical_guitar/mechanism/mechanism002.html | 200 to curl, **403 to WebFetch**; not read in full |
| YMH-SPECS | Yamaha FG800 / C40 spec pages | usa.yamaha.com …/fg800/specs.html, …/c40/specs.html | 200 but specs load by script: **no numbers readable**. Not used. |

## a. Placement facts (verifying the lesson)

| Fact | Value (exact, units) | Source (key, location) | Checked | Confidence | Notes |
|---|---|---|---|---|---|
| Acoustic guitar stand distance | "Acoustic guitar 6-12 inches (15-30 cm) Place near the sound hole for a full sound, or near the 12th fret for a balanced, natural sound." 152.4–304.8 mm (conv.) | S-PGA27 p.3–4 "Applications" table | 2026-10-04 | High | Lesson L12/L28 CONFIRMED. Shure gives the SAME 6–12 in for the sound hole; L28 "closer to the sound hole" should read "near the sound hole" (lateral, not nearer). |
| Proximity | "Work close to the microphone for extra bass response." / "Close microphone placement results in a full sound due to the proximity effect." | S-PGA27 | 2026-10-04 | High | |
| PGA27 type | "Large Diaphragm Side-Address Cardioid Condenser Microphone" | S-PGA27 HTML title | 2026-10-04 | High | Lesson L34 side-address note is correct. |
| DPA mounted starting spot | "The spot between the fret board and the sound hole is a good starting position to mount a guitar microphone." | DPA-AG | 2026-10-04 | High | L28 CONFIRMED. |
| DPA more level | position closer to or pointing at the sound hole by "twisting the gooseneck horizontally toward the hole" | DPA-AG | 2026-10-04 | High | |
| DPA stage tip | "place the microphone on the body of the guitar underneath the fret board and point the directional microphone upward, away from the monitor" | DPA-AG | 2026-10-04 | High | L44 CONFIRMED. |
| DPA 4099G clip fit | "body depth between 35 mm (1.4 in) and 122 mm (4.8 in)" | DPA-MOUNT, 4099G | 2026-10-04 | High | |
| DPA 4099G balanced spot | "where the fretboard meets the body, typically above the 12th fret"; "For optimum volume, point the microphone toward the sound hole." | DPA-MOUNT, 4099G | 2026-10-04 | High | **D-AG1**: on a 14-fret steel-string the fretboard meets the body at the 14th fret (MAR-HD12, below), so "above the 12th fret" fits a 12-fret (nylon) body only. Supports L28 "the 12th fret and the body joint are not the same point". |
| Shure booklet rows (recording and live) | "8 inches from sound hole"; "3 inches from sound hole"; "4 to 8 inches from bridge"; "6 inches above the side, over the bridge, and even with the front soundboard"; "Miniature microphone clipped outside of sound hole"; "…inside sound hole" | S-REC p.9, S-LIVE p.22 tables | 2026-10-04 | High (text) / Medium (row-to-tone pairing) | 203.2, 76.2, 101.6–203.2, 152.4 mm (conv.). The PDF text layer separates the placement and tone columns; tones ("Very bassy, boomy" for 3 in, etc.) are paired by order, Medium. |
| Shure two-mic recording tip | "try placing one mic three to six inches away, directly in front of the sound hole. Then put another microphone, of the same type, four feet away." | S-REC p.8 | 2026-10-04 | High | 76.2–152.4 mm and 1219.2 mm (conv.). Not in the lesson; optional. |
| Taylor engineer start | "aimed at the treble side of the upper bout of the guitar — the cutaway region — from approximately 12 inches away" | TAY-REC | 2026-10-04 | High | 304.8 mm (conv.). Guitar, not bass (see C07 correction). |
| Live: condenser vs dynamic | "Any condenser microphone works well for miking an acoustic guitar, as long as the stage sound isn't too cluttered or loud." | S-RHYTHM | 2026-10-04 | High | |
| Reflection off the top | DPA warns the top reflects other sources into the mic | DPA-AG (lesson L6) | 2026-10-04 | Medium | Wording seen on the violin/cello pages verbatim; the guitar page summary agrees. |

## b. Instrument dimensions

| Fact | Value | Source | Checked | Confidence | Notes |
|---|---|---|---|---|---|
| Dreadnought body length | 20" (508.0 mm conv.) | TAY-DN | 2026-10-04 | High | Taylor's dreadnought, the steel 6-string default |
| Width at lower bout | 16" (406.4) | TAY-DN | 2026-10-04 | High | |
| Width at waist | 11-1/16" (280.99) | TAY-DN | 2026-10-04 | High | Deep-body version 11-1/8" |
| Depth from soundhole | 4-5/8" (117.475) | TAY-DN | 2026-10-04 | High | Deep-body 5" (127.0) |
| Scale length | 25-1/2" (647.7) | TAY-DN | 2026-10-04 | High | |
| Upper-bout width, waist and bout positions along the body, soundhole Ø and position, bridge position, body-end depth | UNKNOWN | — | | | Not on TAY-DN |
| HD12-28 body | "D-14 Fret (Dreadnought)"; "Neck Joins Body At: 14th Fret"; "Total Frets: 20" | MAR-HD12 | 2026-10-04 | High | 12-string default; body sizes not given → TAY-DN used as TRIAL |
| HD12-28 scale | 24.9" (632.46) | MAR-HD12 | 2026-10-04 | High | |
| HD12-28 nut / 12th-fret width | 1 13/16" (46.04) / 2 1/4" (57.15) | MAR-HD12 | 2026-10-04 | High | |
| HD12-28 bridge | "Golden Era Modern Belly-12 String - Drop-In Saddle", string spacing 2 5/16" (58.74) | MAR-HD12 | 2026-10-04 | High | Octave-course order not stated (UNKNOWN; lesson says "in common arrangements") |
| Cordoba C5 (nylon default) | Length 19-1/4" (488.95), Width 14-5/8" (371.48), Depth 4" (101.6), Scale 650 mm, Nut 2" (50.8), "Joins at the 12th fret" | ELD-C5 | 2026-10-04 | Medium | Retailer listing; the maker page is 404. Search snippets of other retailers agree (489 mm / 371 mm / 100 mm). |
| Steel vs nylon neck joint | steel 14-fret (MAR-HD12), classical 12-fret (ELD-C5) | as cited | 2026-10-04 | High/Medium | Resolves the survey's "12th vs 14th fret" art flag |

## c. Hearing, safety

| Fact | Value | Source | Checked | Confidence | Notes |
|---|---|---|---|---|---|
| OSHA action level | "hearing conservation program when employee noise exposures equal or exceed 85 decibels (dBA) as an 8-hour time-weighted average (TWA)" | OSHA | 2026-10-04 | High | **Missing from C01** (survey flag). Add one line like C02's. |
| NIOSH REL (on the OSHA page) | "below a level equivalent to 85 dBA for eight hours"; "3 dBA exchange rate"; "At 100 dBA, NIOSH recommends less than 15 minutes" | OSHA | 2026-10-04 | High | Parity with Batch 1 lessons |

## d. Disagreements

- **D-AG1** DPA-MOUNT "fretboard meets the body, typically above the 12th fret" vs the 14-fret steel-string
  joint (MAR-HD12). Draw both points; the zone "neck-to-body" uses the real joint per guitar type.
- **D-AG2** Shure gives one 6–12 in band for both the 12th fret and the sound hole (S-PGA27); the booklet
  gives 3 in and 8 in from the sound hole (S-REC/S-LIVE). Different documents, both Shure; draw both.
