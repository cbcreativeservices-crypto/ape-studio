/**
 * Checks, symptoms and reasons Lab 3's free reeds and the pipe organ share
 * (A10 harmonica, A11 accordion, A12 pipe organ), in their own words — a
 * held NOTE and a PHRASE, never a "stroke". The generic ones that already say
 * the right thing come from the suspended-metal set (shared/metal/
 * metalItems.ts) unchanged: polarityKeepsDelay, cardioidNull,
 * contactSymptom and the setup reasons.
 *
 * Item rules (LESSON_JOURNEY §5, test/_mikingItemRules.ts,
 * test/mikingItemBalance.test.ts): the right option is never much longer
 * than the others, wrong options are real misconceptions with their own
 * "why", no absolute-word giveaways, no brand recall. Starting-points voice;
 * no source names (owner 2026-10-04).
 */
import type { DiagnosticItem, MikingScenario, OrderTask, PageId, Symptom } from '../../../engine/model/types.ts';
import { micRatingCheck } from '../../../engine/model/sharedItems.ts';

export type ReedWords = {
  /** id prefix ("hm", "ac", "org") */
  p: string;
  /** "the harmonica" */
  the: string;
  /** "player" / "organist" */
  player: string;
  /** "the loudest phrase" */
  loudest: string;
};

export function hearingCheck(w: ReedWords, page: PageId = 'setting'): MikingScenario {
  return micRatingCheck({ id: `${w.p}.set.hear`, page, mic: `mic on ${w.the}`, loudest: `${w.loudest} at the mic` });
}

export function quickHearing(w: ReedWords, id = `${w.p}.q.6`): DiagnosticItem {
  return {
    id,
    covers: 'setting',
    critical: true,
    prompt: `The mic on ${w.the} is rated far above any level on stage. What does that tell you about a long, loud soundcheck beside it?`,
    options: ['Nothing — that is the mic’s distortion limit, not a hearing limit', 'It is safe while the stage stays below the mic’s rating', 'It is safe as long as the mic is much nearer the source than you are'],
    correct: 'Nothing — that is the mic’s distortion limit, not a hearing limit',
    explain: 'Max SPL says when the MIC distorts. For people, a widely used guideline is no more than 85 dBA averaged over 8 hours, halving the time for every 3 dBA more — measured where the person listens.',
    why: {
      'It is safe while the stage stays below the mic’s rating': 'A mic rating is not a hearing limit. A widely used guideline for people is 85 dBA averaged over 8 hours.',
      'It is safe as long as the mic is much nearer the source than you are': 'Where the mic sits says nothing about your ears. Measure where the person listens, and keep levels and time down.',
    },
  };
}

export function firstNotch(w: ReedWords): MikingScenario {
  return {
    id: `${w.p}.two.2`,
    page: 'twoMic',
    prompt: 'Two mics hear the same note 1 ms apart. Summed at equal level, same polarity: where is the first notch (simplified model)?',
    options: ['500 Hz, then 1.5 kHz, 2.5 kHz …', '1 kHz, then 2 kHz, 3 kHz, 4 kHz …', '250 Hz, then 750 Hz, 1.25 kHz …'],
    correct: '500 Hz, then 1.5 kHz, 2.5 kHz …',
    explain: 'The first cancellation is where the delay is half a period: f = 1 ÷ (2 × 0.001 s) = 500 Hz, then odd multiples. Inverted, the notches sit at 0, 1 kHz, 2 kHz … instead.',
    why: {
      '1 kHz, then 2 kHz, 3 kHz, 4 kHz …': 'That is the INVERTED set (whole multiples of 1 ÷ Δt). Same polarity cancels where the delay is half a period: 500 Hz.',
      '250 Hz, then 750 Hz, 1.25 kHz …': 'That needs a 2 ms delay. With 1 ms the first notch is at 1 ÷ (2 × 0.001 s) = 500 Hz.',
    },
  };
}

export function louderIsNotBetter(w: ReedWords): MikingScenario {
  return {
    id: `${w.p}.two.4`,
    page: 'twoMic',
    prompt: `You flip B’s polarity and ${w.the} suddenly sounds bigger; the sum reads 3 dB louder. What do you conclude?`,
    options: ['Not yet: match the levels, then compare both states in mono', 'Inverted is better, so keep it that way for the rest of the set', 'Normal polarity was wrong, because it was the quieter one'],
    correct: 'Not yet: match the levels, then compare both states in mono',
    explain: 'A louder version almost always sounds “better” at first. Compare at matched level, in mono, over whole phrases, before you decide.',
    why: {
      'Inverted is better, so keep it that way for the rest of the set': 'A louder version almost always sounds better at first. Compare at matched level before deciding.',
      'Normal polarity was wrong, because it was the quieter one': 'Quieter is not wrong. Match levels, then judge which state keeps the tone natural over the phrase.',
    },
  };
}

export function moveRemovesDelay(w: ReedWords, id = `${w.p}.mix.3`): MikingScenario {
  return {
    id,
    page: 'practice',
    prompt: `Two mics on ${w.the} sound hollow together. Which change removes the arrival-time difference itself?`,
    options: ['Moving a mic so the two paths are closer to equal', 'Flipping the polarity switch on one of the two mics', 'Turning the later mic up until it matches the earlier'],
    correct: 'Moving a mic so the two paths are closer to equal',
    explain: 'Only the paths set the delay. Polarity moves the notches; level changes their depth; neither removes the delay. (A delay set on the desk is another tool — a mix decision, judged by ear.)',
    why: {
      'Flipping the polarity switch on one of the two mics': 'Polarity flips the sign; it moves the notches but does not remove the delay.',
      'Turning the later mic up until it matches the earlier': 'Level changes the depth of the notches, not where they are or the delay behind them.',
    },
  };
}

export function gainCheck(w: ReedWords): MikingScenario {
  return {
    id: `${w.p}.prac.gain`,
    page: 'practice',
    prompt: `Normal playing sits well below the overload light, but ${w.loudest} lights it. What do you do?`,
    options: ['Lower the input gain, or a pad its manual allows, and re-check', 'Pull the channel fader down until that phrase sounds clean again', `Ask the ${w.player} to play that phrase a little softer`],
    correct: 'Lower the input gain, or a pad its manual allows, and re-check',
    explain: 'Set input gain with headroom for the loudest passage the music asks for, and watch the overload indicator. A lowered fader does not undo clipping at the input; a pad goes where the manual allows it, at the stage that overloads.',
    why: {
      'Pull the channel fader down until that phrase sounds clean again': 'The overload happens at the input, before the fader. A lower fader only makes the clipped sound quieter.',
      [`Ask the ${w.player} to play that phrase a little softer`]: 'The music sets the dynamics. Set the gain for the loudest passage the player will play — not for a gentler soundcheck.',
    },
  };
}

export function monoSymptom(w: ReedWords): Symptom {
  return {
    id: `${w.p}.s.mono`,
    observation: 'Two feeds sound hollow or thin together',
    firstChecks: 'Each feed alone, then the sum in mono at matched levels; positions, levels and both polarity states.',
    options: ['Each feed alone, then the mono sum, levels and polarity', 'Turn the second feed up until the sum sounds full again', 'Add a short delay to one feed and leave it there'],
    correct: 'Each feed alone, then the mono sum, levels and polarity',
    explain: 'The two feeds hear the same sound at different times. Solo each, then sum in mono at matched levels; move or rebalance before reaching for processing — and leave a feed out if it does not help.',
    why: {
      'Turn the second feed up until the sum sounds full again': 'More level does not fix a cancellation; it can make the hollow sound louder.',
      'Add a short delay to one feed and leave it there': 'A fixed delay may suit one note or position and not another. Move or rebalance first, and judge by ear in mono.',
    },
  };
}

/** The one-mic setup, in order. */
export function setupOrder(w: ReedWords, first: { text: string; early: string }): OrderTask {
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
      { text: 'Set input gain on the softest and the loudest passages, with headroom', early: 'Gain is set once the mic is connected and powered.' },
      { text: 'Bring it up in the mix; check any second feed in mono', early: 'Blend only once the level is set safely — and judge the sum, not the mic alone.' },
    ],
    explain: 'A sensible order. Phantom: mute the outputs and lower monitoring before connecting, disconnecting or switching it, and follow your own equipment’s manual. Gain: set it with headroom for the loudest passage, watching the overload indicator.',
  };
}
