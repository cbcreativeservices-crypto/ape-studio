/**
 * Vocal folds redraw (owner GO 2026-10-14) — the model behind the Speech &
 * Voice lab's laryngoscopic view. Checks the anatomy and timing relationships
 * (never re-runs the drawing), plus the decency/colour rules: the true folds
 * are thin pearly bands, nothing is skin-toned.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  VF_AX, VF_AY, VF_MEMBRANOUS, VF_OPEN_MAX, VF_PALETTE, VF_SHOWN_HZ, VF_SLOWDOWN, VF_STILL_PHASE, VF_TYPICAL_F0_HZ,
  VF_T_OPEN, VF_T_CLOSE, foldBase, foldProfile, foldWidth, foldsFrame, glottalPulse, medialX, posterior,
} from '../src/screens/lab/speech/vocalFoldsGeometry.ts';

const hsl = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d) h = max === r ? 60 * (((g - b) / d) % 6) : max === g ? 60 * ((b - r) / d + 2) : 60 * ((r - g) / d + 4);
  return { h: (h + 360) % 360, s, l, chroma: d };
};

test('the folds meet at the anterior commissure (front, top) in every state', () => {
  for (const ab of [0, 0.5, 1]) for (const ph of [0, 0.2, 0.5, 0.9]) {
    const open = glottalPulse(ph) * (1 - ab);
    assert.equal(medialX(-1, 0, ab, open), VF_AX);
    assert.equal(medialX(1, 0, ab, open), VF_AX);
    assert.equal(foldBase(-1, 0, ab)[1], VF_AY);
  }
});

test('voiced: only the membranous front ~2/3 vibrates; the vocal processes stay together', () => {
  assert.ok(VF_MEMBRANOUS > 0.55 && VF_MEMBRANOUS < 0.75);
  for (let u = VF_MEMBRANOUS; u <= 1; u += 0.05) assert.equal(foldProfile(u), 0);
  const back = posterior(1, 0)[0] - posterior(-1, 0)[0];
  assert.ok(back <= 1.2, `adducted vocal processes ${back} apart`);
  // widest half-gap at mid-membranous fold, open phase
  const peak = medialX(1, VF_MEMBRANOUS / 2, 0, 1) - VF_AX;
  assert.ok(Math.abs(peak - (VF_OPEN_MAX + (posterior(1, 0)[0] - VF_AX) * VF_MEMBRANOUS / 2)) < 1e-9);
});

test('Rosenberg pulse: opens 2–3× slower than it closes, closed ~40 % of the cycle, continuous', () => {
  assert.ok(VF_T_OPEN > VF_T_CLOSE, 'skewed: the closing phase is quicker');
  assert.ok(VF_T_OPEN + VF_T_CLOSE >= 0.55 && VF_T_OPEN + VF_T_CLOSE <= 0.65, 'open quotient ~0.6');
  assert.ok(VF_T_OPEN / VF_T_CLOSE >= 2, 'opening 2–3× slower than closing, as in speech');
  let prev = glottalPulse(0);
  for (let i = 1; i <= 1000; i++) {
    const v = glottalPulse(i / 1000);
    assert.ok(v >= 0 && v <= 1);
    assert.ok(Math.abs(v - prev) < 0.02, `jump at ${i / 1000}`);
    prev = v;
  }
  assert.ok(Math.abs(glottalPulse(VF_T_OPEN) - 1) < 1e-9);
  assert.equal(glottalPulse(0.8), 0);
  assert.ok(glottalPulse(VF_STILL_PHASE) > 0.3 && glottalPulse(VF_STILL_PHASE) < 0.9, 'reduced-motion still frame is part-way open ("mid-cycle")');
});

test('unvoiced: the breathing V opens 30–50° at the back, the folds do not vibrate', () => {
  const [px, py] = posterior(1, 1);
  const half = (Math.atan2(px - VF_AX, py - VF_AY) * 180) / Math.PI;
  assert.ok(2 * half >= 30 && 2 * half <= 50, `included angle ${2 * half}°`);
  const a = foldsFrame(0.3, 1), b = foldsFrame(0.7, 1);
  assert.equal(a.foldL, b.foldL, 'no vibration when abducted');
  assert.equal(a.waveOpacity, 0);
});

test('the true folds are THIN bands (length ≥ 6× width) — never wide lobes', () => {
  let maxW = 0;
  for (let u = 0; u <= 1; u += 0.01) maxW = Math.max(maxW, foldWidth(u));
  const len = Math.hypot(posterior(1, 0)[0] - VF_AX, posterior(1, 0)[1] - VF_AY);
  assert.ok(len / maxW >= 6, `length ${len} / width ${maxW}`);
  assert.ok(foldWidth(0) < 2, 'tapered to the commissure');
});

test('colours: folds pearly (near-neutral, light); every tissue pink-red, nothing skin-toned', () => {
  for (const k of ['foldMedial', 'foldLateral'] as const) {
    const c = hsl(VF_PALETTE[k]);
    assert.ok(c.chroma <= 0.1 && c.l >= 0.78, `${k} ${VF_PALETTE[k]}`);
  }
  const tissue = ['fieldCentre', 'fieldMid', 'vestibuleCentre', 'vestibuleEdge', 'falseFold', 'falseFoldHi', 'interarytenoid', 'arytenoid', 'arytenoidHi', 'corniculate', 'aeRim', 'aeRimHi', 'epiglottis', 'epiglottisRim', 'vessel'] as const;
  for (const k of tissue) {
    const { h } = hsl(VF_PALETTE[k]);
    assert.ok(h <= 10 || h >= 340, `${k} ${VF_PALETTE[k]} hue ${h.toFixed(1)}° is outside pink-red (skin tones sit ~15–40°)`);
  }
});

test('the drawing honestly says it is slowed, and by about how much', () => {
  assert.equal(VF_SLOWDOWN, Math.round(VF_TYPICAL_F0_HZ / VF_SHOWN_HZ));
  assert.ok(VF_SLOWDOWN >= 50);
  const src = readFileSync(new URL('../src/screens/lab/speech/speechViz.tsx', import.meta.url), 'utf8');
  assert.match(src, /SLOW MOTION · ABOUT \$\{VF_SLOWDOWN\}× SLOWER/);
  assert.match(src, /STILL FRAME/);
  // one clock on the UI thread; no per-frame React state
  assert.match(src, /useFrameCallback\(/);
  assert.doesNotMatch(src, /setInterval\(\(\) => setPhase/);
});

test('a frame builds every animated path with finite numbers', () => {
  for (const ab of [0, 0.37, 1]) for (const ph of [0, 0.13, 0.36, 0.5, 0.99, 1234.56]) {
    const f = foldsFrame(ph, ab);
    for (const [k, v] of Object.entries(f)) {
      if (typeof v === 'string') assert.doesNotMatch(v, /NaN|Infinity|undefined/, `${k} @ ab ${ab} ph ${ph}`);
      if (typeof v === 'number') assert.ok(Number.isFinite(v), k);
    }
  }
});
