# G5c · Sound Systems Lab (SoundSystemsLab) · TROUBLESHOOT cases left by G5b, then OPERATE 3-4 drag lanes

Auditor G5c, 2026-11-14. Scope: only what G5b left. G5's and G5b's entries (`G5_SoundSystemsLab.md`, `G5b_SoundSystemsLab.md`) are not repeated; the per-case entries below add what a beginner meets in each case G5b only read from the list.

Setup: built-in browser pane, tab-3 only, `http://localhost:8142/?g5c=1#labpreview/SoundSystemsTroubleshoot`, 390 x 844, member, intro cards unseen. SOUND OFF throughout (no case on the bench plays sound; every reading is words).

Count note: G5b's progress line says "5 of 22 solved", but its entries show six (No sound anywhere, One input, Amplifier clips, Wrong output bus, Reversed polarity, Digital clocking). So 16 cases were left. The bench state in this tab started at "0 solved" (fresh query string), so to see each module's goals tick I also re-solved G5b's six quickly; those re-walks are noted in one line, not re-written.

How I walked each case, as a beginner: read the card, start at the station the start hint names, tap stations on the map one at a time going forward, read each reading, open FAULT and name the cause. In one case per module I tried a beginner shortcut or mistake on purpose (named it with no probe, guessed at the far end, or named it wrong first), to see what the bench says.

---

## TROUBLESHOOT · Module 2 · Dead signal · the four cases G5b did not walk (all solved; both goals ✓)

Intro card on arrival (this time it arrived WITH the page, not late): "How a dead signal stops at one point in the chain… Tap CASE to put a fault on the bench and read its symptom. PROBE the starting station first, then walk forward one station at a time." Clear.

### Case 3 · Left loudspeaker has no sound (✓✓, 3 probes)

| Field | Notes |
|---|---|
| Card | "Only the right side is playing." · "Stereo mains on a two-channel amplifier fed from the processor." · "▸ The symptom clears everything before CONSOLE OUTPUT. Start there and walk forward." The setting line does NOT give this one away (good). |
| Walk | Console OUT · OK → Processor · OK → Amplifier · NO SIGNAL: "Channel A: PROTECT lit, no signal LED. Channel B normal." FAULT offered: "The left microphones are dead / The left loudspeaker cable is reversed / The left amplifier channel is in protect / The left console output is muted". "PROTECT" in the reading and "in protect" in the option match word for word, so a beginner can pick it by matching words without knowing what protect is. ✓✓ "Correct — and a source-forward walk. 3 probes; a disciplined walk from Console output needs 3." |
| Debrief | WHY: "Console and processor both show left and right — so nothing upstream of the amplifier is the cause." THE FIX: "Find WHY it went into protect before resetting it: a shorted speaker cable, a load below its minimum, or overheating." A fine real-world habit (fix the cause, not the light). |
| Where a beginner gets lost | (1) **Earlier readings vanish.** Only the latest probe's sentence is on the page. The Console OUT and Processor sentences were replaced by the Amplifier one, so the WHY line "Console and processor both show left and right" refers to words the learner can no longer see. The PROBE tray lists stations with their badge ("OK · Console output") but not their sentence; re-tapping a probed station would count as a backward jump. (2) "PROTECT" is never explained (the amp switched itself off to save itself). (3) The dock key shows "PROBE ▸ NO" (NO SIGNAL cut to its first word). |
| Words they would not know | protect (amp), signal LED, channel A / B, load, "power-cycle". |
| Suggestions | 1. Keep every reading on the page as a growing list under the card ("1 · Console output · OK · Main L and R both moving…"), newest at the bottom: the learner's notebook. M, SHARED (bench frame). 2. Gloss protect in the reading: "PROTECT lit (the amp has switched that channel off to save itself)". S. 3. Print the dock badge in full ("NO SIGNAL") or as a symbol. S. |

### Case 4 · Subwoofers have no output (✓✓, 1 probe)

| Field | Notes |
|---|---|
| Card | "The tops sound fine but there is no low end at all." · "Aux-fed subwoofers: Aux 6 on the console feeds the processor's LOW input; the tops come from the main mix." · start at CONSOLE OUTPUT. |
| Walk | The very first probe is the fault: Console OUT · **NO SIGNAL** "Main L/R meters healthy. The AUX 6 SUB master fader is all the way down and its meter is dark." Named "The aux-fed subwoofer master is down at the console" (other options: sub amp failed, kick mic cable open, crossover set too high). ✓✓ with 1 probe. |
| Debrief | THE WALK: "An aux-fed sub adds a station the main mix never passes through. Probe the bus that actually feeds the subs, not the one that feeds the tops." The best lesson in this case. |
| Where a beginner gets lost | (1) The card still says "Keep walking forward until the reading changes" after the first probe has already changed: the learner may walk on to the processor, unsure. (2) The badge reads NO SIGNAL while the sentence starts "Main L/R meters healthy": a mixed reading under a red badge. (3) THE WALK says "probe the bus that actually feeds the subs", but the bench chose the bus for the learner (one tap on Console OUT read both), so the decision the debrief praises was never the learner's. (4) "aux-fed" and "LOW input" are not explained on the card. |
| Suggestions | 1. When the first probe already differs from the symptom's "fine" part, the hint line can switch to "The reading changed here. Name the fault, or probe one more to be sure." S. 2. On aux-fed cases let Console OUT open a small choice "Which output? MAIN L/R · AUX 6 SUB", so the learner makes the choice THE WALK talks about. M. 3. One line on the card: "aux-fed = the subs get their own send from the console, not the main mix". S. |

### Case 5 · Signal reaches the mixer but not the loudspeakers (✓✓, 2 probes)

| Field | Notes |
|---|---|
| Card | "Meters are moving on the desk. Nothing from the PA." · "Console → loudspeaker management processor → amplifiers → passive cabinets." · start at CONSOLE OUTPUT. A neutral system line: the kind G5b asked for. |
| Walk | Console OUT · OK → Processor · NO SIGNAL: "INPUT meters lit. Every OUTPUT shows MUTE — a preset was recalled with its outputs muted; many processors do this, and this preset was saved that way." Named "The processor outputs are muted (a preset recall)". ✓✓. |
| Debrief | WHY: "Signal in, nothing out, at one box — that box is the station." THE FIX: "Confirm the preset matches the loudspeakers, then un-mute the outputs one at a time at low level." Both are crisp rules a beginner can keep. |
| Where a beginner gets lost | **The FAULT tray stays open from the previous case** ("stays open — compare while you watch"), so the four answers were on screen before I had probed anything. The right option repeats the reading's words ("muted… preset"). "preset" and "recall" are not glossed. |
| Suggestions | 1. Close the FAULT tray (or blank its options) when a new case is put on the bench, and unlock it after the first probe. S, SHARED (bench). 2. Gloss preset once: "preset = a saved set of processor settings". S. |

### Case 6 · Intermittent cable or connector (named with 0 probes on purpose: ✓; then RESET and walked: ✓✓)

| Field | Notes |
|---|---|
| Card | "The bass keeps dropping out. Sometimes it crackles." · "Bass guitar into a DI box; XLR from the DI to the stagebox." · "▸ The symptom clears everything before SOURCE." (the same odd wording G5b noted on case 2: nothing comes before the source). |
| Shortcut tried | With the FAULT tray still open from case 5, the four options were visible at 0 probes, and one of them is the **case title itself**: "An intermittent cable or connector at the DI". I tapped it without probing anything: "✓ Correct — but not a forward walk. 0 probes; a disciplined walk from Source needs 2." The case counted as SOLVED. A beginner learns that the bench can be passed by matching the title. |
| Proper walk | RESET (in the dock) cleared it; the card now reads "… · SOLVED BEFORE". Source · OK → Cable · **"OK · INTERMITTENT"**: "Wiggle the XLR where it enters the DI: the channel crackles and drops. The strain relief spins loose." ✓✓, 2 probes. |
| Debrief | WHY: "An intermittent fault hides from a test while nothing moves. The tell is that it follows movement." THE WALK: "Wiggle while you watch, from the source forward. The station that flickers under your hand is the fault." Lovely physical rule; but there is no WIGGLE action on the bench, so the learner reads about it rather than does it. |
| Where a beginner gets lost | (1) The answer is the case title (and 0 probes still counts as solved). (2) "OK · INTERMITTENT" puts OK on the faulty station (G5b saw the same on polarity and clocks). (3) "strain relief", "DI" not glossed. |
| Suggestions | 1. Do not count a 0-probe answer as solved: FAULT should need at least one probe ("Probe first: the bench wants the reading that proves it"). S. 2. Do not reuse the case title as the right option's wording; phrase every option as a location ("at the DI cable", "at the amplifier", "at the console input", "at the processor"). S. 3. For intermittent faults, make the cable probe a two-step action: PROBE (reads OK while still) then WIGGLE (crackles): the learner then DOES the lesson. M. 4. Badge "FLICKERS WHEN MOVED" instead of "OK · INTERMITTENT". S. |

Re-walked for the goals (G5b's two cases, same results as G5b): No sound anywhere (Console IN · OK → Console OUT · NO SIGNAL, main mute, ✓✓), One input has no sound (Source · OK → Cable · NO SIGNAL, ✓✓). Then both module goals ticked: "✓ Solve all 6 faults", "✓ Solve at least one with a source-forward walk". Nothing else marks the end of the module (no "group done" line; the NEXT: LEVEL, NOISE AND DISTORTION › button was there all along).

**Module 2 summary for a beginner:** doable, even enjoyable; the cases teach good habits. Lost points: earlier readings disappear, the answer tray is open before any probe (and the title is an answer), and the end of the group is silent.

---

## TROUBLESHOOT · Module 3 · Level, noise and distortion · the four cases G5b did not walk (all solved; both goals ✓)

Getting here: my first tap on the bottom button "NEXT: LEVEL, NOISE AND DISTORTION ›" did nothing, because the FAULT tray from the last case was still open over the lower page and took the tap (the same tray-over-page problem G5b saw in the DJ lab). Only after closing the tray with its small ✕ did the button work. The intro card then arrived with the page (not late): "Open a CASE and read whether it's clipping, hum, squash or a rattle."

### Case 1 · Loudspeaker produces distortion (wrong name on purpose first, then ✓✓ with 5 probes)

| Field | Notes |
|---|---|
| Card | "The left top buzzes on every low note." · "Two passive tops on one amplifier channel pair; processor limiters set for the cabinets." (neutral, does not give it away) · start at CONSOLE OUTPUT. |
| Walk | Console OUT · OK "Main meters healthy, nowhere near clip." → Processor · OK "No limiter activity. Outputs clean on the analyzer." → Amplifier · OK "No clip light at any level. Both channels show identical drive." → Loudspeaker · **"OK · DISTORTION"** "The left cabinet buzzes and rattles on low notes at ANY level; the right cabinet on the same drive is clean. Swap the cabinets: the buzz moves with the box." The readings are a model of fair evidence: three clean stations, then a swap test that points at the box. |
| Mistake tried | A beginner hears "buzzes" and thinks "clipping", so I named "The amplifier is clipping": "✕ Not this one. You have already read the station that changed — look at that reading again. FAULT re-opens after your next probe." Then: (1) tapping the RIGHT answer did nothing at all (the buttons still look live; no "locked" look, no message); (2) re-probing the loudspeaker (the station the message tells you to look at again) did NOT count as a probe (PROBED stayed 4) and FAULT stayed locked. **The only way on was to probe a station I did not need (Listener)**. After that, the right answer gave "✓ Correct — and a source-forward walk. 5 probes; a disciplined walk from Console output needs 4." and GRADE ✓✓. |
| What that teaches a beginner | The message says "look at that reading again", the learner does exactly that, and nothing happens. They must guess that "probe" means "probe a NEW station". And the wrong guess leaves no trace on the grade (✓✓), while G5b's case 1 lost its ✓✓ for the same mistake because the extra probe happened to be backward. Two learners making the same mistake get different grades depending on which station is left to probe. |
| Debrief | WHY: "Distortion that is present at any level and lives in one box is mechanical — a torn cone, a rubbing coil, a loose part." Clear. THE FIX also closes the loop: "Check the limiter settings that were supposed to protect it." |
| Words they would not know | top, analyzer, drive, driver (the option "A damaged loudspeaker driver" needs "driver = the speaker cone and its motor"), coil. |
| Suggestions | 1. After a wrong name, keep FAULT open and simply record the miss ("1 wrong guess") in the grade line; or, if a lock stays, make "look again" an action: a READ AGAIN button on the reading that unlocks FAULT. S. 2. Make locked option buttons look locked (dimmed, with "probe once more to unlock"). S. 3. Badge the loudspeaker "BUZZ · MOVES WITH THE BOX" rather than "OK · DISTORTION". S. 4. Gloss driver in the option ("a damaged driver (the cone and its motor)"). S. |

### Case 3 · Loud hum or buzz (✓✓, 2 probes)

| Field | Notes |
|---|---|
| Card | "There is a hum on the keyboards." · "Keyboard connected on a 20 m unbalanced ¼-inch instrument cable straight to a line input at front of house." (gives it away, as G5b found) · start at SOURCE. |
| Walk | Source · OK "On headphones at the keyboard: clean." (a great first test a beginner can copy at home) → Cable · "OK · HUM" "A 20 m UNBALANCED instrument cable. Lift its far end from the input: the hum stops with the keys. Move it near the lighting cable: it gets louder." Named "A long unbalanced cable picking up interference — use a DI box". ✓✓. |
| Where a beginner gets lost | (1) The right option is the only one that is long and carries its own fix ("— use a DI box"); the other three are 4-5 words. Picked by shape alone. (2) "Lift its far end from the input: the hum stops with the keys" reads as "unplug it and everything stops", which proves nothing to a beginner; the test that does prove it ("move it near the lighting cable: it gets louder") comes second. (3) unbalanced, ¼-inch, DI, interference: none explained on the card. |
| Debrief (source check after the walk) | WHY: "it is unbalanced over a distance no unbalanced cable should run. A DI converts to balanced mic level at the keyboard". THE FIX adds "Ground-lift on the DI if a loop remains": a second new idea at the end. |
| Suggestions | 1. Make all four options the same shape (cause only, no fix). S. 2. Put the convincing test first: "Move it near the lighting cable: the hum gets louder. Unplug it at the console: the hum goes." S. 3. One gloss on the card: "unbalanced = two-wire cable that picks up hum over long runs; a DI box turns it into a hum-rejecting balanced line". S. |

### Case 4 · Ground loop (✓✓, 5 probes)

| Field | Notes |
|---|---|
| Card | "A hum that is there even when everything is muted." · "Console at front of house on one mains circuit; a powered top on the stage circuit; both joined by the signal cable." (strong hint) · start at CONSOLE INPUT. |
| Walk | Console IN · OK "Every channel clean. Mute them all: the hum continues." → Console OUT · OK "Main meter shows nothing with everything muted — the hum is NOT in the console." → Processor · OK → **Powered cabinet (amp inside) · OK "Powered cabinet — the amplifier is inside it."** → Loudspeaker · "OK · HUM" "Unplug the SIGNAL cable at the cabinet: the hum stops. Plug it in through a ground-isolating transformer: the hum stops. Two circuits, two grounds, one cable shield joining them." Named the ground loop (the option is 20 words long; the others 3-5). ✓✓. |
| Where a beginner gets lost | (1) **A powered top is one box, but the bench splits it into two stations**: "Powered cabinet (amp inside) · OK" and then "Loudspeaker · HUM". A beginner reads "the cabinet is fine, the speaker inside it hums" and is confused about where the fault is; the powered-cabinet reading itself says nothing about hum ("Powered cabinet — the amplifier is inside it."). (2) The Console OUT sentence ("the hum is NOT in the console") is the key clue and it disappears from the page after the next probe. (3) The right option is again the only long one. (4) The WHY (source check) goes deep for a beginner: "where the shield lands on the audio circuit ground instead (a pin-1 problem)". |
| What works | "Mute them all: the hum continues" as a first test (a beginner can do that); "Two circuits, two grounds, one cable shield joining them." (a perfect one-line model); THE FIX's safety line "Never lift a mains safety ground." |
| Words they would not know | mains circuit, ground, shield, ground-isolating transformer, pin 1, chassis. |
| Suggestions | 1. For powered tops, merge AMP and LOUDSPEAKER into one station ("Powered top") and put the hum reading there. M. 2. Give the "amp inside" reading content that moves the walk on ("No hum from the amp's own input meter; the hum is in the box's ground"). S. 3. Lead WHY with the one-line model ("two grounds joined by one cable"), and fold "pin-1 problem" under a pro note. S. 4. Same option-length fix as case 3. S. |

### Case 5 · Excessive limiter activity (✓✓, 2 probes)

| Field | Notes |
|---|---|
| Card | "It will not get loud. It just sounds squashed." · "Processor preset recalled from a smaller cabinet; limiter thresholds far below what these cabinets need." (the answer, as G5b found) · start at CONSOLE OUTPUT. |
| Walk | Console OUT · OK "Main meters healthy and well below clip." → Processor · **"LOW · LIMITING"** "LIMIT LEDs solid on the HIGH outputs at moderate level; the threshold reads 0 dBu where this amplifier-and-cabinet pairing needs about +10. The preset name is for a different cabinet." Named "The processor limiter threshold is set far too low". ✓✓. |
| Where a beginner gets lost | (1) The badge "LOW" means "the signal is low after this box", but next to "limiter threshold … too low" it reads as "the threshold is low"; the dock key shows just "PROBE ▸ LOW". (2) "HIGH outputs" (the tweeter outputs of the processor) is a third meaning of high/low in one line. (3) "squashed" is the customer's word and is well chosen; "limiter" and "threshold" are not explained on the card or in the reading. |
| What works | "Loud passages do not get louder, they get smaller." (listener reading, source check): the best plain description of over-limiting I have seen; a pity a learner who stops at the processor never reads it. WHY: "A limiter set for a smaller box protects a box you do not have." |
| Suggestions | 1. Badge it "QUIETER OUT THAN IN · LIMITING" (not "LOW"). S. 2. Gloss once: "limiter = an automatic level ceiling; threshold = where the ceiling sits". S. 3. Put the listener line in the debrief so every learner reads it. S. |

Re-walked for the goal: Amplifier clips (G5b's case; same result, ✓✓ 3 probes). Then "✓ Solve all 5 faults" and "✓ Solve at least one with a source-forward walk".

**Phone layout finding (seen here, applies to every FAULT tray):** at 390 wide the FAULT tray scrolled sideways after a long option was chosen: the visible chips read "…hannel is clipping", "…r is driven into clipping — set its input level and the system ga…", "…er is damaged", cut at both edges (screenshot: `C:\Users\profe\.claude\projects\C--Users-profe-dev-ape-studio\276d0574-4dd9-4d15-a2c1-dc787760cfda\tool-results\mcp-Claude_Browser-blob-1794654477924-ju1jxu.png`). A beginner reading the options sees half-words. Suggestion: wrap options onto two lines in a vertical list (never a sideways-scrolling row) and keep each option short. M, SHARED (tray).

**Module 3 summary for a beginner:** the readings are fair and physical; this group most clearly teaches "the first dirty station". The answer shape is the weak spot: in three of four cases the right option is the long one with extra detail, so a beginner can win without reading the walk.

---

## TROUBLESHOOT · Module 4 · Routing · the four cases G5b did not walk (all solved; both goals ✓)

The group's LAB NOTES line reads: "The signal exists and arrives somewhere — just not where it should. **The console is usually the station.**" That second sentence tells the learner where every answer is before they probe. (Same tray-over-button step as module 3 to get here.)

**Display bug seen in three of these four cases:** the READS readout and the reading header print the flag as one run-together word, "OK · WRONGCONTENT" and "CONSOLE OUTPUT · OK · WRONGCONTENT", while the map under the station correctly says "WRONG CONTENT". (Source: the flag is stored as `wrongContent` in `faults.ts` lines 436-543; the map spaces it, the readout and header only upper-case it.) A beginner reads "OK" plus a strange code word. Suggestion: print "WRONG SIGNAL HERE" (or at least "WRONG CONTENT") everywhere, and drop the "OK ·" in front. S.

### Case 1 · Incorrect digital patch (✓✓, 3 probes; started one station early and skipped one on purpose)

| Field | Notes |
|---|---|
| Card | "The vocal is plugged in and the box shows signal, but the channel is dead." · "Digital stagebox. The vocal microphone is plugged into stagebox input 5; console channel 1 is patched from stagebox input 4." (the full answer, as G5b found) · start at STAGE INPUT. |
| Walk | A beginner who hears "the vocal" starts at the mic, so I did: Source · OK "The performer is on; the microphone is live and its switch is on." Then I skipped Cable and went to Stage input · OK "Input 5 LED shows signal every time the singer speaks." → Console IN · NO SIGNAL "Channel 1 meter flat. Its INPUT PATCH reads "Stagebox 4" — the singer is on input 5." Named "The console channel is patched from the wrong stagebox input". "✓ Correct — and a source-forward walk. 3 probes; a disciplined walk from Stage input needs 2." GRADE ✓✓. |
| What this shows | The bench is kind to starting early (one station before the hint) and to skipping a station on the way: still ✓✓. Good for a beginner. But compare case 3 below, where starting LATE costs the ✓✓ with a message that confuses. |
| Words they would not know | digital stagebox, patch / input patch, "LED shows signal". |
| Suggestions | 1. Hide the input numbers on the card ("Digital stagebox; the vocal mic is plugged in on stage"), so the walk finds the 4-vs-5 mismatch. S. 2. When a learner starts before the hint, say it kindly in the grade line: "You started at the mic: fine, one extra probe." S. |

### Case 3 · Pre-fader / post-fader routing error (far end first on purpose: "jumped backward", ✓)

| Field | Notes |
|---|---|
| Card | "When I pull the vocal down, the reverb stays just as loud." · "Reverb on Aux 5. The vocal channel's Aux 5 send is tapped PRE-fader." (the answer) · start at CONSOLE INPUT. |
| Walk | A beginner who "hears the reverb" taps the listener first: Listener · "OK · WRONGCONTENT" "Dry vocal gone, wet vocal still there — a reverb with no source." (a vivid, correct observation). Then, obeying the hint, Console IN: **"△ You jumped backward. The bench still records the answer, but not as a forward walk."** and "Vocal channel meter healthy." Then Console OUT · "OK · WRONGCONTENT" "Pull the vocal fader to −∞: the vocal leaves the main mix, but the AUX 5 send meter holds steady. The send is tapped PRE-fader." The △ line disappeared after this probe. Named "The reverb send is tapped pre-fader — switch it to post-fader": "✓ Correct — but not a forward walk. 3 probes; a disciplined walk from Console input needs 2." GRADE ✓. |
| Where a beginner gets lost | (1) "You jumped backward" arrives at the moment the learner does the RIGHT thing (going to the start the hint names). From their point of view they started at the wrong place, not that they went backward. (2) The warning vanishes after the next probe, so by the end the grade ✓ (not ✓✓) has no visible reason. (3) The right option again carries its fix ("— switch it to post-fader") and repeats "PRE-fader" from the card. (4) "wet / dry", "tapped", "−∞" not glossed. |
| Suggestions | 1. Word the far-end case as what happened: "You started at the listener. The walk starts at the console input: from here on, forward." S. 2. Keep a one-line walk log next to the grade ("Listener → Console IN → Console OUT: started at the far end") so the ✓ explains itself. S. 3. Same option-shape fix as module 3. S. 4. Gloss "wet = the reverb's sound; dry = the voice itself". S. |

### Case 4 · Monitor changes when the main fader moves (✓✓, 2 probes)

| Field | Notes |
|---|---|
| Card | "Every time you touch the house, the wedges change." · "The wedge amplifier is patched from a MAIN L output instead of an aux output." (the answer) · start at AUX OUTPUT. |
| Walk | **The map relabels itself for a monitor path**: Aux output · Monitor EQ · Monitor amp · Wedge · Performer (a lovely touch: the stations are the wedge's own chain). Aux output · "OK · WRONGCONTENT": "The output patch shows the monitor amplifier fed from MAIN L. Move the main fader: the wedge follows. Aux 1's output is patched to nothing." The first probe holds the answer; I followed the hint ("keep walking") one more: Monitor EQ · "Wedges follow the house." Named "The monitor amplifier is fed from the main output instead of an aux send". ✓✓ "2 probes; a disciplined walk from Aux output needs 1." |
| Where a beginner gets lost | (1) "touch the house" (= move the house/main faders) is engineer slang. (2) A good distractor sits in the list: "The monitor sends are post-fader" would cause a similar symptom from a beginner's view; the reading settles it, which is good teaching, but the debrief does not say why that option was wrong. (3) The station is named "Aux output" while the fault is that the amp is NOT on an aux output: a beginner may wonder why the fault shows at a station that is not in use. |
| Suggestions | 1. Gloss "the house" once ("the house = the main mix the audience hears"). S. 2. Add one line to the debrief on the closest wrong answer ("Post-fader sends would follow each CHANNEL fader, not the main fader."). S. 3. Name the first station "Monitor feed (console output)". S. |

### Case 5 · Subwoofer receives vocals unintentionally (✓✓, 1 probe)

| Field | Notes |
|---|---|
| Card | "The vocal sounds boomy and thick — you can hear it coming from the subs." · "Aux-fed subs on Aux 6. The lead vocal channel's Aux 6 send has been turned up." (the answer; and the title itself also says it) · start at CONSOLE OUTPUT. |
| Walk | Console OUT · "OK · WRONGCONTENT": "The AUX 6 SUB send on the LEAD VOCAL channel reads 0 dB. It should be off — the sub send is for low sources such as kick, bass, floor tom and keys." Named "The vocal channel is sending to the aux-fed subwoofer bus". ✓✓, 1 probe. |
| What works | The reading teaches the rule ("the sub send is for low sources such as kick, bass, floor tom and keys"): a beginner learns what an aux-fed sub is FOR, which BUILD capstone 10 never says on its page (G5b). |
| Where a beginner gets lost | Title, symptom, card and the first option all say the answer; there is nothing to find. |
| Suggestions | 1. Retitle the case by its symptom ("Boomy vocal") and hide the Aux 6 detail on the card; then the walk is a real search. S. 2. Link BUILD capstone 10's "no vocal on Aux 6" requirement to this reading ("see TROUBLESHOOT · Routing"). S. |

Re-walked for the goal: Wrong output bus selected (G5b's case; Console IN → Console OUT, ✓✓). Then "✓ Solve all 5 faults", "✓ Solve at least one with a source-forward walk".

**Module 4 summary for a beginner:** the monitor-path relabelling and the sub-send rule are high points. But this is the group where the answer is most often on the card or in the title, the lab notes say "the console is usually the station", and the readout prints a code word (WRONGCONTENT). A beginner can finish it without thinking.

---

## TROUBLESHOOT · Module 5 · Time, polarity and crossover · the two cases G5b did not walk (both solved; both goals ✓)

LAB NOTES line: "Everything is present; the pieces disagree with each other. The processor and the loudspeakers are the stations." (Again the answer's location is printed on the page; here it is at least a useful idea: in this group "OK everywhere" is normal.)

### Case 2 · Incorrect crossover (✓✓, 2 probes)

| Field | Notes |
|---|---|
| Card | "The subs are muddy and you can hear vocals in them. The tops sound thin." · "Processor crossover point set at 400 Hz instead of 100 Hz." (the answer, with the right number) · start at CONSOLE OUTPUT. |
| Walk | Console OUT · OK "The main mix is correct; no vocal on any sub send — the subs are crossover-fed." (this rules out the look-alike fault from module 4, "vocals in the subs": excellent teaching) → Processor · "OK · WRONGCONTENT": "The LOW/HIGH crossover reads 400 Hz. Vocals, guitars and snare are all being sent below the crossover to the subwoofers; the tops receive nothing beneath 400 Hz." Named "The crossover frequency is set far too high in the processor". ✓✓. |
| Where a beginner gets lost | (1) The reading gives "400 Hz" but not what it should be; only the card says "100 Hz". A beginner without the card has no idea whether 400 is high or low. (2) "crossover-fed" vs "aux-fed" subs: two set-ups met two modules apart, never side by side. (3) "Hz" not glossed in this mode. |
| What works | Console OUT clearing the module 4 look-alike in one line; a reading that tells which instruments end up where. THE WALK (source check): "turned a "vocals in the subs" symptom into a processor question in one step." |
| Suggestions | 1. Put the target in the reading: "reads 400 Hz; for these cabinets it is usually 80–120 Hz". S. 2. Put a tiny two-row picture in the card or debrief: "aux-fed subs: the console decides · crossover-fed subs: the processor decides". S. |

### Case 3 · Delay loudspeaker arriving too early (✓✓, 2 probes)

| Field | Notes |
|---|---|
| Card | "Under the delay towers everything sounds smeared, like a slap echo." · "Outdoor system: delay loudspeakers 30 m in front of the mains. The processor's DELAY outputs show 0.0 ms." (the answer) · start at CONSOLE OUTPUT. |
| Walk | Console OUT · OK → Processor · "OK · EARLY": "The DELAY outputs read 0.0 ms. The delay towers stand 30 m nearer the back rows than the mains — their sound arrives about 87 ms before the mains at 20 °C." Named "The delay loudspeakers are not delayed — set ≈ distance ÷ speed of sound". ✓✓. |
| Where a beginner gets lost | (1) The card says the towers are "30 m in front of the mains"; the reading says "30 m nearer the back rows than the mains". Same fact, two pictures; a beginner has to stop and think which way is which. (2) "slap echo", "delay tower", "≈", "speed of sound" with no number on the page (the 2.9 ms per meter rule is only in the debrief). (3) The right option is the only one with a formula in it. |
| What works | The 87 ms figure (it is right: 30 m at 343 m/s ≈ 87 ms) turns BUILD capstone 9's untold delay time (G5b) into a number; THE FIX (source check) names the app's own "Delay from Distance calculator", a real link between the lab and the tools. |
| Suggestions | 1. Use one picture on card and reading ("the delay towers stand 30 m out in the crowd, closer to the back rows than the mains are"). S. 2. Put the rule on the reading: "sound travels about 1 m every 2.9 ms, so 30 m ≈ 87 ms". S. 3. Make the calculator mention a tappable link to Delay from Distance. S. 4. Link BUILD capstone 9 to this case. S. |

Re-walked for the goal: Reversed polarity (G5b's case; Console OUT → Processor → Powered cabinet → Loudspeaker "OK · POLARITY", ✓✓). Then "✓ Solve all 3 faults" and "✓ Solve at least one with a source-forward walk".

---

## TROUBLESHOOT · Module 6 · Digital, network and acoustic · the two cases G5b did not walk (both solved; both goals ✓), then FINISH

LAB NOTES line: "Faults that arrive as clicks, dropouts or a ring — and are solved by discipline, not by swapping boxes." (A good line: it names the method, not the answer.) The header button now reads FINISH ›.

### Case 2 · Network audio interruption (amplifier first on purpose: "jumped backward", ✓)

| Field | Notes |
|---|---|
| Card | "The whole PA drops out for a second, then comes back." · "One network cable from the stagebox to the console, routed through a door hinge to an office switch with Energy-Efficient Ethernet enabled." (strong hint) · start at STAGE INPUT. |
| Walk | "The whole PA drops out" makes a beginner suspect the amplifier, so I probed it first: Amplifier · "OK · DROPOUT" "Everything drops together." Then the start station: **"△ You jumped backward."** and Stage input · "OK · DROPOUT": "The LINK LED blinks off when the door moves. Every input drops together. The cable is crushed at the hinge — and the switch has Energy-Efficient Ethernet enabled, which idles the port between packets and can cause clock trouble and dropouts." Named "The network link between the stagebox and the console is failing (cable or switch)": "✓ Correct — but not a forward walk. 2 probes; a disciplined walk from Stage input needs 1." GRADE ✓. |
| Where a beginner gets lost | (1) Same "jumped backward" wording as module 4 case 3: the learner went from a wrong guess to the right start and is told they went backward. (2) The station is called "Stage input" but the reading is about the stagebox's LINK LED and a network cable: a beginner does not know the stagebox IS the stage input here. (3) The reading stacks two causes (crushed cable AND a switch setting) plus "idles the port between packets": the switch half is IT jargon. |
| What works | "The LINK LED blinks off when the door moves" (a real thing you can watch); THE WALK (source check): "The stagebox is the first station where all channels share one path. Its LINK light told the story before a single cable was swapped." |
| Words they would not know | network link, LINK LED, switch, Energy-Efficient Ethernet, packets, port, QoS (in THE FIX). |
| Suggestions | 1. Rename the station for networked cases: "Stagebox (network link)". S. 2. One cause per case: keep the crushed cable here; move the switch-setting cause to a case of its own or to a pro note. S. 3. Same "jumped backward" rewording as module 4 ("You started at the amplifier; the walk starts at the stagebox."). S. |

### Case 3 · Feedback appears during soundcheck (✓✓, 5 probes)

| Field | Notes |
|---|---|
| Card | "A ring starts every time the singer's wedge comes up." · "Vocal microphone with a cardioid pattern; the wedge fires up into the FRONT of the capsule — on-axis — and the singer's monitor send is at +6 dB." (the answer) · start at CONSOLE INPUT. The map relabels for the monitor path (Aux output · Monitor EQ · Monitor amp · Wedge · Performer). |
| Walk | Console IN · OK → Aux output · OK "Aux 1 send on the vocal at +6 dB — hotter than anything else in that mix." → **Monitor EQ · OK "Not in the monitor path."** → Monitor amp · OK "Monitor amplifier clean." → Wedge · **"HOT · FEEDBACK"** "The wedge sits ON-AXIS, firing into the capsule's most sensitive angle. Raise the send: a 2.5 kHz ring builds until it howls." Named "Acoustic feedback: the wedge is aimed into the microphone and the send is too hot — reposition, reduce, then notch". ✓✓. |
| Where a beginner gets lost | (1) **"Monitor EQ · Not in the monitor path."** A station that the map itself calls "Monitor EQ" reports that it is not in the monitor path: a contradiction a beginner cannot resolve. (2) The Aux output reads "OK" while saying the send is "+6 dB — hotter than anything else": the learner sees a problem under an OK badge and does not know whether to stop there. (3) The right option is a 20-word sentence with the full fix; the other three are 2-4 words ("A faulty cable", "A digital clock error", "A ground loop"). (4) "cardioid", "capsule", "on-axis", "2.5 kHz", "notch". |
| What works | This is the case that ties TROUBLESHOOT to OPERATE module 4 (ring-out): the fix order "reposition, reduce, then notch" is the same rule. The relabelled monitor path again helps. |
| Suggestions | 1. Give the Monitor EQ station a real reading on this case ("No notch set yet: the EQ is flat") or hide stations that are not in the path. S. 2. Badge the aux output "HOT" (the send is part of the cause) or say "Hot, but a hot send alone does not ring: keep walking". S. 3. Cross-link: "Practise the fix in OPERATE · Ring-out". S. 4. Same option-shape fix as the other groups. S. |

Re-walked for the goal: Digital clocking problem (G5b's case; Stage input → Console IN, ✓✓). Then "✓ Solve all 3 faults" and "✓ Solve at least one with a source-forward walk".

### FINISH › (what a beginner sees after the last case)

"WHERE YOU ARE · SOUND SYSTEMS · TROUBLESHOOT · **LAB COMPLETE** · Every page is done. Review any of them, or practice the whole lab again. PRACTICE AGAIN clears nothing you have done. ✓ 6 DONE · REVIEW ▾ · PRACTICE AGAIN FROM THE START · DONE · BACK TO SOUND SYSTEMS · DISCUSS THIS LAB ›", then again "Practicing again or reviewing never clears what you have already done." An intro card for this page opened over it: "WHERE TO START · Tap the first page still listed to jump straight to it." (there are none listed).

| Field | Notes |
|---|---|
| Where a beginner gets lost | (1) "LAB COMPLETE" after one of the lab's practice modes (TROUBLESHOOT); LEARN, BUILD, ROUTE and OPERATE are separate. A beginner may think the whole Sound Systems lab is finished. (2) The intro card's "tap the first page still listed" when nothing is listed. (3) The "clears nothing" reassurance appears twice in a few lines. (4) No recap of what was learned: 22 faults, how many with a forward walk, the five lessons of the groups. |
| What works | A clear end, a way back, a way to practise again, and the promise that nothing is lost. |
| Suggestions | 1. Say "TROUBLESHOOT COMPLETE" and show the other modes with their state ("LEARN ✓ · BUILD 3/10 · ROUTE ✓ · OPERATE 3/5"). S. 2. Add a three-line recap: "22 faults solved, N by a forward walk. The rule: start where the symptom says it is fine, walk forward, stop at the first reading that changes." S. 3. When nothing is left, change the card's WHERE TO START to "Everything here is done: review a group or go back to Sound Systems." S, SHARED (what's-left page). 4. Keep one "clears nothing" line. S, SHARED. |

---

### TROUBLESHOOT · G5c cross-case findings (16 cases walked, adds to G5b's list)

1. **The answer is reachable without the walk, in four ways**: (a) the FAULT tray stays open from the previous case, so the options are visible at 0 probes, and an answer at 0 probes counts as solved (✓, module 2 case 6); (b) the case title repeats the right option (Intermittent cable; Subwoofer receives vocals; Ground loop); (c) the right option is usually the longest and the only one carrying a fix (hum, ground loop, pre-fader, delay, feedback, amp clips); (d) the setting line (G5b) and the module LAB NOTES ("The console is usually the station", "The processor and the loudspeakers are the stations") say where to look. Suggestion: options of equal shape (place + cause, no fix); FAULT locked until the first probe and reset per case; card shows symptom + neutral system only; drop "is usually the station" lines. M.
2. **The walk's evidence disappears**: only the latest reading's sentence stays on the page, though the debriefs refer back to earlier ones ("Console and processor both show left and right"). Suggestion: a running walk log under the card. M, SHARED (bench).
3. **Grading is inconsistent for the same mistake**: a wrong name forces one more probe; if that probe is forward the grade stays ✓✓ (module 3 case 1), if it is backward it drops to ✓ (G5b, module 2 case 1). "Look at that reading again" cannot be done (a re-probe of the same station is ignored). And "You jumped backward" appears when a learner who started at the far end comes back to the right start (module 4 case 3, module 6 case 2), then vanishes, leaving a ✓ with no visible reason. Suggestion: grade = (right answer) + (started at the hint, walked forward) + (wrong guesses: n), each shown in words. S-M.
4. **Badges that confuse**: "OK · DISTORTION", "OK · INTERMITTENT", "OK · HUM", "OK · WRONGCONTENT" (run-together), "LOW · LIMITING", and stations that contradict their own name ("Monitor EQ · Not in the monitor path"; a powered top split into "Powered cabinet · OK" + "Loudspeaker · HUM"). Suggestion: no "OK" on the station where the fault shows; badges in plain words. S.
5. **Phone layout**: FAULT options scroll sideways and are cut at both edges once a long one is chosen (module 3); trays stay open over the NEXT button so the first tap is lost (every module change). M, SHARED.
6. **What works, across all 16**: readings that are real technician observations and teach on their own ("Mute them all: the hum continues", "the buzz moves with the box", "the LINK LED blinks off when the door moves", "the sub send is for low sources such as kick, bass, floor tom and keys"); stations that relabel for monitor and powered paths; debriefs that teach one rule each ("A limiter set for a smaller box protects a box you do not have."); the module 5 crossover case that clears the module 4 look-alike in one probe; a real link to the app's Delay from Distance calculator.

**Hobbyist (all 16):** the best-written part of the lab for them; they will finish all 22 quickly, and the giveaway cards will make it feel easy rather than earned.

---

## OPERATE · Modules 3 and 4 · the drag lanes G5b could not move (both modules finished: all goals ✓)

**How the lanes were moved (tool note):** a scripted slow touch-style drag on the lane (pointer-down at the current value, 20-40 small moves about 40 ms apart, pointer-up), as the coordinator suggested; and a real double-click from the browser tool for the "double-tap = unity" gesture. Both work: the values, readouts and goals change exactly as a finger would make them. One thing a phone check should confirm: on these OPERATE lanes the value moved LESS than the drag (a drag over 24 % of the strip moved the preamp 17 points; one over 12 % moved it 5), while on the DJ lanes it moved more. A finger may need several passes to cross the range.

### Module 3 · Establish gain structure (3 of 3 goals ✓) · `#labpreview/SoundSystemsOperate` → MODULE 3 / 5

| Field | Notes |
|---|---|
| Pressed | PREAMP lane +60 → +50 → +47 → +38 dB → key (WHICH STAGE) → Channel fader → double-tap the lane → key → Main fader → double-tap → key → Amplifier input attenuator → lane 0 → −9 → −14 → −16 dB. |
| Feedback, step by step | Start: "AT SPEAKER −10 dBu · ABOVE NOISE 69 dB · HEADROOM CLIP · VERDICT CLIPPING" and "Clipping at the preamp gain…". +50 dB: "HEADROOM 0 dB · VERDICT TIGHT" and "✓ No stage clipping". +38 dB: "HEADROOM 12 dB · VERDICT NOISY", "✓ At least 12 dB headroom at every stage", and the page now explains the opposite fault: "Too much of the gain is late in the chain. A starved preamp sits close to its noise floor, and every later stage amplifies that hiss… Raise the preamp, lower what follows." Fader double-tap: "FADER 0 dB · Channel fader · unity" (the hidden gesture works; the label even says "unity"), "HEADROOM 6 dB · TIGHT". Main double-tap: "MAIN 0 dB · unity", then **"HEADROOM CLIP · VERDICT CLIPPING"** and "Clipping at the amplifier input attenuator." Amp attenuated: −9 dB "TIGHT, 5 dB… take a few dB off the gain that put it there, usually the preamp", −14 dB "10 dB", −16 dB: "HEADROOM 12 dB · VERDICT OK" and "Unity through the middle, headroom at every stage, the preamp doing the work, the amplifier attenuated so it is the last thing to clip: this is the structure a professional system is set to." with "✓ Verdict OK — unity through the middle". |
| Where a beginner gets lost | (1) **Ticked goals contradict the live verdict.** After the main fader went to unity the verdict read CLIPPING again while "✓ No stage clipping" and "✓ At least 12 dB headroom at every stage" stayed ticked (they latch the first time they are met). A beginner reads the ticks as "this is still true". (2) **Doing the procedure in order makes it clip.** The page says "return [each later stage] to unity … and attenuate the AMP": returning the main to unity before the amp is attenuated sends the amp into clip, which is alarming if you do not expect it; the line does not warn "it will clip at the amp until you attenuate it". (3) The advice under TIGHT says "take a few dB off … usually the preamp", while the page's procedure (and the fix that worked) is to attenuate the amp: two different "next moves" for the same state. (4) "double-tap" is the only way to hit unity exactly and is hidden (G5b); it does work. (5) The instruction line keeps saying "The lane is the PREAMP" after the lane has become FADER / MAIN / AMP. |
| What works | Every state has its own sentence (CLIPPING at a named stage, TIGHT with the dB left, NOISY with "a starved preamp… amplifies that hiss"); the verdict word on the strip; "unity" printed in the lane label when you land on it; a closing line that names the professional structure. |
| Suggestions | 1. Show goals as live states (✓ while true, ○ again when lost) or say "met once" until the final verdict holds. S. 2. Reorder the instruction: "1 · Preamp down until no CLIP. 2 · Attenuate the AMP about 15 dB. 3 · Bring fader and main to unity (double-tap)." so nothing clips on the way. S. 3. Make the TIGHT advice name the stage that should give ("take it off the AMP here: it is the stage with too little room"). S. 4. A visible UNITY button next to the lane (G5b). S, SHARED. 5. Let the instruction line follow the lane ("The lane is now the AMP attenuator"). S. |
| Hobbyist | A clear, physical demonstration of gain staging; the clip-at-the-amp surprise is a real lesson once it is explained. |

### Module 4 · Ring-out and soundcheck (2 of 2 goals ✓; one beginner shortcut tried)

| Field | Notes |
|---|---|
| Pressed | W1: SEND lane −18 → −8 dB (rings) → POSITION "In the null" → SEND to −6 dB. W2: WEDGE → Wedge 2 → POSITION null → SEND −6. W4 (shortcut on purpose): SEND −6 first (rings) → NOTCH only → POSITION null. W3: SEND −6. |
| Feedback | W1 at −8 dB: "W1 SINGER −8 dB !" on the strip, "Wedge 1 · Singer · −8 dB · live angle · RINGING — 4 dB over" in the list and "LOOP GAIN OVER UNITY — RINGING" on the stage. In the null: "LOOP STABLE · SEND −6 dB", "in the null · 6 dB of margin". The shortcut: W4 at −6 dB in the live angle "RINGING — 6 dB over"; NOTCH alone: "live angle · notched · RINGING — 2 dB over" (the model shows that a notch is not enough: good); POSITION null: "in the null · notched · 10 dB of margin". W3 (already in the null) up to −6: "✓ Every wedge at −6 dB or louder · ✓ No wedge ringing" and "Every wedge is loud enough and none rings. Now the band can play — a common soundcheck order: drums, bass, guitars, keys, vocals, then all together." |
| Where a beginner gets lost | (1) "margin" is still undefined (G5b). (2) Notching before positioning is allowed and left on (W4 ends "notched" though it did not need it once in the null); the page's rule "NOTCH only the frequency that rings" is not checked, and no message says "you notched before moving the wedge: try without the notch now". (3) The SEND lane snapped neatly to −6 dB each time, which is helpful; nothing tells the learner that −6 is the target except the goal text. |
| What works | RINGING with "N dB over", LOOP GAIN OVER UNITY / LOOP STABLE as a single-line state, the four-wedge list as the scoreboard, and the soundcheck order as the closing step (a real-world "what next"). |
| Suggestions | 1. Define margin under THE FOUR WEDGES ("margin = dB you can still add before it rings"). S. 2. When a notch is on a wedge that no longer needs it: "Wedge 4 is in the null with 10 dB of margin: the notch can come out (a notch also colours the sound)." S. 3. Mark −6 dB on the SEND lane. S. |
| Hobbyist | Works well as a practice drill; the notch-is-not-enough moment is the useful surprise. |

**OPERATE overall (adds to G5b):** with the lanes movable, both middle modules are complete and well fed back. The two weak spots are latched goal ticks that disagree with the live verdict (module 3) and rules that are stated but not checked (order of fixes in modules 3 and 4).

---

## SOUND SYSTEMS LAB · G5c verdict (TROUBLESHOOT 16 cases + OPERATE 3-4; adds to G5 and G5b)

**The beginner's journey in these parts.** TROUBLESHOOT is the friendliest place in the lab to practise thinking: every case is a real customer complaint, every station reading is something a technician would actually see, and every debrief leaves one rule to keep. But a beginner can reach "solved" without the thinking: the answer tray is open before the first probe, the right answer is often the longest option or the case title, and earlier readings vanish so the walk cannot be reviewed. OPERATE 3 and 4, once the lanes move, are complete and honest models; their weak point is ticks that stay on when the state is lost.

**3 biggest orientation problems (this pass)**
1. The answer is reachable without the walk (open FAULT tray at 0 probes, title = answer, longest option = answer, LAB NOTES "the console is usually the station").
2. The evidence trail disappears (one reading at a time), so the debriefs refer to sentences the learner can no longer see; and grade messages ("jumped backward", ✓ vs ✓✓) change without a visible reason.
3. Labels that say the opposite of the state: "OK · HUM / DISTORTION / INTERMITTENT", "OK · WRONGCONTENT" (run-together), "Monitor EQ · Not in the monitor path", latched "✓ No stage clipping" next to "VERDICT CLIPPING".

**3 best things**
1. Readings as real observations ("Mute them all: the hum continues", "the buzz moves with the box", "the LINK LED blinks off when the door moves").
2. Debrief rules a beginner can keep ("A limiter set for a smaller box protects a box you do not have."; "Two circuits, two grounds, one cable shield joining them.").
3. Stations and models that change with the system (monitor path relabelled; notch alone still rings; "unity" printed when you land on it).

**"First 30 seconds" for a TROUBLESHOOT case (rewrite suggestion):** "A customer says: 'Only the right side is playing.' Your job: find the first place the signal goes wrong. Start at CONSOLE OUTPUT (everything before it is fine). Tap it and read what you find; each reading stays in your notebook below. Keep walking right until a reading is different. Then tap FAULT and say what broke." (FAULT locked until the first probe; four short, same-shape answers.)
