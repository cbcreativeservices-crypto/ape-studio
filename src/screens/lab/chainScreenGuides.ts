/**
 * Signal Chain Builder — "explain this screen" content (Screen Guide rollout,
 * 2026-10-31; standard = wave/waveScreenGuides.ts).
 *
 * The lab is ONE LabShell screen with two tabs (no CHECK tab — its three
 * understanding questions, CHAIN_CHECKS, sit in LAB NOTES on EXPLORE), so the
 * guides are keyed by the shell's tab id:
 *   explore — the rack: the nine-unit chain display, the bezel readouts, the
 *             MODULES / SCENARIO / SOURCE dock keys, the header ▶, LAB NOTES;
 *   learn   — the reading page (the guided lesson in full).
 * The what's-left page ("Where you are") is a separate modal with its own
 * header and no ⓘ, so it has no guide here.
 *
 * Every name is the on-screen name in SignalChainLabScreen.tsx / chainRack.tsx
 * (bezel keys, dock labels, scenario + source labels, the unit captions).
 * Every number in TRY THIS was worked out from the engine
 * (modules/ape-dsp/ios/core/Effects.hpp + Generator.hpp + Biquad.hpp) at the
 * lab's own defaults, and the test re-runs it sample by sample: the source
 * plays at −20 dB peak (GEN_LEVEL_DB), LIMIT's ceiling is −25 dB, DIST is a
 * soft (tanh) clipper at drive +12 dB, COMP is −30 dB 4:1 with a 5 ms attack,
 * EQ is a +9 dB low shelf at 150 Hz. The phone speaker adds a 150 Hz
 * high-pass BEFORE the chain (Generator.hpp), so every TRY THIS uses SINE 220,
 * which reads nearly the same on both routes (headphones / speaker GR, dB):
 *   LIMIT alone        4.9 / 4.1                     → "between −4 and −5"
 *   DIST + LIMIT      16.5 / 15.7                    → "about −16"
 *   EQ + COMP          8.3 / 7.7 → COMP alone 7.0 / 6.3 → "about −8 … −7 (−6)"
 *   EQ + COMP + LIMIT: LIMIT 0.0 (COMP already took the tone under −25 dB).
 * PINK NOISE (the EQ BOOST → COMP / HOT INTO LIMITER default) reads ~0 GR on
 * the speaker — the high-pass removes the boosted bass — so no step uses it.
 * Change a label, a default or the source level → update this file;
 * test/screenGuide_chain_20261031.test.ts pins the names and the numbers.
 *
 * STEPPED: each section must fit SCREEN_GUIDE_BUDGET (types.ts).
 * Copy rules: plain language, short sentences; KNOWLEDGE, never skills; no
 * gear brand names; no "N of total"; "suggest" never "recommend"; no build
 * notes in learner text.
 */
import type { ScreenGuide } from '../../features/lab/screenGuide/types';

/** The LabShell tabs this lab offers (LabMode minus 'check'). */
export type ChainScreenId = 'explore' | 'learn';

export const CHAIN_SCREEN_GUIDES: Record<ChainScreenId, ScreenGuide> = {
  // ── EXPLORE — the rack ────────────────────────────────────────────────────
  explore: {
    intro: {
      learning: 'Why order matters in a signal chain: each unit works on what the one before hands it, so one switch changes what every later unit does.',
      start: 'Tap SCENARIO → ⟲ CLEAR CHAIN, set SOURCE to SINE 220 and tap ▶. Put LIMIT in through MODULES and read its GR. Then add DIST and watch that GR jump.',
    },
    seeing: [
      'Nine units in a fixed order: EQ, COMP, GATE, DIST, MOD, DELAY, REVERB, STEREO, LIMIT. One patch lane (the stereo pair) runs from SRC to OUT.',
      'Lit units are in and show their setting; dark ones are bypassed. In play, a lit COMP, GATE or LIMIT shows GR (dB turned down) and lights its LEDs.',
      'Readouts: SRC, CHAIN (units in), SCENE (short name, e.g. SQUASH for HOT INTO LIMITER; else CUSTOM), OUT (LIVE or IDLE).',
    ],
    control: [
      'Tap ▶ in the header to play the chain, ■ to stop. With every unit bypassed you hear the source dry. SOURCE picks CLICK 90, PINK NOISE or SINE 220.',
      'Tap a unit’s name under MODULES to put it in the chain or bypass it, live while it plays.',
      'SCENARIO: EQ BOOST → COMP, DELAY → REVERB, GATE THE CLICK, HOT INTO LIMITER, FULL CHAIN. Each picks its own source and most light their units. ⟲ CLEAR CHAIN bypasses every unit.',
      'Long-press MODULES, SCENARIO, the display, CHAIN, SCENE or OUT to read about it; long-press a SOURCE choice for that signal’s own note.',
      'LAB NOTES below the rack hold the lesson, three quick questions, MARK AS REVIEWED and FINISH · SEE WHAT’S LEFT; ▴ HIDE DISPLAY makes room.',
    ],
    changes: [
      'Each unit works on what the one before hands it, so one switch changes all later units.',
      'COMP (−30 dB · 4:1): each 4 dB over threshold leaves 1 dB over, so a boost before it means more GR.',
      'LIMIT turns down any peak over −25 dB (low to teach; real ones sit just under full scale). Alone, the −20 dB SINE 220 gives it work; a COMP before it can leave it none.',
      'GATE (opens −35 dB) turns down what falls below that.',
    ],
    teaches: [
      'Order changes the result: each stage’s output is the next stage’s input. EQ before a compressor changes what it reacts to, and the limiter goes last.',
      'This rack runs COMP before GATE. Engineers usually gate first, so compression never lifts the noise the gate has to ignore.',
      'A compressor’s or limiter’s GR shows what it is reacting to: a hotter signal from the stage before means more gain reduction.',
    ],
    tryThis: [
      'Tap ⟲ CLEAR CHAIN in SCENARIO, pick SINE 220, tap ▶ and put in LIMIT alone. Its GR holds between −4 and −5 dB: the −20 dB tone sits about 5 dB over the −25 dB ceiling.',
      'Now put DIST in too. LIMIT’s GR jumps to about −16 dB: DIST’s drive +12 dB hands the limiter a signal about 12 dB hotter. The unit before changes the unit after.',
      'Pick EQ BOOST → COMP, set SOURCE to SINE 220 and play: COMP reads about −8 dB. Bypass EQ: about −7 (−6 on the phone speaker; the app cuts its lows). The 150 Hz shelf lifts a 220 Hz tone under 2 dB.',
    ],
  },

  // ── LEARN — the reading page ──────────────────────────────────────────────
  learn: {
    intro: {
      learning: 'The words and ideas behind a processing chain: bypass, chain order, gain staging and gain reduction, and the ordering mistakes engineers most often make.',
      start: 'Scroll from the top and read CONTROLS, then COMMON MISTAKES. Then switch to EXPLORE and try one ordering mistake on the live rack.',
    },
    seeing: [
      'This is the lab’s guided lesson as one page to read. Nothing plays here.',
      'It opens with what the lab is, then CONTROLS: one entry each for the display, MODULES (the module switches), chain order, gain staging and the GR meters.',
      'Then COMMON MISTAKES, PRO TIPS and FORMULA / CONCEPT, which writes the whole chain as one line, from SRC to OUT.',
    ],
    control: [
      'Scroll to read. Use the tabs under the title to switch to EXPLORE, the live rack.',
      'On EXPLORE, ⓘ GUIDED LESSON at the end of LAB NOTES opens this same lesson as a sheet over the rack.',
      'On EXPLORE, long-press MODULES, SCENARIO, the display or the CHAIN, SCENE or OUT readout to open just its entry. Long-press a SOURCE choice for that test signal’s own note.',
    ],
    changes: [
      'Nothing on this page moves or plays. It explains what the rack on EXPLORE does to the sound.',
      'Each CONTROLS entry names a part of the rack and says what it does to the signal.',
      'Most COMMON MISTAKES pair an ordering choice with its result: EQ before compression changes what the compressor reacts to. The rest are about levels between stages and fair comparisons.',
    ],
    teaches: [
      'A processing chain has its own words: bypass, chain order, gain staging and gain reduction.',
      'The common ordering mistakes, and how each one changes the sound.',
      'Why this rack’s fixed order is one workable order, not the only one.',
      'Why levels between stages matter: a stage running hot makes the compressor and limiter after it work harder.',
    ],
    tryThis: [
      'Read the COMMON MISTAKES line about EQ before the compressor. Then on EXPLORE run EQ BOOST → COMP with SOURCE on SINE 220 and bypass EQ in MODULES: COMP’s GR falls by over 1 dB.',
      'Read the line about running stages hot into the limiter. Then on EXPLORE run HOT INTO LIMITER with SOURCE on SINE 220: COMP reads about −8 dB, LIMIT 0.0. The compressor got there first.',
    ],
  },
};

/** The guide for a LabShell tab — LabShell's per-tab `guide` function.
 *  No guide for any other tab (this lab has no CHECK tab). */
export function chainScreenGuide(mode: string): ScreenGuide | undefined {
  return mode === 'explore' || mode === 'learn' ? CHAIN_SCREEN_GUIDES[mode] : undefined;
}
