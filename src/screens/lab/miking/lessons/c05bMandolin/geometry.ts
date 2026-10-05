/**
 * C05b MANDOLIN — where things are: the A- and F-style bodies built by the
 * shared guitar family (standing, frame G = engine), their zones and their
 * stage sources.
 */
import { buildGuitarModel, frameGuitarViews, zoneFor } from '../shared/guitars/guitarModel.ts';
import { bodyShield, stringsWedges } from '../shared/guitars/stringsContent.ts';
import { C05B_VARIANTS, c05bZoneSpecs } from './model.ts';

const RAW = buildGuitarModel({
  id: 'mandolin',
  name: 'mandolin',
  variants: C05B_VARIANTS,
  defaultVariant: 'a',
  partWords: {
    bridge: { label: 'floating bridge', short: 'bridge', role: 'A movable bridge held on the carved top by the strings’ pressure. It drives the top. Never move it.' },
    pickguard: { label: 'pickguard', short: 'pickguard', role: 'A plate protecting the top from the pick.' },
  },
});
export const C05B_ZONES = C05B_VARIANTS.flatMap((v) => c05bZoneSpecs(RAW.scenes[v.id]).map((z) => zoneFor(RAW.scenes[v.id], z)));
/** Framed on the instrument and its starting points (frameGuitarViews). */
export const C05B_BUILT = frameGuitarViews(RAW, C05B_ZONES);
export const C05B_MODEL = C05B_BUILT.model;
export const C05B_WEDGES = stringsWedges(C05B_BUILT.scenes.a, { one: 'mandolin', the: 'the mandolin', player: 'mandolin player' }, { wedgeZ: 1700 });
export const C05B_SHIELD = bodyShield(C05B_MODEL, 'a');
