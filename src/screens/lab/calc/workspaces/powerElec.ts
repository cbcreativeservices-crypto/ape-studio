/**
 * Workspaces — Power & Electronics (owner buildout 2026-08-07):
 * Transformer Ratios · Pads & Attenuators · Voltage Drop · Rack Power & Heat ·
 * Complex Impedance. Section 'electronics'. Same pattern as wave.ts.
 *
 * Inductance is entered in mH and capacitance in µF (there is no dedicated
 * QuantityKind for either); the compute() converts to base H/F.
 */
import type { Workspace } from '../calcTypes';
import { ALPHA_CU_20C, BTU_PER_HR_PER_W, CU_TEMP_RANGE, awgAreaM2, fmt, fmtInt, rhoCopper, snapWhole } from '../calcUnits';

const n = (v: number | number[]) => (typeof v === 'number' ? v : v[0] ?? NaN);

/** CONDUCTOR TEMPERATURE (calc accuracy audit, 2026-10-04): copper was costed
 *  at 20 °C only, so a loaded cable — 75 °C is the NEC Chapter 9 Table 8 basis
 *  — read about 18% LESS resistance and drop than it really has. The run's own
 *  temperature is now an input; a caller that passes none (an old test) is
 *  costed at 20 °C, as before. Shared copper constants live in calcUnits. */
const condTempOf = (v: Record<string, number | number[]>): number =>
  typeof v.condTemp === 'number' ? v.condTemp : 20;
/** The resistivity line of the steps, at the run's temperature. */
const rhoStep = (t: number): string =>
  `ρ at ${fmt(t)} °C = 1.7241e-8 × (1 + ${ALPHA_CU_20C} × (${fmt(t)} − 20)) = ${fmt(rhoCopper(t))} Ω·m`;
/** The finest gauge this calculator covers (the WIRE GAUGE field's top end). */
const AWG_FINEST = 40;
/** Area (m²) → nearest AWG (real number; floor it to size UP a wire). */
const awgFromAreaM2 = (aM2: number) => {
  const dMm = 2000 * Math.sqrt(aM2 / Math.PI);
  return 36 - 39 * (Math.log(dMm / 0.127) / Math.log(92));
};
/** A whole gauge as it is written (hunt 6, 2026-10-03): 0 AWG and up as the
 *  number, −1…−3 as 2/0…4/0 (the scale's own convention, as the gauge input's
 *  range), and null past 4/0 — the AWG scale ends there (kcmil / mm² beyond). */
const awgName = (w: number): string | null => (w >= 0 ? `${w} AWG` : w >= -3 ? `${1 - w}/0 AWG` : null);
/** Voltage drop when I·R reaches the supply: no load voltage is left, so the
 *  stated current cannot flow over this cable from this supply. */
const dropBreaksDown = (I: number, R: number, Vs: number): string =>
  `The model breaks down here: ${fmt(I)} A through ${fmt(R)} Ω of cable would drop I·R = ${fmt(I * R)} V — ` +
  `${I * R > Vs ? 'more than' : 'all of'} the ${fmt(Vs)} V supply, leaving nothing for the load. ` +
  `This supply cannot deliver ${fmt(I)} A over this cable; even with the far end shorted, at most ${fmt(Vs / R)} A could flow. ` +
  'Use a thicker gauge, a shorter run, or a higher supply voltage.';
/** The REFUSAL row's words — inputs only (hunt 8, 2026-10-03). A capped account
 *  reads ONLY the refusal rows of a refused result, for free; the words above
 *  print the cable's round-trip resistance (this calculator's first answer) and
 *  I·R, so a huge CURRENT revealed any cable's resistance without spending a
 *  calculation. The figures ride a separate, unmarked row members see. */
const dropBreaksDownWhy = (I: number, R: number, Vs: number): string =>
  `The model breaks down here: ${fmt(I)} A through this cable would drop ` +
  `${I * R > Vs ? 'more than' : 'all of'} the ${fmt(Vs)} V supply, leaving nothing for the load. ` +
  `This supply cannot deliver ${fmt(I)} A over this cable. ` +
  'Use a thicker gauge, a shorter run, or a higher supply voltage.';
const dropBreaksDownFigures = (I: number, R: number, Vs: number): string =>
  `${fmt(I)} A through ${fmt(R)} Ω of cable would drop I·R = ${fmt(I * R)} V; ` +
  `even with the far end shorted, at most ${fmt(Vs / R)} A could flow.`;

const TRANSFORMER: Workspace = {
  id: 'transformer',
  name: 'Transformer Ratios',
  tagline: 'Turns · voltage · impedance reflection',
  section: 'electronics',
  reportPrefix: 'XFMR',
  intro:
    'A transformer trades voltage for current (or impedance for impedance) by its turns ratio. ' +
    'Voltage scales with the ratio, current scales inversely, and impedance scales with the ' +
    'SQUARE of the ratio. Enter what you know and read the rest.',
  whyItMatters:
    'Mic and line transformers, 70/100 V distribution, tube output stages, and DI boxes all live ' +
    'on this relationship. "Reflected impedance" — what one side looks like from the other — is ' +
    'why an output transformer can match a tiny speaker load to a big tube plate.',
  example:
    'A line-to-mic pad transformer stepping 600 Ω down to 150 Ω: turns ratio = √(600/150) = 2:1. ' +
    'Voltage drops 2×, current rises 2×, and a 150 Ω load looks like 600 Ω on the primary.',
  mistakes: [
    'Confusing the voltage ratio with the impedance ratio — impedance scales as the SQUARE of turns (a 2:1 transformer is a 4:1 impedance transformer).',
    'Forgetting a transformer is passive — it can match impedances, but it never adds power (voltage up means current down).',
    'Ignoring that real transformers have loss, leakage inductance, and bandwidth limits the ideal ratio hides.',
  ],
  warnings:
    'Ideal-transformer model: turns ratio N = Vp/Vs = √(Zp/Zs); impedance ratio = N². Real ' +
    'transformers add insertion loss, limited bandwidth, and saturation the ideal ignores.',
  glossary: ['Transformer', 'Impedance', 'Voltage', 'Turns ratio', 'Current'],
  fields: [
    { key: 'zp', name: 'PRIMARY IMPEDANCE', quantity: 'impedance', placeholder: '600', help: 'Impedance seen at the primary (input) side.', warn: { test: (x) => x <= 0, msg: 'Impedance must be greater than zero.' } },
    { key: 'zs', name: 'SECONDARY IMPEDANCE', quantity: 'impedance', placeholder: '150', help: 'Impedance of the load on the secondary (output) side.', warn: { test: (x) => x <= 0, msg: 'Impedance must be greater than zero.' } },
    { key: 'turns', name: 'TURNS RATIO (primary:secondary)', quantity: 'number', nonNegative: true, placeholder: '2', help: 'Primary turns ÷ secondary turns.', warn: { test: (x) => x <= 0, msg: 'Turns ratio must be greater than zero.' } },
  ],
  functions: [
    {
      key: 'ratioFromZ',
      name: 'Turns ratio from impedances',
      inputs: ['zp', 'zs'],
      formula: 'N = √(Zp / Zs)',
      plainFormula: 'The turns ratio equals the square root of the primary impedance divided by the secondary impedance.',
      explain:
        'A transformer trades voltage for current by its turns ratio. This finds that ratio from the impedances on each side. Voltage scales with the ratio, current scales inversely, and impedance scales with the SQUARE of the ratio — so a 2:1 transformer is a 4:1 impedance transformer.',
      keySymbols: ['√', 'Z', '/', 'x₁'],
      compute: (v) => {
        const N = Math.sqrt(n(v.zp) / n(v.zs));
        return [
          { label: 'TURNS RATIO (N:1)', value: N, quantity: 'number' },
          { label: 'VOLTAGE RATIO', value: N, quantity: 'number', chainable: false },
          { label: 'CURRENT RATIO (secondary:primary)', value: N, quantity: 'number', chainable: false },
          { label: 'IMPEDANCE RATIO', value: N * N, quantity: 'number', chainable: false },
        ];
      },
      steps: (v) => {
        const N = Math.sqrt(n(v.zp) / n(v.zs));
        return [
          `N = √(${fmt(n(v.zp))} ÷ ${fmt(n(v.zs))}) = ${fmt(N)}:1.`,
          `Voltage scales ${fmt(N)}×, current scales ${fmt(N)}× the other way, and impedance scales ${fmt(N * N)}× (the square).`,
        ];
      },
    },
    {
      key: 'zFromRatio',
      name: 'Reflected impedance from turns ratio',
      inputs: ['turns', 'zs'],
      formula: 'Zp = N² · Zs',
      plainFormula: 'The reflected primary impedance equals the square of the turns ratio times the secondary impedance.',
      explain:
        'What the secondary load looks like from the primary side. Because impedance scales as the square of the turns ratio, a small load can be reflected up to match a large source — how an output transformer matches a speaker to a tube plate. A transformer is passive: it matches impedances but never adds power.',
      keySymbols: ['x²', '·', 'Z', 'x₁'],
      note: 'What the secondary load looks like from the primary side.',
      compute: (v) => {
        const zp = n(v.turns) * n(v.turns) * n(v.zs);
        return [
          { label: 'REFLECTED PRIMARY IMPEDANCE', value: zp, quantity: 'impedance' },
          { label: 'VOLTAGE RATIO', value: n(v.turns), quantity: 'number', chainable: false },
        ];
      },
      steps: (v) => {
        const zp = n(v.turns) * n(v.turns) * n(v.zs);
        return [
          `Zp = ${fmt(n(v.turns))}² × ${fmt(n(v.zs))} = ${fmt(zp)} Ω.`,
          `A ${fmt(n(v.zs))} Ω load looks like ${fmt(zp)} Ω through a transformer with a turns ratio of ${fmt(n(v.turns))}:1.`,
        ];
      },
    },
  ],
};

const PADS: Workspace = {
  id: 'pads',
  name: 'Pads & Attenuators',
  tagline: 'T-pad & Pi-pad resistor values',
  section: 'electronics',
  reportPrefix: 'PAD',
  intro:
    'A resistive pad drops a signal by a fixed amount while keeping the impedance the source and ' +
    'load expect. Enter the attenuation and the characteristic impedance and get the resistor ' +
    'values for a T-pad and a Pi-pad, both matched on each side.',
  whyItMatters:
    'Pads tame hot sources (a −20 dB pad ahead of a mic pre), match levels between gear, and set ' +
    'fixed trims. Doing it with the RIGHT network keeps impedances matched so nothing loads down ' +
    'or reflects — a bare series resistor changes the impedance and the frequency response with it.',
  example:
    'A −20 dB, 600 Ω T-pad: K = 10^(20/20) = 10. Series arms R1 = R2 = 600·(10−1)/(10+1) ≈ 491 Ω; ' +
    'shunt R3 = 600·2·10/(10²−1) ≈ 121 Ω.',
  mistakes: [
    'Using a single series resistor as a "pad" — it attenuates but breaks the impedance match, unlike a proper T or Pi network.',
    'Padding with the wrong characteristic impedance — a 600 Ω pad in a 10 kΩ line neither matches nor attenuates as intended.',
    'Forgetting pads are lossy by design — they throw signal away as heat; that is the point, but mind resistor power ratings on hot lines.',
  ],
  warnings:
    'Symmetric, impedance-matched networks (source Z = load Z = Z). K = 10^(dB/20). ' +
    'T-pad: series R1=R2 = Z·(K−1)/(K+1), shunt R3 = Z·2K/(K²−1). ' +
    'Pi-pad: series R = Z·(K²−1)/(2K), each shunt R = Z·(K+1)/(K−1).',
  glossary: ['Attenuation', 'Impedance', 'Decibel', 'Gain Staging', 'Pad'],
  fields: [
    { key: 'atten', name: 'ATTENUATION', quantity: 'db', nonNegative: true, placeholder: '20', help: 'How many dB to drop the signal.', warn: { test: (x) => x <= 0, msg: 'Attenuation must be greater than zero dB.' } },
    { key: 'z', name: 'CHARACTERISTIC IMPEDANCE', quantity: 'impedance', placeholder: '600', help: 'The line impedance the pad must match on both sides.', warn: { test: (x) => x <= 0, msg: 'Impedance must be greater than zero.' } },
  ],
  functions: [
    {
      key: 'tpad',
      name: 'T-pad resistor values',
      inputs: ['atten', 'z'],
      formula: 'R1=R2 = Z·(K−1)/(K+1); R3 = Z·2K/(K²−1); K = 10^(dB/20)',
      plainFormula:
        'The series arms equal the impedance times (the multiplier minus one) over (the multiplier plus one); the shunt equals the impedance times twice the multiplier over (the multiplier squared minus one); the multiplier is ten raised to the attenuation over twenty.',
      explain:
        'A T-pad drops the signal a fixed amount while keeping the source and load impedance matched on both sides — two series arms and one shunt. A bare series resistor would attenuate but break the match and colour the response; the T network holds the impedance so nothing loads down or reflects.',
      keySymbols: ['R', 'Z', '·', '−', '/', 'x²', 'x₁'],
      compute: (v) => {
        const K = Math.pow(10, n(v.atten) / 20);
        const Z = n(v.z);
        return [
          { label: 'SERIES ARMS R1 = R2', value: (Z * (K - 1)) / (K + 1), quantity: 'impedance' },
          { label: 'SHUNT R3', value: (Z * 2 * K) / (K * K - 1), quantity: 'impedance' },
          { label: 'MULTIPLIER K', value: K, quantity: 'number', chainable: false },
        ];
      },
      steps: (v) => {
        const K = Math.pow(10, n(v.atten) / 20);
        const Z = n(v.z);
        return [
          `K = 10^(${fmt(n(v.atten))}/20) = ${fmt(K)}.`,
          `Series R1 = R2 = ${fmt(Z)}·(${fmt(K)}−1)/(${fmt(K)}+1) = ${fmt((Z * (K - 1)) / (K + 1))} Ω.`,
          `Shunt R3 = ${fmt(Z)}·2·${fmt(K)}/(${fmt(K)}²−1) = ${fmt((Z * 2 * K) / (K * K - 1))} Ω.`,
        ];
      },
    },
    {
      key: 'pipad',
      name: 'Pi-pad resistor values',
      inputs: ['atten', 'z'],
      formula: 'series R = Z·(K²−1)/(2K); each shunt R = Z·(K+1)/(K−1)',
      plainFormula:
        'The series resistor equals the impedance times (the multiplier squared minus one) over twice the multiplier; each shunt resistor equals the impedance times (the multiplier plus one) over (the multiplier minus one).',
      explain:
        'A Pi-pad does the same job as a T-pad — a fixed, impedance-matched attenuation — but arranges one series resistor between two shunt resistors, one at each end. Same K multiplier (ten raised to the dB over twenty), different topology; both throw the signal away as heat by design.',
      keySymbols: ['R', 'Z', '·', 'x²', '−', '/'],
      compute: (v) => {
        const K = Math.pow(10, n(v.atten) / 20);
        const Z = n(v.z);
        return [
          { label: 'SERIES R', value: (Z * (K * K - 1)) / (2 * K), quantity: 'impedance' },
          { label: 'EACH SHUNT R (×2)', value: (Z * (K + 1)) / (K - 1), quantity: 'impedance' },
          { label: 'MULTIPLIER K', value: K, quantity: 'number', chainable: false },
        ];
      },
      steps: (v) => {
        const K = Math.pow(10, n(v.atten) / 20);
        const Z = n(v.z);
        return [
          `K = 10^(${fmt(n(v.atten))}/20) = ${fmt(K)}.`,
          `Series R = ${fmt(Z)}·(${fmt(K)}²−1)/(2·${fmt(K)}) = ${fmt((Z * (K * K - 1)) / (2 * K))} Ω.`,
          `Each shunt R = ${fmt(Z)}·(${fmt(K)}+1)/(${fmt(K)}−1) = ${fmt((Z * (K + 1)) / (K - 1))} Ω (one at each end).`,
        ];
      },
    },
  ],
};

const VDROP: Workspace = {
  id: 'vdrop',
  name: 'Voltage Drop',
  tagline: 'Cable resistance loss on power & DC runs',
  section: 'electronics',
  reportPrefix: 'VDROP',
  intro:
    'Every metre of cable has resistance, and current through it drops voltage before it reaches ' +
    'the load. Enter the wire gauge, the run length, and the current, and see the round-trip ' +
    'resistance, the voltage lost, and the percentage that never arrives.',
  whyItMatters:
    'Long DC runs to pedals, phantom-power feeds, powered-speaker mains, and lighting all sag if ' +
    'the wire is too thin. A supply that reads fine at the rack can arrive out of spec at the far ' +
    'end. This is how you size a gauge before the gear misbehaves.',
  example:
    'A 30 m run of 16 AWG carrying 3 A from a 48 V supply, copper at 75 °C: round-trip resistance ' +
    '≈ 0.96 Ω, so the drop ≈ 2.9 V (≈ 6%) and ≈ 8.7 W is lost as heat in the cable. Costed cold at ' +
    '20 °C the same run reads 0.79 Ω and 2.4 V — 18% less than the loaded cable really drops.',
  mistakes: [
    'Counting only the one-way length — current flows OUT and BACK, so voltage drop uses TWICE the run length.',
    'Sizing by current rating alone — a wire can be "rated" for the current yet still drop far too much voltage over a long run.',
    'Ignoring that thin, long DC feeds waste real power as heat (I²R) on top of the voltage sag.',
  ],
  warnings:
    'DC or SINGLE-PHASE AC only: round-trip resistance R = ρ(T)·2L/A, drop = I·R. For a ' +
    'THREE-PHASE feeder use √3·L·I·R per phase — this calculator will read about 15% high. ' +
    'Solid annealed copper (IACS: ρ = 1.7241×10⁻⁸ Ω·m at 20 °C, rising 0.393% per °C), at the ' +
    'conductor temperature you enter — use 75 °C (or the insulation rating) for a cable carrying ' +
    'its load; costed at 20 °C a loaded cable’s drop reads about 18% low. Stranded wire reads about ' +
    '2% higher than solid. Conductor reactance, power factor and connector resistance are not ' +
    'modelled (reactance matters on large AC conductors). AWG area from the ASTM B258 definition.',
  glossary: ['Voltage', 'Resistance', 'Current', 'AWG', 'Power'],
  fields: [
    { key: 'awg', name: 'WIRE GAUGE (AWG)', quantity: 'number', signed: true, integer: true, range: [-3, 40], placeholder: '16', help: 'American Wire Gauge — smaller number = thicker wire.' },
    { key: 'len', name: 'RUN LENGTH (one way)', quantity: 'length', placeholder: '30', help: 'One-way cable length; the calc doubles it for the return path.', warn: { test: (x) => x <= 0, msg: 'Length must be greater than zero.' } },
    { key: 'current', name: 'CURRENT', quantity: 'current', nonNegative: true, placeholder: '3', help: 'Current the load draws through the cable.', warn: { test: (x) => x <= 0, msg: 'Current must be greater than zero.' } },
    { key: 'vsrc', name: 'SUPPLY VOLTAGE', quantity: 'voltage', nonNegative: true, placeholder: '48', help: 'Source voltage, for the percentage-drop figure.', warn: { test: (x) => x <= 0, msg: 'Voltage must be greater than zero.' } },
    { key: 'pct', name: 'ALLOWABLE DROP', quantity: 'percent', nonNegative: true, placeholder: '3', help: 'The maximum voltage drop you will accept, in percent.', warn: { test: (x) => x <= 0, msg: 'Allowable drop must be greater than zero.' } },
    { key: 'condTemp', name: 'CONDUCTOR TEMPERATURE', quantity: 'temperature', signed: true, range: CU_TEMP_RANGE, placeholder: '75', help: 'How hot the copper runs. For a cable carrying its full load use the insulation’s rated temperature — 75 °C is the NEC Chapter 9 Table 8 basis. Use 20 °C only for a cool, lightly loaded run. Copper resistance rises 0.393% per °C.' },
  ],
  functions: [
    {
      key: 'drop',
      name: 'Voltage drop over a run',
      inputs: ['awg', 'len', 'current', 'vsrc', 'condTemp'],
      formula: 'R = ρ(T)·2L/A; ρ(T) = ρ₂₀·(1 + 0.00393·(T − 20)); Vdrop = I·R; loss = I²·R',
      plainFormula:
        'The round-trip resistance equals the copper resistivity at the conductor temperature times twice the length over the cross-section area; the voltage drop equals the current times that resistance; and the power lost equals the current squared times the resistance.',
      explain:
        'Every metre of cable has resistance, and the current flows out and back (hence ×2), dropping voltage before it reaches the load. Copper resistance rises with temperature (0.393% per °C), so a loaded cable at 75 °C drops about 22% more than the same cable at 20 °C. This gives the round-trip resistance, the volts lost, the share that never arrives, and the power burned as heat. Model: solid copper, DC or single-phase AC, no reactance.',
      keySymbols: ['ρ', '·', '/', 'R', 'x²'],
      compute: (v) => {
        const A = awgAreaM2(n(v.awg));
        const R = (rhoCopper(condTempOf(v)) * 2 * n(v.len)) / A;
        const vd = n(v.current) * R;
        // I·R at or past the supply (calc check A, 2026-10-03): VOLTAGE AT LOAD
        // went NEGATIVE (−12 V from a 48 V supply), the drop read over 100% and
        // the cable "lost" more power than the supply gives. Ohm's law says this
        // current cannot flow — the model breaks down, so say that instead.
        if (vd > 0 && vd >= n(v.vsrc)) {
          return [
            { label: 'ROUND-TRIP RESISTANCE', value: R, quantity: 'impedance' },
            { label: 'MODEL BREAKS DOWN', text: dropBreaksDownWhy(n(v.current), R, n(v.vsrc)), refusal: true },
            { label: 'THE FIGURES', text: dropBreaksDownFigures(n(v.current), R, n(v.vsrc)) },
          ];
        }
        return [
          { label: 'ROUND-TRIP RESISTANCE', value: R, quantity: 'impedance' },
          { label: 'VOLTAGE DROP', value: vd, quantity: 'voltage' },
          { label: 'DROP AS PERCENT', value: (vd / n(v.vsrc)) * 100, quantity: 'percent', chainable: false },
          { label: 'VOLTAGE AT LOAD', value: n(v.vsrc) - vd, quantity: 'voltage', chainable: false },
          { label: 'POWER LOST IN CABLE', value: n(v.current) * n(v.current) * R, quantity: 'power', chainable: false },
        ];
      },
      steps: (v) => {
        const A = awgAreaM2(n(v.awg));
        const T = condTempOf(v);
        const R = (rhoCopper(T) * 2 * n(v.len)) / A;
        const vd = n(v.current) * R;
        return [
          // Written as the trade writes it (calc check A, 2026-10-03): −1 AWG
          // printed "-1 AWG" here — the hunt-6 "-7 AWG" class; it is 2/0.
          `${awgName(Math.round(n(v.awg))) ?? `${fmtInt(n(v.awg))} AWG`} ≈ ${fmt(A * 1e6)} mm²; round trip = 2 × ${fmt(n(v.len))} m.`,
          `${rhoStep(T)}.`,
          `R = (${fmt(rhoCopper(T))} × ${fmt(2 * n(v.len))}) ÷ ${fmt(A)} = ${fmt(R)} Ω.`,
          vd > 0 && vd >= n(v.vsrc)
            ? dropBreaksDown(n(v.current), R, n(v.vsrc))
            : `Vdrop = ${fmt(n(v.current))} A × ${fmt(R)} Ω = ${fmt(vd)} V (${fmt((vd / n(v.vsrc)) * 100)}% of ${fmt(n(v.vsrc))} V); ${fmt(n(v.current) * n(v.current) * R)} W is lost as heat.`,
        ];
      },
    },
    {
      key: 'gaugeFor',
      name: 'Gauge needed for an allowable drop (reverse)',
      inputs: ['len', 'current', 'vsrc', 'pct', 'condTemp'],
      formula: 'A = ρ(T)·2L·I / (Vsrc·pct%)',
      plainFormula:
        'The required conductor area equals the copper resistivity at the conductor temperature times twice the length times the current, divided by the supply voltage times the allowable-drop percentage.',
      explain:
        'The voltage-drop calculation solved backwards: the wire cross-section — and so the gauge — needed to keep a run within an allowable percentage drop. A longer run or more current needs more copper; choose the resulting AWG number or thicker (a lower number).',
      keySymbols: ['ρ', '·', '/', '%'],
      note:
        'Voltage-drop sizing only — this is NOT an ampacity calculation. It gives the smallest ' +
        'conductor that stays inside your drop budget; it does not check whether that conductor ' +
        'can safely or legally carry the current. Size for ampacity FIRST from the applicable ' +
        'code (NEC Table 310.16 / IEC 60364-5-52), including bundling, ambient-temperature and ' +
        'conduit-fill derating, then use this result only to go THICKER if the drop demands it. ' +
        'Whichever is larger wins.',
      compute: (v) => {
        const vdMax = (n(v.vsrc) * n(v.pct)) / 100;
        const Rmax = vdMax / n(v.current);
        const A = (rhoCopper(condTempOf(v)) * 2 * n(v.len)) / Rmax;
        const awgReal = awgFromAreaM2(A);
        const awg = Math.floor(snapWhole(awgReal));
        // Thicker than 0 AWG (hunt 6, 2026-10-03): a big feeder printed a gauge
        // that does not exist — "-7" for 239 mm² (past 4/0, the scale's end),
        // "-1" for what the trade calls 2/0. Named as written, or "beyond 4/0".
        const name = awgName(awg);
        return [
          // Unit in the LABEL: a 'number' output prints no unit of its own, so
          // "REQUIRED AREA 2.155" left mm² vs m² vs kcmil to guesswork.
          { label: 'REQUIRED AREA (mm²)', value: A * 1e6, quantity: 'number', chainable: false },
          // ⛔ NOT 'USE THIS AWG'. The old label read as a recommendation for a number
          //    derived ONLY from the drop budget: 5 m / 20 A / 120 V / 3% returns 17 AWG,
          //    which on a 20 A branch circuit is a fire. The ampacity check is the
          //    caller's, from the code table — see `note` above.
          // Finer than 40 AWG (calc accuracy audit, 2026-10-04): a tiny current
          // over a short run printed "92 AWG" — a gauge no table lists. The drop
          // is simply not the limit; ampacity decides.
          awg > AWG_FINEST && Number.isFinite(awg)
            ? {
                label: 'DROP-LIMITED AWG (CHECK AMPACITY)',
                text: `Any gauge up to ${AWG_FINEST} AWG (the finest this calculator covers) keeps the drop inside the budget — the drop does not limit this run. Size it by ampacity.`,
              }
            : awg >= 0 || !Number.isFinite(awg)
            ? { label: 'DROP-LIMITED AWG (CHECK AMPACITY)', value: awg, quantity: 'number', chainable: false }
            : {
                label: 'DROP-LIMITED AWG (CHECK AMPACITY)',
                text: name
                  ? `${name} or thicker.`
                  : `Thicker than 4/0 AWG — past the end of the AWG scale. Choose a conductor of at least ${fmt(A * 1e6)} mm² (kcmil sizes).`,
              },
          { label: 'MAX ALLOWABLE DROP', value: vdMax, quantity: 'voltage', chainable: false },
        ];
      },
      steps: (v) => {
        const T = condTempOf(v);
        const vdMax = (n(v.vsrc) * n(v.pct)) / 100;
        const Rmax = vdMax / n(v.current);
        const A = (rhoCopper(T) * 2 * n(v.len)) / Rmax;
        const awgReal = awgFromAreaM2(A);
        const awg = Math.floor(snapWhole(awgReal));
        const name = Number.isFinite(awg) ? awgName(awg) : `${fmtInt(awg)} AWG`;
        return [
          `Allowable drop = ${fmt(n(v.pct))}% × ${fmt(n(v.vsrc))} V = ${fmt(vdMax)} V, so max resistance = ${fmt(Rmax)} Ω.`,
          `${rhoStep(T)}.`,
          `Required area = (${fmt(rhoCopper(T))} × ${fmt(2 * n(v.len))}) ÷ ${fmt(Rmax)} = ${fmt(A * 1e6)} mm².`,
          // Never "about −1.3 AWG" (hunt 7, 2026-10-03 — the hunt-6 "-7 AWG"
          // class, left in the steps): past 0 AWG there is no such number.
          awg > AWG_FINEST && Number.isFinite(awg)
            ? `That is finer than ${AWG_FINEST} AWG — any gauge this calculator covers stays inside the drop budget, so the drop does not limit this run.`
            : name && awg < 0
            ? `That is thicker than 0 AWG — so on DROP ALONE, ${name} or thicker.`
            : name
            ? `That is about ${fmt(awgReal)} AWG — so on DROP ALONE, ${name} or thicker (a LOWER gauge number).`
            : `That is thicker than 4/0 AWG, past the end of the AWG scale — so on DROP ALONE, a conductor of at least ${fmt(A * 1e6)} mm² (kcmil sizes).`,
          'Now check ampacity against the applicable code table for this circuit and its derating, and use whichever conductor is LARGER. Drop sizing alone can return a conductor that cannot legally or safely carry the current.',
        ];
      },
    },
  ],
};

const RACK: Workspace = {
  id: 'rackheat',
  name: 'Rack Power & Heat',
  tagline: 'Current draw · BTU/hr · cooling airflow',
  section: 'electronics',
  reportPrefix: 'RACK',
  intro:
    'Every watt a rack draws that isn’t leaving as sound leaves as heat. Enter the total device ' +
    'wattage and read the mains current it pulls, the heat it dumps in BTU/hr, and the airflow ' +
    'needed to hold a chosen temperature rise.',
  whyItMatters:
    'Racks trip breakers and cook gear when nobody added up the load. This sizes the circuit ' +
    '(amps), the room/AC load (BTU/hr), and the fans (CFM) before the amp shuts down mid-show or ' +
    'the converters drift with heat.',
  example:
    'A rack pulling 800 W on 120 V draws ≈ 6.7 A and dumps ≈ 2730 BTU/hr. To hold a 10 °F rise you ' +
    'need roughly 2730 ÷ (1.08·10) ≈ 253 CFM of airflow through it.',
  mistakes: [
    'Loading a 15 A circuit to its rating — keep continuous draw under ~80% (≈12 A) so it doesn’t nuisance-trip.',
    'Forgetting that amplifier heat scales with how hard it’s driven, not its idle draw — size for the show, not the standby.',
    'Sealing gear in a rack with no airflow path — heat has to leave or the thermal protection will end your night.',
  ],
  warnings:
    'BTU/hr = W × 3.4121 (NIST SP 811); mains current I = P/V; cooling airflow CFM = BTU/hr ÷ (1.08·ΔT°F), ' +
    'where 1.08 is standard sea-level air (0.075 lb/ft³ × 0.24 BTU/lb·°F × 60 min/hr) — thinner air at ' +
    'altitude needs MORE airflow than shown. ' +
    'I = P/V ASSUMES A POWER FACTOR OF 1 — gear with a lower power factor (many switch-mode ' +
    'amplifier supplies sit at 0.6–0.9) draws MORE current than shown, so treat this as a floor ' +
    'and confirm against the nameplate current rating. Duty cycle and rack airflow paths vary.',
  glossary: ['Power', 'Current', 'Voltage', 'Amplifier'],
  fields: [
    { key: 'watts', name: 'TOTAL POWER DRAW', quantity: 'power', placeholder: '800', help: 'Sum of every device’s real power draw under load.', warn: { test: (x) => x <= 0, msg: 'Power must be greater than zero.' } },
    { key: 'mains', name: 'MAINS VOLTAGE', quantity: 'voltage', nonNegative: true, placeholder: '120', help: 'Wall voltage: 120 V (US) or 230 V (EU).', warn: { test: (x) => x <= 0, msg: 'Voltage must be greater than zero.' } },
    { key: 'dTempF', name: 'ALLOWABLE TEMP RISE (°F)', quantity: 'number', nonNegative: true, placeholder: '10', help: 'How many °F warmer the rack exhaust may be than the intake.', warn: { test: (x) => x <= 0, msg: 'Temperature rise must be greater than zero.' } },
    { key: 'breaker', name: 'BREAKER RATING', quantity: 'current', nonNegative: true, placeholder: '15', help: 'The circuit breaker’s amp rating, for the safe-load figure.', warn: { test: (x) => x <= 0, msg: 'Breaker rating must be greater than zero.' } },
  ],
  functions: [
    {
      key: 'heatLoad',
      name: 'Current, heat & airflow',
      inputs: ['watts', 'mains', 'dTempF'],
      formula: 'I = P/V; BTU/hr = W·3.4121; CFM = BTU/hr / (1.08·ΔT)',
      plainFormula:
        'The mains current equals the power over the voltage; the heat output equals the wattage times 3.4121 BTU per hour; and the cooling airflow equals the heat output divided by 1.08 times the temperature rise.',
      explain:
        'Every watt a rack draws that doesn’t leave as sound leaves as heat. From the total device wattage this gives the mains current it pulls, the heat it dumps in BTU per hour, and the airflow (CFM) needed to hold a chosen temperature rise — sizing the circuit, the AC load, and the fans before something trips or cooks.',
      keySymbols: ['Δ', '·', '/'],
      compute: (v) => {
        const W = n(v.watts);
        const btu = W * BTU_PER_HR_PER_W;
        return [
          { label: 'MAINS CURRENT', value: W / n(v.mains), quantity: 'current' },
          { label: 'HEAT OUTPUT (BTU/hr)', value: btu, quantity: 'number', chainable: false },
          { label: 'COOLING AIRFLOW (CFM)', value: btu / (1.08 * n(v.dTempF)), quantity: 'number', chainable: false },
        ];
      },
      steps: (v) => {
        const W = n(v.watts);
        const btu = W * BTU_PER_HR_PER_W;
        return [
          `Current = ${fmt(W)} W ÷ ${fmt(n(v.mains))} V = ${fmt(W / n(v.mains))} A.`,
          `Heat = ${fmt(W)} × 3.4121 = ${fmt(btu)} BTU/hr (1 W = 3.4121 BTU/hr).`,
          `Airflow to hold a ${fmt(n(v.dTempF))} °F rise ≈ ${fmt(btu)} ÷ (1.08 × ${fmt(n(v.dTempF))}) = ${fmt(btu / (1.08 * n(v.dTempF)))} CFM.`,
        ];
      },
    },
    {
      key: 'safeLoad',
      name: 'Safe wattage for a breaker',
      inputs: ['breaker', 'mains'],
      formula: 'P_safe = 0.8 · I_breaker · V',
      plainFormula: 'The safe continuous power equals 0.8 times the breaker’s current rating times the voltage.',
      explain:
        'The 80% rule for continuous loads: keep a circuit’s ongoing draw under 80% of its breaker rating so it doesn’t nuisance-trip. This turns a breaker’s amp rating and the mains voltage into the safe continuous wattage — and the absolute maximum for reference.',
      keySymbols: ['·'],
      note: 'The 80% rule for continuous loads keeps the breaker from nuisance-tripping.',
      compute: (v) => {
        const full = n(v.breaker) * n(v.mains);
        return [
          { label: 'SAFE CONTINUOUS POWER (80%)', value: 0.8 * full, quantity: 'power' },
          { label: 'ABSOLUTE MAX POWER', value: full, quantity: 'power', chainable: false },
          { label: 'SAFE CONTINUOUS CURRENT', value: 0.8 * n(v.breaker), quantity: 'current', chainable: false },
        ];
      },
      steps: (v) => {
        const full = n(v.breaker) * n(v.mains);
        return [
          `Full capacity = ${fmt(n(v.breaker))} A × ${fmt(n(v.mains))} V = ${fmt(full)} W.`,
          `Keep continuous draw under 80%: ${fmt(0.8 * full)} W (${fmt(0.8 * n(v.breaker))} A).`,
        ];
      },
    },
  ],
};

const COMPLEXZ: Workspace = {
  id: 'complexz',
  name: 'Complex Impedance',
  tagline: 'Reactance, magnitude, phase & resonance',
  section: 'electronics',
  reportPrefix: 'Z',
  intro:
    'Resistors, inductors, and capacitors each oppose AC differently. Inductive reactance rises ' +
    'with frequency, capacitive reactance falls, and together with resistance they set the total ' +
    'impedance magnitude and its phase angle. Enter R, L, C and a frequency to see all of it.',
  whyItMatters:
    'This is the engine under crossovers, filters, EQ, pickup loading, and impedance matching. ' +
    'Where inductive and capacitive reactance cancel, the circuit RESONATES — the frequency where ' +
    'a series LC looks purely resistive (and a parallel LC looks huge).',
  example:
    'R = 8 Ω, L = 1 mH, C = 10 µF at 1 kHz: XL = 2π·1000·0.001 ≈ 6.28 Ω, XC = 1/(2π·1000·10µ) ≈ ' +
    '15.9 Ω, so |Z| = √(8² + (6.28−15.9)²) ≈ 12.5 Ω, phase ≈ −50° (capacitive). Resonance sits at ' +
    '1/(2π√(LC)) ≈ 1.59 kHz.',
  mistakes: [
    'Adding reactances to resistance arithmetically — they combine in quadrature: |Z| = √(R² + X²), not R + X.',
    'Forgetting the sign: inductive reactance leads (+), capacitive lags (−); the NET reactance is XL − XC.',
    'Reading a phase angle without its meaning — positive = inductive (current lags), negative = capacitive (current leads).',
  ],
  warnings:
    'Ideal lumped components. XL = 2πfL, XC = 1/(2πfC), |Z| = √(R²+(XL−XC)²), phase = ' +
    'atan((XL−XC)/R), series resonance f₀ = 1/(2π√(LC)). Real parts have parasitics and tolerance. ' +
    'Enter L in mH and C in µF.',
  glossary: ['Impedance', 'Reactance', 'Resonance', 'Capacitor', 'Inductor', 'Resistance'],
  fields: [
    { key: 'r', name: 'RESISTANCE', quantity: 'impedance', placeholder: '8', help: 'Series resistance in ohms.', warn: { test: (x) => x < 0, msg: 'Resistance cannot be negative.' } },
    { key: 'indmH', name: 'INDUCTANCE (mH)', quantity: 'number', nonNegative: true, placeholder: '1', help: 'Inductance in millihenries.', warn: { test: (x) => x < 0, msg: 'Inductance cannot be negative.' } },
    { key: 'capuF', name: 'CAPACITANCE (µF)', quantity: 'number', nonNegative: true, placeholder: '10', help: 'Capacitance in microfarads.', warn: { test: (x) => x <= 0, msg: 'Capacitance must be greater than zero.' } },
    { key: 'f', name: 'FREQUENCY', quantity: 'frequency', placeholder: '1000', help: 'The frequency to evaluate the impedance at.', warn: { test: (x) => x <= 0, msg: 'Frequency must be greater than zero.' } },
  ],
  functions: [
    {
      key: 'impedance',
      name: 'Impedance magnitude & phase at a frequency',
      inputs: ['r', 'indmH', 'capuF', 'f'],
      formula: '|Z| = √(R² + (XL − XC)²); φ = atan((XL − XC)/R)',
      plainFormula:
        'The impedance magnitude equals the square root of resistance squared plus the net reactance squared; the phase angle is the arctangent of the net reactance over the resistance.',
      explain:
        'Resistors, inductors, and capacitors oppose AC differently, and they combine in quadrature — not by simple addition. This gives the total impedance magnitude and its phase angle at a frequency. Positive phase is inductive (current lags); negative is capacitive (current leads); the net reactance is XL minus XC.',
      keySymbols: ['| |', 'Z', '√', 'R', 'X', 'x²', '−', 'φ', '/'],
      compute: (v) => {
        const R = n(v.r);
        const L = n(v.indmH) / 1000;
        const C = n(v.capuF) / 1e6;
        const w = 2 * Math.PI * n(v.f);
        const XL = w * L;
        const XC = 1 / (w * C);
        const X = XL - XC;
        const mag = Math.sqrt(R * R + X * X);
        const phase = (Math.atan2(X, R) * 180) / Math.PI;
        return [
          { label: 'IMPEDANCE MAGNITUDE |Z|', value: mag, quantity: 'impedance' },
          { label: 'PHASE ANGLE', value: phase, quantity: 'angle' },
          { label: 'INDUCTIVE REACTANCE XL', value: XL, quantity: 'impedance', chainable: false },
          { label: 'CAPACITIVE REACTANCE XC', value: XC, quantity: 'impedance', chainable: false },
        ];
      },
      steps: (v) => {
        const R = n(v.r);
        const L = n(v.indmH) / 1000;
        const C = n(v.capuF) / 1e6;
        const w = 2 * Math.PI * n(v.f);
        const XL = w * L;
        const XC = 1 / (w * C);
        const X = XL - XC;
        const mag = Math.sqrt(R * R + X * X);
        const phase = (Math.atan2(X, R) * 180) / Math.PI;
        return [
          `XL = 2π·${fmt(n(v.f))}·${fmt(L)} = ${fmt(XL)} Ω; XC = 1/(2π·${fmt(n(v.f))}·${fmt(C)}) = ${fmt(XC)} Ω.`,
          `Net reactance X = ${fmt(XL)} − ${fmt(XC)} = ${fmt(X)} Ω.`,
          `|Z| = √(${fmt(R)}² + ${fmt(X)}²) = ${fmt(mag)} Ω, phase = ${fmt(phase)}° (${phase >= 0 ? 'inductive' : 'capacitive'}).`,
        ];
      },
    },
    {
      key: 'resonance',
      name: 'LC resonant frequency',
      inputs: ['indmH', 'capuF'],
      formula: 'f₀ = 1 / (2π·√(L·C))',
      plainFormula:
        'The resonant frequency equals one divided by two pi times the square root of the inductance times the capacitance.',
      explain:
        'Where inductive and capacitive reactance cancel, the circuit resonates. This finds that frequency for a given inductor and capacitor. At resonance a series LC looks purely resistive (and a parallel LC looks very large) — the tuning behind crossovers and filters.',
      keySymbols: ['f', '/', 'π', '·', '√', 'x₁'],
      compute: (v) => {
        const L = n(v.indmH) / 1000;
        const C = n(v.capuF) / 1e6;
        const f0 = 1 / (2 * Math.PI * Math.sqrt(L * C));
        return [
          { label: 'RESONANT FREQUENCY', value: f0, quantity: 'frequency' },
          { label: 'ANGULAR FREQUENCY ω₀ (rad/s)', value: 2 * Math.PI * f0, quantity: 'number', chainable: false },
        ];
      },
      steps: (v) => {
        const L = n(v.indmH) / 1000;
        const C = n(v.capuF) / 1e6;
        const f0 = 1 / (2 * Math.PI * Math.sqrt(L * C));
        return [
          `f₀ = 1 ÷ (2π·√(${fmt(L)} H × ${fmt(C)} F)) = ${fmt(f0)} Hz.`,
          `At ${fmt(f0)} Hz inductive and capacitive reactance cancel — a series LC looks purely resistive there.`,
        ];
      },
    },
  ],
};

export const WORKSPACES_POWER_ELEC: Workspace[] = [TRANSFORMER, PADS, VDROP, RACK, COMPLEXZ];
