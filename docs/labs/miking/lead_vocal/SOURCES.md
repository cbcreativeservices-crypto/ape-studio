# E01 Lead Vocal: SOURCES (technical reference) + Lab 5 shared source register (§0)

Lab: Miking Labs, Lab 5 Ensembles and Voice, scope E01.
Lesson: `docs/labs/miking/source_text/Lead-Vocal-Miking-Technique.txt` (line numbers = `cat -n` of that file).
Checked: 2026-10-05 by Claude (technical-reference pass, no app code). Rules as `kick/SOURCES.md`: values copied
exactly; metric conversions mine, marked (conv.), 1 in = 25.4 mm exactly; UNKNOWN stays UNKNOWN; High = maker
document read today; Medium = read today but needs interpretation or a non-maker practitioner/secondary source;
Low = snippet only (never drives geometry).

## §0 Lab 5 shared source keys (every Lab 5 folder cites these keys)

| Key | Source | URL | Status 2026-10-05 |
|---|---|---|---|
| S-VOC-REC | Shure, "How to Record and Mix Vocals", "February 6, 2015", no author (E01 [1], E03 [1], E07 [1], E08 [3]) | https://www.shure.com/en-US/insights/how-to-record-and-mix-vocals | 200 |
| S-VOC-TIPS | Shure, Bill Gibson, "Vocal Miking Tips Recommendations", "January 25, 2012" (E01 [4], E02 [1]/[6], E03 [4], E04 [2]) | https://www.shure.com/en-US/insights/vocal-miking-tips-2 | 200 |
| N-VOC | Neumann Home Studio Academy, "Recording vocals in your home studio, part 1" (E01 [2], E03 [3]) | https://www.neumann.com/en-us/knowledge-base/neumann-im-homestudio/homestudio-academy/recording-vocals-in-your-home-studio-part-1 | 200 |
| N-POP | Neumann Home Studio Academy, "How to protect your microphone against pops" (new) | https://www.neumann.com/en-us/knowledge-base/neumann-im-homestudio/homestudio-academy/how-to-protect-your-microphone-against-pops | 200 |
| DPA-VOICE | DPA, Bo Brinck, "How to mic the voice: technology and characteristics" (E01 [3], E03 [6]) | https://www.dpamicrophones.com/mic-university/how-to-mic/how-to-mic-the-voice-technology-and-characteristics/ | 200 |
| DPA-VOC-STUDIO | DPA, Mikkel Nymand, "How to mic vocals in the recording studio" (E03 [5]) | https://www.dpamicrophones.com/mic-university/how-to-mic/how-to-mic-vocals-in-the-recording-studio/ | 200 |
| N-KMS104 | Neumann KMS 104 product page (E01 [5]) | https://www.neumann.com/en-gb/products/microphones/kms-104/ | not re-read (lesson cites it only as an example) |
| S-SM58-UG | Shure SM58 user guide PDF (new; placement table, 3-to-1, proximity, monitor) | https://pubs.shure.com/view/guide/SM58/en-US.pdf | 200, PDF read (pypdf) |
| S-SM4-UG | Shure SM4 user guide PDF, "Version: 1.6 (2026-I)" (E03 [2], E07 [2]) | https://pubs.shure.com/view/guide/SM4/en-US.pdf | 200, PDF read. The lesson's HTML URL `shure.com/en-US/docs/guide/SM4` renders client-side (no table in fetched HTML). |
| S-LIVE | Shure, *Microphone Techniques for Live Sound Reinforcement* (booklet) | see `kick/SOURCES.md` | 200, re-read today (3-to-1 p.17/20, polar facts, NOM, choir row, stereo rows) |
| S-REC | Shure, *Microphone Techniques for Recording* (booklet) | see `snare/SOURCES.md` | 200, re-read today (Ensemble Vocals p.5–6, vocal axis, percussion table) |
| S-CHOIR | Shure, James Wasem, "Of Mics and Monitors: Live Sound Reinforcement Tips for Choirs", "May 19, 2016" (E02 [3], E04 [1], E05 [1], E06 [1]) | https://www.shure.com/en-US/insights/of-mics-and-monitors-live-sound-reinforcement-tips-for-choirs | 200 |
| S-CHURCH | Shure, Gino Sigismondi, "Church Mic Basics: Selection and Placement", "May 13, 2013" (E05 [2], E06 [2]) | https://www.shure.com/en-us/insights/talkin-church-mic-basics-with-gino-sigismondi-mic-selection-and-placement | 200 |
| DPA-CHOIR | DPA, Bo Brinck, "How to mic a choir" (E02 [4], E04 [3], E05 [3], E06 [3], E08 [4]) | https://www.dpamicrophones.com/mic-university/how-to-mic/how-to-mic-a-choir/ | 200 |
| S-BLUEGRASS | Shure, Les Banks, "How to Mic a Bluegrass Band", "November 14, 2014" (E02 [2]) | https://www.shure.com/en-US/insights/how-to-mic-a-bluegrass-band | 200 |
| AKG-C414 | AKG C414 XLS/XLII manual, §4.6.2 Choir/Backing Vocals, §4.6.10 Pianos (E04 [4], E05 [4], E06 [4]) | https://www.akg.com/on/demandware.static/-/Sites-masterCatalog_Harman/default/dw0d863e9c/pdfs/AKG_C414XLS_C414XLII_Manual.pdf | 200, PDF read |
| AKG-C314 | AKG C314 manual, §4.4.10 Grand and Upright Pianos, "Copyright © 2015" (E07 [5]) | https://www.akg.com/on/demandware.static/-/Sites-masterCatalog_Harman/default/dwb5125d17/pdfs/AKG_C314_Manual.pdf | 200, PDF read |
| SCH-MSTC74 | SCHOEPS MSTC 74 product page (E11 [5], E12 [3], E13 [4]) | https://schoeps.de/en/products/stereo/stereo-microphones/mstc-74.html | 200 |
| SCH-SURR | SCHOEPS, *Surround* brochure, Decca Tree pp. 12–13 (E13 [5]) | https://schoeps.de/fileadmin/user_upload/user_upload/Downloads/Kataloge_und_Broschueren/Anwenderbroschueren/SCHOEPS_surround-brochure.pdf | 200, 16 pp. PDF, pp. 2, 4, 12–15 read (pypdf) |
| DPA-STEREO | DPA, Eddy Bøgh Brixen, "Stereo recording techniques and setups" (E14 [3], E15 [3], E16 [9]) | see `overheads/SOURCES.md` | 200 in Batch 1; not re-read (facts in `overheads/SOURCES.md` §a) |
| S-COMMON | Shure, "Common Techniques for Stereo Miking" (E11 [4], E12 [2], E13 [3]) | see `overheads/SOURCES.md` | Batch 1 |
| UA-MS | Universal Audio, "Mid/Side Mic Recording Basics" | see `overheads/SOURCES.md` | Batch 1 (M/S decode) |
| DPA-AB-ORCH | DPA, Eddy Bøgh Brixen, "How to AB stereo mic an orchestra" (E11 [6], E13 [1], E14 [1]) | https://www.dpamicrophones.com/mic-university/how-to-mic/how-to-ab-stereo-mic-an-orchestra/ | 200 |
| DPA-MULTI | DPA, Eddy Bøgh Brixen, "Multimiking a classical orchestra" (E11 [7], E13 [6], E14 [2]) | https://www.dpamicrophones.com/mic-university/audio-production/multimiking-a-classical-orchestra/ | 200 |
| PELLOWE | Mike Collins, "John Pellowe Interview" (ex-Decca engineer), 1997, PDF on mikecollins.plus.com (Wikipedia "Decca tree" ref [3]) | Internet Archive copy: http://web.archive.org/web/20160304025343/http://www.mikecollins.plus.com/PUBLICATIONS/PDFS/John%20Pellowe%20Interview.pdf | live site gone; archived PDF read in full (pypdf). Firsthand practitioner — Medium |
| TAPEOP-DECCA | Garrett Haines, "Microphones: Decca Tree Technique", *Tape Op* #46, March 2005 | https://tapeop.com/tutorials/46/microphones-decca-tree-technique | 200 (Medium: trade magazine) |
| JOS-DECCA | Josephson Engineering, "Decca Tree" (quotes Kenneth Wilkinson via M. H. Gray, "The Birth of Decca Stereo", 1987) | https://josephson.com/deccatree.html | 200 (Medium: maker page quoting history) |
| ARI-DECCA | Abbey Road Institute, "The Decca Tree" blog | https://abbeyroadinstitute.co.uk/blog/the-decca-tree-the-secrets-behind-the-legendary-recording-technique/amp/ | 200 (Medium: school blog, no date) |
| WP-DECCA | Wikipedia, "Decca tree" (cross-check only; its DPA "0.6–1.2 m" citation could not be located on dpamicrophones.com) | https://en.wikipedia.org/wiki/Decca_tree | 200 (Low for geometry; pointer only) |
| SCH-VIENNA | SCHOEPS, Camerer, Vienna New Year's Concert setup PDF (E14 [4]) | lesson URL | not re-read (lesson uses it only as a practice example) |
| S-SM27-XEP | Shure, John Xepoleas, "Five Easy Pieces: Miking Drums with a Shure SM27", "May 01, 2013" (E15 [5], E16 [1]) | https://www.shure.com/en-GB/insights/five-easy-pieces-miking-drums-with-a-shure-sm27 | 200 |
| S-BREIT | Shure newsroom, "Wrapping up Big Band Recording With Shure Ribbons", "January 12, 2015" (E16 [2]) | https://www.shure.com/en-US/newsroom/wrapping-up-big-band-recording-with-shure-ribbons | 200 |
| ROY-BRASS | Royer Labs, "Recording Brass" (E16 [6]) | https://royerlabs.com/recording-brass/ | 200 (re-read; also Batch 3) |
| DPA-TPT, DPA-WWB, DPA-SAX, S-SAX, S-BWS | brass/sax keys | `trumpet/SOURCES.md`, `alto_sax/SOURCES.md` | Batch 3 |
| EMAC-BB | Earl MacDonald (Director of Jazz Studies, UConn), "Jazz Big Band Seating Placement" (new) | https://earlmacdonald.com/jazz-big-band-seating-placement | 200, no date (Medium: educator practice) |
| ABSIL | F.G.J. Absil, "Studio Orchestra Seating", Sept 2008, upd. April 2010 (Metropole Orkest) (new) | https://www.fransabsil.nl/archpdf/orchseat.pdf | 200, PDF read (Medium) |
| JAX-SEAT | Jacksonville Symphony, Courtney Lewis (music director), "Musical Chairs: Why Orchestras Sit the Way They Do", "April 30, 2017" (new) | https://www.jaxsymphony.org/musical-chairs-why-orchestras-sit-the-way-they-do/ | 200 (Medium) |
| WENGER-SIG | Wenger, Signature Choral Riser technical sheet, "© 2026 … USA/2026-04" (new) | https://www.wengercorp.com/Lit/Wenger_Signature%20Choral%20Riser_TS.pdf | 200, PDF read (High) |
| GRAS-44AB | GRAS 44AB Mouth Simulator (ITU-T Rec. P.51) product page (new) | https://www.grasacoustics.com/products/ear-simulator/product/281-44ab | 200 |
| GRAS-45BC | GRAS 45BC-3 KEMAR product page (standards list) (new) | https://grasacoustics.com/45BC-3.html | 200 (head dimensions not on page) |
| WHO-SLV | WHO, *Global standard for safe listening venues and events*, 2 March 2022, ISBN 9789240043114 | https://www.who.int/publications/i/item/9789240043114 | landing page 200; **PDF not retrievable here** (IRIS link returned HTML). Child limits read via AAO-HNS below. |
| AAO-NIHL | AAO-HNS position statement, "Mitigation of Noise-Induced Hearing Loss at Music Venues" (cites WHO-SLV and WHO *Guidelines for community noise* 2000) | https://www.entnet.org/resource/mitigation-of-noise-induced-hearing-loss-at-music-venues/ | 200 (Medium: professional body quoting WHO) |
| NSPCC-PA | NSPCC Learning, "Safeguarding children in the performing arts", updated "30 Sept 2019" (new) | https://learning.nspcc.org.uk/safeguarding-child-protection/for-performing-arts | 200 (High for UK practice; jurisdiction-specific) |
| HERTS-CHAP | Hertfordshire County Council, Chaperone guide (names the Children (Performances and Activities) (England) Regulations 2014) | https://www.hertfordshire.gov.uk/media-library/documents/schools-and-education/performance-licence/chaperone-guide.pdf | 200, PDF read |
| CDC-CHILD, NIDCD-CHILD, OSHA-NOISE | E06 [5] [6] [7] | lesson URLs | not re-read (hearing-health context; not geometry) |
| OSHA-2013 | OSHA interpretation, 2013-08-29, overhead loads (E14 [6]) | lesson URL | not re-read |
| SOS-* | Sound On Sound articles (E04 [5], E05 [5][6], E07 [6]–[8], E08 [5][6], E09 [2]–[6]) | lesson URLs | not re-read: no geometry depends on them; qualitative citations only |
| CALC-C | speed of sound via the app calculator | `SOURCES_SHARED.md` §1 | in repo (343.21 m/s at 20 °C) |

### §0.1 Polar facts used for every monitor/null placement in Lab 5 (S-LIVE, High)
- Cardioid "least sensitive at the rear (180 degrees off-axis)"; supercardioid least sensitive "at 126 degrees
  off-axis"; hypercardioid "110 degrees"; rear rejection "-12 dB for the supercardioid and only -6 dB for the
  hypercardioid"; front pickup angles "115 degrees for the supercardioid and 105 degrees for the hypercardioid".
- S-REC (studio monitors): supercardioid null "about 65 degrees on either side of its rear axis" (= 115° off-axis).
  **D-POL**: 126° (S-LIVE) vs 115° (S-REC) vs Batch 3's "125 degrees" (Shure hyper/sub article). The tool draws
  the selected microphone's own polar data; generic default = S-LIVE 126°/110°, labelled "typical".
- S-REC: cardioid pickup angle "approximately 130 degrees".
- S-SM58-UG: "Place the microphone so that unwanted sound sources, such as monitors and loudspeakers, are directly
  behind it." S-VOC-TIPS: cardioid "monitor directly in front of the vocalist"; hypercardioid "slightly to one side
  or the other". **Same place** (wedge in front of the singer = behind the mic): survey flag (d)3 CLOSED.

### §0.2 The ONE 3:1 definition (lead ruling, now sourced)
- S-LIVE p.17: "the distance between microphones should be at least three times the distance from each microphone
  to its intended sound source. The sound picked up by the more distant microphone is then at least 12dB less …";
  p.20 example "if two microphones are each placed one foot from their sound sources, the distance between the
  microphones should be at least three feet." Also: "Strictly speaking, the 3-to-1 rule is based on the behavior of
  omnidirectional microphones. It can be relaxed slightly if unidirectional microphones are used"; reflective
  surface ≥ "1 1/2 times as far from that surface as it is from its intended sound source".
- S-SM58-UG: "Keep the distance between microphones at least three times the distance from each microphone to its
  source." S-CHOIR: "a second microphone should be placed three times the distance from the first microphone as the
  first microphone distance is from the sound source" (example 3 ft → 9 ft).
- **App rule:** `d(mic_i, mic_j) ≥ 3 · max(r_i, r_j)` where r = mic-to-its-source distance. Readout: ratio
  d / max(r) with pass at ≥ 3. E04/E05/E06/E07/E08 examples are consistent with it; **E02 L30's wording
  (neighbour mic ≥ 3 units from that singer) must be rewritten** (see `background_vocals/SOURCES.md`).
- DPA-CHOIR states a different but related quantity ("Neighboring microphones should be at least 3 times further
  from the sound source than the primary microphone", ≈10 dB; "4.5:1" for an equidistant line-up). Show it only as
  a note ("DPA measures from the singer"), never as a second rule.
- Not for stereo arrays (E11 L34, E12 L44, E13 L41, E16 L102 — consistent).

### §0.3 Live gain (S-LIVE, High)
PAG formula with "NOM = the number of open microphones"; glossary: NOM "Decreases gain-before-feedback by 3dB
everytime NOM doubles" (E16 L98 CONFIRMED). Inverse square: "When the distance from a sound source doubles, the
sound level decreases by 6dB."

### §0.4 No-provocation rule (applies to every Lab 5 exercise)
E10 L100, E11 L90, E12 L61, E13 L87, E14 L52, E15 L53, E16 L99 already say do not provoke/sustain feedback. E04 L111
and E07 L41 must match (rewrite proposed in `duets_small_vocal/SOURCES.md` and `singer_with_instrument/SOURCES.md`).
The app never animates or sonifies feedback; its gain model stops with a "margin" readout.

---

## a. Head, mouth and voice model (shared, `GEOMETRY_PROPOSAL.md` §2)

| Fact | Value (exact) | Source | Confidence | Notes |
|---|---|---|---|---|
| Mouth reference point | "At the mouth reference point (MRP), which is 25 mm from the detachable lip ring (35 mm from the mouth of the Type 44AB/AB-1)" | GRAS-44AB | High (maker of an ITU-T P.51 simulator) | The telecom standard reference: 25 mm in front of the lip plane. Used as a drawn tick, not as the lesson's distance origin (lessons measure "from the mouth"). |
| HATS anthropometry basis | "based on worldwide average human male and female head and torso dimensions"; meets "ANSI S3.36/ASA58-2012 and IEC 60318-7:2011" | GRAS-45BC | High (statement) | **Head width/height/depth UNKNOWN**: the standards' numbers are not on any page read today (B&K and GRAS PDFs are image-only to pypdf). Drawing default. |
| Voice peak level | "The human voice can easily produce SPLs above 135 dB peak in the direct sound field." | DPA-VOICE | High | L41 CONFIRMED ("above 135 dB"). |
| Stage distance | "Vocal microphones on stage are normally used within 10 cm" | DPA-VOICE | High | L41 CONFIRMED; L91 "about 10 cm" → "within 10 cm". |
| HF directivity of the voice | "the high frequency from the voice is very directional" (re cheek-placed headsets) | DPA-VOICE | High | Basis for the off-axis brightness readout (qualitative). **No beam-width number read.** |
| Plosives | "The human voice will create heavy wind turbulence, also referred to as pop noise" (DPA-VOICE); plosives "created … by releasing a small blast of air" (N-POP) | DPA-VOICE, N-POP | High | **Air-jet cone angle and reach: UNKNOWN** (no source). Drawing default, labelled illustrative. |
| Proximity effect size | cardioid mics "progressively boost bass frequencies by 6 to 10 dB below 100 Hz when the microphone is at a distance of about 6 mm (1/4 in.) from the sound source" | S-SM58-UG | High (for SM58 class) | The only numeric proximity figure read today; the readout must say "example: Shure SM58". |
| Aim | "The axis of the microphone should usually be pointed some- where between the nose and mouth" | S-REC p.5 | High | Sources E03 L59 "Aim between nose and mouth" (lesson had no citation). |

## b. Lesson claims checked

| Lesson claim (line) | Verdict | Evidence |
|---|---|---|
| L9 Neumann 20–30 cm (8–12 in) | **CONFIRMED** | N-VOC "Maintain a distance of 20–30 cm (8–12 inches)." |
| L9 Shure 10–20 cm (4–8 in) | **CONFIRMED** | S-VOC-REC "approximately 10 to 20 centimeters (4-8 inches) from the mic will provide a good starting point" |
| L10 DPA "can be angled substantially" | **CONFIRMED (source is DPA-VOC-STUDIO, not [3])** | DPA-VOC-STUDIO: "angled by up to 90°" with good off-axis response. Re-cite to DPA studio article. |
| L30 proximity / omni / fig-8 | CONFIRMED (qualitative) | S-VOC-REC; add SM58 6–10 dB example. |
| L32 dynamic for rock/metal/rap | **CONFIRMED** | S-VOC-REC "Rock, Heavy metal, Rap, Aggressive style vocals" |
| L35 pop filter angled, not parallel | **CONFIRMED** | N-VOC "Angle the pop shield slightly so it isn't parallel to the capsule"; add N-POP "at least 10 cm (4 inches) away from the mic". |
| L36 lower for sibilance | **CONFIRMED** | S-VOC-REC "slightly lower so that it is not in direct line of sight with the singer's mouth" |
| L38 "10 dBFS of headroom" | CONFIRMED as Neumann's words ("about 10 dBfs of headroom above the highest peaks") | Units: rewrite "about 10 dB of headroom (peaks near −10 dBFS)" and attribute the wording. |
| L41 within 10 cm / >135 dB | **CONFIRMED** | DPA-VOICE |
| L42 cardioid monitor "directly in front of the singer"; hyper/super "slightly to one side" [4] | **CONFIRMED** for cardioid and **hypercardioid**; S-VOC-TIPS does not mention supercardioid | Add the S-LIVE null angles (§0.1). |
| L42 headset positions | UNKNOWN in DPA-VOICE beyond the cheek caution | Use the maker's instructions; no number drawn. |
| L43 KMS 104 features | not re-read | Example only; keep "example, not a recommendation". |
| Not in lesson | S-SM58-UG table: "Lips less than 15 cm (6 in.) away or touching the wind- screen, on axis"; "15 to 60 cm (6 in. to 2 ft.) away from mouth, just above nose height"; "20 to 60 cm (8 in. to 2 ft.) away from mouth, slightly off to one side" ("minimal 's' sounds"); "90 cm to 1.8 m (3 to 6 ft.) away" | S-SM58-UG | Live zone rows for the distance slider. |
| Not in lesson | DPA studio: close "about 4 inches from the mouth directly on axis", rehearse "2-6 inches"; loose "around 12 inches"; "above the eyebrow" top-head position with 45° down/up; chest "about 12 inch from the mouth" | DPA-VOC-STUDIO | Optional zone rows. |
| Not in lesson | Neumann no-pop-screen variant: "Position the mic top down, at about eye level, and angle it down toward the singer's mouth" | N-POP | Matches lesson L23 "Above and angled down". |

Header L2: strip "Pro Audio Training Academy" (app name; fine in app chrome, not in lesson body). "Teaching exercise"
(L83) → "Practice exercise"; L85 fine.

## c. Disagreements
- **D-LV1** studio start: Shure 100–200 mm vs Neumann 200–300 mm vs DPA close 101.6 mm (2–6 in = 50.8–152.4).
  All shown as named zones; no single default distance claimed. Drawing default = 150 mm (inside Shure's band) —
  a drawing default, not a recommendation.
- **D-POL** null angle (§0.1).
