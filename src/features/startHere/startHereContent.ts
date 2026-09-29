/**
 * Start Here: Your First Steps in Audio — the CONTENT (owner brief 2026-09-29).
 *
 *   "The app is too daunting and overwhelming for a new user (feedback from a
 *    tester) … a new lab/lesson … in the main menu carousel … next to Pro Audio
 *    Safety. This is for beginners to get their feet wet … This will always be
 *    free, it is not part of the certificates, it is not in the lab area, it is
 *    its own entity entered from the main menu card."
 *
 * The owner's plan (Downloads/590fff50…txt) is the spec: six lessons, the
 * "Your First Audio Signal" guided lab (make a sound → capture it → follow
 * the signal → change or measure it → listen and reflect), the starter words
 * in three groups with the plan's own definitions, word practice, the
 * repeated distinction (frequency ↔ pitch, amplitude ↔ loudness; a
 * measurement is not a perception), a safe-listening reminder and a
 * "choose what's next" hand-off.
 *
 * PURE DATA — no React, no React Native — so node:test reads it directly
 * (test/startHere.test.ts) and every word a beginner reads can be reviewed in
 * one file. The screens in src/screens/startHere only draw it.
 *
 * FREE BY CONSTRUCTION: nothing here names a membership, an entitlement, a
 * certificate unit or a labCompletion key. Progress is the device-local
 * `ape:startHere:v1` record (kit pagedProgress), written for signed-in
 * learners only — guests follow the house guest rule (session only).
 */

/** Progress key suffix → AsyncStorage `ape:startHere:v1` (pagedProgress). */
export const START_HERE_ID = 'startHere';

export const START_HERE_TITLE = 'Start Here: Your First Steps in Audio';
export const START_HERE_SHORT = 'Start Here';

// ─────────────────────────────────────────────────────────────────────────────
// Starter words

export type TermGroupId = 'hearing' | 'equipment' | 'level';

export const TERM_GROUPS: readonly { id: TermGroupId; title: string; blurb: string }[] = [
  { id: 'hearing', title: 'Sound and hearing', blurb: 'What sound is, where it comes from, and how we hear it.' },
  { id: 'equipment', title: 'Signals and equipment', blurb: 'The gear that captures, carries and plays back sound.' },
  { id: 'level', title: 'Level and visual displays', blurb: 'How big a sound is, and the pictures that show it.' },
];

export type StarterTerm = {
  id: string;
  term: string;
  group: TermGroupId;
  /** The plain definition shown in the app (no metered lookup). */
  def: string;
  /** One more plain sentence where a beginner needs it (a second meaning,
   *  an everyday example). */
  note?: string;
  /**
   * The FULL glossary entry this word opens in place (GlossaryTermPopup —
   * the learner's page stays exactly where it was). The exact glossary term,
   * matched case-insensitively. Verified present 2026-09-29 against
   * glossary_browse_v. `null` only when the glossary's entry of that name
   * means something else — `glossaryGap` then says why, and the gap is in the
   * owner report so an entry can be authored.
   */
  glossary: string | null;
  glossaryGap?: string;
};

export const STARTER_TERMS: readonly StarterTerm[] = [
  // ── Sound and hearing ──
  { id: 'sound', term: 'Sound', group: 'hearing', def: 'Vibration travelling through a material, such as air.', glossary: 'Sound' },
  { id: 'vibration', term: 'Vibration', group: 'hearing', def: 'Repeated movement back and forth.', note: 'A guitar string, a drum skin, your vocal cords and a speaker cone all vibrate.', glossary: 'vibration' },
  {
    id: 'source',
    term: 'Source',
    group: 'hearing',
    def: 'The thing that creates a sound, such as a voice, an instrument, or a speaker.',
    glossary: null,
    glossaryGap:
      'The Glossary’s entry for this word is about electronics, not sound, so there is no full entry to open here.',
  },
  { id: 'medium', term: 'Medium', group: 'hearing', def: 'The material sound travels through, such as air.', note: 'Sound also travels through water and solids. It cannot travel through empty space — there is nothing there to vibrate.', glossary: 'Medium' },
  { id: 'listener', term: 'Listener', group: 'hearing', def: 'The person, or device, receiving the sound.', note: 'A microphone can be the listener too — it receives the sound waves, though it does not hear them the way you do.', glossary: 'Listening Position' },
  { id: 'pitch', term: 'Pitch', group: 'hearing', def: 'How high or low a sound seems.', note: 'Pitch is what you hear. The measurement it follows most closely is frequency.', glossary: 'Pitch' },
  { id: 'tone', term: 'Tone', group: 'hearing', def: 'A sound with a clear, steady pitch.', note: 'The test tones in this lesson are pure tones — a single frequency. Engineers also say “tone” for a sound’s overall character, as in “a warm tone”.', glossary: 'Pure Tone' },
  { id: 'noise', term: 'Noise', group: 'hearing', def: 'A sound that is irregular or complex and is not heard as a clear tone — like hiss, wind or rain.', note: 'In audio work, “noise” also means any unwanted sound or signal, such as hum or hiss.', glossary: 'Noise' },

  // ── Signals and equipment ──
  { id: 'audio', term: 'Audio', group: 'equipment', def: 'Sound that equipment has turned into a signal, so it can be carried, changed, recorded or played back.', note: 'Once a speaker turns the signal back into vibration in the air, what you hear is sound again.', glossary: 'Audio' },
  { id: 'audioSignal', term: 'Audio signal', group: 'equipment', def: 'An electrical or digital copy of a sound that equipment can carry or process.', note: 'You cannot hear an audio signal directly — it has to reach a speaker or headphones first.', glossary: 'Audio' },
  { id: 'microphone', term: 'Microphone', group: 'equipment', def: 'A device that converts sound into an audio signal.', glossary: 'Microphone (Mic)' },
  { id: 'speaker', term: 'Speaker', group: 'equipment', def: 'A device that converts an audio signal into sound.', note: 'Its full name is loudspeaker. Headphones are small speakers worn on the ears.', glossary: 'Loudspeaker (Speaker)' },
  { id: 'cable', term: 'Cable', group: 'equipment', def: 'A physical path that carries a signal between devices.', glossary: 'Audio cable' },
  { id: 'input', term: 'Input', group: 'equipment', def: 'A connection or point where a signal enters a device.', glossary: 'input/output' },
  { id: 'output', term: 'Output', group: 'equipment', def: 'A connection or point where a signal leaves a device.', note: 'In a simple system like the one in these lessons, a cable runs from one device’s output to the next device’s input.', glossary: 'input/output' },
  { id: 'signalPath', term: 'Signal path', group: 'equipment', def: 'The route a signal follows through equipment.', glossary: 'Signal Path' },
  { id: 'recording', term: 'Recording', group: 'equipment', def: 'Capturing audio so it can be stored and played later.', glossary: 'Recording' },
  { id: 'playback', term: 'Playback', group: 'equipment', def: 'Reproducing recorded or stored audio for listening.', glossary: 'Playback' },

  // ── Level and visual displays ──
  { id: 'frequency', term: 'Frequency', group: 'level', def: 'How many times a vibration repeats in one second, measured in hertz (Hz).', note: '220 Hz means 220 complete back-and-forth cycles every second.', glossary: 'Frequency' },
  { id: 'amplitude', term: 'Amplitude', group: 'level', def: 'The size or strength of a vibration or signal.', glossary: 'Amplitude' },
  { id: 'loudness', term: 'Loudness', group: 'level', def: 'How loud or quiet a sound seems to a listener.', note: 'Loudness is what you hear. It follows amplitude, but also depends on frequency and on the listener.', glossary: 'Loudness' },
  { id: 'decibel', term: 'Decibel (dB)', group: 'level', def: 'A unit used to describe levels, including sound level and signal level.', note: 'A decibel number always compares a level with a reference level, on a scale that grows by multiplying rather than adding — so “0 dB” means different things on different meters.', glossary: 'Decibel (dB)' },
  { id: 'waveform', term: 'Waveform', group: 'level', def: 'A picture of a signal over time — its height shows the signal’s amplitude at each moment.', glossary: 'Waveform' },
  { id: 'meter', term: 'Meter', group: 'level', def: 'A display that shows a changing level, such as an audio signal’s level or a sound pressure level.', glossary: 'Meter (Metering)' },
];

export function termById(id: string): StarterTerm | undefined {
  return STARTER_TERMS.find((t) => t.id === id);
}

// ─────────────────────────────────────────────────────────────────────────────
// The one distinction the owner asked to repeat

export const DISTINCTION = {
  title: 'Measured vs heard',
  rows: [
    { measured: 'Frequency', measuredHow: 'cycles per second, in hertz (Hz)', heard: 'Pitch', heardHow: 'how high or low it seems' },
    { measured: 'Amplitude', measuredHow: 'the size of the vibration or signal', heard: 'Loudness', heardHow: 'how loud or quiet it seems' },
  ],
  closer:
    'Frequency is related to pitch, and amplitude is related to loudness — but a measurement and what a person hears are not always exactly the same.',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Check questions (answer → reveal; never graded, never blocking)

export type StartCheck = {
  question: string;
  options: string[];
  correctIdx: number;
  reveal: string;
  wrongHint?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Lesson 6: a mixed recap — one question from each strand (cognitive review
// 2026-09-29: the path drawing was practised five times, the rest never
// recalled). Presented order is shuffled by CheckQuestion.

export const RECAP_CHECKS: readonly StartCheck[] = [
  {
    question: 'What does every sound start with?',
    options: ['A vibration', 'A microphone', 'Electricity'],
    correctIdx: 0,
    reveal: 'A vibration — a voice, a string, a speaker cone moving back and forth.',
  },
  {
    question: 'A tone goes from 220 Hz to 440 Hz. Which word describes what CHANGED in the measurement?',
    options: ['Frequency', 'Amplitude', 'Loudness'],
    correctIdx: 0,
    reveal: 'Frequency — how often it repeats. You hear it as a higher pitch.',
  },
  {
    question: 'On a digital meter, the top of the scale is 0. What does −18 mean?',
    options: ['18 dB below the most the signal can reach', 'A broken signal', 'A very loud signal'],
    correctIdx: 0,
    reveal: 'Right — 18 dB below full scale. Minus numbers are normal on a digital meter.',
  },
  {
    question: 'Two sounds have the same amplitude. Will they always sound equally loud?',
    options: ['No — how loud it seems also depends on frequency and the listener', 'Yes, always', 'Only on headphones'],
    correctIdx: 0,
    reveal: 'Measured is not the same as heard. That idea runs through the whole app.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Exercises

/** Two-bin sorting exercise (Sound or audio? / Measured or heard?). */
export type SortExercise = {
  prompt: string;
  bins: readonly [string, string];
  /** Shown after a wrong pick — a nudge, never the answer. */
  hint: string;
  items: readonly { text: string; bin: 0 | 1; why: string }[];
};

export const SORT_SOUND_OR_AUDIO: SortExercise = {
  prompt: 'Is each of these sound in the air, or audio (a signal inside equipment)?',
  bins: ['SOUND', 'AUDIO'],
  hint: 'Not quite — is it vibration in the air right now, or a signal inside equipment? Try the other one.',
  items: [
    { text: 'A guitar string ringing in a quiet room', bin: 0, why: 'Vibration in the air — no equipment involved.' },
    { text: 'What travels along a microphone cable', bin: 1, why: 'The microphone has turned the sound into an audio signal.' },
    { text: 'Music coming out of a speaker at a concert', bin: 0, why: 'It started as audio, but once the speaker pushes the air it is sound again.' },
    { text: 'A song saved on your phone', bin: 1, why: 'A recording is stored audio, waiting for playback.' },
    { text: 'Your voice in the air, before it reaches the mic', bin: 0, why: 'Still sound until the microphone turns it into a signal.' },
    { text: 'A voice message waiting on your phone', bin: 1, why: 'Stored as a signal — audio — until you play it.' },
  ],
};

export const SORT_MEASURED_OR_HEARD: SortExercise = {
  prompt: 'Is each of these something equipment measures, or how a sound seems to a person?',
  bins: ['MEASURED', 'HEARD'],
  hint: 'Not quite — could a machine put a number on it, or is it how the sound seems to a person? Try the other one.',
  items: [
    { text: 'The meter reads −12', bin: 0, why: 'A number on a display — a measurement of level.' },
    { text: 'It sounds shrill', bin: 1, why: 'A description of how it seems to a listener.' },
    { text: 'The tone repeats 440 times a second', bin: 0, why: 'That is its frequency: 440 Hz, something equipment can count.' },
    { text: 'The bass seems quieter than the singer', bin: 1, why: 'Loudness is how it seems — and our ears are less sensitive to low notes.' },
    { text: 'The speaker cone moves further', bin: 0, why: 'A bigger amplitude — something that can be measured.' },
  ],
};

/** Put the signal path in order. */
export const ORDER_PATH = {
  prompt: 'Tap the parts in the order the signal travels, starting with the singer.',
  steps: ['Voice (the source)', 'Microphone', 'Cable', 'Mixer', 'Cable', 'Speaker', 'Listener'],
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// The signal path drawing (Lessons 2, 4, 6 and the lab's Step 3)

export type StationId = 'voice' | 'mic' | 'cableA' | 'mixer' | 'cableB' | 'speaker' | 'listener';
export type SignalForm = 'sound' | 'signal';

export type Station = {
  id: StationId;
  /** Label printed under it on the drawing (≤ 7 characters — 9 pt floor). */
  short: string;
  name: string;
  /** What form the sound is in AT this stop (Lesson 2's point). */
  form: SignalForm;
  /** Lesson 2: what happens here as the voice travels. */
  follow: string;
  /** Lesson 4: this part's job, with its inputs and outputs. */
  job: string;
  /** Lesson 4: where signal enters / leaves it, if it has connections. */
  io?: string;
};

export const STATIONS: readonly Station[] = [
  {
    id: 'voice',
    short: 'VOICE',
    name: 'Voice — the source',
    form: 'sound',
    follow: 'A singer’s vocal cords vibrate. That vibration pushes on the air, and the air carries it as sound. This is plain sound — no equipment yet.',
    job: 'The source is whatever makes the sound — a voice, an instrument, or a speaker. Everything else in the path exists to carry its sound somewhere.',
  },
  {
    id: 'mic',
    short: 'MIC',
    name: 'Microphone',
    form: 'signal',
    follow: 'The sound pushes the microphone’s thin diaphragm back and forth. The mic turns that movement into a matching electrical signal. Sound becomes audio here.',
    job: 'A microphone converts sound into an audio signal. Its diaphragm is moved by the sound waves, much as your eardrum is, and it sends out an electrical copy of that movement.',
    io: 'The mic has an OUTPUT: its connector sends the signal on. Sound goes in through the grille.',
  },
  {
    id: 'cableA',
    short: 'CABLE',
    name: 'Cable',
    form: 'signal',
    follow: 'The cable carries the audio signal — an electrical copy of the sound, not sound itself. Nothing inside a cable can be heard.',
    job: 'A cable carries the signal from one device to the next. Here it runs from the mic’s OUTPUT to the mixer’s INPUT.',
  },
  {
    id: 'mixer',
    short: 'MIXER',
    name: 'Mixer',
    form: 'signal',
    follow: 'The mixer receives the signal and lets an engineer control it — how loud it is, for example — then sends it on. It is still an electrical signal.',
    job: 'A mixer receives signals, lets you control them (level, tone, which signals go where) and sends them on. A mixer can also send a copy to a recorder.',
    io: 'Its INPUTS receive signals from mics and instruments. Its OUTPUTS send the mixed signal on to speakers or a recorder.',
  },
  {
    id: 'cableB',
    short: 'CABLE',
    name: 'Cable',
    form: 'signal',
    follow: 'A second cable carries the signal from the mixer to the speaker. Still electrical — still silent.',
    job: 'Another cable, from the mixer’s OUTPUT to the speaker’s INPUT. In a simple path like this the signal flows output → input.',
  },
  {
    id: 'speaker',
    short: 'SPEAKER',
    name: 'Speaker',
    form: 'sound',
    follow: 'The speaker does the microphone’s job in reverse: the signal drives its cone back and forth, and the moving cone makes sound in the air again. Audio becomes sound here.',
    job: 'A speaker converts an audio signal back into sound. Many speakers have the amplifier that powers them built in; others are driven by a separate amplifier.',
    io: 'The speaker has an INPUT: the cable from the mixer plugs in here. Sound comes out of the front.',
  },
  {
    id: 'listener',
    short: 'YOU',
    name: 'Listener',
    form: 'sound',
    follow: 'The sound waves reach your ears and push your eardrums. You hear the singer — louder, and able to reach a whole room.',
    job: 'The listener receives the sound. A microphone can be a listener too — which is how a sound gets recorded.',
  },
];

export function stationById(id: StationId): Station {
  return STATIONS.find((s) => s.id === id) ?? STATIONS[0];
}

/** Lesson 6: match a word to a place on the drawing. `targets` are station
 *  ids, plus the four jacks (`mic.out`, `mixer.in`, `mixer.out`,
 *  `speaker.in`) for INPUT / OUTPUT. */
export type MatchTarget = StationId | 'mic.out' | 'mixer.in' | 'mixer.out' | 'speaker.in';

export const MATCH_PROMPTS: readonly { termId: string; ask: string; targets: readonly MatchTarget[]; right: string }[] = [
  { termId: 'source', ask: 'Tap the SOURCE — the thing that makes the sound.', targets: ['voice'], right: 'The singer’s voice is the source. Everything after it carries its sound.' },
  { termId: 'microphone', ask: 'Tap the MICROPHONE — it turns sound into an audio signal.', targets: ['mic'], right: 'Sound goes in, an electrical signal comes out.' },
  { termId: 'cable', ask: 'Tap a CABLE — it carries the signal between devices.', targets: ['cableA', 'cableB'], right: 'Either cable is right: both carry the audio signal.' },
  { termId: 'output', ask: 'Tap an OUTPUT — a point where a signal LEAVES a device.', targets: ['mic.out', 'mixer.out'], right: 'Signal leaves through an output and heads down the cable.' },
  { termId: 'input', ask: 'Tap an INPUT — a point where a signal ENTERS a device.', targets: ['mixer.in', 'speaker.in'], right: 'Signal arrives at an input. Output → cable → input.' },
  { termId: 'speaker', ask: 'Tap the SPEAKER — it turns the audio signal back into sound.', targets: ['speaker'], right: 'The cone moves with the signal and makes sound again.' },
  { termId: 'listener', ask: 'Tap the LISTENER — who receives the sound.', targets: ['listener'], right: 'That’s you. The journey ends at your ears.' },
];

/** Readable name of a match target (the "not quite — that's the …" line). */
export function targetName(t: MatchTarget): string {
  switch (t) {
    case 'mic.out':
      return 'the microphone’s output';
    case 'mixer.in':
      return 'the mixer’s input';
    case 'mixer.out':
      return 'the mixer’s output';
    case 'speaker.in':
      return 'the speaker’s input';
    default:
      return `the ${stationById(t).name.split(' — ')[0].toLowerCase()}`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// "Your First Audio Signal" — the guided lab

export type FirstSource = 'tone' | 'voice';

export const FIRST_SOURCES: readonly { id: FirstSource; label: string; blurb: string }[] = [
  { id: 'tone', label: 'TEST TONE', blurb: 'A steady tone made by the app, played from a small speaker in front of the microphone — press PLAY to hear it. One clear pitch.' },
  { id: 'voice', label: 'YOUR VOICE', blurb: 'Hum or speak — you are the source. The displays show an example voice signal; the app does not record you.' },
];

/** Step 3: pull a plug and see what goes dark downstream. */
export type Unplug = 'none' | 'cableA' | 'cableB';
export const UNPLUG_OPTIONS: readonly { id: Unplug; label: string; blurb: string }[] = [
  { id: 'none', label: 'ALL CONNECTED', blurb: 'Every cable plugged in: the signal reaches the speaker and the listener hears it.' },
  { id: 'cableA', label: 'UNPLUG MIC CABLE', blurb: 'The mixer and the speaker both lose the signal — everything after the break loses it. The listener hears only the singer’s own, unamplified voice.' },
  { id: 'cableB', label: 'UNPLUG SPEAKER CABLE', blurb: 'The mixer still receives the mic, and its meters still move — but nothing reaches the speaker. The listener hears only the singer’s unamplified voice.' },
];

/** Step 5: reflect — tap to reveal. */
export const REFLECT_PROMPTS: readonly { q: string; a: string }[] = [
  { q: 'What vibrated first?', a: 'The source — your vocal cords, or the cone of the small speaker playing the test tone. Every sound starts with a vibration.' },
  { q: 'Where did sound become an audio signal?', a: 'At the microphone. From there to the speaker it travelled as an electrical signal, which you cannot hear. (A real tone generator usually skips the microphone and plugs straight into a mixer input — its tone starts life as a signal.)' },
  { q: 'Where did it become sound again?', a: 'At the speaker. Its cone moved with the signal and pushed the air, and the air carried it to your ears.' },
  { q: 'What did the meter tell you that your ears could not?', a: 'An exact number for the level at one point in the path. Your ears tell you how loud it seems — both are useful, and they are not the same thing.' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Sections and pages

export type PageId =
  | 'welcome'
  | 'l1-vibrate'
  | 'l1-words'
  | 'l2-path'
  | 'l2-sort'
  | 'l3-freq'
  | 'l3-amp'
  | 'l3-measured'
  | 'l4-parts'
  | 'l4-order'
  | 'l5-waveform'
  | 'l5-meter'
  | 'fs-make'
  | 'fs-capture'
  | 'fs-follow'
  | 'fs-change'
  | 'fs-listen'
  | 'l6-match'
  | 'l6-safe';

export type StartPage = {
  id: PageId;
  title: string;
  /** Rack page (a live display): the host gives it the full height. */
  rack: boolean;
  /** "What you are looking at" — the one line under the picture. */
  lead: string;
  /** The first move (rack pages): what to do with the controls. */
  caption?: string;
  paras: string[];
  /** Words this page introduces — tappable chips (in place, no navigation). */
  terms?: string[];
  check?: StartCheck;
};

export type SectionKind = 'welcome' | 'lesson' | 'lab' | 'review';

export type StartSection = {
  id: string;
  kind: SectionKind;
  /** Lesson number (1–6) for lessons. */
  num?: number;
  title: string;
  /** Short form for the one-line header kicker (fits a 375-wide phone). */
  short: string;
  /** One line for the overview list. */
  blurb: string;
  pages: StartPage[];
};

const TONE_NOTE =
  'The motion is a slowed-down model: a real speaker cone moves tens to thousands of times a second — far too fast to see.';

export const SECTIONS: readonly StartSection[] = [
  {
    id: 'welcome',
    kind: 'welcome',
    title: 'Welcome',
    short: 'Welcome',
    blurb: 'What this is and how it works.',
    pages: [
      {
        id: 'welcome',
        title: 'Welcome — start here',
        rack: false,
        lead: 'New to audio? This is the place to begin.',
        paras: [
          'In about 30 minutes — six short lessons, and you can stop whenever you like — you will learn the handful of ideas the rest of the app is built on: what sound is, how it becomes audio, what the equipment does, and how sound is measured and shown on a screen.',
          'You will not need any equipment. For the few sounds, use headphones if you can — phone speakers cannot play the lowest tones well. Turn your volume down before you press PLAY, then raise it slowly to a comfortable level.',
          'Nothing here is graded and nothing is locked. It is free for everyone, and you can jump ahead or go back whenever you like.',
        ],
      },
    ],
  },
  {
    id: 'l1',
    kind: 'lesson',
    num: 1,
    title: 'What Is Sound?',
    short: 'What is sound?',
    blurb: 'Sound begins with vibration and travels to your ears.',
    pages: [
      {
        id: 'l1-vibrate',
        title: 'Something vibrates',
        rack: true,
        lead: 'On the display: a loudspeaker (left), the air in front of it (right), and a graph of how tightly the air is squeezed — its pressure (bottom).',
        caption: 'Switch VIBRATION off, then on again. When the cone stops, the air goes still — no vibration, no sound.',
        paras: [
          'Every sound starts with something vibrating — moving back and forth, over and over. Here it is a speaker cone. It could just as well be a guitar string, a drum skin or your vocal cords.',
          'Each push of the cone squeezes the air in front of it together; each pull lets the air spread apart. That pattern of squeezes and stretches travels outward through the air. The air is the medium: the material the sound travels through.',
          'The air does not blow across the room. Each tiny bit of air only moves a little way back and forth and passes the push on to its neighbour — like a wave passing along a crowd.',
          'When the wave reaches you, it pushes your eardrum back and forth, and your brain hears sound.',
          TONE_NOTE,
        ],
        terms: ['sound', 'vibration', 'medium'],
        check: {
          question: 'What has to happen for any sound to start?',
          options: ['Something has to vibrate', 'Air has to blow out of the speaker like wind', 'A microphone has to be switched on'],
          correctIdx: 0,
          reveal: 'Right — every sound begins with a vibration. The air is not blown across the room; the vibration is passed along through it.',
          wrongHint: 'Watch the display with VIBRATION off: nothing moves, so there is no sound.',
        },
      },
      {
        id: 'l1-words',
        title: 'Source, medium, listener',
        rack: false,
        lead: 'Every sound has the same three parts. Tap any word for its meaning.',
        paras: [
          'SOURCE — the thing that vibrates and makes the sound: a voice, a guitar, a speaker.',
          'MEDIUM — what the sound travels through. Usually air, but sound also travels through water and through solid things like walls and floors. In empty space there is nothing to vibrate, so there is no sound.',
          'LISTENER — whoever, or whatever, receives the sound: your ears, or a microphone.',
          'Try it now: rest your fingertips on the front of your throat and hum. The buzz you feel is your vocal cords vibrating. You are the source.',
        ],
        terms: ['source', 'medium', 'listener', 'vibration'],
        check: {
          question: 'You hear a neighbour’s music through the wall. What is the medium?',
          options: ['The neighbour’s speaker', 'The air — and the wall itself', 'You'],
          correctIdx: 1,
          reveal: 'Yes — the speaker is the source, the air and the wall carry the vibration (both are media), and you are the listener.',
          wrongHint: 'The medium is what the sound travels THROUGH on its way to the listener.',
        },
      },
    ],
  },
  {
    id: 'l2',
    kind: 'lesson',
    num: 2,
    title: 'From Sound to Audio',
    short: 'Sound to audio',
    blurb: 'How a voice becomes a signal, and a signal becomes sound again.',
    pages: [
      {
        id: 'l2-path',
        title: 'Follow a voice',
        rack: true,
        lead: 'On the display: a simple sound system — voice, microphone, cable, mixer, cable, speaker, listener.',
        caption: 'Slide FOLLOW to walk the voice along the path one stop at a time. Watch the top of the display: SOUND or AUDIO SIGNAL.',
        paras: [
          'Sound is vibration moving through the air. Audio is that sound turned into a signal that equipment can carry, change, record or play back.',
          'Between the microphone and the speaker, the voice travels as an audio signal: an electrical copy of the sound’s vibration pattern. You cannot hear it until a speaker turns it back into sound.',
          'This is one simple path. Real systems often add more — several microphones, a separate amplifier, a recorder, wireless links — but the idea is always the same: sound in, signal through, sound out.',
        ],
        terms: ['audio', 'audioSignal', 'microphone', 'speaker'],
        check: {
          question: 'Between the microphone and the speaker, what travels through the cable?',
          options: ['An electrical audio signal', 'Sound waves, like in the air', 'Air pushed along by the microphone'],
          correctIdx: 0,
          reveal: 'Exactly — the cable carries an electrical copy of the sound. It only becomes sound again at the speaker.',
          wrongHint: 'Slide FOLLOW to the cable and read the top of the display.',
        },
      },
      {
        id: 'l2-sort',
        title: 'Sound or audio?',
        rack: false,
        lead: 'Practice: decide whether each one is plain sound, or audio.',
        paras: [
          'Remember the rule: vibration in the air is sound — even when a speaker made it. Once a microphone turns it into a signal that equipment carries, stores or changes, it is audio.',
        ],
        terms: ['sound', 'audio', 'recording', 'playback'],
      },
    ],
  },
  {
    id: 'l3',
    kind: 'lesson',
    num: 3,
    title: 'The Two Basic Parts of Sound',
    short: 'Two parts of sound',
    blurb: 'Frequency and pitch; amplitude and loudness.',
    pages: [
      {
        id: 'l3-freq',
        title: 'Frequency and pitch',
        rack: true,
        lead: 'On the display: the air between a vibrating source and your ear, and its pressure graph. Faster vibration packs the squeezes closer together.',
        caption: 'Slide FREQUENCY from low to high. Press PLAY to hear the pitch rise with it. (Phone speakers can’t play very low tones well — use headphones to hear the bottom of the slider.)',
        paras: [
          'Frequency is how many times a vibration repeats every second. It is measured in hertz (Hz): 220 Hz means 220 back-and-forth cycles every second.',
          'Pitch is how high or low a sound seems to you. A faster vibration — a higher frequency — is heard as a higher pitch.',
          'People hear from roughly 20 Hz, a deep rumble, up to about 20,000 Hz, a very high whistle. The top of that range drops as we get older.',
          'Frequency is something equipment can measure; pitch is what you hear. They are closely related, but they are not the same thing.',
          'The spacing and speed on the display are scaled down so you can see them.',
        ],
        terms: ['frequency', 'pitch', 'tone'],
        check: {
          question: 'You change a tone from 220 Hz to 880 Hz. What do you hear?',
          options: ['A higher pitch', 'The same pitch, only louder', 'A lower pitch'],
          correctIdx: 0,
          reveal: 'Higher frequency, higher pitch. It may also seem a little louder — your ears are more sensitive at 880 Hz than at 220 Hz — but the amplitude did not change. That is measured vs heard again.',
        },
      },
      {
        id: 'l3-amp',
        title: 'Amplitude and loudness',
        rack: true,
        lead: 'On the display: the speaker, the air and the pressure graph together. One slider changes the size of the vibration.',
        caption: 'Slide AMPLITUDE. The cone travels further, the air is squeezed harder and the graph grows taller — the pitch stays the same.',
        paras: [
          'Amplitude is the size of the vibration: how far the cone moves, and how strongly the air is squeezed and stretched.',
          'A bigger amplitude usually sounds louder. Loudness is how loud or quiet a sound seems to a listener.',
          'Notice what did NOT change: the vibration repeats just as often, so the frequency — and the pitch — stay the same.',
          TONE_NOTE,
        ],
        terms: ['amplitude', 'loudness'],
        check: {
          question: 'The cone moves further, but just as often as before. What changed?',
          options: ['The amplitude — it sounds louder', 'The frequency — it sounds higher', 'Nothing you could hear'],
          correctIdx: 0,
          reveal: 'Right: bigger movement is bigger amplitude, heard as louder. How often it moves is the frequency, and that stayed put.',
        },
      },
      {
        id: 'l3-measured',
        title: 'Measured or heard?',
        rack: false,
        lead: 'The one idea to carry through the whole app: what equipment measures and what you hear are related — but not identical.',
        paras: [
          'Your ears are not equally sensitive to every frequency — they are most sensitive around 2,000 to 5,000 Hz. Played with the same amplitude, a very low tone can seem much quieter than a tone in the middle of your hearing range. So a measurement tells you what the air or the signal is doing, and your ears tell you how it seems.',
          'Two more words you will meet everywhere: a TONE has a clear, steady pitch, like the test tones in this lesson. NOISE is irregular — hiss, wind, rain — with no clear pitch.',
        ],
        terms: ['tone', 'noise', 'frequency', 'pitch', 'amplitude', 'loudness'],
      },
    ],
  },
  {
    id: 'l4',
    kind: 'lesson',
    num: 4,
    title: 'What Audio Equipment Does',
    short: 'What equipment does',
    blurb: 'Microphones, cables, mixers and speakers — and their inputs and outputs.',
    pages: [
      {
        id: 'l4-parts',
        title: 'Tap each part',
        rack: true,
        lead: 'On the display: the same simple system. Tap any part on the display, or choose it with PART.',
        caption: 'Tap each part to read its job. Switch on IN / OUT to see where signals enter and leave each device.',
        paras: [
          'A microphone captures sound. Cables carry signals. A mixer receives signals, lets you control them and sends them on. Speakers turn signals back into sound.',
          'Inputs receive signals; outputs send them onward. In a simple path like this one, each cable connects one device’s OUTPUT to the next device’s INPUT. (Some links — network and USB cables, for example — carry signals both ways at once.)',
          'Real systems come in many shapes — a podcast might go mic → a small box that connects it to a computer → computer → headphones. The jobs stay the same.',
        ],
        terms: ['microphone', 'cable', 'input', 'output', 'speaker'],
        check: {
          question: 'A cable runs from the mixer to a speaker. Where does it plug in on the speaker?',
          options: ['The speaker’s input', 'The speaker’s output', 'The mixer’s output'],
          correctIdx: 0,
          reveal: 'Yes — the signal leaves the mixer’s OUTPUT and enters the speaker’s INPUT. Output to input.',
          wrongHint: 'Switch on IN / OUT and look at the speaker’s side of the cable.',
        },
      },
      {
        id: 'l4-order',
        title: 'The signal path',
        rack: false,
        lead: 'Practice: put the path in order, then meet two more words — recording and playback.',
        paras: [
          'The route a signal follows through the equipment is called the signal path. When something does not work, engineers follow the signal path from the source, one stop at a time, until they find where the signal stops.',
          'A recorder can sit on the signal path too. RECORDING captures the audio so it can be stored. PLAYBACK reproduces the stored audio later, through speakers or headphones — the song on your phone is a recording waiting for playback.',
        ],
        terms: ['signalPath', 'recording', 'playback', 'input', 'output'],
      },
    ],
  },
  {
    id: 'l5',
    kind: 'lesson',
    num: 5,
    title: 'Seeing and Measuring Sound',
    short: 'Seeing & measuring',
    blurb: 'The waveform, the meter and the decibel.',
    pages: [
      {
        id: 'l5-waveform',
        title: 'The waveform',
        rack: true,
        lead: 'On the display: a waveform — time runs left to right, and the height of the shape is the size of the signal at that moment.',
        caption: 'Pick a SIGNAL, then slide SIZE and watch the whole shape grow and shrink.',
        paras: [
          'A waveform is a picture of a signal over time. The further the shape swings above and below the centre line, the bigger the amplitude at that moment. How big a signal is overall is usually called its level.',
          'Speech comes in bursts — syllables with small gaps between them. A steady test tone makes an even band that never changes size.',
          'Recording and editing apps show a waveform like this on every track, so you can see where the loud and quiet moments are before you even press play.',
          'This display draws an example signal built into the app — it is not listening to a microphone.',
        ],
        terms: ['waveform', 'amplitude'],
        check: {
          question: 'On a waveform, what does a taller shape mean?',
          options: ['A bigger signal (more amplitude) at that moment', 'A higher pitch', 'A lower pitch'],
          correctIdx: 0,
          reveal: 'Right — height is amplitude. How often the signal repeats is its frequency (which you hear as pitch) — you mostly cannot see that at this zoom.',
        },
      },
      {
        id: 'l5-meter',
        title: 'The meter and the decibel',
        rack: true,
        lead: 'On the display: a level meter. The top of its scale, 0, is the most the signal can reach — so normal levels read as minus numbers, like −12.',
        caption: 'Switch SIGNAL between speech and the steady tone, and slide PEAK LEVEL. The bars rise with each loud moment and fall back — watch how differently they move.',
        paras: [
          'A meter shows a level that keeps changing. Levels are counted in decibels (dB). A decibel number always compares a level with a reference point.',
          'On this digital meter the reference is the top of the scale, 0 dB — the most the signal can reach. Normal levels are below it, so they read as minus numbers, like −18. (Engineers call this dBFS: decibels relative to full scale.)',
          'A digital signal cannot go above 0 dBFS. Push it past the top and the peaks are cut off — clipping — which sounds harsh and cannot be undone afterwards. Leave room below 0.',
          'Two handy rules: 6 dB more means about twice the signal’s amplitude, and about 10 dB more usually sounds roughly twice as loud.',
          'An SPL meter measures sound in the air instead, in dB SPL: there, 0 is about the quietest sound young ears can hear (at around 1,000 Hz), and bigger numbers are louder. A phone’s microphone is not a calibrated instrument — for real measurements such as safety limits or system tuning, use a calibrated sound level meter.',
          'A meter gives you useful information, but it does not replace listening. Speech and a steady tone can reach the same peak number and still sound different in loudness.',
        ],
        terms: ['meter', 'decibel', 'loudness'],
        check: {
          question: 'Two sounds reach the same peak number on the meter. Will they sound exactly as loud?',
          options: ['Not necessarily', 'Yes, always', 'Only if they are the same pitch'],
          correctIdx: 0,
          reveal: 'Right — a measurement and what you hear are not the same. The meter measures one thing about the signal; loudness depends on the whole sound, and on the listener.',
        },
      },
    ],
  },
  {
    id: 'lab',
    kind: 'lab',
    title: 'Your First Audio Signal',
    short: 'Your first audio signal',
    blurb: 'A guided lab: follow one sound from its source to your ears.',
    pages: [
      {
        id: 'fs-make',
        title: 'Step 1 · Make a sound',
        rack: true,
        lead: 'On the display: the source vibrating. Choose the sound you will follow through the next five steps.',
        caption: 'Pick a SOURCE. For the test tone, set its FREQUENCY and press PLAY. For your voice, just hum.',
        paras: [
          'Every audio signal starts as a sound. Choose one: the app’s test tone, or your own voice.',
          'If you choose your voice, hum or say a few words. The app does not record you — the displays in the next steps show an example voice signal so you can see what yours would look like.',
          'Whichever you pick, it is a vibration pushing on the air. That is where the journey starts.',
        ],
        terms: ['source', 'tone', 'vibration'],
      },
      {
        id: 'fs-capture',
        title: 'Step 2 · Capture it',
        rack: true,
        lead: 'On the display: sound travelling from the source to a microphone (top), and the electrical signal the microphone makes (bottom).',
        caption: 'Watch the two views move together: every squeeze and stretch in the air becomes a rise and fall in the signal. Tap FREEZE to stop the motion and compare them.',
        paras: [
          'A microphone has a very light part inside — the diaphragm — that the sound pushes back and forth. The mic turns that movement into an electrical signal with the same pattern.',
          'Same pattern, different form: in the air it is sound; out of the microphone it is an audio signal.',
          'Your phone has a microphone too. The app’s Waveform tool (below) draws what your phone’s mic hears, live — try humming into it.',
          'The motion is slowed down so you can see it.',
        ],
        terms: ['microphone', 'audioSignal'],
      },
      {
        id: 'fs-follow',
        title: 'Step 3 · Follow the signal',
        rack: true,
        lead: 'On the display: your signal on its way through the system. Lights show where the signal is getting through.',
        caption: 'Use PLUG to pull a cable out, and watch what goes dark after it. Then plug it back in.',
        paras: [
          'The signal leaves the microphone’s output, travels down a cable to the mixer’s input, leaves the mixer’s output and travels down another cable to the speaker’s input.',
          'Pull one cable and everything after the break loses the signal. Engineers use exactly this idea to find faults: follow the signal path from the source until the signal stops.',
          'No signal is not the same as no power: with a cable pulled, the mixer and the speaker are still switched on — only their signal lights go dark.',
          'In real life, mute the channel or turn the speaker down before you unplug or plug in a cable — a live connection can make a loud pop that damages speakers and hearing.',
        ],
        terms: ['cable', 'input', 'output', 'signalPath'],
        check: {
          question: 'The speaker cable is unplugged. Can the mixer’s meter still show your signal?',
          options: ['Yes — it still reaches the mixer', 'No — the whole system goes quiet', 'Only if the speaker is switched on'],
          correctIdx: 0,
          reveal: 'Right. Everything BEFORE the break still has the signal — the mixer’s meters still move. Only what comes after the break loses it.',
          wrongHint: 'Choose UNPLUG SPEAKER CABLE and look at the mixer’s light.',
        },
      },
      {
        id: 'fs-change',
        title: 'Step 4 · Change and measure it',
        rack: true,
        lead: 'On the display: your signal as the mixer sees it — its waveform (left) and its level meter (right).',
        caption: 'Slide the MIXER FADER. Watch the waveform and the meter respond together. With the test tone, press PLAY to hear it change.',
        paras: [
          'At the mixer you can change the signal. The simplest change is its level: how big the signal is when it leaves the mixer. On a fader, 0 dB means “unity” — no change — not the loudest setting.',
          'Turning the level up makes the waveform taller and the meter read higher. Turning it down does the opposite. The pitch does not change — only the size.',
          'This is also where engineers measure: the meter shows the level in decibels, so it can be set the same way every time.',
          'The waveform and meter here read an example signal built into the app, not a microphone.',
        ],
        terms: ['amplitude', 'waveform', 'meter', 'decibel'],
      },
      {
        id: 'fs-listen',
        title: 'Step 5 · Listen and reflect',
        rack: true,
        lead: 'On the display: the speaker turning your signal back into sound, and the sound travelling to your ear.',
        caption: 'With the test tone, press PLAY and listen at a comfortable, low volume. Then tap each question below to check your thinking.',
        paras: [
          'The speaker’s cone moves with the signal, pushes the air, and the air carries the sound to you. The journey is complete: sound → audio signal → sound.',
          'What you saw on the meter and what you heard are two views of the same signal. Use both.',
          TONE_NOTE,
        ],
        terms: ['speaker', 'listener', 'loudness'],
      },
    ],
  },
  {
    id: 'l6',
    kind: 'review',
    num: 6,
    title: 'Listen, Review, and Choose What’s Next',
    short: 'Review & what’s next',
    blurb: 'Match the words, listen safely, then pick where to go next.',
    pages: [
      {
        id: 'l6-match',
        title: 'Match the words to the path',
        rack: true,
        lead: 'On the display: the signal path one last time. Each word below belongs somewhere on it.',
        caption: 'Read the word under the display, then tap the matching part. Stuck? SKIP moves on — nothing is graded.',
        paras: [
          'Seven words, one picture. If you can place them all, you have the map the rest of the app is built on.',
        ],
      },
      {
        id: 'l6-safe',
        title: 'The big picture — and listening safely',
        rack: false,
        lead: 'The big picture in four lines: sound is vibration travelling through a medium. A microphone turns it into an audio signal. Equipment carries, changes, measures and records that signal. A speaker turns it back into sound for a listener.',
        paras: [
          'Before you go, one habit that protects everything else you will learn:',
          'Keep headphones and speakers at a comfortable level. If you have to raise your voice to talk over the sound, or your ears ring or feel dull afterwards, it was too loud.',
          'Loud sound can damage hearing permanently, and the damage adds up over time. Turn it down, take breaks, and use hearing protection around loud music and machinery.',
          'A rule of thumb technicians use: 85 dBA for 8 hours is a common workplace limit, and every 3 dB louder halves the safe time (the NIOSH guideline). Measure with a calibrated meter, not a phone.',
          'The free Pro Audio Safety topic, right next to this one on the Home screen, covers safe listening in depth.',
        ],
      },
    ],
  },
];

/** Every page in order, with its section. */
export const PAGES: readonly (StartPage & { sectionId: string })[] = SECTIONS.flatMap((s) =>
  s.pages.map((p) => ({ ...p, sectionId: s.id })),
);

/** Index of a page in PAGES (-1 if absent). */
export function pageIndex(id: PageId): number {
  return PAGES.findIndex((p) => p.id === id);
}

/** A section counts as done when every one of its pages is done. */
export function sectionDone(sectionId: string, completed: ReadonlySet<number>): boolean {
  const idxs = PAGES.flatMap((p, i) => (p.sectionId === sectionId ? [i] : []));
  return idxs.length > 0 && idxs.every((i) => completed.has(i));
}

/** First page of a section the learner has not finished (else its first page). */
export function firstOpenPage(sectionId: string, completed: ReadonlySet<number>): number {
  const idxs = PAGES.flatMap((p, i) => (p.sectionId === sectionId ? [i] : []));
  return idxs.find((i) => !completed.has(i)) ?? idxs[0] ?? 0;
}

/** Header kicker for a page: "LESSON 2 · FROM SOUND TO AUDIO" etc. */
export function kickerFor(sectionId: string): string {
  const s = SECTIONS.find((x) => x.id === sectionId);
  if (!s) return START_HERE_SHORT.toUpperCase();
  if (s.kind === 'lesson' || s.kind === 'review') return `LESSON ${s.num} OF 6 · ${s.short.toUpperCase()}`;
  if (s.kind === 'lab') return `THE LAB · ${s.short.toUpperCase()}`;
  return START_HERE_SHORT.toUpperCase();
}

// ─────────────────────────────────────────────────────────────────────────────
// Choose what's next

/**
 * How a destination is reached. `free` opens for everyone. `preview` is a
 * members-only lab: a free learner lands in the lab's own free preview with
 * the upgrade sheet over it (withMembershipPreview), never a dead end.
 * `tutorial` is a tool's guided tutorial — members-only; a free learner sees
 * what it covers and the upgrade path (ToolLearnScreen's lock card).
 */
export type NextAccess = 'free' | 'preview' | 'tutorial';

export type NextDestination =
  | { kind: 'route'; route: string; params?: Record<string, unknown> }
  | { kind: 'glossary' };

export type NextStep = {
  id: string;
  /** The one recommended first move (shown on its own above the groups). */
  best?: boolean;
  /** Uses the phone's microphone (said on the card). */
  mic?: boolean;
  title: string;
  blurb: string;
  access: NextAccess;
  to: NextDestination;
};

export const NEXT_STEPS: readonly { want: string; steps: readonly NextStep[] }[] = [
  {
    want: 'How sound works',
    steps: [
      { id: 'wave', title: 'Wave Physics Lab', blurb: 'Curious how sound moves around a room? See it bounce, soak in and add up.', access: 'free', to: { kind: 'route', route: 'WaveLab' } },
      { id: 'foundations', best: true, title: 'Foundations of Sound', blurb: 'The full picture of sound itself — air, waves, frequency and amplitude — one visual step at a time.', access: 'free', to: { kind: 'route', route: 'FoundationsCourse' } },
    ],
  },
  {
    want: 'How sound level is measured',
    steps: [
      { id: 'spl', mic: true, title: 'SPL Meter', blurb: 'Measure the sound level around you with your phone’s microphone (for learning — a phone is not a calibrated measuring instrument).', access: 'free', to: { kind: 'route', route: 'SplMeter' } },
      { id: 'splTutorial', title: 'SPL Meter tutorial', blurb: 'A guided lesson in reading an SPL meter properly.', access: 'tutorial', to: { kind: 'route', route: 'ToolLearn', params: { toolKey: 'spl' } } },
    ],
  },
  {
    want: 'How sound looks on a graph',
    steps: [
      { id: 'waveform', mic: true, title: 'Waveform', blurb: 'See your own voice as a waveform, live.', access: 'free', to: { kind: 'route', route: 'WaveformLive' } },
      { id: 'rta', mic: true, title: 'Spectrum analyser (RTA)', blurb: 'See which frequencies are in a sound, low to high, live.', access: 'free', to: { kind: 'route', route: 'Rta' } },
    ],
  },
  {
    want: 'Audio vocabulary',
    steps: [{ id: 'glossary', title: 'Glossary', blurb: 'Look up any audio word — thousands of entries, in plain English.', access: 'free', to: { kind: 'glossary' } }],
  },
  {
    want: 'How audio systems connect',
    steps: [
      { id: 'soundSystems', title: 'Sound Systems Lab', blurb: 'Build, wire and run a complete live sound system, from an empty room to a working show.', access: 'preview', to: { kind: 'route', route: 'SoundSystemsLab' } },
    ],
  },
];

export const NEXT_HANDOFF = 'You’ve got the starting points. Choose what you’re curious about next.';

/** The access tag printed on a destination card. */
export function accessTag(a: NextAccess): string {
  switch (a) {
    case 'free':
      return 'FREE';
    case 'preview':
      return 'MEMBERS · FREE LOOK INSIDE';
    case 'tutorial':
      return 'MEMBERS';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Word practice (session only — nothing is stored)

export type QuizItem = { termId: string; def: string; options: string[]; correctIdx: number };

/** A small seeded shuffle, so a round is stable while it is on screen. */
function seeded(seed: number): () => number {
  let s = (Math.floor(seed) % 2147483647) || 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function shuffle<T>(xs: readonly T[], rnd: () => number): T[] {
  const a = xs.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * "Which word matches this meaning?" — `count` questions from `group` (or all
 * groups), each with four different words: the answer plus three from the
 * same group where possible, so the choice is about meaning, not topic.
 */
export function buildQuiz(seed: number, count = 8, group?: TermGroupId): QuizItem[] {
  const rnd = seeded(seed);
  const pool = STARTER_TERMS.filter((t) => !group || t.group === group);
  return shuffle(pool, rnd)
    .slice(0, Math.min(count, pool.length))
    .map((t) => {
      const same = STARTER_TERMS.filter((o) => o.id !== t.id && o.group === t.group && o.term !== t.term);
      const other = STARTER_TERMS.filter((o) => o.id !== t.id && o.group !== t.group);
      const distract = [...shuffle(same, rnd), ...shuffle(other, rnd)].slice(0, 3).map((o) => o.term);
      const options = shuffle([t.term, ...distract], rnd);
      return { termId: t.id, def: t.def, options, correctIdx: options.indexOf(t.term) };
    });
}
