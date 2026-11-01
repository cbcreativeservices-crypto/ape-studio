/**
 * Equalizer (the audible one-band FX lab, route EqLab, labId 'eq') —
 * "explain this screen" content (owner 2026-10-31, Screen Guide rollout;
 * standard = wave/waveScreenGuides.ts).
 *
 * The lab is ONE LabShell screen (FxLabScreen + eqConfig in fxLabConfigs.tsx)
 * with three tabs, so the guides are keyed by the shell's tab id — the same
 * shape as the sibling effect labs (chorusScreenGuides.ts and others):
 *   explore — the rack: the animated EqFlow hero (fxAnim), the bezel
 *             (TYPE · FREQ · GAIN · Q), the dock (FREQ fader · TYPE · GAIN ·
 *             Q · SOURCE), the header ▶, LAB NOTES (DESIGNED RESPONSE + its
 *             caption, THE AUDIO PATH, two CHECK YOURSELF cards, ⓘ GUIDED
 *             LESSON);
 *   learn   — the reading page (the 'eq' guided lesson in full);
 *   check   — CHECK YOUR UNDERSTANDING (understandingChecks.ts EQ, five
 *             questions). The SAME labId 'eq' check is rendered on the EQ Lab
 *             menu, so passing it in either place shows complete in both, and
 *             it is what completes the EQ Lab (trainingLabKeys tr_eq).
 *
 * Names are the on-screen names read from code; every TRY THIS number is what
 * the screen prints at that setting (the caption is eqConfig.heroCaption).
 * test/screenGuide_equalizer_20261031.test.ts pins the names and numbers.
 *
 * NOT WIRED YET: FxLabConfig (shared FxLabScreen) has no guide / accuracy
 * field and eqConfig lives in the shared fxLabConfigs.tsx — that change is the
 * coordinator's. When it lands: `guide: equalizerScreenGuide` and
 * `accuracy: false` on eqConfig (a concept lab: designed response, teaching
 * model, uncalibrated test audio — no live mic, no real-world measurement).
 *
 * Copy rules: plain language; KNOWLEDGE, never skills; no brand names; no
 * "N of total"; "suggest" never "recommend"; no build notes in learner text.
 */
import type { ScreenGuide } from '../../../features/lab/screenGuide/types';

/** The LabShell tabs this lab offers (LEARN, EXPLORE and — because labId 'eq'
 *  has an understanding check — CHECK). */
export type EqualizerScreenId = 'explore' | 'learn' | 'check';

export const EQUALIZER_SCREEN_GUIDES: Record<EqualizerScreenId, ScreenGuide> = {
  // ── EXPLORE — the rack ────────────────────────────────────────────────────
  explore: {
    seeing: [
      'A moving model, not the SOURCE you play: a test wave of three tones goes IN ▸, through the green EQ stage, and comes ▸ OUT reshaped.',
      'Under it, the EQ CURVE strip, 20 Hz → 20 kHz. Its dots are the wave’s 150 Hz · 1k · 6k tones; each grows or shrinks in OUT by the curve’s gain there.',
      'Readouts on the frame: TYPE, FREQ, GAIN and Q.',
    ],
    control: [
      'FREQ fader: where the band sits, 100 Hz to 8 kHz.',
      'TYPE key: PEAK (BELL), LOW SHELF, HIGH SHELF, HIGH-PASS or LOW-PASS, each with a one-line description.',
      'GAIN key: −12, −6, 0, +6 or +12 dB. Q key: 0.7 WIDE, 1.4, 4 or 8 NARROW.',
      'SOURCE key: PINK NOISE, SINE 440 Hz or WHITE NOISE. ▶ at the top right (or a tap on the display) plays it through the EQ; change any control while it plays.',
      'Long-press a control for its GUIDED LESSON entry. Below the dock, LAB NOTES holds DESIGNED RESPONSE, THE AUDIO PATH and two CHECK YOURSELF cards.',
    ],
    changes: [
      'FREQ moves the filter; the dots show which tones it lifts or lowers in OUT.',
      'GAIN sets how far a bell or shelf rises or falls. HIGH-PASS and LOW-PASS ignore it — they cut on a fixed slope.',
      'Q sets a bell’s width, 0.7 broad to 8 narrow. On LOW-PASS a high Q adds a bump before the cutoff; on HIGH-PASS Q does nothing.',
      'The pictures come from the same maths the audio runs — a designed response, not a measurement.',
    ],
    teaches: [
      'What one EQ band does — shape, frequency, gain and Q — seen and heard together.',
      'Pass filters have no gain: they remove one end on a fixed slope.',
      'Narrow Q is surgical; wide Q is a broad, musical move.',
      'The first lab in Equalization; the EQ Lab follows with many bands, your room’s live spectrum and trainers.',
    ],
    tryThis: [
      'Set Q to 8 NARROW: the bell turns thin and the caption under DESIGNED RESPONSE reads +6 dB at 1 kHz, Q 8.',
      'Switch TYPE to HIGH-PASS, then tap through GAIN: the curve does not move — a pass filter has no gain.',
      'Pick PINK NOISE, tap ▶ and sweep FREQ from bottom to top: you hear the boost travel from low to high.',
    ],
  },

  // ── LEARN — the reading page ──────────────────────────────────────────────
  learn: {
    seeing: [
      'The LEARN tab: the Equalizer guided lesson as one page to read. Nothing here plays.',
      'First what an equalizer is, then CONTROLS: the display, Filter type, Frequency, Gain and Q (bandwidth).',
      'Then COMMON MISTAKES, PRO TIPS and FORMULA / CONCEPT.',
    ],
    control: [
      'Scroll to read. The tabs under the title switch to EXPLORE (the live rack) and CHECK (the questions that complete the lab).',
      'On EXPLORE, ⓘ GUIDED LESSON at the end of LAB NOTES opens this same lesson as a sheet; long-press a key or readout there to open just its entry.',
    ],
    changes: [
      'Nothing on this page moves; it is the reference for what EXPLORE shows.',
      'Each CONTROLS entry names a key on EXPLORE: Filter type is TYPE, Frequency is FREQ, Gain is GAIN, Q (bandwidth) is Q.',
      'The ranges are the rack’s: Frequency 100 Hz to 8 kHz here (EQs reach about 20 Hz to 20 kHz), Gain −12 to +12 dB, Q 0.7 wide to 8 narrow.',
    ],
    teaches: [
      'The words for EQ: filter type, frequency, gain, Q, bandwidth, slope.',
      'Why a narrow-boost sweep finds a problem but the fix is usually a cut, and why a flat analyzer is not the goal.',
      'Q ≈ centre frequency ÷ bandwidth; slopes of 6, 12, 18 or 24 dB per octave are 1 to 4 poles.',
    ],
    tryThis: [
      'Read the Q (bandwidth) entry, then on EXPLORE play PINK NOISE and switch Q between 0.7 WIDE and 8 NARROW: tone against ring.',
      'Read the COMMON MISTAKES line on boosting, then on EXPLORE compare GAIN at +6 dB and −6 dB at the same FREQ.',
    ],
  },

  // ── CHECK — the questions that complete the lab ───────────────────────────
  check: {
    seeing: [
      'The CHECK tab: CHECK YOUR UNDERSTANDING for the Equalizer — five questions, four answers each.',
      'A line under the heading says how many are still to get right. A ✓ replaces a question’s number once you answer it right.',
    ],
    control: [
      'Tap an answer. Right: it turns green and CORRECT shows why. Wrong: NOT QUITE — TRY ANOTHER shows why, and you pick again straight away.',
      'There is no score, and a wrong answer costs nothing. A right answer stays right.',
      'The tabs under the title go to LEARN or EXPLORE at any time.',
    ],
    changes: [
      'The questions cover Q and width, the high-pass, graphic against parametric, slope, and cutting before boosting.',
      'When all five are right the card reads Lab complete. They are the same questions as on the EQ Lab menu, so both places show it complete.',
    ],
    teaches: [
      'It checks the ideas, not the knob positions: width, shape, slope and headroom.',
      'Passing it completes the EQ Lab too — they share this check. Dynamics comes next in Advanced Training.',
    ],
    tryThis: [
      'Before the Q question, on EXPLORE switch Q from 0.7 WIDE to 8 NARROW and watch the bell.',
      'For the slope question, on EXPLORE tap TYPE and read HIGH-PASS: a steady 12 dB-per-octave fall below FREQ — slope is a rate, not a set amount of cut.',
    ],
  },
};

/** The guide for a LabShell tab — LabShell's per-tab `guide` function. */
export function equalizerScreenGuide(mode: string): ScreenGuide | undefined {
  return mode === 'explore' || mode === 'learn' || mode === 'check' ? EQUALIZER_SCREEN_GUIDES[mode] : undefined;
}
