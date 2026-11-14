/**
 * stageplot/spTypes — THE ONE PROJECT MODEL of the Stage Plot and Channel
 * Designer (must-do D60; owner GO 2026-11-12). The stage drawing, the input
 * list, the monitor plan, the equipment summary and the exported packet are
 * all READ from this one object, so an edit in one place cannot disagree with
 * another.
 *
 * Rules the shape keeps (owner's handoff, sections 3 to 10):
 *   • STABLE IDS. Every row has an id that never changes. A channel NUMBER is
 *     an editable label and is never a key.
 *   • ONE INPUT = ONE PHYSICAL AUDIO CHANNEL reaching a mixer. A stereo
 *     source is two inputs, paired (L and R). A source with no connection to
 *     the sound system has no inputs and is still on the stage.
 *   • AN ICON IS NOT AN INPUT. A stage object may point at a performer, a
 *     source, an existing input or a monitor device. Placing an amplifier or
 *     a DI icon never adds a mixer input by itself.
 *   • A MIX IS NOT A DEVICE. A mix is what a performer hears; a wedge or an
 *     in-ear pack is equipment that plays it. Several devices may share one
 *     mix. Mix count, device count and output audio channels are separate.
 *   • UNKNOWN STAYS UNKNOWN. "To be confirmed" is a value, kept and printed;
 *     nothing here guesses phantom power, a DI's type or who supplies what.
 *   • STAGE SPACE, NOT PIXELS. Positions are fractions of the stage
 *     (x: 0 = stage right, the viewer's left … 1 = stage left;
 *      y: 0 = upstage, the top … 1 = downstage, the audience edge).
 *
 * Pure data and types only: no React, no native modules. Tests load it under
 * node with type stripping (explicit `.ts` specifiers, no enums).
 */

/** 2 (2026-11-13): stage shapes and numbered stage boxes. A plot saved at 1
 *  reads as a RECTANGLE with no stage boxes (spMigrate). */
export const SP_SCHEMA = 2;

export type SpId = string;

/** Who brings it. `tbc` = to be confirmed (printed as an open question). */
export type SpSupplier = 'band' | 'venue' | 'other' | 'tbc';

export type SpCategory = 'drums' | 'percussion' | 'bass' | 'guitars' | 'keys' | 'horns' | 'playback' | 'other' | 'vocals';

/** How the sound gets from the source to the mixer input. */
export type SpCapture = 'mic' | 'di' | 'line' | 'wireless' | 'custom';
export type SpPriority = 'preferred' | 'required' | 'flexible';
export type SpStand = 'none' | 'straight' | 'tall-boom' | 'short-boom' | 'clamp' | 'custom';
export type SpPhantom = 'required' | 'not-required' | 'do-not-apply' | 'unknown';
/** Which system the input feeds. `both` = house and the band's own rig,
 *  through a split the band describes. */
export type SpDestination = 'house' | 'band' | 'both' | 'custom';
export type SpAudience = 'audience' | 'monitor-only' | 'tbc';

export type SpPerformer = {
  id: SpId;
  name: string;
  /** What they do, in the band's words: "Drums", "Guitar and lead vocal". */
  role: string;
  /** null = not answered yet (asked in review); true = wants no monitor. */
  noMonitor: boolean | null;
};

/** A musical source: a kick drum, a keyboard, a lead vocal. */
export type SpSource = {
  id: SpId;
  label: string;
  category: SpCategory;
  performerId: SpId | null;
  /** `inputs` = it reaches the sound system through one or more inputs.
   *  `none` = no sound-system connection needed (acoustic, or self-contained). */
  connection: 'inputs' | 'none';
  /** Asked once when a source has no input: null = not answered yet. */
  noneReason: 'acoustic' | 'self-contained' | null;
  /** True when the user said "this source is intentionally off the stage". */
  offstage: boolean;
  /** Where on the stage, in the band's own words (optional). */
  locationNote: string;
};

/** One capture path = one physical audio channel at a mixer. */
export type SpInput = {
  id: SpId;
  sourceId: SpId;
  /** "Kick", "Bass DI", "Keys L", "Lead vocal". */
  label: string;
  /** Stereo side, and the id shared by the two inputs of one stereo pair. */
  side: 'L' | 'R' | null;
  pairId: SpId | null;
  capture: SpCapture;
  /** Preferred model or a generic category ("dynamic vocal microphone"). */
  equipment: string;
  /** Acceptable alternatives, in the band's words. */
  alternatives: string;
  priority: SpPriority;
  connector: string;
  level: string;
  adapterNote: string;
  stand: SpStand;
  standNote: string;
  phantom: SpPhantom;
  /** Who supplies the microphone / DI / receiver for this path. */
  supplier: SpSupplier;
  /** Stands can have a different supplier from the microphone. */
  standSupplier: SpSupplier;
  /** The DI device this path uses (capture 'di'); null = arrangement to confirm. */
  diDeviceId: SpId | null;
  destination: SpDestination;
  /** How the split is made when destination is `both` (or a custom note). */
  splitNote: string;
  audience: SpAudience;
  /** A click, cue or private talkback: monitor only unless changed on purpose. */
  cue: boolean;
  /** The band said: yes, the audience is meant to hear this click or cue.
   *  Cleared whenever its routing changes, so the answer is never stale. */
  cueAudienceOk: boolean;
  notes: string;
  /** The stage box socket this input plugs into, or null (none chosen yet).
   *  `byHand` = the band chose it; AUTO-ASSIGN never moves such a socket. */
  box: SpBoxPatch | null;
  /** True when the band said: this input goes to the console directly, not
   *  through a stage box (the review stops asking about it). */
  direct: boolean;
};

/** Where an input plugs in on a stage box: "SB2 · 7". */
export type SpBoxPatch = { boxId: SpId; socket: number; byHand: boolean };

/** A real stage box: the box on the stage the input cables plug into. A
 *  digital stage box sends its inputs to the console over one network cable;
 *  an analog box is the end of a multicore cable (a "snake" or "multi"). Its
 *  size is its number of input sockets, as sold (8, 12, 16, 24, 32, 48). */
export type SpStageBox = {
  id: SpId;
  /** "SB1", or the band's own name. */
  name: string;
  /** Input sockets (XLR inputs). */
  inputs: number;
  /** Returns (outputs back to the stage, for wedges or amplifiers); null =
   *  not given. */
  returns: number | null;
  kind: 'digital' | 'analog' | 'unknown';
  supplier: SpSupplier;
  note: string;
};

/** An actual DI device: one mono box carries 1 channel, a stereo box 2. */
export type SpDiDevice = {
  id: SpId;
  label: string;
  channels: 1 | 2;
  /** Passive, active (battery or phantom) or not known: never guessed. */
  kind: 'passive' | 'active' | 'unknown';
  model: string;
  supplier: SpSupplier;
};

/** A destination system with its own channel numbers. `house` always exists;
 *  `band` appears when an input feeds the band's own rig. Channel numbers are
 *  compared for duplicates INSIDE one patch only. */
export type SpPatchId = 'house' | 'band';
export type SpPatch = {
  id: SpPatchId;
  name: string;
  /** Input ids in the proposed order for this system. */
  order: SpId[];
  /** The band's proposed channel number for each input (null = none yet). */
  numbers: Record<SpId, number | null>;
  /** Channel numbers the band keeps free on purpose. */
  reserved: number[];
  /** The venue's own console channel or stage-box socket, when it differs
   *  (free text: "CH 17", "SB-A 4"). Never renumbered by this tool. */
  venue: Record<SpId, string>;
};

export type SpMixFormat = 'mono' | 'stereo';
export type SpMixProvider = 'house' | 'band-console' | 'personal-mixer' | 'tbc';
export type SpDelivery = 'wedge' | 'wired-iem' | 'wireless-iem' | 'drum-fill' | 'sidefill' | 'custom';
/** What a performer wants of one source in their mix: an advance preference,
 *  not a fader value. */
export type SpMixNeed = 'primary' | 'supporting' | 'not-needed' | 'exclude';
/** What the venue must provide for a rig the band mixes itself. */
export type SpVenueFeed = 'split' | 'feeds' | 'returns' | 'none' | 'tbc';

export type SpMix = {
  id: SpId;
  /** "M1", "M2": a label, renumbered only when the user asks. */
  code: string;
  name: string;
  /** Performer ids. */
  recipients: SpId[];
  format: SpMixFormat;
  provider: SpMixProvider;
  delivery: SpDelivery;
  /** Requested output channels or sockets, when known (free text). */
  outputs: string;
  /** Short instructions chosen from a list, plus the band's own. */
  instructions: string[];
  /** Per input: what this mix needs of it. An input not listed = no preference. */
  needs: Record<SpId, SpMixNeed>;
  /** For a rig the band mixes itself: what the venue provides. */
  venueFeed: SpVenueFeed;
  notes: string;
};

export type SpDeviceType = 'wedge' | 'iem-tx' | 'iem-pack' | 'hp-amp' | 'drum-fill' | 'sidefill' | 'personal-mixer' | 'custom';

/** A piece of monitor equipment. Every real item has its own id, even when
 *  two share a model name. */
export type SpDevice = {
  id: SpId;
  type: SpDeviceType;
  label: string;
  /** The mix it plays; null = not assigned (flagged), unless self-contained. */
  mixId: SpId | null;
  /** Part of a rig that needs nothing from the venue's monitor system. */
  selfContained: boolean;
  /** Who uses it (a pack or a headphone amplifier), when it is personal. */
  performerId: SpId | null;
  model: string;
  supplier: SpSupplier;
  /** Wireless: the plot records that coordination is needed; it never
   *  generates frequencies. */
  wireless: boolean;
  note: string;
};

/** Something the band wants listed that is not a capture path or a monitor
 *  device: a stage box, a split, backline, a riser, a power location. */
export type SpExtra = {
  id: SpId;
  kind: 'stage-box' | 'split' | 'backline' | 'riser' | 'power' | 'other';
  label: string;
  qty: number;
  supplier: SpSupplier;
  note: string;
};

export type SpObjectKind =
  | 'performer'
  | 'vocal-mic'
  | 'drum-kit'
  | 'percussion'
  | 'congas'
  | 'timbales'
  | 'bongo'
  | 'guitar-amp'
  | 'bass-amp'
  | 'keyboard'
  | 'piano'
  | 'acoustic-guitar'
  | 'horn'
  | 'playback'
  // more symbols for more diverse music (owner 2026-11-13; builder B)
  | 'upright-bass'
  | 'cello'
  | 'violin'
  | 'harp'
  | 'grand-piano'
  | 'organ'
  | 'leslie'
  | 'electric-piano'
  | 'keyboard-rig'
  | 'accordion'
  | 'banjo'
  | 'mandolin'
  | 'cajon'
  | 'djembe'
  | 'tabla'
  | 'steel-pan'
  | 'vibraphone'
  | 'e-drums'
  | 'dj'
  | 'saxophone'
  | 'trombone'
  | 'choir'
  | 'mic-stand'
  | 'di'
  | 'wedge'
  | 'iem'
  | 'drum-fill'
  | 'sidefill'
  | 'rack'
  | 'stage-box'
  | 'power'
  | 'chair'
  | 'music-stand'
  | 'riser'
  | 'generic';

/** Something drawn on the stage. It may point at ONE thing in the model; it
 *  never creates an input by being placed. */
export type SpObject = {
  id: SpId;
  kind: SpObjectKind;
  /** Stage space, 0…1 (see the header). Outside 0…1 = off the stage. */
  x: number;
  y: number;
  /** Degrees clockwise; 0 = facing the audience (down the page). */
  rot: number;
  label: string;
  /** Risers and generic boxes: size as fractions of the stage width/depth. */
  w: number | null;
  h: number | null;
  /** A riser's height or any size note, in the band's words. */
  sizeNote: string;
  performerId: SpId | null;
  sourceId: SpId | null;
  inputId: SpId | null;
  deviceId: SpId | null;
  /** A stage box's drawing points at its box (its name is printed beside it). */
  boxId: SpId | null;
  /** Objects with the same group id move, duplicate and delete together. */
  groupId: SpId | null;
  /** True when the user said "this is off the stage on purpose". */
  offstageOk: boolean;
  /** True when the user said "this is only a drawing: it needs no input". */
  visualOnly: boolean;
  note: string;
};

export type SpContact = {
  name: string;
  role: string;
  email: string;
  phone: string;
  /** What appears in the export: the user chooses each one. */
  show: { name: boolean; role: boolean; email: boolean; phone: boolean };
};

/** The shape of the stage (2026-11-13). Positions stay fractions of the MAIN
 *  stage (width × depth): a thrust's tongue lies past y = 1 (into the
 *  audience), a wing past x = 0 or x = 1. In the round, the stage is the
 *  width × depth square, or the circle inside it (depth = width). */
export type SpStageShape = 'rect' | 'thrust' | 'round' | 'wings';

export type SpStage = {
  /** null = not given; the export then says "Not to scale". */
  width: number | null;
  depth: number | null;
  unit: 'ft' | 'm';
  dims: 'confirmed' | 'estimated';
  grid: boolean;
  snap: boolean;
  shape: SpStageShape;
  /** Thrust: the tongue's width and depth, in `unit` (null = not given). */
  thrustWidth: number | null;
  thrustDepth: number | null;
  /** With wings: the width of each wing, in `unit` (null = not given). */
  wingWidth: number | null;
  /** In the round: a circle or a square. */
  roundForm: 'circle' | 'square';
  /** In the round: the name of the side drawn at the bottom (the reference
   *  side, usually where the mix position is): "FOH". */
  roundRef: string;
};

export type SpStatus = 'draft' | 'ready';

export type SpProject = {
  schema: number;
  id: SpId;
  /** A band's reusable master, or a copy made for one gig. */
  kind: 'master' | 'gig';
  /** The master a gig copy came from (the master is never changed by it). */
  masterId: SpId | null;
  band: string;
  title: string;
  venue: string;
  /** ISO day (YYYY-MM-DD) or ''. */
  eventDate: string;
  loadIn: string;
  soundcheck: string;
  performance: string;
  contact: SpContact;
  /** The revision printed on every page. It moves forward by one on the
   *  first edit after an export or after "Ready to advance". */
  revision: number;
  /** The revision last frozen (exported, or marked ready); 0 = never. */
  frozenRevision: number;
  /** The revision a real PACKET was last made from (DOWNLOAD PDF, SHARE,
   *  PRINT); 0 = never. Ready and COPY TECHNICAL SUMMARY freeze a revision
   *  but never set this (bug test R2-SP1-01). A plot saved before this field
   *  existed reads 0: nothing is taken as exported. */
  packetRevision: number;
  status: SpStatus;
  /** Recorded only if the user says so; separate from `status`. */
  venueConfirmed: boolean;
  /** Milliseconds since 1970 (set by the store, not by the model). */
  modifiedAt: number;
  createdAt: number;
  stage: SpStage;
  notes: string;
  accessNotes: string;
  /** A note that explains the viewpoint of left/right labels (overheads). */
  viewNote: string;
  performers: SpPerformer[];
  sources: SpSource[];
  inputs: SpInput[];
  diDevices: SpDiDevice[];
  patches: SpPatch[];
  mixes: SpMix[];
  devices: SpDevice[];
  extras: SpExtra[];
  /** Numbered stage boxes (2026-11-13). */
  boxes: SpStageBox[];
  objects: SpObject[];
  /** The next number used to make an id in this project. */
  seq: number;
  /** Which template it started from ('' = blank), shown as an assumption. */
  startedFrom: string;
  /** True only for a plot started from the BLANK stage (or a duplicate or
   *  gig copy of one). Only such a plot earns the lab's credit (owner
   *  2026-11-13, R2-SP1-04). A plot saved before this field existed reads
   *  false: where it started cannot be known for certain. */
  startedBlank: boolean;
};

/** What the export is asked to make. */
export type SpPaper = 'letter' | 'a4';
export type SpPacketKind = 'full' | 'plot' | 'compact';
export type SpExportOptions = {
  paper: SpPaper;
  packet: SpPacketKind;
};

/** A frozen copy: every page of one export is made from this and nothing else. */
export type SpSnapshot = {
  project: SpProject;
  options: SpExportOptions;
  /** Milliseconds since 1970. */
  generatedAt: number;
};
