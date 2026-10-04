/**
 * Receipt calcAmpacity — owner rulings 2026-10-04.
 *
 *  1. ADD an ampacity calculator (NEC 2023, copper building wire): Table 310.16
 *     base, Table 310.15(B)(1)(1) ambient correction, Table 310.15(C)(1)
 *     adjustment, the 110.14(C) termination limit, the 240.4(D) small-conductor
 *     limits and the 210.19/210.20 80% continuous figure. Flexible cord, an
 *     ambient above the insulation rating, a size not in the table and any
 *     impossible input are refused IN WORDS. Voltage Drop points at it.
 *  2. Loudness Normalization's COMMON LOUDNESS TARGETS verified against each
 *     publisher: playback levels are marked as such, unpublished tolerances
 *     are not claimed, every row has a source, and the table carries the
 *     "they change" note.
 *
 * Every expected number below is written by hand from the published tables —
 * never by calling the app. All of it fails on HEAD (no 'ampacity' workspace;
 * the old 4-row, 3-column loudness table).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { WORKSPACES, getWorkspace } = await import('../src/screens/lab/calc/registry.ts');
const { WORKFLOW_TEMPLATES, listCalculators } = await import('../src/screens/lab/calc/workflowCatalog.ts');
const { signClass } = await import('../src/screens/lab/calc/calcUnits.ts');

type Out = { label: string; value?: number; text?: string; refusal?: true; quantity?: string };
type Fn = {
  key: string;
  inputs: string[];
  note?: string;
  compute: (v: Record<string, unknown>) => Out[];
  steps?: (v: Record<string, unknown>) => string[];
  table?: (v: Record<string, unknown>) => { title?: string; cols: string[]; rows: string[][] };
};
type Field = { key: string; name: string; quantity: string; signed?: boolean; nonNegative?: boolean; integer?: boolean; range?: readonly [number, number] };
type Ws = { id: string; name: string; section: string; warnings?: string; example: string; accuracyDetail?: string; fields: Field[]; functions: Fn[] };

const ws = (id: string) => (WORKSPACES as unknown as Ws[]).find((w) => w.id === id);
const AMP = () => {
  const w = ws('ampacity');
  assert.ok(w, 'no ampacity workspace');
  return w!;
};
const fn = (w: string, k: string) => ws(w)!.functions.find((f) => f.key === k)!;
const run = (k: string, v: Record<string, unknown>) => {
  const f = AMP().functions.find((x) => x.key === k);
  assert.ok(f, `no ampacity function ${k}`);
  return f!.compute(v);
};
const num = (o: Out[], label: string) => {
  const r = o.find((x) => x.label === label);
  assert.ok(r && typeof r.value === 'number', `no numeric "${label}" in ${JSON.stringify(o.map((x) => x.label))}`);
  return r!.value!;
};
const close = (a: number, b: number) => assert.ok(Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b)), `${a} ≠ ${b}`);
const refusedInWords = (o: Out[], re: RegExp) => {
  assert.ok(o.some((x) => x.refusal === true), `expected a refusal: ${JSON.stringify(o)}`);
  assert.ok(o.every((x) => !('value' in x)), 'a refusal prints no number');
  assert.match(o.map((x) => x.text ?? '').join(' '), re);
};

// ── NEC 2023 Table 310.16, copper, [60, 75, 90] °C — hand-copied from the
//    published table (identical in the 2020 edition). null = "—".
const T310_16: [string, number | null, number | null, number][] = [
  ['18 AWG', null, null, 14], ['16 AWG', null, null, 18],
  ['14 AWG', 15, 20, 25], ['12 AWG', 20, 25, 30], ['10 AWG', 30, 35, 40], ['8 AWG', 40, 50, 55],
  ['6 AWG', 55, 65, 75], ['4 AWG', 70, 85, 95], ['3 AWG', 85, 100, 115], ['2 AWG', 95, 115, 130],
  ['1 AWG', 110, 130, 145], ['1/0 AWG', 125, 150, 170], ['2/0 AWG', 145, 175, 195], ['3/0 AWG', 165, 200, 225], ['4/0 AWG', 195, 230, 260],
];
const T310_16_KCMIL: [number, number, number, number][] = [
  [250, 215, 255, 290], [300, 240, 285, 320], [350, 260, 310, 350], [400, 280, 335, 380], [500, 320, 380, 430],
  [600, 350, 420, 475], [700, 385, 460, 520], [750, 400, 475, 535], [800, 410, 490, 555], [900, 435, 520, 585],
  [1000, 455, 545, 615], [1250, 495, 590, 665], [1500, 525, 625, 705], [1750, 545, 650, 735], [2000, 555, 665, 750],
];
// Table 310.15(B)(1)(1), 30 °C basis: row, [60, 75, 90].
const T_AMBIENT: [string, string, string, string][] = [
  ['10 or less', '1.29', '1.20', '1.15'], ['11–15', '1.22', '1.15', '1.12'], ['16–20', '1.15', '1.11', '1.08'],
  ['21–25', '1.08', '1.05', '1.04'], ['26–30', '1.00', '1.00', '1.00'], ['31–35', '0.91', '0.94', '0.96'],
  ['36–40', '0.82', '0.88', '0.91'], ['41–45', '0.71', '0.82', '0.87'], ['46–50', '0.58', '0.75', '0.82'],
  ['51–55', '0.41', '0.67', '0.76'], ['56–60', '—', '0.58', '0.71'], ['61–65', '—', '0.47', '0.65'],
  ['66–70', '—', '0.33', '0.58'], ['71–75', '—', '—', '0.50'], ['76–80', '—', '—', '0.41'], ['81–85', '—', '—', '0.29'],
];

describe('calcAmpacity — the calculator exists and is registered with the house conventions', () => {
  it('an ELECTRONICS workspace "Conductor Ampacity (NEC)" with awg / kcmil / factors', () => {
    const w = AMP();
    assert.equal(w.name, 'Conductor Ampacity (NEC)');
    assert.equal(w.section, 'electronics');
    assert.deepEqual(w.functions.map((f) => f.key), ['awg', 'kcmil', 'factors']);
    assert.ok(getWorkspace('ampacity'));
    assert.ok(listCalculators().some((c: { workspaceId: string }) => c.workspaceId === 'ampacity'));
  });
  it('every field has a sign/range class; sizes, ratings and counts are whole numbers', () => {
    for (const f of AMP().fields) assert.notEqual(signClass(f as never), null, f.key);
    const by = (k: string) => AMP().fields.find((f) => f.key === k)!;
    assert.deepEqual([by('awg').integer, by('awg').range], [true, [-3, 18]]);
    assert.deepEqual([by('kcmil').integer, by('kcmil').range], [true, [250, 2000]]);
    assert.deepEqual([by('insul').integer, by('term').integer, by('ccc').integer], [true, true, true]);
    assert.equal(by('ambient').quantity, 'temperature');
    assert.equal(by('ambient').signed, true);
  });
});

describe('calcAmpacity — the full published tables, pinned', () => {
  it('Table 310.16 copper, 18 AWG–4/0 (tables view)', () => {
    const t = fn('ampacity', 'awg').table!({ awg: 12, insul: 90, term: 60, ambient: 30, ccc: 3 });
    assert.match(t.title ?? '', /2023 TABLE 310\.16 — COPPER/);
    assert.deepEqual(t.cols, ['Size', '60 °C', '75 °C', '90 °C']);
    assert.deepEqual(
      t.rows.map((r) => r.map((c) => c.replace('▸ ', ''))),
      T310_16.map(([s, a, b, c]) => [s, a === null ? '—' : String(a), b === null ? '—' : String(b), String(c)]),
    );
    assert.ok(t.rows.find((r) => r[0] === '▸ 12 AWG'), 'the entered size is marked');
  });
  it('Table 310.16 copper, 250–2000 kcmil (tables view)', () => {
    const t = fn('ampacity', 'kcmil').table!({ kcmil: 500, insul: 90, term: 75, ambient: 30, ccc: 3 });
    assert.deepEqual(
      t.rows.map((r) => r.map((c) => c.replace('▸ ', ''))),
      T310_16_KCMIL.map((r) => r.map(String)),
    );
  });
  it('Table 310.15(B)(1)(1) ambient correction (tables view)', () => {
    const t = fn('ampacity', 'factors').table!({ insul: 90, ambient: 30, ccc: 3 });
    assert.deepEqual(t.rows.map((r) => r.map((c) => c.replace('▸ ', ''))), T_AMBIENT);
  });
  it('every Table 310.16 cell reaches the result unchanged (30 °C, 3 conductors, matching terminals)', () => {
    const g = new Map([['18 AWG', 18], ['16 AWG', 16], ['14 AWG', 14], ['12 AWG', 12], ['10 AWG', 10], ['8 AWG', 8], ['6 AWG', 6], ['4 AWG', 4], ['3 AWG', 3], ['2 AWG', 2], ['1 AWG', 1], ['1/0 AWG', 0], ['2/0 AWG', -1], ['3/0 AWG', -2], ['4/0 AWG', -3]]);
    for (const [s, a, b, c] of T310_16) {
      if (s === '18 AWG' || s === '16 AWG') continue; // refused, see below
      close(num(run('awg', { awg: g.get(s), insul: 60, term: 60, ambient: 30, ccc: 3 }), 'TABLE 310.16 AMPACITY'), a!);
      close(num(run('awg', { awg: g.get(s), insul: 75, term: 75, ambient: 30, ccc: 3 }), 'TABLE 310.16 AMPACITY'), b!);
      close(num(run('awg', { awg: g.get(s), insul: 90, term: 75, ambient: 30, ccc: 3 }), 'TABLE 310.16 AMPACITY'), c);
    }
    for (const [k, a, b, c] of T310_16_KCMIL) {
      close(num(run('kcmil', { kcmil: k, insul: 60, term: 60, ambient: 30, ccc: 3 }), 'TABLE 310.16 AMPACITY'), a);
      close(num(run('kcmil', { kcmil: k, insul: 75, term: 75, ambient: 30, ccc: 3 }), 'TABLE 310.16 AMPACITY'), b);
      close(num(run('kcmil', { kcmil: k, insul: 90, term: 75, ambient: 30, ccc: 3 }), 'TABLE 310.16 AMPACITY'), c);
    }
  });
  it('every ambient row boundary, every column', () => {
    const hi = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85];
    T_AMBIENT.forEach((row, i) => {
      for (const [ci, ins] of [[1, 60], [2, 75], [3, 90]] as const) {
        for (const t of [hi[i], i === 0 ? -40 : hi[i - 1] + 1]) {
          const o = run('factors', { insul: ins, ambient: t, ccc: 3 });
          if (row[ci] === '—' || t > ins) assert.ok(o.some((x) => x.refusal), `${t} °C, ${ins} °C column should refuse`);
          else close(num(o, 'AMBIENT CORRECTION FACTOR'), Number(row[ci]));
        }
      }
    });
  });
  it('Table 310.15(C)(1) adjustment, every row edge', () => {
    const want: [number, number][] = [[1, 1], [3, 1], [4, 0.8], [6, 0.8], [7, 0.7], [9, 0.7], [10, 0.5], [20, 0.5], [21, 0.45], [30, 0.45], [31, 0.4], [40, 0.4], [41, 0.35], [200, 0.35]];
    for (const [c, f] of want) close(num(run('factors', { insul: 90, ambient: 30, ccc: c }), 'CONDUCTOR-COUNT ADJUSTMENT FACTOR'), f);
  });
  it('240.4(D): 14 AWG 15 A, 12 AWG 20 A, 10 AWG 30 A; none from 8 AWG up', () => {
    for (const [g, a] of [[14, 15], [12, 20], [10, 30]]) close(num(run('awg', { awg: g, insul: 90, term: 75, ambient: 30, ccc: 3 }), 'MAX OVERCURRENT DEVICE (240.4(D))'), a);
    const r = run('awg', { awg: 8, insul: 90, term: 75, ambient: 30, ccc: 3 }).find((x) => x.label === 'MAX OVERCURRENT DEVICE (240.4(D))')!;
    assert.equal(r.value, undefined);
    assert.match(r.text ?? '', /14, 12 and 10 AWG only/);
  });
});

describe('calcAmpacity — hand vectors (at least two per function)', () => {
  it('awg #1: 12 AWG THHN, 40 °C, 6 conductors, 60 °C terminals → 21.84 / 20 / 20 A breaker / 16 A continuous', () => {
    const o = run('awg', { awg: 12, insul: 90, term: 60, ambient: 40, ccc: 6 });
    close(num(o, 'TABLE 310.16 AMPACITY'), 30);
    close(num(o, 'AMBIENT CORRECTION FACTOR'), 0.91);
    close(num(o, 'CONDUCTOR-COUNT ADJUSTMENT FACTOR'), 0.8);
    close(num(o, 'CORRECTED AMPACITY'), 30 * 0.91 * 0.8);
    close(num(o, 'TERMINATION LIMIT (60 °C TERMINALS)'), 20);
    close(num(o, 'ALLOWABLE AMPACITY'), 20);
    close(num(o, 'MAX OVERCURRENT DEVICE (240.4(D))'), 20);
    close(num(o, 'MAX CONTINUOUS LOAD (80%)'), 16);
  });
  it('awg #2: 4/0 at 75 °C, 30 °C, 3 conductors, 75 °C terminals → 230 A, 184 A continuous', () => {
    const o = run('awg', { awg: -3, insul: 75, term: 75, ambient: 30, ccc: 3 });
    close(num(o, 'CORRECTED AMPACITY'), 230);
    close(num(o, 'ALLOWABLE AMPACITY'), 230);
    close(num(o, 'MAX CONTINUOUS LOAD (80%)'), 184);
  });
  it('awg #3 (cold, crowded): 10 AWG 90 °C at −20 °C, 12 conductors, 75 °C terminals → 23 A', () => {
    const o = run('awg', { awg: 10, insul: 90, term: 75, ambient: -20, ccc: 12 });
    close(num(o, 'AMBIENT CORRECTION FACTOR'), 1.15);
    close(num(o, 'CONDUCTOR-COUNT ADJUSTMENT FACTOR'), 0.5);
    close(num(o, 'CORRECTED AMPACITY'), 40 * 1.15 * 0.5);
    close(num(o, 'ALLOWABLE AMPACITY'), 23); // below the 35 A terminal limit
    close(num(o, 'MAX CONTINUOUS LOAD (80%)'), 23); // min(23 corrected, 0.8×35 = 28, 0.8×30 A breaker = 24)
  });
  it('awg #4 (fraction of a degree): 14 AWG 75 °C at 30.2 °C reads as 31 °C → × 0.94; continuous held by the 15 A breaker', () => {
    const o = run('awg', { awg: 14, insul: 75, term: 75, ambient: 30.2, ccc: 3 });
    close(num(o, 'AMBIENT CORRECTION FACTOR'), 0.94);
    close(num(o, 'CORRECTED AMPACITY'), 20 * 0.94);
    close(num(o, 'MAX CONTINUOUS LOAD (80%)'), 12);
    assert.match(fn('ampacity', 'awg').steps!({ awg: 14, insul: 75, term: 75, ambient: 30.2, ccc: 3 }).join(' '), /read as 31 °C/);
  });
  it('awg #5: 60 °C insulation on 75 °C terminals is held to its own 60 °C column', () => {
    const o = run('awg', { awg: 8, insul: 60, term: 75, ambient: 35, ccc: 4 });
    close(num(o, 'CORRECTED AMPACITY'), 40 * 0.91 * 0.8);
    close(num(o, 'TERMINATION LIMIT (75 °C TERMINALS)'), 40);
    close(num(o, 'ALLOWABLE AMPACITY'), 40 * 0.91 * 0.8);
    close(num(o, 'MAX CONTINUOUS LOAD (80%)'), 40 * 0.91 * 0.8);
  });
  it('kcmil #1: 500 kcmil 90 °C at 45 °C, 9 conductors, 75 °C terminals → 261.87 A', () => {
    const o = run('kcmil', { kcmil: 500, insul: 90, term: 75, ambient: 45, ccc: 9 });
    close(num(o, 'CORRECTED AMPACITY'), 430 * 0.87 * 0.7);
    close(num(o, 'TERMINATION LIMIT (75 °C TERMINALS)'), 380);
    close(num(o, 'ALLOWABLE AMPACITY'), 430 * 0.87 * 0.7);
    close(num(o, 'MAX CONTINUOUS LOAD (80%)'), 430 * 0.87 * 0.7);
  });
  it('kcmil #2: 250 kcmil 75 °C, 30 °C, 3 conductors → 255 A, 204 A continuous', () => {
    const o = run('kcmil', { kcmil: 250, insul: 75, term: 75, ambient: 30, ccc: 3 });
    close(num(o, 'ALLOWABLE AMPACITY'), 255);
    close(num(o, 'MAX CONTINUOUS LOAD (80%)'), 204);
  });
  it('factors #1: 90 °C at 50 °C, 25 conductors → 0.82 × 0.45 = 0.369', () => {
    close(num(run('factors', { insul: 90, ambient: 50, ccc: 25 }), 'COMBINED FACTOR'), 0.82 * 0.45);
  });
  it('factors #2: 60 °C at 10 °C, 41 conductors → 1.29 × 0.35', () => {
    close(num(run('factors', { insul: 60, ambient: 10, ccc: 41 }), 'COMBINED FACTOR'), 1.29 * 0.35);
  });
  it('the worked steps quote the computed numbers', () => {
    const s = fn('ampacity', 'awg').steps!({ awg: 12, insul: 90, term: 60, ambient: 40, ccc: 6 }).join(' ');
    assert.match(s, /30 × 0\.91 × 0\.80 = 21\.84 A/);
    assert.match(s, /smaller of 21\.84 A and 20 A = 20 A/);
    assert.match(s, /no more than 20 A/);
    assert.match(s, /: 16 A\./);
  });
  it('the example in the workspace is the computed vector #1', () => {
    const ex = AMP().example;
    assert.match(ex, /30 A × 0\.91 × 0\.80 = 21\.84 A/);
    assert.match(ex, /limit it to 20 A/);
    assert.match(ex, /at most 16 A/);
  });
});

describe('calcAmpacity — refused in words, never a number', () => {
  const base = { awg: 12, insul: 90, term: 60, ambient: 30, ccc: 3 };
  it('an ambient above the insulation rating', () => refusedInWords(run('awg', { ...base, ambient: 95 }), /hotter than the 90 °C insulation rating/));
  it('an ambient the table gives no factor for (60 °C insulation at 58 °C; 90 °C at 86 °C)', () => {
    refusedInWords(run('awg', { ...base, insul: 60, ambient: 58 }), /gives no factor for 60 °C insulation/);
    refusedInWords(run('factors', { insul: 90, ambient: 86, ccc: 3 }), /ends at 81–85 °C/);
  });
  it('a size not in the table (13 AWG, 450 kcmil)', () => {
    refusedInWords(run('awg', { ...base, awg: 13 }), /13 AWG is not a size in Table 310\.16/);
    refusedInWords(run('kcmil', { ...base, kcmil: 450 }), /450 kcmil is not a size in Table 310\.16/);
  });
  it('18 and 16 AWG (90 °C column only, 240.4(D)(1)–(2))', () => {
    refusedInWords(run('awg', { ...base, awg: 16 }), /only in the 90 °C column.*10 A/);
    refusedInWords(run('awg', { ...base, awg: 18, insul: 90 }), /7 A/);
  });
  it('an insulation or termination rating with no column (80 °C insulation; 70 or 90 °C terminals)', () => {
    refusedInWords(run('awg', { ...base, insul: 80 }), /60 °C, 75 °C and 90 °C insulation only/);
    refusedInWords(run('awg', { ...base, term: 70 }), /60 °C or 75 °C/);
    refusedInWords(run('awg', { ...base, term: 90 }), /60 °C or 75 °C/);
  });
  it('a refused result shows no table and steps only the words', () => {
    const v = { ...base, ambient: 95 };
    assert.equal(fn('ampacity', 'awg').table!(v).rows.length, 0);
    assert.doesNotMatch(fn('ampacity', 'awg').steps!(v).join(' '), /\d+(\.\d+)? A\b/);
  });
});

describe('calcAmpacity — cord, metric and licence said plainly', () => {
  const CORD = 'This uses building-wire tables (NEC 310.16); flexible cord uses NEC Table 400.5(A)(1).';
  it('every answer carries the cord refusal, word for word; so do the warnings', () => {
    for (const [k, v] of [['awg', { awg: 12, insul: 90, term: 60, ambient: 30, ccc: 3 }], ['kcmil', { kcmil: 250, insul: 90, term: 75, ambient: 30, ccc: 3 }], ['factors', { insul: 90, ambient: 30, ccc: 3 }]] as const) {
      assert.ok(run(k, v).some((x) => x.text === CORD), k);
    }
    assert.ok((AMP().warnings ?? '').includes(CORD));
  });
  it('the NEC (US) method is named; BS 7671 / IEC 60364-5-52 elsewhere', () => {
    assert.match(AMP().warnings ?? '', /NEC \(US\) method.*BS 7671.*IEC 60364-5-52/);
    assert.match(AMP().warnings ?? '', /NFPA 70\) 2023/);
  });
  it('the licence line: on the VERIFIED sheet, in the notes, in every answer', () => {
    const scope = /code-table figure for learning and planning.*adopted.*authority having jurisdiction.*licensed electrician/;
    assert.match(AMP().accuracyDetail ?? '', scope);
    assert.match(AMP().warnings ?? '', scope);
    for (const f of AMP().functions) assert.match(f.note ?? '', scope, f.key);
    assert.ok(run('awg', { awg: 12, insul: 90, term: 60, ambient: 30, ccc: 3 }).some((x) => scope.test(x.text ?? '')));
    assert.match(readFileSync('src/screens/lab/calc/CalcWorkspaceScreen.tsx', 'utf8'), /<AccuracyNote compact variant="calc" detail=\{ws\.accuracyDetail\} \/>/);
  });
});

describe('calcAmpacity — Voltage Drop points at it, consistently', () => {
  const NAME = 'Conductor Ampacity (NEC) calculator';
  it('the gauge note, the "any gauge" answer and the last step all name the ampacity calculator', () => {
    assert.ok(fn('vdrop', 'gaugeFor').note!.includes(`Size for ampacity FIRST with the ${NAME}`));
    const tiny = { len: 1, current: 0.001, vsrc: 48, pct: 3, condTemp: 20 };
    const row = fn('vdrop', 'gaugeFor').compute(tiny).find((x) => x.label === 'DROP-LIMITED AWG (CHECK AMPACITY)')!;
    assert.match(row.text ?? '', /Any gauge up to 40 AWG/);
    assert.ok((row.text ?? '').includes(`Size it with the ${NAME}.`));
    const last = fn('vdrop', 'gaugeFor').steps!({ len: 30, current: 20, vsrc: 120, pct: 3, condTemp: 75 }).at(-1)!;
    assert.ok(last.includes(`check ampacity with the ${NAME}`));
  });
  it('the Long Power Run template ends with the ampacity check', () => {
    const t = (WORKFLOW_TEMPLATES as { id: string; steps: { workspaceId: string; fnKey: string }[] }[]).find((x) => x.id === 'tpl-power-run')!;
    assert.deepEqual(t.steps.at(-1), { ...t.steps.at(-1), workspaceId: 'ampacity', fnKey: 'awg' });
  });
});

describe('calcAmpacity — loudness targets, verified 2026-10-04', () => {
  const tbl = () => fn('loudnorm', 'normalize').table!({});
  const row = (who: RegExp) => tbl().rows.find((r) => who.test(r[0]))!;
  it('a source column, and the "they change" note', () => {
    assert.deepEqual(tbl().cols, ['Platform / standard', 'Loudness', 'True peak', 'What it is', 'Source']);
    for (const r of tbl().rows) assert.ok(r[4].length > 0, r[0]);
    assert.match(fn('loudnorm', 'normalize').note ?? '', /As published by each platform; they change — check the platform’s current spec\./);
  });
  it('streaming levels are marked as playback levels, NOT mastering requirements', () => {
    for (const who of [/^Spotify$/, /^Apple Music$/, /^YouTube$/, /^Amazon Music$/, /^TIDAL$/]) assert.match(row(who)[3], /not a mastering requirement/);
    assert.match(fn('loudnorm', 'normalize').note ?? '', /a louder master is simply turned down/);
  });
  it('Spotify −14 LUFS, −1 dBTP, −2 dBTP for loud masters; Amazon −14 / −2; YouTube and TIDAL −14', () => {
    assert.match(row(/^Spotify$/)[1], /−14 LUFS/);
    assert.match(row(/^Spotify$/)[2], /−1 dBTP.*−2 dBTP for masters louder than −14 LUFS/);
    assert.deepEqual(row(/^Amazon Music$/).slice(1, 3), ['−14 LUFS', '−2 dBTP advised']);
    assert.match(row(/^YouTube$/)[1], /−14 LUFS/);
    assert.match(row(/^TIDAL$/)[1], /−14 LUFS/);
  });
  it('no tolerance or ceiling a platform does not publish (Apple Music, YouTube, TIDAL)', () => {
    for (const who of [/^Apple Music$/, /^YouTube$/, /^TIDAL$/]) assert.equal(row(who)[2], 'Not published');
    assert.match(row(/^Apple Music$/)[1], /−16 LUFS \(Sound Check\)/);
  });
  it('EBU R 128 −23 ±0.5 LU, −1 dBTP; ATSC A/85 −24 ±2 dB, −2 dBTP; Apple Podcasts −16 ±1; AES TD1008 −16 / −18', () => {
    assert.deepEqual(row(/EBU R 128/).slice(1, 3), ['−23 LUFS ±0.5 LU (±1 LU live)', 'Max −1 dBTP']);
    assert.deepEqual(row(/ATSC A\/85/).slice(1, 3), ['−24 LKFS ±2 dB', '−2 dBTP recommended']);
    assert.deepEqual(row(/Apple Podcasts/).slice(1, 3), ['−16 LKFS ±1 dB', 'Max −1 dBFS true peak']);
    assert.equal(row(/TD1008/)[1], '−16 LUFS music; −18 LUFS speech');
  });
  it('the old lumped row is gone', () => {
    assert.equal(tbl().rows.find((r) => r[0] === 'Spotify / Amazon / YouTube'), undefined);
  });
});
