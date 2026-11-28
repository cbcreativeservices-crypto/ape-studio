/**
 * Digital Lab module registry — ids, titles, blurbs. The module COMPONENTS
 * live in the four module files (modAnalog/modQuant/modChain/modDac), mapped
 * by DigitalModuleScreen.
 */
export type DigitalModuleId =
  | 'analog'
  | 'sampling'
  | 'quant'
  | 'binary'
  | 'adc'
  | 'processing'
  | 'dac'
  | 'errors';

export const DIGITAL_MODULES: { id: DigitalModuleId; title: string; blurb: string }[] = [
  { id: 'analog', title: 'The Analog Signal', blurb: 'Pressure, diaphragm, voltage — what exists before any number does.' },
  { id: 'sampling', title: 'Sampling & Sample Rate', blurb: 'Measuring the waveform in time: Nyquist, samples-per-cycle, and aliasing you can hear.' },
  { id: 'quant', title: 'Quantization & Bit Depth', blurb: 'Measuring amplitude in steps: levels, error, dynamic range — and dither.' },
  { id: 'binary', title: 'Binary Sample Values', blurb: 'What the computer actually stores — inspect any sample, flip its bits.' },
  { id: 'adc', title: 'Analog-to-Digital Conversion', blurb: 'The full ADC pathway, block by block — plus the gain-staging exercise.' },
  { id: 'processing', title: 'Digital Processing & Formats', blurb: 'Integer vs floating point, and what "above 0 dBFS" really means inside a DAW (recording software).' },
  { id: 'dac', title: 'D-to-A Reconstruction', blurb: 'How numbers become a CONTINUOUS waveform — the staircase myth, corrected. Inter-sample peaks.' },
  { id: 'errors', title: 'Errors & Limits', blurb: 'Myth vs reality, jitter (timing errors in the sample clock), and how devices share one clock — the misconception-busting heart of the lab.' },
];

/** "Done = work done" (owner's decision 1, phase 3, 2026-11-14): a module
 *  counts once EVERY CHECK YOURSELF on it is answered right, never on opening.
 *  The number of checks each module draws (pinned against the source by
 *  test/labFixes_20261114_F6.test.ts). */
export const DIGITAL_MODULE_CHECKS: Record<DigitalModuleId, number> = {
  analog: 1,
  sampling: 2,
  quant: 2,
  binary: 1,
  adc: 1,
  processing: 1,
  dac: 2,
  errors: 5,
};

/** The what's-left row's second line: what is still to do on that module. */
export function digitalLeftDetail(id: DigitalModuleId): string {
  const n = DIGITAL_MODULE_CHECKS[id];
  // K3 (phase 3): 'both', never 'all 2'.
  return n === 1 ? 'Still to do: answer its CHECK YOURSELF right.' : n === 2 ? 'Still to do: answer both of its CHECK YOURSELF questions right.' : `Still to do: answer all ${n} of its CHECK YOURSELF questions right.`;
}
