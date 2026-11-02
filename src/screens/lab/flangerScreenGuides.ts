/**
 * Flanger Lab — "explain this screen" content (Screen Guide rollout,
 * 2026-10-31; standard = wave/waveScreenGuides.ts).
 *
 * The lab is ONE LabShell screen (FxLabScreen + flangerConfig in
 * fxLabConfigs.tsx) with three tabs, so the guides are keyed by the shell's
 * tab id:
 *   explore — the rack: two animated spectrum analyzers (fxAnim SpectrumFlow,
 *             flanger), the bezel (CENTER · RATE · FDBK), the dock (CENTER
 *             fader · SWEEP tray = RATE + DEPTH · FDBK · MIX · SOURCE), the
 *             header ▶, LAB NOTES (DESIGNED RESPONSE, THE AUDIO PATH, two
 *             CHECK YOURSELF cards, ⓘ GUIDED LESSON);
 *   learn   — the reading page (the flanger guided lesson in full);
 *   check   — CHECK YOUR UNDERSTANDING (understandingChecks.ts FLANGER, four
 *             questions; LabUnderstandingCheck).
 *
 * Every number in TRY THIS is what the screen prints or draws at that
 * setting, from the engine's own law (Effects.hpp ModEffect, mode 1 —
 * wet = x(t−τ) + fb·wet(t−τ), out = (1−mix)·x + mix·wet; the analyzers and
 * the DESIGNED RESPONSE curve draw the same H(f)):
 *   • heroCaption spacing = round(1 / (CENTER s)): 0.50 ms → 2000 Hz,
 *     2.0 ms → 500 Hz, 5.0 ms → 200 Hz;
 *   • MIX 50%, peaks between notches: FDBK 0% → 0 dB (on the dotted input
 *     line), 40% → +2.5 dB, 70% → +6.7 dB (well above it);
 *   • MIX 100%, FDBK 40%: only −2.9 / +4.4 dB ripples — no deep notches;
 *   • MIX 100%, FDBK −70%: +10.5 / −4.6 dB — the resonant, hollow comb. The
 *     third EXPLORE step says it is hollow ONLY at 100%: at MIX 50% the same
 *     key draws a nearly flat trace (−2.0 / +1.3 dB), as the screen's caption
 *     says (D42, 2026-11-01).
 * Positive FDBK makes the notches SHALLOWER at MIX 50% (−∞ → −16.9 →
 * −13.7 dB), so no guide line here claims "deeper notches", and none calls
 * −70% hollow without its 100% condition.
 * test/screenGuide_flanger_20261031.test.ts pins the names and recomputes the
 * numbers. Change a label, range or default → update this file.
 *
 * STEPPED: each section must fit SCREEN_GUIDE_BUDGET (types.ts).
 * Copy rules: plain language, short sentences; KNOWLEDGE, never skills; no
 * gear brand names; no "N of total"; "suggest" never "recommend"; no build
 * notes in learner text.
 */
import type { ScreenGuide } from '../../features/lab/screenGuide/types';

/** The LabShell tabs this lab offers. */
export type FlangerScreenId = 'explore' | 'learn' | 'check';

export const FLANGER_SCREEN_GUIDES: Record<FlangerScreenId, ScreenGuide> = {
  // ── EXPLORE — the rack ────────────────────────────────────────────────────
  explore: {
    seeing: [
      'Two spectrum analyzers. Left (IN ▸): the source — PINK NOISE draws flat, WHITE NOISE rises to the right. Right, past the green FLANGER bar (SPECTRUM (dB), to ▸ OUT): the same noise after the flanger.',
      'On OUT the amber trace shows the notches sweeping; the dotted line is the input, for comparison. Ticks mark 100, 1k and 10k Hz.',
      'Readouts on the frame: CENTER, RATE and FDBK.',
    ],
    control: [
      '▶ at the top right (or a tap on the display) plays the noise through the flanger; ■ stops it.',
      'CENTER fader (0.50–5.0 ms, starts at 2.0 ms): the delay the sweep moves around. Named for tape: a thumb on a reel’s flange (rim) slowed one of two copies.',
      'SWEEP: RATE (0.1 Hz, 0.2 Hz JET, 1 Hz or 5 Hz WARBLE) is how fast the notches move; DEPTH (30%, 50% or 90%) is how far.',
      'FDBK (FEEDBACK): 0%, 40%, 70% METALLIC or −70% HOLLOW — how much output is fed back in. MIX: 50% EVEN (dry and delayed copy at equal level) or 100%. SOURCE: PINK NOISE or WHITE NOISE.',
      'Long-press a key or readout for its lesson entry. Below: HIDE DISPLAY, FULL SCREEN, and LAB NOTES with the response curve and two quick questions.',
    ],
    changes: [
      'The flanger mixes in a copy delayed by a millisecond or two. Where the copy lands half a cycle late it cancels the dry sound — a notch — and notches repeat every 1 ÷ delay: every 500 Hz at 2.0 ms.',
      'Even steps in Hz crowd together toward the right of this scale, so up high they fill a band.',
      'The LFO moves the delay, so every notch slides together: the jet. Positive FDBK lifts tall, narrow peaks between them.',
    ],
    teaches: [
      'A flanger is a very short, moving delay mixed with the dry sound. Its notches are evenly spaced in Hz: spacing = 1 ÷ delay.',
      'A shorter delay spreads them wider; the moving sweep is what you hear as the jet.',
      'Second Modulation lab: after Chorus (the same idea, longer delay), before Phaser (uneven notches from filters, no delay line). Each picture is a teaching model.',
    ],
    tryThis: [
      'Drag CENTER from 2.0 ms down to 0.50 ms: the caption under DESIGNED RESPONSE goes from notches every 500 Hz to every 2000 Hz, and the notches on OUT spread apart.',
      'Step FDBK from 0% to 70% METALLIC: on OUT the peaks between the notches rise well above the dotted input line and narrow — listen for the comb starting to ring.',
      'Set MIX to 100%: the deep notches vanish — no dry sound is left to cancel. Now pick FDBK −70% HOLLOW: it sounds hollow only at 100%; at 50% EVEN it almost cancels the comb out.',
    ],
  },

  // ── LEARN — the reading page ──────────────────────────────────────────────
  learn: {
    seeing: [
      'The LEARN tab: the Flanger guided lesson as one page to read. Nothing on it moves; the ▶ in the header still plays or stops the sound.',
      'What a flanger is, then CONTROLS: the display, Rate, Depth, Manual / Delay time, Feedback, Mix, LFO Waveform, Stereo width, and Through-Zero (TZF, marked ADV).',
      'Then COMMON MISTAKES, PRO TIPS and FORMULA / CONCEPT.',
    ],
    control: [
      'Scroll to read. The tabs under the title switch to EXPLORE (the live rack) and CHECK (the questions that complete the lab).',
      'On EXPLORE, ⓘ GUIDED LESSON at the end of LAB NOTES opens this same lesson as a sheet; long-press a key or readout there to open just its entry.',
    ],
    changes: [
      'This page is the reference for what EXPLORE shows.',
      'On EXPLORE, Manual / Delay time is the CENTER fader, Rate and Depth share the SWEEP key, Feedback is FDBK, Mix is MIX.',
      'LFO Waveform and Stereo width are common on flangers; Through-Zero is a specialty. None has a key in this dock (here the left and right sweeps always sit a quarter cycle apart), and the ranges listed are wider than the rack’s.',
    ],
    teaches: [
      'The words for a flanger: comb filter, notch spacing, LFO, feedback (regeneration), through-zero.',
      'The formula: notches at odd multiples of 1 ÷ (2 × delay), spaced 1 ÷ delay apart.',
      'Why a sine tone is a poor test source, and why 100% wet loses the comb.',
    ],
    tryThis: [
      'Read FORMULA / CONCEPT, then on EXPLORE set CENTER to 5.0 ms: the caption reads notches every 200 Hz — 1 ÷ 0.005 s.',
      'Read the Mix entry, then on EXPLORE switch MIX between 50% EVEN and 100% and compare the notches on OUT.',
    ],
  },

  // ── CHECK — the questions that complete the lab ───────────────────────────
  check: {
    seeing: [
      'The CHECK tab: CHECK YOUR UNDERSTANDING for the Flanger lab — four questions, four answers each.',
      'A line under the heading says how many are still to get right. A ✓ replaces a question’s number once you answer it right.',
    ],
    control: [
      'Tap an answer. Right: it turns green and CORRECT shows why. Wrong: NOT QUITE — TRY ANOTHER shows why, and you pick again straight away.',
      'There is no score, and a wrong answer costs nothing. A right answer stays right.',
      'The tabs under the title go to LEARN or EXPLORE at any time; answers already right stay right. Leaving the lab before the last one starts the check over.',
    ],
    changes: [
      'Each question is about something EXPLORE shows: notch spacing at a 2 ms delay, flanger notches against a phaser’s, what FDBK does, and why a sine tone is a poor test.',
      'When all four are right the card reads Lab complete, and the tab opens already complete next time.',
    ],
    teaches: [
      'It checks the ideas: spacing = 1 ÷ delay, the even comb, feedback’s ringing peaks, and why the test source needs energy everywhere.',
      'Completing it finishes the Flanger lab; Phaser is next in Modulation.',
    ],
    tryThis: [
      'Before you start, on EXPLORE set CENTER to 2.0 ms and read the caption’s spacing — then work out why 1 ÷ 0.002 s gives it.',
      'For the source question: both SOURCE choices on EXPLORE are noise. Think about why no sine tone is offered.',
    ],
  },
};

/** The guide for a LabShell tab — LabShell's per-tab `guide` function. */
export function flangerScreenGuide(mode: string): ScreenGuide | undefined {
  return mode === 'explore' || mode === 'learn' || mode === 'check' ? FLANGER_SCREEN_GUIDES[mode] : undefined;
}
