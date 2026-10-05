# Miking Labs, Lab 2 Idiophones — Batch 2 research summary (I01–I12, 24 lessons)

Date: 2026-10-05. Researcher: Claude (technical-reference pass; no app code, no sub-agents).
Model: `kick/SOURCES.md` + `kick/GEOMETRY_PROPOSAL.md`, `BATCH1_RESEARCH_SUMMARY.md`, `BATCH4_RESEARCH_SUMMARY.md`.
Owner ruling applied: the app shows only suggested starting points; these docs stay exact and
sourced; every UNKNOWN the picture needs has a **drawing default, not a published figure**.

Folders (each: SOURCES.md + GEOMETRY_PROPOSAL.md): `hihat/ ride_cymbal/ crash_cymbal/ splash_cymbal/
china_cymbal/ cajon/ shaker/ egg_shaker/ maracas/ headless_tambourine/ cowbell/ claves/ woodblock/
guiro/ triangle/ finger_cymbals/ bar_chimes/ vibraphone/ marimba/ xylophone/ glockenspiel/ rhodes/
wurlitzer/ gong/`. Key registers: **Lab 2 general keys → `hihat/SOURCES.md` §0**; mallet family →
`vibraphone/SOURCES.md` §0–§1; small-percussion common rows → `shaker/SOURCES.md` §0.

## 1. Readiness per lesson

| Pri | Lesson | Readiness | Blocked on / owner decisions |
|---|---|---|---|
| 1 | I01a Hi-hat | **READY** (reuses `cymbalSpec.ts` unchanged) | Six published close starting points verified, all different geometries (DPA 5–10 cm; Shure ≤ 4 in; Shure 10–15 cm at the far edge from the snare; Shure live "a few inches over edge away from drummer"; Shure "just below the cup"; e 914 "a few centimetres above the outer edge"). Owner: which to show; stick/hand envelope; rock ±4°, gap-plane ±15 defaults. |
| 2 | I01b Ride | **READY** | Shure "a foot or two above" (304.8–609.6) is the only number; spot/under bands are drawing defaults. |
| 3 | I01c Crash | READY, numberless | No published distance anywhere; all bands drawing defaults (lesson says so). |
| 4 | I01e China | Buildable, defaults | New CHINA_18 profile is wholly drawing default (lip, cup, valley); Hamilton's "about an inch above" the valley gives one strike point. |
| 5 | I01d Splash | Buildable, defaults | SPLASH_10/8 sourced; arm, piggyback (Barata configs sourced), stack (FX Stacks sourced) geometry defaults. Stack = hardest art; ship arm first. |
| 6 | I07 Vibraphone | **READY** (defines the mallet-bar family) | Adams Concert gives range, bar widths, length, low/high-end depth, height, motor rpm — one page. Bar lengths, fan geometry, hBars = defaults. |
| 7 | I08 Marimba | **READY** | Adams Alpha 5.0 full footprint; Yamaha lowest bar 80 × ~620 mm; Helmholtz bass (C2 quarter-wave 1306 mm > bar height — explains it). Text fix (near-coincident). |
| 8 | I09 Xylophone | **READY** | YX-500R; Jenks PDF (dead link, archive read) bans plastic mallets while another Yamaha page recommends plastic → contradiction to state. |
| 9 | I10 Glockenspiel | **READY** | YG-2500 manual (pedal, gas spring, 32.5 × 9 bars) + Adams hand-damped + YG-1210 case. Shure 4–6 in sits inside the mallet path — show the conflict. |
| 10 | I11a Rhodes | **READY** (speaker family reuse) | Physical-source flag resolved (1979 service manual + MK8 manual replace the V8 plug-in manual). Suitcase speaker layout only Low → not drawn. Default rig: Stage 61 → '65 Deluxe Reverb combo. Stage 61 size UNKNOWN. |
| 11 | I11b Wurlitzer | Buildable, defaults; **case size UNKNOWN** | Two 4×8 oval speakers (Vintage Vibe), 200 rail vs 200A lid sourced; service manual is image-only (no quotes possible). Needs one new oval driver in the speaker family; grille positions measured from a real 200A would close it. |
| 12 | I02 Cajón | **READY** | Grinnell's measured cajón (12.5 × 12.5 × 18.9 in, 7-in port). Shure 6–7 in "dead center" vs White 30–40 cm; rear: inside the hole (clamp only) vs 20 cm at 45°. Port height default. |
| 13 | I04 Headless tambourine | **READY** (reuse M08 scene + head switch) | Reference point resolved (proposal: from the instrument, Shure's words; stroke distance = clearance readout). |
| 14 | I03a/b/c Shaker, egg, maracas | READY, defaults | Only Grinnell maraca lengths are sizes; Meinl prints none. Yamaha's 8-in (player-to-mic) row added. |
| 15 | I05a–d Cowbell, claves, woodblock, güiro | READY, defaults | Cowbell 7 in length (Meinl), güiro 15 in (Met); PAS woodblock orientation (opening to the audience) new. |
| 16 | I06a–c Triangle, finger cymbals, bar chimes | READY, defaults | Triangle sizes/beaters/hold sourced (Grover, PAS); Met tal sizes; PAS mark-tree 12–16 in. Dance envelope = owner. |
| 17 | I12 Gong | Buildable, defaults | Paiste sizes and free-swing rule, Met luo size, TMGS-3 limit sourced; swing amplitude, stand frame, strike point defaults. Add a hearing line. |

## 2. Corrections to the lesson texts

All lessons: strip "Pro Audio Training Academy", "Student …" (house rule). Survey flags resolved:
- **Near-coincident vs coincident (Marimba L76, Xylophone L74)**: Shure lists the 135° grilles-together
  pair under "Coincident Techniques … Example: 135° angling (X-Y)" → say "coincident". (Glockenspiel's
  near-coincident suggestion is the lesson's own, fine.) Shure's 1½ ft / 2 ft = 45.72 / 60.96 cm —
  keep "about".
- **Missing clearance numbers**: confirmed — no source gives any stick/mallet/hand clearance. The
  geometry files give drawing-default envelopes; the app must label them as such.
- **Rhodes plug-in source**: [2] is the V8 *software* manual (and the text is on p. 6, not 7). Replace
  with the 1979 Rhodes Service Manual ("modified tuning forks … Tone Bar Assemblies … adjacent to an
  adjustable Pickup") and the MK8 User Manual (steel tines/tonebars, alnico pickups, XLR "MIC level").
- **I04 reference point**: use one term. Proposal: "from the instrument" (Shure, both booklets) for
  the 15–30 cm start; "nearest stroke/movement" = clearance. Yamaha's 8 in is player-to-mic.
- **I04 DPA wording**: the Jonas tour used ONE 4011A "as a direct source for shakers and tambourine".
- **I04 Meinl [3]**: the page says solid brass, 1 and 2 rows — not "brass, bronze and plated steel".
- **I04 hearing/phantom/no-feedback lines**: add. **Gong**: add a hearing line.

Wrong or incomplete facts:
- **Hi-hat**: Shure gives BOTH snare-mic strategies ("aim the null of the snare mic towards the hi-hat"
  and "angle snare drum microphone slightly toward hi-hat") — it is not "Shure vs LEWITT". e 914 PDF
  [6] dead → online manual (same text). Shure 10–15 cm wording: "directly down at the edge on the far side".
- **Ride**: the "unnamed small condenser" is named (KSM109 → KSM137, S-BEYOND). The "4015 tucked
  underneath every single cymbal" quote is about *Bad Cinderella*, not *& Juliet* (same article).
- **Cajón**: Shure's front mic is "dead center"; White's rear mic is at ~45° from one side; Slaptop port
  is "upward facing front port"; refs [5]/[8] duplicate.
- **Shaker [1]**: Meinl pages are Small/Large ("Perfect for live and studio playing"), not Studio/Live.
- **Cowbell [5], Woodblock [5]**: DPA names the overhead model (2011C).
- **Marimba L7**: "especially on thin low-register bars" is not on Yamaha's mallet page.
- **Xylophone [5]**: dead link (archive read); it says "Plastic mallets damage bars and must be
  avoided!" — a direct contradiction with Yamaha's "on rosewood xylophones, use plastic, not metal".
- **Glockenspiel**: Shure's 4–6 in row is in both booklets; YG-2500 page has "4 1/3" and "3 1/3"
  octaves (3 1/3 is right), manual says 3 1/2.
- **Claves / Finger cymbals**: the PAS extracts' footers read "Volume I" (lessons say pp. "in PDF
  pagination" / "Volume II").
- **Triangle**: "heavy metal instrument" → an 8-in steel triangle is ≈ 0.6 kg (DERIVED).
- **Wurlitzer**: 200A release 1974 (Tropical Fish) vs 1975 (Vintage Vibe); the service manual has
  no text layer — its high-voltage citation cannot be quoted until read as images.
- **Rhodes**: 2–15 cm is Shure's amplifier figure (PGA27), measured by the lab from the grille.

## 3. Shared families (build once)

1. **Cymbal family — REUSE `miking-w2` `lessons/shared/cymbals/cymbalSpec.ts` unchanged** (14-in hat
   pair, clutch, air ring, 16/18 crashes, 20 ride, boom stands, swing). Add: `SPLASH_10`/`SPLASH_8`,
   `CHINA_18` (new profile: cup, valley, upturned lip; upright/inverted), stack/piggyback mounts, MC-CY2
   arm; stick envelope from VF-5A (406.4). Hat zones in frame K use the kit plan's hat/snare positions.
2. **Mallet-bar family** (`vibraphone/GEOMETRY_PROPOSAL.md` §A): frame M; one parameter row per
   instrument (range on the 88-key scale, wLow/wHigh, t, frame length + low/high-end depth, hBars);
   keyboard layout rule; DERIVED quarter-wave resonators L = c/4f (CALC-C, A = 442) with Helmholtz
   bass boxes and the "visible pipe ≠ pitch" rule; damper/pedal, fans/motor, case/lid, gas spring;
   mallet envelope (17-in mallets, raised height default); Shure spaced 457.2/609.6 and coincident 135°.
3. **Small-percussion family** (`shaker/GEOMETRY_PROPOSAL.md` §A): frame H, standing player, `P0`
   playing-zone centre, per-instrument motion envelope, two-position comparator, Shure ≥ 304.8 ring,
   Yamaha 8-in player point, motion-direction toggle, peak meter. Rows: shaker, egg, maracas, cowbell,
   claves, woodblock, güiro, triangle, finger cymbals, bar chimes; the tambourine reuses M08 + head switch.
4. **Speaker family — REUSE `miking-w5` `lessons/shared/speakers/`** (frame C, cone spots, cabinets) +
   the C02 '65 Deluxe Reverb combo for Rhodes; ADD one oval 4×8 driver for the Wurlitzer, a keyboard
   body, and the signal-path tracer with blocked speaker-output → mic/DI patches.
5. Small new pieces: box idiophone (cajón; port on any face, Slaptop variant); gong frame (stand, cord
   suspension, swing volume, three gong types).

## 4. Builder grouping (5)

1. **Cymbals** — I01a hi-hat (first), ride, crash, China, splash (on the w2 cymbal family; stack last).
2. **Mallet keyboards** — I07 vibraphone (defines the family), I08 marimba, I09 xylophone, I10 glockenspiel.
3. **Electric pianos** — I11a Rhodes, I11b Wurlitzer (on the w5 speaker family + keyboard + tracer).
4. **Hand percussion** — I02 cajón, I03a/b/c shakers/egg/maracas, I04 headless tambourine (M08 reuse),
   I05a–d cowbell/claves/woodblock/güiro (small-percussion family).
5. **Suspended metal** — I06a triangle, I06b finger cymbals, I06c bar chimes, I12 gong (hanging /
   swinging envelopes; dance route; gong frame).

## 5. Sources not reachable today

Sennheiser e 914 PDF (404; archive + identical online manual read); Yamaha "Percussion Tips" (Jenks) PDF
(404; archive read); The Met web pages (429; Collection API used); NIOSH bulletin (403 to curl; WebFetch
read); Wurlitzer service manual (reachable, image-only); Schlagwerk cajón product pages (not found —
retailer sizes Low, not used); Rhodes Suitcase speaker layout (retailer only, Low, not drawn); Zildjian
finger-cymbal diameters and Meinl small-percussion sizes (not printed). No SOURCED geometry depends on an
unreachable page.
