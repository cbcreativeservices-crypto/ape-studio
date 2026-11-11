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
    intro: {
      learning: 'Why timbre is a harmonic recipe: which whole-number multiples of the fundamental are present and how strong, and why the ear follows levels far more than phase.',
      start: 'Tap ▶ on the default SAW. In LAB NOTES tap MUTE EVEN and watch THD and CREST drop. Then pick PRESET → SQUARE and compare the readouts.',
    },
    seeing: [
      'Frequency runs up. Each harmonic is a band, brighter and wider when louder. Left labels: harmonic, Hz, note, cents: 1: 100 G2 +35¢.',
      'On LOG ♪ a piano runs up the right side; keys under a harmonic glow amber. Below is the summed wave, three cycles.',
      'Readouts: F0, THD (overtones against the fundamental, %), CREST (peak against RMS level, dB), SLOPE (dB per octave). Badge: ANALYTIC MODEL — NOT A MEASUREMENT.',
    ],
    control: [
      'Tap ▶ in the header to hear the twelve harmonics as drawn; ■ stops. Slide F0 to move the fundamental from 60 to 300 Hz.',
      'PRESET: SINE, SQUARE, TRIANGLE, SAW, PULSE and four distortion recipes, SYM CLIP, ASYM CLIP, SOFT SAT and HARD CLIP. RESTORE PRESET undoes your edits; THD CALC shows how THD is worked out.',
      'AXIS: LOG ♪ (equal height per octave) or LIN (equal Hz). MODE: ANALYTIC MODEL or REAL SIGNAL (your mic, live).',
      'In LAB NOTES, stems H1–H12: drag one up or down; tap for its card and ▶ SOLO; double-tap to reset; long-press for phase, POLARITY +180° and MUTE. Then GROUPS & OVERLAYS, SOLO or MUTE ODD and EVEN, NORMALIZE, SNAPSHOT A, A/B GHOST.',
    ],
    changes: [
      'Harmonics are whole-number multiples of F0. The display rescales with F0, so bands stay put while their labels and lit keys change.',
      'A preset or stem drag changes the balance, the timbre; THD, CREST, SLOPE and the wave follow.',
      'Phase shifts a harmonic in time: the wave and CREST change; levels and THD don’t.',
      'LIN spaces harmonics evenly; LOG ♪ crowds them upward, since intervals shrink up the series.',
    ],
    teaches: [
      'Timbre is a harmonic recipe: which harmonics, how strong. Square and triangle: odd only. Saw: all.',
      'THD: overtone strength next to the fundamental. CREST: how peaky the wave is. SLOPE: how fast overtones fade (steeper is darker).',
      'In a steady tone the ear follows levels far more than phases: the spectrum shows timbre better than shape.',
      'Distortion is a harmonic recipe too, as the four distortion presets show.',
    ],
    tryThis: [
      'On the default SAW, tap MUTE EVEN: THD falls from 75.2 % to 43.8 % and CREST from 5.8 to 1.6 dB. That’s SQUARE’s recipe: pick it and see the same numbers.',
      'Pick PRESET → TRIANGLE: SLOPE reads −12.0, twice as steep as SQUARE’s −6.0, and THD only 12.1 %. Same odd harmonics, fading much faster.',
      'PRESET → SAW, long-press stem H2, tap POLARITY +180°, then DONE: the wave changes shape and CREST drops to 4.4 dB, yet THD stays 75.2 %. Same levels, nearly the same sound.',
    ],
  },

  // ── EXPLORE · REAL SIGNAL ─────────────────────────────────────────────────
  live: {
    intro: {
      learning: 'How a real speaker and microphone add harmonics that a pure sine doesn’t have, which is harmonic distortion, and how to read a live spectrogram.',
      start: 'Push F0 to the top, check ⚠ ALLOW SPEAKER WHILE MIC IS ON in LAB NOTES, keep the volume low and tap ▶. Watch marker 1, then markers 2 and 3.',
    },
    seeing: [
      'REAL SIGNAL: your mic, analyzed live. A heatmap fills the display, newest at the right, about 18 s of history, with the harmonic marker lines on top.',
      'The green curve at the right is the spectrum right now; the bottom strip is the mic’s level over time.',
      'Readouts: F0, MIC (LIVE, START… or OFF), TONE (ON, OFF or MUTED), MAX (strongest on the heatmap). REAL SIGNAL — dBFS · UNCALIBRATED: levels are relative.',
    ],
    control: [
      'Tap ▶ in the header, or the display, to start the mic, and the tone once ⚠ ALLOW SPEAKER WHILE MIC IS ON is checked; ■ stops both.',
      'The tone is the fundamental alone: a sine at F0, −20 dBFS. It stays muted until you check ⚠ ALLOW SPEAKER WHILE MIC IS ON in LAB NOTES. Keep the volume low.',
      'Slide F0 (60–300 Hz) to retune the tone; the axis follows, so markers keep their places while their labels change. AXIS: LOG ♪ or LIN. MODE goes back to ANALYTIC MODEL; switching mode stops all sound.',
      'PRESET, THD CALC and the stems shape the model, so you won’t find them here.',
    ],
    changes: [
      'The phone plays one harmonic, a pure sine. A band lit at 2×, 3×… F0 was added on the way: by the speaker, the mic, or something rattling nearby. A room changes levels but adds no new frequencies.',
      'Turning playback up usually pushes the speaker harder, so those added harmonics tend to grow.',
      'A new F0 or AXIS clears the history, because old columns would sit at the wrong frequencies.',
    ],
    teaches: [
      'Real equipment adds harmonics a model doesn’t. That’s harmonic distortion, the thing THD measures.',
      'dBFS here is relative to the phone’s own full scale: it compares sounds on this phone and is not a measured sound level.',
      'A spectrogram shows frequency up, time across, and level as color.',
    ],
    tryThis: [
      'Push F0 to the top (a phone speaker can’t reproduce deep bass), check ⚠ ALLOW SPEAKER WHILE MIC IS ON, set the volume low, tap ▶: TONE reads ON; a band usually lights at marker 1.',
      'Raise the volume a step at a time and watch markers 2 and 3: a band that appears there is distortion the speaker or mic added.',
      'Uncheck ⚠ ALLOW SPEAKER WHILE MIC IS ON: TONE reads MUTED and new columns lose the marker bands. What’s left is the room.',
    ],
  },

  // ── LEARN — the reading page ──────────────────────────────────────────────
  learn: {
    intro: {
      learning: 'The words and formulas of additive synthesis: fundamental, harmonic, partial, odd and even, duty cycle and phase, and the Fourier series behind each classic wave.',
      start: 'Read the PRO TIPS line on building a square. Then on EXPLORE pick SINE and drag H3, H5 and H7 down to 1/3, 1/5 and 1/7 of H1.',
    },
    seeing: [
      'This is the guided lesson as one page. ▶ in the header still plays what you set on EXPLORE.',
      'First, what the lab is. Then CONTROLS: the display, PRESET, F0, Amplitude, Duty cycle (PWM), H1–H12, Harmonic phase, MODE (ANALYTIC MODEL / REAL SIGNAL), AXIS (LOG ♪ / LIN), and the CREST and SLOPE readouts.',
      'Then COMMON MISTAKES, PRO TIPS and FORMULA / CONCEPT: the Fourier series (the sum of sines) behind each wave.',
    ],
    control: [
      'Scroll to read. Use the tabs under the title to switch between LEARN, EXPLORE and CHECK.',
      'On EXPLORE, ⓘ GUIDED LESSON at the end of LAB NOTES opens this lesson as a sheet over the rack.',
      'On EXPLORE, long-press the F0, PRESET, AXIS or MODE key, the F0, CREST or SLOPE readout, or an ODD/EVEN, ENVELOPE, SPACING, SOLO or MUTE chip to read just that entry. The ⓘ after the readouts does the same for the display.',
    ],
    changes: [
      'Nothing on this page moves. Use it to explain what the bands, stems and readouts show you on EXPLORE.',
      'Amplitude and duty cycle are ideas here, not keys. On EXPLORE the PULSE preset is fixed at 25 %, and the stems or NORMALIZE set the levels.',
      'Each COMMON MISTAKES line pairs a mix-up with its fix: for example, turning a sound up does not add harmonics.',
    ],
    teaches: [
      'The words of additive synthesis: fundamental, harmonic, partial, odd and even, duty cycle, phase.',
      'Which classic wave holds which harmonics, as one formula each.',
      'Why a wave’s shape can mislead where its spectrum does not.',
    ],
    tryThis: [
      'Read the PRO TIPS line on building a square. Then on EXPLORE pick SINE and drag H3 to about −9.5 dB, H5 to −14 and H7 to −17 (1/3, 1/5, 1/7 of H1): the wave squares off.',
      'Read the Harmonic phase entry, then on EXPLORE long-press a stem, tap POLARITY +180°, then DONE: the wave changes, THD does not.',
    ],
  },

  // ── CHECK — CHECK YOUR UNDERSTANDING ──────────────────────────────────────
  check: {
    intro: {
      learning: 'A review of harmonics: where a harmonic sits, what overall level does to the recipe, what phase changes, and how odd harmonics build a classic wave.',
      start: 'Read each question and tap an answer. Unsure? Switch to EXPLORE, try the idea on the bands and readouts, then come back to CHECK.',
    },
    seeing: [
      'CHECK YOUR UNDERSTANDING asks four questions on this lab. Get every one right to complete the lab.',
      'They ask where the 3rd harmonic of 100 Hz sits, what raising the level does, what changing only phases does, and which wave is built from odd harmonics at 1/n.',
    ],
    control: [
      'Tap an answer. If it’s right, you see CORRECT and the reason, and its number turns to ✓. If not, you see NOT QUITE — TRY ANOTHER with the reason; pick again.',
      'There’s no score, and a wrong answer costs nothing. Use the tabs under the title to go to LEARN or EXPLORE.',
    ],
    changes: [
      'Answers already right stay right if you switch to LEARN or EXPLORE and come back. Leave the lab before the last one and the check starts over.',
      'Get all four right and the check is passed; the page says so. A pass is kept: you never need to take the check twice.',
    ],
    teaches: [
      'Where each harmonic sits relative to the fundamental, and how timbre comes from the balance between them.',
      'How overall level, phase and the harmonic recipe each affect what you hear.',
    ],
    tryThis: [
      'For the harmonic-position question, try another harmonic on EXPLORE: at F0 100 Hz, read the left label that starts with 2:, then compare it with F0.',
      'For the wave-building question, study a different recipe on EXPLORE: pick PRESET → TRIANGLE and note which stems are lit and how fast they fall (SLOPE).',
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
