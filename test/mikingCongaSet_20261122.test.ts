/**
 * M04a CONGAS as a SET OF THREE (owner 2026-11-22, on his iPhone at MEET IT
 * step 2, the screenshot named "center conga is conga w tumba and quinto on
 * sides"; his decision: "Three drums — rebuild the lesson for a set of three:
 * conga in the center, quinto and tumba on the sides. Pictures, part names,
 * mic choices and the lesson text all change.").
 *
 * Real relationships, from the geometry and the art's own hit test:
 *   • three drums, sized from the research record, the conga in the center;
 *   • the frame's words are true of what is drawn (the elevation is the FRONT
 *     view, from the audience);
 *   • in the elevation that introduces the set no drum covers another, and
 *     every name is kept, with a leader that lands on its own drum and no two
 *     leaders crossing, at phone sizes, at the 9 pt floor or above;
 *   • a tap on each drum names that drum, in both views and both setups;
 *   • every starting point starts legally — outside the hands, over its own
 *     drum — and the record says which are sourced and which are the lab's
 *     extension to three drums;
 *   • the raised stands collide with nothing; the hands cover all three heads;
 *   • the plan draws the set turned into its own frame, and no other lesson's
 *     plan changes;
 *   • no learner word still speaks of a pair of drums.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const R = <T,>(m: T): T => ((m as { default?: T }).default ?? m);
const M = R(await import('../src/screens/lab/miking/lessons/m04aCongas/model.ts'));
const G = R(await import('../src/screens/lab/miking/lessons/m04aCongas/geometry.ts'));
const A = R(await import('../src/screens/lab/miking/lessons/m04aCongas/art.tsx'));
const { M04A_LESSON: L } = R(await import('../src/screens/lab/miking/lessons/m04aCongas/lesson.ts'));
const { fitXform } = R(await import('../src/screens/lab/miking/engine/geometry/frame.ts'));
const { viewsOf } = R(await import('../src/screens/lab/miking/engine/model/types.ts'));
const { sceneFrame } = R(await import('../src/screens/lab/miking/engine/geometry/contentFrame.ts'));
const { layoutArtLabels } = R(await import('../src/screens/lab/miking/engine/scene/artLabels.ts'));
const { labelRect, leaderLine, segsCross } = R(await import('../src/screens/lab/miking/engine/scene/labelLayout.ts'));
const { liveReserve } = R(await import('../src/screens/lab/miking/engine/scene/PlacementScene.tsx'));
const { sdf } = R(await import('../src/screens/lab/miking/engine/geometry/sdf.ts'));
const { aimVec } = R(await import('../src/screens/lab/miking/engine/geometry/vec.ts'));
const { copyOf } = R(await import('../src/screens/lab/miking/engine/model/copy.ts'));
const { modelArtPlan, turnArtPlan } = R(await import('../src/screens/lab/miking/lessons/shared/handdrums/handPlanModel.ts'));

const IN = 25.4;
const { QUINTO, CONGA, TUMBA } = M;
const SET = [TUMBA, CONGA, QUINTO];
const art = { labels: A.congaLabels, hitTest: A.congaHitTest };
const VARIANTS = ['floor', 'raised'] as const;
const VIEWS = ['side', 'top'] as const;
type Lbl = { id: string; text: string; u: number; v: number; align: 'left' | 'center' | 'right'; leader?: { u: number; v: number }; at?: { u: number; v: number } };

describe('a set of three drums', () => {
  it('a quinto, a conga and a tumba — 11, 11¾ and 12½ in, all 30 in tall (LP-CLASSIC)', () => {
    assert.equal(QUINTO.R * 2, 11 * IN);
    assert.equal(CONGA.R * 2, 11.75 * IN);
    assert.equal(TUMBA.R * 2, 12.5 * IN);
    for (const d of SET) assert.equal(-d.headY, 30 * IN);
    for (const k of ['quintoD', 'congaD', 'tumbaD', 'height']) assert.deepEqual([M.CONGA_DIMS[k].prov.kind, M.CONGA_DIMS[k].prov.src], ['sourced', 'LP-CLASSIC'], k);
    assert.ok(QUINTO.R < CONGA.R && CONGA.R < TUMBA.R, 'smallest to largest');
    const heads = L.model.parts.filter((p: { id: string }) => /\.head$/.test(p.id)).map((p: { id: string }) => p.id).sort();
    assert.deepEqual(heads, ['conga.head', 'quinto.head', 'tumba.head']);
  });
  it('the conga in the center, right in front of the player; the quinto on the player’s left, the tumba on the right', () => {
    assert.equal(CONGA.c.x, 0);
    assert.ok(QUINTO.c.x > 0, 'the quinto toward +x, the player’s left');
    assert.ok(TUMBA.c.x < 0, 'the tumba toward −x, the player’s right');
    assert.ok(G.PLAYER_BOX.kind === 'box' && G.PLAYER_BOX.min.x < 0 && G.PLAYER_BOX.max.x > 0 && G.PLAYER_BOX.max.z < 0, 'the player behind the conga');
    // The side is a drawing default, said in the unknowns.
    assert.ok(L.unknowns.some((u: { text: string; dims: string[] }) => /which side each drum stands on/i.test(u.text) && u.dims.includes('gap')));
  });
});

describe('the frame’s words are true of what is drawn', () => {
  it('the elevation is the FRONT view from the audience: tumba left, conga middle, quinto right on the screen', () => {
    assert.equal(L.model.viewTags.side, 'FRONT · FROM THE AUDIENCE');
    assert.equal(copyOf(L).viewTag.side, 'FRONT · FROM THE AUDIENCE');
    assert.equal(copyOf(L).viewWords!.side, 'Front view,');
    assert.equal(L.hand.viewNames.side, 'Front');
    // screen u = x in both views: the audience sees the player's right on its left.
    assert.ok(TUMBA.c.x < CONGA.c.x && CONGA.c.x < QUINTO.c.x);
    const ax = copyOf(L).axes;
    assert.match(ax.x.plus, /player’s left/);
    assert.match(ax.x.minus, /player’s right/);
    assert.match(ax.z.plus, /^front of/);
    assert.match(ax.z.minus, /^behind/);
    assert.doesNotMatch(JSON.stringify(ax), /centre|PLAYER’S RIGHT/);
  });
  it('the audience is +z: the wedge in front, the boom toward it, a mic facing the drums points −z', () => {
    assert.ok(L.live.wedges[0].p.z > 0 && L.live.wedges[0].faces.z < 0);
    assert.deepEqual(L.model.mountRule.fallback, { x: 0, y: 0, z: 1 });
    const a = aimVec(L.model.aimHome.az, L.model.aimHome.el);
    assert.ok(a.z < -0.99, 'the aim home faces the player');
    assert.equal(L.hand.context.only, 'top', 'Studio-or-live is drawn from above, where mic and wedge both show');
  });
});

/** The phone layouts the label ratchet measures (test/mikingLabelsClear). */
function layouts(variant: string, view: 'side' | 'top') {
  const authored = viewsOf(L.model, variant)[view]!;
  const parts = sceneFrame(L.model, variant, view, false)!;
  const aspect = (parts.u1 - parts.u0) / (parts.v1 - parts.v0);
  const band = liveReserve(1, 390, 1);
  return [
    { where: 'figure', box: parts, w: 358, h: 358 / aspect, pad: 6, top: 0, intro: true },
    ...[300, 420, 640].map((h) => ({ where: `parts ${h}`, box: parts, w: 390, h, pad: 8, top: 0, intro: true })),
    ...[420, 640].map((h) => ({ where: `stage ${h}`, box: authored, w: 390, h, pad: 8, top: band, intro: false })),
  ].map((lay) => {
    const f = fitXform(view, lay.box, lay.w, lay.h - lay.top, lay.pad);
    const xf = { ...f, oy: f.oy + lay.top };
    const out: Lbl[] = layoutArtLabels(art, view, variant, authored, xf, 1, lay.w, lay.h, { minY: lay.top + 1, model: L.model });
    return { ...lay, xf, out };
  });
}

describe('the pictures that introduce and name the set: no drum is hidden', () => {
  it('in the front elevation the three drums’ drawn widths never overlap (belly, rim and lug plates)', () => {
    const span = (d: typeof CONGA) => [d.c.x - Math.max(M.bellyR(d.R), d.R + d.rim.t), d.c.x + Math.max(M.bellyR(d.R), d.R + d.rim.t)];
    for (let i = 0; i < SET.length - 1; i++) {
      const [, a1] = span(SET[i]);
      const [b0] = span(SET[i + 1]);
      assert.ok(b0 - a1 >= M.CONGA_DIMS.gap.mm - 1e-6, `${SET[i].id}–${SET[i + 1].id}: ${(b0 - a1).toFixed(1)} mm apart`);
    }
  });
  it('every drum answers for its own silhouette in the front view (nothing drawn over it), both setups', () => {
    for (const variant of VARIANTS)
      for (const d of SET) {
        // the rim, the belly's edge, the lower shell — away from the stand legs' lines
        for (const [u, v] of [[d.c.x - d.R * 0.6, d.headY - 4], [d.c.x - M.bellyR(d.R) + 6, d.headY + 0.33 * (d.bottomY - d.headY)], [d.c.x - d.R * 0.6, -120]] as const) {
          const hit = A.congaHitTest('side', variant, u, v, 0);
          assert.ok(hit && hit.startsWith(`${d.id}.`), `${variant} ${d.id} at ${Math.round(u)},${Math.round(v)}: ${hit}`);
        }
      }
  });
  it('from above the three heads (with their lug tabs) stand apart', () => {
    for (let i = 0; i < SET.length - 1; i++) {
      const a = SET[i];
      const b = SET[i + 1];
      assert.ok(b.c.x - a.c.x > a.R + a.rim.t + b.R + b.rim.t + 20, `${a.id}–${b.id}`);
      const mid = (a.c.x + a.R + a.rim.t + b.c.x - b.R - b.rim.t) / 2;
      assert.equal(A.congaHitTest('top', 'floor', mid, 0, 0), null, 'a clear gap between the rims at the row’s line');
    }
  });
  it('the three names are kept in every picture that introduces the set, each in its own place, at 9 pt or more', () => {
    for (const variant of VARIANTS)
      for (const view of VIEWS)
        for (const lay of layouts(variant, view)) {
          const ids = lay.out.map((l) => l.id);
          for (const d of SET) assert.ok(ids.includes(d.id), `${variant} ${view} ${lay.where}: ${d.id} kept (${ids.join(', ')})`);
          for (const l of lay.out.filter((q) => SET.some((d) => d.id === q.id))) {
            const r = labelRect(l, lay.xf, 1, lay.w);
            assert.ok((r.y1 - r.y0) / 1.25 >= 9, `${l.text}: ${((r.y1 - r.y0) / 1.25).toFixed(1)} pt`);
            assert.equal(l.text, SET.find((d) => d.id === l.id)!.short, 'the full name, never a cut one');
          }
        }
  });
  it('every name’s leader lands on its own drum, and no two leaders cross', () => {
    for (const variant of VARIANTS)
      for (const view of VIEWS)
        for (const lay of layouts(variant, view)) {
          const lines: { id: string; ln: { x1: number; y1: number; x2: number; y2: number } }[] = [];
          for (const l of lay.out) {
            const own = A.congaLabels(view, variant).find((q: Lbl) => q.id === l.id) as Lbl;
            const anchor = l.leader ?? own.at;
            if (SET.some((d) => d.id === l.id)) {
              assert.ok(anchor, `${l.id} names its drum`);
              const hit = A.congaHitTest(view, variant, anchor!.u, anchor!.v, 0);
              assert.ok(hit && hit.startsWith(`${l.id}.`), `${variant} ${view} ${lay.where}: ${l.id}'s leader lands on ${hit}`);
            }
            if (l.leader) {
              const ln = leaderLine(labelRect(l, lay.xf, 1, lay.w), lay.xf, l.leader);
              if (ln) lines.push({ id: l.id, ln });
            }
          }
          for (const [i, a] of lines.entries()) for (const b of lines.slice(i + 1)) assert.equal(segsCross(a.ln, b.ln), false, `${variant} ${view} ${lay.where}: ${a.id} × ${b.id}`);
        }
  });
  it('no drum name sits on a drum (the words in clear space)', () => {
    for (const variant of VARIANTS)
      for (const view of VIEWS)
        for (const lay of layouts(variant, view))
          for (const l of lay.out) {
            const r = labelRect(l, lay.xf, 1, lay.w);
            for (let i = 0; i <= 6; i++)
              for (let j = 0; j <= 2; j++) {
                const u = (r.x0 + ((r.x1 - r.x0) * i) / 6 - lay.xf.ox) / lay.xf.s;
                const v = (r.y0 + ((r.y1 - r.y0) * j) / 2 - lay.xf.oy) / lay.xf.s;
                assert.equal(A.congaHitTest(view, variant, u, v, 0), null, `${variant} ${view} ${lay.where}: "${l.text}" over the drawing`);
              }
          }
  });
});

describe('a tap names the right drum', () => {
  for (const variant of VARIANTS)
    it(`${variant}: each head and shell in the front view, each head from above`, () => {
      for (const d of SET) {
        assert.equal(A.congaHitTest('side', variant, d.c.x + d.R * 0.5, d.headY - 4, 0), `${d.id}.head`);
        assert.equal(A.congaHitTest('side', variant, d.c.x - d.R * 0.5, -400, 0), `${d.id}.shell`);
        assert.equal(A.congaHitTest('top', variant, d.c.x, d.c.z, 0), `${d.id}.head`);
        assert.equal(A.congaHitTest('top', variant, d.c.x + d.R * 0.9, d.c.z - d.R * 0.3, 0), `${d.id}.head`);
      }
      if (variant === 'raised') for (const d of SET) for (const [i, l] of G.standLegs(d).entries()) assert.equal(A.congaHitTest('top', variant, l.foot.x, l.foot.z, 0), `${d.id}.leg${i + 1}`);
    });
});

describe('the starting points: legal starts and an honest record', () => {
  const hands = L.model.envelopes.find((e: { id: string }) => e.id === 'env.hands')!.shape;
  it('every zone starts outside the player’s hands, over the drum it names', () => {
    for (const z of L.zones) {
      assert.ok(sdf(hands, z.start.p) > 0, `${z.id} starts in the hands`);
      const own = SET.find((d) => z.refSurface === d.id);
      if (own) {
        const nearest = [...SET].sort((a, b) => Math.abs(a.c.x - z.start.p.x) - Math.abs(b.c.x - z.start.p.x))[0];
        assert.equal(nearest.id, own.id, `${z.id} over its own drum`);
        assert.ok(Math.abs(z.start.p.x - own.c.x) <= own.R, `${z.id} within its head`);
      }
    }
    assert.equal(L.zones.find((z: { id: string }) => z.id === 'cg.bottom')!.start.p.x, TUMBA.c.x, 'the bottom mic in front of the tumba');
  });
  it('one per drum and one clip per drum, for all three; a mic over the set and a matched pair over it', () => {
    const ids = L.zones.map((z: { id: string }) => z.id).sort();
    assert.deepEqual(ids, ['cg.bottom', 'cg.clip.conga', 'cg.clip.quinto', 'cg.clip.tumba', 'cg.conga', 'cg.pair', 'cg.quinto', 'cg.shared', 'cg.tumba']);
    const pair = L.hand.pairs.find((p: { id: string }) => p.id === 'overset')!;
    assert.ok(pair.A.pose.p.x < 0 && pair.B.pose.p.x > 0, 'one mic each side of the conga');
    assert.ok(Math.abs(pair.A.pose.p.x - (TUMBA.c.x + CONGA.c.x) / 2) < 1e-9 && Math.abs(pair.B.pose.p.x - (CONGA.c.x + QUINTO.c.x) / 2) < 1e-9, 'each over a gap, equidistant from the drums either side');
  });
  it('the record: a pair’s source extended to three drums is the lab’s TRIAL, with its reason; a drum-by-drum source stays sourced', () => {
    const kind = (id: string) => L.zones.find((z: { id: string }) => z.id === id)!.kind;
    for (const id of ['cg.shared', 'cg.pair', 'cg.clip.quinto']) assert.equal(kind(id), 'trial', id);
    for (const id of ['cg.quinto', 'cg.conga', 'cg.tumba', 'cg.clip.conga', 'cg.clip.tumba', 'cg.bottom']) assert.equal(kind(id), 'sourced', id);
    for (const z of L.zones.filter((q: { kind: string }) => q.kind === 'trial')) assert.match(JSON.stringify([z.bandProv, z.radial?.prov, z.box?.prov]), /lab’s (extension|drawing)/, z.id);
  });
});

describe('the stands and the hands', () => {
  const legs = SET.flatMap((d) => G.standLegs(d).map((l: { top: object; foot: object }, i: number) => ({ d, i, ...l })));
  const at = (l: { top: { x: number; y: number; z: number }; foot: { x: number; y: number; z: number } }, t: number) => ({ x: l.top.x + (l.foot.x - l.top.x) * t, y: l.top.y + (l.foot.y - l.top.y) * t, z: l.top.z + (l.foot.z - l.top.z) * t });
  it('raised: no stand leg comes near another drum’s leg', () => {
    for (const a of legs)
      for (const b of legs) {
        if (a.d === b.d) continue;
        let m = Infinity;
        for (let s = 0; s <= 40; s++) for (let t = 0; t <= 40; t++) {
          const p = at(a, s / 40);
          const q = at(b, t / 40);
          m = Math.min(m, Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z));
        }
        assert.ok(m > 2 * G.LEG_R + 20, `${a.d.id}.leg${a.i + 1} × ${b.d.id}.leg${b.i + 1}: ${m.toFixed(0)} mm`);
      }
  });
  it('raised: no leg runs through another drum’s shell, and none stands in front of the tumba’s opening', () => {
    const shells = L.model.parts.filter((p: { id: string }) => /\.shell$/.test(p.id));
    for (const l of legs)
      for (const sh of shells) {
        if (sh.id.startsWith(`${l.d.id}.`)) continue;
        for (let t = 0; t <= 40; t++) assert.ok(sdf(sh.solid, at(l, t / 40)) > G.LEG_R, `${l.d.id}.leg${l.i + 1} in ${sh.id}`);
      }
    for (const l of G.standLegs(TUMBA)) assert.ok(Math.abs(l.foot.x - TUMBA.c.x) > 100 || l.foot.z < TUMBA.c.z, 'no tumba leg straight in front');
  });
  it('the hands cover the player’s half of all three heads; the audience half stays open', () => {
    for (const d of SET) {
      assert.ok(sdf(G.HANDS_BOX, { x: d.c.x, y: d.headY - 60, z: d.c.z - d.R * 0.5 }) < 0, `${d.id}: player’s half`);
      assert.ok(sdf(G.HANDS_BOX, { x: d.c.x, y: d.headY - 60, z: d.c.z + d.R * 0.5 }) > 0, `${d.id}: audience half`);
    }
  });
});

describe('the band plan draws the set turned into its own frame', () => {
  it('the plan footprint: narrow toward the audience (u), the three drums across (v)', () => {
    for (const variant of VARIANTS) {
      const a = turnArtPlan(modelArtPlan(L.model, variant, false), L.hand.plan.turn);
      const r = a.foots[0].r;
      assert.ok(r.v1 - r.v0 > 2 * (r.u1 - r.u0), `${variant}: ${JSON.stringify(r)}`);
      assert.ok(r.v0 < -QUINTO.c.x && r.v1 > -TUMBA.c.x, 'the quinto toward −v (the player’s left), the tumba toward +v');
    }
  });
  it('a lesson that asks for no turn keeps its plan footprint untouched', () => {
    const a = modelArtPlan(L.model, 'floor', false);
    assert.equal(turnArtPlan(a, undefined), a);
  });
});

/* Learner-facing strings (the internal record is skipped, as in mikingHandDrums). */
const INTERNAL = new Set(['src', 'quote', 'prov', 'bandProv', 'strikeSrc', 'unknowns', 'examples', 'kind', 'id', 'partId', 'refSurface', 'line', 'source', 'drum', 'typeId', 'worked']);
function strings(v: unknown, out: string[], seen = new Set<unknown>()): void {
  if (typeof v === 'string') out.push(v);
  else if (v && typeof v === 'object') {
    if (seen.has(v)) return;
    seen.add(v);
    if (Array.isArray(v)) v.forEach((x) => strings(x, out, seen));
    else for (const [k, x] of Object.entries(v)) if (!INTERNAL.has(k)) strings(x, out, seen);
  }
}
describe('the words', () => {
  it('no learner text still speaks of a pair of drums (mic pairs stay)', () => {
    const out: string[] = [];
    strings(L, out);
    const PAIR_OF_DRUMS = /\b(pair of (congas|drums|hand drums)|conga pair|the pair['’]s|for the pair|both drums|both heads|the two drums|two congas|either drum|the other drum\b|the other one|blended pair|conga behind|behind the tumba|hidden behind)\b/i;
    assert.deepEqual(out.filter((t) => PAIR_OF_DRUMS.test(t)), []);
    assert.ok(out.some((t) => /set of three/.test(t)));
    assert.match(L.subtitle, /Quinto, conga and tumba/);
  });
  it('the art names the three drums, nothing “behind”', () => {
    for (const variant of VARIANTS)
      for (const view of VIEWS) {
        const t = A.congaLabels(view, variant).map((l: Lbl) => l.text);
        for (const n of ['TUMBA', 'CONGA', 'QUINTO']) assert.ok(t.includes(n), `${variant} ${view} ${n}`);
        assert.doesNotMatch(t.join(' '), /BEHIND|IN FRONT/);
      }
  });
});
