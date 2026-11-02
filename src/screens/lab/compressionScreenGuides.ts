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
    seeing: [
      'Sound flows IN ▸ through COMP ▸ OUT; dashed lines mark the threshold, the dotted outline the sound untouched.',
      'Readouts: THRESH, RATIO and live GR, gain reduction (— dB stopped); the ladder at right echoes it.',
      'The drawing is a TEACHING MODEL. Its 5 ms CLICK is the real click. At ATTACK 5 ms the spike passes almost whole (about 1 dB lower): GR peaks as the click ends, so the GR kick lands just after each hit.',
    ],
    control: [
      '▶ in the header, or a tap on the display, plays the SOURCE through the compressor; ■ stops it. The THRESH fader runs from −50 to −10 dB.',
      'RATIO key: 2:1 GLUE, 4:1, 8:1 or 20:1 LIMIT. ATK/REL key: ATTACK from 0.5 ms FAST to 100 ms, RELEASE 30, 120 or 500 ms.',
      'MAKEUP key: 0 dB or +6 dB. SOURCE key: CLICK 120, SINE 440 Hz or PINK NOISE.',
      'Long-press any key or readout for its lesson entry. Below, LAB NOTES: the intro, the GAIN REDUCTION meter, the DESIGNED RESPONSE curve, THE AUDIO PATH, two CHECK YOURSELF questions and the GUIDED LESSON.',
    ],
    changes: [
      'Only level over the threshold is turned down: at 4:1, every 4 dB over comes out as 1 (12 dB over → 3).',
      'ATTACK sets how fast it clamps, RELEASE how fast it lets go. At the start (CLICK 120, THRESH −40 dB, ATTACK 5 ms) GR kicks about 3–5 dB on each hit, then falls back to 0.0.',
      'MAKEUP raises the output afterwards; GR stays the same.',
      'Every SOURCE peaks near −20 dBFS, so a threshold above that does nothing.',
    ],
    teaches: [
      'Threshold, ratio, attack, release and makeup: the settings every compressor shares, and GR as the proof it is working.',
      'Compression narrows the gap between loud and soft; makeup brings the level back.',
      'It follows the Equalization labs in Advanced Training. Gate / Expander works the other side of the threshold; Limiter takes the ratio to the top.',
    ],
    tryThis: [
      'SOURCE → SINE 440 Hz, tap ▶, THRESH at −30 dB: GR holds at about 7 dB. Ride THRESH up to −20 dB: GR falls to 0.0 — the tone no longer crosses.',
      'Back at −30 dB, step RATIO: 2:1 GLUE about 5 dB, 4:1 about 7, 8:1 about 8, 20:1 LIMIT about 9 — never past the 10 dB the tone peaks over.',
      'CLICK 120, THRESH −40 dB (the start): GR kicks on each hit, then falls to 0.0. ATTACK 25 ms PUNCH: GR stays 0.0 — the 5 ms click ends before the clamp builds, and the drawn spike passes untouched.',
    ],
  },

  // ── LEARN — the reading page ──────────────────────────────────────────────
  learn: {
    seeing: [
      'The LEARN tab: this lab’s guided lesson as one page to read. Nothing here plays.',
      'First what a compressor is. Then CONTROLS: one entry each for the display, Threshold, Ratio, Attack, Release, Makeup gain and the GR meter.',
      'Then COMMON MISTAKES, PRO TIPS and FORMULA / CONCEPT.',
    ],
    control: [
      'Scroll to read. The tabs under the title switch between LEARN, EXPLORE (the live compressor) and CHECK (four questions).',
      'On EXPLORE, long-press any key or readout to open just its entry as a sheet; ⓘ GUIDED LESSON at the end of LAB NOTES opens this whole lesson.',
    ],
    changes: [
      'Nothing on this page moves — it is the reference for what EXPLORE shows.',
      'FORMULA / CONCEPT: above the threshold, gain reduction = (input − threshold) × (1 − 1/ratio); below it, nothing changes.',
      'Most COMMON MISTAKES are a setting pushed too far — attack too fast, release too fast, too much ratio — and what you hear when it is.',
    ],
    teaches: [
      'The words of compression: threshold, ratio, attack, release, makeup gain, gain reduction, and the knee from FORMULA / CONCEPT.',
      'Why a bigger GR number is not the goal, and why a fair comparison matches the levels first.',
      'CHECK asks four questions on it; Gate / Expander is the next Dynamics lab.',
    ],
    tryThis: [
      'Work the formula: 12 dB over at 4:1 → 12 × (1 − 1/4) = 9 dB of gain reduction, so the output rises 3 dB. CHECK asks the same kind of sum.',
      'Read the COMMON MISTAKES line on attack, then on EXPLORE play CLICK 120 at THRESH −40 dB: ATTACK 0.5 ms FAST kicks GR deeper and squeezes the drawn spike; 25 ms PUNCH leaves GR at 0.0.',
    ],
  },

  // ── CHECK — the understanding check ───────────────────────────────────────
  check: {
    seeing: [
      'CHECK YOUR UNDERSTANDING: four questions on this lab — the ratio sum, a signal below the threshold, attack, and makeup gain.',
      'A ✓ replaces a question’s number once it is right. The line under the title says how many are still to get right.',
    ],
    control: [
      'Tap an option. Right: it turns green and CORRECT explains why. Wrong: NOT QUITE — TRY ANOTHER explains, and you pick again straight away.',
      'Nothing is scored. The tabs switch to LEARN or EXPLORE at any time to look something up.',
    ],
    changes: [
      'Each answer shows its explanation at once, right or wrong, so a wrong pick still teaches.',
      'All four right and the lab is complete — passing this check is what counts it toward certificates, and a pass stays passed.',
    ],
    teaches: [
      'Whether the ideas stuck: ratio arithmetic, the threshold as the line where the work starts, attack as a speed, makeup as level restored.',
      'Every question is answered by something EXPLORE shows or LEARN says.',
    ],
    tryThis: [
      'Stuck on the ratio question? On EXPLORE, SINE 440 Hz at THRESH −30 dB, step RATIO from 2:1 GLUE to 20:1 LIMIT: GR grows from about 5 to 9 dB, so less of the overshoot comes out.',
      'Unsure about below the threshold? On EXPLORE play SINE 440 Hz at THRESH −10 dB: GR reads 0.0.',
    ],
  },
};

/** The guide for a LabShell tab — LabShell's per-tab `guide` function. */
export function compressionScreenGuide(mode: string): ScreenGuide | undefined {
  return mode === 'explore' || mode === 'learn' || mode === 'check' ? COMPRESSION_SCREEN_GUIDES[mode] : undefined;
}
