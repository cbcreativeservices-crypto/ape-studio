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
  { id: 'processing', title: 'Digital Processing & Formats', blurb: 'Integer vs floating point, and what "above 0 dBFS" really means inside a DAW.' },
  { id: 'dac', title: 'D-to-A Reconstruction', blurb: 'How numbers become a CONTINUOUS waveform — the staircase myth, corrected. Inter-sample peaks.' },
  { id: 'errors', title: 'Errors & Limits', blurb: 'Myth vs reality, jitter, and clocking — the misconception-busting heart of the lab.' },
];
