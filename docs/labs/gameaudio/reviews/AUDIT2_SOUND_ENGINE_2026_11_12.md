# Game Audio Lab — AUDIT 2 · THE SOUNDS AND THE SOUND ENGINE (2026-11-12 night)

Auditor SND. Lens: the audio half of Logic, Functions, Data and Accuracy. Read-only on source. **Nothing was played through a speaker** and the Sound Safety note was never opened.

**Counts: 5 × S1 · 14 × S2 · 12 × S3.**

## How this was done

| What | How | Where the evidence is |
|---|---|---|
| The sounds | Every asset rendered with the lab's own synth in node and measured (`measure.mjs`, `analyze2.mjs`, `analyze3.mjs`). WAV files written, not played | `…\scratchpad\ga_audit_snd\wav\` (35 files), `measurements.csv`, `analysis2.txt`, `analysis3.txt`, `env\*.csv` (10 ms level of each sound) |
| The engine | Read in full, then **run for real**: the lab's own engine source was driven on an `OfflineAudioContext` (it renders into memory and has no path to a device) with commands from the lab's own reducer and samples from its own bank. So the numbers below are the samples the device would be handed | `offline_engine_renders.md` |
| Model and conductor state | Four reproductions in node against `gaModel.ts` and `gaStore.ts` | `repro_state.mjs`, `repro_state.txt` |
| Tests | `node --test --test-timeout=120000 "test/gameAudio*.test.ts"`: 273 pass, 0 fail | section D |

Evidence folder: `C:\Users\profe\AppData\Local\Temp\claude\e45de0ce5238aca8\f5e8364b-06db-4f2e-9d53-2c6c9d3fd6d3\scratchpad\ga_audit_snd\`

Paths below are under `C:\Users\profe\dev\ape-workbench\src\screens\lab\gameaudio\` unless they start with `src\` or `test\`.

---

## A. The sounds: one row per sound

The bank holds **35** asset records (12 footsteps, 22 other sounds, 1 impulse response). The handoff says 28 (F31).

No sound clips, none has NaN or Infinity, every one-shot starts and ends on a zero sample, and every prepared loop joins without a step. Those are not the problem. The problems are what several sounds ARE, and how loud they are against each other.

"Loudest 400 ms" is K-weighted (the loudness-meter weighting), in LU below full scale, at the sound's own gain. "Above 400 Hz" is how much of the energy a small speaker can reproduce at all.

| Sound | s | Hz × ch | Peak dBFS | RMS dBFS | Loudest 400 ms (K-wt) | Crest dB | DC | First / last sample | Loop join: step (× typical) · level change dB | Centroid Hz | Strongest band (share) | Above 400 Hz, dB re total | Verdict | Why |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `fs_wood_1` | 0.36 | 48k × 1 | -3.1 | -17.6 | -20.3 | 14.5 | 0.0045 | 0 / 0 | — | 107 | 60-125 (80 %) | -26.6 | **DOUBTFUL** | A 92 to 120 Hz thump; no heel click above 1.5 kHz. Reads as a soft drum hit. A small speaker loses 22 dB of it (F10) |
| `fs_wood_2` | 0.36 | 48k × 1 | -3.1 | -17.9 | -20.2 | 14.8 | 0.0032 | 0 / 0 | — | 117 | 60-125 (83 %) | -24.7 | **DOUBTFUL** | A 92 to 120 Hz thump; no heel click above 1.5 kHz. Reads as a soft drum hit. A small speaker loses 22 dB of it (F10) |
| `fs_wood_3` | 0.36 | 48k × 1 | -3.1 | -18.0 | -20.3 | 14.9 | 0.0037 | 0 / 0 | — | 117 | 60-125 (75 %) | -26.0 | **DOUBTFUL** | A 92 to 120 Hz thump; no heel click above 1.5 kHz. Reads as a soft drum hit. A small speaker loses 22 dB of it (F10) |
| `fs_wood_4` | 0.36 | 48k × 1 | -3.1 | -17.5 | -19.9 | 14.4 | 0.0040 | 0 / 0 | — | 112 | 60-125 (80 %) | -25.1 | **DOUBTFUL** | A 92 to 120 Hz thump; no heel click above 1.5 kHz. Reads as a soft drum hit. A small speaker loses 22 dB of it (F10) |
| `fs_stone_1` | 0.36 | 48k × 1 | -3.1 | -28.1 | -28.8 | 25.0 | 0.0011 | 0 / 0 | — | 2154 | 125-250 (62 %) | -4.9 | **RECOGNIZABLE** | Hard 1.4 to 5 kHz click, then a lighter toe tick, 0.1 s. About 8 LU quieter than wood on headphones |
| `fs_stone_2` | 0.36 | 48k × 1 | -3.1 | -27.1 | -27.8 | 24.0 | 0.0013 | 0 / 0 | — | 2403 | 125-250 (60 %) | -4.5 | **RECOGNIZABLE** | Hard 1.4 to 5 kHz click, then a lighter toe tick, 0.1 s. About 8 LU quieter than wood on headphones |
| `fs_stone_3` | 0.36 | 48k × 1 | -3.1 | -28.1 | -28.7 | 25.0 | 0.0011 | 0 / 0 | — | 2570 | 125-250 (56 %) | -4.1 | **RECOGNIZABLE** | Hard 1.4 to 5 kHz click, then a lighter toe tick, 0.1 s. About 8 LU quieter than wood on headphones |
| `fs_stone_4` | 0.36 | 48k × 1 | -3.1 | -27.7 | -28.3 | 24.6 | 0.0011 | 0 / 0 | — | 2399 | 125-250 (62 %) | -4.7 | **RECOGNIZABLE** | Hard 1.4 to 5 kHz click, then a lighter toe tick, 0.1 s. About 8 LU quieter than wood on headphones |
| `fs_gravel_1` | 0.36 | 48k × 1 | -3.1 | -20.2 | -20.3 | 17.1 | 0.0033 | 0 / 0 | — | 3274 | 2k-4k (29 %) | -0.8 | **RECOGNIZABLE** | 9 to 13 short noise grains in two clusters (heel, toe) |
| `fs_gravel_2` | 0.36 | 48k × 1 | -3.1 | -23.7 | -22.9 | 20.6 | 0.0018 | 0 / 0 | — | 4079 | 4k-8k (38 %) | -0.7 | **RECOGNIZABLE** | 9 to 13 short noise grains in two clusters (heel, toe) |
| `fs_gravel_3` | 0.36 | 48k × 1 | -3.1 | -21.8 | -21.5 | 18.7 | 0.0026 | 0 / 0 | — | 4570 | 4k-8k (42 %) | -0.6 | **RECOGNIZABLE** | 9 to 13 short noise grains in two clusters (heel, toe) |
| `fs_gravel_4` | 0.36 | 48k × 1 | -3.1 | -23.0 | -22.1 | 19.9 | 0.0019 | 0 / 0 | — | 3902 | 4k-8k (35 %) | -0.7 | **RECOGNIZABLE** | 9 to 13 short noise grains in two clusters (heel, toe) |
| `door` | 1.15 | 48k × 1 | -3.1 | -23.0 | -21.4 | 19.9 | 0.0012 | 0 / 0 | — | 262 | 60-125 (64 %) | -9.6 | **RECOGNIZABLE** | Two latch clicks, a quiet creak (−30 dBFS RMS), then a 78 Hz thud 12 dB hotter. On a small speaker the thud is gone (−28 dB). One file for opening AND closing (F13) |
| `door_rattle` | 0.62 | 48k × 1 | -6.2 | -25.2 | -20.5 | 19.0 | 0 | 0 / 0 | — | 2802 | 2k-4k (97 %) | 0.0 | **RECOGNIZABLE** | Nine metal pings, 1.9 to 4.3 kHz, gaps shrinking over 0.3 s: a small metal part bouncing to rest |
| `gen_hum` | 2.00 | 48k × 1 | -4.4 | -14.5 | -18.0 | 10.1 | 0.0031 | 0.074 / 0.070 | 0.004 (1.2×) · -1.1 | 93 | <60 (73 %) | -15.0 | **RECOGNIZABLE** | On headphones: a 50 Hz drone with 13 harmonics and a 12.5 Hz roughness. 73 % of its energy is below 60 Hz: a phone speaker loses 17 dB (F6) |
| `gen_air` | 3.00 | 48k × 1 | -6.0 | -19.1 | -16.4 | 13.1 | 0 | 0.111 / 0.096 | 0.015 (0.7×) · 0.2 | 2233 | 1k-2k (42 %) | 0.0 | **RECOGNIZABLE** | Steady band noise 0.7 to 5 kHz: a fan |
| `fountain` | 4.00 | 48k × 1 | -6.0 | -19.5 | -15.7 | 13.5 | 0 | -0.091 / -0.118 | 0.027 (1.8×) · 0.1 | 4048 | 2k-4k (43 %) | 0.0 | **DOUBTFUL** | A steady hiss, 1 to 8 kHz. The 150 droplets never rise more than 3.9 dB above the bed. Differs from the fan mainly by being brighter (F11) |
| `amb_room` | 8.00 | 24k × 2 | -8.0 | -20.5 | -19.6 | 12.5 | 0 | 0.180 / 0.183 | 0.003 (2.4×) · -1.7 | 135 | <60 (47 %) | -15.3 | **RECOGNIZABLE** | Low rumble with a 100 Hz hum. Too loud for a room tone: as loud as the voice at the device (F12) |
| `amb_yard` | 10.00 | 24k × 2 | -6.9 | -23.3 | -16.8 | 16.4 | 0 | 0.003 / 0.008 | 0.007 (0.9×) · -0.2 | 494 | 250-500 (48 %) | -3.8 | **RECOGNIZABLE** | Wind whose color moves; birds 7 to 13 dB above it in their band. As a LOOP: one swell and the same six notes every 10.0 s (F14) |
| `amb_yard_raw` | 10.00 | 24k × 2 | -6.9 | -24.4 | -15.5 | 17.5 | 0 | -0.001 / 0.033 | 0.115 (7.6×) · -19.3 | 669 | 250-500 (37 %) | -2.1 | **RECOGNIZABLE** | The planted fault is there: 19 dB level jump and a 0.11 step at the join |
| `impact` | 0.70 | 48k × 1 | -1.9 | -21.7 | -21.9 | 19.8 | 0.0020 | 0 / 0 | — | 90 | 60-125 (72 %) | -15.3 | **DOUBTFUL** | 94 % of the energy is below 125 Hz (the 68 Hz thud); the wood knock (420 to 1180 Hz) sits 15 dB under it. Reads as a kick drum (F10) |
| `debris` | 0.85 | 48k × 1 | -6.9 | -28.7 | -23.7 | 21.8 | 0 | 0 / 0 | — | 2117 | 2k-4k (55 %) | 0.0 | **RECOGNIZABLE** | Nine short clicks, 0.85 to 2.5 kHz, thinning over 0.5 s: small hard pieces. Only in context, after the impact |
| `alarm` | 1.00 | 48k × 1 | -6.0 | -11.7 | -6.1 | 5.7 | 0 | 0 / 0 | silence to silence | 2173 | 1k-2k (89 %) | 0.0 | **RECOGNIZABLE** | Two-tone beeper (1975 then 1568 Hz, odd harmonics), 0.45 s on, 0.55 s off. The hottest sound in the bank (F20) |
| `ui_confirm` | 0.24 | 48k × 1 | -6.9 | -17.8 | -19.5 | 10.8 | 0 | 0 / 0 | — | 1260 | 1k-2k (79 %) | 0.0 | **RECOGNIZABLE** | Rising fifth, 880 to 1318 Hz |
| `ui_deny` | 0.30 | 48k × 1 | -6.9 | -17.4 | -19.4 | 10.5 | 0 | 0 / 0 | — | 339 | 250-500 (97 %) | -14.1 | **RECOGNIZABLE** | Low 392 Hz note, then a falling 311 to 294 Hz note |
| `vo_greeting` | 2.83 | 48k × 1 | -4.4 | -19.7 | -16.7 | 15.3 | 0 | 0 / 0 | — | 787 | 500-1k (78 %) | -0.2 | **RECOGNIZABLE** | Wordless voice: speech rhythm and pitch, 13 syllable onsets |
| `vo_greeting_long` | 3.37 | 48k × 1 | -4.4 | -19.7 | -16.2 | 15.3 | 0 | 0 / 0 | — | 655 | 500-1k (75 %) | -0.3 | **RECOGNIZABLE** | The same take at 0.84 speed: 3.0 semitones lower (the page says so) |
| `vo_warning` | 1.73 | 48k × 1 | -4.4 | -20.5 | -18.2 | 16.0 | 0 | 0 / 0 | — | 684 | 500-1k (68 %) | -0.5 | **RECOGNIZABLE** | The phrase's last five syllables at 0.94 speed: 1.1 semitones below the greeting |
| `vo_warning_long` | 2.04 | 48k × 1 | -4.4 | -20.4 | -17.6 | 16.0 | 0 | 0 / 0 | — | 579 | 500-1k (60 %) | -0.8 | **RECOGNIZABLE** | At 0.80 speed: 3.9 semitones lower |
| `vo_chat` | 2.70 | 48k × 1 | -4.4 | -19.8 | -16.8 | 15.3 | 0 | 0 / -0.001 | — | 805 | 500-1k (79 %) | -0.1 | **RECOGNIZABLE** | The greeting, 5 % faster, band-limited 320 to 3300 Hz: a headset voice |
| `mu_calm` | 10.00 | 48k × 1 | -9.4 | -20.6 | -19.6 | 11.2 | 0 | 0.030 / 0.032 | 0.002 (0.4×) · n/a (a bar starts on a note) | 301 | 250-500 (49 %) | -9.0 | **RECOGNIZABLE** | Pad and bells, Am F C G, a bar each |
| `mu_pulse` | 10.00 | 48k × 1 | -8.9 | -18.5 | -18.9 | 9.7 | 0 | 0.003 / 0.004 | 0.000 (0.0×) · n/a (a bar starts on a note) | 206 | 60-125 (45 %) | -12.0 | **RECOGNIZABLE** | Eighth-note bass on the chord roots (87 to 131 Hz) and hats. A small speaker loses 13 dB: mostly hats remain |
| `mu_drive` | 10.00 | 48k × 1 | -7.5 | -25.4 | -20.9 | 17.9 | 0 | 0 / 0 | 0.000 (0.0×) · n/a (a bar starts on a note) | 303 | 60-125 (67 %) | -9.4 | **RECOGNIZABLE** | Kick on 1 and 3, snare on 2 and 4, off-beat stabs |
| `mu_stinger` | 2.40 | 48k × 1 | -4.4 | -20.0 | -16.1 | 15.6 | 0 | 0 / 0 | — | 424 | 250-500 (41 %) | -4.0 | **DOUBTFUL** | E major pickup, then the A minor hit 420 ms later = 0.67 of a beat, off the grid; the pickup clashes with the F, C and G bars (F9) |
| `ir_room` | 1.50 | 24k × 2 | -6.8 | -28.4 | -17.4 | 21.6 | 0 | 0 / 0 | — | 2975 | 2k-4k (36 %) | -0.2 | **WRONG** | As delivered (24 kHz) the engine cannot load it (F1). The shape itself is believable: T30 1.10 s, 4 ms pre-delay, nothing before it, no DC |

### What the device is handed (measured from the real engine, dBFS after the ceiling gain, lab level 70 %)

| Situation | Level |
|---|---|
| The guide's greeting | −33.6 RMS, −18.4 peak |
| Room tone, listener in the workshop | **−34.6 RMS** (as loud as the line above) |
| Courtyard wind and the fountain, opening position | −37.6 RMS |
| Generator 1.5 m away, SPEED 40 % | −31.0 RMS |
| Generator from the opening position, door OPEN | −44.3 RMS |
| Generator from the opening position, door CLOSED (how every page opens) | **−53.3 RMS**, nothing above 900 Hz; SPEED 100 % adds 1.8 dB |
| Calm music layer alone / all three layers | −34.8 / −30.4 RMS |
| Busy ordinary scene (workshop, generator, alarm, full music, a line, steps) | −25.5 RMS, −12.5 peak |
| BURST of 12 impacts, listener beside the crate | **−10.4 peak** (−10.1 at lab level 100 %) |

Relative loudness of each event heard at full gain (loudest 400 ms, K-weighted): alarm −12.1 · full music −15.1 · greeting −16.7 · fountain −18.7 · generator −19.0 · wood step −20 · door −20.2 · crate −21.1 · courtyard wind −22.7 · interface cues −23.5 · room tone −24.8 · stone step −28.8.

Music: the three layers share 96 BPM, 4/4, a 10.000 s phrase (480 000 samples each), and one chord per bar (Am, F, C, G). Bass roots and pad tones agree. Stem loop joins measured in the real engine at 44.1 kHz: clean. The stinger does **not** agree with them (F9).

Impulse response: decay 1.10 s (T20 and T30), 4 ms pre-delay with nothing before it, no DC, left and right uncorrelated (0.03). 1.1 s suits a bare 7 m × 10 m workshop. It cannot be loaded (F1).

---

## B. The engine: one row per function

| Function | Verdict | What was found |
|---|---|---|
| Start a one-shot; start with a delay | PASS | Starts at `now + delay` on the audio clock; a delayed layer that is stopped first never sounds |
| Start a loop (80 ms fade-in) | PASS | |
| Start for a sound still loading (`model/gaStore.ts`) | **FAIL** | The start waits for the load; a later stop or set does not. Orphan loops, stale filter (F4) |
| Double start of one voice id | PASS | The old copy fades in 10 ms. Its nodes are never released (F29) |
| Stop with fade | PASS | Fade then stop; a second stop of a fading voice is ignored |
| Set gain / pan / position / rate with a ramp | PASS | One ramp at a time, from the value the parameter has now. No click measured on any ramp |
| Low-pass for the wall and the door | WEAK | 900 Hz closed, 20 kHz open, 0.25 s. No zipper noise, no click. The ramp is linear in Hz, so opening sounds instant and closing sounds like a late jump (F27) |
| Distance | PASS | The engine applies none (`rolloffFactor = 0`); the model's gain is what arrives. Opening position: 0.066 = 2/8.79 × 0.355 (wall) × 0.82 (speed shape) |
| The door's own sound | WEAK | Treated as inside the workshop: muffled from the courtyard when it closes (F13) |
| Buses, MUTE, SOLO | PASS | A muted bus renders digital silence |
| Dialogue duck | PASS | Music ×0.316 (−10 dB), ambience −8, effects −5; 0.12 s down, 0.45 s up, written on the audio clock when the command arrives. Release waits for the engine's "ended" |
| Reverb send and convolver | **FAIL** | The impulse is refused; there is no reverb at all (F1). Once fixed, the return ignores the buses (F8) |
| Mono check | PASS | L = R measured. Level falls 3 to 6 dB, as a fold-down does |
| Lab master | PASS | |
| Output ceiling "−12 dBFS" | WEAK | A fixed gain after a compressor with make-up gain. Measured peak −10.1 dBFS (F15) |
| Protective limiter | WEAK | Never lets the output clip (worst case would be +4.2 dBFS without it). It is already working on ordinary busy scenes (output −0.5 dBFS before the ceiling) |
| Voice limit and stealing | PASS | The model decides; the engine obeys with a 20 ms stop |
| Virtual voices | **FAIL** | With sound on, a loop that goes virtual is destroyed and never comes back (F2) |
| Music start, one clock | PASS | Three stems on one start time, 0.12 s ahead |
| Music change on beat / bar / phrase | PASS | Lands on the line (measured 2.620 s = start 0.120 + one bar). At least 60 ms ahead, else the next line |
| Music change NOW | WEAK | A second change inside the 0.4 s fade makes the level jump (F21) |
| Withdraw a waiting change | WEAK | Correct before the line. Just after the line it undoes a change that already sounded (F22) |
| Stinger | **FAIL** | Outlives ■ STOP; unknown to the model (F3). Its accent is 420 ms late and off the grid (F9) |
| Music stop | PASS | 0.4 s fade |
| Background tab or app | WEAK | Audio stays on the audio clock; the "applied" report rides a JS timer and arrives late, which widens F22. Phone behavior not checked |
| Interruption and resume | **FAIL** | Music plays while the model reads it off and its key cannot stop it (F5). A waiting change is stranded (F23). Loops restart from their first sample |
| STOP ALL | **FAIL** | Stops every voice, stem, delayed layer and waiting stinger. Misses a stinger that has begun (F3) |
| SOUND key | **FAIL** | Cannot switch sound off (F7) |
| Level tap for the readout and for exposure | WEAK | Folded to mono before measuring: a one-sided sound reads 6 dB low (F16) |
| Loop joins as played (44.1 kHz device) | PASS | Largest step at the join 0.0023, elsewhere 0.0051 |
| Stereo pan / 3D renderer | PASS | Both place the source. Pan reaches ±1.00, one ear silent (F25); switching restarts loops and is 2.5 dB louder (F26) |
| Samples across the bridge (16-bit, base64) | PASS by test | Speed and size on a phone not proven (section E) |
| Leaving the lab | PASS on web, NOT CHECKED on a phone | On a phone the stop and the dispose can never be delivered; silence depends on the web view being destroyed (F18) |

---

## C. Safety paths: is each claim in `engine\useGaSound.ts` true?

| Claim (header, lines 6–17) | True? | Notes |
|---|---|---|
| The output gate is asked every time | TRUE | `enable()` line 118. But SOUND is only ever asked ON; the key cannot switch it off (F7) |
| The start goes through `startFenced` | TRUE for the ENGINE start (line 123) | Individual sounds are not fenced; they rely on the model's `soundOn`, which follows the gate one render later. A stop reaches the model through `onStopped`, so a start waiting for a load is dropped (`stopEpoch`) |
| Registered as a file player; shake-to-mute, idle lock and sign-in re-mute reach it | TRUE | `stopAllFilePlayers` pauses every live player, whatever `playing` says. `pause` → `engine.stopAll(0.02)` and the model's `stopAll` |
| The engine applies −12 dBFS, last | PARTLY | The gain is there and last. The measured peak is −10.1 dBFS (F15) |
| The measured level is reported for exposure | PARTLY | Measured, yes. Under-reads a one-sided sound by 6 dB; samples 43 ms out of every 180 ms (F16) |
| Stop on leaving the screen; stop when silenced | TRUE on web | On a phone neither command can reach the web view at unmount (F18) |
| No sound in a members-only preview | TRUE | But the Sound Safety prompt is shown first, then nothing happens (F30) |

**What can keep sounding after a stop, a mute or a page change:** a stinger that has begun, for up to 2.4 s, its whole length (F3). Nothing else was found: loops, stems, delayed layers and waiting stingers all stop. Orphan loops from F4 are stopped by any STOP ALL, but until then they play while the scene shows nothing.

---

## D. The tests

`node --test --test-timeout=120000 "test/gameAudio*.test.ts"` → 273 tests, 273 pass.

| File | What it really proves | What that matters is not tested |
|---|---|---|
| `test\gameAudioEngine.test.ts` | Against a recording fake: refusals answer `failed`; start times are `now + delay`; a stop schedules after its fade; boundary arithmetic; a withdrawn change before the line; a 0.2512 gain is the last node; base64 round trip | The fake convolver accepts any buffer, so F1 is invisible. No test sends `reverb`, `mono`, `bus`, `master`, `set lowpass`, or an HRTF start. "STOP ALL silences … everything still waiting" uses a stinger that has not begun and asserts only that each source has a stop time, so F3 is invisible. `FakeParam.value` jumps to the target at once, so no ramp fault can show. "Holds the house output ceiling" proves a gain value, not an output level |
| `test\gameAudioSounds.test.ts` | Unique ids; finite samples; peak 0.05–0.95; loop lengths; a step at the join no bigger than the biggest step inside; the raw wind's 10 dB jump; kick on beat 1; the impulse's slope | Nothing about what a sound will be taken for, or its level against the others. "Wood is the darkest" passes at a centroid of 110 Hz: it rewards F10. The impulse's sample rate is not compared with a device rate. The summed-music test leaves out the stinger (sum of peaks 1.37) |
| `test\gameAudioModel.test.ts` | The reducer's rules with commands inspected | "A loop … goes virtual and comes back" (line 331) never feeds the engine's `ended` answer for the stop it just sent, so F2 is invisible. No test feeds `music stopped` after a restart (F5) |
| (none) | | `engine\gaEngine.ts` (queue, init timeout, load), `model\gaStore.ts` (the conductor: F4), `engine\useGaSound.ts`, `engine\GaEngineHost.tsx` have no test |

---

## E. Phones (the hidden web view: unproven)

What the code makes likely, most serious first.

1. **The reverb fails there too.** Android's web view is Chromium (measured: refuses the impulse). The Web Audio specification requires the same error, so iOS should refuse it as well. After the fix the impulse must match whatever rate the phone's context runs at (48 000 Hz usually; 44 100 Hz and others with some Bluetooth routes).
2. **Building the sounds blocks the app.** The synth and the base64 encoder run on the app's JavaScript thread. In node (which compiles to machine code) all 35 take 0.64 s to build and 0.33 s to encode; `mu_calm` alone takes 0.28 s. The phone's JavaScript engine does not compile to machine code; 10 to 30 times slower is my estimate, not a measurement. That is several seconds of frozen taps on the first SOUND press of the music page, and it is exactly the window in which F4 leaves loops playing.
3. **Size across the bridge.** 11.3 MB of base64 text for the whole bank; 1.28 MB each for the two wind beds and the three music stems, 1.02 MB for the room tone. Each is one `injectJavaScript` call. The answer is awaited for 6 s (`GA_BUFFER_WAIT_MS`); a slow phone reports "the sound was not loaded" for a sound that arrives a moment later.
4. **Memory.** 17 MiB of decoded samples in the app, the same again inside the web view, plus the encoded text while it crosses.
5. **No recovery if the web view dies or reloads** (F18). iOS ends a web view's process under memory pressure; the lab would go on showing SOUND ON in silence.
6. **Interruptions** (a call, an alarm, a route change, leaving the app) suspend the context. Coming back triggers F5 (music the key cannot stop), F23, and every loop restarting from its first sample.
7. **Latency.** A command crosses app → native → web view before the engine sees it, and the web view's output adds its own delay. The check screen's "started 0 ms after the request" measures neither (F17).
8. **iPhone ring switch.** The engine asks for the playback session only where the web view offers `navigator.audioSession`. Flip the switch during the proof.
9. **Leaving the app with a loop playing.** The stop is injected into the web view while the app is going to the background. It must be heard to stop on both systems.

**A phone proof must check first, in this order:** (1) the time from the SOUND press to the first sound, and whether taps still register meanwhile; (2) the reverb (REVERB against DRY on page 12); (3) leave the lab with the generator and music running: silence at once; (4) leave the APP the same way; (5) take a call or lock the phone with music on, come back, press the music key; (6) flip the iPhone's ring switch; (7) tap-to-sound delay on a footstep; (8) twenty minutes on page 22 without the sound stopping.

---

## Findings

### S1

**F1 · pages 12, 22 (and any sound made in the workshop) · Functions / Accuracy · S1 — There is no reverb. The engine cannot load the room impulse.**
WHAT: `ir_room` is rendered at 24 000 Hz (`sounds\gaSynth.ts:651–675`, `SR_BED`). A convolver only accepts an impulse at the device's own rate. Measured in the browser the owner uses: `NotSupportedError: The buffer sample rate of 24000 does not match the context rate of 48000 Hz` (same at 44 100). The error is thrown at `engine\gaEngineSource.ts:474` before the return gain is raised, so the return stays at 0. It becomes an `error` event that only sets `engine.lastError` (`engine\gaEngine.ts:136–142`); nothing on screen says so.
WHY: page 12's REVERB and DRY sound identical, and its goal "Switch ROOM to DRY and back to REVERB" ticks for a change nobody can hear. The log prints "SETTING workshop reverb: ON".
FIX: convert inside the engine, so any device rate works. In the `reverb` case: `var ir = buffers[m.buf]; if (ir.sampleRate !== ctx.sampleRate) ir = atContextRate(ir); convolver.buffer = ir;` with
`function atContextRate(b) { var k = ctx.sampleRate / b.sampleRate, n = Math.round(b.length * k), o = ctx.createBuffer(b.numberOfChannels, n, ctx.sampleRate); for (var c = 0; c < b.numberOfChannels; c++) { var x = b.getChannelData(c), y = o.getChannelData(c); for (var i = 0; i < n; i++) { var p = i / k, j = Math.floor(p), f = p - j; y[i] = x[j] * (1 - f) + (j + 1 < x.length ? x[j + 1] : 0) * f; } } return o; }`
Answer the command (`{e:'reverb', ok}`) so the lab can say "no reverb on this device". In the test fake, make the convolver throw when the rates differ. With the impulse supplied at 48 kHz the wet path measured 17 dB under the dry sound: a sensible level.

**F2 · pages 10, 11, 22 · Logic · S1 — With sound ON, a loop that goes VIRTUAL is destroyed and never comes back.**
WHAT: when a loop leaves its maximum distance the model sends `stop` and keeps the voice, marked virtual, **under the same id** (`model\gaModel.ts:637–643`). About 60 ms later the engine confirms that stop with `ended`. The model looks the id up, finds the virtual voice, drops it and ends the instance (`model\gaModel.ts:1201–1207`). Reproduced (`repro_state.txt` R1, and render V): the log prints "Fountain i5 ended (stopped)", walking back sends no start, and the courtyard is 8 dB quieter than before. For the generator the same path also flips its machine off, so the ENGINE key reads off though the learner never touched it.
WHY: page 11 teaches "tracked, not rendered … comes back". With sound off it works, which is how it was tested. With sound on, the thing the learner is told to listen for does not happen.
FIX: one line in `onEngine`, case `ended`: `if (!v || v.state === 'virtual') break;`. Add to the test at `test\gameAudioModel.test.ts:331`: after `away`, dispatch `{type:'engine', evt:{e:'ended', v:<the stopped id>, why:'stopped'}}` and assert the instance is still there and `back` sends one start.

**F3 · pages 14, 22 · Logic / Functions · S1 — ■ STOP, a page change and shake-to-mute do not stop a stinger that has begun.**
WHAT: a stinger is tracked only until its boundary (`engine\gaEngineSource.ts:385–390`); 20 ms later it is forgotten. `musicStop` and `stopAll` stop only stingers still waiting (`:424–429`, `:440–446`). Measured (render B): STOP 0.18 s into a stinger; the model shows 0 instances and music off; the device still gets −31 dBFS RMS, and the loud chord lands **after** the stop, audible for 2.1 s more. The model never holds the stinger as an instance (`model\gaModel.ts:933–940`), so PLAYING and the picture never show it, and the log never says it played.
WHY: page 1 says ■ STOP "stops everything immediately". The Sound Safety note says shaking mutes at once. Both are false for up to 2.4 s (the stinger's length).
FIX: keep begun stingers in a list on the music record until `onended`; in `musicStop`, for each one: `rampTo(g.gain, 0, fade, t); src.stop(t + fade + 0.01);` and disconnect on end. Count them in the `level` event's `voices`. Model: post the stinger as an instance on the music bus when the engine reports `applied`, and log "STINGER played on the bar line".

**F4 · every page with sound, worst on a phone · Logic · S1 — A start that waits for its sound to load is overtaken by the stop or the change that follows it.**
WHAT: `model\gaStore.ts:72–95` holds back a `start` whose sound is not loaded yet and sends everything else at once. Reproduced (R4): generator ON then OFF before the load ends → the engine receives `stop v2, stop v3` (ignored: no such voice yet), then `start v2 gen_hum LOOP, start v3 gen_air LOOP`. The model shows nothing playing and the machine off; two loops play until the next STOP ALL. Second case: the door opened while the generator loads → the `set` that opens the filter arrives first, then the start with the closed-door values: the generator stays at 900 Hz and −9 dB with the door open.
WHY: "what you see is what is playing" is untrue in the seconds after the first SOUND press and on any page whose sounds were not preloaded. On a phone that window is long (section E).
FIX: per voice, while its start is waiting, keep later commands instead of sending them: a `stop` cancels the waiting start (send neither); a `set` is merged into the waiting start's fields (`gain`, `pan`, `pos`, `rate`, `lowpass`, `rev`). A `Map<voiceId, GaCmd>` beside `stopEpoch` does it.

**F5 · pages 14, 22, mainly on a phone · Logic · S1 — After an interruption, music plays while the lab reads it as off, and the music key cannot stop it.**
WHAT: when sound returns, the model re-sends `music start` (`model\gaModel.ts:736`). The engine still holds the old music, so it stops it, **announces `stopped`**, and starts again (`engine\gaEngineSource.ts:324`, `:437`). The model takes any `stopped` as "the music is off" (`model\gaModel.ts:1214–1217`). Measured (render 4): from then on `music.on` is false while the device gets −33.8 dBFS. `musicStop` then sends nothing (`:921`); pressing start restarts it and it reads off again. Only ■ STOP ends it. The same happens on a phone when STOP then START are pressed inside one bridge round trip.
FIX: delete the `stopped` branch at `model\gaModel.ts:1214–1217` (the model already sets `music.on` itself in `musicStop` and `stopAll`), and in the engine do not announce `stopped` for the internal restart inside `musicStart`.

### S2

**F6 · pages 2, 5, 7, 8, 11, 12, 16, 17, 19, 22 · Data · S2 (S1 on a phone speaker) — From where every page opens, the generator is 20 dB under the voice and has nothing above 900 Hz.**
WHAT: opening position, door closed: −53.3 dBFS RMS against −33.6 for the greeting. Distance −12.9 dB (`model\gaDefs.ts:125`, min 2 m, at 8.8 m), wall −9 dB and 900 Hz (`model\gaWorld.ts:159`), speed shape −1.7 dB. The wall filter removes the fan layer (0.7–5 kHz), and SPEED 100 % adds only 1.8 dB. 73 % of the hum's energy is below 60 Hz, so a small speaker loses another 17 dB.
WHY: tomorrow's first press of ENGINE will sound like nothing happened. Page 2's "With the door closed the sound is quieter and has less treble" understates it.
FIX: (a) `generator.atten.min` 2 → 4 (+6 dB at the opening position, nothing changes beside it); (b) wall filter 900 → 1600 Hz and −9 → −6 dB; (c) give the hum partials up to 2 kHz at a slower roll-off (`gaSynth.ts:306–312`: 40 partials, `amp / k^0.8`) so a phone speaker has something to play. Then re-measure.

**F7 · every page · Functions · S2 — The SOUND key cannot switch sound off.**
WHAT: `GaLab.tsx:172–175`: when sound is on, the key calls `stopAll()`. The engine keeps running and the gate stays open, so `sound` stays `'on'` (`engine\useGaSound.ts:165`); the key still reads SOUND ON and is still lit. It is a second ■ STOP.
FIX: hold a `wanted` flag in `useGaSound`: the key clears it (and stops all); `sound` reads `'off'` while it is clear; the next press sets it and goes through `enable()` as now.

**F8 · page 16 (after F1 is fixed) · Logic · S2 — The reverb return ignores MUTE, SOLO, the bus faders and the duck.**
WHAT: each voice's send is taken before its bus, and the return goes straight to the pre-master (`engine\gaEngineSource.ts:152–158`, `:263–266`). Measured with a working impulse: generator on the effects bus, **effects MUTED** → the device still gets −47.6 / −45.3 dBFS; **music SOLO** → the same.
FIX: one send gain per bus (`busSend[b] → revIn`), each voice's `rs` connected to its bus's send, and the `bus` command ramps `busSend[b].gain` together with `buses[b].gain`.

**F9 · pages 14, 22 · Accuracy · S2 — The stinger does not sit on the music.**
WHAT: `sounds\gaSynth.ts:636–646`. The file opens with an E major chord and puts its hit (A minor, noise, a low drop; 5 dB louder) at 0.42 s. The engine starts the FILE on the bar line, so the accent lands 420 ms late: 0.67 of a beat at 96 BPM, on no beat and no half beat. The E major (G♯) is played over whichever bar it lands on: against F–A–C, C–E–G and G–B–D it is a semitone clash three bars out of four.
WHY: the page says a stinger lands "at the same boundary". A musician will hear it as late and sour.
FIX: make the pickup exactly a half beat (0.3125 s) and neutral (the open fifth A–E, or the noise swell alone); pass `lead: 0.3125` with the stinger command and start the source at `boundary − lead`, choosing the first boundary at least `LEAD + lead` away. The hit then lands on the line.

**F10 · pages 8, 9, 17, 22 · Accuracy · S2 — The wood footstep and the crate impact are low thumps.**
WHAT: wood (`gaSynth.ts:219–228`): 75–83 % of the energy between 60 and 125 Hz; the only bright part is 4 ms of noise cut at 1.5 kHz. Impact (`:451–458`): 94 % below 125 Hz; the wood knock is 15 dB under the thud. A small speaker loses 22 dB of the wood step and 14 dB of the impact, against 7 dB for stone and 3 dB for gravel. So on headphones wood is 8 LU louder than stone, and on a phone it is quieter.
WHY: page 8's lesson is that the SURFACE switch is heard. Wood will be taken for a soft drum; on a phone speaker the workshop steps nearly vanish.
FIX: wood: add a heel click (noise 1.5–4 kHz, 6 ms, at about 0.5 of the low mode) and board modes near 400 and 900 Hz; drop the 92 Hz mode 6 dB. Impact: raise the three knock modes 8 dB, lengthen them to 40–60 ms, add a 250 Hz body mode. Trim stone +4 dB.

**F11 · pages 1, 5, 10, 11 · Accuracy · S2 — The fountain is a steady hiss, close to the fan.**
WHAT: `gaSynth.ts:339–355`. The 150 droplets are 0.05–0.14 against a bed normalized to 0.4; in 5 ms blocks nothing rises more than 3.9 dB above the median. What remains is band noise from 1 to 8 kHz with a 4 dB flutter. The generator's fan is band noise from 0.7 to 5 kHz with a 2 dB flutter.
FIX: bed down 8 dB and narrower (1.5–5 kHz); droplets 3 to 4 times stronger, longer (30–80 ms), in clusters, with a low splash band (300–800 Hz noise bursts). Lengthen the loop to 8 s (see F14).

**F12 · pages 1, 10, 16 · Data · S2 — The room tone is as loud as the voice.**
WHAT: both beds play at layer gain 1 (`model\gaDefs.ts:141–162`, no `gainDb`). Measured at the device: room tone −34.6 dBFS RMS, greeting −33.6. Wind gusts peak 6 LU under speech.
WHY: a bed sits well under dialogue. On headphones the workshop will sound like a plant room. It also leaves the duck (−8 dB) too small to clear a line.
FIX: `bed_room` layer `gainDb: -12`, `bed_yard` layer `gainDb: -8`.

**F13 · pages 2, 8, 12, 18 · Logic · S2 — One door sound both ways, and the closing door is muffled from the courtyard.**
WHAT: opening and closing both post `door_open` and play `door_open.wav` (latch, creak, thud) (`model\gaModel.ts:802–808`). The door stands at x = 9, which `zoneAt` counts as the workshop (`model\gaWorld.ts:41`), and the door's state flips before the sound is placed. Measured from the courtyard: opening = gain 0.526, open filter; closing = gain 0.187, 900 Hz filter. From inside the workshop both are clear.
FIX: skip the wall treatment for a source that is the door itself (`owner === 'door'`). Give closing its own take (thud first, then the latch) or say on page 2 that one sound stands for both.

**F14 · pages 1, 10 · Accuracy · S2 — The courtyard bed repeats every 10 s in a way anyone will hear.**
WHAT: `gaSynth.ts:414–444`. One gust per pass (per-second level −31.6, −27.1, −23.1, −20.9, −19.4, −20.2, −22.6, −26.4, −31.3, −32.9 dBFS) and the same six bird notes at 1.40, 1.62, 4.90, 5.08, 5.26 and 8.10 s, 7 to 13 dB above the wind in their band. The fountain repeats every 4 s.
WHY: page 9 says "The ear notices an exact repeat immediately", and page 10 is about loops.
FIX: take the birds out of the bed and post them as one-shots at random times and pans (which is also what page 10 should teach: a bed plus spot sounds); two gusts of different size per pass.

**F15 · all pages · Data · S2 — The output passes the −12 dBFS ceiling.**
WHAT: `engine\gaEngineSource.ts:118–123`, `:127–128`. The "limiter" is a Web Audio compressor (−2 dB, 20:1), which adds its own make-up gain (about +1.1 dB here) and overshoots on a hard attack; the ceiling is a fixed gain after it. Measured: BURST peak −10.4 dBFS at lab level 70 %, −10.1 at 100 %; an ordinary busy scene −11.8 at 100 %. `engine\useGaSound.ts:12` and the engine header state −12.
FIX: after the limiter add a wave shaper with the two-point curve `[-1, 1]` (it passes ±1 unchanged and clamps beyond), then the level tap, then the ceiling gain. The device can then never be handed more than −12.0 dBFS.

**F16 · all pages · Data · S2 — The level sent to the exposure monitor reads low.**
WHAT: the tap is an analyser, which folds stereo to mono (half the sum) before it measures (`engine\gaEngineSource.ts:174–188`); `engine\useGaSound.ts:92–95` reports that figure. A sound in one ear only (the BURST above was fully right) reads 6 dB low, two unrelated sides 3 dB low. The left and right figures are already measured and sent.
FIX: `const rms = Math.max(e.rms, e.l, e.r);` at `useGaSound.ts:94`.

**F17 · `src\dev\GameAudioEngineCheckScreen.tsx` · Data · S2 — "A sound starts 0 ms after the request" is not a measurement.**
WHAT: line 137 prints `at − now`, two numbers the engine wrote in the same call; it is 0 for every start with no delay, on any device. The same line prints an RMS as "peak level". The handoff repeats the 0 ms (line 47). The eight checks never send `reverb` (F1 would have failed here), a filter change, an HRTF start, mono, a bus or a stinger stop.
FIX: send `ping` before and after and print the round trip and `latencyS`; add "reverb loads" (no `error`, wet level above silence with a send of 1), "a stinger stops with STOP ALL", "a low-pass at 900 Hz lowers a bright sound". Line 2: "scheduled at once; bridge round trip N ms; output delay N ms".

**F18 · `engine\GaEngineHost.tsx` · Logic · S2 — On a phone the engine has no way back if its web view dies, and the closing commands cannot be delivered.**
WHAT: (a) lines 100–111 set no `onContentProcessDidTerminate` (iOS) or `onRenderProcessGone` (Android), and nothing pings the page. If the page dies or reloads, `attached` stays true and the status stays `running`: SOUND ON, silence, every start answered `no-context` or not at all. (b) Lines 90–91 send through `ref.current?.injectJavaScript`. At unmount the ref is cleared before the cleanup effects run, so `stopAll` from `useStopOnClose` and `dispose` are dropped silently. Silence then depends on the system destroying the web view.
FIX: (a) on either event call `engine.detach()`, remount the web view with a new `key`, and let the SOUND readout fall to OFF; (b) in `PhoneHost`, send `stopAll` and `dispose` from a `useLayoutEffect` cleanup (it runs while the ref is still set).

**F19 · tests · S2 — The tests cannot see F1 to F5.** See section D. Add: a fake convolver that throws on a rate mismatch; `ended` fed back after a voice goes virtual; STOP ALL after a stinger's "applied" timer has fired; a `gaStore` test with a delayed `ensure`; `music stopped` then `started` fed to the model after a resync.

### S3

**F20 · pages 5, 17, 19 · Data** — Beside the generator the alarm is the hottest thing in the lab: −12.1 LU against −16.7 for the greeting, at 2 kHz with harmonics at 6 and 10 kHz (`model\gaDefs.ts:185`, `gainDb: -6`). The warning line it accompanies will be hard to follow. FIX: `gainDb: -11`.

**F21 · page 14 · Logic** — CHANGE AT = NOW: a second change inside the 0.4 s fade sets the gain to the OLD TARGET before fading (`engine\gaEngineSource.ts:358`). Measured: PULSE off 0.2 s after on → the layer jumps up 5 dB, then fades. FIX: for `now`, use `rampTo(st.g.gain, val, ramp, at)`.

**F22 · page 14 · Logic** — A change is "waiting" until a JS timer fires 20 ms after its line. A new request in that gap (seconds, in a background tab) is sent as a withdrawal, and `musicCancel` snaps the stems back with no ramp although the change already sounded (`:396–416`). FIX: in `musicCancel`, if `now() >= p.at` do nothing but forget the request.

**F23 · page 14 · Logic** — A change waiting for its bar when sound is interrupted stays "waiting" for ever after sound returns: the restarted engine never heard of that request id (R2; `model\gaModel.ts:724–737`, `model\gaStore.ts:122–123`). FIX: in `resync`, clear `music.pending` and log it as applied.

**F24 · all pages · Logic** — Switching sound on while a line or a door is "playing unheard" starts it again from its first sample (`model\gaModel.ts:729–734`), and the unheard-expiry timer then ends the model's voice with no stop sent (R3). FIX: `resync` restarts loops only.

**F25 · pages 11, 13 · Accuracy** — `stereoPan` reaches ±1.00 for any source square to the side (`model\gaWorld.ts:131–138`): one ear gets digital silence (measured). Uncomfortable on headphones, and not what a game's stereo pan does. FIX: scale the result by 0.85.

**F26 · page 13 · Functions** — Switching the renderer restarts every positioned loop from its first sample (a 7 dB dip for 40 ms) and the 3D renderer is about 2.5 dB louder than the stereo pan for the same source. FIX: trim the HRTF voice gain by 0.75. Not checked: whether the first 3D sound on a real device is silent while the browser loads its head data.

**F27 · pages 2, 12 · Accuracy** — The wall filter ramps 900 ↔ 20 000 Hz in a straight line over 0.25 s. FIX: `exponentialRampToValueAtTime` for frequency.

**F28 · page 17 · Accuracy** — BURST posts the same file 12 times in the same instant: it is heard as ONE hit, held down about 17 dB by the limiter, not as "a busy moment". FIX: spread the 12 over 300 ms and let the take vary.

**F29 · engine · Logic** — Stinger gains and stopped music stems are never disconnected from the music bus; a voice replaced by a start with the same id is never released (`engine\gaEngineSource.ts:230`, `:269–270`, `:378–383`, `:430–436`). Small; grows over a long visit.

**F30 · `engine\useGaSound.ts:118–121` · Functions** — In a members-only preview the Sound Safety prompt is shown, then nothing happens. FIX: test `getLabPreview().active` before `requestAudioOutput()`.

**F31 · handoff · Data** — "All 28 are made inside the app": the bank has 35 records (34 sounds and the impulse).

---

## What I could not check, and why

- **How anything sounds.** Every verdict in table A is from waveform, envelope and spectrum. DOUBTFUL means "I expect it will not be taken for what it is called"; only ears settle it.
- **Phones.** Nothing in section E was run. The slow-down factor for the phone's JavaScript engine is an estimate.
- **Safari / iOS web view and Firefox.** The convolver refusal was measured in the Chrome engine only; for iOS it rests on the Web Audio specification.
- **Real-time behavior.** Offline rendering has no autoplay block, no device latency, no timer throttling and no real interruption. The interruption result (F5) was produced by feeding the model the same sound-off / sound-on actions the app sends, not by suspending a live context.
- **The first 3D (HRTF) sound on a live device** (F26).
- **Whether the limiter's gain changes are audible as pumping** in an ordinary scene.
- **The gate's prompt, the screen readouts and the pages' wording**: other auditors' ground. I did not press SOUND.
- **The `GaEngine` handle's timeouts** (4 s init, 6 s buffer) and the React effect ordering in `useGaSound` and `GaEngineHost`: read, not run.
