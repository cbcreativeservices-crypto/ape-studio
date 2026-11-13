/**
 * Screen guide — the Game Audio Lab's what's-left screen (the shared end
 * screen, kit/LabEndScreen, in progress mode). Pure data. Every name quoted
 * here is the end screen's own (pinned by the guide test).
 *
 * WHEN A PAGE IS DONE differs by page, and this guide says so: a page with
 * the scene needs every goal in one visit; the two reading pages (20, 21)
 * need their checks (six and two); the capstone (22) needs its seven goals,
 * and its check is optional.
 *
 * TWO NAMES FOR ONE SCREEN (audit 2, W2-29). The shared shell heads this
 * screen "Where you are" (kit/PagedLab) and titles its list WHAT'S LEFT
 * (kit/LabEndScreen). One name is the shell's to give; the guide names both
 * so a learner is not lost.
 *
 * `learning` is the lab's own subtitle, which the shell shows nowhere for
 * this lab (audit 2, L-37).
 */
import type { ScreenGuide } from '../../../../../features/lab/screenGuide/types.ts';

export const GA_END_GUIDE: ScreenGuide = {
  intro: {
    learning: 'How a game asks for sound, and how the audio side answers: what plays, where it goes and what is stopped first.',
    start: 'Tap the first page still listed to go straight to it. Or tap REVIEW ▾ on the ✓ DONE line to reopen a page you have finished.',
  },
  seeing: [
    'This screen is headed Where you are. Its list is titled WHAT’S LEFT while pages are still to do, and LAB COMPLETE once every page is done. If your saved progress cannot be read, it reads YOUR PROGRESS.',
    'Each page still to do is listed by name. Finished pages fold into one ✓ DONE line.',
  ],
  control: [
    'Tap any listed page to jump straight to it.',
    'Tap REVIEW ▾ on the ✓ DONE line to see your finished pages, and tap one to open it again. HIDE ▴ folds them away.',
    'DONE · BACK TO LABS leaves the lab.',
  ],
  changes: [
    'A page with the scene is done when every goal on it is ✓ in one visit. Page 20 is done when its six checks are passed, page 21 when its two are. The capstone is done when its seven goals are ✓.',
    'Moving on does not finish a page. Goals start empty each visit, and reopening a finished page to practice does not clear its ✓ DONE.',
  ],
  teaches: [
    'Game sound is built from behaviors that wait to be asked for: events start sounds, and switches, states and parameters shape them.',
    'Every sound has a place in a mix and a share of a budget; priority decides what is stopped first.',
    'The activity log shows what really happened, as the profiler of a real tool does.',
    'You have not opened a real tool in this lab. Page 20 is the map to take with you when you do.',
  ],
  tryThis: [
    'Open the page you found hardest and finish one goal you missed. Read the activity log line that proves it.',
    'Reopen the capstone and build the scene again from the start. Which goal do you now reach without a hint?',
  ],
};
