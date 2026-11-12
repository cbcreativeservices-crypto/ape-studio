# Game Audio Lab — audio-expert review, round 1 (2026-11-12)

Independent, read-only review of all 22 pages by a reviewer briefed as a senior game audio lead. Traced in the code, not run in the app and not heard. Paths are under `src/screens/lab/gameaudio/`. S1 = wrong or a broken promise; S2 = unclear or below the house rules; S3 = polish.

## Defects

**[S1] p14 (and p08)** `pages/p14Music.tsx:196–203`, `pages/p08GameSyncs.tsx:192`, `pages/guides/p14.ts` (intro.start, tryThis[0]). The steps assume MOOD CALM, but p08 leaves the mood on ALERT, the page-open reset did not restore it, and a repeated mood is dropped by the model. So START plays all three layers, "Switch PULSE on" is impossible, "press MOOD ALERT" does nothing, and the WITHDRAWN lesson does not happen; the goal "Change your mind while a change waits" does not tick by following the text. Fix: p14:196 "Open MUSIC and press START. Switch PULSE off or on, then back. Then press the MOOD key that is not lit." p14:202 "Set CHANGE AT to NEXT PHRASE. Press the MOOD key that is not lit, then the other MOOD key before the phrase ends. Then press STINGER." Same in the guide. Also reset mood and layers on page open (model).

**[S1] p10** `pages/p10Loops.tsx:163–177` (check), `:192` (fault why), `:80–82` (chips), `pages/guides/p10.ts` teaches[2]. "A bed starts once, when the listener enters its zone" contradicts the model (both beds start with the scene; a crossing only changes levels) and the page's own step 2. Fix: question "You stay inside the workshop and walk around. How many copies of the room tone are playing?"; correct option "One: it started once, with the scene."; explain "In this scene both beds start once, with the scene, and keep playing. Entering a zone raises that zone's bed and lowers the other. Moving inside a zone changes nothing."; fault why "…each report started the bed again. A bed needs one start. Here both beds start once, with the scene, and a crossing only changes their levels."; chip "ONCE, WITH THE SCENE"; guide "A bed starts once and keeps playing. Position updates inside a zone start nothing."

**[S1] p11** `pages/p11Distance.tsx:104`, `pages/guides/p11.ts` tryThis[0]. "the level halves, a drop of 6 dB, each time the distance doubles. At the maximum it is silent." omits the linear fade over the last fifth of the range (`model/gaWorld.ts`), and the page's own LEVEL FROM DISTANCE readout then breaks the stated rule. Fix: "Beyond it the level halves, a drop of 6 dB, each time the distance doubles. Over the last fifth of the way to the maximum it also fades, so it reaches silence at the maximum." Guide: add "Start closer than 7 m: near MAX the extra fade is added."

**[S1] p19** `pages/data/gaFaults.ts:102–106`, `pages/p19Testing.tsx:52–55`. Fault 4 can be unreachable: the symptom needs YOU off the wood floor, but an earlier page can leave the player in the workshop with any facing, and p19 has no place or facing control. Fix: add place chips to the TEST tray ("GO: STONE PATH", "GO: WORKSHOP") as pages 8 and 10 do.

**[S2] p12** `pages/p12Walls.tsx:138–139`. The page shows "Obstruction" and "Audio Occlusion" but never says which is which or which one the door is. Add: "Tools often call a blocked straight path in the same space obstruction: the direct sound is muffled and the echoes still arrive. They call a source behind a wall occlusion: the whole sound is lower and duller. The closed door in this scene is an occlusion treatment."

**[S2] p08** `model/gaModel.ts` log line "STATE mood = … (a global state: every listener of it changes)": "listener" collides with the term Audio listener. Fix: "(a global state: everything that reads it changes)".

**[S2] p06** `pages/p06Pipeline.tsx:87`, `pages/guides/p06.ts` teaches[2]. "A sound bank is one tool's kind of package" (page 20 lists two tools). Fix: "A sound bank is the kind of package some tools use, not a universal file type." Guide: "A sound bank is how some tools package sounds and their rules."

**[S2] p17** `pages/p17Budgets.tsx:110, :118`. The MEMORY card prints the wind as 10 s and 240,000 samples under a note about 48,000 samples per second (its 24 kHz rate is only in the accessibility label); and "Each sample is kept as a 32-bit number" is true of this lab, not of games. Fix row: show `samples per second`. Fix note: "This lab keeps each sample as a 32-bit number, which is 4 bytes. One second of one channel at 48,000 samples per second is 48,000 × 4 = 192,000 bytes. A real game often keeps a sound compressed in memory and decodes it while it plays: less memory, more processing time. A long sound is often streamed from storage."

**[S2] p15 / p16 / p18 / p19** "the English recording", "a recording that stands in for live chat", "The recording was fine": page 1 says every sound is made in the app. Fix: p15:64 "The next line uses the English take and the English text."; p18:169 "The chat line is a stand-in sound for live chat."; `pages/data/gaMix.ts:30` "A stand-in voice for other players talking feeds this bus."; `pages/data/gaFaults.ts:76` "The line itself was fine, and it played."; guide p15 "its text and its take".

**[S2] p15** The "Spanish take" is the same wordless phrase played slower, so it is longer and also lower; the student is not told why the voice is deeper. Add to the note at `p15Dialogue.tsx:165`: "The Spanish take is the same stand-in voice played slower, so it is longer and also lower."

**[S2] p15** `model/gaStore.ts`: with sound off every `vo_` line lasted a guessed 2.6 s, so the Spanish line was not longer when unheard. Fix: use the asset's real length.

**[S2] p21** `pages/p21Today.tsx:46, :67`. "This lab's generator works in a similar way" to procedural audio; it is a fixed loop with rate and gain driven by a value. Fix :46 "This lab's generator is not procedural: it is a fixed loop whose pitch and level follow a speed value. A procedural generator would build the hum itself while the game runs." Fix :67 "An engine's hum in a racing game is made live, from synthesis and rules that a designer wrote. What is this?"

**[S2] p11** `pages/p11Distance.tsx:125, :39`. (a) "A loop that passes its maximum distance becomes virtual" is this lab's rule: begin "In this scene, a loop that passes…". (b) Directional emission is missing though the plan lists Cone attenuation for this page: add the term and "Some sources aim their sound like a flashlight; tools call that cone attenuation. The sources in this scene send sound equally in every direction."

**[S2] p05** `pages/p05Sounds.tsx:158`. "From the courtyard the alarm is quieter than the fountain" holds only from the start position with the door closed. Fix: "With the door closed, the alarm reaches the courtyard faint and dull, quieter than the fountain beside you."

**[S2] p02 / p16** Control flow versus signal flow is not taught, and the plan's Signal path view (source → bus → master, control drawn differently) was not built. Minimum: add at `p16Mix.tsx:158` "Audio travels one way: source, bus, master, output. Control travels another way: the game's requests and values tell that path what to do. A duck is a control change. It carries no audio."

**[S2] p13** `pages/p13Formats.tsx:110` (and `gaTerms.ts`). "Channel-based audio ties each sound to a speaker": the CHANNELS are tied to speakers. Fix: "Channel-based audio mixes every sound into a fixed set of channels, one for each speaker of a known layout, such as stereo or 5.1." (The glossary entry itself is the owner's to change.)

**[S2] p20** `pages/data/gaToolMap.ts:73`. Unity "Parameter" = "Exposed parameter of an Audio Mixer" is a real Unity name but it moves a whole mixer group, against the lab's lesson that a parameter is a value on one playing sound. Recommendation: a dash.

**[S2] p20** `pages/data/gaToolMap.ts:56`. Unreal "Event" = "Sound Cue or MetaSound Source": both are assets the game plays, not names the game posts. Recommendation: reword to "Sound Cue or MetaSound Source (an asset the game plays, not an event)".

**[S3] p20** `pages/p20Tools.tsx:63`. In Wwise "Trigger" means the Game Sync that starts a music stinger. Add: "In Wwise, the word Trigger means one thing only: the Game Sync that starts a music stinger."

**[S3] p10** `:153` "The raw cut is the same wind" → "The raw cut is a wind file cut with no loop preparation: it ends in a gust and begins in a lull."

**[S3] p15** `:164` → "In this scene the event that starts the audio also shows the text."

**[S3] p19** `:143` "Only a START line, or your ears, shows that a sound played." → "A START line shows that the audio side started it. Your ears confirm it reached you."

**[S3] p02** `:53` "A game cannot work that way" → "A game cannot work that way for most of its sound."

**[S3] p18** `:169` add "In this scene the chat line does not turn the game down."

No defects found: p01, p03, p04, p07, p09, p22.

## Page 20 tool map, verified 2026-11-12

All 40 non-dash cells were found on the vendors' current pages (Unreal Engine 5.9: 9 cells; Unity 6.6: 7; FMOD Studio 2.03: 12; Wwise 2025.1.12: 12). No wrong name and no retired name. Not checked: the eight dashes (absence cannot be proven) and one Unity spelling whose page returned 404.

## Handoff distinctions

Taught: definition / instance / voice; local versus global scope; event-driven duck versus sidechain; pan versus real 3D; importing versus implementing; every lesson's common mistake. Missing or incomplete at review time: control flow versus signal flow and the signal path view; obstruction versus occlusion named; directional emission; decoding and streaming as memory trade-offs.

## Could not check

Anything by ear or on a phone. The fault-4 dead end was traced in code, not run.
