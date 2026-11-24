/**
 * FIGURE V2 — WAVE 3: THE CAST (must-do D78; owner 2026-11-23, quick pick
 * "Small cast": not everyone is the drummer — about five people, women and men,
 * different hair, skin tones and shirt colors, each role always the same
 * person; the drummer stays exactly as approved). Checked here:
 *   • the cast: five people, the drummer first and unchanged (his look IS the
 *     approved materials, his head the approved head), women and men, every
 *     hair style, NO gray hair (owner: "no gray hair"), five skin tone sets
 *     and five shirts;
 *   • the role table: one fixed table (role key → person), every role resolves,
 *     a talker's id finds its role, an unknown id the host's;
 *   • the drummer's plan is unchanged by the cast's head options;
 *   • the heads: the bob hides the ear, every hair is larger than the crop, a
 *     talker's head is drawn with the mouth on the lip point;
 *   • the hands at rest: ONE silhouette for the back of the hand and fingers,
 *     the thumb painted first with only its edge drawn; on a desk the little
 *     finger with the hand and at most two fingertips beyond it; the fist round
 *     a mic is the approved fist from above, placed by its handle;
 *   • the 3a switches exist and are OFF (the owner sees the cast first).
 * Reads normalise CRLF.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, it } from 'node:test';

const R = <T>(m: T): T => (m as { default?: T }).default ?? m;
const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const FV = 'src/screens/lab/miking/lessons/shared/figureV2';

const CAST = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/cast.ts'));
const LOOK = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/look.tsx'));
const PAL = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/palette.ts'));
const SP = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/sidePlan.ts'));
const AH = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/authoredHands.ts'));
const KD = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/kitDrummerV2.tsx'));
const CFG = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/figureV2Config.ts'));
const VP = R(await import('../src/screens/lab/miking/lessons/shared/voice/voicePose.ts'));
const GE = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/geom.ts'));
const BA = R(await import('../src/screens/lab/miking/lessons/shared/broadcast/BroadcastArt.tsx'));
const TK = R(await import('../src/screens/lab/miking/lessons/shared/broadcast/talkerPose.ts'));
const PV = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/personV2.tsx'));
const PF = R(await import('../src/screens/lab/miking/lessons/shared/players/PlayerFigure.tsx'));
const TOP = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/topPerson.ts'));

/* (the wave 1 counter: function components expanded to the Skia stand-ins, a minimal hook dispatcher) */
type El = { type: unknown; props: { children?: unknown; [k: string]: unknown } };
const React = createRequire(import.meta.url)('react');
const internals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
const fnOf = (e: El) => (typeof e.type === 'function' ? e.type : (e.type as { type?: unknown })?.type) as ((p: object) => unknown) | undefined;
let ctxValue: unknown;
function expand(node: unknown, out: El[] = []): El[] {
  if (Array.isArray(node)) {
    for (const n of node) expand(n, out);
    return out;
  }
  if (!node || typeof node !== 'object' || !('props' in (node as object))) return out;
  const e = node as El;
  const f = fnOf(e);
  const name = (f as { name?: unknown } | undefined)?.name;
  if (f && typeof name === 'string' && name !== 'stub') {
    const prev = internals.H;
    internals.H = { useMemo: (g: () => unknown) => g(), useCallback: (g: unknown) => g, useRef: (v: unknown) => ({ current: v }), useContext: () => ctxValue };
    try {
      expand(f({ ...e.props }), out);
    } finally {
      internals.H = prev;
    }
    return out;
  }
  out.push(e);
  expand(e.props.children, out);
  if (e.props.layer) expand(e.props.layer, out);
  return out;
}
const costOf = (node: unknown, scale?: { ptPerMm: number | null }) => {
  ctxValue = scale;
  const els = expand(node);
  ctxValue = undefined;
  return { nodes: els.length, blurs: els.filter((e) => 'blur' in e.props && 'style' in e.props).length };
};

const area = (q: { u: number; v: number }[]) => Math.abs(q.reduce((s, p, i) => s + p.u * q[(i + 1) % q.length].v - q[(i + 1) % q.length].u * p.v, 0)) / 2;

describe('figure V2 wave 3 — the cast', () => {
  it('five people; the drummer first, wearing exactly the approved materials and head', () => {
    const ids = Object.keys(CAST.CAST);
    assert.deepEqual(ids, ['drummer', 'ana', 'ruth', 'kofi', 'mei']);
    const d = CAST.CAST.drummer;
    assert.equal(d.look, LOOK.DRUMMER_LOOK);
    assert.equal(d.look.MAT, PAL.MAT);
    assert.equal(d.look.HEAD_SKIN, PAL.HEAD_SKIN);
    assert.equal(d.look.LIP, PAL.LIP);
    assert.deepEqual(d.head, SP.DRUMMER_HEAD);
  });
  it('women and men, every hair style, no gray hair, distinct skins and shirts — and no hats, glasses or jewelry to draw', () => {
    const all = Object.values(CAST.CAST) as { woman: boolean; head: { hair: string }; look: { MAT: { skin: { form: string[] }; shirt: { form: string[] }; hair: { form: string[] } } } }[];
    assert.ok(all.filter((m) => m.woman).length >= 2 && all.filter((m) => !m.woman).length >= 2);
    assert.deepEqual(new Set(all.map((m) => m.head.hair)), new Set(['short', 'crop', 'bob', 'pony', 'bun']));
    assert.equal(new Set(all.map((m) => m.look.MAT.skin.form[1])).size, 5);
    assert.equal(new Set(all.map((m) => m.look.MAT.shirt.form[1])).size, 5);
    // NO GRAY HAIR (owner 2026-11-23: "no gray hair"): no hair tone is a gray —
    // low saturation at mid-to-high lightness (HSL)
    for (const m of all)
      for (const h of m.look.MAT.hair.form) {
        const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
        const mx = Math.max(r, g, b);
        const mn = Math.min(r, g, b);
        const L = (mx + mn) / 2;
        const S = mx === mn ? 0 : (mx - mn) / (1 - Math.abs(2 * L - 1));
        assert.ok(!(L >= 0.4 && S < 0.18), `hair tone ${h} reads as gray`);
      }
    const src = read(`${FV}/cast.ts`);
    // (the code, not its comments: nothing worn on the head, face or ears is drawn)
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    assert.doesNotMatch(code, /\b(hats?|glasses|earrings?|necklace|jewel\w*)\b/i);
  });
  it('each head ramp only darkens (no ring), each skin lit side lighter than its shadow', () => {
    for (const m of Object.values(CAST.CAST) as { look: { HEAD_SKIN: { form: string[] }; MAT: { skin: { form: string[] } } } }[]) {
      const lum = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).reduce((s, v) => s + v, 0);
      const f = m.look.HEAD_SKIN.form.map(lum);
      for (let i = 1; i < f.length; i++) assert.ok(f[i] <= f[i - 1], 'head ramp darkens');
      assert.ok(lum(m.look.MAT.skin.form[0]) > lum(m.look.MAT.skin.form[3]));
    }
  });
});

describe('figure V2 wave 3 — the role table', () => {
  const EXPECTED = ['kit.drummer', 'voice.singer', 'talker.host', 'talker.hostB', 'talker.guest', 'talker.asker', 'talker.analyst', 'talker.reporter', 'talker.wearer', 'presenter', 'talker.p1', 'talker.p3', 'talker.p4', 'lectern.presenter'];
  it('is one fixed table, every role a cast member, the drummer playing the kit', () => {
    assert.deepEqual(Object.keys(CAST.ROLES), EXPECTED);
    for (const k of EXPECTED) assert.ok(CAST.castFor(k), k);
    assert.equal(CAST.castFor('kit.drummer').id, 'drummer');
    // never random, never by render order: the same answer every time
    for (const k of EXPECTED) assert.equal(CAST.castFor(k), CAST.castFor(k));
  });
  it('a talker id finds its role; an id not in the table is the host', () => {
    assert.equal(CAST.talkerRole('hostB'), 'talker.hostB');
    assert.equal(CAST.talkerRole('reporter'), 'talker.reporter');
    assert.equal(CAST.talkerRole('anchor'), 'talker.host');
  });
});

describe('figure V2 wave 3 — the drummer is unchanged', () => {
  it('his plan with the cast options at their defaults is his plan', () => {
    const a = KD.kitDrummerPlan();
    const h = SP.headPlan({ u: 0, v: 0 }, 110, 1, 0, { u: 40, v: 200 }, { u: -40, v: 210 });
    const h2 = SP.headPlan({ u: 0, v: 0 }, 110, 1, 0, { u: 40, v: 200 }, { u: -40, v: 210 }, SP.DRUMMER_HEAD);
    assert.deepEqual(h2, h);
    assert.equal(a.head.earShows, true);
  });
  it('the drummer’s head source keeps its arrays (only new code beside them)', () => {
    const src = read(`${FV}/sidePlan.ts`);
    assert.match(src, /short: \{ outer: HAIR_OUTER, edge: HAIR_EDGE, clumps: CLUMPS, earShows: true/);
    assert.match(src, /lid: M\(style\.face === 'drummer' \? LID : LID_OPEN\)/);
  });
});

describe('figure V2 wave 3 — heads and hands', () => {
  const pose = VP.SINGER_SIDE;
  const plan = (id: string) => SP.sidePlan(pose, { head: CAST.CAST[id].head, lip: { u: 0, v: 0 }, restR: 'restSide', restL: 'restSide' });
  it('the bob covers the ear; every other style shows it; every hair is larger than the crop', () => {
    assert.equal(plan('ruth').head.earShows, false);
    for (const id of ['drummer', 'ana', 'kofi', 'mei']) assert.equal(plan(id).head.earShows, true, id);
    const crop = area(plan('kofi').head.hair);
    for (const id of ['drummer', 'ana', 'ruth', 'mei']) assert.ok(area(plan(id).head.hair) > crop, id);
  });
  it('a talker’s head is drawn with the front of the mouth on the lip point', () => {
    const p = plan('ana');
    const m = p.head.mouth[0];
    assert.ok(Math.hypot(m.u, m.v) < 0.5, `mouth front at ${m.u},${m.v}`);
  });
  it('restSide (round 3): the back of the hand, one contour; the thumb on the front edge separated from the index by a V; three finger creases only; nothing floating', () => {
    const a = AH.handArt('restSide');
    // one shape: no per-finger outline, no separate thumb, no closed arc at a finger root
    assert.deepEqual(a.parts.map((p: { name: string }) => p.name), ['hand']);
    assert.equal(a.parts.filter((p: { kind: string }) => p.kind === 'digit').length, 0);
    assert.equal(a.parts.some((p: { edge?: unknown }) => p.edge), false);
    assert.equal(a.nails.length, 0);
    const hand = a.parts[0].outline as { u: number; v: number }[];
    const tips = Math.max(...hand.map((p) => p.u));
    // the thumb: its tip 25–40 mm above the fingertips, on the front edge (beyond the index's front)
    const t = a.thumbTip;
    assert.ok(tips - t.u >= 25 && tips - t.u <= 40, `thumb tip ${(tips - t.u).toFixed(1)} mm above the fingertips`);
    // the V: between the web and the thumb tip, a point between the index front and the thumb is OUTSIDE the hand
    const w = a.thumbWeb;
    for (const x of [w.u + 20, w.u + 35, t.u - 8]) {
      const front = Math.max(...hand.filter((p) => p.u <= x + 4 && p.u >= x - 4 && p.v < w.v + 2).map((p) => p.v));
      const thumbIn = Math.min(...hand.filter((p) => p.u <= x + 6 && p.u >= x - 6 && p.v > w.v + 2).map((p) => p.v));
      const mid = { u: x, v: (front + thumbIn) / 2 };
      assert.ok(thumbIn > front + 1.5, `a gap at x=${x}`);
      assert.equal(GE.inPoly(mid, hand), false, `the V shows background at x=${x}`);
    }
    // three finger gaps only, and no other mark (no crease floats in the hand): each gap is widest at the
    // notch between two fingertips and narrows to nothing toward the knuckles, ending about two thirds of
    // the way there (owner round 4: "the gap between two fingers is most visible AT THE TIPS")
    assert.equal(a.creases.length, 0);
    assert.equal(a.gaps.length, 3);
    for (const g of a.gaps as { u: number; v: number }[][]) {
      const tipEnd = Math.max(...g.map((q) => q.u));
      const upEnd = Math.min(...g.map((q) => q.u));
      const widthNear = (x: number) => {
        const vs = g.filter((q) => Math.abs(q.u - x) < 1.5).map((q) => q.v);
        return vs.length > 1 ? Math.max(...vs) - Math.min(...vs) : 0;
      };
      assert.ok(widthNear(tipEnd) > widthNear((tipEnd + upEnd) / 2), 'strongest at the tip notch');
      assert.equal(widthNear(upEnd), 0, 'fading to nothing toward the knuckle');
      // the notch is ON the tips' edge: the wide end lies at the hand's outline (within 2 mm outside it)
      const notch = { u: tipEnd - 1.2, v: g.reduce((s2, q) => s2 + q.v, 0) / g.length };
      assert.ok(hand.some((q) => Math.hypot(q.u - notch.u, q.v - notch.v) < 2.5), 'starts in a notch between two fingertips');
      const len = tipEnd - upEnd;
      assert.ok(upEnd > 92 && len > 22, `runs up toward the knuckles about two thirds of the way (len ${len.toFixed(0)})`);
      for (const q of g) assert.ok(q.v < w.v, 'never on the thumb or the web');
    }
    // the skin runs on up under the cuff (no top edge across the wrist)
    assert.ok(Math.min(...hand.map((q) => q.u)) <= -20);
    // the wrist narrower than the hand at the knuckles
    const widthAt = (x: number) => {
      const ys: number[] = [];
      for (let i = 0; i < hand.length; i++) {
        const p = hand[i];
        const q = hand[(i + 1) % hand.length];
        if ((p.u - x) * (q.u - x) <= 0 && p.u !== q.u) ys.push(p.v + ((x - p.u) / (q.u - p.u)) * (q.v - p.v));
      }
      return Math.max(...ys) - Math.min(...ys);
    };
    assert.ok(widthAt(2) < widthAt(90) - 15, `wrist ${widthAt(2).toFixed(0)} vs knuckles ${widthAt(90).toFixed(0)}`);
  });
  it('restFlat (the NEAR desk hand, the true view): its little-finger side — no thumb; the little finger nearest and shortest; the others stepping forward; rounded pads; the arch', () => {
    const a = AH.handArt('restFlat');
    assert.equal(a.thumbTip, null, 'no thumb on the near side');
    assert.equal(a.parts.some((p: { digit?: string }) => p.digit === 'thumb'), false);
    const digits = a.parts.filter((p: { kind: string }) => p.kind === 'digit');
    assert.deepEqual(digits.map((p: { digit: string }) => p.digit), ['middle', 'ring', 'little'], 'far to near: the little finger painted last (nearest)');
    const tip = (d: { chain: { pts: { u: number }[]; r: number[] } }) => d.chain.pts[d.chain.pts.length - 1].u + d.chain.r[d.chain.r.length - 1];
    const [mid, ring, little] = digits.map(tip);
    assert.ok(little < ring && ring < mid, `tips step forward: little ${little}, ring ${ring}, middle ${mid}`);
    const knuckleToTip = little - digits[2].chain.pts[0].u;
    assert.ok(knuckleToTip >= 55 && knuckleToTip <= 68, `little finger knuckle to tip ${knuckleToTip} mm`);
    // rounded pads with depth (≈ 12–14 mm at the last joint)
    for (const d of digits) assert.ok(2 * d.chain.r[d.chain.r.length - 1] >= 12, `${d.digit} pad depth`);
    // (owner "the wrist looks odd") the top contour from the cuff to the knuckle crest is ONE smooth line: no step
    // larger than 2 mm between neighboring points; the wrist the narrowest, the crest above it
    const h = a.parts[3].outline as { u: number; v: number }[];
    const crestI = h.findIndex((q) => q.u >= 86);
    for (let i = 1; i <= crestI; i++) assert.ok(Math.abs(h[i].v - h[i - 1].v) <= 2, `step at ${h[i - 1].u}→${h[i].u}: ${(h[i].v - h[i - 1].v).toFixed(1)} mm`);
    const top = (x: number) => Math.min(...h.filter((q) => Math.abs(q.u - x) < 6).map((q) => q.v));
    assert.ok(top(84) < top(12), 'the knuckle crest above the wrist');
    assert.ok(a.contact && a.contact.length >= 3, 'contact shadows under the heel and the tips');
  });
  it('the FAR desk hand is the thumb-side view (the thumb beside the index on the viewer’s side); from above the thumb lies 20–35° off the index with a soft web', () => {
    const pose = BA.talkerPose('side', TK.HOST);
    const plan = PV.personPlan(pose, CAST.CAST.kofi, { lip: { u: 0, v: 0 }, rest: 'restFlat', seatV: 0 });
    assert.equal(plan.arms.near.placed.art.view, 'restFlat');
    assert.equal(plan.arms.far.placed.art.view, 'restFlatThumb');
    assert.ok(AH.handArt('restFlatThumb').thumbTip);
    const t = AH.handArt('restTop');
    const ang = (Math.atan2(t.thumbTip.v - t.thumbWeb.v, t.thumbTip.u - t.thumbWeb.u) * 180) / Math.PI;
    assert.ok(ang >= 20 && ang <= 35, `thumb ${ang.toFixed(1)}° off the index`);
    assert.equal(t.gaps.length, 3);
    assert.equal(t.nails.length, 4, 'a faint nail on each fingertip');
    // the thumb's tip about level with the index's first joint (not past the knuckles' far side by much)
    assert.ok(t.thumbTip.u > 110 && t.thumbTip.u < 135);
  });
  it('the under-cuff skin of a desk hand lies inside the cuff and the sleeve (never a block of its own); no separate wrist piece', () => {
    const pose = BA.talkerPose('side', TK.HOST);
    for (const id of ['drummer', 'ana', 'ruth', 'kofi', 'mei'] as const) {
      const plan = PV.personPlan(pose, CAST.CAST[id], { lip: { u: 0, v: 0 }, rest: 'restFlat', seatV: 0 });
      for (const arm of [plan.arms.near, plan.arms.far]) {
        const art = arm.placed.art;
        const hand = art.parts[art.parts.length - 1].outline as { u: number; v: number }[];
        const under = hand.filter((q) => q.u < -17).map((q) => arm.placed.at(q));
        assert.ok(under.length > 0);
        for (const q of under) assert.ok(GE.inPoly(q, arm.cuff) || GE.inPoly(q, arm.foreSleeve), `${id} ${art.view}: ${q.u.toFixed(0)},${q.v.toFixed(0)} outside the cuff`);
      }
    }
    assert.match(read(`${FV}/paths.ts`), /a\.away \|\| FLAT_VIEWS\.has\(a\.placed\.art\.view\) \? null/);
  });
  it('a desk hand lies LEVEL on the desk: no fingertip sunk into it, none hovering', () => {
    const pose = BA.talkerPose('side', TK.HOST);
    for (const id of ['kofi', 'ruth'] as const) {
      const plan = PV.personPlan(pose, CAST.CAST[id], { lip: { u: 0, v: 0 }, rest: 'restFlat', seatV: 0 });
      const vs = plan.arms.near.placed.parts.flatMap((p: { placed: { v: number }[] }) => p.placed.map((q) => q.v));
      const bottom = Math.max(...vs);
      assert.ok(Math.abs(bottom - TK.DESK_TOP_Y) < 3, `${id}: the hand's underside at ${bottom.toFixed(1)}, the desk at ${TK.DESK_TOP_Y}`);
    }
  });
  it('holdSide is the approved fist from above, placed by the handle', () => {
    const h = AH.handArt('holdSide');
    const t = AH.handArt('backTop');
    assert.deepEqual(h.parts, t.parts);
    assert.ok(Math.abs(h.stickLocal - Math.PI / 2) < 1e-9);
    const placed = AH.placeHold({ u: 0, v: 0 }, { u: -100, v: 30 }, { u: 100, v: -30 }, { u: -200, v: 150 });
    assert.ok(Math.hypot(placed.wrist.u + 200, placed.wrist.v - 150) < Math.hypot(placed.knuckle.u + 200, placed.knuckle.v - 150), 'the wrist toward the elbow');
  });
  it('the hanging hands: thumb forward (toward the face) and hand below the wrist', () => {
    const p = plan('ana');
    for (const a of [p.arms.near, p.arms.far]) {
      assert.ok(a.placed, 'a rest hand is drawn');
      const th = a.placed.thumbTip;
      const kn = a.placed.knuckle;
      assert.ok(kn.v > a.placed.wrist.v + 60, 'the hand hangs below the wrist');
      assert.ok(th.u > kn.u - 5, 'the thumb on the face side');
    }
    // the hand starts out of the cuff: its wrist at the sleeve's wrist
    assert.ok(GE.dist(p.arms.near.placed.wrist, p.arms.near.wrist) < 1);
  });
});

describe('figure V2 wave 3 — bodies (round 2)', () => {
  const pose = VP.SINGER_SIDE;
  const plan = (id: string) => SP.sidePlan(pose, { head: CAST.CAST[id].head, lip: { u: 0, v: 0 }, restR: 'restSide', restL: 'restSide', body: CAST.CAST[id].body });
  it('every standing cast member has a build; the builds differ; dress varies (tucked and not, crew and collar)', () => {
    const bodies = Object.values(CAST.CAST).map((m: { body?: unknown }) => m.body) as { tucked: boolean; collar: string }[];
    assert.ok(bodies.every(Boolean));
    assert.equal(new Set(bodies.map((b) => JSON.stringify(b))).size, 5);
    assert.ok(bodies.some((b) => b.tucked) && bodies.some((b) => !b.tucked));
    assert.ok(bodies.some((b) => b.collar === 'crew') && bodies.some((b) => b.collar === 'shirt'));
  });
  it('the torso has depth: chest deeper than the waist; the front a gentle slope (no rounded bulge: owner "make the men’s chest a little thinner")', () => {
    for (const id of ['drummer', 'kofi', 'ana', 'ruth', 'mei']) {
      const p = plan(id);
      const depth = (t: number) => {
        const a = p.along(t, 0);
        const ys = p.shirt.filter((q: { v: number }) => Math.abs(q.v - a.v) < 40).map((q: { u: number }) => q.u);
        return Math.max(...ys) - Math.min(...ys);
      };
      assert.ok(depth(0.72) > depth(0.32) + 15, `${id}: chest ${depth(0.72).toFixed(0)} vs waist ${depth(0.32).toFixed(0)}`);
    }
    const src = read(`${FV}/sidePlan.ts`);
    const front = src.match(/const front: \[number, number\]\[\] = \[\[0\.965, 60\], (.*?), \.\.\.lower\]/)![1];
    const fw = [...front.matchAll(/\[([\d.]+), ([\d.]+)/g)].map((m) => Number(m[2]));
    // (the base front, before builds: from the collarbone down it never swells more than ~6 mm past a straight slope)
    assert.ok(Math.max(...fw) - fw[0] <= 22 && Math.max(...fw) <= 112, `front ${fw.join(',')}`);
  });
  it('both legs show (the far foot set back), the arm bends a little at the elbow, one sleeve, the head level', () => {
    const p = plan('ana');
    assert.ok(p.shoes.near.ball.u - p.shoes.far.ball.u > 60);
    const a = p.arms.near;
    const ang = (x: { u: number; v: number }, y: { u: number; v: number }) => Math.atan2(y.v - x.v, y.u - x.u);
    const bend = Math.abs(((ang(a.shoulder, a.elbow) - ang(a.elbow, a.wrist)) * 180) / Math.PI);
    assert.ok(bend >= 8 && bend <= 18, `elbow bend ${bend.toFixed(1)}°`);
    assert.equal(a.one, true);
    assert.equal(a.upper, a.foreSleeve);
    // the head level: no nod for a standing talker
    assert.ok(Math.abs(p.head.eyeC.v - p.head.chin.v + 100.5 * (114 / 110)) < 2);
  });
  it('proportions (reported): head about 1/7–1/7.5 of the height, legs about half, wrist near the hip joint, fingertips near mid-thigh', () => {
    const p = plan('kofi');
    const crown = Math.min(...p.head.skull.map((q: { v: number }) => q.v), ...p.head.hair.map((q: { v: number }) => q.v));
    const chin = p.head.chin.v + 13;
    const floor = VP.FLOOR_Y;
    const H = floor - crown;
    const head = chin - Math.min(...p.head.skull.map((q: { v: number }) => q.v));
    const hipJ = VP.SINGER_SIDE.hipR.v;
    const knee = VP.SINGER_SIDE.kneeR.v;
    const tip = Math.max(...p.arms.near.placed.parts.flatMap((q: { placed: { v: number }[] }) => q.placed.map((x) => x.v)));
    const r = { height: H, head, ratio: H / head, legs: (floor - hipJ) / H, wristBelowHip: p.arms.near.wrist.v - hipJ, tipVsMidThigh: tip - (hipJ + knee) / 2 };
    console.log('proportions', JSON.stringify(Object.fromEntries(Object.entries(r).map(([k, v]) => [k, Math.round(v * 100) / 100]))));
    assert.ok(r.ratio >= 6.8 && r.ratio <= 7.8);
    assert.ok(r.legs >= 0.47 && r.legs <= 0.55);
    assert.ok(Math.abs(r.wristBelowHip) < 110);
    assert.ok(Math.abs(r.tipVsMidThigh) < 90);
  });
});

describe('figure V2 wave 3 — the cost of one cast figure', () => {
  it('a standing cast member: lite (lesson size) no more than 1.5× the old figure’s nodes and no more blurs; full detail reported', () => {
    const pose = VP.SINGER_SIDE;
    const old = costOf([React.createElement(PF.PlayerBehind, { pose }), React.createElement(PF.PlayerInFront, { pose, hands: true })]);
    const el = React.createElement(PV.PersonSideV2, { pose, who: CAST.CAST.ana, opts: { lip: { u: 0, v: 0 }, rest: 'restSide' } });
    const lite = costOf(el, { ptPerMm: 0.13 });
    const full = costOf(el, { ptPerMm: 0.6 });
    const msg = `nodes/blurs — old ${old.nodes}/${old.blurs}, lite ${lite.nodes}/${lite.blurs}, full ${full.nodes}/${full.blurs}`;
    console.log('cost', msg);
    assert.ok(lite.nodes <= 1.5 * old.nodes && lite.blurs <= old.blurs, msg);
    assert.ok(full.nodes <= 800 && full.blurs <= 170, msg);
  });
});

describe('figure V2 wave 3a — kind A in the lessons (the switches, the lessons that opt in, from above, the cost)', () => {
  const L = 'src/screens/lab/miking/lessons';
  it('sideStanding and sideDeskTalker are ON (kinds A and C)', () => {
    assert.equal(CFG.figureV2On('sideStanding'), true);
    assert.equal(CFG.figureV2On('sideDeskTalker'), true);
    assert.equal(CFG.figureV2On('kitDrummer'), true);
    assert.equal(CFG.FIGURE_V2_READY, false);
  });
  it('E01 and E03 draw ALL their figures new (side, top, the air picture), and their labels keep off the new outline', () => {
    for (const d of ['e01LeadVocal', 'e03RapVocal']) {
      const src = read(`${L}/${d}/art.tsx`);
      assert.match(src, /const V2 = figureV2On\('sideStanding'\);/);
      assert.match(src, /const OPTS: VoiceArtOpts = \{ v2: V2,/);
      assert.match(src, /figureAt: voiceFigureAtFor\(OPTS\)/);
      assert.match(src, /makeVoiceSound\(\{\n\s+v2: V2,/);
    }
  });
  it('B06 and B07 draw every figure new: panelists (neighbors different people), the lectern presenter, the asker, the booth reader (the same person as the desk reader), headless steps, turned heads, cut-aways, label covers', () => {
    for (const d of ['b06Panels', 'b07Voiceover']) {
      const scene = read(`${L}/${d}/scene.tsx`);
      assert.match(scene, /export const V2 = figureV2On\('sideDeskTalker'\) && figureV2On\('sideStanding'\);/);
      for (const m of scene.match(/<SeatedTalker [^>]*\/>/g) ?? []) assert.match(m, /v2=\{v2\}/, m);
      assert.match(scene, /v2 = V2 \}: \{ view: ViewId; variant: VariantId;/);
      const pages = read(`${L}/${d}/pages.tsx`);
      assert.match(pages, /useTurnStep\(\{\n\s+v2: V2,/);
      assert.match(pages, /makeBroadcastSound\(\{\n\s+v2: V2,/);
    }
    const ids = ['p1', 'host', 'p3', 'p4'].map((id) => CAST.castFor(CAST.talkerRole(id)).id);
    for (let i = 1; i < ids.length; i++) assert.notEqual(ids[i], ids[i - 1], `panel neighbors ${ids[i - 1]} / ${ids[i]}`);
    assert.equal(CAST.castFor(CAST.talkerRole('asker')).id, 'ruth');
    assert.match(read(`${L}/b07Voiceover/scene.tsx`), /const BOOTH_OPTS: VoiceArtOpts = \{ v2: V2, who: 'talker\.host' \};/);
  });
  it('every other lesson keeps ALL its figures old for now (no lesson mixes the two looks)', () => {
    const files = ['b02NewsAnchor/scene.tsx', 'b02NewsAnchor/pages.tsx', 'b03FieldReporter/scene.tsx', 'b04BoomCamera/scene.tsx', 'b05Lavalier/scene.tsx', 'b09Commentators/scene.tsx', 'b10Sideline/scene.tsx', 'b11Athletes/scene.tsx', 'f09LocationSpeech/scene.tsx', 'f09LocationSpeech/pages.tsx', 'e07SingerInstrument/art.tsx'];
    for (const f of files) assert.doesNotMatch(read(`${L}/${f}`), /\bv2\b|figureV2On/, f);
    // (the shared drawings default to the old look; a lesson opts in at its call sites)
    assert.match(read(`${L}/shared/broadcast/BroadcastArt.tsx`), /leftHandIn = 0, v2 = false \}/);
  });
  it('from above: a standing singer shows no legs (under the shoulders, as the old figure); her ponytail lies behind the crown', () => {
    const TPn = PV;
    void TPn;
    const plan = TOP.personTopPlan(VP.SINGER_TOP, CAST.CAST.ana, {});
    const behind = plan.head.hair.map((q: { u: number }) => q.u);
    assert.ok(Math.min(...behind) < plan.head.c.u - 130, 'the tail lies behind the head');
    assert.equal(PV.personTopCovers(VP.SINGER_TOP, CAST.CAST.ana, {}, plan.shoes[0].sole[5].u, plan.shoes[0].sole[5].v, 0), false, 'no shoe drawn');
  });
  it('the cost from above: lite no more than 1.5× the old figure’s nodes and no more blurs', () => {
    const pose = VP.SINGER_TOP;
    const old = costOf([React.createElement(PF.PlayerBehind, { pose }), React.createElement(PF.PlayerInFront, { pose, hands: false })]);
    const el = React.createElement(PV.PersonTopV2, { pose, who: CAST.CAST.ana });
    const lite = costOf(el, { ptPerMm: 0.13 });
    const full = costOf(el, { ptPerMm: 0.6 });
    const msg = `top nodes/blurs — old ${old.nodes}/${old.blurs}, lite ${lite.nodes}/${lite.blurs}, full ${full.nodes}/${full.blurs}`;
    console.log('cost', msg);
    assert.ok(lite.nodes <= 1.5 * old.nodes && lite.blurs <= old.blurs, msg);
  });
});
describe('figure V2 wave 3a — kind A fixes (the level from each picture, the head at 45 pt, the cut-away)', () => {
  const L = 'src/screens/lab/miking/lessons';
  it('the voice pictures (air, cut-away) provide FigureScale from their own drawn scale', () => {
    const src = read(`${L}/shared/voice/VoiceSoundArt.tsx`);
    assert.match(src, /<FigureScale ptPerMm=\{xf\.s\}>\{children\}<\/FigureScale>/);
  });
  it('a head drawn 45 pt tall or more takes full detail even where the body is lite', () => {
    assert.equal(PV.FULL_HEAD_PT, 45);
    const pose = VP.SINGER_SIDE;
    const at = (s: number) => costOf(React.createElement(PV.PersonSideV2, { pose, who: CAST.CAST.ana, opts: { lip: { u: 0, v: 0 }, rest: 'restSide' } }), { ptPerMm: s });
    // (0.13 pt/mm: the head ≈ 31 pt — lite; 0.22 pt/mm: ≈ 52 pt — the body lite, the head full)
    const small = at(0.13);
    const mid = at(0.22);
    assert.equal(small.blurs, 0);
    assert.ok(mid.blurs > 0 && mid.nodes > small.nodes, `head full at 52 pt: ${small.nodes}/${small.blurs} → ${mid.nodes}/${mid.blurs}`);
    console.log('cost head-full lite body', `${mid.nodes}/${mid.blurs}`);
  });
  it('the cut-away: dressed as the cast member only where the lesson opted in; otherwise exactly as before', () => {
    const cut = read(`${L}/shared/voice/VoiceCutaway.tsx`);
    assert.match(cut, /export function VoiceCutaway\(\{ tint, who \}/);
    assert.match(cut, /<FigureMass path=\{A\.head\} tone="skin" contour=\{2\.6\} \/>/);
    const seq = read(`${L}/shared/voice/VoiceSoundArt.tsx`);
    assert.match(seq, /<VoiceCutaway tint=\{tint\} who=\{who\} \/>/);
    assert.match(read(`${L}/shared/voice/VoicePages.tsx`), /<VoiceSequence w=\{w\} h=\{h\} shown=\{st\.shown\} who=\{spec\.v2 \? castFor\('voice\.singer'\) : undefined\}/);
    // (the broadcast and location lessons' cut-aways pass nothing: old)
    assert.match(read(`${L}/shared/broadcast/broadcastPages.tsx`), /<VoiceSequence w=\{w\} h=\{h\} shown=\{st\.shown\} who=\{spec\.v2 \? castFor\('talker\.host'\) : undefined\}/);
    assert.doesNotMatch(read(`${L}/f09LocationSpeech/pages.tsx`), /<VoiceSequence[^>]*v2/);
  });
});

describe('figure V2 wave 3a — kind C: B01 converted whole', () => {
  const L = 'src/screens/lab/miking/lessons';
  it('B01 draws every figure new: both hosts (side, top, lower and upper), the turned heads, the cut-away, the label covers', () => {
    const scene = read(`${L}/b01RadioHost/scene.tsx`);
    assert.match(scene, /export const V2 = figureV2On\('sideDeskTalker'\);/);
    for (const m of scene.match(/<SeatedTalker [^>]*\/>/g) ?? []) assert.match(m, /v2=\{v2\}/, m);
    assert.match(scene, /talkerCovers\(view, HOST_A, u, v, tol, V2\)/);
    assert.match(scene, /talkerCovers\(view, HOST_B, u, v, tol, V2\)/);
    const pages = read(`${L}/b01RadioHost/pages.tsx`);
    assert.match(pages, /useTurnStep\(\{\n\s+v2: V2,/);
    assert.match(pages, /makeBroadcastSound\(\{\n\s+v2: V2,/);
  });
  it('two people in one picture are two different cast members (host Kofi, co-host Ruth)', () => {
    assert.equal(CAST.castFor(CAST.talkerRole('host')).id, 'kofi');
    assert.equal(CAST.castFor(CAST.talkerRole('hostB')).id, 'ruth');
  });
  it('a talker facing −x: the forearm turns the short way (no looping sleeve), the hand rests ahead of the elbow', () => {
    const t = { id: 'hostB', lip: { x: 1500, y: 0, z: 0 }, facing: -1 as const };
    const pose = BA.talkerPose('side', t);
    const p = PV.personPlan(pose, CAST.CAST.ruth, { lip: { u: 1500, v: 0 }, rest: 'restFlat', seatV: 0 });
    const a = p.arms.near;
    const us = a.upper.map((q: { u: number }) => q.u);
    assert.ok(Math.min(...us) > a.wrist.u - 60, 'the sleeve never swings out past the wrist');
    assert.ok(a.placed.knuckle.u < a.wrist.u, 'the hand points the way she faces');
    void TK;
  });
  it('at lesson size two hosts cost no more than today (nodes ≤ 1.5× the old, blurs ≤ the old)', () => {
    const tA = { id: 'host', lip: { x: 0, y: 0, z: 0 }, facing: 1 as const };
    const tB = { id: 'hostB', lip: { x: 1500, y: 0, z: 0 }, facing: -1 as const };
    const two = (v2: boolean) => [React.createElement(BA.SeatedTalker, { view: 'side', t: tA, phones: true, v2 }), React.createElement(BA.SeatedTalker, { view: 'side', t: tB, phones: true, v2 })];
    const old = costOf(two(false));
    const lite = costOf(two(true), { ptPerMm: 0.13 });
    const phone = costOf(two(true), { ptPerMm: 0.2 });
    const msg = `two hosts side nodes/blurs — old ${old.nodes}/${old.blurs}, new at 0.13 ${lite.nodes}/${lite.blurs}, new at 0.20 (head full) ${phone.nodes}/${phone.blurs}`;
    console.log('cost', msg);
    assert.ok(lite.nodes <= 1.5 * old.nodes && lite.blurs <= old.blurs, msg);
    const top = (v2: boolean) => [React.createElement(BA.SeatedTalker, { view: 'top', t: tA, v2 }), React.createElement(BA.SeatedTalker, { view: 'top', t: tB, v2 })];
    const oldT = costOf(top(false));
    const newT = costOf(top(true), { ptPerMm: 0.13 });
    console.log('cost', `two hosts top — old ${oldT.nodes}/${oldT.blurs}, new ${newT.nodes}/${newT.blurs}`);
    assert.ok(newT.nodes <= 1.5 * oldT.nodes && newT.blurs <= oldT.blurs);
  });
});

describe('figure V2 wave 3a — the switches', () => {
  it('sideStanding and sideDeskTalker exist and are ON (wave 3a)', () => {
    assert.equal(CFG.figureV2On('sideStanding'), true);
    assert.equal(CFG.figureV2On('sideDeskTalker'), true);
    assert.equal(CFG.figureV2On('kitDrummer'), true);
    assert.equal(CFG.FIGURE_V2_READY, false);
  });
});
