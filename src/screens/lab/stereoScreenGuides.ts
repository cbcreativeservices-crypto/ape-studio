/**
 * Stereo Imaging Lab — "explain this screen" content (Screen Guide rollout,
 * 2026-10-31; standard = wave/waveScreenGuides.ts).
 *
 * The lab is ONE LabShell screen (FxLabScreen + stereoConfig in
 * fxLabConfigs.tsx) with three tabs, so the guides are keyed by the shell's
 * tab id:
 *   explore — the rack: the animated signal-flow display (IN ▸ · M/S WIDTH ·
 *             ▸ OUT), the WIDTH / PAN / FOLD readouts, the WIDTH fader and the
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
    seeing: [
      'Signal flow: IN ▸, the green M/S WIDTH stage (MID = what L and R share, SIDE = what differs), ▸ OUT. Amber = L, blue = R.',
      'IN: a tone whose R lags L, STEREO TEST TONE · L ≠ R (PINK NOISE · MONO: SAME TONE IN L AND R).',
      'Readouts: WIDTH, PAN and FOLD (STEREO, or MONO during a mono check).',
      'LAB NOTES, DESIGNED RESPONSE: a goniometer, a picture of L against R (M up, S across), and a CORRELATION meter, −1 to +1.',
    ],
    control: [
      'WIDTH fader (0–200%): scales the SIDE against the MID. 100% is the image as recorded; double-tap the lane to return there.',
      'PAN key: L, CENTER or R — a balance control: at L the right channel is muted and the left is lifted 3 dB. BASS key: OFF or 120 Hz — the SIDE is filtered out below about 120 Hz, so the lows go mono.',
      'FOLD key: STEREO or MONO CHECK — adds left and right together, as a single speaker would.',
      'SOURCE key: PINK NOISE · STEREO, SINE 440 Hz · STEREO, or PINK NOISE · MONO (nothing to widen).',
      '▶ (top right) or a tap on the display plays the source. Long-press any key or readout for its lesson entry. LAB NOTES end with two CHECK YOURSELF questions and ⓘ GUIDED LESSON.',
    ],
    changes: [
      'A stereo signal splits into MID (what L and R share) and SIDE (what differs). WIDTH scales only the SIDE.',
      'At 0% there is no SIDE: the OUT traces become one line. Past 100% the SIDE is louder than recorded: they pull apart, CORRELATION falls.',
      'MONO CHECK adds L and R: the SIDE cancels and only the MID survives.',
      'PAN at L or R silences the other side and lifts the kept side 3 dB (constant-power pan).',
    ],
    teaches: [
      'Stereo width is the balance of SIDE against MID: a widener turns up what differs between the channels.',
      'Width trades against mono safety: what is wide can cancel when L and R are added (phone speakers, many PAs).',
      'Correlation is the gauge: +1 mono, 0 unrelated, −1 cancels in mono.',
      'It shares its goniometer with the Phase lab; Binaural Panner, next in Stereo & Spatial, adds the timing cues a pan leaves out.',
    ],
    tryThis: [
      'Open LAB NOTES and slide WIDTH: CORRELATION reads +1.00 at 0%, +0.45 at 100% and −0.20 at 200% — the goniometer’s vertical line opens out sideways.',
      'At WIDTH 200%, set FOLD to MONO CHECK: the two OUT traces glide onto one line. The extra width is gone in mono.',
      'With FOLD on STEREO, set PAN to L: the blue R trace on OUT goes flat and the amber one grows — the right channel is muted, not moved.',
    ],
  },

  // ── LEARN — the reading page ──────────────────────────────────────────────
  learn: {
    seeing: [
      'The LEARN tab: this lab’s guided lesson as one page to read. Nothing here plays.',
      'First what stereo imaging is, then CONTROLS: the display, Pan, Width, Mid and Side gain, Mono-fold, Bass-Mono and three ADV entries.',
      'Then COMMON MISTAKES, PRO TIPS and FORMULA / CONCEPT — the Mid/Side sums and what correlation measures.',
    ],
    control: [
      'Scroll to read. The tabs under the title switch between LEARN, EXPLORE and CHECK; EXPLORE is the live rack.',
      'On EXPLORE, ⓘ GUIDED LESSON at the end of LAB NOTES opens this same lesson as a sheet over the rack.',
      'On EXPLORE, long-press WIDTH, PAN, BASS, FOLD or a readout to open just its entry; long-press a SOURCE choice for that test signal’s own note.',
    ],
    changes: [
      'Nothing on this page moves — it is the reference for what EXPLORE shows.',
      'Mid gain, Side gain and the ADV entries describe controls this screen does not have. EXPLORE offers WIDTH, PAN, BASS-MONO and MONO-FOLD.',
      'The FORMULA builds MID from L + R and SIDE from L − R; WIDTH scales the SIDE, then the two are turned back into L and R.',
    ],
    teaches: [
      'The words: Mid, Side, width, mono compatibility, correlation, phantom center.',
      'The usual mistakes: over-widening, widening the bass, and hearing "wider" when it is only louder.',
      'A suggested starting order from PRO TIPS: bass mono first, then width, then a mono check and the correlation reading.',
    ],
    tryThis: [
      'Read the display entry, then on EXPLORE set WIDTH to 0%: in LAB NOTES the goniometer is a vertical line and CORRELATION reads +1.00 — mono.',
      'Read the “louder” vs “wider” mistake, then on EXPLORE slide WIDTH from 100% to 200%: the OUT traces pull apart and grow — more SIDE is also more level.',
    ],
  },

  // ── CHECK — the understanding check ───────────────────────────────────────
  check: {
    seeing: [
      'CHECK YOUR UNDERSTANDING and the lab’s title, then four questions: what WIDTH changes, a fold to mono at 200%, why bass goes mono, and a correlation near −1.',
      'Each card: a question and its choices. A right answer turns green and its number becomes ✓; CORRECT or NOT QUITE — TRY ANOTHER heads the explanation.',
      'When all are right: Every question answered correctly — this lab is complete.',
    ],
    control: [
      'Tap a choice. A wrong one shows its explanation in amber — pick another straight away; nothing is lost and there is no score.',
      'A right one locks green and shows why. The choices are shuffled, so position never gives the answer away.',
      'Answers already right stay right if you switch to LEARN or EXPLORE and come back; leaving the lab before the last one starts the check over.',
      'Below the questions, FINISH · SEE WHAT’S LEFT › opens Where you are: the check’s status and the way back to labs.',
    ],
    changes: [
      'Every answer shows its explanation, right or wrong, so each question teaches.',
      'When the last one is right, the lab is marked complete. It counts toward any certificate or program that needs it — once.',
      'Come back later and the check shows as already cleared.',
    ],
    teaches: [
      'Width = SIDE against MID; a mono fold cancels the SIDE.',
      'Why low frequencies are often kept mono — a suggested starting point, checked by ear.',
      'What a correlation near −1 means for a mono listener.',
    ],
    tryThis: [
      'Before starting, on EXPLORE push WIDTH to 200%: CORRELATION reads −0.20. A reading near −1, the check’s case, would cancel almost completely in mono.',
      'Also before starting: at WIDTH 200% set FOLD to MONO CHECK and watch the OUT traces merge — the mono-fold question, seen.',
    ],
  },
};

/** The what's-left screen (LabShell's LabCheckEnd, passed as `checkEnd`):
 *  FINISH · SEE WHAT'S LEFT › under the CHECK opens it as a full-screen layer
 *  over FxLabScreen (stereoConfig). Every line is true of kit/LabEndScreen
 *  in "credit" mode with the lab's one unit, the understanding check: the row and PRACTICE
 *  AGAIN close the layer (nothing is cleared), DONE · BACK TO LABS leaves. */
export const STEREO_END_GUIDE: ScreenGuide = {
  seeing: [
    'Under Where you are, the lab’s name, then WHAT’S LEFT, or LAB COMPLETE once the check is passed; YOUR PROGRESS if your saved progress could not be read.',
    'One row, CHECK · Understanding check, while it is still to do. Once passed it folds into a ✓ CREDITED line (✓ DONE when you are not signed in); REVIEW ▾ shows it.',
    'The line under the title says what is left and whether your work is saved.',
  ],
  control: [
    '‹ BACK TO THE LAB, or the check’s row, closes this screen and returns to the lab exactly as you left it.',
    'PRACTICE AGAIN FROM THE START also returns to the lab; it clears nothing.',
    'DONE · BACK TO LABS leaves the lab.',
  ],
  changes: [
    'The check counts once every answer is right. Signed in, it is credited to your account once and never has to be taken twice.',
    'Signed out, the line under the title says whether signing in can still keep it. Practicing again never removes credit.',
  ],
  teaches: [
    'Whether this lab is complete, and what is still left to finish it.',
    'The lab can always be opened again for practice; nothing earned is taken away.',
  ],
  tryThis: [
    'If the check is still listed, tap its row: you are back on the CHECK tab. Answer all four, then FINISH · SEE WHAT’S LEFT › shows LAB COMPLETE.',
    'Once it is passed, tap ‹ BACK TO THE LAB and on EXPLORE try WIDTH 200% with FOLD on MONO CHECK again: practice never removes the credit.',
  ],
};

/** The guide for a LabShell tab — LabShell's per-tab `guide` function. */
export function stereoScreenGuide(mode: string): ScreenGuide | undefined {
  return mode === 'explore' || mode === 'learn' || mode === 'check' ? STEREO_SCREEN_GUIDES[mode] : undefined;
}
