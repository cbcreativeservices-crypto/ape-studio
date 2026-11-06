/**
 * B05 Meet It, step 6 (THE LOOPS). Decision 9, option A: MOVE changes the
 * drawing, a real seated pose for SITS DOWN and arms out for GESTURES, on the
 * shared figure with its own arm lengths and joints; TURNS shows the turn.
 * Audit section 5: the tape stays drawn on every state whose words mention it.
 * BodyWornArt loads Skia, so its LavCable path code is lifted from the source
 * and run against a recording path, as the G9 test does.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { BODY_DIMS, CHEST_X, LOOPS, MOVES, MOVE_IDS, MOVE_POSES, NECK_Y, cablePull, packAt } from '../src/screens/lab/miking/lessons/shared/broadcast/bodyWorn.ts';
import { SINGER_SIDE } from '../src/screens/lab/miking/lessons/shared/voice/voicePose.ts';

const read = (f: string) => readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const ART = read('src/screens/lab/miking/lessons/shared/broadcast/BodyWornArt.tsx');
const STEP = read('src/screens/lab/miking/lessons/shared/broadcast/bodyWornPages.tsx');
const PAGE = read('src/screens/lab/miking/lessons/b05Lavalier/pages.tsx');

type Pt = { u: number; v: number };
const len = (a: Pt, b: Pt) => Math.hypot(a.u - b.u, a.v - b.v);
const upper = (s: Pt, e: Pt) => len(s, e);
const STD_UPPER = upper(SINGER_SIDE.shoulderR, SINGER_SIDE.elbowR);
const STD_FORE = upper(SINGER_SIDE.elbowR, SINGER_SIDE.handR.wrist);

describe('MOVE changes the drawing', () => {
  it('every move has its own pose', () => {
    const seen = new Set(MOVE_IDS.map((m) => JSON.stringify(MOVE_POSES[m])));
    assert.equal(seen.size, MOVE_IDS.length);
  });

  it('SITS DOWN is seated: the thigh runs forward from the hip', () => {
    const p = MOVE_POSES.sit;
    assert.equal(p.posture, 'seated');
    assert.ok(p.kneeR.u - p.hipR.u >= 300, 'thigh forward');
    assert.ok(Math.abs(p.kneeR.v - p.hipR.v) <= 60, 'thigh level');
  });

  it('GESTURES has both arms out in front of the chest, clear of the body', () => {
    const p = MOVE_POSES.gesture;
    for (const h of [p.handR, p.handL]) assert.ok(h.wrist.u > CHEST_X + 200, 'wrist well ahead of the chest');
    assert.ok(p.handR.wrist.v < p.elbowR.v && p.handL.wrist.v < p.elbowL.v, 'forearms rise from the elbow');
  });

  it('TURNS carries the near arm back and marks the turn at the waist', () => {
    assert.ok(MOVE_POSES.turn.elbowR.u < SINGER_SIDE.elbowR.u - 30);
    assert.match(ART, /move === 'turn' \? <WaistTurn \/> : null/);
  });

  it('the figure stays one adult: arm lengths, head and chest hold in every pose', () => {
    for (const m of MOVE_IDS) {
      const p = MOVE_POSES[m];
      assert.deepEqual(p.head, SINGER_SIDE.head, `${m} head`);
      assert.deepEqual(p.neck, SINGER_SIDE.neck, `${m} collar`);
      for (const [s, e, h] of [[p.shoulderR, p.elbowR, p.handR], [p.shoulderL, p.elbowL, p.handL]] as const) {
        assert.ok(Math.abs(upper(s, e) - STD_UPPER) / STD_UPPER <= 0.05, `${m} upper arm ${upper(s, e).toFixed(0)}`);
        assert.ok(Math.abs(upper(e, h.wrist) - STD_FORE) / STD_FORE <= 0.08, `${m} forearm ${upper(e, h.wrist).toFixed(0)}`);
      }
    }
  });

  it('wrists bend within reach, and no hand lands at the front of the trousers', () => {
    for (const m of MOVE_IDS) {
      const p = MOVE_POSES[m];
      for (const [e, h] of [[p.elbowR, p.handR], [p.elbowL, p.handL]] as const) {
        const fore = Math.atan2(h.wrist.v - e.v, h.wrist.u - e.u);
        const bend = Math.abs(Math.atan2(Math.sin(h.dir - fore), Math.cos(h.dir - fore)));
        assert.ok(bend <= (70 * Math.PI) / 180, `${m} wrist ${bend.toFixed(2)}`);
      }
      const near = p.handR.wrist;
      assert.ok(!(near.u > p.hipR.u + 60 && near.u < p.hipR.u + 200 && Math.abs(near.v - p.hipR.v) < 110), `${m} near hand clear of the lap`);
    }
  });

  it('the step draws the chosen move on a chair when seated', () => {
    assert.match(STEP, /spec\.side\(px, move\)/);
    assert.match(PAGE, /<MovePresenter move=\{move\} \/>/);
    assert.match(ART, /seated \? <StudioChair view="side" t=\{HOST\} \/> : null/);
    assert.match(STEP, /const standing = spec\.standing && move !== 'sit'/);
    assert.ok(packAt(false).y !== packAt(true).y, 'the seated pack sits on the seated belt');
  });
});

describe('the tape stays drawn while the words talk about it', () => {
  type P = { x: number; y: number };
  function recorder() {
    const lines: P[][] = [];
    const rects: { x: number; y: number; w: number; h: number }[] = [];
    let at: P = { x: 0, y: 0 };
    return {
      lines,
      rects,
      moveTo(x: number, y: number) { at = { x, y }; },
      lineTo(x: number, y: number) { lines.push([at, { x, y }]); at = { x, y }; },
      cubicTo(_a: number, _b: number, _c: number, _d: number, x: number, y: number) { lines.push([at, { x, y }]); at = { x, y }; },
      addRRect(r: { x: number; y: number; w: number; h: number }) { rects.push(r); },
    };
  }
  const body = /export function LavCable[\s\S]*?const p = useMemo\(\(\) => \{([\s\S]*?)\n {2}\}, \[view, from, pack/.exec(ART)![1];
  const FAKE = { XYWHRect: (x: number, y: number, w: number, h: number) => ({ x, y, w, h }), RRectXY: (r: unknown) => r };
  const draw = (loops: { broadcast: boolean; secondary: boolean; spent?: boolean }) =>
    new Function('make', 'Skia', 'CHEST_X', 'NECK_Y', 'BODY_DIMS', 'view', 'from', 'pack', 'loops', 'taut', 'tug', 'standing', body)(recorder, FAKE, CHEST_X, NECK_Y, BODY_DIMS, 'side', { x: CHEST_X + 5, y: NECK_Y + 104, z: 0 }, packAt(true), loops, false, false, true) as Record<string, ReturnType<typeof recorder>>;

  it('with both loops, GESTURES uses the spare cable and the words name the tape', () => {
    assert.ok(MOVES.gesture.mm > LOOPS.secondary.mm);
    assert.ok(cablePull(MOVES.gesture.mm, { broadcast: true, secondary: true }).atTape > 0);
    assert.match(STEP, /the tape itself/);
  });

  it('the step never hides the taped loop on a move', () => {
    assert.match(STEP, /const showSecondary = loops\.secondary;/);
    assert.doesNotMatch(STEP, /showSecondary = loops\.secondary && mv\.mm/);
    assert.match(STEP, /const spent = loops\.secondary && pull\.atTape > 0;/);
    assert.match(STEP, /secondary: showSecondary, spent \}/);
  });

  it('a spent loop runs straight, its tape still drawn with a tug mark, on the torso', () => {
    const d = draw({ broadcast: true, secondary: true, spent: true });
    assert.equal(d.tape.rects.length, 1, 'tape');
    assert.equal(d.secondary.lines.length, 1, 'one straight run');
    assert.ok(d.pull.lines.length >= 3, 'tug mark');
    assert.ok(d.tape.rects[0].x + d.tape.rects[0].w - CHEST_X <= 10, 'tape stays on the torso');
  });

  it('the summary that names the taped loop shows only with the taped loop drawn', () => {
    assert.match(STEP, /\{done && loops\.secondary \? <Note tone="ok">/);
  });
});
