/**
 * Screen guide — page 17, "Budgets and voice limits". Pure data (the guide test loads it under
 * node). Voice: to the student, about THIS screen. The counts TRY
 * THIS quotes are proven on the reducer by test/gameAudioChD.test.ts.
 */
import type { ScreenGuide } from '../../../../../features/lab/screenGuide/types.ts';

export const G17: ScreenGuide = {
  intro: {
    learning: 'Why a game limits how many sounds play at the same time, and how this lab chooses which sound loses its voice.',
    start: 'Set BUDGET to 8. In SOUNDS, switch on SCENE and GENERATOR 1, then press BURST. Read the log to find whose voice was STOLEN for each impact.',
  },
  seeing: [
    'VOICES shows the sound files playing at this moment against the budget, such as 8/8. PLAYING counts instances.',
    'STOLEN and REFUSED count what the budget has cost since you opened this page.',
    'The log in step 2 keeps only STOP and REFUSED lines. The MEMORY card in step 3 gives the decoded size of three sounds.',
  ],
  control: [
    'BUDGET sets the voice limit: 1, 2, 4, 8, 12, 16 or no limit. FEWER and MORE under the slider move it one step.',
    'BURST posts twelve crate impacts at the same time.',
    'SOUNDS opens what fills the voices first: SCENE, GENERATOR 1 and STEP, which are less important than an impact, and ALARM and WARNING LINE, which are protected or more important.',
  ],
  changes: [
    'At the limit, each new impact takes the voice of the least important sound playing, the oldest among equals. The log names that voice as STOLEN.',
    'The alarm is protected: no burst takes its voice, and BUDGET does not go below the protected voices that are sounding.',
    'When no voice can be taken, the new sound is REFUSED.',
    'Lowering BUDGET below what is playing stops the least important sounds immediately.',
  ],
  teaches: [
    'A voice limit is a project’s choice, not a property of a platform’s name.',
    'Priority decides which sound loses its voice. Protection keeps a sound the player needs.',
    'In this lab each sample is a 32-bit number, so decoded size is samples × 4 bytes × channels. Many engines keep smaller or compressed samples. The file on disk is usually smaller, because it is compressed.',
  ],
  tryThis: [
    'With nothing else playing, set BUDGET to 8 and press BURST. STOLEN rises by 4: the impacts are equal, so the oldest four are stopped.',
    'Switch ALARM on, set BUDGET to 1 and press BURST. REFUSED rises by 12, and VOICES stays at 1/1.',
    'Find the alarm on the MEMORY card: one second, one channel, 192,000 bytes. Compare it with the ten-second wind, which has two channels.',
  ],
};
