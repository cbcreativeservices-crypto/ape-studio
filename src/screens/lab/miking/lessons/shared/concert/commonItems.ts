/**
 * Checks, symptoms and tasks that Lab 1's four concert lessons share (M06
 * timpani, M07a concert bass drum, M07b concert snare, M08 headed
 * tambourine). Each lesson's own text says the same thing about these
 * shared ideas — polarity is not delay, a mic's maximum SPL is not a hearing
 * limit, gain is set on the loudest real stroke — so they are written once,
 * with the instrument's words passed in. Every lesson still writes its own
 * instrument-specific checks.
 *
 * Item rules (LESSON_JOURNEY §5, pinned by test/mikingConcertLessons.test.ts):
 * the right option is never much longer than the others, wrong options are
 * real misconceptions with their own "why", no absolute-word giveaways, no
 * brand recall. Starting-points voice; no source names (owner 2026-10-04).
 */
import type { MikingScenario, OrderTask, PageId, SetupReason, Symptom } from '../../../engine/model/types.ts';

export type Words = {
  /** id prefix ("tp", "cbd", "cs", "tb") */
  p: string;
  /** "the timpani" / "the drum" / "the tambourine" */
  the: string;
  /** "timpanist" / "percussionist" */
  player: string;
  /** "the loudest roll" / "the hardest hit" */
  loudest: string;
};

export function hearingCheck(w: Words, page: PageId, id = `${w.p}.set.hear`): MikingScenario {
  return {
    id,
    page,
    prompt: `The spot mic near ${w.the} is rated to a very high SPL. Does that tell you how long the crew can stand there through rehearsal?`,
    options: ['No — max SPL is the mic’s distortion limit, not a hearing limit', 'Yes — anything under the mic’s rating is safe for the people near it', 'Yes, as long as the mic is closer to the drum than the people are'],
    correct: 'No — max SPL is the mic’s distortion limit, not a hearing limit',
    explain: 'Max SPL says when the MIC distorts. Hearing risk depends on the level where a person is and for how long: a widely used guideline is no more than 85 dBA averaged over 8 hours, halving the time for every 3 dBA more.',
    why: {
      'Yes — anything under the mic’s rating is safe for the people near it': 'A mic rating is not a hearing limit. A widely used guideline for people is 85 dBA averaged over 8 hours, measured where they listen.',
      'Yes, as long as the mic is closer to the drum than the people are': 'Where the mic sits says nothing about the people’s ears. Measure where the person listens, and keep levels and time down.',
    },
  };
}

export function quickHearing(w: Words): { id: string; covers: PageId; critical: true; prompt: string; options: string[]; correct: string; explain: string; why: Record<string, string> } {
  return {
    id: `${w.p}.q.6`,
    covers: 'setting',
    critical: true,
    prompt: `A spot mic on ${w.the} is rated far above any level in the hall. What does that tell you about a long rehearsal next to it?`,
    options: ['Nothing — that is the mic’s distortion limit, not a hearing limit', 'It is safe while the hall stays below the mic’s rating', 'It is safe as long as the mic is much closer to the drum than you are'],
    correct: 'Nothing — that is the mic’s distortion limit, not a hearing limit',
    explain: 'Max SPL says when the MIC distorts. For people, a widely used guideline is no more than 85 dBA averaged over 8 hours, halving the time for every 3 dBA more — measured where the person listens.',
    why: {
      'It is safe while the hall stays below the mic’s rating': 'A mic rating is not a hearing limit. A widely used guideline for people is 85 dBA averaged over 8 hours.',
      'It is safe as long as the mic is much closer to the drum than you are': 'Where the mic sits says nothing about your ears. Measure where the person listens, and keep levels and time down.',
    },
  };
}

export function polarityKeepsDelay(w: Words): MikingScenario {
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

export function firstNotch(w: Words): MikingScenario {
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

export function louderIsNotBetter(w: Words): MikingScenario {
  return {
    id: `${w.p}.two.4`,
    page: 'twoMic',
    prompt: 'You flip B’s polarity and the drum suddenly sounds bigger; the sum reads 3 dB louder. What do you conclude?',
    options: ['Not yet: match the levels, then compare both states again in mono', 'Inverted is the better setting, so keep it that way for the whole concert', 'Normal polarity was wrong, because it was the quieter one'],
    correct: 'Not yet: match the levels, then compare both states again in mono',
    explain: 'A louder version almost always sounds “better” at first. Compare at matched level, in mono and with the whole ensemble, before you decide.',
    why: {
      'Inverted is the better setting, so keep it that way for the whole concert': 'A louder version almost always sounds better at first. Compare at matched level before deciding.',
      'Normal polarity was wrong, because it was the quieter one': 'Quieter is not wrong. Match levels, then judge which state keeps the body of the drum.',
    },
  };
}

export function moveRemovesDelay(w: Words, id = `${w.p}.mix.3`): MikingScenario {
  return {
    id,
    page: 'practice',
    prompt: `The spot and the ensemble mics sound thin together on ${w.the}. Which change removes the arrival-time difference itself?`,
    options: ['Moving a mic so the two paths are closer to equal', 'Flipping the polarity switch on one of the mics', 'Turning the later mic up until it matches the earlier one'],
    correct: 'Moving a mic so the two paths are closer to equal',
    explain: 'Only the paths set the delay. Polarity moves the notches; level changes their depth; neither removes the delay. (A delay set on the desk is another tool — judged by ear in the whole ensemble.)',
    why: {
      'Flipping the polarity switch on one of the mics': 'Polarity flips the sign; it moves the notches but does not remove the delay.',
      'Turning the later mic up until it matches the earlier one': 'Level changes the depth of the notches, not where they are or the delay behind them.',
    },
  };
}

export function cardioidNull(w: Words, id = `${w.p}.mix.2`): MikingScenario {
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

export function gainCheck(w: Words): MikingScenario {
  return {
    id: `${w.p}.prac.gain`,
    page: 'practice',
    prompt: `Normal playing sits well below the overload light, but ${w.loudest} lights it. What do you do?`,
    options: ['Lower the input gain, or use a pad its manual allows, and re-check', 'Pull the channel fader down until the loud passage sounds clean again', `Ask the ${w.player} to play that passage a little softer`],
    correct: 'Lower the input gain, or use a pad its manual allows, and re-check',
    explain: 'Set input gain with headroom for the strongest stroke in the score, and watch the overload indicator. A lowered fader does not undo clipping at the input; a pad goes where the manual allows it, at the stage that overloads.',
    why: {
      'Pull the channel fader down until the loud passage sounds clean again': 'The overload happens at the input, before the fader. A lower fader only makes the clipped sound quieter.',
      [`Ask the ${w.player} to play that passage a little softer`]: 'The score sets the dynamics. Set the gain for the strongest stroke the player will play — not for a gentler soundcheck.',
    },
  };
}

export function distortionSymptom(w: Words): Symptom {
  return {
    id: `${w.p}.s.dist`,
    observation: 'The loudest strokes distort',
    firstChecks: 'Where it starts — the mic, the preamp or pad, the interface, or a rattle on the stand — then the gain at that stage.',
    options: ['Where it starts — mic, preamp, interface or a rattle — then gain', 'Pull the channel fader down until the loudest hits sound cleaner', 'Cut the low end with EQ so the channel has more headroom'],
    correct: 'Where it starts — mic, preamp, interface or a rattle — then gain',
    explain: 'A lowered fader does not undo earlier clipping, and EQ after an overloaded input cannot restore it. Find the stage that overloads; leave headroom for the score’s loudest stroke.',
    why: {
      'Pull the channel fader down until the loudest hits sound cleaner': 'The fader comes after the preamp; if the preamp already clipped, a lower fader just makes the distortion quieter.',
      'Cut the low end with EQ so the channel has more headroom': 'EQ after the input cannot undo clipping at the input. Find where it starts, and lower the gain there first.',
    },
  };
}

export function monoSymptom(w: Words): Symptom {
  return {
    id: `${w.p}.s.mono`,
    observation: 'The drum turns thin or hollow when the spot and the ensemble mics are combined',
    firstChecks: 'Each channel alone, then the sum in mono at matched levels; positions, levels and both polarity states.',
    options: ['Each mic alone, then the mono sum, levels and both polarity states', 'Turn the spot up until the drum sounds full and solid again in the mix', 'Invert the spot, since a spot is usually the wrong polarity'],
    correct: 'Each mic alone, then the mono sum, levels and both polarity states',
    explain: 'The spot and the ensemble mics hear the drum at different times. Check the sum in mono at matched levels before reaching for processing — and leave the spot down or out if it does not help.',
    why: {
      'Turn the spot up until the drum sounds full and solid again in the mix': 'More level does not fix a cancellation, and a loud spot can pull the drum out of its place in the ensemble.',
      'Invert the spot, since a spot is usually the wrong polarity': 'No mic is “usually wrong”. Compare BOTH polarity states at matched level, in mono.',
    },
  };
}

export function contactSymptom(w: Words): Symptom {
  return {
    id: `${w.p}.s.contact`,
    observation: 'A stand blocks the player, or a stroke could reach the mic',
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

/** The one-spot setup, in order (the lessons' guided practical labs). */
export function setupOrder(w: Words, first: { text: string; early: string }, listen: { text: string; early: string }): OrderTask {
  return {
    id: `${w.p}.prac.order`,
    page: 'practice',
    prompt: 'Tap the steps of adding one spot mic in the order you would do them.',
    steps: [
      first,
      listen,
      { text: 'Choose a mic whose pattern, power, size and mount suit the job', early: 'Choose the mic once you know what is missing and where it could go.' },
      { text: `Have the ${w.player} stop; place the stand; check clearance and the cable path`, early: 'You need a chosen mic before you can place it.' },
      { text: 'Mute the outputs and lower monitoring; then switch phantom if it is needed', early: 'Power comes after the mic is placed and its cable connected — with the outputs muted first.' },
      { text: `Set input gain on the quietest and the loudest passages, with headroom`, early: 'Gain is set once the mic is connected and powered.' },
      { text: 'Blend the spot under the main pickup; check it in mono', early: 'Blend only once the level is set safely — and judge the sum, not the spot alone.' },
    ],
    explain: 'A sensible order. Phantom: mute the outputs and lower monitoring before connecting, disconnecting or switching it, and follow your own equipment’s manual. Gain: set it with headroom for the score’s loudest stroke, watching the overload indicator.',
  };
}

export const POWER_REASON: SetupReason = { id: 'r.power', label: 'This channel gives the mic the power it needs (phantom, or none)', role: 'required', feedback: 'Say how the mic is powered: a condenser needs phantom; a dynamic needs none.' };
export const CLEAR_REASON: SetupReason = { id: 'r.clear', label: 'The mic, stand and cable stay clear of the player’s whole motion', role: 'required', feedback: 'Clearance — of the player’s whole motion, not a still pose — is part of every passing setup.' };
export const BRAND_REASON: SetupReason = { id: 'r.brand', label: 'It is the brand most engineers reach for on this instrument', role: 'wrong', feedback: 'A brand is not part of passing: choose by properties.' };
