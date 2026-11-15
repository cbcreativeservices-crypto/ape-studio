/**
 * SH-15 (owner 2026-11-15: "build waves 1 thru 3", D62 adoption plan): with
 * sound off, Beginning Mixing page 4's MIX A / MIX B bars stayed empty
 * ("PLAY IT"), because the lab measures a mix only when it renders it for
 * playback. These are the SAME measurements, made offline once from the same
 * renderer and the same settings (renderMix({}, 0) and renderMix({}, 3)),
 * stored here and pinned by test/labWaves_20261115_F4 (which re-renders and
 * compares), so they can never drift from what the lab would measure. The page
 * shows a stored bar only for a mix the learner pressed ▶ on with sound off,
 * marked NOT HEARD, so the blind vote is never given away earlier than it is
 * with sound on. Values in dBFS (peak) and dB (RMS), rounded to 0.1.
 */
export const STORED_P4_LEVELS: Readonly<Record<'a' | 'b', { peakDb: number; rmsDb: number }>> = {
  a: { peakDb: -1.0, rmsDb: -17.6 },
  b: { peakDb: 2.0, rmsDb: -14.6 },
};
