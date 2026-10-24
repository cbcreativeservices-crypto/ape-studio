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

describe('grips pass (owner: "holding the clave sticks, the guiro stick … wrong")', () => {
  it('claves: the receiving clave rests on the fingertips and thumb over a HOLLOW palm (no fist)', async () => {
    const { cupUnder } = await import('../src/screens/lab/miking/lessons/shared/hand/anatomy/anatomy.ts');
    const { STATES } = await import('../src/screens/lab/miking/lessons/i05bClaves/model.ts');
    const s = STATES.solid;
    const sk = cupUnder(s.rest, v3(0, 0, 1), 12.5, v3(1, 0, 0), 1, { gap: 22 });
    // The palm's face is well below the clave: the resonating chamber.
    const palmFace = h3.add(sk.frame.o, h3.add(h3.mul(sk.frame.x, 58), h3.mul(sk.frame.z, -14)));
    assert.ok(palmFace.y - (s.rest.y + 12.5) >= 18, `air under the clave ${(palmFace.y - s.rest.y - 12.5).toFixed(0)} mm`);
    // Every fingertip near the clave's surface on its far side; palm up.
    for (const f of sk.fingers) {
      const t = f.joints[3];
      const d = Math.hypot(t.x - s.rest.x, t.y - s.rest.y);
      assert.ok(d < 12.5 + 16, `${f.name} tip ${d.toFixed(0)} mm from the clave's axis`);
      assert.ok(t.x > s.rest.x, `${f.name} on the far side`);
    }
    assert.ok(sk.frame.z.y > 0.9, 'the back of the hand down: palm up');
  });
  it('striker and scraper: the stick grip — thumb pad on the stick against the index, not a fist', async () => {
    const { stickGripNear } = await import('../src/screens/lab/miking/lessons/shared/hand/anatomy/anatomy.ts');
    const { STATES } = await import('../src/screens/lab/miking/lessons/i05bClaves/model.ts');
    const s = STATES.solid;
    const sk = stickGripNear(s.strike.G, s.striker.b, 1, s.strike.W, v3(0, -1, 0.3), 12.5);
    const ax = h3.unit(h3.sub(s.striker.b, s.strike.G));
    const off = (q: { x: number; y: number; z: number }) => {
      const d = h3.sub(q, s.strike.G);
      return h3.len(h3.sub(d, h3.mul(ax, h3.dot(d, ax))));
    };
    assert.ok(off(sk.thumb.joints[3]) < 12.5 + 14, 'the thumb pad on the stick');
    assert.ok(off(sk.fingers[0].joints[2]) < 12.5 + 20, 'the index middle bone against it (the fulcrum)');
    assert.ok(h3.len(h3.sub(sk.frame.o, s.strike.W)) < 60, 'the wrist stays with the lesson arm');
  });
  it('the lessons use the researched grips', () => {
    assert.match(L('i05bClaves', 'art.tsx'), /cupUnder\(s\.rest, v3\(0, 0, 1\), CR, v3\(1, 0, 0\), 1, \{ gap: 22 \}\)/);
    assert.match(L('i05bClaves', 'art.tsx'), /stickGripNear\(s\.strike\.G, s\.striker\.b/);
    assert.match(L('i05dGuiro', 'art.tsx'), /cupUnder\(v3\(c\.x, c\.y, z0\), v3\(0, 0, 1\), GR, v3\(1, 0, 0\.1\), 1, \{ gap: 0, into: 6 \}\)/);
    assert.match(L('i05dGuiro', 'art.tsx'), /stickGripNear\(s\.scrape\.G, s\.scraper\.a/);
    assert.match(L('i04Tambourine', 'art.tsx'), /stickGripNear\(s\.stick\.a, s\.stick\.b/);
  });
});
