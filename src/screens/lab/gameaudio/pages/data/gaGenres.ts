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
 */

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
  /** The dock chip: short. */
  label: string;
  /** For the dock key: a real word of 7 letters at most. */
  short: string;
  /** The card's title: the kind of game in full. */
  name: string;
  /** Why these sounds come first, in one or two sentences. */
  why: string;
  /** The typical sound emphasis. */
  emphasis: readonly string[];
};

export const GA_GENRES: readonly GaGenreCard[] = [
  {
    id: 'puzzle',
    label: 'PUZZLE',
    short: 'PUZZLE',
    name: 'Puzzle and casual',
    why: 'Each move needs an answer the player hears immediately, and the player will hear it many times.',
    emphasis: ['Immediate feedback for each action', 'Clear success and failure cues', 'Repetition kept under control'],
  },
  {
    id: 'platformer',
    label: 'PLATFORMER',
    short: 'JUMP',
    name: 'Platformer',
    why: 'The player judges each jump by its timing, so the sound of a foot meeting the ground arrives with the picture.',
    emphasis: ['The timing of foot contact', 'Jumps and landings', 'Movement', 'Changes of surface'],
  },
  {
    id: 'action',
    label: 'ACTION',
    short: 'ACTION',
    name: 'Action and shooter',
    why: 'Many things happen at the same time, so the mix decides which sounds the player needs first.',
    emphasis: ['Many sounds started in a short time', 'Impacts built from layers', 'Threats the player can locate by listening', 'Priorities', 'Speech that stays clear'],
  },
  {
    id: 'adventure',
    label: 'ADVENTURE',
    short: 'QUEST',
    name: 'Adventure and role playing',
    why: 'The player spends a long time in each place, so the background and the spoken story are a large part of the experience.',
    emphasis: ['Ambience for exploring', 'Dialogue', 'A story with more than one path', 'Music transitions'],
  },
  {
    id: 'strategy',
    label: 'STRATEGY',
    short: 'COMMAND',
    name: 'Strategy and management',
    why: 'The player looks down from above and directs many units, so alerts need a clear order of importance.',
    emphasis: ['Listening from the camera', 'Many units', 'An order of importance for interface cues and alerts'],
  },
  {
    id: 'racing',
    label: 'RACING',
    short: 'RACING',
    name: 'Racing and vehicle simulation',
    why: 'One sound, the engine, plays for the whole race. It follows speed and load without starting again.',
    emphasis: ['An engine sound that keeps playing', 'Speed and load as changing values', 'Loops', 'Pitch that shifts as a vehicle passes'],
  },
  {
    id: 'sports',
    label: 'SPORTS',
    short: 'SPORTS',
    name: 'Sports',
    why: 'The crowd and the commentary react to the play, and the view changes often.',
    emphasis: ['Impacts', 'Crowds', 'Commentary', 'Changes between views and situations'],
  },
  {
    id: 'rhythm',
    label: 'RHYTHM',
    short: 'RHYTHM',
    name: 'Rhythm and music',
    why: 'The player acts in time with the music, so the delay between the game and the speaker matters.',
    emphasis: ['Exact timing of each sound', 'Musical time', 'The delay before a sound reaches the ear'],
  },
  {
    id: 'horror',
    label: 'HORROR',
    short: 'HORROR',
    name: 'Horror and stealth',
    why: 'Silence matters as much as sound. A sound with no visible source builds tension.',
    emphasis: ['Restraint and silence', 'Distance', 'Tension', 'Sources the player cannot see or be sure of'],
  },
  {
    id: 'sandbox',
    label: 'OPEN WORLD',
    short: 'OPEN',
    name: 'Sandbox and open world',
    why: 'The world keeps running wherever the player goes, so many sources wait for the listener to come near.',
    emphasis: ['Sound sources that stay in the world', 'Zones that change', 'Many things that could sound at the same time'],
  },
  {
    id: 'narrative',
    label: 'NARRATIVE',
    short: 'STORY',
    name: 'Narrative and visual novel',
    why: 'The words are the main part of the game, in speech and in text, often in more than one language.',
    emphasis: ['Dialogue', 'Pacing', 'Interruptions', 'Language versions', 'Text that is easy to read'],
  },
  {
    id: 'educational',
    label: 'EDUCATIONAL',
    short: 'LEARN',
    name: 'Educational and serious games',
    why: 'Sound supports the task: it confirms a correct step and keeps each instruction clear.',
    emphasis: ['Clear instruction', 'Feedback that means something', 'Accessibility', 'Support for the task'],
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
