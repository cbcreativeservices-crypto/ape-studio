/**
 * Checks, symptoms and reasons that Lab 2's suspended-metal lessons share
 * (I06a triangle, I06b finger cymbals, I06c bar chimes, I12 gong). The
 * concert set (shared/concert/commonItems.ts) says "drum" in places; these
 * say the instrument's own words. Each lesson still writes its own
 * instrument-specific checks.
 *
 * Item rules (LESSON_JOURNEY §5, test/_mikingItemRules.ts): the right option
 * is never much longer than the others, wrong options are real
 * misconceptions with their own "why", no absolute-word giveaways, no brand
 * recall. Starting-points voice; no source names (owner 2026-10-04).
 */
import type { DiagnosticItem, MikingScenario, OrderTask, PageId, SetupReason, Symptom } from '../../../engine/model/types.ts';
import { micRatingCheck } from '../../../engine/model/sharedItems.ts';

export type MetalWords = {
  /** id prefix ("tri", "fc", "bc", "gg") */
  p: string;
  /** "the triangle" */
  the: string;
  /** "percussionist" */
  player: string;
  /** "the loudest stroke" */
  loudest: string;
  /** "the ring" — what a gate or a filter can cut off */
  tail: string;
};

export function hearingCheck(w: MetalWords, page: PageId = 'setting'): MikingScenario {
  // The shared max-SPL check (sharedItems.ts): what the rating DOES say.
  return micRatingCheck({ id: `${w.p}.set.hear`, page, mic: `spot mic near ${w.the}`, loudest: `the loudest stroke on ${w.the}` });
}

export function quickHearing(w: MetalWords, id = `${w.p}.q.6`): DiagnosticItem {
  return {
    id,
    covers: 'setting',
    critical: true,
    prompt: `A spot mic on ${w.the} is rated far above any level in the room. What does that tell you about a long, loud rehearsal next to it?`,
    options: ['Nothing — that is the mic’s distortion limit, not a hearing limit', 'It is safe while the room stays below the mic’s rating', 'It is safe as long as the mic is much nearer the metal than you are'],
    correct: 'Nothing — that is the mic’s distortion limit, not a hearing limit',
    explain: 'Max SPL says when the MIC distorts. For people, a widely used guideline is no more than 85 dBA averaged over 8 hours, halving the time for every 3 dBA more — measured where the person listens.',
    why: {
      'It is safe while the room stays below the mic’s rating': 'A mic rating is not a hearing limit. A widely used guideline for people is 85 dBA averaged over 8 hours.',
      'It is safe as long as the mic is much nearer the metal than you are': 'Where the mic sits says nothing about your ears. Measure where the person listens, and keep levels and time down.',
    },
  };
}

export function polarityKeepsDelay(w: MetalWords): MikingScenario {
  return {
    id: `${w.p}.two.1`,
    page: 'twoMic',
    prompt: 'You flip the polarity of mic B. What happens to the arrival-time difference between the two mics?',
    options: ['Nothing: polarity flips the sign; the delay stays the same', 'It drops to zero, so the two arrivals now line up in time again', 'It doubles, because the inverted copy arrives later'],
    correct: 'Nothing: polarity flips the sign; the delay stays the same',
    explain: 'Polarity inversion reverses the signal’s sign. It does not remove a delay caused by sound reaching the mics at different times: the notches move; Δt does not.',
    why: {
      'It drops to zero, so the two arrivals now line up in time again': 'Flipping polarity changes the sign, not when the sound arrives — the mics are still the same distances from the source.',
      'It doubles, because the inverted copy arrives later': 'Polarity has no time in it. Only moving a mic changes when the sound arrives.',
    },
  };
}

export function firstNotch(w: MetalWords): MikingScenario {
  return {
    id: `${w.p}.two.2`,
    page: 'twoMic',
    prompt: 'Two mics hear a stroke 1 ms apart. Summed at equal level, same polarity: where is the first notch (simplified model)?',
    options: ['500 Hz, then 1.5 kHz, 2.5 kHz …', '1 kHz, then 2 kHz, 3 kHz, 4 kHz …', '250 Hz, then 750 Hz, 1.25 kHz …'],
    correct: '500 Hz, then 1.5 kHz, 2.5 kHz …',
    explain: 'The first cancellation is where the delay is half a period: f = 1 ÷ (2 × 0.001 s) = 500 Hz, then odd multiples. Inverted, the notches sit at 0, 1 kHz, 2 kHz … instead.',
    why: {
      '1 kHz, then 2 kHz, 3 kHz, 4 kHz …': 'That is the INVERTED set (whole multiples of 1 ÷ Δt). Same polarity cancels where the delay is half a period: 500 Hz.',
      '250 Hz, then 750 Hz, 1.25 kHz …': 'That needs a 2 ms delay. With 1 ms the first notch is at 1 ÷ (2 × 0.001 s) = 500 Hz.',
    },
  };
}

export function louderIsNotBetter(w: MetalWords): MikingScenario {
  return {
    id: `${w.p}.two.4`,
    page: 'twoMic',
    prompt: `You flip B’s polarity and ${w.the} suddenly sounds bigger; the sum reads 3 dB louder. What do you conclude?`,
    options: ['Not yet: match the levels, then compare both states again in mono', 'Inverted is the better setting, so keep it that way for the whole show', 'Normal polarity was wrong, because it was the quieter one'],
    correct: 'Not yet: match the levels, then compare both states again in mono',
    explain: 'A louder version almost always sounds “better” at first. Compare at matched level, in mono and with the whole ensemble, before you decide.',
    why: {
      'Inverted is the better setting, so keep it that way for the whole show': 'A louder version almost always sounds better at first. Compare at matched level before deciding.',
      'Normal polarity was wrong, because it was the quieter one': 'Quieter is not wrong. Match levels, then judge which state keeps the attack and the ring natural.',
    },
  };
}

export function moveRemovesDelay(w: MetalWords, id = `${w.p}.mix.3`): MikingScenario {
  return {
    id,
    page: 'practice',
    prompt: `The spot and the ensemble mics sound hollow together on ${w.the}. Which change removes the arrival-time difference itself?`,
    options: ['Moving a mic so the two paths are closer to equal', 'Flipping the polarity switch on one of the mics', 'Turning the later mic up until it matches the earlier one'],
    correct: 'Moving a mic so the two paths are closer to equal',
    explain: 'Only the paths set the delay. Polarity moves the notches; level changes their depth; neither removes the delay. (A delay set on the desk is another tool — a mix decision, judged by ear in the whole ensemble.)',
    why: {
      'Flipping the polarity switch on one of the mics': 'Polarity flips the sign; it moves the notches but does not remove the delay.',
      'Turning the later mic up until it matches the earlier one': 'Level changes the depth of the notches, not where they are or the delay behind them.',
    },
  };
}

export function cardioidNull(w: MetalWords, id = `${w.p}.mix.2`): MikingScenario {
  return {
    id,
    page: 'practice',
    prompt: 'A floor monitor sits directly behind a cardioid spot mic. What can you expect from that null?',
    options: ['Strong rejection on paper; in reality less, and least in the lows', 'Silence from the monitor, because it sits right inside the null itself', 'More pickup than at the sides, because the rear is open'],
    correct: 'Strong rejection on paper; in reality less, and least in the lows',
    explain: 'A null is infinitely deep only on paper. Real mics reject far less there, and least at low frequencies — use the null to aim, not to promise silence.',
    why: {
      'Silence from the monitor, because it sits right inside the null itself': 'A null is infinitely deep only on paper. Real mics reject far less, and least in the lows.',
      'More pickup than at the sides, because the rear is open': 'A cardioid rejects most directly behind. The point is that real rejection is shallower than the picture.',
    },
  };
}

export function gainCheck(w: MetalWords): MikingScenario {
  return {
    id: `${w.p}.prac.gain`,
    page: 'practice',
    prompt: `Normal playing sits well below the overload light, but ${w.loudest} lights it. What do you do?`,
    options: ['Lower the input gain, or use a pad its manual allows, and re-check', 'Pull the channel fader down until that one stroke sounds clean again', `Ask the ${w.player} to play that stroke a little softer`],
    correct: 'Lower the input gain, or use a pad its manual allows, and re-check',
    explain: 'Set input gain with headroom for the strongest stroke the music asks for, and watch the overload indicator. A lowered fader does not undo clipping at the input; a pad goes where the manual allows it, at the stage that overloads.',
    why: {
      'Pull the channel fader down until that one stroke sounds clean again': 'The overload happens at the input, before the fader. A lower fader only makes the clipped sound quieter.',
      [`Ask the ${w.player} to play that stroke a little softer`]: 'The music sets the dynamics. Set the gain for the strongest stroke the player will play — not for a gentler soundcheck.',
    },
  };
}

export function monoSymptom(w: MetalWords): Symptom {
  return {
    id: `${w.p}.s.mono`,
    observation: `${w.the.replace(/^the /, 'The ')} turns hollow or thin when a second mic is opened`,
    firstChecks: 'Each channel alone, then the sum in mono at matched levels; positions, levels and both polarity states.',
    options: ['Each mic alone, then the mono sum, levels and both polarity states', 'Turn the spot up until it sounds full and solid again in the whole mix', 'Invert the spot, since a spot is usually the wrong polarity'],
    correct: 'Each mic alone, then the mono sum, levels and both polarity states',
    explain: 'The two mics hear the instrument at different times. Check the sum in mono at matched levels before reaching for processing — and leave the second mic down or out if it does not help.',
    why: {
      'Turn the spot up until it sounds full and solid again in the whole mix': 'More level does not fix a cancellation, and a loud spot can pull the instrument out of its place in the mix.',
      'Invert the spot, since a spot is usually the wrong polarity': 'No mic is “usually wrong”. Compare BOTH polarity states at matched level, in mono — polarity is a diagnostic, not a cure.',
    },
  };
}

export function contactSymptom(w: MetalWords, what: string): Symptom {
  return {
    id: `${w.p}.s.contact`,
    observation: `A stand is in the way, or ${what} could reach the mic`,
    firstChecks: `Stop the ${w.player}, mute the channel, move the stand or leave that mic out; repeat the clearance check with the player through the whole passage.`,
    options: ['Stop, mute, move or omit the mic; recheck with the player', 'Carry on carefully, and move the stand at the next break in the music', `Ask the ${w.player} to play around the mic for this piece`],
    correct: 'Stop, mute, move or omit the mic; recheck with the player',
    explain: 'Clearance comes first: the player stops before anything moves, and the full passage — not a still pose — sets the clearance. A mic that cannot go in safely is left out.',
    why: {
      'Carry on carefully, and move the stand at the next break in the music': 'Clearance comes first: stop before anything moves, not at the next break.',
      [`Ask the ${w.player} to play around the mic for this piece`]: 'The music sets the player’s motion. Move the mic, or leave it out — never ask the player to change their technique for it.',
    },
  };
}

export function tailSymptom(w: MetalWords): Symptom {
  return {
    id: `${w.p}.s.tail`,
    observation: `${w.tail.replace(/^the /, 'The ')} vanishes`,
    firstChecks: 'Is it damped on purpose, masked by other players, cut by a gate, or lost in noise? Find the stage that loses it.',
    options: ['Whether it is damped, masked, gated or lost in noise', 'Turn the channel up until the end of the note comes back', 'Add reverb so the instrument seems to ring for longer'],
    correct: 'Whether it is damped, masked, gated or lost in noise',
    explain: 'The ring is part of the music — and its END is played too. Find where it is lost: the player, the room, a gate or the noise floor; remove a gate that cuts it.',
    why: {
      'Turn the channel up until the end of the note comes back': 'If a gate or the player stops it, more gain changes nothing; if it is masked, more gain raises the spill too.',
      'Add reverb so the instrument seems to ring for longer': 'Reverb hides the cause. Find where the ring is lost first.',
    },
  };
}

/** The one-mic setup, in order. */
export function setupOrder(w: MetalWords, first: { text: string; early: string }): OrderTask {
  return {
    id: `${w.p}.prac.order`,
    page: 'practice',
    prompt: 'Tap the steps of adding one mic in the order you would do them.',
    steps: [
      first,
      { text: 'Listen in the room, and to any mics already up, before adding one', early: 'Hear what is already there before you add a mic.' },
      { text: 'Choose a mic whose pattern, power, size and mount suit the job', early: 'Choose the mic once you know what is missing and where it could go.' },
      { text: `Have the ${w.player} stop; place the stand; check clearance and the cable path`, early: 'You need a chosen mic before you can place it.' },
      { text: 'Mute the outputs and lower monitoring; then switch phantom if it is needed', early: 'Power comes after the mic is placed and its cable connected — with the outputs muted first.' },
      { text: 'Set input gain on the quietest and the loudest strokes, with headroom', early: 'Gain is set once the mic is connected and powered.' },
      { text: 'Blend it with the other mics; check the sum in mono', early: 'Blend only once the level is set safely — and judge the sum, not the mic alone.' },
    ],
    explain: 'A sensible order. Phantom: mute the outputs and lower monitoring before connecting, disconnecting or switching it, and follow your own equipment’s manual. Gain: set it with headroom for the strongest stroke, watching the overload indicator — and keep the natural ring audible.',
  };
}

export const POWER_REASON: SetupReason = { id: 'r.power', label: 'This channel gives the mic the power it needs (phantom, or none)', role: 'required', feedback: 'Say how the mic is powered: a condenser needs phantom; a dynamic needs none.' };
export const CLEAR_REASON: SetupReason = { id: 'r.clear', label: 'The mic, stand and cable stay clear of the whole playing motion', role: 'required', feedback: 'Clearance — of the whole motion, not a still pose — is part of every passing setup.' };
export const BRAND_REASON: SetupReason = { id: 'r.brand', label: 'It is the brand most engineers reach for on this instrument', role: 'wrong', feedback: 'A brand is not part of passing: choose by properties.' };
export const PLAYER_REASON: SetupReason = { id: 'r.player', label: 'The player can change how they play to suit the mic', role: 'wrong', feedback: 'The player’s technique is never changed for a mic.' };
