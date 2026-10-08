/**
 * SHARED WORDS FOR A PERSON WHO SPEAKS — Lab 7 part 1 review (2026-10-08,
 * docs/labs/miking/REVIEW_LAB7A_2026_10_08.md). The bowed family's generic
 * items (shared/bowed/bowedItems.ts) and the engine's MEET IT goal
 * (engine/restructure.ts meetContent) are written for an INSTRUMENT: "the
 * loudest host passage", "a second mic (or the pickup)", "until the body
 * comes back", "Meet the host in brief — what it is and its parts — and see
 * where its sound leaves it". These say the same things about a person and a
 * voice. Pure data; used by B01–B07 (B09–B17 may adopt them).
 */
import type { LessonPages, MikingScenario, PageContent, Symptom } from '../../../engine/model/types.ts';
import { micRatingCheck } from '../../../engine/model/sharedItems.ts';

/** The setting page's max-SPL check, for a voice: `who` is "the host",
 *  `loudest` the loudest thing that person really does ("laugh or shout").
 *  The engine's item (`micRatingCheck`) asks a yes/no question; this asks
 *  what the rating tells you, with the same facts and explanations, so the
 *  voice lessons do not tip the lab's Yes/No key balance. */
export const voiceRatingCheck = (id: string, who: string, loudest = 'laugh or shout'): MikingScenario => {
  const base = micRatingCheck({ id, page: 'setting', mic: `mic for ${who}`, loudest: `${who}’s loudest ${loudest}` });
  const KEY = 'The mic copes; it says nothing about your ears';
  const SAFE = 'The mic copes, and the people near it are safe';
  const HEAR = 'It is a hearing limit for the people nearby';
  const [, safeWhy, hearWhy] = base.options.map((o) => base.why[o]);
  return {
    ...base,
    prompt: `Your mic for ${who} is rated to a max SPL well above ${who}’s loudest ${loudest} at the mic. What does that rating tell you?`,
    options: [KEY, SAFE, HEAR],
    correct: KEY,
    why: { [SAFE]: safeWhy, [HEAR]: hearWhy },
  };
};

/** Two open mics on one voice — the voice version of `hollowSymptom` (no
 *  pickup, no instrument body). */
export const hollowVoiceSymptom = (id: string): Symptom => ({
  id,
  observation: 'One voice sounds hollow with two mics open',
  firstChecks: 'Solo each; sum in mono; is one of them needed at all? Then move or rebalance; check polarity last.',
  options: ['Solo each, sum in mono; mute or move one', 'Flip one polarity switch and leave it that way', 'Boost the low end on both channels to fill it in'],
  correct: 'Solo each, sum in mono; mute or move one',
  explain: 'One voice reaching two open mics at different times makes some pitches cancel. Hear each alone and in mono; often the answer is one mic open, not two. A polarity switch cannot line up every pitch.',
  why: {
    'Flip one polarity switch and leave it that way': 'Polarity is a check, not a cure: it cannot remove a delay.',
    'Boost the low end on both channels to fill it in': 'EQ cannot undo a cancellation between two paths. Fix the combination first.',
  },
});

/** The MEET IT page for a lesson about PEOPLE who speak: the engine's
 *  generic goal calls the subject "it" ("what it is and its parts … where
 *  its sound leaves it"). The same credit (the instrument and sound pages'
 *  checks) and takeaway as the engine would build. `who`: "the host", "the
 *  reporter and the guest". */
export function personMeet(pages: LessonPages, who: string): PageContent {
  const scenarios = [...(pages.instrument?.credit.scenarios ?? []), ...(pages.sound?.credit.scenarios ?? [])];
  return {
    title: 'Meet it — where the sound comes from',
    goal: `Meet ${who} in brief — who speaks and what is around them — and see where the voice leaves: those are the places a mic can hear them best.`,
    credit: {
      scenarios,
      note: scenarios.length ? `Answer the ${scenarios.length === 1 ? 'check' : `${scenarios.length} checks`} on where the voice leaves.` : 'Credited when you move on from the last step — explore as much as you like.',
    },
    takeaway: pages.sound?.takeaway ?? pages.instrument?.takeaway ?? '',
  };
}
