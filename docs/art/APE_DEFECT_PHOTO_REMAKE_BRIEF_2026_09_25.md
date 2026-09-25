# Computer C — remake five Final Inspection photos (2026-09-25)

**The job:** make **5 photographs**. Nothing else is in this package.

Five of the twelve defect photos you delivered went into the app and have now been **taken back
out**. Each one showed a real fault, but not the fault written on the card above it. That was
mostly **our prompts' fault, not yours** (§2). These prompts are rewritten from the app's own
words, one photo per card.

| # | Save as (exact name) | The card says | Replaces your |
|---|---|---|---|
| 01 | `group-5-01-sharp-bend.png` | Mic line folded hard behind the stage box | d04 |
| 02 | `group-5-02-crushed-by-tie.png` | Snake waist-tied to oval at the stage edge | d01 |
| 03 | `group-5-03-connector-strain.png` | Stage-box fan-out hanging on its XLRs | d05 |
| 04 | `group-5-04-bad-floor-crossing.png` | Snake crossing the audience aisle bare | d10 |
| 06 | `group-5-06-slack-pile.png` | A spaghetti pile of "spare" cable at stage right | d08 |

(There is no 05 in this job. The numbers match the app's finding numbers.)

For these five photos, this package **replaces** the matching prompts in the earlier v2 zip
(`2026-09-25_COMP_C_LAB_IMAGES_HANDOFF_v2.zip`). Everything else in v2 is unchanged.

---

## 0 · What is in this zip

| Folder | What it is | When to use it |
|---|---|---|
| `00_READ_ME_FIRST.md` | this page | read once, first |
| `01_CHECKLIST.csv` | the five files: name, card words, size | tick them off |
| `02_PROMPTS/` | **one prompt file per photo**: the PROMPT to paste, a NEGATIVE line, **fixes if it comes back wrong**, and a check list | paste and generate |
| `03_ONE_SHEET_PER_PHOTO/` | one page per photo: the card words, your rejected draft with the reasons, what it must show, and where things sit in the frame | look at it before generating |
| `04_WHERE_IT_LANDS/` | a real screen of the app: the finding card with a photo in it | once, to see the size and context |
| `05_REJECTED_DRAFTS/` | your five drafts that were taken out | to avoid making them again |
| `06_KEEPERS_SUBJECT_ONLY/` | the three drafts that stayed (d07, d09, d12) | **subject** is right; **too dark and dusty** — make yours brighter than these |

---

## 1 · How a photo is used

At the end of the lab the learner walks a venue and taps numbered problems on a drawing. Each
tap opens a **card**:

1. `FINDING · STAGE` — the zone
2. **the finding label** — one sentence naming the **cable**, the **place** and the **fault**
3. **your photograph**, about 300 px wide on a phone
4. CLASSIFY — the learner picks what kind of problem it is
5. the feedback and the fix

Your photograph sits **directly under the label**. The learner reads the words, then looks at
the picture. If the picture shows a different cable, a different place, or a different fault,
it teaches the wrong thing, even when the photo is good. This app trains people for paid work.

---

## 2 · Why the first five missed (so it does not happen again)

1. **The old prompts named the fault, not the scene.** "Excessive bend" and "floor crossing"
   are generic. The generator drew the most common picture of each: data cables in a ceiling,
   and cables in a corridor. The new prompts describe **one exact scene**: the object, the
   cable, the place, and the camera position.
2. **The old prompts listed every cable type in every prompt** (black audio, blue network, snake,
   orange cord). The generator used them all, which is why grey and blue network cable is in
   nearly every draft. **Each new prompt names only the cables that belong in that picture.**
3. **Trade words were not explained.** A generator does not know what a *stage box*, a *snake* or
   a *fan-out* looks like. The new prompts describe the object physically: its size, colour, and
   what is on its face.
4. **Words like "inspection" and "fault" pulled the pictures dark and dusty** (basements, grime,
   gloom). Every new prompt says **stage work lights on full** or **house lights up**. The
   NEGATIVE line blocks dark, dust and basement.

---

## 3 · How to work — the same for every photo

1. Open the sheet in `03_ONE_SHEET_PER_PHOTO/` and read the card words.
2. Open the prompt file in `02_PROMPTS/`. Paste the **PROMPT**. If your tool has an "avoid" or
   negative box, paste the **NEGATIVE** into it.
3. **Make at least four. Keep one.** Keep the one that passes every line of "the photo must
   show".
4. If none of them pass, look at **IF IT COMES BACK WRONG** in the same file. Add the phrase that
   fixes your problem to the prompt, then generate again.
5. **The 3-second test:** cover the card label and show the photo to someone for three seconds.
   If they cannot say what is wrong and where, the photo is not done.
6. Size it (§4) and save it under the exact name.

**Make 01 before 03.** Both show the **same stage box**. If your tool accepts a reference image,
give it your finished 01 when you make 03, so the box looks the same.

---

## 4 · Size and file — exactly

- **1200 × 896 pixels.** Most tools cannot make that size directly:
  - generate at **4:3 landscape**
  - resize to **1200 wide**, which gives 1200 × 900
  - trim **2 px from the top and 2 px from the bottom**, which gives **1200 × 896**
- Keep the fault inside the middle of the frame. The app shows the whole frame, but anything
  touching an edge reads badly at 300 px wide.
- Save it as a **real PNG**. Your twelve earlier files were JPEGs with `.png` on the end. Use
  "Save as / Export as PNG"; do not just rename the file.
- Open the saved file's properties and confirm **1200 × 896** before it leaves.

---

## 5 · The look (the same for all five)

| | |
|---|---|
| Light | **bright and even**: stage work lights on full, or house lights up. Neutral white. Soft shadows. No mood, no spotlight beams, no haze |
| Place | exactly the place the card names: a **black stage deck**, a **stage wall**, the **stage edge**, or a **carpeted audience aisle** — tidy and clean |
| Subject | **one fault**, large, and the sharpest thing in the picture |
| Cables | **black microphone cable, about 6 mm** · **thick round black stage snake, 20–25 mm, "as thick as a garden hose"**. **No blue, grey or white network cable** in any of the five. Never thin coloured single wires |
| Never | people, hands, text, labels, numbers, arrows, logos · render, illustration, diagram |

---

## 6 · Delivery

- Put a folder in **Downloads** named `2026-MM-DD_COMP_C_DEFECT_REMAKE_5` (use your date). Put
  the five PNGs in it, named exactly as in the table.
- Add a short `NOTE.txt`: which photos you are unsure about and why. A believable picture of
  the wrong thing is worse than no picture, so say so if one is not right.
- Nothing goes into the app's folders. The app side converts and wires the photos.

## 7 · Final check — every photo, before it leaves

- [ ] It shows the **cable**, the **place** and the **fault** the card names (read the label, then look)
- [ ] It passes the 3-second test
- [ ] Only the cables the prompt names are in it; no blue, grey or white network cable
- [ ] Bright, clean and tidy; not dark, dusty or moody
- [ ] No people, hands, text, labels or arrows
- [ ] A photograph, not a render or drawing
- [ ] **1200 × 896**, a real PNG, the exact file name

---

# Appendix — the five prompts (copy of 02_PROMPTS/ALL_PROMPTS.md)

Handoff zip: `Downloads/2026-09-25_COMP_C_DEFECT_PHOTO_REMAKE_5.zip`. Generated from a script, not hand-copied.

---

## group-5-01-sharp-bend.png

```
FILE TO SAVE:   group-5-01-sharp-bend.png   (real PNG, exactly 1200 x 896)
CARD LABEL:     Mic line folded hard behind the stage box   [zone STAGE]

=== PROMPT - paste this ===
Photograph taken on a theatre stage during a daytime load-in, stage work lights on full. A stage box
sits on the black-painted wooden stage floor, about 40 cm out from a black wall. The stage box is a
rugged matte-black steel box the size of a small suitcase lying on its side (about 45 cm wide, 25 cm
tall, 15 cm deep). Its flat front face carries two rows of eight round silver XLR sockets - each a
round metal ring with three small pin holes and a small push-latch button - and nothing else: no
knobs, no grille, no screen. A thick round black multicore cable, as thick as a garden hose, leaves
the side of the box. Three black microphone cables, each about 6 mm thick, are plugged into front
sockets. One of them runs round the left end of the box into the gap behind it, and there, on the
floor behind the box, it is folded back on itself into a hard, flat hairpin crease - bent like a
folded drinking straw, with no curve at all, the black jacket flattened and slightly pale at the
fold. Camera: from the front-left, about 1.2 m away, looking down at 50 degrees so both the front
sockets and the floor behind the box are visible, 35 mm lens. The box fills the left half of the
frame; the crease is in the right-centre and is the sharpest thing in the picture. Real photograph,
natural colour, sharp, clean and tidy surroundings, bright even neutral-white light with soft
shadows. Landscape 4:3.

=== NEGATIVE - paste into the "avoid" box if your tool has one ===
people, hands, feet, text, lettering, labels, logos, arrows, numbers, blue cable, grey cable, white
cable, network cable, ethernet, data cable, cable tray, wire basket, ceiling, basement, corridor,
concrete floor, dust, dirt, grime, cobwebs, dark, moody, low light, dramatic shadows, spotlight
beam, haze, 3D render, CGI, illustration, drawing, diagram, infographic, guitar amplifier, speaker,
speaker grille, knobs, mixing console, wall plate, strut, gentle curve, loose loop

=== IF IT COMES BACK WRONG ===
- The box looks like a guitar amp, speaker or mixer  ->  Add: "a plain steel box whose front is nothing but round XLR sockets, like a multicore stage box or drop box".
- The crease is hidden behind the box  ->  Raise the camera: "looking down steeply at 65 degrees from above the front-left corner". Or move the box further from the wall: "80 cm out from the wall".
- The cable is bent in a soft curve, not creased  ->  Add: "folded completely flat, the two sides of the cable touching, like a folded drinking straw".
- Blue or grey cables appear  ->  Put "blue cable, grey cable, network cable" in the negative box; if the tool has none, add "every cable in the picture is black".

=== BEFORE YOU SAVE: the photo must show ===
[ ] A STAGE BOX: black steel box, two rows of round silver XLR sockets on its face
[ ] Black mic cables (6 mm) plugged into it
[ ] ONE mic cable, behind the box, folded flat on itself - a crease, no curve
[ ] Black stage floor, black wall, bright work light
```

---

## group-5-02-crushed-by-tie.png

```
FILE TO SAVE:   group-5-02-crushed-by-tie.png   (real PNG, exactly 1200 x 896)
CARD LABEL:     Snake waist-tied to oval at the stage edge   [zone STAGE]

=== PROMPT - paste this ===
Close-up photograph at the front edge of a theatre stage, stage work lights on full. The stage floor
is black-painted plywood; its front edge runs across the bottom of the frame, with the auditorium
floor soft and out of focus below it. One single thick, round, matte-black stage snake - a multicore
audio cable about 20 mm thick, as thick as a garden hose - lies on the deck a hand's width back from
the edge, running from the left side of the frame to the right. In the exact centre of the frame one
black nylon cable tie is pulled so tight around the snake that it squeezes the round cable into a
narrow waist like an hourglass: under the tie the cable is pinched to about half its normal
thickness, and the jacket bulges out on both sides of the tie. The cut tail of the tie sticks up.
The tie goes round the snake alone and fastens it to nothing. There is no other cable in the
picture. Camera: low, 30 cm from the snake, just above deck height, 50 mm lens; the pinched waist is
dead centre and pin sharp, the ends of the snake soften slightly. Real photograph, natural colour,
sharp, clean and tidy surroundings, bright even neutral-white light with soft shadows. Landscape
4:3.

=== NEGATIVE - paste into the "avoid" box if your tool has one ===
people, hands, feet, text, lettering, labels, logos, arrows, numbers, blue cable, grey cable, white
cable, network cable, ethernet, data cable, cable tray, wire basket, ceiling, basement, corridor,
concrete floor, dust, dirt, grime, cobwebs, dark, moody, low light, dramatic shadows, spotlight
beam, haze, 3D render, CGI, illustration, drawing, diagram, infographic, cable bundle, several
cables, cable tray, wire basket, ceiling, hook-and-loop strap, loose tie

=== IF IT COMES BACK WRONG ===
- The tie barely dents the cable  ->  Add: "exaggerated: the cable is squeezed to half its width under the tie, clearly an hourglass".
- It becomes a bundle of several cables  ->  Add: "one single cable, alone on the floor" and put "bundle, several cables" in the negative box.
- No stage edge visible  ->  Add: "the front edge of the stage is a straight line across the lower fifth of the frame".

=== BEFORE YOU SAVE: the photo must show ===
[ ] ONE thick round black stage snake (20 mm - garden-hose thick)
[ ] ONE black cable tie pulled so tight the snake is pinched to an hourglass waist
[ ] The jacket bulging out either side of the tie
[ ] The front edge of a black stage deck
```

---

## group-5-03-connector-strain.png

```
FILE TO SAVE:   group-5-03-connector-strain.png   (real PNG, exactly 1200 x 896)
CARD LABEL:     Stage-box fan-out hanging on its XLRs   [zone STAGE]

=== PROMPT - paste this ===
Photograph on the side of a theatre stage, stage work lights on full. A stage box - a rugged matte-
black steel box about 45 cm wide and 25 cm tall whose flat front face carries two rows of eight
round silver XLR sockets, nothing else - is bolted high on a black-painted wall, about 2 metres
above the stage floor, sockets facing the camera. Eight black microphone cables, each about 6 mm
thick, are plugged into the lower row of sockets, and every one of them hangs straight down from its
plug under its own weight, side by side, forming a vertical curtain of black cables that runs down
and out of the bottom of the frame. Nothing holds the cables below the box: no bar, no hook, no
cable tie, no strap. The weight shows at the plugs: each silver XLR plug is tipped downward in its
socket and its cable pulls taut out of the back of the plug. Camera: standing on the stage 1.5 m
from the wall, looking slightly up, 35 mm lens. The stage box sits across the upper third of the
frame, the hanging cables fill the lower two-thirds, and the row of tipped plugs is the sharpest
part of the picture. Real photograph, natural colour, sharp, clean and tidy surroundings, bright
even neutral-white light with soft shadows. Landscape 4:3.

=== NEGATIVE - paste into the "avoid" box if your tool has one ===
people, hands, feet, text, lettering, labels, logos, arrows, numbers, blue cable, grey cable, white
cable, network cable, ethernet, data cable, cable tray, wire basket, ceiling, basement, corridor,
concrete floor, dust, dirt, grime, cobwebs, dark, moody, low light, dramatic shadows, spotlight
beam, haze, 3D render, CGI, illustration, drawing, diagram, infographic, wall plate, single socket,
single cable, coiled cable, cable coil, cable tie, strap, hook, support bar, basement

=== IF IT COMES BACK WRONG ===
- It makes a single wall plate or one cable again  ->  Add: "a box with sixteen sockets in two rows, not a wall plate; eight cables, not one".
- The cables curl or coil on the floor  ->  Add: "each cable hangs perfectly vertical and parallel, like a curtain, and leaves the bottom of the frame before reaching the floor".
- The plugs look perfectly straight  ->  Add: "every plug visibly drooping, angled down about 15 degrees in its socket".

=== BEFORE YOU SAVE: the photo must show ===
[ ] The SAME stage box as photo 01, mounted high on a black wall
[ ] Eight black mic cables plugged in, ALL hanging straight down - a curtain
[ ] The plugs tipped downward in their sockets by the weight
[ ] Nothing below the box holding the cables - no bar, hook, tie or strap
```

---

## group-5-04-bad-floor-crossing.png

```
FILE TO SAVE:   group-5-04-bad-floor-crossing.png   (real PNG, exactly 1200 x 896)
CARD LABEL:     Snake crossing the audience aisle bare   [zone FLOOR]

=== PROMPT - paste this ===
Photograph inside a theatre auditorium with the house lights fully up, like a daytime walk-through.
A carpeted audience aisle about 1.2 m wide runs straight away from the camera between two blocks of
upholstered theatre seats; the aisle-end seats of each row line both sides of the aisle. One single
thick, round, matte-black stage snake - a multicore audio cable about 25 mm thick, as thick as a
garden hose - lies loose directly on the carpet and crosses the aisle from side to side at a right
angle, coming out from under the seats on the left and going in under the seats on the right. It is
completely bare: nothing covers it, nothing ramps over it, nothing tapes it down. The rest of the
aisle is clean and empty. Camera: standing in the aisle at eye level, 1.6 m high, about 2 m before
the cable, looking down the aisle, 28 mm lens. The snake crosses the frame horizontally in the lower
third and is sharp; it is plainly the only thing lying on the carpet. Real photograph, natural
colour, sharp, clean and tidy surroundings, bright even neutral-white light with soft shadows.
Landscape 4:3.

=== NEGATIVE - paste into the "avoid" box if your tool has one ===
people, hands, feet, text, lettering, labels, logos, arrows, numbers, blue cable, grey cable, white
cable, network cable, ethernet, data cable, cable tray, wire basket, ceiling, basement, corridor,
concrete floor, dust, dirt, grime, cobwebs, dark, moody, low light, dramatic shadows, spotlight
beam, haze, 3D render, CGI, illustration, drawing, diagram, infographic, cable protector, cable
ramp, gaffer tape, tape, floor mat, rug, two cables, thin cable, cable along the wall, corridor,
hallway, concrete, stage

=== IF IT COMES BACK WRONG ===
- A cable protector, ramp or tape appears  ->  Put "cable protector, ramp, tape, mat" in the negative box; add "the cable lies bare on the carpet, uncovered".
- The cable runs along the aisle instead of across it  ->  Add: "the cable makes a straight horizontal line across the picture, perpendicular to the aisle".
- It looks thin  ->  Add: "as thick as a garden hose, clearly thicker than a thumb".

=== BEFORE YOU SAVE: the photo must show ===
[ ] A carpeted audience aisle between rows of theatre seats
[ ] ONE thick round black snake (25 mm) lying straight ACROSS the aisle
[ ] Nothing on it - no tape, no rubber protector, no ramp, no mat
[ ] House lights up - bright, clean auditorium
```

---

## group-5-06-slack-pile.png

```
FILE TO SAVE:   group-5-06-slack-pile.png   (real PNG, exactly 1200 x 896)
CARD LABEL:     A spaghetti pile of "spare" cable at stage right   [zone STAGE]

=== PROMPT - paste this ===
Photograph on a theatre stage beside the wings, stage work lights on full. On the black-painted
wooden stage floor, in front of a black stage curtain, lies a messy tangled heap of black microphone
cables, each about 6 mm thick: about eight cables dumped in one pile roughly 70 cm across and knee
high, their loops crossing, twisting and knotting over each other at random like spilled spaghetti,
with the silver metal XLR plugs at their ends poking out of the tangle here and there. Nothing is
coiled, nothing is tied, nothing hangs on a hook - it is a heap on the floor. The rest of the floor
around it is clean and empty. Camera: standing 1.5 m away, looking down at about 45 degrees, 35 mm
lens. The heap is centred and fills about three-quarters of the frame, sharp from front to back.
Real photograph, natural colour, sharp, clean and tidy surroundings, bright even neutral-white light
with soft shadows. Landscape 4:3.

=== NEGATIVE - paste into the "avoid" box if your tool has one ===
people, hands, feet, text, lettering, labels, logos, arrows, numbers, blue cable, grey cable, white
cable, network cable, ethernet, data cable, cable tray, wire basket, ceiling, basement, corridor,
concrete floor, dust, dirt, grime, cobwebs, dark, moody, low light, dramatic shadows, spotlight
beam, haze, 3D render, CGI, illustration, drawing, diagram, infographic, neat coils, over-under
coil, coiled cable, hanging loops, hook, rack, equipment rack, hook-and-loop strap, cable reel,
service loop

=== IF IT COMES BACK WRONG ===
- The cables come out neatly coiled  ->  Add: "chaotic and careless, as if thrown down from a height; no two loops the same size".
- It hangs on something or sits in a rack  ->  Add: "lying on the floor, touching nothing but the floor".
- Other kinds of cable appear  ->  Add: "every cable is a black microphone cable".

=== BEFORE YOU SAVE: the photo must show ===
[ ] A messy tangled HEAP of black mic cables ON the stage floor
[ ] Loops crossing and knotting at random - spilled spaghetti
[ ] Silver XLR plug ends poking out of the tangle
[ ] Black stage floor, black curtain behind, nothing hung or coiled
```
