/**
 * MADE-UP students for the instructor view's dev sample (sampleClass.ts).
 * Required only behind `sampleClassOn()`, so a release build never loads it.
 * The shapes are the SERVER's (snake_case), so the sample runs through the
 * same parsing as a live answer. Topic and lab names are the Academy's real
 * catalog; every person, score and date is invented.
 */
import { SAMPLE_SHARE } from './sampleClass';

const DAY = 24 * 60 * 60 * 1000;
const ago = (days: number, hours = 0) => new Date(Date.now() - days * DAY - hours * 3600 * 1000).toISOString();

const METHODS = [
  ['flashcards', 'Flashcards'],
  ['fill_in_blank', 'Fill-in-Blank'],
  ['matching', 'Matching'],
  ['scenarios', 'Scenarios'],
] as const;

const methods = (pcts: [number, number, number, number], lastDays: number) =>
  METHODS.map(([key, name], i) => ({
    key,
    name,
    completion_pct: pcts[i],
    last_studied: pcts[i] > 0 ? ago(lastDays + i) : null,
  }));

const avg = (p: number[]) => Math.round(p.reduce((a, b) => a + b, 0) / p.length);

function topic(
  id: string,
  name: string,
  subject: string,
  opts: {
    complete?: number;
    pcts: [number, number, number, number];
    best?: number | null;
    attempts?: { score: number; practice?: boolean; days: number }[];
    lastDays?: number;
  },
) {
  return {
    topic_id: `00000000-0000-4000-8000-00000000${id}`,
    name,
    field: 'Acoustics & Measurement',
    subject,
    status: opts.complete != null ? 'complete' : 'in_progress',
    completed_at: opts.complete != null ? ago(opts.complete) : null,
    best_score: opts.best ?? null,
    study_pct: avg(opts.pcts),
    methods: methods(opts.pcts, opts.lastDays ?? 1),
    quiz_attempts: (opts.attempts ?? []).map((a, i) => ({
      number: i + 1,
      score: a.score,
      practice: a.practice === true,
      submitted_at: ago(a.days),
    })),
  };
}

const AF = [
  'Understanding Level & Amplitude',
  'Foundations of Sound',
  'Sound Playground',
  'Microphone Principles',
  'Wave Physics Laboratory',
  'Speaker Placement & Coverage',
  'Signal Chain Builder',
  'Cable & Connector Fundamentals',
  'Gain Staging',
];

function labs(doneAf: number[], extra: { name: string; area: string; days: number | null }[]) {
  return [
    ...AF.map((name, i) => ({
      name,
      area: 'audio_fundamentals',
      completed_at: doneAf.includes(i) ? ago(30 - i * 3) : null,
    })),
    ...extra.map((l) => ({ name: l.name, area: l.area, completed_at: l.days == null ? null : ago(l.days) })),
  ];
}

export const SAMPLE_CLASS_ROWS = [
  {
    share_id: SAMPLE_SHARE.maya,
    student_name: 'Maya Okafor',
    granted_at: ago(12),
    topics_started: 5,
    topics_complete: 2,
    labs_complete: 7,
    labs_total: 14,
    last_activity: ago(0, 2),
  },
  {
    share_id: SAMPLE_SHARE.dev,
    student_name: 'Dev Ramanathan',
    granted_at: ago(20),
    topics_started: 3,
    topics_complete: 1,
    labs_complete: 4,
    labs_total: 12,
    last_activity: ago(4),
  },
  {
    share_id: SAMPLE_SHARE.rosa,
    student_name: 'Rosa Villanueva',
    granted_at: ago(41),
    topics_started: 6,
    topics_complete: 6,
    labs_complete: 15,
    labs_total: 15,
    last_activity: ago(19),
  },
  {
    share_id: SAMPLE_SHARE.jonah,
    student_name: 'Jonah B.',
    granted_at: ago(0, 5),
    topics_started: 1,
    topics_complete: 0,
    labs_complete: 0,
    labs_total: 9,
    last_activity: null,
  },
];

const MAYA = {
  student: { name: 'Maya Okafor', shared_since: ago(12) },
  topics: [
    topic('e301', 'Levels, Metering & Reference Standards', 'Measurement & Analysis', {
      complete: 9,
      pcts: [100, 100, 100, 100],
      best: 29,
      attempts: [
        { score: 21, practice: true, days: 13 },
        { score: 26, days: 11 },
        { score: 29, days: 9 },
      ],
      lastDays: 9,
    }),
    topic('e302', 'Acoustic Principles & Room Behavior', 'Acoustics & Room Behavior', {
      // Completed BEFORE she shared: still shown (owner 2026-10-26).
      complete: 34,
      pcts: [100, 100, 100, 100],
      best: 28,
      attempts: [{ score: 28, days: 34 }],
      lastDays: 34,
    }),
    topic('e303', 'Frequency & Spectrum Analysis', 'Measurement & Analysis', {
      pcts: [100, 85, 60, 25],
      best: 24,
      attempts: [
        { score: 18, practice: true, days: 3 },
        { score: 24, days: 1 },
      ],
      lastDays: 0,
    }),
    topic('e304', 'Test & Measurement Instruments', 'Measurement & Analysis', {
      pcts: [40, 10, 0, 0],
      lastDays: 2,
    }),
    topic('e305', 'Room Treatment Layout & Application', 'Acoustics & Room Behavior', { pcts: [0, 0, 0, 0] }),
  ],
  labs: {
    complete: 7,
    total: 14,
    list: labs(
      [0, 1, 2, 3, 4, 7],
      [
        { name: 'Phase Lab', area: 'training', days: 6 },
        { name: 'Noise Lab', area: 'training', days: null },
        { name: 'Ear Training: Frequency Recognition', area: 'ear', days: null },
        { name: 'Ear Training: Comb Filtering', area: 'ear', days: null },
        { name: 'Sound Systems Lab', area: 'training', days: null },
      ],
    ),
    other_completed: [
      { name: 'Miking: Acoustic Guitar', area: 'miking', completed_at: ago(15) },
      { name: 'Beginning Mixing: Basic Signal Flow', area: 'mixing', completed_at: ago(8) },
    ],
  },
  final_exams: [
    { number: 1, score: 41, out_of: 50, passed: false, submitted_at: ago(7) },
    { number: 2, score: 46, out_of: 50, passed: true, submitted_at: ago(5) },
  ],
  credentials: [{ type: 'certificate', name: 'Audio Measurement & Analysis', earned_at: ago(5) }],
};

const JONAH = {
  student: { name: 'Jonah B.', shared_since: ago(0, 5) },
  topics: [topic('e306', 'Acoustic & Room Measurement Methods', 'Measurement & Analysis', { pcts: [0, 0, 0, 0] })],
  labs: { complete: 0, total: 9, list: labs([], []), other_completed: [] },
  final_exams: [],
  credentials: [],
};

const DEV = { ...MAYA, student: { name: 'Dev Ramanathan', shared_since: ago(20) } };
const ROSA = { ...MAYA, student: { name: 'Rosa Villanueva', shared_since: ago(41) } };

export const SAMPLE_PROGRESS: Record<string, unknown> = {
  [SAMPLE_SHARE.maya]: MAYA,
  [SAMPLE_SHARE.dev]: DEV,
  [SAMPLE_SHARE.rosa]: ROSA,
  [SAMPLE_SHARE.jonah]: JONAH,
};

export const SAMPLE_CODE = 'K7RM4QX2';
