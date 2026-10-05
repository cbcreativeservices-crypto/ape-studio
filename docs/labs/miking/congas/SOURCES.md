# M04a Congas: SOURCES (technical reference)

Lesson: `source_text/Congas-Miking-Technique-Research.txt`. Rules and the owner's 2026-10-04 ruling:
as in `snare/SOURCES.md`. Checked 2026-10-04 by Claude (batch 1, lighter pass after the kit lessons).

## Source keys

| Key | Source | URL | Status 2026-10-04 |
|---|---|---|---|
| S-DRUMS | Shure, *Microphone Techniques for Drums* (lesson [1]) | https://content-files.shure.com/Pubs/microphone-techniques-for-drums/microphone_techniques_for_drums_english.pdf | 200, read |
| S-REC / S-LIVE | Shure booklets (same table) | see `snare/SOURCES.md` | 200 |
| RM-CONGA | Eric Ferguson, "Our Friend the Conga", *Recording* (lesson [2]) | https://www.recordingmag.com/resources/recording-info/mics-miking/our-friend-the-conga/ | 200; no date on page |
| DPA-JB | DPA, "The Jonas Brothers Are Burnin' Up with DPA", "October 29, 2021" | https://www.dpamicrophones.com/news/2021/the-jonas-brothers-are-burnin-up-with-dpa/ | 200 (lesson [3] cites the svconline copy, also 200) |
| SOS-LATIN | Dan Daley, "Recording Latin Percussion", *Sound On Sound*, "December 2006" | https://www.soundonsound.com/techniques/recording-latin-percussion | 200 (cited by the Timbales lesson; extra conga facts) |
| LP-CLASSIC | LP Classic 11″ Quinto (LP522X), 11-3/4″ Conga (LP559X), 12-1/2″ Tumba (LP552X) product pages | https://www.lpmusic.com/products/lp522x-classic-11-quinto/ (+ lp559x-classic-11-3-4-conga, lp552x-classic-12-1-2-tumba) | 200 |

## Facts and verification

| Fact / lesson claim | Value or verdict | Source's exact words | Confidence |
|---|---|---|---|
| Conga sizes | quinto 11 in (279.4 mm), conga 11-3/4 in (298.45 mm), tumba 12-1/2 in (317.5 mm) (conv.) | product titles "LP Classic 11″ Quinto", "LP Classic 11-3/4″ Conga", "LP Classic 12-1/2″ Tumba" | High |
| Conga height | 30 in = 762.0 mm (conv.) | "These drums stand 30″ tall" (all three pages) | High |
| Names | quinto (smallest), conga (middle), tumba (largest) | "the largest drum is called _tumba_, the middle _conga_, and the smallest _quinto_" (RM-CONGA) | High |
| L18/L93: Shure one mic aimed down between a pair | **CONFIRMED** | "One microphone aiming down between pair of drums, just above top heads" ("Provides full sound with good attack") (S-DRUMS, S-REC, S-LIVE "Timbales, congas, bongos") | High |
| L18: Ferguson "roughly 6 in–2 ft (15–60 cm) from each head" | **CONFIRMED (conversion rounded)** | "anywhere from 6 inches to two feet from the head of the drum" (RM-CONGA). 6 in–2 ft = 152.4–609.6 mm. | High |
| Ferguson stereo / height | additional | "I typically use a matched pair of microphones to record a two- or three-drum setup"; "I usually move the mic a couple feet into the air, well outside the near field" | High |
| Ferguson bottom hole | additional | "it can be fun to mike the bottom sound hole itself" | High |
| L-: DPA tour 4099 per conga | **CONFIRMED** | "we have 4099s on high and low congas, the bongos, two toms and two timbales" (DPA-JB, Jon Kooren) | High |
| Milan conga mics (extra) | additional | "at the top of the drum, pointing about 45 degrees down and a foot or two away from the player" (SOS-LATIN) | High |
| Garza bottoms on stands (extra) | additional | "if they're raised on stands, using an X-Y pair of Neumann U87s in front of the congas and angled towards the rims about a foot away, with a third U87 about two metres in front" (SOS-LATIN) | High |
| Curriculum line: Glyn Johns "taught in Ensembles and Voice" | **WRONG** (cross-link) | M09 Drum Overheads teaches it (plan, M09, M11). | — |
| Stale "ride cymbal research draft is deferred" note | **Stale** | remove | — |
| Shell construction, head/rim hardware, stand heights | **UNKNOWN** | — | — |

## Disagreements / notes
- 15–60 cm in the lesson vs 152.4–609.6 mm exact (rounding only).
- DPA case cited from svconline (Congas) and from dpamicrophones.com (Bongos, Timbales, Tambourine): same
  text; use the DPA host.

## Builder pass (2026-10-05, hand-drum builder, worktree miking-w3)

Added keys and re-reads used by `src/screens/lab/miking/lessons/m04aCongas/`.

| Key | Source | URL | Status 2026-10-05 |
|---|---|---|---|
| WP-CONGA | Wikipedia, "Conga" (playing technique) | https://en.wikipedia.org/wiki/Conga | 200, read |
| LESSON | The owner's lesson text, `source_text/Congas-Miking-Technique-Research.txt` | (in the repo) | read |
| WP-MIC | see `SOURCES_SHARED.md` | — | — |
| MKT-4099, S-SM57-UG, AX-D2, AX-SCX1 | the hand-drum mic family, `SOURCES_SHARED.md` §6 | — | — |

| Fact | Value | Source's exact words | Confidence |
|---|---|---|---|
| Open tone | four fingers near the rim | "played with the four fingers near the rim of the head, producing a clear resonant sound" (WP-CONGA) | High |
| Muffled tone | fingers held against the head | "made by striking the drum with the four fingers, but holding the fingers against the head to muffle the tone" (WP-CONGA) | High |
| Bass tone | full palm, slightly cupped, off centre | "played with the full palm, in a slightly cupped position, somewhat off center on the head" (WP-CONGA) | High |
| Slap | no position given | "the most difficult technique, producing a loud clear 'popping' sound" (WP-CONGA) | High |
| Seated or standing | both | "The drums may be played while seated. Alternatively, the drums may be mounted on a rack or stand to permit the player to play while standing." (WP-CONGA) | High |
| LP Classic re-read | shell, rim, rods, heads | "Kiln-dried Siam Oak shells"; "Comfort Curve II rims"; "5/16″ Tension rods"; "Natural rawhide heads"; the drums have "shell protectors" (LP-CLASSIC, tumba page) | High |
| Lug count | NOT STATED | (LP-CLASSIC pages) | — | drawn as a drawing default (6), never stated |

Strike POSITIONS drawn on HOW IT SOUNDS (0.85 R near the rim, 0.3 R off centre) are drawing
positions for the sourced descriptions; the simplified head ignores the hand's contact area and
time (said on screen). Simplifications register: the conga's straight taper (0.8 × head at the
bottom), the side view hiding the conga behind the tumba, the raised stands, the hands and player
envelopes — all drawing defaults or ILLUSTRATIVE (`CORRECTIONS_LOG.md` CG-01 … CG-07).
