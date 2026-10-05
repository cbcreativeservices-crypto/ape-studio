/**
 * C07 ACOUSTIC BASS GUITAR — where things are: the body built by the shared
 * guitar family (seated, frame G = engine), its zones, its stage sources.
 */
import { buildGuitarModel, zoneFor } from '../shared/guitars/guitarModel.ts';
import { bodyShield, stringsWedges } from '../shared/guitars/stringsContent.ts';
import { C07_VARIANTS, c07ZoneSpecs } from './model.ts';

export const C07_BUILT = buildGuitarModel({ id: 'acousticBass', name: 'acoustic bass guitar', variants: C07_VARIANTS, defaultVariant: 'bass' });
export const C07_MODEL = C07_BUILT.model;
const SC = C07_BUILT.scenes.bass;
export const C07_ZONES = c07ZoneSpecs(SC).map((z) => zoneFor(SC, z));
export const C07_WEDGES = stringsWedges(SC, { one: 'bass', the: 'the bass', player: 'bassist' }, { wedgeZ: 1250 });
export const C07_SHIELD = bodyShield(C07_MODEL, 'bass');
