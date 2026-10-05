# I11a Rhodes (miking the speaker): SOURCES

Lesson: `source_text/Rhodes-Miking-Technique-Research.txt`. Rules: `kick/SOURCES.md`; Lab 2 keys:
`hihat/SOURCES.md` §0; speaker family keys: `speaker_leslie/SOURCES.md`, `electric_guitar_amp/SOURCES.md`.
Checked 2026-10-05 by Claude.

| Key | Source | URL | Status 2026-10-05 |
|---|---|---|---|
| RH-MK8 | Rhodes Music, "Rhodes MK8" product page (lesson [1]) | https://rhodesmusic.com/rhodes-mk8/ | 200 |
| RH-MK8-UG | Rhodes Music, MK8 User Manual (PDF, 2023-07) (lesson [4]) | https://rhodesmusic.com/wp-content/uploads/2023/07/MK8-User-Guide.pdf | 200, read |
| RH-S61 | Rhodes Music, "Introducing the All-New Rhodes Stage 61" (lesson [3]) | https://rhodesmusic.com/introducing-the-all-new-rhodes-stage-61/ | 200 |
| RH-V8 | Rhodes Music, **"Rhodes V8 Manual v3" — the manual of the V8 SOFTWARE plug-in** (lesson [2]) | https://download.rhodesmusic.com/assets/RHODES-V8PRO/Rhodes%20V8%20Manual%20v3.pdf | 200, read (p.6 "The Rhodes Sound") |
| RH-SM79 | Rhodes (CBS Musical Instruments) 1979 Service Manual, hosted by the fan site fenderrhodes.com | https://www.fenderrhodes.com/org/manual2.pdf (index https://www.fenderrhodes.com/service/manual.html) | 200, read (text layer) — maker document, third-party host → Medium |
| S-GTR | Shure, "How to Choose the Best Mics for the Guitar" (lesson [6]) | https://www.shure.com/en-US/insights/how-to-choose-the-best-mics-for-the-guitar | 200 |
| S-MILLS, S-PGA27 | see `speaker_leslie/SOURCES.md` | | 200 |

## a. The physical instrument (survey flag: "Rhodes plug-in source")

| Fact | Value (exact) | Source | Confidence | Notes |
|---|---|---|---|---|
| Tone generation (physical) | "the Tone is produced by a series of modified tuning forks (one for each note) referred to as "Tone Bar Assemblies." Each such assembly lies adjacent to an adjustable Pickup." "The lower, more resilient leg (Tine) responds visibly to the blow of a Hammer … The upper leg (Tone Bar), while not so visible, does vibrate at the same frequency." | RH-SM79 ch.1 | Medium (third-party host) | **Resolves the survey flag**: cite RH-SM79 and RH-MK8-UG for the physical tine/tonebar/pickup, not RH-V8. |
| MK8 components | "Rhodes custom precision steel tines and tonebars, sustainably sourced Baltic birch tine and pickup rails"; "Rhodes custom precision- wound alnico pickups … flat-ended pickup heads" | RH-MK8-UG spec page | High | |
| RH-V8 wording (software manual) | "a rubber-tipped hammer, which in turn hits a metal wire (tine). This tine is directly coupled to a sympathetically resonating 'tonebar'… captured by a pickup (one per-note)" | RH-V8 p.6 | High as quoted / weak as a physical source | The lesson cites "p. 7"; the text is on the page numbered 6. It is a plug-in manual. Keep only as secondary. |
| MK8 size, keys, weight | "73-note (E8-E80)"; "75lbs/34kg"; "DIMENSIONS 1153 (w) x 563 (d) x 225 (h)" | RH-MK8-UG | High | 73 keys E1–E7 (DERIVED from 88-key numbering). |
| MK8 outputs | "XLR OUTPUTS (BALANCED) Plug these into any MIC level inputs (Mixer, Mic Pre etc)"; "1/4 INCH JACK OUTPUTS (UNBALANCED) Connect the left jack only for mono or both the left and right jacks for stereo output."; "SEND jack for a direct from pickup signal"; "All outputs (jacks, XLR's & Send) can be used simultaneously." | RH-MK8-UG connection overview | High | Lesson L39 "balanced XLR outputs for mic-level inputs" CONFIRMED. |
| MK8 preamp | "vari-pan with 4 waveshapes"; "Rhodes custom vari-pan with variable rate/depth" | RH-MK8 | High | |
| Pickup spacing caution | "be careful not to place the pickup too close to the tines … in the bass region the magnetic field of the pickup can induce upwards pitch change on the lower longer tines. Secondly, the tine can come into contact with the pickup head causing a nasty metallic clank, or worse, stop the tine moving completely" | RH-MK8-UG p.29 | High | Lesson L7 CONFIRMED. |
| Stage 61 | "a fully passive 61-key tine piano"; "Classic Passive Circuitry: No external power required … Designed to be used with an amplifier, DI box, or preamp."; "Single jack output" | RH-S61 | High | Lesson L6/L39 CONFIRMED. Stage 61 dimensions: UNKNOWN. |
| Mechanism numbers (drawing only) | replacement tine kit "with the Tine 4-3/8 inches (111.125 mm) in length"; "the ideal Escapement for the most responsive touch is 1/32" (0.794mm)"; hammer-tip heights 1/4" (6.350mm) for tips 1–30 … 7/16" (11.112mm) for 51–88, with "3/8" (9.925mm)" printed for 41–50 | RH-SM79 ch.4–5 | Medium | The manual misprints 3/8" as 9.925 mm (3/8" = 9.525 mm). Use only for the cutaway inset. |
| Suitcase speaker layout | "a quad of original 12" speakers (two facing the performer and two facing the audience)" | retailer listings (search snippet; mmguitarbar.com) | **Low — not drawn** | No maker page reached today. The original Suitcase's speaker count/size/facing stays UNKNOWN for the drawing; V8 manual only says the Suitcase "is well-known for its classic stereo panning effect". |
| Suitcase panning | "The original Rhodes Suitcase piano is well-known for its classic stereo panning effect, modulating the sound from left to right." | RH-V8 p.(Vari-Pan) | High as quoted | Supports "two speakers / stereo" wording. |

## b. Speaker-miking claims

| Lesson claim | Verdict | Source's exact words |
|---|---|---|
| L10 "about 2–15 cm (1–6 in) from the grille" | CONFIRMED as general amp guidance | S-PGA27: "Amplifiers … 1-6 inches (2-15 cm)" (from `speaker_leslie/SOURCES.md`). Shure says from the amplifier/speaker, not "from the grille" — the lesson's reference point is its own (keep "from the grille cloth" as the lab convention). |
| L10 dust cap / cone boundary | CONFIRMED | S-MILLS: "place the mic right on the line between the dust cover and the speaker cone" |
| L11 centre brighter, edge "mellower" | CONFIRMED with wording | S-GTR: "the closer the mic is to the speaker's center, the more brightness you'll get. Moving the mic outward away from the center of the speaker will give you more bass." / "moving it toward the edge adds warmth and bass"; S-MILLS: "the more you move it to the edge, the duller it will sound"; S-PGA27 "mellow". (Shure SM57 guide states the opposite — D-L2 in `speaker_leslie/SOURCES.md`.) |
| L16 open-back rear mic, polarity | CONFIRMED | S-MILLS: "place a mic on the back of the cabinet … Don't forget to swap the polarity … on the rear mic." |
| L48 NIOSH-TID | resolves | |
| URLs [1]–[7] 200; [8] NIOSH-TID via WebFetch. | | |

## Corrections
- Replace [2] (software manual) with RH-SM79 + RH-MK8-UG for the physical mechanism; fix "p. 7" → p. 6 if kept.
- Say the 2–15 cm figure is Shure's amplifier figure (PGA27), measured by the lab from the grille cloth.
