/**
 * C05a BANJO — where things are: the pot, neck and resonator built by the
 * shared guitar family (standing, frame G = engine), its zones and its
 * stage sources.
 */
import { buildGuitarModel, zoneFor } from '../shared/guitars/guitarModel.ts';
import { bodyShield, stringsWedges } from '../shared/guitars/stringsContent.ts';
import { C05A_VARIANTS, c05aZoneSpecs } from './model.ts';

export const C05A_BUILT = buildGuitarModel({
  id: 'banjo',
  name: 'five-string banjo',
  variants: C05A_VARIANTS,
  defaultVariant: 'reso',
  partWords: {
    top: { label: 'head (the membrane)', short: 'head', role: 'A thin tensioned membrane over the pot, like a drumhead.' },
    sides: { label: 'pot (the rim)', short: 'pot', role: 'The round wooden rim the head is stretched over, with its tension hoop and hooks.' },
    bridge: { label: 'bridge', short: 'bridge', role: 'A thin floating bridge standing on the head: the strings press it down, and it drives the head. The strings never touch the head themselves.' },
  },
});
export const C05A_MODEL = C05A_BUILT.model;
export const C05A_ZONES = C05A_VARIANTS.flatMap((v) => c05aZoneSpecs(C05A_BUILT.scenes[v.id]).map((z) => zoneFor(C05A_BUILT.scenes[v.id], z)));
export const C05A_WEDGES = stringsWedges(C05A_BUILT.scenes.reso, { one: 'banjo', the: 'the banjo', player: 'banjo player' }, { wedgeZ: 1700 });
export const C05A_SHIELD = bodyShield(C05A_MODEL, 'reso');
