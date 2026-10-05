/**
 * C05c UKULELE — where things are: the soprano body built by the shared
 * guitar family (seated, frame G = engine), its zones and stage sources.
 */
import { buildGuitarModel, frameGuitarViews, zoneFor } from '../shared/guitars/guitarModel.ts';
import { bodyShield, stringsWedges } from '../shared/guitars/stringsContent.ts';
import { C05C_VARIANTS, c05cZoneSpecs } from './model.ts';

const RAW = buildGuitarModel({ id: 'ukulele', name: 'soprano ukulele', variants: C05C_VARIANTS, defaultVariant: 'soprano' });
const SC = RAW.scenes.soprano;
export const C05C_ZONES = c05cZoneSpecs(SC).map((z) => zoneFor(SC, z));
/** Framed on the instrument and its starting points (frameGuitarViews): a
 *  soprano fills the stage, the player is cropped, never shrunk. */
export const C05C_BUILT = frameGuitarViews(RAW, C05C_ZONES);
export const C05C_MODEL = C05C_BUILT.model;
export const C05C_WEDGES = stringsWedges(SC, { one: 'ukulele', the: 'the ukulele', player: 'player' }, { wedgeZ: 1300 });
export const C05C_SHIELD = bodyShield(C05C_MODEL, 'soprano');
