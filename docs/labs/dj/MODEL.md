# DJ Systems Lab — the shared booth model (Stages 1, 2 and 2b)

Internal document. Nothing here is shown to learners. The code is the source
of truth; this file states it in words so a reviewer can check it.

- State, tapers, curves, routing: `src/screens/lab/dj/model/djModel.ts`
- Transport, grid, sync: `src/screens/lab/dj/model/djDeck.ts`, `model/djTime.ts`
- Signal path: `src/screens/lab/dj/engine/djRender.ts`; kernels `engine/djDsp.ts`
- Music: `src/screens/lab/dj/engine/djMusic.ts` (+ generated `djTrackData.ts`)
- Tests: `test/djTime.test.ts`, `test/djRender.test.ts`, `test/djMusic.test.ts`, `test/djLab.test.ts`

## 1. The booth

Two media players (DECK A, DECK B) → a two-channel club-style DJ mixer → a
pair of powered PA speakers (the audience), a pair of powered booth monitors,
headphones. A turntable appears on the connection lessons only.

This is ONE generic device profile. Real mixers differ in cue taps, fader
curves, meter scales, output controls and microphone routing; a real
device's manual wins.

## 2. Order of processing and tap points

```
source (player line out, stereo)
  → cable: each plug (L, R) is its own conductor
  → input jack class: LINE, or PHONO (+36 dB at 1 kHz + RIAA playback, then the phono stage CLIPS)
  → INPUT SELECTOR (LINE / PHONO / USB — USB computer audio is not part of Stage 1: silence)
  → TRIM            −20 … +12 dB; 0 dB at the 12 o'clock centre detent, linear in dB each side
  → EQ (isolator)   per band +6 dB … −26 dB, then KILL below 4 % of travel
  → FILTER          one knob; left = low-pass, right = high-pass, centre dead zone ±3 % = bypass
  → CHANNEL CLIP at 0 dBFS
        ├─ CHANNEL METER tap (read before the clip, so an overload shows)
        └─ CUE tap (pre-fader, post-EQ/filter) → CUE BUS
  → CHANNEL FADER   gain = p² (square law; half travel = −12.04 dB)
  → CROSSFADER      assign A / THRU / B; curve BLEND, DIP or CUT
  → MIX BUS (sum) → MIX BUS CLIP at 0 dBFS → the BUS OVER light
        ├─ MASTER knob → MASTER CLIP → MASTER METER tap (L, R) → MASTER OUT (XLR) → whatever is plugged into it
        ├─ BOOTH knob  → BOOTH CLIP → BOOTH OUT (TRS)
        └─ the headphone MASTER side (taken BEFORE the MASTER knob)
PHONES = equal-power CUE/MASTER blend, or SPLIT CUE (left ear = cue, mono; right ear = master, mono)
       → PHONES knob → PHONES CLIP → the headphone jack
```

Every stage clips at its own full scale. A mix bus can overload while both
channels are clean; lowering MASTER after the bus clipped makes the result
quieter but keeps the flattened waveform (test: "CLIP BEFORE OUTPUT").

## 3. Tapers and curves

| Control | Model |
|---|---|
| TRIM | −20 … +12 dB: left half −20 … 0 dB, right half 0 … +12 dB, linear in dB on each; 0 dB at the centre detent (p = 0.5) |
| EQ band | p ≥ 0.5: 0 … +6 dB linear; 0.04 < p < 0.5: −26 … 0 dB linear; p ≤ 0.04: kill |
| Channel fader | gain = p² |
| MASTER / BOOTH / PHONES | gain = (p / 0.75)²: unity at ¾ travel, +5.0 dB at the stop |
| Crossfader BLEND | constant power: a = cos(xπ/2), b = sin(xπ/2) → −3.01 dB each at centre |
| Crossfader DIP | constant voltage: a = 1 − x, b = x → −6.02 dB each at centre |
| Crossfader CUT | each side full until the last 5 % of travel (a = min(1, (1−x)/0.05)) → 0 dB each at centre |
| Cue/master blend | equal power, 0 = all cue, 1 = all master |
| Filter | exponential sweeps: LP 20 kHz → 200 Hz, HP 30 Hz → 6 kHz; 2-pole (12 dB/oct); RESONANCE knob = Q 0.7 … 3.5 |
| LISTEN (the phone) | −30 … 0 dB before the protective limiter; resets to 35 % (−19.5 dB) after any change of listening perspective |

## 4. The isolator

Two 4th-order Linkwitz-Riley crossovers (24 dB/oct) at 250 Hz and 2.5 kHz.
low = LR4 LP(250) then the 2.5 kHz all-pass (phase match); mid = LR4 HP(250)
then LR4 LP(2500); high = LR4 HP(250) then LR4 HP(2500). The three bands sum
to an all-pass (flat magnitude). With every band at 0 dB the stage is
skipped, so the knobs at 12 o'clock colour nothing. A killed band is removed
at 24 dB/oct (≥ 30 dB down an octave and a quarter away). The EQ plot is
drawn from `isolatorMag`, the same model the audio runs through.

## 5. Meters

- All lab meters read **dBFS** (this digital model's full scale). They never
  show dBu, dBV or dBA. Analog references are taught separately (Screen 3).
- Peak meter, 10 ms blocks: instant rise, falls 20 dB in 1.5 s; peak-hold
  1.5 s. Read BEFORE each stage's clip, so a block over 0 dBFS lights CLIP.
- Colours: `levelColor` ramp (blue floor); the CLIP segment and every peak
  readout are `#ff5a48`.

## 6. Summing (Screen 6 / 8 demonstration)

Two identical, aligned signals at unity add +6.02 dB (amplitude doubles).
Two unrelated signals of equal level add about +3.01 dB in average power.
Neither is a universal peak increase for arbitrary songs. Pinned by
`test/djRender.test.ts`.

## 7. Time, tempo, grids

- Rate = 1 + pitch/100; tempo range ±8 %. No key lock in Stage 1: speed
  changes pitch (12·log2(rate) semitones).
- Two grids per deck: TRUE (the synthesiser's beats) and ANALYSED (what the
  software shows). Sync, quantize, loops, hot cues and beat jump use the
  ANALYSED grid. Scenarios: `LATE_HALF` (first beat placed half a beat
  late), `HALF_BPM` (63 for a 126 BPM track). The learner fixes them with
  grid shift and ×2.
- SYNC matches the played tempo with ×½ / ×1 / ×2, inside ±8 %, else refuses;
  then aligns the analysed beat phase.
- A jog nudge is modelled as a position step (±10 ms per touch) instead of a
  continuous bend.
- The practice tracks are 72 bars in 8-bar phrases: a 16-bar intro (8 drums,
  then 8 with bass) and a 16-bar outro that mirrors it (8 drums + bass, then
  8 drums only), so a mix in and a mix out both have room. A crash marks the
  "one" of bars 17, 41 and 57, after a tom fill — the bar lines of a correct
  grid sit there; in four-on-the-floor music every kick is equally strong.
- Screens 6, 8 and 9 start deck B tempo-matched to deck A (−3.17 % on its
  tempo fader) and phase-lock whichever deck starts second (`alignPhase`), so
  no gain, crossfader or EQ blend is judged on drifting beats.

## 8. Connections and power

Each cable has one end fixed at its source; the learner chooses the jack for
the other end (tap-to-connect, never drag-only). A plug that does not fit a
jack is refused. One plug per jack. Power: a device passes audio only when
its cord is in the strip AND its switch is on. Switching a source or the
mixer while a connected powered speaker is on is flagged as a THUMP (never
played loud). Safe order: on = sources → mixer → speakers last; off =
speakers first.

WRONG-JOB moves (they fit; `wrongJob` explains): the headphone plug in a
speaker's combo input plays nothing. A BOOTH cable's MIXER end moved from
BOOTH OUT to the PHONES jack (DJ-R3-PHONES, owner 2026-10-21; its far end
stays in its booth monitor, `PHONES_MONITOR` / `jacksHeld`) PLAYS: that
monitor hears the headphone feed — PHONES knob, CUE buttons and cue mix, not
the BOOTH knob (`speakerFeed` → 'PHONES'). The headphones come out (one plug
per jack).

How it sounds (DJ-R4-PHONES, owner 2026-10-21 "model it realistically"):
the BOOTH lead is a balanced TRS lead and the monitor's input is balanced. A
stereo headphone jack puts LEFT on the tip and RIGHT on the ring, so the
lead's hot wire carries L, its cold wire carries R, and the monitor's
balanced input plays hot − cold = **L − R** (`phonesIntoBalancedInput`, used
by `renderBooth` and `renderEvent`). Centre-panned content (kick, bass,
vocal, the claps) cancels; only the sides are left (panned hats, shaker,
echoes): thin and hollow. A mono feed (L = R) is silent. With SPLIT CUE the
ears differ (L = cue, R = master), so it plays cue − master. Level: (L − R)/2
— never louder than the old summed feed on hard-panned content, its peak
never past the headphone feed's own max(|L|, |R|); the listen gain and the
protective limiter follow as for every speaker. (Were the lead TS, the
monitor would hear the tip only — LEFT alone; this lab's BOOTH lead is TRS.)
The `wrongJob` text says it in words: it fits and plays, but the balanced
input subtracts one side from the other.

Screen 4 art (round 4, 2026-10-21): a freed MASTER L with deck A patched
drapes left into the one clear pocket under deck A's leads (`DRAPE_MST_L`, a
lazy S over its whole drop; MASTER R keeps that pocket when it is loose too).
The PHONO / LINE words print over each column's L socket (`inputWordsAbove`,
`inputWordBoxes4`), off the RCA leads that come up into the R sockets.

HOT-PATCH (`hotPatchSpeakers`): moving an audio cable while it is live is
flagged too (never played) — a MASTER/BOOTH cable into or out of a live
speaker while the mixer is on and that output's level is up, or a source
plug on a jack its channel listens to while that channel's fader is up
(every live speaker fed from the mixer would hear the pop or buzz). The
safe habit: fader or MASTER down, or the speakers off, first.

## 9. Listening (one phone output)

The phone plays ONE perspective at a time: CROWD (the PA speakers' inputs),
BOOTH (the booth monitors' inputs) or PHONES (the headphone jack). Split cue
is heard as L/R inside the headphone feed. The app never claims an
independent cue output. Every perspective goes through the LISTEN gain and a
protective limiter (−1 dBFS ceiling) after every modelled stage; the app's
own output ceiling (−12 dB player volume) also applies.

## 10. Audio engine

Offline render in JS at 48 kHz (`renderBooth`), chunked (a short first chunk
after a change, then longer ones), encoded to WAV and played through
`EarClipPlayer` behind the app's sound gate (`requestAudioOutput`,
`startFenced`). Two players alternate so the next chunk loads while one
plays; a small gap at chunk joins is a known limit. Each render returns its
end state (`carry`: every channel's isolator / filter / phono-stage filter
memories, the turntable's cartridge curve, the listener limiter's gain, every
meter's level, hold and hold age); the next CONTIGUOUS chunk continues from
it, so filters never click and meters never dip at a join (pinned in
`test/djLessons.test.ts`). A re-render that starts inside the sounding chunk
(a control changed) carries the meters from that moment and starts the
filters fresh, because the sound restarts there. Device render time is
NOT YET MEASURED (Node: an 8 s two-deck render with EQ and filter ≈ 0.18 s).

## 11. Simplifications register

| What | How it is simplified | How the learner is told |
|---|---|---|
| The mixer | one generic digital-model profile | "this lab's mixer"; "real mixers differ — check the manual" |
| Clipping | hard clip at each stage's full scale | the meters and the waveform show it |
| Jog nudge | a 10 ms position step | "a nudge" |
| Platter / jog ring speed | 33⅓ rpm × the tempo rate | — (true) |
| Thump | flagged, never played | "the speakers would thump" |
| Phono levels | typical values (5 mV cartridge, +36 dB stage) | "about", "varies by cartridge" |
| One phone output | perspectives instead of independent outputs | stated on Screens 1 and 7 |
| Chunked audio | short gaps possible at chunk joins (filters and meters continue across them) | — |
| Hot-patch | flagged, never played | "a half-inserted plug buzzes" |

## 12. Stage 2 (Screens 13–18)

One hook in the render, `engine/djStage2.stage2Of`, called at fixed points of
`renderBooth`; it returns null when the booth carries none of the Stage 2
state, so every Stage 1 render is unchanged sample for sample. Pinned by
`test/djStage2Engine.test.ts`; the pages' rules by `test/djStage2Pages.test.ts`.

```
deck source  → key lock / key shift / stems (djStretch + djStems) instead of the plain resample
turntable    → control record tone (DVS) · stylus up · mistracking · ground hum · acoustic loop
channel in   → USB: the laptop's decks on their pair (+ dropouts, DVS stutter, THRU) · FX return on CH2
… trim, EQ, filter, CHANNEL METER / CUE tap (unchanged: the cue stays DRY) …
after fader  → FX INSERT on CH1 / CH2 (post-fader, pre-crossfader) · the FX SEND (post-fader)
mix bus      → SEND/RETURN (wet × RETURN added) · MASTER insert — both BEFORE the bus clip
listen       → −9 dB safety trim while a return loop, a turntable howl or a control tone is on a speaker
```

The turntable now runs the booth clock and the sound on its own
(`djDeck.anyPlaying` includes it; STOP ALL stops it too), so Screens 17–18
(and Screen 3's turntable) have meters and audio without a deck playing.

### Effects (model/djEffects, engine/djFx)
- ONE unit with a ROUTE switch: CH1, CH2 (inserts), MASTER, SEND. TIME in beats at
  the routed deck's PLAYED tempo (MASTER and SEND follow deck A): ECHO ¼ ½ ¾ 1 2
  beats; FILTER sweeps 1–16 beats; FLANGER 2–32 beats; REVERB decay 0.6–6 s.
- ECHO: a delay line, feedback × 0.92 at most, a 6 kHz one-pole low-pass in the
  loop. REVERB: 8 damped combs + 4 all-passes (Freeverb tunings scaled to
  48 kHz), comb gain 10^(−3·delay/RT60). FILTER: a TPT state-variable low-pass,
  Q 3, 200 Hz ↔ 8 kHz on a beat-locked triangle. FLANGER: a 0.6–5.6 ms modulated
  delay with feedback.
- DRY/WET (insert, MASTER): dry = min(1, 2(1−w)), wet = min(1, 2w). SEND: the
  same knob is the RETURN (wet × w); the dry never changes.
- FX OFF stops feeding; the tail rings out (trails). A re-render inside a chunk
  REPLAYS the chunk's own effect input to the exact moment (`fxReplay`), so a
  fader move never cuts an echo (tested: the continuation matches to 1e-4).
- RETURN TO CH2 with CH2's SEND up is a LOOP: gain = RETURN × CH2 trim × fader ×
  SEND (CH2's EQ taken as flat), with a 10 ms outer path; while a loop is in, the
  unit's output is held under −12 dBFS by a soft limiter (a real one climbs to
  full scale) and the listen level drops 9 dB.

### Speed, pitch, key (model/djKey, engine/djStretch)
- Pitch in semitones = 12·log2(rate) + shift (key lock OFF), = shift (ON).
- Speed plan: lock OFF: pitch = rate × p, stretch = 1/p; lock ON: pitch = p,
  stretch = rate/p (p = 2^(shift/12)); tempo = stretch × pitch always.
- Stretch = WSOLA: 2048-sample (42.7 ms) Hann grains at 50 % overlap, ±512
  samples of search by normalised cross-correlation (4× decimated, then
  refined), then a linear resample by `pitch`. Simple, real, audible at large
  ratios.
- Keys are named by tonic; within ¾ semitone the track's own key is named with
  its offset ("D minor −0.56 st"). OUT OF TUNE = more than 0.15 st from a whole
  step apart; else SAME / NEIGHBOURS (one step on the circle of fifths) / DISTANT.
- A deck's tempo range may be ±16 (`tempoRange`, Screen 14). Loops are not
  supported on the Stage 2 deck path (Screens 13–18 never set one).

### Stems (engine/djStems)
- ORIGINAL = the track's own four parts (drums, bass, chords, lead = MELODY),
  summed, then through the track's master curve: all four on = the track
  (Night Ferry exactly).
- SEPARATED (SIMULATED) = each part split at 200 Hz (a low-pass and its
  complement) and shared between the four outputs by fixed leakage matrices
  whose columns sum to 1, plus a ±0.08 random wobble of the melody's own share
  every 1024 samples. All on = the track; a muted melody leaves a ghost (about
  −19 dB).
- The drawing (second visual review): each lane's RMS core uses the track's
  headroom gain × 1.25 (the shared waveform renderer's scale); the ghost is
  drawn at 10^(ghostDb / 20) of the lane.

### Laptop (model/djLaptop)
- The mixer's USB pairs: USB 1/2 → CH1, USB 3/4 → CH2 (selector on USB). Device
  BUILT-IN = nothing reaches the mixer. No laptop state = USB silent (Stage 1).
- Buffer P = B/SR; output latency = P + 1 ms; round trip × 2. Work per buffer
  C = 0.25 ms + B × (3 / 6 / 14 µs) for TWO DECKS / FOUR + FX / STEMS LIVE. On
  2 % of buffers a spike (exponential, mean 0.8 ms, at most 4 ms) steals time;
  C + spike > P is a DROPOUT (that buffer zeroed in the USB audio). Stable
  buffers at 48 kHz: 256 / 512 / 1024. Deterministic per buffer index.
- The drawing is at ONE scale (second visual review #9): controller at x 0,
  laptop at x 620, mixer at x 1020 (mm), front edges on the 390 mm line.
- Screen 18 (DVS) runs a 256-sample buffer at 48 kHz: a 12.7 ms round trip
  (DVS players usually run the smallest buffer that stays free of dropouts).

### Vinyl (model/djVinyl)
- True force = weight − 2.3 (the hidden balance point); dial = weight − ring
  zero (0.8 as found: the dial reads 4.0 g, the arm tracks at 2.5 g).
  The lab's cartridge: 3–5 g.
- Walls: skate = 0.12 × (F − anti-skate); L = F + skate, R = F − skate.
  Tracking ability = wall / 2.85 g; below 1, loud bright passages distort
  (compressed, with a noise "spit"), per channel; under 1.6 g it skips one
  revolution once per sound chunk.
- No ground wire: 60 Hz (the lab's one mains, `HUM_HZ`; the screen says "60 Hz
  (50 Hz in many countries)") with its 3rd and 5th harmonics at a 0.2 mV
  equivalent at the cartridge (it then gets the phono stage's gain and RIAA
  bass boost).
- The RIAA PLOT draws the analog curve (+19.3 dB at 20 Hz, −19.6 dB at
  20 kHz); the AUDIO uses the digital fit (engine/djDsp `RIAA_PLAYBACK`),
  within about 1 dB up to 10 kHz and about 3 dB shallower at 20 kHz.
- A stylus moved (the arm lifted or lowered) while CH 1 hears the turntable
  and its fader is above 0.3 is flagged as a THUMP on screen; no sound is
  played.
- Acoustic loop G = 1.25 × booth gain × (CH1 fader gain / 0.72) × (near 1 / away
  0.35) × (feet off 1 / on 0.22): an 80 Hz band-pass (Q 2.5) in an 8 ms loop;
  G ≥ 1 builds a howl held under 0.3 (line) by a soft limiter; listen −9 dB.
  80 Hz is the lab's ONE turntable-and-table resonance: Screen 20's
  turntable loop (djEvent `TT_RUMBLE_HZ`) uses the same value.

### DVS (model/djDvs)
- Control record = a 1 kHz quadrature tone, phase = the record's position,
  amplitude ∝ platter speed (a stopped platter is silence). Into CH1 PHONO; the
  mixer sends its phono signal over USB; deck 1 (deck A) comes back on USB 1/2.
- Quality: × 0.6 preamp on LINE (it clips), × 0.72 no ground, × 0.62 dirty,
  × 0.85 not calibrated; 0 when the plugs are not in CH1 PHONO or the USB is out.
  ≥ 0.8 LOCKED; ≥ 0.55 UNSTABLE (40–90 ms gaps now and then); else LOST (stops).
- ABSOLUTE: deck A takes the record's position (drops and skips jump it);
  RELATIVE: speed only; INTERNAL: ignores the platter; THRU: the turntable's own
  sound on USB 1/2 (with a control record: the tone). A dirty record skips a
  revolution once per sound chunk.

### Stage 2 simplifications (added to §11)

| What | How it is simplified | How the learner is told |
|---|---|---|
| One FX unit | four places by a switch, not a beat-FX unit plus an outboard loop | "this lab's mixer"; "real mixers differ" |
| FX return loop | its gain from trim × fader × send (EQ flat); held under −12 dBFS | "the lab held it under a safe level and played it quieter" |
| Key lock | a simple WSOLA stretch; no transient preservation | "a real, simple time-stretch … every stretch has some" artifacts |
| Separation | a leakage matrix + wobble, not an algorithm | "SEPARATED (SIMULATED)", "a prepared imitation" |
| Laptop, USB, drivers | a workload model, no device | "This lab simulates the laptop, its USB and the interface" |
| Mistracking | a level-and-brightness threshold distortion | "spit and fizz"; the numbers are this lab's cartridge |
| Turntable feedback | one resonance, one loop gain | held safe and quiet, said on the screen |
| DVS decoding | the following is modelled from a quality score; the tone itself is real | "no real control record is read" |
| Chunk joins | the stretch and the separation restart at a join (a short seam is possible) | — |

<!-- Stage 2b (screens 19–24), merged from branch dj-lab-b; its section and F/U numbers overlap Stage 2 (13–18) above -->

---

# Stage 2b — the event rig (screens 19–24)

Code: `model/djEvent.ts` (the rig's state and rules), `model/djRoom.ts` (the
room and its coverage), `model/djChangeover.ts`, `model/djCapstone.ts`,
`engine/djEventRender.ts` (the signal path, built ON `renderBooth`),
`engine/djVoice.ts`, `engine/djDrumMachine.ts`, `booth/takeStore.ts`,
`booth/useTakePlayer.ts`. Tests: `test/djEvent`, `djRecord`, `djHybrid`,
`djChangeover`, `djCapstone`, `djRegistry` (`.test.ts`).

The rig lives on the ONE shared booth as the optional `booth.ev`; a Stage 1
screen has none and renders exactly as before. `renderBooth` gained two
additive options (`inject`: a source for a channel that is not a player's
RCA cable — a laptop on USB, a drum machine on LINE; `keep`: hand back the
mix and cue buses) and `useBoothAudio` an optional renderer and `onChunk`.

Sections 13–21 (they were numbered 12–20 on branch dj-lab-b; renumbered after
the merge so no number repeats Stage 2's §12 — second audio review #31).

**Goals and setup (second learning review 2026-10-18, 24 #1):** a screen's
FIRST render still sees the previous screen's booth, because `useScreenSetup`
applies its setup in a layout effect. The hook returns `ready`, and
`useVisitGoals` latches nothing while ANY screen's setup is pending
(`booth/goalStore.setupPending`; a mark that never commits lapses after
1.5 s). A pre-matched blend (`preMatched`, `model/djMatch`) plays with KEY
LOCK on, so it is in tune as well as in tempo (second audio review #1).

## 13. The microphone (screen 19)

This mixer's mic section is on its FRONT panel (270 × 56 mm, under the
crossfader; the headphone jacks keep the top view's 66 / 88 mm):

| Control | Model |
|---|---|
| MIC 1 | XLR / jack combo, **+48 V phantom** (the only input with it) |
| MIC 2 | XLR / jack combo, **no phantom** |
| GAIN 1 / 2 | +10 … +60 dB, linear in dB |
| LEVEL | unity at ¾ (the house level-knob taper) |
| ON | the mute |
| TALK OVER + DEPTH | voice-keyed dip of the music, −6 … −24 dB (default −12) |
| SEND → BOOTH, → REC | default OFF (the common factory setting); MASTER always carries the mic |

- Speech at the capsule: its PEAK is −52 dBFS at 0 dB gain (a dynamic mic,
  about 94 dB SPL close up), so +44 dB puts peaks near −8 dBFS. A condenser
  is +12 dB hotter and silent without phantom from its input; a wireless
  receiver's output switch gives mic level or LINE (+44 dB: line level is
  some 40–55 dB over a dynamic mic on close speech — consumer −10 dBV ≈
  44 dB, pro +4 dBu ≈ 56 dB; the overload result is unchanged).
- The suggested speech target is −18 … −8 dBFS peaks on the MIC meter,
  then a SHOUT (an announcement +10 dB, `MicSay.db`) must stay clean — the
  first "make some noise!" is louder than conversational speech.
- The mic INPUT STAGE overloads above −20 dBFS-at-0-dB, before the gain
  knob: a LINE-level receiver in a mic input distorts at any gain.
- +48 V switched with the channel on and up is flagged POP (never played).
- The voice is `djVoice`: a synthesised speech-like phrase (Rosenberg
  glottal source, Klatt formant resonators from the Speech & Voice Lab,
  seeded consonant noise), 4.5 s, no words.
- Talkover: an envelope on the mic bus (release 120 ms) keys a gain on the
  music bus (attack 15 ms, release 450 ms) when speech is above −45 dBFS.
- Order: music bus (after its own clip) × dip + mic → MASTER knob → clip;
  BOOTH = music × dip + mic·send → BOOTH knob; REC OUT = music × dip +
  mic·send, fixed level; the headphones' master side is the program before
  the MASTER knob.

## 14. Feedback (screens 19, 20) — modelled, kept SAFE

`feedbackOf(booth)`: each speaker that carries the mic is a loop. Loop gain
(dB) = the speaker's 1 m level per dBFS − the capsule offset (146 dB)
+ the mic chain (sensitivity + gain + level) + the output knob (MASTER and
the venue gain for the PA; BOOTH for the monitors) + the speaker's
directivity toward the mic − 20·log10(distance) + the mic's cardioid pickup
toward the speaker + a +3 dB room peak. Paths add as power. Margin = −loop;
≤ 0 dB RINGING, < 3 dB EDGE. The ring frequency: 630 Hz on the booth path,
2.5 kHz on the PA path (model). At +44 dB gain: at the decks (rear to the
room) about 7 dB spare; mic sent to the booth about 2 dB; pointed at a
monitor or out on the floor, it rings.

**Safety:** the lab plays only a quiet stand-in ring: a sine at the ring
frequency, growing 12 dB/s to a CAP of −30 dBFS at the mic bus (before the
LISTEN gain and the protective limiter), dying 60 dB/s once the loop is
broken. Pinned: `RING_CAP_DBFS` holds at full gain on the floor.

Turntable acoustic feedback (screen 20) is a different loop (its
resonance is 80 Hz, the same value as Screen 17's model), shown on its
gauge and never played: margin = 6.8 dB − (the subs' bass at the decks re
the floor centre) − (feed − −20 dBFS) − the venue gain + 18 dB with
isolation feet. Subs under the tops: about +6.5 dB; under the booth: about
−8 dB.

## 15. The room and the venue (screen 20)

The plan (metres; back wall y = 0; DJ at (0, 0.8); table y 1.1 … 1.8;
monitors (±1.25, 1.3) aimed at the DJ; floor y 3.2 … 11, centre (0, 7)).

- **Coverage:** a top's nominal angle is its −6 dB angle; level =
  −6·(θ/θ½)² inside ±90° (−24 dB at 90° for a 90° box), then −24 … −28 dB
  behind. Subs: 20·log10(1 − 0.25·(1 − cos θ)) — about −6 dB behind.
  Inverse square from 1 m (clamped at 0.5 m), in plan; sources add as power.
- **Levels (model):** each top 108 dBA at 1 m on axis fed −20 dBFS average;
  each monitor 92 dBA. The floor and the DJ's ears follow the feed the
  render measures. Exposure: the Calculator Lab's `nioshDose` (85 dBA / 8 h,
  3 dB exchange) over a 4-hour set at the DJ's level.
- **Placements:** CORNERS (±4.6, 2.6) aimed at the floor centre — no hole
  in front, the decks ≥ 8 dB below the floor; STRAIGHT — a hole in front of
  the floor; BEHIND (±0.9, 0.3) — the decks louder than the floor. PA L
  stands at HOUSE LEFT (−x: the audience's left, the DJ's right); the plan
  draws it on the viewer's left. The booth monitors are the DJ's own (L on
  the DJ's left).
- **Bass:** several subs playing the same mono bass add COHERENTLY (in step
  +6 dB, out of step a deep null). The levels and the turntable loop use the
  power average; the bass MAP draws the coherent sum at 60 Hz
  (`subsCoherentAt`), so two spaced subs show their power alley and nulls.
- **Edges:** each top's −6 dB edges are drawn to the walls; an edge heading
  for the centre line stops there, so two edges never lie on one another.
- **Handoff:** MASTER L / R into the stage box's DJ L / DJ R (swaps are
  flagged); an unbalanced run adds hum (−50 dBFS) and no roll-off (a
  line output's low impedance keeps the cable's corner far above audio). The
  ENGINEER's gain (−12 … +9 dB, asked in 3 dB steps) moves the room, never
  the DJ's meters.
- **Processor:** crossover ON = LR4 at 100 Hz (two Butterworth sections):
  tops high-passed, a MONO sub ((L + R)/2) low-passed; the sum is flat.
  Crossover OFF = the boxes' own roll-offs (tops 2nd-order HP 50 Hz, sub
  2nd-order LP 200 Hz) overlap and the sum bulges. The crowd perspective in
  a venue is the floor centre: tops + sub. The sum is flat because this sub
  and these tops arrive together; a real system also needs time alignment
  (a delay and the polarity at the processor).
- **The screen's fault:** the 20 m run on an UNBALANCED lead (DJ-R3-ADAPTER: an
  XLR-to-jack lead from MASTER OUT, its TS jack in a jack-to-XLR adapter at
  the stage box; the TS jack ties pin 3 to pin 1) — a −50 dBFS
  hum in the venue's feed only (the booth and the headphones stay clean).
- **Tops (SYSTEM view, R3-DJ-02, 2026-10-21):** POWERED draws the powered
  top's front (its power LED lit). PASSIVE + AMP draws the passive top and
  the power amp from BEHIND, where the connection is: a passive box has no
  amplifier, mains or LED, only a recessed cup with two Speakon NL4 sockets
  (INPUT, LINK). A Speakon speaker lead (heavy unshielded two-core, about
  ⌀ 10; an NL4FC connector at each end, true size, `NL4`) runs from the
  amp's CH A OUTPUT to the top's INPUT in its own lane
  (`speakerLeadPts`), and the processor's line comes into the amp's CH A
  INPUT on XLR. CH A's top is drawn; R4-DJ-02 (2026-10-21): CH B is not
  empty — its Speakon lead (NL4FC seated) rises out of the frame, called
  out "TO TOP R" (`AMP_OUT_B`), and the amp is powered: an IEC C13 mains
  lead seated in AC IN drops and leaves the frame to the LEFT under the
  chassis in its own lane (`AMP_AC`, `AMP_MAINS_LANE_Y`), crossing and
  running beside no audio lead. The speaker lead's tag is two lines
  ("SPEAKER CABLE" / "NL4", 9.5 pt) LEFT of the top, tied to the lead by a
  hairline ending in a dot on the lead, clear of the sub, the top, the amp
  and the mains at 360×290, 390×330 and 820×600 (wiringFix_r6_dj). Rule
  book L3, L4, R1, R2, R8.

## 16. Recording (screen 21)

Taps: REC OUT (fixed level, before the MASTER knob, the mic by its send),
BOOTH OUT (follows the BOOTH knob), LOOPBACK (the computer records only
what it plays). The recorder: input gain −20 … +20 dB, its own meters
before its own clip at 0 dBFS. The TAKE (`takeStore`) is written from each
chunk as it starts sounding (a re-render overwrites from its start), up to
40 s; its lane is min / max per column of the capture, drawn TRUE to scale
by the shared waveform renderer (peak envelope over the column's RMS core,
`waveDraw.ColumnWave`) on a dBFS scale with the −12 … −3 dBFS target shaded,
its voice marks where
the mic's own part of the take is above −50 dBFS; PLAY THE TAKE plays the
captured samples (the booth stops first) at the LISTEN level through the
protective limiter.

The screen's LOOK follows the tap (R4-DJ-01, `lookFor`): REC OUT → two
RCA plugs, BOOTH OUT → two ¼-inch (6.35 mm) jack plugs, each into one
3.5 mm stereo plug in the recorder's LINE IN — exactly what SplitLead
draws; LOOPBACK → the laptop, no lead; UNPLUG → nothing in LINE IN.

BOOTH OUT as the tap (R3-DJ-01, owner 2026-10-21 "unplug the booth
monitors"): the recorder's split lead takes both BOOTH OUT jacks, so the
booth monitors' BOOTH cables come out of them (one plug per jack, §8). While
BOOTH is the tap (`recHoldsBoothOut`) any monitor fed from BOOTH OUT is
silent in `renderEvent` (LISTEN → BOOTH plays nothing; the modelled level
at the decks loses the monitors), Screen 21 draws the two cables hanging
loose beside the mixer, plugs pins-down (`boothLooseHang`), and the tap's
blurb says so. Another tap puts them back. A BOOTH cable whose mixer end is
in PHONES is not in BOOTH OUT and keeps playing. The split lead's legs each
show their plug seated in its jack; BOOTH L's leg leaves sideways into its
own lane (`BOOTH_SPLIT_JOG`) so it never crosses BOOTH R's plug.

## 17. The hybrid rig (screen 22)

The mixer's rear MIDI OUT sends clock from the beat counter of the channel
its CLOCK switch picks. MIDI clock is 24 ticks a beat, so an EXT drum
machine counts the leader's TRUE beats: its tempo is the leader's, tick for
tick, and it stops when the leader stops. Clock gives the tempo, not the
bar: bar 1 falls where it STARTS (pressed by ear, or armed for the leader's
next bar line). Leads: 5-pin MIDI and TRS-MIDI type A carry it; type B fits
and delivers nothing; USB between two devices needs a host. INT = its own
tempo (drifts): `dmDrift` reads its bar 1 against deck A's nearest bar line,
and an armed start works on INT too (`nextDeckABar` — the lab presses START
exactly on the one). Its audio is a separate lead (OUT L / R into CH 2's LINE
inputs; deck B's RCA leads come out). Pattern: 16 steps of shaker, rim and
two congas, synthesised.

## 18. Changeovers (screen 23)

DJ 1's laptop on USB 1 → CH 1 (selector USB); DJ 2's laptop for USB 2 →
CH 2; deck B holds DJ 2's backup on CH 2's LINE. `wouldStop(item)`: the
crowd loses its music only if the item feeds every on-air source (or is the
mixer's power or the MASTER lines). A charger is not a source (battery).
GROUND LOOP: a charger earthed on another circuit + the USB lead = a
−42 dBFS 60 Hz buzz (with its 3rd and 5th) in that channel — 60 Hz is the
lab's ONE mains frequency (`MAINS_HZ`; 50 Hz in many countries); cured by
the battery, the booth strip (in life it OFTEN does: a two-pin charger can
still whine on the same strip) or a USB isolator. The board draws the loop
on its real path: the charger cord to the wall, the building's earth to the
strip, the mixer's cord, USB 2 back to the laptop. A changeover that leaves
a gap or clips stays FAILED (its reason shown) until both sources are back
in the start state (`transitionStepBy`). Lifting the mains earth is
REFUSED (there is no such state). A frozen laptop outputs silence (some
output a stuck buzz).

## 19. The closing event (screen 24)

The fault bank (`djCapstone.FAULTS`): CH 2 selector on PHONO, CH 2 on the
wrong crossfader side, MASTER R unplugged, CH 1 trim hot, PA L on another
circuit (hum in the crowd only), the headphone blend at MASTER, the mic not
sent to REC, the recorder's gain hot, a damaged file on deck B, and (second
audio review #30) the mic channel's LEVEL at zero (the MIC meter moves, no
feed carries the voice) and PA R's own input switch on MIC (PA R distorts
behind clean MASTER meters; the render soft-clips it at a held level, so it
is never played loud). One fault,
and half the time a second from a different subsystem that cannot hide the
first (`compatible`). `scenarioFor(seed)` is a seeded mulberry32 — the event
number replays the same faults. Each planted fault has its own symptom,
hint ladder (trace; a question to ask of the evidence, `probe`; where to
look, `where` — never the debrief's answer) and debrief. The debrief's wrong
options are the fault's OWN plausible ones (`wrong`: they fit the same
symptom), each with why the evidence rules it out; it always offers the
unsafe earth lift as a wrong repair / prevention, and shuffles each part's
options (a seeded Fisher–Yates), so the right answer moves but replays the
same way. The power goal needs a power event this visit and re-arms once
every device is OFF again; OPEN THE DOORS is in the EVENT tray and on the
fault card.

## 20. Optional paths and the ending

Screens 16–18 are optional equipment paths (`pages/registry`); required
completion = every other screen. Pages are numbered BY ID (`DJ_PAGE_NO`:
declared after the 13–18 gap, otherwise the previous + 1). PagedLab's
additive `optionalPage` marks them in CONTENTS and on the what's-left
screen (an OPTIONAL PATHS group, never counted, never holding LAB COMPLETE)
and stores the lab as done once every required page is. Screen 24 closes
the lab: WHAT THIS LAB COVERS, built from the registry.

## 21. Simplifications register (Stage 2b)

| What | How it is simplified | How the learner is told |
|---|---|---|
| The voice | a synthesised speech-like phrase, no words | "a synthesised speech-like sound — no words" (TALK tray) |
| Feedback | one loop number per path, a fixed ring frequency, a capped quiet ring | "a quiet stand-in of a ring" |
| Turntable feedback | a margin gauge only, never played | "shown on its gauge; it never plays the howl" |
| Coverage | mid-band plan model, no height, no reflections | the map is "(MODEL)" |
| Spaced subs | the map's coherent sum is at one frequency (60 Hz), same polarity, no delay | "the SUBS map shows 60 Hz … move a metre and the bass changes" |
| Speaker symbols on the plan | held at least 18 pt across (larger than true at 390) | the plan is a map, the symbols are its marks |
| Levels in dBA | a stated model calibration | "dBA (MODEL)"; "a modelled level" |
| MIDI clock | tempo follows the leader's true beat exactly (no jitter, no latency) | — |
| Ground loop | a fixed hum level when the loop exists | "a hum" |
| A frozen laptop | silence | — |
| The take | 40 s maximum, session only | — |
| Phantom pop, hot plug | flagged, never played | the warning |
