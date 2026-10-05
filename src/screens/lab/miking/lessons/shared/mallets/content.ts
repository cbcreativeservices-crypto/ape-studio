/**
 * MALLET-BAR FAMILY — words, checks and setups the four mallet lessons share
 * (I07–I10). Each lesson's text says the same thing about these ideas — the
 * two-mic geometry, a mic's maximum SPL is not a hearing limit, the mono sum
 * of a spaced pair — so they are written once with the instrument's words
 * passed in; every lesson still writes its own instrument checks.
 *
 * Item rules (LESSON_JOURNEY §5, test/_mikingItemRules.ts): the right option
 * is never conspicuously longer, wrong options are real misconceptions with
 * their own "why", no absolute-word giveaways in a distractor. Starting-points
 * voice; no source, brand or model names (owner ruling 2026-10-04).
 */
import type { DiagnosticItem, MikingScenario, PageId, Symptom, Vec3, VariantId, Wedge } from '../../../engine/model/types.ts';
import type { LessonCopy } from '../../../engine/model/copy.ts';
import { micRatingCheck } from '../../../engine/model/sharedItems.ts';
import type { PairPreset } from './family.ts';
import { malletGeom, SHURE_H, SHURE_SPACING, type MalletFamily } from './malletModel.ts';

export type MW = {
  /** id prefix ("vb", "mr", "xy", "gl") */
  p: string;
  /** "the vibraphone" */
  the: string;
  /** "vibraphone" */
  noun: string;
  /** "vibraphonist" / "player" */
  player: string;
  /** "the hardest accent" */
  loudest: string;
};

/** POSITION's words (the family frame: x toward the low end, z toward the audience). */
export function malletAxes(fam: MalletFamily): LessonCopy['axes'] {
  const G = malletGeom(fam);
  const origin: Partial<Record<VariantId, Vec3>> = {};
  for (const v of fam.variants) origin[v.row.id] = { x: 0, y: G.barY, z: 0 };
  return {
    x: { plus: 'toward the low end', minus: 'toward the high end', label: 'ALONG', blurb: 'Along the keyboard, toward the low or the high end (x). Read from the middle.' },
    y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y). Read from the bars, not the floor.' },
    z: { plus: 'toward the audience', minus: 'toward the player', label: 'FRONT–BACK', blurb: 'Toward the audience or toward the player (z). Read from the middle of the two rows.' },
    origin,
  };
}

/** The two-mic setups the research gives for xylophone, marimba and
 *  vibraphone: spaced 2 ft apart, or grilles together at 135° — both about
 *  1½ ft above the bars, aimed down (S-LIVE / S-RECBK). */
export function shurePairs(typeId: string, barY: number, wide?: { spacing: number; height: number }): PairPreset[] {
  const yS = barY - SHURE_H;
  const half = SHURE_SPACING / 2;
  const out: PairPreset[] = [
    {
      id: 'spaced',
      label: 'SPACED PAIR — about 61 cm (2 ft) apart',
      short: 'SPACED',
      blurb: 'Two mics about 46 cm (1½ ft) above the bars, about 61 cm (2 ft) apart along the keyboard, both aimed down: one leans to the high notes, one to the low.',
      coincident: false,
      typeId,
      pattern: 'cardioid',
      A: { p: { x: -half, y: yS, z: 0 }, az: 0, el: -90 },
      B: { p: { x: half, y: yS, z: 0 }, az: 0, el: -90 },
    },
    {
      id: 'xy',
      label: 'COINCIDENT PAIR — grilles together, 135° apart',
      short: 'COINCIDENT',
      blurb: 'Two mics with their grilles together about 46 cm (1½ ft) above the middle, angled 135° apart — one toward the high end, one toward the low — the pair looking down.',
      coincident: true,
      typeId,
      pattern: 'cardioid',
      // Each 67.5° from straight down: 22.5° below level, toward its end.
      A: { p: { x: 0, y: yS, z: 0 }, az: 0, el: -22.5 },
      B: { p: { x: 0, y: yS, z: 0 }, az: 180, el: -22.5 },
    },
  ];
  if (wide) {
    out.push({
      id: 'wide',
      label: 'WIDER SPACED PAIR — to try on a long keyboard',
      short: 'WIDER',
      blurb: `An idea to try when the part covers the whole keyboard: the spaced pair widened to about ${Math.round(wide.spacing / 10)} cm and raised to about ${Math.round(wide.height / 10)} cm above the bars. Check the middle for a hole, and the mono sum.`,
      coincident: false,
      typeId,
      pattern: 'cardioid',
      A: { p: { x: -wide.spacing / 2, y: barY - wide.height, z: 0 }, az: 0, el: -90 },
      B: { p: { x: wide.spacing / 2, y: barY - wide.height, z: 0 }, az: 0, el: -90 },
    });
  }
  return out;
}

/** The glockenspiel's two ideas (no published two-mic dimension): a
 *  near-coincident pair and a spaced pair, at drawing-default sizes. */
export function glockPairs(typeId: string, barY: number): PairPreset[] {
  const h = 450;
  return [
    {
      id: 'near',
      label: 'NEAR-COINCIDENT PAIR — close together, angled apart',
      short: 'NEAR-COINC.',
      blurb: 'Two mics about 17 cm apart, angled about 110° apart, about 45 cm above the middle of the bars — a stable picture and a reliable mono sum. The sizes are a drawing default, not a rule.',
      coincident: false,
      typeId,
      pattern: 'cardioid',
      A: { p: { x: -85, y: barY - h, z: 0 }, az: 0, el: -35 },
      B: { p: { x: 85, y: barY - h, z: 0 }, az: 180, el: -35 },
    },
    {
      id: 'spaced',
      label: 'SPACED PAIR — over the low and the high notes',
      short: 'SPACED',
      blurb: 'Two mics about 45 cm above the bars and about 40 cm apart, both aimed down: more separate control of low and high, but notes both mics hear can change colour in mono. The sizes are a drawing default.',
      coincident: false,
      typeId,
      pattern: 'cardioid',
      A: { p: { x: -200, y: barY - h, z: 0 }, az: 0, el: -90 },
      B: { p: { x: 200, y: barY - h, z: 0 }, az: 0, el: -90 },
    },
  ];
}

/** The two monitors (positions ILLUSTRATIVE): a wedge in front of the
 *  player, facing them, and a side fill on a stand on stage left (beyond the
 *  low end), firing across — the one a pattern's null can face. */
export function malletWedges(o: { frontZ: number; sideX: number }): Wedge[] {
  return [
    {
      id: 'side',
      label: 'a side-fill speaker on a stand at stage left, beyond the low end, firing across the stage',
      short: 'SIDE FILL',
      p: { x: o.sideX, y: 0, z: 0 },
      lift: 1700,
      faces: { x: -1, y: 0, z: 0 },
      note: 'Up on a stand at about head height, off to the side: almost level with a mic above the bars, well off its front — a case a pattern’s null can help with.',
      prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' },
    },
    {
      id: 'front',
      label: 'a floor wedge in front of the instrument, facing the player',
      short: 'FRONT WEDGE',
      p: { x: 0, y: 0, z: o.frontZ },
      lift: 150,
      faces: { x: 0, y: 0, z: -1 },
      note: 'On the floor in front, pointing back at the player — and up toward a mic above the bars, in front of it: no pattern null reaches it. Keep its level only as high as the player needs.',
      prov: { kind: 'illustrative', reason: 'a typical stage layout; no source gives the position' },
    },
  ];
}

/* ── shared checks ── */

export function hearingCheckM(w: MW, page: PageId): MikingScenario {
  // The shared max-SPL check (sharedItems.ts): what the rating DOES say.
  return micRatingCheck({ id: `${w.p}.set.hear`, page, mic: `mic over ${w.the}`, loudest: `the loudest roll on ${w.the}` });
}

export function quickHearingM(w: MW): DiagnosticItem {
  return {
    id: `${w.p}.q.6`,
    covers: 'setting',
    critical: true,
    prompt: `A mic over ${w.the} is rated far above any level on stage. What does that tell you about a long, loud rehearsal next to it?`,
    options: ['Nothing — that is the mic’s distortion limit, not a hearing limit', 'It is safe while the stage stays below the mic’s rating', 'It is safe as long as the mic is much nearer the bars than you are'],
    correct: 'Nothing — that is the mic’s distortion limit, not a hearing limit',
    explain: 'Max SPL says when the MIC distorts. For people, a widely used guideline is no more than 85 dBA averaged over 8 hours, halving the time for every 3 dBA more — measured where the person listens.',
    why: {
      'It is safe while the stage stays below the mic’s rating': 'A mic rating is not a hearing limit. A widely used guideline for people is 85 dBA averaged over 8 hours.',
      'It is safe as long as the mic is much nearer the bars than you are': 'Where the mic sits says nothing about your ears. Measure where the person listens, and keep levels and time down.',
    },
  };
}

export function coincidentCheck(w: MW, id = `${w.p}.two.3`): MikingScenario {
  return {
    id,
    page: 'twoMic',
    prompt: 'Two mics with their grilles together, angled 135° apart. A bar at the far low end sounds. What differs between the two mics?',
    options: ['Their levels — the arrival time is the same', 'Their arrival times — the levels are the same', 'Nothing at all: a coincident pair makes a mono picture'],
    correct: 'Their levels — the arrival time is the same',
    explain: 'With the grilles together, every bar is the same distance from both capsules: no time difference, so no comb in mono. The mic angled toward the low end hears that bar louder — the picture is made by level.',
    why: {
      'Their arrival times — the levels are the same': 'That is the spaced pair. Grilles together, the paths are equal for every bar; the angle makes the levels differ.',
      'Nothing at all: a coincident pair makes a mono picture': 'The two mics face different ways, so they hear an end bar at different levels — that is the stereo picture.',
    },
  };
}

export function spacedMonoCheck(w: MW, id = `${w.p}.two.4`): MikingScenario {
  return {
    id,
    page: 'twoMic',
    prompt: `A spaced pair over ${w.the} sounds wide in headphones, but some notes go thin when summed to mono. What is the likely cause?`,
    options: ['Those notes reach the two mics at different times', 'The mics are not loud enough for the instrument', 'One of the two mics has failed and lost its highs'],
    correct: 'Those notes reach the two mics at different times',
    explain: 'A bar nearer one mic reaches it first; summed, the late copy cancels some frequencies — a comb. Check each mic alone and the sum in mono; move, narrow, or try a coincident pair before reaching for processing.',
    why: {
      'The mics are not loud enough for the instrument': 'Level does not make a note go thin in mono only. The timing between the mics does.',
      'One of the two mics has failed and lost its highs': 'A failed mic sounds wrong on its own, too. A note that thins only in the sum points to the timing between the mics.',
    },
  };
}

export function louderCheckM(w: MW, id = `${w.p}.two.5`): MikingScenario {
  return {
    id,
    page: 'twoMic',
    prompt: `You flip mic B's polarity and ${w.the} suddenly sounds bigger; the sum reads 3 dB louder. What do you conclude?`,
    options: ['Not yet: match the levels, then compare both states again in mono', 'Inverted is the better setting, so keep it that way for the whole show', 'Normal polarity was wrong, because it was the quieter one'],
    correct: 'Not yet: match the levels, then compare both states again in mono',
    explain: 'A louder version almost always sounds “better” at first. Compare at matched level, in mono and in the whole mix, before you decide.',
    why: {
      'Inverted is the better setting, so keep it that way for the whole show': 'A louder version almost always sounds better at first. Compare at matched level before deciding.',
      'Normal polarity was wrong, because it was the quieter one': 'Quieter is not wrong. Match levels, then judge which state keeps the whole keyboard full.',
    },
  };
}

export function monoSymptomM(w: MW): Symptom {
  return {
    id: `${w.p}.s.mono`,
    observation: 'The pair sounds hollow, or the middle thins, when summed to mono',
    firstChecks: 'Each mic alone, then both together and in mono at matched levels; the spacing, the overlap through the middle and both polarity states.',
    options: ['Each mic alone, then the mono sum, the spacing and the overlap', 'Turn the whole pair up until the middle sounds full and solid again', 'Invert one mic, since a pair is usually wired the wrong way'],
    correct: 'Each mic alone, then the mono sum, the spacing and the overlap',
    explain: 'A bar both mics hear at different times combs in mono. Reposition, narrow, or try a coincident pair — then listen again in mono.',
    why: {
      'Turn the whole pair up until the middle sounds full and solid again': 'More level does not fix a cancellation between the two mics.',
      'Invert one mic, since a pair is usually wired the wrong way': 'No pair is “usually wrong”. Compare BOTH polarity states at matched level, in mono — and move the mics first.',
    },
  };
}

export function weakEndSymptom(w: MW): Symptom {
  return {
    id: `${w.p}.s.end`,
    observation: 'The highest (or lowest) notes are weak',
    firstChecks: 'Play the whole range: does the mic’s view favour one register? Change height, angle or the pair’s balance.',
    options: ['The range the mic covers: height, angle, the pair’s balance', 'Boost that end of the range with EQ until it matches the rest', `Ask the ${w.player} to play that end of the keyboard harder`],
    correct: 'The range the mic covers: height, angle, the pair’s balance',
    explain: 'A single close point favours the bars nearest it. Play the real passage from end to end, then move or re-aim — or use a pair — before EQ.',
    why: {
      'Boost that end of the range with EQ until it matches the rest': 'EQ cannot give back notes the mic does not hear well: fix the coverage first.',
      [`Ask the ${w.player} to play that end of the keyboard harder`]: 'The player plays the music; move the mic to cover the part.',
    },
  };
}

export function rattleSymptom(w: MW, what: string): Symptom {
  return {
    id: `${w.p}.s.rattle`,
    observation: 'A buzz or a rattle',
    firstChecks: `Does it happen in the room with the PA muted? Then the instrument, not the mic: ${what} — have the player or a technician inspect it.`,
    options: ['Whether it happens without the PA, then the instrument is inspected', 'Gate the channel so that the rattle is cut out between all the notes', 'Tighten the cords and posts yourself, between two songs'],
    correct: 'Whether it happens without the PA, then the instrument is inspected',
    explain: 'A rattle you hear in the room is mechanical. Find it — a loose part, a stand touching the frame — and have the player or a technician fix it; never adjust the instrument yourself.',
    why: {
      'Gate the channel so that the rattle is cut out between all the notes': 'A gate hides it between notes and can chop the ring. Find the cause.',
      'Tighten the cords and posts yourself, between two songs': 'The instrument is the player’s: ask them or a technician.',
    },
  };
}

/** The stage-and-studio words every lesson shares. */
export const BEFORE_STANDS = { title: 'LOCK IT, THEN PLACE', text: 'Park the instrument, lock its wheels and check it stands firm before any stand goes near it. Weighted, tightened stands; booms counterbalanced; cables away from feet, pedals and wheels.' };
