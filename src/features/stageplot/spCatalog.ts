/**
 * stageplot/spCatalog — the words and the ready-made choices of the Stage
 * Plot and Channel Designer: option labels, the conventional channel order,
 * the stage-object palette, and the SOURCE PACKAGES a band can add in one
 * step (and then edit row by row).
 *
 * A package is a STARTING POINT WITH VISIBLE ASSUMPTIONS (handoff §2, §4):
 * the rows are shown before they are added, every row can be changed or
 * removed, and a microphone named here is a common generic choice, never a
 * requirement. Nothing here decides phantom power or who supplies an item:
 * those start as "unknown" / "to be confirmed" and the band answers them.
 *
 * Pure data. US spelling.
 */
import type {
  SpAudience,
  SpCapture,
  SpCategory,
  SpDelivery,
  SpDestination,
  SpDeviceType,
  SpMixNeed,
  SpMixProvider,
  SpObjectKind,
  SpPhantom,
  SpPriority,
  SpStand,
  SpSupplier,
  SpVenueFeed,
} from './spTypes.ts';

/* ── words ──────────────────────────────────────────────────────────────── */

export const SP_SUPPLIER_WORD: Record<SpSupplier, string> = { band: 'Band', venue: 'Venue', other: 'Other provider', tbc: 'To be confirmed' };
export const SP_CAPTURE_WORD: Record<SpCapture, string> = {
  mic: 'Microphone',
  di: 'DI',
  line: 'Direct balanced line',
  wireless: 'Wireless receiver output',
  custom: 'Custom',
};
export const SP_PRIORITY_WORD: Record<SpPriority, string> = { preferred: 'Preferred', required: 'Required', flexible: 'Flexible' };
export const SP_STAND_WORD: Record<SpStand, string> = {
  none: 'None',
  straight: 'Straight stand',
  'tall-boom': 'Tall boom stand',
  'short-boom': 'Short boom stand',
  clamp: 'Clamp',
  custom: 'Custom',
};
export const SP_PHANTOM_WORD: Record<SpPhantom, string> = {
  required: 'Required',
  'not-required': 'Not required',
  'do-not-apply': 'Do not apply',
  unknown: 'To be confirmed',
};
export const SP_DESTINATION_WORD: Record<SpDestination, string> = {
  house: 'House system',
  band: 'Band monitor rig',
  both: 'Both, through a split',
  custom: 'Custom',
};
export const SP_AUDIENCE_WORD: Record<SpAudience, string> = { audience: 'Audience mix', 'monitor-only': 'Monitor only', tbc: 'To be confirmed' };
export const SP_CATEGORY_WORD: Record<SpCategory, string> = {
  drums: 'Drums',
  percussion: 'Percussion',
  bass: 'Bass',
  guitars: 'Guitars',
  keys: 'Keys',
  horns: 'Horns',
  playback: 'Playback',
  other: 'Other sources',
  vocals: 'Vocals',
};
export const SP_PROVIDER_WORD: Record<SpMixProvider, string> = {
  house: 'House console',
  'band-console': 'Band monitor console',
  'personal-mixer': 'Personal mixer system',
  tbc: 'To be confirmed',
};
export const SP_DELIVERY_WORD: Record<SpDelivery, string> = {
  wedge: 'Wedge',
  'wired-iem': 'Wired in-ear',
  'wireless-iem': 'Wireless in-ear',
  'drum-fill': 'Drum fill',
  sidefill: 'Sidefill',
  custom: 'Custom',
};
export const SP_NEED_WORD: Record<SpMixNeed, string> = { primary: 'Primary', supporting: 'Supporting', 'not-needed': 'Not needed', exclude: 'Must exclude' };
export const SP_VENUE_FEED_WORD: Record<SpVenueFeed, string> = {
  split: 'An input split',
  feeds: 'Feeds from the house console',
  returns: 'Return lines from the house position to the stage',
  none: 'No monitor feeds',
  tbc: 'To be confirmed',
};
export const SP_DEVICE_WORD: Record<SpDeviceType, string> = {
  wedge: 'Wedge',
  'iem-tx': 'Wireless in-ear transmitter',
  'iem-pack': 'In-ear receiver pack',
  'hp-amp': 'Wired headphone amplifier',
  'drum-fill': 'Drum fill',
  sidefill: 'Sidefill',
  'personal-mixer': 'Personal mixer',
  custom: 'Custom device',
};
/** What a listed extra is called when the band gave it no name of its own. */
export const SP_EXTRA_KIND_WORD: Record<'stage-box' | 'split' | 'backline' | 'riser' | 'power' | 'other', string> = {
  'stage-box': 'Stage box',
  split: 'Split',
  backline: 'Backline',
  riser: 'Riser',
  power: 'Power location',
  other: 'Other item',
};
/** Plural, for counts ("2 wedges"). */
export const SP_DEVICE_PLURAL: Record<SpDeviceType, string> = {
  wedge: 'wedges',
  'iem-tx': 'wireless in-ear transmitters',
  'iem-pack': 'in-ear receiver packs',
  'hp-amp': 'wired headphone amplifiers',
  'drum-fill': 'drum fills',
  sidefill: 'sidefills',
  'personal-mixer': 'personal mixers',
  custom: 'custom devices',
};

/** A conventional order for a channel list. A convenience, NOT a universal
 *  house standard (the tool says so where it offers it). */
export const SP_CATEGORY_ORDER: readonly SpCategory[] = ['drums', 'percussion', 'bass', 'guitars', 'keys', 'horns', 'playback', 'other', 'vocals'];

/** Short instructions a performer can pick for a mix. Advance preferences,
 *  not a promise of a finished monitor mix. */
export const SP_MIX_INSTRUCTIONS: readonly string[] = ['Own vocal prominent', 'Own instrument prominent', 'Some guitar', 'Some keys', 'Some bass', 'Some percussion', 'Kick and bass', 'Full band', 'Click required', 'No click'];

/* ── stage objects ──────────────────────────────────────────────────────── */

export type SpPaletteItem = {
  kind: SpObjectKind;
  name: string;
  /** Which palette row it sits in. */
  group: 'people' | 'instruments' | 'capture' | 'monitors' | 'stage';
  /** The label a new one gets ('' = none until the user names it). */
  label: string;
  /** Risers and generic boxes are sized; the rest are symbols. */
  sized: boolean;
};

export const SP_PALETTE: readonly SpPaletteItem[] = [
  { kind: 'performer', name: 'Performer', group: 'people', label: '', sized: false },
  { kind: 'vocal-mic', name: 'Vocal microphone', group: 'capture', label: 'Vocal', sized: false },
  { kind: 'drum-kit', name: 'Drum kit', group: 'instruments', label: 'Drums', sized: false },
  { kind: 'percussion', name: 'Percussion', group: 'instruments', label: 'Percussion', sized: false },
  { kind: 'congas', name: 'Congas', group: 'instruments', label: 'Congas', sized: false },
  { kind: 'timbales', name: 'Timbales', group: 'instruments', label: 'Timbales', sized: false },
  { kind: 'bongo', name: 'Bongó', group: 'instruments', label: 'Bongó', sized: false },
  { kind: 'guitar-amp', name: 'Guitar amplifier', group: 'instruments', label: 'Guitar amp', sized: false },
  { kind: 'bass-amp', name: 'Bass amplifier', group: 'instruments', label: 'Bass amp', sized: false },
  { kind: 'keyboard', name: 'Keyboard', group: 'instruments', label: 'Keys', sized: false },
  { kind: 'piano', name: 'Piano', group: 'instruments', label: 'Piano', sized: false },
  { kind: 'acoustic-guitar', name: 'Acoustic instrument', group: 'instruments', label: 'Acoustic', sized: false },
  { kind: 'horn', name: 'Horn', group: 'instruments', label: 'Horn', sized: false },
  { kind: 'playback', name: 'Playback rig', group: 'instruments', label: 'Playback', sized: false },
  { kind: 'mic-stand', name: 'Microphone on a stand', group: 'capture', label: '', sized: false },
  { kind: 'di', name: 'DI', group: 'capture', label: 'DI', sized: false },
  { kind: 'wedge', name: 'Wedge monitor', group: 'monitors', label: '', sized: false },
  { kind: 'iem', name: 'In-ear monitor equipment', group: 'monitors', label: 'IEM', sized: false },
  { kind: 'drum-fill', name: 'Drum fill', group: 'monitors', label: 'Drum fill', sized: false },
  { kind: 'sidefill', name: 'Sidefill', group: 'monitors', label: 'Sidefill', sized: false },
  { kind: 'rack', name: 'Equipment rack', group: 'stage', label: 'Rack', sized: false },
  { kind: 'stage-box', name: 'Stage box', group: 'stage', label: 'Stage box', sized: false },
  { kind: 'power', name: 'Power location', group: 'stage', label: 'Power', sized: false },
  { kind: 'chair', name: 'Chair', group: 'stage', label: '', sized: false },
  { kind: 'music-stand', name: 'Music stand', group: 'stage', label: '', sized: false },
  { kind: 'riser', name: 'Riser', group: 'stage', label: 'Riser', sized: true },
  { kind: 'generic', name: 'Other object', group: 'stage', label: 'Object', sized: true },
];

export const spPaletteItem = (kind: SpObjectKind): SpPaletteItem => SP_PALETTE.find((p) => p.kind === kind) ?? SP_PALETTE[SP_PALETTE.length - 1];

/* ── source packages ────────────────────────────────────────────────────── */

/** One proposed row of a package (shown before it is added). */
export type SpPackageRow = {
  label: string;
  side?: 'L' | 'R';
  capture: SpCapture;
  /** A generic category, never a brand or model. */
  equipment: string;
  stand: SpStand;
  /** Click, cue or private talkback. */
  cue?: boolean;
  connector?: string;
};

export type SpPackage = {
  id: string;
  name: string;
  category: SpCategory;
  /** The source label the rows hang from. */
  source: string;
  /** What this package assumes, in one plain sentence shown to the user. */
  assumes: string;
  rows: readonly SpPackageRow[];
  /** A stereo package's two rows are one pair. */
  stereo?: boolean;
};

const mic = (label: string, equipment: string, stand: SpStand): SpPackageRow => ({ label, capture: 'mic', equipment, stand, connector: 'XLR' });

export const SP_PACKAGES: readonly SpPackage[] = [
  {
    id: 'vocal',
    name: 'Vocal microphone',
    category: 'vocals',
    source: 'Vocal',
    assumes: 'One wired vocal microphone on a tall boom stand.',
    rows: [mic('Vocal', 'Dynamic vocal microphone', 'tall-boom')],
  },
  {
    id: 'vocal-wireless',
    name: 'Wireless vocal microphone',
    category: 'vocals',
    source: 'Vocal',
    assumes: 'One wireless microphone. Its receiver output is the connection to the mixer: one input, not two.',
    rows: [{ label: 'Vocal (wireless)', capture: 'wireless', equipment: 'Wireless handheld microphone and receiver', stand: 'straight', connector: 'XLR' }],
  },
  {
    id: 'drums-small',
    name: 'Small drum setup',
    category: 'drums',
    source: 'Drum kit',
    assumes: 'Four microphones: kick, snare and one stereo pair overhead.',
    rows: [
      mic('Kick', 'Kick drum microphone', 'short-boom'),
      mic('Snare', 'Dynamic instrument microphone', 'short-boom'),
      { ...mic('Overhead L', 'Condenser microphone', 'tall-boom'), side: 'L' },
      { ...mic('Overhead R', 'Condenser microphone', 'tall-boom'), side: 'R' },
    ],
  },
  {
    id: 'drums-six',
    name: 'Drum setup, six microphones',
    category: 'drums',
    source: 'Drum kit',
    assumes: 'Six microphones: kick, snare, rack tom, floor tom and one stereo pair overhead.',
    rows: [
      mic('Kick', 'Kick drum microphone', 'short-boom'),
      mic('Snare', 'Dynamic instrument microphone', 'short-boom'),
      mic('Rack tom', 'Dynamic instrument microphone', 'clamp'),
      mic('Floor tom', 'Dynamic instrument microphone', 'clamp'),
      { ...mic('Overhead L', 'Condenser microphone', 'tall-boom'), side: 'L' },
      { ...mic('Overhead R', 'Condenser microphone', 'tall-boom'), side: 'R' },
    ],
  },
  {
    id: 'drums-large',
    name: 'Larger drum setup',
    category: 'drums',
    source: 'Drum kit',
    assumes: 'Ten microphones: two on the kick, two on the snare, hi-hat, two rack toms, floor tom and one stereo pair overhead.',
    rows: [
      mic('Kick in', 'Kick drum microphone', 'short-boom'),
      mic('Kick out', 'Kick drum microphone', 'short-boom'),
      mic('Snare top', 'Dynamic instrument microphone', 'short-boom'),
      mic('Snare bottom', 'Dynamic instrument microphone', 'short-boom'),
      mic('Hi-hat', 'Condenser microphone', 'short-boom'),
      mic('Rack tom 1', 'Dynamic instrument microphone', 'clamp'),
      mic('Rack tom 2', 'Dynamic instrument microphone', 'clamp'),
      mic('Floor tom', 'Dynamic instrument microphone', 'clamp'),
      { ...mic('Overhead L', 'Condenser microphone', 'tall-boom'), side: 'L' },
      { ...mic('Overhead R', 'Condenser microphone', 'tall-boom'), side: 'R' },
    ],
  },
  {
    id: 'bass-di',
    name: 'Bass DI',
    category: 'bass',
    source: 'Bass',
    assumes: 'One DI channel from the bass or its amplifier.',
    rows: [{ label: 'Bass DI', capture: 'di', equipment: 'DI', stand: 'none', connector: 'XLR' }],
  },
  {
    id: 'bass-di-mic',
    name: 'Bass DI plus cabinet microphone',
    category: 'bass',
    source: 'Bass',
    assumes: 'Two inputs from one bass: a DI channel and a microphone on the cabinet.',
    rows: [
      { label: 'Bass DI', capture: 'di', equipment: 'DI', stand: 'none', connector: 'XLR' },
      mic('Bass cabinet', 'Dynamic instrument microphone', 'short-boom'),
    ],
  },
  {
    id: 'guitar-cab',
    name: 'Guitar cabinet microphone',
    category: 'guitars',
    source: 'Guitar',
    assumes: 'One microphone on the guitar amplifier’s cabinet.',
    rows: [mic('Guitar cabinet', 'Dynamic instrument microphone', 'short-boom')],
  },
  {
    id: 'acoustic-pickup',
    name: 'Acoustic guitar pickup',
    category: 'guitars',
    source: 'Acoustic guitar',
    assumes: 'The instrument’s pickup reaches the mixer through one DI channel.',
    rows: [{ label: 'Acoustic guitar DI', capture: 'di', equipment: 'DI', stand: 'none', connector: 'XLR' }],
  },
  {
    id: 'keys-mono',
    name: 'Mono keyboard',
    category: 'keys',
    source: 'Keys',
    assumes: 'One DI channel from the keyboard.',
    rows: [{ label: 'Keys', capture: 'di', equipment: 'DI', stand: 'none', connector: 'XLR' }],
  },
  {
    id: 'keys-stereo',
    name: 'Stereo keyboard',
    category: 'keys',
    source: 'Keys',
    assumes: 'Two DI channels, left and right: two physical inputs even if the console shows one linked strip.',
    stereo: true,
    rows: [
      { label: 'Keys L', side: 'L', capture: 'di', equipment: 'DI', stand: 'none', connector: 'XLR' },
      { label: 'Keys R', side: 'R', capture: 'di', equipment: 'DI', stand: 'none', connector: 'XLR' },
    ],
  },
  {
    id: 'piano-mics',
    name: 'Acoustic piano, two microphones',
    category: 'keys',
    source: 'Piano',
    assumes: 'Two microphones on an acoustic piano, left and right.',
    stereo: true,
    rows: [
      { label: 'Piano L', side: 'L', capture: 'mic', equipment: 'Condenser microphone', stand: 'tall-boom', connector: 'XLR' },
      { label: 'Piano R', side: 'R', capture: 'mic', equipment: 'Condenser microphone', stand: 'tall-boom', connector: 'XLR' },
    ],
  },
  {
    id: 'playback-stereo',
    name: 'Stereo playback',
    category: 'playback',
    source: 'Playback',
    assumes: 'Two balanced line outputs, left and right, from the band’s playback device.',
    stereo: true,
    rows: [
      { label: 'Playback L', side: 'L', capture: 'line', equipment: 'Balanced line output', stand: 'none' },
      { label: 'Playback R', side: 'R', capture: 'line', equipment: 'Balanced line output', stand: 'none' },
    ],
  },
  {
    id: 'click',
    name: 'Click or cue',
    category: 'playback',
    source: 'Click',
    assumes: 'One balanced line output that carries the click. Monitor only: it is kept out of the audience mix.',
    rows: [{ label: 'Click', capture: 'line', equipment: 'Balanced line output', stand: 'none', cue: true }],
  },
  {
    id: 'horn-mic',
    name: 'Horn microphone',
    category: 'horns',
    source: 'Horn',
    assumes: 'One microphone on a stand for one horn.',
    rows: [mic('Horn', 'Dynamic instrument microphone', 'tall-boom')],
  },
  {
    id: 'hand-drums',
    name: 'Hand drum pair',
    category: 'percussion',
    source: 'Hand drums',
    assumes: 'Two microphones, one for each drum of a pair.',
    rows: [mic('Drum high', 'Dynamic instrument microphone', 'short-boom'), mic('Drum low', 'Dynamic instrument microphone', 'short-boom')],
  },
  {
    id: 'percussion-mic',
    name: 'Percussion microphone',
    category: 'percussion',
    source: 'Percussion',
    assumes: 'One microphone for a small percussion setup.',
    rows: [mic('Percussion', 'Condenser microphone', 'tall-boom')],
  },
];

export const spPackage = (id: string): SpPackage | undefined => SP_PACKAGES.find((p) => p.id === id);
