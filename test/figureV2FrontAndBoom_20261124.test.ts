/**
 * FIGURE V2 — WAVE 4 (builder "FrontAndBoom", 2026-11-24): the shared figure
 * seen from the FRONT. Checked here (the pictures are judged by eye on the
 * study page `#labpreview/FigureStudy/front`):
 *   • the five cast members, standing and seated, with and without the jacket,
 *     build a plan with both arms, both legs, both shoes and the head;
 *   • the face's proportions (the eyes one eye-width apart, level, the mouth's
 *     middle on the lip point it is given);
 *   • the sides: the person's right on the viewer's left (u = −z);
 *   • the hands at rest: hanging at the side, their palm side toward the
 *     body's middle, the thumb's tip about at the index's middle joint; one
 *     outline each (the thumb is not a separate stuck-on piece);
 *   • the hanging hand stays clear of the thighs' middle (it rests beside them);
 *   • the jacket: the sleeve ends SHIRT_CUFF_SHOWS short of the shirt's cuff,
 *     the drummer has no jacket tone of his own;
 *   • the trousers one garment: the legs meet at the crotch, a short fly seam above it (FrontBoom3);
 *   • the frozen shared files only gained exports (paths.artPaths).
 * Reads normalise CRLF.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const R = <T>(m: T): T => (m as { default?: T }).default ?? m;
const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const FV = 'src/screens/lab/miking/lessons/shared/figureV2';

const CAST = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/cast.ts'));
const FP = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/frontPlan.ts'));
const FH = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/frontHands.ts'));
const JP = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/jacketPlan.ts'));
const AH = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/authoredHands.ts'));

type Id = 'drummer' | 'ana' | 'ruth' | 'kofi' | 'mei';
const IDS: Id[] = ['drummer', 'ana', 'ruth', 'kofi', 'mei'];
const planOf = (id: Id, pose: unknown, jacket = false, lip = { u: 0, v: 0 }) => {
  const who = CAST.CAST[id];
  return FP.frontPlan(pose, { head: who.head, body: who.body, woman: who.woman, lip, jacket });
};
const lipOf = (pose: { head: { c: { v: number } } }) => ({ u: 0, v: pose.head.c.v - FP.FRONT_STANDING.head.c.v });

describe('figure V2 from the front — the plan', () => {
  for (const id of IDS)
    for (const pose of [FP.FRONT_STANDING, FP.FRONT_SEATED])
      for (const jacket of [false, true])
        it(`${id}, ${pose.posture}${jacket ? ', jacket' : ''}: every part`, () => {
          const F = planOf(id, pose, jacket, lipOf(pose));
          assert.equal(F.arms.length, 2);
          assert.equal(F.legs.length, 2);
          assert.equal(F.shoes.length, 2);
          assert.ok(F.head.skull.length > 20);
          assert.ok(F.head.hair.length > 10);
          assert.equal(F.seated, pose.posture !== 'standing');
          assert.equal(!!F.jacket, jacket);
          // the person's right (the pose's R) on the viewer's left
          assert.ok(F.arms[0].wrist.u < F.arms[1].wrist.u);
          assert.equal(F.arms[0].side, -1);
        });

  it('the face: the eyes level, one eye-width apart; the mouth on the lip point', () => {
    for (const id of IDS) {
      const F = planOf(id, FP.FRONT_STANDING, false, { u: 0, v: 0 });
      const h = F.head;
      assert.ok(Math.abs(h.eyeL.v - h.eyeR.v) < 0.01);
      const apart = h.eyeR.u - h.eyeL.u;
      assert.ok(apart > 58 && apart < 72, `pupils ${apart.toFixed(1)} mm apart`);
      assert.ok(Math.abs(h.mouthC.v) < 0.01 && Math.abs(h.mouthC.u) < 0.01);
      // the eye line about half way down the head (crown to chin)
      const t = (h.eyeL.v - h.crown.v) / (h.chin.v - h.crown.v);
      assert.ok(t > 0.45 && t < 0.56, `eye line at ${t.toFixed(2)}`);
    }
  });

  it('the hair: no cast member is gray; the bob covers the ears, the others show them', () => {
    assert.equal(planOf('ruth', FP.FRONT_STANDING).head.earShows, false);
    for (const id of ['drummer', 'ana', 'kofi', 'mei'] as Id[]) assert.equal(planOf(id, FP.FRONT_STANDING).head.earShows, true);
  });

  it('the hanging hand: palm side toward the middle, beside the thigh, the thumb tip at about the index middle joint', () => {
    for (const id of IDS) {
      const F = planOf(id, FP.FRONT_STANDING);
      for (const a of F.arms) {
        const h = a.hand;
        // the thumb (palm side) lies toward the body's middle
        assert.ok(Math.abs(h.thumbTip.u) < Math.abs(a.wrist.u) + 1, `${id}: thumb toward the middle`);
        // the hand rests beside the thigh, clear of the trousers' middle
        const inner = Math.min(...h.parts[0].placed.map((p: { u: number }) => Math.abs(p.u)));
        assert.ok(inner > 150, `${id}: hand's inner edge ${inner.toFixed(0)} mm from the middle`);
        // one outline: a single part for the hand (the thumb told by its contour, never a stuck-on piece)
        assert.equal(h.parts.length, 1);
      }
    }
    const art = FH.frontHandArt('hangFront');
    // the thumb's tip about 0.7–0.85 of the way to the fingertips
    const tipX = Math.max(...art.parts[0].outline.map((p: { u: number }) => p.u));
    const k = art.thumbTip.u / tipX;
    assert.ok(k > 0.7 && k < 0.88, `thumb tip at ${k.toFixed(2)} of the hand's length`);
    // (FrontBoom3, review: "a real hand about 180 to 190 mm from wrist crease to fingertip")
    assert.ok(tipX > 176 && tipX < 194, `hand ${tipX.toFixed(0)} mm`);
    // the wrist narrower than the hand (it swells into the thenar mound and the knuckles)
    const depthAt = (x: number) => {
      const o = art.parts[0].outline as { u: number; v: number }[];
      const near = o.filter((p) => Math.abs(p.u - x) < 14);
      return Math.max(...near.map((p) => p.v)) - Math.min(...near.map((p) => p.v));
    };
    assert.ok(depthAt(0) + 12 < depthAt(110), `wrist ${depthAt(0).toFixed(0)} mm, hand ${depthAt(110).toFixed(0)} mm`);
  });

  it('the seated hand is the approved hand from above, foreshortened along its length', () => {
    const top = AH.handArt('restTop');
    const lap = FH.frontHandArt('lapFront');
    const len = (a: { parts: { outline: { u: number }[] }[] }) => Math.max(...a.parts[0].outline.map((p) => p.u));
    assert.ok(Math.abs(len(lap) - len(top) * FH.LAP_FORESHORTEN) < 1);
    assert.equal(lap.parts.length, top.parts.length);
  });

  it('the jacket: its sleeve ends SHIRT_CUFF_SHOWS short of the shirt’s cuff; the drummer has no jacket tone', () => {
    assert.equal(CAST.CAST.drummer.look.JACKET, undefined);
    const F = planOf('kofi', FP.FRONT_STANDING, true);
    for (const [i, a] of F.arms.entries()) {
      const s = F.jacket!.sleeves[i];
      const endV = Math.max(...s.endRim.map((p: { v: number }) => p.v));
      const cuffEnd = Math.max(...a.cuffRim.map((p: { v: number }) => p.v));
      const gap = cuffEnd - endV;
      assert.ok(gap > JP.SHIRT_CUFF_SHOWS - 3 && gap < JP.SHIRT_CUFF_SHOWS + 6, `cuff shows ${gap.toFixed(1)} mm`);
    }
  });

  it('decency: plain tailoring at the groin — the fly’s short seam only, ending above where the legs part (FrontBoom3)', () => {
    const F = planOf('kofi', FP.FRONT_STANDING);
    // the leg creases start below the crotch on each leg, not at the middle
    for (const l of F.legs) assert.ok(Math.abs(l.crease[0].u) > 50);
    const fly = F.flySeam!;
    assert.ok(fly && fly.length >= 3, 'a fly seam (one garment)');
    const gap = F.legGap!;
    assert.ok(Math.max(...fly.map((p: { v: number }) => p.v)) < Math.min(...gap.map((p: { v: number }) => p.v)) - 60, 'the seam ends well above where the legs part');
    assert.equal(planOf('kofi', FP.FRONT_SEATED, false, lipOf(FP.FRONT_SEATED)).flySeam, null);
  });

  it('the legs meet at the crotch: one garment, no box and no gap between the thighs at the top (FrontBoom3)', () => {
    for (const id of IDS) {
      const F = planOf(id, FP.FRONT_STANDING);
      const cx = (F.legs[0].axis[0].u + F.legs[1].axis[0].u) / 2;
      for (const l of F.legs) {
        // the leg's outline reaches (or crosses) the body's middle line near its top
        const top = Math.min(...l.outline.map((p: { v: number }) => p.v));
        const near = l.outline.filter((p: { v: number }) => p.v < top + 160);
        const s = Math.sign(l.axis[0].u - cx);
        const inner = Math.min(...near.map((p: { u: number }) => s * (p.u - cx)));
        assert.ok(inner < 10, `${id}: the thigh reaches the middle (${inner.toFixed(1)} mm off it)`);
      }
    }
  });

  it('the frozen shared files only gained an export', () => {
    const p = read(`${FV}/paths.ts`);
    assert.ok(p.includes('export function artPaths('));
    // the front view lives in its own files
    for (const f of ['frontPlan.ts', 'frontHands.ts', 'FigureV2Front.tsx']) assert.ok(read(`${FV}/${f}`).length > 1000);
  });
});


/* ── SET 1, the owner's notes: each person their own face from the front ── */

describe('figure V2 from the front — each person their own face', () => {
  const heads = IDS.map((id) => planOf(id, FP.FRONT_STANDING).head);
  const width = (h: { skull: { u: number; v: number }[]; c: { v: number } }, dy: number) => {
    const ys = h.skull.filter((p) => Math.abs(p.v - (h.c.v + dy)) < 6).map((p) => p.u);
    return Math.max(...ys) - Math.min(...ys);
  };
  it('no two people share the same jaw width, eye spacing or brow', () => {
    const sig = heads.map((h) => `${width(h, 62).toFixed(0)}:${(h.eyeR.u - h.eyeL.u).toFixed(1)}`);
    assert.equal(new Set(sig).size, sig.length, sig.join(' '));
  });
  it('the men (the drummer, Kofi) have broader jaws than the women; Kofi the broadest', () => {
    const jaw = Object.fromEntries(IDS.map((id, i) => [id, width(heads[i], 62)]));
    for (const m of ['drummer', 'kofi']) for (const w of ['ana', 'ruth', 'mei']) assert.ok(jaw[m] > jaw[w], `${m} ${jaw[m]} > ${w} ${jaw[w]}`);
    assert.ok(jaw.kofi >= jaw.drummer - 1);
  });
  it('the ears lie back: at most 13 mm beyond the head’s side', () => {
    for (const h of heads)
      for (const e of h.ears) {
        const out = Math.max(...e.map((p: { u: number }) => Math.abs(p.u - h.c.u)));
        const side = Math.max(...h.skull.filter((p: { v: number }) => Math.abs(p.v - h.c.v) < 30).map((p: { u: number }) => Math.abs(p.u - h.c.u)));
        assert.ok(out - side <= 13, `ear ${(out - side).toFixed(1)} mm out`);
      }
  });
  it('Ana and Mei are told apart from the front: a different hairline, Mei’s centre parting', () => {
    const ana = planOf('ana', FP.FRONT_STANDING).head;
    const mei = planOf('mei', FP.FRONT_STANDING).head;
    assert.equal(ana.part, null);
    assert.ok(mei.part);
    const line = (h: { hair: { u: number; v: number }[]; c: { u: number } }) => Math.max(...h.hair.filter((p) => Math.abs(p.u - h.c.u) < 4).map((p) => p.v));
    assert.ok(Math.abs(line(ana) - line(mei)) > 4);
  });
});

/* ── SET 2: the boom grip ── */

const BG = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/boomGrip.ts'));
const B04G = R(await import('../src/screens/lab/miking/lessons/b04BoomCamera/geometry.ts'));

describe('figure V2 — the two-handed boom grip', () => {
  const neck = { x: 1200, y: 86, z: -1200 };
  const o = BG.operatorFrame(neck, { x: -0.7, y: 0, z: 0.7 });
  const sh = { R: { x: neck.x + o.R.x * 168, y: neck.y + 30, z: neck.z + o.R.z * 168 }, L: { x: neck.x - o.R.x * 168, y: neck.y + 30, z: neck.z - o.R.z * 168 } };
  const front = B04G.GRIP_CLOSE;
  const rear = BG.alongPole(front, { x: front.x + 300, y: front.y + 60, z: front.z - 300 }, 420);
  const arms = BG.boomArms(o, sh, front, rear, 'L');
  const pole = { x: front.x - rear.x, y: front.y - rear.y, z: front.z - rear.z };
  it('the hands are on the lesson’s own points (nothing of the lesson moves)', () => {
    assert.deepEqual(arms.find((a: { side: string }) => a.side === 'R').fist, front);
    assert.deepEqual(arms.find((a: { side: string }) => a.side === 'L').fist, rear);
  });
  it('the elbows bend out to the arm’s own side, never in at the head', () => {
    // (an arm at full reach is straight: its elbow on the line, nothing to bend)
    for (const a of arms.filter((q: { reach: number }) => q.reach < 0.97)) {
      const out = a.side === 'R' ? o.R : { x: -o.R.x, y: 0, z: -o.R.z };
      const d = { x: a.elbow.x - a.shoulder.x, y: a.elbow.y - a.shoulder.y, z: a.elbow.z - a.shoulder.z };
      assert.ok(d.x * out.x + d.z * out.z > 20, `${a.side} elbow outward`);
    }
  });
  it('each hand is the approved 3-D grip: the palm, the fingers and the thumb; the left a true left hand', () => {
    for (const a of arms) {
      const h = BG.boomHand(o, a, pole, { x: 0, y: 0, z: 1 }, (p: { x: number; y: number }) => ({ u: p.x, v: p.y }));
      const names = h.grip.parts.map((p: { name: string }) => p.name);
      assert.ok(names.includes('palm') && names.includes('thumb') && names.includes('fingers'));
      assert.ok(h.grip.order.includes('MIC'));
    }
  });
  it('the frozen grip file is used as it is (heldHands.ts unchanged by this builder)', () => {
    const src = read('src/screens/lab/miking/lessons/shared/figureV2/boomGrip.ts');
    assert.ok(src.includes("from './heldHands.ts'"));
  });
});

/* ── SET 3: the lessons converted whole ── */

describe('figure V2 — B04, B05, B11, F09 converted whole', () => {
  const LS = 'src/screens/lab/miking/lessons';
  it('each lesson has one switch and passes it to every figure call', () => {
    for (const f of ['b04BoomCamera/scene.tsx', 'b05Lavalier/scene.tsx', 'b11Athletes/scene.tsx', 'f09LocationSpeech/scene.tsx']) assert.ok(read(`${LS}/${f}`).includes("figureV2On('frontAndBoom')"), f);
    const b04 = read(`${LS}/b04BoomCamera/pages.tsx`);
    assert.ok(b04.includes('v2: V2') && b04.includes('v2={V2}') && b04.includes("castFor('talker.interviewer')"));
    const b05 = read(`${LS}/b05Lavalier/pages.tsx`);
    assert.ok((b05.match(/v2: V2/g) ?? []).length >= 3 && b05.includes('(V2 ? <MovePresenterV2 move={move} /> : <MovePresenter move={move} />)') && b05.includes('<MovePresenter move={move} v2 />'));
    const b11 = read(`${LS}/b11Athletes/pages.tsx`);
    assert.ok((b11.match(/v2: V2/g) ?? []).length >= 3);
    const f09 = read(`${LS}/f09LocationSpeech/pages.tsx`);
    assert.ok(f09.includes("who={V2 ? castFor('voice.singer') : undefined}") && f09.includes('head="only"'));
  });
  it('the boom operator is never the lesson’s own talker', () => {
    assert.notEqual(CAST.ROLES['operator.boom'], CAST.ROLES['presenter']);
    assert.notEqual(CAST.ROLES['operator.boom'], CAST.ROLES['voice.singer']);
    assert.notEqual(CAST.ROLES['operator.boom'], CAST.ROLES['talker.wearer']);
  });
});

/* ── the coordinator's round on sets 2–3 ── */

const B05G = R(await import('../src/screens/lab/miking/lessons/b05Lavalier/geometry.ts'));
const BW = R(await import('../src/screens/lab/miking/lessons/shared/broadcast/bodyWorn.ts'));
const PVm = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/personV2.tsx'));
const VPm = R(await import('../src/screens/lab/miking/lessons/shared/voice/voicePose.ts'));

describe('figure V2 — B05 clips on the new cloth, the headset on the new ear (drawing only)', () => {
  const ruth = CAST.CAST.ruth;
  const plan = PVm.personPlan(VPm.SINGER_SIDE, ruth, { lip: { u: 0, v: 0 }, rest: 'restSide', jacket: true });
  const J = JP.jacketSidePlan(plan, ruth.body, true);
  it('each clip’s drawn grip is on Ruth’s shirt in the V, or on the lapel’s fold (as B02 does it)', () => {
    for (const [id, x] of Object.entries(B05G.GRIP_ON_CLOTH_X) as [string, number][]) {
      const c = JP.clipOnCloth(plan, J, BW.BODY_MOUNTS[id].grip, id === 'lapel' ? 'lapel' : 'shirt');
      assert.ok(Math.abs(c.u - x) < 0.2, `${id}: ${c.u.toFixed(2)} vs ${x}`);
    }
  });
  it('the capsules — every readout is read from them — do not move', () => {
    assert.deepEqual(B05G.STERNUM.at, BW.BODY_MOUNTS.sternum.at);
    assert.deepEqual(B05G.LAPEL.at, BW.BODY_MOUNTS.lapel.at);
    assert.deepEqual(B05G.HEADSET.at, BW.BODY_MOUNTS.headset.at);
    const rims = B05G.B05_MODEL.rims as { id: string; c: { x: number; y: number; z: number } }[];
    // (the clip's grip moved only along the horizontal: its height and side stay the lesson's)
    const st = rims.find((r) => r.id === 'clip.sternum')!;
    assert.equal(st.c.y, BW.BODY_MOUNTS.sternum.grip.y);
    assert.equal(st.c.z, BW.BODY_MOUNTS.sternum.grip.z);
  });
  it('the headset hangs on the new head’s ear (side), within a few mm of where the drawing puts it', () => {
    const ear = plan.head.ear;
    const cx = ear.reduce((s: number, p: { u: number }) => s + p.u, 0) / ear.length;
    const cy = ear.reduce((s: number, p: { v: number }) => s + p.v, 0) / ear.length;
    assert.ok(Math.abs(cx - B05G.EAR_ON_HEAD.x) < 0.3 && Math.abs(cy - B05G.EAR_ON_HEAD.y) < 0.3);
  });
});

const BVm = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/boomGrip.ts'));
describe('figure V2 — the boom arms never stretch', () => {
  it('a grip past the arm’s reach lifts the shoulder (≤ SHOULDER_TRAVEL) so the arm stays ≤ REACH_MAX', () => {
    const neck = { x: 0, y: 0, z: 0 };
    const o = BVm.operatorFrame(neck, { x: -1, y: 0, z: 0 });
    const sh = { R: { x: 0, y: 30, z: -168 }, L: { x: 0, y: 30, z: 168 } };
    const far = { x: -280, y: -540, z: 0 }; // (≈ 660 mm from the shoulder: past the arm's 611, within the girdle's travel)
    const arms = BVm.boomArms(o, sh, far, { x: 200, y: -520, z: 0 }, 'L');
    for (const a of arms) {
      assert.ok(a.reach <= BVm.REACH_MAX + 1e-6, `${a.side} reach ${a.reach}`);
      const l = a.lift ? Math.hypot(a.lift.x, a.lift.y, a.lift.z) : 0;
      assert.ok(l <= BVm.SHOULDER_TRAVEL + 1e-6);
    }
  });
});

/* ── FrontBoom4: the owner's three notes on the boom operator from the front (2026-11-24) ── */

const BV = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/BoomV2.tsx'));
const HS = R(await import('../src/dev/heldStudy.tsx'));
const B04S = R(await import('../src/screens/lab/miking/lessons/b04BoomCamera/scene.tsx'));

describe('figure V2 — the boom operator from the front (FrontBoom4)', () => {
  const mei = CAST.CAST.mei;
  const base = { head: mei.head, body: mei.body, woman: mei.woman };
  it('the approved standing figure is unchanged: armsUp off draws exactly the plan it drew before', () => {
    for (const id of IDS)
      for (const pose of [FP.FRONT_STANDING, FP.FRONT_SEATED]) {
        const who = CAST.CAST[id];
        const o = { head: who.head, body: who.body, woman: who.woman, lip: lipOf(pose) };
        // (as data: the plan's points; a placed hand carries its own closures)
        assert.equal(JSON.stringify(FP.frontPlan(pose, { ...o, armsUp: false })), JSON.stringify(FP.frontPlan(pose, o)), `${id} ${pose.posture}`);
      }
  });
  it('"pants are extra wide": with the arms raised the trousers are no wider than the approved Mei’s visible legs', () => {
    const up = FP.frontPlan(FP.FRONT_STANDING, { ...base, armsUp: true });
    const ok = FP.frontPlan(FP.FRONT_STANDING, base);
    const cx = up.axis[1].u;
    // (the approved figure's visible trousers: the thigh's outer edge below her hanging hand, mid-thigh down)
    const kneeV = FP.FRONT_STANDING.kneeL.v;
    const visible = Math.max(...ok.legs.flatMap((l: { outline: { u: number; v: number }[] }) => l.outline.filter((q) => q.v > ok.hipV + 200 && q.v < kneeV).map((q) => Math.abs(q.u - cx))));
    const widest = Math.max(...[up.seat, ...up.legs.map((l: { outline: unknown }) => l.outline)].flatMap((p) => (p as { u: number; v: number }[]).filter((q) => q.v < kneeV).map((q) => Math.abs(q.u - cx))));
    assert.ok(widest <= visible, `raised-arms trousers ${widest.toFixed(0)} mm vs approved ${visible.toFixed(0)} mm`);
    // the waistband no wider than the belt over it (no shelf beside the belt)
    const beltW = Math.max(...up.belt.map((q: { u: number }) => Math.abs(q.u - cx)));
    const top = up.seat.filter((q: { v: number }) => q.v < up.hipV - 60).map((q: { u: number }) => Math.abs(q.u - cx));
    assert.ok(Math.max(...top) <= beltW + 4, `waistband ${Math.max(...top).toFixed(0)} vs belt ${beltW.toFixed(0)}`);
    // only the trousers change: the shirt, the head and the arms are the approved ones
    assert.deepStrictEqual(up.shirt, ok.shirt);
    assert.deepStrictEqual(up.head, ok.head);
  });
  it('the front view asks for the raised-arms trousers (and the approved pages never do)', () => {
    const src = read(`${FV}/BoomV2.tsx`);
    assert.match(src, /const FRONT_OPTS = \{ armsUp: true \} as const;/);
    assert.match(src, /<PersonFrontV2 pose=\{FRONT_STANDING\} who=\{who\} opts=\{FRONT_OPTS\} arms=\{false\} \/>/);
    assert.ok(!read('src/dev/frontBoomStudy.tsx').includes('armsUp'));
  });
  // (FrontBoom5, owner on the front hands: "this does not pass") each front hand IS an approved palm-side mic hand
  it('the front hands’ pictures are the approved /michand palm-side hands, number for number', () => {
    for (const A of BV.APPROVED_PALMS) {
      const g = HS.heldGeo(A.id);
      for (const k of ['f', 'h', 'd'] as const) for (const c of ['x', 'y', 'z'] as const) assert.ok(Math.abs(A.fr[k][c] - g.fr[k][c]) < 1e-9, `${A.id} ${k}.${c}`);
      assert.match(HS.heldViewOf(A.id, A.plane, true).words, /palm side/, `${A.id} is a palm-side picture`);
    }
    assert.equal(BV.APPROVED_PALMS[0].id, 'b3.shared');
  });
  const FB = BV.boomPlans(B04S.B04_V2_RIGS.close.full, CAST.CAST.mei, 'front');
  const ang = (a: { u: number; v: number }, b: { u: number; v: number }) => (Math.acos(Math.min(1, Math.abs(a.u * b.u + a.v * b.v) / (Math.hypot(a.u, a.v) * Math.hypot(b.u, b.v)))) * 180) / Math.PI;
  // (2026-11-24, owner: "Pole hand passes") from the front each hand is the APPROVED authored pole hand, palm side
  // (poleHandFront.tsx): the right hand as drawn, the left its mirror image
  it('"pole within the hand": from the front each hand is the approved pole hand with its pole axis ON the pole', () => {
    assert.equal(BV.POLE_FRONT_HANDS, true);
    for (const a of FB.arms) {
      assert.equal(a.hand.painter, 'poleFront', `${a.hand.arm.side}: the approved pole hand`);
      const pf = a.hand.poleFront;
      assert.equal(pf.mirror, a.hand.arm.side === 'L', `${a.hand.arm.side}: the left hand the mirror image`);
      const F = FB.vs.proj(a.hand.arm.fist);
      const P1 = FB.vs.proj({ x: a.hand.arm.fist.x + FB.poleDir.x, y: a.hand.arm.fist.y + FB.poleDir.y, z: a.hand.arm.fist.z + FB.poleDir.z });
      // (the drawing's pole axis along the rig's pole, its middle on the fist)
      assert.ok(ang({ u: Math.cos(pf.rot), v: Math.sin(pf.rot) }, { u: P1.u - F.u, v: P1.v - F.v }) < 1, `${a.hand.arm.side}: pole axis along the pole`);
      assert.ok(Math.hypot(pf.x - F.u, pf.y - F.v) < 1e-6, `${a.hand.arm.side}: the pole through the fist`);
      // (the drawing's wrist side toward the elbow)
      const E = FB.vs.proj(a.hand.arm.elbow);
      assert.ok(-Math.sin(pf.rot) * (E.u - F.u) + Math.cos(pf.rot) * (E.v - F.v) > 0);
    }
  });
  it('from the front the wrist is straight: the sleeve’s forearm lies on the hand’s own forearm line', () => {
    for (const a of FB.arms) {
      const fore = { u: a.arm.wrist.u - a.arm.elbow.u, v: a.arm.wrist.v - a.arm.elbow.v };
      const pf = a.hand.poleFront;
      const own = { u: Math.sin(pf.rot), v: -Math.cos(pf.rot) };
      assert.ok(ang(fore, own) < 1, `${a.hand.arm.side}: ${ang(fore, own).toFixed(1)}°`);
    }
  });
  it('the top view keeps its 3-D grip (the approved top hand drawn on it, its own switch); the side view has its own switch', () => {
    const src = read(`${FV}/BoomV2.tsx`);
    assert.match(src, /boomArmPlan\(o, a, poleDir, vs, lifted, d\.far, view === 'front'\)\);/);
    assert.match(src, /if \(view === 'side' && POLE_SIDE_HANDS && !oldSide\)/);
    assert.match(src, /if \(view === 'top' && POLE_TOP_HANDS && !oldSide\)/);
    for (const a of BV.boomPlans(B04S.B04_V2_RIGS.close.full, CAST.CAST.mei, 'top').arms) {
      assert.equal(a.hand.painter, 'poleTop');
      assert.ok(a.hand.grip, 'the 3-D grip still made');
      assert.equal(a.hand.sideFace, undefined);
    }
    assert.ok(!read(`${FV}/boomGrip.ts`).includes('PALM_TILT'), 'no wrist bend');
  });
  it('"both armpits need better transition": each raised arm gets its armpit and shoulder curves, the sleeve’s corner outside the armpit taken off', () => {
    const src = read(`${FV}/BoomV2.tsx`);
    assert.match(src, /out\.push\(junction\(armI, A1, mul2\(Td, -1\), L0, Ld, P2\(-side, 0\), nM, k, true\)\);/);
    assert.match(src, /<FrontPits pits=\{pits\} who=\{who\} \/>/);
    assert.match(src, /\{erase \? <Path path=\{erase\} color="black" blendMode="dstOut" \/> : null\}/);
    assert.match(src, /const PIT_DEBUG = false;/);
  });
});

/* ── "Boom side" (2026-11-24): the two approved authored pole hands on the side view ── */

const FSm = R(await import('../src/dev/frontBoomStudy.tsx'));
const PBm = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/poleHandBack.tsx'));
const PFm = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/poleHandFront.tsx'));
const PTm = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/poleHandTop.tsx'));
const PEm = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/poleHandEnd.tsx'));
const PEBm = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/poleHandEndBack.tsx'));
const PELm = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/poleHandEndLittle.tsx'));

describe('figure V2 — the boom operator from the side: the approved pole hands (Boom side)', () => {
  type P2 = { u: number; v: number };
  const rigs = FSm.SIDE_RIGS as { key: string; rig: unknown; who: unknown }[];
  const plans = rigs.map((r) => ({ key: r.key, B: BV.boomPlans(r.rig, r.who, 'side') }));
  const angle = (a: P2, b: P2) => (Math.acos(Math.min(1, Math.abs(a.u * b.u + a.v * b.v) / (Math.hypot(a.u, a.v) * Math.hypot(b.u, b.v)))) * 180) / Math.PI;
  const authored = (h: { painter?: string }) => h.painter === 'poleBack' || h.painter === 'poleFront';
  it('one named switch; the old side hands come back in one line', () => {
    assert.equal(BV.POLE_SIDE_HANDS, true);
    assert.match(read(`${FV}/BoomV2.tsx`), /export const POLE_SIDE_HANDS = true;/);
    for (const r of rigs) for (const a of BV.boomPlans(r.rig, r.who, 'side', true).arms) assert.equal(a.hand.painter, undefined, `${r.key}: oldSide`);
  });
  it('every rig says which face of each hand the side camera sees, and how far the hand is turned from the drawing', () => {
    for (const { key, B } of plans)
      for (const a of B.arms) {
        const f = a.hand.sideFace;
        assert.ok(f && (f.face === 'back' || f.face === 'palm'), `${key} ${a.hand.arm.side}`);
        assert.ok(f.turn >= 0 && f.turn <= 90);
      }
    // (the lessons' main rig: both hands seen from their backs; B11's perimeter hold: both palm sides)
    const by = (k: string) => plans.find((p) => p.key === k)!.B.arms.map((a: { hand: { sideFace: { face: string } } }) => a.hand.sideFace.face);
    assert.deepEqual(by('b04'), ['back', 'back']);
    assert.deepEqual(by('b11'), ['palm', 'palm']);
  });
  const END_KINDS = ['end', 'endBack', 'endLittle'] as const;
  const PAINTER: Record<string, string | undefined> = { end: 'poleEnd', endBack: 'poleEndBack', endLittle: 'poleEndLittle', back: 'poleBack', palm: 'poleFront', old: undefined };
  it('one look per HAND (2026-11-24): each hand an approved drawing (end-on ×3, back, palm) or its old hand saying why — never a blend', () => {
    for (const { key, B } of plans)
      for (const a of B.arms) {
        const f = a.hand.sideFace;
        assert.ok(Object.keys(PAINTER).includes(f.drawing), `${key} ${a.hand.arm.side}: ${f.drawing}`);
        assert.equal(a.hand.painter, PAINTER[f.drawing], `${key} ${a.hand.arm.side}: painter`);
        if (f.drawing === 'old') assert.ok(!f.fits && !!f.why, `${key} ${a.hand.arm.side}: says why`);
        // (exactly one placement: the painter's own)
        const placed = ['poleFront', 'poleBack', 'poleEnd', 'poleEndBack', 'poleEndLittle'].filter((k) => !!a.hand[k]);
        assert.ok(f.drawing === 'old' ? placed.length === 0 : placed.length === 1 && placed[0] === a.hand.painter, `${key} ${a.hand.arm.side}: ${placed}`);
      }
    // (what each rig carries now, hand by hand, L then R — the numbers behind each old hand are in its `why`)
    const by = (k: string) => BV.sideDrawings(plans.find((p) => p.key === k)!.B);
    assert.deepEqual(by('b04'), ['back', 'endBack'], 'B04 close: the far right hand end-on from the thumb end, toward the back of the hand');
    assert.deepEqual(by('low'), ['old', 'endBack'], 'B04 held low: the left seen from its little-finger end tilted toward its back (no drawing of that view)');
    assert.deepEqual(by('f09'), ['back', 'endBack']);
    assert.deepEqual(by('b10'), ['old', 'end'], 'B10 overhead: the far right hand end-on; the near left from its little-finger end, tilted toward its back');
    assert.deepEqual(by('b11'), ['palm', 'palm']);
    assert.deepEqual(by('b10live0'), ['old', 'end']);
    assert.deepEqual(by('b10live1'), ['palm', 'palm']);
    assert.deepEqual(by('b10live2'), ['back', 'end']);
  });
  it('the three end-on drawings only where the camera sees that view: turned past 45° from flat, within 45° of the pole at THAT end, the pole leaning its way', () => {
    let count = 0;
    for (const { key, B } of plans)
      for (const a of B.arms) {
        const f = a.hand.sideFace;
        const tag = `${key} ${a.hand.arm.side}`;
        // (every end-on drawing tried says how it fares: its forearm's lean on the page, or why it was not tried)
        assert.equal(f.tried.length, 3, `${tag}: three tried`);
        if (!END_KINDS.includes(f.drawing)) continue;
        count++;
        const A = BV.END_ART[f.drawing];
        assert.ok(f.turn > BV.SIDE_END_TURN, `${tag}: ${f.turn}`);
        assert.ok(A.at === 'thumb' ? f.thumbEnd >= BV.SIDE_END_AXIS : f.thumbEnd <= -BV.SIDE_END_AXIS, `${tag}: ${f.thumbEnd}`);
        const at = a.hand[PAINTER[f.drawing]!];
        assert.equal(at.mirror, a.hand.arm.side === 'L', `${tag}: mirror`);
        const T = A.toPage({ ...at, s: 1 });
        // the drawing's grip (the middle of the fist) on the lesson's grip point
        const F = B.vs.proj(a.hand.arm.fist);
        const g = T(A.grip);
        assert.ok(Math.hypot(g.u - F.u, g.v - F.v) < 1e-6, `${tag}: grip on the fist`);
        // its pole axis along the scene's pole, its near part toward the camera's side of the pole (≤ 1°, never reversed)
        const near = B.poleDir.z >= 0 ? B.poleDir : { x: -B.poleDir.x, y: -B.poleDir.y, z: -B.poleDir.z };
        const N = B.vs.proj({ x: a.hand.arm.fist.x + near.x * 100, y: a.hand.arm.fist.y + near.y * 100, z: a.hand.arm.fist.z + near.z * 100 });
        const ax = A.axisOnPage(at);
        const n = { u: N.u - F.u, v: N.v - F.v };
        const dirAngle = (Math.acos(Math.max(-1, Math.min(1, (ax.u * n.u + ax.v * n.v) / Math.hypot(n.u, n.v)))) * 180) / Math.PI;
        assert.ok(dirAngle < 1, `${tag}: near part ${dirAngle.toFixed(1)}°`);
        // the drawing's forearm within SIDE_END_LEAN_MAX of the rig's (directed: fist → elbow, never reversed)
        const o0 = T({ u: 0, v: 0 });
        const fe = T({ u: A.fore.u * 100, v: A.fore.v * 100 });
        const E = B.vs.proj(a.hand.arm.elbow);
        const d = { u: fe.u - o0.u, v: fe.v - o0.v };
        const e = { u: E.u - F.u, v: E.v - F.v };
        const lean = (Math.acos(Math.max(-1, Math.min(1, (d.u * e.u + d.v * e.v) / (Math.hypot(d.u, d.v) * Math.hypot(e.u, e.v))))) * 180) / Math.PI;
        assert.ok(lean <= BV.SIDE_END_LEAN_MAX, `${tag}: forearm ${lean.toFixed(1)}°`);
      }
    assert.ok(count >= 6, `${count} end-on hands`);
  });
  it('the hands seen from the little-finger end: the little-finger drawing only where it fits better than the flat one (the numbers, 2026-11-24)', () => {
    const hand = (k: string, side: 'L' | 'R') => plans.find((p) => p.key === k)!.B.arms.find((a: { hand: { arm: { side: string } } }) => a.hand.arm.side === side).hand.sideFace;
    const little = (f: { tried: { drawing: string; lean: number; fits: boolean; why?: string }[] }) => f.tried.find((t) => t.drawing === 'endLittle')!;
    // B04 close left and F09 left: the little-finger drawing's forearm would be 152° and 133° off the arm (the camera is
    // tilted toward the BACK of these hands; the approved little-finger drawing looks toward the palm) — they keep the
    // flat back-of-hand drawing (forearm 17° and 2° off)
    for (const [k, lean] of [['b04', 152], ['f09', 133]] as const) {
      const f = hand(k, 'L');
      assert.equal(f.drawing, 'back', k);
      assert.ok(Math.abs(little(f).lean - lean) < 1.5 && !little(f).fits, `${k}: ${little(f).lean}`);
    }
    // B11 left: the camera 62° off the pole — not end-on at all; the palm-side drawing stays
    assert.ok(hand('b11', 'L').thumbEnd > -BV.SIDE_END_AXIS && hand('b11', 'L').drawing === 'palm');
    // B10 dragged below the mouth, left: the little-finger drawing's forearm is 29° off, but its straight wrist would put
    // the elbow up beside the hand — not placed; the palm-side drawing stays
    const f1 = hand('b10live1', 'L');
    assert.equal(f1.drawing, 'palm');
    assert.ok(Math.abs(little(f1).lean - 29) < 1.5 && /elbow/.test(little(f1).why ?? ''), little(f1).why);
    // the two hands still on their old drawing, with the numbers: B04 held low left (little-finger drawing 164° off; the
    // flat one would need a 643 mm upper arm) and B10 overhead left (54° off, past the 40° allowed; flat: 747 mm)
    for (const [k, lean, mm] of [['low', 164, 643], ['b10', 54, 747]] as const) {
      const f = hand(k, 'L');
      assert.equal(f.drawing, 'old', k);
      assert.ok(Math.abs(little(f).lean - lean) < 1.5, `${k}: ${little(f).lean}`);
      assert.match(f.why, new RegExp(`${mm} mm`));
    }
    assert.equal(BV.SIDE_END_LEAN_MAX, 40, 'the guard is not loosened');
  });
  it('"pole within the hand": each authored hand’s pole axis lies on the rig’s pole (≤ 1°), its middle on the fist, the wrist toward the elbow', () => {
    let count = 0;
    for (const { key, B } of plans)
      for (const a of B.arms) {
        if (!authored(a.hand)) continue;
        count++;
        const at = a.hand.poleBack ?? a.hand.poleFront;
        const F = B.vs.proj(a.hand.arm.fist);
        const P1 = B.vs.proj({ x: a.hand.arm.fist.x + B.poleDir.x, y: a.hand.arm.fist.y + B.poleDir.y, z: a.hand.arm.fist.z + B.poleDir.z });
        const tag = `${key} ${a.hand.arm.side}`;
        assert.ok(angle({ u: Math.cos(at.rot), v: Math.sin(at.rot) }, { u: P1.u - F.u, v: P1.v - F.v }) < 1, `${tag}: pole axis along the pole`);
        assert.ok(Math.hypot(at.x - F.u, at.y - F.v) < 1e-6, `${tag}: the pole through the middle of the fist`);
        // the fist on the pole as drawn (the rig's pole line on the page)
        const A = B.vs.proj(B.pole.a);
        const Bp = B.vs.proj(B.pole.b);
        const d = { u: Bp.u - A.u, v: Bp.v - A.v };
        const off = Math.abs((F.u - A.u) * d.v - (F.v - A.v) * d.u) / Math.hypot(d.u, d.v);
        assert.ok(off < 1, `${tag}: the fist ${off.toFixed(2)} mm off the drawn pole`);
        const E = B.vs.proj(a.hand.arm.elbow);
        assert.ok(-Math.sin(at.rot) * (E.u - F.u) + Math.cos(at.rot) * (E.v - F.v) > 0, `${tag}: wrist toward the elbow`);
        // the left hand is the mirror image; the back of the hand drawn where it faces the camera
        assert.equal(at.mirror, a.hand.arm.side === 'L', `${tag}: mirror`);
        assert.equal(a.hand.painter, a.hand.sideFace.face === 'back' ? 'poleBack' : 'poleFront', `${tag}: face`);
        // the thumb on the side the 3-D hand has it (the drawings: palm side thumb at +x, back at −x, mirrored the other way)
        const fc = BG.boomHandFace(B.o, a.hand.arm, B.poleDir, B.vs.toward);
        const T = B.vs.proj({ x: a.hand.arm.fist.x + fc.thumb.x, y: a.hand.arm.fist.y + fc.thumb.y, z: a.hand.arm.fist.z + fc.thumb.z });
        const sgn = (a.hand.painter === 'poleFront' ? 1 : -1) * (at.mirror ? -1 : 1);
        assert.ok(sgn * (Math.cos(at.rot) * (T.u - F.u) + Math.sin(at.rot) * (T.v - F.v)) > 0, `${tag}: thumb side`);
      }
    assert.ok(count >= 4, `${count} authored hands`);
  });
  it('the wrist is straight: the sleeve’s forearm lies on the drawing’s own forearm line (≤ 1°), the sleeve’s mouth on its cuff', () => {
    for (const { key, B } of plans)
      for (const a of B.arms) {
        const kind = a.hand.sideFace?.drawing;
        const end = END_KINDS.includes(kind);
        if (!authored(a.hand) && !end) continue;
        const A = end ? BV.END_ART[kind] : null;
        const at = a.hand.poleBack ?? a.hand.poleFront ?? a.hand.poleEnd ?? a.hand.poleEndBack ?? a.hand.poleEndLittle;
        const fore = { u: a.arm.wrist.u - a.arm.elbow.u, v: a.arm.wrist.v - a.arm.elbow.v };
        const toPage = (A ? A.toPage : a.hand.painter === 'poleBack' ? PBm.poleHandBackToPage : PFm.poleHandToPage)({ ...at, s: 1 });
        // (the drawing's own forearm line: the flat drawings' −y; each end-on drawing's own forearm direction)
        const o0 = toPage({ u: 0, v: 0 });
        const fe = A ? toPage({ u: A.fore.u * 100, v: A.fore.v * 100 }) : o0;
        const own = A ? { u: o0.u - fe.u, v: o0.v - fe.v } : { u: Math.sin(at.rot), v: -Math.cos(at.rot) };
        assert.ok(angle(fore, own) < 1, `${key} ${a.hand.arm.side}: ${angle(fore, own).toFixed(2)}°`);
        const cuff = toPage(A ? A.cuff : a.hand.painter === 'poleBack' ? PBm.POLE_HAND_BACK_CUFF : PFm.POLE_HAND_CUFF);
        const mouth = a.arm.opening.e.c;
        assert.ok(Math.hypot(mouth.u - cuff.u, mouth.v - cuff.v) < 12, `${key} ${a.hand.arm.side}: the sleeve's mouth ${Math.hypot(mouth.u - cuff.u, mouth.v - cuff.v).toFixed(1)} mm from the drawing's cuff`);
        // ("upper arm length on the page never longer than its real length")
        assert.equal(BV.SIDE_UPPER_SLACK, 1);
        assert.ok(Math.hypot(a.arm.elbow.u - a.arm.shoulder.u, a.arm.elbow.v - a.arm.shoulder.v) <= BG.BOOM_ARM.upper + 0.5, `${key} ${a.hand.arm.side}: upper arm`);
        // (the forearm one straight line: the sleeve's elbow → wrist, the drawing's wrist beyond it on the same line)
        assert.ok(Number.isFinite(a.arm.elbow.u) && Number.isFinite(a.arm.wrist.u));
      }
  });
  it('the lesson’s grip points stay: every fist is the rig’s own front or rear point', () => {
    for (const r of rigs) {
      const rig = r.rig as { front: unknown; rear: unknown };
      const fists = BV.boomPlans(r.rig, r.who, 'side').arms.map((a: { hand: { arm: { fist: unknown } } }) => JSON.stringify(a.hand.arm.fist)).sort();
      assert.deepEqual(fists, [JSON.stringify(rig.front), JSON.stringify(rig.rear)].sort(), r.key);
    }
  });
  it('the frozen back-of-hand drawing only gained options (mirror re-lit, sleeve off, the scene’s pole, the figure’s scale)', () => {
    const src = read(`${FV}/poleHandBack.tsx`);
    for (const k of ['mirror?: boolean', 'sleeve?: boolean', "poleLook?: 'study' | 'boom'", 'ownScale?: boolean', 'who?: CastMember', 'export function poleHandBackOutline', 'export const POLE_HAND_BACK_CUFF', 'const BACK_LEFT_SHADING']) assert.ok(src.includes(k), k);
    // (the approved drawing's numbers are untouched)
    assert.equal(PBm.POLE_HAND_BACK.body.length, 57);
    assert.deepEqual(PBm.POLE_HAND_BACK_CUFF, { u: -1.4, v: 100 });
  });
  it('the frozen end-on drawing is used through its own exports (its numbers untouched)', () => {
    assert.equal(PEm.POLE_END_TILT, (25 * Math.PI) / 180);
    assert.equal(PEm.END_TURN, (25 * Math.PI) / 180);
    const src = read(`${FV}/BoomV2.tsx`);
    assert.match(src, /<PoleHandEnd x=\{pe\.x\} y=\{pe\.y\} s=\{1\} rot=\{pe\.rot\} mirror=\{pe\.mirror\} sleeve=\{false\} poleLook="boom" ownScale=\{false\}/);
    assert.match(src, /<PoleHandEndBack x=\{pk\.x\} y=\{pk\.y\} s=\{1\} rot=\{pk\.rot\} mirror=\{pk\.mirror\} sleeve=\{false\} poleLook="boom" ownScale=\{false\}/);
    assert.match(src, /<PoleHandEndLittle x=\{pl\.x\} y=\{pl\.y\} s=\{1\} rot=\{pl\.rot\} mirror=\{pl\.mirror\} sleeve=\{false\} poleLook="boom" ownScale=\{false\}/);
    assert.ok(!src.includes('scaleY'), 'no squash: the drawings are placed by one turn and a uniform scale');
    // (the two new end-on drawings through their own exports: the back-tilted one's forearm, the little-finger one's turn)
    assert.deepEqual(BV.END_ART.endBack.fore, PEBm.POLE_END_BACK_FORE);
    assert.ok(Math.abs(Math.atan2(BV.END_ART.endLittle.fore.v, BV.END_ART.endLittle.fore.u) - (Math.PI + PELm.END_LITTLE_TURN)) < 1e-9);
    assert.deepEqual(BV.END_ORDER, ['end', 'endBack', 'endLittle']);
    assert.equal(BV.SIDE_UPPER_SLACK, 1);
  });
  it('a hand’s own hole stays a hole: the hands’ outlines are joined as a true union, so the scene’s pole shows through the ring of skin round it', () => {
    const src = read(`${FV}/BoomV2.tsx`);
    assert.match(src, /const handsAll = hands\.reduce\(\(acc, p\) => Skia\.Path\.MakeFromOp\(acc, p, PathOp\.Union\) \?\? acc, Skia\.Path\.Make\(\)\);/);
  });
});

/* ── "Boom top" (2026-11-24): the approved hand from above on the boom operators' views from above ── */

describe('figure V2 — the boom operator from above: the approved top hand (Boom top)', () => {
  type P2 = { u: number; v: number };
  const rigs = FSm.SIDE_RIGS as { key: string; rig: unknown; who: unknown }[];
  const plans = rigs.map((r) => ({ key: r.key, B: BV.boomPlans(r.rig, r.who, 'top') }));
  const angle = (a: P2, b: P2) => (Math.acos(Math.min(1, Math.abs(a.u * b.u + a.v * b.v) / (Math.hypot(a.u, a.v) * Math.hypot(b.u, b.v)))) * 180) / Math.PI;
  it('one named switch; each hand the approved top hand where the camera sees that view, else its old hand saying why', () => {
    assert.equal(BV.POLE_TOP_HANDS, true);
    for (const { key, B } of plans)
      for (const a of B.arms) {
        assert.ok(a.hand.topFace, `${key} ${a.hand.arm.side}: topFace`);
        if (a.hand.painter === 'poleTop') assert.ok(a.hand.topFace.fits && a.hand.poleTop, key);
        else assert.ok(a.hand.painter === undefined && !a.hand.topFace.fits && !!a.hand.topFace.why, `${key} ${a.hand.arm.side}`);
      }
    const by = (k: string) => plans.find((p) => p.key === k)!.B.arms.map((a: { hand: { painter?: string } }) => a.hand.painter ?? 'old');
    for (const k of ['b04', 'b10', 'b11', 'b10live0', 'b10live2']) assert.deepEqual(by(k), ['poleTop', 'poleTop'], k);
    // (B04 held low: the palms are up — the drawing shows the backs of the fingers; F09: the left's upper arm would be 404 mm)
    assert.deepEqual(by('low'), ['old', 'old']);
    assert.deepEqual(by('f09'), ['old', 'poleTop']);
    // (the old hands from above come back in one line, as from the side)
    for (const r of rigs) for (const a of BV.boomPlans(r.rig, r.who, 'top', true).arms) assert.equal(a.hand.painter, undefined, `${r.key}: old`);
  });
  it('"pole within the hand": its pole axis on the rig’s pole through the middle of the fist; the cuff toward the elbow; the thumb on the 3-D hand’s side; the left hand mirrored', () => {
    let count = 0;
    for (const { key, B } of plans)
      for (const a of B.arms) {
        if (a.hand.painter !== 'poleTop') continue;
        count++;
        const tag = `${key} ${a.hand.arm.side}`;
        const at = a.hand.poleTop;
        const F = B.vs.proj(a.hand.arm.fist);
        const P1 = B.vs.proj({ x: a.hand.arm.fist.x + B.poleDir.x, y: a.hand.arm.fist.y + B.poleDir.y, z: a.hand.arm.fist.z + B.poleDir.z });
        assert.ok(angle({ u: Math.cos(at.rot), v: Math.sin(at.rot) }, { u: P1.u - F.u, v: P1.v - F.v }) < 1, `${tag}: pole axis`);
        assert.ok(Math.hypot(at.x - F.u, at.y - F.v) < 1e-6, `${tag}: on the fist`);
        assert.equal(at.mirror, a.hand.arm.side === 'L', `${tag}: mirror`);
        const T = PTm.poleHandTopToPage({ ...at, s: 1 });
        const E = B.vs.proj(a.hand.arm.elbow);
        const cuff = T(PTm.POLE_HAND_TOP_CUFF);
        assert.ok((cuff.u - F.u) * (E.u - F.u) + (cuff.v - F.v) * (E.v - F.v) > 0, `${tag}: cuff toward the elbow`);
        const fc = BG.boomHandFace(B.o, a.hand.arm, B.poleDir, B.vs.toward);
        const th = B.vs.proj({ x: a.hand.arm.fist.x + fc.thumb.x, y: a.hand.arm.fist.y + fc.thumb.y, z: a.hand.arm.fist.z + fc.thumb.z });
        const dt = T({ u: -40, v: 0 });
        assert.ok((dt.u - F.u) * (th.u - F.u) + (dt.v - F.v) * (th.v - F.v) > 0, `${tag}: thumb side`);
        // the wrist straight: the sleeve's forearm along the drawing's own (its +y), the mouth on its cuff
        const fore = { u: a.arm.wrist.u - a.arm.elbow.u, v: a.arm.wrist.v - a.arm.elbow.v };
        assert.ok(angle(fore, { u: Math.sin(at.rot), v: -Math.cos(at.rot) }) < 1, `${tag}: straight wrist`);
        const mouth = a.arm.opening.e.c;
        assert.ok(Math.hypot(mouth.u - cuff.u, mouth.v - cuff.v) < 12, `${tag}: the sleeve's mouth ${Math.hypot(mouth.u - cuff.u, mouth.v - cuff.v).toFixed(1)} mm from the cuff`);
        assert.ok(Math.hypot(a.arm.elbow.u - a.arm.shoulder.u, a.arm.elbow.v - a.arm.shoulder.v) <= BG.BOOM_ARM.upper + 0.5, `${tag}: upper arm`);
      }
    assert.ok(count >= 10, `${count} top hands`);
  });
  it('a hand is never cut by the shoulder line’s cut (B11 from above: the left hand’s fingers were cut off along a straight line)', () => {
    const src = read(`${FV}/BoomV2.tsx`);
    assert.match(src, /root\.behindOff = Skia\.Path\.MakeFromOp\(root\.behindOff, sil, PathOp\.Difference\) \?\? root\.behindOff;/);
    assert.match(src, /root\.clip = Skia\.Path\.MakeFromOp\(root\.clip, sil, PathOp\.Union\) \?\? root\.clip;/);
  });
  it('the approved top drawing only gained options (mirror re-lit, the scene’s pole, its frame and outline); its numbers untouched', () => {
    const src = read(`${FV}/poleHandTop.tsx`);
    for (const k of ['mirror?: boolean', "poleLook?: 'study' | 'boom'", 'export function poleHandTopToPage', 'export function poleHandTopOutline', 'mirror || rot !== 0 ? lightMapOf(rot, mirror) : IDENTITY']) assert.ok(src.includes(k), k);
    assert.deepEqual(PTm.POLE_HAND_TOP_CUFF, { u: 0, v: 71 });
    assert.equal(PTm.POLE_HAND_TOP.body.length, 38);
    // (the frame: the art's origin on the page point, its +x along the turn, mirrored for a left hand)
    const T = PTm.poleHandTopToPage({ x: 10, y: 20, s: 2, rot: Math.PI / 2, mirror: true });
    const q = T({ u: 1, v: 0 });
    assert.ok(Math.abs(q.u - 10) < 1e-9 && Math.abs(q.v - 18) < 1e-9);
  });
});

/* ── B10 (2026-11-24): the operator's fists over the engine's pole; her hands' drawings held through a drag ── */

describe('figure V2 — B10: the fists painted again over the engine’s pole, side and top; one drawing per hand through a drag', () => {
  const who = (FSm.SIDE_RIGS as { key: string; who: unknown }[]).find((r) => r.key === 'b10')!.who;
  it('the store is read as an external store (no missed first update: the operator and her fists always draw the same rig)', () => {
    const src = read(`${FV}/heldLive.tsx`);
    assert.match(src, /useSyncExternalStore\(ctx \? ctx\.src\.subscribe : noSubscribe, ctx \? ctx\.src\.snapshot : noSnapshot\)/);
    assert.ok(!/tick\(\(n\) => n \+ 1\)/.test(src), 'no hand-made subscription');
  });
  it('the fists are painted again from above too; the hands pass never gives invertClip without a clip', () => {
    const scene = read('src/screens/lab/miking/lessons/b10Sideline/scene.tsx');
    assert.match(scene, /if \(!live\) return null;\n  return <BoomOperatorV2 view=\{view === 'side' \? 'side' : 'top'\} rig=\{rig\} who=\{WHO\.operator\} dim=\{B10_OPERATOR_DIM\} part="hands" hold=\{hold\} \/>;/);
    const src = read(`${FV}/BoomV2.tsx`);
    assert.ok(!src.includes('invertClip={a.far && !!hide}'), 'the old wrapper (clip undefined, invertClip false) is gone');
    for (const m of src.matchAll(/invertClip(=\{[^}]*\})?/g)) assert.ok(!m[1] || m[1] === '={true}', `invertClip given only as true: ${m[0]}`);
  });
  it('the side hands keep their drawing through a drag: along a sweep of the mic and back, no hand flips back and forth', () => {
    const path: { d: number; e: number }[] = [];
    for (let e = 80; e >= 20; e -= 2) path.push({ d: 800, e });
    for (let e = 20; e <= 80; e += 2) path.push({ d: 800, e });
    for (let d = 1000; d >= 450; d -= 10) path.push({ d, e: 45 });
    for (let d = 450; d <= 1000; d += 10) path.push({ d, e: 45 });
    let hold: string[] | undefined;
    const seq: string[][] = [];
    for (const p of path) {
      const r = (p.e * Math.PI) / 180;
      const front = { x: p.d * Math.cos(r), y: -p.d * Math.sin(r), z: 0 };
      const l = Math.hypot(front.x, front.y);
      const rig = FSm.b10LiveRig(front, { x: -front.x / l, y: -front.y / l, z: 0 });
      if (!rig) continue;
      hold = BV.sideDrawings(BV.boomPlans(rig, who, 'side', false, hold ? { side: hold } : undefined));
      seq.push(hold);
    }
    assert.ok(seq.length > 100, `${seq.length} positions`);
    // (a flicker: A → B → A within a few steps)
    for (let h = 0; h < 2; h++)
      for (let i = 2; i < seq.length; i++) assert.ok(!(seq[i][h] === seq[i - 2][h] && seq[i - 1][h] !== seq[i][h]), `hand ${h} flickers at ${i}: ${seq[i - 2][h]} → ${seq[i - 1][h]} → ${seq[i][h]}`);
  });
});

describe('figure V2 — F09 and B11: the front fist painted again over the engine’s boom (opt-in, 2026-11-24)', () => {
  it('an opt-in the engine draws after its mounts; only F09 and B11 give it, each only while she holds a placed boom', () => {
    const ps = read('src/screens/lab/miking/engine/scene/PlacementScene.tsx');
    assert.match(ps, /\{art\.poleHandsOver \? <FigureScale ptPerMm=\{base\.s\}>\{art\.poleHandsOver\(\{ view, variant, micTypes, setup: zoneIds \}\)\}<\/FigureScale> : null\}/);
    assert.match(read('src/screens/lab/miking/engine/scene/sceneTypes.ts'), /poleHandsOver\?: \(props: \{ view: ViewId; variant: VariantId; micTypes\?: readonly string\[\]; setup\?: readonly string\[\] \}\) => ReactNode;/);
    assert.match(read('src/screens/lab/miking/lessons/f09LocationSpeech/art.tsx'), /poleHandsOver: LocationHandsOver,/);
    assert.match(read('src/screens/lab/miking/lessons/b11Athletes/art.tsx'), /poleHandsOver: B11HandsOver,/);
    const f09 = read('src/screens/lab/miking/lessons/f09LocationSpeech/scene.tsx');
    assert.match(f09, /if \(!V2 \|\| !onSet\(variant\) \|\| operatorMode\(micTypes\) !== 'stub'\) return null;/);
    assert.match(f09, /<Group clip=\{fistDisk\(view, GRIP\)\}>\n      <BoomOperatorV2 view=\{view === 'side' \? 'side' : 'top'\} rig=\{RIG_STUB\} who=\{OP_WHO\} part="hands" \/>\n    <\/Group>/);
    const b11 = read('src/screens/lab/miking/lessons/b11Athletes/scene.tsx');
    assert.match(b11, /if \(!V2 \|\| variant !== 'coach' \|\| !micTypes\?\.includes\('locBoomSgCap'\)\) return null;/);
    // (no other lesson gives it)
    let n = 0;
    for (const id of ['b04BoomCamera', 'b10Sideline', 'f02Clothing', 'f08Passby']) if (/poleHandsOver/.test(read(`src/screens/lab/miking/lessons/${id}/art.tsx`))) n++;
    assert.equal(n, 0);
  });
});

describe('figure V2 — either arm on either hand (B10 overhead, 2026-11-24)', () => {
  const neck = { x: 0, y: 0, z: 0 };
  const o = BVm.operatorFrame(neck, { x: -1, y: 0, z: 0 });
  const sh = { R: { x: 0, y: 30, z: -168 }, L: { x: 0, y: 30, z: 168 } };
  const front = { x: -120, y: -620, z: -60 };
  const rear = { x: 140, y: -600, z: 80 };
  it('both assignments give two whole arms (finite joints, each fist on its point)', () => {
    for (const ra of ['L', 'R'] as const)
      for (const el of ['forward', 'beside'] as const) {
        const arms = BVm.boomArms(o, sh, front, rear, ra, el);
        assert.equal(arms.length, 2);
        const fists = arms.map((a: { fist: { x: number } }) => a.fist.x).sort((p: number, q: number) => p - q);
        assert.deepEqual(fists, [front.x, rear.x].sort((p, q) => p - q), `${ra}/${el}: one arm on each point`);
        for (const a of arms) for (const k of ['x', 'y', 'z'] as const) assert.ok(Number.isFinite(a.elbow[k]) && Number.isFinite(a.shoulder[k]));
      }
  });
  it("'beside' keeps the elbows back of the 'forward' default (the hands above the head: nothing crosses the face)", () => {
    const fw = BVm.boomArms(o, sh, front, rear, 'R', 'forward');
    const bs = BVm.boomArms(o, sh, front, rear, 'R', 'beside');
    // (the operator faces −x: farther back is larger x)
    for (let i = 0; i < 2; i++) assert.ok(bs[i].elbow.x >= fw[i].elbow.x - 1, `${bs[i].side}: ${bs[i].elbow.x} vs ${fw[i].elbow.x}`);
  });
  it('the B10 overhead rig: the arms are assigned so neither crosses the face, the elbows beside the head', () => {
    const src = read('src/screens/lab/miking/lessons/b10Sideline/scene.tsx');
    assert.match(src, /overhead: \{.*rearArm: 'R', elbows: 'beside' \}/);
    assert.match(src, /const B10_REAR_ARM: 'L' \| 'R' = 'R';/);
    assert.match(src, /rearArm: B10_REAR_ARM, elbows: 'beside' \}/);
  });
});
