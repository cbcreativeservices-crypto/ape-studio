# M04b Bongos: SOURCES (technical reference)

Lesson: `source_text/Bongos-Miking-Technique-Research.txt`. Rules: `snare/SOURCES.md`. Checked 2026-10-04.

## Source keys

| Key | Source | URL | Status |
|---|---|---|---|
| MEINL-BONGO | Meinl, "Bongos" blog (lesson [1]) | https://meinlpercussion.com/en/blog/bongos | 200 |
| LP-GEN2 | LP Generation II 7-1/4″ & 8-5/8″ Bongos, LP201A-2 / LP201AX-2 / LP201AX-2AW (lesson [2]) | https://www.lpmusic.com/products/gen2-generation-ii-7-1-4-8-5-8-bongos/ | 200 |
| S-DRUMS / S-REC / S-LIVE | Shure tables (lesson [3]) | see `congas/SOURCES.md` | 200 |
| S-B181 | Shure, "Product Spotlight: Beta 181", John Born, Rob Klegon, Chad Wiggins, "March 30, 2012" (lesson [4], es-ES URL) | https://www.shure.com/es-ES/articulos/product-spotlight-beta181 | 200 |
| DPA-JB | DPA Jonas Brothers case, Oct 29, 2021 (lesson [5]) | see `congas/SOURCES.md` | 200 |

## Facts and verification

| Fact / claim | Value / verdict | Source's exact words | Confidence |
|---|---|---|---|
| Sizes | 7-1/4 in (184.15 mm) and 8-5/8 in (219.075 mm) (conv.) | "This set of 7-1/4″ and 8-5/8″ drums are outfitted with handpicked rawhide heads, traditional rims, 5/16″ diameter tuning lugs, reinforced center block and chrome plated, cast aluminum bottoms." | High |
| Macho / hembra | smaller = macho, larger = hembra | "In Spanish the larger drum is called the hembra and the smaller the macho." | High |
| Open bottoms | "a pair of small open bottomed drums of different sizes" | MEINL-BONGO | High |
| Shared mic just above, between | **CONFIRMED** | "One microphone aiming down between pair of drums, just above top heads" | High |
| Figure-8 between the drums | **CONFIRMED** | "The bidirectional head between the two drums works great in this scenario." (S-B181, English gloss) | High |
| X/Y between the drums | **CONFIRMED** | "Or you can mount two cardioids in an XY between the two drums for a huge stereo image." | High |
| DPA 4099 on bongos | **CONFIRMED** | "4099s on high and low congas, the bongos, two toms and two timbales" | High |
| Shell height, centre-block size, player posture | **UNKNOWN** | — | — |
| Lesson has no numeric positions | correct; the sources give none either | — | — |
| Lesson [3] title "Microphone Techniques for Drums" vs Timbales' "…for Recording" | both Shure booklets contain the same row; S-LIVE too | — | High |

## Builder pass (2026-10-05, hand-drum builder, worktree miking-w3)

Added keys and re-reads used by `src/screens/lab/miking/lessons/m04bBongos/`.

| Key | Source | URL | Status 2026-10-05 |
|---|---|---|---|
| LESSON | The owner's lesson text, `source_text/Bongos-Miking-Technique-Research.txt` | (in the repo) | read |
| S-DRUMS | see `congas/SOURCES.md` | — | — |
| WP-MIC, MATH | see `SOURCES_SHARED.md` | — | — |
| MKT-4099, S-SM57-UG, AX-D2, AX-SCX1 | the hand-drum mic family, `SOURCES_SHARED.md` §6 | — | — |

| Fact | Value | Source's exact words | Confidence |
|---|---|---|---|
| LP Gen II re-read | shells, rims, rods, block | "Siam Oak shells"; "Comfort Curve II rims with cast aluminum bottoms"; "5/16″ Tension rods"; "reinforced center block"; "a pronounced shell contour which results in sharp highs on the Macho and robust lows on the Hembra" (LP-GEN2) | High |
| Rod count, shell height | NOT STATED | (LP-GEN2) | — | drawing defaults (4 rods, 150 mm) |
| Same-tension pitch ratio | 8.625 ÷ 7.25 = 1.190 | ideal membrane: every shape's frequency ∝ 1 ÷ diameter at equal tension and density (MATH; the Cymatics / Drum Tuning tables) | High (model) |
| Spot mics | no distance | "give each head its own directional mic at a safe, comparable distance" (LESSON) | — | the spot zone is a lesson trial with an illustrative band (BG-01) |

Simplifications register: straight shells, the macho on the player's left, the seated player's
legs and the hand envelopes (ILLUSTRATIVE), the stand. `CORRECTIONS_LOG.md` BG-01 … BG-07.
