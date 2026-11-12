/**
 * Screen guide — page 18, "Multiplayer sound". Pure data (the guide test loads it under
 * node). Voice: to the student, about THIS screen.
 */
import type { ScreenGuide } from '../../../../../features/lab/screenGuide/types.ts';

export const G18: ScreenGuide = {
  intro: {
    learning: 'How sound works when several players share a world: the game sends what happened, and each player’s machine plays the sound for its own listener.',
    start: 'Open SEND and press DOOR · NEW ID, then the AGAIN chip. Read the log: the second delivery says “already handled, ignored”.',
  },
  seeing: [
    'You and the guide stand in for two players. Each has a separate machine, and you hear only yours.',
    'ID CHECK shows whether a repeated id is ignored. LAST ID is the id of the action you sent last.',
    'The card ONE MESSAGE, TWO MACHINES shows what your last message did on each machine.',
  ],
  control: [
    'SEND opens the messages. DOOR · NEW ID is a sound in the world. ALERT TO YOU and ALERT TO OTHER are private. The AGAIN chip delivers your last action a second time with the same id. CHAT LINE plays the stand-in for voice chat.',
    'ID CHECK switches the test for repeated ids on or off. The log prints a line for the setting each time.',
    'LEVEL sets how loud the lab plays. The slider controls it when the page opens.',
  ],
  changes: [
    'A new door action moves the door in the picture and plays its sound.',
    'With ID CHECK on, a repeated id is ignored: the log reads “already handled, ignored”, and nothing plays or moves.',
    'With it off, the same action is handled a second time: the door sound plays again, but the door does not move again.',
    'An alert for you plays an interface cue here. An alert for the other player plays nothing here.',
  ],
  teaches: [
    'A networked game usually sends events, not audio. Each machine plays the sound for its own listener.',
    'So there is no single shared mix. Two players can hear the same door from different distances and directions.',
    'An id on each action lets a machine ignore a repeat, or its own action coming back as a second copy.',
    'Live voice chat is different: real audio travels between players.',
  ],
  tryThis: [
    'Send DOOR · NEW ID, then press the AGAIN chip three times with ID CHECK on. The log shows the door started once, then three ignored deliveries.',
    'Switch ID CHECK off and press the AGAIN chip once. The card marks both machines PLAYS, and the log line ends “handled a SECOND time”.',
    'Send ALERT TO OTHER. Your machine stays silent, and the card shows which machine plays the cue.',
  ],
};
