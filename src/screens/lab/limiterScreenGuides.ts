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
 * dB). The guide says so instead of "held at once"; the screen's heroCaption
 * ("Sample peaks are held at …") still over-claims — a screen-code item.
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
    seeing: [
      'Sound flows left → right: IN ▸, through the green LIMIT bar, ▸ OUT. Dashed lines on OUT mark the ceiling; the dotted outline is the signal before the limiter.',
      'The GR ladder on the right grows down as the limiter holds the level down.',
      'Readouts: CEIL, RLS and GR — gain reduction, measured live (— dB while stopped).',
      'The drawing is a TEACHING MODEL; CLICK is drawn as a longer DRUM-HIT MODEL.',
    ],
    control: [
      '▶ in the header, or a tap on the display, plays the SOURCE through the limiter; ■ stops it. The CEILING fader runs from −45 to −15 dB.',
      'RLS key: 30, 120 or 500 ms. SOURCE key: SINE 440 Hz, CLICK 120 or PINK NOISE.',
      'Long-press any key or readout for its lesson entry. Below, LAB NOTES: the intro, the GAIN REDUCTION meter, the DESIGNED RESPONSE curve (the flat shelf), THE AUDIO PATH (it ends with a note on true peak), two CHECK YOURSELF questions and the GUIDED LESSON.',
    ],
    changes: [
      'Over the ceiling, the level is pulled down to it almost at once (an infinite ratio); below it, nothing changes. A sharp click can slip a few dB past first: there is no lookahead.',
      'GR is how far the input sits over the ceiling: still on a steady tone, a jump then recovery on a click.',
      'RLS sets how fast GR recovers after a peak, so it barely changes a steady tone.',
    ],
    teaches: [
      'A limiter is a compressor with a very high ratio: a ceiling that holds the output down.',
      'Why it sits last in a chain as the safety net, and why a GR of 0 is fine.',
      'Without lookahead even sample peaks can slip past on a sharp hit, and peaks between samples can poke above too — the lesson covers lookahead and true peak.',
      'It follows Compression and Gate / Expander; Smart Processors comes next.',
    ],
    tryThis: [
      'SINE 440 Hz, tap ▶, CEILING −25 dB: GR holds at about 5 dB — the −20 dBFS tone sits 5 dB over. Push CEILING to −45 dB: about 25 dB.',
      'Raise CEILING to −15 dB: GR reads 0.0 — the tone peaks under the ceiling and passes untouched.',
      'SOURCE → CLICK 120, CEILING −45 dB. RLS 30 ms: GR flicks up and is gone. RLS 500 ms: it falls back so slowly it never reaches 0.0 before the next hit.',
    ],
  },

  // ── LEARN — the reading page ──────────────────────────────────────────────
  learn: {
    seeing: [
      'The LEARN tab: this lab’s guided lesson as one page to read. Nothing here plays.',
      'First what a limiter is. Then CONTROLS — Ceiling, Drive, Release, Attack, Lookahead, True-Peak and more; this screen has Ceiling and Release, the rest are on real limiters.',
      'Then COMMON MISTAKES, PRO TIPS and FORMULA / CONCEPT.',
    ],
    control: [
      'Scroll to read. The tabs under the title switch between LEARN, EXPLORE (the live limiter) and CHECK (four questions).',
      'On EXPLORE, long-press any key or readout to open just its entry as a sheet; ⓘ GUIDED LESSON at the end of LAB NOTES opens this whole lesson.',
    ],
    changes: [
      'Nothing on this page moves — it is the reference for what EXPLORE shows.',
      'The lesson’s ceiling figures (around −1 dBTP) are for a finished master; this lab’s ceilings sit far lower because its sources peak at −20 dBFS.',
      'FORMULA / CONCEPT: a limiter is a compressor with the ratio taken toward ∞ — out never above the ceiling, as long as the lookahead covers the attack (this lab has none).',
    ],
    teaches: [
      'The words of limiting: ceiling, drive, release, lookahead, true peak, inter-sample peaks.',
      'Why pushing a limiter for loudness flattens the punch.',
      'CHECK asks four questions on it; Smart Processors is the next Dynamics lab.',
    ],
    tryThis: [
      'Work the sum: a source peaking at −20 dBFS under a −35 dB ceiling is held down 15 dB. On EXPLORE, SINE 440 Hz at CEILING −35 dB: GR reads about 15.',
      'Read the COMMON MISTAKES line on release, then on EXPLORE play CLICK 120 at CEILING −45 dB and compare RLS 30 ms with 500 ms on the GR ladder.',
    ],
  },

  // ── CHECK — the understanding check ───────────────────────────────────────
  check: {
    seeing: [
      'CHECK YOUR UNDERSTANDING: four questions on this lab — the ceiling rule, a GR sum, where a limiter goes in a chain, and true peak.',
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
      'Whether the ideas stuck: the ceiling as a hard cap, GR as the distance over it, the limiter as the last stage, and why masters leave a margin.',
      'Every question is answered by something EXPLORE shows or LEARN says.',
    ],
    tryThis: [
      'Unsure about the GR sum? On EXPLORE play SINE 440 Hz at CEILING −25 dB: GR reads about 5 dB.',
      'Unsure about true peak? The real wave between samples can peak higher than the samples — LEARN’s True-Peak entry explains it.',
    ],
  },
};

/** The guide for a LabShell tab — LabShell's per-tab `guide` function. */
export function limiterScreenGuide(mode: string): ScreenGuide | undefined {
  return mode === 'explore' || mode === 'learn' || mode === 'check' ? LIMITER_SCREEN_GUIDES[mode] : undefined;
}
