/**
 * Screen guide — page 18, "Multiplayer sound". Pure data (the guide test loads it under
 * node). Voice: to the student, about THIS screen. "Machine" is a player's
 * computer here, and only that.
 */
import type { ScreenGuide } from '../../../../../features/lab/screenGuide/types.ts';

export const G18: ScreenGuide = {
  intro: {
    learning: 'How sound works when several players share a world: the game sends what happened, and each player’s machine plays the sound for its own listener.',
    start: 'Open SEND and press DOOR · NEW ID, then the AGAIN chip. Each action arrives 0.25 s after it is sent. The second one is “already handled, so it is ignored”.',
  },
  seeing: [
    'You and the guide stand in for two players. Each has a separate machine, and you hear only yours.',
    'The strip under the picture shows each action as a dot with its ID. It travels from the NETWORK to each machine in 0.25 s, and then shows what that machine did.',
    'ID CHECK shows whether a repeated ID is ignored. LAST ID is the ID you sent last. The card ONE MESSAGE, TWO MACHINES shows what it did on each machine.',
  ],
  control: [
    'SEND opens the messages. DOOR · NEW ID is a sound in the world. ALERT TO YOU and ALERT TO OTHER are private. The AGAIN chip sends your last action again with the same ID. CHAT LINE plays the stand-in for voice chat.',
    'ID CHECK switches the test for repeated IDs on or off. It is read when an action arrives. The log prints a line for the setting each time.',
    'LEVEL sets how loud the lab plays. The slider controls it when the page opens.',
  ],
  changes: [
    'An action does nothing until it arrives. Then a new door action moves the door and plays its sound.',
    'With ID CHECK on, a repeated ID is ignored: nothing plays or moves.',
    'With it off, the same action is handled again: the door sound plays a second time, but the door does not move.',
    'An alert for you plays an interface cue here. One for the other player plays nothing here.',
  ],
  teaches: [
    'A networked game usually sends events, not audio. Each machine plays the sound for its own listener.',
    'So there is no single shared mix. Two players can hear the same door from different distances and directions.',
    'A message takes time to arrive. An ID on each action lets a machine ignore a repeat, or its own action coming back as a second copy.',
    'Live voice chat is different: real audio travels between players.',
  ],
  tryThis: [
    'Send DOOR · NEW ID, then press the AGAIN chip three times with ID CHECK on. The log shows the door started once, then three ignored arrivals.',
    'Switch ID CHECK off and press the AGAIN chip once. When it arrives, the card and the strip read PLAYED AGAIN · DOUBLE, and the log says “handled a SECOND time”.',
    'Send ALERT TO OTHER. Your machine stays silent, and the card shows which machine plays the cue.',
  ],
};
