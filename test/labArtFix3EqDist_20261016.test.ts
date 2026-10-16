/**
 * EQ Lab + Distortion — lab-art fix round 3 (2026-10-16). Pins what the
 * grading found:
 *   EQ   · the FX hero drew its 20 Hz–20 kHz curve ACROSS the time-domain wave
 *          box, with its three tones at 1.3 / 3.6 / 9 cycles (not in
 *          proportion); the Camera Analogy camera stood below the floor with
 *          its tripod on the graph frame; most response graphs had no dB
 *          scale; Match the Curve named colours the lines do not have.
 *   DIST · the waveshape was normalised to its own peak, so a clipped square
 *          stood taller than the input, as if clipping raised the level.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const read = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), 'utf8');
const anim = read('screens/lab/fxAnim.tsx');
const block = (src: string, start: string, end: string) => src.slice(src.indexOf(start), src.indexOf(end, src.indexOf(start)));

test('EQ hero: the curve has its own strip, never drawn inside the wave box', () => {
  const eq = block(anim, 'function EqFlow(', '// ─────────────────────────────────────────────────────────── delay flow ──');
  const scene = block(eq, '<FlowScene', '</FlowScene>');
  assert.doesNotMatch(scene, /curve\./, 'no curve path inside the wave box');
  assert.match(eq, /const hw = h - EQ_STRIP_H - EQ_STRIP_GAP;/);
});

test('EQ hero: the three tones are drawn in true proportion over one time window', () => {
  const eq = block(anim, 'function EqFlow(', '// ─────────────────────────────────────────────────────────── delay flow ──');
  assert.match(anim, /const EQ_COMP_FREQS = \[150, 1000, 6000\];/);
  assert.match(anim, /const EQ_WINDOW_MS = \d+;/);
  assert.match(eq, /const k2 = \(PI2 \* EQ_COMP_FREQS\[2\] \* EQ_WINDOW_MS\) \/ 1000 \/ w;/);
  assert.doesNotMatch(anim, /EQ_CYCLES/);
});

test('Camera Analogy: the camera stands on the near floor, clear of the graph frame', () => {
  const src = read('screens/lab/eq/modules/CameraAnalogy.tsx');
  const dy = Number(/const CAM_DY = (-?\d+);/.exec(src)![1]);
  const near = Number(/const FLOOR_NEAR_Y = (\d+);/.exec(src)![1]);
  const sceneH = Number(/const SCENE_H = (\d+);/.exec(src)![1]);
  const feet = 168 + dy; // the tripod legs end at y 168 in camera units
  assert.ok(feet < near && near < sceneH, `feet ${feet} on the floor (to ${near}), inside the scene (${sceneH})`);
});

test('every EQ response graph prints its level scale', () => {
  const dir = new URL('../src/screens/lab/eq/modules/', import.meta.url);
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.tsx') || f === 'eqResponseGraph.tsx') continue;
    const src = readFileSync(new URL(f, dir), 'utf8');
    if (!src.includes('<ResponseCurveGraph')) continue;
    assert.match(src, /import \{ ResponseCurveGraph \} from '\.\/eqResponseGraph';/, f);
  }
});

test('dB scale labels: +half, 0, −half with the unit on the top one', async () => {
  const g = read('screens/lab/eq/modules/eqResponseGraph.tsx');
  assert.match(g, /\[dbRange \/ 2, 0, -dbRange \/ 2\]/);
  assert.match(g, /i === 0 \? ` \$\{unit\}` : ''/);
});

test('Match the Curve names the colours the lines really have', () => {
  const src = read('screens/lab/eq/modules/MatchCurve.tsx');
  assert.doesNotMatch(src, /YOUR EQ \(amber\)/);
  assert.match(src, /thin grey/);
});

test('Distortion: one true level scale — real −20 dBFS input, ±0 dBFS ceiling, no peak normalising', () => {
  const dist = block(anim, 'function DistFlow(', '// ─────────────────────────────────────────────────── phase/stereo flow ──');
  assert.doesNotMatch(dist, /peak/);
  assert.match(anim, /export const DIST_IN_PEAK = Math\.pow\(10, -20 \/ 20\);/);
  assert.match(dist, /<FlowGlow path=\{outPath\} width=\{2\} gradH=\{h\} gradY=\{\[h \/ 2 - A, h \/ 2 \+ A\]\} \/>/);
  const viz = read('features/lab/fxViz.tsx');
  const ws = block(viz, 'export function WaveshapeGraph(', '// ──────────────────────────────────────────────────── EchoTimelineGraph ──');
  assert.doesNotMatch(ws, /\/ peak/);
  assert.match(ws, /const aIn = Math\.pow\(10, -20 \/ 20\);/);
  const cfg = read('screens/lab/fxLabConfigs.tsx');
  assert.doesNotMatch(cfg, /shape-normalized/);
});

test('Distortion physics: a hard clip never passes 0 dBFS; below +20 dB drive it does not clip at all', () => {
  const hard = (x: number) => (x > 1 ? 1 : x < -1 ? -1 : x);
  const aIn = Math.pow(10, -20 / 20);
  for (const d of [6, 12, 24, 36]) {
    const g = Math.pow(10, d / 20);
    let pk = 0;
    for (let i = 0; i < 96; i++) pk = Math.max(pk, Math.abs(hard(aIn * g * Math.sin((2 * Math.PI * i) / 96))));
    assert.ok(pk <= 1 + 1e-12);
    if (d < 20) assert.ok(Math.abs(pk - aIn * g) < 1e-3, `+${d} dB is clean gain`);
  }
});
