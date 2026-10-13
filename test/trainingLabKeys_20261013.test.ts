/**
 * Training-lab server keys (owner 2026-10-13: training labs count toward
 * certificates; required labs unlock the Final Exam on the server).
 *
 * Ratchets on src/features/lab/trainingLabKeys.ts:
 *   • every key is unique and has its family's shape;
 *   • IMMUTABILITY: the keys are rows in the server `labs` table — the
 *     snapshot below may only GROW (a rename = every learner loses credit);
 *   • the Mixing page ids are the pages' own short labels, in page order, one
 *     per page (read out of the page files);
 *   • the Ear module ids are the module registry's, and the required level is
 *     reachable in every module (below the shortest ladder);
 *   • every Miking lesson in the registry has a valid mk_ key;
 *   • every 'understanding' lab maps to the labId its screen actually passes.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const K = await import('../src/features/lab/trainingLabKeys.ts');
const { LESSONS } = await import('../src/screens/lab/miking/data/registry.ts');

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');

const allKeys = (): string[] => [
  ...K.TRAINING_LABS.map((l) => l.key),
  ...LESSONS.map((l) => K.mikingLessonKey(l.id)),
  ...K.MIXING_BEG_PAGE_IDS.map((p) => K.mixingPageKey('beg', p)),
  ...K.MIXING_ADV_PAGE_IDS.map((p) => K.mixingPageKey('adv', p)),
  ...K.EAR_MODULE_IDS.map((m) => K.earModuleKey(m)),
];

describe('trainingLabKeys — the permanent server keys', () => {
  it('every key is unique and is a training key', () => {
    const keys = allKeys();
    assert.equal(new Set(keys).size, keys.length, 'duplicate key');
    for (const k of keys) assert.ok(K.isTrainingKey(k), `${k} must be a training key`);
  });

  it('every key has its family shape', () => {
    const SHAPE = /^(tr_[a-z0-9_]+|mk_[A-Za-z0-9]+|mxb_[a-z0-9_]+|mxa_[a-z0-9_]+|ear_[a-z]+)$/;
    for (const k of allKeys()) assert.match(k, SHAPE, k);
    // Server-side the keys live in a text column; keep them short.
    for (const k of allKeys()) assert.ok(k.length <= 40, k);
  });

  it('non-keys are refused (af_* labs, labIds, junk)', () => {
    for (const k of ['af_cables', 'sound-systems-learn', 'envelope', 'tr_nope', 'mxb_nope', 'ear_nope', 'mk_', 'mk_A-1', '']) {
      assert.equal(K.isTrainingKey(k), false, k);
    }
  });

  it('IMMUTABLE: every key snapshotted 2026-10-13 is still present, unchanged (the list may only grow)', () => {
    const SNAPSHOT_TR = [
      'tr_mastering', 'tr_drum_tuning', 'tr_tuning', 'tr_sound_systems', 'tr_eq', 'tr_preprod', 'tr_postprod',
      'tr_compression', 'tr_gate', 'tr_limiter', 'tr_smart_processors', 'tr_delay', 'tr_reverb', 'tr_chorus',
      'tr_flanger', 'tr_phaser', 'tr_distortion', 'tr_phase', 'tr_oscillator', 'tr_noise', 'tr_harmonic', 'tr_fm',
      'tr_modular', 'tr_envelope', 'tr_stereo', 'tr_binaural', 'tr_autotune', 'tr_cymatics', 'tr_harmonograph',
      'tr_bass', 'tr_mic_select', 'tr_speech', 'tr_tube', 'tr_amp',
    ];
    const SNAPSHOT_MXB = ['mix', 'prep', 'flow', 'gain', 'static', 'subtract', 'pan', 'eq', 'comp', 'space', 'terms', 'sends', 'auto', 'finish', 'export', 'final'];
    const SNAPSHOT_MXA = ['gate', 'plan', 'session', 'groups', 'aux', 'parallel', 'adv_eq', 'adv_dyn', 'phase', 'depth', 'drive', 'width', 'motion', 'bus', 'qc', 'stems', 'null', 'deliver', 'diagnose', 'final'];
    const SNAPSHOT_EAR = ['frequency', 'eq', 'band', 'noise', 'defect', 'stereo', 'loudness', 'delay', 'reverb', 'compression', 'pitch', 'polarity', 'comb', 'clipping'];
    const keys = new Set(allKeys());
    for (const k of SNAPSHOT_TR) assert.ok(keys.has(k), `tr key removed/renamed: ${k}`);
    // Mixing pages are keyed by POSITION too (mixingPageKeyAt): the snapshot
    // must stay a prefix, in order.
    assert.deepEqual([...K.MIXING_BEG_PAGE_IDS].slice(0, SNAPSHOT_MXB.length), SNAPSHOT_MXB);
    assert.deepEqual([...K.MIXING_ADV_PAGE_IDS].slice(0, SNAPSHOT_MXA.length), SNAPSHOT_MXA);
    for (const e of SNAPSHOT_EAR) assert.ok(keys.has(`ear_${e}`), `ear key removed/renamed: ear_${e}`);
    // Miking: every lesson snapshotted 2026-10-13 (128) keeps its key.
    const mk = [...keys].filter((k) => k.startsWith('mk_'));
    assert.ok(mk.length >= 128, `Miking lessons: ${mk.length}`);
    for (const id of ['M01', 'C05A', 'C06a', 'I01e', 'A09b', 'E16', 'F16', 'B17', 'SPK']) assert.ok(keys.has(`mk_${id}`), `mk_${id}`);
  });

  it('counts per family (2026-10-13)', () => {
    const keys = allKeys();
    const count = (p: string) => keys.filter((k) => k.startsWith(p)).length;
    assert.equal(count('tr_'), 34);
    assert.equal(count('mxb_'), 16);
    assert.equal(count('mxa_'), 20);
    assert.equal(count('ear_'), 14);
    assert.equal(count('mk_'), LESSONS.length);
  });
});

describe('Mixing page ids = the pages, in order', () => {
  /** The `short:` labels of a PAGES array, in file order. */
  const shorts = (files: string[]) =>
    files.flatMap((f) => [...read(`src/screens/lab/mixing/${f}.tsx`).matchAll(/\bshort: '([^']+)'/g)].map((m) => m[1]));
  const idOf = (short: string) => short.toLowerCase().replace(/ /g, '_');

  it('Beginning: one id per page, from its short label', () => {
    // The screen's PAGES concat order.
    assert.match(read('src/screens/lab/mixing/BeginningMixingLabScreen.tsx'), /const PAGES = \[\.\.\.MIXING_PAGES_A, \.\.\.MIXING_PAGES_B, \.\.\.MIXING_PAGES_C, \.\.\.MIXING_PAGES_D\];/);
    const s = shorts(['pagesA', 'pagesB', 'pagesC', 'pagesD']);
    assert.equal(s.length, K.MIXING_BEG_PAGE_IDS.length, 'Beginning Mixing page count changed — add the new page id to MIXING_BEG_PAGE_IDS');
    assert.deepEqual(s.map(idOf), [...K.MIXING_BEG_PAGE_IDS]);
  });

  it('Advanced: one id per page, from its short label', () => {
    assert.match(read('src/screens/lab/mixing/AdvancedMixingLabScreen.tsx'), /const PAGES = \[\.\.\.MIXING_ADV_PAGES_A, \.\.\.MIXING_ADV_PAGES_B, \.\.\.MIXING_ADV_PAGES_C, \.\.\.MIXING_ADV_PAGES_D\];/);
    const s = shorts(['pagesAdvA', 'pagesAdvB', 'pagesAdvC', 'pagesAdvD']);
    assert.equal(s.length, K.MIXING_ADV_PAGE_IDS.length, 'Advanced Mixing page count changed — add the new page id to MIXING_ADV_PAGE_IDS');
    assert.deepEqual(s.map(idOf), [...K.MIXING_ADV_PAGE_IDS]);
  });

  it('mixingPageKeyAt: by index; past the end (the check page) is no key', () => {
    assert.equal(K.mixingPageKeyAt('beg', 0), 'mxb_mix');
    assert.equal(K.mixingPageKeyAt('adv', 6), 'mxa_adv_eq');
    assert.equal(K.mixingPageKeyAt('beg', 16), '');
    assert.equal(K.mixingPageKeyAt('adv', 20), '');
  });
});

describe('Ear Training modules and the required level', () => {
  it('EAR_MODULE_IDS = the EarModuleId union, in order', () => {
    const src = read('src/features/ear/earTypes.ts');
    const union = /export type EarModuleId =([^;]+);/.exec(src)![1];
    const ids = [...union.matchAll(/'([a-z]+)'/g)].map((m) => m[1]);
    assert.deepEqual([...K.EAR_MODULE_IDS], ids);
  });

  it('REQUIRED_EAR_LEVEL is reachable below the top of EVERY ladder (shortest is 3)', () => {
    const levels = ['defects', 'dynamics', 'pitch', 'spatial', 'time', 'tone'].flatMap((f) =>
      [...read(`src/features/ear/modules/${f}.ts`).matchAll(/\blevels: (\d+),/g)].map((m) => Number(m[1])),
    );
    assert.equal(levels.length, 14);
    assert.ok(K.REQUIRED_EAR_LEVEL >= 1);
    assert.ok(K.REQUIRED_EAR_LEVEL < Math.min(...levels), `shortest ladder ${Math.min(...levels)}`);
  });
});

describe('training labs ↔ screens', () => {
  const NAV = read('src/navigation/RootNavigator.tsx');
  /** The file a route's lazy screen requires. */
  const screenFile = (route: string): string => {
    const m = new RegExp(`^\\s*${route}: lazyScreen\\(.*?require\\('\\.\\./(screens/[^']+)'\\)`, 'm').exec(NAV);
    assert.ok(m, `no lazy screen for ${route}`);
    return `src/${m[1]}.tsx`;
  };

  it('every TRAINING_LABS route is a real screen', () => {
    for (const l of K.TRAINING_LABS) assert.match(NAV, new RegExp(`\\b${l.route}\\b`), l.route);
  });

  it("every 'understanding' lab has a labId, and its screen passes exactly that labId", () => {
    for (const l of K.TRAINING_LABS.filter((x) => x.completion === 'understanding')) {
      const labId = K.UNDERSTANDING_LAB_IDS[l.route];
      assert.ok(labId, `${l.route}: no labId in UNDERSTANDING_LAB_IDS`);
      const src = read(screenFile(l.route));
      const passes = src.includes(`labId="${labId}"`) || src.includes(`labId: '${labId}'`);
      assert.ok(passes, `${l.route} (${screenFile(l.route)}) never passes labId ${labId}`);
      assert.equal(K.trainingKeyForCheck(labId), l.key, `${labId} → ${l.key}`);
    }
  });

  it('the screens that are not LabShell / PagedLab render the check (LabUnderstandingBlock)', () => {
    for (const route of ['SmartProcessorsLab', 'CymaticsLab', 'MicSelectLab', 'TubeLab', 'AmpLab', 'EqLabHome']) {
      const src = read(screenFile(route));
      assert.ok(src.includes(`<LabUnderstandingBlock labId="${K.UNDERSTANDING_LAB_IDS[route]}"`), route);
    }
  });

  it("Sound Systems' LEARN check is one part of an all-modules lab: it completes no tr_ key by itself", () => {
    assert.equal(K.trainingKeyForCheck('sound-systems-learn'), '');
    assert.equal(K.trainingLabByRoute('SoundSystemsLab')?.completion, 'all-modules');
  });

  it("EQ completes by its understanding check (the EQ Lab banks no module credit — visits only)", () => {
    assert.equal(K.trainingLabByRoute('EqLabHome')?.completion, 'understanding');
    assert.match(read('src/screens/lab/eq/EqLabHomeScreen.tsx'), /useLabVisits\('eq'\)/);
  });
});
