/**
 * The saxophone family's shared page words (learner-facing; the
 * starting-points voice — no sources, brands or badges). Pure data.
 */

/** BEFORE ANY MIC (the setting page's read step). */
export function saxBefore(noun: string): { title: string; text: string }[] {
  return [
    { title: 'ASK THE PLAYER FIRST', text: `Standing or seated, and how do they move? Which notes and dynamics does the part use — the lowest, the highest, the loudest accent? What sound do they want: natural and blended, warm, or a bright, direct lead? Hear the ${noun} unamplified first, from where the audience sits and from where a mic would go.` },
    { title: 'WORK WITH THE HORN AS IT IS', text: 'The saxophone is the player’s, and its keys, rods and pads are delicate. Ask before touching it; nothing clamps to the keys, rods, guards or the neck cork. A clip goes on the bell rim only, made for that bell, fitted with the player — and the player puts it on and takes it off.' },
  ];
}

/** The hearing line (the setting page's warning). */
export const saxHearing =
  'Protect your hearing during soundcheck and on loud stages. NIOSH advises no more than 85 dBA averaged over an 8-hour day, halving the time for every 3 dB above that; the US legal limit (OSHA) is 90 dBA with a 5 dB rule. These are limits for PEOPLE, measured where a person listens — a mic’s maximum SPL rating says nothing about them. Close to the bell a saxophone is very loud: control monitor levels, and use hearing protection where it is loud.';
