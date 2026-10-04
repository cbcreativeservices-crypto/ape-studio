/**
 * PERFORMANCE HUNT 2026-10-03 — AREA 7 (CALC): receipts.
 *
 * Each block pins the faster structure of one fix; every one fails on HEAD
 * 4201f49f. None of them touches a formula: calculator accuracy is unchanged
 * (the compute path — buildValues / runCompute / formatOutput — is not edited).
 *
 *  P1 calcPrefs: a calculator opened with WHY / EXAMPLE / MISTAKES all open and
 *     snapped the learner's collapsed ones shut when the storage read landed —
 *     on every open. The last known state now seeds the next calculator, and
 *     the hub warms it before the first one opens. The read still runs and
 *     still has the last word.
 *  P2 My Workflows: `<Row />` was declared inside the screen body — a new
 *     component type every render — so every card was unmounted and rebuilt on
 *     each ★, ▲▼ and focus reload. It is now a render function.
 *  P3 Workflow builder: the ADD CALCULATOR picker renders ~160 rows; every
 *     keystroke in the name / description / search box re-rendered them all.
 *     Rows are memoised with a stable add handler, and the filter runs on a
 *     deferred copy of the search text.
 *  P4 Workflow runner open: the saved drafts were read only after the
 *     workflows list landed — two storage round trips in series. Now parallel.
 *  P5 Workflow runner autosave: the 1 s autosave re-wrote an unchanged run
 *     after RESUME and after every step change / FINISH whose own save had
 *     already landed (each a whole-blob read + parse + stringify + write).
 *  P6 Calculator: every keystroke re-rendered the whole lower page (function
 *     picker, explanations, glossary chips) with the answer. It is a memoised
 *     block with stable handlers now.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const src = (f: string) =>
  readFileSync(new URL(`../src/screens/lab/calc/${f}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

describe('P1 — calculator sections paint in the remembered state', () => {
  const s = src('calcPrefs.ts');
  it('the hook seeds its first state from the last known open-state', () => {
    assert.match(s, /let lastKnownOpen: Record<CalcSection, boolean> \| null = null;/);
    assert.match(s, /useState<Record<CalcSection, boolean>>\(\(\) => lastKnownOpen \?\? \{ why: true, example: true, mistakes: true \}\)/);
  });
  it('a successful read and a tap both record it; the read still runs (one read site)', () => {
    assert.match(s, /lastKnownOpen = read;\s*return read;/);
    assert.match(s, /const next = \{ \.\.\.o, \[k\]: !o\[k\] \};\s*lastKnownOpen = next;/);
    assert.equal((s.match(/AsyncStorage\.multiGet\(/g) ?? []).length, 1, 'still exactly one read site');
  });
  it('the remembered state is cleared by the account wipe', () => {
    assert.match(s, /export function resetCalcSectionPrefs\(\): void \{\s*lastKnownOpen = null;\s*\}/);
    const reg = readFileSync(new URL('../src/features/account/clearLocalAccountData.ts', import.meta.url), 'utf8');
    assert.match(reg, /import \{ resetCalcSectionPrefs \} from '\.\.\/\.\.\/screens\/lab\/calc\/calcPrefs';/);
    assert.match(reg, /\n\s+resetCalcSectionPrefs\(\);/);
  });
  it('the hub warms it before the first calculator opens', () => {
    const hub = src('CalcLabScreen.tsx');
    assert.match(hub, /import \{ useCalcSectionOpen \} from '\.\/calcPrefs';/);
    assert.match(hub, /\n  useCalcSectionOpen\(\);\n/);
  });
});

describe('P2 — My Workflows does not rebuild every card on each render', () => {
  const s = src('CalcWorkflowsScreen.tsx');
  it('no component type is declared inside the screen body', () => {
    assert.doesNotMatch(s, /const Row = \(/);
    assert.doesNotMatch(s, /<Row key=/);
  });
  it('the cards come from a render function, keyed by id', () => {
    assert.match(s, /const renderRow = \(\{ w, template, index, count \}/);
    assert.match(s, /<View key=\{w\.id\} style=\{styles\.card\}>/);
    assert.match(s, /mine\.map\(\(w, i\) => renderRow\(\{ w, template: false, index: i, count: mine\.length \}\)\)/);
    assert.match(s, /WORKFLOW_TEMPLATES\.map\(\(w\) => renderRow\(\{ w, template: true \}\)\)/);
  });
});

describe('P3 — the builder picker does not re-render ~160 rows per keystroke', () => {
  const s = src('CalcWorkflowEditScreen.tsx');
  it('picker rows are memoised', () => {
    assert.match(s, /const PickRow = memo\(function PickRow\(/);
    assert.match(s, /<PickRow key=\{`\$\{c\.workspaceId\}-\$\{c\.fnKey\}`\} c=\{c\} onAdd=\{addStep\} \/>/);
  });
  it('the add handler is stable (setters only)', () => {
    assert.match(s, /const addStep = useCallback\(\(c: CatalogEntry\) => \{[\s\S]{0,300}?\}, \[\]\);/);
  });
  it('the filter runs on a deferred copy of the search text', () => {
    assert.match(s, /const deferredSearch = useDeferredValue\(search\);/);
    assert.match(s, /\}, \[catalog, deferredSearch\]\);/);
  });
});

describe('P4 — the runner reads the workflow and its drafts in parallel', () => {
  const s = src('CalcWorkflowRunScreen.tsx');
  it('one Promise.all, no second serial read', () => {
    assert.match(s, /const \[list, runs\] = await Promise\.all\(\[workflowStore\.listWorkflows\(\), workflowStore\.listRuns\(\)\]\);/);
    assert.doesNotMatch(s, /const runs = await workflowStore\.listRuns\(\);/);
  });
});

describe('P5 — the 1 s autosave never re-writes a run already saved as it is', () => {
  const s = src('CalcWorkflowRunScreen.tsx');
  it('the saved object is recorded only from a write result', () => {
    assert.match(s, /: await workflowStore\.saveRun\(r, storeGenRef\.current\);\s*if \(ok\) lastPersistedRef\.current = r;/);
  });
  it('RESUME records the draft it just read', () => {
    assert.match(s, /lastPersistedRef\.current = draft;\s*setRun\(draft\);/);
  });
  it('the debounced timer skips an unchanged run; SAVE and leaving still always save', () => {
    assert.match(s, /setTimeout\(\(\) => \{\s*\/\/[^\n]*\n\s*if \(runRef\.current === lastPersistedRef\.current\) return;\s*void persist\(\);\s*\}, 1000\)/);
    // persist() itself is unchanged in what it decides: no skip inside it.
    const body = s.slice(s.indexOf('const persist = useCallback('), s.indexOf('}, [limits.canResume]);'));
    assert.doesNotMatch(body, /lastPersistedRef\.current\) return/);
  });
});

describe('P6 — a keystroke in a calculator re-renders the inputs and answer only', () => {
  const s = src('CalcWorkspaceScreen.tsx');
  it('the lower page is one memoised block', () => {
    assert.match(s, /const WorkspaceLowerBody = memo\(function WorkspaceLowerBody\(/);
    assert.match(s, /<WorkspaceLowerBody\s+ws=\{ws\}\s+fn=\{fn\}\s+fnIdx=\{fnIdx\}\s+onPickFn=\{onPickFn\}\s+onOpenKey=\{onOpenKey\}\s+chain=\{chain\}\s+secOpen=\{secOpen\}\s+toggleSec=\{toggleSec\}\s+onTerm=\{setPopupTerm\}\s*\/>/);
  });
  it('its handlers are stable', () => {
    assert.match(s, /const onPickFn = useCallback\(\(i: number\) => \{\s*setFnIdx\(i\);\s*setStepsOpen\(false\);\s*\}, \[\]\);/);
    assert.match(s, /const onOpenKey = useCallback\(\(\) => setKeyOpen\(true\), \[\]\);/);
  });
  it('no inline setter closures were left in the lower page', () => {
    const body = s.slice(s.indexOf('const WorkspaceLowerBody = memo('), s.indexOf('const styles = StyleSheet.create('));
    assert.doesNotMatch(body, /setFnIdx|setKeyOpen|setPopupTerm/);
  });
  it('the stable handlers sit above the early return (hooks order)', () => {
    const at = s.indexOf('const onPickFn = useCallback(');
    assert.ok(at > 0 && at < s.indexOf('if (!ws || !fn) {'));
  });
});
