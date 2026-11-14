/**
 * Visual Audio Analysis Lab module registry (owner spec 2026-07-29) — 11
 * modules teaching how to READ professional meters. Components live in
 * modMeterA/B/C, mapped by MeterModuleScreen.
 */
export type MeterModuleId =
  | 'waveform' | 'peak' | 'vu' | 'loudness'
  | 'spectrum' | 'spectrogram' | 'waterfall'
  | 'phase' | 'stereo' | 'scope' | 'detective';

export const METER_MODULES: { id: MeterModuleId; num: string; title: string; blurb: string }[] = [
  { id: 'waveform', num: '1', title: 'Waveform', blurb: 'Amplitude, polarity, clipping, transients, DC offset — the picture every DAW shows you.' },
  { id: 'peak', num: '2', title: 'Peak Meter', blurb: 'Instantaneous peaks, peak hold, OVER lamps — and why peak alone isn’t the story.' },
  { id: 'vu', num: '3', title: 'VU / RMS Meter', blurb: 'The classic needle: too slow for transients BY DESIGN — it shows average, like your ears.' },
  { id: 'loudness', num: '4', title: 'Loudness Meter', blurb: 'LUFS: momentary, short-term, integrated, LRA, true peak — broadcast & streaming language.' },
  { id: 'spectrum', num: '5', title: 'Spectrum Analyzer', blurb: 'Read the shapes: speech, cymbal, kick, hum, feedback — what does this curve tell me?' },
  { id: 'spectrogram', num: '6', title: 'Spectrogram', blurb: 'Time →, frequency ↑, color = level. The most misunderstood display, decoded.' },
  { id: 'waterfall', num: '7', title: 'Waterfall (CSD)', blurb: 'Frequency × amplitude × time: watch the mountain range collapse — and find what rings.' },
  { id: 'phase', num: '8', title: 'Phase Meter', blurb: 'Correlation, normal vs. inverted polarity, mono compatibility — read it before the mono bus bites.' },
  { id: 'stereo', num: '9', title: 'Stereo Image', blurb: 'Mono to wide to hard L/R to mid-side — SEE width instead of guessing.' },
  { id: 'scope', num: '10', title: 'Oscilloscope', blurb: 'The raw voltage picture — plus X-Y Lissajous mode for stereo relationships.' },
  { id: 'detective', num: '11', title: 'Signal Detective', blurb: 'Unknown meter, unknown problem: identify it, read it, prescribe the fix.' },
];

/** "Done = work done" (owner's decision 1, phase 3, 2026-11-14): modules 1–10
 *  count once EVERY CHECK YOURSELF on them is answered right, never on
 *  opening. Signal Detective (0 here) counts once one whole case — all four
 *  of its questions — is answered right (DetectiveModule). Pinned against the
 *  source by test/labFixes_20261114_F6.test.ts. */
export const METER_MODULE_CHECKS: Record<MeterModuleId, number> = {
  waveform: 2,
  peak: 1,
  vu: 2,
  loudness: 2,
  spectrum: 2,
  spectrogram: 2,
  waterfall: 2,
  phase: 2,
  stereo: 1,
  scope: 2,
  detective: 0,
};

/** The what's-left row's second line: what is still to do on that module. */
export function meterLeftDetail(id: MeterModuleId): string {
  if (id === 'detective') return 'Still to do: answer all four questions of one case right.';
  const n = METER_MODULE_CHECKS[id];
  // K3 (phase 3): 'both', never 'all 2'.
  return n === 1 ? 'Still to do: answer its CHECK YOURSELF right.' : n === 2 ? 'Still to do: answer both of its CHECK YOURSELF questions right.' : `Still to do: answer all ${n} of its CHECK YOURSELF questions right.`;
}
