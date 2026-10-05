# M10 Drum Room Microphones: SOURCES (technical reference)

Lesson: `docs/labs/miking/source_text/M10-Drum-Room-Microphones-Miking-Technique.txt`.
Rules and the owner's 2026-10-04 ruling: as in `snare/SOURCES.md`. Checked 2026-10-04 by Claude.

## Source keys

| Key | Source | URL | Status 2026-10-04 |
|---|---|---|---|
| S-REC1 | Shure, Recording Drums Part 1, Nov 6, 2022 (lesson [1]) | see `snare/SOURCES.md` | 200 |
| DPA-KIT | DPA, How to mic a drum kit (lesson [2]) | see `snare/SOURCES.md` | 200 |
| DPA-KICK | DPA, Bo Brinck, How to mic a kick drum (lesson [3]) | see `kick/SOURCES.md` | 200 |
| S-SM4-UG | Shure, SM4 user guide, "Version: 1.6 (2026-I)" (lesson [4] is the HTML twin https://www.shure.com/en-US/docs/guide/SM4) | https://pubs.shure.com/view/guide/SM4/en-US.pdf | 200, read in full |
| S-SM4-WEB | Shure product page SM4 (embedded product data, variant SM4-K-KIT) | https://www.shure.com/en-US/products/microphones/sm4?variant=SM4-K-KIT | 200 |
| DPA-STEREO | DPA, Stereo recording techniques and setups (lesson [5]) | see `overheads/SOURCES.md` | 200 |
| UA-MS | Universal Audio, Daniel Keller, Mid/Side Mic Recording Basics (lesson [6]) | https://www.uaudio.com/blogs/ua/mid-side-mic-recording | 200 |
| UA-STEREO | Universal Audio, "Mixing in Stereo: Adding Width and Depth to Your Recordings" (lesson [7]) | https://www.uaudio.com/blogs/ua/studio-basics-mixing-stereo | 200; no byline or date shown |
| S-LIVE | Shure live booklet (lesson [8]) | see `kick/SOURCES.md` | 200 |
| S-REC | Shure recording booklet | see `snare/SOURCES.md` | 200 |

## a. Facts

| Fact | Value | Source | Checked | Confidence | Notes |
|---|---|---|---|---|---|
| DPA low front pair | "a stereo kit of omnidirectional microphones placed approximately 1 meter in front of the kit, low, in front of the kick drum" | DPA-KICK (also `kick/SOURCES.md` §g) | 2026-10-04 | High | 1000 mm. Spacing and height not given. |
| SM4 drums distance | Table row "Drums 3–6 feet (1–2 m)"; tip "Place in front of the drum kit to capture more of the kick drum, or as an overhead (above the kit, facing down) to capture more cymbals." | S-SM4-UG p.9 | 2026-10-04 | High | Shure's own metric is "1–2 m"; 3–6 ft = 914.4–1828.8 mm (conv.). |
| SM4 pattern | "Polar Pattern: Cardioid"; "versatile side-address cardioid condenser"; "Make sure the logo on the front of the mic faces your sound source." | S-SM4-UG p.3, p.7, p.8 | 2026-10-04 | High | **Survey flag answered (pattern was not in the lesson).** Side-address: the drawing must show the front by the logo face. |
| SM4 specs | "Maximum SPL 1 kHz at 1% THD, 1 kΩ load : 140 dB SPL"; "Self-Noise A-weighted, typical : 13 dB SPL"; "48 V DC phantom power (5.3 mA)"; "Weight: 463 g ( 1.02 lbs)"; "Frequency Response: 20 to 20,000 Hz" | S-SM4-UG p.6–7 | 2026-10-04 | High | |
| SM4 size | Product data (SM4-K-KIT variant): width "118.008", height "80.01", depth "254.991" (mm) | S-SM4-WEB | 2026-10-04 | Medium | Field names only; whether this is the mic alone or with the kit shock mount is not stated (the guide's "Dimensions:" heading is followed by an image only). |
| UA distant pair | "one of the most interesting sessions I ever worked on involved only four mics on the kit — a stereo pair set up a few feet away from the kit, and an ambient pair about 15 feet away in the corners of the room." | UA-STEREO | 2026-10-04 | High | **Survey flag answered: [7] does contain the anecdote.** 15 ft = 4572 mm (conv.). |
| One distant mic facing the kit | "one high quality mic placed at a distance facing the whole kit may capture the sounds of kit and room acoustics in an enjoyable balance." | S-REC drum section | 2026-10-04 | High | Supports the mono room baseline; no number. |
| Close miking in poor rooms | Shure describes the close-mic approach as giving "a drier, more intimate sound, with greater separation and control" and describes two room strategies (use the room or control it) | S-REC1 (WebFetch summary of the page) | 2026-10-04 | Medium | The exact sentence that ties "poor room" to "close pickup" was not quoted back by the fetch tool; treat lesson L67 "Shure explicitly favors close pickup when room acoustics are poor" as Medium until read in a browser. |
| Overhead picks up ambience live | "Picks up ambience and leakage." | S-LIVE item 1 | 2026-10-04 | High | Lesson L68 CONFIRMED. |
| X/Y common angle | "90° angle (±45°)" | DPA-STEREO | 2026-10-04 | High | |
| A/B spacing example | "±70° recording angle … 40 cm (16 in)" | DPA-STEREO | 2026-10-04 | High | Used as the TRIAL spacing for the DPA low front omni pair (DPA gives no spacing there). |
| M/S decode and mono | "split the Side signal into two separate channels … reversing the phase of one of them. Pan one side hard left, the other hard right"; "the two Side channels cancel each other out when you switch the mix to mono, only the center Mid channel remains" | UA-MS | 2026-10-04 | High | Lesson L22 CONFIRMED. |
| Speed of sound, path → delay | c = 331.3·√(1 + T/273.15), 343.2 m/s at 20 °C | `SOURCES_SHARED.md` §1 | 2026-10-04 | High | For the arrival-time readout (4572 mm ≈ 13.3 ms at 20 °C, DERIVED). |

## b. Re-verification of the lesson's numbers

| Lesson claim (line) | Verdict | Source's exact words |
|---|---|---|
| L6, L30: DPA low front stereo-omni pair "approximately 1 m" | **CONFIRMED** | DPA-KICK (above). |
| L6, L33: SM4 "3–6 ft (about 1–2 m) in front of drums"; "in front for more kick, or over the kit for more cymbals" | **CONFIRMED** | S-SM4-UG (above). Shure prints "(1–2 m)" itself; "about" can go. |
| L39: UA "a near stereo pair and a room pair about 15 ft away in room corners" | **CONFIRMED** | UA-STEREO: "a stereo pair set up a few feet away from the kit, and an ambient pair about 15 feet away in the corners of the room". Add the metric value (≈ 4.6 m). |
| L14–22: XY / spaced omni / M-S descriptions | **CONFIRMED** | DPA-STEREO, UA-MS. |
| L64: DPA "identifies different mic distances as a source of phase issues" | **CONFIRMED (general)** | DPA-KIT discusses phase issues with multiple mics; DPA-PPD content not re-audited (shared row). |
| L67: Shure favours close pickup in poor rooms | **UNVERIFIED wording (Medium)** | see §a. |
| L68: distant room mic picks up PA/monitors live | Consistent with S-LIVE ("Picks up ambience and leakage") | — |
| L65: "M11 will cover complete kit channel plans" | **Stale** | M11 exists. Present tense. |

## Disagreements and gaps

- No source gives a room size, ceiling height, room-mic height, stand type or the spacing of the
  DPA low front pair. All are drawing defaults in the geometry file.
- The lesson's list of stereo choices omits ORTF (taught in M09); the stereo tool will show it.

## Simplifications register

- Room drawn as a rectangular box with flat walls; no absorption, diffusion or modes are modelled.
- Arrival times are straight-line paths at 20 °C (`SOURCES_SHARED.md` §5).
