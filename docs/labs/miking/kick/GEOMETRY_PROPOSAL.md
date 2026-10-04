# M01 Kick Drum: GEOMETRY PROPOSAL (one model, two views)

Status: PROPOSAL for review. No app code. Every number carries a source key from
`SOURCES.md` in this folder. Charter: `docs/APE_LAB_VISUAL_CHARTER_2026_10_04.md` §2 (three
layers), §3 (sources, unknown stays unknown), §4 (accuracy).

Value classes used below:
- **SOURCED**: copied from a source row (key given).
- **DERIVED**: plain arithmetic on SOURCED values (formula given).
- **TRIAL**: a sourced value borrowed from a different drum or used under an interpretation.
  Drawn, but the model marks it `trial: true` and the simplifications register lists it.
- **UNKNOWN**: no source. The model marks it `unknown: true`. If the drawing cannot exist
  without it, the geometry file may hold a **PLACEHOLDER** number, which is not a fact, is
  never shown as a readout, is flagged `placeholder: true`, and is on the owner list (§9).
  Placeholder numbers are deliberately NOT proposed in this document; the build picks a
  visually neutral value and the owner replaces it with a measurement.

---

## 1. Coordinate system (model space)

- **Units:** millimetres. Inches are shown only as conversions (1 in = 25.4 mm exactly).
- **Origin O:** the centre of the batter head, that is, the point where the drum axis meets
  the batter-head plane.
- **Axes:**
  - **+x** runs along the drum axis from the batter head toward the resonant head (away
    from the drummer, toward the audience).
  - **+y** points vertically **down** (charter §2: y-down). The floor is at positive y.
  - **+z** is horizontal and perpendicular to the axis, toward the **drummer's right** hand.
    (x, y, z) is therefore a left-handed triple. That does not matter for 2D projections,
    but any 3D cross product in the code must account for it.
- **One model, two views.** Both views are orthographic projections of the same 3D anchors:
  - **Side view** (viewer on the drummer's right, looking toward -z): screen X = x,
    screen Y = y. Batter head on the left, resonant head on the right, floor at the bottom.
  - **Top view** (viewer above, looking down +y): screen X = x, screen Y = z. The
    drummer's right is screen-down.
  - A dragged microphone has one 3D position `mic.ref = (x, y, z)` plus one aim vector.
    The side-view drag edits (x, y); the top-view drag edits (x, z). Readouts come from
    the 3D values (§6), never from screen pixels.
- **Design units to screen:** `geometry.ts` maps mm to design units at the lab's reference
  width (charter §2). Labels, hit areas and zones are derived from the anchors below.

## 2. Default drum

**22 in × 18 in bass drum** (SOURCES §a, "Default drum chosen"). Sources: YMH-RC (RBB-2218),
TAMA-SSC ("22"x18""), DW-DES ("18x22″"); DPA-KICK and YMH-HUB name 22 in as standard.

| Symbol | Meaning | Value (mm) | Class | Source / formula |
|---|---|---|---|---|
| `D_nom` | nominal diameter | 558.8 | SOURCED (conv.) | 22 in; YMH-RC, TAMA-SSC, DW-DES |
| `R` | radius used for the shell outer surface and head edge | 279.4 | TRIAL | `D_nom/2`. The real shell OD is UNKNOWN; the nominal size is used as the OD. |
| `L` | batter-plane to reso-plane distance | 457.2 | TRIAL | 18 in nominal depth (conv.); heads are treated as flat planes at the shell ends. |
| `t_shell` | shell wall thickness | 7 | SOURCED | TAMA-SSC, 22"x18" BD lacquer/unicolor: "8ply, 7mm" |
| `t_hoop` | wood hoop radial thickness | 8.0 | TRIAL | YMH-TC "BD : 8.0 mm" (a 22×16 Tour Custom, not this drum) |
| `h_hoop` | hoop height (axial width) | UNKNOWN | UNKNOWN | none found |
| `c_hoop` | gap between shell OD and hoop inner face | UNKNOWN | UNKNOWN | none found |
| `N_rods` | tension rods per head | 10 | SOURCED, interpreted | YMH-RC "No. of Tuning Bolts" 10 for RBB-2218 (read as per head; owner to confirm) |
| `phi0` | angular phase of the rod pattern | UNKNOWN | UNKNOWN | no source says whether a rod sits at bottom centre |
| `N_claws` | claw hooks per head | UNKNOWN (convention: one per rod) | UNKNOWN | TAMA-SSC and YMH-HUB state the purpose, not the count |
| `N_spurs` | spurs | 2, one per side | SOURCED | YMH-HUB "attached to each side of the shell" |
| spur mount x, angle, length | | UNKNOWN | UNKNOWN | none found |
| `y_floor` | floor line | UNKNOWN | UNKNOWN | Whether both hoops touch the floor, and how much the spurs and the pedal lift the drum, is not sourced. If the build assumes both hoops tangent to the floor, `y_floor = R + c_hoop + t_hoop` (DERIVED from TRIAL and UNKNOWN parts), flagged. |

## 3. Named anchors (ids for `geometry.ts`)

| Anchor id | Position (x, y, z) mm | Class | Source |
|---|---|---|---|
| `bd.batter.center` | (0, 0, 0) | definition | §1 |
| `bd.reso.center` | (L, 0, 0) = (457.2, 0, 0) | TRIAL | §2 |
| `bd.batter.rim` | circle x = 0, radius R, in the y-z plane | TRIAL | §2 |
| `bd.reso.rim` | circle x = L, radius R | TRIAL | §2 |
| `bd.shell.top` | line y = -R, x from 0 to L (side view) | TRIAL | §2 |
| `bd.shell.bottom` | line y = +R, x from 0 to L | TRIAL | §2 |
| `bd.shell.innerBottom` | line y = +(R - t_shell) = +272.4 | DERIVED (TRIAL R, SOURCED t) | the inside floor where a pillow or the Beta 91A rests |
| `bd.shell.sideL / sideR` | z = -R / z = +R (top view) | TRIAL | §2 |
| `bd.hoop.batter` | ring, inner radius R + c_hoop, outer radius R + c_hoop + t_hoop, x from -(h_hoop - inset) to +inset | TRIAL + UNKNOWN | inset of the hoop past the head plane is UNKNOWN |
| `bd.hoop.reso` | same ring mirrored at x = L | TRIAL + UNKNOWN | |
| `bd.rod.batter[k]`, `bd.rod.reso[k]` | angle phi0 + k·36°, k = 0…9 | SOURCED count, UNKNOWN phase | 360°/10 = 36° (DERIVED) |
| `bd.spur.L`, `bd.spur.R` | on the shell at z = -R / z = +R; x, angle, length UNKNOWN | SOURCED count, UNKNOWN geometry | YMH-HUB |
| `bd.port.center` | (L, y_p, z_p) | UNKNOWN position | No maker states the offset; see §4 |
| `bd.port.edge` | circle of diameter d_port about `bd.port.center`, in the plane x = L | SOURCED diameter | §4 |
| `pedal.beater.strike` | (0, y_s, 0), y_s in {0} ∪ [-50.8, -25.4] | SOURCED | DW-9000/DW-5000 "center of the drum or an area 1-2 inches above the center" (above = negative y). z = 0 from DW-9000 "Position the pedal on the center of the hoop" (Medium interpretation). |
| `pedal.beater.axis` | the line through `pedal.beater.strike` parallel to x | DERIVED | used for "on-axis with beater" (S-B52-UG) |
| `pedal.beater.head` | sphere/disc at the strike point; diameter UNKNOWN | UNKNOWN | SOURCES §c |
| `pedal.axle` | pivot of the beater; position UNKNOWN | UNKNOWN | SOURCES §c |
| `pedal.beater.sweep` | arc from rest to strike about `pedal.axle`; arc UNKNOWN | UNKNOWN | SOURCES §c |
| `pedal.footboard` | x < 0, on the floor; length, height, angle UNKNOWN | UNKNOWN | SOURCES §c |
| `pedal.clamp` | bottom centre of the batter hoop (z = 0) | SOURCED (Medium) | DW-9000 §5 |
| `floor` | line y = y_floor | UNKNOWN (see §2) | |
| `damping.pillow` | on the inside floor, "against the beater head"; size and shape UNKNOWN | SOURCED location, UNKNOWN size | S-B52-UG p.4 NOTE; S-LIVE item 3 |

The batter-head "beater line" in the lesson and the Beta 52A guide's "beater" both mean
`pedal.beater.axis`.

## 4. Resonant-head port

| Option id | Diameter (mm) | Centred? | Source |
|---|---|---|---|
| `port.none` (intact head) | none | n/a | DPA-KICK (jazz heads "often" unported); lesson L7 forbids implying a hole must be cut |
| `port.remo5` (**proposed default**) | 127.0 (5 in) | "Offset Hole" | REMO-OH (22") |
| `port.evans4` | 101.6 (4 in) | "offset" | EVANS-EMAD |
| `port.aq425` | 107.95 (4.25 in) | "off center" | AQ-RSM, AQ-SOP (disagrees with AQ-COLL 4 ¾ in = 120.65; D4) |
| `port.aq7c` | 177.8 (7 in) | centre: `bd.port.center` = (L, 0, 0) | AQ-RPT |
| `port.kickportTRing` | 133.35 inner (5.25 in), 184.15 outer ring (7.25 in) | not stated | KP-ACC |

Why Remo 5 in as the default: it is the only 22 in head read today that states both the
size and "offset" on the product page, and 5 in is the size of Remo's DynamO ring head
(REMO-DM). **Offset position (radius from centre, clock angle): UNKNOWN** for every maker.
Constraint for any placeholder: the whole hole must lie inside the head,
`r_port + d_port/2 < R` (DERIVED), with the inlay or damping-ring width UNKNOWN.

## 5. Microphone outlines (simplified silhouettes at sourced overall sizes)

The lesson asks the learner to choose by properties, not brand (L96). The lab therefore
draws three GENERIC outlines whose overall dimensions are tied to named models. Each
outline has a front reference point `mic.ref` (the centre of the grille's front face, or of
the top face for the boundary type) and an aim vector `mic.axis`.

**Acoustic-centre caveat (lesson L39, owner's text):** "The acoustic center of a microphone
may not be the visible end of its grille, so the app should not claim millimeter-accurate
placement from a visual icon alone." No manufacturer source read today states where its
distances are measured from or where the acoustic centre lies. So every distance readout is
labelled "grille front to …", and the manufacturer zones in §6 are drawn as zones, never as
exact points.

### 5.1 End-address dynamic (generic): three sourced size sets

| Size set | Body | Overall length / head length | Height incl. mount | Front (grille) diameter | Weight | Pattern (maker's words) | Max SPL (maker's words) | Source |
|---|---|---|---|---|---|---|---|---|
| e 902 type | cylinder-like, Ø 60 | 128.5 | 97 (body + integral mount) | Ø 60 (body); grille length UNKNOWN | 440 g | "cardioid" | not stated | SN-902-SPEC p.2 drawing, SN-902-2019 p.6 |
| D112 MkII type | Ø 70 | 115 (length) | 126 (height) | Ø 70 | 300 g (mic only) | "Cardioid" | "> 160 dB (calculated)" for 0.5 % THD | AKG-CUT p.2 |
| Beta 52A type | head on a stand adapter | 113.0 (product data "depth") or 113.0554 (drawing 4.451, read as inches) | 162.0 (product data "height") or 162.7124 (drawing 6.406) | 94.0 (product data "width") or 95.25 (drawing 3.750) | 0.605 kg | "Supercardioid" (spec) / "modified supercardioid" (description) | "174 dB" (1 kHz at 1% THD, 1 kΩ load) | S-B52-UG p.5 to p.6, S-B52-WEB (D1, D3) |

Proposal: the generic "end-address dynamic" icon uses the e 902 outline proportions
(Ø 60 × 128.5, mount reaching 97 overall) because it is the only one with a dimensioned
two-view drawing (SN-902-SPEC p.2). When the learner picks "large-head kick dynamic with
supercardioid pattern", the outline switches to the Beta 52A size set. The mount's position
along the body is read from the SN-902-SPEC drawing only as a proportion; its exact offset
is UNKNOWN (not dimensioned).

### 5.2 Boundary (half-cardioid) microphone

| Item | Value | Class | Source |
|---|---|---|---|
| Plan size | 139.1 × 95.11 (long side × short side) | SOURCED | S-B91-UG p.8 drawing, S-B91-WEB |
| Height | 20.3 | SOURCED | same |
| Weight | 470 g | SOURCED | S-B91-UG p.7 |
| Pattern | "Half-cardioid (cardioid in hemisphere above mounting surface)" | SOURCED | S-B91-UG p.6 |
| Source window | "Keep sound sources within a 60° range above this surface." | SOURCED | S-B91-UG p.4 |
| Connector location | on one 95.11 mm end face (read from the p.8 drawing) | Medium | S-B91-UG p.8 |
| Contour switch | on the bottom; "7 dB of attenuation centered at 400 Hz" | SOURCED | S-B91-UG p.5, p.7 |
| Max SPL | 155 dB (2500 Ω load), 151 dB (1000 Ω load) | SOURCED | S-B91-UG p.6 |
| Mounting | "Inside drum, on a pillow or other cushioning surface" | SOURCED | S-B91-UG p.4 |

Pose: the mic lies flat on `damping.pillow`, top face up (normal = -y), so its
`mic.ref` height is `y = R - t_shell - pillow height`. **Pillow height: UNKNOWN.**

### 5.3 Small-capsule condenser (DPA approach)

| Item | Value | Class | Source |
|---|---|---|---|
| Model in the cited article | DPA 4055 Kick Drum Microphone | SOURCED | DPA-KICK |
| Body | diameter 57, length 132 | SOURCED | DPA-4055 |
| Capsule diameter | 17 | SOURCED | DPA-4055 |
| Weight | 241 g | SOURCED | DPA-4055 |
| Pattern | "Open Cardioid" | SOURCED | DPA-4055 |
| Max SPL | "164 dB SPL peak" (THD 10 %); THD < 1 % at "156dB SPL RMS, 159 dB SPL peak" | SOURCED | DPA-4055 |
| Power | "P48 (Phantom Power)", "2.0 mA" | SOURCED | DPA-4055 |
| Outline detail | "unique asymmetric design"; actual shape UNKNOWN | UNKNOWN | DPA-4055 Description; draw as a plain cylinder, flagged in the simplifications register |

### 5.4 Through-port fit (DERIVED, for collision readouts)

Radial clearance if a mic body passes centred through the port = (d_port - body diameter) / 2:

| Body | 5 in Remo (127.0) | 4 in Evans (101.6) | 4.25 in Aquarian (107.95) |
|---|---|---|---|
| e 902, Ø 60 | 33.5 | 20.8 | 23.975 |
| D112 MkII, Ø 70 | 28.5 | 15.8 | 18.975 |
| Beta 52A, front Ø 94.0 (web) / 95.25 (drawing) | 16.5 / 15.875 | 3.8 / 3.175 | 6.975 / 6.35 |
| DPA 4055, Ø 57 | 35.0 | 22.3 | 25.475 |

Only the body cross-section is covered. The mount, stand arm and cable also pass through
the port, and their sizes are UNKNOWN.

## 6. Placement zones, collision zones and readouts

**Distance convention:** "from beater head" (Shure) is measured along x from the batter
plane to `mic.ref`. The sources do not define the point on the mic; this is a lab
convention, stated on screen.

### 6.1 Documented placement zones (draw as zones with the source tag and the reference head)

| Zone id | Region in model space | Mic it belongs to | Source |
|---|---|---|---|
| `zone.b52.near` | x in [50, 75]; "slightly off-center from beater" (off `pedal.beater.axis` by a non-zero amount; the amount is UNKNOWN) | Beta 52A size set | S-B52-UG p.3 |
| `zone.b52.far` | x in [200, 300]; "on-axis with beater" (on `pedal.beater.axis`) | Beta 52A size set | S-B52-UG p.3 |
| `zone.b91.pillow` | x in [25, 152], resting on the pillow on the inside floor; sources within 60° above the mounting surface | boundary | S-B91-UG p.4 |
| `zone.e902.A` | "a few centimeters from the batter head" (no number: draw as a tag at the batter end, no band) | e 902 size set | SN-902-2019 p.4 |
| `zone.e902.B` | "at the level of the resonant head": x = L; inside or outside not stated | e 902 size set | SN-902-2019 p.4 |
| `zone.e902.C` | "in the middle between the batter head and the resonant head": x = L/2 = 228.6 (DERIVED, TRIAL L) | e 902 size set | SN-902-2019 p.4 |
| `zone.live.D` | inside, "a few inches from beater head", "about 1/3 of way in from edge of head": radial distance from axis = (2/3)·R, about 186.27 (DERIVED); direction UNKNOWN; "a few inches" not a number | any boom-mounted mic | S-LIVE item 3 |
| `zone.dpa.outside` | "just outside the drum, on the edge of the resonator head": x > L, near the head edge; no distance | condenser | DPA-KICK |
| `zone.shure2.port` | Beta 52A "near the sound hole", paired with Beta 91A inside | Beta 52A + boundary | S-2MIC |

A zone is a documented starting region for its own product, not a rule for other mics
(lesson L39). The lab shows the zone of the chosen size set, dimmed for the others.

### 6.2 Collision (keep-out) zones

| Keep-out id | Region | Status |
|---|---|---|
| `ko.batterHead` | the batter membrane, x = 0, r ≤ R, plus its motion | position TRIAL; head excursion UNKNOWN |
| `ko.resoHead` | x = L, r ≤ R, minus the port opening | position TRIAL; excursion UNKNOWN |
| `ko.portEdge` | annulus around `bd.port.edge` | diameter SOURCED; ring width UNKNOWN; position UNKNOWN |
| `ko.beater` | volume swept by `pedal.beater.head` about `pedal.axle` | UNKNOWN (pivot, arc, head size) |
| `ko.pillow` | `damping.pillow` volume | location SOURCED, size UNKNOWN. "Make sure microphone does not touch drum head or damping inside of the drum." (S-B52-UG p.3) |
| `ko.shell`, `ko.hoops`, `ko.rods`, `ko.spurs` | from §3 | TRIAL / UNKNOWN as listed |
| `ko.pedal` | footboard and frame | UNKNOWN |
| `ko.player` | the drummer's foot and leg | UNKNOWN (no source) |

Exception, sourced: the boundary mic is ALLOWED to touch `ko.pillow` (it rests on it,
S-B91-UG p.4). No other mic may (lesson L11).

### 6.3 Readouts (all computed from the 3D model, labelled with what they measure)

| Readout | Formula | Shown as |
|---|---|---|
| Distance to batter head | `mic.ref.x` | mm and cm, labelled "grille front to batter head (approx.)" |
| Distance to resonant head | `L - mic.ref.x` | same |
| Off-beater-axis distance | sqrt((y - y_s)² + z²) | mm |
| Aim angle to the beater strike | angle between `mic.axis` and (strike - mic.ref) | degrees |
| Height above floor | `y_floor - mic.ref.y` | only after `y_floor` stops being UNKNOWN |
| Inside / outside | 0 < x < L and sqrt(y² + z²) < R - t_shell | words |
| Port clearance | §5.4 | mm, red when ≤ 0 |
| Boundary-mic source elevation | elevation of the strike point above the mounting plane, compared with 60° | degrees |
| In documented zone | membership of §6.1 for the chosen size set | words + source tag |

Display precision is an owner decision (§9); the lesson forbids implying millimetre accuracy.

## 7. What the side and top views show (from the same anchors)

- Side view: shell rectangle (0..L × -R..R), hoops, rods (projected), spurs (count only until
  geometry is sourced), floor, pedal and beater (placeholders), port as a vertical segment on
  x = L at y_p, pillow, mic outline, zones as x-bands.
- Top view: shell rectangle (0..L × -R..R in z), port as a segment on x = L at z_p, beater
  axis line at z = 0, mic outline, zones.
- Every label, hit area and highlight is derived from §3 anchors (charter §2).

## 8. Invariant tests this proposal implies (for charter §9.2)

- Rod count per head = 10; rods equally spaced by 36°.
- Spur count = 2, one at each side (z < 0 and z > 0).
- Port lies fully inside the reso head: r_port + d_port/2 < R.
- `zone.b52.far` lies on `pedal.beater.axis`; `zone.b52.near` does not.
- All §6.1 x-ranges lie between 0 and L for the default drum (the 300 mm upper end < 457.2).
- Every anchor projects to the same x in both views.
- No readout reads a value whose class is UNKNOWN or PLACEHOLDER.

## 9. UNKNOWNS and DISAGREEMENTS that need the owner

UNKNOWNS (each needs a measurement of a real drum or a dimensioned maker drawing):
1. Real shell OD of a "22 in" drum, hoop height, hoop-to-shell gap, how far the hoop stands
   past the head plane.
2. Spurs: mount position along the shell, angle, length; whether the drum's hoops touch the
   floor (sets `y_floor`).
3. Offset port position (radius and clock angle) and which head is the default
   (proposed: Remo 5 in offset).
4. Pedal: beater shaft length, beater head diameter, pivot (axle) position and height,
   swing arc, footboard length and angle.
5. Pillow size and shape (sets the Beta 91A height and the Beta 52A keep-out).
6. Tension-rod phase: is there a rod at bottom centre, or do two rods straddle it? Is
   Yamaha's "No. of Tuning Bolts 10" per head (my reading)?
7. The reference point on each mic for "distance from beater head" and the display rounding.

DISAGREEMENTS (both sides in SOURCES.md):
8. D1: Beta 52A label, "Supercardioid" (spec) or "modified supercardioid" (description).
9. D2: supercardioid null at 120° (Beta 52A guide) or 126°/125° (Shure live-sound booklet).
10. D3: Beta 52A size, product data 94.0/162.0/113.0 mm or drawing 3.750/6.406/4.451.
11. D4: Aquarian offset port, 4.25 in (product page) or 4 ¾ in (collection page).
12. Lesson fixes to approve: (a) Beta 52A 20 to 30 cm row should add "on-axis with beater";
    (b) e 902 row says "resonant-head or port area", but the manual says "at the level of the
    resonant head", with no port; (c) reference [3] is a dead link, and the current e 902
    manual (04/2026) drops the "turn the microphone away from where the beater strikes" note.
    Keep it with the archived 2019 citation, or remove it? (d) AKG [7] cannot be reached from
    this machine; please check it in a browser.
13. Default beater strike height: DW allows "the center" or "1-2 inches above". Which one is
    the default?
