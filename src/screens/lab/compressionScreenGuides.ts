/**
 * Compression Lab — "explain this screen" content (Screen Guide rollout,
 * 2026-10-31; standard = wave/waveScreenGuides.ts, LabShell pattern =
 * chainScreenGuides.ts).
 *
 * The lab is ONE LabShell screen (FxLabScreen + fxLabConfigs compConfig) with
 * three tabs, so the guides are keyed by the shell's tab id:
 *   explore — the rack: the animated flow display (IN ▸ COMP ▸ OUT) with the GR
 *             ladder, the THRESH / RATIO / GR readouts, the THRESH fader and
 *             the RATIO / ATK/REL / MAKEUP / SOURCE keys, LAB NOTES;
 *   learn   — the guided lesson as one reading page;
 *   check   — CHECK YOUR UNDERSTANDING (understandingChecks.ts COMPRESSION).
 *
 * Every name is the on-screen name (fxLabConfigs compConfig, FxLabScreen,
 * fxAnim DynamicsFlow, fxViz GrLadder / GrMeter / TransferCurveGraph). Every
 * GR number in TRY THIS was worked out from the engine (Effects.hpp
 * DynamicsEffect: a peak detector with the ATTACK / RELEASE time constants,
 * GR = (detector − threshold) × (1 − 1/ratio)) on the lab's own sources —
 * SINE 440 Hz and CLICK 120 at −20 dBFS peak — on BOTH routes (headphones,
 * and the phone speaker's 150 Hz high-pass), and the test re-runs it sample
 * by sample:
 *   SINE 440, THRESH −30, 4:1, 5/120 ms   → GR 7.0 (6.9 speaker)  "about 7"
 *   … THRESH −20 and above               → GR 0.0
 *   RATIO 2:1 / 8:1 / 20:1 at −30         → 4.7 / 8.1 / 8.8       "5 / 8 / 9"
 *   CLICK 120, THRESH −40 (the opening setting, D41 fix 2026-11-01),
 *     ATTACK 5 ms                         → kicks to ~5.5 dB, back to 0.0;
 *                                            the 50 ms poll catches it 2.8–5.5
 *                                            dB after the peak → "about 3–5"
 *   … ATTACK 25 ms PUNCH                  → 0.0 (the 5 ms click is over before
 *                                            the detector reaches −40)
 *   CLICK 120 at THRESH −30 / ATTACK 5 ms → 0.0 (the detector peaks at
 *     −32.7 dBFS) — why the lab no longer opens at −30: GR never moved on
 *     first play.
 * The CLICK drawing is the REAL click (D41 J4, 2026-11-01): fxAnim walks the
 * generator's 5 ms ping through the engine's detector on its 48 kHz grid
 * (it used to draw a 90 ms DRUM-HIT MODEL that clamped ~14 dB while the meter
 * kicked ~5.5). So the drawn detector peaks where GR does (5.5 dB at the
 * start), and the drawn spike is the engine's real output: about 1 dB under
 * the dotted outline at ATTACK 5 ms (GR peaks at the end of the ping, after
 * its loudest moment), about 10 dB at 0.5 ms FAST, untouched at 25 ms PUNCH.
 * The bezel prints GR as "x.x dB" (FxLabScreen), the meter in LAB NOTES as
 * "−x.x dB". Change a label, a default or the source level → update this
 * file; test/screenGuide_compression_20261031.test.ts pins names + numbers.
 *
 * STEPPED: each section fits SCREEN_GUIDE_BUDGET (types.ts).
 * Copy rules: plain language, short sentences; KNOWLEDGE, never skills; no
 * gear brand names; no "N of total"; "suggest" never "recommend"; no build
 * notes in learner text.
 */
import type { ScreenGuide } from '../../features/lab/screenGuide/types';

/** The LabShell tabs this lab offers. */
export type CompressionScreenId = 'explore' | 'learn' | 'check';

export const COMPRESSION_SCREEN_GUIDES: Record<CompressionScreenId, ScreenGuide> = {
  // ── EXPLORE — the rack ────────────────────────────────────────────────────
  explore: {
    intro: {
      learning: 'How a compressor turns down only the level above the threshold, by the ratio, and how attack and release set how fast it clamps and lets go.',
      start: 'Tap ▶ to play CLICK 120 and watch GR kick on each hit. Then switch SOURCE to SINE 440 Hz, set THRESH to −30 dB, and watch GR hold at about 7 dB.',
    },
    seeing: [
      'Sound flows IN ▸ through COMP ▸ OUT. Dashed lines mark the threshold; the dotted outline is the sound untouched.',
      'THRESH and RATIO show your settings. GR is gain reduction, the dB being turned down now (— dB stopped); the ladder at right echoes it.',
      'It’s a TEACHING MODEL, but the 5 ms CLICK is the real click. At ATTACK 5 ms its spike passes almost whole (about 1 dB lower): GR peaks as each click ends.',
    ],
    control: [
      'Tap ▶ in the header, or tap the display, to play the SOURCE through the compressor; ■ stops it. Drag the THRESH fader from −50 to −10 dB.',
      'RATIO: 2:1 GLUE, 4:1, 8:1 or 20:1 LIMIT. ATK/REL: ATTACK from 0.5 ms FAST to 100 ms, RELEASE 30, 120 or 500 ms.',
      'On CLICK, the amber strip under OUT is the model’s GR: THRESH and RATIO change how deep it hangs. GR PEAK prints its deepest point; live GR can read lower.',
      'Tap MAKEUP for 0 dB or +6 dB, and SOURCE for CLICK 120, SINE 440 Hz or PINK NOISE.',
      'Long-press any key or readout for its lesson entry. Below, LAB NOTES holds the intro, the GAIN REDUCTION meter, the DESIGNED RESPONSE curve, THE AUDIO PATH, two CHECK YOURSELF questions and the GUIDED LESSON.',
    ],
    changes: [
      'Only level over the threshold is turned down: at 4:1, every 4 dB over comes out as 1 (12 dB over → 3).',
      'ATTACK is how fast it clamps, RELEASE how fast it lets go. At the start (CLICK 120, THRESH −40 dB, ATTACK 5 ms) GR kicks about 3–5 dB on each hit, then falls back to 0.0.',
      'MAKEUP raises the output afterwards; GR stays the same.',
      'Every SOURCE peaks near −20 dBFS, so a threshold above that does nothing.',
    ],
    teaches: [
      'Threshold, ratio, attack, release and makeup are the settings every compressor shares; GR shows you it is working.',
      'Compression narrows the gap between loud and soft; makeup brings the overall level back.',
      'A gate or expander works on the other side of the threshold, below it. A limiter is compression with the ratio taken to the top.',
    ],
    tryThis: [
      'Set SOURCE to SINE 440 Hz, tap ▶ and put THRESH at −30 dB: GR holds at about 7 dB. Ride THRESH up to −20 dB: GR falls to 0.0, because the tone no longer crosses.',
      'Back at −30 dB, step RATIO: 2:1 GLUE about 5 dB, 4:1 about 7, 8:1 about 8, 20:1 LIMIT about 9 — never past the 10 dB the tone peaks over.',
      'On CLICK 120 at THRESH −40 dB, GR kicks on each hit, then falls to 0.0. Pick ATTACK 25 ms PUNCH: GR stays 0.0. The 5 ms click ends before the clamp builds, so the spike passes untouched.',
    ],
  },

  // ── LEARN — the reading page ──────────────────────────────────────────────
  learn: {
    intro: {
      learning: 'The language of compression, the formula behind gain reduction, and why a bigger GR number is not the goal when you compare at matched level.',
      start: 'Scroll to FORMULA / CONCEPT and work out 12 dB over the threshold at 4:1. Then switch to EXPLORE and play SINE 440 Hz at THRESH −30 dB to see GR at work.',
    },
    seeing: [
      'This is the Compression lab’s guided lesson as one page to read. Nothing on it moves, but ▶ in the header still plays or stops the sound.',
      'It starts with what a compressor is. Then CONTROLS: one entry each for the display, THRESH, RATIO, ATTACK, RELEASE, MAKEUP and the GR meter.',
      'It ends with COMMON MISTAKES, PRO TIPS and FORMULA / CONCEPT.',
    ],
    control: [
      'Scroll to read. Use the tabs under the title to switch between LEARN, EXPLORE (the live compressor) and CHECK (four questions).',
      'On EXPLORE, long-press any key or readout to open just its entry as a sheet. ⓘ GUIDED LESSON at the end of LAB NOTES opens this whole lesson.',
    ],
    changes: [
      'Read this page beside EXPLORE: each CONTROLS entry is a fader, key or readout you can try there.',
      'FORMULA / CONCEPT: above the threshold, gain reduction = (input − threshold) × (1 − 1/ratio); below it, nothing changes.',
      'Most COMMON MISTAKES are a setting pushed too far — attack too fast, release too fast, too much ratio — and what you hear when it is.',
    ],
    teaches: [
      'The words of compression: threshold, ratio, attack, release, makeup gain, gain reduction, and the knee (how gently compression starts around the threshold).',
      'Why a bigger GR number is not the goal, and why a fair comparison matches the levels first: louder tends to sound better.',
      'How gain reduction grows both with how far a sound goes over the threshold and with the ratio.',
    ],
    tryThis: [
      'Work the formula: 12 dB over at 4:1 → 12 × (1 − 1/4) = 9 dB of gain reduction, so the output sits 3 dB over the threshold. CHECK asks the same kind of sum.',
      'Read the COMMON MISTAKES line on attack, then on EXPLORE play CLICK 120 at THRESH −40 dB: ATTACK 0.5 ms FAST kicks GR deeper and squeezes the drawn spike; 25 ms PUNCH leaves GR at 0.0.',
    ],
  },

  // ── CHECK — the understanding check ───────────────────────────────────────
  check: {
    intro: {
      learning: 'A review of compression’s core ideas: ratio arithmetic, what happens below the threshold, what attack changes, and what makeup gain is for.',
      start: 'Read the first question, the ratio sum, and tap an answer. If one stumps you, use the tabs to look it up on LEARN or try it on EXPLORE, then come back.',
    },
    seeing: [
      'This is CHECK YOUR UNDERSTANDING: four questions on compression — the ratio sum, a signal below the threshold, attack, and makeup gain.',
      'A ✓ replaces a question’s number once you get it right. The line under the title says how many are still to get right.',
    ],
    control: [
      'Tap an option. Right: it turns green and CORRECT explains why. Wrong: NOT QUITE — TRY ANOTHER explains, and you pick again straight away.',
      'Nothing is scored. Use the tabs to switch to LEARN or EXPLORE at any time to look up a compressor setting.',
    ],
    changes: [
      'Each answer shows its explanation at once, right or wrong, so a wrong pick about ratio or attack still teaches you something.',
      'Get all four right and the check is passed. A pass is kept: you never need to take the check twice.',
    ],
    teaches: [
      'How a ratio shrinks the dB that go over the threshold, and what a compressor does to sound that stays under it.',
      'What attack time changes about a drum hit, and what makeup gain is for.',
    ],
    tryThis: [
      'Stuck on the ratio question? On EXPLORE, play SINE 440 Hz at THRESH −30 dB and step RATIO from 2:1 GLUE to 20:1 LIMIT: GR grows from about 5 to 9 dB, so less of the overshoot comes out.',
      'Unsure about below the threshold? Read FORMULA / CONCEPT on LEARN, or long-press THRESH on EXPLORE to open its lesson entry.',
    ],
  },
};

/** The guide for a LabShell tab — LabShell's per-tab `guide` function. */
export function compressionScreenGuide(mode: string): ScreenGuide | undefined {
  return mode === 'explore' || mode === 'learn' || mode === 'check' ? COMPRESSION_SCREEN_GUIDES[mode] : undefined;
}
