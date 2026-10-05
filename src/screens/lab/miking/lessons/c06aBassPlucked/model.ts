/**
 * C06a UPRIGHT BASS, PLUCKED — the recommended starting points (charter §2
 * layer 1), on the shared bass (lessons/shared/bowed/bass.ts). Source keys:
 * docs/labs/miking/upright_bass_plucked/SOURCES.md. Corrections UB-01 …
 *
 *   front  "6 inches to 1 foot out in front … above the bridge" (Shure),
 *          made concrete: 15–30 cm in front of the strings, 6–15 cm up
 *          from the bridge (UB-01);
 *   fhole  "a few inches from the f-hole" (Shure): 5–10 cm, the far f-hole;
 *   under  DPA's spot under the bridge, between the strings and the top
 *          (the clip on the two outer strings below the bridge, UB-02);
 *   live   a low-profile mic at an f-hole (Shure's live engineer: the
 *          tailpiece, an f-hole or the ridge above the waist — never the
 *          bridge).
 */
import type { DocumentedZone, Provenance } from '../../engine/model/types.ts';
import { add, scale } from '../../engine/geometry/vec.ts';
import { around, zoneDisc } from '../shared/bowed/bowedModel.ts';
import { BASS_FHOLE, BASS_FRONT, BASS_PLUCK, BASS_PLUCK_MODEL, BASS_UNDER, FHOLE, FHOLE_GEN, FRONT_GEN, UNDER_GEN, bassStart } from '../shared/bowed/bass.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const ax = BASS_PLUCK.ax;
const LIVE_AT = add(FHOLE, scale(ax.z, 30));

const LIVE_Z: Omit<DocumentedZone, 'start'> = {
  id: 'ub.live',
  label: 'Low-profile mic at an f-hole (stage)',
  band: 'For a loud stage: a miniature fastened at the far f-hole, its capsule about 1.5–5 cm (½–2 in) from it — never clipped to the bridge.',
  kind: 'sourced',
  src: 'S-RHYTHM',
  quote: 'You can fasten low-profile microphones to the tailpiece, to an f hole, or to the ridge that’s just above the waist of the instrument. Don’t clip them on the bridge - that can inhibit vibrations.',
  bandProv: ill('no distance is given: 1.5–5 cm from the f-hole is the lab’s drawing'),
  refSurface: 'fhole',
  side: 'outside',
  distance: { min: 15, max: 50 },
  cone: { min: 0, max: 70, prov: ill('over the f-hole, on the top’s side') },
  requires: { micTypeIds: ['strMini'] },
  draw: { side: zoneDisc('side', LIVE_AT, 26), top: zoneDisc('top', LIVE_AT, 26) },
  tendency: 'Steady and close as the bassist moves, with plenty of low-mid body; a local colour. Keep it in its own channel beside a pickup, so it can come down if it feeds back.',
  checks: ['Fastened with a mount made for it, with the owner’s agreement', 'Clear of the plucking hand', 'Feedback, with the monitors and the bass amp on'],
};

export const BASS_PLUCK_ZONES: DocumentedZone[] = [
  bassStart(BASS_PLUCK_MODEL, BASS_FRONT, FRONT_GEN()),
  bassStart(BASS_PLUCK_MODEL, BASS_FHOLE, FHOLE_GEN()),
  bassStart(BASS_PLUCK_MODEL, BASS_UNDER, UNDER_GEN()),
  bassStart(BASS_PLUCK_MODEL, LIVE_Z, around(FHOLE, ax.z, [30, 25, 35, 20, 40, 45], 60, FHOLE, ax.x)),
];
