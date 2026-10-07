/**
 * THE STANDING SINGER as an instrument model (frame V: the lip point at the
 * origin, +x forward out of the mouth, +y down, +z to the singer's right) —
 * the parts a learner names, the solids a mic and its stand keep clear of,
 * where the voice leaves, the mouth as the point every distance is read
 * from. Used by E01 (lead vocal) and E03 (rap); a singer in another host's
 * frame (E07) takes the same pieces through voiceZones.ts. Pure.
 *
 * Every solid is the shared figure's body (voicePose.ts) — a drawing default
 * (no source gives a singer's size). Clearances are ILLUSTRATIVE.
 */
import type { Envelope, InstrumentModel, Part, Provenance, Rim, Variant, VariantId, ViewBox } from '../../../engine/model/types.ts';
import { EAR, EAR_HALF, FRAME_V, VOICE_DIMS } from './voiceSpec.ts';
import { SINGER_SOLIDS } from './voicePose.ts';
import { mouthLine, mouthSurface, onAnchor, voiceRegions } from './voiceZones.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const FIG = ill('the shared adult figure (players/playerPose BODY), placed round the lip point: a drawing default');

/** The parts' words (a lesson may reword them). */
export const VOICE_PART_WORDS = {
  mouth: { label: 'mouth and lips', short: 'mouth', role: 'Where the voice leaves the singer — almost all of it. Every starting point in this lesson is measured from here: the lips to the front of the mic.' },
  nose: { label: 'nose', short: 'nose', role: 'On m, n and ng the sound leaves through the nose. A mic aimed between the nose and the mouth hears both.' },
  folds: { label: 'vocal folds (in the throat)', short: 'vocal folds', role: 'Two small folds in the voice box, low in the throat. Breath from the lungs sets them buzzing: that buzz is the raw sound, before the throat and the mouth shape it.' },
  head: { label: 'head and face', short: 'head', role: 'The throat, the mouth and the nose shape the buzz into vowels and words. The head moves as the singer sings — leave the mic room, and never let a mic or a screen touch the face.' },
  chest: { label: 'chest', short: 'chest', role: 'The breath comes from the lungs here, and the chest vibrates as the singer sings — but a mic hears the voice from the mouth. Aiming at the chest is an idea to try deliberately, not a fix for a low voice.' },
  phones: { label: 'closed-back headphones', short: 'headphones', role: 'In the studio the singer hears the track on closed-back headphones, the loudspeakers off — so the mic hears the voice, not the track. Never set headphones down on or next to a live mic.' },
} as const;

export type StandingVoiceOpts = {
  id: string;
  name: string;
  variants: Variant[];
  defaultVariant: VariantId;
  views: { side: ViewBox; top: ViewBox };
  /** Variants in which the singer wears closed-back headphones (the studio). */
  phones?: readonly VariantId[];
  /** Variants that offer a headset (its boom grips over the near ear). */
  headset?: readonly VariantId[];
  /** Extra keep-outs (E03: the rapper's working zone). */
  envelopes?: Envelope[];
};

export function standingVoiceModel(o: StandingVoiceOpts): InstrumentModel {
  const W = VOICE_PART_WORDS;
  const S = SINGER_SOLIDS;
  const parts: Part[] = [
    { id: 'v.mouth', ...W.mouth, prov: FIG },
    { id: 'v.nose', ...W.nose, prov: FIG },
    { id: 'v.folds', ...W.folds, prov: ill('the larynx, low in the throat, drawn where an adult’s sits: a simplified picture') },
    { id: 'v.head', ...W.head, solid: S.head, prov: FIG },
    { id: 'v.chest', ...W.chest, solid: S.torso, prov: FIG },
    { id: 'player.neck', label: 'neck', short: 'neck', role: 'The neck, chin to collar.', solid: S.neck, listIn: [], prov: FIG },
    { id: 'player.legs', label: 'the singer’s legs and feet', short: 'legs', role: 'Where the singer stands: a stand’s base and its cable keep clear of the feet.', solid: S.legs, listIn: [], prov: FIG },
  ];
  if (o.phones?.length) parts.push({ id: 'v.phones', ...W.phones, variants: [...o.phones], prov: ill('closed-back headphones over the ears: a drawing default') });
  const rims: Rim[] = o.headset?.length
    ? [{ id: 'clip.ear', label: 'a headset over the right ear', c: onAnchor(FRAME_V, { x: EAR.x, y: EAR.y, z: EAR_HALF }), axis: { x: 0, y: 0, z: 1 }, r: 0, variants: [...o.headset] }]
    : [];
  return {
    id: o.id,
    name: o.name,
    parts,
    regions: voiceRegions(FRAME_V, { mouthPart: 'v.mouth', nosePart: 'v.nose' }),
    surfaces: [mouthSurface(FRAME_V, { partId: 'v.mouth' })],
    lines: [mouthLine(FRAME_V, {})],
    envelopes: o.envelopes ?? [],
    variants: o.variants,
    defaultVariant: o.defaultVariant,
    views: o.views,
    yFloor: VOICE_DIMS.lipStanding,
    // No drum interior: nothing counts as "inside" (every zone is 'either').
    interior: { x0: 0, x1: 0, rIn: 0, c: { x: 0, y: 0, z: 0 } },
    rims,
    ports: Object.fromEntries(o.variants.map((v) => [v.id, null])),
    // A boom stand: the boom runs LEVEL away from the mic's tail (out from the
    // singer), the stand drops from its end to the floor (ILLUSTRATIVE).
    mountRule: { boom: 'level', fallback: { x: 1, y: 0, z: 0 }, length: 300 },
    // A mic may be swung right round the singer (beside, above, below).
    aimAzLimit: 180,
    // STARTING SETUPS keep to the head and shoulders (the views): framed head
    // to floor, a 15 cm vocal distance was about 25 px on a phone. The stand
    // runs on off the bottom edge, as in the Placement Studio.
    setupFrameMax: o.views,
    viewTags: { side: 'SIDE · FROM THE SINGER’S RIGHT', top: 'TOP · FROM ABOVE' },
  };
}
