/**
 * Sound Systems Lab — output configurations (LEARN chapter 3) and PA system
 * types (chapter 2), as data the venue view draws from.
 *
 * VISUAL ONLY (owner ruling 2026-09-25): the configuration explorer shows
 * where the loudspeakers stand, what each feed carries, and how coverage,
 * level and timing change — it does not pretend a phone can play LCR.
 */
import type { SlotId } from './types';

export type FeedId = 'L' | 'R' | 'M' | 'C' | 'SUB' | 'SUB-L' | 'SUB-R' | 'FILL' | 'DELAY' | 'ZONE-2' | 'LOBBY' | 'REC' | 'BCAST';

export type FeedSpec = {
  id: FeedId;
  name: string;
  /** Which console bus normally carries it. */
  bus: string;
  /** Rough band (for the visual). */
  band: 'full' | 'low' | 'high';
};

export const FEEDS: Record<FeedId, FeedSpec> = {
  L: { id: 'L', name: 'Left', bus: 'Main L', band: 'full' },
  R: { id: 'R', name: 'Right', bus: 'Main R', band: 'full' },
  M: { id: 'M', name: 'Mono', bus: 'Main M (L+R summed)', band: 'full' },
  C: { id: 'C', name: 'Centre', bus: 'Main C (LCR)', band: 'full' },
  SUB: { id: 'SUB', name: 'Sub', bus: 'Aux / matrix / crossover LOW', band: 'low' },
  'SUB-L': { id: 'SUB-L', name: 'Sub left', bus: 'Crossover LOW from Main L', band: 'low' },
  'SUB-R': { id: 'SUB-R', name: 'Sub right', bus: 'Crossover LOW from Main R', band: 'low' },
  FILL: { id: 'FILL', name: 'Front fill', bus: 'Matrix or processor output (from main)', band: 'full' },
  DELAY: { id: 'DELAY', name: 'Delay', bus: 'Matrix or processor output (from main, delayed)', band: 'full' },
  'ZONE-2': { id: 'ZONE-2', name: 'Zone 2', bus: 'Matrix (own level and EQ)', band: 'full' },
  LOBBY: { id: 'LOBBY', name: 'Lobby', bus: 'Matrix (main + announce)', band: 'full' },
  REC: { id: 'REC', name: 'Recording', bus: 'Matrix (from main)', band: 'full' },
  BCAST: { id: 'BCAST', name: 'Broadcast', bus: 'Matrix (main, re-balanced)', band: 'full' },
};

export type PlacedSpeaker = {
  slot: SlotId;
  feed: FeedId;
  kind: 'top' | 'sub' | 'fill' | 'delay';
  /** Aim in degrees, 0 = straight into the audience, positive = toward house
   *  right (the plot's right, the performer's left). */
  aimDeg?: number;
  /** Nominal (−6 dB) horizontal coverage angle. */
  coverDeg?: number;
  /** Set delay, ms (delays only). */
  delayMs?: number;
};

export type OutputConfig = {
  id: string;
  name: string;
  layout: PlacedSpeaker[];
  /** Powered boxes (default) or passive cabinets with amplifiers. */
  powered?: boolean;
  /** Feeds that leave the console but not as a loudspeaker on the plot. */
  extraFeeds?: FeedId[];
  what: string;
  when: string;
  changes: string;
};

const TOP_L: PlacedSpeaker = { slot: 'mainL', feed: 'L', kind: 'top', aimDeg: 18, coverDeg: 90 };
const TOP_R: PlacedSpeaker = { slot: 'mainR', feed: 'R', kind: 'top', aimDeg: -18, coverDeg: 90 };
const TOP_L_MONO: PlacedSpeaker = { ...TOP_L, feed: 'M' };
const TOP_R_MONO: PlacedSpeaker = { ...TOP_R, feed: 'M' };

export const OUTPUT_CONFIGS: readonly OutputConfig[] = [
  {
    id: 'mono',
    name: 'Mono',
    layout: [{ slot: 'mainC', feed: 'M', kind: 'top', aimDeg: 0, coverDeg: 100 }],
    what: 'One loudspeaker position, one signal. Every listener hears the same mix from the same place.',
    when: 'Speech, narrow rooms, small stages, anywhere most of the audience cannot see both sides of a pair. Also the honest choice when a pair would only comb-filter across the middle.',
    changes: 'No left/right image and no cancellation between two sources — the coverage is one wedge, and the level falls off evenly with distance.',
  },
  {
    id: 'dual-mono',
    name: 'Dual mono',
    layout: [TOP_L_MONO, TOP_R_MONO],
    what: 'Two loudspeaker positions carrying the SAME signal. Wider coverage than one box, no stereo image.',
    when: 'Wide rooms with a speech or mostly-mono programme, where you need the coverage of two positions but nobody should hear a different mix on the left than on the right.',
    changes: 'Coverage widens; where the two wedges overlap the same signal arrives twice from different distances — the comb-filter zone down the middle is the price, as it is for any pair carrying the same content.',
  },
  {
    id: 'stereo',
    name: 'Stereo',
    layout: [TOP_L, TOP_R],
    what: 'Left and right carry DIFFERENT signals: pans, stereo effects, a stereo keyboard.',
    when: 'Music in rooms narrow enough that most listeners sit between the pair. Wide rooms give the far-left seats a left-only mix.',
    changes: 'A stereo image for the centre seats; the sides hear mostly one channel. Panned sources drop level for the listener on the far side. The mains are toed in about 18° so each one’s inner −6 dB edge meets the centre line two-thirds back — the overlap lands where most of the audience sits, not on the walls.',
  },
  {
    id: 'lcr',
    name: 'LCR — left, centre, right',
    layout: [TOP_L, { slot: 'mainC', feed: 'C', kind: 'top', aimDeg: 0, coverDeg: 100 }, TOP_R],
    what: 'Three mains. The centre cluster carries what should stay in the middle — vocals, speech — while left and right carry the width.',
    when: 'Theatre, worship, musicals: the voice must sound like it comes from the stage for every seat, including the seats at the sides.',
    changes: 'Voices lock to the centre for the whole room; the sides no longer hear a left-only or right-only vocal. Three feeds instead of two.',
  },
  {
    id: 'two-one',
    name: '2.1 — sub in the chain',
    layout: [TOP_L, TOP_R, { slot: 'subC', feed: 'SUB', kind: 'sub' }],
    what: 'A stereo pair and a subwoofer fed in series: console → powered sub → the sub’s high-passed outputs → the tops. One console output; the sub’s own crossover does the split.',
    when: 'Small powered rigs where the sub has a crossover and thru outputs, and nobody needs to touch the sub level from the console.',
    changes: 'The tops are high-passed by the sub and play cleaner and louder; the sub level is a knob on the cabinet, not a fader.',
  },
  {
    id: 'mono-sub-out',
    name: 'Tops and subs on separate console outputs',
    layout: [TOP_L_MONO, TOP_R_MONO, { slot: 'subC', feed: 'SUB', kind: 'sub' }],
    what: 'The tops on the main output; the subs on their OWN console output — an aux or a matrix — not daisy-chained through the sub’s pass-through.',
    when: 'Whenever the sub level must be a console decision: DJ nights, small clubs, any room where “more sub” is a fader move, not a walk to the cabinet.',
    changes: 'Sub level and content are set independently of the tops. A mute on the sub output silences the low end without touching the mains.',
  },
  {
    id: 'stereo-mono-subs',
    name: 'Stereo mains with mono subwoofers',
    layout: [TOP_L, TOP_R, { slot: 'subL', feed: 'SUB', kind: 'sub' }, { slot: 'subR', feed: 'SUB', kind: 'sub' }],
    what: 'The tops are stereo; both subs receive the SAME mono sub feed.',
    when: 'The standard club and touring layout. Low frequencies are not localised, so stereo subs buy nothing and cost cancellation.',
    changes: 'Two sub positions, one signal: they add down the centre line and interfere off to the sides — the power alley and its valleys. The trade for easy rigging; a centre cluster or an arrayed layout evens it out.',
  },
  {
    id: 'stereo-subs',
    name: 'Stereo subwoofers',
    layout: [TOP_L, TOP_R, { slot: 'subL', feed: 'SUB-L', kind: 'sub' }, { slot: 'subR', feed: 'SUB-R', kind: 'sub' }],
    what: 'Each sub receives ITS side’s low end.',
    when: 'Rarely. A hard-panned low-frequency source is unusual, and two different sub signals produce a level that changes across the room.',
    changes: 'Whatever is panned in the low end now moves across the floor — and so does the cancellation pattern. Shown so the difference from mono subs can be seen.',
  },
  {
    id: 'no-subs',
    name: 'Main loudspeakers without subwoofers',
    layout: [TOP_L, TOP_R],
    what: 'Full-range tops carry everything, down to their own low-frequency limit.',
    when: 'Speech, acoustic sets, small rooms — anywhere the programme has no low end to reproduce, or the room would not survive it.',
    changes: 'The tops work harder below 100 Hz and reach their limits sooner; the processor’s high-pass filter protects them instead of a crossover.',
  },
  {
    id: 'zones',
    name: 'Multiple audience zones',
    layout: [TOP_L, TOP_R, { slot: 'delayL', feed: 'ZONE-2', kind: 'delay', aimDeg: 0, coverDeg: 90 }, { slot: 'delayR', feed: 'ZONE-2', kind: 'delay', aimDeg: 0, coverDeg: 90 }],
    what: 'Separate loudspeaker groups, each with its own matrix feed, level and EQ: main floor, balcony, terrace, bar.',
    when: 'Rooms with distinct areas that need different levels — quieter at the bar, louder on the floor — or different programme.',
    changes: 'Each zone can be turned up, down or off on its own. Time alignment between zones still matters where they overlap.',
  },
  {
    id: 'front-fills',
    name: 'Mains plus front fills',
    layout: [TOP_L, TOP_R, { slot: 'frontFillL', feed: 'FILL', kind: 'fill', aimDeg: 0, coverDeg: 90 }, { slot: 'frontFillR', feed: 'FILL', kind: 'fill', aimDeg: 0, coverDeg: 90 }],
    what: 'Small loudspeakers on the stage lip covering the first rows the mains fire over.',
    when: 'Any time the mains are flown or stacked high and the front rows sit beneath their coverage.',
    changes: 'The front rows get a direct, intelligible source at a modest level; the fills get their own output — a console matrix or a processor output — so they can be delayed and equalised on their own.',
  },
  {
    id: 'delays',
    name: 'Mains plus delay loudspeakers',
    layout: [TOP_L, TOP_R, { slot: 'delayL', feed: 'DELAY', kind: 'delay', aimDeg: 0, coverDeg: 90, delayMs: 87 }, { slot: 'delayR', feed: 'DELAY', kind: 'delay', aimDeg: 0, coverDeg: 90, delayMs: 87 }],
    what: 'A second row of loudspeakers part-way back, electronically delayed so their sound arrives together with the mains.',
    when: 'Deep rooms and outdoor fields where the back rows would otherwise get a quiet, muddy, late main system.',
    changes: 'Level is restored at the back without raising the front; set the delay to the distance and the two arrivals fuse into one.',
  },
  {
    id: 'feeds',
    name: 'Lobby, recording, broadcast and overflow feeds',
    layout: [TOP_L, TOP_R],
    extraFeeds: ['LOBBY', 'REC', 'BCAST'],
    what: 'Outputs that never reach the room: matrix mixes built from the main mix and re-balanced for a lobby, a recorder, a broadcast truck, an overflow space.',
    when: 'Whenever anyone outside the room needs the show. Each feed is a matrix so its balance and level are independent.',
    changes: 'Nothing changes in the room. On the console, three more outputs exist, each starting from the finished mix.',
  },
];

export function outputConfig(id: string): OutputConfig {
  const c = OUTPUT_CONFIGS.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown output configuration: ${id}`);
  return c;
}

/* ── PA system types (chapter 2) ─────────────────────────────────────────── */

export type SystemType = {
  id: string;
  name: string;
  layout: PlacedSpeaker[];
  /** Powered boxes (default) or passive cabinets with amplifiers. */
  powered?: boolean;
  /** A venue-driven system, or a way any of them can be built out. */
  group: 'venue' | 'build';
  /** The gear list, in signal order. */
  chain: string[];
  when: string;
  notWhen: string;
  scale: string;
};

export const SYSTEM_TYPES: readonly SystemType[] = [
  {
    id: 'powered-small',
    name: 'Small powered-loudspeaker PA',
    group: 'venue',
    layout: [TOP_L_MONO, TOP_R_MONO],
    chain: ['Microphones and DIs', 'Small console', 'MAIN → two powered loudspeakers on stands'],
    when: 'Speech, a duo, a small room. Set up by one person in twenty minutes; the amplification is inside the cabinets.',
    notWhen: 'Loud music or a deep room — the cabinets run out of level and low end.',
    scale: 'Up to roughly 100 people',
  },
  {
    id: 'passive-amps',
    name: 'Passive loudspeakers with external amplifiers',
    group: 'build',
    powered: false,
    layout: [TOP_L, TOP_R, { slot: 'subL', feed: 'SUB', kind: 'sub' }, { slot: 'subR', feed: 'SUB', kind: 'sub' }],
    chain: ['Sources', 'Console', 'MAIN → loudspeaker processor → amplifier rack → passive tops and subs'],
    when: 'Installations and touring rigs where the amplifiers live in a rack, matched to the cabinets, with the processor holding crossover, limiting and alignment.',
    notWhen: 'A one-person setup — the rack, the speaker cable and the load arithmetic are all yours.',
    scale: 'Clubs to arenas',
  },
  {
    id: 'column',
    name: 'Portable column-array system',
    group: 'venue',
    layout: [{ slot: 'mainL', feed: 'M', kind: 'top', aimDeg: 14, coverDeg: 120 }, { slot: 'mainR', feed: 'M', kind: 'top', aimDeg: -14, coverDeg: 120 }, { slot: 'subL', feed: 'SUB', kind: 'sub' }, { slot: 'subR', feed: 'SUB', kind: 'sub' }],
    chain: ['Sources', 'Small mixer (often in the base)', 'Column tops on their sub bases — the base IS the sub'],
    when: 'Wide horizontal coverage with tight vertical control — cafés, weddings, corporate rooms with hard ceilings and floors.',
    notWhen: 'Heavy music at high level; the vertical control is the point, not the output.',
    scale: 'Up to a few hundred',
  },
  {
    id: 'club',
    name: 'Club or small-venue system',
    group: 'venue',
    powered: false,
    layout: [TOP_L, TOP_R, { slot: 'subL', feed: 'SUB', kind: 'sub' }, { slot: 'subR', feed: 'SUB', kind: 'sub' }, { slot: 'frontFillL', feed: 'FILL', kind: 'fill', aimDeg: 0, coverDeg: 90 }, { slot: 'frontFillR', feed: 'FILL', kind: 'fill', aimDeg: 0, coverDeg: 90 }],
    chain: ['Stagebox', 'Digital console', 'MAIN → processor → amps → tops, subs, front fills', 'AUX → monitor amps → wedges'],
    when: 'A permanent stage with bands every week: high level, a real monitor system, and a system tuned once and recalled.',
    notWhen: 'A different room every night — this design is tuned to its walls.',
    scale: '200 to 1,500',
  },
  {
    id: 'church',
    name: 'Church or multipurpose-room system',
    group: 'venue',
    layout: [TOP_L, { slot: 'mainC', feed: 'C', kind: 'top', aimDeg: 0, coverDeg: 100 }, TOP_R, { slot: 'delayL', feed: 'DELAY', kind: 'delay', aimDeg: 0, coverDeg: 90 }, { slot: 'delayR', feed: 'DELAY', kind: 'delay', aimDeg: 0, coverDeg: 90 }],
    chain: ['Many inputs, many operators', 'Digital console', 'MAIN + matrices → processor with zones', 'LCR mains · delays · under-balcony fills'],
    when: 'Speech intelligibility comes first, music second, and the room is long, reverberant and used for both.',
    notWhen: 'A concert-level rig — this system is designed for even, intelligible coverage, not maximum output.',
    scale: '200 to 3,000',
  },
  {
    id: 'corporate',
    name: 'Corporate presentation system',
    group: 'venue',
    layout: [TOP_L_MONO, TOP_R_MONO, { slot: 'delayL', feed: 'DELAY', kind: 'delay', aimDeg: 0, coverDeg: 90 }, { slot: 'delayR', feed: 'DELAY', kind: 'delay', aimDeg: 0, coverDeg: 90 }],
    chain: ['Wireless microphones and playback', 'Console with automatic mixing', 'MAIN → processor → distributed or delayed loudspeakers', 'MATRIX → recording and stream feeds'],
    when: 'Speech from many wireless microphones, video playback, a stream — every word clear at a modest level.',
    notWhen: 'A band — a modest low end for playback and no wedge system; presenters use confidence monitors or in-ears.',
    scale: 'Boardroom to ballroom',
  },
  {
    id: 'outdoor',
    name: 'Outdoor performance system',
    group: 'venue',
    powered: false,
    layout: [TOP_L, TOP_R, { slot: 'subL', feed: 'SUB', kind: 'sub' }, { slot: 'subR', feed: 'SUB', kind: 'sub' }, { slot: 'delayL', feed: 'DELAY', kind: 'delay', aimDeg: 0, coverDeg: 90, delayMs: 87 }, { slot: 'delayR', feed: 'DELAY', kind: 'delay', aimDeg: 0, coverDeg: 90, delayMs: 87 }],
    chain: ['Stagebox', 'Console', 'MAIN → processor → amps → mains, subs', 'Processor delay outputs → delay towers'],
    when: 'No walls to help: level falls with distance and nothing comes back. Delay towers carry the sound to the back.',
    notWhen: 'Wind and weather are the system’s enemies — an outdoor design that cannot be protected is not a design.',
    scale: '500 to tens of thousands',
  },
  {
    id: 'line-array',
    name: 'Large-format line-array system',
    group: 'venue',
    powered: false,
    layout: [{ slot: 'mainL', feed: 'L', kind: 'top', aimDeg: 10, coverDeg: 110 }, { slot: 'mainR', feed: 'R', kind: 'top', aimDeg: -10, coverDeg: 110 }, { slot: 'subL', feed: 'SUB', kind: 'sub' }, { slot: 'subR', feed: 'SUB', kind: 'sub' }, { slot: 'subC', feed: 'SUB', kind: 'sub' }, { slot: 'frontFillL', feed: 'FILL', kind: 'fill', aimDeg: 0, coverDeg: 90 }, { slot: 'frontFillR', feed: 'FILL', kind: 'fill', aimDeg: 0, coverDeg: 90 }],
    chain: ['Stagebox and splits', 'FOH console · monitor console', 'MAIN → networked amplifiers with processing → flown arrays, sub arrays, fills, delays', 'Monitor console → wedges, side fills, in-ears'],
    when: 'Arenas and festivals: the array’s narrow vertical coverage throws sound to the back without wasting it on the ceiling.',
    notWhen: 'A short throw, or a room too low to fly a line long enough to control — four boxes are a stack, not an array.',
    scale: 'Roughly 1,000 upward for large-format; compact arrays serve rooms from a few hundred',
  },
  {
    id: 'distributed',
    name: 'Distributed loudspeaker system',
    group: 'venue',
    layout: [{ slot: 'frontFillL', feed: 'ZONE-2', kind: 'fill', aimDeg: 0, coverDeg: 120 }, { slot: 'frontFillR', feed: 'ZONE-2', kind: 'fill', aimDeg: 0, coverDeg: 120 }, { slot: 'delayL', feed: 'ZONE-2', kind: 'delay', aimDeg: 0, coverDeg: 120 }, { slot: 'delayR', feed: 'ZONE-2', kind: 'delay', aimDeg: 0, coverDeg: 120 }],
    chain: ['Sources', 'Small console or matrix processor', 'Constant-voltage amplifiers', 'Many small loudspeakers, each covering a small area'],
    when: 'Low ceilings, long rooms, background music and paging — restaurants, terminals, lobbies. Every listener is near a loudspeaker. Drawn here as four zones; a real distributed system is a ceiling grid, every loudspeaker within a few metres of its listeners.',
    notWhen: 'A stage — a distributed system has no direction and no impact.',
    scale: 'Any size, at low level',
  },
  {
    id: 'fills',
    name: 'Front fills, side fills, under-balcony fills and delays',
    group: 'build',
    layout: [TOP_L, TOP_R, { slot: 'frontFillL', feed: 'FILL', kind: 'fill', aimDeg: 0, coverDeg: 90 }, { slot: 'frontFillR', feed: 'FILL', kind: 'fill', aimDeg: 0, coverDeg: 90 }, { slot: 'delayL', feed: 'DELAY', kind: 'delay', aimDeg: 0, coverDeg: 90, delayMs: 87 }, { slot: 'delayR', feed: 'DELAY', kind: 'delay', aimDeg: 0, coverDeg: 90, delayMs: 87 }],
    chain: ['The main system', 'MATRIX or processor outputs, one per fill zone', 'Delay and EQ per zone', 'Small cabinets where the mains cannot reach'],
    when: 'Not a system of its own — the additions that make any of the others cover the seats the mains miss: the first rows, the wings, under the balcony, the back.',
    notWhen: 'As a substitute for aiming the mains properly. Fills fix what the mains cannot reach, not what they were aimed away from.',
    scale: 'Added to any of the above',
  },
];

export function systemType(id: string): SystemType {
  const c = SYSTEM_TYPES.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown system type: ${id}`);
  return c;
}

/** Match-the-venue cases for chapter 2. */
export type VenueCase = { id: string; venue: string; correct: string; why: string };

export const VENUE_CASES: readonly VenueCase[] = [
  { id: 'v-cafe', venue: 'A café. One singer with a guitar, forty seats, low ceiling.', correct: 'powered-small', why: 'Two powered cabinets on stands and a small console cover forty seats with speech-level clarity; anything larger is carried in for nothing.' },
  { id: 'v-wedding', venue: 'A wedding in a marquee: speeches, a DJ, long tables on a hard floor.', correct: 'column', why: 'Wide horizontal coverage across long tables with little thrown at the hard floor, a fast one-person setup, and a sub base with enough for a dance floor this size. A full club rig would be carried in for nothing.' },
  { id: 'v-club', venue: 'A 600-capacity venue with bands five nights a week.', correct: 'club', why: 'A permanent installation: processor-tuned tops and subs, front fills for the barrier, a real monitor system, and scenes recalled per act.' },
  { id: 'v-church', venue: 'A 1,200-seat sanctuary with a balcony: sermon on Sunday, orchestra at Christmas.', correct: 'church', why: 'Speech first: an LCR main system for localisation, delays and under-balcony fills so every seat hears a direct source in a reverberant room.' },
  { id: 'v-corp', venue: 'A product launch: eight wireless microphones, video, a livestream, 400 in a ballroom.', correct: 'corporate', why: 'Automatic mixing across many microphones, playback, delayed loudspeakers for the deep room, and matrix feeds for the stream.' },
  { id: 'v-park', venue: 'A park concert for 5,000 on a field 120 m deep.', correct: 'outdoor', why: 'Nothing comes back off walls, so level is carried by delay towers; the mains and subs are aimed and the delays set to distance.' },
  { id: 'v-arena', venue: 'An arena tour: 12,000 seats and a 60 m throw to the back.', correct: 'line-array', why: 'Only a line array’s controlled vertical coverage keeps level at the back without a ceiling full of sound.' },
  { id: 'v-terminal', venue: 'An airport terminal: paging and background music over a very long, low space.', correct: 'distributed', why: 'Many small loudspeakers, each near its listeners, on a constant-voltage line — direction and impact are not wanted, evenness is.' },
];
