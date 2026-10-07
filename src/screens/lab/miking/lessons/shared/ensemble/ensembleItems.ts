/**
 * Lab 5's shared CHECKS and WORDS for main arrays and supports — each
 * lesson builds its own copy with its own id prefix (`p`) and page, so the
 * same idea is asked in the lesson's own context. Item-writing rules
 * (LESSON_JOURNEY §5): three options of like length, real misconceptions, a
 * why for every wrong option, no absolute words in a distractor, reasoning
 * over recall. Learner text: the starting-points voice, no source names.
 */
import type { DiagnosticItem, MikingScenario, SetupReason, SourcePageId } from '../../../engine/model/types.ts';
import type { FamilyWords } from '../../../engine/model/copy.ts';

export function ensembleWords(noun: string): FamilyWords {
  return {
    instrument: noun,
    player: 'players',
    reference: 'FRONT ROW',
    inside: 'among the players',
    outside: 'clear of the players',
    axis: 'the line toward the players',
    facing: 'facing the players',
    shield: 'players in path',
    mountStand: 'Mount: a tall stand with a wide base, or a boom stand, clear of the players, their bows and the conductor — never in a walkway; anything flown is the venue’s rigging',
    mountClip: 'Mount: an instrument mount only with the player’s agreement, and the cable dressed clear of the bow and the hands',
    sheet: 'For a real ensemble, with the players’, the conductor’s and the venue’s agreement. Write tendencies in words — what you heard, not a promised result.',
    viewSide: 'From the hall,',
    viewTop: 'From above,',
  };
}

/** A near-coincident pair's geometry is fixed: move the pair, not the spacing. */
export const ortfFixed = (p: string, page: SourcePageId): MikingScenario => ({
  id: `${p}.ortf`,
  page,
  prompt: 'The 17 cm, 110° pair sounds a little narrow. What do you change first?',
  options: ['Move or turn the whole pair', 'Widen the spacing to 30 cm', 'Splay just one of the mics further out'],
  correct: 'Move or turn the whole pair',
  explain: 'That pair is defined by its 17 cm and 110°. Change its position and height as a unit; a different spacing or angle is a different near-coincident pair, chosen on purpose.',
  why: {
    'Widen the spacing to 30 cm': 'Then it is no longer the 17 cm pair — a different method with its own behaviour.',
    'Splay just one of the mics further out': 'One mic turned out unbalances the image; the pair moves as a unit.',
  },
});

/** 3:1 is for separate mics, never the spacing of a stereo pair. */
export const noThreeToOne = (p: string, page: SourcePageId): MikingScenario => ({
  id: `${p}.31`,
  page,
  prompt: 'What sets a spaced main pair’s spacing?',
  options: ['The method, the room and listening', 'The 3-to-1 rule: three times the distance', 'The 3-to-1 rule, unless they are cardioids'],
  correct: 'The method, the room and listening',
  explain: 'The 3-to-1 guideline keeps SEPARATE mics on separate sources from combing. A stereo pair is meant to hear the same ensemble in both mics; its spacing comes from the method, the room and your ears.',
  why: {
    'The 3-to-1 rule: three times the distance': 'That guideline keeps separate mics apart; at 3 m from the players it would put the pair 9 m apart. Both mics of a pair hear one ensemble on purpose.',
    'The 3-to-1 rule, unless they are cardioids': 'The pattern does not change it: 3-to-1 is not a rule for one array.',
  },
});

/** M/S: summed to mono, the Side cancels. */
export const msMono = (p: string, page: SourcePageId): MikingScenario => ({
  id: `${p}.ms`,
  page,
  prompt: 'An M/S pair is summed to mono. What is left?',
  options: ['The Mid mic only', 'The Side mic only', 'Both, a little quieter'],
  correct: 'The Mid mic only',
  explain: 'Left = Mid + Side and Right = Mid − Side, so L + R = 2 × Mid: the Side cancels. Width is set by the Side’s level; the mono sum is the Mid.',
  why: {
    'The Side mic only': 'It is the other way round: the Side is what cancels.',
    'Both, a little quieter': 'The Side appears with opposite signs in the two sides, so it sums to nothing.',
  },
});

/** A/B too wide: a hole in the middle. */
export const abHole = (p: string, page: SourcePageId): MikingScenario => ({
  id: `${p}.hole`,
  page,
  prompt: 'You spread the spaced pair to 2 m and the middle goes thin. Likely why?',
  options: ['Too wide: a hole opens in the middle', 'Omnis cannot capture a centre image', 'The mics are now too far from the floor'],
  correct: 'Too wide: a hole opens in the middle',
  explain: 'Past about 1 m a spaced pair tends to lose its centre. Bring the spacing back toward 40–60 cm, or try a third, centre mic — and check the mono sum.',
  why: {
    'Omnis cannot capture a centre image': 'A spaced omni pair at its usual 40–60 cm images a centre well.',
    'The mics are now too far from the floor': 'The spacing changed, not the height.',
  },
});

/** A tree's centre feeds both sides, a few dB down. */
export const treeCentre = (p: string, page: SourcePageId): MikingScenario => ({
  id: `${p}.tree`,
  page,
  prompt: 'In a three-omni tree, where does the centre mic go in the mix?',
  options: ['Into both sides, a few dB down', 'Into the centre channel only, full level', 'Hard left, opposite the left mic'],
  correct: 'Into both sides, a few dB down',
  explain: 'Left goes left, right goes right, and the centre is fed equally into both, a few dB down — one example uses 4–5 dB. Raise it from silence until the middle is filled, not past it.',
  why: {
    'Into the centre channel only, full level': 'In stereo there is no centre channel: it is split into both sides, and lower.',
    'Hard left, opposite the left mic': 'That would pull the image sideways; it feeds both sides equally.',
  },
});

/** A support earns its fader by a named need. */
export const supportNeed = (p: string, page: SourcePageId, what = 'an inner line'): MikingScenario => ({
  id: `${p}.need`,
  page,
  prompt: 'When does a section support earn its place under the main pair?',
  options: [`When ${what} is missing in the pair`, 'Whenever a spare channel on the desk is unused', 'One for each desk of players, as a rule'],
  correct: `When ${what} is missing in the pair`,
  explain: 'Set the main image first. Add a support only for a named need, bring it up from silence just until the line is clearer, and check the image and the mono sum again.',
  why: {
    'Whenever a spare channel on the desk is unused': 'A spare channel is not a reason; every support adds overlap and timing to judge.',
    'One for each desk of players, as a rule': 'One mic per desk is not needed: a support covers three or four players.',
  },
});

/** A support hears its players first; the main array later. */
export const supportFirst = (p: string, page: SourcePageId): MikingScenario => ({
  id: `${p}.first`,
  page,
  prompt: 'A support is 5 m closer to the woodwinds than the main pair. What happens?',
  options: ['It hears them about 15 ms earlier', 'Both mics hear them at the same time', 'The main pair hears them earlier'],
  correct: 'It hears them about 15 ms earlier',
  explain: 'Sound travels about 1 m in 2.9 ms, so 5 m is about 15 ms. Summed, the early support can change the depth and colour; compare main alone, support alone and both — a delay is a trial, never set by distance alone.',
  why: {
    'Both mics hear them at the same time': 'They are at different distances, so the arrivals differ.',
    'The main pair hears them earlier': 'The support is closer, so it hears them first.',
  },
});

/** The safety item every Lab 5 quick check carries: rigging. */
export const riggingDiag = (p: string): DiagnosticItem => ({
  id: `${p}.q.rig`,
  covers: 'setups',
  critical: true,
  prompt: 'The best place for the pair needs it hung above the stage. What do you do?',
  options: ['Ask the venue: its crew, its rated plan', 'Tie it to a lighting bar yourself', 'Use a boom stand at its full extension over them'],
  correct: 'Ask the venue: its crew, its rated plan',
  explain: 'Anything flown, attached to the building or reached over players is the venue’s: an approved rigging plan, rated hardware and qualified crew. Otherwise choose a safe floor position.',
  why: {
    'Tie it to a lighting bar yourself': 'An unapproved attachment over players is never yours to make.',
    'Use a boom stand at its full extension over them': 'Over the players an overextended boom is a hazard; choose a safe position instead.',
  },
});

export const riggingCheck = (p: string, page: SourcePageId): MikingScenario => ({
  id: `${p}.rig`,
  page,
  prompt: 'The tree would sound best hung over the strings. Who puts it up?',
  options: ['The venue’s crew, to a rated plan', 'You, carefully, with good cable ties', 'A player, during the rehearsal break'],
  correct: 'The venue’s crew, to a rated plan',
  explain: 'Flying an array, attaching to the structure or reaching over players needs the venue’s approved rigging plan, rated hardware and qualified crew. Otherwise use a safe floor stand.',
  why: {
    'You, carefully, with good cable ties': 'Cable ties and signal cable are not suspension hardware, and it is not your call.',
    'A player, during the rehearsal break': 'Rigging is the venue’s qualified crew’s job, never a player’s.',
  },
});

export const hearingCheck = (p: string, page: SourcePageId, loud = 'brass and percussion peaks'): MikingScenario => ({
  id: `${p}.hear`,
  page,
  prompt: `You monitor ${loud} on headphones for an hour. What protects your hearing?`,
  options: ['Sensible levels and limited time', 'The maximum SPL rating of the mics', 'Turning up to hear the detail'],
  correct: 'Sensible levels and limited time',
  explain: 'A widely used guideline is no more than 85 dBA averaged over 8 hours, halving the time for every 3 dBA more — a limit for people where they listen. Keep monitoring sensible and take breaks.',
  why: {
    'The maximum SPL rating of the mics': 'That is about the microphone, not your ears.',
    'Turning up to hear the detail': 'Louder raises your exposure; detail comes from placement, not level.',
  },
});

export const PAIR_REASON: SetupReason = { id: 'r.main', label: 'A main pair or array first, for the whole perspective', role: 'required', feedback: 'Say why it comes first: it hears the ensemble and the hall as one picture.' };
export const SAFE_REASON: SetupReason = { id: 'r.safe', label: 'Stands clear of players, bows, sightlines and walkways', role: 'required', feedback: 'Safe placement is part of every passing setup.' };
export const POWER_REASON: SetupReason = { id: 'r.power', label: 'Phantom power is on for the condensers', role: 'optional', feedback: 'A fair reason: these condensers need phantom power.' };
export const BRAND_REASON: SetupReason = { id: 'r.brand', label: 'It is the brand most orchestras are recorded with', role: 'wrong', feedback: 'A brand is not part of passing: choose by the method and the room.' };
export const SPOTS_REASON: SetupReason = { id: 'r.spots', label: 'A close mic on every desk gives the most control', role: 'wrong', feedback: 'Spots everywhere lose the shared picture and add overlap; supports only for a named need.' };
