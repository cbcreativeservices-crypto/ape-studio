/**
 * Screen guide — the Monitors area of the Stage Plot and Channel Designer
 * (must-do D60). Pure data (test/stagePlotMonitors.test.ts loads it under
 * node). Voice: to the user, about THIS area. A button or a section is named
 * in CAPITALS, exactly as on the screen; a chip keeps its own words. Every
 * label it names is a real label in MonitorsArea.tsx or monitors/.
 */
import type { ScreenGuide } from '../../../../features/lab/screenGuide/types.ts';

export const SP_GUIDE_MONITORS: ScreenGuide = {
  intro: {
    learning: 'A mix is what a performer hears. A monitor device is the equipment that plays it. This area keeps the two apart, so the venue can read each number correctly.',
    start: 'Read the three counts at the top. Then tap ADD A MIX and choose who hears it, mono or stereo, and who creates it. Its usual devices are listed before anything is added.',
  },
  seeing: [
    'Three counts sit at the top: mixes, monitor feed audio channels requested from the house console, and monitor devices.',
    'The mix list is grouped by who creates each mix. The house console’s group comes first.',
    'The device list is a second list, below the mixes. Each device names the mix it is on.',
    'A click, cue or talkback input carries the label MONITOR ONLY.',
  ],
  control: [
    'ADD A MIX starts a new mix. EDIT MIX changes its name, who hears it, mono or stereo, who creates it, how it is delivered, and its instructions.',
    'ADD A DEVICE adds one piece of monitor equipment, such as a wedge or a receiver pack. You choose the mix it is on.',
    'Under WHAT EACH MIX NEEDS TO HEAR, pick one mix. Then give each input one of four words: Primary, Supporting, Not needed or Must exclude.',
    'LOCATE ON THE STAGE opens the Stage area at that device. GO TO THIS INPUT opens a click or cue in the Inputs area.',
  ],
  changes: [
    'A house mix changed from mono to stereo adds one audio channel to what is requested from the house console. The number of mixes stays the same.',
    'A second wedge on a mix raises the wedge count only. It is still one mix with the same audio channels.',
    'A mix moves to another group when you change who creates it. A mix your band creates is never added to the house console’s number.',
  ],
  teaches: [
    'A mix is not a device. A wedge or a receiver pack is equipment, and one mix can feed several devices.',
    'A mono mix needs one audio channel from whoever creates it. A stereo mix needs two.',
    'A mix your band creates in the band monitor rig is not requested from the house console. The venue still needs to know what to provide for it.',
    'The four words are preferences you give before the show, not fader values.',
  ],
  tryThis: [
    'In the four-piece example, use ADD A DEVICE to put a second wedge on M1. Read the counts: wedges go from 2 to 3, and the mixes stay at 4.',
    'Open M3 with EDIT MIX and change it from stereo to mono. The audio channels requested from the house console go from 6 to 5.',
    'Find Click under WHAT EACH MIX NEEDS TO HEAR. Pick each mix, one after the other: only the drums mix asks to hear it.',
  ],
};
