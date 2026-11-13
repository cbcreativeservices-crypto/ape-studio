/**
 * Screen guide — page 6, "From source to game build". Pure data (the guide
 * test loads it under node). Voice: to the student, about THIS screen.
 */
import type { ScreenGuide } from '../../../../../features/lab/screenGuide/types.ts';

export const G06: ScreenGuide = {
  intro: {
    learning: 'The path one sound takes from a file to the running game. A file plays only when an event uses it and the scene posts that event.',
    start: 'Press OPEN DOOR and read the three cards and the log under RESULT. Then go to the TROUBLESHOOT card in step 4, start the fault and find the broken link.',
  },
  seeing: [
    'The door stands in the wall between the courtyard and the workshop. It is the one sound this page follows.',
    'Three cards show its chain: ASSET RECORD, EVENT and SCENE CONNECTION. The log under RESULT is the fourth stage.',
    'DOOR shows OPEN or CLOSED. DOOR FILE shows FOUND or MISSING, and a question mark while a fault you started has not been found yet.',
  ],
  control: [
    'OPEN DOOR posts the door event. After a press the key reads CLOSE DOOR, and it posts the same event.',
    'DOOR FILE sets which file name the door layer asks for: door_open.wav, which is in the build, or door_open_v2.wav, which is not. It stays locked until you have pressed the door key once with the fault in.',
    'On the TROUBLESHOOT card, START THE FAULT sets DOOR FILE to the missing name for you.',
    'LEVEL sets how loud the lab plays the door, from 0 to 100%. The slider controls it when the page opens.',
  ],
  changes: [
    'Each press of the door key adds two GAME lines, the trigger and then the event. Then START lines follow: the door layer names its file.',
    'Opening plays door_open.wav. Closing posts the same event, and the door layer plays door_close.wav. Card 1 shows the file of the last move.',
    'With the fault in, the event is still posted, but a FAULT line names the missing file, and only the rattle starts.',
  ],
  teaches: [
    'An imported file is an asset. It plays in the game only when an event uses it and the scene posts that event.',
    'The asset, the authoring data and the build are three different things.',
    'A sound bank is how some tools package sounds and their rules. It is not a file type that every game uses.',
    'When a sound is missing, the log shows which link broke.',
  ],
  tryThis: [
    'Open and close the door twice. Compare the file named in each START line for the door with FILE on card 1.',
    'Read SENT TO on the EVENT card. Then press the door key and find the same bus name at the end of a START line in the log.',
    'Press the door key and watch the strip under the picture: the RATTLE lane starts one second after the door.',
  ],
};
