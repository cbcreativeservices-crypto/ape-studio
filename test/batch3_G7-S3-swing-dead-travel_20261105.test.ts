/**
 * S3: SWING must keep drawing something new over its whole travel.
 *   F04 THE HIT: the crown used to saturate at t = 0.65 (swing 0.3), so the
 *   last stretch of the slider drew nothing new, and it also grew hidden
 *   behind the basin's rim right after the entry.
 *   F01 SOLID: a concrete bed does not flex, so the shoe stayed at y = 0 for
 *   every positive swing: the same picture from 0 to 100 %. The weight now
 *   rolls heel to toe, and the shoe still never sinks into a solid floor.
 * The real components are called and their drawn elements read.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { ReactElement, ReactNode } from 'react';

const { WaterHitTail } = await import('../src/screens/lab/miking/lessons/f04Impacts/soundArt.tsx');
const { FootstepFloor, Shoe } = await import('../src/screens/lab/miking/lessons/f01Footsteps/soundArt.tsx');
const { ContactMark, SplashCrown } = await import('../src/screens/lab/miking/lessons/shared/foley/contactMarks.tsx');

type El = ReactElement<Record<string, unknown>>;
function find(node: ReactNode, type: unknown): El | null {
  if (Array.isArray(node)) {
    for (const n of node) {
      const hit = find(n, type);
      if (hit) return hit;
    }
    return null;
  }
  if (!node || typeof node !== 'object' || !('type' in node)) return null;
  const el = node as El;
  if (el.type === type) return el;
  return find(el.props.children as ReactNode, type);
}

const SWINGS = Array.from({ length: 21 }, (_, i) => (i * 5) / 100); // 0 … 1 by the slider's own 0.05 step
const props = { w: 343, h: 300, variant: 'tile', accessibilityLabel: '' };

describe('F04 THE HIT: the crown uses the whole of SWING', () => {
  const crownAt = (swing: number) => {
    const el = find(WaterHitTail({ ...props, variant: 'water', mode: 'together', swing }), SplashCrown);
    return el ? (el.props.k as number) : 0;
  };

  it('no crown before the entry', () => {
    assert.equal(crownAt(-1), 0);
    assert.equal(crownAt(-0.75), 0);
  });

  it('every slider step after the entry draws a bigger crown, right to the end', () => {
    const steps = Array.from({ length: 34 }, (_, i) => -0.65 + i * 0.05);
    for (let i = 1; i < steps.length; i++) {
      assert.ok(crownAt(steps[i]) > crownAt(steps[i - 1]), `swing ${steps[i - 1].toFixed(2)} to ${steps[i].toFixed(2)} draws nothing new`);
    }
    assert.ok(crownAt(1) - crownAt(0.3) > 0.15, 'the last stretch must be a change a student can see');
    assert.ok(Math.abs(crownAt(1) - 1) < 1e-9);
  });

  it('the crown shows above the rim as soon as the entry happens', () => {
    // SplashCrown: tip height 24 + 134 k; the rim is 60 above the water.
    assert.ok(24 + 134 * crownAt(-0.65) >= 60, 'the first crown after the entry is hidden behind the near wall');
  });
});

describe('F01 SOLID: the weight goes on across the whole of SWING', () => {
  const at = (swing: number, mode: 'together' | 'opposed' = 'together') => {
    const tree = FootstepFloor({ ...props, mode, swing });
    return { shoe: find(tree, Shoe)!.props, mark: find(tree, ContactMark)?.props };
  };
  const lift = (swing: number) => (at(swing).shoe.heelLift as number | undefined) ?? 0;
  const markX = (swing: number) => (at(swing).mark!.c as number[])[0];

  it('the shoe rolls further at every slider step', () => {
    for (let i = 1; i < SWINGS.length; i++) {
      assert.ok(lift(SWINGS[i]) > lift(SWINGS[i - 1]), `swing ${SWINGS[i]} draws nothing new`);
    }
  });

  it('the pressure mark walks from heel to ball with the weight', () => {
    assert.ok(markX(1) - markX(0.1) > 180, `the mark moved only ${markX(1) - markX(0.1)} mm`);
    for (let i = 3; i < SWINGS.length; i++) assert.ok(markX(SWINGS[i]) > markX(SWINGS[i - 1]));
  });

  it('a concrete bed never flexes: the shoe and the mark stay on the surface', () => {
    for (const s of SWINGS) {
      assert.equal(at(s).shoe.y, 0);
      const mark = at(s).mark;
      if (mark) assert.equal((mark.c as number[])[1], 0);
    }
  });

  it('the rest position and the foot lifting are unchanged and join up', () => {
    assert.equal(lift(0), 0);
    assert.equal(at(0).mark, undefined);
    assert.equal(lift(-0.5), 0);
    assert.equal(at(-0.5).shoe.y, -30);
  });

  it('the hollow floor takes the same step and still flexes', () => {
    assert.equal(at(1, 'opposed').shoe.heelLift, at(1).shoe.heelLift);
    assert.equal(at(1, 'opposed').shoe.y, 6);
    assert.equal((at(1, 'opposed').mark!.c as number[])[1], 6);
  });
});
