# DJ Systems Lab — the shared booth model (Stages 1 and 2)

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

### Laptop (model/djLaptop)
- The mixer's USB pairs: USB 1/2 → CH1, USB 3/4 → CH2 (selector on USB). Device
  BUILT-IN = nothing reaches the mixer. No laptop state = USB silent (Stage 1).
- Buffer P = B/SR; output latency = P + 1 ms; round trip × 2. Work per buffer
  C = 0.25 ms + B × (3 / 6 / 14 µs) for TWO DECKS / FOUR + FX / STEMS LIVE. On
  2 % of buffers a spike (exponential, mean 0.8 ms, at most 4 ms) steals time;
  C + spike > P is a DROPOUT (that buffer zeroed in the USB audio). Stable
  buffers at 48 kHz: 256 / 512 / 1024. Deterministic per buffer index.

### Vinyl (model/djVinyl)
- True force = weight − 2.3 (the hidden balance point); dial = weight − ring
  zero (0.8 as found: the dial reads 4.0 g, the arm tracks at 2.5 g).
  The lab's cartridge: 3–5 g.
- Walls: skate = 0.12 × (F − anti-skate); L = F + skate, R = F − skate.
  Tracking ability = wall / 2.85 g; below 1, loud bright passages distort
  (compressed, with a noise "spit"), per channel; under 1.6 g it skips one
  revolution once per sound chunk.
- No ground wire: 50 Hz with its 3rd and 5th harmonics at a 0.2 mV equivalent at
  the cartridge (it then gets the phono stage's gain and RIAA bass boost).
- Acoustic loop G = 1.25 × booth gain × (CH1 fader gain / 0.72) × (near 1 / away
  0.35) × (feet off 1 / on 0.22): an 80 Hz band-pass (Q 2.5) in an 8 ms loop;
  G ≥ 1 builds a howl held under 0.3 (line) by a soft limiter; listen −9 dB.

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
