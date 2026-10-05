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
  | { kind: 'floor'; y: number };

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
  words?: { plus: string; minus: string; keyPlus: string; keyMinus: string };
  variants?: VariantId[];
};
export type Envelope = { id: string; label: string; shape: Shape3; prov: Provenance; variants?: VariantId[]; clearance?: number };

export type ZoneKind = 'sourced' | 'trial';
/** How a zone is drawn in one view: a rectangle (u/v, mm), or a ring sector
 *  about (cu, cv) between radii r0..r1 and angles a0..a1 (deg, from +u
 *  toward +v) — a starting point that runs round a drum's rim, from above. */
export type ZoneDraw = { u0: number; u1: number; v0: number; v1: number } | { cu: number; cv: number; r0: number; r1: number; a0: number; a1: number };
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
  /** `variants`: any of these (the tom lesson's drum choice). */
  requires?: { variant?: VariantId; variants?: VariantId[]; mount?: MountKind; micTypeIds?: string[] };
  /** Where the source's row includes an orientation ("on-axis with beater",
   *  "facing the beater head"): the mic's front axis must be within
   *  `maxOffAxis` degrees of −normal of the zone's own head — and, with
   *  `minOffAxis`, at least that far ("30–60° from straight down"). The
   *  tolerance is the lab's (ILLUSTRATIVE unless a source gives one). */
  aim?: { maxOffAxis: number; minOffAxis?: number; prov: Provenance };
  /** "Aim mic at drum head": the mic's front axis, followed forward, meets
   *  the named surface's plane within `r` of its point (prov internal). */
  aimAt?: { surface: string; r: number; prov: Provenance };
  /** The front must also lie in this box (a region between two drums). */
  box?: { min: Vec3; max: Vec3; prov: Provenance };
  /** How the zone is DRAWN in each view (mm, u/v), when the band cannot be
   *  read off an x-axis head (an upright drum): derived in the lesson's
   *  geometry from the same numbers. */
  drawn?: Partial<Record<ViewId, ZoneDraw>>;
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
export type MountKind = 'stand' | 'surface' | 'clip';
export type MicArtId = 'kickDynamic' | 'sdc' | 'boundary' | 'smallDynamic' | 'clipDynamic' | 'gooseneck';
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
  /** A clip mount's reach from the hoop to the mic's tail (default CLIP_REACH). */
  clip?: { reach: Dim };
  surfacePartId?: PartId;
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
export type MicBody = { length: number; radius: number; mount: MountKind; surfacePartId?: string; reach?: number };
/** The space a mic counts as "inside": along `axis` (default +x, absolute x)
 *  between x0 and x1 from c, within rIn of the axis. */
export type Interior = { x0: number; x1: number; rIn: number; c: Vec3; axis?: Vec3 };
/** A hoop a clip mount can clamp to: the circle of radius r about c, in the
 *  plane normal to `axis` (ILLUSTRATIVE: no source gives a clamp's reach). */
export type Rim = { id: string; label: string; c: Vec3; axis: Vec3; r: number; variants?: VariantId[] };
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
  /** Illustrative mount geometry. */
  boom: { radius: number; outside: number; behind: number };
  standRadius: number;
};

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
/** The lesson's pages in JOURNEY order (docs/labs/miking/LESSON_JOURNEY.md):
 *  the three FOUNDATIONS (orient, how it sounds, the setting) come first; the
 *  lesson ends at Practice (owner ruling 2026-10-04: no Sources page). */
export type PageId = 'instrument' | 'sound' | 'setting' | 'microphone' | 'placement' | 'context' | 'twoMic' | 'troubleshoot' | 'practice';
export const PAGE_IDS: readonly PageId[] = ['instrument', 'sound', 'setting', 'microphone', 'placement', 'context', 'twoMic', 'troubleshoot', 'practice'];

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
  /** A variant that shows a different drum (the tom lesson's rack pair or
   *  floor tom) frames its own boxes. */
  viewsByVariant?: Partial<Record<VariantId, Partial<Record<ViewId, ViewBox>>>>;
  yFloor: Dim;
  /** The interior a mic counts as "inside". */
  interior: Interior;
  interiors?: Interior[];
  /** Hoops a clip mount may clamp to (none: a clip mic is unconstrained). */
  rims?: Rim[];
  /** Port per variant (none = intact). */
  ports: Record<VariantId, { c: Vec3; r: number } | null>;
};

/** The model's view boxes for a variant (its own, else the model's). */
export function viewsOf(model: Pick<InstrumentModel, 'views' | 'viewsByVariant'>, variant: VariantId): Partial<Record<ViewId, ViewBox>> {
  return { ...model.views, ...(model.viewsByVariant?.[variant] ?? {}) };
}
/** A wrong option -> why it is wrong (elaborated feedback: the misconception
 *  the learner just chose is answered, not only "try again"). */
export type WhyWrong = Readonly<Record<string, string>>;
export type MikingScenario = { id: string; page: PageId; prompt: string; options: readonly string[]; correct: string; explain: string; why: WhyWrong };
export type Symptom = { id: string; observation: string; firstChecks: string; src?: SrcKey; options: readonly string[]; correct: string; explain: string; why: WhyWrong };
/** Put the steps of a procedure in order. `steps` is the right order; a tap
 *  on a step that cannot come yet is answered with that step's `early`. */
export type OrderTask = { id: string; page: PageId; prompt: string; steps: readonly { text: string; early: string }[]; explain: string };
/**
 * A constructed setup task (the lesson's final task, L89): a brief, a choice
 * of setup where SEVERAL are acceptable, then the reasons the learner gives
 * for it. Feedback checks the reasoning for consistency with the brief and
 * the chosen setup; it never compares with one fixed answer.
 */
export type SetupChoice = { id: string; label: string; ok: boolean; power: 'none' | 'phantom'; feedback: string };
export type SetupReason = { id: string; label: string; role: 'required' | 'optional' | 'wrong'; feedback: string };
export type SetupTask = { id: string; page: PageId; brief: string; setups: readonly SetupChoice[]; reasons: readonly SetupReason[]; explain: string };
/** An ungraded prediction made BEFORE an activity (try before tell). */
export type Prediction = { prompt: string; options: readonly string[]; after: string };
/** A QUICK CHECK item (the experienced path, LESSON_JOURNEY §2.5): one pick,
 *  no retry; `covers` is the FOUNDATION page it tests; a `critical` item
 *  (safety) fails the check when it is wrong, whatever the score. */
export type DiagnosticItem = { id: string; covers: PageId; critical?: boolean; prompt: string; options: readonly string[]; correct: string; explain: string; why: WhyWrong };
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
  head: { diameterMm: number; rods: number; label: string; strikeSrc: SrcKey; hoop?: 'wood' | 'metal' };
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
  /** The instrument's short noun, for the journey's wording ("kick" / "kicks"). */
  noun: { one: string; many: string };
  model: InstrumentModel;
  micTypeIds: string[];
  zones: DocumentedZone[];
  pages: Record<PageId, PageContent>;
  scenarios: MikingScenario[];
  symptoms: Symptom[];
  orderTasks: OrderTask[];
  setupTasks: SetupTask[];
  /** One prediction per rack page, asked before the activity. */
  predictions: Partial<Record<PageId, Prediction>>;
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
