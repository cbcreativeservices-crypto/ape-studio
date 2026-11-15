/**
 * Visual Audio Analysis Lab module registry (owner spec 2026-07-29) — 11
 * modules teaching how to READ professional meters. Components live in
 * modMeterA/B/C, mapped by MeterModuleScreen.
 */
export type MeterModuleId =
  | 'waveform' | 'peak' | 'vu' | 'loudness'
  | 'spectrum' | 'spectrogram' | 'waterfall'
  | 'phase' | 'stereo' | 'scope' | 'detective';

// MT-05 (owner 2026-11-15: "build waves 1 thru 3", D62): each blurb opens with the plain question
// that meter answers ("Will it clip?"), then a few plain words: no jargon list.
export const METER_MODULES: { id: MeterModuleId; num: string; title: string; blurb: string }[] = [
  { id: 'waveform', num: '1', title: 'Waveform', blurb: 'What does the sound look like? The wave itself: how far it swings, where the hits are, where it clips.' },
  { id: 'peak', num: '2', title: 'Peak Meter', blurb: 'Will it clip? The highest points of the signal, and the lamp that lights when one goes over.' },
  { id: 'vu', num: '3', title: 'VU / RMS Meter', blurb: 'How loud does it feel? A slow needle that shows the average, closer to what your ears hear.' },
  { id: 'loudness', num: '4', title: 'Loudness Meter', blurb: 'How loud is the whole song? One number that streaming and broadcast use to match programs.' },
  { id: 'spectrum', num: '5', title: 'Spectrum Analyzer', blurb: 'Where is the energy: low, middle or high? Read the shape of the curve.' },
  { id: 'spectrogram', num: '6', title: 'Spectrogram', blurb: 'How do the pitches change over time? Time runs across, pitch up, and color shows level.' },
  { id: 'waterfall', num: '7', title: 'Waterfall (CSD)', blurb: 'What keeps ringing after the sound stops? Every pitch fading away, drawn in 3-D.' },
  { id: 'phase', num: '8', title: 'Phase Meter', blurb: 'Will it survive mono? Whether left and right move together or cancel out, as normal vs. inverted polarity shows.' },
  { id: 'stereo', num: '9', title: 'Stereo Image', blurb: 'How wide is it? From one center point to wide, hard left and right, and mid-side.' },
  { id: 'scope', num: '10', title: 'Oscilloscope', blurb: 'What is the voltage doing right now? The raw wave, plus left drawn against right.' },
  { id: 'detective', num: '11', title: 'Signal Detective', blurb: 'Which meter is it, and what is wrong? Name the display, read it, then pick the fix.' },
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
