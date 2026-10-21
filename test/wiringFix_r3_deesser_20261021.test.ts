/**
 * Wiring round 3, De-Esser lab (owner go 2026-10-21) — DE-R2-01, "de-esser
 * split-band drawing": split-band mode was drawn as the broadband path with
 * the gain box relabelled "gain · hiss band" — no band split and no sum, so
 * the drawing showed the whole voice going through the gain element.
 *
 * The ratchet pins the drawing's TOPOLOGY (input → band split → hiss band →
 * gain → sum → output, the rest of the voice straight to the sum; side chain
 * from a copy of the input through band-pass → detector → threshold → gain
 * computer; the control line lands on the gain element ONLY), the drawing's
 * geometry (wires start and end on their boxes, cross no box, no text over a
 * box, a wire or another text, ≥ 9-unit text), and agreement with the model
 * (split: body untouched, hiss × g; broadband: both × g).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  PATH_H_BROADBAND, PATH_H_SPLIT, PATH_LBL, PATH_W, bandLabel, pathHeight, pathLayout, pathOrder, textWidth,
  type PathBox, type PathBoxId, type PathLayout, type PathWire,
} from '../src/screens/lab/deesser/pathLayout.ts';
import { DEFAULTS, PATH_MAIN, PATH_SIDECHAIN, PATH_SPLIT, PHRASE, fromDb, processFrame, type Mode } from '../src/features/deesser/deEsserModel.ts';

const ROOT = join(import.meta.dirname, '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const DE = 'src/screens/lab/deesser/';

const MODES: Mode[] = ['split', 'broadband'];
/** Frequencies across the lab's detector travel (FREQ_MIN..FREQ_MAX). */
const FREQS = [2000, 4500, 6500, 9500, 10000];
const edges = (L: PathLayout, kind?: PathWire['kind']) => L.wires.filter((w) => !kind || w.kind === kind).map((w) => `${w.from}>${w.to}`).sort();
const into = (L: PathLayout, id: PathBoxId, kind: PathWire['kind'] = 'audio') => L.wires.filter((w) => w.to === id && w.kind === kind);
const outOf = (L: PathLayout, id: PathBoxId, kind: PathWire['kind'] = 'audio') => L.wires.filter((w) => w.from === id && w.kind === kind);

type R = { x0: number; y0: number; x1: number; y1: number };
const rectOf = (b: PathBox): R => ({ x0: b.x, y0: b.y, x1: b.x + b.w, y1: b.y + b.h });
const overlap = (a: R, b: R, gap = 0) => a.x0 < b.x1 + gap && b.x0 < a.x1 + gap && a.y0 < b.y1 + gap && b.y0 < a.y1 + gap;
const onEdge = (p: [number, number], b: PathBox) => {
  const r = rectOf(b), [x, y] = p;
  const inX = x >= r.x0 && x <= r.x1, inY = y >= r.y0 && y <= r.y1;
  return ((x === r.x0 || x === r.x1) && inY) || ((y === r.y0 || y === r.y1) && inX);
};
/** Axis-aligned segment as a thin rect. */
const segRect = (a: [number, number], b: [number, number], pad = 0.75): R => ({
  x0: Math.min(a[0], b[0]) - pad, x1: Math.max(a[0], b[0]) + pad, y0: Math.min(a[1], b[1]) - pad, y1: Math.max(a[1], b[1]) + pad,
});
const segs = (w: PathWire) => w.pts.slice(1).map((p, i) => [w.pts[i], p] as const);
/** The arrowhead's box (7 long, 7 wide, tip on the last point). */
const headRect = (w: PathWire): R => {
  const [x1, y1] = w.pts[w.pts.length - 2], [x2, y2] = w.pts[w.pts.length - 1];
  const dx = Math.sign(x2 - x1), dy = Math.sign(y2 - y1);
  const bx = x2 - dx * 7, by = y2 - dy * 7;
  return { x0: Math.min(x2, bx) - (dy ? 3.5 : 0), x1: Math.max(x2, bx) + (dy ? 3.5 : 0), y0: Math.min(y2, by) - (dx ? 3.5 : 0), y1: Math.max(y2, by) + (dx ? 3.5 : 0) };
};
/** A free label's ink box: cap height above the baseline, descenders below. */
const textRect = (t: PathLayout['texts'][number]): R => {
  const w = textWidth(t.text, 'barlow');
  const x0 = t.anchor === 'start' ? t.x : t.anchor === 'middle' ? t.x - w / 2 : t.x - w;
  return { x0, x1: x0 + w, y0: t.y - 7, y1: t.y + 2.5 };
};

describe('DE-R2-01 — split-band topology: split → gain on the hiss band only → sum', () => {
  const L = pathLayout('split', DEFAULTS.freqHz);
  it('the main path is input → band split → two bands → sum → output', () => {
    assert.deepEqual(edges(L, 'audio'), ['gain>sum', 'in>split', 'split>gain', 'split>sum', 'sum>out'].sort());
    assert.deepEqual(into(L, 'split').map((w) => w.from), ['in'], 'the whole voice reaches the band split');
    const fromSplit = outOf(L, 'split');
    assert.equal(fromSplit.length, 2, 'the split has exactly two outputs');
    assert.deepEqual(fromSplit.map((w) => `${w.band}>${w.to}`).sort(), ['hiss>gain', 'rest>sum']);
  });
  it('gain reduction is applied to the hiss band ONLY: the rest of the voice never meets the gain element', () => {
    assert.deepEqual(into(L, 'gain').map((w) => [w.from, w.band]), [['split', 'hiss']], 'the gain element’s only audio input is the hiss band');
    assert.deepEqual(outOf(L, 'gain').map((w) => [w.to, w.band]), [['sum', 'hiss']]);
    const rest = L.wires.find((w) => w.band === 'rest')!;
    assert.equal(rest.from, 'split');
    assert.equal(rest.to, 'sum', 'the rest goes straight to the sum');
    const gain = rectOf(L.boxes.find((b) => b.id === 'gain')!);
    for (const [a, b] of segs(rest)) assert.ok(!overlap(segRect(a, b), gain), 'the rest lane is not drawn through the gain element');
  });
  it('the bands recombine: the sum takes both bands, the output takes only the sum', () => {
    assert.deepEqual(into(L, 'sum').map((w) => w.band).sort(), ['hiss', 'rest']);
    assert.deepEqual(into(L, 'out').map((w) => w.from), ['sum']);
  });
  it('the side chain listens to a band-limited COPY of the input and controls the gain element only', () => {
    assert.deepEqual(edges(L, 'copy'), ['bpf>det', 'det>thr', 'in>bpf', 'thr>gc'].sort());
    assert.deepEqual(edges(L, 'control'), ['gc>gain']);
    const ctl = L.wires.find((w) => w.kind === 'control')!;
    assert.ok(onEdge(ctl.pts[ctl.pts.length - 1], L.boxes.find((b) => b.id === 'gain')!), 'the control arrow lands on the gain element');
  });
  it('the hiss lane is labelled with the detector’s own frequency', () => {
    for (const f of FREQS) {
      const t = pathLayout('split', f).texts.map((x) => x.text);
      assert.ok(t.includes('hiss band') && t.includes(bandLabel(f)), `${f} Hz`);
      assert.ok(t.includes('rest of the voice · untouched'));
    }
    assert.equal(bandLabel(6500), 'near 6.5 kHz');
    assert.equal(bandLabel(10000), 'near 10 kHz');
  });
});

describe('DE-R2-01 — broadband keeps its band-limited detector and turns down the WHOLE voice', () => {
  const L = pathLayout('broadband', DEFAULTS.freqHz);
  it('no split and no sum; the gain element carries the whole voice', () => {
    assert.deepEqual(edges(L, 'audio'), ['gain>out', 'in>gain']);
    assert.ok(!L.boxes.some((b) => b.id === 'split' || b.id === 'sum'));
    assert.deepEqual(L.boxes.find((b) => b.id === 'gain')!.label, ['gain · whole voice']);
  });
  it('the side chain and control line are the same as split-band', () => {
    const S = pathLayout('split', DEFAULTS.freqHz);
    assert.deepEqual(edges(L, 'copy'), edges(S, 'copy'));
    assert.deepEqual(edges(L, 'control'), edges(S, 'control'));
  });
});

describe('DE-R2-01 — the drawing agrees with deEsserModel', () => {
  const s = { ...DEFAULTS, thresholdDb: -30 };
  it('split: the body (rest of the voice) is untouched and the hiss takes the gain; broadband: both take it', () => {
    for (const f of PHRASE) {
      const sp = processFrame(f, { ...s, mode: 'split' }), bb = processFrame(f, { ...s, mode: 'broadband' });
      const g = fromDb(-sp.grDb);
      assert.equal(sp.outBody, f.body, f.label);
      assert.ok(Math.abs(sp.outHiss - f.hiss * g) < 1e-12, f.label);
      assert.ok(Math.abs(bb.outBody - f.body * g) < 1e-12 && Math.abs(bb.outHiss - f.hiss * g) < 1e-12, f.label);
    }
  });
  it('with no reduction the two bands sum back to the input', () => {
    const off = { ...DEFAULTS, thresholdDb: 0, mode: 'split' as const };
    for (const f of PHRASE) {
      const p = processFrame(f, off);
      assert.equal(p.grDb, 0);
      assert.equal(p.outBody + p.outHiss, f.body + f.hiss, f.label);
    }
  });
  it('every block drawn has a reader entry, and the walk visits every block once', () => {
    const blocks = [...PATH_MAIN, ...PATH_SPLIT, ...PATH_SIDECHAIN];
    assert.deepEqual(PATH_SPLIT.map((b) => b.id), ['split', 'sum']);
    for (const m of MODES) {
      const L = pathLayout(m, DEFAULTS.freqHz), order = pathOrder(m);
      assert.deepEqual([...order].sort(), L.boxes.map((b) => b.id).sort(), m);
      for (const id of order) assert.ok(blocks.some((b) => b.id === id), `${m}: ${id} has a reader entry`);
    }
    assert.deepEqual(pathOrder('split'), ['in', 'split', 'bpf', 'det', 'thr', 'gc', 'gain', 'sum', 'out']);
  });
});

describe('DE-R2-01 — geometry: traceable wires, no clashes, legible text', () => {
  for (const m of MODES) for (const f of FREQS) {
    const L = pathLayout(m, f);
    const boxes = L.boxes;
    const by = (id: PathBoxId) => boxes.find((b) => b.id === id)!;
    it(`${m} @ ${f} Hz: boxes sit inside the drawing, apart, with their labels fitting`, () => {
      assert.equal(L.h, pathHeight(m));
      for (const b of boxes) {
        assert.ok(b.x >= 8 && b.x + b.w <= PATH_W - 8 && b.y >= 20 && b.y + b.h <= L.h - 18, `${b.id} inside`);
        for (const t of b.label) assert.ok(textWidth(t, 'oswald') + 6 <= b.w, `${b.id} label "${t}" fits`);
        assert.ok(b.label.length * 12 <= b.h, `${b.id} label lines fit`);
      }
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
        assert.ok(!overlap(rectOf(boxes[i]), rectOf(boxes[j]), 8), `${boxes[i].id} / ${boxes[j].id} apart`);
      }
    });
    it(`${m} @ ${f} Hz: every wire starts on its source, ends with its arrow on its target, and crosses no other box or wire`, () => {
      for (const w of L.wires) {
        const end = w.pts[w.pts.length - 1];
        assert.ok(onEdge(end, by(w.to)), `${w.from}>${w.to} ends on ${w.to}`);
        const start = w.pts[0];
        const fromJunction = w.kind === 'copy' && w.from === 'in' && start[0] === L.junction[0] && Math.abs(start[1] - L.junction[1]) <= 3;
        assert.ok(onEdge(start, by(w.from)) || fromJunction, `${w.from}>${w.to} starts on ${w.from}`);
        for (const [a, b] of segs(w)) {
          assert.ok(a[0] === b[0] || a[1] === b[1], `${w.from}>${w.to}: square runs only`);
          for (const box of boxes) {
            if (box.id === w.from || box.id === w.to) continue;
            assert.ok(!overlap(segRect(a, b, 0), rectOf(box)), `${w.from}>${w.to} crosses ${box.id}`);
          }
        }
        const last = segs(w).at(-1)!;
        assert.ok(Math.hypot(last[1][0] - last[0][0], last[1][1] - last[0][1]) >= 10, `${w.from}>${w.to}: room for the arrowhead`);
      }
      // the junction dot sits on the input wire, clear of its arrowhead
      const feed = L.wires.find((w) => w.from === 'in' && w.kind === 'audio')!;
      const [a, b] = feed.pts;
      assert.ok(L.junction[1] === a[1] && L.junction[0] > a[0] && L.junction[0] + 2.6 < b[0] - 7, 'junction on the feed, before its arrowhead');
      // no two wires cross (the control line never crosses the rest-of-the-voice lane)
      for (let i = 0; i < L.wires.length; i++) for (let j = i + 1; j < L.wires.length; j++) {
        for (const [a1, b1] of segs(L.wires[i])) for (const [a2, b2] of segs(L.wires[j])) {
          const h1 = a1[1] === b1[1], h2 = a2[1] === b2[1];
          if (h1 === h2) continue;
          const [hA, hB, vA, vB] = h1 ? [a1, b1, a2, b2] : [a2, b2, a1, b1];
          const x = vA[0], y = hA[1];
          const strict = x > Math.min(hA[0], hB[0]) && x < Math.max(hA[0], hB[0]) && y > Math.min(vA[1], vB[1]) && y < Math.max(vA[1], vB[1]);
          assert.ok(!strict, `${L.wires[i].from}>${L.wires[i].to} crosses ${L.wires[j].from}>${L.wires[j].to}`);
        }
      }
    });
    it(`${m} @ ${f} Hz: free labels stay clear of boxes, wires, arrowheads and each other`, () => {
      const ink = L.texts.map(textRect);
      L.texts.forEach((t, i) => {
        const r = ink[i];
        assert.ok(r.x0 >= 8 && r.x1 <= PATH_W - 8 && r.y0 >= 4 && r.y1 <= L.h - 2, `"${t.text}" inside`);
        for (const b of boxes) assert.ok(!overlap(r, rectOf(b), 2), `"${t.text}" clear of ${b.id}`);
        for (const w of L.wires) {
          for (const [a, b] of segs(w)) assert.ok(!overlap(r, segRect(a, b), 1), `"${t.text}" clear of ${w.from}>${w.to}`);
          assert.ok(!overlap(r, headRect(w), 1), `"${t.text}" clear of the ${w.from}>${w.to} arrowhead`);
        }
        for (let j = i + 1; j < ink.length; j++) assert.ok(!overlap(r, ink[j], 1), `"${t.text}" / "${L.texts[j].text}"`);
      });
    });
  }
  it('the smallest text is 9 units: ≥ 9 pt on a 343-pt-wide phone', () => {
    assert.equal(PATH_LBL, 9);
    assert.ok(PATH_LBL * (343 / PATH_W) >= 9);
    assert.equal(pathHeight('split'), PATH_H_SPLIT);
    assert.equal(pathHeight('broadband'), PATH_H_BROADBAND);
  });
});

describe('DE-R2-01 — the screen draws from the layout and the copy matches the drawing', () => {
  const viz = read(`${DE}deEsserViz.tsx`), screen = read(`${DE}DeEsserLabScreen.tsx`);
  it('PathDiagram renders pathLayout’s boxes and wires; the old relabel-only split is gone', () => {
    assert.match(viz, /const L = pathLayout\(mode, freqHz\);/);
    assert.match(viz, /\{L\.wires\.map\(wire\)\}/);
    assert.match(viz, /\{L\.boxes\.map\(box\)\}/);
    assert.doesNotMatch(viz, /gain · hiss band/);
    assert.doesNotMatch(viz, /PATH_H\b/);
  });
  it('the page passes the rack’s mode and frequency, sizes the figure per mode and walks the mode’s blocks', () => {
    assert.match(screen, /aspect=\{VIZ_W \/ pathHeight\(rackS\.mode\)\}/);
    assert.match(screen, /mode=\{rackS\.mode\} freqHz=\{rackS\.freqHz\}/);
    assert.match(screen, /const ORDER = pathOrder\(rackS\.mode\);/);
    assert.match(screen, /\[\.\.\.PATH_MAIN, \.\.\.PATH_SPLIT, \.\.\.PATH_SIDECHAIN\]/);
  });
  it('split-band copy no longer says the whole voice goes straight through the gain element', () => {
    assert.match(screen, /In split-band mode the voice is split in two: only the hiss band goes through a gain element/);
    assert.match(screen, /the gain element only ever sees the hiss band/);
    // the broadband wording is kept, behind the mode test
    assert.match(screen, /: 'A de-esser is a compressor with a filtered ear\. The voice goes straight through a gain element;/);
  });
});
