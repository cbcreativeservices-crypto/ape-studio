/**
 * Binaural Panner Lab — "explain this screen" content (Screen Guide rollout,
 * 2026-10-31; standard = wave/waveScreenGuides.ts).
 *
 * The lab is ONE LabShell screen (BinauralLabScreen.tsx) with three tabs, so
 * the guides are keyed by the shell's tab id:
 *   explore — the rack: the overhead stage (head, rings, up to three speaker
 *             objects), the OBJ / AZ / DIST / ITD readouts, the AZ and DIST
 *             faders, the OBJ and SRC trays, LAB NOTES (🎧 HEADPHONES
 *             REQUIRED, THE TWO CUES, THE MIX, HONESTLY, two CHECK YOURSELF);
 *   learn   — the reading page (the guided lesson 'binaural' in full);
 *   check   — CHECK YOUR UNDERSTANDING (understandingChecks.ts BINAURAL),
 *             ending on FINISH · SEE WHAT'S LEFT › (BINAURAL_END_GUIDE).
 *
 * Every name is the on-screen name in BinauralLabScreen.tsx, LabShell.tsx,
 * RackUnit.tsx and LabUnderstandingCheck.tsx.
 *
 * Every number in TRY THIS is what the screen prints, from its own display
 * mirrors of the native model (Binaural.hpp):
 *   ITD (µs) = (0.0875 ÷ 343)·(θ + sin θ)·10⁶, θ = |AZ| folded to the front
 *     → 0 at 0°, 261 at ±30° and ±150°, 381 at ±45°, 488 at ±60°, 656 at ±90°;
 *   far-ear level = −8·sin θ dB → −8.0 at ±90°, −6.9 at ±60°;
 *   Bus norm = 1 ÷ max(1, Σ(level ÷ dist) ÷ cap), level −16 dBFS, cap −12
 *     dBFS → one object at 0.5 m: 0.79 (at the default 1.5 m: 1, no line).
 * The test re-runs them.
 *
 * STEPPED: each section must fit SCREEN_GUIDE_BUDGET (types.ts).
 * Copy rules: plain language, short sentences; KNOWLEDGE, never skills; no
 * gear brand names; no "N of total"; "suggest" never "recommend"; no build
 * notes in learner text. test/screenGuide_binaural_20261031.test.ts pins it.
 */
import type { ScreenGuide } from '../../features/lab/screenGuide/types';

/** The LabShell tabs this lab offers (it has an understanding check). */
export type BinauralScreenId = 'explore' | 'learn' | 'check';

export const BINAURAL_SCREEN_GUIDES: Record<BinauralScreenId, ScreenGuide> = {
  // ── EXPLORE — the stage ───────────────────────────────────────────────────
  explore: {
    intro: {
      learning: 'How two ears place a sound left or right: the far ear hears it later (ITD) and quieter and darker (the head shadow), and why front and back stay vague.',
      start: 'Put on headphones and tap ▶. Slide AZ from 0° to +90° and watch ITD climb to 656 µs. Then drag object 1 toward your head and hear it get louder.',
    },
    seeing: [
      'You’re looking down on your head, facing FRONT 0° (up). BEHIND ±180° is at the bottom, +90° right, −90° left. Rings mark each meter out to 4 m.',
      'Up to three speaker objects: 1 amber, 2 green, 3 blue. A dim one is OFF; the selected one has the thicker ring. At first only 1 is ON: pink noise at −60°, 1.5 m.',
      'OBJ, AZ, DIST and ITD describe the selected object. ITD is how much later the far ear hears it, in µs.',
    ],
    control: [
      'Drag an object on the stage: its angle sets AZ, its distance from your head sets DIST. Grabbing one selects it.',
      'The AZ fader (−180° to +180°, 0° = front) and the DIST fader (0.5–4.0 m) move the selected object.',
      'OBJ opens SOUND OBJECTS: pick 1, 2 or 3; the ON/OFF chip switches the selected one. SRC opens SOURCE TYPE: TONE, PINK or WHITE; TONE adds TONE FREQUENCY (Hz): 250, 440, 880 or 2000.',
      '▶ (top right) plays every object that is ON. Long-press a key or readout for its lesson entry; ⤢ FULL SCREEN enlarges the stage.',
      'LAB NOTES: 🎧 HEADPHONES REQUIRED, THE TWO CUES, THE MIX, HONESTLY, then two CHECK YOURSELF questions.',
    ],
    changes: [
      'The far ear hears the sound later (ITD): up to 656 µs at ±90°, for a head 17.5 cm across.',
      'It also hears it quieter (the same at all frequencies, to −8 dB at the side) and darker: the head blocks highs. THE TWO CUES shows both.',
      'A round head is the same front and back: 30° and 150° read alike; behind only darkens a little.',
      'DIST sets level: half the distance, 6 dB louder, unless the cap turns the mix down.',
    ],
    teaches: [
      'How two ears place a sound: a time difference (ITD) and a level-and-tone difference (ILD, the head shadow).',
      'Why binaural needs headphones: on speakers each ear hears both channels and the cues mix in the air.',
      'Why front/back and up/down stay vague: those cues come from the outer ear (pinna), which time and level alone can’t give.',
      'A stereo PAN changes level only; binaural adds time and shadow.',
    ],
    tryThis: [
      'Slide AZ to +90°: AZ reads +90° right and ITD 656 µs, the most a head this size gives. Back to 0°: ITD 0 µs, both ears at once.',
      'Set AZ to +30° (ITD 261 µs), then to +150°: ITD reads 261 µs again. The time cue is the same in front and behind.',
      'With only object 1 on and ▶ playing, slide DIST to 0.5 m: THE MIX, HONESTLY shows Bus norm 0.79. Closer is louder, so the sum is turned down to stay under the cap.',
    ],
  },

  // ── LEARN — the reading page ──────────────────────────────────────────────
  learn: {
    intro: {
      learning: 'The ideas behind EXPLORE: ITD and ILD ear cues, why time and level alone leave front and back vague, and why noise is easier to place than a low tone.',
      start: 'Read the two ear cues first. Then find the ITD line under FORMULA / CONCEPT, and on EXPLORE set AZ to +45° to see ITD read 381 µs.',
    },
    seeing: [
      'This is the LEARN tab: this lab’s lesson on one page to read. ▶ in the header still plays the objects set on EXPLORE.',
      'First the two ear cues and the simple head model behind them. Then CONTROLS: the display, AZ, DIST, SRC, OBJ and TONE FREQUENCY (Hz).',
      'Then COMMON MISTAKES, PRO TIPS and FORMULA / CONCEPT: the ITD formula, the ILD and the distance law.',
    ],
    control: [
      'Scroll to read. The tabs under the title switch between LEARN, EXPLORE and CHECK; on EXPLORE you hear each idea on the live stage.',
      'On EXPLORE, ⓘ GUIDED LESSON at the end of LAB NOTES opens this same lesson as a sheet over the stage.',
      'On EXPLORE, long-press OBJ, SRC, AZ or DIST (key or readout) for its own entry; the ITD readout opens the display entry.',
    ],
    changes: [
      'Nothing on this page moves: it’s your reference for what EXPLORE shows.',
      'The FORMULA’s ITD line is the math behind the ITD readout: (r ÷ c)·(θ + sin θ), with r = 8.75 cm, c = 343 m/s and θ in radians (45° = 0.785).',
      'Most COMMON MISTAKES are listening traps (speakers, a low sine, front/back) and say why each one happens.',
    ],
    teaches: [
      'What ITD, ILD, head shadow, HRTF (how head and outer ear filter sound) and crosstalk (each ear hearing both speakers) mean.',
      'The limits of a time-and-level model: a vague front/back image is expected, not a fault.',
      'Why broadband noise is easier to place than a low, steady tone.',
    ],
    tryThis: [
      'Read the FORMULA line. Then on EXPLORE, set AZ to +45°: ITD reads 381 µs, which is (0.0875 ÷ 343) × (0.785 + 0.707) seconds.',
      'Read the PRO TIP about −90°. On EXPLORE, park object 1 at −90°, set SRC to TONE and pick 250 under TONE FREQUENCY (Hz). Then switch to PINK: same readouts, but the noise is easier to place.',
    ],
  },

  // ── CHECK — the understanding check ───────────────────────────────────────
  check: {
    intro: {
      learning: 'Review: what ITD is, what the head shadow does to the far ear, why binaural needs headphones, and why this lab can’t place sounds above or below you.',
      start: 'Tap the choice you think is right on each card. Want to test an idea first? Reread the two ear cues at the top of LEARN, then come back.',
    },
    seeing: [
      'CHECK YOUR UNDERSTANDING and the lab’s title, then four questions: what ITD is, the head shadow, why headphones, and why no up or down.',
      'Each card has a question and its choices. A right answer turns green and its number becomes ✓; CORRECT or NOT QUITE — TRY ANOTHER heads the explanation.',
      'When all are right: Every question answered correctly — this lab is complete.',
    ],
    control: [
      'Tap a choice. A wrong one shows its explanation in amber; pick another straight away. Nothing is lost and there is no score.',
      'A right one locks green and shows why. The choices are shuffled, so position never gives the answer away.',
      'Answers already right stay right if you switch to LEARN or EXPLORE and come back. If you leave the lab before the last one, the check starts over.',
      'Below the questions, FINISH · SEE WHAT’S LEFT › opens Where you are: what’s left in this lab, and the way back to labs.',
    ],
    changes: [
      'Every answer shows its explanation, right or wrong, so each question teaches you something.',
      'Get all four right and the lab is complete.',
      'A pass is kept: come back later and the check shows as already cleared.',
    ],
    teaches: [
      'What ITD is, and how large the time gap between your ears can get.',
      'What the head shadow does to the sound that reaches your far ear.',
      'Why speakers scramble binaural cues, and where up-and-down cues come from.',
    ],
    tryThis: [
      'Unsure about ITD? On EXPLORE, set AZ to +30° and read ITD: 261 µs. Long-press the ITD readout for its entry.',
      'Unsure about the head shadow? On LEARN, reread the two ear cues at the top of the lesson, then come back to this card.',
    ],
  },
};


/** The what's-left screen (LabShell's LabCheckEnd, passed as `checkEnd`):
 *  FINISH · SEE WHAT'S LEFT › under the CHECK opens it as a full-screen layer
 *  over BinauralLabScreen. Every line is true of kit/LabEndScreen in "credit" mode
 *  with the lab's one unit, the understanding check: the row and PRACTICE
 *  AGAIN close the layer (nothing is cleared), DONE · BACK TO LABS leaves. */
export const BINAURAL_END_GUIDE: ScreenGuide = {
  intro: {
    learning: 'Where you stand in the Binaural Panner lab: whether the check is passed, what is left, and how to get back to the stage to keep listening.',
    start: 'Read WHAT’S LEFT. If the check’s row is still there, tap it to go back to CHECK. Otherwise tap ‹ BACK TO THE LAB and keep exploring.',
  },
  seeing: [
    'Under Where you are: the lab’s name, then WHAT’S LEFT, or LAB COMPLETE once you pass the check. If your saved progress can’t be read, it says YOUR PROGRESS.',
    'While the check is still to do, one row shows: CHECK · Understanding check. Once passed, it folds into a ✓ CREDITED line (✓ DONE when you’re not signed in); REVIEW ▾ shows it.',
    'The line under the title says what’s left and whether your work is saved.',
  ],
  control: [
    '‹ BACK TO THE LAB, or the check’s row, closes this screen and takes you back to the lab exactly as you left it.',
    'PRACTICE AGAIN FROM THE START also returns to the lab; it clears nothing.',
    'DONE · BACK TO LABS leaves the lab.',
  ],
  changes: [
    'The check counts once every answer is right. If you’re signed in, it’s saved to your account once, and you never take it twice.',
    'If you’re signed out, the line under the title says whether signing in can still keep it. Practicing again never takes it away.',
  ],
  teaches: [
    'Two ear cues place a sound left or right. On EXPLORE, the ITD readout and THE TWO CUES in LAB NOTES show both.',
    'Why this lab needs headphones, and what a time-and-level head model leaves out. Test both on EXPLORE at any time.',
  ],
  tryThis: [
    'If the check is still listed, tap its row to go back to CHECK. Answer all four, then FINISH · SEE WHAT’S LEFT › shows LAB COMPLETE.',
    'Once it’s passed, tap ‹ BACK TO THE LAB and slide AZ to +90° on EXPLORE again: ITD reads 656 µs.',
  ],
};

/** The guide for a LabShell tab — LabShell's per-tab `guide` function. */
export function binauralScreenGuide(mode: string): ScreenGuide | undefined {
  return mode === 'explore' || mode === 'learn' || mode === 'check' ? BINAURAL_SCREEN_GUIDES[mode] : undefined;
}
