/**
 * FIGURE V2 — WAVE 5, THE FAMILIES WITH THEIR OWN FIGURE (must-do D78,
 * 2026-11-24). First family: the bowed strings (C09a violin, C09b viola, C09c
 * cello, C06a/b double bass). Checked here:
 *   • ONE SWITCH (familyBowed) turns the whole player new in every picture of
 *     these lessons (scene side and top, the placement studio, the setting
 *     plans): sceneGroups draws the person in the approved look, the
 *     instrument and bow exactly as before, the chair as before;
 *   • NOTHING OF THE POSTURE MOVES: each drawn wrist is the posed hand's own
 *     wrist, each elbow the posture's own, the head the posture's own — the
 *     hit areas, keep-outs, mics and readouts read the posture, not the
 *     drawing, so no learner-facing number can change;
 *   • THE HAND (familyHand): one wrist out of the cuff; each digit one form
 *     (at most one per layer); the thumb's own line only toward its end (no
 *     line along its hand side); a hand split by what it holds keeps its
 *     thumb behind the bow's stick / the neck;
 *   • the cast: each instrument always the same person.
 * Reads normalise CRLF.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const R = <T>(m: T): T => (m as { default?: T }).default ?? m;
const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const L = 'src/screens/lab/miking/lessons';

const PO = R(await import('../src/screens/lab/miking/lessons/shared/bowed/posture.ts'));
const SP = R(await import('../src/screens/lab/miking/lessons/shared/bowed/bowedSpec.ts'));
const BH = R(await import('../src/screens/lab/miking/lessons/shared/bowed/bowedHands.ts'));
const BA = R(await import('../src/screens/lab/miking/lessons/shared/bowed/BowedArt.tsx'));
const BF = R(await import('../src/screens/lab/miking/lessons/shared/bowed/bowedFigureV2.tsx'));
const FV = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/familyV2.tsx'));
const FH = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/familyHand.ts'));
const CAST = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/cast.ts'));
const CFG = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/figureV2Config.ts'));
const SPV = R(await import('../src/screens/lab/miking/lessons/shared/smallperc/smallPercV2.tsx'));
const BRP = R(await import('../src/screens/lab/miking/lessons/shared/brass/brassPosture.ts'));
const BRS = R(await import('../src/screens/lab/miking/lessons/shared/brass/brassSpec.ts'));
const BRA = R(await import('../src/screens/lab/miking/lessons/shared/brass/BrassArt.tsx'));
const BRF = R(await import('../src/screens/lab/miking/lessons/shared/brass/brassFigureV2.tsx'));
const LBS = R(await import('../src/screens/lab/miking/lessons/shared/lowbrass/lowBrassSpec.ts'));
const LBC = R(await import('../src/screens/lab/miking/lessons/shared/lowbrass/lowBrassScene.ts'));
const LBA = R(await import('../src/screens/lab/miking/lessons/shared/lowbrass/LowBrassArt.tsx'));
const SXS = R(await import('../src/screens/lab/miking/lessons/shared/sax/saxSpec.ts'));
const SXP = R(await import('../src/screens/lab/miking/lessons/shared/sax/saxPosture.ts'));
const SXH = R(await import('../src/screens/lab/miking/lessons/shared/sax/saxHands.ts'));
const SXF = R(await import('../src/screens/lab/miking/lessons/shared/sax/saxFigureV2.tsx'));
const WH = R(await import('../src/screens/lab/miking/lessons/shared/woodwinds/windHands.ts'));
const WF = R(await import('../src/screens/lab/miking/lessons/shared/woodwinds/windFigureV2.tsx'));
const ACF = R(await import('../src/screens/lab/miking/lessons/shared/freereed/accordionFigureV2.tsx'));
const FRH = R(await import('../src/screens/lab/miking/lessons/shared/freereed/freeReedHands.ts'));
const HMF = R(await import('../src/screens/lab/miking/lessons/shared/freereed/harmonicaFigureV2.tsx'));
const WL = {
  fl: R(await import('../src/screens/lab/miking/lessons/a06Flute/geometry.ts')).layoutOf,
  pc: R(await import('../src/screens/lab/miking/lessons/a07Piccolo/geometry.ts')).layoutOf,
  cl: R(await import('../src/screens/lab/miking/lessons/a08aClarinet/geometry.ts')).layoutOf,
  bc: R(await import('../src/screens/lab/miking/lessons/a08bBassClarinet/geometry.ts')).layoutOf,
  ob: R(await import('../src/screens/lab/miking/lessons/a09aOboe/geometry.ts')).layoutOf,
  bs: R(await import('../src/screens/lab/miking/lessons/a09bBassoon/geometry.ts')).layoutOf,
};

type V3 = { x: number; y: number; z: number };
const CASES = [
  { id: 'violin standing', P: PO.underChin(SP.VIOLIN, 0, false), bow: true },
  { id: 'violin seated', P: PO.underChin(SP.VIOLIN, 0, true), bow: true },
  { id: 'viola', P: PO.underChin(SP.VIOLA, 20, false), bow: true },
  { id: 'cello', P: PO.seated(SP.CELLO), bow: true },
  { id: 'bass bowed', P: PO.standing(SP.BASS, 'bow'), bow: true },
  { id: 'bass plucked', P: PO.standing(SP.BASS, 'pluck'), bow: false },
];
const VIEWS = ['side', 'top'] as const;
const proj = (view: 'side' | 'top', p: { x: number; y: number; z: number }) => (view === 'side' ? { u: p.x, v: p.y } : { u: p.x, v: p.z });
const d2 = (a: { u: number; v: number }, b: { u: number; v: number }) => Math.hypot(a.u - b.u, a.v - b.v);

function planOf(P: unknown, view: 'side' | 'top', bow: boolean) {
  const D = BH.drawnHands(P, bow && (P as { strokes: unknown[] }).strokes.length > 0);
  const fi = BF.bowedFamIn(D.P, D, view, bow, (a: never) => BA.cutFor(view, a));
  assert.ok(fi, 'the figure input');
  return { D, fi, fp: FV.famPlan(fi) };
}

describe('wave 5 — the bowed strings in the approved look', () => {
  it('one switch, on; each instrument always the same cast member', () => {
    assert.equal(CFG.figureV2On('familyBowed'), true);
    assert.equal(CAST.ROLES['bowed.violin'], 'ana');
    assert.equal(CAST.ROLES['bowed.viola'], 'ruth');
    assert.equal(CAST.ROLES['bowed.cello'], 'kofi');
    assert.equal(CAST.ROLES['bowed.bass'], 'mei');
    // a setting plan's neighbor on the lesson's own instrument is another person
    assert.notEqual(CAST.ROLES['bowed.second'], CAST.ROLES['bowed.violin']);
    assert.notEqual(CAST.ROLES['bowed.second'], CAST.ROLES['bowed.cello']);
    for (const c of CASES) assert.equal(BF.bowedPlayer(c.P).id, CAST.ROLES[`bowed.${c.P.spec.id}` as keyof typeof CAST.ROLES]);
  });

  it('the scene: the person new (behind and over the instrument), the instrument and bow unchanged, no old figure part', () => {
    for (const c of CASES)
      for (const view of VIEWS) {
        const neu = BA.sceneGroups(c.P, view, { bow: c.bow, v2: true });
        const old = BA.sceneGroups(c.P, view, { bow: c.bow, v2: false });
        const keys = neu.map((g: { key: string }) => g.key);
        assert.ok(keys.includes('figureV2') && keys.includes('figureV2Front'), `${c.id} ${view}: ${keys.join(',')}`);
        // (no old figure group: no head, torso, arm or hand of the old look)
        for (const k of keys) assert.ok(['figureV2', 'figureV2Contact', 'figureV2Front', 'instrument', 'chair', 'chairLegs'].includes(k), `${c.id} ${view}: old part ${k}`);
        const inst = (gs: { key: string; items: unknown[] }[]) => gs.find((g) => g.key === 'instrument')!.items.length;
        assert.equal(inst(neu), inst(old), `${c.id} ${view}: the instrument's items`);
        // the person whole BEHIND the instrument, again over it
        const at = (k: string) => keys.indexOf(k);
        assert.ok(at('figureV2') < at('instrument') && at('instrument') < at('figureV2Front'), `${c.id} ${view}: the order`);
      }
  });

  it('nothing of the posture moves: wrists, elbows, shoulders and head are the posture’s own', () => {
    for (const c of CASES)
      for (const view of VIEWS) {
        const { D, fp } = planOf(c.P, view, c.bow);
        for (const a of fp.arms) {
          const ph = a.side === 'L' ? D.L : D.R;
          assert.ok(d2(a.hand.wrist, proj(view, ph.sk.frame.o)) < 0.01, `${c.id} ${view} ${a.side}: the wrist`);
          assert.ok(d2(a.elbow2, proj(view, ph.elbow)) < 0.01, `${c.id} ${view} ${a.side}: the elbow`);
          // (the shoulder: the joint itself, or — a sleeve in profile — its root held inside the back's line, never far)
          // (the far sleeve in profile is drawn behind the body: its root is tucked in further)
          const lim = a.far ? 150 : 130;
          assert.ok(d2(a.arm.shoulder, proj(view, ph.shoulder)) < lim, `${c.id} ${view} ${a.side}: the shoulder ${d2(a.arm.shoulder, proj(view, ph.shoulder)).toFixed(0)} mm`);
          // the cuff ends AT the wrist crease (coordinator 2026-11-24: no band of bare forearm): the opening's
          // centre within 8 mm of the wrist on the page
          const op = a.arm.opening.e.c;
          assert.ok(d2(op, a.hand.wrist) < 8, `${c.id} ${view} ${a.side}: the cuff ends ${d2(op, a.hand.wrist).toFixed(1)} mm from the wrist`);
        }
        if (fp.side) {
          const h = (D.P as { player: { head: { x: number; y: number; z: number } } }).player.head;
          assert.ok(d2(fp.side.pose.head.c, proj('side', h)) < 0.01, `${c.id}: the head`);
        }
      }
  });

  it('the hand: one wrist from the cuff, each digit one form per layer, the thumb’s line only at its end', () => {
    for (const c of CASES)
      for (const view of VIEWS) {
        const { fp } = planOf(c.P, view, c.bow);
        for (const a of fp.arms) {
          const h = a.hand;
          const where = `${c.id} ${view} ${a.side}`;
          const palms = h.parts.filter((p: { name: string }) => p.name === 'palm');
          assert.equal(palms.length, 1, `${where}: one palm`);
          for (const n of ['thumb', 'index', 'middle', 'ring', 'little']) {
            const ps = h.parts.filter((p: { name: string }) => p.name === n);
            assert.ok(ps.length >= 1 && ps.length <= 2, `${where}: ${n} drawn as ${ps.length} forms`);
            if (ps.length === 2) assert.notEqual(ps[0].layer, ps[1].layer, `${where}: ${n} split only by the cut`);
          }
          // the wrist's skin starts at the cuff's opening
          const { e, out } = a.arm.opening;
          const from = { u: e.c.u + out.u * 2, v: e.c.v + out.v * 2 };
          assert.ok(FH.familyHandCovers(h, from), `${where}: the wrist's skin out of the cuff`);
          // the thumb's own line: never near its root (no line along its hand side)
          const thumb = h.parts.find((p: { name: string }) => p.name === 'thumb');
          const root = thumb.axis[0];
          const reach = d2(thumb.axis[0], thumb.axis[1]);
          for (const ed of h.edges)
            for (const q of ed.pts) {
              const onThumb = thumb.form.some((t: { u: number; v: number }) => d2(t, q) < 0.01);
              if (onThumb) assert.ok(d2(q, root) > 0.5 * reach, `${where}: a thumb line ${d2(q, root).toFixed(1)} mm from its root (reach ${reach.toFixed(0)})`);
            }
        }
      }
  });

  it('brass and low brass: the person new, the horn unchanged, the posture unmoved, the lips on the mouthpiece', () => {
    const BP = BRP;
    for (const [id, P] of [['trumpet', BP.valvedPose(BRS.TRUMPET)], ['flugelhorn', BP.valvedPose(BRS.FLUGELHORN)], ['trombone', BP.slidePose(BRS.TENOR)], ['bass trombone', BP.slidePose(BRS.BASS_TB)]] as const)
      for (const view of VIEWS) {
        const neu = BRA.sceneGroups(P, view, { v2: true });
        const old = BRA.sceneGroups(P, view, { v2: false });
        const horn = (gs: { key: string }[]) => gs.filter((g) => /^(t\.|bell|valve|rotors|mouthpiece)/.test(g.key)).length;
        assert.equal(horn(neu), horn(old), `${id} ${view}: the horn`);
        for (const g of neu) assert.ok(/^(t\.|bell|valve|rotors|mouthpiece|figureV2|figureV2Front)/.test(g.key), `${id} ${view}: old part ${g.key}`);
        const fp = FV.famPlan(BRF.brassFamIn(P, view));
        for (const a of fp.arms) assert.ok(d2(a.hand.wrist, proj(view, P.hands[a.side as 'L' | 'R'].sk.frame.o)) < 0.01, `${id} ${view} ${a.side}: the wrist`);
        if (fp.side) {
          // the mouth's front is drawn at the lips (sidePlan's MOUTH_FRONT, 89.5/59.8 head units)
          const h = fp.side.plan.head;
          const lips = proj('side', P.lips);
          const mouthX = Math.max(...h.lips.map((q: { u: number }) => q.u));
          assert.ok(Math.abs(mouthX - lips.u) < 12, `${id}: the lips ${Math.abs(mouthX - lips.u).toFixed(1)} mm from the mouthpiece`);
        }
      }
    for (const sp of [LBS.HORN, LBS.TUBA, LBS.EUPH])
      for (const o of sp.orients) {
        const sc = LBC.brassScene(sp, o);
        for (const view of VIEWS) {
          const keys = LBA.sceneItems(sc, view, { v2: true }).map((it: { key: string }) => it.key);
          assert.ok(keys.includes('figureV2') && keys.includes('figureV2Front') && keys.includes('chair'), `${sp.id} ${o} ${view}: ${keys.join(',')}`);
          for (const k of ['torso', 'head', 'handL', 'handR', 'upperL', 'upperR', 'legFar']) assert.ok(!keys.includes(k), `${sp.id} ${o} ${view}: old ${k}`);
        }
      }
  });

  it('saxophones and woodwinds: the person new, the posture unmoved, every lesson’s own player one person', () => {
    for (const row of [SXS.SOPRANO, SXS.ALTO, SXS.TENOR, SXS.BARITONE])
      for (const k of ['standing', 'seated'] as const) {
        const P = SXP.saxPosture(row, k);
        const H = SXH.saxHands(P);
        for (const view of VIEWS) {
          const fig = SXF.saxFigure(P, view);
          for (const a of fig.fp.arms) assert.ok(d2(a.hand.wrist, proj(view, H[a.side as 'L' | 'R'].sk.frame.o)) < 0.01, `${row.id} ${k} ${view} ${a.side}: the wrist`);
          assert.ok(fig.region, `${row.id} ${k} ${view}: the hands over the horn`);
        }
      }
    const lays = [WL.fl('') , WL.pc('standing'), WL.pc('seated'), WL.cl('seated'), WL.cl('standing'), WL.bc(''), WL.ob('seated'), WL.bs('seated')];
    for (const L of lays) {
      const H = WH.windHands(L);
      for (const view of VIEWS) {
        const fi = WF.windFamIn(L, view);
        assert.equal(fi.view, view === 'side' ? 'front' : 'top');
        const fp = FV.famPlan(fi);
        for (const a of fp.arms) assert.ok(d2(a.hand.wrist, proj(view, H[a.side as 'L' | 'R'].sk.frame.o)) < 0.01, `${L.spec.id} ${view} ${a.side}: the wrist`);
        if (fp.front) assert.ok(d2(fp.front.pose.head.c, proj('side', L.body.head.c)) < 0.01, `${L.spec.id}: the head`);
      }
    }
    // the section plan: each row's five seats five different people
    for (const row of [['picc', 'fl2', 'fl1', 'ob1', 'ob2'], ['bcl', 'cl2', 'cl1', 'bsn1', 'bsn2']]) assert.equal(new Set(row.map((k) => WF.WIND_SEATS[k])).size, 5);
  });

  it('small percussion: the player, arms and hands new behind one switch; each cuff ends at its wrist', () => {
    assert.equal(CFG.figureV2On('familySmallPerc'), true);
    assert.equal(CAST.ROLES['smallperc.player'], 'ruth');
    const pl = read(`${L}/shared/smallperc/Player.tsx`);
    for (const k of ['PlayerSideV2SP', 'PlayerTopV2SP', 'Arm2DV2']) assert.ok(pl.includes(`<${k} `), k);
    assert.match(read(`${L}/shared/smallperc/HeldHand.tsx`), /<HeldHandV2 /);
    for (const f of ['i05aCowbell/art.tsx', 'i05cWoodblock/art.tsx']) assert.match(read(`${L}/${f}`), /<SPHand3 /, f);
    // the stick passes THROUGH the stick hand: the plane through the stick, square to the view
    const c = SPV.stickCut('side', { x: 0, y: 0, z: 0 }, { x: 100, y: 0, z: 0 });
    assert.ok(Math.abs(c.n.z - 1) < 1e-9 && Math.abs(c.n.x) < 1e-9);
    // the sleeve ends at the wrist
    const a = SPV.spArm([0, -1400], [40, -1110], [160, -880]);
    const op = a.opening.e.c;
    assert.ok(Math.hypot(op.u - 160, op.v + 880) < 8, `the cuff ${Math.hypot(op.u - 160, op.v + 880).toFixed(1)} mm from the wrist`);
  });

  it('lutes and free reeds: one switch each, the cast, the posed hands unmoved (the accordion face-on turned, not mirrored)', () => {
    for (const k of ['familyLutes', 'familyFreeReeds']) assert.equal(CFG.figureV2On(k), true, k);
    assert.equal(CAST.ROLES['lute.oud'], 'kofi');
    assert.equal(CAST.ROLES['lute.sitar'], 'ana');
    assert.equal(CAST.ROLES['lute.veena'], 'mei');
    assert.equal(CAST.ROLES['freereed.harmonica'], 'kofi');
    assert.equal(CAST.ROLES['freereed.accordion'], 'ruth');
    const R0 = FRH.accRightHand();
    for (const view of ['side', 'top'] as const) {
      const fi = ACF.accFamIn(175, 350, view);
      assert.deepEqual(fi.arms.R.sk.frame.o, R0.sk.frame.o, view);
      assert.deepEqual(fi.arms.R.elbow, R0.E);
    }
    // face-on: (x, y, z) → (−z, y, x): the page's u = −z, as the lesson's own front view
    const ff = ACF.accFamIn(175, 350, 'front');
    assert.ok(Math.abs(ff.arms.R.sk.frame.o.x + R0.sk.frame.o.z) < 1e-9 && Math.abs(ff.arms.R.sk.frame.o.z - R0.sk.frame.o.x) < 1e-9);
    assert.equal(ff.arms.L.handElsewhere, true);
    // from the player's right the left hand (on the bass end) lies behind the instrument
    assert.equal(ACF.accFamIn(175, 350, 'side').arms.L.front, false);
    for (const st of ['open', 'half', 'cupped'] as const) {
      const H = FRH.hmHands(st);
      const fi = HMF.hmFamIn(st, 'side', 1500, { u: -90, v: -52 });
      assert.deepEqual(fi.arms.L.sk.frame.o, H.L.sk.frame.o);
      assert.deepEqual(fi.arms.R.sk.frame.o, H.R.sk.frame.o);
    }
    const acc = read(`${L}/a11Accordion/art.tsx`);
    for (const k of ['view="front" part="back"', 'view="side" part="front"', 'view="top" part="front"', '<AccLeftHandFrontV2 ']) assert.ok(acc.includes(k), k);
  });

  it('every family hand is an adult hand: wrist crease to the middle fingertip 160–200 mm along the hand, the cuff at the wrist', () => {
    const along = (sk: { frame: { o: V3 }; fingers: { joints: V3[] }[] }) => {
      const j = sk.fingers[1].joints;
      const l = (a: V3, b: V3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
      return l(j[0], sk.frame.o) + l(j[1], j[0]) + l(j[2], j[1]) + l(j[3], j[2]);
    };
    const check = (id: string, fp: { arms: { side: string; hand: { wrist: { u: number; v: number } }; arm: { opening: { e: { c: { u: number; v: number } } } } }[] }, sks: Record<string, { frame: { o: V3 }; fingers: { joints: V3[] }[] }>) => {
      for (const a of fp.arms) {
        const L0 = along(sks[a.side]);
        assert.ok(L0 >= 160 && L0 <= 200, `${id} ${a.side}: ${L0.toFixed(0)} mm`);
        assert.ok(d2(a.arm.opening.e.c, a.hand.wrist) < 8, `${id} ${a.side}: the cuff ${d2(a.arm.opening.e.c, a.hand.wrist).toFixed(1)} mm from the wrist`);
      }
    };
    for (const c of CASES)
      for (const view of VIEWS) {
        const { D, fp } = planOf(c.P, view, c.bow);
        check(`${c.id} ${view}`, fp, { L: D.L.sk, R: D.R.sk });
      }
    for (const [id, P] of [['trumpet', BRP.valvedPose(BRS.TRUMPET)], ['trombone', BRP.slidePose(BRS.TENOR)]] as const)
      for (const view of VIEWS) check(`${id} ${view}`, FV.famPlan(BRF.brassFamIn(P, view)), { L: P.hands.L.sk, R: P.hands.R.sk });
    for (const row of [SXS.SOPRANO, SXS.ALTO, SXS.TENOR, SXS.BARITONE]) {
      const P = SXP.saxPosture(row, 'standing');
      const H = SXH.saxHands(P);
      for (const view of VIEWS) check(`${row.id} ${view}`, SXF.saxFigure(P, view).fp, { L: H.L.sk, R: H.R.sk });
    }
    for (const L of [WL.fl(''), WL.cl('seated'), WL.ob('seated'), WL.bs('seated')]) {
      const H = WH.windHands(L);
      for (const view of VIEWS) check(`${L.spec.id} ${view}`, FV.famPlan(WF.windFamIn(L, view)), { L: H.L.sk, R: H.R.sk });
    }
  });

  it('the shared painter: the head and the near leg go over the instrument whole; two legs always; each hand layer one fill', () => {
    const fam = read(`${L}/shared/figureV2/familyV2.tsx`);
    assert.match(fam, /SP\.skull, SP\.jaw, SP\.noseSide/);
    assert.match(fam, /unionOf\(\.\.\.ps\.map\(windingOf\)\)/);
    assert.match(fam, /TWO LEGS/);
    const hand = read(`${L}/shared/figureV2/familyHandV2.tsx`);
    assert.match(hand, /if \(q\.kind !== 'digit'\) return null;/);
  });

  it('source: the old figure stays for the switch off; the setting plan paints the new person', () => {
    const art = read(`${L}/shared/bowed/BowedArt.tsx`);
    assert.match(art, /opts\.v2 \?\? figureV2On\('familyBowed'\)/);
    assert.match(art, /if \(it\.node\) return it\.node;/);
    const plan = read(`${L}/shared/bowed/BowedSettingPage.tsx`);
    assert.match(plan, /it\.node \? \(/);
  });
});

/* ── THE PAINTER'S RULES FOR EVERY POSED HAND IN EVERY VIEW (coordinator 2026-11-24, from the reviewers' notes on
   the family, piano, harp, guitar and mallet pages): one skin, no row of equal bumps, no fingertip cut loose, a
   thumb that reads as a thumb. Checked on every family plan the painter draws. ── */
describe('the family hand painter — rules for every posed hand', () => {
  type Pt2 = { u: number; v: number };
  type Part = { name: string; layer: string; depth: number; pieces: Pt2[][]; form: Pt2[]; kind: string; root?: Pt2; rootLen?: number };
  type Hand = { parts: Part[] };
  const plans = (): { id: string; fp: { arms: { side: string; hand: Hand }[] } }[] => {
    const out: { id: string; fp: { arms: { side: string; hand: Hand }[] } }[] = [];
    for (const c of CASES) for (const view of VIEWS) out.push({ id: `${c.id} ${view}`, fp: planOf(c.P, view, c.bow).fp });
    for (const [id, P] of [['trumpet', BRP.valvedPose(BRS.TRUMPET)], ['flugelhorn', BRP.valvedPose(BRS.FLUGELHORN)], ['trombone', BRP.slidePose(BRS.TENOR)], ['bass trombone', BRP.slidePose(BRS.BASS_TB)]] as const)
      for (const view of VIEWS) out.push({ id: `${id} ${view}`, fp: FV.famPlan(BRF.brassFamIn(P, view)) });
    for (const row of [SXS.SOPRANO, SXS.ALTO, SXS.TENOR, SXS.BARITONE]) for (const view of VIEWS) out.push({ id: `${row.id} ${view}`, fp: SXF.saxFigure(SXP.saxPosture(row, 'standing'), view).fp });
    for (const L of [WL.fl(''), WL.pc('standing'), WL.cl('seated'), WL.bc(''), WL.ob('seated'), WL.bs('seated')]) for (const view of VIEWS) out.push({ id: `${L.spec.id} ${view}`, fp: FV.famPlan(WF.windFamIn(L, view)) });
    return out;
  };
  const inPoly = (q: Pt2, poly: Pt2[]) => {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const a = poly[i];
      const b = poly[j];
      if (a.v > q.v !== b.v > q.v && q.u < ((b.u - a.u) * (q.v - a.v)) / (b.v - a.v) + a.u) c = !c;
    }
    return c;
  };
  const ALL = plans();

  it('ONE SKIN: a digit is painted on the layer’s own fill and light (no step, seam or bounded pale patch), its own shading fading out toward its root', () => {
    assert.ok(ALL.length >= 40, `every family plan checked (${ALL.length})`);
    const src = read(`${L}/shared/figureV2/familyHandV2.tsx`);
    // (the digit's base: the layer's own gradient and the palm's own light, the same numbers)
    assert.match(src, /lit\.g0\[0\]\.u, lit\.g0\[0\]\.v\)\} end=\{vec\(lit\.g0\[1\]\.u, lit\.g0\[1\]\.v\)\} colors=\{HAND\}/);
    assert.match(src, /colors=\{PALM_LIGHT\}/);
    assert.doesNotMatch(src, /const Ld = \{ u: -0\.32, v: -0\.95 \}/, 'no digit gradient of its own');
    assert.match(src, /blendMode="dstOut"/, 'the root fade');
    // every digit that grows out of the hand carries its root, so its own shading fades into the hand there
    for (const { id, fp } of ALL)
      for (const a of fp.arms)
        for (const p of a.hand.parts)
          if (p.kind === 'digit' && p.root) assert.ok((p.rootLen ?? 0) > 0, `${id} ${a.side} ${p.name}: the root's length`);
  });

  it('NO ROW OF BUMPS: neighboring fingers share the web a third of the way up — no notch between knuckles', () => {
    for (const { id, fp } of ALL)
      for (const a of fp.arms) {
        const fingers = ['index', 'middle', 'ring', 'little'].map((n) => a.hand.parts.find((p) => p.name === n && p.kind === 'digit' && p.root));
        for (let i = 0; i < 3; i++) {
          const fa = fingers[i];
          const fb = fingers[i + 1];
          if (!fa || !fb || fa.layer !== fb.layer || !fa.root || !fb.root) continue;
          const gap = Math.hypot(fa.root.u - fb.root.u, fa.root.v - fb.root.v);
          if (gap > 40) continue; // (seen end-on through the hand: the roots far apart on the page)
          const mid = { u: (fa.root.u + fb.root.u) / 2, v: (fa.root.v + fb.root.v) / 2 };
          const covered = a.hand.parts.some((p) => p.layer === fa.layer && p.pieces.some((pc) => inPoly(mid, pc)));
          assert.ok(covered, `${id} ${a.side}: a notch between the ${fa.name} and ${fb.name} knuckles`);
        }
      }
  });

  it('NO LOOSE FINGERTIP: a digit split by what it holds keeps its pieces joined at a shared joint (each piece overlaps the next on the page)', () => {
    for (const { id, fp } of ALL)
      for (const a of fp.arms)
        for (const name of ['thumb', 'index', 'middle', 'ring', 'little']) {
          const ps = a.hand.parts.filter((p) => p.name === name && p.kind === 'digit');
          if (ps.length < 2) continue;
          const rooted = ps.filter((p) => p.root);
          assert.equal(rooted.length, 1, `${id} ${a.side} ${name}: one piece grows from the hand`);
          // (every piece touches another piece of the same digit: the joint they share lies inside both)
          for (const p of ps) {
            const touches = ps.some((o) => o !== p && o.form.some((q) => inPoly(q, p.form)));
            assert.ok(touches, `${id} ${a.side} ${name}: a piece cut loose`);
          }
        }
  });

  it('A THUMB READS AS A THUMB: two bones and a pad out of the mound (its root inside the palm’s form)', () => {
    for (const { id, fp } of ALL)
      for (const a of fp.arms) {
        const palm = a.hand.parts.find((p) => p.kind === 'palm');
        const th = a.hand.parts.find((p) => p.name === 'thumb' && p.root);
        if (!palm || !th || !th.root) continue;
        assert.ok(palm.pieces.some((pc) => inPoly(th.root!, pc)), `${id} ${a.side}: the thumb grows from the mound`);
      }
  });
});
