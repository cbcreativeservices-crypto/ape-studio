/**
 * Workspaces: Levels · Ohm's law & power · Basic electronics · Q & bandwidth.
 * Authored to the WS_WAVE exemplar (see ./wave.ts): every function is an
 * explicit solve direction with worked steps that substitute the user's
 * numbers — no symbolic algebra, no hidden unit tricks.
 */
import type { Workspace } from '../calcTypes';
import { fmt } from '../calcUnits';

const n = (v: number | number[]) => (typeof v === 'number' ? v : v[0] ?? NaN);
const arr = (v: number | number[]) => (Array.isArray(v) ? v : [v]);

const log10 = Math.log10;
const log2 = Math.log2;

/** dBu ↔︎ dBV offset: 20·log10(0.775) ≈ −2.2185 dB (dBu reads HIGHER). */
const DBU_DBV_OFFSET = 20 * log10(0.775);

// ---------------------------------------------------------------------------
// 1 · Audio Level Converter
// ---------------------------------------------------------------------------

const WS_LEVEL: Workspace = {
  id: 'level',
  name: 'Audio Level Converter',
  tagline: 'dBu · dBV · voltage · amplitude & power ratios',
  section: 'levels',
  intro:
    'The translator between the meter and the wire. Convert professional (dBu) and consumer ' +
    '(dBV) levels to real voltages and back, and turn any linear ratio into decibels — with the ' +
    'amplitude-vs-power distinction spelled out every single time, because that is where nearly ' +
    'every dB mistake is born.',
  whyItMatters:
    'Gain staging is arithmetic in dB but physics in volts. Knowing that +4 dBu is 1.228 V while ' +
    '−10 dBV is 0.316 V explains the ~12 dB gap between pro and consumer gear, why an interface ' +
    'input clips, and what a "+6 dB" fader move actually does to the signal (doubles voltage, ' +
    'quadruples power). Every patchbay, DI box, and interface spec sheet speaks this language.',
  example:
    'A console outputs +4 dBu: V = 0.775 × 10^(4/20) ≈ 1.228 V. A consumer device expects ' +
    '−10 dBV ≈ 0.316 V. The real level gap is 20·log10(1.228/0.316) ≈ 11.8 dB — the famous ' +
    '"about 12 dB" difference between pro and consumer line level, and why plugging one into ' +
    'the other without matching sounds too hot or too weak.',
  mistakes: [
    'Using 10·log10 on a voltage ratio (or 20·log10 on a power ratio) — amplitude quantities use 20, power quantities use 10. Same dB result describes both only because power goes as voltage squared.',
    'Treating dBu and dBV as interchangeable — they differ by a fixed 2.22 dB (dBu reads higher for the same voltage) because their references differ: 0.775 V vs 1 V.',
    'Reading "−10 dBV" as "−10 dBu" on a spec sheet — the pro/consumer gap is ≈ 11.8 dB, not 14 dB.',
    'Expecting +3 dB to sound twice as loud — it is double the POWER, but roughly a just-noticeable step; perceived doubling of loudness needs about +10 dB.',
    'Converting a DAW meter reading (dBFS) to volts with this tool — impossible without knowing the converter’s alignment level.',
    'Saying a signal was "reduced by 200%" — a 100% reduction is already silence; percent changes below −100% are meaningless for amplitude.',
  ],
  warnings:
    'dBFS CANNOT be converted to dBu or dBV here: the mapping depends entirely on the ' +
    'converter’s alignment reference (e.g. −18 dBFS = +4 dBu is one common calibration, not a ' +
    'law), so this tool deliberately refuses to pretend otherwise. Likewise dBm is POWER ' +
    'referenced (1 mW) and needs the load impedance to become a voltage. Both belong to the ' +
    'Tier-2 "Analog Alignment" workspace.',
  glossary: ['Decibel', 'dBu', 'dBV', 'dBFS', 'Gain', 'Voltage'],
  fields: [
    { key: 'dbu', name: 'LEVEL (dBu)', quantity: 'db', placeholder: '4', help: 'Level referenced to 0.775 V RMS — the professional line-level scale.' },
    { key: 'vFromDbu', name: 'VOLTAGE', quantity: 'voltage', placeholder: '1.228', help: 'RMS signal voltage to express on the dBu scale.', warn: { test: (x) => x <= 0, msg: 'Voltage must be positive — dB scales have no level for 0 V or negative RMS values.' } },
    { key: 'dbv', name: 'LEVEL (dBV)', quantity: 'db', placeholder: '-10', help: 'Level referenced to 1 V RMS — the consumer line-level scale.' },
    { key: 'vFromDbv', name: 'VOLTAGE', quantity: 'voltage', placeholder: '0.316', help: 'RMS signal voltage to express on the dBV scale.', warn: { test: (x) => x <= 0, msg: 'Voltage must be positive — dB scales have no level for 0 V or negative RMS values.' } },
    { key: 'dbx', name: 'LEVEL (dBu or dBV)', quantity: 'db', placeholder: '4', help: 'A level on either scale — the converter shows both readings of the same voltage.' },
    { key: 'ampRatio', name: 'AMPLITUDE RATIO', quantity: 'ratio', placeholder: '2', help: 'Linear ratio of voltages, sound pressures, or fader positions (out ÷ in).', warn: { test: (x) => x <= 0, msg: 'Ratio must be positive — a zero or negative ratio has no dB value.' } },
    { key: 'powRatio', name: 'POWER RATIO', quantity: 'ratio', placeholder: '2', help: 'Linear ratio of powers or intensities (out ÷ in) — watts, not volts.', warn: { test: (x) => x <= 0, msg: 'Ratio must be positive — a zero or negative ratio has no dB value.' } },
    { key: 'dbAmp', name: 'LEVEL CHANGE', quantity: 'db', placeholder: '6', help: 'Gain or attenuation in dB to convert back to an amplitude (voltage) ratio.' },
    { key: 'dbPow', name: 'LEVEL CHANGE', quantity: 'db', placeholder: '3', help: 'Gain or attenuation in dB to convert back to a power (wattage) ratio.' },
    { key: 'pct', name: 'PERCENT CHANGE', quantity: 'percent', placeholder: '50', help: 'Change in an amplitude quantity: +50 means half again louder in voltage, −50 means half the voltage.', warn: { test: (x) => x <= -100, msg: '−100% is already silence — amplitude cannot drop by more than 100%.' } },
  ],
  functions: [
    {
      key: 'dbuToV',
      name: 'Voltage from dBu',
      inputs: ['dbu'],
      formula: 'V = 0.775 · 10^(dBu/20)',
      plainFormula: 'The voltage equals 0.775 volts times ten raised to the dBu level over twenty.',
      explain:
        'dBu is referenced to 0.775 V RMS, the professional line-level scale. This undoes the twenty-times-log to recover the actual RMS voltage, and shows the same level in dBV. The 20 (not 10) is because voltage is an amplitude quantity.',
      keySymbols: ['·', 'x²'],
      compute: (v) => {
        const volts = 0.775 * Math.pow(10, n(v.dbu) / 20);
        return [
          { label: 'VOLTAGE (RMS)', value: volts, quantity: 'voltage' },
          { label: 'SAME LEVEL IN dBV', value: n(v.dbu) + DBU_DBV_OFFSET, quantity: 'db', chainable: false },
        ];
      },
      steps: (v) => {
        const d = n(v.dbu);
        const volts = 0.775 * Math.pow(10, d / 20);
        return [
          `dBu is referenced to 0.775 V RMS, so undo the 20·log with a power of ten.`,
          `V = 0.775 × 10^(${fmt(d)}/20) = 0.775 × ${fmt(Math.pow(10, d / 20))} = ${fmt(volts)} V RMS.`,
        ];
      },
    },
    {
      key: 'vToDbu',
      name: 'dBu from voltage',
      inputs: ['vFromDbu'],
      formula: 'dBu = 20 · log10(V / 0.775)',
      plainFormula: 'The dBu level equals twenty times the base-ten log of the voltage divided by 0.775.',
      explain:
        'Expresses an RMS voltage on the professional dBu scale (referenced to 0.775 V). Voltage is an amplitude, so the multiplier is 20 — doubling the voltage is +6 dB.',
      keySymbols: ['·', 'log₁₀', '/'],
      compute: (v) => [{ label: 'LEVEL', value: 20 * log10(n(v.vFromDbu) / 0.775), quantity: 'db' }],
      steps: (v) => {
        const volts = n(v.vFromDbu);
        return [
          `Compare the voltage to the 0.775 V reference, then take 20·log (voltage is an AMPLITUDE, so the multiplier is 20).`,
          `dBu = 20 × log10(${fmt(volts)} ÷ 0.775) = 20 × log10(${fmt(volts / 0.775)}) = ${fmt(20 * log10(volts / 0.775))} dBu.`,
        ];
      },
    },
    {
      key: 'dbvToV',
      name: 'Voltage from dBV',
      inputs: ['dbv'],
      formula: 'V = 10^(dBV/20)',
      plainFormula: 'The voltage equals ten raised to the dBV level over twenty.',
      explain:
        'dBV is referenced to exactly 1 V RMS — the consumer line-level scale — so the reference divides away and the voltage is simply ten to the level over twenty. It also shows the same level in dBu.',
      keySymbols: ['x²'],
      compute: (v) => {
        const volts = Math.pow(10, n(v.dbv) / 20);
        return [
          { label: 'VOLTAGE (RMS)', value: volts, quantity: 'voltage' },
          { label: 'SAME LEVEL IN dBu', value: n(v.dbv) - DBU_DBV_OFFSET, quantity: 'db', chainable: false },
        ];
      },
      steps: (v) => {
        const d = n(v.dbv);
        return [
          `dBV is referenced to exactly 1 V RMS, so the reference divides away.`,
          `V = 10^(${fmt(d)}/20) = ${fmt(Math.pow(10, d / 20))} V RMS.`,
        ];
      },
    },
    {
      key: 'vToDbv',
      name: 'dBV from voltage',
      inputs: ['vFromDbv'],
      formula: 'dBV = 20 · log10(V / 1)',
      plainFormula: 'The dBV level equals twenty times the base-ten log of the voltage divided by one.',
      explain:
        'Expresses a voltage on the consumer dBV scale (referenced to 1 V), so the ratio is just the voltage itself. The 20 multiplier is because voltage is an amplitude quantity.',
      keySymbols: ['·', 'log₁₀', '/'],
      compute: (v) => [{ label: 'LEVEL', value: 20 * log10(n(v.vFromDbv)), quantity: 'db' }],
      steps: (v) => {
        const volts = n(v.vFromDbv);
        return [
          `The dBV reference is 1 V, so the ratio is just the voltage itself; the multiplier is 20 because voltage is an amplitude.`,
          `dBV = 20 × log10(${fmt(volts)}) = ${fmt(20 * log10(volts))} dBV.`,
        ];
      },
    },
    {
      key: 'dbuDbv',
      name: 'dBu ↔︎ dBV',
      inputs: ['dbx'],
      formula: 'dBV = dBu − 2.218 · dBu = dBV + 2.218',
      plainFormula:
        'A dBV reading equals the dBu reading minus 2.218; a dBu reading equals the dBV reading plus 2.218.',
      explain:
        'The two scales measure the same voltage against different references — dBu against 0.775 V, dBV against 1 V — so they differ by a fixed 2.218 dB (dBu always reads higher). Converting between them is a single addition.',
      keySymbols: ['−', '·'],
      note: 'The offset is exact: 20·log10(0.775 V ÷ 1 V) ≈ −2.218 dB. The same voltage always reads 2.218 dB HIGHER in dBu.',
      compute: (v) => {
        const x = n(v.dbx);
        return [
          { label: 'IF THIS IS dBu → in dBV', value: x + DBU_DBV_OFFSET, quantity: 'db' },
          { label: 'IF THIS IS dBV → in dBu', value: x - DBU_DBV_OFFSET, quantity: 'db' },
        ];
      },
      steps: (v) => {
        const x = n(v.dbx);
        return [
          `The two scales measure the same voltage against different references: dBu against 0.775 V, dBV against 1 V.`,
          `Offset = 20 × log10(0.775 ÷ 1) = ${fmt(DBU_DBV_OFFSET)} dB — a constant, so converting is one addition.`,
          `${fmt(x)} dBu = ${fmt(x)} + (${fmt(DBU_DBV_OFFSET)}) = ${fmt(x + DBU_DBV_OFFSET)} dBV; ${fmt(x)} dBV = ${fmt(x)} − (${fmt(DBU_DBV_OFFSET)}) = ${fmt(x - DBU_DBV_OFFSET)} dBu.`,
        ];
      },
    },
    {
      key: 'ampToDb',
      name: 'dB from an AMPLITUDE ratio (voltage, SPL pressure)',
      inputs: ['ampRatio'],
      formula: 'dB = 20 · log10(ratio)',
      plainFormula: 'The level change in dB equals twenty times the base-ten log of the amplitude ratio.',
      explain:
        'Amplitude quantities — voltage, sound pressure, fader gain — use the 20 multiplier. Power goes as amplitude squared, and squaring inside a log doubles it, which is the whole reason amplitudes use 20 where power uses 10. Doubling voltage is +6 dB.',
      keySymbols: ['·', 'log₁₀'],
      note: 'Amplitude quantities — voltage, sound pressure, fader gain — use the 20 multiplier.',
      compute: (v) => [{ label: 'LEVEL CHANGE', value: 20 * log10(n(v.ampRatio)), quantity: 'db' }],
      steps: (v) => {
        const r = n(v.ampRatio);
        return [
          `Voltage is an AMPLITUDE. Power goes as amplitude SQUARED (P = V²/Z), and squaring inside a log doubles it — that is the entire reason amplitude uses 20 where power uses 10.`,
          `dB = 20 × log10(${fmt(r)}) = ${fmt(20 * log10(r))} dB.`,
          `Sanity anchor: ×2 in voltage = +6.02 dB; the same ×2 in POWER would be only +3.01 dB.`,
        ];
      },
    },
    {
      key: 'powToDb',
      name: 'dB from a POWER ratio (watts, intensity)',
      inputs: ['powRatio'],
      formula: 'dB = 10 · log10(ratio)',
      plainFormula: 'The level change in dB equals ten times the base-ten log of the power ratio.',
      explain:
        'Power quantities — watts, acoustic intensity — use the 10 multiplier. Doubling power is +3 dB. It agrees with the amplitude formula because doubling voltage quadruples power: 20·log(2) equals 10·log(4).',
      keySymbols: ['·', 'log₁₀'],
      note: 'Power quantities — watts, acoustic intensity — use the 10 multiplier.',
      compute: (v) => [{ label: 'LEVEL CHANGE', value: 10 * log10(n(v.powRatio)), quantity: 'db' }],
      steps: (v) => {
        const r = n(v.powRatio);
        return [
          `Watts are POWER, so the multiplier is 10 — the decibel is literally ten bels of power ratio.`,
          `dB = 10 × log10(${fmt(r)}) = ${fmt(10 * log10(r))} dB.`,
          `Why not 20? The 20 belongs to amplitudes: doubling the VOLTAGE quadruples the power (V² ÷ Z), so the same physical change is +6 dB either way — 20·log10(2) in volts equals 10·log10(4) in watts. Use 20 for amplitudes, 10 for powers, and the two scales agree.`,
        ];
      },
    },
    {
      key: 'dbToAmp',
      name: 'Amplitude ratio from dB',
      inputs: ['dbAmp'],
      formula: 'ratio = 10^(dB/20)',
      plainFormula: 'The amplitude ratio equals ten raised to the dB change over twenty.',
      explain:
        'Undoes the amplitude (twenty-times-log) formula to recover a voltage ratio from a dB change, and shows it as a percent of the original. A +6 dB move doubles the voltage.',
      keySymbols: ['x²', '/'],
      compute: (v) => {
        const r = Math.pow(10, n(v.dbAmp) / 20);
        return [
          { label: 'AMPLITUDE RATIO', value: r, quantity: 'ratio' },
          { label: 'PERCENT OF ORIGINAL', value: r * 100, quantity: 'percent', chainable: false },
        ];
      },
      steps: (v) => {
        const d = n(v.dbAmp);
        const r = Math.pow(10, d / 20);
        return [
          `Undo the amplitude (20·log) formula with a power of ten.`,
          `ratio = 10^(${fmt(d)}/20) = ${fmt(r)}× — the signal voltage becomes ${fmt(r * 100)}% of the original.`,
        ];
      },
    },
    {
      key: 'dbToPow',
      name: 'Power ratio from dB',
      inputs: ['dbPow'],
      formula: 'ratio = 10^(dB/10)',
      plainFormula: 'The power ratio equals ten raised to the dB change over ten.',
      explain:
        'Undoes the power (ten-times-log) formula to recover a wattage ratio from a dB change — divisor 10, not 20, because watts are power. A +3 dB move doubles the power.',
      keySymbols: ['x²', '/'],
      compute: (v) => {
        const r = Math.pow(10, n(v.dbPow) / 10);
        return [
          { label: 'POWER RATIO', value: r, quantity: 'ratio' },
          { label: 'PERCENT OF ORIGINAL POWER', value: r * 100, quantity: 'percent', chainable: false },
        ];
      },
      steps: (v) => {
        const d = n(v.dbPow);
        const r = Math.pow(10, d / 10);
        return [
          `Undo the power (10·log) formula with a power of ten — divisor 10, not 20, because watts are power.`,
          `ratio = 10^(${fmt(d)}/10) = ${fmt(r)}× the original power (${fmt(r * 100)}%).`,
        ];
      },
    },
    {
      key: 'pctToDb',
      name: 'dB from a percent change',
      inputs: ['pct'],
      formula: 'dB = 20 · log10(1 + %/100)',
      plainFormula:
        'The level change in dB equals twenty times the base-ten log of one plus the percent change over 100.',
      explain:
        'Turns a percent change in an amplitude quantity (voltage, pressure) into decibels. A percent change in POWER would use ten-times-log instead — always name which quantity your percentage describes, since an amplitude can never drop by more than 100%.',
      keySymbols: ['·', 'log₁₀', '/', '%'],
      note: 'For AMPLITUDE quantities (voltage, pressure). A percent change in POWER would use 10·log10 instead.',
      compute: (v) => {
        const p = n(v.pct);
        return [
          { label: 'LEVEL CHANGE', value: 20 * log10(1 + p / 100), quantity: 'db' },
          { label: 'RESULTING AMPLITUDE RATIO', value: 1 + p / 100, quantity: 'ratio', chainable: false },
        ];
      },
      steps: (v) => {
        const p = n(v.pct);
        const r = 1 + p / 100;
        return [
          `A ${fmt(p)}% change means the amplitude becomes ${fmt(r)}× the original (1 + ${fmt(p)}/100).`,
          `dB = 20 × log10(${fmt(r)}) = ${fmt(20 * log10(r))} dB.`,
          `If the ${fmt(p)}% change were in POWER (watts) instead, the answer would be 10 × log10(${fmt(r)}) = ${fmt(10 * log10(r))} dB — always name which quantity your percentage describes.`,
        ];
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// 2 · Power · Voltage · Current · Impedance
// ---------------------------------------------------------------------------

const WS_OHMS: Workspace = {
  id: 'ohmspower',
  name: 'Power · Voltage · Current · Impedance',
  tagline: 'Ohm’s law + power for speaker & amp circuits',
  section: 'speakers',
  intro:
    'The four electrical quantities of every amp-to-speaker connection, each solvable from any ' +
    'two of the others: P = V²/Z = V·I = I²·Z. Plus the RMS · peak · peak-to-peak triangle, ' +
    'because every one of these formulas assumes RMS and every oscilloscope shows peaks.',
  whyItMatters:
    'This is how you size an amplifier, check whether a cable run or a load will cook, and read ' +
    'a spec sheet honestly. "100 W into 8 Ω" is really a statement about ~28 V RMS and ~3.5 A — ' +
    'and knowing that a 4 Ω load draws double the current from the same voltage is the ' +
    'difference between a loud show and a thermal shutdown.',
  example:
    'Delivering 100 W into an 8 Ω speaker: V = √(P·Z) = √800 ≈ 28.3 V RMS, and the current is ' +
    'I = P/V = 100 ÷ 28.3 ≈ 3.54 A. On a scope that RMS sine shows as a 40 V peak (28.3 × √2), ' +
    '80 V peak-to-peak — the amp’s rails must clear it with headroom to spare.',
  mistakes: [
    'Plugging PEAK voltage into the RMS formulas — a 40 V-peak sine is 28.3 V RMS; using 40 doubles your computed power.',
    'Treating a speaker’s "8 Ω nominal" as a constant — real impedance swings with frequency, often dipping near half the nominal figure at some frequencies.',
    'Doubling amplifier power and expecting double loudness — ×2 power is +3 dB, a barely-noticeable step; perceived doubling needs about ten times the power.',
    'Halving the load (8 Ω → 4 Ω) without checking the amp — same voltage into half the impedance means DOUBLE the current and double the power demand.',
    'Mixing RMS voltage with peak current (or vice versa) in P = V·I — both must be RMS for average power.',
  ],
  warnings:
    'These are sine-wave, resistive-load teaching calculations. A loudspeaker is a reactive load ' +
    'whose impedance varies with frequency, and music is not a sine wave — real amplifier power ' +
    'ratings follow formal methods (IEC 60268-3/-5), which this tool models but does not replace.',
  glossary: ['Power', 'Voltage', 'Current', 'Impedance', 'RMS', 'Amplifier', 'Loudspeaker'],
  fields: [
    { key: 'vrms', name: 'VOLTAGE (RMS)', quantity: 'voltage', placeholder: '28.3', help: 'RMS signal voltage across the load — what all the power formulas assume.', warn: { test: (x) => x <= 0, msg: 'Voltage must be positive.' } },
    { key: 'z', name: 'IMPEDANCE', quantity: 'impedance', placeholder: '8', help: 'Load impedance (nominal) — treated as a plain resistance in this model.', warn: { test: (x) => x <= 0, msg: 'Impedance must be positive — 0 Ω is a short circuit.' } },
    { key: 'p', name: 'POWER', quantity: 'power', placeholder: '100', help: 'Average (RMS) power delivered to the load.', warn: { test: (x) => x <= 0, msg: 'Power must be positive.' } },
    { key: 'vpk', name: 'PEAK VOLTAGE', quantity: 'voltage', placeholder: '40', help: 'The waveform’s crest voltage, as read on an oscilloscope.', warn: { test: (x) => x <= 0, msg: 'Peak voltage must be positive.' } },
  ],
  functions: [
    {
      key: 'pFromVZ',
      name: 'Power from voltage & impedance',
      inputs: ['vrms', 'z'],
      formula: 'P = V² / Z',
      plainFormula: 'The power equals the voltage squared divided by the impedance.',
      explain:
        'One form of the power law for an amp-to-speaker circuit: from the RMS voltage across the load and its impedance, the power dissipated — and the current that flows with it. All these formulas assume RMS voltage.',
      keySymbols: ['x²', '/', 'Z'],
      compute: (v) => {
        const V = n(v.vrms);
        const Z = n(v.z);
        return [
          { label: 'POWER', value: (V * V) / Z, quantity: 'power' },
          { label: 'CURRENT', value: V / Z, quantity: 'current' },
        ];
      },
      steps: (v) => {
        const V = n(v.vrms);
        const Z = n(v.z);
        return [
          `P = V² ÷ Z = ${fmt(V)}² ÷ ${fmt(Z)} = ${fmt(V * V)} ÷ ${fmt(Z)} = ${fmt((V * V) / Z)} W.`,
          `The current follows from Ohm’s law: I = V ÷ Z = ${fmt(V)} ÷ ${fmt(Z)} = ${fmt(V / Z)} A.`,
        ];
      },
    },
    {
      key: 'powerFromPeak',
      name: 'Amplifier power from PEAK voltage',
      inputs: ['vpk', 'z'],
      formula: 'Vrms = Vpeak/√2 · P = Vrms² / Z',
      plainFormula:
        'The RMS voltage equals the peak voltage over root two; the power equals that RMS voltage squared over the impedance.',
      explain:
        'An oscilloscope shows PEAK volts, but every power formula needs RMS. This converts peak to RMS first (÷√2 for a sine), then computes power — skipping it reads exactly 2× too high, the classic amplifier-power mistake, because power goes as voltage squared and (√2)² is 2.',
      keySymbols: ['√', '/', '·', 'x²', 'Z'],
      note: 'Sine-wave assumption. Reading a scope gives PEAK volts — you MUST convert to RMS before the power formula, or the answer is 2× too high.',
      compute: (v) => {
        const pk = n(v.vpk);
        const Z = n(v.z);
        const rms = pk / Math.SQRT2;
        return [
          { label: 'AVERAGE POWER', value: (rms * rms) / Z, quantity: 'power' },
          { label: 'VOLTAGE (RMS)', value: rms, quantity: 'voltage', chainable: false },
          {
            label: 'IF YOU HAD SKIPPED THE CONVERSION',
            text: `Using the peak volts directly would read ${fmt((pk * pk) / Z)} W — exactly 2× too high, the classic amplifier-power mistake.`,
          },
        ];
      },
      steps: (v) => {
        const pk = n(v.vpk);
        const Z = n(v.z);
        const rms = pk / Math.SQRT2;
        return [
          `A scope reads the crest (PEAK) voltage; power formulas need RMS, so convert first: Vrms = ${fmt(pk)} ÷ √2 = ${fmt(rms)} V.`,
          `P = Vrms² ÷ Z = ${fmt(rms)}² ÷ ${fmt(Z)} = ${fmt(rms * rms)} ÷ ${fmt(Z)} = ${fmt((rms * rms) / Z)} W average.`,
          `Skipping the ÷√2 (using ${fmt(pk)} V directly) would give ${fmt((pk * pk) / Z)} W — double the truth, because power goes as voltage SQUARED and (√2)² = 2.`,
        ];
      },
    },
    {
      key: 'vFromPZ',
      name: 'Voltage from power & impedance',
      inputs: ['p', 'z'],
      formula: 'V = √(P · Z)',
      plainFormula: 'The voltage equals the square root of the power times the impedance.',
      explain:
        'Rearranges the power law to find the RMS voltage that delivers a target power into a load, plus the current. “100 W into 8 Ω” is really a statement about ~28 V RMS and ~3.5 A.',
      keySymbols: ['√', '·', 'Z'],
      compute: (v) => {
        const P = n(v.p);
        const Z = n(v.z);
        const V = Math.sqrt(P * Z);
        return [
          { label: 'VOLTAGE (RMS)', value: V, quantity: 'voltage' },
          { label: 'CURRENT', value: Math.sqrt(P / Z), quantity: 'current' },
        ];
      },
      steps: (v) => {
        const P = n(v.p);
        const Z = n(v.z);
        const V = Math.sqrt(P * Z);
        return [
          `Rearrange P = V²/Z: V = √(P × Z) = √(${fmt(P)} × ${fmt(Z)}) = √${fmt(P * Z)} = ${fmt(V)} V RMS.`,
          `Current: I = √(P ÷ Z) = √(${fmt(P)} ÷ ${fmt(Z)}) = ${fmt(Math.sqrt(P / Z))} A.`,
        ];
      },
    },
    {
      key: 'iFromPV',
      name: 'Current from power & voltage',
      inputs: ['p', 'vrms'],
      formula: 'I = P / V',
      plainFormula: 'The current equals the power divided by the voltage.',
      explain:
        'Rearranges P = V·I for the current an amplifier and speaker cable must actually carry. Halving the load impedance at the same voltage doubles this current — the path to a thermal shutdown if the amp can’t supply it.',
      keySymbols: ['/'],
      compute: (v) => [{ label: 'CURRENT', value: n(v.p) / n(v.vrms), quantity: 'current' }],
      steps: (v) => {
        const P = n(v.p);
        const V = n(v.vrms);
        return [
          `Rearrange P = V × I: I = P ÷ V = ${fmt(P)} ÷ ${fmt(V)} = ${fmt(P / V)} A.`,
          `This is the current the amplifier (and speaker cable) must actually carry.`,
        ];
      },
    },
    {
      key: 'zFromVP',
      name: 'Impedance from voltage & power',
      inputs: ['vrms', 'p'],
      formula: 'Z = V² / P',
      plainFormula: 'The impedance equals the voltage squared divided by the power.',
      explain:
        'Rearranges the power law to recover the load impedance from a measured voltage and power — a sanity check on what load an amplifier is really seeing versus the nominal rating.',
      keySymbols: ['x²', '/'],
      compute: (v) => {
        const V = n(v.vrms);
        return [{ label: 'IMPEDANCE', value: (V * V) / n(v.p), quantity: 'impedance' }];
      },
      steps: (v) => {
        const V = n(v.vrms);
        const P = n(v.p);
        return [`Rearrange P = V²/Z: Z = V² ÷ P = ${fmt(V)}² ÷ ${fmt(P)} = ${fmt(V * V)} ÷ ${fmt(P)} = ${fmt((V * V) / P)} Ω.`];
      },
    },
    {
      key: 'rmsToPeak',
      name: 'RMS → peak · peak-to-peak',
      inputs: ['vrms'],
      formula: 'Vpeak = Vrms · √2 · Vpp = 2 · Vpeak',
      plainFormula:
        'The peak voltage equals the RMS voltage times root two; the peak-to-peak voltage is twice the peak.',
      explain:
        'A sine’s crest sits √2 (about 1.414) above its RMS value, and the peak-to-peak swing is twice that — the full excursion an amplifier’s rails must clear with headroom to spare. Sine waves only; music has a higher crest factor.',
      keySymbols: ['·', '√'],
      note: 'Sine waves only — music and noise have higher crest factors.',
      compute: (v) => {
        const V = n(v.vrms);
        const pk = V * Math.SQRT2;
        return [
          { label: 'PEAK VOLTAGE', value: pk, quantity: 'voltage' },
          { label: 'PEAK-TO-PEAK VOLTAGE', value: 2 * pk, quantity: 'voltage' },
        ];
      },
      steps: (v) => {
        const V = n(v.vrms);
        const pk = V * Math.SQRT2;
        return [
          `A sine’s crest sits √2 ≈ 1.414 above its RMS value.`,
          `Vpeak = ${fmt(V)} × 1.414 = ${fmt(pk)} V; Vpp = 2 × ${fmt(pk)} = ${fmt(2 * pk)} V — the full swing an amp’s rails must accommodate.`,
        ];
      },
    },
    {
      key: 'peakToRms',
      name: 'Peak → RMS · peak-to-peak (reverse)',
      inputs: ['vpk'],
      formula: 'Vrms = Vpeak / √2 · Vpp = 2 · Vpeak',
      plainFormula:
        'The RMS voltage equals the peak voltage over root two; the peak-to-peak voltage is twice the peak.',
      explain:
        'The reverse: from a scope’s peak reading to the RMS value every power formula on this page needs, plus the peak-to-peak swing. Forgetting the ÷√2 is what doubles a computed power.',
      keySymbols: ['/', '√', '·'],
      compute: (v) => {
        const pk = n(v.vpk);
        return [
          { label: 'VOLTAGE (RMS)', value: pk / Math.SQRT2, quantity: 'voltage' },
          { label: 'PEAK-TO-PEAK VOLTAGE', value: 2 * pk, quantity: 'voltage' },
        ];
      },
      steps: (v) => {
        const pk = n(v.vpk);
        return [
          `Vrms = ${fmt(pk)} ÷ √2 = ${fmt(pk / Math.SQRT2)} V — the value to use in every power formula on this page.`,
          `Vpp = 2 × ${fmt(pk)} = ${fmt(2 * pk)} V.`,
        ];
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// 3 · Basic Electronics
// ---------------------------------------------------------------------------

const TWO_PI = 2 * Math.PI;

const WS_ELECTRONICS: Workspace = {
  id: 'electronics',
  name: 'Basic Electronics',
  tagline: 'Series & parallel R · dividers · reactance · RC filters',
  section: 'electronics',
  intro:
    'The handful of passive-circuit calculations audio keeps reusing: combining resistors, the ' +
    'voltage divider hiding inside every pad and gain pot, how capacitors and inductors "resist" ' +
    'differently at different frequencies, and the RC corner that sets a filter’s cutoff.',
  whyItMatters:
    'A passive attenuator IS a voltage divider; a crossover IS reactance doing frequency-' +
    'dependent voltage division; a coupling cap and the next stage’s input impedance form an ' +
    'unintended high-pass filter. Being able to run these numbers explains why a passive DI ' +
    'loads a pickup, why long cable + high output impedance dulls the top end, and what the ' +
    '"−3 dB point" on a spec sheet physically is.',
  example:
    'A 10 kΩ output feeding a divider of R1 = 10 kΩ over R2 = 10 kΩ halves the voltage ' +
    '(−6 dB). A 1 µF coupling cap into that 10 kΩ input makes an RC high-pass with ' +
    'fc = 1/(2π × 10000 × 1×10⁻⁶) ≈ 15.9 Hz — safely below the audio band, which is exactly ' +
    'why 1 µF is such a common coupling value.',
  mistakes: [
    'Expecting parallel resistors to add — the combined value is always LESS than the smallest branch (two 8 Ω speakers in parallel are 4 Ω, not 16 Ω).',
    'Trusting the unloaded divider formula when the next stage’s input impedance is comparable to R2 — the load sits in parallel with R2 and pulls the output lower.',
    'Mixing µF and farads (or mH and henries) in reactance formulas — 1 µF is 0.000001 F; slipping a factor of a million is the classic reactance blunder.',
    'Forgetting reactance is frequency-dependent — a capacitor is nearly a wire at 20 kHz and nearly open at 20 Hz; quoting one Xc without its frequency is meaningless.',
    'Reading the RC cutoff as a brick wall — fc is only the −3 dB point; a first-order filter still passes plenty just beyond it, rolling off at a gentle 6 dB per octave.',
  ],
  warnings:
    'Ideal-component teaching math: real resistors have tolerance, capacitors have ESR and ' +
    'leakage, inductors have winding resistance, and the divider result assumes NO load on the ' +
    'output. Fine for audio design intuition; not a substitute for a circuit simulator.',
  glossary: ['Resistance', 'Impedance', 'Capacitor', 'Inductor', 'Voltage divider', 'Cutoff frequency', 'Reactance'],
  fields: [
    { key: 'rlist', name: 'RESISTORS (Ω, comma-separated)', quantity: 'list', placeholder: '8, 8, 16', help: 'The resistor (or speaker) values to combine, in ohms, separated by commas.' },
    { key: 'vin', name: 'INPUT VOLTAGE', quantity: 'voltage', placeholder: '1', help: 'Voltage across the whole divider (top of R1 to bottom of R2).' },
    { key: 'r1', name: 'R1 (SERIES / TOP)', quantity: 'impedance', placeholder: '10000', help: 'The series resistor between input and output.', warn: { test: (x) => x < 0, msg: 'Resistance cannot be negative.' } },
    { key: 'r2', name: 'R2 (SHUNT / BOTTOM)', quantity: 'impedance', placeholder: '10000', help: 'The resistor from output to ground — the output is taken across it.', warn: { test: (x) => x <= 0, msg: 'R2 must be positive — 0 Ω shorts the output to ground.' } },
    { key: 'f', name: 'FREQUENCY', quantity: 'frequency', placeholder: '1000', help: 'The frequency at which to evaluate the reactance or filter.', warn: { test: (x) => x <= 0, msg: 'Frequency must be positive.' } },
    { key: 'cap', name: 'CAPACITANCE (µF)', quantity: 'number', placeholder: '1', help: 'Capacitance in MICROFARADS (µF) — the tool converts to farads internally (×10⁻⁶).', warn: { test: (x) => x <= 0, msg: 'Capacitance must be positive.' } },
    { key: 'ind', name: 'INDUCTANCE (mH)', quantity: 'number', placeholder: '10', help: 'Inductance in MILLIHENRIES (mH) — the tool converts to henries internally (×10⁻³).', warn: { test: (x) => x <= 0, msg: 'Inductance must be positive.' } },
    { key: 'r', name: 'RESISTANCE', quantity: 'impedance', placeholder: '10000', help: 'The R of the RC network.', warn: { test: (x) => x <= 0, msg: 'Resistance must be positive.' } },
  ],
  functions: [
    {
      key: 'seriesR',
      name: 'Series resistance',
      inputs: ['rlist'],
      formula: 'Rtotal = R1 + R2 + …',
      plainFormula: 'The total resistance equals the sum of all the series resistances.',
      explain:
        'In series the same current passes through every resistor, so their oppositions simply add. The total is always larger than any single resistor.',
      keySymbols: ['R', 'x₁'],
      compute: (v) => {
        const rs = arr(v.rlist);
        return [{ label: 'TOTAL RESISTANCE', value: rs.reduce((a, b) => a + b, 0), quantity: 'impedance' }];
      },
      steps: (v) => {
        const rs = arr(v.rlist);
        const sum = rs.reduce((a, b) => a + b, 0);
        return [
          `In series the same current passes through every resistor, so their oppositions simply add.`,
          `Rtotal = ${rs.map((r) => fmt(r)).join(' + ')} = ${fmt(sum)} Ω.`,
        ];
      },
    },
    {
      key: 'parallelR',
      name: 'Parallel resistance',
      inputs: ['rlist'],
      formula: '1/Rtotal = 1/R1 + 1/R2 + …',
      plainFormula:
        'The reciprocal of the total resistance equals the sum of the reciprocals of each resistance.',
      explain:
        'In parallel each resistor opens another path for current, so conductances (reciprocals) add. The combined value is always LESS than the smallest branch — two 8 Ω speakers in parallel are 4 Ω, not 16.',
      keySymbols: ['/', 'R', 'x₁'],
      compute: (v) => {
        const rs = arr(v.rlist);
        const recip = rs.reduce((a, b) => a + 1 / b, 0);
        return [{ label: 'TOTAL RESISTANCE', value: 1 / recip, quantity: 'impedance' }];
      },
      steps: (v) => {
        const rs = arr(v.rlist);
        const recip = rs.reduce((a, b) => a + 1 / b, 0);
        return [
          `In parallel each resistor opens another path for current, so CONDUCTANCES (reciprocals) add.`,
          `1/Rtotal = ${rs.map((r) => `1/${fmt(r)}`).join(' + ')} = ${fmt(recip)} S.`,
          `Rtotal = 1 ÷ ${fmt(recip)} = ${fmt(1 / recip)} Ω — always LESS than the smallest branch (${fmt(Math.min(...rs))} Ω here).`,
        ];
      },
    },
    {
      key: 'divider',
      name: 'Voltage divider',
      inputs: ['vin', 'r1', 'r2'],
      formula: 'Vout = Vin · R2 / (R1 + R2)',
      plainFormula: 'The output voltage equals the input voltage times R2, divided by R1 plus R2.',
      explain:
        'The input voltage splits across two resistors in proportion to their values, and the output is R2’s share. This circuit is every passive pad and volume pot. It assumes no load; whatever the output feeds sits in parallel with R2 and lowers the real output.',
      keySymbols: ['·', 'R', '/', 'x₁'],
      note: 'UNLOADED divider — whatever the output feeds sits in parallel with R2 and lowers the real Vout.',
      compute: (v) => {
        const vin = n(v.vin);
        const r1 = n(v.r1);
        const r2 = n(v.r2);
        const vout = (vin * r2) / (r1 + r2);
        return [
          { label: 'OUTPUT VOLTAGE', value: vout, quantity: 'voltage' },
          { label: 'ATTENUATION', value: 20 * log10(vout / vin), quantity: 'db', chainable: false },
        ];
      },
      steps: (v) => {
        const vin = n(v.vin);
        const r1 = n(v.r1);
        const r2 = n(v.r2);
        const vout = (vin * r2) / (r1 + r2);
        return [
          `The input voltage splits across R1 and R2 in proportion to their resistances; the output is R2’s share.`,
          `Vout = ${fmt(vin)} × ${fmt(r2)} ÷ (${fmt(r1)} + ${fmt(r2)}) = ${fmt(vin)} × ${fmt(r2 / (r1 + r2))} = ${fmt(vout)} V.`,
          `That is ${fmt(20 * log10(vout / vin))} dB of attenuation — this circuit is every passive pad and volume pot.`,
        ];
      },
    },
    {
      key: 'xc',
      name: 'Capacitive reactance',
      inputs: ['f', 'cap'],
      formula: 'Xc = 1 / (2π · f · C)',
      plainFormula:
        'The capacitive reactance equals one divided by two pi times the frequency times the capacitance.',
      explain:
        'How much a capacitor “resists” AC at a frequency. Reactance falls as frequency rises, so a capacitor passes highs and blocks lows — the heart of every high-pass and tweeter feed. Reactance is meaningless without its frequency.',
      keySymbols: ['/', 'π', '·', 'f'],
      note: 'C entered in µF; converted to farads (×10⁻⁶) before computing.',
      compute: (v) => {
        const C = n(v.cap) * 1e-6;
        return [{ label: 'CAPACITIVE REACTANCE', value: 1 / (TWO_PI * n(v.f) * C), quantity: 'impedance' }];
      },
      steps: (v) => {
        const f = n(v.f);
        const uf = n(v.cap);
        const C = uf * 1e-6;
        return [
          `Convert to base units first: ${fmt(uf)} µF = ${fmt(C)} F.`,
          `Xc = 1 ÷ (2π × ${fmt(f)} × ${fmt(C)}) = ${fmt(1 / (TWO_PI * f * C))} Ω.`,
          `Reactance FALLS as frequency rises — capacitors pass highs and block lows, the heart of every high-pass and tweeter feed.`,
        ];
      },
    },
    {
      key: 'xl',
      name: 'Inductive reactance',
      inputs: ['f', 'ind'],
      formula: 'XL = 2π · f · L',
      plainFormula: 'The inductive reactance equals two pi times the frequency times the inductance.',
      explain:
        'How much an inductor “resists” AC at a frequency — the mirror image of a capacitor. Reactance RISES with frequency, so an inductor passes lows and blocks highs, which is why inductors feed woofers in passive crossovers.',
      keySymbols: ['π', '·', 'f'],
      note: 'L entered in mH; converted to henries (×10⁻³) before computing.',
      compute: (v) => {
        const L = n(v.ind) * 1e-3;
        return [{ label: 'INDUCTIVE REACTANCE', value: TWO_PI * n(v.f) * L, quantity: 'impedance' }];
      },
      steps: (v) => {
        const f = n(v.f);
        const mh = n(v.ind);
        const L = mh * 1e-3;
        return [
          `Convert to base units first: ${fmt(mh)} mH = ${fmt(L)} H.`,
          `XL = 2π × ${fmt(f)} × ${fmt(L)} = ${fmt(TWO_PI * f * L)} Ω.`,
          `Reactance RISES with frequency — the mirror image of a capacitor, which is why inductors feed woofers in passive crossovers.`,
        ];
      },
    },
    {
      key: 'rcCutoff',
      name: 'RC cutoff frequency',
      inputs: ['r', 'cap'],
      formula: 'fc = 1 / (2π · R · C)',
      plainFormula:
        'The cutoff frequency equals one divided by two pi times the resistance times the capacitance.',
      explain:
        'The −3 dB corner of a first-order RC filter, where the capacitor’s reactance equals the resistance and the output sits 3 dB down. Whether it is high-pass or low-pass depends only on whether the output is taken across the resistor or the capacitor. It’s a gentle 6 dB/octave slope, not a brick wall.',
      keySymbols: ['/', 'π', '·', 'R'],
      note: 'The −3 dB corner of a first-order RC filter (6 dB/octave slope). C entered in µF.',
      compute: (v) => {
        const C = n(v.cap) * 1e-6;
        return [{ label: 'CUTOFF FREQUENCY (−3 dB)', value: 1 / (TWO_PI * n(v.r) * C), quantity: 'frequency' }];
      },
      steps: (v) => {
        const R = n(v.r);
        const uf = n(v.cap);
        const C = uf * 1e-6;
        const fc = 1 / (TWO_PI * R * C);
        return [
          `${fmt(uf)} µF = ${fmt(C)} F.`,
          `fc = 1 ÷ (2π × ${fmt(R)} × ${fmt(C)}) = ${fmt(fc)} Hz — the frequency where Xc equals R and the output sits 3 dB down.`,
          `Whether this corner is a high-pass or low-pass depends only on whether you take the output across the resistor or the capacitor.`,
        ];
      },
    },
    {
      key: 'rcTau',
      name: 'RC time constant',
      inputs: ['r', 'cap'],
      formula: 'τ = R · C',
      plainFormula: 'The time constant equals the resistance times the capacitance.',
      explain:
        'In one time constant a capacitor charges to 63.2% of the applied voltage (or discharges to 36.8%), and is about 99% settled after five. The same τ sets the attack and release feel of analog dynamics circuits.',
      keySymbols: ['τ', '·', 'R'],
      note: 'C entered in µF; result shown in milliseconds.',
      compute: (v) => {
        const tau = n(v.r) * n(v.cap) * 1e-6;
        return [
          { label: 'TIME CONSTANT τ', value: tau, quantity: 'time', unit: 'ms' },
          { label: 'MEANING', text: 'In one τ the capacitor charges to 63.2% of the applied voltage (or discharges to 36.8%); it is ~99% settled after 5τ.' },
        ];
      },
      steps: (v) => {
        const R = n(v.r);
        const uf = n(v.cap);
        const tau = R * uf * 1e-6;
        return [
          `τ = R × C = ${fmt(R)} Ω × ${fmt(uf * 1e-6)} F = ${fmt(tau)} s = ${fmt(tau * 1000)} ms.`,
          `One time constant is the 63.2% charge mark — the same τ that sets attack/release feels in analog dynamics circuits.`,
        ];
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// 4 · Q · Bandwidth · Band Edges
// ---------------------------------------------------------------------------

/** Exact geometric −3 dB band edges for a given center and Q. */
function bandEdges(fc: number, q: number): { f1: number; f2: number } {
  const root = Math.sqrt(1 + 1 / (4 * q * q));
  return { f1: fc * (root - 1 / (2 * q)), f2: fc * (root + 1 / (2 * q)) };
}

const WS_QBW: Workspace = {
  id: 'qbw',
  name: 'Q · Bandwidth · Band Edges',
  tagline: 'Filter width — Q, Hz, octaves, and where the edges really sit',
  section: 'filters',
  intro:
    'What a filter’s Q knob actually means: the ratio of center frequency to bandwidth, the ' +
    'exact −3 dB edge frequencies (which are GEOMETRIC around the center, not symmetric), and ' +
    'the translation to octave widths that EQ plots are drawn in.',
  whyItMatters:
    'Every parametric EQ move is a bet about width. Knowing that Q 1.41 ≈ one octave, that the ' +
    'edges of a band sit at fc·(√(1+1/4Q²) ± 1/2Q) rather than fc ± BW/2, and how far a bell ' +
    'audibly reaches, is what separates surgical feedback control from accidentally hollowing ' +
    'out a vocal.',
  example:
    'A bell at fc = 1 kHz with Q = 1.41: BW = 1000 ÷ 1.41 ≈ 709 Hz, and the exact edges land ' +
    'at ≈ 707 Hz and ≈ 1.41 kHz — a hair over one octave wide (log2(1415/707) ≈ 1.0). Note the ' +
    'edges are NOT 1000 ± 354: they are placed so that f1 × f2 = fc², keeping the band symmetric ' +
    'on a logarithmic (musical) axis.',
  mistakes: [
    'Placing the edges at fc ± BW/2 — the true −3 dB edges are geometric (f1·f2 = fc²), so the band extends further in Hz above center than below.',
    'Comparing Q numbers across EQ brands as if they were standardized — some derive Q from different bandwidth definitions (or change width with gain), so Q 2 on one unit is not Q 2 on another.',
    'Using a narrow-Q cut to fix a broad tonal problem — a wide resonance needs a wide filter; stacking narrow notches just makes the response lumpy.',
    'Assuming the filter stops mattering outside f1–f2 — the −3 dB points are half-power markers, not walls; at high gains the audible reach extends well past them.',
    'Confusing constant-Q with proportional-Q behavior when copying settings between plugins — the same numbers can produce different curves.',
  ],
  warnings:
    'The −3 dB edge convention here matches the standard bandpass definition. EQ makers do not ' +
    'all agree: some define bandwidth at the half-gain points or vary Q with gain, so treat Q ' +
    'values from different products as approximations of each other, not equivalents.',
  glossary: ['Q factor', 'Bandwidth', 'Center frequency', 'Octave', 'Parametric EQ', 'Filter'],
  fields: [
    { key: 'fc', name: 'CENTER FREQUENCY', quantity: 'frequency', placeholder: '1000', help: 'The frequency at the middle (geometric mean) of the band.', warn: { test: (x) => x <= 0, msg: 'Center frequency must be positive.' } },
    { key: 'q', name: 'Q', quantity: 'number', placeholder: '1.41', help: 'Quality factor: fc ÷ bandwidth. Higher Q = narrower band.', warn: { test: (x) => x <= 0, msg: 'Q must be positive.' } },
    { key: 'bw', name: 'BANDWIDTH', quantity: 'frequency', placeholder: '709', help: 'Width between the −3 dB edge frequencies.', warn: { test: (x) => x <= 0, msg: 'Bandwidth must be positive.' } },
    { key: 'noct', name: 'WIDTH IN OCTAVES', quantity: 'number', placeholder: '1', help: 'Bandwidth expressed as octaves between the edges: N = log2(f2/f1).', warn: { test: (x) => x <= 0, msg: 'Octave width must be positive.' } },
    { key: 'gain', name: 'GAIN', quantity: 'db', placeholder: '9', help: 'Boost (+) or cut (−) at the center of the parametric bell.' },
    { key: 'flo', name: 'LOWER FREQUENCY', quantity: 'frequency', placeholder: '100', help: 'The bottom of the range whose logarithmic (musical) center you want.', warn: { test: (x) => x <= 0, msg: 'Frequency must be positive.' } },
    { key: 'fhi', name: 'UPPER FREQUENCY', quantity: 'frequency', placeholder: '400', help: 'The top of the range whose logarithmic (musical) center you want.', warn: { test: (x) => x <= 0, msg: 'Frequency must be positive.' } },
  ],
  functions: [
    {
      key: 'geoCenter',
      name: 'Center frequency between two frequencies',
      inputs: ['flo', 'fhi'],
      formula: 'fc = √(f₁ · f₂) — the GEOMETRIC mean',
      plainFormula:
        'The center frequency equals the square root of the two frequencies multiplied together — their geometric mean.',
      explain:
        'Frequency is heard logarithmically, so the musical middle of two tones is their geometric mean, not their arithmetic average. The center of 100 Hz and 400 Hz is 200 Hz — one octave from each — not 250. It’s why parametric edges are geometric and 1/3-octave bands are spaced by a constant ratio.',
      keySymbols: ['f', '√', '·', 'x₁'],
      note: 'Frequency is heard logarithmically, so the musical middle of two tones is their geometric mean, not their arithmetic average.',
      compute: (v) => {
        const a = Math.min(n(v.flo), n(v.fhi));
        const b = Math.max(n(v.flo), n(v.fhi));
        const fc = Math.sqrt(a * b);
        const bw = b - a;
        return [
          { label: 'CENTER FREQUENCY (geometric)', value: fc, quantity: 'frequency' },
          { label: 'ARITHMETIC AVERAGE (for contrast)', value: (a + b) / 2, quantity: 'frequency', chainable: false },
          { label: 'WIDTH IN OCTAVES', value: log2(b / a), quantity: 'number', chainable: false },
          { label: 'BANDWIDTH', value: bw, quantity: 'frequency', chainable: false },
          { label: 'Q OF THIS BAND', value: fc / bw, quantity: 'number', chainable: false },
        ];
      },
      steps: (v) => {
        const a = Math.min(n(v.flo), n(v.fhi));
        const b = Math.max(n(v.flo), n(v.fhi));
        const fc = Math.sqrt(a * b);
        return [
          `The center is the GEOMETRIC mean: fc = √(f₁ × f₂) = √(${fmt(a)} × ${fmt(b)}) = √${fmt(a * b)} = ${fmt(fc)} Hz.`,
          `The plain average would be (${fmt(a)} + ${fmt(b)}) ÷ 2 = ${fmt((a + b) / 2)} Hz — but that sits closer to the top octave, not the audible middle.`,
          `Example: the musical center of 100 Hz and 400 Hz is 200 Hz (one octave up from 100, one octave down from 400), not 250 Hz.`,
          `That is why parametric edges are geometric around fc, and why 1/3-octave bands are spaced by a constant RATIO, not a constant number of Hz.`,
        ];
      },
    },
    {
      key: 'bwFromQ',
      name: 'Bandwidth & band edges from Q',
      inputs: ['fc', 'q'],
      formula: 'BW = fc / Q · f1,f2 = fc·(√(1+1/4Q²) ∓ 1/2Q)',
      plainFormula:
        'The bandwidth equals the center frequency over Q; the edges equal the center times the square root of one plus one over four Q squared, minus or plus one over two Q.',
      explain:
        'What a Q knob means: bandwidth is center frequency over Q, and the −3 dB edges sit geometrically around the center (their product equals the center squared), not at center ± half-bandwidth. So the band extends further in Hz above the center than below.',
      keySymbols: ['/', 'Q', '·', '√', 'x²', 'x₁'],
      compute: (v) => {
        const fc = n(v.fc);
        const q = n(v.q);
        const { f1, f2 } = bandEdges(fc, q);
        return [
          { label: 'BANDWIDTH', value: fc / q, quantity: 'frequency' },
          { label: 'LOWER EDGE f₁ (−3 dB)', value: f1, quantity: 'frequency' },
          { label: 'UPPER EDGE f₂ (−3 dB)', value: f2, quantity: 'frequency' },
          { label: 'WIDTH IN OCTAVES', value: log2(f2 / f1), quantity: 'number', chainable: false },
        ];
      },
      steps: (v) => {
        const fc = n(v.fc);
        const q = n(v.q);
        const { f1, f2 } = bandEdges(fc, q);
        const root = Math.sqrt(1 + 1 / (4 * q * q));
        return [
          `BW = fc ÷ Q = ${fmt(fc)} ÷ ${fmt(q)} = ${fmt(fc / q)} Hz.`,
          `The edges are placed geometrically: √(1 + 1/(4Q²)) = √(1 + ${fmt(1 / (4 * q * q))}) = ${fmt(root)} and 1/(2Q) = ${fmt(1 / (2 * q))}.`,
          `f₁ = ${fmt(fc)} × (${fmt(root)} − ${fmt(1 / (2 * q))}) = ${fmt(f1)} Hz; f₂ = ${fmt(fc)} × (${fmt(root)} + ${fmt(1 / (2 * q))}) = ${fmt(f2)} Hz.`,
          `Check: f₁ × f₂ = ${fmt(f1 * f2)} = fc² (${fmt(fc * fc)}) — the center is the GEOMETRIC mean of the edges, which is why they are not fc ± BW/2.`,
        ];
      },
    },
    {
      key: 'qFromBw',
      name: 'Q from bandwidth (reverse)',
      inputs: ['fc', 'bw'],
      formula: 'Q = fc / BW',
      plainFormula: 'The Q equals the center frequency divided by the bandwidth.',
      explain:
        'The reverse: Q is simply the ratio of center frequency to bandwidth — a wider band is a lower Q. It also places the geometric −3 dB edges, which sit around the center rather than symmetrically in hertz.',
      keySymbols: ['Q', '/'],
      compute: (v) => {
        const fc = n(v.fc);
        const q = fc / n(v.bw);
        const { f1, f2 } = bandEdges(fc, q);
        return [
          { label: 'Q', value: q, quantity: 'number' },
          { label: 'LOWER EDGE f₁ (−3 dB)', value: f1, quantity: 'frequency', chainable: false },
          { label: 'UPPER EDGE f₂ (−3 dB)', value: f2, quantity: 'frequency', chainable: false },
        ];
      },
      steps: (v) => {
        const fc = n(v.fc);
        const bw = n(v.bw);
        const q = fc / bw;
        const { f1, f2 } = bandEdges(fc, q);
        return [
          `Q = fc ÷ BW = ${fmt(fc)} ÷ ${fmt(bw)} = ${fmt(q)}.`,
          `That Q puts the −3 dB edges at ${fmt(f1)} Hz and ${fmt(f2)} Hz — geometric around ${fmt(fc)} Hz, not ${fmt(fc)} ± ${fmt(bw / 2)}.`,
        ];
      },
    },
    {
      key: 'octFromQ',
      name: 'Octave width from Q',
      inputs: ['q'],
      formula: 'N = log2(f2 / f1) — using the exact edges',
      plainFormula:
        'The width in octaves equals the base-two log of the ratio of the upper edge to the lower edge.',
      explain:
        'Turns a Q into a width in octaves — the units EQ plots are drawn in. Octave width depends only on the edge ratio, so the center frequency cancels out entirely: Q 1.41 is about one octave everywhere.',
      keySymbols: ['/', 'x₁'],
      compute: (v) => {
        const q = n(v.q);
        const { f1, f2 } = bandEdges(1000, q); // any fc — the octave width depends only on Q
        return [
          { label: 'WIDTH IN OCTAVES', value: log2(f2 / f1), quantity: 'number' },
          { label: 'EDGE RATIO f₂/f₁', value: f2 / f1, quantity: 'ratio', chainable: false },
        ];
      },
      steps: (v) => {
        const q = n(v.q);
        const { f1, f2 } = bandEdges(1000, q);
        return [
          `Octave width depends only on the edge RATIO, so the center frequency cancels out entirely.`,
          `With Q = ${fmt(q)} the exact edges span a ratio of f₂/f₁ = ${fmt(f2 / f1)}.`,
          `N = log2(${fmt(f2 / f1)}) = ${fmt(log2(f2 / f1))} octaves.`,
        ];
      },
    },
    {
      key: 'qFromOct',
      name: 'Q from octave width (reverse)',
      inputs: ['noct'],
      formula: 'Q = √(2^N) / (2^N − 1)',
      plainFormula:
        'The Q equals the square root of two raised to the octave width, divided by two raised to that width minus one.',
      explain:
        'The reverse: the Q for a target octave width. It raises two to the octave count (the edge ratio), then combines it into Q. Handy anchors: one octave is Q ≈ 1.41, one-third octave Q ≈ 4.32, two octaves Q ≈ 0.67.',
      keySymbols: ['√', 'x²', '/', '−'],
      compute: (v) => {
        const N = n(v.noct);
        const pw = Math.pow(2, N);
        return [{ label: 'Q', value: Math.sqrt(pw) / (pw - 1), quantity: 'number' }];
      },
      steps: (v) => {
        const N = n(v.noct);
        const pw = Math.pow(2, N);
        const q = Math.sqrt(pw) / (pw - 1);
        return [
          `First raise 2 to the octave width: 2^${fmt(N)} = ${fmt(pw)} — the ratio between the band edges.`,
          `Q = √(2^N) ÷ (2^N − 1) = √${fmt(pw)} ÷ (${fmt(pw)} − 1) = ${fmt(Math.sqrt(pw))} ÷ ${fmt(pw - 1)} = ${fmt(q)}.`,
          `Handy anchors: 1 octave → Q ≈ 1.41; 1/3 octave → Q ≈ 4.32; 2 octaves → Q ≈ 0.67.`,
        ];
      },
    },
    {
      key: 'paramReach',
      name: 'Parametric band reach',
      inputs: ['fc', 'q', 'gain'],
      formula: 'f1–f2 from fc & Q · audibility widens with |gain|',
      plainFormula:
        'The affected range runs from the lower edge to the upper edge set by the center frequency and Q; the audible reach widens as the absolute gain grows.',
      explain:
        'The −3 dB edges describe the bandpass shape, but a bell’s audible footprint grows with gain — the skirts approach flat only gradually. When sweeping for a problem frequency, listen past the calculated edges before deciding the filter is missing it.',
      keySymbols: ['| |', 'x₁'],
      note: 'The −3 dB edges describe the bandpass shape; a bell’s AUDIBLE footprint grows with gain.',
      compute: (v) => {
        const fc = n(v.fc);
        const q = n(v.q);
        const g = n(v.gain);
        const { f1, f2 } = bandEdges(fc, q);
        return [
          { label: 'AFFECTED RANGE — LOWER f₁', value: f1, quantity: 'frequency' },
          { label: 'AFFECTED RANGE — UPPER f₂', value: f2, quantity: 'frequency' },
          { label: 'WIDTH IN OCTAVES', value: log2(f2 / f1), quantity: 'number', chainable: false },
          {
            label: 'AUDIBLE REACH',
            text:
              `The band edges mark the −3 dB points of the shape, but a ${fmt(Math.abs(g))} dB ` +
              `${g >= 0 ? 'boost' : 'cut'} is still audibly shifting energy beyond ${fmt(f1)}–${fmt(f2)} Hz — ` +
              `the skirts of the bell only approach flat gradually, and the higher the gain, the further past ` +
              `the −3 dB points the audible influence extends.`,
          },
        ];
      },
      steps: (v) => {
        const fc = n(v.fc);
        const q = n(v.q);
        const g = n(v.gain);
        const { f1, f2 } = bandEdges(fc, q);
        return [
          `Edges from fc and Q: f₁ = ${fmt(f1)} Hz, f₂ = ${fmt(f2)} Hz (${fmt(log2(f2 / f1))} octaves wide, f₁·f₂ = fc²).`,
          `At ${fmt(g)} dB of ${g >= 0 ? 'boost' : 'cut'}, expect the move to be audible somewhat beyond that range — when sweeping for a problem frequency, listen past the calculated edges before deciding the filter is "missing".`,
        ];
      },
    },
  ],
};

export const WORKSPACES_LEVELS: Workspace[] = [WS_LEVEL, WS_OHMS, WS_ELECTRONICS, WS_QBW];
