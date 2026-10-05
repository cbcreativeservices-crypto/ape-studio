/**
 * C05c UKULELE — where things are: the soprano body built by the shared
 * guitar family (seated, frame G = engine), its zones and stage sources.
 */
import { buildGuitarModel, zoneFor } from '../shared/guitars/guitarModel.ts';
import { bodyShield, stringsWedges } from '../shared/guitars/stringsContent.ts';
import { C05C_VARIANTS, c05cZoneSpecs } from './model.ts';

export const C05C_BUILT = buildGuitarModel({ id: 'ukulele', name: 'soprano ukulele', variants: C05C_VARIANTS, defaultVariant: 'soprano' });
export const C05C_MODEL = C05C_BUILT.model;
const SC = C05C_BUILT.scenes.soprano;
export const C05C_ZONES = c05cZoneSpecs(SC).map((z) => zoneFor(SC, z));
export const C05C_WEDGES = stringsWedges(SC, { one: 'ukulele', the: 'the ukulele', player: 'player' }, { wedgeZ: 1300 });
export const C05C_SHIELD = bodyShield(C05C_MODEL, 'soprano');
