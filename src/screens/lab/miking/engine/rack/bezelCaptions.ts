/**
 * BEZEL CAPTIONS for the Miking Labs (lab fix round 2026-11-14, F9 phase 2,
 * S3 row 7; owner approval of the fix round: "Begin fixing all bugs found and
 * do obvious ... fixes as you suggestted in the report"). A bezel label that
 * is a code or a term a beginner would not know gets 1–3 plain words under
 * its value, on the learner's first visit to that stage (RackUnit /
 * BezelReadouts do the showing). One rule for all 128 lessons, applied in
 * MikingRack, keyed on the label (a "▸ " step mark is ignored). A label that
 * already says what it is in plain words (HEIGHT, DISTANCE, PART …) gets none.
 *
 * Pure (no React Native), so the tests reach it directly. At most 14
 * characters each (the S3 rule).
 */

const RULES: readonly [RegExp, string][] = [
  [/^(1ST|FIRST) NOTCH$|^NOTCH$/, 'a dip in tone'],
  [/^(PATH|EXTRA PATH)\b/, 'extra distance'],
  [/^(DELAY )?Δt\b|^DELAY\b|^LATER BY$/, 'arrives later'],
  [/^EDGES Δt$/, 'side timing'],
  [/^PICKUP$/, 'how loud'],
  [/^NULL$/, 'quietest angle'],
  [/^REJECTION$/, 'in quiet side?'],
  [/^POLARITY$/, 'flipped or not'],
  [/^(MIC )?OFF AXIS$/, 'angle off'],
  [/^NEAR \/ FAR$/, 'front vs back'],
  [/^SPREAD$/, 'distance range'],
  [/^IN \d+°$/, 'in its angle'],
  [/^PATTERN$/, 'pickup shape'],
  [/^CHANNELS$/, 'desk inputs'],
  [/^OPEN MICS$/, 'mics live'],
  [/^PHANTOM$/, '48 V needed'],
  [/^MARGIN LOST$/, 'feedback room'],
  [/^PHASE$/, 'timing match'],
  [/^STILL (POINTS|LINES)$/, 'not moving'],
];

/** The caption for a bezel label, or undefined when it reads plainly. */
export function bezelCaption(k: string): string | undefined {
  const key = k.replace(/^▸\s*/, '').trim();
  for (const [re, words] of RULES) if (re.test(key)) return words;
  return undefined;
}

/** Every caption the rule knows (for the length test). */
export const BEZEL_CAPTION_WORDS: readonly string[] = RULES.map((r) => r[1]);
