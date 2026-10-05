/**
 * I05d GÜIRO — where things are (charter §2 layer 2), built from the states in
 * model.ts by the family helper (smallperc/build.ts).
 */
import type { InstrumentModel, Part } from '../../engine/model/types.ts';
import { smallPercModel, type StateSpec } from '../shared/smallperc/build.ts';
import { P0, v3 } from '../shared/smallperc/geom.ts';
import { GL, GR, GU_DIMS, motionOf, RIDGE_HALF, STATES, type GuState } from './model.ts';

function parts(s: GuState): Part[] {
  const v = s.id;
  const glass = v === 'fiberglass';
  return [
    {
      id: `gui.body.${v}`,
      label: glass ? 'the body (fiberglass)' : 'the body (gourd)',
      short: 'body',
      role: glass ? 'A hollow fiberglass body with more than one ridged playing surface. The hollow resonates under the rasp.' : 'A hollow, ridged gourd — a scraped idiophone. The hollow resonates under the rasp; a natural gourd can crack.',
      prov: GU_DIMS.len.prov,
      solid: { kind: 'cyl', a: v3(s.c.x, s.c.y, s.c.z - GL / 2), b: v3(s.c.x, s.c.y, s.c.z + GL / 2), r: GR },
    },
    { id: `gui.ridges.${v}`, label: 'the ridges', short: 'ridges', role: 'Cut across the top. Each ridge the scraper crosses is a tiny click; a long scrape crosses many, a short one few.', prov: { kind: 'sourced', src: 'MET-GUIRO', quote: 'Idiophone-Scraped' } },
    { id: `gui.holes.${v}`, label: 'the grip holes', short: 'holes', role: 'Underneath: the holding hand’s fingers go through them. A palm across the body changes the sound.', prov: glass ? { kind: 'sourced', src: 'MEINL-GU7', quote: 'Padded grip holes' } : { kind: 'sourced', src: 'MEINL-GU1', quote: 'Two comfortable grip holes' } },
    { id: `gui.scraper.${v}`, label: glass ? 'the scraper (plastic)' : 'the scraper (wooden)', short: 'scraper', role: 'Swept along the ridges, often both ways, past each end. Its whole travel sets the clearance.', moving: true, prov: GU_DIMS.scraper.prov, solid: { kind: 'cyl', a: s.scraper.a, b: s.scraper.b, r: 4 } },
  ];
}

function state(s: GuState, label: string, blurb: string, phrase: string): StateSpec {
  const mo = motionOf(s);
  return {
    variant: { id: s.id, label, blurb, phrase },
    parts: parts(s),
    motion: { ...mo, label: 'the scraper’s whole travel, both ways', prov: GU_DIMS.over.prov },
    arms: [{ id: 'arm.R', label: 'right', arm: s.scrape, sweep: 20 }, { id: 'arm.L', label: 'left', arm: s.hold, sweep: 0 }],
    ref: { id: `p0.${s.id}`, partId: `gui.body.${s.id}`, label: 'the middle of the scraped area', point: P0, normal: v3(1, 0, 0) },
    regions: [{ id: `r.guiro.${s.id}`, partId: `gui.body.${s.id}`, label: 'güiro', anchor: v3(P0.x, P0.y, RIDGE_HALF * 0.5), prov: GU_DIMS.len.prov, note: 'The ridges rasp; the hollow body resonates under them.' }],
  };
}

export const GU_MODEL: InstrumentModel = smallPercModel({
  id: 'guiro',
  name: 'güiro',
  states: [
    state(STATES.gourd, 'GOURD', 'A natural gourd güiro with a wooden scraper.', 'a gourd güiro'),
    state(STATES.fiberglass, 'FIBERGLASS', 'A fiberglass güiro with a plastic scraper and more than one playing surface.', 'a fiberglass güiro'),
  ],
  views: {
    side: { u0: -560, u1: 760, v0: -1780, v1: -760 },
    top: { u0: -560, u1: 760, v0: -560, v1: 560 },
  },
});
