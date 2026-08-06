# Stage 3 routing guidance — v1 split topics → v2 children

You are routing existing glossary terms from ONE v1 topic into its v2 successor topics.
These are professional audio education terms. Route by the TERM'S MEANING first; the
`category` column is a legacy hint (often null or wrong) — use it only as a tiebreaker.

Rules:
- Every term gets EXACTLY ONE v2 gs from its group's allowed list below.
- Prefer the group's PRIMARY targets. An OVERFLOW target may be used only when the term
  clearly belongs there (it exists because v1 topics held some cross-domain terms).
- When two targets are both defensible, pick the group DEFAULT (marked *).
- Three v2 topics are already overloaded; when a term is genuinely ambiguous between one of
  these and a sibling, pick the sibling: 1012 (prefer 1010), 212 (prefer 210 or 1000),
  1230 (prefer 1232 or 1234). Never sacrifice semantic correctness for this.

## Group v1_gs=3 — "Connectors & I/O Connections" (202 terms)
PRIMARY: 160 Connectors & Plugs (physical connector types: XLR, TRS, RCA, Speakon, DIN,
  multipin, fiber/network/RF/power connector types, pinout, gender, adapters between
  connector formats, DI/reamp/hum-eliminator boxes) · 170 Cables & Wiring (cable types &
  construction, shielding, gauge/specs, cable safety/management/inspection, snakes,
  balanced/unbalanced line theory)* · 180 I/O Connections (audio interfaces, digital I/O
  protocols ADAT/AES3/S-PDIF/MADI/USB/HDMI/Thunderbolt, ADC/DAC & digital-audio conversion
  fundamentals (sample rate, PCM, quantization, oversampling, Nyquist), patchbays &
  normalling, splitters/breakouts/stageboxes, effects loops/inserts, phantom power)
OVERFLOW: 340 Audio File Formats & Media (consumer/file formats: MP3, WAV, FLAC, AAC,
  codecs, CD/DVD, lossy compression) · 420 Dante Fundamentals & Routing (Dante, audio-
  over-IP networking) · 440 Clocking, Redundancy & Network Management (word clock)

## Group v1_gs=5 — "Microphones" (135 terms)
PRIMARY: 190 Microphone Types & Transducers (mic types: dynamic/condenser/ribbon/etc,
  transducer principles, capsule/diaphragm/element construction internals)* ·
  200 Microphone Specs & Characteristics (sensitivity, self-noise, max SPL, impedance,
  frequency response, polar patterns, proximity effect, off-axis behavior) ·
  210 Stereo & Ensemble Miking (XY, ORTF, spaced pair, M/S, binaural recording) ·
  212 Instrument & Close Miking · 220 Mic Controls, Power & Mounting (pad/roll-off/pattern
  switches, phantom & T-power, stands, clips, shock mounts, pop filters, windscreens,
  blimps, mic cables-as-accessory) · 230 Specialized & Application Microphones (shotgun,
  lavalier, headset, boundary, contact, parabolic, measurement, MEMS, USB, wireless mics)
OVERFLOW: 990 Recording Fundamentals & Signal Chain (mic preamp, mic level) ·
  1000 Microphone Technique for Recording (bleed, plosive, sibilance, mic-technique errors)

## Group v1_gs=6 — "Amps & Loudspeakers" (137 terms)
PRIMARY: 240 Loudspeaker Types & Drivers (speaker/driver types & components)* ·
  250 Enclosures & Crossovers · 260 Loudspeaker Specs & Behavior (power ratings, impedance,
  sensitivity, coverage/directivity, distortion, speaker safety/limits) · 270 Amplifiers
  (amp classes, specs, behavior, 70V selection)
OVERFLOW: 1530 Monitoring & Audio Evaluation (studio/DJ/stage monitoring practice) ·
  1650 Immersive Formats & Delivery (surround/immersive formats)

## Group v1_gs=7 — "Mixers & Recorders" (112 terms)
PRIMARY: 290 Console Architecture & Signal Flow (console layout, signal flow, pan law,
  grouping, gain staging on console)* · 300 Channel Strip & Processing · 310 Buses,
  Routing & Matrix (aux/subgroup/matrix, sends, routing) · 320 Digital Console Workflow &
  Recall (scenes, snapshots, digital mixer features) · 330 Recorder Types & Formats ·
  340 Audio File Formats & Media · 350 Recording Transport & Controls · 360 Storage,
  Backup & Archival
OVERFLOW: 540 Measurement Fundamentals & Metering (pure metering theory) · 690
  Beatmatching, Mixing & FX (DJ mixer terms)

## Group v1_gs=10 — "Reverb & Delay" (77 terms)
PRIMARY: 480 Reverb (reverb types, parameters, algorithms)* · 490 Delay & Time-Based
  Effects (delay types/parameters, echo, chorus/flanger/phaser & modulation effects)
OVERFLOW: 500 Acoustic Principles & Room Behavior (natural room reverberation/acoustics
  terms that are about rooms, not effects units)

## Group v1_gs=11 — "Troubleshooting" (163 terms)
PRIMARY: 580 Signal & Connection Troubleshooting (bad cables/connectors, hum, buzz, ground
  loops, RF/EMI interference, no-signal faults, gear-level faults)* · 590 System & Live
  Troubleshooting Method (methodical diagnosis process, halving, substitution, live-show
  emergency procedure, feedback hunting) · 600 Patch & Routing Diagnostics (patchbay,
  routing/console-assignment errors)

## Group v1_gs=13 — "Loudspeaker System Deployment" (65 terms)
PRIMARY: 640 System Deployment & Rigging (arrays, flying/rigging, placement, coverage,
  fills)* · 650 System Tuning & Alignment (delay alignment, crossover/EQ tuning, system
  processors)

## Group v1_gs=18 — "Consumer Audio Systems" (78 terms)
PRIMARY: 940 HiFi Consumer Audio (turntables, headphones, hifi speakers/amps, streaming
  services, consumer listening)* · 950 Home Theater & Residential AV (surround formats,
  AV receivers, room correction, residential install hardware/cabling/pathways)

## Group v1_gs=23 — "Audio Measurement & Optimization" (229 terms)
PRIMARY: 540 Measurement Fundamentals & Metering (units, dB scales, weighting, meters,
  levels & loudness, averaging/smoothing)* · 550 Acoustic & Room Measurement (RT60, room/
  SPL measurement, measurement mics/setup in rooms) · 560 Signal Analysis & Test Equipment
  (FFT/spectrum, transfer function, Smaart & measurement software, generators, scopes,
  THD/noise measurement, impulse response) · 570 System Optimization (optimization/
  correction workflow, target curves, system alignment decisions)

## Group v1_gs=24 — "Recording Arts" (186 terms)
PRIMARY: 990 Recording Fundamentals & Signal Chain (signal chain, gain staging, recording
  levels, monitoring while recording)* · 1000 Microphone Technique for Recording (mic
  choice/placement principles, bleed control, polar-pattern use in the studio) ·
  1010 Session Setup & Signal Flow · 1012 Session Workflow, Takes & Documentation (takes,
  punching, logs — prefer 1010 if ambiguous) · 1020 Instrument Recording — Strings &
  Guitar · 1022 Instrument Recording — Drums & Percussion · 1024 Instrument Recording —
  Keys, Winds & Brass · 1030 Studio Recording Craft — Advanced
OVERFLOW: 210 Stereo & Ensemble Miking · 212 Instrument & Close Miking (prefer 210/1000
  if ambiguous) · 470 Dynamics Processing (pure dynamics-processor terms)

## Group v1_gs=25 — "Mixing" (66 terms)
PRIMARY: 1080 Mix Fundamentals & Workflow* · 1090 Instrument Mixing — Drums & Percussion ·
  1100 Instrument Mixing — Guitars, Bass & Keys · 1110 Vocal Mixing · 1120 Orchestral,
  Choir & Acoustic-Ensemble Mixing · 1130 Mix Automation & Recall · 1140 Mix Bus, Loudness
  & Translation (bus processing, mix metering, reference/translation, loudness in mix) ·
  1150 Creative & Advanced Mix Processing
OVERFLOW: 690 Beatmatching, Mixing & FX (clear DJ terms)

## Group v1_gs=26 — "Mastering" (58 terms)
PRIMARY: 1160 Mastering Fundamentals & Chain* · 1170 Loudness, Dynamics & QC ·
  1180 Delivery Formats & Metadata
OVERFLOW: 1790 Vinyl / Disc Mastering (vinyl-specific)

## Group v1_gs=27 — "Ear Training" (33 terms)
PRIMARY: 1500 Ear Training (interval/frequency training, practice methods)* · 1510 Tonal &
  Timbre Descriptors (muddy, harsh, boxy etc) · 1520 Listening Slang & Sound
  Identification · 1540 Attack, Decay, Resonance & Artifact Identification (identifying
  hum/buzz/distortion/faults BY EAR)
OVERFLOW: 1550 Strings, Guitar & Keys · 1560 Drums & Percussion · 1570 Winds, Brass &
  Organ (instrument-sound identification)

## Group v1_gs=28 — "Audio Equipment & Infrastructure" (75 terms)
PRIMARY: 370 Racks, Patchbays & Wiring Infrastructure* · 380 Studio/Stage Furniture &
  Mounting · 390 Physical Controls & Hardware (knobs, faders, switches, displays) ·
  400 Power & Signal Distribution Hardware
OVERFLOW: 420 Dante Fundamentals & Routing (AVB/AES67/audio-over-IP networking terms)

## Group v1_gs=29 — "Room Acoustics" (89 terms)
PRIMARY: 500 Acoustic Principles & Room Behavior (modes, reflections, RT60 concept,
  propagation in rooms)* · 510 Absorption & Bass Trapping · 520 Diffusion & Materials ·
  530 Room Treatment Layout & Application
OVERFLOW: 1770 Studio Acoustics & Design (sound isolation/decoupling/STC construction) ·
  550 Acoustic & Room Measurement (measurement-procedure terms)

## Group v1_gs=31 — "Dante Networking" (53 terms)
PRIMARY: 420 Dante Fundamentals & Routing* · 430 Dante Devices, Modules & Certification ·
  440 Clocking, Redundancy & Network Management · 450 Control Surfaces & Machine Control
  (rare)

## Group v1_gs=33 — "Soldering & Repair" (194 terms)
PRIMARY: 970 Soldering (irons/stations, solder, flux, technique, desoldering, solder-tool
  safety) · 980 Repair (diagnosis, disassembly, component replacement, cleaning,
  connector/cable repair, gear repair practice)*

## Group v1_gs=36 — "DAW Skills" (139 terms)
PRIMARY: 1240 DAW Fundamentals & Session Management (sessions, buffers, latency, digital
  audio in the DAW, plugins hosting, file handling)* · 1250 Editing & Comping ·
  1260 In-the-Box Mixing & Automation · 1270 DAW: Logic · 1280 DAW: Cubase/Nuendo ·
  1290 DAW: REAPER · 1300 DAW: Ableton Live · 1310 DAW: Studio One · 1320 DAW: Digital
  Performer/Reason
OVERFLOW: 340 Audio File Formats & Media (pure file-format terms)

## Group v1_gs=39 — "Sampling" (60 terms)
PRIMARY: 1350 Sampling Fundamentals & Instruments* · 1360 Sample Editing & Manipulation ·
  1370 Drum Programming & Beat-Making
OVERFLOW: 1620 Copyright, Publishing & Licensing (sample-clearance/legal terms)

## Group v1_gs=40 — "Synthesis" (73 terms)
PRIMARY: 1380 Synthesis Fundamentals & Oscillators* · 1390 Filters, Envelopes &
  Modulation · 1400 Synthesis Types, Modular & CV

## Group v1_gs=42 — "Podcasting & Broadcast Audio" (87 terms)
PRIMARY: 1190 Podcast Production* · 1200 Broadcast / Radio Production & Air Chain ·
  1210 Streaming & Distribution · 1220 Broadcast Loudness & Compliance

## Group v1_gs=43 — "Band Recording and Production" (118 terms)
PRIMARY: 1040 Drum-Kit Recording · 1050 Guitar, Bass & Amp Recording · 1060 Band Tracking
  Workflow & Arrangement* · 1070 Vocal & Overdub Production

## Group v1_gs=44 — "Film & Game Audio" (111 terms)
PRIMARY: 1230 Sound for Picture — Post Workflow & Deliverables (prefer 1232/1234 if
  ambiguous) · 1232 Production Sound & Field Recording (location/set sound, boom, timecode
  on set) · 1234 Re-Recording & Final Mix (dub stage, stems, printmaster) · 1690 Film
  Scoring · 1700 Dialogue Editing · 1710 ADR & Looping · 1720 Dubbing & Localization ·
  1730 Foley Performance & Recording · 1732 SFX Editorial & Sound Design · 1740 Game
  Audio* (for game terms) · 1750 Themed Entertainment / Haunt Audio
OVERFLOW: 1650 Immersive Formats & Delivery · 1660 Object & Bed Panning / Authoring ·
  1670 Immersive Monitoring & Calibration (surround/immersive format & monitoring terms)
