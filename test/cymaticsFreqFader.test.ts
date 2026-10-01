/**
 * Cymatics Chladni studio — the FREQ fader map (src/features/cymatics/freqFader.ts).
 *
 * TestFlight build 32 (owner, iPhone 15 Pro Max): "the plate is not responding
 * and changing its pattern when I'm moving the frequency slider". On the old
 * plain log fader the default aluminum plate read AT RESONANCE at 0 of 301
 * lane positions — one point of travel (~1.5 %) is wider than the whole
 * resonance (~0.2 %), so every drag stepped over every mode.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import type { PlateSpec } from '../src/features/cymatics/plateModes.ts';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { DEFAULT_PLATE, effectiveQ, plateModes, readResonance } = await import('../src/features/cymatics/plateModes.ts');
const { MATERIALS } = await import('../src/features/cymatics/materials.ts');
const { makeFreqFader } = await import('../src/features/cymatics/freqFader.ts');
const { BEZEL_RES_WORD, PLATE_BEZEL_FLEX, bezelModeLabel } = await import('../src/features/cymatics/plateBezel.ts');
const { formatHz } = await import('../src/features/cymatics/music.ts');

const F_MIN = 30;
const F_MAX = 3000;
/** Fader lane positions a finger can land on (≈ 1 per point on a phone). */
const LANE = 300;

const L = await import('../src/features/cymatics/modalLibrary.ts');
const LIB_IDS = ['triangle', 'hexagon', 'ring', 'ring-clamped-inner', 'bell', 'guitar', 'violin', 'violin-fholes'] as const;
// The ESM test runner has no `require`; prime the loader from the shipped files (as cymaticsLibrary.test.ts does).
for (const id of LIB_IDS) L.primeLibraryShape(L.parseLibraryFile(JSON.parse(readFileSync(fileURLToPath(new URL(`../src/data/cymatics/${id}.json`, import.meta.url)), 'utf8'))));
const setups: PlateSpec[] = [
  ...MATERIALS.flatMap((m) => (['square', 'rect', 'circle'] as const).map((shape) => ({ ...DEFAULT_PLATE, material: m.id, shape }) as PlateSpec)),
  // the eight solved (FEM) shapes, on the default metal and on a damped wood
  ...LIB_IDS.flatMap((id) => (['aluminum', 'plywood'] as const).map((material) => ({ ...DEFAULT_PLATE, material, shape: id }) as PlateSpec)),
];

test('every excitable mode reads AT RESONANCE over several lane positions, on every material and shape', () => {
  for (const spec of setups) {
    const modes = plateModes(spec, 16);
    const Q = effectiveQ(spec.material, spec.damping);
    const fader = makeFreqFader(F_MIN, F_MAX, modes, Q);
    const hits = new Map<string, number>();
    for (let i = 0; i <= LANE; i++) {
      const r = readResonance(fader.hzAt(i / LANE), modes, Q);
      if (r.state === 'at' && r.dominant) hits.set(r.dominant.id, (hits.get(r.dominant.id) ?? 0) + 1);
    }
    // Modes that the plate itself lets dominate (a weakly driven mode beside a
    // strong one never does, even driven exactly on its own frequency).
    const ex = modes.filter((m) => m.drive > 0.05 && m.hz > F_MIN * 1.05 && m.hz < F_MAX / 1.05 && readResonance(m.hz, modes, Q).state === 'at' && readResonance(m.hz, modes, Q).dominant?.id === m.id);
    for (const m of ex) {
      // Degenerate pairs share a frequency; either member counts.
      const n = [...hits.entries()].filter(([id]) => modes.find((x) => x.id === id && Math.abs(x.hz / m.hz - 1) < 1e-3)).reduce((s, [, c]) => s + c, 0);
      assert.ok(n >= 3, `${spec.material} ${spec.shape}: mode ${m.label} at ${m.hz.toFixed(1)} Hz is AT on only ${n} of ${LANE + 1} positions`);
    }
  }
});

test('the default plate: a drag now crosses each resonance instead of stepping over it', () => {
  const modes = plateModes(DEFAULT_PLATE, 16);
  const Q = effectiveQ(DEFAULT_PLATE.material, DEFAULT_PLATE.damping);
  const fader = makeFreqFader(F_MIN, F_MAX, modes, Q);
  let atNew = 0;
  let atOld = 0;
  for (let i = 0; i <= LANE; i++) {
    if (readResonance(fader.hzAt(i / LANE), modes, Q).state === 'at') atNew++;
    if (readResonance(F_MIN * Math.pow(F_MAX / F_MIN, i / LANE), modes, Q).state === 'at') atOld++;
  }
  assert.equal(atOld, 0, 'the regression this pins: the plain log fader never hit a mode');
  assert.ok(atNew >= 40, `warped fader AT on ${atNew} positions`);
  assert.ok(atNew <= LANE * 0.3, 'most of the lane is still BETWEEN resonances — patterns snap in only near modes');
});

test('the map is monotonic, spans 30 Hz – 3 kHz, and posOf is the exact inverse of hzAt', () => {
  for (const spec of setups) {
    const modes = plateModes(spec, 16);
    const Q = effectiveQ(spec.material, spec.damping);
    const fader = makeFreqFader(F_MIN, F_MAX, modes, Q);
    assert.ok(Math.abs(fader.hzAt(0) - F_MIN) < 1e-6 && Math.abs(fader.hzAt(1) - F_MAX) < 1e-6);
    let prev = 0;
    for (let i = 1; i <= 2000; i++) {
      const f = fader.hzAt(i / 2000);
      assert.ok(f > prev, `${spec.material} ${spec.shape}: not increasing at ${i}`);
      prev = f;
      assert.ok(Math.abs(fader.posOf(f) - i / 2000) < 1e-9, `${spec.material} ${spec.shape}: round trip at ${i} → ${fader.posOf(f)}`);
    }
    // Every mode sits on the fader where the plain log fader put it — within a
    // zone's width when two modes are too close for a full zone each.
    for (const m of modes.filter((x) => x.drive > 0.05 && x.hz > F_MIN && x.hz < F_MAX)) {
      const plain = Math.log(m.hz / F_MIN) / Math.log(F_MAX / F_MIN);
      assert.ok(Math.abs(fader.posOf(m.hz) - plain) < 0.05, `${spec.material} ${spec.shape} ${m.label}: ${fader.posOf(m.hz).toFixed(3)} vs ${plain.toFixed(3)}`);
    }
  }
});

test('the studio drives the FREQ fader through the warp, unrounded', () => {
  const src = readFileSync(new URL('../src/screens/lab/cymatics/PlateStudioScreen.tsx', import.meta.url), 'utf8');
  assert.match(src, /makeFreqFader\(F_MIN, F_MAX, modes, Q\)/);
  assert.match(src, /value: fader\.posOf\(freq\)/);
  assert.match(src, /setFreq\(fader\.hzAt\(v\)\)/);
});

// The bezel on a 390-pt phone: four cells share 334 pt (measured in the web
// preview, 2026-09-30). BezelReadouts' fit rule: mono 13.5 pt × 0.6 em per
// character + 16 pt padding. A value that does not fit drops its key, then
// is cut to an ellipsis — the build-32 bezel cut "(4,0) + (0,4)" and APPROACHING.
// Flex shares what is left after each cell's 16-pt padding and the three
// 1-pt dividers (measured: cells 81.2 / 75.4 / 102.1 / 75.4 for weights
// 1.05 / 0.94 / 1.37 / 0.94 — i.e. 16 + 1 + weight × 62.1).
const STRIP_390 = 334;
const INNER_390 = STRIP_390 - 4 * 16 - 3;
const V_CH = 13.5 * 0.6;
const inner = (k: keyof typeof PLATE_BEZEL_FLEX) =>
  (INNER_390 * PLATE_BEZEL_FLEX[k]) / Object.values(PLATE_BEZEL_FLEX).reduce((a: number, b: number) => a + b, 0);
const fitsCell = (k: keyof typeof PLATE_BEZEL_FLEX, v: string) => v.length * V_CH <= inner(k);

test('bezel: every mode label, state word, response and drive value fits its cell at 390 wide', () => {
  for (const spec of setups) {
    for (const m of plateModes(spec, 16)) {
      const v = bezelModeLabel(m.label);
      assert.ok(fitsCell('mode', v), `${spec.shape}: "${m.label}" → "${v}" (${(v.length * V_CH).toFixed(0)} pt in ${inner('mode').toFixed(0)})`);
    }
  }
  for (const w of Object.values(BEZEL_RES_WORD)) assert.ok(fitsCell('res', w), w);
  assert.ok(fitsCell('response', '100%'));
  // the RESPONSE key itself (Oswald 12 pt, measured 55 pt wide) must not be cut either
  assert.ok(inner('response') >= 55, `RESPONSE key: ${inner('response').toFixed(1)} pt`);
  for (let i = 0; i <= 200; i++) {
    const f = F_MIN * Math.pow(F_MAX / F_MIN, i / 200);
    assert.ok(fitsCell('drive', formatHz(f)), formatHz(f));
  }
  // and the compact forms still name the same mode
  assert.equal(bezelModeLabel('(4,0) + (0,4)'), '(4,0)+(0,4)');
  assert.equal(bezelModeLabel('(4,0) − (0,4)'), '(4,0)−(0,4)');
  assert.equal(bezelModeLabel('2 diameters · 1 circle'), '(2,1)');
  assert.equal(bezelModeLabel('10 nodal lines'), '10 lines');
  assert.equal(bezelModeLabel('(2,0)'), '(2,0)');
});

test('the studio uses the compact bezel words, the weights, and opts into the rack full screen', () => {
  const src = readFileSync(new URL('../src/screens/lab/cymatics/PlateStudioScreen.tsx', import.meta.url), 'utf8');
  assert.match(src, /bezelModeLabel\(res\.dominant\.label\)/);
  assert.match(src, /BEZEL_RES_WORD\[res\.state\]/);
  for (const k of ['drive', 'response', 'mode', 'res']) assert.match(src, new RegExp(`flex: PLATE_BEZEL_FLEX\.${k}`));
  assert.match(src, /fullScreen: true/);
});
