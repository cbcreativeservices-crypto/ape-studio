/**
 * THE WOODWIND FAMILY'S SHARED CHECKS — items that read the same on a
 * flute, a clarinet, an oboe or a bassoon, with the instrument's own words
 * dropped in. Each lesson adds its instrument-specific items (lesson.ts);
 * the generic two-mic and pattern items are the bowed family's (one copy of
 * each, shared/bowed/bowedItems.ts).
 *
 * Item-writing rules (LESSON_JOURNEY §5; test/mikingItemBalance.test.ts):
 * the correct option is never more than 1.25 × the others' mean length and
 * rarely the longest; wrong options are real misconceptions without
 * "always / any / never / every"; no brand or model; every wrong option has
 * its own explanation; reasoning, not the recall of a number. Starting-points
 * voice (owner ruling 2026-10-04): no sources on screen.
 */
import type { DiagnosticItem, MikingScenario, SourcePageId, Symptom } from '../../../engine/model/types.ts';
import { micRatingCheck } from '../../../engine/model/sharedItems.ts';

export type WindWords = {
  /** "clarinet" */
  noun: string;
  /** "clarinettist" */
  player: string;
  /** "the bell" / "the foot" */
  end: string;
  /** "the reed" / "the embouchure hole" */
  exciter: string;
  /** What moves near the instrument: "the hands, the keys and the bell’s swing". */
  moving: string;
};

/* ── HOW IT SOUNDS ── */

export const firstHoleCheck = (id: string, w: WindWords, page: SourcePageId = 'sound'): MikingScenario => {
  const end = `From ${w.end} at the end, whatever note the fingers choose`;
  const ex = `From ${w.exciter} end, where each note’s sound starts`;
  const key = 'At the first open hole, which moves up with pitch';
  return {
    id,
    page,
    prompt: `The player climbs a scale. Where does most of each note’s sound leave the ${w.noun}?`,
    options: [ex, key, end],
    correct: key,
    explain: `The air column sounds as if the tube ended just past the first open hole, so that is where most of the note leaves — and each note up opens a hole nearer the end the player blows into. With every hole closed (the lowest note), it leaves from ${w.end}.`,
    why: {
      [end]: `Only the lowest note, with every hole closed, comes mainly from ${w.end}. Open a hole and the sound leaves there.`,
      [ex]: `${w.exciter.replace(/^the /, 'The ')} starts the vibration; the sound leaves where the air column meets the open air — the open holes and ${w.end}.`,
    },
  };
};

export const bellOnlyCheck = (id: string, w: WindWords, page: SourcePageId = 'sound'): MikingScenario => {
  const key = `Each note leaves from a different place along it`;
  const a = `${w.end.replace(/^the /, 'The ')} filters out the high notes on their way`;
  const b = `The mic is too far from the ${w.noun} to hear it`;
  return {
    id,
    page,
    prompt: `Why can one mic aimed only at ${w.end} make some notes boom and others thin out?`,
    options: [a, key, b],
    correct: key,
    explain: `The lowest notes leave mainly from ${w.end}; most others leave from open holes up the body, and their sound changes with the fingering. A mic that sees only ${w.end} favours a few notes. Aim at the hole field, or back off so the parts blend.`,
    why: {
      [a]: `${w.end.replace(/^the /, 'The ')} filters nothing out: most notes simply leave earlier, from the open holes.`,
      [b]: 'Distance changes the level and the blend, not which notes come from where.',
    },
  };
};

/* ── THE SETTING ── */

export const hearingCheck = (id: string, w: WindWords): MikingScenario => micRatingCheck({ id, page: 'setting', mic: `${w.noun} mic`, loudest: `the loudest ${w.noun} passage` });

export const hearingDiag = (id: string, w: WindWords): DiagnosticItem => {
  const key = 'Nothing — it is the mic’s distortion limit, not a hearing one';
  const a = 'It is safe while the stage stays below the mic’s rating';
  const b = 'It is safe as long as the mic is closer to the sound than you';
  return {
    id,
    covers: 'setting',
    critical: true,
    prompt: `Your ${w.noun} mic is rated to a very high maximum SPL. What does that tell you about a long, loud rehearsal?`,
    options: [a, b, key],
    correct: key,
    explain: 'Max SPL says when the MIC distorts. For people, a widely used guideline is no more than 85 dBA averaged over 8 hours, halving the time for every 3 dBA more — measured where the person listens.',
    why: {
      [a]: 'A mic’s rating is not a hearing limit. A widely used guideline for people is 85 dBA averaged over 8 hours.',
      [b]: 'Where the mic sits says nothing about your ears. Measure where the person listens, and keep levels and time down.',
    },
  };
};

/* ── TROUBLESHOOT: the woodwind symptoms ── */

export const bellBoomSymptom = (id: string, w: WindWords): Symptom => {
  const key = `Aim toward the holes, or a little farther back`;
  const a = 'Cut the low frequencies until the boom is gone';
  const b = 'Ask the player to play the low notes more softly';
  return {
    id,
    observation: 'Low notes boom while the others disappear',
    firstChecks: `Is the mic pointed mainly into ${w.end}? Aim toward the hole field, or add a little distance, and play the whole range.`,
    options: [a, key, b],
    correct: key,
    explain: `The lowest notes leave mainly from ${w.end}; the rest from the open holes. A mic that sees only ${w.end} favours the low notes. Re-aim or back off, then replay the full phrase.`,
    why: {
      [a]: 'EQ thins every note to fix a placement problem. Re-aim first.',
      [b]: 'The player’s dynamics are the music. The mic’s view is yours to change.',
    },
  };
};

export const keyNoiseSymptom = (id: string, w: WindWords): Symptom => {
  const key = 'Back off or change the angle, then replay';
  const a = 'Ask the player to finger the passage more gently';
  const b = 'Add a high-frequency cut until the clicks are gone';
  return {
    id,
    observation: 'Key clicks and pads are louder than the tone',
    firstChecks: `Is the capsule very close to the ${w.noun}’s keywork or the fingers? Move it back or turn it, keeping the holes in view.`,
    options: [a, b, key],
    correct: key,
    explain: 'Very close to the mechanism, a mic hears the keys almost as loud as the notes. A little more distance, or a different angle, keeps the holes in view while the clicks fall back.',
    why: {
      [a]: 'Keys move as fast as the music needs. The mic’s distance is the thing to change.',
      [b]: 'A cut dulls the instrument along with the clicks. Move the mic first.',
    },
  };
};

export const colourSymptom = (id: string, w: WindWords): Symptom => {
  const key = 'More distance or a broader aim, then the full range';
  const a = 'A narrower pattern, aimed more tightly at one single hole';
  const b = 'Compress the channel so the notes match in level';
  return {
    id,
    observation: 'Notes change colour sharply from one to the next',
    firstChecks: `Is the mic focused on one hole, ${w.end} or a narrow angle? Compare a little more distance or a broader aim through the whole range.`,
    options: [key, a, b],
    correct: key,
    explain: `The place each note leaves from moves with the fingering. Very close, or very narrow, the mic hears one spot at a time; a little distance lets the ${w.noun}’s outlets blend.`,
    why: {
      [a]: 'A tighter aim hears even less of the instrument at once — the colour jumps more.',
      [b]: 'Compression evens the level, not the colour. Fix the view.',
    },
  };
};

export const filterSymptom = (id: string, w: WindWords): Symptom => {
  const key = 'Play the lowest notes and lower or bypass the filter';
  const a = 'Boost the lows back again with a shelf on the channel';
  const b = 'Move the mic much closer to bring the lows back';
  return {
    id,
    observation: 'The low register disappears after filtering',
    firstChecks: `Was the high-pass filter set without hearing the ${w.noun}’s lowest required notes? Recheck them and lower or bypass it.`,
    options: [b, a, key],
    correct: key,
    explain: `A high-pass filter removes rumble — and the ${w.noun}’s low notes with it if it is set too high. Set it while the lowest note of the actual part plays; no fixed number suits every instrument.`,
    why: {
      [a]: 'A boost after a cut fights the filter. Set the filter right in the first place.',
      [b]: 'Closer changes the balance and adds proximity effect; the filter is still removing the notes.',
    },
  };
};

export const clipThreatSymptom = (id: string, w: WindWords): Symptom => {
  const key = 'Stop, remove it with the player, and use a stand';
  const a = 'Tighten the clip so it cannot slip again';
  const b = 'Tape the cable to the body to hold the clip still';
  return {
    id,
    observation: `A clip presses on the ${w.noun} or gets in the fingers’ way`,
    firstChecks: 'Is the fit, a joint, a pad, a rod, the finish or the finger path unchecked? Stop, take it off with the player, and use a stand if the fit is uncertain.',
    options: [a, key, b],
    correct: key,
    explain: `Only a clip made for this ${w.noun}, fitted with the player’s agreement, clear of every hole, key, rod, pad and joint. If the fit is in doubt, a stand mic is the safe choice.`,
    why: {
      [a]: 'More pressure on a wooden body or a joint risks the instrument. Stop instead.',
      [b]: 'Tape on the finish or the keys is never a fix. Remove the clip and use a stand.',
    },
  };
};

export { feedbackSymptom, gainCheck, hollowSymptom, matchedLevels, nullOnPaper, polarityDelay, removeDelay, superNull, BRAND_REASON, LOUD_REASON, POWER_REASON, clearReason, docReason } from '../bowed/bowedItems.ts';
