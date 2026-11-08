/**
 * Stereo Imaging Lab — "explain this screen" content (Screen Guide rollout,
 * 2026-10-31; standard = wave/waveScreenGuides.ts).
 *
 * The lab is ONE LabShell screen (FxLabScreen + stereoConfig in
 * fxLabConfigs.tsx) with three tabs, so the guides are keyed by the shell's
 * tab id:
 *   explore — the rack: the animated signal-flow display (IN ▸ · M/S WIDTH ·
 *             ▸ OUT), the WIDTH / PAN / BASS / FOLD readouts, the WIDTH fader and the
 *             PAN / BASS / FOLD / SOURCE keys, LAB NOTES (DESIGNED RESPONSE:
 *             goniometer + CORRELATION, THE AUDIO PATH, two CHECK YOURSELF);
 *   learn   — the reading page (the guided lesson 'stereo' in full);
 *   check   — CHECK YOUR UNDERSTANDING (understandingChecks.ts STEREO),
 *             ending on FINISH · SEE WHAT'S LEFT › (STEREO_END_GUIDE).
 *
 * Every name is the on-screen name in fxLabConfigs.tsx (stereoConfig),
 * FxLabScreen.tsx, fxAnim.tsx (StereoFlow), fxViz.tsx (LissajousGraph),
 * LabShell.tsx, RackUnit.tsx and LabUnderstandingCheck.tsx.
 *
 * Every number in TRY THIS was worked out from LissajousGraph's own maths (the
 * width lab's test tone: R lags L by STEREO_TEST_LR_RAD = 1.1 rad). With
 * c = cos 1.1 = 0.4536 and w = WIDTH ÷ 100, the drawn correlation is
 *   (1 + c − w²(1 − c)) ÷ (1 + c + w²(1 − c))
 * → +1.00 at 0%, +0.83 at 50%, +0.45 at 100%, −0.20 at 200% (it crosses 0
 * near 163%, so this tone can never read near −1). PAN is the engine's
 * constant-power law (Effects.hpp StereoEffect; fxAnim mirrors it): at L the
 * right output is 0 and the left is ×√2 (+3 dB). The test re-runs them.
 *
 * Deliberately NOT claimed (screen-code notes for the auditors): the
 * DESIGNED RESPONSE goniometer is drawn from WIDTH and SOURCE only (PAN and
 * MONO-FOLD do not reach LissajousGraph), so no step reads the goniometer
 * after a fold or a pan; and the flow display folds AFTER the pan while the
 * engine folds BEFORE it, so no step combines MONO CHECK with PAN L or R.
 *
 * STEPPED: each section must fit SCREEN_GUIDE_BUDGET (types.ts).
 * Copy rules: plain language, short sentences; KNOWLEDGE, never skills; no
 * gear brand names; no "N of total"; "suggest" never "recommend"; no build
 * notes in learner text. test/screenGuide_stereo_20261031.test.ts pins it.
 */
import type { ScreenGuide } from '../../features/lab/screenGuide/types';

/** The LabShell tabs this lab offers (it has an understanding check). */
export type StereoScreenId = 'explore' | 'learn' | 'check';

export const STEREO_SCREEN_GUIDES: Record<StereoScreenId, ScreenGuide> = {
  // ── EXPLORE — the rack ────────────────────────────────────────────────────
  explore: {
    intro: {
      learning: 'How stereo splits into MID (what L and R share) and SIDE (what differs), why widening turns up the SIDE, and why the SIDE cancels in mono.',
      start: 'Tap ▶ and open LAB NOTES. Slide WIDTH from 0% to 200% and watch CORRELATION fall. Then set FOLD to MONO CHECK and watch the OUT traces merge.',
    },
    seeing: [
      'Signal flow: IN ▸, the green M/S WIDTH stage, ▸ OUT. MID is what L and R share; SIDE is what differs. Amber: L. Blue: R.',
      'IN shows a test tone, not your source: STEREO TEST TONE · L ≠ R (R lags L); with SOURCE MONO, SAME TONE IN L AND R.',
      'Readouts: WIDTH, PAN, BASS and FOLD (STEREO or MONO).',
      'LAB NOTES, DESIGNED RESPONSE: a goniometer, L plotted against R (M up, S across), and a CORRELATION meter, −1 to +1.',
    ],
    control: [
      'Slide WIDTH (0–200%) to scale the SIDE against the MID. 100% is the image as recorded; double-tap the lane to return there.',
      'PAN: L, CENTER or R, a balance control. At L the right channel is muted and the left is lifted 3 dB. BASS: OFF or 120 Hz. At 120 Hz the SIDE is filtered out below about 120 Hz, so the lows go mono.',
      'FOLD: STEREO or MONO CHECK, which adds left and right together, as a single speaker would.',
      'SOURCE: PINK NOISE · STEREO, SINE 440 Hz · STEREO, or PINK NOISE · MONO (nothing to widen).',
      'Tap ▶ (top right) or the display to play the source. Long-press any key or readout to read about it. LAB NOTES end with two CHECK YOURSELF questions and ⓘ GUIDED LESSON.',
    ],
    changes: [
      'A stereo signal splits into MID and SIDE, and WIDTH scales only the SIDE.',
      'At 0% there is no SIDE, so the OUT traces become one line. Past 100% the SIDE is louder than recorded: the traces pull apart and CORRELATION falls.',
      'MONO CHECK adds L and R: the SIDE cancels and only the MID survives.',
      'PAN at L or R silences the other side and lifts the kept side 3 dB, so total power stays the same.',
    ],
    teaches: [
      'Stereo width is the balance of SIDE against MID: a widener turns up what differs between the channels.',
      'Width trades against mono safety: what is wide can cancel when L and R are added, as on phone speakers and many PAs.',
      'Correlation is the gauge: +1 mono, 0 unrelated, −1 cancels in mono.',
      'A pan here only shifts level between the channels. It adds none of the timing cues your ears also use.',
    ],
    tryThis: [
      'Open LAB NOTES and slide WIDTH: CORRELATION reads +1.00 at 0%, +0.45 at 100% and −0.20 at 200%. The goniometer’s vertical line opens out sideways.',
      'At WIDTH 200%, set FOLD to MONO CHECK: the two OUT traces glide onto one line. The extra width is gone in mono.',
      'With FOLD on STEREO, set PAN to L: the blue R trace on OUT goes flat and the amber one grows. The right channel is muted, not moved.',
    ],
  },

  // ── LEARN — the reading page ──────────────────────────────────────────────
  learn: {
    intro: {
      learning: 'The words and sums behind stereo imaging: Mid and Side, width, mono compatibility, correlation and the phantom center, plus the usual widening mistakes.',
      start: 'Read the display entry and COMMON MISTAKES. Then switch to EXPLORE, set WIDTH to 0% and check that CORRELATION in LAB NOTES reads +1.00.',
    },
    seeing: [
      'This is the Stereo Imaging guided lesson as one page to read. ▶ in the header still plays the source you set on EXPLORE.',
      'It starts with what stereo imaging is, then CONTROLS: the display, PAN, WIDTH, Mid gain (M) and Side gain (S), FOLD, BASS and three ADV entries.',
      'Then come COMMON MISTAKES, PRO TIPS and FORMULA / CONCEPT: the Mid/Side sums and what correlation measures.',
    ],
    control: [
      'Scroll to read. Use the tabs under the title to switch between LEARN, EXPLORE and CHECK; EXPLORE is the live rack.',
      'On EXPLORE, ⓘ GUIDED LESSON at the end of LAB NOTES opens this same lesson as a sheet over the rack.',
      'On EXPLORE, long-press WIDTH, PAN, BASS, FOLD or a readout to read just its entry. Long-press a SOURCE choice for that test signal’s own note.',
    ],
    changes: [
      'Nothing on this page moves. Use it to explain what the OUT traces and CORRELATION show you on EXPLORE.',
      'Mid gain (M), Side gain (S) and the ADV entries describe controls you won’t find on EXPLORE. There you have WIDTH, PAN, BASS and FOLD.',
      'The FORMULA builds MID from L + R and SIDE from L − R. WIDTH scales the SIDE, then the two are turned back into L and R.',
    ],
    teaches: [
      'The words: Mid, Side, width, mono compatibility, correlation, and the phantom center (a sound heard between the speakers when L and R match).',
      'The usual mistakes: over-widening, widening the bass, and hearing “wider” when it is only louder.',
      'A suggested starting order from PRO TIPS: bass mono first, then width, then a mono check and the correlation reading.',
    ],
    tryThis: [
      'Read the display entry, then on EXPLORE set WIDTH to 0%: in LAB NOTES the goniometer is a vertical line and CORRELATION reads +1.00. That’s mono.',
      'Read the “louder” vs “wider” mistake, then on EXPLORE slide WIDTH from 100% to 200%: the OUT traces pull apart and grow. More SIDE is also more level.',
    ],
  },

  // ── CHECK — the understanding check ───────────────────────────────────────
  check: {
    intro: {
      learning: 'A review of stereo imaging: what WIDTH really changes, what a mono fold does to a wide mix, why bass is kept mono, and what correlation warns of.',
      start: 'Read each question and tap a choice. Unsure? Switch to EXPLORE, try the idea with WIDTH and FOLD while watching CORRELATION, then come back.',
    },
    seeing: [
      'CHECK YOUR UNDERSTANDING and the lab’s title, then four questions: what WIDTH changes, a fold to mono at 200%, why bass goes mono, and a correlation near −1.',
      'Each card has a question and its choices. A right answer turns green and its number becomes ✓; CORRECT or NOT QUITE — TRY ANOTHER heads the explanation.',
      'When all are right, it reads: Every question answered correctly — this lab is complete.',
    ],
    control: [
      'Tap a choice. A wrong one shows its explanation in amber; pick another straight away. Nothing is lost and there is no score.',
      'A right one locks green and shows why. The choices are shuffled, so position never gives the answer away.',
      'Answers already right stay right if you switch to LEARN or EXPLORE and come back. Leave the lab before the last one and the check starts over.',
      'Below the questions, FINISH · SEE WHAT’S LEFT › opens Where you are: the check’s status and the way back to labs.',
    ],
    changes: [
      'Every answer shows its explanation, right or wrong, so each question adds to what you know about width and mono.',
      'Get all four right and the lab is complete.',
      'A pass is kept: come back later and the check shows as already cleared.',
    ],
    teaches: [
      'Width and a mono fold both work on the same two parts of a stereo signal: MID and SIDE.',
      'Low frequencies are often kept mono; the frequency is a suggested starting point, checked by ear.',
      'What the correlation meter warns of, before anyone folds the mix to mono.',
    ],
    tryThis: [
      'Before you start, push WIDTH to 200% on EXPLORE: CORRELATION reads −0.20. Then think about what a reading near −1 would mean when L and R are added.',
      'Unsure what a mono fold does? On LEARN, read FORMULA / CONCEPT: how MID and SIDE are built from L and R. Then work out what adding L and R leaves.',
    ],
  },
};

/** The what's-left screen (LabShell's LabCheckEnd, passed as `checkEnd`):
 *  FINISH · SEE WHAT'S LEFT › under the CHECK opens it as a full-screen layer
 *  over FxLabScreen (stereoConfig). Every line is true of kit/LabEndScreen
 *  in "credit" mode with the lab's one unit, the understanding check: the row and PRACTICE
 *  AGAIN close the layer (nothing is cleared), DONE · BACK TO LABS leaves. */
export const STEREO_END_GUIDE: ScreenGuide = {
  intro: {
    learning: 'A look back at stereo imaging: how WIDTH, a mono fold, mono bass and CORRELATION shape what a mono listener hears.',
    start: 'Read WHAT’S LEFT. If the check’s row is still there, tap it to go back to CHECK. Otherwise tap ‹ BACK TO THE LAB to keep listening.',
  },
  seeing: [
    'Under Where you are: the lab’s name, then WHAT’S LEFT, or LAB COMPLETE once you’ve passed the check. If saved progress can’t be read, it says YOUR PROGRESS.',
    'While the check is still to do, one row shows CHECK · Understanding check. Once passed, it folds into a ✓ CREDITED line (✓ DONE when you’re not signed in); REVIEW ▾ opens it.',
    'The line under the title says what’s left and whether your work is saved.',
  ],
  control: [
    'Tap ‹ BACK TO THE LAB, or the check’s row, to return to the lab exactly as you left it.',
    'PRACTICE AGAIN FROM THE START also takes you back to the lab; it clears nothing.',
    'DONE · BACK TO LABS leaves the lab.',
  ],
  changes: [
    'The check counts once every answer is right. If you’re signed in, it’s saved to your account once, and you never take it twice.',
    'If you’re signed out, the line under the title says whether signing in can still keep it. Practicing again never takes it away.',
  ],
  teaches: [
    'Every width decision is also a mono decision: whatever you widen, check it folded to mono.',
    'Keeping the bass mono and watching CORRELATION protect a mix for anyone listening in mono.',
  ],
  tryThis: [
    'If the check is still listed, tap its row to go back to CHECK. Answer all four, then FINISH · SEE WHAT’S LEFT › shows LAB COMPLETE.',
    'Once it’s passed, tap ‹ BACK TO THE LAB. On EXPLORE, set WIDTH 200% and FOLD to MONO CHECK again, and listen to what happens to the width.',
  ],
};

/** The guide for a LabShell tab — LabShell's per-tab `guide` function. */
export function stereoScreenGuide(mode: string): ScreenGuide | undefined {
  return mode === 'explore' || mode === 'learn' || mode === 'check' ? STEREO_SCREEN_GUIDES[mode] : undefined;
}
