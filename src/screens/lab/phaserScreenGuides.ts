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
    seeing: [
      'Two spectrum analyzers. Left (IN ▸): the source — PINK NOISE draws flat, WHITE NOISE rises to the right. Right, past the green PHASER bar (SPECTRUM (dB), to ▸ OUT): the same noise after the phaser.',
      'On OUT the amber trace shows a few dips, unevenly spaced, sweeping; the dotted line is the input. Ticks mark 100, 1k and 10k Hz.',
      'Readouts on the frame: STAGES, CENTER and RES.',
    ],
    control: [
      '▶ at the top right (or a tap on the display) plays the noise through the phaser; ■ stops it.',
      'CENTER fader (400–2000 Hz, starts at 1000 Hz): where the dips sit. Set DEPTH (SWEEP) to STATIC to move them only by hand.',
      'STAGES: 2, 4, 6 or 8 all-pass stages. SWEEP: RATE (0.1, 0.3, 1 or 3 Hz) and DEPTH (SWEEP): STATIC, 50% or 100%.',
      'RES (RESONANCE): 0%, 30% or 60% of the output fed back in. SOURCE: PINK NOISE or WHITE NOISE. There is no MIX key: this lab always mixes half and half.',
      'Long-press a key or readout for its lesson entry. Below: HIDE DISPLAY, FULL SCREEN, and LAB NOTES with the response curve and two quick questions.',
    ],
    changes: [
      'Each all-pass stage keeps every frequency’s level but shifts its phase, more at higher frequencies. Where the copy lands half a cycle from the dry sound, the two cancel: a dip.',
      'Every two stages add one dip, placed by phase, not by a fixed spacing — uneven, unlike a flanger’s comb.',
      'The LFO slides the stages’ corner up and down (two octaves each way at 100%), carrying the dips. RES lifts peaks between them.',
    ],
    teaches: [
      'A phaser shifts phase, not time: no delay, no echo, and only a few unevenly spaced dips.',
      'More stages, more dips: about stages ÷ 2.',
      'Third Modulation lab, after Chorus and Flanger — it contrasts phase with time. A good next step: Distortion & Saturation. Each picture is a teaching model.',
    ],
    tryThis: [
      'Set SWEEP’s DEPTH (SWEEP) to STATIC, then drag CENTER from 400 Hz to 2000 Hz: the two dips slide up OUT together, one either side of CENTER.',
      'Tap STAGES through 2, 4, 6 and 8: the caption under DESIGNED RESPONSE says 1, 2, 3, then 4 notches, and OUT shows that many dips.',
      'Step RES from 0% to 60%: the peaks between the dips rise above the dotted input line — listen for the sweep starting to ring.',
    ],
  },

  // ── LEARN — the reading page ──────────────────────────────────────────────
  learn: {
    seeing: [
      'The LEARN tab: the Phaser guided lesson as one page to read. Nothing on it moves; the ▶ in the header still plays or stops the sound.',
      'What a phaser is, then CONTROLS: the display, Rate, Depth, Stages / Poles, Feedback / Resonance, Center Frequency / Manual, Mix, LFO Waveform and Stereo spread.',
      'Then COMMON MISTAKES, PRO TIPS and FORMULA / CONCEPT.',
    ],
    control: [
      'Scroll to read. The tabs under the title switch to EXPLORE (the live rack) and CHECK (the questions that complete the lab).',
      'On EXPLORE, ⓘ GUIDED LESSON at the end of LAB NOTES opens this same lesson as a sheet; long-press a key or readout there to open just its entry.',
    ],
    changes: [
      'This page is the reference for what EXPLORE shows.',
      'On EXPLORE, Center Frequency is the CENTER fader, Stages is STAGES, Rate and Depth share the SWEEP key, Feedback / Resonance is RES.',
      'Mix, LFO Waveform and Stereo spread are found on many phasers but are not in this dock — the lab holds the mix at 50%, near where the notches are deepest. The ranges listed are wider than the rack’s.',
    ],
    teaches: [
      'The words for a phaser: all-pass filter, stage (pole), notch, resonance, LFO.',
      'The formula: an all-pass keeps every level and turns the phase from 0° toward −180°; two stages make one notch.',
      'Why too many stages or too much resonance can smear or whistle on a busy mix.',
    ],
    tryThis: [
      'Read the PRO TIP on sweeping Manual with the LFO off, then on EXPLORE set DEPTH (SWEEP) to STATIC and drag CENTER: the dips hold still until you move them.',
      'Read Stages / Poles (notch count ≈ stages ÷ 2), then on EXPLORE step STAGES to 8 and count the dips on OUT: four.',
    ],
  },

  // ── CHECK — the questions that complete the lab ───────────────────────────
  check: {
    seeing: [
      'The CHECK tab: CHECK YOUR UNDERSTANDING for the Phaser lab — four questions, four answers each.',
      'A line under the heading says how many are still to get right. A ✓ replaces a question’s number once you answer it right.',
    ],
    control: [
      'Tap an answer. Right: it turns green and CORRECT shows why. Wrong: NOT QUITE — TRY ANOTHER shows why, and you pick again straight away.',
      'There is no score, and a wrong answer costs nothing. A right answer stays right.',
      'The tabs under the title go to LEARN or EXPLORE at any time; answers already right stay right. Leaving the lab before the last one starts the check over.',
    ],
    changes: [
      'Each question is about something EXPLORE shows: how many notches 8 stages make, what an all-pass stage changes, whether a phaser is a delay, and what RES does.',
      'When all four are right the card reads Lab complete, and the tab opens already complete next time.',
    ],
    teaches: [
      'It checks the ideas: phase not time, notches ≈ stages ÷ 2, uneven spacing, and resonance’s peaks.',
      'Completing it finishes the Phaser lab, the last in Modulation. A good next step: Distortion & Saturation.',
    ],
    tryThis: [
      'Before you start, on EXPLORE set STAGES to 8 and count the dips on OUT.',
      'For the RES question, first step RES from 0% to 60% on EXPLORE and watch what rises between the dips.',
    ],
  },
};

/** The guide for a LabShell tab — LabShell's per-tab `guide` function. */
export function phaserScreenGuide(mode: string): ScreenGuide | undefined {
  return mode === 'explore' || mode === 'learn' || mode === 'check' ? PHASER_SCREEN_GUIDES[mode] : undefined;
}
