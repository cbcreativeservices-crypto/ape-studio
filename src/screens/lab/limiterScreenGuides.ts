/**
 * Limiter Lab — "explain this screen" content (Screen Guide rollout,
 * 2026-10-31; standard = wave/waveScreenGuides.ts, LabShell pattern =
 * chainScreenGuides.ts).
 *
 * The lab is ONE LabShell screen (FxLabScreen + fxLabConfigs limiterConfig)
 * with three tabs, keyed by the shell's tab id:
 *   explore — the rack: the animated flow display (IN ▸ LIMIT ▸ OUT) with the
 *             GR ladder, the CEIL / RLS / GR readouts, the CEILING fader and
 *             the RLS / SOURCE keys, LAB NOTES;
 *   learn   — the guided lesson as one reading page;
 *   check   — CHECK YOUR UNDERSTANDING (understandingChecks.ts LIMITER).
 *
 * Every name is the on-screen name (fxLabConfigs limiterConfig, FxLabScreen,
 * fxAnim DynamicsFlow, fxViz). Every GR number in TRY THIS was worked out from
 * the engine (Effects.hpp DynamicsEffect LimiterMode: a peak detector whose
 * attack is forced to 0.1 ms, GR = detector − ceiling) on the lab's SINE 440
 * Hz and CLICK 120 at −20 dBFS peak, on BOTH routes (headphones, and the
 * phone speaker's 150 Hz high-pass), re-run sample by sample in the test:
 *   SINE 440, CEILING −25 → GR 4.9–5.0 "about 5"; −45 → 24.9–25.0 "about 25";
 *   CEILING −20 and above → 0.0;
 *   CLICK 120, CEILING −45: RLS 30 ms → mostly 0.0 with brief flicks;
 *     RLS 500 ms → never back to 0.0 before the next hit (low ~16 dB);
 *   SINE 440, CEILING −35 → GR 14.9–15.0 "about 15" (LEARN's own sum).
 * No lookahead: on the CLICK the first rising cycles outrun the 0.1 ms
 * detector, so OUTPUT SAMPLE peaks pass the ceiling by ~2–5 dB (sine +0.05
 * dB). The guide says so instead of "held at once", and the screen's
 * heroCaption says so too (D42, 2026-11-01).
 * Change a label, a default or the source level → update this file;
 * test/screenGuide_limiter_20261031.test.ts pins names + numbers.
 *
 * STEPPED: each section fits SCREEN_GUIDE_BUDGET (types.ts).
 * Copy rules: plain language, short sentences; KNOWLEDGE, never skills; no
 * gear brand names; no "N of total"; "suggest" never "recommend"; no build
 * notes in learner text.
 */
import type { ScreenGuide } from '../../features/lab/screenGuide/types';

/** The LabShell tabs this lab offers. */
export type LimiterScreenId = 'explore' | 'learn' | 'check';

export const LIMITER_SCREEN_GUIDES: Record<LimiterScreenId, ScreenGuide> = {
  // ── EXPLORE — the rack ────────────────────────────────────────────────────
  explore: {
    intro: {
      learning: 'How a limiter sets a ceiling: peaks over it are pulled down to it, anything under passes untouched, and GR shows how far over the ceiling the input sits.',
      start: 'Set SOURCE to SINE 440 Hz, tap ▶ and drag CEILING to −25 dB: GR reads about 5 dB. Then switch to CLICK 120 and watch GR jump and recover.',
    },
    seeing: [
      'Sound flows left → right: IN ▸, through the green LIMIT bar, ▸ OUT. Amber dashed lines on OUT mark the ceiling; the faint gray outline is the signal before limiting.',
      'The GR (gain reduction) ladder on the right grows down as the level is held down.',
      'CEIL and RLS show your settings. GR is measured live (— dB while stopped).',
      'TEACHING MODEL: the drawing shows the idea. CLICK is drawn as a longer DRUM-HIT MODEL.',
    ],
    control: [
      'Tap ▶ in the header, or tap the display, to play the SOURCE through the limiter; ■ stops it. Drag the CEILING fader from −45 to −15 dB to set the level nothing should pass.',
      'RLS (release: 30, 120 or 500 ms) sets how fast the limiter lets go after a peak. SOURCE picks SINE 440 Hz, CLICK 120 or PINK NOISE.',
      'Long-press any key or readout for its lesson entry.',
      'Below, LAB NOTES has the intro, the GAIN REDUCTION meter, the DESIGNED RESPONSE curve (the flat shelf), THE AUDIO PATH (ending with a note on true peak), two CHECK YOURSELF questions and the GUIDED LESSON.',
    ],
    changes: [
      'Over the ceiling, the level is pulled down to it almost at once: the ratio is infinite. Below it, nothing changes. A sharp click can slip a few dB past first, because this limiter can’t look ahead.',
      'GR is how far the input sits over the ceiling. On a steady tone it holds steady; on a click it jumps, then recovers.',
      'RLS sets how fast GR recovers after a peak, so it barely changes a steady tone.',
    ],
    teaches: [
      'A limiter is a compressor with a very high ratio. Its ceiling holds the output down.',
      'It sits last in a chain as the safety net. A GR of 0 is fine: nothing went over.',
      'Without lookahead, sample peaks can slip past on a sharp hit, and peaks between samples can poke above too.',
      'GR is subtraction: input peak minus ceiling.',
    ],
    tryThis: [
      'Play SINE 440 Hz and set CEILING to −25 dB: GR holds at about 5 dB, because the −20 dBFS tone sits 5 dB over. Push CEILING to −45 dB: about 25 dB.',
      'Raise CEILING to −15 dB: GR reads 0.0 — the tone peaks under the ceiling and passes untouched.',
      'Set SOURCE to CLICK 120 and CEILING to −45 dB. RLS 30 ms: GR flicks up and is gone. RLS 500 ms: it falls back so slowly it never reaches 0.0 before the next hit.',
    ],
  },

  // ── LEARN — the reading page ──────────────────────────────────────────────
  learn: {
    intro: {
      learning: 'The vocabulary of limiting (ceiling, drive, release, lookahead, true peak) and why a master’s ceiling sits near −1 dBTP while this lab’s sit far lower.',
      start: 'Scroll to the CEILING and RLS entries. Then switch to EXPLORE and play SINE 440 Hz at CEILING −35 dB to check the GR sum the lesson works out.',
    },
    seeing: [
      'This is the lab’s guided lesson as one page to read. Nothing on it moves, but ▶ in the header still plays or stops the sound.',
      'First what a limiter is. Then CONTROLS: CEILING, Threshold / Input Gain (Drive), RLS, Attack, Lookahead, True-Peak and more. This screen has CEILING and RLS; the rest are on real limiters.',
      'Then COMMON MISTAKES, PRO TIPS and FORMULA / CONCEPT.',
    ],
    control: [
      'Scroll to read. The tabs under the title switch between LEARN, EXPLORE (the live limiter) and CHECK (four questions).',
      'On EXPLORE, long-press any key or readout to open just its entry as a sheet. ⓘ GUIDED LESSON at the end of LAB NOTES opens this whole lesson.',
    ],
    changes: [
      'Read this beside EXPLORE: CEILING and RLS are keys there.',
      'The lesson’s ceiling figures (around −1 dBTP) are for a finished master; this lab’s ceilings sit far lower because its sources peak at −20 dBFS.',
      'FORMULA / CONCEPT: a limiter is a compressor with the ratio taken toward ∞ (infinity). It keeps every peak under the ceiling only if it sees peaks coming early (lookahead). This lab has none.',
    ],
    teaches: [
      'The words of limiting: ceiling, drive, release, lookahead, true peak, inter-sample peaks.',
      'Why pushing a limiter for loudness flattens the punch of each hit.',
      'Why a final master leaves a margin under 0 dBFS: the real wave between samples can peak higher than the samples.',
    ],
    tryThis: [
      'Work the sum: a source peaking at −20 dBFS under a −35 dB ceiling is held down 15 dB. On EXPLORE, play SINE 440 Hz at CEILING −35 dB: GR reads about 15.',
      'Read the COMMON MISTAKES line on release, then on EXPLORE play CLICK 120 at CEILING −45 dB and compare RLS 30 ms with 500 ms on the GR ladder.',
    ],
  },

  // ── CHECK — the understanding check ───────────────────────────────────────
  check: {
    intro: {
      learning: 'A review of limiting: the ceiling rule, working out GR, where a limiter belongs in a chain, and why masters leave a margin below 0 dBFS.',
      start: 'Read each question and tap an answer. If one stumps you, switch to EXPLORE or LEARN to look it up, then come back.',
    },
    seeing: [
      'CHECK YOUR UNDERSTANDING: four questions on this lab — the ceiling rule, a GR sum, where a limiter goes in a chain, and true peak.',
      'A ✓ replaces a question’s number once it is right. The line under the title says how many you still need to get right.',
    ],
    control: [
      'Tap an option. Right: it turns green and CORRECT explains why. Wrong: NOT QUITE — TRY ANOTHER explains, and you pick again straight away.',
      'Nothing is scored. Use the tabs to switch to LEARN or EXPLORE at any time to look something up.',
    ],
    changes: [
      'Each answer shows its explanation at once, right or wrong, so a wrong pick still teaches.',
      'Get all four right and the lab is complete. A pass is kept: you never need to take the check twice.',
    ],
    teaches: [
      'What a ceiling promises about the output, and how GR follows from the input peak and the ceiling.',
      'Where a limiter belongs in a chain, and why a final master is not limited right up to 0 dBFS.',
    ],
    tryThis: [
      'Unsure about the GR sum? On EXPLORE, play SINE 440 Hz at CEILING −30 dB: GR reads about 10 dB, as the tone peaks at −20 dBFS. Work the question’s numbers the same way.',
      'Unsure about true peak? Read LEARN’s True-Peak entry: it explains what the real wave does between samples.',
    ],
  },
};

/** The guide for a LabShell tab — LabShell's per-tab `guide` function. */
export function limiterScreenGuide(mode: string): ScreenGuide | undefined {
  return mode === 'explore' || mode === 'learn' || mode === 'check' ? LIMITER_SCREEN_GUIDES[mode] : undefined;
}
