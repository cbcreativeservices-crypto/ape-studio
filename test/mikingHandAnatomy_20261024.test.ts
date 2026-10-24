/**
 * MIKING HANDS REDESIGN (2026-10-24, owner: "The hands continue to be drawn
 * poorly … This must be MUCH better!!!"). Pins the shared hand system
 * (lessons/shared/hand/anatomy): the adult proportions it draws, the power
 * grip that WRAPS the fingers round what the hand holds (no flat paddle
 * lying on top of it), and that the hand-held percussion lessons use it.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cylinderCut, gripCylinder, handProportions, openHandOn, pinchGrip, v3 } from '../src/screens/lab/miking/lessons/shared/hand/anatomy/anatomy.ts';
import { h3, jointBendsDeg, wristBendDeg } from '../src/screens/lab/miking/lessons/shared/players/handModel.ts';
import { STATES as SHAKER } from '../src/screens/lab/miking/lessons/i03aShaker/model.ts';
import { P0 } from '../src/screens/lab/miking/lessons/shared/smallperc/geom.ts';

const L = (...p: string[]) => readFileSync(new URL(`../src/screens/lab/miking/lessons/${p.join('/')}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

describe('the Miking hand — real adult proportions', () => {
  const p = handProportions();
  it('hand length ≈ 186 mm, breadth across the knuckles 70–90 mm (adult range), wrist ≈ 55 mm', () => {
    assert.ok(p.handLength >= 180 && p.handLength <= 195, `hand length ${p.handLength}`);
    assert.ok(p.breadth >= 70 && p.breadth <= 90, `breadth ${p.breadth}`);
    assert.ok(p.wristWidth < p.breadth, 'the wrist narrower than the hand');
    assert.ok(p.wristWidth >= 50 && p.wristWidth <= 60, `wrist ${p.wristWidth}`);
  });
  it('finger lengths: middle > ring ≥ index > little — never four equal fingers', () => {
    const f = p.fingers;
    assert.ok(f.middle > f.ring && f.ring >= f.index && f.index > f.little, JSON.stringify(f));
    assert.ok(f.middle - f.little >= 15, 'the little finger clearly shorter');
  });
  it('palm ≈ the middle finger in length (ratio 1.0–1.25 at the joint centres)', () => {
    assert.ok(p.palmToFinger >= 1.0 && p.palmToFinger <= 1.25, `palm/finger ${p.palmToFinger}`);
  });
  it('the thumb rises from the BASE of the palm, on the palm side, with two visible phalanges', () => {
    assert.ok(p.thumbBase.x <= 35, 'saddle joint near the wrist');
    assert.ok(p.thumbBase.y < 0, 'on the thumb side');
    assert.ok(p.thumbBase.z < 0, 'toward the palm (opposable)');
    assert.ok(p.thumb.proximal > p.thumb.distal * 0.9 && p.thumb.distal > 18, 'two real phalanges');
  });
});

describe('the power grip wraps the object (the shaker, owner example)', () => {
  for (const id of ['toward', 'side'] as const) {
    it(`${id}: every fingertip on the far side of the shell, the joints bent, the wrist within 70°`, () => {
      const a = SHAKER[id].arm;
      const cyl = { c: P0, axis: SHAKER[id].axis, r: 22.5, slide: 34 };
      const g = gripCylinder(cyl, { thumbSign: 1, wrist: a.W, elbow: a.E, angle: id === 'toward' ? [50, 70] : [68, 90] });
      const ax = h3.unit(cyl.axis);
      const toAxis = (q: { x: number; y: number; z: number }) => {
        const d = h3.sub(q, P0);
        return h3.sub(d, h3.mul(ax, h3.dot(d, ax)));
      };
      const palmSide = h3.unit(toAxis(h3.add(g.sk.frame.o, h3.mul(g.sk.frame.x, 80))));
      for (const f of g.sk.fingers) {
        const tip = toAxis(f.joints[3]);
        // The pad sits round the shell, not out in the air past it.
        assert.ok(Math.abs(h3.len(tip) - 22.5) < 14, `${f.name} pad ${h3.len(tip).toFixed(1)} mm from the axis`);
        // Wrapped past the side: beyond 90° round from the palm's contact line.
        assert.ok(h3.dot(h3.unit(tip), palmSide) < 0.2, `${f.name} wraps round the shell`);
        const b = jointBendsDeg(f);
        assert.ok(b[1] > 15, `${f.name} middle joint bent (${b[1].toFixed(0)}°) — not a straight sausage`);
      }
      assert.ok(wristBendDeg(g.sk, a.E) <= 70, 'D68: the wrist bends 70° at most');
      assert.ok(g.wristMiss < 45, `the grip's wrist stays with the model's arm (${g.wristMiss.toFixed(0)} mm)`);
    });
  }
  it('the occlusion plane: through the axis for a side-on object, the near end face end-on', () => {
    const c = cylinderCut({ c: v3(0, 0, 0), axis: v3(1, 0, 0), r: 20 }, v3(0, 0, 1), 80);
    assert.deepEqual([c.n.x, c.n.y, c.n.z], [0, 0, 1]);
    const e = cylinderCut({ c: v3(0, 0, 0), axis: v3(0, 0, 1), r: 20 }, v3(0, 0, 1), 80);
    assert.equal(e.p.z, 80);
  });
  it('open hand and pinch are anatomically posed (the pinch: thumb pad on the index pad)', () => {
    const o = openHandOn(v3(0, 0, 0), v3(1, 0, 0), v3(0, 1, 0), 1, 0.1);
    assert.equal(o.fingers.length, 4);
    const p = pinchGrip(v3(130, 20, 0), v3(1, 0, 0), v3(0, -1, 0), 1);
    assert.ok(h3.len(h3.sub(p.thumb.joints[3], p.fingers[0].joints[3])) < 22, 'thumb meets index');
  });
});

describe('the hand-held percussion lessons draw the shared hand', () => {
  it('shaker, egg, maracas, tambourine, claves and güiro pose it in 3-D (no flat 2-D paddle)', () => {
    for (const f of ['i03aShaker', 'i03bEgg', 'i03cMaracas', 'i04Tambourine', 'i05bClaves', 'i05dGuiro']) {
      const src = L(f, 'art.tsx');
      assert.match(src, /<HeldHand /, `${f} draws HeldHand`);
      assert.doesNotMatch(src, /\b(profileFist|dorsalFist|cradle|openHand|dorsalFlat)\(/, `${f}: no old 2-D hand`);
    }
    assert.match(L('shared/smallperc/Hand.tsx'), /return <AnatomicalHand sk=\{sk\}/, 'Hand3 (cowbell, woodblock) is the anatomical hand');
  });
  it('the paint: one form per digit, nails only facing the viewer, an oval wrist narrower than the heel', () => {
    const d = L('shared/hand/anatomy/drawAnatomy.ts');
    assert.match(d, /ONE FORM PER DIGIT/);
    assert.match(d, /const wristRing = ring\(0, wr, 19\);/);
    assert.match(d, /ring\(24, wr \+ 5, 17\)/);
  });
});
