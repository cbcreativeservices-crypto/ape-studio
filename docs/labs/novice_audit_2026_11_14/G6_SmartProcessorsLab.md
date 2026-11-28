# G6 · SmartProcessorsLab (hub + De-Esser & Sibilance Control lab) — beginner orientation audit

Walked 2026-11-14 at 390 x 844, sound OFF. **How reached:** SmartProcessorsLab is not in the `#labpreview/` harness, so I walked it in the full app: `localhost:8142/` → OPEN LABS → EXPLORE ADVANCED LABS → Dynamics → Smart Processors Lab → De-Esser & Sibilance Control (route DeEsserLab). No lock shown. The De-Esser lab uses a different frame from the effect labs: a paged lab (PagedLab: ⏮ ‹ PREV · MODULE n / 9 ▾ · NEXT ›, inline controls, no bottom dock, no ▶ — it is visual only). The browser pane was intermittently hidden during this lab, so some pages were judged from page text plus the screenshots that did succeed (pages 1, 3, 8 and the hub). Source read after: `deesser/SmartProcessorsLabScreen.tsx`, `DeEsserLabScreen.tsx` (header), `smartProcessorsScreenGuides.ts`.

---

## Page 0 · Smart Processors Lab (hub)

| Field | Finding |
|---|---|
| Page | Smart Processors Lab · hub |
| First look | Intro card titled "**De-esser**" (on the hub, before the learner has chosen the de-esser) with a good plain definition ("Sibilance is the harsh 'S' sound in words like 'yes,' 'sister,' or 'sound'…"). Then a WHAT YOU'RE LEARNING popup. Behind: one paragraph, ONE card "De-Esser & Sibilance Control" with a green **OPEN** chip, and immediately below it a 5-question CHECK YOUR UNDERSTANDING. |
| Overwhelm | **2 / 5.** |
| Knows what it is learning? | **Partly.** "Smart processors listen first, decide, then act — … a detector, a threshold, a gain computer, and a choice of what to change." "Gain computer" and "detector" are abstract on the first screen. |
| Knows what to do first? | **Yes** (popup: "Tap the De-Esser & Sibilance Control row and work through its pages in order… then come back here and answer the five… questions"). |
| Words they would not know | "detector", "gain computer", "Sibilance", "split-band", "broadband", "side chain" (check questions), "band-pass". |
| Follows / continues? | Yes. Risk: the 5-question check sits directly under the one card; a beginner may start answering about "side chain" and "split-band" before the lesson. |
| What works | One choice only; the popup gives the whole route (lab → come back → check). |
| Suggestions | 1. **Collapse the hub check until the De-Esser lab has been visited**, or label it "After the De-Esser lab". **S.** 2. The green **OPEN** chip reads like a status ("this lab is open") — make the whole card look like a button with "START ›". **S.** 3. Replace "gain computer" with "a decision ('how much to turn down')". **S.** |
| Hobbyist | Fine; would like to know which other smart processors are coming (but per the no-future-promises rule, nothing should be promised). |

---

## De-Esser lab · 9 pages — one row each

| # · Page | First look / Overwhelm | Learning? / First step? | Words not known | What works | Suggestions (size) | Hobbyist |
|---|---|---|---|---|---|---|
| **1 · What Sibilance Is** | A bar strip of the spoken phrase "this is a sharp sound", one pair of bars (blue body / orange hiss) per letter; below it the spectrum of one "s". **2/5.** | Yes / Yes: "Tap a frame in the strip. Notice where its energy sits — vowels low, sibilants high." | "sibilants", "turbulence", "kHz", "presence EQ", "bright condensers". | **The best opening picture in my set:** real letters of a real phrase, and the S's visibly orange-tall. Picture and words agree. | 1. Add "(the hissy letters: s, z, sh)" after "sibilants" at first use. **S.** 2. Header says "MODULE 1 / 9" though these are pages of one lab — "PAGE 1 of 9" (or no total, per the house rule on totals) would be clearer. **S, SHARED (PagedLab).** | Would like to load their own vocal (out of scope). |
| **2 · Why EQ Is Not Enough** | Two buttons (STATIC EQ CUT · −8 dB / DE-ESSER), a two-strip figure, a readout. **2/5.** | Yes / Yes. Lead: "An EQ cut is always on. A de-esser is on only while there is an S. That one difference is the whole reason it exists." | "static", "dB strip", "ghost". | One sentence = one idea; the readout states the cost ("brightness taken from everything that is not an S: 8.0 dB"). | None needed beyond defining "static" ("always on"). **S.** | Good. |
| **3 · The Detection Path** | A 10-block diagram (INPUT, BAND SPLIT, GAIN, SUM, OUTPUT, BAND-PASS, DETECTOR, THRESHOLD, GAIN COMP.) with a step card. **4/5.** | Partly / Yes: NEXT BLOCK › steps through. | "split-band mode" (introduced here, taught on page 7), "gain element", "side chain", "band-pass", "SUM", "GAIN COMP.", "signal path". | Step-by-step block cards; WALK THE SIGNAL lights the path. | 1. **Start the diagram with only the main path (INPUT → GAIN → OUTPUT) and the "ear" (BAND-PASS → DETECTOR → THRESHOLD)**, and add BAND SPLIT / SUM on page 7 where split-band is taught — page 3 currently shows the split-band version before the learner knows what it is. **M.** 2. Label the bottom row "the ear (listens only)" and the top row "the voice (what you hear)". **S.** | Will appreciate the honest sidechain diagram. |
| **4 · Threshold** | Strip + Threshold slider + live sentence. **2/5.** | Yes / Yes. | "hard-knee model", "ducking". | Feedback in words after every move: "5 of 5 sibilants above threshold · 0 other sounds crossing — About right…". A model of action → feedback. | 1. Drop "(in this hard-knee model)" from the lead. **S.** | Good. |
| **5 · Choosing the Frequency** | Five letter buttons, two sliders, a spectrum with a gold dashed band. **3/5.** | Yes / Yes: "the detector hears 98% of this 's''s hiss — On target". | "Detector frequency", "Band width Q 1.4", "band-pass". | STARTING POINTS by voice type ("Typical female voice · 7.0k") with "Starting points, not answers". | 1. Say what Q means here ("how wide the ear listens"). **S.** | Will copy the starting points. |
| **6 · Reading Gain Reduction** | Two sliders, a meter figure, a readout "peak 7.4 dB · average 5.8 dB · stage: Controlled". **3/5.** | Yes / Yes. | "Range", "ratio" (mentioned, no ratio control exists in this lab), "safety rail", "conceptual". | "Read it as a question — am I working on S's only, and by a sensible amount?" | 1. Remove "and ratio" or show it. **S.** 2. This is the only page with no UNDERSTANDING CHECK — add one so the rhythm stays the same. **S.** | Good. |
| **7 · Broadband vs Split-Band** | Mode buttons, a frame stepper, before/after bars. **3/5.** | Yes / Partly — on arrival the selected frame is "th · no reduction", so switching modes shows nothing until JUMP TO AN S. | "broadband", "split-band", "attenuated", "cyan body bar". | "Same decision, different action." | 1. Open the page already on an S frame so the first mode switch shows the difference. **S.** | Good. |
| **8 · Over-De-Essing** | One "How hard" slider, a strip, a stage card, THE PROGRESSION list. **2/5.** | Yes / Yes: sliding to 73% → "LISPING · ABOUT 11 dB ON THE S'S — The talker sounds like they have a lisp." and the ▶ marker moves down the progression list. | "intelligibility", "range". | Named stages are the "sound" for a sound-off learner. **Model page for describing what you would hear.** | None. | Rule of thumb is useful. |
| **9 · Connections & Check** | Five link cards (EQ Lab, Compression, Gate / Expander, Visual Audio Analysis, Speech & Voice Lab) + one check + FINISH. **2/5.** | Yes / Yes. | "detector → threshold → gain computer". | Each link says what to do there ("Build the static cut from page 2 as a real EQ band…"): a real "where next". | 1. Add one line "What you learned" above the links. **S, SHARED end-page pattern.** | Good. |

---

## Lab verdict — SmartProcessorsLab / De-Esser

**Beginner's journey:** The most beginner-friendly lab in my set. It starts from a phrase anyone can say ("this is a sharp sound") and a picture where the S's are visibly orange-tall, then adds one idea per page with live words after every move ("5 of 5 sibilants above threshold…", "LISPING…"). It does not depend on sound: named stages stand in for listening. The one hard wall is page 3, a 10-block diagram that shows split-band wiring four pages before split-band is taught.

**3 biggest orientation problems**
1. Page 3's full split-band block diagram before split-band is explained.
2. Hub: the 5-question check sits right under the single lab card, before the lesson.
3. Small jargon leftovers ("hard-knee", "ratio" without a control, "gain computer").

**3 best things**
1. Page 1's letter-by-letter phrase strip.
2. Feedback sentences after every control move (pages 4, 5, 8).
3. Page 9's links that say what to do in each related lab.

**First 30 seconds rewrite**
Hub card: "**De-esser** — it softens the hissy S sounds in a voice, and only those." START ›. Page 1 lead: "Say 'this is a sharp sound'. The S sounds hiss. In the bars below, orange is hiss: see how tall the S's are? Tap one."
