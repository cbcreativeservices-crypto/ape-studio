/**
 * FINAL ROUND, part B (2026-10-02 evening) — owner rule D48: favor
 * consistency and learning outcomes. One block per item; each was run against
 * the pre-fix files (R2, files copied aside) and failed there.
 *
 *  1. Drum Tuning matches Mastering on load: a failed first read is retried
 *     (3 tries, 1.2 s apart, timer cleared on unmount) instead of landing an
 *     empty lab for the whole visit; openModule is sequence-fenced and MERGES
 *     the stored answers.
 *  2. OSHA dose is exact: the PEL dose leaves out sound below 90 dBA (Table
 *     G-16 / G-16a), the action-level dose leaves out sound below 80 dBA
 *     (Appendix A). Both are shown, labelled with their threshold.
 *  3. Credentials / Gallery / Topics ‹ rely on safeGoBack alone (no one-way
 *     latch that could leave ‹ dead).
 *  4. The featured-credential chip builds from pRef.current (two quick taps
 *     both count).
 *  5. Glossary SHARE reads the full definition through the session cache and
 *     refuses (with a notice) rather than sharing a blank or a teaser.
 *  6. Requests: a Block / Report that went through clears the old banner.
 *  7. Cymatics gallery: an unreadable pattern list is told apart from a
 *     missing row; an edit whose read failed is said, a missing row is silent.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const strip = (s: string) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const between = (s: string, a: string, b: string) => {
  const i = s.indexOf(a);
  assert.ok(i >= 0, `missing: ${a}`);
  const j = s.indexOf(b, i + a.length);
  assert.ok(j > i, `missing after ${a}: ${b}`);
  return s.slice(i, j);
};

type Store = { map: Map<string, string>; failGet: boolean };
const kvState: Store = { map: new Map(), failGet: false };
(globalThis as unknown as { __finalRoundBStore: Store }).__finalRoundBStore = kvState;
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@react-native-async-storage/async-storage') return { url: 'node:test-async-storage-finalb', shortCircuit: true };
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === 'node:test-async-storage-finalb') {
      return {
        format: 'module',
        shortCircuit: true,
        source: `const s = globalThis.__finalRoundBStore; export default { getItem: async (k) => { if (s.failGet) throw new Error('read failed'); return s.map.has(k) ? s.map.get(k) : null; }, setItem: async (k, v) => { s.map.set(k, v); }, removeItem: async (k) => { s.map.delete(k); } };`,
      };
    }
    return nextLoad(url, context);
  },
});

describe('1 · Drum Tuning matches Mastering on load', () => {
  it('the store marks a FAILED read (drumReadFailed), and only a failed one', async () => {
    const progress = (await import('../src/screens/lab/drumtuning/drumProgress.ts')) as Record<string, unknown>;
    const failed = progress.drumReadFailed as ((s: unknown) => boolean) | undefined;
    assert.equal(typeof failed, 'function', 'drumProgress exports drumReadFailed');
    const update = progress.updateDrumProgress as (m: (s: unknown) => void) => Promise<unknown>;
    (progress.setDrumSaveBlocked as (b: boolean) => void)(false);
    kvState.failGet = true;
    const bad = await update(() => {});
    kvState.failGet = false;
    assert.equal(failed!(bad), true, 'a read that threw is marked');
    const good = await update(() => {});
    assert.equal(failed!(good), false, 'a read that worked is not');
  });

  it('a failed first read is retried — 3 tries, 1.2 s apart — and the timer is cleared on unmount', () => {
    const host = strip(read('src/screens/lab/drumtuning/DrumTuningLabScreen.tsx'));
    assert.match(host, /const \[readRetry, setReadRetry\] = useState\(0\);/);
    assert.match(host, /useEffect\(\s*\(\) => \(\) => \{\s*if \(retryTimerRef\.current != null\) clearTimeout\(retryTimerRef\.current\);\s*retryTimerRef\.current = null;\s*\},\s*\[\],\s*\);/);
    assert.match(host, /if \(!wasBlocked && drumReadFailed\(s\) && readRetriesRef\.current < 3\) \{\s*readRetriesRef\.current\+\+;[\s\S]*?setTimeout\(\(\) => \{\s*retryTimerRef\.current = null;\s*setReadRetry\(\(r\) => r \+ 1\);\s*\}, 1200\);\s*return;\s*\}/);
    assert.match(host, /\}, \[resolved, loaded, blocked, readRetry\]\);/);
    // The blocked flag is recorded when the read LANDS (after the retry return).
    const load = between(host, 'const wasBlocked = blocked;', '}, [resolved, loaded, blocked, readRetry]);');
    assert.ok(load.indexOf('return;') < load.indexOf('loadedBlockedRef.current = wasBlocked;'));
    assert.doesNotMatch(host, /loadedBlockedRef\.current = blocked;/);
  });

  it('openModule: only the latest open lands, and the stored answers MERGE', () => {
    const host = strip(read('src/screens/lab/drumtuning/DrumTuningLabScreen.tsx'));
    const open = between(host, 'const openModule = useCallback(', '}, []);');
    assert.match(open, /const seq = \+\+openSeqRef\.current;/);
    assert.match(open, /setAnswers\(\{\}\);\s*void updateDrumProgress/);
    assert.match(open, /if \(seq !== openSeqRef\.current\) return;\s*const stored = s\.modules\[id\]\?\.answers \?\? \{\};\s*setAnswers\(\(prev\) => \(\{ \.\.\.prev, \.\.\.stored \}\)\);/);
    assert.doesNotMatch(open, /setAnswers\(s\.modules\[id\]\?\.answers \?\? \{\}\)/);
  });
});

describe('2 · OSHA dose (29 CFR 1910.95) is exact', async () => {
  const { WORKSPACES_SPL } = await import('../src/screens/lab/calc/workspaces/splSafety.ts');
  const fn = WORKSPACES_SPL.find((w) => w.id === 'dose')!.functions.find((f) => f.key === 'doseOsha')!;
  const out = (levels: number[], mins: number[]) => fn.compute({ doseLevels: levels, doseMins: mins });
  const num = (o: ReturnType<typeof out>, prefix: string) => {
    const r = o.find((x) => x.label.startsWith(prefix));
    assert.ok(r && typeof r.value === 'number', `a "${prefix}…" result`);
    return r!.value as number;
  };
  const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≈ ${b}`);

  it('shows BOTH doses, each labelled with its threshold', () => {
    const o = out([90], [480]);
    assert.ok(o.some((r) => r.label === 'PEL DOSE (≥ 90 dBA / 5 dB)'));
    assert.ok(o.some((r) => r.label === 'ACTION-LEVEL DOSE (≥ 80 dBA / 5 dB)'));
    assert.match(fn.note ?? '', /below 90 dBA/);
    assert.match(fn.note ?? '', /below 80 dBA/);
  });
  it('75 dBA for 8 h = 0% under both', () => {
    const o = out([75], [480]);
    close(num(o, 'PEL DOSE'), 0);
    close(num(o, 'ACTION-LEVEL DOSE'), 0);
  });
  it('90 dBA for 8 h = 100% under both', () => {
    const o = out([90], [480]);
    close(num(o, 'PEL DOSE'), 100);
    close(num(o, 'ACTION-LEVEL DOSE'), 100);
  });
  it('85 dBA for 8 h = 50% action level and 0% PEL', () => {
    const o = out([85], [480]);
    close(num(o, 'PEL DOSE'), 0);
    close(num(o, 'ACTION-LEVEL DOSE'), 50);
  });
  it('a mixed day: each interval counts only at or above its threshold (80 and 90 are inclusive)', () => {
    const o = out([92, 85, 79.9, 80], [240, 120, 480, 60]);
    const share = (L: number, t: number) => (t / (480 / 2 ** ((L - 90) / 5))) * 100;
    close(num(o, 'PEL DOSE'), share(92, 240));
    close(num(o, 'ACTION-LEVEL DOSE'), share(92, 240) + share(85, 120) + share(80, 60));
  });
  it('the field keeps its sign class (patternP16)', () => {
    const f = WORKSPACES_SPL.find((w) => w.id === 'dose')!.fields.find((x) => x.key === 'doseLevels') as { signed?: boolean };
    assert.equal(f.signed, true);
  });
});

describe('3 · Back buttons rely on safeGoBack alone', () => {
  for (const f of ['CredentialWall', 'GalleryScreen', 'TopicsScreen']) {
    it(`achievements/${f}`, () => {
      const src = strip(read(`src/screens/achievements/${f}.tsx`));
      assert.doesNotMatch(src, /leavingRef/);
      assert.match(src, /const leave = useCallback\(\(\) => \{\s*safeGoBack\(navigation(?: as any)?\);\s*\}, \[navigation\]\);/);
      assert.match(src, /onPress=\{leave\}/);
    });
  }
});

describe('4 · Featured credentials chip builds from pRef', () => {
  it('two quick taps both count: the list comes from pRef.current, not the render closure', () => {
    const src = strip(read('src/screens/directory/MyProfileView.tsx'));
    const tap = between(src, 'const on = p.featuredCredentialIds.includes(c.id);', 'featuredChain.current = run.catch');
    const handler = tap.slice(tap.indexOf('onPress={() => {'));
    assert.match(handler, /const cur = pRef\.current;/);
    assert.doesNotMatch(handler, /\bp\.featuredCredentialIds\b/);
    assert.doesNotMatch(handler, /\.\.\.p\b/);
    assert.match(handler, /pRef\.current = next;\s*setP\(next\);/);
  });
});

describe('5 · Glossary Share uses the full definition', () => {
  const src = strip(read('src/screens/glossary/GlossaryScreen.tsx'));
  it('buildShareTerm reads through readDefinitionOnce and never shares the row copy', () => {
    const b = between(src, 'const buildShareTerm = useCallback(', 'const resolveShareTerms');
    assert.match(b, /await readDefinitionOnce\(id, isMemberRef\.current\)/);
    assert.doesNotMatch(b, /definition: e\.definition/);
    assert.match(b, /if \(definition == null\) throw shareDefinitionUnreadable\(/);
  });
  it('an unreadable definition is said (notify), not shared short', () => {
    const s = between(src, 'const shareTerm = useCallback(', 'const deferredSearch');
    assert.match(s, /try \{\s*primary = await buildShareTerm\(e\.id\);\s*\} catch \(err\) \{\s*if \(isShareDefinitionUnreadable\(err\)\) notifyShareUnreadable\(err\);\s*return;\s*\}/);
    assert.match(src, /function notifyShareUnreadable\(err: ShareDefinitionUnreadable\): void \{\s*notify\(/);
    // A multi-term resolve REJECTS — ShareTermSheet's catch closes and says so.
    const r = between(src, 'const resolveShareTerms = useCallback(', 'const namedFrom');
    assert.doesNotMatch(r, /catch/);
    assert.match(read('src/components/ShareTermSheet.tsx'), /\.catch\(\(\) => \{\s*onClose\(\);\s*notify\(/);
  });
});

describe('6 · Requests: Block / Report success clears the old banner', () => {
  const src = strip(read('src/screens/directory/RequestsView.tsx'));
  it('BLOCK', () => {
    const m = between(src, 'function ThreadModeration(', 'const OutgoingCard');
    assert.match(m, /blockThread\(t\.id, true\)\.then\(\(r\) => \{\s*if \(!r\.ok\) return onError\(r\.error\);\s*onError\(null\);\s*return onReload\(\);\s*\}\)/);
  });
  it('REPORT', () => {
    const m = between(src, 'function ReportLink(', 'await onDone();');
    assert.match(m, /if \(!r\.ok\) return onError\(r\.error\);\s*onError\(null\);/);
    // A refused block still sets its own banner, AFTER the clear.
    assert.ok(m.indexOf('onError(null);') < m.indexOf('if (!b2.ok) onError(b2.error);'));
  });
});

describe('7 · Cymatics gallery: unreadable ≠ missing', async () => {
  const store = await import('../src/features/cymatics/patternStore.ts');
  it('getPattern REJECTS on an unreadable list and answers null for a missing row', async () => {
    let fail = false;
    const map = new Map<string, string>();
    const kv = {
      getItem: async (k: string) => {
        if (fail) throw new Error('read failed');
        return map.get(k) ?? null;
      },
      setItem: async (k: string, v: string) => void map.set(k, v),
      removeItem: async (k: string) => void map.delete(k),
    };
    const s = store.createPatternStore(kv);
    assert.equal(await s.getPattern('nope'), null, 'missing = null');
    fail = true;
    await assert.rejects(s.getPattern('nope'), 'unreadable = rejects');
  });
  it('editLatest notifies on unreadable only; a missing row stays silent', () => {
    const src = strip(read('src/screens/lab/cymatics/GalleryScreen.tsx'));
    const e = between(src, 'const editLatest = (', 'const drafts = useRef');
    assert.match(e, /try \{\s*row = await patternStore\(\)\.getPattern\(id\);\s*\} catch \{\s*notify\('Not saved', [^)]*\);\s*return;\s*\}\s*const next = row \? change\(row\) : null;/);
  });
  it('the studios that reopen a pattern handle the rejection', () => {
    for (const f of ['LiquidStudioScreen', 'MembraneStudioScreen', 'PlateStudioScreen']) {
      const src = strip(read(`src/screens/lab/cymatics/${f}.tsx`));
      assert.match(src, /\.getPattern\(savedId\)\s*\.then\([\s\S]*?\}\)\s*\.catch\(\(\) => undefined\);/, f);
    }
  });
});
