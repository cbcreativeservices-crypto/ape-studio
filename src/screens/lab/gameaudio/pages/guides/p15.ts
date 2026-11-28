/**
 * Screen guide — page 15, "Dialogue and languages". Pure data (the guide
 * test loads it under node). Voice: to the student, about THIS screen.
 */
import type { ScreenGuide } from '../../../../../features/lab/screenGuide/types.ts';

export const G15: ScreenGuide = {
  intro: {
    learning: 'How a game runs spoken lines: priority decides which line may interrupt, and text and audio change language together.',
    start: 'Open LINES and press GREETING. While the guide speaks, press WARNING, then GREETING again immediately, and read the log. Then set LANGUAGE to SPANISH and play the greeting.',
  },
  seeing: [
    'The guide, in the workshop, speaks every line. A mark beside the guide shows when a line plays.',
    'SPEAKING shows GREET, WARN or QUIET. PRIORITY: the higher number wins.',
    'The strip draws each line as a bar as long as its file. It fills while the line speaks, and marks INTERRUPTED or REFUSED.',
    'Lower down: the caption, and a card with both takes of each line.',
  ],
  control: [
    'LEVEL sets how loud the lab plays the guide’s voice and everything else. The slider controls it when the page opens.',
    'LINES holds GREETING and WARNING, each with its priority. Each key posts that line’s event for the guide. The tray also shows the caption and what happened last.',
    'LANGUAGE chooses ENGLISH or SPANISH for the next line: its text and its take. ✓ marks the one in use.',
    'On the LINES key, GREET, WARN or QUIET tells you which line is speaking, if any.',
  ],
  changes: [
    'WARNING has the higher priority. Posted during the greeting, it interrupts it, and the log says INTERRUPTED.',
    'GREETING posted during the warning is REFUSED, and nothing new plays. That is this scene’s rule; other games make the line wait.',
    'In SPANISH each line plays a different, longer file: its START line names the file, and the caption shows the Spanish text.',
  ],
  teaches: [
    'A dialogue system chooses which recorded line plays, and when. Priority settles what happens when two lines want to speak together.',
    'Text and audio belong to the same event, so they change language together.',
    'Translated lines often differ in length, so timing follows the file that plays.',
    'Recorded character dialogue and live voice chat between players are different systems.',
  ],
  tryThis: [
    'Press GREETING, then WARNING while it speaks. Watch the caption change at the moment the audio changes.',
    'Press WARNING, then GREETING immediately. Find the REFUSED line in the log and read its reason.',
    'Play the greeting in ENGLISH, then in SPANISH, and compare the two START lines: the same line, a different file. With SOUND on, the Spanish take is longer and lower.',
  ],
};
