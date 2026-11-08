/**
 * Cymatics D41 behaviour fixes (owner approved 2026-11-01).
 *
 *  #21 — Module 2 (Nodes, Antinodes & Modes): the JUMP TO A MODE tray came
 *        from 24 computed modes while the resonance read, the drawn field and
 *        the FREQ warp used 14, so square-plate entries 5–7 (1.03 kHz (4,4),
 *        1.73 kHz, 1.82 kHz) read BETWEEN with MODE and LINES a dash. One
 *        shared list (nodesModeLists, modeMath.ts) now feeds all four.
 *  #22/#23 — Module 1 (What Is Cymatics?): the RESPONSE vs FREQUENCY strip
 *        sampled one frequency per bar and missed every resonance (Q ≈ 566:
 *        peaks ~0.18 % wide, bars ~9 % apart → tallest bar 0.04). Each bar is
 *        now its band's PEAK response, so every mode is a full bar.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import type { PlateMode, PlateSpec } from '../src/features/cymatics/plateModes.ts';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { DEFAULT_PLATE, effectiveQ, modeResponse, plateModes, readResonance, sampleField } = await import('../src/features/cymatics/plateModes.ts');
const { NODES_MODE_COUNT, NODES_TRAY_MAX, nodesModeLists, responseBands } = await import('../src/screens/lab/cymatics/modules/modeMath.ts');
const { CYMATICS_SCREEN_GUIDES } = await import('../src/screens/lab/cymatics/cymaticsScreenGuides.ts');

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const nodesSpec = (shape: 'square' | 'circle'): PlateSpec => ({ ...DEFAULT_PLATE, shape, exciter: shape === 'circle' ? { x: 0.85, y: 0.5 } : { x: 0.5, y: 0.5 } });
const Q0 = effectiveQ(DEFAULT_PLATE.material, DEFAULT_PLATE.damping);

test('#21 Nodes: every JUMP TO A MODE entry, landed, reads AT on that mode in the list the screen reads', () => {
  for (const shape of ['square', 'circle'] as const) {
    const spec = nodesSpec(shape);
    const Q = effectiveQ(spec.material, spec.damping);
    const { all, tray } = nodesModeLists(spec);
    assert.equal(all.length, Math.min(NODES_MODE_COUNT, plateModes(spec, 999).length));
    assert.ok(tray.length > 0 && tray.length <= NODES_TRAY_MAX);
    assert.equal(NODES_TRAY_MAX, 8, "guide says the tray lists up to eight modes");
    for (const m of tray) {
      assert.ok(all.includes(m), `${shape}: tray entry ${m.label} is in the shared list`);
      const r = readResonance(Math.round(m.hz * 10) / 10, all, Q);
      assert.equal(r.state, 'at', `${shape}: ${m.label} at ${m.hz.toFixed(1)} Hz reads ${r.state}`);
      assert.equal(r.dominant?.id, m.id, `${shape}: ${m.label} is the dominant mode, so MODE and LINES show`);
    }
  }
});

test('#21 Nodes: the square plate tray now reaches (4,4), (6,0)+(0,6) and (6,2)+(2,6) — the old 14-mode read missed them', () => {
  const spec = nodesSpec('square');
  const { tray } = nodesModeLists(spec);
  assert.equal(tray.length, 7);
  const old14 = plateModes(spec, 14);
  for (const k of [4, 5, 6]) {
    const m = tray[k];
    assert.equal(readResonance(Math.round(m.hz * 10) / 10, old14, Q0).state, 'between', `the regression: entry ${k + 1} (${m.label}) read BETWEEN on the 14-mode list`);
  }
  assert.deepEqual(tray.slice(4).map((m: PlateMode) => m.label), ['(4,4)', '(6,0) + (0,6)', '(6,2) + (2,6)']);
  // The first-mode landing is unchanged: AT, 95 %.
  const first = readResonance(Math.round(tray[0].hz * 10) / 10, nodesModeLists(spec).all, Q0);
  assert.equal(first.state, 'at');
  assert.equal(Math.round(first.strength * 100), 95);
});

test('#21 Nodes: one list in the source — no second plateModes/excitableModes count', () => {
  const src = read('src/screens/lab/cymatics/modules/modNodes.tsx');
  assert.match(src, /const \{ all: allModes, tray: modes \} = useMemo\(\(\) => nodesModeLists\(spec\), \[spec\]\);/);
  assert.match(src, /const \{ tray \} = nodesModeLists\(\{ \.\.\.DEFAULT_PLATE, shape: s,/);
  assert.doesNotMatch(src, /plateModes\(|excitableModes\(/);
  assert.match(src, /makeFreqFader\(F_MIN, F_MAX, allModes, Q\)/);
  assert.match(src, /readResonance\(hz, allModes, Q\)/);
  assert.match(src, /sampleField\(spec, allModes, hz, Q, N\)/);
});

test('#21 Nodes: the square field stays cheaper than the disc field it sits beside', () => {
  // The field sums only modes with weight > 1e-3; the square now sums 7 (was 4), the disc 15.
  const active = (spec: PlateSpec, f: number) => nodesModeLists(spec).all.filter((m: PlateMode) => Math.abs(modeResponse(f, m.hz, Q0) * m.drive) > 1e-3).length;
  assert.equal(active(nodesSpec('square'), 300), 7);
  assert.ok(active(nodesSpec('square'), 300) < active(nodesSpec('circle'), 300));
  assert.equal(sampleField(nodesSpec('square'), nodesModeLists(nodesSpec('square')).all, 300, Q0, 48).length, 48 * 48);
});

test('#22/#23 Intro strip: each resonance is a full bar; the off-resonance drive sits in a dip', () => {
  const modes = plateModes(DEFAULT_PLATE, 14).filter((m: PlateMode) => m.drive > 0.05);
  const fMin = 60;
  const fMax = 2000;
  const v = responseBands(modes, Q0, fMin, fMax, 40);
  assert.equal(v.length, 40);
  const bandOf = (f: number) => Math.floor((Math.log(f / fMin) / Math.log(fMax / fMin)) * 40);
  for (const hz of [103.7, 191.1, 501.0, 593.7]) assert.ok(v[bandOf(hz)] >= 0.9, `the band holding ${hz} Hz reads ${v[bandOf(hz)]}`);
  const f1 = modes[0].hz;
  assert.equal(v[bandOf(f1)], 1, 'the At resonance chip’s band is a full bar');
  assert.ok(v[bandOf(f1 * 0.78)] < 0.1, 'the Off resonance chip’s band is low');
  assert.ok(v.filter((x: number) => x >= 0.5).length >= 4);
  // The regression: one sample at each bar centre never got above 0.05.
  let old = 0;
  for (let i = 0; i < 40; i++) {
    const f = fMin * Math.pow(fMax / fMin, (i + 0.5) / 40);
    for (const m of modes) old = Math.max(old, modeResponse(f, m.hz, Q0) / Q0);
  }
  assert.ok(old < 0.05, `old centre sampling peaked at ${old}`);
});

test('#22/#23 Intro strip: the screen draws responseBands; the guide says the tall bars are resonances', () => {
  const src = read('src/screens/lab/cymatics/modules/shared.tsx');
  assert.match(src, /const vals = useMemo\(\(\) => responseBands\(modes, Q, fMin, fMax, bars\), \[modes, Q, fMin, fMax\]\);/);
  assert.match(src, /RESPONSE vs FREQUENCY · CALCULATED/);
  const seeing = CYMATICS_SCREEN_GUIDES.intro.seeing.join(' ');
  // Wording from the Guided Lessons return (2026-11-08).
  assert.match(seeing, /RESPONSE vs FREQUENCY · CALCULATED strip, each tall bar is a resonance and the white line is your drive\./);
});
