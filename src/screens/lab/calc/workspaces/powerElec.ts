/**
 * Workspaces — Power & Electronics (owner buildout 2026-08-07):
 * Transformer Ratios · Pads & Attenuators · Voltage Drop · Rack Power & Heat ·
 * Complex Impedance. Section 'electronics'. Same pattern as wave.ts.
 *
 * Inductance is entered in mH and capacitance in µF (there is no dedicated
 * QuantityKind for either); the compute() converts to base H/F.
 */
import type { Workspace } from '../calcTypes';
import { fmt } from '../calcUnits';

const n = (v: number | number[]) => (typeof v === 'number' ? v : v[0] ?? NaN);

const RHO_CU = 1.724e-8; // copper resistivity, Ω·m at 20 °C
/** AWG → conductor diameter (mm). */
const awgDiaMm = (awg: number) => 0.127 * Math.pow(92, (36 - awg) / 39);
/** AWG → cross-section area (m²). */
const awgAreaM2 = (awg: number) => Math.PI * Math.pow(awgDiaMm(awg) / 2 / 1000, 2);
/** Area (m²) → nearest AWG (real number; floor it to size UP a wire). */
const awgFromAreaM2 = (aM2: number) => {
  const dMm = 2000 * Math.sqrt(aM2 / Math.PI);
  return 36 - 39 * (Math.log(dMm / 0.127) / Math.log(92));
};

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
    { key: 'turns', name: 'TURNS RATIO (primary:secondary)', quantity: 'number', placeholder: '2', help: 'Primary turns ÷ secondary turns.', warn: { test: (x) => x <= 0, msg: 'Turns ratio must be greater than zero.' } },
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
          `A ${fmt(n(v.zs))} Ω load looks like ${fmt(zp)} Ω through an ${fmt(n(v.turns))}:1 transformer.`,
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
    { key: 'atten', name: 'ATTENUATION', quantity: 'db', placeholder: '20', help: 'How many dB to drop the signal.', warn: { test: (x) => x <= 0, msg: 'Attenuation must be greater than zero dB.' } },
    { key: 'z', name: 'CHARACTERISTIC IMPEDANCE', quantity: 'impedance', placeholder: '600', help: 'The line impedance the pad must match on both sides.', warn: { test: (x) => x <= 0, msg: 'Impedance must be greater than zero.' } },
  ],
  functions: [
    {
      key: 'tpad',
      name: 'T-pad resistor values',
      inputs: ['atten', 'z'],
      formula: 'R1=R2 = Z·(K−1)/(K+1) · R3 = Z·2K/(K²−1) · K = 10^(dB/20)',
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
      formula: 'series R = Z·(K²−1)/(2K) · each shunt R = Z·(K+1)/(K−1)',
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
    'A 30 m run of 16 AWG carrying 3 A from a 48 V supply: round-trip resistance ≈ 0.81 Ω, so the ' +
    'drop ≈ 2.4 V (≈ 5%) and ≈ 7.3 W is lost as heat in the cable.',
  mistakes: [
    'Counting only the one-way length — current flows OUT and BACK, so voltage drop uses TWICE the run length.',
    'Sizing by current rating alone — a wire can be "rated" for the current yet still drop far too much voltage over a long run.',
    'Ignoring that thin, long DC feeds waste real power as heat (I²R) on top of the voltage sag.',
  ],
  warnings:
    'Copper at 20 °C (ρ = 1.724×10⁻⁸ Ω·m); resistance rises ~0.4%/°C when hot. Round-trip ' +
    'resistance R = ρ·2L/A; drop = I·R. AWG area from the standard geometric definition.',
  glossary: ['Voltage', 'Resistance', 'Current', 'AWG', 'Power'],
  fields: [
    { key: 'awg', name: 'WIRE GAUGE (AWG)', quantity: 'number', placeholder: '16', help: 'American Wire Gauge — smaller number = thicker wire.' },
    { key: 'len', name: 'RUN LENGTH (one way)', quantity: 'length', placeholder: '30', help: 'One-way cable length; the calc doubles it for the return path.', warn: { test: (x) => x <= 0, msg: 'Length must be greater than zero.' } },
    { key: 'current', name: 'CURRENT', quantity: 'current', placeholder: '3', help: 'Current the load draws through the cable.', warn: { test: (x) => x <= 0, msg: 'Current must be greater than zero.' } },
    { key: 'vsrc', name: 'SUPPLY VOLTAGE', quantity: 'voltage', placeholder: '48', help: 'Source voltage, for the percentage-drop figure.', warn: { test: (x) => x <= 0, msg: 'Voltage must be greater than zero.' } },
    { key: 'pct', name: 'ALLOWABLE DROP', quantity: 'percent', placeholder: '3', help: 'The maximum voltage drop you will accept, in percent.', warn: { test: (x) => x <= 0, msg: 'Allowable drop must be greater than zero.' } },
  ],
  functions: [
    {
      key: 'drop',
      name: 'Voltage drop over a run',
      inputs: ['awg', 'len', 'current', 'vsrc'],
      formula: 'R = ρ·2L/A · Vdrop = I·R · loss = I²·R',
      plainFormula:
        'The round-trip resistance equals the resistivity times twice the length over the cross-section area; the voltage drop equals the current times that resistance; and the power lost equals the current squared times the resistance.',
      explain:
        'Every metre of cable has resistance, and the current flows out and back (hence ×2), dropping voltage before it reaches the load. This gives the round-trip resistance, the volts lost, the share that never arrives, and the power burned as heat — the physics behind sagging long DC and phantom feeds.',
      keySymbols: ['ρ', '·', '/', 'R', 'x²'],
      compute: (v) => {
        const A = awgAreaM2(n(v.awg));
        const R = (RHO_CU * 2 * n(v.len)) / A;
        const vd = n(v.current) * R;
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
        const R = (RHO_CU * 2 * n(v.len)) / A;
        const vd = n(v.current) * R;
        return [
          `${fmt(n(v.awg))} AWG ≈ ${fmt(A * 1e6)} mm²; round trip = 2 × ${fmt(n(v.len))} m.`,
          `R = (1.724e-8 × ${fmt(2 * n(v.len))}) ÷ ${fmt(A)} = ${fmt(R)} Ω.`,
          `Vdrop = ${fmt(n(v.current))} A × ${fmt(R)} Ω = ${fmt(vd)} V (${fmt((vd / n(v.vsrc)) * 100)}% of ${fmt(n(v.vsrc))} V); ${fmt(n(v.current) * n(v.current) * R)} W is lost as heat.`,
        ];
      },
    },
    {
      key: 'gaugeFor',
      name: 'Gauge needed for an allowable drop (reverse)',
      inputs: ['len', 'current', 'vsrc', 'pct'],
      formula: 'A = ρ·2L·I / (Vsrc·pct%)',
      plainFormula:
        'The required conductor area equals the resistivity times twice the length times the current, divided by the supply voltage times the allowable-drop percentage.',
      explain:
        'The voltage-drop calculation solved backwards: the wire cross-section — and so the gauge — needed to keep a run within an allowable percentage drop. A longer run or more current needs more copper; choose the resulting AWG number or thicker (a lower number).',
      keySymbols: ['ρ', '·', '/', '%'],
      compute: (v) => {
        const vdMax = (n(v.vsrc) * n(v.pct)) / 100;
        const Rmax = vdMax / n(v.current);
        const A = (RHO_CU * 2 * n(v.len)) / Rmax;
        const awgReal = awgFromAreaM2(A);
        return [
          { label: 'REQUIRED AREA', value: A * 1e6, quantity: 'number', chainable: false },
          { label: 'USE THIS AWG OR THICKER', value: Math.floor(awgReal), quantity: 'number', chainable: false },
          { label: 'MAX ALLOWABLE DROP', value: vdMax, quantity: 'voltage', chainable: false },
        ];
      },
      steps: (v) => {
        const vdMax = (n(v.vsrc) * n(v.pct)) / 100;
        const Rmax = vdMax / n(v.current);
        const A = (RHO_CU * 2 * n(v.len)) / Rmax;
        const awgReal = awgFromAreaM2(A);
        return [
          `Allowable drop = ${fmt(n(v.pct))}% × ${fmt(n(v.vsrc))} V = ${fmt(vdMax)} V, so max resistance = ${fmt(Rmax)} Ω.`,
          `Required area = (1.724e-8 × ${fmt(2 * n(v.len))}) ÷ ${fmt(Rmax)} = ${fmt(A * 1e6)} mm².`,
          `That is about ${fmt(awgReal)} AWG — choose ${Math.floor(awgReal)} AWG or thicker (a LOWER gauge number).`,
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
    'BTU/hr = W × 3.412; mains current I = P/V; cooling airflow CFM ≈ BTU/hr ÷ (1.08·ΔT°F). ' +
    'These size a starting point — real device power factor, duty cycle, and rack airflow paths vary.',
  glossary: ['Power', 'Current', 'Voltage', 'Amplifier'],
  fields: [
    { key: 'watts', name: 'TOTAL POWER DRAW', quantity: 'power', placeholder: '800', help: 'Sum of every device’s real power draw under load.', warn: { test: (x) => x <= 0, msg: 'Power must be greater than zero.' } },
    { key: 'mains', name: 'MAINS VOLTAGE', quantity: 'voltage', placeholder: '120', help: 'Wall voltage: 120 V (US) or 230 V (EU).', warn: { test: (x) => x <= 0, msg: 'Voltage must be greater than zero.' } },
    { key: 'dTempF', name: 'ALLOWABLE TEMP RISE (°F)', quantity: 'number', placeholder: '10', help: 'How many °F warmer the rack exhaust may be than the intake.', warn: { test: (x) => x <= 0, msg: 'Temperature rise must be greater than zero.' } },
    { key: 'breaker', name: 'BREAKER RATING', quantity: 'current', placeholder: '15', help: 'The circuit breaker’s amp rating, for the safe-load figure.', warn: { test: (x) => x <= 0, msg: 'Breaker rating must be greater than zero.' } },
  ],
  functions: [
    {
      key: 'heatLoad',
      name: 'Current, heat & airflow',
      inputs: ['watts', 'mains', 'dTempF'],
      formula: 'I = P/V · BTU/hr = W·3.412 · CFM = BTU/hr / (1.08·ΔT)',
      plainFormula:
        'The mains current equals the power over the voltage; the heat output equals the wattage times 3.412 BTU per hour; and the cooling airflow equals the heat output divided by 1.08 times the temperature rise.',
      explain:
        'Every watt a rack draws that doesn’t leave as sound leaves as heat. From the total device wattage this gives the mains current it pulls, the heat it dumps in BTU per hour, and the airflow (CFM) needed to hold a chosen temperature rise — sizing the circuit, the AC load, and the fans before something trips or cooks.',
      keySymbols: ['Δ', '·', '/'],
      compute: (v) => {
        const W = n(v.watts);
        const btu = W * 3.412;
        return [
          { label: 'MAINS CURRENT', value: W / n(v.mains), quantity: 'current' },
          { label: 'HEAT OUTPUT', value: btu, quantity: 'number', chainable: false },
          { label: 'COOLING AIRFLOW (CFM)', value: btu / (1.08 * n(v.dTempF)), quantity: 'number', chainable: false },
        ];
      },
      steps: (v) => {
        const W = n(v.watts);
        const btu = W * 3.412;
        return [
          `Current = ${fmt(W)} W ÷ ${fmt(n(v.mains))} V = ${fmt(W / n(v.mains))} A.`,
          `Heat = ${fmt(W)} × 3.412 = ${fmt(btu)} BTU/hr.`,
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
    { key: 'indmH', name: 'INDUCTANCE (mH)', quantity: 'number', placeholder: '1', help: 'Inductance in millihenries.', warn: { test: (x) => x < 0, msg: 'Inductance cannot be negative.' } },
    { key: 'capuF', name: 'CAPACITANCE (µF)', quantity: 'number', placeholder: '10', help: 'Capacitance in microfarads.', warn: { test: (x) => x <= 0, msg: 'Capacitance must be greater than zero.' } },
    { key: 'f', name: 'FREQUENCY', quantity: 'frequency', placeholder: '1000', help: 'The frequency to evaluate the impedance at.', warn: { test: (x) => x <= 0, msg: 'Frequency must be greater than zero.' } },
  ],
  functions: [
    {
      key: 'impedance',
      name: 'Impedance magnitude & phase at a frequency',
      inputs: ['r', 'indmH', 'capuF', 'f'],
      formula: '|Z| = √(R² + (XL − XC)²) · φ = atan((XL − XC)/R)',
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
          { label: 'ANGULAR FREQUENCY ω₀', value: 2 * Math.PI * f0, quantity: 'number', chainable: false },
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
