# G2 · GainLabHome (Gain Staging Lab) — beginner orientation audit

Walked 2026-11-14 at 390 px wide (390 x 780 frame, see G2_PROGRESS.md), sound OFF. Modules opened with `#labpreview/GainModule/<id>` (all 8 walked on screen). The lab HOME (`GainLabHome`) has no preview route and is member-only; see the HOME entry for how it was checked.

---

## Page: Module 1 · What Gain Staging Is · `#labpreview/GainModule/intro`

| Field | Finding |
|---|---|
| First look | A clean left-to-right picture: a microphone (SOURCE), a preamp box (PREAMP), a speaker/output box (OUTPUT), each with a coloured level bar under it, and arrows "INPUT ▸ OUTPUT" along the top. Thinks: "the path my voice takes to the speaker". Exactly right. |
| Overwhelm | 1–2. One dock key (SOURCE). Readouts SOURCE / PREAMP / OUTPUT / STATUS. The calmest first page of all my labs. |
| Knows what it is learning? | Yes. Card: "A signal passes through stages, and each stage has a healthy range: loud enough above the hiss, with headroom left below the 0 dB overload ceiling." "Hiss" is a word everyone knows. |
| Knows what to do first? | Yes: "Raise SOURCE from −30 dB and watch PREAMP and OUTPUT climb with it. Stop when STATUS reads HOT, then keep going until it reads CLIP." Did it: one drag took STATUS straight to CLIP (red CLIP tags on PREAMP and OUTPUT) — the fader is sensitive enough that the HOT stop was skipped. The SOURCE tag still read "HEALTHY" while everything after it clipped, which is actually the lesson, but nothing says so at that moment. |
| Words they would not know | dB, headroom (underlined as a glossary link: good), "RELATIVE dB", "FIXED" (tag under stages), noise floor. |
| Follows / continues? | Yes. Short text, one quiz, NEXT. |
| What works | (1) Real-looking gear icons in signal order. (2) Four-colour legend in words: TOO LOW / HEALTHY / OVERLOAD / HISS (NOISE FLOOR). (3) "The whole job: a healthy level at every stage." — the lab in one line. (4) FIXED tags tell you which stages you cannot touch. |
| Suggestions | 1. (S) When SOURCE reads HEALTHY but a later stage CLIPs, show one line: "Your source is fine, the PREAMP after it is overloaded." That is the "aha" of the module. 2. (S) Make the fader step finer near HOT or snap briefly at HOT so the card's "Stop when STATUS reads HOT" can be done. 3. (S) The status words (QUIET, HEALTHY, HOT, CLIP) do not match the legend words (TOO LOW, HEALTHY, OVERLOAD); use one set. 4. (S) SHARED: the header shows two identical ⓘ buttons side by side (one is the screen guide, one is the accuracy note); a beginner cannot tell them apart. Give the accuracy one a different glyph or word. |
| Hobbyist | Simple but satisfying; they will skip ahead quickly. |

## Page: Module 2 · Input Gain First · `#labpreview/GainModule/input`

| Field | Finding |
|---|---|
| First look | Same three-stage picture, preamp bar blue (low). Tag under PREAMP reads "TOO" (the word "LOW" is cut off at 390 px). |
| Overwhelm | 2. One dock key: INPUT GAIN. Readouts PREAMP / HEADROOM / OUTPUT / STATUS. |
| Knows what it is learning? | Yes. Card: "Input gain is the first level decision in a chain: the preamp lifts a quiet source above the hiss, and headroom shrinks as the gain rises." |
| Knows what to do first? | Yes: "Slide INPUT GAIN up from +0 dB and watch PREAMP leave the blue zone. Keep going until HEADROOM reads 6 dB, then 0 dB". Did it: at +25 dB gain the PREAMP read −5 dB, HEADROOM 5 dB, STATUS HOT. Works. But two numbers for "the preamp" sit on screen: the dock says INPUT GAIN +25 dB, the readout says PREAMP −5 dB. A beginner thinks one of them is wrong. That difference (the KNOB vs the LEVEL it produces) is the key idea of gain staging and is never said. The amber well text calls the same control "the PREAMP fader". |
| Words they would not know | input gain, preamp, headroom, "+0 dB" as a gain vs "−30 dB" as a level. |
| Follows / continues? | Yes. "There's no magic number to hit" is reassuring. |
| What works | (1) "ONLY the PREAMP fader is yours on this screen" — tells you what to touch. (2) HEADROOM as its own readout: makes an abstract word into a number that shrinks. (3) Coaching bullet changes ("Too low — the signal is buried near the noise. Bring it up."). |
| Suggestions | 1. (S) Label the two numbers: dock "GAIN KNOB +25 dB", readout "PREAMP LEVEL −5 dB", plus one sentence: "The knob adds gain; the level is what comes out." 2. (S) Use one name for the control (INPUT GAIN or PREAMP), not both on one screen and a third name ("PREAMP" key) on the next page. 3. (S) Fix the cut "TOO" tag at 390 px (use "LOW"). SHARED (stage tag fit). |
| Hobbyist | The knob-vs-level split is exactly what confuses hobbyists with interfaces; saying it out loud would be the most useful line in the lab. |

## Page: Module 3 · Follow the Signal · `#labpreview/GainModule/follow`

| Field | Finding |
|---|---|
| First look | Four stages now: SOURCE › PREAMP › PROC › OUTPUT, all bars mid-green. |
| Overwhelm | 2. One dock key (PREAMP). |
| Knows what it is learning? | Yes. Card: "Each stage's output is the next stage's input, so the preamp setting decides how much room every later stage has, and clipping anywhere rides on to the output." |
| Knows what to do first? | Yes: "Raise PREAMP from +6 dB to +18 dB and compare the PREAMP and PROC readouts. Then try +24 dB and see which stage reaches CLIP first." Did it: pushed to +40 dB; PREAMP, PROC and OUTPUT all showed CLIP at once, so "which reaches CLIP first" cannot be seen in one drag. |
| Words they would not know | PROC (abbreviation of processor; never spelled out on the display), downstream, distortion (glossary link). |
| Follows / continues? | Yes. "you can't rescue a bad preamp setting with anything that comes after it" is the key line and is clear. |
| What works | (1) Adding one stage at a time across modules 1→3 (3 stages, then 4): one new idea per page. (2) The quiz ("Turning the processor after it DOWN will… lower the level, not the distortion"). |
| Suggestions | 1. (S) Spell PROC as "PROCESSOR" or "EQ/FX" under the icon (there is room in a 4-column layout). 2. (S) Mark the FIRST stage that clipped (e.g. a small "1st" badge) so "which reaches CLIP first" has a visible answer. |
| Hobbyist | Quick and clear. |

## Page: Module 4 · Too Low vs. Too High · `#labpreview/GainModule/lowhigh`

| Field | Finding |
|---|---|
| First look | Same chain with a NOISE readout. Dock: PREAMP, OUTPUT, SCENARIO ("BAL"). |
| Overwhelm | 2. |
| Knows what it is learning? | Yes. Card: "too low early leaves the signal close to the hiss, too high early clips it, and later gain fixes neither." |
| Knows what to do first? | Yes: "Tap SCENARIO and pick BALANCED, and note the NOISE readout. Then pick TOO LOW EARLY and TOO HIGH EARLY". Did it: TOO LOW EARLY → NOISE rose from −34 to −22 dB, the tray explains "every later stage must boost, and each boost lifts the noise floor". But STATUS read "HOT" (because the output was pushed), not "NOISY". The one big status word points the beginner at the wrong problem (level) when the lesson is noise. |
| Words they would not know | noise floor, "BAL" (dock abbreviation for BALANCED), NOISE −34 dB (a negative noise number: lower = better is not obvious). |
| Follows / continues? | Yes. |
| What works | (1) Three named SCENARIOS with one-line stories. (2) The NOISE readout makes hiss visible without sound. (3) Quiz: "The output meter now reads healthy — so what's wrong?" is a great real-world trap. |
| Suggestions | 1. (S) Add a STATUS word for the noise problem ("NOISY") so TOO LOW EARLY is flagged as what it is. 2. (S) Write "BALANCED" in the dock, not "BAL". 3. (S) Next to NOISE, say which way is good ("lower = quieter hiss"). |
| Hobbyist | Very relevant to anyone who records quiet and normalises later. |

## Page: Module 5 · Gain vs. Fader · `#labpreview/GainModule/fadervsgain`

| Field | Finding |
|---|---|
| First look | SOURCE › PREAMP › FADER › OUTPUT with a DIST readout ("—"). Dock: PREAMP, FADER, OVERDRIVE, RESET. |
| Overwhelm | 2. |
| Knows what it is learning? | Yes. Card: "A fader sets level, not quality: once the preamp clips, pulling a later fader down only makes the distortion quieter." |
| Knows what to do first? | Yes: "Press OVERDRIVE and watch DIST turn YES. Pull FADER down…". Did it: OVERDRIVE → every stage CLIP, DIST YES, and the coaching box changed to "The preamp is clipping. Now pull the FADER down…"; pulled FADER to −25 dB → OUTPUT −25 dB but DIST still YES, stage tags read "DIST", and the box said "The fader is down and the output is quieter — but it is STILL distorted." Textbook feedback: the page talks you through each step. |
| Words they would not know | DIST (abbreviation), overdrive, upstream. |
| Follows / continues? | Yes. Best module of the lab. |
| What works | (1) A one-press OVERDRIVE key so the student causes the fault instantly. (2) Coaching text that reacts to what you just did. (3) "DIST" tags that travel down the chain. (4) "This is the one that catches everyone." — a reason to care. |
| Suggestions | 1. (S) Spell DIST as "DISTORTED: YES". 2. (S) Copy this "reactive coaching box" pattern to the other modules (it is the best orientation device in my six labs). SHARED candidate. |
| Hobbyist | The myth every beginner mixer holds; lands perfectly. |

## Page: Module 6 · Multiple Gain Stages · `#labpreview/GainModule/multistage`

| Field | Finding |
|---|---|
| First look | Seven narrow columns (SOURCE, PREAMP, EQ, COMP, FADER, BUS, MASTER), each a dark box with two tiny dots labelled SIG and CLIP. Thinks: "a mixing desk channel… with nothing on it?" |
| Overwhelm | 3–4. Seven stages at 390 px make each column ~45 px wide; the SIG/CLIP dots are tiny and lit vs unlit is hard to tell. Dock: PREAMP, PROCESS ("-6·0 dB"), LEVELS ("6·6·0 dB"), X-RAY. The dot-separated multi-values in the dock keys are cryptic. |
| Knows what it is learning? | Partly. Card: "A whole channel strip is one system: each stage's gain shifts every stage after it, and a MASTER that looks fine can hide a weak or clipping stage upstream." Good, but "channel strip", "bus", "comp" are new. |
| Knows what to do first? | Partly. "With X-RAY OFF, find the SIG lights that stay dark." At phone size the beginner cannot reliably see which tiny dots are dark. Then "Tap X-RAY": did it — every column filled with a meter and a verdict (QUIET SOURCE, HEALTHY, TOO LOW, TOO LOW, HEALTHY…). That reveal is a strong "aha". |
| Words they would not know | channel strip, EQ, COMP, BUS, MASTER, SIG, X-RAY, XLR, nearfield monitor, line cable (well text), "6·6·0 dB". |
| Follows / continues? | Mostly; the X-RAY reveal carries it. The PROCESS / LEVELS trays (not opened) hold several faders each. |
| What works | (1) X-RAY as an on/off "see inside" switch: perfect metaphor. (2) Per-stage verdict words under each meter. (3) The well text explains the real cabling (mic → XLR → preamp … → powered monitor), a real-world anchor. |
| Suggestions | 1. (M) On a phone, start with X-RAY ON for the first view (so they see the meters), then ask them to turn it OFF ("this is all a real desk shows you") — reverse the order so the tiny dots are understood before they are needed. 2. (S) Make the SIG/CLIP dots larger or add a lit/unlit glow ring. 3. (S) Dock keys: show the name of the stage being changed, not "6·6·0 dB"; or show "3 faders". 4. (S) One-line gloss row under the column names the first time (EQ = tone, COMP = evens out loudness, BUS = group, MASTER = final out). |
| Hobbyist | Exactly their DAW channel; the X-RAY is the hook. |

## Page: Module 7 · Free Practice · `#labpreview/GainModule/freeplay`

| Field | Finding |
|---|---|
| First look | The same seven-stage strip with X-RAY ON and all meters green. Dock: SOURCE, PREAMP, PROCESS, LEVELS, X-RAY. |
| Overwhelm | 3 (five keys, seven stages), but nothing is graded, which removes pressure. |
| Knows what it is learning? | Yes. Card: "There is no single right input gain: the right setting depends on how loud the source is, and you recover from a mistake at the stage where it started." |
| Knows what to do first? | Yes: "Raise SOURCE to −10 dB and watch the PREAMP clip. Then pull PREAMP down until every stage is healthy again and STATUS reads OK." Clear and doable (pattern identical to Module 1/2, which I walked). |
| Words they would not know | as Module 6. |
| Follows / continues? | Yes; "Nothing is graded: the chain just tells the truth." |
| What works | Low pressure; the card still gives one concrete first task, so "free" is not "lost". |
| Suggestions | 1. (S) Offer 2–3 named starting sources ("whisper", "guitar amp", "drum") so the free page has prompts. 2. (S) Same dock-label fix as Module 6. |
| Hobbyist | Will enjoy playing; a "scream" source preset would be fun. |

## Page: Module 8 · Troubleshooting Challenge · `#labpreview/GainModule/troubleshoot`

| Field | Finding |
|---|---|
| First look | Seven stages, six of them dark boxes with a big "?" and INSPECT under them; only MASTER shows a meter, red CLIP. Thinks: "a mystery: find which box is broken". Great framing. |
| Overwhelm | 2. One dock key (INSPECT) and taps on the "?" columns. |
| Knows what it is learning? | Yes. Card: "Real systems rarely show a meter at every stage, so you find a fault by checking one stage at a time for the first place clipping appears." |
| Knows what to do first? | Partly. The card says "starting with Preamp" (work FORWARD); the well text says "clipping cascades downstream, so work back upstream" (work BACKWARD). Two opposite strategies on one page. Did it forward: PREAMP → "Healthy here — the problem is elsewhere."; EQ, COMP healthy; FADER → CLIP, FOUND ✓, and a FADER key appeared in the dock. Lowered it to −9 dB → whole chain revealed in a green frame, STATUS OK, "✓ FIXED — healthy at every stage, master included. Take the green frame as your trophy." Excellent ending. Friction: each inspected column goes back to "?" when you inspect the next one, so the student must remember which stages were already healthy. |
| Words they would not know | as Module 6; "cascades". |
| Follows / continues? | Yes. One distraction: a large green "FINISH · SEE WHAT'S LEFT ›" button sits right under the text BEFORE the puzzle is solved; a hesitant student will press it and leave. The "✓ FIXED" message appears below the fold of the scroll well. |
| What works | (1) The "?" boxes — a game anyone understands. (2) "Healthy here — the problem is elsewhere." — instant feedback per tap. (3) FADER control appears only once found: nothing to touch before you have earned it. (4) The green trophy frame. |
| Suggestions | 1. (S) Pick ONE strategy and say it in both card and text. Backward from MASTER is the real-world method the text teaches; then the card should say "start next to MASTER and work left". 2. (S) Keep inspected stages showing their verdict (e.g. a small green ✓ under the "?") so the student builds a map. 3. (S) Show "FINISH · SEE WHAT'S LEFT" only after FIXED (or make it a quiet text link until then). 4. (S) Pin the "✓ FIXED" message where it is visible (top of the well or over the display). |
| Hobbyist | Fun; reflects real live-sound troubleshooting. |

## Page: LAB HOME · `GainLabHome` (GainLabHomeScreen) — walked on screen (late in the run)

How reached: no `#labpreview` route and member-only, so (as for the Digital home) I used the dev-web member toggle in my own Chrome tab and went Home → OPEN LABS → EXPLORE FUNDAMENTALS → Signal → "Gain Staging" (the LAST tile of the Signal group, after Digital, Visual Analysis, Signal Chain, Detective, three cable labs and Patchbay; its tile blurb is cut off mid-sentence: "…unity gain through the").

| Field | Finding |
|---|---|
| First look | Two popups first: a glossary term card "Gain Staging" ("Gain staging means balancing levels all the way down the signal chain. The aim is that nothing is too quiet, which would let noise show through, and nothing is too loud, which would clip and distort. If you set the levels right early in the chain, the whole path stays clean." CONTINUE), then the intro card. Behind: SOURCE › PREAMP › PROCESSING › FADER › OUTPUT strip, a paragraph, then LEARN / EXPLORE / CHALLENGE sections with a one-line note each and accordion rows. |
| Overwhelm | 2. The calmest lab home of my six. |
| Knows what it is learning? | Yes. The term card is a perfect beginner definition. Subtitle: "Keep the signal healthy at every stage of the chain." |
| Knows what to do first? | Yes. Card: "Tap What Gain Staging Is to read what it covers, then tap OPEN. New to gain staging? Take the LEARN modules in order before EXPLORE and CHALLENGE." |
| Words they would not know | headroom, operating level, propagate (paragraph); RELATED chips: LEVELS & DECIBELS CALC, SPL METER; final caption: "dBu, dBV, dBFS and nominal levels… 0 VU" (five unknown units in one closing sentence). |
| Header icons | Two identical-looking ⓘ buttons. Right one = screen guide ("1 · WHAT YOU'RE SEEING…"). Left one = "LEARN HERE — MEASURE WITH THE RIGHT TOOL" (live tools use an uncalibrated phone mic; for accurate work use a calibrated SPL meter, RTA/RT60 analyzer, light meter, lab-grade loudness meters). On a concept lab about levels between boxes, this note talks about microphones, rooms and light meters — off-topic for a beginner here, and it looks exactly like the help button. |
| Follows / continues? | Yes. |
| What works | (1) The term card. (2) LEARN / EXPLORE / CHALLENGE sections: you can see the path and feel progress. (3) Accordion rows like the other labs. |
| Suggestions | 1. (S, SHARED) Give the accuracy note its own look (a small "ACCURACY" text chip, as the Audio Fundamentals list header already does) instead of a second ⓘ. 2. (S) Cut the closing caption's unit list for beginners or move it into the LEVELS & DECIBELS chip. 3. (S) In the Labs list, Gain Staging is the friendliest Signal lab but sits last; consider placing it first in the Signal group (before Digital and Signal Chain) or marking it "Start here". 4. (S) Fix the cut-off tile blurb. |
| Hobbyist | Will go to CHALLENGE first; the map supports that. |

---

## GainLabHome — overall verdict

The beginner's journey: this is the most beginner-friendly lab of my six. Every module is one picture (a chain of real-looking gear), one or two controls, one idea, and stages are added one at a time (3 → 4 → 7). Module 5 (Gain vs. Fader) has a coaching box that reacts to each action and should be the model for other labs. The rough spots are wording: the same control is called INPUT GAIN / PREAMP fader / PREAMP across pages, the knob value (+25 dB) and the level it produces (−5 dB) sit side by side unexplained, and status words do not match legend words. In the 7-stage modules the SIG/CLIP dots are too small at phone width, and the challenge gives two opposite search strategies.

**3 biggest orientation problems**
1. Gain (knob) vs level (result) never named, though both numbers are on screen (Module 2 onward).
2. One control, three names (INPUT GAIN / PREAMP fader / PREAMP); status words (QUIET/HOT/CLIP) vs legend (TOO LOW/OVERLOAD); STATUS says HOT when the lesson is NOISE (Module 4).
3. Seven-stage modules at 390 px: tiny SIG/CLIP dots, cryptic dock values ("6·6·0 dB"), and the challenge's forward-vs-backward contradiction.

**3 best things**
1. Reactive coaching box in Gain vs. Fader ("The fader is down and the output is quieter — but it is STILL distorted").
2. One new stage per module, with FIXED tags showing what you cannot touch.
3. The challenge as a "?" mystery with per-tap feedback and a green-frame trophy.

**"First 30 seconds" rewrite (home + Module 1)**
"Sound travels through several boxes before it reaches a speaker. Each box needs the right amount: too little and you hear hiss, too much and it crunches. Learn it in 5 short pages, try it freely, then solve a mystery." Module 1 opens with one fader and the first status line "Push SOURCE up until a box turns red."
