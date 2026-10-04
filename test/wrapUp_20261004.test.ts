/**
 * WRAP-UP 2026-10-04 — receipts.
 *
 * 1. PAYWALL: no plans / prices / CONTINUE to a maybe-member. A member whose
 *    tier is only REMEMBERED (first paint before the network read) or whose
 *    read failed is shown the house 'checking' / MEMBERSHIP_NOT_CONFIRMED face;
 *    a known non-member ('locked') and a known guest see the plans as before.
 * 2. GLOSSARY: the offline definitions are aligned (re-tagged, which DELETES
 *    the other tier's text) and saved only on a settled gate ('open' /
 *    'locked'). A member whose read failed with no remembered tier resolves
 *    'anonymous' → defTier 'free', and the align deleted their saved offline
 *    member definitions.
 * 4. ENROLLED BUNDLES: a read state (loading / unreadable / read) like the
 *    enrollment list's; the My Enrollment empty face waits for BOTH lists.
 *
 * R2: each receipt was run against `git show HEAD:<path>` copies and FAILED.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { fileURLToPath } from 'node:url';

const read = (...p: string[]) => readFileSync(join(process.cwd(), 'src', ...p), 'utf8');

describe('1 · Paywall: no offer to a maybe-member', () => {
  const src = read('screens', 'commercial', 'PaywallScreen.tsx');
  const settle = src.indexOf("if (!(tierKnown || gate === 'locked')) {");
  const plans = src.indexOf('{PLANS.map(');
  it('reads the house member gate', () => {
    assert.match(src, /import \{ useMemberGate \} from '\.\.\/\.\.\/features\/commercial\/useTier';/);
    assert.match(src, /const gate = useMemberGate\(\);/);
  });
  it('an unsettled tier returns its own face BEFORE the plan cards', () => {
    assert.ok(settle > 0, 'no settled-tier guard');
    assert.ok(plans > settle, 'the plans render before the guard');
    // …and after the member page (a CONFIRMED member still gets their own page).
    assert.ok(src.indexOf('if (tierKnown && isMember) {') < settle);
  });
  it('the face is the house checking / not-confirmed wording, with no purchase control', () => {
    const face = src.slice(settle, src.indexOf('\n  return (', settle));
    assert.match(face, /gate === 'unconfirmed' \|\| tierReadFailed \? MEMBERSHIP_NOT_CONFIRMED : 'Checking your account…'/);
    assert.doesNotMatch(face, /onContinue|PLANS|CONTINUE|price/i);
    // Restore stays reachable (Apple 3.1.1) — it buys nothing.
    assert.match(face, /onRestore/);
  });
  it('purchase still refuses an unsettled tier', () => {
    const cont = src.slice(src.indexOf('const onContinue'), src.indexOf('const onRestore'));
    assert.ok(cont.indexOf('if (!tierKnown) {') > 0 && cont.indexOf('if (!tierKnown) {') < cont.indexOf('buyPlan('));
  });
});

describe('2 · Glossary: offline definitions are never deleted on an unsettled tier', () => {
  const src = read('screens', 'glossary', 'GlossaryScreen.tsx');
  it('settled = the member gate is open or locked', () => {
    assert.match(src, /defSettledRef\.current = memberGate === 'open' \|\| memberGate === 'locked';/);
  });
  it('ensureDefinitions aligns (and so reads/saves the device copy) only when settled', () => {
    const body = src.slice(src.indexOf('const ensureDefinitions = useCallback('), src.indexOf('ensureDefsRef.current = ensureDefinitions;'));
    assert.match(body, /const diskOk = defSettledRef\.current\s*\?\s*await alignDefinitionTier\(table, tier\)/);
    // No other align in the path, and the save still needs diskOk.
    assert.equal(body.split('alignDefinitionTier(').length - 1, 1);
    assert.match(body, /if \(diskOk\) void saveStoredDefinitions\(table, rows\)/);
    assert.match(body, /const stored = diskOk\s*\?\s*await loadStoredDefinitions/);
  });
});

describe('4 · enrolledBundlesStore read state', () => {
  const backing = new Map<string, string>();
  let failKey: string | null = null;
  const failing = new Proxy(backing, {
    get(t, p) {
      if (p === 'has') return (k: string) => {
        if (k === failKey) throw new Error('disk read failed');
        return t.has(k);
      };
      const v = Reflect.get(t, p);
      return typeof v === 'function' ? v.bind(t) : v;
    },
  });
  (globalThis as Record<string, unknown>).__FAKE_ASYNC_STORAGE__ = failing;
  registerHooks({
    resolve(specifier, context, nextResolve) {
      if (specifier === '@react-native-async-storage/async-storage') {
        return { url: new URL('./_fake-async-storage.mjs', import.meta.url).href, shortCircuit: true };
      }
      if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
        const candidate = new URL(specifier + '.ts', context.parentURL);
        if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
      }
      return nextResolve(specifier, context);
    },
  });
  const flush = async () => {
    for (let i = 0; i < 30; i++) await Promise.resolve();
    await new Promise((r) => setTimeout(r, 0));
    for (let i = 0; i < 30; i++) await Promise.resolve();
  };

  it('loading → unreadable on a failed read (never "read" with no bundles), then read', async () => {
    failKey = 'ape:enrolledBundles';
    const bs = (await import('../src/features/enrollment/enrolledBundlesStore.ts')) as Record<string, any>;
    assert.equal(typeof bs.useBundlesReadState, 'function', 'no read-state hook');
    const face = () => renderToStaticMarkup(createElement(() => createElement('i', null, bs.useBundlesReadState())));
    assert.equal(face(), '<i>loading</i>');
    bs.getBundles(); // starts the read
    await flush();
    assert.equal(face(), '<i>unreadable</i>');
    assert.deepEqual(bs.getBundles(), []);
    failKey = null;
    backing.set('ape:enrolledBundles', JSON.stringify([{ key: 'cert:A', kind: 'cert', name: 'A', topics: [1], loaded: false }]));
    bs.resetLocal(); // a fresh read (an unreadable store re-reads on the next action)
    bs.getBundles();
    await flush();
    assert.equal(face(), '<i>read</i>');
  });

  it('My Enrollment\'s empty face waits for the bundles too', () => {
    const src = read('screens', 'enrollment', 'EnrollmentScreen.tsx');
    assert.match(src, /const bundlesReadState = useBundlesReadState\(\);/);
    assert.match(src, /enrollTopicsRead === 'unreadable' \|\| bundlesReadState === 'unreadable'/);
    assert.match(src, /enrollTopicsRead === 'loading' \|\| bundlesReadState === 'loading'/);
  });
});
