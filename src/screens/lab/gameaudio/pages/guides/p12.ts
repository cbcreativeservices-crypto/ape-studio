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
    'You are looking down on the wall between the courtyard and the workshop, with its door. The generator is inside.',
    'The strip under the picture draws the door’s treatment as a curve: a drop of 9 dB, and a low-pass bend above 900 Hz. Beside it, the room’s reverb tail.',
    'DOOR shows OPEN or CLOSED. GEN 1 shows MUFFLED when the closed door is between you and the generator, and CLEAR when it is not.',
  ],
  control: [
    'WALK moves you along the stone path and through the doorway. With the door closed you stop at the wall. The two STEP keys under the slider walk one step, with a footstep.',
    'OPEN DOOR opens the door; the key then shows CLOSE DOOR.',
    'ROOM holds GENERATOR 1, which starts and stops the generator, and the choice between REVERB and DRY for sounds made in the workshop. A note under them says what is sent now.',
    'On the WALK key, COURTYARD or WORKSHOP tells you which side of the wall you are on.',
  ],
  changes: [
    'With the closed door between you and the generator, the scene turns it down by 9 dB, and a low-pass filter at about 900 Hz turns down its high part. Opening the door removes both.',
    'REVERB also sends sounds made in the workshop to a reverb, more when you stand inside. DRY removes that, and the log prints a MIX line that begins SETTING.',
  ],
  teaches: [
    'A blocked direct path, sound through a wall, reflections, reverberation and bending through a doorway are five different things.',
    'Tools often call the first obstruction and the second occlusion. This door is an occlusion treatment.',
    'A level change and a filter are a designer’s treatment. This scene tests no line of sight; a real game often does.',
  ],
  tryThis: [
    'Stand in the courtyard with the generator running. Close and open the door a few times. Listen for two changes, or read them on the card: the level, and how much treble the sound has.',
    'Open the door, drag WALK into the workshop and press a STEP key. Then choose DRY in ROOM and step again: the short, quiet tail of room sound is gone.',
    'Drag WALK to the far west end of the path. GEN 1 reads VIRTUAL: you are past the generator’s maximum distance, as on the page before.',
  ],
};
