/**
 * Lab 5 group 2 (voices in groups: E02, E04, E05, E06) — the shared CHECKS,
 * each built per lesson with its own id prefix (`p`) and page, so the same
 * idea is asked in the lesson's own context. The research rulings they carry
 * (BATCH5_RESEARCH_SUMMARY.md §2, lead_vocal/SOURCES.md §0):
 *
 *   • 3:1 has ONE definition: the mics at least three times as far from
 *     EACH OTHER as each is from its own singer (E02 L30 rewritten);
 *   • the no-provocation rule: monitors up only to the agreed performance
 *     level; at any ring, lower that send at once and fix the geometry —
 *     never raise level to find the feedback point (E04 L111 rewritten);
 *   • choir and group mics never go into the singers' own monitor mix;
 *   • every doubling of open mics costs about 3 dB of gain before feedback.
 *
 * Item-writing rules (LESSON_JOURNEY §5): three options of like length, real
 * misconceptions, a why for every wrong option, no absolute words in a
 * distractor. Learner words: the starting-points voice, no source names.
 */
import type { DiagnosticItem, MikingScenario, SetupReason, SourcePageId, Symptom } from '../../../engine/model/types.ts';

/** 3:1 — mic to mic, against the larger mic-to-singer distance. `r` in words ("30 cm (1 ft)"), `d` three times it. */
export const threeToOne = (p: string, page: SourcePageId, r = '30 cm (1 ft)', d = '90 cm (3 ft)'): MikingScenario => ({
  id: `${p}.31`,
  page,
  prompt: `Each singer is about ${r} from their own mic. As a starting guideline, how far apart do the two mics go?`,
  options: [`At least ${d} from each other`, `At least ${d} from each other singer`, 'Close together, so the voices match'],
  correct: `At least ${d} from each other`,
  explain: `The 3:1 guideline is mic to mic: at least three times each mic’s distance to its own singer — here ${d}. A voice then reaches the neighbouring mic much quieter and later, so the comb in the mix is shallow. A starting point; listen in mono and adjust.`,
  why: {
    [`At least ${d} from each other singer`]: 'The rule is measured between the MICS, not from a mic to the next singer — the two are not the same distance.',
    'Close together, so the voices match': 'Close mics hear each voice twice at nearly the same level, a little apart in time: the comb is deepest then.',
  },
});

/** Why 3:1 helps: the second arrival is quieter, so the comb is shallow. */
export const threeToOneWhy = (p: string, page: SourcePageId): MikingScenario => ({
  id: `${p}.31why`,
  page,
  prompt: 'Two open mics both hear one singer. What does keeping them 3:1 apart change?',
  options: ['The far mic hears that voice much quieter', 'The two arrivals then line up exactly in time', 'The far mic stops hearing that voice'],
  correct: 'The far mic hears that voice much quieter',
  explain: 'Farther away, the neighbouring mic hears the voice much quieter by distance alone, and later. Summed, a quiet late copy makes only shallow notches. It does not remove the copy or line it up.',
  why: {
    'The two arrivals then line up exactly in time': 'Spacing changes how late and how quiet the second copy is; it never makes the arrivals coincide.',
    'The far mic stops hearing that voice': 'It still hears it — just quieter. That is why mono and mute checks still matter.',
  },
});

/** No provocation: monitors up only to the agreed level; at a ring, down at once. */
export const noProvoke = (p: string, page: SourcePageId): MikingScenario => ({
  id: `${p}.ring`,
  page,
  prompt: 'You bring the singers’ monitors up for the loudest song and hear the first ring. What next?',
  options: ['Lower that send at once, then fix the placement', 'Push a little more to find the exact feedback point', 'Leave it, since the audience will cover it'],
  correct: 'Lower that send at once, then fix the placement',
  explain: 'Bring monitors up in small steps only to the agreed performance level. At any ring, lower that send at once, then correct the mic’s aim, the monitor’s angle or the pattern before going on. Never raise the level to find where it feeds back.',
  why: {
    'Push a little more to find the exact feedback point': 'Hunting the feedback point risks the singers’ hearing and the speakers; the agreed level is the target, never the edge.',
    'Leave it, since the audience will cover it': 'A ring grows with the loudest notes; it is lowered at once, not left for later.',
  },
});

/** Group or choir mics stay out of the singers' own monitor mix. */
export const ownMonitor = (p: string, page: SourcePageId, who = 'choir'): MikingScenario => ({
  id: `${p}.mon`,
  page,
  prompt: `The ${who} asks to hear more of themselves in their monitor. What do you send?`,
  options: ['A little piano or band, not their own mics', 'Their own group mics, turned up loud', 'All of the group mics, plus a little of the room'],
  correct: 'A little piano or band, not their own mics',
  explain: `Sending ${who} mics back into the ${who}’s own monitor is a sure way to feedback: the monitor faces the very mics that hear it. Keep monitors low and give them what they need to stay in time and in tune — the piano, the band.`,
  why: {
    'Their own group mics, turned up loud': 'The monitor would then play straight into the mics feeding it — the loop that rings.',
    'All of the group mics, plus a little of the room': 'More open mics in the monitor makes the loop worse, and the room adds nothing they need.',
  },
});

/** Fewer open mics: each doubling costs about 3 dB of gain before feedback. */
export const fewerMics = (p: string, page: SourcePageId): MikingScenario => ({
  id: `${p}.nom`,
  page,
  prompt: 'You go from two open group mics to four. What happens to your margin before feedback?',
  options: ['It drops, about 3 dB for the doubling', 'It rises, since each mic is quieter', 'It stays, since the mics are the same'],
  correct: 'It drops, about 3 dB for the doubling',
  explain: 'Every doubling of the open mics costs about 3 dB of gain before feedback. Use the fewest open mics that cover the group, and close the ones not in use.',
  why: {
    'It rises, since each mic is quieter': 'Each mic also hears the loudspeakers; more of them add up and bring feedback closer.',
    'It stays, since the mics are the same': 'Identical mics still add their pickup of the PA: the margin shrinks as they are added.',
  },
});

/** A shared mic: the singers balance by stepping in and out. */
export const stepBack = (p: string, page: SourcePageId): MikingScenario => ({
  id: `${p}.step`,
  page,
  prompt: 'Three singers share one mic. One voice is much louder in the chorus. What is a fair first move?',
  options: ['That singer steps back a little', 'Turn the shared mic toward the others', 'Add a second mic for the louder voice'],
  correct: 'That singer steps back a little',
  explain: 'At a shared mic the singers mix themselves: the loudest steps back, a quiet line steps in. Rehearse the moves with the real song and mark the floor.',
  why: {
    'Turn the shared mic toward the others': 'Turning it changes everyone’s tone and puts someone off the front; the distance does the balancing.',
    'Add a second mic for the louder voice': 'A second open mic on the same group adds spill and a comb; the shared mic works by distance.',
  },
});

export const hearingCheck = (p: string, page: SourcePageId, loud: string): MikingScenario => ({
  id: `${p}.hear`,
  page,
  prompt: `You monitor ${loud} on headphones for a long session. What protects your hearing?`,
  options: ['Sensible levels and short breaks', 'The highest level rating of the mics', 'Turning up to hear the detail'],
  correct: 'Sensible levels and short breaks',
  explain: 'A widely used guideline is no more than 85 dBA averaged over 8 hours, halving the time for every 3 dBA more — a limit for people where they listen. Keep monitoring sensible and take breaks.',
  why: {
    'The highest level rating of the mics': 'That is about the microphone, not your ears.',
    'Turning up to hear the detail': 'Louder raises your exposure; detail comes from placement, not level.',
  },
});

/** Nothing hangs over the singers' heads without the venue's rigger. */
export const overHeads = (p: string, page: SourcePageId, who = 'the singers'): MikingScenario => ({
  id: `${p}.hang`,
  page,
  prompt: `A hanging mic would save a stand. Where may it hang?`,
  options: ['In front of the mouths, put up by the venue', `Straight over ${who}, tied on by you`, 'From a lighting bar above them, on its own cable'],
  correct: 'In front of the mouths, put up by the venue',
  explain: `Hang it a little in front of the singers’ mouths, aimed at the back row — not over their heads — and only with the venue’s approved rigging and crew. Signal cable is not a suspension.`,
  why: {
    [`Straight over ${who}, tied on by you`]: 'Never over the heads, and never your own tie: rigging is the venue’s qualified crew’s job.',
    'From a lighting bar above them, on its own cable': 'Signal cable is not suspension hardware, and a lighting bar is the venue’s to rig.',
  },
});

export const hangDiag = (p: string, who = 'the singers'): DiagnosticItem => ({
  id: `${p}.q.hang`,
  covers: 'setups',
  critical: true,
  prompt: 'The best place for a choir mic needs it hung above the stage. What do you do?',
  options: ['Ask the venue: its crew, its rated plan', `Hang it over ${who} on its own cable`, 'Tie it to a lighting bar yourself'],
  correct: 'Ask the venue: its crew, its rated plan',
  explain: 'Anything hung or attached to the building is the venue’s: an approved rigging plan, rated hardware and qualified crew — and never over the singers’ heads. Otherwise choose a safe floor stand.',
  why: {
    [`Hang it over ${who} on its own cable`]: 'Signal cable is not suspension, and nothing hangs over the singers’ heads.',
    'Tie it to a lighting bar yourself': 'An attachment to the venue’s structure is never yours to make.',
  },
});

/** A symptom every group lesson shares: feedback when the group sings. */
export const feedbackSymptom = (id: string): Symptom => ({
  id,
  observation: 'Feedback begins on a sustained vowel',
  firstChecks: 'Too many open mics, monitor spill, or a monitor out of the null? Lower the send at once, then close unused mics and move the monitor.',
  options: ['Lower the send, close mics, move the monitor', 'Notch out the ring, then raise the level back up', 'Turn the singers’ monitors up to cover it'],
  correct: 'Lower the send, close mics, move the monitor',
  explain: 'Lower the level at once; then close the mics not in use, keep group mics out of the singers’ own monitor, and put the monitor where the pattern rejects it. Never work at the edge of feedback.',
  why: {
    'Notch out the ring, then raise the level back up': 'That works at the edge of feedback; the next note rings somewhere else.',
    'Turn the singers’ monitors up to cover it': 'More monitor level feeds the loop that is ringing.',
  },
});

/** A symptom every group lesson shares: a hollow, phasey sum. */
export const phaseySymptom = (id: string, what = 'The group sounds hollow or phasey'): Symptom => ({
  id,
  observation: what,
  firstChecks: 'Do two open mics hear the same voices at different times? Mute-check each mic, check mono, and space them 3:1 or use fewer.',
  options: ['Mute-check, check mono, space 3:1 or fewer', 'Boost the low mids on the bus until it sounds full', 'Flip the polarity on half of the mics'],
  correct: 'Mute-check, check mono, space 3:1 or fewer',
  explain: 'Overlapping mics hear one voice twice, a little apart in time: a comb. Listen to each alone, then in mono; space them 3:1 as a start, move them, or use fewer.',
  why: {
    'Boost the low mids on the bus until it sounds full': 'EQ cannot fill a comb notch; the overlap is the cause.',
    'Flip the polarity on half of the mics': 'Polarity changes the sign, not the delay — it moves the notches.',
  },
});

export const GROUP_BRAND: SetupReason = { id: 'r.brand', label: 'It is the brand most groups use', role: 'wrong', feedback: 'A brand is not part of passing: choose by the pattern, the distance and the group.' };
export const NO_PROVOKE_REASON: SetupReason = { id: 'r.ring', label: 'Raise the monitors until it rings, then back off', role: 'wrong', feedback: 'Never provoke feedback: monitors up only to the agreed level, and down at once at any ring.' };
export const FEWEST_REASON: SetupReason = { id: 'r.fewest', label: 'The fewest open mics that cover the group', role: 'optional', feedback: 'A fair reason: every doubling of open mics costs about 3 dB of margin.' };
export const SAFE_REASON: SetupReason = { id: 'r.safe', label: 'Stands and cables clear of the singers, their feet and the way out', role: 'required', feedback: 'Safe placement is part of every passing setup.' };
