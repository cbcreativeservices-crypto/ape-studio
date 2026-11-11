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
    intro: {
      learning: 'How pitch correction works: error is counted in cents, 100 to a semitone. AMOUNT sets how far a note is pulled toward the correct pitch, SPEED how fast.',
      start: 'Tap PLAY and listen to the out-of-tune melody. Slide AMOUNT to OFF and back to 100%. Then switch SPEED between FAST — SNAP and SLOW — GLIDE and watch ENDS, where the most out-of-tune note finishes.',
    },
    seeing: [
      'The cents grid has one vertical line per semitone, note names along the top. A cent is 1/100 of a semitone. Each row is one note of a six-note demo melody, sung out of tune on purpose.',
      'The gray line is the pitch as sung (−45¢ is the worst error). The amber curve is the corrected pitch; time runs down each row.',
      'Readouts: AMOUNT, SPEED, NOTE (playing now) and ENDS (where the 45¢-flat note finishes).',
    ],
    control: [
      'Slide the AMOUNT fader to set how far each note is pulled toward its line, from OFF to 100%. Every curve re-bends as you slide.',
      'Tap SPEED to choose FAST — SNAP (about 25 ms), MEDIUM (about 120 ms) or SLOW — GLIDE (about 400 ms). The tray stays open so you can compare.',
      'Tap PLAY, the header ▶ or the grid to play the melody once (1.1 s a note). PLAY stays lit: change AMOUNT or SPEED and the melody plays again with the new setting.',
      'Long-press AMOUNT, SPEED or a readout to read about it. LAB NOTES below hold the numbers, the demo singer and two quick questions.',
    ],
    changes: [
      'Raise AMOUNT and the note ends closer to its line: 50% removes half the error; 100% lands on it, given time.',
      'Pick a faster SPEED and the curve bends sooner. In each time constant (the SPEED time: 25, 120 or 400 ms) the pitch closes about two-thirds of the gap still left.',
      'On SLOW the 1.1 s note ends before the glide finishes, so ENDS stays above 0¢. What you hear follows the curve you see.',
    ],
    teaches: [
      'Pitch error is counted in cents, 100 to a semitone, so a 45¢ error is almost half a semitone.',
      'Correction amount sets how far a note moves; retune speed sets how fast. On a real voice a fast snap flattens glides and vibrato into the robotic hard-tune effect; a slow one keeps them.',
      'The demo singer is a steady tone generator, not a voice, so here you hear the snap itself.',
    ],
    tryThis: [
      'Slide AMOUNT all the way left until it reads OFF. The amber curves lie dashed on the gray lines and ENDS reads 45¢: no correction at all.',
      'Back at 100%, pick SLOW — GLIDE: ENDS reads 3¢, because the note ends before the glide is done. Pick FAST — SNAP: ENDS reads 0¢.',
      'Tap PLAY on FAST — SNAP at 100%, then switch to SLOW — GLIDE. Listen to the hard snap turn into a gentle drift onto pitch.',
    ],
  },

  // ── LEARN — the reading page ──────────────────────────────────────────────
  learn: {
    intro: {
      learning: 'The ideas behind pitch correction in words: cents, correction amount, retune speed and the grid, and why one setting is gentle polish while another is an effect.',
      start: 'Scroll from the top and read CONTROLS, then COMMON MISTAKES. Then switch to EXPLORE and hear each idea you just read.',
    },
    seeing: [
      'This is the lab’s guided lesson as one page to read. Nothing on it moves, but ▶ in the header still plays or stops the melody.',
      'It opens with what pitch correction is, then CONTROLS: AMOUNT and SPEED with their ranges, and CENTS GRID.',
      'Then COMMON MISTAKES, PRO TIPS and FORMULA / CONCEPT, which shows how the error is counted in cents and how the pull closes it over time.',
    ],
    control: [
      'Scroll to read. Use the tabs under the title to switch to EXPLORE (the live grid) or CHECK (four questions).',
      'On EXPLORE, long-press AMOUNT, SPEED or a readout to open just that entry. ⓘ GUIDED LESSON at the end of LAB NOTES opens this whole page as a sheet.',
    ],
    changes: [
      'Nothing on this page moves. Use it as the reference for what you see and hear on EXPLORE.',
      'Each CONTROLS entry matches a part of the EXPLORE screen, so you can read about it, then try it.',
      'Several COMMON MISTAKES pair a setting with its result: too fast flattens vibrato; too slow leaves short notes out of tune.',
    ],
    teaches: [
      'Pitch correction has its own words: cents, correction amount, retune speed and the pitch grid.',
      'Why one setting is gentle polish and another is a deliberate effect.',
      'Why a cent is a ratio, not a fixed number of hertz: the same cent error is a different hertz gap at every pitch.',
    ],
    tryThis: [
      'Read the PRO TIP about OFF → 50% → 100%. Then on EXPLORE, light PLAY and move AMOUNT: each change plays the melody again.',
      'Read the mistake about short notes. Then on EXPLORE set 100% and SLOW — GLIDE: ENDS reads 3¢, because the glide hasn’t finished.',
    ],
  },

  // ── CHECK — the understanding check ───────────────────────────────────────
  check: {
    intro: {
      learning: 'A review of the lab’s four ideas: cents and semitones, retune speed as a time, slow correction on short notes, and what correction amount does to the error.',
      start: 'Read each card and tap the answer you think is right. Unsure? Switch to EXPLORE, try the setting the card asks about, and read ENDS before you answer.',
    },
    seeing: [
      'CHECK YOUR UNDERSTANDING for the Autotune Lab: four question cards, each with four answers.',
      'They ask how many cents make a semitone, why FAST sounds robotic, why SLOW misses short notes, and where a 40-cent error ends at 50%.',
      'A ✓ replaces a card’s number once you get it right.',
    ],
    control: [
      'Tap an answer. If it’s right, you see CORRECT and the reason. If not, you see NOT QUITE — TRY ANOTHER with the same explanation. Nothing is lost and there is no score.',
      'Use the tabs under the title to go back to LEARN or EXPLORE at any time; a right answer stays right.',
    ],
    changes: [
      'Each right answer locks its card green.',
      'Get all four right and the check is passed.',
    ],
    teaches: [
      'How cents divide a semitone, and why retune speed is a length of time.',
      'How correction amount decides how much of a note’s error is removed.',
    ],
    tryThis: [
      'Unsure about the 50% card? On EXPLORE, set AMOUNT near 50% with MEDIUM. ENDS reads about 22–23¢. Compare that with the 45¢ the note starts at.',
      'For the SLOW card, set 100% and SLOW — GLIDE on EXPLORE and read ENDS (3¢). Then try FAST — SNAP (0¢).',
    ],
  },
};

/** The guide for a LabShell tab — LabShell's per-tab `guide` function. */
export function autotuneScreenGuide(mode: string): ScreenGuide | undefined {
  return mode === 'explore' || mode === 'learn' || mode === 'check' ? AUTOTUNE_SCREEN_GUIDES[mode] : undefined;
}
