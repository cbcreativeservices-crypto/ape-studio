/**
 * Screen guide — the Setup area of an open stage plot. Pure data (the guide
 * tests load it under node). Voice: to the user, about THIS screen. Every
 * word in capitals in `control` is a real label on it (a button is a
 * "button", never a "key": Keys is an instrument).
 */
import type { ScreenGuide } from '../../../../features/lab/screenGuide/types.ts';

export const SP_GUIDE_SETUP: ScreenGuide = {
  intro: {
    learning: 'What a venue needs to know first: who the band is, when and where the show is, whom to call, and how large the stage is.',
    start: 'Type your band name, then add each performer under PERFORMERS. The venue, the date and the stage size are optional, and you can fill them in later.',
  },
  seeing: [
    'Setup is the first of five work areas. The tab bar above it opens the others in any order.',
    'A small mark on a tab means the review has a question for you in that area.',
    'Between ALL PLOTS and UNDO you can read the revision, its status, and whether your work is saved on this device.',
    'The ‹ at the top leaves the lab. ALL PLOTS returns to your list.',
  ],
  control: [
    'A field keeps what you typed when you leave it. UNDO and REDO step back and forward through your changes, in every area.',
    'The switch beside each contact field chooses whether the venue sees that detail in the packet.',
    'Under Status, choose Draft or Ready to advance. Ready is refused while something must be corrected.',
    'ADD A PERFORMER adds a performer to your band. REMOVE lists what that performer is linked to before anything is removed.',
    'The guided task is optional. Each step has a GO button that opens the area where that step is done.',
  ],
  changes: [
    'The band name, the venue and the date print at the top of the packet.',
    'With a width and a depth, the stage is drawn to scale. Without them the packet says “Not to scale”.',
    'After a revision has been shared, your next change starts the next revision as a draft.',
  ],
  teaches: [
    'Stage right and stage left are the performer’s right and left when facing the audience, so stage right is on the left of the drawing.',
    'Upstage is away from the audience, and downstage is toward it.',
    'A technical contact gives the engineer one person to ask about substitutions before show day.',
  ],
  tryThis: [
    'Add a performer and watch the tab bar. Marks appear on Stage and on Monitors, because the review now asks where that performer stands and what they hear.',
    'Turn off the switch beside the phone number, then read the preview in Export. The phone number is no longer in the packet.',
  ],
};
