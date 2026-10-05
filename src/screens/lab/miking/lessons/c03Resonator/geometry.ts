/**
 * C03 RESONATOR GUITAR — where things are: two postures on the shared guitar
 * family (lap: engine = (x, −zG, yG); round neck: engine = G), their zones and
 * their stage sources.
 */
import { buildGuitarModel, zoneFor } from '../shared/guitars/guitarModel.ts';
import { bodyShield, stringsWedges } from '../shared/guitars/stringsContent.ts';
import { C03_VARIANTS, c03ZoneSpecs } from './model.ts';

export const C03_BUILT = buildGuitarModel({
  id: 'resonator',
  name: 'resonator guitar',
  variants: C03_VARIANTS,
  defaultVariant: 'lap',
  partWords: {
    sides: { label: 'body', short: 'body', role: 'The body round the cone. Its sound ports and the coverplate let the cone’s sound out.' },
  },
});
export const C03_MODEL = C03_BUILT.model;
export const C03_ZONES = C03_VARIANTS.flatMap((v) => c03ZoneSpecs(C03_BUILT.scenes[v.id]).map((z) => zoneFor(C03_BUILT.scenes[v.id], z)));
export const C03_WEDGES = stringsWedges(C03_BUILT.scenes.lap, { one: 'resonator', the: 'the resonator', player: 'player' }, { wedgeZ: 1250, voice: false });
export const C03_SHIELD = bodyShield(C03_MODEL, 'lap');
