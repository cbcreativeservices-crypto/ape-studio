/**
 * Distortion Lab — "explain this screen" content (Screen Guide rollout,
 * 2026-10-31; standard = wave/waveScreenGuides.ts, LabShell pattern =
 * chainScreenGuides.ts).
 *
 * The lab is ONE FxLabScreen (fxLabConfigs.tsx `distConfig`) on LabShell's
 * Rack Unit, with three tabs, so the guides are keyed by the shell's tab id:
 *   explore — the rack: the animated flow display (IN ▸ · DRIVE · ▸ OUT), the
 *             TYPE / DRIVE / MIX readouts, the DRIVE fader and the TYPE / OS /
 *             MIX / SOURCE keys, the header ▶, LAB NOTES (DESIGNED RESPONSE,
 *             THE AUDIO PATH, two CHECK YOURSELF cards, GUIDED LESSON);
 *   learn   — the reading page (the guided lesson, content.ts `distortion`);
 *   check   — CHECK YOUR UNDERSTANDING (understandingChecks.ts DISTORTION).
 *
 * Every name is the on-screen name in fxLabConfigs.tsx / FxLabScreen.tsx /
 * fxAnim.tsx (DistFlow) / LabShell.tsx / rack/*. Every number is what the
 * screen draws, worked from the same math (fxViz distShape, the −20 dBFS
 * SOURCE_PEAK_DB, peak = −20 + DRIVE):
 *   HARD CLIP, DRIVE +12 dB → peak −8 dBFS, under the ceiling: the caption
 *     says "lifts the −20 dBFS sine to −8 dBFS" — no clipping;
 *   HARD CLIP, DRIVE +36 dB → the driven peak is 6.31× full scale, so the
 *     wave sits on the ceiling wherever |sin| > 0.158: ≈ 90 % of each cycle;
 *   TUBE (ASYM), DRIVE +24 dB → after the DC block the top peaks at +0.78
 *     and the bottom at −1.01 of full scale: the top flattens lower and the
 *     bottom edges just past the 0 dBFS line (the DC block re-centres the
 *     lopsided wave; worst ≈ −1.08 at +30 dB). HARD and SOFT never pass ±1.0,
 *     so the guide calls the lines the place HARD and SOFT stop, not a
 *     ceiling for every TYPE (verified review 2026-10-31);
 *   HARD CLIP, DRIVE +24 dB, MIX 50% PARALLEL → 0.5 × 1.0 + 0.5 × 0.1 = 0.55
 *     of full scale: about half the height of the 0 dBFS lines.
 *     The dry is the UN-driven −20 dBFS input (Effects.hpp inL·(1−mix)), so the
 *     level drops 5.3 dB but THD only falls 17.1 % → 15.7 %: nearly as gritty,
 *     no clean tone to hear (review 2026-10-31). The OUT wave is coloured by
 *     level (FlowGlow gradH), not amber — amber is the LAB NOTES waveshape.
 * OVERSAMPLING changes only the audio (neither the flow nor the static graph
 * takes it), so no TRY THIS asks the learner to SEE it; the caption under the
 * rack (fxLabConfigs distOsCaption) says which source reveals it. With the
 * 220 Hz sine only HARD CLIP aliases at all (tanh harmonics die out long before
 * Nyquist), and its folded partials sit ≈ −71 dBFS in total at +24 dB,
 * ≈ −57 dBFS at +36 dB, under a ≈ −1 dBFS fundamental (verified 2026-10-31;
 * hence the OS label OFF (ALIASING), not "HEAR ALIASING"). SINE 5 kHz (audit
 * decision 4, 2026-11-05) reveals it: HARD CLIP's folded tones total −29 dBFS
 * OFF against −46 ON at +24 dB, −14 against −36 at +36 dB, about 20 dB apart
 * (test/dec_A03 re-runs the engine's path). Computed, not heard.
 * test/screenGuide_distortion_20261031.test.ts pins the names and re-runs
 * every number. Change a label, a default or the source level → update this
 * file.
 *
 * STEPPED: each section must fit SCREEN_GUIDE_BUDGET (types.ts).
 * Copy rules: plain language, short sentences; KNOWLEDGE, never skills; no
 * gear brand names; no "N of total"; "suggest" never "recommend"; no build
 * notes in learner text.
 */
import type { ScreenGuide } from '../../features/lab/screenGuide/types';

/** The LabShell tabs this lab offers (it has a CHECK tab). */
export type DistortionScreenId = 'explore' | 'learn' | 'check';

/**
 * ACCURACY CHIP (owner rule 2026-10-31): a CONCEPT lab. Both displays are
 * drawn from the model ("TEACHING MODEL … NOT A MEASUREMENT", "WAVESHAPE —
 * TRUE LEVEL" from the same formulas as the audio) and nothing on the screen
 * is measured from a microphone or the live audio — so the AccuracyNote chip
 * goes and the ⓘ takes its spot. Pass this as LabShell's `accuracy`.
 */
export const DISTORTION_ACCURACY_CHIP = false;

export const DISTORTION_SCREEN_GUIDES: Record<DistortionScreenId, ScreenGuide> = {
  // ── EXPLORE — the rack ────────────────────────────────────────────────────
  explore: {
    intro: {
      learning: 'How distortion adds new frequencies: bending a sine’s shape creates harmonics. A symmetric bend gives odd harmonics; a lopsided bend adds even ones too.',
      start: 'Tap ▶ with SINE 220 Hz on HARD CLIP. Drag DRIVE from +12 dB to +36 dB and watch the wave flatten at the red lines. Then set TYPE to TUBE (ASYM).',
    },
    seeing: [
      'A sine enters at IN ▸ (IN = −20 dBFS sine), passes the green DRIVE stage and leaves at ▸ OUT as the bright wave you hear.',
      'Color shows level: blue near the middle, red at the 0 dBFS lines. On PINK NOISE a sine is drawn instead, labeled NOISE · SINE DRAWN.',
      'Dashed red lines: 0 dBFS, which HARD and SOFT never pass. Faint dashed wave: DRIVEN (before clip), unclipped.',
      'TYPE, DRIVE and MIX show your settings.',
    ],
    control: [
      'Tap ▶ in the header, or the display, to play; ■ stops. It plays at −20 dBFS, a digital level; DRIVE raises it.',
      'Drag the DRIVE fader (+6 to +36 dB) to set how hard the sine is pushed into the DRIVE stage.',
      'TYPE picks HARD CLIP, SOFT (TANH) or TUBE (ASYM). OS (oversampling) picks ON (CLEAN) or OFF (ALIASING): heard on SINE 5 kHz, not drawn. MIX picks 100% or 50% PARALLEL.',
      'SOURCE picks SINE 220 Hz, 5 kHz or PINK NOISE. Long-press a key or readout for its lesson entry; the ⓘ after the readouts explains this display. DESIGNED RESPONSE in LAB NOTES draws one still, captioned cycle.',
      'LAB NOTES also holds two CHECK YOURSELF questions; ▴ HIDE DISPLAY gives them room. ⤢ FULL SCREEN enlarges the display.',
    ],
    changes: [
      'On HARD CLIP, DRIVE +12 dB lifts the sine to −8 dBFS, still round; past +20 dB it is cut flat at 0 dBFS. SOFT and TUBE bend gently long before.',
      'HARD and SOFT bend both halves alike: odd harmonics (660, 1100 Hz… from 220 Hz). TUBE bends them unevenly, adding even ones (440, 880 Hz…).',
      'At MIX 50%, +24 dB, the clean wave is 20 dB under the driven one, so grit stays; in practice you turn the driven copy down.',
    ],
    teaches: [
      'Distortion creates new frequencies; turning up or EQ can’t. The wave’s shape decides which ones.',
      'Symmetric clipping gives odd harmonics (hollow, harsh); asymmetric clipping adds even ones too, often heard as warm.',
      'Harmonics past half the sample rate fold back off-key: aliasing. Oversampling keeps most of them out.',
      'More drive is also more level, so compare settings at matched loudness.',
    ],
    tryThis: [
      'TYPE on HARD CLIP, DRIVE at +12 dB: the caption in LAB NOTES reads −8 dBFS, a round wave, just gain. Now +36 dB: the wave sits flat on the ceiling for most of each cycle.',
      'Set TYPE to TUBE (ASYM) at DRIVE +24 dB: the top flattens lower than the bottom, which edges just past 0 dBFS. Uneven bending brings even harmonics. Play SINE 220 Hz and compare with HARD CLIP.',
      'HARD CLIP at +24 dB, then MIX to 50% PARALLEL: the OUT wave drops to about half the height of the 0 dBFS lines and its red tops cool toward green. About 5 dB quieter, yet nearly as gritty.',
    ],
  },

  // ── LEARN — the reading page ──────────────────────────────────────────────
  learn: {
    intro: {
      learning: 'The ideas behind EXPLORE, in words: how a bent sine becomes a harmonic series, odd versus even harmonics, where aliasing lands and what THD measures.',
      start: 'Read what distortion is first. Then read the COMMON MISTAKES line on odd and even harmonics, and on EXPLORE switch TYPE between HARD CLIP and TUBE (ASYM).',
    },
    seeing: [
      'The LEARN tab: this lab’s lesson as one page. Nothing on it moves; the header ▶ still plays or stops the sound.',
      'First, what distortion is. Then CONTROLS: What the display shows, TYPE (clip shape), DRIVE (+6 … +36 dB), OS (oversampling), MIX.',
      'Then COMMON MISTAKES, PRO TIPS and FORMULA / CONCEPT: how a bent sine becomes a harmonic series, where aliasing lands, what THD (total harmonic distortion) measures.',
    ],
    control: [
      'Scroll to read. The tabs under the title switch to EXPLORE, where you hear each shape, and CHECK, where you answer the questions.',
      'On EXPLORE, ⓘ GUIDED LESSON at the end of LAB NOTES opens this same lesson as a sheet over the rack.',
      'On EXPLORE, long-press a dock key or a readout to open just its entry; long-press a SOURCE choice for that test signal’s own note.',
    ],
    changes: [
      'The page is your reference for EXPLORE.',
      'The CONTROLS entries match the dock keys: TYPE, DRIVE, OS, MIX. The display entry explains the moving display on EXPLORE.',
      'Each COMMON MISTAKES line names a mistake and its cause: drive raises level too, so match levels before judging.',
      'Bitcrush (fewer bits) and sample-rate reduction are explained here; EXPLORE doesn’t draw them.',
    ],
    teaches: [
      'What harmonics, odd and even, clipping, saturation, aliasing, oversampling, parallel distortion and DC offset mean.',
      'Why an uneven bend leaves a DC offset (the wave shifted off center), and why a high-pass after the DRIVE stage (the shaper) removes it.',
      'Why a bent sine becomes a harmonic series: whole-number multiples of the note you put in.',
    ],
    tryThis: [
      'Read the COMMON MISTAKES line on odd and even harmonics. Then on EXPLORE, switch TYPE between HARD CLIP and TUBE (ASYM) at DRIVE +24 dB and compare the two shapes.',
      'Read the COMMON MISTAKES line on drive and loudness. Then on EXPLORE, play SINE 220 Hz on HARD CLIP at DRIVE +12 dB (clean, −8 dBFS), then +24 dB: louder AND gritty, two changes at once.',
    ],
  },

  // ── CHECK — CHECK YOUR UNDERSTANDING ──────────────────────────────────────
  check: {
    intro: {
      learning: 'Review: what distortion adds to a sine, which harmonics a symmetric clip makes, what gets in with oversampling OFF, and what parallel distortion is for.',
      start: 'Tap the answer you think is right on the first card. Unsure about a question? Reread its entry on LEARN, or try that control on EXPLORE, then come back.',
    },
    seeing: [
      'CHECK YOUR UNDERSTANDING for the Distortion lab: four questions on harmonics, clipping, oversampling and MIX, each with its answer choices.',
      'Each question has a numbered card. A ✓ replaces the number once you answer it right.',
      'When every answer is right, a note tells you the check is passed.',
    ],
    control: [
      'Tap an answer. If it’s right, you see CORRECT and a short explanation, and the card locks. If not, you see NOT QUITE — TRY ANOTHER with the same explanation as a nudge; tap another answer.',
      'There is no score and no limit on tries.',
      'Use the tabs under the title to look something up on LEARN or EXPLORE, such as a clip shape; answers already right stay right. If you leave the lab before every answer is right, the check starts over.',
    ],
    changes: [
      'Each right answer stays right while you are in this lab.',
      'Get all four right and the check is passed.',
      'Each explanation ties back to something on EXPLORE you can see or hear: a clip shape, the OS setting or the 50% PARALLEL wave.',
    ],
    teaches: [
      'What distortion adds to a sine, which harmonics a symmetric clip makes, what oversampling guards against, and what parallel distortion (50% MIX) is for.',
      'Together they explain what happens to a sound when you push it into distortion.',
    ],
    tryThis: [
      'Stuck on the harmonics questions? On LEARN, reread the COMMON MISTAKES line on how the top and bottom of the wave bend, then come back.',
      'Unsure about MIX? Read the MIX entry on LEARN, then on EXPLORE step MIX between 100% and 50% PARALLEL and listen.',
    ],
  },
};

/** The guide for a LabShell tab — LabShell's per-tab `guide` function. */
export function distortionScreenGuide(mode: string): ScreenGuide | undefined {
  return mode === 'explore' || mode === 'learn' || mode === 'check' ? DISTORTION_SCREEN_GUIDES[mode] : undefined;
}
