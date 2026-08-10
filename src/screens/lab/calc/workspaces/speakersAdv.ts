/**
 * Workspaces — Speakers & Power, ADVANCED TIER (owner buildout 2026-08-07):
 * Crossover Components · Line-Array & Polar · Driver Excursion & Enclosures.
 * Section 'speakers'. Same pattern as wave.ts.
 *
 * Component values print in practical units (µF, mH) via 'number' outputs whose
 * LABELS carry the unit; compute converts from base F/H.
 */
import type { Workspace } from '../calcTypes';
import { fmt, speedOfSoundAir } from '../calcUnits';

const n = (v: number | number[]) => (typeof v === 'number' ? v : v[0] ?? NaN);
const TWO_PI = 2 * Math.PI;

const CROSSOVER: Workspace = {
  id: 'crossover',
  name: 'Crossover Components',
  tagline: 'Passive L & C for a crossover point',
  section: 'speakers',
  reportPrefix: 'XO',
  intro:
    'A passive crossover splits the signal between drivers with inductors and capacitors. Enter the ' +
    'crossover frequency and the driver impedance and get the component values for a first-order ' +
    '(6 dB/oct) and a second-order Butterworth (12 dB/oct) network.',
  whyItMatters:
    'The right L and C send highs to the tweeter and lows to the woofer while protecting each from ' +
    'the band it can’t handle. Order sets the steepness (and the phase behaviour) — first-order is ' +
    'gentle and phase-coherent; second-order is steeper but flips the tweeter’s polarity.',
  example:
    'A 2.5 kHz crossover into 8 Ω. First-order: C = 0.1592/(2500·8) ≈ 7.96 µF, L = 0.1592·8/2500 ≈ ' +
    '0.51 mH. Second-order Butterworth: C ≈ 5.63 µF, L ≈ 0.72 mH.',
  mistakes: [
    'Designing against the nominal impedance while the driver’s real impedance swings with frequency — a Zobel/impedance-flattening network is often needed first.',
    'Forgetting the second-order Butterworth tweeter usually needs its polarity reversed for a flat summed response.',
    'Treating a driver as a resistor — these idealized values are a starting point; real crossovers are tuned by measurement.',
  ],
  warnings:
    'Idealized values assuming a purely resistive load R. First-order: C = 0.1592/(f·R), ' +
    'L = 0.1592·R/f. Second-order Butterworth: C = 0.1125/(f·R), L = 0.2251·R/f. Real drivers are ' +
    'reactive — measure and adjust.',
  glossary: ['Crossover', 'Filter', 'Inductor', 'Capacitor', 'Cutoff frequency', 'Impedance'],
  fields: [
    { key: 'fx', name: 'CROSSOVER FREQUENCY', quantity: 'frequency', placeholder: '2500', help: 'The frequency where the two drivers hand off.', warn: { test: (x) => x <= 0, msg: 'Frequency must be greater than zero.' } },
    { key: 'z', name: 'DRIVER IMPEDANCE', quantity: 'impedance', placeholder: '8', help: 'Nominal impedance of the driver (typically 4, 6, or 8 Ω).', warn: { test: (x) => x <= 0, msg: 'Impedance must be greater than zero.' } },
  ],
  functions: [
    {
      key: 'firstOrder',
      name: 'First-order (6 dB/oct) components',
      inputs: ['fx', 'z'],
      formula: 'C = 0.1592/(f·R) · L = 0.1592·R/f',
      compute: (v) => {
        const f = n(v.fx);
        const R = n(v.z);
        const C = 0.15915 / (f * R);
        const L = (0.15915 * R) / f;
        return [
          { label: 'CAPACITOR (µF) — high-pass', value: C * 1e6, quantity: 'number', chainable: false },
          { label: 'INDUCTOR (mH) — low-pass', value: L * 1e3, quantity: 'number', chainable: false },
        ];
      },
      steps: (v) => {
        const f = n(v.fx);
        const R = n(v.z);
        return [
          `C = 0.1592 ÷ (${fmt(f)} × ${fmt(R)}) = ${fmt((0.15915 / (f * R)) * 1e6)} µF (in series with the tweeter).`,
          `L = 0.1592 × ${fmt(R)} ÷ ${fmt(f)} = ${fmt(((0.15915 * R) / f) * 1e3)} mH (in series with the woofer).`,
        ];
      },
    },
    {
      key: 'secondOrder',
      name: 'Second-order Butterworth (12 dB/oct) components',
      inputs: ['fx', 'z'],
      formula: 'C = 0.1125/(f·R) · L = 0.2251·R/f',
      note: 'Butterworth (Q = 0.707) alignment. The tweeter usually needs reversed polarity for a flat sum.',
      compute: (v) => {
        const f = n(v.fx);
        const R = n(v.z);
        return [
          { label: 'CAPACITOR (µF)', value: (0.11254 / (f * R)) * 1e6, quantity: 'number', chainable: false },
          { label: 'INDUCTOR (mH)', value: ((0.22508 * R) / f) * 1e3, quantity: 'number', chainable: false },
        ];
      },
      steps: (v) => {
        const f = n(v.fx);
        const R = n(v.z);
        return [
          `C = 0.1125 ÷ (${fmt(f)} × ${fmt(R)}) = ${fmt((0.11254 / (f * R)) * 1e6)} µF.`,
          `L = 0.2251 × ${fmt(R)} ÷ ${fmt(f)} = ${fmt(((0.22508 * R) / f) * 1e3)} mH.`,
          `Each filter uses one L and one C; reverse the tweeter’s polarity for a flat Butterworth sum.`,
        ];
      },
    },
  ],
};

const LINEARRAY: Workspace = {
  id: 'linearray',
  name: 'Line-Array & Polar',
  tagline: 'Directivity control, aliasing & distance loss',
  section: 'speakers',
  reportPrefix: 'ARR',
  intro:
    'A line array behaves differently from a single box: its length controls how low it stays ' +
    'directional, its element SPACING sets where lobing (spatial aliasing) begins, and in its near ' +
    'field it loses only ~3 dB per doubling instead of ~6. This workspace covers all three.',
  whyItMatters:
    'These numbers decide whether an array throws to the back row without deafening the front, and ' +
    'whether it beams cleanly or sprays comb-filtered lobes. Array length buys low-frequency ' +
    'pattern control; tight element spacing buys high-frequency cleanliness.',
  example:
    'A 2 m array (20 °C): it controls directivity from about c/L = 343/2 ≈ 172 Hz, tightly above ' +
    '~343 Hz. Elements spaced 0.25 m alias above c/spacing ≈ 1.37 kHz — beyond that, side lobes.',
  mistakes: [
    'Expecting low-frequency directivity from a short array — pattern control only reaches down to roughly where the array is one wavelength long.',
    'Spacing elements too far apart — above c/spacing the array grating-lobes, spraying energy off-axis.',
    'Applying the −3 dB/doubling "line source" rule everywhere — it only holds in the near field; past the transition it reverts to −6 dB/doubling like any point source.',
  ],
  warnings:
    'Teaching relationships: directivity control onset ≈ c/L (tight at 2c/L); spatial-aliasing ' +
    'frequency ≈ c/(element spacing); near-field line source loses ~3 dB per distance doubling vs ' +
    '~6 dB for a point source. Real array behaviour (steering, curvature) needs manufacturer data.',
  glossary: ['Directivity', 'Inverse square law', 'Wavelength', 'Sound Pressure Level', 'Comb Filtering'],
  fields: [
    { key: 'arrayLen', name: 'ARRAY LENGTH', quantity: 'length', placeholder: '2', help: 'Top-to-bottom acoustic length of the array.', warn: { test: (x) => x <= 0, msg: 'Length must be greater than zero.' } },
    { key: 'spacing', name: 'ELEMENT SPACING', quantity: 'length', defaultUnit: 'cm', placeholder: '25', help: 'Centre-to-centre distance between array elements.', warn: { test: (x) => x <= 0, msg: 'Spacing must be greater than zero.' } },
    { key: 'temp', name: 'AIR TEMPERATURE', quantity: 'temperature', placeholder: '20', help: 'Sets the speed of sound.' },
    { key: 'splRef', name: 'SPL AT REFERENCE', quantity: 'spl', placeholder: '100', help: 'Measured SPL at the reference distance.' },
    { key: 'refDist', name: 'REFERENCE DISTANCE', quantity: 'length', placeholder: '4', help: 'Distance where the reference SPL was measured.', warn: { test: (x) => x <= 0, msg: 'Distance must be greater than zero.' } },
    { key: 'farDist', name: 'LISTENER DISTANCE', quantity: 'length', placeholder: '16', help: 'Distance to evaluate the SPL at.', warn: { test: (x) => x <= 0, msg: 'Distance must be greater than zero.' } },
  ],
  functions: [
    {
      key: 'directivity',
      name: 'Directivity control from array length',
      inputs: ['arrayLen', 'temp'],
      formula: 'onset ≈ c/L · tight control ≈ 2c/L',
      compute: (v) => {
        const c = speedOfSoundAir(n(v.temp));
        const L = n(v.arrayLen);
        return [
          { label: 'DIRECTIVITY ONSET (L = λ)', value: c / L, quantity: 'frequency' },
          { label: 'TIGHT CONTROL ABOVE (L = 2λ)', value: (2 * c) / L, quantity: 'frequency' },
        ];
      },
      steps: (v) => {
        const c = speedOfSoundAir(n(v.temp));
        const L = n(v.arrayLen);
        return [
          `c = ${fmt(c)} m/s. The array is one wavelength long at c/L = ${fmt(c / L)} Hz — directivity control begins there.`,
          `Control is tight once the array is two wavelengths, above 2c/L = ${fmt((2 * c) / L)} Hz. Below the onset the array is effectively omni.`,
        ];
      },
    },
    {
      key: 'aliasing',
      name: 'Spatial-aliasing frequency from element spacing',
      inputs: ['spacing', 'temp'],
      formula: 'f_alias ≈ c / spacing',
      compute: (v) => {
        const c = speedOfSoundAir(n(v.temp));
        return [
          { label: 'ALIASING (LOBING) FREQUENCY', value: c / n(v.spacing), quantity: 'frequency' },
          { label: 'HALF-WAVELENGTH LIMIT (cleanest)', value: c / (2 * n(v.spacing)), quantity: 'frequency', chainable: false },
        ];
      },
      steps: (v) => {
        const c = speedOfSoundAir(n(v.temp));
        return [
          `f_alias = ${fmt(c)} ÷ ${fmt(n(v.spacing))} = ${fmt(c / n(v.spacing))} Hz.`,
          `Above this, elements are more than a wavelength apart and grating lobes appear. Keeping spacing under λ/2 (below ${fmt(c / (2 * n(v.spacing)))} Hz here) is the cleanest region.`,
        ];
      },
    },
    {
      key: 'distanceLoss',
      name: 'Point vs line-source distance loss',
      inputs: ['splRef', 'refDist', 'farDist'],
      formula: 'point: −20·log₁₀(r₂/r₁) · line (near field): −10·log₁₀(r₂/r₁)',
      compute: (v) => {
        const ratio = n(v.farDist) / n(v.refDist);
        const point = n(v.splRef) - 20 * Math.log10(ratio);
        const line = n(v.splRef) - 10 * Math.log10(ratio);
        return [
          { label: 'SPL — POINT SOURCE', value: point, quantity: 'spl' },
          { label: 'SPL — LINE SOURCE (near field)', value: line, quantity: 'spl' },
          { label: 'LINE-SOURCE ADVANTAGE', value: line - point, quantity: 'db', chainable: false },
        ];
      },
      steps: (v) => {
        const ratio = n(v.farDist) / n(v.refDist);
        const point = n(v.splRef) - 20 * Math.log10(ratio);
        const line = n(v.splRef) - 10 * Math.log10(ratio);
        return [
          `Distance ratio = ${fmt(n(v.farDist))} ÷ ${fmt(n(v.refDist))} = ${fmt(ratio)}×.`,
          `Point source: ${fmt(n(v.splRef))} − 20·log₁₀(${fmt(ratio)}) = ${fmt(point)} dB SPL.`,
          `Line source (near field): ${fmt(n(v.splRef))} − 10·log₁₀(${fmt(ratio)}) = ${fmt(line)} dB SPL — ${fmt(line - point)} dB more reach, while the array’s near field lasts.`,
        ];
      },
    },
  ],
};

const DRIVER: Workspace = {
  id: 'driver',
  name: 'Driver Excursion & Enclosures',
  tagline: 'Displacement-limited SPL · sealed · vented',
  section: 'speakers',
  reportPrefix: 'DRV',
  intro:
    'Low-frequency output is displacement-limited: to make bass, a cone must move air, and how much ' +
    'air is cone area × excursion. This workspace finds the SPL a driver’s excursion can produce, ' +
    'and the system tuning for sealed and vented boxes.',
  whyItMatters:
    'It answers the two questions that decide a subwoofer: "how loud can this driver play THIS low ' +
    'before it runs out of travel?" and "what does the box do to its tuning?" Excursion sets max ' +
    'SPL; the box sets the system resonance and the low-end shape.',
  example:
    'A driver with Sd = 0.05 m² and Xmax = 5 mm at 40 Hz, 1 m half-space: peak volume displacement ' +
    'produces ≈ 100 dB SPL. In a sealed box, fc = fs·√(1+Vas/Vb) raises the resonance and Q.',
  mistakes: [
    'Chasing deep bass from a small cone — halving the frequency needs 4× the excursion for the same SPL; area and travel are everything down low.',
    'Judging a sealed box by volume alone — the ratio Vas/Vb sets both the resonance shift AND the Q (a small box means a peaky, higher-tuned system).',
    'Ignoring port end correction on vented boxes — the air plug is acoustically longer than the physical port, tuning lower than the raw length suggests.',
  ],
  warnings:
    'Small-signal, half-space piston model: SPL from p = 1.2·2π·f²·Sd·(Xpk/√2)/r. Sealed: ' +
    'fc = fs·√(1+Vas/Vb), Qtc = Qts·√(1+Vas/Vb). Vented (Helmholtz): fb = (c/2π)·√(Av/(Vb·L_eff)), ' +
    'L_eff = Lv + 1.46·√(Av/π). Thiele–Small small-signal theory; real drivers compress at Xmax.',
  glossary: ['Sensitivity', 'Sound Pressure Level', 'Resonance', 'Loudspeaker', 'Q factor'],
  fields: [
    { key: 'sd', name: 'CONE AREA (Sd)', quantity: 'area', defaultUnit: 'm2', placeholder: '0.05', help: 'Effective radiating area of the cone.', warn: { test: (x) => x <= 0, msg: 'Area must be greater than zero.' } },
    { key: 'xmax', name: 'PEAK EXCURSION (Xmax)', quantity: 'length', defaultUnit: 'mm', placeholder: '5', help: 'One-way peak linear cone travel.', warn: { test: (x) => x <= 0, msg: 'Excursion must be greater than zero.' } },
    { key: 'f', name: 'FREQUENCY', quantity: 'frequency', placeholder: '40', help: 'The frequency to evaluate output at.', warn: { test: (x) => x <= 0, msg: 'Frequency must be greater than zero.' } },
    { key: 'dist', name: 'DISTANCE', quantity: 'length', placeholder: '1', help: 'Listening distance (half-space).', warn: { test: (x) => x <= 0, msg: 'Distance must be greater than zero.' } },
    { key: 'fs', name: 'DRIVER RESONANCE (fs)', quantity: 'frequency', placeholder: '25', help: 'Free-air resonance of the driver.', warn: { test: (x) => x <= 0, msg: 'fs must be greater than zero.' } },
    { key: 'qts', name: 'TOTAL Q (Qts)', quantity: 'number', placeholder: '0.4', help: 'Total driver Q at resonance.', warn: { test: (x) => x <= 0, msg: 'Qts must be greater than zero.' } },
    { key: 'vas', name: 'COMPLIANCE VOLUME (Vas)', quantity: 'volume', defaultUnit: 'l', placeholder: '50', help: 'Volume of air with the same compliance as the suspension.', warn: { test: (x) => x <= 0, msg: 'Vas must be greater than zero.' } },
    { key: 'vb', name: 'BOX VOLUME (Vb)', quantity: 'volume', defaultUnit: 'l', placeholder: '30', help: 'Internal net volume of the enclosure.', warn: { test: (x) => x <= 0, msg: 'Box volume must be greater than zero.' } },
    { key: 'av', name: 'PORT AREA', quantity: 'area', defaultUnit: 'm2', placeholder: '0.005', help: 'Cross-sectional area of the vent.', warn: { test: (x) => x <= 0, msg: 'Port area must be greater than zero.' } },
    { key: 'lv', name: 'PORT LENGTH', quantity: 'length', defaultUnit: 'cm', placeholder: '15', help: 'Physical length of the vent tube.', warn: { test: (x) => x <= 0, msg: 'Port length must be greater than zero.' } },
    { key: 'temp', name: 'AIR TEMPERATURE', quantity: 'temperature', placeholder: '20', help: 'Sets the speed of sound (vented tuning).' },
    { key: 'fbTarget', name: 'TARGET BOX TUNING (fb)', quantity: 'frequency', placeholder: '35', help: 'The vented tuning frequency you want.', warn: { test: (x) => x <= 0, msg: 'fb must be greater than zero.' } },
  ],
  functions: [
    {
      key: 'excursionSPL',
      name: 'Displacement-limited SPL',
      inputs: ['sd', 'xmax', 'f', 'dist'],
      formula: 'p = 1.2·2π·f²·Sd·(Xpk/√2) / r · SPL = 20·log₁₀(p / 20µPa)',
      compute: (v) => {
        const p = (1.2 * TWO_PI * n(v.f) * n(v.f) * n(v.sd) * (n(v.xmax) / Math.SQRT2)) / n(v.dist);
        const spl = 20 * Math.log10(p / 2e-5);
        return [
          { label: 'MAX SPL AT DISTANCE', value: spl, quantity: 'spl' },
          { label: 'PEAK VOLUME DISPLACEMENT (Vd)', value: n(v.sd) * n(v.xmax) * 1e6, quantity: 'number', chainable: false },
        ];
      },
      steps: (v) => {
        const p = (1.2 * TWO_PI * n(v.f) * n(v.f) * n(v.sd) * (n(v.xmax) / Math.SQRT2)) / n(v.dist);
        const spl = 20 * Math.log10(p / 2e-5);
        return [
          `Peak RMS pressure p = 1.2·2π·${fmt(n(v.f))}²·${fmt(n(v.sd))}·(${fmt(n(v.xmax))}/√2) ÷ ${fmt(n(v.dist))} = ${fmt(p)} Pa.`,
          `SPL = 20·log₁₀(${fmt(p)} / 20µPa) = ${fmt(spl)} dB SPL (half-space, small signal).`,
          `Dropping an octave needs 4× the excursion for the same SPL — the physics behind big subs.`,
        ];
      },
    },
    {
      key: 'sealed',
      name: 'Sealed box resonance & Q',
      inputs: ['fs', 'qts', 'vas', 'vb'],
      formula: 'fc = fs·√(1 + Vas/Vb) · Qtc = Qts·√(1 + Vas/Vb)',
      compute: (v) => {
        const k = Math.sqrt(1 + n(v.vas) / n(v.vb));
        return [
          { label: 'SYSTEM RESONANCE fc', value: n(v.fs) * k, quantity: 'frequency' },
          { label: 'SYSTEM Q (Qtc)', value: n(v.qts) * k, quantity: 'number' },
          { label: 'VAS / VB RATIO', value: n(v.vas) / n(v.vb), quantity: 'number', chainable: false },
        ];
      },
      steps: (v) => {
        const k = Math.sqrt(1 + n(v.vas) / n(v.vb));
        return [
          `Vas/Vb = ${fmt(n(v.vas) / n(v.vb))}, so √(1 + Vas/Vb) = ${fmt(k)}.`,
          `fc = ${fmt(n(v.fs))} × ${fmt(k)} = ${fmt(n(v.fs) * k)} Hz; Qtc = ${fmt(n(v.qts))} × ${fmt(k)} = ${fmt(n(v.qts) * k)}.`,
          `Qtc ≈ 0.707 is maximally flat; higher (smaller box) is peaky, lower (bigger box) is over-damped.`,
        ];
      },
    },
    {
      key: 'portLength',
      name: 'Vented port length for a target tuning',
      inputs: ['fbTarget', 'av', 'vb', 'temp'],
      formula: 'L_eff = c²·Av / ((2π·fb)²·Vb) · Lv = L_eff − 1.46·√(Av/π)',
      note: 'End correction 1.46·√(Av/π) added back (one flanged + one free end); real ports vary.',
      compute: (v) => {
        const c = speedOfSoundAir(n(v.temp));
        const leff = (c * c * n(v.av)) / (Math.pow(TWO_PI * n(v.fbTarget), 2) * n(v.vb));
        const corr = 1.46 * Math.sqrt(n(v.av) / Math.PI);
        const lv = leff - corr;
        return [
          { label: 'PHYSICAL PORT LENGTH', value: lv, quantity: 'length', unit: 'cm' },
          { label: 'EFFECTIVE (ACOUSTIC) LENGTH', value: leff, quantity: 'length', unit: 'cm', chainable: false },
        ];
      },
      steps: (v) => {
        const c = speedOfSoundAir(n(v.temp));
        const leff = (c * c * n(v.av)) / (Math.pow(TWO_PI * n(v.fbTarget), 2) * n(v.vb));
        const corr = 1.46 * Math.sqrt(n(v.av) / Math.PI);
        return [
          `Effective length L_eff = ${fmt(c)}²·${fmt(n(v.av))} ÷ ((2π·${fmt(n(v.fbTarget))})²·${fmt(n(v.vb))}) = ${fmt(leff)} m.`,
          `Subtract the end correction 1.46·√(Av/π) = ${fmt(corr)} m → physical port ${fmt(leff - corr)} m (${fmt((leff - corr) * 100)} cm).`,
          n(v.fbTarget) > 0 && leff - corr <= 0 ? `Result is negative — this port area tunes higher than the target even at zero length; use a smaller port area.` : `A longer or narrower port tunes LOWER.`,
        ];
      },
    },
  ],
};

export const WORKSPACES_SPEAKERS_ADV: Workspace[] = [CROSSOVER, LINEARRAY, DRIVER];
