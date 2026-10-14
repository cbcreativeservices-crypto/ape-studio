/**
 * Slider pass 2026-10-14 (owner: every bottom-dock slider must visibly do
 * something, progress smoothly and evenly, and never pause or distract) —
 * Cymatics, Vacuum Tube and Amp labs.
 *
 * Pure mappings are re-stated here and pinned to the source so a drift in
 * either fails; the Gallery WEIGHT lane is imported from its own module.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const HARMONY = read('src/screens/lab/cymatics/modules/modHarmony.tsx');
const SYSTEMS = read('src/screens/lab/cymatics/modules/modSystems.tsx');
const BIAS = read('src/screens/lab/amp/modules/mod3Bias.tsx');
const CLASSES = read('src/screens/lab/amp/modules/mod4Classes.tsx');
const REAL = read('src/screens/lab/amp/modules/mod7RealWorld.tsx');
const TUBE = read('src/screens/lab/tube/VacuumTubeLabScreen.tsx');
const PLATE = read('src/screens/lab/cymatics/PlateStudioScreen.tsx');
const MEMBRANE = read('src/screens/lab/cymatics/MembraneStudioScreen.tsx');
const GALLERY = read('src/screens/lab/cymatics/GalleryArt.tsx');

// ── 7 · DETUNE: square taper, 0.001 % steps ─────────────────────────────────
const DETUNE_MAX = 0.03;
const detuneOf = (v: number) => {
  const t = Math.max(0, Math.min(1, v));
  return Math.round(t * t * DETUNE_MAX * 1e5) / 1e5;
};
const detunePos = (d: number) => Math.sqrt(Math.max(0, d) / DETUNE_MAX);

test('DETUNE: square taper is monotonic, reaches 3 %, and round-trips without the thumb jumping', () => {
  let prev = -1;
  let distinct = 0;
  for (let i = 0; i <= 300; i++) {
    const d = detuneOf(i / 300);
    assert.ok(d >= prev, `not monotonic at ${i}`);
    if (d > prev) distinct++;
    prev = d;
    // the stored value puts the thumb back within a fraction of a point
    // (inside the lock detent the first ~1.3 % of travel rounds to 0)
    assert.ok(Math.abs(detunePos(d) - i / 300) < (i / 300 < 0.05 ? 0.015 : 0.004), `thumb jumps at ${i}: ${detunePos(d)}`);
  }
  assert.equal(detuneOf(1), DETUNE_MAX);
  assert.equal(detuneOf(0), 0);
  assert.ok(distinct >= 290, `only ${distinct} distinct values on a 300-pt lane (was 31)`);
  // the lock detent is a few percent of travel, not the old 13 %
  assert.ok(detunePos(0.00005) < 0.05);
  assert.match(HARMONY, /const DETUNE_LOCK = 0\.00005;/);
  assert.match(HARMONY, /value: Math\.sqrt\(Math\.max\(0, detune\) \/ DETUNE_MAX\)/);
  assert.match(HARMONY, /setDetune\(Math\.round\(t \* t \* DETUNE_MAX \* 1e5\) \/ 1e5\)/);
  assert.match(HARMONY, /\(detune \* 100\)\.toFixed\(2\)/);
  assert.doesNotMatch(HARMONY, /0\.0005\b/);
});

// ── 8 · HARMONIC: five even bands ──────────────────────────────────────────
test('HARMONIC: each of the five values owns 20 % of the lane and the thumb rests mid-band', () => {
  const nOf = (v: number) => 1 + Math.min(4, Math.floor(Math.max(0, Math.min(1, v)) * 5));
  const count = [0, 0, 0, 0, 0, 0];
  const LANE = 1000;
  for (let i = 0; i < LANE; i++) count[nOf((i + 0.5) / LANE)]++;
  for (let n = 1; n <= 5; n++) {
    assert.equal(count[n], LANE / 5, `harmonic ${n}: ${count[n]}`);
    assert.equal(nOf((n - 0.5) / 5), n, `thumb for ${n} reads back ${n}`);
  }
  assert.equal(nOf(1), 5);
  assert.equal(nOf(0), 1);
  assert.match(SYSTEMS, /value: \(n - 0\.5\) \/ 5,/);
  assert.match(SYSTEMS, /setN\(1 \+ Math\.min\(4, Math\.floor\(Math\.max\(0, Math\.min\(1, v\)\) \* 5\)\)\)/);
});

// ── 13 · Power ratio in log2 ────────────────────────────────────────────────
test('Power ratio: log2 lane lands exactly on 0.5 / 1 / 2 / 4 and reaches 10', () => {
  const min = -2;
  const max = Math.log2(10);
  const step = 1 / 12;
  // ControlSlider's own snap (kit.tsx): round to step, clamp to [min, max]
  const ride = (frac: number) => {
    const raw = min + frac * (max - min);
    const v = Math.min(max, Math.max(min, Math.round(raw / step) * step));
    return +(2 ** v).toFixed(3);
  };
  const seen = new Set<number>();
  for (let i = 0; i <= 600; i++) seen.add(ride(i / 600));
  for (const r of [0.25, 0.5, 1, 2, 4, 10]) assert.ok(seen.has(r), `${r}× not reachable`);
  // the stored ratio maps the thumb back onto the same step
  for (const r of [0.25, 0.5, 1, 2, 4]) assert.ok(Number.isInteger(Math.log2(r) * 12), `${r}× sits on a step`);
  assert.equal(ride(1), 10);
  assert.equal(ride(0), 0.25);
  // ½×–2× now takes 2 of 5.32 octaves (38 % of travel) instead of 16 %
  assert.ok((1 - -1) / (max - min) > 0.35);
  assert.match(REAL, /value=\{Math\.log2\(ratio\)\} min=\{-2\} max=\{Math\.log2\(10\)\} step=\{1 \/ 12\}/);
  assert.match(REAL, /setRatio\(\+\(2 \*\* v\)\.toFixed\(3\)\)/);
});

// ── 15 · Gallery WEIGHT: no dead zone above the OFF detent ─────────────────
test('Gallery WEIGHT: every lane step above the detent draws a different line, and it round-trips', async () => {
  const { weightOfPos, posOfWeight, LINE_OFF_DETENT, LINE_MAX_W, LINE_MIN_W } = await import('../src/features/cymatics/lineWeightLane.ts');
  assert.equal(weightOfPos(0), 0);
  assert.equal(weightOfPos(LINE_OFF_DETENT / 2), 0);
  assert.equal(weightOfPos(LINE_OFF_DETENT), LINE_MIN_W);
  assert.equal(weightOfPos(1), LINE_MAX_W);
  // The figure floors strokes at 0.5 px — nothing above the detent may sit below it.
  const LANE = 300;
  let prev = -1;
  let longestRun = 0;
  let run = 0;
  for (let i = 0; i <= LANE; i++) {
    const w = weightOfPos(i / LANE);
    if (i / LANE >= LINE_OFF_DETENT) assert.ok(w >= LINE_MIN_W, `pos ${i}: ${w} px draws as the 0.5-px floor`);
    assert.ok(w >= prev);
    run = w === prev ? run + 1 : 0;
    longestRun = Math.max(longestRun, run);
    prev = w;
  }
  // 0.1-px steps over ~290 points: at most ~9 points share a weight (was 37 drawing the same 0.5 px)
  assert.ok(longestRun <= 10, `${longestRun} points draw the same line`);
  for (let k = 5; k <= 40; k++) {
    const w = k / 10;
    assert.equal(weightOfPos(posOfWeight(w)), w, `round trip ${w}`);
  }
  assert.equal(posOfWeight(0), 0);
  assert.ok(posOfWeight(1.5) > 0.25 && posOfWeight(1.5) < 0.35, 'home sits a third of the way up');
  assert.match(GALLERY, /value: posOfWeight\(art\.lineWeight\)/);
  assert.match(GALLERY, /patchLive\(\{ lineWeight: weightOfPos\(v\) \}\)/);
  assert.match(GALLERY, /home: posOfWeight\(1\.5\)/);
});

// ── 3 · precise FREQ readout ────────────────────────────────────────────────
test('FREQ readout moves inside a mode zone: 0.1 Hz below 10 kHz on the studios', async () => {
  const { formatHz, formatHzPrecise } = await import('../src/features/cymatics/music.ts');
  assert.equal(formatHzPrecise(1033.44), '1033.4 Hz');
  assert.equal(formatHzPrecise(1033.44, true), '1033.4Hz');
  assert.notEqual(formatHzPrecise(1031.2), formatHzPrecise(1034.9));
  assert.equal(formatHz(1031.2), formatHz(1034.9), 'the shared formatter is unchanged (other callers)');
  assert.equal(formatHzPrecise(12345), formatHz(12345));
  for (const src of [PLATE, MEMBRANE]) {
    assert.match(src, /format: \(\) => `\$\{formatHzPrecise\(freq\)\} · /);
    assert.match(src, /k: 'DRIVE', v: formatHzPrecise\(freq, true\)/);
  }
});

// ── 9 · ANGLE is an options key ─────────────────────────────────────────────
test('ANGLE (amp M3) is a four-way options key with the class in each label', () => {
  assert.match(BIAS, /optionsParam<number>\(\{\s*id: 'angle'/);
  for (const l of ['90° · C', '180° · B', '270° · AB', '360° · A']) assert.ok(BIAS.includes(`label: '${l}'`), l);
  assert.doesNotMatch(BIAS, /faderParam\(\{ id: 'angle'/);
  assert.match(BIAS, /initialParam: 'angle'/);
});

// ── 10 · LEVEL locks when class A SIGNAL is off ─────────────────────────────
test('LEVEL (amp M4) is locked with a reason while class A SIGNAL is off', () => {
  assert.match(CLASSES, /const effDrive = cls === 'A' && !signalOn \? 0 : drive;/);
  assert.match(CLASSES, /locked: cls === 'A' && !signalOn \? 'SIGNAL is off — turn it on to ride LEVEL\.' : undefined/);
});

// ── 11 · Tube lanes lead with a moving number ───────────────────────────────
test('Tube GRID V / BIAS / DRIVE lanes show a percentage before the word', () => {
  assert.match(TUBE, /format: \(x\) => `\$\{pct\(x\)\} · \$\{word\(x\)\}`/);
  assert.match(TUBE, /format: \(x\) => `\$\{pct\(x\)\} · \$\{x < 0\.22 \? 'too negative'/);
  assert.match(TUBE, /format: \(x\) => `\$\{pct\(x\)\} · \$\{x < 0\.3 \? 'clean/);
});
