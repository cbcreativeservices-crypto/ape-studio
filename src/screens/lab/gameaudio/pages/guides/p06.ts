/**
 * Screen guide — page 6, "From source to game build". Pure data (the guide
 * test loads it under node). Voice: to the student, about THIS screen.
 */
import type { ScreenGuide } from '../../../../../features/lab/screenGuide/types.ts';

export const G06: ScreenGuide = {
  intro: {
    learning: 'The path one sound takes from a file to the running game. A file plays only when an event uses it and the scene posts that event.',
    start: 'Press OPEN DOOR and read the four cards from top to bottom. Then go to the TROUBLESHOOT card at the end of the page, start the fault and find the broken link.',
  },
  seeing: [
    'The door stands in the wall between the courtyard and the workshop. It is the one sound this page follows.',
    'Four cards show its chain: ASSET RECORD, EVENT, SCENE CONNECTION and RESULT. RESULT is the activity log.',
    'DOOR shows OPEN or CLOSED. DOOR FILE shows FOUND or MISSING: whether the build holds the file the event asks for.',
  ],
  control: [
    'OPEN DOOR posts the door event each time you press it. After a press the key reads CLOSE DOOR, and it posts the same event.',
    'DOOR FILE sets which file name the door event asks for: door_open.wav, which is in the build, or door_open_v2.wav, which is not.',
    'On the TROUBLESHOOT card, START THE FAULT sets DOOR FILE to the missing name for you.',
    'LEVEL sets how loud the lab plays the door, from 0 to 100%. The slider controls it when the page opens.',
  ],
  changes: [
    'Each press of the door key adds two GAME lines, the trigger and then the event, and START lines after them.',
    'With door_open_v2.wav chosen, the event is still posted, but a FAULT line names the missing file and the door layer does not start. The EVENT card marks the broken link.',
    'Choose door_open.wav again and the same press plays the door. Nothing else in the chain changed.',
  ],
  teaches: [
    'An imported file is an asset. It plays in the game only when an event uses it and the scene posts that event.',
    'The original file, the authoring data and the runtime package are three different things.',
    'A sound bank is how some tools package sounds and their rules. It is not a file type that every game uses.',
    'When a sound is missing, the log shows which link broke.',
  ],
  tryThis: [
    'With door_open_v2.wav chosen, press the door key and wait one second. The log still shows a START line for the rattle: that layer’s file is in the build.',
    'Read BUS on the EVENT card. Then press the door key and find the same bus name at the end of a START line in the log.',
  ],
};
