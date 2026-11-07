/**
 * Harmonic Lab — "explain this screen" content (Screen Guide rollout,
 * 2026-10-31; standard = wave/waveScreenGuides.ts).
 *
 * The lab is ONE LabShell screen with three tabs, and its EXPLORE tab is two
 * different screens chosen by the MODE dock key (HarmonicsView `view`):
 *   explore — MODE = ANALYTIC MODEL: the editable 12-harmonic model — the
 *             band display, marker labels, piano gutter, waveform strip, the
 *             F0 / THD / CREST / SLOPE readouts, the F0 · PRESET · THD CALC ·
 *             AXIS · MODE dock, and the stem editor in LAB NOTES;
 *   live    — MODE = REAL SIGNAL: the microphone, analyzed live — heatmap,
 *             spectrum slice, level strip, F0 / MIC / TONE / MAX readouts,
 *             the F0 · AXIS · MODE dock and the feedback override;
 *   learn   — the reading page (the guided lesson in full);
 *   check   — CHECK YOUR UNDERSTANDING (understandingChecks.ts HARMONIC).
 * No what's-left page exists in this lab (LabShell gets no `checkEnd`).
 *
 * Every name is the on-screen name in HarmonicsView.tsx / HarmonicStems.tsx /
 * HarmonicCard.tsx / harmonicModel.ts. Every number in TRY THIS is what the
 * bezel prints at that setting, worked from harmonicModel (thd /
 * crestFactorDb on synthWaveform(model, 240, 3) / envelopeSlopeDbPerOct, the
 * view's own WAVE_POINTS and WAVE_CYCLES), at the lab's defaults (SAW,
 * F0 100 Hz, LOG ♪, ANALYTIC MODEL):
 *   SAW 75.2 % · 5.8 dB · −6.0     SAW + MUTE EVEN 43.8 % · 1.6 dB · −6.0
 *   SQUARE 43.8 % · 1.6 dB · −6.0  TRIANGLE 12.1 % · 4.5 dB · −12.0
 *   SAW with H2's POLARITY +180° → 75.2 % · 4.4 dB (phase moves crest only)
 *   marker labels at F0 100 Hz: "1: 100 G2 +35¢", "3: 300 D4 +37¢".
 * The REAL SIGNAL guide quotes no measured figure — what the mic hears
 * depends on the phone, its volume and the room.
 * test/screenGuide_harmonic_20261031.test.ts pins the names and the numbers.
 *
 * STEPPED: each section must fit SCREEN_GUIDE_BUDGET (types.ts).
 * Copy rules: plain language, short sentences; KNOWLEDGE, never skills; no
 * gear brand names; no "N of total"; "suggest" never "recommend"; no build
 * notes in learner text.
 */
import type { ScreenGuide } from '../../features/lab/screenGuide/types';

/** One guide per screen: the LabShell tabs, EXPLORE split by MODE. */
export type HarmonicScreenId = 'explore' | 'live' | 'learn' | 'check';

export const HARMONIC_SCREEN_GUIDES: Record<HarmonicScreenId, ScreenGuide> = {
  // ── EXPLORE · ANALYTIC MODEL ──────────────────────────────────────────────
  explore: {
    seeing: [
      'Frequency runs up; each harmonic is a band, brighter and wider when louder. Left labels: harmonic, Hz, note, cents — 1: 100 G2 +35¢.',
      'On LOG ♪ a piano runs up the right side; keys under a harmonic glow amber. Below: the summed wave, three cycles.',
      'Readouts: F0, THD (overtones vs the fundamental, %), CREST (peak vs the effective, RMS level, dB), SLOPE (dB per octave). Badge: ANALYTIC MODEL — NOT A MEASUREMENT.',
    ],
    control: [
      '▶ in the header plays the twelve harmonics as drawn; ■ stops. The F0 fader slides the fundamental from 60 to 300 Hz.',
      'PRESET key: SINE, SQUARE, TRIANGLE, SAW, PULSE and four distortion recipes — SYM CLIP, ASYM CLIP, SOFT SAT, HARD CLIP. RESTORE PRESET undoes your edits. THD CALC shows how THD is worked out.',
      'AXIS key: LOG ♪ (equal height per octave) or LIN (equal Hz). MODE key: ANALYTIC MODEL or REAL SIGNAL (the mic — its own guide).',
      'In LAB NOTES, the stems H1–H12: drag one up or down; tap for its card and ▶ SOLO; double-tap to reset it; long-press for phase, POLARITY +180° and MUTE. Then GROUPS & OVERLAYS, SOLO or MUTE ODD and EVEN, NORMALIZE, SNAPSHOT A, A/B GHOST.',
    ],
    changes: [
      'Harmonics are whole-number multiples of F0. The display rescales with F0, so bands stay put while their labels and lit keys change.',
      'A preset or stem drag changes the balance — the timbre — and THD, CREST, SLOPE and the wave follow.',
      'Phase shifts a harmonic in time: the wave and CREST change; levels and THD do not.',
      'LIN spaces harmonics evenly; LOG ♪ crowds them upward: intervals shrink up the series.',
    ],
    teaches: [
      'Timbre is a harmonic recipe: which ones, how strong. Odd only: square, triangle. All: the saw.',
      'THD: overtone strength next to the fundamental. CREST: how peaky the wave is. SLOPE: how fast overtones fade — steeper is darker.',
      'The ear follows levels far more than phases: the spectrum shows timbre better than the shape.',
      'After Oscillators and Noise; FM Synthesis is next. Clip recipes preview the Distortion lab.',
    ],
    tryThis: [
      'On the default SAW tap MUTE EVEN: THD falls from 75.2 % to 43.8 % and CREST from 5.8 to 1.6 dB. That is SQUARE’s recipe — pick it: the same numbers.',
      'PRESET → TRIANGLE: SLOPE reads −12.0, twice as steep as SQUARE’s −6.0, and THD only 12.1 % — the same odd harmonics, fading much faster.',
      'PRESET → SAW, long-press stem H2, tap POLARITY +180°, then DONE: the wave changes shape and CREST drops to 4.4 dB, yet THD stays 75.2 % — same levels, nearly the same sound.',
    ],
  },

  // ── EXPLORE · REAL SIGNAL ─────────────────────────────────────────────────
  live: {
    seeing: [
      'REAL SIGNAL: the microphone, analyzed live. A heatmap fills the display — newest at the right, about 18 s of history — with the harmonic marker lines on top.',
      'The green curve at the right is the spectrum right now; the bottom strip is the mic’s level over time.',
      'Readouts: F0, MIC (LIVE, START… or OFF), TONE (ON, OFF or MUTED), MAX (the strongest level on the heatmap). Badge: REAL SIGNAL — dBFS · UNCALIBRATED.',
    ],
    control: [
      '▶ in the header, or a tap on the display, starts the mic (and the tone, once the override is checked); ■ stops both.',
      'The tone is the fundamental alone — a sine at F0, −20 dBFS. It stays muted until you check ⚠ ALLOW SPEAKER WHILE MIC IS ON in LAB NOTES. Keep the volume low.',
      'The F0 fader (60–300 Hz) retunes the tone; the axis follows it, so the markers keep their places and their labels change. AXIS: LOG ♪ or LIN. MODE: back to ANALYTIC MODEL; a mode switch stops all sound.',
      'PRESET, THD CALC and the stems belong to the model, so they are not on this screen.',
    ],
    changes: [
      'The phone plays one harmonic, a pure sine. A band lit at 2×, 3×… F0 was added on the way — by the speaker or the mic, or something rattling nearby. A room changes levels but adds no new frequencies.',
      'Turning playback up usually pushes the speaker harder, so those added harmonics tend to grow.',
      'A new F0 or AXIS clears the history: old columns would sit at the wrong frequencies.',
    ],
    teaches: [
      'Real equipment adds harmonics a model does not — harmonic distortion, the thing THD measures.',
      'dBFS here is relative to the phone’s own full scale: it compares sounds on this phone, not sound levels in a room.',
      'How to read a spectrogram: frequency up, time across, level as color.',
    ],
    tryThis: [
      'Push the F0 fader to the top (phone speakers play higher notes better), check ⚠ ALLOW SPEAKER WHILE MIC IS ON, set the volume low, tap ▶: TONE reads ON; a band usually lights at marker 1.',
      'Raise the volume a step at a time and watch markers 2 and 3: a band that appears there is distortion the speaker or mic added.',
      'Uncheck the override: TONE reads MUTED and new columns lose the marker bands — what is left is the room.',
    ],
  },

  // ── LEARN — the reading page ──────────────────────────────────────────────
  learn: {
    seeing: [
      'The LEARN tab: this lab’s guided lesson as one page to read. Nothing here plays.',
      'First, what the lab is. Then CONTROLS: the display, wave shape, the fundamental, amplitude, duty cycle, adding harmonics, phase, View (MODEL / LIVE), Axis (LOG ♪ / LIN), and the CREST and SLOPE readouts.',
      'Then COMMON MISTAKES, PRO TIPS and FORMULA / CONCEPT — the Fourier series of each wave.',
    ],
    control: [
      'Scroll to read. The tabs under the title switch between LEARN, EXPLORE and CHECK.',
      'On EXPLORE, ⓘ GUIDED LESSON at the end of LAB NOTES opens this lesson as a sheet over the rack.',
      'On EXPLORE, long-press the F0, PRESET, AXIS or MODE key, the F0, CREST or SLOPE readout, or an ODD/EVEN, ENVELOPE, SPACING, SOLO or MUTE chip — or tap the ⓘ after the readouts — to open just that entry.',
    ],
    changes: [
      'Nothing on this page moves — it is the reference for what EXPLORE shows.',
      'Amplitude and duty cycle are ideas here, not keys: on EXPLORE the PULSE preset is fixed at 25 %, and the stems or NORMALIZE set the levels.',
      'Each COMMON MISTAKES line pairs a mix-up with its fix — for example, turning a sound up does not add harmonics.',
    ],
    teaches: [
      'The words of additive synthesis: fundamental, harmonic, partial, odd and even, duty cycle, phase.',
      'Which classic wave holds which harmonics, as one formula each.',
      'Why a wave’s shape can mislead where its spectrum does not.',
    ],
    tryThis: [
      'Read the PRO TIPS line on building a square, then on EXPLORE pick SINE and drag H3 to about −9.5 dB, H5 to −14 and H7 to −17 (1/3, 1/5, 1/7 of H1): the wave squares off.',
      'Read the Harmonic phase entry, then on EXPLORE long-press a stem, tap POLARITY +180°, then DONE: the wave changes, THD does not.',
    ],
  },

  // ── CHECK — CHECK YOUR UNDERSTANDING ──────────────────────────────────────
  check: {
    seeing: [
      'CHECK YOUR UNDERSTANDING: four questions on this lab. Answer every one correctly to complete it.',
      'They ask where the 3rd harmonic of 100 Hz sits, what raising the level does, what changing only phases does, and which wave is built from odd harmonics at 1/n.',
    ],
    control: [
      'Tap an answer. Right: CORRECT and the reason, and its number turns to ✓. Wrong: NOT QUITE — TRY ANOTHER, with the reason — pick again.',
      'There is no score, and a wrong answer costs nothing. The tabs under the title go to LEARN or EXPLORE.',
    ],
    changes: [
      'Answers already right stay right if you switch to LEARN or EXPLORE and come back; leaving the lab before the last one starts the check over.',
      'When every answer is right the page reads that the lab is complete, and it counts wherever this lab is required — it never needs to be taken twice.',
    ],
    teaches: [
      'It checks the core ideas: harmonics as multiples, level against timbre, phase, and building a wave from harmonics.',
      'Each explanation repeats the reason, so a wrong pick still teaches.',
    ],
    tryThis: [
      'Before you start, for the 3rd harmonic: on EXPLORE at F0 100 Hz the left labels read 3: 300 — three times the fundamental.',
      'Before you start, for the odd-harmonic question: on EXPLORE tap MUTE EVEN on SAW and compare it with PRESET → SQUARE — the readouts match.',
    ],
  },
};

/** The guide for a LabShell tab, with EXPLORE chosen by the MODE key — the
 *  host closes over HarmonicsView's `view` and hands LabShell a mode → guide
 *  function. */
export function harmonicScreenGuide(mode: string, view: 'model' | 'live'): ScreenGuide | undefined {
  if (mode === 'explore') return view === 'live' ? HARMONIC_SCREEN_GUIDES.live : HARMONIC_SCREEN_GUIDES.explore;
  return mode === 'learn' || mode === 'check' ? HARMONIC_SCREEN_GUIDES[mode] : undefined;
}
