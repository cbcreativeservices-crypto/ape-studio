/**
 * FIGURE V2 — THE METAL FAMILY'S HAND SHEET (family batch, owner 2026-11-25: "switch to batches by family").
 * Pins: the review sheet (src/dev/metalSheetStudy.tsx, route `sheet-metal`) lists every authored drawing; each new
 * hand file exists, is registered with the family's player and is placed by a lesson's pose module; each placed
 * hand's arm ends at the drawing's wrist with the forearm running the drawing's way; the bar-chime arm from above
 * runs forward from the shoulder (the review's "arm wrong from above"); the owner's two stroke rulings keep their
 * defaults.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { drawnWrist, METAL_HAND_PLACES, type MetalHandKind } from '../src/screens/lab/miking/lessons/shared/metal/metalHands.ts';
import { projectView, type MetalArm, type MetalFig, type MetalView } from '../src/screens/lab/miking/lessons/shared/metal/metalFigureV2.ts';
import { beaterSideArm, clipSideArm, triFig } from '../src/screens/lab/miking/lessons/i06aTriangle/playerV2.ts';
import { HELD_BEATER, MOUNTED_BEATER } from '../src/screens/lab/miking/lessons/i06aTriangle/beaters.ts';
import { FC_LEFT_PINCH_FROM_ABOVE, fcFig } from '../src/screens/lab/miking/lessons/i06bFingerCymbals/playerV2.ts';
import { BC_BODY, BC_SWEEP_FINGERS_DOWN, sweepArm } from '../src/screens/lab/miking/lessons/i06cBarChimes/playerV2.ts';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const KINDS = Object.keys(METAL_HAND_PLACES) as MetalHandKind[];
const fileOf = (k: string) => `src/screens/lab/miking/lessons/shared/figureV2/metalHand${k[0].toUpperCase()}${k.slice(1)}.tsx`;

test('metal sheet: every authored drawing is on the review sheet, numbered with its status', () => {
  const sheet = read('src/dev/metalSheetStudy.tsx');
  for (const k of KINDS) assert.match(sheet, new RegExp(`kind: '${k}'`), `${k} on the sheet`);
  assert.match(sheet, /status: 'NEW'/);
  assert.match(sheet, /status: 'KEPT'/);
  // (the route: one import line and one route line in FigureStudy)
  const fs = read('src/dev/FigureStudy.tsx');
  assert.match(fs, /import \{ MetalSheetStudy \} from '\.\/metalSheetStudy';/);
  assert.match(fs, /only\.startsWith\('sheet-metal'\)\) return <MetalSheetStudy only=\{only\} \/>;/);
});

test('metal sheet: each new hand file exists, says what the hand does, and is drawn by the family', () => {
  const player = read('src/screens/lab/miking/lessons/shared/metal/MetalPlayerV2.tsx');
  const poses = ['i06aTriangle', 'i06bFingerCymbals', 'i06cBarChimes', 'i12Gong'].map((f) => read(`src/screens/lab/miking/lessons/${f}/playerV2.ts`)).join('\n');
  for (const k of KINDS) {
    const f = fileOf(k);
    assert.ok(existsSync(new URL(`../${f}`, import.meta.url)), `${f} exists`);
    const src = read(f);
    assert.match(src, /WHAT THE HAND DOES/, `${k}: the header says what the hand does`);
    assert.match(src, /name: 'thumb'/, `${k}: a thumb of its own`);
    assert.match(src, /nails: \[/, `${k}: nails`);
    assert.match(src, new RegExp(`METAL_HAND_PLACES\\.${k}`), `${k}: its anchor and wrist from metalHands.ts`);
    assert.match(player, new RegExp(`\\b${k}: METAL_HAND_`), `${k}: registered with the player`);
    assert.match(poses, new RegExp(`'${k}'`), `${k}: placed by a lesson`);
  }
});

type Drawn = NonNullable<MetalArm['drawn']>;
type P2 = { u: number; v: number };
/** The arm laid to the drawing: its wrist on the drawing's wrist, its forearm the drawing's way (on the page). */
function laidPage(name: string, d: Drawn | undefined, pw: P2, pe: P2) {
  assert.ok(d, `${name}: an authored hand`);
  const w = drawnWrist(d!.kind as MetalHandKind, d!.at, d!.rot, d!.mirror);
  const miss = Math.hypot(pw.u - w.cuff.u, pw.v - w.cuff.v);
  assert.ok(miss < 20, `${name}: the sleeve ends at the drawing's wrist (${miss.toFixed(1)} mm off)`);
  const du = pe.u - pw.u;
  const dv = pe.v - pw.v;
  const l = Math.hypot(du, dv);
  if (l > 80) {
    const ang = (Math.acos(Math.max(-1, Math.min(1, (du * w.fore.u + dv * w.fore.v) / l))) * 180) / Math.PI;
    assert.ok(ang < 40, `${name}: the forearm runs the drawing's way (${ang.toFixed(0)}° off)`);
  }
}
function laid(name: string, a: MetalArm, view: MetalView) {
  laidPage(name, a.drawn, projectView(view, a.sk.frame.o), projectView(view, a.elbow));
}
/** A picture's arm in the family figure's own frame (side: as drawn; face-on: u = x, v = y there). */
function laidFig(name: string, f: MetalFig, s: 'L' | 'R') {
  const a = f.arms[s];
  laidPage(name, f.drawn[s], { u: a.sk.frame.o.x, v: a.sk.frame.o.y }, { u: a.elbow.x, v: a.elbow.y });
}

test('metal sheet: each placed hand ends its arm at the drawing, the forearm straight on into it', () => {
  laid('triangle clip, side', clipSideArm(), 'side');
  laid('triangle beater (held), side', beaterSideArm(HELD_BEATER), 'side');
  laid('triangle beater (mounted), side', beaterSideArm(MOUNTED_BEATER), 'side');
  // (the beater still passes THROUGH the hand: the drawing's fulcrum on the lesson's own beater, 32 mm in)
  for (const b of [HELD_BEATER, MOUNTED_BEATER]) {
    const d = beaterSideArm(b).drawn!;
    const dx = b.tip.x - b.grip.x;
    const dy = b.tip.y - b.grip.y;
    const off = Math.abs((d.at.u - b.grip.x) * dy - (d.at.v - b.grip.y) * dx) / Math.hypot(dx, dy);
    assert.ok(off < 0.5, `the fulcrum on the beater's line (${off.toFixed(2)} mm off)`);
  }
  assert.equal(triFig('side', 'held').drawn.R?.kind, 'beaterBack');
  const front = fcFig('front', 'dance');
  const side = fcFig('side', 'dance');
  assert.equal(front.drawn.L?.kind, 'zillPalm');
  assert.equal(front.drawn.R?.kind, 'zillPalm');
  assert.equal(front.drawn.R?.mirror, true, 'the right hand is the mirror image');
  assert.equal(side.drawn.L?.kind, 'zillEdge');
  assert.equal(side.drawn.R?.kind, 'zillEdge');
  assert.equal(triFig('side', 'held').drawn.L?.kind, 'clipSide');
  for (const s of ['L', 'R'] as const) {
    laidFig(`dance from the audience ${s}`, front, s);
    laidFig(`dance from the side ${s}`, side, s);
  }
  // (no posed grip is drawn where an authored hand is)
  for (const f of [front, side, triFig('side', 'held')]) for (const s of ['L', 'R'] as const) if (f.drawn[s]) assert.equal(f.grips[s], undefined);
});

test('bar chimes: from above, the sweeping arm runs forward from the shoulder (never back past the head)', () => {
  const a = sweepArm();
  const sh = BC_BODY.s.shoulderL;
  assert.ok(a.elbow.x > sh.x - 60, `the elbow not behind the shoulder (${(a.elbow.x - sh.x).toFixed(0)} mm)`);
  assert.ok(a.elbow.y > sh.y + 150, `the elbow low, below the shoulder (${(a.elbow.y - sh.y).toFixed(0)} mm)`);
});

test('metal sheet: the owner\'s two stroke rulings keep their defaults', () => {
  assert.equal(BC_SWEEP_FINGERS_DOWN, true);
  assert.equal(FC_LEFT_PINCH_FROM_ABOVE, true);
});

test('metal sheet: the two approved mallet hands are untouched by this family', () => {
  for (const f of ['malletHandBack.tsx', 'malletHandPalm.tsx']) {
    const src = read(`src/screens/lab/miking/lessons/shared/figureV2/${f}`);
    assert.doesNotMatch(src, /metal/i, `${f}: no metal-family edits`);
  }
});
