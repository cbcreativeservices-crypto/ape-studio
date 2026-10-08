/**
 * SPEECH-IN-SPORT MICROPHONES — Lab 7b group 1 (B09 commentators, B10
 * sideline and post-event interviews, B11 athletes, coaches and officials).
 * Generic types; the products their patterns and placements come from stay
 * in `examples` and every `prov` — the INTERNAL record (owner ruling
 * 2026-10-04: no brand or model on screen). Merged into MIC_TYPES by
 * data/micTypes.ts (one "Lab 7b group 1" block). Source keys:
 * docs/labs/miking/commentators/SOURCES.md §0 (the Lab 7 part 2 register)
 * and lead_vocal/SOURCES.md §0 (Lab 5 keys).
 *
 *   bcHeadsetBoom   a closed-ear commentary headset with a close-talk boom:
 *                   a cardioid dynamic whose capsule sits at the OUTSIDE
 *                   CORNER of the mouth, "not directly in front" (S-SM2);
 *   bcHeadsetSuper  the same headset with a supercardioid capsule (a second
 *                   version's pattern — its spec was not re-read: a textbook
 *                   supercardioid, never a readout of a product);
 *   bcLipRibbon     a lip-guarded close-talking ribbon, figure-8
 *                   (COLES-4104 "bi-directional"): its GUARD rests on the
 *                   upper lip and is the mic's front here — the ribbon sits
 *                   behind it by a depth no readable source gives (D7-7:
 *                   drawn, never read out);
 *   bcFlagOmni / bcFlagCard / bcFlagSuper
 *                   a handheld interview dynamic with its flag cube — omni
 *                   (forgiving of aim), cardioid, supercardioid (tighter, a
 *                   small rear lobe): the B10 lesson's three choices.
 * REUSED (not redefined): locLav and locBoomSg (shared/field/fieldMics.ts —
 * the body mic and the short shotgun on a pole), bcDynArm (broadcastMics.ts).
 *
 * MOUNTS. A headset boom is an engine 'clip' whose grip is the EAR (a Rim
 * at the ear pivot; the boom drawn straight to the capsule). A HELD mic (the
 * lip ribbon in the commentator's own hand, an interview handheld in the
 * reporter's) is an engine 'clip' with the new `style: 'held'`: the grip is
 * the holder's SHOULDER, the arm drawn as a sleeve and a forearm through a
 * lowered elbow (engine/geometry/arm.ts heldElbowOf), its reach the arm's.
 * Every size here is a drawing default (`placeholder`): no outline was read.
 */
import type { MicType } from '../../../engine/model/types.ts';

const dd = (mm: number, needed: string) => ({ mm, prov: { kind: 'unknown', needed } as const, placeholder: true });
const src = (s: string, quote: string) => ({ kind: 'sourced', src: s, quote }) as const;
const ill = (reason: string) => ({ kind: 'illustrative', reason }) as const;

/** A held mic's arm: the upper arm and the forearm to the fist (drawing
 *  defaults — the shared adult figure's proportions), and the reach from the
 *  shoulder to the mic's tail (the two, plus the fist's grip up the handle). */
export const HELD_ARM = {
  upper: dd(300, 'an adult’s upper arm, shoulder to elbow (the shared figure, a drawing default)'),
  fore: dd(290, 'an adult’s forearm, elbow to the closed fist (the shared figure, a drawing default)'),
  reach: dd(630, 'a held mic’s reach from the shoulder to its tail (upper arm + forearm + the grip up the handle)'),
} as const;
const HELD = { reach: HELD_ARM.reach, style: 'held' as const, elbow: { a: HELD_ARM.upper, b: HELD_ARM.fore } };

/** The headset boom: the capsule in its foam ball, and the boom's reach from
 *  the ear pivot (S-SM2 gives the pivot's 155° swing and an 89 mm adjust
 *  range, not the boom's length: a drawing default). */
export const HEADSET_BOOM = {
  capsule: { length: dd(30, 'a headset boom capsule’s length, foam on'), radius: dd(11, 'a headset boom capsule’s foam ball radius') },
  reach: dd(170, 'the headset boom’s reach from the ear pivot to the capsule (the maker gives an 89 mm adjust range and a 155° pivot, not the base length)'),
  pivotDeg: { value: 155, prov: src('S-SM2', 'pivots through 155°') },
  adjustMm: { value: 89, prov: src('S-SM2', 'adjusts through 89 mm (3 1/2 in.) range') },
} as const;

/** The lip ribbon: its guard's depth in front of the ribbon (UNKNOWN: D7-7 —
 *  a drawing default, never a readout) and the whole mic. */
export const LIP_RIBBON = {
  guardDepth: dd(60, 'the lip guard’s distance in front of the ribbon (COLES-SPEC is image-only: UNKNOWN; owner decision D7-7)'),
  length: dd(220, 'a lip ribbon’s length, guard to cable boot'),
  radius: dd(20, 'a lip ribbon head’s half-width'),
} as const;

/** The handheld interview dynamic's body (Lab 5's handheld: a drawing default). */
const HANDHELD = { length: dd(162, 'a handheld interview dynamic’s overall length'), radius: dd(25, 'a handheld’s ball-grille radius') };
const FLAG_EX = [{ model: 'handheld reporter dynamics with a mic flag (generic)', fact: 'The B10 lesson L12: "An omni is forgiving of small aim errors; a directional model can reduce some side sound but needs more accurate aiming"; L28: "Supercardioids also have rear pickup". The flag is a camera-facing cube (drawing only).', src: 'LESSON-B10' }];

export const SPORT_SPEECH_MIC_TYPES = {
  /* ── Lab 7b group 1 (B09, B10, B11) ── */
  bcHeadsetBoom: {
    id: 'bcHeadsetBoom',
    label: 'Commentary headset with a close-talk boom, cardioid dynamic',
    short: 'HEADSET BOOM',
    transducer: 'dynamic',
    address: 'end',
    patterns: [{ id: 'cardioid', label: 'cardioid', prov: src('S-SM2', 'Cardioid (unidirectional) … Dynamic, Close-Talking') }],
    body: HEADSET_BOOM.capsule,
    power: 'none needed (dynamic) — the headphones need their own feed',
    mount: 'clip',
    clip: { reach: HEADSET_BOOM.reach },
    examples: [{ model: 'Shure SM2 class (closed-ear broadcast headset, dynamic boom)', fact: 'S-SM2: "Dynamic, Close-Talking"; "Cardioid (unidirectional)"; boom "pivots through 155°", adjusts through an 89 mm range; "as close as possible to the outside corner of the mouth (not directly in front.)"; "enclosed ear receivers block out room noise".', src: 'S-SM2' }],
    art: 'headsetBoom',
    blurb: 'Closed headphones with a short boom from the ear: its small dynamic capsule sits at the outside corner of the mouth, just out of the breath, and follows every turn of the head. Close and directional, so the voice stays ahead of the crowd. Needs no power.',
  },
  bcHeadsetSuper: {
    id: 'bcHeadsetSuper',
    label: 'Commentary headset with a close-talk boom, supercardioid',
    short: 'HEADSET · SUPER',
    transducer: 'dynamic',
    address: 'end',
    patterns: [{ id: 'supercardioid', label: 'supercardioid', prov: ill('a second headset version with a supercardioid capsule: its maker’s pattern data was not re-read (SN-HMD26 UNSOURCED) — a textbook supercardioid') }],
    body: HEADSET_BOOM.capsule,
    power: 'check its manual: versions differ in powering',
    mount: 'clip',
    clip: { reach: HEADSET_BOOM.reach },
    examples: [{ model: 'supercardioid headset booms (generic; the HMD 26 class, spec not re-read)', fact: 'The lesson L24: one version a supercardioid dynamic, another a cardioid condenser — different powering and off-axis behaviour (SN-HMD26 not reachable 2026-10-07: UNSOURCED).', src: 'SN-HMD26' }],
    art: 'headsetBoom',
    blurb: 'The same headset with a tighter, supercardioid capsule: less from the sides, least about 125° off its front, with a small lobe behind. Versions differ in pattern and powering — check the one you have.',
  },
  bcLipRibbon: {
    id: 'bcLipRibbon',
    label: 'Lip ribbon with its guard, figure-8, held to the mouth',
    short: 'LIP RIBBON',
    transducer: 'ribbon',
    address: 'end',
    patterns: [{ id: 'figure8', label: 'figure-8', prov: src('COLES-4104', 'bi-directional') }],
    body: { length: LIP_RIBBON.length, radius: LIP_RIBBON.radius },
    power: 'none — a passive ribbon: check the interface and the phantom-power setting with the audio lead before connecting',
    mount: 'clip',
    clip: HELD,
    examples: [{ model: 'Coles 4104 class (lip-guarded noise-cancelling ribbon)', fact: 'COLES-4104: "bi-directional"; usable in wind "up to 20 mph (32 km)" without notable difference, "up to 40 mph (64 km) or more" with its windshield. COLES-SPEC is image-only: the guard depth is UNKNOWN (D7-7).', src: 'COLES-4104' }],
    art: 'lipRibbon',
    blurb: 'A ribbon mic held to the mouth, its guard bar resting on the upper lip so the distance is the same every time. Figure-8: it hears the front and the back, and least at the sides — never claim it cancels the whole crowd. A passive ribbon: protect it from air blasts and from careless phantom power.',
  },
  bcFlagOmni: {
    id: 'bcFlagOmni',
    label: 'Handheld interview mic with its flag, omni',
    short: 'HANDHELD · OMNI',
    transducer: 'dynamic',
    address: 'end',
    patterns: [{ id: 'omni', label: 'omni', prov: ill('a reporter’s omni handheld (generic type; the B10 lesson L12, L28)') }],
    body: HANDHELD,
    power: 'none needed (dynamic)',
    mount: 'clip',
    clip: HELD,
    examples: FLAG_EX,
    art: 'flagHandheld',
    blurb: 'A rugged handheld with a flag under its grille, held by the reporter and moved to whoever is speaking. Omni: forgiving of small aim errors as people turn — and it hears the crowd from every side, so keep it close.',
  },
  bcFlagCard: {
    id: 'bcFlagCard',
    label: 'Handheld interview mic with its flag, cardioid',
    short: 'HANDHELD · CARD',
    transducer: 'dynamic',
    address: 'end',
    patterns: [{ id: 'cardioid', label: 'cardioid', prov: src('S-SM58-UG', 'Cardioid … Place the microphone so that unwanted sound sources, such as monitors and loudspeakers, are directly behind it.') }],
    body: HANDHELD,
    power: 'none needed (dynamic)',
    mount: 'clip',
    clip: HELD,
    examples: FLAG_EX,
    art: 'flagHandheld',
    blurb: 'The same handheld, cardioid: less of the side and rear crowd — if the reporter keeps its front on the speaking mouth. A mouth off its front is a duller, quieter voice.',
  },
  bcFlagSuper: {
    id: 'bcFlagSuper',
    label: 'Handheld interview mic with its flag, supercardioid',
    short: 'HANDHELD · SUPER',
    transducer: 'dynamic',
    address: 'end',
    patterns: [{ id: 'supercardioid', label: 'supercardioid', prov: src('S-LIVE', 'supercardioid … least sensitive at 126 degrees off-axis … rear rejection -12 dB') }],
    body: HANDHELD,
    power: 'none needed (dynamic)',
    mount: 'clip',
    clip: HELD,
    examples: FLAG_EX,
    art: 'flagHandheld',
    blurb: 'The tightest of the three: least sensitive about 125° off its front, with a small lobe straight behind — so check where the PA sits. It needs the most careful aim.',
  },
} satisfies Record<string, MicType>;
