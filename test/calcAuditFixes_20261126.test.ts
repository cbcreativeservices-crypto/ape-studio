/**
 * Receipt: Comp A calculator audit fixes (owner GO 2026-11-26, "Yes, all 16").
 *
 * Comp B audited a stale copy (ape-studio, 2026-11-20); these are the 16 items
 * that were still wrong in ape-workbench. Each expected value is worked by hand
 * from the code rule or the published source, never read back from the app.
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

const { getWorkspace } = await import('../src/screens/lab/calc/registry.ts');
const { WORKFLOW_TEMPLATES } = await import('../src/screens/lab/calc/workflowCatalog.ts');
const { maxOcpd } = await import('../src/screens/lab/calc/workspaces/ampacity.ts');
const { fmtSamples } = await import('../src/screens/lab/calc/calcUnits.ts');

type Out = { label: string; value?: number; text?: string };
type Fn = { key: string; compute: (v: Record<string, number>) => Out[]; steps?: (v: Record<string, number>) => string[]; table?: (v: Record<string, number>) => { rows: string[][] } };
const fn = (ws: string, key: string): Fn => {
  const w = getWorkspace(ws) as unknown as { functions: Fn[] };
  const f = w.functions.find((x) => x.key === key);
  assert.ok(f, `${ws}.${key}`);
  return f!;
};
const num = (o: Out[], label: string) => {
  const r = o.find((x) => x.label === label);
  assert.ok(r && typeof r.value === 'number', `${label} in ${o.map((x) => x.label).join(', ')}`);
  return r!.value!;
};
const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-6, `${a} ≠ ${b}`);
const src = (p: string) => readFileSync(new URL(`../src/screens/lab/calc/${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const steps = (ws: string, key: string, v: Record<string, number>) => fn(ws, key).steps!(v).join(' ');

describe('C01/C02/C04 ampacity: the breaker protects the derated conductor (NEC 240.4)', () => {
  it('maxOcpd: standard rating, next size up (240.4(B)), next size down above 800 A (240.4(C)), 240.4(D) cap', () => {
    assert.equal(maxOcpd(15, 20).amps, 15);
    assert.equal(maxOcpd(23, 30).amps, 25);
    assert.equal(maxOcpd(203.36, null).amps, 225);
    assert.equal(maxOcpd(790, null).amps, 800);
    assert.equal(maxOcpd(850, null).amps, 800);
    assert.equal(maxOcpd(1100, null).amps, 1000);
    assert.equal(maxOcpd(18.8, 15).amps, 15);
  });
  it('C01 + C04: 12 AWG 90 °C, 30 °C, 10 conductors, 60 °C terminals → 15 A breaker, 12 A continuous', () => {
    const o = fn('ampacity', 'awg').compute({ awg: 12, insul: 90, term: 60, ambient: 30, ccc: 10 });
    close(num(o, 'ALLOWABLE AMPACITY'), 15);
    close(num(o, 'MAX OVERCURRENT DEVICE (240.4)'), 15);
    close(num(o, 'MAX CONTINUOUS LOAD (80%)'), 12);
  });
  it('C02: 350 kcmil 75 °C at 113 °F (45 °C), 6 conductors → 225 A breaker, 180 A continuous', () => {
    const o = fn('ampacity', 'kcmil').compute({ kcmil: 350, insul: 75, term: 75, ambient: 45, ccc: 6 });
    close(num(o, 'CORRECTED AMPACITY'), 310 * 0.82 * 0.8);
    close(num(o, 'MAX OVERCURRENT DEVICE (240.4)'), 225);
    close(num(o, 'MAX CONTINUOUS LOAD (80%)'), 180);
  });
  it('the worked steps name the rule that set the breaker', () => {
    assert.match(steps('ampacity', 'awg', { awg: 12, insul: 90, term: 60, ambient: 30, ccc: 10 }), /Largest device: 15 A \(240\.4: a standard rating equal to the ampacity\)/);
    assert.match(steps('ampacity', 'kcmil', { kcmil: 350, insul: 75, term: 75, ambient: 45, ccc: 6 }), /Largest device: 225 A \(240\.4\(B\)/);
  });
});

describe('C03/C24/C25 workflow notes', () => {
  const step = (id: string, ws: string, key: string) => {
    const t = (WORKFLOW_TEMPLATES as { id: string; description: string; steps: { workspaceId: string; fnKey: string; note: string }[] }[]).find((x) => x.id === `tpl-${id}`)!;
    return { t, s: t.steps.find((x) => x.workspaceId === ws && x.fnKey === key)! };
  };
  it('C03: the SPL Estimate does not apply the distance loss twice', () => {
    const { s } = step('spl-estimate', 'spldist', 'point');
    assert.doesNotMatch(s.note, /Carry that SPL to the actual listening distance/);
    assert.match(s.note, /already at your listening distance/);
  });
  it('C24: Session Storage asks for channels × tracks in the record-time step', () => {
    const { t, s } = step('session-storage', 'filesize', 'recTime');
    assert.match(s.note, /channels × tracks/);
    assert.doesNotMatch(t.description, /Total multitrack session size/);
  });
  it('C25: Treatment Plan asks for ONE panel’s face area, not the absorption figure', () => {
    assert.match(step('treatment-plan', 'treatment', 'panels').s.note, /ONE panel’s face area, not the absorption figure/);
  });
});

describe('C05, C20, C21 wording', () => {
  it('C05: three-phase drop is √3·I·R₁ with the one-way resistance', () => {
    const s = src('workspaces/powerElec.ts');
    assert.doesNotMatch(s, /√3·L·I·R/);
    assert.match(s, /√3·I·R₁, with R₁ = ρ\(T\)·L\/A the one-way resistance of one conductor/);
  });
  it('C20 + C21: Spotify turns down in the player; the file keeps its own peak', () => {
    const s = src('workspaces/loudness.ts');
    assert.doesNotMatch(s, /so no extra limiting is needed/);
    assert.match(s, /still needs about 1\.5 dB more peak limiting/);
    assert.match(s, /your file is encoded at its original peak/);
  });
});

describe('C19 loudness: an exact landing on the ceiling is not "over"', () => {
  it('−13.9 LUFS to −14, TP −0.9, ceiling −1 → HEADROOM TO CEILING 0 dB, "safe"', () => {
    const v = { measured: -13.9, target: -14, truePeak: -0.9, ceiling: -1 };
    const o = fn('loudnorm', 'normalize').compute(v);
    const row = o.find((x) => /CEILING/.test(x.label))!;
    assert.equal(row.label, 'HEADROOM TO CEILING');
    assert.equal(row.value, 0);
    assert.match(steps('loudnorm', 'normalize', v), /0 dB under the -1 dBTP ceiling — safe/);
  });
  it('a real overshoot still reads OVER CEILING BY', () => {
    const o = fn('loudnorm', 'normalize').compute({ measured: -16, target: -14, truePeak: -1.5, ceiling: -1 });
    assert.equal(o.find((x) => /CEILING/.test(x.label))!.label, 'OVER CEILING BY');
  });
});

describe('C12, C13–C16, C22 exact counts in the worked steps', () => {
  it('C12: at 29.97 fps the steps say the table is the non-drop label', () => {
    const s = steps('timecode', 'fromFrames', { frames: 107892, fps: 29.97 });
    assert.match(s, /non-drop timecode label/);
    assert.match(s, /00:59:56:12 non-drop/);
    assert.doesNotMatch(steps('timecode', 'fromFrames', { frames: 107892, fps: 30 }), /non-drop/);
  });
  it('C13/C16: latency steps print 32767.5 and 32768 samples exactly', () => {
    assert.match(steps('firlen', 'latency', { sr: 48000, taps: 65536 }), /= 32767\.5 samples\./);
    assert.match(steps('firlen', 'latency', { sr: 44100, taps: 65537 }), /= 32768 samples\./);
  });
  it('C14/C15: tap-sizing steps print 13090.5 and 21818 samples exactly', () => {
    assert.match(steps('firlen', 'sizeTaps', { sr: 96000, trans: 10, atten: 60 }), /= 13090\.5 samples/);
    assert.match(steps('firlen', 'sizeTaps', { sr: 96000, trans: 10, atten: 100 }), /= 21818 samples/);
    assert.equal(fmtSamples(32767.5), '32767.5');
  });
  it('C22: loudness windows print the sample rate and windows exactly', () => {
    assert.match(steps('loudtp', 'windows', { sr: 47952 }), /3 s × 47952 = 143856 samples/);
  });
});
