/**
 * Harmonograph Lab — "explain this screen" content (Screen Guide rollout,
 * 2026-10-31; standard = wave/waveScreenGuides.ts).
 *
 * The lab is ONE LabShell screen with three tabs, so the guides are keyed by
 * the shell's tab id:
 *   explore — the rack: the harmonograph machine, THE DRAWING inset, the
 *             RATIO / INTERVAL / PEN readouts, the OSC 1 / OSC 2 / PLAT
 *             faders, the TUNE and SHAPE trays, the header ▶, LAB NOTES;
 *   learn   — the reading page (the 'harmonograph' guided lesson in full);
 *   check   — CHECK YOUR UNDERSTANDING (four questions; passing completes
 *             the lab).
 * The share / print viewer (tap THE DRAWING) is a separate modal with its own
 * ✕ CLOSE and no ⓘ, so it has no guide; EXPLORE says what it is.
 *
 * Every name is the on-screen name in HarmonographLabScreen.tsx /
 * HarmonographMachine.tsx. Every number in TRY THIS is what the screen shows
 * at the opening defaults (OSC 1 1.5 Hz, OSC 2 1.0 Hz, PLAT 1.0 Hz, ROTARY,
 * φ 90°, MEDIUM, +1 %): a RATIO chip keeps OSC 1 and sets OSC 2 = OSC 1 × n₂/n₁
 * (2:1 → 0.75 Hz); PLAY on a stereo engine raises both swings by one factor
 * until the lower sits at 220 Hz (3:2 → 330 Hz LEFT, 220 Hz RIGHT). In ROTARY
 * the detune acts on the platform (and needs PLAT on); in LATERAL on OSC 2
 * (HarmonographMachine motion()). test/screenGuide_harmonograph_20261031.test.ts
 * pins the names and re-derives the numbers.
 *
 * STEPPED: each section must fit SCREEN_GUIDE_BUDGET (types.ts).
 * Copy rules: plain language, short sentences; KNOWLEDGE, never skills; no
 * gear brand names; no "N of total"; "suggest" never "recommend"; no build
 * notes in learner text.
 */
import type { ScreenGuide } from '../../features/lab/screenGuide/types';

/** The LabShell tabs this lab offers. */
export type HarmonographScreenId = 'explore' | 'learn' | 'check';

export const HARMONOGRAPH_SCREEN_GUIDES: Record<HarmonographScreenId, ScreenGuide> = {
  // ── EXPLORE — the machine ─────────────────────────────────────────────────
  explore: {
    seeing: [
      'A harmonograph machine: two pendulums move the pen (OSC 1 cyan, OSC 2 violet); in ROTARY the paper platform swings too (PLAT, the amber ring).',
      'THE DRAWING inset shows the figure drawn so far; tap it to share, save or print it.',
      'Readouts: RATIO (e.g. 3:2), INTERVAL (e.g. PERFECT 5TH, or CUSTOM RATIO) and PEN (DRAWING or FROZEN).',
    ],
    control: [
      'OSC 1 and OSC 2 faders: 0.5–10 Hz each, the real swing speed. PLAT fader (ROTARY only): far left is OFF, the platform still.',
      'TUNE: RATIO chips (1:1 UNISON to 5:4 MAJOR 3RD) keep OSC 1 and set OSC 2; DETUNE: LOCKED RATIO, +1% or +3%.',
      'SHAPE: PHASE φ 0° / 45° / 90°, DAMPING LIGHT / MEDIUM / HEAVY, ROTARY or LATERAL, then FREEZE, ⟲ NEW SHEET and ⟲ RESET ALL.',
      '▶ in the header (or a tap on the machine) plays OSC 1 and OSC 2 as two tones, both raised by the same factor into hearing (the lower at 220 Hz), so the ratio stays exact. The platform is silent, so DETUNE is heard in LATERAL only. It opens at OSC 1 1.5 Hz, OSC 2 1.0 Hz, PLAT 1.0 Hz, ROTARY, detuned +1%.',
    ],
    changes: [
      'The figure closes on an exact simple ratio: a RATIO chip, DETUNE on LOCKED RATIO and, in ROTARY, PLAT OFF or on a simple ratio.',
      'Detuned, or off an exact ratio, it slowly turns (precesses), never closing: the picture of beating. DETUNE acts on OSC 2 in LATERAL, on the platform in ROTARY (so PLAT must be on).',
      'More DAMPING spirals the figure in faster and ends the drawing sooner. PHASE changes the shape only.',
    ],
    teaches: [
      'Musical intervals are frequency ratios: 2:1 octave, 3:2 fifth, 4:3 fourth, 5:4 major third.',
      'Why simple ratios draw stable figures, and why a near-miss ratio slowly drifts — the picture of beating.',
      'The ratio sets the pattern; damping and phase only shape it. The lab sits beside the Cymatics Lab in Sound Visualization.',
    ],
    tryThis: [
      'Open TUNE and tap LOCKED RATIO: the 3:2 figure stops turning and closes.',
      'Tap 2:1 OCTAVE: OSC 1 stays at 1.5 Hz, OSC 2 moves to 0.75 Hz and INTERVAL reads OCTAVE.',
      'Back at 3:2, press ▶ to hear the fifth: THE INTERVAL, AS SOUND reads 330 Hz on LEFT, 220 Hz on RIGHT — use headphones.',
    ],
  },

  // ── LEARN — the reading page ──────────────────────────────────────────────
  learn: {
    seeing: [
      'The LEARN tab: the Harmonograph guided lesson as one page to read. Nothing here plays or draws.',
      'First what a harmonograph is, then CONTROLS: the display, ratio-lock, OSC 1 / OSC 2, amplitude, phase, damping, lateral / rotary and drive from oscillators.',
      'Then COMMON MISTAKES, PRO TIPS and FORMULA / CONCEPT — the pen’s equation.',
    ],
    control: [
      'Scroll to read. The tabs under the title switch between LEARN, EXPLORE and CHECK; EXPLORE is the live machine.',
      'On EXPLORE, ⓘ GUIDED LESSON at the end of LAB NOTES opens this lesson as a sheet; long-press a dock key or a readout for just its entry.',
    ],
    changes: [
      'Nothing on this page moves — it is the reference for what EXPLORE shows.',
      'Amplitude is an idea here, not a key: the machine on EXPLORE keeps its swing size fixed.',
    ],
    teaches: [
      'The words: ratio, interval, phase, damping, precession, beating.',
      'The common mix-ups — amplitude versus frequency, phase versus ratio — and why each happens.',
    ],
    tryThis: [
      'Read the PRO TIPS line on detuning, then on EXPLORE switch DETUNE from +1% to +3%: the figure turns faster.',
      'Read the COMMON MISTAKES line on damping extremes, then on EXPLORE compare LIGHT and HEAVY: LIGHT spirals in slowly over many turns; HEAVY dies away in far fewer.',
    ],
  },

  // ── CHECK — the understanding check ───────────────────────────────────────
  check: {
    seeing: [
      'CHECK YOUR UNDERSTANDING: four questions on the fifth’s ratio, locked figures, detune and damping.',
      'Each question turns to ✓ once you get it right.',
    ],
    control: [
      'Tap an answer. Wrong: NOT QUITE — TRY ANOTHER, with the explanation — read it, then pick again. Right: CORRECT, with the same explanation.',
    ],
    changes: [
      'Answer every question correctly and the lab is complete; it counts toward every certificate that needs it. A wrong answer costs nothing and there is no score.',
    ],
    teaches: [
      'Whether the core ideas stuck: ratios as intervals, closing figures, beating, damping.',
    ],
    tryThis: [
      'Unsure? Try it on EXPLORE first, then come back and answer.',
      'A wrong pick shows the explanation — read it before you try again.',
    ],
  },
};

/** The LabShell `guide`: each tab explained. */
export function harmonographScreenGuide(mode: HarmonographScreenId): ScreenGuide {
  return HARMONOGRAPH_SCREEN_GUIDES[mode];
}
