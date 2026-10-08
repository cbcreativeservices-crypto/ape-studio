/**
 * F04 — the lesson's own decision step on STARTING SETUPS (FoleySetting's
 * `path`, key 'path'): AIR, WATER OR STRUCTURE — the three sensing paths,
 * drawn side by side (shared/foley/MediumArt), each its own labelled track.
 * The hydrophone and the contact sensor are cards here, never placed (O-7).
 */
import type { FoleySettingSpec } from '../shared/foley/FoleySetting';
import { MediumCardArt, MEDIUM_BOX } from '../shared/foley/MediumArt';
import { MEDIA } from '../shared/foley/medium.ts';

export { F04_ART } from './art';

export const F04_PATH: NonNullable<FoleySettingSpec['path']> = {
  title: 'Air, water or structure',
  points: MEDIA.map((m) => ({ title: `${m.title} · ${m.sensor.toUpperCase()}`, text: `${m.hears} ${m.care}` })),
  note: 'Compare tracks with their sensing medium named. In this lab the airborne mic is the one you place; a hydrophone and a contact sensor are separate, labelled tracks — and only a hydrophone made for immersion ever goes into water.',
  figure: { badge: 'Three ways to pick up a basin of water', title: 'AIR · WATER · STRUCTURE', aspect: (MEDIUM_BOX.u1 - MEDIUM_BOX.u0) / (MEDIUM_BOX.v1 - MEDIUM_BOX.v0), render: (w: number, h: number) => <MediumCardArt w={w} h={h} /> },
};
