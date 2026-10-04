/**
 * Pattern hunt phase 2, wave 3 (2026-10-02) — P16 calculator numeric edges and
 * P17 float rounding on whole-number results. Owner rule: the calculators are
 * a 100% accurate, legal- and safety-grade source of truth.
 *
 *  R1 every field of every workspace declares a SIGN CLASS (its kind,
 *     `nonNegative`, or `signed`) — an unclassified field FAILS. 64 of 257 had
 *     none before this pass; the count is now 0 and this keeps it there.
 *  R2 count-named fields declare `integer` (allowlist with reasons, shrink-only);
 *     a fraction or an out-of-range value is an ERROR, never a confident answer.
 *  R3 snapWhole (shared, calcUnits) — every Math.ceil / Math.floor in a
 *     workspace goes through it, or is on the per-file allowlist with a reason.
 *  R4 behavioural sweeps: FIR taps and treatment panels match exact rational
 *     arithmetic; no step / text / table quotes a whole count rounded to 4
 *     figures (a 65536-point FFT quoted as "65540 points").
 *  R5 typed-number parsing in the calculators goes through parseQuantity.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

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
const SRC = path.resolve(HERE, '../src');
const CALC_DIR = path.join(SRC, 'screens/lab/calc');
const WS_DIR = path.join(CALC_DIR, 'workspaces');
const read = (p: string) => readFileSync(p, 'utf8');

const { WORKSPACES } = await import('../src/screens/lab/calc/registry.ts');
const U = await import('../src/screens/lab/calc/calcUnits.ts');
const { NON_NEGATIVE_KINDS, signClass, negativeInput, parseList, parseQuantity, unitsFor, fmt } = U;
// Optional until the shared pieces exist — the R2 run against the pre-fix
// tree must FAIL on assertions, not on a missing export.
const snapWhole: (x: number) => number = (U as Record<string, unknown>).snapWhole as never ?? ((x: number) => x);
const domainError = ((U as Record<string, unknown>).domainError ?? (() => null)) as (
  fn: { inputs: string[] },
  values: Record<string, number | number[]>,
  fields: unknown[],
) => string | null;

type Workspace = (typeof WORKSPACES)[number];
type Field = Workspace['fields'][number] & { signed?: boolean; integer?: boolean; range?: readonly [number, number] };
type Fn = Workspace['functions'][number];

const allFields: { ws: Workspace; f: Field }[] = WORKSPACES.flatMap((ws) => ws.fields.map((f) => ({ ws, f: f as Field })));

// ── R1: every field is classified ───────────────────────────────────────────
describe('P16 R1 — every calculator field declares a sign class', () => {
  it('no field is unclassified (kind, nonNegative or signed)', () => {
    const missing = allFields.filter(({ f }) => signClass(f) === null).map(({ ws, f }) => `${ws.id}.${f.key} (${f.name}, ${f.quantity})`);
    assert.deepEqual(missing, [], `unclassified fields — say whether a negative is a real value:\n${missing.join('\n')}`);
  });
  it('the classes do not contradict each other', () => {
    for (const { ws, f } of allFields) {
      const id = `${ws.id}.${f.key}`;
      if (f.signed) {
        assert.ok(!NON_NEGATIVE_KINDS.has(f.quantity), `${id}: signed on a non-negative kind`);
        assert.ok(!f.nonNegative, `${id}: both signed and nonNegative`);
      }
      if (f.range) {
        assert.ok(f.range[0] <= f.range[1], `${id}: empty range`);
        assert.equal(f.range[0] >= 0, signClass(f) === 'nonNegative', `${id}: range sign disagrees with its class`);
      }
      if (f.integer) assert.notEqual(f.quantity, 'list', `${id}: integer on a list`);
    }
  });
  it('the census is what this pass classified (257 fields across 55 workspaces)', () => {
    assert.equal(WORKSPACES.length >= 55, true);
    assert.equal(allFields.length >= 257, true);
  });
});

// ── R2: counts are whole, ranges are enforced ───────────────────────────────
/** Count-named fields that are deliberately NOT integer. Shrink-only. */
const INTEGER_EXEMPT: Record<string, string> = {
  'bitdepth.bits': 'dynamic range FOR N bits — an effective bit count (ENOB 15.5) is a real input',
  'cable.awg': 'a fraction is rounded to the nearest whole gauge, as the field help says (0–40 enforced by nearestAwg)',
  'distdelay.smp': 'samples → time: a fractional-sample delay is a real quantity',
  'latency.smp': 'samples → time: a fractional-sample delay is a real quantity',
  'clockdrift.maxSlip': 'a slip budget may be a fraction of a sample',
};
const COUNT_NAME = /CHANNELS|\bCOUNT\b|NUMBER OF|BUFFER|FFT SIZE|BLOCK SIZE|TRACK|MIDI NOTE|BIT DEPTH|AWG|GAUGE|PRIME N|LOSSY|^SAMPLES$|SLIP BUDGET/;

describe('P16 R2 — whole-number counts and ranged values', () => {
  it('every count-named field is integer, or exempt with a reason', () => {
    const missing = allFields
      .filter(({ f }) => COUNT_NAME.test(f.name) && !f.integer)
      .map(({ ws, f }) => `${ws.id}.${f.key}`)
      .filter((id) => !(id in INTEGER_EXEMPT));
    assert.deepEqual(missing, [], `count fields without integer: ${missing.join(', ')}`);
  });
  it('the exemption list only shrinks: every entry still exists and is still non-integer', () => {
    for (const id of Object.keys(INTEGER_EXEMPT)) {
      const hit = allFields.find(({ ws, f }) => `${ws.id}.${f.key}` === id);
      assert.ok(hit, `${id} no longer exists — remove it from INTEGER_EXEMPT`);
      assert.ok(!hit.f.integer, `${id} is integer now — remove it from INTEGER_EXEMPT`);
    }
  });
  const field = (ws: string, key: string) => allFields.find((x) => x.ws.id === ws && x.f.key === key)!;
  const fieldsOf = (ws: string) => WORKSPACES.find((w) => w.id === ws)!.fields;
  it('a fractional count is an error, by name', () => {
    assert.equal(domainError({ inputs: ['nspk'] }, { nspk: 2.5 }, fieldsOf('speakerpower')), 'NUMBER OF SPEAKERS must be a whole number.');
    assert.equal(domainError({ inputs: ['channels'] }, { channels: 64 }, fieldsOf('netaudio')), null);
    // A carried value that is whole up to float noise is whole.
    assert.equal(domainError({ inputs: ['N'] }, { N: 1023.9999999999999 }, fieldsOf('fft')), null);
  });
  it('a ranged value outside its range is an error', () => {
    assert.equal(domainError({ inputs: ['midi'] }, { midi: 128 }, fieldsOf('pitch')), 'MIDI NOTE NUMBER must be from 0 to 127.');
    assert.equal(domainError({ inputs: ['lossy'] }, { lossy: 2 }, fieldsOf('loudtp')), 'LOSSY DELIVERY? must be from 0 to 1.');
    assert.equal(domainError({ inputs: ['lossy'] }, { lossy: 0.5 }, fieldsOf('loudtp')), 'LOSSY DELIVERY? must be a whole number.');
    assert.equal(domainError({ inputs: ['awg'] }, { awg: -1 }, fieldsOf('vdrop')), null, '2/0 AWG is −1');
    assert.equal(domainError({ inputs: ['awg'] }, { awg: 41 }, fieldsOf('vdrop')), 'WIRE GAUGE (AWG) must be from -3 to 40.');
  });
  it('fields newly closed to negatives refuse them by name', () => {
    for (const [ws, key] of [['spladd', 'delta'], ['level', 'ampRatio'], ['level', 'powRatio'], ['cable', 'awg'], ['diffuser', 'N']] as const) {
      const f = field(ws, key).f;
      assert.equal(negativeInput({ inputs: [key] }, { [key]: -1 }, [f])?.name, f.name, `${ws}.${key}`);
    }
  });
  it('runCompute refuses a domain error before the formula, and both screens say why', () => {
    const panel = read(path.join(CALC_DIR, 'calcPanel.tsx'));
    assert.match(panel, /const domain = fields \? domainError\(fn, values, fields\) : null;\s*if \(domain\) return \{[^}]*computeError: true, inputError: domain \}/);
    assert.match(panel, /domainMsg\(field, baseVal\)/, 'FieldRow warns live');
    assert.match(read(path.join(CALC_DIR, 'CalcWorkspaceScreen.tsx')), /inputError\s*\?\s*`⚠ \$\{inputError\}`/);
    assert.match(read(path.join(CALC_DIR, 'CalcWorkflowRunScreen.tsx')), /cur\.result\.inputError\s*\?\s*`⚠ \$\{cur\.result\.inputError\}`/);
  });
});

// ── helpers: base values from each field's placeholder ──────────────────────
function baseValue(f: Field, raw: string): number | number[] | null {
  if (f.quantity === 'list') {
    const a = parseList(raw);
    return a.length ? a : null;
  }
  const typed = parseQuantity(raw);
  if (typed === null) return null;
  const units = unitsFor(f.quantity, f.unitIds);
  const i = f.defaultUnit ? Math.max(0, units.findIndex((u) => u.id === f.defaultUnit)) : 0;
  return units[i].toBase(typed);
}
function placeholders(ws: Workspace): Record<string, number | number[]> | null {
  const out: Record<string, number | number[]> = {};
  for (const f of ws.fields as Field[]) {
    const v = baseValue(f, f.placeholder ?? '');
    if (v === null) return null;
    out[f.key] = v;
  }
  return out;
}
/** Mirrors calcPanel.runCompute: negative / domain refusals, then a guarded compute. */
function run(ws: Workspace, fn: Fn, values: Record<string, number | number[]>) {
  if (negativeInput(fn, values, ws.fields) || domainError(fn, values, ws.fields)) return null;
  try {
    const outputs = fn.compute(values);
    const steps = fn.steps ? fn.steps(values) : [];
    const table = fn.table ? fn.table(values) : null;
    return { outputs, steps, table };
  } catch {
    return null;
  }
}
const textsOf = (r: NonNullable<ReturnType<typeof run>>) => [
  ...r.steps,
  ...r.outputs.map((o) => ('text' in o ? `${o.label} ${o.text}` : o.label)),
  ...(r.table ? r.table.rows.flat() : []),
];

// ── R3/R4: P17 whole-number results ─────────────────────────────────────────
describe('P17 — whole-number results are exact', () => {
  it('snapWhole: noise snaps, genuine fractions do not', () => {
    assert.equal(snapWhole(800.0000000000001), 800);
    assert.equal(snapWhole(22.999999999999996), 23);
    assert.equal(snapWhole(0.5), 0.5);
    assert.equal(snapWhole(1e-12), 0);
    assert.equal(snapWhole(-0.0000000000001), 0);
    assert.ok(Object.is(snapWhole(-1e-15), 0), 'never -0');
    assert.ok(Number.isNaN(snapWhole(NaN)));
  });
  const fnOf = (ws: string, key: string) => {
    const w = WORKSPACES.find((x) => x.id === ws)!;
    return { w, fn: w.functions.find((f) => f.key === key)! };
  };
  const num = (outs: ReturnType<Fn['compute']>, label: string) => {
    const o = outs.find((x) => x.label === label);
    return o && 'value' in o ? o.value : NaN;
  };
  it('FIR taps: 48 kHz, 330 Hz transition, 121 dB is exactly 800 taps (was 801)', () => {
    const { fn } = fnOf('firlen', 'sizeTaps');
    assert.equal(num(fn.compute({ sr: 48000, trans: 330, atten: 121 }), 'FILTER TAPS (N)'), 800);
    assert.match(fn.steps!({ sr: 48000, trans: 330, atten: 121 }).join(' '), /= 800 taps/);
  });
  it('FIR taps match exact integer arithmetic across a realistic grid', () => {
    const { fn } = fnOf('firlen', 'sizeTaps');
    const bad: string[] = [];
    for (const sr of [44100, 48000, 96000]) for (let tr = 5; tr <= 1500; tr += 5) for (let at = 20; at <= 140; at++) {
      const got = num(fn.compute({ sr, trans: tr, atten: at }), 'FILTER TAPS (N)');
      const n = BigInt(sr * at), d = BigInt(22 * tr);
      const ex = Number((n + d - 1n) / d);
      if (got !== ex) bad.push(`${sr}/${tr}/${at}: ${got} ≠ ${ex}`);
    }
    assert.deepEqual(bad.slice(0, 5), []);
  });
  it('treatment panels: 100 m³, RT60 1.0 → 0.5 s, 1 m² panels at α 0.7 is exactly 23 (was 24)', () => {
    const { fn } = fnOf('treatment', 'panels');
    const v = { vol: 100, rtCur: 1, rtTgt: 0.5, panelArea: 1, alpha: 0.7 };
    assert.equal(num(fn.compute(v), 'PANELS NEEDED'), 23);
  });
  it('treatment panels match exact rational arithmetic across a realistic grid', () => {
    const { fn } = fnOf('treatment', 'panels');
    const bad: string[] = [];
    for (const V of [30, 60, 100, 150, 250]) for (let c = 4; c <= 25; c++) for (let t = 2; t < c; t++) for (const a100 of [50, 72, 100, 120, 150, 240]) for (let al = 10; al <= 20; al++) {
      const got = num(fn.compute({ vol: V, rtCur: c / 10, rtTgt: t / 10, panelArea: a100 / 100, alpha: al / 20 }), 'PANELS NEEDED');
      // ΔA/per = 0.161·V·(10/t − 10/c) ÷ (a/100 · al/20)
      const n = 161n * BigInt(V) * BigInt(c - t) * 10n * 20n * 100n;
      const d = 1000n * BigInt(t) * BigInt(c) * BigInt(a100) * BigInt(al);
      const ex = Number((n + d - 1n) / d);
      if (got !== ex) bad.push(`V${V} ${c / 10}→${t / 10} s ${a100 / 100} m² α${al / 20}: ${got} ≠ ${ex}`);
    }
    assert.deepEqual(bad.slice(0, 5), []);
  });

  // Every Math.ceil / Math.floor in a workspace goes through snapWhole, or the
  // file's remaining count is on this allowlist with its reason. Shrink-only.
  const UNSNAPPED_ALLOWED: Record<string, { n: number; why: string }> = {
    'digitalAdv.ts': { n: 3, why: 'timecode table: floor of an INTEGER ÷ INTEGER (frames ÷ whole fps, seconds ÷ 3600/60) — exact in binary' },
    'roomsMusic.ts': { n: 2, why: 'note naming: floor(r / 12) of an already-rounded MIDI integer' },
    'speakers.ts': { n: 1, why: 'nearestAwg: floor(g + 0.5) is a ROUND to the nearest gauge, not a count' },
    'timePhase.ts': { n: 6, why: 'ROUNDED DOWN / UP (2) and the Floor/Ceiling table rows (2) act on N already snapped by denoise (= snapWhole); the next power of two (2) is ceil(log2(snapWhole(N)))' },
  };
  it('no unsnapped Math.ceil / Math.floor in the workspaces beyond the allowlist', () => {
    const over: string[] = [];
    for (const file of readdirSync(WS_DIR).filter((f) => f.endsWith('.ts'))) {
      const src = read(path.join(WS_DIR, file));
      const n = (src.match(/Math\.(ceil|floor)\((?!snapWhole\()/g) ?? []).length;
      const allowed = UNSNAPPED_ALLOWED[file]?.n ?? 0;
      if (n > allowed) over.push(`${file}: ${n} unsnapped (allowed ${allowed})`);
      if (n < allowed) over.push(`${file}: only ${n} left — lower its allowlist count to ${n}`);
    }
    assert.deepEqual(over, []);
  });
  it('timePhase uses the shared snapWhole, not a private copy', () => {
    const src = read(path.join(WS_DIR, 'timePhase.ts'));
    assert.ok(src.includes('const denoise = snapWhole;'), 'timePhase must alias the shared snapWhole');
    assert.ok(!/const denoise = \(x: number\)/.test(src), 'no private denoise body');
  });

  // No step / text / table quotes a whole count at 4 significant figures.
  it('whole counts are quoted exactly in steps, text answers and tables', () => {
    const bad: string[] = [];
    let checked = 0;
    const BIG = 16385; // fmt(16385) = "16390"
    for (const ws of WORKSPACES) {
      const base = placeholders(ws);
      if (!base) continue;
      for (const fn of ws.functions) {
        const ints = (ws.fields as Field[]).filter((f) => fn.inputs.includes(f.key) && f.integer && !f.range);
        const trials: Record<string, number | number[]>[] = [base, ...ints.map((f) => ({ ...base, [f.key]: BIG }))];
        for (const values of trials) {
          const r = run(ws, fn, values);
          if (!r) continue;
          checked++;
          const counts = new Set<number>();
          for (const f of ints) counts.add(values[f.key] as number);
          for (const o of r.outputs) {
            if ('value' in o && (o.quantity === 'samples' || o.quantity === 'number')) {
              const s = snapWhole(o.value);
              if (Number.isInteger(s)) counts.add(s);
            }
          }
          const texts = textsOf(r);
          for (const c of counts) {
            if (Math.abs(c) < 1e4 || Math.abs(c) >= 1e7) continue;
            const rounded = fmt(c, 4);
            if (rounded === String(c)) continue;
            const re = new RegExp(`(^|[^\\d.])${rounded.replace('.', '\\.')}(?![\\d.])`);
            for (const t of texts) if (re.test(t)) bad.push(`${ws.id}.${fn.key}: "${rounded}" for ${c} in: ${t.slice(0, 90)}`);
          }
        }
      }
    }
    assert.ok(checked > 150, `swept ${checked} function runs`);
    assert.deepEqual(bad, []);
  });
});

// ── R5: typed numbers go through parseQuantity ──────────────────────────────
describe('P16 R5 — calculator parse sites', () => {
  /** `Number(` / parseFloat sites in src/screens/lab/calc that are NOT typed
   *  text, with reasons. Shrink-only. */
  const NUMBER_ALLOWED: Record<string, { n: number; why: string }> = {
    'calcUnits.ts': { n: 2, why: 'inside fmt (toPrecision round-trip) and parseQuantity itself, after its strict regex' },
  };
  it('no parseFloat / parseInt anywhere in the calculators; Number( only at allowlisted sites', () => {
    const over: string[] = [];
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]));
    for (const abs of walk(CALC_DIR).filter((f) => /\.tsx?$/.test(f))) {
      const rel = path.relative(CALC_DIR, abs).replace(/\\/g, '/');
      const code = read(abs).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
      if (/\bparse(Float|Int)\(/.test(code)) over.push(`${rel}: parseFloat/parseInt — use parseQuantity`);
      const n = (code.match(/(?<![\w.])Number\(/g) ?? []).length;
      const allowed = NUMBER_ALLOWED[rel]?.n ?? 0;
      if (n > allowed) over.push(`${rel}: ${n} Number( (allowed ${allowed})`);
      if (n < allowed) over.push(`${rel}: only ${n} Number( left — lower its allowlist count to ${n}`);
    }
    assert.deepEqual(over, []);
  });
  it('the typed-number entry points use parseQuantity', () => {
    assert.match(read(path.join(CALC_DIR, 'calcPanel.tsx')), /const typed = parseQuantity\(text\);/);
    assert.match(read(path.join(CALC_DIR, 'CalcWorkflowRunScreen.tsx')), /parseQuantity\(raw\)/);
    assert.match(read(path.join(CALC_DIR, 'CalcProjectsScreen.tsx')), /parseQuantity\(v\.raw\)/);
  });
});
