/**
 * Wiring & signal-flow fixes, round 3 (2026-10-21) — Production, Amp and
 * Calc. Each block fails if the wrong logic or wording comes back.
 *
 *  R3-PR-01  instrument level is flagged only straight into a mic, console or
 *            stage-box input — never into its own pedals, effects or amp.
 *  R3-PR-02  a stereo in-ear mix takes two outputs (or one stereo aux).
 *  R3-AM-01  line level is the pro nominal +4 dBu from DBU_REF_V, not "1 V peak".
 *  R3-AM-02  the rails meter and CLIPPING flag sit under AMP OUTPUT, not AMP INPUT.
 *  R3-CA-01  a 2nd-order Butterworth does not sum flat; Linkwitz-Riley does.
 *  R3-CA-02  a hot mic needs a pad, said in words — never a bare negative gain.
 *  R3-CA-03  the limiter threshold assumes the amp's attenuators at the spec setting.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
      const index = new URL(specifier + '/index.ts', context.parentURL);
      if (existsSync(fileURLToPath(index))) return { url: index.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const ROOT = join(import.meta.dirname, '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');

const { resolveStage } = await import('../src/features/production/schema.ts');
const { evaluateStage } = await import('../src/features/production/rules.ts');
const { newProject } = await import('../src/features/production/projectStore.ts');
const { PREPROD_STAGES } = await import('../src/features/production/preprod/index.ts');
const { WORKSPACES } = await import('../src/screens/lab/calc/registry.ts');
const { DBU_REF_V, P_REF_PA } = await import('../src/screens/lab/calc/calcUnits.ts');
const { isRefused } = await import('../src/screens/lab/calc/calcTypes.ts');
const { evaluateGainStructure } = await import('../src/features/amp/ampModel.ts');

const fire = (values: Record<string, unknown>) => {
  const st = resolveStage(PREPROD_STAGES.find((s) => s.stageId === 'technical')!, 'music');
  const p = { ...newProject('preprod', 'music', 'Test'), pathway: 'music' as const, values: values as never };
  return evaluateStage(st, p).map((f) => f.ruleId);
};
const LEVEL = 'technical-level-format-conflict';
const path = (...rows: Record<string, string>[]) => ({ 'technical.signal_path': rows });

describe('R3-PR-01 — instrument level is flagged only straight into a mic, console or stage-box input', () => {
  it('a guitar into its amp, its pedalboard or an effects unit is never flagged', () => {
    assert.ok(!fire(path({ sp_from: 'Guitar', sp_level: 'instrument', sp_via: 'Instrument cable', sp_to: 'Guitar amp' })).includes(LEVEL));
    assert.ok(!fire(path({ sp_from: 'Guitar', sp_level: 'instrument', sp_via: '', sp_to: 'Pedalboard' })).includes(LEVEL));
    assert.ok(!fire(path({ sp_from: 'Bass', sp_level: 'instrument', sp_via: '', sp_to: 'Bass amplifier' })).includes(LEVEL));
    assert.ok(!fire(path({ sp_from: 'Guitar', sp_level: 'instrument', sp_via: '', sp_to: 'Effects unit' })).includes(LEVEL));
  });
  it('a guitar straight into a stage-box mic input, or a console channel, is flagged', () => {
    assert.ok(fire(path({ sp_from: 'Guitar', sp_level: 'instrument', sp_via: 'Long cable', sp_to: 'Stage box mic input 7' })).includes(LEVEL));
    assert.ok(fire(path({ sp_from: 'Bass', sp_level: 'instrument', sp_via: '', sp_to: 'Console channel 6' })).includes(LEVEL));
  });
  it('a guitar through a DI to the stage box is not flagged (one row or two hops)', () => {
    assert.ok(!fire(path({ sp_from: 'Guitar', sp_level: 'instrument', sp_via: 'DI', sp_to: 'Stage box input 7' })).includes(LEVEL));
    assert.ok(!fire(path(
      { sp_from: 'Guitar', sp_level: 'instrument', sp_via: '', sp_to: 'DI box' },
      { sp_from: 'DI box', sp_level: 'mic', sp_via: 'XLR', sp_to: 'Stage box input 7' },
    )).includes(LEVEL));
  });
  it('the authored copy says the same', () => {
    const s = read('src/features/production/preprod/stage5.data.ts');
    assert.match(s, /A guitar into its own pedals or amp is instrument level by design/);
    assert.match(s, /Never fire when sp_to is an amp, pedal or effects unit/);
    assert.doesNotMatch(s, /sp_level instrument and neither sp_via nor sp_to mentions/);
  });
});

describe('R3-PR-02 — a stereo in-ear mix takes two outputs', () => {
  it('the cue-mix rule says so', () => {
    assert.match(read('src/features/production/preprod/stage5.data.ts'), /a stereo in-ear mix takes two outputs \(or one stereo aux\)/);
  });
});

describe('R3-AM-01 — the line-out comparison uses nominal +4 dBu from the shared reference', () => {
  it('computes from DBU_REF_V; no "1 V peak"', () => {
    const s = read('src/screens/lab/amp/modules/mod1What.tsx');
    assert.match(s, /import \{ DBU_REF_V \} from '\.\.\/\.\.\/calc\/calcUnits'/);
    assert.match(s, /const LINE_NOMINAL_DBU = 4;/);
    assert.match(s, /Math\.pow\(10, LINE_NOMINAL_DBU \/ 20\) \* DBU_REF_V/);
    assert.match(s, /nominal \+\{LINE_NOMINAL_DBU\} dBu/);
    assert.match(s, /peaks can swing\s+much higher/);
    assert.doesNotMatch(s, /1 V peak/);
    assert.doesNotMatch(s, /sineVrms\(1\.0\)/);
  });
  it('the numbers it prints: ≈ 1.23 V rms and ≈ 0.19 W into 8 Ω', () => {
    const v = Math.pow(10, 4 / 20) * DBU_REF_V;
    assert.equal(v.toFixed(2), '1.23');
    assert.equal(((v * v) / 8).toFixed(2), '0.19');
  });
});

describe('R3-AM-02 — the rails meter and CLIPPING flag belong to the output stage', () => {
  it('levels.amp is the output against the rails', () => {
    const g = evaluateGainStructure(0.5, 0.6, 1);
    assert.equal(g.firstClip, 'amp');
    assert.ok(g.levels.amp > 1);
  });
  it('the chain meters `out` from levels.amp, labels it AMP OUTPUT (rails), and never flags AMP INPUT', () => {
    const s = read('src/screens/lab/amp/modules/mod7RealWorld.tsx');
    assert.match(s, /\{ key: 'out', lines: \['AMP OUTPUT', '\(rails\)'\] \}/);
    assert.match(s, /const clipKey = firstClip === 'amp' \? 'out' : firstClip;/);
    assert.match(s, /s\.key === 'source' \|\| s\.key === 'mixer' \? levels\[s\.key\] : s\.key === 'out' \? levels\.amp : null/);
    assert.match(s, /const clip = s\.key === clipKey;/);
    assert.doesNotMatch(s, /s\.key === 'amp' \? levels\[s\.key\]/);
    assert.doesNotMatch(s, /OUTPUT STAGE/);
    assert.match(s, /'AMP OUTPUT \(RAILS\)'/);
  });
});

type Out = { label: string; value?: number; text?: string; refusal?: true };
const fn = (w: string, k: string) => WORKSPACES.find((x) => x.id === w)!.functions.find((f) => f.key === k)!;
const outs = (w: string, k: string, v: Record<string, unknown>) => fn(w, k).compute(v as never) as Out[];
const steps = (w: string, k: string, v: Record<string, unknown>) => (fn(w, k).steps!(v as never) as string[]).join(' ');

describe('R3-CA-01 — a 2nd-order Butterworth crossover does not sum flat', () => {
  it('no "maximally flat sum" or "add flat"; the notch, the +3 dB and Linkwitz-Riley are named', () => {
    const f = fn('crossover', 'secondOrder');
    const all = `${f.explain} ${f.note} ${steps('crossover', 'secondOrder', { fx: 2500, z: 8 })}`;
    assert.doesNotMatch(all, /maximally flat sum|add flat|flat Butterworth sum/);
    assert.match(f.explain, /cancel in a deep notch at the crossover frequency/);
    assert.match(f.explain, /sums about 3 dB high at the crossover/);
    assert.match(f.explain, /Linkwitz-Riley crossover \(Q = 0\.5/);
    assert.match(f.note!, /A flat sum needs Linkwitz-Riley \(Q = 0\.5\)/);
    assert.match(steps('crossover', 'secondOrder', { fx: 2500, z: 8 }), /sums about \+3 dB at 2,?500 Hz/);
    const ws = read('src/screens/lab/calc/workspaces/speakersAdv.ts');
    assert.doesNotMatch(ws, /for a flat summed response\.'/);
  });
  it('the physics behind it: Butterworth −3 dB each at fc sums to +3 dB when reversed', () => {
    const each = 1 / Math.SQRT2;
    assert.ok(Math.abs(20 * Math.log10(2 * each) - 3.01) < 0.01);
  });
  it('the component values are unchanged', () => {
    const o = outs('crossover', 'secondOrder', { fx: 2500, z: 8 });
    assert.ok(Math.abs(o[0]!.value! - 1e6 / (2 * Math.PI * Math.SQRT2 * 2500 * 8)) < 1e-9);
  });
});

describe('R3-CA-02 — a hot mic needs a pad, never a bare negative gain', () => {
  const hot = { sens: 40, spl: 130, target: 4, headroom: 12 };
  it('40 mV/Pa at 130 dB SPL is refused in words', () => {
    const micDbu = 20 * Math.log10(((40 / 1000) * P_REF_PA * Math.pow(10, 130 / 20)) / DBU_REF_V);
    assert.ok(4 - micDbu < 0, 'the case really is below 0 dB of gain');
    const o = outs('micgain', 'gain', hot);
    assert.ok(isRefused(o as never));
    assert.equal(o.length, 1);
    assert.equal(o[0]!.label, 'NEEDS A PAD, NOT GAIN');
    assert.match(o[0]!.text!, /most preamps cannot go below 0 dB/);
    assert.match(o[0]!.text!, /pad on the mic or the preamp/);
    assert.ok(o.every((x) => x.value === undefined));
    assert.match(steps('micgain', 'gain', hot), /pad/);
  });
  it('target reachable but the headroom is not: the recommended row is words', () => {
    // 40 mV/Pa at 120 dB SPL ≈ −2.3 dBu: 6.3 dB to a +4 target, 12 dB headroom.
    const o = outs('micgain', 'gain', { sens: 40, spl: 120, target: 4, headroom: 12 });
    assert.ok(!isRefused(o as never));
    assert.ok(o[0]!.value! > 0);
    assert.equal(o[1]!.value, undefined);
    assert.match(o[1]!.text!, /below 0 dB/);
  });
  it('an ordinary mic still prints its gain', () => {
    const o = outs('micgain', 'gain', { sens: 2, spl: 94, target: 4, headroom: 12 });
    assert.equal(Math.round(o[0]!.value!), 56);
    assert.equal(Math.round(o[1]!.value!), 44);
  });
});

describe('R3-CA-03 — the limiter threshold names its attenuator assumption', () => {
  it('a result row and a step say the attenuators sit at the spec setting', () => {
    const o = outs('limiter', 'threshold', { pwr: 500, z: 8, ampGain: 32, margin: 3 });
    const row = o.find((x) => x.label === 'AMP INPUT KNOBS');
    assert.ok(row?.text);
    assert.match(row!.text!, /most amps is fully up/);
    assert.match(row!.text!, /measure the real gain again/);
    assert.match(steps('limiter', 'threshold', { pwr: 500, z: 8, ampGain: 32, margin: 3 }), /attenuators/);
  });
});
