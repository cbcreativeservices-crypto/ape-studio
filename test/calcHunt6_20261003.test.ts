/**
 * Hunt 6 (2026-10-03) — CALC area.
 *
 * H6-1 Workflow runner: a failed READ of the saved drafts (listRuns) opened a
 *      blank run as if no progress had been saved, and every autosave of the
 *      new run then failed in silence (the store never writes over an unread
 *      list) — the learner's progress was lost on leaving with nothing said.
 *      The hunt-5 unreadable-list class, missed in the runner.
 * H6-2 Driver & Enclosures › port length: a tuning above what a ZERO-length
 *      port of the entered area reaches printed a confident NEGATIVE physical
 *      port length, and the words had the physics backwards ("this port area
 *      tunes higher than the target … use a smaller port area"). The zero-
 *      length port tunes BELOW the target; a larger area or a smaller box
 *      raises it.
 * H6-3 Voltage Drop › gauge for an allowable drop: past 0 AWG the answer was a
 *      gauge that does not exist — "-7" for a 239 mm² feeder (beyond 4/0, the
 *      end of the AWG scale), "-1" for 2/0.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

// The workspaces use Metro-style extensionless imports (see calcDegenerate).
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
const { speedOfSoundAir } = await import('../src/screens/lab/calc/calcUnits.ts');

const fn = (ws: string, key: string) => {
  const w = getWorkspace(ws);
  assert.ok(w, `workspace ${ws}`);
  const f = w.functions.find((x) => x.key === key);
  assert.ok(f, `${ws}.${key}`);
  return f;
};
type Out = { label: string; value?: number; text?: string };
const outs = (ws: string, key: string, v: Record<string, number>) => fn(ws, key).compute(v) as Out[];
const src = (f: string) => readFileSync(new URL(`../src/screens/lab/calc/${f}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

describe('H6-1 — the runner says when the saved drafts could not be read', () => {
  it('a failed listRuns() read is told, never treated as "no saved progress"', () => {
    const s = src('CalcWorkflowRunScreen.tsx');
    // The drafts are read alongside the workflows list (perf hunt 2026-10-03,
    // Promise.all) — so the check is located from where `runs` is first used.
    assert.match(s, /workflowStore\.listRuns\(\)/, 'the runner reads the drafts');
    const at = s.indexOf('const draft = runs.find(');
    assert.ok(at > 0, 'the runner reads the drafts');
    const after = s.slice(at, at + 1600);
    assert.match(after, /workflowListUnreadable\(runs\)/, 'the unreadable stand-in is checked');
    const check = after.slice(after.indexOf('workflowListUnreadable(runs)'));
    assert.match(check.slice(0, 400), /notify\(/, 'and the learner is told');
    assert.match(s, /import \{[^}]*workflowListUnreadable[^}]*\} from '\.\/workflowStore'/);
  });
});

describe('H6-2 — vented port length never prints an impossible negative', () => {
  // Fuzz case: 60 Hz from a 20.5 cm² port in a 43.4 L box at −14.5 °C.
  const v = { fbTarget: 60.01228684767912, av: 0.0020455042370792938, vb: 0.04337791446687951, temp: -14.487787804629617 };

  it('no negative PHYSICAL PORT LENGTH — the answer says no length reaches the target', () => {
    const o = outs('driver', 'portLength', v);
    const phys = o.find((x) => x.label === 'PHYSICAL PORT LENGTH');
    assert.ok(phys, 'the row is still there');
    assert.equal(phys.value, undefined, `no numeric length (was ${phys.value})`);
    assert.match(phys.text ?? '', /No port length reaches/);
    assert.match(phys.text ?? '', /larger port area or a smaller box/);
  });

  it('the zero-length tuning it quotes is real, and BELOW the target', () => {
    const c = speedOfSoundAir(v.temp);
    const corr = 1.46 * Math.sqrt(v.av / Math.PI);
    const fb0 = (c / (2 * Math.PI)) * Math.sqrt(v.av / (v.vb * corr));
    assert.ok(fb0 < v.fbTarget, 'physics: a zero-length port of this area tunes below the target');
    // Hunt 9: the figure moved from the refusal row to the unmarked THE FIGURES row.
    const text = outs('driver', 'portLength', v).find((x) => x.label === 'THE FIGURES')?.text ?? '';
    assert.match(text, new RegExp(`about ${fb0.toPrecision(4).replace('.', '\\.')} Hz, below the target`));
    // And a larger area really does raise it (fb0 ∝ Av^¼), as the advice says.
    const fb0Big = (c / (2 * Math.PI)) * Math.sqrt((4 * v.av) / (v.vb * 1.46 * Math.sqrt((4 * v.av) / Math.PI)));
    assert.ok(fb0Big > fb0);
  });

  it('the worked steps and the explanation no longer have the physics backwards', () => {
    const steps = fn('driver', 'portLength').steps!(v).join(' ');
    assert.doesNotMatch(steps, /tunes higher than the target|use a smaller port area/);
    assert.match(steps, /tunes BELOW the target/);
    assert.doesNotMatch(fn('driver', 'portLength').explain ?? '', /already tunes higher than the target/);
  });

  it('a reachable tuning is unchanged (placeholder: 35 Hz, 50 cm², 30 L, 20 °C)', () => {
    const o = outs('driver', 'portLength', { fbTarget: 35, av: 0.005, vb: 0.03, temp: 20 });
    const phys = o.find((x) => x.label === 'PHYSICAL PORT LENGTH');
    assert.ok(phys?.value != null && Math.abs(phys.value - 0.347716) < 1e-5, String(phys?.value));
  });
});

describe('H6-3 — the drop-limited gauge is a gauge that exists', () => {
  const awgRow = (v: Record<string, number>) => outs('vdrop', 'gaugeFor', v).find((x) => x.label === 'DROP-LIMITED AWG (CHECK AMPACITY)');

  it('past 4/0 (239 mm²): no "-7" — the answer says the AWG scale has ended', () => {
    const row = awgRow({ len: 100, current: 100, vsrc: 48, pct: 3 });
    assert.ok(row);
    assert.equal(row.value, undefined, `no numeric gauge (was ${row.value})`);
    assert.match(row.text ?? '', /Thicker than 4\/0 AWG/);
    assert.match(row.text ?? '', /239\.5 mm²/); // ρ = 1/58 µΩ·m exactly since 2026-10-04 (was 239.4)
    const steps = fn('vdrop', 'gaugeFor').steps!({ len: 100, current: 100, vsrc: 48, pct: 3 }).join(' ');
    assert.doesNotMatch(steps, /-\d+ AWG or thicker/);
  });

  it('between 0 and 4/0 the trade name is used (−1 → 2/0)', () => {
    // 67.4 mm² (2/0) is the thinnest that meets ~60 mm²: area → −0.5 AWG → −1.
    const row = awgRow({ len: 50, current: 100, vsrc: 120, pct: 2.4 });
    assert.ok(row);
    assert.equal(row.value, undefined);
    assert.equal(row.text, '2/0 AWG or thicker.');
  });

  it('an ordinary run still answers with the number (placeholder: 13 AWG)', () => {
    const row = awgRow({ len: 30, current: 3, vsrc: 48, pct: 3 });
    assert.equal(row?.value, 13);
  });
});
