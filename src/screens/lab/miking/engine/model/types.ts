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
  /** A shell WALL (an annulus) with its axis parallel to x through (c.y, c.z). */
  | { kind: 'tube'; c: Vec3; rIn: number; rOut: number; x0: number; x1: number }
  /** A head: a disc of radius r between x0 and x1 (axis ∥ x), with an optional
   *  hole (a port) whose axis is also ∥ x. */
  | { kind: 'slab'; c: Vec3; r: number; x0: number; x1: number; hole?: { c: Vec3; r: number } }
  | { kind: 'box'; min: Vec3; max: Vec3 }
  | { kind: 'capsule'; a: Vec3; b: Vec3; r: number }
  /** A swept volume in an x–y plane about a pivot: an annular sector between
   *  radii r0..r1 and angles a0..a1 (radians, measured from +x toward +y),
   *  ±halfW in z. Beater / pedal travel. */
  | { kind: 'sweep'; pivot: Vec3; r0: number; r1: number; a0: number; a1: number; halfW: number }
  /** The floor half-space: solid where y > y (y-down). */
  | { kind: 'floor'; y: number }
  /** A solid capped cone (a cylinder when ra = rb) along a → b, at ANY
   *  orientation: radius ra at a, rb at b. Upright and tilted drums (the
   *  hand-drum family), stands' columns, hand envelopes. */
  | { kind: 'frustum'; a: Vec3; b: Vec3; ra: number; rb: number };

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
  /** Where its geometry comes from (internal record; never shown). */
  prov: Provenance;
};
export type Variant = { id: VariantId; label: string; blurb: string };

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
};
export type RefLine = { id: string; label: string; point: Vec3; dir: Vec3 };
export type Envelope = { id: string; label: string; shape: Shape3; prov: Provenance; variants?: VariantId[]; clearance?: number };

export type ZoneKind = 'sourced' | 'trial';
/** A zone's drawn region in one view (mm; u/v of that view). */
export type ZoneDraw = { u0: number; u1: number; v0: number; v1: number; round?: boolean };
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
  /** Distance from a reference line (mm). */
  radial?: { line: string; min?: number; max?: number; prov: Provenance };
  requires?: { variant?: VariantId; mount?: MountKind; micTypeIds?: string[] };
  /** Where the source's row includes an orientation ("on-axis with beater",
   *  "facing the beater head"): the mic's front axis must be within
   *  `maxOffAxis` degrees of −normal of the zone's own head. The tolerance is
   *  the lab's (ILLUSTRATIVE unless a source gives one). */
  aim?: {
    maxOffAxis: number;
    prov: Provenance;
    /** A lower bound too ("at a 40–60° angle"): the aim must be at least this far off. */
    minOffAxis?: number;
    /** Test the aim against this direction instead of −normal (a zone aimed
     *  ACROSS its reference surface, e.g. "aimed at the bottom opening"). */
    dir?: Vec3;
  };
  /** The zone as each view DRAWS it (mm, the view's u/v), built from the
   *  same anchors as the test. Without it the engine projects the distance
   *  band along an x-normal (the kick's heads). `round` draws an ellipse. */
  draw?: Partial<Record<ViewId, ZoneDraw>>;
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
export type MountKind = 'stand' | 'surface' | 'clip';
export type MicArtId = 'kickDynamic' | 'sdc' | 'boundary' | 'clipMini';
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
  surfacePartId?: PartId;
  /** INTERNAL record: the products the drawn size and specs were read from (never shown). */
  examples: { model: string; fact: string; src: SrcKey }[];
  art: MicArtId;
  /** One sentence for page 2. */
  blurb: string;
  /** A clip mount's gooseneck length, mm (drawn; it holds the capsule off the rim). */
  neck?: Dim;
};

/* ── state ── */
export type MicPose = { p: Vec3; az: number; el: number };
export type MicSlot = 'A' | 'B';
export type MicState = { slot: MicSlot; typeId: string; pattern: MicPattern; pose: MicPose; polarity: 1 | -1; on: boolean };
export type ViewId = 'side' | 'top';
export type Scenario = 'studio' | 'live';
/** A floor monitor at an ILLUSTRATIVE stage position: `p` on the floor, the
 *  sound radiating from `p + lift` (its baffle), facing `faces`. */
export type Wedge = { id: string; label: string; short: string; p: Vec3; lift: number; faces: Vec3; note: string; prov: Provenance };

/** One collision solid, flattened for the worklets (plain data only). */
export type Solid = { partId: string; label: string; shape: Shape3; clearance: number };
/** What `checkAssembly` needs to know about the mic (plain data). */
export type MicBody = { length: number; radius: number; mount: MountKind; surfacePartId?: string; neck?: number };
/** The scene a lesson variant compiles to: solids + the routing anchors. */
export type CompiledScene = {
  variant: VariantId;
  solids: Solid[];
  /** The port centre the boom is routed through, when the variant has one. */
  port: { c: Vec3; r: number } | null;
  /** The interior a mic counts as "inside": x0 < x < x1, radius < rIn. */
  interior: { x0: number; x1: number; rIn: number; c: Vec3 };
  yFloor: number;
  /** Illustrative mount geometry. */
  boom: { radius: number; outside: number; behind: number };
  standRadius: number;
  /** The model's boom rule (InstrumentModel.mountRule), when it has one. */
  mountRule?: MountRule;
  /** Rims a clip mic can clamp to (InstrumentModel.rims). */
  rims?: Rim[];
};
/** A horizontal rim circle a clip mount clamps to: centre and radius, mm. */
export type Rim = { c: Vec3; r: number };
/**
 * How a stand mic's boom leaves its tail (ILLUSTRATIVE mount geometry). The
 * default (no rule) is the kick's: straight back along the mic's axis, or out
 * through the port. 'level': the boom runs HORIZONTALLY away from the mic's
 * tail (the horizontal part of −aim), or along `fallback` when the mic points
 * nearly straight up or down — so a mic aimed down at a hand drum hangs from a
 * boom beside the drums instead of a stand dropping through it.
 */
export type MountRule = { boom: 'level'; fallback: Vec3; length: number };
/** On-screen words a non-kick model supplies (the kick's are the defaults). */
export type ModelWords = {
  /** The scene description's subject per variant ("a pair of congas on the floor"). */
  subject?: Partial<Record<VariantId, string>>;
  /** The view tags on the canvas ("SIDE · CUTAWAY"). */
  viewTag?: Partial<Record<ViewId, string>>;
  /** POSITION's three axes: the chooser's words, and how a value is said. */
  axes?: Record<'x' | 'y' | 'z', { label: string; blurb: string; plus: string; minus: string; from: string }>;
  /** How a mic inside / outside the interior is said (default "inside / outside the drum"). */
  where?: { inside: string; outside: string };
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
  yFloor: Dim;
  /** The interior a mic counts as "inside". */
  interior: { x0: number; x1: number; rIn: number; c: Vec3 };
  /** Port per variant (none = intact). */
  ports: Record<VariantId, { c: Vec3; r: number } | null>;
  /** A floor that moves with the variant (a drum raised on a stand): y per
   *  variant; others use `yFloor`. */
  floorByVariant?: Partial<Record<VariantId, number>>;
  mountRule?: MountRule;
  /** Rims a clip-on mic's gooseneck can clamp to (drawn ILLUSTRATIVE reach). */
  rims?: Rim[];
  words?: ModelWords;
};
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
export type SoundStage = { title: string; text: string; ported?: string };
export type SoundContent = {
  stages: readonly SoundStage[];
  /** The attack / body account, in words (no curve; LESSON_JOURNEY §6). */
  attack: string;
  body: string;
  /** The head drawn face-on on the shapes step: its nominal diameter and rod
   *  count (`strikeSrc` is the internal record). */
  head: { diameterMm: number; rods: number; label: string; strikeSrc: SrcKey };
};
/** THE SETTING: a neighbour of the instrument on the plan, and what it means
 *  for a mic on this instrument. Positions are the art's (`prov` internal). */
export type SettingItem = { id: string; label: string; short: string; note: string; prov: Provenance; scene: 'kit' | 'stage' | 'studio' | 'all'; /** One bezel word: what it means for a mic here. */ tag: string };
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
};
