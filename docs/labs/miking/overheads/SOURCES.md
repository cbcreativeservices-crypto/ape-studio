# M09 Drum Overheads (incl. Glyn Johns): SOURCES (technical reference)

Lesson: `docs/labs/miking/source_text/Drum-Overheads-Miking-Technique-Research.txt`.
Rules and the owner's 2026-10-04 ruling: as in `snare/SOURCES.md`. Checked 2026-10-04 by Claude.

## Source keys

| Key | Source | URL | Status 2026-10-04 |
|---|---|---|---|
| S-OH-MM | Shure, Mike Major, "Using Stereo Overhead Miking Techniques to Supplement a Multi-Miked Drum Setup", "November 22, 2013" (lesson [1]) | https://www.shure.com/en-US/insights/using-stereo-overhead-miking-techniques-to-supplement-a-multi-miked-drum-setup | 200 |
| DPA-KIT | DPA, "How to mic a drum kit" (lesson [2]) | see `snare/SOURCES.md` | 200 |
| RODE-1 | RØDE, "Miking up a Drum Kit Part 1" (lesson [3]) | https://rode.com/en-gb/about/news-info/miking-up-a-drum-kit-part-1 | 200; no numbers, no date |
| S-LIVE | Shure live-sound booklet (lessons [4], [9]) | see `kick/SOURCES.md` | 200 |
| DPA-STEREO | DPA, Eddy Bøgh Brixen, "Stereo recording techniques and setups" (lesson [5]) | https://www.dpamicrophones.com/mic-university/audio-production/stereo-recording-techniques-and-setups/ | 200, no date |
| S-5TECH | Shure, "Five Techniques for Stereo Miking Drums", "September 25, 2026", no byline (lesson [6]) | https://www.shure.com/en-US/insights/five-techniques-for-stereo-miking-drums | 200 |
| S-COMMON | Shure, "Common Techniques for Stereo Miking", "October 12, 2007; updated March 23, 2017" (lesson [7]) | https://www.shure.com/en-US/insights/common-techniques-for-stereo-miking | 200 |
| S-REC | Shure recording booklet | see `snare/SOURCES.md` | 200 (stereo section read) |
| S-REC1 | Shure Recording Drums Part 1 | see `snare/SOURCES.md` | 200 |
| RM-GJ | Paul J. Stamler, "Recording Drums—Then and Now", *Recording* magazine (lesson [12]) | https://www.recordingmag.com/resources/recording-info/mics-miking/recording-drums-then-and-now/ | 200; no date on page |
| MT-GJ | John Pickford, "Technique of the Week: Glyn Johns Method", MusicTech, "June 27, 2018" (lesson [13]) | https://musictech.com/tutorials/technique-of-the-week-glyn-johns-method/ | 200 |
| BH-GJ | B&H Explora, "Recording a Rock Band: An In-Depth Guide" (lesson [14]) | https://www.bhphotovideo.com/explora/pro-audio/buying-guide/recording-a-rock-band-an-in-depth-guide | **UNREACHABLE: HTTP 403** to WebFetch and curl (bot protection). Not used. |
| UA-MS | Universal Audio, Daniel Keller, "Mid/Side Mic Recording Basics" (M10 lesson [6]) | https://www.uaudio.com/blogs/ua/mid-side-mic-recording | 200 |
| AX-DPE8 | Audix DP Elite 8 sheet (archived), SCX1C overhead tip | see `snare/SOURCES.md` | archived copy read |

## a. Stereo-pair geometry as published

| Fact | Value | Source | Checked | Confidence | Notes |
|---|---|---|---|---|---|
| X/Y angle (common) | "In the most commonly used XY setup, a pair of first-order cardioid microphones is arranged at a 90° angle (±45°)." | DPA-STEREO | 2026-10-04 | High | |
| X/Y range (Shure) | "two cardioid microphones … placed either as close as possible (coincident) or within 12 inches of each other (near-coincident) and facing each other at an angle ranging from 90 - 135 degrees" | S-REC stereo section | 2026-10-04 | High | Shure uses "X-Y" for both coincident and near-coincident (relevant to the Leslie lesson's "near-coincident XY", see `speaker_leslie/SOURCES.md`). |
| X/Y live example | "Microphone diaphragms close together and aligned vertically; microphones angled apart. Example: 135° angling (X-Y)." | S-LIVE stereo section (text extraction prints "1350") | 2026-10-04 | High | |
| X/Y over a kit | "I recommend mounting the XY array directly above the snare drum, to ensure that the snare is centered in the stereo image." "If the mics are very high, the capsules will point straight over the sides of the of the kit … Lowering the microphones, or using an angle less than 90o can result in a more direct sound" | S-5TECH | 2026-10-04 | High | Shure's typo "of the of the" kept. |
| X/Y upper limit as width control | "This does not work well with an X/Y pair if you exceed 135 degrees between the capsules." | S-OH-MM | 2026-10-04 | High | |
| X/Y capsules must not touch | "Avoid the microphones touching each other as this might cause mechanical noise." | DPA-STEREO | 2026-10-04 | High | Lesson L10 CONFIRMED. |
| ORTF (Shure, drums) | "with capsules 17cm apart, at 110o" | S-5TECH | 2026-10-04 | High | 110° included angle (±55°). |
| ORTF (DPA) | "This setup uses two first-order cardioid microphones spaced 17 cm (7 in) and angled ±110°." | DPA-STEREO | 2026-10-04 | High (that DPA says it) | **DPA's "±110°" is an error on DPA's page** if read literally (±110° = 220° included). The ORTF standard and Shure both give 110° included. D-O1. |
| ORTF (Shure, other pages) | "110-degree angle between the microphones with the microphone heads positioned six inches apart" (S-COMMON); "Microphones angled and spaced apart 6 to 10 inches between grilles. Examples: 110° angled, 7-inch spacing" (S-LIVE) | S-COMMON, S-LIVE | 2026-10-04 | High | 6 in = 152.4 mm; 7 in = 177.8 mm (conv.) vs 17 cm. D-O2. |
| NOS, DIN | "NOS … spaced 30 cm (11.8 in) apart and angled at 90°"; "DIN … spaced 20 cm (7.8 in) apart and angled at 90°" | DPA-STEREO | 2026-10-04 | High | Not in the lesson; for the stereo tool if wanted. |
| A/B spacing example | "±70° recording angle … spacing … should be 40 cm (16 in)" (omnis, from DPA's curves) | DPA-STEREO | 2026-10-04 | High | A recording-angle chart, not a drum recipe. |
| A/B ensemble spacing | "spaced 3 - 10 feet apart" (S-REC); "Example: Microphones 3 to 10 feet apart" (S-LIVE); "3 to 10 feet apart" (S-COMMON) | Shure | 2026-10-04 | High | Ensemble figures, not drum-kit figures. |
| A/B mono | "AB is generally not suitable for mono as the summed signal may suffer from comb filtering." | DPA-STEREO | 2026-10-04 | High | Lesson L65/L117 CONFIRMED. |
| A/B over drums | "AB arrays are susceptible to comb filtering. The risk can be mitigated somewhat by keeping the two microphone capsules equidistant from the center of the snare drum." | S-5TECH | 2026-10-04 | High | |
| Spaced overheads, Audix | "The most common positioning concept is to keep the snare as the focal point and move the mics into various left and right positions equal distance from the snare; 4 feet is a good starting point. For best results, keep the mics in a vertical position" | AX-DPE8 (SCX1C tip) | 2026-10-04 | High (archived maker sheet) | 4 ft = 1219.2 mm (conv.). Not in the lesson; a usable sourced spaced-pair start. |
| Equal snare distance (DPA) | "secure that the distance from the snare to each microphone is the same" | DPA-KIT | 2026-10-04 | High | |
| Equal snare distance (Shure) | "measure the distances from the snare to each overhead mic to ensure that the time arrival of the snare is the same in each overhead mic" | S-OH-MM | 2026-10-04 | High | |
| Unequal heights to compensate | "you can place the two overhead mics at two different heights, as few as 2–3 inches or up to 8–10 inches if necessary" | S-OH-MM | 2026-10-04 | High | 2–3 in = 50.8–76.2 mm; 8–10 in = 203.2–254.0 mm (conv.). |
| Audio centre line | "I draw an imaginary line through the kick drum and on through the center of the snare drum" | S-OH-MM | 2026-10-04 | High | |
| Front/back | moving the pair "toward the front of the kit will push them closer to the cymbals and the rack tom. Pulling them back will pull them closer to the snare, floor tom, and hi-hat." | S-OH-MM | 2026-10-04 | High | |
| Overhead height above the floor | "You can typically achieve a balanced sound of the kit with overheads placed between two and three meters above floor level, and either behind or in front of the kit." "In a close-mic multichannel drum recording application, you'll likely find that the overheads work better closer to the kit" | S-REC1 | 2026-10-04 | High | 2000–3000 mm above the floor (minimal approach). Not in the lesson. |
| Mono overhead, live | "One microphone over center of drum set, about 1 foot above drummer's head (Position A); or use two spaced or crossed microphones for stereo (Positions A or B)." Comments: "Picks up ambience and leakage. For cymbal pickup only, roll off low frequencies." | S-LIVE item 1 | 2026-10-04 | High | 1 ft = 304.8 mm (conv.). |
| Live stereo only for stereo systems | "For sound reinforcement, stereo mic techniques are only warranted for a stereo sound system" | S-LIVE stereo section | 2026-10-04 | High | Lesson L76 CONFIRMED. |
| Height vs balance (RØDE) | "Too low and the kick will overpower the rest of the drums, too high and the cymbals will dominate the mix." | RODE-1 | 2026-10-04 | High | No number. |
| M/S decode | "split the Side signal into two separate channels … reversing the phase of one of them. Pan one side hard left, the other hard right"; "the two Side channels cancel each other out when you switch the mix to mono, only the center Mid channel remains" | UA-MS | 2026-10-04 | High | S-COMMON gives no formula ("a small matrix circuit"). The lesson's L = M+S, R = M−S is the standard decode, consistent with UA-MS. |
| M/S mono (Shure) | "The M-S technique, like XY, ensures mono compatibility." | S-5TECH | 2026-10-04 | High | |

## b. Recorderman

| Fact | Value | Source | Checked | Confidence |
|---|---|---|---|---|
| Mic 1 | "One is suspended 32'' above the center of the snare drum, pointing straight down." | S-5TECH | 2026-10-04 | High |
| Mic 2 | "The other is positioned near the drummer's right shoulder, pointing directly at the snare drum from 32" away." … "at a point where it, too, is 32'' from the center of the snare, and equally distant from the kick" | S-5TECH | 2026-10-04 | High |
| Kick condition | "This technique requires that the kick drum is also equidistant from both microphones." | S-5TECH | 2026-10-04 | High |
| Glyn Johns relation | "conceptually similar to the overhead configuration of Glyn Johns' more-famous approach" | S-5TECH | 2026-10-04 | High |

**Survey flag answered:** the "32-inch dimension" is the distance from **the centre of the snare
drum** to **each** microphone (812.8 mm, conv.). The point on the kick used for "equally distant"
is not stated (UNKNOWN).

## c. Glyn Johns

| Fact | Value | Source | Checked | Confidence |
|---|---|---|---|---|
| Overhead 1 | "The first overhead mic, a condenser, goes directly over the snare drum, at a height of about 40", and pointed at a particular spot on the drum. (You choose the spot that sounds best.)" "Measure the distance and write it down" "It gets panned to about the 1:30 position." | RM-GJ | 2026-10-04 | High |
| Overhead 2 (side) | "The second overhead, the same model condenser as the first one, is placed to the left of the snare drum (audience view), over the floor tom. … it should be the same distance from the target spot on the snare drum as the first overhead … Again, Johns likes this distance to be 40", but the critical thing is that the distance from the drum should be identical to that of the first mic. This mic gets panned hard left." | RM-GJ | 2026-10-04 | High |
| Spots | "Johns adds spot mics on the kick and snare" | RM-GJ | 2026-10-04 | High |
| Mic count (MusicTech) | "a simple drum kit mic'ing technique using 3 or 4 mics"; "A third mic is used on the bass drum and sometimes a fourth is used as a spot mic on the snare drum." | MT-GJ | 2026-10-04 | High |
| Overhead 1 (MusicTech) | "The first mic should be placed around 4 feet (122cm) above the kit, pointing to the centre of the snare drum." | MT-GJ | 2026-10-04 | High |
| Side mic (MusicTech) | "The second mic is placed adjacent to the floor tom tom, around 6 inches (15cm) above its rim, firing across the kit towards the hi-hat." "These two mics should be equidistant from the centre of the snare drum and panned." | MT-GJ | 2026-10-04 | High |
| Panning variation (MusicTech) | "Some engineers measure the distance precisely and pan the mics extreme left and right, while Johns himself used a more instinctive approach with a narrower stereo spread." | MT-GJ | 2026-10-04 | High |

"Audience view left" = the drummer's right = +z in the kit frame, where the floor tom is.

## d. Re-verification of the lesson's numbers and claims

| Lesson claim (line) | Verdict | Source's exact words |
|---|---|---|
| L17: Shure live "about 1 ft above the drummer's head" | **CONFIRMED** | S-LIVE item 1 (above). |
| L20: X/Y "A 90° cardioid arrangement is one common example" | **CONFIRMED** | DPA-STEREO "90° angle (±45°)". |
| L23: ORTF "about 17 cm apart and 110° apart" | **CONFIRMED** | S-5TECH "17cm apart, at 110°". DPA's "±110°" is an apparent error (D-O1); Shure's other pages say 6 in / 7 in (D-O2). |
| L35–36: Recorderman "its cited 32-inch dimension" | **CONFIRMED and now defined** | see §b. The lesson should say "32 in (about 81 cm) from the centre of the snare to each mic". |
| L45: Glyn Johns "Roughly 40 in (about 1 m) from the snare" | **CONFIRMED with detail** | RM-GJ: "directly over the snare drum, at a height of about 40"" and the side mic "Johns likes this distance to be 40"". 40 in = 1016 mm (conv.). MusicTech gives "around 4 feet (122cm) above the kit" (D-O3). |
| L48: side mic "about 6 in (15 cm) above the floor-tom rim" | **CONFIRMED** | MT-GJ (above). MusicTech aims it "towards the hi-hat"; RM-GJ places it "over the floor tom" at the same 40 in from the snare spot (D-O4). |
| L49: equal acoustic-centre distance to the same snare reference | **CONFIRMED** | RM-GJ, MT-GJ (both say equal distance; neither says "acoustic centre": that is the lesson's refinement). |
| L51: "Four total mics is a common documented form; a three-mic variant omits the close snare" | **CONFIRMED** | MT-GJ (3 or 4); RM-GJ (kick and snare spots → 4). |
| L54: "Some accounts pan the overhead partway to one side and the side mic wider" | **CONFIRMED** | RM-GJ: OH "about the 1:30 position", side "hard left". |
| L59: Shure: a very high X/Y angle can aim past the kit | **CONFIRMED** | S-5TECH (above). |
| L60: front-to-back balance | **CONFIRMED** | S-OH-MM (above). |
| L62: audio centre through kick and snare | **CONFIRMED** | S-OH-MM. |
| L64: DPA equal snare distance; Shure the same | **CONFIRMED** | DPA-KIT, S-OH-MM, S-5TECH. |
| L65: DPA A/B comb filtering, caution | **CONFIRMED** | DPA-STEREO. |
| L117: Shure "describes X/Y and Mid-Side mono compatibility as guaranteed" | **DIFFERENT (wording)** | Shure writes "avoiding any risk of comb-filtering" (X/Y) and "ensures mono compatibility" (M-S). Not the word "guaranteed". Meaning is close; the lesson should quote "ensures". |
| L10: X/Y not touching (DPA) | **CONFIRMED** | DPA-STEREO. |
| L8: Shure live cymbal-oriented overhead with low-frequency roll-off | **CONFIRMED** | "For cymbal pickup only, roll off low frequencies." (S-LIVE) |
| L3/L7: RØDE describes placement changes favouring kit components | **CONFIRMED (no numbers)** | RODE-1 (above). |
| L11: NIOSH; ZG01 | **CONFIRMED** | kick/SOURCES.md. |
| L112: B&H [14] | **UNREACHABLE** | 403. The two other Glyn Johns sources carry every number the lesson uses. |

## Disagreements log

- **D-O1, ORTF angle notation.** Shure "at 110°"; DPA "angled ±110°" (literally 220°). Draw 110°
  included.
- **D-O2, ORTF spacing.** 17 cm (Shure drums article, DPA) vs "six inches" (Shure 2007/2017) vs
  "7-inch spacing" (Shure live booklet). Draw 170 mm.
- **D-O3, Glyn Johns overhead height.** "about 40"" over the snare (RM-GJ) vs "around 4 feet (122cm)
  above the kit" (MT-GJ).
- **D-O4, Glyn Johns side mic.** RM-GJ: "over the floor tom", 40 in from the snare spot. MT-GJ:
  "adjacent to the floor tom tom, around 6 inches (15cm) above its rim", aimed at the hi-hat. With
  the equal-distance rule both describe a mic just beyond the floor tom (DERIVED in the geometry file).
- **D-O5, panning.** RM-GJ 1:30 + hard left; MT-GJ "extreme left and right" or Johns' "narrower".

## Simplifications register

- The drummer's head and shoulder are drawing defaults (no source gives a body envelope).
- Capsules are points at `mic.ref`; real acoustic centres are not the grille front.
- Snare "target spot" = the snare batter centre by default (RM-GJ lets the engineer choose).
