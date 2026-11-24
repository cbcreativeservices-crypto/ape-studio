/**
 * FIGURE V2 — "ENSEMBLES 2" (wave 6 of must-do D78, 2026-11-24): the figures
 * the ensemble lessons still needed, and the lessons switched on with them.
 *   • set 1: the standing person from BEHIND (backPlan.ts, FigureV2Back.tsx,
 *     backHands.ts) — the five people, their garments, the light;
 *   • set 2: the CONDUCTOR with a baton (conductorV2.tsx) — the beat position,
 *     the grip round the bulb (fingers one side, thumb the other), his back
 *     from the hall, his profile in the section, from above in the plans and on
 *     the woodwind section plan's podium; E11 switched on whole.
 * Reads normalise CRLF.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const R = <T>(m: T): T => (m as { default?: T }).default ?? m;
const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const LS = 'src/screens/lab/miking/lessons';
const FV = `${LS}/shared/figureV2`;

const BP = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/backPlan.ts'));
const BH = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/backHands.ts'));
const CAST = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/cast.ts'));
const CV = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/conductorV2.tsx'));
const HH = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/heldHands.ts'));
const SA = R(await import('../src/screens/lab/miking/lessons/shared/ensemble/SeatingArt.tsx'));
const SE = R(await import('../src/screens/lab/miking/lessons/shared/ensemble/seating.ts'));
const CH = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/choristerV2.tsx'));
const H2 = R(await import('../src/screens/lab/miking/lessons/shared/ensemble/ensembles2Holds.ts'));
const HM = R(await import('../src/screens/lab/miking/lessons/shared/players/handModel.ts'));

type Pt = { u: number; v: number };
const ALL = ['drummer', 'ana', 'ruth', 'kofi', 'mei'] as const;
const planOf = (id: (typeof ALL)[number], jacket = false) => {
  const w = CAST.CAST[id];
  return BP.backPlan(BP.BACK_STANDING, { head: w.head, ...(w.body ? { body: w.body } : {}), woman: w.woman, ...(jacket ? { jacket: true } : {}) });
};
const maxV = (p: Pt[]) => Math.max(...p.map((q) => q.v));
const minV = (p: Pt[]) => Math.min(...p.map((q) => q.v));
const width = (p: Pt[]) => Math.max(...p.map((q) => q.u)) - Math.min(...p.map((q) => q.u));

describe('figure V2 ensembles 2 — the standing person from behind', () => {
  it('the same body as the approved front view: the silhouette mirrored, the same width, the person\'s right on the viewer\'s right', () => {
    for (const id of ALL) {
      const b = planOf(id);
      assert.ok(Math.abs(width(b.shirt) - width(b.front.shirt)) < 0.5, `${id}: shirt width as the front's`);
      // the right arm (side +1) on the viewer's right
      const r = b.arms.find((a: { side: number }) => a.side === 1)!;
      assert.ok(r.shoulder.u > 0, `${id}: the right arm on the viewer's right`);
    }
  });
  it('the back neckline is higher than the front\'s (the back of the neck shows above it)', () => {
    for (const id of ALL) {
      const b = planOf(id);
      const mid = (p: Pt[]) => Math.min(...p.filter((q) => Math.abs(q.u) < 20).map((q) => q.v));
      assert.ok(mid(b.shirt) < mid(b.front.shirt) - 10, `${id}: back neckline above the front's`);
      assert.ok(mid(b.shirt) < b.nbV, `${id}: at the neck's base`);
    }
  });
  it('each person\'s hair from behind: short and crop to the nape with the ears; the bob to the jaw over the ears; the ponytail\'s tie and hanging tail; the bun at the back of the head', () => {
    const at = (id: (typeof ALL)[number]) => {
      const h = planOf(id).head;
      const k = h.r / 110;
      return { h, y: (q: Pt) => (q.v - h.c.v) / k };
    };
    for (const id of ['drummer', 'kofi'] as const) {
      const { h, y } = at(id);
      assert.equal(h.ears.length, 2, `${id}: ears show`);
      assert.ok(y(h.nape) > 36 && y(h.nape) < 76, `${id}: the hair tapers to the nape`);
      assert.equal(h.tail, null);
      assert.equal(h.bun, null);
    }
    // (Ensembles3) the two men differ from behind: the drummer's fuller, longer cut lower at the nape, Kofi's crop
    // higher and closer; Kofi's neck the broader; the nape's hairline uneven (tufts), never one straight cut
    {
      const d = at('drummer');
      const k = at('kofi');
      assert.ok(d.y(d.h.nape) - k.y(k.h.nape) > 15, 'the drummer\'s hair lower at the nape than Kofi\'s crop');
      assert.ok(width(d.h.hair) / d.h.r > width(k.h.hair) / k.h.r + 0.1, 'the drummer\'s hair fuller');
      assert.ok(width(k.h.neck) > width(d.h.neck) + 10, 'Kofi\'s neck broader');
      const low = d.h.hair.filter((q) => d.y(q) > 55).map((q) => d.y(q));
      assert.ok(Math.max(...low) - Math.min(...low) > 6, 'the drummer\'s nape hairline uneven');
    }
    assert.match(read(`${FV}/FigureV2Back.tsx`), /const fades = h\.style === 'short' \|\| h\.style === 'crop';/);
    {
      const { h, y } = at('ruth');
      assert.equal(h.ears.length, 0, 'the bob covers the ears');
      assert.ok(maxV(h.hair) > h.c.v + 95 * (h.r / 110), 'the bob falls to the jaw');
      assert.ok(h.ends, 'its ends turned under');
      void y;
    }
    {
      const { h, y } = at('ana');
      assert.equal(h.ears.length, 2);
      assert.ok(h.tail && h.tie, 'the ponytail: a tie and a tail');
      assert.ok(Math.abs(y(h.knot!)) < 20, 'the tie behind the head at the top of the ears');
      assert.ok(maxV(h.tail!) - h.knot!.v > 100, 'the tail hangs over the nape');
      assert.ok(h.tailClumps.length >= 3, 'the tail has strands');
    }
    {
      const { h, y } = at('mei');
      assert.equal(h.ears.length, 2);
      assert.ok(h.bun, 'the bun');
      assert.ok(Math.abs(y(h.knot!)) < 20, 'the bun at the back of the head at the top of the ears');
    }
  });
  it('the collar\'s back, the shoulder seams, a dress shirt\'s yoke; the belt\'s loops and no buckle', () => {
    for (const id of ALL) {
      const b = planOf(id);
      assert.equal(b.shoulderSeams.length, 2);
      assert.ok(b.collar.length > 6);
      if (b.collarKind === 'shirt') {
        assert.ok(b.yoke, `${id}: a yoke seam`);
        assert.ok(minV(b.collar) < b.nbV - 35, `${id}: the collar stands round the neck`);
      } else assert.equal(b.yoke, null);
      if (b.tucked) assert.equal(b.loops.length, 3, `${id}: the belt's loops`);
    }
    assert.doesNotMatch(read(`${FV}/FigureV2Back.tsx`), /buckle/);
  });
  it('the jacket\'s back: one panel, a center vent about 210 mm up from the hem, the shirt collar a strip above the jacket\'s', () => {
    for (const id of ['ana', 'ruth', 'kofi', 'mei'] as const) {
      const b = planOf(id, true);
      const J = b.jacket!;
      assert.ok(J, id);
      const up = J.hemAt.v - J.ventAt.v;
      assert.ok(up > 180 && up < 260, `${id}: the vent ${up.toFixed(0)} mm`);
      if (b.collarKind === 'shirt') assert.ok(minV(J.collar) - minV(b.collar) > 8, `${id}: the shirt collar shows above the jacket's`);
    }
  });
  it('the heels from behind: a counter with its seam, the heel block', () => {
    const b = planOf('kofi');
    assert.equal(b.shoes.length, 2);
    for (const s of b.shoes) {
      assert.ok(s.seam.length >= 2);
      assert.ok(width(s.heel) < width(s.upper), 'the heel narrower than the shoe');
    }
  });
  it('the hand hanging, seen from behind: its little-finger edge, the thumb on the far side (none drawn); one outline; the gaps start at the tips', () => {
    const a = BH.HANG_BACK_ART;
    assert.equal(a.thumbTip, null);
    assert.equal(a.parts.length, 1, 'one form');
    assert.equal(a.parts[0].kind, 'palm');
    assert.equal(a.nails.length, 0);
    // (Ensembles3, reviewer: "sock tubes") all four fingers show, stepped, a gap from each tip (and one to the thumb)
    assert.ok(a.gaps && a.gaps.length === 4);
    // length wrist → the middle fingertip ≈ 165–185 mm; depth at the wrist ≈ 40–48 mm
    const xs = BH.HANG_BACK_FINGERS.map((q) => q[0]);
    assert.ok(Math.max(...xs) > 165 && Math.max(...xs) < 185);
    const w0 = BH.HANG_BACK_FINGERS.filter((q) => q[0] > -10 && q[0] < 6).map((q) => q[1]);
    assert.ok(Math.max(...w0) - Math.min(...w0) > 40 && Math.max(...w0) - Math.min(...w0) < 50);
    // each finger's tip its own lobe: the little shortest, the middle longest
    assert.deepEqual(a.parts[0].outline.length, BH.HANG_BACK_FINGERS.length);
    for (const id of ALL) for (const arm of planOf(id).arms) assert.equal(arm.hand.art, a, `${id}: the hand from behind`);
  });
  it('the light is the picture\'s upper left, computed (never a mirrored front picture)', () => {
    const src = read(`${FV}/FigureV2Back.tsx`);
    assert.match(src, /import \{ LIGHT, type Poly, type Pt \} from '\.\/geom\.ts';/);
    assert.doesNotMatch(src, /scaleX: -1|scale\(-1/);
  });
});

describe('figure V2 ensembles 2 — the conductor with a baton', () => {
  const who = CAST.castFor('ensemble.conductor');
  it('one fixed person conducts (the role table)', () => {
    assert.equal(who.id, 'kofi');
  });
  it('the beat position: the elbows away from the body, the hands raised before him, about shoulder height', () => {
    const p = CV.conductorPlan('back', who);
    for (const a of [p.arms.R, p.arms.L]) {
      // (Ensembles3, reviewer: "goalpost" arms) the upper arms hang more, the elbows ≈ 130 mm out
      assert.ok(Math.abs(a.elbow.u - a.shoulder.u) > 100, `${a.side}: the elbow out from the shoulder`);
      assert.ok(a.elbow.v - a.shoulder.v > 200, `${a.side}: the upper arm hanging, not level`);
      assert.ok(a.wrist.v < a.elbow.v - 100, `${a.side}: the hand raised above the elbow`);
      assert.ok(Math.abs(a.wrist.v - a.shoulder.v) < 130, `${a.side}: the hand a little below shoulder height`);
    }
  });
  it('the baton grip: one 3-D hand round the bulb (heldHands), the fingers round one side, the thumb round the other; the wrist inside its range', () => {
    for (const view of ['back', 'side', 'top'] as const) {
      const g = CV.conductorPlan(view, who).arms.R.grip!;
      assert.ok(g, view);
      const r = HH.gripRounds(g.model);
      for (const f of r.fingers) assert.equal(f.side, r.fingers[0].side, `${view}: the fingers one way`);
      assert.equal(r.thumb.side, -r.fingers[0].side, `${view}: the thumb the other way`);
      assert.ok(g.frame.wristTurn < 1, `${view}: the bulb lies across the palm within the grip's range (no forced wrist turn)`);
      assert.equal(g.model.R, CV.BATON.bulbR);
    }
    const src = read(`${FV}/conductorV2.tsx`);
    // the baton along the grip's own handle line; the bulb drawn between the hand's layers (or behind it, looking down the baton)
    assert.match(src, /const h3 = unit3\(add3\(mul3\(grip\.frame\.U, Math\.tan\(grip\.frame\.beta\)\), grip\.frame\.W\)\);/);
    assert.match(src, /<HeldHand h=\{a\.grip\} mic=/);
    assert.doesNotMatch(read(`${FV}/heldHands.ts`), /conductor|baton/i, 'heldHands.ts read only');
  });
  it('the baton: about 380 mm, pointing forward, up and in; about 36° off the forearm (the wrist bent ≤ 30° toward the little finger)', () => {
    assert.equal(CV.BATON.len, 380);
    const a = CV.CONDUCTOR_POSE.aim;
    assert.ok(a.z > 0.4 && a.y > 0.3 && a.x < 0, 'forward, up, toward his middle');
    const f = CV.CONDUCTOR_POSE.R.toWrist;
    const fl = Math.hypot(f.x, f.y, f.z);
    const ang = (Math.acos((a.x * f.x + a.y * f.y + a.z * f.z) / fl) * 180) / Math.PI;
    assert.ok(ang > 25 && ang < 45, `baton to forearm ${ang.toFixed(1)}°`);
    assert.ok(62 - ang <= 32, 'the wrist bend');
  });
  it('the left hand open, the palm toward the players: its back from behind (restTop), edge-on from the side', () => {
    assert.equal(CV.conductorPlan('back', who).arms.L.open!.art.view, 'restTop');
    assert.equal(CV.conductorPlan('side', who).arms.L.open!.art.view, 'restSide');
  });
  it('the seatings draw him new: his back from the hall, in profile in the section, from above in the plan; the old baton line gone', () => {
    const src = read(`${LS}/shared/ensemble/SeatingArt.tsx`);
    assert.match(src, /<ConductorV2 who=\{castFor\('ensemble\.conductor'\)\} view="top" \/>/);
    assert.match(src, /<ConductorV2 who=\{castFor\('ensemble\.conductor'\)\} view=\{view === 'front' \? 'back' : 'side'\}/);
    assert.equal((src.match(/if \((f\.)?q\.kind === 'conductor'\) sb\.stick = make\(\);/g) ?? []).length, 3);
  });
  it('the woodwind section plan\'s podium: the conductor from above where the gray disc was (with the players\' look)', () => {
    const src = read(`${LS}/shared/woodwinds/WindPlan.tsx`);
    assert.match(src, /\{figureV2On\('familyWinds'\) \? \(\n\s*<Group transform=\{\[\{ translateX: STAGE\.conductor\.u \}, \{ translateY: STAGE\.conductor\.v \}\]\}>\n\s*<ConductorV2 who=\{castFor\('ensemble\.conductor'\)\} view="top" assumePtPerMm=\{xf\.s\} \/>/);
  });
});

describe('figure V2 ensembles 2 — the chorister with a folder', () => {
  it('the folder open toward the singer at chest height (its lower edge where the old drawing had it), the pages up toward the eyes', () => {
    const F = CH.folder3();
    assert.equal(CH.FOLDER.lowY, 1160);
    for (const h of [F.R, F.L]) {
      assert.ok(h.pages.z < 0 && h.pages.y > 0, 'the pages face back and up toward the singer');
      assert.ok(h.quad[2].y > h.quad[1].y + 150, 'upright enough to read');
    }
    // (the old drawing's open width, 350 mm: no wider, so neighbors 560 mm apart keep clear)
    assert.ok(Math.abs(F.R.quad[1].x - F.L.quad[1].x) < 380);
  });
  it('both hands under the lower edge, one 3-D grip each: the fingers round one side, the thumb the other (on the pages)', () => {
    for (const view of ['front', 'side', 'top'] as const) {
      const p = CH.choristerPlan(view, -1);
      for (const a of [p.arms.R, p.arms.L]) {
        const r = HH.gripRounds(a.grip.model);
        for (const f of r.fingers) assert.equal(f.side, r.fingers[0].side, `${view}: the fingers one way`);
        assert.equal(r.thumb.side, -r.fingers[0].side, `${view}: the thumb the other way`);
      }
      // what lies on the viewer's side of the sheet is painted again over it: the thumb seen from the pages' side
      const keep = p.folder.some((f: { pages: boolean }) => f.pages);
      if (view === 'top') assert.ok(keep && p.arms.R.onSide.parts.every((q: { name: string }) => q.name === 'thumb'));
      if (view === 'front') assert.ok(p.arms.R.onSide.parts.every((q: { name: string }) => q.name === 'fingers'));
    }
  });
  it('the seatings draw every chorister new (from above, from the hall, in profile); children from above only', () => {
    const src = read(`${LS}/shared/ensemble/SeatingArt.tsx`);
    assert.match(src, /if \(q\.kind === 'chorister' \|\| q\.kind === 'child'\) \{\n\s+\/\/ \(Ensembles2\) a chorister/);
    assert.match(src, /<ChoristerV2 who=\{who\} view="top" \/>/);
    assert.match(src, /<ChoristerV2 who=\{who\} view=\{front \? 'front' : 'side'\} facing=/);
    assert.equal((src.match(/clearFolder\(sb\)/g) ?? []).length, 3);
  });
  it("the conductor's person never also plays in his seating", () => {
    const src = read(`${LS}/shared/ensemble/SeatingArt.tsx`);
    assert.match(src, /const four = CAST_IN_TURN\.filter\(\(id\) => id !== cond\.id\);/);
  });
});

describe('figure V2 ensembles 2 — the keys and percussion seats (set 4)', () => {
  it('every keys and percussion seat has a solved hold: both arms in reach, the wrists within 70°', () => {
    for (const k of H2.KIND2) {
      const h = k === 'percussion2' ? H2.hold2Of('percussion', true)! : H2.hold2Of(k)!;
      assert.ok(h, k);
      assert.ok(H2.reachOk(h), `${k}: in reach`);
      for (const a of [h.L!, h.R!]) assert.ok(HM.wristBendDeg(a.sk, a.elbow) <= 70, `${k}.${a.side}: wrist ${HM.wristBendDeg(a.sk, a.elbow).toFixed(0)}°`);
    }
  });
  it("the mallet, beater and stick players hold their sticks: the stick through the fist at the hand's own point", () => {
    for (const k of ['timpani', 'marimba', 'vibraphone', 'percussion']) {
      const h = H2.hold2Of(k)!;
      assert.ok(h.sticks.length >= 1, k);
      for (const st of h.sticks) {
        const a = [h.L!, h.R!].find((x) => x.at.x === st.fulcrum.x && x.at.y === st.fulcrum.y && x.at.z === st.fulcrum.z);
        assert.ok(a, `${k}: a hand at the stick's fulcrum`);
      }
    }
    // the timpani heads where the lesson puts them (a hand's width in from the near rim): seating.ts TIMPANI_MALLETS
    const t = H2.hold2Of('timpani')!;
    for (const st of t.sticks) assert.ok(SE.TIMPANI_MALLETS.some((m: { head: { u: number; v: number } }) => Math.abs(m.head.u - st.head.x) < 0.01 && Math.abs(-m.head.v - st.head.z) < 0.01));
  });
  it('the old drawings keep their own holds: only the new drawing reads the keys and percussion holds', () => {
    const src = read(`${LS}/shared/ensemble/SeatingArt.tsx`);
    assert.equal((src.match(/holdV2For\(/g) ?? []).length, 5, 'defined once, read by the plan, the elevations, the readiness check and (Ensembles3) holdDraw');
    assert.equal((src.match(/= holdDraw\(s, lift, o\.bowedBass\)|= holdDraw\(s, lift, so\.bowedBass\)/g) ?? []).length, 2, 'the plan and elevation drawings read holdDraw');
    // (Ensembles3) holdDraw is the old holdFor except while a v2 picture is built, and then only for a cello
    assert.ok(/const holdDraw = \(s: Seat, lift: number, bowedBass: boolean\): Hold \| null => \(V2_BUILD && s\.kind === 'cello' \? holdV2For\(s, lift, bowedBass\) : holdFor\(s, lift, bowedBass\)\);/.test(src), 'the old drawings unchanged');
  });
});

describe('figure V2 ensembles 2 — the lessons switched on whole', () => {
  it('E05, E06, E11, E12, E13, E14, E15, E16: every seating each lesson shows is on, every seat drawable new', () => {
    const on = ['choir.arc', 'choir.risers', 'choir.children', 'choir.childrenSolo', 'quartet.arc', 'quartet.arcVa', 'strings.american', 'perc.trio', 'perc.large', 'chamber.mixed', 'orch.american', 'orch.german', 'jazz.guitar', 'jazz.quartet', 'bb.standard', 'bb.horseshoe', 'band.stage', 'band.room'];
    for (const id of on) {
      assert.ok(SA.ENSEMBLE_V2.has(id), id);
      assert.ok(SA.seatingV2Ready(SE.seatingOf(id)), `${id} ready`);
    }
    for (const d of ['e05Choir', 'e06ChildrensChoir', 'e09CompleteBand', 'e11StringQuartet', 'e12PercussionEnsemble', 'e13MixedEnsemble', 'e14FullOrchestra', 'e15JazzCombo', 'e16BigBand']) {
      const g = read(`${LS}/${d}/geometry.ts`);
      for (const m of g.matchAll(/seatingOf\('([a-zA-Z.]+)'\)/g)) assert.ok(SA.ENSEMBLE_V2.has(m[1]), `${d}: ${m[1]}`);
    }
  });
  it('children are still never drawn in elevation (E06, the lead ruling)', () => {
    assert.match(read(`${LS}/shared/ensemble/SeatingArt.tsx`), /filter\(\(q\) => q\.kind !== 'child' &&/);
  });
  it('the big seatings (35+ people: E11, E13, E14, E16) sit behind ONE switch, each of those lessons whole', () => {
    assert.equal(SA.ENSEMBLE_V2_BIG_ON, true);
    assert.deepEqual([...SA.ENSEMBLE_V2_BIG].sort(), ['bb.horseshoe', 'bb.standard', 'chamber.mixed', 'orch.american', 'orch.german', 'quartet.arc', 'quartet.arcVa', 'strings.american']);
    assert.match(read(`${LS}/shared/ensemble/SeatingArt.tsx`), /\.\.\.\(ENSEMBLE_V2_BIG_ON \? ENSEMBLE_V2_BIG : \[\]\),/);
    // (every seating of those lessons is in the list: switching it off leaves no lesson half new)
    for (const d of ['e11StringQuartet', 'e13MixedEnsemble', 'e14FullOrchestra', 'e16BigBand'])
      for (const m of read(`${LS}/${d}/geometry.ts`).matchAll(/seatingOf\('([a-zA-Z.]+)'\)/g)) assert.ok(SA.ENSEMBLE_V2_BIG.includes(m[1]), `${d}: ${m[1]}`);
  });
  it('E09: the standing keyboard player on the keys hold (upright, the forearms falling gently to the keys), the stage gear in every view', () => {
    const h = H2.hold2Of('keys')!;
    for (const a of [h.L!, h.R!]) {
      const f = HM.h3.unit(HM.h3.sub(a.wrist, a.elbow));
      const slope = (Math.asin(-f.y) * 180) / Math.PI;
      assert.ok(slope >= 0 && slope < 25, `${a.side}: forearm ${slope.toFixed(0)}° down`);
      assert.ok(HM.wristBendDeg(a.sk, a.elbow) <= 30);
    }
    assert.match(read(`${LS}/shared/ensemble/SeatingArt.tsx`), /bandGearElev\(gb, g, view, BAND_TOOLS\);/);
  });
});

const EH = R(await import('../src/screens/lab/miking/lessons/shared/ensemble/ensembleHands.ts'));
describe('figure V2 ensembles 3 — the seatings repaired (depth, facing, holds)', () => {
  const src = () => read(`${LS}/shared/ensemble/SeatingArt.tsx`);
  it('the cellist bows near the frog: the bow hand inside his own space, the contact point on the strings unchanged', () => {
    const old = EH.holdOf('cello')!;
    const h = H2.bowNearFrog(old, SA.CELLO_FROG_TO_CONTACT);
    const d = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
    assert.deepEqual(h.pts!.contact, old.pts!.contact);
    assert.ok(Math.abs(d(h.pts!.frog, h.pts!.contact) - SA.CELLO_FROG_TO_CONTACT) < 0.01);
    // the bow's own line and length kept
    assert.ok(Math.abs(d(h.pts!.frog, h.pts!.tip) - d(old.pts!.frog, old.pts!.tip)) < 0.01);
    // the hand at least 100 mm further in toward the player's middle than before, still on his right
    assert.ok(old.R!.wrist.x - h.R!.wrist.x > 100, `${old.R!.wrist.x.toFixed(0)} → ${h.R!.wrist.x.toFixed(0)}`);
    assert.ok(h.R!.wrist.x > 0);
    assert.ok(HM.h3.len(HM.h3.sub(h.R!.wrist, h.R!.shoulder)) < 305 + 255 + 2, 'within reach');
    // the old drawings keep the old hold: only a v2 build reads it
    assert.match(src(), /if \(s\.kind === 'cello'\) \{\n\s+const h = holdFor\(s, lift, bowedBass\);\n\s+return h \? bowNearFrog\(h, CELLO_FROG_TO_CONTACT\) : null;/);
  });
  it('facing: a player turned toward the hall within ≈ 63° is drawn face-on in a front view (never a profile pasted in)', () => {
    assert.match(src(), /const famView: FamView = dF >= 0\.45 \? 'front' : 'side';/);
    // the horn arc's outer players are turned 54°: cos 54° ≈ 0.59 ≥ 0.45
    assert.ok(Math.cos((54 * Math.PI) / 180) >= 0.45);
  });
  it('a turned brass player face-on has the mouth on the mouthpiece; the upright strings keep the face beside the neck', () => {
    const s = src();
    assert.match(s, /const lip = mp && turned \? T\.pt\(v3l\(mp\.x, mp\.y \+ liftMp, mp\.z\)\) : null;/);
    assert.match(s, /const headFront = famView === 'front' && \(q\.kind === 'bass' \|\| q\.kind === 'cello'\);/);
    assert.match(s, /famFrontRegion\(it\.fam\.fp, it\.fam\.inst, it\.fam\.headFront \? \{ headFront: true \} : \{\}\)/);
  });
  it('the tuba (v2): the bell beside and behind the head, its mouth round the unchanged sound point, painted behind the person when farther', () => {
    const s = src();
    // the sound point (0, 120 ahead, 1450 up) inside the bell's mouth (centre (−60, −30 ahead, 1460), radius 205)
    assert.ok(Math.hypot(0 - -60, 120 - -30) < 205);
    assert.equal(SE.KIND.tuba.sound, 1450);
    assert.match(s, /const a1 = Q\(-60, -30, 1460\);/);
    assert.match(s, /const bellInto = bellBehind && BEHIND \? BEHIND : b;/);
    assert.match(s, /\{it\.back \? <PaintBatch b=\{it\.back\} \/> : null\}/);
    // the old tuba drawing kept for the old pictures
    assert.match(s, /b\.mat\.brass\.addPath\(ellipse\(Q\(0, 120, 900\), 190, 300\)\);/);
  });
});
