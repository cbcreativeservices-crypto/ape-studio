# Cable & Connector Lab — Artwork Prompts: SCENES & DIAGRAMS

Companion to `docs/art/APE_CABLE_ART_SPEC_2026_08_16.md` (global style guide,
naming, tiers). Every prompt below is STANDALONE — paste as-is into the image
tool. All images in this file: PNG, transparent background, **1600×1000**.

Facts sourced ONLY from the verified lab data:
`src/screens/lab/cable/data/lesson02.ts` (anatomy terms + the seven peel
sequences), `lesson09.ts` (inspection vignettes), `testerCables.ts` (tester
wiring maps), `lesson11.ts` (challenge equipment lists), and the verified
connector records (`connectors.*.ts`).

| Group | Files | Count |
|---|---|---|
| Anatomy hero (L2) | `anatomy__exploded.png` | 1 |
| Cross-sections (L2) | `xsec__<sectionId>.png` | 7 |
| Inspection vignettes (L9) | `l09__<itemId>.png` | 12 |
| Tester wiring traces (L10) | `l10__<cableId>.png` | 8 |
| Challenge layouts (L11) | `l11__show-a.png`, `l11__studio-b.png` | 2 |
| **Total** | | **30** |

---

## 1. Anatomy hero — Lesson 2

### `anatomy__exploded.png`
Mounts: Lesson 2 "Cable & Connector Anatomy" — hero image above the term explorer (connector-side + cable-side vocabulary).

> Professional technical illustration, exploded view of ONE generic cylindrical
> audio cable connector, its parts separated along a single shared horizontal
> axis, transparent background, 1600×1000. The cable enters from the LEFT: a
> round black cable with its end layers step-cut — outer jacket, then a woven
> wire shield, then two insulated conductors in two contrasting generic colors
> (no real-world color code implied), each with a short bare copper tip.
> Continuing rightward along the axis, with small gaps so every part reads
> separately: a ribbed black rubber strain-relief boot; an internal cable-clamp
> strain-relief piece; a knurled nickel-finish metal shell; and a matte-black
> insulator insert carrying round chromed contacts whose open solder-cup
> terminations face back toward the conductors. All parts aligned on one subtle
> centerline. Clean technical-illustration realism — brushed nickel, matte
> black thermoplastic and rubber, no scratches, unbranded, NO text or numbers
> anywhere. Key light upper-left, soft rim light lower-right so dark parts
> separate from a near-black app background.

---

## 2. Cable cross-sections — Lesson 2 (staggered cutaways)

Layer order in each prompt is EXACTLY the lesson's outside→inside peel
sequence. Real-world conductor colors appear ONLY where a verified record
states them (Ethernet pair colors; NA mains cord convention).

### `xsec__balanced_shielded.png`
Mounts: Lesson 2 cross-section card "BALANCED SHIELDED PAIR" (mic / balanced line build).

> Professional technical illustration, staggered-cutaway cross-section of a
> straight round audio cable, horizontal, transparent background, 1600×1000.
> The cable runs left to right; each layer is step-cut and pulled back to
> expose the next, in EXACTLY this order from outside in: (1) matte black
> outer jacket; (2) a woven copper braid shield wrapped around everything
> inside it; (3) color-coded insulation on each of exactly TWO conductors —
> two clearly different generic colors, no specific real-world color code
> implied; (4) the two insulated conductors visibly TWISTED around each other
> as a pair, with a short length of bare copper strand exposed at the
> innermost step. No other layers. Clean technical-illustration realism,
> believable copper and plastic, cut faces flat and clean, no jacket printing
> legible, unbranded, NO text or numbers. Key light upper-left, soft rim light
> lower-right for separation against a dark background.

### `xsec__instrument_unbalanced.png`
Mounts: Lesson 2 cross-section card "UNBALANCED INSTRUMENT CABLE".

> Professional technical illustration, staggered-cutaway cross-section of a
> straight round instrument cable, horizontal, transparent background,
> 1600×1000. Layers step-cut left to right, each pulled back to expose the
> next, in EXACTLY this order from outside in: (1) matte black outer jacket;
> (2) a woven copper braid shield surrounding the single inner conductor;
> (3) one layer of insulation keeping that center conductor centered and
> separated from the shield; (4) ONE small-gauge stranded copper center
> conductor, bare at the innermost step. Exactly one signal conductor — this
> build has no pair. The conductor must read visibly THIN compared to a power
> or speaker conductor. Clean technical-illustration realism, believable
> copper and plastic, flat clean cut faces, no legible jacket printing,
> unbranded, NO text or numbers. Key light upper-left, soft rim light
> lower-right against a dark app background.

### `xsec__speaker_2c.png`
Mounts: Lesson 2 cross-section card "2-CONDUCTOR SPEAKER CABLE".

> Professional technical illustration, staggered-cutaway cross-section of a
> straight round loudspeaker cable, horizontal, transparent background,
> 1600×1000. Layers step-cut left to right in EXACTLY this order from outside
> in: (1) matte black outer jacket; (2) a heavy insulation coat on each of
> exactly TWO conductors — the two told apart by a molded rib or stripe on one
> insulation only, never by printed characters; (3) TWO heavy stranded copper
> conductors, bare at the innermost step, visibly much thicker than any signal
> cable conductor. CRITICAL: there is NO shield anywhere in this build — no
> braid, no foil — and the absence must be plainly visible: jacket opens
> directly onto the two insulated conductors. Clean technical-illustration
> realism, believable copper and plastic, flat cut faces, no legible printing,
> unbranded, NO text or numbers. Key light upper-left, soft rim light
> lower-right.

### `xsec__ac_3c_grounded.png`
Mounts: Lesson 2 cross-section card "3-CONDUCTOR GROUNDED AC CORD".

> Professional technical illustration, staggered-cutaway cross-section of a
> straight round grounded AC power cord, horizontal, transparent background,
> 1600×1000. Layers step-cut left to right in EXACTLY this order from outside
> in: (1) a tough matte black outer jacket, noticeably thicker-walled than a
> signal cable's; (2) individual insulation on each of exactly THREE
> conductors, colored to the North American convention — one BLACK (line),
> one WHITE (neutral), one GREEN (earth) — these three colors are required;
> (3) THREE stranded copper conductors, bare at the innermost step, heavy
> gauge. No shield in this build. The jacket carries NO legible printing (the
> real cord's rating print is not reproduced — no readable characters
> anywhere). Clean technical-illustration realism, believable copper and
> plastics, flat clean cut faces, unbranded, NO text or numbers. Key light
> upper-left, soft rim light lower-right against a dark background.

### `xsec__ethernet_4pair.png`
Mounts: Lesson 2 cross-section card "4-PAIR ETHERNET CABLE".

> Professional technical illustration, staggered-cutaway cross-section of a
> straight round Ethernet cable, horizontal, transparent background,
> 1600×1000. Layers step-cut left to right in EXACTLY this order from outside
> in: (1) a smooth matte outer jacket; (2) FOUR twisted pairs exposed
> together, each pair visibly twisted at its own slightly different rate;
> (3) on the next step one pair opened further to show the color-coded
> insulation — the four pairs use the real Ethernet pair colors: solid ORANGE
> with white/orange-striped mate, solid GREEN with white/green mate, solid
> BLUE with white/blue mate, solid BROWN with white/brown mate; (4) one
> conductor bared to copper at the innermost step — eight copper paths in all,
> working as four pairs. No shield layer in this build. Clean
> technical-illustration realism, flat cut faces, no legible jacket printing,
> unbranded, NO text or numbers. Key light upper-left, soft rim light
> lower-right.

### `xsec__coax.png`
Mounts: Lesson 2 cross-section card "COAXIAL CABLE".

> Professional technical illustration, staggered-cutaway cross-section of a
> straight round coaxial cable, horizontal, transparent background, 1600×1000.
> Layers step-cut left to right in EXACTLY this order from outside in:
> (1) matte black outer jacket; (2) a shield wrapping the dielectric
> completely — woven copper braid (a glimpse of foil beneath the braid is
> acceptable); (3) a solid, precisely cylindrical pale dielectric spacer;
> (4) ONE center copper conductor, perfectly centered, bare at the innermost
> step. The concentric geometry must read clearly: every layer shares one
> center axis, each cut face a clean ring around the next layer down. Clean
> technical-illustration realism, believable copper, foil and plastic, no
> legible jacket printing, unbranded, NO text or numbers. Key light
> upper-left, soft rim light lower-right against a dark app background.

### `xsec__optical_fiber.png`
Mounts: Lesson 2 cross-section card "OPTICAL FIBER".

> Professional technical illustration, staggered-cutaway cross-section of a
> straight optical fiber cable, horizontal, transparent background, 1600×1000.
> Layers step-cut left to right in EXACTLY this order from outside in: (1) the
> protective outer layers — a matte jacket stepped back onto a soft buffer
> layer beneath it; (2) the CLADDING, a smooth glassy sleeve; (3) the CORE, a
> very fine light-carrying center filament, finest element in the image.
> CRITICAL: there is NO metal anywhere in this build — no copper, no braid, no
> foil — and the fiber is UNLIT: no glow, no light emission, no beam; this is
> an inert cutaway of glass and plastic. Clean technical-illustration realism,
> subtle translucency on the cladding and core, flat clean cut faces, no
> legible printing, unbranded, NO text or numbers. Key light upper-left, soft
> rim light lower-right.

---

## 3. Inspection vignettes — Lesson 9 ("The Inspection Scene")

Twelve close-cropped vignettes, one per judged scene item — 8 faults, 4
healthy. These MAY depict damage (that is the teaching purpose) but NEVER a
hand or person, and NEVER an energized hint: no sparks, no glow, no smoke.

### `l09__xlr_boot.png`
Mounts: Lesson 9 inspection scene, item "xlr_boot" (FAULT — damaged strain relief).

> Professional technical illustration, close-up vignette of a fault on a
> generic 3-pin XLR male cable connector, transparent background, 1600×1000.
> Close crop on the rear half of the connector: the black rubber strain-relief
> boot has SLID BACK along the cable, away from the nickel metal shell,
> leaving an open gap where the round black cable jacket enters the shell
> unsupported; the jacket sits slightly twisted at the entry point. The
> connector body itself is otherwise clean and intact — the fault is entirely
> at the boot/shell junction, and the composition centers on it. No hands, no
> people, nothing energized — no sparks or glow. Clean
> technical-illustration realism, brushed nickel and matte black rubber,
> unbranded, NO text or numbers anywhere. Key light upper-left, soft rim light
> lower-right so dark rubber reads against a dark app background.

### `l09__figure8_no_ground.png`
Mounts: Lesson 9 inspection scene, item "figure8_no_ground" (PASSES — two-pole Class II cord, no ground by design).

> Professional technical illustration, close-up vignette of a HEALTHY
> two-pole appliance power cord end, transparent background, 1600×1000. A
> molded black figure-8 style appliance coupler (C7 type) shown angled toward
> the viewer so its mating face reads clearly: exactly TWO round-lobed
> openings side by side forming the figure-8 outline, both outer edges rounded
> (the common unpolarized form) — and NO third contact anywhere on the
> connector; the two-pole design is complete as built. The molded body is
> clean and undamaged, the thin round cord intact where it enters the molding.
> This image depicts a PASSING item — no damage of any kind. No hands, no
> people, nothing energized. Clean technical-illustration realism, matte black
> thermoplastic, unbranded, NO text or numbers. Key light upper-left, soft rim
> light lower-right against a dark background.

### `l09__mains_jacket_cut.png`
Mounts: Lesson 9 inspection scene, item "mains_jacket_cut" (FAULT — jacket cut exposing inner conductors).

> Professional technical illustration, close-up vignette of a damaged mains
> extension cord, transparent background, 1600×1000. A short mid-run section
> of round, heavy black power cord crosses the frame; at its center the outer
> jacket bears a clean CUT with the edges parted, and through the opening the
> individual insulation of the inner conductors shows plainly — BLACK, WHITE
> and GREEN insulated conductors (North American convention), their insulation
> intact, no bare copper visible. The cut is the sole subject: crop tight,
> cord ends running out of frame both sides. No plug or receptacle in frame,
> no hands, no people, nothing energized — no sparks or glow. Clean
> technical-illustration realism, matte black jacket with believable sliced
> texture at the cut, unbranded, NO text or numbers, no legible jacket
> printing. Key light upper-left, soft rim light lower-right.

### `l09__ts_crackle.png`
Mounts: Lesson 9 inspection scene, item "ts_crackle" (FAULT — movement intermittent at the plug).

> Professional technical illustration, close-up vignette of a worn 1/4-inch TS
> instrument cable at its plug, transparent background, 1600×1000. A generic
> straight 1/4-inch TS phone plug — chromed two-contact shaft with one dark
> insulating band near the tip, metal barrel — lies angled across the frame;
> the fault evidence is where the cable meets the plug: the black jacket is
> visibly FATIGUED at the entry — wrinkled, finely cracked and kinked at a
> slight angle where it leaves the barrel, the classic look of a joint failing
> under flex. The plug shaft itself is clean and undamaged; the composition
> centers on the tired cable-to-plug junction. No hands, no people, nothing
> energized — no sparks or glow. Clean technical-illustration realism, chrome
> and matte black, unbranded, NO text or numbers. Key light upper-left, soft
> rim light lower-right.

### `l09__speakon_locked.png`
Mounts: Lesson 9 inspection scene, item "speakon_locked" (PASSES — twist-lock correctly engaged).

> Professional technical illustration, close-up vignette of a HEALTHY
> loudspeaker connection, transparent background, 1600×1000. A generic
> speakON-style 2-pole cable connector — cylindrical black thermoplastic body
> with a rotating locking collar/latch — shown fully seated in its round panel
> receptacle, twist-lock ENGAGED: collar rotated to the locked position with
> its release feature at rest, connector square and fully home against the
> receptacle face; match real speakON-type product references for the locked
> geometry — authentic, not decorative. Both parts clean and undamaged: this
> depicts a correctly locked connector doing its job, not a defect. Receptacle
> shown on a small neutral panel fragment; no equipment, no hands, no people,
> nothing energized. Clean technical-illustration realism, matte black
> thermoplastic, unbranded, NO text or numbers. Key light upper-left, soft rim
> light lower-right.

### `l09__rj45_latch.png`
Mounts: Lesson 9 inspection scene, item "rj45_latch" (FAULT — snapped modular latch tab).

> Professional technical illustration, close-up vignette of a damaged network
> plug, transparent background, 1600×1000. A generic clear-bodied 8P8C modular
> network plug (eight gold contact positions visible through the housing) sits
> PARTIALLY BACKED OUT of a panel network jack — withdrawn a couple of
> millimeters, no longer seated square. The fault: its spring latch tab is
> SNAPPED OFF, only a short broken stub remaining at the tab's base where the
> lever should rise. Composition centers on the broken stub and the
> not-quite-seated gap between plug and jack. Jack shown on a small neutral
> panel fragment. No hands, no people, nothing energized — no glow at the
> contacts. Clean technical-illustration realism, clear polycarbonate, gold
> contacts, matte panel, unbranded, NO text or numbers. Key light upper-left,
> soft rim light lower-right.

### `l09__ground_pin_missing.png`
Mounts: Lesson 9 inspection scene, item "ground_pin_missing" (FAULT — ground pin missing from a grounded plug).

> Professional technical illustration, close-up vignette of a damaged North
> American three-prong wall plug, transparent background, 1600×1000. The plug
> face angles toward the viewer: exactly TWO flat metal blades present — one
> visibly NARROWER (line) and one visibly WIDER (neutral), the real polarized
> blade-width difference must read clearly — and where the round ground pin
> belongs there is only an empty recess with a sheared stub: the GROUND PIN IS
> MISSING. Match real NEMA 5-15 plug face geometry from product references —
> blade positions authentic, not decorative. Molded black plug body and cord
> otherwise intact — the absence is the whole fault, so crop close on the
> face. No receptacle, no hands, no people, nothing energized. Clean
> technical-illustration realism, unbranded, NO text or numbers. Key light
> upper-left, soft rim light lower-right.

### `l09__combo_no_latch.png`
Mounts: Lesson 9 inspection scene, item "combo_no_latch" (PASSES — combo receptacle ships without an XLR latch).

> Professional technical illustration, close-up vignette of a HEALTHY combo
> input receptacle, transparent background, 1600×1000. Dead-on to slightly
> angled view of a generic panel-mount combo XLR/quarter-inch receptacle: a
> circular XLR female arrangement with exactly THREE socket openings placed
> around a central 1/4-inch jack bore that accepts a phone plug — match real
> combo receptacle face geometry from product references, authentic, not
> decorative. CRITICAL: the rim carries NO latch tab or release button
> anywhere — this design ships without an XLR latch, and that absence is the
> teaching point, shown on an undamaged, clean part. Mounted in a small
> neutral panel fragment with plain fasteners. No plug inserted, no hands, no
> people, nothing energized. Clean technical-illustration realism, matte black
> insulator, nickel trim, unbranded, NO text or numbers. Key light upper-left,
> soft rim light lower-right.

### `l09__iec_heat.png`
Mounts: Lesson 9 inspection scene, item "iec_heat" (FAULT — heat discoloration on an IEC coupler).

> Professional technical illustration, close-up vignette of a heat-damaged
> detachable power cord coupler, transparent background, 1600×1000. A generic
> IEC C13 cord coupler shown face-on to slightly angled: the familiar
> flat-sided molded body with exactly THREE rectangular contact openings —
> match real C13 face geometry from product references. The fault: BROWN HEAT
> DISCOLORATION blooming across the face around one contact opening, the
> plastic there subtly darkened and slightly deformed — evidence of an
> overheated contact. The scene is COLD: no glow, no smoke, no sparks, no
> melting in progress — only the aftermath staining. Cord intact where it
> enters the molding. No equipment, no hands, no people. Clean
> technical-illustration realism, matte black thermoplastic with believable
> scorch browning, unbranded, NO text or numbers. Key light upper-left, soft
> rim light lower-right.

### `l09__optical_kinked.png`
Mounts: Lesson 9 inspection scene, item "optical_kinked" (FAULT — kinked knotted coil, dust caps missing).

> Professional technical illustration, close-up vignette of a mistreated
> optical digital audio cable, transparent background, 1600×1000. A thin
> optical cable stored as a TIGHT KNOTTED COIL — loops cinched hard against
> each other with an actual knot pulled tight; one section shows a sharp KINK
> with a pale stress crease at the bend. Both cable ends emerge from the coil
> with square-snouted TOSLINK-style optical tips fully EXPOSED — match real
> TOSLINK plug references — and NO dust caps anywhere in the frame: both
> end-faces bare. The fiber is UNLIT: no glow, no light at the tips — an inert
> damaged cable. No hands, no people. Clean technical-illustration realism,
> matte dark jacket, molded plastic plug bodies with glassy end-faces,
> unbranded, NO text or numbers. Key light upper-left, soft rim light
> lower-right against a dark background.

### `l09__barrel_labels.png`
Mounts: Lesson 9 inspection scene, item "barrel_labels" (PASSES — fully seated barrel, labels present; app overlays label content).

> Professional technical illustration, close-up vignette of a HEALTHY
> low-voltage DC power connection, transparent background, 1600×1000. A
> generic coaxial DC barrel plug on a thin round cord, fully seated to FULL
> DEPTH in a small device's panel power inlet — no gap between plug shoulder
> and jack, plug sitting perfectly straight with no tilt or wobble. Beside the
> inlet on the device panel: a smooth BLANK rectangular label plate; on the
> small molded power adapter body at frame edge: a matching smooth BLANK label
> field — both plates completely empty (the app overlays all label content;
> NO legible characters anywhere in the image). Everything clean and
> undamaged — this depicts a passing connection. No hands, no people, nothing
> energized. Clean technical-illustration realism, matte black plastics,
> nickel barrel, unbranded, NO text or numbers. Key light upper-left, soft rim
> light lower-right.

### `l09__worn_printing.png`
Mounts: Lesson 9 inspection scene, item "worn_printing" (FAULT — jacket printing worn illegible on a 1/4-inch lead).

> Professional technical illustration, close-up vignette of an unidentifiable
> 1/4-inch cable, transparent background, 1600×1000. A loosely coiled black
> cable with a generic straight 1/4-inch TS phone plug visible at each end —
> the two plugs identical. The composition centers on a straightened stretch
> of jacket where printing once ran: only FAINT, PATCHY GHOST TRACES of
> worn-away print remain — vague pale smudges suggesting where characters
> were, with NOTHING legible; no readable letters, numbers or symbols may
> survive anywhere. Jacket, plugs and strain reliefs are otherwise clean and
> undamaged — the missing identity is the entire fault. No hands, no people,
> nothing energized. Clean technical-illustration realism, matte black jacket
> with subtle worn sheen along the print line, chrome plugs, unbranded. Key
> light upper-left, soft rim light lower-right.

---

## 4. Tester wiring traces — Lesson 10 (Virtual Cable Tester reveals)

Diagram-style set (cleaner-geometric per house rules): a stylized see-through
cable between two connector silhouettes, conductor paths as clean glowing
lines. Wiring in each prompt restates that cable's `actualMap` EXACTLY. The
first-listed connector end sits LEFT. Trace tints on XLR/TS/TRS/speakON
diagrams are diagram styling only — Ethernet and mains traces use their
record-verified colors. The app overlays all pin labels.

### `l10__xlr_good.png`
Mounts: Lesson 10 tester bench, Cable A reveal (microphone lead — no fault; 1→1, 2→2, 3→3 straight through).

> Stylized technical wiring-trace diagram, clean geometric style, transparent
> background, 1600×1000. On the LEFT a dark simplified side-profile silhouette
> of a female 3-pin XLR cable connector; on the RIGHT the matching male XLR
> silhouette; between them a long semi-transparent ghosted cable body.
> Through the ghost cable run exactly THREE conductor paths drawn as clean,
> softly glowing lines of even thickness: all three run STRAIGHT and parallel
> from left connector to right connector, each one UNBROKEN end to end, no
> crossings, no gaps — a correctly wired straight-through lead. Give the three
> paths three subtly different neutral glow tints (styling only, not a
> real-world color claim), evenly spaced vertically. Flat, diagrammatic
> lighting; connectors matte and understated so the glowing paths dominate.
> Unbranded, NO text, numbers or labels anywhere — the app overlays pin
> labels.

### `l10__xlr_swapped.png`
Mounts: Lesson 10 tester bench, Cable B reveal (microphone lead — pins 2 and 3 reversed end to end).

> Stylized technical wiring-trace diagram, clean geometric style, transparent
> background, 1600×1000. On the LEFT a dark simplified silhouette of a female
> 3-pin XLR cable connector; on the RIGHT the matching male XLR silhouette;
> between them a semi-transparent ghosted cable body. Exactly THREE glowing
> conductor paths: the TOP path runs straight and unbroken end to end (pin 1
> intact); the OTHER TWO paths CROSS each other once at mid-cable in a clear,
> deliberate X — each of the two crossing paths is UNBROKEN, cleanly entering
> the opposite position on the far connector (pins 2 and 3 swapped end to
> end). No gaps anywhere; the fault is the crossing, not a break. Three subtly
> different neutral glow tints (styling only), the X made unmistakable with a
> small over/under weave where the lines cross. Flat diagrammatic lighting,
> matte connectors, unbranded, NO text, numbers or labels.

### `l10__xlr_open.png`
Mounts: Lesson 10 tester bench, Cable C reveal (microphone lead — pin 3 open: broken conductor or failed joint).

> Stylized technical wiring-trace diagram, clean geometric style, transparent
> background, 1600×1000. On the LEFT a dark simplified silhouette of a female
> 3-pin XLR cable connector; on the RIGHT the matching male XLR silhouette;
> between them a semi-transparent ghosted cable body. Exactly THREE conductor
> paths, straight and parallel, no crossings: the top and middle paths glow
> UNBROKEN end to end (pins 1 and 2 intact); the BOTTOM path is BROKEN — it
> glows from the left connector, then stops at a clean visible GAP near the
> right-hand connector, the short remaining stub into that connector rendered
> dark and unlit (pin 3 open: a broken conductor or failed joint at one end).
> The dead gap must read instantly against the two live paths. Neutral glow
> tints (styling only), flat diagrammatic lighting, matte connectors,
> unbranded, NO text, numbers or labels.

### `l10__ts_intermittent.png`
Mounts: Lesson 10 tester bench, Cable D reveal (instrument lead — sleeve joint drops under flex).

> Stylized technical wiring-trace diagram, clean geometric style, transparent
> background, 1600×1000. On the LEFT and RIGHT, dark simplified silhouettes of
> straight 1/4-inch TS phone plugs (single insulating band near each tip)
> facing each other; between them a semi-transparent ghosted cable body.
> Exactly TWO conductor paths: the upper TIP path runs straight, glowing and
> UNBROKEN end to end; the lower SLEEVE path runs unbroken along the cable but
> turns RAGGED right where it meets the RIGHT-hand plug — the line thins,
> splits into a few loose frayed strands, and its glow visibly fades and
> fragments across that short frayed section before barely reaching the plug:
> an intermittent joint that still touches but drops under flex. Not a clean
> gap — a fraying. Two neutral glow tints (styling only), flat diagrammatic
> lighting, matte connectors, unbranded, NO text, numbers or labels.

### `l10__trs_crossed.png`
Mounts: Lesson 10 tester bench, Cable E reveal (TRS lead — tip and ring crossed end to end).

> Stylized technical wiring-trace diagram, clean geometric style, transparent
> background, 1600×1000. On the LEFT and RIGHT, dark simplified silhouettes of
> straight 1/4-inch TRS phone plugs — each shaft showing TWO insulating bands
> separating tip, ring and sleeve regions — facing each other; between them a
> semi-transparent ghosted cable body. Exactly THREE glowing conductor paths:
> the BOTTOM sleeve path runs straight and UNBROKEN end to end; the TIP and
> RING paths CROSS each other once at mid-cable in a clear X — each crossing
> path UNBROKEN, landing on the opposite contact position at the far plug (tip
> and ring swapped end to end; crossed, not bridged — the two lines weave
> over/under at the X and never merge). Three subtly different neutral glow
> tints (styling only), flat diagrammatic lighting, matte connectors,
> unbranded, NO text, numbers or labels anywhere.

### `l10__spk_swapped.png`
Mounts: Lesson 10 tester bench, Cable F reveal (loudspeaker lead — + and − swapped end to end).

> Stylized technical wiring-trace diagram, clean geometric style, transparent
> background, 1600×1000. On the LEFT and RIGHT, dark simplified silhouettes of
> speakON-style 2-pole twist-lock cable connectors — stout cylindrical bodies
> with a locking collar — facing each other; between them a semi-transparent
> ghosted cable body, drawn slightly thicker than a signal lead. Exactly TWO
> conductor paths, rendered noticeably HEAVIER than signal-diagram lines
> (loudspeaker conductors are heavy gauge): both paths CROSS each other once
> at mid-cable in a single bold X — each path UNBROKEN end to end, landing on
> the opposite pole at the far connector (the + and − conductors swapped end
> to end; crossed, never merging — weave one over the other at the X). No
> gaps, no third path. Two neutral glow tints (styling only), flat
> diagrammatic lighting, matte connectors, unbranded, NO text, numbers or
> labels.

### `l10__eth_split.png`
Mounts: Lesson 10 tester bench, Cable G reveal (network patch lead — pin map correct, pairs 3+6 and 4+5 split).

> Stylized technical wiring-trace diagram, clean geometric style, transparent
> background, 1600×1000. On the LEFT and RIGHT, dark simplified silhouettes of
> 8P8C modular network plugs facing each other; between them a wide
> semi-transparent ghosted cable body. Exactly EIGHT glowing conductor paths,
> every one running STRAIGHT to the same position on the far plug, all
> UNBROKEN — the pin map is perfect. The fault lives in the PAIRING: the
> paths are drawn gently twisted together in two-wire bundles, tinted with the
> real Ethernet pair colors — the outermost top bundle correctly twins solid
> ORANGE with its white/orange mate, the outermost bottom bundle correctly
> twins solid BROWN with white/brown; but in the middle the wires are twisted
> with the WRONG partners: the white/GREEN wire twists with the solid BLUE
> wire, and the white/BLUE wire twists with the solid GREEN wire — so the
> green pair's two wires and the blue pair's two wires each ride in two
> different bundles. Flat diagrammatic lighting, matte connectors, unbranded,
> NO text, numbers or labels.

### `l10__iec_earth_open.png`
Mounts: Lesson 10 tester bench, Cable H reveal (detachable power cord — protective earth conductor open).

> Stylized technical wiring-trace diagram, clean geometric style, transparent
> background, 1600×1000. On the LEFT a dark simplified silhouette of a North
> American NEMA 5-15 wall plug shown with its two flat blades — one narrow,
> one wider — and round ground pin; on the RIGHT a dark silhouette of an IEC
> C13 cord coupler; between them a semi-transparent ghosted cord body. Exactly
> THREE conductor paths tinted to the North American cord convention: a
> BLACK-tinted line path from the narrow blade, glowing UNBROKEN end to end; a
> WHITE-tinted neutral path from the wide blade, glowing UNBROKEN end to end;
> and a GREEN-tinted protective-earth path from the round pin that is
> BROKEN — its glow stops at a clean visible GAP mid-cord, the remainder dark
> and unlit into the coupler. No crossings, no bridges between paths. Flat
> diagrammatic lighting, matte silhouettes, unbranded, NO text, numbers or
> labels.

---

## 5. Challenge layouts — Lesson 11 (Final System Challenge)

Overhead plots showing ONLY each challenge's listed equipment, UNCONNECTED —
no cables anywhere; the learner draws the connections. Same icon-style
top-down look across both images.

### `l11__show-a.png`
Mounts: Lesson 11, Challenge SHOW A (small live show) — stage-plot backdrop for the signal-path, power-up and fault-hunt stages.

> Stylized overhead stage-plot illustration, consistent clean icon-style
> top-down view, transparent background, 1600×1000. A small live-show setup
> with every item UNCONNECTED — absolutely NO cables, lines or connections
> drawn between anything. Across the upper stage area: TWO vocal microphones
> on stands, ONE electric guitar, ONE small DI box near the guitar, ONE stage
> box, ONE passive wedge stage monitor, ONE power amplifier at side-stage, and
> TWO powered main loudspeakers at the stage's outer edges; a wall-power
> receptacle plate at the stage wall. At the lower front-of-house position:
> ONE digital mixing console, ONE computer, ONE small network switch. Each
> piece a simple, recognizable top-down icon with soft consistent drop
> shadows, generous spacing, believable relative sizes. Muted neutral palette,
> flat shading, key light upper-left. Unbranded, no logos, NO text or numbers
> anywhere.

### `l11__studio-b.png`
Mounts: Lesson 11, Challenge STUDIO B (small recording studio) — layout backdrop for the signal-path, data/control and fault-hunt stages.

> Stylized overhead studio-layout illustration, clean icon-style top-down
> view, transparent background, 1600×1000, drawn in the same visual language
> as a matching stage-plot companion image. A small recording room with every
> item UNCONNECTED — absolutely NO cables, lines or connections drawn. On a
> central desk: ONE audio interface, ONE computer with display, ONE MIDI
> controller keyboard, ONE pair of headphones resting on the desktop; flanking
> the desk left and right, TWO powered studio monitors; nearby, ONE vocal
> microphone on a stand and ONE electric guitar on a floor stand with a small
> DI box beside it; at the wall, ONE wall-power receptacle plate and ONE small
> DC power adapter lying unplugged. Simple recognizable top-down icons, soft
> consistent drop shadows, generous spacing, believable relative sizes, muted
> neutral palette, flat shading, key light upper-left. Unbranded, NO text or
> numbers anywhere.

---

## Authoring notes for the owner (not prompts)

- **Trace-diagram orientation:** first-listed connector end (per
  `testerCables.ts` `connectorEnds`) sits LEFT in every `l10__*` image.
- **Label-bearing scenes under the NO-TEXT law:** `l09__barrel_labels` shows
  blank label plates (app overlays the matching label content);
  `l09__worn_printing` shows only illegible ghost traces — both comply with
  the no-legible-characters rule while keeping the teaching point.
- **T5 optional exploded views:** not applicable to this file — the per-core
  simplified exploded prompts belong to the family files; `anatomy__exploded`
  is the T1b generic that carries the Lesson 2 teaching.
