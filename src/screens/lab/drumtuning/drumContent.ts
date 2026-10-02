/**
 * Drum Tuning Lab — CONTENT (owner spec 2026-10-01). Pure data, no React:
 * the seven chapters with their objectives, the decision scenarios with
 * their keys, the preparation checklist, the tuning goals, the key terms.
 * Pinned by test/drumTuningLab.test.ts.
 *
 * WORDING RULES (owner, hard):
 *  • Tuning is CONTROLLED LISTENING. No batter/resonant relationship is
 *    "correct"; three contrasting methods are shown with what each TENDS to
 *    do, and a drum's response also depends on size, construction, heads
 *    and playing style.
 *  • Tuning to a note is OPTIONAL — a useful resonant sound is the goal.
 *  • No invented manufacturer quotes: "some manufacturers recommend…", or
 *    nothing.
 *  • A tuning device helps consistency; the final judgement is listening.
 */
import type { GoalId } from './drumEngine';

export type DrumChapterId = 'sound' | 'prepare' | 'method' | 'whole' | 'types' | 'kit' | 'trouble';

export type DrumChapter = {
  id: DrumChapterId;
  num: number;
  title: string;
  short: string;
  objective: string;
  /** The objective in ONE line, for the amber label at the top of a rack
   *  page (the full objective lives on CONTENTS and the REVIEW page). */
  goal: string;
  takeaway: string;
  /** The named interactive of the chapter (the spec's title). */
  interactive: string;
  /** What banks the chapter's credit. */
  credit: string;
};

export const DRUM_CHAPTERS: readonly DrumChapter[] = [
  {
    id: 'sound', num: 1, title: 'How a drum makes sound', short: 'SOUND', interactive: 'Turn one rod',
    goal: 'name the parts, hear tension, meet the four qualities',
    objective: 'Name the parts of a drum that shape its tuning, hear what tension does to pitch, and meet the four things a tuner listens for: pitch, overtones, sustain and pitch bend.',
    takeaway: 'A drum is a system: two heads, a shell with its bearing edges, hoops, rods and lugs, and the air inside. Tension sets pitch; the balance of tension around the head sets how clean the note is; both heads and the air between them set sustain and bend.',
    credit: 'Reach the right answer on each of the four PRACTICE decisions.',
  },
  {
    id: 'prepare', num: 2, title: 'Prepare before tuning', short: 'PREP', interactive: 'Preparation checklist',
    goal: 'know the drum and the goal, inspect, seat a head, start from known',
    objective: 'Identify the drum and the goal, inspect the hardware, seat a new head with a consistent cross-pattern, and start from a known, even condition.',
    takeaway: 'Most "tuning problems" are preparation problems. Know the drum and the sound you want, check that nothing is loose, worn or dirty, seat the head evenly, and bring it up in small opposite steps from a known state.',
    credit: 'Every fault found and nothing extra flagged, on any drum, then ✓ REVEAL KEY. ↺ NEW DRUM deals another.',
  },
  {
    id: 'method', num: 3, title: 'The basic tuning method', short: 'METHOD', interactive: 'Tune the head',
    goal: 'tap, turn, even the head, then the other head',
    objective: 'Work the seven-step method: seat, finger-tighten, cross-pattern, tap near each lug, small adjustments until even, play from the seat, repeat on the other head.',
    takeaway: 'Tap near each rod at the same distance from the rim and match the pitches with small, opposing moves. Even first; the pitch you want second. Then the other head, then both together.',
    credit: 'Bring the practice head to EVEN (every lug within 10 cents) on the TUNE THE HEAD step.',
  },
  {
    id: 'whole', num: 4, title: 'Tuning the whole drum', short: 'WHOLE', interactive: 'Compare head relationships',
    goal: 'hear the two heads as one instrument',
    objective: 'Hear the two heads as one instrument: resonant higher, equal, or batter higher — what each relationship tends to do to sustain and pitch bend, and why no single one is the rule.',
    takeaway: 'The resonant head is not an afterthought. Its relationship to the batter decides where the energy sits and how long it lasts. Each relationship is a sound, not a mistake; which one you want depends on the drum, the heads, the music and the player.',
    credit: 'Hear all three relationships and say which rang longest, then reach the right answer on the PRACTICE decisions.',
  },
  {
    id: 'types', num: 5, title: 'Tuning each drum type', short: 'TYPES', interactive: 'Tune a drum for a sound',
    goal: 'snare, toms, bass drum: tune toward a stated sound',
    objective: 'Apply the method to a snare drum, the toms and the bass drum — what each is for, what its heads and hardware add, and how to tune and damp toward a stated sound.',
    takeaway: 'A snare is heads plus wires plus a strainer; toms are a pitch progression; a bass drum is a beater, a low note and a decision about the front head. The same listening, different goals.',
    credit: 'Meet two of the four goals on TUNE A DRUM FOR A SOUND, then reach the right answer on the PRACTICE decisions.',
  },
  {
    id: 'kit', num: 6, title: 'Tuning a kit', short: 'KIT', interactive: 'Build the tom range',
    goal: 'a range per drum, clear steps between the toms, notes',
    objective: 'Set a practical range for each drum, separate the toms so they do not crowd, listen in context, recheck after moving or re-heading, and keep notes you can reproduce.',
    takeaway: 'A kit is tuned as a set: each drum where it responds well, clear steps between the toms, checked in the music and written down.',
    credit: 'Bring the rack and floor tom to a DISTINCT interval on BUILD THE TOM RANGE.',
  },
  {
    id: 'trouble', num: 7, title: 'Advanced tuning and troubleshooting', short: 'FIX', interactive: 'Diagnose the symptom',
    goal: 'strike and tap first, name the area, then fix',
    objective: 'Diagnose by symptom with more than one possible cause, fix it on the simulated drum, and place tuning by ear, a pitch reference and a tuning device in their proper order.',
    takeaway: 'Every symptom has several possible causes. Investigate before turning anything. Devices help you repeat a setting; your ears decide whether it is right.',
    credit: 'Clear all five symptoms on DIAGNOSE THE SYMPTOM, then reach the right answer on the PRACTICE decisions.',
  },
];

export const drumChapterById = (id: string): DrumChapter => DRUM_CHAPTERS.find((c) => c.id === id) ?? DRUM_CHAPTERS[0];

/* ── scenarios ───────────────────────────────────────────────────────────── */

export type DrumScenario = {
  id: string;
  chapterId: DrumChapterId;
  prompt: string;
  options: readonly string[];
  /** BY VALUE, never by index. */
  correct: string;
  explain: string;
};

export const SOUND_SCENARIOS: readonly DrumScenario[] = [
  { id: 's1', chapterId: 'sound', prompt: 'You tighten one tension rod a quarter turn. What changes?', options: ['Only the pitch near that rod — the rest of the head is untouched', 'The pitch near that rod rises AND the head\'s balance shifts, so the note gets a warble', 'Nothing until every rod has been turned the same amount'], correct: 'The pitch near that rod rises AND the head\'s balance shifts, so the note gets a warble', explain: 'One rod changes the local tension and the evenness of the whole head. An uneven head makes two slightly different notes at once, and you hear them beat as a warble.' },
  { id: 's2', chapterId: 'sound', prompt: 'You tap a tom and a tuner app keeps jumping between two notes. What is going on?', options: ['The drum is out of tune — fix it until the app settles', 'A drumhead\'s overtones are not in simple ratios, so there is no single note to find; aim for a sound you like', 'The app is broken'], correct: 'A drumhead\'s overtones are not in simple ratios, so there is no single note to find; aim for a sound you like', explain: 'A head\'s overtones sit at odd ratios (about 1 : 1.6 : 2.1 : 2.3), not the whole-number ratios of a string, so a tuner has no single note to lock onto. That is why tuning to an exact note is OPTIONAL: the goal is a useful resonant sound, not a textbook pitch.' },
  { id: 's3', chapterId: 'sound', prompt: 'Which of these is NOT part of the system that shapes a drum\'s tuning?', options: ['The air inside the shell', 'The bearing edge', 'The colour of the shell finish'], correct: 'The colour of the shell finish', explain: 'Heads, shell, bearing edges, hoops, rods, lugs and the enclosed air all take part. The finish does not.' },
  { id: 's4', chapterId: 'sound', prompt: 'The note starts a little sharp and settles lower as it fades. What is that?', options: ['Pitch bend — tension rises with amplitude on a hard hit, then relaxes', 'A loose lug', 'The resonant head slipping'], correct: 'Pitch bend — tension rises with amplitude on a hard hit, then relaxes', explain: 'A membrane stretched by a big excursion is momentarily tighter; as the amplitude decays the pitch glides down. Lower tension and a harder strike make it deeper.' },
];

export const WHOLE_SCENARIOS: readonly DrumScenario[] = [
  { id: 'w1', chapterId: 'whole', prompt: 'Which batter/resonant relationship is the correct one?', options: ['Resonant higher than the batter', 'Both heads equal', 'None of them is "correct" — each is a different sound'], correct: 'None of them is "correct" — each is a different sound', explain: 'Players and makers describe contrasting approaches to sustain and bend. They are examples of methods, not a rule. Choose by listening to the drum you have.' },
  { id: 'w2', chapterId: 'whole', prompt: 'Two heads tuned near the same pitch tend to…', options: ['Cancel each other and shorten the note', 'Exchange energy through the air and sustain each other', 'Make the drum impossible to tune'], correct: 'Exchange energy through the air and sustain each other', explain: 'Two heads near the same pitch trade the sound back and forth through the air; the resonant head keeps the note alive after the batter has settled. Whether you want that long note is a musical decision.' },
  { id: 'w3', chapterId: 'whole', prompt: 'The same tuning on a 12" rack tom gives a different result on a 16" floor tom. Why?', options: ['The method was wrong', 'Size, construction, head choice and playing style all change a drum\'s response', 'Floor toms cannot be tuned'], correct: 'Size, construction, head choice and playing style all change a drum\'s response', explain: 'A relationship that sings on one drum can choke another. Listen to each drum rather than copying a number across the kit.' },
];

export const TYPES_SCENARIOS: readonly DrumScenario[] = [
  { id: 'y1', chapterId: 'types', prompt: 'Soft strokes on the snare produce no wire sound. Where do you look first?', options: ['The batter head tension', 'The snare-side head tension and the strainer setting', 'The shell'], correct: 'The snare-side head tension and the strainer setting', explain: 'The wires answer to the snare-side head: a loose or tight bottom head, or an over-tightened strainer, changes sensitivity before the batter does.' },
  { id: 'y2', chapterId: 'types', prompt: 'A heavily damped bass drum with a pillow against the batter compared to an open one…', options: ['Sounds the same but quieter', 'Has a shorter note with the overtones taken out first — a different instrument, not a worse one', 'Loses its pitch entirely'], correct: 'Has a shorter note with the overtones taken out first — a different instrument, not a worse one', explain: 'Damping shortens the decay and removes the upper partials first. Open kicks and damped kicks suit different music.' },
  { id: 'y3', chapterId: 'types', prompt: 'A tom pushed well above the range where it responds…', options: ['Gets brighter and better', 'Chokes: thin, short, pingy — the head is doing the shell\'s job', 'Gains sustain'], correct: 'Chokes: thin, short, pingy — the head is doing the shell\'s job', explain: 'Every drum has a band where the heads and shell work together. Outside it, up or down, you lose tone before you gain pitch.' },
];

export const TROUBLE_SCENARIOS: readonly DrumScenario[] = [
  { id: 'r1', chapterId: 'trouble', prompt: 'A tuning device reads every lug at the same number but the drum still sounds wrong. What now?', options: ['Trust the device — the drum is fine', 'Listen: the device measures one thing; the sound is the judgement', 'Replace the device'], correct: 'Listen: the device measures one thing; the sound is the judgement', explain: 'Devices help you repeat a setting consistently. They do not hear the head relationship, the room or the music. The final call is by ear.' },
  { id: 'r2', chapterId: 'trouble', prompt: 'A drum will not hold its tuning. Which is the LEAST likely cause?', options: ['A rod backing out under vibration', 'A worn washer or a damaged lug', 'The shell finish'], correct: 'The shell finish', explain: 'Rods, lugs, washers and tension consistency are where drift lives. Hardware first.' },
];

export const ALL_DRUM_SCENARIOS: readonly DrumScenario[] = [...SOUND_SCENARIOS, ...WHOLE_SCENARIOS, ...TYPES_SCENARIOS, ...TROUBLE_SCENARIOS];

export const scenariosForChapter = (id: DrumChapterId): readonly DrumScenario[] => ALL_DRUM_SCENARIOS.filter((s) => s.chapterId === id);

/* ── preparation checklist (Chapter 2) ───────────────────────────────────── */

export type PrepFault = 'worn' | 'loose' | 'debris' | 'uneven';

export const PREP_ITEMS: readonly { id: PrepFault; label: string; where: string; why: string }[] = [
  { id: 'worn', label: 'Worn head — coating scuffed, a dent near the centre', where: 'Look at the head surface under the glass', why: 'A worn or dented head will not tune evenly or hold its tuning; replace it before spending time on rods.' },
  { id: 'loose', label: 'Loose lug — a rod backed out, a gap under its washer', where: 'Walk the rods with INSPECT', why: 'A loose rod drops that lug\'s tension and lets the head drift. Snug it, and check the lug casing is not cracked or missing its insert.' },
  { id: 'debris', label: 'Debris near the bearing edge', where: 'Look where the head meets the shell', why: 'Grit between head and bearing edge stops the head seating evenly — a buzz or a dead spot that no rod will fix. Clean the edge.' },
  { id: 'uneven', label: 'Tuning problem — lugs at clearly different pitches', where: 'Read the tension map', why: 'An uneven head warbles. It is a tuning job, not a hardware job — but check hardware first, because a loose rod LOOKS like a tuning problem.' },
];

/** The CAUTION card (Chapters 2 and 3): the ways a drum gets damaged while
 *  being tuned. One card, two places. */
export const CAUTION_TITLE = 'CAUTION · a head has a working range';
export const CAUTION_TEXT = 'Past it the collar can split, the hoop can go out of round and a lug insert can strip. Drum key and fingers only — never a wrench or pliers. If a rod binds, stop and look; if the pitch stops rising as you turn, stop. Big turns on one rod are how hoops go out of round.';

/** The lab's ordered method (Chapter 3). */
export const METHOD_STEPS: readonly { id: string; title: string; short: string; detail: string }[] = [
  { id: 'seat', title: 'Seat the head and hoop evenly', short: 'SEAT', detail: 'Lay the head on a clean bearing edge, the hoop centred over it, every rod started by hand so nothing is cross-threaded.' },
  { id: 'finger', title: 'Finger-tighten each rod', short: 'FINGER', detail: 'Turn every rod until it just meets resistance. The head is now flat and even at zero — your known starting point.' },
  { id: 'star', title: 'Cross-pattern up to tension', short: 'STAR', detail: 'Half a turn at a time, in an opposing (star) order, so the head rises evenly and never wrinkles on one side. A head has a working range: when the pitch stops rising as you turn, stop.' },
  { id: 'tap', title: 'Tap near each lug', short: 'TAP', detail: 'A light stick tap about an inch in from the rim at each rod, same distance every time. Listen for the pitch at each spot.' },
  { id: 'adjust', title: 'Small adjustments until even', short: 'ADJUST', detail: 'Bring the low spots up and the high spots down in small opposing moves — an eighth of a turn — until the pitches match.' },
  { id: 'play', title: 'Play it from the playing position', short: 'PLAY', detail: 'Hit it as you would in the music and listen from the seat. The lug taps tell you about evenness; the stroke tells you about the sound.' },
  { id: 'other', title: 'The other head, then both together', short: 'OTHER', detail: 'Repeat on the resonant head. Then evaluate the drum as one instrument — Chapter 4.' },
];

/* ── goals (Chapter 5) ───────────────────────────────────────────────────── */

/** `start` says what the seeded starting state is and why it fails the
 *  goal — the learner always has to move toward the goal (never credit
 *  for pressing CHECK on a drum that already meets it). */
export const GOALS: readonly { id: GoalId; label: string; short: string; hint: string; start: string }[] = [
  { id: 'short', label: 'Short and controlled', short: 'SHORT', hint: 'A tight, quick note with the overtones held down: damping, and heads tuned away from each other so they stop feeding one another.', start: 'The drum starts OPEN — it rings on. Your job is to stop it.' },
  { id: 'open', label: 'Open and resonant', short: 'OPEN', hint: 'A long singing note with live overtones: no damping, both heads working together.', start: 'The drum starts DAMPED and detuned — it dies early. Your job is to let it sing.' },
  { id: 'low', label: 'Low and full', short: 'LOW', hint: 'A low fundamental with body: the batter in the lower part of the drum\'s range, little damping, the resonant head supporting it.', start: 'The drum starts HIGH in its range. Your job is to bring it down with body.' },
  { id: 'bend', label: 'Clear pitch bend', short: 'BEND', hint: 'An audible downward glide: lower tension, long enough to hear — in this model a resonant head tuned lower than the batter leaves the late sound lower.', start: 'The drum starts tight and a little damped — the glide is faint. Your job is to bring it out.' },
];

/* ── relationships (Chapter 4) ───────────────────────────────────────────── */

export type RelationshipId = 'resoHigher' | 'equal' | 'batterHigher';

export const RELATIONSHIPS: readonly { id: RelationshipId; label: string; short: string; semitones: number; tends: string }[] = [
  { id: 'resoHigher', label: 'Resonant higher than batter', short: 'RESO ↑', semitones: 3, tends: 'In this model, the energy leaves the drum faster: a quicker, more focused note with a clear attack, and the late sound settles ABOVE the batter\'s own pitch. Some players describe this as the "focused" tuning; some manufacturers recommend it as one starting point.' },
  { id: 'equal', label: 'Both heads equal', short: 'EQUAL', semitones: 0, tends: 'In this model, the two heads exchange energy freely: the longest sustain, with the late sound settling at the batter\'s own pitch. Often described as the "open" tuning.' },
  { id: 'batterHigher', label: 'Batter higher than resonant', short: 'BATTER ↑', semitones: 3, tends: 'In this model, the late sound settles toward the resonant head\'s LOWER pitch, so the note can seem to drop as it fades — here by up to a couple of hundred cents, on a real drum usually a fraction of that — with a fuller, lower body. Some players tune this way for a "growl".' },
];

/** The shared caveat under the three relationships: drummers describe the
 *  bend in BOTH directions, and the model cannot settle it. */
export const RELATIONSHIP_CAVEAT = 'Players describe the pitch bend of these two settings in opposite ways — some hear the "fall" with the resonant head high, some with it low — because on a real drum the stroke, the head weights and the shell change which mode wins. No single relationship is correct. Listen on the drum in front of you.';

/* ── key terms ───────────────────────────────────────────────────────────── */

export const DRUM_KEY_TERMS: Record<DrumChapterId, readonly { term: string; def: string }[]> = {
  sound: [
    { term: 'Batter head', def: 'The head you strike.' },
    { term: 'Resonant head', def: 'The bottom (or front) head, moved by the air the batter pushes — it shapes sustain and the sense of pitch.' },
    { term: 'Bearing edge', def: 'The shaped rim of the shell the head sits on; its profile sets how much head touches shell.' },
    { term: 'Overtones (partials)', def: 'The head\'s higher notes above the main one, at odd (non-whole-number) ratios.' },
    { term: 'Sustain (T60)', def: 'How long the note lasts: the time it takes to fall 60 dB. The lab calls it T60.' },
    { term: 'Pitch bend', def: 'The downward glide of a hard-struck note as the stretch-raised tension relaxes.' },
    { term: 'Cent (¢)', def: 'A hundredth of a semitone. SPREAD is the gap in cents between the highest and lowest lug.' },
  ],
  prepare: [
    { term: 'Seating', def: 'Settling a new head so it sits flat on the bearing edge all the way round.' },
    { term: 'Cross-pattern (star)', def: 'Tightening opposite rods in turn so tension rises evenly.' },
    { term: 'Known condition', def: 'A starting point you can return to: every rod finger-tight, the head flat.' },
  ],
  method: [
    { term: 'Lug pitch', def: 'The tone heard tapping an inch in from the rim at a rod — the local tension.' },
    { term: 'Evenness', def: 'How closely the lug pitches match; the spread in cents.' },
    { term: 'Cent', def: 'A hundredth of a semitone.' },
  ],
  whole: [
    { term: 'Coupling', def: 'The two heads trading energy through the enclosed air.' },
    { term: 'Sustain', def: 'How long the note lasts — here read as T60, the time to fall 60 dB.' },
    { term: 'Relationship', def: 'The resonant head\'s pitch relative to the batter\'s.' },
  ],
  types: [
    { term: 'Snare-side head', def: 'The thin bottom head of a snare drum that the wires lie against.' },
    { term: 'Strainer (throw-off)', def: 'The lever and screw that tension the snare wires against the head.' },
    { term: 'Port', def: 'A hole in the bass drum\'s front head: less coupling, faster decay, a mic path.' },
    { term: 'Damping', def: 'Gel, felt, a pillow — anything that shortens the decay and takes the overtones first.' },
  ],
  kit: [
    { term: 'Pitch progression', def: 'The order and spacing of the toms\' pitches across the kit.' },
    { term: 'Useful range', def: 'The band of fundamentals where a drum responds well — a place to start listening, not a rule.' },
    { term: 'Tuning notes', def: 'A written record of each drum\'s setup so it can be reproduced.' },
  ],
  trouble: [
    { term: 'Warble', def: 'A slow beat between the two slightly different notes an uneven head makes at once.' },
    { term: 'Choke', def: 'A note cut short by too much tension, a worn head or heavy damping.' },
    { term: 'Pitch reference', def: 'A tuner, a keyboard or another drum used to check a pitch — a check, not a verdict.' },
  ],
};

/* ── tuning notes (Chapter 6) ────────────────────────────────────────────── */

export type TuningNote = {
  id: string;
  name: string;
  savedAt: number;
  /** Per drum: the batter pitch, the resonant head's pitch WHEN it was set
   *  (Chapter 6 tunes the batter only, so it records none rather than a
   *  number it never measured), and a free note. */
  drums: { drum: string; batterHz: number; resoHz?: number; note: string }[];
};
