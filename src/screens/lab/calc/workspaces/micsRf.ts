/**
 * Workspaces — Mics & RF, SECOND TIER (owner buildout 2026-08-07):
 * Stereo-Mic Geometry · Mic Sensitivity Converter · RF & Link Budget.
 * Section 'mics'. Same pattern as wave.ts.
 *
 * RF frequency is entered in MHz through a numeric field (converted to Hz in
 * compute) rather than adding MHz to the audio frequency picker.
 */
import type { Workspace } from '../calcTypes';
import { fmt, speedOfSoundAir } from '../calcUnits';

const n = (v: number | number[]) => (typeof v === 'number' ? v : v[0] ?? NaN);
const DEG = Math.PI / 180;

const STEREOMIC: Workspace = {
  id: 'stereomic',
  name: 'Stereo-Mic Geometry',
  tagline: 'Spacing, arrival delay & the 3:1 rule',
  section: 'mics',
  reportPrefix: 'STEREO',
  intro:
    'Spaced microphones hear an off-axis source at slightly different times, and that delay is what ' +
    'builds the stereo image — and, if you mix the mics to mono, what combs the response. Enter the ' +
    'spacing and the source angle to see the arrival delay and where the first comb null lands.',
  whyItMatters:
    'It is the math behind AB, ORTF, and the classic 3:1 rule for multi-mic setups. Time-of-arrival ' +
    'delay creates width but risks mono comb filtering; the 3:1 rule keeps bleed between two spot ' +
    'mics low enough to stay clean when summed.',
  example:
    'A 40 cm spaced pair, source 30° off-centre (20 °C): path difference = 0.40·sin30° = 0.20 m, so ' +
    'Δt ≈ 0.58 ms and the first mono comb null sits at c/(2·0.20) ≈ 858 Hz.',
  mistakes: [
    'Spacing mics wide for "more stereo" then summing to mono — the arrival delay comb-filters the sound.',
    'Ignoring the 3:1 rule — a second mic should be at least 3× as far from the first mic as the first is from its source, or bleed combs the mix.',
    'Forgetting the angle matters — a source dead centre has zero delay; the comb only appears as the source moves off-axis.',
  ],
  warnings:
    'Geometric time-of-arrival model: path difference = spacing·sin(angle); Δt = path/ c; first comb ' +
    'null = c/(2·path). Real polar patterns, diffraction, and room reflections shift the audible ' +
    'result; this is the direct-path geometry only.',
  glossary: ['Stereo', 'Comb Filtering', 'Microphone (Mic)', 'Phase', 'Polar Pattern'],
  fields: [
    { key: 'spacing', name: 'MIC SPACING', quantity: 'length', defaultUnit: 'cm', placeholder: '40', help: 'Distance between the two microphone capsules.', warn: { test: (x) => x <= 0, msg: 'Spacing must be greater than zero.' } },
    { key: 'angle', name: 'SOURCE ANGLE', quantity: 'angle', placeholder: '30', help: 'Angle of the source off the array’s centre line.', warn: { test: (x) => x < 0 || x > 90, msg: 'Use 0–90° off centre.' } },
    { key: 'temp', name: 'AIR TEMPERATURE', quantity: 'temperature', placeholder: '20', help: 'Sets the speed of sound.' },
    { key: 'micDist', name: 'MIC-TO-SOURCE DISTANCE', quantity: 'length', placeholder: '0.3', help: 'Distance from a spot mic to its source, for the 3:1 rule.', warn: { test: (x) => x <= 0, msg: 'Distance must be greater than zero.' } },
  ],
  functions: [
    {
      key: 'pathDelay',
      name: 'Arrival delay & first comb null',
      inputs: ['spacing', 'angle', 'temp'],
      formula: 'path = spacing·sin(θ) · Δt = path/c · null = c/(2·path)',
      plainFormula:
        'The path difference equals the mic spacing times the sine of the source angle; the arrival delay equals that path divided by the speed of sound; and the first mono comb null is the speed of sound divided by twice the path difference.',
      explain:
        'Spaced mics hear an off-axis source at slightly different times — the delay that both builds the stereo image and, summed to mono, combs the response. This finds the extra distance to the farther mic, the arrival delay it creates, and the first cancellation frequency when the two mics are mixed to mono.',
      keySymbols: ['θ', 'Δ', '·', '/', 'c'],
      compute: (v) => {
        const c = speedOfSoundAir(n(v.temp));
        const path = n(v.spacing) * Math.sin(n(v.angle) * DEG);
        return [
          { label: 'PATH DIFFERENCE', value: path, quantity: 'length', unit: 'cm' },
          { label: 'ARRIVAL DELAY Δt', value: path / c, quantity: 'time', unit: 'ms' },
          { label: 'FIRST MONO COMB NULL', value: c / (2 * path), quantity: 'frequency', chainable: false },
        ];
      },
      steps: (v) => {
        const c = speedOfSoundAir(n(v.temp));
        const path = n(v.spacing) * Math.sin(n(v.angle) * DEG);
        return [
          `c = ${fmt(c)} m/s. Path difference = ${fmt(n(v.spacing))}·sin(${fmt(n(v.angle))}°) = ${fmt(path)} m.`,
          `Δt = ${fmt(path)} ÷ ${fmt(c)} = ${fmt((path / c) * 1000)} ms.`,
          `Summed to mono, the first null is at c/(2·path) = ${fmt(c / (2 * path))} Hz (nulls repeat at odd multiples).`,
        ];
      },
    },
    {
      key: 'threeToOne',
      name: '3:1 rule minimum spacing',
      inputs: ['micDist'],
      formula: 'min spacing = 3 × mic-to-source distance',
      plainFormula: 'The minimum mic spacing equals three times the distance from the first mic to its source.',
      explain:
        'The 3:1 rule for multi-mic setups: place a second mic at least three times as far from the first mic as the first mic sits from its source. At that spacing the bleed arrives about 9.5 dB down — quiet enough that summing the mics stays clean instead of comb-filtering.',
      keySymbols: ['×'],
      compute: (v) => {
        return [
          { label: 'MINIMUM MIC SPACING', value: 3 * n(v.micDist), quantity: 'length' },
          { label: 'BLEED LEVEL AT THAT SPACING', value: -20 * Math.log10(3), quantity: 'db', chainable: false },
        ];
      },
      steps: (v) => {
        return [
          `Minimum spacing = 3 × ${fmt(n(v.micDist))} m = ${fmt(3 * n(v.micDist))} m.`,
          `At 3× the distance the bleed arrives about ${fmt(-20 * Math.log10(3))} dB down — low enough that summing stays clean.`,
        ];
      },
    },
  ],
};

const MICSENS: Workspace = {
  id: 'micsens',
  name: 'Mic Sensitivity Converter',
  tagline: 'mV/Pa ↔︎ dBV/Pa & output at an SPL',
  section: 'mics',
  reportPrefix: 'SENS',
  intro:
    'Mic sensitivity is quoted two ways — millivolts per pascal, or decibels relative to 1 V/Pa. ' +
    'This converts between them and, given a real SPL at the capsule, tells you the output voltage ' +
    'in volts, dBu, and dBV so you can set gain with confidence.',
  whyItMatters:
    'It is how you compare a hot condenser to a quiet ribbon and predict how much preamp gain you ' +
    'need. Two mics on the same source can differ by 30–40 dB of output; sensitivity is the number ' +
    'that tells you before you plug in.',
  example:
    'A 15 mV/Pa condenser = 20·log₁₀(0.015) ≈ −36.5 dBV/Pa. At 94 dB SPL (1 Pa) it puts out 15 mV ' +
    '(≈ −34.3 dBu); at 114 dB SPL (10 Pa) it swings to 150 mV.',
  mistakes: [
    'Comparing a dBV/Pa number to a mV/Pa number directly — they’re the same quantity in different clothes; convert first.',
    'Forgetting the reference SPL — 94 dB SPL is exactly 1 Pa, the anchor sensitivity is quoted at.',
    'Assuming a "more sensitive" mic is always better — high output can overload a preamp on loud sources; it’s a matching question, not a quality one.',
  ],
  warnings:
    'Definitions: dBV/Pa = 20·log₁₀(mV/Pa ÷ 1000). Pressure from SPL: p = 20µPa·10^(SPL/20); output = ' +
    'sensitivity(V/Pa)·p. dBu referenced to 0.7746 V, dBV to 1 V. Ideal, pre-loading figures.',
  glossary: ['Sensitivity', 'Sound Pressure Level', 'Decibel', 'Microphone (Mic)', 'dBu'],
  fields: [
    { key: 'mvpa', name: 'SENSITIVITY (mV/Pa)', quantity: 'number', placeholder: '15', help: 'Output in millivolts for a 1 Pa (94 dB SPL) input.', warn: { test: (x) => x <= 0, msg: 'Sensitivity must be greater than zero.' } },
    { key: 'dbvpa', name: 'SENSITIVITY (dBV/Pa)', quantity: 'number', placeholder: '-36.5', help: 'Output in dB relative to 1 V/Pa.' },
    { key: 'spl', name: 'SOUND PRESSURE LEVEL', quantity: 'spl', placeholder: '94', help: 'SPL at the capsule to find the output for.', warn: { test: (x) => x < 0, msg: 'SPL cannot be negative.' } },
  ],
  functions: [
    {
      key: 'mvToDb',
      name: 'mV/Pa → dBV/Pa',
      inputs: ['mvpa'],
      formula: 'dBV/Pa = 20·log₁₀(mV/Pa ÷ 1000)',
      plainFormula:
        'The sensitivity in dBV per pascal equals twenty times the base-ten logarithm of the millivolts-per-pascal figure divided by one thousand.',
      explain:
        'Mic sensitivity is quoted two ways; this converts millivolts-per-pascal into decibels relative to 1 V/Pa. Because it is a voltage ratio it uses twenty times the base-ten log, and dividing by 1000 turns millivolts into volts before comparing to the 1 V reference.',
      keySymbols: ['·', 'log₁₀', '÷'],
      compute: (v) => {
        return [{ label: 'SENSITIVITY (dBV/Pa)', value: 20 * Math.log10(n(v.mvpa) / 1000), quantity: 'number' }];
      },
      steps: (v) => [
        `dBV/Pa = 20·log₁₀(${fmt(n(v.mvpa))} mV ÷ 1000) = ${fmt(20 * Math.log10(n(v.mvpa) / 1000))} dBV/Pa.`,
      ],
    },
    {
      key: 'dbToMv',
      name: 'dBV/Pa → mV/Pa',
      inputs: ['dbvpa'],
      formula: 'mV/Pa = 1000 · 10^(dBV/Pa ÷ 20)',
      plainFormula:
        'The millivolts per pascal equals one thousand times ten raised to the dBV-per-pascal value divided by twenty.',
      explain:
        'The reverse conversion — from decibels relative to 1 V/Pa back to millivolts per pascal. It undoes the twenty-times-log by raising ten to the value over twenty, then multiplies by 1000 to express the result in millivolts.',
      keySymbols: ['·', 'x²', '÷'],
      compute: (v) => {
        return [{ label: 'SENSITIVITY (mV/Pa)', value: 1000 * Math.pow(10, n(v.dbvpa) / 20), quantity: 'number' }];
      },
      steps: (v) => [
        `mV/Pa = 1000 · 10^(${fmt(n(v.dbvpa))} ÷ 20) = ${fmt(1000 * Math.pow(10, n(v.dbvpa) / 20))} mV/Pa.`,
      ],
    },
    {
      key: 'outputAtSPL',
      name: 'Output voltage at an SPL',
      inputs: ['mvpa', 'spl'],
      formula: 'V = (mV/Pa ÷ 1000) · 20µPa·10^(SPL/20)',
      plainFormula:
        'The output voltage equals the sensitivity in volts per pascal (millivolts per pascal over one thousand) times the sound pressure — where the pressure is 20 micropascals times ten raised to the SPL over twenty.',
      explain:
        'Given a real SPL at the capsule, this predicts the output voltage. It turns the SPL into an actual pressure in pascals (20 µPa is the 0 dB SPL reference), then multiplies by the mic’s sensitivity in volts per pascal. The result is also shown in dBu and dBV for setting preamp gain.',
      keySymbols: ['·', '÷', 'µ', 'x²'],
      compute: (v) => {
        const sens = n(v.mvpa) / 1000; // V/Pa
        const p = 2e-5 * Math.pow(10, n(v.spl) / 20); // Pa
        const vout = sens * p;
        return [
          { label: 'OUTPUT VOLTAGE', value: vout, quantity: 'voltage', unit: 'mv' },
          { label: 'OUTPUT LEVEL (dBu)', value: 20 * Math.log10(vout / 0.7746), quantity: 'number', chainable: false },
          { label: 'OUTPUT LEVEL (dBV)', value: 20 * Math.log10(vout), quantity: 'number', chainable: false },
        ];
      },
      steps: (v) => {
        const sens = n(v.mvpa) / 1000;
        const p = 2e-5 * Math.pow(10, n(v.spl) / 20);
        const vout = sens * p;
        return [
          `${fmt(n(v.spl))} dB SPL → pressure p = 20µPa·10^(${fmt(n(v.spl))}/20) = ${fmt(p)} Pa.`,
          `V = ${fmt(sens)} V/Pa × ${fmt(p)} Pa = ${fmt(vout * 1000)} mV.`,
          `That is ${fmt(20 * Math.log10(vout / 0.7746))} dBu (${fmt(20 * Math.log10(vout))} dBV).`,
        ];
      },
    },
  ],
};

const RFLINK: Workspace = {
  id: 'rflink',
  name: 'RF & Link Budget',
  tagline: 'Path loss, received power & link margin',
  section: 'mics',
  reportPrefix: 'RF',
  intro:
    'Wireless mics and IEMs live or die by their RF link budget. Free-space path loss grows with ' +
    'distance and frequency; add the transmit power and antenna gains, subtract the loss, and ' +
    'compare to the receiver’s sensitivity to get your link margin. Enter frequency in MHz.',
  whyItMatters:
    'A positive, comfortable margin is the difference between a rock-solid show and dropouts when ' +
    'someone walks behind a wall. Higher bands (like today’s crowded UHF) lose more per metre, and ' +
    'antenna gain and cable loss are the levers you actually control.',
  example:
    'A 550 MHz link at 50 m: FSPL = 20·log₁₀(50) + 20·log₁₀(550e6) − 147.56 ≈ 61.2 dB. With +10 dBm ' +
    'TX, +2 dB each antenna, and a −95 dBm receiver: Prx ≈ −37.2 dBm → ≈ 57.8 dB of margin.',
  mistakes: [
    'Budgeting for line-of-sight only — bodies, walls, and trusses add loss the free-space number ignores; keep generous margin.',
    'Forgetting higher frequencies lose more — the same distance costs more dB at 600 MHz than at 500 MHz.',
    'Ignoring cable and connector loss on antenna runs — it comes straight off both transmit and receive sides of the budget.',
  ],
  warnings:
    'Free-space (Friis) path loss only: FSPL(dB) = 20·log₁₀(d) + 20·log₁₀(f) − 147.56 (d in m, f in ' +
    'Hz). Real environments add multipath, body and obstruction loss, and noise — always keep margin ' +
    'well above zero. Enter frequency in MHz; powers in dBm.',
  glossary: ['Radio Frequency', 'Wireless', 'Decibel', 'Antenna', 'Gain'],
  fields: [
    { key: 'dist', name: 'LINK DISTANCE', quantity: 'length', placeholder: '50', help: 'Transmitter-to-receiver distance.', warn: { test: (x) => x <= 0, msg: 'Distance must be greater than zero.' } },
    { key: 'freqMHz', name: 'FREQUENCY (MHz)', quantity: 'number', placeholder: '550', help: 'RF carrier frequency in megahertz.', warn: { test: (x) => x <= 0, msg: 'Frequency must be greater than zero.' } },
    { key: 'ptx', name: 'TRANSMIT POWER (dBm)', quantity: 'number', placeholder: '10', help: 'Transmitter output power in dBm (10 dBm = 10 mW).' },
    { key: 'gtx', name: 'TX ANTENNA GAIN', quantity: 'db', placeholder: '2', help: 'Transmit antenna gain (dBi), minus any cable loss.' },
    { key: 'grx', name: 'RX ANTENNA GAIN', quantity: 'db', placeholder: '2', help: 'Receive antenna gain (dBi), minus any cable loss.' },
    { key: 'rxsens', name: 'RECEIVER SENSITIVITY (dBm)', quantity: 'number', placeholder: '-95', help: 'The weakest signal the receiver works with, in dBm.' },
  ],
  functions: [
    {
      key: 'pathLoss',
      name: 'Free-space path loss',
      inputs: ['dist', 'freqMHz'],
      formula: 'FSPL = 20·log₁₀(d) + 20·log₁₀(f) − 147.56',
      plainFormula:
        'The free-space path loss in dB equals twenty times the base-ten log of the distance, plus twenty times the base-ten log of the frequency, minus 147.56.',
      explain:
        'Free-space (Friis) path loss — how much a radio signal weakens over a distance at a given frequency. Both distance and frequency raise the loss, so higher bands lose more per metre; 147.56 is the constant that makes it work with distance in metres and frequency in hertz. Walls and bodies add more on top.',
      keySymbols: ['·', 'log₁₀', '−', 'f'],
      compute: (v) => {
        const f = n(v.freqMHz) * 1e6;
        const fspl = 20 * Math.log10(n(v.dist)) + 20 * Math.log10(f) - 147.56;
        return [
          { label: 'FREE-SPACE PATH LOSS', value: fspl, quantity: 'db' },
          { label: 'WAVELENGTH', value: 299792458 / f, quantity: 'length', unit: 'cm', chainable: false },
        ];
      },
      steps: (v) => {
        const f = n(v.freqMHz) * 1e6;
        const fspl = 20 * Math.log10(n(v.dist)) + 20 * Math.log10(f) - 147.56;
        return [
          `FSPL = 20·log₁₀(${fmt(n(v.dist))}) + 20·log₁₀(${fmt(f)}) − 147.56 = ${fmt(fspl)} dB.`,
          `RF wavelength = c/f = 3×10⁸ ÷ ${fmt(f)} ≈ ${fmt((299792458 / f) * 100)} cm — antenna-length territory.`,
        ];
      },
    },
    {
      key: 'budget',
      name: 'Received power & link margin',
      inputs: ['ptx', 'gtx', 'grx', 'dist', 'freqMHz', 'rxsens'],
      formula: 'Prx = Ptx + Gtx + Grx − FSPL · margin = Prx − Rx sens',
      plainFormula:
        'The received power equals the transmit power plus the transmit and receive antenna gains minus the path loss; the link margin equals the received power minus the receiver sensitivity.',
      explain:
        'The RF link budget. It adds everything that helps the signal (transmit power, both antenna gains) and subtracts the free-space path loss to get the power at the receiver, then compares that to the receiver’s sensitivity. A comfortable positive margin is what keeps a wireless mic solid when a performer walks behind an obstruction.',
      keySymbols: ['−'],
      compute: (v) => {
        const f = n(v.freqMHz) * 1e6;
        const fspl = 20 * Math.log10(n(v.dist)) + 20 * Math.log10(f) - 147.56;
        const prx = n(v.ptx) + n(v.gtx) + n(v.grx) - fspl;
        return [
          { label: 'RECEIVED POWER (dBm)', value: prx, quantity: 'number', chainable: false },
          { label: 'PATH LOSS', value: fspl, quantity: 'db', chainable: false },
          { label: 'LINK MARGIN', value: prx - n(v.rxsens), quantity: 'db' },
        ];
      },
      steps: (v) => {
        const f = n(v.freqMHz) * 1e6;
        const fspl = 20 * Math.log10(n(v.dist)) + 20 * Math.log10(f) - 147.56;
        const prx = n(v.ptx) + n(v.gtx) + n(v.grx) - fspl;
        const margin = prx - n(v.rxsens);
        return [
          `FSPL at ${fmt(n(v.dist))} m / ${fmt(n(v.freqMHz))} MHz = ${fmt(fspl)} dB.`,
          `Prx = ${fmt(n(v.ptx))} + ${fmt(n(v.gtx))} + ${fmt(n(v.grx))} − ${fmt(fspl)} = ${fmt(prx)} dBm.`,
          `Margin = ${fmt(prx)} − (${fmt(n(v.rxsens))}) = ${fmt(margin)} dB. ${margin < 10 ? 'Under ~10 dB is risky — add gain or shorten the path.' : 'Comfortable margin for a moving performer.'}`,
        ];
      },
    },
  ],
};

export const WORKSPACES_MICS_RF: Workspace[] = [STEREOMIC, MICSENS, RFLINK];
