# G6 · EqLab (Equalizer Lab) — beginner orientation audit

Walked 2026-11-14 at 390 x 844, sound OFF, `http://localhost:8142/#labpreview/EqLab` (tab-5). Source read after the walk: `src/screens/lab/fxLabConfigs.tsx` (eqConfig), `src/screens/lab/eq/equalizerScreenGuides.ts`, `src/components/HelpKey.tsx`.

This is the FIRST lab in my set that uses the shared effects-lab frame (FxLabScreen + LabShell: header with ‹ / ? / ⓘ / ▶, LEARN · EXPLORE · CHECK tabs, pinned rack display with HIDE DISPLAY / FULL SCREEN, LAB NOTES well, bottom dock of keys with a pop-up tray, intro card, screen guide). The frame is judged in full here; later effect labs refer back to "SHARED-1 … SHARED-n" below.

---

## Page 1 · EXPLORE (the rack) — opens first

| Field | Finding |
|---|---|
| Page | Equalizer Lab · EXPLORE tab (the lab opens here) · `#labpreview/EqLab` |
| First look | A centered card titled **Equalizer**: "An equalizer boosts or cuts chosen frequencies. It shapes the tone of a sound." + CONTINUE. Behind it, a busy dark rack: a squiggly white-to-green wave with IN / OUT, a green "EQ" pill, a thin curve strip, four amber readouts. After CONTINUE the eye lands on the moving green wave, then on the bright amber dock at the bottom (FREQ · TYPE · GAIN · Q · SOURCE). The beginner thinks: "this is a sound-editing machine with a lot of knobs." |
| Overwhelm | **4 / 5.** Within ~10 seconds the newcomer meets: the intro card, then (in my walk) a full-height **SOUND SAFETY WARNING** wall of legal text, then a second popup (WHAT YOU'RE LEARNING / WHERE TO START), then a coach tip "New: tap ⓘ to have this screen explained". Behind them: 2 pictures, 4 readouts, a disclaimer line in capitals, 2 buttons, a paragraph, a LAB NOTES box, a fader and 5 keys. Three different popups before touching anything is the main load. |
| Knows what it is learning? | **Partly.** The intro card and the WHAT YOU'RE LEARNING popup say it plainly ("How one EQ band reshapes a sound"). But "band", "frequencies", "Q" are not explained, so the beginner thinks they are learning "how to make sound bassier or brighter" (close enough) without knowing what the four readouts mean. |
| Knows what to do first? | **Partly.** WHERE TO START says "Set SOURCE to PINK NOISE and tap ▶. Sweep the FREQ fader…". Without sound (or with sound off as the warning suggests) the first step does nothing they can perceive. With the popup closed, the eye goes to the big amber FREQ fader: dragging it is the right first move and the picture responds (curve bump moves, wave reshapes). That works. |
| Words they would not know | "frequencies" (intro card, never defined in plain words) · "Boost · Cut · Q · Filter shapes" (subtitle) · "EQ band" · "Q" · "PEAK", "1.0k", "+6 dB", "1.4" (bezel readouts, no units in words) · "EQ CURVE · 20 Hz → 20 kHz" · "the wave's 150 Hz · 1k · 6k tones" · "TEACHING MODEL · … NOT A MEASUREMENT" · "pink noise" / "PINK" · "SINE 440 Hz" · "WHITE NOISE" · "HIGH-PASS / LOW SHELF / HIGH SHELF / LOW-PASS" · "12 dB-per-octave slope" (TYPE tray) · "DESIGNED RESPONSE — CALCULATED, NOT A MEASUREMENT" · "surgical" · "rumble-and-mud eraser" · "60 Hz hum", "high-Q cut" (CHECK YOURSELF). |
| Follows / continues? | They can drag the fader and tap trays; every tray says "stays open — compare while you watch", which is good. The TYPE tray gives a one-line description per shape (good). The well under the display is only ~350 px tall on a phone (display ~355 px pinned on top, dock ~130 px at the bottom), so reading LAB NOTES is a narrow slot. They would likely quit at the CHECK YOURSELF card about "60 Hz hum … narrow high-Q cut", which assumes hum and Q are known. Where to go next is not stated on the page (nothing says "now open CHECK"). |
| What works | (1) The IN → EQ → OUT picture with the three dots (150 Hz · 1k · 6k) that grow or shrink — a real "see what you did" feedback loop. (2) Trays that stay open with a one-line meaning of each TYPE ("Boost or cut a BAND around the frequency, leaving both sides alone"). (3) The screen guide moves itself to the top when it points at the dock, so it never covers what it explains. (4) Wrong answer in CHECK YOURSELF gives an action, not a lecture: "Switch to HIGH-PASS and tap through the GAIN values — watch the curve." (5) The DESIGNED RESPONSE caption updates in words ("+6 dB at 1 kHz, Q 1.4. Wide Q = a broad, musical move."). |
| Suggestions | 1. **One popup at a time, in a fixed order, at most two before the first touch** (intro card → WHAT YOU'RE LEARNING). Show the Sound Safety warning only when the learner first presses ▶ / SOURCE, never on arrival; drop the "New: tap ⓘ" coach tip when the learner has already opened the guide. **M, SHARED** (intro card / screen guide / sound-safety host). 2. **Give WHERE TO START a silent first step**: "Drag the FREQ fader left and right and watch the bump on the green curve and the three dots." Then "When you're ready to listen, tap ▶." Sound-off and web users currently have no first step that works. **S, per-lab copy (all effect labs).** 3. **Add plain-word captions to the four bezel readouts on first visit** (e.g. FREQ "where", GAIN "how much", Q "how wide", TYPE "shape") — the guide already uses exactly these words; put them on the frame so the picture and words sit together. **M, SHARED** (rack bezel). 4. **When TYPE is HIGH-PASS / LOW-PASS, grey out GAIN (and Q on HIGH-PASS) on the bezel and dock with "not used by this shape"**. Today they keep showing "+6 dB" and "8 NARROW" while doing nothing, which the beginner reads as "it's on". The lesson then becomes visible instead of a trick question. **S, this lab.** 5. **Explain "Hz" and "dB" once, at first appearance, in a tap-able chip** ("Hz = how high or low a sound is; dB = how much louder or quieter"). **S, SHARED.** 6. **Shrink the two disclaimer lines** ("TEACHING MODEL · DRAWN FROM THE SAME MATH… NOT A MEASUREMENT" and "DESIGNED RESPONSE — CALCULATED, NOT A MEASUREMENT") to one small sentence a beginner can parse ("This picture is a model of the EQ, not a meter."), or move them into the guide. All-caps disclaimers read as warnings. **S, SHARED.** 7. **End of LAB NOTES: a "Next" line** ("Done exploring? Try CHECK — 5 questions"). **S, SHARED.** 8. **Two help icons side by side (? and ⓘ) look alike.** "?" leaves the lab for the app's Help search (HelpKey navigates to 'Help'; in this web harness it did nothing visible, so not fully checked), ⓘ explains the screen. Label them in words on first visit ("HELP" / "EXPLAIN") or keep only ⓘ inside labs. **S, SHARED.** |
| Hobbyist | Knows EQ; will skip the popups and go straight to the fader. Will enjoy the dots on the curve strip. Trips on: FREQ range only 100 Hz–8 kHz (where is 60 Hz for the hum question?), and GAIN being only five steps (−12/−6/0/+6/+12) — feels toy-like. |

### Observed oddity (for the coordinator, not a fix)
In the first seconds, after CONTINUE on the intro card and a tap near the header, a full SOUND SAFETY WARNING sheet filled the screen; a moment later it was gone and the WHAT YOU'RE LEARNING popup showed instead, without me pressing either KEEP SOUND OFF or I UNDERSTAND. A beginner would not know whether sound is now on or off. Screenshot sequence in my scratchpad session images (EqLab first open).

---

## Page 2 · LEARN (reading page)

| Field | Finding |
|---|---|
| Page | Equalizer Lab · LEARN tab · `#labpreview/EqLab` → tap LEARN |
| First look | A first-visit popup again (WHAT YOU'RE LEARNING: "The words of EQ — filter type, frequency, gain, Q, bandwidth and slope…"). Behind it, a long grey text page. Eye lands on the popup, then on a big paragraph. Thinks: "the textbook part". |
| Overwhelm | **3 / 5.** Calm layout, but long: definition paragraph, WHAT YOU WILL UNDERSTAND (4 bullets), CONTROLS (5 entries), GUIDED STEPS (5 numbered, each NOTICE + WHY), COMMON MISTAKES (6), PRO TIPS (4), FORMULA / CONCEPT. No pictures at all on this page. |
| Knows what it is learning? | **Yes.** "What this lab teaches — definitions, common mistakes, pro tips, and the formula." and the four WHAT YOU WILL UNDERSTAND bullets are clear. |
| Knows what to do first? | **Partly.** The popup says "Read the Q entry first", but Q is the 4th CONTROLS entry, far down. The page itself starts with the general paragraph, so the advice and the page order disagree. |
| Words they would not know | "frequencies" · "parametric band" / "graphic EQ" (paragraph 1) · "dB per octave" · "headroom" (GUIDED STEPS 4, COMMON MISTAKES, never defined) · "octave" · "pole" (defined in passing as "one stage of the filter") · "analyzer" · "bandwidth" · "Q = center frequency ÷ bandwidth" (formula with no picture) · "rumble", "mud". |
| Follows / continues? | A motivated beginner can read it top to bottom; GUIDED STEPS 2–4 need sound ("you hear a thin ring"). Nothing at the bottom says "now go to EXPLORE and try step 1" or "now take CHECK". Likely quit point: FORMULA / CONCEPT. |
| What works | GUIDED STEPS with NOTICE / WHY is an excellent learning shape (do → see → understand). COMMON MISTAKES written as quoted myths is memorable. The definition paragraph is plain. |
| Suggestions | 1. **Put LEARN first in the journey for a beginner**: the tab row reads LEARN · EXPLORE · CHECK left to right, but the lab opens on the middle tab. Either open on LEARN on first visit, or say on the intro card "New to EQ? Start with LEARN (2 min)". **S, SHARED.** 2. **Add one small picture per CONTROLS entry** (a bell, a shelf, a pass slope, wide vs narrow Q) — the picture is what makes "Q" stick. **M, this lab.** 3. **Define "headroom" and "octave" at first use** in brackets. **S.** 4. **Make each GUIDED STEP a tap-to-try link** that jumps to EXPLORE with that setting already applied. **M, SHARED.** 5. **End with "Next: try it on EXPLORE, then CHECK".** **S, SHARED.** |
| Hobbyist | Will like COMMON MISTAKES and PRO TIPS (matched-level comparison, cut before boost). FORMULA section is the right depth. |

---

## Page 3 · CHECK (5 questions)

| Field | Finding |
|---|---|
| Page | Equalizer Lab · CHECK tab |
| First look | "CHECK YOUR UNDERSTANDING / EQUALIZER LAB / Answer all 5 correctly to pass the check… nothing is lost and there is no score." then question 1. Calm, clear. |
| Overwhelm | **2 / 5.** One question at a time visually, kind wording ("nothing is lost"). |
| Knows what it is learning? | **Yes** — "the check". |
| Knows what to do first? | **Yes** — tap an answer. |
| Words they would not know | "Q from 0.7 to 8" · "rumble" · "graphic EQ band / parametric EQ band" · "24 dB per octave" · "high shelf". |
| Follows / continues? | Yes. Wrong answers can be retried. |
| What works | No score, no penalty, "5 still to get right" counter; the questions match the LEARN page. |
| Suggestions | 1. **The right answer is often the longest one, with its reason attached** (Q1: "It gets narrower — a higher Q affects a smaller range of frequencies" vs three short ones). A beginner learns to pick the long answer, not the idea. Make all four answers similar length and move the "why" into the feedback after the tap. **S, this lab's question data (likely also other labs — flag for the coordinator).** 2. **Offer a "see it" link inside each question's feedback** (e.g. Q question → "Show me on EXPLORE"). **M, SHARED.** |
| Hobbyist | Quick and fair; 5 questions is the right number. |

---

## Lab verdict — EqLab

**Beginner's journey:** The newcomer is greeted kindly by a one-line card, then hit by a stack of popups (sound warning, learning popup, coach tip) before they have touched anything. Once those are gone, the fader and trays are genuinely friendly: drag FREQ and the picture answers, tap TYPE and each shape explains itself. But the readouts speak in units (1.0k, +6 dB, 1.4) and the page relies on sound for its "aha" moments, so a sound-off beginner understands *that* things change but not *what they would hear*. The LEARN page is excellent but hidden one tab to the left of where the lab opens.

**3 biggest orientation problems**
1. Popup stacking on arrival (intro card + sound-safety + learning popup + coach tip) — SHARED.
2. Bezel/dock readouts are numbers with no plain words; GAIN/Q stay "lit" when the shape ignores them.
3. The first step needs sound; no silent first step and no "next" signpost at the end of each tab.

**3 best things**
1. IN → EQ → OUT wave plus the three tone dots on the curve strip: cause and effect in one picture.
2. Trays that stay open with a one-line meaning per choice.
3. LEARN's GUIDED STEPS (NOTICE / WHY) and COMMON MISTAKES.

**First 30 seconds rewrite**
Card: "**Equalizer (EQ)** — the tone knobs of audio. It makes parts of a sound louder or quieter: the deep part (bass), the middle, or the bright part (treble). In this lab you control ONE of those knobs." Button: **SHOW ME**. Then a single pointer at the FREQ fader: "Drag me. Watch the bump move along the green line — left is deep, right is bright." After the first drag: "That bump is your EQ. Next: tap GAIN to make it a dip instead." Sound safety appears only on the first ▶.
