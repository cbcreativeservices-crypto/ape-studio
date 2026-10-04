/**
 * Calc — hunt 10 (2026-10-03) receipts.
 *
 *  H10-1 Q · Bandwidth — "Center frequency between two frequencies" with the
 *        same frequency typed twice (a band of no width) printed
 *        "Q OF THIS BAND —" (fc ÷ 0) beside BANDWIDTH 0 Hz. The Q row now says
 *        in words that a 0 Hz-wide band has no Q; every other row is unchanged.
 *
 *  H10-2 Saved Projects had no LOADING face (the three list faces — AGENTS.md;
 *        Saved Results and My Workflows got theirs in hunt 7). Until the first
 *        read landed the list was the initial [], so the "no projects yet"
 *        face showed over every saved project for as long as the read took.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && !/\.(ts|tsx|js|mjs|cjs|json)$/.test(specifier) && context.parentURL) {
      const base = path.dirname(fileURLToPath(context.parentURL));
      for (const ext of ['.ts', '.tsx']) {
        const p = path.resolve(base, specifier + ext);
        if (existsSync(p)) return { url: pathToFileURL(p).href, shortCircuit: true };
      }
    }
    return next(specifier, context);
  },
});

const { getWorkspace } = await import('../src/screens/lab/calc/registry.ts');

type Out = { label: string; text?: string; value?: number; refusal?: true };
const fnOf = (wsId: string, key: string) => {
  const f = getWorkspace(wsId)?.functions.find((x) => x.key === key);
  assert.ok(f, `${wsId}.${key}`);
  return f!;
};

describe('H10-1 — the same frequency twice: Q is said in words, never "—"', () => {
  const f = fnOf('qbw', 'geoCenter');

  it('no numeric row is non-finite for flo = fhi', () => {
    const outs = f.compute({ flo: 100, fhi: 100 }) as Out[];
    for (const o of outs) if (o.value != null) assert.ok(Number.isFinite(o.value), `${o.label} = ${o.value}`);
    const q = outs.find((o) => o.label === 'Q OF THIS BAND');
    assert.ok(q && q.value == null, 'the Q row is words, not a number');
    assert.match(q!.text ?? '', /no width/);
    assert.notEqual(q!.refusal, true, 'the centre is still an answer — not a refusal');
    assert.equal(outs.find((o) => o.label === 'CENTER FREQUENCY (geometric)')?.value, 100);
  });

  it('a real band keeps its numeric Q (unchanged)', () => {
    const outs = f.compute({ flo: 100, fhi: 400 }) as Out[];
    const q = outs.find((o) => o.label === 'Q OF THIS BAND');
    assert.ok(q && typeof q.value === 'number');
    assert.ok(Math.abs(q!.value! - 200 / 300) < 1e-12);
  });
});

describe('H10-2 — Saved Projects shows a loading face before the first read lands', () => {
  const src = readFileSync(new URL('../src/screens/lab/calc/CalcProjectsScreen.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');

  it('the newest read marks the list loaded', () => {
    const reload = src.slice(src.indexOf('const reload = useCallback('), src.indexOf('useEffect(reload, [reload]);'));
    assert.match(reload, /setLoaded\(true\)/);
    assert.match(src, /const \[loaded, setLoaded\] = useState\(false\)/);
  });

  it('the list view shows "Loading" before the unreadable and empty faces', () => {
    const list = src.slice(src.indexOf('{!editing ? ('));
    const iLoad = list.indexOf('!loaded ?');
    const iUnread = list.indexOf('workflowListUnreadable(projects)');
    const iEmpty = list.indexOf('projects.length === 0');
    assert.ok(iLoad >= 0, 'a loading face exists');
    assert.ok(iLoad < iUnread && iUnread < iEmpty, 'loading → unreadable → empty, in that order');
    assert.match(list.slice(iLoad, iUnread), /Loading your projects…/);
  });
});
