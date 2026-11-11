/**
 * Digital Audio Sampling & Conversion Lab — "explain this screen" content
 * (owner 2026-10-31, Screen Guide rollout after the Wave Physics pilot). One
 * guide per module (keyed by DigitalModuleId), one for the lab home and one
 * for the what's-left screen (reached from the home's SEE WHAT'S LEFT and
 * from FINISH on the last module).
 *
 * Every line was written against the module's own code (modAnalog / modQuant
 * / modChain / modDac and the viz files): names are the on-screen names
 * (bezel keys, dock labels, tray options, labels drawn on the display), and
 * every number quoted in TRY THIS is what the module prints at that setting
 * (default state unless the step says otherwise). Change a module's labels,
 * ranges or defaults → update its guide here;
 * test/screenGuide_digital_20261031.test.ts pins the shape.
 *
 * STEPPED: each section is one step and must fit a 375×812 phone with no
 * scrolling — SCREEN_GUIDE_BUDGET (types.ts) holds every section.
 *
 * Copy rules: plain language, short sentences; claims KNOWLEDGE, never
 * skills; no gear brand names; no "N of total"; "suggest" never "recommend";
 * no build notes in learner text.
 */
import type { ScreenGuide } from '../../../features/lab/screenGuide/types';
import type { DigitalModuleId } from './modules/registry';

export const DIGITAL_HOME_GUIDE: ScreenGuide = {
  intro: {
    learning: 'How sound becomes numbers and back again: sampling measures the wave in time, bit depth measures its level, and a converter rebuilds a smooth wave from the numbers.',
    start: 'Read the top row from SOUND to SOUND: that’s the whole chain. Then tap the first module’s name to read what it covers, and tap OPEN to start it.',
  },
  seeing: [
    'Read the top row left to right. It’s the whole chain: SOUND › ANALOG › SAMPLES › NUMBERS … › LOUDSPEAKER › SOUND.',
    'THE EIGHT MODULES lists the lab in order, one row each. A ✓ marks a module you’ve opened.',
    'SECONDARY TOOLS and LEARNING are shortcuts into a module or a calculator, and to the GUIDED LESSON.',
    'The level, float and jitter scenes are illustrations for comparing settings.',
  ],
  control: [
    'Tap a module’s name to read what it covers. Tap OPEN to start it.',
    'Tool chips jump straight in: SAMPLE INSPECTOR opens Module 4, ALIASING EXPLORER Module 2, DITHER COMPARATOR Module 3, TRUE-PEAK EXPLORER Module 7, CLOCK & JITTER Module 8.',
    'DATA-RATE CALCULATOR, BUFFER LATENCY CALC and FFT RESOLUTION CALC open their calculators. MYTH vs REALITY and KNOWLEDGE CHECKS both open Module 8. Every module also has its own checks at the bottom.',
    'In a module, the display is on top with readouts on its frame, and the controls sit in the dock below. Scroll down for notes and checks. Tap ⓘ beside the title to have the screen explained.',
    'SEE WHAT’S LEFT lists the modules you haven’t opened. ‹ leaves the lab.',
  ],
  changes: [
    'Modules 1–2 start with the analog signal, then measure it in time: sampling, Nyquist and aliasing.',
    'Modules 3–4 measure it in level: bit depth and dither, then the binary numbers that get stored.',
    'Modules 5–6 put the converter chain together with gain staging, then compare fixed and floating point.',
    'Modules 7–8 rebuild a smooth wave from the numbers, then cover jitter, clocking and the myths.',
  ],
  teaches: [
    'Time and level are measured separately: sample rate sets bandwidth, bit depth the noise floor.',
    'Digital audio is not stair steps. The DAC (digital-to-analog converter) and its filter rebuild a smooth wave.',
    'Clipping at or before the converter is permanent; no later fader undoes it.',
    'Sample, bit and true-peak numbers are exact math.',
  ],
  tryThis: [
    'New to digital audio? Take the modules in order: each one uses the last. The lab builds on the Sound and Acoustics labs.',
    'After Module 1, open Module 2 and sweep FREQ past NYQUIST. Watch READS AS turn red: that’s an alias, a false lower tone the samples describe.',
    'Finish with the MYTH vs REALITY panel in Module 8 and see which myths you believed before you started.',
  ],
};

/** The what's-left screen (LabEndScreen) — home and last-module FINISH. */
export const DIGITAL_END_GUIDE: ScreenGuide = {
  intro: {
    learning: 'A review of the digital chain: measuring time, measuring level, conversion, rebuilding the wave and timing errors, and which of these ideas you still have to explore.',
    start: 'Read the list to see which modules you haven’t opened yet. Tap the first row to open it, or tap REVIEW ▾ to go back to a module you’ve already opened.',
  },
  seeing: [
    'This is WHAT’S LEFT: the modules of this lab you haven’t opened yet. When none are left, the title reads LAB COMPLETE.',
    'The modules you’ve opened fold into one ✓ CREDITED row (✓ DONE if you’re not signed in). Tap REVIEW ▾ to list them.',
  ],
  control: [
    'Tap a module’s row to open it.',
    'PRACTICE AGAIN FROM THE START opens Module 1. Your ✓ marks stay as they are.',
    'DONE · BACK TO LABS goes back one screen. If you came from FINISH on Module 8, it takes you to the lab menu. If you came from the menu, it takes you out of the lab.',
  ],
  changes: [
    'A module counts as done as soon as you open it, and its row moves from the list into the ✓ row.',
    'If your progress can’t be loaded, the title reads YOUR PROGRESS and every module stays listed and open.',
  ],
  teaches: [
    'The digital chain in order: measure the wave in time (sampling), measure it in level (quantization), convert it, rebuild a smooth wave, then handle timing errors such as jitter.',
    'How sample rate, bit depth and clipping at the converter each set a limit on what a recording can hold.',
  ],
  tryThis: [
    'Open the first module on the list and work down in order. Each module uses the ideas of the one before it.',
    'Tap REVIEW ▾, reopen a module you found hard and try its checks at the bottom again.',
  ],
};

export const DIGITAL_SCREEN_GUIDES: Record<DigitalModuleId, ScreenGuide> = {
  // ── 1 ─────────────────────────────────────────────────────────────────────
  analog: {
    intro: {
      learning: 'What exists before any number: air pressure moves a mic diaphragm, which makes a continuously varying voltage with its own frequency, period and level.',
      start: 'Slide FREQ up and watch PERIOD shrink. Then open WAVE, switch from SINE to SQUARE, and compare PEAK with RMS.',
    },
    seeing: [
      'You’re watching one sound three ways, slowed down. A SPEAKER pushes the air (PRESSURE →), a MIC diaphragm rides it, and its CONTINUOUS VOLTAGE → is drawn at right.',
      'The trace runs from +1.0 to −1.0. Its color shows loudness: blue is quiet, red is full scale.',
      'FREQ and PERIOD (one cycle’s time) show pitch. PEAK and RMS (average strength) show level in FS (full scale): fractions of the converter’s max (1.0).',
    ],
    control: [
      'FREQ fader (60–2000 Hz) sets the pitch of the source. It locks on WHITE NOISE, because noise has no single frequency.',
      'AMP fader sets the level, 0.12 to 1.00 ×FS. ZOOM fader shows from 7 cycles down to 1.',
      'WAVE key: SINE, SQUARE, TRIANGLE, SAW, IMPULSE or WHITE NOISE. Each comes with a note on how hard it is to capture.',
      'MODS key: POLARITY Ø INVERT flips the voltage; ADD NOISE and ADD DISTORTION dirty the signal before it ever reaches a converter.',
      'Long-press FREQ, AMP, ZOOM, WAVE or MODS for its guided-lesson entry.',
    ],
    changes: [
      'Raise FREQ and PERIOD shrinks (PERIOD = 1 ÷ FREQ), and the picture runs faster. Only ZOOM sets how many cycles show.',
      'AMP moves PEAK and RMS together; the shape sets the gap: a sine’s RMS is 0.71 × PEAK.',
      'SQUARE, SAW and IMPULSE have sharp edges: many high harmonics, the hardest content to capture.',
      'POLARITY Ø INVERT flips only the voltage. Air and diaphragm move as before; the wire carries the mirror image.',
    ],
    teaches: [
      'Before any converter, sound is a continuously varying voltage: an analog of the air pressure.',
      'No numbers exist yet. A microphone makes a voltage, not ones and zeros.',
      'Frequency, period and level are what the converter has to capture.',
      'PEAK is the highest point; RMS tracks its energy. Two waves with the same peak can carry very different energy.',
    ],
    tryThis: [
      'Slide FREQ to the top: 2000 Hz, PERIOD 0.50 ms. Slide it to the bottom: 60 Hz, PERIOD 16.67 ms.',
      'Switch WAVE from SINE to SQUARE: PEAK stays 0.75 FS, RMS rises from 0.53 to 0.63 FS. This square has a limited set of harmonics; a perfect square’s RMS would equal its PEAK.',
      'Pick IMPULSE: PEAK is still 0.75 FS, but RMS falls to 0.15 FS. One sharp spike carries very little energy.',
    ],
  },

  // ── 2 ─────────────────────────────────────────────────────────────────────
  sampling: {
    intro: {
      learning: 'Sampling measures a wave at regular moments. Below Nyquist (half the sample rate) the samples capture it fully; above it, it folds down as a false lower tone, an alias.',
      start: 'At 48k, push FREQ past NYQUIST and watch READS AS turn red. Then open ALIAS and tap PLAY INPUT, then PLAY PREDICTED ALIAS, to hear the fold.',
    },
    seeing: [
      'The amber sine is the INPUT — CONTINUOUS. Each white dot is one sample, a single measurement. The green line is the sample clock.',
      'Push the input above Nyquist and it dims (TRUE INPUT (DIM) — ABOVE NYQUIST). A red ALIAS curve shows the lower tone the same dots fit.',
      'Readouts: FS (here the sample rate, not full scale), INPUT, NYQUIST (half of FS) and READS AS, the frequency the samples really describe.',
    ],
    control: [
      'FREQ fader sets the input, from 100 Hz up to 30 kHz at 48k. From 8k to 48k it can cross NYQUIST; at 96k and 192k it stops below it. ZOOM fader goes from single samples to many cycles.',
      'RATE key: 8k to 192k, or demo rates of 4, 3, 2.5, 2 or 1.7 /CYC (samples per cycle). RECONSTRUCTED · ON draws the curve through the dots.',
      'ALIAS key: PLAY INPUT and PLAY PREDICTED ALIAS let you hear the fold. It also holds the ANTI-ALIASING FILTER: FILTER OFF, FILTER ON, 12, 24 or 48 dB/OCT.',
      'CUTOFF fader sets where the filter starts to roll off. It’s locked while the filter is off.',
    ],
    changes: [
      'Below NYQUIST the dots follow the input, so READS AS equals INPUT.',
      'Above it, the same dots fit a lower sine exactly. READS AS turns red and shows where the input folds: the gap from INPUT to the nearest FS multiple.',
      'A higher FS raises NYQUIST. That buys more bandwidth, not a smoother wave.',
      'The filter turns content above CUTOFF down BEFORE sampling, so less can fold. Once sampled, an alias can’t be removed.',
    ],
    teaches: [
      'Sampling measures the wave in time. Below Nyquist, the samples describe it completely.',
      'Nyquist is half the sample rate. Anything above it folds down as an alias: a tone that wasn’t in the original.',
      'The anti-aliasing filter must sit before the converter, because afterward an alias can’t be told apart from real sound.',
      'A tone needs more than 2 samples per cycle. With fewer, the dots fit a lower tone.',
    ],
    tryThis: [
      'At 48k, push FREQ to the top: INPUT reads 30 kHz and READS AS 18 kHz in red (48 − 30).',
      'Then open ALIAS, tap FILTER ON and pull CUTOFF to the bottom (7.2 kHz). The label becomes ALIAS REMOVED; READS AS still shows where it would have folded.',
      'In RATE, pick 1.7 /CYC, under 2 samples per cycle: READS AS turns red at 0.7 × INPUT.',
    ],
  },

  // ── 3 ─────────────────────────────────────────────────────────────────────
  quant: {
    intro: {
      learning: 'Quantization rounds each sample to the nearest level step. Bit depth sets how many steps exist, and so the noise floor; dither turns rounding distortion into gentle, steady noise.',
      start: 'Switch BITS from 4-BIT to 16-BIT and watch LEVELS and TH. SNR jump. Then set 8-BIT, turn ERROR on, and pull LEVEL down below −24 dBFS.',
    },
    seeing: [
      'Two cycles of a sine and the level grid it must round to. AMBER = ORIGINAL · BLUE = SAMPLED · GREEN = STORED/RESULT · RED = ROUNDING ERROR.',
      'Up to 4 bits you can see every level line. Above that, there are so many that they merge into a fine band.',
      'Readouts: BITS, LEVELS, TH. SNR (theoretical signal-to-noise ratio) and PEAK (the sine’s level).',
    ],
    control: [
      'LEVEL fader (−40 to 0 dBFS, decibels below full scale) sets the sine’s peak level. It starts at −12.',
      'BITS key: 1, 2, 3, 4, 6, 8, 12, 16 or 24-BIT, each with a note on where it was used. It starts at 4-BIT.',
      'ERROR toggle shows only the rounding error, zoomed so ±½ step fills the panel.',
      'DITHER key: NO DITHER, RPDF (flat random noise), TPDF (the standard dither) or NOISE-SHAPED (its noise moved up to where hearing is least sensitive). It drives the dither panel below the display.',
    ],
    changes: [
      'Each extra bit doubles LEVELS (2 to the power of the bits) and adds about 6 dB of TH. SNR (6.02 × bits + 1.76 dB).',
      'The error is never more than half a step, so on a quiet sine it’s a big part of the signal.',
      'At low levels the error follows the signal: distortion, not hiss. Dither adds a little noise first, giving a steady, gentle floor.',
      'Bits change level resolution only, never frequency response.',
    ],
    teaches: [
      'Quantization measures level in steps; bit depth sets how many.',
      'More bits lower the noise floor: in theory 16-bit ≈ 98 dB SNR, 24-bit ≈ 146 dB. The BITS list’s ~96 and ~144 dB use the 6-dB-per-bit rule of thumb. Real converters reach less.',
      'Why dither is used when bit depth is reduced: steady noise is gentler than distortion.',
      'Quiet passages suffer most from too few bits: the error stays the same size.',
    ],
    tryThis: [
      'Switch BITS from 4-BIT to 16-BIT: LEVELS jumps from 16 to 65,536, and TH. SNR from ≈25.8 dB to ≈98.1 dB.',
      'Set 8-BIT, turn ERROR on, and ride LEVEL from −12 to below −24 dBFS. The note under the display changes to CORRELATED distortion.',
      'Pick TPDF in DITHER and scroll to the dither panel. The ERROR HISTOGRAM’s spikes spread out: the error is now random noise, no longer tied to the signal.',
    ],
  },

  // ── 4 ─────────────────────────────────────────────────────────────────────
  binary: {
    intro: {
      learning: 'A recording is a list of signed whole numbers, one per sample. Decimal, binary, hex and dBFS are different ways of writing the same value.',
      start: 'Move SAMPLE to #7 and read DECIMAL, HEX and LEVEL. Then move to #21 and compare. Below the display, tap the SIGN switch and watch the value change sign.',
    },
    seeing: [
      'This strip holds 28 stored samples (16-bit · 48 kHz). The one you’ve selected is marked.',
      'Readouts: SAMPLE (its number), DECIMAL (the stored whole number), HEX (the same number in base 16) and LEVEL (dBFS).',
      'Scroll below for TIME, BINARY, NORMALIZED and % OF FS, a two’s-complement table, and a register of 16 bit switches you can flip.',
    ],
    control: [
      'SAMPLE fader steps through the samples, #0 to #27. You can also drag across the strip itself.',
      'RESET REG key sets the register back to 0100 0000 0000 0000 (+16,384).',
      'Below the display, tap any of the 16 bit switches to flip it. Each one shows its weight; the MSB (top bit) reads SIGN.',
    ],
    changes: [
      'Every readout comes from one signed 16-bit whole number, just written in different ways.',
      'Negatives use two’s complement: the MSB is worth −32,768, so values run from −32,768 to +32,767.',
      'LEVEL = 20 × log10(|value| ÷ 32,768); |value| ignores the sign. Halve the value and LEVEL drops about 6 dB.',
      'A high bit moves the value a lot. The LSB (bottom bit) moves it by 1: one quantization step.',
    ],
    teaches: [
      'A recording is only a list of whole numbers, one per sample.',
      'How signed binary stores the negative half of a wave: the top bit carries a large negative weight.',
      'Decimal, binary, hex, normalized and dBFS are one value in different forms.',
      '16 bits give 65,536 possible values, and each one is a level step from quantization.',
    ],
    tryThis: [
      'Start on #7: DECIMAL 1,935, HEX 0x078F, LEVEL −24.6 dBFS. Move to #21: −1,935, 0xF871. Same level, opposite sign.',
      'Find #17, the loudest sample: DECIMAL 27,212 and LEVEL −1.6 dBFS.',
      'In the register, tap the SIGN switch: +16,384 (0x4000) becomes −16,384 (0xC000). The register’s own LEVEL stays −6.0 dBFS.',
    ],
  },

  // ── 5 ─────────────────────────────────────────────────────────────────────
  adc: {
    intro: {
      learning: 'How a converter turns a voltage into samples, block by block, and why gain is set before conversion: too low buries it in noise, too high clips it for good.',
      start: 'Pull INPUT to the bottom and watch ZONE read TOO LOW. Push it to the top for A+D CLIP. Then bring it back until ZONE reads RIGHT.',
    },
    seeing: [
      'A level scene: the wave between 0 dBFS (full scale) and the analog rail, above the noise floor, with ANLG and DIG meters.',
      'The strip reads TOO LOW · RIGHT · TOO HIGH; its marker shows where your level sits.',
      'Readouts: PEAK (recorded peak, dBFS), SNR, HEADROOM (room left below 0 dBFS) and ZONE.',
      'The noise floor here is far louder than a real converter’s, so use SNR to compare settings, not as a real figure.',
    ],
    control: [
      'INPUT fader (−54 to +12 dB) is the analog gain into the converter: the one knob in this scene.',
      'Below the display, THE CONVERSION CHAIN: tap a block to see its job, its input and output, and what its failure sounds like. SIMPLIFIED, STANDARD and X-RAY change the detail.',
      'Further down, SAMPLE & HOLD — WATCH ONE CELL WORK shows a sample being caught and held, slowed about 1000 times.',
    ],
    changes: [
      'More INPUT lifts PEAK and SNR together and shrinks HEADROOM: the signal climbs away from a noise floor that stays put.',
      'With INPUT just above 0 dB, the analog stage rounds the peaks (AN. CLIP). A little higher, the converter cuts flat tops (A+D CLIP).',
      'Here the preamp clips first. On most real interfaces, the converter reaches 0 dBFS first.',
    ],
    teaches: [
      'The path: mic, preamp, anti-aliasing filter, sample and hold, quantizer, encoder, then a PCM (plain stored samples) stream.',
      'Gain is set BEFORE conversion. Peaks of −12 to −6 dBFS, the average near −18, keep good SNR and headroom.',
      'Analog and digital clipping are separate events, and both are permanent.',
      'The filter stops aliases, the quantizer rounds to level steps, and the encoder writes the binary numbers.',
    ],
    tryThis: [
      'At the start (INPUT −14 dB): PEAK −14.5 dBFS, SNR 46 dB in this scene, ZONE RIGHT. Pull INPUT to the bottom: −54.0 dBFS, SNR 6 dB, TOO LOW.',
      'Push INPUT to the top (+12 dB): PEAK reads 0.0 OVER, HEADROOM none, ZONE A+D CLIP.',
      'Ease INPUT to between +1 and +1.8 dB: ZONE reads AN. CLIP while PEAK is still just below 0 dBFS. The damage happens before the converter.',
    ],
  },

  // ── 6 ─────────────────────────────────────────────────────────────────────
  processing: {
    intro: {
      learning: 'Why levels above 0 dBFS are safe while tracks are summed in floating point but clip in a fixed-point file, and how a float covers a huge range.',
      start: 'Compare FLOAT BUS and FIXED at the start. Turn TRIM on and see which side comes back intact. Then move VALUE to see how a float number is built.',
    },
    seeing: [
      'One mix bus (where tracks are summed), two fates. At left, the FLOAT INTERNAL PATH; at right, the FIXED-POINT RENDER (24-BIT) with its 0 dBFS line.',
      'Readouts: FLOAT BUS (the bus peak, dBFS), FIXED (0.0 CLIP once it’s over zero) and TRIM.',
      'Move VALUE and the display swaps to HOW A FLOAT NUMBER WORKS: SIGN, EXPONENT (decade), the power of ten, and MANTISSA (slides 1→10), the value within it.',
    ],
    control: [
      'GAIN fader sets the bus peak, −6.0 to +6.0 dBFS. It starts at the top.',
      'TRIM toggle turns the bus back down by the gain you added, before the output.',
      'VALUE fader picks one float number, from −3.9811 through nearly zero to +3.9811.',
      'Scroll below the display for the INTEGER vs FLOATING POINT range bars, the float panel, a check and the myths.',
    ],
    changes: [
      'Float has room above 0 dBFS: an over-zero peak is just a bigger number, so TRIM brings the wave back intact.',
      'Fixed point has no number above full scale, so everything over 0 dBFS is cut flat at the render. TRIM after that gives a quieter clipped wave.',
      'The exponent rescales the ruler, so float stores tiny and huge values. Here it counts in decades so you can read it; real floats use powers of two.',
    ],
    teaches: [
      'Integer (fixed-point) formats stop hard at 0 dBFS; floating point has an enormous range.',
      'Over-zero levels in a DAW (recording software) are safe only until a fixed-point stage, such as a 24-bit render. Trim first.',
      'Converting a clipped file to float does not repair it.',
      'A float number is a sign, a mantissa and an exponent: the exponent sets the scale, the mantissa the detail.',
    ],
    tryThis: [
      'At the start, FLOAT BUS reads +6.0 and FIXED 0.0 CLIP. Turn TRIM on (−12.0 dB): the float pane reads intact, the fixed pane is still clipped.',
      'Pull GAIN to the bottom: FLOAT BUS and FIXED both read −6.0. Below full scale, nothing clips.',
      'Ride VALUE through the middle: the SIGN flips while the EXPONENT steps by decades.',
    ],
  },

  // ── 7 ─────────────────────────────────────────────────────────────────────
  dac: {
    intro: {
      learning: 'How a DAC turns samples back into one smooth, continuous wave, not a staircase, and why the true peak between samples can be higher than any sample.',
      start: 'In LAYERS, turn off SAMPLES and ZOH and compare RECONSTRUCTED with ORIGINAL. Then push ISP FREQ to the top and move PHASE to see TRUE PK rise above SAMPLE PK.',
    },
    seeing: [
      'Samples rebuilt into a continuous voltage, slowed down. SAMPLES are the dots. ZOH (zero-order hold) is the dim held steps inside the converter. RECONSTRUCTED is the output; ORIGINAL is what was recorded.',
      'X-RAY adds DAC CLOCK ticks and a RECON LPF (low-pass filter) inset.',
      'Readouts: FS (48 kHz), MODE, LAYERS. Move ISP FREQ or PHASE for INTER-SAMPLE PEAKS: SAMPLE PK, TRUE PK (dBTP, true-peak dB), MISSED.',
    ],
    control: [
      'MODE key: SIMPLIFIED (samples and the rebuilt wave, no steps), STANDARD (adds the ZOH steps) or X-RAY (adds the DAC CLOCK ticks and the RECON LPF inset).',
      'LAYERS key turns SAMPLES, ZOH, RECONSTRUCTED and ORIGINAL on or off. SIMPLIFIED hides ZOH.',
      'OS RATE key: 1×, 2×, 4× or 8× oversampling. It drives the SPECTRAL IMAGES & OVERSAMPLING panel below.',
      'ISP FREQ (19.2–23.5 kHz) and PHASE (0–180°) faders set the near-Nyquist sine of the INTER-SAMPLE PEAK EXPLORER.',
    ],
    changes: [
      'RECONSTRUCTED passes through every dot and cuts smoothly through the steps, never along their flat tops or square edges. It lies on ORIGINAL.',
      'ZOH steps are a stage inside the converter, not the output.',
      'Oversampling moves the first spectral image up (near 384 kHz at 8×), so the analog filter can be gentle. It adds no information.',
      'Every sample can sit below 0 dBFS while the wave between them rises above.',
    ],
    teaches: [
      'Digital audio is not stair steps: a DAC and its filter output one continuous wave.',
      'More samples buy bandwidth, not smoothness.',
      'Why true-peak meters catch overs that sample-peak meters miss.',
      'Peaks hide most easily near Nyquist, where only about two samples fall on each cycle.',
    ],
    tryThis: [
      'In LAYERS, turn off SAMPLES and ZOH: RECONSTRUCTED and ORIGINAL sit right on top of each other.',
      'Push ISP FREQ to the top and set PHASE to 45°: TRUE PK reads about +2.9 dBTP and MISSED about 3 dB, while the samples are still at −0.10 dBFS.',
      'Keep ISP FREQ there and set PHASE to 90°: a sample lands on the crest, so TRUE PK reads −0.10 dBTP and MISSED 0.00 dB.',
    ],
  },

  // ── 8 ─────────────────────────────────────────────────────────────────────
  errors: {
    intro: {
      learning: 'What jitter is: a timing error in the sample clock that becomes a value error, biggest on steep slopes, and why one clock times a whole digital system.',
      start: 'Slide JITTER to the top and watch the whiskers grow on the steep parts of the wave. Then tap the JITTER key and switch JITTER MODE to PERIODIC.',
    },
    seeing: [
      'Two rows of clock ticks: IDEAL CLOCK, and WITH JITTER (EXAGGERATED), drawn 1000 times larger than real so you can see it.',
      'The whiskers on the wave show each value error: VALUE ERROR ≈ SLOPE × TIMING ERROR.',
      'Readouts: INTERVAL (20.83 µs @48k between samples), PEAK DEV (the largest timing error) and MODE.',
    ],
    control: [
      'JITTER fader sets the peak timing error, ±0.0 to ±8.0 ns. It starts at ±4.8 ns.',
      'Tap the JITTER key for JITTER MODE: RANDOM (each sample early or late by chance) or PERIODIC (the clock wobbles in a pattern).',
      'Scroll down for three panels: CLOCKING — ONE MASTER, THE REST FOLLOW, then MODULE 8 · MYTH vs REALITY, then DATA RATE — THE MENTAL MATH. The checks come after them.',
    ],
    changes: [
      'Jitter is a timing error, not rounding: the right voltage measured at the wrong moment is a wrong value.',
      'The error grows with how fast the wave changes: biggest on steep slopes, zero at flat peaks.',
      'RANDOM jitter spreads into a faint noise floor. PERIODIC jitter makes tones beside the signal, far easier to hear.',
      'Jitter matters only where a clock times a conversion (ADC / DAC). A file copy stays exact.',
    ],
    teaches: [
      'Jitter is a sample-clock timing error that matters at conversion.',
      'One device sets the clock for a whole digital system. The rest follow it: by a word-clock cable, by the clock carried in a digital audio signal (AES3 or S/PDIF), or by PTP timing on a network.',
      'Bit depth sets the noise floor, not high-frequency response.',
      'Real jitter is measured in nanoseconds or less: tiny next to the 20.83 µs between samples.',
    ],
    tryThis: [
      'Slide JITTER to the top: PEAK DEV reads ±8.0 ns and the whiskers grow on the steep parts of the wave.',
      'Slide JITTER to zero: PEAK DEV reads ±0.0 ns, and the WITH JITTER ticks line up with the IDEAL CLOCK.',
      'Switch JITTER MODE to PERIODIC: MODE reads PERIODIC, and the WITH JITTER ticks now shift in a smooth, repeating pattern instead of at random.',
    ],
  },
};
