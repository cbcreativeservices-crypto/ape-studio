/**
 * THE FIELD FAMILY'S PAGE WORDS (engine/model/copy.ts) for a site in frame G
 * (F06–F08): the "instrument" is a place, distances are read from what the
 * lesson names (the water's edge, the kerb, the path, the animal), and the
 * mics stand on tripods at a listening point. The lesson hands in what is
 * its own; the rest is the family's. Starting-points voice; no sources,
 * brands or badges. Pure data.
 */
import type { LessonCopy } from '../../../engine/model/copy.ts';

export type FieldCopyOpts = {
  variantKey: string;
  variantShort: LessonCopy['variantShort'];
  sceneSubject: LessonCopy['sceneSubject'];
  instrument: LessonCopy['instrument'];
  worked: LessonCopy['placement']['workedZone'];
  ref: string;
  reveal: string;
  tendencies: string;
  practice: LessonCopy['practice'];
  startIntro: string;
  /** "the water’s edge" — what the worked example reads the distance from. */
  otherRef: string;
  typeNotes?: LessonCopy['placement']['typeNotes'];
  blocked?: string;
};

export function fieldCopy(o: FieldCopyOpts): Partial<LessonCopy> {
  return {
    variantKey: o.variantKey,
    variantShort: o.variantShort,
    sceneSubject: o.sceneSubject,
    viewTag: { side: 'SECTION · ALONG THE VIEW', top: 'SITE PLAN' },
    viewWords: { side: 'Section along the view,', top: 'Site plan,' },
    axes: {
      x: { plus: 'toward the scene', minus: 'back from the scene', label: 'TOWARD–BACK', blurb: `Toward the scene or back from it (x). Distances are read from ${o.ref}.` },
      y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y): the height above the ground.' },
      z: { plus: 'to the right', minus: 'to the left', label: 'ACROSS', blurb: 'To the left or right as you face the scene (z).' },
    },
    instrument: o.instrument,
    placement: {
      workedZone: o.worked,
      workedLine: 'This starting point also sets the mic’s height above the ground.',
      workedAim: 'Face the scene — an omni hears all round; a directional mic is aimed at the part you want.',
      workedClear: 'Off every path, lane and access route first; the stand stable, its cable secured where nobody walks. Clearance and permission come before any number.',
      blocked: o.blocked ? Object.fromEntries(Object.keys(o.worked).map((v) => [v, o.blocked!])) : {},
      reveal: o.reveal,
      typeNotes: {
        arrOmni: 'Ideas to try with an omni: it hears all round — the whole place, the bed and the events — and is the steadiest in the wind of the two. Move it to change the balance.',
        arrCard: 'Ideas to try with a cardioid: aim it at the part of the scene you want; its rear hears less — never nothing. One of these makes each side of a pair.',
        ...(o.typeNotes ?? {}),
      },
      note: 'Experimentation is encouraged — one change at a time, and the same height and protection when you compare two positions.',
      availableLead: 'Starting points for this mic here',
      learn: {
        intro: `What you just did, in words. After our research, each blue zone is a suggested place to begin, measured from ${o.ref}. They are starting points, not rules: listen before you deploy, move from there, and let your ears and the place decide.`,
        separate: 'Distance, height and which way the mic faces are separate things to try: change one at a time, and write each one down.',
        clearance: 'Safety and permission first: no stand on a path, lane or access route; nothing in water or on an unstable bank; stop and shelter when thunder is heard.',
        tendencies: o.tendencies,
      },
    },
    practice: o.practice,
    terms: {
      instrument: 'the site',
      aimRef: 'the line to the scene',
      startIntro: o.startIntro,
      startNew: 'Good — NEXT takes you through the place and its sounds first. You can change how you started here at any time.',
      refTitle: 'MEASURED FROM',
      otherRef: o.otherRef,
      noAim: 'This starting point gives no aim: an omni simply faces the scene. Distance and height are still separate things to try.',
      clipMount: 'Mount: not used here — field mics stand on their own tripods',
      standMount: 'Mount: a stable tripod stand, its legs and cable off every path, with wind protection',
      inPath: 'in the way',
      facing: 'facing the scene',
      observation: 'For a real site, with permission to be there and every position safe to reach. Write what you heard in words — a tendency, not a promised result. The log stays on this device; no location is read.',
    },
    words: {
      mount: {
        stand: 'Mount: a stable tripod stand, its legs and cable off every path, with wind protection',
        pole: 'Mount: a boom pole held by an operator at a fixed, safe station',
      },
    },
  };
}
