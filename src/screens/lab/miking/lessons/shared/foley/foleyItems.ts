/**
 * THE FOLEY FAMILY'S SHARED CHECKS — items that read the same for footsteps,
 * cloth, props and impacts, with the lesson's words passed in (F01–F04).
 * Each lesson writes its own action-specific items too.
 *
 * Item rules (LESSON_JOURNEY §5, tested): the correct option is never much
 * longer than the others, wrong options are real misconceptions with their
 * own "why", no absolute-word giveaways, no brand recall, reasoning not
 * recall. Starting-points voice; no sources on screen (owner 2026-10-04).
 */
import type { DiagnosticItem, MikingScenario, SetupReason, SourcePageId, Symptom } from '../../../engine/model/types.ts';
import { micRatingCheck } from '../../../engine/model/sharedItems.ts';

export type FoleyWords = {
  /** id prefix ("f01") */
  p: string;
  /** "footsteps", "the cloth pass" — what is miked */
  what: string;
  /** "the loudest step" */
  loudest: string;
  /** "the walker's whole movement" — the keep-out, in words */
  movement: string;
};

/** The setting page's max-SPL check (engine/model/sharedItems.ts). */
export function foleyRating(w: FoleyWords, id = `${w.p}.set.hear`): MikingScenario {
  return micRatingCheck({ id, page: 'setting', mic: 'Foley mic', loudest: w.loudest });
}

/** The QUICK CHECK's critical CLEARANCE item. */
export function clearanceDiag(w: FoleyWords, id = `${w.p}.q.clear`): DiagnosticItem {
  return {
    id,
    covers: 'setting',
    critical: true,
    prompt: 'Before any stand goes up for a Foley cue, what is marked on the floor?',
    options: [`${w.movement[0].toUpperCase()}${w.movement.slice(1)}, and the exit path`, 'Where the mic stand will look neatest on camera', 'The spot that gives the loudest sound in the room'],
    correct: `${w.movement[0].toUpperCase()}${w.movement.slice(1)}, and the exit path`,
    explain: 'Walk the cue without recording first, and mark the whole movement — a pivot or a missed step included — and the way out. Stands, mic housings and cables stay outside both. That comes before any distance.',
    why: {
      'Where the mic stand will look neatest on camera': 'Looks come after safety: the movement and the exit path are marked first, and the stand goes outside them.',
      'The spot that gives the loudest sound in the room': 'Level comes from the performance and the gain — and no position is worth a stand in the performer’s way.',
    },
  };
}

/** The QUICK CHECK's critical HEARING item. */
export function hearingDiag(w: FoleyWords, id = `${w.p}.q.hear`): DiagnosticItem {
  return {
    id,
    covers: 'setting',
    critical: true,
    prompt: 'Your Foley mic is rated far above any level on the stage. What does that tell you about long takes on loud headphones?',
    options: ['Nothing — that is the mic’s limit, not a hearing limit', 'They are safe while the stage stays below the mic’s rating', 'They are safe if the mic is nearer the action than you'],
    correct: 'Nothing — that is the mic’s limit, not a hearing limit',
    explain: 'Max SPL says when the MIC distorts. For people, a widely used guideline is no more than 85 dBA averaged over 8 hours, halving the time for every 3 dBA more — measured where the person listens. Keep headphones and monitors comfortable.',
    why: {
      'They are safe while the stage stays below the mic’s rating': 'A mic rating is not a hearing limit. A widely used guideline for people is 85 dBA averaged over 8 hours.',
      'They are safe if the mic is nearer the action than you': 'Where the mic sits says nothing about your ears. Measure where the person listens, and keep levels and time down.',
    },
  };
}

/** The shotgun in a room (SCH-SHOTGUN): its tube narrows the highs; it does not remove reflections. */
export function shotgunRoom(w: FoleyWords, page: SourcePageId, id = `${w.p}.mic.tube`): MikingScenario {
  return {
    id,
    page,
    prompt: 'On a reflective Foley stage, what can you expect from a short shotgun?',
    options: ['Narrower highs, but the room’s reflections still reach it', 'A narrow pickup at all pitches, so the room is gone', 'The same pickup as an omni once it is a metre or more away'],
    correct: 'Narrower highs, but the room’s reflections still reach it',
    explain: 'Through the lows and mids the tube does little: the mic hears like its supercardioid capsule. Higher up its pickup narrows, unevenly. In a reflective room the reflections arrive from every side, so a shotgun is less effective there than one might wish — compare it with a small supercardioid in the same place.',
    why: {
      'A narrow pickup at all pitches, so the room is gone': 'Only the highs narrow. Through the lows and mids it hears like its capsule — and reflections come from every side.',
      'The same pickup as an omni once it is a metre or more away': 'Distance does not change a pattern. It stays supercardioid at the base, narrower in the highs — it just hears more room farther away.',
    },
  };
}

/** Where a shotgun's distance is read to. */
export function capsuleRef(w: FoleyWords, page: SourcePageId, id = `${w.p}.place.capsule`): MikingScenario {
  return {
    id,
    page,
    prompt: 'A starting point says “1.4 m from the action”. Where on a short shotgun is that read to?',
    options: ['The capsule, at the back of the tube', 'The front of the grille, at the tube’s tip', 'The stand’s clamp, behind the mic'],
    correct: 'The capsule, at the back of the tube',
    explain: 'A shotgun’s capsule sits behind its slotted tube, about 20 cm back on a short one. These starting points are read to the capsule — so the grille is that much closer to the action, which matters for clearance.',
    why: {
      'The front of the grille, at the tube’s tip': 'The tip is about 20 cm ahead of the capsule. Read to the tip, the mic would sit 20 cm farther back than the starting point means.',
      'The stand’s clamp, behind the mic': 'The clamp holds the mic; the sound is picked up at the capsule.',
    },
  };
}

/** Live: no deliberate feedback (the no-provocation rule). */
export function noProvoke(w: FoleyWords, page: SourcePageId, id = `${w.p}.ctx.ring`): MikingScenario {
  return {
    id,
    page,
    prompt: `In a live booth, how do you find how much gain the ${w.what} mic can take?`,
    options: ['Raise it with the operator at show level, short of any ring', 'Push it until it rings, then back it off a little', 'Turn the PA off first, then set the gain as high as it will go'],
    correct: 'Raise it with the operator at show level, short of any ring',
    explain: 'Check the gain with the system operator, the PA and the wedges at their intended levels, the performer walking the real cue — and stop well short of any ringing. Feedback is never provoked on purpose, not even as a demonstration.',
    why: {
      'Push it until it rings, then back it off a little': 'Provoking feedback risks hearing and loudspeakers. Stop short of any ring, and change the geometry instead.',
      'Turn the PA off first, then set the gain as high as it will go': 'The PA is what feeds back. The check has to be made with it on, at its show level.',
    },
  };
}

/** Gain on the strongest real action (headroom). */
export function foleyGain(w: FoleyWords, id = `${w.p}.prac.gain`): MikingScenario {
  return {
    id,
    page: 'practice',
    prompt: `Most of the cue sits well below the overload light, but ${w.loudest} lights it. What do you do?`,
    options: ['Lower the input gain and re-check that moment', 'Pull the channel fader down until it sounds clean', 'Ask the performer to make that moment softer'],
    correct: 'Lower the input gain and re-check that moment',
    explain: 'Set the input gain on the strongest action the cue really has, and look for overload at the mic, the preamp and the recorder. A fader after the overload cannot repair clipping already made earlier in the chain.',
    why: {
      'Pull the channel fader down until it sounds clean': 'The overload happens before the fader. A lower fader only makes the clipped sound quieter.',
      'Ask the performer to make that moment softer': 'The cue sets the performance. Set gain for the strongest moment it needs — never ask for less, or for unsafe force.',
    },
  };
}

/** Feedback in a live booth: a symptom. */
export function feedbackFoley(w: FoleyWords): Symptom {
  return {
    id: `${w.p}.sym.feedback`,
    observation: 'In the live booth, the mic starts to ring before the effect is loud enough',
    firstChecks: 'Lower that send at once; then the wedge and PA against the mic’s pattern, the distance to the action, and how many mics are open — with the operator.',
    options: ['Lower it, then the wedge, the distance and the open mics', 'Add more gain so the effect covers the ringing', 'Swap to an omni so the effect is heard from all round the booth'],
    correct: 'Lower it, then the wedge, the distance and the open mics',
    explain: 'Feedback is a sound-system condition: lower the level first, then aim the rejection at the wedge, work a little closer within clearance and close the mics you do not need. Never provoke it to find out where it starts.',
    why: {
      'Add more gain so the effect covers the ringing': 'More gain feeds the loop. Lower the level first.',
      'Swap to an omni so the effect is heard from all round the booth': 'An omni hears the PA and the wedge from every side: it usually rings sooner.',
    },
  };
}

/** Thumps and rumbles: stands and cables before filters. */
export function thumpSymptom(w: FoleyWords): Symptom {
  return {
    id: `${w.p}.sym.thump`,
    observation: 'Low thumps and rumbles that are not part of the action',
    firstChecks: 'Stop and look for floor, stand and cable contact: the shock mount, a stable stand, the cable relieved and clear of the movement — before any filter.',
    options: ['The shock mount, the stand and the cable first', 'A steep low cut on the channel to hide all of them', 'Ask the performer to move more gently'],
    correct: 'The shock mount, the stand and the cable first',
    explain: 'Stand-borne and cable-borne bumps travel up into the mic. A shock mount, a stable stand and a cable kept clear and relieved stop them at the source; a filter would also take away low sound the action may need.',
    why: {
      'A steep low cut on the channel to hide all of them': 'A filter can also remove the wanted low body of the sound. Fix the mechanical path first.',
      'Ask the performer to move more gently': 'The performance serves the scene. Isolate the rig instead of changing the action for it.',
    },
  };
}

/** Changing tone between takes: repeatability. */
export function repeatSymptom(w: FoleyWords): Symptom {
  return {
    id: `${w.p}.sym.repeat`,
    observation: 'The tone changes from take to take',
    firstChecks: 'Mark the action’s place and the mic’s position and axis; log them; rehearse the whole cue the same way again.',
    options: ['Mark and log the action, the mic and its aim', 'Change the mic on each take to compare them side by side', 'Fix it later with EQ on each take'],
    correct: 'Mark and log the action, the mic and its aim',
    explain: 'Small changes in where the action happens and where the mic points change the tone. Mark the floor, log the distance, height and aim, and change one thing at a time on purpose.',
    why: {
      'Change the mic on each take to compare them side by side': 'Changing two things at once hides which one made the difference. Hold everything but one variable.',
      'Fix it later with EQ on each take': 'EQ cannot put back a different perspective. Make the takes repeatable at the mic.',
    },
  };
}

export const CLEAR_REASON = (what: string): SetupReason => ({ id: 'r.clear', label: `The mic, stand and cable stay outside ${what}`, role: 'required', feedback: 'Clearance — of the whole movement and the exit path — is part of every passing setup.' });
export const DOC_REASON = (from: string): SetupReason => ({ id: 'r.doc', label: `It is a suggested starting point for this kind of mic, measured from ${from}`, role: 'required', feedback: 'Say why it is a fair place to begin, and what it is measured from.' });
export const BRAND_REASON: SetupReason = { id: 'r.brand', label: 'It is the brand most Foley stages use', role: 'wrong', feedback: 'A brand is not part of passing: choose by properties and by ear.' };
export const LOUD_REASON: SetupReason = { id: 'r.loud', label: 'It gives the loudest signal of any position', role: 'wrong', feedback: 'Loudness is not a reason — level comes from gain, and louder playback is not a better tone.' };
export const SHOCK_REASON: SetupReason = { id: 'r.shock', label: 'A shock mount and a stable stand keep floor thumps out', role: 'optional', feedback: 'A fair reason on any Foley stage.' };
