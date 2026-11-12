/**
 * Screen guide — page 21, "Game audio today". Pure data (the guide test
 * loads it under node). Voice: to the student, about THIS screen. A document
 * page: WHAT YOU CONTROL is what can be tapped or scrolled.
 */
import type { ScreenGuide } from '../../../../../features/lab/screenGuide/types.ts';

export const G21: ScreenGuide = {
  intro: {
    learning: 'Game audio today: implementation beside sound design, sound made by rules, spatial tools, adaptive music, testing, accessibility, and three places AI can sit.',
    start: 'Read the five short sections in order. In each one, find the idea you already used in this lab’s scene. Then answer the two checks at the end.',
  },
  seeing: [
    'You’re reading five short sections, each under a plain heading. There is no scene on this page.',
    'Four words of this page can be tapped. Two of them are real tools, given as examples of what a tool can do.',
    'Two checks close the page.',
  ],
  control: [
    'Nothing on this page starts a sound, and it has no dock.',
    'Scroll to read. Tap one of the four words under the first section to read its meaning.',
    'Tap an answer in each CHECK YOURSELF card. After a wrong answer you can try again.',
  ],
  changes: [
    'Nothing on this page moves. What changes is how you read the earlier pages: each section names work you already did in the scene.',
    'The generator you ran was a fixed loop: a speed value moved its pitch and level. A procedural generator would build the hum itself.',
  ],
  teaches: [
    'Implementation is knowledge of its own: when a sound plays, what changes it and what it costs.',
    'Procedural audio uses synthesis and rules a designer wrote. It is a different thing from generative AI.',
    'What a tool can do and what a game uses are separate questions.',
    'AI can sit in three places: asset creation, authoring help, or runtime generation. A team weighs control, repeatability, origin and cost.',
  ],
  tryThis: [
    'Read “Sound made by rules”, then think of the generator. Say what a procedural version would have to make that the fixed loop already contains.',
    'Take runtime generation through the four questions of the last section. Which one is hardest to answer for a sound that carries a warning?',
  ],
};
