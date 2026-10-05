# I01a Hi-Hat: SOURCES (technical reference)

Lab: Miking Labs, Lab 2 Idiophones, scope I01a (hi-hat).
Lesson: `docs/labs/miking/source_text/Hi-Hat-Miking-Technique-Research.txt`.
Model: `kick/SOURCES.md` (rules, confidence scale, UNKNOWN stays UNKNOWN).
Checked: 2026-10-05, by Claude (technical-reference pass, Batch 2). Every row was read live on
that date unless it says otherwise. Owner ruling: the app shows only suggested starting points
(no citations); these docs stay exact and sourced.

Rules: values copied exactly as printed; metric conversions are mine and marked "(conv.)",
1 in = 25.4 mm exactly. Confidence **High** = maker/primary document read today; **Medium** =
read today but needs interpretation (stated); **Low** = retailer or snippet, never drawn.

---

## §0. LAB 2 SHARED SOURCE KEYS (every Lab 2 lesson folder uses these keys)

Kit-wide keys already defined elsewhere and reused unchanged: `ZIL-K`, `YMH-HHS`, `YMH-CYS`,
`DPA-HH` (`kit/SOURCES.md`); `S-LIVE` (`kick/SOURCES.md`); `S-SM57-UG`, `S-REC` (`snare/SOURCES.md`);
`CEL-V30`, `MAR-MX112`, `S-MILLS`, `S-PGA27` (`speaker_leslie/SOURCES.md`); `FEN-65DR-MAN`
(`electric_guitar_amp/SOURCES.md`); `NIOSH` (`kick/SOURCES.md`); speed of sound `CALC-C`
(`SOURCES_SHARED.md`).

| Key | Source | URL | Status 2026-10-05 |
|---|---|---|---|
| S-RECBK | Shure, *Microphone Techniques for Recording* (PDF booklet) — lesson refs (hat [2], I04 [1]). **Alias of `S-REC` in `kit/` and `snare/`** (same booklet; the kit file quotes its "within four inches" line) | https://www.shure.com/damfiles/default/global/documents/publications/en/performance-production/microphone_techniques_for_recording_english.pdf-bb0469316afdb6118691d2f3f5e3ff01.pdf | 200, PDF read (text layer) |
| S-LIVE | Shure, *Microphone Techniques for Live Sound Reinforcement* (damfiles host) | see `kick/SOURCES.md` | 200, PDF read; **the content-files.shure.com/dievision/archive host used by I04 [2] and the `content-files.shure.com/Pubs/...` host used by Gong [4] also answer 200** (same booklet) |
| S-REC1 | Shure, "Recording Drums Part 1 - Setting up and Microphone Technique", "November 06, 2022" | https://www.shure.com/en-US/insights/recording-drums-part-1-setting-up-and-microphone-technique | 200 |
| S-OHSUP | Shure, "Using Stereo Overhead Miking Techniques to Supplement a Multi-Miked Drum Setup" | https://www.shure.com/en-US/insights/using-stereo-overhead-miking-techniques-to-supplement-a-multi-miked-drum-setup | 200 (not re-audited line by line) |
| S-RHYTHM | Shure, "Miking the Rhythm Section" (nl-BE host, English text) | https://www.shure.com/nl-BE/insights/miking-the-rhythm-section | 200 |
| S-AL1568 | Shure, *Introduction to Recording and Sound Reinforcement* (AL1568) | https://content-files.shure.com/Pubs/recording-and-sound-reinforcement/us_pro_al1568_recordingsound.pdf | 200, PDF read |
| S-BEYOND | Shure, "Beyond the Basics: Drum Miking" | https://www.shure.com/en-US/insights/beyond-the-basics-drum-miking | 200 |
| S-B181 | Shure, "Placement Techniques for the Beta 181 Side-Address Condenser Microphone", "March 30, 2012" | https://www.shure.com/en-EU/insights/product-spotlight-beta181 | 200 |
| S-HOME | Shure, "Home Recording Guide for Beginners", "October 31, 2024" (en-GB host; nl-NL host same text) | https://www.shure.com/en-GB/insights/home-recording-guide-for-beginners | 200 |
| S-3REASONS | Shure, "Three Reasons Why Mic Placement Matters", "September 24, 2014" | https://www.shure.com/en-EU/insights/three-reasons-why-mic-placement-matters | 200 |
| S-SECRETS | Shure, "Microphone Choice and Placement Secrets for Recording" | https://www.shure.com/en-US/insights/microphone-choice-and-placement-secrets-for-recording | 200 (general; no percussion number) |
| S-POLAR | Shure, "Microphone Directionality and Polar Pattern Basics" | https://www.shure.com/en-US/insights/microphone-directionality-polar-pattern-basics | 200 (principles; not re-audited) |
| S-PHANTOM | Shure, "What Is Phantom Power and Why Do I Need It?" | https://www.shure.com/en-us/insights/what-is-phantom-power-why-do-i-need-it | not re-read (principles only) |
| DPA-HH | DPA, Bo Brinck, "How to mic hi-hat & cymbals" | https://www.dpamicrophones.com/mic-university/how-to-mic/how-to-mic-hi-hat-cymbals/ | 200 |
| DPA-KIT | DPA, "How to mic a drum kit" | https://www.dpamicrophones.com/mic-university/how-to-mic/how-to-mic-a-drum-kit/ | 200 |
| DPA-PPD | DPA, "Polarity, phase and delay" | see `SOURCES_SHARED.md` | resolves; principles only |
| DPA-KILLERS | DPA news 2022, "DPA Microphones creates killer audio for The Killers fall tour" | https://www.dpamicrophones.com/news/2022/dpa-microphones-creates-killer-audio-for-the-killers-fall-tour/ | 200 |
| DPA-JULIET | DPA news 2023, "& Juliet" (Gareth Owen) | https://www.dpamicrophones.com/news/2023/dpa-microphones-are-a-match-made-in-heaven-for-broadway-s-juliet/ | 200 |
| DPA-BLINK | DPA news 2024, Blink-182 world tour 2023/2024 | https://www.dpamicrophones.com/news/2024/blink-182-touring-engineers-tap-dpa-microphones-for-the-band-s-world-tour-20232024/ | 200 |
| DPA-JONAS | DPA news 2021, "The Jonas Brothers Are Burnin' Up With DPA" | https://www.dpamicrophones.com/news/2021/the-jonas-brothers-are-burnin-up-with-dpa/ | 200 |
| DPA-VET | DPA news 2019, "Audio veteran relies on DPA…" (Florence + the Machine FOH) | https://www.dpamicrophones.com/news/2019/audio-veteran-relies-on-dpa-for-live-sound-and-recording-applications/ | 200 |
| DPA-GIZMO | DPA, "10 things digital gizmos cannot correct for you" | https://www.dpamicrophones.com/mic-university/background-knowledge/10-things-digital-gizmos-cannot-correct-for-you/ | 200 |
| DPA-STEREO | DPA, "Stereo recording techniques and setups" | https://www.dpamicrophones.com/mic-university/audio-production/stereo-recording-techniques-and-setups/ | 200 (principles) |
| SN-E914 | Sennheiser e 914 instruction manual 07/2021 (lesson [6]) | lesson URL **DEAD**: 302 → link.sennheiser.com/dam-migration/40715 → optimizely CDN **404**. Read the Internet Archive copy (capture 2024-05-26): https://web.archive.org/web/20240526155238/https://www.sennheiser.com/globalassets/digizuite/40715-en-e914_manual_07_2021_en.pdf | archived copy read in full |
| SN-E914-DOC | Sennheiser online manual, e 914 "Operation" | https://docs.cloud.sennheiser.com/en-us/evolution-wired/manual-e914-using.html | 200 (same positioning text as the PDF) |
| SN-SHELTON | Sennheiser newsroom, Blake Shelton drive-in concert case | https://newsroom.sennheiser.com/country-star-blake-shelton-brings-the-concert-to-a-drive-in-near-you-with-sennheiser-digital-6000-wireless-system-and-evolution-series-microphones | 200 |
| LW-040 | LEWITT, LCT 040 MATCH quickstart guide (PDF, 2019-01) | https://www.lewitt-audio.com/download/quickstart-guide-lct-040-match-en-de-cn (→ /sites/default/files/2019-01/quickstart_lct040match-en-de_cn_web.pdf) | 200, read |
| LW-1MIC | LEWITT blog, "How to record drums with only one microphone" | https://www.lewitt-audio.com/blog/record-drums-with-1-mic | 200 |
| AX-SCX1 | Audix SCX1 product page (lesson [10] uses the `scx1o` URL) | https://audixusa.com/products/scx1o | 200 |
| AX-DPQUAD | Audix DPQUAD product page | https://audixusa.com/products/dpquad/ | 200 |
| YMH-ZG01 | Yamaha ZG01 operating panel | see `kick/SOURCES.md` | read in the kick pass |
| NIOSH | CDC NIOSH, "Understand Noise Exposure", dated "Jan. 31, 2024" | see `kick/SOURCES.md` | read in the kick pass |
| NIOSH-TID | CDC NIOSH Science Blog, "Turn it Down: Reducing the Risk of Hearing Disorders Among Musicians", July 7, 2015 (the mallet / small-percussion / EP lessons' hearing ref) | https://www.cdc.gov/niosh/bulletin/2015/musicians-hearing-loss.html | 403 to curl; read via WebFetch |
| VF-5A | Vic Firth, American Classic 5A drumsticks | https://vicfirth.com/products/american-classic-5a | 200 |
| ZIL-L11 | Zildjian Drum Set Method, Lesson 11 (PDF) | https://ae.zildjian.com/wp-content/uploads/Zildjian_Drum_Method_Lesson_11.pdf | 200, read |
| ZIL-FAQ | Zildjian, Frequently Asked Questions | https://zildjian.com/pages/frequently-asked-questions | 200 |
| SAB-101 | Sabian, "Cymbals 101" | https://sabian.com/cymbals-101/ | 200 |

Lab-2 instrument keys live in their lesson folders: cymbal sizes in `splash_cymbal/`,
`china_cymbal/`; mallet keys in `vibraphone/SOURCES.md` §0; small-percussion keys in each folder;
Rhodes/Wurlitzer keys in `rhodes/` and `wurlitzer/`; gong in `gong/`.

---

## a. Hi-hat instrument and hardware (reuse of the shared cymbal family)

| Fact | Value (exact) | Source | Checked | Confidence | Notes |
|---|---|---|---|---|---|
| Size drawn | 14 in hi-hats (355.6 mm conv.) | ZIL-K "14" HiHats" | 2026-10-04 (kit pass) | High | Already in `cymbalSpec.ts` (`HIHAT_14`). |
| Pair is dissimilar | "The two cymbals are rarely identical – their thickness and weight are usually different. Normally, a heavy cymbal is at the bottom and a lighter one on top." | DPA-HH | 2026-10-05 | High | Lesson L7 "often dissimilar" CONFIRMED. Drawing: same diameter, the bottom one drawn heavier (line weight only; thickness UNKNOWN). |
| History note | "Originally the hi-hat (also called sock cymbal) was positioned extremely low (30 cm above the ground) and only played with the foot" | DPA-HH | 2026-10-05 | High | Context only. |
| Stand height range | HS-1200 family "Available Height Range 80-92cm"; HS-850 "70 -90cm" | YMH-HHS | 2026-10-04 (kit pass) | High numbers / Medium (point measured not stated) | Kit plan draws the pair at h 850 (inside the range). |
| Open gap | "use small cymbals vertically spaced 1/2" apart" (12.7 mm conv.) | S-LIVE item 5 | 2026-10-05 re-read | Medium | A leakage tip, used only as the TRIAL open gap (already `HIHAT_HARDWARE.openGap`). |
| Clutch, rod, pedal travel, bottom-cymbal tilt, top-cymbal rock angle | **UNKNOWN** | none | 2026-10-05 | (none) | No maker page read today gives them. |
| Strike spot | "a good stick attack, which is best captured around the spot, where the drummer hits the hi hat with the stick (usually around 2-3 cm (1 inch) from the edge)" | DPA-HH | 2026-10-05 | High | A PLAYING location (lesson L48 reads it correctly), 20–30 mm in from the edge. |
| Stick | "Length: 16” | 40.64cm"; "Diameter: 0.565” | 1.44cm" (5A) | VF-5A | 2026-10-05 | High | One common stick; used for the stick envelope length (TRIAL: any stick). |
| Hat radiates horizontally | "cymbals radiate their sound above and below, whereas the hi-hat resonates horizontally" | S-REC1 | 2026-10-05 | High | Supports the air/edge ring and the overhead note. |

## b. Microphones named

| Fact | Value | Source | Checked | Confidence | Notes |
|---|---|---|---|---|---|
| e 914 type / pattern | "pre-polarised condenser microphone"; pick-up pattern "cardioid" | SN-E914 p.7 | 2026-10-05 | High | The text layer of the spec table is column-shifted; values read in order: 20–20,000 Hz; cardioid; 7 mV/Pa; 137/147/157 dB SPL by pre-attenuation; 48 V / 2.2 mA; XLR-3. |
| e 914 size / weight | "24 x 157 mm"; "198 g" | SN-E914 p.7 | 2026-10-05 | High | Ø 24 × 157 mm. |
| e 914 switches | pre-attenuation "0 dB, -10 dB, -20 dB"; bass filter "roll-off 130 Hz, 6 dB/oct.", "cut-off 85 Hz, 18 dB/oct."; "The cut-off filter reduces low-frequency wind noise by 18 dB/octave." | SN-E914 p.5, p.7 | 2026-10-05 | High | Lesson's "high-pass filter" CONFIRMED (two settings). |
| e 914 null | "the angle area of the highest cancellation of the microphone (approx. 180°)" | SN-E914 p.4 | 2026-10-05 | High | |
| SCX1 family | "also available with hypercardioid (model SCX1HC) or omnidirectional (model SCX1O) capsules"; "21 mm gold vapor capsule"; "will handle sound pressure levels of 130 dB"; "The SCX1HC condenser microphone is a number one choice for miking hi-hat both live and in the studio." | AX-SCX1 | 2026-10-05 | High | Lesson's "marketing" reading is fair. Body length: `SOURCES_SHARED.md` AX-SCX1 (104 mm, re-verify). |
| DPA models on the hat page | "a good condenser microphone like the 4011 Cardioid Microphone, the 2012 Cardioid Microphone or the 4099 CORE+ Instrument Microphone"; "The 4099 CORE+ can be mounted underneath the hi-hat using the universal U-CLIP Universal Microphone Clip." | DPA-HH | 2026-10-05 | High | Lesson names only the 4099 (fine). |
| LCT 040 MATCH | "Position the microphone above the hi-hat. Vary between center and edge of the hi-hat for different tones." | LW-040 | 2026-10-05 | High | No number. |

## c. Re-verification of the lesson's placement claims

| Lesson claim | Verdict | Source's exact words |
|---|---|---|
| L36 Shure recording: "within four inches of the hi-hat, away from the air puff at closure" | **CONFIRMED** | "If necessary, a mic placed away from the puff of air that happens when hi-hats close and within four inches to the cymbals should be a good starting point. (See position G…)" (S-RECBK p.18). 4 in = 101.6 mm (conv.). Also: "Many times the overhead mics will provide enough response to the high hat to eliminate the need for a separate hi-hat microphone." |
| L36 Shure article: pencil condenser "roughly 10–15 cm away, pointing down near the far edge away from the snare" | **CONFIRMED (wording)** | "try placing a pencil condenser mic roughly 10 - 15 cm away and pointing directly down at the edge on the far side, away from the snare." (S-REC1, Nov 06 2022). "near the far edge" → Shure says "directly down at the edge on the far side". |
| L39 DPA "5–10 cm above the top cymbal", angle to reduce snare | **CONFIRMED** | "Position your microphone at an angle where you can't see the snare drum and place the microphone 5-10 cm from the top of the hi-hat cymbal." (DPA-HH). |
| L42 e 914 "a few centimetres above the outer edge, aimed downward"; avoid closing-edge air | **CONFIRMED (archived PDF and live online manual)** | "Attention: When closing the hi-hat, a strong air current is created on the edge. If the microphone is positioned too close to the edge, interfering noise due to the air current can occur." "Position the microphone a few centimetres above the outer edge of the hi-hat aiming down. If necessary, remove unwanted low-frequency signal portions by high pass filtering." (SN-E914 p.4; SN-E914-DOC Position A). Position B is the **overhead** ("Good starting position for live miking applications"). |
| L45 DPA edge = lower, centre = higher overtones | **CONFIRMED** | "the lower frequencies are mostly represented at the edge of the cymbals; the high overtones are towards the center of the cymbal." (DPA-HH); DPA-KIT: "The frequencies radiated from the hi-hat are higher towards the center and lower as the mic is placed closer to the edge." |
| L28 DPA underside: less stick attack, changed warmth | **CONFIRMED** | "If the hi-hat is miked from the bottom side, there will be a loss of stick attack and the warmer tones of the top cymbal will be attenuated." (DPA-HH) |
| L8 Shure: overheads often enough | **CONFIRMED** | S-RECBK (above); S-REC1 "Typically, a well placed pair of overheads should be more than enough to capture a nice crisp hi-hat."; S-BEYOND (Wertico): "we've rarely, if ever, ended up using it on the final mix". |
| L21 / L52 Shure "angling a snare mic somewhat toward the hi-hat" vs LEWITT rear rejection | **CONFIRMED, but INCOMPLETE** | S-LIVE item 5: "Or angle snare drum microphone slightly toward hi-hat to pick up both snare and hi-hat". BUT the same booklet, drum-kit intro: "To avoid picking up the hi-hat in the snare mic, aim the null of the snare mic towards the hi-hat." LW-1MIC: "use the cardioid pattern's rear rejection to your advantage by placing it angled away from the hi-hat as much as possible." → Shure itself gives BOTH strategies (goal-dependent). Not "Shure vs LEWITT". |
| L52 "a supercardioid … retain a rear lobe" | Consistent | S-LIVE p.9 (kick pass). |
| L10 NIOSH | CONFIRMED (kick pass) | |
| L12 Yamaha ZG01 | CONFIRMED (kick pass) | |
| L30 lesson's mic list (Shure pencil, e 914, LCT 040 MATCH, SCX1HC) | CONFIRMED | as rows above. |

**New Shure hi-hat starting points the lesson does not carry** (each a different geometry):
- S-LIVE item 5: "Aim microphone down towards the cymbals, a few inches over edge away from
  drummer (Position G)." Tone "Natural, bright"; "Place microphone or adjust cymbal height so that
  puff of air from closing hi-hat cymbals misses mike. Roll off bass to reduce low-frequency leakage."
- S-RHYTHM: "If the hi-hat needs more bite, place a small-diaphragm condenser mic a few inches above
  the hi-hats, angled at the area just below the cup."
- S-AL1568: "Cymbals – Place a condenser microphone above the hi-hats, pointed down and slightly away
  from the drummer. Or, angle the snare mic slightly towards the hi-hats."
- S-B181: "use a bidirectional head directly under the hi-hat and capture both with one mic"
  (snare + hat, side-address).

Touring examples (data only): DPA-KILLERS "4011 Cardioid Condenser Mics on snare top and bottom, as
well as on the hi-hat"; DPA-BLINK "2011 Twin Cardioid mics for snare and hi-hats"; SN-SHELTON "a
pair of e914 microphones on hi-hat and ride"; DPA-JULIET "outfitted the ride cymbals and hi-hats
with DPA's 4015 Wide Cardioid microphones".

## d. Reference URLs

| Ref | Resolves? | Note |
|---|---|---|
| [1] DPA-HH | 200 | Author Bo Brinck. |
| [2] S-RECBK | 200 | |
| [3] S-REC1 | 200 | Nov 06 2022. |
| [4] S-LIVE | 200 | |
| [5] DPA-KIT; S-OHSUP | 200 / 200 | |
| [6] e 914 PDF | **DEAD (404)** | Archive copy read; replace with SN-E914-DOC (same text). |
| [7] LW-040 | 200 (redirect to PDF) | |
| [8] YMH-ZG01 · [9] NIOSH · [12] DPA-PPD | resolve | kick pass |
| [10] AX-SCX1 | 200 | URL is the SCX1**O** page; it covers the family. |
| [11] LW-1MIC | 200 | |

## Disagreements log

- **HH-D1 Close distance** (four Shure figures + DPA + Sennheiser, all different geometries):
  "within four inches to the cymbals" (S-RECBK); "roughly 10 - 15 cm away … at the edge on the far
  side, away from the snare" (S-REC1); "a few inches over edge away from drummer" (S-LIVE); "a few
  inches above the hi-hats, angled at the area just below the cup" (S-RHYTHM); "5-10 cm from the top"
  (DPA-HH); "a few centimetres above the outer edge" (SN-E914). Note the Shure edge directions differ:
  **away from the snare** (S-REC1) vs **away from the drummer** (S-LIVE).
- **HH-D2 Snare-mic strategy**: Shure gives both (null toward the hat; or angle toward the hat).
- **HH-D3 e 914 PDF**: lesson link dead; text unchanged in the online manual (unlike the e 902).

## Simplifications register

- Pair drawn with `cymbalSpec.ts` profiles (drawing defaults); thickness difference shown by line weight.
- Air-burst ring, stick sector, pedal and clutch envelopes are drawing defaults (see the geometry).
