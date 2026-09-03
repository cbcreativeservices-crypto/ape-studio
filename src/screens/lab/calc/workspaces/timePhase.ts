/**
 * Workspaces: Time · Phase · Digital timing — distance/delay/samples, phase &
 * time offset, comb filtering, buffer latency, FFT resolution.
 * Authored to the wave.ts exemplar (owner spec 2026-07-29).
 */
import type { Workspace } from '../calcTypes';
import { fmt, fmtInt, speedOfSoundAir } from '../calcUnits';

const n = (v: number | number[]) => (typeof v === 'number' ? v : v[0] ?? NaN);

/* ------------------------------------------------------------------ */
/* 1 · Distance · Delay · Samples                                      */
/* ------------------------------------------------------------------ */

const WS_DISTDELAY: Workspace = {
  id: 'distdelay',
  name: 'Distance · Delay · Samples',
  tagline: 'Meters ↔︎ milliseconds ↔︎ samples',
  section: 'waves',
  intro:
    'Sound in air, time on the clock, and samples in the box are three views of the same ' +
    'journey. Convert any one into the others: how long a distance takes, how far a delay ' +
    'reaches, and how many samples that is at common sample rates.',
  whyItMatters:
    'System alignment, delay towers, drum-mic compensation, and plugin delay all live in this ' +
    'triangle. A speaker two meters closer arrives ~6 ms early; a DAW that reports latency in ' +
    'samples is telling you a time; a time is telling you a distance. Fluency here is what lets ' +
    'you move between a tape measure, a delay knob, and a sample counter without hesitation.',
  example:
    'A delay tower sits 30 m behind the main PA at 20 °C. c ≈ 343 m/s, so t = 30 ÷ 343 ≈ 87.4 ms ' +
    '— dial roughly that into the tower so its arrival lands with the mains. At 48 kHz that is ' +
    '0.0874 × 48000 ≈ 4196 samples; a DSP that only accepts whole samples is at most half a ' +
    'sample (~10 µs, ~3.6 mm) from perfect.',
  mistakes: [
    'Forgetting temperature: between a 10 °C load-in and a 30 °C show, 30 m of throw shifts by more than 1.5 ms — enough to smear an alignment done in the morning.',
    'Confusing one-way with round-trip: a reflection off a back wall travels TO the wall and BACK, so its delay is the round-trip distance, twice the one-way figure.',
    'Rounding samples carelessly: for alignment you want the NEAREST whole sample, not a truncation — a floor() at 44.1 kHz can quietly cost you most of a sample (~23 µs).',
    'Treating "1 ms per foot" as exact — it is a room-temperature rule of thumb (actually ~0.88 ms/ft at 20 °C); fine for sanity checks, not for final alignment.',
  ],
  warnings:
    'Speed of sound uses the classroom dry-air model c = 331.3·√(1 + T/273.15); humidity and ' +
    'pressure move it by well under 1% in normal rooms. Real alignment is finished by ear or by ' +
    'a measurement system (dual-FFT transfer function), not by tape measure alone — obstacles, ' +
    'wind, and temperature gradients bend the simple picture outdoors.',
  glossary: ['Speed of sound', 'Latency', 'Sample Rate', 'Sample', 'Delay', 'Propagation'],
  fields: [
    {
      key: 'dist',
      name: 'DISTANCE',
      quantity: 'length',
      placeholder: '30',
      help: 'The one-way path the sound travels — speaker to listener, source to mic.',
    },
    {
      key: 'temp',
      name: 'AIR TEMPERATURE',
      quantity: 'temperature',
      placeholder: '20',
      help: 'Sets the speed of sound in the classroom dry-air model.',
    },
    {
      key: 'delay',
      name: 'DELAY TIME',
      quantity: 'time',
      defaultUnit: 'ms',
      placeholder: '87.4',
      help: 'A time offset — delay-line setting, measured arrival difference, reported latency.',
    },
    {
      key: 'smp',
      name: 'SAMPLES',
      quantity: 'samples',
      placeholder: '4196',
      help: 'A count of samples — plugin delay report, DSP delay setting, region offset.',
    },
    {
      key: 'sr',
      name: 'SAMPLE RATE',
      quantity: 'samplerate',
      defaultUnit: 'srkhz',
      placeholder: '48',
      help: 'Samples per second of the digital system (44.1 kHz, 48 kHz, 96 kHz…).',
      warn: { test: (x) => x < 8000 || x > 384000, msg: 'Outside the usual audio range (8 kHz – 384 kHz) — check the unit.' },
    },
  ],
  functions: [
    {
      key: 'distToDelay',
      name: 'Delay from distance',
      inputs: ['dist', 'temp'],
      formula: 't = d / c',
      plainFormula: 'The delay equals the distance divided by the speed of sound.',
      explain:
        'Sound in air, time on the clock, and samples in the box are three views of one journey. This turns a distance into the time it takes to travel — the basis of delay-tower alignment and drum-mic compensation. The speed of sound comes from the air temperature.',
      keySymbols: ['/', 'c'],
      compute: (v) => {
        const c = speedOfSoundAir(n(v.temp));
        const t = n(v.dist) / c;
        return [
          { label: 'DELAY', value: t, quantity: 'time', unit: 'ms' },
          { label: 'DELAY (µs)', value: t, quantity: 'time', unit: 'us', chainable: false },
          { label: 'SPEED OF SOUND USED', value: c, quantity: 'speed', chainable: false },
        ];
      },
      steps: (v) => {
        const c = speedOfSoundAir(n(v.temp));
        const d = n(v.dist);
        const t = d / c;
        return [
          `c = 331.3 × √(1 + ${fmt(n(v.temp))}/273.15) = ${fmt(c)} m/s.`,
          `t = ${fmt(d)} m ÷ ${fmt(c)} m/s = ${fmt(t)} s = ${fmt(t * 1000)} ms.`,
          `In samples: ${fmt(t * 44100)} at 44.1 kHz, ${fmt(t * 48000)} at 48 kHz, ${fmt(t * 96000)} at 96 kHz.`,
        ];
      },
      table: (v) => {
        const t = n(v.dist) / speedOfSoundAir(n(v.temp));
        const rows = [44100, 48000, 96000].map((sr) => [
          `${sr / 1000} kHz`,
          fmt(t * sr),
          `${Math.round(t * sr)}`,
        ]);
        return { title: 'Samples at common rates', cols: ['SAMPLE RATE', 'EXACT SAMPLES', 'NEAREST WHOLE'], rows };
      },
    },
    {
      key: 'delayToDist',
      name: 'Distance from delay (reverse)',
      inputs: ['delay', 'temp'],
      formula: 'd = c · t',
      plainFormula: 'The distance equals the speed of sound times the delay time.',
      explain:
        'The reverse: the physical offset a delay represents in air. A reported latency in milliseconds becomes the distance a sound would travel in that time — useful for picturing what a delay setting means on stage.',
      keySymbols: ['·', 'c'],
      compute: (v) => {
        const c = speedOfSoundAir(n(v.temp));
        const d = c * n(v.delay);
        return [
          { label: 'DISTANCE', value: d, quantity: 'length' },
          { label: 'DISTANCE (ft)', value: d, quantity: 'length', unit: 'ft', chainable: false },
          { label: 'SPEED OF SOUND USED', value: c, quantity: 'speed', chainable: false },
        ];
      },
      steps: (v) => {
        const c = speedOfSoundAir(n(v.temp));
        const t = n(v.delay);
        return [
          `c = ${fmt(c)} m/s at ${fmt(n(v.temp))} °C.`,
          `d = ${fmt(c)} m/s × ${fmt(t)} s = ${fmt(c * t)} m (≈ ${fmt((c * t) / 0.3048)} ft) — the physical offset this delay represents in air.`,
        ];
      },
    },
    {
      key: 'smpToTime',
      name: 'Time from samples',
      inputs: ['smp', 'sr', 'temp'],
      formula: 't = N / sr',
      plainFormula: 'The time equals the number of samples divided by the sample rate.',
      explain:
        'Converts a sample count — a plugin delay report, a DSP setting, a region offset — into a time, and the equivalent distance in air. A time is telling you a distance; a sample count is telling you a time.',
      keySymbols: ['/'],
      compute: (v) => {
        const t = n(v.smp) / n(v.sr);
        const c = speedOfSoundAir(n(v.temp));
        return [
          { label: 'TIME', value: t, quantity: 'time', unit: 'ms' },
          { label: 'TIME (µs)', value: t, quantity: 'time', unit: 'us', chainable: false },
          { label: 'EQUIVALENT DISTANCE IN AIR', value: t * c, quantity: 'length' },
        ];
      },
      steps: (v) => {
        const N = n(v.smp);
        const sr = n(v.sr);
        const t = N / sr;
        const c = speedOfSoundAir(n(v.temp));
        return [
          `t = ${fmt(N)} samples ÷ ${fmt(sr)} Hz = ${fmt(t)} s = ${fmt(t * 1000)} ms.`,
          `In air at ${fmt(n(v.temp))} °C that is ${fmt(t * c)} m — the mic-move that would cause the same offset.`,
        ];
      },
    },
    {
      key: 'timeToSmp',
      name: 'Samples from time (reverse)',
      inputs: ['delay', 'sr'],
      formula: 'N = t · sr',
      plainFormula: 'The number of samples equals the time times the sample rate.',
      explain:
        'The reverse: how many samples a delay time is. A sample-only DSP must pick a whole number, leaving a tiny residual — usually negligible, but it is why fractional-delay processing exists for precise alignment.',
      keySymbols: ['·'],
      compute: (v) => {
        const N = n(v.delay) * n(v.sr);
        return [
          { label: 'EXACT SAMPLES', value: N, quantity: 'samples' },
          { label: 'NEAREST WHOLE SAMPLE', text: `${Math.round(N)} samples (error ${fmt(((Math.round(N) - N) / n(v.sr)) * 1e6)} µs)` },
          { label: 'ROUNDED DOWN / UP', text: `${Math.floor(N)} / ${Math.ceil(N)} samples` },
        ];
      },
      steps: (v) => {
        const t = n(v.delay);
        const sr = n(v.sr);
        const N = t * sr;
        return [
          `N = ${fmt(t * 1000)} ms × ${fmt(sr)} Hz = ${fmt(N)} samples.`,
          `A sample-only DSP must pick a whole number: nearest is ${Math.round(N)}, leaving ${fmt(Math.abs(Math.round(N) - N) / sr * 1e6)} µs of residual — usually negligible, but it is why fractional-delay processing exists.`,
        ];
      },
      table: (v) => {
        const N = n(v.delay) * n(v.sr);
        const sr = n(v.sr);
        const row = (name: string, k: number) => [
          name,
          `${k}`,
          `${fmt((k / sr) * 1000)} ms`,
          `${fmt(((k - N) / sr) * 1e6)} µs`,
        ];
        return {
          title: 'Whole-sample choices',
          cols: ['ROUNDING', 'SAMPLES', 'ACTUAL TIME', 'ERROR'],
          rows: [row('Nearest', Math.round(N)), row('Floor', Math.floor(N)), row('Ceiling', Math.ceil(N))],
        };
      },
    },
  ],
};

/* ------------------------------------------------------------------ */
/* 2 · Phase & Time Offset                                             */
/* ------------------------------------------------------------------ */

const WS_PHASE: Workspace = {
  id: 'phase',
  name: 'Phase & Time Offset',
  tagline: 'Degrees ↔︎ time ↔︎ path difference',
  section: 'waves',
  intro:
    'Phase is time offset expressed per cycle. The same delay is a different number of degrees ' +
    'at every frequency — which is exactly why two arrivals can add at one frequency and cancel ' +
    'at another. Convert between degrees, milliseconds, and path lengths, and find the ' +
    'frequencies where a given delay lands at 90°, 180°, and 360°.',
  whyItMatters:
    'Every polarity check, mic-pair placement, and system-alignment decision is a phase decision. ' +
    'The trap is that "phase" on a plugin knob is a per-frequency quantity: a fixed 0.5 ms offset ' +
    'is a harmless 18° at 100 Hz and a full cancellation at 1 kHz. Thinking in Δt first and ' +
    'degrees second keeps you out of that trap.',
  example:
    'Snare top and bottom mics differ by 0.3 ms. At 200 Hz (shell fundamental) that is ' +
    '360 × 200 × 0.0003 = 21.6° — nearly aligned. At 1.67 kHz it reaches 180° and the pair ' +
    'cancels; that is the hollow midrange you hear before you flip polarity or nudge the mic. ' +
    'The 180° frequency of any delay is simply 1/(2Δt).',
  mistakes: [
    'Treating "360°" as an audible difference: 360° at one frequency is a whole cycle late — identical waveform there, but every OTHER frequency is at some other angle, so the combined sound is still comb-filtered.',
    'Ignoring wrapping: an analyzer showing 30° could be 30°, 390°, or 750° of true offset — the display wraps every 360° and hides whole cycles.',
    'Assuming one phase value pins down one delay: at a single frequency, φ and φ + k·360° are indistinguishable, so a phase reading alone cannot tell you the absolute time offset.',
    'Confusing polarity inversion (180° at ALL frequencies, zero time) with a delay that happens to hit 180° at one frequency — the fix for one is a switch, for the other a mic move.',
  ],
  warnings:
    'These are single-frequency, two-arrival idealizations. Real transfer-function phase ' +
    '(dual-FFT measurement) includes the device and room response, and unwrapping it to a true ' +
    'delay needs the whole curve, not one frequency. Path-difference math uses the classroom ' +
    'dry-air speed of sound.',
  glossary: ['Phase', 'Frequency', 'Polarity', 'Wavelength', 'Comb Filtering', 'Delay'],
  fields: [
    {
      key: 'f',
      name: 'FREQUENCY',
      quantity: 'frequency',
      placeholder: '1000',
      help: 'The frequency at which the phase relationship is evaluated.',
    },
    {
      key: 'dt',
      name: 'TIME OFFSET Δt',
      quantity: 'time',
      defaultUnit: 'ms',
      placeholder: '0.5',
      help: 'The arrival-time difference between the two signals.',
    },
    {
      key: 'phi',
      name: 'PHASE ANGLE',
      quantity: 'angle',
      placeholder: '90',
      help: 'Phase offset in degrees at the chosen frequency.',
    },
    {
      key: 'pathDiff',
      name: 'PATH DIFFERENCE',
      quantity: 'length',
      placeholder: '0.17',
      help: 'How much farther one arrival travels than the other.',
    },
    {
      key: 'temp',
      name: 'AIR TEMPERATURE',
      quantity: 'temperature',
      placeholder: '20',
      help: 'Sets the speed of sound for converting path difference to time.',
    },
  ],
  functions: [
    {
      key: 'phaseFromTime',
      name: 'Phase from time offset',
      inputs: ['f', 'dt'],
      formula: 'φ = 360 · f · Δt',
      plainFormula: 'The phase equals 360 degrees times the frequency times the time offset.',
      explain:
        'Phase is time offset expressed per cycle, so the same delay is a different number of degrees at every frequency. This gives the phase at a chosen frequency, plus how many whole cycles late the signal is — the reason two arrivals add at one frequency and cancel at another.',
      keySymbols: ['φ', '·', 'f', 'Δ'],
      compute: (v) => {
        const total = 360 * n(v.f) * n(v.dt);
        const cycles = Math.floor(total / 360);
        return [
          { label: 'PHASE (WRAPPED 0–360°)', value: ((total % 360) + 360) % 360, quantity: 'angle' },
          { label: 'FULL CYCLES LATE', value: cycles, quantity: 'number', chainable: false },
          { label: 'TOTAL PHASE ROTATION', value: total, quantity: 'angle', chainable: false },
        ];
      },
      steps: (v) => {
        const f = n(v.f);
        const dt = n(v.dt);
        const total = 360 * f * dt;
        return [
          `One cycle at ${fmt(f)} Hz lasts ${fmt(1000 / f)} ms; ${fmt(dt * 1000)} ms is ${fmt(f * dt)} of those cycles.`,
          `φ = 360° × ${fmt(f)} × ${fmt(dt)} s = ${fmt(total)}° total = ${Math.floor(total / 360)} full cycle(s) plus ${fmt(((total % 360) + 360) % 360)}°.`,
        ];
      },
    },
    {
      key: 'timeFromPhase',
      name: 'Time offset from phase (reverse)',
      inputs: ['phi', 'f'],
      formula: 'Δt = φ / (360 · f)',
      plainFormula: 'The time offset equals the phase divided by 360 degrees times the frequency.',
      explain:
        'The reverse: the smallest delay that produces a phase reading. Because phase repeats every 360°, a single reading cannot fix the absolute delay — offsets one full cycle apart look identical, so the true value needs the impulse response or the broadband phase slope.',
      keySymbols: ['Δ', 'φ', '/', '·', 'f'],
      note: 'Cycle ambiguity: phase repeats every 360°, so φ, φ+360°, φ+720°… all fit — a single phase reading cannot fix the absolute delay.',
      compute: (v) => {
        const dt = n(v.phi) / (360 * n(v.f));
        const cycle = 1 / n(v.f);
        return [
          { label: 'SMALLEST TIME OFFSET', value: dt, quantity: 'time', unit: 'ms' },
          { label: 'ALSO CONSISTENT', text: `${fmt((dt + cycle) * 1000)} ms, ${fmt((dt + 2 * cycle) * 1000)} ms … (add ${fmt(cycle * 1000)} ms per hidden cycle)` },
          { label: 'ONE FULL CYCLE AT THIS f', value: cycle, quantity: 'time', unit: 'ms', chainable: false },
        ];
      },
      steps: (v) => {
        const phi = n(v.phi);
        const f = n(v.f);
        const dt = phi / (360 * f);
        return [
          `Δt = ${fmt(phi)}° ÷ (360 × ${fmt(f)} Hz) = ${fmt(dt * 1000)} ms — the SMALLEST delay that produces this reading.`,
          `Because phase wraps every ${fmt(1000 / f)} ms at ${fmt(f)} Hz, delays of ${fmt((dt + 1 / f) * 1000)} ms, ${fmt((dt + 2 / f) * 1000)} ms, … read identically; the true offset needs more information (impulse response or broadband phase slope).`,
        ];
      },
    },
    {
      key: 'phaseFromDist',
      name: 'Phase from path difference',
      inputs: ['pathDiff', 'f', 'temp'],
      formula: 'Δt = d / c · φ = 360 · f · Δt',
      plainFormula:
        'The time offset equals the path difference over the speed of sound; the phase is then 360 degrees times the frequency times that offset.',
      explain:
        'Turns an extra path length into a phase angle at a frequency. The longer path adds travel time, and that time becomes degrees per cycle. It is the geometry behind mic-pair placement and how a small position change reshapes the phase relationship.',
      keySymbols: ['Δ', '/', 'c', 'φ', '·', 'f'],
      compute: (v) => {
        const c = speedOfSoundAir(n(v.temp));
        const dt = n(v.pathDiff) / c;
        const total = 360 * n(v.f) * dt;
        return [
          { label: 'PHASE (WRAPPED 0–360°)', value: ((total % 360) + 360) % 360, quantity: 'angle' },
          { label: 'TIME OFFSET', value: dt, quantity: 'time', unit: 'ms' },
          { label: 'TOTAL PHASE ROTATION', value: total, quantity: 'angle', chainable: false },
        ];
      },
      steps: (v) => {
        const c = speedOfSoundAir(n(v.temp));
        const d = n(v.pathDiff);
        const dt = d / c;
        const total = 360 * n(v.f) * dt;
        return [
          `The longer path adds ${fmt(d)} m ÷ ${fmt(c)} m/s = ${fmt(dt * 1000)} ms of travel.`,
          `At ${fmt(n(v.f))} Hz: φ = 360° × ${fmt(n(v.f))} × ${fmt(dt)} s = ${fmt(total)}°, i.e. ${fmt(((total % 360) + 360) % 360)}° after wrapping.`,
        ];
      },
    },
    {
      key: 'alignFreqs',
      name: 'Alignment frequencies from a delay',
      inputs: ['dt'],
      formula: 'f₉₀ = 1/(4Δt) · f₁₈₀ = 1/(2Δt) · f₃₆₀ = 1/Δt',
      plainFormula:
        'The 90-degree frequency is one over four times the offset; the 180-degree frequency (first cancellation) is one over twice the offset; and the 360-degree frequency is one over the offset.',
      explain:
        'Where a fixed delay lands at key phase angles: quarter cycle, half cycle (first cancellation), and full cycle (back in step, one cycle late). These repeat up the spectrum, so one fixed delay combs the whole range; below the 90° frequency the arrivals mostly reinforce — the safe zone for summation.',
      keySymbols: ['/', 'Δ', 'x₁'],
      note: 'These repeat: 180° recurs at every odd multiple of f₁₈₀, full cycles at every multiple of f₃₆₀ — one fixed delay combs the whole spectrum.',
      compute: (v) => {
        const dt = n(v.dt);
        return [
          { label: 'FIRST 90° FREQUENCY', value: 1 / (4 * dt), quantity: 'frequency' },
          { label: 'FIRST 180° FREQUENCY (first cancel)', value: 1 / (2 * dt), quantity: 'frequency' },
          { label: 'FIRST 360° FREQUENCY (first re-sum)', value: 1 / dt, quantity: 'frequency' },
        ];
      },
      steps: (v) => {
        const dt = n(v.dt);
        return [
          `A ${fmt(dt * 1000)} ms offset is a quarter cycle when the period is 4×Δt: f₉₀ = 1 ÷ (4 × ${fmt(dt)}) = ${fmt(1 / (4 * dt))} Hz.`,
          `Half a cycle (cancellation) at f₁₈₀ = 1 ÷ (2 × ${fmt(dt)}) = ${fmt(1 / (2 * dt))} Hz; a full cycle (back in step, one cycle late) at f₃₆₀ = 1 ÷ ${fmt(dt)} = ${fmt(1 / dt)} Hz.`,
          `Below f₉₀ the two arrivals mostly reinforce — the practical "safe zone" for summation with this offset.`,
        ];
      },
    },
  ],
};

/* ------------------------------------------------------------------ */
/* 3 · Comb Filter                                                     */
/* ------------------------------------------------------------------ */

const WS_COMB: Workspace = {
  id: 'comb',
  name: 'Comb Filter',
  tagline: 'Nulls & peaks from a second arrival',
  section: 'waves',
  intro:
    'Mix a signal with a delayed copy of itself and the spectrum grows evenly spaced peaks and ' +
    'notches — a comb. Enter the delay (or the extra path length) and see exactly where the ' +
    'first null lands and how the whole comb is spaced.',
  whyItMatters:
    'Two arrivals of the same signal — a mic plus a nearby reflection, two mics on one source, ' +
    'two speakers covering one seat — carve this exact comb into the sound. It is the physics ' +
    'behind the "hollow", "phasey" tone of a badly placed mic and the seat-to-seat tonal drift ' +
    'in overlapping PA coverage. Knowing where the nulls fall tells you whether to hear it as a ' +
    'placement problem, not an EQ problem.',
  example:
    'A mic picks up a floor reflection 0.5 ms behind the direct sound. First null = 1/(2 × ' +
    '0.0005) = 1 kHz, with further nulls at 3, 5, 7 kHz… spaced 1/Δt = 2 kHz apart. That evenly ' +
    'notched midrange is unmistakable on a spectrum analyzer — and it moves the moment you ' +
    'raise or angle the mic.',
  mistakes: [
    'EQing against a comb instead of moving the mic: the notches are too narrow, too deep, and too position-dependent for EQ — centimeters of mic movement do what no equalizer can.',
    'Expecting the comb to fade at lower levels: it is a ratio between the two arrivals, so turning everything down changes nothing; only the relative level or timing of the second arrival does.',
    'Forgetting combs move when distances change: a performer leaning toward the stand or a speaker retilt reshuffles every null — a comb "fixed" for one position returns in another.',
    'Reading comb math as the full story at all frequencies: a reflection weaker than the direct sound produces shallower notches, and absorption makes the second arrival frequency-dependent.',
  ],
  warnings:
    'This models two equal-level, spectrally identical arrivals — the worst case, with nulls of ' +
    'infinite depth. Real reflections arrive quieter and filtered, so real notches are ' +
    'shallower and the peaks smaller than the ideal +6 dB. Path-difference conversion uses the ' +
    'classroom dry-air speed of sound.',
  glossary: ['Comb Filtering', 'Phase', 'Reflection', 'Frequency', 'Delay', 'Interference'],
  fields: [
    {
      key: 'dt',
      name: 'TIME DELAY Δt',
      quantity: 'time',
      defaultUnit: 'ms',
      placeholder: '0.5',
      help: 'How far behind the direct sound the second arrival lands.',
    },
    {
      key: 'pathDiff',
      name: 'PATH-LENGTH DIFFERENCE',
      quantity: 'length',
      placeholder: '0.17',
      help: 'Extra distance the second arrival travels (reflected path minus direct path).',
    },
    {
      key: 'temp',
      name: 'AIR TEMPERATURE',
      quantity: 'temperature',
      placeholder: '20',
      help: 'Sets the speed of sound for converting the path difference to a delay.',
    },
  ],
  functions: [
    {
      key: 'combFromDelay',
      name: 'Comb from time delay',
      inputs: ['dt'],
      formula: 'f_null = (2k+1)/(2Δt) · f_peak = k/Δt · spacing = 1/Δt',
      plainFormula:
        'Nulls fall at odd multiples of one over twice the delay; peaks fall at whole multiples of one over the delay; and the comb spacing is one over the delay.',
      explain:
        'Mixing a signal with a delayed copy carves evenly spaced peaks and notches — a comb. The delay alone sets where the first null lands and how the whole comb is spaced. Shorter delays push it higher and wider; longer delays crowd it into the low mids. It is a placement problem, not an EQ problem.',
      keySymbols: ['/', 'Δ'],
      compute: (v) => {
        const dt = n(v.dt);
        return [
          { label: 'FIRST NULL', value: 1 / (2 * dt), quantity: 'frequency' },
          { label: 'NULL/NULL SPACING', value: 1 / dt, quantity: 'frequency' },
          { label: 'FIRST PEAK ABOVE 0 Hz', value: 1 / dt, quantity: 'frequency', chainable: false },
        ];
      },
      steps: (v) => {
        const dt = n(v.dt);
        return [
          `The first null sits where ${fmt(dt * 1000)} ms is half a cycle: f = 1 ÷ (2 × ${fmt(dt)}) = ${fmt(1 / (2 * dt))} Hz.`,
          `Nulls repeat at every odd multiple (${fmt(3 / (2 * dt))} Hz, ${fmt(5 / (2 * dt))} Hz…); peaks at every multiple of 1/Δt = ${fmt(1 / dt)} Hz.`,
          `Shorter delays push the comb higher and space it wider; longer delays crowd it down into the low mids.`,
        ];
      },
      table: (v) => {
        const dt = n(v.dt);
        const rows: string[][] = [];
        for (let k = 0; k < 8; k++) {
          rows.push([
            `${k + 1}`,
            `${fmt(((2 * k + 1) / (2 * dt)) / 1000)} kHz`,
            `${fmt(((k + 1) / dt) / 1000)} kHz`,
          ]);
        }
        return { title: 'First 8 nulls & peaks', cols: ['#', 'NULL (2k−1)/(2Δt)', 'PEAK k/Δt'], rows };
      },
    },
    {
      key: 'combFromPath',
      name: 'Comb from path-length difference',
      inputs: ['pathDiff', 'temp'],
      formula: 'Δt = d / c · then f_null = (2k+1)/(2Δt)',
      plainFormula:
        'The delay equals the path difference over the speed of sound; then the nulls fall at odd multiples of one over twice that delay.',
      explain:
        'The same comb, driven by the extra distance a reflection travels rather than a delay setting. It converts the path-length difference to a delay, then to the comb’s nulls. Measure the reflection’s EXTRA path — source to surface to mic, minus source to mic — not the surface distance alone.',
      keySymbols: ['Δ', '/', 'c'],
      compute: (v) => {
        const c = speedOfSoundAir(n(v.temp));
        const dt = n(v.pathDiff) / c;
        return [
          { label: 'EQUIVALENT DELAY', value: dt, quantity: 'time', unit: 'ms' },
          { label: 'PATH DIFFERENCE', value: n(v.pathDiff), quantity: 'length', chainable: false },
          { label: 'FIRST NULL', value: 1 / (2 * dt), quantity: 'frequency' },
          { label: 'NULL/NULL SPACING', value: 1 / dt, quantity: 'frequency' },
        ];
      },
      steps: (v) => {
        const c = speedOfSoundAir(n(v.temp));
        const d = n(v.pathDiff);
        const dt = d / c;
        return [
          `The reflected path is ${fmt(d)} m longer; at ${fmt(c)} m/s that is Δt = ${fmt(dt * 1000)} ms.`,
          `First null = 1 ÷ (2 × ${fmt(dt)}) = ${fmt(1 / (2 * dt))} Hz; the comb repeats every ${fmt(1 / dt)} Hz above it.`,
          `Note the reflection's EXTRA path is what counts — measure source→surface→mic minus source→mic, not the surface distance alone.`,
        ];
      },
      table: (v) => {
        const dt = n(v.pathDiff) / speedOfSoundAir(n(v.temp));
        const rows: string[][] = [];
        for (let k = 0; k < 8; k++) {
          rows.push([
            `${k + 1}`,
            `${fmt(((2 * k + 1) / (2 * dt)) / 1000)} kHz`,
            `${fmt(((k + 1) / dt) / 1000)} kHz`,
          ]);
        }
        return { title: 'First 8 nulls & peaks', cols: ['#', 'NULL', 'PEAK'], rows };
      },
    },
  ],
};

/* ------------------------------------------------------------------ */
/* 4 · Buffer & Round-Trip Latency                                     */
/* ------------------------------------------------------------------ */

const WS_LATENCY: Workspace = {
  id: 'latency',
  name: 'Buffer & Round-Trip Latency',
  tagline: 'Buffers · converters · what the artist feels',
  section: 'digital',
  intro:
    'Every audio interface trades stability for delay: audio is processed in buffers, and each ' +
    'buffer of N samples costs N/sr of time. Work out single-buffer latency, then stack the ' +
    'input buffer, output buffer, and any processing to see the real round trip.',
  whyItMatters:
    'A vocalist monitoring through the DAW hears themselves late by the whole round trip — in ' +
    'through the converter and input buffer, through plugins, back out through the output ' +
    'buffer. Somewhere past ~10 ms that starts to feel like singing in a small hard room; past ' +
    '~20 ms timing falls apart. Knowing the arithmetic tells you whether a smaller buffer, ' +
    'fewer plugins, or direct monitoring is the fix.',
  example:
    'A 128-sample buffer at 48 kHz is 128 ÷ 48000 = 2.67 ms per buffer. With a 128-sample input ' +
    'buffer, a 128-sample output buffer, and 1.5 ms of plugin latency, the round trip is 2.67 + ' +
    '2.67 + 1.5 ≈ 6.8 ms (about 328 samples) — comfortable for most performers. The same setup ' +
    'at a 512-sample buffer balloons past 22 ms.',
  mistakes: [
    'Quoting one-way when the artist hears round-trip: "my buffer is only 3 ms" ignores that monitoring passes through BOTH an input and an output buffer plus everything between.',
    'Forgetting converter latency: AD and DA conversion adds a fixed extra (often 0.5–1.5 ms total) that no buffer setting removes — put it in the extra-processing field.',
    'Halving the buffer and expecting exactly half the felt latency: only the buffer share halves; converter and plugin latency stay, so the improvement is always smaller than hoped.',
    'Ignoring plugin latency reports: one look-ahead limiter or linear-phase EQ in the monitor path can add more delay than the whole buffer chain.',
  ],
  warnings:
    'This is the arithmetic floor, not a measurement. Real interfaces add driver and ' +
    'safety-buffer overhead the spec sheet may not show, so measured round trips (loopback ' +
    'test) usually exceed this total. When the number matters, measure it: record a click ' +
    'through a physical loopback and read the offset.',
  glossary: ['Latency', 'Buffer', 'Sample Rate', 'Sample', 'Monitoring', 'Analog-to-digital conversion'],
  fields: [
    {
      key: 'buf',
      name: 'BUFFER SIZE',
      quantity: 'samples',
      placeholder: '128',
      help: 'Samples per processing block (32, 64, 128, 256, 512…).',
      warn: { test: (x) => x > 4096, msg: 'Unusually large buffer — typical audio settings are 32–2048 samples.' },
    },
    {
      key: 'sr',
      name: 'SAMPLE RATE',
      quantity: 'samplerate',
      defaultUnit: 'srkhz',
      placeholder: '48',
      help: 'Samples per second of the session.',
      warn: { test: (x) => x < 8000 || x > 384000, msg: 'Outside the usual audio range (8 kHz – 384 kHz) — check the unit.' },
    },
    {
      key: 'inBuf',
      name: 'INPUT BUFFER',
      quantity: 'samples',
      placeholder: '128',
      help: 'Buffer on the way IN (capture side).',
    },
    {
      key: 'outBuf',
      name: 'OUTPUT BUFFER',
      quantity: 'samples',
      placeholder: '128',
      help: 'Buffer on the way OUT (playback side) — often equal to the input buffer.',
    },
    {
      key: 'proc',
      name: 'EXTRA PROCESSING',
      quantity: 'time',
      defaultUnit: 'ms',
      placeholder: '1.5',
      help: 'Converters + plugin/DSP latency in the monitor path (0 if none).',
    },
    {
      key: 'smp',
      name: 'SAMPLES',
      quantity: 'samples',
      placeholder: '328',
      help: 'A sample count to convert to time.',
    },
    {
      key: 't',
      name: 'TIME',
      quantity: 'time',
      defaultUnit: 'ms',
      placeholder: '6.8',
      help: 'A time to convert to samples.',
    },
  ],
  functions: [
    {
      key: 'bufLatency',
      name: 'Latency of one buffer',
      inputs: ['buf', 'sr'],
      formula: 't = N / sr',
      plainFormula: 'The buffer latency equals the buffer size in samples divided by the sample rate.',
      explain:
        'Audio is processed in buffers, and each buffer of N samples costs N over the sample rate in time. This gives that single-buffer delay and how many buffers the computer fills per second — smaller buffers mean less delay but more frequent, riskier processing deadlines.',
      keySymbols: ['/'],
      compute: (v) => {
        const t = n(v.buf) / n(v.sr);
        return [
          { label: 'BUFFER LATENCY', value: t, quantity: 'time', unit: 'ms' },
          { label: 'BUFFERS PER SECOND', value: 1 / t, quantity: 'number', chainable: false },
        ];
      },
      steps: (v) => {
        const N = n(v.buf);
        const sr = n(v.sr);
        return [
          `t = ${fmt(N)} samples ÷ ${fmt(sr)} Hz = ${fmt((N / sr) * 1000)} ms per buffer.`,
          `The computer fills ${fmt(sr / N)} of these buffers every second — smaller buffers mean less delay but more frequent (and riskier) processing deadlines.`,
        ];
      },
    },
    {
      key: 'roundTrip',
      name: 'Round-trip monitoring latency',
      inputs: ['inBuf', 'outBuf', 'proc', 'sr'],
      formula: 't_rt = N_in/sr + N_out/sr + t_proc',
      plainFormula:
        'The round-trip latency equals the input buffer over the sample rate, plus the output buffer over the sample rate, plus the extra processing time.',
      explain:
        'What a performer monitoring through the DAW actually feels: in through the converter and input buffer, through any plugins, and back out through the output buffer. Past about 10 ms it feels like a small hard room; past 20 ms, timing falls apart. It shows whether a smaller buffer, fewer plugins, or direct monitoring is the fix.',
      keySymbols: ['/'],
      compute: (v) => {
        const sr = n(v.sr);
        const tin = n(v.inBuf) / sr;
        const tout = n(v.outBuf) / sr;
        const rt = tin + tout + n(v.proc);
        return [
          { label: 'ROUND-TRIP LATENCY', value: rt, quantity: 'time', unit: 'ms' },
          { label: 'ROUND-TRIP IN SAMPLES', value: rt * sr, quantity: 'samples', chainable: false },
          { label: 'ONE-WAY (INPUT SIDE)', value: tin + n(v.proc) / 2, quantity: 'time', unit: 'ms', chainable: false },
          { label: 'INPUT / OUTPUT / PROCESSING', text: `${fmt(tin * 1000)} ms + ${fmt(tout * 1000)} ms + ${fmt(n(v.proc) * 1000)} ms` },
        ];
      },
      steps: (v) => {
        const sr = n(v.sr);
        const tin = n(v.inBuf) / sr;
        const tout = n(v.outBuf) / sr;
        const rt = tin + tout + n(v.proc);
        return [
          `Input buffer: ${fmt(n(v.inBuf))} ÷ ${fmt(sr)} = ${fmt(tin * 1000)} ms. Output buffer: ${fmt(n(v.outBuf))} ÷ ${fmt(sr)} = ${fmt(tout * 1000)} ms.`,
          `Round trip = ${fmt(tin * 1000)} + ${fmt(tout * 1000)} + ${fmt(n(v.proc) * 1000)} ms processing = ${fmt(rt * 1000)} ms (${fmt(rt * sr)} samples).`,
          `This is what a performer monitoring through the DAW actually feels — roughly like standing ${fmt(rt * 343)} m from their own voice.`,
        ];
      },
    },
    {
      key: 'smpToMs',
      name: 'Milliseconds from samples',
      inputs: ['smp', 'sr'],
      formula: 't = N / sr',
      plainFormula: 'The time equals the number of samples divided by the sample rate.',
      explain:
        'A plain sample-count-to-milliseconds conversion — reading a plugin’s reported delay, a region offset, or a loopback measurement as a time.',
      keySymbols: ['/'],
      compute: (v) => [
        { label: 'TIME', value: n(v.smp) / n(v.sr), quantity: 'time', unit: 'ms' },
      ],
      steps: (v) => [
        `t = ${fmt(n(v.smp))} samples ÷ ${fmt(n(v.sr))} Hz = ${fmt((n(v.smp) / n(v.sr)) * 1000)} ms.`,
      ],
    },
    {
      key: 'msToSmp',
      name: 'Samples from milliseconds (reverse)',
      inputs: ['t', 'sr'],
      formula: 'N = t · sr',
      plainFormula: 'The number of samples equals the time times the sample rate.',
      explain:
        'The reverse: a delay time as a sample count, with the nearest whole sample — for setting sample-based delays or lining up regions on the grid.',
      keySymbols: ['·'],
      compute: (v) => {
        const N = n(v.t) * n(v.sr);
        return [
          { label: 'EXACT SAMPLES', value: N, quantity: 'samples' },
          { label: 'NEAREST WHOLE SAMPLE', text: `${Math.round(N)} samples` },
        ];
      },
      steps: (v) => [
        `N = ${fmt(n(v.t) * 1000)} ms × ${fmt(n(v.sr))} Hz = ${fmt(n(v.t) * n(v.sr))} samples.`,
      ],
    },
  ],
};

/* ------------------------------------------------------------------ */
/* 5 · FFT & Frequency Resolution                                      */
/* ------------------------------------------------------------------ */

const WS_FFT: Workspace = {
  id: 'fft',
  name: 'FFT & Frequency Resolution',
  tagline: 'Bin spacing · window length · the time–frequency trade',
  section: 'digital',
  intro:
    'An FFT chops the spectrum into evenly spaced bins: spacing = sample rate ÷ FFT size. The ' +
    'price of finer bins is a longer analysis window — you cannot have sharp frequency detail ' +
    'and sharp timing from the same transform. Work the trade in both directions.',
  whyItMatters:
    'Every analyzer, tuner, and spectral plugin lives on this trade. If your RTA cannot tell ' +
    '41 Hz (low E) from 44 Hz, the FFT is too short — but stretching it far enough to resolve ' +
    'them means each display frame averages over a longer slice of time, smearing fast events. ' +
    'Reading an analyzer well starts with knowing which side of this trade its settings sit on.',
  example:
    'A 4096-point FFT at 48 kHz: bin spacing = 48000 ÷ 4096 ≈ 11.7 Hz, window = 4096 ÷ 48000 ≈ ' +
    '85.3 ms. To separate bass notes 5 Hz apart you would need N = 48000 ÷ 5 = 9600 points — ' +
    'next power of two 16384, giving 2.93 Hz bins but a 341 ms window: fine for a sustained ' +
    'note, hopeless for a drum fill.',
  mistakes: [
    'Expecting fine low-frequency resolution from short windows: a 1024-point FFT at 48 kHz has ~47 Hz bins — the entire bottom octave of a bass lands in one or two bins.',
    'Reading bin spacing as measurement accuracy: a peak can be pinned between bins far more precisely (interpolation), and a bin value is energy over the whole window, not an instantaneous reading.',
    'Forgetting the window function: Hann, Blackman and friends widen each bin\'s effective bandwidth by roughly 1.5–2×, so two tones one bin apart still merge.',
    'Assuming more points always helps: past the length of the sound itself, longer FFTs just analyze more silence (or more room decay) around the event.',
  ],
  warnings:
    'Bin spacing sr/N is the raw transform grid. The effective resolution is worse: window ' +
    'functions widen each bin\'s bandwidth (Hann ≈ 1.5 bins ENBW), and real analyzers overlap, ' +
    'average, and interpolate on top of it. Treat these numbers as the grid an analyzer is ' +
    'built on, not the precision of what it displays.',
  glossary: ['FFT', 'Sample Rate', 'Frequency', 'Nyquist Frequency', 'Spectrum', 'Window function'],
  fields: [
    {
      key: 'N',
      name: 'FFT SIZE',
      quantity: 'samples',
      placeholder: '4096',
      help: 'Points in the transform — usually a power of two (1024, 4096, 16384…).',
      warn: {
        test: (x) => x >= 2 && Math.abs(Math.log2(x) - Math.round(Math.log2(x))) > 1e-9,
        msg: 'Not a power of two — most FFT implementations expect one (the math here still holds).',
      },
    },
    {
      key: 'sr',
      name: 'SAMPLE RATE',
      quantity: 'samplerate',
      defaultUnit: 'srkhz',
      placeholder: '48',
      help: 'Samples per second feeding the FFT.',
      warn: { test: (x) => x < 8000 || x > 384000, msg: 'Outside the usual audio range (8 kHz – 384 kHz) — check the unit.' },
    },
    {
      key: 'fInterest',
      name: 'FREQUENCY OF INTEREST',
      quantity: 'frequency',
      placeholder: '100',
      help: 'A frequency whose cycles you want to count inside the analysis window.',
    },
    {
      key: 'df',
      name: 'TARGET RESOLUTION Δf',
      quantity: 'frequency',
      placeholder: '5',
      help: 'The bin spacing you need — e.g. the gap between two notes you must separate.',
    },
  ],
  functions: [
    {
      key: 'resFromSize',
      name: 'Resolution from FFT size',
      inputs: ['N', 'sr', 'fInterest'],
      formula: 'Δf = sr / N · T = N / sr · cycles = f · N / sr',
      plainFormula:
        'The bin spacing equals the sample rate over the FFT size; the window duration equals the FFT size over the sample rate; and the cycles in the window equal the frequency times the FFT size over the sample rate.',
      explain:
        'An FFT chops the spectrum into evenly spaced bins — spacing is sample rate over FFT size — while looking at one window of signal that long. It also counts how many cycles of a frequency fit in the window, since the FFT needs about one full cycle before it can place a component at all.',
      keySymbols: ['Δ', '/', '·', 'f'],
      compute: (v) => {
        const N = n(v.N);
        const sr = n(v.sr);
        return [
          { label: 'BIN SPACING', value: sr / N, quantity: 'frequency' },
          { label: 'WINDOW DURATION', value: N / sr, quantity: 'time', unit: 'ms' },
          { label: 'CYCLES OF YOUR FREQUENCY IN THE WINDOW', value: (n(v.fInterest) * N) / sr, quantity: 'number', chainable: false },
        ];
      },
      steps: (v) => {
        const N = n(v.N);
        const sr = n(v.sr);
        const f = n(v.fInterest);
        return [
          `Bin spacing Δf = ${fmt(sr)} Hz ÷ ${fmt(N)} points = ${fmt(sr / N)} Hz between bins.`,
          `The transform looks at ${fmt(N)} ÷ ${fmt(sr)} = ${fmt((N / sr) * 1000)} ms of signal at a time.`,
          `${fmt(f)} Hz completes ${fmt((f * N) / sr)} cycles inside that window — the FFT needs at least about one full cycle in the window before it can place a component at all.`,
        ];
      },
    },
    {
      key: 'sizeFromRes',
      name: 'FFT size for a target resolution (reverse)',
      inputs: ['df', 'sr'],
      formula: 'N = sr / Δf',
      plainFormula: 'The FFT size equals the sample rate divided by the target bin spacing.',
      explain:
        'The reverse: the FFT length needed to resolve two frequencies a target distance apart. FFTs want powers of two, so it rounds up — buying finer bins at the cost of a longer window. Check that the sound you are analyzing lasts at least that long.',
      keySymbols: ['/', 'Δ'],
      compute: (v) => {
        const sr = n(v.sr);
        const df = n(v.df);
        const N = sr / df;
        const pow2 = Math.pow(2, Math.ceil(Math.log2(Math.max(1, N))));
        return [
          { label: 'MINIMUM FFT SIZE', value: N, quantity: 'samples', chainable: false },
          { label: 'NEXT POWER OF TWO', text: `${fmtInt(pow2)} points` },
          { label: 'ACTUAL RESOLUTION AT THAT SIZE', value: sr / pow2, quantity: 'frequency' },
          { label: 'WINDOW AT THAT SIZE', value: pow2 / sr, quantity: 'time', unit: 'ms' },
        ];
      },
      steps: (v) => {
        const sr = n(v.sr);
        const df = n(v.df);
        const N = sr / df;
        const pow2 = Math.pow(2, Math.ceil(Math.log2(Math.max(1, N))));
        return [
          `N = ${fmt(sr)} Hz ÷ ${fmt(df)} Hz = ${fmt(N)} points minimum.`,
          `FFTs want powers of two, so round UP to ${fmtInt(pow2)}: actual spacing = ${fmt(sr)} ÷ ${fmtInt(pow2)} = ${fmt(sr / pow2)} Hz, with a ${fmt((pow2 / sr) * 1000)} ms window.`,
          `Rounding up buys finer bins at the cost of a longer window — check that the sound you are analyzing lasts at least that long.`,
        ];
      },
    },
    {
      key: 'tradeoff',
      name: 'Time–frequency tradeoff at a glance',
      inputs: ['N', 'sr'],
      formula: 'Δf · T = 1  (since Δf = sr/N and T = N/sr)',
      plainFormula:
        'The bin spacing times the window duration always equals one, because the spacing is the sample rate over the FFT size and the window is its inverse.',
      explain:
        'The time–frequency trade in one line: sharpen frequency detail and you lengthen the window, smearing timing by the same factor. The FFT size only chooses WHERE on that line you sit — you cannot have both sharp frequency and sharp timing from one transform.',
      keySymbols: ['Δ', '·', '/'],
      note: 'The product of bin spacing and window length is always exactly 1 — improving one side worsens the other by the same factor.',
      compute: (v) => {
        const N = n(v.N);
        const sr = n(v.sr);
        const df = sr / N;
        const T = N / sr;
        return [
          { label: 'BIN SPACING', value: df, quantity: 'frequency' },
          { label: 'WINDOW DURATION', value: T, quantity: 'time', unit: 'ms' },
          {
            label: 'THE TRADE',
            text:
              `With ${fmt(N)} points at ${fmt(sr)} Hz you resolve frequencies ${fmt(df)} Hz apart but ` +
              `average ${fmt(T * 1000)} ms of time per frame — double N for ${fmt(df / 2)} Hz bins and you ` +
              `smear ${fmt(T * 2000)} ms; halve it for ${fmt(T * 500)} ms frames and bins widen to ${fmt(df * 2)} Hz.`,
          },
        ];
      },
      steps: (v) => {
        const N = n(v.N);
        const sr = n(v.sr);
        return [
          `Δf = ${fmt(sr)} ÷ ${fmt(N)} = ${fmt(sr / N)} Hz; T = ${fmt(N)} ÷ ${fmt(sr)} = ${fmt((N / sr) * 1000)} ms.`,
          `Δf × T = ${fmt((sr / N) * (N / sr))} — always exactly 1. Frequency detail is bought with time, and time detail with frequency; the FFT size only chooses WHERE on that line you sit.`,
        ];
      },
    },
  ],
};

export const WORKSPACES_TIME: Workspace[] = [WS_DISTDELAY, WS_PHASE, WS_COMB, WS_LATENCY, WS_FFT];
