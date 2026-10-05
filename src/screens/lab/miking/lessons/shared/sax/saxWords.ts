/**
 * The saxophone family's shared page words (learner-facing; the
 * starting-points voice — no sources, brands or badges). Pure data.
 */

/** BEFORE ANY MIC (the setting page's read step). */
export function saxBefore(noun: string): { title: string; text: string }[] {
  return [
    { title: 'ASK THE PLAYER FIRST', text: `Standing or seated, and how do they move? Which notes and dynamics does the part use — the lowest, the highest, the loudest accent? What sound do they want: natural and blended, warm, or a bright, direct lead? Hear the ${noun} unamplified first, from where the audience sits and from where a mic would go.` },
    { title: 'WORK WITH THE HORN AS IT IS', text: 'The saxophone is the player’s, and its keys, rods and pads are delicate. Ask before touching it; nothing clamps to the keys, rods, guards or the neck cork. A clip goes only on the bell rim, made for that bell, fitted with the player — and the player puts it on and takes it off.' },
  ];
}

/** The hearing line (the setting page's warning). */
export const saxHearing =
  'Protect your hearing during soundcheck and on loud stages. A widely used guideline: no more than 85 dBA averaged over an 8-hour day, and halve the time for every 3 dBA above that. That is a limit for PEOPLE, measured where a person listens — a mic’s maximum SPL rating says nothing about it. Close to the bell a saxophone is very loud: control monitor levels, and use hearing protection where it is loud.';
