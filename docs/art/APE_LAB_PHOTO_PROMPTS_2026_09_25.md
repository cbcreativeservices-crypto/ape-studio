> ⛔ **SUPERSEDED 2026-09-25 (owner: "100% inaccurate and incomplete").** Do not generate from this file. The brief of record is `APE_LAB_PHOTO_BRIEF_v2_2026_09_25.md` (handoff zip `Downloads/2026-09-25_COMP_C_LAB_IMAGES_HANDOFF_v2.zip`). Kept only as history.

# Lab photographs — prompt package for Computer C (2026-09-25)

**For:** Computer C (Pencil, Claude Code agent) generating the remaining lab photographs.
**From:** Computer B (app side). Supersedes `2026-09-25_MISSING_LAB_IMAGES.md`.
**Count:** 46 images — 1 workbench cable, 1 connector anatomy, 17 Stage-5 hardware reveals, 27 inspection findings.

The last group-1 round came back *close but missing the key element* on almost every image.
The cause was the prompt, not the generator: each prompt named an object but did not say
**what the learner must be able to see** or **what the object is standing next to**. Every
prompt below therefore carries four things: the TEACHING POINT (why the image exists), the
MUST SHOW list (the key elements, in order of importance), the MUST NOT SHOW list (what went
wrong last time), and a paste-ready PROMPT that already contains all of it. Please generate
from the PROMPT text and check the result against MUST SHOW before delivering.

---

## 0 · Where the images land (so you know what "reads" and what does not)

The app shows every photograph on a **near-black card, 320–440 px wide**, with an amber
caption under it, on phones and tablets. That has consequences:

- **One subject, one idea per image.** Detail that only reads at full size is wasted. The key
  element should occupy roughly 55–75 % of the frame width.
- **The frame is shown in full at its own aspect ratio, no crop.** Compose edge to edge but
  keep anything essential inside the central 90 %.
- **Group 1 (Stage 5 sort):** the learner first sees a neutral grey line pictogram of the
  hardware and answers "would you hang cable on this?". *After answering* the card reveals
  the photograph under the caption THE REAL THING — APPROVED CABLE HARDWARE or THE REAL
  THING — NEVER A CABLE SUPPORT. The photograph is what the technician would actually see
  on site, so **context is part of the subject** (what it is anchored to, where it lives).
- **Group 5 (final inspection):** the learner taps a numbered marker on a drawing of the
  facility and the card reveals the photograph under AS FOUND ON THE WALK, then asks them to
  CLASSIFY the problem and choose the CORRECTION. The defect must be **unmistakable at a
  glance** and the picture must not give away the classification with text.
- **Groups 2 and 3:** same treatment as the delivered cable-type and anatomy shots.

## 1 · House style — matches what you already delivered (groups 2, 3, 4)

- Photorealistic product photography. Soft, even key light from the upper left, gentle
  contact shadow, shallow depth of field only on the far end of the subject. **No CGI /
  render look, no illustration, no HDR grit.**
- **Bench subjects (groups 2, 3, and group-1 items 1-01 to 1-11):** neutral white-to-light-grey
  seamless background, as in the delivered cable shots — *but* the hardware is shown **mounted
  to what holds it** (a piece of steel beam, strut, concrete deck, drywall, rack rail). A
  bracket floating in white space is what we got last time and it does not teach anything.
- **In-situ subjects (group-1 items 1-12 to 1-17 and all of group 5):** a real, tidy building
  interior, evenly lit like a documentary inspection photograph. Ceiling space = bare concrete
  deck or steel joists above a suspended ceiling; rack = 19-inch equipment rack; wall =
  painted drywall corridor; stage = black stage deck. Quiet surroundings, the subject sharp
  and centred. Not dark, not dusty-moody, not dramatic.
- **No people, no hands, no logos, no watermarks, no readable text** — except where a prompt
  says TEXT ALLOWED and gives the exact characters (labels are the subject of 5-14 to 5-16
  and 5-19).
- **Cable vocabulary — this is the single biggest fix.** Every cable in these images is an
  AV cable, never building wire:
  - *microphone / line cable*: round, matte black jacket, about 6 mm, sometimes with an XLR on
    the end;
  - *category (network) cable*: round, blue or grey jacket, about 6 mm, or a bundle of them;
  - *multipair snake*: round, thick (15–25 mm), black or dark grey;
  - *loudspeaker cable*: round black two-conductor, 8–10 mm;
  - *portable power / extension cord*: round, orange or black rubbery jacket, 8–12 mm;
  - *tactical fibre*: small round black or yellow.
  - **Never** loose single conductors with coloured insulation (the thin blue / yellow / grey
    wires in the last round read as electrical building wire).
- Sizes: **1200 × 896** for groups 1, 2 and 5; **1408 × 768** for group 3. PNG.

## 2 · Naming and delivery

`assets/exports/group-N-NN-<lab-id>.png`, exactly as listed below (the lab id in the file
name is how the app maps the image — it must match). Drop them in `assets/exports` as before;
Computer B converts them to WebP and wires them. Do not write into `src/` or
`assets/lab-art/`.

## 3 · Prompt template (every prompt below follows it)

> Photorealistic product photograph for a professional audio-visual cable-installation course.
> SUBJECT: … CONTEXT: mounted/found on … KEY ELEMENTS the viewer must see: 1) … 2) … 3) …
> CABLES: … CAMERA: three-quarter view, eye level, subject fills ~65 % of frame, soft even
> studio light from upper left, shallow depth of field on the far end only. BACKGROUND: …
> NO people, hands, text, logos, watermarks, illustration or CGI look. Landscape 1200 × 896.

---

## GROUP 2 — workbench cable (the one missing type)

### group-2-14-extension.png — 1200 × 896
**Lab id** `extension` · "Temporary extension / portable power"
**Teaching point:** this is a *cord*, not building wiring. Flexible, temporary, plugged at both
ends, meant to be picked up again. (Lab note: "Flexible cords are not a substitute for permanent
building wiring.")
**Must show:** 1) a flexible portable power cord with a rubbery round jacket, cut back like the
other workbench shots to expose three conductors — black, white, green (green = ground);
2) a moulded plug at one end; 3) a moulded cord connector (the female end) at the other end;
4) a loose coil, as it sits on a bench.
**Must not show:** an IEC computer lead (that is 2-06), flat two-wire lamp cord, building cable
with a flat grey sheath, a reel.
**Prompt:**
```
Photorealistic product photograph for a professional audio-visual cable-installation course. SUBJECT: a heavy-duty portable extension cord, orange rubbery round jacket about 10 mm thick, loosely coiled on a white seamless studio surface, one end stripped back to show its construction: outer jacket cut away to reveal three stranded conductors with black, white and green insulation, the green one slightly longer. KEY ELEMENTS: 1) the three colored conductors emerging from the cut jacket, 2) a black moulded grounded plug on one end, 3) a black moulded cord connector (socket end) on the other end, both in frame. CAMERA: three-quarter view slightly above, the stripped end in sharp focus in the foreground, the coil and the two ends softly behind. LIGHT: soft even studio light from upper left, gentle contact shadow. BACKGROUND: white seamless. NO people, hands, text, logos, watermarks, no illustration or CGI look. Landscape 1200 x 896.
```
**Check:** three conductor colours visible; both moulded ends visible; jacket obviously flexible/rubbery.

## GROUP 3 — connector anatomy (completes Station 1)

### group-3-02-xlr-connector-exploded.png — 1408 × 768
**Lab id** none (single slot) · Connector Select, Station 1
**Teaching point:** the delivered 3-01 shows the cable half of the tappable diagram (jacket,
shield, insulation, conductors). This image covers the other four tappable parts: **plug**,
**jack**, **contacts / pins**, **strain relief**.
**Must show:** 1) a 3-pin male XLR cable connector taken apart and laid in a row on the bench,
left to right: the outer metal shell, the black insert with its three pins clearly visible,
the strain-relief chuck/clamp and the rubber boot, and the cable end that goes into it;
2) beside the row, a female panel-mount XLR jack (the equipment receptacle) face up so the
three sockets are visible; 3) the parts spaced so each is separately readable.
**Must not show:** an assembled connector only, a female cable connector standing in for the
jack, TRS or speakON parts, brand marks.
**Prompt:**
```
Photorealistic product photograph for a professional audio-visual cable-installation course. SUBJECT: a 3-pin male XLR microphone-cable connector disassembled and laid out in a neat row on a white seamless studio surface, left to right: the cylindrical metal outer shell, the black insulating insert with three gold-colored pins facing the camera, the metal strain-relief clamp (cable chuck) and its black rubber boot, and the end of a black round microphone cable with about 15 mm of jacket stripped showing the braided shield and two colored conductors. Next to the row, a female panel-mount XLR jack (chassis receptacle) standing face-up so its three sockets and mounting flange are visible. KEY ELEMENTS: 1) the three pins of the insert, 2) the strain-relief clamp as a separate part, 3) the panel jack as the mating half. CAMERA: three-quarter view slightly above, all parts sharp. LIGHT: soft even studio light from upper left. BACKGROUND: white seamless. NO people, hands, text, logos, watermarks, no illustration or CGI look. Landscape 1408 x 768.
```
**Check:** count the parts — shell, insert with pins, clamp, boot, cable, jack = six things.

---

## GROUP 1 — Stage 5 "THE SORT" reveals, 17 images, 1200 × 896

Read the teaching point as the question the image answers. Items 1-01 to 1-11 are APPROVED
hardware: show it **doing its job, attached to what holds it, carrying AV cables**. Items 1-12
to 1-17 are NEVER supports: show the thing **as the technician finds it above the ceiling,
with no cable on it** (the learner is deciding whether to hang cable there).

### What went wrong last round (per draft) — fix these specifically
| Draft | What it showed | What was missing |
|---|---|---|
| jhook | a wall bracket in white space with four thin coloured wires | the wide rolled bearing surface, the anchor to structure, AV cables, a strap, a second hook implying spacing |
| tray | ventilated tray with bare thin wires and a bar across it | AV cables, trapeze hangers, the empty depth above the cables (fill limit) |
| ladder | ladder rack in white space with bare thin wires | a rack under it, cables lashed to rungs, a dropout where the bundle turns down |
| basket | good — patch cords with plugs | proper horizontal cable, a support bracket, room to add |
| conduit | good EMT with bushing and grey pairs | a long-sweep bend, a box or strap showing it is a dedicated run |
| raceway | good raceway with elbow, thin wires | AV cables, a device box or end fitting |
| underfloor | good | a lifted tile / tile lifter, AV cables |
| vmgr | fingers with loose cables | the bundle dressed through the fingers with straps, branching to a panel |
| hmgr | excellent | keep as is (regenerate only for consistency) |
| strap | a small clip with one thin cable | a WIDE strap or saddle holding a round BUNDLE without a waist |
| protector | good, open lid | placed on a real floor across a walkway |
| plumbing | good copper with valve on strut | ceiling context (deck above) |
| foreign-conduit | junction box on EMT in white space | ceiling context, the red identification that says "another system" |
| tile | the room-side face of a tile in a grid | the BACK of the tile seen from inside the plenum, hanger wires |
| grid | one aluminium T with a wire loop | real twisted 12-gauge hanger wire, a grid intersection, tile edges |
| sprinkler | good red branch line with head | ceiling context |
| hanger | a proper strut trapeze hanger — the OPPOSITE of the lesson | an obviously improvised, unrated, unrelated piece of hardware |

### group-1-01-jhook.png
**Lab id** `jhook` · J-hook · APPROVED · roles: support
**Teaching point:** purpose-built cable support, anchored to structure, spaced to its system's
criteria.
**Must show:** 1) galvanized steel J-hook with a wide (about 50 mm) rolled, rounded bearing
surface — the "J"; 2) what holds it up: a beam clamp on the flange of a steel joist, or a
bracket bolted to a concrete deck, in frame; 3) a neat bundle of 8–10 AV cables (black mic
cables and blue category cables) resting in the J; 4) a hook-and-loop strap through the hook's
slot loosely closing the bundle in; 5) a second J-hook further along the run, soft focus,
implying regular spacing.
**Must not show:** a flat wall bracket, thin coloured building wires, a zip tie cinched tight,
the hook floating in white space.
**Prompt:**
```
Photorealistic product photograph for a professional audio-visual cable-installation course. SUBJECT: a galvanized steel J-hook cable support, its wide rolled bearing surface about 50 mm across, clamped to the lower flange of a steel ceiling joist with a beam clamp, carrying a neat bundle of eight to ten AV cables (matte black round microphone cables and blue round category cables) that rest in the curve of the J and are loosely closed in by a black hook-and-loop strap through the hook's slot. A second identical J-hook is visible further along the run in soft focus, showing regular spacing. CONTEXT: the underside of a steel joist and a bare concrete deck above, softly lit. KEY ELEMENTS: 1) the wide rounded bearing surface holding the cable weight, 2) the beam clamp anchoring the hook to structure, 3) real AV cables held loosely, not crushed. CAMERA: three-quarter view from slightly below, hook fills about 60 % of frame. LIGHT: soft even light from upper left. NO people, hands, text, logos, watermarks, no illustration or CGI look. Landscape 1200 x 896.
```
**Check:** can you see what the hook is attached to? Is the bearing surface wide and rounded? Are the cables recognizably AV cables?

### group-1-02-tray.png
**Lab id** `tray` · Cable tray · APPROVED · roles: support, pathway, protection
**Teaching point:** carries weight, defines the route, partly protects — **with fill limits**.
**Must show:** 1) a galvanized steel ventilated cable tray with side rails, about 300 mm wide;
2) trapeze hangers (threaded rods from the deck with a strut cross-bar) holding it up; 3) a
dressed run of AV cables lying flat in the tray and filling **well under half** the rail
height — the empty space above the cables is the point; 4) a gentle radius bend in the tray in
the distance, implying "defines the route".
**Must not show:** a tray heaped over its rails (that is defect 5-20), bare wires, a splice bar
across the cables, the tray floating in space.
**Prompt:**
```
Photorealistic product photograph for a professional audio-visual cable-installation course. SUBJECT: a galvanized steel ventilated cable tray about 300 mm wide with 75 mm side rails, suspended under a bare concrete ceiling deck by trapeze hangers (two threaded rods and a strut cross-bar) visible in frame, carrying a neatly dressed flat layer of AV cables (matte black round microphone and line cables, blue category cables, one thick dark grey multipair snake) that fill less than half the depth of the tray, leaving clear empty space above them. In the distance the tray sweeps through a gentle horizontal bend. KEY ELEMENTS: 1) the trapeze hangers holding the tray, 2) the cables lying low with visible spare depth, 3) the side rails defining the route. CAMERA: three-quarter view from slightly above, looking along the tray. LIGHT: soft even light. CONTEXT: concrete deck above, quiet ceiling space. NO people, hands, text, logos, watermarks, no illustration or CGI look. Landscape 1200 x 896.
```
**Check:** hangers visible; cables under half depth; AV cables not wires.

### group-1-03-ladder.png
**Lab id** `ladder` · Ladder rack · APPROVED · roles: support, pathway
**Teaching point:** heavy-duty open pathway, common above racks.
**Must show:** 1) a black steel ladder rack (two side rails, rungs every ~250 mm) running
horizontally above the top of a 19-inch equipment rack; 2) a bundle of AV cables lashed to the
rungs with hook-and-loop straps; 3) a curved rack-top dropout / waterfall fitting where the
bundle turns down into the rack; 4) a wall-angle or threaded-rod support for the ladder.
**Must not show:** bare thin wires laid across the rungs, the ladder floating in space, a cable
tray (that is 1-02).
**Prompt:**
```
Photorealistic product photograph for a professional audio-visual cable-installation course. SUBJECT: a black powder-coated steel ladder rack (two side rails with tubular rungs about every 250 mm) running horizontally just above the top of a 19-inch black equipment rack, supported by a wall angle bracket at one end and a threaded-rod trapeze at the other. A bundle of AV cables (matte black microphone and line cables with blue category cables) is lashed to the rungs with black hook-and-loop straps and turns smoothly down into the rack over a curved radius dropout fitting at the rack top. KEY ELEMENTS: 1) the rungs with cables lashed to them, 2) the rack top with the curved dropout where the bundle turns down, 3) the ladder's own supports. CAMERA: three-quarter view from slightly above rack-top height. LIGHT: soft even light. CONTEXT: an equipment room, plain wall behind. NO people, hands, text, logos, watermarks, no illustration or CGI look. Landscape 1200 x 896.
```
**Check:** rack under the ladder; cables lashed to rungs; dropout at the turn.

### group-1-04-basket.png
**Lab id** `basket` · Wire basket · APPROVED · roles: support, pathway
**Teaching point:** continuous support with easy adds — respect its fill.
**Must show:** 1) a welded steel wire-mesh basket tray on wall brackets or a trapeze; 2) a
dressed run of blue category cable and black audio cable lying in it, under half the depth;
3) one more cable being laid in from above / clear space to add more; 4) the mesh continuous
along the run (continuous support).
**Must not show:** patch cords with RJ45 plugs (last round), a basket floating in space, a
basket filled to the top.
**Prompt:**
```
Photorealistic product photograph for a professional audio-visual cable-installation course. SUBJECT: a galvanized welded wire-mesh basket cable tray about 200 mm wide, carried on two cantilever wall brackets bolted to a painted concrete-block wall, running along a ceiling space. Inside lies a neat run of blue round category cables and matte black round audio cables filling well under half its depth, with one additional blue cable resting on top as if just added. KEY ELEMENTS: 1) the continuous mesh floor supporting the whole run, 2) the wall brackets carrying the basket, 3) plenty of spare depth above the cables. CAMERA: three-quarter view from slightly above, looking along the basket. LIGHT: soft even light. NO people, hands, text, logos, watermarks, no illustration or CGI look. Landscape 1200 x 896.
```
**Check:** brackets visible; cable is horizontal cable, no plugs; under half full.

### group-1-05-conduit.png
**Lab id** `conduit` · Conduit (for this system) · APPROVED · roles: pathway, protection
**Teaching point:** defined, protected route — fill and bends per applicable rules.
**Must show:** 1) a galvanized EMT conduit run secured to a wall or deck with one-hole straps;
2) a **long-sweep** elbow (large radius, not a tight fitting); 3) the conduit ending at a
junction box or an open end with a plastic bushing; 4) a few jacketed AV cables (black audio,
blue category) emerging through the bushing with obvious room to spare.
**Must not show:** a tight 90° fitting with a cable jammed through, an overstuffed conduit, bare
twisted pairs (last round), any cable strapped to the outside.
**Prompt:**
```
Photorealistic product photograph for a professional audio-visual cable-installation course. SUBJECT: a run of 25 mm galvanized EMT conduit strapped to a painted concrete-block wall with galvanized one-hole straps, sweeping through a long-radius elbow and ending in an open threaded end fitted with a black plastic insulating bushing, out of which four jacketed AV cables (two matte black round audio cables and two blue category cables) emerge with plenty of free space around them inside the bushing. KEY ELEMENTS: 1) the large-radius sweep, 2) the bushing at the exit with the cables loose in it, 3) the straps that make it a fixed, dedicated route. CAMERA: three-quarter view from slightly below the bushing. LIGHT: soft even light. NO people, hands, text, logos, watermarks, no illustration or CGI look. Landscape 1200 x 896.
```
**Check:** the elbow is a long sweep; cables loose in the bushing; straps visible.

### group-1-06-raceway.png
**Lab id** `raceway` · Surface raceway · APPROVED · roles: pathway, protection, management
**Teaching point:** finished-space pathway with fittings for every transition.
**Must show:** 1) white two-piece surface raceway on a painted finished wall; 2) one section with
its cover removed showing AV cables laid inside (black audio, blue category); 3) a proper
inside-corner or outside-corner fitting; 4) a device box / end fitting where the raceway
terminates — every change of direction has a fitting.
**Must not show:** raceway bent or cut around a corner without a fitting, thin coloured wires,
a raceway floating without a wall.
**Prompt:**
```
Photorealistic product photograph for a professional audio-visual cable-installation course. SUBJECT: white plastic two-piece surface-mount cable raceway about 50 mm wide fixed to a painted light-grey drywall, running horizontally then turning up through a matching white outside-corner fitting; the horizontal section has its snap-on cover removed for about 300 mm, revealing two matte black round audio cables and two blue category cables lying neatly inside; the run ends at a white surface-mount device box with a blank faceplate. KEY ELEMENTS: 1) the corner fitting at the change of direction, 2) the cables inside the opened section, 3) the device box where the raceway terminates. CAMERA: three-quarter view, eye level. LIGHT: soft even light. NO people, hands, text, logos, watermarks, no illustration or CGI look. Landscape 1200 x 896.
```
**Check:** corner fitting present; box present; AV cables inside.

### group-1-07-underfloor.png
**Lab id** `underfloor` · Underfloor pathway · APPROVED · roles: pathway, protection
**Teaching point:** defined floor route — capacity and access planned in.
**Must show:** 1) a raised access floor with one tile lifted out and a suction tile lifter lying
next to the opening; 2) in the cavity, a defined route — a wire basket or channel on the floor
slab between the pedestals — carrying a dressed run of AV cables with room to spare; 3) the
pedestal legs and stringers; 4) the opening itself as the access point.
**Must not show:** cables loose on the slab with no pathway, a floor cut away like a diagram.
**Prompt:**
```
Photorealistic product photograph for a professional audio-visual cable-installation course. SUBJECT: a raised computer-room access floor with one 600 mm grey floor tile lifted out and set aside, a double-cup suction tile lifter lying beside the opening. Through the opening: adjustable steel pedestals and stringers, and on the concrete slab between them a galvanized wire basket tray carrying a neatly dressed run of blue category cables and matte black audio cables that fill well under half the basket. KEY ELEMENTS: 1) the lifted tile and lifter as the access point, 2) the basket defining the route below the floor, 3) spare capacity in the basket. CAMERA: three-quarter view from standing height looking down into the opening. LIGHT: soft even room light. NO people, hands, text, logos, watermarks, no illustration or CGI look. Landscape 1200 x 896.
```
**Check:** lifter present; basket on the slab; pedestals visible.

### group-1-08-vmgr.png
**Lab id** `vmgr` · Vertical manager · APPROVED · roles: management
**Teaching point:** organizes rack cable for service — it manages; supports carry.
**Must show:** 1) a black vertical cable-management finger duct mounted on the side rail of a
19-inch rack; 2) a dressed bundle of blue category cables running down through the fingers,
held with hook-and-loop straps; 3) cables branching out horizontally through the finger gaps
to a patch panel at the side; 4) the rack rail with its square holes.
**Must not show:** cables loose and crossing (last round), the manager empty, cables hanging by
their plugs.
**Prompt:**
```
Photorealistic product photograph for a professional audio-visual cable-installation course. SUBJECT: a black vertical cable-management finger duct about 100 mm wide mounted along the front rail of a black 19-inch equipment rack; a dressed bundle of about twenty blue round category cables runs vertically down inside it, secured every few fingers with black hook-and-loop straps, with groups of four cables branching out horizontally through the finger gaps toward a 24-port patch panel mounted in the rack beside it. KEY ELEMENTS: 1) the fingers organizing the branches, 2) the straps holding the dressed bundle, 3) the patch panel the cables serve. CAMERA: three-quarter view, eye level, the manager filling the left two thirds of frame. LIGHT: soft even light. NO people, hands, text, logos, watermarks, no illustration or CGI look. Landscape 1200 x 896.
```
**Check:** bundle dressed and strapped; branches through fingers; panel in frame.

### group-1-09-hmgr.png
**Lab id** `hmgr` · Horizontal manager · APPROVED · roles: management
**Teaching point:** per-rack-unit organization at the patch field.
**Must show:** 1) a 1U black horizontal cable manager with fingers, mounted directly below a
24-port patch panel; 2) blue and grey category patch cords dressed through the fingers in tidy
groups down to the panel ports; 3) the rack rails.
**Must not show:** loose loops, mixed random colours, an empty manager. (The last draft was
excellent — repeat that idea.)
**Prompt:**
```
Photorealistic product photograph for a professional audio-visual cable-installation course. SUBJECT: a black 1U horizontal finger-type cable manager mounted in a 19-inch rack directly below a black 24-port patch panel, with blue and light-grey round category patch cords dressed neatly through the manager's fingers in groups and plugged into the panel ports above, all cords following the same clean radius. KEY ELEMENTS: 1) the fingers holding the cords in groups, 2) the panel directly above being served, 3) the rack rails either side. CAMERA: three-quarter view from slightly below the panel. LIGHT: soft even light. NO people, hands, text, logos, watermarks, no illustration or CGI look. Landscape 1200 x 896.
```
**Check:** manager immediately under the panel; groups tidy.

### group-1-10-strap.png
**Lab id** `strap` · Approved strap / saddle · APPROVED · roles: support
**Teaching point:** listed support hardware — **wide bearing, no crush**.
**Must show:** 1) a **wide** (at least 20 mm) black hook-and-loop cable strap with a screw-mount
eyelet, or a broad galvanized saddle clamp with a rubber liner, fixed to a strut channel;
2) a round bundle of about ten AV cables held by it; 3) the bundle keeps its **round** cross
section — no waist, no dimpling — because the bearing surface is wide.
**Must not show:** a nylon zip tie cinched hard, a single thin cable in a small clip (last
round), a waist in the bundle (that is defect 5-05).
**Prompt:**
```
Photorealistic product photograph for a professional audio-visual cable-installation course. SUBJECT: a wide black hook-and-loop cable strap about 25 mm wide with a screw-mount eyelet, screwed to a galvanized strut channel, holding a round bundle of about ten AV cables (matte black round microphone cables and blue category cables) snugly against the strut; the bundle keeps a perfectly round cross-section with no waist or dimpling under the strap. KEY ELEMENTS: 1) the width of the strap spreading the load, 2) the round undeformed bundle, 3) the strut it is fixed to. CAMERA: close three-quarter view, the strap and bundle filling about 65 % of frame. LIGHT: soft even light. BACKGROUND: white-to-light-grey seamless with the strut entering from one side. NO people, hands, text, logos, watermarks, no illustration or CGI look. Landscape 1200 x 896.
```
**Check:** strap width obvious; bundle round; fixed to something.

### group-1-11-protector.png
**Lab id** `protector` · Floor cable protector · APPROVED · roles: protection
**Teaching point:** protects a crossing **for the right loads** — route rules still apply.
**Must show:** 1) a heavy-duty rubber cable protector (ramp with hinged lid, yellow-and-black or
all-black) lying across a real walkway floor; 2) the lid closed along most of its length and
open at one end showing three AV cables in the channels; 3) the ramps meeting the floor flush;
4) a wall or doorway edge implying a walking route.
**Must not show:** the protector in white space (last round), cables under a mat (that is defect
5-09), cables bare on the floor (5-08).
**Prompt:**
```
Photorealistic product photograph for a professional audio-visual cable-installation course. SUBJECT: a heavy-duty black rubber floor cable protector with yellow hinged lid segments, about one metre long, lying across a polished concrete corridor floor near a doorway; the lid is closed along most of its length and flipped open at the near end to show a thick black multipair snake and two matte black round audio cables lying in its channels; the sloped ramps sit flush to the floor. KEY ELEMENTS: 1) the open channel with real cables inside, 2) the ramps flush with the floor, 3) the walkway it is protecting. CAMERA: low three-quarter view along the protector. LIGHT: soft even room light. NO people, hands, text, logos, watermarks, no illustration or CGI look. Landscape 1200 x 896.
```
**Check:** on a real floor; one end open with cables; ramps flush.

### group-1-12-plumbing.png
**Lab id** `plumbing` · Plumbing pipe · NEVER · "Another trade's system — never a cable support."
**Must show:** 1) a copper (or painted steel) water pipe with a ball valve and fittings, so it
is unmistakably plumbing; 2) hung on its own clevis hangers / threaded rods under a bare
concrete deck; 3) **no cable anywhere on it** — the learner is deciding whether to hang cable
here.
**Must not show:** any cable, a pipe in white space with no ceiling.
**Prompt:**
```
Photorealistic documentary-style photograph for a professional audio-visual cable-installation course. SUBJECT: a 25 mm copper water pipe with a brass ball valve and soldered elbow fittings, running horizontally beneath a bare concrete ceiling deck, hung from two clevis pipe hangers on threaded rods anchored to the deck; the ceiling space is clean and evenly lit; no cables anywhere. KEY ELEMENTS: 1) the valve and fittings identifying it as plumbing, 2) its own hangers to the deck, 3) the empty pipe with nothing attached. CAMERA: three-quarter view from slightly below. LIGHT: soft even light. NO people, hands, text, logos, watermarks, no illustration or CGI look. Landscape 1200 x 896.
```

### group-1-13-foreign-conduit.png
**Lab id** `foreign-conduit` · Another system's conduit · NEVER · "Belongs to a different system — not yours to load or enter."
**Must show:** 1) a run of EMT conduit with a junction box and its cover on, strapped under a
concrete deck; 2) an identification that says "someone else's system" without text — the box
and a band of the conduit painted **fire-alarm red**, or the box painted red; 3) no cable on or
in it.
**Must not show:** a box in white space (last round), any of our cables tied to it, readable
labels.
**Prompt:**
```
Photorealistic documentary-style photograph for a professional audio-visual cable-installation course. SUBJECT: a run of 20 mm galvanized EMT conduit strapped to a bare concrete ceiling deck with one-hole straps, entering a square steel junction box whose cover is screwed on; the junction box and a short band of conduit either side of it are painted fire-alarm red, marking it as another building system; nothing is attached to the conduit. KEY ELEMENTS: 1) the red-painted box and band, 2) the straps holding it to the deck, 3) the conduit continuing out of frame both ways with nothing tied to it. CAMERA: three-quarter view from slightly below. LIGHT: soft even light. NO people, hands, text, logos, watermarks, no illustration or CGI look. Landscape 1200 x 896.
```

### group-1-14-tile.png
**Lab id** `tile` · Ceiling tile · NEVER · "A finish surface — cable may not rest on it."
**Must show:** 1) the **back side** of mineral-fibre lay-in tiles seen from inside the ceiling
plenum, sitting in the inverted-T grid; 2) hanger wires going up to the deck; 3) the tiles
obviously light and fragile; 4) **no cable on them**.
**Must not show:** the finished room-side face (last round), any cable on the tiles (that is
defect 5-02).
**Prompt:**
```
Photorealistic documentary-style photograph for a professional audio-visual cable-installation course. SUBJECT: the view inside a suspended-ceiling plenum looking down and across at the top surface of several 600 x 600 mm mineral-fibre lay-in ceiling tiles resting in the galvanized inverted-T grid; the tile backs are rough, pale grey and slightly dusty, the grid's hanger wires rise to a bare concrete deck above; nothing rests on the tiles. KEY ELEMENTS: 1) the tile backs as a fragile finish surface, 2) the grid holding them, 3) the empty surface with no cable. CAMERA: three-quarter view from just above the grid. LIGHT: soft even light. NO people, hands, text, logos, watermarks, no illustration or CGI look. Landscape 1200 x 896.
```

### group-1-15-grid.png
**Lab id** `grid` · Ceiling grid member / support wire · NEVER · "Holds the ceiling up — not your cable."
**Must show:** 1) a galvanized inverted-T grid intersection from above with tile edges in it;
2) a real 12-gauge steel hanger wire wrapped three turns around the main tee and rising to an
anchor in the concrete deck; 3) nothing hanging on the wire or the grid but the ceiling.
**Must not show:** a single aluminium tee in white space (last round), any cable.
**Prompt:**
```
Photorealistic documentary-style photograph for a professional audio-visual cable-installation course. SUBJECT: a suspended-ceiling grid seen from inside the plenum: a galvanized main tee crossing a cross tee, tile edges resting in the grid, and a 12-gauge galvanized steel hanger wire twisted three tight turns around the main tee and rising straight up to an eye anchor in the bare concrete deck; nothing is attached to the wire or grid except the ceiling itself. KEY ELEMENTS: 1) the twisted hanger wire, 2) the grid intersection it carries, 3) the anchor at the deck. CAMERA: three-quarter view from just above grid level, the wire running through the frame. LIGHT: soft even light. NO people, hands, text, logos, watermarks, no illustration or CGI look. Landscape 1200 x 896.
```

### group-1-16-sprinkler.png
**Lab id** `sprinkler` · Sprinkler pipe · NEVER · "Life-safety system — loading it is a serious violation."
**Must show:** 1) a red-painted steel fire-sprinkler branch line with a pendant or upright
sprinkler head on it; 2) its own hangers under the deck; 3) no cable on it. (The last draft
was good; add the ceiling deck for context.)
**Prompt:**
```
Photorealistic documentary-style photograph for a professional audio-visual cable-installation course. SUBJECT: a red-painted 32 mm steel fire-sprinkler branch line running beneath a bare concrete ceiling deck, with a brass upright sprinkler head with its red glass bulb rising from a tee in the middle of frame, the pipe hung on two ring hangers on threaded rods to the deck; nothing is attached to the pipe. KEY ELEMENTS: 1) the sprinkler head making the pipe unmistakable, 2) the red pipe, 3) the empty pipe with no cable. CAMERA: three-quarter view from slightly below. LIGHT: soft even light. NO people, hands, text, logos, watermarks, no illustration or CGI look. Landscape 1200 x 896.
```

### group-1-17-hanger.png
**Lab id** `hanger` · Unrelated hanger / loose hardware · NEVER · "Unrated, unknown anchor — not a listed support."
**Teaching point:** this is the one the last round got backwards (it showed a proper rated
trapeze). The image must look **improvised and unrelated**: nobody rated it, nobody knows what
it is anchored to.
**Must show:** 1) an obviously makeshift piece of hardware in a ceiling space — a loop of bent
galvanized tie wire hooked over a duct strap, **or** a leftover bracket from removed equipment
hanging by one loose screw, **or** a bent nail in a wooden joist with a wire loop; 2) no
rating stamp, no proper anchor, some rust or bent metal; 3) no cable on it.
**Must not show:** strut, threaded rod, beam clamps, anything that looks purchased for the
job, any cable.
**Prompt:**
```
Photorealistic documentary-style photograph for a professional audio-visual cable-installation course. SUBJECT: an improvised, unrated bit of hardware in a ceiling space: a loop of bent galvanized tie wire hooked over the sheet-metal strap of a ventilation duct, twisted closed by hand and hanging free, next to an old rusted steel bracket from some removed equipment dangling by a single loose screw from a wooden joist; nothing hangs from either. KEY ELEMENTS: 1) the hand-bent wire loop, 2) the loose leftover bracket, 3) the absence of any proper anchor or rating. CAMERA: three-quarter view from slightly below. LIGHT: soft even light, clean ceiling space, no dust drama. NO people, hands, text, logos, watermarks, no illustration or CGI look. Landscape 1200 x 896.
```
**Check:** would a technician be tempted to hang cable on it? It must look like "it happens to be there", not like a support.

---

## GROUP 5 — Final Inspection "AS FOUND" findings, 27 images, 1200 × 896

Every image is a **defect, in place, as the inspector finds it**, in the house documentary
style (even light, tidy surroundings, the defect sharp and centred). The card shows the photo
under AS FOUND ON THE WALK and then asks the learner to classify it as Safety / Support /
Routing / Mechanical / Signal / Fire / Labeling / Serviceability, so **the picture must show the
defect, not name it** — no arrows, no red circles, no readable text unless the prompt says
TEXT ALLOWED. The zone is where it sits on the app's facility drawing; keep the setting
consistent with it.

### group-5-01-unsupported-span.png
**Zone** CEILING / TRAY · finding "Sagging span between tray and wall" · Support · major
**Teaching point:** "This run is carrying itself — no support over the span." Correction: add
approved supports per the support system's criteria.
**Must show:** 1) a bundle of AV cables leaving the open end of a cable tray and running about
two metres unsupported to a wall sleeve; 2) a clearly visible **sag** (catenary) in the span;
3) no hardware at all between tray and wall; 4) the deck above so the absence is obvious.
**Prompt:**
```
Photorealistic documentary-style inspection photograph for a professional audio-visual cable-installation course. SUBJECT: in a ceiling space under a bare concrete deck, a bundle of matte black round audio cables and blue category cables leaves the end of a galvanized cable tray and spans about two metres through open air to a sleeve in a concrete-block wall with nothing supporting it, the bundle sagging visibly in a deep curve under its own weight. KEY ELEMENTS: 1) the sag, 2) the empty space where supports should be, 3) the tray end and the wall sleeve at either end. CAMERA: side three-quarter view showing the whole span. LIGHT: soft even light. NO people, hands, text, arrows, logos, watermarks, no illustration or CGI look. Landscape 1200 x 896.
```

### group-5-02-on-ceiling-tile.png
**Zone** CEILING / TRAY · "Data bundle lying on the tiles" · Support · critical
**Teaching point:** "Cable is resting on the tile — tiles are a finish, not a pathway."
Correction: lift onto independent approved supports.
**Must show:** 1) from inside the plenum, a loose bundle of blue category cables lying directly
on the backs of the lay-in tiles across the grid; 2) one tile slightly bowed under the weight;
3) no support hardware anywhere in frame. (Your earlier draft had the idea; redo it in the
house lighting, less dust, the bow subtle.)
**Prompt:**
```
Photorealistic documentary-style inspection photograph for a professional audio-visual cable-installation course. SUBJECT: inside a suspended-ceiling plenum, a loose bundle of about twelve blue round category cables and two matte black audio cables lies directly across the top surfaces of several mineral-fibre lay-in ceiling tiles in the galvanized grid, one tile bowing slightly under the weight, hanger wires rising to the concrete deck above; there is no cable support hardware anywhere. KEY ELEMENTS: 1) cables resting on tile backs, 2) the slight bow in the tile, 3) the absence of any support. CAMERA: three-quarter view from just above the grid. LIGHT: soft even light, clean. NO people, hands, text, arrows, logos, watermarks, no illustration or CGI look. Landscape 1200 x 896.
```

### group-5-03-foreign-support.png
**Zone** CEILING / TRAY · "Audio run tied to the sprinkler main" · Support · critical
**Teaching point:** "That pipe belongs to another system — it is not a cable support."
Correction: move to purpose-built supports anchored to structure.
**Must show:** 1) black audio cables zip-tied along a **red** sprinkler pipe; 2) a sprinkler
head in frame so the pipe is unmistakable; 3) at least three ties visible.
**Prompt:**
```
Photorealistic documentary-style inspection photograph for a professional audio-visual cable-installation course. SUBJECT: beneath a bare concrete ceiling deck, four matte black round audio cables are strapped tightly along the top of a red-painted steel fire-sprinkler branch line with black nylon zip ties every half metre, a brass upright sprinkler head with a red glass bulb rising from the pipe in the middle of frame. KEY ELEMENTS: 1) the zip ties binding cable to the red pipe, 2) the sprinkler head, 3) the cables running along the pipe out of frame both ways. CAMERA: three-quarter view from slightly below. LIGHT: soft even light. NO people, hands, text, arrows, logos, watermarks, no illustration or CGI look. Landscape 1200 x 896.
```

### group-5-04-sharp-bend.png
**Zone** STAGE · "Mic line folded hard behind the stage box" · Mechanical · major
**Teaching point:** "This bend is tighter than the cable's specified minimum radius."
Correction: ease the bend or re-form the route to meet the spec.
**Must show:** 1) a black microphone cable creased into a hard fold immediately behind the XLR
where it plugs into a stage box; 2) the jacket kinked, flattened, whitened at the crease; 3)
the stage box on a black stage deck.
**Prompt:**
```
Photorealistic documentary-style inspection photograph for a professional audio-visual cable-installation course. SUBJECT: close view of a black metal stage box sitting on a black stage deck; a matte black round microphone cable plugged into one of its XLR sockets is folded back on itself in a hard crease just 30 mm behind the connector, the jacket flattened, kinked and stress-whitened at the fold, then runs off toward the stage edge. KEY ELEMENTS: 1) the sharp crease in the cable, 2) the whitened flattened jacket at the fold, 3) the connector it sits right behind. CAMERA: low three-quarter view at deck level, the fold sharp and centred. LIGHT: soft even light. NO people, hands, text, arrows, logos, watermarks, no illustration or CGI look. Landscape 1200 x 896.
```

### group-5-05-crushed-by-tie.png
**Zone** STAGE · "Snake waist-tied to oval at the stage edge" · Mechanical · major
**Teaching point:** "The restraint has deformed the bundle — it's supporting nothing and
damaging everything." Correction: re-restrain at supporting, not crushing, tension.
**Must show:** 1) a thick multipair snake (or a bundle of mic cables) cinched by a black nylon
zip tie so hard the bundle is squeezed into an **oval waist**; 2) jacket dimpled either side of
the tie; 3) the tie fixed to a stage-riser leg or rail at the stage edge.
**Prompt:**
```
Photorealistic documentary-style inspection photograph for a professional audio-visual cable-installation course. SUBJECT: at the edge of a black stage deck, a thick dark grey multipair audio snake about 20 mm in diameter is lashed to a steel stage-riser leg with a single black nylon zip tie pulled so tight that the round snake is crushed into a narrow oval waist under the tie, the jacket dimpled and bulging either side of it. KEY ELEMENTS: 1) the waist crushed into the cable, 2) the over-tight zip tie, 3) the riser leg it is tied to. CAMERA: close three-quarter view, the waist centred and sharp. LIGHT: soft even light. NO people, hands, text, arrows, logos, watermarks, no illustration or CGI look. Landscape 1200 x 896.
```

### group-5-06-door-pinch.png
**Zone** WALL / DOOR · "Line pinched under the equipment-room door" · Safety · major
**Teaching point:** "The door is closing on this cable." Correction: reroute via a pathway, or
protect a temporary threshold crossing properly.
**Must show:** 1) a black audio cable running under a **closed** steel door at the threshold;
2) the cable visibly flattened in the gap under the door; 3) the door, frame and floor.
**Prompt:**
```
Photorealistic documentary-style inspection photograph for a professional audio-visual cable-installation course. SUBJECT: a closed grey steel equipment-room door in a painted corridor, and a matte black round audio cable running across the polished concrete floor and under the door, visibly flattened and pinched in the narrow gap between the door bottom and the aluminium threshold, continuing on the other side. KEY ELEMENTS: 1) the flattened cable in the door gap, 2) the closed door bearing on it, 3) the threshold. CAMERA: low view at floor level looking at the threshold. LIGHT: soft even corridor light. NO people, hands, text, arrows, logos, watermarks, no illustration or CGI look. Landscape 1200 x 896.
```

### group-5-07-connector-strain.png
**Zone** STAGE · "Stage-box fan-out hanging on its XLRs" · Mechanical · major
**Teaching point:** "The termination is the support here — weight hangs on the connector."
Correction: support the cable ahead of the termination; dress strain-free slack.
**Must show:** 1) a stage box mounted vertically on a stage-rail or riser, its XLR sockets
facing sideways; 2) a heavy fan-out loom plugged in and hanging straight down from the
connectors with **no** support or slack loop; 3) the connectors visibly tilted / loaded.
**Prompt:**
```
Photorealistic documentary-style inspection photograph for a professional audio-visual cable-installation course. SUBJECT: a black metal audio stage box bolted vertically to a steel stage-riser frame, its XLR sockets facing sideways, with eight matte black microphone cables plugged in and their whole weight hanging straight down from the connectors in a heavy loom to the stage deck below, no support, no slack loop, the plugged connectors visibly tilted downward under the load. KEY ELEMENTS: 1) the cables hanging by their connectors, 2) the tilted connectors under load, 3) the absence of any strap or loop taking the weight. CAMERA: three-quarter view at the height of the stage box. LIGHT: soft even light. NO people, hands, text, arrows, logos, watermarks, no illustration or CGI look. Landscape 1200 x 896.
```

### group-5-08-bad-floor-crossing.png
**Zone** FLOOR · "Snake crossing the audience aisle bare" · Safety · critical
**Teaching point:** "This run crosses a walking route unprotected." Correction: reroute around
traffic, or protect the crossing suitably — egress and accessibility still apply.
**Must show:** 1) a thick snake lying **bare** across a carpeted aisle between rows of seats;
2) no protector, no mat, no tape; 3) the aisle obviously a walking route.
**Prompt:**
```
Photorealistic documentary-style inspection photograph for a professional audio-visual cable-installation course. SUBJECT: a dark grey multipair audio snake about 25 mm thick lying bare and loose straight across a carpeted centre aisle between two rows of dark auditorium seats, nothing covering or protecting it, the aisle clearly a walking route leading toward the stage. KEY ELEMENTS: 1) the bare snake across the aisle, 2) the seats either side marking a walking route, 3) the total absence of protection. CAMERA: low three-quarter view along the aisle. LIGHT: soft even house light. NO people, hands, text, arrows, logos, watermarks, no illustration or CGI look. Landscape 1200 x 896.
```

### group-5-09-traffic-exposure.png
**Zone** FLOOR · "Feeder under a doormat in the roll path" · Safety · major
**Teaching point:** "Casters and carts roll straight over this cable." Correction: protect the
crossing for the actual loads, or reroute.
**Must show:** 1) a heavy black power feeder cable hidden under a rubber doormat at a doorway;
2) the cable's bulge visible under the mat and its ends visible either side; 3) a road case on
casters right beside it, implying the roll path.
**Prompt:**
```
Photorealistic documentary-style inspection photograph for a professional audio-visual cable-installation course. SUBJECT: a doorway in a backstage corridor with a black rubber doormat on the concrete floor; a thick black rubber-jacketed power feeder cable runs under the mat, its raised ridge visible through the mat and its ends emerging either side, and a black road case on caster wheels stands right at the edge of the mat in the path through the door. KEY ELEMENTS: 1) the cable ridge under the mat, 2) the road case casters about to roll over it, 3) the doorway as the roll path. CAMERA: low three-quarter view at floor level. LIGHT: soft even light. NO people, hands, text, arrows, logos, watermarks, no illustration or CGI look. Landscape 1200 x 896.
```

### group-5-10-slack-pile.png
**Zone** STAGE · "A spaghetti pile of spare cable at stage right" · Serviceability · minor
**Teaching point:** "That's not a service loop, it's a pile." Correction: store intentional
slack, dressed and accessible.
**Must show:** 1) a tangled heap of black audio cables at the stage edge; 2) the heap obviously
unmanaged — crossing, knotted, no coil; 3) the cables continue to the stage box / snake.
**Prompt:**
```
Photorealistic documentary-style inspection photograph for a professional audio-visual cable-installation course. SUBJECT: on a black stage deck near a stage box, a tangled heap of matte black round microphone cables piled on top of each other in crossing loops and half-knots, no coil, no strap, the loose ends running off toward the stage box. KEY ELEMENTS: 1) the tangled pile, 2) the crossing loops with no order, 3) the stage box the cables serve in soft focus. CAMERA: three-quarter view from standing height. LIGHT: soft even light. NO people, hands, text, arrows, logos, watermarks, no illustration or CGI look. Landscape 1200 x 896.
```

### group-5-11-slack-none.png
**Zone** RACK · "Interface lines bowstring-tight, zero slack" · Serviceability · minor
**Teaching point:** "Zero slack — this can never be re-terminated in place." Correction:
provide accessible slack sized to the service need.
**Must show:** 1) the rear of a rack unit with cables pulled dead straight and taut to its
connectors; 2) no loop, no drape, connectors under tension; 3) the device obviously unable to
be slid out.
**Prompt:**
```
Photorealistic documentary-style inspection photograph for a professional audio-visual cable-installation course. SUBJECT: the rear of a black 19-inch equipment rack; a 1U audio interface's rear panel with six matte black round audio cables and one blue category cable plugged in, every cable pulled dead straight and taut from its connector to a tie point at the rack rail with no loop or drape at all, the cables angling stiffly like tensioned strings. KEY ELEMENTS: 1) the straight taut cables, 2) the connectors under tension, 3) no slack anywhere. CAMERA: three-quarter view at the unit's height. LIGHT: soft even light. NO people, hands, text, arrows, logos, watermarks, no illustration or CGI look. Landscape 1200 x 896.
```

### group-5-12-blocked-access.png
**Zone** RACK · "DSP rear unreachable behind a taut trunk" · Serviceability · major
**Teaching point:** "The dressing blocks the very access a technician needs." Correction:
re-route to preserve device removal and connector access.
**Must show:** 1) a thick, tight trunk bundle running horizontally straight across the rear of a
rack unit; 2) the unit's connectors and rear handles hidden behind it; 3) the bundle strapped
tight so it cannot be moved aside.
**Prompt:**
```
Photorealistic documentary-style inspection photograph for a professional audio-visual cable-installation course. SUBJECT: the rear of a black 19-inch equipment rack; a thick tight trunk bundle of about thirty blue category and black audio cables, strapped hard with hook-and-loop, runs horizontally straight across the rear panel of a 2U signal processor, covering its connectors and rear handles so the unit could not be unplugged or removed without cutting the bundle free. KEY ELEMENTS: 1) the trunk crossing the rear panel, 2) the hidden connectors behind it, 3) the tight straps making it immovable. CAMERA: three-quarter view at the unit's height. LIGHT: soft even light. NO people, hands, text, arrows, logos, watermarks, no illustration or CGI look. Landscape 1200 x 896.
```

### group-5-13-blocked-vent.png
**Zone** RACK · "Loom dressed across the amp intake" · Mechanical · major
**Teaching point:** "This bundle crosses a cooling path." Correction: re-route the bundle clear
of intakes and exhausts.
**Must show:** 1) a power amplifier in a rack with an obvious intake grille / fan; 2) a loom of
cables dressed directly across the grille, covering it; 3) the grille visible through the
cables so the obstruction reads.
**Prompt:**
```
Photorealistic documentary-style inspection photograph for a professional audio-visual cable-installation course. SUBJECT: a black 2U power amplifier in a 19-inch rack with a large slotted cooling-intake grille and fan on its rear panel; a loom of matte black audio cables and one orange power cord is dressed straight across the grille and strapped there, blocking most of the intake, the grille slots visible between the cables. KEY ELEMENTS: 1) the intake grille, 2) the cables covering it, 3) the strap holding them there. CAMERA: three-quarter view at the amplifier's height. LIGHT: soft even light. NO people, hands, text, arrows, logos, watermarks, no illustration or CGI look. Landscape 1200 x 896.
```

### group-5-14-unlabeled.png
**Zone** RACK · "Patch field with zero labels" · Labeling · major
**Teaching point:** "No identity — this cable cannot be traced or safely disconnected."
Correction: label both ends with the project scheme; match the records.
**Must show:** 1) a fully populated 24-port patch panel with its label strip **blank**; 2) the
plugged cables with no wrap labels or flags on any of them; 3) a second, sparsely visible panel
in soft focus also blank, to show it is systemic.
**Must not show:** any label at all (a blank label strip is the subject).
**Prompt:**
```
Photorealistic documentary-style inspection photograph for a professional audio-visual cable-installation course. SUBJECT: a black 24-port patch panel in a 19-inch rack fully populated with blue and grey category patch cords, its white label strip completely blank, and none of the cables carrying any wrap label, flag or tag; below it a second panel, also full and also blank, in soft focus. KEY ELEMENTS: 1) the blank label strip, 2) the many plugged cables with no identification, 3) the second blank panel. CAMERA: three-quarter view from slightly below the panel. LIGHT: soft even light. NO people, hands, text, arrows, logos, watermarks, no illustration or CGI look. Landscape 1200 x 896.
```

### group-5-15-label-mismatch.png — TEXT ALLOWED: exactly "A-07" and "A-17"
**Zone** RACK · "Cable labeled A-07 one end, A-17 the other" · Labeling · minor
**Teaching point:** "The two ends disagree — worse than no label." Correction: correct to one
identity, both ends and records.
**Must show:** 1) **one** black audio cable with **both ends** in frame (a short loop between
two panels, or both ends brought together on a bench); 2) a white wrap label on each end,
legible: one reads A-07, the other A-17; 3) nothing else readable.
**Prompt:**
```
Photorealistic documentary-style inspection photograph for a professional audio-visual cable-installation course. SUBJECT: a single matte black round audio cable about one metre long lying in a loose loop on a dark rack shelf so that both of its XLR ends are in frame close together; each end carries a white self-laminating wrap label with black printed text, the left label reading exactly "A-07" and the right label reading exactly "A-17", both sharp and legible, nothing else printed anywhere. KEY ELEMENTS: 1) the two labels on the same cable, 2) the different identifiers, 3) the cable clearly one continuous piece. CAMERA: close three-quarter view from above, both labels sharp. LIGHT: soft even light. NO people, hands, logos, watermarks, no other text, no illustration or CGI look. Landscape 1200 x 896.
```

### group-5-16-undocumented.png — TEXT ALLOWED: exactly "PP2-09" and "PP2-12"
**Zone** RACK · "Schedule says PP2-09 — the wall says PP2-12" · Labeling · major
**Teaching point:** "The schedule doesn't match what's installed." Correction: update the
records to reality, or fix the install to the records.
**Must show:** 1) a printed cable schedule on a clipboard held up beside a wall plate / patch
position; 2) the highlighted row on the sheet reads PP2-09; 3) the engraved label on the wall
plate reads PP2-12; 4) everything else on the sheet blurred or too small to read.
**Prompt:**
```
Photorealistic documentary-style inspection photograph for a professional audio-visual cable-installation course. SUBJECT: a clipboard with a printed cable-schedule table resting against the wall beside a brushed-steel wall plate with a single XLR connector; one row of the table is highlighted in yellow and its identifier reads exactly "PP2-09" in sharp black print, while the engraved label on the wall plate directly beside it reads exactly "PP2-12"; the rest of the table is out of focus and unreadable. KEY ELEMENTS: 1) the sheet's identifier, 2) the plate's identifier, 3) the two side by side so the mismatch reads. CAMERA: close three-quarter view, both identifiers sharp. LIGHT: soft even light. NO people, hands, logos, watermarks, no other legible text, no illustration or CGI look. Landscape 1200 x 896.
```

### group-5-17-bad-penetration.png
**Zone** WALL / DOOR · "Rated-wall sleeve left open around the bundle" · Fire / Building · critical
**Teaching point:** "A rated assembly was penetrated without a listed system." Correction:
install the tested / listed firestop system matching this assembly.
**Must show:** 1) a steel sleeve through a concrete-block (or double-layer drywall) wall; 2) a
cable bundle passing through it with **open air gap all around** — daylight through the sleeve;
3) no putty, pillows, sealant or collar; 4) the wall obviously a solid rated assembly.
**Prompt:**
```
Photorealistic documentary-style inspection photograph for a professional audio-visual cable-installation course. SUBJECT: a painted concrete-block wall in a ceiling space with a 100 mm galvanized steel sleeve passing through it; a bundle of blue category cables and black audio cables runs through the sleeve occupying only its lower third, the rest of the sleeve an open hole with light visible through it from the far side, no firestop putty, pillows, sealant or collar anywhere at the opening. KEY ELEMENTS: 1) the open gap around the cables inside the sleeve, 2) the solid block wall it penetrates, 3) the total absence of any seal. CAMERA: three-quarter view at the sleeve's height, the opening sharp and centred. LIGHT: soft even light. NO people, hands, text, arrows, logos, watermarks, no illustration or CGI look. Landscape 1200 x 896.
```

### group-5-18-unverified-wall.png
**Zone** WALL / DOOR · "Fresh unlabeled hole through the corridor wall" · Fire / Building · critical
**Teaching point:** "Nobody verified what this wall is before routing through it." Correction:
stop and verify the assembly before penetrating.
**Must show:** 1) a freshly drilled ragged hole through a painted corridor wall at ceiling
height; 2) fresh drilling dust on the floor or ledge below; 3) a black audio cable already
pushed through it; 4) no sleeve, no marking, no way to tell what the wall is.
**Prompt:**
```
Photorealistic documentary-style inspection photograph for a professional audio-visual cable-installation course. SUBJECT: a painted light-grey corridor wall with a freshly drilled ragged 40 mm hole near the ceiling, white drilling dust scattered on the floor tile below, and a single matte black round audio cable already pushed through the hole and hanging down the wall; no sleeve, no marking, no fire-rating sign, nothing to say what the wall is. KEY ELEMENTS: 1) the raw fresh hole, 2) the dust showing it was just drilled, 3) the cable already through it. CAMERA: three-quarter view from standing height looking up slightly. LIGHT: soft even corridor light. NO people, hands, text, arrows, logos, watermarks, no illustration or CGI look. Landscape 1200 x 896.
```

### group-5-19-wrong-space-cable.png — TEXT ALLOWED: the jacket legend "CMR" only
**Zone** CEILING / TRAY · "Ordinary-jacket cable in the air-handling space" · Fire / Building · critical
**Teaching point:** "This cable isn't rated for the space it passes through." Correction: use
cable listed for the space, or reroute.
**Must show:** 1) an open ceiling plenum with ductwork and a return-air opening so it is
obviously an air-handling space; 2) a run of dark grey PVC-jacketed cable through it, with the
jacket print legible enough to read CMR (a riser rating, not plenum); 3) nothing else readable.
**Prompt:**
```
Photorealistic documentary-style inspection photograph for a professional audio-visual cable-installation course. SUBJECT: an open ceiling plenum above a suspended ceiling, galvanized rectangular ductwork and an open return-air opening visible, and a run of dark grey PVC-jacketed category cable draped through the space on J-hooks; the near cable is close to the camera and its printed jacket legend is legible and reads only "CMR" in white print, the rest of the legend blurred. KEY ELEMENTS: 1) the ductwork and return opening marking an air-handling space, 2) the grey PVC jacket, 3) the legible CMR marking. CAMERA: three-quarter view with the marked cable in the sharp foreground. LIGHT: soft even light. NO people, hands, arrows, logos, watermarks, no other legible text, no illustration or CGI look. Landscape 1200 x 896.
```

### group-5-20-overfilled-pathway.png
**Zone** CEILING / TRAY · "Tray heaped past its side rails" · Routing · major
**Teaching point:** "This pathway is stuffed past its capacity." Correction: relieve into
additional pathway capacity per the applicable limits.
**Must show:** 1) a cable tray with cables **mounded above the side rails**; 2) cables spilling
over the rail edge; 3) the tray's hangers so it is clearly a real installed tray.
**Prompt:**
```
Photorealistic documentary-style inspection photograph for a professional audio-visual cable-installation course. SUBJECT: a galvanized ventilated cable tray on trapeze hangers under a bare concrete deck, heaped with blue category cables and black audio cables piled well above the height of its side rails, several cables slumping over the rail edge and hanging outside the tray. KEY ELEMENTS: 1) the mound of cable above the rails, 2) the cables spilling over the edge, 3) the rail height as the reference it exceeds. CAMERA: three-quarter view from slightly above rail height, looking along the tray. LIGHT: soft even light. NO people, hands, text, arrows, logos, watermarks, no illustration or CGI look. Landscape 1200 x 896.
```

### group-5-21-bad-transition.png
**Zone** CEILING / TRAY · "The route leaves the pathway over a raw edge" · Routing · minor
**Teaching point:** "The route leaves the pathway over a raw edge / hard corner." Correction:
use proper fittings and gentle transitions.
**Must show:** 1) a bundle leaving the end of a cable tray by bending down over its **raw cut
sheet-metal edge**; 2) the jacket pressing hard on the edge, a tight radius; 3) no dropout
fitting, no radius guide, no edge protection.
**Prompt:**
```
Photorealistic documentary-style inspection photograph for a professional audio-visual cable-installation course. SUBJECT: the cut end of a galvanized cable tray under a concrete deck; a bundle of blue category cables and black audio cables leaves the tray by folding sharply down over the raw sheet-metal end edge in a tight bend, the jackets pressed hard against the bare cut edge, no dropout fitting, radius guide or edge protection of any kind. KEY ELEMENTS: 1) the raw cut edge, 2) the cables bent tight over it, 3) the absence of any fitting. CAMERA: close three-quarter view at the tray end. LIGHT: soft even light. NO people, hands, text, arrows, logos, watermarks, no illustration or CGI look. Landscape 1200 x 896.
```

### group-5-22-power-signal-mess.png
**Zone** WALL / DOOR · "AC and mic lines share one tight bundle up the wall" · Signal · major
**Teaching point:** "Power and low-level signal are interleaved with no plan." Correction:
separate the classes; keep parallel exposure short, cross steeply.
**Must show:** 1) an orange (or black rubber) AC power cord zip-tied into **the same bundle** as
several black microphone cables; 2) the bundle running a long parallel stretch up a wall; 3)
the ties showing they are bound together on purpose.
**Prompt:**
```
Photorealistic documentary-style inspection photograph for a professional audio-visual cable-installation course. SUBJECT: a painted corridor wall with a bundle running vertically up it for about two metres, the bundle made of an orange rubber-jacketed AC power cord and five matte black round microphone cables zip-tied tightly together every 300 mm with black nylon ties, all running parallel and touching the whole way. KEY ELEMENTS: 1) the orange power cord inside the same bundle as the black signal cables, 2) the ties binding them together, 3) the long parallel run. CAMERA: three-quarter view from standing height looking up the wall. LIGHT: soft even light. NO people, hands, text, arrows, logos, watermarks, no illustration or CGI look. Landscape 1200 x 896.
```

### group-5-23-jacket-damage.png
**Zone** CEILING / TRAY · "Jacket sliced where it crosses a strut edge" · Mechanical · major
**Teaching point:** "The jacket is cut / abraded — the damage inside is unknown." Correction:
replace or professionally remediate; fix the cause (edge, pinch).
**Must show:** 1) close-up of a black audio cable lying over the sharp edge of a strut channel;
2) the jacket sliced open at the edge, braid shield and coloured conductors showing; 3) the
strut edge clearly the cause.
**Prompt:**
```
Photorealistic documentary-style inspection photograph for a professional audio-visual cable-installation course. SUBJECT: close-up of a matte black round audio cable draped over the sharp cut end of a galvanized strut channel in a ceiling space; where it crosses the edge the jacket is sliced open about 25 mm long, the braided copper shield and the blue and white insulated conductors showing through the cut, the strut edge pressing into the cut. KEY ELEMENTS: 1) the open cut in the jacket, 2) the exposed shield and conductors, 3) the strut edge that caused it. CAMERA: close three-quarter view, the cut sharp and centred. LIGHT: soft even light. NO people, hands, text, arrows, logos, watermarks, no illustration or CGI look. Landscape 1200 x 896.
```

### group-5-24-over-pull.png
**Zone** CEILING / TRAY · "Pulled past tension" · Mechanical · major
**Teaching point:** "This run was forced through resistance." Correction: verify performance;
re-pull correctly if degraded.
**Must show:** 1) a blue category cable emerging from a conduit mouth with a pulling grip / rope
still attached; 2) the jacket **stretched and necked** — thinner, glossy, ridged — for a length
near the grip; 3) scuffing where it was dragged over the conduit edge.
**Prompt:**
```
Photorealistic documentary-style inspection photograph for a professional audio-visual cable-installation course. SUBJECT: the open mouth of a galvanized conduit in a ceiling space with a bundle of blue category cables emerging from it, a woven steel pulling grip and pull rope still attached to the bundle; for about 300 mm behind the grip the blue jackets are visibly stretched thin and necked, glossy and ridged, twisted and scuffed where they were dragged over the conduit edge. KEY ELEMENTS: 1) the necked, stretched jackets, 2) the pulling grip still on, 3) the scuffed conduit edge. CAMERA: close three-quarter view along the cables. LIGHT: soft even light. NO people, hands, text, arrows, logos, watermarks, no illustration or CGI look. Landscape 1200 x 896.
```

### group-5-25-bad-rack-entry.png
**Zone** RACK · "Trunk dives over the rack's raw top edge" · Routing · minor
**Teaching point:** "Cables dive into the rack over an edge with no management." Correction:
enter via the intended entry, protected and dressed.
**Must show:** 1) the top of a 19-inch rack with a cable trunk bending down over its **bare
sheet-metal top edge** into the rack; 2) no brush strip, no entry plate, no waterfall fitting;
3) the jackets pressed on the edge, the bundle undressed.
**Prompt:**
```
Photorealistic documentary-style inspection photograph for a professional audio-visual cable-installation course. SUBJECT: the top of a black 19-inch equipment rack; a loose trunk of about twenty blue category and black audio cables comes across from above and bends sharply down over the rack's bare sheet-metal top edge into the rack, the jackets pressed against the edge, no brush entry plate, no waterfall radius fitting, no straps, the cables fanning loosely inside. KEY ELEMENTS: 1) the bare top edge with cables bent over it, 2) the absence of any entry fitting, 3) the undressed bundle. CAMERA: three-quarter view from slightly above rack-top height. LIGHT: soft even light. NO people, hands, text, arrows, logos, watermarks, no illustration or CGI look. Landscape 1200 x 896.
```

### group-5-26-hidden-loop.png
**Zone** CEILING / TRAY · "Service loop sealed above the rigid duct" · Serviceability · minor
**Teaching point:** "The slack exists — sealed where no one can ever reach it." Correction:
store slack at a serviceable location.
**Must show:** 1) a coiled service loop of cable wedged **between a rigid duct and the concrete
deck** above it, with only a hand's width of space; 2) the loop clearly unreachable from below;
3) the closed ceiling grid below the duct.
**Prompt:**
```
Photorealistic documentary-style inspection photograph for a professional audio-visual cable-installation course. SUBJECT: in a ceiling space, a coiled service loop of blue category cable and black audio cable, about 400 mm across, wedged in the narrow gap between the top of a large galvanized rectangular duct and the bare concrete deck above it, the coil pressed flat in the gap and unreachable from below; the closed suspended ceiling grid runs under the duct. KEY ELEMENTS: 1) the coil jammed in the gap above the duct, 2) the narrow unreachable space, 3) the closed ceiling below. CAMERA: three-quarter view from just above ceiling-grid level, looking up into the gap. LIGHT: soft even light. NO people, hands, text, arrows, logos, watermarks, no illustration or CGI look. Landscape 1200 x 896.
```

### group-5-27-cord-as-permanent.png
**Zone** WALL / DOOR · "Extension cord stapled along the baseboard as permanent feed" · Safety · critical
**Teaching point:** "A temporary cord is doing a permanent cable's job." Correction: replace
with approved permanent wiring installed by qualified personnel.
**Must show:** 1) an orange extension cord **stapled** along a baseboard with cable staples;
2) it runs behind a fixed equipment rack or into a permanently mounted wall plate, powering
fixed equipment; 3) painted-over or dusty staples implying it has been there a long time.
**Prompt:**
```
Photorealistic documentary-style inspection photograph for a professional audio-visual cable-installation course. SUBJECT: a painted corridor wall at floor level; an orange rubber-jacketed extension cord runs along the top of the white baseboard, fixed every 300 mm with metal cable staples hammered into the baseboard, some staples dusty and painted over, the cord disappearing behind the side of a fixed black equipment rack bolted to the wall; a wall receptacle with the cord's plug in it is visible at the far end. KEY ELEMENTS: 1) the staples fixing the cord permanently, 2) the fixed rack it feeds, 3) the plug in the wall receptacle. CAMERA: low three-quarter view along the baseboard. LIGHT: soft even light. NO people, hands, text, arrows, logos, watermarks, no illustration or CGI look. Landscape 1200 x 896.
```

---

## Acceptance checklist (run on every image before delivery)

1. Is the KEY ELEMENT #1 the largest, sharpest thing in the frame?
2. Can you see what the hardware is attached to (group 1) or where the defect is (group 5)?
3. Are all cables recognizably AV cables — round black audio, blue/grey category, thick snake — and not thin coloured building wires?
4. Any text, arrows, circles, logos, hands? (Only 5-15, 5-16 and 5-19 may carry the exact characters listed.)
5. Does it still read at 320 px wide on a black background?
6. File named `group-N-NN-<lab-id>.png`, correct size, PNG.
