# Game Audio Lab — AUDIT 2 · LEARNING and WORDS (auditor LRN)

**Date:** 2026-11-12 (night) · **Lens:** dimension 7 User learning, dimension 8 AI slop / text errors.
**Method:** read-only, sound off, no browser (not part of this lens). Every statement below is read from the source, word by word: all 22 `pages\pNN*.tsx`, all 23 guides, every `pages\data\*.ts`, `gaTerms.ts`, `bits.tsx`, `GaLab.tsx`, `GameAudioLabScreen.tsx`, the `ch*.tsx` views, the labels of `scene\GaScene.tsx`, every `log(` string in `model\gaModel.ts`, `model\gaDefs.ts`, the asset labels in `sounds\gaSoundBank.ts`, the owner's specification PDF (text extracted with pdftotext), the approved plan and the first handoff. `REVIEW1_LEARNING` was opened only after these findings were formed.
**Paths:** short paths are under `C:\Users\profe\dev\ape-workbench\src\screens\lab\gameaudio\`.
**Evidence:** `C:\Users\profe\AppData\Local\Temp\claude\e45de0ce5238aca8\f5e8364b-06db-4f2e-9d53-2c6c9d3fd6d3\scratchpad\ga_audit_lrn\` (`measure.txt`: words per page, sentences over 25 words, check option lengths; `strings.json`: every learner string with file and line; `spec.txt`: the specification as text).

**Counts:** S1: 1 · S2: 19 · S3: 17 (several S3 are grouped lists with every occurrence).

---

## 1. Verdict per page

What each page teaches, in one sentence (where I could not write one sentence, the cell says WEAK and the finding says why).

| # | Page | In one sentence | Teaches its idea | Practice | Checks | Wording |
|---|---|---|---|---|---|---|
| 1 | Welcome and safe listening | Start any sound low, then raise it; this is how every page is laid out | WEAK · three ideas, counts too early (L-12) | PASS | PASS | WEAK · instance/voice before taught |
| 2 | Sound that reacts | An event starts a sound; a parameter changes one that is already playing | PASS | PASS | PASS | PASS · two small edits |
| 3 | Where games run | Platform, delivery and output are three separate questions | PASS | WEAK · opens cards only (L-21) | PASS | WEAK · PHONES, HYBRID (L-07) |
| 4 | Kinds of games | (two) Kinds of game differ in what matters; the listener need not be the player | WEAK · two ideas, title names one | PASS | WEAK · first idea unchecked (L-22) | WEAK · JUMP/QUEST, "face up the picture" |
| 5 | Kinds of game sound | Sounds are grouped by job; importance is the message, not loudness or family | WEAK · about 16 new terms | PASS | PASS | WEAK · SPEECH vs DIALOGUE, "sfx" |
| 6 | From source to game build | A sound plays only if file, event and scene connection all hold | WEAK · "three things" then five (L-13) | WEAK · fault card after the check (L-10) | PASS | WEAK |
| 7 | Events and instances | One event, many instances, each with its own values; a loop needs a stop | PASS | PASS | PASS | WEAK · machine/generator, filler |
| 8 | Triggers, states, switches | Four kinds of game information; some are local, some global | PASS | WEAK · goal 2 unclear (L-23) | PASS | FAIL · Game Syncs contradiction (L-01) |
| 9 | Variation and layers | (two) Several takes hide repetition; one event can play several layers | PASS | PASS | WEAK · variation unchecked (L-22) | PASS |
| 10 | Loops, ambience and zones | A loop needs a prepared join; a bed starts once and cross-fades at a zone edge | PASS | WEAK · raw-cut goal is a selection; fault after check | PASS | WEAK · YARD/ROOM, cross-fade |
| 11 | Emitters and distance | Distance sets level, angle sets pan; pan cannot tell front from back | PASS | PASS | PASS | WEAK · GENERATOR / GENERATOR 1, "rendered" |
| 12 | Walls, doors and rooms | A closed door here is an authored level change and filter, not physics | PASS | WEAK · "Hear…" goal (L-14) | PASS | WEAK · said three times |
| 13 | Output formats | Stereo, headphone 3D and mono are different outputs | WEAK · 3 outputs vs 3 other ideas (L-15) | WEAK · unheard, nothing shows the difference | PASS · length cue | WEAK |
| 14 | Adaptive music | Layers share one clock; a change waits for a boundary; the newest request wins | PASS | WEAK · "wait until the log says" under an open tray (L-08) | PASS | WEAK · MOOD vs STATE, BPM |
| 15 | Dialogue and languages | Priority decides which line speaks; text follows the audio file | PASS | PASS | WEAK · priority unchecked | WEAK · "until real lines are recorded" (L-11) |
| 16 | The game mix | Sounds feed buses; turn others down for speech, do not raise the master | WEAK · 374 words, six ideas (L-06) | PASS | PASS · length cue | WEAK · "After DUCK off" (L-09) |
| 17 | Budgets and voice limits | When voices run out, priority decides who is stolen or refused | WEAK · voices + memory + five budgets | PASS | PASS | WEAK · "oldest among equals", "nor is" |
| 18 | Multiplayer sound | A game sends what happened; each machine plays its own sound once | PASS | PASS | PASS | PASS · small edits |
| 19 | Testing and fault finding | Find the fault in the log before you fix it | PASS | PASS | WEAK · one give-away distractor | WEAK · FIX labels differ from earlier pages |
| 20 | Finding your way in the tools | Tools share kinds of window; names differ, ideas stay | WEAK · names half unused, Unity is mostly dashes (L-05) | none (reading page) | WEAK · no check uses a tool name | PASS · one odd option |
| 21 | Game audio today | Implementation is its own knowledge; procedural is not AI | PASS | none (reading page) | WEAK · filler distractors (L-20) | PASS · two edits |
| 22 | Capstone and free play | The lab's ideas work together in one scene | PASS | WEAK · scripted, nothing to plan (L-04) | PASS · optional | WEAK · WORLD, tray heads |
| — | End screen | What is left, by page | PASS | n/a | n/a | PASS · see L-36 |

---

## 2. Findings, most serious first

### S1

**L-01 · page 8 (and 20) · learning + wording · S1 — the page teaches a wrong meaning of "Game Syncs", and the lab contradicts itself three ways.**
WHAT: `pages\p08GameSyncs.tsx:180` "Together these are often called Game Syncs." "These" are the four kinds just defined: trigger, switch, parameter, state. (a) The term chip on the same page, `gaTerms.ts:60`, lists three: "choices from a list (switches), game-wide modes (states) and numbers that keep changing (parameters)". (b) `pages\p20Tools.tsx:73` then says "This lab uses the word trigger for anything that starts a sound. In Wwise, the word Trigger means one thing only: the Game Sync that starts a music stinger." So the lab's trigger (a foot contact) is not a Game Sync at all. (c) "often called" presents one product's name (Wwise) as the general word.
WHY: this is a glossary term the owner asked to be matched exactly, taught on the page whose job is to define it. A learner who opens FMOD or Unreal and looks for "Game Syncs" finds nothing. (One line for the accuracy auditor: confirm the Wwise list.)
FIX, ready to paste at `p08GameSyncs.tsx:180`: "Wwise groups switches, states and parameters under one name: Game Syncs. A link from a game number to a sound setting is an RTPC, and a list of switch choices is a switch group. These are general meanings: each tool has its own names."

### S2

**L-02 · every page with the scene · wording · S2 — the activity log prints its key word twice on most rows.**
WHAT: `bits.tsx:188-189` prints the kind word (START, STATE, MUSIC, NETWORK…) in its own column, then the text. The model's text begins with the same word. Rows therefore read, from the code: "START  START Door · door → sfx bus", with sound off "START  START (not heard: sound is off) Door · door → sfx bus", "STATE  STATE mood = alert (a global state…)", "MUSIC  music: three layers START together…", "MUSIC  music: STOP", "NETWORK  network: action A1 arrived AGAIN…". The screen-reader label does the same ("START: START Door…", `bits.tsx:182`; `pages\chdKit.tsx:100,111`).
WHERE: `model\gaModel.ts:614` (START), `:907` (STATE), `:684, 691, 696, 916, 924, 936, 1211` (music:), `:1055, 1062, 1066` (network:).
WHY: the log is the lab's instrument; this is the first thing the owner will read after his first key press. NOT seen on screen (no browser in this lens): the two walking auditors can confirm in one glance.
FIX: drop the repeated word from the text. `:614` → `` `${def.label} · ${layer.id}${take}${late} → ${busWord} bus${c.s.soundOn ? '' : ' (not heard: sound is off)'}` `` (row: "START  Door · door → effects bus"). `:907` → "mood = alert (a global state: everything that reads it changes)". Music lines: remove "music: ". Network lines: remove "network: ". The guides' phrases still hold ("each START line says the sound was not heard"). Tests that pin these strings will need the same edit.

**L-03 · pages 5, 6, 16, 19 and every log · wording · S2 — developer names are shown to the learner, and the lab apologizes for them five times.**
WHAT: the log and the page 6 EVENT card print the model's bus ids "sfx" and "ui" (`model\gaModel.ts:614` "→ sfx bus"; `pages\data\chbPipeline.ts:74` `BUS` row prints `ev.bus`). The lesson then explains the leak instead of fixing it: `pages\data\gaFamilies.ts:73` "The log writes this category as “sfx”.", `:75` "…as “ui”.", `pages\data\gaMix.ts:26` "The log calls it sfx.", `:29` "The log calls it ui.", `pages\p16Mix.tsx:227` "In the log, sfx means effects and ui means interface.", `pages\data\gaFaults.ts:83` "This one reads “→ sfx bus”. In this lab, sfx is the effects bus."
Also raw ids in log text: "posted by player", "TRIGGER foot contact · player · SWITCH surface = stone" (`gaModel.ts:533, 773`) while every control and label says YOU; "generator-1" (`:826, 843, 873-880`).
WHY: one thing must have one name; a second-language reader should not have to map "sfx" to EFFECTS on four pages.
FIX: print the control's word in the log: effects, interface, YOU. Then delete the five apologies above (corrected hint for `gaFaults.ts:83`: "This one reads “→ effects bus”."). "generator-1" can stay if the tray chips and scene label say the same thing (see L-07).

**L-04 · page 22 · learning · S2 — the capstone is a walkthrough, so it proves that the learner can follow steps, not that the ideas are connected.**
WHAT: steps 2 and 3 name every key in order (`pages\p22Capstone.tsx:295` "Open WORLD, switch SCENE on and press OPEN DOOR. Then open MOVE and press STEP FORWARD until you are inside the workshop."; `:300` "In WORLD, switch GENERATOR 1, ALARM and VISUAL CUE on and press GUIDE LINE. Close the tray and move the slider… In MUSIC, switch MUSIC on and choose ALERT."). Following those two lines meets all seven goals. The goal chips themselves also name the control ("Run the ALARM with its VISUAL CUE on").
WHY: the specification asks the capstone to make the learner "connect" seven behaviors; the plan says "wires a clean scene". Nothing here asks the learner to decide anything or to recall which idea produces which result. It is the one page that should not read like the other 21.
FIX: state the brief, keep the help one tap away.
- Step 2 Do: "Wire the scene so that all seven goals in step 4 are met. Any order works. Everything you need is in MOVE, WORLD and MUSIC."
- Step 2 P: "After each action, read the log. It shows what the audio side did with your request."
- Step 3: keep the three sentences that say what to look for; delete the Do.
- Put the present key-by-key lines behind a SHOW A HINT button under each goal chip (the `FaultCard` hint pattern already exists in `bits.tsx:240`), one hint per goal. Draft hints (to be checked against the test's reference run): 1 "MOVE: STEP FORWARD on the stone path, then GO: GRAVEL and step again." 2 "WORLD: GENERATOR 1 · ON. Close the tray and move the slider." 3 "WORLD: SCENE · ON and OPEN DOOR. Then MOVE: GO: WORKSHOP." 4 "WORLD: OPEN DOOR. The rattle follows one second later." 5 "WORLD: GUIDE LINE." 6 "MUSIC: MUSIC · ON, then ALERT. Wait for the next bar." 7 "WORLD: ALARM · ON and VISUAL CUE · ON."
- Goal chips as results, not key names: "Footsteps on two surfaces, with two takes on one" · "A generator whose speed changes while it runs" · "One cross-fade at the doorway" · "A door with its second layer" · "A line that ducks the mix" · "A music change that lands on a bar" · "A warning the player can also see".

**L-05 · page 20 · learning · S2 — the page that carries the owner's outcome exercises only half of itself, and leaves Unity nearly blank.**
WHAT: (a) the four checks (`pages\p20Tools.tsx:78-146`) all test "which kind of window"; none requires reading a name card. A learner can pass the page without looking at one Wwise, FMOD, Unity or Unreal name. (b) On the twelve name cards Unity shows a dash on six: Event, Instance, Parameter, Switch, State, Sound bank (`pages\data\gaToolMap.ts:55, 64, 75, 84, 93, 129`). "A dash means the tool has no close idea of its own" (`p20Tools.tsx:71`) is honest, but it leaves a learner who opens Unity with nothing to look for in place of the lab's central idea.
WHY: the owner's words are "recognize and orient themselves quickly" in Unreal, Unity, FMOD Studio and Wwise. Recognition of names is the outcome; it is the one thing not practiced.
FIX: (1) add two recognition checks that can only be answered from the cards, for example: "In FMOD Studio you want one footstep event to sound different on gravel. Which name do you look for?" → "Labeled parameter" (others: "Group bus", "Snapshot", "Multi instrument"); "In Unreal Engine's own audio, where do the effects meet before the master?" → "Sound Submix" (others: "Audio Component", "Control Bus Mix", "Sound Cue"). (2) Under the Unity line of the Event card, say what Unity does instead of a dash. Draft for the accuracy auditor to verify before use: "Unity's own audio has no event layer. A script tells an Audio Source to play." (3) Optional: a three-line "First five minutes in a new tool" list before the cards: "1. Find the event list and audition one event. 2. Find the bus it feeds in the mixer. 3. Connect the profiler and press play."

**L-06 · all pages · learning · S2 — every page is over the planned length; pages 16, 17, 21, 18 and 14 are far over.**
WHAT: prose only (the P, Do, Look and Note text; cards, term chips, trays and checks are extra), measured from source (`measure.txt`):

| p | words | p | words | p | words | p | words |
|---|---|---|---|---|---|---|---|
| 1 | 288 | 7 | 280 | 13 | 271 | 19 | 272 |
| 2 | 295 | 8 | 295 | 14 | 303 | 20 | 292 |
| 3 | 281 | 9 | 284 | 15 | 279 | 21 | 322 |
| 4 | 286 | 10 | 277 | 16 | **374** | 22 | 272 |
| 5 | 292 | 11 | 281 | 17 | **339** | | |
| 6 | 267 | 12 | 297 | 18 | 315 | | |

The plan said 150–260. No page is inside it.
WHY: on a phone the well shows about 8 lines under the pinned scene; 300 words is about 45 lines of scrolling before the practice.
FIX: section 3 below names, page by page, the sentences that can go without losing the lesson. With those cuts 14 pages reach 260 or less; pages 5, 8, 16, 17 and 18 stay at 265–310 unless a second idea is moved (16: move the SIGNAL PATH paragraph and card to page 2, where the specification's lesson 1 wanted control and sound told apart; 17: give the MEMORY card its own heading after step 3).

**L-07 · lab-wide · wording · S2 — "one name for each thing" is not true yet. The first handoff's claim ("GEN 1 everywhere", "SCENE is SCENE everywhere") does not hold.**
Every remaining case found by reading and by grep is in section 4 (table). The ones a learner will trip on:
- The generator has six names: GEN 1 (dock key page 2; readouts pages 7, 12; key value page 11), GENERATOR 1 (tray chips on pages 4, 7, 8, 11, 12, 16, 17, 19, 22), GENERATOR (scene label when there is one, `scene\GaScene.tsx:543`; chip `pages\p11Distance.tsx:52`, in the same tray as "GENERATOR 1 · OFF" at `:57`), generator-1 (log), "machine" (MACHINES key page 7; `pages\data\gaFaults.ts:129, 139` "A LOOP PLAYS WITH NO MACHINE", "REMOVING A MACHINE"), and "the generator". The Do lines follow the split: page 2 "switch GEN 1 on", page 4 "switch GENERATOR 1 on".
- "machine" also means a player's computer on page 18 ("YOUR MACHINE", "THE OTHER MACHINE", `pages\p18Multiplayer.tsx:94-95`). One word, two things, one page apart from page 19's "REMOVING A MACHINE".
- LISTENING: headphones show as "PHONES" on the dock key and the LISTEN readout (`pages\data\gaPlatforms.ts:147`), in a list whose first item is PHONE SPEAKER, on a page whose first card is "Phones and tablets".
- Page 5: with DIALOGUE soloed the SOLO key says SPEECH and the SOLO readout says DIALOGUE (`pages\data\gaFamilies.ts:74`, `pages\p05Sounds.tsx:92-94`). AMBIENCE shows as AMBIENT, INTERFACE as UI.
- Page 10: the readout says YARD / ROOM (`pages\p10Loops.tsx:135`); the tray, the scene labels and the text say COURTYARD / WORKSHOP.
- The global state is the key STATE on page 8 (`pages\p08GameSyncs.tsx:143`), and MOOD on pages 14 and 22 (`pages\p14Music.tsx:112-115`, `pages\p22Capstone.tsx:167`).
- "line" is a spoken line and a log line. They collide in consecutive sentences at `pages\p16Mix.tsx:227`: "The log prints a SETTING line. When the line plays, no DUCK on follows…".
FIX: section 4 gives one name for each, ready to apply.

**L-08 · page 14 · learning · S2 — the step tells the learner to watch something the open tray covers.**
WHAT: `pages\p14Music.tsx:212` "Open MUSIC and press START. Switch PULSE on and wait until the log says APPLIED." The file's own comment (`:81-83`) says the MUSIC tray "stays open and covers the well". The log is in the well. The tray shows PENDING, not the log.
WHY: the learner waits for a line that is not on screen. NOT seen on screen; from the code and its comment.
FIX: "Open MUSIC and press START. Switch PULSE on and watch PENDING in the tray until it reads “Nothing is waiting.” Switch PULSE off and wait again. Then press MOOD ALERT." Same edit in `pages\guides\p14.ts:10`.

**L-09 · page 16 · wording · S2 — "After DUCK off" reads as an instruction to choose DUCK OFF.**
WHAT: `pages\p16Mix.tsx:219` "Press GUIDE LINE. After DUCK off, press CHAT LINE." The MIX tray has a chip named DUCK OFF, and step 3 opens with "In MIX, choose DUCK OFF". Here it means the log line.
FIX: "Press GUIDE LINE. Wait until the log prints DUCK off. Then press CHAT LINE."

**L-10 · pages 6, 7, 8, 10 · sequence · S2 — the TROUBLESHOOT card comes after Check Yourself, and the check has already given its answer.**
WHAT: on these four pages `FaultCard` is rendered after step 5 (`pages\p06Pipeline.tsx:139`, `p07Instances.tsx:155`, `p08GameSyncs.tsx:219`, `p10Loops.tsx:183`). On page 6 two of the practice goals need it, so step 3 sends the learner "to the end of this page", past the check whose correct option is the diagnosis ("The event asks for a file that is not in the build"). On pages 7, 8 and 10 no step mentions the card at all; one of page 10's wrong-answer lines names the fault outright (`p10Loops.tsx:177` "That is the fault on this page: every update starts another copy, and the copies stack.").
WHY: troubleshooting is the strongest practice in the lab, and here it is either spoiled or never reached. Page 19 already does it right: the cards sit inside step 4.
FIX: move each card into step 4 (under the goal chips), as page 19 does, and add one Do line on pages 7, 8 and 10: "Then start the fault on the TROUBLESHOOT card below and find it."

**L-11 · page 15 · wording + learning · S2 — a builder's note is shown to the learner, and the page never says the word the real tools use.**
WHAT: (a) `pages\p15Dialogue.tsx:167` "The voice here is a wordless stand-in until real lines are recorded." "Until real lines are recorded" is a statement about unfinished work. (b) The page is titled "Dialogue and languages" and avoids "localization" because the app's glossary uses that word for hearing where a sound is (`gaTerms.ts:17-19`). Every real tool the owner names calls language versions localization. (c) PRIORITY shows a number (80, 95) and only the guide (`pages\guides\p15.ts:14`) says the higher number wins.
FIX, ready to paste: Note → "The voice here is a wordless stand-in. The caption carries the words. Each Spanish take is the same stand-in played slower, so it is longer and also lower." Add to step 1: "Each line has a priority. The higher number wins." Add one plain Note: "Making language versions of a game is called localization. In this app's glossary, Localization means something else: hearing where a sound comes from."

**L-12 · page 1 · learning · S2 — the welcome page explains instances and voices before the learner has started one sound.**
WHAT: `pages\p01Welcome.tsx:85` "PLAYING counts instances: each sound the game started. VOICES counts the sound files those instances are playing at this moment. One instance can use several voices. SOUND says whether you can hear them." Instances are page 7's lesson (which repeats the same two sentences at `p07Instances.tsx:122`); voices are page 17's.
WHY: page 1 already carries safe listening, the layout of every page, and two honesty notes. A newcomer cannot use "one instance can use several voices" yet.
FIX: "PLAYING and VOICES count what is sounding now. Page 7 explains them. SOUND says whether you can hear it." Also cut "The two reading pages near the end have no sound." (`:95`).

**L-13 · page 6 · learning + wording · S2 — "Three different things result" is followed by five, with three words not yet taught.**
WHAT: `pages\p06Pipeline.tsx:99` "Three different things result. The original asset is the sound file. The authoring data says how it plays: its event, layers, bus and priority. The runtime package is delivered with the game. A build is the packaged version of the game that players run. A sound bank is the kind of package some tools use, not a universal file type." The reader counts asset, authoring data, runtime package, build, sound bank. Layers (page 9), bus (16) and priority (15, 17) have not been taught. The paragraph before it is three triads in a row ("planned, recorded or synthesized, edited and named… imported, given its behavior and connected… packaged, tested and revised").
FIX: "Three things come out of this work, and they are not the same. The asset is the sound file. The authoring data says how it plays: which event uses it and where it is sent. The build is the packaged game that players run, with the sounds inside. Some tools pack the sounds into sound banks: a sound bank is one kind of package, not a universal file type."

**L-14 · page 12 · learning · S2 — a goal says "Hear", which the lab cannot judge and a sound-off learner cannot do.**
WHAT: `pages\p12Walls.tsx:104` goal "Hear the generator through the closed door". It is met when the generator runs while the door is in the way. The specification: "Do not claim that a learner heard a sound simply because they pressed Play."
FIX: "Run the generator behind the closed door".

**L-15 · page 13 · learning · S2 — three outputs are announced, then three other ideas are defined, and the learner is left to match them.**
WHAT: `pages\p13Formats.tsx:110-111` "Three outputs can be heard on this page: stereo, headphone 3D and mono. The ideas behind them are related, not the same. Channel-based audio… Object-based audio… Binaural rendering…". The two lists do not pair one to one (object-based audio is not played here; mono is a downmix). Eight terms on one page; HRTF is used in the body before it is explained (`:121` "with its own HRTF filters"). The "Another is…" in the mistake note (`:124`) joins two unrelated mistakes.
FIX, ready to paste: `:110-111` → "Three outputs can be heard on this page. STEREO and MONO are channel-based audio: every sound is mixed into a fixed set of channels, one for each speaker of a known layout, such as stereo or 5.1. HEADPHONE 3D is binaural rendering: a headphone signal that seems to surround you. Object-based audio is a third idea, not played here: each sound is kept with its position, and the device works out the speaker signals as it plays." `:121` → "Your device does HEADPHONE 3D live. It filters each sound the way a head and outer ears would. That filter is called an HRTF." `:124` → "Thinking headphones need a separate small speaker for each direction. Two speakers are enough: the filtering happens before the sound reaches them." Move "adding a second 3D effect to a signal that is already binaural" to its own plain Note. Cut `:123` ("Two more words you will meet…") and add the Head tracking chip instead (it is defined in `gaTerms.ts:89` and shown nowhere).

**L-16 · 18 of 26 checks · learning · S2 — the correct answer is the longest option.**
WHAT: options are shuffled (`tuning\components\check.tsx:47`), so position gives nothing away, but length does. Character counts, correct option first (`measure.txt`): p2 63/60/39/39 · p3 80/59/68/62 · p4 95/62/51/66 · p6 50/32/30/33 · p11 61/29/46/45 · p12 76/57/46/22 · p13 103/65/46/39 · p14 60/28/22/24 · p15 55/51/37/43 · p16 68/22/40/46 · p17 55/52/47/52 · p18 58/49/56/55 · p19 73/22/40/47 · p20 #2 29/9/16/23 · p20 #3 53/9/12/17 · p20 #4 78/47/45/22 · p21 #1 54/33/12/17 · p7 45/44/43/40. Chance would be about 6 of 26.
WHY: a test-wise learner, or one guessing in a second language, picks the long careful option and passes without the idea.
FIX: shorten the correct option or lengthen the others to within about 10 characters. Ready to paste for the worst:
- p13 `pages\p13Formats.tsx:135` → "Each sound is filtered for each ear before it reaches the two speakers"; others → "Each ear cup holds several small speakers, one for each direction" · "The phone sends 5.1 channels to the headphones, one for each speaker" · "The sound file was saved in a 3D format that holds its direction".
- p4 `p04Games.tsx:203` → "Direction is measured from the listener, and the listener has moved".
- p14 `p14Music.tsx:234-236` → "ALERT for one bar, then CALM at the bar after it" · "Both requests, one after the other" · "Nothing: withdrawing a request stops the music".
- p16 `p16Mix.tsx:241` → "Turn the other buses down while the line plays"; `:242` → "Raise the master level until the line is clear".
- p19: see L-19.
- p20 #3 `p20Tools.tsx:116` → "Game information, where the surface switch is defined" · "The mixer, where each bus has its level" · "The profiler, where each started sound is listed" · "The audition controls, where you play an event by hand".
- p20 #4 `:132` → "The same idea under another name: one choice from a list".
- p21 #1: see L-20.

**L-17 · page 8 · learning · S2 — the "state" half of the page has nothing to see or hear.**
WHAT: `pages\p08GameSyncs.tsx:191` says so itself: "Nothing in the picture or the sound changes here. The Adaptive music page uses this state to change the music." The goal "Change the state of the whole game" is met by choosing ALERT; the only evidence is one log row and a table cell.
WHY: a global state is the one kind of game information the learner does not experience on the page that defines it. (For the animation auditor: this is a page where a control changes nothing on the display.)
FIX (smallest): let the state show in the picture on this page, for example the word ALERT over both characters, since "every object reads this one value". Then cut the sentence "Nothing in the picture or the sound changes here."

**L-18 · lab-wide · sequence · S2 — terms used before the page that teaches them.**
| Term | First used | Taught |
|---|---|---|
| instance, voice | p1 `:85`; voice also carries page 3's BUDGET | p7; p17 |
| bus | p5 `:161` (as an aside), p6 EVENT card | p16 |
| layers, priority | p6 `:99` and EVENT card | p9; p15/p17 |
| emitter | p7 Look `:115`, p10 Look `:143` | p11 |
| trigger | guide p2 `:23` ("the trigger and then the event") | p8 |
| virtual | p11 `:131` | p17 |
| rendered / renderer | log lines (`gaModel.ts:612, 640, 648, 966`), p13 `:146` | never defined |
| protected | p17 `:198, 204` | never defined |
The first three are fixed by L-12 and L-13. For the rest: p7 Look already defines emitter in passing (keep); define "protected" once on p17 ("A protected sound is marked so that its voice is never taken."); replace "rendered" in the log with "played" (the page 11 card already says "VIRTUAL: tracked, not played").

**L-19 · page 19 · checks · S2/S3 — one distractor nobody would choose, on the page about not trusting the picture.**
WHAT: `pages\p19Testing.tsx:183` "Accept it: the door opened, so the sound played". The question has just said "you hear nothing".
FIX: replace with "Check that the door's sound file is in the project folder"; wrong-answer text: "A file in a folder is only an asset. The log shows whether the event asked for it and whether it started." Shorten the correct option (`:180`) to "Read the log: was the event posted, and did a START follow?".

**L-20 · page 21 · checks · S2 — both checks can be passed by matching words; half the distractors are not approaches at all.**
WHAT: check 1 (`pages\p21Today.tsx:74-75`): the question says "with rules the team writes and no AI service"; the correct option says "synthesis and rules a designer wrote"; "A sound bank" and "A musical stinger" are not ways to make wind. Check 2 (`:89-90`): "Procedural audio" and "Adaptive music" are not uses of AI.
FIX check 1: question → "A team wants a wind sound that follows the game's weather value smoothly. They want to write its behavior themselves and use no AI service. Which approach fits?" options → "Procedural audio" · "Generative AI that makes the wind while the game runs" · "One long wind recording with a volume control" · "An AI tool that sorts the wind files before release". New wrong texts: recording → "A fixed recording can get louder or quieter. It cannot change its character with the weather."; sorting tool → "That is help with authoring. It makes no sound." Check 2 options → "Help with authoring" · "Generating sound while the game runs" · "Creating a sound before release" · "None: sorting files is not a use of AI".

### S3

**L-21 · page 3 · practice · S3.** The specification's success for this lesson is that the learner "supplies or selects a relevant test for each" of four platforms. The goal is only "Open MOBILE, DESKTOP, CONSOLE and BROWSER" (`pages\p03Platforms.tsx:95`). FIX: add a second check: "Which test belongs to a browser game?" → "Open the game in a new tab and confirm it does not need sound before the first tap" (others: the suspend-and-resume test, the dock-and-undock test, the stream test, taken from the cards).

**L-22 · pages 4, 9, 10, 15 · checks · S3 — a two-idea page with one check leaves one idea untested.** p4: genre / perspective / play mode are never checked. p9: variation is never checked (the check is about layers). p10: the loop join and the cross-fade are never checked. p15: priority and interruption are never checked. Draft second checks: p4 "A racing game seen from above, played in turns by two people on one screen. Which of these is its play mode?" → "Two players on one screen, in turns". p9 "A footstep event has four takes and AVOID REPEAT is on. Take 2 has just played. What can play next?" → "Take 1, 3 or 4". p15 "The greeting has priority 80 and the warning 95. The warning is speaking and the game posts the greeting. What happens?" → "The greeting is refused".

**L-23 · goal labels that do not say when they are met · S3.**
- `pages\p08GameSyncs.tsx:125` "Change your surface: the guide keeps its own" is met only after YOU step on a second surface and then the guide steps. → "Step on a new surface, then step as the guide: its surface stays".
- `pages\p01Welcome.tsx:58` "Move LEVEL to 40% or lower": if LEVEL is already at or under 40% from an earlier page, the learner must still move it. → "Set LEVEL low: move it to 40% or lower".
- `pages\p04Games.tsx:114` "Turn YOU while the camera listens" → "Move FACING while the camera listens".
- `pages\p18Multiplayer.tsx:116` "Get a double with ID CHECK off" → "With ID CHECK off, send an action again: its sound plays twice".

**L-24 · US spelling and "at once" · S3 — every occurrence.**
- `scene\GaScene.tsx:645` (accessibility label) "metres" → "meters".
- `gaTerms.ts:105` "comes back up afterwards" → "comes back up afterward".
- `model\gaModel.ts:993` "BUDGET: at most 8 voices may sound at once" → "…may sound at the same time". This is the one "at once" the plain-English pass missed (it is in the log, not in a page).
- "put it right" / "put the setting right" (British usage), three places: `bits.tsx:234`, `pages\p19Testing.tsx:165`, `pages\data\gaFaults.ts:135` → "correct it" / "corrected the setting" / "Correct the setting in FIX."

**L-25 · punctuation and capitals · S3 — what the lab does, and where it is not consistent.**
- Em dash: the lesson body never uses one (it uses colons). Headings and the log do. Every occurrence in learner text: `bits.tsx:118` "WORDS ON THIS SCREEN — TAP ONE", `bits.tsx:183` "ACTIVITY LOG — NEWEST FIRST", `pages\chbBits.tsx:195` "TAKES PLAYED — OLDEST ON THE LEFT", `pages\p04Games.tsx:163` "GENRE — WHAT DOES THE PLAYER DO?", and twelve log strings: `model\gaModel.ts:480` (two), `520` (two), `576`, `684`, `691`, `843`, `988`, `1055`, `1062`, `1066`, `1162`, `1211`. FIX: use the lab's own separators: "·" in headings ("WORDS ON THIS SCREEN · TAP ONE"), ":" in log lines ("DUCK on: a line is speaking. Music, ambience and effects turn down").
- Log lines start with a capital key word in most cases (EVENT, TRIGGER, ZONE, BUS, BUDGET, SETTING, OUTPUT, RENDERER, LISTENER, DUCK) and in lower case in others: "voice STOLEN from…" (`:520`), "over the budget:…" (`:1002`), "a second generator was placed…" (`:864`), "generator-2 removed…" (`:876, 880`), "the engine could NOT start…" (`:1195`), "12 crate impacts are posted…" (`:1009`). Pick one.
- `:696` "applied (not heard: sound is off)" in lower case; `:1211` "APPLIED". Page 14 tells the learner to look for APPLIED.
- `:1211` "APPLIED exactly on the beat line / phrase line / request": only "bar line" is English. → "on the next beat", "on the bar line", "at the end of the phrase", "immediately".
- `:513` "the one voice is in use by sounds that are more important or protected" → "…by a sound that is more important or protected".
- `:757` stop reason "(sound went off)" → "(SOUND was switched off)".
- `:292` + `:298` print "SETTING courtyard wind file with no loop preparation: OFF" when the learner chooses PREPARED LOOP → "SETTING courtyard wind file: PREPARED LOOP" / "RAW CUT".
- Control punctuation: "STEP: YOU" / "STEP: GUIDE" on page 8, "STEP · GUIDE" / "STEP · YOU" on page 19 (`pages\p19Testing.tsx:67-68`). Elsewhere "·" marks a state (SCENE · ON). Use "STEP: YOU" on both.
- "ID" is an abbreviation: capitalize it in prose. Lower-case "id" at `pages\p18Multiplayer.tsx:177, 179, 185`, the readout labels' spoken text `:145-146`, the chip label spoken text `:58`, `pages\guides\p18.ts:14, 18, 19, 24`, and the log word "network id check" (`gaModel.ts:293`).
- Degrees: "in steps of 5°" (`pages\guides\p04.ts:18`) and "in steps of 5 degrees" (`pages\guides\p11.ts:18`). Use "5°".
- Contractions: the pages never use them; ten guide lines open with "You’re" (`pages\guides\p01.ts:13`, `p02.ts:13`, `p04.ts:13`, `p11.ts:13`, `p12.ts:13`, `p13.ts:13`, `p16.ts:14`, `p20.ts:14`, `p21.ts:14`, `p22.ts:14`; and "can’t" in `end.ts:19`). → "You are", "cannot".
- Units and numbers are consistent: a space before dB, Hz, m, s; a true minus sign; thousands commas. No finding.
- The glossary's own names are capitalized unevenly and show that way on the chips ("Diegetic Sound", "Loop Point", "Room Tone", "Voice Stealing" beside "Audio listener", "Sound bank"). The lab must match the glossary, so this is the glossary's to fix, not the lab's.

**L-26 · abbreviations never spelled out · S3.** NPC (`gaTerms.ts:40`; chips on pages 5 and 15) → "NPC bark: a short line a non-player character (NPC) says…". HRTF (`gaTerms.ts:87`) → begin "Head-related transfer function: how your head and outer ears…". BPM (`pages\p14Music.tsx:206`) → "at 96 BPM (beats per minute)".

**L-27 · idioms and phrases a second-language reader will misread · S3 — with replacements.**
- "The fault is in." (`bits.tsx:234`), "the first fault that is still in" (`pages\p19Testing.tsx:169`, `pages\guides\p19.ts:14`), "the faults that are in now" (`pages\guides\p19.ts:13`) → "The fault is now active." / "…that is still active" / "…that are active now".
- `pages\p17Budgets.tsx:198` "the oldest among equals. A protected voice is not taken, nor is a more important one." → "…of the least important sound playing. If several are equally unimportant, the oldest one is taken. A protected voice is never taken. A more important voice is never taken." (same idiom in `pages\guides\p17.ts:24`).
- `pages\p17Budgets.tsx:204` "BUDGET does not go below the protected voices sounding." → "BUDGET cannot go lower than the number of protected voices that are playing."
- `pages\p03Platforms.tsx:173` and `guides\p03.ts:25` "The Budgets page fills the budget." → "Page 17 plays enough sounds to reach the limit."
- `pages\p04Games.tsx:186`, `pages\guides\p04.ts:18`, `pages\guides\p10.ts:19` "face up the picture" / "0° is up the picture" → "face the top of the picture" / "0° is toward the top of the picture".
- `pages\p02Reacts.tsx:67` "No sound where you are?" (reads as "at your place in the scene") → "Cannot play sound right now? The log and the rings show what your ears would hear."
- `pages\p12Walls.tsx:136`, `guides\p12.ts:14` "when its sound reaches you fainter" → "as its sound gets fainter where you stand".
- `pages\data\gaPlatforms.ts:98` "Confirm that no sound is needed before the first tap or click" → "Confirm the game does not try to play sound before the first tap or click".
- `pages\data\gaPlatforms.ts:64` "large memory or high speed" → "much memory or a fast processor".
- `pages\data\gaFaults.ts:141` "LEAVES ITS LOOP" (reads as "departs from") → "LEAVES IT PLAYING".
- `pages\data\gaGenres.ts:57` "so the sound of a foot meeting the ground arrives with the picture" (states a wish as a fact) → "…must arrive with the picture".
- `pages\p09Variation.tsx:136` "a take can come twice" → "a take can play twice in a row".
- `pages\p21Today.tsx:68` "Three different things share this name." (depends on the heading) → "Three different things are called AI in game audio."
- `pages\p21Today.tsx:63` "and tries again with the rest of the game team" → "and tests again with the game team".
- `gaTerms.ts:29` and `pages\data\gaToolMap.ts:61` "One single time a sound is actually playing." → "One copy of a sound that is playing now."
- `gaTerms.ts:34` "Where those virtual ears are." (a chip opened alone has no "those") → "Where the listener, the game's virtual ears, is placed."
- `gaTerms.ts:28` "A control for sound that the game turns by itself." → "A sound control that the game moves while it runs."
- `gaTerms.ts:45` "the game simply asks for them by name" → "the game asks for them by name".
- `gaTerms.ts:123` "A powerful game engine" (an advertisement's adjective; Unity is "popular") → "A widely used game engine".
- `gaTerms.ts:121` "The other widely used game audio tool" (implies there are two) → "Another widely used game audio tool".

**L-28 · sentences that say nothing, or say it a third time · S3.**
- `pages\p16Mix.tsx:211` "The picture is the scene. On this page you fill it with sound." → "On this page you fill the scene with sound."
- `pages\p07Instances.tsx:117` "Starting, stopping with a fade, and releasing the voices are different operations. Tools arrange these parts in different ways." Cut both (nothing on the page uses them; "releasing the voices" is undefined).
- `pages\p05Sounds.tsx:142` "The families keep a project organized." Cut.
- `pages\p12Walls.tsx:161-162` and `:179`: "an authored treatment, not a simulation" is said in the plain note, again in the mistake note, and again in the check's explanation. Keep the plain note and the check; cut the mistake note or give it a different mistake ("Expecting the door to change the reverb. The door changes level and tone; ROOM changes the reverb.").
- `pages\p18Multiplayer.tsx:168` the mistake note is a bare list with no consequence → "Treating multiplayer audio as one shared mix. Each machine makes its own. A second mistake: letting a local action and its network copy both play the sound."
- `pages\p07Instances.tsx:115` Look: "You place a second generator below the first." Not true when the page opens. → "The workshop has one generator. On this page you add a second one below it."
- "Each one is marked done when it really happens in the scene." opens step 4 on pages 1, 3, 5, 16, 17, 18 with no noun for "Each one"; pages 2, 6–15 say "Do each of these once. Each one…". Use the second form everywhere.

**L-29 · log lines are named two ways · S3.** Pages name a log line by its first column (GAME line, START line, VALUE line, STATE line, FAULT line, MIX line) and elsewhere by the first word of its text, which sits under a different column word: "a SETTING line" / "the SETTING" (`pages\p12Walls.tsx:160`, `p14Music.tsx:220`, `p15Dialogue.tsx:178`, `p16Mix.tsx:227`, guides `p12.ts:25`, `p14.ts:20`, `p15.ts:26`, `p16.ts:26`) is a MIX row; "a MIX line" (`p10Loops.tsx:155`, guides `p03.ts:24`, `p09.ts:28`, `p10.ts:27`, `p16.ts:27`) is the same kind of row; "the ZONE line" (`p10Loops.tsx:149-150`) is a STATE row on a page that says "The log on this page shows only STATE, MIX and FAULT lines". `guides\p16.ts:26-27` uses both names in two consecutive lines. FIX: name by the first column everywhere and quote the first word: "a MIX line that begins SETTING", "a STATE line that begins ZONE".

**L-30 · glossary terms · data · S3 — 103 terms are defined; 89 are shown.** The first handoff says "103 terms… are used". Fourteen are in `gaTerms.ts` and on no page: Audio pipeline, Trigger (game engine), State group, Switch container, Layer container, Blend container, Seamless music loop, Volume (game engine), Head tracking, Mono compatibility, Music segment, Music transition rule, Audio level of detail (audio LOD), Prefetch streaming. Six of them are ideas the body already talks about without a chip: Audio pipeline (page 6, whose short name is PIPELINE), State group and Switch container (page 8), Layer container (page 9), Head tracking (page 13 `:123`), Music transition rule (page 14 `:220`). FIX: add those six chips; leave or remove the other eight; correct the count.

**L-31 · the same setting has different words on page 19 · S3.** Page 19's FIX tray renames settings the learner used earlier: SURFACE SWITCH "PER CHARACTER" (`pages\data\gaFaults.ts:123`) vs page 8 "FOR EACH CHARACTER"; FOOTSTEP: TAKES "VARIED / ONE TAKE" (`:105-107`) vs page 9 "VARIATION ON / VARIATION OFF"; REMOVING A MACHINE "STOPS ITS LOOP / LEAVES ITS LOOP" (`:139-141`) vs page 7 WHEN A GENERATOR IS REMOVED "STOP ITS LOOP / LEAVE IT PLAYING". FIX: use the earlier pages' words.

**L-32 · page 22 · wording · S3.** (a) Tray headings are in mixed case with brackets, unlike every other tray: "MUSIC (three layers on one clock)", "MOOD (a state for the whole game)", "LAYERS (each change waits for the bar)", "PLATFORM (for your summary; it changes no sound)" (`pages\p22Capstone.tsx:163-204`). → "MUSIC · THREE LAYERS ON ONE CLOCK", and so on. (b) The key that switches the scene's sounds is called WORLD here; it was PLAY (5), MACHINES (7), SCENE (10, 16), SOURCES (11), ROOM (12), SOUNDS (17), TEST (19). On the capstone use the name the learner met most: SCENE. (c) SETUP is this page's summary tray and page 9's variation tray. → SUMMARY was cut for width; "RECORD" fits six letters. (d) "Waiting: add PULSE and DRIVE, for the next bar." (`:160`) vs page 14 "PENDING · …: waiting for the next bar." Use page 14's words. (e) "Wired in the scene" / "Still to wire" in the summary → "Connected in the scene" / "Still to connect".

**L-33 · small naming splits on one screen · S3.** `pages\p15Dialogue.tsx:145, 156`: nobody speaking is QUIET on the key and NOBODY on the readout → QUIET on both. `pages\p16Mix.tsx:192, 203`: duck off is NO DUCK on the key, OFF on the readout, DUCK OFF on the chip → DUCK OFF. `pages\p10Loops.tsx:123` SCENE key value RUNNING / STOPPED; page 1 SCENE readout ON / OFF → ON / OFF. `pages\p11Distance.tsx:119` and `p12Walls.tsx:149` card row "STATE" (Playing / VIRTUAL) uses the word page 8 gave to the game's global state → "STATUS". `pages\p08GameSyncs.tsx:170-171` readouts "YOU ON" / "GUIDE ON" can be read as "you: switched on" (page 7's readout says "ON 40%") → "YOUR FLOOR" / "GUIDE FLOOR". `GaLab.tsx:109` SOUND readout "NO ENGINE" is a builder's word → "NO SOUND". `pages\data\gaToolMap.ts:238` window 7 is named "A way to audition", which then appears as a check option among window names (`p20Tools.tsx:116`) → "The audition controls". `pages\data\gaToolMap.ts:116` "Saved mix setup" is the idea pages 16 and the glossary call a snapshot → "Snapshot (a saved mix setup)". `pages\p18Multiplayer.tsx:57` tray heading "THE SAME ACTION AGAIN · VOICE" → "SEND IT AGAIN · LIVE CHAT". `pages\data\gaMix.ts:97` the SIGNAL PATH control row lists "event · switch · parameter · state" while page 8's four kinds are trigger, switch, parameter, state → say "event" on both or "trigger" on both.

**L-34 · chapters · S3 — the learner sees none; the developer documents disagree.** `pages\index.ts:5-10` describes six chapters (1–5, 6–10, 11–13, 14–15, 16–19, 20–22). The first handoff describes five, A–E (11–15 as one chapter "Space, music and voice"), and the helper files follow five (`chAViews`, `chbBits`, `chcBits` for 11–15, `chdKit`, `cheKit`) while their comments say "Chapter 3, Space, and Chapter 4, Music and voice". No learner string contains the word chapter (grep: none), and the shared shell lists 22 titles with no grouping. A 22-page lab with no visible parts is hard to hold in the head. FIX without touching the shell: begin the Look line of pages 1, 6, 11, 14, 16 and 20 with the part's name, for example "Part 2: from a sound file to a playing sound." (No total is given, so it does not break the rule against "N of total".) And make `index.ts` and the handoff agree on five parts or six.

**L-35 · screen guides · S3.** The guides do speak to the student, about the screen in hand, in order, and name controls as the screen names them (checked line by line against each page's keys and chips; G20's "six words", "twelve cards", "four checks" and G21's "four words", "five sections" all match). Three edits: `guides\p15.ts:18` "The slider starts on it." → "The slider controls it when the page opens." (the phrase every other guide uses); `guides\p05.ts:18` "It is the slider you get when this page opens." → the same; the contractions in L-25.

**L-36 · end of the lab · learning · S3 — nothing says what the lab did not do.** The end screen lists unfinished pages honestly (shared screen; `GameAudioLabScreen.tsx:27-36` gives each kind of page a true line). The end guide recaps in three sentences. Missing is one honest sentence about limits, which the owner's outcome ("generally, not specifically") invites. FIX, for page 22 step 1 or the end guide's `teaches`: "You have not opened a real tool in this lab. Page 20 is the map to take with you when you do."

**L-37 · lab subtitle is never shown · S3 (from code).** `GameAudioLabScreen.tsx:42` passes "How a game asks for sound, and how the audio side answers." The shared shell draws a subtitle only on page 1 of a lab whose first page is not a rack page (`kit\PagedLab.tsx:642`); page 1 here is a rack page. It is the best one-line summary of the lab and no learner reads it. FIX: use it as page 1's Look line, or as the end guide's `learning`.

---

## 3. Length: the sentences that can go, page by page

Cuts are quoted exactly. "→" gives a shorter replacement where one is needed. Word counts are prose only.

| p | Now | Cut | After |
|---|---|---|---|
| 1 | 288 | `:85` whole paragraph → "PLAYING and VOICES count what is sounding now. Page 7 explains them. SOUND says whether you can hear it." · `:95` "The two reading pages near the end have no sound." | ≈ 262 |
| 2 | 295 | `:59` "The log shows both halves, the game’s request and the audio side’s answer." (page 1 said it) · `:65` "With the door closed the sound is quieter and has less treble. Open the door and listen again." (page 12's lesson) · `:67` shorten as in L-27 | ≈ 257 |
| 3 | 281 | `:146` "HANDHELD, XR and CLOUD overlap them." · `:173` → "Nothing plays on this page, so only the limit changes. Page 17 uses it." | ≈ 268 |
| 4 | 286 | `:190` "With more than one player, the team also decides who hears each sound. Players who share one screen share one pair of speakers." (page 18 teaches it) · `:188` "The rings show the level for whoever is listening." | ≈ 254 |
| 5 | 292 | `:142` "The families keep a project organized." · `:161` "The log writes it at the end of each START line." | ≈ 275 |
| 6 | 267 | `:99` rewritten as in L-13 | ≈ 262 |
| 7 | 280 | `:117` "Starting, stopping with a fade, and releasing the voices are different operations. Tools arrange these parts in different ways." | ≈ 261 |
| 8 | 295 | `:180` replaced as in L-01 (same length) · `:191` "Nothing in the picture or the sound changes here." (after L-17) | ≈ 286 |
| 9 | 284 | `:130` "In many engines a pitch change changes playback speed, so a higher step is also shorter." (the Pitch randomization chip says it) | ≈ 268 |
| 10 | 277 | `:150` "The log on this page shows only STATE, MIX and FAULT lines." (the guide says it) · `:155` "A MIX line names the swap." | ≈ 259 |
| 11 | 281 | `:110` "Some sources aim their sound, like a flashlight. That is cone attenuation. The sources on this page send sound equally in every direction." (the chip says it; nothing here shows it) | ≈ 257 |
| 12 | 297 | `:142` "Stand in the courtyard: drag WALK if you are inside." (the page opens there) · `:162` the mistake note (see L-28) | ≈ 264 |
| 13 | 271 | `:123` "Two more words you will meet. Ambisonics… Head tracking…" (chips) | ≈ 262 with L-15's text |
| 14 | 303 | `:215` "With SOUND off the change still waits, and the log says it was not heard." · `:214` "MUSIC shows whether it runs." · `:221` "NOW is fastest, but the change can land between beats." (the NOW chip's own text) | ≈ 273 |
| 15 | 279 | `:178` "Each Spanish take is a longer file." (third time) · `:167` "until real lines are recorded" | ≈ 268 |
| 16 | 374 | `:211` "The picture is the scene." · `:212` "The chat bus carries a stand-in voice for other players." (in the bus chooser) · `:213` "A set of bus levels the game can recall by name is a snapshot." (chip) · `:214` "A duck is a control change. It carries no audio." (the card's own note) · `:221` → "This duck is event-driven: it starts and ends with the line, not with the audio level." · `:227` "The log prints a SETTING line." and "In the log, sfx means effects and ui means interface." | ≈ 313; ≈ 275 if the SIGNAL PATH paragraph and card move to page 2 |
| 17 | 339 | `:191` "Loading and streaming bring a sound from storage. Latency is the delay before you hear it." · `:192` "A limit is a project’s choice, not a property of a platform’s name." (page 3 said it twice) · `:206` "Ask where a number comes from." · card `:119` "A long sound is often streamed from storage." | ≈ 304 |
| 18 | 315 | `:155` "Several players on one screen need the same care: more than one listener, one set of speakers." · `:167` "In this scene the chat line does not turn the game down." | ≈ 287 |
| 19 | 272 | none needed | 272 |
| 20 | 292 | none needed (a reference page) | 292 |
| 21 | 322 | `:63` "Adaptive music follows play with layers and with changes timed to the bar. Profiling is part of the routine: the audio team reads the log, finds the cause, and tries again with the rest of the game team." (restates pages 14 and 19; nothing about today) | ≈ 287 |
| 22 | 272 | step 2 and 3 Do lines move to hints (L-04) | ≈ 215 |

Sentences over about 25 words in lesson text (all of them): `p05Sounds.tsx:141` (29), `p10Loops.tsx:155` (32: "The raw cut is a wind file cut with no loop preparation: it ends in a gust and begins in a lull, so the level jumps at the join every 10 seconds." → "The raw cut was not prepared as a loop. It ends in a gust and begins in a lull. So the level jumps at the join, every 10 seconds."), `p12Walls.tsx:144` (26), `p12Walls.tsx:160` (26), `p19Testing.tsx:154` (26), `p19Testing.tsx:155` (26), `p21Today.tsx:58` (29 → "Spatial tools can place a sound around you on headphones and make it duller behind a wall. Some also find its path around a corner and add the reflections of a room."), `gaTerms.ts:109` (26). In the guides: `end.ts:15`, `p01.ts:9`, `p02.ts:23` (31), `p05.ts:9`, `p12.ts:24`, `p14.ts:13`, `p16.ts:25`, `p17.ts:21` (30), `p19.ts:18` (30), `p20.ts:30`, `p20.ts:36`, `p22.ts:26`, `p22.ts:37`.

---

## 4. One name for each thing: every remaining split

| Thing | Names now (where) | Use |
|---|---|---|
| Generator 1 | GEN 1 (`pages\shared.tsx:51` key; readouts `p07:107`, `p12:129`; `p11:83`) · GENERATOR 1 (chips `p04:76`, `p07:50`, `p08:99-100`, `p11:57`, `p12:85`, `p16:52`, `p17:65`, `p19:75`, `p22:137`; lane text `shared.tsx:44`) · GENERATOR (`scene\GaScene.tsx:543`, `p11:52`, `data\chcSpace.ts:32`, `p08:97, 161`) · generator-1 (log) · machine (`p07:95` MACHINES, `data\gaFaults.ts:129, 139`) | GENERATOR 1 on chips, in Do lines and on the scene label always; GEN 1 only where a readout or key is too narrow, and say so once in page 2's guide. Never "machine" for it: page 7 key GENERATORS, page 19 "A LOOP PLAYS WITH NO GENERATOR", "REMOVING A GENERATOR" |
| A player's computer | machine (`p18:94-95`, body) | keep "machine" for this only |
| Global state | STATE key (`p08:143`) · MOOD (`p14:112-115`, `p22:167`) · "mood = alert" (log, table) | MOOD on the key, with the tray heading "MOOD · A GAME STATE" on all three pages |
| Headphones (listening setup) | HEADPHONES chip · PHONES key and readout (`data\gaPlatforms.ts:147`) | any short form that is not PHONES ("HEADPH", or widen the readout: it already has `flex: 1.3`) |
| Handheld card | HANDHELD chip and title · HYBRID key and readout (`data\gaPlatforms.ts:81`) | no 7-letter form of HANDHELD reads well; simplest is to name the chip and card HYBRID too ("Handheld and hybrid systems" stays as the sub-title) and say HYBRID in the Do line and the guide |
| Kinds of game (dock value) | PLATFORMER → JUMP, ADVENTURE → QUEST, STRATEGY → COMMAND, OPEN WORLD → OPEN, NARRATIVE → STORY, EDUCATIONAL → LEARN (`data\gaGenres.ts:55, 71, 79, 119, 127, 135`) | show a count instead, as PLAY does on page 5: "2 READ" |
| Solo categories | AMBIENCE / AMBIENT, DIALOGUE / SPEECH, INTERFACE / UI (`data\gaFamilies.ts:72-75`) | one word each on key and readout: AMBIENCE (8) needs the wider readout; else AMB, DIAL, UI as page 16's readout codes already do (`data\gaMix.ts:25-30`) |
| Bus ids | EFFECTS / SFX readout code / "sfx" log; INTERFACE / UI / "ui" | L-03 |
| Zones | COURTYARD, WORKSHOP (scene, trays, text) · YARD, ROOM (`p10:135`) · OUTSIDE, INSIDE (`p12:66`) | COURTYARD / WORKSHOP |
| Cross-fade | "cross-fade" (`p10:145, 150`, `guides\p10.ts:9, 33`, `data\gaCapstone.ts:139`, `gaModel.ts:1162`) · "Crossfade" (glossary chip, `gaTerms.ts:71`) | crossfade, as the glossary spells it |
| Headphone 3D | HEADPHONE 3D (chip) · 3D (key, readout) · "head-related 3D" (log `gaModel.ts:966`) · binaural rendering (term) | log: "RENDERER: headphone 3D (binaural)" |
| Not playing because out of range | "tracked, not played" (card) · "tracked, not rendered" (log `:612, 640`) · "rendered again" (`:648`) | played |
| Nobody speaking | QUIET / NOBODY | QUIET |
| Duck off | DUCK OFF / NO DUCK / OFF | DUCK OFF |
| A waiting music change | PENDING (p14) · "Waiting:" (p22) | PENDING |
| Step keys | STEP · STEP: YOU · STEP · YOU · STEP FORWARD · STEP EAST | STEP: YOU, STEP: GUIDE; STEP FORWARD on page 22 is clear as it is |
| The scene-sounds tray | PLAY, MACHINES, SCENE, SOURCES, ROOM, SOUNDS, TEST, WORLD | each page's own name is defensible; only WORLD (L-32) is new for no reason |
| SCENE | toggle key (p1, p13) · tray key holding a SCENE chip (p10, p16: "In SCENE, switch SCENE on") · chip (p5, p11, p17, p22) | on pages 10 and 16 name the tray key SOUNDS, so "In SOUNDS, switch SCENE on" |
| SETUP | variation tray (p9) · summary tray (p22) | L-32 |
| Latch sound | "its loose latch" (p5, p9) · "the latch rattle" (p6, p19) · "rattle layer" · RATTLE | fine: one object, one sound; no change |
| Fan | "a hum and a fan" (p7, guide) · "Generator cooling fan" (asset) · plan said "airflow" | consistent in the lab; no change |
| The audio side | "the audio side" (19 uses) · "audio engine" (3) · "sound engine" (2, in `gaTerms.ts`) | fine |

---

## 5. Were the first review's fixes really made? (checked after my own read)

| Claim in the first handoff | Result |
|---|---|
| "One name for each control. The generator's key is GEN 1 everywhere… SCENE is SCENE everywhere." | NOT TRUE as written. ENGINE is gone (grep: no control named ENGINE). Six names remain for the generator; SCENE is three kinds of control. Section 4. |
| "at once" replaced | One left, in the log: `model\gaModel.ts:993`. |
| Idioms removed | The listed ones are gone. Remaining: L-27 ("is in", "put right", "oldest among equals", "fills the budget", "up the picture"). |
| Long sentences split | Mostly. Eight lesson sentences and thirteen guide sentences are over 25 words (section 3). |
| "voice" defined one way | TRUE: "the sound files those instances are playing at this moment" on pages 1, 7, 17 and guides. (Now too early on page 1: L-12.) |
| Page 20 gained three checks and an eighth window | TRUE (four checks, eight windows). None of the four uses a tool name: L-05. |
| Page 16 gained a signal-path card | TRUE. It arrives on page 16; the specification wanted the two paths told apart in lesson 1. |
| "103 terms are used" | 89 are shown; 14 are defined and unused: L-30. |
| Review 1's own suggested sentence "Together these are often called Game Syncs" | Adopted, and it is wrong: L-01. |
| Fault 4 reachable; page 10 and 11 statements corrected | The texts now agree with each other (not re-run by me; the other auditors drive the scene). |

---

## 6. Noticed in other auditors' areas (one line each, not dug)

- Accuracy: `pages\p11Distance.tsx:109` "the level halves, a drop of 6 dB" (amplitude halves; loudness does not).
- Accuracy: `gaTerms.ts:116` says a game "usually dips its own sound" for voice chat; pages 16 and 18 say this scene's chat ducks nothing.
- Data: `sounds\gaSoundBank.ts:93` the wind asset's label is "Courtyard wind and birds"; it prints on page 17's MEMORY card, and every page calls it "the courtyard wind".
- Logic: `pages\data\gaNet.ts:43` the message always reads "door opened", also when DOOR · NEW ID closes the door.
- Animation: page 10's raw-cut jump and page 13's stereo versus 3D difference have, from the code, nothing on the display that shows them with sound off; page 8's STATE changes nothing on the display (L-17).
- UI: `pages\data\chcMusicVoice.ts:62-66` the PENDING readout shows a fixed number of seconds that looks like a stopped countdown.
- UI: page 22's trays use `LabChip`; every other page's trays use its chapter's `TrayChip`.
- Function: `pages\p20Tools.tsx:66` prints how many log lines the lab has printed; fine, but it counts across every page since the lab opened.

---

## 7. What I could not check, and why

- **Nothing was seen on a screen.** This lens had no browser. Every "the learner sees" above is read from the code: the doubled log words (L-02), the covered log on page 14 (L-08), cut or fitted labels, and whether a tray hides a readout. The two walking auditors can confirm L-02 and L-08 in one look each.
- **No sound was heard** (sound off by instruction). Whether a wording such as "quieter and has less treble", "a short tail of room sound" or "longer and also lower" matches what plays is the sound auditor's.
- **The live glossary was not opened.** I checked that each chip's name is a key of `gaTerms.ts` and read every short meaning; I did not compare the names or meanings with the glossary's database.
- **The PDF's tables** were read as text from `pdftotext -layout`; the sound-family table on its page 6 came out with misaligned columns, so I relied on the lesson briefs (section 8 of the specification) for that lesson.
- **Tool names on page 20** were read for wording only; whether each cell is right is the accuracy auditor's, including the draft Unity sentence in L-05, which must be verified before use.
- **Tests were not run.** Several fixes above change strings that tests pin (the log texts, goal labels, the term list); the test files were not read.
- **The shared shell** (`kit\PagedLab.tsx`, `kit\LabEndScreen.tsx`, `kit\LabNavBar.tsx`) was read only for what it shows this lab (no chapters, the end rows, the unused subtitle), not audited.
