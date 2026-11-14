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
  // (round 3b, engineer review) the band's monitor console at the monitor
  // position needs both; return lines can come from FOH or the monitor position
  'split-returns': 'An input split and return lines to the stage',
  feeds: 'Feeds from the house console',
  returns: 'Return lines to the stage (from FOH or the monitor position)',
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
  { kind: 'piano', name: 'Upright piano', group: 'instruments', label: 'Piano', sized: false },
  { kind: 'acoustic-guitar', name: 'Acoustic instrument', group: 'instruments', label: 'Acoustic', sized: false },
  { kind: 'horn', name: 'Horn', group: 'instruments', label: 'Horn', sized: false },
  { kind: 'playback', name: 'Playback rig', group: 'instruments', label: 'Playback', sized: false },
  // more symbols for more diverse music (owner 2026-11-13): strings, keys,
  // world percussion, folk, electronic, brass and reeds, a choir
  { kind: 'choir', name: 'Choir', group: 'people', label: 'Choir', sized: false },
  { kind: 'e-drums', name: 'Electronic drum kit', group: 'instruments', label: 'E-drums', sized: false },
  { kind: 'cajon', name: 'Cajón', group: 'instruments', label: 'Cajón', sized: false },
  { kind: 'djembe', name: 'Djembe', group: 'instruments', label: 'Djembe', sized: false },
  { kind: 'tabla', name: 'Tabla', group: 'instruments', label: 'Tabla', sized: false },
  { kind: 'steel-pan', name: 'Steel pan', group: 'instruments', label: 'Steel pan', sized: false },
  { kind: 'vibraphone', name: 'Vibraphone', group: 'instruments', label: 'Vibes', sized: false },
  { kind: 'upright-bass', name: 'Upright bass', group: 'instruments', label: 'Upright bass', sized: false },
  { kind: 'grand-piano', name: 'Grand piano', group: 'instruments', label: 'Grand piano', sized: false },
  { kind: 'electric-piano', name: 'Electric piano', group: 'instruments', label: 'Electric piano', sized: false },
  { kind: 'keyboard-rig', name: 'Two-tier keyboard rig', group: 'instruments', label: 'Keys rig', sized: false },
  { kind: 'organ', name: 'Hammond organ', group: 'instruments', label: 'Organ', sized: false },
  { kind: 'leslie', name: 'Leslie speaker', group: 'instruments', label: 'Leslie', sized: false },
  { kind: 'violin', name: 'Violin or viola', group: 'instruments', label: 'Violin', sized: false },
  { kind: 'cello', name: 'Cello', group: 'instruments', label: 'Cello', sized: false },
  { kind: 'harp', name: 'Harp', group: 'instruments', label: 'Harp', sized: false },
  { kind: 'banjo', name: 'Banjo', group: 'instruments', label: 'Banjo', sized: false },
  { kind: 'mandolin', name: 'Mandolin', group: 'instruments', label: 'Mandolin', sized: false },
  { kind: 'accordion', name: 'Accordion', group: 'instruments', label: 'Accordion', sized: false },
  { kind: 'saxophone', name: 'Saxophone', group: 'instruments', label: 'Sax', sized: false },
  { kind: 'trombone', name: 'Trombone', group: 'instruments', label: 'Trombone', sized: false },
  { kind: 'dj', name: 'DJ table', group: 'instruments', label: 'DJ', sized: false },
  // round 2 (owner 2026-11-13, "Yes, build them all")
  { kind: 'marimba', name: 'Marimba (5-octave)', group: 'instruments', label: 'Marimba', sized: false },
  { kind: 'timpani', name: 'Timpani (four drums)', group: 'instruments', label: 'Timpani', sized: false },
  { kind: 'flute', name: 'Flute', group: 'instruments', label: 'Flute', sized: false },
  { kind: 'harmonium', name: 'Hand harmonium', group: 'instruments', label: 'Harmonium', sized: false },
  { kind: 'harmonica', name: 'Harmonica', group: 'instruments', label: 'Harmonica', sized: false },
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

  /* ── more symbols for more diverse music (owner 2026-11-13) ──
   * Common practice, checked by a live-sound reviewer. A pickup on a string
   * instrument is a piezo: it wants a DI with a high-impedance input (or the
   * player's own preamp), so the row says so. A clip-on or condenser
   * microphone needs phantom power, but which microphone it is stays the
   * band's answer, so phantom power stays "to be confirmed" like every row. */
  ...stringPackages(),
  {
    id: 'grand-piano-mics',
    name: 'Grand piano, two microphones',
    category: 'keys',
    source: 'Grand piano',
    assumes: 'Two microphones inside the piano, under the lid, one over the low strings and one over the high strings, on tall boom stands.',
    stereo: true,
    rows: [
      { label: 'Piano low', side: 'L', capture: 'mic', equipment: 'Condenser microphone', stand: 'tall-boom', connector: 'XLR' },
      { label: 'Piano high', side: 'R', capture: 'mic', equipment: 'Condenser microphone', stand: 'tall-boom', connector: 'XLR' },
    ],
  },
  {
    id: 'grand-piano-pickup',
    name: 'Piano pickup',
    category: 'keys',
    source: 'Grand piano',
    assumes: 'The piano has a pickup system fitted. Its output reaches the mixer through one DI channel.',
    rows: [di('Piano pickup', 'DI')],
  },
  {
    id: 'leslie-mics',
    name: 'Leslie, three microphones',
    category: 'keys',
    source: 'Organ',
    assumes: 'The organ plays through its Leslie speaker: two microphones at the upper louvres, left and right of the horn, and one at the bass rotor opening. The Leslie has its own amplifier, so there is no DI. Add this from the organ OR the Leslie, not both: link the other symbol to the same source.',
    stereo: true,
    rows: [
      { ...mic('Leslie top L', 'Dynamic instrument microphone', 'short-boom'), side: 'L' },
      { ...mic('Leslie top R', 'Dynamic instrument microphone', 'short-boom'), side: 'R' },
      mic('Leslie bottom', 'Kick drum microphone', 'short-boom'),
    ],
  },
  {
    id: 'leslie-two',
    name: 'Leslie, two microphones',
    category: 'keys',
    source: 'Organ',
    assumes: 'The organ plays through its Leslie speaker: one microphone at the upper louvres and one at the bass rotor opening. The Leslie has its own amplifier, so there is no DI. Add this from the organ OR the Leslie, not both: link the other symbol to the same source.',
    rows: [mic('Leslie top', 'Dynamic instrument microphone', 'short-boom'), mic('Leslie bottom', 'Kick drum microphone', 'short-boom')],
  },
  {
    id: 'organ-line',
    name: 'Organ, stereo line out',
    category: 'keys',
    source: 'Organ',
    assumes: 'A modern organ with its own rotary speaker effect: two DI channels, left and right, and no Leslie to mike. (A single keyboard-style organ is better drawn as a keyboard or a keyboard rig.)',
    stereo: true,
    rows: [
      { ...di('Organ L', 'DI'), side: 'L' },
      { ...di('Organ R', 'DI'), side: 'R' },
    ],
  },
  {
    id: 'ep-di',
    name: 'Electric piano DI',
    category: 'keys',
    source: 'Electric piano',
    assumes: 'An electric piano with passive pickups and no amplifier of its own: one DI channel with a high-impedance input.',
    rows: [di('Electric piano', 'DI with a high-impedance input')],
  },
  {
    id: 'ep-stereo',
    name: 'Electric piano, stereo',
    category: 'keys',
    source: 'Electric piano',
    assumes: 'The electric piano runs a stereo effect (a stereo tremolo, or the player’s own pedals): two DI channels, left and right.',
    stereo: true,
    rows: [
      { ...di('Electric piano L', 'DI'), side: 'L' },
      { ...di('Electric piano R', 'DI'), side: 'R' },
    ],
  },
  {
    id: 'keys-rig-two',
    name: 'Two stereo keyboards',
    category: 'keys',
    source: 'Keys',
    assumes: 'Two keyboards on a two-tier stand, each in stereo: four DI channels, two left and right pairs.',
    stereo: true,
    rows: [
      { ...di('Keys 1 L', 'DI'), side: 'L' },
      { ...di('Keys 1 R', 'DI'), side: 'R' },
      { ...di('Keys 2 L', 'DI'), side: 'L' },
      { ...di('Keys 2 R', 'DI'), side: 'R' },
    ],
  },
  {
    id: 'keys-submix',
    name: 'Keyboard submix, stereo',
    category: 'keys',
    source: 'Keys',
    assumes: 'The player mixes the keyboards on a small mixer of their own and sends one stereo pair: two DI channels, left and right.',
    stereo: true,
    rows: [
      { ...di('Keys submix L', 'DI'), side: 'L' },
      { ...di('Keys submix R', 'DI'), side: 'R' },
    ],
  },
  {
    id: 'accordion-mics',
    name: 'Accordion, two microphones',
    category: 'other',
    source: 'Accordion',
    assumes: 'Two clip-on microphones, one on the treble side and one on the bass side, because the bellows move.',
    rows: [mic('Accordion treble', 'Clip-on condenser microphone', 'clamp'), mic('Accordion bass', 'Clip-on condenser microphone', 'clamp')],
  },
  {
    id: 'accordion-di',
    name: 'Accordion, built-in microphones',
    category: 'other',
    source: 'Accordion',
    assumes: 'The accordion has its own microphone system fitted inside. Its output reaches the mixer through one DI channel.',
    rows: [di('Accordion', 'DI')],
  },
  {
    id: 'cajon-mics',
    name: 'Cajón, two microphones',
    category: 'percussion',
    source: 'Cajón',
    assumes: 'Two microphones: one at the sound port in the back (the low end), one low at the front plate (the slap).',
    rows: [mic('Cajón back', 'Kick drum microphone', 'short-boom'), mic('Cajón front', 'Dynamic instrument microphone', 'short-boom')],
  },
  {
    id: 'cajon-mic',
    name: 'Cajón, one microphone',
    category: 'percussion',
    source: 'Cajón',
    assumes: 'One microphone at the sound port in the back of the cajón.',
    rows: [mic('Cajón', 'Kick drum microphone', 'short-boom')],
  },
  {
    id: 'djembe-mics',
    name: 'Djembe, two microphones',
    category: 'percussion',
    source: 'Djembe',
    assumes: 'Two microphones: one over the head, one at the opening at the bottom of the drum (the low end).',
    rows: [mic('Djembe top', 'Dynamic instrument microphone', 'short-boom'), mic('Djembe bottom', 'Kick drum microphone', 'short-boom')],
  },
  {
    id: 'tabla-mics',
    name: 'Tabla, two microphones',
    category: 'percussion',
    source: 'Tabla',
    assumes: 'One microphone over each drum, on low stands: the player sits on the floor.',
    rows: [mic('Tabla dayan', 'Small-diaphragm condenser microphone', 'short-boom'), mic('Tabla bayan', 'Small-diaphragm condenser microphone', 'short-boom')],
  },
  {
    id: 'steel-pan-mic',
    name: 'Steel pan, one microphone',
    category: 'percussion',
    source: 'Steel pan',
    assumes: 'One lead (tenor) pan with one microphone above it.',
    rows: [mic('Steel pan', 'Small-diaphragm condenser microphone', 'tall-boom')],
  },
  {
    id: 'steel-pan-pair',
    name: 'Steel pans, stereo pair',
    category: 'percussion',
    source: 'Steel pans',
    assumes: 'A set of two or more pans (double seconds or lower) with a pair of microphones above them, left and right.',
    stereo: true,
    rows: [
      { ...mic('Pans L', 'Small-diaphragm condenser microphone', 'tall-boom'), side: 'L' },
      { ...mic('Pans R', 'Small-diaphragm condenser microphone', 'tall-boom'), side: 'R' },
    ],
  },
  {
    id: 'vibes-mics',
    name: 'Vibraphone, two microphones',
    category: 'percussion',
    source: 'Vibraphone',
    assumes: 'A pair of microphones above the bars, one toward the low end and one toward the high end. The vibraphone’s fan motor needs power.',
    stereo: true,
    rows: [
      { ...mic('Vibes low', 'Small-diaphragm condenser microphone', 'tall-boom'), side: 'L' },
      { ...mic('Vibes high', 'Small-diaphragm condenser microphone', 'tall-boom'), side: 'R' },
    ],
  },
  {
    id: 'e-drums-stereo',
    name: 'Electronic drums, stereo',
    category: 'drums',
    source: 'Electronic drums',
    assumes: 'The stereo main output of the drum module: two DI channels, left and right (its outputs are often unbalanced jacks). The drummer hears almost nothing acoustically, so the kit needs a monitor mix.',
    stereo: true,
    rows: [
      { ...di('E-drums L', 'DI'), side: 'L' },
      { ...di('E-drums R', 'DI'), side: 'R' },
    ],
  },
  {
    id: 'e-drums-kick',
    name: 'Electronic drums, stereo plus kick',
    category: 'drums',
    source: 'Electronic drums',
    assumes: 'The module’s stereo output plus the kick on its own output: three DI channels.',
    stereo: true,
    rows: [di('E-drums kick', 'DI'), { ...di('E-drums L', 'DI'), side: 'L' }, { ...di('E-drums R', 'DI'), side: 'R' }],
  },
  {
    id: 'dj-stereo',
    name: 'DJ mixer, stereo',
    category: 'playback',
    source: 'DJ',
    assumes: 'The DJ mixer’s main output, left and right, at line level. A mixer with only unbalanced outputs needs a stereo DI. The DJ’s booth monitor is an output of that mixer, not an input.',
    stereo: true,
    rows: [
      { label: 'DJ L', side: 'L', capture: 'line', equipment: 'Balanced line output', stand: 'none' },
      { label: 'DJ R', side: 'R', capture: 'line', equipment: 'Balanced line output', stand: 'none' },
    ],
  },
  {
    id: 'sax-mic',
    name: 'Saxophone microphone',
    category: 'horns',
    source: 'Saxophone',
    assumes: 'One clip-on microphone at the bell, for one saxophone. A player who doubles on flute or clarinet needs a second microphone on a stand.',
    rows: [mic('Sax', 'Clip-on condenser microphone', 'clamp')],
  },
  {
    id: 'trombone-mic',
    name: 'Trombone microphone',
    category: 'horns',
    source: 'Trombone',
    assumes: 'One microphone on a tall boom stand, in front of the bell and to the side of the slide, so the slide clears it. For one trombone.',
    rows: [mic('Trombone', 'Dynamic instrument microphone', 'tall-boom')],
  },
  // A CHOIR OF ANY SIZE (round 2): the package that matches the choir's
  // width is offered first (spChoir: about one microphone for every 2.5 m),
  // the left and right pair second. The ids stay, so a plot that used one
  // still reads it.
  ...choirPackages(),
  {
    id: 'sax-flute',
    name: 'Saxophone, with a flute double',
    category: 'horns',
    source: 'Saxophone',
    assumes: 'The player doubles on flute. The clip-on stays on the sax; the flute is played into its own stand microphone at mouth height.',
    rows: [mic('Sax', 'Clip-on condenser microphone', 'clamp'), mic('Sax flute', 'Small-diaphragm condenser microphone', 'tall-boom')],
  },

  /* ── round 2 of the added symbols (owner 2026-11-13). Common practice,
   * checked by a live-sound reviewer. */
  {
    id: 'marimba-two',
    name: 'Marimba, two microphones',
    category: 'percussion',
    source: 'Marimba',
    assumes: 'A pair about 0.5 m above the bars, one over each half, on booms reaching in from the audience side above the mallets. (A 4.3-octave marimba is about 2.0 × 0.9 m.)',
    stereo: true,
    rows: [
      { ...mic('Marimba low', 'Small-diaphragm condenser microphone', 'tall-boom'), side: 'L' },
      { ...mic('Marimba high', 'Small-diaphragm condenser microphone', 'tall-boom'), side: 'R' },
    ],
  },
  {
    id: 'marimba-three',
    name: 'Marimba, three microphones',
    category: 'percussion',
    source: 'Marimba',
    assumes: 'For a 5-octave marimba: one microphone over each third of the bars, 0.4 to 0.5 m above them.',
    rows: [
      mic('Marimba low', 'Small-diaphragm condenser microphone', 'tall-boom'),
      mic('Marimba mid', 'Small-diaphragm condenser microphone', 'tall-boom'),
      mic('Marimba high', 'Small-diaphragm condenser microphone', 'tall-boom'),
    ],
  },
  // timpani: the words follow the set's setup (round 3); the catalog holds
  // the American wording, the stage asks spTimpaniPackages for the other
  ...spTimpaniPackages('american'),
  {
    id: 'flute-stand',
    name: 'Flute, microphone on a stand',
    category: 'horns',
    source: 'Flute',
    assumes: 'About 15 cm from the lip plate and slightly above, aimed between the lip plate and the first keys, never into the air stream, with a windscreen; the boom comes in from the player’s left, clear of the flute. On a loud stage a dynamic vocal microphone feeds back less. The flute is the quietest thing on the stage: it needs a strong monitor, with the wedge off the microphone’s front.',
    rows: [mic('Flute', 'Small-diaphragm condenser microphone', 'tall-boom')],
  },
  {
    id: 'flute-clip',
    name: 'Flute, clip-on microphone',
    category: 'horns',
    source: 'Flute',
    assumes: 'A clip-on microphone on the headjoint, its gooseneck above the embouchure hole, so the player can move.',
    rows: [mic('Flute', 'Clip-on condenser microphone', 'clamp')],
  },
  {
    id: 'harmonium-mic',
    name: 'Harmonium, one microphone',
    category: 'keys',
    source: 'Harmonium',
    assumes: 'One microphone on a low boom, 20 to 30 cm from the reed openings behind the keys, clear of the bellows hand: the player sits on the floor (qawwali parties often sit on a low platform).',
    rows: [mic('Harmonium', 'Small-diaphragm condenser microphone', 'short-boom')],
  },
  {
    id: 'harmonium-vocal',
    name: 'Harmonium with the player’s vocal',
    category: 'keys',
    source: 'Harmonium',
    assumes: 'In kirtan and qawwali the lead singer plays the harmonium: one microphone at the reed openings, and the vocal microphone on a low boom for a seated singer.',
    rows: [mic('Harmonium', 'Small-diaphragm condenser microphone', 'short-boom'), mic('Harmonium vocal', 'Dynamic vocal microphone', 'short-boom')],
  },
  {
    id: 'harmonica-mic',
    name: 'Harmonica on a vocal-style microphone',
    category: 'other',
    source: 'Harmonica',
    assumes: 'The player cups the microphone with the harmonica. Most harmonica players also sing: add a vocal microphone.',
    rows: [mic('Harmonica', 'Dynamic vocal microphone', 'straight')],
  },
  {
    id: 'harmonica-amp',
    name: 'Harmonica through its own amplifier',
    category: 'other',
    source: 'Harmonica',
    assumes: 'The player’s own bullet microphone goes into the player’s amplifier, and the amplifier’s speaker is miked (place an amplifier symbol and name it “Harp amp”). The amplifier needs power. Most harmonica players also sing: add a vocal microphone.',
    rows: [mic('Harmonica amp', 'Dynamic instrument microphone', 'short-boom')],
  },
  {
    id: 'harmonica-di',
    name: 'Harmonica, line out',
    category: 'other',
    source: 'Harmonica',
    assumes: 'From the player’s harmonica preamp or pedals, often unbalanced: a DI with a high-impedance input. Most harmonica players also sing: add a vocal microphone.',
    rows: [di('Harmonica DI', 'DI with a high-impedance input')],
  },
];

/** The area-microphone packages of a choir, one to six microphones (ids
 *  choir-one … choir-six; choir-two and choir-three keep the ids they had).
 *  A choir's own size picks one (stageLinks, from spChoir). */
/** How each timpani setup is said (round 3, 2026-11-13, owner: "build the
 *  remaining held items too"). The timpanist faces the audience, so the
 *  player's left is stage left. */
export const SP_TIMPANI_SETUP_WORDS = {
  american: 'American setup: the largest drum at the timpanist’s left (stage left), the smallest at the right.',
  german: 'German setup: the largest drum at the timpanist’s right (stage right), the smallest at the left.',
} as const;

/** The timpani packages, worded for one setup (ids kept: the same two
 *  packages whatever the setup). The per-drum list names each microphone by
 *  its drum's size, largest first, in either setup; the pair says which
 *  side of the house pair is over the low drums (live-sound review, round 3:
 *  from the audience side the low drums are on the right in the American
 *  setup, on the left in the German). */
export function spTimpaniPackages(setup: 'american' | 'german'): SpPackage[] {
  const am = setup === 'american';
  const drawn = am
    ? 'The drums are drawn in the American setup (the largest at the timpanist’s left); a German setup puts the largest drum at the timpanist’s right.'
    : 'The drums are drawn in the German setup (the largest at the timpanist’s right); an American setup puts the largest drum at the timpanist’s left.';
  return [
    {
      id: 'timpani-pair',
      name: 'Timpani, a pair above',
      category: 'percussion',
      source: 'Timpani',
      assumes: `A pair of microphones 1 to 1.5 m above the drums, from the audience side. ${drawn} ${am ? 'Timpani R' : 'Timpani L'} is over the 32 and 29 in drums.`,
      stereo: true,
      rows: [
        { ...mic('Timpani L', 'Small-diaphragm condenser microphone', 'tall-boom'), side: 'L' },
        { ...mic('Timpani R', 'Small-diaphragm condenser microphone', 'tall-boom'), side: 'R' },
      ],
    },
    {
      id: 'timpani-each',
      name: 'Timpani, one microphone per drum',
      category: 'percussion',
      source: 'Timpani',
      assumes: `One microphone 0.3 to 0.5 m above each head, between the center and the edge on the side away from the player, out of the mallets’ path (the heads are about 0.8 m up, so the stands are tall). Named by drum size, largest first. ${drawn}`,
      rows: [
        mic('Timpani 32 in', 'Small-diaphragm condenser microphone', 'tall-boom'),
        mic('Timpani 29 in', 'Small-diaphragm condenser microphone', 'tall-boom'),
        mic('Timpani 26 in', 'Small-diaphragm condenser microphone', 'tall-boom'),
        mic('Timpani 23 in', 'Small-diaphragm condenser microphone', 'tall-boom'),
      ],
    },
  ];
}

function choirPackages(): SpPackage[] {
  const ids = ['choir-one', 'choir-two', 'choir-three', 'choir-four', 'choir-five', 'choir-six'];
  const words = ['One', 'Two', 'Three', 'Four', 'Five', 'Six'];
  const label = (n: number, i: number): string => (n === 1 ? 'Choir' : n === 2 ? ['Choir L', 'Choir R'][i]! : n === 3 ? ['Choir L', 'Choir C', 'Choir R'][i]! : `Choir ${i + 1}`);
  return ids.map((id, k) => {
    const n = k + 1;
    return {
      id,
      name: n === 1 ? 'Choir, one microphone' : `Choir, ${words[k]!.toLowerCase()} microphones`,
      category: 'vocals' as const,
      source: 'Choir',
      assumes: `${words[k]} small-diaphragm condenser microphone${n === 1 ? '' : 's'} on tall stands in front of the choir${n === 2 ? ', left and right' : n === 3 ? ', left, center and right' : ''}: about one for every 2.5 m of choir width, as few as cover it, because every open microphone adds feedback.`,
      rows: Array.from({ length: n }, (_, i) => mic(label(n, i), 'Small-diaphragm condenser microphone', 'tall-boom')),
    };
  });
}

/** One DI row. */
function di(label: string, equipment: string): SpPackageRow {
  return { label, capture: 'di', equipment, stand: 'none', connector: 'XLR' };
}

/** The acoustic string instruments: each has a microphone package and a
 *  pickup package (a piezo pickup into a DI with a high-impedance input). */
function stringPackages(): SpPackage[] {
  const PICKUP = 'DI with a high-impedance input';
  const list: { id: string; source: string; category: SpCategory; micEq: string; stand: SpStand; micWhere: string }[] = [
    { id: 'upright-bass', source: 'Upright bass', category: 'bass', micEq: 'Clip-on condenser microphone', stand: 'clamp', micWhere: 'a clip-on microphone near the bridge or the f-hole (on a quiet stage, a microphone on a short stand works too)' },
    { id: 'cello', source: 'Cello', category: 'other', micEq: 'Clip-on condenser microphone', stand: 'clamp', micWhere: 'a clip-on microphone on the instrument' },
    { id: 'violin', source: 'Violin', category: 'other', micEq: 'Clip-on condenser microphone', stand: 'clamp', micWhere: 'a clip-on microphone on the instrument (the player moves)' },
    { id: 'harp', source: 'Harp', category: 'other', micEq: 'Small-diaphragm condenser microphone', stand: 'short-boom', micWhere: 'a microphone on the player’s side, aimed at the soundboard' },
    { id: 'banjo', source: 'Banjo', category: 'guitars', micEq: 'Small-diaphragm condenser microphone', stand: 'short-boom', micWhere: 'a microphone aimed at the head' },
    { id: 'mandolin', source: 'Mandolin', category: 'guitars', micEq: 'Small-diaphragm condenser microphone', stand: 'short-boom', micWhere: 'a microphone aimed at the top, near the sound hole' },
  ];
  const out: SpPackage[] = [];
  for (const s of list) {
    out.push({ id: `${s.id}-mic`, name: `${s.source} microphone`, category: s.category, source: s.source, assumes: `One input: ${s.micWhere}.`, rows: [mic(`${s.source} mic`, s.micEq, s.stand)] });
    out.push({ id: `${s.id}-pickup`, name: `${s.source} pickup`, category: s.category, source: s.source, assumes: `The instrument’s pickup reaches the mixer through one DI channel with a high-impedance input (or the player’s own preamp).`, rows: [di(`${s.source} pickup`, PICKUP)] });
  }
  // the upright bass is usually both: the pickup for the low end, a microphone for its body
  out.push({
    id: 'upright-bass-both',
    name: 'Upright bass, pickup and microphone',
    category: 'bass',
    source: 'Upright bass',
    assumes: 'Two inputs from one bass: its pickup through a DI with a high-impedance input, and a clip-on microphone near the bridge or the f-hole for the body of the sound.',
    rows: [di('Upright bass pickup', PICKUP), mic('Upright bass mic', 'Clip-on condenser microphone', 'clamp')],
  });
  return out;
}

export const spPackage = (id: string): SpPackage | undefined => SP_PACKAGES.find((p) => p.id === id);
