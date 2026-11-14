# G6 · CompressionLab — beginner orientation audit

Walked 2026-11-14 at 390 x 844, sound OFF, `#labpreview/CompressionLab` (tab-5). Shared effects-lab frame: see G6_EqLab.md (judged there); this file covers what is specific to Compression plus anything the frame did differently here. Source read after: `fxLabConfigs.tsx` (compConfig), `compressionScreenGuides.ts`.

---

## Page 1 · EXPLORE (opens first)

| Field | Finding |
|---|---|
| Page | Compression Lab · EXPLORE · `#labpreview/CompressionLab` |
| First look | Intro card "**Dynamic range compression**" with a 4-sentence paragraph. After CONTINUE, the **Sound Safety Warning** faded in by itself (I tapped nothing else) — a long legal sheet whose KEEP SOUND OFF button is below the fold and only reachable by scrolling inside the sheet. After KEEP SOUND OFF, the WHAT YOU'RE LEARNING popup. Then the eye lands on a green vertical "COMP" pill with thin blue spikes and an amber "GR PEAK 5.5 dB" label. Thinks: "a heart monitor?" |
| Overwhelm | **4 / 5.** Three popups in a row (intro card → safety wall → learning popup). The intro card alone introduces five new terms (threshold, ratio, attack, release, make-up gain) in one breath, unlike the Equalizer card's one sentence. |
| Knows what it is learning? | **Partly.** "A compressor makes loud parts quieter, shrinking the gap between soft and loud" is a perfect first sentence. Everything after it is new vocabulary. |
| Knows what to do first? | **Partly.** WHERE TO START: "Tap ▶ to play CLICK 120 and watch GR (gain reduction) kick on each hit." With sound off (or on web) nothing kicks. Dragging THRESH does visibly deepen the amber strip and shrink the OUT spikes (GR PEAK 5.5 → 13.0 dB), so the silent path exists but nobody points to it. |
| Words they would not know | "Dynamic range" (card title) · "threshold", "ratio", "attack", "release", "make-up gain" (card) · "GR" / "GR PEAK" (display) · "5 ms CLICK · 120 BPM" · "THRESH −40 dB", "4:1" · "transfer curve", "IN dB / OUT dB" · "dBFS" · "transient" (CHECK YOURSELF) · RATIO tray: "GLUE", "LIMIT", "The workhorse — obvious control without obvious squash. Most channel compression lives here." · "ATK/REL" key name. |
| Follows / continues? | Hard. **Three different GR numbers disagree on one screen:** the picture says "GR PEAK 5.5 dB" (later 13.0 dB), the bezel says "GR — dB", and LAB NOTES › GAIN REDUCTION says "0.0 dB" with "This version of the app can't measure the reduction yet; update the app to see it." A beginner cannot tell which is true and is told to update an app they just opened. Quit point: the DESIGNED RESPONSE paragraph ("A short CLICK 120 is sensed lower than its peak (the attack time smooths it)… the level sensor rides just under the peak (further under with a slow ATTACK and fast RELEASE)"). |
| What works | (1) The dotted outline = "the hit untouched" vs the solid OUT spike — the gap IS the compression; great idea. (2) The amber strip hanging under OUT grows as THRESH drops: visible feedback without sound. (3) The first CHECK YOURSELF ("GR reads 0 dB while audio plays. What does that tell you?") teaches the most common beginner confusion. (4) "EQ changed which frequencies are loud; compression changes when the sound is loud." (LEARN) — a superb bridge sentence; it should be on this page too. |
| Suggestions | 1. **One GR truth on screen.** When live GR cannot be read (web, or an older app), hide the bezel GR and the LAB NOTES meter and say once "On the phone app, a live meter shows this too" instead of "— dB", "0.0 dB" and "update the app". **M, this lab (and any lab with a live meter).** 2. **Shorten the intro card to the first sentence + one picture word** ("Loud parts get turned down, so loud and soft sit closer together"); move threshold/ratio/attack/release to the screen guide. **S.** 3. **Silent first step**: "Drag THRESH down and watch the amber strip under OUT grow — that is the compressor turning the clicks down." **S.** 4. **Rename the ATK/REL key "SPEED"** (or split into ATTACK and RELEASE) and spell out "Attack = how fast it grabs; Release = how fast it lets go" in the tray. **S.** 5. **Rewrite RATIO tray lines in plain words** (2:1 "gentle", 4:1 "medium", 8:1 "strong", 20:1 "almost a wall") — "glue", "squash", "channel compression" are studio slang. **S.** 6. **Move the dense DESIGNED RESPONSE paragraph behind a "Why does GR read less than the curve?" expander.** **S.** 7. Sound Safety sheet: the choice buttons are below the fold of a long sheet; a beginner may not find KEEP SOUND OFF. Pin both buttons at the bottom of the sheet, always visible. **S, SHARED.** |
| Hobbyist | Will go straight for ATK/REL and the PUNCH setting; will love the GR picture. Will be confused by the three different GR readouts and annoyed that THRESH stops at −50 dB. |

---

## Page 2 · LEARN

| Field | Finding |
|---|---|
| Page | Compression Lab · LEARN tab |
| First look | Popup, then a long reading page (same shape as EqLab LEARN: paragraph, WHAT YOU WILL UNDERSTAND, CONTROLS ×7, GUIDED STEPS ×5, COMMON MISTAKES ×6, PRO TIPS ×4, FORMULA / CONCEPT). |
| Overwhelm | **3 / 5** (calm but long, no pictures). |
| Knows what it is learning? | **Yes** — the opening paragraph is the best plain explanation of compression in the lab. |
| Knows what to do first? | **No.** The popup's WHERE TO START sends the beginner to the hardest part first: "Scroll to FORMULA / CONCEPT and work out 12 dB over the threshold at 4:1." |
| Words they would not know | "dBFS" (THRESH entry) · "transient" · "pumping" (explained in COMMON MISTAKES, good) · "knee", "hard knee / soft knee" · "glue", "groove", "group" (PRO TIPS) · "GR = (input − threshold) × (1 − 1/ratio)". |
| Follows / continues? | Yes for a motivated reader; GUIDED STEPS all start with "Tap ▶" and describe what you would hear/see while playing. |
| What works | The opening paragraph; COMMON MISTAKES ("The compressed version sounds better, so it's working." → louder fools your ear); the worked example "12 dB over at 4:1 → 9 dB of GR". |
| Suggestions | 1. **WHERE TO START should point at the opening paragraph and GUIDED STEP 1**, not the formula. **S.** 2. Add a 4-frame picture of one drum hit: untouched / fast attack / slow attack / fast release — the CONTROLS entries describe it in words only. **M.** 3. Put "knee" in CONTROLS or drop it from COMMON MISTAKES (it appears only as a mistake). **S.** |
| Hobbyist | PRO TIPS ("lower the threshold until 3–6 dB of GR…") is exactly what they want. |

---

## Page 3 · CHECK (4 questions)

| Field | Finding |
|---|---|
| Page | Compression Lab · CHECK |
| First look | Same calm check card as EqLab; "4 still to get right". |
| Overwhelm | **2 / 5.** |
| Knows what it is learning? / first step? | Yes / Yes. |
| Words they would not know | "transients" (Q2 option), "ceiling" (Q4 option). |
| Follows / continues? | Yes. Question 1 is arithmetic (4:1, 8 dB over) — fine after LEARN, hard cold. |
| What works | Answer lengths are more even than EqLab's (Q1, Q3 good). |
| Suggestions | 1. Q2 and Q4 still make the right answer the longest, self-explaining one ("Nothing — a compressor only acts above the threshold"; "Bringing the whole signal back up after compression…"). Even out lengths. **S.** |
| Hobbyist | Fair. |

---

## Lab verdict — CompressionLab

**Beginner's journey:** A strong first sentence ("makes loud parts quieter") is buried under three stacked popups and a five-term intro card. The picture is clever (outline vs OUT, amber strip = turned-down amount) and it does respond to THRESH and RATIO without sound, but the page never tells a sound-off learner to look there, and three disagreeing GR readouts (5.5 dB / — dB / 0.0 dB + "update the app") undermine trust in the one number the lab is about. LEARN is excellent reading but its popup starts the beginner on the formula.

**3 biggest orientation problems**
1. Conflicting GR readouts and an "update the app" message inside the lesson.
2. Popup stack on arrival (card with five terms → safety wall with hidden buttons → learning popup) — SHARED.
3. Studio slang in the trays (glue, squash, workhorse, PUNCH, LIMIT) and the ATK/REL key.

**3 best things**
1. Dotted "untouched" outline vs the solid OUT hit: the effect is the gap.
2. LEARN's bridge sentence: "EQ changed which frequencies are loud; compression changes when the sound is loud."
3. CHECK YOURSELF on "GR reads 0" — targets the real beginner misconception.

**First 30 seconds rewrite**
Card: "**Compressor** — an automatic hand on the volume knob. When a sound gets too loud, it turns it down a little." Button SHOW ME. Pointer on THRESH: "This line is 'too loud'. Drag it down." After the drag: "See the amber strip under OUT? That's how much the compressor turned the hits down. Now try RATIO — how hard it turns them down."
