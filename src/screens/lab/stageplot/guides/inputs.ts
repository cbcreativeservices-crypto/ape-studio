/**
 * Screen guide — the Inputs area of the Stage Plot and Channel Designer
 * (must-do D60). Pure data (test/stagePlotInputs.test.ts loads it under
 * node). Voice: to the user, about THIS area. A button or a section is named
 * in CAPITALS with no quotation marks, exactly as on the screen, and every
 * one it names is a real label in InputsArea.tsx or inputs/.
 */
import type { ScreenGuide } from '../../../../features/lab/screenGuide/types.ts';

export const SP_GUIDE_INPUTS: ScreenGuide = {
  intro: {
    learning: 'An input is one audio channel that reaches a mixer. One source can need several inputs, and some need none. Your input list is what the venue engineer plugs in.',
    start: 'Tap ADD A SOURCE and pick a package. Read its rows, untick any you do not use, then add them. Tap a row to change it. Use the ▲ and ▼ buttons to change the order.',
  },
  seeing: [
    'Each card is one input. It shows the channel number, the name, who plays it, where it is on the stage, how it is captured, and its stand.',
    'A stereo pair is one block with an L row and an R row. MONITOR ONLY marks a click or cue that the audience does not hear.',
    'Below the list you see your DI devices and a summary of who brings what.',
  ],
  control: [
    'ADD A SOURCE offers a ready-made package, a single input, or a source that needs no sound system connection.',
    'Tap a row to edit it. The first fields are enough for a basic list. MORE DETAILS holds the rest.',
    'The ▲ and ▼ buttons move a row up or down. A stereo pair moves as one.',
    'SORT IN THE USUAL ORDER and RENUMBER change the whole list. You can keep reserved channels free.',
    'LOCATE ON THE STAGE shows where the same input is on the drawing.',
  ],
  changes: [
    'A package adds only the rows you ticked. Each row is an ordinary row afterward, so you can change or remove it.',
    'A row that moves takes the channel number of its new place. The number beside it on the stage follows.',
    'The summary is counted from the rows each time, so its numbers change when a row does.',
  ],
  teaches: [
    'A source is not an input. A drum kit can need six inputs. An acoustic instrument can need none.',
    'A stereo source needs two inputs, left and right, even when a console shows one strip.',
    'A DI channel and a DI device are counted apart: one stereo DI device carries two DI channels.',
    'A microphone model is a preference unless you mark it required.',
  ],
  tryThis: [
    'Add the stereo keyboard package, then open one of its rows and choose MAKE IT MONO. The number of inputs and the number of DI channels each drop by one.',
    'Type 7 in the reserved channels field, then press RENUMBER. Channel 7 stays empty and the rows after it move down by one.',
    'Change who brings one microphone from the venue to the band. Find it again in the summary under what the band brings.',
  ],
};
