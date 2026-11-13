/**
 * Screen guide — page 21, "Game audio today". Pure data (the guide test
 * loads it under node). Voice: to the student, about THIS screen. The page
 * is on the rack: TOPIC sets the scene up for one section at a time.
 */
import type { ScreenGuide } from '../../../../../features/lab/screenGuide/types.ts';

export const G21: ScreenGuide = {
  intro: {
    learning: 'Game audio today: implementation beside sound design, sound made by rules, spatial tools, adaptive music, testing, accessibility, and three places AI can sit.',
    start: 'Choose a TOPIC, then read its section. The scene shows what this lab really has of it. The two checks at the end complete this page.',
  },
  seeing: [
    'You are looking at the courtyard and the workshop, with a strip under them. Which strip it is depends on the TOPIC.',
    'The line at the top of the well says what the scene shows now. Each section title names its TOPIC.',
    'Four words of this page can be tapped. Two of them are real tools, given as examples of what a tool can do.',
  ],
  control: [
    'TOPIC opens RULES, SPACE, MUSIC, ACCESS, TEST and AI. Each one stops what plays and sets the scene up again.',
    'SPEED changes the generator’s speed. The third key is the topic’s own action, such as BURST or GUIDE LINE. AI has none.',
    'Tap an answer in each CHECK YOURSELF card. After a wrong answer you can try again.',
  ],
  changes: [
    'RULES: SPEED moves the hum’s pitch and level. It is a fixed loop: nothing in this lab is procedural.',
    'SPACE shows the wall’s treatment, MUSIC the bars and a waiting change, ACCESS a sign and a caption, TEST the voices stolen in a burst.',
    'AI shows nothing, because the lab has no AI. Every sound here is a file made ahead of time.',
  ],
  teaches: [
    'Implementation is knowledge of its own: when a sound plays, what changes it and what it costs.',
    'Procedural audio uses synthesis and rules a designer wrote. It is a different thing from generative AI.',
    'AI can sit in three places: asset creation, authoring help, or runtime generation. A team weighs control, repeatability, origin and cost.',
  ],
  tryThis: [
    'Choose RULES and move SPEED. Say what a procedural version would have to make that the fixed loop already contains.',
    'Choose TEST and press BURST twice. Read the log: which voices were taken first, and why?',
  ],
};
