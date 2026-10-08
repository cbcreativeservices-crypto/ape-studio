/**
 * Microphones by property for Lab 6 group 6 — F09 Location Speech (the boom
 * shotgun, the indoor boom hypercardioid, the boom in a fur windshield, the
 * lavalier, the planted miniature, the camera-top shotgun) and F10 Spatial
 * Field Pickup (the binaural head, the first-order Ambisonic mic, the Double
 * M/S cluster). Generic types: the products their sizes come from stay in
 * `examples` and every `prov` — the INTERNAL record (owner ruling
 * 2026-10-04: no brand or model on screen). Merged into MIC_TYPES by
 * data/micTypes.ts (one "Lab 6 group 6" block). Source keys:
 * docs/labs/miking/measurement_mics/SOURCES.md §0 (Lab 6 part 2) and
 * foley_footsteps/SOURCES.md §c (the shotgun model).
 *
 * MOUNTS (shared/field/location.ts): a boom POLE is an engine 'clip' whose
 * grip is the operator's front hand (`clip.reach` = the pole's reach, a
 * drawing default; `clip.arm` = its radius, drawn that thick); a LAV is a
 * 'clip' on the sternum (it follows the torso); a PLANT and a camera-top mic
 * are 'surface' mounts on their prop. The spatial mics stand on a stand
 * straight under their centre: their body length equals their radius, so
 * the engine's tail — where the stand rises to — is the centre (F10's
 * mountRule: a zero-length level boom).
 */
import type { MicType } from '../../../engine/model/types.ts';

const dd = (mm: number, needed: string) => ({ mm, prov: { kind: 'unknown', needed } as const, placeholder: true });
const src = (s: string, quote: string) => ({ kind: 'sourced', src: s, quote }) as const;
const ill = (reason: string) => ({ kind: 'illustrative', reason }) as const;
const SHOTGUN_MODEL = ill('a short shotgun drawn as its base capsule’s supercardioid — below roughly the upper mids its tube adds little rejection; above, the lobe narrows (foley_footsteps/SOURCES.md §c, SCH-SHOTGUN): a simplified picture');

/** A short shotgun's body: Ø 19 × 250 mm (one common model, SEN-416 — Low). */
const SHORT_SHOTGUN = { length: { mm: 250, prov: src('SEN-416', 'Ø 19 × 250 mm (search summary, Low)') }, radius: { mm: 9.5, prov: src('SEN-416', 'Ø 19 mm (search summary, Low)') } };
/** The boom pole: its reach from the grip to the mic and its radius — drawing defaults (location_speech/GEOMETRY_PROPOSAL §2: "length drawing default 2.5 m"). */
const POLE = { reach: dd(2500, 'a boom pole’s reach from the operator’s grip (drawing default 2.5 m)'), arm: dd(16, 'a boom pole’s radius (drawing default)') };

export const FIELD_MIC_TYPES = {
  /* ── F09: location speech ── */
  locBoomSg: {
    id: 'locBoomSg',
    label: 'Short shotgun on a boom pole, in a suspension',
    short: 'BOOM · SHOTGUN',
    transducer: 'condenser',
    address: 'end',
    patterns: [{ id: 'supercardioid', label: 'short shotgun (drawn as a supercardioid)', prov: SHOTGUN_MODEL }],
    body: SHORT_SHOTGUN,
    power: 'phantom power (48 V) from the recorder or mixer',
    mount: 'clip',
    clip: POLE,
    examples: [{ model: 'short shotgun (Sennheiser MKH 416 class)', fact: 'Ø 19 × 250 mm (SEN-416, Low); SCH-SHOTGUN: no greater rejection than its capsule through much of the range, narrower at high frequencies; RODE-SG (not re-read): move the boom near the subject instead of relying on a distant shotgun.', src: 'SCH-SHOTGUN' }],
    art: 'shotgun',
    blurb: 'A long, slotted tube in front of a directional capsule, in a suspension on a pole. It narrows its pickup only at the higher frequencies — it does not reach farther: distance still decides. Needs phantom power.',
  },
  locBoomHyper: {
    id: 'locBoomHyper',
    label: 'Small hypercardioid on a boom pole (indoors)',
    short: 'BOOM · HYPER',
    transducer: 'condenser',
    address: 'end',
    patterns: [{ id: 'hypercardioid', label: 'hypercardioid', prov: src('SCH-SHOTGUN', 'A small directional microphone with smooth off-axis response … can often be placed closer to a sound source than a shotgun microphone') }],
    body: { length: dd(120, 'a small pencil hypercardioid’s length'), radius: dd(10, 'a small pencil hypercardioid’s radius') },
    power: 'phantom power (48 V)',
    mount: 'clip',
    clip: POLE,
    examples: [{ model: 'small-diaphragm hypercardioid (generic)', fact: 'SCH-SHOTGUN: indoors, in a diffuse field, a shotgun is "less effective than one might wish"; a small directional mic with smooth off-axis response often does as well or better — the lesson L12: "Shorter or broader patterns may be useful where reflections or movement undermine a narrow pattern".', src: 'SCH-SHOTGUN' }],
    art: 'sdc',
    blurb: 'A short pencil mic with a tight pattern: indoors, among reflections, it often sounds smoother off its axis than a long shotgun. On the pole in a suspension. Needs phantom power.',
  },
  locBoomFur: {
    id: 'locBoomFur',
    label: 'Short shotgun in a basket windshield with fur, on a boom pole',
    short: 'BOOM · FUR',
    transducer: 'condenser',
    address: 'end',
    patterns: [{ id: 'supercardioid', label: 'short shotgun (drawn as a supercardioid)', prov: SHOTGUN_MODEL }],
    body: { length: dd(420, 'a basket windshield’s length for a short shotgun'), radius: dd(45, 'a basket windshield’s radius') },
    power: 'phantom power (48 V)',
    mount: 'clip',
    clip: POLE,
    examples: [{ model: 'basket windshield + fur cover (Rycote-class modular windshield)', fact: 'The lesson L30: foam can help in light wind; a basket/blimp and fur may be needed outdoors; neither is waterproofing (Rycote page not re-read — PRACTICE).', src: 'LESSON-F09' }],
    art: 'blimp',
    blurb: 'The same shotgun inside a basket windshield with a fur cover — for wind outdoors. It slows the wind before the capsule; it does not keep rain out. Needs phantom power.',
  },
  locLav: {
    id: 'locLav',
    label: 'Lavalier (a miniature omni) clipped to clothing',
    short: 'LAV',
    transducer: 'condenser',
    address: 'end',
    patterns: [{ id: 'omni', label: 'omni', prov: ill('the usual body-worn miniature is omnidirectional (generic type)') }],
    body: { length: dd(12, 'a lavalier capsule’s length'), radius: dd(3, 'a lavalier capsule’s radius') },
    power: 'a wireless bodypack, or phantom power through its adapter',
    mount: 'clip',
    clip: { reach: dd(40, 'a clothing clip’s reach to the capsule') },
    examples: [{ model: 'body-worn miniature omni (generic)', fact: 'SHURE-LAV: "Place the shirt microphone above the sternum" — no distance from the mouth is given (UNKNOWN; the distance is read from the drawing).', src: 'SHURE-LAV' }],
    art: 'lavalier',
    blurb: 'A tiny omni on a clip, on the chest just above the breastbone — with the wearer’s agreement. It stays the same distance from the mouth however wide the shot, but it moves with the chest, not the head, and it can hear the clothes.',
  },
  locPlant: {
    id: 'locPlant',
    label: 'Miniature cardioid planted in a prop',
    short: 'PLANT',
    transducer: 'condenser',
    address: 'end',
    patterns: [{ id: 'cardioid', label: 'cardioid', prov: ill('a planted miniature: a directional type aimed at one action (generic)') }],
    body: { length: dd(60, 'a planted miniature’s length'), radius: dd(6, 'a planted miniature’s radius') },
    power: 'phantom power through its adapter, or a wireless pack',
    mount: 'surface',
    surfacePartId: 'f9.counter',
    examples: [{ model: 'planted miniature (DPA plant-mic definition)', fact: 'DPA-PLANT: "A small microphone for hiding in a fixed place on set …". Position a drawing default (location_speech/GEOMETRY_PROPOSAL §2).', src: 'DPA-PLANT' }],
    art: 'sdc',
    blurb: 'A small mic hidden in a prop or a piece of the set, aimed at one mark or one action — fixed, so it covers that place and nothing else. Approved by the set’s people, never hidden to record anyone secretly.',
  },
  locCam: {
    id: 'locCam',
    label: 'Short shotgun on the camera',
    short: 'ON CAMERA',
    transducer: 'condenser',
    address: 'end',
    patterns: [{ id: 'supercardioid', label: 'short shotgun (drawn as a supercardioid)', prov: SHOTGUN_MODEL }],
    body: { length: dd(180, 'a camera-top shotgun’s length'), radius: dd(10, 'a camera-top shotgun’s radius') },
    power: 'the camera’s input, or its own battery',
    mount: 'surface',
    surfacePartId: 'f9.camera',
    examples: [{ model: 'camera-mounted short shotgun (generic)', fact: 'The lesson L24–25: a secured on-camera mic for guide sound; directionality alone does not compensate for a distant camera (RODE-CAM, not re-read).', src: 'LESSON-F09' }],
    art: 'shotgun',
    blurb: 'A short shotgun in a small suspension on top of the camera: a guide track, or sound for a quick shot. It points the right way, but it is as far from the talker as the camera is.',
  },
  /* ── F10: spatial field pickup ── */
  spHead: {
    id: 'spHead',
    label: 'Binaural model head on a stand',
    short: 'BINAURAL HEAD',
    transducer: 'condenser',
    address: 'side',
    patterns: [{ id: 'unstated', label: 'two ear mics (the head shapes the pattern)', prov: ill('a dummy head: its directional cues come from the head and the outer ears, not one pickup pattern — no lobe is drawn') }],
    // Front = the face; length = radius, so the engine's tail is the head's
    // centre (the ears' line) and the stand rises to it.
    body: { length: dd(95, 'a model head: its face to the ears’ line'), radius: dd(95, 'a model head: half its width'), width: dd(330, 'a model head with its neck (drawn height)') },
    power: 'phantom power for its two ear mics (or the maker’s supply)',
    mount: 'stand',
    examples: [{ model: 'binaural dummy head (Neumann KU 100 class)', fact: 'The lesson L12, L26: ear pickup points at the listener position, face toward the intended front; headphone playback the main reference; one maker calls its head speaker-compatible — not a universal claim (brand stays internal). Ear spacing and head height drawing defaults.', src: 'LESSON-F10' }],
    art: 'dummyHead',
    blurb: 'A model head with a small mic in each outer ear: the head and the ears shape what each mic hears, as for a listener. Made for headphones; set its face to the scene’s front at the listener’s height. Its two ear mics need power.',
  },
  spFoa: {
    id: 'spFoa',
    label: 'First-order Ambisonic mic (four capsules), upright on a stand',
    short: 'AMBISONIC',
    transducer: 'condenser',
    address: 'side',
    patterns: [{ id: 'unstated', label: 'four capsules on a tetrahedron (not one pattern)', prov: src('AMBEO-REC', 'four capsules … recorded separately on four tracks') }],
    body: { length: dd(25, 'a first-order Ambisonic mic’s capsule head (radius as length: the stand rises to its centre)'), radius: dd(25, 'a first-order Ambisonic mic’s capsule head radius'), width: dd(260, 'the mic’s body below its head (drawn)') },
    power: 'phantom power on all four channels, from identical preamps',
    mount: 'stand',
    examples: [{ model: 'first-order Ambisonic mic (Sennheiser AMBEO VR class)', fact: 'AMBEO-REC: four capsules "recorded separately on four tracks using identical microphone preamplifiers"; "Set the same gain for each of the four channels"; linked gain recommended; an upright basket recommended for that mic (not re-read: moisture warning).', src: 'AMBEO-REC' }],
    art: 'ambiTetra',
    blurb: 'Four capsules on a small tetrahedron, recorded as four separate tracks and converted afterwards into a sound field that can be turned and rendered to headphones or speakers. Its front mark faces the scene’s front. Four matched, linked channels of phantom power.',
  },
  spDms: {
    id: 'spDms',
    label: 'Double M/S cluster on a stand',
    short: 'DOUBLE M/S',
    transducer: 'condenser',
    address: 'side',
    patterns: [{ id: 'unstated', label: 'front and rear cardioids with a side figure-8', prov: ill('three capsules decoded together (PRACTICE): no single lobe is drawn') }],
    body: { length: dd(25, 'a Double M/S cluster’s centre (radius as length)'), radius: dd(25, 'a Double M/S cluster’s radius'), width: dd(220, 'the cluster’s mount below it (drawn)') },
    power: 'phantom power on all three channels',
    mount: 'stand',
    examples: [{ model: 'Double M/S rig (two cardioids + one figure-8, generic)', fact: 'The lesson L18, L32 (PRACTICE): forward cardioid Mid, backward cardioid Mid, shared sideways figure-8; mark its positive lobe; decode on purpose (UA-MS for the M/S matrix).', src: 'LESSON-F10' }],
    art: 'dmsCluster',
    blurb: 'A cardioid facing forward, one facing back and a figure-8 facing sideways, close together: three tracks decoded afterwards to front and rear, left and right. Mark which side of the figure-8 is positive. Three channels of phantom power.',
  },
} satisfies Record<string, MicType>;
