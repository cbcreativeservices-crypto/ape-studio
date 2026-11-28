/**
 * Screen guide — page 17, "Budgets and voice limits". Pure data (the guide test loads it under
 * node). Voice: to the student, about THIS screen. The counts TRY
 * THIS quotes are proven on the reducer by test/gameAudioChD.test.ts.
 */
import type { ScreenGuide } from '../../../../../features/lab/screenGuide/types.ts';

export const G17: ScreenGuide = {
  intro: {
    learning: 'Why a game limits how many sounds play at the same time, and how this lab chooses which sound loses its voice.',
    start: 'Set BUDGET to 8. In SOUNDS, switch on SCENE and GENERATOR 1, then press BURST. The card SINCE THE LAST BURST lists whose voices were taken, in order.',
  },
  seeing: [
    'VOICES shows the voices in use against the budget. STOLEN and REFUSED count what the budget cost since you opened this page.',
    'The strip has one slot per voice of the budget. A slot that changes hands shows STOLEN; a loop that lost its voice waits under WAITING; a padlock marks a protected voice.',
    'The card in step 2 lists each voice the last burst took. The MEMORY card gives the decoded size of three sounds.',
  ],
  control: [
    'BUDGET sets the voice limit: 1, 2, 4, 8, 12, 16 or no limit. FEWER and MORE under the slider move it one step.',
    'BURST posts twelve crate impacts within 0.3 s.',
    'SOUNDS opens what fills the voices first. SCENE, GENERATOR 1 and STEP are less important than an impact. ALARM and WARNING LINE are protected: their voices are not taken.',
  ],
  changes: [
    'At the limit, a new impact takes the voice of the least important, oldest sound playing. A stolen one-shot stops.',
    'A stolen loop goes VIRTUAL: tracked and silent. GENERATOR 1 and SCENE stay on; their loops get voices back after the impacts.',
    'When no voice can be taken, the new sound is REFUSED.',
    'Lowering BUDGET takes voices without counting them as STOLEN. It does not go below the protected voices playing.',
  ],
  teaches: [
    'A voice limit is a project’s choice, not a property of a platform’s name.',
    'Priority decides which sound loses its voice. Protection keeps a sound the player needs.',
    'This scene counts a silent loop as a voice and leaves the music out. A real engine counts the music and usually makes a silent loop virtual.',
    'Here decoded size is samples × 4 bytes × channels; the file on disk is usually smaller.',
  ],
  tryThis: [
    'With nothing else on, set BUDGET to 8 and press BURST. STOLEN rises by 4: the impacts are equal, so the oldest four stop.',
    'Switch ALARM on and press WARNING LINE, then set BUDGET to 1. It stays at 2, because two protected voices are playing.',
    'Find the alarm on the MEMORY card: one second, one channel, 192,000 bytes. Compare it with the ten-second wind, which has two channels.',
  ],
};
