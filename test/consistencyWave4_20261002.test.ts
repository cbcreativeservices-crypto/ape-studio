/**
 * Pattern hunt WAVE 4 — consistency + learning outcomes (owner 2026-10-02:
 * "favor consistency and learning outcomes"). Receipts for five items:
 *
 *  1. SEE WHAT'S LEFT on every module-lab hub — the ratchet lives in
 *     test/labNavLaw.test.ts ("every module-lab hub has the SEE WHAT'S LEFT
 *     link"); here, a pin that each of the five new hubs reads the SAME
 *     progress source as its own module host's FINISH.
 *  2. Hearing exposure: `doseUnreadable` is said inline on the screen.
 *  3. Career rows: a PE licence / graduate degree is disclosed on the
 *     COLLAPSED row (educationChip), not only after expanding.
 *  4. TopicDetailModal: "Added to My Enrollments" comes from the enrollment
 *     store's write result (G7) — addTopic answers Promise<boolean>.
 *  5. Stale comments (SmartProcessors header, RootNavigator Drum Tuning).
 *
 * R2: the behavioural tests (3, 4) were run against copies of educationNote.ts
 * and enrollmentStore.ts from before this change and FAILED (no educationChip
 * export; addTopic answered undefined, never false).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = (p: string) => readFileSync(join(ROOT, 'src', p), 'utf8').replace(/\r\n/g, '\n');
const code = (p: string) =>
  src(p)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

/* ── fake storage for the enrollment store (localStoreMigration idiom) ── */
const g = globalThis as Record<string, unknown>;
const AS = new Map<string, string>();
g.__W4_AS__ = AS;
g.__W4_FAIL_WRITES__ = false;
const FAKE_AS =
  'data:text/javascript,' +
  encodeURIComponent(
    `const s = globalThis.__W4_AS__;
     export default {
       async getItem(k) { return s.has(k) ? s.get(k) : null; },
       async setItem(k, v) { if (globalThis.__W4_FAIL_WRITES__) throw new Error('disk full'); s.set(k, v); },
       async removeItem(k) { s.delete(k); },
       async getAllKeys() { return [...s.keys()]; },
     };`,
  );
const SUPABASE_STUB =
  'data:text/javascript,' +
  encodeURIComponent(`export const supabase = {
    auth: { async getSession() { return { data: { session: null } }; } },
    async rpc() { return { data: null, error: null }; },
    from() { throw new Error('no table reads in this test'); },
  };`);
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: FAKE_AS, shortCircuit: true };
    if (specifier.endsWith('lib/supabase')) return { url: SUPABASE_STUB, shortCircuit: true };
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const enrollment = await import('../src/features/enrollment/enrollmentStore.ts');
const edu = await import('../src/features/careerfinder/educationNote.ts');

/* ───────────────────────── 1. hub end screens ───────────────────────── */

test('1 · each new hub end screen reads the same progress its module host FINISH reads', () => {
  const pairs: [string, string, RegExp][] = [
    ['screens/lab/digital/DigitalLabHomeScreen.tsx', 'screens/lab/digital/DigitalModuleScreen.tsx', /useLabClearedUnits\('af_digital_audio'\)/],
    ['screens/lab/gain/GainLabHomeScreen.tsx', 'screens/lab/gain/GainModuleScreen.tsx', /useLabClearedUnits\('af_gain_staging'\)/],
    ['screens/lab/wave/WaveLabHomeScreen.tsx', 'screens/lab/wave/WaveModuleScreen.tsx', /useLabClearedUnits\('af_wave_physics'\)/],
    ['screens/lab/eq/EqLabHomeScreen.tsx', 'screens/lab/eq/EqModuleScreen.tsx', /useLabVisits\('eq'\)/],
    ['screens/lab/cymatics/CymaticsHomeScreen.tsx', 'screens/lab/cymatics/CymaticsModuleScreen.tsx', /useLabVisits\('cymatics'\)/],
  ];
  for (const [hub, host, source] of pairs) {
    const h = code(hub);
    const m = code(host);
    assert.match(h, source, `${hub} reads its progress from the same store as ${host}`);
    assert.match(m, source, `${host} changed its progress source — re-check ${hub}`);
    const mode = (s: string) => /<LabEndScreen[\s\S]*?mode="(credit|progress)"/.exec(s)?.[1];
    assert.equal(mode(h), mode(m), `${hub}: same end-screen mode as its module host`);
    assert.match(h, /onDone=\{\(\) => (navigation\.goBack\(\)|safeGoBack\(navigation\))\}/, `${hub}: DONE leaves the lab`);
  }
});

/* ───────────────────────── 1b. the Amp hub (the seventh) ───────────────────────── */

const ampEnd = await import('../src/features/amp/ampEnd.ts');
const AMP_BUILT = [
  { id: 'devices' as const, title: 'One' },
  { id: 'bias' as const, title: 'Two' },
  { id: 'apply' as const, title: 'Eight' },
];

test('1b · ampEndModel: modules + the final as a check; the BEST final keeps its credit', () => {
  const none = ampEnd.ampEndModel({ modules: {} }, AMP_BUILT);
  assert.deepEqual(none.units.map((u) => u.id), ['devices', 'bias', 'apply', 'final']);
  assert.equal(none.units[3].kind, 'check');
  assert.equal(none.units[3].detail, 'In Module 8 — not yet submitted');
  assert.equal(none.cleared.size, 0);

  // A weaker latest retake never un-passes the final (credit is never removed).
  const s = ampEnd.ampEndModel(
    {
      modules: { devices: { visited: true, done: true, checks: {} }, bias: { visited: true, done: false, checks: {} } },
      final: { scorePct: 40, passed: false, at: 2 },
      bestFinal: { scorePct: 86.4, passed: true, at: 1 },
    },
    AMP_BUILT,
  );
  assert.deepEqual([...s.cleared].sort(), ['devices', 'final']);
  assert.equal(s.units[3].detail, 'Best so far: 86% — passed');
});

test('1b · Amp hub: SEE WHAT’S LEFT shows the FINISH list — same read, same builder, same mode, fenced', () => {
  const h = code('screens/lab/amp/AmpLabHomeScreen.tsx');
  const m = code('screens/lab/amp/AmpModuleScreen.tsx');
  // Same builder and source on both sides.
  assert.match(m, /const \{ units: endUnits, cleared \} = ampEndModel\(endState, built\);/);
  assert.match(m, /void updateAmpProgress\(\(\) => \{\}\)\.then\(\(s\) => \{\s*if \(my === endReq\.current\) setEndState\(s\);/);
  assert.match(h, /const endModel = ampEndModel\(progress \?\? \{ modules: \{\} \}, built\);/);
  assert.match(h, /units=\{endModel\.units\}\s*cleared=\{endModel\.cleared\}/);
  const mode = (s: string) => /<LabEndScreen[\s\S]*?mode="(credit|progress)"/.exec(s)?.[1];
  assert.equal(mode(h), 'progress');
  assert.equal(mode(h), mode(m));
  // The link: the same component + words as every other hub.
  assert.match(h, /<LabEndLink label="SEE WHAT’S LEFT ›" onPress=\{\(\) => setEnding\(true\)\} \/>/);
  // Async safety: the end screen appears only after the queued read lands,
  // fenced by a generation counter and an unmount flag; waits for the tier.
  const fn = h.slice(h.indexOf('const setEnding = useCallback('), h.indexOf('const open = '));
  assert.ok(fn.indexOf('if (!resolved) return;') > 0 && fn.indexOf('if (!resolved) return;') < fn.indexOf('updateAmpProgress'));
  assert.match(fn, /void updateAmpProgress\(\(\) => \{\}\)\.then\(\(s\) => \{\s*if \(!mounted\.current \|\| my !== endReq\.current\) return;\s*setProgress\(s\);\s*setEndingRaw\(true\);/);
  assert.match(h, /return \(\) => \{\s*mounted\.current = false;\s*endReq\.current\+\+;\s*\};/);
  // Leaving the end screen (a jump / PRACTISE AGAIN) bumps the fence first.
  assert.match(h, /const open = \(id: AmpModuleId\) => \{\s*setEnding\(false\);\s*navigation\.navigate\('AmpModule', \{ id \}\);/);
  // PRACTISE AGAIN reopens Module 1 and clears nothing; DONE leaves through safeGoBack.
  assert.match(h, /onPracticeAgain=\{\(\) => open\(built\[0\]\?\.id \?\? AMP_MODULES\[0\]\.id\)\}/);
  assert.match(h, /onJump=\{\(id\) => open\(id === 'final' \? 'apply' : \(id as AmpModuleId\)\)\}/);
  assert.match(h, /onDone=\{\(\) => safeGoBack\(navigation\)\}/);
  assert.doesNotMatch(h, /navigation\.goBack\(/);
});

/* ───────────────────────── 2. exposure monitor ───────────────────────── */

test('2 · the exposure screen says an unreadable earlier dose inline, in the notice style', () => {
  const s = code('screens/tools/ExposureMonitorScreen.tsx');
  assert.match(
    s,
    /\{snap\.doseUnreadable \? \(\s*<Text style=\{styles\.note\}>\s*Earlier listening from today could not be read on this device, so the dose shown may be lower than it\s+really is\.\s*<\/Text>\s*\) : null\}/,
  );
  // Inline only: the screen opens no popup for it (Low-Light — nothing auto-appears).
  const at = s.indexOf('snap.doseUnreadable');
  assert.ok(!/notify\(|confirmDialog\(|<Modal/.test(s.slice(at - 400, at + 400)), 'no popup around the notice');
});

/* ───────────────────────── 3. career education chip ───────────────────────── */

test('3 · educationChip: PE LICENSE / DEGREE REQ. on the collapsed row; LICENSED titles keep their own chip', () => {
  assert.equal(edu.educationChip({ regulated: false, professionalEngineer: true, preparation: "Bachelor's degree common" }), 'PE LICENSE');
  assert.equal(edu.educationChip({ regulated: false, professionalEngineer: false, preparation: "Bachelor's to doctorate, depending on research responsibility" }), 'DEGREE REQ.');
  assert.equal(edu.educationChip({ regulated: false, professionalEngineer: false, preparation: 'Graduate degree commonly expected' }), 'DEGREE REQ.');
  assert.equal(edu.educationChip({ regulated: true, professionalEngineer: true, preparation: "Master's" }), null, 'LICENSED already shows');
  assert.equal(edu.educationChip({ regulated: false, professionalEngineer: false, preparation: 'Portfolio, credits, craft training' }), null);
  // The chip is exactly the expanded row's disclosure, never a different rule.
  const cases = [
    { regulated: false, professionalEngineer: true, preparation: 'x' },
    { regulated: false, professionalEngineer: false, preparation: "Master's in library science" },
    { regulated: false, professionalEngineer: false, preparation: 'Varies' },
    { regulated: true, professionalEngineer: false, preparation: 'Law degree' },
  ];
  for (const c of cases) assert.equal(edu.educationChip(c) != null, edu.furtherEducation(c) != null);

  const row = code('screens/careerfinder/CareerFamilyScreen.tsx');
  assert.match(row, /const edu = educationChip\(c\);/);
  assert.match(row, /\{edu \? <View style=\{styles\.lic\}><Text style=\{styles\.licText\}>\{edu\}<\/Text><\/View> : null\}/, 'same style as LICENSED');
  assert.match(row, /edu === 'PE LICENSE' \? ', Professional Engineer licence commonly required' : edu \? ', degree required' : ''/, 'screen readers hear it too');
});

/* ───────────────────────── 4. enrollment claim (G7) ───────────────────────── */

const settle = async () => {
  for (let i = 0; i < 40; i++) await Promise.resolve();
  await new Promise<void>((r) => setImmediate(r));
  for (let i = 0; i < 40; i++) await Promise.resolve();
};

test('4 · addTopic answers the write result: false when the device refused the list, true when it took it', async () => {
  AS.clear();
  AS.set('ape:enrollmentList', JSON.stringify([{ gs: 3060, favorite: false, active: true }]));
  AS.set('ape:enrollmentSeeded5', '1');
  enrollment.resetLocal();
  enrollment.getEnrollment();
  await settle();

  g.__W4_FAIL_WRITES__ = true;
  const refused = await enrollment.addTopic(4200);
  assert.equal(refused, false, 'a refused write must answer false');
  assert.ok(enrollment.isEnrolled(4200), 'the tap still shows for this session');

  g.__W4_FAIL_WRITES__ = false;
  const ok = await enrollment.addTopic(4300);
  assert.equal(ok, true);
  assert.ok((JSON.parse(AS.get('ape:enrollmentList') ?? '[]') as { gs: number }[]).some((e) => e.gs === 4300));
  enrollment.resetLocal();
});

test('4 · TopicDetailModal says "Added" only from the write result', () => {
  const m = code('screens/curriculum/TopicDetailModal.tsx');
  assert.match(m, /onEnrollTopic\?: \(gs: number\) => void \| Promise<boolean>;/);
  assert.match(m, /if \(topic\) enrollTapped\(topic\.gs\);/, 'the box goes through the write-result path');
  assert.match(m, /\(ok\) => \{\s*if \(my !== writeTap\.current\) return;\s*setWriteState\(\(m\) => \(ok \? withoutGs\(m, gs\) : \{ \.\.\.m, \[gs\]: 'failed' \}\)\);/);
  // The claim branches: pending and failed come BEFORE either "Added" / "Saved" text.
  const claim = m.slice(m.indexOf("enrolled && topicWrite === 'pending'"));
  assert.ok(claim.indexOf("topicWrite === 'failed'") < claim.indexOf("'Added to My Enrollments'"));
  assert.ok(claim.indexOf("topicWrite === 'failed'") < claim.indexOf("'Saved to your list"));
  const cur = code('screens/curriculum/CurriculumScreen.tsx');
  assert.match(cur, /if \(!enrolledGs\.has\(gs\)\) return addTopic\(gs\);/, 'the parent hands the write result back');
});

/* ───────────────────────── 5. stale comments ───────────────────────── */

test('5 · stale comments corrected', () => {
  const sp = src('screens/lab/deesser/SmartProcessorsLabScreen.tsx');
  const head = sp.slice(0, sp.indexOf('*/'));
  assert.ok(!/are listed\s+\* as planned rows/.test(head), 'the header no longer claims planned rows are listed');
  assert.match(head, /planned\s+\* rows were removed on 2026-09-17/);
  const nav = src('navigation/RootNavigator.tsx');
  assert.match(nav, /Drum Tuning Lab \(2026-10-01\): members-only via its catalog leaf in the\n\s*\/\/ Pitch & Tuning category/);
  const cat = src('screens/lab/labCatalog.ts');
  const pitch = cat.indexOf("name: 'Pitch & Tuning'");
  const drum = cat.indexOf("route: 'DrumTuningLab'");
  assert.ok(pitch > 0 && drum > pitch, 'Drum Tuning sits in the Pitch & Tuning category');
});
