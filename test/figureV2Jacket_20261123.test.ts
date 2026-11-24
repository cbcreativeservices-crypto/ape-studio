/**
 * FIGURE V2 — WAVE 3, PIECE 2: THE JACKET (must-do D78; coordinator round
 * 2026-11-23, "THE JACKET … a cast dress variant"; step A: the jacket alone on
 * the study page, nothing in a lesson yet). Checked here:
 *   • every cast member but the drummer has a jacket tone of their own, dark,
 *     clearly apart from their trousers and from the lab's dark glass; the
 *     drummer's look is untouched;
 *   • a real garment: its outline outside the shirt (no shirt below the top
 *     button shows past it), the shirt's collar showing above its collar;
 *     standing, the back hangs STRAIGHT (plumb) from the blades to the hem,
 *     the hem below the seat; seated, no bulge at the belly and no shell off
 *     the back;
 *   • one sleeve from the shoulder to the cuff over the shirt's sleeve, ending
 *     SHIRT_CUFF_SHOWS (10) mm short of the shirt's cuff;
 *   • the lav clip points the lessons use are not moved: B02's sternum point
 *     lies on the shirt in the V (in front of the jacket's fold), B05's lapel
 *     point on the fold;
 *   • the lessons are untouched: no lesson asks for a jacket yet; the frozen
 *     renderers only gained the optional `over` slots;
 *   • the cost at lesson size stays near the old anchor's.
 * Reads normalise CRLF.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, it } from 'node:test';

const R = <T>(m: T): T => (m as { default?: T }).default ?? m;
const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const FV = 'src/screens/lab/miking/lessons/shared/figureV2';
const LS = 'src/screens/lab/miking/lessons';

const CAST = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/cast.ts'));
const LOOK = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/look.tsx'));
const GE = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/geom.ts'));
const JP = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/jacketPlan.ts'));
const PV = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/personV2.tsx'));
const TOP = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/topPerson.ts'));
const TK = R(await import('../src/screens/lab/miking/lessons/shared/broadcast/talkerPose.ts'));
const VP = R(await import('../src/screens/lab/miking/lessons/shared/voice/voicePose.ts'));
const BW = R(await import('../src/screens/lab/miking/lessons/shared/broadcast/bodyWorn.ts'));
const PF = R(await import('../src/screens/lab/miking/lessons/shared/players/PlayerFigure.tsx'));
const BWA = R(await import('../src/screens/lab/miking/lessons/shared/broadcast/BodyWornArt.tsx'));

type Pt = { u: number; v: number };

/* (the wave 1 counter, as in figureV2Cast_20261123) */
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

const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lum = (h: string) => {
  const [r, g, b] = rgb(h).map((c) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const rgbDist = (a: string, b: string) => Math.hypot(...rgb(a).map((c, i) => c - rgb(b)[i]));
const GLASS = '#14171d';

const seated = TK.poseOnTalker(TK.SEATED_SIDE, TK.HOST);
const standing = VP.SINGER_SIDE;
const SEAT_OPTS = { lip: { u: 0, v: 0 }, rest: 'restFlat' as const, seatV: TK.SEAT_Y, jacket: true };
const STAND_OPTS = { lip: { u: 0, v: 0 }, rest: 'restSide' as const, jacket: true };
const sidePlan = (pose: typeof seated, id: 'kofi' | 'ruth' | 'ana' | 'mei', o: object) => PV.personPlan(pose, CAST.CAST[id], o);
const jacketOf = (pose: typeof seated, id: 'kofi' | 'ruth' | 'ana' | 'mei') => {
  const st = pose.posture === 'standing';
  const plan = sidePlan(pose, id, st ? STAND_OPTS : SEAT_OPTS);
  return { plan, J: JP.jacketSidePlan(plan, CAST.CAST[id].body, st) };
};
/** The torso frame (t along hip → neck, f toward the face). */
const tfOf = (plan: { along: (t: number, f: number) => Pt }) => {
  const o = plan.along(0, 0);
  const A = { u: plan.along(1, 0).u - o.u, v: plan.along(1, 0).v - o.v };
  const N = { u: plan.along(0, 1).u - o.u, v: plan.along(0, 1).v - o.v };
  const AA = A.u * A.u + A.v * A.v;
  return (p: Pt) => ({ t: ((p.u - o.u) * A.u + (p.v - o.v) * A.v) / AA, f: (p.u - o.u) * N.u + (p.v - o.v) * N.v });
};
/** A closed polygon's crossings of the line t = const, in the torso frame. */
const crossF = (poly: Pt[], toTF: (p: Pt) => { t: number; f: number }, t: number) => {
  const q = poly.map(toTF);
  const out: number[] = [];
  for (let i = 0; i < q.length; i++) {
    const a = q[i];
    const b = q[(i + 1) % q.length];
    if ((a.t - t) * (b.t - t) <= 0 && a.t !== b.t) out.push(a.f + ((b.f - a.f) * (t - a.t)) / (b.t - a.t));
  }
  return out;
};
/** An open polyline's f at t (the torso frame). */
const lineF = (line: Pt[], toTF: (p: Pt) => { t: number; f: number }, t: number) => {
  const q = line.map(toTF);
  for (let i = 1; i < q.length; i++) if ((q[i - 1].t - t) * (q[i].t - t) <= 0 && q[i - 1].t !== q[i].t) return q[i - 1].f + ((q[i].f - q[i - 1].f) * (t - q[i - 1].t)) / (q[i].t - q[i - 1].t);
  return NaN;
};

describe('figure V2 wave 3 — the jacket (a dress variant)', () => {
  it('each cast member but the drummer has a jacket tone: dark, apart from their trousers and from the glass; the drummer is untouched', () => {
    assert.equal(CAST.CAST.drummer.look, LOOK.DRUMMER_LOOK);
    assert.equal((LOOK.DRUMMER_LOOK as { JACKET?: unknown }).JACKET, undefined);
    const tones = new Set<string>();
    for (const id of ['ana', 'ruth', 'kofi', 'mei'] as const) {
      const L = CAST.CAST[id].look;
      const J = L.JACKET!;
      assert.ok(J, `${id} has a jacket tone`);
      tones.add(J.form[2]);
      // dark (a wool suiting tone), yet its mid tone stands clear of the glass (contrast ≥ 1.4 : 1)
      assert.ok(lum(J.form[2]) < 0.09, `${id}: a dark tone`);
      assert.ok((lum(J.form[2]) + 0.05) / (lum(GLASS) + 0.05) >= 1.4, `${id}: the jacket must not vanish into the glass`);
      // clearly apart from the trousers (their mid tone)
      assert.ok(rgbDist(J.form[2], L.CLOTH.form[2]) >= 18, `${id}: jacket ${J.form[2]} vs trousers ${L.CLOTH.form[2]}`);
      // lit side lighter than the shadow side
      assert.ok(lum(J.form[0]) > lum(J.form[3]));
    }
    assert.equal(tones.size, 4, 'each person in their own tone');
  });

  it('a garment over the shirt: below the collar the shirt never shows past the jacket (but in the V), and the shirt collar shows above the jacket collar', () => {
    for (const pose of [seated, standing])
      for (const id of ['kofi', 'ruth', 'ana', 'mei'] as const) {
        const { plan, J } = jacketOf(pose, id);
        const toTF = tfOf(plan);
        for (let t = 0.12; t <= JP.BUTTON_T; t += 0.02) {
          const s = crossF(plan.shirt, toTF, t);
          const j = crossF(J.body, toTF, t);
          if (!s.length) continue;
          assert.ok(Math.max(...j) >= Math.max(...s) + 4, `${id} ${pose.posture}: the front at t=${t.toFixed(2)}`);
          assert.ok(Math.min(...j) <= Math.min(...s) - 2.5, `${id} ${pose.posture}: the back at t=${t.toFixed(2)}`);
        }
        // the back above the waist too
        for (let t = 0.6; t <= 0.95; t += 0.05) {
          const s = crossF(plan.shirt, toTF, t);
          const j = crossF(J.body, toTF, t);
          assert.ok(Math.min(...j) <= Math.min(...s) - 2.5, `${id} ${pose.posture}: the upper back at t=${t.toFixed(2)}`);
          // …and CLOSE over it (coordinator round 2026-11-23: no dome behind the blade): a few mm
          if (t >= 0.75) assert.ok(Math.min(...s) - Math.min(...j) <= 4, `${id} ${pose.posture}: the upper back stands off ${(Math.min(...s) - Math.min(...j)).toFixed(1)} mm at t=${t.toFixed(2)}`);
        }
        // the shirt collar's top (behind the neck) above the jacket's collar crease by ≥ 10 mm
        const top = plan.collar.map(toTF).reduce((a, b) => (b.t > a.t ? b : a));
        const crease = J.fold.map(toTF).reduce((a, b) => (b.t > a.t ? b : a));
        assert.ok((top.t - crease.t) * 554 >= 10, `${id}: the shirt collar shows above the jacket's`);
      }
  });

  it('standing: the back hangs STRAIGHT and plumb from the shoulder blades to the hem, the hem below the seat', () => {
    for (const id of ['kofi', 'ruth'] as const) {
      const { plan, J } = jacketOf(standing, id);
      const toTF = tfOf(plan);
      // the back's run below the blades: the body points behind the axis with t below 0.74
      const back = J.body.filter((p) => toTF(p).t <= 0.745 && toTF(p).t > -0.36 && toTF(p).f < -100);
      assert.ok(back.length >= 3);
      const a = back.reduce((x, y) => (y.v < x.v ? y : x));
      const b = back.reduce((x, y) => (y.v > x.v ? y : x));
      for (const p of back) {
        const k = (p.v - a.v) / (b.v - a.v || 1);
        assert.ok(Math.abs(p.u - (a.u + (b.u - a.u) * k)) < 1.5, `${id}: the back is one straight line`);
      }
      assert.ok(Math.abs(Math.atan2(b.u - a.u, b.v - a.v)) < (4 * Math.PI) / 180, `${id}: plumb`);
      // the hem below the seat (the seat's lowest point)
      const seatLow = Math.max(...plan.seat.map((q) => q.v));
      const hemV = Math.max(...J.body.map((q) => q.v));
      assert.ok(hemV >= seatLow - 20, `${id}: the hem ${hemV.toFixed(0)} vs the seat ${seatLow.toFixed(0)}`);
    }
  });

  it('seated: no bulge at the belly; the back ONE straight line from the blade to the seat; the collar close on the neck; the tail folds onto the pad, nothing behind the chair', () => {
    for (const id of ['kofi', 'ruth'] as const) {
      const { plan, J } = jacketOf(seated, id);
      const toTF = tfOf(plan);
      for (let t = 0.2; t <= 0.55; t += 0.05) {
        const s = crossF([...plan.shirt], toTF, t);
        const j = crossF(J.body, toTF, t);
        assert.ok(Math.max(...j) - Math.max(...s) <= 10.5, `${id}: belly ease at t=${t.toFixed(2)}`);
      }
      // the back's points between the blade (t 0.74) and the seat (t 0.02): one straight line
      const run = J.body.filter((p) => toTF(p).f < -60 && toTF(p).t >= 0.019 && toTF(p).t <= 0.741);
      assert.equal(run.length, 2, `${id}: the back from the blade to the seat is a single straight run`);
      // the collar close on the back of the neck: within 12 mm of the neck's back at the collar
      const neckBack = Math.min(...crossF(plan.head.neck, toTF, 1.07));
      const collarBack = Math.min(...crossF(J.body, toTF, 1.07));
      assert.ok(neckBack - collarBack <= 20, `${id}: the collar ${(neckBack - collarBack).toFixed(1)} mm off the neck`);
      // the skirt reaches the seat pad, and nothing of it lies further back than the seat's own back + the ease
      const seatLow = Math.max(...plan.seat.map((q) => q.v));
      assert.ok(Math.max(...J.body.map((q) => q.v)) >= seatLow - 4);
      const seatBack = Math.min(...[...plan.seat, ...plan.shirt].filter((q) => q.v > plan.along(0.15, 0).v).map((q) => q.u));
      const low = J.body.filter((q) => q.v > plan.along(0.1, 0).v);
      assert.ok(Math.min(...low.map((q) => q.u)) >= seatBack - JP.BACK_EASE - 6, `${id}: the tail stands out behind the seat`);
    }
  });

  it('one sleeve over the shirt sleeve, ending 10 mm short of the shirt cuff; a fuller sleeve, a squarer shoulder', () => {
    assert.equal(JP.SHIRT_CUFF_SHOWS, 10);
    for (const pose of [seated, standing])
      for (const id of ['kofi', 'ruth'] as const) {
        const { plan, J } = jacketOf(pose, id);
        for (const k of ['near', 'far'] as const) {
          const a = plan.arms[k];
          const s = J.sleeves[k];
          const last = a.line.length - 1;
          const d = GE.unit(GE.sub(a.line[last], a.line[last - 1]));
          const cuffEnd = GE.sub(a.wrist, GE.mul(d, 16));
          assert.ok(Math.abs(GE.dist(s.end, cuffEnd) - 10) < 0.5, `${id} ${k}: the shirt cuff shows 10 mm`);
          // the shirt's sleeve (its outline away from the cuff) lies inside the jacket's sleeve or body
          const inside = (p: Pt) => GE.inPoly(p, s.outline) || GE.inPoly(p, J.body);
          const pts = a.upper.filter((p: Pt) => GE.dist(p, a.wrist) > 50);
          const out = pts.filter((p: Pt) => !inside(p));
          assert.ok(out.length <= Math.ceil(pts.length * 0.04), `${id} ${pose.posture} ${k}: ${out.length} of ${pts.length} shirt-sleeve points outside`);
        }
      }
  });

  it('the lav clip points are kept: B02 sternum on the shirt in the V, B05 lapel on the fold', () => {
    const st = BW.BODY_MOUNTS.sternum.grip;
    const lp = BW.BODY_MOUNTS.lapel.grip;
    // (unchanged values: the lessons' own model)
    assert.equal(Math.round(st.y), Math.round(BW.NECK_Y + 107));
    assert.equal(Math.round(lp.y), Math.round(BW.NECK_Y + 125));
    for (const pose of [seated, standing])
      for (const id of ['kofi', 'ruth'] as const) {
        const { plan, J } = jacketOf(pose, id);
        const toTF = tfOf(plan);
        const g = toTF({ u: st.x, v: st.y });
        // in the V: the jacket's fold lies behind the clip
        assert.ok(lineF(J.fold, toTF, g.t) < g.f - 3, `${id} ${pose.posture}: the sternum clip is in front of the fold`);
        const l = toTF({ u: lp.x, v: lp.y });
        // on the lapel: the fold within a few mm of the clip's grip
        assert.ok(Math.abs(lineF(J.fold, toTF, l.t) - l.f) <= 12, `${id} ${pose.posture}: the lapel clip ${(lineF(J.fold, toTF, l.t) - l.f).toFixed(1)} mm from the fold`);
      }
  });

  it('the drawn clip sits ON the cloth: the lesson height kept, 1 mm off the shirt (in the V) or the fold', () => {
    for (const pose of [seated, standing])
      for (const id of ['kofi', 'ruth'] as const) {
        const { plan, J } = jacketOf(pose, id);
        const st = BW.BODY_MOUNTS.sternum.grip;
        const c = JP.clipOnCloth(plan, J, st, 'shirt');
        assert.equal(c.v, st.y);
        const toTF = tfOf(plan);
        const front = Math.max(...crossF(plan.shirt, toTF, toTF(c).t));
        assert.ok(Math.abs(toTF(c).f - front - 1) < 0.6, `${id} ${pose.posture}: the sternum clip on the shirt`);
        const lp = BW.BODY_MOUNTS.lapel.grip;
        const l = JP.clipOnCloth(plan, J, lp, 'lapel');
        assert.equal(l.v, lp.y);
        assert.ok(Math.abs(toTF(l).f - lineF(J.fold, toTF, toTF(l).t) - 1) < 0.6, `${id} ${pose.posture}: the lapel clip on the fold`);
      }
  });

  it('from above: the jacket over the shoulders (squarer), two lapels, the collar; the desk forearms in their sleeves', () => {
    const top = TK.poseOnTalker(TK.SEATED_TOP, TK.HOST);
    const plan = TOP.personTopPlan(top, CAST.CAST.kofi, { desk: true });
    const J = JP.jacketTopPlan(plan, CAST.CAST.kofi.body, true);
    assert.equal(J.lapels.length, 2);
    assert.ok(J.sleeves);
    // the shirt's slab lies inside the jacket's but at the V
    const out = plan.torso.filter((p: Pt) => !GE.inPoly(p, J.slab));
    assert.ok(out.length <= 1, `${out.length} shirt points outside the jacket from above`);
    // wider at the shoulders than the shirt
    const w = (poly: Pt[]) => Math.max(...poly.map((p) => Math.abs((p.u - plan.n.u) * plan.left.u + (p.v - plan.n.v) * plan.left.v)));
    assert.ok(w(J.slab) >= w(plan.torso) + 8);
  });

  it('only the lessons converted with it ask for a jacket (step B: B02); the frozen renderers only gained the optional slots', () => {
    const dirs = readdirSync(new URL(`../${LS}`, import.meta.url)).filter((d) => /^[a-z]\d/.test(d) && d !== 'b02NewsAnchor');
    for (const d of dirs)
      for (const f of readdirSync(new URL(`../${LS}/${d}`, import.meta.url)).filter((x) => /\.tsx?$/.test(x)))
        assert.doesNotMatch(read(`${LS}/${d}/${f}`), /jacket:\s*true/, `${d}/${f}`);
    // (the shared seated talker passes a lesson's choice on — `jacket` defaults off)
    assert.match(read(`${LS}/shared/broadcast/BroadcastArt.tsx`), /v2 = false, jacket = false \}/);
    assert.doesNotMatch(read(`${LS}/shared/voice/VoiceArt.tsx`), /jacket:\s*true/);
    assert.match(read(`${FV}/FigureV2Side.tsx`), /\{over\?\.far \?\? null\}/);
    assert.match(read(`${FV}/FigureV2Side.tsx`), /\{over\?\.body \?\? null\}\n\s*<Arm a=\{plan\.arms\.near\}/);
    assert.match(read(`${FV}/lite.tsx`), /\{over\?\.near \?\? null\}/);
  });

  it('the cost at lesson size: the anchor in the jacket stays near the old anchor in the old jacket', () => {
    const t = TK.HOST;
    const pose = TK.poseOnTalker(TK.SEATED_SIDE, t);
    const el = React.createElement(PV.PersonSideV2, { pose, who: CAST.CAST.kofi, opts: SEAT_OPTS });
    const plain = React.createElement(PV.PersonSideV2, { pose, who: CAST.CAST.kofi, opts: { ...SEAT_OPTS, jacket: false } });
    // the old anchor: the old figure and the old jacket (B02 draws both)
    const old = costOf([React.createElement(PF.PlayerBehind, { pose }), React.createElement(PF.PlayerInFront, { pose, hands: true }), React.createElement(BWA.Jacket, { view: 'side', standing: false })]);
    const lite = costOf(el, { ptPerMm: 0.1 });
    const litePlain = costOf(plain, { ptPerMm: 0.1 });
    const full = costOf(el, { ptPerMm: 0.6 });
    // the jacket adds only a handful of fills at lesson size, and no blur
    assert.ok(lite.nodes - litePlain.nodes <= 20, `lite: +${lite.nodes - litePlain.nodes}`);
    assert.equal(lite.blurs, litePlain.blurs);
    assert.ok(lite.nodes <= old.nodes, `lite ${lite.nodes} vs old ${old.nodes}`);
    assert.ok(full.nodes > lite.nodes);
  });
});
