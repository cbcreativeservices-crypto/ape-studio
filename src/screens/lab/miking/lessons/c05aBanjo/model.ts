/**
 * C05a BANJO — the technical truth (charter §2 layer 1). A five-string banjo
 * (banjo/GEOMETRY_PROPOSAL.md: the frame's origin at the bridge foot on the
 * head; round 3, owner 2026-10-10: a standard modern five-string — an 11 in
 * head and a 26¼ in scale, the fifth string from the 5th fret; the bridge a
 * third of Ø in from the tail-side rim), with a resonator or open back, played
 * standing on a strap (a drawing default).
 *
 * Starting points (banjo/SOURCES.md): about 3 in from the head's centre and
 * 3 in from its edge — the live and recording guides' banjo rows, replacing
 * the lesson's "about 1 ft from the bridge" (that figure is the guides' cello
 * row: correction BJ-01); aimed at where the neck meets the pot at 30–40 cm
 * (DPA's "two omnis at 30-40 cm … distance" read as a one-mic distance — the
 * lesson's own trial, and "distance" may mean the spacing: BJ-02); and a mini
 * mic clipped by the tailpiece aiming at the bridge (the guides' third row).
 */
import type { Provenance } from '../../engine/model/types.ts';
import { BANJO_5, BANJO_OPEN } from '../shared/guitars/guitarSpec.ts';
import type { GVariant, GuitarScene, ZoneSpec } from '../shared/guitars/guitarModel.ts';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });

export const C05A_VARIANTS: GVariant[] = [
  { id: 'reso', label: 'RESONATOR', blurb: 'A five-string banjo with a resonator: a wooden bowl behind the pot that reflects sound forward.', phrase: 'a resonator banjo', spec: BANJO_5, posture: 'standing' },
  { id: 'open', label: 'OPEN BACK', blurb: 'An open-back banjo: no resonator, so more sound leaves behind, into the player — often played in a gentler, clawhammer style.', phrase: 'an open-back banjo', spec: BANJO_OPEN, posture: 'standing' },
];

const STAND = ['sdcCard', 'instDynCard'];

export function c05aZoneSpecs(sc: GuitarScene): ZoneSpec[] {
  const pot = sc.variant.spec.body.pot!;
  const cx = pot.cx.mm;
  const R = pot.d.mm / 2;
  return [
    {
      id: 'centre',
      label: 'Close, in front of the head’s centre',
      band: 'Start about 7.5 cm (3 in) out from the centre of the head.',
      kind: 'sourced',
      src: 'S-LIVE',
      quote: '3 inches from center of head',
      bandProv: ill('"3 inches": drawn as 6–9 cm'),
      surface: 'hole',
      distance: { min: 60, max: 90 },
      radial: { max: 45, prov: ill('"center of head": within 4.5 cm of the centre line') },
      aimAtR: { r: 70, prov: ill('aimed at the head near its centre') },
      micTypeIds: STAND,
      // 7.6 cm out, 4.2 cm toward the neck from the head's centre line (inside
      // the 4.5 cm "centre" allowance): the bridge sits a third of the way in
      // from the tail rim, so the centre is under the picking fingers (round 2).
      start: { d: 76, dx: 42 },
      tendency: 'Note attack and the head’s projection, close and clear. Too close can overstate the head or the pick’s transients; a small move changes it a lot.',
      checks: ['Clear of the picking hand and the forearm on the rim', 'A hard, papery head sound', 'How it changes as the player moves'],
    },
    {
      id: 'edge',
      label: 'Close, in front of the head’s edge',
      band: 'Start about 7.5 cm (3 in) out from the edge of the head, at the tailpiece end.',
      kind: 'sourced',
      src: 'S-LIVE',
      quote: '3 inches from edge of head',
      bandProv: ill('"3 inches": drawn as 6–9.5 cm over the tail-side edge (which edge is not stated: the lab draws the one clear of both hands)'),
      surface: 'top',
      distance: { min: 60, max: 95 },
      aimMax: { deg: 40, prov: ill('facing the head: within 40° of straight onto it') },
      micTypeIds: STAND,
      boxG: { min: { x: cx - R - 10, y: -45, z: 60 }, max: { x: cx - R + 50, y: 45, z: 95 }, prov: ill('over the head’s tail-side edge') },
      start: { dx: cx - R + 20, d: 76, aimAt: { x: cx - R + 40, y: 0, z: 0 } },
      tendency: 'A different balance from the centre — often a little less of the head’s punch and more of its ring. Compare the two at matched levels.',
      checks: ['Clear of the tailpiece and the forearm', 'Compare with the centre position', 'The resonator or open back changes it'],
    },
    {
      id: 'joint',
      label: 'Aimed where the neck meets the pot, a little farther',
      band: 'Start about 30–40 cm (12–16 in) out from where the neck meets the pot, aimed at that junction.',
      kind: 'trial',
      src: 'DPA-BANJO',
      quote: 'Try aiming the mic at the sweet spot, which is often where the neck meets the body.',
      bandProv: { kind: 'trial', src: 'DPA-BANJO', note: '"two omnis at 30-40 cm (12-16 in) distance" read as a one-mic distance (the lesson’s trial; "distance" may mean the pair’s spacing)' },
      surface: 'joint',
      distance: { min: 300, max: 400 },
      radial: { max: 110, prov: ill('aimed at the junction from roughly in front: within 11 cm of its line') },
      aimAtR: { r: 120, prov: ill('aimed at the junction') },
      micTypeIds: STAND,
      start: { d: 340, dx: -20 },
      tendency: 'A blend of strings, fingers and the ringing head — a balanced first view. Farther back brings the room and the band in, too.',
      checks: ['Clear of the fretting hand and the neck', 'Room and bleed as the distance grows', 'How it changes as the player moves'],
    },
    {
      id: 'clip',
      label: 'A mini mic clipped by the tailpiece, aimed at the bridge',
      band: 'Start with the mini mic clipped at the tailpiece end, about 3–7 cm (1–3 in) over the head, aimed along it at the bridge.',
      kind: 'sourced',
      src: 'S-LIVE',
      quote: 'Miniature microphone clipped to tailpiece aiming at bridge',
      bandProv: ill('no height is given: 3–7 cm over the head is the lab’s drawing'),
      surface: 'top',
      distance: { min: 30, max: 70 },
      aimAtR: { r: 45, prov: ill('aiming at the bridge: the axis reaches the bridge’s plane within 4.5 cm of it'), surface: 'bridge' },
      micTypeIds: ['clipCond'],
      boxG: { min: { x: cx - R + 40, y: -40, z: 30 }, max: { x: cx - 30, y: 40, z: 70 }, prov: ill('between the tailpiece and the head’s centre: the lab’s drawing') },
      // At the tailpiece's end (it reaches to ~35 mm behind the bridge), 4.5 cm
      // over the head, aimed along it at the bridge (round 2: was cx − R + 85,
      // 7 mm past the old tailpiece's end).
      start: { dx: cx - R + 55, d: 45, aimAt: { x: 0, y: 0, z: 10 } },
      tendency: 'Close, steady and moving with the banjo — a stage option. It hears a small, bright view; check it is not all bridge and pick.',
      checks: ['An approved clip, with the player’s OK — never on the strings, bridge or head', 'The picking hand', 'The cable, strain-relieved'],
    },
  ];
}
