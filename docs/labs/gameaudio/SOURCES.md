# Game Audio Lab — sources, simplifications, unknowns (internal)

Must-do row D60. Owner plan: `Downloads\2026-11-12_GAME_AUDIO_LAB_PLAN.md`. Owner's original brief: `Downloads\Game-Audio-Foundations-Lab-Claude-Code-Handoff.pdf` (its reference list R1–R17 is the starting source set).

**None of this is shown to the learner** (lab visual charter §12): no source names, no citations, no badges. Research and accuracy stay mandatory in how the lab is built.

## 1. Vocabulary

| What | Source | Checked |
|---|---|---|
| The 103 terms in `src/screens/lab/gameaudio/gaTerms.ts` | The app's own glossary, base table `glossary`, matched by exact `term` (project yjgolswjggmlpeowvtxr, read-only) | 2026-11-12: 103 asked, 103 found |
| Which of the 103 a page shows | Audit 2 found 89 shown as chips, not the first handoff's "103 used" (accuracy B7, learning L-30). In the fix round pages 6, 13 and 14 added Audio pipeline, Head tracking and Music transition rule: 92 are shown. The other 11 are kept, unshown, in `GA_TERMS_KEPT_UNSHOWN` in `gaTerms.ts`, which says why; `test/gameAudioTerms.test.ts` fails if a term is shown nowhere and not on that list | 2026-11-12, audit 2 |
| The meanings in `gaTerms.ts` | Each agrees with that entry's `plain_english`, shortened and pointed at the lab. After audit 2 the Wwise-only words say they are Wwise's (Game Syncs, RTPC, Switch group, State group, Switch container, Blend container, Random and Sequence container), "Layer container" says it is a general word, and three meanings were corrected (FMOD "Another widely used…", voice chat "the platform or the game can dip…", Unreal Engine "widely used", not "powerful") | 2026-11-12, audit 2 |
| "Localization" | In the glossary it means hearing where a sound is. The lab never uses it for language versions. | 2026-11-12 |
| Tool names on page 20 | See `SOURCES_TOOLS.md` (one row per name, with the vendor page and the date) | per row |

## 2. Sounds (asset provenance)

Every asset in `src/screens/lab/gameaudio/sounds/gaSoundBank.ts` is `made: 'app'`: synthesized by `sounds/gaSynth.ts`, original to this app. No third-party recording, sample library or licensed material is used, so there is nothing to license or attribute.

**The bank holds 39 records: 12 footsteps, 26 other sounds and 1 impulse response** (counted from `GA_ASSETS` on 2026-11-12, after audit 2). The first handoff's "all 28 sounds" was wrong (audit 2, SND F31); learner text says "every sound is made inside the app" with no count.

| Asset group | How it is made | Pinned by |
|---|---|---|
| Footsteps, 3 surfaces × 4 takes | Heel and ball-of-foot contacts; the surface is the recipe (wood: low modes; stone: a short hard click; gravel: grains) | `test/gameAudioSounds.test.ts` |
| Door opening (`door`, `door_open.wav`) | "Door opening: latch, hinge, thud". Latch clicks, a stick-slip hinge, the leaf's thud | same |
| Door closing (`door_close`, `door_close.wav`) | NEW in audit 2 (SND F13): "Door closing: thud, then the latch". The model posts it on the same event, `Play_Door`, when the door closes | same |
| Latch rattle (`door_rattle`) | "Loose latch settling": a bouncing run of metal pings, the door event's second layer, 1 s after the door | same |
| Generator hum and fan (two loops) | Harmonics of 50 Hz with 12.5 / 25 Hz roughness (whole cycles in 2 s); band noise. CHANGED in audit 2 (SND F6): the hum has partials up to 2 kHz, so it is heard on a small speaker | same |
| Fountain (`fountain`) | CHANGED in audit 2: droplets over a soft bed, an 8 s loop. The new file is 3.6 dB quieter, so the model raised the fountain layer about 3 dB | same |
| Room tone, courtyard wind (`amb_room`, `amb_yard`) | Band noise with wandering level, crossfaded into loops. CHANGED in audit 2: the courtyard bed has two gusts per pass and NO birds ("Courtyard wind"); the model plays the room tone layer at −12 dB and the wind at −8 dB (SND F12) | same |
| Bird calls (`bird_1`, `bird_2`, `bird_3`) | NEW in audit 2 (SND F14): three one-shots ("two rising whistles", "three notes", "a fast trill"). The model posts one every 4 to 9 scene-seconds while SCENE is on, priority 5, range 3 to 22 m, with ±2 dB and ±60 cents of variation; they were six fixed notes inside the wind loop before | same |
| Courtyard wind, unprepared | The same wind cut with no loop preparation: a level jump of more than 10 dB at the join (the fault lesson 10 plays) | same |
| Impact, debris, alarm, interface cues | Modal thud and knock; scatter; a two-tone beeper; two-note cues. CHANGED in audit 2: the crate is knocks with a lighter second knock; the wood footstep has a heel click and board modes; the model plays the alarm 5 dB lower (layer −11 dB, SND F20) | same |
| Music: three layers and a stinger | One 4-bar phrase at 96 BPM (Am F C G), rendered into a ring so every layer loops seamlessly. CHANGED in audit 2: the stinger is a half-beat noise swell, then an open-fifth hit (A and E, no third), and the hit lands ON the line; its file begins 0.3125 s (half a beat) before the line | same |
| Voice lines | Cuts of the app's wordless stand-in voice (`dj/engine/djVoice`). **Stand-in until the owner records the English and Spanish lines.** | same |
| Room reverb | A decaying-noise impulse response, about 1.1 s. CHANGED in audit 2 (SND F1): the impulse is converted to the device rate, so the reverb really sounds; the wet sound is about 15 dB under the dry one for the generator. A device that cannot load it says so, and the model keeps the workshop dry (`reverbAvailable`) | same |

WAVs of every sound as it is after audit 2 (rendered offline, never played): the fix round's scratchpad folder `ga_fix_e\wav\`. Only the owner's ears can settle the wood step, the fountain, the birds, the crate's second knock, the closing door, the hum's 480 Hz body, the stinger, and whether the reverb is audible enough on page 12.

When an owner recording replaces an asset, change its record to `made: 'recorded'` and add a row here: who recorded it, where, the date, and that the owner holds the rights.

## 3. Simplifications register (and how the learner is told)

| Simplification | Told to the learner |
|---|---|
| People and objects are drawn about 2.5× larger than life; positions and distances are true | Once, on page 1 (a concept lab carries no accuracy chip: owner 2026-10-31, D37) |
| Distance: full level inside the minimum distance, 1/distance beyond it, a fade to silence over the last fifth of the range. The generator: minimum 4 m, maximum 12 m since audit 2 (were 2 m and 13 m; SND F6, W1 F01), so −6 dB per doubling from 4 m and the fade from 10.4 m | Page 11, in plain words ("a real game draws its own curve for each sound") |
| Direction: a left/right pan from the angle to where the listener faces; front and back pan the same. The widest pan is 85% (`GA_PAN_WIDTH`, audit 2 SND F25): at FACING 0° on page 4 the generator is 81% right for your ears and 55% for the camera (were 96% and 65%) | Page 11 and page 13, plainly |
| The wall: −9 dB and a low-pass filter (12 dB per octave) at about 900 Hz when listener and source are in different zones with the door closed. Measured after the new hum: the generator is 11.8 dB under the greeting line at the page-open position, so the numbers stay (audit 2, decision 8). The door's own sound is never wall-treated (SND F13) | Page 12, once: "an authored treatment, not a simulation", and "a low-pass filter" (audit 2, B1) |
| NO LINE OF SIGHT. The treatment is decided by the two zones and the door only. With the door open there is no treatment anywhere, even where a straight line from the source meets solid wall (audit 2, A3); a real game also checks the path through the doorway and treats the sound that bends round its edge | Page 12, step 2, in its own sentence (lead's decision 7: "door closed, treatment on; door open, treatment off, wherever you stand"). The old entry "Covered by the same page 12 note" was not true and is replaced by this row |
| Reverb: one convolution with one impulse response for the workshop | Page 12 |
| Headphone 3D uses the device browser engine's own head-related panner (not a personal measurement) | Page 13 |
| The overhead camera listens from the middle of the scene: its height (6 m) narrows the pan; level is measured along the ground | Page 4 |
| Headphone 3D filters are made for one typical head, not the learner's own | Page 13 |
| The 5.1 map on page 13 is a picture of a layout (front 0 and plus/minus 30 degrees, surrounds plus/minus 110 degrees, after ITU-R BS.775; no angle is printed) | Page 13, in the figure's caption |
| Music requested with sound off still waits for its boundary, counted in scene time | Page 14 |
| Each page opens on a CLEAN scene: start positions, door closed, generator off, nothing playing, mood calm, standard settings, an empty log. Kept: sound on/off, the lab level, and the record of goals done | Not told; it is what a learner expects (each DJ Systems Lab screen does the same) |
| The picture's rings show level at the listener after distance, the wall and the mix (bus fader, mute, solo, duck). A generator's rings spread at one of three paces by its speed. The alarm's rings are broken into segments. A source silenced by the mix, or tracked but not played, keeps one still dashed ring | Page 2 (rings and pace); pages 5 and 16 (solo and mute) |
| The voice rule (least important first, the oldest of equally unimportant ones, protected never, otherwise refuse the new sound) is this lab's rule | Page 17, once |
| A stolen LOOP becomes virtual (tracked, silent, marked stolen) and returns when a voice is free, most important first; a stolen one-shot stops; a new loop refused a voice starts virtual. The budget never switches a generator or the scene off (audit 2, A2; lead's decision 4). Before audit 2 it did | Page 17 |
| Voice count: the music layers and the stinger are not counted as voices, and a loop at zero level is. Real engines count every music layer and usually make a silent loop virtual (audit 2, A5) | Pages 14 and 17 (and 1 and 10 where they mention it) say this scene simplifies. Counting the music is HELD for the owner (decision 5) |
| Speed is kept on the generator (the game object); each instance playing on it follows it, and a speed set while nothing plays is kept for the next start (audit 2, A4) | Pages 2, 7 and 8 (decision 6), and the capstone's summary |
| Ducking is event-driven (line starts / last line ends), not level detection | Page 16 |
| Multiplayer is simulated in one device; no network is used. A network action is SENT, then ARRIVES 0.25 s later (`GA_NET_DELAY_S`, audit 2, B5); a landed flight is kept 4 s for the picture | Page 18 |
| Courtyard birds call every 4 to 9 scene-seconds while SCENE is on, so PLAYING and VOICES rise by one for about half a second, and a bird can be the first voice stolen | Not told as a number; the picture draws BIRD where it calls |
| BURST posts its 12 crate impacts over 0.3 s, each with its own level and pitch (was one instant, heard as one hit: SND F28) | Page 17 |
| Music changes are written at the audio clock time of the boundary; the "applied" report comes from a timer just after it | Not told (an implementation detail; the audio itself is on the clock) |

## 4. Unknowns and open proofs

| Item | State |
|---|---|
| Sound engine on Android (web view transport) | NOT PROVEN. The Pixel was not connected on 2026-11-12. |
| Sound engine on iPhone (web view transport) | NOT PROVEN. Needs a preview update on the owner's GO. Check the ring/silent switch, interruption by a call, and headphone removal. |
| Sound engine on web | PROVEN 2026-11-12 in the preview, measure-only (output held at zero): start, overlap, loop, a 12.0 dB ramp, full left/right pan, stop, a change on the exact bar, suspend and resume. Not yet heard by ears. |
| Synthesis time on a phone | NOT MEASURED. Assets are built one per macrotask on first use to keep taps responsive. |
| Frame rate of the scene on the Pixel | NOT MEASURED. |

## 5. Corrections log

| Date | What | Why |
|---|---|---|
| 2026-11-12 | The overhead camera made distant loops go virtual by height alone; the budget could be set below the protected voices; a stolen generator still showed as running; the warning line had no second-language take; a network repeat to the other player counted as a double | Found by the page builders while writing lessons against the model; fixed in the model and pinned in gameAudioModel.test.ts |
| 2026-11-12 | Two wood footstep takes were too alike; a click at the calm music layer's loop join; the unprepared wind's jump was under 10 dB | Caught by the first run of `gameAudioSounds.test.ts`; fixed and pinned |
| 2026-11-12 | Review round 1 (three independent reviewers: audio accuracy, learning design and language, visual and function). Every page now opens on a clean scene; the picture now shows solo, mute, the duck, generator speed, the alarm and the guide's line; the SPEED log line prints a percentage; an unheard spoken line lasts as long as its own take; a start that was still loading when the page changed is dropped; ■ STOP with nothing playing no longer completes a goal; the guide stands clear of the doorway line; nobody can walk to where the edge of the picture cuts them; the accuracy chip was removed (concept lab) | `docs/labs/gameaudio/reviews/REVIEW1_*_2026_11_12.md`; pinned in `gameAudioModel.test.ts` |
| 2026-11-12 | Audit 2 (five independent auditors: sound engine, accuracy, learning and words, and two hands-on walks) and its fix round. The sounds, the model and the pages changed as listed in sections 1 to 3 above | See "Audit 2" below |

## 6. Audit 2 (2026-11-12)

The five reports, in `docs/labs/gameaudio/reviews/`:

| Report | Lens | Findings |
|---|---|---|
| `AUDIT2_SOUND_ENGINE_2026_11_12.md` | Every sound measured offline; the engine's path; the engine check screen | F1 to F31 |
| `AUDIT2_ACCURACY_2026_11_12.md` | Data, accuracy, the model's truth, every check; page 20's tool map cell by cell | A1 to A5, B1 to B10 |
| `AUDIT2_LEARNING_WORDS_2026_11_12.md` | Learning and wording; words per page; one name for each thing | L-01 to L-37 |
| `AUDIT2_WALK_P01_P11_2026_11_12.md` | Hands-on walk of pages 1 to 11 at 390 × 844, sound off | F01 to F25 and the animation table |
| `AUDIT2_WALK_P12_P22_2026_11_12.md` | Hands-on walk of pages 12 to 22 and the end screen | W2-01 to W2-34 |

What the fix round changed in this record: the sound list and its count (section 2), the generator's distances, the pan width, the wall's filter wording and the no-line-of-sight row, the voice rule and the stolen loop, the voice count, where the speed is kept, the network delay, the birds and the burst (section 3), and which glossary terms are shown (section 1). The tool map's record is `SOURCES_TOOLS.md`, which has its own "Audit 2" section.
