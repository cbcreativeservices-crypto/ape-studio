# G6b · FlangerLab — LEARN and CHECK walked (G6 judged them from source)

Walked 2026-11-14, sound OFF, tab-5 at 390 x 844. **How reached:** full app → OPEN LABS → EXPLORE ADVANCED LABS → Modulation → Flanger (no lock). SOUND SAFETY WARNING on arrival again (KEEP SOUND OFF). After it, my first two taps on the LEARN tab did nothing (the fading sheet seems to swallow them); a third tap worked. G6 walked EXPLORE (G6_FlangerLab.md).

---

## Page 2 · LEARN (walked)

| Field | Finding |
|---|---|
| Page | Flanger Lab · LEARN tab |
| First look | Text page, no picture. Eye lands on "A flanger mixes your sound with a copy delayed by only a few milliseconds. Wherever the copy arrives half a cycle late, it cancels your sound and cuts a notch." Sentence two already needs "half a cycle" and "notch". Popup ~1 s later. |
| Overwhelm | **4 / 5** — the heaviest LEARN of the modulation labs: 8 CONTROLS entries, **three of which are controls this lab does not have** ("LFO Waveform — No key on this rack", "Stereo width / LFO phase offset — Fixed at 90°", "Through-Zero (TZF) ADV — No key on this rack"); FDBK has four values incl. "−70% HOLLOW", plus 6 guided steps, 6 mistakes, 4 tips, a formula with (2k − 1) ÷ (2τ). |
| Knows what it is learning? | **Partly.** WHAT YOU WILL UNDERSTAND is clear, but every bullet uses "notches", "comb", "Hz" — all new. A beginner thinks: "it's about a jet-plane sound" (the subtitle "The jet" helps). |
| Knows what to do first? | **Poorly.** WHERE TO START: "**Scroll to FORMULA / CONCEPT and read it.** Then switch to EXPLORE, open LAB NOTES, set CENTER to 5.0 ms, and check that the notches sit every 200 Hz." Formula-first, with τ and (2k − 1). |
| Words they would not know | "milliseconds" · "half a cycle" · "notch" · "comb filter" (explained by analogy — good: "like the teeth of a comb") · "Hz" · "LFO" ("the slow wobble you met in Chorus" — good link) · "SPECTRUM (dB)" · "FDBK", "METALLIC", "HOLLOW" · "phaser" (next lab) · "LFO phase offset", "TZF", "reverse jet" · "τ", "(2k − 1) ÷ (2τ)". |
| Follows / continues? | **I tried Guided step 2 silently on EXPLORE** (CENTER fader 0.50 ms → 5.0 ms): the caption changes exactly as promised — "Notches every 2000 Hz" → "Notches every 200 Hz". **But the picture contradicts the words**: the spectrum uses a log axis (100 · 1k · 10k), so notches that are "evenly spaced in Hz" look bunched up at the right-hand (bright) end and wide apart at the left; at 0.5 ms the few notches all sit in the far-right corner. A beginner reading "evenly spaced, like the teeth of a comb" sees an uneven squiggle and loses trust. The OUT analyzer is only ~120 px wide on a phone. Nothing at the end of LEARN points onward. |
| What works | The comb-teeth analogy; "the slow wobble you met in Chorus" (links back without assuming the formula); Guided steps 2 and 4 are checkable without sound (caption numbers; notches vanishing at MIX 100%); COMMON MISTAKES "A pure tone is a good test source" explains the choice of noise; PRO TIP "a flanger often works best on one part for a short moment, like a drum fill" gives a real-world reason. |
| Suggestions | 1. **WHERE TO START: "Read the first paragraph, then on EXPLORE drag CENTER all the way left and right and watch the notch count in the caption"** — formula last. **S.** 2. **Remove (or fold into one "Other flanger controls you'll meet" line) the three entries for controls this lab does not have.** They triple-load a beginner for no action. **S.** 3. **Fix the picture/word clash about "evenly spaced"**: add a caption under the spectrum ("This axis is squeezed at the top, so even gaps look closer on the right"), or offer a linear-axis view for the flanger. **M, this lab.** 4. **Define "notch" at first use** ("a narrow dip where a band of frequencies is cancelled"). **S.** 5. **Put the formula after the steps and give it in words first** ("gap between notches = 1 ÷ delay; 5 ms → 200 Hz"); keep (2k − 1)/(2τ) for the hobbyist. **S.** 6. **End: "Next: try steps 2 and 4 on EXPLORE, then CHECK."** **S, SHARED.** |
| Hobbyist | Will enjoy CENTER / FDBK / negative feedback and the TZF note. Will spot the log-axis issue instantly but will not be confused by it. |

---

## Page 3 · CHECK (walked: every question wrong first, then right)

| Field | Finding |
|---|---|
| Page | Flanger Lab · CHECK tab |
| First look | Same calm frame; popup: "Start with the first question, on notch spacing… Right answers stay right." |
| Overwhelm | **3 / 5** — Q1 is a calculation, Q2 compares with a lab the learner may not have done yet. |
| Knows what it is learning? | **Yes.** |
| Knows what to do first? | **Yes.** |
| Words they would not know | "center delay", "2 ms", "comb notches" (Q1) · "phaser" (Q2 — the Phaser lab is listed AFTER Flanger) · "FEEDBACK" (key says FDBK) · "metallic scream" · feedback: "all-pass stages", "re-circulates", "Broadband". |
| Follows / continues? | Yes. Wrong picks → replies: Q1 "2,000 Hz" → "Notch spacing is 1 ÷ delay time: **1 ÷ 0.002 s = 500 Hz.**…" (gives the answer; 2,000 Hz is what you get at 0.5 ms — a near-miss the feedback could name). Q2 "fewer notches" → "The flanger's short delay produces an even comb. The phaser's all-pass stages place a handful of notches…" (answer given; "all-pass stages" unexplained). Q3 "notches spread further apart" → "Feedback re-circulates the delayed copy, lifting tall, narrow peaks… **Speed belongs to RATE, and spacing belongs to the delay time.**" — good: it tells me which control my wrong idea belongs to. Q4 "A sine is too loud" → "Broadband sources such as pink or white noise have energy everywhere…". After the 4th ✓: "Check passed." and nothing else. Answer-length tell on Q2, Q3, Q4. **Duplication:** EXPLORE's two CHECK YOURSELF cards ("What makes a flanger's notches different from a phaser's?"; "You push flanger FEEDBACK toward the maximum. What happens?") are near-copies of CHECK Q2 and Q3. |
| What works | Q1 uses the number on the CENTER key (2.0 ms) — "use what's on the screen"; Q3's "speed belongs to RATE, spacing to delay" feedback; Q4 links back to the choice of source. |
| Suggestions | 1. **Q1 wrong feedback: name the slip, keep the answer** ("2,000 Hz is the gap at 0.5 ms. At 2 ms the gap is… 1 ÷ 0.002"). **S.** 2. **Flanger vs phaser: ask it in the Phaser lab, not here** (or add one line: "A phaser — the next lab — makes a few uneven notches"). **S.** 3. **Make EXPLORE's CHECK YOURSELF cards different from CHECK.** **S.** 4. **Explain "all-pass" or drop it from the feedback.** **S.** 5. **End of check: next step.** **S, SHARED.** |
| Hobbyist | Good, technical, fair; Q1 is satisfying. |

## Lab verdict addendum — FlangerLab LEARN + CHECK
The most demanding LEARN of the effect labs: three entries for controls that do not exist on the rack, a formula-first start, and a log-axis picture that makes "evenly spaced" notches look uneven. The silent steps do work (the caption numbers change exactly as promised). CHECK is solid and technical but repeats EXPLORE's cards, compares with the Phaser before the learner has seen it, and ends with no next step.
