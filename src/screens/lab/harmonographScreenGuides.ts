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
    intro: {
      // The plain picture first (owner 2026-11-15: "build waves 1 thru 3", D62 HG-04).
      learning: 'This old machine draws music. Two swinging arms move the pen. When their speeds make a musical interval, the drawing closes into a neat shape.',
      start: 'Tap TUNE, then 2:1 OCTAVE, and watch. Tap LOCKED RATIO too and the drawing closes. Press ▶ to hear the interval.',
    },
    seeing: [
      'This is a harmonograph: two pendulums move the pen (OSC 1 cyan, OSC 2 violet). In ROTARY the paper platform swings too (PLAT, the amber ring).',
      'It opens at OSC 1 1.5 Hz, OSC 2 1.0 Hz, PLAT 1.0 Hz, ROTARY, detuned +1%.',
      'THE DRAWING inset shows the figure so far; tap it to share, save or print it.',
      'Readouts: RATIO (e.g. 3:2), INTERVAL (e.g. PERFECT 5TH, or CUSTOM RATIO) and PEN (DRAWING or FROZEN).',
    ],
    control: [
      'Slide OSC 1 and OSC 2 to set each pendulum’s real swing speed, 0.5–10 Hz. The PLAT fader works in ROTARY only; far left is OFF, the platform still.',
      'In TUNE, a RATIO chip (1:1 UNISON to 5:4 MAJOR 3RD) keeps OSC 1 and sets OSC 2 to match. DETUNE offers LOCKED RATIO, +1% or +3%.',
      'In SHAPE: PHASE φ 0° / 45° / 90°, DAMPING LIGHT / MEDIUM / HEAVY, ROTARY or LATERAL, then FREEZE, ⟲ NEW SHEET and ⟲ RESET ALL.',
      'Tap ▶ in the header, or the machine, to hear OSC 1 and OSC 2 as two tones, raised by the same factor until the lower is 220 Hz, so the ratio stays exact. The platform is silent, so you hear DETUNE in LATERAL only.',
    ],
    changes: [
      'The figure closes only on an exact simple ratio: a RATIO chip, DETUNE on LOCKED RATIO and, in ROTARY, PLAT OFF or on a simple ratio too.',
      'Detuned or off an exact ratio, it slowly turns (precesses), never closing: beating, drawn. DETUNE moves OSC 2 in LATERAL, the platform in ROTARY (so PLAT must be on).',
      'More DAMPING spirals the figure in faster and ends the drawing sooner. PHASE changes the shape only.',
    ],
    teaches: [
      'Musical intervals are frequency ratios: 2:1 octave, 3:2 fifth, 4:3 fourth, 5:4 major third.',
      'Why simple ratios draw stable figures, and why a near-miss ratio slowly drifts: the picture of beating.',
      'The ratio sets the pattern. Damping and phase only change its shape and how long it lasts.',
    ],
    tryThis: [
      'Open TUNE and tap LOCKED RATIO. The 3:2 figure stops turning and closes.',
      'Tap 2:1 OCTAVE. OSC 1 stays at 1.5 Hz, OSC 2 moves to 0.75 Hz and INTERVAL reads OCTAVE.',
      'Back at 3:2, put on headphones and press ▶ to hear the fifth. THE INTERVAL, AS SOUND reads 330 Hz on LEFT and 220 Hz on RIGHT.',
    ],
  },

  // ── LEARN — the reading page ──────────────────────────────────────────────
  learn: {
    intro: {
      learning: 'The ideas behind the drawings in words: ratio, interval, phase, damping, precession and beating, and the mix-ups people make between them.',
      start: 'Scroll from the top and open CONTROLS and COMMON MISTAKES. Then switch to EXPLORE and change DETUNE or DAMPING to see what you just read.',
    },
    seeing: [
      'This is the Harmonograph guided lesson as one page to read. Nothing plays or draws here.',
      'It opens with what a harmonograph is, then CONTROLS: the display, TUNE, OSC 1 / OSC 2, Amplitude, PHASE, DAMPING, ROTARY / LATERAL and ▶ (play).',
      'Then COMMON MISTAKES, PRO TIPS and FORMULA / CONCEPT, which gives the equation for the pen’s path.',
    ],
    control: [
      'Scroll to read. Use the tabs under the title to switch to EXPLORE, the live machine, or to CHECK.',
      'On EXPLORE, ⓘ GUIDED LESSON at the end of LAB NOTES opens this lesson as a sheet. Long-press a dock key or a readout for just its entry.',
    ],
    changes: [
      'Nothing on this page moves. It explains what the pen does on EXPLORE, and why.',
      'Amplitude is an idea here, not a key: the machine on EXPLORE keeps its swing size fixed.',
    ],
    teaches: [
      'These drawings have their own words: ratio, interval, phase, damping, precession and beating.',
      'The common mix-ups, amplitude versus frequency and phase versus ratio, and why each one happens.',
    ],
    tryThis: [
      'Open PRO TIPS and read the line on detuning. Then on EXPLORE switch DETUNE from +1% to +3%: the figure turns faster.',
      'Open COMMON MISTAKES and read the line on damping extremes. Then on EXPLORE compare LIGHT and HEAVY: LIGHT spirals in slowly over many turns; HEAVY dies away in far fewer.',
    ],
  },

  // ── CHECK — the understanding check ───────────────────────────────────────
  check: {
    intro: {
      learning: 'A review of the lab’s four ideas: the ratio behind a fifth, what a locked ratio does to the figure, what detuning does, and what damping does.',
      start: 'Read each question and tap the answer you think is right. Unsure? Switch to LEARN, open CONTROLS and reread that idea, then come back.',
    },
    seeing: [
      'CHECK YOUR UNDERSTANDING: four questions on the fifth’s ratio, locked figures, detune and damping.',
      'Each question turns to ✓ once you get it right.',
    ],
    control: [
      'Tap an answer. Right: it turns green and CORRECT explains why. Wrong: NOT QUITE — TRY ANOTHER says what to look at again; a second wrong pick also shows the explanation.',
    ],
    changes: [
      'Get all four right and the check is passed.',
    ],
    teaches: [
      'How a frequency ratio, a locked or detuned ratio, and damping each show up in a harmonograph figure.',
    ],
    tryThis: [
      'Unsure? Switch to LEARN, open CONTROLS and reread the entry on the idea the question is about. Then come back and answer.',
      'A wrong pick says what to look at again. Look at the figure on EXPLORE before you try again.',
    ],
  },
};

/** The LabShell `guide`: each tab explained. */
export function harmonographScreenGuide(mode: HarmonographScreenId): ScreenGuide {
  return HARMONOGRAPH_SCREEN_GUIDES[mode];
}
