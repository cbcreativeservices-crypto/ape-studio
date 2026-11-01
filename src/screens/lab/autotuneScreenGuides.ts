/**
 * Autotune Lab — "explain this screen" content (Screen Guide rollout,
 * 2026-10-31; standard = wave/waveScreenGuides.ts).
 *
 * The lab is ONE LabShell screen with three tabs, so the guides are keyed by
 * the shell's tab id:
 *   explore — the rack: the cents grid, the AMOUNT / SPEED / NOTE / ENDS
 *             bezel, the AMOUNT fader, the SPEED tray, the PLAY key, LAB NOTES;
 *   learn   — the reading page (the guided lesson in full);
 *   check   — the shared understanding check (four questions).
 *
 * Every name is the on-screen name in AutotuneLabScreen.tsx (bezel keys,
 * dock labels, the SPEED options), guidedLessons/content.ts (autotune) and
 * components/LabUnderstandingCheck.tsx. Every number in TRY THIS is what the
 * screen prints, worked from the lab's own curve:
 *   ENDS = round(|c₀·(1−a) + c₀·a·e^(−t/τ)|), c₀ = −45 ¢ (the E4 row),
 *   t = 1.1 s (NOTE_MS), τ = 0.025 / 0.12 / 0.4 s:
 *     OFF (a = 0)        → 45¢
 *     100% · FAST/MEDIUM → 0¢
 *     100% · SLOW        → 45·e^(−2.75) = 2.88 → 3¢
 *     50% · MEDIUM       → 22.50 → 23¢ (22–23¢ either side of 50%)
 * test/screenGuide_autotune_20261031.test.ts re-runs those sums.
 *
 * STEPPED: each section must fit SCREEN_GUIDE_BUDGET (types.ts).
 * Copy rules: plain language; KNOWLEDGE, never skills; no gear brand names;
 * no "N of total"; "suggest" never "recommend"; no build notes.
 */
import type { ScreenGuide } from '../../features/lab/screenGuide/types';

/** The LabShell tabs this lab offers. */
export type AutotuneScreenId = 'explore' | 'learn' | 'check';

export const AUTOTUNE_SCREEN_GUIDES: Record<AutotuneScreenId, ScreenGuide> = {
  // ── EXPLORE — the rack ────────────────────────────────────────────────────
  explore: {
    seeing: [
      'The cents grid: one vertical line per semitone, note names along the top. A cent is 1/100 of a semitone. Each row is one note of a six-note demo melody, sung out of tune on purpose.',
      'Gray line = the pitch as sung, its error in cents (−45¢ is the worst). Amber curve = the corrected pitch; time runs down each row.',
      'Readouts: AMOUNT, SPEED, NOTE (the note playing now) and ENDS (where the 45¢-flat note finishes).',
    ],
    control: [
      'AMOUNT fader: how far each note is pulled toward its line, from OFF to 100%. Every curve re-bends as you slide.',
      'SPEED key: FAST — SNAP (about 25 ms), MEDIUM (about 120 ms) or SLOW — GLIDE (about 400 ms). The tray stays open so you can compare.',
      'PLAY key, the header ▶ or a tap on the grid plays the melody once (1.1 s a note) and stays lit. Change AMOUNT or SPEED while it is lit and the pass plays again with the new setting.',
      'Long-press AMOUNT, SPEED or a readout for its guided-lesson entry. LAB NOTES below hold the numbers, the demo singer and two quick questions.',
    ],
    changes: [
      'More AMOUNT → the note ends closer to its line: 50% removes half the error, 100% lands on it, given time.',
      'Faster SPEED → the curve bends sooner. Each time constant (25, 120 or 400 ms) closes about two-thirds of the gap still left.',
      'SLOW runs out of time on a 1.1 s note, so ENDS stays above 0¢. The sound follows the same curve you see.',
    ],
    teaches: [
      'Pitch error is counted in cents: 100 cents to a semitone.',
      'Correction amount sets how far, retune speed how fast. A fast snap flattens glides and vibrato — the robotic hard-tune effect; a slow one keeps them.',
      'The singer here is a tone generator, not a microphone. First lab in Pitch & Tuning; the Tuning & Temperament Lab comes next.',
    ],
    tryThis: [
      'Slide AMOUNT all the way left: it reads OFF, the amber curves lie dashed on the gray lines and ENDS reads 45¢ — no correction at all.',
      'Back at 100%, pick SLOW — GLIDE: ENDS reads 3¢, because the note ends before the glide is done. Pick FAST — SNAP: ENDS reads 0¢.',
      'Tap PLAY on FAST — SNAP at 100%, then switch to SLOW — GLIDE: hear the hard snap turn into a gentle drift onto pitch.',
    ],
  },

  // ── LEARN — the reading page ──────────────────────────────────────────────
  learn: {
    seeing: [
      'The LEARN tab: this lab’s guided lesson as one page to read. Nothing plays here.',
      'First, what pitch correction is. Then CONTROLS: Correction amount and Retune speed with their ranges, and Cents grid.',
      'Then COMMON MISTAKES, PRO TIPS and FORMULA / CONCEPT — the error in cents and the exponential pull.',
    ],
    control: [
      'Scroll to read. The tabs under the title switch to EXPLORE (the live grid) or CHECK (four questions).',
      'On EXPLORE, long-press AMOUNT, SPEED or a readout to open just its entry as a sheet. ⓘ GUIDED LESSON at the end of LAB NOTES opens this whole page as a sheet.',
    ],
    changes: [
      'Nothing on this page moves — it is the reference for what EXPLORE shows.',
      'Each CONTROLS entry names a part of the EXPLORE screen.',
      'Several COMMON MISTAKES pair a setting with its result: too fast flattens vibrato; too slow leaves short notes out of tune.',
    ],
    teaches: [
      'The words of pitch correction: cents, correction amount, retune speed, the grid.',
      'Why one setting is gentle polish and another is a deliberate effect.',
      'Why a cent is a ratio, not a fixed number of hertz.',
    ],
    tryThis: [
      'Read the PRO TIP about 0% → 50% → 100%, then on EXPLORE light PLAY and move AMOUNT: each change plays the pass again.',
      'Read the mistake about short notes, then on EXPLORE set 100% and SLOW — GLIDE: ENDS reads 3¢ — the glide has not finished.',
    ],
  },

  // ── CHECK — the understanding check ───────────────────────────────────────
  check: {
    seeing: [
      'CHECK YOUR UNDERSTANDING for the Autotune Lab: four question cards, each with four answers.',
      'The questions: cents in a semitone, why FAST sounds robotic, why SLOW misses short notes, and where a 40-cent error ends at 50%.',
      'A ✓ replaces a card’s number once you get it right.',
    ],
    control: [
      'Tap an answer. Right: CORRECT and the reason. Wrong: NOT QUITE — TRY ANOTHER with the same explanation — nothing is lost and there is no score.',
      'The tabs under the title go back to LEARN or EXPLORE at any time; a right answer stays right.',
    ],
    changes: [
      'Each right answer locks its card green.',
      'With every card right the lab is complete. It counts toward every certificate that needs it, and never has to be taken again.',
    ],
    teaches: [
      'The four ideas the lab is built on: a semitone is 100 cents; retune speed is a time; slow correction can run out of note; correction amount takes a share of the error.',
    ],
    tryThis: [
      'Unsure about the 50% card? On EXPLORE set AMOUNT near 50% with MEDIUM: ENDS reads about 22–23¢ — half of the 45¢ error.',
      'For the SLOW card: on EXPLORE set 100% and SLOW — GLIDE and read ENDS (3¢), then FAST — SNAP (0¢).',
    ],
  },
};

/** The guide for a LabShell tab — LabShell's per-tab `guide` function. */
export function autotuneScreenGuide(mode: string): ScreenGuide | undefined {
  return mode === 'explore' || mode === 'learn' || mode === 'check' ? AUTOTUNE_SCREEN_GUIDES[mode] : undefined;
}
