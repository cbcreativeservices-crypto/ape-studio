/**
 * THE LOW / COILED BRASS FAMILY'S SHARED CHECKS — items that read the same
 * on a horn, a tuba and a euphonium, with the instrument's own words dropped
 * in. Each lesson adds its instrument-specific items (lesson.ts).
 *
 * Item-writing rules (LESSON_JOURNEY §5; test/mikingItemBalance.test.ts):
 * the correct option is at most 1.25 × the mean length of the others; wrong
 * options are real misconceptions without "always / any / never / every";
 * no brand or model; every wrong option has its own explanation; reasoning,
 * not the recall of a number. Starting-points voice: no sources on screen.
 */
import type { DiagnosticItem, MikingScenario, SourcePageId, SetupReason, Symptom } from '../../../engine/model/types.ts';
import { micRatingCheck } from '../../../engine/model/sharedItems.ts';

export type Words = {
  /** "horn" */
  noun: string;
  /** "horn player" */
  player: string;
  /** "the bell’s rise and the right hand" */
  moving: string;
};

export const hearingCheck = (id: string, w: Words): MikingScenario =>
  micRatingCheck({ id, page: 'setting', mic: `${w.noun} mic`, loudest: `the loudest ${w.noun} accent` });

export const hearingDiag = (id: string, w: Words): DiagnosticItem => ({
  id,
  covers: 'setting',
  critical: true,
  prompt: `Your ${w.noun} mic is rated to a very high maximum SPL. What does that tell you about a long, loud rehearsal?`,
  options: ['Nothing about ears — it is only where the mic itself distorts', 'It is safe for a while, as long as the stage stays below that rating', 'It is safe as long as you stand farther away than the mic does'],
  correct: 'Nothing about ears — it is only where the mic itself distorts',
  explain: 'Max SPL says when the MIC distorts. For people, a widely used guideline is no more than 85 dBA averaged over 8 hours, halving the time for every 3 dBA more — measured where the person listens.',
  why: {
    'It is safe for a while, as long as the stage stays below that rating': 'A mic rating is not a hearing limit. A widely used guideline for people is 85 dBA averaged over 8 hours.',
    'It is safe as long as you stand farther away than the mic does': 'Where the mic sits says nothing about your ears. Measure where the person listens, and keep levels and time down.',
  },
});

export const superNull = (id: string, page: SourcePageId, target: string): MikingScenario => ({
  id,
  page,
  prompt: `With a supercardioid, where should the ${target} sit for the most rejection?`,
  options: ['Toward the rear, off to one side of the axis (near 125°)', 'Straight behind the mic, on its rear axis, 180° from its front', 'Beside the mic, square to its front axis, 90° to one side'],
  correct: 'Toward the rear, off to one side of the axis (near 125°)',
  explain: 'A supercardioid’s deepest rejection is off the rear axis (near 125°); straight behind it has a small rear lobe. Aim by the actual pattern — and a real null is shallower than the drawing.',
  why: {
    'Straight behind the mic, on its rear axis, 180° from its front': 'Only a cardioid rejects most straight behind. A supercardioid has a small rear lobe there.',
    'Beside the mic, square to its front axis, 90° to one side': 'At 90° the pickup is still fair. The rejection deepens toward the rear, off the axis.',
  },
});

export const polarityDelay = (id: string): MikingScenario => ({
  id,
  page: 'twoMic',
  prompt: 'You flip mic B’s polarity. What happens to the arrival-time difference between the two mics?',
  options: ['Nothing: polarity flips the sign; the delay stays', 'It drops to zero, so the two arrivals line up', 'Cut in half: the flipped copy cancels half of it'],
  correct: 'Nothing: polarity flips the sign; the delay stays',
  explain: 'Polarity reverses the signal’s sign; it does not remove a delay caused by sound reaching the mics at different times. The notches move; Δt does not.',
  why: {
    'It drops to zero, so the two arrivals line up': 'Flipping polarity changes the sign, not when the sound arrives — the mics are still where they were.',
    'Cut in half: the flipped copy cancels half of it': 'Polarity has no time in it. Only moving a mic changes when the sound arrives.',
  },
});

export const matchedLevels = (id: string, noun: string): MikingScenario => ({
  id,
  page: 'twoMic',
  prompt: 'With mic B inverted, the pair sounds fuller — and reads 2 dB louder. Is that enough to keep it?',
  options: ['Not yet: match the levels, then compare in mono', `Yes: inverted is the right setting for a ${noun}`, 'Yes: the quieter, normal state was the wrong one'],
  correct: 'Not yet: match the levels, then compare in mono',
  explain: 'A louder state sounds “better” at first. Compare at matched level, in mono, across the instrument’s range — and move a mic before trusting a switch.',
  why: {
    [`Yes: inverted is the right setting for a ${noun}`]: 'No setting is right for an instrument: the result depends on where the mics are.',
    'Yes: the quieter, normal state was the wrong one': 'Quieter is not wrong. Match levels, then judge which state keeps the body.',
  },
});

export const gainCheck = (id: string, w: Words): MikingScenario => ({
  id,
  page: 'practice',
  prompt: `Soft passages sit well below the overload light, but the ${w.player}’s strongest accent lights it. What do you do?`,
  options: ['Lower the input gain (or use a pad the manual allows), then re-check', 'Pull the channel fader down until the accent sounds clean again on the meter', `Ask the ${w.player} to play that accent more softly for the show`],
  correct: 'Lower the input gain (or use a pad the manual allows), then re-check',
  explain: 'Set input gain with headroom for the strongest real accent and watch the overload indicator — at the mic, a wireless pack and the preamp. A lowered fader does not undo clipping at the input.',
  why: {
    'Pull the channel fader down until the accent sounds clean again on the meter': 'The overload happens at the input, before the fader. A lower fader only makes the clipped sound quieter.',
    [`Ask the ${w.player} to play that accent more softly for the show`]: 'Set gain for the strongest passages the player intends to play — not for a gentler soundcheck.',
  },
});

export const removeDelay = (id: string): MikingScenario => ({
  id,
  page: 'practice',
  prompt: 'Two mics on one instrument sound thin together. Which change removes the arrival-time difference itself?',
  options: ['Moving a mic so the two paths are closer to equal', 'Flipping the polarity switch on one of the two mics', 'Turning the farther mic up until the two match'],
  correct: 'Moving a mic so the two paths are closer to equal',
  explain: 'Only the paths set the delay. Polarity moves the notches; level changes their depth; neither removes the delay.',
  why: {
    'Flipping the polarity switch on one of the two mics': 'Polarity flips the sign; it moves the notches but does not remove the delay.',
    'Turning the farther mic up until the two match': 'Level changes the depth of the notches, not where they are or the delay behind them.',
  },
});

export const nullOnPaper = (id: string, target: string): MikingScenario => ({
  id,
  page: 'practice',
  prompt: `The ${target} sits about 125° off a supercardioid’s front axis. What can you expect?`,
  options: ['Strong rejection on paper; less in reality, often least in the lows', `Silence from the ${target}, because it sits right in the null`, 'More of it than straight behind, where the rejection is deepest'],
  correct: 'Strong rejection on paper; less in reality, often least in the lows',
  explain: 'A null is infinitely deep only on paper. Real mics reject far less there, and often least at low frequencies — use the null to aim, not to promise silence.',
  why: {
    [`Silence from the ${target}, because it sits right in the null`]: 'A null is infinitely deep only on paper. Real mics reject far less.',
    'More of it than straight behind, where the rejection is deepest': 'Straight behind, a supercardioid has a small rear lobe; its deepest rejection is off the rear axis.',
  },
});

export const feedbackFirst = (id: string, noun: string): MikingScenario => ({
  id,
  page: 'context',
  prompt: `Feedback starts to ring on the ${noun} mic. What is the first move?`,
  options: ['Lower the level, then change the mic, monitor and open mics', `Boost the ${noun} channel so the note covers up the ringing tone`, 'Ask the player to play louder so the mic needs less gain'],
  correct: 'Lower the level, then change the mic, monitor and open mics',
  explain: 'Feedback is a sound-system condition: reduce the level at once, then revise the geometry — the mic, the wedge, the open mics. Never provoke it on purpose.',
  why: {
    [`Boost the ${noun} channel so the note covers up the ringing tone`]: 'More gain feeds the loop. Lower the level first.',
    'Ask the player to play louder so the mic needs less gain': 'Feedback is the system’s to fix, not the player’s to cover.',
  },
});

export const distortSymptom = (id: string): Symptom => ({
  id,
  observation: 'Strong notes smear or crackle',
  firstChecks: 'Solo the stages: the mic’s own electronics, a wireless pack, the preamp. Lower the input gain or use a pad the manual allows, and check the mic’s maximum level at that distance.',
  options: ['Check each stage — mic, pack, preamp — then gain or pad', 'Turn the channel fader down until the smear and crackle go away', 'Add a compressor so the loudest notes come down'],
  correct: 'Check each stage — mic, pack, preamp — then gain or pad',
  explain: 'Brass accents can overload the mic’s electronics or a wireless pack even while the desk meter looks safe. Find the stage that clips; a fader or a compressor after it cannot undo it.',
  why: {
    'Turn the channel fader down until the smear and crackle go away': 'The fader comes after the overload: the clipped sound only gets quieter.',
    'Add a compressor so the loudest notes come down': 'A compressor works on a signal that has already clipped. Fix the stage that overloads.',
  },
});

export const hollowSymptom = (id: string): Symptom => ({
  id,
  observation: 'A spot and the main mic sound hollow together',
  firstChecks: 'Solo each; sum in mono; rebalance and move a mic; then check polarity or timing.',
  options: ['Solo each, sum in mono, move or rebalance — then polarity', 'Flip one polarity switch and leave it that way', 'Boost the low end on both channels until the sound fills out again'],
  correct: 'Solo each, sum in mono, move or rebalance — then polarity',
  explain: 'Different arrival times — and the room’s reflections — make some pitches cancel. Hear each alone and in mono, move or rebalance first; a polarity switch cannot align every frequency.',
  why: {
    'Flip one polarity switch and leave it that way': 'Polarity is a check, not a cure: it cannot remove a delay.',
    'Boost the low end on both channels until the sound fills out again': 'EQ cannot undo a cancellation between paths. Fix the combination first.',
  },
});

export const POWER_REASON: SetupReason = { id: 'r.power', label: 'The mic gets the power it needs — phantom for the condensers, the manual’s rule for a ribbon', role: 'required', feedback: 'Say how the mic is powered: a condenser needs phantom power; a ribbon follows its own manual.' };
export const BRAND_REASON = (noun: string): SetupReason => ({ id: 'r.brand', label: `It is the brand most engineers reach for on a ${noun}`, role: 'wrong', feedback: 'A brand is not part of passing: choose by properties.' });
export const LOUD_REASON: SetupReason = { id: 'r.loud', label: 'It is the loudest position, right on the bell’s axis', role: 'wrong', feedback: 'Loudness is not a passing reason — level comes from gain — and on axis is the brightest, hardest view, not the best one.' };
export const docReason = (from: string): SetupReason => ({ id: 'r.doc', label: `It is a suggested starting point for this kind of mic, measured from ${from}`, role: 'required', feedback: 'Say why it is a good place to begin, and what it is measured from.' });
export const clearReason = (what: string): SetupReason => ({ id: 'r.clear', label: `The mic, mount and cable stay clear of ${what}`, role: 'required', feedback: 'Clearance is part of every passing setup.' });
