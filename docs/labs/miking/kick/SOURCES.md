# M01 Kick Drum: SOURCES (technical reference)

Lab: Miking Labs, Lab 1 Membranophones, scope M01 (kick / bass drum).
Lesson: `docs/labs/miking/source_text/Kick-Drum-Miking-Technique-Research.txt`.
Charter: `docs/APE_LAB_VISUAL_CHARTER_2026_10_04.md` §2 to §4.
Checked: 2026-10-04, by Claude (technical-reference research pass). Every row below was read
live on that date unless the row says otherwise.

Rules used in this file:
- Values are copied exactly as the source prints them. Metric conversions are mine and are
  marked "(conv.)": 1 in = 25.4 mm exactly. Nothing is rounded.
- UNKNOWN = no source reachable today states it. It is never filled with a guess.
- Confidence: **High** = manufacturer document read in full today; **Medium** = manufacturer
  page read today, but the value needs interpretation (stated in Notes); **Low** = only a
  search-engine snippet or a retailer page, not verified at the manufacturer. Low rows are
  never used for drawing geometry.

Source keys (used by `GEOMETRY_PROPOSAL.md` and later by `model.ts` `src` fields):

| Key | Source | URL | Status 2026-10-04 |
|---|---|---|---|
| S-B52-UG | Shure, BETA52A User Guide, "Version: 3.1 (2023-I)", 7 pp. | https://pubs.shure.com/view/guide/BETA52A/en-US.pdf | 200, PDF read in full |
| S-B52-WEB | Shure product page BETA 52A (text + embedded product data) | https://www.shure.com/en-US/products/microphones/beta_52a?variant=BETA52A | 200 |
| S-B91-UG | Shure, BETA91A User Guide, "Version: 3.1 (2021-B)", 8 pp. | https://pubs.shure.com/view/guide/BETA91A/en-US.pdf | 200, PDF read in full |
| S-B91-WEB | Shure product page BETA 91A (embedded product data) | https://www.shure.com/en-US/products/microphones/beta_91a?variant=BETA91A | 200 |
| S-2MIC | Shure, "How to Get a Great Kick Drum Sound Using Two Shure Mics", dated "June 25, 2026", no author | https://www.shure.com/en-US/insights/how-to-get-a-great-kick-drum-sound-using-two-shure-mics | 200 |
| S-REC1 | Shure, "Recording Drums Part 1 - Setting up and Microphone Technique", dated "November 06, 2022" | https://www.shure.com/en-US/insights/recording-drums-part-1-setting-up-and-microphone-technique | 200 |
| S-LIVE | Shure, "Microphone Techniques for Live Sound Reinforcement" (PDF booklet) | https://www.shure.com/damfiles/default/global/documents/publications/en/performance-production/microphone_techniques_for_live_sound_reinforcement_english.pdf-3df433145fca686a736beeb5da588efa.pdf | 200 |
| SN-902-2019 | Sennheiser, e 902 Instruction manual (01/2019 PDF, 7 pp.), the lesson's [3] | lesson URL https://www.sennheiser.com/globalassets/digizuite/40681-en-e902_manual_01_2019_en.pdf is **DEAD**: 302 to link.sennheiser.com/dam-migration/40681, 301 to an optimizely CDN URL, **404**. Read instead from the Internet Archive capture of 2024-05-30: https://web.archive.org/web/20240530010343/https://www.sennheiser.com/globalassets/digizuite/40681-en-e902_manual_01_2019_en.pdf | archived copy read in full |
| SN-902-DOC | Sennheiser online manual, e 902 "Operation" page, footer "v1.3 \| 04/2026" | https://docs.cloud.sennheiser.com/en-us/evolution-wired/manual-e902-using.html | 200 |
| SN-902-SPEC | Sennheiser, "SP_1213_v1.0 e 902 Product Specification" (2 pp.) | https://www.sennheiser.com/globalassets/digizuite/41686-en-sp_1213_v1.0_e_902_product_specification_en.pdf | 200 (redirects to optimizely CDN), read in full |
| AKG-CUT | AKG, "CUTSHEET D112 MKII" (2 pp., © 2015 HARMAN) | https://support.harmanaudio.com/on/demandware.static/-/Sites-masterCatalog_Harman/default/dwef0475a5/pdfs/AKG_d112_mkII_cutsheet.pdf | 200, read in full |
| AKG-WEB | AKG product page D112 MkII, the lesson's [7] | https://www.akg.com/D112MkII.html | **UNREACHABLE from here**: HTTP 403 to curl and to WebFetch (bot protection). The search index lists the page, so it probably works in a normal browser. Facts taken from AKG-CUT instead. |
| DPA-KICK | DPA Microphones, Bo Brinck, "How to mic a kick (bass) drum" (Mic University) | https://www.dpamicrophones.com/mic-university/how-to-mic/how-to-mic-a-kick-drum/ | 200 |
| DPA-4055 | DPA document portal, 4055 Kick Drum Microphone, Specifications | https://www.dpamicrophones.com/document-portal/manual/product/4055/variant/28/ | 200 |
| NIOSH | CDC NIOSH, "Understand Noise Exposure", dated "Jan. 31, 2024" | https://www.cdc.gov/niosh/noise/prevent/understand.html | 200 via WebFetch (curl gets 403, bot protection) |
| YMH-ZG01 | Yamaha ZG01 manual, "Operating panel" | https://manual.yamaha.com/pa/interfaces/zg01/en-US/7884896267.html | 200 |
| YMH-RC | Yamaha USA, Recording Custom drum set, Specs | https://usa.yamaha.com/products/musical_instruments/drums/ac_drums/drum_sets/recording_custom_2016/specs.html | 200 |
| YMH-TC | Yamaha USA, Tour Custom drum set, Specs | https://usa.yamaha.com/products/musical_instruments/drums/ac_drums/drum_sets/tour_custom2/specs.html | 200 |
| YMH-LC | Yamaha USA, Live Custom drum set, Specs | https://usa.yamaha.com/products/musical_instruments/drums/ac_drums/drum_sets/live_custom/specs.html | 200 |
| YMH-SCB | Yamaha USA, Stage Custom Birch drum set, Specs | https://usa.yamaha.com/products/musical_instruments/drums/ac_drums/drum_sets/stage_custom_birch/specs.html | 200 |
| YMH-HUB | Yamaha Music Hub, "The Modern Drum Set, Part 2: The Bass Drum" | https://hub.yamaha.com/drums/studio/part-2-the-bass-drum/ | 200 |
| TAMA-SSC | TAMA USA, Superstar Classic Drum Kits | https://www.tama.com/usa/products/drum_kits/superstar_classic_drumkit.html | 200 |
| DW-DES | DW, "DW Design Series Bass Drum, 18x22″" | https://www.dwdrums.com/products/ddkkwood1822-design-series-bass-drum-18x22/ | 200 |
| DW-9000 | DW, 9000 Series Bass Drum Pedals manual (PDF, hosted by retailer zZounds) | https://c3.zzounds.com/media/DW9000PedalManual-c60438255a370f0f4d9c3e42aca290d9.pdf | 200 |
| DW-5000 | DW, 5000 Series pedal manual (PDF, hosted by retailer zZounds) | https://cf3.zzounds.com/media/DW5000D3PedalManual-e31bcb2cfd75149eac6223bfe6f49ca2.pdf | 200 |
| YMH-FP9 | Yamaha FP9 foot pedal owner's manual (multilingual PDF) | https://usa.yamaha.com/files/download/other_assets/7/1216497/fp9_10om_ja_en_fr_de_it_es_pt_ko_zh_ru_om_a0.pdf | 200 (th./at./uk./mx. hosts give 404) |
| REMO-DM | Remo, Powerstroke P3 Ebony Bass Drumhead - 5" Black DynamO, 22", P3-1022-ES-DM | https://remo.com/partnumber/p3-1022-es-dm | 200 |
| REMO-OH | Remo, Powerstroke P3 Colortone Blue Bass Drumhead, 22", 5" Offset Hole, P3-1322-CT-BUOH | https://remo.com/partnumber/p3-1322-ct-buoh | 200 |
| EVANS-EMAD | Evans (D'Addario), EMAD Resonant Bass Drumhead, SKU BD22REMAD | https://www.daddario.com/products/evans-drumheads-emad-bass-reso (redirect from /products/percussion/evans-drumheads/drum-set/drumset-bass-reso/emad-bass-reso/) | 200 |
| AQ-RSM | Aquarian, Regulator RSM Offset Hole Gloss Black | https://shop.aquariandrumheads.com/products/regulator-offset-hole-gloss-black | 200 |
| AQ-RPT | Aquarian, Regulator RPT Center Port Resonant Gloss Black | https://shop.aquariandrumheads.com/products/regulator-center-port-resonant-gloss-black | 200 |
| AQ-SOP | Aquarian, Small Offset Port Resonant Gloss Black | https://shop.aquariandrumheads.com/products/small-offset-port-resonant-gloss-black | 200 |
| AQ-COLL | Aquarian, Regulator Series collection page | https://shop.aquariandrumheads.com/collections/regulator-series | 200 |
| KP-ACC | KickPort International, Accessories page (T-Ring) | https://www.kickport.com/accessories | 200 |
| DW-PILLOW | DW, "Bass Drum Dampening Pillow 18″" (DSCPBDP18): "Fits 18″ depth kick drums" — no dimensions on DW's page; SIZE from the retailer listing of the same item, 18.1 × 15.8 × 4.8 in | https://www.dwdrums.com/products/dscpbdp18-bass-drum-dampening-pillow-18/ · retailer: https://www.amazon.com/DW-Bass-Drum-Muffling-Pillow/dp/B0002E2SCW | lead's sourcing 2026-10-04 (not re-read in this run); owner ruling "use a standard kick pillow" |
| KICKPRO | KickPro bass drum pillow, maker page "Standard Size 17"x11""; retailer thickness 3 in (cross-check only, not drawn) | https://bigbangdist.com/product/kickpro-bass-drum-pillow/ | lead's sourcing 2026-10-04 (not re-read in this run) |
| PEARL-EXX | Pearl, Export EXX product page | https://pearldrum.com/en/products/drum-set/export-exx/export | **UNREACHABLE**: HTTP 403 (Cloudflare "Just a moment..."). Not used. |

---

## a. Bass drum shell, hoops, hardware

| Fact | Value (exact, units) | Source (key, location) | Checked | Confidence | Notes |
|---|---|---|---|---|---|
| Recording Custom bass drum sizes (diameter × depth) | 24"×14" (RBB-2414), 22"×18" (RBB-2218), 22"×16" (RBB-2216), 22"×14" (RBB-2214), 20"×16" (RBB-2016), 18"×14" (RBB-1814) | YMH-RC, Specs, "Components / Bass Drum" table | 2026-10-04 | High | The table prints diameters and depths in two rows; I paired them by model number, which encodes both (RBB-DDdd). |
| Recording Custom bass drum "No. of Tuning Bolts" | 10 for RBB-2414, -2218, -2216, -2214, -2016; 8 for RBB-1814 | YMH-RC, same table | 2026-10-04 | Medium | The table does not say "per head" or "per side". I read it as tension rods per head (one head side), which is how a single drum's bolt count is normally given. **OWNER-CONFIRMED 2026-10-04: 10 tension rods per head.** |
| Recording Custom BD hoop | "Wood hoop" | YMH-RC, "BD Hoop" | 2026-10-04 | High | No hoop thickness or height given. |
| Recording Custom BD leg (spur) | "Convertible type" | YMH-RC, "BD Leg" | 2026-10-04 | High | No count, length or angle given. |
| Recording Custom shell | "100% Birch, 6-ply (with inner dark brown paint)"; bearing edge "30-Degree/R1.5" | YMH-RC | 2026-10-04 | High | No shell thickness on this page. |
| Tour Custom bass drum sizes | 22"×16" (TMB-2216), 20"×15" (TMB-2015), 18"×14" (TMB-1814) | YMH-TC, Components | 2026-10-04 | High | |
| Tour Custom BD hoop | Material "BD : Maple"; Thickness "BD : 8.0 mm" | YMH-TC, Design/Architecture Detail | 2026-10-04 | High | The only sourced bass-drum hoop thickness found. Hoop HEIGHT (axial width) is not given. |
| Tour Custom shell | "Maple (6-ply)", Thickness "5.6 mm" | YMH-TC | 2026-10-04 | High | Applies to all Tour Custom shells as printed. |
| Live Custom BD shell / hoop | "BD : 8ply 9.6mm"; "BD : Wood Hoop" | YMH-LC | 2026-10-04 | High | |
| Stage Custom Birch BD sizes | 24"×15" (SBB-2415), 22"×17" (SBB-2217), 20"×17" (SBB-2017), 18"×15" (SBB-1815) | YMH-SCB, Components | 2026-10-04 | High | The page's hoop row ("Triple Flange Hoop, Steel, 1.5 mm") does not say whether it covers the bass drum. Not used for the BD. |
| Superstar Classic bass drum sizes | "22"x18" Bass Drum", "22"x14" Bass Drum", "20"x16" Bass Drum" (in the listed kit configurations) | TAMA-SSC, kit tables | 2026-10-04 | High | |
| Superstar Classic BD shell | Lacquer and Unicolor Wrap: "Bass Drum : 8ply, 7mm"; Exotic: "Bass Drum : 6ply Maple + 2 outer ply Lacebark Pime, 7mm" | TAMA-SSC, "100% Maple Shells" | 2026-10-04 | High | "Pime" is TAMA's spelling on the page. |
| Claw hooks (purpose) | "These claw hooks stabilize the wood hoops on bass drums and feature built-in rubber lining…" | TAMA-SSC, "Claw Hook" | 2026-10-04 | High | No count stated. YMH-HUB: "Claws are used to hold wood hoops onto a bass drum." |
| DW Design bass drum | "This 18x22″ kick drum features an 8-ply maple shell, mini-turret lugs and low-mass die cast claw hooks." Includes "two-piece bass drum pillow set (DSCPBDP2W)" | DW-DES | 2026-10-04 | High | DW writes depth × diameter (18x22 = 22 in diameter, 18 in deep). No lug count. |
| Typical kit bass drum size range | "diameters ranging from 18 to 26 inches, with average depths from 14 to 18 inches"; "diameters of 22 and 24 inches are standard for just about every other genre of music" | YMH-HUB, "What's Your Size?" | 2026-10-04 | High | Manufacturer editorial, not a spec sheet. |
| "Standard rock" kick size | "the standard rock kick drum has a 22" diameter (often up 24"-26") and a hole in the resonator head" | DPA-KICK, "The instrument" | 2026-10-04 | High | Jazz: "down to 18" or less", often no hole. |
| Spurs: count | "Legs or "spurs" attached to each side of the shell" | YMH-HUB, "How to Avoid Creep'n'Roll" | 2026-10-04 | Medium | "Each side" = one per side = 2 per drum. Mount position along the shell: UNKNOWN. |
| Spurs: angle | **UNKNOWN** | none found | 2026-10-04 | (none) | No manufacturer page reachable today gives a spur angle or length. |
| Hoop height (axial width), hoop outer diameter | **UNKNOWN** | none found | 2026-10-04 | (none) | Needed for the side view. |
| Actual shell outside diameter of a "22 in" drum | **UNKNOWN** | none found | 2026-10-04 | (none) | "22 in" is the nominal (head) size. No maker states the shell OD. |
| Pearl Export EXX 22x18 hardware | not used | PEARL-EXX unreachable | 2026-10-04 | Low | A search snippet listed "1.6mm Triple-Flanged" hoops, "BSP70" spurs, "CW80" claws. Not verified; not used. |

**Default drum chosen for the drawing: 22 in diameter × 18 in deep (558.8 mm × 457.2 mm, conv.).**
Why:
1. 22×18 appears in three manufacturers' current catalogs read today: Yamaha Recording Custom
   RBB-2218 (YMH-RC), TAMA Superstar Classic "22"x18"" (TAMA-SSC), DW Design "18x22″" (DW-DES).
2. 22 in is the diameter DPA calls standard for rock (DPA-KICK), the article the lesson cites
   as [1], and Yamaha calls standard for most genres (YMH-HUB).
3. 18 in is the top of Yamaha's stated "average depths from 14 to 18 inches". The deepest
   common drum gives the most room to show the Beta 52A's 20 to 30 cm position inside
   the shell (300 mm < 457.2 mm).
4. The one drum with a sourced bolt count in this size is Yamaha RBB-2218: 10 tuning bolts.

Other sizes are named for a later size switch: 22×16 (YMH-RC, YMH-TC), 20×16 (YMH-RC, TAMA-SSC),
24×14 (YMH-RC). Each one needs its own row before it is drawn.

## b. Resonant-head port hole

| Fact | Value | Source | Checked | Confidence | Notes |
|---|---|---|---|---|---|
| Remo P3 Ebony, 22" with DynamO | "Pre-cut 5" hole with a DynamO reinforcement ring installed" (127.0 mm conv.) | REMO-DM, Features | 2026-10-04 | High | The page does not say whether the hole is centred or offset. |
| Remo P3 Colortone, 22" | "5" Offset Hole"; "a 5" mic hole" (127.0 mm conv.) | REMO-OH, title and Features | 2026-10-04 | High | "Offset" is stated; the offset DISTANCE is not given. |
| Evans EMAD Resonant (22") | "The 4" offset mic port features a plastic sleeve…" (101.6 mm conv.) | EVANS-EMAD, Product Details | 2026-10-04 | High | Offset distance not given. |
| Aquarian Regulator RSM | "4.25" Reinforced Mic Port maintains resonance" (107.95 mm conv.) | AQ-RSM | 2026-10-04 | High | **Disagrees with AQ-COLL** (see D4). |
| Aquarian Regulator series | "choice of a large 7" ported hole in the center, a 4 ¾" offset port or a full head with no porthole" (7" = 177.8 mm; 4 ¾" = 120.65 mm conv.) | AQ-COLL | 2026-10-04 | High | Same maker, different number from AQ-RSM. |
| Aquarian Regulator RPT | "7" Reinforced Mic Port for quick response" (177.8 mm conv.), centre port | AQ-RPT | 2026-10-04 | High | The only CENTRED port found. |
| Aquarian Small Offset Port | "a 4.25" hole placed off center" (107.95 mm conv.) | AQ-SOP | 2026-10-04 | High | |
| KickPort T-Ring | "outer diameter of 7.25-inches and an inner, port diameter of 5.25-inches"; "can be used as a template for cutting a 5.25-inch port" (184.15 mm / 133.35 mm conv.) | KP-ACC, "T-RINGS" | 2026-10-04 | High | KickPort's own required hole size is not in the page text read today (a retailer snippet says 5"; not verified). |
| Offset port position (distance from head centre, clock angle) | **UNKNOWN** | none | 2026-10-04 | (none) | No head maker states it in text. Photos are not an authority (charter §3). |
| Port wind / pop | "a lot of air is moved by the kick drum and when it is compressed through the hole in the resonator head, the mic can sometimes pick up wind/pop noise. Usually this can be dealt with by simply adjusting the angle of the microphone in the hole." | DPA-KICK, "Kick drum mic placement" | 2026-10-04 | High | Supports the lesson's port-air section. |

## c. Kick pedal

| Fact | Value | Source | Checked | Confidence | Notes |
|---|---|---|---|---|---|
| Beater strike height | "Generally, the beater should hit the center of the drum or an area 1-2 inches above the center." (25.4 to 50.8 mm above centre, conv.) | DW-9000, "Section 2: Beater Ball Adjustments"; DW-5000 "Beater Height" has the same rule ("the center or an area 1-2 inches above the center of the drum") | 2026-10-04 | High | Both manuals are DW documents hosted by a retailer (zZounds); not found on dwdrums.com today. |
| Pedal position on hoop | "Position the pedal on the center of the hoop and tighten the T-screw securely." | DW-9000, "Section 5: Hoop Clamp Adjustments"; DW-5000 same wording with "side wing screw" | 2026-10-04 | Medium | I read "center of the hoop" as laterally centred at the bottom of the batter hoop. That puts the beater on the drum's vertical centre line. |
| Beater shaft length range | **UNKNOWN** | none | 2026-10-04 | (none) | DW, Yamaha (FP9 manual, BT-910A page) and TAMA (Cobra Beater, HP910LN pages) give no lengths. Retailer snippets (e.g. a DW SM103 shaft "165 mm") could not be opened (403). Not used. |
| Beater head diameter | **UNKNOWN** | none | 2026-10-04 | (none) | Same as above. |
| Beater swing arc / stroke angle | **UNKNOWN** | DW-9000 "Section 3: Slotted Stroke Adjustment … modify the distance the beater travels" (no number); YMH-FP9 "To adjust the beater angle … Use the markings for reference" (no number) | 2026-10-04 | (none) | Adjustable, no value printed. |
| Footboard length, pivot (axle) height above floor | **UNKNOWN** | none | 2026-10-04 | (none) | |
| Pedal spurs | DW: "built-in adjustable spurs and non-skid Velcro"; YMH-FP9: spike extends "beyond the base to help fix the pedal" | DW-9000 §6, YMH-FP9 | 2026-10-04 | High | These are PEDAL spurs, not bass-drum spurs. |

## d. Microphones named in the lesson

| Fact | Value | Source | Checked | Confidence | Notes |
|---|---|---|---|---|---|
| **Beta 52A type** | "Dynamic (moving coil)" | S-B52-UG p.5 Specifications | 2026-10-04 | High | |
| **Beta 52A polar pattern, Shure's exact words** | Spec table: "Supercardioid". Cover: "The Shure dynamic supercardioid kick drum microphone". General Description: "Featuring a modified supercardioid pattern". Features: "Modified supercardioid pick-up pattern". Product page: "The Beta 52A features a modified supercardioid pattern throughout its frequency range" and also the bullet "Supercardioid pattern for high gain before feedback" | S-B52-UG p.1, p.3, p.5; S-B52-WEB | 2026-10-04 | High | **Survey flag answered: Shure uses BOTH.** The formal spec field says "Supercardioid"; the description says "modified supercardioid". The lesson's "modified supercardioid" is Shure's own wording. See D1. |
| Beta 52A rejection angle | "A supercardioid microphone has the greatest sound rejection at points 120° toward the rear of the microphone." | S-B52-UG p.4 | 2026-10-04 | High | Disagrees with S-LIVE (126° / 125°). See D2. |
| Beta 52A max SPL | "1 kHz at 1% THD, 1 kΩ load 174 dB" | S-B52-UG p.6 | 2026-10-04 | High | |
| Beta 52A weight | "0.605 kg(1.35 lbs)" | S-B52-UG p.6 | 2026-10-04 | High | S-B52-WEB data: weight 605, weight_pound 1.334. |
| Beta 52A dimensions (product data) | width "94.0", height "162.0", depth "113.0" (mm); width_inch 3.701, height_inch 6.378, depth_inch 4.449 | S-B52-WEB, embedded product data fields | 2026-10-04 | Medium | Field names only; Shure does not say which physical extent each is. See D3. |
| Beta 52A dimensions (guide drawing) | "4.451", "6.406", "3.750" (no unit printed) | S-B52-UG p.5, figure "Using the Stand Adapter" | 2026-10-04 | Medium | 6.406 = overall height incl. stand adapter (arrow spans head top to adapter bottom); 4.451 = head length along its axis; 3.750 = grille front diameter (leader to the front ring). If inches: 162.7124 / 113.0554 / 95.25 mm (conv.). Unit is my inference. Adapter rotation: "180°". |
| Beta 52A replacement grille | "Grille for BETA52A RK321" | S-B52-UG p.7 | 2026-10-04 | High | No grille dimensions. |
| **Beta 91A type** | "Electret Condenser"; "This boundary microphone…" | S-B91-UG p.6, p.4 | 2026-10-04 | High | |
| **Beta 91A polar pattern, Shure's exact words** | "Half-cardioid (cardioid in hemisphere above mounting surface)"; "Uniform half-cardioid polar pattern (in the hemisphere above mounting surface)"; "Keep sound sources within a 60° range above this surface." | S-B91-UG p.6 Specifications, p.3 Features, p.4 "Half-cardioid Polar Pattern" | 2026-10-04 | High | **Survey flag answered: half-cardioid, confirmed.** The 60° figure is drawn from the mounting surface (p.4 figure). |
| Beta 91A dimensions | "95,11 mm (3.74 in.)", "139,1 mm (5.48 in.)", "20,3 mm (0.8 in.)" | S-B91-UG p.8 drawing; S-B91-WEB data width "139.1", depth "95.11", height "20.3" | 2026-10-04 | High | Drawing and web data agree. 139.1 = long side, 95.11 = short side, 20.3 = height. |
| Beta 91A weight | "470 g(16.6 oz.)" | S-B91-UG p.7 | 2026-10-04 | High | |
| Beta 91A max SPL | "1 kHz at 1% THD": "2500 Ω load 155 dB", "1000 Ω load 151 dB" | S-B91-UG p.6 | 2026-10-04 | High | |
| Beta 91A contour switch | "7 dB of attenuation centered at 400 Hz"; positions "Flat response" and "Low-Mid Scoop"; switch "on the bottom of the microphone" | S-B91-UG p.7, p.5 | 2026-10-04 | High | |
| Beta 91A power | "11–52 V DC phantom power, 5.4 mA"; "performs best with a 48 Vdc supply" | S-B91-UG p.7, p.5 | 2026-10-04 | High | "Integrated preamplifier and XLR connector". |
| Beta 91A grille | "Do not cover any part of the microphone grille, as this will adversely affect microphone performance." | S-B91-UG p.3 | 2026-10-04 | High | |
| **e 902 type / pattern** | "Transducer principle dynamic"; "Pick-up pattern cardioid" | SN-902-SPEC; SN-902-2019 p.6 | 2026-10-04 | High | |
| e 902 dimensions | "Ø 60 mm, length 128,5 mm" (manual); "⌀ 60 x 128.5 mm" (spec table); drawing: 128,5 length, ⌀60, 97 overall height (body + integral mount) | SN-902-2019 p.6; SN-902-SPEC p.1 and p.2 "DIMENSIONS" | 2026-10-04 | High | Grille ("sound inlet basket") length: UNKNOWN. |
| e 902 weight | "440 g" | SN-902-SPEC; SN-902-2019 | 2026-10-04 | High | |
| e 902 max SPL | **NOT STATED** | SN-902-SPEC, SN-902-2019 | 2026-10-04 | High (absence) | Sennheiser prints no max SPL. Do not show one. |
| e 902 frequency response | "20 - 18,000 Hz" (spec table) and "40 Hz – 16,000 Hz" (Architect's Specification, same sheet) | SN-902-SPEC p.1 | 2026-10-04 | High | Internal disagreement, see D5. Not a geometry item. |
| **D112 MkII pattern** | "Polar pattern Cardioid" | AKG-CUT p.2 | 2026-10-04 | High | |
| D112 MkII dimensions | "Length 115 mm (4.53 in.)", "Diameter 70 mm (2.76 in.)", "Height 126 mm (4.96 in.)" | AKG-CUT p.2 | 2026-10-04 | High | Height includes the integrated mount (see photo, p.1); the drawing is not dimensioned. |
| D112 MkII weight | "Net weight (mic only) 300 g (10.6 oz.)" | AKG-CUT p.2 | 2026-10-04 | High | |
| D112 MkII max SPL | "Max. SPL for 0.5 % THD > 160 dB (calculated)" | AKG-CUT p.2 | 2026-10-04 | High | The word "calculated" is AKG's. |
| **DPA model in the cited article** | "the 4055 Kick Drum Microphone delivers clarity and linear frequency response, both on-axis and off-axis. It is flexible enough to place inside or outside the drum." | DPA-KICK, "DPA's solutions for the kick drum" | 2026-10-04 | High | Article author: "Bo Brinck" (byline). Also named: 4041-SP omni (P48), 3532-SP stereo kit, 2011, 4099 (related products). |
| DPA 4055 pattern | "Directional pattern Open Cardioid"; "Principle of operation Pressure gradient"; "Cartridge type Pre-polarized condenser" | DPA-4055, Specifications | 2026-10-04 | High | |
| DPA 4055 dimensions / weight | "Microphone diameter 57 mm (2,24 in)"; "Capsule diameter 17 mm (0.67 in)"; "Microphone length 132 mm (5,19 in)"; "Weight 241 g (8,5 oz)" | DPA-4055 | 2026-10-04 | High | A search snippet gave 102 mm and 250 g (retailer). DPA's own page wins; see D7. Shape: "unique asymmetric design" (outline UNKNOWN). |
| DPA 4055 max SPL | "Max. SPL, THD 10% 164 dB SPL peak"; "Distortion, THD < 1% 156dB SPL RMS, 159 dB SPL peak" | DPA-4055 | 2026-10-04 | High | |
| DPA 4055 response / power | "Frequency response 20 Hz - 20 kHz"; "Effective frequency range ±2 dB, at 20 cm (7.9 in) 40 Hz - 18 kHz with a 6 dB soft boost at 10 kHz"; "P48 (Phantom Power)", "2.0 mA" | DPA-4055 | 2026-10-04 | High | Supports the lesson's "flatter-response condenser" with DPA's own ±2 dB figure and a stated 6 dB boost. |

## e. Re-verification of every number and claim the lesson cites

| Lesson claim (line in the .txt) | Verdict | Source's exact words |
|---|---|---|
| L24: Beta 52A "5 to 7.5 cm from that head, slightly off the beater line" | **CONFIRMED** | "5 to 7.5 cm (2 to 3 in.) away from beater head, slightly off-center from beater." Tone: "Sharp attack; maximum bass sound, highest sound pressure level." (S-B52-UG p.3). Note: the guide never says "inside"; the lesson's row heading "Inside near the batter head" is the lesson's framing. |
| L27: Beta 52A "20 to 30 cm from that head if the drum and mic physically allow it" | **DIFFERENT (detail)** | Numbers confirmed: "20 to 30 cm (8 to 12 in.) from beater head, on-axis with beater." Tone: "Medium attack; balanced sound." (S-B52-UG p.3). The lesson DROPS "on-axis with beater", and "if the drum and mic physically allow it" is not in the guide (it is the lesson's own safety caveat). |
| L11: Shure "explicitly instructs users to keep its Beta 52A off the head and internal damping" | **CONFIRMED** | "Make sure microphone does not touch drum head or damping inside of the drum." (S-B52-UG p.3) |
| L68: Beta 52A guide "advises checking placement before a performance" | **CONFIRMED** | "always test microphone placement before a performance." (S-B52-UG p.4) |
| L93: Beta 52A guide labels near-batter "the highest-SPL position" | **CONFIRMED** | "highest sound pressure level" (S-B52-UG p.3, row 5 to 7.5 cm) |
| L15: Beta 52A "modified supercardioid" | **CONFIRMED (with caveat)** | "Featuring a modified supercardioid pattern" (p.3). The spec field says "Supercardioid" (p.5). See D1. |
| L17 / L36: Beta 91A "25 to 152 mm" from batter head, on cushioning | **CONFIRMED** | "Inside drum, on a pillow or other cushioning surface, 25 to 152 mm (1 to 6 in.) from beater head." Tone "Full, natural sound."; with contour: "Contour switch activated; 25 to 152 mm (1 to 6 in.) from beater head." Tone "Sharp attack; maximum bass "punch."" (S-B91-UG p.4) |
| L17: Beta 91A "contour setting changes its tonal response" | **CONFIRMED** | "7 dB of attenuation centered at 400 Hz" (p.7). |
| L11: Beta 91A "leave its grille unobstructed" | **CONFIRMED** | "Do not cover any part of the microphone grille" (p.3) |
| L10: NIOSH 85 dBA over 8 h; +3 dBA halves the time | **CONFIRMED** | "The NIOSH recommended exposure limit (REL) for occupational noise exposure is 85 A-weighted decibels (dBA) over an eight-hour shift." and "For each 3 dBA increase in noise level, NIOSH recommends reducing the exposure duration by half." Page date "Jan. 31, 2024" (NIOSH). |
| L30: e 902 manual "describes a more resonant result there [resonant-head or port area] than close to the batter head" | **CONFIRMED, with one DIFFERENCE** | Position A: "Position the microphone at a distance of a few centimeters from the batter head." → "much attack / little resonance / dry". Position B: "Position the microphone at the level of the resonant head." → "less attack / much resonance / smooth and voluminous". Position C: "in the middle between the batter head and the resonant head." → "less Attack" (SN-902-2019 p.4; same in SN-902-DOC). The manual says "at the level of the resonant head"; it never mentions a **port**. |
| L50: Sennheiser "recommends turning its e 902 away from the beater strike when less attack is wanted" | **CONFIRMED in the 2019 PDF; ABSENT from the current manual** | 2019 PDF: "For less attack in all three positions, turn the microphone away from where the beater strikes." (SN-902-2019 p.4, archived copy). The live online manual "v1.3 \| 04/2026" (SN-902-DOC) has Positions A/B/C but **not** this sentence. The lesson's URL [3] is dead (404). |
| L71: Shure two-mic: Beta 91A inside for attack, Beta 52A near the port for low-frequency weight | **CONFIRMED** | "position the Beta 91 inside the kick drum and the Beta 52 near the sound hole as previously described." Beta 52A "is the best Shure microphone for capturing the weight of your kick"; Beta 91A "performs particularly well when placed inside the kick drum to capture the attack." Also: "be sure to experiment with inverting the phase on one channel" (Shure says "phase"; the lesson correctly says polarity). Date "June 25, 2026". (S-2MIC) |
| L41: DPA "suggests adjusting angle around the port" | **CONFIRMED** | "Usually this can be dealt with by simply adjusting the angle of the microphone in the hole." (DPA-KICK) |
| L93: DPA: pressure just outside the port sometimes greater than inside | **CONFIRMED** | "The sound pressure level is not as high inside as it is just outside the hole so this position may result in a thinner sound (fewer low frequencies), sounding more natural and flatter. But kick drums vary so there are exceptions to the rules." (DPA-KICK) |
| L33: DPA documents outside pickup for unported drums | **CONFIRMED** | "a jazz kick drum often does not have a hole in the resonator head making it necessary to place a mic outside" (DPA-KICK) |
| L93: DPA "categorical assertion" about dynamics | **CONFIRMED** | "none of them capture the true, natural sound of the kick drum as a condenser microphone can." (DPA-KICK) |
| L8: Shure Recording Drums Part 1 (tuning before miking) | **CONFIRMED** | "A poorly setup and tuned drum kit, will only ever produce a disappointing result; no matter what trickery you apply with microphone placement and mixing techniques." Date "November 06, 2022". (S-REC1) |
| L12: Yamaha ZG01 phantom precautions | **CONFIRMED** | "Do not connect/disconnect a cable to or from the [MIC IN] jack on the rear panel while this switch is on. Before turning the switch on/off, turn the mic gain [M] knob all the way down and the mic mute [m] button on." (YMH-ZG01) |
| L68: cardioid rejects most directly behind; supercardioid has a rear lobe, maximum rejection off the rear axis | **CONFIRMED** | "While the cardioid is least sensitive at the rear (180 degrees off-axis) the least sensitive direction is at 126 degrees off-axis for the supercardioid … they have some pickup directly at the rear, called a rear lobe." (S-LIVE p.9). Numbers differ from S-B52-UG (see D2). |
| L15: e 902 and D112 MkII are cardioid | **CONFIRMED** | e 902 "Pick-up pattern cardioid"; D112 MkII "Polar pattern Cardioid". |

Survey items (lab1.md) answered: the Beta 91A pattern IS stated by Shure (half-cardioid);
"modified supercardioid" IS Shure's wording (alongside "Supercardioid" in the spec field).

## f. Lesson reference URLs

| Ref | URL resolves? | Notes |
|---|---|---|
| [1] DPA kick article | Yes, 200, no redirect | Author "Bo Brinck" confirmed. |
| [2] Shure BETA52A guide | Yes, 200 | "Version: 3.1 (2023-I)", matches the lesson. |
| [3] Sennheiser e 902 2019 PDF | **No. DEAD.** 302 then 301 then **404** | Archived copy (2024-05-30) read. Current manual: SN-902-DOC (v1.3, 04/2026), which drops the "turn away" note. Replace the link. |
| [4] Shure BETA91A guide | Yes, 200 | "Version: 3.1 (2021-B)", matches. |
| [5] Shure two-mic article | Yes, 200 | Dated June 25, 2026, matches. |
| [6] DPA polarity, phase and delay | Yes, 200 | Content not re-audited in this geometry pass. |
| [7] AKG D112 MkII page | **UNREACHABLE from this machine** (403) | Probably bot protection; the AKG cutsheet (AKG-CUT) carries the same specs and is reachable. Owner to open it in a browser. |
| [8] CDC NIOSH | Yes (200 via WebFetch; 403 to plain curl) | Date "Jan. 31, 2024", matches. |
| [9] Yamaha ZG01 | Yes, 200 | |
| [10] Shure Recording Drums Part 1 | Yes, 200 | Dated November 06, 2022, matches. |
| [11] Shure live sound PDF | Yes, 200 | |
| [12a] DPA 3:1 rule | Yes, 200 | Content not re-audited. |
| [12b] Shure Recording Drums Part 5 | Yes, 200 | Content not re-audited. |

## g. Other placement facts the geometry uses

| Fact | Value | Source | Checked | Confidence | Notes |
|---|---|---|---|---|---|
| Internal boom-mounted mic, lateral position | "Mount microphone on boom arm inside drum a few inches from beater head, about 1/3 of way in from edge of head (Position D); or place surface-mount microphone inside drum, on damping material, with microphone element facing beater head" | S-LIVE, "3. Bass drum (kick drum)" | 2026-10-04 | High | "1/3 of way in from edge" on a 279.4 mm nominal radius = (2/3) × 279.4 mm from centre, about 186.27 mm (my arithmetic and rounding; the direction from centre is not stated). "A few inches" has no number. |
| Off-centre pickup | "Placing the mic off center will pick up more overtones." | S-LIVE, same item | 2026-10-04 | High | |
| Damping location | "NOTE: To create a tighter sound with more "punch," place a pillow or blanket on bottom of the drum against the beater head." | S-B52-UG p.4 | 2026-10-04 | High | Pillow size and shape: UNKNOWN. S-LIVE gives the same advice ("Put pillow or blanket on bottom of drum against beater head"). |
| Beta 52A general placement rules | "Aim the microphone toward the desired sound source and away from unwanted sources." "Place closer to beater head for more attack, further away for more resonance." | S-B52-UG p.3 | 2026-10-04 | High | |
| Placing mic just outside the resonant head | "Sometimes placing a kick drum mic just outside the drum, on the edge of the resonator head, gives more impact." | DPA-KICK | 2026-10-04 | High | No distance given. |
| Room/kit stereo pair | "a stereo kit of omnidirectional microphones placed approximately 1 meter in front of the kit, low, in front of the kick drum" | DPA-KICK | 2026-10-04 | High | Out of scope for M01 geometry; noted for M10/M11. |
| Kick level warning | "It is not unusual to see levels in excess 156 dB at close range." | DPA-KICK | 2026-10-04 | High | DPA's wording ("in excess 156 dB"). No measurement method given. |

## h. Damping pillow (owner 2026-10-04: "use a standard kick pillow")

| Fact | Value | Source | Checked | Confidence | Notes |
|---|---|---|---|---|---|
| Pillow made for an 18 in deep kick | "Fits 18″ depth kick drums" | DW-PILLOW (maker page) | lead, 2026-10-04 | Medium | DW gives no dimensions. |
| Pillow size (length × width × height) | 18.1 × 15.8 × 4.8 in = 459.7 × 401.3 × 121.9 mm (conv.) | DW-PILLOW (retailer listing) | lead, 2026-10-04 | Medium (retailer, not maker) | Drawn length along the drum axis, resting on the shell bottom against the batter head (S-B52-UG: "place a pillow or blanket on bottom of the drum against the beater head"). Its 18.1 in is longer than the 18 in inside depth: a soft pillow, drawn pressed between the heads (1 mm short of each head plane). |
| Cross-check | "Standard Size 17"x11"", 3 in thick | KICKPRO | lead, 2026-10-04 | Low (thickness retailer) | Another standard pillow is a little smaller and thinner; the DW size is drawn. |

## Disagreements log (both sides kept; nothing resolved by guessing)

- **D1, Beta 52A pattern name.** Shure spec field: "Supercardioid". Shure description and features:
  "modified supercardioid". Both are on Shure's current pages. Owner decides which label the
  lab shows; the plotted shape must come from Shure's "Typical Polar Patterns" figure
  (S-B52-UG p.6: 250/500/1000 Hz and 2500 Hz), never a textbook supercardioid.
- **D2, supercardioid null angle.** S-B52-UG p.4: "greatest sound rejection at points 120°
  toward the rear". S-LIVE p.9: "126 degrees off-axis for the supercardioid"; S-LIVE body
  text elsewhere: "125 degrees off-axis"; S-LIVE glossary: "126 deg. from the front …
  54 deg. from the rear", rear rejection "-12 dB for the supercardioid". Three Shure numbers.
- **D3, Beta 52A size.** Product data 94.0 / 162.0 / 113.0 mm versus guide drawing 3.750 /
  6.406 / 4.451 (unitless; as inches 95.25 / 162.7124 / 113.0554 mm). Up to 1.25 mm apart.
- **D4, Aquarian offset port.** AQ-COLL: "4 ¾" offset port". AQ-RSM product page: "4.25" Reinforced Mic Port".
- **D5, e 902 frequency response.** Same sheet: "20 - 18,000 Hz" and "40 Hz – 16,000 Hz".
- **D6, e 902 "turn away" note.** In the 2019 PDF; missing from the 04/2026 online manual.
- **D7, DPA 4055 length/weight.** DPA: 132 mm, 241 g. Retailer snippet: 102 mm, 250 g. DPA used.
- **D8 (already in the lesson), SPL inside versus outside.** DPA: higher "just outside the hole";
  Shure Beta 52A: 5 to 7.5 cm from the batter head is the "highest sound pressure level" of
  its listed choices.

## Simplifications register (to be extended by the build)

- Nominal sizes (22 in, 18 in) are drawn as real shell dimensions; the true shell OD is UNKNOWN.
- Heads are drawn as flat planes at the shell ends (bearing-edge and collar geometry ignored).
- Microphone outlines are simplified silhouettes at sourced overall dimensions (see the
  geometry proposal); distances are measured to a stated reference point, not the acoustic
  centre (lesson L39).
- HOW IT SOUNDS (journey stage 2, 2026-10-04):
  - Head motion is drawn as the IDEAL membrane's lowest shape, J0(2.405 r/R), EXAGGERATED
    (55 mm batter, 40 mm front at the centre; a real head moves a small fraction of that). The
    rest plane stays drawn; the canvas says "MOTION EXAGGERATED" and the badge says so.
  - The strike-sequence arrows and arcs show the ORDER and DIRECTION of events only — never a
    speed, a pressure or a level. PLAY ONCE is a staged reveal at 1.3 s per event, a teaching
    pace, not the drum's timing (which takes milliseconds).
  - The face-on head shapes are the ideal clamped membrane in a vacuum (MEMBRANE row in the
    lesson's sources: the Cymatics / Drum Tuning Bessel tables). Air loading and the second
    head shift the real ratios; the page says so. "Under the beater" = |W at the strike| ÷ the
    shape's own peak — a geometric share, not an excitation level.
  - The two-head pair is drawn with EQUAL head motion (a symmetric ideal); the ordering
    (heads together = lower, heads opposed = higher and the stronger radiator) is the Drum
    Tuning engine's coupledModes, pinned by test/mikingJourney.test.ts.
  - Attack versus body is in WORDS only: no curve, no time scale (LESSON_JOURNEY §11 q2).
- THE SETTING (journey stage 3): every position on the kit plan is ILLUSTRATIVE (a typical
  right-handed layout; no source gives one). Neighbour sizes are common nominal sizes (14 in
  snare and hi-hat, 12 in rack tom, 16 in floor tom); the throne, rug and room are generic.
