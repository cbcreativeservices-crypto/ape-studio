# Governance decisions — 2026-10-16

These are the owner's rulings from 2026-10-15 to 2026-10-16: the lab-art grading and fix waves, the Mixing Guides corrections, chat safety, images and approval-day planning. They follow D75–D76 (2026-10-14).

## D77 · Keyboards that carry the bass keep their low end (Mixing Guides and any EQ advice)

The owner is a working salsa pianist.
- In salsa, the piano switches from its montuno to doubling the bass in the mambos, breaks and unison lines. Never low-cut it; it belongs in the subs with the bass.
- An electric or stage piano on a DI brings no mud. Only an acoustic piano can, through mics pushed into the subs.
- **The montuno does NOT double the tumbao.** Copy must say the piano *switches* to doubling the bass.

**General rule:**
- Before any keyboard high-pass advice, check whether the player covers the bass: left hand, organ pedals or synth bass.
- Every Mixing Guide with a played keyboard part that the guide low-cuts carries the owner-approved note **"Before you low-cut the keys: Talk with the keyboardist first, or know their music…"**. That is 17 guides with the full note.
- The 10 guides that have their own style caution get just "Talk with the keyboardist first, or know their music." added to it.
- Guides with no played keyboard part do not get the note. Examples: Arabic pop/maqam, programmed-synth styles, reggae/dancehall (owner: "only where it applies").
- Commits: 1c9ac0bf, 48d29e02, c67c7808, 54923e88, c9ee6177. Correction record: `Downloads/2026-10-16_KEYBOARD_LOW_END_CORRECTIONS.md`.

**The guide files are hand-edited.** Do not regenerate them from `scripts/mixing-guides/edits.py`; that would undo the 2026-10 accuracy audit and these fixes. Each edited file says so in its header.

## D78 · Non-English music terms keep their name, with the English meaning in brackets

- Write the term, then its meaning, for example "Coro (vocal chorus)" or "Tumbao (the bass's repeating rhythm pattern)".
- Gloss the first use in each section, and in table row names.
- 902 glosses in 29 guides (477495bb).
- `data/index.ts` mirrors the glossed priority and origin lines.
- The hub card clamps its line at 4 lines. That clamp already cut off 38 of the 50 cards before the glosses; the full line shows inside each guide.

## D79 · Owner-designed art is not "fixed" by graders

When a grading finding conflicts with art the owner designed, ASK before changing it.
- Kept by ruling: the Foundations / Start Here floating ear (a white head listener was rejected: "not pretty — not an improvement"), the molecule tracer marker, the UN-approved Mixing Guides world map, the Advanced Mixing layout, the unrotated studio plans, the tube electron dots and the exaggerated, labelled p8 duck.
- The Foundations star glints became magenta tracer particles. Each tracer's ↔ bracket is built from the same amplitude the tracer moves by (ratchet: `test/tracerBracketFollowsSwing_20261016.test.ts`).
- Lab-art grading scale: `Downloads/2026-10-16_LAB_ART_GRADE_SCALE.md`. It has 20 categories and caps a lab at 5.0 if any category is ≤ 3. After the fix waves the average went from 6.94 to 7.44: 82 labs at B, 2 at C. Gain Staging 6.89 was accepted by the owner.

## D80 · Rulings on the lab-art HOLDs (d5cfbd01)

- **Distortion Lab:** DRIVE defaults to +24 dB, so the first screen clips.
- **Sound Systems venue plan:** performers are drawn 2.5× with a plain note, "people enlarged for clarity". Gear stays at true scale.
- **Players hidden behind others** (E11 / E13): drawn as ghosted, dashed figures, not left out.
- **Boom setup 5** (B04): the operator holds the pole low and straight. Setups 1 and 6 are unchanged.
- **Connector photos stay.**
- **Wedges** (5c50559f): open 12-inch cone and HF horn with no grille; the connector plate is on the side panel.
- **Studio headphones** shown alone are drawn face-on, not from above.
- **Native-only fixes** (next-build queue items 10 and 11): Delay ping-pong does not really ping-pong, and Stereo Width has no stereo source.

## D81 · Chat safety (owner 2026-10-15/16)

- Swearing is allowed in private messages.
- No automatic suspension. Messages are flagged, and the owner gets at most ONE digest email a day.
- The 24-hour Terms commitment is approved. The app half is in bfab662f.
- The server filter is Comp A's work: `Downloads/2026-10-15_COMP_A_CHAT_CONTENT_FILTER_BRIEF.md`.

## D82 · Comp C image returns

- Returned images arrive with no names. Match each one against the concepts in `IMAGE_SPECS.md` (the 2026-10-15 handoff zip) before showing the owner.
- Install only the option the owner picks: one per slot, resized to 1024 × 1024 webp, in `assets/topic-images-webp`, `assets/Certificate_Squares` or the program folder.
- Uploading to the bucket is a publish. It happens only on approval day (D74).
- An image that prints a real maker's model name, or gets the gear wrong (e.g. a female XLR output), is sent back.
- Installed 2026-10-16: gs3180, gs4410, cert-studio-recording-engineer, gs4040, gs4730 and gs4490.
- The 72 still needed: `Downloads/2026-10-16_IMAGES_STILL_NEEDED.md`.

## D83 · Approval day, then the first post-launch build

Plan: `Downloads/2026-10-16_APPROVAL_DAY_PLAN_UPDATE_VS_NEXT_BUILD.md`, used with the 10-15 checklist.
- **Everything since c20732f7 rides one production OTA.** That is 258+ commits and none are native. Fingerprints checked on 10-16: Android b975a5d1 (build 20) and iOS f6a7ee3c (build 36).
- **Intro video:** the owner has a NEWER intro video for that OTA. Wait for the file, convert it and show the owner before publishing.
- **Version 1.0.1:** submit the native build about 1–2 weeks after launch, once the launch OTA is confirmed and a week of real use has been reviewed.
  - D74 freezes production OTAs during review, so launch-week fixes ship by OTA *before* the build is submitted.
  - After 1.0.1, phones still on 1.0 stop receiving new OTAs until they update from the store.
  - The Android 16 KB page-size check (enforced from 2027-02-01) and the iPad mic fix set the outer limit.

## D84 · Small UI rulings (2026-10-15/16)

- **Home:**
  - "SET UP WHAT YOU STUDY";
  - free-topic STUDY NOW in Study blue `#2f9bff` with the headphones icon (GlassButton `tint="study"`);
  - the calculator eyebrow reads "INCLUDED FOR EVERYONE" for guests;
  - Glossary dot `#5bb0ff`; Enrollments frame and dot off-white.
- **Flashcards:**
  - the 3-card icon on each card is grey when off and blue when on;
  - the filter chip icon stays steady blue, with a frame when selected;
  - the pace bar and the session clock BOTH show.
- **Glossary:** the chip reads "[3-card] CUSTOM STUDY [headphones] LIST", with STUDY and the headphones in Study blue. Use ExpoImage, never react-native Image (perfGlossary test).
- **Custom-list empty messages** show the 3-card icon inline.
