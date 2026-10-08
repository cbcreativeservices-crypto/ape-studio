/**
 * BROADCAST MICROPHONES AND MOUNTS — Lab 7 (broadcast speech). Generic types;
 * the products their sizes and patterns come from stay in `examples` and
 * every `prov` — the INTERNAL record (owner ruling 2026-10-04: no brand or
 * model on screen). Merged into MIC_TYPES by data/micTypes.ts (one "Lab 7"
 * block). Source keys: docs/labs/miking/radio_host/SOURCES.md §0 (the Lab 7a
 * register) and lead_vocal/SOURCES.md §0 (Lab 5 keys).
 *
 * GROUP 1 (B01, B07, B06) — built here:
 *   bcDynArm    an end-address broadcast dynamic on a desk-clamped spring arm
 *               (cardioid; S-SM7B-UG: spoken into "directly", 1–6 in);
 *   bcDynSuper  the same shape, supercardioid (a textbook pattern: the
 *               live-desk aiming exercise; S-LIVE's 126° null);
 *   bcDynStand  the same mic on a floor boom stand (a standing reader);
 *   bcLdcArm    a side-address condenser in a shock mount on the desk arm,
 *               with a pop screen (R-POD "about 6 – 8 inches"; N-POP gap);
 *   bcGoose     a small cardioid condenser head on a gooseneck — on a table
 *               base (a panel) or a lectern mount (B06);
 *   bcGooseSuper the same, supercardioid (the lectern aiming exercise);
 *   bcBoundary  a half-cardioid boundary mic lying on the panel table (the
 *               Lab 1 `boundaryHalf` body; "not every boundary mic is omni").
 * REUSED (not redefined): vocDynCard, vocDynSuper, vocLdc, vocLdcOpen,
 * vocHeadset (shared/voice/voiceMics.ts); boundaryHalf, sdcCard, miniOmni
 * (data/micTypes.ts); arrCard (shared/ensemble/ensembleMics.ts).
 *
 * MOUNTS (engine 'clip' mounts with a drawn arm, MicType.clip.style): the
 * DESK ARM is a clamp on the desk with a short riser post; its grip (the
 * post's top, a Rim in the lesson's model) holds a two-segment spring arm
 * whose segment lengths are drawing defaults (DESK_ARM); a GOOSENECK rises
 * from its base (a table base or a lectern mount, a Rim) and bends over into
 * the capsule's tail. The arm and the neck are drawn, never collision-tested
 * (collision.assembly), their reach capped by `clip.reach`.
 *
 * SLOTS FOR GROUPS 2 AND 3 (add their types to BROADCAST_MIC_TYPES below,
 * under their own comment line, keeping these ids so the lessons agree):
 *   G2 (B05, B04, B02): shotgunShort, compactHyper, camMic, lavOmni, lavCard,
 *                       hsCard — FILLED by group 2 (lab7-g2): compactHyper
 *                       (a compact hyper/supercardioid on a fixed boom
 *                       stand), camMic (a short shotgun on the camera's
 *                       shoe, 'surface' on the part 'bc.camera'), lavCard
 *                       (a directional lav), hsCard (a directional headset)
 *                       and bcBoundaryDesk (the table boundary on a desk,
 *                       part 'bc.desk'); shotgunShort and lavOmni are
 *                       Lab 6's (fieldmics SHOTGUN_SHORT; field locLav) —
 *                       reused, never redefined (G2_SLOTS);
 *   G3 (B03, B08):      repOmni.
 */
import type { MicType } from '../../../engine/model/types.ts';
import { VOICE_DIMS } from '../voice/voiceSpec.ts';
import { VOICE_MIC_TYPES } from '../voice/voiceMics.ts';

const dd = (mm: number, needed: string) => ({ mm, prov: { kind: 'unknown', needed } as const, placeholder: true });
const src = (s: string, quote: string) => ({ kind: 'sourced', src: s, quote }) as const;
const ill = (reason: string) => ({ kind: 'illustrative', reason }) as const;

/** The ids groups 2 and 3 own (documented above). Group 2 fills its slots
 *  below or with a type an earlier lab already built (G2_SLOTS). */
/** Group 2's slots → the MIC_TYPES id that fills each (the slot names are
 *  the research's; three are filled by a type an earlier lab built, so
 *  nothing is defined twice). */
export const G2_SLOTS = { shotgunShort: 'shotgunShort', compactHyper: 'compactHyper', camMic: 'camMic', lavOmni: 'locLav', lavCard: 'lavCard', hsCard: 'hsCard' } as const;
export const BROADCAST_MIC_SLOTS = {
  G2: ['shotgunShort', 'compactHyper', 'camMic', 'lavOmni', 'lavCard', 'hsCard'],
  G3: ['repOmni'],
} as const;

/** The desk arm: its two segments and the riser post on its clamp (drawing
 *  defaults — no arm's spec was read; radio_host/GEOMETRY_PROPOSAL §3). */
export const DESK_ARM = {
  lower: dd(420, 'a desk spring arm’s lower segment (grip → elbow)'),
  upper: dd(400, 'a desk spring arm’s upper segment (elbow → mic)'),
  post: dd(120, 'the riser post on the desk clamp'),
} as const;
/** A gooseneck's reach from its base to the capsule's tail (drawing default). */
export const GOOSENECK_REACH = dd(460, 'a conference gooseneck’s reach from its base (drawing default 46 cm)');

/** The broadcast dynamic's body: a long cylinder behind a large foam
 *  windscreen, on a yoke (drawing default — no outline was read). */
const BC_DYN_BODY = { length: dd(190, 'an end-address broadcast dynamic’s length, windscreen on'), radius: dd(30, 'an end-address broadcast dynamic’s radius') };
const BC_DYN_EX = [{ model: 'Shure SM7B class (end-address broadcast dynamic)', fact: 'S-SM7B-UG: "speak directly into the mic 1 to 6 inches (2.54 to 15 cm) away"; cardioid; closer = warmer bass (proximity). R-POD: dynamic "about 4 - 6 inches". Outline not read: drawing default.', src: 'S-SM7B-UG' }];
const ARM_CLIP = { reach: dd(DESK_ARM.lower.mm + DESK_ARM.upper.mm, 'a desk spring arm’s full reach (the two segments)'), style: 'deskArm' as const, elbow: { a: DESK_ARM.lower, b: DESK_ARM.upper } };
const GOOSE_CLIP = { reach: GOOSENECK_REACH, style: 'gooseneck' as const };
const GOOSE_BODY = { length: dd(60, 'a conference gooseneck’s capsule head and its top collar'), radius: dd(9.5, 'a conference gooseneck’s capsule radius') };
const GOOSE_EX = [{ model: 'conference / lectern gooseneck condensers (generic)', fact: 'S-CHURCH: lectern gooseneck "10"-14" and a little off-center from a speaker\'s mouth" (B06-1); S-PODIUM: set gain at "around 7-10 inches". Head and neck sizes not read: drawing defaults.', src: 'S-CHURCH' }];

/** The table boundary's pattern and body (shared by bcBoundary and group
 *  2's bcBoundaryDesk: the same mic on another lesson's desk). */
const BOUNDARY_PATTERN = [{ id: 'halfCardioid' as const, label: 'half-cardioid (hemisphere above the table)', prov: src('S-B91-UG', 'Half-cardioid (cardioid in hemisphere above mounting surface)') }];
const BOUNDARY_BODY = { length: { mm: 139.1, prov: src('S-B91-UG', '139,1 mm') }, radius: { mm: 10.15, prov: src('S-B91-UG', '20,3 mm (height; half of it)') }, width: { mm: 95.11, prov: src('S-B91-UG', '95,11 mm') } };

export const BROADCAST_MIC_TYPES = {
  /* ── Lab 7 group 1 (B01, B07, B06) ── */
  bcDynArm: {
    id: 'bcDynArm',
    label: 'End-address broadcast dynamic on a desk arm, cardioid',
    short: 'BROADCAST DYN',
    transducer: 'dynamic',
    address: 'end',
    patterns: [{ id: 'cardioid', label: 'cardioid', prov: src('S-SM7B-UG', 'Cardioid (polar pattern) — speak directly into the mic') }],
    body: BC_DYN_BODY,
    power: 'none needed (dynamic) — some need a lot of clean gain: check its manual',
    mount: 'clip',
    clip: ARM_CLIP,
    examples: BC_DYN_EX,
    art: 'broadcastDynamic',
    blurb: 'A long end-address dynamic behind a big foam windscreen, on a spring arm clamped to the desk: speak into its END, not its side. Cardioid, so it rejects most directly behind; closer brings more bass (proximity effect). Needs no power.',
  },
  bcDynSuper: {
    id: 'bcDynSuper',
    label: 'End-address broadcast dynamic on a desk arm, supercardioid',
    short: 'BROADCAST SUPER',
    transducer: 'dynamic',
    address: 'end',
    patterns: [{ id: 'supercardioid', label: 'supercardioid', prov: src('S-LIVE', 'supercardioid … least sensitive at 126 degrees off-axis (a textbook pattern for the generic type)') }],
    body: BC_DYN_BODY,
    power: 'none needed (dynamic)',
    mount: 'clip',
    clip: ARM_CLIP,
    examples: [{ model: 'supercardioid broadcast dynamics (generic)', fact: 'S-LIVE: supercardioid least sensitive "at 126 degrees off-axis", a small rear lobe; drawn as the same body as bcDynArm (drawing default).', src: 'S-LIVE' }],
    art: 'broadcastDynamic',
    blurb: 'The same broadcast shape with a tighter, supercardioid pattern: it rejects most toward the rear, about 125° off its front, with a small lobe straight behind — so a monitor goes a little to one side of its rear. Needs no power.',
  },
  bcDynStand: {
    id: 'bcDynStand',
    label: 'End-address broadcast dynamic on a boom stand, cardioid',
    short: 'BROADCAST DYN',
    transducer: 'dynamic',
    address: 'end',
    patterns: [{ id: 'cardioid', label: 'cardioid', prov: src('S-SM7B-UG', 'Cardioid (polar pattern)') }],
    body: BC_DYN_BODY,
    power: 'none needed (dynamic) — some need a lot of clean gain: check its manual',
    mount: 'stand',
    examples: BC_DYN_EX,
    art: 'broadcastDynamic',
    blurb: 'The end-address broadcast dynamic on a floor boom stand, for a reader who stands: speak into its end. Its foam windscreen breaks up some of the air of P and B. Needs no power.',
  },
  bcLdcArm: {
    id: 'bcLdcArm',
    label: 'Side-address condenser in a shock mount on a desk arm, with a pop screen',
    short: 'CONDENSER + SCREEN',
    transducer: 'condenser',
    address: 'side',
    patterns: [{ id: 'cardioid', label: 'cardioid', prov: src('R-POD', 'condenser microphones … about 6 – 8 inches (a cardioid studio condenser)') }],
    body: VOICE_MIC_TYPES.vocLdc.body,
    pop: { gap: VOICE_DIMS.popGap, r: VOICE_DIMS.popR, tilt: VOICE_DIMS.popTilt },
    power: 'phantom power (48 V)',
    mount: 'clip',
    clip: ARM_CLIP,
    examples: [{ model: 'side-address studio condenser on a broadcast arm (generic)', fact: 'R-POD: "about 6 – 8 inches for condenser microphones"; R-RCP2 (Low): side-address "perpendicular". Body: the Lab 5 studio condenser (S-SM4-WEB). Pop screen gap N-POP.', src: 'R-POD' }],
    art: 'vocalLdc',
    blurb: 'A side-address studio condenser in a shock mount on the desk arm: speak to its FACE, marked on the front. Detailed, with the room it is in. A pop screen at least 10 cm in front of it breaks up the puffs of P and B. Needs phantom power.',
  },
  bcGoose: {
    id: 'bcGoose',
    label: 'Small condenser on a gooseneck, cardioid',
    short: 'GOOSENECK',
    transducer: 'condenser',
    address: 'end',
    patterns: [{ id: 'cardioid', label: 'cardioid', prov: ill('a conference gooseneck: usually a small cardioid (generic type; S-CHURCH, S-PODIUM)') }],
    body: GOOSE_BODY,
    power: 'phantom power (48 V)',
    mount: 'clip',
    clip: GOOSE_CLIP,
    examples: GOOSE_EX,
    art: 'gooseneck',
    blurb: 'A small condenser capsule on a long flexible neck, rising from a table base or a lectern: bend it so the capsule comes toward the talker’s mouth, out of their sight line and the paper’s path. Needs phantom power.',
  },
  bcGooseSuper: {
    id: 'bcGooseSuper',
    label: 'Small condenser on a gooseneck, supercardioid',
    short: 'GOOSE · SUPER',
    transducer: 'condenser',
    address: 'end',
    patterns: [{ id: 'supercardioid', label: 'supercardioid', prov: src('S-LIVE', 'supercardioid … least sensitive at 126 degrees off-axis (textbook)') }],
    body: GOOSE_BODY,
    power: 'phantom power (48 V)',
    mount: 'clip',
    clip: GOOSE_CLIP,
    examples: GOOSE_EX,
    art: 'gooseneck',
    blurb: 'The same gooseneck with a supercardioid capsule: tighter at the sides, least sensitive toward the rear about 125° off the front, with a small lobe behind. Needs phantom power.',
  },
  bcBoundary: {
    id: 'bcBoundary',
    label: 'Boundary mic (half-cardioid) lying on the table',
    short: 'BOUNDARY',
    transducer: 'condenser',
    address: 'boundary',
    patterns: BOUNDARY_PATTERN,
    // The Lab 1 boundary plate's body (data/micTypes.ts boundaryHalf, S-B91-UG).
    body: BOUNDARY_BODY,
    power: 'phantom power (48 V)',
    mount: 'surface',
    surfacePartId: 'b6.table',
    examples: [{ model: 'half-cardioid boundary plate (the Lab 1 boundaryHalf body, S-B91-UG)', fact: 'The lesson L15: "not every boundary mic is omnidirectional"; S-B91-UG: half-cardioid, "Keep sound sources within a 60° range above this surface".', src: 'S-B91-UG' }],
    art: 'boundary',
    blurb: 'A low plate lying on the table between talkers: it hears the hemisphere above the table, most toward its front. This one is half-cardioid — not every boundary mic is omni, so check its pattern and aim its front at the talkers. Needs phantom power.',
  },
  /* ── Lab 7 group 2 (B05, B04, B02): shotgunShort, compactHyper, camMic, lavOmni, lavCard, hsCard ── */
  // shotgunShort is Lab 6's (shared/fieldmics SHOTGUN_SHORT, a stand mount
  // read to its capsule) — reused, never redefined; on a hand-held pole the
  // location kit's locBoomSg / locBoomHyper / locBoomFur; lavOmni is the
  // location kit's locLav, hsOmni the voice family's vocHeadset (G2_SLOTS).
  compactHyper: {
    id: 'compactHyper',
    label: 'Compact hypercardioid on a fixed boom stand',
    short: 'COMPACT HYPER',
    transducer: 'condenser',
    address: 'end',
    patterns: [
      { id: 'hypercardioid', label: 'hypercardioid', prov: src('S-LIVE', 'hypercardioid … least sensitive at 110 degrees (a textbook pattern for the generic type)') },
      { id: 'supercardioid', label: 'supercardioid', prov: src('S-LIVE', 'supercardioid … least sensitive at 126 degrees off-axis (textbook)') },
    ],
    body: { length: dd(120, 'a compact pencil hypercardioid’s length (drawing default, as the location kit’s)'), radius: dd(10, 'a compact pencil hypercardioid’s radius') },
    power: 'phantom power (48 V)',
    mount: 'stand',
    examples: [{ model: 'compact supercardioid / hypercardioid pencil on a boom (generic; one maker describes it as an indoor dialogue alternative)', fact: 'The lesson B04 L24 / B02 L16: in a reflective interior compare a compact directional mic with a shotgun at the same position — neither type is best everywhere. Pattern: S-LIVE textbook nulls 110° / 126°. Body: a drawing default.', src: 'S-LIVE' }],
    art: 'sdc',
    blurb: 'A short pencil condenser with a tight pattern, on a fixed boom stand above the talker: indoors, among reflections, it is often smoother off its axis than a long shotgun. Aim it at the mouth; check what is behind the talker along its axis. Needs phantom power.',
  },
  camMic: {
    id: 'camMic',
    label: 'Short shotgun on the camera’s shoe',
    short: 'CAMERA MIC',
    transducer: 'condenser',
    address: 'end',
    patterns: [{ id: 'supercardioid', label: 'short shotgun (drawn as a supercardioid, narrower higher up)', prov: ill('a camera-top short shotgun drawn as its base supercardioid with the narrower high-frequency lobe — a simplified picture (O-SG: no first-order equation fits an interference tube)') }],
    body: { length: dd(180, 'a camera-top short shotgun’s length (drawing default)'), radius: dd(10, 'a camera-top short shotgun’s radius') },
    lobe: 'shotgun',
    power: 'the camera’s input (its own setting), or its own battery — check the model',
    mount: 'surface',
    surfacePartId: 'bc.camera',
    examples: [{ model: 'camera-mounted short shotgun on a shoe mount (generic)', fact: 'The lesson B04 L5, L41–L47: it moves with the lens; a shotgun does not zoom; moving the camera back moves the mic back; camera AGC and level settings checked; reference or backup track. D-SG1 (a maker’s “four to five times” an omni’s distance) is never shown.', src: 'S-SHOTGUN' }],
    art: 'shotgun',
    blurb: 'A short shotgun in a small suspension on the camera’s shoe: it points where the lens points and stays as far from the talker as the camera is — move the camera back and the mic goes back with it. Directional pickup does not bring a distant voice closer.',
  },
  lavCard: {
    id: 'lavCard',
    label: 'Directional lavalier (a miniature cardioid) clipped to clothing',
    short: 'LAV · CARDIOID',
    transducer: 'condenser',
    address: 'end',
    patterns: [{ id: 'cardioid', label: 'cardioid', prov: ill('a directional miniature: drawn as a textbook cardioid (generic type; check the model’s own pattern)') }],
    body: { length: dd(15, 'a directional lavalier capsule’s length (drawing default)'), radius: dd(3.5, 'a directional lavalier capsule’s radius') },
    power: 'a wireless bodypack, or phantom power through its own adapter',
    mount: 'clip',
    clip: { reach: dd(40, 'a clothing clip’s reach to the capsule (drawing default)') },
    examples: [{ model: 'directional miniature lavalier (generic)', fact: 'The lesson B05 L5 / L13: orient the actual sensitive axis toward the mouth; more rejection in a useful geometry, but turns, wind, plosives and proximity effect need more care.', src: 'S-LAVHS' }],
    art: 'lavalier',
    blurb: 'A tiny directional capsule on a clip: its sensitive end must point at the mouth, so a turn of the head takes the voice off its axis — more rejection of the room when it is aimed well, more care with breath and fabric.',
  },
  hsCard: {
    id: 'hsCard',
    label: 'Directional headset (a miniature cardioid by the mouth)',
    short: 'HEADSET · CARD',
    transducer: 'condenser',
    address: 'end',
    patterns: [{ id: 'cardioid', label: 'cardioid', prov: ill('a headworn directional miniature: drawn as a textbook cardioid — compare the model’s own polar plot (the lesson B05 L32)') }],
    body: { length: dd(14, 'a headset capsule’s length'), radius: dd(3, 'a headset capsule’s radius') },
    power: 'a wireless bodypack, or phantom power through its own adapter',
    mount: 'clip',
    clip: { reach: dd(170, 'the headset boom’s reach from the ear to the capsule (as the voice family’s headset)') },
    examples: [{ model: 'headworn directional miniatures (generic)', fact: 'The lesson B05 L31–L33: use the model’s intended position and aim; verify rear and side rejection against the monitors and the PA; small shifts, breath and proximity change the tone. SN-ME3 2–3 cm from the mouth corner (D-HS1).', src: 'SN-ME3' }],
    art: 'gooseneck',
    blurb: 'A headset whose capsule is directional: aimed at the mouth from beside it, it hears a little less of the room and the PA behind — but a small shift of the boom, breath and the proximity effect change the tone more than with an omni.',
  },
  bcBoundaryDesk: {
    id: 'bcBoundaryDesk',
    label: 'Boundary mic (half-cardioid) lying on the desk',
    short: 'BOUNDARY',
    transducer: 'condenser',
    address: 'boundary',
    patterns: BOUNDARY_PATTERN,
    body: BOUNDARY_BODY,
    power: 'phantom power (48 V)',
    mount: 'surface',
    surfacePartId: 'bc.desk',
    examples: [{ model: 'half-cardioid boundary plate (the Lab 1 boundaryHalf body, S-B91-UG)', fact: 'B02 L23–L31: a purpose-built boundary mic on the desk toward the talker, its aperture clear; an ordinary lav taped to a table is not one. S-B91-UG: half-cardioid.', src: 'S-B91-UG' }],
    art: 'boundary',
    blurb: 'A low plate lying on the desk toward the talker: it hears the hemisphere above the desk, most toward its front, with its element so close to the desk that the desk’s own bounce arrives with the direct sound. It also hears papers, hands and the room. Needs phantom power.',
  },
  /* ── Lab 7 group 3 (B03, B08): repOmni ── */
} satisfies Record<string, MicType>;
