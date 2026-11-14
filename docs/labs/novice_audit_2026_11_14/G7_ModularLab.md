# G7 · ModularLab (Modular Synth Lab) — beginner orientation audit

Walked 2026-11-14 at 390 x 844, sound OFF. Preview: `http://localhost:8142/#labpreview/ModularLab`.
LabShell frame (F1–F8 in `G7_OscillatorLab.md`), same three-popup stack (term "Modular synthesizer" → Sound Safety → intro). Pages: EXPLORE, LEARN, CHECK, WHAT'S LEFT (same end page as FmLab — judged there; not repeated). Sound-dependent parts (drone, ACID BASS sequence, tremolo) judged visually only.

## Page 1 · EXPLORE tab · `#labpreview/ModularLab`

| Field | Finding |
|---|---|
| First look | A photo-real black Eurorack case with dozens of tiny knobs and jacks, red step lights on the left, and two curved cables (green and amber). Thinks: "a real synth! …but which bit do I touch?" Strong "wow", immediately followed by "I can't read any of this". |
| Overwhelm | 4 — subtitle is six acronyms ("VCO · VCF · VCA · LFO · Envelope · Sequencer"); the case labels (OFS 1, OFS 2, CV1, CV2, V/OCT, MAN, GATE, LVL, A D S R) are printed very small at phone width (roughly 6–7 pt by eye — I did not measure); readout strip PATCH / VCO / RES / LFO / SEQ; fader + 5-key dock (CUTOFF / PATCH / VCO / MOD / SEQ). The lower third of the case is an empty dark area where the cables hang. |
| Knows what it is learning? | Partly. Term card: "A modular synth is built from separate boxes you wire together. Patch cables decide how the sound flows…" — good. Intro: "How a subtractive synth voice works: the VCO makes a bright wave, the VCF carves harmonics away, the VCA sets loudness, and control cables decide what moves what." — "subtractive", VCO/VCF/VCA each get a 3-word gloss, which helps. |
| Knows what to do first? | Yes if the intro is read: "Tap ▶ to hear the drone, then drag CUTOFF down… Next tap PATCH → WOBBLE and watch a blue LFO cable run to the VCF." Without sound, the WOBBLE step is the one that works visually: a new BLUE cable appears from LFO to VCF, LFO readout says "→CUT", and the tray says "LFO → cutoff: the filter sweeps rhythmically while pitch holds still — movement without melody." Excellent cause → visible effect. |
| Words they would not know | VCO / VCF / VCA / LFO (acronyms — glossed only in the intro card and in each module's tap sheet) · CV / control voltage · Eurorack · OFS · V/OCT · GATE · MAN · ADSR · RES / resonance · CUTOFF · low-pass · subtractive · ORG·OFF (MOD key shows this — unclear) · semitones · saturation · "dB re" in THE VOICE, AS SOUND · soft saturation. |
| Follows / continues? | Yes for PATCH ideas (five named recipes with one-line meaning each). Tapping a module opens a "what this does" sheet ("VCF — The voltage-controlled filter, a low-pass. Lowering CUTOFF removes harmonics from the top, so the tone darkens…") with LEARN MORE — very good, but nothing on screen says modules are tappable except one sentence deep in LAB NOTES ("Tap any module for what it does"). Would get lost in LAB NOTES "READING THE CASE" (a 150-word paragraph of jack names). |
| What works | Real-looking case = strong reason to care. Colour-coded cables per source (SEQ red, LFO blue, ENV green, audio amber) with the module name underlined in the same colour. Patches as named recipes. Module tap-sheets. THE VOICE, AS SOUND bar graph (amber passes / gray removed) lets a silent learner SEE the filter. |
| Suggestions | 1. (L) First-visit "tour": highlight the four audio-path modules one at a time with a 1-line label ("VCO — makes the tone", "VCF — darkens it", "VCA — sets loudness", "OUT") and say "tap any box to learn more". Turns the wall of knobs into four boxes. 2. (M) Put plain names under the acronyms on the case for beginners (a "names" toggle: VCO → "tone", VCF → "filter", VCA → "volume", LFO → "wobbler", ENV → "shape"). 3. (M) Move THE VOICE, AS SOUND (the bar graph) up into the display (e.g. a swipe/second view), or into FULL SCREEN; it is the clearest sound-off picture of what CUTOFF does and it is buried in LAB NOTES. 4. (S) Use the empty lower part of the case for a one-line caption of the current patch ("WOBBLE: LFO is moving the filter"). 5. (S) Rename MOD readout "ORG·OFF" to words ("Env: organ · LFO: off"). 6. (S) Subtitle as a sentence: "Wire boxes together to build a synth sound". |
| Hobbyist | Will love it; the patch ideas map to real genres (acid, dubstep wobble). May want to drag cables themselves (this lab routes via menus). |

## Page 2 · LEARN tab

| Field | Finding |
|---|---|
| First look | Paragraph "You met wave shapes in Oscillators; here one becomes a full synth voice. Sound travels along the amber cables…". |
| Overwhelm | 3 — 13 CONTROLS entries (each module + each patch) before GUIDED STEPS. |
| Knows what it is learning? | Yes — the paragraph is plain and links to the earlier lab. "SEQ, LFO and ENV make no sound. Their colored cables carry control voltage (CV), a signal that turns another module's setting for you." — the single most important sentence for a beginner, and it's well written. |
| Knows what to do first? | Yes — GUIDED STEP 1 "Tap PATCH → RAW DRONE, then ▶. Follow the amber cables…". |
| Words they would not know | low-pass (used before it is explained), semitones, saturation, retrigger, honk/squelch (fine, descriptive). |
| Follows / continues? | Yes; GUIDED STEP 2 (SINE vs SAW through the filter) is a great "aha": a filter can only remove what is there. |
| What works | Paragraph; "WHY" lines; each patch explained as one routing. |
| Suggestions | 1. (M) Put GUIDED STEPS before the long CONTROLS list (CONTROLS is reference; steps are the lesson). 2. (S) Define "low-pass" in its first use in WHAT YOU WILL UNDERSTAND ("a low-pass filter — lets lows through, cuts highs"). |
| Hobbyist | Very good, especially "LFO didn't change, only its destination did". |

## Page 3 · CHECK tab (4 questions)

| Field | Finding |
|---|---|
| First look | Q1 "You sweep the filter CUTOFF on a SINE wave and the tone barely changes. Why?" |
| Overwhelm | 2. |
| Knows what it is learning? | Yes. |
| Knows what to do first? | Yes. |
| Words they would not know | low-pass, LFO, VCO/VCF/VCA (Q4 spells them out — good). |
| Follows / continues? | Yes, ends with FINISH · SEE WHAT'S LEFT ›. |
| What works | Questions are about ideas the lab shows (filter needs harmonics; LFO destination; envelope → filter; signal order). Q4 answers include plain names in brackets. |
| Suggestions | 1. (S, SHARED F8). |
| Hobbyist | Easy, but a good recap. |

## Lab verdict — ModularLab

**Beginner's journey:** The realistic case makes them want to play, and the colour-coded cables and named patches give them something safe to tap. Choosing WOBBLE and watching a blue cable snake from LFO to the filter is a satisfying, sound-free "I see what happened". But the case itself is a wall of tiny acronyms with no first-visit tour, the fact that modules are tappable is hidden in a paragraph, and the best silent picture (the filter bar graph) sits deep in LAB NOTES.

**3 biggest orientation problems**
1. Acronym wall on the case and subtitle, tiny labels at phone width, no guided tour.
2. Module tap-sheets exist but nothing on screen invites a tap.
3. The sound-off picture of the filter (THE VOICE, AS SOUND) is buried below the fold.

**3 best things**
1. Colour-coded cables that appear/move when a patch changes.
2. Named patch recipes with one-line meanings.
3. LEARN's "SEQ, LFO and ENV make no sound… CV turns another module's setting for you."

**First 30 seconds rewrite:** "This is a synth built from boxes. Sound flows along the amber cable: TONE (VCO) → FILTER (VCF) → VOLUME (VCA) → OUT. The coloured cables don't carry sound — they turn knobs for you. Tap PATCH → WOBBLE and watch a blue cable appear." With a pulsing outline on each of the four audio boxes in turn, and "tap a box to learn it" under the case.

## Second pass · WHAT'S LEFT page (FINISH · SEE WHAT'S LEFT › in EXPLORE's LAB NOTES and on CHECK)
Walked on screen: "Where you are · WHAT'S LEFT · Only the check is left before this lab counts toward your credit." One row (Understanding check — "The CHECK tab at the top of this lab — every answer correct, retry until you are."), PRACTICE AGAIN FROM THE START, DONE · BACK TO LABS, DISCUSS THIS LAB ›. Same component and same findings as FmLab's page 4 (an intro popup on a one-row page; "jump straight to any of them" with one row; no "what you learned" line). Note: on a fresh page load the Sound Safety warning appeared again in this preview, although it says "This warning appears once".
Page count for this lab: EXPLORE, LEARN, CHECK, WHAT'S LEFT = 4.
