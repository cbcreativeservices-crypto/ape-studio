/**
 * Chorus Lab — "explain this screen" content (Screen Guide rollout,
 * 2026-10-31; standard = wave/waveScreenGuides.ts).
 *
 * The lab is ONE LabShell screen (FxLabScreen + chorusConfig in
 * fxLabConfigs.tsx) with three tabs, so the guides are keyed by the shell's
 * tab id:
 *   explore — the rack: the animated scope (fxAnim ModFlow, chorus), the bezel
 *             (RATE · DEPTH · MIX), the dock (RATE fader · DEPTH · DELAY ·
 *             MIX · SOURCE), the header ▶, LAB NOTES (DESIGNED RESPONSE, THE
 *             AUDIO PATH, two CHECK YOURSELF cards, ⓘ GUIDED LESSON);
 *   learn   — the reading page (the chorus guided lesson in full);
 *   check   — CHECK YOUR UNDERSTANDING (understandingChecks.ts CHORUS, four
 *             questions; LabUnderstandingCheck).
 * The first-open term popup and the guided-lesson sheet have no header and no
 * ⓘ, so they have no guide here.
 *
 * Every name is the on-screen name read from code (config labels, the dock's
 * `short` labels, the scope's own notes). Every number in TRY THIS is what the
 * screen prints at that setting:
 *   • heroCaption notch spacing = round(1000 / VOICE DELAY ms):
 *       15 ms → 67 Hz · 20 ms → 50 Hz · 35 ms → 29 Hz;
 *   • the scope note turns to "440 Hz · LFO SLOWED" once RATE passes
 *       45 / (2π·440·0.006·depth·2π) Hz — CLASSIC (0.5): 0.864 Hz, so the
 *       first 0.01-Hz fader step that shows it is 0.87 Hz;
 *   • at MIX 100% the drawn output IS the copy (feedback is fixed at 0), so the
 *       bold line stops swelling.
 * test/screenGuide_chorus_20261031.test.ts pins the names and recomputes the
 * numbers. Change a label, range or default → update this file.
 *
 * STEPPED: each section must fit SCREEN_GUIDE_BUDGET (types.ts).
 * Copy rules: plain language, short sentences; KNOWLEDGE, never skills; no
 * gear brand names; no "N of total"; "suggest" never "recommend"; no build
 * notes in learner text.
 */
import type { ScreenGuide } from '../../features/lab/screenGuide/types';

/** The LabShell tabs this lab offers. */
export type ChorusScreenId = 'explore' | 'learn' | 'check';

export const CHORUS_SCREEN_GUIDES: Record<ChorusScreenId, ScreenGuide> = {
  // ── EXPLORE — the rack ────────────────────────────────────────────────────
  explore: {
    intro: {
      learning: 'How chorus works: a copy of your sound, 15–35 ms late and slowly wobbling in time, beats against the dry sound, and your ear hears that as thick and wide.',
      start: 'Set SOURCE to SINE 440 Hz and tap ▶. Watch the bold line swell and thin. Then set MIX to 100% = VIBRATO and see the swelling stop.',
    },
    seeing: [
      'Left of the green CHORUS bar (IN ▸) is your sound, in gray. Right of it, to ▸ OUT: your sound again (faint gray), the delayed copy (blue) and what you hear: the two mixed (bold glowing line).',
      'The note at bottom left names the tone drawn: SCOPE · 440 Hz TONE, or 440 Hz PART OF THE NOISE with PINK NOISE.',
      'RATE, DEPTH and MIX on the frame show your settings. The scope draws the idea; it is not a measurement.',
    ],
    control: [
      'Tap ▶ at the top right, or tap the display, to play the source through the chorus; ■ stops it.',
      'Drag the RATE fader (0.10–3.00 Hz, starts at 0.25 Hz) to set how fast the LFO, a low-frequency oscillator, wobbles the copy’s delay.',
      'DEPTH (SUBTLE, CLASSIC or DEEP) sets how far that delay swings. DELAY (VOICE DELAY: 15, 20 or 35 ms) sets how far behind your sound the copy sits.',
      'MIX (30%, 50% or 100% = VIBRATO) sets how much copy you hear. SOURCE picks SINE 440 Hz or PINK NOISE. Compare DELAY on PINK NOISE: on a sine, each setting should sound the same.',
      'Long-press a key or readout for its lesson entry. Below: HIDE DISPLAY, FULL SCREEN, and LAB NOTES with the response curve and two quick questions.',
    ],
    changes: [
      'The copy plays your sound a little late. As the delay drifts, the copy slides against your sound: where they line up the mix swells, where they oppose it thins. That beating is the shimmer.',
      'A delay that keeps changing also bends the copy’s pitch slightly up and down. That small detune is why it sounds like two players.',
      'At MIX 100% your dry sound is gone. Only the wobbling copy is left: vibrato, not chorus.',
    ],
    teaches: [
      'Chorus is a short, slowly moving delay mixed with the dry sound. The beating between the two reads as thick and wide.',
      'Its delay (15–35 ms here) is long, so the cancellation notches it makes sit close together: every 50 Hz at 20 ms. That is too close to hear as a sweep.',
      'Chorus needs the dry sound: the effect is the difference between a steady voice and a wavering copy.',
    ],
    tryThis: [
      'Play SINE 440 Hz at the start settings: the bold line swells and thins as the blue copy slides. Set MIX to 100% = VIBRATO: the bold line follows the copy alone and stops swelling.',
      'Drag RATE up: the copy slides faster. From 0.87 Hz (DEPTH on CLASSIC) the note reads 440 Hz · LFO SLOWED. The picture slows so you can follow it; the sound keeps the full rate.',
      'With MIX back on 50%, open LAB NOTES and step DELAY 15 → 20 → 35 ms: the caption under DESIGNED RESPONSE gives notches every 67, 50, then 29 Hz — a longer delay packs them closer.',
    ],
  },

  // ── LEARN — the reading page ──────────────────────────────────────────────
  learn: {
    intro: {
      learning: 'The vocabulary of chorus (LFO, rate, depth, voice delay, wet/dry mix, vibrato) and why too much movement, or no dry sound, stops it sounding like chorus.',
      start: 'Scroll to the MIX entry and read it. Then switch to EXPLORE, play SINE 440 Hz and set MIX to 100% = VIBRATO to hear what it describes.',
    },
    seeing: [
      'This is the Chorus guided lesson as one page to read. Nothing on it moves, but ▶ in the header still plays or stops the sound.',
      'It starts with what chorus is, then CONTROLS: one entry each for the display, RATE, DEPTH, DELAY and MIX.',
      'It ends with COMMON MISTAKES, PRO TIPS and FORMULA / CONCEPT.',
    ],
    control: [
      'Scroll to read. Use the tabs under the title to switch to EXPLORE, the live rack, or CHECK, four questions on chorus.',
      'On EXPLORE, ⓘ GUIDED LESSON at the end of LAB NOTES opens this same lesson as a sheet. Long-press a key or readout there to open just its entry.',
    ],
    changes: [
      'Read this page beside EXPLORE: each idea here is something you can hear or see on the rack.',
      'Each CONTROLS entry is named for its key on EXPLORE: RATE, DEPTH, DELAY and MIX.',
      'The ranges match the rack: RATE about 0.1–3 Hz, DELAY 15–35 ms.',
    ],
    teaches: [
      'The words for chorus: LFO (the slow wobble that moves the delay), rate, depth, voice delay, wet/dry mix, vibrato.',
      'Why too much rate or depth sounds out of tune, and why 100% wet stops being chorus.',
      'Why a wide chorus can thin out when the mix is summed to mono, so a mono check is worth doing.',
    ],
    tryThis: [
      'Read the MIX entry, then on EXPLORE play SINE 440 Hz and set MIX to 100% = VIBRATO: the bold line stops swelling — the dry voice it beat against is gone.',
      'Read the COMMON MISTAKES line on RATE and DEPTH, then on EXPLORE set DEPTH to DEEP and drag RATE to 3.00 Hz: listen for the seasick warble.',
    ],
  },

  // ── CHECK — the questions that complete the lab ───────────────────────────
  check: {
    intro: {
      learning: 'A review of the core of chorus: what creates the effect, what MIX does, and how delay length and RATE change what you hear.',
      start: 'Read each question and tap an answer. If one stumps you, reread its part of the lesson on LEARN, then come back. Right answers stay right.',
    },
    seeing: [
      'This is CHECK YOUR UNDERSTANDING for the Chorus lab: four questions, four answers each.',
      'A line under the heading says how many are still to get right. A ✓ replaces a question’s number once you answer it right.',
    ],
    control: [
      'Tap an answer. Right: it turns green and CORRECT shows why. Wrong: NOT QUITE — TRY ANOTHER shows why, and you pick again straight away.',
      'There is no score, and a wrong answer costs nothing. A right answer stays right.',
      'Use the tabs under the title to go to LEARN or EXPLORE at any time; answers already right stay right. If you leave the lab before the last one, the check starts over.',
    ],
    changes: [
      'Each question is about something you heard or saw on EXPLORE: what makes the shimmer, what is left at 100% wet, how chorus’s delay compares with a flanger’s, and what a fast RATE sounds like.',
      'Get all four right and the card reads Check passed. A pass is kept: the tab opens already complete next time.',
    ],
    teaches: [
      'What creates the chorus effect, and what MIX changes about it.',
      'How the length of the delay, and the RATE of its movement, change what you hear.',
    ],
    tryThis: [
      'For the 100% wet question, reread the MIX entry on LEARN, then come back.',
      'For the flanger question, on LEARN reread the CONTROLS entry on the copy’s delay, then come back.',
    ],
  },
};

/** The guide for a LabShell tab — LabShell's per-tab `guide` function. */
export function chorusScreenGuide(mode: string): ScreenGuide | undefined {
  return mode === 'explore' || mode === 'learn' || mode === 'check' ? CHORUS_SCREEN_GUIDES[mode] : undefined;
}
