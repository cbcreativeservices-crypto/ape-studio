/**
 * Screen guide — page 3, "Where games run". Pure data (the guide test loads
 * it under node). Voice: to the student, about THIS screen.
 */
import type { ScreenGuide } from '../../../../../features/lab/screenGuide/types.ts';

export const G03: ScreenGuide = {
  intro: {
    learning: 'Platform, delivery and output are three separate questions, and a platform’s name does not fix a game’s sound quality or its voice budget.',
    start: 'Open PLATFORM and read the MOBILE, DESKTOP, CONSOLE and BROWSER cards. Then choose a LISTENING setup, and move BUDGET to see that it changes while the card stays open.',
  },
  seeing: [
    'The scene is the same courtyard and workshop. Here it stands for one small game that could run on many kinds of device.',
    'CARD names the platform card you opened and LISTEN names the listening setup you chose. VOICES shows the voices in use, then the budget after the slash.',
    'The open card is in step 2: an example, what to compare, what stays the same, what could change, and one test.',
  ],
  control: [
    'BUDGET has two positions: COMPACT allows 8 voices at the same time and EXPANDED allows 16. The slider controls it when the page opens.',
    'PLATFORM opens one of seven cards: MOBILE, DESKTOP, CONSOLE, HANDHELD, BROWSER, XR and CLOUD.',
    'LISTENING chooses how the player hears the game: a phone speaker, headphones, TV speakers, a soundbar or a headset. Its tray stays open, so you can compare them.',
  ],
  changes: [
    'Picking a card changes only what you read. It does not change the phone in your hand or how this lab plays.',
    'Moving BUDGET prints a MIX line in the log. The open card stays as it was.',
    'With nothing playing, only the number after the slash in VOICES changes. The Budgets page fills the budget.',
  ],
  teaches: [
    'Platform is where the game runs, delivery is how it reaches the player, and output is how the player hears it. These can be three different devices.',
    'The same sounds can serve every platform. What changes is the listening condition, the interruptions and what needs testing.',
    'A platform name is not a quality level. Devices of one kind differ widely.',
  ],
  tryThis: [
    'Open CLOUD, then CONSOLE, and find WHAT STAYS THE SAME on each. On both, the game’s own audio is made the same way.',
    'Choose a headset in LISTENING, then open three different cards. The setup stays, because output is a separate choice from platform.',
    'Move BUDGET to COMPACT and read VOICES, then open another card. The budget did not move with the card.',
  ],
};
