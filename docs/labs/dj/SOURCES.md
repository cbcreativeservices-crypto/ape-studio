# DJ Systems Lab — sources and unknowns (internal)

Internal record. Learners never see sources, brands, model names or citations
(owner rulings 2026-10-04 / 2026-10-18; charter §12). The facts must still be
right; this file is where they are checked.

Base research: `docs/labs/dj/RESEARCH_AND_MASTER_PLAN.txt` (written in
ChatGPT, accessed sources dated 2026-10-14; source IDs S01–S19 refer to its
list). Checked 2026-10-18 by the Stage 1 build (Claude, Opus 5.5).

## Fact clusters used in Stage 1

| # | Fact cluster | Source (research plan ID) | Used on | Status |
|---|---|---|---|---|
| F1 | Inputs, monitoring, computer audio and outputs are distinct roles; trace the route and read the meter at the selected stage | S01, S04, S06, S07 | 3, 4, 6 | as stated |
| F2 | No universal mixer topology; cue taps, fader curves, output controls and mic feeds vary — teach a generic model | S01, S06 | all (model) | as stated; the lab's profile is documented in MODEL.md |
| F3 | A stereo RCA pair differs from one balanced TRS mono connection; a TRS headphone jack carries stereo; connector shape alone does not prove compatibility | S01, S13 | 3 | as stated |
| F4 | A linked-player network carries media and timing, not the player-to-mixer audio — audio cables are still needed | S18 | 2, 3 | as stated |
| F5 | USB can carry several functions (audio, control, data); network function depends on the protocol | S07, S18 | 3 | as stated |
| F6 | Turntable preamp switch: PHONO output → phono input; LINE output → line input; never double or skip the phono stage | S04 | 3 | as stated |
| F7 | A raw cartridge into LINE is quiet and thin; a line source into PHONO is loud and distorted | S04 (fault bank) | 3 | as stated |
| F8 | RIAA playback curve time constants 3180 µs, 318 µs, 75 µs | IEC 60098 / RIAA standard (general engineering reference) | 3 (model) | standard values |
| F9 | Typical levels: MM cartridge ≈ 5 mV at 1 kHz (5 cm/s); consumer line −10 dBV (0.316 V); pro line +4 dBu (1.228 V); dynamic mic, close speech ≈ 1–3 mV | general engineering references | 3 | TYPICAL values; they vary by device — the lab says "about" and "varies" |
| F10 | dBu re 0.7746 V, dBV re 1 V | calcUnits.ts `DBU_REF_V` | 3 | app source of truth |
| F11 | Startup/shutdown sequence: amplifiers / powered speakers on LAST and off FIRST, levels down | S13 | 4 | as stated |
| F12 | Protective earth must never be removed to cure hum (ground lift on an audio DI is different) | S14, S15 | 4 (power note) | stated briefly; full topic is Stage 2 (Screen 17) |
| F13 | Standalone systems can play local media with no laptop; deck layers exist; main, booth and headphone outputs are distinct | S06 | 2, 5 | as stated, generic wording |
| F14 | Software databases, analysis, cue points, playlists; tested offline backup; streaming access is service-specific (some services need a connection and exclude recording or stems) | S10, S12, S17 | 5 | stated generically: "a streaming service may need an internet connection and may limit what you can do" |
| F15 | Gain staging: source gain separate from performance faders; check the meter at the selected stage; a lower output cannot repair earlier clipping | S01, S07 | 6 | as stated (modelled) |
| F16 | Zero on an analog mixer meter is not necessarily digital clipping | S01, S07 | 6 | as stated |
| F17 | Cue selection, cue/master blend, split cue, headphone level and booth level are separate controls | S01 | 7 | as stated |
| F18 | Crossfader assignment, thru/bypass, response curves, cut-in, reverse | S01 | 8 | assignment, thru and curves built; REVERSE (hamster) and the channel-fader curve switch named in Screen 8's words (not modelled) |
| F19 | Isolator EQ deeper than tone-control EQ; filters HP/LP with resonance; bass handover is one option, not a rule | S01 (plan text) | 9 | slopes and ranges are THIS MODEL's (MODEL.md §4) |
| F20 | Beatgrids are an editable interpretation; first-beat errors and half/double BPM analysis happen | S10 | 11 | as stated |
| F21 | Transport cue versus headphone cue; hot cues, loops, beat jump, samples | plan DJ18 | 12 | generic player behaviour; real players differ |
| F22 | Sound exposure: NIOSH 85 dBA over 8 h, 3 dB exchange rate (educational model); a phone's volume percentage is not ear-level SPL; a phone mic does not measure headphone SPL | S09 | 1 | as stated |
| F23 | Coherent sum +6.02 dB, uncorrelated equal-level sum +3.01 dB (average power) | mathematics | 6, 8 | exact (tested) |
| F24 | Platter speeds 33⅓ and 45 rpm; ±8 % a common default tempo range | general (turntable and player manuals) | 2, 10 | common default, ranges vary by player (±6/10/16/wide) |

## UNKNOWNS (never drawn or stated as known)

- U1 — The real cue tap (pre/post EQ) of any particular mixer. The lab states
  its own model (post-EQ, pre-fader) and says real mixers vary.
- U2 — Real meter scales and reference levels of any particular mixer (what
  "0" means). The lab's meters are dBFS of its own model only.
- U3 — Device render time of the audio engine on the owner's phones: NOT
  MEASURED (no device build carries this lab).
- U4 — Whether a given streaming service allows offline play, recording or
  stems: service-specific and changes over time; the lab does not name one.
- U5 — Exact phono-stage gain and overload point of any particular mixer
  (model: +36 dB, clipping at the stage's full scale).

## Drawings

Every piece of gear is drawn as a GENERIC device of its class, authored in
millimetres from typical class dimensions (comments in `art/` give the
numbers). No brand likeness, no trade dress, no logos.

| Object | Typical class dimensions used |
|---|---|
| Media player (club class) | 320 W × 410 D mm top; jog wheel Ø 206 mm; 7-inch 16:9 screen = 155 × 87 mm of glass (was drawn 204 × 120, corrected 2026-10-18); 100 mm tempo fader (was 140, corrected 2026-10-18) |
| Two-channel mixer (club class) | 270 W × 390 D mm; 60 mm channel faders; 45 mm crossfader |
| Turntable (direct-drive DJ class) | 453 W × 353 D mm; platter Ø 332 mm; 12-inch record Ø 302 mm; tonearm 230 mm effective (one rigid arm that only rotates), pivot 215 mm from the spindle, 8.5 mm S-tube, 22° headshell offset; strobe lamp lit whenever powered |
| Powered PA speaker (12-inch two-way) | 365 W × 600 H mm |
| Booth monitor (8-inch two-way) | 270 W × 420 H mm |
| Headphones (closed-back DJ) | cups ~ 70 × 95 mm seen nearly edge-on from the front (drawn as worn: L on the wearer's left); 6.35 mm TRS plug |
| Controller (two-deck, with audio interface) | 550 W × 320 D mm; jog Ø 150 mm |
| Audio interface (small USB) | 160 W × 110 D mm top; rear: two balanced 6.35 mm TRS outputs and USB-C |
| Power strip (switched, 8 outlets) | 330 × 64 mm; moulded mains plug ~34 × 40 mm with strain-relief boot; device end IEC C13 |

## Simplifications register (drawings)

- Screen 4's room band draws the speakers, stands and table at 15 % size with the distances NOT to scale (said on the drawing); the patch band below is full size. The map is seen from BEHIND, so it is mirrored throughout (deck B left, PA R left, MASTER R left, strip outlet 1 on the right).
- The strobe dots are drawn as the eye sees them under the strobe lamp (still at 0 % pitch, drifting in proportion to the pitch offset), not at the platter's true speed, which would only alias on a 60 Hz screen.
- The cable flow pulse is an overlay of WHERE the signal goes; it claims no speed (decorative motion).
- Waveforms: peak envelope (min/max), RMS core and the drums' low band (the kick, 140 Hz) are all measured from the assembled tracks offline (djMusic.analyseTrack, shipped in djTrackData.ts, pinned by test/djMusic.test.ts); each lane is scaled so the track's 99th-percentile peak reaches 80 % of its half-height, and the colour keeps the true level. Kick ticks are the low band's onsets.
- Silk-screen legends are drawn at real size (4 mm type, capitals about 3 mm) and appear only once the zoom renders them at 9 pt or more.

## Fact clusters used in Stage 2 (Screens 13–18), checked 2026-10-18

| # | Fact cluster | Source (research plan ID) | Used on | Status |
|---|---|---|---|---|
| F25 | Channel insert, send/return and master effects differ in what they process; dry/wet, delay time in beats, feedback, reverb tails, filtering, modulation | S01, S03 | 13 | as stated; the unit, its law and its places are THIS LAB's (MODEL.md §12) |
| F26 | An effects return fed back into a channel that also feeds the send makes a loop | plan, advanced faults | 13 | as stated; held safe in the lab |
| F27 | Speed changes pitch (12·log2 of the rate); key lock time-stretches; key shift; stretch artifacts | S11, S12 (plan DJ20) + mathematics | 14 | the maths is exact (tested); the artifacts are real, from the lab's own WSOLA |
| F28 | Original multitrack stems differ from algorithmically separated stems (leakage, artifacts); supported stem controls vary | S11, S12 | 15 | the separation is a labelled SIMULATION, never called an algorithm's output |
| F29 | Device selection, channel mapping, sample rate and buffer latency; smaller buffers trade margin for responsiveness | S07 | 16 | as stated; the workload numbers are this model's |
| F30 | Turntable setup: balance, zero, then set the tracking force; anti-skate; slipmat; follow the cartridge's instructions | S05 | 17 | method as stated; 3–5 g is the lab's teaching cartridge (UNKNOWN for any real one) |
| F31 | Skating pulls the arm inward; too little anti-skate mistracks the outer wall (the right channel) first | general turntable engineering | 17 | standard behaviour; the magnitudes are this model's |
| F32 | The turntable ground wire is a signal ground; protective mains earth is never removed for hum | S14, S15 | 17 | as stated |
| F33 | Turntable acoustic feedback through the table and stylus differs from microphone feedback; isolation and placement reduce it | S05 (plan DJ22) | 17 | modelled as one resonance; held safe |
| F34 | DVS: a control signal (speed, direction, position) read by software after calibration; absolute, relative, internal and thru modes; poor signals and recovery; never route the control tone to the PA | S08, S19 | 18 | generic; quadrature is a common principle — real timecodes also carry position data (not modelled) |
| F35 | Mains hum is 50 or 60 Hz by country | general engineering | 17 | the lab uses 50 Hz and says "or 60" |

## Stage 2 UNKNOWNS

- U6 — Any real mixer's FX tap points (pre/post fader), trails behaviour and send/return routing: the lab states its own and says real mixers differ.
- U7 — A real player's key-lock quality and the ratio where its artifacts become audible.
- U8 — Real separation leakage levels (they depend on the algorithm and the music); the lab's −19 dB ghost is a teaching value.
- U9 — Any real laptop's dropout behaviour; the buffer and workload numbers are a model.
- U10 — Any real cartridge's tracking-force range and anti-skate setting.
- U11 — Any real DVS timecode format, calibration procedure and quality thresholds.

## Stage 2 drawings

| Object | Typical class dimensions used |
|---|---|
| Mixer effects section | a 300 × 84 mm panel: type selector, LCD 104 × 50 mm, LEVEL and FEEDBACK knobs, SEND 1 / 2, CH SELECT, RETURN TO switch, FX ON key |
| Player KEY LOCK and KEY − / + keys | in the clear space left of the tempo-range key (38 × 10 and 17 × 9 mm), outside the jog's well |
| Laptop rig | the Stage 1 laptop (× 0.8), controller (× 0.48) and mixer (× 1) at their class dimensions; USB-A plugs at the laptop, plugs seated in the devices' rear edges |
| Control record | 12-inch, white vinyl, black label (generic — no timecode artwork) |
| Tonearm side view, booth side view | schematic elevations, labelled by function, not to scale (said in their titles: SIDE VIEW) |

<!-- Stage 2b (screens 19–24), merged from branch dj-lab-b; its section and F/U numbers overlap Stage 2 (13–18) above -->

---

## Stage 2b (screens 19–24), checked 2026-10-18 by the Stage 2b build (Claude, Opus 5.5)

| # | Fact cluster | Source (research plan ID) | Used on | Status |
|---|---|---|---|---|
| F25 | Phantom power is a property of the INPUT: some DJ mixers give their mic input +48 V, others specify mics that need none | S01, S03 (plan, "apparent contradictions") | 19 | as stated; this lab's mixer: MIC 1 yes, MIC 2 no |
| F26 | A mixer may exclude the mic from its booth and record feeds by default (an internal setting) — the crowd hearing the mic proves nothing about the recording | S02 | 19, 21, 24 | as stated; this lab's default: mic not in BOOTH or REC |
| F27 | Dynamic mics, wireless receiver outputs (mic / line switch), mic gain, mute, talkover / ducking, mic position, routing to audience, booth and recorder | plan DJ23 | 19 | generic; talkover behaviour varies (voice-keyed here) |
| F28 | Powered vs passive systems, line inputs, balanced runs, labelled L / R, handing a feed to a venue engineer; venue gain and processing distinct from performance controls | S13, S14; plan DJ21 | 20 | as stated |
| F29 | Crossover roles, mono bass, safe summing (a summing circuit, not a Y-cable), placement from a defined room model; turntable acoustic feedback distinct from mic feedback | S05, S16; plan DJ22 | 20 | as stated; LR4 at 100 Hz is THIS MODEL's processor |
| F30 | Nominal coverage angle = the −6 dB angle; level falls quickly outside it; subwoofers are near-omnidirectional | general loudspeaker practice (manufacturer coverage specifications) | 19, 20 | the −6·(θ/θ½)² shape is THIS MODEL's mid-band approximation |
| F31 | Record taps, capture levels, mic inclusion, software capture routes, monitoring loops; recording / streaming permissions depend on material, service and application | S02, S07, S12; plan DJ28 | 21 | stated generically; no service named |
| F32 | Audio routing vs MIDI control vs clock / network sync; timing, transport and phase depend on the protocol; a clock connection carries no sound | plan DJ27 | 22 | as stated |
| F33 | MIDI clock = 24 pulses per quarter note; start / stop messages; the two TRS-MIDI wirings (type A / type B); USB devices need a host | MIDI 1.0 specification; the MIDI association's TRS adapter recommended practice | 22 | standard values |
| F34 | Input lists, USB / media handovers, dual computer paths, independent backup playback, level matching, talking to the engineer; which disconnection interrupts the playing source | S03; plan DJ29, DJ10 | 23 | as stated |
| F35 | Protective earth is never removed to cure hum; isolation (a transformer, a USB isolator) or a DI's audio ground lift breaks a loop safely | S14, S15; plan DJ24 | 23, 24 | as stated |
| F36 | Startup / shutdown order (speakers on last, off first) | S13 | 24 | as stated (reuses F11) |
| F37 | Troubleshooting by signal tracing and by symptom; randomise causes only where the simulation demonstrates them; debrief cause, evidence, repair, prevention | plan DJ30 and its troubleshooting challenge bank | 24 | the fault bank uses the plan's rows the simulation shows accurately |
| F38 | Sound exposure: NIOSH 85 dBA / 8 h, 3 dB exchange (educational model); a phone's volume is not ear-level SPL | S09 (reuses F22) | 20 | via the Calculator Lab's `nioshDose` |
| F39 | Typical speech and mic levels: close speech about 94 dB SPL at the capsule; dynamic mic about 2 mV/Pa; line about 40 dB above mic level | general engineering references (reuses F9) | 19 | TYPICAL values; vary by mic and voice |

### UNKNOWNS (Stage 2b — never drawn or stated as known)

- U6 — Where any particular mixer sends its mic by default, and whether its
  talkover is voice-keyed or switch-held. The lab states its own design.
- U7 — Real feedback frequencies of any room (the model uses fixed 630 Hz /
  2.5 kHz). Real rooms ring where their own response peaks.
- U8 — Real coverage of any particular loudspeaker below about 1 kHz (the
  map is a mid-band model) and the effect of height and reflections.
- U9 — The dBA a real PA makes for a given feed (the lab's 108 dBA at 1 m
  for −20 dBFS is a stated calibration, not a measurement).
- U10 — Whether a given drum machine wants TRS-MIDI type A or B, accepts
  clock over USB, or starts on MIDI START: device-specific.
- U11 — How a particular laptop behaves when it freezes (silence, a stuck
  buffer buzz, or the audio driver crashing).
- U12 — Device render time of the event layer on the owner's phones: NOT
  MEASURED (Node: an 8 s render with the mic, the venue and the recorder is
  about 0.3 s).

### Drawings (Stage 2b) — generic class dimensions

| Object | Typical class dimensions used |
|---|---|
| Handheld vocal mic | 182 mm long; ball grille Ø 50 mm (condenser Ø 46, finer, flatter); body Ø 36 → 24 mm; male XLR at the tail; wireless transmitter 236 mm, no XLR |
| Wireless receiver (half-rack), rear | 210 × 44 mm; two antennas about 150 mm drawn; BNC, DC IN, XLR out with a MIC / LINE switch |
| Mixer front panel | 270 × 56 mm (this lab's mixer is 270 mm wide); combo inputs Ø 20–22 mm; knobs Ø 11–14 mm |
| Stage box face | 200 × 116 mm; four female XLR; scribble strip |
| 12-inch top (plan) | 36.5 × 40 cm footprint; tripod legs 110 cm spread |
| 18-inch subwoofer | 550 × 700 mm front; plan 55 × 70 cm |
| 2U power amplifier | 482 × 88 mm (19-inch rack) |
| Handheld recorder | 72 × 156 mm top face; 52 × 38 mm display; 3.5 mm LINE IN |
| Compact drum machine | 330 × 176 mm top; rear 330 × 52 mm: DC, USB-C, 5-pin MIDI IN / OUT, 3.5 mm TRS MIDI IN, OUT L / R, PHONES |

### Simplifications (drawings, Stage 2b)

- The room plan is in centimetres, seen from above (back wall at the top,
  the DJ's left drawn to the right); the coverage field is the model's mid
  band, smoothed between cells; the plan omits height.
- The signal-flow board (screens 23, 24) is a diagram (abstract data); each
  card carries a small drawing of its real object.
- The clock lead's moving dots mark the beats the clock carries, not a
  signal speed (an overlay of WHEN).
