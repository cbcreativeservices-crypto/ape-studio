/**
 * Mastering Lab — art fix 2026-10-16 (lab-art grading round 2: "gear drawn as
 * generic icons; labels sitting on limit lines; spectrum peaks hidden under
 * the title plate; empty SLOT placeholders").
 *
 *  • The loudness meter's numbers are MEASURED (K-weighted short-term and
 *    integrated, 4× true peak) and a LEVEL gain shifts them exactly.
 *  • The equal-loudness ghost labels never touch a line at any MONITOR level.
 *  • The monitoring-path gear always fits the glass.
 *  • Source guards: faceplates at true rack proportions with the engine's
 *    real values, the ceiling key off its line and drawn where the as-played
 *    picture puts it, no placeholder slots, no title plate over the spectrum.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import {
  GEAR_DRAW_W, LIMITER_RELEASE_MS, SHORT_TERM_SEC, TP_WARN_DBTP, balanceCurveDb, chainXs, loudnessHistory, measure, perceivedBalanceShift, placeClearLabel, shiftHistory,
  type PathDevice,
} from '../src/screens/lab/mastering/masteringEngine.ts';
import { SR, makeRng, pinkNoise, type Stereo } from '../src/features/ear/earDsp.ts';
import { loudnessLufsEstimate } from '../src/screens/lab/mixing/engine/advanced.ts';

const ROOT = join(import.meta.dirname, '..');
const DIR = 'src/screens/lab/mastering';
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const fnBody = (src: string, name: string) => {
  const a = src.indexOf(`export function ${name}`);
  assert.ok(a >= 0, name);
  const b = src.indexOf('\nexport', a + 10);
  return src.slice(a, b < 0 ? undefined : b);
};

function tone(seconds: number, amp: number, hz = 1000): Stereo {
  const n = Math.round(seconds * SR);
  const l = new Float32Array(n);
  for (let i = 0; i < n; i++) l[i] = amp * Math.sin((2 * Math.PI * hz * i) / SR);
  return { l, r: l.slice() };
}

describe('the loudness meter reads measured numbers', () => {
  const rng = makeRng(11);
  const noise = pinkNoise(8, rng);
  const prog: Stereo = { l: noise.map((v) => v * 0.3), r: noise.map((v) => v * 0.27) };
  const h = loudnessHistory(prog, 40);
  it('integrated and true peak are the lab bezel numbers, to the decimal', () => {
    const m = measure(prog);
    assert.equal(h.integrated, loudnessLufsEstimate(prog));
    assert.equal(h.truePeakDb, m.truePeakDb);
    assert.equal(h.peakDb, m.peakDb);
  });
  it('short-term is empty before the first full 3 s window, then present', () => {
    const firstIdx = h.st.findIndex((v) => v != null);
    const tFirst = ((firstIdx + 1) / h.st.length) * h.seconds;
    assert.ok(tFirst >= SHORT_TERM_SEC && tFirst < SHORT_TERM_SEC + h.seconds / h.st.length + 1e-9, `first short-term at ${tFirst.toFixed(2)} s`);
    assert.ok(h.st.slice(firstIdx).every((v) => v != null && Number.isFinite(v)));
    assert.equal(h.stMax, Math.max(...(h.st.filter((v) => v != null) as number[])));
  });
  it('a steady tone reads the same short-term as integrated (±0.05 LU)', () => {
    const t = loudnessHistory(tone(6, 0.25), 30);
    for (const v of t.st) if (v != null) assert.ok(Math.abs(v - t.integrated) < 0.05, `${v} vs ${t.integrated}`);
  });
  it('a LEVEL gain moves every number by exactly that many dB', () => {
    const s = shiftHistory(h, 6.5);
    assert.ok(Math.abs(s.integrated - h.integrated - 6.5) < 1e-9);
    assert.ok(Math.abs(s.truePeakDb - h.truePeakDb - 6.5) < 1e-9);
    assert.ok(Math.abs(s.stMax - h.stMax - 6.5) < 1e-9);
    // and it IS what measuring the gained programme gives (linear maths)
    const g = Math.pow(10, 6.5 / 20);
    const loud = loudnessHistory({ l: prog.l.map((v) => v * g), r: prog.r.map((v) => v * g) }, 40);
    assert.ok(Math.abs(loud.integrated - s.integrated) < 0.01);
    assert.ok(Math.abs(loud.truePeakDb - s.truePeakDb) < 0.01);
    assert.equal(TP_WARN_DBTP, -1);
  });
});

describe('equal-loudness ghost labels never sit on a line (MonitorLevelStage geometry)', () => {
  const st = fnBody(read(`${DIR}/stages.tsx`), 'MonitorLevelStage');
  // The stage's own constants, read from the source so the test follows them.
  const num = (name: string) => Number(new RegExp(`const ${name} = (\\d+);`).exec(st)?.[1]);
  const x0 = num('x0');
  const x1 = num('x1');
  const top = num('top');
  const bot = num('bot');
  const midY = (top + bot) / 2;
  const yOf = (db: number) => midY - (db / 12) * ((bot - top) / 2);
  const fOfX = (x: number) => 20 * Math.pow(1000, (x - x0) / (x1 - x0));
  const curveY = (b: number, t: number) => (x: number) => yOf(balanceCurveDb(fOfX(x), b, t));
  it('the stage places them with placeClearLabel, never at a fixed offset', () => {
    assert.match(st, /placeClearLabel\(g\.fn, others,/);
    assert.doesNotMatch(st, /g\.l === 83 \? -3/);
    assert.ok(x0 > 0 && x1 > x0 && bot > top);
  });
  for (let level = 55; level <= 100; level += 1) {
    it(`MONITOR ${level} dB: all three labels placed, no curve or grid line through them`, () => {
      const live = curveY(perceivedBalanceShift(level).bassDb, perceivedBalanceShift(level).trebleDb);
      const ghosts = [95, 83, 65].map((l) => ({ l, fn: curveY(perceivedBalanceShift(l).bassDb, perceivedBalanceShift(l).trebleDb) }));
      const zero = () => yOf(0);
      const grid = [6, -6].map((db) => () => yOf(db));
      const placed = [{ x0, y0: top, x1: x0 + 184, y1: top + 16 }, { x0: x1 - 160, y0: bot - 18, x1, y1: bot }];
      for (const g of ghosts) {
        const others = [live, ...ghosts.filter((o) => o.l !== g.l).map((o) => o.fn), ...(g.l === 83 ? [] : [zero]), ...grid];
        const at = placeClearLabel(g.fn, others, [x0 + 6, x0 + 40, x0 + 76, x0 + 112, x0 + 150, x0 + 190, x0 + 226], 33, 10.5, { x0: x0 + 2, y0: top + 1, x1: x1 - 2, y1: bot - 1 }, placed);
        assert.ok(at, `${g.l} dB label found no clear place at MONITOR ${level}`);
        const box = { x0: at.x, y0: at.y - 10.5 * 0.74 - 1, x1: at.x + 33, y1: at.y + 10.5 * 0.22 + 1 };
        for (const c of [g.fn, ...others]) {
          for (let i = 0; i <= 32; i++) {
            const y = c(box.x0 + (33 * i) / 32);
            assert.ok(!(y > box.y0 && y < box.y1), `${g.l} dB label crossed by a line at MONITOR ${level}`);
          }
        }
        placed.push(box);
      }
    });
  }
});

describe('the monitoring path is drawn as gear that fits the glass', () => {
  const all: PathDevice[] = ['daw', 'dac', 'monitorCtl', 'amp', 'passive'];
  it('every chain up to five devices sits inside 8…352 with ≥ 10 units between boxes', () => {
    for (let n = 1; n <= 5; n++) {
      const kinds = all.slice(0, n);
      const { xs, gap } = chainXs(kinds, 8, 352);
      assert.ok(xs[0] >= 8 - 1e-9);
      assert.ok(xs[n - 1] + GEAR_DRAW_W[kinds[n - 1]] <= 352 + 1e-9, `${n} devices overflow`);
      if (n > 1) assert.ok(gap >= 10);
    }
  });
  it('no placeholder slots, no "DAW?" — the ghost says NEXT', () => {
    const st = fnBody(read(`${DIR}/stages.tsx`), 'MonitorPathStage');
    assert.doesNotMatch(st, /SLOT \$\{i \+ 1\}/);
    assert.doesNotMatch(st, /strokeDasharray=\{d \? undefined : '3,3'\}/);
    assert.match(st, /<ChainArt chain=\{chain\} ghost=\{ghost\}/);
    assert.match(read(`${DIR}/mastArt.tsx`), /\{isGhost \? 'NEXT ›' : GEAR_NAME\[k\]\}/);
    assert.doesNotMatch(read(`${DIR}/stages.tsx`), /GearInSvg/, 'the generic glyphs are gone from the lab');
  });
  it('cables are drawn by what they carry, each its own stroke', () => {
    const art = read(`${DIR}/mastArt.tsx`);
    // MA-02 (wiring 2026-10-20): USB from the DAW only into the converter or
    // a converting controller — never into an amp or a monitor.
    assert.match(art, /if \(a === 'daw'\) return b === 'dac' \|\| b === 'monitorCtl' \? 'usb' : 'line';/);
    assert.match(art, /if \(a === 'amp' && b === 'passive'\) return 'speaker';/);
  });
});

describe('faceplates: true rack proportions, the engine’s real settings', () => {
  const art = read(`${DIR}/mastArt.tsx`);
  const st = read(`${DIR}/stages.tsx`);
  it('1U and 2U are the 19-inch panel ratios', () => {
    assert.match(art, /export const RACK_1U = 482\.6 \/ 44\.45;/);
    assert.match(art, /export const RACK_2U = 482\.6 \/ 88\.9;/);
  });
  it('the limiter faceplate shows the limiter the renderer runs', () => {
    assert.equal(LIMITER_RELEASE_MS, 80);
    assert.match(read(`${DIR}/masteringEngine.ts`), /releaseMs = LIMITER_RELEASE_MS/);
    assert.match(st, /releaseMs=\{LIMITER_RELEASE_MS\} maxGrDb=\{maxGrDb \?\? 0\}/);
    assert.match(read(`${DIR}/modules/mod1What.tsx`), /unit=\{\{ kind: 'limiter', driveDb: shown === 'loud' \? 8 : 0, ceilingDb: CEILING, bypassed: shown !== 'loud' \}\}/);
    assert.match(read(`${DIR}/modules/mod6Loudness.tsx`), /unit=\{\{ kind: 'limiter', driveDb: shown === 'loud' \? drive : 0, ceilingDb: CEILING \}\}/);
  });
  it('the EQ faceplate is the tilt EQ (±tilt/2 at 200 Hz and 2.5 kHz) plus the trim and safety ceiling', () => {
    assert.match(art, /const lf = -tiltDb \/ 2;/);
    assert.match(art, /const hf = tiltDb \/ 2;/);
    assert.match(read(`${DIR}/masteringEngine.ts`), /rbj\(200, 0\.7, -tiltDb \/ 2, 'lowshelf'\)/);
    assert.match(read(`${DIR}/masteringEngine.ts`), /rbj\(2500, 0\.7, tiltDb \/ 2, 'highshelf'\)/);
    assert.match(read(`${DIR}/modules/mod5Workflow.tsx`), /unit=\{\{ kind: 'eq', tiltDb: tilt, trimDb: EQ_TRIM_DB, ceilingDb: SAFETY_CEILING_DB, bypassed: shown !== 'eq' \}\}/);
  });
  it('the tool-shelf EQ draws its knobs and its curve from ONE band table', () => {
    const tool = fnBody(st, 'ToolStage');
    assert.match(tool, /const bands = toolEqBands\(view, amount\);/);
    assert.match(tool, /const b = toolEqBands\(view, amount\);/);
  });
  it('every word in the art is ≥ 10.5 design units (no literal small font)', () => {
    assert.match(art, /^const FS = 10\.5;$/m);
    const sizes = [...art.matchAll(/fontSize=\{([\d.]+)\}/g)].map((m) => Number(m[1]));
    assert.deepEqual(sizes, [], 'the art sizes its text from FS × ts only');
  });
});

describe('labels off the lines; nothing hides the curve', () => {
  const st = read(`${DIR}/stages.tsx`);
  it('the ceiling key sits in the legend row, the line where the as-played picture puts it', () => {
    const w = fnBody(st, 'WaveOverviewStage');
    assert.match(w, /const ceilAsDrawn = ceilingDb != null \? ceilingDb \+ drawnDb : null;/);
    assert.doesNotMatch(w, /y=\{ceilY - 2\}/, 'no label riding on the ceiling line');
    assert.match(w, /<SvgText x=\{x0 \+ 20\} y=\{legendY\}/);
  });
  it('the translation title is a header above the plot; the scale reaches +12 dB', () => {
    const t = fnBody(st, 'TranslationStage');
    assert.doesNotMatch(t, /fill="#0b0b0e" opacity=\{0\.86\}/, 'no backing plate over the curve');
    assert.match(t, /Math\.min\(12, db\)/);
    assert.match(t, /const top = 13 \* bst \+ lh \+ 7;/);
  });
  it('the dynamics labels sit under the knee, not on it', () => {
    const tool = fnBody(st, 'ToolStage');
    assert.doesNotMatch(tool, /y=\{top \+ 26\} fontSize=\{fsS\} fill=\{ink\.amber\} textAnchor="end" fontFamily=\{fonts\.mono\}>thr/);
    assert.match(tool, /y=\{top \+ 44\} fontSize=\{fsS\} fill=\{ink\.amber\} fontFamily=\{fonts\.mono\}>thr \{thr\}/);
  });
});
