/**
 * Progress screen LABS tile (owner 2026-10-29).
 *
 *   • The labs counted are exactly the credit labs: every af_* Audio
 *     Fundamentals key and every whole Training lab (tr_*) that the catalog
 *     shows — one row each, a real name, a real route.
 *   • NO TOTAL on Progress ("the 'out of' sounds intimidating and defeating"):
 *     neither the LABS nor the TOPICS tile prints "N / total".
 *   • Three faces: a failed device read is UNREADABLE, never "no labs".
 *   • The tile and the list read the existing lab-credit store; nothing new
 *     is stored.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      for (const ext of ['.ts', '.tsx']) {
        const candidate = new URL(specifier + ext, context.parentURL);
        if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
      }
    }
    return nextResolve(specifier, context);
  },
});

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

const { creditLabs } = await import('../src/features/lab/creditLabs.ts');
const { TRAINING_LABS } = await import('../src/features/lab/trainingLabKeys.ts');

describe('creditLabs — what the LABS tile counts', () => {
  const labs = creditLabs();

  it('one row per key, each with a name and a route', () => {
    assert.equal(new Set(labs.map((l) => l.key)).size, labs.length, 'duplicate key');
    for (const l of labs) {
      assert.ok(l.name.trim().length > 0, `${l.key} has no name`);
      assert.ok(l.route, `${l.key} has no route`);
    }
  });

  it('every af_* lab key in the store is a Fundamentals row', () => {
    const store = read('src/features/lab/labCompletion.ts');
    const afKeys = [...store.matchAll(/^\s*\| '(af_[a-z_]+)'/gm)].map((m) => m[1]);
    assert.ok(afKeys.length >= 15, `read ${afKeys.length} af_ keys`);
    const fundamentals = new Set(labs.filter((l) => l.section === 'fundamentals').map((l) => l.key));
    for (const k of afKeys) assert.ok(fundamentals.has(k), `${k} missing from the LABS list`);
  });

  it('every whole Training lab in the catalog is a Training row; nothing else is', () => {
    const training = labs.filter((l) => l.section === 'training');
    const known = new Set(TRAINING_LABS.map((t) => t.key));
    for (const l of training) assert.ok(known.has(l.key), `${l.key} is not a credit key`);
    // Every training key whose route the catalog lists is counted.
    const catalog = read('src/screens/lab/labCatalog.ts');
    for (const t of TRAINING_LABS) {
      if (new RegExp(`route: '${t.route}'`).test(catalog)) {
        assert.ok(training.some((l) => l.key === t.key), `${t.key} (${t.route}) missing`);
      }
    }
    // Lesson-by-lesson keys (Miking / Mixing / Ear) are never whole-lab rows.
    for (const l of labs) assert.doesNotMatch(l.key, /^(mk|mxb|mxa|ear)_/);
  });
});

describe('Progress screen — faces and copy', () => {
  it('completedLabsFace: unreadable beats everything; loading before ready', async () => {
    const src = read('src/features/lab/completedLabs.ts');
    // The face picker is pure; check its order in source (the module imports
    // the RN store, so it is not loaded here).
    const body = src.slice(src.indexOf('export function completedLabsFace'));
    assert.ok(body.indexOf("'unreadable'") < body.indexOf("'loading'"), 'unreadable must be checked first');
    assert.ok(body.indexOf("'loading'") < body.indexOf("'ready'"));
    assert.match(src, /from '\.\/labCompletion'/, 'reads the existing lab-credit store');
    assert.doesNotMatch(src, /AsyncStorage|createLocalStore/, 'stores nothing new');
  });

  it('no "N / total" on the Progress tiles (owner 2026-10-29)', () => {
    const home = read('src/screens/achievements/AchievementsHomeScreen.tsx');
    assert.doesNotMatch(home, /\$\{t\.earned\} \/ \$\{t\.total\}/);
    assert.doesNotMatch(home, /'— \/ —'/);
    assert.match(home, /useCompletedLabs\(\)/);
    assert.match(home, /navigation\.navigate\('Labs'\)/);
  });

  it('the LABS list screen has its unreadable and empty faces', () => {
    const s = read('src/screens/achievements/LabsProgressScreen.tsx');
    assert.match(s, /state\.status === 'unreadable'/);
    assert.match(s, /state\.status === 'loading'/);
    assert.match(s, /TROPHY_CASE_EMPTY\.labs/);
  });
});

describe('D32: the server lab record comes back (owner 2026-10-30)', () => {
  const src = readFileSync(new URL('../src/features/lab/labCompletion.ts', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
  const fn = src.slice(src.indexOf('async function pullServerLabCredit'), src.indexOf('onSessionCarrySettled(() => {\n  void pullServerLabCredit'));

  it('reads only for a settled signed-in account, through the own-rows table read', () => {
    assert.match(fn, /if \(!sessionIsSettledAccount\(\)\) return;/);
    assert.match(fn, /\.from\('student_lab_progress'\)\.select\('labs\(key\)'\)/);
    assert.match(src, /onSessionCarrySettled\(\(\) => \{\n  void pullServerLabCredit\(\);\n\}\);/);
  });

  it('drops an answer that arrives after the account changed', () => {
    assert.match(fn, /const gen = completionGen;/);
    assert.match(fn, /if \(gen !== completionGen \|\| error \|\| !Array\.isArray\(data\)\) return;/);
  });

  it('adds server keys to `sent` only, never units (labs still open as practice)', () => {
    assert.match(fn, /sent\.add\(key\)/);
    assert.doesNotMatch(fn, /cleared\[/);
    assert.doesNotMatch(fn, /recordUnit|markLabUnit|fireComplete/);
    assert.match(fn, /isServerLabKey\(key\)/);
  });
});
