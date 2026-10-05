/**
 * The words the shared pages say for a suspended-metal instrument where they
 * would otherwise say "drum" (engine/model/copy.ts FamilyWords). Learner
 * text: the starting-points voice, no source or brand names.
 */
import type { FamilyWords } from '../../../engine/model/copy.ts';

export function metalWords(noun: string, player: string): FamilyWords {
  return {
    instrument: noun,
    player,
    reference: noun.toUpperCase(),
    inside: `inside the ${noun}’s motion`,
    outside: `outside the ${noun}`,
    axis: `the line straight out of the ${noun}`,
    facing: `facing the ${noun}`,
    shield: `${noun} in path`,
    mountStand: 'Mount: a stand of its own, clear of the whole playing motion — never clipped to the instrument, its line or its frame',
    mountClip: 'Mount: nothing is clipped to the instrument, its line or its frame without the owner’s agreement',
    sheet: 'For a real instrument, with the player’s agreement and the player stopped while anything moves. Write tendencies in words — what you heard, not a promised result.',
    viewSide: 'Side view,',
    viewTop: 'Top view',
  };
}
