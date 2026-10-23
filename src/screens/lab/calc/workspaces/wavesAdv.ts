/**
 * Workspaces — Waves, ADVANCED TIER (owner buildout 2026-08-07):
 * Analog Alignment (source/driver time alignment) · Intermodulation Products.
 * Section 'waves'. Same pattern as wave.ts.
 */
import type { Workspace } from '../calcTypes';
import { AIR_TEMP_FIELD, fmt, snapWhole, speedOfSoundAir } from '../calcUnits';

const n = (v: number | number[]) => (typeof v === 'number' ? v : v[0] ?? NaN);

const ALIGN: Workspace = {
  id: 'align',
  name: 'Analog Alignment',
  tagline: 'Time-align sources: offset ↔︎ delay ↔︎ phase',
  section: 'waves',
  reportPrefix: 'ALIGN',
  intro:
    'When two sources — a sub and a top, a woofer and a tweeter, a mic and a DI — reach the listener ' +
    'at different times, they comb. This workspace turns a physical path offset into the delay that ' +
    'realigns them, and shows the phase relationship any offset creates at a given frequency.',
  whyItMatters:
    'Time alignment is the difference between a punchy, coherent system and a hollow, phasey one. A ' +
    'few centimetres of driver offset is degrees of phase error at the crossover; a metre of sub-to-' +
    'top offset is milliseconds you can dial back in with delay.',
  example:
    'A sub 1.2 m closer than the tops (20 °C): delay = 1.2 ÷ 343 ≈ 3.5 ms to add to the SUB. At an ' +
    '80 Hz crossover that same 1.2 m offset is 360·1.2·80/343 ≈ 101° of phase — well out of step ' +
    'until aligned.',
  mistakes: [
    'Delaying the wrong source — you delay the CLOSER (earlier) source to wait for the farther one, never the other way.',
    'Aligning by ear at one frequency and ignoring the rest — a fixed delay fixes timing at every frequency (for one spot), but polarity and crossover phase still need checking.',
    'Forgetting temperature — the speed of sound (and therefore the right delay) shifts with air temperature.',
  ],
  warnings:
    'Direct-path geometry: delay = offset/c; phase = 360·offset·f/c; distance = delay·c. Real ' +
    'alignment also involves driver phase response and crossover topology — this handles the ' +
    'time-of-flight part.',
  glossary: ['Phase', 'Delay', 'Comb Filtering', 'Crossover', 'Wavelength'],
  fields: [
    { key: 'offset', name: 'PATH OFFSET', quantity: 'length', placeholder: '1.2', help: 'How much farther one source is than the other.', warn: { test: (x) => x < 0, msg: 'Offset cannot be negative.' } },
    { key: 'temp', name: 'AIR TEMPERATURE', quantity: 'temperature', signed: true, ...AIR_TEMP_FIELD, placeholder: '20', help: 'Sets the speed of sound.' },
    { key: 'freq', name: 'FREQUENCY', quantity: 'frequency', placeholder: '80', help: 'Frequency to evaluate the phase relationship at (e.g. the crossover).', positive: true, warn: { test: (x) => x <= 0, msg: 'Frequency must be greater than zero.' } },
    { key: 'sr', name: 'SAMPLE RATE', quantity: 'samplerate', placeholder: '48000', help: 'For the delay expressed in samples.', positive: true, warn: { test: (x) => x <= 0, msg: 'Sample rate must be greater than zero.' } },
    { key: 'delay', name: 'DELAY', quantity: 'time', defaultUnit: 'ms', placeholder: '3.5', help: 'A delay time to convert back into a path distance.', warn: { test: (x) => x < 0, msg: 'Delay cannot be negative.' } },
  ],
  functions: [
    {
      key: 'delayForOffset',
      name: 'Delay to align a path offset',
      inputs: ['offset', 'temp', 'sr'],
      formula: 'delay = offset / c',
      plainFormula: 'The delay equals the path offset divided by the speed of sound.',
      explain:
        'When two sources reach the listener at different times they comb. This turns the extra distance one source travels into the delay you add to the CLOSER (earlier) source so both arrive together, and also gives that delay in samples. The speed of sound comes from the air temperature.',
      keySymbols: ['/', 'c'],
      compute: (v) => {
        const c = speedOfSoundAir(n(v.temp));
        const d = n(v.offset) / c;
        return [
          { label: 'DELAY TO ALIGN', value: d, quantity: 'time', unit: 'ms' },
          { label: 'DELAY IN SAMPLES', value: d * n(v.sr), quantity: 'samples', chainable: false },
        ];
      },
      steps: (v) => {
        const c = speedOfSoundAir(n(v.temp));
        const d = n(v.offset) / c;
        return [
          `c = ${fmt(c)} m/s. Delay = ${fmt(n(v.offset))} ÷ ${fmt(c)} = ${fmt(d * 1000)} ms.`,
          `That is ${fmt(d * n(v.sr))} samples at ${fmt(n(v.sr))} Hz — add it to the CLOSER (earlier) source.`,
        ];
      },
    },
    {
      key: 'phaseAtFreq',
      name: 'Phase offset at a frequency',
      inputs: ['offset', 'freq', 'temp'],
      formula: 'phase = 360 · offset · f / c',
      plainFormula:
        'The phase equals 360 degrees times the path offset times the frequency, divided by the speed of sound.',
      explain:
        'Shows the phase relationship a path offset creates at a chosen frequency (often the crossover). A full wavelength of offset is 360°, so the offset is scaled by frequency and divided by the speed of sound. Near 0° the sources reinforce; near 180° they cancel until aligned.',
      keySymbols: ['·', '/', '°', 'f', 'c'],
      compute: (v) => {
        const c = speedOfSoundAir(n(v.temp));
        const wl = c / n(v.freq);
        const phase = snapWhole((360 * n(v.offset)) / wl) % 360;
        return [
          { label: 'PHASE OFFSET', value: phase, quantity: 'angle' },
          { label: 'OFFSET IN WAVELENGTHS', value: n(v.offset) / wl, quantity: 'number', chainable: false },
        ];
      },
      steps: (v) => {
        const c = speedOfSoundAir(n(v.temp));
        const wl = c / n(v.freq);
        const total = (360 * n(v.offset)) / wl;
        const phase = snapWhole(total) % 360;
        // The sum of two EQUAL sources at this phase, in dB over one alone:
        // 20·log₁₀|2·cos(φ/2)| — +6 dB in phase, +3 dB at 90°, 0 dB at 120°.
        // The verdict follows it (audit R2, 2026-10-23): 50° (still +5.2 dB)
        // was called "partly cancel".
        const sum = 20 * Math.log10(Math.abs(2 * Math.cos((phase * Math.PI) / 360)));
        const near = Math.min(phase, 360 - phase);
        return [
          `Wavelength at ${fmt(n(v.freq))} Hz = ${fmt(c)} ÷ ${fmt(n(v.freq))} = ${fmt(wl)} m.`,
          // The wrap step said, not skipped (audit R2): "360 × 1200000 ÷ 4.29
          // = 130.4°" was false as written.
          Math.abs(total) >= 360
            ? `Phase = 360 × ${fmt(n(v.offset))} ÷ ${fmt(wl)} = ${fmt(total)}°, which is ${fmt(phase)}° after removing whole turns (${fmt(n(v.offset) / wl)} wavelengths).`
            : `Phase = 360 × ${fmt(n(v.offset))} ÷ ${fmt(wl)} = ${fmt(phase)}° (${fmt(n(v.offset) / wl)} wavelengths).`,
          near <= 90
            ? `Mostly in phase — two equal sources still add well here (about +${fmt(sum, 2)} dB over one alone).`
            : near <= 120
              ? `Partly out of phase — some loss: two equal sources add only about +${fmt(sum, 2)} dB over one alone.`
              : near > 179.9
                ? `Close to 180° — equal sources cancel almost completely here until aligned.`
                : `Mostly cancelling — two equal sources come out about ${fmt(-sum, 2)} dB quieter than one alone; align them.`,
        ];
      },
    },
    {
      key: 'distanceForDelay',
      name: 'Path distance from a delay (reverse)',
      inputs: ['delay', 'temp'],
      formula: 'distance = delay · c',
      plainFormula: 'The path distance equals the delay times the speed of sound.',
      explain:
        'The reverse of the alignment calculation: converts a delay time back into the extra path length it represents. Useful for turning a measured or dialed-in delay into the physical offset between two sources.',
      keySymbols: ['·', 'c'],
      compute: (v) => {
        const c = speedOfSoundAir(n(v.temp));
        return [{ label: 'PATH DISTANCE', value: n(v.delay) * c, quantity: 'length' }];
      },
      steps: (v) => {
        const c = speedOfSoundAir(n(v.temp));
        return [
          `Distance = ${fmt(n(v.delay))} s × ${fmt(c)} m/s = ${fmt(n(v.delay) * c)} m.`,
          `A delay of ${fmt(n(v.delay) * 1000)} ms corresponds to that much extra path length.`,
        ];
      },
    },
  ],
};

const IMD: Workspace = {
  id: 'imd',
  name: 'Intermodulation Products',
  tagline: 'Two tones → sum, difference & 3rd-order tones',
  section: 'waves',
  reportPrefix: 'IMD',
  intro:
    'Any nonlinearity — an overdriven stage, a stressed driver, a bad connection — mixes two tones ' +
    'into NEW tones at their sums and differences. Enter two frequencies and see the ' +
    'intermodulation products, including the third-order tones that land close to the originals.',
  whyItMatters:
    'Unlike harmonic distortion, IMD products are usually NOT musically related to the source, so ' +
    'they sound harsh and "wrong." The third-order products (2f₁−f₂ and 2f₂−f₁) are often the worst: with close tones they ' +
    'fall right next to the originals, where you can’t filter them away.',
  example:
    'Tones at 19 kHz and 20 kHz through a nonlinearity: the difference tone is 1 kHz — audible in the ' +
    'midrange from two nearly-inaudible highs. Third-order 2·19−20 = 18 kHz and 2·20−19 = 21 kHz sit ' +
    'right beside the originals.',
  mistakes: [
    'Confusing IMD with harmonic distortion — harmonics are integer multiples (musical); IMD sums/differences usually are not (harsh).',
    'Assuming high-frequency intermod is harmless — the DIFFERENCE tone can land in the most audible midrange.',
    'Trying to filter third-order products — with close tones, 2f₁−f₂ and 2f₂−f₁ sit so close to them that no practical filter separates them.',
  ],
  warnings:
    'Frequency-only model: products at |m·f₁ ± n·f₂|; order = |m|+|n|. Whether each product is ' +
    'audible depends on the nonlinearity and levels, which this does not model — it locates the ' +
    'frequencies, not their amplitudes.',
  glossary: ['Intermodulation', 'Distortion', 'Harmonics', 'nonlinear distortion', 'Frequency'],
  fields: [
    { key: 'f1', name: 'TONE 1 (f₁)', quantity: 'frequency', placeholder: '19000', help: 'First input frequency.', positive: true, warn: { test: (x) => x <= 0, msg: 'Frequency must be greater than zero.' } },
    { key: 'f2', name: 'TONE 2 (f₂)', quantity: 'frequency', placeholder: '20000', help: 'Second input frequency.', positive: true, warn: { test: (x) => x <= 0, msg: 'Frequency must be greater than zero.' } },
  ],
  functions: [
    {
      key: 'products',
      name: 'Intermodulation products',
      inputs: ['f1', 'f2'],
      formula: '2nd: f₂±f₁ · 3rd: 2f₁±f₂, 2f₂±f₁',
      plainFormula:
        'Second-order tones appear at the sum and difference of the two frequencies; third-order tones appear at twice one frequency plus or minus the other.',
      explain:
        'A nonlinearity mixes two tones into new tones at their sums and differences. The second-order products are the simple sum and difference; the third-order products are twice one tone, plus or minus the other. The “minus” pair is often the worst, because with close tones it lands right beside the originals, where no practical filter can remove it. This locates the frequencies, not their levels.',
      keySymbols: ['±', 'x₁', 'f'],
      // One tone is no intermodulation (audit R2, 2026-10-23).
      refuse: (v) =>
        n(v.f1) === n(v.f2) ? 'Two identical tones make no intermodulation — enter two different frequencies.' : null,
      compute: (v) => {
        const f1 = n(v.f1);
        const f2 = n(v.f2);
        // LOWER / UPPER by the tones' ORDER, not their entry order (bug pass 2,
        // 2026-09-30): with f₁ = 20 kHz, f₂ = 19 kHz the "LOWER" row printed
        // 21 kHz and the "UPPER" row 18 kHz.
        const lo = Math.min(f1, f2);
        const hi = Math.max(f1, f2);
        return [
          { label: '2ND-ORDER DIFFERENCE (f₂−f₁)', value: Math.abs(f2 - f1), quantity: 'frequency' },
          { label: '2ND-ORDER SUM (f₁+f₂)', value: f1 + f2, quantity: 'frequency', chainable: false },
          { label: '3RD-ORDER LOWER (2·lower − higher)', value: Math.abs(2 * lo - hi), quantity: 'frequency', chainable: false },
          { label: '3RD-ORDER UPPER (2·higher − lower)', value: Math.abs(2 * hi - lo), quantity: 'frequency', chainable: false },
        ];
      },
      table: (v) => {
        const f1 = n(v.f1);
        const f2 = n(v.f2);
        const rows: string[][] = [
          ['f₂ − f₁', fmt(Math.abs(f2 - f1)), '2'],
          ['f₁ + f₂', fmt(f1 + f2), '2'],
          ['2f₁ − f₂', fmt(Math.abs(2 * f1 - f2)), '3'],
          ['2f₂ − f₁', fmt(Math.abs(2 * f2 - f1)), '3'],
          ['2f₁ + f₂', fmt(2 * f1 + f2), '3'],
          ['2f₂ + f₁', fmt(2 * f2 + f1), '3'],
        ];
        return { title: 'PRODUCTS BY ORDER (Hz)', cols: ['Product', 'Frequency', 'Order'], rows };
      },
      steps: (v) => {
        const f1 = n(v.f1);
        const f2 = n(v.f2);
        return [
          `Difference f₂−f₁ = ${fmt(Math.abs(f2 - f1))} Hz; sum f₁+f₂ = ${fmt(f1 + f2)} Hz (2nd order).`,
          `Third order: 2f₁−f₂ = ${fmt(Math.abs(2 * f1 - f2))} Hz and 2f₂−f₁ = ${fmt(Math.abs(2 * f2 - f1))} Hz.`,
          `With close tones, the third-order pair sits closest to the originals — the hardest IMD to filter and the most telling of a stressed stage.`,
        ];
      },
    },
  ],
};

export const WORKSPACES_WAVES_ADV: Workspace[] = [ALIGN, IMD];
