# M11 Complete Drum-Kit Setups: SOURCES (technical reference)

Lesson: `docs/labs/miking/source_text/M11-Complete-Drum-Kit-Setups-Miking-Technique.txt`.
This file also holds the **standard 5-piece kit** facts shared by M01–M03, M09–M11.
Rules and the owner's 2026-10-04 ruling: as in `snare/SOURCES.md`. Checked 2026-10-04 by Claude.

## Source keys

| Key | Source | URL | Status 2026-10-04 |
|---|---|---|---|
| YMH-RC / YMH-TC / YMH-SCB / YMH-LC | Yamaha drum-set spec pages | see `kick/SOURCES.md` | 200 |
| YMH-TCS / YMH-RCS | Yamaha snare spec pages | see `snare/SOURCES.md` | 200 |
| TAMA-SSC | TAMA Superstar Classic | see `kick/SOURCES.md` | 200 |
| DW-DES | DW Design bass drum 18x22 | see `kick/SOURCES.md` | 200 (kick pass) |
| ZIL-K | Zildjian, "K Zildjian Cymbal Pack", SKU K0800 | https://zildjian.com/products/k-zildjian-cymbal-set | 200 |
| ZIL-PACKS | Zildjian pack listings (S Performer, S Dark, A Custom, Z Custom: 14" HiHats, 16" crash, 18" crash, 20" ride) | https://zildjian.com/products/s-zildjian-performer-cymbal-pack and siblings | search listing 2026-10-04 (only ZIL-K opened) |
| YMH-HHS | Yamaha USA, Hi-Hat Stands, Specs | https://usa.yamaha.com/products/musical_instruments/drums/ac_drums/hardware/hi-hat_stands/specs.html | 200 |
| YMH-CYS | Yamaha USA, Cymbal Stands, Specs | https://usa.yamaha.com/products/musical_instruments/drums/ac_drums/hardware/cymbal_stands/specs.html | 200 |
| DPA-HH | DPA, Bo Brinck, "How to mic hi-hat and cymbals" (lesson [7]) | https://www.dpamicrophones.com/mic-university/how-to-mic/how-to-mic-hi-hat-cymbals/ | 200 |
| S-REC / S-LIVE / S-DRUMS / S-REC1 / S-OH-MM / S-5TECH / DPA-KIT / DPA-TOMS / DPA-KICK | as in the snare, toms and overheads files (lesson [1]–[6], [8], [9]) | | 200 |
| AX-DPE8 | Audix DP Elite 8 sheet, "Complete solution for a 5 piece kit" (archived) | see `snare/SOURCES.md` | archived copy read |

## a. The standard 5-piece kit (sizes from maker catalogues)

| Part | Size | Source (maker words) | Confidence | Notes |
|---|---|---|---|---|
| Bass drum | 22 × 18 in (558.8 × 457.2 mm, conv.) | "RBB-2218" (Yamaha RC), "22"x18" Bass Drum" (TAMA SSC), "18x22″" (DW) | High | Owner-approved M01 drum; kick/SOURCES.md §a. |
| Snare | 14 × 5.5 in (355.6 × 139.7) | "14"×5 1/2"" SBS-1455; TMS-1455; RBS-1455 | High | snare/SOURCES.md §a. |
| Rack tom 1 | 10 × 7 in (254.0 × 177.8) | SBT-1007, TMT-1007, RBT-1007; TAMA "10"x7" Tom Tom" | High | |
| Rack tom 2 | 12 × 8 in (304.8 × 203.2) | SBT-1208, TMT-1208, RBT-1208; TAMA "12"x8" Tom Tom" | High | Yamaha shell packs SBP-2F5 / TMP2F4 pair these two toms. |
| Floor tom | 16 × 16 in (406.4 × 406.4) | TAMA "16"x16" Floor Tom" (CL32RZS) | High | Yamaha's 16-in floor toms are 16 × 15 (SBF-1615, TMF-1615, RBF-1615). |
| Hi-hat | 14 in (355.6) | Zildjian K0800: "14" HiHats"; same size in the S, A Custom and Z Custom packs | High (K0800) / Medium (others via listing) | Cymbal thickness, bell diameter and profile: UNKNOWN. |
| Crash cymbals | 16 in (406.4) and 18 in (457.2) | K0800: "16" Dark Crash Thin", "18" Dark Crash Thin - Added Value" | High | |
| Ride | 20 in (508.0) | K0800: "20" Ride" | High | A 22-in ride was not verified at a maker today (not used). |
| Hi-hat stand height range | HS-1200T / HS-1200D / HS-1200: "Available Height Range 80-92cm"; HS-850: "Height Adjustment 70 -90cm" | YMH-HHS | High (numbers) / Medium (what point is measured is not stated) | |
| Hi-hat stand legs | HS-1200: "3 Double/Single Braced Legs (Pedal Side Legs Open 150 degree angle)"; HS-850: "3 Double Braced Legs (Pedal Side Legs Open 150°)" | YMH-HHS | High | |
| Cymbal stand height ranges | CS-965 "91-172cm"; CS-865 "94-175cm"; CS-755 "91-172cm"; CS-665A "80-163cm"; CS-655A "79-162cm"; CS-650A "62-145cm"; legs "3 Double Braced Legs" / "3 Single Braced Legs" | YMH-CYS | High (numbers) / Medium (measured point not stated) | |
| Hi-hat cymbal spacing note | "To reduce hi-hat leakage into snare-drum microphone, use small cymbals vertically spaced 1/2" apart." | S-LIVE item 5 | Medium | 12.7 mm (conv.). Shure's context is leakage control; used only as a TRIAL open-gap drawing value. |
| Throne seat height; drummer body | **UNKNOWN** | none | (none) | Drawing defaults in the geometry file. |
| Kit layout (positions, heights, angles) | **UNKNOWN** | none | (none) | ILLUSTRATIVE `KIT_PLAN` + drawing defaults. |
| A 5-piece is a standard package | "Complete solution for a 5 piece kit": "1 x i5 Snare Mic, 2 x D2 Rack Tom Mics, 1 x D4 Floor Tom Mic, 1 x D6 Kick Drum Mic, 2 x SCX1C Overhead Mics, 1 x SCX1HC Hi-hat Mic" | AX-DPE8 | High | An 8-mic maker example for a 5-piece kit. |

## b. Channel-plan facts the lesson cites

| Lesson claim (line) | Verdict | Source's exact words |
|---|---|---|
| L24: Shure's recording guide lists one overhead, kick + overhead, kick/snare/overhead among low-count options | **CONFIRMED** | Table "When there are limited microphones available": "One: Use as "overhead" (5)"; "Two: Kick drum and overhead (1 and 5)"; "Three: Kick drum, snare, and overhead … (1, 2, and 5)"; "Four: Kick drum, snare, high hat, and overhead"; "Five: Kick drum, snare, high hat, tom-toms, and overhead" (S-REC p.20). |
| Live low-count plans (not in the lesson) | Additional | "One microphone: Use Placement 1. Placement 6 may work if the drummer limits playing to one side of the drum set. Two microphones: Placements 1 and 3; or 3 and 6. Three microphones: Placements 1, 2, and 3; or 3, 6, and 7. Four microphones: Placements 1, 2, 3, and 4. Five microphones: Placements 1, 2, 3, 4, and 5. More microphones: Increase number of tom-tom microphones as needed." (S-LIVE / S-DRUMS) |
| L26: Mike Major aligns the image to the line through kick and snare | **CONFIRMED** | "I draw an imaginary line through the kick drum and on through the center of the snare drum" (S-OH-MM). |
| L33: kick inside toward batter for attack, outside/near reso for body | **CONFIRMED** | kick/SOURCES.md (S-B52-UG, SN-902, DPA-KICK). |
| L36: snare from outside stick travel, bottom optional | **CONFIRMED** | snare/SOURCES.md. |
| L39: one mic per tom or shared | **CONFIRMED** | toms/SOURCES.md. |
| L42–43: hi-hat spot, air bursts, bleed | **CONFIRMED** | "place the microphone 5-10 cm from the top of the hi-hat cymbal"; "Position your microphone at an angle where you can't see the snare drum"; "When you move the two hi-hat cymbals together there's a lot of air pressure moving out from the sides and any microphone placed there will only pick up the classic wind pop" (DPA-HH). Shure: "a mic placed away from the puff of air that happens when hi-hats close and within four inches to the cymbals should be a good starting point" (S-REC); "Aim microphone down towards the cymbals, a few inches over edge away from drummer (Position G)" (S-LIVE). |
| L45: crash/splash/China: assess overhead coverage first | Consistent | "Many times the overhead mics will provide enough response to the high hat to eliminate the need for a separate hi-hat microphone." (S-REC) — said of the hi-hat; no maker sentence read today says it of crashes. |
| L48: room = recording/broadcast choice | Consistent with M10 sources | room/SOURCES.md. |
| L69: DPA: jazz relies on overheads with optional kick/snare; pop/rock closer tom control | **CONFIRMED (toms part)** | "For jazz, it is common not to use toms at all … pop and rock drum sounds often require a closer miking technique." (DPA-TOMS). The "optional kick/snare" part was not found in the DPA text read today (Medium). |
| L5: DPA whole-kit vs individually controlled; Shure minimal vs close | **CONFIRMED** | DPA-KIT; S-REC1 ("using just 2 overhead microphones with additional close mics—usually on kick and snare"). |

## c. Gaps

- No source gives kit positions, heights, angles, stand footprints, throne height or a drummer body
  envelope. Every one is ILLUSTRATIVE or a drawing default (geometry file).
- No maker figure was found today for cymbal thickness, bell size, or the exact meaning of a stand's
  "height range" (which point is measured).
- M11 names no microphone models (by design, lesson L51).

## Simplifications register

- Cymbals drawn as thin cones (flat disc + raised bell), sizes from Zildjian; profiles drawing default.
- Stands drawn as tripods with straight booms; footprints drawing default; heights kept inside the
  Yamaha ranges.
- Right-handed layout; a left-handed kit mirrors z.
