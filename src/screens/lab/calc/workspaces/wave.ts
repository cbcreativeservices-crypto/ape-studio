/**
 * Workspace: Sound & Wave — frequency · period · wavelength · speed of sound.
 * The EXEMPLAR workspace: every other workspace file follows this pattern.
 * Consolidates spec calculators 1, 2, 3, 4 and 12 (owner inventory 2026-07-29).
 */
import type { Workspace } from '../calcTypes';
import { fmt, speedOfSoundAir } from '../calcUnits';

const n = (v: number | number[]) => (typeof v === 'number' ? v : v[0] ?? NaN);

export const WS_WAVE: Workspace = {
  id: 'wave',
  name: 'Sound & Wave',
  tagline: 'Frequency · period · wavelength · speed of sound',
  section: 'waves',
  intro:
    'The four quantities every audio calculation eventually touches. Pick what you are trying ' +
    'to determine, enter what you know, and the lab shows the result, the working, and why ' +
    'you would care on a real job.',
  whyItMatters:
    'Wavelength is the bridge between electrical audio and physical space: it decides room-mode ' +
    'frequencies, speaker spacing, mic-placement interference, and absorber depth. Period is the ' +
    'bridge between frequency and time: delays, LFOs, and DSP all count in it.',
  example:
    'A 100 Hz tone at 20 °C: speed of sound ≈ 343 m/s, so λ = 343 ÷ 100 ≈ 3.43 m (11.3 ft). Its ' +
    'quarter wavelength ≈ 0.86 m — that is why a porous absorber needs roughly that depth (or an ' +
    'air gap) to touch 100 Hz, and why a mic 0.86 m from a wall notches near 100 Hz.',
  mistakes: [
    'Using 1130 ft/s and 343 m/s interchangeably without tracking units — keep one system per calculation.',
    'Forgetting temperature: from a cold morning load-in (10 °C) to show heat (30 °C) the speed of sound changes ~3.5% — enough to move alignment.',
    'Confusing period (time of ONE cycle) with wavelength (distance of one cycle) — same wave, different axes.',
    'Quoting a room-mode frequency from λ = room length; the fundamental axial mode is at HALF a wavelength per length (f = c ÷ 2L).',
  ],
  warnings:
    'Speed of sound here is the classroom dry-air model c = 331.3·√(1 + T/273.15). Humidity and ' +
    'pressure shift it slightly (<1% in normal rooms); formal room-acoustic measurement is the ' +
    'domain of ISO 3382, not this teaching tool.',
  glossary: ['Frequency', 'Wavelength', 'Period', 'Sound Wave', 'Speed of sound', 'Standing wave'],
  fields: [
    { key: 'f', name: 'FREQUENCY', quantity: 'frequency', placeholder: '100', help: 'Cycles per second of the tone or band of interest.' },
    { key: 't', name: 'PERIOD', quantity: 'time', defaultUnit: 'ms', placeholder: '10', help: 'Time for ONE complete cycle.' },
    { key: 'temp', name: 'AIR TEMPERATURE', quantity: 'temperature', placeholder: '20', help: 'Sets the speed of sound in the classroom dry-air model.' },
    { key: 'dist', name: 'DISTANCE', quantity: 'length', placeholder: '3.43', help: 'A physical distance — boundary gap, driver spacing, room dimension.' },
    {
      key: 'fKnown',
      name: 'FREQUENCY',
      quantity: 'frequency',
      placeholder: '1000',
      help: 'The frequency whose cycles you are counting over the distance.',
    },
  ],
  functions: [
    {
      key: 'period',
      name: 'Period from frequency',
      inputs: ['f'],
      formula: 'T = 1 / f',
      compute: (v) => {
        const f = n(v.f);
        return [
          { label: 'PERIOD', value: 1 / f, quantity: 'time', unit: 'ms' },
          { label: 'CYCLES PER SECOND', value: f, quantity: 'number', chainable: false },
        ];
      },
      steps: (v) => {
        const f = n(v.f);
        return [
          `One cycle takes 1 second divided by the number of cycles per second.`,
          `T = 1 ÷ ${fmt(f)} Hz = ${fmt(1 / f)} s = ${fmt(1000 / f)} ms.`,
        ];
      },
    },
    {
      key: 'freq',
      name: 'Frequency from period',
      inputs: ['t'],
      formula: 'f = 1 / T · ω = 2π·f',
      compute: (v) => {
        const f = 1 / n(v.t);
        return [
          { label: 'FREQUENCY', value: f, quantity: 'frequency' },
          { label: 'ANGULAR FREQUENCY ω (rad/s)', value: 2 * Math.PI * f, quantity: 'number', chainable: false },
        ];
      },
      steps: (v) => {
        const f = 1 / n(v.t);
        return [
          `f = 1 ÷ ${fmt(n(v.t))} s = ${fmt(f)} Hz.`,
          `Angular frequency (radians per second, used in filter/phase/reactance math): ω = 2π·f = 2π × ${fmt(f)} = ${fmt(2 * Math.PI * f)} rad/s.`,
        ];
      },
    },
    {
      key: 'speed',
      name: 'Speed of sound from temperature',
      inputs: ['temp'],
      formula: 'c = 331.3 · √(1 + T/273.15)',
      note: 'Classroom dry-air model — humidity/pressure effects (<1% typical) are ignored and disclosed.',
      compute: (v) => {
        const c = speedOfSoundAir(n(v.temp));
        return [
          { label: 'SPEED OF SOUND', value: c, quantity: 'speed' },
          { label: 'TRAVEL PER MILLISECOND', value: c / 1000, quantity: 'length', unit: 'cm', chainable: false },
          { label: 'DELAY PER METER', value: 1000 / c, quantity: 'time', unit: 'ms', chainable: false },
          { label: 'DELAY PER FOOT', value: (1000 * 0.3048) / c, quantity: 'time', unit: 'ms', chainable: false },
        ];
      },
      steps: (v) => {
        const t = n(v.temp);
        const c = speedOfSoundAir(t);
        return [
          `c = 331.3 × √(1 + ${fmt(t)}/273.15) = ${fmt(c)} m/s.`,
          `Handy field numbers: sound covers ${fmt(c / 1000)} m (≈ ${fmt(c / 304.8)} ft) every millisecond — near room temperature, "about 1 ms per foot" is the classic rule of thumb.`,
        ];
      },
    },
    {
      key: 'wavelength',
      name: 'Wavelength from frequency',
      inputs: ['f', 'temp'],
      formula: 'λ = c / f',
      compute: (v) => {
        const c = speedOfSoundAir(n(v.temp));
        const l = c / n(v.f);
        return [
          { label: 'WAVELENGTH λ', value: l, quantity: 'length' },
          { label: 'HALF WAVE λ/2', value: l / 2, quantity: 'length' },
          { label: 'QUARTER WAVE λ/4', value: l / 4, quantity: 'length' },
          { label: 'EIGHTH WAVE λ/8', value: l / 8, quantity: 'length', chainable: false },
        ];
      },
      steps: (v) => {
        const c = speedOfSoundAir(n(v.temp));
        const f = n(v.f);
        return [
          `At ${fmt(n(v.temp))} °C the speed of sound is ${fmt(c)} m/s.`,
          `λ = ${fmt(c)} ÷ ${fmt(f)} = ${fmt(c / f)} m — the physical length of one cycle in air.`,
          `λ/2 = ${fmt(c / f / 2)} m matters for room modes and driver spacing; λ/4 = ${fmt(c / f / 4)} m for absorber depth and boundary cancellations.`,
        ];
      },
    },
    {
      key: 'distToFreq',
      name: 'Frequencies hiding in a distance (reverse)',
      inputs: ['dist', 'temp'],
      formula: 'f = c / λ — with λ, λ/2, λ/4 read as the distance',
      note: 'Placement-oriented reverse solve: which frequencies treat THIS distance as a full, half, or quarter wave.',
      compute: (v) => {
        const c = speedOfSoundAir(n(v.temp));
        const d = n(v.dist);
        return [
          { label: 'FULL-WAVE FREQUENCY', value: c / d, quantity: 'frequency' },
          { label: 'HALF-WAVE FREQUENCY (room-mode f₁ for this dimension)', value: c / (2 * d), quantity: 'frequency' },
          { label: 'QUARTER-WAVE FREQUENCY (boundary cancel region)', value: c / (4 * d), quantity: 'frequency' },
        ];
      },
      steps: (v) => {
        const c = speedOfSoundAir(n(v.temp));
        const d = n(v.dist);
        return [
          `c = ${fmt(c)} m/s at ${fmt(n(v.temp))} °C.`,
          `This distance is one FULL wave of ${fmt(c / d)} Hz, a HALF wave of ${fmt(c / (2 * d))} Hz (a room ${fmt(d)} m long has its first axial mode there), and a QUARTER wave of ${fmt(c / (4 * d))} Hz (a source or mic this far from a boundary interferes worst near odd multiples of it).`,
        ];
      },
    },
    {
      key: 'cycles',
      name: 'Cycles fitting in a distance',
      inputs: ['fKnown', 'dist', 'temp'],
      formula: 'cycles = d / λ · phase = cycles × 360°',
      compute: (v) => {
        const c = speedOfSoundAir(n(v.temp));
        const lam = c / n(v.fKnown);
        const cycles = n(v.dist) / lam;
        const frac = cycles - Math.floor(cycles);
        return [
          { label: 'CYCLES IN THE DISTANCE', value: cycles, quantity: 'number', chainable: false },
          { label: 'TOTAL PHASE ROTATION', value: cycles * 360, quantity: 'angle', chainable: false },
          { label: 'RESIDUAL PHASE OFFSET', value: frac * 360, quantity: 'angle' },
        ];
      },
      steps: (v) => {
        const c = speedOfSoundAir(n(v.temp));
        const f = n(v.fKnown);
        const lam = c / f;
        const cycles = n(v.dist) / lam;
        return [
          `λ = ${fmt(c)} ÷ ${fmt(f)} = ${fmt(lam)} m.`,
          `${fmt(n(v.dist))} m ÷ ${fmt(lam)} m = ${fmt(cycles)} cycles; the fraction left over (${fmt((cycles % 1) * 360)}°) is the phase offset a second arrival from this path difference carries at ${fmt(f)} Hz.`,
        ];
      },
    },
  ],
};
