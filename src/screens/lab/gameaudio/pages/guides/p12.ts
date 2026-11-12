/**
 * Screen guide — page 12, "Walls, doors and rooms". Pure data (the guide
 * test loads it under node). Voice: to the student, about THIS screen.
 */
import type { ScreenGuide } from '../../../../../features/lab/screenGuide/types.ts';

export const G12: ScreenGuide = {
  intro: {
    learning: 'What a wall and a door do to a game sound. A blocked path, sound through a wall, reflections and reverb are separate ideas.',
    start: 'Open ROOM and switch GENERATOR 1 on. From the courtyard, press the door key and watch GEN 1 change between MUFFLED and CLEAR. Then drag WALK into the workshop and compare REVERB with DRY.',
  },
  seeing: [
    'You’re looking down on the wall between the courtyard and the workshop, with one door in it. The generator is inside.',
    'The generator’s rings turn bluer when its sound reaches you fainter.',
    'DOOR shows OPEN or CLOSED. GEN 1 shows MUFFLED when the closed door is between you and the generator, and CLEAR when it is not.',
  ],
  control: [
    'WALK moves you along the stone path and through the doorway. With the door closed you stop at the wall. The two STEP keys under the slider walk one step, with a footstep.',
    'OPEN DOOR opens the door; the key then shows CLOSE DOOR.',
    'ROOM holds GENERATOR 1, which starts and stops the generator, and the choice between REVERB and DRY for sounds made in the workshop.',
    'On the WALK key, OUTSIDE or INSIDE tells you which side of the wall you are on.',
  ],
  changes: [
    'With the closed door between you and the generator, the scene turns it down by 9 dB and filters out the sound above about 900 Hz. Opening the door removes both changes.',
    'With REVERB chosen, sounds made in the workshop are also sent to a reverb, more strongly when you stand inside. DRY removes that, and the log prints the SETTING.',
  ],
  teaches: [
    'A blocked direct path, sound through a wall, reflections, reverberation and bending around a corner are five different things.',
    'Tools often call the first obstruction and the second occlusion. This door is an occlusion treatment.',
    'A level change and a filter are a designer’s treatment, not a calculation of how sound passes a wall.',
    'Games often change what is realistic so the player can understand the scene.',
  ],
  tryThis: [
    'Stand in the courtyard with the generator running. Close and open the door a few times and listen for two changes: the level, and how much treble the sound has.',
    'Open the door, drag WALK into the workshop and press a STEP key. Then choose DRY in ROOM and step again: the short tail of room sound is gone.',
  ],
};
