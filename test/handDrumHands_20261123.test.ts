/**
 * THE HAND-DRUM HANDS (figure realism pass, second wave, 2026-11-23). The
 * owner on the Bongos hand (2026-11-22): "look how ugly and poorly shown
 * current human figures are"; on the kit drummer's hands, approved 2026-11-23
 * ("Hands pass", "Drummer passes") — the standard these follow. Then, on the
 * hand study (2026-11-23): "slap is not just the fingers short near the rim
 * like this. research a little more" and "make sure when viewed from above,
 * the thumb is correctly placed under the hand".
 *
 * Pinned here, for the 2-D posed hand (smallperc/hands.ts → handForm.ts →
 * Hand.tsx) on every page that draws it (the hand-drum "How it sounds" side
 * strike and strokes from above, the cajón's hands on the plate, the finger
 * cymbals' pinch, the bar chimes' sweep):
 *   • five digits in every pose, each ONE shape; painted in the pose's own
 *     order on a grid, every digit the view shows is one visible region, no
 *     other region is finger-sized ("i see 9 fingers");
 *   • from above, the thumb is painted BEFORE the back of the hand and comes
 *     out from under its edge;
 *   • adult proportions: finger order middle > ring ≥ index > little, the
 *     hand ≈ 186–195 mm, 70–90 mm across the knuckles, the wrist 50–60 mm;
 *   • the strokes' poses as conga and djembe teaching agrees: the open tone's
 *     palm ridge on the edge of the head, fingers flat on it; the bass's palm
 *     toward the center, the whole hand on the head; the slap's ridge about an
 *     inch farther in, the fingers cupped, all four tips on the head; bongo
 *     fingertip strokes falling from the rim, the pads at the lesson's spot;
 *   • the forearm runs into the sleeve and the cuff is roomier than the wrist
 *     (nothing see-through, no skin past the cloth).
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const R = <T>(m: T): T => (m as { default?: T }).default ?? m;
const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const L = 'src/screens/lab/miking/lessons/';

const H = R(await import('../src/screens/lab/miking/lessons/shared/smallperc/hands.ts'));
const HF = R(await import('../src/screens/lab/miking/lessons/shared/smallperc/handForm.ts'));
const GE = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/geom.ts'));
const S = R(await import('../src/screens/lab/miking/lessons/shared/handdrums/handSoundArt.tsx'));
const FAM = R(await import('../src/screens/lab/miking/lessons/shared/handdrums/family.ts'));
const LS = R(await import('../src/screens/lab/miking/data/lessons.ts'));
const CONGA_ART = R(await import('../src/screens/lab/miking/lessons/m04aCongas/soundArt.tsx'));
const BONGO = R(await import('../src/screens/lab/miking/lessons/m04bBongos/model.ts'));
const DJ = R(await import('../src/screens/lab/miking/lessons/m05Djembe/model.ts'));

type Pt = readonly [number, number];
type Geo = ReturnType<typeof H.dorsalFlat>;
type Part = { name: string; kind: 'palm' | 'digit'; digit?: string; outline: Pt[] };

const inPoly = (p: Pt, poly: readonly Pt[]) => GE.inPoly({ u: p[0], v: p[1] }, poly.map((q) => ({ u: q[0], v: q[1] })));
const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** Every hand the H4 pages draw, by name, with the digits its view shows. */
const POSES: { name: string; geo: Geo; shows: string[] }[] = [
  { name: 'side strike, open tone (M04a, M04b, M05)', geo: S.sideStrike(-110, -500, 14).geo, shows: ['thumb', 'index', 'middle'] },
  { name: 'from above: open / muted tone, bass, bongo halfway', geo: H.dorsalFlat(0), shows: ['thumb', 'index', 'middle', 'ring', 'little'] },
  { name: 'from above: slap (djembe)', geo: H.dorsalFlat(50, 2.2), shows: ['thumb', 'index', 'middle', 'ring', 'little'] },
  { name: 'from above: bongo fingertip strokes', geo: H.dorsalFlat(36, 1, 20), shows: ['thumb', 'index', 'middle', 'ring', 'little'] },
  { name: 'cajón: the hand on the plate (from above)', geo: H.dorsalFlat(8), shows: ['thumb', 'index', 'middle', 'ring', 'little'] },
  { name: 'bar chimes: the sweeping hand (its back)', geo: H.dorsalFlat(0), shows: ['thumb', 'index', 'middle', 'ring', 'little'] },
  { name: 'finger cymbals: the pinch (thumb side)', geo: H.pinchHand(), shows: ['thumb', 'index', 'middle'] },
];

/** The hand painted on a 0.5 mm grid in its own paint order; each part's visible regions (area, inscribed width). */
function regions(geo: Geo) {
  const f = HF.handForm(geo);
  const parts: Part[] = f.parts.map((p: Part) => (p.kind === 'palm' ? { ...p } : p));
  const covers = parts.map((p: Part) => (q: Pt) => inPoly(q, p.outline) || (p.kind === 'palm' && f.view === 'side' && inPoly(q, f.thenar)));
  const all = parts.flatMap((p: Part) => p.outline);
  const xs = all.map((p) => p[0]);
  const ys = all.map((p) => p[1]);
  const x0 = Math.min(...xs);
  const y0 = Math.min(...ys);
  const step = 0.5;
  const W = Math.ceil((Math.max(...xs) - x0) / step) + 3;
  const Hh = Math.ceil((Math.max(...ys) - y0) / step) + 3;
  const top = new Int16Array(W * Hh).fill(-1);
  for (let j = 0; j < Hh; j++)
    for (let i = 0; i < W; i++) {
      const q: Pt = [x0 + (i - 1) * step, y0 + (j - 1) * step];
      for (let k = parts.length - 1; k >= 0; k--)
        if (covers[k](q)) {
          top[j * W + i] = k;
          break;
        }
    }
  const seen = new Uint8Array(W * Hh);
  const out: { k: number; area: number; width: number; at: Pt }[] = [];
  for (let c = 0; c < W * Hh; c++) {
    const k = top[c];
    if (k < 0 || seen[c]) continue;
    const cells: number[] = [];
    const stack = [c];
    seen[c] = 1;
    while (stack.length) {
      const x = stack.pop()!;
      cells.push(x);
      const i = x % W;
      for (const y of [x - 1, x + 1, x - W, x + W]) {
        if (y < 0 || y >= W * Hh || seen[y] || top[y] !== k) continue;
        if ((y === x - 1 && i === 0) || (y === x + 1 && i === W - 1)) continue;
        seen[y] = 1;
        stack.push(y);
      }
    }
    const inR = new Map<number, number>(cells.map((x) => [x, Infinity]));
    const pass = (xs2: number[], nb: number[]) => {
      for (const x of xs2) {
        let d = inR.get(x)!;
        for (const o of nb) d = Math.min(d, (inR.has(x + o) ? inR.get(x + o)! : 0) + (Math.abs(o) === 1 || Math.abs(o) === W ? 1 : 1.414));
        inR.set(x, d);
      }
    };
    const sorted = [...cells].sort((a, b) => a - b);
    pass(sorted, [-1, -W, -W - 1, -W + 1]);
    pass(sorted.reverse(), [1, W, W + 1, W - 1]);
    const at = cells.reduce((m, x) => [m[0] + (x0 + ((x % W) - 1) * step) / cells.length, m[1] + (y0 + (Math.floor(x / W) - 1) * step) / cells.length] as Pt, [0, 0] as Pt);
    out.push({ k, area: cells.length * step * step, width: 2 * Math.max(...inR.values()) * step, at });
  }
  return { parts, rs: out, form: f };
}

describe('the hand-drum hands: five digits, one shape each (owner: "i see 9 fingers")', () => {
  for (const pose of POSES) {
    it(`${pose.name}: a thumb and four fingers; the ${pose.shows.length} digits it shows each one visible region, nothing else finger-sized`, () => {
      const { parts, rs } = regions(pose.geo);
      const digits = parts.filter((p) => p.kind === 'digit').map((p) => p.digit);
      assert.deepEqual([...digits].sort(), ['index', 'little', 'middle', 'ring', 'thumb'], 'five digits, each once');
      assert.equal(parts.filter((p) => p.kind !== 'digit').length, 1, 'one palm, no other form');
      const report = rs.filter((r) => r.area >= 4).map((r) => `${parts[r.k].name} ${r.area.toFixed(0)} mm² ${r.width.toFixed(0)} mm at ${r.at[0].toFixed(0)},${r.at[1].toFixed(0)}`).join('; ');
      for (const [k, p] of parts.entries()) {
        const n = rs.filter((r) => r.k === k && r.area >= 4).length;
        if (p.kind === 'palm') continue;
        if (pose.shows.includes(p.digit!)) assert.equal(n, 1, `${p.digit}: ${n} visible regions (${report})`);
        else {
          // a digit hidden in this view: never a finger-sized form of its own
          assert.ok(n <= 1, `${p.digit}: ${n} visible regions (${report})`);
          const big = rs.filter((r) => r.k === k && r.area >= 40 && r.width >= 12);
          assert.equal(big.length, 0, `${p.digit} is hidden in this view but shows a finger-sized form (${report})`);
        }
      }
      const palmK = parts.findIndex((p) => p.kind === 'palm');
      const stray = rs.filter((r) => r.k === palmK && r.area >= 40 && r.width >= 12 && r.width <= 25 && r.area < 900);
      assert.equal(stray.length, 0, `a finger-sized piece of palm (${report})`);
      const fingerSized = rs.filter((r) => r.area >= 40 && r.width >= 12 && r.width <= 25 && parts[r.k].kind === 'digit');
      assert.ok(fingerSized.length <= 5, `${fingerSized.length} finger-sized forms (${report})`);
    });
  }

  it('from above the thumb lies UNDER the back of the hand (owner 2026-11-23: "the thumb is correctly placed under the hand"): painted first, its root under the palm', () => {
    for (const geo of [H.dorsalFlat(0), H.dorsalFlat(50, 2.2), H.dorsalFlat(36, 1, 20), H.dorsalFlat(8)]) {
      const f = HF.handForm(geo);
      assert.equal(f.view, 'back');
      assert.equal(f.parts[0].digit, 'thumb', 'the thumb is painted first');
      assert.equal(f.parts[1].kind, 'palm', 'then the back of the hand over it');
      assert.equal(f.parts[0].fade, null, 'no root patch painted over the back of the hand');
      const palm = f.parts[1].outline;
      assert.ok(inPoly(geo.thumb.pts[0], palm), 'the thumb’s base joint is under the palm');
      // the visible thumb is thumb minus hand: it comes out low on the hand, toward the wrist end
      const { parts, rs } = regions(geo);
      const k = parts.findIndex((p) => p.digit === 'thumb');
      assert.equal(rs.filter((r) => r.k === k && r.area >= 4).length, 1);
      const outside = parts[k].outline.filter((q) => !inPoly(q, palm));
      assert.ok(Math.min(...outside.map((q) => q[0])) < 45, 'the thumb leaves the hand’s edge near the wrist end of the palm');
      // its nail, seen from the side, a sliver at most
      const nail = f.parts[0].nail;
      if (nail) {
        const ws = nail.map((q: Pt) => q[1]);
        assert.ok(Math.max(...ws) - Math.min(...ws) < 7, 'the thumb’s nail a sliver');
      }
    }
  });

  it('from above the fingers GROW out of the back of the hand (owner review 2026-11-23: "four sausages stuck onto a palm"): no finger-root contour on the back of the hand', () => {
    const src = read(`${L}shared/smallperc/Hand.tsx`);
    assert.match(src, /for \(const q of parts\) if \(q\.grow\) palm\.path = union\(palm\.path, q\.path\);/, 'the back of the hand and its fingers are one form');
    for (const geo of [H.dorsalFlat(0), H.dorsalFlat(50, 2.2), H.dorsalFlat(36, 1, 20), H.dorsalFlat(8)]) {
      const f = HF.handForm(geo);
      const body = f.parts.find((p: Part) => p.kind === 'palm').outline;
      for (const p of f.parts as (Part & { edge: Pt[]; fade: unknown; grow: { at: Pt; dir: Pt } | null })[]) {
        if (p.kind !== 'digit' || p.digit === 'thumb') continue;
        assert.ok(p.grow, `${p.digit}: its own form begins at the knuckle row`);
        assert.equal(p.fade, null, `${p.digit}: no root patch`);
        assert.ok(p.edge.length > 4, `${p.digit}: an edge where it lies over its neighbor`);
        const inside = p.edge.filter((q) => inPoly(q, body));
        assert.equal(inside.length, 0, `${p.digit}: ${inside.length} edge points on the back of the hand`);
        for (const q of p.edge) assert.ok((q[0] - p.grow!.at[0]) * p.grow!.dir[0] + (q[1] - p.grow!.at[1]) * p.grow!.dir[1] > HF.WEB - 0.01, `${p.digit}: its edge begins at the web, past the knuckle`);
      }
    }
  });

  it('seen edge-on, the side view paints the far fingers behind the palm and the thumb nearest', () => {
    for (const geo of [S.sideStrike(-110, -500, 14).geo, H.pinchHand()]) {
      const f = HF.handForm(geo);
      assert.equal(f.view, 'side');
      const names = f.parts.map((p: Part) => p.name);
      assert.equal(names[names.length - 1], 'thumb');
      assert.equal(names[names.length - 2], 'index');
      assert.ok(names.indexOf('palm') > names.indexOf('middle'), 'the middle finger behind the palm’s near side');
    }
  });
});

describe('the hand-drum hands: adult proportions', () => {
  const g = H.dorsalFlat(0);
  const by = (k: number) => g.fingers.find((f: { k?: number }) => f.k === k)!;
  const len = (f: { pts: Pt[] }) => f.pts.slice(1).reduce((s: number, p: Pt, i: number) => s + dist(p, f.pts[i]), 0) - dist(f.pts[0], f.pts[1]);
  it('finger lengths: middle > ring ≥ index > little', () => {
    const [i, m, r, l] = [0, 1, 2, 3].map((k) => len(by(k)));
    assert.ok(m > r && r >= i && i > l, `index ${i.toFixed(0)} middle ${m.toFixed(0)} ring ${r.toFixed(0)} little ${l.toFixed(0)}`);
    assert.ok(m - l >= 15, 'the little finger clearly shorter');
  });
  it('the hand ≈ 186–195 mm long, 70–90 mm across the knuckles, the wrist 50–60 mm', () => {
    const m = by(1);
    assert.ok(m.tip[0] >= 178 && m.tip[0] <= 196, `wrist to middle fingertip ${m.tip[0].toFixed(0)} mm`);
    const edges = g.fingers.flatMap((f: { pts: Pt[]; w0: number }) => [f.pts[1][1] - f.w0 / 2, f.pts[1][1] + f.w0 / 2]);
    const breadth = Math.max(...edges) - Math.min(...edges);
    assert.ok(breadth >= 70 && breadth <= 90, `breadth ${breadth.toFixed(0)} mm`);
    const f = HF.handForm(g);
    const wrist = dist(f.wrist[0], f.wrist[1]);
    assert.ok(wrist >= 50 && wrist <= 60, `wrist ${wrist.toFixed(0)} mm`);
  });
  it('the thumb rises from the base of the palm in every pose', () => {
    for (const p of POSES) assert.ok(p.geo.thumb.pts[0][0] <= 35, `${p.name}: thumb base at x ${p.geo.thumb.pts[0][0]}`);
  });
});

describe('the strokes’ poses (owner 2026-11-23: "slap is not just the fingers short near the rim like this")', () => {
  const lessons = ['M04a', 'M04b', 'M05'].map((id) => FAM.handOf(LS.lessonById(id)));
  const rOf = (pl: { at: Pt; angle: number; scale?: number; mirror?: boolean }, p: Pt) => H.placePt(p, pl);

  it('every hand stroke of congas, bongos and djembe has a pose; a slap is drawn as a slap', () => {
    const seen: string[] = [];
    for (const h of lessons)
      for (const s of h.strokes.items) {
        if (s.tool === 'stick') continue;
        seen.push(`${s.id}:${S.topPoseOf(s)}`);
      }
    // (the congas' SLAP: owner 2026-11-23, "Yes, add slap")
    assert.deepEqual(seen, ['open:fingers', 'muted:fingers', 'slap:slap', 'bass:palm', 'machoEdge:tips', 'hembraEdge:tips', 'hembraMid:fingers', 'bass:palm', 'tone:fingers', 'slap:slap']);
  });

  it('the congas page has four strokes, the slap among them (owner 2026-11-23: "Yes, add slap"): farther in than the open tone, all four fingertips on the head', () => {
    const h = lessons[0];
    assert.deepEqual(h.strokes.items.map((s: { id: string }) => s.id), ['open', 'muted', 'slap', 'bass']);
    const slap = h.strokes.items.find((s: { id: string }) => s.id === 'slap');
    assert.equal(slap.text, 'The edge of the palm on the rim, cupped fingertips whipping onto the head: a sharp, dry crack.');
    assert.equal(slap.label, 'SLAP');
    assert.equal(S.topPoseOf(slap), 'slap');
    const open = h.strokes.items.find((s: { id: string }) => s.id === 'open');
    const R0 = h.drum.R;
    const ts = S.topHandFor('slap', -slap.frac * R0, R0);
    const to = S.topHandFor('fingers', -open.frac * R0, R0);
    assert.ok(ts.ridgeX - to.ridgeX >= 20, 'the slap’s palm ridge farther onto the drum than the open tone’s');
    assert.equal(ts.pads.length, 4);
    for (const q of ts.pads) assert.ok(Math.hypot(q[0], q[1]) < R0, 'every fingertip pad on the head');
  });

  for (const h of lessons)
    for (const s of h.strokes.items) {
      if (s.tool === 'stick' || s.frac == null) continue;
      const d = (s.drum && h.drums?.[s.drum]) || h.drum;
      const R0 = d.R;
      const sx = -s.frac * R0;
      const pose = S.topPoseOf(s);
      it(`${h.drum.name} · ${s.label} (${pose}): where the hand meets the head`, () => {
        const t = S.topHandFor(pose, sx, R0);
        const tips = t.geo.fingers.map((f: { tip: Pt }) => rOf(t.pl, f.tip));
        const ridge = t.ridgeX;
        if (pose === 'fingers') {
          assert.ok(Math.abs(ridge + R0) <= 3, `the palm's ridge on the edge (${(ridge + R0).toFixed(1)} mm)`);
          for (const q of tips) assert.ok(Math.hypot(q[0], q[1]) < R0, 'every fingertip on the head');
          assert.ok(sx > ridge && sx < Math.max(...tips.map((q: Pt) => q[0])), 'the lesson’s spot lies under the fingers');
        } else if (pose === 'palm') {
          const palmC = rOf(t.pl, [52, -9.5]);
          assert.ok(Math.abs(palmC[0] - sx) < 1, 'the palm’s center on the lesson’s spot');
          assert.ok(Math.abs(sx) < R0 * 0.35, 'toward the center');
          for (const q of [...tips, t.pl.at]) assert.ok(Math.hypot(q[0], q[1]) < R0, 'the whole hand on the head');
        } else if (pose === 'slap') {
          const tone = S.topHandFor('fingers', sx, R0);
          assert.ok(Math.abs(ridge - (-R0 + 25)) <= 3, 'the ridge about an inch inside the edge');
          assert.ok(ridge - tone.ridgeX >= 20, 'the hand farther onto the drum than for the open tone');
          for (const q of t.pads) assert.ok(Math.hypot(q[0], q[1]) < R0 - 30, 'all four fingertip pads well onto the head');
          assert.equal(t.pads.length, 4, 'the contact marked at the four fingertip pads');
          assert.ok(sx >= ridge - 15 && sx <= ridge + 25, 'the lesson’s spot at the edge of the palm');
        } else {
          const mid = t.geo.fingers.find((f: { k?: number }) => f.k === 1)!;
          const pad = rOf(t.pl, [mid.tip[0] - mid.tipDir[0] * 5, mid.tip[1] - mid.tipDir[1] * 5]);
          assert.ok(Math.abs(pad[0] - sx) < 1, 'the middle finger’s pad on the lesson’s spot near the edge');
          // the index, middle and ring pads on the head near the edge (marked); on the
          // small heads the shorter little finger's pad may fall on the rim (not marked)
          const all = t.geo.fingers.map((f: { tip: Pt; tipDir: Pt; k?: number }) => ({ k: f.k, q: rOf(t.pl, [f.tip[0] - f.tipDir[0] * 5, f.tip[1] - f.tipDir[1] * 5]) }));
          for (const { k, q } of all) {
            const fromEdge = Math.hypot(q[0], q[1]) - R0;
            if (k !== 3) assert.ok(fromEdge < 0 && fromEdge > -45, `finger ${k}: its pad on the head near the edge (${fromEdge.toFixed(1)} mm)`);
            else assert.ok(fromEdge < d.rim.t + 8, `the little finger's pad on the head or the rim (${fromEdge.toFixed(1)} mm)`);
          }
          assert.ok(t.pads.length >= 3 && t.pads.every((q: Pt) => Math.hypot(q[0], q[1]) < R0), 'only pads on the head are marked');
          // (owner review 2026-11-23: not "just the fingers short near the rim": the
          // hand low over the rim, the fingers showing most of their length)
          assert.ok(ridge > -R0 - 70 && ridge < -R0, `the knuckles over or just outside the rim (${(ridge + R0).toFixed(0)} mm from the edge)`);
          const k = H.placePt(mid.pts[1], t.pl);
          assert.ok(dist(k, pad) >= 70, `the middle finger shows ${dist(k, pad).toFixed(0)} mm of its length from above`);
        }
      });
    }

  for (const [name, d] of [
    ['congas', CONGA_ART.SECTION_DRUM],
    ['bongos', BONGO.HEMBRA],
    ['djembe', DJ.DJEMBE],
  ] as const) {
    it(`side view, ${name}: the open tone — the palm's ridge on the rim, the fingers flat on the head, the wrist above`, () => {
      const edgeX = d.c.x - d.R;
      const st = S.sideStrike(edgeX, d.headY, d.rim.rise);
      const ridge = H.placePt(S.ridgeOf(st.geo), st.pl);
      assert.ok(dist(ridge, [edgeX + 4, d.headY - d.rim.rise]) < 0.5, 'the ridge on the rim');
      const pad = H.placePt(S.padOf(st.geo), st.pl);
      assert.ok(Math.abs(pad[1] - (d.headY - 3)) < 0.5, 'the middle finger’s pad on the head');
      assert.ok(pad[0] > edgeX && pad[0] < d.c.x, 'on the near half of the head');
      const mid = st.geo.fingers.find((f: { k?: number }) => f.k === 1)!;
      const a = H.placePt(mid.pts[0], st.pl);
      const b = H.placePt(mid.tip, st.pl);
      const slope = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
      assert.ok(Math.abs(slope) <= 12, `the fingers lie along the head (${slope.toFixed(1)}°)`);
      assert.ok(st.mcp <= 10 && st.mcp >= -40, `the knuckles turned within reach (${st.mcp.toFixed(0)}°)`);
      assert.ok(st.pl.at[1] < d.headY - d.rim.rise, 'the wrist above the rim');
      // the lesson's strike point lies under the fingers
      const sx = d.c.x - 0.72 * d.R;
      assert.ok(sx > ridge[0] && sx < b[0], 'the strike point under the fingers');
    });
  }
});

describe('the forearm and the cuff (owner: "check for hand transition to wrist and arm"; "a transparent circle in the sleeve")', () => {
  it('the forearm is part of the palm’s one form; the sleeve is opaque cloth painted over the forearm, its near rim in front of the wrist', () => {
    const src = read(`${L}shared/smallperc/Hand.tsx`);
    assert.match(src, /if \(arm\) path = union\(path, arm\.path\);/, 'the forearm joins the palm: one form, no step');
    const handAt = src.indexOf('{ordered.map((p, i) =>');
    const sleeveAt = src.indexOf('<Path path={sl.path}>');
    assert.ok(handAt > 0 && sleeveAt > handAt, 'the sleeve is painted after (over) the forearm');
    assert.doesNotMatch(src, /opening|rimFar/, 'no see-through opening, no far rim behind the wrist');
    assert.doesNotMatch(src.slice(sleeveAt, sleeveAt + 400), /opacity=\{0\.\d+\}>\s*<LinearGradient/, 'the cloth is fully opaque');
  });
  it('the cuff is roomier than the wrist it covers, and sits between the elbow and the wrist', () => {
    for (const pose of ['fingers', 'slap', 'tips', 'palm'] as const) {
      const t = S.topHandFor(pose, -100, 150);
      const f = HF.handForm(t.geo);
      const wrist = dist(f.wrist[0], f.wrist[1]) / 2;
      assert.ok(t.arm.cuff.r > wrist * 1.12, `cuff ${t.arm.cuff.r} mm vs the forearm ${(wrist * 1.12).toFixed(0)} mm there`);
      const W = t.pl.at;
      const c = t.arm.cuff.c;
      assert.ok(dist(c, W) > 30 && dist(c, W) < 80, `the cuff ${dist(c, W).toFixed(0)} mm from the wrist`);
      assert.ok(dist(t.arm.forearm.from, W) > dist(c, W), 'the forearm starts inside the sleeve');
    }
  });
});
