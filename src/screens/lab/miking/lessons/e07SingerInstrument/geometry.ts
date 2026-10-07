/**
 * E07 SINGER WITH GUITAR OR PIANO — where things are (charter §2 layer 2).
 * singer_with_instrument/GEOMETRY_PROPOSAL.md: "Composite scene = frame V
 * (singer) + guitar frame G or piano frames P/U". Two hosts, one lesson:
 *
 *   GUITAR  the guitar family's SEATED player with a steel-string
 *           dreadnought (lessons/shared/guitars, frame G: +x to the nut, +y
 *           down, +z out of the top toward the audience) — the player's
 *           mouth, head and body are that family's (guitarModel.playerFit);
 *   PIANO   the piano lesson's GRAND on the full stick with its pianist on
 *           the bench (lessons/c11Piano, frame K: the hammer line at the
 *           origin, +x away from the pianist, +y down, +z to the treble).
 * On each, the singer's mouth is added as a frame-V anchor (shared/voice/
 * addVoice.ts) so vocal starting points read "from the lips" exactly as in
 * E01. The seated posture and the mouth-to-instrument offset are the host
 * families' drawing defaults (owner item: the research leaves them open).
 */
import type { InstrumentModel, Variant } from '../../engine/model/types.ts';
import { buildGuitarModel, frameGuitarViews, type BuiltGuitarModel, type GVariant } from '../shared/guitars/guitarModel.ts';
import { STEEL_DREAD } from '../shared/guitars/guitarSpec.ts';
import { PIANO_MODEL } from '../c11Piano/geometry.ts';
import { pianistAt } from '../shared/piano/pianoSpec.ts';
import { GB } from '../c11Piano/model.ts';
import { addVoice, voiceIds } from '../shared/voice/addVoice.ts';
import { mergeHosts } from '../shared/voice/hostMerge.ts';
import type { VoiceAnchor } from '../shared/voice/voiceSpec.ts';
import type { DocumentedZone } from '../../engine/model/types.ts';

export const GUITAR_V: GVariant = {
  id: 'guitar',
  label: 'GUITAR',
  blurb: 'A singer seated with a steel-string acoustic guitar: the mouth about 40 cm above the strings, the guitar in front of the body.',
  phrase: 'a seated singer with a steel-string guitar',
  spec: STEEL_DREAD,
  posture: 'seated',
};
export const GUITAR_INFO: Variant = { id: 'guitar', label: GUITAR_V.label, blurb: GUITAR_V.blurb, phrase: GUITAR_V.phrase };
export const PIANO_INFO: Variant = { id: 'piano', label: 'GRAND PIANO', blurb: 'A singer at a grand piano, the lid on the full stick: the mouth above the keys, the strings and the soundboard in front of them.', phrase: 'a singer at a grand piano' };

/** The guitar host, before its views are framed (the scene and the player). */
export const GUITAR_RAW: BuiltGuitarModel = buildGuitarModel({ id: 'singerWithInstrument', name: 'singer with guitar or piano', variants: [GUITAR_V], defaultVariant: 'guitar' });
export const GUITAR_SC = GUITAR_RAW.scenes.guitar;

/** The singer-guitarist's mouth (frame G): facing the audience (+z), the
 *  player's right toward the guitar's tail (−x). */
export const V_GUITAR: VoiceAnchor = { lip: GUITAR_SC.fit.mouth, fwd: { x: 0, y: 0, z: 1 }, up: { x: 0, y: -1, z: 0 }, right: { x: -1, y: 0, z: 0 } };

/** The pianist (frame K) and their mouth: the shared figure's profile head
 *  (r 110) facing the keys — its lips 84 mm ahead of and 52 mm below the
 *  head's centre (PlayerFigure.headProfile), the treble (+z) to their right. */
export const PIANIST = pianistAt(GB.xKey, GB.lyre.x);
const K = PIANIST.headR / 110;
export const V_PIANO: VoiceAnchor = { lip: { x: PIANIST.head.x + 84 * K, y: PIANIST.head.y + 52 * K, z: 0 }, fwd: { x: 1, y: 0, z: 0 }, up: { x: 0, y: -1, z: 0 }, right: { x: 0, y: 0, z: 1 } };

export const IDS_G = voiceIds('sg');
export const IDS_P = voiceIds('sp');

const guitarHost = (m: InstrumentModel) => addVoice(m, V_GUITAR, IDS_G, ['guitar']);
const pianoHost = addVoice(PIANO_MODEL, V_PIANO, IDS_P, ['grand']);

const merge = (g: InstrumentModel) =>
  mergeHosts(
    [
      { variant: 'guitar', info: GUITAR_INFO, model: guitarHost(g) },
      { variant: 'piano', info: PIANO_INFO, model: pianoHost, from: 'grand' },
    ],
    // The guitar family's mics face the top (−z); a vocal mic swings right
    // round the singer, a piano mic hangs over the strings.
    { id: 'singerWithInstrument', name: 'singer with guitar or piano', aimHome: { az: -90, el: 0 }, aimAzLimit: 180, fitAuthored: { top: true } },
  );

/** The model before the guitar's views are framed (zones' starts are found
 *  in it: the views do not change a solid). */
export const E07_MODEL_RAW: InstrumentModel = merge(GUITAR_RAW.model);

/** The final model, the guitar's views framed on its zones (model.ts). */
export function frameE07(guitarZones: readonly DocumentedZone[]): { model: InstrumentModel; guitar: BuiltGuitarModel } {
  const guitar = frameGuitarViews(GUITAR_RAW, guitarZones);
  return { model: merge(guitar.model), guitar };
}
