# DJ Systems Lab — the shared booth model (Stage 1)

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
