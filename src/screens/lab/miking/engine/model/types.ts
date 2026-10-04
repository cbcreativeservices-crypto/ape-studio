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

/* ── provenance (charter §2: a fact without a source is 'unknown', never drawn as known) ── */
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
  /** Where its geometry comes from (shown on page 1 and page 8). */
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
};
export type RefLine = { id: string; label: string; point: Vec3; dir: Vec3 };
export type Envelope = { id: string; label: string; shape: Shape3; prov: Provenance; variants?: VariantId[]; clearance?: number };

export type ZoneKind = 'sourced' | 'trial';
export type DocumentedZone = {
  id: string;
  /** Short label for the bezel / chips. */
  label: string;
  /** The band in the source's own unit first, e.g. "5 to 7.5 cm (2 to 3 in)". */
  band: string;
  kind: ZoneKind;
  src: SrcKey;
  /** Verbatim source words (sourced) or the trial note. */
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
  /** "Go to zone" pose: inside the zone and collision-free (tested). */
  start: MicPose;
  /** The tendency, in words ("tendency", never "result"). */
  tendency: string;
  checks: string[];
};

/* ── microphones by property (brands only as provenance) ── */
export type PatternId = 'omni' | 'cardioid' | 'supercardioid' | 'hypercardioid' | 'figure8';
/** 'unstated' / 'halfCardioid' draw NO free-field lobe. */
export type MicPattern = PatternId | 'unstated' | 'halfCardioid';
export type MountKind = 'stand' | 'surface' | 'clip';
export type MicArtId = 'kickDynamic' | 'sdc' | 'boundary';
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
export type Wedge = { id: string; label: string; p: Vec3; az: number };

/** One collision solid, flattened for the worklets (plain data only). */
export type Solid = { partId: string; label: string; shape: Shape3; clearance: number };
/** What `checkAssembly` needs to know about the mic (plain data). */
export type MicBody = { length: number; radius: number; mount: MountKind; surfacePartId?: string };
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
export type PageId = 'instrument' | 'microphone' | 'placement' | 'context' | 'twoMic' | 'troubleshoot' | 'practice' | 'sources';
export const PAGE_IDS: readonly PageId[] = ['instrument', 'microphone', 'placement', 'context', 'twoMic', 'troubleshoot', 'practice', 'sources'];

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
};
export type MikingScenario = { id: string; page: PageId; prompt: string; options: readonly string[]; correct: string; explain: string };
export type Symptom = { id: string; observation: string; firstChecks: string; src?: SrcKey; options: readonly string[]; correct: string; explain: string };
export type SourceRef = { key: SrcKey; label: string; url?: string; checked?: string; note?: string };
export type PageCredit = { scenarios: string[]; interactive?: string; note: string };
export type PageContent = { title: string; goal: string; credit: PageCredit; takeaway: string };
export type Lesson = {
  id: string;
  labId: MikingLabId;
  title: string;
  subtitle: string;
  model: InstrumentModel;
  micTypeIds: string[];
  zones: DocumentedZone[];
  pages: Record<PageId, PageContent>;
  scenarios: MikingScenario[];
  symptoms: Symptom[];
  practice: { task: string; fields: { id: string; label: string; kind: 'text' | 'choice'; choices?: string[] }[] };
  sources: SourceRef[];
  audit: { agreement: string; tension: string; gaps: string };
  unknowns: string[];
  corrections: { id: string; text: string }[];
  live: { wedges: Wedge[] };
  accuracyDetail: string;
};
