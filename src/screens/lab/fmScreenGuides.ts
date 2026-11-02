/**
 * FM Synth Lab — "explain this screen" content (Screen Guide rollout,
 * 2026-10-31; standard = wave/waveScreenGuides.ts, LabShell pattern =
 * chainScreenGuides.ts).
 *
 * The lab is ONE LabShell screen with three tabs, so the guides are keyed by
 * the shell's tab id:
 *   explore — the rack: the SIDEBAND SPECTRUM, the FC / FM / I / BW bezel, the
 *             INDEX lane, the FC / RATIO / ENV trays, STRIKE, the header ▶,
 *             LAB NOTES (two CHECK YOURSELF questions);
 *   learn   — the reading page (the guided lesson in full);
 *   check   — LabShell's CHECK tab (the four FM questions in
 *             understandingChecks.ts), which grants the lab's credit, ending
 *             on FINISH · SEE WHAT'S LEFT › (FM_END_GUIDE).
 *
 * Every name is the on-screen name in FmLabScreen.tsx (bezel keys, dock
 * labels, tray options, the legend under the graph, the axis tags). Every
 * number in TRY THIS is what the screen prints at that setting, worked out
 * from the screen's own formulas (fm = fc × ratio; BW = 2·fm·(I+1) shown as
 * kHz with one decimal; red when fc + BW/2 > 24 kHz; a stick is drawn when
 * |J_k(I)| ≥ 0.004):
 *   FC 220 · RATIO 2 · I 2.0 → FM 440 Hz, BW 2.6 kHz; I 8.0 → BW 7.9 kHz
 *   RATIO 1 → FM 220 Hz; RATIO 1.41 ✳ → FM 310 Hz
 *   RATIO 1.41 ✳ · I 2.4 → |J₀| ≈ 0.0025 < 0.004: the carrier stick is not
 *     drawn (and no reflected sideband lands on fc at that ratio)
 *   FC 440 · RATIO 7 · I 8.0 → FM 3080 Hz, BW 55.4 kHz in red; k = 8 lands
 *     at 25 080 Hz → a red dashed (aliased) stick
 *   FC 440 · RATIO 7 · I 6.0 → BW 43.1 kHz NOT red (top 22 000 Hz), yet six
 *     red dashed sticks: BW is Carson's estimate, weaker sticks alias first
 *   default (FC 220 · RATIO 2 · I 2.0): every reflected stick lands on a true
 *     one and they combine (sin-sin voice): 220 Hz = J0 + J1 ≈ 0.80, 660 Hz =
 *     J1 − J2 ≈ 0.22 — so the guide says "combine", not "add"
 *   PLUCK / BELL: the graph draws the static index (the strike); the decay
 *     reaches only the native voice
 * test/screenGuide_fm_20261031.test.ts re-runs every one of them.
 *
 * STEPPED: each section must fit SCREEN_GUIDE_BUDGET (types.ts).
 * Copy rules: plain language, short sentences; KNOWLEDGE, never skills; no
 * gear brand names; no "N of total"; "suggest" never "recommend"; no build
 * notes in learner text. The CHECK guide never gives away an answer.
 */
import type { ScreenGuide } from '../../features/lab/screenGuide/types';

/** The LabShell tabs this lab offers. */
export type FmScreenId = 'explore' | 'learn' | 'check';

export const FM_SCREEN_GUIDES: Record<FmScreenId, ScreenGuide> = {
  // ── EXPLORE — the rack ────────────────────────────────────────────────────
  explore: {
    seeing: [
      'The SIDEBAND SPECTRUM: a stick per frequency. Height = strength (Bessel maths): |J| 1 is full, 0.5 is half.',
      'Green = carrier (fc); amber = sidebands. Dim dashed = a sideband reflected below 0 Hz, folded up; if it lands on a stick, the two combine; red dashed = ALIASED past Nyquist (24 kHz, half a 48 kHz sample rate).',
      'FC, FM, I: carrier, modulator, index. BW: estimated spread, red when its top passes 24 kHz.',
    ],
    control: [
      '▶ in the header, or a tap on the display, strikes the voice; ■ stops it. STRIKE in the dock strikes it again.',
      'INDEX fader (0 to 8): how hard the modulator pushes the carrier. It sits on the lane from the start.',
      'FC key: carrier 110, 220 or 440 Hz. RATIO key: modulator = carrier × 0.5, 1, 1.41 ✳, 2, 3.5 or 7 — ✳ marks the bell-like ratio.',
      'ENV key: SUSTAIN holds the index; PLUCK and BELL let it fall after each strike — the graph keeps the strike’s bright start while the sound dulls toward the carrier. While it plays, a change strikes again.',
      'Long-press INDEX, FC, RATIO, ENV or a readout for its lesson entry. Below: LAB NOTES, with two quick questions; ▴ HIDE DISPLAY gives them room.',
    ],
    changes: [
      'Sidebands sit at FC ± 1, 2, 3… × FM, so FM sets their spacing. Simple ratios put them on a harmonic series (a clear pitch); 1.41 ✳ puts them between (a bell).',
      'More INDEX spreads energy into more pairs; Bessel heights rise and fall, so one stick can shrink as I grows.',
      'BW = 2 × FM × (I + 1) estimates where most energy sits. Weaker sticks reach past it, and any past 24 kHz folds back: aliasing.',
    ],
    teaches: [
      'FM: one sine (the modulator) wobbling the phase of another (the carrier) makes a whole family of new frequencies.',
      'Ratio decides where they land — pitched or bell-like. Index decides how many are strong — the brightness.',
      'An index that falls after each strike is how FM makes plucks and bells.',
      'It follows Harmonics (a tone built from its harmonics) and comes before Modular Synth (a tone carved by a filter).',
    ],
    tryThis: [
      'Tap ▶ (FC 220, RATIO 2, I 2.0: BW 2.6 kHz). Ride INDEX to 0: one green stick, the carrier alone. Then ride up to 8: amber pairs spread outward and BW reaches 7.9 kHz.',
      'At I 2.0, A/B RATIO 1 and 1.41 ✳: FM reads 220 Hz, then 310 Hz. At 1 the sticks land on multiples of 220 Hz; at 1.41 ✳ they fall between — the tone turns to a clang.',
      'Set RATIO 1.41 ✳ and INDEX to I = 2.4: the green carrier stick vanishes — its Bessel height is almost zero there. More index is not more of every part.',
    ],
  },

  // ── LEARN — the reading page ──────────────────────────────────────────────
  learn: {
    seeing: [
      'The LEARN tab: the guided lesson for this lab, as one page to read. Nothing here plays.',
      'First, what FM is. Then CONTROLS: one entry each for the display, the carrier, the ratio, the index and the index envelope.',
      'Then COMMON MISTAKES, PRO TIPS and FORMULA / CONCEPT — the FM equation, the sideband rule and Carson’s bandwidth.',
    ],
    control: [
      'Scroll to read. The tabs under the title switch between LEARN, EXPLORE and CHECK.',
      'On EXPLORE, ⓘ GUIDED LESSON at the end of LAB NOTES opens this same lesson as a sheet over the rack.',
      'On EXPLORE, long-press INDEX, FC, RATIO or ENV, or a readout, for just its entry; the ⓘ on the readout strip opens the display’s entry.',
    ],
    changes: [
      'Nothing on this page moves — it is the reference for what EXPLORE shows.',
      'Each CONTROLS entry names a part of the EXPLORE screen and says what it does.',
      'Each COMMON MISTAKES line pairs a wrong idea with the reason — for example, that more index always makes every sideband louder.',
    ],
    teaches: [
      'The words of FM: carrier, modulator, ratio, index, sideband, Bessel amplitude, Carson bandwidth, aliasing.',
      'Why FM is neither distortion nor vibrato.',
      'The reference behind EXPLORE; after FM, the Synthesis & Sound Design list goes on to Modular Synth.',
    ],
    tryThis: [
      'Read the COMMON MISTAKES line on Bessel amplitudes, then on EXPLORE set RATIO 1.41 ✳ and INDEX to I = 2.4: the carrier stick disappears, as the line says.',
      'Read the line on Nyquist, then on EXPLORE pick FC 440 Hz, RATIO 7 and INDEX 8: BW reads 55.4 kHz in red, and red dashed sticks show sidebands folding back.',
    ],
  },

  // ── CHECK — LabShell's understanding check ────────────────────────────────
  check: {
    seeing: [
      'CHECK YOUR UNDERSTANDING for this lab: four questions — where sidebands sit, what the index changes, what a not-whole-number ratio (1.41 ✳) does, and what index 0 leaves.',
      'Above them, how many are still to get right. A ✓ replaces a question’s number once it is right.',
      'Every answer opens its explanation: CORRECT, or NOT QUITE — TRY ANOTHER.',
    ],
    control: [
      'Tap an answer. A wrong one stays open: pick again straight away. Nothing is lost and there is no score.',
      'A right answer locks in, and its explanation stays to read.',
      'The tabs under the title go back to LEARN or EXPLORE to look something up; answers already right stay right when you come back. Leaving the lab before the last one starts the check over.',
      'Below the questions, FINISH · SEE WHAT’S LEFT › opens Where you are: the check’s status and the way back to labs.',
    ],
    changes: [
      'Each explanation gives the reason, right or wrong — the teaching moment either way.',
      'All four right completes the lab. It counts toward every certificate and program that needs it.',
      'Passed before? The questions show as done; it never has to be taken twice.',
    ],
    teaches: [
      'Whether the FM ideas stuck: sideband spacing, the index, inharmonic ratios and index 0.',
      'Each question ties to something EXPLORE shows on the display.',
    ],
    tryThis: [
      'Unsure where sidebands sit? On EXPLORE, step RATIO and watch the FM readout and the stick spacing change together.',
      'Unsure about index 0? On EXPLORE, drag INDEX to 0 and look at what is left on the display.',
    ],
  },
};


/** The what's-left screen (LabShell's LabCheckEnd, passed as `checkEnd`):
 *  FINISH · SEE WHAT'S LEFT › under the CHECK opens it as a full-screen layer
 *  over FmLabScreen. Every line is true of kit/LabEndScreen in "credit" mode
 *  with the lab's one unit, the understanding check: the row and PRACTICE
 *  AGAIN close the layer (nothing is cleared), DONE · BACK TO LABS leaves. */
export const FM_END_GUIDE: ScreenGuide = {
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
    'Once it is passed, tap ‹ BACK TO THE LAB and on EXPLORE set RATIO 1.41 ✳ and strike: practice never removes the credit.',
  ],
};

/** The guide for a LabShell tab — LabShell's per-tab `guide` function. */
export function fmScreenGuide(mode: string): ScreenGuide | undefined {
  return mode === 'explore' || mode === 'learn' || mode === 'check' ? FM_SCREEN_GUIDES[mode] : undefined;
}
