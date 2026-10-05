# Speaker Cabinet and Leslie Support Module: SOURCES (technical reference)

Lesson: `docs/labs/miking/source_text/Speaker-Cabinet-and-Leslie-Miking-Module.txt`.
Rules and the owner's 2026-10-04 ruling: as in `snare/SOURCES.md`. Checked 2026-10-04 by Claude.

## Source keys

| Key | Source | URL | Status 2026-10-04 |
|---|---|---|---|
| HAM-TRAD | Hammond, "Traditional Leslie Specifications" (lesson [1]) | https://hammondorganco.com/trad-leslie-specifications | 200, read in full |
| HAM-122A | Hammond, Leslie 122A / 122XB / 147A Owners Manual (lesson [2]) | https://hammondorganco.com/wp-content/uploads/2022/09/122A-122XB-147A-OwnersManual-updated.pdf | 200, read; p.4 diagram rendered |
| HAM-3300 | Hammond, Leslie 3300 Owner's Manual (lesson [5]) | https://hammondorganco.com/wp-content/uploads/2022/09/3300.pdf | 200, read |
| HAM-122H | Hammond, **Leslie Heritage Series Model 122H/142H Owner's Manual**, "00457-40211 V1.00-220713" (lesson [6]) | https://hammondorganco.com/wp-content/uploads/2022/09/122H142H_manual_V100Web_en.pdf | 200, read; p.6 "INTERNAL STRUCTURE" rendered and read |
| S-PGA27 | Shure, PGA27 user guide (lesson [3]) | https://pubs.shure.com/view/guide/PGA27/en-US.pdf (HTML twin https://www.shure.com/en-US/docs/guide/PGA27) | 200 |
| S-MILLS | Shure, John Mills, "Miking Guitar Amps: Tips from Sound Pro John Mills", "June 26, 2013" (lesson [4]) | https://www.shure.com/en-US/insights/miking-guitar-amps-tips-from-sound-pro-john-mills | 200 |
| S-LESLIE | Shure, Davida Rochman, "Miking the Legendary Leslie Tone Cabinet", "July 25, 2013" (lesson [7]) | https://www.shure.com/en-US/insights/miking-the-legendary-leslie-tone-cabinet | 200 |
| S-REC / S-LIVE | Shure booklets: Leslie and guitar-amp tables | see `snare/SOURCES.md` | 200 |
| S-SM57-UG | Shure SM57 guide, amp rows | see `snare/SOURCES.md` | 200 |
| S-SM4-UG | Shure SM4 guide, amp row | see `room/SOURCES.md` | 200 |
| AX-I5, AX-D4 | Audix i5 / D4 sheets (cab and "Leslie bottom" rows) | see `snare/` and `toms/SOURCES.md` | 200 |
| CEL-V30 | Celestion, Vintage 30 datasheet | https://celestion.com/productpdf.php?id=888 | 200, read |
| MAR-1960A | Marshall, 1960A 4x12 Angled Cabinet product page | https://www.marshall.com/us/en/product/1960a-4x12-angled-cabinet?pid=1007269 | 200 |
| MAR-MX112 | Marshall, MX112 1x12 Cabinet product page | https://www.marshall.com/us/en/product/mx112-1x12-cabinet?pid=1007173 | 200 |
| AMP-410 | Ampeg, SVT-410HLF spec sheet (47-068-61, 01/01) | https://ampeg.com/pdf/SVT-410HLF.pdf | 200, read |
| FEN-65DR | Fender '65 Deluxe Reverb product page | https://www.fender.com/products/65-deluxe-reverb | **UNREACHABLE: 403**. A search snippet gave 17.5" × 24.5" × 9.5" and 42 lb (Low, not used). |

## a. Leslie (rotary cabinet)

| Fact | Value | Source | Checked | Confidence | Notes |
|---|---|---|---|---|---|
| Two rotors, two speeds | "The sound is "separated" with the highs reproduced by a horn rotor and the lows reproduced by a bass rotor. Both the horn and bass rotors can be operated at two speeds: Fast (tremolo) and Slow (chorale)" | HAM-TRAD (122A, 147A) | 2026-10-04 | High | |
| Drivers | "Massive 15″ woofer, High power horn driver" (122A/147A/122XB); "The upper frequencies are reproduced by the high-compression driver and a custom-molded rotary horn. The lower frequencies radiate from the massive 15" woofer and the high-density custom-molded foam drum." | HAM-TRAD; HAM-122A p.3 | 2026-10-04 | High | 15 in = 381 mm (conv.); Hammond's metric "15" (38cm)" (HAM-122H, HAM-3300). The 122H has a "Wooden Low Rotor" (HAM-122H p.5). |
| Off mode | "Our model 122XB Leslie also features an Off mode (rotors stopped)." | HAM-122A p.3 | 2026-10-04 | High | |
| Cabinet size 122A/147A/122XB | "29 1/4″(W) x 20 5/8″(D) x 41 5/8″(H)"; "149 lbs" | HAM-TRAD; HAM-122A spec list "41 5/8" H, 29 1/4" W, 20 5/8" D" | 2026-10-04 | High | = 742.95 W × 523.875 D × 1057.275 H mm (conv.). |
| Cabinet size 122H / 142H | "W 74.2 X D 52.4 X H 104.3 cm" / "W 29.2 X D 20.6 X H 41 inches" (122H); "W 74.2 X D 52.4 X H 84.6 cm" (142H); weight "57.7 kg / 127.2 lbs" (122H) | HAM-122H p.5 | 2026-10-04 | High | 122H height 1043 mm vs 122A 1057.275 mm (D-L1). |
| Cabinet size 3300 | "63(W) x 52(D) x 90(H) cm"; "57kg" | HAM-3300 p.5 | 2026-10-04 | High | Compact modern cabinet. |
| Crossover | "Horn Rotor Reproduces the treble (above 800 Hz) frequencies." "Low Rotor Reproduces the bass (below 800 Hz) frequencies." Block diagram "Cross Over … 800Hz" | HAM-122H p.5–6 | 2026-10-04 | High | Heritage 122H. The 122A manual shows a "Crossover Network" without a frequency (UNKNOWN for the 122A). |
| **Rotor speeds and ramp times** | Default values ("the values when each control is in the center position"): HORN ROTOR rise "1.8[s]", fall "2.4[s]", slow "44[rpm]", fast "402[rpm]"; LOW ROTOR rise "7[s]", fall "5.5[s]", slow "42[rpm]", fast "372[rpm]" | HAM-122H p.7 (Rotor Control Panel) | 2026-10-04 | High | **Resolves the survey's "no rotor speeds" blocker** for the Heritage 122H. Adjustable on the 122H and 3300 (rise, fall, slow, fast trimmers). DERIVED rotation rates: 44 rpm = 0.733 rev/s; 402 rpm = 6.70 rev/s; 42 rpm = 0.700 rev/s; 372 rpm = 6.20 rev/s. |
| Rotor speeds, vintage 122A/147A | **NOT STATED** by Hammond in HAM-TRAD or HAM-122A | — | 2026-10-04 | High (absence) | Do not label the 122H defaults as 122A figures. |
| Rotation directions (horn, drum) | **UNKNOWN** | none | 2026-10-04 | (none) | Not in any Hammond document read today. |
| Internal layout | "INTERNAL STRUCTURE" schematic: horn rotor (two bells) at the top above the "Compression Driver"; "Woofer" in the middle, facing down into the "Low Rotor" in the lower compartment; "Crossover Network", "Power Amp", "Preamp" at the left | HAM-122H p.6 (rendered); HAM-122A p.4 "Diagram of Models 122A, 122XB, 147A" (2-Speed Horn Rotor, Crossover Network, 15" Speaker, 2-Speed Foam Rotor, 40W Amplifier) | 2026-10-04 | Medium | A schematic, not dimensioned. Rotor sizes, horn length, louver count and positions: UNKNOWN. |
| Openings / louvers | **UNKNOWN** (count, size, which faces) | none | 2026-10-04 | (none) | No Hammond document read today dimensions them. |
| Rotating parts warning | "WARNING: Do not insert your fingers through the gaps. There are rotating parts and hot parts inside." | HAM-122H p.2 | 2026-10-04 | High | Supports lesson L27 "Never push a capsule, cable, fingers or a tool through a louver." |
| 122 vs 147 pins and voltages | Table "function of Leslie 6-pin input socket": Leslie 122 pin 5 "DC 265V output (B+)"; "Leslie Speaker models 122 and 147 both use a 6-pin interface; however, the pin configurations are different for the two cabinets"; CAUTION "The Leslie Heritage Series cabinets accept 122-type output only. DO NOT attempt to connect another adapter kit interface (such as 147, 251, etc.) to this cabinet or severe damage may result."; "The 6-PIN DIN INPUT socket includes 91V DC output." | HAM-122H p.10–11 | 2026-10-04 | High | Lesson L27/L50/L55 CONFIRMED. **The lesson's "Hammond's Heritage manual" = this 122H/142H manual (title "Leslie Heritage Series")**: survey flag resolved; cite it as [6]. |
| Servicing (3300) | "Refer all servicing to qualified service personnel."; symbol text: "dangerous voltage constituting a risk of electric shock is present within this unit." | HAM-3300 p.1 safety block | 2026-10-04 | High | The 3300 text read today does NOT contain an explicit "do not open" sentence; the 122H carries "ATTENTION: RISQUE DE CHOC ELECTRIQUE NE PAS OUVRIR" (HAM-122H p.2). |
| 147A input selector | "This switch is used to electrically match the impedance of your organ speaker system. We strongly recommend that a factory-trained technician set the position of this switch." | HAM-122A p.3 | 2026-10-04 | High | Lesson "do not change an impedance selector" CONFIRMED. |

## b. Leslie microphone positions

| Fact | Value | Source | Checked | Confidence |
|---|---|---|---|---|
| Shure tables (recording and live) | "Aim one microphone into top louvers 3 inches to 1 foot away" (Natural, lacks deep bass; "Good one-microphone pickup"); "Mike top louvers and bottom bass speaker 3 inches to 1 foot away" (Natural, well-balanced); "Mike top louvers with two microphones, one close to each side; pan to left and right; mike bottom bass speaker 3 inches to 1 foot away and pan its signal to center" ("Stereo effect") | S-REC p.17; S-LIVE p.28 | 2026-10-04 | High |
| Larry Byrne | "placing an SM57 on one side of the Leslie, aimed at the center, just under the top louvers and about 12" away"; bass rotor "position it about 3 inches away" | S-LESLIE | 2026-10-04 | High |
| Eric Michaels (organist) | "SM57 or '58 mic on the left side and the right side close to the rotating horn about an inch or two away"; bottom: "mic it from the back" "about 3 inches away"; uses "KSM44" | S-LESLIE | 2026-10-04 | High |
| Zach Mishur | "xy pair for the horn (57s or 81s)" with "Beta 52A right on the rotor panned up the middle"; "xy pair of large diaphragm condensers (KSM44s)" "a couple of meters away" | S-LESLIE | 2026-10-04 | High |
| Frank Gilbert | "Beta 52A aimed at the rotating baffle and a pair of SM81s pointed at the vents by the horns"; open-back placement "capsule all the way in the open back of the cabinet, as close to the rotating horns as possible" (cautions motor wind noise) | S-LESLIE | 2026-10-04 | High |
| Zito | "Two 56s on top" and "one KSM27 for the bottom mic" — "mic on the outside of the wood"; angles the bottom mic "into the corner so that the air movement is away from the direction of the rotation" | S-LESLIE | 2026-10-04 | High |
| Audix D4 | applications include "Leslie bottom" | AX-D4 | 2026-10-04 | High |

## c. Conventional guitar / bass cabinets

| Fact | Value | Source | Checked | Confidence | Notes |
|---|---|---|---|---|---|
| PGA27 amp distance | "Amplifiers … 1-6 inches (2-15 cm)"; "Aim towards the center of the speaker for a clear, aggressive sound, or towards the edge of the speaker for a mellow sound." | S-PGA27 | 2026-10-04 | High | Lesson L8 "1–6 in (2–15 cm)" CONFIRMED. Shure prints 2–15 cm (1 in = 2.54 cm; Shure rounds). |
| SM4 amp row | "Amplifiers 1–6 inches (2–15 cm) Aim towards the center of the speaker for a clear, aggressive sound, or towards the edge of the speaker for a mellow sound. Watch for distortion." | S-SM4-UG | 2026-10-04 | High | |
| SM57 amp rows | "2.5 cm (1 in.) from speaker, on-axis with center of speaker cone" (Sharp attack; emphasized bass); "2.5 cm (1 in.) from speaker, at edge of speaker cone" (Sharp attack; higher frequency sound); "15 to 30 cm (6 to 12 in.) away from speaker and on-axis with speaker cone" (Medium attack; full, balanced sound); "60 to 90 cm (2 to 3 ft.) back from speaker, on-axis with speaker cone" (Softer attack; reduced bass) | S-SM57-UG p.3–4 | 2026-10-04 | High | **Note the SM57 guide's tone words for centre vs edge are the opposite of PGA27/SM4/Mills** ("emphasized bass" at centre, "higher frequency sound" at edge). D-L2. |
| John Mills boundary | "place the mic right on the line between the dust cover and the speaker cone" for "a pretty tight sound that works best for everything from clean to distorted sounds."; "The more you move a mic toward the center of the speaker, the brighter it will sound. On the other hand, the more you move it to the edge, the duller it will sound." | S-MILLS | 2026-10-04 | High | Lesson L8 says "mellower"; Mills says "duller" (minor wording). |
| Mills grille distance | "about 1/2 inch from the grill cloth" (double-miking) and a KSM27 "about 1 to 2 inches away from the line between the dust cover and speaker cone" | S-MILLS | 2026-10-04 | High | 12.7 mm; 25.4–50.8 mm (conv.). |
| Open-back rear mic | "Don't forget to swap the polarity (the button that looks like a zero with a slash through it) on the rear mic. Otherwise you'll have a great deal of phase issues." | S-MILLS | 2026-10-04 | High | The module omits open-back cabinets though its own source [4] covers them (survey flag). |
| One speaker of several | "If the cabinet has multiple speakers of the same type it is typically easiest to place the microphone to pick up just one speaker. Placing the microphone between speakers can result in strong phase effects" | S-REC | 2026-10-04 | High | |
| Audix cab tip | "Guitar cabs: The i5 can be placed within 1-2 inches of the grill cover at a 90 degree angle pointing directly towards the speaker. As the mic is placed closer to the edge of the speaker, you will minimize the higher frequencies and get a warmer, fatter tone." | AX-I5 | 2026-10-04 | High | |
| 12-in speaker (Celestion Vintage 30) | "Nominal Diameter 305mm / 12in"; "Diameter 309mm / 12.2in"; "Cut-out diameter 283mm / 11.1in"; "Overall depth 135mm / 5.3in"; "Chassis depth (inc gasket) 97mm / 3.79in"; "Magnet structure diameter 156mm / 6.1in"; "Mounting hole PCD 297mm / 11.7in"; "Number of mounting holes 4"; "Voice coil diameter 44mm / 1.75in"; "Frequency range 70-5000Hz" | CEL-V30 | 2026-10-04 | High | **Dust-cap diameter: UNKNOWN** (not on the datasheet). |
| 4x12 cabinet (Marshall 1960A) | "Width 770 mm / 30.3""; "Height 755 mm / 29.7""; "Depth 365 mm / 14.4""; "36.5 kg"; "Four 12-inch Celestion G12T-75 speakers" | MAR-1960A | 2026-10-04 | High | Open/closed back not stated on the page (UNKNOWN); angled ("A") front. Speaker positions on the baffle: UNKNOWN. |
| 1x12 cabinet (Marshall MX112) | "Width 500 mm / 19.7""; "Height 470 mm / 18.5""; "Depth 290 mm / 11.4""; "13.5 kg / 30 lb"; "Celestion Seventy-80 (16Ω, 80W)" | MAR-MX112 | 2026-10-04 | High | Back type UNKNOWN. |
| Bass cabinet (Ampeg SVT-410HLF) | "DIMENSIONS (H x W x D) 24" x 30" x 19""; "WEIGHT 110 lbs."; "COMPONENTS 4 Custom Designed 100 watt 10" speakers / 1 high frequency horn"; "FREQ RESPONSE (+/-3dB) 48Hz-18kHz"; "MAXIMUM SPL 125dB" | AMP-410 | 2026-10-04 | High | 609.6 × 762.0 × 482.6 mm (conv.). Horn position and crossover: the spec sheet text read today does not give them (a search snippet said "crossed over at 4kHz", not verified on the sheet). |

## d. Re-verification of the lesson

| Lesson claim (line) | Verdict | Source's exact words |
|---|---|---|
| L6: Hammond describes 122A/147A with rotating horn and lower woofer through a rotating drum | **CONFIRMED** | HAM-TRAD, HAM-122A (above). |
| L8: PGA27 "1–6 in (2–15 cm)" | **CONFIRMED** | S-PGA27. |
| L8: Mills dust-cap/cone boundary, centre brighter, edge mellower | **CONFIRMED with wording** | Mills says "duller", not "mellower" (PGA27/SM4 say "mellow"). |
| L27: 3300 manual warns not to open; servicing to qualified people | **PARTLY CONFIRMED** | 3300: "Refer all servicing to qualified service personnel." and the dangerous-voltage symbol; the "do not open" wording ("NE PAS OUVRIR") is in the 122H manual, not the 3300 text read today. |
| L27: 122H/142H warns of hazardous voltage at legacy pins and incompatible 122/147 wiring | **CONFIRMED** | HAM-122H p.10–11 ("DC 265V output (B+)"; different pin configurations; "severe damage may result"). |
| L37: organist's lower mic "roughly 3 in from a rear opening" | **CONFIRMED** | Eric Michaels: "mic it from the back" "about 3 inches away" (S-LESLIE). Add ≈ 7.6 cm. |
| L40: "near-coincident XY pair outside the upper louvers" | **DIFFERENT (terminology)** | S-LESLIE says "xy pair for the horn". Standard usage: X/Y = coincident (DPA-STEREO, see `overheads/SOURCES.md`; lesson L49 itself says "as close to coincident as their mounts safely allow"). Note: Shure's recording booklet does call X-Y "coincident or near-coincident" (within 12 in), so the phrase has a Shure precedent; recommend "coincident X/Y" for consistency with M09/M10. |
| L43: "a pair a couple of metres away in a good room" | **CONFIRMED** | Zach Mishur (S-LESLIE). |
| L46: one interviewee prefers side louvers | **CONFIRMED** | Larry Byrne "on one side of the Leslie … just under the top louvers"; Eric Michaels "left side and the right side". |
| L55: "Hammond's Heritage manual" | **CONFIRMED identity** | HAM-122H is titled "Leslie Heritage Series Model 122H/142H Owner's Manual". Name it as [6]. |
| L96: some interviewees remove panels | **CONFIRMED** | Frank Gilbert "all the way in the open back of the cabinet". |
| Lesson omits rotor speeds | **Now sourced** | HAM-122H rotor defaults (above). |

## Disagreements log

- **D-L1, traditional cabinet height.** 122A/147A "41 5/8″" (1057.275 mm) vs 122H "104.3 cm".
- **D-L2, centre vs edge tone.** PGA27/SM4: centre "clear, aggressive", edge "mellow"; Mills: centre
  "brighter", edge "duller"; Audix: edge "warmer, fatter"; **SM57 guide: centre "Sharp attack;
  emphasized bass", edge "Sharp attack; higher frequency sound"** (opposite direction). The app's
  tendency text should follow the majority and log the SM57 row.
- **D-L3, Leslie distances.** Shure tables "3 inches to 1 foot" (76.2–304.8 mm); Byrne "about 12""
  upper; Michaels "an inch or two" upper, "about 3 inches" lower.

## Simplifications register

- The Leslie interior is a labelled schematic from Hammond's p.6 drawing ("inside view — never open
  the cabinet"); rotor sizes and louver layout are drawing defaults.
- Rotor motion uses the 122H centre-knob defaults (adjustable on that model); linear ramps between
  speeds are a drawing simplification (Hammond gives only the times).
- No Leslie audio (lesson rule); any moving-air display must stay in time with the drawn rotors.
