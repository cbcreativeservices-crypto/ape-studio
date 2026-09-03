/**
 * Workspaces — Rooms & Acoustics, ADVANCED TIER (owner buildout 2026-08-07):
 * Eyring & Millington–Sette RT · QRD diffusers · Panel & Helmholtz absorbers ·
 * Transmission-Loss (mass law). These lean on strong `warnings` blocks: they
 * are teaching models, not standards-compliant measurements.
 */
import type { Workspace } from '../calcTypes';
import { fmt, speedOfSoundAir } from '../calcUnits';

const n = (v: number | number[]) => (typeof v === 'number' ? v : v[0] ?? NaN);

/** Largest prime N the QRD workspace accepts. Real diffusers use small primes
 *  (7…199); the compute/table loop N times on EVERY keystroke, so an unbounded
 *  N (e.g. 30 000 000) froze the JS thread and OOM-killed the app (B-058). */
const QRD_MAX_N = 199;

function isPrime(x: number): boolean {
  if (!Number.isInteger(x) || x < 2 || x > QRD_MAX_N) return false;
  for (let i = 2; i * i <= x; i++) if (x % i === 0) return false;
  return true;
}

/** Well count for the QRD formulas — throws (→ runCompute's "no valid result"
 *  state) when N is out of range so the loops below are always bounded. */
function qrdN(v: number | number[]): number {
  const N = Math.round(n(v));
  if (!Number.isFinite(N) || N < 2 || N > QRD_MAX_N) throw new Error('N out of range');
  return N;
}

const EYRING: Workspace = {
  id: 'eyring',
  name: 'Eyring & Millington RT',
  tagline: 'Reverberation time in absorptive rooms',
  section: 'rooms',
  reportPrefix: 'RT',
  intro:
    'Sabine’s reverberation formula overestimates RT60 once a room is fairly dead. Eyring corrects ' +
    'it by using −ln(1−ā) instead of ā, which matters as average absorption climbs. This workspace ' +
    'gives the Eyring RT60 and shows how far it departs from Sabine for the same room.',
  whyItMatters:
    'In a well-treated control room, studio, or broadcast booth the average absorption is high — ' +
    'exactly where Sabine is worst. Using Eyring keeps predicted RT60 honest, so you don’t over- or ' +
    'under-treat. Millington–Sette goes further, weighting each surface’s own coefficient.',
  example:
    'A 120 m³ room, 160 m² of surface, average absorption ā = 0.30: Sabine RT60 = 0.161·120/(160·0.30) ' +
    '≈ 0.40 s; Eyring uses −ln(0.70) = 0.357, giving 0.161·120/(160·0.357) ≈ 0.34 s — 15% shorter, ' +
    'and closer to what you’d measure.',
  mistakes: [
    'Using Sabine in a dead room — above ā ≈ 0.2 it reads long; Eyring is the better estimate.',
    'Averaging absorption coefficients by area but forgetting that Millington–Sette weights each surface separately — a single very absorptive surface behaves differently from the same total spread thin.',
    'Treating any of these as measurements: they are geometric estimates. ISO 3382 is the measured method.',
  ],
  warnings:
    'Teaching estimates. Sabine RT60 = 0.161·V/(S·ā); Eyring RT60 = 0.161·V/(−S·ln(1−ā)); ' +
    'Millington–Sette replaces S·(−ln(1−ā)) with Σ Sᵢ·(−ln(1−αᵢ)). All assume a diffuse field and ' +
    'ignore air absorption. Formal RT60 is measured per ISO 3382.',
  glossary: ['Reverberation Time', 'RT60', 'Absorption Coefficient', 'Reverberation', 'Sabine equation'],
  fields: [
    { key: 'vol', name: 'ROOM VOLUME', quantity: 'volume', placeholder: '120', help: 'Length × width × height of the room.', warn: { test: (x) => x <= 0, msg: 'Volume must be greater than zero.' } },
    { key: 'surf', name: 'TOTAL SURFACE AREA', quantity: 'area', placeholder: '160', help: 'Sum of all boundary surfaces (walls, floor, ceiling).', warn: { test: (x) => x <= 0, msg: 'Surface area must be greater than zero.' } },
    { key: 'aBar', name: 'AVERAGE ABSORPTION (ā)', quantity: 'number', placeholder: '0.3', help: 'Area-weighted mean absorption coefficient, 0 (reflective) to ~1 (fully absorptive).', warn: { test: (x) => x <= 0 || x >= 1, msg: 'Average absorption must be between 0 and 1 (exclusive).' } },
    { key: 'rtTarget', name: 'TARGET RT60', quantity: 'time', defaultUnit: 's', placeholder: '0.3', help: 'A reverberation time you want to design toward.', warn: { test: (x) => x <= 0, msg: 'RT60 must be greater than zero.' } },
  ],
  functions: [
    {
      key: 'eyring',
      name: 'RT60 — Eyring vs Sabine',
      inputs: ['vol', 'surf', 'aBar'],
      formula: 'Eyring: RT60 = 0.161·V / (−S·ln(1−ā))',
      plainFormula:
        'The Eyring reverberation time equals 0.161 times the room volume, divided by the negative surface area times the natural log of one minus the average absorption.',
      explain:
        'Sabine’s reverberation formula reads long once a room is fairly dead. Eyring corrects it by using −ln(1−ā) in place of the raw average absorption, which matters as absorption climbs. This gives the Eyring RT60 and how far Sabine over-estimates it for the same room. It assumes a diffuse field and ignores air absorption.',
      keySymbols: ['·', '/', '−', 'ln', 'ā'],
      compute: (v) => {
        const V = n(v.vol);
        const S = n(v.surf);
        const a = n(v.aBar);
        const sabine = (0.161 * V) / (S * a);
        const eyring = (0.161 * V) / (-S * Math.log(1 - a));
        return [
          { label: 'RT60 (EYRING)', value: eyring, quantity: 'time', unit: 's' },
          { label: 'RT60 (SABINE)', value: sabine, quantity: 'time', unit: 's', chainable: false },
          { label: 'SABINE OVER-ESTIMATE', value: ((sabine - eyring) / eyring) * 100, quantity: 'percent', chainable: false },
        ];
      },
      steps: (v) => {
        const V = n(v.vol);
        const S = n(v.surf);
        const a = n(v.aBar);
        const sabine = (0.161 * V) / (S * a);
        const eyring = (0.161 * V) / (-S * Math.log(1 - a));
        return [
          `Sabine: 0.161 × ${fmt(V)} ÷ (${fmt(S)} × ${fmt(a)}) = ${fmt(sabine)} s.`,
          `Eyring uses −ln(1−ā) = −ln(${fmt(1 - a)}) = ${fmt(-Math.log(1 - a))} in place of ā.`,
          `Eyring: 0.161 × ${fmt(V)} ÷ (${fmt(S)} × ${fmt(-Math.log(1 - a))}) = ${fmt(eyring)} s — ${fmt(((sabine - eyring) / sabine) * 100)}% shorter than Sabine.`,
        ];
      },
    },
    {
      key: 'absForRt',
      name: 'Average absorption for a target RT60 (Eyring, reverse)',
      inputs: ['vol', 'surf', 'rtTarget'],
      formula: 'ā = 1 − exp(−0.161·V / (S·RT60))',
      plainFormula:
        'The required average absorption equals one minus e raised to the power of negative 0.161 times the volume, divided by the surface area times the target reverberation time.',
      explain:
        'The reverse of the Eyring model: the area-averaged absorption a room needs to reach your target RT60. It rearranges the Eyring equation to solve for absorption, then expresses that as a total absorption area (metric sabins) spread over the room’s surface.',
      keySymbols: ['ā', '−', 'e', '·', '/'],
      note: 'The area-averaged absorption the room needs to hit your target RT60, by the Eyring model.',
      compute: (v) => {
        const V = n(v.vol);
        const S = n(v.surf);
        const rt = n(v.rtTarget);
        const a = 1 - Math.exp((-0.161 * V) / (S * rt));
        const sabines = S * a; // total absorption in sabins (metric)
        return [
          { label: 'REQUIRED AVERAGE ABSORPTION ā', value: a, quantity: 'number' },
          { label: 'TOTAL ABSORPTION', value: sabines, quantity: 'area', unit: 'm2', chainable: false },
        ];
      },
      steps: (v) => {
        const V = n(v.vol);
        const S = n(v.surf);
        const rt = n(v.rtTarget);
        const a = 1 - Math.exp((-0.161 * V) / (S * rt));
        return [
          `Rearranging Eyring: ā = 1 − exp(−0.161 × ${fmt(V)} ÷ (${fmt(S)} × ${fmt(rt)})) = ${fmt(a)}.`,
          `That is ${fmt(S * a)} m² of total (metric) absorption spread over ${fmt(S)} m² of surface.`,
        ];
      },
    },
  ],
};

const DIFFUSER: Workspace = {
  id: 'diffuser',
  name: 'QRD Diffuser',
  tagline: 'Quadratic-residue well depths & bandwidth',
  section: 'rooms',
  reportPrefix: 'QRD',
  intro:
    'A quadratic-residue diffuser (QRD) is a row of wells whose depths follow the sequence ' +
    'sₙ = n² mod N, for a prime N. That number-theory pattern scatters sound evenly over a band. ' +
    'Enter the prime, the design (lowest) frequency, and the well width to get the depths and range.',
  whyItMatters:
    'A diffuser breaks up strong reflections without deadening the room — it keeps energy and ' +
    'liveliness while killing flutter and harsh specular reflections. The well depths set the LOW ' +
    'edge of diffusion; the well WIDTH sets the HIGH edge. Get them wrong and it just reflects.',
  example:
    'N = 7, design frequency 500 Hz (λ ≈ 0.686 m at 20 °C), well width 5 cm: the deepest well ' +
    '(residue 4) is 4·0.686/(2·7) ≈ 0.196 m. Diffusion runs from ~500 Hz up to c/(2·0.05) ≈ 3.4 kHz.',
  mistakes: [
    'Choosing a non-prime N — the quadratic-residue trick only spreads energy evenly for PRIME N (7, 11, 13, 17, 23…).',
    'Making wells too wide — the high-frequency limit is c/(2·width); wide wells stop diffusing early and start reflecting.',
    'Sitting too close — a diffuser needs several wavelengths of distance to form its scattered field; nearfield it just adds comb filtering.',
  ],
  warnings:
    'Idealised QRD geometry: well depth dₙ = sₙ·λ₀/(2N) with sₙ = n² mod N, low edge ≈ the design ' +
    'frequency, high edge ≈ c/(2·well width). Real diffusers add fin thickness and finite-size ' +
    'effects; treat depths as a starting point.',
  glossary: ['Diffusion', 'Reflection', 'Wavelength', 'Comb Filtering', 'Standing wave'],
  fields: [
    { key: 'N', name: 'PRIME N (well count)', quantity: 'number', placeholder: '7', help: 'Number of wells per period — MUST be prime (7, 11, 13, 17, 23…).', warn: { test: (x) => !isPrime(x), msg: 'N must be a prime number for a quadratic-residue diffuser — QRDs use small primes (7…199).' } },
    { key: 'f0', name: 'DESIGN (LOW) FREQUENCY', quantity: 'frequency', placeholder: '500', help: 'Lowest frequency you want diffused — sets the deepest well.', warn: { test: (x) => x <= 0, msg: 'Frequency must be greater than zero.' } },
    { key: 'w', name: 'WELL WIDTH', quantity: 'length', defaultUnit: 'cm', placeholder: '5', help: 'Width of each well — sets the high-frequency diffusion limit.', warn: { test: (x) => x <= 0, msg: 'Well width must be greater than zero.' } },
    { key: 'temp', name: 'AIR TEMPERATURE', quantity: 'temperature', placeholder: '20', help: 'Sets the speed of sound.' },
  ],
  functions: [
    {
      key: 'qrd',
      name: 'Well depths & diffusion bandwidth',
      inputs: ['N', 'f0', 'w', 'temp'],
      formula: 'dₙ = (n² mod N)·λ₀/(2N) · high edge = c/(2·width)',
      plainFormula:
        'Each well depth equals its residue (n squared, modulo N) times the design wavelength, divided by twice N; the high-frequency edge is the speed of sound divided by twice the well width.',
      explain:
        'A quadratic-residue diffuser is a row of wells whose depths follow the number-theory sequence n² mod N for a prime N, which scatters sound evenly over a band. The well DEPTHS set the low edge of diffusion (the design frequency); the well WIDTH sets the high edge. N must be prime for the pattern to spread energy evenly.',
      keySymbols: ['λ', '·', '/', 'c', 'x²', 'x₁'],
      compute: (v) => {
        const c = speedOfSoundAir(n(v.temp));
        const N = qrdN(v.N);
        const lam0 = c / n(v.f0);
        let maxRes = 0;
        for (let i = 0; i < N; i++) maxRes = Math.max(maxRes, (i * i) % N);
        const maxDepth = (maxRes * lam0) / (2 * N);
        const hi = c / (2 * n(v.w));
        return [
          { label: 'DEEPEST WELL', value: maxDepth, quantity: 'length', unit: 'cm' },
          { label: 'LOW DIFFUSION EDGE', value: n(v.f0), quantity: 'frequency', chainable: false },
          { label: 'HIGH DIFFUSION EDGE', value: hi, quantity: 'frequency' },
          { label: 'TOTAL PANEL WIDTH (one period)', value: N * n(v.w), quantity: 'length', unit: 'cm', chainable: false },
        ];
      },
      steps: (v) => {
        const c = speedOfSoundAir(n(v.temp));
        const N = qrdN(v.N);
        const lam0 = c / n(v.f0);
        return [
          `λ₀ = ${fmt(c)} ÷ ${fmt(n(v.f0))} = ${fmt(lam0)} m at ${fmt(n(v.temp))} °C.`,
          `Each well depth dₙ = (n² mod ${N}) × ${fmt(lam0)} ÷ (2 × ${N}) — see the table below.`,
          `Diffusion runs from the ${fmt(n(v.f0))} Hz design frequency up to c/(2·width) = ${fmt(c / (2 * n(v.w)))} Hz.`,
        ];
      },
      table: (v) => {
        const c = speedOfSoundAir(n(v.temp));
        const N = qrdN(v.N);
        const lam0 = c / n(v.f0);
        const rows: string[][] = [];
        for (let i = 0; i < N; i++) {
          const res = (i * i) % N;
          const depthM = (res * lam0) / (2 * N);
          rows.push([String(i), String(res), `${fmt(depthM * 100)} cm`]);
        }
        return { title: 'WELL DEPTH SEQUENCE', cols: ['Well n', 'n² mod N', 'Depth'], rows };
      },
    },
  ],
};

const ABSORBER: Workspace = {
  id: 'absorber',
  name: 'Panel & Helmholtz Absorbers',
  tagline: 'Tuned low-frequency absorber resonance',
  section: 'rooms',
  reportPrefix: 'ABS',
  intro:
    'Porous absorption struggles low; tuned absorbers fill the gap. A PANEL (membrane) absorber ' +
    'flexes a mass over a sealed air gap; a HELMHOLTZ (perforated-panel) absorber resonates the ' +
    'air in its holes against the cavity. Both are tuned to a target frequency — here is the math.',
  whyItMatters:
    'Low-frequency room problems need absorbers that WORK low, and porous foam that thin doesn’t. ' +
    'Panel and Helmholtz resonators put absorption exactly where a mode or a boom lives, using ' +
    'depth and mass instead of metres of foam.',
  example:
    'Panel absorber: a 5 kg/m² membrane over a 5 cm gap tunes to 60/√(5·0.05) ≈ 120 Hz. ' +
    'Perforated Helmholtz: 5% open area, 10 cm cavity, 12 mm panel, 8 mm holes tunes near 280 Hz.',
  mistakes: [
    'Building a panel absorber with a leaky (non-sealed) cavity — it only works if the trapped air is the spring.',
    'Filling a Helmholtz cavity solidly with dense fill — a little damping broadens it, too much kills the resonance.',
    'Expecting a razor-sharp notch — real tuned absorbers have a useful bandwidth of roughly an octave around f₀, not a single frequency.',
  ],
  warnings:
    'Teaching approximations. Panel: f₀ ≈ 60/√(m·d) (m in kg/m², d in m). Perforated-panel ' +
    'Helmholtz: f₀ ≈ (c/2π)·√(P / (d·(t + 0.8·D))) (P = open-area fraction, d = cavity depth, ' +
    't = panel thickness, D = hole diameter). Real Q depends on damping and construction.',
  glossary: ['Absorption Coefficient', 'Resonance', 'Room Mode', 'Standing wave', 'Reverberation'],
  fields: [
    { key: 'mass', name: 'PANEL MASS (kg/m²)', quantity: 'number', placeholder: '5', help: 'Surface mass of the membrane, kilograms per square metre.', warn: { test: (x) => x <= 0, msg: 'Mass must be greater than zero.' } },
    { key: 'gap', name: 'AIR GAP DEPTH', quantity: 'length', defaultUnit: 'cm', placeholder: '5', help: 'Depth of the sealed air cavity behind the panel.', warn: { test: (x) => x <= 0, msg: 'Gap must be greater than zero.' } },
    { key: 'openPct', name: 'PERFORATION (open area)', quantity: 'percent', placeholder: '5', help: 'Fraction of the panel that is open holes, in percent.', warn: { test: (x) => x <= 0 || x >= 100, msg: 'Open area must be between 0 and 100%.' } },
    { key: 'depth', name: 'CAVITY DEPTH', quantity: 'length', defaultUnit: 'cm', placeholder: '10', help: 'Depth of the air cavity behind the perforated panel.', warn: { test: (x) => x <= 0, msg: 'Depth must be greater than zero.' } },
    { key: 'thick', name: 'PANEL THICKNESS', quantity: 'length', defaultUnit: 'mm', placeholder: '12', help: 'Thickness of the perforated panel.', warn: { test: (x) => x <= 0, msg: 'Thickness must be greater than zero.' } },
    { key: 'hole', name: 'HOLE DIAMETER', quantity: 'length', defaultUnit: 'mm', placeholder: '8', help: 'Diameter of each perforation.', warn: { test: (x) => x <= 0, msg: 'Hole diameter must be greater than zero.' } },
    { key: 'temp', name: 'AIR TEMPERATURE', quantity: 'temperature', placeholder: '20', help: 'Sets the speed of sound (Helmholtz).' },
  ],
  functions: [
    {
      key: 'panel',
      name: 'Panel (membrane) absorber resonance',
      inputs: ['mass', 'gap'],
      formula: 'f₀ ≈ 60 / √(m · d)',
      plainFormula:
        'The resonant frequency is about 60 divided by the square root of the panel mass times the air-gap depth.',
      explain:
        'A panel (membrane) absorber flexes a mass over a sealed air gap, resonating at a low frequency where thin porous foam fails. A heavier panel or a deeper gap tunes it lower. It works across roughly a half-octave either side of this frequency, and only if the cavity is sealed so the trapped air acts as the spring.',
      keySymbols: ['≈', '/', '√', '·', 'f', 'x₁'],
      compute: (v) => {
        const f0 = 60 / Math.sqrt(n(v.mass) * n(v.gap));
        return [
          { label: 'RESONANT FREQUENCY', value: f0, quantity: 'frequency' },
          { label: 'USEFUL BAND (≈ ±½ oct)', value: f0, quantity: 'frequency', chainable: false },
        ];
      },
      steps: (v) => {
        const f0 = 60 / Math.sqrt(n(v.mass) * n(v.gap));
        return [
          `f₀ = 60 ÷ √(${fmt(n(v.mass))} kg/m² × ${fmt(n(v.gap))} m) = ${fmt(f0)} Hz.`,
          `Heavier panel or deeper gap tunes LOWER; the absorber works roughly ±½ octave around ${fmt(f0)} Hz.`,
        ];
      },
    },
    {
      key: 'helmholtz',
      name: 'Perforated-panel Helmholtz resonance',
      inputs: ['openPct', 'depth', 'thick', 'hole', 'temp'],
      formula: 'f₀ ≈ (c/2π)·√(P / (d·(t + 0.8·D)))',
      plainFormula:
        'The resonant frequency is about the speed of sound over two pi, times the square root of the open-area fraction divided by the cavity depth times the effective neck length.',
      explain:
        'A Helmholtz (perforated-panel) absorber resonates the air in its holes against the cavity behind it. More open area or shorter necks tune it higher; a deeper cavity tunes it lower. The effective neck length adds a little (0.8 × hole diameter) to the panel thickness because the moving plug of air extends past the holes.',
      keySymbols: ['≈', 'c', '/', 'π', '·', '√', 'f', 'x₁'],
      compute: (v) => {
        const c = speedOfSoundAir(n(v.temp));
        const P = n(v.openPct) / 100;
        const d = n(v.depth);
        const t = n(v.thick);
        const D = n(v.hole);
        const f0 = (c / (2 * Math.PI)) * Math.sqrt(P / (d * (t + 0.8 * D)));
        return [
          { label: 'RESONANT FREQUENCY', value: f0, quantity: 'frequency' },
          { label: 'EFFECTIVE NECK LENGTH', value: t + 0.8 * D, quantity: 'length', unit: 'mm', chainable: false },
        ];
      },
      steps: (v) => {
        const c = speedOfSoundAir(n(v.temp));
        const P = n(v.openPct) / 100;
        const d = n(v.depth);
        const t = n(v.thick);
        const D = n(v.hole);
        const neck = t + 0.8 * D;
        const f0 = (c / (2 * Math.PI)) * Math.sqrt(P / (d * neck));
        return [
          `Open-area fraction P = ${fmt(P)}; effective neck length = t + 0.8·D = ${fmt(t)} + 0.8×${fmt(D)} = ${fmt(neck)} m.`,
          `f₀ = (${fmt(c)}/2π)·√(${fmt(P)} ÷ (${fmt(d)} × ${fmt(neck)})) = ${fmt(f0)} Hz.`,
          `More open area or shorter necks tune HIGHER; a deeper cavity tunes LOWER.`,
        ];
      },
    },
  ],
};

const TRANSMISSION: Workspace = {
  id: 'transloss',
  name: 'Transmission Loss',
  tagline: 'Mass-law sound isolation',
  section: 'rooms',
  reportPrefix: 'TL',
  intro:
    'How much a single wall or panel knocks a sound down as it passes through is its transmission ' +
    'loss (TL). For a simple limp panel it is governed by the MASS LAW: heavier and higher in ' +
    'frequency both mean more isolation — about 6 dB for every doubling of either.',
  whyItMatters:
    'Isolation is where studios and venues spend real money. The mass law sets the floor: it tells ' +
    'you the low-frequency isolation a given wall mass can buy, why bass always leaks first, and why ' +
    'doubling drywall only adds ~6 dB — you need mass, decoupling, and air gaps to do better.',
  example:
    'A 25 kg/m² wall at 125 Hz: TL ≈ 20·log₁₀(25·125) − 47 ≈ 23 dB. The same wall at 1 kHz: ' +
    'TL ≈ 41 dB. Doubling the mass to 50 kg/m² adds ~6 dB everywhere.',
  mistakes: [
    'Expecting mass law to hold everywhere — near the panel’s coincidence (critical) frequency TL dips sharply below the prediction.',
    'Adding a second identical leaf tight against the first — you gain mass (~6 dB) but not the far bigger benefit of a decoupled, air-gapped double wall.',
    'Quoting one TL number as if isolation were flat — it rises ~6 dB/octave; bass is always the weakest link.',
  ],
  warnings:
    'Field-incidence mass law: TL ≈ 20·log₁₀(m·f) − 47 (m in kg/m², f in Hz). It ignores stiffness, ' +
    'the coincidence dip, and flanking paths. Rated partition performance is measured (ASTM E90 / ' +
    'STC, ISO 10140), not computed here.',
  glossary: ['Transmission Loss', 'Decibel', 'Sound Isolation', 'Mass Law', 'Frequency'],
  fields: [
    { key: 'mass', name: 'PANEL MASS (kg/m²)', quantity: 'number', placeholder: '25', help: 'Surface mass of the wall/panel, kilograms per square metre.', warn: { test: (x) => x <= 0, msg: 'Mass must be greater than zero.' } },
    { key: 'f', name: 'FREQUENCY', quantity: 'frequency', placeholder: '125', help: 'The frequency you want the isolation at.', warn: { test: (x) => x <= 0, msg: 'Frequency must be greater than zero.' } },
    { key: 'tlTarget', name: 'TARGET TRANSMISSION LOSS', quantity: 'db', placeholder: '40', help: 'An isolation figure (in dB) you want to achieve.', warn: { test: (x) => x <= 0, msg: 'Target TL must be greater than zero.' } },
  ],
  functions: [
    {
      key: 'massTL',
      name: 'Transmission loss from mass & frequency',
      inputs: ['mass', 'f'],
      formula: 'TL ≈ 20·log₁₀(m · f) − 47',
      plainFormula:
        'The transmission loss in dB is about twenty times the base-ten log of the panel mass times the frequency, minus 47.',
      explain:
        'How much a single limp wall knocks a sound down as it passes through, by the mass law: heavier and higher in frequency both mean more isolation — about 6 dB for every doubling of either. That is why bass leaks first and why doubling drywall only adds ~6 dB. It ignores stiffness, the coincidence dip, and flanking paths.',
      keySymbols: ['≈', '·', 'log₁₀', '−', 'f'],
      compute: (v) => {
        const m = n(v.mass);
        const f = n(v.f);
        const tl = 20 * Math.log10(m * f) - 47;
        return [
          { label: 'TRANSMISSION LOSS', value: tl, quantity: 'db' },
          { label: 'TL ONE OCTAVE UP', value: 20 * Math.log10(m * f * 2) - 47, quantity: 'db', chainable: false },
        ];
      },
      steps: (v) => {
        const m = n(v.mass);
        const f = n(v.f);
        const tl = 20 * Math.log10(m * f) - 47;
        return [
          `TL = 20·log₁₀(${fmt(m)} × ${fmt(f)}) − 47 = ${fmt(tl)} dB.`,
          `Mass law adds ~6 dB per octave and ~6 dB per doubling of mass — so isolation is always weakest in the bass.`,
        ];
      },
      table: (v) => {
        const m = n(v.mass);
        const rows = [125, 250, 500, 1000, 2000, 4000].map((f) => [
          f >= 1000 ? `${f / 1000} kHz` : `${f} Hz`,
          `${fmt(20 * Math.log10(m * f) - 47)} dB`,
        ]);
        return { title: 'MASS-LAW TL BY BAND', cols: ['Frequency', 'TL'], rows };
      },
    },
    {
      key: 'massForTL',
      name: 'Panel mass for a target TL (reverse)',
      inputs: ['tlTarget', 'f'],
      formula: 'm = 10^((TL + 47)/20) / f',
      plainFormula:
        'The required panel mass equals ten raised to the quantity (target transmission loss plus 47) over twenty, then divided by the frequency.',
      explain:
        'The reverse of the mass-law calculation: the surface mass a wall needs to reach a target isolation at a given frequency. If the mass it demands is impractical, the fix isn’t more drywall — it’s decoupling and an air gap, which the mass law alone cannot describe.',
      keySymbols: ['x²', '/', 'f'],
      compute: (v) => {
        const tl = n(v.tlTarget);
        const f = n(v.f);
        const m = Math.pow(10, (tl + 47) / 20) / f;
        return [
          { label: 'REQUIRED PANEL MASS', value: m, quantity: 'number' },
          { label: 'MASS IN lb/ft²', value: m * 0.204816, quantity: 'number', chainable: false },
        ];
      },
      steps: (v) => {
        const tl = n(v.tlTarget);
        const f = n(v.f);
        const m = Math.pow(10, (tl + 47) / 20) / f;
        return [
          `m = 10^((${fmt(tl)} + 47)/20) ÷ ${fmt(f)} = ${fmt(m)} kg/m² (${fmt(m * 0.204816)} lb/ft²).`,
          `If that mass is impractical, the answer isn’t "more drywall" — it’s decoupling and an air gap, which mass law alone can’t describe.`,
        ];
      },
    },
  ],
};

export const WORKSPACES_ROOMS_ADVANCED: Workspace[] = [EYRING, DIFFUSER, ABSORBER, TRANSMISSION];
