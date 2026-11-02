/**
 * Phase Lab — "explain this screen" content (Screen Guide rollout,
 * 2026-10-31; standard = wave/waveScreenGuides.ts, LabShell pattern =
 * chainScreenGuides.ts).
 *
 * The lab is ONE FxLabScreen (fxLabConfigs.tsx `phaseConfig`) on LabShell's
 * Rack Unit, with three tabs, so the guides are keyed by the shell's tab id:
 *   explore — the rack: the animated L/R flow display (IN ▸ · "R: Ø · DLY" ·
 *             ▸ OUT), the POL / DLY R / FOLD readouts, the DLY R fader and
 *             the POL / FOLD / SOURCE keys, the header ▶, LAB NOTES
 *             (DESIGNED RESPONSE = the 440 Hz phase scope + CORRELATION, THE
 *             AUDIO PATH, two CHECK YOURSELF cards, GUIDED LESSON);
 *   learn   — the reading page (the guided lesson, content.ts `phase`);
 *   check   — CHECK YOUR UNDERSTANDING (understandingChecks.ts PHASE).
 *
 * Every name is the on-screen name in fxLabConfigs.tsx / FxLabScreen.tsx /
 * fxAnim.tsx (StereoFlow) / fxViz.tsx (LissajousGraph) / LabShell.tsx /
 * rack/*. Every CORRELATION number is what LissajousGraph prints (toneHz 440,
 * width 100 %): corr = cos(2π·440·τ), negated when POL is INVERTED Ø.
 *   DLY R 0 ms   → +1.00 "mono / in phase"; INVERTED Ø → −1.00 "ANTI-PHASE";
 *   DLY R 1.1 ms → 174° → −0.99 "ANTI-PHASE"; INVERTED Ø → +0.99;
 *   DLY R 2.3 ms → 1.01 cycles → +1.00 (a 440 Hz cycle is 2.27 ms).
 * The SOUND (Effects.hpp StereoEffect: R flipped, R delayed in whole samples,
 * MONO = (L+R)/2): SINE 440 Hz in MONO at DLY R 1.1 ms falls about 23 dB
 * (52 samples at 48 kHz, 48 at 44.1 kHz) — "nearly vanishes"; with INVERTED Ø
 * it returns to within 0.1 dB. PINK NOISE in MONO with a delay combs; a flip
 * moves the notches (odd multiples of 1/2τ → multiples of 1/τ) but cannot
 * remove them.
 * The flow display draws the same 440 Hz tone (fxAnim StereoFlow
 * STEREO_TONE_HZ: one drawn cycle = 1/440 s ≈ 2.27 ms; D41 fix 2026-11-01 —
 * it used to draw 12 ms as one cycle, an 83 Hz tone that contradicted the
 * scope and the sound). So at DLY R 1.1 ms in MONO its OUT trace shrinks to
 * |cos(π·440·τ)| ≈ 5 % of full height, as the tone nearly vanishes. The TRY
 * THIS steps still quote CORRELATION and the sound, never an angle read off
 * the flow.
 * test/screenGuide_phase_20261031.test.ts pins the names and re-runs every
 * number. Change a label, a default or the scope tone → update this file.
 *
 * STEPPED: each section must fit SCREEN_GUIDE_BUDGET (types.ts).
 * Copy rules: plain language, short sentences; KNOWLEDGE, never skills; no
 * gear brand names; no "N of total"; "suggest" never "recommend"; no build
 * notes in learner text.
 */
import type { ScreenGuide } from '../../features/lab/screenGuide/types';

/** The LabShell tabs this lab offers (it has a CHECK tab). */
export type PhaseScreenId = 'explore' | 'learn' | 'check';

/**
 * ACCURACY CHIP (owner rule 2026-10-31): a CONCEPT lab. The flow is a
 * "TEACHING MODEL … NOT A MEASUREMENT" and the scope + CORRELATION are
 * "ANALYTIC (440 Hz model)" — nothing on the screen is measured from a
 * microphone or the live audio — so the AccuracyNote chip goes and the ⓘ
 * takes its spot. Pass this as LabShell's `accuracy`.
 */
export const PHASE_ACCURACY_CHIP = false;

export const PHASE_SCREEN_GUIDES: Record<PhaseScreenId, ScreenGuide> = {
  // ── EXPLORE — the rack ────────────────────────────────────────────────────
  explore: {
    seeing: [
      'The same tone in both channels (“SAME TONE IN L AND R”) enters at IN ▸, passes the green “R: Ø · DLY” stage (R only) and leaves at ▸ OUT as L (amber) and R (blue). Matching channels draw as one line.',
      'With PINK NOISE: “PART OF THE NOISE · L = R”. Readouts: POL, DLY R, FOLD.',
      'LAB NOTES, DESIGNED RESPONSE: a 440 Hz phase scope (M = mid, L+R, up; S = side, L−R, across) and its CORRELATION, +1 to −1.',
    ],
    control: [
      '▶ in the header, or a tap on the display, plays the source; ■ stops it. It plays at −20 dBFS, uncalibrated.',
      'DLY R fader (0 to 10 ms, in 0.1 ms steps): delays the right channel. Double-tap the lane to return to 0 ms.',
      'POL key: NORMAL or INVERTED Ø — flips the right channel upside down. FOLD key: STEREO or MONO (L+R), the two channels added into one.',
      'SOURCE key: SINE 440 Hz or PINK NOISE. Long-press a key or readout for its lesson entry; the ⓘ at the end of the readouts opens the lesson’s display entry: this moving display, then the scope in LAB NOTES.',
      'LAB NOTES holds two CHECK YOURSELF questions. ▴ HIDE DISPLAY gives them room; ⤢ FULL SCREEN enlarges the display.',
    ],
    changes: [
      'INVERTED Ø multiplies R by −1: every frequency flips at once. Against an identical L the scope lies flat at −1.00, and MONO (L+R) adds up to silence.',
      'DLY R is a time shift. One delay is a different share of each frequency’s cycle, so the phase shift grows with frequency.',
      'In MONO a delay combs: some frequencies cancel, others add. The scope shows the channels before FOLD.',
    ],
    teaches: [
      'Polarity and phase are not the same: a flip is 180° at every frequency; a delay shifts each frequency by a different angle.',
      'Correlation +1 = safe in mono; −1 = cancels in mono; near 0 = unrelated.',
      'A mono listener hears only L+R, so a mono check catches cancellation.',
      'Stereo Imaging reads the same correlation.',
      'In the Advanced Training Labs list, Phase sits after Modulation.',
    ],
    tryThis: [
      'Play SINE 440 Hz and set POL to INVERTED Ø: CORRELATION (LAB NOTES, under DESIGNED RESPONSE) reads −1.00, ANTI-PHASE. Now FOLD to MONO (L+R): silence, and the OUT trace goes flat.',
      'POL NORMAL, FOLD MONO, DLY R at 1.1 ms: CORRELATION reads −0.99; the tone and the OUT trace nearly vanish. POL to INVERTED Ø: +0.99, the tone is back — for this one frequency.',
      'Keep MONO and 1.1 ms, pick PINK NOISE: hollow and combed. Flip POL: the notches move but stay — no flip fixes a delay at every frequency. With POL on NORMAL, DLY R to 0 ms clears it.',
    ],
  },

  // ── LEARN — the reading page ──────────────────────────────────────────────
  learn: {
    seeing: [
      'The LEARN tab: the guided lesson for this lab, as one page to read. Nothing here plays.',
      'First, polarity versus phase. Then CONTROLS: What the display shows, Polarity (invert), Delay one channel (0 – 10 ms), Mono-fold.',
      'Then COMMON MISTAKES, PRO TIPS and FORMULA / CONCEPT: ×(−1) for a flip, φ(f) = −2πfτ for a delay, and correlation.',
    ],
    control: [
      'Scroll to read. The tabs under the title switch to EXPLORE (the live display) and CHECK (the questions).',
      'On EXPLORE, ⓘ GUIDED LESSON at the end of LAB NOTES opens this same lesson as a sheet over the rack.',
      'On EXPLORE, long-press a dock key or a readout to open just its entry; long-press a SOURCE choice for that test signal’s own note.',
    ],
    changes: [
      'Nothing on this page moves — it is the reference for what EXPLORE shows.',
      'The CONTROLS entries match the dock keys: POL, DLY R, FOLD.',
      'The display entry describes the moving L and R display, then the phase scope; on EXPLORE the scope sits in LAB NOTES under DESIGNED RESPONSE.',
      'COMMON MISTAKES says how to read it: upright line = in phase (+1), flat line = anti-phase (−1), a ball = wide.',
    ],
    teaches: [
      'The words: polarity, phase, comb filtering, correlation, mono compatibility, goniometer.',
      'Why a polarity flip fixes a miswired cable but not a timing offset.',
      'The ideas the CHECK tab asks about.',
    ],
    tryThis: [
      'Read the formula φ(f) = −2πfτ, then on EXPLORE set DLY R to 2.3 ms with SINE 440 Hz: the scope is upright again, +1.00 — one whole 440 Hz cycle late lines back up.',
      'Read the mistake about a flip fixing cancellation, then on EXPLORE play PINK NOISE in MONO with DLY R at 1.1 ms: combed with POL NORMAL and with INVERTED Ø.',
    ],
  },

  // ── CHECK — CHECK YOUR UNDERSTANDING ──────────────────────────────────────
  check: {
    seeing: [
      'CHECK YOUR UNDERSTANDING for the Phase lab: four questions, each with its answer choices.',
      'One numbered card per question; a ✓ replaces the number once it is answered right.',
      'When every answer is right, a note says the lab is complete.',
    ],
    control: [
      'Tap an answer. Right: CORRECT and a short explanation, and the card locks. Wrong: NOT QUITE — TRY ANOTHER with the same explanation as a nudge; tap another answer.',
      'There is no score and no limit on tries.',
      'The tabs under the title go to LEARN or EXPLORE to look something up; answers already right stay right. Leaving the lab before the last one starts the check over.',
    ],
    changes: [
      'Each right answer stays right while you are in this lab.',
      'Every answer right: the lab is marked complete, and it counts toward each certificate and program that needs it.',
      'Each explanation ties back to something on EXPLORE you can see or hear.',
    ],
    teaches: [
      'Why an inverted copy cancels in mono, why a flip cannot fix a 2 ms delay, why phase shift grows with frequency, and what +1 on the correlation meter means.',
      'Passing it completes the Phase lab.',
    ],
    tryThis: [
      'Stuck on the 2 ms question? On EXPLORE, play PINK NOISE in MONO with DLY R at 2 ms and flip POL — the comb stays.',
      'Unsure what +1 means? On EXPLORE, with DLY R at 0 ms and POL NORMAL, the scope is an upright line reading +1.00.',
    ],
  },
};

/** The guide for a LabShell tab — LabShell's per-tab `guide` function. */
export function phaseScreenGuide(mode: string): ScreenGuide | undefined {
  return mode === 'explore' || mode === 'learn' || mode === 'check' ? PHASE_SCREEN_GUIDES[mode] : undefined;
}
