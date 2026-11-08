/**
 * Phaser Lab — "explain this screen" content (Screen Guide rollout,
 * 2026-10-31; standard = wave/waveScreenGuides.ts).
 *
 * The lab is ONE LabShell screen (FxLabScreen + phaserConfig in
 * fxLabConfigs.tsx) with three tabs, so the guides are keyed by the shell's
 * tab id:
 *   explore — the rack: two animated spectrum analyzers (fxAnim SpectrumFlow,
 *             phaser), the bezel (STAGES · CENTER · RES), the dock (CENTER
 *             fader · STAGES · SWEEP tray = RATE + DEPTH (SWEEP) · RES ·
 *             SOURCE), the header ▶, LAB NOTES (DESIGNED RESPONSE, THE AUDIO
 *             PATH, two CHECK YOURSELF cards, ⓘ GUIDED LESSON);
 *   learn   — the reading page (the phaser guided lesson in full);
 *   check   — CHECK YOUR UNDERSTANDING (understandingChecks.ts PHASER, four
 *             questions; LabUnderstandingCheck).
 *
 * Every number in TRY THIS is what the screen prints or draws at that
 * setting, from the engine's own law (Effects.hpp ModEffect, mode 2: N
 * first-order all-passes at fc = CENTER·2^(2·depth·sin LFO), the cascade fed
 * back ×RES one sample late, MIX fixed at 0.5 by the config; the analyzers and
 * the DESIGNED RESPONSE curve draw the same law):
 *   • heroCaption "N stages ≈ floor(N/2) notches": 2 → 1, 4 → 2, 6 → 3, 8 → 4,
 *     and OUT draws exactly that many dips (below −6 dB, 20 Hz–20 kHz) for
 *     every CENTER 400–2000 Hz, every corner the 50% sweep reaches
 *     (500–2000 Hz at CENTER 1000 Hz) and every RES;
 *   • 4 stages: the two dips sit either side of CENTER (≈ 0.42× and 2.5×
 *     CENTER at RES 30%) — e.g. 418 Hz and 2.5 kHz at 1000 Hz;
 *   • peaks between dips: RES 0% → 0 dB (on the dotted input line),
 *     30% → +1.7 dB, 60% → +4.9 dB. RES also makes the dips SHALLOWER
 *     (−58 → −19 → −15 dB at 4 stages), so no line here says "deeper".
 * test/screenGuide_phaser_20261031.test.ts pins the names and recomputes the
 * numbers. Change a label, range or default → update this file.
 *
 * STEPPED: each section must fit SCREEN_GUIDE_BUDGET (types.ts).
 * Copy rules: plain language, short sentences; KNOWLEDGE, never skills; no
 * gear brand names; no "N of total"; "suggest" never "recommend"; no build
 * notes in learner text.
 */
import type { ScreenGuide } from '../../features/lab/screenGuide/types';

/** The LabShell tabs this lab offers. */
export type PhaserScreenId = 'explore' | 'learn' | 'check';

export const PHASER_SCREEN_GUIDES: Record<PhaserScreenId, ScreenGuide> = {
  // ── EXPLORE — the rack ────────────────────────────────────────────────────
  explore: {
    intro: {
      learning: 'How a phaser makes its swirl: all-pass stages shift phase without any delay, and mixing that with the dry sound cancels a few unevenly spaced dips.',
      start: 'Tap ▶ and watch the amber dips sweep across OUT. Then open SWEEP, set DEPTH (SWEEP) to STATIC, and drag CENTER to move the dips by hand.',
    },
    seeing: [
      'Left (IN ▸) is your source on a spectrum analyzer: PINK NOISE draws flat, WHITE NOISE rises to the right. Right, past the green PHASER bar (SPECTRUM (dB), to ▸ OUT), is the same noise after the phaser.',
      'On OUT, look for a few dips in the amber trace, unevenly spaced and sweeping. The dotted line is the input. Marks show 100, 1k and 10k Hz.',
      'STAGES, CENTER and RES on the frame show your settings.',
    ],
    control: [
      'Tap ▶ at the top right, or tap the display, to play the noise through the phaser; ■ stops it.',
      'Drag the CENTER fader (400–2000 Hz, starts at 1000 Hz) to set where the dips sit. Set DEPTH (SWEEP) to STATIC to move them only by hand.',
      'STAGES sets 2, 4, 6 or 8 all-pass stages (filters that shift phase). SWEEP holds RATE (0.1, 0.3, 1 or 3 Hz) and DEPTH (SWEEP): STATIC, 50% or 100%.',
      'RES (RESONANCE) feeds 0%, 30% or 60% of the output back in. SOURCE picks PINK NOISE or WHITE NOISE. There is no MIX key: this lab always mixes half and half.',
      'Long-press a key or readout for its lesson entry. Below: HIDE DISPLAY, FULL SCREEN, and LAB NOTES with the response curve and two quick questions.',
    ],
    changes: [
      'Each all-pass stage keeps every frequency’s level but shifts its phase, more at higher frequencies. Where the copy lands half a cycle from the dry sound, they cancel: a dip.',
      'Every two stages add one dip, placed by phase, so the dips sit unevenly, unlike a flanger’s comb.',
      'The LFO (a slow wobble) slides the stages’ corner two octaves each way at 100%, and the dips move with it. RES lifts the peaks in between.',
    ],
    teaches: [
      'A phaser shifts phase, not time: no delay, no echo, and only a few unevenly spaced dips.',
      'More stages, more dips: about stages ÷ 2.',
      'Feedback (RES) raises peaks between the dips, so the sweep starts to ring rather than just whoosh.',
    ],
    tryThis: [
      'Open SWEEP and set DEPTH (SWEEP) to STATIC. Drag CENTER from 400 Hz to 2000 Hz: the two dips slide up OUT together, one on either side of CENTER.',
      'Tap STAGES through 2, 4, 6 and 8: the caption under DESIGNED RESPONSE says 1, 2, 3, then 4 notches, and OUT shows that many dips.',
      'Step RES from 0% to 60%: the peaks between the dips rise above the dotted input line — listen for the sweep starting to ring.',
    ],
  },

  // ── LEARN — the reading page ──────────────────────────────────────────────
  learn: {
    intro: {
      learning: 'The vocabulary of the phaser (all-pass filter, stage, notch, resonance, LFO) and why two stages make one notch without any delay.',
      start: 'Scroll to the STAGES entry and read how many notches each stage count gives. Then switch to EXPLORE, step STAGES to 8 and count the dips on OUT.',
    },
    seeing: [
      'This is the Phaser guided lesson as one page to read. Nothing on it moves, but ▶ in the header still plays or stops the sound.',
      'It starts with what a phaser is, then CONTROLS: the display, RATE, DEPTH (SWEEP), STAGES, RES, CENTER, Mix, LFO Waveform and Stereo spread.',
      'It ends with COMMON MISTAKES, PRO TIPS and FORMULA / CONCEPT.',
    ],
    control: [
      'Scroll to read. Use the tabs under the title to switch to EXPLORE, the live rack, or CHECK, four questions on the phaser.',
      'On EXPLORE, ⓘ GUIDED LESSON at the end of LAB NOTES opens this same lesson as a sheet. Long-press a key or readout there to open just its entry.',
    ],
    changes: [
      'Read this beside EXPLORE: each entry is something you can hear or see on OUT.',
      'On EXPLORE, CENTER is the CENTER fader, STAGES and RES are keys of their own, and RATE and DEPTH share the SWEEP key.',
      'Mix, LFO Waveform and Stereo spread are on many phasers but not in this dock. The lab holds the mix at 50%, near where the notches are deepest. Their entries give the ranges found on many phasers.',
    ],
    teaches: [
      'The words for a phaser: all-pass filter, stage (pole), notch, resonance, LFO.',
      'FORMULA / CONCEPT: an all-pass keeps every level and turns the phase from 0° toward −180°; two stages make one notch.',
      'Why too many stages or too much resonance can smear or whistle on a busy mix.',
    ],
    tryThis: [
      'Read the PRO TIP on setting DEPTH (SWEEP) to STATIC first. Then on EXPLORE set DEPTH (SWEEP) to STATIC and drag CENTER: the dips hold still until you move them.',
      'Read the STAGES entry (one notch for every two stages), then on EXPLORE step STAGES to 8 and count the dips on OUT: four.',
    ],
  },

  // ── CHECK — the questions that complete the lab ───────────────────────────
  check: {
    intro: {
      learning: 'A review of what makes a phaser: what its all-pass stages change, how the stage count sets the notches, whether it is a kind of delay, and what resonance adds.',
      start: 'Read each question and tap an answer. If one stumps you, switch to EXPLORE, try the setting it describes, then come back. Right answers stay right.',
    },
    seeing: [
      'This is CHECK YOUR UNDERSTANDING for the Phaser lab: four questions, four answers each.',
      'A line under the heading says how many are still to get right. A ✓ replaces a question’s number once you answer it right.',
    ],
    control: [
      'Tap an answer. Right: it turns green and CORRECT shows why. Wrong: NOT QUITE — TRY ANOTHER shows why, and you pick again straight away.',
      'There is no score, and a wrong answer costs nothing. A right answer stays right.',
      'Use the tabs under the title to go to LEARN or EXPLORE at any time; answers already right stay right. If you leave the lab before the last one, the check starts over.',
    ],
    changes: [
      'Each question is about something you saw on EXPLORE: how many notches 8 stages make, what an all-pass stage changes, whether a phaser is a delay, and what RES does.',
      'Get all four right and the lab is complete; the card reads Lab complete. A pass is kept: the tab opens already complete next time.',
    ],
    teaches: [
      'How a phaser’s stages treat each frequency sets how many dips there are and where they fall.',
      'Feeding a phaser’s output back into it (RES) changes the character of the sweep.',
    ],
    tryThis: [
      'Unsure how stages set the dips? On EXPLORE, set STAGES to 4 and count the dips on OUT.',
      'For the RES question, long-press the RES key on EXPLORE to open its lesson entry, or find it under CONTROLS on LEARN.',
    ],
  },
};

/** The guide for a LabShell tab — LabShell's per-tab `guide` function. */
export function phaserScreenGuide(mode: string): ScreenGuide | undefined {
  return mode === 'explore' || mode === 'learn' || mode === 'check' ? PHASER_SCREEN_GUIDES[mode] : undefined;
}
