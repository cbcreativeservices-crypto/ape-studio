/**
 * C10 HARP — THE HARPIST'S HANDS AND BODY (art fix round 2, owner 2026-10-16:
 * "the harp hands are translucent blobs over the strings"). The harpist the
 * art paints (c10Harp/harpistPose.ts → PlayerFigure.drawHand3) is measured
 * here, for both harps:
 *   • every playing pad ON its string (thumb, index, middle, ring), the
 *     little finger off the strings (it is not used on the harp);
 *   • the thumb high, on the highest of the four strings; each finger two
 *     strings lower, its pad lower than the one before (sloping down);
 *   • each hand wholly on its own side of the strings (the right hand on the
 *     player's right, the left on the left) — no knuckle through them;
 *   • natural joints: knuckles −5…70°, middle joints ≤ 95°, the wrist within
 *     30° of the forearm; an adult arm (300 / 255 mm);
 *   • the body: adult thighs and shins, the soundbox resting against the
 *     right shoulder, the knees either side of it.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fingerFlexDeg, h3 } from '../src/screens/lab/miking/lessons/shared/players/handModel.ts';
import { HARP_ARM, harpHands, harpistBody, harpWristBend } from '../src/screens/lab/miking/lessons/c10Harp/harpistPose.ts';
import { harpGeom } from '../src/screens/lab/miking/lessons/c10Harp/harpSpec.ts';

for (const lever of [false, true]) {
  const name = lever ? 'lever harp' : 'concert pedal harp';
  describe(`C10 harpist on the ${name}`, () => {
    const g = harpGeom(lever);
    const H = harpHands(lever);
    for (const which of ['R', 'L'] as const) {
      const h = H[which];
      const f = h.sk.frame;
      const side = which === 'R' ? 1 : -1;
      it(`${which}: the thumb, index, middle and ring pads rest on their strings`, () => {
        // miss: index, middle, ring, little, thumb
        for (const k of [0, 1, 2, 4]) assert.ok(h.sk.miss[k] <= 2, `digit ${k} misses its string by ${h.sk.miss[k].toFixed(1)} mm`);
        const pads = [h.sk.fingers[0], h.sk.fingers[1], h.sk.fingers[2], h.sk.thumb].map((d) => d.joints[3]);
        const strs = [h.strings.index, h.strings.middle, h.strings.ring, h.strings.thumb];
        pads.forEach((p, i) => {
          const s = g.strings[strs[i]];
          assert.ok(Math.abs(p.x - s.x) <= 3, `pad ${i} is ${Math.abs(p.x - s.x).toFixed(1)} mm from its string`);
          assert.ok(p.y < s.y0 && p.y > s.y1, `pad ${i} lies along its string`);
          assert.ok(Math.abs(p.z) <= 12, `pad ${i} at the string plane (z ${p.z.toFixed(1)})`);
        });
      });
      it(`${which}: the little finger is not used — off the strings`, () => {
        const tip = h.sk.fingers[3].joints[3];
        assert.ok(tip.z * side >= 15, `little finger ${(tip.z * side).toFixed(0)} mm off the strings`);
      });
      it(`${which}: the thumb high on the highest string; the fingers two strings apart, sloping down`, () => {
        assert.equal(h.strings.index, h.strings.thumb - 2);
        assert.equal(h.strings.middle, h.strings.thumb - 4);
        assert.equal(h.strings.ring, h.strings.thumb - 6);
        const t = h.sk.thumb.joints[3];
        const [i, m, r] = h.sk.fingers.map((d) => d.joints[3]);
        assert.ok(t.y < i.y && i.y <= m.y && m.y <= r.y, 'thumb highest, then index, middle, ring');
        // the thumb held up, above every finger's pad
        assert.ok(t.y < Math.min(i.y, m.y, r.y) - 30, 'the thumb high over the fingers');
      });
      it(`${which}: the whole hand on its own side of the strings`, () => {
        for (const d of [...h.sk.fingers, h.sk.thumb]) for (const j of d.joints) assert.ok(j.z * side > 0, `${d.name} joint through the strings`);
        for (const q of h.sk.palm) assert.ok(q.z * side > 0, 'palm through the strings');
        assert.ok(f.o.z * side > 40, 'the wrist out from the strings');
      });
      it(`${which}: natural joints and wrist; an adult arm`, () => {
        for (const d of h.sk.fingers.slice(0, 3)) {
          const b = fingerFlexDeg(f, d);
          assert.ok(b.mcp >= -5 && b.mcp <= 70, `${d.name} knuckle ${b.mcp.toFixed(0)}°`);
          assert.ok(b.pip <= 95, `${d.name} middle joint ${b.pip.toFixed(0)}°`);
        }
        assert.ok(harpWristBend(h) <= 30, `wrist ${harpWristBend(h).toFixed(0)}°`);
        assert.ok(Math.abs(h3.len(h3.sub(h.elbow, h.shoulder)) - HARP_ARM.upper) < 1.5, 'upper arm 300 mm');
        assert.ok(Math.abs(h3.len(h3.sub(f.o, h.elbow)) - HARP_ARM.fore) < 1.5, 'forearm 255 mm');
      });
    }
    it('the right hand plays higher (nearer the shoulder) than the left', () => {
      assert.ok(H.R.strings.thumb > H.L.strings.thumb);
    });
    it('an adult seated body: thighs and shins, the soundbox on the right shoulder, the knees either side of it', () => {
      const B = harpistBody(lever);
      for (const [hip, knee, foot] of [
        [B.hipR, B.kneeR, B.footR],
        [B.hipL, B.kneeL, B.footL],
      ]) {
        const thigh = h3.len(h3.sub(knee, hip));
        assert.ok(thigh >= 400 && thigh <= 480, `thigh ${thigh.toFixed(0)}`);
        // PlayerFigure's ankle: 40 mm behind and 70 mm above the ball of the foot.
        const ankle = { x: foot.x - 40, y: foot.y - 70, z: foot.z };
        const shin = h3.len(h3.sub(ankle, knee));
        assert.ok(shin >= 390 && shin <= 480, `shin ${shin.toFixed(0)}`);
      }
      // The soundbox's back at the right shoulder's height: within 9 cm of the shoulder joint.
      const sh = B.shoulderR;
      let best = Infinity;
      for (let t = 0; t <= 1; t += 0.005) {
        const p = g.backAt(t);
        if (Math.abs(p[1] - sh.y) < 6) best = Math.min(best, p[0] - sh.x);
      }
      assert.ok(best > 0 && best <= 90, `the soundbox ${best.toFixed(0)} mm in front of the shoulder joint`);
      // knees either side of the soundbox (its half-width there)
      for (const k of [B.kneeR, B.kneeL]) {
        const t = (k.y - g.b0[1]) / (g.b1[1] - g.b0[1]);
        assert.ok(Math.abs(k.z) - 60 >= g.widthAt(Math.max(0, t)) / 2 - 5, 'a knee beside the soundbox, not in it');
      }
    });
  });
}
