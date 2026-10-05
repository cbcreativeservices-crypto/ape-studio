# M05 Djembe: SOURCES (technical reference)

Lesson: `source_text/Djembe-Miking-Technique-Research.txt`. Rules: `snare/SOURCES.md`. Checked 2026-10-04.

## Source keys

| Key | Source | URL | Status |
|---|---|---|---|
| MEINL-HDJ500 | Meinl Headliner djembe HDJ500NT (lesson [1]) | https://meinlpercussion.com/en/products/hdj500nt-m7621.html | 200 |
| S-DUVEL | Shure, Davida Rochman, "Miking World Instruments with Alexander Duvel", "June 15, 2015" (lesson [2]; Tabla lesson [4]) | https://www.shure.com/en-EU/insights/miking-world-instruments-with-alexander-duvel | 200 |
| COPPINGER | Randy Coppinger, "Djembe Microphone Comparison", "January 15, 2013" (lesson [3]) | https://randycoppinger.com/2013/01/15/djembe-mic-comparison/ | 200 |
| HUFF, X8 | Chris Huff (behindthemixer), X8 Drums (lesson [4], [5]) | URLs in the lesson | 200 (status only; content not re-read) |
| AX-D4 | Audix D4 sheet (lesson [7]) | see `toms/SOURCES.md` | 200 |

## Facts and verification

| Fact / claim | Value / verdict | Source's exact words | Confidence |
|---|---|---|---|
| Head size (Meinl HDJ500NT) | 12.5 in = 317.5 mm (conv.) | "Head Diameter: 12.5"" (page as fetched); goat head; "Pre-stretched nylon PP ropes" with "MEINL style tuning brackets"; "8 mm strong tuning lugs" | Medium (fetched summary; rope + bracket hybrid wording) |
| Height, waist, bottom-opening Ø | **UNKNOWN** | not on the page | — |
| Sound vocabulary | "classic djembe sounds reaching from fat basses to rich open tones and cutting slaps" | MEINL-HDJ500 | High |
| L21: Duvel KSM137 "about 2–4 in (5–10 cm) above the head at a 40–60° angle" | **CONFIRMED; angle reference not stated** | "one 2–4" above the drum head at a 40–60 degree angle to capture the attack and higher pitch tones" | High (numbers) / angle reference UNKNOWN |
| L21: lower mic "about 2 in (5 cm) above the floor" aimed at the opening | **CONFIRMED** | "the second at the bottom of the drum, 2" above the floor, aimed directly at the opening on the bottom of the drum" | High |
| L15: Coppinger "about 16 in (41 cm) from center" | **CONFIRMED and clarified** | "placed 16 inches (41cm) from the center of the drum with the mic near the outer edge pointing across to the center" | High |
| L21: bottom mic "about 8 in (20 cm) from the rim" | **CONFIRMED; "rim" = the BOTTOM rim** | "placed under, 8 inches (20cm) from the bottom rim" (survey flag answered) | High |
| Coppinger's drum support | additional | "we set the djembe on four pieces of foam" | High |
| Coppinger mics | AT4050 (above), AT4047 (under), AKG C-451 EB with CK-1 (above), MD 421 (under) | COPPINGER | High |
| Audix D4 for djembe | **CONFIRMED** | applications list "djembe" (AX-D4) | High |
| Duvel mic model | KSM137 (cardioid condenser per Shure's catalogue; pattern not stated in the article) | S-DUVEL | Medium |

## Builder pass (2026-10-05, hand-drum builder, worktree miking-w3)

Added keys and re-reads used by `src/screens/lab/miking/lessons/m05Djembe/`.

| Key | Source | URL | Status 2026-10-05 |
|---|---|---|---|
| WP-DJEMBE | Wikipedia, "Djembe" (sounds, dimensions) | https://en.wikipedia.org/wiki/Djembe | 200, read |
| LESSON | The owner's lesson text, `source_text/Djembe-Miking-Technique-Research.txt` | (in the repo) | read |
| WP-MIC | see `SOURCES_SHARED.md` | — | — |
| S-SM57-UG, AX-D2, AX-SCX1 | the hand-drum mic family, `SOURCES_SHARED.md` §6 | — | — |

| Fact | Value | Source's exact words | Confidence |
|---|---|---|---|
| Bass | palm and flat fingers near the centre | "The bass sound is produced by striking the drum with the palm and flat fingers near the center of the skin." (WP-DJEMBE) | High |
| Tone and slap | closer to the edge; the contact area decides | "Tone and slap are produced by striking the drum closer to the edge; the contact area of the fingers determines whether the sound is a tone or a slap." (WP-DJEMBE) | High |
| Bass pitch | set by the shell | "The frequency of the bass is determined by the size and shape of the shell and independent of the amount of tension on the skin." (WP-DJEMBE; a Helmholtz resonance) | High |
| Typical size | 30–38 cm across, 58–63 cm tall | "djembes have an exterior diameter of 30–38 cm (12–15 in) and a height of 58–63 cm (23–25 in)" (WP-DJEMBE) | High | the 610 mm drawing default sits inside it (DJ-08) |
| Coppinger re-read (support) | foam for a mic underneath | "To help decouple the djembe from the floor and give a bit of clearance for a mic underneath, we set the djembe on four pieces of foam." (COPPINGER) | High | the raised support is drawn 200 mm (DJ-04) |
| Coppinger re-read (heard) | top mic bass | "the snap of hand against drum head with that nice, full bass"; bottom: "There is a lot of bass that resonates out from the bottom of the drum" (COPPINGER) | High |
| Duvel re-read (posture) | NOT STATED | the article gives no support or posture (S-DUVEL) | — |
| Meinl HDJ500 re-read | build | "Siam Oak"; "Goat" head; "8 mm Strong Tuning" lugs with "Original MEINL style tuning brackets" and "Pre-stretched nylon PP ropes" (MEINL-HDJ500) | Medium | the drawing shows the ropes; the brackets' count is unknown and not drawn |

Simplifications register: the goblet's profile (waist, foot, opening and the bowl's depth are
drawing / build defaults), the rope lacing pattern, the foam blocks, the hands and player
envelopes (ILLUSTRATIVE); the Coppinger top-mic line derived from "near the outer edge" (DJ-02).
`CORRECTIONS_LOG.md` DJ-01 … DJ-08.
