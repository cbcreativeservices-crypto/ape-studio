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
    'The second figure, in the workshop, is the guide, who speaks every line on this page. A mark beside the guide shows when a line plays.',
    'SPEAKING shows GREET or WARN for the line you would hear now. PRIORITY shows how important that line is: the higher number wins.',
    'Lower down, the caption shows you the words of a line while it plays, and a card shows both takes of each line.',
  ],
  control: [
    'LEVEL sets how loud the lab plays the guide’s voice and everything else. The slider starts on it.',
    'LINES holds GREETING and WARNING. Each key posts that line’s event for the guide. The tray also shows the caption and the newest log lines.',
    'LANGUAGE chooses ENGLISH or SPANISH for the next line: its text and its take.',
    'On the LINES key, GREET, WARN or QUIET tells you which line is speaking, if any.',
  ],
  changes: [
    'WARNING has the higher priority. Posted during the greeting, it interrupts it, and the log says INTERRUPTED.',
    'GREETING posted during the warning is REFUSED, and nothing new plays.',
    'In SPANISH each line plays a different, longer file and the caption shows the Spanish text. The log prints the SETTING when you change it.',
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
    'With SOUND on, play the greeting in ENGLISH, then in SPANISH. The Spanish line is longer and lower, and its caption stays for as long as it speaks.',
  ],
};
