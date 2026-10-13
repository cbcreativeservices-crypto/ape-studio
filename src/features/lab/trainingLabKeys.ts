/**
 * trainingLabKeys — the PERMANENT server keys for training labs and lessons
 * that certificates can require (owner 2026-10-13: "tie the labs into the
 * certificates"). Ships with the post-approval OTA; the backend half (labs
 * rows + credential_lab_requirements + the start_final_exam gate) is Comp A's
 * handoff: Downloads\2026-10-13_COMP_A_LAB_CERT_REQUIREMENTS_HANDOFF.md.
 *
 * ⛔ IMMUTABLE once live — each key is a row in the server `labs` table and
 * keys `student_lab_progress`. Rename = every learner loses that credit.
 *
 * Owner rulings 2026-10-13:
 *   • Required labs UNLOCK THE FINAL EXAM (server-checked, like topics).
 *   • Certificates already earned are untouched (start_final_exam refuses an
 *     earned award before any check, so nothing is re-judged).
 *   • Miking and Mixing are required LESSON BY LESSON (only the relevant ones),
 *     not whole labs.
 *   • Practice labs with no lessons complete by passing a short UNDERSTANDING
 *     CHECK (src/features/lab/understanding.ts).
 *   • Ear Training: a set level in the modules a credential needs.
 *     Pre/Post-Production: every stage of one project complete.
 *     Cymatics: an understanding check. Mixing Guides: not required (hidden
 *     in store builds); Calculator Lab: not required (a tool, not lessons).
 *
 * Key shapes:
 *   tr_<lab>            a whole training lab
 *   mk_<lessonId>       one Miking lesson (lessonId exactly as the miking
 *                       registry spells it — case matters: mk_C05A, mk_C06a)
 *   mxb_<page>          one Beginning Mixing page   (mxa_ = Advanced)
 *   ear_<module>        one Ear Training module at the required level
 */

/** How a whole training lab is completed on the device. */
export type TrainingCompletion =
  | 'all-modules' // every module/chapter/page of the lab banked (lab's own store)
  | 'understanding' // passing the lab's understanding check
  | 'project'; // one production project with every stage complete

export type TrainingLab = { route: string; key: string; completion: TrainingCompletion };

/** Whole training labs a credential can require, by catalog route. */
export const TRAINING_LABS: readonly TrainingLab[] = [
  // Labs with real lessons — complete when every lesson is banked.
  { route: 'MasteringLab', key: 'tr_mastering', completion: 'all-modules' },
  { route: 'DrumTuningLab', key: 'tr_drum_tuning', completion: 'all-modules' },
  { route: 'TuningLab', key: 'tr_tuning', completion: 'all-modules' },
  // Sound Systems: the hub's own "SOUND SYSTEMS LAB — COMPLETE" rule —
  // every LEARN page, every BUILD capstone, every ROUTE and OPERATE exercise,
  // every TROUBLESHOOT fault, AND the LEARN understanding check
  // (features/soundsystems/labComplete.ts, shared by the hub and the backfill).
  { route: 'SoundSystemsLab', key: 'tr_sound_systems', completion: 'all-modules' },
  // EQ (2026-10-13): the EQ Lab banks NO per-module credit — its modules are
  // only VISITED (labVisits 'eq', "progress, never credit"), and opening a
  // screen must never earn a certificate. So it completes like the practice
  // labs: by passing its understanding check (labId 'eq', rendered on the EQ
  // Lab home and in the EqLab FX screen, which shares the id).
  { route: 'EqLabHome', key: 'tr_eq', completion: 'understanding' },
  // Production labs — one finished project.
  { route: 'PreProdLab', key: 'tr_preprod', completion: 'project' },
  { route: 'PostProdLab', key: 'tr_postprod', completion: 'project' },
  // Practice labs — the understanding check.
  { route: 'CompressionLab', key: 'tr_compression', completion: 'understanding' },
  { route: 'GateLab', key: 'tr_gate', completion: 'understanding' },
  { route: 'LimiterLab', key: 'tr_limiter', completion: 'understanding' },
  { route: 'SmartProcessorsLab', key: 'tr_smart_processors', completion: 'understanding' },
  { route: 'DelayLab', key: 'tr_delay', completion: 'understanding' },
  { route: 'ReverbLab', key: 'tr_reverb', completion: 'understanding' },
  { route: 'ChorusLab', key: 'tr_chorus', completion: 'understanding' },
  { route: 'FlangerLab', key: 'tr_flanger', completion: 'understanding' },
  { route: 'PhaserLab', key: 'tr_phaser', completion: 'understanding' },
  { route: 'DistortionLab', key: 'tr_distortion', completion: 'understanding' },
  { route: 'PhaseLab', key: 'tr_phase', completion: 'understanding' },
  { route: 'OscillatorLab', key: 'tr_oscillator', completion: 'understanding' },
  { route: 'NoiseLab', key: 'tr_noise', completion: 'understanding' },
  { route: 'HarmonicLab', key: 'tr_harmonic', completion: 'understanding' },
  { route: 'FmLab', key: 'tr_fm', completion: 'understanding' },
  { route: 'ModularLab', key: 'tr_modular', completion: 'understanding' },
  { route: 'EnvelopeLab', key: 'tr_envelope', completion: 'understanding' },
  { route: 'StereoLab', key: 'tr_stereo', completion: 'understanding' },
  { route: 'BinauralLab', key: 'tr_binaural', completion: 'understanding' },
  { route: 'AutotuneLab', key: 'tr_autotune', completion: 'understanding' },
  { route: 'CymaticsLab', key: 'tr_cymatics', completion: 'understanding' },
  { route: 'HarmonographLab', key: 'tr_harmonograph', completion: 'understanding' },
  { route: 'BassLab', key: 'tr_bass', completion: 'understanding' },
  { route: 'MicSelectLab', key: 'tr_mic_select', completion: 'understanding' },
  { route: 'SpeechLab', key: 'tr_speech', completion: 'understanding' },
  { route: 'TubeLab', key: 'tr_tube', completion: 'understanding' },
  { route: 'AmpLab', key: 'tr_amp', completion: 'understanding' },
];

export function trainingLabByRoute(route: string): TrainingLab | undefined {
  return TRAINING_LABS.find((l) => l.route === route);
}

/** One Miking lesson's server key. */
export const mikingLessonKey = (lessonId: string): string => `mk_${lessonId}`;
/** One Beginning / Advanced Mixing page's server key (page = the page's short id). */
export const mixingPageKey = (lab: 'beg' | 'adv', page: string): string => `${lab === 'beg' ? 'mxb' : 'mxa'}_${page}`;
/** One Ear Training module's server key. */
export const earModuleKey = (moduleId: string): string => `ear_${moduleId}`;

/** A whole training lab's key by route ('' for a route that is not one —
 *  every reporting path ignores a key that is not a training key). */
export function trainingKeyFor(route: string): string {
  return trainingLabByRoute(route)?.key ?? '';
}

/* ── Mixing pages (owner 2026-10-13: Mixing is required PAGE BY PAGE) ─────────
 * The PagedLab pages carry no id of their own — only their index and a short
 * label. These are the STABLE ids, in page order: the page's short label,
 * lowercase, spaces → underscore. ⛔ Each becomes a server key (mxb_/mxa_), so
 * an id is never renamed; a page added later gets a new id at its position and
 * test/trainingLabKeys_20261013 (which reads the labels out of the page files)
 * fails until this list is updated. */
export const MIXING_BEG_PAGE_IDS = [
  'mix', 'prep', 'flow', 'gain', 'static', 'subtract', 'pan', 'eq',
  'comp', 'space', 'terms', 'sends', 'auto', 'finish', 'export', 'final',
] as const;
export const MIXING_ADV_PAGE_IDS = [
  'gate', 'plan', 'session', 'groups', 'aux', 'parallel', 'adv_eq', 'adv_dyn', 'phase', 'depth',
  'drive', 'width', 'motion', 'bus', 'qc', 'stems', 'null', 'deliver', 'diagnose', 'final',
] as const;

/** The server key for a Mixing page by its INDEX in the lab's page array
 *  ('' past the end — e.g. the appended understanding-check page). */
export function mixingPageKeyAt(lab: 'beg' | 'adv', index: number): string {
  const ids: readonly string[] = lab === 'beg' ? MIXING_BEG_PAGE_IDS : MIXING_ADV_PAGE_IDS;
  const id = ids[index];
  return id ? mixingPageKey(lab, id) : '';
}

/* ── Ear Training ────────────────────────────────────────────────────────────
 * The 14 modules (features/ear/earTypes EarModuleId — a ratchet test keeps this
 * list equal to the registry). */
export const EAR_MODULE_IDS = [
  'frequency', 'eq', 'band', 'noise', 'defect', 'stereo', 'loudness',
  'delay', 'reverb', 'compression', 'pitch', 'polarity', 'comb', 'clipping',
] as const;

/**
 * The level a module must reach to count: its `mastered` level (earProgress —
 * the highest level ever cleared at ≥ 80 % over a full 20-trial window, and it
 * only ever grows) must be at least this.
 *
 * WHY 2: the shortest ladders have 3 levels (time.ts / tone.ts), the longest 5.
 * Level 1 alone is the warm-up every module opens on; clearing level 2 at 80 %
 * over twenty trials is a real, repeatable discrimination in every module, and
 * it leaves the top of every ladder as stretch rather than a gate. `mastered`
 * (not the current `level`) is used because the current level steps DOWN on a
 * bad run, and credit is never removed.
 */
export const REQUIRED_EAR_LEVEL = 2;

/* ── Understanding-check labs: route → the labId the screen passes ────────────
 * UNDERSTANDING_CHECKS (understanding.ts) is keyed by this labId, so a check
 * authored under it is rendered by that screen and completes that route's
 * tr_ key. Verified 2026-10-13 against each screen:
 *   LabShell via FxLabScreen (fxLabConfigs labId), LabShell direct, PagedLab,
 *   and the bespoke screens that render <LabUnderstandingBlock labId=…/>. */
export const UNDERSTANDING_LAB_IDS: Readonly<Record<string, string>> = {
  // FxLabScreen → LabShell (fxLabConfigs.tsx)
  CompressionLab: 'compression',
  GateLab: 'gate',
  LimiterLab: 'limiter',
  DelayLab: 'delay',
  ReverbLab: 'reverb',
  ChorusLab: 'chorus',
  FlangerLab: 'flanger',
  PhaserLab: 'phaser',
  DistortionLab: 'distortion',
  PhaseLab: 'phase',
  StereoLab: 'stereo',
  // LabShell direct
  OscillatorLab: 'oscillator',
  NoiseLab: 'noise',
  HarmonicLab: 'harmonic',
  FmLab: 'fm',
  ModularLab: 'modular',
  BinauralLab: 'binaural',
  AutotuneLab: 'autotune',
  HarmonographLab: 'harmonograph',
  BassLab: 'bass',
  // kit/PagedLab
  EnvelopeLab: 'envelope',
  SpeechLab: 'speech',
  // Bespoke screens — <LabUnderstandingBlock labId=… /> at the end of the screen
  SmartProcessorsLab: 'smart-processors',
  CymaticsLab: 'cymatics',
  MicSelectLab: 'micselect',
  TubeLab: 'tube',
  AmpLab: 'amp',
  EqLabHome: 'eq',
};

/** The tr_ key a passed understanding check under `labId` completes, or ''
 *  when that check does not complete a whole training lab (e.g. Sound
 *  Systems' LEARN check is one part of an all-modules lab). */
export function trainingKeyForCheck(labId: string): string {
  for (const [route, id] of Object.entries(UNDERSTANDING_LAB_IDS)) {
    if (id !== labId) continue;
    const lab = trainingLabByRoute(route);
    if (lab && lab.completion === 'understanding') return lab.key;
  }
  return '';
}

/* ── Validation ───────────────────────────────────────────────────────────── */
const TR_KEYS = new Set(TRAINING_LABS.map((l) => l.key));
const MX_KEYS = new Set<string>([...MIXING_BEG_PAGE_IDS.map((p) => mixingPageKey('beg', p)), ...MIXING_ADV_PAGE_IDS.map((p) => mixingPageKey('adv', p))]);
const EAR_KEYS = new Set<string>(EAR_MODULE_IDS.map(earModuleKey));
/** Miking lesson ids are the registry's (letters/digits, case kept). */
const MK_SHAPE = /^mk_[A-Za-z0-9]+$/;

/** Is this one of the keys a training lab or lesson reports to the server?
 *  tr_/mxb_/mxa_/ear_ must be in the lists above; mk_ by shape (the lesson
 *  registry is the list — test/trainingLabKeys_20261013 pins every lesson). */
export function isTrainingKey(key: string): boolean {
  return TR_KEYS.has(key) || MX_KEYS.has(key) || EAR_KEYS.has(key) || MK_SHAPE.test(key);
}
