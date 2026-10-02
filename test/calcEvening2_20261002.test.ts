/**
 * Evening toddler hunt pass 2 (2026-10-02) — CALC area.
 *
 * E2-1 Workflow runner SAVE said "Progress saved." for a blank run that
 *      persist() never wrote, and said nothing at all when the write failed.
 * E2-2 goTo / onFinish called persist() before setRun landed, so persist()
 *      saved the run as it was BEFORE the tap. FINISH then START AGAIN inside
 *      the 1 s autosave window left the finished run stored unfinished — it
 *      came back as "Resume previous progress?".
 * E2-3 calcPrefs: a section tapped before the stored read landed was flipped
 *      back by the late read, while the tap's write had stored the new state.
 * E2-4 RT60-from-surfaces α list accepted any value with no warning (a slipped
 *      "9" for 0.9) where the single α field warns above 1.2.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Extensionless relative imports (as test/patternP16_20261002 resolves them).
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && !/\.(ts|tsx|js|mjs|cjs|json)$/.test(specifier) && context.parentURL) {
      const base = path.dirname(fileURLToPath(context.parentURL));
      for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
        const p = path.resolve(base, specifier + ext);
        if (existsSync(p)) return { url: pathToFileURL(p).href, shortCircuit: true };
      }
    }
    return next(specifier, context);
  },
});

const HERE = path.dirname(fileURLToPath(import.meta.url));
const read = (p: string) => readFileSync(path.resolve(HERE, '..', p), 'utf8');
const RUN = read('src/screens/lab/calc/CalcWorkflowRunScreen.tsx');
const PREFS = read('src/screens/lab/calc/calcPrefs.ts');
const PANEL = read('src/screens/lab/calc/calcPanel.tsx');

const { WORKSPACES } = await import('../src/screens/lab/calc/registry.ts');

describe('E2-1 — SAVE reports what actually happened', () => {
  it('persist answers "blank" (not true) when it writes nothing', () => {
    const body = RUN.slice(RUN.indexOf('const persist = useCallback'), RUN.indexOf('}, [limits.canResume]);'));
    assert.match(body, /Object\.keys\(st\.inputs\)\.length === 0\)\) return 'blank';/);
    assert.doesNotMatch(body, /length === 0\)\) return true;/);
  });
  it('the SAVE key branches: blank → nothing to save, ok → saved, failure → notify', () => {
    const save = RUN.slice(RUN.indexOf('label="SAVE"'), RUN.indexOf('CONTINUE ›'));
    assert.match(save, /if \(ok === 'blank'\) setRecalcNote\('Nothing to save yet/);
    assert.match(save, /else if \(ok\) setRecalcNote\('Progress saved\.'\)/);
    assert.match(save, /else if \(storeGenRef\.current === workflowGeneration\(\)\) notify\('Save failed'/);
  });
});

describe('E2-2 — goTo / onFinish persist the NEW run, not the previous one', () => {
  for (const name of ['const goTo = ', 'const onFinish = ']) {
    it(`${name.trim()} sets runRef.current before persist()`, () => {
      const start = RUN.indexOf(name);
      const body = RUN.slice(start, RUN.indexOf('\n  };', start));
      const ref = body.indexOf('runRef.current = nextRun');
      const save = body.indexOf('void persist()');
      assert.ok(ref >= 0, 'runRef must take the new run');
      assert.ok(save > ref, 'persist() must run after runRef holds the new run');
      assert.doesNotMatch(body, /setRun\(\(r\) =>/, 'no deferred updater whose result persist() cannot see');
    });
  }
});

describe('E2-3 — a late stored read never flips a section the user already tapped', () => {
  it('toggle marks the section touched; the read keeps touched sections', () => {
    assert.match(PREFS, /const toggle = useCallback\(\(k: CalcSection\) => \{\s*touchedRef\.current\.add\(k\);/);
    assert.match(PREFS, /why: t\.has\('why'\) \? o\.why : map\[KEYS\.why\] !== '0'/);
    assert.match(PREFS, /example: t\.has\('example'\) \? o\.example :/);
    assert.match(PREFS, /mistakes: t\.has\('mistakes'\) \? o\.mistakes :/);
  });
});

describe('E2-4 — α list entries are checked like the single α field', () => {
  const ws = WORKSPACES.find((w: { fields: { key: string }[] }) => w.fields.some((f) => f.key === 'coeffs'));
  const coeffs = ws!.fields.find((f: { key: string }) => f.key === 'coeffs');
  it('the coefficients list carries the α warn rule', () => {
    assert.ok(coeffs.warn, 'no warn rule on the α list');
    assert.equal(coeffs.warn.test(9), true);
    assert.equal(coeffs.warn.test(1.5), true);
    assert.equal(coeffs.warn.test(0.9), false);
    assert.equal(coeffs.warn.test(1.1), false, 'lab values slightly above 1 are allowed, as on the single field');
  });
  it('FieldRow tests every LIST entry against the field warn rule', () => {
    assert.match(PANEL, /field\.warn && isList && parseList\(raw\)\.some\(\(x\) => Number\.isFinite\(x\) && field\.warn!\.test\(x\)\)/);
  });
});
