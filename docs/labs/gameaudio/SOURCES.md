# Game Audio Lab — sources, simplifications, unknowns (internal)

Must-do row D60. Owner plan: `Downloads\2026-11-12_GAME_AUDIO_LAB_PLAN.md`. Owner's original brief: `Downloads\Game-Audio-Foundations-Lab-Claude-Code-Handoff.pdf` (its reference list R1–R17 is the starting source set).

**None of this is shown to the learner** (lab visual charter §12): no source names, no citations, no badges. Research and accuracy stay mandatory in how the lab is built.

## 1. Vocabulary

| What | Source | Checked |
|---|---|---|
| The 103 terms in `src/screens/lab/gameaudio/gaTerms.ts` | The app's own glossary, base table `glossary`, matched by exact `term` (project yjgolswjggmlpeowvtxr, read-only) | 2026-11-12: 103 asked, 103 found |
| The meanings in `gaTerms.ts` | Each agrees with that entry's `plain_english`, shortened and pointed at the lab | 2026-11-12 |
| "Localization" | In the glossary it means hearing where a sound is. The lab never uses it for language versions. | 2026-11-12 |
| Tool names on page 20 | See `SOURCES_TOOLS.md` (one row per name, with the vendor page and the date) | per row |

## 2. Sounds (asset provenance)

Every asset in `src/screens/lab/gameaudio/sounds/gaSoundBank.ts` is `made: 'app'`: synthesized by `sounds/gaSynth.ts`, original to this app. No third-party recording, sample library or licensed material is used, so there is nothing to license or attribute.

| Asset group | How it is made | Pinned by |
|---|---|---|
| Footsteps, 3 surfaces × 4 takes | Heel and ball-of-foot contacts; the surface is the recipe (wood: low modes; stone: a short hard click; gravel: grains) | `test/gameAudioSounds.test.ts` |
| Door, latch rattle | Latch clicks, a stick-slip hinge, the leaf's thud; a bouncing run of metal pings | same |
| Generator hum and fan (two loops) | Harmonics of 50 Hz with 12.5 / 25 Hz roughness (whole cycles in 2 s); band noise | same |
| Fountain, room tone, courtyard wind | Band noise with wandering level; cross-faded into loops | same |
| Courtyard wind, unprepared | The same wind cut with no loop preparation: a level jump of more than 10 dB at the join (the fault lesson 10 plays) | same |
| Impact, debris, alarm, interface cues | Modal thud and knock; scatter; a two-tone beeper; two-note cues | same |
| Music: three layers and a stinger | One 4-bar phrase at 96 BPM (Am F C G), rendered into a ring so every layer loops seamlessly | same |
| Voice lines | Cuts of the app's wordless stand-in voice (`dj/engine/djVoice`). **Stand-in until the owner records the English and Spanish lines.** | same |
| Room reverb | A decaying-noise impulse response, about 1.1 s | same |

When an owner recording replaces an asset, change its record to `made: 'recorded'` and add a row here: who recorded it, where, the date, and that the owner holds the rights.

## 3. Simplifications register (and how the learner is told)

| Simplification | Told to the learner |
|---|---|
| People and objects are drawn about 2.5× larger than life; positions and distances are true | Once, on page 1 (a concept lab carries no accuracy chip: owner 2026-10-31, D37) |
| Distance: full level inside the minimum distance, 1/distance beyond it, a fade to silence over the last fifth of the range | Page 11, in plain words ("a real game draws its own curve for each sound") |
| Direction: a left/right pan from the angle to where the listener faces; front and back pan the same | Page 11 and page 13, plainly |
| The wall: −9 dB and a 900 Hz low-pass when listener and source are in different zones with the door closed | Page 12, once: "an authored treatment, not a simulation" |
| An open door removes the treatment entirely (a real doorway still colors the sound) | Covered by the same page 12 note |
| Reverb: one convolution with one impulse response for the workshop | Page 12 |
| Headphone 3D uses the device browser engine's own head-related panner (not a personal measurement) | Page 13 |
| The overhead camera listens from the middle of the scene: its height (6 m) narrows the pan; level is measured along the ground | Page 4 |
| Headphone 3D filters are made for one typical head, not the learner's own | Page 13 |
| The 5.1 map on page 13 is a picture of a layout (front 0 and plus/minus 30 degrees, surrounds plus/minus 110 degrees, after ITU-R BS.775; no angle is printed) | Page 13, in the figure's caption |
| Music requested with sound off still waits for its boundary, counted in scene time | Page 14 |
| Each page opens on a CLEAN scene: start positions, door closed, generator off, nothing playing, mood calm, standard settings, an empty log. Kept: sound on/off, the lab level, and the record of goals done | Not told; it is what a learner expects (each DJ Systems Lab screen does the same) |
| The picture's rings show level at the listener after distance, the wall and the mix (bus fader, mute, solo, duck). A generator's rings spread at one of three paces by its speed. The alarm's rings are broken into segments. A source silenced by the mix, or tracked but not played, keeps one still dashed ring | Page 2 (rings and pace); pages 5 and 16 (solo and mute) |
| The voice rule (least important first, oldest among equals, protected never, otherwise refuse the new sound) is this lab's rule | Page 17, once |
| Ducking is event-driven (line starts / last line ends), not level detection | Page 16 |
| Multiplayer is simulated in one device; no network is used | Page 18 |
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
