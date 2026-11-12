/**
 * gaToolMap — page 20 ("Finding your way in the tools"). Pure data, no React
 * Native (test/gameAudioChETools.test.ts).
 *
 *   GA_TOOL_WINDOWS   the eight KINDS of window almost every game audio tool
 *                     has: what you do there, and the lab page where the
 *                     student already met the idea (by page title).
 *   GA_TOOL_MAP       for twelve core ideas of this lab, the CLOSEST name in
 *                     Wwise, FMOD Studio, Unity's own audio and Unreal
 *                     Engine's own audio.
 *
 * THE MAP IS A LOOKUP AID, NOT A TRANSLATION. The tools organize these ideas
 * differently (owner's handoff, section 14: "their terms are not exact
 * one-to-one equivalents"), and the page says so once, in plain words. A cell
 * is the closest idea, never a claim of an exact equal.
 *
 * ACCURACY RULE. Every cell that is not a dash was read in that vendor's own
 * current documentation on 2026-11-12; the page checked, the product version
 * it showed and the words that support the cell are recorded row by row in
 * docs/labs/gameaudio/SOURCES_TOOLS.md, and the test fails if a cell is not
 * in that record. Where a tool has no close idea of its own, or none could
 * be verified, the cell is GA_TOOL_NONE. NEVER fill a cell from memory:
 * check the vendor's page, then change this file and the record together.
 * Sources are internal and are never shown to the student.
 */

export const GA_TOOL_NONE = '—';

export type GaToolId = 'wwise' | 'fmod' | 'unity' | 'unreal';

/** The tools, in the order the page lists them. `label` is the line's
 *  heading; the two engines are named for their OWN audio (no middleware). */
export const GA_TOOLS: readonly { id: GaToolId; label: string; spoken: string }[] = [
  { id: 'wwise', label: 'WWISE', spoken: 'Wwise' },
  { id: 'fmod', label: 'FMOD STUDIO', spoken: 'FMOD Studio' },
  { id: 'unity', label: 'UNITY', spoken: 'Unity' },
  { id: 'unreal', label: 'UNREAL ENGINE', spoken: 'Unreal Engine' },
];

export type GaToolRow = {
  id: string;
  /** The idea, in this lab's word. */
  idea: string;
  /** What the idea is, in this lab's words (one short line). */
  meaning: string;
} & Record<GaToolId, string>;

export const GA_TOOL_MAP: readonly GaToolRow[] = [
  {
    id: 'event',
    idea: 'Event',
    meaning: 'A name the game calls. The audio side decides what plays.',
    wwise: 'Event',
    fmod: 'Event',
    unity: GA_TOOL_NONE,
    unreal: 'Sound Cue or MetaSound Source (an asset the game plays, not an event)',
  },
  {
    id: 'instance',
    idea: 'Instance',
    meaning: 'One single time a sound is actually playing.',
    wwise: 'Playing ID',
    fmod: 'Event instance',
    unity: GA_TOOL_NONE,
    unreal: GA_TOOL_NONE,
  },
  {
    id: 'parameter',
    idea: 'Parameter',
    meaning: 'A value the game moves to change a sound that is playing.',
    wwise: 'Game Parameter, linked by an RTPC',
    fmod: 'Parameter',
    // A dash on purpose (audio review 2026-11-12): Unity's "exposed parameter"
    // moves a whole mixer group, not a value on one playing sound.
    unity: GA_TOOL_NONE,
    unreal: 'Input of a MetaSound',
  },
  {
    id: 'switch',
    idea: 'Switch',
    meaning: 'One choice from a list, kept for each game object.',
    wwise: 'Switch, in a Switch Group',
    fmod: 'Labeled parameter, local',
    unity: GA_TOOL_NONE,
    unreal: 'Switch node in a Sound Cue',
  },
  {
    id: 'state',
    idea: 'State',
    meaning: 'A named mode for the whole game.',
    wwise: 'State, in a State Group',
    fmod: 'Global parameter',
    unity: GA_TOOL_NONE,
    unreal: GA_TOOL_NONE,
  },
  {
    id: 'random',
    idea: 'Random choice among takes',
    meaning: 'Several versions of one sound. One is picked each time.',
    wwise: 'Random Container',
    fmod: 'Multi instrument',
    unity: 'Audio Random Container',
    unreal: 'Random node in a Sound Cue',
  },
  {
    id: 'bus',
    idea: 'Bus',
    meaning: 'A group channel that many sounds feed.',
    wwise: 'Audio Bus',
    fmod: 'Group bus',
    unity: 'Group of an Audio Mixer',
    unreal: 'Sound Submix',
  },
  {
    id: 'mix',
    idea: 'Saved mix setup',
    meaning: 'A stored set of mix settings the game can recall.',
    wwise: 'State',
    fmod: 'Snapshot',
    unity: 'Snapshot of an Audio Mixer',
    unreal: 'Control Bus Mix',
  },
  {
    id: 'bank',
    idea: 'Sound bank',
    meaning: 'Sounds and their rules, packed into a file the game loads.',
    wwise: 'SoundBank',
    fmod: 'Bank',
    unity: GA_TOOL_NONE,
    unreal: GA_TOOL_NONE,
  },
  {
    id: 'emitter',
    idea: 'Emitter',
    meaning: 'The spot in the game world a sound comes from.',
    wwise: 'Game Object',
    fmod: 'Studio Event Emitter, in FMOD for Unity',
    unity: 'Audio Source',
    unreal: 'Audio Component',
  },
  {
    id: 'listener',
    idea: 'Listener',
    meaning: 'The virtual ears in the scene.',
    wwise: 'Listener',
    fmod: 'Listener',
    unity: 'Audio Listener',
    unreal: 'Listener',
  },
  {
    id: 'profiler',
    idea: 'Profiler',
    meaning: 'A live record of what the audio engine did, and what it cost.',
    wwise: 'Profiler layout',
    fmod: 'Profiler window',
    unity: 'Audio Profiler module',
    unreal: 'Audio Insights',
  },
];

/** One card read aloud: the idea, then each tool's closest name. */
export function gaToolRowSpoken(row: GaToolRow): string {
  const cells = GA_TOOLS.map((t) => `${t.spoken}: ${row[t.id] === GA_TOOL_NONE ? 'no close idea of its own' : row[t.id]}`);
  return `${row.idea}. ${row.meaning} ${cells.join('. ')}.`;
}

/* ── the usual windows ──────────────────────────────────────────────────── */

export type GaToolWindow = {
  id: 'files' | 'events' | 'gameinfo' | 'music' | 'properties' | 'mixer' | 'audition' | 'profiler';
  /** The number on the picture. The picture lays the panels out in this
   *  order, left to right and top to bottom, so picture and list agree. */
  n: number;
  /** The short name printed in the picture (it must fit a small panel). */
  tag: string;
  name: string;
  /** What you do there: one or two sentences. */
  does: string;
  /** Lab pages where the student met the idea, by PAGE TITLE (PageDef.title;
   *  the test reads the page files, so a renamed page fails here). */
  met: readonly string[];
  /** Used in place of page titles when the idea ran through the whole lab. */
  metNote?: string;
};

export const GA_TOOL_WINDOWS: readonly GaToolWindow[] = [
  {
    id: 'files',
    n: 1,
    tag: 'SOUNDS',
    name: 'Sound files and containers',
    does: 'You bring sound files in here and group them into containers: several versions of one sound, or layers that play together.',
    met: ['From source to game build', 'Variation and layers'],
  },
  {
    id: 'events',
    n: 2,
    tag: 'EVENTS',
    name: 'The event list',
    does: 'You make the names the game calls, and choose what each name starts, stops or changes.',
    met: ['Sound that reacts', 'Events and instances'],
  },
  {
    id: 'gameinfo',
    n: 3,
    tag: 'GAME INFO',
    name: 'Game information',
    does: 'You define the switches, states and parameters the game sends, and connect each one to a sound setting.',
    met: ['Triggers, states, switches'],
  },
  {
    id: 'music',
    n: 4,
    tag: 'MUSIC',
    name: 'The music editor',
    does: 'You arrange music as layers and sections, and mark where a change may happen, such as the next bar.',
    met: ['Adaptive music'],
  },
  {
    id: 'properties',
    n: 5,
    tag: 'PROPERTIES',
    name: 'The properties panel',
    does: 'You select a sound or an event, and its settings appear here: level, pitch, priority, distance curve and bus.',
    met: ['Emitters and distance', 'Budgets and voice limits'],
  },
  {
    id: 'mixer',
    n: 6,
    tag: 'MIXER',
    name: 'The mixer',
    does: 'You route sounds into buses. Each bus has its own level and effects, and rules such as ducking are set here.',
    met: ['The game mix'],
  },
  {
    id: 'audition',
    n: 7,
    tag: 'AUDITION',
    name: 'A way to audition',
    does: 'You play an event with no game running and move its values by hand. A sound can be tested before it is in a build.',
    met: [],
    metNote: 'every page with the scene: you pressed the keys in place of a game',
  },
  {
    id: 'profiler',
    n: 8,
    tag: 'PROFILER',
    name: 'The profiler, or activity log',
    does: 'You connect to the running game and read what started, what stopped, what was refused, and how many voices were in use.',
    met: ['Testing and fault finding', 'Budgets and voice limits'],
  },
];

/** The "met in this lab" line under a window's text. */
export function gaToolWindowMet(w: GaToolWindow): string {
  const where = w.met.length ? w.met.map((t) => `“${t}”`).join(' and ') : (w.metNote ?? '');
  return `In this lab: ${where}.`;
}
