/**
 * Calculator follow-up round (2026-10-03) — the recommendations from the extra
 * calculator checks A and B. Every receipt here FAILS on the code before this
 * round (HEAD, or the working tree calc checks A/B left for the files they had
 * already touched).
 *
 * F1  0 dBu reference: Level Converter dBu→V, Mic Gain and Limiter used 0.775 V
 *     while Mic Sensitivity used 0.7746 V. One shared √0.6 V (DBU_REF_V).
 * F2  94 dB SPL anchor: Mic Gain treated 94 dB SPL as exactly 1 Pa. Now the
 *     exact 20 µPa·10^(SPL/20) (P_REF_PA), as Mic Sensitivity always did.
 * F3  NIOSH dose counted intervals below 80 dBA. DHHS (NIOSH) 98-126
 *     integrates 80–140 dBA; above 140 dBA the result now says so.
 * F4  Reflection Path: a reflected path SHORTER than the direct one was
 *     answered via |Δd|; equal paths gave "—" nulls.
 * F5  70 V: "keep 20–25% in reserve" beside a 2 dB default (36.9 % reserve).
 *     Default now 1 dB (20.6 % reserve; ≈ 80 % loading).
 * F6  parseList: "1,000, 4,700" was read as [1, 0, 4, 700].
 * F7  A list field with an unreadable token said nothing.
 * F8  ★ while the favourites are unreadable did nothing and said nothing.
 * F9  useWorkflowList had no callers.
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

// Namespace imports: a missing export must fail ONE receipt, not the file.
const U = (await import('../src/screens/lab/calc/calcUnits.ts')) as Record<string, any>;
const { getWorkspace } = await import('../src/screens/lab/calc/registry.ts');

const CALC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/screens/lab/calc');
const read = (rel: string) => readFileSync(path.join(CALC, rel), 'utf8');

type Out = { label: string; value?: number; quantity?: string; text?: string };
type V = Record<string, number | number[]>;
const ws = (id: string) => {
  const w = getWorkspace(id);
  assert.ok(w, `workspace ${id}`);
  return w;
};
const fn = (id: string, key: string) => {
  const f = ws(id).functions.find((x) => x.key === key);
  assert.ok(f, `${id}.${key}`);
  return f;
};
const outs = (id: string, key: string, v: V) => fn(id, key).compute(v) as Out[];
const steps = (id: string, key: string, v: V) => (fn(id, key).steps?.(v) ?? []).join(' ');
const row = (o: Out[], label: string) => o.find((x) => x.label === label);
const num = (o: Out[], label: string) => {
  const r = row(o, label);
  assert.ok(r && typeof r.value === 'number', `numeric row ${label} in ${o.map((x) => x.label).join(' | ')}`);
  return r.value as number;
};
const near = (a: number, b: number, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol, `${a} ≠ ${b}`);
const field = (id: string, key: string) => ws(id).fields.find((f) => f.key === key)!;

const VREF = Math.sqrt(0.6); // 0.774597 V
const PREF = 20e-6; // 20 µPa

describe('F1 — one 0 dBu reference (√0.6 V) everywhere', () => {
  it('the shared constant is √0.6 V', () => near(U.DBU_REF_V, VREF, 0));
  it('Level Converter: 0 dBu is 0.774597 V, and 0.774597 V is 0 dBu', () => {
    near(num(outs('level', 'dbuToV', { dbu: 0 }), 'VOLTAGE (RMS)'), VREF, 1e-15);
    near(num(outs('level', 'vToDbu', { vFromDbu: VREF }), 'LEVEL (dBu)'), 0, 1e-12);
  });
  it('Limiter: √(P·Z) = 0.774597 V reads 0 dBu at the speaker', () => {
    near(num(outs('limiter', 'maxv', { pwr: 0.6, z: 1 }), 'AS A LEVEL (dBu)'), 0, 1e-12);
  });
  it('Mic Gain and Mic Sensitivity agree to the last digit on the same mic and SPL', () => {
    const a = num(outs('micgain', 'micout', { sens: 15, spl: 100 }), 'OUTPUT LEVEL (dBu)');
    const b = num(outs('micsens', 'outputAtSPL', { mvpa: 15, spl: 100 }), 'OUTPUT LEVEL (dBu)');
    near(a, b, 1e-12);
  });
  it('the worked steps and formulas print 0.7746, never 0.775 as the reference', () => {
    const s = steps('level', 'dbuToV', { dbu: 4 }) + steps('level', 'vToDbu', { vFromDbu: 1.228 }) +
      steps('micgain', 'micout', { sens: 2, spl: 94 }) + steps('limiter', 'maxv', { pwr: 500, z: 8 });
    assert.match(s, /0\.7746 ×/);
    assert.doesNotMatch(s, /0\.775[^0-9]/);
    for (const k of ['dbuToV', 'vToDbu']) assert.doesNotMatch(fn('level', k).formula, /0\.775\b/);
    assert.doesNotMatch(fn('limiter', 'threshold').formula, /0\.775\b/);
  });
  it('the worked examples still agree: +4 dBu ≈ 1.228 V; the 1.228 V placeholder ≈ +4 dBu', () => {
    assert.equal(U.fmt(num(outs('level', 'dbuToV', { dbu: 4 }), 'VOLTAGE (RMS)')), '1.228');
    near(num(outs('level', 'vToDbu', { vFromDbu: 1.228 }), 'LEVEL (dBu)'), 4, 0.01);
    assert.match(ws('level').example ?? '', /0\.7746 × 10\^\(4\/20\) ≈ 1\.228 V/);
  });
});

describe('F2 — 94 dB SPL is 1.0024 Pa, not exactly 1 Pa', () => {
  it('Mic Gain output at 94 dB SPL uses 20 µPa·10^(94/20)', () => {
    const p = PREF * Math.pow(10, 94 / 20); // 1.002374 Pa
    near(num(outs('micgain', 'micout', { sens: 2, spl: 94 }), 'OUTPUT VOLTAGE'), 0.002 * p, 1e-15);
    near(U.P_REF_PA, PREF, 0);
  });
  it('max SPL before clip is the exact SPL of Vclip / sensitivity', () => {
    const vclip = VREF * Math.pow(10, 10 / 20);
    const exact = 20 * Math.log10(vclip / 0.002 / PREF); // 107.96 dB SPL
    near(num(outs('micgain', 'maxspl', { sens: 2, maxIn: 10 }), 'SPL AT PREAMP INPUT CLIP'), exact, 1e-9);
  });
  it('the teaching words say "≈ 1 Pa", never "exactly 1 Pa"', () => {
    const text = JSON.stringify([ws('micgain'), ws('micsens')], (_k, v) => (typeof v === 'function' ? undefined : v));
    assert.doesNotMatch(text, /94 dB SPL (is|=) (exactly )?1 Pa(scal)? exactly|94 dB SPL is exactly 1|exactly 1 pascal —/);
    assert.match(fn('micgain', 'micout').note ?? '', /94 dB SPL is 1\.0024 Pa/);
  });
  it('the worked example still agrees: 2 mV/Pa at 94 dB SPL ≈ −51.7 dBu, ≈ 56 dB to +4 dBu', () => {
    const d = num(outs('micgain', 'micout', { sens: 2, spl: 94 }), 'OUTPUT LEVEL (dBu)');
    assert.equal(d.toFixed(1), '-51.7');
    assert.match(ws('micgain').example ?? '', /≈ −51\.7 dBu/);
    assert.equal(Math.round(num(outs('micgain', 'gain', { sens: 2, spl: 94, target: 4, headroom: 12 }), 'GAIN TO HIT TARGET (dB)')), 56);
  });
});

describe('F3 — the NIOSH dose integrates 80–140 dBA (DHHS/NIOSH 98-126)', () => {
  it('8 h at 70 dBA adds nothing: 70 dBA × 480 min + 94 dBA × 60 min = exactly 100 %', () => {
    const v = { doseLevels: [70, 94], doseMins: [480, 60] };
    near(num(outs('dose', 'doseNiosh', v), 'DAILY DOSE (85 dBA / 3 dB)'), 100, 1e-9);
    assert.match(steps('dose', 'doseNiosh', v), /70 dBA → below 80 dBA, not counted/);
    assert.equal(fn('dose', 'doseNiosh').table!(v)!.rows[0]![4], 'not counted');
  });
  it('80 dBA itself is counted (the threshold is inclusive)', () => {
    near(num(outs('dose', 'doseNiosh', { doseLevels: [80], doseMins: [480] }), 'DAILY DOSE (85 dBA / 3 dB)'), 100 / Math.pow(2, 5 / 3), 1e-9);
  });
  it('the explain/note say where the dose stops', () => {
    assert.match(fn('dose', 'doseNiosh').note ?? '', /below 80 dBA are not counted/);
    assert.match(fn('dose', 'doseNiosh').explain, /98-126/);
  });
  it('above 140 dBA: still counted, and the result says NIOSH stops there', () => {
    const o = outs('dose', 'doseNiosh', { doseLevels: [141], doseMins: [1] });
    assert.match(row(o, 'ABOVE 140 dBA')?.text ?? '', /no exposure above 140 dBA/);
    assert.ok(num(o, 'DAILY DOSE (85 dBA / 3 dB)') > 0);
    assert.ok(row(outs('dose', 'allowNiosh', { lex: 141 }), 'ABOVE 140 dBA'));
    assert.equal(row(outs('dose', 'doseNiosh', { doseLevels: [140], doseMins: [1] }), 'ABOVE 140 dBA'), undefined);
  });
  it('the placeholder day (all ≥ 80 dBA) is untouched', () => {
    const o = outs('dose', 'doseNiosh', { doseLevels: [85, 94, 100], doseMins: [240, 90, 30] });
    near(num(o, 'DAILY DOSE (85 dBA / 3 dB)'), 50 + 150 + 30 / 15 * 100, 1e-9);
  });
});

describe('F4 — Reflection Path refuses the impossible and names "no comb"', () => {
  it('a reflected path shorter than the direct path is refused in words', () => {
    const v = { dDirect: 0.75, dReflected: 0.3, temp: 20 };
    const o = outs('reflection', 'comb', v);
    assert.ok(o.every((r) => typeof r.value !== 'number'), 'no number is claimed');
    assert.match(row(o, 'NOT A REFLECTION')?.text ?? '', /shorter than the direct path/);
    assert.match(steps('reflection', 'comb', v), /never arrive by a shorter route/);
  });
  it('equal paths say "no path difference → no comb-filter nulls", not "—"', () => {
    const v = { dDirect: 0.5, dReflected: 0.5, temp: 20 };
    const o = outs('reflection', 'comb', v);
    assert.ok(o.every((r) => typeof r.value !== 'number' || Number.isFinite(r.value)));
    assert.equal(row(o, 'FIRST NULL'), undefined);
    assert.match(row(o, 'COMB FILTERING')?.text ?? '', /No path difference → no comb-filter nulls/);
    assert.match(steps('reflection', 'comb', v), /no comb-filter nulls/);
  });
  it('the placeholder is untouched: Δd 0.45 m', () => {
    near(num(outs('reflection', 'comb', { dDirect: 0.3, dReflected: 0.75, temp: 20 }), 'PATH DIFFERENCE'), 0.45, 1e-12);
  });
});

describe('F5 — the 70 V headroom default matches its own words', () => {
  const hr = Number(field('cv70', 'hr').placeholder);
  const reserve = 1 - Math.pow(10, -hr / 10); // share of the amp rating held back
  it('the default keeps ≈ 20 % in reserve (≈ 80 % loading), not 36.9 %', () => {
    assert.equal(hr, 1);
    assert.ok(reserve > 0.2 && reserve < 0.21, `${reserve}`);
  });
  it('help, mistakes, warnings and explain all say the same reserve', () => {
    assert.match(field('cv70', 'hr').help ?? '', /1 dB keeps ≈ 21%/);
    const all = [ws('cv70').mistakes.join(' '), ws('cv70').warnings, fn('cv70', 'load').explain].join(' ');
    assert.doesNotMatch(all, /20–25%/);
    assert.match(all, /about 20%/);
  });
  it('the worked example agrees with the default: 151 W recommended, 7 more fit', () => {
    const taps = Array(12).fill(10);
    near(num(outs('cv70', 'load', { taps, prated: 250, vline: 70.7, hr }), `RECOMMENDED AMP ≥ (with ${hr} dB headroom)`), 120 * Math.pow(10, 0.1), 1e-9);
    assert.match(row(outs('cv70', 'morespeakers', { taps, prated: 250, tapw: 10, hr }), 'MORE SPEAKERS THAT FIT')?.text ?? '', /^7 more speakers/);
    assert.match(ws('cv70').example ?? '', /≈ 151 W .* 7 more 10 W/);
  });
});

describe('F6 — a list refuses thousands commas instead of splitting them', () => {
  it('"1,000, 4,700" is refused, with the reason', () => {
    assert.deepEqual(U.parseList('1,000, 4,700'), []);
    assert.match(U.listProblem('1,000, 4,700'), /“1,000” — Leave out thousands commas: write 1000, 4700/);
  });
  it('the same values without the commas still read', () => {
    assert.deepEqual(U.parseList('1000, 4700'), [1000, 4700]);
    assert.equal(U.listProblem('1000, 4700'), null);
    assert.equal(U.listProblem(''), null);
  });
  it('every list placeholder still reads', () => {
    let lists = 0;
    for (const id of ['electronics', 'dose', 'cv70', 'spladd', 'impedance', 'sabine']) {
      for (const f of ws(id).fields) {
        if (f.quantity !== 'list') continue;
        lists++;
        assert.ok(U.parseList(f.placeholder ?? '').length > 0, `${id}.${f.key}`);
      }
    }
    assert.equal(lists, 9);
  });
  it('the resistor and surface-area list help says it', () => {
    assert.match(field('electronics', 'rlist').help ?? '', /Leave out thousands commas: write 1000, 4700/);
    assert.match(field('sabine', 'surfaces').help ?? '', /Leave out thousands commas/);
  });
});

describe('F7 — a list field names the token it cannot read', () => {
  it('listProblem names the bad token', () => {
    assert.match(U.listProblem('8, 4x, 4'), /Check “4x”/);
  });
  it('FieldRow shows it, as the single-value fields do', () => {
    const panel = read('calcPanel.tsx');
    assert.match(panel, /const listUnreadable = isList \? listProblem\(raw\) : null;/);
    assert.match(panel, /\{listUnreadable \? <Text style=\{styles\.warnText\}>⚠ \{listUnreadable\}<\/Text> : null\}/);
  });
});

describe('F8 — ★ on unreadable favourites says so', () => {
  it('a null toggle result notifies instead of doing nothing', () => {
    const src = read('CalcWorkflowsScreen.tsx');
    assert.match(src, /toggleFavorite\(id\)\.then\(\(list\) => \{\s*if \(list\) setFavorites\(list\);[\s\S]{0,300}?else\s+notify\(\s*'Favorite not changed',\s*'Your saved favorites could not be read from this device just now/);
  });
});

describe('F9 — the unused useWorkflowList hook is gone', () => {
  it('no definition and no React import left in workflowStore', () => {
    const src = read('workflowStore.ts');
    assert.doesNotMatch(src, /useWorkflowList/);
    assert.doesNotMatch(src, /from 'react'/);
  });
});
