/**
 * Screen guide — the Game Audio Lab's what's-left screen (the shared end
 * screen, kit/LabEndScreen, in progress mode). Pure data. Every name quoted
 * here is the end screen's own (pinned by the guide test).
 *
 * WHEN A PAGE IS DONE differs by page, and this guide says so: a page with
 * the scene needs every goal in one visit; the two reading pages (20, 21)
 * need their checks; the capstone (22) needs its seven goals, and its check
 * is optional.
 */
import type { ScreenGuide } from '../../../../../features/lab/screenGuide/types.ts';

export const GA_END_GUIDE: ScreenGuide = {
  intro: {
    learning: 'A look back over game sound as one system: the game asks by name, and the audio side decides what plays, where it goes and what is stopped first.',
    start: 'Tap the first page still listed to go straight to it. Or tap REVIEW ▾ on the ✓ DONE line to reopen a page you have finished.',
  },
  seeing: [
    'The title reads WHAT’S LEFT while pages are still to do, and LAB COMPLETE once every page is done. If your saved progress can’t be read, it reads YOUR PROGRESS.',
    'Each page still to do is listed by name. Finished pages fold into one ✓ DONE line.',
  ],
  control: [
    'Tap any listed page to jump straight to it.',
    'Tap REVIEW ▾ on the ✓ DONE line to see your finished pages, and tap one to open it again. HIDE ▴ folds them away.',
    'DONE · BACK TO LABS leaves the lab.',
  ],
  changes: [
    'A page with the scene is done when every goal on it is ✓ in one visit. The two reading pages are done when their checks are passed. The capstone is done when its seven goals are ✓.',
    'Tapping NEXT moves on but does not finish a page. Goals start empty each visit, and reopening a finished page to practice does not clear its ✓ DONE.',
  ],
  teaches: [
    'Game sound is built from behaviors that wait to be asked for: events start sounds, and switches, states and parameters shape them.',
    'Every sound has a place in a mix and a share of a budget; priority decides what is stopped first.',
    'The activity log is how you find out what really happened: the same habit the profiler in a real tool asks for.',
  ],
  tryThis: [
    'Open the page you found hardest and finish one goal you missed. Read the activity log line that proves it.',
    'Reopen the capstone and wire the scene again from the start. Which step do you now do without reading the page?',
  ],
};
