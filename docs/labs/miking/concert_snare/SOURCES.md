# M07b Concert Snare Drum: SOURCES (technical reference)

Lesson: `source_text/Concert-Snare-Miking-Technique-Research.txt`. Rules: `snare/SOURCES.md`. Checked 2026-10-04.

## Source keys

| Key | Source | URL | Status |
|---|---|---|---|
| YMH-CPCAT | Yamaha concert percussion catalogue (45706), "Concert Snare Drums" | https://usa.yamaha.com/files/download/other_assets/6/973356/45706_concertpercussion_cat.pdf | 200, read |
| S-SM57-ART | Shure SM57 snare article (lesson [5], en-GB host) | see `snare/SOURCES.md` | 200 |
| S-SM57-UG | Shure SM57 guide (lesson [6] source 1) | see `snare/SOURCES.md` | 200 |
| S-REC-OLD | Shure recording guide on content-files (lesson [6] source 2) | https://content-files.shure.com/Pubs/microphone-techniques-for-studio-recording/microphonetechniques-recording-guide.pdf | 200 (status; the damfiles copy S-REC was read) |
| MIX-POPS | Mix, "Sound Reinforcement for the Boston Pops" (lesson [3]) | https://www.mixonline.com/live-sound/sound-reinforcement-boston-pops-miking-orchestra-368908 | 200 (content not re-read) |
| YMH-HUB-SN | Yamaha Hub snare selection / rolls articles (lesson [1], [2]) | URLs in the lesson | 200 (content not re-read) |

## Facts and verification

| Fact / claim | Value / verdict | Source's exact words | Confidence |
|---|---|---|---|
| Concert snare sizes | 14 × 6-1/2 in (CSM 1465, CSS 1465); 14 × 5-1/2 in (CSC 1455, CSS 1455); 13 × 4-1/2 in (CSB 1345) | "Size: 14"6 1/2"" etc. (YMH-CPCAT p.16–17, × lost in extraction) | High |
| Lugs | "the 14-inch models feature a 10-lug design for precise tuning control" | YMH-CPCAT | High |
| Snares | maple/copper/birch models: "0.6 mm brass cable; 14 strand"; steel models: "Hard, high-carbon steel; 20 strand" | YMH-CPCAT | High |
| Rims | "2.3 mm steel, triple-flange" (CSM, CSC); "1.6 mm steel, triple-flange" (CSS, CSB) | YMH-CPCAT | High |
| Stand | "SS745 Concert height stand with single braced legs" | YMH-CPCAT | High (height range not given → UNKNOWN) |
| L24: SM57 "roughly 2.5–7.5 cm (1–3 in) above the rim" | **CONFIRMED** (kit-snare figure) | snare/SOURCES.md | High |
| L24: Shure tutorial "about 10 cm (4 in)" | **DIFFERENT (detail)** | Shure: "a good 4 inches away from the snare" (no metric value printed by Shure; 4 in = 10.16 cm). "a good" ≈ at least. | High |
| Audit: Shure says top and bottom "invariably out of phase" | **CONFIRMED** | "The phase relationship between top and bottom is invariably out of phase and inverting this on one channel will usually produce a better result" — the same sentence the kit-snare lesson quotes as "usually". Both lessons are right; quote the full sentence in both. | High |
| No concert-specific mic number exists | correct | — | — |

## Builder additions (2026-10-05, branch miking-w4: the M07b build)

| Key | Source | URL | Status |
|---|---|---|---|
| LESSON-CSN | The owner's lesson text itself (`source_text/Concert-Snare-Miking-Technique-Research.txt`), for the broad spot ("above and to one side … aiming across the batter head") and the lab's words | (in the repo) | the lesson's own words |

- Simplifications register (M07b): the close zones borrow the KIT-snare figures (2.5–7.5 cm above the
  rim; "a good 4 inches" read as 101.6–160 mm above the rim); the bottom zone's 3–8 cm is the batch
  research's drawing default for M02; batter height 800 mm, the stand, the sticks' reach (450 mm on the
  player's side) and the player box are drawing defaults / ILLUSTRATIVE; shell thickness, hoop height,
  lug size, rod phase and the snare set's size are drawing defaults (`shared/drums/concertSpec.ts`).
