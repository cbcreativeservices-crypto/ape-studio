/**
 * Ensemble seating plan: the timpanist's mallets (owner 2026-11-22).
 *
 * The owner, on the Concert Snare's sticks: "look for other labs with drum sticks and make sure they are
 * not all crazy like this example. It should look like normal stick tech. usage". The sweep found the
 * timpani station's two mallet heads 85 mm from the drum CENTERS; a timpani head is struck about a
 * hand's width in from the rim nearest the player.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TIMPANI_ARC, TIMPANI_MALLETS, TIMPANI_MALLET_MM, TIMPANI_SET, TIMPANI_STRIKE_IN } from '../src/screens/lab/miking/lessons/shared/ensemble/seating.ts';

const centre = (i: number) => {
  const a = (TIMPANI_SET[i].a * Math.PI) / 180;
  return { u: Math.sin(a) * TIMPANI_ARC, v: -Math.cos(a) * TIMPANI_ARC };
};
const dist = (p: { u: number; v: number }, q: { u: number; v: number }) => Math.hypot(p.u - q.u, p.v - q.v);

test('one mallet on each of the two middle drums, left hand to the left drum', () => {
  assert.deepEqual(TIMPANI_MALLETS.map((m) => m.drum), [1, 2]);
  assert.ok(TIMPANI_MALLETS[0].hand.u < 0 && TIMPANI_MALLETS[0].head.u < 0);
  assert.ok(TIMPANI_MALLETS[1].hand.u > 0 && TIMPANI_MALLETS[1].head.u > 0);
});

test('each head lands a hand\u2019s width inside the rim nearest the player, never near the center', () => {
  for (const m of TIMPANI_MALLETS) {
    const R = TIMPANI_SET[m.drum].d / 2;
    const fromCentre = dist(m.head, centre(m.drum));
    assert.ok(Math.abs(fromCentre - (R - TIMPANI_STRIKE_IN)) < 0.5, `drum ${m.drum}: ${fromCentre}`);
    assert.ok(TIMPANI_STRIKE_IN >= 70 && TIMPANI_STRIKE_IN <= 120);
    assert.ok(fromCentre > R * 0.6, 'well away from the center');
    // on the player's side of the drum: nearer the player (the origin) than the drum's center is
    assert.ok(Math.hypot(m.head.u, m.head.v) < TIMPANI_ARC - R * 0.6);
  }
});

test('a mallet seen from above is never longer than a real one, and not a stub', () => {
  for (const m of TIMPANI_MALLETS) {
    const len = dist(m.hand, m.head);
    assert.ok(len <= TIMPANI_MALLET_MM - 60, `hand to head ${len} (the hand holds it near the end)`);
    assert.ok(len >= 180, `hand to head ${len}`);
  }
});

test('the hands sit in front of the chest, about shoulder width apart, and the mallets do not cross', () => {
  const [l, r] = TIMPANI_MALLETS;
  const apart = dist(l.hand, r.hand);
  assert.ok(apart >= 180 && apart <= 400, String(apart));
  assert.ok(l.hand.v < -150 && l.hand.v > -300);
  assert.ok(l.head.u < r.head.u);
});

test('the seating plan draws exactly these mallets, each with a felt head', () => {
  const art = readFileSync('src/screens/lab/miking/lessons/shared/ensemble/SeatingArt.tsx', 'utf8').replace(/\r\n/g, '\n');
  assert.match(art, /const \[tL, tR\] = TIMPANI_MALLETS;/);
  assert.match(art, /put\(b\.stick, line\(make\(\), m\.hand, m\.head\)\);\s+put\(b\.mat\.hide, ellipse\(m\.head, 19, 19\)\);/);
  assert.doesNotMatch(art, /P\(-260, -600\)/);
});
