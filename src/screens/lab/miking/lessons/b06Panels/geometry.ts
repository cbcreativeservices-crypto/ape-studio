/**
 * B06 PANELS, PRESS CONFERENCES AND GROUPS — where things are (charter §2
 * layer 2). Frame V on the FOCUS TALKER (the lip point at the origin, +x
 * straight out of the mouth toward the audience, +y DOWN, +z to their right,
 * mm). Two set-ups (the variants):
 *
 *   panel    A PANEL: four seated panelists in a row behind a skirted table,
 *            all facing the audience — the focus panelist second from the
 *            left (the others 70 cm apart along the table), a gooseneck on a
 *            table base in front of each, a shared boundary mic on the table
 *            between the focus panelist and the next.
 *   lectern  A PRESS CONFERENCE: the presenter standing at a lectern (the
 *            voice family's standing figure) with a gooseneck on the lectern;
 *            a fixed question mic on a stand in the front aisle, 1.6 m out and
 *            1 m to the presenter's right, a member of the press at it; the PA at
 *            the stage's front corner.
 *
 * Sources: docs/labs/miking/panels_press/SOURCES.md, GEOMETRY_PROPOSAL.md
 * (correction B06-1: the lectern gooseneck 10–14 in, a little off-centre).
 * Every position is a DRAWING DEFAULT (owner items: table, seat pitch,
 * lectern): the table, the seat pitch, the bases, the lectern's height and
 * slope, the aisle, the PA.
 */
import type { InstrumentModel, Part, Provenance, Rim, Variant, Vec3, ViewBox } from '../../engine/model/types.ts';
import { EAR, EAR_HALF, VOICE_DIMS } from '../shared/voice/voiceSpec.ts';
import { SINGER_SOLIDS } from '../shared/voice/voicePose.ts';
import { DESK_TOP_Y, HOST, SEATED, SEATED_FLOOR, solidOnTalker, talkerAnchor, type Talker } from '../shared/broadcast/talkerPose.ts';
import { FIGURE, REACH_PART, VOICE_IDS, talkerIds, talkerParts, talkerVoice } from '../shared/broadcast/talkerModel.ts';
import type { LecternSpec } from '../shared/broadcast/BroadcastArt';

const ill = (reason: string): Provenance => ({ kind: 'illustrative', reason });
const v3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
const DD = ill('a drawing default (panels_press/GEOMETRY_PROPOSAL.md §1; owner list: table, seat pitch, lectern)');

/* ── the panel ── */
/** The seat pitch along the table (drawing default). */
export const PITCH = 700;
export const FOCUS: Talker = HOST;
export const P1: Talker = { id: 'p1', lip: v3(0, 0, -PITCH), facing: 1 };
export const P3: Talker = { id: 'p3', lip: v3(0, 0, PITCH), facing: 1 };
export const P4: Talker = { id: 'p4', lip: v3(0, 0, 2 * PITCH), facing: 1 };
export const IDS_P1 = talkerIds('p1');
export const IDS_P3 = talkerIds('p3');
export const IDS_P4 = talkerIds('p4');
export const TABLE = { min: v3(SEATED.deskEdge.mm, DESK_TOP_Y, -PITCH - 420), max: v3(760, DESK_TOP_Y + SEATED.deskThick.mm, 2 * PITCH + 420) };
/** A gooseneck's table base in front of each panelist, a little to their
 *  left (the paper and the hands on their right); the grip is the neck's
 *  foot on the base. */
export const BASE_DX = 330;
export const BASE_DZ = -210;
export const gooseBase = (t: Talker): Vec3 => v3(t.lip.x + BASE_DX, DESK_TOP_Y - 30, t.lip.z + BASE_DZ);
/** The shared boundary on the table between the focus panelist and P3. */
export const BOUNDARY_AT = v3(300, DESK_TOP_Y, PITCH / 2);

/* ── the lectern ── */
export const STAND_FLOOR = VOICE_DIMS.lipStanding.mm;
/** The lectern: its reading top 37–43 cm below the lips sloping down toward
 *  the presenter, 15–60 cm in front, 56 cm wide; the gooseneck's socket at
 *  its front-left corner. */
export const LECTERN: LecternSpec = { x0: 150, x1: 600, top: 370, z: 0, halfW: 280, floor: STAND_FLOOR, socket: v3(380, 380, -200) };
/** The member of the press at the aisle mic, facing the presenter. */
export const ASKER: Talker = { id: 'asker', lip: v3(1600, 0, 1000), facing: -1 };
export const IDS_ASK = talkerIds('ask');
/** The PA at the stage's front corner (lectern), facing the audience. */
export const PA_C = v3(1500, STAND_FLOOR - 1700, -1500);

export const B06_VARIANTS: Variant[] = [
  { id: 'panel', label: 'PANEL', blurb: 'A panel: four seated panelists in a row behind a table, each with a gooseneck on a table base, a shared boundary mic between two of them.', phrase: 'on a panel at a table' },
  { id: 'lectern', label: 'LECTERN', blurb: 'A press conference: the presenter standing at a lectern with a gooseneck, a question mic in the aisle, the PA at the stage’s corner.', phrase: 'at a lectern, with a question mic' },
];

export const B06_VIEWS: Record<'panel' | 'lectern', { side: ViewBox; top: ViewBox }> = {
  panel: { side: { u0: -520, u1: 1100, v0: -560, v1: 1260 }, top: { u0: -520, u1: 1100, v0: -1250, v1: 1950 } },
  lectern: { side: { u0: -520, u1: 2000, v0: -1050, v1: 1600 }, top: { u0: -520, u1: 2000, v0: -1800, v1: 1450 } },
};

const S = SINGER_SOLIDS;
const panelVoice = [talkerVoice(FOCUS, VOICE_IDS, ['panel', 'lectern']), talkerVoice(P1, IDS_P1, ['panel']), talkerVoice(P3, IDS_P3, ['panel']), talkerVoice(P4, IDS_P4, ['panel'])];
const askVoice = talkerVoice(ASKER, IDS_ASK, ['lectern']);
const goose = (t: Talker, id: string, variants: string[]): Rim => ({ id, label: 'a gooseneck’s base', c: gooseBase(t), axis: v3(0, -1, 0), r: 0, variants, types: ['bcGoose', 'bcGooseSuper'] });

/** The focus panelist's body: seated at the panel, standing at the lectern. */
const focusSeated = talkerParts(FOCUS, VOICE_IDS, { who: 'the panelist' }, ['panel']).map((p) => (p.id === 'v.mouth' || p.id === 'v.nose' || p.id === 'v.head' ? { ...p, variants: undefined } : p));
const parts: Part[] = [
  ...focusSeated.filter((p) => p.id !== 'v.chest' && p.id !== 'player.neck'),
  { id: 'v.chest', label: 'chest and shoulders', short: 'chest', role: 'The voice is read from the mouth, not the chest; a body mic would clip here — with the talker’s agreement.', solid: S.torso, prov: FIGURE },
  { id: 'player.neck', label: 'neck', short: 'neck', role: 'The neck, chin to collar.', solid: S.neck, listIn: [], prov: FIGURE },
  { id: 'player.standLegs', label: 'the presenter’s legs and feet', short: 'legs', role: 'Standing behind the lectern: cables and stands clear of the feet.', solid: S.legs, listIn: [], variants: ['lectern'], prov: FIGURE },
  ...talkerParts(P1, IDS_P1, { who: 'the panelist on the left' }, ['panel']),
  ...talkerParts(P3, IDS_P3, { who: 'the panelist on the right', headRole: 'The next panelist, 70 cm away: their voice reaches every open mic near them — later and lower.' }, ['panel']),
  ...talkerParts(P4, IDS_P4, { who: 'the far panelist' }, ['panel']),
  { id: 'b6.table', label: 'the panel table', short: 'table', role: 'A hard top with a cloth skirt on the audience side: it carries the gooseneck bases and a shared boundary mic — and papers, hands and knocks travel through it.', solid: { kind: 'box', ...TABLE }, variants: ['panel'], prov: DD },
  { id: 'b6.base', label: 'a gooseneck’s table base', short: 'base', role: 'A weighted base with a mute key and a light: away from the papers and the hands, so knocks stay out of the neck.', variants: ['panel'], prov: DD },
  { id: 'b6.lectern', label: 'the lectern', short: 'lectern', role: 'Its reading top slopes toward the presenter; the gooseneck rises from its corner, out of the presenter’s sight line and the paper’s path.', solid: { kind: 'box', min: v3(LECTERN.x0, LECTERN.top + 10, -LECTERN.halfW), max: v3(LECTERN.x1, STAND_FLOOR, LECTERN.halfW) }, variants: ['lectern'], prov: DD },
  { id: 'ask.head', label: 'the member of the press', short: 'press', role: 'At the fixed aisle mic, facing the stage: their question reaches the stream and the press feed only through that mic.', solid: solidOnTalker(ASKER, S.head), variants: ['lectern'], prov: FIGURE },
  { id: 'ask.mouth', label: 'the questioner’s mouth', short: 'mouth', role: 'Where the question leaves: the aisle mic is measured from here.', listIn: [], variants: ['lectern'], prov: FIGURE },
  { id: 'ask.chest', label: 'the questioner’s chest', short: 'chest', role: 'Standing at the aisle mic.', solid: solidOnTalker(ASKER, S.torso), listIn: [], variants: ['lectern'], prov: FIGURE },
  { id: 'ask.legs', label: 'the questioner’s legs', short: 'legs', role: 'Standing in the aisle.', solid: solidOnTalker(ASKER, S.legs), listIn: [], variants: ['lectern'], prov: FIGURE },
  { id: 'b6.pa', label: 'the PA loudspeaker', short: 'PA', role: 'It faces the audience; every open mic on the stage hears its back and side. Fewest open mics, and the pattern’s rejection toward it.', variants: ['lectern'], prov: DD },
  REACH_PART,
];

const rims: Rim[] = [
  goose(FOCUS, 'goose.focus', ['panel']),
  goose(P1, 'goose.p1', ['panel']),
  goose(P3, 'goose.p3', ['panel']),
  goose(P4, 'goose.p4', ['panel']),
  { id: 'goose.lectern', label: 'the lectern’s gooseneck socket', c: LECTERN.socket, axis: v3(0, -1, 0), r: 0, variants: ['lectern'], types: ['bcGoose', 'bcGooseSuper'] },
  { id: 'clip.ear', label: 'a headset over the presenter’s right ear', c: v3(EAR.x, EAR.y, EAR_HALF), axis: v3(0, 0, 1), r: 0, variants: ['lectern'], types: ['vocHeadset'] },
];

export const B06_MODEL: InstrumentModel = {
  id: 'b06-panels',
  name: 'a panel and a lectern',
  parts,
  regions: [...panelVoice.flatMap((v) => v.regions), ...askVoice.regions],
  surfaces: [...panelVoice.map((v) => v.surface), askVoice.surface],
  lines: [...panelVoice.map((v) => v.line), askVoice.line],
  envelopes: [],
  variants: B06_VARIANTS,
  defaultVariant: 'panel',
  views: B06_VIEWS.panel,
  viewsByVariant: { panel: B06_VIEWS.panel, lectern: B06_VIEWS.lectern },
  fitAuthored: { side: true, top: true },
  setupFrameMaxByVariant: {
    panel: { side: { u0: -420, u1: 900, v0: -480, v1: 720 }, top: { u0: -420, u1: 900, v0: -700, v1: 1150 } },
    lectern: { side: { u0: -420, u1: 1800, v0: -480, v1: 1600 }, top: { u0: -420, u1: 1800, v0: -700, v1: 1250 } },
  },
  yFloor: { mm: SEATED_FLOOR, prov: { kind: 'unknown', needed: 'the floor below a seated panelist’s lips (talkerPose)' }, placeholder: true },
  yFloorByVariant: { panel: SEATED_FLOOR, lectern: STAND_FLOOR },
  interior: { x0: 0, x1: 0, rIn: 0, c: v3(0, 0, 0) },
  rims,
  ports: { panel: null, lectern: null },
  mountRule: { boom: 'level', fallback: v3(1, 0, 0), length: 300 },
  aimAzLimit: 180,
  viewTags: { side: 'SIDE · FROM THE PANELIST’S RIGHT', top: 'TOP · FROM ABOVE' },
  labelMinScale: 0.07,
};

export const V_ASKER = talkerAnchor(ASKER);
export const V_P3 = talkerAnchor(P3);
