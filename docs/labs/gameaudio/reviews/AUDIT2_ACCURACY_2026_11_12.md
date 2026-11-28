# Game Audio Lab — AUDIT 2 · ACCURACY AND DATA (auditor ACC)

Date: 2026-11-12 (night). Read-only. Lens: 5 Data, 6 Accuracy, the truth of 2 Logic (does the model behave as real game audio systems do), and every Check.
Judged as a senior technical sound designer / audio programmer (Wwise, FMOD Studio, Unreal Engine, Unity).

Read in full: `model/gaDefs.ts`, `gaWorld.ts`, `gaModel.ts`; `gaTerms.ts`; all 22 `pages/pNN*.tsx`; all 14 `pages/data/*.ts`; all 23 guides; `chcSpeakerMap.tsx`, `cheToolMap.tsx`; `sounds/gaSoundBank.ts`; the constants of `sounds/gaSynth.ts`; the voice path of `engine/gaEngineSource.ts`; `SOURCES.md`, `SOURCES_TOOLS.md`. REVIEW1_AUDIO was read only after my own findings were formed.
Paths below are under `C:\Users\profe\dev\ape-workbench\src\screens\lab\gameaudio\` unless they start with `docs\` or `test\`.
Evidence: `C:\Users\profe\AppData\Local\Temp\claude\e45de0ce5238aca8\f5e8364b-06db-4f2e-9d53-2c6c9d3fd6d3\scratchpad\ga_audit_acc\trace_model.mts` (a read-only run of the lab's own reducer) and `trace_model_output.txt` beside it.

Counts: **S1: 1 · S2: 4 · S3: 10.** No wrong number was found: every number a learner reads is taken from, or equal to, the model's constant. No marked-correct check answer is wrong, and no "wrong" option is actually right.

---

## 1. Verdict per page

| Page | Data | Accuracy | Model truth | Checks |
|---|---|---|---|---|
| 1 Welcome | PASS | PASS | WEAK silent bed counted (A5) | PASS |
| 2 Sound that reacts | PASS | PASS | WEAK value "on the instance" (A4) | PASS |
| 3 Where games run | PASS | PASS | PASS budget said to be a scenario | PASS |
| 4 Kinds of games | PASS pan 96% → 65% as text says | PASS | PASS camera rule said | PASS |
| 5 Kinds of game sound | PASS | PASS | PASS | PASS |
| 6 Source to build | PASS file names match the bank | PASS | PASS | PASS |
| 7 Events and instances | PASS | WEAK where the value lives (A4) | WEAK same | PASS |
| 8 Triggers, states, switches | PASS | **FAIL** Game Syncs (A1) | PASS | PASS |
| 9 Variation and layers | PASS "1 of 4" = 4 takes | WEAK one tool's names (B2) | PASS | PASS |
| 10 Loops and zones | PASS 1.5 s, 10 s match | PASS | WEAK silent bed counted (A5) | PASS |
| 11 Emitters and distance | PASS −6 dB, last fifth match | PASS | PASS said | PASS |
| 12 Walls, doors, rooms | PASS 9 dB, 900 Hz match | WEAK "cuts above" (B1) | WEAK open door = no wall anywhere (A3) | PASS |
| 13 Output formats | PASS BS.775 angles right | PASS | PASS said | PASS |
| 14 Adaptive music | PASS 96 BPM, 2.5 s, 10 s match | PASS | WEAK music outside the voice count (A5) | PASS |
| 15 Dialogue | PASS priorities 80 / 95 | WEAK "is refused" as a general rule (B4) | PASS | PASS |
| 16 The game mix | PASS 10 / 8 / 5 dB, six buses | PASS | PASS duck said to be event-driven | PASS |
| 17 Budgets | PASS 192,000 bytes, stops, burst 12 | PASS | WEAK a stolen loop switches its machine OFF (A2) | PASS |
| 18 Multiplayer | PASS | PASS | WEAK no network delay (B5) | PASS |
| 19 Testing | PASS | PASS | PASS | PASS |
| 20 The tools | PASS for the 27 cells re-read tonight; Wwise column (12 cells) NOT CHECKED on the vendor's page (section 3) | PASS no wrong cell found; two refinements (B3) | not applicable | PASS check 3 slightly loose (B10) |
| 21 Game audio today | PASS no dated fact | PASS neutral, no hype, no career claim | not applicable | PASS |
| 22 Capstone | PASS | WEAK "Game Syncs change them" (A1) | PASS | PASS |
| End screen | PASS | PASS | not applicable | not applicable |

---

## 2. Findings

### A1 · pages 8, 22, glossary term · Accuracy · S1
**WHAT.** `pages/p08GameSyncs.tsx:180`: "Together these are often called Game Syncs. A link from a game number to a sound setting is an RTPC, and a list of switch choices is a switch group. These are general meanings: each tool has its own names." Three things are wrong.
1. Game Syncs, RTPC and Switch Group are **Wwise's own product words**, not general ones. FMOD Studio does all of this with "parameters" (its glossary has Parameter, Labeled User Parameter, Local Parameter, Global Parameter and no Game Sync or RTPC entry: read tonight at https://www.fmod.com/docs/2.03/studio/glossary.html). Unity and Unreal Engine use neither word. The last sentence says the opposite of the truth.
2. "These" includes the lab's **trigger** (a foot touching the ground). In Wwise the Game Sync named Trigger launches a music stinger; a footstep is an Event the game posts. The lab's own page 20 says so (`pages/p20Tools.tsx:73`) and the lab's own record quotes the Wwise glossary: "A Game Sync that responds to a spontaneous occurrence in the game and launches a Stinger" (`docs\labs\gameaudio\SOURCES_TOOLS.md`, "One sentence about Wwise"). So page 8 and page 20 contradict each other.
3. `pages/p22Capstone.tsx:291`: "Events start the sounds. Game Syncs change them." uses the Wwise word as the general one again, and `gaTerms.ts:60` ('Game Syncs') does not say whose word it is.

**WHY.** The owner's stated outcome is that the learner can "recognize and orient themselves quickly" in real tools. A learner who opens Wwise after page 8 will look for footsteps under Game Syncs > Triggers; one who opens FMOD Studio will look for a Game Syncs window that does not exist.

**FIX.**
- p08:180 → "Wwise groups switches, states and parameters under one name: Game Syncs. In Wwise, a link from a game number to a sound setting is an RTPC, and a list of switch choices is a Switch Group. FMOD Studio does the same three jobs with parameters. The ideas are general. The names belong to each tool."
- p22:291 → "Events start the sounds. Switches, parameters and states change them."
- `gaTerms.ts:60` (the glossary entry is the owner's): the meaning shown in the lab should begin "Wwise's name for…". Same for 'Real-Time Parameter Control (RTPC)' (`gaTerms.ts:59`): "Wwise's name for a link from a game value to a sound setting…".

### A2 · page 17 · Model truth · S2
**WHAT.** When the budget takes a loop's voices, the model switches the **game object** off: `model/gaModel.ts:459-464` sets `m.on = false` for a generator "that lost its voices". Following step 2 exactly (BUDGET 8, SCENE on, GENERATOR 1 on, BURST) the trace shows: before the burst 5 voices and the generator on; after it, 8 crate impacts, the generator OFF, and the room tone, the wind and the fountain all ended (`trace_model_output.txt`, block A). The SOUNDS tray chips GENERATOR 1 and SCENE flip to OFF by themselves.
**WHY.** No audio system switches a machine off. In a real game the generator keeps running and is simply silent, and it stays silent until something restarts or un-virtualizes its sound. That is the real, common bug this page should warn about, and the reason engines offer virtual voices for loops. The picture teaches the reverse: that the budget tidies up the game for you. The page never says the switch-off is a convenience of this scene.
**FIX (text, no model change needed tonight).** After `pages/p17Budgets.tsx:198` add: "In this scene, a generator or a background whose voices are taken is switched off, so the picture and the sound agree. In a real game the machine keeps running with no sound, and a stolen loop does not come back by itself. That is why engines often make a loop virtual instead of stopping it." Better later: keep the machine ON in the picture with the still, dashed ring the lab already uses for "tracked, not played", and a readout word such as NO VOICE.
Source for "an active sound source is a voice, and the limit is a project setting": Unreal Engine Audio Glossary, "voice" (https://dev.epicgames.com/documentation/en-us/unreal-engine/audio-glossary-in-unreal-engine, read tonight).

### A3 · page 12 · Model truth · S2
**WHAT.** The wall treatment is decided by two facts only: listener and source in different zones, and the door closed (`model/gaWorld.ts:164-166`). There is no line of sight. With the door OPEN, a listener in the far corner by the fountain (1.0, 1.0) hears the generator with **no** treatment, although the straight line meets solid wall at y = 1.89 and the doorway is y 4 to 6 (`trace_model_output.txt`, block B). The card prints "LEVEL CHANGE None · FILTER None". The page says "Open, both changes are gone" (`pages/p12Walls.tsx:144`) and lists "sound bends around a corner or through a doorway" as a real effect (`:137`) without saying this scene does not do it. `docs\labs\gameaudio\SOURCES.md` section 3 lists the simplification and marks it "Covered by the same page 12 note"; the note ("an authored treatment, not a simulation") does not cover it.
**WHY.** A learner who walks off the path with the door open hears a machine through a wall at full clarity and reads "None". A real game would test whether the source can be reached in a straight line (Unreal Engine's attenuation occlusion uses a trace channel to "determine whether there is an obstruction between the source and the listener": https://dev.epicgames.com/documentation/en-us/unreal-engine/sound-attenuation-in-unreal-engine, read tonight), or route the sound through the doorway as a portal.
**FIX.** Add to step 2 after `:144`: "This scene uses one simple rule: door closed, treatment on; door open, treatment off, wherever you stand. A real game also checks whether you can see the source through the doorway, and treats the sound that bends around its edge."

### A4 · pages 2, 7, 8 · Accuracy and model truth · S2
**WHAT.** The text says the speed value lives on the **instance**: `pages/p07Instances.tsx:128` "A speed that belongs to one machine is stored on that machine’s instance, not on the event"; `:116` "each instance keeps its own values"; `pages/p02Reacts.tsx:78` "Changes the speed value on the instance that is already playing". The model keeps it on the **machine** (`GaMachine.speed`; `speedOf` at `model/gaModel.ts:399`): a speed set while nothing plays is kept, and a new instance starts at it (`trace_model_output.txt`, block C). Page 8's own chooser says so: "SPEED still holds a value, but no instance is playing to follow it" (`pages/p08GameSyncs.tsx:99`).
**WHY.** Object or instance is exactly the scope question page 8 teaches, and the tools differ on it. In FMOD Studio a local parameter belongs to each event instance ("it can have a different current and set value in every instance of every event": FMOD glossary, "Local Parameter", read tonight); in Wwise a game parameter is normally set for a game object and every sound on that object follows it (from my own use of the tool and Audiokinetic's community answers; the SDK page could not be read tonight, see section 6). The lab's model behaves like the second and its text describes the first.
**FIX.** p07:128 → "A speed that belongs to one machine is kept for that machine, not on the event. Its instance follows it." p07:116 → "…and each object’s instance follows that object’s own values." Add once on page 7 or 8: "Some tools keep such a value on the game object, others on the playing instance. Check which, in the tool you use."

### A5 · pages 1, 10, 14, 17 · Model truth · S2
**WHAT.** What counts as a voice is the reverse of real engines in two places, and only half is said.
- A loop at **zero level is counted** as a sounding voice: with SCENE on from the courtyard VOICES is 3, the silent room tone included (`trace_model_output.txt`, block D; guide p01 "It is running, so it is counted"). Yet a loop past its maximum distance is VIRTUAL and not counted (page 11).
- The **music is not counted at all** (`pages/p14Music.tsx:214`: "PLAYING and VOICES count the scene’s sounds, not the music"), and three layers "still play, at zero level".
**WHY.** In a real engine every music layer is a voice and is usually the most expensive kind (long, often streamed), and a voice that is silent is the first thing an engine makes virtual. Page 17 teaches budgets on a count that leaves the music out and keeps a silent bed in. A learner will carry "music is free, silence costs" into a real project.
**FIX.** p14:214 add: "In a real engine each music layer is a voice too and counts against the budget." Page 17 step 1, after `pages/p17Budgets.tsx:190`: "This lab counts a loop at zero level as a voice, and leaves the music out of the count. A real engine counts the music, and usually makes a silent loop virtual."
Source: Unreal Engine Audio Glossary, "voice": "An active sound source", with the maximum set in Project Settings (URL as in A2); Unity "Audio Profiler module" reports "the total load and voice counts" for the whole audio system (https://docs.unity.com/en-us/engine/current/manual/audio/profiler, read tonight).

### B1 · page 12 · Accuracy · S3
"a filter cuts the sound above about 900 Hz, so its high part is missing" (`pages/p12Walls.tsx:144`), "FILTER · Cuts above about 900 Hz" (`:152`), guide p12 "filters out the sound above about 900 Hz". The engine uses one second-order low-pass (`engine/gaEngineSource.ts:237-240`): 12 dB per octave (MDN, BiquadFilterNode type "lowpass": "12dB/octave rolloff": https://developer.mozilla.org/en-US/docs/Web/API/BiquadFilterNode/type, read tonight). At 1.8 kHz the sound is about 12 dB down, not gone.
FIX: "a low-pass filter turns the sound down above about 900 Hz, more the higher it goes, so it sounds dull." Card: "FILTER · Low-pass at about 900 Hz". Guide: "…and turns down the sound above about 900 Hz."

### B2 · pages 9, 16 · Accuracy · S3
One tool's words given as the general ones (smaller cases of A1). `pages/p09Variation.tsx:131`: "A holder that picks at random is a random container… a sequence container" are Wwise's names; FMOD Studio's is a multi instrument and Unity's an Audio Random Container (both read tonight; URLs in section 3). `pages/p16Mix.tsx:213`: "a snapshot" is FMOD Studio's and Unity's word; Wwise does it with a State and Unreal Engine with a Control Bus Mix (the lab's own page 20).
FIX: p09 add "These are Wwise’s names. Page 20 lists what other tools call the same idea." p16: "…is often called a snapshot."

### B3 · page 20 · Accuracy · S3
No cell is wrong. Two refinements.
- The Unreal Engine column mixes its two sound-building systems without saying there are two: Parameter is "Input of a MetaSound", Switch and Random are nodes "in a Sound Cue". A newcomer in a MetaSound will not find a Random node. Add to `pages/p20Tools.tsx:72`: "Unreal Engine has two ways to build a sound, the older Sound Cue and the newer MetaSound. A card names the one with the closest idea." And make the Random cell (`pages/data/gaToolMap.ts:103`) "Random node in a Sound Cue; Random Get node in a MetaSound" (MetaSound Function Nodes Reference Guide: "The Random Get node randomly retrieves elements from an input array": https://dev.epicgames.com/documentation/en-us/unreal-engine/metasound-function-nodes-reference-guide-in-unreal-engine, found tonight by search). Change `SOURCES_TOOLS.md` with it, or the test fails.
- Instance: Unity and Unreal Engine show a dash. A dash is defensible, but in both engines the component that is the emitter is also the handle on the playing sound (Audio Source; Audio Component). One line under the cards would orient a learner: "In Unity and Unreal Engine the emitter component is also how the game reaches the playing sound."

### B4 · page 15 · Accuracy · S3
`pages/p15Dialogue.tsx:165`: "a less important line is refused while a more important one speaks" is stated as how dialogue systems work. Many queue the line or drop it by rule; the code comment itself says "(here: is refused)". FIX: "…and in this scene a less important line is refused while a more important one speaks. Other games make it wait."

### B5 · page 18 · Model truth · S3
The model has no network delay: the card ONE MESSAGE, TWO MACHINES shows both machines acting at once, and the lesson never says the other player hears the door later. The reason a machine plays its own action at once and then meets the echo (the check's subject) is that delay. FIX, `pages/p18Multiplayer.tsx:154`: add "The message takes time to travel, so the other machine plays the door a moment after yours." Card note: "The other machine acts when the message arrives, a moment later."

### B6 · page 11 guide · Data · S3
`pages/guides/p11.ts` tryThis[0]: "When DISTANCE is half of what it was, the level on the card is 6 dB higher. Start closer than 7 m". True only if the halved distance is still outside MIN (1.5 m for the fountain): from 2.8 m to 1.4 m the card rises 5.4 dB and reads FULL LEVEL. From the page's start (3.6 m to 1.8 m) it works. FIX: add "and stop before the MIN ring."

### B7 · glossary meanings shown in the lab (`gaTerms.ts`) · Accuracy · S3
These are the owner's glossary entries, shortened; flagged, not rewritten.
- `:121` FMOD: "The other widely used game audio tool" reads as if there were two. "Another widely used…".
- `:116` In-game voice chat: "The game usually dips its own sound so speech stays clear." Pages 16 and 18 show chat that dips nothing, and in practice the dip is usually the platform's or the player's setting (for example the Xbox console's Chat mixer: reduce other sounds by 50% or 80%, mute them, or do nothing; as console guides found by search tonight describe it, Microsoft's own page not read). "The platform or the game can dip the game’s sound; often the player chooses."
- Fourteen of the 103 terms are never shown on any page (Audio pipeline, Trigger (game engine), State group, Switch container, Layer container, Blend container, Seamless music loop, Volume (game engine), Head tracking, Mono compatibility, Music segment, Music transition rule, Audio level of detail, Prefetch streaming). No learner sees them, so no harm; but "Layer container" is not a container type in any of the four tools (Wwise's play-together container is the Blend Container), so it should not be the first to be used later.

### B8 · code naming · Accuracy · S3
The model calls the closed-door treatment `OBSTRUCTED` / `obstruction()` (`model/gaWorld.ts:158-166`, `pages/data/chcSpace.ts`), while page 12 correctly teaches that this door is an **occlusion** treatment. Nothing a learner reads is wrong today (the readout says MUFFLED). The next person to write text from the code will copy the wrong word. Rename when the model is next touched.

### B9 · internal record and its test · Data · S3
- `docs\labs\gameaudio\SOURCES_TOOLS.md` records "Unreal Engine 5.9" as the version the pages showed. The pages do carry "Unreal Engine 5.9 Documentation" (seen tonight), but 5.9 is a **Preview** as far as search results tonight show: the last full release is 5.8 (June 17, 2026), and Epic's 5.9 release-notes page (https://dev.epicgames.com/documentation/unreal-engine/unreal-engine-5-9-release-notes) was last updated 2026-11-09, with news reports describing a 5.9 preview build. The record should say "5.9 (Preview documentation)".
- "FMOD Studio 2.03.15 (dated 2026-09-21)": I could not confirm that revision; the revision-history page did not load for me and search shows entries up to 2.03.13.
- `test\gameAudioChETools.test.ts` ("every cell that is not a dash is recorded…") passes (11 of 11 tonight). It proves the map and the record say the same words. It does not prove a cell is true.

### B10 · page 20 check 3 · Checks · S3
"Footsteps need a different sound on gravel. Which window holds that choice? — Game information, where the surface switch is defined." The marked answer is the best of the four and no other option is right. But in a real tool two windows share this job: the switch is defined with the game information, and which sound plays for gravel is assigned on the container, in window 1. FIX the question: "Which window defines the list of surfaces the game can send?"

---

## 3. Page 20 tool map: every cell

39 cells are not a dash. Result: **27 re-read tonight on the vendor's own page and correct. 12 (the Wwise column) could not be re-read** (the site refuses automated page fetches: HTTP 403 on three tries); as a Wwise user I find all 12 to be the right current names, and the builders' record quotes the glossary for each, but that is not the check the brief asked for. The 9 dashes are reasonable.

| Idea | Wwise (not re-read; address from the record) | FMOD Studio 2.03 | Unity 6.6 | Unreal Engine 5.9 docs |
|---|---|---|---|---|
| Event | Event · right | Event · VERIFIED "an instanceable unit of sound content that can be triggered, controlled and stopped from game code" | dash · reasonable | Sound Cue or MetaSound Source · VERIFIED "an audio asset that encapsulates complex sound design tasks within a node graph"; only Sources produce audio on their own |
| Instance | Playing ID · right | Event instance · VERIFIED | dash (see B3) | dash (see B3) |
| Parameter | Game Parameter, linked by an RTPC · right | Parameter · VERIFIED | dash · right call | Input of a MetaSound · VERIFIED "create additional Inputs and Outputs in the Members panel" |
| Switch | Switch, in a Switch Group · right | Labeled parameter, local · VERIFIED (Labeled User Parameter; Local Parameter) | dash | Switch node in a Sound Cue · VERIFIED "selects an input node based on the value of a runtime integer parameter" |
| State | State, in a State Group · right | Global parameter · VERIFIED | dash | dash |
| Random choice | Random Container · right | Multi instrument · VERIFIED "a kind of instrument with a playlist" | Audio Random Container · VERIFIED | Random node in a Sound Cue · VERIFIED (add Random Get, B3) |
| Bus | Audio Bus · right | Group bus · VERIFIED | Group of an Audio Mixer · VERIFIED "a hierarchy of groups" | Sound Submix · VERIFIED |
| Saved mix setup | State · right | Snapshot · VERIFIED | Snapshot of an Audio Mixer · VERIFIED | Control Bus Mix · VERIFIED; the glossary says Sound Class Mix "is intended to be replaced by the Audio Modulation system" |
| Sound bank | SoundBank · right | Bank · VERIFIED | dash | dash |
| Emitter | Game Object · right | Studio Event Emitter, in FMOD for Unity · VERIFIED (section 4.2) | Audio Source · VERIFIED | Audio Component · VERIFIED "Attaches to an actor to provide a sound source" |
| Listener | Listener · right | Listener · VERIFIED "a virtual pair of ears" | Audio Listener · VERIFIED | Listener · VERIFIED |
| Profiler | Profiler layout · right | Profiler window · VERIFIED "Window > Profiler" | Audio Profiler module · VERIFIED | Audio Insights · VERIFIED; no Beta or Experimental mark on the page |

Addresses read tonight:
- FMOD Studio glossary: https://www.fmod.com/docs/2.03/studio/glossary.html · profiling: https://www.fmod.com/docs/2.03/studio/profiling.html · FMOD for Unity game components: https://www.fmod.com/docs/2.03/unity/game-components.html (fmod.com returned an empty page to my fetch tool, so all three were read on the documentation's own content host, the same paths under https://d1s9dnlmdewoh1.cloudfront.net/2.03/)
- Unity 6.6 (6000.6): https://docs.unity.com/en-us/engine/current/manual/audio/random-container · https://docs.unity.com/en-us/engine/current/manual/audio/mixer/overview · https://docs.unity.com/en-us/engine/current/manual/audio/reference/class-audio-source · https://docs.unity.com/en-us/engine/current/manual/audio/reference/class-audio-listener · https://docs.unity.com/en-us/engine/current/manual/audio/profiler
- Unreal Engine: https://dev.epicgames.com/documentation/en-us/unreal-engine/audio-glossary-in-unreal-engine · https://dev.epicgames.com/documentation/en-us/unreal-engine/sound-cue-reference-for-unreal-engine · https://dev.epicgames.com/documentation/en-us/unreal-engine/metasounds-reference-guide-in-unreal-engine · https://dev.epicgames.com/documentation/en-us/unreal-engine/audio-insights-in-unreal-engine
- Wwise (refused, not read): https://www.audiokinetic.com/en/public-library/2025.1.12_9287/?source=Help&id=glossary

The sentence "In Wwise, the word Trigger means one thing only: the Game Sync that starts a music stinger" is right as I know the tool; not re-read tonight for the same reason. The eight kinds of window: the FMOD Studio names in the record (events browser, parameters browser, mixer window, mixing desk, sandbox window, deck) were all found in its glossary tonight.

---

## 4. Other things checked and found right (no finding)

- Numbers in text equal the model's: minimum and maximum distances, −6 dB per doubling and the last-fifth fade (`gaWorld.ts:92-99`); 9 dB and 900 Hz (read from the constant); duck 10 / 8 / 5 dB (read from the table); 96 BPM, bar 2.5 s, phrase 10 s; cross-fade 1.5 s; raw loop 10 s; rattle 1 s later; four takes; burst of 12; budgets 8 and 16; stops 1, 2, 4, 8, 12, 16, none; priorities 80 and 95; step 0.7 m; facing in 5° steps; six buses; seven platform cards; twelve genres; alarm 1 s × 48,000 × 4 = 192,000 bytes; "STOLEN rises by 4" at budget 8.
- Page 4: at FACING 0° the generator pans 96% right for the player and 65% right for the camera, as the text says.
- Page 5: the alarm is quieter than the fountain everywhere a learner can stand on that page (the stone path). It is not true in the far south-east of the courtyard, which that page cannot reach.
- Page 13: the 5.1 picture follows Recommendation ITU-R BS.775 (front 0° and ±30°, surrounds ±110°, inside its 100° to 120° range). The statements on channel-based, object-based, binaural, HRTF, Ambisonics, head tracking and double spatializing are right.
- Page 12: obstruction and occlusion are named the way the trade (and Wwise) uses them, and the door is correctly called an occlusion treatment. The engine takes its reverb send after the door's filter and level, so "the whole sound is lower and duller" is what the model does.
- Page 16: event-driven duck against sidechain detection is stated correctly.
- Page 17: the voice rule in the text is the rule in `allocate()`; it is said once to be a teaching rule.
- Page 1: "Every sound in this lab is made in the app" holds, the stand-in voice included (it is synthesized).
- Page 21: nothing dated, no statistic, no hype; procedural audio is kept apart from generative AI; MetaSounds and Steam Audio are described correctly. It names a role, not a career path, so the house rule on required education is not triggered.
- REVIEW1_AUDIO: all of its items are fixed in the text as it stands tonight.

---

## 5. Noticed in other auditors' areas (one line each, not dug into)

- Success: page 17 step 3 says "Lower BUDGET to 1"; while the WARNING LINE still speaks two protected voices sound, so the budget stops at 2 and the next burst is not "every impact REFUSED".
- Success: guide p11's "set FACING to 255° and press STEP until … VIRTUAL" reaches 13.3 m (maximum 13 m) only on the seventh step, against the edge of the picture.
- Wording: `scene/GaScene.tsx:645` accessibility text says "metres" (US spelling is "meters").
- Learning: the mix page has no word on loudness measurement or a loudness target (for example Sony's ASWG-R001 recommendation); page 13 never names the renderers a learner will meet on real platforms (Dolby Atmos, DTS:X, Windows Sonic, Tempest 3D). Gaps, not errors.
- Sounds and engine: not judged; one fact used above (the reverb send point).

---

## 6. What I could not check, and why

- **The 12 Wwise cells and the Wwise Trigger sentence on the vendor's page.** audiokinetic.com answered HTTP 403 to every automated fetch, and my lens has no browser. Judged from professional knowledge and the builders' quoted record only.
- **FMOD Studio's exact current revision** (the record says 2.03.15): the revision-history page did not load.
- **The glossary database.** I did not compare `gaTerms.ts` with the live glossary's entries (no database read in this audit); `SOURCES.md` says 103 of 103 matched.
- **Anything by ear, on a phone, or on screen.** No sound was played and no browser was opened; every statement about what is heard is from the code.
- **Tests.** Only `test\gameAudioChETools.test.ts` was run (11 pass). The other `gameAudio*` tests were not run by me.
- **The owner's specification PDF, the plan and the first handoff** were not read; I judged the lab against the trade, not against the plan.
- **Typical real-world voice and memory budgets, platform loudness targets, codecs, latency figures:** the lab states none, so there was nothing to verify.
