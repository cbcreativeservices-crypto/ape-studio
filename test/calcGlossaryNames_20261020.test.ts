/**
 * Calculator Lab glossary names (Comp A reconciled them, LIVE 2026-10-20;
 * brief docs/COMP_A_CALC_GLOSSARY_NAMES_2026_10_20.md).
 *
 * GlossaryTermPopup opens a name with an unordered, case-insensitive
 * `ilike(term, name).limit(1)`, so a name must match exactly ONE live entry.
 * On 2026-10-20 ccode checked every name below against glossary_browse_v
 * (read-only): each matches exactly one row. A workspace that adds or changes
 * a name fails here until the new name is checked against the live glossary
 * the same way and added to VERIFIED.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = join(import.meta.dirname, '../src/screens/lab/calc/workspaces');

/** Every calculator glossary name, each checked live: exactly one entry. */
const VERIFIED: readonly string[] = [
  '70-volt system',
  'A weighting',
  'AWG',
  'Absorption Coefficient',
  'Ampacity',
  'Ampacity derating',
  'Amplifier',
  'Analog-to-digital conversion',
  'Antenna',
  'Attenuation',
  'Audio transformer',
  'BPM (Beats Per Minute)',
  'Bandwidth',
  'Bit Depth',
  'Buffer',
  'Capacitor',
  'Center frequency',
  'Cents',
  'Comb Filtering',
  'Convolution',
  'Correlation',
  'Critical distance',
  'Crossover',
  'Current',
  'Cutoff frequency',
  'Damping Factor',
  'Decibel',
  'Delay',
  'Diffusion',
  'Directivity',
  'Distortion',
  'Dither',
  'Dynamic Range',
  'Dynamic range compression',
  'Exchange rate',
  'Exposure/Dose',
  'FFT',
  'FIR Filter',
  'Filter',
  'Frame Rate',
  'Free field',
  'Frequency',
  'Gain',
  'Gain Reduction',
  'Gain Staging',
  'Gating',
  'Harmonics',
  'Headroom',
  'Impedance',
  'Impulse Response',
  'Incoherent Summation',
  'Inductor',
  'Interference',
  'Intermodulation',
  'Inverse Square Law',
  'Inverse square law',
  'Jitter',
  'K-weighting',
  'LUFS',
  'Latency',
  'Leq',
  'Limiter',
  'Linear Phase',
  'Loudness',
  'Loudspeaker',
  'Loudspeaker Tap Impedance',
  'MIDI',
  'Makeup Gain',
  'Mass Law',
  'Microphone (Mic)',
  'Modal density',
  'Monitoring (audio)',
  'Nominal impedance',
  'Nyquist Frequency',
  'Octave',
  'Packet',
  'Pad',
  'Parallel circuit',
  'Parametric EQ',
  'Period',
  'Phase',
  'Polar Pattern',
  'Polarity',
  'Power',
  'Preamplifier',
  'Propagation',
  'Q factor',
  'Quantization',
  'RMS',
  'RT60',
  'Radio Frequency',
  'Ratio',
  'Reactance',
  'Reflection (acoustics)',
  'Resistance',
  'Resonance',
  'Reverberation',
  'Reverberation Time',
  'Room Mode',
  'Sabine equation',
  'Sample',
  'Sample Rate',
  'Sensitivity',
  'Series circuit',
  'Signal-to-Noise Ratio',
  'Sound Isolation',
  'Sound Pressure Level',
  'Sound Wave',
  'Sound pressure level',
  'Spectrum',
  'Speed of sound',
  'Standing wave',
  'Stereo',
  'Synchronization',
  'Threshold',
  'Timecode',
  'Transition Band',
  'Transmission Loss',
  'True Peak',
  'Turns ratio',
  'Voltage',
  'Voltage divider',
  'Wavelength',
  'Window function',
  'Wireless microphone system',
  'Word Clock',
  'constant-voltage (70V / 100V) distribution',
  'dBFS',
  'dBV',
  'dBu',
  'nonlinear distortion',
];

function namesInWorkspaces(): string[] {
  const out = new Set<string>();
  for (const f of readdirSync(DIR).filter((x) => x.endsWith('.ts'))) {
    for (const m of readFileSync(join(DIR, f), 'utf8').matchAll(/glossary:\s*\[([^\]]*)\]/g)) {
      for (const n of m[1].matchAll(/'((?:[^'\\]|\\.)*)'/g)) out.add(n[1]);
    }
  }
  return [...out].sort();
}

describe('Calculator glossary names open exactly one live entry', () => {
  it('every name in the workspaces is on the verified list', () => {
    const unverified = namesInWorkspaces().filter((n) => !VERIFIED.includes(n));
    assert.deepEqual(unverified, [], 'check these against glossary_browse_v, then add them to VERIFIED');
  });
  it('the names Comp A replaced are gone, and the new ones are used', () => {
    const used = namesInWorkspaces();
    for (const old of ['Exposure', 'Nonlinearity', 'Summation', 'Transformer tap', 'Wireless', 'Transformer']) assert.ok(!used.includes(old), old);
    for (const now of ['Exposure/Dose', 'nonlinear distortion', 'Incoherent Summation', 'Loudspeaker Tap Impedance', 'Wireless microphone system', 'Audio transformer']) assert.ok(used.includes(now), now);
  });
  it('no name carries an ilike wildcard (% or _), which would match other entries', () => {
    assert.deepEqual(namesInWorkspaces().filter((n) => /[%_]/.test(n)), []);
  });
});
