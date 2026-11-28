/**
 * gaPlatforms — page 3 ("Where games run"): the seven platform comparison
 * cards, the five listening setups and the two resource budgets. Pure data
 * and three small functions; no React Native (test/gameAudioChAPlatforms).
 *
 * THREE SEPARATE QUESTIONS, kept separate in the data as on the page:
 *   platform   where the game runs          GA_PLATFORMS
 *   delivery   how it reaches the player    (a line on the cards it concerns)
 *   output     how the player hears it      GA_LISTENING
 * and a fourth thing that belongs to none of them:
 *   budget     how many voices the scene may use — a SCENARIO setting of this
 *              lab (the model's voice limit), never a property of a platform
 *              name. Any budget goes with any card.
 *
 * WHAT THE CARDS DO NOT SAY (owner's plan, section 8; the page brief): no
 * certification targets, no device or system names, no latency numbers, no
 * fixed budget for any platform. A card describes priorities to compare and
 * one test to run. The test pins this.
 */

export type GaPlatformId = 'mobile' | 'desktop' | 'console' | 'handheld' | 'browser' | 'xr' | 'cloud';

export type GaPlatformCard = {
  id: GaPlatformId;
  /** The dock chip and the card's title. */
  label: string;
  /** For the CARD readout. It is the card's own name: ONE name for each
   *  thing (learning audit L-07, walk audit W1 F18: the readout said HYBRID
   *  for the HANDHELD card). The dock key shows how many cards were seen. */
  short: string;
  /** The card's sub-title, and the name read aloud. */
  name: string;
  /** An example application. */
  example: string;
  /** The audio decisions to compare. */
  compare: readonly string[];
  /** What stays the same in the audio pipeline. */
  same: string;
  /** What could change. */
  change: string;
  /** ONE test the audio team should run. */
  test: string;
};

export const GA_PLATFORMS: readonly GaPlatformCard[] = [
  {
    id: 'mobile',
    label: 'MOBILE',
    short: 'MOBILE',
    name: 'Phones and tablets',
    example: 'A touch puzzle game, or an action game played while traveling.',
    compare: ['Short feedback cues', 'Clarity on a small speaker', 'The player’s control of the music', 'Interruptions, such as a call', 'Loading and storage size'],
    same: 'The game still asks for each sound by name, and the same sound files and mix rules answer.',
    change: 'Phones differ widely from each other. The game may be played muted or in a noisy place, so an important cue may also need a visible sign.',
    test: 'Play on the device’s own speaker, switch to another app, then come back. Confirm the sound returns as designed.',
  },
  {
    id: 'desktop',
    label: 'DESKTOP',
    short: 'DESKTOP',
    name: 'Desktop and laptop computers',
    example: 'A strategy game or a simulation.',
    compare: ['Distant units', 'Many possible sound sources at the same time', 'The camera’s viewpoint', 'An order of importance for interface cues and alerts'],
    same: 'Each sound, its variations and its place in the mix are built the same way.',
    change: 'The output can change during play: laptop speakers, headphones, an audio interface. A computer may not have surround speakers, much memory or a fast processor.',
    test: 'Change the output device while the game runs, for example by unplugging the headphones. Confirm the sound continues on the new device.',
  },
  {
    id: 'console',
    label: 'CONSOLE',
    short: 'CONSOLE',
    name: 'Game consoles',
    example: 'An exploration game or an action adventure.',
    compare: ['World sounds', 'Dialogue', 'Transitions between scenes', 'TV speakers and headphones'],
    same: 'The same sounds and the same mix structure. The game engine or the audio tool carries them to the console.',
    change: 'The player’s own output settings, suspend and resume, and the platform owner’s certification rules. Some controllers have a small speaker of their own.',
    test: 'Suspend the game in the middle of a scene and resume it. Confirm the loops, the music and the dialogue continue or restart as designed.',
  },
  {
    id: 'handheld',
    label: 'HANDHELD',
    short: 'HANDHELD',
    name: 'Handheld and hybrid systems',
    example: 'A portable game that can also be docked to a TV.',
    compare: ['Changes between speaker and headphones', 'Pause and resume', 'Battery power'],
    same: 'The sounds and their behavior are those of the same game on a larger system.',
    change: 'The listening condition can change within one session: built-in speakers, headphones, then a TV when docked. This group overlaps mobile, desktop and console technology.',
    test: 'Dock and undock during play, or plug in headphones. Confirm the mix is still clear on each output.',
  },
  {
    id: 'browser',
    label: 'BROWSER',
    short: 'BROWSER',
    name: 'Browser games',
    example: 'A small interactive game on a web page.',
    compare: ['Sound that waits for the player’s first tap or click', 'Files that fail to load', 'A tab that the browser pauses in the background', 'Differences between browsers'],
    same: 'Sounds are asked for by name, varied and mixed with the same ideas as in an installed game.',
    change: 'Many browsers start sound only after the player acts. A web build of a game engine may offer fewer audio features than its installed build.',
    test: 'Open the game in a new tab. Confirm the game does not try to play sound before the first tap or click, and that a file that fails to load is reported.',
  },
  {
    id: 'xr',
    label: 'XR',
    short: 'XR',
    name: 'Virtual, augmented and mixed reality',
    example: 'A room you walk through, or an object you pick up and turn.',
    compare: ['The direction of the head', 'Sounds fixed in the world, or fixed to the head', 'Spatial cues', 'Moving near to a source and far from it'],
    same: 'Each source still has a position, and the listener still decides its direction and level.',
    change: 'The listener turns and moves with the player’s own head, so position is tracked, not only panned left and right. The player may also need to hear the real room.',
    test: 'Turn your head, then walk around one source. Confirm the sound stays at its place in the world.',
  },
  {
    id: 'cloud',
    label: 'CLOUD',
    short: 'CLOUD',
    name: 'Cloud and streamed games',
    example: 'A game that runs on a remote computer and is streamed to the player.',
    compare: ['Which machine runs the game, and which one plays the sound', 'Stream delay', 'Sound that stays in time with the picture', 'The path of voice chat'],
    same: 'The game’s own audio is made the same way, on the machine that runs the game.',
    change: 'Cloud is a way to deliver a game, not a kind of device. The sound is sent with the picture, which adds delay, and the player may listen on a phone, a browser, a computer or a console.',
    test: 'Play through the stream. Confirm that the sound and the picture of one action arrive together.',
  },
];

export const gaPlatform = (id: GaPlatformId | null): GaPlatformCard | undefined => GA_PLATFORMS.find((p) => p.id === id);

/** The four cards the page's first goal asks for (handoff lesson 2). */
export const GA_PLATFORM_CORE: readonly GaPlatformId[] = ['mobile', 'desktop', 'console', 'browser'];

/** True once every core card has been opened. */
export const gaComparedCore = (seen: readonly GaPlatformId[]): boolean => GA_PLATFORM_CORE.every((id) => seen.includes(id));

/** CHECK 2 of the page (learning audit L-21: the lesson's success is that
 *  the learner can pick the test that belongs to a platform). Each option is
 *  one card's test in fewer words; the test pins each to its card. */
export const GA_PLATFORM_TEST_CHECK: Readonly<{ ask: GaPlatformId; options: readonly { of: GaPlatformId; text: string }[] }> = {
  ask: 'browser',
  options: [
    { of: 'browser', text: 'Open it in a new tab: no sound may play before the first tap' },
    { of: 'console', text: 'Suspend the game in the middle of a scene, then resume it' },
    { of: 'handheld', text: 'Dock and undock during play, then listen on each output' },
    { of: 'cloud', text: 'Play through the stream: do sound and picture arrive together?' },
  ],
};

/* ── output: how the player hears it ────────────────────────────────────── */

export type GaListeningId = 'speaker' | 'headphones' | 'tv' | 'soundbar' | 'headset';

export type GaListening = {
  id: GaListeningId;
  label: string;
  /** For the LISTEN readout: a word of the setup's own name, never a second
   *  name for it (learning audit L-07: headphones read "PHONES", in a list
   *  that opens with PHONE SPEAKER, on a page whose first card is "Phones
   *  and tablets"). Ten letters at most: the readout is the wide one. */
  short: string;
  /** What this output means for the audio, in one or two sentences. */
  blurb: string;
};

export const GA_LISTENING: readonly GaListening[] = [
  { id: 'speaker', label: 'PHONE SPEAKER', short: 'SPEAKER', blurb: 'A small speaker. Low notes are weak, and left and right are hard to tell apart, so a cue needs to be clear without them.' },
  { id: 'headphones', label: 'HEADPHONES', short: 'HEADPHONES', blurb: 'Left and right are fully separate and quiet details are easy to hear. Outside noise may or may not be blocked.' },
  { id: 'tv', label: 'TV SPEAKERS', short: 'TV', blurb: 'Small speakers heard from across a room that has its own noise. Clear speech is a common concern.' },
  { id: 'soundbar', label: 'SOUNDBAR', short: 'SOUNDBAR', blurb: 'One long speaker unit under the TV. Many widen the sound or add a bass unit, and each product does this in its own way.' },
  { id: 'headset', label: 'HEADSET', short: 'HEADSET', blurb: 'Headphones with a microphone. The player often hears voice chat and the game in the same ears.' },
];

export const gaListening = (id: GaListeningId | null): GaListening | undefined => GA_LISTENING.find((l) => l.id === id);

/** What the PLATFORM tray says about the card that is chosen: its ONE test,
 *  so the tests can be compared without leaving the tray (the whole card is
 *  in step 2 of the page). The tray prints the card's label above it, so the
 *  name is not repeated: measured at 390 x 844, page 3's tray has 155 pt with
 *  a card chosen (its lane keeps a nudge row), the chips take 96. */
export const gaPlatformBlurb = (p: GaPlatformCard): string => `One test: ${p.test}`;

/** What a dock key shows for "how many were opened": PICK before the first,
 *  then a count with no total (house rule: never "N of total"). */
export const gaSeenWord = (n: number): string => (n > 0 ? `${n} SEEN` : 'PICK');

/* ── the resource budget: a scenario setting, independent of the card ───── */

export type GaBudgetId = 'compact' | 'expanded';

/** How many voices the scene may sound at the same time (the model's voice
 *  limit). */
export const GA_BUDGETS: Readonly<Record<GaBudgetId, number>> = { compact: 8, expanded: 16 };

/** The BUDGET slider has two positions: its left half and its right half. */
export const gaBudgetAt = (lane: number): GaBudgetId => (lane < 0.5 ? 'compact' : 'expanded');

/** Where the slider sits for a voice limit. A limit another page left behind
 *  (neither 8 nor 16) sits at the right, and `gaBudgetOf` says it is neither. */
export const gaBudgetLane = (limit: number): number => (limit === GA_BUDGETS.compact ? 0 : 1);

export const gaBudgetOf = (limit: number): GaBudgetId | null => (limit === GA_BUDGETS.compact ? 'compact' : limit === GA_BUDGETS.expanded ? 'expanded' : null);

export const GA_BUDGET_WORD: Readonly<Record<GaBudgetId, string>> = { compact: 'COMPACT', expanded: 'EXPANDED' };

/** The dock key's value: the limit itself, in 7 letters or fewer. */
export const GA_BUDGET_SHORT: Readonly<Record<GaBudgetId, string>> = { compact: `${GA_BUDGETS.compact} MAX`, expanded: `${GA_BUDGETS.expanded} MAX` };
