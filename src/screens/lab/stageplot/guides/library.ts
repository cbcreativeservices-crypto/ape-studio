/**
 * Screen guide — the Stage Plot lab's first screen, the list of stage plots.
 * Pure data (the guide tests load it under node). Voice: to the user, about
 * THIS screen. Every word in capitals in `control` is a real label on it.
 */
import type { ScreenGuide } from '../../../../features/lab/screenGuide/types.ts';

export const SP_GUIDE_LIBRARY: ScreenGuide = {
  intro: {
    learning: 'A stage plot is for a venue’s sound engineer. It says who plays where, what reaches the sound system, and what each performer needs to hear.',
    start: 'Choose an example band under START A STAGE PLOT, or start with a blank stage. Read what each example assumes before you choose it. You can change everything afterward.',
  },
  seeing: [
    'The first list holds the starting points: a blank stage and five example bands. Each one says what it assumes.',
    'The second list holds your own stage plots, with the one you changed last at the top.',
    'Each of your stage plots says whether it is a master or a gig copy, which revision it is, and whether it is a draft.',
  ],
  control: [
    'START begins a new stage plot from the example beside it.',
    'OPEN returns to a stage plot of yours. MORE holds the rest: RENAME, DUPLICATE, DUPLICATE FOR A GIG and DELETE.',
    'DUPLICATE FOR A GIG makes a copy for one venue. You can type the venue and the date first.',
    'DELETE asks you before it removes a stage plot.',
  ],
  changes: [
    'A new stage plot opens immediately in Setup, and it joins your list.',
    'A gig copy remembers its master, and shows its venue and date in the list. Changing the copy never changes the master.',
    'A duplicate begins again at revision 1, as a draft.',
  ],
  teaches: [
    'A band usually keeps one master stage plot and sends each venue its own copy, because stages and house equipment differ.',
    'An example band is a starting point, not a rule. Your real instruments and microphones decide the input list.',
    'A revision number lets you and the venue check that you are both reading the same document.',
  ],
  tryThis: [
    'Start the Four-piece band example, open the Inputs area and count the rows. Each row is one input: one channel at the mixer.',
    'Make a gig copy of a stage plot and type a venue for it. Then open the master again: the master still has no venue.',
  ],
};
