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
    intro: {
      learning: 'Sound is a traveling pattern of squeezed and stretched air. Each air molecule only rocks around its own spot while the pattern moves on.',
      start: 'Follow one colored tracer dot and see that it stays near its mark. Then switch PITCH from LOW to HIGH and compare FREQ with MODEL.',
    },
    seeing: [
      'You’re looking at air from the side: gray dots are air molecules, with an ear at the right. One or two colored tracer dots each have a fixed mark showing where they started.',
      'With COLORIZED PRESSURE on, warm orange bands show squeezed air (compression) and cool blue bands show stretched air (rarefaction).',
      'FREQ is the real tone. MODEL is the slowed rate the drawing moves at. TONE reads LIVE while sound plays.',
    ],
    control: [
      'Use the PITCH key to pick LOW · 110 Hz, MID · 220 Hz (where you start) or HIGH · 880 Hz. It stays open, so you can switch while you watch.',
      'Turn COLORIZED PRESSURE on or off to show or hide the warm and cool bands.',
      'Tap PLAY to hear a sine tone (the simplest tone: one frequency only) at the pitch you chose. Tap it again to stop.',
      'Tap ⤢ FULL SCREEN for a bigger view. Tap ▾ TEXT, beside the module title, to hide or show the opening paragraphs. Long-press any control or readout for its guided-lesson entry.',
    ],
    changes: [
      'Pick a higher PITCH and each molecule rocks more often, so MODEL rises.',
      'Air carries every pitch at one speed, so higher pitches pack their squeezes closer. Here the spacing stays fixed; Module 6 shows the real spacing.',
      'Each molecule only rocks around its home, nudging its neighbor. The pattern travels; the air stays put.',
      'The drawing is slowed: in real air at 880 Hz, each molecule rocks 880 times a second.',
    ],
    teaches: [
      'Sound is a traveling pattern of pressure changes in air. It isn’t a wind, it isn’t electricity, and it isn’t a graph.',
      'Every sound wave has two halves: compression (air squeezed together) and rarefaction (air stretched apart).',
      'Any animation of sound is a slowed picture. Real air vibrates far too fast to see.',
    ],
    tryThis: [
      'Follow one colored tracer dot for a few seconds. It swings around its mark and never leaves it, while the bands keep traveling.',
      'Switch PITCH from LOW to HIGH. FREQ goes from 110 to 880 Hz, while MODEL goes from 0.45 to 1.31 Hz. Real air moves hundreds of times faster than the drawing.',
      'Tap PLAY, then switch between LOW and HIGH while you listen and watch. The rate you hear and the rate you see rise together.',
    ],
  },

  // ── Module 2 · THREE WAYS TO VIEW SOUND ──────────────────────────────────
  m2: {
    intro: {
      learning: 'A speaker’s motion, the air it pushes and a pressure graph are three views of one event. The wavy line is a graph, not the shape of sound.',
      start: 'Watch the cone move forward through its middle and find the squeeze beside it in AIR. Then look straight down to the crest in THE GRAPH.',
    },
    seeing: [
      'You see one moment three ways: SPEAKER (the cone) at left, AIR (the molecules it pushes) at right, and THE GRAPH (pressure) across the bottom.',
      'One clock runs all three. A crest in THE GRAPH always sits under a squeeze in the AIR window.',
      'FREQ stays at 220 Hz on this screen. TONE shows when sound plays.',
    ],
    control: [
      'Turn COLORIZED PRESSURE on or off to show or hide the warm (squeeze) and cool (stretch) bands in the AIR window.',
      'Tap PLAY to hear a 220 Hz sine tone, the rate the drawing stands for. Tap it again to stop.',
      'Tap ⤢ FULL SCREEN to enlarge all three windows. Long-press any control or readout for its guided-lesson entry.',
    ],
    changes: [
      'As the cone moves forward, the air beside it squeezes and THE GRAPH rises. As it moves back, the air stretches and THE GRAPH dips.',
      'The squeeze is strongest as the cone passes its middle going forward, not when it’s all the way out.',
      'The squeeze moves right, so THE GRAPH’s wave travels right, starting at the speaker.',
      'The molecules only move left and right. Nothing in the air is shaped like the wavy line.',
    ],
    teaches: [
      'A speaker’s motion, the air’s pressure and a graph are three views of one event.',
      'The wavy line is a graph of pressure. It isn’t the shape of sound in the air.',
      'A speaker makes sound by pushing and pulling on the air right beside it.',
    ],
    tryThis: [
      'Watch the cone moving forward through its middle. The squeeze forms right beside it, with the crest under it in THE GRAPH.',
      'Turn COLORIZED PRESSURE off. The molecules still bunch and spread; the color only labels what they already do.',
      'Tap ⤢ FULL SCREEN and follow one crest of THE GRAPH from the speaker to the right edge.',
    ],
  },

  // ── Module 3 · COMPRESSION & RAREFACTION ─────────────────────────────────
  m3: {
    intro: {
      learning: 'Compression is air pressure above the room’s resting pressure and rarefaction is below it. A stronger vibration makes both swings bigger without changing their rate.',
      start: 'Slide STRENGTH from 30 % to the top and watch both swings on the PRESSURE graph grow. Then pull it to 0 % and watch the graph go flat.',
    },
    seeing: [
      'Two windows show the same moment: AIR on top (molecules squeezing and stretching) and PRESSURE below (the same moment as a graph).',
      'On the graph, + PRESSURE is above the resting line (compression) and − PRESSURE is below it (rarefaction). The line itself is normal atmospheric pressure.',
      'STRENGTH reads gentle, medium or strong. LEVEL is a % of this model’s range. TONE shows when sound plays.',
    ],
    control: [
      'Move the STRENGTH fader (0–100 %) to set how hard the source vibrates. It starts at 30 % (gentle), reads medium from 33 % and strong from 66 %.',
      'Turn COLORIZED PRESSURE on or off to show or hide the warm and cool bands.',
      'Tap PLAY to hear a 165 Hz tone whose level follows STRENGTH. A hearing reminder appears before it starts.',
    ],
    changes: [
      'Raise STRENGTH and the molecules swing farther, so the squeezes pack tighter and the stretches spread thinner.',
      'Tighter squeezes mean higher pressure peaks. Thinner stretches mean deeper dips. Both swings on the graph grow.',
      'The rate doesn’t change: the squeezes pass at the same pace. Only their size does.',
    ],
    teaches: [
      'Compression is pressure above atmospheric (+). Rarefaction is pressure below it (−). Zero on the graph is the room’s resting pressure.',
      'A microphone is a small surface that rides these pressure swings. Every mic starts here.',
      'How hard a source vibrates sets how big its pressure swings are, not how often they come.',
    ],
    tryThis: [
      'Slide STRENGTH from 30 % to the top. The readout goes gentle, then medium, then strong, and both swings of the graph grow.',
      'Pull STRENGTH to 0 %. The molecules stop and the graph lies flat on the resting line. No vibration means no wave, and no sound.',
      'Press PLAY and ride STRENGTH. The tone gets louder and softer, but its pitch never moves.',
    ],
  },

  // ── Module 4 · AMPLITUDE ─────────────────────────────────────────────────
  m4: {
    intro: {
      learning: 'Amplitude is the size of a vibration. More amplitude means more cone travel, bigger squeezes, a taller graph and a higher level, all at the same pitch.',
      start: 'Push AMPLITUDE to the top and watch the cone, the squeezes and THE GRAPH grow together. Then tap PLAY and ride the fader.',
    },
    seeing: [
      'Module 2’s three windows again, SPEAKER, AIR and THE GRAPH, now all driven by one number.',
      'AMP reads small → quiet, medium, or large → loud. LEVEL is a % of the model’s range. TONE shows when sound plays.',
      'In the text below the display, a level meter bar shows the same setting.',
    ],
    control: [
      'Move the AMPLITUDE fader (0–100 %) to set the size of the vibration. It starts at 30 %.',
      'Turn COLORIZED PRESSURE on or off to show or hide the warm and cool bands.',
      'Tap PLAY to hear a 330 Hz tone whose level follows AMPLITUDE, over 24 dB from the bottom of the fader to the top. A hearing reminder appears first.',
    ],
    changes: [
      'Raise AMPLITUDE and the cone travels farther on each stroke. That makes bigger squeezes, a taller graph and a higher level.',
      'Cone travel, squeeze density, graph height and level are four views of one number.',
      'How often the cone moves never changes here. That rate is frequency, the subject of Module 5.',
    ],
    teaches: [
      'Amplitude is the size of a vibration. A bigger size usually sounds louder.',
      'Size and rate are separate. A louder sound at the same pitch moves farther, not more often.',
      '“Usually” matters: how loud a sound seems also depends on its frequency, not just its amplitude.',
    ],
    tryThis: [
      'Push AMPLITUDE to the top. AMP reads large → loud and LEVEL reads 100 %. The cone, the squeezes and the graph all grow together.',
      'Watch the cone as you move the fader. It travels farther, but it doesn’t move back and forth any more often.',
      'Press PLAY and ride AMPLITUDE. You hear louder and softer, always at the same pitch.',
    ],
  },

  // ── Module 5 · FREQUENCY ─────────────────────────────────────────────────
  m5: {
    intro: {
      learning: 'Frequency is the rate of vibration, counted in hertz (cycles per second). Your ear hears a faster rate as a higher pitch.',
      start: 'Watch A and B lap their orbit dials. Then set FREQ B to 220 Hz and count: B laps twice for every lap of A.',
    },
    seeing: [
      'Two identical sources sit side by side, each a piston pushing air. A (left) stays at 110 Hz. B (right) is yours to set.',
      'Each has an orbit dial: one lap is one cycle, so faster laps mean more cycles each second. The drawing is slowed.',
      'A (REF) and B (YOURS) show each rate. TONE shows when sound plays, and B’s side lights up while it sounds.',
    ],
    control: [
      'Move the FREQ B fader (100–700 Hz) to set the rate of source B. It starts at 330 Hz.',
      'Tap PLAY to hear source B’s frequency, so you hear the rate you chose. Tap it again to stop.',
      'A never changes. It’s your reference to compare against.',
    ],
    changes: [
      'The laps are in proportion. At 330 Hz, B laps exactly 3 times for each lap of A at 110 Hz.',
      'Raise FREQ B and B’s dot laps faster, so its compressions pass more often. The size of each swing stays the same.',
      'Your ear hears a faster rate as a higher pitch.',
    ],
    teaches: [
      'Frequency is the rate of vibration: complete cycles per second, measured in hertz (Hz).',
      'Rate and size are independent: you can change how often a source vibrates without changing how far it swings.',
      'Two frequencies compare as a ratio: 330 Hz completes 3 cycles in the time 110 Hz completes 1.',
    ],
    tryThis: [
      'Set FREQ B to 220 Hz. B laps exactly twice for every lap of A.',
      'Slide FREQ B down to 100 Hz. Now B runs a little slower than A (100 against 110).',
      'Push FREQ B to 700 Hz and press PLAY. B laps about 6.4 times for each lap of A, and you hear a much higher pitch.',
    ],
  },

  // ── Module 6 · WAVELENGTH ────────────────────────────────────────────────
  m6: {
    intro: {
      learning: 'Wavelength is the distance one cycle takes up in air: the speed of sound ÷ frequency. Low notes span meters; high notes span centimeters.',
      start: 'Read λ and FITS at 110 Hz. Then slide FREQ to 220 Hz and watch the amber λ bracket shrink to half its length.',
    },
    seeing: [
      'A real room from the side, drawn to scale: 0 to 7 m, with a tick every meter and a person for size. Air molecules fill it.',
      'The amber bracket marked λ (lambda) is exactly one wavelength at the frequency you chose.',
      'FREQ is the frequency. λ is one wavelength, in meters. FITS is how many wavelengths fit across the room.',
    ],
    control: [
      'Move the FREQ fader (55–880 Hz, four octaves) to reshape the wave across the room. It starts at 110 Hz.',
      'This module is silent, with no PLAY key. It’s all about how much space one wave takes up.',
      'Tap ⤢ FULL SCREEN to enlarge the room. Long-press a readout for its guided-lesson entry.',
    ],
    changes: [
      'λ = speed of sound ÷ frequency = 343 ÷ FREQ (343 m/s in room-temperature air). Double FREQ and λ halves.',
      'While one compression travels away at 343 m/s, the next one forms behind it. The gap between them is λ.',
      'The colored tracer dots only rock in place. The wave crosses the room; the air doesn’t.',
    ],
    teaches: [
      'Wavelength: low notes take up meters of air, high notes only centimeters.',
      'Bass wraps around obstacles and builds up in rooms because its waves are as big as the room.',
      'Frequency and wavelength are tied by the speed of sound: when one doubles, the other halves.',
    ],
    tryThis: [
      'At the start, 110 Hz, λ reads 3.12 m and FITS 2.2×. Slide to 220 Hz: λ 1.56 m, FITS 4.5×. Double the frequency, half the length.',
      'Pull FREQ to the bottom: 55 Hz, λ 6.24 m. That’s barely one wave across the whole room (FITS 1.1×).',
      'Push FREQ to the top: 880 Hz, λ 0.39 m, FITS 18.0×. One wave is now only about 39 cm long.',
    ],
  },

  // ── Module 7 · ONE WAVE, TWO QUESTIONS (after the prediction) ────────────
  m7: {
    intro: {
      learning: 'A waveform display shows time at one point, while a room view shows space at one instant. distance = speed × time links the two.',
      start: 'Follow the three steps: 1 · WATCH, 2 · FREEZE, 3 · DRAG THE PROBE. Read the PROBE lane at 220 Hz, then switch FREQ to 110 Hz and read it again.',
    },
    seeing: [
      'Top: THE ROOM — CAMERA FLASH. Pressure everywhere at one instant, with a ruler in meters. The ringed mic is the one point the lower graph hears.',
      'Bottom: THE MIC’S OUTPUT. Pressure at the mic only, drawn into MIC INPUT at the NOW line, with a ruler in milliseconds.',
      'The green PROBE line marks one spot through the ROOM and MIC INPUT. The SAME SPOT chip names it in time and distance.',
    ],
    control: [
      'Move the PROBE fader to slide the green bookmark. Its lane reads that spot in meters and milliseconds.',
      'Tap FREEZE to stop the display like a camera flash. MODE reads FROZEN instead of RUN.',
      'Use the FREQ key to pick 110 Hz or 220 Hz (where you start).',
      'Tap PLAY to hear the chosen frequency. Tap it again to stop.',
      'Under the first lines of text, follow three steps: 1 · WATCH while it runs, 2 · FREEZE, 3 · DRAG THE PROBE. The highlight follows what you’re doing.',
    ],
    changes: [
      'THE MIC’S OUTPUT slides left because it’s recording: new sound lands at NOW and older sound moves left. Left means earlier.',
      'Sound covers 343 m each second, so a spot that has traveled farther past the mic reached it longer ago.',
      'A lower FREQ means longer waves and longer periods (the time one cycle takes), so the same PROBE spot reads more meters and more milliseconds.',
    ],
    teaches: [
      'A waveform display draws TIME at one point. A room view draws SPACE at one instant.',
      'distance = speed × time ties the two rulers together at every point.',
      'Recording and waveform screens draw the time view: what one microphone picked up, from earlier to later.',
    ],
    tryThis: [
      'At 220 Hz, leave PROBE where it starts. The PROBE lane reads 1.56 m · 4.5 ms: one spot, named in meters and in milliseconds.',
      'Switch FREQ to 110 Hz. The lane now reads 3.12 m · 9.1 ms for the same PROBE spot. Both numbers double.',
      'Tap FREEZE, then slide PROBE to the end of its lane. At 220 Hz it reads 2.26 m · 6.6 ms. Check it: 2.26 ÷ 343 ≈ 6.6 ms.',
    ],
  },

  // ── Module 8 · PITCH vs FREQUENCY ────────────────────────────────────────
  m8: {
    intro: {
      learning: 'Frequency is the measured number and pitch is what you hear. Pitch follows ratios: every doubling of frequency is one octave.',
      start: 'Tap 440 Hz · +2 8ve on the OCTAVES key and read ABOVE 110. Then drag one full turn clockwise around the spiral and see where you land.',
    },
    seeing: [
      'A spiral where one full turn is one octave, which is twice the frequency. The upward ray marks 110, 220, 440 and 880 Hz.',
      'The green marker and its orbiting dot sit at the current frequency. The orbit is slowed.',
      'FREQ is the frequency. ABOVE 110 is how many octaves above 110 Hz you are, written 8ve. TONE shows when sound plays.',
    ],
    control: [
      'Drag around the spiral. Clockwise glides the pitch up, one turn per octave, from 110 to 880 Hz.',
      'The PITCH fader does the same glide on a lane and reads Hz and octaves.',
      'The OCTAVES key jumps to 110 Hz, 220 Hz · +1 8ve, 440 Hz · +2 8ve or 880 Hz · +3 8ve. It starts at 220 Hz.',
      'Tap PLAY to hear the current frequency. It follows every glide.',
    ],
    changes: [
      'Each turn doubles the Hz: 110→220 adds 110 Hz, 440→880 adds 440 Hz, yet both are one turn.',
      'Your hearing compares ratios, so equal turns sound like equal musical steps.',
      'That’s why analyzers offer a log frequency axis: every octave gets the same width, so equal musical steps get equal space.',
    ],
    teaches: [
      'Frequency is the measured number; pitch is what you hear. Pitch follows ratios, not differences.',
      'An octave is a doubling of frequency.',
      'Equal steps in pitch are equal ratios in Hz, so each higher octave spans more Hz than the one below it.',
    ],
    tryThis: [
      'Tap 440 Hz · +2 8ve. ABOVE 110 reads +2.00 8ve. Then tap 880 Hz · +3 8ve: it reads +3.00 8ve.',
      'From 220 Hz, drag clockwise one full turn. You land on 440 Hz, not on 220 + 110.',
      'Press PLAY and tap 110 → 220 → 440 → 880. Each step sounds the same size, though the jumps in Hz keep growing.',
    ],
  },

  // ── Module 9 · LOUDNESS vs AMPLITUDE ─────────────────────────────────────
  m9: {
    intro: {
      learning: 'Amplitude is physics and loudness is perception. Your ear is less sensitive to low frequencies, so the same level can sound much quieter there.',
      start: 'Read SEND and HEARD at 1 kHz. Then pull FREQ down to 80 Hz and watch HEARD drop while SEND stays the same.',
    },
    seeing: [
      'An ear-sensitivity curve drawn to show the idea, from 40 Hz to past 10k, with a dB color scale at the left.',
      'The amber line, YOU SEND, is the same at every Hz. The colored curve is YOU HEAR. A dot marks your tone; its EAR tag is the ear’s adjustment there: minus = less sensitive, plus = more.',
      'Readouts: FREQ, SEND and HEARD (SEND plus EAR). The inset, WHAT YOU HEAR — LEVEL × EAR CURVE, shrinks with HEARD.',
    ],
    control: [
      'Move the FREQ fader (80 Hz–8 kHz) to slide your tone along the curve. It starts at 1 kHz.',
      'Move the LEVEL fader (−44 to −20 dB, relative) to set the level you send. It starts at −37 dB.',
      'Tap PLAY to hear the tone at that frequency and level. A hearing reminder appears first. Use headphones or full-range speakers if you can: a phone speaker can’t reproduce deep bass, so it adds its own bass loss.',
    ],
    changes: [
      'FREQ changes HEARD but never SEND. Your ear is less sensitive at low frequencies, so the same amplitude sounds quieter.',
      'The curve peaks around 3–4 kHz, where your ear canal resonates. That’s the range that makes consonants clear. It falls steeply toward the lows, and again above about 9 kHz.',
      'LEVEL moves SEND and HEARD together and re-colors the whole curve.',
    ],
    teaches: [
      'Amplitude is physics; loudness is perception. Equal amplitude doesn’t mean equal loudness.',
      'Quiet playback loses the bass first: your ear is least sensitive to the lows, so they slip below hearing first.',
      'This curve illustrates the idea; it isn’t measured hearing data. The shape is what matters: least sensitive in the lows, most around 3–4 kHz.',
    ],
    tryThis: [
      'At the start (1 kHz), SEND and HEARD both read −37 dB. Pull FREQ to the bottom, 80 Hz: SEND stays −37, EAR reads −24 dB, and HEARD drops to −61 dB.',
      'Slide FREQ to about 3.5 kHz. EAR reads +5 dB and HEARD −32 dB: the ear’s most sensitive region.',
      'Back at 1 kHz, raise LEVEL to the top. SEND reads −20 dB and HEARD follows to −20 dB.',
    ],
  },

  // ── Module 10 · PHASE — THE FIRST MAGIC TRICK ────────────────────────────
  m10: {
    intro: {
      learning: 'Phase is where a wave is in its cycle, in degrees. You can’t hear it on one wave, but two copies add when aligned and cancel when opposed.',
      start: 'Tap PRESET 0° and compare SUM = A + B with the INPUTS. Then tap PRESET 180° and watch the sum go flat while both inputs keep moving.',
    },
    seeing: [
      'INPUTS (top): two identical waves, purple and blue, offset by the PHASE you set. Both travel.',
      'SUM = A + B (bottom): their exact sum, colored by level. When they cancel, it lies flat and glows red.',
      'PHASE shows the offset in degrees. SUM reads ALIGNED, PARTIAL or CANCELED. OUT shows the tones playing, if any.',
    ],
    control: [
      'Move the PHASE fader (0–360°) to shift wave B within its cycle. It starts at 270°.',
      'The PRESET key jumps to 0°, 90°, 180°, 270° or 360°.',
      'If your dock shows the HEAR key, pick HEAR ALIGNED — 220 / 220 Hz, HEAR DRIFTING — 220 / 222 Hz, or STOP. These are two real tones, one in each channel (left and right).',
      'PHASE and PRESET change only the drawing. The HEAR tones don’t follow them.',
    ],
    changes: [
      'At 0° (or 360°) every push meets a push: the sum is twice as tall. SUM reads ALIGNED.',
      'At 180° every push meets an equal pull: the sum is flat, silence from two sounds. SUM reads CANCELED.',
      'In between, SUM reads PARTIAL. At 90° the sum is about 1.4× one wave. Past 120° it’s smaller than either, shrinking toward flat near 180°.',
      'DRIFTING tones 2 Hz apart slip in and out of step twice a second: you hear beating.',
    ],
    teaches: [
      'Phase is where a wave is in its cycle, in degrees. On its own you can’t hear it; it matters when two copies meet.',
      'Aligned copies add; opposed copies cancel.',
      'This is the root of comb filtering, the hollow sound of two copies arriving slightly apart, in mic pairs and subwoofer placement.',
    ],
    tryThis: [
      'Tap PRESET 0°. SUM reads ALIGNED, and the bottom wave is twice as tall as either input.',
      'Tap PRESET 180°. SUM reads CANCELED and the bottom line goes flat and red, while both inputs keep moving.',
      'With HEAR in your dock, pick HEAR DRIFTING — 220 / 222 Hz. OUT reads 220/222 and the phone speaker swells and fades twice a second. On headphones the tones never mix in the air, so it’s much fainter.',
    ],
  },

  // ── Module 11 · HARMONICS ────────────────────────────────────────────────
  m11: {
    intro: {
      learning: 'Timbre is a recipe: a fundamental plus harmonics at whole-number multiples, each with its own level. Harmonics change a tone’s color, not its pitch.',
      start: 'Select H2 and pull H2 LEVEL to 0 %. Watch the SUM change shape but keep its rate. Then press PLAY if your dock shows it.',
    },
    seeing: [
      'Six sine layers, from H1 (the fundamental, the lowest) at the bottom up to H6, with their SUM below. Each row’s color shows its level.',
      'Every layer is a whole-number multiple of 220 Hz: H2 = 440, H3 = 660 … H6 = 1320.',
      'F0 is the fundamental (220 Hz). SEL is the harmonic you’ve selected and LEVEL is its level. TONE shows when sound plays.',
    ],
    control: [
      'Tap H1–H6 on the HARMONICS key to select one (amber = selected, lit = on). Long-press one for its guided-lesson entry.',
      'The level lane takes the selection’s name (H1 LEVEL, H2 LEVEL…) and runs 0–100 %. You start with H1 100 %, H2 50 %, H3 33 % and the rest off.',
      'If your dock shows PLAY, tap it to hear the stack as additive synthesis (a tone built by adding sines). You hear every change live.',
    ],
    changes: [
      'Adding a harmonic changes the shape of each cycle, the timbre (tone color), not the pitch.',
      'While H1 is on, every layer fits inside its 220 repeats a second, so the pitch stays at 220 Hz. With only H2 up, the SUM repeats 440 times a second: an octave up.',
      'Stronger upper harmonics make a brighter, edgier tone. Fewer make it purer.',
    ],
    teaches: [
      'Timbre is a recipe: a fundamental plus harmonics, each with its own level.',
      'That’s why a piano and a trumpet playing the same note sound different.',
      'Harmonics sit at whole-number multiples of the fundamental, so adding them changes the tone’s color while the pitch stays put.',
    ],
    tryThis: [
      'Select H2 and pull its level to 0 %. The SUM changes shape and loses its lopsided lean, but it still repeats at the same rate.',
      'Select H4 and raise it to about 50 %. Then press PLAY if your dock shows it. The tone thickens, but the pitch stays put.',
      'With PLAY on, take every layer but H1 to 0 % (H2, H3, and H4 if you raised it). You hear the bare 220 Hz fundamental: a pure sine.',
    ],
  },

  // ── Module 12 · THE FOURIER PRINCIPLE ────────────────────────────────────
  m12: {
    intro: {
      learning: 'Any repeating wave is a sum of sines at whole-number multiples of its repeat rate. So every sound has two descriptions: its waveform and its spectrum.',
      start: 'Pick PURE on the RECIPE key and ride UNMIX up. Then pick HOLLOW (odd) and BRIGHT (all), and count the bars in the SPECTRUM.',
    },
    seeing: [
      'One wave (amber) being pulled apart into its sine ingredients (blue). The card of bars below is the SPECTRUM.',
      'Each bar is one ingredient: its place is its harmonic number, its height its strength. The bars hold still while the waves travel.',
      'RECIPE names the mix, UNMIX shows how far it’s separated (%), and F0 is the fundamental (220 Hz).',
    ],
    control: [
      'Move the UNMIX fader (0–100 % separated) to go from the mixed wave to its separate ingredients. It starts at 67 %.',
      'The RECIPE key picks PURE (fundamental only), HOLLOW (odd) (H1, H3, H5) or BRIGHT (all) (H1–H6). It starts on BRIGHT (all).',
      'If your dock shows PLAY, tap it to hear the recipe as additive synthesis (a tone built by adding sines). You hear a RECIPE change live.',
    ],
    changes: [
      'Raise UNMIX and the mixed wave fades, its ingredients separate onto their own lines, and the bars grow brighter.',
      'UNMIX adds and removes nothing. It shows what was always there.',
      'This is the Fourier principle: any repeating wave, however jagged, is a sum of sines at whole-number multiples of its repeat rate.',
    ],
    teaches: [
      'Every sound has two complete descriptions: the waveform (pressure over time) and the spectrum (which sines, and how strong).',
      'Spectrum analyzers and spectrograms do this unmixing live, on real sound.',
      'Missing harmonics, like the even ones in HOLLOW (odd), show up as gaps in the spectrum and give the tone a different timbre.',
    ],
    tryThis: [
      'Pick PURE and ride UNMIX up. One sine comes apart into just one ingredient and one bar.',
      'Pick HOLLOW (odd). You see three bars, with gaps where the even harmonics would be.',
      'Pick BRIGHT (all) and push UNMIX to 100 %. You get six ingredients and six bars, shorter as the harmonic number rises (the last two look the same height).',
    ],
  },

  // ── Module 13 · WHY MEASUREMENT TOOLS EXIST ──────────────────────────────
  m13: {
    intro: {
      learning: 'Ears estimate and meters measure. Which real tool answers which question about sound, and why dBFS is digital level, not loudness or SPL.',
      start: 'Read the cards below the display. Tap Waveform and say “ah”, then come back with ‹ and try the Frequency Counter & Tuner.',
    },
    seeing: [
      'An animated chain: a source, the air and a microphone. That’s the path every measuring tool listens to.',
      'Below the display, each card names a question the course raised and the real tool that answers it.',
      'The readout says CHAIN — SOURCE → AIR → MIC. The display is a model; the tools behind the cards measure real sound.',
    ],
    control: [
      'There’s nothing to set here. This module is for reading and choosing a tool.',
      'Tap a card to open that tool: SPL Meter, Frequency Counter & Tuner, RTA, Spectrogram, Waveform, RT60 or Signal Generator. Long-press a card for its guided-lesson entry.',
      'Tap the tool’s ‹ to come back. The course keeps your place.',
    ],
    changes: [
      'Nothing on this display reacts to settings. Each card swaps the model for a live measurement.',
      'Ears adapt, compare and tire; instruments hold steady. The meter gives you the number; the model explains it.',
      'Where a reading says dBFS · uncalibrated, it’s digital level that hasn’t been checked against a reference meter.',
    ],
    teaches: [
      'Measurement tools exist because ears estimate and meters measure.',
      'Each question has its tool: how loud, what frequency, what recipe, how it changes over time, what the pressure does, how long a room rings.',
      'dBFS is level inside the phone’s digital system. It isn’t loudness, and it isn’t SPL (sound pressure level in the air).',
    ],
    tryThis: [
      'Open Waveform and say “ah”. The live trace is Module 7’s MIC’S OUTPUT: real pressure at your phone’s mic, over time.',
      'Open the Frequency Counter & Tuner and hum one steady note. It reads your note in Hz.',
      'Open RTA and whistle. One band stands out: a single ingredient, as in Module 12.',
    ],
  },

  // ── Module 14 · THE FULL PLAYGROUND ──────────────────────────────────────
  m14: {
    intro: {
      learning: 'How the whole model fits together: a speaker moves, air squeezes and stretches, a graph describes it. Size, rate, recipe and phase each change something different.',
      start: 'Read YOU BUILT THE WHOLE MODEL, one line per module. Then answer the three CHECK YOURSELF questions before you read any explanation.',
    },
    seeing: [
      'Module 2’s three windows, SPEAKER, AIR and THE GRAPH, for one last look at the whole model.',
      'The readout says COURSE — COMPLETE — THE WHOLE MODEL.',
      'Below: YOU BUILT THE WHOLE MODEL (one line per module), three CHECK YOURSELF questions, then OPEN THE PLAYGROUND.',
    ],
    control: [
      'There’s nothing to set here. This module is for review.',
      'In CHECK YOURSELF, tap an answer to see why it’s right or wrong.',
      'OPEN THE PLAYGROUND (green, after the checks) opens the Sound Playground: the course’s main controls (level, frequency, waveform, harmonics, phase, polarity) on one screen.',
      'FINISH › on the strip opens the what’s-left screen. After the Playground comes Microphone Principles, where this model meets real microphones.',
    ],
    changes: [
      'In the Playground the course’s properties meet: size (amplitude), rate (frequency) and its spacing (λ), recipe (harmonics), phase and polarity.',
      'The three checks are contrasts: louder vs higher, time vs space, timbre vs pitch.',
    ],
    teaches: [
      'The whole model: a speaker moves, air squeezes and stretches, and a graph describes it.',
      'Size, rate, spacing, recipe and phase are separate properties of one sound, and each one changes something different.',
    ],
    tryThis: [
      'Answer all three CHECK YOURSELF questions before you read any explanation.',
      'Open the Playground and rebuild Module 4: move LEVEL and watch every view grow and shrink together.',
      'In the Playground, pick SAW, then FUNDAMENTAL under HARMONIC RICHNESS. It’s Module 11 in reverse: the harmonics go, and a pure sine is left.',
    ],
  },
};

/** Module 7 BEFORE the learner calls it (the predict-first cover): never
 *  gives the answer away — the screen hides its own reading until then. */
export const FOUNDATIONS_M7_COVER_GUIDE: ScreenGuide = {
  intro: {
    learning: 'What the wavy line on every recording screen really describes. Calling your answer before you check it helps a wrong idea give way to the right one.',
    start: 'Read the question on the display. Say your answer out loud, and why. Then tap TIME or SPACE.',
  },
  seeing: [
    'Before the display opens, it asks you one question about the wavy line every recording screen shows.',
    'There are two answers on the display: TIME (earlier → later) or SPACE (one place → another).',
    'Answer first. The text below the display opens once you do.',
  ],
  control: [
    'Tap TIME or SPACE on the display. Either answer opens the full display. A wrong guess is fine, and nothing is scored.',
    'The dock already works: PROBE, FREEZE, FREQ (110 Hz or 220 Hz) and PLAY.',
  ],
  changes: [
    'Your answer opens two graphs of one wave and the text that explains them.',
    'Calling it first, then checking, is how a wrong idea gets replaced by the right one.',
  ],
  teaches: [
    'One wave can be read in two different ways, and the two readings are linked.',
    'A wave you measured in meters, as a wavelength, can also be described another way.',
  ],
  tryThis: [
    'Say your answer out loud, and why, before you tap it.',
    'If your dock shows PLAY, press it first and listen while you decide.',
  ],
};

/** The course's what's-left screen (after FINISH › on Module 14). */
export const FOUNDATIONS_END_GUIDE: ScreenGuide = {
  intro: {
    learning: 'A review of the whole course: one sound, air squeezing and stretching, described by its size, rate, wavelength, pitch, loudness, phase and harmonics.',
    start: 'Look at the modules still listed at the top and tap one to open it. Tap REVIEW ▾ to see the ones you’ve already opened.',
  },
  seeing: [
    'You’ve reached the end of Foundations of Sound. Any modules you haven’t opened yet are listed first.',
    'Modules you’ve already opened read CREDITED (DONE when you aren’t signed in). Tap REVIEW ▾ to list them.',
  ],
  control: [
    'Tap any module row to jump straight to it.',
    'Tap PRACTICE AGAIN FROM THE START to go back to Module 1.',
    'DONE · BACK TO LABS leaves the lab. ‹ PREV on the strip returns to Module 14. Next in Audio Fundamentals: the Sound Playground, then Microphone Principles.',
  ],
  changes: [
    'A module counts once you open it, so the list shrinks as you visit.',
    'Going back to practice or review never undoes a module you’ve already opened.',
  ],
  teaches: [
    'Every module adds one property to the same picture of sound: size, rate, spacing, pitch, loudness, phase and recipe.',
    'One sound can be described in several ways: by its waveform, its wavelength and its spectrum.',
  ],
  tryThis: [
    'Reopen Module 7 and drag the PROBE again: one wave, two rulers.',
    'Tap PRACTICE AGAIN FROM THE START and notice how much faster Module 1 reads now.',
  ],
};

/** The Sound Playground (route FoundationsPlayground) — one screen. */
export const PLAYGROUND_SCREEN_GUIDE: ScreenGuide = {
  intro: {
    learning: 'How every property from the course acts on one sound at once, and which changes you can hear and which you can only see.',
    start: 'Note λ at 290 Hz, then slide FREQ to about 580 Hz. Next, pick SQUARE in the SOURCE tray and count the lines in the SPECTRUM.',
  },
  seeing: [
    'The course’s core views together: a speaker cone and its air on top, then WAVEFORM — PRESSURE VS TIME and SPECTRUM — LOG 40 Hz–16 kHz. During a sweep those two pause; watch the air and LEVEL.',
    'The L–R strip at the bottom shows STEREO BALANCE (BAL CENTER to start).',
    'Readouts follow SOURCE: FREQ, λ, PERIOD and LEVEL (dBFS) for a wave; SWEEP or CONTENT for a sweep or noise.',
  ],
  control: [
    'FREQ fader: 55 Hz–3.5 kHz, starting at 290 Hz. LEVEL fader: −48 to −16 dBFS, starting at −38.',
    'SOURCE tray: SINE, SQUARE, SAW or TRIANGLE; WHITE, PINK or BROWN NOISE; SLOW SWEEP or FAST SWEEP. For a wave you also get HARMONIC RICHNESS (ALL HARMONICS, FIRST 3, FUNDAMENTAL) and PHASE · POLARITY.',
    'FX tray: STEREO BALANCE, DELAY (DELAY OFF, 30 ms, 120 ms, 400 ms) and EQ LOW-PASS (EQ OFF, LPF 2 kHz, LPF 500 Hz). Q 0.7 or Q 4 work once a low-pass is on.',
    'PLAY / STOP: you hear every change live, after a hearing reminder. Long-press any control for its guided-lesson entry.',
  ],
  changes: [
    'Raise FREQ: shorter λ and PERIOD, tighter air spacing, more WAVEFORM cycles; the SPECTRUM line moves right.',
    'SQUARE, SAW and TRIANGLE add harmonics (lines). A low-pass shortens lines above its cutoff, more the farther above; Q 4 adds a peak there.',
    'On one source, PHASE and POLARITY move the WAVEFORM but can’t be heard. Noise has no pitch: a smooth SPECTRUM, flat for WHITE, sloping for PINK, steeper for BROWN.',
  ],
  teaches: [
    'Every property from the course acts on one sound at once, and only some of them change what you hear.',
    'LEVEL is in dBFS (digital level): it’s the level you set, not a measured sound level. DELAY is heard but not drawn.',
    'Flipping polarity turns one sound’s wave upside down with no audible change. It matters only when two copies meet.',
  ],
  tryThis: [
    'Note λ at 290 Hz (1.18 m). Then slide FREQ to about 580 Hz: λ reads about 0.59 m. Double the frequency, half the wavelength.',
    'Pick SQUARE. The SPECTRUM shows 6 lines (odd harmonics only). Tap FIRST 3: only 2 remain, and the WAVEFORM’s corners round off.',
    'Press PLAY and flip POLARITY + to POLARITY −. The WAVEFORM turns upside down, but the sound doesn’t change.',
  ],
};
