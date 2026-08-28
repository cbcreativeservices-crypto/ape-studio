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
  { id: 'phase', num: '8', title: 'Phase Meter', blurb: 'Correlation, in/out of phase, mono compatibility — read it before the mono bus bites.' },
  { id: 'stereo', num: '9', title: 'Stereo Image', blurb: 'Mono to wide to hard L/R to mid-side — SEE width instead of guessing.' },
  { id: 'scope', num: '10', title: 'Oscilloscope', blurb: 'The raw voltage picture — plus X-Y Lissajous mode for stereo relationships.' },
  { id: 'detective', num: '11', title: 'Signal Detective', blurb: 'Unknown meter, unknown problem: identify it, read it, prescribe the fix.' },
];
