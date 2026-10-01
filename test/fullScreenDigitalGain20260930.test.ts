/**
 * FULL SCREEN build, group 3 (2026-09-30) — Digital Audio Systems (8 modules)
 * and Gain Staging (8 modules) on the rack's FULL SCREEN (D35: a working
 * surface — controls docked, readouts on top, EVERYTHING in the drawing
 * zooms with the step).
 *
 *  • every one of the 16 module stages opts into `fullScreen: true`;
 *  • every Skia stage scene lays out at the glass size (÷ ts) and paints
 *    through a scaled <Group>, so strokes, dots, blurs and meters zoom;
 *  • the RN labels over those canvases go through SText (fontSize AND
 *    position × ts), never a raw RNText that would stay phone-sized;
 *  • the Gain chain columns (a view-built stage) scale their StyleSheet;
 *  • the sample-inspect strip divides the finger's X by the same scale.
 * Plus unit tests of the pure style maths in stageScaleStyle.ts.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { test } from 'node:test';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      try {
        readFileSync(candidate);
        return nextResolve(candidate.href, context);
      } catch {
        /* fall through */
      }
    }
    return nextResolve(specifier, context);
  },
});

const { flattenStyle, scaleStyleRec, scaleStylesRec } = await import('../src/screens/lab/stageScaleStyle.ts');

const src = (rel: string) => readFileSync(new URL(`../src/screens/lab/${rel}`, import.meta.url), 'utf8');

/** The body of one `export function Name(` up to the next top-level export. */
function body(file: string, name: string): string {
  const start = file.indexOf(`export function ${name}(`);
  assert.ok(start >= 0, `${name} is exported`);
  const rest = file.slice(start + 1);
  const next = rest.search(/\n(export |const \w+ = StyleSheet|\/\/ ─{10,})/);
  return next >= 0 ? rest.slice(0, next) : rest;
}

const count = (s: string, re: RegExp) => (s.match(re) ?? []).length;

// ── 1. All 16 module stages opt into the rack's FULL SCREEN ─────────────────
test('all 16 Digital + Gain module stages opt into the rack full screen', () => {
  const expected: Record<string, number> = {
    'digital/modules/modAnalog.tsx': 2,
    'digital/modules/modQuant.tsx': 2,
    'digital/modules/modChain.tsx': 2,
    'digital/modules/modDac.tsx': 2,
    'gain/modules/modLearn.tsx': 5,
    'gain/modules/modExplore.tsx': 3,
  };
  let total = 0;
  for (const [rel, n] of Object.entries(expected)) {
    const s = src(rel);
    const stages = count(s, /stage=\{\{/g);
    const full = count(s, /fullScreen: true/g);
    assert.equal(stages, n, `${rel}: ${n} rack stages`);
    assert.equal(full, stages, `${rel}: every stage carries fullScreen: true`);
    total += full;
  }
  assert.equal(total, 16);
});

// ── 2. Every Skia stage scene zooms as one picture ──────────────────────────
const SKIA_STAGES: [string, string[]][] = [
  ['digital/vizSignal.tsx', ['AnalogChainView', 'SamplingView']],
  ['digital/vizQuant.tsx', ['QuantView', 'InspectStripView']],
  ['digital/vizChain.tsx', ['GainStagingView', 'FloatHeadroomView']],
  ['digital/vizDac.tsx', ['ReconstructionView', 'JitterView']],
];

test('each Skia stage scene lays out at the glass size and paints through a scaled Group', () => {
  for (const [rel, names] of SKIA_STAGES) {
    const file = src(rel);
    assert.match(file, /import \{ useStageTextScale \} from '\.\.\/rack\/stageAspect'/, `${rel} imports the scale`);
    for (const name of names) {
      const b = body(file, name);
      assert.match(b, /const ts = useStageTextScale\(\);/, `${name} reads the stage text scale`);
      // Layout at the glass size: width ÷ ts and height ÷ ts.
      assert.match(b, /= (width|fullW) \/ ts;/, `${name} lays out its width at the glass size`);
      assert.match(b, /= (height|fullH) \/ ts;/, `${name} lays out its height at the glass size`);
      // Painted through ONE scaled Group, closed before the canvas ends.
      assert.equal(count(b, /<Group transform=\{\[\{ scale: ts \}\]\}>/g), 1, `${name} paints through a scaled Group`);
      const open = b.indexOf('<Group transform={[{ scale: ts }]}>');
      const close = b.lastIndexOf('</Group>');
      const canvasEnd = b.indexOf('</Canvas>');
      assert.ok(open < close && close < canvasEnd, `${name}: the scaled Group wraps the whole canvas`);
      // The canvas box itself is the FULL size (the Group does the zoom).
      assert.doesNotMatch(b, /<Canvas[^>]*style=\{\{[^}]*width: w\b/, `${name}: the Canvas is not boxed at the glass width`);
      // Overlay labels never stay phone-sized: no raw RNText in a stage scene.
      assert.doesNotMatch(b, /<RNText/, `${name}: overlay labels go through SText`);
    }
  }
});

test('the sample-inspect strip divides the finger X by the stage scale', () => {
  const b = body(src('digital/vizQuant.tsx'), 'InspectStripView');
  assert.match(b, /locX \/ tsRef\.current - INS_PAD/);
  assert.match(b, /tsRef\.current = ts;/);
});

test('scene labels on these stages keep the 9-pt floor (labels may only grow)', () => {
  // The glass styles (SText multiplies them by ts ≥ 1 in full screen).
  const sig = src('digital/vizSignal.tsx');
  for (const m of sig.matchAll(/fontSize: ([\d.]+)/g)) assert.ok(Number(m[1]) >= 9, `vizSignal fontSize ${m[1]}`);
  const dac = src('digital/vizDac.tsx');
  for (const m of dac.matchAll(/fontSize: ([\d.]+)/g)) assert.ok(Number(m[1]) >= 9, `vizDac fontSize ${m[1]}`);
  for (const name of ['GainStagingView', 'FloatHeadroomView']) {
    const b = body(src('digital/vizChain.tsx'), name);
    for (const m of b.matchAll(/fontSize: ([\d.]+)/g)) assert.ok(Number(m[1]) >= 9, `${name} fontSize ${m[1]}`);
  }
  // Today's collision fixes stay: the Gain region label is 44 wide on the glass.
  assert.match(src('gain/gainViz.tsx'), /vRegionUnder: \{ width: 44, textAlign: 'center' \}/);
});

// ── 3. The Gain chain columns (view-built) scale their StyleSheet ───────────
test('the Gain ChainStage and its meters scale every px with the stage', () => {
  const file = src('gain/gainViz.tsx');
  assert.match(file, /import \{ useScaledStyles \} from '\.\.\/stageScale'/);
  const stage = body(file, 'ChainStage');
  assert.match(stage, /const ts = useStageTextScale\(\);/);
  assert.match(stage, /const s = useScaledStyles\(styles\);/);
  assert.match(stage, /Math\.max\(44, h \/ ts - 110\) \* ts/, 'meter height scales from the glass rule');
  assert.match(stage, /<StageIcon kind=\{c\.kind\} size=\{20 \* ts\} \/>/);
  assert.doesNotMatch(stage, /styles\./, 'ChainStage never reads the unscaled sheet');
  const meter = body(file, 'StageMeterV');
  assert.match(meter, /const s = useScaledStyles\(styles\);/);
  assert.doesNotMatch(meter, /styles\./, 'StageMeterV never reads the unscaled sheet');
  // The Troubleshoot trophy frame zooms too.
  assert.match(src('gain/modules/modExplore.tsx'), /<SView pointerEvents="none" style=\{styles\.trophyFrame\} \/>/);
});

// ── 4. The pure style maths ─────────────────────────────────────────────────
test('scaleStyleRec multiplies pixel keys only, and leaves a 1× style untouched', () => {
  const style = {
    position: 'absolute',
    left: 12,
    top: 3,
    width: 68,
    fontSize: 9,
    letterSpacing: 0.5,
    fontFamily: 'Mono',
    color: '#fff',
    flex: 1,
    opacity: 0.5,
    height: '50%',
  };
  const same = scaleStyleRec(style, 1);
  assert.deepEqual(same, style);
  const two = scaleStyleRec(style, 2);
  assert.deepEqual(two, {
    position: 'absolute',
    left: 24,
    top: 6,
    width: 136,
    fontSize: 18,
    letterSpacing: 1,
    fontFamily: 'Mono',
    color: '#fff',
    flex: 1,
    opacity: 0.5,
    height: '50%',
  });
  // 9 pt on the glass is 27 pt at 3× — labels only grow.
  assert.equal(scaleStyleRec({ fontSize: 9 }, 3).fontSize, 27);
});

test('scaleStyleRec flattens style arrays the way React Native does (later wins)', () => {
  const lbl = { position: 'absolute', fontSize: 9.5, color: '#8a8f9a' };
  const out = scaleStyleRec([lbl, false, null, undefined, { left: 10, top: 4, color: '#f00' }], 2);
  assert.deepEqual(out, { position: 'absolute', fontSize: 19, color: '#f00', left: 20, top: 8 });
  assert.deepEqual(flattenStyle([[{ a: 1 }], { b: 2 }]), { a: 1, b: 2 });
  assert.deepEqual(flattenStyle(undefined), {});
});

test('scaleStylesRec scales a whole sheet and returns the very same sheet at 1×', () => {
  const sheet = {
    vWrap: { alignItems: 'center', gap: 3, width: 34 },
    vCeil: { position: 'absolute', left: -1, right: -1, height: 2, backgroundColor: '#ff5f4e' },
    pathLine: { flex: 1, height: 1, backgroundColor: '#3a4150' },
  };
  assert.equal(scaleStylesRec(sheet, 1), sheet);
  const s = scaleStylesRec(sheet, 1.5);
  assert.deepEqual(s.vWrap, { alignItems: 'center', gap: 4.5, width: 51 });
  assert.deepEqual(s.vCeil, { position: 'absolute', left: -1.5, right: -1.5, height: 3, backgroundColor: '#ff5f4e' });
  assert.deepEqual(s.pathLine, { flex: 1, height: 1.5, backgroundColor: '#3a4150' });
});
