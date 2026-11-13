/**
 * Screen guide — the Stage area of an open stage plot. Pure data (the guide
 * tests load it under node). Voice: to the user, about THIS screen. Every
 * word in capitals in `control` is a real label on it.
 */
import type { ScreenGuide } from '../../../../features/lab/screenGuide/types.ts';

export const SP_GUIDE_STAGE: ScreenGuide = {
  intro: {
    learning: 'A stage plot shows who stands where. It looks down on the stage from above, with the audience at the bottom. Names and numbers stand beside each symbol.',
    start: 'Tap ADD and choose Performer. Drag the figure to where that person stands, then add what they play. Tap an object to select it; OBJECT moves and turns it.',
  },
  seeing: [
    'The drawing looks down on your stage. UPSTAGE is at the top and AUDIENCE / DOWNSTAGE is at the bottom.',
    'STAGE RIGHT is on the left and STAGE LEFT is on the right. The drawing cannot be flipped.',
    'A number in a square box is an input channel. A code in a rounded box, such as M1, is a monitor mix.',
    'A dashed frame with corner marks shows the selected object.',
    'The KEY under the stage names each kind of object drawn.',
  ],
  control: [
    'Drag an object to move it. With snap on, it lands on the nearest grid step.',
    'ZOOM enlarges the drawing up to 4×. Zoomed in, drag the bare stage to slide the drawing. FIT STAGE shows everything again.',
    'TURN faces the selected object another way, from 0° to 355°.',
    'ADD opens the palette. For an instrument, a microphone or a monitor, you choose what the symbol stands for before it is placed.',
    'OBJECT opens position and turn buttons for the selected object, under the drawing. NAME, LINKS AND MORE opens the rest: its name, links, group and remove.',
  ],
  changes: [
    'Moving an object changes the stage location that Inputs shows for the inputs linked to it.',
    'Removing an object takes it off the drawing only. Its performer and inputs stay in their lists.',
    'An object outside the stage is marked OFF STAGE, and the review asks if that is intended.',
    'On a crowded stage some equipment names are left out until you zoom in. Their numbers stay.',
  ],
  teaches: [
    'A stage plot is drawn from above with the audience at the bottom, so left and right match what the engineer at the mixing position sees.',
    'A symbol on the plot is not an input. An amplifier needs no microphone until you add one to the input list.',
    'Without a stage width and depth the plot is not to scale. With them, the symbols are still drawings, not the real size of the equipment.',
  ],
  tryThis: [
    'Drag a microphone or an instrument to the other side of the stage, then open Inputs. The stage location beside its inputs has changed.',
    'Tap ADD, choose Drum kit, and open a package. Read its rows, turn one off, then add it. Read the channel numbers that appear beside the kit.',
    'Choose an object in the list under the drawing and press a position button. The object moves one step, with no drag.',
  ],
};
