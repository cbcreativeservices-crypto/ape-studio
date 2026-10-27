/**
 * labKeyCatalog — turns a training-lab SERVER KEY (tr_ / mk_ / mxb_ / mxa_ /
 * ear_, see src/features/lab/trainingLabKeys.ts) back into what a person sees:
 * a human name, an area, and the catalog route that opens it.
 *
 * Used by the Lab Requirements sheet (labRequirementList.ts) to resolve a
 * credential requirement to its catalog leaf, and by
 * scripts/gen-lab-cert-seed.mjs to write the server `labs` rows. Node-loadable
 * (only `.ts` imports of node-safe modules) so the generator and the ratchet
 * test can run it without the app.
 */
import { EAR_MODULE_IDS, MIXING_ADV_PAGE_IDS, MIXING_BEG_PAGE_IDS, TRAINING_LABS } from '../features/lab/trainingLabKeys.ts';
import { LESSONS, labMeta, lessonMeta } from '../screens/lab/miking/data/registry.ts';

export type LabArea = 'training' | 'miking' | 'mixing' | 'ear';

export type LabKeyInfo = {
  key: string;
  /** Learner-facing name, e.g. "Miking: Kick Drum". */
  name: string;
  area: LabArea;
  /** The catalog route of the lab that holds it. */
  route: string;
  /** Route params where the catalog leaf carries them (a Miking family tile). */
  params?: { lab: string };
};

/** Whole training labs — names as the labs menu shows them (shortened). */
export const TRAINING_LAB_NAMES: Readonly<Record<string, string>> = {
  tr_mastering: 'Mastering Lab',
  tr_drum_tuning: 'Drum Tuning Lab',
  tr_tuning: 'Tuning & Temperament Lab',
  tr_sound_systems: 'Sound Systems Lab',
  tr_dj: 'DJ Systems Lab',
  tr_eq: 'EQ Lab',
  tr_preprod: 'Audio Pre-Production',
  tr_postprod: 'Audio Post-Production',
  tr_compression: 'Compression Lab',
  tr_gate: 'Gate / Expander Lab',
  tr_limiter: 'Limiter Lab',
  tr_smart_processors: 'Smart Processors Lab',
  tr_delay: 'Delay Lab',
  tr_reverb: 'Reverb Lab',
  tr_chorus: 'Chorus Lab',
  tr_flanger: 'Flanger Lab',
  tr_phaser: 'Phaser Lab',
  tr_distortion: 'Distortion Lab',
  tr_phase: 'Phase Lab',
  tr_oscillator: 'Oscillators Lab',
  tr_noise: 'Noise Lab',
  tr_harmonic: 'Harmonics Lab',
  tr_fm: 'FM Synthesis Lab',
  tr_modular: 'Modular Synth Lab',
  tr_envelope: 'Sound Envelope & Transients Lab',
  tr_stereo: 'Stereo Imaging Lab',
  tr_binaural: 'Binaural Panner',
  tr_autotune: 'Autotune Lab',
  tr_cymatics: 'Cymatics Lab',
  tr_harmonograph: 'Harmonograph',
  tr_bass: 'Bass Guitar Physics',
  tr_mic_select: 'Microphone Selection Lab',
  tr_speech: 'Speech & Voice Lab',
  tr_tube: 'Vacuum Tube Fundamentals',
  tr_amp: 'Amplifier Principles Lab',
};

/** Mixing page titles, by page id — the `title` each page carries in
 *  src/screens/lab/mixing/pages*.tsx (a ratchet test keeps them equal). */
export const MIXING_PAGE_TITLES: Readonly<Record<'beg' | 'adv', Readonly<Record<string, string>>>> = {
  beg: {
    mix: 'What Mixing Does',
    prep: 'Prepare the Session',
    flow: 'Basic Signal Flow',
    gain: 'Gain Staging',
    static: 'Build a Static Mix',
    subtract: 'Subtractive Mixing',
    pan: 'Panning & Stereo Placement',
    eq: 'Basic EQ in Context',
    comp: 'Basic Compression',
    space: 'Reverb & Delay',
    terms: 'The Six Routing Terms',
    sends: 'Pre/Post & the Double Route',
    auto: 'Basic Automation',
    finish: 'Check & Finish',
    export: 'Basic Export',
    final: 'The Final Mix',
  },
  adv: {
    gate: 'Before You Begin',
    plan: 'Advanced Mix Planning',
    session: 'Complex Session Management',
    groups: 'Groups, Subgroups & VCAs',
    aux: 'Advanced Auxiliary Routing',
    parallel: 'Parallel & Multibus Mixing',
    adv_eq: 'Advanced EQ & Masking',
    adv_dyn: 'Advanced Dynamics',
    phase: 'Phase, Polarity & Alignment',
    depth: 'Advanced Depth & Space',
    drive: 'Harmonic Processing',
    width: 'Stereo Imaging',
    motion: 'Advanced Automation',
    bus: 'Mix-Bus Processing',
    qc: 'Translation & Quality Control',
    stems: 'Stems & Alternate Mixes',
    null: 'Stem Reconstruction',
    deliver: 'Professional Delivery',
    diagnose: 'Mix Diagnosis',
    final: 'The Final Repair',
  },
};

/** Ear Training module titles, by module id (the modules' own `title`). */
export const EAR_MODULE_TITLES: Readonly<Record<string, string>> = {
  frequency: 'Frequency Recognition',
  eq: 'EQ Recognition',
  band: 'Band Identification',
  noise: 'Noise & Waveform ID',
  defect: 'Audio Defect Recognition',
  stereo: 'Stereo Recognition',
  loudness: 'Loudness Recognition',
  delay: 'Delay Recognition',
  reverb: 'Reverb Recognition',
  compression: 'Compression Recognition',
  pitch: 'Pitch Recognition',
  polarity: 'Polarity & Phase',
  comb: 'Comb Filtering',
  clipping: 'Clipping Recognition',
};

/** Resolve a server key, or null for a key that is not a known lab/lesson. */
export function describeLabKey(key: string): LabKeyInfo | null {
  if (key.startsWith('tr_')) {
    const lab = TRAINING_LABS.find((l) => l.key === key);
    const name = TRAINING_LAB_NAMES[key];
    return lab && name ? { key, name, area: 'training', route: lab.route } : null;
  }
  if (key.startsWith('mk_')) {
    const lesson = lessonMeta(key.slice(3));
    if (!lesson || !labMeta(lesson.labId)) return null;
    return { key, name: `Miking: ${lesson.title}`, area: 'miking', route: 'MikingHub', params: { lab: lesson.labId } };
  }
  if (key.startsWith('mxb_') || key.startsWith('mxa_')) {
    const lab = key.startsWith('mxb_') ? 'beg' : 'adv';
    const id = key.slice(4);
    const ids: readonly string[] = lab === 'beg' ? MIXING_BEG_PAGE_IDS : MIXING_ADV_PAGE_IDS;
    const title = MIXING_PAGE_TITLES[lab][id];
    if (!ids.includes(id) || !title) return null;
    return lab === 'beg'
      ? { key, name: `Beginning Mixing: ${title}`, area: 'mixing', route: 'BeginningMixingLab' }
      : { key, name: `Advanced Mixing: ${title}`, area: 'mixing', route: 'AdvancedMixingLab' };
  }
  if (key.startsWith('ear_')) {
    const id = key.slice(4);
    const title = EAR_MODULE_TITLES[id];
    if (!(EAR_MODULE_IDS as readonly string[]).includes(id) || !title) return null;
    return { key, name: `Ear Training: ${title}`, area: 'ear', route: 'EarTrainingLab' };
  }
  return null;
}

/**
 * EVERY key the app can report (2026-10-13 handoff review). The server must
 * hold a `labs` row for each — not only the ones a credential requires today —
 * or `mark_lab_complete` answers lab_not_found and the device retries that
 * completion at every launch for ever.
 */
export function allLabKeys(): LabKeyInfo[] {
  const keys = [
    ...TRAINING_LABS.map((l) => l.key),
    ...LESSONS.map((l) => `mk_${l.id}`),
    ...MIXING_BEG_PAGE_IDS.map((id) => `mxb_${id}`),
    ...MIXING_ADV_PAGE_IDS.map((id) => `mxa_${id}`),
    ...EAR_MODULE_IDS.map((id) => `ear_${id}`),
  ];
  return keys.map((k) => {
    const info = describeLabKey(k);
    if (!info) throw new Error(`allLabKeys: ${k} has no catalog entry`);
    return info;
  });
}
