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
 *   check   — CHECK YOUR UNDERSTANDING (understandingChecks.ts BINAURAL).
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
    seeing: [
      'Your head from above, facing FRONT 0° (up). BEHIND ±180° is at the bottom, +90° right, −90° left; rings mark each metre out to 4 m.',
      'Up to three speaker objects: 1 amber, 2 green, 3 blue. A dim one is OFF; the selected one has the thicker ring. At first only 1 is ON: pink noise at −60°, 1.5 m.',
      'Readouts for the selected object: OBJ, AZ (angle and direction), DIST and ITD (far-ear delay, µs).',
    ],
    control: [
      'Drag an object on the stage: its angle sets AZ, its distance from your head sets DIST. Grabbing one selects it.',
      'AZ fader (−180° to +180°, 0° = front) and DIST fader (0.5–4.0 m) move the selected object.',
      'OBJ key: SOUND OBJECTS — pick 1, 2 or 3; the ON/OFF chip switches the selected one. SRC key: SOURCE TYPE TONE, PINK or WHITE; TONE adds TONE FREQUENCY (Hz): 250, 440, 880 or 2000.',
      '▶ (top right) plays every object that is ON. Long-press a key or readout for its lesson entry; ⤢ FULL SCREEN enlarges the stage.',
      'LAB NOTES: 🎧 HEADPHONES REQUIRED, THE TWO CUES, THE MIX, HONESTLY, then two CHECK YOURSELF questions.',
    ],
    changes: [
      'The far ear hears the sound later (ITD): up to 656 µs at ±90°, for a head 17.5 cm across.',
      'Also quieter (a simple full-range drop, to −8 dB at the side) and darker: the head blocks highs (head shadow). THE TWO CUES shows both.',
      'A sphere is the same front and back: 30° and 150° read the same; behind only darkens a little.',
      'DIST sets level: half the distance, 6 dB louder, unless the cap turns the mix down.',
    ],
    teaches: [
      'How two ears place a sound: a time difference (ITD) and a level-and-tone difference (ILD, the head shadow).',
      'Why binaural needs headphones: on speakers each ear hears both channels and the cues mix in the air.',
      'Why front/back and up/down stay vague: those cues come from the outer ear (pinna), which this model leaves out.',
      'It follows Stereo Imaging, whose PAN changes level only; binaural adds time and shadow.',
    ],
    tryThis: [
      'Slide AZ to +90°: AZ reads +90° right and ITD 656 µs — the most a head this size gives. Back to 0°: ITD 0 µs, both ears at once.',
      'Set AZ to +30° (ITD 261 µs), then to +150°: ITD reads 261 µs again — the same cues front and back.',
      'With only object 1 on and ▶ playing, slide DIST to 0.5 m: THE MIX, HONESTLY shows Bus norm 0.79 — closer is louder, so the sum is turned down to stay under the cap.',
    ],
  },

  // ── LEARN — the reading page ──────────────────────────────────────────────
  learn: {
    seeing: [
      'The LEARN tab: this lab’s guided lesson as one page to read. Nothing here plays.',
      'First the two ear cues and the simplified head model. Then CONTROLS: the display, Azimuth, Distance, Source type, Sound objects and Tone frequency.',
      'Then COMMON MISTAKES, PRO TIPS and FORMULA / CONCEPT — the ITD formula, the ILD and the distance law.',
    ],
    control: [
      'Scroll to read. The tabs under the title switch between LEARN, EXPLORE and CHECK; EXPLORE is the live stage.',
      'On EXPLORE, ⓘ GUIDED LESSON at the end of LAB NOTES opens this same lesson as a sheet over the stage.',
      'On EXPLORE, long-press OBJ, SRC, AZ or DIST (key or readout) for its own entry; the ITD readout opens the display entry.',
    ],
    changes: [
      'Nothing on this page moves — it is the reference for what EXPLORE shows.',
      'The FORMULA’s ITD line is the maths behind the ITD readout: (r ÷ c)·(θ + sin θ), with r = 8.75 cm and θ in radians (45° = 0.785).',
      'Most COMMON MISTAKES are listening traps — speakers, a low sine, front/back — and why each one happens.',
    ],
    teaches: [
      'The words: ITD, ILD, head shadow, HRTF, crosstalk.',
      'The limits of a time-and-level model, so a vague front/back image is expected, not a fault.',
      'Why broadband noise is easier to place than a low, steady tone.',
    ],
    tryThis: [
      'Read the FORMULA line, then on EXPLORE set AZ to +45°: ITD reads 381 µs — (0.0875 ÷ 343) × (0.785 + 0.707) seconds.',
      'Read the PRO TIP about −90°, then on EXPLORE park object 1 at −90°, set SRC to TONE, pick 250 under TONE FREQUENCY (Hz), then switch to PINK: the readouts stay put — only the sound changes.',
    ],
  },

  // ── CHECK — the understanding check ───────────────────────────────────────
  check: {
    seeing: [
      'CHECK YOUR UNDERSTANDING and the lab’s title, then four questions: what ITD is, the head shadow, why headphones, and why no up or down.',
      'Each card: a question and its choices. A right answer turns green and its number becomes ✓; CORRECT or NOT QUITE — TRY ANOTHER heads the explanation.',
      'When all are right: Every question answered correctly — this lab is complete.',
    ],
    control: [
      'Tap a choice. A wrong one shows its explanation in amber — pick another straight away; nothing is lost and there is no score.',
      'A right one locks green and shows why. The choices are shuffled, so position never gives the answer away.',
      'Leaving this tab before every answer is right clears the answers — just answer them again.',
    ],
    changes: [
      'Every answer shows its explanation, right or wrong, so each question teaches.',
      'When the last one is right, the lab is marked complete. It counts toward any certificate or program that needs it — once.',
      'Come back later and the check shows as already cleared.',
    ],
    teaches: [
      'ITD: the far ear hears a sound slightly later.',
      'The head shadow: the far ear hears it quieter and darker.',
      'Why speakers scramble binaural cues, and why height needs the outer ear.',
    ],
    tryThis: [
      'Before starting, on EXPLORE slide AZ to +90°: ITD reads 656 µs — well under a thousandth of a second.',
      'Also before starting: watch THE TWO CUES in LAB NOTES while AZ goes from 0° to +60°: far-ear level 0.0 → −6.9 dB — the level half of the head-shadow cue.',
    ],
  },
};

/** The guide for a LabShell tab — LabShell's per-tab `guide` function. */
export function binauralScreenGuide(mode: string): ScreenGuide | undefined {
  return mode === 'explore' || mode === 'learn' || mode === 'check' ? BINAURAL_SCREEN_GUIDES[mode] : undefined;
}
