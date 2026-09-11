/**
 * Calculator Lab — DEGENERATE-INPUT sweep (edge-case QA night 2026-09-11).
 *
 * The happy path and the normal-range math are pinned by the per-engine
 * suites. This file asks the other question: when a student types a 0, a minus
 * sign, or a wildly out-of-range number into a field, does the lab show them a
 * NUMBER THAT IS NOT A NUMBER?
 *
 * It found three real leaks on the night it was written — a 0 W amplifier
 * printed "Expect roughly NaN–NaN dB SPL", a 0 m cable run printed "NaN%", and
 * a sub-absolute-zero temperature printed "NaN" samples. All three are fixed;
 * this sweep is what keeps them fixed, and covers the other 160 formulas.
 *
 * The contract, for EVERY function in EVERY workspace, at every degenerate
 * case below:
 *   1. No user-visible STRING may contain "NaN", "Infinity" or "undefined".
 *      Strings are where the hole is — a `${x}` in a steps() line or a table()
 *      cell bypasses fmt() and prints straight to a paying student.
 *   2. Numeric OutputVals may be non-finite: CalcWorkspaceScreen renders them
 *      through fmt(), which is contractually '—' (pinned below), and hides the
 *      chain SEND button for them. What they may NOT do is render as "NaN Hz".
 *   3. Nothing may return zero outputs, a ragged table, or a runaway table.
 *
 * LOADER NOTE: the calc registry uses Metro-style extensionless imports, which
 * node's ESM resolver cannot follow, so this file installs a resolve hook and
 * imports the registry dynamically. The hook is local to this test process.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Resolve the workspaces' extensionless relative imports (Metro does this in
// the app; node does not). Registered before the dynamic import below.
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
const CALC_DIR = path.resolve(HERE, '../src/screens/lab/calc');

const { WORKSPACES, getWorkspace } = await import('../src/screens/lab/calc/registry.ts');
const { fmt, fmtInt, parseList, speedOfSoundAir, unitsFor } = await import('../src/screens/lab/calc/calcUnits.ts');
type Workspace = (typeof WORKSPACES)[number];
type CalcFn = Workspace['functions'][number];
type CalcValues = Parameters<CalcFn['compute']>[0];

// ── The formatter contract everything else leans on ─────────────────────────
describe('fmt() — the one gate between a bad number and the student', () => {
  it('NaN renders as the house em-dash, never "NaN"', () => assert.equal(fmt(NaN), '—'));
  it('Infinity renders as the house em-dash', () => assert.equal(fmt(Infinity), '—'));
  it('−Infinity renders as the house em-dash', () => assert.equal(fmt(-Infinity), '—'));
  it('0 stays "0" — a real answer, not an unknown', () => assert.equal(fmt(0), '0'));
  it('−0 does not print as "-0"', () => assert.equal(fmt(-0), '0'));
  it('Number.MAX_VALUE stays finite and exponential, not "Infinity"', () => {
    const s = fmt(Number.MAX_VALUE);
    assert.ok(!/Infinity/.test(s), s);
    assert.ok(/e/.test(s), s);
  });
  it('the smallest denormal does not collapse to "0"', () => assert.notEqual(fmt(5e-324), '0'));
});

describe('fmtInt() — the helper for counts interpolated into prose', () => {
  it('NaN → "—", so a step never reads "NaN taps"', () => assert.equal(fmtInt(NaN), '—'));
  it('Infinity → "—"', () => assert.equal(fmtInt(Infinity), '—'));
  it('−Infinity → "—"', () => assert.equal(fmtInt(-Infinity), '—'));
  it('0 is a real count, not an unknown', () => assert.equal(fmtInt(0), '0'));
  it('rounds to nearest, matching the `${Math.round(x)}` it replaces', () => {
    assert.equal(fmtInt(2.4), '2');
    assert.equal(fmtInt(2.5), '3');
  });
});

describe('parseList() — the comma-separated field', () => {
  it('an empty string yields no numbers (the screen then refuses to compute)', () =>
    assert.deepEqual(parseList(''), []));
  it('pure punctuation yields no numbers', () => assert.deepEqual(parseList(',,, ; ,'), []));
  it('garbage tokens are dropped, not turned into NaN entries', () =>
    assert.deepEqual(parseList('8, abc, 4'), [8, 4]));
  it('a typed "Infinity" is rejected — the filter is finite, not just non-NaN', () =>
    assert.deepEqual(parseList('Infinity, 4'), [4]));
  it('a lone minus sign is dropped', () => assert.deepEqual(parseList('-, 2'), [2]));
  it('1e400 overflows to Infinity and is dropped rather than passed on', () =>
    assert.deepEqual(parseList('1e400, 3'), [3]));
});

describe('speedOfSoundAir() — the temperature field accepts anything typed', () => {
  it('20 °C is the classroom 343 m/s', () => assert.ok(Math.abs(speedOfSoundAir(20) - 343.2) < 0.3));
  it('absolute zero is exactly 0 m/s, not NaN', () => assert.equal(speedOfSoundAir(-273.15), 0));
  it('BELOW absolute zero yields NaN — which fmt() shows as "—", never a fake speed', () => {
    const v = speedOfSoundAir(-300);
    assert.ok(Number.isNaN(v), `expected NaN, got ${v}`);
    assert.equal(fmt(v), '—');
  });
});

describe('unitsFor() — unit cycling can never land on undefined', () => {
  it('an unknown unit subset falls back to the full list rather than an empty one', () =>
    assert.ok(unitsFor('length', ['parsec']).length > 0));
  it('an empty subset falls back to the full list', () => assert.ok(unitsFor('length', []).length > 0));
  it('every quantity used by a field has at least one unit', () => {
    for (const ws of WORKSPACES)
      for (const f of ws.fields)
        assert.ok(unitsFor(f.quantity, f.unitIds).length > 0, `${ws.id}/${f.key} has no units`);
  });
});

// ── calcPanel's guards, pinned as source contracts ──────────────────────────
// calcPanel.tsx carries JSX, so node cannot execute it. These assertions pin
// the four guards the sweep below assumes are in place; if one is deleted the
// sweep's exemption for non-finite numeric outputs stops being safe.
describe('calcPanel guards — the degenerate input never reaches a formula', () => {
  const src = readFileSync(path.join(CALC_DIR, 'calcPanel.tsx'), 'utf8');
  it('buildValues() refuses an EMPTY list field (no Math.max(...[]) downstream)', () =>
    assert.match(src, /if \(arr\.length === 0\) return null;/));
  it('buildValues() refuses a non-finite scalar (blank, "abc", 1e400)', () =>
    assert.match(src, /if \(!Number\.isFinite\(x\)\) return null;/));
  it('runCompute() catches a throwing formula instead of crashing the screen', () =>
    assert.match(src, /catch \{\s*return \{ outputs: \[\], steps: \[\], table: null, computeError: true \};/));
  it('formatOutput() sends every numeric result through fmt()', () =>
    assert.match(src, /fmt\(u\.fromBase\(o\.value\), sig\)/));
  it('unit cycling is modulo the unit count, so it wraps instead of indexing undefined', () =>
    assert.match(src, /units\[\(startIdx \+ unitOffset\) % units\.length\]/));
  it('the screen hides the chain SEND button for a non-finite result', () => {
    const screen = readFileSync(path.join(CALC_DIR, 'CalcWorkspaceScreen.tsx'), 'utf8');
    assert.match(screen, /o\.chainable !== false && Number\.isFinite\(o\.value\)/);
  });
});

// ── The sweep ───────────────────────────────────────────────────────────────

const BAD = /\bNaN\b|\bInfinity\b|\bundefined\b/;

/** Build a CalcValues with every input of `fn` set to one degenerate value. */
function valuesAt(ws: Workspace, fn: CalcFn, x: number, listLen: number): CalcValues {
  const v: Record<string, number | number[]> = {};
  for (const key of fn.inputs) {
    const field = ws.fields.find((f) => f.key === key);
    v[key] = field?.quantity === 'list' ? new Array(listLen).fill(x) : x;
  }
  return v as CalcValues;
}

type Pass = {
  threw: boolean;
  outputs: ReturnType<CalcFn['compute']>;
  steps: string[];
  table: ReturnType<NonNullable<CalcFn['table']>> | null;
};

/** One guarded compute pass — mirrors calcPanel.runCompute()'s try/catch. */
function run(fn: CalcFn, values: CalcValues): Pass {
  try {
    return {
      threw: false,
      outputs: fn.compute(values),
      steps: fn.steps ? fn.steps(values) : [],
      table: fn.table ? fn.table(values) : null,
    };
  } catch {
    return { threw: true, outputs: [], steps: [], table: null };
  }
}

/** Every user-visible STRING one compute pass can emit. */
function stringsOf(r: Pass): string[] {
  const out: string[] = [];
  for (const o of r.outputs) {
    out.push(o.label);
    if (!('value' in o)) out.push(o.text);
  }
  out.push(...r.steps);
  if (r.table) {
    if (r.table.title) out.push(r.table.title);
    out.push(...r.table.cols);
    for (const row of r.table.rows) out.push(...row);
  }
  return out;
}

const CASES: { name: string; x: number; listLen: number }[] = [
  { name: 'every input ZERO', x: 0, listLen: 3 },
  { name: 'every input −1', x: -1, listLen: 3 },
  { name: 'every input a large NEGATIVE', x: -1e6, listLen: 3 },
  { name: 'every input TINY', x: 1e-9, listLen: 3 },
  { name: 'every input HUGE', x: 1e12, listLen: 3 },
  { name: 'every input ONE', x: 1, listLen: 1 },
  { name: 'single-element lists', x: 2, listLen: 1 },
];

/** Run body over every (workspace, function, case) and collect complaints. */
function sweep(check: (ws: Workspace, fn: CalcFn, r: Pass, caseName: string) => string | null): string[] {
  const bad: string[] = [];
  for (const c of CASES)
    for (const ws of WORKSPACES)
      for (const fn of ws.functions) {
        const r = run(fn, valuesAt(ws, fn, c.x, c.listLen));
        // A throw is caught by the screen (the student sees the "check for
        // zeros" warning) and renders nothing, so there is nothing to check.
        if (r.threw) continue;
        const complaint = check(ws, fn, r, c.name);
        if (complaint) bad.push(`${ws.id}/${fn.key} @ ${c.name}: ${complaint}`);
      }
  return bad;
}

describe('degenerate-input sweep over every calculator formula', () => {
  it('the sweep actually covers the whole lab (not silently zero functions)', () => {
    assert.ok(WORKSPACES.length >= 50, `only ${WORKSPACES.length} workspaces loaded`);
    const fns = WORKSPACES.reduce((a, w) => a + w.functions.length, 0);
    assert.ok(fns >= 160, `only ${fns} functions loaded`);
  });

  it('no formula prints NaN/Infinity/undefined in a label, note, step or table cell', () => {
    const bad = sweep((_ws, _fn, r) => {
      const leaked = stringsOf(r).filter((s) => typeof s === 'string' && BAD.test(s));
      return leaked.length ? leaked.map((s) => JSON.stringify(s)).join(' · ') : null;
    });
    assert.deepEqual(bad, [], `a non-number reached the student as prose:\n${bad.join('\n')}`);
  });

  it('every numeric result renders as a number or "—" — never "NaN Hz"', () => {
    const bad = sweep((_ws, _fn, r) => {
      const leaked: string[] = [];
      for (const o of r.outputs) {
        if (!('value' in o)) continue;
        // Mirrors formatOutput(o, 4, 0): preferred unit, 4 sig figs.
        const units = unitsFor(o.quantity);
        const i = o.unit ? Math.max(0, units.findIndex((u) => u.id === o.unit)) : 0;
        const u = units[i % units.length];
        const shown = `${fmt(u.fromBase(o.value), 4)}${u.label ? ' ' + u.label : ''}`;
        if (BAD.test(shown)) leaked.push(`"${o.label}" → ${shown}`);
      }
      return leaked.length ? leaked.join(' · ') : null;
    });
    assert.deepEqual(bad, [], `a non-number reached the result glass:\n${bad.join('\n')}`);
  });

  it('no formula returns an empty output list — the glass is never blank', () => {
    const bad = sweep((_ws, _fn, r) => (r.outputs.length === 0 ? 'returned no outputs' : null));
    assert.deepEqual(bad, [], bad.join('\n'));
  });

  it('every result table stays rectangular — no row with the wrong cell count', () => {
    const bad = sweep((_ws, _fn, r) => {
      if (!r.table) return null;
      const n = r.table.cols.length;
      const ragged = r.table.rows
        .map((row, i) => (row.length === n ? null : `row ${i} has ${row.length} cells vs ${n} cols`))
        .filter((x): x is string => !!x);
      return ragged.length ? ragged.join(' · ') : null;
    });
    assert.deepEqual(bad, [], `ragged result tables:\n${bad.join('\n')}`);
  });

  it('no degenerate input makes a table run away (a loop bounded by a 0 input)', () => {
    const bad = sweep((_ws, _fn, r) =>
      r.table && r.table.rows.length > 512 ? `${r.table.rows.length} rows` : null,
    );
    assert.deepEqual(bad, [], `a table exploded on degenerate input:\n${bad.join('\n')}`);
  });

  it('every table cell is a string — an accidental number would render, a null would not', () => {
    const bad = sweep((_ws, _fn, r) => {
      if (!r.table) return null;
      for (const row of r.table.rows)
        for (const cell of row) if (typeof cell !== 'string') return `non-string cell ${JSON.stringify(cell)}`;
      return null;
    });
    assert.deepEqual(bad, [], bad.join('\n'));
  });
});

// ── The three leaks this sweep was written to catch, pinned individually ────
describe('the specific leaks found on 2026-09-11 (regression pins)', () => {
  const fnOf = (wsId: string, fnKey: string) => {
    const ws = getWorkspace(wsId);
    assert.ok(ws, `workspace ${wsId} is gone`);
    const fn = ws.functions.find((f) => f.key === fnKey);
    assert.ok(fn, `${wsId}/${fnKey} is gone`);
    return { ws, fn };
  };

  it('a 0 W amplifier no longer reads "Expect roughly NaN–NaN dB SPL"', () => {
    const { fn } = fnOf('speakerpower', 'maxspl');
    const out = fn.compute({ sens: 0, power: 0, dist: 0 });
    const note = out.find((o) => !('value' in o) && o.label === 'REALITY CHECK');
    assert.ok(note && !('value' in note));
    assert.ok(!BAD.test(note.text), note.text);
    assert.match(note.text, /—/);
  });

  it('a real 100 W / 96 dB / 10 m rig still gets its true reality-check numbers', () => {
    const { fn } = fnOf('speakerpower', 'maxspl');
    // 96 + 10·log10(100) − 20·log10(10) = 96 + 20 − 20 = 96 dB SPL.
    const out = fn.compute({ sens: 96, power: 100, dist: 10 });
    const max = out.find((o) => 'value' in o && o.label === 'MAX SPL AT THE LISTENER');
    assert.ok(max && 'value' in max);
    assert.ok(Math.abs(max.value - 96) < 1e-9, `${max.value}`);
    const note = out.find((o) => !('value' in o) && o.label === 'REALITY CHECK');
    assert.ok(note && !('value' in note));
    assert.match(note.text, /92–94 dB SPL/);
  });

  it('a 0 m cable run into 0 Ω no longer prints "NaN%" in the power-lost column', () => {
    const { fn } = fnOf('cable', 'recgauge');
    assert.ok(fn.table);
    const t = fn.table({ len: 0, z: 0, maxloss: 0 });
    for (const row of t.rows) for (const cell of row) assert.ok(!BAD.test(cell), cell);
  });

  it('a normal 30 m / 8 Ω run still shows a real power-lost percentage', () => {
    const { fn } = fnOf('cable', 'recgauge');
    assert.ok(fn.table);
    const t = fn.table({ len: 30, z: 8, maxloss: 0.5 });
    const lostCol = t.cols.indexOf('Power lost');
    assert.ok(lostCol >= 0);
    for (const row of t.rows) assert.match(row[lostCol], /^\d+\.\d%$/, row[lostCol]);
  });

  it('a temperature below absolute zero no longer prints "NaN" whole samples', () => {
    const { fn } = fnOf('distdelay', 'distToDelay');
    assert.ok(fn.table);
    const t = fn.table({ dist: 10, temp: -1e6 });
    for (const row of t.rows) for (const cell of row) assert.ok(!BAD.test(cell), cell);
    // The EXACT and NEAREST columns now agree that the answer is unknown.
    for (const row of t.rows) assert.equal(row[2], '—');
  });

  it('a normal 20 °C / 10 m delay still reports its true whole-sample counts', () => {
    const { fn } = fnOf('distdelay', 'distToDelay');
    assert.ok(fn.table);
    const t = fn.table({ dist: 10, temp: 20 });
    // 10 m ÷ ~343.2 m/s ≈ 29.14 ms → ~1285 samples at 44.1 kHz.
    assert.match(t.rows[0][2], /^12[89]\d$/, t.rows[0][2]);
    for (const row of t.rows) assert.match(row[2], /^\d+$/, row[2]);
  });
});

// ── Registry integrity ──────────────────────────────────────────────────────
describe('registry integrity — the sweep is only as good as the wiring', () => {
  it('every fn.inputs key resolves to a field in its own workspace', () => {
    const bad: string[] = [];
    for (const ws of WORKSPACES) {
      const keys = new Set(ws.fields.map((f) => f.key));
      for (const fn of ws.functions)
        for (const k of fn.inputs) if (!keys.has(k)) bad.push(`${ws.id}/${fn.key} → missing field "${k}"`);
    }
    assert.deepEqual(bad, [], bad.join('\n'));
  });

  it('workspace ids are unique — getWorkspace() is never ambiguous', () => {
    const seen = new Set<string>();
    for (const ws of WORKSPACES) {
      assert.ok(!seen.has(ws.id), `duplicate workspace id ${ws.id}`);
      seen.add(ws.id);
    }
  });

  it('function keys are unique inside each workspace', () => {
    for (const ws of WORKSPACES) {
      const seen = new Set<string>();
      for (const fn of ws.functions) {
        assert.ok(!seen.has(fn.key), `duplicate function key ${ws.id}/${fn.key}`);
        seen.add(fn.key);
      }
    }
  });

  it('no function declares zero inputs — every one has something to ask for', () => {
    for (const ws of WORKSPACES)
      for (const fn of ws.functions) assert.ok(fn.inputs.length > 0, `${ws.id}/${fn.key} has no inputs`);
  });
});
