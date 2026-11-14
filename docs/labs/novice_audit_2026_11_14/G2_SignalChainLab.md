# G2 · SignalChainLab (Signal Chain Builder) — beginner orientation audit

Walked 2026-11-14 at 390 px wide (390 x 780 frame), sound OFF. This lab has no `#labpreview` route and is member-only, so it was reached as a member would: Home → OPEN LABS → EXPLORE FUNDAMENTALS → Signal → "Signal Chain Builder" tile (dev-web member toggle set in my own Chrome tab; see G2_PROGRESS.md). The lab is ONE screen with two tabs (LEARN, EXPLORE). Everything that appears between tapping the tile and using the rack is part of the beginner's first minute, so it is recorded too.

---

## Page 0: the arrival sequence (what stands between the tile and the lab)

Tapping the tile produced, in order, on a first visit:
1. A full page "UNDERSTANDING LEVEL & AMPLITUDE — THE ACADEMY GLOBAL METHODOLOGY" ("Before using our audio visualizers, learn the color language…"): colour scale, six example views, a LEARNING CONVENTION note, "BLUE = LESS / RED = MORE", a 3-question CHECK YOURSELF, then UNDERSTOOD — CONTINUE. (This is the shared Amplitude orientation; G1 audits it as its own lab. Here it is a gate.)
2. A glossary term card "Signal Chain (Signal Path)" ("The signal chain is the route audio takes - mic, preamp, processing, mixer, output…") with CONTINUE.
3. The SOUND SAFETY WARNING (long; scroll to reach KEEP SOUND OFF). I chose KEEP SOUND OFF.
4. The lab intro card (WHAT YOU'RE LEARNING / WHERE TO START).

| Field | Finding |
|---|---|
| Overwhelm | 4 before the lab even shows. Four interruptions in a row, each with its own button, for a student who tapped "Signal Chain Builder". |
| What works | Each item on its own is good: the colour rule is useful and short to check; the term card is the clearest one-paragraph definition of a signal chain in the app; the safety warning lets you keep sound off. |
| Suggestions | 1. (M, SHARED) Sequence and merge first-visit popups: show at most ONE before the lab (e.g. the term card), and let the colour orientation and the intro card come as the first two steps INSIDE the lab or as a single combined card. 2. (S, SHARED) Tell the student why the colour page appeared ("One-time: 1 minute on how our meters use colour, then your lab opens"). 3. (S, SHARED) Put KEEP SOUND OFF and ENABLE SOUND both visible without scrolling the warning. |

## Page: Signal Chain Builder · EXPLORE tab (the screen the lab opens on)

| Field | Finding |
|---|---|
| First look | A dark rack with nine hardware-looking units in a snake path (EQ, COMP, GATE / DIST, MOD, DELAY / REVERB, STEREO, LIMIT), each labelled "bypassed", SRC on the left, OUT on the right, cables between them. Above it, two tabs LEARN (green) and EXPLORE (gold, selected). Thinks: "a guitar pedalboard / effects rack". A good, concrete picture. |
| Overwhelm | 3. Nine units, readouts SRC ("CLICK 90", label dropped) / CHAIN 0/9 / SCENE — / OUT IDLE, a caption "MODULES RUN LAB-DEFAULT SETTINGS — GR METERS MEASURED, LIVE", header icons "?", "ⓘ" and "▶", dock MODULES / SCENARIO / SOURCE. |
| Knows what it is learning? | Partly. Subtitle "Effects interact". Intro card: "Why order matters in a signal chain: each unit works on what the one before hands it, so one switch changes what every later unit does." Clear sentence; but EQ, COMP, GATE, DIST, MOD, LIMIT are all abbreviations of things a beginner has never met. |
| Knows what to do first? | Partly. Card: "Tap SCENARIO → ⟲ CLEAR CHAIN, set SOURCE to SINE 220 and tap ▶. Put LIMIT in through MODULES and read its GR. Then add DIST and watch that GR jump." Did it: MODULES tray → LIMIT and DIST lit up in the rack with their settings ("drive +12 dB", "low ceiling −25 dB"); CHAIN 2/9, SCENE CUSTOM. Tapped ▶: nothing visible happened — OUT stayed IDLE, no GR number, no message. With sound OFF, the lesson's key feedback (GR jumping) never appears, and the page does not say why. (On the web harness; on a phone with sound off the same is expected; needs sound to confirm the GR reading.) |
| Words they would not know | EQ, COMP, GATE, DIST, MOD, DELAY, REVERB, STEREO, LIMIT (all as abbreviations), SRC, GR, gain reduction, bypassed, drive, ceiling, "SINE 220", "CLICK 90", "PINK", "patched at the rear", "one lane = the stereo pair". |
| Follows / continues? | Partly. SCENARIO tray: EQ BOOST → COMP, DELAY → REVERB, GATE THE CLICK, HOT INTO LIMITER, FULL CHAIN, ⟲ CLEAR CHAIN. Picking HOT INTO LIMITER lit EQ, COMP, LIMIT and showed a description under the buttons (below a "more ↓", so off-screen at first): "The +9 dB boost runs hot down the chain — watch BOTH meters share the work…". The SCENE readout then reads "SQUASH", not "HOT INTO LIMITER" (the screen guide explains the short name, the page does not). Without sound, a beginner can toggle units and read the rack, but cannot see the interaction the lab is about. |
| Header icons | "?" opens the app-wide HELP (FAQ: accounts, Guest Mode, membership…), not lab help; "ⓘ" opens the lab's screen guide. Two help icons side by side with very different content. |
| What works | (1) The rack picture: real-looking units in signal order, lit when in, dark when bypassed — "in or out" is understood instantly. (2) Each lit unit shows its setting in words under it. (3) Scenarios name real interactions ("EQ BOOST → COMP", "GATE THE CLICK"). (4) The term card on arrival. (5) Honest notes ("this rack runs COMP before GATE, while on a real console you would…"). |
| Suggestions | 1. (M) When sound is off (or ▶ is pressed with sound off), show the GR the chain WOULD produce, or at least a line "Sound is off — turn it on to see GR move", so the main lesson is not silent and invisible. 2. (S) Spell the units under the abbreviation the first time (EQ "tone", COMP "evens loudness", GATE "cuts quiet bits", DIST "distortion", MOD "chorus/flanger", LIMIT "ceiling"). 3. (S) Make the SCENE readout use the scenario's button name (HOT INTO LIMITER), or rename the button SQUASH. 4. (S) Show the scenario description ABOVE the buttons (or scroll to it) so a tap gives visible feedback. 5. (S) Open on the LEARN tab for a first visit, or make EXPLORE's intro card say "New? Read LEARN first". 6. (S, SHARED) Distinguish "?" (app help) from "ⓘ" (this screen) — label them or drop "?" from lab headers. 7. (S) Keep the SRC readout label. SHARED. |
| Hobbyist | Knows the effect names; this is a playground for them, IF sound is on. The fixed-order note will interest them. |

## Page: Signal Chain Builder · LEARN tab

| Field | Finding |
|---|---|
| First look | A text page: "What this lab teaches — definitions, common mistakes, pro tips, and the formula." then a long paragraph, WHAT YOU WILL UNDERSTAND (4 bullets), CONTROLS, GUIDED STEPS. Its own intro card appears on first visit. |
| Overwhelm | 3 (all text, long). |
| Knows what it is learning? | Yes. Card: "The words and ideas behind a processing chain: bypass, chain order, gain staging and gain reduction, and the ordering mistakes engineers most often make." The WHAT YOU WILL UNDERSTAND list is clear ("Why each stage's output is the next stage's input…", "Why the limiter goes last, and why most engineers gate before they compress", "What gain reduction (GR) tells you…"). |
| Knows what to do first? | Yes: "Scroll from the top and read CONTROLS, then COMMON MISTAKES. Then switch to EXPLORE and try one ordering mistake on the live rack." |
| Words they would not know | gain staging, gain reduction (defined in CONTROLS: "how many dB a lit COMP, GATE or LIMIT is turning the signal down"), bypass (defined), "the formula". |
| Follows / continues? | Yes; the GUIDED STEPS are numbered. |
| What works | (1) Definitions in plain words in CONTROLS (GR, gain staging, bypass). (2) A clear hand-off to EXPLORE. |
| Suggestions | 1. (S) Put the 9 unit names with one-line meanings at the top of LEARN (a glossary strip), since EXPLORE uses only abbreviations. 2. (S) Make LEARN the default first tab for a first-time visitor. |
| Hobbyist | Will skip to EXPLORE. |

---

## SignalChainLab — overall verdict

The beginner's journey: the rack picture is excellent and instantly says "effects in a row, on or off". But the first minute is four popups deep (colour orientation, term card, sound safety, intro card), the lab opens on EXPLORE instead of LEARN, and the core feedback (gain reduction numbers moving as units change) only exists while sound plays. With sound off, a beginner can toggle units and read their settings, then presses ▶ and sees nothing, with no explanation. The unit names are all abbreviations, and the SCENE readout calls the scenario by a different name than its button.

**3 biggest orientation problems**
1. Sound-off dead end: ▶ does nothing visible and GR never appears; nothing tells the student why.
2. Four stacked first-visit interruptions before the lab is usable (SHARED).
3. Abbreviated unit names (EQ, COMP, GATE, DIST, MOD, LIMIT, SRC, GR) on the rack with no gloss, and the lab opens on EXPLORE rather than LEARN.

**3 best things**
1. The realistic rack with lit/dark units and settings printed under each.
2. Named scenarios that demonstrate one real interaction each.
3. The "Signal Chain (Signal Path)" term card and LEARN's plain definitions of GR, bypass and gain staging.

**"First 30 seconds" rewrite**
"Sound goes through these boxes left to right, like guitar pedals. Each box changes what the next one receives. Turn on DIST (distortion) and LIMIT (a loudness ceiling) and watch how much the limiter has to push down." With sound off: show the GR number anyway, labelled "what the limiter would do".
