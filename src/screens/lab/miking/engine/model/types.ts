/**
 * Miking Labs ENGINE — every type, pure (docs/labs/miking/ENGINE_BLUEPRINT.md §3).
 *
 * No instrument facts live in engine/. A lesson (lessons/<id>/) supplies its
 * model, geometry and pages as DATA built from these types.
 *
 * Node type-stripping rules (blueprint §1.8): unions instead of enums, plain
 * objects, `import type` only. Units are MILLIMETRES and DEGREES unless named.
 *
 * Frame (blueprint §4.1, kick/GEOMETRY_PROPOSAL.md §1): origin = the centre of
 * the batter head (the instrument's main reference plane); +x along the main
 * axis (away from the player); +y DOWN (the floor is at positive y); +z toward
 * the player's right. A left-handed triple — the engine never takes a cross
 * product.
 */

/* ── provenance: the INTERNAL accuracy record (charter §2: a fact without a
 *  source is 'unknown', never drawn as known). Owner ruling 2026-10-04: the
 *  research stays mandatory here and in docs/labs/miking/, but none of it is
 *  shown to the learner — no source names, no SOURCED / TRIAL badges. ── */
import type { LessonCopy } from './copy.ts';

export type SrcKey = string;
export type Provenance =
  | { kind: 'sourced'; src: SrcKey; quote: string }
  | { kind: 'trial'; src: SrcKey; note: string }
  | { kind: 'illustrative'; reason: string }
  | { kind: 'unknown'; needed: string };
/** A dimension and where it came from. `placeholder` = an UNKNOWN that the
 *  drawing cannot exist without: a neutral value, never shown as a readout. */
export type Dim = { mm: number; prov: Provenance; placeholder?: boolean };

/* ── geometry primitives ── */
export type Vec3 = { x: number; y: number; z: number };
export type Shape3 =
  /** A shell WALL (an annulus) with its axis parallel to x through (c.y, c.z).
   *  With `axis` (a unit vector) the wall's axis runs through `c` along it and
   *  x0..x1 are measured ALONG `axis` from `c` — an upright snare (axis +y), a
   *  tilted tom (Lab 1's shared drum family). */
  | { kind: 'tube'; c: Vec3; rIn: number; rOut: number; x0: number; x1: number; axis?: Vec3 }
  /** A head: a disc of radius r between x0 and x1 (axis ∥ x), with an optional
   *  hole (a port) whose axis is also ∥ x. `axis` as for a tube. */
  | { kind: 'slab'; c: Vec3; r: number; x0: number; x1: number; hole?: { c: Vec3; r: number }; axis?: Vec3 }
  /** A SECTOR of an upright cylinder (axis ∥ y through c): plan angles a0..a1
   *  (radians, from +x toward +z, a0 < a1), radii r0..r1, between y0 and y1
   *  (absolute, y-down). A stick's travel over a drum's player-facing side. */
  | { kind: 'sector'; c: Vec3; r0: number; r1: number; a0: number; a1: number; y0: number; y1: number }
  | { kind: 'box'; min: Vec3; max: Vec3 }
  | { kind: 'capsule'; a: Vec3; b: Vec3; r: number }
  /** A swept volume in an x–y plane about a pivot: an annular sector between
   *  radii r0..r1 and angles a0..a1 (radians, measured from +x toward +y),
   *  ±halfW in z. Beater / pedal travel. */
  | { kind: 'sweep'; pivot: Vec3; r0: number; r1: number; a0: number; a1: number; halfW: number }
  /** The floor half-space: solid where y > y (y-down). */
  | { kind: 'floor'; y: number }
  /** A SOLID CYLINDER between a and b, radius r, on ANY axis (a drum standing
   *  upright, a drum held at an angle). Added 2026-10-05 for the hand drums
   *  (tonbak, tabla) whose axes are not parallel to x. */
  | { kind: 'cyl'; a: Vec3; b: Vec3; r: number }
  /** A solid capped cone (a cylinder when ra = rb) along a → b, at ANY
   *  orientation: radius ra at a, rb at b. Upright and tilted drums (the
   *  hand-drum family), stands' columns, hand envelopes. */
  | { kind: 'frustum'; a: Vec3; b: Vec3; ra: number; rb: number }
  /** A FAN (added 2026-10-05 for the bowed strings): the sector of half-angle
   *  `ang` (radians) about the unit direction `u`, radius `r`, in the plane
   *  spanned by `u` and `v` (unit, ⊥ u) through the pivot `c`, ±`halfW` along
   *  `axis` (unit, ⊥ the plane), every edge rounded by `round`. `twoSided`
   *  mirrors it through the pivot (a bow crossing the strings: the stick
   *  reaches both ways). A bow's sweep, a bowing hand's travel. */
  | { kind: 'fan'; c: Vec3; axis: Vec3; u: Vec3; v: Vec3; r: number; ang: number; halfW: number; round: number; twoSided?: boolean }
  /** A PRISM: a polygon in plan (x, z) extruded between y0 and y1 (y-down,
   *  y0 < y1). With `hinge`, the prism is turned about the line parallel to
   *  x through (y, z) = (hinge.y, hinge.z) by `deg`, its +z side lifting
   *  toward −y (a grand piano's lid on its stick). Added for Lab 4 (the
   *  pianos: a curved case outline, a lid). */
  | { kind: 'prism'; pts: readonly (readonly [number, number])[]; y0: number; y1: number; hinge?: { y: number; z: number; deg: number } };

/* ── the instrument model ── */
export type PartId = string;
export type VariantId = string;
export type Part = {
  id: PartId;
  label: string;
  short: string;
  /** One plain sentence (page 1). */
  role: string;
  /** Takes part in collision when present. */
  solid?: Shape3;
  moving?: boolean;
  /** Extra keep-out margin, mm. Always ILLUSTRATIVE in v1 (no source gives one). */
  clearance?: Dim;
  /** Present only in these variants. */
  variants?: VariantId[];
  /** Listed on the parts page only in these variants (default: wherever it
   *  is present). A neighbour stays a solid without being a part to name. */
  listIn?: VariantId[];
  /** Views in which the part cannot be seen (a marimba's tubes hang under
   *  their bars: from above the bars hide them). No highlight is drawn there
   *  — a marker would sit on the part in front (owner 2026-10-06: "marimba
   *  resonator are the tubes not the wooden struck note"). */
  hiddenIn?: ViewId[];
  /** Where its geometry comes from (internal record; never shown). */
  prov: Provenance;
};
/** `phrase` completes "a <model name> with …" in the scene's words
 *  ("the snares on"); default: the kick's front-head wording. */
export type Variant = { id: VariantId; label: string; blurb: string; phrase?: string };

export type RadiatingRegion = {
  id: string;
  partId: PartId;
  label: string;
  /** The point used as a path source (page 5). */
  anchor: Vec3;
  prov: Provenance;
  variants?: VariantId[];
  /** One sentence: what radiates here. */
  note: string;
};
export type ReferenceSurface = {
  id: string;
  partId: PartId;
  label: string;
  point: Vec3;
  /** Unit normal; distances are signed along it. */
  normal: Vec3;
  /** How a NEGATIVE distance is said (default "behind" / "BEHIND"): for the
   *  front head a negative distance is INSIDE the drum (review m13). */
  minus?: { words: string; key: string };
  /** How a POSITIVE distance is said (default "from" / "FROM"): "above". */
  plus?: { words: string; key: string };
  /** Offered only in these variants (default: all). */
  variants?: VariantId[];
  /** A TARGET POINT, not a plane (added 2026-10-05): distance = |p − point|
   *  ("25–40 cm from the head", measured capsule to target), and a zone's aim
   *  is measured toward the point. `normal` still orients a zone's `cone`. */
  target?: boolean;
};
/**
 * A reference LINE. The radial readout is the distance from it — or, with
 * `offset`, that distance minus `offset`, SIGNED: a drum's centre line with
 * offset = its radius reads "in from / out from the rim edge" (`words`).
 */
export type RefLine = {
  id: string;
  label: string;
  point: Vec3;
  dir: Vec3;
  offset?: number;
  /** A FINITE line (added 2026-10-05, Lab 2's small percussion): the readout
   *  is the distance to the segment from point − dir·segment to point +
   *  dir·segment (dir a unit vector) — with `offset`, the CLEARANCE from a
   *  motion envelope drawn as a capsule round that segment. */
  segment?: number;
  words?: { plus: string; minus: string; keyPlus: string; keyMinus: string };
  variants?: VariantId[];
  /** The reference surfaces this line belongs to: choosing one of them as the
   *  reference head makes this the line readouts measure from (several drums
   *  in one scene). Absent = the variant's first line, whatever the head. */
  surfaces?: string[];
  /** A reference PLANE, not a line (Lab 4): the reading is the SIGNED
   *  distance from the plane through `point` whose normal is `dir` (minus
   *  `offset`) — a piano's hammer line read "toward the tail / the keys". */
  plane?: boolean;
};
export type Envelope = { id: string; label: string; shape: Shape3; prov: Provenance; variants?: VariantId[]; clearance?: number };

export type ZoneKind = 'sourced' | 'trial';
/** How a zone is drawn in one view: a rectangle (u/v, mm; `round` draws the
 *  ellipse inside it), or a ring sector about (cu, cv) between radii r0..r1
 *  and angles a0..a1 (deg, from +u toward +v) — a starting point that runs
 *  round a drum's rim, from above. */
export type ZoneDraw = { u0: number; u1: number; v0: number; v1: number; round?: boolean } | { cu: number; cv: number; r0: number; r1: number; a0: number; a1: number };
/**
 * A RECOMMENDED STARTING POINT (owner ruling 2026-10-04). Learner-facing:
 * `label`, `band`, `tendency`, `checks` — plain starting-point words, no
 * source names. Internal record only (never shown): `kind`, `src`, `quote`,
 * every `prov`.
 */
export type DocumentedZone = {
  id: string;
  /** What it is, in plain words ("Inside, near the batter head"). */
  label: string;
  /** The suggested range, plain numbers, e.g. "start about 5–7.5 cm (2–3 in) from the batter head". */
  band: string;
  /** INTERNAL: where the numbers came from (never shown). */
  kind: ZoneKind;
  src: SrcKey;
  /** INTERNAL: the research words behind the zone (never shown). */
  quote: string;
  refSurface: string;
  side: 'inside' | 'outside' | 'either';
  /** mm, signed along the reference surface's normal. */
  distance: { min: number; max: number };
  /** Where the band's NUMBERS come from when they are not the source's own
   *  (e.g. "at the level of the resonant head" drawn as a ±60 mm band). */
  bandProv?: Provenance;
  /** Distance from a reference line (mm; signed when the line has an offset). */
  radial?: { line: string; min?: number; max?: number; prov: Provenance };
  /** Distance from a POINT (3-D), mm: the mic's front between min and max
   *  of it — "each overhead the same distance from the snare's centre".
   *  Lab 1's kit-level lessons (overheads, room, complete kit). */
  near?: { point: Vec3; min: number; max: number; prov: Provenance };
  /** `variants`: any of these (the tom lesson's drum choice). */
  requires?: { variant?: VariantId; variants?: VariantId[]; mount?: MountKind; micTypeIds?: string[] };
  /** Where the source's row includes an orientation ("on-axis with beater",
   *  "facing the beater head"): the mic's front axis must be within
   *  `maxOffAxis` degrees of −normal of the zone's own head — and, with
   *  `minOffAxis`, at least that far ("30–60° from straight down"). With
   *  `dir` the aim is tested against that direction instead of −normal (a
   *  zone aimed ACROSS its reference surface: "aimed at the bottom opening").
   *  The tolerance is the lab's (ILLUSTRATIVE unless a source gives one). */
  aim?: { maxOffAxis: number; minOffAxis?: number; dir?: Vec3; prov: Provenance };
  /** "Aim mic at drum head": the mic's front axis, followed forward, meets
   *  the named surface's plane within `r` of its point (prov internal). */
  aimAt?: { surface: string; r: number; prov: Provenance };
  /** The front must also lie in this box (a region between two drums). */
  box?: { min: Vec3; max: Vec3; prov: Provenance };
  /** The APPROACH (added 2026-10-05): the angle between (p − the surface's
   *  point) and its normal lies in [min, max] degrees — "approached at 30–45°
   *  from the head normal" — and, with `toward`, on that side (dot ≥ 0). */
  cone?: { min: number; max: number; toward?: Vec3; prov: Provenance };
  /** How the zone is DRAWN in each view (mm, u/v), when the band cannot be
   *  read off an x-axis head (an upright drum): derived in the lesson's
   *  geometry from the same numbers. */
  drawn?: Partial<Record<ViewId, ZoneDraw>>;
  /** How the zone is DRAWN, per view, as polygons in the view's (u, v) mm —
   *  computed in the lesson's geometry from the same numbers (added
   *  2026-10-05). When present, PlacementScene draws these instead of the
   *  plane band (which assumes a normal along x); `drawn` wins if both. */
  draw?: Partial<Record<ViewId, { poly: readonly (readonly [number, number])[] }[]>>;
  /** "Go to zone" pose: inside the zone and collision-free (tested). */
  start: MicPose;
  /** What to listen for, in words ("tendency", never "result"). */
  tendency: string;
  checks: string[];
};

/* ── microphones by property (brands only in the internal record) ── */
export type PatternId = 'omni' | 'cardioid' | 'supercardioid' | 'hypercardioid' | 'figure8';
/** 'unstated' / 'halfCardioid' draw NO free-field lobe. */
export type MicPattern = PatternId | 'unstated' | 'halfCardioid';
/** 'clip': clamped to a drum's rim (the model's `rims`): the body, plus an
 *  arm to the nearest rim point that may not exceed the clamp's reach. */
/** 'boom': an overhead boom stand — the boom runs level from the mic's tail
 *  out of the kit (away from the model's `boomHub`), the stand drops from its
 *  far end (Lab 1's overheads; the lengths are ILLUSTRATIVE, collision.ts). */
export type MountKind = 'stand' | 'surface' | 'clip' | 'boom';
/** 'sideLdc': a side-address large-diaphragm condenser (its FRONT is the face
 *  of the body, not its end; `body.width` is the body's long, upright extent). */
/** 'vocalDynamic' (Lab 5): a handheld vocal dynamic — a ball grille over a
 *  tapered handle — held in a stand clip. 'vocalLdc' (Lab 5): the side-
 *  address condenser drawn with its BASKET centred on the front point (the
 *  singer sings into the basket; the body hangs below). */
/** Lab 6 group 6 (F09, F10): 'shotgun' (a short shotgun, bare or on a
 *  camera), 'blimp' (the same in a basket windshield with fur, outdoors),
 *  'lavalier' (a miniature on a clothing clip), 'dummyHead' (a binaural model
 *  head: its FACE is the front, the ears 95 mm behind it), 'ambiTetra' (a
 *  first-order Ambisonic mic held upright: its capsule head on the front
 *  point, the body below it), 'dmsCluster' (a Double M/S cluster: front and
 *  rear cardioids with a figure-8 between, held upright). */
export type MicArtId = 'kickDynamic' | 'sdc' | 'boundary' | 'smallDynamic' | 'clipDynamic' | 'gooseneck' | 'instDynamic' | 'sideLdc' | 'vocalDynamic' | 'vocalLdc' | 'shotgun' | 'blimp' | 'lavalier' | 'dummyHead' | 'ambiTetra' | 'dmsCluster';
/**
 * A POP SCREEN in front of the mic (Lab 5, the voice): a mesh disc `gap` mm
 * in front of the mic's FRONT, square to its axis but tilted `tilt`° (never
 * parallel to the capsule), held by a gooseneck clamped to the mic's own
 * stand — so it moves with the mic and nothing floats. The disc is part of
 * the collision assembly: a mic whose screen would touch the singer is
 * stopped, so a screened mic simply cannot come closer than its gap allows.
 */
export type PopScreen = { gap: Dim; r: Dim; tilt: Dim };
export type MicType = {
  id: string;
  label: string;
  short: string;
  transducer: 'dynamic' | 'condenser' | 'ribbon';
  address: 'end' | 'side' | 'boundary';
  patterns: { id: MicPattern; label: string; prov: Provenance }[];
  /** length along the axis, radius of the body, and (boundary only) the plate
   *  width. The reference point is the FRONT of the mic (grille front; the
   *  element end for a boundary plate) — not the acoustic centre (lesson L39). */
  body: { length: Dim; radius: Dim; width?: Dim };
  power: string;
  mount: MountKind;
  /** A clip mount's reach from the hoop to the mic's tail (default CLIP_REACH).
   *  `arm` (Lab 6 group 6): the arm's radius when it is a BOOM POLE held by
   *  an operator (drawn that thick, no clamp jaw: the operator's hands hold it). */
  clip?: { reach: Dim; arm?: Dim };
  surfacePartId?: PartId;
  /** A pop screen on the mic's stand (PopScreen; Lab 5's studio vocal mic). */
  pop?: PopScreen;
  /** INTERNAL record: the products the drawn size and specs were read from (never shown). */
  examples: { model: string; fact: string; src: SrcKey }[];
  art: MicArtId;
  /** One sentence for page 2. */
  blurb: string;
};

/* ── state ── */
export type MicPose = { p: Vec3; az: number; el: number };
export type MicSlot = 'A' | 'B';
export type MicState = { slot: MicSlot; typeId: string; pattern: MicPattern; pose: MicPose; polarity: 1 | -1; on: boolean };
export type ViewId = 'side' | 'top';
export type Scenario = 'studio' | 'live';
/** A floor monitor at an ILLUSTRATIVE stage position: `p` on the floor, the
 *  sound radiating from `p + lift` (its baffle), facing `faces`. */
/** `glyph: 'none'`: a spill source the lesson's own art already draws (the
 *  hi-hat beside a snare, a crash over a tom) — no wedge is drawn for it. */
export type Wedge = { id: string; label: string; short: string; p: Vec3; lift: number; faces: Vec3; note: string; prov: Provenance; glyph?: 'wedge' | 'none' };

/** One collision solid, flattened for the worklets (plain data only). */
export type Solid = { partId: string; label: string; shape: Shape3; clearance: number };
/** What `checkAssembly` needs to know about the mic (plain data). */
export type MicBody = { length: number; radius: number; mount: MountKind; surfacePartId?: string; reach?: number; /** A pop screen's disc (mm): `gap` ahead of the front, radius `r`. */ pop?: { gap: number; r: number }; /** Lab 6 group 6: the mic type's id (a rim may serve only some types: Rim.types) and a boom pole's radius (MicType.clip.arm). */ id?: string; armR?: number };
/** The space a mic counts as "inside": along `axis` (default +x, absolute x)
 *  between x0 and x1 from c, within rIn of the axis. */
export type Interior = { x0: number; x1: number; rIn: number; c: Vec3; axis?: Vec3 };
/** A hoop a clip mount can clamp to: the circle of radius r about c, in the
 *  plane normal to `axis` (ILLUSTRATIVE: no source gives a clamp's reach). */
/** `types` (Lab 6 group 6): only these mic types clamp here (a boom pole's
 *  grip in the operator's hands and a lav's clip on the chest share one
 *  scene); absent = every clip mic. */
export type Rim = { id: string; label: string; c: Vec3; axis: Vec3; r: number; variants?: VariantId[]; types?: readonly string[] };
/** The scene a lesson variant compiles to: solids + the routing anchors. */
export type CompiledScene = {
  variant: VariantId;
  solids: Solid[];
  /** The port centre the boom is routed through, when the variant has one. */
  port: { c: Vec3; r: number } | null;
  /** The interior a mic counts as "inside": x0 < x < x1, radius < rIn. */
  interior: Interior;
  /** More drums on the same scene (the tom lesson's three). */
  interiors: Interior[];
  /** Hoops a clip mount may clamp to. */
  rims: Rim[];
  yFloor: number;
  /** Illustrative mount geometry (`route`: the variant's BoomRoute). */
  boom: { radius: number; outside: number; behind: number; route?: BoomRoute | null };
  standRadius: number;
  /** The model's boom rule (InstrumentModel.mountRule), when it has one. */
  mountRule?: MountRule;
  /** Where an overhead ('boom') mount's boom leaves from (the kit's centre in plan). */
  boomHub?: Vec3;
};
/**
 * How a stand mic's boom leaves its tail (ILLUSTRATIVE mount geometry). The
 * default (no rule) is the kick's: straight back along the mic's axis, or out
 * through the port. 'level': the boom runs HORIZONTALLY away from the mic's
 * tail (the horizontal part of −aim), or along `fallback` when the mic points
 * nearly straight up or down — so a mic aimed down at a hand drum hangs from a
 * boom beside the drums instead of a stand dropping through it.
 */
export type MountRule = {
  boom: 'level';
  fallback: Vec3;
  length: number;
  /** The boom ALWAYS runs along `fallback`, whatever the aim (added
   *  2026-10-05 for the mallet keyboards: a mic tilted along the keyboard —
   *  one of a coincident pair — still hangs from a stand on the audience
   *  side, never one standing in the keyboard). */
  fixed?: boolean;
};
/**
 * How a stand's boom reaches a mic that hangs over or inside an instrument
 * (Lab 4: a mic over a grand's strings is held from the open, curved side; a
 * mic inside an upright's open top comes up out of it first). The boom runs
 * from the mic's tail leg by leg: along `dir` until the point is `past` mm
 * along `dir` (the first leg at least the usual reach); a point already more
 * than `back` mm on the −dir side runs along −dir instead. The stand drops
 * from the last leg's end. ILLUSTRATIVE.
 */
export type BoomLeg = { dir: Vec3; past: number; back?: number };
export type BoomRoute = { legs: readonly BoomLeg[] };

/* ── derived (never stored) ── */
export type Readouts = {
  surfaceId: string;
  /** Signed mm from the reference surface along its normal. */
  distance: number;
  /** mm off the named reference line (e.g. the beater line). */
  radial: number;
  radialLine: string;
  /** deg between the mic's front axis and −normal of the surface. */
  offAxis: number;
  inside: boolean;
  zoneId: string | null;
  blocked: null | { partId: string; label: string };
};

/* ── lesson ── */
export type MikingLabId = 'drums' | 'percussion' | 'winds' | 'strings' | 'ensembles' | 'field' | 'broadcast';
/**
 * The lesson's pages in JOURNEY order (docs/labs/miking/LESSON_JOURNEY.md,
 * owner restructure 2026-10-06: "The labs need to be about miking"):
 *
 *   meet       MEET IT — WHERE THE SOUND COMES FROM (what it is, in brief,
 *              and where its sound leaves)
 *   setups     STARTING SETUPS — real mic setups drawn on the instrument
 *   microphone · placement (the Placement Studio) · context · twoMic ·
 *   troubleshoot · practice
 *
 * The two FOUNDATIONS (meet, setups) come first; the lesson ends at Practice
 * (owner ruling 2026-10-04: no Sources page). "Where it sits" is gone: its
 * mic decisions moved into STARTING SETUPS.
 */
export type PageId = 'meet' | 'setups' | 'microphone' | 'placement' | 'context' | 'twoMic' | 'troubleshoot' | 'practice';
export const PAGE_IDS: readonly PageId[] = ['meet', 'setups', 'microphone', 'placement', 'context', 'twoMic', 'troubleshoot', 'practice'];
/**
 * The three SOURCE pages the 79 lessons of 2026-10-04/05 were written in.
 * Their words, checks and family page components stay where they were
 * authored; the journey BUILDS its pages from them (engine/restructure.ts):
 *   instrument + sound → meet;  setting → setups.
 * They are also the ids a learner's stored credit may still carry (never
 * deleted: engine/progress/creditMap.ts maps them).
 */
export type LegacyPageId = 'instrument' | 'sound' | 'setting';
export const LEGACY_PAGE_IDS: readonly LegacyPageId[] = ['instrument', 'sound', 'setting'];
/** The page a piece of lesson DATA is written for (a check's `page`, a
 *  family's own page component, a prediction): a journey page, or one of
 *  the three source pages the journey builds MEET IT and STARTING SETUPS
 *  from. */
export type SourcePageId = PageId | LegacyPageId;
/** A lesson's page words. Lessons written before the 2026-10-06 restructure
 *  give `instrument`, `sound` and `setting` (MEET IT and STARTING SETUPS are
 *  built from them); a lesson written to the new journey gives `meet` and
 *  `setups` itself. Read a page through `pageOf` (engine/restructure.ts). */
export type LessonPages = { [K in Exclude<PageId, 'meet' | 'setups'>]: PageContent } & Partial<Record<'meet' | 'setups' | LegacyPageId, PageContent>>;
/** A two-mic STARTING SETUP a lesson gives itself, where its two-mic page's
 *  pair is not in its copy (`copy.twoMic`): two zones (each mic at its
 *  zone's start pose) — the lesson's own researched starting points. Added
 *  2026-10-06; every one is logged in docs/labs/miking/CORRECTIONS_LOG.md.
 *  `pose` (2026-10-07): a zone that names TWO mics itself ("one over the
 *  treble and one over the bass", "two cardioids 17 cm apart") gives the
 *  mic its own pose inside that zone — drawn without the zone's start.
 *  `more`: drawn as ANOTHER START (both mics), never as the TWO MICS role. */
export type SetupPairData = { label: string; A: { zone: string; typeId?: string; pattern?: MicPattern; pose?: MicPose }; B: { zone: string; typeId?: string; pattern?: MicPattern; polarity?: 1 | -1; pose?: MicPose }; variants?: readonly VariantId[]; line?: string; more?: boolean };

export type ViewBox = { u0: number; u1: number; v0: number; v1: number };
export type InstrumentModel = {
  id: string;
  name: string;
  parts: Part[];
  regions: RadiatingRegion[];
  surfaces: ReferenceSurface[];
  lines: RefLine[];
  envelopes: Envelope[];
  variants: Variant[];
  defaultVariant: VariantId;
  views: Partial<Record<ViewId, ViewBox>>;
  /** Views whose drawing reaches past its modelled parts (a harp's strings
   *  seen from above, an accordion's bellows): a scene with no mic on it fits
   *  the authored box there instead of the content frame
   *  (geometry/contentFrame.ts; pinned by test/mikingContentFrame). */
  fitAuthored?: Partial<Record<ViewId, true>>;
  /** How far the aim may swing left–right by drag (deg; default 80). 180
   *  lets a mic face the other way (behind an open-backed cabinet). */
  aimAzLimit?: number;
  /** A variant that shows a different drum (the tom lesson's rack pair or
   *  floor tom) frames its own boxes. */
  viewsByVariant?: Partial<Record<VariantId, Partial<Record<ViewId, ViewBox>>>>;
  /** What each view is called on screen (default "SIDE · CUTAWAY" / "TOP ·
   *  CUTAWAY"): a hand drum's side view is an elevation, not a cut. */
  viewTags?: Partial<Record<ViewId, string>>;
  yFloor: Dim;
  /** A variant's own floor line, when it differs (a violinist standing or
   *  seated: the instrument's frame stays put, the floor moves). */
  yFloorByVariant?: Partial<Record<VariantId, number>>;
  /** The interior a mic counts as "inside". */
  interior: Interior;
  interiors?: Interior[];
  /** Hoops a clip mount may clamp to (none: a clip mic is unconstrained). */
  rims?: Rim[];
  /** Port per variant (none = intact). */
  ports: Record<VariantId, { c: Vec3; r: number } | null>;
  /** A floor that moves with the variant (a drum raised on a stand): y per
   *  variant; others use `yFloor`. */
  floorByVariant?: Partial<Record<VariantId, number>>;
  mountRule?: MountRule;
  /** An overhead ('boom') mount's boom runs level AWAY from this point in plan
   *  (the kit's centre): the stand stands outside the kit. */
  boomHub?: Vec3;
  /** Where a mic FACING the instrument points, when that is not −x (the
   *  guitar family: a mic faces the top along −z, az = −90°). The dock's AIM
   *  lane and the plan-view aim drag then turn ±80° about this home, and a
   *  mic seen end-on in the side view is moved, not turned, by a drag.
   *  Absent: the kick's behaviour, unchanged. */
  aimHome?: { az: number; el: number };
  /** The smallest fit scale at which the scene still prints part labels
   *  (default 0.12, PlacementScene). A tall instrument framed with its seated
   *  player (the tuba, bell up) sits below that on a phone; its labels have
   *  short forms and leaders, so it may lower the floor (Lab 3, 2026-10-05). */
  labelMinScale?: number;
  /** How a stand's boom is routed, per variant (none = straight behind the
   *  mic, the drums' rule). */
  boomRoute?: Partial<Record<VariantId, BoomRoute>>;
  /** Where the glass's mini inset of the other view sits (default 'top',
   *  top-right). 'bottom' puts it bottom-right — per variant if need be: a
   *  long instrument framed edge to edge (the guitar family) puts its
   *  headstock in one of the two right-hand corners. */
  insetAt?: 'top' | 'bottom' | Partial<Record<VariantId, 'top' | 'bottom'>>;
  /** The largest box a STARTING SETUPS drawing may grow to, per view (Lab 5,
   *  the voice, 2026-10-07): a standing singer framed head to floor made a
   *  15 cm vocal distance about 25 px on a phone, so the drawing keeps to the
   *  head and shoulders and the stand runs on off the bottom edge, as it
   *  does in the Placement Studio. Absent: the whole setup, stand foot and
   *  floor included (every earlier lesson). */
  setupFrameMax?: Partial<Record<ViewId, ViewBox>>;
  /** A rectangle per variant and main view (mm) the inset must not cover —
   *  the guitars' headstock and tuners; the glass takes the other corner
   *  when the preferred one would (DualView, labelLayout.chooseInsetCorner). */
  insetKeepClear?: Partial<Record<VariantId, Partial<Record<ViewId, ViewBox>>>>;
};

/** The model's view boxes for a variant (its own, else the model's). */
export function viewsOf(model: Pick<InstrumentModel, 'views' | 'viewsByVariant'>, variant: VariantId): Partial<Record<ViewId, ViewBox>> {
  return { ...model.views, ...(model.viewsByVariant?.[variant] ?? {}) };
}
/** The line readouts measure from: the one belonging to the chosen reference
 *  head when a line names it, else the variant's first line. */
export function lineFor(model: Pick<InstrumentModel, 'lines'>, variant: VariantId, surfaceId: string): string {
  const inV = model.lines.filter((l) => !l.variants || l.variants.includes(variant));
  return (inV.find((l) => l.surfaces?.includes(surfaceId)) ?? inV[0] ?? model.lines[0])?.id ?? '';
}
/** A wrong option -> why it is wrong (elaborated feedback: the misconception
 *  the learner just chose is answered, not only "try again"). */
export type WhyWrong = Readonly<Record<string, string>>;
export type MikingScenario = { id: string; page: SourcePageId; prompt: string; options: readonly string[]; correct: string; explain: string; why: WhyWrong };
export type Symptom = { id: string; observation: string; firstChecks: string; src?: SrcKey; options: readonly string[]; correct: string; explain: string; why: WhyWrong };
/** Put the steps of a procedure in order. `steps` is the right order; a tap
 *  on a step that cannot come yet is answered with that step's `early`. */
export type OrderTask = { id: string; page: SourcePageId; prompt: string; steps: readonly { text: string; early: string }[]; explain: string };
/**
 * A constructed setup task (the lesson's final task, L89): a brief, a choice
 * of setup where SEVERAL are acceptable, then the reasons the learner gives
 * for it. Feedback checks the reasoning for consistency with the brief and
 * the chosen setup; it never compares with one fixed answer.
 */
export type SetupChoice = { id: string; label: string; ok: boolean; power: 'none' | 'phantom'; feedback: string };
export type SetupReason = { id: string; label: string; role: 'required' | 'optional' | 'wrong'; feedback: string };
export type SetupTask = { id: string; page: SourcePageId; brief: string; setups: readonly SetupChoice[]; reasons: readonly SetupReason[]; explain: string };
/** An ungraded prediction made BEFORE an activity (try before tell). */
export type Prediction = { prompt: string; options: readonly string[]; after: string };
/** A QUICK CHECK item (the experienced path, LESSON_JOURNEY §2.5): one pick,
 *  no retry; `covers` is the FOUNDATION page it tests (as authored: a source
 *  page maps to the journey page built from it — instrument and sound to
 *  meet, setting to setups); a `critical` item (safety) fails the check when
 *  it is wrong, whatever the score. */
export type DiagnosticItem = { id: string; covers: SourcePageId; critical?: boolean; prompt: string; options: readonly string[]; correct: string; explain: string; why: WhyWrong };
/** ORIENT: what the instrument is, in a few plain facts (no tasks). `src`
 *  is the internal record (never shown). */
export type OrientFact = { title: string; text: string; src: SrcKey };
/** HOW IT SOUNDS: one stage of the explanatory strike sequence. `ported`
 *  replaces `text` when the front head has a port. */
export type SoundStage = { title: string; text: string; ported?: string; /** Replaces `text` in that variant (the snares off, a head removed). */ byVariant?: Partial<Record<VariantId, string>> };
export type SoundContent = {
  stages: readonly SoundStage[];
  /** The attack / body account, in words (no curve; LESSON_JOURNEY §6). */
  attack: string;
  body: string;
  /** The head drawn face-on on the shapes step: its nominal diameter and rod
   *  count (`strikeSrc` is the internal record). */
  head: { diameterMm: number; rods: number; label: string; strikeSrc: SrcKey; hoop?: 'wood' | 'metal'; /** 'kettle': a timpani's measured pitch ratios (engine/physics/kettle.ts); default the ideal membrane. */ shapes?: 'ideal' | 'kettle' };
};
/** THE SETTING: a neighbour of the instrument on the plan, and what it means
 *  for a mic on this instrument. Positions are the art's (`prov` internal). */
export type SettingItem = {
  id: string;
  label: string;
  short: string;
  note: string;
  prov: Provenance;
  scene: 'kit' | 'stage' | 'studio' | 'all';
  /** One bezel word: what it means for a mic here. */
  tag: string;
  /** The kit plan's items this one stands for (default: its own id), e.g.
   *  one "rack toms" item for the plan's two toms. */
  planIds?: readonly string[];
};
export type SettingContent = { items: readonly SettingItem[]; stage: string; studio: string };
export type PageCredit = { scenarios: string[]; interactive?: string; note: string };
export type PageContent = { title: string; goal: string; credit: PageCredit; takeaway: string };
export type Lesson = {
  id: string;
  labId: MikingLabId;
  title: string;
  subtitle: string;
  /** The instrument's short noun, for the journey's wording ("kick" / "kicks").
   *  `subject`: what MEET IT and STARTING SETUPS show, when the lesson is
   *  named for a mic role rather than an instrument ("kit overhead" → the
   *  drum kit). Default: `one`. */
  noun: { one: string; many: string; subject?: string };
  model: InstrumentModel;
  micTypeIds: string[];
  zones: DocumentedZone[];
  pages: LessonPages;
  scenarios: MikingScenario[];
  symptoms: Symptom[];
  orderTasks: OrderTask[];
  setupTasks: SetupTask[];
  /** One prediction per rack page, asked before the activity. */
  predictions: Partial<Record<SourcePageId, Prediction>>;
  /** STARTING SETUPS the lesson's zones and copy cannot give on their own
   *  (engine/setups.ts): a two-mic pair whose two-mic page keeps its pair in
   *  its art. Added 2026-10-06 and logged in CORRECTIONS_LOG.md. */
  setupPairs?: readonly SetupPairData[];
  /** ORIENT's facts, HOW IT SOUNDS and THE SETTING (the foundations). */
  orient: readonly OrientFact[];
  sound: SoundContent;
  setting: SettingContent;
  /** The experienced path's QUICK CHECK (6 items, foundations only). */
  diagnostic: readonly DiagnosticItem[];
  practice: { task: string; fields: { id: string; label: string; kind: 'text' | 'choice'; choices?: string[] }[] };
  /** INTERNAL record (never shown): each unknown in words; `dims` names the
   *  placeholders it covers (validateLesson checks every placeholder is listed).
   *  The references, the source audit and the corrections live in
   *  docs/labs/miking/ (SOURCES.md, CORRECTIONS_LOG.md) since the owner ruling
   *  of 2026-10-04 took the Sources page out of the lesson. */
  unknowns: { text: string; dims: string[] }[];
  live: { wedges: Wedge[] };
  /** The one "about these starting points" note, behind the header's ⓘ. */
  accuracyDetail: string;
  /** The pages' instrument words (engine/model/copy.ts); none = neutral words. */
  copy?: Partial<LessonCopy>;
};
