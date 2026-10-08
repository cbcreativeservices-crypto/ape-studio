/**
 * A SEATED TALKER AS MODEL PIECES (Lab 7; talkerPose.ts is the geometry):
 * the parts a learner names and the solids a mic keeps clear of, the places
 * the voice leaves, the mouth as a reference target, the mouth's axis — for
 * any talker in a broadcast scene (host, second host, guest, panelist).
 * Pure: no React. Used by B01, B07, B06; groups 2 and 3 reuse it.
 */
import type { Envelope, Part, Provenance, RadiatingRegion, RefLine, ReferenceSurface, Rim, Shape3, VariantId, Vec3 } from '../../../engine/model/types.ts';
import { NOSE } from '../voice/voiceSpec.ts';
import { mouthLine, mouthSurface } from '../voice/voiceZones.ts';
import { VOICE_PART_WORDS } from '../voice/voiceModel.ts';
import { EYES, SEATED_SOLIDS, onTalker, solidOnTalker, talkerAnchor, type Talker } from './talkerPose.ts';
import { DESK_ARM } from './broadcastMics.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
export const FIGURE = ill('the shared adult figure seated (talkerPose.ts): a drawing default');

/** The ids a talker's pieces carry: `prefix` + '.mouth', '.head' … The FIRST
 *  talker of a lesson may use the voice family's own ids (v.mouth, v.head,
 *  v.chest, player.neck) so the shared voice words and hit tests apply. */
export type TalkerIds = { mouth: string; nose: string; head: string; chest: string; neck: string; armR: string; armL: string; legs: string; surface: string; line: string; region: string };
export const VOICE_IDS: TalkerIds = { mouth: 'v.mouth', nose: 'v.nose', head: 'v.head', chest: 'v.chest', neck: 'player.neck', armR: 'player.armR', armL: 'player.armL', legs: 'player.legs', surface: 'mouth', line: 'mouthAxis', region: 'r' };
export function talkerIds(prefix: string): TalkerIds {
  return { mouth: `${prefix}.mouth`, nose: `${prefix}.nose`, head: `${prefix}.head`, chest: `${prefix}.chest`, neck: `${prefix}.neck`, armR: `${prefix}.armR`, armL: `${prefix}.armL`, legs: `${prefix}.legs`, surface: `${prefix}.lips`, line: `${prefix}.axis`, region: `${prefix}.r` };
}

export type TalkerWords = { who: string; mouthRole?: string; headRole?: string; chestRole?: string };

/** The talker's parts (each solid its own part; the minor ones not listed). */
export function talkerParts(t: Talker, ids: TalkerIds, w: TalkerWords, variants?: VariantId[]): Part[] {
  const S = SEATED_SOLIDS;
  const on = (s: Shape3) => solidOnTalker(t, s);
  const vs = variants ? { variants } : {};
  const W = VOICE_PART_WORDS;
  const own = ids.mouth === 'v.mouth';
  return [
    { id: ids.mouth, label: own ? W.mouth.label : `${w.who}: mouth`, short: own ? W.mouth.short : 'mouth', role: w.mouthRole ?? 'Where the voice leaves the talker — almost all of it. Every distance here is measured from the lips to the front of the mic.', prov: FIGURE, ...vs },
    { id: ids.nose, label: own ? W.nose.label : `${w.who}: nose`, short: 'nose', role: W.nose.role, listIn: own ? undefined : [], prov: FIGURE, ...vs },
    { id: ids.head, label: own ? 'head and face' : w.who, short: own ? 'head' : w.who.replace(/^the /, ''), role: w.headRole ?? 'The head turns as the talker reads, listens and answers. A mic keeps clear of the face and out of the sight line.', solid: on(S.head), prov: FIGURE, ...vs },
    { id: ids.chest, label: own ? 'chest and shoulders' : `${w.who}: chest`, short: 'chest', role: w.chestRole ?? 'Seated upright, leaning in a little over the desk’s edge. The voice is read from the mouth, never the chest.', solid: on(S.torso), listIn: own ? undefined : [], prov: FIGURE, ...vs },
    { id: ids.neck, label: 'neck', short: 'neck', role: 'The neck, chin to collar.', solid: on(S.neck), listIn: [], prov: FIGURE, ...vs },
    { id: ids.armR, label: 'the right forearm, on the desk', short: 'arm', role: 'Forearms rest on the desk: a mic arm keeps clear of them and of the hands turning pages.', solid: on(S.armR), listIn: [], prov: FIGURE, ...vs },
    { id: ids.armL, label: 'the left forearm, on the desk', short: 'arm', role: 'Forearms rest on the desk: a mic arm keeps clear of them and of the hands turning pages.', solid: on(S.armL), listIn: [], prov: FIGURE, ...vs },
    { id: ids.legs, label: 'the talker’s legs', short: 'legs', role: 'Under the desk: cables and bases stay clear of the feet.', solid: on(S.thighs), listIn: [], prov: FIGURE, ...vs },
  ];
}

/** Where the voice leaves, the mouth as the reference target, its axis. */
export function talkerVoice(t: Talker, ids: TalkerIds, variants?: VariantId[]): { regions: RadiatingRegion[]; surface: ReferenceSurface; line: RefLine } {
  const V = talkerAnchor(t);
  const vs = variants ? { variants } : {};
  const regions: RadiatingRegion[] = [
    { id: `${ids.region}.mouth`, partId: ids.mouth, label: ids.mouth === 'v.mouth' ? 'the mouth' : 'their mouth', anchor: t.lip, prov: ill('the lip point stands for the mouth’s opening'), note: 'Almost all of the voice leaves through the open mouth. Every starting point here is measured from it.', ...vs },
  ];
  if (ids.mouth === 'v.mouth') regions.push({ id: `${ids.region}.nose`, partId: ids.nose, label: 'the nose', anchor: onTalker(t, NOSE), prov: ill('the nose tip stands for the nostrils (a drawing default)'), note: 'On m, n and ng the sound leaves through the nose — a smaller part of the voice, close to the mouth.', ...vs });
  return { regions, surface: mouthSurface(V, { id: ids.surface, partId: ids.mouth, ...(variants ? { variants } : {}) }), line: mouthLine(V, { id: ids.line, surface: ids.surface, ...(variants ? { variants } : {}) }) };
}

/** A desk arm's grip (the riser post's top), as a Rim the arm-mounted types
 *  clamp to; and the post as a small solid (its clamp under the desk). */
export function deskArm(id: string, label: string, grip: Vec3, deskTopY: number, types: readonly string[], variants?: VariantId[]): { rim: Rim; part: Part } {
  const vs = variants ? { variants } : {};
  return {
    rim: { id, label, c: grip, axis: { x: 0, y: -1, z: 0 }, r: 0, types, ...vs },
    part: { id: `${id}.post`, label: 'the arm’s desk clamp', short: 'arm clamp', role: 'The spring arm’s clamp on the desk edge and its post: secured within its load rating, the cable with slack through the arm’s travel.', solid: { kind: 'capsule', a: { x: grip.x, y: grip.y + 20, z: grip.z }, b: { x: grip.x, y: deskTopY - 4, z: grip.z }, r: 16 }, prov: ill(`the clamp’s place and the ${DESK_ARM.post.mm} mm post: drawing defaults`), ...vs },
  };
}

/** The talker's sight line to a screen or a script (a keep-out: the mic stays
 *  out of it), from between the eyes to `to`, `r` wide. */
export function sightLine(id: string, t: Talker, to: Vec3, r: number, variants?: VariantId[]): Envelope {
  return { id, label: 'the talker’s sight line to the screen', shape: { kind: 'capsule', a: onTalker(t, EYES), b: to, r }, prov: ill('the eyes and the screen: drawing defaults; the lesson: mount "clear of the script and sight line"'), ...(variants ? { variants } : {}) };
}

/** The reach part a clip mount's arm names when it cannot reach (as F09). */
export const REACH_PART: Part = { id: 'clamp', label: 'how far the arm or the neck reaches', short: 'reach', role: 'A desk arm or a gooseneck reaches only so far from its clamp or base.', listIn: [], prov: ill('the arm’s and the gooseneck’s reach: drawing defaults') };
