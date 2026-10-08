/**
 * F16 SCIENTIFIC ARRAYS AND SPECIALIZED SENSORS — the shared pages' words
 * (engine/model/copy.ts) for a controlled room with a marked origin, its
 * axes and a test source: the "instrument" is the array's geometry;
 * distances are read from the origin. Starting-points voice; no sources or
 * brands on screen.
 */
import type { LessonCopy } from '../../engine/model/copy.ts';

export const F16_COPY: Partial<LessonCopy> = {
  variantKey: 'ROOM',
  variantShort: { room: 'controlled room' },
  sceneSubject: { room: 'a controlled room with a marked origin, its axes and a test source' },
  viewTag: { side: 'SECTION', top: 'PLAN' },
  axes: {
    x: { plus: 'toward the source', minus: 'away from the source', label: 'TOWARD', blurb: 'Along the axis toward the source line, or back (x).' },
    y: { plus: 'lower', minus: 'higher', label: 'HEIGHT', blurb: 'Up or down (y): the baseline is drawn 1.2 m above the floor.' },
    z: { plus: 'to the right', minus: 'to the left', label: 'ALONG THE BASELINE', blurb: 'Along the baseline axis, left or right of the origin (z).' },
  },
  instrument: {
    figureBadge: 'The array room, drawn in section',
    figureLabel: 'A controlled room: the marked origin and axes, the test source on its stand, and you standing back.',
    partsBadge: 'Tap a part to name it',
    partsLooking: { side: 'Section · the source on the right', top: 'Plan · the source on the right' },
    partsIdle: 'Tap the origin, the axes, the source or the side point to see what each means for the array.',
    variantNotes: {},
  },
  placement: {
    workedZone: { room: 'ar.L' },
    workedLine: 'This starting point also keeps the element on the baseline axis.',
    workedAim: 'Aim the element toward the source line; with omni elements the aim matters little — the coordinate matters a lot.',
    workedClear: 'Clear of the source, its stand and you; the stands out of the paths.',
    blocked: { room: 'The element or its stand would touch the source, a wall or you — move it clear.' },
    reveal: 'Each element stands for one coordinate: L and R make the baseline; a wider pair, larger time differences; a third off the line, the end of the front/back mirror.',
    typeNotes: {
      measFF: 'An omni measurement mic: matched and checked with its partner.',
      measRI: 'An omni measurement mic, random incidence: matched and checked with its partner.',
    },
    note: 'Write every element’s coordinate from the origin — the time difference means nothing without it.',
    availableLead: 'Starting points for this element',
    learn: {
      intro: 'After our research, each blue zone is a place we suggest you begin — a coordinate from the marked origin. The array’s method sets the real spacing and layout.',
      separate: 'Spacing, height and aim are separate: change one at a time, and write each coordinate down.',
      clearance: 'Stands clear of the source and the paths; nothing near a running device.',
      tendencies: 'What a layout can tell is a tendency to check with a known source — never a promise.',
    },
  },
  practice: {
    gain: 'ar.prac.gain',
    second: 'ar.prac.3',
    mixed: ['ar.mix.1', 'ar.mix.2', 'ar.mix.3'],
    mixedIntro: 'Three cards from earlier pages, mixed: a mirror, a sample rate, and two recorders.',
  },
  words: {
    instrument: 'array',
    player: 'person running the test',
    reference: 'origin',
    inside: 'inside the array',
    outside: 'outside the array',
    axis: 'the baseline axis',
    facing: 'facing the source',
    shield: 'stand in path',
    mountStand: 'Mount: a firm stand, its coordinate marked, its cable out of the paths',
    mountClip: 'Mount: a firm stand',
    sheet: 'For a real study, with calibrated equipment and someone qualified on it. Write the geometry, the clock and what the result can honestly support.',
    viewSide: 'Section,',
    viewTop: 'Plan,',
  },
};
