/**
 * Miking Labs — words and checks every lesson shares, written ONCE (review
 * Lab 1, 2026-10-05):
 *
 *   OPPOSITE_SIDES_POLARITY  the one explanation of a bottom / opening / rear
 *       mic's polarity. Three lessons used to teach three models ("inverting
 *       usually helps", "flip the rear mic", "never invert a channel just
 *       because it is below the drum"). Every lesson that puts a second mic on
 *       the far side of a moving surface quotes this sentence verbatim;
 *       `test/mikingItemBalance.test.ts` enforces it.
 *   micRatingCheck  the setting-page check on a mic's max SPL. It used to be
 *       a "Does that tell you…? No" item in every lesson — one of the reasons
 *       a "Yes…" option was never the key. It now asks what the rating DOES
 *       tell you, and the reasoned key is a qualified "Yes".
 */
import type { MikingScenario, SourcePageId } from './types.ts';

export const OPPOSITE_SIDES_POLARITY =
  'Two mics on opposite sides of one moving surface — the top and bottom of a drum, a head and the drum’s open foot, the front and back of a speaker — hear it push and pull at the same instant, so they usually start opposite. Flipping one is a common first thing to TRY, never a rule: polarity flips the sign and does not remove a delay, so check both states by ear, at matched level, in mono.';

export type RatingWords = {
  id: string;
  page: SourcePageId;
  /** "kick mic", "spot mic near the timpani" */
  mic: string;
  /** "the hardest kick", "the loudest roll" */
  loudest: string;
};

const KEY = 'Yes — it will not distort; it says nothing about your ears';
const SAFE = 'Yes — and so the people beside it are safe for the session';
const HEAR = 'No — a mic’s max SPL is a hearing limit, not a distortion one';

export function micRatingCheck(w: RatingWords): MikingScenario {
  return {
    id: w.id,
    page: w.page,
    prompt: `Your ${w.mic} is rated to a max SPL well above ${w.loudest} at the mic. Can the mic take that level cleanly?`,
    options: [KEY, SAFE, HEAR],
    correct: KEY,
    explain: 'Max SPL says when the MIC distorts, so a rating well above the level at the mic means the mic copes. It says nothing about people: hearing risk depends on the level where a person is and for how long — a widely used guideline is no more than 85 dBA averaged over 8 hours, and every 3 dBA more halves the time.',
    why: {
      [SAFE]: 'The rating is the mic’s distortion limit, not a hearing limit. A widely used guideline for people is 85 dBA averaged over 8 hours, measured where they listen.',
      [HEAR]: 'It is the other way round: max SPL is the level where the mic starts to distort. Hearing needs its own level and time limit, measured where the person is.',
    },
  };
}
