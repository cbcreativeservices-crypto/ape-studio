/**
 * Foundations of Sound + Sound Playground — "explain this screen" content
 * (owner 2026-10-31, the Screen Guide rollout after the Wave Physics pilot).
 *
 * One guide per course module (keyed by the course's own step keys m1–m14 in
 * FoundationsCourseScreen.tsx STEPS), a second Module 7 guide for its
 * predict-first cover (the full guide would give the answer away before the
 * learner calls it), one for the course's what's-left screen, and one for the
 * Sound Playground. The course has no menu screen: it opens on Module 1.
 *
 * Every line was written against the module's own code (FoundationsCourse-
 * Screen / FoundationsPlaygroundScreen / viz.tsx): the names are the on-screen
 * names (bezel keys, dock labels, option labels, labels drawn on the display),
 * and every number quoted in TRY THIS is what the screen prints for that
 * setting (the module's default state unless the step says otherwise).
 * Change a module's labels, ranges or defaults → update its guide here;
 * test/screenGuide_foundations_20261031.test.ts pins the shape.
 *
 * STEPPED: each section is one step held to SCREEN_GUIDE_BUDGET (types.ts) so
 * it fits a 375×812 phone with no scrolling. Copy rules: plain language,
 * short sentences; claims KNOWLEDGE, never skills; no gear brand names; no
 * "N of total"; no build notes in learner text.
 */
import type { ScreenGuide } from '../../../features/lab/screenGuide/types';

/** The course's step keys, in lesson order (FoundationsCourseScreen STEPS). */
export type FoundationsStepKey = 'm1' | 'm2' | 'm3' | 'm4' | 'm5' | 'm6' | 'm7' | 'm8' | 'm9' | 'm10' | 'm11' | 'm12' | 'm13' | 'm14';

export const FOUNDATIONS_SCREEN_GUIDES: Record<FoundationsStepKey, ScreenGuide> = {
  // ── Module 1 · WHAT IS SOUND? ────────────────────────────────────────────
  m1: {
    seeing: [
      'Air from the side: gray dots are air molecules, with an ear at the right. One or two colored dots are tracers, each with a fixed mark.',
      'COLORIZED PRESSURE on: warm orange bands = squeezed air (compression), cool blue = stretched air (rarefaction).',
      'Readouts: FREQ (the real tone), MODEL (the slowed rate the drawing moves at) and TONE (LIVE while sounding).',
    ],
    control: [
      'PITCH key: LOW · 110 Hz, MID · 220 Hz (the start) or HIGH · 880 Hz. It stays open so you can switch while you watch.',
      'COLORIZED PRESSURE: the warm and cool bands on or off.',
      'PLAY: a sine tone at the chosen pitch; tap again to stop.',
      '⤢ FULL SCREEN enlarges the display. ▾ TEXT, beside the module title, hides or shows the opening paragraphs. Long-press a control or readout for its guided-lesson entry.',
    ],
    changes: [
      'A higher PITCH: each molecule rocks more often, and MODEL rises.',
      'In real air every pitch travels at one speed, so higher pitches pack their squeezes closer. This picture keeps the spacing fixed; Module 6 shows the real spacing.',
      'Each molecule only rocks around its home and nudges its neighbor. The pattern travels; the air stays put.',
      'The drawing is slowed: real air at 880 Hz rocks 880 times a second.',
    ],
    teaches: [
      'Sound is a traveling pattern of pressure changes in air — not a wind, not electricity, not a graph.',
      'Compression and rarefaction are the two halves of every sound wave.',
      'Every animation of sound is a slowed model. Builds on Understanding Level & Amplitude (its blue→red colors mark level here too); Module 2 adds the speaker and the graph.',
    ],
    tryThis: [
      'Follow one colored tracer dot for a few seconds: it swings around its mark and never leaves it, while the bands keep traveling.',
      'Switch PITCH from LOW to HIGH: FREQ goes 110 → 880 Hz while MODEL goes 0.45 → 1.31 Hz — real air is hundreds of times faster.',
      'Press PLAY, then switch between LOW and HIGH while you listen and watch: the rate you hear and the rate you see rise together.',
    ],
  },

  // ── Module 2 · THREE WAYS TO VIEW SOUND ──────────────────────────────────
  m2: {
    seeing: [
      'Three windows of ONE moment: SPEAKER (the cone) at left, AIR (the molecules it pushes) at right, THE GRAPH (pressure) across the bottom.',
      'One clock runs all three: a crest in THE GRAPH sits under a squeeze in the AIR window.',
      'Readouts: FREQ (fixed at 220 Hz here) and TONE.',
    ],
    control: [
      'COLORIZED PRESSURE: the warm (squeeze) and cool (stretch) bands in the AIR window on or off.',
      'PLAY: a 220 Hz sine tone, the rate the drawing stands for; tap again to stop.',
      '⤢ FULL SCREEN enlarges all three windows. Long-press a control or readout for its guided-lesson entry.',
    ],
    changes: [
      'Cone moving forward → the air beside it squeezes → THE GRAPH rises. Moving back → it stretches → THE GRAPH dips.',
      'The squeeze is strongest as the cone passes its middle going forward, not when it is fully out.',
      'The squeeze moves right, so THE GRAPH’s wave travels right, born at the speaker.',
      'Molecules only move left and right; nothing in the air is shaped like the wavy line.',
    ],
    teaches: [
      'Speaker, air and graph are three views of one event.',
      'The wavy line is a GRAPH of pressure — not the shape of sound in the air.',
      'Builds on Module 1’s air; Module 3 puts compression and rarefaction on the graph: above and below the resting pressure.',
    ],
    tryThis: [
      'Watch the cone moving forward through its middle: the squeeze forms right beside it, with the crest under it in THE GRAPH.',
      'Turn COLORIZED PRESSURE off: the molecules still bunch and spread — the color only labels what they already do.',
      'Tap ⤢ FULL SCREEN and follow one crest of THE GRAPH from the speaker to the right edge.',
    ],
  },

  // ── Module 3 · COMPRESSION & RAREFACTION ─────────────────────────────────
  m3: {
    seeing: [
      'Two stacked windows: AIR (molecules squeezing and stretching) and PRESSURE (the same moment as a graph).',
      'On the graph, + PRESSURE is above the resting line (compression) and − PRESSURE below it (rarefaction). The line itself is atmospheric pressure.',
      'Readouts: STRENGTH (gentle, medium or strong), LEVEL (% of this model’s range) and TONE.',
    ],
    control: [
      'STRENGTH fader (0–100 %): how hard the source vibrates. It starts at 30 % (gentle); medium from 33 %, strong from 66 %.',
      'COLORIZED PRESSURE: the warm and cool bands on or off.',
      'PLAY: a 165 Hz tone whose level follows STRENGTH. A hearing reminder appears before it starts.',
    ],
    changes: [
      'More STRENGTH → molecules swing farther, so squeezes pack tighter and stretches spread thinner.',
      'Tighter squeezes mean higher pressure peaks; thinner stretches mean deeper dips. Both swings on the graph grow.',
      'The rate does not change: the squeezes pass at the same pace. Only their size does.',
    ],
    teaches: [
      'Compression = pressure above atmospheric (+); rarefaction = below it (−). Zero is the room’s resting pressure.',
      'A microphone is a small surface that rides these pressure swings — every mic starts here.',
      'Builds on Module 2’s graph; Module 4 names the size of these swings: amplitude.',
    ],
    tryThis: [
      'Slide STRENGTH from 30 % to the top: the readout goes gentle → medium → strong and both swings of the graph grow.',
      'Pull STRENGTH to 0 %: the molecules stop and the graph lies flat on the resting line — no vibration, no wave — and no sound.',
      'Press PLAY and ride STRENGTH: the tone gets louder and softer, but its pitch never moves.',
    ],
  },

  // ── Module 4 · AMPLITUDE ─────────────────────────────────────────────────
  m4: {
    seeing: [
      'The three windows again — SPEAKER, AIR and THE GRAPH — all driven by one number.',
      'Readouts: AMP (small → quiet, medium, large → loud), LEVEL (% of the model’s range) and TONE.',
      'Below the display, in the reading: a level meter bar for the same setting.',
    ],
    control: [
      'AMPLITUDE fader (0–100 %): the size of the vibration. It starts at 30 %.',
      'COLORIZED PRESSURE: the warm and cool bands on or off.',
      'PLAY: a 330 Hz tone whose level follows AMPLITUDE (24 dB from bottom to top). A hearing reminder appears first.',
    ],
    changes: [
      'More AMPLITUDE → the cone travels farther each stroke → bigger squeezes → a taller graph → a higher level.',
      'Four views of one number: cone travel, squeeze density, graph height, level.',
      'How OFTEN the cone moves never changes here. That is frequency — the next module.',
    ],
    teaches: [
      'Amplitude is the SIZE of a vibration; a bigger size usually sounds louder.',
      'Size and rate are separate: a louder sound at the same pitch moves farther, not more often.',
      'Builds on Module 3’s pressure swings; Module 5 turns to rate, and Module 9 shows why size is not the whole story of loudness.',
    ],
    tryThis: [
      'Push AMPLITUDE to the top: AMP reads large → loud and LEVEL 100 %. Cone, squeezes and graph all grow together.',
      'Watch the cone as you move the fader: it travels farther, but it does not move back and forth any more often.',
      'Press PLAY and ride AMPLITUDE: louder and softer, always the same pitch.',
    ],
  },

  // ── Module 5 · FREQUENCY ─────────────────────────────────────────────────
  m5: {
    seeing: [
      'Two identical sources side by side, each a piston pushing air: A (left) is fixed at 110 Hz; B (right) is the one you set.',
      'Each has an orbit dial: one lap = one cycle, so faster laps = more cycles each second. The drawing is slowed.',
      'Readouts: A (REF), B (YOURS) and TONE. While B sounds, its side lights up.',
    ],
    control: [
      'FREQ B fader (100–700 Hz): the rate of source B. It starts at 330 Hz.',
      'PLAY: sounds source B’s frequency so you hear the rate you chose; tap again to stop.',
      'A never changes — it is the reference to compare against.',
    ],
    changes: [
      'The laps are proportional: B at 330 Hz laps exactly 3 times for each lap of A at 110 Hz.',
      'Higher FREQ B → B’s dot laps faster and its compressions pass more often. The size of the swing stays the same.',
      'Your ear hears a faster rate as a higher pitch.',
    ],
    teaches: [
      'Frequency is the RATE of vibration: complete cycles per second, in hertz (Hz).',
      'Rate and size are independent: Module 4 changed only size, this module changes only rate.',
      'Prepares Module 6 (how much space one cycle takes) and Module 8 (how pitch follows ratios).',
    ],
    tryThis: [
      'Set FREQ B to 220 Hz: B laps exactly twice for every lap of A.',
      'Slide FREQ B down to 100 Hz: B now runs a little slower than A (100 against 110).',
      'Push FREQ B to 700 Hz and press PLAY: B laps about 6.4 times for each lap of A, and you hear a much higher pitch.',
    ],
  },

  // ── Module 6 · WAVELENGTH ────────────────────────────────────────────────
  m6: {
    seeing: [
      'A real room from the side, drawn to scale: 0 to 7 m, ticks every meter, a person for size. Air molecules fill it.',
      'The amber bracket marked λ is exactly one wavelength at the chosen frequency.',
      'Readouts: FREQ, λ (one wavelength, in meters) and FITS (how many wavelengths fit across the room).',
    ],
    control: [
      'FREQ fader (55–880 Hz, four octaves): reshapes the wave across the room. It starts at 110 Hz.',
      'This module is silent — no PLAY key. Its job is the picture of space.',
      '⤢ FULL SCREEN enlarges the room. Long-press a readout for its guided-lesson entry.',
    ],
    changes: [
      'λ = speed of sound ÷ frequency = 343 ÷ FREQ. Double FREQ and λ halves.',
      'While one compression travels away at 343 m/s, the next is made behind it; the gap between them is λ.',
      'The colored tracer dots only rock in place: the wave crosses the room, the air does not.',
    ],
    teaches: [
      'Wavelength: low notes take up meters of air, high notes centimeters.',
      'Why bass wraps around obstacles and builds up in rooms: its waves are as big as the room.',
      'Builds on Module 5’s rate; Module 7 joins this space view to the time view a microphone sees.',
    ],
    tryThis: [
      'At the start, 110 Hz: λ reads 3.12 m and FITS 2.2×. Slide to 220 Hz: λ 1.56 m, FITS 4.5× — double the frequency, half the length.',
      'Pull FREQ to the bottom: 55 Hz, λ 6.24 m — barely one wave across the whole room (FITS 1.1×).',
      'Push FREQ to the top: 880 Hz, λ 0.39 m, FITS 18.0×.',
    ],
  },

  // ── Module 7 · ONE WAVE, TWO QUESTIONS (after the prediction) ────────────
  m7: {
    seeing: [
      'Top: THE ROOM — CAMERA FLASH. Pressure everywhere at one instant, ruler in meters. The ringed mic is the one point the lower graph hears.',
      'Bottom: THE MIC’S OUTPUT. Pressure at the mic only, drawn into MIC INPUT at the NOW line, ruler in milliseconds.',
      'The green PROBE marks one spot in both graphs: one vertical line through the ROOM and the MIC INPUT. The SAME SPOT chip names it in time and distance.',
    ],
    control: [
      'PROBE fader: moves the green bookmark. Its lane reads that spot in meters and milliseconds.',
      'FREEZE: stops the display like a camera flash; MODE reads FROZEN instead of RUN.',
      'FREQ key: 110 Hz or 220 Hz (the start).',
      'PLAY: sounds the chosen frequency; tap again to stop.',
      'Under the reading’s first lines, three steps: 1 · WATCH while it runs, 2 · FREEZE, 3 · DRAG THE PROBE. The highlight follows what you are doing.',
    ],
    changes: [
      'THE MIC’S OUTPUT slides left because it is recording: new sound lands at NOW and older sound moves left. Left = earlier.',
      'Sound covers 343 m each second, so a spot that has traveled farther past the mic was felt longer ago.',
      'Lower FREQ → longer waves and periods: the same PROBE spot reads more meters and more milliseconds.',
    ],
    teaches: [
      'A waveform display draws TIME at one point; the room view draws SPACE at one instant.',
      'distance = speed × time ties the two rulers together at every point.',
      'Builds on Module 6’s meters; every recording screen you meet later draws the time view. Module 8 returns to pitch.',
    ],
    tryThis: [
      'At 220 Hz, leave PROBE where it starts: the PROBE lane reads 1.56 m · 4.5 ms — one spot, named in meters and in milliseconds.',
      'Switch FREQ to 110 Hz: the lane now reads 3.12 m · 9.1 ms for the same PROBE spot — both double.',
      'FREEZE, then slide PROBE to the end of its lane: the lane reads 2.26 m · 6.6 ms at 220 Hz. Check it: 2.26 ÷ 343 ≈ 6.6 ms.',
    ],
  },

  // ── Module 8 · PITCH vs FREQUENCY ────────────────────────────────────────
  m8: {
    seeing: [
      'A spiral: one full turn = one octave = twice the frequency. The upward ray marks 110, 220, 440 and 880 Hz.',
      'The green marker and its orbiting dot sit at the current frequency (the orbit is slowed).',
      'Readouts: FREQ, ABOVE 110 (octaves above 110 Hz, written 8ve) and TONE.',
    ],
    control: [
      'Drag around the spiral: clockwise glides the pitch up, one turn per octave, from 110 to 880 Hz.',
      'PITCH fader: the same glide on a lane; it reads Hz and octaves.',
      'OCTAVES key: jump to 110 Hz, 220 Hz · +1 8ve, 440 Hz · +2 8ve or 880 Hz · +3 8ve. It starts at 220 Hz.',
      'PLAY: sounds the current frequency and follows every glide.',
    ],
    changes: [
      'Each turn doubles the Hz: 110→220 adds 110 Hz, 440→880 adds 440 Hz, yet both are one turn.',
      'Hearing compares ratios, so equal turns sound like equal musical steps.',
      'That is why analyzers offer a log frequency axis: every octave gets the same width, so equal musical steps get equal space.',
    ],
    teaches: [
      'Frequency is the measured number; pitch is what you hear — and pitch follows RATIOS.',
      'An octave is a doubling of frequency.',
      'Builds on Module 5’s rate; Module 9 shows the ear also hears some frequencies as louder than others.',
    ],
    tryThis: [
      'Tap 440 Hz · +2 8ve: ABOVE 110 reads +2.00 8ve. Then tap 880 Hz · +3 8ve: it reads +3.00 8ve.',
      'From 220 Hz, drag clockwise one full turn: you land on 440 Hz, not on 220 + 110.',
      'Press PLAY and tap 110 → 220 → 440 → 880: each step sounds the same size, though the Hz jumps keep growing.',
    ],
  },

  // ── Module 9 · LOUDNESS vs AMPLITUDE ─────────────────────────────────────
  m9: {
    seeing: [
      'A simplified ear-sensitivity curve (low to high frequency, 40 Hz to past 10k), with a dB color scale at the left.',
      'Amber line: YOU SEND — same at every Hz. Colored curve: YOU HEAR. A dot marks your tone; its EAR tag is the ear’s adjustment there (minus = less sensitive, plus = more).',
      'Readouts: FREQ, SEND and HEARD (SEND plus EAR). The inset, WHAT YOU HEAR — LEVEL × EAR CURVE, shrinks with HEARD.',
    ],
    control: [
      'FREQ fader (80 Hz–8 kHz): moves the tone along the curve. It starts at 1 kHz.',
      'LEVEL fader (−44 to −20 dB, relative): the level you send. It starts at −37 dB.',
      'PLAY: sounds the tone at that frequency and level. A hearing reminder appears first. Headphones make it honest: phone speakers lose the lows themselves.',
    ],
    changes: [
      'FREQ changes HEARD but never SEND: the ear is less sensitive at low frequencies, so the same amplitude sounds quieter.',
      'The curve peaks around 3–4 kHz, where the ear canal resonates — the range that makes consonants clear — and falls steeply toward the lows (and again above about 9 kHz).',
      'LEVEL moves SEND and HEARD together and re-colors the whole curve.',
    ],
    teaches: [
      'Amplitude is physics; loudness is perception. Equal amplitude is not equal loudness.',
      'Why quiet playback loses the bass first: the ear is least sensitive to the lows, so they slip below hearing first.',
      'The curve is an illustration, not measured data. Builds on Module 4; Module 10 turns to two waves meeting.',
    ],
    tryThis: [
      'At the start (1 kHz) SEND and HEARD both read −37 dB. Pull FREQ to the bottom, 80 Hz: SEND stays −37, EAR reads −24 dB, HEARD −61 dB.',
      'Slide FREQ to about 3.5 kHz: EAR reads +5 dB and HEARD −32 dB — the ear’s most sensitive region.',
      'Back at 1 kHz, raise LEVEL to the top: SEND reads −20 dB and HEARD follows to −20 dB.',
    ],
  },

  // ── Module 10 · PHASE — THE FIRST MAGIC TRICK ────────────────────────────
  m10: {
    seeing: [
      'INPUTS (top): two identical waves, purple and blue, offset by the PHASE you set. Both travel.',
      'SUM = A + B (bottom): their exact sum, colored by level. When they cancel it lies flat and glows red.',
      'Readouts: PHASE (degrees), SUM (ALIGNED, PARTIAL or CANCELED) and OUT (the tones playing, if any).',
    ],
    control: [
      'PHASE fader (0–360°): how far wave B is shifted in its cycle. It starts at 270°.',
      'PRESET key: 0°, 90°, 180°, 270° or 360°.',
      'HEAR key, when your dock shows it: HEAR ALIGNED — 220 / 220 Hz, HEAR DRIFTING — 220 / 222 Hz, or STOP. Two real tones, one in each channel.',
      'PHASE and PRESET change the drawing only; the HEAR tones do not follow them.',
    ],
    changes: [
      'At 0° (or 360°) every push meets a push: the sum is twice as tall. SUM reads ALIGNED.',
      'At 180° every push meets an equal pull: the sum is flat — silence from two sounds. SUM reads CANCELED.',
      'In between, PARTIAL: at 90° the sum is about 1.4× one wave; past 120° it is smaller than either, shrinking toward flat near 180°.',
      'DRIFTING tones 2 Hz apart slip in and out of step twice a second — beating.',
    ],
    teaches: [
      'Phase is where in its cycle a wave is, in degrees. Alone it is inaudible; it matters when two copies meet.',
      'Aligned copies add; opposed copies cancel.',
      'The root of comb filtering — the hollow sound of two copies arriving slightly apart — in mic pairs and subwoofer placement. Module 11 stacks waves of different frequencies.',
    ],
    tryThis: [
      'Tap PRESET 0°: SUM reads ALIGNED and the bottom wave is twice as tall as either input.',
      'Tap PRESET 180°: SUM reads CANCELED and the bottom line goes flat and red, while both inputs keep moving.',
      'If your dock shows HEAR, pick HEAR DRIFTING — 220 / 222 Hz: OUT reads 220/222 and the phone speaker swells and fades twice a second (on headphones it is much fainter).',
    ],
  },

  // ── Module 11 · HARMONICS ────────────────────────────────────────────────
  m11: {
    seeing: [
      'Six sine layers, H1 (the fundamental) at the bottom up to H6, and their SUM below. Each row’s color shows its level.',
      'Every layer is a whole-number multiple of 220 Hz: H2 = 440, H3 = 660 … H6 = 1320.',
      'Readouts: F0 (220 Hz), SEL (the selected harmonic), LEVEL (its level) and TONE.',
    ],
    control: [
      'HARMONICS key: tap H1–H6 to select one (amber = selected, lit = on). Long-press one for its guided-lesson entry.',
      'Level lane, named for the selection (H1 LEVEL, H2 LEVEL…), 0–100 %. It starts with H1 100 %, H2 50 %, H3 33 %, the rest off.',
      'PLAY, when your dock shows it: sounds the stack as real additive synthesis (a tone built by adding sines); every change is heard live.',
    ],
    changes: [
      'Adding a harmonic changes the SHAPE of each cycle — the timbre — not the pitch.',
      'While H1 is on, every layer fits inside its 220 repeats a second, so the pitch stays at 220 Hz. With only H2 up, the SUM repeats 440 times a second: an octave up.',
      'Stronger upper harmonics make a brighter, edgier tone; fewer make it purer.',
    ],
    teaches: [
      'Timbre is a recipe: a fundamental plus harmonics, each with its own level.',
      'Why a piano and a trumpet on the same note sound different.',
      'Builds on Module 10’s adding of waves; Module 12 runs it in reverse — taking a wave apart.',
    ],
    tryThis: [
      'Select H2 and pull its level to 0 %: the SUM changes shape — it loses its lopsided lean — but still repeats at the same rate.',
      'Select H4, raise it to about 50 %, then press PLAY if your dock shows it: the tone thickens; the pitch stays put.',
      'With PLAY on, take every layer but H1 to 0 % (H2, H3, and H4 if you raised it): you hear the bare 220 Hz fundamental, a pure sine.',
    ],
  },

  // ── Module 12 · THE FOURIER PRINCIPLE ────────────────────────────────────
  m12: {
    seeing: [
      'One wave (amber) being pulled apart into its sine ingredients (blue), with a card of bars below: the SPECTRUM.',
      'Each bar is one ingredient: its place is its harmonic, its height its strength. The bars hold still while the waves travel.',
      'Readouts: RECIPE, UNMIX (% separated) and F0 (220 Hz).',
    ],
    control: [
      'UNMIX fader (0–100 % separated): from the mixed wave to its separate ingredients. It starts at 67 %.',
      'RECIPE key: PURE (fundamental only), HOLLOW (odd) (H1, H3, H5) or BRIGHT (all) (H1–H6). It starts on BRIGHT (all).',
      'PLAY, when your dock shows it: sounds the recipe as real additive synthesis (a tone built by adding sines); a RECIPE change is heard live.',
    ],
    changes: [
      'Higher UNMIX → the mixed wave fades, its ingredients separate onto their own lines, and the bars grow brighter.',
      'UNMIX adds and removes nothing: it shows what was always there.',
      'Fourier: any repeating wave, however jagged, is a sum of sines at whole-number multiples of its repeat rate.',
    ],
    teaches: [
      'Every sound has two complete descriptions: the waveform (pressure over time) and the spectrum (which sines, how strong).',
      'Analyzers and spectrograms do this unmixing live, on real sound.',
      'Builds on Module 11; Module 13 shows the real tools that measure it.',
    ],
    tryThis: [
      'Pick PURE and ride UNMIX up: one sine comes apart into one ingredient and one bar.',
      'Pick HOLLOW (odd): three bars, with gaps where the even harmonics would be.',
      'Pick BRIGHT (all) and push UNMIX to 100 %: six ingredients and six bars, shorter as the harmonic number rises (the last two look the same height).',
    ],
  },

  // ── Module 13 · WHY MEASUREMENT TOOLS EXIST ──────────────────────────────
  m13: {
    seeing: [
      'An animated chain: a source, the air and a microphone — the path every measuring tool listens to.',
      'Below the display: one card per question the course raised, each naming the real tool that answers it.',
      'Readout: CHAIN — SOURCE → AIR → MIC. The display is a model; the tools behind the cards measure for real.',
    ],
    control: [
      'The dock is empty: this module is for reading and choosing a tool.',
      'Tap a card to open that tool: SPL Meter, Frequency Counter & Tuner, RTA, Spectrogram, Waveform, RT60 or Signal Generator. Long-press a card for its guided-lesson entry.',
      'Come back with the tool’s ‹; the course keeps your place.',
    ],
    changes: [
      'Nothing on this display reacts to settings: each card swaps the model for a live measurement.',
      'Ears adapt, compare and tire; instruments hold still. The meter gives the number; the model explains it.',
      'Readings are labeled honestly — dBFS · uncalibrated (digital level, not checked against a reference meter) where that is the truth.',
    ],
    teaches: [
      'Why measurement tools exist: ears estimate, meters measure.',
      'Which tool answers which question: how loud, what frequency, what recipe, how it changes, what the pressure does, how long a room rings.',
      'dBFS is level inside the phone’s digital system — not loudness, not SPL. Module 14 wraps up the course.',
    ],
    tryThis: [
      'Open Waveform and say “ah”: the live trace is Module 7’s MIC’S OUTPUT — real pressure at your phone’s mic, over time.',
      'Open the Frequency Counter & Tuner and hum one steady note: it reads your note in Hz.',
      'Open RTA and whistle: one band stands out — a single ingredient, as in Module 12.',
    ],
  },

  // ── Module 14 · THE FULL PLAYGROUND ──────────────────────────────────────
  m14: {
    seeing: [
      'Module 2’s three windows — SPEAKER, AIR and THE GRAPH — one last look at the whole model.',
      'Readout: COURSE — COMPLETE — THE WHOLE MODEL.',
      'Below: YOU BUILT THE WHOLE MODEL (one line per module), three CHECK YOURSELF questions, then OPEN THE PLAYGROUND.',
    ],
    control: [
      'The dock is empty: this module is for review.',
      'CHECK YOURSELF: tap an answer to see why it is right or wrong.',
      'OPEN THE PLAYGROUND (green, after the checks): the course’s main controls — level, frequency, waveform, harmonics, phase, polarity — on one screen.',
      'FINISH › on the strip opens the what’s-left screen.',
    ],
    changes: [
      'In the Playground the course’s properties meet: size (amplitude), rate (frequency) and its spacing (λ), recipe (harmonics), phase and polarity.',
      'The three checks are contrasts: louder vs higher, time vs space, timbre vs pitch.',
    ],
    teaches: [
      'The whole model: a speaker moves, air squeezes and stretches, a graph describes it.',
      'Next in Audio Fundamentals: the Sound Playground (OPEN THE PLAYGROUND, below), then Microphone Principles, where this model meets real microphones.',
    ],
    tryThis: [
      'Answer all three CHECK YOURSELF questions before you read any explanation.',
      'Open the Playground and rebuild Module 4: move LEVEL and watch every view grow and shrink together.',
      'In the Playground, pick SAW, then FUNDAMENTAL under HARMONIC RICHNESS: Module 11 in reverse — the harmonics go, a pure sine is left.',
    ],
  },
};

/** Module 7 BEFORE the learner calls it (the predict-first cover): never
 *  gives the answer away — the screen hides its own reading until then. */
export const FOUNDATIONS_M7_COVER_GUIDE: ScreenGuide = {
  seeing: [
    'Before the display opens, it asks one question about the wavy line every recording screen shows.',
    'Two answers on the display: TIME (earlier → later) or SPACE (one place → another).',
    'Answer first — the module’s reading below the display opens once you do.',
  ],
  control: [
    'Tap TIME or SPACE on the display. Either answer opens the full display — a wrong guess is fine, and nothing is scored.',
    'The dock already works: PROBE, FREEZE, FREQ (110 Hz or 220 Hz) and PLAY.',
  ],
  changes: [
    'Your answer opens two graphs of one wave and the module’s reading.',
    'Calling it first, then checking, is how a wrong idea gets replaced by the right one.',
  ],
  teaches: [
    'This module joins two ways of reading one wave.',
    'It builds on Module 6’s wavelength in meters.',
  ],
  tryThis: [
    'Say your answer out loud, and why, before you tap it.',
    'If your dock shows PLAY, press it first and listen while you decide.',
  ],
};

/** The course's what's-left screen (after FINISH › on Module 14). */
export const FOUNDATIONS_END_GUIDE: ScreenGuide = {
  seeing: [
    'The end of Foundations of Sound: the modules you have not opened yet are listed first.',
    'Modules already counted read CREDITED (DONE when you are not signed in). Tap REVIEW ▾ to list them.',
  ],
  control: [
    'Tap any module row to jump straight to it.',
    'PRACTICE AGAIN FROM THE START: back to Module 1.',
    'DONE · BACK TO LABS: leaves the lab. ‹ PREV on the strip returns to Module 14.',
  ],
  changes: [
    'A module counts once you open it, so the list shrinks as you visit.',
    'Practicing again or reviewing never removes credit you have already earned.',
  ],
  teaches: [
    'What is left of the course — and that every module stays open for practice.',
    'Next in Audio Fundamentals: the Sound Playground, then Microphone Principles.',
  ],
  tryThis: [
    'Reopen Module 7 and drag the PROBE again: one wave, two rulers.',
    'Tap PRACTICE AGAIN FROM THE START and notice how much faster Module 1 reads now.',
  ],
};

/** The Sound Playground (route FoundationsPlayground) — one screen. */
export const PLAYGROUND_SCREEN_GUIDE: ScreenGuide = {
  seeing: [
    'The course’s core views together: a speaker cone and its air on top, then WAVEFORM — PRESSURE VS TIME and SPECTRUM — LOG 40 Hz–16 kHz. With a sweep, those two pause; watch the air and LEVEL.',
    'An L–R strip at the bottom shows STEREO BALANCE (BAL CENTER to start).',
    'Readouts follow SOURCE: FREQ, λ, PERIOD and LEVEL (dBFS) for a wave; SWEEP or CONTENT for a sweep or noise.',
  ],
  control: [
    'FREQ fader (55 Hz–3.5 kHz, starts at 290 Hz) and LEVEL fader (−48 to −16 dBFS, starts at −38).',
    'SOURCE tray: SINE, SQUARE, SAW or TRIANGLE; WHITE, PINK or BROWN NOISE; SLOW SWEEP or FAST SWEEP. For a wave, HARMONIC RICHNESS (ALL HARMONICS, FIRST 3, FUNDAMENTAL) and PHASE · POLARITY.',
    'FX tray: STEREO BALANCE, DELAY (DELAY OFF, 120 ms, 400 ms), EQ LOW-PASS (EQ OFF, LPF 2 kHz, LPF 500 Hz); Q 0.7 or Q 4 work once a low-pass is on.',
    'PLAY / STOP: every change is heard live; a hearing reminder comes first. Long-press any control for its guided-lesson entry.',
  ],
  changes: [
    'Higher FREQ: shorter λ and PERIOD, tighter air spacing, more WAVEFORM cycles; the SPECTRUM line shifts right.',
    'SQUARE, SAW and TRIANGLE add harmonics (more lines). A low-pass shortens lines above its cutoff, the farther the more; Q 4 adds a peak there.',
    'PHASE and POLARITY move the WAVEFORM, unheard on one source. Noise has no pitch: a smooth SPECTRUM line, flat for WHITE, sloping for PINK, steeper for BROWN.',
  ],
  teaches: [
    'How every property from the course acts on one sound at once — and which changes you can hear.',
    'The drawings and LEVEL come from your settings: LEVEL (dBFS, digital level) is the level you set, not a measurement. DELAY is heard but not drawn.',
    'Comes after the Foundations course (its Module 14 opens it); next is Microphone Principles.',
  ],
  tryThis: [
    'Note λ at 290 Hz (1.18 m), then slide FREQ to about 580 Hz: λ reads about 0.59 m — double the frequency, half the wavelength.',
    'Pick SQUARE: the SPECTRUM shows 6 lines (odd harmonics only). Tap FIRST 3: only 2 remain, and the WAVEFORM’s corners round off.',
    'Press PLAY and flip POLARITY + to POLARITY −: the WAVEFORM turns upside down, the sound does not change.',
  ],
};
