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
  seeing: [
    'The Digital Audio menu: how sound becomes numbers, and how numbers become sound again.',
    'The top row is the whole chain, SOUND › ANALOG › SAMPLES › NUMBERS … › LOUDSPEAKER › SOUND.',
    'THE EIGHT MODULES: one row each; a ✓ marks a module you have opened.',
    'SECONDARY TOOLS and LEARNING: shortcuts into a module or a calculator, and the GUIDED LESSON.',
  ],
  control: [
    'Tap a module’s name to read its one-line description; tap OPEN to start it.',
    'Tool chips jump straight in: SAMPLE INSPECTOR opens Module 4, ALIASING EXPLORER Module 2, DITHER COMPARATOR Module 3, TRUE-PEAK EXPLORER Module 7, CLOCK & JITTER Module 8.',
    'DATA-RATE CALCULATOR, BUFFER LATENCY CALC and FFT RESOLUTION CALC open their calculators. MYTH vs REALITY and KNOWLEDGE CHECKS both open Module 8; every module also has its own checks at the bottom.',
    'Inside a module: the display on top, readouts on its frame, controls in the dock at the bottom, notes and checks to scroll below. ⓘ beside a module’s title explains that screen.',
    'SEE WHAT’S LEFT lists the modules you have not opened; ‹ leaves the lab.',
  ],
  changes: [
    'Modules 1–2: the analog signal, then sampling — measuring it in time (Nyquist, aliasing).',
    'Modules 3–4: quantization — measuring it in level (bit depth, dither) — and the stored binary numbers.',
    'Modules 5–6: the converter chain with gain staging, then fixed and floating point.',
    'Modules 7–8: rebuilding a smooth wave, then jitter, clocking and the myths.',
  ],
  teaches: [
    'Time and level are separate: sample rate sets bandwidth, bit depth the noise floor.',
    'Not stair steps: the DAC and its filter rebuild a smooth wave.',
    'Clipping at or before the converter is permanent.',
    'Exact math: sample, bit and true-peak numbers. The level, float and jitter scenes are illustrative models, not measurements.',
    'Follows Sound and Acoustics; leads to Visual Audio Analysis, then Gain Staging.',
  ],
  tryThis: [
    'New to digital audio? Take the modules in order — each one uses the last.',
    'After Module 1, try Module 2: sweep FREQ past NYQUIST and watch READS AS turn red — an alias.',
    'Finish with the MYTH vs REALITY panel in Module 8: see which myths you believed before.',
  ],
};

/** The what's-left screen (LabEndScreen) — home and last-module FINISH. */
export const DIGITAL_END_GUIDE: ScreenGuide = {
  seeing: [
    'WHAT’S LEFT: the modules of this lab you have not opened yet. When none are left the title reads LAB COMPLETE.',
    'Opened modules fold into one ✓ CREDITED row (✓ DONE when you are not signed in); REVIEW ▾ lists them.',
  ],
  control: [
    'Tap a module’s row to open it.',
    'PRACTICE AGAIN FROM THE START opens Module 1 — it never removes credit.',
    'DONE · BACK TO LABS goes back one screen: to the lab menu after FINISH on Module 8, out of the lab from the menu.',
  ],
  changes: [
    'A module counts once you open it; its row moves from the list to the ✓ row.',
    'If your progress cannot be read, the title reads YOUR PROGRESS and every module stays listed and open.',
  ],
  teaches: [
    'Which parts of the chain — time, level, conversion, reconstruction, errors — are still to explore.',
    'Every module can be redone for practice at any time.',
  ],
  tryThis: [
    'Open the first module on the list and work down in order.',
    'Tap REVIEW ▾ and reopen a module you found hard.',
  ],
};

export const DIGITAL_SCREEN_GUIDES: Record<DigitalModuleId, ScreenGuide> = {
  // ── 1 ─────────────────────────────────────────────────────────────────────
  analog: {
    seeing: [
      'One sound seen three ways, slowed down: a SPEAKER pushes the air (PRESSURE →), a MIC diaphragm rides it, and its CONTINUOUS VOLTAGE → is drawn at right.',
      'The trace runs from +1.0 to −1.0; its colour shows loudness, blue quiet to red full scale.',
      'Readouts: FREQ, PERIOD (one cycle’s time), PEAK and RMS (average strength), in FS — fractions of the biggest level the converter will later accept (1.0).',
    ],
    control: [
      'FREQ fader (60–2000 Hz): the pitch of the source. It locks on WHITE NOISE, which has no single frequency.',
      'AMP fader: the level, 0.12 to 1.00 ×FS. ZOOM fader: from 7 cycles in view down to 1.',
      'WAVE key: SINE, SQUARE, TRIANGLE, SAW, IMPULSE or WHITE NOISE — each with a note on how hard it is to capture.',
      'MODS key: POLARITY Ø INVERT, ADD NOISE and ADD DISTORTION.',
      'Long-press any control for its guided-lesson entry.',
    ],
    changes: [
      'FREQ up: PERIOD shrinks (PERIOD = 1 ÷ FREQ) and the slowed picture runs faster; ZOOM alone sets how many cycles show.',
      'AMP moves PEAK and RMS together; the shape sets the gap (a sine’s RMS is 0.71 × PEAK).',
      'SQUARE, SAW and IMPULSE have sharp edges: many high harmonics, the hardest content to capture.',
      'POLARITY Ø INVERT flips only the voltage: air and diaphragm move as before; the wire carries the mirror image.',
    ],
    teaches: [
      'Before any converter, sound is a continuously varying voltage — an analog of the air pressure.',
      'No numbers exist yet: a microphone does not make ones and zeros.',
      'Frequency, period and level are what the converter must capture.',
      'Builds on Foundations of Sound and Microphone Principles; Module 2 starts measuring.',
    ],
    tryThis: [
      'Slide FREQ to the top: 2000 Hz, PERIOD 0.50 ms. Slide it to the bottom: 60 Hz, PERIOD 16.67 ms.',
      'Switch WAVE from SINE to SQUARE: PEAK stays 0.75 FS, RMS rises from 0.53 to 0.63 FS — a drawn, band-limited square; an ideal one’s RMS would equal its PEAK.',
      'Pick IMPULSE: PEAK is still 0.75 FS, but RMS falls to 0.15 FS — one sharp spike, little energy.',
    ],
  },

  // ── 2 ─────────────────────────────────────────────────────────────────────
  sampling: {
    seeing: [
      'An amber sine (INPUT — CONTINUOUS) with a white dot at every sample: each dot is a measurement. The green line is the sample clock.',
      'Above Nyquist the input dims (TRUE INPUT (DIM) — ABOVE NYQUIST) and a red ALIAS curve shows the lower tone the dots fit.',
      'Readouts: FS (sample rate), INPUT, NYQUIST (half of FS) and READS AS.',
    ],
    control: [
      'FREQ fader: the input, from 100 Hz (to 30 kHz at 48k). From 8k to 48k it crosses NYQUIST; at 96k and 192k it stops below it. ZOOM fader: from single samples to many cycles.',
      'RATE key: 8k to 192k, or demo rates of 4, 3, 2.5, 2 or 1.7 /CYC (samples per cycle). RECONSTRUCTED · ON draws the curve through the dots.',
      'ALIAS key: PLAY INPUT and PLAY PREDICTED ALIAS to hear the fold, plus the ANTI-ALIASING FILTER: FILTER OFF, FILTER ON, 12, 24 or 48 dB/OCT.',
      'CUTOFF fader: where the filter starts to roll off (locked while the filter is off).',
    ],
    changes: [
      'Below NYQUIST the dots follow the input, and READS AS equals INPUT.',
      'Above it, the same dots fit a lower sine exactly. READS AS, in red, is where the input would fold: |INPUT − nearest multiple of FS|.',
      'A higher FS raises NYQUIST — more bandwidth, not a smoother wave.',
      'The filter turns content above its cutoff down BEFORE sampling, so less can fold. After sampling, an alias cannot be removed.',
    ],
    teaches: [
      'Sampling measures the wave in time; below Nyquist the samples describe it completely.',
      'Nyquist is half the sample rate. Above it, frequencies fold down as aliases.',
      'Why the anti-aliasing filter sits before the converter.',
      'Follows the analog signal of Module 1; Module 3 measures the other axis, level.',
    ],
    tryThis: [
      'At 48k push FREQ to the top: INPUT reads 30 kHz and READS AS 18 kHz in red (48 − 30).',
      'Then open ALIAS, tap FILTER ON and pull CUTOFF to the bottom (7.2 kHz): the label becomes ALIAS REMOVED; READS AS still shows where it would have folded.',
      'In RATE pick 1.7 /CYC — under 2 samples per cycle: READS AS turns red at 0.7 × INPUT.',
    ],
  },

  // ── 3 ─────────────────────────────────────────────────────────────────────
  quant: {
    seeing: [
      'Two cycles of a sine and the level grid it must round to: AMBER = ORIGINAL · BLUE = SAMPLED · GREEN = STORED/RESULT · RED = ROUNDING ERROR.',
      'Up to 4 bits each level line is drawn; above that they merge into a fine band.',
      'Readouts: BITS, LEVELS, TH. SNR (theoretical signal-to-noise) and PEAK (the sine’s level).',
    ],
    control: [
      'LEVEL fader (−40 to 0 dBFS, decibels below full scale): the sine’s peak level. It starts at −12.',
      'BITS key: 1, 2, 3, 4, 6, 8, 12, 16 or 24-BIT, each with where it was used. It starts at 4-BIT.',
      'ERROR toggle: shows only the rounding error, zoomed so ±½ step fills the panel.',
      'DITHER key: NO DITHER, RPDF (flat random noise), TPDF (the standard dither) or NOISE-SHAPED (its noise moved up where hearing is least sensitive) — it drives the dither panel below the display.',
    ],
    changes: [
      'Each extra bit doubles LEVELS (2 to the power of the bits) and adds about 6 dB of TH. SNR: 6.02 × bits + 1.76 dB.',
      'The rounding error is at most half a step at any level: a big share of a quiet sine.',
      'At low levels the error locks to the signal — distortion, not hiss. Dither adds a little noise first and turns it into a steady, gentle floor.',
      'Bits change level resolution only, never frequency response.',
    ],
    teaches: [
      'Quantization measures level in steps; bit depth sets how many.',
      'More bits lower the noise floor: in theory 16-bit ≈ 98 dB SNR, 24-bit ≈ 146 dB (the BITS list’s ~96 and ~144 dB are the 6-dB-per-bit rule of thumb). Real converters reach less.',
      'Why dither is used when bit depth is reduced.',
      'Module 2 measured time; this measures level. Module 4 shows the stored numbers.',
    ],
    tryThis: [
      'Switch BITS from 4-BIT to 16-BIT: LEVELS jumps from 16 to 65,536 and TH. SNR from ≈25.8 dB to ≈98.1 dB.',
      'Set 8-BIT, turn ERROR on, ride LEVEL from −12 to below −24 dBFS: the note under the display changes to CORRELATED distortion.',
      'Pick TPDF in DITHER and scroll to the dither panel: the ERROR HISTOGRAM’s spikes spread out.',
    ],
  },

  // ── 4 ─────────────────────────────────────────────────────────────────────
  binary: {
    seeing: [
      'A strip of 28 stored samples (16-bit · 48 kHz); the selected one is marked.',
      'Readouts: SAMPLE (its number), DECIMAL (the stored whole number), HEX (the same number in base 16) and LEVEL (dBFS).',
      'Below: TIME, BINARY, NORMALIZED and % OF FS, a two’s-complement table, and a register of 16 bit switches.',
    ],
    control: [
      'SAMPLE fader: step through the samples, #0 to #27 — or drag across the strip itself.',
      'RESET REG key: sets the register back to 0100 0000 0000 0000 (+16,384).',
      'Below the display: tap any of the 16 bit switches to flip it. Each shows its weight; the MSB (top bit) reads SIGN.',
    ],
    changes: [
      'Every readout comes from one signed 16-bit whole number, written different ways.',
      'Negatives use two’s complement: the MSB is worth −32,768, so values run from −32,768 to +32,767.',
      'LEVEL = 20 × log10(|value| ÷ 32,768): half the value is about 6 dB lower.',
      'A high bit moves the value a lot; the LSB (bottom bit) moves it by 1, one quantization step.',
    ],
    teaches: [
      'A recording is only a list of whole numbers — one per sample.',
      'How signed binary stores the negative half of a wave.',
      'Decimal, binary, hex, normalized and dBFS are one value in different forms.',
      'Uses the levels of Module 3; Module 5 shows the converter chain that writes them.',
    ],
    tryThis: [
      'Start on #7: DECIMAL 1,935, HEX 0x078F, LEVEL −24.6 dBFS. Move to #21: −1,935, 0xF871 — same level, opposite sign.',
      'Find #17, the loudest sample: DECIMAL 27,212 and LEVEL −1.6 dBFS.',
      'In the register tap the SIGN switch: +16,384 (0x4000) becomes −16,384 (0xC000); the register’s own LEVEL stays −6.0 dBFS.',
    ],
  },

  // ── 5 ─────────────────────────────────────────────────────────────────────
  adc: {
    seeing: [
      'A level scene: the wave between 0 dBFS (full scale) and the analog rail, above the noise floor; ANLG and DIG meters.',
      'A strip reads TOO LOW · RIGHT · TOO HIGH; its marker shows the level.',
      'Readouts: PEAK (recorded peak, dBFS), SNR, HEADROOM (room left below 0 dBFS) and ZONE.',
      'An illustrative model: its noise floor is far louder than a real converter’s, so SNR here only compares settings.',
    ],
    control: [
      'INPUT fader (−54 to +12 dB): the analog gain into the converter — the scene’s one knob.',
      'Below the display: THE CONVERSION CHAIN — tap a block for its job, input and output, and what its failure sounds like. SIMPLIFIED, STANDARD and X-RAY change the detail.',
      'Further down: SAMPLE & HOLD — WATCH ONE CELL WORK, slowed about 1000 times.',
    ],
    changes: [
      'More INPUT lifts PEAK and SNR together and shrinks HEADROOM: the signal climbs away from a fixed noise floor.',
      'Just above 0 dB the analog stage rounds the peaks (AN. CLIP); a little higher the converter cuts flat tops (A+D CLIP).',
      'This model lets the preamp clip first; on most interfaces the converter reaches 0 dBFS first.',
    ],
    teaches: [
      'The path: mic, preamp, anti-aliasing filter, sample and hold, quantizer, encoder, PCM (plain stored samples) stream.',
      'Gain is set BEFORE conversion; peaks around −18 to −10 dBFS keep good SNR and headroom.',
      'Analog and digital clipping are separate events, and both are permanent.',
      'Joins Modules 1–4 into one chain; the Gain Staging lab goes further.',
    ],
    tryThis: [
      'At the start (INPUT −14 dB): PEAK −14.5 dBFS, SNR 46 dB in this model, ZONE RIGHT. Pull INPUT to the bottom: −54.0 dBFS, SNR 6 dB, TOO LOW.',
      'Push INPUT to the top (+12 dB): PEAK reads 0.0 OVER, HEADROOM none, ZONE A+D CLIP.',
      'Ease INPUT to between +1 and +1.8 dB: ZONE reads AN. CLIP while PEAK is still just below 0 dBFS.',
    ],
  },

  // ── 6 ─────────────────────────────────────────────────────────────────────
  processing: {
    seeing: [
      'One mix bus, two fates: FLOAT INTERNAL PATH at left, FIXED-POINT RENDER (24-BIT) at right with its 0 dBFS line.',
      'Readouts: FLOAT BUS (bus peak, dBFS), FIXED (0.0 CLIP once over zero) and TRIM.',
      'Move VALUE and the display swaps to HOW A FLOAT NUMBER WORKS: SIGN, EXPONENT (decade) and MANTISSA (slides 1→10).',
    ],
    control: [
      'GAIN fader: the bus peak, −6.0 to +6.0 dBFS. It starts at the top.',
      'TRIM toggle: turns the bus back down by the gain added, before the output.',
      'VALUE fader: one float number, from −3.9811 through nearly zero to +3.9811.',
      'Below the display: INTEGER vs FLOATING POINT range bars, the float panel, a check and the myths.',
    ],
    changes: [
      'Float has room above 0 dBFS: an over-zero peak is just a bigger number, so TRIM brings the wave back intact.',
      'Fixed point has no number above full scale: everything over 0 dBFS is cut flat at the render. TRIM after that gives a quieter clipped wave.',
      'The exponent rescales the ruler, so float stores tiny and huge values. This screen counts in decades to keep it readable; real floats use powers of two.',
    ],
    teaches: [
      'Integer (fixed-point) formats stop hard at 0 dBFS; floating point has an enormous range.',
      'Over-zero levels in a DAW (recording software) are safe only until a fixed-point stage — trim first.',
      'Converting a clipped file to float does not repair it.',
      'Follows the converter of Module 5; Module 7 turns the numbers back into a continuous voltage.',
    ],
    tryThis: [
      'At the start, FLOAT BUS +6.0 and FIXED 0.0 CLIP. Turn TRIM on (−12.0 dB): the float pane reads intact, the fixed pane still clipped.',
      'Pull GAIN to the bottom: FLOAT BUS and FIXED both read −6.0 — below full scale, nothing clips.',
      'Ride VALUE through the middle: the SIGN flips while the EXPONENT steps by decades.',
    ],
  },

  // ── 7 ─────────────────────────────────────────────────────────────────────
  dac: {
    seeing: [
      'Samples rebuilt into a continuous voltage, slowed down. SAMPLES: dots. ZOH (zero-order hold): dim held steps inside the converter. RECONSTRUCTED: the bright output. ORIGINAL: what was recorded.',
      'X-RAY adds DAC CLOCK ticks and a RECON LPF (filter) inset.',
      'Readouts: FS (48 kHz), MODE, LAYERS. Move ISP FREQ or PHASE for INTER-SAMPLE PEAKS: SAMPLE PK, TRUE PK (in dBTP, true-peak dB), MISSED.',
    ],
    control: [
      'MODE key: SIMPLIFIED (samples and the rebuilt wave — no steps), STANDARD (adds the ZOH steps) or X-RAY (adds the DAC CLOCK ticks and the RECON LPF inset).',
      'LAYERS key: SAMPLES, ZOH, RECONSTRUCTED and ORIGINAL on or off. SIMPLIFIED hides ZOH.',
      'OS RATE key: 1×, 2×, 4× or 8× oversampling — it drives the SPECTRAL IMAGES & OVERSAMPLING panel below.',
      'ISP FREQ (19.2–23.5 kHz) and PHASE (0–180°) faders: the near-Nyquist sine of the INTER-SAMPLE PEAK EXPLORER.',
    ],
    changes: [
      'RECONSTRUCTED passes through every dot and cuts smoothly through the steps — never along their flat tops or square edges — lying on ORIGINAL.',
      'The ZOH steps are a stage inside the converter, not the output.',
      'Oversampling moves the first spectral image up (to 384 kHz at 8×), so the analog filter can be gentle. It adds no information.',
      'Every sample can sit below 0 dBFS while the wave between them rises above.',
    ],
    teaches: [
      'Digital audio is not stair steps: a DAC and its filter output one continuous wave.',
      'More samples buy bandwidth, not smoothness.',
      'Why true-peak meters catch overs that sample-peak meters miss.',
      'Closes the loop opened in Module 2; Module 8 tests the myths this disproves.',
    ],
    tryThis: [
      'In LAYERS turn off SAMPLES and ZOH: RECONSTRUCTED and ORIGINAL sit on top of each other.',
      'Push ISP FREQ to the top and PHASE to 45°: TRUE PK reads about +2.9 dBTP, MISSED about 3 dB — samples still at −0.10 dBFS.',
      'Keep ISP FREQ there, set PHASE to 90°: a sample lands on the crest — TRUE PK −0.10 dBTP, MISSED 0.00 dB.',
    ],
  },

  // ── 8 ─────────────────────────────────────────────────────────────────────
  errors: {
    seeing: [
      'Two rows of clock ticks: IDEAL CLOCK, and WITH JITTER (EXAGGERATED) — drawn 1000 times larger than real.',
      'Whiskers on the wave show each value error: VALUE ERROR ≈ SLOPE × TIMING ERROR.',
      'Readouts: INTERVAL (20.83 µs @48k between samples), PEAK DEV (largest timing error) and MODE.',
    ],
    control: [
      'JITTER fader: the peak timing error, ±0.0 to ±8.0 ns. It starts at ±4.8 ns.',
      'Tap the JITTER key for JITTER MODE: RANDOM (early or late by chance) or PERIODIC (the clock wobbles in a pattern).',
      'Scroll down for three panels. First: CLOCKING — ONE MASTER, THE REST FOLLOW. Next: MODULE 8 · MYTH vs REALITY. Last: DATA RATE — THE MENTAL MATH. Then the checks.',
    ],
    changes: [
      'Jitter is a timing error, not rounding: the right voltage measured at the wrong moment is a wrong value.',
      'The error grows with how fast the wave changes — biggest on steep slopes, zero at flat peaks.',
      'RANDOM jitter spreads into a faint noise floor; PERIODIC jitter makes tones beside the signal, far easier to hear.',
      'It matters where a clock times a conversion (ADC / DAC); file copies carry the same numbers.',
    ],
    teaches: [
      'What jitter is, and where it matters.',
      'One device sets the clock for a whole digital system. The rest follow it: by a word-clock cable, by the clock carried in a digital audio signal (AES3 or S/PDIF), or by PTP timing on a network.',
      'The classic digital-audio myths, each beside what is true.',
      'Draws the lab together; Visual Audio Analysis comes next.',
    ],
    tryThis: [
      'Slide JITTER to the top: PEAK DEV reads ±8.0 ns and the whiskers grow on the steep parts of the wave.',
      'Slide JITTER to zero: PEAK DEV ±0.0 ns — the WITH JITTER ticks line up with the IDEAL CLOCK.',
      'Switch JITTER MODE to PERIODIC: MODE reads PERIODIC and the WITH JITTER ticks now shift in a smooth repeating pattern instead of at random.',
    ],
  },
};
