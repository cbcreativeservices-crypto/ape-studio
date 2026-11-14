# G6 · BinauralLab (Binaural Panner) — beginner orientation audit

Walked 2026-11-14, sound OFF, `#labpreview/BinauralLab` (tab-5), emulated 390 x 844. **Limit:** by this point the browser pane had shrunk, so the phone-size page rendered scaled/cropped and my drags on the head stage and the AZ fader did not register (coordinates no longer mapped). I judged EXPLORE from the arrival screenshot plus the full page text, and LEARN / CHECK / end screen from `binauralScreenGuides.ts`. Reason for not checking the drag: pane size, not scope. Also: **this lab is sound-first by design ("Headphones required")**, so a sound-off beginner can only learn the cues by reading the numbers.

---

## Page 1 · EXPLORE

| Field | Finding |
|---|---|
| Page | Binaural Panner Lab · EXPLORE |
| First look | Intro card "**Binaural rendering**": "This makes headphone sound seem to come from around you… Your brain then hears a direction." — clear. Sound Safety (13th time), learning popup. Then a top-down circle stage: rings, "FRONT 0°" at top, "BEHIND ±180°" at bottom, "−90°" / "+90°" at the sides, a tiny head in the centre and three small coloured object icons. Thinks: "a radar". |
| Overwhelm | **3 / 5.** The stage itself is inviting; the title line "ITD · ILD · Head Shadow · Localization" and the bezel ("ITD 488 µs") are pure code. |
| Knows what it is learning? | **Partly.** Card: "sound seem to come from around you". LAB NOTES' "the far ear hears LATER (time difference) and DARKER (head shadow)" is a great plain sentence — but it is below the fold. |
| Knows what to do first? | **Yes (in words).** Caption: "Drag a sound object around the head — angle sets the time/level cues, radius sets distance. Use headphones." The learning popup's start ("Put on headphones and tap ▶. Slide AZ from 0° to +90° and watch ITD climb to 656 µs…") gives a silent half: ITD as a number. |
| Words they would not know | "Binaural" · "ITD", "ILD", "Head Shadow", "Localization" (subtitle) · "OBJ 1 ON" · "AZ" (azimuth, never spelled out; the bezel even drops the AZ label and shows only "−60 ° front-left") · "DIST" · "µs" (microseconds) · "SIMPLIFIED BINAURAL — NOT MEASURED HRTF" · "HRTF", "pinna cues" · "low-pass" · "SRC". |
| Follows / continues? | Partly. **A developer build note is shown to learners:** "THE MIX, HONESTLY — Binaural audio needs the v7 engine build — this dev client predates it. The stage and lessons are fully functional; install the v7 build to hear the mix." (seen on web; whether a store build shows it needs a phone to confirm). A beginner cannot "install the v7 build" and will think the lab is broken. |
| What works | The stage picture (front at top, behind at bottom) is the most intuitive "map" in my set. "the far ear hears LATER… and DARKER" — the whole lesson in eight words. Honest limits ("Behind-the-head is only gently hinted…"). CHECK YOURSELF "Which source is EASIEST to localize with your eyes closed? — Broadband noise" ties to everyday experience. |
| Suggestions | 1. **Remove the "v7 engine build / dev client" sentence from learner text**; if audio is unavailable, say "Sound for this lab plays in the phone app" like the other labs' THE AUDIO PATH line. **S.** (The guide file's own copy rule says no build notes in learner text.) 2. **Spell out on first view: "AZ = direction (angle around your head)", "ITD = how much later the far ear hears it"** — and show ITD as "0.49 thousandths of a second" or as a bar, not "488 µs". **S.** 3. **Move the "LATER and DARKER" sentence up to the hero caption.** **S.** 4. **Draw the cue on the stage**: a little arrow to each ear, the far one longer and greyer, so "later and darker" is visible. **M.** 5. Make the head and its nose larger so "which way am I facing" is obvious. **S.** 6. Keep the AZ label on the bezel (it disappears in favour of the value). **S.** |
| Hobbyist | Will enjoy three objects at once; will ask for elevation (LEARN says this lab "can't place sounds above or below you"). |

---

## Page 2 · LEARN (from source)
WHERE TO START: "Read the two ear cues first. Then find the ITD line under FORMULA / CONCEPT, and on EXPLORE set AZ to +45° to see ITD read 381 µs." — reading the cues first is right. Topics: ITD / ILD, front-back confusion, why noise localizes better than a low tone.

## Page 3 · CHECK (from source)
ITD, head shadow, why headphones, why no up/down. On-page CHECK YOURSELF repeats the answer-length tell ("Change the timing between the channels — it only changes level"; "Broadband noise — it feeds both cues at once"). **S.**

## Page 4 · WHAT'S LEFT (from source)
Same state-aware end screen as Stereo ("If the check's row is still there, tap it… Otherwise tap ‹ BACK TO THE LAB").

---

## Lab verdict — BinauralLab

**Beginner's journey:** A friendly card and an intuitive top-down stage make the goal clear ("move a sound around your head"). Without headphones and sound the beginner can only watch a microsecond number change, and the code-word header (ITD · ILD · HRTF · AZ) plus a developer note telling them to install a "v7 build" will make them think the lab is unfinished. The key idea — far ear hears it later and darker — is written beautifully but hidden in LAB NOTES.

**3 biggest orientation problems**
1. Developer build note in learner text.
2. Code words (ITD, ILD, AZ, HRTF, µs) on the frame.
3. The cue is told, not drawn; lab depends on headphones.

**3 best things**
1. Top-down head stage with FRONT / BEHIND.
2. "the far ear hears LATER and DARKER".
3. Honest limits (front/back, no elevation).

**First 30 seconds rewrite**
Card as now. Stage with a big head; pointer on object 1: "Drag me to your right. Your left ear now hears me a tiny bit later and a little duller — that's how your brain knows I'm on the right." ITD shown as a bar labelled "how much later the far ear hears it".
