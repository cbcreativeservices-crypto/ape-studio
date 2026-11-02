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
    seeing: [
      'A scope. Left of the green CHORUS bar (IN ▸): your sound, in gray. Right of it, to ▸ OUT: your sound again (faint gray), the delayed copy (blue) and what you hear — the two mixed (the bold glowing line).',
      'The note at the bottom left names the tone drawn: SCOPE · 440 Hz TONE, or 440 Hz PART OF THE NOISE with PINK NOISE.',
      'Readouts on the frame: RATE, DEPTH and MIX.',
    ],
    control: [
      '▶ at the top right (or a tap on the display) plays the source through the chorus; ■ stops it.',
      'RATE fader (0.10–3.00 Hz, starts at 0.25 Hz): how fast the copy’s delay wobbles — the LFO.',
      'DEPTH: SUBTLE, CLASSIC or DEEP — how far the delay swings. DELAY (VOICE DELAY): 15, 20 or 35 ms — how far behind the copy sits.',
      'MIX: 30%, 50% or 100% = VIBRATO — how much copy is mixed in. SOURCE: SINE 440 Hz or PINK NOISE.',
      'Long-press a key or readout for its lesson entry. Below: HIDE DISPLAY, FULL SCREEN, and LAB NOTES with the response curve and two quick questions.',
    ],
    changes: [
      'The copy plays your sound a little late. As the delay drifts, the copy slides against your sound: where they line up the mix swells, where they oppose it thins. That beating is the shimmer.',
      'A delay that keeps changing also bends the copy’s pitch slightly up and down — the detune.',
      'At MIX 100% your dry sound is gone: only the wobbling copy is left — vibrato, not chorus.',
    ],
    teaches: [
      'Chorus is a short, slowly moving delay mixed with the dry sound; the beating between the two reads as thick and wide.',
      'Its delay (15–35 ms here) is long, so the cancellation notches it makes sit close together — every 50 Hz at 20 ms — too close to hear as a sweep.',
      'First Modulation lab, after Delay and Reverb; Flanger and Phaser follow. Each picture is a teaching model, not a measurement.',
    ],
    tryThis: [
      'Play SINE 440 Hz at the start settings: the bold line swells and thins as the blue copy slides. Set MIX to 100% = VIBRATO: the bold line follows the copy alone and stops swelling.',
      'Drag RATE up: the copy slides faster. From 0.87 Hz (DEPTH on CLASSIC) the note reads 440 Hz · LFO SLOWED — the drawing is held back to stay readable; the sound is not.',
      'With MIX back on 50%, open LAB NOTES and step DELAY 15 → 20 → 35 ms: the caption under DESIGNED RESPONSE gives notches every 67, 50, then 29 Hz — a longer delay packs them closer.',
    ],
  },

  // ── LEARN — the reading page ──────────────────────────────────────────────
  learn: {
    seeing: [
      'The LEARN tab: the Chorus guided lesson as one page to read. Nothing on it moves; the ▶ in the header still plays or stops the sound.',
      'First what chorus is, then CONTROLS: one entry each for the display, Rate, Depth, Voice delay and Mix.',
      'Then COMMON MISTAKES, PRO TIPS and FORMULA / CONCEPT.',
    ],
    control: [
      'Scroll to read. The tabs under the title switch to EXPLORE (the live rack) and CHECK (the questions that complete the lab).',
      'On EXPLORE, ⓘ GUIDED LESSON at the end of LAB NOTES opens this same lesson as a sheet; long-press a key or readout there to open just its entry.',
    ],
    changes: [
      'This page is the reference for what EXPLORE shows.',
      'Each CONTROLS entry names a key on EXPLORE: Rate is RATE, Depth is DEPTH, Voice delay is DELAY, Mix is MIX.',
      'The ranges match the rack: Rate about 0.1–3 Hz, Voice delay 15–35 ms.',
    ],
    teaches: [
      'The words for chorus: LFO, rate, depth, voice delay, wet/dry mix, vibrato.',
      'Why too much rate or depth sounds out of tune, and why 100% wet stops being chorus.',
      'Why a wide chorus can thin out when the mix is summed to mono, so a mono check is worth doing.',
    ],
    tryThis: [
      'Read the Mix entry, then on EXPLORE play SINE 440 Hz and set MIX to 100% = VIBRATO: the bold line stops swelling — the dry voice it beat against is gone.',
      'Read the COMMON MISTAKES line on Rate/Depth, then on EXPLORE set DEPTH to DEEP and drag RATE to 3.00 Hz: listen for the seasick warble.',
    ],
  },

  // ── CHECK — the questions that complete the lab ───────────────────────────
  check: {
    seeing: [
      'The CHECK tab: CHECK YOUR UNDERSTANDING for the Chorus lab — four questions, four answers each.',
      'A line under the heading says how many are still to get right. A ✓ replaces a question’s number once you answer it right.',
    ],
    control: [
      'Tap an answer. Right: it turns green and CORRECT shows why. Wrong: NOT QUITE — TRY ANOTHER shows why, and you pick again straight away.',
      'There is no score, and a wrong answer costs nothing. A right answer stays right.',
      'The tabs under the title go to LEARN or EXPLORE at any time; answers already right stay right. Leaving the lab before the last one starts the check over.',
    ],
    changes: [
      'Each question is about something EXPLORE shows: what makes the shimmer, why 100% wet turns into vibrato, how chorus’s delay compares with a flanger’s, and what a fast RATE sounds like.',
      'When all four are right the card reads Lab complete, and the tab opens already complete next time.',
    ],
    teaches: [
      'It checks the ideas: a moving delayed copy beating against the dry sound, the job of MIX, and how chorus differs from flanger.',
      'Completing it finishes the Chorus lab; Flanger is next in Modulation.',
    ],
    tryThis: [
      'Before you start, on EXPLORE play SINE 440 Hz and set MIX to 100% = VIBRATO: watch what the bold line does, then come here.',
      'For the delay question, compare DELAY on EXPLORE (15, 20 or 35 ms) with the few milliseconds a flanger uses.',
    ],
  },
};

/** The guide for a LabShell tab — LabShell's per-tab `guide` function. */
export function chorusScreenGuide(mode: string): ScreenGuide | undefined {
  return mode === 'explore' || mode === 'learn' || mode === 'check' ? CHORUS_SCREEN_GUIDES[mode] : undefined;
}
