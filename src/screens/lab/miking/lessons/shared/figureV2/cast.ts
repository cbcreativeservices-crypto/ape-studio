/**
 * FIGURE V2 — THE CAST (wave 3 of D78; owner 2026-11-23, quick pick "Small
 * cast": not everyone is the drummer). A small cast of five people, women and
 * men, drawn in the one approved style; each ROLE always gets the same person
 * (the table below, by role key — never random, never by render order), so a
 * lesson looks the same every time. Cast member one is the kit drummer,
 * unchanged.
 *
 * What differs between people (the figure standard: real proportions, decent
 * neutral clothing — long sleeves and trousers, as the drummer — no hats,
 * glasses or jewelry; the women told apart by hair, face and build, never by
 * exaggeration):
 *   • skin: a tone set (the limbs' ramp, the head's own only-darkening ramp,
 *     the hand's light, the lips);
 *   • hair: a style (sidePlan HairStyle) and a natural color — never gray,
 *     white or silver (owner 2026-11-23: "no gray hair");
 *   • face: the drummer's profile, or a finer one (a little shorter nose, a
 *     finer brow, the eyes open and level, not lowered to a snare);
 *   • clothes: shirt, trousers and shoes in muted colors.
 * Pure: no React, no Skia.
 */
import { DRUMMER_LOOK, clothOf, type Look } from './look';
import type { Material } from './palette.ts';

import type { BodyBuild, HeadStyle } from './sidePlan.ts';
export type { FaceStyle, HairStyle, HeadStyle } from './sidePlan.ts';

export type CastId = 'drummer' | 'ana' | 'ruth' | 'kofi' | 'mei';
/** `body`: the person's build and dress (sidePlan BodyBuild); the drummer has none — his approved body. */
export type CastMember = { id: CastId; name: string; woman: boolean; head: HeadStyle; look: Look; body?: BodyBuild };

const POS = [0, 0.2, 0.52, 0.8, 1];
const m = (form: string[], rim: string, edge: string, deep: string): Material => ({ form, pos: POS, rim, edge, deep });

/* ── skin tone sets (the limbs' ramp; the head's only-darkening ramp; the hand's light) ── */
type SkinSet = { skin: Material; head: string[]; hand: string[]; lip: string; nail: { fill: string; edge: string } };
const SKIN_LIGHT_WARM: SkinSet = {
  skin: m(['#dcbea2', '#c5a084', '#a37e66', '#755545', '#8a6650'], '#f4e0cc', '#4e3426', '#3c281e'),
  head: ['#dcbea2', '#cfae92', '#bf9c80', '#ad8a6e', '#a1806a'],
  hand: ['#d6b598', '#c5a084', '#a37e66', '#82604c'],
  lip: '#9a5f50',
  nail: { fill: '#e2c6b2', edge: '#80614f' },
};
const SKIN_MEDIUM: SkinSet = {
  skin: m(['#bf8f6b', '#a07253', '#80573f', '#583a2a', '#6b4835'], '#e6c3a3', '#3a2418', '#2a190f'),
  head: ['#bf8f6b', '#b18262', '#a17456', '#8f654a', '#855c43'],
  hand: ['#b98a66', '#a07253', '#80573f', '#5f3f2e'],
  lip: '#7f4a3c',
  nail: { fill: '#d4ad92', edge: '#6a4532' },
};
const SKIN_DEEP: SkinSet = {
  skin: m(['#86604a', '#6b4a37', '#53382a', '#33221a', '#452e22'], '#c09a80', '#1c110b', '#140b07'),
  head: ['#86604a', '#7b5743', '#6e4d3a', '#614332', '#5a3e2f'],
  hand: ['#81604b', '#6b4a37', '#53382a', '#3b281e'],
  lip: '#5a3428',
  nail: { fill: '#b8957f', edge: '#4a3022' },
};
const SKIN_FAIR: SkinSet = {
  skin: m(['#e3c7b4', '#cba893', '#ab8672', '#7f5f4e', '#91705c'], '#f8e8da', '#553a2d', '#412c22'),
  head: ['#e3c7b4', '#d7b8a2', '#c8a68f', '#b6937c', '#ab8a74'],
  hand: ['#ddc0ab', '#cba893', '#ab8672', '#876552'],
  lip: '#a46a5e',
  nail: { fill: '#e8cfbf', edge: '#836555' },
};

/* ── hair colors ── */
const HAIR_BLACK = m(['#4a4440', '#2e2a27', '#1d1a18', '#0f0d0c', '#1a1716'], '#8a827b', '#0a0908', '#070606');
const HAIR_DARK_BROWN = m(['#5c4535', '#3e2d22', '#2a1e17', '#16100c', '#231912'], '#97806e', '#0e0a07', '#0a0705');
const HAIR_AUBURN = m(['#80563f', '#633f2c', '#482d1f', '#26160f', '#372217'], '#b48c74', '#140b07', '#0e0805');

/* ── clothes (muted) ── */
const SHIRT_TEAL = m(['#7f9d98', '#607e7a', '#46615e', '#2c3e3c', '#3b5351'], '#bcd2ce', '#121a19', '#0f1615');
const SHIRT_BURGUNDY = m(['#a2808a', '#825e68', '#64444d', '#40292f', '#53363d'], '#d6bcc3', '#1b1013', '#150c0f');
const SHIRT_SAND = m(['#b5a990', '#958972', '#766b55', '#4c4436', '#5f5645'], '#ddd3bd', '#1c1913', '#16130e');
const SHIRT_RUST = m(['#b08a76', '#906a57', '#704f40', '#473127', '#5a3f33'], '#dcc2b4', '#1c120e', '#160e0b');
const TROUSERS_NAVY = m(['#565f71', '#414958', '#2f3541', '#1b1f27', '#262b35'], '#8d97a8', '#0d0f13', '#0a0b0f');
const TROUSERS_CHARCOAL = m(['#5f6166', '#47494e', '#333539', '#1e1f22', '#29292d'], '#93959b', '#0f1011', '#0b0c0d');
const TROUSERS_UMBER = m(['#635c53', '#4b453e', '#36322d', '#201e1b', '#2c2925'], '#9a9287', '#100f0d', '#0c0b0a');
const TROUSERS_BLACK = m(['#4a4b50', '#37383c', '#27282b', '#16171a', '#1f2023'], '#86888e', '#0b0b0d', '#08080a');
const SHOES_BLACK = m(['#4b4a4c', '#323133', '#212022', '#0f0f10', '#1b1a1c'], '#9d9b9f', '#070707', '#050505');
const SHOES_BROWN = DRUMMER_LOOK.MAT.leather;

/* ── jackets (the dress variant, wave 3 piece 2): dark neutral wool tones, each clearly apart from the
 *  person's trousers and from the dark lab glass, suiting their own colors ── */
const JACKET_NAVY = m(['#5f6a86', '#48526c', '#353d53', '#1f2435', '#2b3246'], '#9aa6c0', '#0b0d14', '#080a10');
const JACKET_MOCHA = m(['#85776a', '#685b4f', '#4f443a', '#2f2822', '#3e352d'], '#beb1a3', '#12100d', '#0d0b09');
const JACKET_SLATE = m(['#67707c', '#4f5763', '#3c434d', '#23272e', '#2f353d'], '#a3acb8', '#0d0f12', '#090b0d');
const JACKET_TAUPE = m(['#716b64', '#58534d', '#433f3a', '#272522', '#34312d'], '#aaa49c', '#0f0e0c', '#0b0a09');

function lookOf(skin: SkinSet, hair: Material, shirt: Material, trousers: Material, leather: Material, jacket?: Material): Look {
  return {
    MAT: { skin: skin.skin, hair, shirt, trousers, leather },
    HEAD_SKIN: { ...skin.skin, form: skin.head },
    CLOTH: clothOf(trousers),
    LIP: skin.lip,
    NAIL: skin.nail,
    HAND: skin.hand,
    ...(jacket ? { JACKET: jacket } : {}),
  };
}

/** THE CAST. */
export const CAST: Readonly<Record<CastId, CastMember>> = {
  // 1. the kit drummer, exactly as approved
  // (standing in the cast's pictures he wears a medium build; the kit drummer's own approved pictures
  // do not read the cast — kitDrummerV2 — and are unchanged)
  drummer: { id: 'drummer', name: 'the drummer', woman: false, head: { hair: 'short', face: 'drummer' }, look: DRUMMER_LOOK, body: { chest: 1, back: 1, waist: 1, hip: 1, shoulder: 1, limb: 1, tucked: true, collar: 'crew' } },
  // 2. a woman, medium-brown skin, dark hair pulled back to a low ponytail, a teal shirt
  ana: { id: 'ana', name: 'Ana', woman: true, head: { hair: 'pony', face: 'fine' }, look: lookOf(SKIN_MEDIUM, HAIR_BLACK, SHIRT_TEAL, TROUSERS_NAVY, SHOES_BLACK, JACKET_TAUPE), body: { chest: 0.95, back: 0.95, waist: 0.92, hip: 1.05, bust: 6, shoulder: 0.93, limb: 0.96, tucked: false, collar: 'crew' } },
  // 3. a woman, fair skin, auburn hair in a chin-length bob, a burgundy shirt
  ruth: { id: 'ruth', name: 'Ruth', woman: true, head: { hair: 'bob', face: 'fine' }, look: lookOf(SKIN_FAIR, HAIR_AUBURN, SHIRT_BURGUNDY, TROUSERS_CHARCOAL, SHOES_BLACK, JACKET_MOCHA), body: { chest: 1.0, back: 1.0, waist: 1.04, hip: 1.1, bust: 7, shoulder: 0.96, limb: 1.05, tucked: true, collar: 'shirt' } },
  // 4. a man, deep brown skin, close-cropped black hair, a sand shirt
  kofi: { id: 'kofi', name: 'Kofi', woman: false, head: { hair: 'crop', face: 'open' }, look: lookOf(SKIN_DEEP, HAIR_BLACK, SHIRT_SAND, TROUSERS_UMBER, SHOES_BROWN, JACKET_NAVY), body: { chest: 0.98, back: 1.08, waist: 1.0, hip: 1.0, shoulder: 1.05, limb: 1.03, tucked: false, collar: 'shirt' } },
  // 5. a woman, light warm skin, dark-brown hair in a low bun, a muted rust shirt
  mei: { id: 'mei', name: 'Mei', woman: true, head: { hair: 'bun', face: 'fine' }, look: lookOf(SKIN_LIGHT_WARM, HAIR_DARK_BROWN, SHIRT_RUST, TROUSERS_BLACK, SHOES_BLACK, JACKET_SLATE), body: { chest: 0.92, back: 0.92, waist: 0.88, hip: 1.0, bust: 5, shoulder: 0.9, limb: 0.92, tucked: true, collar: 'crew' } },
};

/**
 * THE ROLES — one table, one place: every role key the app draws a person for,
 * and the person who plays it. A role is named by WHAT the person is in the
 * lessons (the talker's id where the broadcast lessons name one), so the same
 * role is the same person in every lesson.
 */
export const ROLES = {
  // the kit (waves 1–2): the drummer
  'kit.drummer': 'drummer',
  // the voice family's singer (VoiceFigure: e01, e03, e07; the lectern b06, the booth b07)
  'voice.singer': 'ana',
  // the broadcast talkers, by the talker's own id (talkerPose / standing)
  'talker.host': 'kofi', // b01 host, b02 anchor, b06 focus, b07 reader, b09 caller
  'talker.hostB': 'ruth', // b01 co-host
  'talker.guest': 'mei', // b02 guest, b03 / b10 guest, b07 guest
  'talker.asker': 'ruth', // b06 the asker
  'talker.analyst': 'mei', // b09 analyst
  'talker.reporter': 'ana', // b03 / b10 reporter
  'talker.wearer': 'kofi', // b11 the body-worn wearer
  // the presenter in a jacket (b04, b05)
  'presenter': 'ruth',
  // B06's panel, left to right P1 · FOCUS (the host, Kofi) · P3 · P4: neighbors are different people
  'talker.p1': 'mei',
  'talker.p3': 'drummer',
  'talker.p4': 'ruth',
  // B06's presenter at the lectern
  'lectern.presenter': 'ana',
  // (wave 7, outside Miking) Game Audio: YOU, the listener on the map, the 5.1 listener and the HUD's
  // head; the guide, the other player a page shows beside YOU
  'ga.you': 'kofi',
  'ga.guide': 'mei',
  // (wave 7) Speaker Coverage's band from above: the guitarist and the bassist beside the singer
  'coverage.guitar': 'ruth',
  'coverage.bass': 'kofi',
  // (wave 3, sets 3b–3d: the players) one person per lesson's player
  'player.timpani': 'kofi', // m06
  'player.bassDrum': 'ruth', // m07a
  'player.cajon': 'drummer', // i02 (the approved hand-drum hand, drawn on the plate from above, wears his skin)
  'foley.performer': 'mei', // f01–f05
  // (wave 5, the families with their own figure) the bowed strings: c09a, c09b, c09c, c06a/b
  'bowed.violin': 'ana',
  'bowed.viola': 'ruth',
  'bowed.cello': 'kofi',
  'bowed.bass': 'mei',
  // a setting plan's neighbor who plays the lesson's own instrument (a second violin, viola, cello)
  'bowed.second': 'drummer',
  // the brass: a01 trumpet and flugelhorn, a02 trombones; a plan's second player of the same horn
  'brass.trumpet': 'ruth',
  'brass.trombone': 'drummer',
  'brass.second': 'kofi',
  // the low brass: a03 horn, a04a tuba, a04b euphonium; a plan's second player of the same instrument
  'lowbrass.horn': 'ana',
  'lowbrass.tuba': 'kofi',
  'lowbrass.euph': 'mei',
  'lowbrass.second': 'drummer',
  // the saxophones: a05a soprano, a05b alto, a05c tenor, a05d baritone; a plan's second player of the same horn
  'sax.soprano': 'ana',
  'sax.alto': 'ruth',
  'sax.tenor': 'drummer',
  'sax.baritone': 'kofi',
  'sax.second': 'mei',
  // the woodwinds, each lesson's own player (its section seat's person: windFigureV2 WIND_SEATS)
  'wind.flute': 'ana',
  'wind.piccolo': 'drummer',
  'wind.clarinet': 'ruth',
  'wind.bassClarinet': 'kofi',
  'wind.oboe': 'mei',
  'wind.bassoon': 'drummer',
  // the small percussion (i03a–c, i04, i05a–d)
  'smallperc.player': 'ruth',
  // the lutes: c13 oud, c14 sitar, c15 veena
  'lute.oud': 'kofi',
  'lute.sitar': 'ana',
  'lute.veena': 'mei',
  // the free reeds: a10 harmonica, a11 accordion
  'freereed.harmonica': 'kofi',
  'freereed.accordion': 'ruth',
  // (wave 3 set 3b, the operators) the person running a measurement (f11, f14, f15, f16: one per lesson)
  'operator.measure': 'ana',
  // (wave 3 set 3b) the public in a field site (f06 plaza), by the person's place in the site's list
  'site.public0': 'kofi',
  'site.public1': 'mei',
  'site.public2': 'ruth',
  'site.public3': 'drummer',
  'site.public4': 'ana',
  // (f06) the voice swept round the pair on the plaza (a person not among the five above is impossible
  // with a cast of five: it is Mei, the plaza's second passer-by, standing elsewhere — see the report)
  'site.voice': 'mei',
  // (wave 7, SVG screens) Room Design's seated listener; Sound Systems' performers on the venue's stage
  // slots (the riser is the drum riser: the drummer) and the singer at the monitor-feedback mic
  'room.listener': 'mei',
  'venue.stageC': 'ana',
  'venue.stageL': 'kofi',
  'venue.stageR': 'ruth',
  'venue.riserC': 'drummer',
  'monitor.performer': 'ana',
  // (wave 6, plan markers behind `v2`: the default when a lesson switches a marker on without naming its
  // own player — a lesson passes the person who plays it on its other pages)
  'plan.handDrums': 'kofi',
  'plan.keys': 'ruth',
  'plan.steel': 'mei',
  'plan.clavinet': 'mei',
  // (wave 7, the front view for scale) Foundations' wavelength ruler; Wave Physics' standing listener;
  // the EQ lab's camera analogy; Cable Install's person for scale
  'foundations.person': 'ruth',
  'wave.listener': 'kofi',
  'eq.person': 'ana',
  'cable.person': 'kofi',
  'cable.person2': 'ana',
  // (wave 7) the sports lessons' parabolic-dish operator (B08, B12–B17, F14)
  'sports.dish': 'kofi',
  // (wave 7) B14's clapper over the boundary mic (not the dish operator: another person)
  'sports.clapper': 'mei',
  // (wave 4, FrontAndBoom) the boom operator (b04, b11, f09: never the lesson's own talker — Ruth, Kofi,
  // Ana) and B04's interviewer in its Two Talkers step (beside Ruth, the presenter)
  'operator.boom': 'mei',
  'talker.interviewer': 'kofi',
  // (the Players builder) the mallet keyboards' player, one per lesson: i07 vibraphone, i08 marimba, i09 xylophone,
  // i10 glockenspiel
  'player.vibe': 'kofi',
  'player.marimba': 'ana',
  'player.xylo': 'ruth',
  'player.glock': 'mei',
  // (step B round 2, the held arm) B10's post-event boom operator: Mei is B10's guest and Ana its reporter
  'operator.boomB10': 'ruth',
  // (the Players builder, set 3c) the guitar family's players, one per lesson: c01 guitar, c03 resonator,
  // c05a banjo, c05b mandolin, c05c ukulele, c07 acoustic bass
  'player.guitar': 'kofi',
  'player.resonator': 'drummer',
  'player.banjo': 'ana',
  'player.mandolin': 'mei',
  'player.ukulele': 'ruth',
  'player.acousticBass': 'kofi',
  // (wave 3, set 3d) the players on and near the floor
  'player.tonbak': 'kofi', // m12, on a chair
  'player.tabla': 'ana', // m13, cross-legged on the floor
  'player.piano': 'mei', // c11 (set 3c)
  'player.wurli': 'kofi', // i11b (set 3c)
  'player.harp': 'ruth', // c10 (set 3c)
  // (Foley3) the hand-held boom pole's operator in F02 (the performer is Mei) and F08 (the walker is Kofi, the
  // vehicle plan's crew Kofi and Mei): Ruth
  'operator.boomFoley': 'ruth',
  // (Foley3) F10 Spatial Field: the street singer and the event's performer (the voice family's singer), the
  // walker crossing the plaza, the listener at the listener's point (and the in-ear wearer, the same person)
  'spatial.singer': 'ana',
  'spatial.walker': 'kofi',
  'spatial.listener': 'mei',
  // (Ensembles2) the conductor of every seating that has one (E05, E06, E11, E13, E14) and on the wind plans' podium
  'ensemble.conductor': 'kofi',
  // (Metal) the suspended-metal players, one per lesson: i06a triangle, i12 gong; i06b finger cymbals and i06c
  // bar chimes keep the approved hand-drum hand on their face-on pages (it wears his skin and sleeve): the drummer
  'metal.triangle': 'mei',
  'metal.fingerCymbals': 'drummer',
  'metal.barChimes': 'drummer',
  'metal.gong': 'ana',
} as const satisfies Record<string, CastId>;

export type RoleKey = keyof typeof ROLES;

/** The person who plays a role. */
export function castFor(role: RoleKey): CastMember {
  return CAST[ROLES[role]];
}

/** The role key of a broadcast talker (by its id); an id not in the table is the host's. */
export function talkerRole(id: string): RoleKey {
  const k = `talker.${id}` as RoleKey;
  return k in ROLES ? k : 'talker.host';
}
