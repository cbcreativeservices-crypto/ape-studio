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
 * takes it), so no TRY THIS asks the learner to SEE it. Nor to HEAR it: with
 * the 220 Hz sine only HARD CLIP aliases at all (tanh harmonics die out long
 * before Nyquist), and its folded partials sit ≈ −71 dBFS in total at +24 dB,
 * ≈ −57 dBFS at +36 dB, under a ≈ −1 dBFS fundamental (verified 2026-10-31;
 * hence the OS label OFF (ALIASING), not "HEAR ALIASING").
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
    seeing: [
      'A sine enters at IN ▸ (“IN = −20 dBFS sine”), passes the green DRIVE stage, leaves at ▸ OUT as the bright wave; colour shows level, blue near the middle, red at the 0 dBFS lines. With PINK NOISE: “NOISE · SINE DRAWN”.',
      'Dashed red lines: 0 dBFS, where HARD and SOFT stop. Faint dashed wave: DRIVEN (before clip).',
      'Readouts: TYPE, DRIVE, MIX. LAB NOTES: DESIGNED RESPONSE, one captioned still cycle.',
    ],
    control: [
      '▶ in the header, or a tap on the display, plays the source through the effect; ■ stops it. The source plays at −20 dBFS, uncalibrated; DRIVE raises it.',
      'DRIVE fader (+6 to +36 dB): how hard the sine is pushed into the green DRIVE stage, which bends the wave.',
      'TYPE key: HARD CLIP, SOFT (TANH) or TUBE (ASYM). OS key: ON (CLEAN) or OFF (ALIASING). MIX key: 100% or 50% PARALLEL.',
      'SOURCE key: SINE 220 Hz or PINK NOISE. Long-press a key or readout for its lesson entry; the ⓘ at the end of the readouts opens the lesson’s display entry: this moving display, then the drawing in LAB NOTES.',
      'LAB NOTES holds two CHECK YOURSELF questions. ▴ HIDE DISPLAY gives them room; ⤢ FULL SCREEN enlarges the display.',
    ],
    changes: [
      'On HARD CLIP, DRIVE +12 dB lifts the sine to −8 dBFS, still round; past +20 dB it is cut flat at 0 dBFS. SOFT and TUBE bend gently long before that.',
      'Same bend top and bottom (HARD, SOFT): odd harmonics — 660, 1100 Hz… from 220 Hz. TUBE is uneven, adding even ones (440, 880 Hz…).',
      'MIX 50% blends the clean wave back in, but at +24 dB it sits 20 dB under the driven one: grit stays. OS changes the sound only.',
    ],
    teaches: [
      'Distortion creates new frequencies; turning up or EQ cannot. The wave’s shape decides which ones.',
      'Symmetric clipping → odd harmonics (hollow, harsh); asymmetric → even ones too, often heard as warm.',
      'Harmonics past half the sample rate fold back off-key (aliasing, from Digital Audio Systems).',
      'In the Advanced Training Labs it follows Modulation, before Phase.',
    ],
    tryThis: [
      'TYPE on HARD CLIP, DRIVE at +12 dB: the caption in LAB NOTES reads −8 dBFS — a round wave, just gain. Now +36 dB: the wave sits flat on the ceiling for most of each cycle.',
      'TYPE to TUBE (ASYM) at DRIVE +24 dB: the top flattens lower than the bottom, which edges just past 0 dBFS — uneven bending, so even harmonics join in. Play SINE 220 Hz and compare with HARD CLIP.',
      'HARD CLIP at +24 dB, then MIX to 50% PARALLEL: the OUT wave drops to about half the height of the 0 dBFS lines and its red tops cool toward green. About 5 dB quieter, yet nearly as gritty.',
    ],
  },

  // ── LEARN — the reading page ──────────────────────────────────────────────
  learn: {
    seeing: [
      'The LEARN tab: the guided lesson for this lab, as one page to read. Nothing here plays.',
      'First, what distortion is. Then CONTROLS: What the display shows, Type (clip shape), Drive (+6 … +36 dB), Oversampling, Mix.',
      'Then COMMON MISTAKES, PRO TIPS and FORMULA / CONCEPT: how a bent sine becomes a harmonic series, where aliasing lands, what THD measures.',
    ],
    control: [
      'Scroll to read. The tabs under the title switch to EXPLORE (the live display) and CHECK (the questions).',
      'On EXPLORE, ⓘ GUIDED LESSON at the end of LAB NOTES opens this same lesson as a sheet over the rack.',
      'On EXPLORE, long-press a dock key or a readout to open just its entry; long-press a SOURCE choice for that test signal’s own note.',
    ],
    changes: [
      'Nothing here moves — it is the reference for EXPLORE.',
      'The CONTROLS entries match the dock keys: TYPE, DRIVE, OS, MIX. The display entry covers the moving display, then the still drawing in LAB NOTES.',
      'Each COMMON MISTAKES line gives a mistake and its cause — drive raises level, so match levels before judging.',
      'Bitcrush and sample-rate reduction are explained here; EXPLORE does not draw them.',
    ],
    teaches: [
      'The words: harmonics, odd and even, clipping, saturation, aliasing, oversampling, parallel distortion, DC offset.',
      'That an uneven bend leaves a DC offset, and that a high-pass after the shaper removes it.',
      'The ideas the CHECK tab asks about.',
    ],
    tryThis: [
      'Read the COMMON MISTAKES line on odd vs even, then on EXPLORE switch TYPE between HARD CLIP and TUBE (ASYM) at DRIVE +24 dB and compare the two shapes.',
      'Read the line on loudness, then on EXPLORE play SINE 220 Hz on HARD CLIP at DRIVE +12 dB (clean, −8 dBFS), then +24 dB: louder AND gritty — two changes at once.',
    ],
  },

  // ── CHECK — CHECK YOUR UNDERSTANDING ──────────────────────────────────────
  check: {
    seeing: [
      'CHECK YOUR UNDERSTANDING for the Distortion lab: four questions, each with its answer choices.',
      'One numbered card per question; a ✓ replaces the number once it is answered right.',
      'When every answer is right, a note says the lab is complete.',
    ],
    control: [
      'Tap an answer. Right: CORRECT and a short explanation, and the card locks. Wrong: NOT QUITE — TRY ANOTHER with the same explanation as a nudge; tap another answer.',
      'There is no score and no limit on tries.',
      'The tabs under the title go to LEARN or EXPLORE to look something up. Leaving this tab starts the questions fresh until the check is passed.',
    ],
    changes: [
      'Each right answer stays right while you are on this tab.',
      'Every answer right: the lab is marked complete, and it counts toward each certificate and program that needs it.',
      'Each explanation ties back to something on EXPLORE you can see or hear.',
    ],
    teaches: [
      'What distortion adds (harmonics), why symmetric clipping makes odd harmonics, what oversampling OFF lets in (aliasing), and what parallel distortion (50% MIX) is for.',
      'Passing it completes the Distortion lab.',
    ],
    tryThis: [
      'Stuck on odd vs even? On EXPLORE, compare HARD CLIP with TUBE (ASYM) at DRIVE +24 dB, then come back.',
      'Unsure about MIX? Re-read Mix in LEARN: 50% PARALLEL blends a distorted copy with the clean one.',
    ],
  },
};

/** The guide for a LabShell tab — LabShell's per-tab `guide` function. */
export function distortionScreenGuide(mode: string): ScreenGuide | undefined {
  return mode === 'explore' || mode === 'learn' || mode === 'check' ? DISTORTION_SCREEN_GUIDES[mode] : undefined;
}
