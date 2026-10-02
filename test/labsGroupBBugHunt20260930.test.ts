/**
 * Labs group B — "toddler + cat" bug hunt of 2026-09-30. Pure-module tests
 * where the fix is logic (production store, packet author), source guards
 * where it is a screen (each pins the SHAPE of one fix; the reasoning lives in
 * the comment beside it in the source).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
      const index = new URL(specifier + '/index.ts', context.parentURL);
      if (existsSync(fileURLToPath(index))) return { url: index.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

const { createProjectStore, memoryStore, newProject } = await import('../src/features/production/projectStore.ts');
const { docControl } = await import('../src/features/production/packet.ts');
const { valueKey } = await import('../src/features/production/types.ts');
const { readProject } = await import('../src/features/production/readiness.ts');
const { PREPROD_STAGES } = await import('../src/features/production/preprod/index.ts');

// ── production ──────────────────────────────────────────────────────────────

test('production store: a read queued behind keystroke writes sees them (no stale copy to save back)', async () => {
  const store = createProjectStore(memoryStore());
  const p = newProject('preprod', 'music', 'Plan');
  assert.equal(await store.upsert(p), true);
  // Fire writes WITHOUT awaiting, then read — as the lab home's focus reload does.
  const w1 = store.setValue('preprod', p.id, 'define', 'purpose', 'a');
  const w2 = store.setValue('preprod', p.id, 'define', 'purpose', 'ab');
  const listed = store.load('preprod');
  const got = store.get('preprod', p.id);
  await Promise.all([w1, w2]);
  assert.equal((await listed)[0].values[valueKey('define', 'purpose')], 'ab');
  assert.equal((await got)?.values[valueKey('define', 'purpose')], 'ab');
});

test('production packet: Post-Production is prepared by its supervisor; an empty lead is Unattributed', () => {
  const report = readProject(PREPROD_STAGES, newProject('preprod', 'music', 'x'));
  const post = { ...newProject('postprod', 'music', 'Cut'), values: { [valueKey('brief', 'supervisor')]: '  Dana  ' } };
  assert.equal(docControl(post, report).author, 'Dana');
  const pre = { ...newProject('preprod', 'music', 'Plan'), values: { [valueKey('define', 'project_lead')]: '' } };
  assert.equal(docControl(pre, report).author, 'Unattributed');
});

test('production screens: START AGAIN confirms; SHARE is single-flight; rename commits once; keyboard offset 0', () => {
  const act = read('src/screens/lab/production/ProductionActivityScreen.tsx');
  assert.match(act, /confirmDialog\(\s*'Start this exercise again\?'/);
  assert.doesNotMatch(act, /onPress=\{\(\) => void restart\(\)\}/);
  assert.match(act, /PATHWAY_LABEL\[project\?\.pathway \?\? pathway\]/);
  const lab = read('src/screens/lab/production/ProductionLabScreen.tsx');
  assert.match(lab, /if \(!project \|\| !report \|\| sharingRef\.current\) return;/);
  assert.doesNotMatch(lab, /onSubmitEditing=\{commitName\}/);
  const stage = read('src/screens/lab/production/ProductionStageScreen.tsx');
  assert.match(stage, /keyboardVerticalOffset=\{0\}/);
  assert.match(read('src/features/production/labs.ts'), /LABS\[lab\]\?\.stages\.find/);
});

// ── double-tap ▶ in the generator labs ──────────────────────────────────────

for (const f of ['OscillatorLabScreen', 'NoiseLabScreen', 'BinauralLabScreen', 'FxLabScreen', 'ModularLabScreen', 'SignalChainLabScreen']) {
  test(`${f}: a superseded start stops only when nothing newer wants the sound`, () => {
    const s = read(`src/screens/lab/${f}.tsx`);
    assert.match(s, /const wantRef = useRef\(false\);/);
    assert.match(s, /\+\+genRef\.current;\n\s*wantRef\.current = true;/);
    assert.match(s, /genRef\.current\+\+;\n\s*wantRef\.current = false;/);
    // The fence's stop (startFenced, 2026-10-02) declines only for a
    // superseded start that something newer still wants.
    assert.match(s, /why === 'superseded' && wantRef\.current(\) return;| \? undefined : ApeDsp\.(gen|bin|mod)Stop\(\))/);
    assert.doesNotMatch(s, /if \(gen !== genRef\.current \|\| !isAudioOutputEnabled\(\)\)/);
    assert.doesNotMatch(s, /stop: \(\) => ApeDsp\.(gen|bin|mod)Stop\(\)/, 'a superseded start must not stop unconditionally');
  });
}

test('LabShell: ▶ backup timer dies with the next touch; LAB NOTES stay mounted collapsed', () => {
  const s = read('src/screens/lab/LabShell.tsx');
  const burst = s.slice(s.indexOf('const burst = '));
  assert.match(burst.slice(0, 200), /if \(backupRef\.current\) \{\n\s*clearTimeout\(backupRef\.current\);/);
  assert.match(s, /backupRef\.current = setTimeout\(/);
  assert.match(s, /<CollapsibleSection title="LAB NOTES" keepMounted>/);
  assert.match(s, /sectionBodyCollapsed: \{ height: 0, overflow: 'hidden' \}/);
});

test('FM legend reserves two lines; Noise chart labels ≥ 9 pt on a short phone', () => {
  assert.match(read('src/screens/lab/FmLabScreen.tsx'), /const LEGEND_H = 30;/);
  const n = read('src/screens/lab/NoiseLabScreen.tsx');
  assert.doesNotMatch(n, /fontSize=\{8\}/);
});

// ── credit and navigation ───────────────────────────────────────────────────

test('amp: RESET is a practice reset (done + best final kept); unanswered checks never block NEXT', () => {
  const p = read('src/features/amp/ampProgress.ts');
  const reset = p.slice(p.indexOf('export function resetAmpProgress'));
  assert.doesNotMatch(reset, /removeItem/);
  assert.match(reset, /done: !!s\.modules\[id\]\?\.done/);
  assert.doesNotMatch(reset, /bestFinal = undefined/);
  const m = read('src/screens/lab/amp/AmpModuleScreen.tsx');
  // Shared lab navigation (2026-09-30): SKIP AHEAD is gone — the strip's NEXT
  // past the last step moves on with checks still open, and banks the module
  // first when they are all answered. The credit button is disabled until
  // then; the way forward never is.
  assert.match(m, /<LabNavBar nav=\{nav\} \/>/);
  assert.match(m, /if \(allChecksAnswered && !done\) bank\(\);/);
  assert.match(m, /disabled=\{!allChecksAnswered\}/);
  assert.doesNotMatch(m, /SKIP AHEAD/);
  const m8 = read('src/screens/lab/amp/modules/mod8Apply.tsx');
  assert.doesNotMatch(m8, /navigation\.navigate\('AmpModule'/);
  assert.match(m8, /navigation\.push\('AmpModule', \{ id \}\);/);
});

test('Sound Systems: resets drop page memory and re-mount (a practice run — nothing deleted, 2026-09-30 day); hub link pops', () => {
  const pm = read('src/screens/lab/soundsystems/pageMemory.ts');
  assert.match(pm, /export function clearPageMemory/);
  const ss = read('src/screens/lab/soundsystems/SsPagedLab.tsx');
  assert.doesNotMatch(ss, /resetPagedProgress\(/);
  assert.match(ss, /clearPageMemory\(\[labId\]\);/);
  assert.match(ss, /<Page key=\{`\$\{memoryKey\}:\$\{resetSeq\}`\}/);
  assert.match(read('src/screens/lab/soundsystems/SoundSystemsLabScreen.tsx'), /clearPageMemory\(SS_MODES\.map/);
  assert.match(read('src/screens/lab/soundsystems/pagesLearnC.tsx'), /<LabLink pop route="SoundSystemsLab"/);
  assert.match(read('src/screens/lab/soundsystems/bits.tsx'), /pop \? \{ pop: true \} : undefined/);
});

test('cable labs: practice again after the final challenge and bench; Install locks scroll during drags', () => {
  assert.match(read('src/screens/lab/cable/lessons/lesson11.tsx'), /PRACTISE AGAIN ↻" action onPress=\{\(\) => setProg\(FRESH\)\}/);
  assert.match(read('src/screens/lab/cable/lessons/lesson10.tsx'), /label="PRACTISE AGAIN ↻"/);
  const ci = read('src/screens/lab/cableinstall/CableInstallLabScreen.tsx');
  assert.match(ci, /scrollEnabled=\{!dragLocked\}/);
  assert.match(ci, /<ScrollLockProvider value=\{setDragLocked\}>/);
  assert.match(ci, /firstIncomplete <= CI_MODULES\.length \? firstIncomplete : 1/);
  assert.doesNotMatch(ci, /paddingTop: 54/);
});

test('same-frame double taps: patchbay design rows latch synchronously; connector final keeps the first answer; mic select FINISH locked', () => {
  assert.match(read('src/screens/lab/patchbay/pagesD.tsx'), /!settledRef\.current\) \{\n\s*settledRef\.current = true;/);
  assert.match(read('src/screens/lab/connectorselect/pagesD.tsx'), /prev\.has\(q\.id\) \? prev : new Map\(prev\)\.set\(q\.id, orig\)/);
  // Mic select's NEXT / FINISH go through the kit's ONE 400 ms tap lock
  // (useLabNav, WP5 2026-10-01): no local lock, no second NEXT to double.
  const mic = read('src/screens/lab/micselect/MicSelectLabScreen.tsx');
  assert.match(mic, /from '\.\.\/kit\/LabNavBar'/);
  assert.match(mic, /useLabNav\(\{/);
  assert.doesNotMatch(mic, /lastNavAtRef/);
  assert.equal((mic.match(/<LabNextButton nav=\{nav\} \/>/g) ?? []).length, 1);
});

// ── sound after stop ────────────────────────────────────────────────────────

test('ear training NEXT stops the clip; tuning question is ONE clip; ear player newest load wins', () => {
  const ear = read('src/screens/lab/eartraining/EarModuleScreen.tsx');
  const begin = ear.slice(ear.indexOf('const beginTrial'), ear.indexOf('const beginTrial') + 900);
  assert.match(begin, /playerRef\.current\?\.stop\(\);/);
  const ch0 = read('src/screens/lab/tuning/chapters/ch0Welcome.tsx');
  assert.equal((ch0.match(/renderAndPlay\(/g) ?? []).length, 1);
  assert.match(ch0, /concatWithGap\(/);
  const ep = read('src/features/ear/earPlayer.ts');
  assert.match(ep, /const gen = \+\+this\.loadGen;/);
  assert.match(ep, /if \(this\.disposed \|\| gen !== this\.loadGen\)/);
});

test('tuning saves build on the newest progress; its accuracy note no longer claims a microphone', () => {
  const t = read('src/screens/lab/tuning/TuningLabScreen.tsx');
  assert.match(t, /const base = progressRef\.current;/);
  assert.doesNotMatch(t, /persist\(\{ \.\.\.progress,/);
  assert.doesNotMatch(t, /read through this phone's microphone/);
});

test('mixing QC pages stop their staged renders on leave and lock same-frame double taps', () => {
  const s = read('src/screens/lab/mixing/pagesAdvD.tsx');
  assert.match(s, /function useRunGuard\(\)/);
  assert.ok((s.match(/if \(!guard\.alive\(\)\) return;/g) ?? []).length >= 7);
});

test('tube: visits persist only once the tier is known; card re-fits on rotation; coverage rack keyed per section', () => {
  const v = read('src/screens/lab/tube/VacuumTubeLabScreen.tsx');
  assert.match(v, /if \(!entResolved\) return;\n\s*markLabVisit\('tube'/);
  assert.match(read('src/screens/lab/tube/TubeCardScreen.tsx'), /\}, \[area\.w, area\.h\]\);/);
  assert.match(read('src/screens/lab/micspeaker/SpeakerCoverageLabScreen.tsx'), /<RackUnit key=\{s\.key\}/);
});
