# Cable & Connector Lab — Artwork Prompts: CORE ANALOG AUDIO (2026-08-16)

Family file for `APE_CABLE_ART_SPEC_2026_08_16.md` (the master spec — its §2
global style guide and §3 accuracy rules govern every prompt below). Facts are
drawn ONLY from the verified records in
`src/screens/lab/cable/data/connectors.analog.ts`.

**Connectors covered:** `xlr3` (core views already published as the master
spec's §5 calibration exemplars — only its optional T5 exploded prompt appears
here), `ts_quarter`, `trs_quarter`, `trs_35`, `trrs_35`, `rca`,
`combo_xlr_trs`.

**Verified contact-count constraints (the accuracy heart of this family):**

| Connector | Contacts (hard requirement) | Insulator bands on shaft |
|---|---|---|
| `xlr3` | exactly 3 pins/sockets | n/a (pin face) |
| `ts_quarter` | exactly 2 — tip + sleeve | exactly ONE |
| `trs_quarter` | exactly 3 — tip + ONE ring + sleeve | exactly TWO |
| `trs_35` | exactly 3 — tip + ONE ring + sleeve | exactly TWO |
| `trrs_35` | exactly 4 — tip + TWO rings + sleeve | exactly THREE |
| `rca` | exactly 2 — center pin + shell | n/a (coaxial) |
| `combo_xlr_trs` | 3 female XLR sockets + 3-contact 1/4-inch jack path in one receptacle | n/a (receptacle) |

An image that shows the wrong band count is a rejected asset — TRS has ONE
ring (two bands), never two rings.

**Family adaptations (honest views, per master spec allowance):**
- Phone plugs (TS/TRS/TRRS) have no informative dead-on face: a true head-on
  view shows only the tip dome and hides the band count. Their `face-plug`
  views are specified as a steep near-end-on angle so the contact sequence
  still reads. Their receptacles are panel/device jacks, so `face-recept` and
  `mating` views show the jack mounted in a small neutral panel or device-edge
  fragment (the connector alone is just a bushing).
- `combo_xlr_trs` is a chassis RECEPTACLE with no cable and no plug gender:
  its `side` view is the panel-mount unit, it has ONE combined face
  (`face-recept` only — see the reuse note in its section), and its `mating`
  view shows both possible plugs approaching.
- No connector in this family has a keyway; where the master spec's 12
  o'clock keying law cannot apply, the prompt says so. The combo's XLR-side
  keying features follow real references at 12 o'clock.

**T5 naming:** per-core simplified exploded views use
`<connectorId>__exploded.png` (pattern extended from the master spec's
`anatomy__exploded.png`; the spec's §2 list does not name per-core T5 files —
owner may rename before generation).

**Prompt count in this file: 30** (6 connectors × 4 core views = 24, plus 7
optional T5 exploded prompts minus the 1 combo face covered by a reuse note
= 30 total; xlr3 contributes only its T5 prompt).

---

## `xlr3` — 3-pin XLR

The four core views (`xlr3__side.png`, `xlr3__face-plug.png`,
`xlr3__face-recept.png`, `xlr3__mating.png`) are the calibration exemplars in
master spec §5 — use those prompts as published there. Only the optional T5
exploded prompt lives here.

### `xlr3__exploded.png` — OPTIONAL — T5
Mounts: optional depth asset for the Lesson 3 XLR card (the Lesson 2 generic anatomy exploded carries the core teaching).

> OPTIONAL — T5. Professional technical illustration, simplified exploded
> view of a generic 3-pin XLR male cable connector, transparent background,
> 1600×1000. Parts separated left-to-right along one horizontal axis, mating
> end RIGHT: round black cable end with shield braid and two inner conductors
> just visible, black rubber strain-relief boot, knurled metal grip ring,
> cylindrical nickel shell, and the matte-black insulator insert carrying
> exactly THREE chromed pins — match real XLR internals from product
> references. Small, even gaps between parts; same materials and upper-left
> key light as the master-spec xlr3 exemplars. Unbranded, NO text or numbers.

---

## `ts_quarter` — 1/4-inch TS

Verified: exactly TWO contacts (tip = signal, sleeve = return/shield), ONE
insulator band, friction-only retention (no latch), screw-together barrel
construction, instrument cable = single small-gauge conductor inside a
shield.

### `ts_quarter__side.png`
Mounts: Lesson 3 (analog connectors) card SIDE slot — T1a; also Lesson 4 same-plug comparison and Lesson 5 legacy-speaker contrast.

> Professional technical illustration of a generic 1/4-inch TS phone plug on
> its cable, side view, fully transparent background, 1600×1000. The polished
> 6.35 mm plug shaft points RIGHT and carries exactly TWO contacts: the
> rounded tip with its retention groove, then exactly ONE dark insulator
> band, then the long sleeve — no ring contacts anywhere; match real TS plug
> profiles from product references. Behind the shaft, a cylindrical brushed
> nickel screw-together barrel, then a black strain-relief boot tapering onto
> a round black instrument cable that exits LEFT out of frame. Materials:
> bright chromed shaft, brushed nickel barrel, matte black rubber. Lighting:
> key light upper-left, subtle rim light lower-right so dark surfaces
> separate from a dark app background. Clean, unbranded, no logos, NO text or
> numbers anywhere, no wear. Centered, horizontal, filling ~80% of the
> canvas.

### `ts_quarter__face-plug.png`
Mounts: Lesson 3 card FACE slot — T1a. Adapted view: steep near-end-on angle (a true dead-on view hides the band count).

> Professional technical illustration of a generic 1/4-inch TS phone plug
> viewed nearly end-on, transparent background, 1000×1000. The chromed
> 6.35 mm shaft points toward the viewer at a steep angle, tip foremost,
> tilted just enough that the contact sequence still reads along the shaft:
> rounded tip, exactly ONE dark insulator band, then the sleeve — exactly TWO
> metal contacts in total, no ring contacts; match real TS plug geometry from
> product references. The nickel barrel recedes behind the shaft, softly out
> of focus. This connector family has no keyway — center the plug. Bright
> chrome with soft studio reflections, key light upper-left, gentle shadowing
> for depth. Unbranded, clean, no damage, NO text or numbers.

### `ts_quarter__face-recept.png`
Mounts: Lesson 3 card RECEPTACLE slot — T2.

> Professional technical illustration, dead-on front view of a generic
> 1/4-inch phone jack receptacle as mounted on an equipment panel,
> transparent background, 1000×1000. A circular brushed-nickel jack nut and
> washer around the threaded bushing, with the round 6.35 mm entry bore at
> center; inside the bore, a dark interior with a hint of a spring contact —
> match real panel-mount 1/4-inch jack references. Set the hardware into a
> small square fragment of neutral near-black panel with softly finished
> edges so the jack reads in context. No keyway exists in this family —
> center everything. NO legible text or numbers. Key light upper-left, soft
> interior shadow for depth. Unbranded, clean, no damage.

### `ts_quarter__mating.png`
Mounts: Lesson 3 card MATING slot — T2; reinforces the friction-only retention teaching point.

> Professional technical illustration of a generic 1/4-inch TS connection
> about to mate, three-quarter view, transparent background, 1600×1000: on
> the LEFT, a panel-mount 1/4-inch jack in a small fragment of neutral
> near-black panel, its bore angled toward viewer-right; on the RIGHT, a TS
> phone plug on its cable, chromed shaft pointing at the bore, separated by
> about half a plug length on a shared axis, cable exiting away to the right.
> The shaft must show exactly TWO contacts — rounded tip, ONE dark insulator
> band, long sleeve. The geometry must make the straight push-in connection
> direction obvious; no latch exists on this connector. Nickel and chrome
> metal, matte black boot and cable, key light upper-left, rim light
> lower-right, unbranded, NO text or numbers.

### `ts_quarter__exploded.png` — OPTIONAL — T5
Mounts: optional depth asset for the Lesson 2/3 TS anatomy moment.

> OPTIONAL — T5. Professional technical illustration, simplified exploded
> view of a generic 1/4-inch TS phone plug, transparent background,
> 1600×1000. Parts along one horizontal axis, mating end RIGHT: the chromed
> two-contact shaft (tip, one insulator band, sleeve) with its two solder
> lugs exposed, the unscrewed nickel barrel shell floated behind it, a black
> strain-relief boot, and an instrument-cable end showing ONE center
> conductor inside a shield braid. Even gaps between parts; match real TS
> plug internals from product references. Key light upper-left, unbranded,
> NO text or numbers.

---

## `trs_quarter` — 1/4-inch TRS

Verified: exactly THREE contacts (tip, ONE ring, sleeve) separated by exactly
TWO insulator bands, friction-only retention, balanced cable = shielded
twisted pair (two conductors plus shield).

### `trs_quarter__side.png`
Mounts: Lesson 3 card SIDE slot — T1a; the two-band count anchors the Lesson 4 TS-vs-TRS comparison.

> Professional technical illustration of a generic 1/4-inch TRS phone plug on
> its cable, side view, fully transparent background, 1600×1000. The polished
> 6.35 mm shaft points RIGHT and carries exactly THREE contacts separated by
> exactly TWO dark insulator bands: rounded tip, then ONE metal ring, then
> the long sleeve — never more than one ring; match real TRS plug profiles
> from product references. Behind the shaft, a brushed nickel screw-together
> barrel, then a black strain-relief boot tapering onto a round black
> balanced cable exiting LEFT out of frame. Materials: bright chromed shaft
> and ring, brushed nickel barrel, matte black rubber. Lighting: key light
> upper-left, subtle rim light lower-right so dark surfaces separate from a
> dark app background. Clean, unbranded, no logos, NO text or numbers
> anywhere, no wear. Centered, horizontal, filling ~80% of the canvas.

### `trs_quarter__face-plug.png`
Mounts: Lesson 3 card FACE slot — T1a. Adapted view: steep near-end-on angle so the band count reads.

> Professional technical illustration of a generic 1/4-inch TRS phone plug
> viewed nearly end-on, transparent background, 1000×1000. The chromed shaft
> points toward the viewer at a steep angle, tip foremost, tilted just enough
> that the full contact sequence reads along the shaft: rounded tip, dark
> insulator band, ONE metal ring, second dark insulator band, then the
> sleeve — exactly THREE metal contacts and exactly TWO insulator bands, no
> more; match real TRS plug geometry from product references. The nickel
> barrel recedes softly behind the shaft. No keyway exists in this family —
> center the plug. Bright chrome with soft studio reflections, key light
> upper-left, gentle shadowing for depth. Unbranded, clean, no damage, NO
> text or numbers.

### `trs_quarter__face-recept.png`
Mounts: Lesson 3 card RECEPTACLE slot — T2.

> Professional technical illustration, dead-on front view of a generic
> 1/4-inch TRS jack receptacle as mounted on an equipment panel, transparent
> background, 1000×1000. A circular brushed-nickel jack nut and washer around
> the threaded bushing with the round 6.35 mm entry bore at center; dark
> interior with a hint of internal spring contacts — match real panel-mount
> 1/4-inch stereo/balanced jack references. From the outside this face is
> identical to a two-contact mono jack — do NOT invent extra visible features
> to distinguish it. Set into a small square fragment of neutral near-black
> panel with softly finished edges. No keyway — center everything. NO legible
> text or numbers. Key light upper-left, soft interior shadow for depth.
> Unbranded, clean, no damage.

### `trs_quarter__mating.png`
Mounts: Lesson 3 card MATING slot — T2.

> Professional technical illustration of a generic 1/4-inch TRS connection
> about to mate, three-quarter view, transparent background, 1600×1000: on
> the LEFT, a panel-mount 1/4-inch jack in a small fragment of neutral
> near-black panel, bore angled toward viewer-right; on the RIGHT, a TRS
> phone plug on its cable pointing at the bore, separated by about half a
> plug length on a shared axis, cable exiting away to the right. The shaft
> must show exactly THREE contacts — tip, ONE metal ring, sleeve — separated
> by exactly TWO dark insulator bands. The geometry must make the straight
> push-in connection direction obvious; no latch exists on this connector.
> Chrome and nickel metal, matte black boot and cable, key light upper-left,
> rim light lower-right, unbranded, NO text or numbers.

### `trs_quarter__exploded.png` — OPTIONAL — T5
Mounts: optional depth asset for the Lesson 2/3 TRS anatomy moment.

> OPTIONAL — T5. Professional technical illustration, simplified exploded
> view of a generic 1/4-inch TRS phone plug, transparent background,
> 1600×1000. Parts along one horizontal axis, mating end RIGHT: the chromed
> three-contact shaft (tip, one ring, sleeve, separated by two insulator
> bands) with its three solder lugs exposed, the unscrewed nickel barrel
> floated behind it, a black strain-relief boot, and a balanced-cable end
> showing TWO inner conductors inside a shield braid. Even gaps; match real
> TRS plug internals from product references. Key light upper-left,
> unbranded, NO text or numbers.

---

## `trs_35` — 3.5 mm TRS (mini)

Verified: same three-contact/two-band layout as 1/4-inch TRS, miniaturized;
thin consumer build where the strain relief determines lifespan;
friction-only spring-detent retention.

### `trs_35__side.png`
Mounts: Lesson 3 card SIDE slot — T1a; scale-honesty partner to `trs_quarter__side.png` in Lesson 4.

> Professional technical illustration of a generic 3.5 mm TRS mini plug on
> its thin cable, side view, fully transparent background, 1600×1000. The
> slim polished 3.5 mm shaft points RIGHT and carries exactly THREE contacts
> separated by exactly TWO dark insulator bands: small rounded tip, ONE metal
> ring, then the sleeve — never more than one ring; match real 3.5 mm TRS
> plug profiles from product references. Behind the shaft, a slender molded
> black plug body with a flexible strain-relief sleeve tapering onto a thin
> round black cable exiting LEFT out of frame. Keep the whole plug visibly
> slender and fine — this is a miniature connector. Bright chrome shaft,
> matte black molding. Key light upper-left, subtle rim light lower-right for
> separation from a dark background. Clean, unbranded, NO text or numbers, no
> wear. Centered, horizontal, filling ~80% of the canvas.

### `trs_35__face-plug.png`
Mounts: Lesson 3 card FACE slot — T1a. Adapted view: steep near-end-on angle so the band count reads.

> Professional technical illustration of a generic 3.5 mm TRS mini plug
> viewed nearly end-on, transparent background, 1000×1000. The slim chromed
> shaft points toward the viewer at a steep angle, tip foremost, tilted just
> enough that the contact sequence reads along the shaft: small rounded tip,
> dark insulator band, ONE metal ring, second dark insulator band, then the
> sleeve — exactly THREE metal contacts and exactly TWO insulator bands;
> match real 3.5 mm plug geometry from product references. The slender molded
> black body recedes softly behind the shaft. No keyway exists in this
> family — center the plug. Bright chrome with soft reflections, key light
> upper-left, gentle shadowing for depth. Unbranded, clean, no damage, NO
> text or numbers.

### `trs_35__face-recept.png`
Mounts: Lesson 3 card RECEPTACLE slot — T2.

> Professional technical illustration, dead-on front view of a generic
> 3.5 mm mini-jack receptacle as mounted on an equipment panel, transparent
> background, 1000×1000. A small circular brushed-nickel nut and washer
> around the threaded bushing with the round 3.5 mm entry bore at center — a
> visibly small aperture — and a dark interior with a hint of a spring
> contact; match real panel-mount 3.5 mm jack references. Set into a small
> square fragment of neutral near-black panel with softly finished edges.
> Brushed nickel hardware with soft specular highlights. No keyway exists in
> this family — center everything. NO legible text or numbers. Key light
> upper-left, soft interior shadow for depth. Unbranded, clean, no damage.

### `trs_35__mating.png`
Mounts: Lesson 3 card MATING slot — T2.

> Professional technical illustration of a generic 3.5 mm TRS connection
> about to mate, three-quarter view, transparent background, 1600×1000: on
> the LEFT, a small panel-mount 3.5 mm mini jack in a fragment of neutral
> near-black panel, bore angled toward viewer-right; on the RIGHT, the slim
> TRS mini plug on its thin cable pointing at the bore, separated by about
> half a plug length on a shared axis, cable exiting away to the right. The
> shaft must show exactly THREE contacts separated by exactly TWO dark
> insulator bands. Everything visibly small and fine — a miniature
> connection with a straight push-in direction and no latch. Chrome shaft,
> matte black molded body, key light upper-left, rim light lower-right,
> unbranded, NO text or numbers.

### `trs_35__exploded.png` — OPTIONAL — T5
Mounts: optional depth asset for the Lesson 3 mini-plug card.

> OPTIONAL — T5. Professional technical illustration, simplified exploded
> view of a generic solder-type 3.5 mm TRS mini plug, transparent background,
> 1600×1000. Parts along one horizontal axis, mating end RIGHT: the slim
> three-contact shaft (tip, one ring, sleeve — two insulator bands) with
> three tiny solder tabs, a slender metal barrel floated behind it, a
> flexible strain-relief sleeve, and a thin cable end showing TWO fine
> conductors inside a shield. Even gaps; match real mini-plug internals from
> product references. Key light upper-left, unbranded, NO text or numbers.

---

## `trrs_35` — 3.5 mm TRRS (headset)

Verified: exactly FOUR contacts (tip, TWO rings, sleeve) separated by exactly
THREE insulator bands. CTIA and OMTP wiring differ electrically only — the
plugs are physically identical, so one image serves both and must not invent
a visible difference.

### `trrs_35__side.png`
Mounts: Lesson 3 card SIDE slot — T1a; the three-band count vs TRS's two is the Lesson 4 recognition moment.

> Professional technical illustration of a generic 3.5 mm TRRS headset plug
> on its thin cable, side view, fully transparent background, 1600×1000. The
> slim polished 3.5 mm shaft points RIGHT and carries exactly FOUR contacts
> separated by exactly THREE dark insulator bands: small rounded tip, then
> TWO metal rings, then the sleeve — the three-band count is the identifying
> feature, render it unmistakably; match real TRRS plug profiles from product
> references. Behind the shaft, a slender molded black body with a flexible
> strain-relief sleeve tapering onto a very thin round cable exiting LEFT out
> of frame. Keep proportions miniature and fine. Bright chrome shaft, matte
> black molding. Key light upper-left, subtle rim light lower-right. Clean,
> unbranded, NO text or numbers, no wear. Centered, horizontal, filling ~80%
> of the canvas.

### `trrs_35__face-plug.png`
Mounts: Lesson 3 card FACE slot — T1a. Adapted view: steep near-end-on angle so all four contacts read.

> Professional technical illustration of a generic 3.5 mm TRRS headset plug
> viewed nearly end-on, transparent background, 1000×1000. The slim chromed
> shaft points toward the viewer at a steep angle, tip foremost, tilted just
> enough that the full sequence reads along the shaft: small rounded tip,
> then alternating dark insulator bands and metal rings — exactly FOUR metal
> contacts (tip, two rings, sleeve) separated by exactly THREE insulator
> bands, no more, no fewer; match real TRRS plug geometry from product
> references. The slender molded black body recedes behind the shaft. No
> keyway exists in this family — center the plug. Bright chrome, soft studio
> reflections, key light upper-left, gentle depth shadowing. Unbranded,
> clean, no damage, NO text or numbers.

### `trrs_35__face-recept.png`
Mounts: Lesson 3 card RECEPTACLE slot — T2. Context adaptation: shown as a consumer device-edge jack (its native habitat), unlike the pro panel jacks above.

> Professional technical illustration, dead-on front view of a generic 3.5 mm
> headset jack as it appears on a device edge, transparent background,
> 1000×1000. A small fragment of slim, unbranded consumer-device edge —
> neutral dark anodized finish, softly rounded — with the circular 3.5 mm
> jack opening at center: a thin chamfered rim around a small dark bore;
> match real device headset-jack references. From the outside this opening
> looks the same as a three-contact jack — the fourth contact sits deep
> inside and must NOT be invented as a visible feature. NO legible text,
> numbers, or logos anywhere on the device fragment. Key light upper-left,
> soft interior shadow for depth. Clean, generic, no damage.

### `trrs_35__mating.png`
Mounts: Lesson 3 card MATING slot — T2.

> Professional technical illustration of a generic 3.5 mm TRRS headset
> connection about to mate, three-quarter view, transparent background,
> 1600×1000: on the LEFT, a slim fragment of unbranded consumer-device edge
> with its round 3.5 mm headset jack angled toward viewer-right; on the
> RIGHT, the TRRS plug on its very thin cable pointing at the opening,
> separated by about half a plug length on a shared axis, cable exiting away
> to the right. The shaft must show exactly FOUR contacts separated by
> exactly THREE dark insulator bands. Straight push-in direction obvious; no
> latch. Chrome shaft, matte black molded body, neutral dark device finish,
> key light upper-left, rim light lower-right, unbranded, NO text, numbers,
> or logos.

### `trrs_35__exploded.png` — OPTIONAL — T5
Mounts: optional depth asset for the Lesson 3 headset-plug card.

> OPTIONAL — T5. Professional technical illustration, simplified exploded
> view of a generic 3.5 mm TRRS headset plug, transparent background,
> 1600×1000. Parts along one horizontal axis, mating end RIGHT: the slim
> four-contact shaft (tip, two rings, sleeve — three insulator bands) with
> four tiny solder points, a slender barrel or molded body shell floated
> behind it, a flexible strain-relief sleeve, and a very thin cable end
> showing FOUR fine conductors (three signal plus a common return). Even
> gaps; match real TRRS internals from product references. Key light
> upper-left, unbranded, NO text or numbers.

---

## `rca` — RCA (phono)

Verified: exactly TWO contacts (center pin = signal, shell = return/shield),
coaxial construction, friction grip via the shell's spring fingers, the
center pin can touch before the shell. Red/white channel color is a labeling
convention for stereo PAIRS, not connector geometry — a single generic
connector is rendered in neutral finishes so the image does not imply a
channel identity.

### `rca__side.png`
Mounts: Lesson 3 card SIDE slot — T1a; also Lesson 4 (same shell, S/PDIF vs analog) and Lesson 6 coax-digital contrast.

> Professional technical illustration of a generic RCA (phono) plug on its
> cable, side view, fully transparent background, 1600×1000. Mating end
> pointing RIGHT: the solid center pin projecting forward from a pale
> insulator, surrounded by the cylindrical outer shell whose rim is split
> into springy gripping fingers — exactly TWO contacts in total, center pin
> and shell; match real RCA plug geometry from product references. Behind the
> head, a knurled nickel grip body, then a black strain relief tapering onto
> a round black coaxial cable exiting LEFT out of frame. Neutral metal and
> black finishes only — NO red or white channel-color trim; channel color is
> a labeling convention, not part of the connector. Key light upper-left,
> subtle rim light lower-right. Clean, unbranded, NO text or numbers, no
> wear. Centered, horizontal, filling ~80% of the canvas.

### `rca__face-plug.png`
Mounts: Lesson 3 card FACE slot — T1a.

> Professional technical illustration, dead-on front view of a generic RCA
> (phono) plug's mating face, transparent background, 1000×1000. Concentric
> geometry, centered: the round center pin foremost, a ring of pale insulator
> around its base, then the outer metal shell rim split into evenly spaced
> spring fingers — exactly TWO contacts, center pin and shell; match real RCA
> plug references for pin proportion and finger count. Render slight depth so
> the pin visibly projects ahead of the shell rim. No keyway exists on this
> connector — center it. Neutral nickel and pale insulator finishes — NO red
> or white channel-color trim. Soft studio lighting, key from upper-left,
> gentle shadowing for depth. Unbranded, clean, no damage, NO text or
> numbers.

### `rca__face-recept.png`
Mounts: Lesson 3 card RECEPTACLE slot — T2.

> Professional technical illustration, dead-on front view of a generic RCA
> (phono) panel jack, transparent background, 1000×1000. Concentric and
> centered: a small round socket opening for the center pin at the middle of
> a pale insulator disc, surrounded by the smooth outer metal contact ring
> that the plug's shell grips, with a mounting collar behind — match real
> panel-mount RCA jack references. Exactly TWO contact surfaces: center
> socket and outer ring. Set into a small square fragment of neutral
> near-black panel with softly finished edges. Neutral finishes — NO red or
> white trim. NO legible text or numbers. Key light upper-left, soft interior
> shadow for depth. Unbranded, clean, no damage.

### `rca__mating.png`
Mounts: Lesson 3 card MATING slot — T2; supports the hot-plug caution (pin touches before shell).

> Professional technical illustration of a generic RCA (phono) connection
> about to mate, three-quarter view, transparent background, 1600×1000: on
> the LEFT, a panel-mount RCA jack in a small fragment of neutral near-black
> panel, its outer ring and center socket angled toward viewer-right; on the
> RIGHT, an RCA plug on its coaxial cable, center pin aimed at the socket,
> separated by about half a plug length on a shared axis, cable exiting away
> to the right. The plug's projecting center pin and split spring-finger
> shell must read clearly — the geometry shows a straight push-on friction
> fit with no latch. Neutral nickel and black finishes, NO red or white
> channel-color trim. Key light upper-left, rim light lower-right, unbranded,
> NO text or numbers.

### `rca__exploded.png` — OPTIONAL — T5
Mounts: optional depth asset for the Lesson 3 RCA card.

> OPTIONAL — T5. Professional technical illustration, simplified exploded
> view of a generic RCA (phono) plug, transparent background, 1600×1000.
> Parts along one horizontal axis, mating end RIGHT: the center-pin assembly
> with its solder tail, the pale insulator sleeve, the outer spring-finger
> shell, a knurled grip body, a black strain relief, and a coaxial cable end
> showing ONE center conductor inside a shield braid. Even gaps; match real
> RCA internals from product references. Neutral finishes, no channel-color
> trim. Key light upper-left, unbranded, NO text or numbers.

---

## `combo_xlr_trs` — XLR/TRS combo receptacle

Verified: a panel-mount RECEPTACLE combining a female 3-contact XLR path and
a 3-contact 1/4-inch jack path in one unit; the center accepts a male XLR and
the bore accepts a 1/4-inch plug; latchless combo receptacles are widespread
(latching models exist — the prompts model the widespread latchless style).
No cable, no boot, no plug gender.

### `combo_xlr_trs__side.png`
Mounts: Lesson 3 card SIDE slot — T1a. Adapted view: chassis-mount unit (there is no cable connector).

> Professional technical illustration of a generic XLR/TRS combination
> chassis receptacle — a panel-mount input that accepts either a male XLR or
> a 1/4-inch phone plug in one unit — shown in three-quarter side view, fully
> transparent background, 1600×1000. The combined circular mating face points
> RIGHT; the body extends LEFT: a matte-black housing behind a panel-mounting
> flange with screw holes, ending in rear solder or PCB terminals at the
> left — match real combination-receptacle references for housing and flange
> geometry. On the face, hint the three XLR socket openings and the central
> 1/4-inch bore in perspective. This is equipment hardware: no cable, no
> boot. Matte black housing with nickel accents. Key light upper-left, rim
> light lower-right so the dark body separates from a dark background.
> Unbranded, NO text or numbers, centered, filling ~80% of the canvas.

### `combo_xlr_trs__face-recept.png`
Mounts: Lesson 3 card FACE/RECEPTACLE slot — T1a/T2 (this single combined face serves both face slots).

> Professional technical illustration, dead-on front view of a generic
> XLR/TRS combination receptacle's combined mating face, transparent
> background, 1000×1000. One circular face serving two connections: a
> matte-black insulator carrying exactly THREE female XLR socket contacts
> (chromed liners just visible inside) in the authentic female-XLR triangular
> arrangement, with the round 1/4-inch jack bore opening at the CENTER of the
> face between them — match real combination-receptacle face references;
> geometry must be authentic, not decorative. Orient the XLR keying features
> to 12 o'clock per real references. Model the widespread latchless style —
> no prominent latch tab. Surrounding metal or black nosing ring and the edge
> of the panel flange. NO legible text or numbers (unreadable molded relief
> is acceptable). Key light upper-left, gentle interior shadowing so the
> sockets and the central bore both read as recessed. Unbranded, clean.

### `combo_xlr_trs__face-plug.png` — NOTE: NOT PRODUCED (reuse mapping)
A receptacle has no plug gender, so no plug-face image exists for this
connector. The plugs that mate with it are already covered by other assets:
- XLR path → `xlr3__face-plug.png` (master spec §5 exemplar)
- 1/4-inch path → `ts_quarter__face-plug.png` / `trs_quarter__face-plug.png`

If the app's face-plug slot must be filled for this connector, reuse
`combo_xlr_trs__face-recept.png`.

### `combo_xlr_trs__mating.png`
Mounts: Lesson 3 card MATING slot — T2; the one-receptacle-two-paths hero image. Adapted view: BOTH possible plugs shown approaching.

> Professional technical illustration of a generic XLR/TRS combination
> receptacle about to receive its two possible plugs, three-quarter view,
> transparent background, 1600×1000: on the LEFT, the combo receptacle
> mounted in a small fragment of neutral near-black panel, combined face
> angled toward viewer-right — three female XLR sockets around a central
> 1/4-inch bore. On the RIGHT, TWO cable connectors approach on gently
> diverging axes with a clear gap: nearer, a male 3-pin XLR cable connector
> (exactly THREE chromed pins) aimed at the socket pattern; slightly farther
> and lower, a 1/4-inch TRS phone plug (tip, ONE ring, sleeve — exactly two
> insulator bands) aimed at the central bore. Only one can connect at a
> time — compose it as a choice, not a collision. Nickel metal, chrome, matte
> black. Key light upper-left, rim light lower-right, unbranded, NO text or
> numbers.

### `combo_xlr_trs__exploded.png` — OPTIONAL — T5
Mounts: optional depth asset for the Lesson 3 combo card.

> OPTIONAL — T5. Professional technical illustration, simplified exploded
> view of a generic XLR/TRS combination receptacle, transparent background,
> 1600×1000. Parts along one horizontal axis, face RIGHT: the front nosing
> ring and panel flange, the black insulator carrier with exactly THREE
> female XLR contacts around its central opening, the inner 1/4-inch jack
> tube with its spring contacts, the rear housing shell, and the rear
> solder/PCB terminal set. Even gaps; match real combination-receptacle
> internals from product references. Matte black and nickel, key light
> upper-left, unbranded, NO text or numbers.
