/**
 * Round 2, group WAVE (owner 2026-11-25: "Fix-first 15", then "continue with
 * next fixes"; audit Downloads/2026-11-25_LAB_CONTROLS_AUDIT.md, Appendix A).
 *
 * Corrections to round 1 (checker):
 *  W1  Plosives: the passing air is painted OVER the foam / windshield / grille
 *      (it was hidden under 94 %-opaque foam, so FOAM still looked like less
 *      air than POP FILTER); an absorbed particle shrinks from its FULL size.
 *  W2  Speaker Coverage side view: the two green fronts stay identical (owner
 *      2026-08-05; a round-2 dash was reverted); the rear speaker flashes brightest when it
 *      FIRES; the page note no longer calls the (now true) timing "not true".
 *  W3  Wave slow rings: train equality is circular; only the first two trains
 *      draw the blurred glow (Beam Steering drew 18 blurred paths).
 * Next fixes (Appendix A):
 *  15  Speaker Coverage side view: LINE ARRAY + HEIGHT — every step of the
 *      fader moves the hang (the bottom ~63 % moved nothing).
 *  16  Speaker Coverage: the fixed-pattern front fills and the delay box draw
 *      their OWN wavefront spread, not the mains' PATTERN / V PATTERN.
 *  W3  Wave Room Builder: a quieter source's pulse balls leave quieter (SRC
 *      LEVEL never reached the balls).
 *
 * vizWave.tsx and micspeaker/viz.tsx import Skia (node cannot load them): the
 * ball maths is in wave/pulseTracer.ts; the micspeaker helpers are pure
 * top-level functions whose bodies are read from the source and run here.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  RING_GLOW_TRAINS,
  RING_MAX_TRAINS,
  nodeState,
  pulseSourceGain,
  pulseTopLevelDb,
  ringPhaseOffset,
  ringTrainGroups,
  type TraceRay,
} from '../src/screens/lab/wave/pulseTracer.ts';
import { speedOfSound } from '../src/screens/lab/wave/waveEngine.ts';

const src = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const VIZ_WAVE = src('src/screens/lab/wave/vizWave.tsx');
const VIZ_MIC = src('src/screens/lab/micspeaker/viz.tsx');
const COVER_SCREEN = src('src/screens/lab/micspeaker/SpeakerCoverageLabScreen.tsx');

/** Read a top-level function's body from source and run it (types stripped from the parameter list). */
function loadFn(text: string, name: string) {
  const m = new RegExp(`export function ${name}\\(([^)]*)\\): \\w+ \\{([\\s\\S]*?)\\n\\}`).exec(text);
  assert.ok(m, `${name} not found`);
  const params = m[1].split(',').map((p) => p.split(':')[0].trim());
  // eslint-disable-next-line no-new-func
  return new Function(...params, m[2]) as (...a: unknown[]) => any;
}
/** A component's body, from its declaration to the next top-level function. */
function body(text: string, decl: string) {
  const a = text.indexOf(decl);
  assert.ok(a >= 0, decl);
  const b = text.indexOf('\nexport function ', a + 10);
  const c = text.indexOf('\nfunction ', a + 10);
  const end = [b, c].filter((x) => x > 0).reduce((m, x) => Math.min(m, x), Infinity);
  return text.slice(a, Number.isFinite(end) ? end : undefined);
}

describe('W1 · Plosives: what the eye sees near the grille is BLAST AT CAPSULE', () => {
  const pop = body(VIZ_MIC, 'export function PopFilterView(');
  const jsx = pop.slice(pop.indexOf('return (\n    <Canvas'));
  it('the air is painted AFTER every opaque piece of art (talker, mic, hoop, foam, shotgun, windshield)', () => {
    const lastPuff = jsx.lastIndexOf('<Path path={puffs}');
    const firstPuff = jsx.indexOf('<Path path={puffs}');
    assert.ok(firstPuff > 0);
    for (const art of ['<ProfileHead', '<HandheldMic', 'gear.hoopMesh', 'gear.hoop}', 'path={gear.foam} opacity={0.94}', 'gear.foam} color=', 'gear.shotBody', 'gear.shotSlots', 'gear.shotCap', 'gear.blimp} opacity', 'gear.blimpRibs', 'gear.blimp} color=']) {
      const at = jsx.lastIndexOf(art);
      assert.ok(at > 0, art);
      assert.ok(at < firstPuff, `${art} is painted before (under) the air`);
    }
    // Occlusion: after the air only the vignette is painted, and it darkens
    // the same place equally in every mode, so the drawn shares (30 / 50 /
    // 12 %, proven in fixFirst15_wave) are the visible shares.
    const after = jsx.slice(jsx.indexOf('/>', jsx.indexOf('<Path path={puffs} color={ACCENT_BLUE} />')) + 2);
    const painted = after.match(/<[A-Z][A-Za-z]*/g) ?? [];
    assert.deepEqual(painted, ['<Vignette'], `painted over the air: ${painted.join(', ')}`);
  });
  it('an absorbed particle shrinks smoothly from its full 2.2 (no 2.2 → 2.0 jump at the foam face)', () => {
    const radius = loadFn(VIZ_MIC, 'plosivePuffRadius') as (
      mode: string, i: number, n: number, x: number, pass: number, barX: number, edge: number, gx: number,
    ) => number;
    const gx = 286;
    for (const [mode, pass, edge] of [['foam', 0.5, gx - 17], ['blimp', 0.12, gx - 54]] as const) {
      const absorbed = [0, 1, 2, 3, 4, 5, 6, 7].filter((i) => !(i / 8 < pass));
      assert.ok(absorbed.length > 0);
      for (const i of absorbed) {
        assert.equal(radius(mode, i, 8, edge, pass, 150, edge, gx), 2.2);
        const just = radius(mode, i, 8, edge + 0.01, pass, 150, edge, gx);
        assert.ok(Math.abs(just - 2.2) < 0.01, `${mode} i ${i}: ${just} just inside the face`);
        // …and it still falls monotonically to nothing by halfway through.
        let prev = 2.2;
        for (let k = 1; k <= 50; k++) {
          const x = edge + (k / 50) * ((gx - edge) / 2);
          const r = radius(mode, i, 8, x, pass, 150, edge, gx);
          assert.ok(r <= prev + 1e-12);
          prev = r;
        }
        assert.equal(prev, 0);
      }
    }
    assert.match(VIZ_MIC, /const rr = FULL \* \(1 - depth\);/);
  });
});

describe('W2 · Speaker Coverage: the rear front is its own line; the rear speaker flashes when it fires', () => {
  const flash = loadFn(VIZ_MIC, 'rearFlashLevel') as (g: number, rearStart: number) => number;
  const timing = loadFn(VIZ_MIC, 'alignmentTiming') as (m: number, r: number, t: number, a: boolean) => { rearStart: number; rearTravel: number };
  it('brightest (1.0) exactly at rearStart, dimmest (0.32) half a cycle away, for aligned and misaligned', () => {
    for (const w of [300, 360, 760]) {
      for (const depth of [0, 0.35, 1]) {
        const audFront = 4 + 44 + Math.round(1.2 * (42 / 1.7)) + depth * (w * 0.38);
        const rearX = audFront + (w - audFront) * 0.5;
        for (const aligned of [true, false]) {
          const { rearStart } = timing(30, rearX, w - 8, aligned);
          assert.ok(Math.abs(flash(rearStart, rearStart) - 1) < 1e-12);
          assert.ok(Math.abs(flash((rearStart + 0.5) % 1, rearStart) - 0.32) < 1e-12);
          let best = -1;
          let bestG = -1;
          for (let k = 0; k < 2000; k++) {
            const g = k / 2000;
            const v = flash(g, rearStart);
            if (v > best) { best = v; bestG = g; }
          }
          const d = Math.abs(bestG - rearStart);
          assert.ok(Math.min(d, 1 - d) <= 1 / 2000 + 1e-12, `peak at ${bestG}, fires at ${rearStart}`);
        }
      }
    }
  });
  it('the side view flashes on the overlay’s own timing (same anchors)', () => {
    const side = body(VIZ_MIC, 'export function SideCoverageView(');
    assert.match(side, /const \{ rearStart \} = alignmentTiming\(spkX, geo\.rearX, rearTargetX, timeAligned\);/);
    assert.match(side, /return rearFlashLevel\(g, rearStart\);/);
    assert.match(side, /<AlignmentOverlay phase=\{alignPhase\} mainX=\{spkX\} rearX=\{geo\.rearX\} targetX=\{rearTargetX\} [^>]*aligned=\{timeAligned\} \/>/);
    assert.doesNotMatch(side, /Math\.sin\(g \* 2 \* Math\.PI\)/);
  });
  it('both fronts green and identical in look (owner 2026-08-05; the round-2 dash was reverted)', () => {
    const ov = body(VIZ_MIC, 'function AlignmentOverlay(');
    assert.match(ov, /<Path path=\{mainPath\} color=\{ACCENT_GREEN\} style="stroke" strokeWidth=\{2\.2\} opacity=\{0\.9\} \/>/);
    assert.match(ov, /<Path path=\{rearPath\} color=\{ACCENT_GREEN\} style="stroke" strokeWidth=\{2\.2\} opacity=\{0\.9\} \/>/);
    assert.doesNotMatch(ov, /DashPathEffect/);
  });
  it('the page note matches the true timing', () => {
    assert.doesNotMatch(COVER_SCREEN, /not true time-alignment math/);
    assert.match(COVER_SCREEN, /Delay alignment, simplified: measured along the floor\./);
    assert.doesNotMatch(COVER_SCREEN, /dashed/);
  });
});

describe('W3 · slow rings: circular train equality; glow on the first two trains only', () => {
  it('offsets a hair either side of the wrap are ONE train', () => {
    assert.deepEqual(ringTrainGroups([0, 1 - 1e-12]), [{ off: 0, members: [0, 1] }]);
    assert.deepEqual(ringTrainGroups([1 - 1e-12, 0, 0.5]).map((g) => g.members), [[0, 1], [2]]);
    // Genuinely different offsets stay apart.
    assert.equal(ringTrainGroups([0, 0.25, 0.5, 0.75]).length, 4);
  });
  it('only the first RING_GLOW_TRAINS (2) trains draw the blurred stroke', () => {
    assert.equal(RING_GLOW_TRAINS, 2);
    assert.match(VIZ_WAVE, /<RoomRing key=\{`\$\{ti\}-\$\{i\}`\} phase=\{p\.phase\} srcs=\{tr\.srcs\} off=\{tr\.off\} glow=\{ti < RING_GLOW_TRAINS\} i=\{i\} \/>/);
    const ring = VIZ_WAVE.slice(VIZ_WAVE.indexOf('function RoomRing('), VIZ_WAVE.indexOf('// ── Pulse tracer'));
    assert.match(ring, /glow = true,/);
    assert.match(ring, /\{glow \? \(\s*<Path path=\{path\} color="#bcd4ff"[^>]*>\s*<BlurMask blur=\{4\} style="normal" \/>\s*<\/Path>\s*\) : null\}/);
    // The sharp line of every train is always drawn.
    assert.match(ring, /\) : null\}\s*<Path path=\{path\} color="#e6f0ff" style="stroke" strokeWidth=\{1\.2\} opacity=\{lineOp\} blendMode="plus" \/>/);
  });
  it('Beam Steering, 6 boxes all at different delays: ≤ 6 blurred paths, ≤ 24 in all', () => {
    const c = speedOfSound(20);
    const dt = ((2.0 * Math.sin((45 * Math.PI) / 180)) / c) * 1000;
    const offs = Array.from({ length: 6 }, (_, i) => ringPhaseOffset(80, Math.round(i * dt * 200) / 200, 1));
    const trains = ringTrainGroups(offs).length;
    assert.equal(trains, 6);
    assert.ok(trains <= RING_MAX_TRAINS);
    const RING_N = 3;
    const blurred = Math.min(trains, RING_GLOW_TRAINS) * RING_N;
    const total = blurred + trains * RING_N;
    assert.equal(blurred, 6);
    assert.equal(total, 24);
  });
});

describe('15 · Speaker Coverage side view: LINE ARRAY + HEIGHT moves the hang over the whole fader', () => {
  const trim = loadFn(VIZ_MIC, 'arrayTrimTopY') as (h01: number, clearTop: number, topY: number) => number;
  // SideCoverageView's geometry (glass points), viz.tsx.
  const MPP = 42 / 1.7;
  const boxScale = (0.3 * MPP) / 18;
  const boxDrawnH = 18 * boxScale + 1.5;
  const geom = (h: number, stage01: number, ceil01: number) => {
    const floorY = h - 16;
    const ceilY = 18 + (1 - ceil01) * 42;
    const stageTop = floorY - (16 + stage01 * 34);
    const lowY = stageTop - 1.15 * MPP;
    const clearTop = stageTop - (1.7 + 1.0) * MPP - 3 * boxDrawnH - 9 * boxScale;
    const topY = ceilY + 12 + 9 * boxScale;
    const spkY = (h01: number) => lowY - h01 * Math.max(10, lowY - (ceilY + 12));
    const oldY0 = (h01: number) => Math.max(topY, Math.min(spkY(h01), clearTop));
    return { stageTop, clearTop, topY, oldY0, newY0: (h01: number) => trim(h01, clearTop, topY) };
  };
  it('the default room (stage 40 %, ceiling 60 %): the old hang sat still over the bottom ~63 %; now every step moves it', () => {
    const g = geom(230, 0.4, 0.6);
    let oldDead = 0;
    let newDead = 0;
    const STEPS = 100;
    for (let k = 0; k < STEPS; k++) {
      if (g.oldY0((k + 1) / STEPS) === g.oldY0(k / STEPS)) oldDead++;
      if (!(g.newY0((k + 1) / STEPS) < g.newY0(k / STEPS))) newDead++;
    }
    assert.ok(oldDead >= 55 && oldDead <= 66, `old dead travel ${oldDead} %`);
    assert.equal(newDead, 0);
  });
  it('in every room with travel: strictly higher with HEIGHT, the bottom box always 1 m over the singer’s head, under the rigging, top unchanged', () => {
    for (const h of [200, 230, 280]) {
      for (const stage01 of [0, 0.4, 1]) {
        for (const ceil01 of [0, 0.6, 1]) {
          const g = geom(h, stage01, ceil01);
          if (g.clearTop <= g.topY) {
            // No room to move: it hangs at the rigging, exactly as before.
            for (const v of [0, 0.5, 1]) assert.equal(g.newY0(v), g.oldY0(v));
            continue;
          }
          let prev = Infinity;
          for (let k = 0; k <= 50; k++) {
            const y0 = g.newY0(k / 50);
            assert.ok(y0 < prev, `h ${h} stage ${stage01} ceil ${ceil01} step ${k}`);
            prev = y0;
            const bottomOfHang = y0 + 3 * boxDrawnH + 9 * boxScale;
            assert.ok(bottomOfHang <= g.stageTop - 2.7 * MPP + 1e-9, 'clears the performer by 1 m');
            assert.ok(y0 >= g.topY - 1e-9, 'under the rigging');
          }
          assert.equal(g.newY0(1), g.oldY0(1), 'fully flown = the old top trim');
          assert.ok(Math.abs(g.newY0(0) - g.clearTop) < 1e-9, 'low = the lowest legal trim');
        }
      }
    }
  });
  it('the hang reads the fader, not the single box’s clamped height', () => {
    assert.match(VIZ_MIC, /const y0 = arrayTrimTopY\(h01, clearTop, ceilY \+ 12 \+ 9 \* boxScale\);/);
    assert.doesNotMatch(VIZ_MIC, /Math\.min\(spkY, clearTop\)/);
    assert.match(VIZ_MIC, /\}, \[spkX, h01, tiltDeg, boxScale, stageTop, MPP, ceilY, audFront, w, floorY, sloped\]\);/);
  });
});

describe('16 · Speaker Coverage: fills and the delay box draw their OWN wavefront spread', () => {
  const spread = loadFn(VIZ_MIC, 'ringSpreadDeg') as (deg: number) => number;
  it('the mains are unchanged (pattern + 30°, capped 170°) for every PATTERN', () => {
    for (const d of [40, 60, 90, 100, 120, 150, 200]) assert.equal(spread(d), Math.min(170, d + 30));
  });
  it('top view: every ring centre carries its own pattern; the fills’ is their fixed 90°, whatever PATTERN says', () => {
    assert.match(VIZ_MIC, /spreadDeg: ringSpreadDeg\(s\.hd\),/);
    assert.match(VIZ_MIC, /role: 'fills' \}\);/);
    assert.match(VIZ_MIC, /spks\.push\(\{ x: fx \* w, y: stageH, aim: 0, hd: 90, /);
    for (const hDeg of [60, 90, 100, 120]) {
      assert.equal(spread(90), 120, `fills at PATTERN ${hDeg}`);
      assert.equal(spread(hDeg), Math.min(170, hDeg + 30), 'mains as before');
    }
    // Each centre's own spread wins over the view-wide fallback.
    assert.match(VIZ_MIC, /const spread = c\.spreadDeg \?\? spreadDeg;/);
  });
  it('side view: the delay box’s arcs follow its own heat wedge (dlyA..dlyB), not V PATTERN', () => {
    assert.match(VIZ_MIC, /if \(delayOn\) r\.push\(\{ x: geo\.dlyX, y: geo\.dlyY, dirDeg: dlyAxisDeg, maxR: w \* 0\.5, spreadDeg: ringSpreadDeg\(\(\(dlyB - dlyA\) \* 180\) \/ Math\.PI\) \}\);/);
    for (const w of [300, 360, 760]) {
      const dlyA = Math.atan2(w * 0.34, w * 0.5);
      const dlyB = Math.atan2(w * 0.5, w * 0.16);
      const deg = ((dlyB - dlyA) * 180) / Math.PI;
      assert.ok(Math.abs(spread(deg) - 68.04) < 0.01, `${spread(deg)}`);
    }
    // The rear delay: its own 44° pattern + 30° by the same rule (round-2 checker NIT).
    assert.match(VIZ_MIC, /dirDeg: geo\.rearAxisDeg, maxR: w \* 0\.42, spreadDeg: ringSpreadDeg\(44\) \}/);
    assert.equal(spread(44), 74);
  });
});

describe('W3 (appendix) · Room Builder: a quieter source’s pulse balls leave quieter', () => {
  const ray = (srcGain?: number): TraceRay => ({ pts: [0, 0, 300, 0], cum: [0, 300], len: 300, order: 0, segGain: [1], delayPx: 0, ...(srcGain === undefined ? {} : { srcGain }) });
  /** nodeState's level before 2026-11-25 (copied). */
  const oldAmp = (travelled: number, minLen: number, env: number) => {
    const ref = minLen * 1.37;
    const level = 1 * Math.pow(ref / Math.max(ref, travelled), 0.58);
    return Math.max(0, Math.min(1, level * env));
  };
  it('the gain is the amplitude ratio to the loudest live source; exactly 1 for the loudest', () => {
    assert.equal(pulseSourceGain(0, 0), 1);
    assert.equal(pulseSourceGain(6, 6), 1);
    assert.ok(Math.abs(pulseSourceGain(-6, 0) - 0.5012) < 1e-4);
    assert.ok(Math.abs(pulseSourceGain(-24, 6) - 10 ** -1.5) < 1e-12);
    assert.equal(pulseTopLevelDb([{ levelDb: -3 }, { levelDb: 6, muted: true }, { levelDb: -12 }]), -3);
    assert.equal(pulseTopLevelDb([]), 0);
  });
  it('a ball from the loudest source (or with no gain set) is the old ball, bit for bit', () => {
    for (const minLen of [40, 120, 300]) {
      for (let front = 0; front <= 400; front += 7) {
        for (const env of [1, 0.6, 0]) {
          const a = nodeState(ray(), front, minLen, env);
          const b = nodeState(ray(1), front, minLen, env);
          assert.deepEqual(a, b);
          assert.equal(a.amp, oldAmp(Math.min(front, 300), minLen, env));
        }
      }
    }
  });
  it('−24 dB against +6 dB leaves near blue; −6 dB at half the level', () => {
    const loud = nodeState(ray(pulseSourceGain(6, 6)), 1, 100, 1);
    const quiet = nodeState(ray(pulseSourceGain(-24, 6)), 1, 100, 1);
    const half = nodeState(ray(pulseSourceGain(-6, 0)), 1, 100, 1);
    assert.equal(loud.amp, 1);
    assert.ok(quiet.amp < 0.04, `${quiet.amp}`);
    assert.ok(Math.abs(half.amp - 0.5012) < 1e-4);
    assert.ok(quiet.r < loud.r);
  });
  it('every module but the Room Builder gives every source LEVEL 0 → gain 1 → its balls unchanged', () => {
    for (const f of ['src/screens/lab/wave/modules/modWaveA.tsx', 'src/screens/lab/wave/modules/modWaveB.tsx']) {
      const levels = [...src(f).matchAll(/levelDb: (-?[\d.]+)/g)].map((m) => Number(m[1]));
      assert.ok(levels.length > 0);
      for (const l of levels) assert.equal(l, 0, f);
    }
  });
  it('every pulse trace carries its source’s gain', () => {
    assert.match(VIZ_WAVE, /const topDb = pulseTopLevelDb\(scene\.sources\);/);
    assert.equal((VIZ_WAVE.match(/const srcGain = pulseSourceGain\(s\.levelDb, topDb\);/g) ?? []).length, 3);
    const pushes = VIZ_WAVE.match(/traces\.push\(\{[\s\S]*?\}\);/g) ?? [];
    assert.equal(pushes.length, 4);
    for (const p of pushes) assert.match(p, /srcGain/);
  });
});
