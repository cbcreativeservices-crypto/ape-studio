/**
 * Screen guide — page 13, "Output formats". Pure data (the guide test loads
 * it under node). Voice: to the student, about THIS screen.
 */
import type { ScreenGuide } from '../../../../../features/lab/screenGuide/types.ts';

export const G13: ScreenGuide = {
  intro: {
    learning: 'Three outputs can be heard here: stereo pan, headphone 3D and a mono downmix. Channel layouts, object-based audio and binaural sound are related ideas, not the same.',
    start: 'Switch SCENE on so the fountain plays. Open OUTPUT, choose STEREO and turn with FACING. Then put on headphones, choose HEADPHONE 3D and turn again. Finish with MONO.',
  },
  seeing: [
    'You’re looking down on the scene. The rings and the dotted line mark the fountain, the source to listen to on this page.',
    'FOUNTAIN shows where it is from your point of view: AHEAD, BEHIND, LEFT or RIGHT. OUTPUT names what your device is sending now.',
    'Lower down, a map shows a 5.1 speaker layout from above. It is a picture; your phone is not sending surround.',
  ],
  control: [
    'FACING turns you, so the fountain moves around your head. The slider controls it when the page opens.',
    'OUTPUT chooses between STEREO, HEADPHONE 3D and MONO. Its tray stays open so you can compare them.',
    'SCENE starts and stops the fountain and the background sound of each place.',
    'On the OUTPUT key, the short word for HEADPHONE 3D is 3D.',
  ],
  changes: [
    'In STEREO the fountain moves only between left and right, so ahead and behind sound the same.',
    'In HEADPHONE 3D your device filters each sound for each ear, as a head would. On headphones, ahead and behind now differ.',
    'In MONO both ears get the same signal. Distance still sets the level; direction is gone.',
  ],
  teaches: [
    'A speaker layout, a sound kept with its position, a binaural headphone signal and a stored sound field are four ways to carry space.',
    'Two small speakers, one for each ear, are enough for 3D, because the filtering is done before the sound reaches them.',
    'Folding stereo to mono is a downmix.',
    'File compression, and whether an asset is mono or stereo, are separate questions.',
  ],
  tryThis: [
    'With STEREO chosen, face the fountain, then turn your back to it, and listen for a difference. Repeat with HEADPHONE 3D on headphones.',
    'Choose HEADPHONE 3D and listen on the phone’s speaker, then on headphones. The effect needs one signal for each ear.',
    'Choose MONO and turn all the way around. You can no longer tell where the fountain is.',
  ],
};
