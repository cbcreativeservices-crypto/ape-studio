/**
 * SMALL-PERCUSSION FAMILY — checks, symptoms and tasks the Lab 2 hand-
 * percussion lessons share (cajón, shakers, eggs, maracas, the headless
 * tambourine, cowbell, claves, woodblock, güiro). Each lesson's own text says
 * the same thing about these shared ideas — a mic's maximum SPL is not a
 * hearing limit, polarity is not delay, a slow meter misses brief peaks,
 * gain is set on the loudest real stroke — so they are written once, with the
 * instrument's words passed in. Every lesson still writes its own
 * instrument-specific checks.
 *
 * Item rules (LESSON_JOURNEY §5, pinned by test/mikingSmallPerc.test.ts): the
 * right option is never much longer than the others, wrong options are real
 * misconceptions with their own "why", no absolute-word giveaways, no brand
 * recall. Starting-points voice; no source names (owner 2026-10-04).
 */
import type { DiagnosticItem, MikingScenario, OrderTask, SourcePageId, SetupReason, Symptom } from '../../../engine/model/types.ts';
import { micRatingCheck } from '../../../engine/model/sharedItems.ts';

export type SpWords = {
  /** id prefix ("shk", "egg", "mar", "tmb", "bell", "clv", "wb", "gui", "caj") */
  p: string;
  /** "the shaker" */
  the: string;
  /** "a shaker" */
  a: string;
  /** "shaker" (bare, for "the … spot") */
  noun: string;
  /** "player" / "percussionist" */
  player: string;
  /** "the loudest accent" */
  loudest: string;
};

export function hearingCheck(w: SpWords, page: SourcePageId = 'setting', id = `${w.p}.set.hear`): MikingScenario {
  // The shared max-SPL check (engine/model/sharedItems.ts): what the rating DOES say.
  return micRatingCheck({ id, page, mic: `mic near ${w.the}`, loudest: w.loudest });
}

/** The QUICK CHECK's critical (safety) item. */
export function quickHearing(w: SpWords): DiagnosticItem {
  return {
    id: `${w.p}.q.6`,
    covers: 'setting',
    critical: true,
    prompt: `A mic on ${w.the} is rated far above any level in the room. What does that tell you about a long soundcheck next to it?`,
    options: ['Nothing — that is the mic’s distortion limit, not a hearing limit', 'It is safe while the room stays below the mic’s rating', `It is safe as long as the mic is much closer to ${w.the} than you are`],
    correct: 'Nothing — that is the mic’s distortion limit, not a hearing limit',
    explain: 'Max SPL says when the MIC distorts. For people, a widely used guideline is no more than 85 dBA averaged over 8 hours, halving the time for every 3 dBA more — measured where the person listens.',
    why: {
      'It is safe while the room stays below the mic’s rating': 'A mic rating is not a hearing limit. A widely used guideline for people is 85 dBA averaged over 8 hours.',
      [`It is safe as long as the mic is much closer to ${w.the} than you are`]: 'Where the mic sits says nothing about your ears. Measure where the person listens, and keep levels and time down.',
    },
  };
}

/** Peaks: a slow meter reads low while brief transients overload the input. */
export function slowMeter(w: SpWords, page: SourcePageId = 'microphone', id = `${w.p}.mic.peak`): MikingScenario {
  return {
    id,
    page,
    prompt: `The channel meter looks modest, but ${w.the}’s accents distort. Why can that happen?`,
    options: ['A slow meter can miss the brief peaks that overload the input', 'The mic distorts because the level shown on the meter is too low', 'A modest reading means the mic is faulty somewhere inside'],
    correct: 'A slow meter can miss the brief peaks that overload the input',
    explain: 'Hand percussion makes very brief peaks; a slow, averaging meter can read low while they overload the input. Watch a PEAK meter and set gain from the loudest real accent.',
    why: {
      'The mic distorts because the level shown on the meter is too low': 'A low level does not cause distortion; the brief peaks the meter misses do.',
      'A modest reading means the mic is faulty somewhere inside': 'Nothing is broken: the meter is too slow to show the peaks.',
    },
  };
}

export function noPhantom(w: SpWords, page: SourcePageId = 'microphone', id = `${w.p}.mic.power`): MikingScenario {
  return {
    id,
    page,
    prompt: 'The channel you are given has no phantom power. Which of this page’s mics can you use?',
    options: ['The small dynamic: it needs no power to work', 'The small condenser, if it sits a little farther back', 'Either one, as long as the channel gain is turned up'],
    correct: 'The small dynamic: it needs no power to work',
    explain: 'Dynamic mics need no power. The small condenser needs phantom power wherever it is placed.',
    why: {
      'The small condenser, if it sits a little farther back': 'Distance does not change what a condenser needs: it still needs phantom power.',
      'Either one, as long as the channel gain is turned up': 'Gain cannot power a condenser. It needs phantom power from the desk.',
    },
  };
}

export function polarityKeepsDelay(w: SpWords): MikingScenario {
  return {
    id: `${w.p}.two.1`,
    page: 'twoMic',
    prompt: 'You flip the polarity of mic B. What happens to the arrival-time difference between the two mics?',
    options: ['Nothing: polarity flips the sign; the delay stays the same', 'It drops to zero, so the two arrivals now line up in time again', 'Cut in half: the flipped copy cancels half of it'],
    correct: 'Nothing: polarity flips the sign; the delay stays the same',
    explain: 'Polarity inversion reverses the signal’s sign. It does not remove a delay caused by sound reaching the mics at different times: the notches move; Δt does not.',
    why: {
      'It drops to zero, so the two arrivals now line up in time again': 'Flipping polarity changes the sign, not when the sound arrives — the mics are still the same distances from the source.',
      'Cut in half: the flipped copy cancels half of it': 'Polarity has no time in it. Only moving a mic changes when the sound arrives.',
    },
  };
}

export function firstNotch(w: SpWords): MikingScenario {
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

export function louderIsNotBetter(w: SpWords): MikingScenario {
  return {
    id: `${w.p}.two.4`,
    page: 'twoMic',
    prompt: `You flip B’s polarity and ${w.the} suddenly sounds fuller; the sum reads 3 dB louder. What do you conclude?`,
    options: ['Not yet: match the levels, then compare both states again in mono', 'Inverted is the better setting, so keep it that way for the whole session', 'Normal polarity was wrong, because it was the quieter of the two'],
    correct: 'Not yet: match the levels, then compare both states again in mono',
    explain: 'A louder version almost always sounds “better” at first. Compare at matched level, in mono and with the whole arrangement, before you decide.',
    why: {
      'Inverted is the better setting, so keep it that way for the whole session': 'A louder version almost always sounds better at first. Compare at matched level before deciding.',
      'Normal polarity was wrong, because it was the quieter of the two': 'Quieter is not wrong. Match levels, then judge which state keeps the body of the sound.',
    },
  };
}

export function moveRemovesDelay(w: SpWords, id = `${w.p}.mix.3`): MikingScenario {
  return {
    id,
    page: 'practice',
    prompt: `The ${w.noun} spot and the main mics sound thin together. Which change removes the arrival-time difference itself?`,
    options: ['Moving a mic so the two paths are closer to equal', 'Flipping the polarity switch on one of the mics', 'Turning the later mic up until it matches the earlier one'],
    correct: 'Moving a mic so the two paths are closer to equal',
    explain: 'Only the paths set the delay. Polarity moves the notches; level changes their depth; neither removes the delay — and a moving instrument changes the delay with every stroke.',
    why: {
      'Flipping the polarity switch on one of the mics': 'Polarity flips the sign; it moves the notches but does not remove the delay.',
      'Turning the later mic up until it matches the earlier one': 'Level changes the depth of the notches, not where they are or the delay behind them.',
    },
  };
}

export function cardioidNull(w: SpWords, id = `${w.p}.mix.2`): MikingScenario {
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

export function gainCheck(w: SpWords): MikingScenario {
  return {
    id: `${w.p}.prac.gain`,
    page: 'practice',
    prompt: `Normal playing sits well below the overload light, but ${w.loudest} lights it. What do you do?`,
    options: ['Lower the input gain, or use a pad its manual allows, and re-check', 'Pull the channel fader down until the loud passage sounds clean again', `Ask the ${w.player} to play that passage a little softer`],
    correct: 'Lower the input gain, or use a pad its manual allows, and re-check',
    explain: 'Set input gain with headroom for the strongest real stroke, watching a peak meter. A lowered fader does not undo clipping at the input; a pad goes where the manual allows it, at the stage that overloads.',
    why: {
      'Pull the channel fader down until the loud passage sounds clean again': 'The overload happens at the input, before the fader. A lower fader only makes the clipped sound quieter.',
      [`Ask the ${w.player} to play that passage a little softer`]: 'The music sets the dynamics. Set the gain for the strongest stroke the player will play — not for a gentler soundcheck.',
    },
  };
}

export function monoSymptom(w: SpWords): Symptom {
  return {
    id: `${w.p}.s.mono`,
    observation: `${w.the[0].toUpperCase()}${w.the.slice(1)} turns thin or hollow when the spot and the main mics are combined`,
    firstChecks: 'Each channel alone, then the sum in mono at matched levels; positions, levels and both polarity states.',
    options: ['Each mic alone, then the mono sum, levels and both polarity states', 'Turn the spot up until the instrument sounds full and solid again in the mix', 'Invert the spot, since a spot is usually the wrong polarity'],
    correct: 'Each mic alone, then the mono sum, levels and both polarity states',
    explain: 'The spot and the main mics hear the instrument at different times. Check the sum in mono at matched levels before reaching for processing — and leave the spot down or out if it does not help.',
    why: {
      'Turn the spot up until the instrument sounds full and solid again in the mix': 'More level does not fix a cancellation, and a loud spot can pull the instrument out of its place in the mix.',
      'Invert the spot, since a spot is usually the wrong polarity': 'No mic is “usually wrong”. Compare BOTH polarity states at matched level, in mono.',
    },
  };
}

export function contactSymptom(w: SpWords): Symptom {
  return {
    id: `${w.p}.s.contact`,
    observation: `A stand is in the ${w.player}’s way, or a stroke could reach the mic`,
    firstChecks: `Stop the ${w.player}, mute the channel, move the stand or leave that mic out; repeat the clearance check with the whole passage.`,
    options: ['Stop, mute, move or omit the mic; recheck with the player', 'Carry on carefully, and move the stand at the next break in the song', `Ask the ${w.player} to play around the mic for this song`],
    correct: 'Stop, mute, move or omit the mic; recheck with the player',
    explain: 'Clearance comes first: the player stops before anything moves, and the whole passage — not a still pose — sets the clearance. A mic that cannot go in safely is left out.',
    why: {
      'Carry on carefully, and move the stand at the next break in the song': 'Clearance comes first: stop before anything moves, not at the next break.',
      [`Ask the ${w.player} to play around the mic for this song`]: 'The music sets the player’s motion. Move the mic, or leave it out — never ask the player to change their technique for it.',
    },
  };
}

export function feedbackSymptom(w: SpWords): Symptom {
  return {
    id: `${w.p}.s.feedback`,
    observation: `Feedback starts before ${w.the} is loud enough in the mix`,
    firstChecks: 'Where the wedges and the PA sit against the mic’s real pattern, the stage level, and how many mics are open — before any more gain.',
    options: ['The monitors against the mic’s pattern, stage level, open mics', 'Turn the gain up a little more and hope it settles once the band plays', 'Swap to an omni so the instrument is heard from all sides'],
    correct: 'The monitors against the mic’s pattern, stage level, open mics',
    explain: 'More gain only brings the ring sooner. Aim the pattern’s rejection at the loudest monitor, lower the spill, close mics that are not helping — with the system operator — and never create feedback deliberately.',
    why: {
      'Turn the gain up a little more and hope it settles once the band plays': 'More gain brings feedback sooner. Fix the geometry and the spill first.',
      'Swap to an omni so the instrument is heard from all sides': 'An omni hears the monitors from every side too: on a loud stage it usually feeds back sooner.',
    },
  };
}

/** The one-spot setup, in order. */
export function setupOrder(w: SpWords, first: { text: string; early: string }, listen: { text: string; early: string }): OrderTask {
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
      { text: 'Set input gain on the loudest and the quietest passages, on a peak meter', early: 'Gain is set once the mic is connected and powered.' },
      { text: 'Bring it up with the other mics; check the sum in mono', early: 'Blend only once the level is set safely — and judge the sum, not the spot alone.' },
    ],
    explain: 'A sensible order. Phantom: mute the outputs and lower monitoring before connecting, disconnecting or switching it, and follow your own equipment’s manual. Gain: set it with headroom for the loudest real accent, on a peak meter.',
  };
}

export const POWER_REASON: SetupReason = { id: 'r.power', label: 'This channel gives the mic the power it needs (phantom, or none)', role: 'required', feedback: 'Say how the mic is powered: a condenser needs phantom; a dynamic needs none.' };
export const CLEAR_REASON: SetupReason = { id: 'r.clear', label: 'The mic, stand and cable stay clear of the player’s whole motion', role: 'required', feedback: 'Clearance — of the player’s whole motion, not a still pose — is part of every passing setup.' };
export const BRAND_REASON: SetupReason = { id: 'r.brand', label: 'It is the brand most engineers reach for on this instrument', role: 'wrong', feedback: 'A brand is not part of passing: choose by properties.' };
export const TECH_REASON: SetupReason = { id: 'r.tech', label: 'The player can change their grip or stroke to suit the mic', role: 'wrong', feedback: 'The player’s technique is never changed for a mic.' };
export const PEAK_REASON: SetupReason = { id: 'r.peak', label: 'Gain is set on a peak meter, from the loudest and the quietest playing', role: 'optional', feedback: 'A fair reason — and good practice for brief percussion peaks.' };

/** The family's words on the pages the kit drums share (copy.words). */
export function spWords(o: { instrument: string; player?: string; reference: string; axis: string; facing: string }) {
  const player = o.player ?? 'player';
  return {
    instrument: o.instrument,
    player,
    reference: o.reference,
    inside: `inside the ${o.instrument}’s motion`,
    outside: 'clear of the motion',
    axis: o.axis,
    facing: o.facing,
    shield: `${o.instrument} in path`,
    mountStand: 'Mount: a stand outside the player’s whole motion, cable away from the feet',
    mountClip: `Mount: only hardware made for the ${o.instrument}, with the player’s agreement`,
    sheet: `For a real ${o.instrument}, with the ${player}’s agreement and the ${player} stopped while anything moves. Write tendencies in words — what you heard, not a promised result.`,
    viewSide: 'Side view,',
    viewTop: 'Top view',
  };
}
