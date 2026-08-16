# Cable & Connector Lab — Artwork Prompts: LOUDSPEAKER Family (2026-08-16)

**Master spec:** `docs/art/APE_CABLE_ART_SPEC_2026_08_16.md` — all global rules
(transparent background, key light upper-left + rim lower-right, no
text/numbers/logos, orientation conventions, PNG sizes, exact naming) apply to
every prompt below. Each prompt is standalone — paste as-is.

**Verified source of truth:** `src/screens/lab/cable/data/connectors.speaker.ts`
(B2 fact-verification protocol). Physical constraints stated as hard
requirements below come from those records; where fine geometry is not
verified, prompts direct "match real product references."

**Connectors (ids exact, from `cableTypes.ts`):** `speakon_nl2`,
`speakon_nl4`, `binding_post`, `banana`, `bare_wire`, `ts_speaker_legacy` —
all core tier.

## View-set adaptations in this family (read before generating)

Four of the six connectors are not simple plug/receptacle pairs, so the
standard 4-view set is adapted honestly. Full mapping:

| Connector | side | face-plug | face-recept | mating | Optional T5 |
|---|---|---|---|---|---|
| `speakon_nl2` | ✓ | ✓ | ✓ (chassis) | ✓ | ✓ |
| `speakon_nl4` | ✓ | ✓ | ✓ (chassis) | ✓ | ✓ |
| `binding_post` | ✓ (chassis pair) | — none: a binding post has no plug of its own; its mating partners are the `banana` and `bare_wire` assets | ✓ | ✓ (bare-wire landing) | ✓ |
| `banana` | ✓ | ✓ | — reuse `binding_post__face-recept.png` (the receptacle this lab teaches for banana plugs IS the binding post) | ✓ (dual-banana → posts) | ✓ |
| `bare_wire` | ✓ | `bare_wire__ferrule.png` fills the plug-face card slot (no faces exist — no connector exists) | `bare_wire__strands.png` fills the receptacle-face card slot | ✓ (spring-clip landing) | ✓ (strip-back progression) |
| `ts_speaker_legacy` | ✓ | — reuse `ts_quarter__face-plug.png` (ANALOG file) | — reuse `ts_quarter__face-recept.png` (ANALOG file) | ✓ | ✓ |

The `ts_speaker_legacy` face reuse is deliberate teaching, not a shortcut: the
plug is physically identical to the 1/4-inch TS instrument plug — that
identity is the Lesson 4 trap this connector exists to teach. Do NOT generate
separate near-duplicate faces; the app mounts the same two assets in both
records' face slots.

T5 files use the `<connectorId>__exploded.png` pattern (by analogy with
`anatomy__exploded.png`; the master spec does not fix T5 naming — flag to
owner). T5 prompts are OPTIONAL — the T1b generic anatomy exploded carries the
teaching; generate these only if wanted for depth.

---

## speakON-style 2-pole — `speakon_nl2`

Record-verified constraints: exactly TWO contacts (1+ / 1−); insert-then-TWIST
locking with a release; contacts enclosed and touch-protected — faces show
recessed contact channels, never exposed pins; cylindrical thermoplastic body;
cable behind it is heavy two-conductor unshielded loudspeaker cable. Real
parts carry molded 1+/1− marks — omit or keep below legibility (app overlays
all labels). No functional color in this family: neutral black/dark finishes.

### `speakon_nl2__side.png`
Mounts: Lesson 5 (LOUDSPEAKER CONNECTIONS) connector card — SIDE slot (Tier T1a); also referenced from L2 anatomy and L9 handling.

> Professional technical illustration of a generic 2-pole speakON-style
> loudspeaker cable connector, side view, on a fully transparent background.
> Cylindrical matte-black thermoplastic body, horizontal, mating end pointing
> RIGHT: at the right end, the round mating nose with its molded guide keys —
> NO metal pins visible anywhere; the contacts are recessed and
> touch-protected inside the nose. Just behind the nose, the rotating locking
> collar and its release latch read as distinct elements — match real
> speakON-type product references for collar and latch geometry (authentic,
> not decorative). Left half: the body tapers into a chuck-type strain-relief
> bushing gripping a thick round black loudspeaker cable that exits LEFT out
> of frame. Materials: matte and lightly satin black thermoplastic, subtle
> specular highlights. Key light upper-left, soft rim light lower-right so
> black plastic separates from a dark app background. Unbranded, no logos, NO
> text or numbers, no damage. Centered, filling ~80% of a 1600×1000 canvas.

### `speakon_nl2__face-plug.png`
Mounts: Lesson 5 connector card — PLUG-FACE slot (Tier T1a); passes the face-geometry verification before pin-label overlays are enabled.

> Professional technical illustration, dead-on front view of a generic 2-pole
> speakON-style loudspeaker CABLE connector's mating face, transparent
> background, 1000×1000. A circular matte-black thermoplastic face — an
> all-plastic connector, no metal shell — with asymmetric molded guide keys
> and lead-in channels around the rim, the primary guide key oriented to
> 12 o'clock. Exactly TWO recessed contact channels visible as openings set
> back inside the face: the contacts are touch-protected, so NO protruding
> pins anywhere. Match real 2-pole speakON-type face geometry from product
> references — contact and key positions must be authentic, not decorative.
> Subtle molded relief is fine, but NO legible characters, numbers, or logos
> (real parts carry molded 1+/1− marks — omit them; the app overlays labels).
> Even soft studio lighting, key from upper-left, visible depth inside the
> recesses so the touch-protection reads. Clean, unbranded, undamaged.

### `speakon_nl2__face-recept.png`
Mounts: Lesson 5 connector card — RECEPTACLE-FACE slot (Tier T2).

> Professional technical illustration, dead-on front view of a generic 2-pole
> speakON-style CHASSIS socket, transparent background, 1000×1000. A square
> black thermoplastic mounting flange with rounded corners and a plain
> mounting hole near each corner; centered in it, the round recessed socket
> cavity with twist-lock ramps and guide channels inside, primary key at
> 12 o'clock. Exactly TWO recessed contacts visible deep in the cavity — the
> contacts are touch-protected, so NOTHING protrudes and no bare pins show.
> This is NOT a mirrored copy of the cable-connector face — match real
> speakON-type chassis-socket references; the internal geometry must be
> authentic, not decorative. Matte black thermoplastic, subtle specular
> highlights, key light upper-left with gentle interior shadowing so the
> cavity depth reads against a dark app background. Unbranded, NO text,
> numbers, or logos; no panel, no screws — the flange floats alone.

### `speakon_nl2__mating.png`
Mounts: Lesson 5 connector card — MATING slot (Tier T2; the twist-lock teaching moment).

> Professional technical illustration of a generic 2-pole speakON-style pair
> about to connect, three-quarter view, transparent background, 1600×1000. On
> the LEFT, the square-flanged chassis socket mounted in a small fragment of
> dark equipment panel, recessed cavity angled toward viewer-right. On the
> RIGHT, the cylindrical black cable connector on a shared axis, mating nose
> toward the socket, separated by about half a connector length, its molded
> guide keys visibly aligned with the socket's channels so the
> insert-then-twist direction is obvious. NO exposed pins on either part —
> both faces show only recessed, touch-protected contact channels. Thick
> round black loudspeaker cable exits the cable connector away from the gap,
> rightward out of frame. Match real speakON-type references for key and
> collar geometry. Matte black thermoplastic, key light upper-left, rim light
> lower-right, unbranded, NO text or numbers.

### `speakon_nl2__exploded.png` — OPTIONAL, Tier T5
Mounts: optional depth asset for Lesson 2/Lesson 5 (the T1b generic exploded carries the core teaching).

> Simplified exploded view on a single horizontal axis, transparent
> background, 1600×1000: a generic 2-pole speakON-style cable connector
> separated into its main parts, evenly spaced left to right — stub of thick
> two-conductor loudspeaker cable, chuck-type strain-relief bushing, contact
> insert carrying exactly TWO contact assemblies, and the outer black
> thermoplastic shell with its locking collar. Clean technical-illustration
> realism, parts aligned on the axis, match real product references for part
> shapes. Key light upper-left, unbranded, NO text or numbers.

---

## speakON-style 4-pole — `speakon_nl4`

Record-verified constraints: exactly FOUR contacts (1+ / 1− / 2+ / 2−);
insert-then-TWIST locking with a release; enclosed touch-protected contacts —
recessed channels, never exposed pins; cylindrical thermoplastic body. The
4-pole shell is externally near-identical to the 2-pole — true to real parts;
the contact-count difference reads in the FACE views. Neutral black finishes;
molded 2+/2− marks on real parts must be omitted or below legibility.

### `speakon_nl4__side.png`
Mounts: Lesson 5 connector card — SIDE slot (Tier T1a); also L8 selection comparisons.

> Professional technical illustration of a generic 4-pole speakON-style
> loudspeaker cable connector, side view, on a fully transparent background.
> Cylindrical matte-black thermoplastic body, horizontal, mating end pointing
> RIGHT: at the right end, the round mating nose with molded guide keys — NO
> metal pins visible anywhere; the four contacts are recessed and
> touch-protected inside. Behind the nose, the rotating locking collar and
> release latch as clearly distinct elements — match real speakON-type
> product references for collar and latch geometry (authentic, not
> decorative). Left half tapers into a chuck-type strain-relief bushing
> gripping a thick round black loudspeaker cable exiting LEFT out of frame,
> slightly heavier in diameter than a microphone cable. Matte and satin black
> thermoplastic, subtle speculars. Key light upper-left, soft rim light
> lower-right for separation from a dark app background. Unbranded, no logos,
> NO text or numbers, no damage. Centered, ~80% of a 1600×1000 canvas.

### `speakon_nl4__face-plug.png`
Mounts: Lesson 5 connector card — PLUG-FACE slot (Tier T1a); face-geometry verification pass before pin-label overlays.

> Professional technical illustration, dead-on front view of a generic 4-pole
> speakON-style loudspeaker CABLE connector's mating face, transparent
> background, 1000×1000. Circular matte-black thermoplastic face — all
> plastic, no metal shell — with asymmetric molded guide keys and lead-in
> channels around the rim, primary guide key at 12 o'clock. Exactly FOUR
> recessed contact channels visible as openings set back inside the face,
> arranged as on real 4-pole speakON-type connectors — match real product
> references; contact cluster and key positions must be authentic, not
> decorative. The contacts are touch-protected: NO protruding pins anywhere.
> Subtle molded relief allowed, but NO legible characters, numbers, or logos
> (omit the molded 1+/1−/2+/2− marks — the app overlays labels). Even soft
> studio lighting, key upper-left, real depth inside the recesses. Clean,
> unbranded, undamaged.

### `speakon_nl4__face-recept.png`
Mounts: Lesson 5 connector card — RECEPTACLE-FACE slot (Tier T2).

> Professional technical illustration, dead-on front view of a generic 4-pole
> speakON-style CHASSIS socket, transparent background, 1000×1000. Square
> black thermoplastic mounting flange, rounded corners, a plain mounting hole
> near each corner; centered round recessed cavity with twist-lock ramps and
> guide channels, primary key at 12 o'clock. Exactly FOUR recessed contacts
> visible deep inside the cavity — touch-protected, nothing protruding, no
> bare pins. This is NOT a mirrored copy of the cable-connector face — match
> real speakON-type chassis references; internal geometry authentic, not
> decorative. Matte black thermoplastic with subtle speculars, key light
> upper-left, gentle interior shadowing so cavity depth reads against a dark
> app background. Unbranded, NO text, numbers, or logos; flange floats alone
> with no panel or screws.

### `speakon_nl4__mating.png`
Mounts: Lesson 5 connector card — MATING slot (Tier T2; twist-lock teaching moment).

> Professional technical illustration of a generic 4-pole speakON-style pair
> about to connect, three-quarter view, transparent background, 1600×1000. On
> the LEFT, the square-flanged chassis socket mounted in a small fragment of
> dark equipment panel, cavity angled toward viewer-right. On the RIGHT, the
> cylindrical black cable connector on the shared axis, nose toward the
> socket, separated by about half a connector length, molded guide keys
> visibly lined up with the socket channels so the insert-then-twist action
> is obvious. Exactly FOUR recessed contact channels implied in each face —
> NO exposed pins on either part. Thick round black loudspeaker cable exits
> the cable connector rightward, away from the gap and out of frame. Match
> real speakON-type references for key, ramp, and collar geometry. Matte
> black thermoplastic, key light upper-left, rim light lower-right,
> unbranded, NO text or numbers.

### `speakon_nl4__exploded.png` — OPTIONAL, Tier T5
Mounts: optional depth asset for Lesson 2/Lesson 5.

> Simplified exploded view on a single horizontal axis, transparent
> background, 1600×1000: a generic 4-pole speakON-style cable connector
> separated into its main parts, evenly spaced left to right — stub of thick
> loudspeaker cable, chuck-type strain-relief bushing, contact insert
> carrying exactly FOUR contact assemblies, and the outer black thermoplastic
> shell with its locking collar. Clean technical-illustration realism, parts
> aligned on the axis, match real product references for part shapes. Key
> light upper-left, unbranded, NO text or numbers.

---

## Binding post — `binding_post`

Chassis-side terminal pair — it has NO plug of its own, so there is no
`face-plug` asset (mating partners are covered by the `banana` and
`bare_wire` images). Record-verified constraints: red cap = + and black cap
= − as CONVENTION (keep the colors — they are the teaching, checked against
markings in copy); five-way post accepts bare wire, spades, and banana plugs;
post pair sits at the standard dual-banana spacing of 19 mm (0.75 in)
center-to-center. Layout choice for consistency across this family's images:
posts stacked VERTICALLY, red above black (illustration convention, not a
record fact — flagged to owner).

### `binding_post__side.png`
Mounts: Lesson 5 connector card — SIDE slot (Tier T1a); also L2 anatomy reference.

> Professional technical illustration of a generic pair of five-way binding
> posts, side view, on a fully transparent background, 1600×1000. A small
> fragment of dark equipment panel at the LEFT edge with two binding posts
> projecting horizontally RIGHT, stacked vertically — red-capped post above,
> black-capped post below — their centers spaced at the standard dual-banana
> spacing of 19 mm (0.75 in), proportions true. Each post: a metal threaded
> shaft with a knurled insulated thumb-cap in its color and a front bore that
> accepts a 4 mm banana pin. The upper (red) post's cap is partially
> unscrewed, exposing the cross-hole through the shaft where bare wire is
> clamped; the black post is fully closed. Match real five-way binding-post
> references — geometry authentic, not decorative. Glossy red and black
> insulation, nickel metal, key light upper-left, rim light lower-right.
> Unbranded, NO text, numbers, or logos.

### `binding_post__face-recept.png`
Mounts: Lesson 5 connector card — RECEPTACLE-FACE slot (Tier T2). (No face-plug asset exists for this record — see family mapping table.)

> Professional technical illustration, dead-on front view of a generic pair
> of five-way binding posts, transparent background, 1000×1000. Two round
> insulated post caps seen head-on against a small fragment of dark equipment
> panel: red cap on top, black cap below, centers separated at the standard
> dual-banana spacing of 19 mm (0.75 in) — proportions must read true, since
> this spacing is what lets a molded dual-banana plug mate with the pair.
> Each cap face shows a center opening exposing the metal socket bore that
> accepts a 4 mm banana pin. Match real five-way binding-post references —
> authentic geometry, not decorative. Real caps often carry molded + and −
> marks: omit them or keep them below legibility; NO legible text, numbers,
> or logos anywhere (the app overlays labels). Glossy red and black
> insulation, nickel metal in the bores, key light upper-left, soft interior
> shadow for depth. Clean, unbranded.

### `binding_post__mating.png`
Mounts: Lesson 5 connector card — MATING slot (Tier T2; the clamp-landing teaching moment; L9 strand-discipline reference).

> Professional technical illustration of bare loudspeaker wire about to land
> on binding posts, three-quarter view, transparent background, 1600×1000. On
> the LEFT, a pair of five-way binding posts on a small fragment of dark
> panel, red-capped post above black-capped post, both caps partially
> unscrewed so the cross-holes through their shafts are exposed. From the
> RIGHT, two stripped conductor ends of a heavy two-conductor loudspeaker
> cable approach the posts, separated from them by about one post length:
> bright copper strands twisted into neat tight bundles with NO stray
> whiskers, aimed at the open cross-holes. The conductor whose insulation
> carries a subtle molded ridge stripe (the polarity marking to be read)
> aligns with the red post. Match real binding-post references. Glossy
> red/black insulation, nickel metal, bright copper, key light upper-left,
> rim lower-right. Unbranded, NO text or numbers.

### `binding_post__exploded.png` — OPTIONAL, Tier T5
Mounts: optional depth asset for Lesson 2/Lesson 5.

> Simplified exploded view of ONE generic five-way binding post along its
> axis, transparent background, 1600×1000, parts evenly spaced: knurled red
> insulated thumb-cap, threaded metal shaft with its cross-hole for bare
> wire, insulating shoulder collar, small fragment of panel with mounting
> hole, and the rear nut and terminal hardware. Match real five-way
> binding-post references for part shapes — authentic, not decorative. Clean
> technical-illustration realism, key light upper-left, unbranded, NO text or
> numbers.

---

## Banana plug — `banana`

Record-verified constraints: 4 mm pin, sprung-leaf contact, friction fit
only (no lock); a single plug carries NO polarity identity of its own — so
the single plug renders in neutral finishes, no red/black body; molded
dual-banana bodies pair two plugs at the 19 mm (0.75 in) standard spacing,
with a tab or ridge marking one leg as the conventional ground/− side (keep
it subtle molded relief). No face-recept asset: the receptacle this lab
teaches is the binding post — reuse `binding_post__face-recept.png`.

### `banana__side.png`
Mounts: Lesson 5 connector card — SIDE slot (Tier T1a); also L4 SAME PLUG, DIFFERENT JOB comparison strip.

> Professional technical illustration of a single generic 4 mm banana plug,
> side view, on a fully transparent background, 1600×1000. Horizontal,
> mating end pointing RIGHT: a cylindrical nickel-finish metal pin with a
> rounded tip, its four sprung leaf contacts bowed gently outward along the
> pin body in the classic sprung-banana profile — match real 4 mm banana
> plug references (leaf geometry authentic, not decorative). Behind the pin,
> a plain cylindrical insulated body in a neutral dark finish — deliberately
> NO red or black polarity color, because a single banana plug carries no
> polarity identity of its own — then a flexible loudspeaker-cable conductor
> exiting LEFT out of frame. Materials: bright nickel pin with soft
> reflections, matte dark insulation. Key light upper-left, subtle rim light
> lower-right for separation from a dark app background. Unbranded, NO text,
> numbers, or logos, no wear. Centered, ~80% of canvas.

### `banana__face-plug.png`
Mounts: Lesson 5 connector card — PLUG-FACE slot (Tier T1a).

> Professional technical illustration, dead-on front view of a generic 4 mm
> banana plug's pin end, transparent background, 1000×1000. The round nickel
> pin tip seen head-on, with its four sprung leaf contacts reading as evenly
> spaced bowed ribs around the pin's circumference, slightly proud of the pin
> body — match real sprung banana plug references; leaf count and spacing
> authentic, not decorative. Behind the pin, the plain neutral-dark insulated
> body rim in soft focus of depth, no polarity color (a single banana plug
> has no polarity identity). No keyway exists on this connector, so no
> clocking requirement — center the pin. Even soft studio lighting, key from
> upper-left, enough shading that the leaves' curvature reads. Clean,
> unbranded, NO text, numbers, or logos, no damage.

*(No `banana__face-recept.png` — reuse `binding_post__face-recept.png`; see family mapping table.)*

### `banana__mating.png`
Mounts: Lesson 5 connector card — MATING slot (Tier T2; the 19 mm dual-banana compatibility teaching moment).

> Professional technical illustration of a molded dual-banana plug about to
> mate with a binding-post pair, three-quarter view, transparent background,
> 1600×1000. On the LEFT, two five-way binding posts on a small fragment of
> dark panel, red cap above black cap, centers at the standard 19 mm
> (0.75 in) spacing. On the RIGHT, a molded rectangular dual-banana body
> carrying exactly TWO 4 mm sprung-leaf pins at exactly that same spacing,
> pins toward the posts, separated by about half the body length — the
> matched spacing must read as the reason they mate. One edge of the molded
> body carries a subtle raised tab marking the conventional ground/− leg,
> aligned with the black post — molded relief only, NO legible characters. A
> two-conductor loudspeaker cable exits the body rightward out of frame.
> Match real dual-banana references. Nickel pins, neutral dark molded body,
> glossy red/black caps, key light upper-left, rim lower-right. Unbranded, NO
> text or numbers.

### `banana__exploded.png` — OPTIONAL, Tier T5
Mounts: optional depth asset for Lesson 2/Lesson 5.

> Simplified exploded view of a single generic 4 mm banana plug along its
> axis, transparent background, 1600×1000, parts evenly spaced left to
> right: stub of loudspeaker-cable conductor, plain neutral-dark insulating
> body sleeve, internal conductor terminal (screw or crimp style), and the
> nickel pin with its four sprung leaf contacts. Match real banana-plug
> references for part shapes — authentic, not decorative. Clean
> technical-illustration realism, key light upper-left, unbranded, NO text or
> numbers.

---

## Bare-wire termination — `bare_wire`

There is NO connector here — that absence is the record's central teaching —
so there are no faces and no plug/receptacle pair. Honest view set (mapping
table above): `side` = prepared cable end; `ferrule` and `strands` are
1000×1000 detail views filling the two face card slots; `mating` = landing on
spring-clip terminals (a record-verified destination). Record-verified
constraints: two heavier unshielded conductors; polarity exists only as a
cable marking (stripe / ribbing / print) to be read; neat twisting or a
crimped ferrule where the terminal calls for one; stray strands invite short
circuits.

### `bare_wire__side.png`
Mounts: Lesson 5 connector card — SIDE slot (Tier T1a); also the L2 anatomy "no connector" teaching image.

> Professional technical illustration of the prepared end of a two-conductor
> loudspeaker cable — bare-wire termination, no connector of any kind — side
> view, fully transparent background, 1600×1000. A zip-style parallel pair of
> heavy insulated conductors enters from the LEFT and runs horizontally; at
> the RIGHT, the two conductors are split apart for the last stretch and each
> is stripped, exposing bright copper strands twisted into neat, tight
> bundles pointing RIGHT — no fraying, no stray whiskers. One conductor's
> insulation carries a subtle molded ridge stripe along its length: the
> polarity marking that must be read, since nothing else identifies the
> conductors. Match real loudspeaker zip-cord references — construction
> authentic, not decorative. Matte dark insulation, bright untarnished
> copper, key light upper-left, rim light lower-right against a dark app
> background. Unbranded, NO text, numbers, or logos.

### `bare_wire__ferrule.png`
Mounts: Lesson 5 connector card — fills the PLUG-FACE card slot (Tier T1a); L9 termination-quality reference. Detail view, not a face.

> Professional technical illustration, close-up three-quarter view of a
> single stripped stranded conductor fitted with a crimped wire ferrule,
> transparent background, 1000×1000. The heavy insulated loudspeaker-cable
> conductor enters from lower-left; where the insulation ends, a bright metal
> ferrule tube is crimped snugly over the gathered copper strands, its plain
> insulating funnel collar seated against the insulation — a clean,
> professional termination with no strands escaping. Neutral collar color
> only — do not imply any color-code meaning. Match real crimped wire-ferrule
> references — crimp pattern and proportions authentic, not decorative.
> Materials: matte dark insulation, satin ferrule metal, bright copper just
> visible at the ferrule tip. Key light upper-left, soft rim lower-right.
> Clean, unbranded, NO text, numbers, or logos.

### `bare_wire__strands.png`
Mounts: Lesson 5 connector card — fills the RECEPTACLE-FACE card slot (Tier T1a/T2); L9 HANDLING & INSPECTION strand-discipline reference. Detail view, not a face.

> Professional technical illustration, close-up comparison of two stripped
> loudspeaker-cable conductor ends side by side, transparent background,
> 1000×1000, both horizontal with stripped copper pointing RIGHT. UPPER
> conductor: correctly prepared — bright copper strands twisted into one
> neat, tight bundle, insulation cleanly cut. LOWER conductor: badly
> prepared — strands frayed and splayed, with one long stray whisker strand
> bending clearly away from the bundle, the kind that bridges to a
> neighboring terminal. Same cable type and stripping length on both, so the
> ONLY difference is the dressing of the strands. The app overlays the
> good/bad labels — NO text, numbers, checkmarks, or symbols in the image.
> Matte dark insulation, bright copper, key light upper-left, soft rim
> lower-right. Match real stranded-wire references. Unbranded, clean
> rendering of an untidy subject.

### `bare_wire__mating.png`
Mounts: Lesson 5 connector card — MATING slot (Tier T2; landing on a record-verified destination).

> Professional technical illustration of bare loudspeaker wire about to land
> on spring-clip terminals, three-quarter view, transparent background,
> 1600×1000. On the LEFT, a small fragment of a loudspeaker's dark rear
> panel carrying a pair of spring-clip terminals — red lever above black
> lever, each clip's lever pressed open to expose its wire hole — match real
> spring-clip terminal references, geometry authentic, not decorative. From
> the RIGHT, the two prepared conductor ends of a zip-style loudspeaker
> cable approach on axis, separated by about one clip length: bright copper
> strands twisted into neat bundles, no stray whiskers, the ridge-striped
> (polarity-marked) conductor aligned with the red clip. Cable runs
> rightward out of frame. Red/black plastic levers, matte dark panel, bright
> copper, key light upper-left, rim lower-right. Unbranded, NO text,
> numbers, or logos.

### `bare_wire__exploded.png` — OPTIONAL, Tier T5 (strip-back progression)
Mounts: optional depth asset for Lesson 2 anatomy / Lesson 9 termination sequence.

> Simplified strip-back progression, transparent background, 1600×1000: FOUR
> stages of the same zip-style two-conductor loudspeaker cable end, arranged
> left to right — (1) unstripped end, (2) conductors split and insulation
> stripped, strands loose, (3) strands twisted into neat bundles, (4) one
> conductor fitted with a crimped ferrule. Same cable in every stage, evenly
> spaced, horizontal. Matte dark insulation with a subtle ridge stripe on one
> conductor, bright copper, satin ferrule. Match real references. Key light
> upper-left, unbranded, NO text or numbers.

---

## 1/4-inch TS, legacy loudspeaker use — `ts_speaker_legacy`

Record-verified constraints: exactly TWO contacts (tip + sleeve, ONE
insulating ring — never a TRS second ring); friction fit, no lock; the plug
is physically identical to the 1/4-inch instrument plug — so the FACE views
REUSE `ts_quarter__face-plug.png` and `ts_quarter__face-recept.png` from the
ANALOG family file (that identity IS the Lesson 4 trap; do not generate
duplicates). What is unique here is the CABLE: heavy unshielded zip-style
two-conductor loudspeaker cable — the SIDE view must make its thickness
unmistakable; that is the teaching.

### `ts_speaker_legacy__side.png`
Mounts: Lesson 5 connector card — SIDE slot (Tier T1a); the L4 SAME PLUG, DIFFERENT JOB hero comparison against `ts_quarter__side.png`.

> Professional technical illustration of a generic 1/4-inch TS phone plug on
> heavy loudspeaker cable, side view, fully transparent background,
> 1600×1000. Mating end pointing RIGHT: chromed 1/4-inch shaft with a
> rounded tip, exactly ONE black insulating ring separating tip from sleeve
> — exactly TWO contacts; this is NOT a TRS plug, no second ring. Behind the
> shaft, a cylindrical metal barrel and strain relief. The defining feature:
> the cable is a visibly HEAVY zip-style parallel two-conductor unshielded
> loudspeaker cable, clearly thicker than an instrument cable and nearly as
> wide as the plug barrel itself, its parallel-pair profile readable as it
> exits LEFT out of frame — the plug is ordinary, the cable is the teaching,
> so make its bulk unmistakable. Chrome with soft reflections, matte dark
> cable insulation. Key light upper-left, rim light lower-right. Unbranded,
> NO text, numbers, or logos, no wear.

*(No face prompts — `ts_speaker_legacy` face slots reuse `ts_quarter__face-plug.png` and `ts_quarter__face-recept.png` from `APE_CABLE_ART_PROMPTS_ANALOG.md`. The plug is physically identical; teaching that identity is this record's purpose.)*

### `ts_speaker_legacy__mating.png`
Mounts: Lesson 5 connector card — MATING slot (Tier T2); L8 selection reference (output jack vs input jack, same shell).

> Professional technical illustration of a 1/4-inch TS loudspeaker connection
> about to mate, three-quarter view, transparent background, 1600×1000. On
> the LEFT, a small fragment of a dark amplifier rear panel carrying a plain
> 1/4-inch jack — round chromed nut and washer on a dark panel, the jack
> opening toward viewer-right; deliberately indistinguishable from any other
> 1/4-inch jack, because that anonymity is true to life. On the RIGHT, the
> TS plug on a shared axis, tip toward the jack, separated by about half a
> plug length: chromed shaft, exactly ONE insulating ring (two contacts, not
> TRS), metal barrel — and a visibly HEAVY zip-style two-conductor
> loudspeaker cable exiting rightward out of frame, clearly thicker than
> instrument cable. Match real 1/4-inch plug and jack references. Chrome,
> matte dark panel and insulation, key light upper-left, rim lower-right.
> Unbranded, NO text or numbers.

### `ts_speaker_legacy__exploded.png` — OPTIONAL, Tier T5
Mounts: optional depth asset for Lesson 4/Lesson 5 — the no-shield truth made visible.

> Simplified exploded view of a generic 1/4-inch TS plug opened for wiring,
> single horizontal axis, transparent background, 1600×1000: barrel shell
> unscrewed and slid back LEFT along a heavy zip-style two-conductor
> loudspeaker cable; center, the exposed plug frame with its two solder
> lugs; right, the chromed shaft with ONE insulating ring. The two heavy
> conductors dress to tip lug and sleeve lug — NO shield, braid, or foil
> anywhere, because loudspeaker cable has none; that absence is the point.
> Match real 1/4-inch plug references. Chrome, copper, matte insulation, key
> light upper-left, unbranded, NO text or numbers.

---

## Delivery checklist for this family

| File | Canvas | Tier |
|---|---|---|
| `speakon_nl2__side.png` | 1600×1000 | T1a |
| `speakon_nl2__face-plug.png` | 1000×1000 | T1a |
| `speakon_nl2__face-recept.png` | 1000×1000 | T2 |
| `speakon_nl2__mating.png` | 1600×1000 | T2 |
| `speakon_nl2__exploded.png` | 1600×1000 | T5 (optional) |
| `speakon_nl4__side.png` | 1600×1000 | T1a |
| `speakon_nl4__face-plug.png` | 1000×1000 | T1a |
| `speakon_nl4__face-recept.png` | 1000×1000 | T2 |
| `speakon_nl4__mating.png` | 1600×1000 | T2 |
| `speakon_nl4__exploded.png` | 1600×1000 | T5 (optional) |
| `binding_post__side.png` | 1600×1000 | T1a |
| `binding_post__face-recept.png` | 1000×1000 | T2 |
| `binding_post__mating.png` | 1600×1000 | T2 |
| `binding_post__exploded.png` | 1600×1000 | T5 (optional) |
| `banana__side.png` | 1600×1000 | T1a |
| `banana__face-plug.png` | 1000×1000 | T1a |
| `banana__mating.png` | 1600×1000 | T2 |
| `banana__exploded.png` | 1600×1000 | T5 (optional) |
| `bare_wire__side.png` | 1600×1000 | T1a |
| `bare_wire__ferrule.png` | 1000×1000 | T1a (fills face-plug slot) |
| `bare_wire__strands.png` | 1000×1000 | T2 (fills face-recept slot) |
| `bare_wire__mating.png` | 1600×1000 | T2 |
| `bare_wire__exploded.png` | 1600×1000 | T5 (optional) |
| `ts_speaker_legacy__side.png` | 1600×1000 | T1a |
| `ts_speaker_legacy__mating.png` | 1600×1000 | T2 |
| `ts_speaker_legacy__exploded.png` | 1600×1000 | T5 (optional) |

26 prompts (20 standard-tier + 6 optional T5). Reused assets (no new files):
`binding_post__face-recept.png` doubles for `banana`'s receptacle face;
`ts_quarter__face-plug.png` / `ts_quarter__face-recept.png` (ANALOG file)
fill both `ts_speaker_legacy` face slots. `binding_post` has no face-plug
asset by design.
