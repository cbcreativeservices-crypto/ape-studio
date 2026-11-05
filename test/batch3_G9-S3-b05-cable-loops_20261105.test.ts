/**
 * B05 Meet It, step 6 (THE LOOPS). The picture has to show the choice: the
 * loops were a few pixels of dark cable on a dark stage, and the label did the
 * work. BodyWornArt loads Skia, so the real LavCable path code is lifted from
 * its source and run against a recording path, then measured at phone size.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { BODY_DIMS, CHEST_X, NECK_Y, packAt } from '../src/screens/lab/miking/lessons/shared/broadcast/bodyWorn.ts';

const ART_FILE = process.env.G9_ART ?? 'src/screens/lab/miking/lessons/shared/broadcast/BodyWornArt.tsx';
const ART = readFileSync(ART_FILE, 'utf8').replace(/\r\n/g, '\n');
const PAGE = readFileSync('src/screens/lab/miking/lessons/b05Lavalier/pages.tsx', 'utf8').replace(/\r\n/g, '\n');

type Pt = { x: number; y: number };
type Seg = Pt[];
type Rect = { x: number; y: number; w: number; h: number };
function recorder() {
  const segs: Seg[] = [];
  const rects: Rect[] = [];
  let at: Pt = { x: 0, y: 0 };
  return {
    segs,
    rects,
    moveTo(x: number, y: number) { at = { x, y }; },
    lineTo(x: number, y: number) { segs.push([at, { x, y }]); at = { x, y }; },
    cubicTo(a: number, b: number, c: number, d: number, x: number, y: number) { segs.push([at, { x: a, y: b }, { x: c, y: d }, { x, y }]); at = { x, y }; },
    addRRect(r: Rect) { rects.push(r); },
  };
}
type Rec = ReturnType<typeof recorder>;
const body = (() => {
  const m = /export function LavCable[\s\S]*?const p = useMemo\(\(\) => \{([\s\S]*?)\n {2}\}, \[view, from, pack/.exec(ART);
  assert.ok(m, 'LavCable path code found');
  return m[1];
})();
const FAKE_SKIA = { XYWHRect: (x: number, y: number, w: number, h: number) => ({ x, y, w, h }), RRectXY: (r: unknown) => r };
function draw(loops: { broadcast: boolean; secondary: boolean }, taut = false): Record<string, Rec> {
  const from = { x: CHEST_X + 5, y: NECK_Y + 104, z: 0 };
  const run = new Function('make', 'Skia', 'CHEST_X', 'NECK_Y', 'BODY_DIMS', 'view', 'from', 'pack', 'loops', 'taut', 'tug', 'standing', body);
  return run(recorder, FAKE_SKIA, CHEST_X, NECK_Y, BODY_DIMS, 'side', from, packAt(true), loops, taut, taut, true) as Record<string, Rec>;
}
function sample(segs: Seg[]): Pt[] {
  const out: Pt[] = [];
  for (const s of segs) {
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const u = 1 - t;
      if (s.length === 2) out.push({ x: u * s[0].x + t * s[1].x, y: u * s[0].y + t * s[1].y });
      else {
        out.push({
          x: u * u * u * s[0].x + 3 * u * u * t * s[1].x + 3 * u * t * t * s[2].x + t * t * t * s[3].x,
          y: u * u * u * s[0].y + 3 * u * u * t * s[1].y + 3 * u * t * t * s[2].y + t * t * t * s[3].y,
        });
      }
    }
  }
  return out;
}
const extent = (pts: Pt[]) => {
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
};

/** css px per mm on a 375 px phone: the rack's stage measures 355 × 290. */
const box = /useCableStep\(\{[\s\S]*?box: \{ u0: (-?\d+), u1: (-?\d+), v0: (-?\d+), v1: (-?\d+) \}/.exec(PAGE)!;
const PX = Math.min(355 / (+box[2] - +box[1]), 290 / (+box[4] - +box[3]));
/** The curved part of a path on the chest: a loop, without the run round the waist. */
const ring = (segs: Seg[]) => segs.filter((s) => s.length === 4 && s[3].x > CHEST_X - 80);
/** The secondary loop, wherever the source keeps it. */
const lower = (d: Record<string, Rec>) => ring([...(d.secondary?.segs ?? []), ...d.under.segs]);
const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a: string, b: string) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
const STAGE = '#0d0e12';

describe('B05 THE LOOPS reads at phone size', () => {
  const both = draw({ broadcast: true, secondary: true });

  it('the broadcast loop is a shape you can see at 375 px', () => {
    const e = extent(sample(ring(both.out.segs)));
    assert.ok((e.maxX - e.minX) * PX >= 12, `wide ${((e.maxX - e.minX) * PX).toFixed(1)} px`);
    assert.ok((e.maxY - e.minY) * PX >= 25, `tall ${((e.maxY - e.minY) * PX).toFixed(1)} px`);
  });

  it('the secondary loop is a shape you can see at 375 px, with its tape', () => {
    const e = extent(sample(lower(both)));
    assert.ok((e.maxX - e.minX) * PX >= 12, `wide ${((e.maxX - e.minX) * PX).toFixed(1)} px`);
    assert.ok((e.maxY - e.minY) * PX >= 20, `tall ${((e.maxY - e.minY) * PX).toFixed(1)} px`);
    const t = both.tape.rects[0];
    assert.ok(t.w * PX >= 12 && t.h * PX >= 6, 'tape at least 12 × 6 px');
  });

  it('no loop a hand could catch: each stays close on the chest', () => {
    assert.ok(extent(sample(ring(both.out.segs))).maxX - CHEST_X <= 50, 'broadcast loop hugs the chest');
    // Dashed means under the shirt: neither the loop nor its tape passes the chest.
    assert.ok(extent(sample(lower(both))).maxX - CHEST_X <= 10, 'secondary loop stays inside the body');
    const t = both.tape.rects[0];
    assert.ok(t.x + t.w - CHEST_X <= 10, 'its tape stays inside the body');
  });

  it('the broadcast and the secondary loop stay two separate shapes', () => {
    const a = extent(sample(ring(both.out.segs)));
    const b = extent(sample(lower(both)));
    assert.ok(a.maxY < both.tape.rects[0].y, 'the broadcast loop ends above the tape');
    assert.ok(a.maxY < b.minY, 'and above the secondary loop');
  });

  it('LOOPS changes the drawing: none, one, both', () => {
    const none = draw({ broadcast: false, secondary: false });
    const one = draw({ broadcast: true, secondary: false });
    assert.equal(ring(none.out.segs).length, 0);
    assert.equal(ring(one.out.segs).length, 2);
    assert.equal(lower(one).length, 0);
    assert.equal(lower(both).length, 2);
    assert.equal(none.tape.rects.length, 0);
    assert.equal(both.tape.rects.length, 1);
  });

  it('a move that uses the spare cable pulls the loops out', () => {
    const t = draw({ broadcast: true, secondary: true }, true);
    assert.equal(ring(t.out.segs).length, 0);
    assert.equal(t.tape.rects.length, 0);
  });

  it('the loops are drawn in a light ink, thick enough on the dark stage', () => {
    const ink = /const CABLE_INK = '(#[0-9a-f]{6})'/.exec(ART);
    assert.ok(ink, 'one ink for the loops');
    assert.ok(contrast(ink[1], STAGE) >= 7, `contrast ${contrast(ink[1], STAGE).toFixed(1)}`);
    const widths = [...ART.matchAll(/path=\{p\.(out|secondary)\} style="stroke" strokeWidth=\{([\d.]+)\}[^>]*color=\{(?:taut \? RED : )?CABLE_INK\}/g)];
    assert.equal(widths.length, 2, 'both loops use the ink');
    for (const w of widths) assert.ok(+w[2] * PX >= 1.1, `${w[1]} stroke ${(+w[2] * PX).toFixed(2)} px`);
  });
});
