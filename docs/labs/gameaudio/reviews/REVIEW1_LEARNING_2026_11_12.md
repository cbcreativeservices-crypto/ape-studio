# Game Audio Lab — learning-design and language review, round 1 (2026-11-12)

This was an independent, read-only review: nothing in the repository was edited, and no test or server was run.

**Reviewer role:** learning-design and language (a cognitive-learning designer, and an intermediate English learner who has never opened a game engine).
**Checkout:** branch `ota-after-approval-39-23`.
**Read in full:** all 22 pages, 23 guides, the page data, `bits.tsx`, `GaLab.tsx`, `pages/shared.tsx`, `gaTerms.ts`, `model/gaModel.ts`, `model/gaDefs.ts`, `model/gaWorld.ts`.

**Paths.** All paths are repo-relative. Each item gives a full path first. Short names after that mean:

| Short form | Full path |
|---|---|
| `pNN….tsx`, `chAViews.tsx`, `chdKit.tsx`, `chcSpeakerMap.tsx`, `shared.tsx` | `src/screens/lab/gameaudio/pages/` |
| `guides/pNN.ts`, `guides/end.ts` | `src/screens/lab/gameaudio/pages/guides/` |
| `data/….ts` | `src/screens/lab/gameaudio/pages/data/` |
| `gaModel.ts`, `gaDefs.ts` | `src/screens/lab/gameaudio/model/` |
| `gaTerms.ts`, `bits.tsx`, `GaLab.tsx`, `GameAudioLabScreen.tsx` | `src/screens/lab/gameaudio/` |
| `useGaSound.ts` | `src/screens/lab/gameaudio/engine/` |
| `LabShell.tsx` | `src/screens/lab/` |

**Checked and found sound.** Every `Do` line was checked against the page's keys and tray chips: no `Do` names a control that does not exist. No skill promise was found. "must / always / never" appear only in hearing safety (page 1) and one credit line (`guides/end.ts:24`).

**Format.** `[S1|S2|S3] pNN file:line — what is wrong — why it matters — the replacement text or the fix`.

---

## S1

**[S1] p14** `src/screens/lab/gameaudio/pages/p14Music.tsx:202-203` (same in `src/screens/lab/gameaudio/pages/guides/p14.ts:35`) — Step 3 says "Press MOOD ALERT, then MOOD CALM before the phrase ends" and "the log ... says the first request is WITHDRAWN". Step 2 (line 196) already ended on MOOD ALERT, and the reducer ignores a mood that is already set (`src/screens/lab/gameaudio/model/gaModel.ts:892` `if (s.mood === a.mood) break;`). So ALERT does nothing, CALM is the only request, nothing is withdrawn, and the goal "Change your mind while a change waits" (line 161) does not tick by following the page.
- Replace the Do with: "Set CHANGE AT to NEXT PHRASE. MOOD is ALERT now. Press MOOD CALM, then press MOOD ALERT again before the phrase ends. Then press STINGER."
- Guide `tryThis[0]`: "Set CHANGE AT to NEXT PHRASE. Press the MOOD chip that is not lit, then the other one before the phrase ends. The log says WITHDRAWN, and the first change does not play."

**[S1] p14** `src/screens/lab/gameaudio/model/gaModel.ts:1060-1104` with `src/screens/lab/gameaudio/pages/p08GameSyncs.tsx:192` and `p14Music.tsx:196` — Page 8's Do ("open STATE and choose the other value") leaves MOOD ALERT. That sets all three music layers on even with music off (`gaModel.ts:896`), and `enterPage` resets neither mood nor layers. Page 14 then opens with ALERT lit and PULSE/DRIVE already on, so "Switch PULSE on" and "press MOOD ALERT" do nothing and no QUEUED line appears. Also "Switch PULSE on, then off" inside one 2.5 s bar withdraws the first request: goal 3 ticks early and PULSE is never heard.
- Fix: in `enterPage`, when music is off, set mood to calm and layers to calm only.
- Replace the Do with: "Open MUSIC and press START. Switch PULSE on and wait until the log says APPLIED. Switch PULSE off and wait again. Then press MOOD ALERT."

**[S1] p10** `src/screens/lab/gameaudio/pages/p10Loops.tsx:165, 171, 193`, tray chips `80-81`, and `src/screens/lab/gameaudio/pages/guides/p10.ts:32` — "A bed starts once, when the listener enters its zone" is false for this scene and contradicts the page's own step 2 (line 148 "No bed starts or stops; only their levels change") and `p01Welcome.tsx:87`. Both beds start with the scene (`gaModel.ts:658-662`); a crossing only changes gains (`648-656`, `1159-1162`). A student who read the log correctly is marked against a wrong "correct" answer.
- Option 0: "Once. Walking inside the zone does not start it again"
- Explain: "In this scene both beds start once, with the scene, and a crossing only changes their levels. Many games start a bed when the listener enters its zone. In both designs, moving inside the zone starts nothing."
- Fault why: "...each report started the bed again. A bed is started once, not on every position report. ..."
- Guide teaches: "A bed starts once. Here both beds start with the scene and cross-fade at the doorway. Position updates inside a zone start nothing."
- Chip: "ONCE" in place of "ONCE ON ENTERING".

**[S1] p19** `src/screens/lab/gameaudio/pages/data/gaFaults.ts:102-106` with `src/screens/lab/gameaudio/pages/p19Testing.tsx:106-119` — Fault 4 needs YOU outside, but page 19 has no control to turn or place YOU (keys are TEST, FIX, LEVEL; STEP · YOU walks along whatever facing page 13 left). Page 12's goal requires walking into the workshop (`p12Walls.tsx:107`) and pages 13-18 never move you. Inside, both characters are on wood, `stepWrongSurface` (`gaModel.ts:762`) never counts, the fault is never "seen" (`gaFaults.ts:213, 243`), and the page cannot be finished without leaving it.
- Add a TEST row "WHERE YOU STAND: STONE PATH / WORKSHOP" using `chbRoute` (as on pages 8 and 10).
- Symptom: "Start the fault. In TEST, choose STONE PATH so that you stand outside. The guide stands on the wood floor of the workshop. Press STEP · GUIDE and read which surface the log names."
- Hint 2 ending: "...the fault cannot show: choose STONE PATH in TEST."

**[S1] p19** `src/screens/lab/gameaudio/pages/data/gaFaults.ts:52, 54, 60` (and `src/screens/lab/gameaudio/pages/p06Pipeline.tsx:121`) — "THE DOOR MAKES NO SOUND", "no door sound starts", "so nothing could play" are false. Only the door layer is skipped (`gaModel.ts:563-569`); the rattle layer starts one second later, is heard, and prints a START line. This defeats the page's own rule at `p19Testing.tsx:143` ("Only a START line ... shows that a sound played").
- Title: "FAULT 1 · THE DOOR HAS LOST ITS MAIN SOUND"
- Symptom: "Start the fault. Open TEST and press the door key. The door moves in the picture, but its main sound does not start. Only the latch rattle plays, one second later. Read the newest log lines to find the reason."
- Why: "...was not in the build, so the door layer could not play. Only the rattle layer played. ..."
- `p06Pipeline.tsx:121`: "A poor recording still plays. Here the door layer cannot start, because the build does not contain the file the event names."

**[S1] p01 / p20 / p21** `src/screens/lab/gameaudio/pages/p01Welcome.tsx:82, 92` against `p20Tools.tsx:94` and `p21Today.tsx:87` (no `rack`) — "Every page has three parts" and the hearing-safety promise "■ STOP is always the last key in the dock" are false on pages 20 and 21: they have no dock, no SOUND and no ■ STOP (`guides/p20.ts:19`), while the shared session keeps every loop running (`src/screens/lab/gameaudio/GameAudioLabScreen.tsx:11-12`). Page 19 tells the student to switch ENGINE 1 on (`gaFaults.ts:70`), so a loop can play under two reading pages with no stop control.
- Dispatch `stopAll` when a non-rack page opens (or give those pages a STOP control).
- `p01Welcome.tsx:82`: "Every page with the scene has three parts."
- `p01Welcome.tsx:92`: "On every page with the scene, ■ STOP is the last key in the dock, and it stops everything immediately. The two reading pages near the end have no sound."

---

## S2, lab-wide

**[S2] p10 / p12 / p13** — position is carried between pages, but pages assume the start position.
- `src/screens/lab/gameaudio/pages/p10Loops.tsx:147` — page 8's Do leaves you on GRAVEL (4.2, 7.5) with page 4's facing; "Press STEP until you pass the doorway" walks into the wall. Replace: "In SCENE, choose START SCENE and OPEN DOOR. Under GO STRAIGHT TO, choose COURTYARD: you now stand on the stone path and face the door. Close the tray. Press STEP until you pass the doorway, then find the ZONE line in the log. Set FACING near 270° and walk back."
- `src/screens/lab/gameaudio/pages/p12Walls.tsx:143`, goal at `105` — page 11 ends "walk away until the log says VIRTUAL", so the generator starts out of range; the door changes nothing audible and goal 1 still ticks. Replace: "Drag WALK until you stand in the courtyard, about 3 m from the wall. Open ROOM and switch ENGINE on. Press the door key several times." Add `&& !gen.virtual` to goals 1 and 2.
- `src/screens/lab/gameaudio/pages/p13Formats.tsx:83-90, 117-118` — page 12 leaves you inside the workshop; from x ≥ 11.5 the fountain is past its 9 m maximum (`gaDefs.ts:137`) and is VIRTUAL, there is no movement key, and page 12's generator is still running beside you. "The fountain moves between left and right" is not what is heard, yet both turn goals tick (`sourceOn` counts a virtual instance). Fix: give SCENE a tray with a "STAND: STONE PATH" chip (`chbRoute`), start the Do with "Open SCENE, choose STONE PATH and switch SCENE on.", and require `!fountain.virtual` in goals 1-2.

**[S2] all pages** — "voice" is never defined and is described three ways: `p01Welcome.tsx:82` "VOICES counts their parts"; `guides/p02.ts:15` and `p07Instances.tsx:128` "the sounds in use"; `guides/p07.ts:15` "the layers that sound"; `p17Budgets.tsx:189` "Each playing sound uses a voice"; `p03Platforms.tsx:168` uses "8 voices" with no meaning given.
- Use one sentence everywhere, first at `src/screens/lab/gameaudio/pages/p01Welcome.tsx:82`: "PLAYING counts instances: each sound the game started. VOICES counts the sound files those instances are playing at this moment. One instance can use several voices. SOUND says whether you can hear them."

**[S2] all pages** — the generator's start control has six names, and the main one collides with a glossary term: ENGINE (`src/screens/lab/gameaudio/pages/shared.tsx:51`; `p11Distance.tsx:55`; `p12Walls.tsx:86`; `p22Capstone.tsx:124`), GENERATOR: ON (`p04Games.tsx:76`), START 1 (`p07Instances.tsx:49`), ENGINE ON/OFF (`p08GameSyncs.tsx:101-102`), GENERATOR · ON (`p16Mix.tsx:49`; `p17Budgets.tsx:65`), ENGINE 1 (`p19Testing.tsx:57`). "Switch ENGINE on" (`p02Reacts.tsx:58`) comes one page before "Game engine" and beside "audio engine" (`p19Testing.tsx:131`).
- Label it GENERATOR everywhere (GENERATOR 1 / GENERATOR 2).
- `p02Reacts.tsx:58`: "Turn SOUND on. Press OPEN DOOR. Then switch GENERATOR on."

**[S2] all pages** — the plan's Signal path tray (plan §5) and the handoff's "control flow and audio signal flow separately" (lesson 1) are absent, and "bus" is used before it is taught. No file contains a signal path view. "bus" appears at `p02Reacts.tsx:81`, in every START line, and at `p06Pipeline.tsx:87, 112`, while page 5 calls the same thing a "category" and page 16 first defines it.
- `src/screens/lab/gameaudio/pages/p05Sounds.tsx:157` add: "A category is also called a bus. The log writes it at the end of each START line."
- `p02Reacts.tsx:81` option: "Turns all the sound effects up together"; wrong line: "That makes all effects louder. It cannot change one generator's pitch."
- On page 16 add a read-only card: "AUDIO: sound → its bus → master → output. CONTROL: game → event, switch, parameter, state."

**[S2] all pages** — glossary terms are shown as chips but the lesson body never uses them, so the student cannot connect word and idea (owner: "in the glossary's own terms"; handoff lesson 11 requires the obstruction/occlusion distinction). Add one sentence each:
- `p05Sounds.tsx:146`: "A sound that belongs to the world is diegetic. A sound that exists only for the player, such as an interface sound, is non-diegetic. Movement sounds made by a performer are called Foley." (add 'Non-Diegetic Sound' to TERMS, line 43)
- `p06Pipeline.tsx:87`: "The tool where this behavior is set up is often audio middleware. The person who connects sounds to the game is an audio implementer."
- `p08GameSyncs.tsx:182`: "Together these are often called Game Syncs. A link from a game number to a sound setting is an RTPC. A list of switch choices is a switch group."
- `p09Variation.tsx:131`: "A holder that picks at random is a random container. A holder that plays in a set order is a sequence container."
- `p12Walls.tsx:138`: "The first is called obstruction. The second, a sound behind a wall, is called occlusion. The closed door on this page is an occlusion."
- `p13Formats.tsx:122`: "Folding stereo to mono is a downmix."
- `p16Mix.tsx:159`: "A mix that changes during play is called dynamic mixing."
- `p17Budgets.tsx:196`: "The limit is a playback limit. Taking a voice is called voice stealing."
- `p18Multiplayer.tsx:157`: "In proximity voice chat you hear only the players whose characters are near yours."

**[S2] all pages** — "at once" is used for both "immediately" and "at the same time".
- Use "immediately": `p01Welcome.tsx:92`, `p09Variation.tsx:130`, `p15Dialogue.tsx:169`, `guides/p15.ts:10` and `36`, `p18Multiplayer.tsx:179`, `p14Music.tsx:53`, `data/gaGenres.ts:49`, `gaTerms.ts:67` and `115`.
- Use "at the same time": `p03Platforms.tsx:168`, `guides/p03.ts:18`, `data/gaGenres.ts:65` and `122`, `gaTerms.ts:64, 109, 112, 118`.

**[S2] all pages** — idioms and figures of speech, with replacements:
- `p01Welcome.tsx:81` and `src/screens/lab/gameaudio/GameAudioLabScreen.tsx:28` "larger than life" → "People and objects are drawn larger than their real size. Positions and distances are true."
- `GameAudioLabScreen.tsx:28` "their manuals win" → "For a real tool, follow its manual."
- `p20Tools.tsx:62` "has the final word" → "so check the tool's manual."
- `p20Tools.tsx:49` "can ship with only that" → "can be released with only that."
- `p06Pipeline.tsx:87` "ships with the game" → "is delivered with the game."
- `p12Walls.tsx:162` and `guides/p12.ts:30` → "Games often change what is realistic so the player can understand the scene."
- `p12Walls.tsx:180` → "That suggests a wall well enough for the player to understand the scene."
- `data/gaPlatforms.ts:49` → "played while traveling"; `:94` → "A tab that the browser pauses in the background"; `:116` → "Sound that stays in time with the picture"; `:63` → "A computer may not have surround speakers, large memory or high speed."
- `data/gaGenres.ts:66` → "Threats the player can locate by listening"; `:73` → "...are a large part of the experience."; `:129` → "The words are the main part of the game..."; `:113` → "Silence matters as much as sound."; `:74` → "A story with more than one path".
- `p18Multiplayer.tsx:162, 170, 187` "echo" (an audio word used for a network copy) → "your own action can come back to you as a second copy"; "...letting a local action and its network copy both trigger the sound."; "...so the copy is ignored."
- `guides/end.ts:10, 28` "what gives way" → "what is stopped first".
- `p09Variation.tsx:131` "Variation serves the source" → "Variation has a limit".
- `p05Sounds.tsx:138` → "The families keep a project organized."
- `p05Sounds.tsx:157` and `guides/p05.ts:34` "filed with the effects" → "it belongs to the EFFECTS category".

**[S2] p12 / p17** — two "common mistake" notes speak to a lab builder, not to the student: `src/screens/lab/gameaudio/pages/p12Walls.tsx:163` "Presenting a filter switch as real acoustics"; `src/screens/lab/gameaudio/pages/p17Budgets.tsx:204` "Presenting made-up cost numbers as measurements".
- p12: "Believing a muffled sound behind a wall is calculated acoustics. Often it is a level change and a filter that a designer chose."
- p17: "Reading every number as a measurement. Ask where a number comes from. Here the voice counts and the decoded sizes are exact. No processing figure is shown, because this lab does not measure one."

---

## Page by page

### Page 1

**[S2] p01** `src/screens/lab/gameaudio/pages/p01Welcome.tsx:59` — "Stop every sound" ticks from the key press alone: `stopAll` is counted with nothing playing (`gaModel.ts:1118-1120`) — `hit: since('stopAll') > 0 && since('sceneOn') > 0`, or count the fact only when an instance or the music was running.

**[S2] p01** `src/screens/lab/gameaudio/pages/guides/p01.ts:25` — "With SOUND off the scene still runs" is false when SOUND is switched off while the scene runs: that dispatches stopAll (`GaLab.tsx:56, 166`; `useGaSound.ts:111-115`) — "Switching SOUND off stops everything, like ■ STOP. A scene you start while SOUND is off still runs, and each START line says the sound was not heard."

### Page 2

**[S3] p02** `src/screens/lab/gameaudio/pages/guides/p02.ts:24` (also `guides/p05.ts:24`, `guides/p06.ts:24`) — "adds a GAME line": a door press or a step prints two GAME lines, TRIGGER and EVENT (`gaModel.ts:794` and `523`; `763` and `523`) — "Each press of the door key adds two GAME lines, the trigger and then the event, and START lines after them."

### Page 3

**[S2] p03** `src/screens/lab/gameaudio/pages/p03Platforms.tsx:180` against `:138` — the check repeats the lesson's own example word for word, so it tests recall.
- Question: "A game is installed on a handheld system. The player docks it to a TV and listens on a soundbar. Which line describes this correctly?"
- Options: "Platform: the handheld system. Delivery: an installed game. Output: the soundbar" / "It is a TV game, so the team only needs to test TV speakers" / "It is a handheld, so it can use only a small, fixed number of voices" / "Docking changes the platform, so the sounds have to change too".

**[S2] p03** `src/screens/lab/gameaudio/pages/guides/p03.ts:26` with `p03Platforms.tsx:167` — "At COMPACT ... the least important ones are stopped and the log names them" cannot be seen here: no key on this page starts a sound, and page 1 ended with ■ STOP, so VOICES reads 0/16 then 0/8.
- Guide: "With nothing playing, only the number after the slash in VOICES changes. The Budgets page fills the budget."
- Do: "Keep a card open and move BUDGET between COMPACT and EXPANDED. Watch the number after the slash in VOICES."

### Page 4

**[S2] p04** `src/screens/lab/gameaudio/pages/p04Games.tsx:103` with `:174-176` — goal "Give the listener back to YOU" is never asked for in the text and names no control.
- Add a Do after line 176: "Then open LISTENER and choose YOUR EARS. The listener is on YOU again."
- Chip: "Choose YOUR EARS again".

**[S3] p04** `src/screens/lab/gameaudio/pages/p04Games.tsx:174` — the page jumps from twelve genre cards to the listener with no link — start step 3 with: "One thing changes with the perspective: where the game puts its listener."

**[S3] p04** `src/screens/lab/gameaudio/pages/data/gaGenres.ts:55, 71, 119, 127, 135` — dock words "PLATFORM" (collides with page 3's PLATFORM key), "ADVENTUR", "OPEN WLD", "NARRATIV", "EDUCATE" read as misspellings — "JUMP", "QUEST", "OPEN", "STORY", "LEARN".

### Page 5

**[S3] p05** `src/screens/lab/gameaudio/pages/p05Sounds.tsx:150, 158` and `guides/p05.ts:36` — step 2 opens the door; after three steps east with it open the alarm (gain ≈ 0.22) is louder than the fountain (≈ 0.20), against "From the courtyard the alarm is quieter than the fountain" — Step 3 Do: "Close the door. Switch ALARM on in the PLAY tray. ..."

**[S3] p05** `src/screens/lab/gameaudio/pages/p05Sounds.tsx:62` — the same control is BACKGROUND here, SCENE on pages 1, 11, 13, 16, 17, 22 and START SCENE on page 10 — use SCENE everywhere.

### Page 6

**[S2] p06** `src/screens/lab/gameaudio/pages/p06Pipeline.tsx:87` — "build" (page title, lines 98, 110, 116, 137) is never explained — add: "A build is the packaged version of the game that players run."

**[S2] p06** `src/screens/lab/gameaudio/pages/p06Pipeline.tsx:97` against `:126-138` — step 3 walks the student through the fault and its repair, so the TROUBLESHOOT card below is already "✓ FIXED" with no START button while its symptom still says "Start the fault".
- Step 3 Do: "Now use the TROUBLESHOOT card at the end of this page: start the fault and find the broken link."
- The DOOR FILE instruction is already in hint 3.

**[S2] p06** `src/screens/lab/gameaudio/pages/p06Pipeline.tsx:91` and `guides/p06.ts:10` — "Press OPEN DOOR" may not be on screen: the door's state is carried from pages 2 and 5 — "Press the door key. It reads OPEN DOOR or CLOSE DOOR."

**[S2] p06 / p19** `src/screens/lab/gameaudio/pages/data/gaFaults.ts:63` against `data/chbPipeline.ts:17` — the right file is "door_open.wav" on page 6 and "door" on page 19; the missing one has no extension — `right: 'door_open.wav'`, and "door_open_v2.wav" everywhere, including the log line at `gaModel.ts:563`.

### Page 7

**[S2] p07** `src/screens/lab/gameaudio/pages/p07Instances.tsx:132` — "Stop generator 1" invites the dock's ■ STOP, which stops both generators; goal 3 then cannot tick.
- "Move SPEED 2 only. In MACHINES, press ■ STOP 1. Do not use the ■ STOP key in the dock: it stops everything. Then choose REMOVE GENERATOR 2 while it runs."
- Line 127: "...then press ▶ START 1 and ▶ START 2."

**[S2] p07 / p08 / p10** — fault symptoms do not say how to make the fault show.
- `p07Instances.tsx:163`: "Start the fault. Run generator 2, then remove it. The generator leaves the picture, but its hum is still there, and no control for it exists any more."
- `p08GameSyncs.tsx:223`: "Start the fault. Stand on GRAVEL and press STEP: GUIDE. The guide stands on the wood floor, but its footstep sounds like the ground under you."
- `p10Loops.tsx:183`: "Start the fault and the scene. Take several steps without crossing the doorway. The background becomes louder with each step, and PLAYING and VOICES climb."

### Page 8

**[S2] p08** `src/screens/lab/gameaudio/pages/p08GameSyncs.tsx:121` with `:186` — goal 2 counts a guide step only after YOU stepped on a second surface; "press both again" in the other order leaves it unticked with no reason shown — "Choose GRAVEL. Press STEP: YOU first, then STEP: GUIDE."

**[S3] p08** `src/screens/lab/gameaudio/pages/p08GameSyncs.tsx:193` — "In this lab the music follows the state" changes nothing audible here — "The Adaptive music page uses this state to change the music."

**[S3] p08** `src/screens/lab/gameaudio/pages/p08GameSyncs.tsx:187` — "scope" appears only in the guide, yet page 19 says "scope fault" (`gaFaults.ts:108`) — add: "The question 'one object or the whole game?' is called scope." Also line 181 "occurrence" → "one thing that happens".

### Page 9

**[S2] p09** `src/screens/lab/gameaudio/pages/p09Variation.tsx:130` — "take" is never defined, in a 27-word sentence — "The ear notices an exact repeat immediately. So a footstep event holds several takes. A take is one version of the same sound. The event picks one take each time and changes its level and pitch a little."

**[S2] p09** `src/screens/lab/gameaudio/pages/p09Variation.tsx:152, 163` and `guides/p09.ts:38` — "EVENT line": the log's column word is GAME (pages 1, 2, 6, 19 say "GAME line").
- Question: "You open the door once. The log shows one line that reads EVENT Play_Door, and two START lines. What happened?"
- Wrong[1]: "Two posts would print two lines that read EVENT Play_Door. The log shows one."

### Page 10

See the S1 item and the carried-position item above.

### Page 11

**[S3] p11** `src/screens/lab/gameaudio/pages/p11Distance.tsx:39` — the plan's key term "Cone attenuation" (and the handoff's "directional emission") is missing — add the chip and: "Some sources aim their sound, like a flashlight. That is cone attenuation. The sources on this page send sound equally in every direction."

**[S3] p11 / p12** `src/screens/lab/gameaudio/pages/p11Distance.tsx:72` and `p12Walls.tsx:105` — state-only goals tick the moment the page opens if the sounds were left running — add `since('inst:generator') > 0`.

### Page 12

See the carried-position, glossary-term, idiom and "common mistake" items above.

### Page 13

**[S2] p13** `src/screens/lab/gameaudio/pages/p13Formats.tsx:110-113` — seven ideas in two paragraphs, only three of which can be tried.
- Order: (1) "Three outputs can be heard on this page: stereo, headphone 3D and mono." (2) channel-based, object-based and binaural, as now. (3) after step 3: "Two more words you will meet. Ambisonics stores sound arriving from every direction at one point. Head tracking senses how your head turns, so sounds can stay still around you."
- Delete line 113.

**[S2] p13** `src/screens/lab/gameaudio/pages/p13Formats.tsx:124, 133-144` — "driver" is undefined and reads as a software driver.
- Question: "Headphones have two small speakers, one for each ear. How can a sound seem to come from behind you?"
- Options 0-1: "...before it reaches the two speakers" / "Each ear cup holds several small speakers, one for each direction".
- Note: "Thinking headphones need a separate small speaker for each direction. Two are enough: ..."

### Page 14

See the two S1 items above.

### Page 15

No defects found beyond the lab-wide "at once" item.

### Page 16

**[S2] p16** `src/screens/lab/gameaudio/pages/p16Mix.tsx:157` — the Look line uses DUCK before any explanation — "The picture is the scene. On this page you fill it with sound. The DUCK readout under the picture shows whether the mix is turning other sounds down for speech."

**[S2] p16** `src/screens/lab/gameaudio/pages/p16Mix.tsx:158` — 27 words with a nested clause — "Every sound is sent to a bus. A bus is a group channel. This scene has six: ambience, effects, dialogue, music, interface and chat. The chat bus carries a recording that represents other players' voices."

**[S2] p16** `src/screens/lab/gameaudio/pages/p16Mix.tsx:173, 182-194` — the check depends on "headroom", defined only in a chip — add at `:159`: "Headroom is the space between the usual level and the loudest level that still plays cleanly."

**[S3] p16** `src/screens/lab/gameaudio/pages/p16Mix.tsx:169` — GUIDE LINE is in SCENE, not MIX; CHAT LINE (`:54`) is never mentioned — "In MIX, choose DUCK OFF. Open SCENE and press GUIDE LINE again. Press CHAT LINE too: it is not on the dialogue bus, so nothing ducks. Then tap BUS, choose a bus and move its fader. Try MUTE and SOLO."

### Page 17

**[S2] p17** `src/screens/lab/gameaudio/pages/p17Budgets.tsx:197` — "there a virtual voice need not mean the sound fully stopped" is not readable at this level — "This is a teaching rule. Real engines have their own rules. Some make a sound virtual instead of stopping it: they keep track of it and bring it back when a voice is free."

**[S2] p17** `src/screens/lab/gameaudio/pages/guides/p17.ts:35` and `p17Budgets.tsx:118` — "Decoded size is samples × 4 bytes × channels" is given as general knowledge; 4 bytes is this lab's 32-bit sample — "In this lab each sample is a 32-bit number, so decoded size is samples × 4 bytes × channels. Other engines keep smaller samples. The file on disk is usually smaller, because it is compressed."

**[S3] p17** `src/screens/lab/gameaudio/pages/p17Budgets.tsx:146` — without the alarm, a budget of 1 only steals and never refuses — "With ALARM on, lower the budget until a sound is REFUSED".

### Page 18

Only the "echo" wording in the idiom item above.

### Page 19

See the two S1 items above.

### Page 20

**[S2] p20** `src/screens/lab/gameaudio/pages/p20Tools.tsx:69-83` — two defensible answers: in this lab footsteps share the EFFECTS bus with the door, generator, crate and alarm (`gaDefs.ts:90-190`), so the "correct" bus answer changes more than the footsteps.
- "...You want all the sound effects in the game to be a little quieter. ..."
- Options: "The mixer, to find the bus the effects feed" / "The list of sound files, to edit each effect file" / "The profiler, to watch the effects play" / "The event list, to post each event again".

**[S2] p20** `src/screens/lab/gameaudio/pages/p20Tools.tsx:67` — the page that carries the owner's outcome is read-only with one check. Add three checks:
- (a) "A sound never starts. Which window shows whether the game asked for it?" → the profiler.
- (b) "Footsteps need a different sound on gravel. Which window holds that choice?" → game information.
- (c) "In another tool you cannot find the word Switch. What do you look for?" → "The same idea under another name: one choice from a list, kept for each object".

**[S2] p20** `src/screens/lab/gameaudio/pages/data/gaToolMap.ts:182-240` and `p20Tools.tsx:49` — the seven windows describe a middleware tool only. Missing: the properties panel (where level, priority and the distance curve from pages 11 and 17 are set) and what a game engine editor shows first. "Middleware" is used undefined.
- Add window 8: "The properties panel: select a sound or an event and its settings appear here: level, pitch, priority, distance curve and bus."
- Add: "A game engine opens differently. You see the level, a list of its objects, and a properties panel for the selected object. A sound source and the listener are parts you add to an object there."
- Before line 49: "Audio middleware is a separate audio tool that works between the sounds and the game engine."

### Page 21

**[S2] p21** `src/screens/lab/gameaudio/pages/p21Today.tsx:67-76` — the check restates the definition and asks for its label.
- "A team wants a wind sound that follows the game's weather value smoothly, with rules the team writes and no AI service. Which approach fits?"
- Options: "Procedural audio: synthesis and rules a designer wrote" / "Generative AI while the game runs" / "A sound bank" / "A musical stinger".

### Page 22

**[S2] p22** `src/screens/lab/gameaudio/pages/p22Capstone.tsx:277` and `guides/p22.ts:14` — "Nothing runs until you start it" / "none running" is false when loops were left running (the header comment at line 33 says the scene is left as it was) — "The courtyard and the workshop again, with every sound of this lab ready. Sounds you left running on an earlier page are still running. CLEAN SCENE stops them."

**[S2] p22** `src/screens/lab/gameaudio/pages/data/gaCapstone.ts:117-156` — the seven chips are noun phrases, not instructions. Add a `chip` field (keep `label` for the summary):
- "Walk on two surfaces and play two takes on one"
- "Run the generator and change its SPEED"
- "Cross the doorway once with SCENE on"
- "Play the door with its rattle layer"
- "Play a GUIDE LINE that ducks the mix"
- "Make one music change that lands on a bar"
- "Run the ALARM with its VISUAL CUE on"

**[S3] p22** `src/screens/lab/gameaudio/pages/p22Capstone.tsx:278` — 34 words — "This page adds no new idea. You connect the ideas you know into one scene. Events start the sounds. Game Syncs change them. The mix turns other sounds down for speech. The music follows the game."

---

## S3, lab-wide

**[S3] all pages** — long sentences in lesson bodies.
- `p06Pipeline.tsx:86` (34 words): "A sound reaches a game in stages. First it is planned, recorded or synthesized, edited and named. Then it is imported, given its behavior and connected in the game. Last it is packaged, tested and revised."
- `p17Budgets.tsx:189` (29): "Voices are one of several separate budgets. Memory holds the loaded sounds. Processing time is the work the device does for sound many times each second. Loading and streaming bring a sound from storage. Latency is the delay before you hear it."
- `p21Today.tsx:62` (34): "For each one, a team asks four questions. How much control does it keep? Does the result repeat when it needs to? Where did the material come from? What does it cost while the game runs?"
- A further 20 guide `intro.learning` lines are 26-30 words (guides p05, p06, p09, p10, p14, p15, p16, p17, p19, p20, p21, p22).

**[S3] all pages** — check `wrong` lines that state the answer.
- `p01Welcome.tsx:114-115` → "By the time you lower it, your ears have already received the loud start." / "A high level makes everything loud, not only the quiet details."
- `p02Reacts.tsx:87` → drop the second sentence.
- `p07Instances.tsx:154` → "The event is only the definition. Ask where a value is stored."
- `p08GameSyncs.tsx:215` → "A switch does not keep the value the scene started with."
- `p12Walls.tsx:184` → "The generator keeps playing: the log shows no stop for it."
- `p16Mix.tsx:194` → drop the last sentence.
- `p20Tools.tsx:80` → "That changes one file at a time."

**[S3] all pages** — vague sound adjectives.
- `p02Reacts.tsx:65` → "With the door closed it is quieter and has less treble."
- `p12Walls.tsx:145` → "...so its high part is missing."
- `p12Walls.tsx:161` and `guides/p12.ts:34` → "...so a footstep is followed by a short tail of room sound."
- `guides/p12.ts:33` → "...the level, and how much treble the sound has."
- `p10Loops.tsx:183` "thicker" → remove.
- `p11Distance.tsx:119` → "turned down and filtered".

**[S3] all pages** — US usage.
- "round" → "around" at `p12Walls.tsx:138`, `guides/p12.ts:28`, `guides/p13.ts:18` and `36`, `chcSpeakerMap.tsx:159`.
- "tick themselves" (`p01Welcome.tsx:97` through `p22Capstone.tsx:293`, `guides/p22.ts`, `guides/end.ts`) → "Each one is marked done when it really happens in the scene."

**[S3] all pages** — guides.
- "SOUND turns the lab's sound on or off. ■ STOP stops everything that is playing." is identical in 20 guides (`guides/p01.ts:20` through `guides/p22.ts:23`) and could sit on any page: keep it on page 1.
- "The slider is bound to it" (`guides/p02.ts:18`, `p03.ts:18`, `p06.ts:20`, `p11.ts:19`, `p13.ts:18`, `p14.ts:18`, `p18.ts:20`) → "The slider controls it when the page opens."
- "DOOR reads ..." → "DOOR shows ...".
- `guides/end.ts:23` "including Pass the check" is untrue for page 22 (check optional, `p22Capstone.tsx:300`).

**[S3] all pages** — accessibility of meaning.
- No page-authored Pressable lacks role and label (`src/screens/lab/gameaudio/bits.tsx:121-141, 228, 241`; pages use LabChip, `src/screens/lab/LabShell.tsx:134-150`).
- Paired chips on pages 4-15 show the chosen value by the chip's highlight only (`chAViews.tsx:80`; `p07Instances.tsx:62-63`; `p08GameSyncs.tsx:76-84`; `p09Variation.tsx:55-66`; `p10Loops.tsx:74-86`; `p11Distance.tsx:50-51`; `p12Walls.tsx:90-91`; `p14Music.tsx:88, 96-97`), while pages 16-22 add a ✓ or ON/OFF word (`chdKit.tsx:57-59`): use `marked()` on all.
- `p02Reacts.tsx:65-67` makes ring color the only visual sign of level: add a GEN LEVEL readout in words.

---

## Summary

1. Page 14's written steps cannot produce the WITHDRAWN result they describe, and page 8 leaves MOOD ALERT so page 14 opens in the wrong state.
2. Page 19 can be impossible to finish (fault 4 needs YOU outside with no control to get there), and its fault 1 says "nothing could play" while the rattle plays and prints START; pages 10, 12 and 13 have the same carried-position weakness.
3. Page 10's check marks a statement the scene contradicts as correct, and page 1's "■ STOP is always in the dock" is untrue on pages 20-21, where loops keep playing with no stop control.
4. Not checked: nothing was run on a phone or in the preview, so audible claims (the 10-second loop jump, HRTF, level comparisons) and the rack's tray / chooser / CLEAN SCENE rendering were judged from code only; whether the app's sound gate offers a stop on pages 20-21 was not confirmed; no test was run, so replacement strings may be pinned by `test/gameAudio*.test.ts` and `test/screenGuide_gameaudio_20261112.test.ts`.
5. Not checked: `gaTerms.ts` against the live glossary; handoff sections 4-6 (PDF pages 3-6). The PDF could not be rendered (no pdftoppm), so pages 8-13 and 19 were read through a text extractor written in the session scratchpad folder, outside the repository.
