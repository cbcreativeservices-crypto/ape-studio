/**
 * Modular Synth Lab — "explain this screen" content (Screen Guide rollout,
 * 2026-10-31; standard = wave/waveScreenGuides.ts, LabShell pattern =
 * chainScreenGuides.ts).
 *
 * The lab is ONE LabShell screen with three tabs, so the guides are keyed by
 * the shell's tab id:
 *   explore — the rack: THE PATCH (the Eurorack case drawing), the PATCH /
 *             VCO / RES / LFO / SEQ bezel, the CUTOFF lane, the PATCH / VCO /
 *             MOD / SEQ trays, the header ▶, LAB NOTES (READING THE CASE,
 *             THE VOICE, AS SOUND, two CHECK YOURSELF questions, FINISH · SEE
 *             WHAT’S LEFT ›);
 *   learn   — the reading page (the guided lesson in full);
 *   check   — LabShell's CHECK tab (the four Modular questions in
 *             understandingChecks.ts) with the lab's FINISH link under it.
 * The what's-left layer ("Where you are") is its own modal with its own
 * header and no ⓘ, so it has no guide here.
 *
 * Every name is the on-screen name in ModularLabScreen.tsx / ModularSpectrum
 * (bezel keys + values, dock labels, tray chips, module names, the case's
 * group labels). Every number in TRY THIS is what the screen draws, worked
 * out from the lab's own formulas (spectrumMath.ts — the engine's filter,
 * Modular.hpp kDamp = 2 − 1.6·res):
 *   SINE (110 Hz) at CUTOFF 8.0 kHz → 0.0 dB; at 250 Hz → −1.5 dB
 *   the filter curve at the CUTOFF line: RES 0 → −6.0 dB, RES MAX → +8.0 dB
 *   WOBBLE → LFO →CUT, cable LFO → VCF; MOD →PITCH → LFO →PIT, cable LFO →
 *     VCO, PATCH CUSTOM
 *   ACID BASS → RES MAX, SEQ 8/s, an ENV → VCF cable
 * test/screenGuide_modular_20261031.test.ts re-runs every one of them.
 *
 * STEPPED: each section must fit SCREEN_GUIDE_BUDGET (types.ts).
 * Copy rules: plain language, short sentences; KNOWLEDGE, never skills; no
 * gear brand names; no "N of total"; "suggest" never "recommend"; no build
 * notes in learner text. The CHECK guide never gives away an answer.
 */
import type { ScreenGuide } from '../../../features/lab/screenGuide/types';

/** The LabShell tabs this lab offers. */
export type ModularScreenId = 'explore' | 'learn' | 'check';

export const MODULAR_SCREEN_GUIDES: Record<ModularScreenId, ScreenGuide> = {
  // ── EXPLORE — the rack ────────────────────────────────────────────────────
  explore: {
    intro: {
      learning: 'How a subtractive synth voice works: the VCO makes a bright wave, the VCF carves harmonics away, the VCA sets loudness, and control cables decide what moves what.',
      start: 'Tap ▶ to hear the drone, then drag CUTOFF down and hear it darken. Next tap PATCH → WOBBLE and watch a blue LFO cable run to the VCF.',
    },
    seeing: [
      'THE PATCH: seven modules. CONTROL SOURCES (CV): SEQ, LFO, ENV. AUDIO PATH → OUT: VCO, VCF, VCA, OUT.',
      'Amber cables carry sound; a cable in its source’s color (SEQ red, LFO blue, ENV green) carries control. When it runs, the ENV light shows the envelope; the lit SEQ step is sounding.',
      'LAB NOTES › THE VOICE, AS SOUND: the 110 Hz note’s harmonics as bars under the filter’s dashed curve. Gray bars: filtered out.',
    ],
    control: [
      '▶ in the header plays the drone (SEQ off) or runs the sequence (SEQ on); ■ stops it. The CUTOFF fader sets the filter’s cutoff, 250 Hz to 8.0 kHz.',
      'PATCH picks RAW DRONE, ACID BASS, WOBBLE, VIBRATO LEAD or TREMOLO, each with its reason. VCO picks SAW, SQUARE, TRI or SINE.',
      'The readouts echo the keys: PATCH (or CUSTOM), VCO, RES, LFO (route or OFF), SEQ (rate or OFF).',
      'MOD: RES 0 / ½ / MAX. Envelope PLUCK, PAD or ORGAN, with ENV→VCF OFF, +50% or +100%. LFO 0.5, 2 or 6 Hz, DEPTH 0 / ½ / MAX, sent OFF, →PITCH, →CUTOFF or →AMP.',
      'SEQ: SEQ ON/OFF, 2/s, 4/s or 8/s, and eight steps (tap to cycle, ✕ = rest). Tap a module, or long-press a key, for its lesson entry.',
    ],
    changes: [
      'The VCF is a low-pass: lower CUTOFF removes harmonics from the top, so the tone darkens. RES boosts right at the cutoff.',
      'The envelope always opens the VCA (loudness); ENV→VCF sweeps the cutoff too.',
      'One LFO, three effects: pitch = vibrato, cutoff = wobble, amp = tremolo. It works only with DEPTH above 0 and a destination; look for its cable.',
      'SEQ retunes the VCO and retriggers the envelope each step.',
    ],
    teaches: [
      'Subtractive synthesis: start with a bright wave, then carve harmonics away with a filter.',
      'Audio and control are different signals: a CV cable makes no sound; it turns a setting for you.',
      'Most classic synth sounds are a routing choice: what modulates what.',
      'A filter can only remove what is there: a sine has no harmonics above its note.',
    ],
    tryThis: [
      'Tap ▶, pick VCO SINE and drag CUTOFF from 8.0 kHz to 250 Hz: the one bar in THE VOICE, AS SOUND (LAB NOTES) drops only about 1.5 dB. On SAW, the filtered bars go gray.',
      'In MOD tap RES MAX: in THE VOICE, AS SOUND the dashed filter curve now peaks about 8 dB above 0 dB at the CUTOFF line. At RES 0 it sits 6 dB below.',
      'Tap PATCH → WOBBLE: LFO reads →CUT and a blue cable runs to the VCF. In MOD tap →PITCH: the cable moves to the VCO, LFO reads →PIT and PATCH reads CUSTOM.',
    ],
  },

  // ── LEARN — the reading page ──────────────────────────────────────────────
  learn: {
    intro: {
      learning: 'The vocabulary of a synth voice (VCO, VCF, VCA, ADSR, LFO, CV, cutoff, resonance) and why one LFO can give vibrato, a wobble or tremolo.',
      start: 'Scroll to COMMON MISTAKES and read the line on filtering a sine. Then switch to EXPLORE, pick VCO SINE, tap ▶ and ride CUTOFF to hear it.',
    },
    seeing: [
      'This is the guided lesson for this lab, as one page to read. Nothing here plays.',
      'First, what the voice is. Then CONTROLS: the display, VCO, VCF, ENV, LFO, SEQ, VCA, OUT, and the five patches from RAW DRONE to TREMOLO.',
      'Then COMMON MISTAKES, PRO TIPS and FORMULA / CONCEPT: the signal path and the modulation routes, one line each.',
    ],
    control: [
      'Scroll to read. The tabs under the title switch between LEARN, EXPLORE and CHECK.',
      'On EXPLORE, ⓘ GUIDED LESSON at the end of LAB NOTES opens this same lesson as a sheet over the rack.',
      'On EXPLORE, tap a module in the case, long-press a dock key or a readout, or tap the ⓘ on the readout strip, to open just that entry.',
    ],
    changes: [
      'Read this beside EXPLORE: each module entry here is a module in THE PATCH.',
      'Each patch entry says which routing makes that sound, and why.',
      'Several COMMON MISTAKES lines mix up what a signal does: a filter on a sine, the loudness envelope taken for the filter envelope, an LFO on the wrong destination.',
    ],
    teaches: [
      'The words of a synth voice: VCO, VCF, VCA, ADSR, LFO, sequencer, CV, cutoff, resonance.',
      'Why the same LFO gives vibrato, a wobble or tremolo.',
      'Why the envelope shapes loudness through the VCA, and brightness too only when it is routed to the VCF.',
    ],
    tryThis: [
      'Read the COMMON MISTAKES line on filtering a sine, then on EXPLORE pick VCO SINE, tap ▶ and ride CUTOFF: the tone hardly changes.',
      'Read the PRO TIPS line on building a bass, then on EXPLORE tap PATCH → ACID BASS and ▶: RES reads MAX, SEQ 8/s, and a green cable runs from ENV to the VCF.',
    ],
  },

  // ── CHECK — LabShell's understanding check + the FINISH link ──────────────
  check: {
    intro: {
      learning: 'A review of the synth voice: what a filter needs to work on, where an LFO can go, how brightness can follow a note, and the audio path’s order.',
      start: 'Read each question and tap an answer. If one stumps you, switch to LEARN and reread that idea, then come back.',
    },
    seeing: [
      'CHECK YOUR UNDERSTANDING for this lab: four questions on a filtered sine, an LFO moved, a note that starts bright and darkens, and the order of the audio path.',
      'Above them, you see how many are still to get right; a ✓ replaces a question’s number once it is right.',
      'Below them, FINISH · SEE WHAT’S LEFT › opens Where you are: the check’s status and the way back to labs.',
    ],
    control: [
      'Tap an answer. A wrong one stays open: pick again straight away. Nothing is lost and there is no score.',
      'A right answer locks in, and its explanation stays to read.',
      'Use the tabs under the title to go back to LEARN or EXPLORE to look something up; answers already right stay right. If you leave the lab before the last one, the check starts over.',
    ],
    changes: [
      'Every answer opens its explanation — CORRECT, or NOT QUITE — TRY ANOTHER — with the reason.',
      'Get all four right and the check is passed.',
      'A pass is kept: the questions show as done, and you never need to take the check twice.',
    ],
    teaches: [
      'A synth voice carries two kinds of signal: sound along the audio path, and control that turns settings along the way.',
      'Where you route a control source decides what you hear change: pitch, brightness or loudness.',
    ],
    tryThis: [
      'Unsure about the audio order? Switch to LEARN and reread FORMULA / CONCEPT, then come back and answer.',
      'Unsure about LFO destinations? Switch to LEARN and reread the LFO entry under CONTROLS, then come back.',
    ],
  },
};

/** The guide for a LabShell tab — LabShell's per-tab `guide` function. */
export function modularScreenGuide(mode: string): ScreenGuide | undefined {
  return mode === 'explore' || mode === 'learn' || mode === 'check' ? MODULAR_SCREEN_GUIDES[mode] : undefined;
}
