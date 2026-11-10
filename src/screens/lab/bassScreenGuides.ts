/**
 * Bass Guitar Physics — "explain this screen" content (Screen Guide rollout,
 * 2026-10-31; standard = wave/waveScreenGuides.ts).
 *
 * The lab is ONE LabShell screen (BassLabScreen.tsx) with three tabs —
 * LEARN, EXPLORE and CHECK (its understanding check, BASS in
 * understandingChecks.ts). EXPLORE has two faces set by the MODE key, with
 * different readouts and dock keys, so it gets two guides:
 *   fretted   — bezel NOTE / FREQ / INTERVAL / LENGTH, the FRET fader;
 *   harmonics — bezel NOTE / FREQ / INTERVAL / NODE, the NODE key.
 * The guide opened is the one for the MODE showing when ⓘ is tapped; a MODE
 * switch closes an open guide (D41 #11), so the learner never reads one
 * mode's steps over the other mode's screen.
 *
 * Every name is the on-screen name in BassLabScreen.tsx (bezel keys, dock
 * labels and options, the label strip under the board, LAB NOTES headings),
 * LabShell.tsx, the guided lesson (guidedLessons/content.ts → bass) and
 * LabUnderstandingCheck.tsx. Every number in TRY THIS is what the screen
 * prints at that setting, from the lab's own formulas (pinned in
 * test/screenGuide_bass_20261031.test.ts):
 *   FREQ   = open Hz × 2^(fret/12)   (fretted)   · open Hz × n (harmonics), toFixed(1)
 *   LENGTH = 2^(−fret/12) × 100, toFixed(0) %
 *   NOTE   = midi name of open midi + fret (or + round(12·log2 n))
 *   open strings E 41.203 · A 55.0 · D 73.416 · G 97.999 Hz
 *   air λ  = 343 / FREQ, toFixed(2) m (LAB NOTES → THE EXACT NUMBERS)
 *   fret n sits 1 − 2^(−n/12) of the way from the nut (fret 7: 33.3 %).
 * Change a label, a string frequency or a formula → update this file; the
 * test pins the names and recomputes the numbers.
 *
 * STEPPED: each section must fit SCREEN_GUIDE_BUDGET (types.ts).
 * Copy rules: plain language, short sentences; KNOWLEDGE, never skills; no
 * gear brand names; no "N of total"; "suggest" never "recommend"; no build
 * notes in learner text.
 */
import type { ScreenGuide } from '../../features/lab/screenGuide/types';

/** The guides this lab offers: EXPLORE in each MODE, LEARN, CHECK. */
export type BassScreenId = 'fretted' | 'harmonics' | 'learn' | 'check';

export const BASS_SCREEN_GUIDES: Record<BassScreenId, ScreenGuide> = {
  // ── EXPLORE · MODE FRETTED ────────────────────────────────────────────────
  fretted: {
    intro: {
      learning: 'Why pitch rises as the vibrating string gets shorter: half the length doubles the frequency, and simple fractions of the string give the octave, fifth and fourth.',
      start: 'Pick STRING E and tap ▶. Slide FRET to 12 and watch FREQ double while LENGTH reads 50%. Then try FRET 7 and FRET 5 and read INTERVAL.',
    },
    seeing: [
      'You’re looking at an electric bass with its frets spaced as on a real one: BRIDGE on the left, HEADSTOCK on the right, low E on top. Your string glows amber.',
      'The finger dot marks your fret. The dimmed part, nut to fret, no longer vibrates. One swinging lobe (a single loop of the swing) runs from fret to bridge.',
      'Watch NOTE, FREQ, INTERVAL (above the open string) and LENGTH (how much string still vibrates).',
    ],
    control: [
      'Tap the fretboard to pick a string and a fret. A fret is the space up to its wire, so an inlay dot picks that fret. The nut or headstock gives OPEN; past fret 12 gives 12.',
      'Tap ▶ in the header to hear a real bass play the note. While ■ shows, every new pick plays; ■ stops. If the screen says the string model is playing, you hear a modeled string.',
      'MODE switches between FRETTED and NATURAL HARMONICS. STRING picks E · 41 Hz, A · 55 Hz, D · 73 Hz or G · 98 Hz.',
      'Slide FRET from OPEN through frets 1 to 12, one fret per step.',
      'Long-press a key or readout to read about it; ⓘ explains the display. LAB NOTES below: THE EXACT NUMBERS, THE NOTE, AS SOUND and two CHECK YOURSELF questions.',
    ],
    changes: [
      'Each fret leaves 2^(−1/12), about 94.4%, of the length before it, so each fret raises pitch by the same ratio, ×1.0595. Equal shares of a shrinking length crowd frets toward the bridge.',
      'Halve the length (fret 12) and FREQ doubles: an OCTAVE. About ⅔ (fret 7) gives 3:2, a PERFECT 5TH; about ¾ (fret 5) gives 4:3, a PERFECT 4TH.',
      'The swing is slowed so you can watch. On one string, a higher fret swings faster.',
    ],
    teaches: [
      'Pitch follows vibrating length, in inverse proportion: half the length gives twice the frequency; two-thirds the length gives 1.5 times.',
      'The simple fractions of a string are the consonant intervals: ½ an octave, ⅔ a fifth, ¾ a fourth.',
      'Frets crowd toward the bridge because every semitone is the same ratio, ×1.0595, not the same distance.',
    ],
    tryThis: [
      'Pick STRING E and slide FRET to 12: FREQ goes 41.2 → 82.4 Hz, NOTE E1 → E2, LENGTH 50%. Half the string, twice the frequency: an OCTAVE.',
      'Now FRET 7: B1, 61.7 Hz, PERFECT 5TH, LENGTH 67%. That’s about ⅔ of the string, and 61.7 ÷ 41.2 ≈ 1.50, the 3:2 of a fifth.',
      'Set FRET 5 on E: A1, 55.0 Hz, the same as STRING A, OPEN. A bass is tuned in fourths (E, A, D, G), so fret 5 on E, A or D matches the next string open.',
    ],
  },

  // ── EXPLORE · MODE NATURAL HARMONICS ──────────────────────────────────────
  harmonics: {
    intro: {
      learning: 'How a lightly touched string keeps its full length but vibrates in equal parts, sounding one harmonic: a whole-number multiple of the open string’s frequency.',
      start: 'Pick STRING E and tap ▶. Step NODE through ½, ⅓, ¼ and ⅕, and watch FREQ climb in equal steps of 41.2 Hz. Count the lobes each time.',
    },
    seeing: [
      'Here the string is touched, not pressed, so it vibrates over its FULL length in equal lobes.',
      'Green dots are nodes, points that stay still; amber dots mark the lobe peaks. The amber ring is your light touch, ½, ⅓, ¼ or ⅕ of the way from the nut.',
      'Read NOTE, FREQ, INTERVAL (above the open string) and NODE: the touch point and harmonic number, for example ½ · H2.',
    ],
    control: [
      'Tap the fretboard to pick the nearest string and the nearest of the four touch points.',
      'Tap ▶ in the header to hear that natural harmonic played on a real bass. While ■ shows, every new pick plays; ■ stops. If the screen says the string model is playing, you hear a modeled string.',
      'MODE takes you back to FRETTED. STRING picks E, A, D or G; the harmonics are always of the OPEN string.',
      'NODE picks the touch: ½ · H2 · OCTAVE (2:1), ⅓ · H3 · OCTAVE + 5TH (3:1), ¼ · H4 · 2 OCTAVES (4:1) or ⅕ · H5 · 2 OCT + MAJ 3RD (5:1).',
      'Long-press a key or readout to read about it; ⓘ explains the display. ⤢ FULL SCREEN and ▴ HIDE DISPLAY change the display’s size.',
    ],
    changes: [
      'Your light touch stops every vibration that must move at that spot. Only harmonics with a node there survive: at ⅓ that’s H3, H6, H9…, and you hear H3, three times the open string.',
      'More lobes, higher pitch: harmonic n is exactly n × the open frequency.',
      'H5 reads ≈ and −14¢: 5 × the open string lands 14 cents (hundredths of a semitone) flat of the nearest piano key, tuned in 12 equal steps per octave.',
    ],
    teaches: [
      'A string vibrates in whole-number parts at once: the harmonic series, n × the fundamental (the open string’s own pitch).',
      'Fretting makes a new, shorter string. Touching a node keeps the whole string and picks out one harmonic.',
      'Natural harmonics don’t all match piano pitches: the 5th harmonic lands 14 cents flat of the equal-tempered major third.',
    ],
    tryThis: [
      'Pick STRING E, NODE ½: E2, 82.4 Hz, the same as fret 12 in FRETTED. Here the whole string swings in two halves; fretting made the string half as long.',
      'Step NODE ½ → ⅓ → ¼ → ⅕ on E: 82.4, 123.6, 164.8, 206.0 Hz. That’s 2, 3, 4 and 5 × 41.2, one more lobe each time.',
      'At ⅓ the ring sits over fret 7 (33.3% from the nut). Same spot, two physics: fretted it’s B1 61.7 Hz; the harmonic is B2 123.6 Hz, an octave higher.',
    ],
  },

  // ── LEARN — the reading page ──────────────────────────────────────────────
  learn: {
    intro: {
      learning: 'The ideas behind this lab in words and formulas: vibrating length, fret ratio, node, harmonic and interval, and the common mix-ups about frets and wavelength.',
      start: 'Read COMMON MISTAKES first, then FORMULA / CONCEPT. Switch to EXPLORE to test a line: open E reads 41.2 Hz, and fret 12 reads 82.4 Hz.',
    },
    seeing: [
      'This is the Bass Guitar guided lesson as one page to read. ▶ in the header still plays the note you chose on EXPLORE.',
      'It starts with what the lab is, then CONTROLS: the display, STRING, FRET, NODE and ▶ (play).',
      'Then come COMMON MISTAKES, PRO TIPS and FORMULA / CONCEPT: f = f₀ · 2^(n/12) for fret n, f = n · f₀ for a harmonic, where f₀ is the open string.',
    ],
    control: [
      'Scroll to read. Use the tabs under the title to switch between LEARN, EXPLORE and CHECK.',
      'On EXPLORE, ⓘ GUIDED LESSON at the end of LAB NOTES opens this same lesson as a sheet over the fretboard.',
      'On EXPLORE, long-press MODE, STRING, FRET, NODE or a readout to read just its entry.',
    ],
    changes: [
      'Nothing on this page moves. Use it to explain what the fretboard and readouts show you on EXPLORE.',
      'Each COMMON MISTAKES line names a mix-up and the physics that corrects it: thinking frets are evenly spaced, the 7th-fret note versus the ⅓ harmonic, string versus air wavelength.',
      'FORMULA / CONCEPT sums up the lab: the fret rule, λ = 2L (the string’s wave is twice its length) and the three ratios.',
    ],
    teaches: [
      'The words for string physics: vibrating length, fret ratio, node, harmonic, interval.',
      'The wave on the string (λ = 2L) is not the sound wave in air: open E’s sound wave is about 8.32 m long.',
      'A fret multiplies pitch by 2^(1/12) each step; a harmonic multiplies the open string by a whole number.',
    ],
    tryThis: [
      'Read the first PRO TIPS line, then try it on EXPLORE: open E reads E1 41.2 Hz; fret 12 and the ½ harmonic both read E2 82.4 Hz.',
      'Read the mistake about string versus air wavelength. Then open LAB NOTES on EXPLORE: THE EXACT NUMBERS shows open E’s sound wave is about 8.32 m long in air.',
    ],
  },

  // ── CHECK — the understanding check ───────────────────────────────────────
  check: {
    intro: {
      learning: 'A review of the lab’s core physics: length and pitch, string fractions and intervals, why frets crowd together, and what a light touch at ⅓ sounds.',
      start: 'Start with the 12th-fret question. Unsure? Reread FORMULA / CONCEPT on LEARN, then come back. A wrong pick costs nothing, and you can pick again straight away.',
    },
    seeing: [
      'CHECK YOUR UNDERSTANDING asks four questions: the 12th fret, the 7th fret, why frets crowd together, and the touch at ⅓.',
      'A ✓ replaces a question’s number once you answer it right.',
      'When every answer is right, it reads “the check is passed”.',
    ],
    control: [
      'Tap an answer. If it’s right, you see CORRECT and why. If not, you see NOT QUITE — TRY ANOTHER with the reason, and you can pick again straight away.',
      'There’s no score, and a wrong pick costs nothing. Test an idea on EXPLORE and come back: answers already right stay right until you leave the lab.',
    ],
    changes: [
      'A right answer stays right even when you switch to LEARN or EXPLORE, so you can test an idea on the fretboard and return.',
      'Get all four right and the check is passed. A pass is kept: later visits show the check as passed.',
    ],
    teaches: [
      'How the length of a vibrating string sets its pitch, and which simple fractions of a string make musical intervals.',
      'Why the spacing between frets changes along the neck, and what a light touch does that a pressed fret doesn’t.',
    ],
    tryThis: [
      'Unsure about a fret question? On LEARN, reread FORMULA / CONCEPT: the fret rule f = f₀ · 2^(n/12) and how simple string fractions match intervals.',
      'For the light-touch question, try a different touch on EXPLORE: MODE NATURAL HARMONICS, STRING E, NODE ¼. Count the lobes, then compare FREQ, 164.8 Hz, with open E’s 41.2 Hz.',
    ],
  },
};

/** The guide for a LabShell tab, given the EXPLORE MODE showing — the
 *  function BassLabScreen hands to LabShell's `guide`. */
export function bassScreenGuide(tab: string, mode: 'fretted' | 'harmonics'): ScreenGuide | undefined {
  if (tab === 'explore') return BASS_SCREEN_GUIDES[mode];
  if (tab === 'learn' || tab === 'check') return BASS_SCREEN_GUIDES[tab];
  return undefined;
}
