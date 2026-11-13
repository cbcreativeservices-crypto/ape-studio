/**
 * Screen guide — the Stage area of an open stage plot. Pure data (the guide
 * tests load it under node). Voice: to the user, about THIS screen. Every
 * word in capitals in `control` is a real label on it.
 */
import type { ScreenGuide } from '../../../../features/lab/screenGuide/types.ts';

export const SP_GUIDE_STAGE: ScreenGuide = {
  intro: {
    learning: 'A stage plot shows who stands where. It is a view from the audience, with a symbol for each person and piece of equipment. Names and numbers stand beside them.',
    start: 'Tap ADD and choose Performer. Drag the figure to where that person stands, then add what they play. Tap an object to select it; OBJECT opens its details.',
  },
  seeing: [
    'The drawing looks down on your stage from the audience. UPSTAGE is at the top and AUDIENCE / DOWNSTAGE is at the bottom.',
    'STAGE RIGHT is on the left of the drawing and STAGE LEFT is on the right. The drawing cannot be flipped.',
    'A number in a square box is an input channel. A code in a round box, such as M1, is a monitor mix.',
    'A dashed ring with corner marks is around the selected object.',
  ],
  control: [
    'Drag an object to move it. With snap on, it lands on the nearest grid step.',
    'ZOOM enlarges the drawing up to 4×. Zoomed in, drag the bare stage to slide the drawing. FIT STAGE shows everything again.',
    'TURN faces the selected object another way, from 0° to 355°.',
    'ADD opens the palette. For an instrument, a microphone or a monitor, you choose what the symbol stands for before it is placed.',
    'OBJECT opens the selected object: its name, typed position, links, group, duplicate and remove. VIEW holds the grid, snap, UNDO and REDO.',
  ],
  changes: [
    'Moving an object changes the stage location that Inputs shows for the inputs linked to it.',
    'An object in a group moves, duplicates and is removed with its group.',
    'Removing an object takes it off the drawing only. Its performer, inputs and monitor devices stay in their lists.',
    'An object outside the stage is marked OFF STAGE, and the review asks if that is intended.',
  ],
  teaches: [
    'A stage plot is drawn as the audience sees the stage. The engineer at the mixing position sees the stage the same way.',
    'A symbol on the plot is not an input. An amplifier needs no microphone until you add one to the input list.',
    'Without a stage width and depth the plot is not to scale. With them, the symbols are still drawings, not the real size of the equipment.',
  ],
  tryThis: [
    'Drag a microphone or an instrument to the other side of the stage, then open Inputs. The stage location beside its inputs has changed.',
    'Tap ADD, choose Drum kit, and open a package. Read its rows, turn one off, then add it. Read the channel numbers that appear beside the kit.',
    'Choose an object in the list under the drawing and press a position button. The object moves one step, with no drag.',
  ],
};
