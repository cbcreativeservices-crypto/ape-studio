/**
 * B08 BROADCAST AUDIENCE AND EVENT SPACE — where things are (charter §2 layer
 * 2): the small studio audience (shared/broadcast/venue.ts) as the engine's
 * model, built with Lab 7b group 2's scene builder (shared/sports/
 * practiceModels.sceneModel; frame P → engine mm by venuePlan.toEngine:
 * engine x = across the hall, engine z = −(out into the audience), engine
 * y = −height). The larger multi-section event is drawn on the lesson's own
 * pages (venue.EVENT_SCENE). Every place is a drawing default (unknowns in
 * lesson.ts).
 */
import { sceneModel } from '../shared/sports/practiceModels.ts';
import { toEngine } from '../shared/sports/venuePlan.ts';
import { FACE_H, STUDIO, STUDIO_SCENE } from '../shared/broadcast/venue.ts';

export const B08_MODEL = sceneModel({
  scene: STUDIO_SCENE,
  id: 'b08-audience',
  name: 'a studio audience with its crowd mics',
  prefix: 'au',
  variant: { id: 'studio', label: 'STUDIO AUDIENCE', blurb: 'A small studio audience: one raked section in front of the stage, a PA at each front corner, a rigging bar above the front rows.', phrase: 'with a studio audience' },
  src: 'LESSON-B08',
  parts: [
    { id: 'S', label: 'the middle of the audience section', short: 'section', role: 'Where a crowd mic aims: the faces and upper bodies of a representative section.', lesson: false },
    { id: 'N', label: 'the front-row seat nearest the bar', short: 'front row', role: 'The nearest person to a low crowd mic: one clapper here can dominate it.', lesson: false },
    { id: 'M', label: 'the crowd mic’s place on the rigging bar', short: 'bar', role: 'Above and a little in front of the section — hung only by qualified crew.', lesson: false },
    { id: 'area', label: 'the hall floor', short: 'floor', role: 'Aisles and exits stay clear: no stand or cable in them.', lesson: false },
  ],
  views: { side: { u0: -7500, u1: 7500, v0: -5000, v1: 600 }, top: { u0: -7500, u1: 7500, v0: -10200, v1: 4800 } },
});

/** The section's middle and the bar's mic place in engine millimetres. */
export const ENG = { S: toEngine(STUDIO.S, FACE_H), M: toEngine(STUDIO.M, STUDIO.hBar) } as const;
