# Microphone Selection Lab — Illustration Research & Build Specs

Research-grounded, **brand-neutral** archetype specs for redrawing the 12 mic
illustrations (`micArt.tsx`). Real models are named ONLY to ground proportions
and texture — **no logo, badge text, or single-model trade dress is reproduced**
(standing rule: "All mics are FICTIONAL — no brand likenesses, ever", visual
standards 2026-07-29). Canvas is the existing normalized **100 wide × 150 tall**
space; detail is tuned to still read at card/chip sizes.

Legend per type: **Basis** (3 grounding refs) · **Proportions** (real → aspect)
· **Silhouette/features** · **Grille/texture** · **Palette** · **Build (100×150)**.

---

## 1. Dynamic — Moving-Coil Handheld
- **Basis:** classic spherical-grille stage vocal · neodymium supercardioid handheld · broadcast/announcer handheld.
- **Proportions:** ~160–180 mm × 50–52 mm ball / 30–35 mm barrel → **~3.4:1**. Ball is the widest point; barrel tapers slightly to the XLR base.
- **Silhouette/features:** steel mesh ball on a gently tapered barrel; short collar/nut joins ball→body; slightly flared XLR base; optional lower on/off switch; thin ID ring near base; blank oval badge.
- **Grille/texture:** domed spherical mesh — read as a soft speckled/cross-hatch sphere with a brighter apex highlight, not individual holes; bright rim where ball meets collar.
- **Palette:** `#1c1e22 #2b2f36 #3d434c #5a616b #8b929c #c9ced6`(hi).
- **Build:** ball circle cx50 cy32 r26 (y6–58); collar band y56–64 x28–72; barrel top x30–70 @y64 → x33–67 @y140, base flare y140–148; ball 45° cross-hatch + radial stipple, apex highlight ~(42,20); body left highlight stripe x40–46, right-edge shadow x64–70; ID ring y≈122; two XLR pin dots at base.

## 2. Condenser — General Studio (mesh head)
- **Basis:** large-diaphragm cardioid workhorse · transformerless LDC · multi-pattern LDC in shock mount.
- **Proportions:** body ~130–160 mm × 55–60 mm → **~2.5:1** (stockier than handheld). Head basket = top ~35–45%.
- **Silhouette/features:** straight cylindrical body, flat/domed top; front-address capsule faces viewer; thin bright bevel rings top+bottom; pad/low-cut switch icons; blank front badge; XLR base. (Standalone body — shock mount reserved for the LDC entry.)
- **Grille/texture:** flat/cylindrical dual-layer wire mesh reading as a fine regular grid; horizontal seam separating head from solid lower body; grille panel lighter than body.
- **Palette:** `#17191d #26292f #363b42 #565d67 #9aa1ab #d7dbe1`(hi).
- **Build:** body rounded-top rect x30–70 y30–132; head basket y30–74 fine 2px grid + center vertical sheen x44–56; seam y74; lower body y74–132 (hi stripe x34–40, shadow x62–68); blank badge circle (50,92) r5; XLR base x36–64 y132–142.

## 3. Electret — Small-Capsule
- **Basis:** ½" pencil SDC · reference pencil w/ detachable capsule · consumer clip/stick electret.
- **Proportions:** pencil ~110–160 mm × 19–20 mm → **~7:1**; clip variant = short ~10 mm round can.
- **Silhouette/features:** long thin uniform cylinder, small end-address grille cap; thin knurled ring at capsule/body joint; one blank engraved band; XLR base (pencil) or thin exit cable (clip).
- **Grille/texture:** small circular end cap of fine perforation/mesh — read as a lightly stippled / concentric-ring disc at the tip; body smooth satin.
- **Palette:** `#191b1f #292d33 #3b4048 #5c636d #98a0aa #cfd4db`(hi).
- **Build:** slim tube x42–58 y18–140 (rounded ends); capsule cap y18–34 concentric-ring/dot texture; knurled ring y34–37; body hi stripe x44–48, shadow x54–58; engraved ring y100; XLR pins x44–56 y138–146. Keep narrow/centered.

## 4. Ribbon — Studio
- **Basis:** slim "bar-of-soap" body w/ wraparound mesh window · "dumbbell" twin-lobe classic · tall tapered cylindrical studio ribbon.
- **Proportions:** slim archetype ~150–200 mm × 25–30 mm → **~5.5:1–6.5:1**.
- **Silhouette/features:** long rounded-end cylinder, constant dia; single WIDE horizontal mesh band on the upper third (side-address); knurled base collar; side/bottom XLR; often a suspension ring, hung slightly nose-down.
- **Grille/texture:** NOT a ball — a flat/curved wraparound fine-woven mesh window; read as a recessed lighter matte-grey panel with faint vertical wire lines + subtle horizontal weave.
- **Palette:** `#2b2e33 #3a3e44 #4b5058 #6a7079 #0e0f12`(mesh shadow) `#9aa0a8`(hi).
- **Build:** body y18–132 x39–61 (w22, rounded caps r11); mesh window y28–60 full width, recessed, 6–8 faint verticals + weave; blank badge oval y70 (~14×7); base collar y118–132 w/ 3 knurl ticks; left hi strip x≈41, right shadow x≈59; XLR nub bottom-center.

## 5. LDC — Large-Diaphragm Condenser (in shock mount)
- **Basis:** tall rounded-rect headbasket over slim body · squarer flat dual-layer grille · fatter bottle/cylindrical tube style.
- **Proportions:** ~200 mm × 56 mm → **~3.5:1** bare; with shock mount visual footprint ~1:1.5 (mount nearly as wide as mic is tall).
- **Silhouette/features:** straight body; upper third = rounded-corner rectangular wire headbasket (side-address, capsule faces viewer); pattern-select switch; blank rectangular front badge; trim ring below head; suspended in an elastic shock-mount cradle (outer yoke ring + crossed elastic bands + knurled tension collar).
- **Grille/texture:** dual-layer flat mesh over vertical+horizontal ribs → dark cross-hatch grid with slight sheen, rounded corners; horizontal seam at head/body.
- **Palette:** `#26282c #34383d #474c52 #5e646c #0c0d10 #aeb4bc`(hi); elastic `#7c828a`.
- **Build:** body x37–63 y22–118; headbasket y22–58 cross-hatch (5V+6H, fill `#0c0d10`); trim ring y60; badge y72 (~12×6); pattern dot y88; shock mount: outer U-yoke ellipse ~x17–83 centered y≈78, arms angling to base stem y128–150, 3 elastic strands each side to a collar at y≈95.

## 6. SDC — Small-Diaphragm "Pencil" (end-address)
- **Basis:** short compact pencil · longer thin pencil w/ stepped capsule + switch band · plain generic pencil.
- **Proportions:** ~105–160 mm × 19–22 mm → **~5:1–8:1** (slenderest condenser).
- **Silhouette/features:** straight thin cylinder, end-address; slightly wider capsule head on a narrower barrel w/ visible step/seam; optional pad/roll-off switch band; blank ring badge; XLR base; side spring clip. Reads most metallic/chrome of the three condensers.
- **Grille/texture:** short cylindrical mesh cap at the tip (fine perf/woven), maybe a small side window; read as a small dark textured/dotted band at top; body smooth polished.
- **Palette:** `#2e3136 #3e434a #565c64 #787e86 #0d0e11 #c2c7ce`(chrome hi).
- **Build:** tube x43–57 y15–135; capsule head y15–34 slightly wider x42–58, seam y34, dotted/perf cap; switch band y70; badge ring y90; strong chrome hi stripe x≈46, shadow x≈55; XLR collar y128–135; optional side C-clip at y≈100 right edge. Make it the thinnest/tallest silhouette.

## 7. Lav — Lavalier (clip-on)
- **Basis:** flat-topped broadcast lozenge · tiny cylindrical omni w/ domed grille · sub-miniature bead lav.
- **Proportions:** capsule ~2.5–4 mm × 12–16 mm → **~3.5:1–5:1**; cable ~1–1.6 mm; capsule:cable ≈ 3:1; clip ~15–20 mm.
- **Silhouette/features:** small vertical capsule (flat-top rounded-rect OR domed cylinder); cable exits base-center, curves away; optional two-jaw clip or foam ball windscreen (~8–12 mm, 2–3× capsule dia).
- **Grille/texture:** fine perforated cap / ring of small holes near the top — a small dotted/mesh zone, not a full basket.
- **Palette:** `#0e0f12 #1c1e24 #2b2e36 #3c4048 #6e747e`(hi) `#0a0b0d`(cable shadow).
- **Build:** capsule rounded-rect cx≈50 top y35 w20 h60 r8; domed cap arcs y35→28; grille = 3 dot rows r≈1.5 y40–52; cable exits (50,95)→(62,120)→(48,150) 2px; optional foam ball (50,32) r14 speckle; hi stripe x≈44 y38–90, shadow x≈58.

## 8. Headworn — Earset
- **Basis:** rigid curved boom w/ defined capsule ball · ultra-thin springy near-invisible boom · subminiature single ear-loop earset.
- **Proportions:** ear hook ~30–40 mm arc (wire 1.5–3 mm); boom ~100–115 mm; capsule 3–5.4 mm → boom:capsule ≈ 20:1.
- **Silhouette/features:** hook curls behind/over the ear (C / question-mark), transitions into a long thin boom sweeping forward-down to a small capsule near the mouth; ONE continuous slim curve; small foam ball (5–9 mm) optional. No solid body.
- **Grille/texture:** capsule = tiny cylinder/ball w/ a small mesh cap or single port dot.
- **Palette:** `#111318 #20232a #33373f #4a4f58 #82888f`(hi) `#d8c9b4`(optional tan variant).
- **Build:** ear hook C-curve right side (78,40)→(90,55)→(84,78)→(70,86) stroke 3; boom cubic (70,86)→(48,92)→(30,100)→(16,104) stroke 3→2 taper; capsule cap (14,105) r5, optional foam r8 speckle; 1px light stroke on upper edge, 1px dark on lower edge. All strokes, no solid body.

## 9. Shotgun — Interference Tube
- **Basis:** matte-black slotted short shotgun (film/TV icon) · smooth cylindrical short shotgun · slightly longer short shotgun.
- **Proportions:** ~210–280 mm × 19–22 mm → **~12:1–14:1** (very long/thin). Slots occupy front ~60–70%; rear ~30% barrel slightly wider.
- **Silhouette/features:** long straight cylinder; front two-thirds slotted interference tube; rear third smooth barrel w/ a subtle step-up to XLR; nose flat/gently rounded; optional long fuzzy/foam windscreen sleeve (1.5–2× dia).
- **Grille/texture:** signature two rows of long narrow capsule-ended slots cut lengthwise, evenly spaced; slot interiors black.
- **Palette:** `#0c0d10 #17191e #24272e #33373f #5a5f68`(hi) `#000000`(slot).
- **Build:** vertical tube (40,15)→(60,135) w20, nose r10 top; rear barrel widens to w24 y105–135; slots = two columns x≈45 & x≈55, each 2px×8px rounded rect fill `#000`, every 12px y25–100 (~7/col); step line y105; left-edge hi x≈41, right-edge shadow band x≈58; optional windscreen capsule (32,10)→(68,120) fuzzy speckle 40% opacity.

## 10. Boundary — PZM / Plate
- **Basis:** canonical large boundary plate w/ hemispherical capsule wedge · compact square-plate variant · modern low-profile flush installed boundary.
- **Proportions:** plate ~152×127×19 mm (very thin vs width); capsule/wedge rises only ~8–15 mm. Side view = long flat slab; top view = rect/disc (~6:5).
- **Silhouette/features:** flat rigid plate + small angled wedge (or low dome) near an edge/center; capsule faces sideways/down into the boundary gap; thin XLR/cable stub from one edge; one or two screw dots.
- **Grille/texture:** no basket — a thin dark 1–3 mm slot between wedge underside and plate is the entry (may show a tiny mesh); plate face smooth.
- **Palette:** `#1c1f24`(plate) `#2a2e35`(bevel) `#3c4149`(wedge) `#5a6069`(hi edge) `#0f1114`(slot) `#8a9099`(spec).
- **Build:** plate top-face polygon x18–82 y70–104 + 6–8px front bevel to y112 (darker); wedge low triangular prism ~x50 base y74→88 apex ~14px front `#3c4149`; dark slot y87–90 `#0f1114`; 2px spec highlight along top-back edge; screw dots (28,100)(72,100); cable thin line from right edge y100 curving to y140. Keep LOW/horizontal.

## 11. Measurement — Test Rod
- **Basis:** ubiquitous budget omni test mic · electret measurement w/ stepped capsule + cal ring · reference-grade ultra-thin barrel w/ exposed tip capsule.
- **Proportions:** ~12–21 mm dia × 150–250 mm → **~12:1–18:1** (thin straight rod); capsule tip often a slightly smaller step; XLR base ~19 mm.
- **Silhouette/features:** straight slim uniform cylinder; small rounded tip cap (capsule); slightly wider XLR base; thin bright calibration ring near top; no basket/swivel.
- **Grille/texture:** tip = small perforated dome / flat cap w/ a tiny circular port screen; sometimes a thin protective ring; barrel smooth satin.
- **Palette:** `#17191d #23262c #3a3f47 #6b7178`(hi stripe) `#9aa0a8`(cal ring/tip) `#0c0d10`(base shadow).
- **Build:** rod x44–56 y18–132; cylinder shading fill `#23262c`, left band x44–47 `#3a3f47`, 2px spec stripe x52 `#6b7178`; tip capsule x46–54 y18–28 rounded dome + mesh dot y20 `#9aa0a8`; cal ring y34–37 `#9aa0a8`; base widen x41–59 y126–138 `#17191d` + `#0c0d10` bottom shadow. Read = "thin straight test rod."

## 12. Contact — Piezo Pickup
- **Basis:** bare 35 mm brass piezo disc + leads · 27 mm disc · encapsulated adhesive transducer w/ cable to ¼" jack.
- **Proportions:** disc 20/27/35/41/50 mm (27 & 35 typical); central ceramic ≈ 60–75% of outer dia; wafer-thin. Silhouette = a flat coin + thin trailing cable.
- **Silhouette/features:** flat round wafer face-on; outer brass rim ring + inner ceramic circle; tiny center solder blob; two thin wires (one warm, one dark) OR a single cable trailing to a small jack.
- **Grille/texture:** no grille — concentric two-tone: brass ring, ceramic disc (matte, faint radial/speckle), center solder dot.
- **Palette:** `#7a5a22`(brass rim) `#a47d34`(brass hi) `#b8bcc0`(ceramic) `#8b8f94`(ceramic shade) `#2a2c30`(solder/cable) `#c24a3a`(accent wire).
- **Build:** disc center (50,58); outer brass circle r34 (`#7a5a22`, `#a47d34` top-left arc hi, `#5e4419` btm-right shade); inner ceramic r22 (`#b8bcc0`, `#8b8f94` lower-right crescent); center solder dot r3 `#2a2c30`; two wires from rim near (66,82) — one `#c24a3a`, one `#2a2c30` — curving to a ¼" jack rect x54–66 y128–140 `#3a3d42` + `#9aa0a8` sleeve hi. Read = "flat sensing disc on a cable."

---

### Compliance & scaling notes
- **Brand-neutral:** every spec above is proportion/geometry/texture only. Badges stay blank; no logos; no single model's exact silhouette or trade dress. Named models are grounding references, not copy targets.
- **Chip legibility:** fine mesh/slots are drawn as low-contrast texture that collapses gracefully at ~56×84; the silhouette + one hero detail (ball, headbasket, tube slots, plate wedge, disc) carries recognition at small size.
- **Quality bar:** same detail treatment as the reworked Dynamic proof — cylindrical/radial shading, rim highlights, contact shadow, one specular hotspot per metal head.
