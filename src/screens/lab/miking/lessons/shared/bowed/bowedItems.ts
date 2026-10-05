/**
 * THE BOWED FAMILY'S SHARED CHECKS — items that read the same on a violin,
 * a viola, a cello and a double bass, with the instrument's own words
 * dropped in. Each lesson adds its instrument-specific items (lesson.ts).
 *
 * Item-writing rules (LESSON_JOURNEY §5, tested): the correct option is
 * never much longer than the others; wrong options are real misconceptions
 * without "always / any / never / every"; no brand or model; every wrong
 * option has its own explanation; reasoning, not the recall of a number.
 * Starting-points voice (owner ruling 2026-10-04): no sources on screen.
 */
import type { DiagnosticItem, MikingScenario, PageId, SetupReason, Symptom } from '../../../engine/model/types.ts';
import { micRatingCheck } from '../../../engine/model/sharedItems.ts';

export type Words = {
  /** "cello" */
  noun: string;
  /** "cellist" */
  player: string;
  /** "the bow’s sweep and the bow arm" / "the plucking hand" */
  moving: string;
};

export const hearingCheck = (id: string, w: Words): MikingScenario =>
  micRatingCheck({ id, page: 'setting', mic: `${w.noun} mic`, loudest: `the loudest ${w.noun} passage` });

export const hearingDiag = (id: string, w: Words): DiagnosticItem => ({
  id,
  covers: 'setting',
  critical: true,
  prompt: `Your ${w.noun} mic is rated to a very high maximum SPL. What does that tell you about a long, loud soundcheck?`,
  options: ['Nothing — that is the mic’s distortion limit, not a hearing limit', 'It is safe for as long as the stage stays below the mic’s rated level', 'It is safe as long as the mic is nearer the speaker than you'],
  correct: 'Nothing — that is the mic’s distortion limit, not a hearing limit',
  explain: 'Max SPL says when the MIC distorts. For people, a widely used guideline is no more than 85 dBA averaged over 8 hours, halving the time for every 3 dBA more — measured where the person listens.',
  why: {
    'It is safe for as long as the stage stays below the mic’s rated level': 'A mic rating is not a hearing limit. A widely used guideline for people is 85 dBA averaged over 8 hours.',
    'It is safe as long as the mic is nearer the speaker than you': 'Where the mic sits says nothing about your ears. Measure where the person listens, and keep levels and time down.',
  },
});

export const superNull = (id: string, page: PageId, target: string): MikingScenario => ({
  id,
  page,
  prompt: `With a supercardioid, where should the ${target} sit for the most rejection?`,
  options: ['Toward the rear, off to one side of the axis (near 125°)', 'Directly behind the mic, on its rear axis, as far from its front as it gets', 'Beside the mic, square to its front (90°)'],
  correct: 'Toward the rear, off to one side of the axis (near 125°)',
  explain: 'A supercardioid’s deepest rejection is off the rear axis (near 125°); straight behind it has a small rear lobe. Aim by the actual pattern — and a real null is shallower than the drawing.',
  why: {
    'Directly behind the mic, on its rear axis, as far from its front as it gets': 'Only a cardioid rejects most straight behind. A supercardioid has a small rear lobe there.',
    'Beside the mic, square to its front (90°)': 'At 90° the pickup is still fair. The rejection deepens toward the rear, off the axis.',
  },
});

export const polarityDelay = (id: string): MikingScenario => ({
  id,
  page: 'twoMic',
  prompt: 'You flip mic B’s polarity. What happens to the arrival-time difference between the two mics?',
  options: ['Nothing: polarity flips the sign; the delay stays the same', 'It drops to zero, so the two arrivals line up again in the sum', 'It doubles, because the inverted copy arrives later'],
  correct: 'Nothing: polarity flips the sign; the delay stays the same',
  explain: 'Polarity reverses the signal’s sign; it does not remove a delay caused by sound reaching the mics at different times. The notches move; Δt does not.',
  why: {
    'It drops to zero, so the two arrivals line up again in the sum': 'Flipping polarity changes the sign, not when the sound arrives — the mics are still where they were.',
    'It doubles, because the inverted copy arrives later': 'Polarity has no time in it. Only moving a mic changes when the sound arrives.',
  },
});

export const matchedLevels = (id: string): MikingScenario => ({
  id,
  page: 'twoMic',
  prompt: 'With mic B inverted, the pair sounds fuller and reads 2 dB louder. What do you conclude?',
  options: ['Not yet: match the levels, then compare both states in mono', 'Inverted is the right setting for this instrument, so keep it', 'Normal polarity was wrong, because it was quieter'],
  correct: 'Not yet: match the levels, then compare both states in mono',
  explain: 'A louder state sounds “better” at first. Compare at matched level, in mono, across the instrument’s range — and move a mic before trusting a switch.',
  why: {
    'Inverted is the right setting for this instrument, so keep it': 'No setting is right for an instrument: the result depends on where the mics are.',
    'Normal polarity was wrong, because it was quieter': 'Quieter is not wrong. Match levels, then judge which state keeps the body.',
  },
});

export const gainCheck = (id: string, w: Words): MikingScenario => ({
  id,
  page: 'practice',
  prompt: `Quiet passages sit well below the overload light, but the ${w.player}’s loudest passage lights it. What do you do?`,
  options: ['Lower the input gain, or use a pad the manual allows, and re-check', 'Pull the channel fader down until the loudest passage sounds clean again', `Ask the ${w.player} to play the loud passage more softly`],
  correct: 'Lower the input gain, or use a pad the manual allows, and re-check',
  explain: 'Set input gain with headroom for the strongest intended passage and watch the overload indicator. A lowered fader does not undo clipping at the input.',
  why: {
    'Pull the channel fader down until the loudest passage sounds clean again': 'The overload happens at the input, before the fader. A lower fader only makes the clipped sound quieter.',
    [`Ask the ${w.player} to play the loud passage more softly`]: 'Set gain for the strongest passages the player intends to play — not for a gentler soundcheck.',
  },
});

export const removeDelay = (id: string): MikingScenario => ({
  id,
  page: 'practice',
  prompt: 'Two mics on one instrument sound thin together. Which change removes the arrival-time difference itself?',
  options: ['Moving a mic so the two paths are closer to equal', 'Flipping the polarity switch on one of the two microphones', 'Turning the farther mic up until it matches'],
  correct: 'Moving a mic so the two paths are closer to equal',
  explain: 'Only the paths set the delay. Polarity moves the notches; level changes their depth; neither removes the delay.',
  why: {
    'Flipping the polarity switch on one of the two microphones': 'Polarity flips the sign; it moves the notches but does not remove the delay.',
    'Turning the farther mic up until it matches': 'Level changes the depth of the notches, not where they are or the delay behind them.',
  },
});

export const nullOnPaper = (id: string, target: string): MikingScenario => ({
  id,
  page: 'practice',
  prompt: `The ${target} sits about 125° off a supercardioid’s front axis. What can you expect?`,
  options: ['Strong rejection on paper; in reality less, and least in the lows', `Silence from the ${target}, because it sits in the null`, 'More of it than straight behind the mic, which is where it rejects most'],
  correct: 'Strong rejection on paper; in reality less, and least in the lows',
  explain: 'A null is infinitely deep only on paper. Real mics reject far less there, and least at low frequencies — use the null to aim, not to promise silence.',
  why: {
    [`Silence from the ${target}, because it sits in the null`]: 'A null is infinitely deep only on paper. Real mics reject far less.',
    'More of it than straight behind the mic, which is where it rejects most': 'Straight behind, a supercardioid has a small rear lobe; its deepest rejection is off the rear axis.',
  },
});

export const feedbackSymptom = (id: string, w: Words): Symptom => ({
  id,
  observation: 'Feedback, or the stage bleeds into the mic',
  firstChecks: 'Lower the offending level; revise the mic, monitor and instrument geometry and the number of open mics. The body can reflect the monitor into the mic.',
  options: ['Lower the level, then change the geometry and open mics', `Boost the ${w.noun} channel so it covers the ring`, 'Swap to an omni mic, which is less likely to start feeding back'],
  correct: 'Lower the level, then change the geometry and open mics',
  explain: `Feedback is a sound-system condition: reduce the level first, then move the mic or the monitor and close mics you do not need. The ${w.noun}’s body can reflect a monitor into a mic aimed away from it. Never provoke feedback on purpose.`,
  why: {
    [`Boost the ${w.noun} channel so it covers the ring`]: 'More gain feeds the loop. Lower the level first.',
    'Swap to an omni mic, which is less likely to start feeding back': 'An omni rejects nothing: it usually makes feedback more likely, not less.',
  },
});

export const hollowSymptom = (id: string): Symptom => ({
  id,
  observation: 'A mic and a second mic (or the pickup) sound hollow together',
  firstChecks: 'Solo each; sum in mono; rebalance and move a mic; then check polarity or timing.',
  options: ['Solo each, sum in mono, move or rebalance — then polarity', 'Flip one polarity switch and leave it that way', 'Boost the low end on both channels until the body comes back'],
  correct: 'Solo each, sum in mono, move or rebalance — then polarity',
  explain: 'Different arrival times (and a pickup’s own electronics) make some pitches cancel. Hear each alone and in mono, move or rebalance first; a polarity switch cannot align every frequency.',
  why: {
    'Flip one polarity switch and leave it that way': 'Polarity is a check, not a cure: it cannot remove a delay.',
    'Boost the low end on both channels until the body comes back': 'EQ cannot undo a cancellation between paths. Fix the combination first.',
  },
});

export const POWER_REASON: SetupReason = { id: 'r.power', label: 'The channel gives the condenser the phantom power it needs', role: 'required', feedback: 'Say how the mic is powered: these condensers need phantom power (a miniature through its adapter).' };
export const BRAND_REASON = (noun: string): SetupReason => ({ id: 'r.brand', label: `It is the brand most engineers reach for on a ${noun}`, role: 'wrong', feedback: 'A brand is not part of passing: choose by properties.' });
export const LOUD_REASON: SetupReason = { id: 'r.loud', label: 'It will give the loudest sound of any position on the instrument', role: 'wrong', feedback: 'Loudness is not a passing reason — level comes from gain — and no position is “the loudest” on every instrument.' };
export const docReason = (from: string): SetupReason => ({ id: 'r.doc', label: `It is a recommended starting point for this kind of mic, measured from ${from}`, role: 'required', feedback: 'Say why it is a good place to begin, and what it is measured from.' });
export const clearReason = (what: string): SetupReason => ({ id: 'r.clear', label: `The mic, mount and cable stay clear of ${what}`, role: 'required', feedback: 'Clearance is part of every passing setup.' });
