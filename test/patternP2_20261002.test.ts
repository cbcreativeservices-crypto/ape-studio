/**
 * Pattern hunt P2 (catalog 2026-10-02) — overlapping async loads: the NEWEST
 * must win. House idioms: an `alive` flag per effect run, or a sequence ref
 * (`const my = ++seq.current; … if (my !== seq.current) return;`).
 *
 * Sites fixed 2026-10-02 (each pinned below; R2: every pin fails on the
 * pre-fix copy):
 *  • usePatterns (Cymatics gallery) — mount load vs a save's reload.
 *  • CalcProjectsScreen.reload — mount load vs a save's reload.
 *  • TopicsScreen — a refetch on every focus; a quick return overlapped two.
 *  • TrophyScreen — icon read keyed on achievementId.
 *  • CalcWorkflowEditScreen — workflow load keyed on editingId.
 *  • StudyFsOverlay — guide-count read keyed on guideKey.
 *  • useLabDone / useLabClearedUnits / useLabVisits — hydrate().then(l) keyed
 *    on the lab key; an old key's listener could land after the new one.
 * The async-effect ratchet (no NEW unguarded async effect) is in
 * patternP11_20261002 — the same signature closes both classes.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');

test('usePatterns: only the newest gallery read lands, and never on an unmounted gallery', () => {
  const s = code(read('src/features/cymatics/patternStore.ts'));
  assert.match(s, /const my = \+\+seqRef\.current;\s*const list = await patternStore\(\)\.loadPatterns\(\);\s*if \(aliveRef\.current && my === seqRef\.current\) setPatterns\(list\);/);
  assert.match(s, /aliveRef\.current = true;\s*void reload\(\);\s*return \(\) => \{\s*aliveRef\.current = false;/);
});

test('CalcProjectsScreen: only the newest project list lands', () => {
  const s = code(read('src/screens/lab/calc/CalcProjectsScreen.tsx'));
  assert.match(s, /const my = \+\+reloadSeq\.current;\s*void workflowStore\.listProjects\(\)\.then\(\(list\) => \{\s*if \(my === reloadSeq\.current\) setProjects\(list\);/);
  assert.doesNotMatch(s, /listProjects\(\)\.then\(setProjects\)/);
});

test('TopicsScreen: an older focus load cannot land over a newer one (success or failure)', () => {
  const s = code(read('src/screens/achievements/TopicsScreen.tsx'));
  const eff = s.slice(s.indexOf('const loadSeq = useRef(0);'), s.indexOf('const subjects = useMemo('));
  assert.match(eff, /const my = \+\+loadSeq\.current;/);
  assert.equal((eff.match(/if \(my !== loadSeq\.current\) return;/g) ?? []).length, 2, 'both .then and .catch check the ticket');
});

test('TrophyScreen and CalcWorkflowEditScreen: a retired keyed read does not land', () => {
  const t = code(read('src/screens/results/TrophyScreen.tsx'));
  assert.match(t, /let alive = true;[\s\S]{0,200}\.eq\('id', achievementId\)[\s\S]{0,120}if \(alive\) setIconUrl\(/);
  assert.match(t, /return \(\) => \{\s*alive = false;\s*\};\s*\}, \[achievementId\]\);/);
  const w = code(read('src/screens/lab/calc/CalcWorkflowEditScreen.tsx'));
  assert.match(w, /let alive = true;\s*void workflowStore\.listWorkflows\(\)\.then\(\(list\) => \{\s*if \(!alive\) return;/);
  assert.match(w, /return \(\) => \{\s*alive = false;\s*\};\s*\}, \[editingId\]\);/);
});

test('StudyFsOverlay: a read for the previous guide key cannot set this key\'s count', () => {
  const s = code(read('src/components/StudyFsOverlay.tsx'));
  assert.match(s, /if \(alive && v\) guideCount\.current = Number\(v\) \|\| 0;/);
  assert.match(s, /if \(alive\) guideCount\.current = 2;/);
  assert.match(s, /if \(alive\) guideLoaded\.current = true;/);
});

test('keyed lab hooks: a hydrate that lands after the key changed is dropped', () => {
  const done = code(read('src/features/lab/labCompletion.ts'));
  const visits = code(read('src/features/lab/labVisits.ts'));
  const SHAPE = /let live = true;\s*void hydrate\(\)\.then\(\(\) => \{\s*if \(live\) l\(\);\s*\}\);\s*return \(\) => \{\s*live = false;/g;
  assert.equal((done.match(SHAPE) ?? []).length, 3, 'useLabDone + useLabClearedUnits + useLabCompletion');
  assert.equal((visits.match(SHAPE) ?? []).length, 1, 'useLabVisits');
  // The raw listener is handed to hydrate only by the []-deps
  // useAudioFundamentalsComplete (no key to go stale).
  assert.equal((done.match(/hydrate\(\)\.then\(l\)/g) ?? []).length, 1);
  assert.equal((visits.match(/hydrate\(\)\.then\(l\)/g) ?? []).length, 0);
});
