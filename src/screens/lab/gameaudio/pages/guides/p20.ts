/**
 * Screen guide — page 20, "Finding your way in the tools". Pure data (the
 * guide test loads it under node). Voice: to the student, about THIS screen.
 * A document page: WHAT YOU CONTROL is what can be tapped or scrolled.
 */
import type { ScreenGuide } from '../../../../../features/lab/screenGuide/types.ts';

export const G20: ScreenGuide = {
  intro: {
    learning: 'The kinds of window most game audio tools have, and the closest name four tools give to each idea of this lab.',
    start: 'Read the picture of the eight usual windows and match each number to its line below. Then scroll to the name cards and find the idea you know best.',
  },
  seeing: [
    'You’re looking at a simplified tool window, not one real product. Its eight numbered panels are the kinds of window most game audio tools have.',
    'Under it, each number has a line: what you do in that window, and the page of this lab where you met the idea.',
    'Below are twelve cards. Each takes one idea from this lab and gives its closest name in four tools.',
  ],
  control: [
    'This is a reading page. It has no scene and no dock, and no sound plays on it.',
    'Scroll to read the three sections in order.',
    'Tap one of this page’s six words to read its meaning. From there you can open its glossary entry.',
    'At the end, tap an answer in each of the four CHECK YOURSELF cards. A wrong answer explains itself, and you can answer again.',
  ],
  changes: [
    'The picture and the cards do not change. They are a lookup aid to come back to.',
    'One line does change: the note under the windows counts the lines your activity log has printed, because that log is this lab’s profiler.',
    'A dash on a card is a real answer: that tool has no close idea of its own.',
  ],
  teaches: [
    'Tools differ in names and layout, but the same ideas return: sound files, events, game information, properties, a mixer, a music editor, a way to audition and a profiler.',
    'A name on a card is the closest idea in that tool, not an exact equal. The tools organize these ideas differently.',
    'Middleware is optional. A game engine has audio of its own.',
  ],
  tryThis: [
    'Find panel 8 in the picture, then read its line. Name the two pages of this lab where you used the same kind of record.',
    'On the Switch card, compare the four lines: one tool has a Switch, one a labeled parameter, one a node in a graph, and one shows a dash.',
    'Pick the idea you found hardest in this lab. Read its card, then say in one sentence what it does, without using any tool’s name.',
  ],
};
