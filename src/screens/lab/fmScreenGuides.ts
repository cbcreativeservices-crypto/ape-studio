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
    intro: {
      learning: 'How one sine wobbling another creates sidebands: the ratio sets where they land, pitched or bell-like, and the index sets how many are strong.',
      start: 'Tap ▶, then ride INDEX from 0 to 8 and watch amber sideband pairs spread out from the green carrier. Then switch RATIO between 1 and 1.41 ✳ and listen.',
    },
    seeing: [
      'The SIDEBAND SPECTRUM: a stick per frequency. Height is strength, from Bessel math (the curves FM follows): |J| 1 is full, 0.5 half.',
      'Green: the carrier (fc). Amber: sidebands. Dim dashed: a sideband reflected below 0 Hz, folded up; on a stick, they combine. Red dashed: ALIASED past Nyquist, 24 kHz (half of 48 kHz).',
      'FC: carrier. FM: modulator. I: index. BW: estimated spread, red once its top passes 24 kHz.',
    ],
    control: [
      'Tap ▶ in the header, or tap the display, to strike the voice; ■ stops it. STRIKE in the dock strikes it again.',
      'Slide INDEX (0 to 8) to set how hard the modulator pushes the carrier. It’s on the lane from the start.',
      'FC picks the carrier: 110, 220 or 440 Hz. RATIO sets the modulator as carrier × 0.5, 1, 1.41 ✳, 2, 3.5 or 7; ✳ marks the bell-like ratio.',
      'ENV: SUSTAIN holds the index; PLUCK and BELL let it fall after each strike. The graph keeps the strike’s bright start while the sound dulls toward the carrier. While it plays, a change strikes again.',
      'Long-press INDEX, FC, RATIO, ENV or a readout to read about it. LAB NOTES below hold two quick questions; ▴ HIDE DISPLAY gives them room.',
    ],
    changes: [
      'Sidebands sit at FC ± 1, 2, 3… × FM, so FM sets their spacing. Simple ratios put them on a harmonic series, a clear pitch; 1.41 ✳ puts them in between, a bell.',
      'Raise INDEX and energy spreads into more pairs. Bessel heights rise and fall, so one stick can shrink as I grows.',
      'BW = 2 × FM × (I + 1) estimates where most energy sits. Weaker sticks reach past it, and any past 24 kHz fold back: aliasing.',
    ],
    teaches: [
      'In FM, one sine (the modulator) wobbles the phase of another (the carrier) and creates a whole family of new frequencies.',
      'The ratio decides where they land: pitched or bell-like. The index decides how many are strong: the brightness.',
      'An index that falls after each strike is how FM makes plucks and bells.',
      'Two sines are enough for a rich tone; additive synthesis builds richness one harmonic at a time.',
    ],
    tryThis: [
      'Tap ▶ (FC 220, RATIO 2, I 2.0: BW 2.6 kHz). Ride INDEX to 0: one green stick, the carrier alone. Then ride up to 8: amber pairs spread out and BW reaches 7.9 kHz.',
      'At I 2.0, switch RATIO between 1 and 1.41 ✳: FM reads 220 Hz, then 310 Hz. At 1 the sticks land on multiples of 220 Hz; at 1.41 ✳ they fall between, and the tone turns to a clang.',
      'Set RATIO 1.41 ✳ and INDEX to I = 2.4: the green carrier stick vanishes, because its Bessel height is almost zero there. More index is not more of every part.',
    ],
  },

  // ── LEARN — the reading page ──────────────────────────────────────────────
  learn: {
    intro: {
      learning: 'The words and math of FM in one place: carrier, modulator, ratio, index, sidebands, Bessel amplitudes, Carson’s bandwidth and aliasing.',
      start: 'Read COMMON MISTAKES and FORMULA / CONCEPT. Then switch to EXPLORE, set RATIO 1.41 ✳ and INDEX to I = 2.4, and watch the carrier stick disappear.',
    },
    seeing: [
      'This is the FM lab’s guided lesson as one page to read. ▶ in the header still strikes the voice you set on EXPLORE.',
      'It starts with what FM is. Then CONTROLS: one entry each for the display, FC (the carrier), RATIO, INDEX and ENV (the index envelope).',
      'Then come COMMON MISTAKES, PRO TIPS and FORMULA / CONCEPT: the FM equation, the sideband rule and Carson’s bandwidth.',
    ],
    control: [
      'Scroll to read. Use the tabs under the title to switch between LEARN, EXPLORE and CHECK.',
      'On EXPLORE, ⓘ GUIDED LESSON at the end of LAB NOTES opens this same lesson as a sheet over the rack.',
      'On EXPLORE, long-press INDEX, FC, RATIO, ENV or a readout to read just its entry. The ⓘ on the readout strip explains the display.',
    ],
    changes: [
      'Nothing on this page moves. Use it to explain what the SIDEBAND SPECTRUM shows you on EXPLORE.',
      'Each CONTROLS entry takes one part of the rack, such as FC or ENV, and says what it does to the sound.',
      'Each COMMON MISTAKES line pairs a wrong idea with the reason: for example, that more index always makes every sideband louder.',
    ],
    teaches: [
      'The words of FM: carrier, modulator, ratio, index, sideband, Bessel amplitude, Carson bandwidth, aliasing.',
      'Why FM is neither distortion nor vibrato.',
      'Carson’s rule, BW = 2 × FM × (I + 1), estimates how far most of an FM tone’s energy spreads.',
    ],
    tryThis: [
      'Read the COMMON MISTAKES line on more index and louder sidebands. Then on EXPLORE set RATIO 1.41 ✳ and INDEX to I = 2.4: the carrier stick disappears, as the line says.',
      'Read the line on Nyquist. Then on EXPLORE pick FC 440 Hz, RATIO 7 and INDEX 8: BW reads 55.4 kHz in red, and red dashed sticks show sidebands folding back.',
    ],
  },

  // ── CHECK — LabShell's understanding check ────────────────────────────────
  check: {
    intro: {
      learning: 'A review of FM’s core ideas: where sidebands sit, what the index changes, what an uneven ratio does to the tone, and what is left at index 0.',
      start: 'Read each question and tap an answer. Unsure? Switch to EXPLORE, try the idea on the SIDEBAND SPECTRUM, then come back to CHECK.',
    },
    seeing: [
      'CHECK YOUR UNDERSTANDING asks four questions: where sidebands sit, what the index changes, what a ratio that isn’t a whole number (1.41 ✳) does, and what index 0 leaves.',
      'Above them you see how many are still to get right. A ✓ replaces a question’s number once it’s right.',
      'Every answer opens its explanation: CORRECT, or NOT QUITE — TRY ANOTHER.',
    ],
    control: [
      'Tap an answer. If it’s wrong, pick again straight away. Nothing is lost and there is no score.',
      'A right answer locks in, and its explanation stays open to read.',
      'Use the tabs under the title to look something up on LEARN or EXPLORE; answers already right stay right when you return. Leave the lab before the last one and the check starts over.',
      'Below the questions, FINISH · SEE WHAT’S LEFT › opens Where you are: the check’s status and the way back to labs.',
    ],
    changes: [
      'Every explanation gives the reason, right or wrong, so a wrong pick still shows you how FM behaves.',
      'Get all four right and the check is passed.',
      'A pass is kept: the questions show as done, and you never need to take the check twice.',
    ],
    teaches: [
      'Any FM tone comes down to where its sidebands sit, how strong they are, whether they line up on a harmonic series, and what is left at index 0.',
      'Each of these shows directly in an FM tone’s spectrum: sideband spacing, sideband height, and how many sidebands there are.',
    ],
    tryThis: [
      'Unsure where sidebands sit? Try a different pair on EXPLORE: FC 440 and RATIO 0.5, so FM reads 220 Hz. Find the amber pair nearest the green carrier and read where it sits.',
      'Unsure about index 0? On LEARN, read the INDEX entry under CONTROLS, then come back.',
    ],
  },
};


/** The what's-left screen (LabShell's LabCheckEnd, passed as `checkEnd`):
 *  FINISH · SEE WHAT'S LEFT › under the CHECK opens it as a full-screen layer
 *  over FmLabScreen. Every line is true of kit/LabEndScreen in "credit" mode
 *  with the lab's one unit, the understanding check: the row and PRACTICE
 *  AGAIN close the layer (nothing is cleared), DONE · BACK TO LABS leaves. */
export const FM_END_GUIDE: ScreenGuide = {
  intro: {
    learning: 'Where you stand in the FM lab: whether the check is passed, what is left, and how to get back to the rack to keep exploring sidebands.',
    start: 'Read WHAT’S LEFT. If the check’s row is still there, tap it to go back to CHECK. Otherwise tap ‹ BACK TO THE LAB to keep exploring.',
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
    'The check counts once every answer is right.',
    'If you’re signed out, the line under the title says whether signing in can still keep it.',
  ],
  teaches: [
    'An FM tone is built from a carrier, a modulator and the sidebands they make.',
    'Two numbers, the ratio and the index, shape what you hear. Sidebands pushed past 24 kHz fold back as aliasing.',
  ],
  tryThis: [
    'If the check is still listed, tap its row to go back to CHECK. Answer all four, then FINISH · SEE WHAT’S LEFT › shows LAB COMPLETE.',
    'Once it’s passed, tap ‹ BACK TO THE LAB. On EXPLORE, set RATIO 1.41 ✳ and strike: listen to how the tone changes.',
  ],
};

/** The guide for a LabShell tab — LabShell's per-tab `guide` function. */
export function fmScreenGuide(mode: string): ScreenGuide | undefined {
  return mode === 'explore' || mode === 'learn' || mode === 'check' ? FM_SCREEN_GUIDES[mode] : undefined;
}
