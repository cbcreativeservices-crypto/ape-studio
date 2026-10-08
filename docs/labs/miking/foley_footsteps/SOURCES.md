# F01 Foley Footsteps and Surfaces: SOURCES (technical reference) + Lab 6 part 1 shared source register (§0)

Lab: Miking Labs, Lab 6 Foley, Field & Scientific (registry id `field`), scope F01.
Lesson: `docs/labs/miking/source_text/Foley-Footsteps-and-Surfaces-Miking-Technique.txt` (line numbers = `cat -n`
of that file; the owner's .docx has no `F01-` prefix).
Checked: 2026-10-07 by Claude (preparation pass for Lab 6 part 1, F01–F08; no app code, no sub-agents). Rules as
`kick/SOURCES.md` and `lead_vocal/SOURCES.md`: values copied exactly; metric conversions mine, marked (conv.),
1 in = 25.4 mm, 1 ft = 304.8 mm, 1 yd = 914.4 mm exactly; UNKNOWN stays UNKNOWN; **High** = maker / government /
primary document read today; **Medium** = read today but a practitioner account, trade magazine or needs
interpretation; **Low** = snippet or search summary only (never drives geometry).
Statuses used in §b: **CONFIRMED** (reachable public source read today), **PRACTICE** (a named practitioner's own
working method, read today — a starting point, not a rule), **UNSOURCED** (no source read; the lesson's own trial or
reasoning), **WRONG → correction**, **NOT RE-READ** (source unreachable today; nothing drawn depends on it).

## §0 Lab 6 part 1 shared source keys (every F01–F08 folder cites these keys)

| Key | Source | URL | Status 2026-10-07 |
|---|---|---|---|
| FF-CUE | Foley First, "How to Cue a Foley Session" (F01 [1], F03 [3]) | https://foleyfirst.com/blog/how-to-cue-a-foley-session/ | 200 (Medium: practitioner blog) |
| FF-PIT | Foley First, "How to Build a Foley Pit", 24 Jul 2021 (F01 [3]) | https://foleyfirst.com/blog/how-to-build-a-foley-pit/ | 200 (Medium). **Pit dimensions read** (§a) |
| FF-KMR | Foley First, "Neumann KMR 81 and Rode NTG 2 on Foley", 5 May 2020 (F01 [5]) | https://foleyfirst.com/blog/neumann-kmr-81-and-rode-ntg-2-on-foley-short-comparing-test/ | 200 (Medium) |
| FF-HP | Foley First, "Foley Artists and Headphones", 4 Feb 2023 (F01 [7]) | https://foleyfirst.com/blog/foley-artists-and-headphones-benefits/ | 200 (Medium) |
| FF-CLOTH | Foley First, "Foley recording and editing: clothes", 26 Jul 2020 (F02 [1]) | https://foleyfirst.com/blog/foley-recording-and-editing-clothes/ | 200 (Medium) |
| NF-FOLEY | NoiseFloor, "Foley Sound Services" (F01 [2]) | https://noise-floor.com/foley/ | 200 (Medium: studio page) |
| S-FOLEY | Shure, Linda Hansen, "Everything You Need to Know About Foley Recording", 25 Apr 2018 (Bryen Hensley) (F01 [4]) | https://www.shure.com/nl-NL/insights/everything-you-need-to-know-about-foley-recording (lesson's nl-NL link; use the en-US locale in the record) | 200 (Medium: interview on a maker site) |
| DPA-TUBE | DPA, "The interference tube and its use in microphones" (F01 [6]) | https://www.dpamicrophones.com/mic-university/technology/the-interference-tube-and-its-use-in-microphones/ | 200 (High, qualitative only: no frequency formula on the page) |
| DPA-POL | DPA, "Polarity, phase and delay" (F01 [8]) | https://www.dpamicrophones.com/mic-university/technology/polarity-phase-and-delay/ | 200 (High) |
| S-LIVE | Shure, *Microphone Techniques for Live Sound Reinforcement* (F01 [9]) | see `kick/SOURCES.md`; register `lead_vocal/SOURCES.md` §0 | Batch 5 (NOM 3 dB per doubling, 3:1, null angles) — not re-read today |
| S-SECRETS | Shure, "Microphone Choice and Placement Secrets for Recording" (F01 [10]) | lesson URL | not re-read (gain-staging generality only) |
| SCH-SHOTGUN | SCHOEPS, "Principal Characteristics of the Different Microphone Types" PDF, 3 pp., dated 2018-07-09 in its metadata (F02 [3], F03 [7]) | https://schoeps.de/fileadmin/user_upload/user_upload/Schoeps_Microphone_type_basicproperties.pdf | 200, PDF read (pypdf). **High**. Shotgun section quoted in §c |
| SCH-CCM41 | SCHOEPS CCM 41 product page (F02 [4]) | lesson URL | not re-read (example mic only) |
| HECKER | No Film School, "Foley 101: master Foley artist Gary Hecker", 16 Dec 2020 (F02 [2], F03 [5], F04 [3], F05 [1]) | https://nofilmschool.com/foley-101-master-foley-artist-gary-hecker | 200 (Medium: interview) |
| HAYES | DPA, "In conversation with Simon Hayes", 2015 (F02 [5]) | https://www.dpamicrophones.com/news/2015/in-conversation-with-simon-hayes/ | 200 (Medium) |
| RYC-BOOM | Rycote, boom shock mounts (F02 [6], F03 [10], F05 [9]) | https://rycote.com/microphone-windshield-shock-mount/boom-shock-mounts/ | **429 today — NOT RE-READ** (mechanical-path claim is general practice) |
| S-3REASONS | Shure, "Three Reasons Why Mic Placement Matters" (F02 [7], F03 [4]) | https://www.shure.com/en-MEA/insights/three-reasons-why-mic-placement-matters | 200 (High, qualitative) |
| OUP-MW | Oxford Learning Link, Haines *Take 10* extended interviews: Andy Malcolm and Don White (F03 [1], F04 [4], F05 [2]) | https://learninglink.oup.com/access/content/haines-student-resources/haines-take-10-extended-interviews | 200 — readable without login today (Medium) |
| ASE-CROSS | A Sound Effect, Ben Cross interview (F03 [2], F05 [3]) | https://www.asoundeffect.com/foley-mixing-armor-sound-effects/ | 200 (Medium) |
| MIX-1997 | Mix, "Foley Recording", May 1997 (F03 [6]) | https://www.mixonline.com/recording/foley-recording-may-1997-377037 | 200 (Medium, historical) |
| MIX-2005 | Mix, Blair Jackson, "Foley Recording", 1 Sep 2005 (F05 [4]) | https://www.mixonline.com/recording/foley-recording-365547 | 200 (Medium). **3–6 ft + "about 15 degrees" read** (§a) |
| ENO-FOLEY | English National Opera, "The Foley Artist" (F03 [8], F04 [8]) | https://www.eno.org/engage/the-foley-artist/ | 200 (Medium) |
| S-RHYTHM | Shure, "Miking the Rhythm Section" (es-LATAM) (F03 [9]) | lesson URL | not re-read: a band article — **weak support for live Foley; replace** (F03 §b) |
| DS-BRY | Designing Sound, Frank Bry splash library, 20 Jan 2011 (F04 [1]) | https://designingsound.org/2011/01/20/the-recordist-releases-ultimate-splash-sfx-library/ | 200 (Medium) |
| KROTOS-VAL | Krotos, John Valasis, water Foley (F04 [2]) | https://krotos.studio/blog/water-foley-behind-the-scenes | 200 (Medium) |
| RYC-RAIN | Rycote Windshield Rain Jacket (F04 [5]) | https://www.rycote.com/microphone-windshield-shock-mount/windshield-rain-jacket/ | 200 (High) |
| S-SM4-UG | Shure SM4 user guide PDF (F04 [6]; lesson's HTML link renders client-side) | https://pubs.shure.com/view/guide/SM4/en-US.pdf | 200, PDF read (High). Same key as Lab 5 |
| ASE-ELEM | A Sound Effect, *Elemental* film sound (F04 [7]) | https://www.asoundeffect.com/elemental-film-sound/ | 200 (Medium) |
| RYC-NANO | Rycote Nano Shield overview (F04 [9]) | lesson URL | not re-read |
| DPA-STEREO | DPA, Eddy Bøgh Brixen, "Stereo recording techniques and setups" (F05 [5], F06 [3], F08 [4]) | https://www.dpamicrophones.com/mic-university/audio-production/stereo-recording-techniques-and-setups/ | 200, re-read today (High): XY 90° (±45°), ORTF 17 cm, AB 20 cm → ±70° example, M/S L = M+S, R = M−S, "÷√2" |
| S-REC | Shure, *Microphone Techniques for Recording* (F05 [6]) | see `snare/SOURCES.md` | Batch 1/5 (comb filtering) — not re-read |
| ASE-EDWARD | A Sound Effect, Edward Foley footstep library (F05 [7]) | lesson URL | not re-read |
| S-AUTOMIX | Shure, "Automatic microphone mixers: when you need them" (F05 [8]) | https://www.shure.com/en-EU/insights/automatic-microphone-mixers-when-your-need-them | 200 (High) |
| NPS-FIELD | NPS, "In the Field" natural sounds (F06 [1]) | lesson URL | not re-read |
| NPS-RM47 | NPS, Reference Manual 47 part 2, data collection (F06 [2], F07 [6]) | https://www.nps.gov/subjects/sound/rm47-part-2-data.htm | 200 (High): wind > 5 m/s, weather pairing, 25-day period |
| RODE-BAR | RØDE, Stereo Bar news (F06 [4]) | https://rode.com/en-us/about/news-info/record-perfect-stereo-imaging-every-time-with-the-new-rode-stereo-bar | 200 (High): ORTF 17 cm / 110°, XY 90° |
| SD-MS, SD-7STEPS, SD-LIVE, SD-WU, SD-POTTER | Sound Devices pages (F06 [5] [11] [12], F07 [9], F08 [1] [2] [7]) | lesson URLs | **403 today — NOT RE-READ.** No geometry depends on them (M/S matrix is CONFIRMED by DPA-STEREO). |
| DPA-BIN | DPA, binaural recording techniques (F06 [6]) | lesson URL | not re-read (F06 row only; F10 builds binaural) |
| NPS-WILD | NPS, "7 Ways to Safely Watch Wildlife" (F06 [7], F07 [3]) | https://www.nps.gov/subjects/watchingwildlife/7ways.htm | 200 (High, US parks): **25 yd / 100 yd** (§ F07) |
| RODE-WIND, RYC-WS1 | RØDE wind-noise article; Rycote WS-1 kit (F06 [8] [9], F08 [8]) | lesson URLs | not re-read (qualitative) |
| NPS-DATA | NPS, "Types of Sound Data" (F06 [10]) | lesson URL | not re-read |
| S-SM63 | Shure, "The SM63: a go-to mic for outdoor applications" (F06 [13]) | https://www.shure.com/en-US/insights/the-sm63-a-go-to-mic-for-outdoor-applications | 200 (High) |
| NWS-LTG | US National Weather Service, Lightning Safety overview (F06 [14], F07 [10], F08 [10]) | https://www.weather.gov/safety/lightning-safety-overview | 200 (High) |
| NIOSH-NOISE | CDC/NIOSH, "Understand Noise Exposure" (F06 [15], F08 [9]) | https://www.cdc.gov/niosh/noise/prevent/understand.html | 200 (High): REL 85 dBA 8 h, 3 dB exchange |
| CORNELL-MIC | Cornell Lab, Macaulay Library, "Microphones" (F07 [1]) | https://www.macaulaylibrary.org/resources/audio-recording-gear/microphones/ | 200 (High for practice; research library) |
| CORNELL-ACC | Macaulay Library, "Accessories and windscreens" (F07 [4]) | https://www.macaulaylibrary.org/resources/audio-recording-gear/accessories/ | 200 (High) |
| CORNELL-DATA | Macaulay Library, manage files and data (F07 [5]) | lesson URL | not re-read |
| SCH-DISH | SCHOEPS Parabolic Dish Set product page (F07 [2]) | https://schoeps.de/en/products/special-microphones/parabolic-dish/parabolic-dish-set.html | 200 (High): **585 mm, focal 210 mm** |
| INNERCORE | Innercore parabolic microphone, technical details (F07 [7]) | https://www.parabolicmicrophone.co.uk/pages/technical-details | 200 (High): **500 mm, focal 140 mm** |
| TELINGA | Telinga Stereo MK3 (F07 [8]) | lesson URL | not re-read |
| LS-DISH | Les Smith, field-recording notes, parabolic gain (new; plan's "dish gain vs wavelength" gap) | https://lessmiths.com/frecord/fr302.shtml | 200 (Medium: practitioner; formula, no derivation) |
| OSHA-WZ | OSHA, Highway Work Zones (F08 [3]) | https://www.osha.gov/highway-workzones | 200 (High) |
| SEN-416 | Sennheiser MKH 416 info page (F08 [5]) | lesson URL | **404 today → WRONG link**; specs page found: https://docs.cloud.sennheiser.com/en-us/mkh-416-mkh-418-s/specs-mkh-416.html (search summary, Low: Ø 19 × 250 mm, "Super-cardioid/lobar") |
| OSX-DOPPLER | OpenStax, *University Physics* vol. 1, §17.7 The Doppler Effect (F08 [6]) | https://openstax.org/books/university-physics-volume-1/pages/17-7-the-doppler-effect | 200 (High): eq. 17.18 |
| CALC-C | speed of sound via the app calculator | `SOURCES_SHARED.md` §1 | in repo (343.21 m/s at 20 °C) |

### §0.1 Rules that carry over from Labs 1–5 unchanged
- **No-provocation rule** (`lead_vocal/SOURCES.md` §0.4): every F01–F08 lesson already forbids provoking feedback
  (F01 L65, F02 L33, F03 L49, F04 L49, F05 L35/L51, F06 L53, F08 L35). Nothing to rewrite. The app never animates or
  sonifies feedback.
- **3:1** is not used anywhere in Lab 6 part 1 (mono-sum listening instead). Do not add it.
- **Polar facts** for any live monitor: S-LIVE angles (`lead_vocal/SOURCES.md` §0.1).
- **Stereo arrays**: `full_orchestra/SOURCES.md` §A (ORTF 170 mm / 110° included, recording angle 95°; XY 90–135°;
  AB; M/S) — now also DPA-STEREO and RODE-BAR above.
- **Open mics**: S-AUTOMIX "the audio output of eight open microphones would contain 9 dB more background noise and
  reverberation than a single open microphone" (= 10·log10 8 = 9.03 dB, DERIVED check) and "The margin for stable
  (feedback-free) operation reduces every time another microphone is opened"; S-LIVE NOM 3 dB per doubling.

---

## a. Geometry facts for the Foley stage (shared by F01–F05, `GEOMETRY_PROPOSAL.md` §1–§2)

| Fact | Value (exact) | Source | Confidence | Notes |
|---|---|---|---|---|
| Pit area | "0.8 sq. meters" minimum usable; "Dimensions of 1.2 x 1 meter are optimal"; "Bigger is better." | FF-PIT | Medium | Default pit 1200 × 1000 mm (SOURCED, practice). |
| Pit framing | concrete framing "at least 70 millimeters", the author prefers "100 mm" | FF-PIT | Medium | Drawn rim 100 mm. |
| Pit height | "50 millimeters to 1 meter (if we are talking about a water tank)" | FF-PIT | Medium | Dry surface pit drawing default 100 mm deep (inside the range; `placeholder`). |
| Base floor | "a massive concrete slab … not less than 30 centimeters"; their own "35 centimeter monolithic cement slab laying on a thick layer of dense sand" | FF-PIT | Medium | Side view section only. |
| Unwanted floor resonance | leveling layers created "resonances in the range of 80-200 Hz" and were removed | FF-PIT | Medium | Supports L6 (base floor colors steps) with a number; words only, no curve. |
| Layered floors | "a carpet is always laid on another surface. There is always tile, concrete, hardwood, or hollow wood underneath." | FF-CUE | Medium | Surface variant `carpetOver` draws the under-layer in section. |
| Surfaces available on one stage | "carpet, concrete, grass, tile, metal, creaky wood floor, laminate, wood plank, dirt, rock, sand, snow, and a low water pit"; "over 50 pairs of shoes" | NF-FOLEY | Medium | Variant list (pick 4–6). |
| Footstep mic distance (A) | "between three and six feet away on a mic stand, in front and/or to the side, but only about 15 degrees or so" (John Roesch's team, Warner Bros.) | MIX-2005 | Medium | 914.4–1828.8 mm (conv.). "15 degrees" reference unstated — read as 15° off the walker's front line in plan (**interpretation**, drawing default). |
| Footstep mic distance (B) | both shotguns at "1.5-2 meters" on concrete steps, hardwood steps, dry leaves, gravel; one mic needed "half a meter closer" for articulation | FF-KMR | Medium | 1500–2000 mm; the closer note → 1000–1500 mm. |
| Footstep mic distance (C) | "From a distance of 1.5 meters … the footsteps recorded for the middle shots … sounded very good in solo"; "Leaving the microphone at a distance of 3.5 meters from the Foley artist" worked in the mix (gravel, a fight in a hangar) | FF-HP | Medium | One scene, not a rule (lesson L23 says so). |
| Tight footsteps | "With footsteps, I like to have it real tight. I only want to capture the sound of the steps and not the sound of my pants." ; "we back the mic up a little bit or change to a different mic with a wider pickup pattern" | S-FOLEY | Medium | No number → CLOSE zone distance is the lesson's 0.8–1.0 m trial (UNSOURCED) or a drawing default (owner decision O-1). |
| Mic types used for steps | "cardioid or hypercardioid … we tend to use shotgun microphones" (Hensley); "Our go-to is a Schoeps CMIT5U and Neumann TLM 103" (NoiseFloor: a short shotgun and a large-diaphragm condenser) | S-FOLEY, NF-FOLEY | Medium | Generic types only in the app. |
| Close + room on a Foley stage | Warner: "KMR 82 shotguns" close, "a Neumann U67 functioning as room microphone"; Fantasy/Skywalker "two mics: one close and one far away" | MIX-2005 | Medium | TWO MICS setup: close shotgun + farther room condenser. Room mic distance UNKNOWN → drawing default. |

## b. Lesson claims checked (F01)

| Lesson claim (line) | Verdict | Evidence / correction |
|---|---|---|
| L5 spot character and surface, transitions, layered floors [1] | **CONFIRMED** | FF-CUE (quote §a). |
| L5 NoiseFloor chooses shoes and surfaces [2] | **CONFIRMED** | NF-FOLEY (shoes, surfaces, four pits). |
| L6 base-floor construction colors steps [3] | **CONFIRMED** (+ number) | FF-PIT 80–200 Hz from leveling layers. |
| L9 Hensley "tight footstep pickup to avoid pants noise, then backing off or widening" [4] | **CONFIRMED** | S-FOLEY quotes. Note: L9 calls him a "Foley mixer"; the article presents him as a Foley artist — wording only, keep generic in-app. |
| L9 NoiseFloor shotgun + LDC [2] | **CONFIRMED** (interpretation: model names = short shotgun + LDC) | NF-FOLEY. |
| L9 Foley First two shotguns on multiple surfaces [5] | **CONFIRMED** | FF-KMR. |
| L10 shotgun off-axis coloration, frequency-dependent [6] | **CONFIRMED** (qualitative) | DPA-TUBE: "the off-axis response often is very nonlinear …"; SCH-SHOTGUN (stronger, §c). |
| L10 shotgun "does not remove reverberation" | **CONFIRMED** | SCH-SHOTGUN: "In a diffuse sound field … they are less effective than one might wish". |
| L12–L18 "Classroom trial … roughly 0.8–1.0 m … This range is an exercise design, not a published rule" | **UNSOURCED** (lesson's own trial, honestly labelled) | Keep internally as TRIAL. Add MIX-2005 0.9–1.8 m as the sourced ONE MIC row (correction F01-C2). App voice: one style, "Recommended starting point". Owner decision O-1. |
| L20 Foley First 1.5–2 m, concrete/hardwood/leaves/gravel [5] | **CONFIRMED** | FF-KMR; add the "half a meter closer" note. |
| L23 3.5 m worked after 1.5 m did not, one gravel fight scene [7] | **CONFIRMED** | FF-HP (hangar fight scene). |
| L26–27 near + room, separate channels, mono check [8] | **CONFIRMED** in practice (MIX-2005, ASE-CROSS, HECKER); DPA-POL supports polarity ≠ delay | DPA-POL: "a phase shift requires a time shift, i.e., a delay, which is not involved in swopping polarity". |
| L59/L65 live: gain before feedback, open mics, no deliberate feedback [9] | **CONFIRMED** | S-LIVE (Batch 5); S-AUTOMIX. |
| L64 headphones favored one perspective, picture mix another [7] | **CONFIRMED** | FF-HP. |
| L67 polarity a diagnostic, not a cure for time differences [8] | **CONFIRMED** | DPA-POL. |
| L69 safety controls (walk the cue, secure surface, stands out of paths, stop before moving hardware, no risky jumps) | PRACTICE (lesson's own; sound) | Keep **exact** in plain words. |
| L70 gain on loudest step; downstream fader cannot repair clipping; mute before phantom changes [9, 10] | CONFIRMED (general; S-LIVE) | Keep. |
| Plan item "control floor and stand vibration" — shock mount not mentioned in F01 | **GAP** | Add one line (correction F01-C5): a shock mount and a stable stand keep floor and stand thumps out (same claim as F02 L28; Rycote page not re-read today, general practice). |

## c. The shotgun model (shared by F01–F09; quoted here once)
SCH-SHOTGUN (High): "The exact degree of this cancellation depends greatly on the wavelength of the sound. For
wavelengths longer than the tube — at low and midrange frequencies — the tube has little effect except,
unfortunately, to distance the capsule further from the sound source … Thus throughout much of the audio range, a
shotgun microphone has no greater rejection of off-axis sound than the capsule on which it is based. At higher
frequencies the pickup pattern becomes narrower, but with great variations in response for different angles and
frequencies." And: "Conditions in which there is little reflected sound energy (e.g. outdoor recording) … are thus
best for shotgun microphones. In a diffuse sound field (i.e. at significant distances indoors) they are less
effective than one might wish". And: "A small directional microphone with smooth off-axis response … can often be
placed closer to a sound source than a shotgun microphone".
DPA-TUBE (High): "Increased interference tube length will result in increased attenuation at lower frequencies";
"when a shotgun microphone is rotated, the surroundings sound different due to shifts in sound color."
**Model for the app (DERIVED + ILLUSTRATIVE):** below f_t = c / L_tube the pattern is the base capsule's
(supercardioid, `polar.ts`); above f_t the lobe narrows (drawn, never a number). L_tube is UNKNOWN for a generic
mic → drawing default 200 mm (inside a common short shotgun's Ø 19 × 250 mm body, SEN-416, Low) → f_t ≈ 1.7 kHz
(343.21/0.2, DERIVED from the default; shown only as "above roughly the upper mids"). The capsule sits BEHIND the
tube (SCH-SHOTGUN) — the distance readout measures to the capsule, not to the grille (`mic.ref` at the tube's rear).

## d. Disagreements
- **D-F01-DIST**: Roesch 0.91–1.83 m (MIX-2005) vs Foley First 1.5–2 m (FF-KMR) vs one-scene 3.5 m (FF-HP) vs the
  lesson's 0.8–1.0 m trial vs Hensley "real tight" (no number). Not contradictions: different rooms and goals.
  Shown as separate named starting points, never averaged.
- **D-F01-PAT**: Hensley prefers "cardioid or hypercardioid … shotgun"; SCHOEPS suggests a small supercardioid often
  equals or beats a shotgun indoors. The lesson's "compare both" stands.

## e. Corrections for F01 (builder logs each in CORRECTIONS_LOG.md)
- **F01-C1** Institutional wording: header "Pro Audio Training Academy" (strip), "Students evaluate" (L3),
  "classroom position/trial/comparison" (L12, L17, L26, L126), "Do not intentionally make feedback occur as a
  classroom demonstration" (L65 → "as a demonstration"), "Manage reproduced sound level for both performers and
  students" (L70 → "and everyone in the room"), "Student observation sheet", "Pass criterion: the student" → "you".
- **F01-C2** Add MIX-2005 3–6 ft "in front and/or to the side … about 15 degrees" as the sourced footstep start;
  the 0.8–1.0 m trial stays as the CLOSE start only if the owner approves (O-1).
- **F01-C3** L20 add FF-KMR's own note that one mic was moved half a metre closer for articulation.
- **F01-C4** Ref [4] locale nl-NL → en-US (record only); ref [5] title names two brands (record only).
- **F01-C5** Add the shock-mount / stand-isolation line (plan item missing in F01).
- **F01-C6** L139 cross-links: ".docx" names (Djembe, Percussion Ensembles) and "B04 … later lessons" → in-app
  links to M05 Djembe / E12 Percussion Ensembles; drop B04 until Lab 7 ships (no future promises).
- **F01-C7** Header lab name: F01 says "Foley Field and Scientific Lab", F02–F08 "Foley Field and Acoustical Lab" —
  app uses the registry name "Foley, Field & Scientific".
