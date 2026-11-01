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
 * The guide opened is the one for the MODE showing when ⓘ is tapped (the
 * host keeps that guide while it is open, so a TRY THIS step that switches
 * MODE does not swap the text under the learner).
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
    seeing: [
      'An electric bass at true fret spacing: body and BRIDGE on the left, HEADSTOCK on the right, low E on top. The chosen string glows amber.',
      'The finger dot marks the fret. Nut to fret is dimmed — that part no longer vibrates. One swinging lobe (a single loop of the swing) spans fret to bridge.',
      'Readouts: NOTE, FREQ, INTERVAL (above the open string) and LENGTH (the share of the string still vibrating).',
    ],
    control: [
      'Tap the fretboard: the nearest string and fret become the note. The lesson uses frets 0–12; the dimmer frets past 12 are drawn for the real neck.',
      '▶ in the header plays a recording of a real bass at that note (if one can’t load, the string model plays instead and the screen says so). While ■ shows, every new pick plays; ■ stops.',
      'MODE key: FRETTED or NATURAL HARMONICS. STRING key: E · 41 Hz, A · 55 Hz, D · 73 Hz or G · 98 Hz.',
      'FRET fader: OPEN, then frets 1 to 12, one step per fret.',
      'Long-press a key or readout for its lesson entry; ⓘ after the readouts explains the display. Below, LAB NOTES: THE EXACT NUMBERS, THE NOTE, AS SOUND and two CHECK YOURSELF questions.',
    ],
    changes: [
      'Each fret keeps 2^(−1/12) — about 94.4% — of the length before it, so every fret raises the pitch by the same ratio, ×1.0595. Equal ratios on a shrinking length crowd the frets toward the bridge.',
      'Half the length (fret 12) doubles FREQ: an OCTAVE. About ⅔ (fret 7) gives 3:2, a PERFECT 5TH; about ¾ (fret 5) gives 4:3, a PERFECT 4TH.',
      'The swing is slowed to watch; on one string, a higher fret swings faster.',
    ],
    teaches: [
      'Pitch follows vibrating length: the frequency goes up exactly as the length goes down — half the length, twice the frequency.',
      'The simple fractions of a string are the consonant intervals: ½ an octave, ⅔ a fifth, ¾ a fourth.',
      'It opens Instruments & Recording, before the Microphone Selection Lab. The Harmonics and Harmonograph labs show the same ratios as spectra and curves.',
    ],
    tryThis: [
      'STRING E, then slide FRET to 12: FREQ goes 41.2 → 82.4 Hz, NOTE E1 → E2, LENGTH 50% — half the string, twice the frequency, an OCTAVE.',
      'Now FRET 7: B1, 61.7 Hz, PERFECT 5TH, LENGTH 67% — about ⅔ of the string, and 61.7 ÷ 41.2 ≈ 1.50, the 3:2 of a fifth.',
      'FRET 5 on E reads A1, 55.0 Hz — the same as the open A string (STRING A, OPEN). A bass is tuned in fourths (E, A, D, G), so fret 5 on E, A or D matches the next string open.',
    ],
  },

  // ── EXPLORE · MODE NATURAL HARMONICS ──────────────────────────────────────
  harmonics: {
    seeing: [
      'The same bass, but the string is touched, not pressed: it vibrates over its FULL length in equal lobes.',
      'Green dots are the nodes (points that stay still); amber dots mark the lobe peaks. The amber ring is the light touch, ½, ⅓, ¼ or ⅕ of the way from the nut.',
      'Readouts: NOTE, FREQ, INTERVAL (above the open string) and NODE — the touch point and harmonic number, e.g. ½ · H2.',
    ],
    control: [
      'Tap the fretboard: the nearest string and the nearest of the four touch points.',
      '▶ in the header plays a recording of that natural harmonic on a real bass (if one can’t load, the string model plays instead and the screen says so). While ■ shows, every new pick plays; ■ stops.',
      'MODE key: back to FRETTED. STRING key: E, A, D or G — the harmonics are always of the OPEN string.',
      'NODE key: ½ · H2 · OCTAVE (2:1), ⅓ · H3 · OCTAVE + 5TH (3:1), ¼ · H4 · 2 OCTAVES (4:1) or ⅕ · H5 · 2 OCT + MAJ 3RD (5:1).',
      'Long-press a key or readout for its lesson entry; ⓘ after the readouts explains the display. ⤢ FULL SCREEN and ▴ HIDE DISPLAY resize it.',
    ],
    changes: [
      'A light touch stops every vibration that must move at that spot. Only harmonics with a node there survive: at ⅓ that is H3, H6, H9… and you hear H3, three times the open string.',
      'More lobes, higher pitch: harmonic n is exactly n × the open frequency.',
      'H5 reads ≈ and −14¢: 5 × the open string lands 14 cents (hundredths of a semitone) flat of the piano’s nearest key (12 equal steps per octave).',
    ],
    teaches: [
      'A string vibrates in whole-number parts at once — the harmonic series, n × the fundamental.',
      'Fretting makes a new, shorter string; touching a node keeps the whole string and picks out one harmonic.',
      'The Harmonics lab builds tones from this same series; the Harmonograph draws its ratios as curves.',
    ],
    tryThis: [
      'STRING E, NODE ½: E2, 82.4 Hz — the same as fret 12 in FRETTED. Half the modes instead of half the length.',
      'Step NODE ½ → ⅓ → ¼ → ⅕ on E: 82.4, 123.6, 164.8, 206.0 Hz — 2, 3, 4 and 5 × 41.2, one more lobe each time.',
      'At ⅓ the ring sits right over fret 7 (33.3% from the nut). Same spot, two physics: fretted it is B1 61.7 Hz, the harmonic B2 123.6 Hz — an octave higher.',
    ],
  },

  // ── LEARN — the reading page ──────────────────────────────────────────────
  learn: {
    seeing: [
      'The LEARN tab: the Bass Guitar guided lesson as one page to read. The page is reading only; ▶ in the header still plays the note chosen on EXPLORE.',
      'First what the lab is, then CONTROLS: the display, String, Fret, Harmonic node and Pluck tone.',
      'Then COMMON MISTAKES, PRO TIPS and FORMULA / CONCEPT — f = f₀ · 2^(n/12) for fret n, f = n·f₀ for a harmonic.',
    ],
    control: [
      'Scroll to read. The tabs under the title switch between LEARN, EXPLORE and CHECK.',
      'On EXPLORE, ⓘ GUIDED LESSON at the end of LAB NOTES opens this same lesson as a sheet over the fretboard.',
      'On EXPLORE, long-press MODE, STRING, FRET, NODE or a readout to open just its entry.',
    ],
    changes: [
      'Nothing on this page moves — it is the reference for what EXPLORE shows.',
      'Each COMMON MISTAKES line names a mix-up and the physics that corrects it: evenly spaced frets, the 7th-fret note versus the ⅓ harmonic, string versus air wavelength.',
      'FORMULA / CONCEPT puts the lab in one line: the fret rule, λ = 2L and the three ratios.',
    ],
    teaches: [
      'The words for string physics: vibrating length, fret ratio, node, harmonic, interval.',
      'Why each common mistake happens, and the number that shows it.',
      'The reference behind EXPLORE and the CHECK questions.',
    ],
    tryThis: [
      'Read the first PRO TIPS line, then try it on EXPLORE: open E reads E1 41.2 Hz; fret 12 and the ½ harmonic both read E2 82.4 Hz.',
      'Read the mistake about string versus air wavelength, then on EXPLORE open LAB NOTES: THE EXACT NUMBERS shows open E’s sound wave is about 8.32 m long in air.',
    ],
  },

  // ── CHECK — the understanding check ───────────────────────────────────────
  check: {
    seeing: [
      'CHECK YOUR UNDERSTANDING: four questions on this lab — the 12th fret, the 7th fret, why frets crowd together, and the touch at ⅓.',
      'A ✓ replaces a question’s number once you get it right.',
      'With every answer right it reads “this lab is complete” — passing this check is what completes Bass Guitar Physics.',
    ],
    control: [
      'Tap an answer. Right: CORRECT and why. Wrong: NOT QUITE — TRY ANOTHER, with the reason; pick again straight away.',
      'A wrong pick costs nothing and there is no score. Switching tabs starts the questions over, so test an idea on EXPLORE first.',
    ],
    changes: [
      'A right answer stays right while you stay on this tab; a wrong one costs nothing.',
      'Once every answer is right the lab is marked complete, and later visits show the check as passed.',
    ],
    teaches: [
      'Whether the core ideas stuck: length and pitch, fractions and intervals, equal-ratio frets, nodes and harmonics.',
      'Each explanation ties the idea back to what EXPLORE shows: lengths, frequencies and lobes.',
    ],
    tryThis: [
      'Before the 12th-fret question, check it on EXPLORE: open E reads 41.2 Hz, fret 12 reads 82.4 Hz.',
      'For the ⅓ question, compare on EXPLORE: fret 7 is B1 61.7 Hz; the ⅓ harmonic is B2 123.6 Hz.',
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
