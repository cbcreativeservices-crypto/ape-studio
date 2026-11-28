/**
 * FIGURE V2 — WAVE 3: THE HAND ROUND A HAND-HELD MIC, STEP A (must-do D78;
 * coordinator rounds 2026-11-23; round 3 after the owner's note "thumb is on
 * wrong side of mic cylinder"). Checked here:
 *   • the side of the hand each lesson's arm shows is READ from its real
 *     rotation, not guessed — the documented list for B03, B10 and B09, side
 *     and from above;
 *   • THE GRIP (one 3-D hand, every view its projection): the handle lies in
 *     the palm; the four fingers come round its far (knuckle) edge and the
 *     thumb round its near (wrist) edge — opposite sides of the handle's line
 *     as seen from the palm; their ends meet on the handle's front, away from
 *     the palm (the thumb's pad on the index and middle); the handle's line
 *     passes between the palm and the fingers, never behind the whole hand; no
 *     finger runs through the handle; four fingers and a thumb; ≈ 84 mm along
 *     the handle;
 *   • EVERY VIEW of every case: the palm behind the handle and the thumb's end
 *     in front of it from the palm side; the back of the hand in front and the
 *     thumb's end behind from the back; from the knuckle end the thumb on the
 *     other side of the handle's line from the knuckles; seen from the palm,
 *     the fingers and the thumb come round opposite sides of the handle's line
 *     on the page; the mic painted once;
 *   • no lesson draws it yet (step B waits).
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { describe, it } from 'node:test';

const R = <T>(m: T): T => (m as { default?: T }).default ?? m;
const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const HH = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/heldHands.ts'));
const ST = R(await import('../src/dev/heldStudy.tsx'));

type L3 = { u: number; w: number; n: number };
type Pt = { u: number; v: number };
const side = (a: Pt, b: Pt, p: Pt) => Math.sign((b.u - a.u) * (p.v - a.v) - (b.v - a.v) * (p.u - a.u));

describe('figure V2 wave 3 — the hand round a hand-held mic (step A)', () => {
  it('the side of the hand, read from each arm’s real rotation (B03, B10, B09 — side and from above)', () => {
    const want: Record<string, [string, string]> = {
      'b3.shared': ['heldPalm', 'heldEnd'],
      'b3.handoffOmni': ['heldPalm', 'heldBack'],
      'b3.repOwn': ['heldPalm', 'heldFace'],
      'b10.hand': ['heldFace', 'heldPalm'],
      'b10.reporter': ['heldBack', 'heldFace'],
      'b9.lip': ['heldBack', 'heldFace'],
    };
    for (const id of ST.HELD_CASES) {
      assert.equal(ST.heldViewOf(id, 'side').view, want[id][0], `${id} side`);
      assert.equal(ST.heldViewOf(id, 'top').view, want[id][1], `${id} top`);
    }
  });

  it('the back of the right hand faces h × f (a fist round a handle held up in front: knuckles out)', () => {
    const fr = HH.heldFrame({ x: 0, y: 0, z: 0 }, { x: 300, y: 0, z: 0 }, { x: 0, y: -1, z: 0 }, 'R', { x: 0, y: 0, z: 1 });
    assert.ok(fr.d.z > 0.99);
    const l = HH.heldFrame({ x: 0, y: 0, z: 0 }, { x: 300, y: 0, z: 0 }, { x: 0, y: -1, z: 0 }, 'L', { x: 0, y: 0, z: -1 });
    assert.ok(l.d.z < -0.99);
    // the grip's own frame keeps that back: N along d
    const g = HH.gripFrame(fr);
    assert.ok(g.N.x * fr.d.x + g.N.y * fr.d.y + g.N.z * fr.d.z > 0.99);
  });

  it('THE GRIP: the handle in the palm, the fingers round one edge, the thumb round the other, meeting on its front', () => {
    for (const deg of [-28, -15, 0, 15, 28]) {
      for (const Rh of [11, 12.5, 14]) {
        const m = HH.gripModel(Rh, (deg * Math.PI) / 180);
        const at = `β ${deg}°, R ${Rh}`;
        assert.equal(m.fingers.length, 4, at);
        assert.equal(m.thumb.name, 'thumb', at);
        // seen from the palm: the fingers round the knuckle edge (+), the thumb round the wrist edge (−)
        const r = HH.gripRounds(m);
        for (const f of r.fingers) assert.equal(f.side, 1, `${at}: ${f.name} comes round the knuckle edge`);
        assert.equal(r.thumb.side, -1, `${at}: the thumb comes round the other (wrist) edge`);
        // their ends on the handle's front, the side away from the palm
        for (const t of r.tips) assert.ok(t.n < 0, `${at}: a digit's end on the handle's front (n ${t.n.toFixed(1)})`);
        // the thumb's pad meets the index or the middle finger there
        const tip = m.thumb.pts[m.thumb.pts.length - 1];
        const near = Math.min(...m.fingers.slice(0, 2).flatMap((f: { pts: L3[] }) => f.pts.slice(1).map((p) => Math.hypot(p.u - tip.u, p.w - tip.w, p.n - tip.n))));
        assert.ok(near < 32, `${at}: the thumb's pad ${near.toFixed(0)} mm from the index/middle`);
        // the handle's line between the palm and the fingers: the palm's skin above it, each finger across its front
        for (const s of [...m.palm, ...m.knuckles] as { c: L3; r: number }[]) {
          const dist = Math.hypot(s.c.u - HH.axisU(m, s.c.w), s.c.n);
          assert.ok(dist >= Rh + s.r - 2.5, `${at}: the palm rests on the handle, not through it (${(dist - Rh - s.r).toFixed(1)})`);
        }
        assert.ok(m.palm.every((s: { c: L3 }) => s.c.n > 0), `${at}: the palm on its own side of the handle`);
        for (const f of m.fingers) {
          const front = f.pts.some((p: L3) => p.n < -Rh && Math.abs(p.u - HH.axisU(m, p.w)) < Rh + 8);
          assert.ok(front, `${at}: ${f.name} crosses the handle's front`);
        }
        // no digit runs through the handle
        for (const d of [...m.fingers, m.thumb])
          d.pts.forEach((p: L3, i: number) => {
            if (i === 0) return;
            const dist = Math.hypot(p.u - HH.axisU(m, p.w), p.n);
            assert.ok(dist >= Rh + d.r[i] * 0.8, `${at}: ${d.name} joint ${i} inside the handle (${dist.toFixed(1)})`);
          });
        // ≈ 84 mm along the handle, little finger's edge to the thumb's
        const ws = [...m.fingers, m.thumb].flatMap((d: { pts: L3[]; r: number[] }) => d.pts.map((p, i) => [p.w - d.r[i], p.w + d.r[i]])).flat();
        const span = Math.max(...ws) - Math.min(...ws);
        assert.ok(span >= 78 && span <= 96, `${at}: ${span.toFixed(0)} mm along the handle`);
      }
    }
  });

  it('EVERY VIEW of every case: what is in front of the handle, and the thumb on the other side from the fingers', () => {
    for (const id of ST.HELD_CASES)
      for (const view of ['side', 'top'] as const) {
        const h = ST.heldGripOf(id, view);
        const at = `${id} ${view}`;
        assert.equal(h.order.filter((k: unknown) => k === 'MIC').length, 1, `${at}: the mic painted once`);
        const v = h.view.toward as L3;
        const part = (n: string, layer?: string) => h.parts.find((p: { name: string; layer: string }) => p.name === n && (!layer || p.layer === layer));
        if (Math.abs(v.w) > 0.8) continue; // (looking down the handle: the mic's head covers the fist)
        if (v.n < -0.5 && -v.n > Math.abs(v.u)) {
          assert.equal(part('palm').layer, 'behind', `${at}: from the palm side the palm is behind the handle`);
          assert.equal(part('thumb').layer, 'front', `${at}: the thumb comes round onto the handle's front`);
          assert.ok(part('fingers', 'front'), `${at}: the fingertips on the handle's front`);
        }
        if (v.n > 0.5 && v.n > Math.abs(v.u)) {
          assert.equal(part('palm').layer, 'front', `${at}: from the back the hand is in front of the handle`);
          assert.equal(part('thumb').layer, 'behind', `${at}: the thumb's end round the far side`);
        }
        // on the page: project the model's points the way the view does
        const m = h.model;
        const g = h.frame;
        const geo = ST.heldGeo(id);
        const P = (p: L3) => {
          const w = { x: geo.fist.x + g.U.x * p.u + g.W.x * p.w + g.N.x * p.n, y: geo.fist.y + g.U.y * p.u + g.W.y * p.w + g.N.y * p.n, z: geo.fist.z + g.U.z * p.u + g.W.z * p.w + g.N.z * p.n };
          return view === 'side' ? { u: w.x, v: w.y } : { u: w.x, v: w.z };
        };
        const [a, b] = h.axis;
        const r = HH.gripRounds(m);
        if (Math.abs(v.n) > 0.5 && Math.abs(v.n) > Math.abs(v.u)) {
          // seen from the palm or the back: the fingers and the thumb come round opposite sides of the handle's line
          const sf = side(a, b, P(r.fingers[0].at));
          const sT = side(a, b, P(r.thumb.at));
          assert.ok(sf !== 0 && sT !== 0 && sf !== sT, `${at}: the fingers and the thumb round opposite sides on the page`);
        }
        if (v.u > 0.5) {
          // from the knuckle end: the thumb closes the fist on the side opposite the knuckles
          const sk = side(a, b, P(m.fingers[1].pts[0]));
          const sT = side(a, b, P(m.thumb.pts[m.thumb.pts.length - 1]));
          assert.ok(sk !== sT, `${at}: the thumb on the other side of the handle from the knuckles`);
        }
      }
  });

  it('ONE skin (round 5): no lobe stuck on and no notch bitten in — every piece of the palm and of the finger group within 2 mm of its body', () => {
    const outside = (poly: Pt[], p: Pt) => {
      // distance outside a convex polygon (0 inside)
      let worst = 0;
      const cx = poly.reduce((a, q) => a + q.u, 0) / poly.length;
      const cy = poly.reduce((a, q) => a + q.v, 0) / poly.length;
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i];
        const b = poly[(i + 1) % poly.length];
        const l = Math.hypot(b.u - a.u, b.v - a.v);
        if (l < 1e-6) continue;
        let nx = (b.v - a.v) / l;
        let ny = -(b.u - a.u) / l;
        if ((cx - a.u) * nx + (cy - a.v) * ny > 0) { nx = -nx; ny = -ny; }
        worst = Math.max(worst, (p.u - a.u) * nx + (p.v - a.v) * ny);
      }
      return worst;
    };
    for (const id of ST.HELD_CASES)
      for (const view of ['side', 'top'] as const) {
        const h = ST.heldGripOf(id, view);
        const parts = h.parts as { name: string; layer: string; body?: Pt[]; pieces: Pt[][] }[];
        for (const part of parts) {
          // (the bodies of the same form in both layers: a bone behind the handle ends under the front's body)
          const bodies = parts.filter((p) => p.name === part.name && p.body).map((p) => p.body!);
          if (!bodies.length) continue;
          for (const pc of part.pieces)
            for (const q of pc) {
              const d = Math.min(...bodies.map((b) => outside(b, q)));
              assert.ok(d <= 2.05, `${id} ${view} ${part.name}/${part.layer}: a lobe ${d.toFixed(1)} mm past the hand's body`);
            }
        }
        // the web between the index and the thumb: where the palm is behind the handle, it is there (no notch at the handle's exit)
        const palm = (h.parts as { name: string; layer: string; pieces: Pt[][] }[]).find((p) => p.name === 'palm')!;
        if (palm.layer === 'behind') assert.ok(palm.pieces.length >= 2, `${id} ${view}: the web between index and thumb`);
      }
  });

  it('no lesson draws it yet (step B waits for the GO)', () => {
    const L = 'src/screens/lab/miking/lessons';
    for (const d of readdirSync(new URL(`../${L}`, import.meta.url)).filter((x) => /^[a-z]\d/.test(x)))
      for (const f of readdirSync(new URL(`../${L}/${d}`, import.meta.url)).filter((x) => /\.tsx?$/.test(x))) assert.doesNotMatch(read(`${L}/${d}/${f}`), /figureV2\/held(Hands|HandV2)/, `${d}/${f}`);
  });
});
