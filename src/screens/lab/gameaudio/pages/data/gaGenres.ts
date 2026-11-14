/**
 * gaGenres — page 4 ("Kinds of games"): twelve kinds of game with the sounds
 * each typically puts first, and the three SEPARATE choices that describe a
 * game. Pure data; no React Native (test/gameAudioChAGenres).
 *
 * The twelve rows are the owner's handoff table (section 5), in its order,
 * in plain words. They are DESIGN CASES, not rules: a game can combine
 * several rows, and the page says so once.
 *
 *   genre        what the player does          GA_GENRES
 *   perspective  where the camera is           GA_GAME_CHOICES[1]
 *   play mode    who plays, and how            GA_GAME_CHOICES[2]
 *
 * EACH KIND HAS ONE DEMONSTRATION (walk audit W1 F11: the GAMES chooser moved
 * nothing on the display). `demo.actions` are ordinary model actions, run in
 * order on a CLEAN scene (the page dispatches `enterPage` first); `demo.line`
 * says, in a short line, what the learner then sees. The GAMES tray covers
 * the well while it is open, so a line points only at the PICTURE and the
 * READOUTS, never at the log; it is at most GA_DEMO_LINE_MAX characters, so
 * the tray keeps two lines for it above the twelve chips. Every claim of every line is proven on
 * the model in test/gameAudioChAGenres.
 */
import type { GaAction } from '../../model/gaModel.ts';

export type GaGenreId =
  | 'puzzle'
  | 'platformer'
  | 'action'
  | 'adventure'
  | 'strategy'
  | 'racing'
  | 'sports'
  | 'rhythm'
  | 'horror'
  | 'sandbox'
  | 'narrative'
  | 'educational';

export type GaGenreCard = {
  id: GaGenreId;
  /** The dock chip: short. (The dock key shows how many kinds were seen:
   *  it used to show a second, invented word for six of them, JUMP, QUEST,
   *  COMMAND…: learning audit L-07, walk audit W1 F18.) */
  label: string;
  /** The card's title: the kind of game in full. */
  name: string;
  /** Why these sounds come first, in one or two sentences. */
  why: string;
  /** The typical sound emphasis. */
  emphasis: readonly string[];
  /** One small, true demonstration in the scene. */
  demo: GaGenreDemo;
};

export type GaGenreDemo = {
  /** Model actions, in order, on a clean scene. */
  actions: readonly GaAction[];
  /** What the learner is seeing: the picture and the readouts only. */
  line: string;
};

/** Where YOU land in the platformer's demonstration: on the gravel, south
 *  of the stone path. */
export const GA_DEMO_LANDING = { x: 5.2, y: 6.8 } as const;
/** Where YOU stand after walking into the workshop (adventure). */
export const GA_DEMO_INSIDE = { x: 11, y: 5 } as const;
/** Where YOU stand at the far west of the stone path (open world): past the
 *  generator's maximum distance, near the fountain. */
export const GA_DEMO_FAR_WEST = { x: 1.2, y: 5 } as const;
/** The speed the racing demonstration moves the generator to. */
export const GA_DEMO_SPEED = 0.9;
/** How many impacts the action demonstration posts. */
export const GA_DEMO_BURST = 12;
/** The longest a demonstration line may be (two lines in the tray). */
export const GA_DEMO_LINE_MAX = 110;

export const GA_GENRES: readonly GaGenreCard[] = [
  {
    id: 'puzzle',
    label: 'PUZZLE',
    name: 'Puzzle and casual',
    why: 'Each move needs an answer the player hears immediately, and the player will hear it many times.',
    emphasis: ['Immediate feedback for each action', 'Clear success and failure cues', 'Repetition kept under control'],
    demo: {
      actions: [{ type: 'door' }],
      line: 'The door opens, and its sound starts at the same moment: one move, one answer.',
    },
  },
  {
    id: 'platformer',
    label: 'PLATFORMER',
    name: 'Platformer',
    why: 'The player judges each jump by its timing, so the sound of a foot meeting the ground needs to arrive with the picture.',
    emphasis: ['The timing of foot contact', 'Jumps and landings', 'Movement', 'Changes of surface'],
    demo: {
      actions: [{ type: 'move', who: 'player', ...GA_DEMO_LANDING }, { type: 'step', who: 'player', dx: 0, dy: 0 }],
      line: 'YOU land on the gravel. One foot contact plays one footstep, chosen for gravel.',
    },
  },
  {
    id: 'action',
    label: 'ACTION',
    name: 'Action and shooter',
    why: 'Many things happen at the same time, so the mix decides which sounds the player needs first.',
    emphasis: ['Many sounds started in a short time', 'Impacts built from layers', 'Threats the player can locate by listening', 'Priorities', 'Speech that stays clear'],
    demo: {
      actions: [{ type: 'burst', count: GA_DEMO_BURST }],
      line: 'Twelve crate impacts in 0.3 s. PLAYING and VOICES jump, then fall again.',
    },
  },
  {
    id: 'adventure',
    label: 'ADVENTURE',
    name: 'Adventure and role playing',
    why: 'The player spends a long time in each place, so the background and the spoken story are a large part of the experience.',
    emphasis: ['Ambience for exploring', 'Dialogue', 'A story with more than one path', 'Music transitions'],
    demo: {
      actions: [{ type: 'scene', on: true }, { type: 'door' }, { type: 'move', who: 'player', ...GA_DEMO_INSIDE }],
      line: 'YOU walk into the workshop. The wind fades out and the room tone fades in.',
    },
  },
  {
    id: 'strategy',
    label: 'STRATEGY',
    name: 'Strategy and management',
    why: 'The player looks down from above and directs many units, so alerts need a clear order of importance.',
    emphasis: ['Listening from the camera', 'Many units', 'An order of importance for interface cues and alerts'],
    demo: {
      actions: [{ type: 'listener', mode: 'camera' }],
      line: 'The listener is now a camera above the middle of the scene, not YOU.',
    },
  },
  {
    id: 'racing',
    label: 'RACING',
    name: 'Racing and vehicle simulation',
    why: 'One sound, the engine, plays for the whole race. It follows speed and load without starting again.',
    emphasis: ['An engine sound that keeps playing', 'Speed and load as changing values', 'Loops', 'Pitch that shifts as a vehicle passes'],
    demo: {
      actions: [{ type: 'machine', id: 'generator-1', on: true }, { type: 'speed', id: 'generator-1', value: GA_DEMO_SPEED }],
      // the page has no SPEED readout, and one dispatch is a jump, not a rise
      // (bug test 2026-11-13, B-S2-03): the line says what the picture shows
      // both actions land in one moment, so the line promises no "then"
      // (round 2, R2-GA1-13: there was no slower moment to compare)
      line: 'The generator starts at high speed: its rings crowd close. An engine follows its speed without starting again.',
    },
  },
  {
    id: 'sports',
    label: 'SPORTS',
    name: 'Sports',
    why: 'The crowd and the commentary react to the play, and the view changes often.',
    emphasis: ['Impacts', 'Crowds', 'Commentary', 'Changes between views and situations'],
    demo: {
      actions: [{ type: 'post', event: 'crate_impact', owner: 'crate' }, { type: 'post', event: 'vo_greeting', owner: 'guide' }],
      // both start at the same moment (bug test B-S3-06): no "then"
      line: 'An impact, and a voice that reacts to it. In a sports game that voice is the commentary.',
    },
  },
  {
    id: 'rhythm',
    label: 'RHYTHM',
    name: 'Rhythm and music',
    why: 'The player acts in time with the music, so the delay between the game and the speaker matters.',
    emphasis: ['Exact timing of each sound', 'Musical time', 'The delay before a sound reaches the ear'],
    demo: {
      // music alone moved nothing on the screen (bug test 2026-11-13, B-S2-02):
      // a hit asked for at once waits for the next bar line, and PLAYING
      // shows the moment it lands (heard or not, on the same line)
      actions: [{ type: 'musicStart' }, { type: 'stinger' }],
      // the stinger is an instance with no voice counted (round 2, R2-GA1-12)
      line: 'A hit asked for now waits for the next bar line. PLAYING reads 1 when it lands. VOICES leaves music out.',
    },
  },
  {
    id: 'horror',
    label: 'HORROR',
    name: 'Horror and stealth',
    why: 'Silence matters as much as sound. A sound with no visible source builds tension.',
    emphasis: ['Restraint and silence', 'Distance', 'Tension', 'Sources the player cannot see or be sure of'],
    demo: {
      actions: [{ type: 'machine', id: 'generator-1', on: true }],
      line: 'The generator runs out of sight, behind the closed door. Its rings turn thin and dashed past the wall.',
    },
  },
  {
    id: 'sandbox',
    label: 'OPEN WORLD',
    name: 'Sandbox and open world',
    why: 'The world keeps running wherever the player goes, so many sources wait for the listener to come near.',
    emphasis: ['Sound sources that stay in the world', 'Zones that change', 'Many things that could sound at the same time'],
    demo: {
      actions: [{ type: 'scene', on: true }, { type: 'machine', id: 'generator-1', on: true }, { type: 'move', who: 'player', ...GA_DEMO_FAR_WEST }],
      line: 'YOU stand far west. The fountain plays. The far generator is tracked, not played: one gray dashed ring.',
    },
  },
  {
    id: 'narrative',
    label: 'NARRATIVE',
    name: 'Narrative and visual novel',
    why: 'The words are the main part of the game, in speech and in text, often in more than one language.',
    emphasis: ['Dialogue', 'Pacing', 'Interruptions', 'Language versions', 'Text that is easy to read'],
    demo: {
      actions: [{ type: 'scene', on: true }, { type: 'post', event: 'vo_greeting', owner: 'guide' }],
      line: 'The guide speaks, and the rest of the mix is turned down so the words stay clear.',
    },
  },
  {
    id: 'educational',
    label: 'EDUCATIONAL',
    name: 'Educational and serious games',
    why: 'Sound supports the task: it confirms a correct step and keeps each instruction clear.',
    emphasis: ['Clear instruction', 'Feedback that means something', 'Accessibility', 'Support for the task'],
    demo: {
      actions: [{ type: 'option', patch: { visualCue: true }, quiet: true }, { type: 'alarm', on: true }],
      line: 'The alarm sounds, and an OVERHEAT sign appears: a warning you can hear and see.',
    },
  },
];

export const gaGenre = (id: GaGenreId | null): GaGenreCard | undefined => GA_GENRES.find((g) => g.id === id);

/** How many different kinds the page's first goal asks the student to open. */
export const GA_GENRES_TO_OPEN = 3;

/* ── three separate choices ─────────────────────────────────────────────── */

export type GaGameChoice = {
  id: 'genre' | 'perspective' | 'mode';
  label: string;
  /** The question this choice answers. */
  asks: string;
  /** The usual answers. */
  examples: string;
};

export const GA_GAME_CHOICES: readonly GaGameChoice[] = [
  { id: 'genre', label: 'GENRE', asks: 'What does the player do?', examples: 'Solve, jump, fight, explore, command, race, play in time, hide, read.' },
  { id: 'perspective', label: 'PERSPECTIVE', asks: 'Where is the camera?', examples: 'First person, third person, top down or a fixed view, drawn in 2D or in 3D. A game drawn in 2D can still place its sounds in space.' },
  { id: 'mode', label: 'PLAY MODE', asks: 'Who plays, and how?', examples: 'One player, several players on one screen, or players online. In real time or in turns.' },
];
