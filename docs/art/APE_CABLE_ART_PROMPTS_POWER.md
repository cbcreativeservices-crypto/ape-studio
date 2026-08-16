# Cable & Connector Lab — Artwork Prompts: CORE POWER FAMILY (2026-08-16)

**Companion to:** `docs/art/APE_CABLE_ART_SPEC_2026_08_16.md` (master spec — global
style guide, naming, tiers). **Facts source:** verified records in
`src/screens/lab/cable/data/connectors.power.ts`.

**THIS IS THE MOST SAFETY-CRITICAL PROMPT FILE IN THE PACKAGE.** These images
teach recognition of mains connectors. A wrong face is not a cosmetic bug — it
mis-teaches a safety fact. Every hard constraint below comes from the family's
verified records; everything finer defers to real product references and the
face-geometry verification pass.

## Family-wide rules (apply to every prompt in this file)

- **Never depict damage, wet conditions, or unsafe handling in any power
  image.** No frayed cords, no scorched contacts, no water, no fingers near
  contacts. Damage imagery belongs exclusively to the L9 inspection vignettes
  in the SCENES file.
- **No wiring or termination detail, ever.** No internal terminals, no screw
  posts, no stripped conductors. Internal wiring of mains connectors is
  qualified-person work and this lab never illustrates it — the T5 exploded
  prompts below are deliberately outer-component-only.
- **Face orientation overrides for this family** (the master spec's 12 o'clock
  keying rule, made concrete — confirm at the face-geometry verification pass):
  - NEMA 5-15 faces: the two blades/slots vertical and side by side, the
    round-earth feature BELOW them (6 o'clock).
  - IEC coupler faces (C13/C14, C19/C20, C5/C6, C7/C8): the coupler's
    keying/chamfer feature at 12 o'clock.
  - powerCON-pattern and TRUE1-pattern faces: latch/keyway at 12 o'clock.
- Plug/cord-end faces and receptacle/inlet faces are ALWAYS separate images —
  never mirror, flip, or recolor one to make the other.
- Sizes: SIDE / MATING / exploded 1600×1000; FACE views 1000×1000. PNG,
  transparent background. Naming exactly as headed below.

## Reuse mapping (no prompts — these records reuse base-connector art)

| Record | Reuses | Files |
|---|---|---|
| `usb_c_power` (USB-C as power / USB PD) | `usb_c` (digital family) | `usb_c__side.png`, `usb_c__face-plug.png`, `usb_c__face-recept.png`, `usb_c__mating.png` |
| `poe` (Power over Ethernet) | `ethernet_8p8c` (digital family) | `ethernet_8p8c__side.png`, `ethernet_8p8c__face-plug.png`, `ethernet_8p8c__face-recept.png`, `ethernet_8p8c__mating.png` |

This reuse is itself the teaching point (verified in both records): nothing
visible on a USB-C plug or an 8P8C plug shows whether power is present. The
app teaches that with overlays on the SAME images — generating separate
"power versions" would falsely imply a visible difference. Do not generate
duplicate art for these two records.

---

# 1. `mains_wall` — Mains wall plug (NEMA 5-15, NA region)

Verified hard facts: exactly two flat parallel blades of DIFFERENT widths —
narrow = line, wide = neutral — plus one round protective-earth pin; blades
carry no insulating sleeves; friction retention only; 15 A receptacle has a
plain (not T-shaped) neutral slot.

### `mains_wall__side.png` — grounded wall plug, side view
Mounts: Lesson 7 (Power) mains_wall connector card, side-view slot (T1a); also Lesson 2 anatomy references and Lesson 9 handling.

> Professional technical illustration of a generic North American grounded
> mains wall plug (NEMA 5-15 pattern), side view, on a fully transparent
> background. A molded matte-black thermoplastic plug body with the mating end
> pointing RIGHT: two flat parallel brass blades projecting rightward, seen
> edge-on, with the round earth pin also visible in authentic 5-15 position —
> match real product references; geometry must be authentic, not decorative.
> The blades are bare metal along their full length with NO insulating sleeves
> (accurate to the standard). The body tapers leftward into a molded
> strain-relief boot and a round black cable jacket exiting LEFT out of frame.
> Materials: satin brass blades, matte black molded plastic. Lighting: key
> light upper-left, soft rim light lower-right so dark plastic separates from
> a dark app background. Unbranded, no logos, NO text or numbers anywhere,
> clean and undamaged, dry. Centered, horizontal, filling ~80% of a 1600×1000
> canvas.

### `mains_wall__face-plug.png` — plug blade face, head-on
Mounts: Lesson 7 mains_wall card, plug-face slot (T1a); base image for the app's line/neutral/earth overlays after the face-geometry pass.

> Professional technical illustration, dead-on front view of a generic NEMA
> 5-15 grounded mains plug's blade face, transparent background, 1000×1000.
> A matte-black molded plug face carrying exactly TWO flat parallel vertical
> blades side by side, plus exactly ONE round earth pin below them. HARD
> REQUIREMENT: the two blades are visibly DIFFERENT widths — one NARROWER
> (the line blade) and one WIDER (the neutral blade). This width difference is
> verified teaching content and must read clearly at a glance. Which side each
> blade sits on, blade spacing, and the earth pin's exact position must match
> real NEMA 5-15P face references — authentic, not decorative. Blades bare
> satin brass with no insulating sleeves; the small factory holes near the
> blade tips are acceptable. NO text, numbers, or legible molded markings.
> Key light upper-left, soft even studio lighting, subtle shadowing for depth.
> Unbranded, clean, undamaged, dry.

### `mains_wall__face-recept.png` — wall receptacle face, head-on
Mounts: Lesson 7 mains_wall card, receptacle-face slot (T2); pairs with the plug face for the polarization teaching moment.

> Professional technical illustration, dead-on front view of a single generic
> North American grounded wall receptacle face (NEMA 5-15R pattern),
> transparent background, 1000×1000. One receptacle face only — not a duplex
> outlet, no wall plate. A matte black or dark-gray thermoplastic face (common
> commercial finish) carrying exactly TWO vertical slots side by side — one
> visibly LARGER (neutral) and one SMALLER (line) — plus one rounded earth
> aperture below them. This is the 15 A pattern: the neutral slot is a plain
> straight slot, NOT the T-shaped slot of the 20 A version. Slot proportions,
> left/right placement and earth-aperture shape must match real NEMA 5-15R
> references — this is NOT a mirrored copy of the plug face; plug and
> receptacle are separate assets. No metal visible in the slots (nothing
> partially inserted). NO text or numbers. Key light upper-left, gentle
> shadowing for depth. Unbranded, clean, undamaged, dry.

### `mains_wall__mating.png` — plug approaching receptacle
Mounts: Lesson 7 mains_wall card, mating slot (T2); supports the "fully seated, one motion" handling teaching in Lesson 9.

> Professional technical illustration of a generic North American grounded
> mains connection about to be made, three-quarter view, transparent
> background, 1600×1000: on the LEFT a single NEMA 5-15R receptacle face
> (dark thermoplastic, larger neutral slot, smaller line slot, rounded earth
> aperture below), angled slightly toward viewer-right; on the RIGHT a molded
> black NEMA 5-15 plug, its two different-width brass blades and round earth
> pin aimed at the receptacle, separated by about half a plug length on a
> shared axis, cable exiting rightward away from the gap. Blade-to-slot
> alignment must be geometrically correct so the connection direction and fit
> are obvious — match real product references. Nothing touching yet; no hands;
> fully undamaged and dry. Satin brass, matte black plastic, key light
> upper-left, rim light lower-right, unbranded, NO text or numbers.

### `mains_wall__exploded.png` — OPTIONAL — T5, simplified exploded
Mounts: optional depth art, Lesson 2/7 (only if T5 tier is generated).

> OPTIONAL — T5. Professional technical illustration, simplified exploded view
> of a generic molded NEMA 5-15 mains plug, transparent background, 1600×1000,
> components separated along a shared horizontal axis, mating end RIGHT:
> blade-carrier block holding the two different-width brass blades and round
> earth pin; molded outer plug shell; strain-relief boot; round black cable
> stub exiting LEFT. OUTER COMPONENTS ONLY — absolutely no internal terminals,
> screws, stripped wires or wiring detail (this lab never depicts mains
> termination). Matte black plastic, satin brass, key light upper-left,
> unbranded, NO text or numbers, clean and undamaged.

---

# 2. `iec_c13_c14` — IEC C13 / C14 coupler

Verified hard facts: three contacts (line, neutral, protective earth);
C14 = the equipment INLET and carries the PINS; C13 = the cord end and
carries recessed SOCKETS — the energized side is always the recessed
(female) side; friction retention only.

### `iec_c13_c14__side.png` — C13 cord connector, side view
Mounts: Lesson 7 (Power) iec_c13_c14 connector card, side-view slot (T1a); also Lesson 4 "same plug, different job" comparisons.

> Professional technical illustration of a generic IEC C13 cord connector (the
> common detachable equipment-power cord end), side view, fully transparent
> background. A molded matte-black thermoplastic coupler body, mating end
> pointing RIGHT: from the side, the characteristic C13 block form — a
> rectangular-section body whose mating face is slightly recessed, with the
> dark socket openings just visible edge-on at the right end. This is the CORD
> end: sockets only, NO pins anywhere. Fine body profile and any molded grip
> ribs must match real C13 product references — authentic, not decorative.
> The body tapers leftward through a molded strain-relief boot onto a round
> black cable jacket exiting LEFT out of frame. Matte black molded plastic
> throughout. Key light upper-left, soft rim light lower-right for separation
> against a dark app background. Unbranded, NO text or numbers, clean,
> undamaged, dry. Centered, horizontal, ~80% of a 1600×1000 canvas.

### `iec_c13_c14__face-plug.png` — C13 cord-end mating face (SOCKETS), head-on
Mounts: Lesson 7 iec_c13_c14 card, cord-end face slot (T1a); base for the app's L/N/E overlays after the face-geometry pass.

> Professional technical illustration, dead-on front view of a generic IEC C13
> cord connector's mating face, transparent background, 1000×1000. The
> characteristic six-sided C13 outline — a rectangle with two chamfered
> corners — chamfered corners oriented to 12 o'clock. In the matte-black face,
> exactly THREE recessed rectangular socket apertures in the authentic C13
> arrangement, with the chromed contact liners just barely visible in shadow
> inside. HARD REQUIREMENT: this is the CORD end and shows SOCKETS ONLY — no
> pins. The standard puts the sockets on the side that gets energized, so
> depicting pins here would mis-teach a safety rule. Aperture positions,
> spacing and outline proportions must match real C13 product references —
> authentic, not decorative. NO text, numbers or legible molded markings.
> Key light upper-left, soft interior shadowing for recess depth. Unbranded,
> clean, undamaged.

### `iec_c13_c14__face-recept.png` — C14 equipment inlet face (PINS), head-on
Mounts: Lesson 7 iec_c13_c14 card, inlet-face slot (T2); the pins-vs-sockets teaching pair with the C13 face.

> Professional technical illustration, dead-on front view of a generic IEC C14
> equipment power inlet, transparent background, 1000×1000. A panel-mount
> black thermoplastic inlet: the six-sided C14 opening — rectangle with two
> chamfered corners, chamfers at 12 o'clock — recessed into a molded shroud,
> with exactly THREE metal pins standing inside the recess in the authentic
> C14 arrangement. HARD REQUIREMENT: the INLET side carries the PINS, sitting
> protected inside the recessed shroud — this is the de-energized equipment
> side; it is NOT a mirrored or inverted copy of the C13 image. Pin
> cross-section, positions and shroud depth must match real C14 product
> references — authentic, not decorative. A simple rectangular mounting flange
> around the shroud is acceptable; no screws detail needed. NO text or
> numbers. Key light upper-left, clear interior shadowing so the recess and
> pin depth read. Unbranded, clean, undamaged.

### `iec_c13_c14__mating.png` — C13 cord end approaching C14 inlet
Mounts: Lesson 7 iec_c13_c14 card, mating slot (T2).

> Professional technical illustration of a generic IEC C13/C14 power
> connection about to be made, three-quarter view, transparent background,
> 1600×1000: on the LEFT a panel-mount C14 equipment inlet (recessed shroud,
> three pins visible inside, chamfered corners up), angled slightly toward
> viewer-right; on the RIGHT a molded black C13 cord connector, its recessed
> socket face aimed at the inlet, separated by about half a connector length
> on a shared axis, black cable exiting rightward away from the gap. The
> chamfered-corner keying of both halves must visibly align so the one-way fit
> is obvious — match real product references for all face geometry. Pins on
> the inlet side only; sockets on the cord side only. Matte black molded
> plastic, key light upper-left, rim light lower-right, unbranded, NO text or
> numbers, clean, undamaged, dry.

### `iec_c13_c14__exploded.png` — OPTIONAL — T5, simplified exploded
Mounts: optional depth art, Lesson 7 (only if T5 tier is generated).

> OPTIONAL — T5. Professional technical illustration, simplified exploded view
> of a generic IEC C13 cord connector, transparent background, 1600×1000,
> components separated along a shared horizontal axis, mating end RIGHT:
> six-sided molded face block with its three recessed socket apertures; molded
> outer body shell; strain-relief boot; round black cable stub exiting LEFT.
> OUTER COMPONENTS ONLY — no internal terminals, contacts on posts, screws or
> wiring detail of any kind. Matte black molded plastic, key light upper-left,
> unbranded, NO text or numbers, clean and undamaged.

---

# 3. `iec_c19_c20` — IEC C19 / C20 coupler

Verified hard facts: three contacts (line, neutral, protective earth);
larger, rectangular, differently keyed than C13/C14 — deliberately
non-intermateable with it; C20 (pins) is the inlet, C19 (recessed sockets)
is the cord end; friction retention only.

### `iec_c19_c20__side.png` — C19 cord connector, side view
Mounts: Lesson 7 (Power) iec_c19_c20 connector card, side-view slot (T1a); size-contrast comparisons against C13.

> Professional technical illustration of a generic IEC C19 high-current cord
> connector, side view, fully transparent background. A molded matte-black
> thermoplastic coupler body, visibly CHUNKIER and more squared-off than the
> common C13 computer-cord coupler, mating end pointing RIGHT: a rectangular
> block body with a slightly recessed mating face at the right end, dark
> socket openings just visible edge-on. Cord end = sockets only, NO pins. Body
> proportions and profile must match real C19 product references — authentic,
> not decorative. The body transitions leftward through a heavy molded
> strain-relief boot onto a noticeably thick round black cable jacket exiting
> LEFT out of frame (heavier gauge than a standard computer cord — this is the
> high-current family member). Matte black molded plastic. Key light
> upper-left, soft rim light lower-right. Unbranded, NO text or numbers,
> clean, undamaged, dry. Centered, horizontal, ~80% of a 1600×1000 canvas.

### `iec_c19_c20__face-plug.png` — C19 cord-end mating face (SOCKETS), head-on
Mounts: Lesson 7 iec_c19_c20 card, cord-end face slot (T1a).

> Professional technical illustration, dead-on front view of a generic IEC C19
> cord connector's mating face, transparent background, 1000×1000. A clean
> RECTANGULAR outline with squared corners — deliberately unlike the
> chamfered-corner C13 — in matte-black thermoplastic, carrying exactly THREE
> recessed socket apertures in the authentic C19 arrangement, chromed contact
> liners barely visible in shadow inside. HARD REQUIREMENT: cord end = SOCKETS
> only, no pins; the energized side of this coupler family is always the
> recessed side. Aperture shapes, orientations and spacing must match real C19
> product references — authentic, not decorative; do not copy or scale the C13
> face geometry. Keying orientation to 12 o'clock per real references. NO
> text, numbers or legible markings. Key light upper-left, soft interior
> shadowing for recess depth. Unbranded, clean, undamaged.

### `iec_c19_c20__face-recept.png` — C20 equipment inlet face (PINS), head-on
Mounts: Lesson 7 iec_c19_c20 card, inlet-face slot (T2).

> Professional technical illustration, dead-on front view of a generic IEC C20
> high-current equipment inlet, transparent background, 1000×1000. A
> panel-mount black thermoplastic inlet with a RECTANGULAR squared-corner
> recess — larger and visibly different from a C14 — holding exactly THREE
> flat metal pins standing inside the recessed shroud in the authentic C20
> arrangement. HARD REQUIREMENT: the inlet carries the PINS, recessed and
> protected; this is NOT a mirrored copy of the C19 cord-end image, and it is
> NOT a resized C14. Pin cross-sections, orientations, spacing and recess
> depth must match real C20 product references — authentic, not decorative.
> Simple rectangular mounting flange acceptable. NO text or numbers. Key light
> upper-left, interior shadowing so pin depth reads. Unbranded, clean,
> undamaged.

### `iec_c19_c20__mating.png` — C19 cord end approaching C20 inlet
Mounts: Lesson 7 iec_c19_c20 card, mating slot (T2).

> Professional technical illustration of a generic IEC C19/C20 high-current
> power connection about to be made, three-quarter view, transparent
> background, 1600×1000: on the LEFT a panel-mount C20 inlet (rectangular
> recess, three flat pins inside), angled slightly toward viewer-right; on the
> RIGHT a chunky molded black C19 cord connector, recessed socket face aimed
> at the inlet, separated by about half a connector length on a shared axis,
> thick black cable exiting rightward away from the gap. The rectangular
> keying of both halves must visibly correspond so the fit reads as one-way —
> match real product references for all face geometry. Pins on the inlet only;
> sockets on the cord end only. Matte black molded plastic, key light
> upper-left, rim light lower-right, unbranded, NO text or numbers, clean,
> undamaged, dry.

### `iec_c19_c20__exploded.png` — OPTIONAL — T5, simplified exploded
Mounts: optional depth art, Lesson 7 (only if T5 tier is generated).

> OPTIONAL — T5. Professional technical illustration, simplified exploded view
> of a generic IEC C19 cord connector, transparent background, 1600×1000,
> components separated along a shared horizontal axis, mating end RIGHT:
> rectangular molded face block with three recessed socket apertures; outer
> body shell; heavy strain-relief boot; thick round black cable stub exiting
> LEFT. OUTER COMPONENTS ONLY — no terminals, screws or wiring detail. Matte
> black molded plastic, key light upper-left, unbranded, NO text or numbers,
> clean and undamaged.

---

# 4. `iec_c5_c6` — IEC C5 / C6 "cloverleaf" coupler

Verified hard facts: three contacts INCLUDING protective earth despite the
small size (this is the earthed small-appliance coupler, unlike the two-pole
C7/C8); C6 (pins) is the inlet, C5 (recessed sockets) the cord end; friction
retention only.

### `iec_c5_c6__side.png` — C5 cord connector, side view
Mounts: Lesson 7 (Power) iec_c5_c6 connector card, side-view slot (T1a).

> Professional technical illustration of a generic IEC C5 "cloverleaf" cord
> connector, side view, fully transparent background. A small molded
> matte-black thermoplastic coupler, mating end pointing RIGHT: from the side
> the body reads as a compact rounded-lobed block — the three-lobed cloverleaf
> form seen edge-on, with the lobed silhouette visible in the body's top
> contour — and a slightly recessed mating face at the right end with dark
> socket openings just visible. Cord end = sockets only, NO pins. Exact lobe
> profile must match real C5 product references — authentic, not decorative.
> The body tapers leftward through a slim molded strain-relief boot onto a
> light-gauge round black cable exiting LEFT out of frame. This is a small,
> light coupler — keep it delicate next to the bigger family members. Matte
> black molded plastic, key light upper-left, soft rim light lower-right.
> Unbranded, NO text or numbers, clean, undamaged, dry. Centered, horizontal,
> ~80% of a 1600×1000 canvas.

### `iec_c5_c6__face-plug.png` — C5 cord-end mating face (SOCKETS), head-on
Mounts: Lesson 7 iec_c5_c6 card, cord-end face slot (T1a); the "third lobe = earth" recognition moment vs the figure-8.

> Professional technical illustration, dead-on front view of a generic IEC C5
> cloverleaf cord connector's mating face, transparent background, 1000×1000.
> The unmistakable three-lobed cloverleaf outline — three overlapping rounded
> lobes in the authentic triangular C5 arrangement — in matte-black
> thermoplastic, each lobe carrying ONE recessed round socket aperture:
> exactly THREE sockets total, one per lobe, chromed liners barely visible in
> shadow. HARD REQUIREMENT: three lobes, three sockets — the third contact is
> the protective earth that distinguishes this coupler from the two-lobe
> figure-8; a two-lobed rendering is a rejected asset. Lobe arrangement and
> keying orientation must match real C5 product references, keying feature
> toward 12 o'clock — authentic, not decorative. Cord end = sockets only, no
> pins. NO text, numbers or legible markings. Key light upper-left, soft
> interior shadowing. Unbranded, clean, undamaged.

### `iec_c5_c6__face-recept.png` — C6 equipment inlet face (PINS), head-on
Mounts: Lesson 7 iec_c5_c6 card, inlet-face slot (T2).

> Professional technical illustration, dead-on front view of a generic IEC C6
> equipment inlet (typical of laptop-style power bricks and compact
> equipment), transparent background, 1000×1000. A panel-mount black
> thermoplastic inlet whose recess is the three-lobed cloverleaf shape, with
> exactly THREE round metal pins standing inside the recessed shroud — one per
> lobe, in the authentic C6 arrangement. HARD REQUIREMENT: the inlet carries
> the PINS, recessed and protected; this is NOT a mirrored copy of the C5
> cord-end image. Three pins, always — the earth pin is present in this
> family. Pin positions, lobe geometry and recess depth must match real C6
> product references — authentic, not decorative; keying toward 12 o'clock.
> A small rectangular molded flange around the recess is acceptable. NO text
> or numbers. Key light upper-left, interior shadowing so the recess reads.
> Unbranded, clean, undamaged.

### `iec_c5_c6__mating.png` — C5 cord end approaching C6 inlet
Mounts: Lesson 7 iec_c5_c6 card, mating slot (T2).

> Professional technical illustration of a generic IEC C5/C6 cloverleaf power
> connection about to be made, three-quarter view, transparent background,
> 1600×1000: on the LEFT a panel-mount C6 inlet (three-lobed recess, three
> round pins inside), angled slightly toward viewer-right; on the RIGHT a
> small molded black C5 cloverleaf cord connector, its three-socket lobed face
> aimed at the inlet, separated by about half a connector length on a shared
> axis, light-gauge black cable exiting rightward away from the gap. The
> lobe-to-lobe alignment must be geometrically correct so the one-way fit is
> obvious — match real product references. Pins on the inlet only; sockets on
> the cord end only. Matte black molded plastic, key light upper-left, rim
> light lower-right, unbranded, NO text or numbers, clean, undamaged, dry.

### `iec_c5_c6__exploded.png` — OPTIONAL — T5, simplified exploded
Mounts: optional depth art, Lesson 7 (only if T5 tier is generated).

> OPTIONAL — T5. Professional technical illustration, simplified exploded view
> of a generic IEC C5 cloverleaf cord connector, transparent background,
> 1600×1000, components separated along a shared horizontal axis, mating end
> RIGHT: three-lobed molded face block with its three round socket apertures;
> compact outer body shell; slim strain-relief boot; light round black cable
> stub exiting LEFT. OUTER COMPONENTS ONLY — no terminals or wiring detail.
> Matte black molded plastic, key light upper-left, unbranded, NO text or
> numbers, clean and undamaged.

---

# 5. `iec_c7_c8` — IEC C7 / C8 "figure-8" coupler

Verified hard facts: exactly TWO poles — no earth contact anywhere, by design
(Class II); C8 (pins) is the inlet, C7 (recessed sockets) the cord end; the
common C7 is unpolarized with both lobe edges rounded; a polarized variant
exists with ONE SQUARED EDGE (squared side = neutral). Core views depict the
common unpolarized round-round form; the squared variant gets one optional
face below.

### `iec_c7_c8__side.png` — C7 cord connector, side view
Mounts: Lesson 7 (Power) iec_c7_c8 connector card, side-view slot (T1a).

> Professional technical illustration of a generic IEC C7 "figure-8" cord
> connector, side view, fully transparent background. A slim molded
> matte-black thermoplastic coupler, mating end pointing RIGHT: from the side
> a small flat-bodied connector whose rounded twin-lobe form shows in the body
> contour, with a slightly recessed mating face at the right end, two dark
> socket openings just visible edge-on. Cord end = sockets only, NO pins.
> Exact body profile must match real C7 product references — authentic, not
> decorative. The body tapers leftward through a small molded strain-relief
> boot onto a thin flat or round two-conductor black cable exiting LEFT out of
> frame — visibly the lightest cord in the power family. Matte black molded
> plastic, key light upper-left, soft rim light lower-right for separation on
> a dark app background. Unbranded, NO text or numbers, clean, undamaged, dry.
> Centered, horizontal, ~80% of a 1600×1000 canvas.

### `iec_c7_c8__face-plug.png` — C7 cord-end mating face (SOCKETS), head-on — unpolarized form
Mounts: Lesson 7 iec_c7_c8 card, cord-end face slot (T1a); the "visibly two-pole, no earth" recognition moment.

> Professional technical illustration, dead-on front view of a generic
> unpolarized IEC C7 figure-8 cord connector's mating face, transparent
> background, 1000×1000. The unmistakable figure-8 outline: TWO overlapping
> rounded lobes side by side in matte-black thermoplastic, BOTH lobe outer
> edges fully ROUNDED (this is the common unpolarized form), each lobe
> carrying ONE recessed round socket aperture — exactly TWO sockets total,
> chromed liners barely visible in shadow. HARD REQUIREMENT: two lobes, two
> sockets, and NO third contact of any kind — the missing earth is a verified
> design property of this Class II coupler, not an omission to correct. Lobe
> proportions and socket positions must match real C7 product references —
> authentic, not decorative. Cord end = sockets only, no pins. NO text,
> numbers or legible markings. Key light upper-left, soft interior shadowing.
> Unbranded, clean, undamaged.

### `iec_c7_c8__face-recept.png` — C8 equipment inlet face (PINS), head-on
Mounts: Lesson 7 iec_c7_c8 card, inlet-face slot (T2).

> Professional technical illustration, dead-on front view of a generic IEC C8
> equipment inlet, transparent background, 1000×1000. A panel-mount black
> thermoplastic inlet whose recess is the twin-lobed figure-8 shape (both
> edges rounded, matching the common unpolarized form), with exactly TWO round
> metal pins standing inside the recessed shroud — one per lobe, in the
> authentic C8 arrangement, and NO third contact anywhere. HARD REQUIREMENT:
> the inlet carries the PINS, recessed and protected; this is NOT a mirrored
> copy of the C7 cord-end image. Pin positions, lobe geometry and recess depth
> must match real C8 product references — authentic, not decorative. A small
> molded flange around the recess is acceptable. NO text or numbers. Key light
> upper-left, interior shadowing so pin depth reads. Unbranded, clean,
> undamaged.

### `iec_c7_c8__mating.png` — C7 cord end approaching C8 inlet
Mounts: Lesson 7 iec_c7_c8 card, mating slot (T2).

> Professional technical illustration of a generic IEC C7/C8 figure-8 power
> connection about to be made, three-quarter view, transparent background,
> 1600×1000: on the LEFT a panel-mount C8 inlet (twin-lobed recess, two round
> pins inside), angled slightly toward viewer-right; on the RIGHT a slim
> molded black C7 figure-8 cord connector, its two-socket lobed face aimed at
> the inlet, separated by about half a connector length on a shared axis, thin
> black two-conductor cable exiting rightward away from the gap. Lobe
> alignment must be geometrically correct; both halves are the common
> unpolarized round-round form — match real product references. Exactly two
> contacts per half — pins on the inlet only, sockets on the cord end only, no
> earth contact anywhere. Matte black molded plastic, key light upper-left,
> rim light lower-right, unbranded, NO text or numbers, clean, undamaged, dry.

### `iec_c7_c8__face-plug-polarized.png` — OPTIONAL — polarized C7 variant face
Mounts: Lesson 7 iec_c7_c8 card, variant callout ("polarized and unpolarized variants exist and look nearly identical"). Optional supplement — naming extends the master-spec scheme; see flags.

> Professional technical illustration, dead-on front view of a POLARIZED IEC
> C7-pattern figure-8 cord connector's mating face, transparent background,
> 1000×1000. Identical in every way to the common figure-8 face — two lobes,
> two recessed round socket apertures, matte-black thermoplastic, no third
> contact — EXCEPT the verified polarization keying: ONE lobe's outer edge is
> SQUARED OFF while the other remains fully rounded. The squared edge is the
> entire teaching point and must read clearly at a glance beside the
> unpolarized image. Which lobe carries the squared edge and its exact
> proportions must match real polarized-C7 cordset references — authentic,
> not decorative. Cord end = sockets only. NO text, numbers or markings.
> Key light upper-left, soft interior shadowing. Unbranded, clean, undamaged.

### `iec_c7_c8__exploded.png` — OPTIONAL — T5, simplified exploded
Mounts: optional depth art, Lesson 7 (only if T5 tier is generated).

> OPTIONAL — T5. Professional technical illustration, simplified exploded view
> of a generic unpolarized IEC C7 figure-8 cord connector, transparent
> background, 1600×1000, components separated along a shared horizontal axis,
> mating end RIGHT: twin-lobed molded face block with its two round socket
> apertures; slim outer body shell; small strain-relief boot; thin black
> two-conductor cable stub exiting LEFT. OUTER COMPONENTS ONLY — no terminals
> or wiring detail. Matte black molded plastic, key light upper-left,
> unbranded, NO text or numbers, clean and undamaged.

---

# 6. `powercon_xx` — powerCON (20 A family)

Verified hard facts: three contacts (line, neutral, protective earth);
twist-lock with latch; power-IN is conventionally BLUE and power-OUT is GRAY,
keyed so they cannot cross-mate — so BLUE and GRAY get SEPARATE images that
must NOT be recolors of each other; the family visually resembles the
loudspeaker twist-lock (speakON-style) connector, and that resemblance is
exactly what the lab warns about — geometry must come from real
mains-connector references, never adapted from loudspeaker-connector art.
Blue set uses the four canonical filenames; gray set uses the `-gray`
supplements (naming extension — see flags).

### `powercon_xx__side.png` — BLUE power-in cable connector, side view
Mounts: Lesson 7 (Power) powercon_xx connector card, side-view slot (T1a); also the Lesson 5 "looks like speakON, is mains" warning pair.

> Professional technical illustration of a generic locking stage-power cable
> connector of the powerCON 20 A power-IN pattern, side view, fully
> transparent background. A rugged cylindrical black thermoplastic shell with
> a twist-lock collar and a visible latch/release at the top, mating end
> pointing RIGHT where the keyed locking nose and its lugs show edge-on. HARD
> REQUIREMENT: clearly BLUE identification color on the shell — blue is the
> verified power-IN code in this family; the extent and placement of the blue
> must match real A-type power-in product references. The shell tapers
> leftward through a cable-gland style bushing onto a round black mains cable
> exiting LEFT out of frame. This connector resembles a loudspeaker twist-lock
> in silhouette; the geometry must nonetheless be authentic to real
> mains-type references, never adapted from loudspeaker-connector art. Matte
> black plastic, blue accents, key light upper-left, rim light lower-right.
> Unbranded, NO text or numbers, clean, undamaged, dry. Centered, horizontal,
> ~80% of a 1600×1000 canvas.

### `powercon_xx__face-plug.png` — BLUE power-in cable-connector mating face, head-on
Mounts: Lesson 7 powercon_xx card, cable-end face slot (T1a).

> Professional technical illustration, dead-on front view of a generic
> powerCON-pattern 20 A power-IN (BLUE) cable connector's mating face,
> transparent background, 1000×1000. A circular black thermoplastic twist-lock
> face with its keyed locking nose, latch feature oriented to 12 o'clock, and
> BLUE identification color visible on the surrounding shell. Inside, a
> matte-black insert carrying exactly THREE contact positions in the authentic
> A-type arrangement. HARD REQUIREMENTS: exactly three contacts; the contact
> gender (pins vs recessed bushings) on this power-in cable side and the
> keyway/lug geometry are NOT to be guessed — match real A-type power-in
> product references exactly; the keying differs from the gray power-out
> version by design and the two faces must not be interchangeable drawings.
> Molded relief without legible characters is fine; NO text or numbers. Key
> light upper-left, interior shadowing for depth. Unbranded, clean, undamaged.

### `powercon_xx__face-recept.png` — BLUE power-in chassis inlet face, head-on
Mounts: Lesson 7 powercon_xx card, chassis-face slot (T2).

> Professional technical illustration, dead-on front view of a generic
> powerCON-pattern 20 A power-IN (BLUE) chassis-mount equipment inlet,
> transparent background, 1000×1000. A panel-mount black thermoplastic
> connector with mounting flange, its circular keyed twist-lock opening
> centered, keyway orientation to 12 o'clock, and BLUE identification color
> per real power-in chassis references. Inside the opening, the mating insert
> with exactly THREE contact positions in the authentic A-type arrangement.
> HARD REQUIREMENTS: exactly three contacts; contact gender, keyway and lug
> geometry must match real A-type chassis product references — this is NOT a
> mirrored copy of the cable-connector face, and it must not reuse
> loudspeaker-connector chassis geometry despite the family resemblance.
> Flange shape per real references; no fastener detail required. NO text or
> numbers. Key light upper-left, interior shadowing so the recess reads.
> Unbranded, clean, undamaged.

### `powercon_xx__mating.png` — BLUE pair about to connect
Mounts: Lesson 7 powercon_xx card, mating slot (T2); supports the "lock, click, gentle tug — before power" teaching.

> Professional technical illustration of a generic powerCON-pattern 20 A
> power-IN connection about to be made, three-quarter view, transparent
> background, 1600×1000: on the LEFT a panel-mount BLUE-coded chassis inlet
> (circular keyed twist-lock opening, mounting flange), angled slightly toward
> viewer-right; on the RIGHT the BLUE-coded cable connector, keyed locking
> nose aimed at the inlet, separated by about half a connector length on a
> shared axis, black mains cable exiting rightward away from the gap. The
> keyway alignment between the two halves must be geometrically correct so the
> insert-then-twist gesture is legible — match real A-type product references
> throughout. Both parts blue-coded power-IN; nothing touching yet; no hands.
> Matte black plastic with blue identification, key light upper-left, rim
> light lower-right, unbranded, NO text or numbers, clean, undamaged, dry.

### `powercon_xx__side-gray.png` — GRAY power-out cable connector, side view
Mounts: Lesson 7 powercon_xx card, power-out variant strip (T1a supplement); the blue-vs-gray daisy-chain teaching moment.

> Professional technical illustration of a generic locking stage-power cable
> connector of the powerCON 20 A power-OUT pattern, side view, fully
> transparent background. Same family language as the power-in version — a
> rugged cylindrical black thermoplastic twist-lock shell, latch at top,
> mating end pointing RIGHT, cable-gland bushing and round black mains cable
> exiting LEFT — but with two verified differences that must show: the
> identification color is GRAY (the verified power-OUT code, placement per
> real B-type product references), and the keyed locking nose geometry is the
> B-type keying, visibly different at the mating end from the A-type. HARD
> REQUIREMENT: this is a separate connector, not a recolor of the blue image —
> match real B-type power-out references. Matte black plastic, gray accents,
> key light upper-left, rim light lower-right. Unbranded, NO text or numbers,
> clean, undamaged, dry. Centered, horizontal, ~80% of a 1600×1000 canvas.

### `powercon_xx__face-plug-gray.png` — GRAY power-out cable-connector mating face, head-on
Mounts: Lesson 7 powercon_xx card, power-out variant strip (T2 supplement).

> Professional technical illustration, dead-on front view of a generic
> powerCON-pattern 20 A power-OUT (GRAY) cable connector's mating face,
> transparent background, 1000×1000. A circular black thermoplastic twist-lock
> face, latch feature to 12 o'clock, GRAY identification color on the
> surrounding shell, and a matte-black insert carrying exactly THREE contact
> positions in the authentic B-type arrangement. HARD REQUIREMENTS: exactly
> three contacts; the B-type keyway/lug geometry and the contact gender on
> this side must match real B-type power-out product references — the B-type
> keying exists so an energized output can never mate where an input belongs,
> so this face must be visibly, correctly DIFFERENT from the blue A-type face,
> never the same drawing recolored. Molded relief without legible characters
> is fine; NO text or numbers. Key light upper-left, interior shadowing for
> depth. Unbranded, clean, undamaged.

### `powercon_xx__face-recept-gray.png` — GRAY power-out chassis outlet face, head-on
Mounts: Lesson 7 powercon_xx card, power-out variant strip (T2 supplement); the daisy-chain "out" socket on equipment.

> Professional technical illustration, dead-on front view of a generic
> powerCON-pattern 20 A power-OUT (GRAY) chassis-mount connector — the
> daisy-chain output socket found on stage equipment — transparent background,
> 1000×1000. A panel-mount black thermoplastic connector with mounting flange,
> circular keyed twist-lock opening centered, keyway to 12 o'clock, GRAY
> identification color per real power-out chassis references. Inside, the
> mating insert with exactly THREE contact positions in the authentic B-type
> arrangement. HARD REQUIREMENTS: exactly three contacts; B-type keying and
> contact gender per real product references — NOT a mirrored cable-face, NOT
> a recolored blue chassis image, and never adapted from loudspeaker-connector
> art. Flange shape per references; no fastener detail required. NO text or
> numbers. Key light upper-left, interior shadowing. Unbranded, clean,
> undamaged.

### `powercon_xx__exploded.png` — OPTIONAL — T5, simplified exploded
Mounts: optional depth art, Lesson 7 (only if T5 tier is generated).

> OPTIONAL — T5. Professional technical illustration, simplified exploded view
> of a generic powerCON-pattern 20 A power-IN (BLUE) cable connector,
> transparent background, 1600×1000, components separated along a shared
> horizontal axis, mating end RIGHT: keyed locking nose with insert showing
> three contact positions; twist-lock collar with latch; black shell body with
> blue identification; cable-gland bushing; round black mains cable stub
> exiting LEFT. OUTER COMPONENTS ONLY — no termination detail, terminals or
> wiring. Match real A-type references. Key light upper-left, unbranded, NO
> text or numbers, clean and undamaged.

**Note — not prompted here:** a gray power-out mating view and blue↔gray
cross-mate imagery are deliberately omitted. The record's teaching is that
in/out CANNOT cross-mate; showing them approaching each other could read as a
valid connection. If the owner wants a gray mating image later, mirror the
blue mating prompt with B-type parts and `powercon_xx__mating-gray.png`.

---

# 7. `powercon_true1` — powerCON TRUE1

Verified hard facts: three contacts (line, neutral, protective earth);
twist-lock with latch; a SEPARATE connector family from the original
powerCON — different geometry, different keying, NOT intermateable despite
the related name; designed as a true appliance coupler (breaking capacity and
sealing exist on specific certified models only). Input and output versions
are keyed differently; the four canonical views depict the power-IN
direction. The verified record contains no color facts for TRUE1 — keep
finishes neutral black and take any accent coloring from real TRUE1-pattern
references only (see flags).

### `powercon_true1__side.png` — TRUE1 power-in cable connector, side view
Mounts: Lesson 7 (Power) powercon_true1 connector card, side-view slot (T1a); the "related name, different connector" pairing against powercon_xx.

> Professional technical illustration of a generic locking stage-power cable
> connector of the powerCON TRUE1 power-IN pattern, side view, fully
> transparent background. A rugged black thermoplastic twist-lock shell with a
> latch/release on top, mating end pointing RIGHT — and at that mating end,
> the TRUE1 family's own shrouded, coupler-style interface geometry: this is a
> DIFFERENT connector family from the original powerCON, so do NOT reuse,
> resize or recolor original-powerCON geometry; the shell contours, shroud and
> keying must match real TRUE1-pattern power-in product references. The shell
> transitions leftward through a sealing-style cable gland onto a round black
> mains cable exiting LEFT out of frame. Neutral matte-black finish; any
> accent coloring only as real TRUE1-pattern references show it. Key light
> upper-left, rim light lower-right for separation on a dark app background.
> Unbranded, NO text or numbers, clean, undamaged, dry. Centered, horizontal,
> ~80% of a 1600×1000 canvas.

### `powercon_true1__face-plug.png` — TRUE1 power-in cable-connector mating face, head-on
Mounts: Lesson 7 powercon_true1 card, cable-end face slot (T1a).

> Professional technical illustration, dead-on front view of a generic
> powerCON TRUE1-pattern power-IN cable connector's mating face, transparent
> background, 1000×1000. A circular black thermoplastic twist-lock face with
> the TRUE1 family's shrouded coupler-style interface, latch feature oriented
> to 12 o'clock, and an insert carrying exactly THREE contact positions in the
> authentic TRUE1 power-in arrangement. HARD REQUIREMENTS: exactly three
> contacts; the shroud, keyway and contact-gender geometry must match real
> TRUE1-pattern power-in product references — this face is NOT the original
> powerCON face and must not be drawn from it; the two families are keyed to
> never intermate and the artwork must preserve that difference. Molded relief
> without legible characters is fine; NO text or numbers. Key light
> upper-left, interior shadowing so the shrouded recess reads. Unbranded,
> clean, undamaged.

### `powercon_true1__face-recept.png` — TRUE1 power-in chassis inlet face, head-on
Mounts: Lesson 7 powercon_true1 card, chassis-face slot (T2).

> Professional technical illustration, dead-on front view of a generic
> powerCON TRUE1-pattern power-IN chassis-mount equipment inlet, transparent
> background, 1000×1000. A panel-mount black thermoplastic connector with
> mounting flange, its circular keyed twist-lock opening centered, keyway to
> 12 o'clock, showing the TRUE1 family's shrouded interface and exactly THREE
> contact positions in the authentic arrangement inside. HARD REQUIREMENTS:
> exactly three contacts; shroud, keying and contact gender per real
> TRUE1-pattern chassis references — NOT a mirrored copy of the TRUE1 cable
> face, NOT adapted from original-powerCON or loudspeaker-connector chassis
> art. Flange shape per references; sealing-gasket surfaces may be hinted as
> clean molded detail; no fastener detail required. NO text or numbers. Key
> light upper-left, interior shadowing for depth. Unbranded, clean, undamaged.

### `powercon_true1__mating.png` — TRUE1 pair about to connect
Mounts: Lesson 7 powercon_true1 card, mating slot (T2).

> Professional technical illustration of a generic powerCON TRUE1-pattern
> power-IN connection about to be made, three-quarter view, transparent
> background, 1600×1000: on the LEFT a panel-mount TRUE1-pattern chassis inlet
> (keyed twist-lock opening, mounting flange, shrouded interface), angled
> slightly toward viewer-right; on the RIGHT the TRUE1-pattern cable
> connector, shrouded mating end aimed at the inlet, separated by about half a
> connector length on a shared axis, black mains cable exiting rightward away
> from the gap. Keyway alignment between the halves must be geometrically
> correct so the insert-then-twist gesture is legible — match real
> TRUE1-pattern references throughout; nothing here may be reused from the
> original-powerCON mating image. Nothing touching yet; no hands. Matte black
> thermoplastic, key light upper-left, rim light lower-right, unbranded, NO
> text or numbers, clean, undamaged, dry.

### `powercon_true1__exploded.png` — OPTIONAL — T5, simplified exploded
Mounts: optional depth art, Lesson 7 (only if T5 tier is generated).

> OPTIONAL — T5. Professional technical illustration, simplified exploded view
> of a generic powerCON TRUE1-pattern power-IN cable connector, transparent
> background, 1600×1000, components separated along a shared horizontal axis,
> mating end RIGHT: shrouded keyed mating nose with insert showing three
> contact positions; twist-lock collar with latch; black shell body; sealing
> gland/bushing; round black mains cable stub exiting LEFT. OUTER COMPONENTS
> ONLY — no terminals or wiring detail. Match real TRUE1-pattern references;
> do not reuse original-powerCON parts. Key light upper-left, unbranded, NO
> text or numbers, clean and undamaged.

**Note — not prompted here:** TRUE1 power-OUT versions exist and are keyed
differently from power-in (verified). If the owner wants them, mirror the
blue/gray supplement pattern with `powercon_true1__side-out.png` etc., built
from real power-out references.

---

# 8. `dc_barrel` — DC barrel (coaxial power) connector

Verified hard facts: two poles — a center contact and a surrounding
sleeve/return; friction retention (threaded-collar variants exist but are
equipment-dependent — depict the common friction form); barrel sizes vary
widely with no universal electrical standard, so the artwork depicts ONE
generic mid-size barrel with no implied dimensions. Nothing on the connector
indicates voltage or polarity — the images must stay label-free and
symbol-free (the app teaches the label/symbol reading separately).

### `dc_barrel__side.png` — barrel plug, side view
Mounts: Lesson 7 (Power) dc_barrel connector card, side-view slot (T1a); also Lesson 4 "fits ≠ correct" comparisons and Lesson 8 selection.

> Professional technical illustration of a generic coaxial DC barrel power
> plug, side view, fully transparent background. Mating end pointing RIGHT: a
> straight cylindrical nickel-finish metal barrel — its open tip facing right
> — projecting from a slim molded matte-black plastic handle with a gently
> knurled or ribbed grip section. A generic mid-size barrel: do not imply any
> specific diameter standard; proportions typical of small-equipment power
> plugs, matched to real product references. The handle tapers leftward
> through a molded strain-relief boot onto a thin round black two-conductor
> cord exiting LEFT out of frame. No polarity symbols, no printed markings of
> any kind — the plug itself carries no electrical information, and that
> absence is the teaching point. Satin nickel metal, matte black plastic, key
> light upper-left, soft rim light lower-right. Unbranded, NO text or numbers,
> clean, undamaged, dry. Centered, horizontal, ~80% of a 1600×1000 canvas.

### `dc_barrel__face-plug.png` — barrel plug tip, head-on
Mounts: Lesson 7 dc_barrel card, plug-face slot (T1a).

> Professional technical illustration, dead-on front view of a generic coaxial
> DC barrel power plug's tip, transparent background, 1000×1000. A clean
> concentric ring geometry: the outer nickel-metal sleeve as a bright circular
> ring, a thin dark insulator ring inside it, and the open center bore — the
> inner contact that receives the jack's center pin — reading as a dark
> circular recess with a hint of the internal contact surface in shadow.
> Exactly TWO conductive elements: the outer sleeve and the inner bore
> contact, separated by insulation — nothing else. Concentricity must be
> precise; proportions of a generic mid-size barrel per real product
> references, with no specific size standard implied. No polarity symbols, no
> markings. NO text or numbers. Key light upper-left, soft even lighting with
> subtle depth in the bore. Unbranded, clean, undamaged.

### `dc_barrel__face-recept.png` — panel-mount DC jack, head-on
Mounts: Lesson 7 dc_barrel card, jack-face slot (T2); pairs with the plug tip for the center-pin teaching moment.

> Professional technical illustration, dead-on front view of a generic
> panel-mount DC barrel power jack — the kind found beside a small device's
> power label — transparent background, 1000×1000. A round black thermoplastic
> jack bushing (a plain circular collar; a subtle hex or threaded collar
> profile is acceptable per real references) with its circular opening
> centered, and the slim metal CENTER PIN standing visibly inside the recess,
> concentric with the opening. Exactly TWO conductive elements: the center pin
> and the sleeve contact lining the bore, in shadow. This is NOT a mirrored
> copy of the plug-tip image — the jack carries the pin, the plug carries the
> bore. Generic mid-size proportions per real product references; no size
> standard implied. No polarity symbols or markings anywhere. NO text or
> numbers. Key light upper-left, interior shadowing so pin depth reads.
> Unbranded, clean, undamaged.

### `dc_barrel__mating.png` — barrel plug approaching device jack
Mounts: Lesson 7 dc_barrel card, mating slot (T2).

> Professional technical illustration of a generic DC barrel power connection
> about to be made, three-quarter view, transparent background, 1600×1000: on
> the LEFT a panel-mount DC jack (round black bushing, slim center pin visible
> inside its recess), angled slightly toward viewer-right; on the RIGHT the
> matching barrel plug — nickel sleeve with open center bore facing the jack —
> separated by about half a plug length on a shared axis, thin black cord
> exiting rightward away from the gap. The concentric alignment of center pin
> to center bore must be geometrically exact so the coaxial mating principle
> is legible. Generic mid-size pair, matched to each other, per real product
> references; no size standard implied, no polarity symbols, no labels.
> Nothing touching yet; no hands. Satin nickel, matte black plastic, key light
> upper-left, rim light lower-right, unbranded, NO text or numbers, clean,
> undamaged, dry.

### `dc_barrel__exploded.png` — OPTIONAL — T5, simplified exploded
Mounts: optional depth art, Lesson 7 (only if T5 tier is generated).

> OPTIONAL — T5. Professional technical illustration, simplified exploded view
> of a generic coaxial DC barrel plug, transparent background, 1600×1000,
> components separated along a shared horizontal axis, mating end RIGHT: outer
> nickel sleeve; thin insulator ring; inner bore-contact tube; molded black
> handle shell; strain-relief boot; thin black cord stub exiting LEFT. The
> concentric two-conductor construction should read clearly from the parts.
> OUTER COMPONENTS ONLY — no soldered terminations or wiring detail. Generic
> mid-size, no size standard implied. Satin nickel, matte black plastic, key
> light upper-left, unbranded, NO text or numbers, clean and undamaged.

---

## Delivery checklist for this family

- 8 connectors with full art: `mains_wall`, `iec_c13_c14`, `iec_c19_c20`,
  `iec_c5_c6`, `iec_c7_c8`, `powercon_xx`, `powercon_true1`, `dc_barrel`.
- 32 canonical prompts (8 × side / face-plug / face-recept / mating)
  + 3 powerCON gray supplements + 1 polarized-C7 optional face
  + 8 OPTIONAL T5 exploded = **44 prompts total**.
- 2 reuse notes (`usb_c_power` → `usb_c`, `poe` → `ethernet_8p8c`) — no
  duplicate art.
- Every delivered FACE image goes through the face-geometry verification pass
  before pin/role overlays are enabled (master spec §3–4). For this family
  that pass is a safety gate, not a formality.
