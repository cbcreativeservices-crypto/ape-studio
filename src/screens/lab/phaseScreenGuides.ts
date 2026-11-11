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
    intro: {
      learning: 'How a polarity flip differs from a time delay: a flip turns every frequency upside down, a delay shifts each frequency differently, and folding to mono shows what cancels.',
      start: 'Tap ▶ with SINE 440 Hz. Set POL to INVERTED Ø, then FOLD to MONO (L+R) and hear the tone vanish. Then set POL back to NORMAL and drag DLY R.',
    },
    seeing: [
      'Your tone enters at IN ▸ as SAME TONE IN L AND R. Only R passes the green R: Ø · DLY stage. At ▸ OUT, L is amber and R is blue; matching channels draw as one line.',
      'With PINK NOISE the label reads PART OF THE NOISE · L = R. POL, DLY R and FOLD show your settings.',
      'In LAB NOTES, DESIGNED RESPONSE holds a 440 Hz phase scope: M (mid, L+R) up, S (side, L−R) across. Its CORRELATION reads +1 to −1.',
    ],
    control: [
      'Tap ▶ in the header, or the display, to play; ■ stops. It plays at −20 dBFS, a digital level: how loud you hear it depends on your volume.',
      'Drag the DLY R fader (0 to 10 ms, in 0.1 ms steps) to make the right channel arrive later. Double-tap the lane for 0 ms.',
      'POL: INVERTED Ø flips the right channel upside down; NORMAL leaves it. FOLD: MONO (L+R) adds the two channels into one, as a mono speaker would; STEREO keeps them apart.',
      'SOURCE picks SINE 440 Hz or PINK NOISE. Long-press a key or readout for its lesson entry; the ⓘ after the readouts explains this display.',
      'LAB NOTES also holds two CHECK YOURSELF questions. ▴ HIDE DISPLAY gives them room; ⤢ FULL SCREEN enlarges the display.',
    ],
    changes: [
      'INVERTED Ø multiplies R by −1: every frequency flips at once. Against an identical L, the scope lies flat at −1.00, and MONO (L+R) sums to silence.',
      'DLY R shifts R in time. One delay is a bigger share of a short high-frequency cycle than of a long low one, so phase shift grows with frequency.',
      'In MONO, a delay forms a comb filter: some frequencies cancel, others add. The scope shows the channels before FOLD.',
    ],
    teaches: [
      'Polarity and phase are not the same. A flip turns the whole wave upside down; a delay shifts each frequency by a different amount.',
      'Correlation +1 means L and R move together, safe in mono; −1 means they cancel in mono; near 0 means they are unrelated.',
      'A mono listener hears only L+R, so a mono check catches cancellation.',
      'A flip fixes an inverted channel; a time offset needs the channels lined up in time.',
    ],
    tryThis: [
      'Play SINE 440 Hz and set POL to INVERTED Ø. CORRELATION (LAB NOTES, under DESIGNED RESPONSE) reads −1.00, ANTI-PHASE. Now set FOLD to MONO (L+R): silence, and the OUT trace goes flat.',
      'With POL NORMAL and FOLD MONO, set DLY R to 1.1 ms. CORRELATION reads −0.99; the tone and the OUT trace nearly vanish. Set POL to INVERTED Ø: +0.99, the tone is back, for this one frequency.',
      'Keep MONO and 1.1 ms and pick PINK NOISE: it sounds hollow. Flip POL: the notches move but stay, because no flip fixes a delay at every frequency. With POL on NORMAL, DLY R back to 0 ms clears them.',
    ],
  },

  // ── LEARN — the reading page ──────────────────────────────────────────────
  learn: {
    intro: {
      learning: 'The ideas behind EXPLORE, in words: polarity versus phase, why one delay shifts each frequency differently, why that combs in mono, and how to read correlation.',
      start: 'Read the polarity-versus-phase part first. Then find φ(f) = −2πfτ under FORMULA / CONCEPT and test it on EXPLORE with DLY R.',
    },
    seeing: [
      'The LEARN tab: this lab’s lesson as one page. Nothing on it moves; the header ▶ still plays or stops the sound.',
      'It starts with polarity versus phase. Then CONTROLS: What the display shows, POL (polarity), DLY R (0–10 ms), FOLD (mono-fold).',
      'Then COMMON MISTAKES, PRO TIPS and FORMULA / CONCEPT: ×(−1) for a flip, φ(f) = −2πfτ for a delay, and correlation.',
    ],
    control: [
      'Scroll to read. The tabs under the title switch to EXPLORE, where you hear each idea, and CHECK, where you answer the questions.',
      'On EXPLORE, ⓘ GUIDED LESSON at the end of LAB NOTES opens this same lesson as a sheet over EXPLORE, so you can read without leaving it.',
      'On EXPLORE, long-press a dock key or a readout to open just its entry. Long-press a SOURCE choice for that test signal’s own note.',
    ],
    changes: [
      'The page is your reference for EXPLORE.',
      'Each CONTROLS entry is named for its dock key: POL, DLY R and FOLD.',
      'The display entry explains the moving L and R picture. The phase scope sits on EXPLORE in LAB NOTES, under DESIGNED RESPONSE.',
      'COMMON MISTAKES shows how to read the scope: upright line = in phase (+1), flat line = anti-phase (−1), round ball = wide (near 0).',
    ],
    teaches: [
      'What polarity, phase, comb filtering, correlation, mono compatibility and a goniometer (a stereo phase scope) mean.',
      'Why a polarity flip fixes a miswired cable but not a timing offset.',
      'Why one delay shifts high frequencies by more degrees than low ones: the size of φ(f) = −2πfτ grows with f.',
    ],
    tryThis: [
      'Read the formula φ(f) = −2πfτ. Then on EXPLORE, set DLY R to 2.3 ms with SINE 440 Hz: the scope stands upright again at +1.00. One whole 440 Hz cycle late lines back up.',
      'Read the mistake about a flip fixing cancellation. Then on EXPLORE, play PINK NOISE in MONO with DLY R at 1.1 ms: it stays combed with POL on NORMAL and on INVERTED Ø.',
    ],
  },

  // ── CHECK — CHECK YOUR UNDERSTANDING ──────────────────────────────────────
  check: {
    intro: {
      learning: 'Review: what an inverted copy does in mono, whether a flip can fix a delay, how phase shift depends on frequency, and what +1 correlation means.',
      start: 'Tap the answer you think is right on the first card. Unsure about a question? Reread its part of the lesson on LEARN, then come back.',
    },
    seeing: [
      'CHECK YOUR UNDERSTANDING for the Phase lab: four questions, each with its answer choices.',
      'Each question has a numbered card. A ✓ replaces the number once you answer it right.',
      'When every answer is right, a note tells you the check is passed.',
    ],
    control: [
      'Tap an answer. If it’s right, you see CORRECT and a short explanation, and the card locks. If not, you see NOT QUITE — TRY ANOTHER with the same explanation as a nudge; tap another answer.',
      'There is no score and no limit on tries.',
      'Use the tabs under the title to look something up on LEARN or EXPLORE, such as the scope; answers already right stay right. If you leave the lab before every answer is right, the check starts over.',
    ],
    changes: [
      'Each right answer stays right while you are in this lab.',
      'Get all four right and the check is passed.',
      'Each explanation ties back to something on EXPLORE you can see or hear: the flat −1.00 scope, a silent MONO or a combed PINK NOISE.',
    ],
    teaches: [
      'What an inverted copy does in mono, whether a flip can fix a 2 ms delay, how a delay’s phase shift depends on frequency, and what +1 on the correlation meter means.',
      'Together they make the mono check: what cancels when channels are added, and which fix suits which problem.',
    ],
    tryThis: [
      'Stuck on the 2 ms question? On LEARN, reread the COMMON MISTAKES line on what the Ø button can and cannot fix, then come back.',
      'Unsure how to read CORRELATION? On LEARN, COMMON MISTAKES and FORMULA / CONCEPT explain what each end of its scale means.',
    ],
  },
};

/** The guide for a LabShell tab — LabShell's per-tab `guide` function. */
export function phaseScreenGuide(mode: string): ScreenGuide | undefined {
  return mode === 'explore' || mode === 'learn' || mode === 'check' ? PHASE_SCREEN_GUIDES[mode] : undefined;
}
