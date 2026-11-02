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
    seeing: [
      'Nine units in this rack’s fixed order: EQ, COMP, GATE, DIST, MOD, DELAY, REVERB, STEREO, LIMIT. One patch lane (the stereo pair) runs from SRC to OUT.',
      'Lit units show their setting; dark ones read bypassed. Playing, a lit COMP, GATE or LIMIT shows GR (gain reduction: dB turned down) and lights its LEDs.',
      'Readouts: SRC, CHAIN (units in), SCENE (scenario short name, e.g. SQUASH, or CUSTOM), OUT (LIVE or IDLE).',
    ],
    control: [
      '▶ in the header plays the chain; ■ stops it. All bypassed, you hear the source dry. SOURCE key: CLICK 90, PINK NOISE or SINE 220.',
      'MODULES key: tap a unit’s name to put it in the chain or bypass it — live, while it plays.',
      'SCENARIO key: EQ BOOST → COMP, DELAY → REVERB, GATE THE CLICK, HOT INTO LIMITER, FULL CHAIN. Each picks its own source; most light the patch they are about. ⟲ CLEAR CHAIN bypasses every unit.',
      'Long-press MODULES, SCENARIO, the display or CHAIN, SCENE or OUT for its lesson entry; long-press a SOURCE choice for that signal’s own note.',
      'Below the rack, LAB NOTES: the lesson, three quick questions, MARK AS REVIEWED and FINISH · SEE WHAT’S LEFT. ▴ HIDE DISPLAY gives them room.',
    ],
    changes: [
      'Each unit works on what the one before hands it, so one switch changes every later unit.',
      'COMP (−30 dB · 4:1): each 4 dB over −30 dB leaves 1 dB over. Boost before it: more GR.',
      'LIMIT turns down any peak over −25 dB (low to teach; real ones sit just under full scale). Alone, SINE 220 at −20 dB always gives it work; a COMP before it can leave it none.',
      'GATE (opens −35 dB) turns down what falls below that.',
    ],
    teaches: [
      'Order changes the result: each stage’s output is the next stage’s input. EQ before a compressor changes what it reacts to; the limiter goes last.',
      'This rack runs COMP before GATE; engineers usually gate first, so compression never lifts the noise the gate must ignore.',
      'It builds on reading meters (Visual Audio Analysis) and prepares for finding a problem stage (Signal Detective). Each unit has its own lab.',
    ],
    tryThis: [
      'From an empty chain (SCENARIO → ⟲ CLEAR CHAIN) pick SINE 220, tap ▶ and put in LIMIT alone: its GR holds between −4 and −5 dB — the −20 dB tone sits about 5 dB over the −25 dB ceiling.',
      'Now put DIST in too: LIMIT’s GR jumps to about −16 dB. DIST’s drive +12 dB hands the limiter a signal about 12 dB hotter — the unit before changes the unit after.',
      'Pick EQ BOOST → COMP, set SOURCE to SINE 220, play: COMP reads about −8 dB. Bypass EQ in MODULES: about −7 (about −6 on the phone speaker). The 150 Hz shelf lifts a 220 Hz tone under 2 dB.',
    ],
  },

  // ── LEARN — the reading page ──────────────────────────────────────────────
  learn: {
    seeing: [
      'The LEARN tab: the guided lesson for this lab, as one page to read. Nothing here plays.',
      'First, what the lab is. Then CONTROLS: one entry for the display, the module switches, chain order, gain staging and the GR meters.',
      'Then COMMON MISTAKES, PRO TIPS and FORMULA / CONCEPT — the chain written as one line, Source → … → Output.',
    ],
    control: [
      'Scroll to read. The tabs under the title switch between LEARN and EXPLORE; EXPLORE is the live rack.',
      'On EXPLORE, ⓘ GUIDED LESSON at the end of LAB NOTES opens this same lesson as a sheet over the rack.',
      'On EXPLORE, long-press MODULES, SCENARIO, the display or the CHAIN, SCENE or OUT readout to open just its entry as a sheet. A SOURCE choice opens that test signal’s own note.',
    ],
    changes: [
      'Nothing on this page moves — it is the reference for what EXPLORE shows.',
      'Each CONTROLS entry names a part of the EXPLORE screen and says what it does.',
      'Most COMMON MISTAKES lines are an ordering choice and its result — EQ before compression changes what the compressor reacts to. The rest are about levels between stages and how to compare.',
    ],
    teaches: [
      'The words for a processing chain: bypass, chain order, gain staging, gain reduction.',
      'Common ordering mistakes, and why each one happens.',
      'Why this rack’s fixed order is one order, not the only one.',
      'The reference behind EXPLORE; the same ideas carry into Signal Detective, the next Signal lab.',
    ],
    tryThis: [
      'Read the COMMON MISTAKES line on EQ→comp, then on EXPLORE run EQ BOOST → COMP with SOURCE on SINE 220 and bypass EQ in MODULES — COMP’s GR falls by over 1 dB.',
      'Read the line on Gain-staging into the limiter, then on EXPLORE run HOT INTO LIMITER with SOURCE on SINE 220: COMP reads about −8 dB, LIMIT 0.0 — the compressor got there first.',
    ],
  },
};

/** The guide for a LabShell tab — LabShell's per-tab `guide` function.
 *  No guide for any other tab (this lab has no CHECK tab). */
export function chainScreenGuide(mode: string): ScreenGuide | undefined {
  return mode === 'explore' || mode === 'learn' ? CHAIN_SCREEN_GUIDES[mode] : undefined;
}
