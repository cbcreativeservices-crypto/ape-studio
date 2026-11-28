# G4 · Beginning Mixing Lab (BeginningMixingLab) — beginner orientation audit

Auditor G4 · 2026-11-14 · web preview `http://localhost:8142/#mixinglabpreview` (the `#labpreview/BeginningMixingLab` name is not registered in the harness; `#mixinglabpreview` is), phone size 390 x 844, member, intro cards unseen, SOUND OFF throughout.
Method per page: clean open and first look, every word on screen plus intro card, try the controls, then the page's guide (`beginningMixingScreenGuides.ts`) and code to compare intent with what a beginner got.
Note on the preview: `#mixinglabpreview` is a ToolPreview path, so the first-open glossary popup (LabTermIntroHost) that the `#labpreview/...` path mounts does NOT appear here; if the real app shows one on entry, it adds a fourth layer to the overlay stack described on page 1.

---

## Page 1 · What Mixing Does · `#mixinglabpreview` (page 1/16)

| Field | Finding |
|---|---|
| First look | Not the page: a full-height popup, "Knowing When to Bring In a Pro", five long paragraphs of reading with one GOT IT button. The newcomer thinks this is a disclaimer or a sales message ("should I hire someone instead?"). After GOT IT, about one second later, the intro card (WHAT YOU'RE LEARNING / WHERE TO START) arrives, and a "New: tap ⓘ to have this screen explained" tooltip sits under the ⓘ. Only then the page: eye lands on the gold-bordered MIXER'S MANTRA box. |
| Overwhelm | 3. Three layers before the first tap (pro popup, intro card, ⓘ tooltip). The page itself is calm and well spaced; the mix picture further down is dense (8 colored capsules, a Hz scale, numbers with no unit, four-part key). |
| Knows what it is learning? | Partly. "Mixing is a sequence of listening decisions" is clear, and the five dimension buttons say what mixing changes. But the same sentence appears twice in a row (grey lede line under ACCURACY, then again inside THE MIXER'S MANTRA box), which reads like a glitch. |
| Knows what to do first? | Partly. Intro card says "tap each of THE FIVE DIMENSIONS", which is right and easy. Risk: the intro card arrives late (about 1 s after GOT IT on the pro popup); my tap aimed at Balance landed on the card's "EXPLAIN THIS SCREEN" instead and opened the 5-step guide. A beginner would have the same mis-tap and be thrown into a long guide. |
| Words they would not know | "plugins" (mantra line 2), "ACCURACY" chip (what is accurate?), "fader" ("Before one fader moves"), "Hz", "10k/5k/2k", "L C R", KICK/SNARE/PERC/BASS/GTR/KEYS/LEAD/BGV (BGV and PERC especially; the guide explains BGV only inside ⓘ), the numbers −2, −4, −10 next to each track (no unit; they are dB levels), "reverb" in GLOW = REVERB, "BARS 1–2", "focal point". |
| Follows / continues? | Yes. Each dimension opens a one-line question ("What is louder or softer?"), the focal-point pick explains itself ("There is no single correct choice — a mix fails only when nobody made one"), and a wrong check answer says why ("the cause is not level"). Goal chips turn ✓. NEXT: PREPARE THE SESSION › at the foot is clear. Where they might quit: the pro popup (a wall of text before anything to do). |
| What works | Five big dimension buttons, each giving one plain question; the wrong-answer explanation in the check; "There is no single correct choice" on the focal point; goal chips at the foot as a mini to-do list; the clear "NEXT: PREPARE THE SESSION ›" button. MOVEMENT switching the picture to the chorus is a good "something happened" moment. |
| Suggestions | 1. (M, SHARED-ish) Do not open the "bring in a pro" note on first arrival; keep it as the "When to bring in a pro ›" link (already there) or show it at the END of the lab. If it must show first, cut it to 2-3 sentences. 2. (S) Remove the duplicated mantra sentence: keep it once, inside THE MIXER'S MANTRA box. 3. (S, SHARED) Make the intro card wait for the previous popup to finish closing and ignore taps for ~300 ms after it appears, so a tap meant for the page does not open the guide. 4. (S) Under the mix picture key, add a one-line "how to read" in words before the symbol key: "Each colored bar is one instrument. Higher = higher-pitched. Left/right = which speaker. Wider = louder. The numbers are each track's volume in dB (0 = loudest)." and spell out the short names once (BGV = backing vocals, PERC = percussion, GTR = guitar). 5. (S) Give each dimension's one-line question an everyday example ("Balance: is the singer loud enough over the drums?"). 6. (S) Explain the ACCURACY chip or move it under ⓘ; on page 1 it is the first gold thing the eye meets after the title and it says nothing to a beginner. |
| Hobbyist | Likes the five-dimension framing and the "decisions not plugins" line. The pro popup reads as a brush-off to someone who already mixes at home. |

Addendum p1: the ACCURACY chip opens "LEARN HERE — MEASURE WITH THE RIGHT TOOL" (calibrated SPL meters, RTA/RT60, "Light → a dedicated light meter"). In a concept lab about mixing decisions this is off-topic and confusing ("why is a light meter in a mixing lesson?"). It is on every page of this lab. Suggestion 6 above becomes: (S, SHARED) drop the ACCURACY chip from concept labs like this one, or replace it with a mixing-specific note.

---

## Page 2 · Prepare the Session · page 2/16

| Field | Finding |
|---|---|
| First look | Intro card, then the bold lede "Mixing starts before mixing." and a tall list of seven outlined buttons (THE PREP CHECKLIST). Reads as a checklist page, which is right. |
| Overwhelm | 2. One idea (get organized), one control type (tap a step). The drawing is a tidy fake session window. |
| Knows what it is learning? | Yes: "prepare before you mix". The lede and the card lines are plain ("You cannot mix what you cannot find"). |
| Knows what to do first? | Yes: tap Name, order, color (intro says so). Right first tap. |
| Words they would not know | "plugins", "ORGANIZATIONAL" (fine), "Clip gain", "fader", "Polarity, phase, timing" (and "multi-mic pairs", "phase fight"), "headroom", "Peaks … below zero" (zero of what?), "references" / "matched loudness", "Ø" in the drawing, "MASTER −0.2" / "−6", "DAW" (only in the ⓘ guide), "Mastering" in SEPARATE THE JOBS. Polarity/phase is the hardest: one line, no picture. |
| Follows / continues? | Yes. All seven open with one line each; the check gives a real reason when wrong ("Mastering … cannot reach one vocal clip inside your session"). Where it slips: the intro says "watch the session window tidy itself", but the window is drawn BELOW all seven buttons (top of the window at ~y 900 on an 844-tall phone with the cards open). The learner taps a card and sees nothing change; the before/after is off screen. |
| What works | One-line "why" under each step; the fake session with Audio_07 / gtr_take4_FINAL / cough clip is funny and real; "SEPARATE THE JOBS" is a strong orientation paragraph (which job am I doing?); the quiet-verse check ties to Clip gain directly. |
| Suggestions | 1. (M) Put the session window ABOVE the checklist (or pin it) so each tap visibly tidies it; at minimum add "↓ watch the session below change" after the first tap. 2. (S) Explain "clip gain" in its line in plain words: "turn up the quiet recording itself, before any slider". 3. (S) Give "Polarity, phase, timing" an everyday line ("two mics on one drum can cancel each other and sound thin; check this now") and define headroom where it appears ("space left before the loudest point, where it starts to distort"). 4. (S) In SEPARATE THE JOBS, set the five jobs as a short list instead of one paragraph. |
| Hobbyist | Useful and real; may skim. Would want "Polarity, phase, timing" to show what a phase problem looks like on a waveform. |


---

## Page 3 · Basic Signal Flow · page 3/16

| Field | Finding |
|---|---|
| First look | A long gray lede ("One path, most mixers, most DAWs…") then a stack of eight cards in shuffled order (THE EIGHT STATIONS — STUDY THEM (ORDER HIDDEN)). The eye reads it as a glossary to memorise. |
| Overwhelm | 3. Eight new terms at once (BUS / SUBGROUP, MIX BUS, CLIP GAIN, INSERTS, FADER / PAN, OUTPUT, SOURCE, SENDS), each with a one-line definition, then a puzzle using all eight. That is the opposite of "one new idea at a time". |
| Knows what it is learning? | Partly: "the order audio travels through". They do not yet know why order matters (no example of what goes wrong if it is wrong). |
| Knows what to do first? | Partly. The intro says read the cards, then tap in order. A beginner has no way to reason out "INSERTS before FADER" or "SENDS after FADER" from the one-liners; it becomes guessing. |
| Words they would not know | DAWs (lede), desks, BUS, SUBGROUP, "summed", MIX BUS, CLIP GAIN, INSERTS ("Processors in the path"), FADER, PAN, "stereo position", SENDS ("tapped after the fader by default (the pre-fader exception comes later)"), "monitored", EQ / COMP in the drawing, L / R. |
| Follows / continues? | Yes, with effort. Feedback arrives only after all 8 taps; one wrong tap means RESET and eight more taps. The "Not yet" line is good and specific ("FADER / PAN comes AFTER CLIP GAIN. (Level of the clip itself, before everything.)"). The solved drawing (numbered gear: waveform → EQ/COMP → knob and fader → speakers) is excellent and is the first time the words get pictures; it only shows after solving. A beginner who guesses wrong twice may quit here. |
| What works | The solved path drawing with gear icons; the specific "Not yet" line; the running "SOURCE → CLIP GAIN → …" text as you tap; "Say it until it is boring." |
| Suggestions | 1. (M) Show the gear drawing from the start with empty numbered slots that fill as you tap, so the words have pictures while you study. 2. (M) Check each tap as it is made (or after each pair) instead of only after eight; a wrong tap could shake and say why, without wiping the others. 3. (S) Give the learner an anchor: start with SOURCE already placed and OUTPUT already at the end, so they order six, not eight. 4. (S) Add one "why order matters" line before the puzzle: "If the volume slider came before the EQ, turning the singer down would also change how hard the EQ works." 5. (S) Move "(the pre-fader exception comes later)" out of the SENDS card; it is a forward reference that adds load now. |
| Hobbyist | Fine and quick; knows most of it. Would like the drawing to mark where a send leaves the path relative to the fader. |

---

## Page 4 · Gain Staging · page 4/16

| Field | Finding |
|---|---|
| First look | Bold lede "Healthy levels are not about one magic number…", then a box of five colored LED meters; the eye goes to the red dot and "+6.0 CLIPPED" on the third meter. Thinks: "this page is about meters going into the red". Right. |
| Overwhelm | 3. The WHY HEADROOM paragraph is dense ("Digital zero is a hard ceiling at the output and in a fixed-point file … Eight tracks each 'safely' hot leave a mix bus with nowhere to live"), and the meter box has its own key (BAR = PEAK · TICK = RMS). |
| Knows what it is learning? | Partly. "Peaks gang up" is clear from the meters (−6, 0.0, +6.0 CLIPPED reads like a story). The second half (loudness fools you, match levels) needs sound. |
| Knows what to do first? | Yes: press ▶ MIX A. With sound off the SOUND SAFETY WARNING opens (a long, frightening legal wall of text). After KEEP SOUND OFF, nothing happens and nothing says why: MIX A still reads "PLAY IT", no vote buttons appear. The page cannot be finished without sound and does not tell you so. |
| Words they would not know | HEADROOM (defined in the lede, good), "Digital zero", "fixed-point file", "clipped", "dB", "0.0 dB", "mix bus", "PEAK METERS · dBFS", "PEAK", "RMS", "BLIND", "master fader" (check). |
| Follows / continues? | With sound: probably. Without sound: stuck at the vote; can still answer the check (the check's explanation is excellent: "−0.2 dBFS leaves 0.2 dB of headroom. Any hotter moment clips."). Also: the caption under the meters ALREADY says "B's bar sits 3 dB higher with nothing else changed" before the learner votes blind, which spoils the experiment the intro card sets up ("vote before you look at any numbers"). |
| What works | The three-meter story (1 track → 2 at once → 4 at once CLIPPED) is the clearest picture of "peaks add" I have seen; the check's honest answer; the idea of a blind vote then a matched reveal. |
| Suggestions | 1. (S) Hide the "B's bar sits 3 dB higher" sentence until after the vote; the blind test is the lesson. 2. (S, SHARED) When sound is off and a ▶ is pressed, show an inline line on the button row ("Sound is off. This step needs listening; turn sound on in …, or skip: NEXT still works.") instead of silence. 3. (S) Turn the WHY HEADROOM paragraph into three short lines matched to the three meters ("One track peaks at −6. Two together reach 0, the ceiling. Four together go past it and distort."). 4. (S) Say what RMS is in the key ("TICK = average loudness") and what "dBFS" is ("0 = the loudest a digital file can hold"). |
| Hobbyist | Learns something real from the matched-loudness reveal (if they can hear it). Knows the ceiling idea already; the "peaks gang up" meters are still a good reminder. |

---

## Page 5 · Build a Static Mix · page 5/16

| Field | Finding |
|---|---|
| First look | Bold lede, then two play buttons (▶ THE WALL, ▶ MY MIX), then eight small track buttons, then a mix picture with all eight colored bars piled on top of each other in the center, then a mixing console that runs off the right edge. Thinks: "now I actually mix". Motivating, but a lot. |
| Overwhelm | 4. Three numbered steps, eight anchor buttons, a picture, and an eight-channel console with Ø, PAN knob, MUTE, a 12-mark fader scale and a name tape per channel. On a 390-wide phone three channels show; the channel NAME tape sits under the fader, below the fold, so while you look at the top of a fader you cannot see which instrument it is. |
| Knows what it is learning? | Partly: "start with balance". The lede's "faders, pan, mute, polarity" is four jargon words in a row. |
| Knows what to do first? | Partly. STEP 1 is "▶ THE WALL" (needs sound; with sound off nothing happens after KEEP SOUND OFF). STEP 2 is clear: the page remembers the page-1 focal point ("Your focal point was 'Lead vocal' — that suggests LEAD") — lovely continuity. STEP 3 "pull the other faders down" is right, but the anchor (LEAD) is channel 7 of 8, off screen to the right. |
| Words they would not know | faders, pan, mute, polarity (lede), "plugin", "processor", "anchor" (explained by use), Ø (polarity flip, no label on the strip), PAN, L/C/R, MUTE, the fader scale "+12 … ∞" (what is ∞ on a volume slider?), "0 dB", "level-matched", "solo" (tap the tape: hidden gesture, only in ⓘ). |
| Follows / continues? | Partly. Pressing ▼ on a fader works and the picture retitles from THE WALL · EVERY FADER AT 0 to YOUR BALANCE: good feedback. But the stacked picture at the start is unreadable (eight bars on one spot), so the first few moves show little. Two of four goal chips (Hear the unmixed wall, Compare against the wall) need sound. |
| What works | Carrying the page-1 focal point into an anchor suggestion; ANCHOR: LEAD ring in the picture; "every track at the same level is not a mix — it is a wall"; the CHECK IT LIKE A MIXER habits (compare to the start, listen quietly). |
| Suggestions | 1. (M) Put the anchor channel first (or scroll the console to it when chosen), and put the name above each fader, not under it. 2. (M) Start with fewer controls: show only faders on this page (pan, mute, Ø come on page 7/later), or hide Ø/PAN behind "more". 3. (S) Label Ø on the strip ("Ø flip") and replace "∞" with "off" at the bottom of the fader scale. 4. (S) Add a one-line first move under STEP 3: "Try it: pull KICK down to −6 and watch its bar get narrower in the picture." 5. (S) Say "tap a name to hear it alone (solo)" on the strip. |
| Hobbyist | Enjoys this. Would want real faders that drag (stepping by ▲▼ is slow) and a quick way to jump to a channel. |

---

## Page 6 · Subtractive Mixing · page 6/16

| Field | Finding |
|---|---|
| First look | A long bold lede (three sentences, ending "for example, level on balance, frequency on frequency, space on depth, automation on movement"), then six outlined buttons. Thinks: "a list of rules". |
| Overwhelm | 3. The idea is simple ("take away instead of adding"), but the same six button labels appear TWICE: once as SIX WAYS TO SUBTRACT (they open a one-line idea) and again under the CROWDED CHORUS picture (they change the picture). Easy to tap the wrong set and wonder why the picture did not move. |
| Knows what it is learning? | Yes, after the scenario text: "the lead feels buried; what can you take away?" The scenario is the best part. |
| Knows what to do first? | Partly. The intro card says "Read SIX WAYS… then, under the picture, tap each move". A beginner taps the first set (top of screen) and gets text only. |
| Words they would not know | "sustain", "backing pad", "smeared", "EQ" / "Subtractive EQ" / "additive EQ" (THE HONEST CORRECTION), "plugin", "bypass", "Automation subtraction" (automation not taught until page 13), "Frequency subtraction" (no picture of what a cut is yet; EQ is page 8). |
| Follows / continues? | Yes. Each move redraws the picture with a verdict: Arrangement "Muting one sustaining layer … often the single strongest move"; Processing "NOTHING CHANGES HERE … this smear is arrangement and balance, not processing". That honest "this move does not fit" feedback is excellent. The check (vocal raised twice → lower what competes) ties it together. No sound needed: the whole page works silent. |
| What works | The scenario framing (a real symptom, then six candidate moves with verdicts); "NOTHING CHANGES HERE" as feedback; several right answers allowed. |
| Suggestions | 1. (S) Merge the two sets: one set of six buttons under the picture, each showing its one-line idea AND changing the picture. If both stay, name them differently ("Read: six ways" vs "Try it on the chorus"). 2. (S) Shorten the lede to one sentence: "When a mix feels crowded, ask what you can take away before you add anything." 3. (S) Mark the moves that use tools taught later ("EQ — page 8", "Automation — page 13") so the beginner knows it is OK not to know them yet. 4. (S) THE HONEST CORRECTION card speaks to people who already have an EQ opinion; for a beginner, move it under ⓘ or to page 8. |
| Hobbyist | The verdicts are the value; "NOTHING CHANGES HERE" for processing is a useful slap. THE HONEST CORRECTION lands well for them. |

---

## Page 7 · Panning & Stereo Placement · page 7/16

| Field | Finding |
|---|---|
| First look | Bold lede ("The stereo field is real estate…"), then the mix picture with all eight bars piled in the center again, then a row of knobs. Thinks: "turn knobs to move things left and right". Right. |
| Overwhelm | 2. Only PAN and MUTE on the strips here (no faders): calmer than page 5. |
| Knows what it is learning? | Yes: left/right placement; "keep the spine at center" is memorable. |
| Knows what to do first? | Partly. Intro says "Pan GTR left and KEYS right", but GTR and KEYS are channels 5 and 6, off screen; the visible channels are KICK, SNARE, PERC, which are the ones you should NOT move much. How to turn a knob on a phone is not said on screen (tap the left/right half; double-tap = center is only in ⓘ). |
| Words they would not know | "stereo field", "spine", "Pan", "mono" / "MONO FOLD" / "fold", "level-matched", "load-bearing", "image tilts" (check), "pan pot" (check), L25 / R25 readouts, "focal element". |
| Follows / continues? | Mostly. A tap on the right half of a knob gives R25 and the bar slides: good feedback. Trap: two quick taps on the same half read as a double-tap and snap the knob back to C, so a beginner trying to go further left sees it jump back to center and thinks it is broken (seen: two fast taps → C; two slow taps → L50 plus the warning). The KICK warning ("low frequencies far off-center unbalance the sides…") is clear and well timed. THE MONO TEST needs sound; with sound off "Hear the mono fold" cannot be done, though the picture still folds (the ⓘ says it follows the button). |
| What works | The live warning line when you pan the spine; "Convention, not law — but a strong default"; mirror placement (guitar left, keys right) as a concrete first move; real-world reason for mono ("Clubs, phones, corridor speakers"). |
| Suggestions | 1. (S) Start the console scrolled so GTR and KEYS are visible, or order the channels so the supporting parts come first on this page. 2. (S) Under the knobs: "Tap the left or right side of a knob to turn it. Double-tap to re-center." 3. (M) Make repeated taps step further (only a long-press or a dedicated "C" button re-centers), or slow the double-tap window. 4. (S) Define mono in the MONO TEST line: "mono = everything from one speaker; left and right are added together". |
| Hobbyist | Good rule-of-thumb page. Knob stepping in 25s is coarse; they would want drag. |

---

## Page 8 · Basic EQ in Context · page 8/16

| Field | Finding |
|---|---|
| First look | Bold lede "This is the FREQUENCY dimension at mix scale…", then one ▶ THE CLASH button and five ▶ fix buttons, then the mix picture with "+4" on GTR. Thinks: "a listening test". Right, but it is a sound-only page. |
| Overwhelm | 3. Six play buttons, a picture, a dense habits paragraph ("shelves, Q, dynamic EQ") and a check. |
| Knows what it is learning? | Partly: "guitar and singer fight; there are several fixes". What EQ IS is never said in plain words on this page (it assumes you know). |
| Knows what to do first? | Yes: ▶ THE CLASH. With sound off: the SOUND SAFETY WARNING opens AGAIN (it opened on page 4 too, and says "This warning appears once"). After KEEP SOUND OFF the picture does switch (▶ EQ shows FIX: EQ with a GTR EQ curve and "WHERE THE LEAD PLAYS"; ▶ LEVEL shows −3 on GTR), but the trade-off sentence under the picture stays "Audition a fix to see its trade-off." The words that teach the trade-offs only appear after audio plays, so a silent learner never reads them. |
| Words they would not know | EQ (never defined here), "stabs", "lead line", "centered", "level-matched", "Audition", "FILTER" (a high-pass, explained only in ⓘ), "soloing", "boost", "shelves, Q, dynamic EQ", "sub-bass enhancer", "mix bus", "woolly low end", "carve" (check), "+12 / +6 / −6 / −12" on the EQ curve. |
| Follows / continues? | Partly. Two of three goal chips need sound. The check is answerable from reasoning. OPEN THE EQ LAB is a nice exit for the curious, but it leaves the lab mid-path (does Back return here?). |
| What works | Five named fixes with "There is no single correct answer — there is the smallest change that solves the problem for THIS song"; the shaded WHERE THE LEAD PLAYS band on the EQ curve; "did that fix the tone, or just make the track LOUDER?" |
| Suggestions | 1. (S) Show each fix's trade-off sentence when its button is tapped, whether or not audio plays (the picture already changes silently). 2. (S, SHARED) The SOUND SAFETY WARNING says "This warning appears once" but returns on every page after KEEP SOUND OFF; either reword ("until you turn sound on") or show a short "Sound is off · Turn on" banner instead of the full legal sheet again. 3. (S) One plain line before THE PROBLEM: "EQ = turning up or down only some pitches (low, middle or high) of one sound." 4. (S) Cut "shelves, Q, dynamic EQ" from the habits paragraph; the EQ Lab link can carry that. |
| Hobbyist | The five-fix comparison is exactly what they need to hear; the "louder isn't better" habit is the take-home. |

---

## Page 9 · Basic Compression · page 9/16

| Field | Finding |
|---|---|
| First look | Bold lede "A compressor is an automatic fader that reacts in milliseconds…", then five parameter buttons, three ▶ buttons, then a drawn compressor (four gold knobs, BYP / KEY switches) above a waveform and a gain graph. Thinks: "a gear page". |
| Overwhelm | 4. Five new parameters at once, each with a technical one-liner ("4:1 = every 4 dB over comes out as 1 dB"), a hardware drawing with unexplained BYP and KEY, a waveform with GRAY = DRY (ON TOP) · AMBER = COMPRESSED, MATCHED, a gain graph with a dB axis and a ms axis. |
| Knows what it is learning? | Partly. "Automatic fader" is a strong plain image. "SHAPE of every note: the grab and the letting-go" is good. But "envelope" in the section title is never said in plain words on screen (only in ⓘ). |
| Knows what to do first? | Yes: tap the five parameters (works, each opens one line, chip turns ✓). Then the ▶ buttons need sound; the drawing DOES change silently (FAST ATTACK → knob reads 0.4 ms, "DOWN 22 dB AT MOST"), which is good. |
| Words they would not know | compressor, milliseconds, THRESHOLD, RATIO ("4:1"), ATTACK, RELEASE, MAKEUP GAIN, "envelope", "level-matched", "dB", BYP, KEY, "DRY", "ms", "punch", "groove's breathing", "Bypass-compare", "DAW", "crack" (check), "clamp". |
| Follows / continues? | Partly. At phone size the gray dry hit and the amber compressed hit overlap so closely that "compare the front of the amber hit with the gray one" is hard to see; the difference between FAST and SLOW is mostly in the first few pixels. The drawing at page load already shows the SLOW (30 ms) settings although nothing is pressed, which muddles "the picture follows the button you press". One goal chip needs sound. The check is fair. |
| What works | "Automatic fader"; one parameter that changes (only ATTACK differs) while others stay fixed: a model experiment design; the gain graph showing the dip; THE HONEST COMPARISON RULE ("louder can fool you") repeated from page 4. |
| Suggestions | 1. (M) Zoom the waveform to the first ~30 ms (the "front of the hit") or add a magnifier inset, so FAST vs SLOW is visible without sound. 2. (S) Show the drawing in a neutral "pick a version" state (or NO COMP) until a button is pressed. 3. (S) Open only THRESHOLD and ATTACK first ("the two that matter on this page"), and fold RATIO / RELEASE / MAKEUP GAIN under "more". 4. (S) Label BYP and KEY or hide them; they are not used here. 5. (S) Define "envelope" in the section title line: "how a hit rises and fades over time". |
| Hobbyist | The fixed-everything-but-attack experiment is the best part. They may want to set attack themselves rather than pick two presets. |

---

## Page 10 · Reverb & Delay · page 10/16

| Field | Finding |
|---|---|
| First look | Bold lede, then a solid paragraph THE DEPTH VOCABULARY (DRY/WET, PRE-DELAY, DECAY, tempo-locked delays, all in one block), then a routing drawing: five channel names with green numbers feeding a PLATE box → MIX BUS. Thinks: "this is about echo", but the paragraph stops them. |
| Overwhelm | 4. THE DEPTH VOCABULARY packs five new terms in five sentences with no picture each ("Short ambience places; long ambience romanticizes"). Delay is in the page title but never shown or played; the whole page is about reverb. |
| Knows what it is learning? | Partly: "reverb = room, makes things sound far". "One shared space, fed by sends" assumes send is known (page 3 had one line on it). |
| Knows what to do first? | Yes: three ▶ buttons. Silent: the drawing changes per button (DROWNED shows +2 sends), and the green send numbers are readable, so a silent learner can still see "same plate, only the sends changed". The drawing at page load already shows ONE SHARED ROOM, not BONE DRY, so the first press of BONE DRY looks like taking things away. |
| Words they would not know | Reverb, delay, sends, DRY/WET, "send-fed return", "100 % wet", PRE-DELAY, DECAY, ambience, "romanticizes", "locked to the tempo", "plate reverb" / PLATE, "MIX BUS", "POST-FADER COPY", "CPU" (check), "insert" (check). |
| Follows / continues? | Partly. One goal chip needs sound. The check's right answer uses "dry level intact", which only makes sense if the routing drawing was understood. "Drowned is the classic beginner mix: depth everywhere is depth nowhere" is memorable. |
| What works | The one-room drawing with green send knobs and the two plain captions under it ("GREEN = A POST-FADER COPY INTO THE ONE SHARED PLATE", "EACH CHANNEL STILL PLAYS DRY TO THE MIX AT ITS OWN FADER"); BONE DRY / ONE SHARED ROOM / DROWNED as a three-step contrast. |
| Suggestions | 1. (M) Break THE DEPTH VOCABULARY into tappable cards like other pages (DRY/WET, PRE-DELAY, DECAY, DELAY), each with a tiny picture (a dry hit vs a hit with a tail). 2. (S) Either show/play one delay example or retitle the page "Reverb: one shared room" and move delay to its own line "Delay works the same way through a send". 3. (S) Start the drawing at BONE DRY so the three buttons read as a build-up. 4. (S) Plain first line: "Reverb = the sound of a room. More reverb = the sound seems further away." |
| Hobbyist | The send/return model is the useful bit; many hobbyists put a reverb on every track, so DROWNED will hit home. |

---

## Page 11 · The Six Routing Terms · page 11/16

| Field | Finding |
|---|---|
| First look | Bold lede "Six terms carry most of routing — and they are the six most-confused words in mixing", then six buttons (Bus … Stem), then a dark drawing of channel strips labelled VCA 1, FX RTN, DRUMS, MIX and a "Drums.wav · A FILE, NOT A PATH" box. Thinks: "vocabulary page". |
| Overwhelm | 4. Six abstract terms that experienced people mix up, on one page, for someone who learned "send" two pages ago. The sorting idea ("audio, or just control") is a good simplifier, but the definitions use other unexplained terms ("Sums several channels' complete outputs", "parallel processing", "rendered submix", "GAIN"). |
| Knows what it is learning? | Partly: "some of these carry sound and some only move knobs together". That one distinction lands; the six definitions mostly do not. |
| Knows what to do first? | Yes: tap Subgroup then VCA / DCA (intro card). Each tap lights a path title in the drawing ("SUBGROUP — CHANNELS SUM THROUGH IT", "VCA — GAIN BY REMOTE, NO AUDIO"). |
| Words they would not know | routing, Bus, Subgroup, Aux, send / return, Control group, VCA / DCA (no expansion; it stands for nothing a beginner can use), Stem, "sums", "parallel processing", "rendered submix", "bounced", FX RTN, GAIN. |
| Follows / continues? | Partly. As each card opens it pushes the drawing further down (drawing title at y≈824 with all open on an 844 phone; the stem file at y≈1178), so the "light its path" moment is off screen while you tap. The check's wrong-answer note is good ("Neither has a sound — one is a signal path, the other is a control relationship"). |
| What works | Sorting by "what travels: audio or only control"; the "A FILE, NOT A PATH" label on the stem; each term's one-line "Audio flows through it / No audio" verdict. |
| Suggestions | 1. (M) Put the drawing above the terms (or make it sticky) so the lit path is visible on each tap. 2. (M) Split into two groups on screen: "Carries sound: Bus, Subgroup, Aux" and "Only moves knobs: Control group, VCA/DCA", with Stem as "a file you export". Teach the two groups, then the members. 3. (S) Give each term an everyday analogy: Subgroup = "a mini-mixer for the drums"; VCA = "one remote that moves several faders"; Stem = "an exported audio file of a group". 4. (S) Mark this page "reference — come back when you need it" so beginners do not feel they must memorise six terms. |
| Hobbyist | Very useful: the subgroup vs VCA distinction is a real gap for home mixers. |

---

## Page 12 · Pre/Post & the Double Route · page 12/16

| Field | Finding |
|---|---|
| First look | Bold lede "A send is a COPY of your channel…", then a single button "FADER: 0 dB" over a signal-chain drawing (IN → EQ → COMP → FADER, with PRE → SINGER'S CUE and POST → REVERB, both RECEIVING). Thinks: "a wiring diagram with one switch". Good: one control. |
| Overwhelm | 2. One button, one drawing, one live status line ("REVERB (post): receiving · HEADPHONES (pre): receiving"), then a detective case. Best-paced page so far. |
| Knows what it is learning? | Yes, after one tap: "the reverb died with the fader … the singer still hears themselves". The feedback paragraph is the lesson. |
| Knows what to do first? | Mostly. The intro says tap FADER: 0 dB; on screen the button's label reads like a status, not an action, so a beginner may not see it as a button. Once tapped it reads FADER: PULLED (−∞) and the drawing marks SILENT. |
| Words they would not know | send, "tapped", Post-fader / Pre-fader, PRE / POST, "cue" / "SINGER'S CUE", EQ, COMP, "−∞", "utility send", "output → MIX", "desk". |
| Follows / continues? | Yes, fully silent. The case gives a hint on the wrong answer ("The clue is 'barely changes'… Look at the send") and a drawn answer on the right one ("OLD SEND · FULL LEVEL · 2ND PATH / MAIN OUT · FOLLOWS THE FADER"). |
| What works | One control, a live status line, an explanation that names the real-world reason (cue mixes pre, effects post); the detective case with a hint instead of just "wrong". This page is a model for the lab. |
| Suggestions | 1. (S) Make the button read as an action: "PULL THE FADER DOWN ▼" / "PUSH IT BACK UP ▲", with the state shown in the drawing. 2. (S) Say "cue = what the performer hears in their headphones" in the first line (it is defined only at the end of the feedback). 3. (S) Replace "−∞" with "fully down (silent)". |
| Hobbyist | Very useful; the forgotten-send case is a real home-studio bug. |

---

## Page 13 · Basic Automation · page 13/16

| Field | Finding |
|---|---|
| First look | Bold lede, then a paragraph THE MOVES full of jargon ("Volume rides … a delay throw on the last word of the verse"), then three LIFT buttons over automation lanes (VERSE · BARS 1–2 | CHORUS · BARS 3–4) for LEAD, BGV, PERC. Thinks: "a timeline". Correct. |
| Overwhelm | 3. The lanes are clean; the paragraph and the "−∞ / +8 dB / −4 dB" numbers are the load. |
| Knows what it is learning? | Partly: "make the chorus bigger by moving faders over time". "automation" itself is defined only by example. |
| Knows what to do first? | Yes: LIFT +6 (intro). The LEAD lane updates to "▲ +6 dB": instant, visible feedback. ▶ STATIC / ▶ AUTOMATED need sound (one goal chip). |
| Words they would not know | automation, "static mix", rides, "send lifts", "delay throw", "hook", "bars", BGV (backing pad), "−∞" on the BGV lane, "Level-matched", "mix bus" (check). |
| Follows / continues? | Mostly. The check ("make the VERSE smaller") is a genuinely surprising, teachable idea and answerable without sound. |
| What works | The lane drawing (before/after split by section) is the clearest automation picture a beginner could get; LIFT buttons with instant lane feedback; "storytelling with faders"; "+1 is barely a lift and +6 is an event; taste lives between". |
| Suggestions | 1. (S) One plain first line: "Automation = the mix moves by itself as the song plays: a fader that rises in the chorus, a part that switches on." 2. (S) Turn THE MOVES paragraph into a short list with the beginner-relevant two first (volume rides, mutes) and the rest marked "later". 3. (S) Replace −∞ with "OFF" on the BGV lane and say "BGV = backing pad". |
| Hobbyist | Clear and quick; would like to draw the ride themselves. |

---

## Page 14 · Check & Finish · page 14/16

| Field | Finding |
|---|---|
| First look | Bold lede "'Finished' is a verdict you earn with checks, not a feeling at 1 a.m.", six habit buttons, two ▶ buttons and the familiar mix picture. Thinks: "a checklist before I'm done". Right. |
| Overwhelm | 2. Same pattern as earlier pages; the learner now knows the picture. |
| Knows what it is learning? | Yes: "check your mix in a few ways before calling it done". The 1 a.m. line gives a reason to care. |
| Knows what to do first? | Yes: tap the habits. Each opens one plain line ("At whisper level only balance survives"). The mono check needs sound (one goal chip); the picture does fold silently per the guide. |
| Words they would not know | "Bypass-compare, matched", "References, matched", "mono" (taught on page 7), "hard-panned", "out-of-phase effects", "mix bus" (check). |
| Follows / continues? | Yes. The check's wrong-answer line is excellent ("Right now is exactly when your judgment is least trustworthy — ask why everything went dull at once."). |
| What works | Habits phrased as human advice ("Take breaks", "Listen QUIETLY"); a check about tired ears, which beginners never expect; re-use of the same mix picture so nothing new has to be decoded. |
| Suggestions | 1. (S) Add one line linking back: "You met two of these already: matched comparison (page 4) and mono (page 7)" — a sense of progress. 2. (S) Explain "Bypass" in its card ("bypass = switch the effects off for a moment"). 3. (S) Say on the page that the picture also folds when ▶ IN MONO is pressed, so a silent learner knows to look. |
| Hobbyist | Good reminders; "headphones AND speakers" and "take breaks" are the ones they skip. |

---

## Page 15 · Basic Export · page 15/16

| Field | Finding |
|---|---|
| First look | Bold lede "The export is the product…", then a paragraph full of numbers ("44.1 kHz / 16-bit is the CD legacy target; streaming masters are commonly delivered 24-bit"), four format buttons, a file-name builder, and a drawn BOUNCE MIX dialog (FILE NAME, FORMAT, SAMPLE RATE choose…, BIT DEPTH choose…, DITHER OFF, RANGE). Thinks: "the save-as screen". Right, and it looks like real software, which helps. |
| Overwhelm | 3. The FORMAT paragraph and the inspection paragraph ("clipped count-in? missing pickup? … truncation? … a muted return, a bypassed insert, a dead side") are dense; the controls themselves are few. |
| Knows what it is learning? | Partly: "how to save the finished song properly". Sample rate and bit depth are named, never explained (what are they? why two choices?). |
| Knows what to do first? | Yes: choose a rate and a depth. 16-BIT gives an immediate, clear reaction ("Dropping to 16-bit? Dither on the way down …" and DITHER flips ON). |
| Words they would not know | export, sample rate, kHz, bit depth, 16-bit / 24-bit, "resample", "CD legacy target", "streaming masters", "client spec", "bounce", "count-in", "pickup", "reverb tail", "truncation", "clipping", "return", "insert", "dead side", WAV, "STEREO INTERLEAVED", DITHER, "truncation grit". |
| Follows / continues? | Yes. BUILD fills the file name with a good reason ("Six months from now, this name still answers every question."). RUN THE INSPECTION does all the checking for you in one tap and passes even before a sample rate is chosen (I ran it with only BIT DEPTH set), so it does not teach the habit of checking. The check (bounce stops at 3:40, song is 3:55) is excellent and is tied to the RANGE row in the drawing. Fully silent-friendly. |
| What works | The drawn bounce dialog that fills in; "final_FINAL_2.wav is a horror story"; the dither reminder that appears only when needed; the truncated-tail check linked to the RANGE row. |
| Suggestions | 1. (S) One plain line each: "Sample rate = how many snapshots per second (48 kHz is a safe default). Bit depth = how fine each snapshot is (24-bit is a safe default)." 2. (M) Make the inspection a short tap-through (tap START, TAIL, CLIPPING, LENGTH, PARTS one by one, each with what to listen/look for) instead of one auto-pass button; and only allow it once rate and depth are chosen. 3. (S) Cut "STEREO INTERLEAVED" from the drawing or explain it. |
| Hobbyist | Right defaults, good naming habit; dither explanation is the one they half-knew. |

---

## Page 16 · The Final Mix · page 16/16

| Field | Finding |
|---|---|
| First look | The MIXER'S MANTRA box again (nice bookend), then THE PROCESS: eight numbered steps with a line each, then the console, the mix picture and three ▶ buttons. Thinks: "the final exam". Good sense of arrival. |
| Overwhelm | 3. Eight steps of text, an eight-channel console and three play buttons; but every element has been seen before, so the load is mostly length. |
| Knows what it is learning? | Yes: "do the whole process once, in order". |
| Knows what to do first? | Partly. Step 1 is "On your honor — the app cannot see your session". A beginner has NO session of their own; they cannot honestly tick it and do not know what to do. Steps 2-3 are on the console (fine). Steps 4-7 complete only when audio plays, so the single goal chip "Complete all eight steps" is impossible with sound off and the lab cannot be finished silently. |
| Words they would not know | "masking fight", "collision", "high-pass", "EQ cut", "the glue", "Fold it down", "Session rate, 24-bit", "start/end/clipping pass". All taught earlier, but recall is not supported (no "see page 7"). |
| Follows / continues? | Partly. FINISH · SEE WHAT'S LEFT › leads to the end screen. "If YOUR MIX beats the wall and survives mono, you have mixed. Welcome to the part of audio that never stops being interesting." is a warm, motivating close. |
| What works | Bookending with the mantra; the process as a numbered recap; steps that tick themselves when the work is done; the closing sentence. |
| Suggestions | 1. (S) For steps 1 and 8, say what a learner without a session should do: "No session of your own yet? Tick it once you have read page 2 / page 15." 2. (S) Add "(page N)" after each step so the recap doubles as a map back. 3. (S, SHARED) With sound off, mark steps 4-7 as "needs sound" rather than leaving them silently unticked. |
| Hobbyist | Satisfying recap; would like to load the page-5 balance here instead of starting flat again. |

---

## End screen · Where you are (WHAT'S LEFT)

| Field | Finding |
|---|---|
| First look | WHAT'S LEFT with "13 pages still to finish before this lab counts toward your credit", then 13 rows, each repeating the identical sentence "This page counts as done once the goals at the foot of the page are met. NEXT moves on without counting it." |
| Overwhelm | 3. Not hard, but discouraging: after walking all 16 pages the learner is told 13 are unfinished, mainly because sound-only goals could not be met, and the same sentence is printed 13 times. |
| Knows what it is learning? | Partly. The page tells progress, not what was learned. |
| Knows what to do first? | Yes: tap a row to jump. PRACTICE AGAIN / DONE · BACK TO LABS are clear. |
| Words they would not know | "credit", "goals at the foot of the page" (goal chips were never called that on the pages). |
| Follows / continues? | Yes. |
| What works | Rows jump straight to the page; "Practicing again or reviewing never removes credit". |
| Suggestions | 1. (S, SHARED) Say the shared sentence once at the top, and on each row name the missing goal ("Missing: Hear the reveal · Pass the check"). 2. (S, SHARED) Lead with what was learned (the eight-step process) before what is left. 3. (S, SHARED) When goals are missing only because sound was off, say so ("needs sound: 9 goals"). |
| Hobbyist | Would want the row to say exactly which chip is missing. |

---

## Lab verdict · Beginning Mixing (16 pages + end screen walked)

**The beginner's journey.** After a long "bring in a pro" popup, an intro card and a tooltip, the beginner meets a well-built, friendly first page and a clear rhythm that repeats on every page: a bold idea, tap-to-open cards, a picture, a play-to-compare block, a check that explains wrong answers, and goal chips. The scenarios (crowded chorus, forgotten send, tired ears, truncated bounce) are where real understanding happens. The weight comes from vocabulary: almost every page introduces four to eight new terms in its first paragraph, and the pictures often sit below the cards that change them, so "watch the picture change" happens off screen on a phone. With sound off, about half the goal chips and several teaching sentences (EQ trade-offs, A/B reveal) cannot be reached, and the lab ends with "13 pages still to finish".

**3 biggest orientation problems**
1. Jargon density in the first lines of each page (ledes and "vocabulary" paragraphs: pages 3, 8, 9, 10, 11, 15) with no plain-word first sentence.
2. Picture and controls are separated on a phone: the drawing that reacts sits under a stack of opened cards (pages 2, 11) or the relevant channel is off screen (pages 5, 7).
3. Sound-only feedback with no silent fallback and no message: ▶ shows the full safety sheet again on every page, then nothing happens; trade-off text (page 8) and the A/B vote (page 4) never appear; the lab cannot be completed silently.

**3 best things**
1. Consistent page rhythm with goal chips and a named NEXT: <page> › button — always clear where to go next.
2. Checks and scenario buttons that explain WHY a wrong answer is wrong (pages 1, 2, 6, 12, 14).
3. The same mix picture used across pages (balance, pan, mono, final), so one decoded picture keeps paying off; page 12 (one button, live status line, detective case) is the model page.

**First 30 seconds (rewrite suggestion).** Skip the pro popup on arrival (keep the link). Show one short card: "In this lab you'll mix a short song in 16 small steps. Each page is one decision: how loud, which side, how far away, what changes in the chorus. No experience needed — tap the five buttons below to start." Then page 1 with the mantra once, the five dimension buttons and the picture directly under them, with a one-line "how to read this picture" and the short track names spelled out.
