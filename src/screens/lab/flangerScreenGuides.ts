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
    intro: {
      learning: 'How a flanger works: a copy delayed by a few milliseconds cancels the dry sound at evenly spaced notches, and sweeping that delay makes the jet sound.',
      start: 'Tap ▶ to play PINK NOISE and watch the notches slide on OUT. Then drag CENTER from 2.0 ms down to 0.50 ms and see the notches spread apart.',
    },
    seeing: [
      'Two spectrum analyzers. Left of the green FLANGER bar (IN ▸) is your source: PINK NOISE draws flat, WHITE NOISE rises to the right. Right of the bar, SPECTRUM (dB) to ▸ OUT shows the same noise after the flanger.',
      'On OUT, the amber trace is what you hear: watch its notches sweep. The dotted line is the input, to compare. Ticks mark 100, 1k and 10k Hz.',
      'CENTER, RATE and FDBK on the frame show your settings.',
    ],
    control: [
      'Tap ▶ at the top right, or the display, to play the noise through the flanger; ■ stops it.',
      'Drag the CENTER fader (0.50–5.0 ms, starts at 2.0 ms) to set the delay the sweep moves around. Named for tape: a thumb on a reel’s flange (rim) slowed one of two copies.',
      'In SWEEP, RATE (0.1 Hz, 0.2 Hz JET, 1 Hz or 5 Hz WARBLE) sets how fast the notches move; DEPTH (30%, 50% or 90%) how far.',
      'FDBK (FEEDBACK: 0%, 40%, 70% METALLIC or −70% HOLLOW) feeds output back in. MIX: 50% EVEN (dry and delayed copy equal) or 100%. SOURCE: PINK NOISE or WHITE NOISE.',
      'Long-press a key or readout for its lesson entry. Below: HIDE DISPLAY, FULL SCREEN, and LAB NOTES with the response curve and two quick questions.',
    ],
    changes: [
      'The flanger mixes in a copy of your sound 0.5–5 ms late. Where it lands half a cycle late, it cancels the dry sound: a notch. Notches repeat every 1 ÷ delay: every 500 Hz at 2.0 ms.',
      'The Hz scale runs in octaves, so evenly spaced notches crowd right and fill a band up high.',
      'The LFO (a slow wobble) moves the delay, so every notch slides at once: the jet. Positive FDBK lifts tall, narrow peaks between them.',
    ],
    teaches: [
      'A flanger is a very short, moving delay mixed with the dry sound. Its notches are evenly spaced in Hz: spacing = 1 ÷ delay.',
      'A shorter delay spreads the notches wider. The sweep that moves them is what you hear as the jet.',
      'Chorus uses the same idea with a longer delay. A phaser makes uneven notches with filters, not a delay line.',
    ],
    tryThis: [
      'Open LAB NOTES and drag CENTER from 2.0 ms to 0.50 ms: the caption under DESIGNED RESPONSE goes from notches every 500 Hz to every 2000 Hz, and the notches on OUT spread apart.',
      'Step FDBK from 0% to 70% METALLIC: on OUT the peaks between the notches rise well above the dotted input line and narrow. Listen for the comb starting to ring.',
      'Set MIX to 100%: the deep notches vanish, with no dry sound left to cancel. Add FDBK −70% HOLLOW: it sounds hollow only at MIX 100%. At 50% EVEN the same setting draws a nearly flat trace.',
    ],
  },

  // ── LEARN — the reading page ──────────────────────────────────────────────
  learn: {
    intro: {
      learning: 'The language of flanging (comb filter, notch spacing, LFO, feedback, through-zero) and the formula that places every notch from the delay time.',
      start: 'Scroll to FORMULA / CONCEPT and read it. Then switch to EXPLORE, open LAB NOTES, set CENTER to 5.0 ms, and check that the notches sit every 200 Hz.',
    },
    seeing: [
      'This is the Flanger guided lesson as one page to read. Nothing on it moves, but ▶ in the header still plays or stops the sound.',
      'It starts with what a flanger is, then CONTROLS: the display, RATE, DEPTH, CENTER, FDBK, MIX, LFO Waveform, Stereo width / LFO phase offset, and Through-Zero (TZF, marked ADV for advanced).',
      'It ends with COMMON MISTAKES, PRO TIPS and FORMULA / CONCEPT.',
    ],
    control: [
      'Scroll to read. Use the tabs under the title to switch to EXPLORE, the live rack, or CHECK, four questions on flanging.',
      'On EXPLORE, ⓘ GUIDED LESSON at the end of LAB NOTES opens this same lesson as a sheet. Long-press a key or readout there to open just its entry.',
    ],
    changes: [
      'Read this beside EXPLORE: most entries are something you can hear or see there.',
      'On EXPLORE, CENTER is the CENTER fader, RATE and DEPTH share the SWEEP key, and FDBK and MIX are keys of their own.',
      'LFO Waveform and Stereo width are common on flangers; Through-Zero is a specialty. None has a key on this rack, and their entries say so (this rack’s left and right sweeps always sit a quarter cycle apart).',
    ],
    teaches: [
      'The words for a flanger: comb filter (a row of evenly spaced notches), notch spacing, LFO (the slow wobble that moves the delay), feedback (regeneration), through-zero.',
      'The formula: notches at odd multiples of 1 ÷ (2 × delay), spaced 1 ÷ delay apart.',
      'Why a sine tone, with energy at one frequency only, is a poor test source, and why 100% wet loses the comb.',
    ],
    tryThis: [
      'Read FORMULA / CONCEPT, then on EXPLORE open LAB NOTES and set CENTER to 5.0 ms: the caption reads notches every 200 Hz, which is 1 ÷ 0.005 s.',
      'Read the MIX entry, then on EXPLORE switch MIX between 50% EVEN and 100% and compare OUT: the deep notches at 50% EVEN are gone at 100%.',
    ],
  },

  // ── CHECK — the questions that complete the lab ───────────────────────────
  check: {
    intro: {
      learning: 'A review of the flanger’s core ideas: notch spacing set by the delay, a flanger’s comb versus a phaser’s notches, what feedback does, and the source a comb needs.',
      start: 'Start with the first question, on notch spacing, and tap an answer. If one stumps you, reread its part of the lesson on LEARN and come back. Right answers stay right.',
    },
    seeing: [
      'This is CHECK YOUR UNDERSTANDING for the Flanger lab: four questions, four answers each.',
      'A line under the heading says how many are still to get right. A ✓ replaces a question’s number once you answer it right.',
    ],
    control: [
      'Tap an answer. Right: it turns green and CORRECT shows why. Wrong: NOT QUITE — TRY ANOTHER shows why, and you pick again straight away.',
      'There is no score, and a wrong answer costs nothing. A right answer stays right.',
      'Use the tabs under the title to go to LEARN or EXPLORE at any time; answers already right stay right. If you leave the lab before the last one, the check starts over.',
    ],
    changes: [
      'Each question is about something you heard or saw on EXPLORE: notch spacing at a 2 ms delay, flanger notches against a phaser’s, what FDBK does, and why a sine tone is a poor test.',
      'Get all four right and the card reads Check passed. A pass is kept: the tab opens already complete next time.',
    ],
    teaches: [
      'How a flanger’s delay sets the spacing of its notches, and how its comb differs from a phaser’s.',
      'What feedback does to the sound between the notches, and what kind of source lets you hear a comb.',
    ],
    tryThis: [
      'Test the spacing law on a different delay: on EXPLORE, with MIX on 50% EVEN, slide CENTER to the top, 5.0 ms. The caption under DESIGNED RESPONSE reads notches every 200 Hz: 1 ÷ 0.005 s.',
      'For the source question, reread the COMMON MISTAKES line on test sources on LEARN, then come back.',
    ],
  },
};

/** The guide for a LabShell tab — LabShell's per-tab `guide` function. */
export function flangerScreenGuide(mode: string): ScreenGuide | undefined {
  return mode === 'explore' || mode === 'learn' || mode === 'check' ? FLANGER_SCREEN_GUIDES[mode] : undefined;
}
