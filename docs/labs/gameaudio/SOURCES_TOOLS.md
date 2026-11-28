# Game Audio Lab — sources for the tool map (page 20)

Internal record. Nothing in this file is shown to the student.

This file is the register behind `src/screens/lab/gameaudio/pages/data/gaToolMap.ts` (`GA_TOOL_MAP`). The test `test/gameAudioChETools.test.ts` reads it: every cell of the map that is not a dash must appear in its row below, in bold, exactly as the map spells it. To change a cell: read the vendor's current page, change the map and this record together, and put the new date.

## How it was checked

- **Date of every check below: 2026-11-12.**
- Only the vendor's own documentation was used. No forum post, blog or third-party glossary.
- The map gives the CLOSEST idea in each tool. It does not claim the tools match one to one, and page 20 says so once in plain words.
- A dash in the map means: the tool has no close idea of its own, or none could be verified on the vendor's pages on the day. It is never a guess. The map has nine dashes.
- Every dash also has a line that says what a learner looks for in that tool instead (`GA_TOOL_INSTEAD`, added 2026-11-12 after audit 2, finding L-05). The line is recorded word for word in its row below, after "Look for instead:". It names only things this record already holds for that tool (another cell of its column, or the vendor's words quoted beside the dash) and otherwise speaks in plain words ("a script", "the game's own code"). It is a pointer for a newcomer, not a claim of an equal.
- An independent audio review re-checked every cell that is not a dash on the vendors' pages on 2026-11-12 and found no wrong or retired name. Two cells were then changed on its advice: Unity "Parameter" became a dash, and Unreal "Event" says in its own words that it is an asset, not an event.
- The Unity and Unreal Engine columns describe the engine's own audio, with no middleware added.

| Tool | Documentation set | Version the pages showed | How it was read |
|---|---|---|---|
| Wwise | Audiokinetic, Wwise Help and Wwise SDK | 2025.1.12 (build 9287) | In a browser (the site refuses automated page fetches). Glossary entries and page text read directly. |
| FMOD Studio | Firelight Technologies, FMOD Studio User Manual; FMOD for Unity User Manual | 2.03 (the manual's address). The first builder's browser showed revision 2.03.15, dated 2026-09-21; audit 2 could not open the revision-history page to confirm that revision number, so treat ".15" as unconfirmed. Every cell was read under the 2.03 address. | In a browser. Glossary entries read directly. |
| Unity | Unity User Manual (docs.unity.com, "current") | Unity 6.6 (6000.6) | Page fetch. Term names and short quoted passages; longer passages are paraphrased by the fetch tool. |
| Unreal Engine | Epic Games, Unreal Engine Documentation (dev.epicgames.com) | The pages are headed "Unreal Engine 5.9 Documentation". 5.9 is a PREVIEW, not a full release, on the day of the check: Epic's own page is titled "Unreal Engine 5.9 Preview Release Notes" (UE`unreal-engine-5-9-release-notes`, "Last updated 11/9/26", read 2026-11-12). The documentation pages themselves carry no preview mark. The accuracy auditor's search that night gave 5.8 as the last full release (not re-read on Epic's site). The names in the map (Sound Cue, MetaSound, Sound Submix, Control Bus Mix, Audio Component, Audio Insights) are long-standing ones and not new in 5.9 as far as the builders know; they were NOT re-read on the 5.8 pages. | Page fetch. Term names and short quoted passages; glossary definitions are paraphrased by the fetch tool. |

Base addresses used below:

- WH = `https://www.audiokinetic.com/en/public-library/2025.1.12_9287/?source=Help&id=`
- WS = `https://www.audiokinetic.com/en/public-library/2025.1.12_9287/?source=SDK&id=`
- FS = `https://www.fmod.com/docs/2.03/studio/`
- FU = `https://www.fmod.com/docs/2.03/unity/`
- UM = `https://docs.unity.com/en-us/engine/current/manual/audio/`
- UE = `https://dev.epicgames.com/documentation/en-us/unreal-engine/`

## The rows

### event — Event

- Wwise: **Event** | Wwise Help, Glossary, entry "Event (Action Event)" | WH`glossary` | "A method to trigger audio in game using an Action or series of Actions, such as Play, Mute, and Pause, that have been applied to one or more Wwise objects."
- FMOD Studio: **Event** | FMOD Studio User Manual, Glossary 28.46 "Event"; also Concepts 2.3 | FS`glossary.html`, FS`fmod-studio-concepts.html` | "An event is an instanceable unit of sound content that can be triggered, controlled and stopped from game code."
- Unity: — | No object of the engine's own audio names a behavior for the game to call. A script plays an Audio Clip through an Audio Source (UM`reference/class-audio-source`: "a component that plays an Audio Clip in your scene"). Left as a dash. Look for instead: "No event layer. A script tells an Audio Source to play an Audio Clip."
- Unreal Engine: **Sound Cue or MetaSound Source (an asset the game plays, not an event)** | Sound Cue Reference; MetaSounds Reference Guide | UE`sound-cue-reference-for-unreal-engine`, UE`metasounds-reference-guide-in-unreal-engine` | A Sound Cue is "an audio asset that encapsulates complex sound design tasks within a node graph"; "only MetaSound Sources can generate audio on their own". Closest idea only: these are playable assets, not names the game posts (the handoff, section 14, warns of exactly this), so the cell says so in its own words (audio review, 2026-11-12).

### instance — Instance

- Wwise: **Playing ID** | Wwise SDK, namespace AK::SoundEngine reference | WS`namespace_a_k_1_1_sound_engine.html` | `AkPlayingID PostEvent(...)`; functions `StopPlayingID`, `ExecuteActionOnPlayingID`, `SetRTPCValueByPlayingID`. Each posted event returns a playing ID that later calls act on.
- FMOD Studio: **Event instance** | FMOD Studio User Manual, Glossary 28.48 "Event Instance"; Concepts 2.3.1 | FS`glossary.html` | "Your game can play multiple instances of each event in your project."
- Unity: — | No named idea of an instance in the engine's own audio pages read (Audio Source, Audio Mixer, Audio Random Container). Left as a dash. Look for instead: "The Audio Source that is playing. A script reaches the sound through it." (Basis: the Audio Source "plays an Audio Clip in your scene and provides options to customize its playback behavior", UM`reference/class-audio-source`, re-read 2026-11-12; audit 2, accuracy B3: the emitter component is also the handle on the playing sound.)
- Unreal Engine: — | The Audio Glossary defines "voice" ("An active sound source"), which this lab teaches as a different idea from an instance. No close term verified. Left as a dash. Look for instead: "The Audio Component that is playing. The game reaches the sound through it." (Basis: Audio Glossary, "audio component": "Attaches to an actor to provide a sound source"; audit 2, accuracy B3.)

### parameter — Parameter

- Wwise: **Game Parameter, linked by an RTPC** | Wwise Help, Glossary, entries "Game Parameter" and "RTPC" | WH`glossary` | Game Parameter: "A parameter from the game, such as speed and RPMs in a car racing game for example, that can be mapped to Wwise property values using RTPCs." RTPC: "Real Time Parameter Controls. An interactive method used to drive the audio in game by mapping Game Parameter values to properties in Wwise."
- FMOD Studio: **Parameter** | FMOD Studio User Manual, Glossary 28.106 "Parameter"; Concepts 2.9.1 | FS`glossary.html` | "A parameter is an event property that can be used to trigger and control an event's instruments, logic markers, and automatable properties." "Parameters are properties of an event that can be updated at any time by your game's code".
- Unity: — | The Unity User Manual has "Exposed Parameters" of an Audio Mixer (UM`mixer/overview`: "You can expose any parameter within an Audio Mixer to a script through a string name."), but an exposed parameter moves a setting of a whole mixer group, while this lab teaches a parameter as a value on one playing sound. The audio review (2026-11-12) judged the name misleading in this row. Left as a dash. Look for instead: "A script changes the settings of the Audio Source while it plays." (Basis: the Audio Source "provides options to customize its playback behavior". No property is named in the line, because the property table was not read.)
- Unreal Engine: **Input of a MetaSound** | "MetaSounds: The Next Generation Sound Sources"; MetaSounds Reference Guide | UE`metasounds-the-next-generation-sound-sources-in-unreal-engine`, UE`metasounds-reference-guide-in-unreal-engine` | "MetaSounds can accept custom user input parameters"; "You can create additional Inputs and Outputs in the Members panel of the MetaSound Editor."

### switch — Switch

- Wwise: **Switch, in a Switch Group** | Wwise Help, Glossary, entries "Switch" and "Switch Group" | WH`glossary` | "A Switch represents the alternatives that exist for a particular element in game". Switch Group: "A collection of related Switches that have been grouped together". The SDK events page shows `SetSwitch( Grass, GameObj_X )`: the choice is per game object.
- FMOD Studio: **Labeled parameter, local** | FMOD Studio User Manual, Glossary 28.76 "Labeled User Parameter" and 28.81 "Local Parameter" | FS`glossary.html` | "Labeled user parameters are a kind of parameter that use strings (labels)." "If a parameter is local, it can have a different current and set value in every instance of every event".
- Unity: — | No close idea in the engine's own audio pages read. Left as a dash. Look for instead: "A script chooses which Audio Clip the Audio Source plays." (Basis: an Audio Source plays an Audio Clip; nothing in the engine's own audio makes the choice.)
- Unreal Engine: **Switch node in a Sound Cue** | Sound Cue Reference, node "Switch" | UE`sound-cue-reference-for-unreal-engine` | The Switch node "selects an input node based on the value of a runtime integer parameter."

### state — State

- Wwise: **State, in a State Group** | Wwise Help, Glossary, entries "State" and "State Group" | WH`glossary` | State: "A global offset or adjustment to the game audio properties that relates to changes in the physical and environmental conditions in the game." State Group: "A collection of related States that have been grouped together to help manage the global changes".
- FMOD Studio: **Global parameter** | FMOD Studio User Manual, Glossary 28.71 "Global Parameter" | FS`glossary.html` | "A global parameter is a parameter, all instances of which share the same current and set values even if they are in different events."
- Unity: — | No close idea in the engine's own audio pages read (a Snapshot is a mix setup, listed under "mix"). Left as a dash. Look for instead: "A script keeps the mode. For the mix, see Snapshot of an Audio Mixer." (The second sentence points at this tool's own cell in the "mix" row.)
- Unreal Engine: — | No close idea verified. Left as a dash. Look for instead: "The game’s own code keeps the mode. For the mix, see Control Bus Mix." (The second sentence points at this tool's own cell in the "mix" row.)

### random — Random choice among takes

- Wwise: **Random Container** | Wwise Help, Glossary, entry "Random Container" | WH`glossary` | "A group of one or more sounds, motion objects, and/or containers that are played back in a random order."
- FMOD Studio: **Multi instrument** | FMOD Studio User Manual, Glossary 28.99 "Multi Instrument" | FS`glossary.html` | "A multi instrument is a kind of instrument with a playlist. When the instrument is triggered, an item from its playlist is selected for play."
- Unity: **Audio Random Container** | Unity User Manual, "Audio playlist randomization" | UM`random-container` | "Use an Audio Random Container asset to set up a playlist that you can play back in different ways."
- Unreal Engine: **Random node in a Sound Cue, or Random Get node in a MetaSound** | Sound Cue Reference, node "Random"; MetaSound Function Nodes Reference Guide, node "Random Get" | UE`sound-cue-reference-for-unreal-engine`, UE`metasound-function-nodes-reference-guide-in-unreal-engine` | The Random node is "used to randomly trigger a node from the list of connected input nodes." The MetaSound node: "The Random Get node randomly retrieves elements from an input array." "Optionally, an array of weights can be supplied to adjust the randomness." (The second name was added after audit 2, accuracy B3: a newcomer inside a MetaSound finds no Random node. Read on Epic's page 2026-11-12, headed "Unreal Engine 5.9 Documentation".)

### bus — Bus

- Wwise: **Audio Bus** | Wwise Help, Glossary, entries "Audio Bus" and "Main Audio Bus" | WH`glossary` | "An optional bus that can be grouped (with other Audio and Auxiliary Busses) under a Main Audio Bus to help in the organization and delivery of your sound mix." (This version names the top bus "Main Audio Bus".)
- FMOD Studio: **Group bus** | FMOD Studio User Manual, Glossary 28.26 "Bus" and 28.72 "Group Bus" | FS`glossary.html` | "a bus is a modular component of the mixer that produces a submix from the signals that are routed into it and has its own signal chain". "A group bus is a kind of bus."
- Unity: **Group of an Audio Mixer** | Unity User Manual, "Introduction to the Audio Mixer" | UM`mixer/overview` | "The Audio Mixer performs this category-based mixing through a hierarchy of groups that you construct inside the asset." The page also writes "AudioGroup".
- Unreal Engine: **Sound Submix** | Audio Glossary, entry "sound submix" | UE`audio-glossary-in-unreal-engine` | A DSP graph that mixes the audio of individual sounds into one output buffer and applies effects (paraphrase by the fetch tool).

### mix — Snapshot (a saved mix setup)

The idea was headed "Saved mix setup" until audit 2 (learning L-33): the glossary and page 16 call it a snapshot, so the card now leads with that word and keeps the plain words beside it. The four cells did not change.

- Wwise: **State** | Wwise Help, "Working with States" | WH`working_with_states` | "Using States optimizes your sound and music assets by giving you the flexibility to create different 'mixer snapshots' for the same sound, and apply these property changes globally in response to changes in the game."
- FMOD Studio: **Snapshot** | FMOD Studio User Manual, Glossary 28.158 "Snapshot" | FS`glossary.html` | "A snapshot is an instanceable unit of changes to the project mix that can be triggered, controlled, and stopped from game code in the same manner as an event."
- Unity: **Snapshot of an Audio Mixer** | Unity User Manual, "Introduction to the Audio Mixer" | UM`mixer/overview` | "Snapshots capture the state of every parameter setting in an Audio Mixer, and you can transition between them at runtime."
- Unreal Engine: **Control Bus Mix** | Audio Glossary, entries "control bus mix" and "sound class mix" | UE`audio-glossary-in-unreal-engine` | Control bus mix: an array of mix stages that drive the values used by control buses. The glossary says the older "sound class mix" is being replaced by Audio Modulation, so the map names the newer one (paraphrase by the fetch tool).

### bank — Sound bank

- Wwise: **SoundBank** | Wwise Help, Glossary, entry "SoundBank" | WH`glossary` | "A group of Event data, Sound, Music, and Motion structure data, and/or media files that will be loaded into the game's platform memory at a particular point in a game."
- FMOD Studio: **Bank** | FMOD Studio User Manual, Glossary 28.17 "Bank"; Concepts 2.11 | FS`glossary.html` | "A bank is a collection of events and assets from your FMOD Studio project, formatted and compressed for use with the version of the FMOD Engine integrated into in your game."
- Unity: — | The engine packages content with general systems that are not an audio idea. No close audio term. Left as a dash. Look for instead: "No audio bank. The engine packs sounds with the rest of the game."
- Unreal Engine: — | As Unity: no audio-specific bank verified. Left as a dash. Look for instead: "No audio bank. The engine packs sounds with the rest of the game."

### emitter — Emitter

- Wwise: **Game Object** | Wwise Help, Glossary, entry "Game Object"; "Profiler Views" | WH`glossary`, WH`game_profiler` | "Entity in a game to which elements such as an interface, a Trigger, or a Sound can be attached." The Game Object Profiler monitors "game objects registered in your game, including in their roles as emitters, listeners, or both simultaneously."
- FMOD Studio: **Studio Event Emitter, in FMOD for Unity** | FMOD for Unity User Manual, "Game Components" 4.2 "Studio Event Emitter" | FU`game-components.html` | "Use the Add Component button and select FMOD Studio Event Emitter." FMOD Studio's own glossary has no "emitter" entry (a position belongs to an event instance), so the map names the integration's component and says so in the cell.
- Unity: **Audio Source** | Unity User Manual, "Audio Source" reference | UM`reference/class-audio-source` | "a component that plays an Audio Clip in your scene and provides options to customize its playback behavior."
- Unreal Engine: **Audio Component** | Audio Glossary, entry "audio component" | UE`audio-glossary-in-unreal-engine` | "Attaches to an actor to provide a sound source."

### listener — Listener

- Wwise: **Listener** | Wwise Help, Glossary, entry "Listener" | WH`glossary` | "A virtual microphone or motion sensor in the game that helps assign the sounds to particular speakers".
- FMOD Studio: **Listener** | FMOD Studio User Manual, Glossary 28.78 "Listener" | FS`glossary.html` | "A listener represents a virtual pair of ears that pick up output from event instances."
- Unity: **Audio Listener** | Unity User Manual, "Audio Listener" reference | UM`reference/class-audio-listener` | "The Audio Listener acts as a microphone-like device."
- Unreal Engine: **Listener** | Audio Glossary, entry "listener" | UE`audio-glossary-in-unreal-engine` | The point that "hears" sound; in Unreal Engine it is the camera by default (paraphrase by the fetch tool).

### profiler — Profiler

- Wwise: **Profiler layout** | Wwise Help, "Profiling" and "Profiler Views" | WH`profiling`, WH`game_profiler` | "The Profiler layout allows you to capture and monitor the performance of each game element as it occurs." Its views include the Capture Log and the Performance Monitor.
- FMOD Studio: **Profiler window** | FMOD Studio User Manual, chapter 12 "Profiling" | FS`profiling.html` | "FMOD Studio's profiler allows you to assess the performance and output of your project's events, mix, and snapshots." "You can open the profiler window by clicking Window > Profiler."
- Unity: **Audio Profiler module** | Unity User Manual, "Audio Profiler module reference" | UM`profiler` | "The Audio Profiler module monitors the performance of the audio system in your application, such as the total load and voice counts."
- Unreal Engine: **Audio Insights** | "Audio Insights in Unreal Engine" | UE`audio-insights-in-unreal-engine` | It "provides a suite of tools to profile, debug, and monitor runtime aspects of audio in Unreal Engine". The 5.9 page carries no beta or experimental note.

## Two sentences about Wwise on page 20

Page 20 says: "In Wwise, Game Syncs are Switches, States, Game Parameters (linked by RTPCs) and Triggers. A Wwise Trigger starts a music stinger." (Until audit 2 the page said: "In Wwise, the word Trigger means one thing only: the Game Sync that starts a music stinger." Page 8 then called the lab's own four kinds of game information "Game Syncs", which contradicted it: accuracy A1, learning L-01.)

- Wwise Help 2025.1.12, Glossary, entry "Trigger" | WH`glossary` | "A Game Sync that responds to a spontaneous occurrence in the game and launches a Stinger." Entry "Stinger": "A brief musical phrase that is superimposed and mixed over the currently playing music." Checked 2026-11-12.
- Wwise Help 2025.1.12, Glossary, entry "Game Sync" | WH`glossary` | Read by the lead in a browser on 2026-11-12 (the site refuses automated fetches): a Game Sync is a State, a Switch, an RTPC, a Trigger or an Argument. The page lists the four a newcomer meets and leaves out Argument (it belongs to dynamic dialogue, which this lab does not teach); it does not say the list is complete.
- The glossary chip "Game Syncs" (`src/screens/lab/gameaudio/gaTerms.ts`) and page 8 say the same thing in their own words. Change the three together.

## Unreal Engine: two systems (page 20 says so once)

Page 20 says: "Unreal Engine builds a sound in two ways: the older Sound Cue and the newer MetaSound. A card names the closer one." The cells that name a Sound Cue node (Switch, Random) and the cells that name a MetaSound (Parameter; Random Get) are each recorded in their rows above. Audit 2, accuracy B3.

## The usual windows (page 20, part A)

`GA_TOOL_WINDOWS` is a general teaching picture, not one product. Each kind of window was seen in at least two of the tools' own pages on 2026-11-12. The picture numbers them in reading order, 1 to 8:

| Kind of window | Seen as |
|---|---|
| 1 Sound files and containers | FMOD Studio: assets browser, audio bin window (Glossary 28.8, 28.12). Wwise: Containers hierarchy, Random / Sequence / Switch / Blend Container (Glossary). |
| 2 The event list | FMOD Studio: events browser (Glossary 28.55). Wwise: Events ("Managing Events"). |
| 3 Game information | Wwise: Game Syncs: States, Switches, RTPCs, Triggers (Glossary "Game Sync"). FMOD Studio: parameters browser (Glossary 28.112). |
| 4 The music editor | Wwise: Interactive Music, Music Segment, Music Playlist Container (Glossary). FMOD Studio: timeline sheet with tempo markers and transition regions (Glossary 28.173 to 28.184). |
| 5 The properties panel | FMOD Studio: the deck, which shows "the properties or signal chain of the currently-selected item" (Glossary 28.36), and panels (28.104). Wwise: the Property Editor, listed among the Voice Profiler layout's views ("Profiler Views"). Unity: the AudioGroup Inspector (a page linked from UM`mixer/overview`). |
| 6 The mixer | FMOD Studio: mixer window, mixing desk (Glossary 28.96, 28.97). Wwise: Mixing Desk (Glossary). Unity: Audio Mixer window. |
| 7 The audition controls | Wwise: Soundcaster (Glossary). FMOD Studio: sandbox window, transport controls (Glossary 28.136, 28.15). (Named "A way to audition" until audit 2, learning L-33.) |
| 8 The profiler | The four entries of the "profiler" row above. |

The paragraph on page 20 about a game engine's editor ("the level, a list of its objects, and a properties panel for the selected object") is the learning review's wording (2026-11-12). It names no product and no window by a product's name.

The "met in this lab" page titles in `GA_TOOL_WINDOWS` are the lab's own `PageDef.title` strings (the test reads them from the page files).

## Audit 2 (2026-11-12, night)

Report: `docs/labs/gameaudio/reviews/AUDIT2_ACCURACY_2026_11_12.md`, section 3 (every cell), findings B3, B9, B10; `AUDIT2_LEARNING_WORDS_2026_11_12.md`, findings L-05, L-33.

| Who | What was re-read | Result |
|---|---|---|
| Accuracy auditor | 27 cells (FMOD Studio, Unity, Unreal Engine columns) on the vendors' own pages | All 27 right. The Wwise column (12 cells) could not be fetched (HTTP 403) and was judged from professional knowledge and this record. |
| Lead | Nine of the twelve Wwise names on Audiokinetic's glossary, in a browser: Game Parameter and RTPC, Switch Group, State, State Group, Random Container, Audio Bus, SoundBank, Game Object, Listener; and the entries "Game Sync" and "Trigger" | All nine right. Event, Playing ID and the Profiler layout are product names that are not entries of that glossary page; they stand on the first builder's reading recorded in their rows. |
| Page fixer | MetaSound Function Nodes Reference Guide ("Random Get"); Unreal Engine 5.9 release notes page (its title says Preview); Unity "Audio Source" page (its opening sentence, version 6.6 / 6000.6) | The Random cell gained the MetaSound node; the version line above now says 5.9 is a Preview; the nine "Look for instead" lines were written from words already in this record. |

What changed in the map: one cell (Unreal Engine, Random choice), one idea heading (Snapshot), one window name (The audition controls), one meaning (Instance: "One copy of a sound that is playing now."), and nine "Look for instead" lines. No cell was removed and no dash was filled.

What this record still cannot claim: the three Wwise product names listed above were not re-read in audit 2; FMOD Studio's exact revision is unconfirmed; the Unity Audio Source property table was not read (so no "Look for instead" line names a property).
