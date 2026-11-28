/**
 * Lab Common Mistakes ON A GLOSSARY CARD (owner-approved 2026-11-23; Comp A
 * brief 2026-11-24).
 *
 * A glossary card for a lab-taught term shows that lab's Common Mistakes under
 * "COMMON MISTAKES · [lab name] LAB". 56 of the 175 lines only make sense
 * inside the lab: they name a control, a preset or a readout on the lab's own
 * screen ("FDBK here stops at 75%", "like this lab's noise"). Those lines are
 * hidden ON GLOSSARY CARDS ONLY, and the section ends with one plain line
 * that says where the rest are.
 *
 * ⛔ Nothing in guidedLessons/content.ts is edited or removed: the labs keep
 * showing all 175 lines. The match is on the EXACT string, never a position,
 * so a later wording edit in content.ts fails
 * test/glossaryHiddenLabMistakes_20261124.test.ts instead of silently
 * showing the line again.
 *
 * PURE ON PURPOSE (a type import only), so node tests read it directly.
 */
import type { LabId, LabLesson } from './types';

export const GLOSSARY_HIDDEN_LAB_MISTAKES: Readonly<Partial<Record<LabId, readonly string[]>>> = {
  eq: [
    '“GAIN sets how much a HIGH-PASS cuts.” A pass filter has no gain. It removes one end at a fixed slope, a rate: this HIGH-PASS falls a steady 12 dB per octave below FREQ.',
  ],
  delay: [
    '“More feedback just adds a few repeats.” Near 100% each repeat is nearly as loud as the last, and past it they build up and run away. FDBK here stops at 75%.',
    '“Full-range repeats sound clearer.” Bright repeats keep all their edge, so they compete with your dry sound. With REPEAT DAMPING they lose their highs as they fade, the way echoes do in a real space.',
    '“A wide stereo delay is always safe.” Very short time offsets between left and right cause comb filtering, the notches you saw in Wave Physics, and thin the sound in mono. Always mono-check.',
  ],
  reverb: [
    '“A long tail suits everything.” On fast, busy parts each tail overlaps the next notes and turns to mush. At RT60 6.0 s here, the tails pile up between clicks.',
  ],
  flanger: [
    '“100% wet is just more flange.” The deep notches need your dry sound to cancel against. At MIX 100% with FDBK 40% only small ripples remain; the classic flange sits at 50% EVEN.',
    '“A faster RATE gives a bigger jet.” At 5 Hz WARBLE the sweep blurs into a wobble. The moving notches are easiest to hear at slow rates like 0.2 Hz JET.',
  ],
  phaser: [
    '“Any sound shows off a phaser.” A single steady tone has one frequency, so the dips have almost nothing to carve. Sounds with many frequencies, like this lab’s noise, reveal the sweep.',
  ],
  compression: [
    '“A compressor turns everything down.” Watch GR when the sound never reaches THRESH: it reads 0.0, because the line was never crossed.',
  ],
  gate: [
    '“Full silence between hits is cleanest.” Gating all the way down is easy to hear and strips out the room and the sustain. A partial RANGE, like −20 dB GENTLE, often sounds more natural.',
  ],
  limiter: [
    '“Every limiter stops every peak.” Without lookahead, a sharp hit can rise past the ceiling before the limiter reacts. This lab has none, so a click can slip a few dB past.',
  ],
  distortion: [
    '“More drive just means more distortion.” Drive also raises level, and louder often sounds better. At DRIVE +12 dB on HARD (FLAT TOPS) the wave is just louder and still round. Match levels, then judge.',
    '“Oversampling is a setting you can ignore.” Distortion can create harmonics past half the sample rate (Nyquist). This lab’s 220 Hz sine reaches Nyquist only near its 109th harmonic, so its aliasing is faint.',
    '“Bitcrushing and lowering the sample rate are the same.” Fewer bits makes coarser level steps: quantization noise. A lower sample rate brings aliasing. You met both in Digital Audio Systems.',
    '“An uneven bend is harmless.” Asymmetric TUBE (LOPSIDED) shaping shifts the wave off center (DC offset). It wastes headroom, the space left before clipping, and can click; a high-pass after the shaper removes it.',
  ],
  noise: [
    '“The colors are just names.” Each is a slope: WHITE 0, PINK −3, BROWN −6, BLUE +3 and VIOLET +6 dB per octave. Read SLOPE as you switch, then listen.',
    '“Colors at the same level sound equally loud.” Sent at the same OUT level, they still differ in loudness, because your ear is more sensitive in the mids than at the extremes.',
    '“If it sounds clean, there’s no noise.” Every system has a noise floor: the hiss left when nothing plays. SNR (signal-to-noise ratio) is how far your signal sits above it, as in Gain Staging.',
  ],
  phase: [
    '“Upright and flat lines mean the same on any scope.” On this scope, turned 45°, upright is in phase (+1), flat is anti-phase (−1), a ball is wide. A plain X-Y scope uses the diagonals.',
  ],
  harmonic: [
    '“You can read the timbre from the wave’s shape.” The shape can mislead: the outline depends on where each harmonic starts in its cycle, which your ear barely follows. Judge tone color by the bands.',
    '“Turning a sound up adds harmonics.” New harmonics come from reshaping the wave, as the clip recipes do. Level alone leaves the shape as it was.',
    '“A square wave has perfect corners.” That needs endless odd harmonics. With only twelve, as here, the corners ripple. Digital synths limit harmonics too, or the extra ones alias: fold back to wrong frequencies.',
  ],
  oscillator: [
    '“Square and triangle sound alike: both hold only odd harmonics.” They fall at different rates. A square’s bar 3 is 1/3 of bar 1; a triangle’s is 1/9, so it sounds far softer.',
    '“A digital oscillator can make every harmonic.” Digital audio can’t hold anything above Nyquist (half the sample rate); a harmonic past it lands at a wrong frequency. Band-limited oscillators, like this lab, leave those out.',
    '“The phone speaker plays the whole wave.” A phone speaker can’t reproduce deep bass: at F0 110 Hz it takes about 6.5 dB off bar 1, so you mostly hear the harmonics.',
  ],
  stereo: [
    '“Wider is always better.” Past 100% the SIDE is louder than recorded. Headphones flatter it, so check MONO CHECK and CORRELATION before you trust it.',
    '“PAN moves the whole sound to one side.” Here PAN is a balance control: at L it mutes the right channel and lifts the left 3 dB. The right side’s content is gone, not moved.',
  ],
  harmonograph: [
    '“A bigger swing changes the pattern.” Swing size, called amplitude, only makes the figure bigger or stretches it. The speed ratio between OSC 1 and OSC 2 sets the pattern.',
    '“A new figure means a new interval.” Changing PHASE turns or reshapes the figure, but RATIO and INTERVAL stay the same. Only the speed ratio changes the interval.',
    '“More DAMPING makes a better drawing.” Damping is how fast the swings die away. HEAVY fades after a few turns; LIGHT keeps going over many.',
    '“Watching the figure is enough.” Press ▶ and listen as well: the ratio that draws a steady, closed figure is the same ratio that sounds settled as two tones.',
  ],
  chain: [
    '“This rack’s order is the right order.” It runs COMP before GATE, but most engineers gate first. Compression lifts quiet noise, so the gate, which turns down quiet sound, becomes harder to set cleanly.',
    '“Compress after the reverb and delay.” A compressor reacting to echoes and reverb tails makes them pump, rising and falling in level. Time effects usually go after dynamics, as here, or on a parallel path.',
    '“Each stage sounds better, so the chain is fine.” Louder often just sounds better. Stack hot stages and several compressors and the sound gets squashed while LIMIT overworks. Watch GR at every stage.',
  ],
  bass: [
    'Thinking the 7th-fret note and the ⅓ harmonic are the same. Fretting there leaves about ⅔ of the string vibrating; touching the ⅓ point keeps the whole string. Compare their FREQ readouts.',
  ],
  autotune: [
    'Thinking SLOW — GLIDE corrects every note. Even on this 1.1 s note, 100% at SLOW still ends 3¢ off; a note a quarter as long would end much further from its line.',
    'Thinking the nearest line is always the right note. This grid has a line for every semitone, so a note bent between notes of the song’s key can be pulled outside the key.',
  ],
  fm: [
    '“More index makes every sideband louder.” Bessel heights rise and fall as the index grows. One stick can shrink, and at RATIO 1.41 ✳ the carrier almost disappears near I = 2.4.',
    '“If BW is under 24 kHz, nothing aliases.” BW (bandwidth) = 2 × MOD × (I + 1) is only an estimate. Weaker sticks reach past it, and any above 24 kHz (Nyquist) folds back.',
    '“A steady index is enough.” A fixed index gives a static tone that never changes. Brightness that falls after each strike, as PLUCK and BELL give, is what makes FM instruments sound alive.',
  ],
  binaural: [
    '“I can place a sound above me here.” Your outer ear (pinna) colors sound differently from each direction, measured per person as an HRTF (head-related transfer function). This sphere has no pinna.',
    '“A low sine is a fair test.” A steady low tone has no sharp start and, in real hearing, almost no level difference between the ears, so it places vaguely. Judge with PINK or WHITE.',
    '“A sound behind me should be obvious.” A sphere gives the same delay front and back: +30° and +150° both read 261 µs. Behind only darkens a little, so your brain has to guess.',
    '“Binaural is just stereo panning.” PAN in Stereo Imaging changes level only. Binaural adds the time and shadow cues your ears really use.',
  ],
  modular: [
    'Blaming the LFO rate when an effect sounds wrong. The same LFO does a different job at each destination, so check where the blue cable goes first. At DEPTH 0 it does nothing.',
    'Thinking every cable carries sound. The red, blue and green cables carry control voltage: they turn a setting on another module. Only the amber cables carry audio you hear.',
  ],
  foundations: [
    '“The drawing shows air at its real speed.” Every animation of sound is slowed: one 440 Hz cycle lasts about 2.3 ms. In Module 1, MODEL reads 1.31 Hz while FREQ reads 880 Hz.',
    '“Same amplitude, same loudness.” Your ear is far less sensitive to lows. In Module 9, a tone sent at −37 dB is heard about 24 dB quieter at 80 Hz than at 1 kHz.',
  ],
  mic: [
    'Singing past the capsule only lowers the level. Highs fall faster than lows, so the voice turns dull too: at 90° the screen shows 8 kHz dropping 3 dB more than 100 Hz.',
  ],
  speaker: [
    'Choosing a wide pattern for a deep room. Width is not throw: a wide box spreads its power, so it’s quieter at every distance and the rear rows stay blue.',
    'Turning the whole system up to fix a black or blue patch. Everywhere else gets louder first. Aim, height, fills or a delay speaker fix the geometry instead.',
  ],
  tube: [
    'Expecting tube gear to sound right the moment it’s on. Watch PLATE I while you slide WARM-UP: it stays at 0% until the heater has done its job.',
    'Hearing tube saturation as the same as hard clipping. Compare the peaks at DRIVE past 70% with the flat tops of hard clipping in Distortion, and listen for the harmonics each adds.',
  ],
  cymatics: [
    'Expecting the figure to morph smoothly as you ride FREQ. It snaps in near a mode and dissolves between modes, where RES reads BETWEEN and the sand only shivers.',
    'Expecting a shaken liquid to ripple at the drive frequency. Once a pattern forms, compare RESP with the drive frequency.',
  ],
  meter: [
    '“It sounds wide and huge, so it’s fine.” With correlation near −1, a mix can cancel on a mono PA or a phone. Below +0.5 on the CORRELATION bar, check it in mono.',
  ],
};

/** The lab's Common Mistakes a glossary card shows: the lab's own list, in its
 *  own order, without the lines above. */
export function glossaryLabMistakes(lesson: Pick<LabLesson, 'id' | 'commonMistakes'>): string[] {
  const hidden = GLOSSARY_HIDDEN_LAB_MISTAKES[lesson.id];
  const all = lesson.commonMistakes ?? [];
  return hidden ? all.filter((s) => !hidden.includes(s)) : [...all];
}

/** The plain line that closes the section on a glossary card (owner's words,
 *  2026-11-23). */
export function glossaryLabMistakesClosing(labName: string): string {
  return `More common mistakes for this topic are in the ${labName} lab.`;
}
