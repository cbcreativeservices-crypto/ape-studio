/**
 * B12 Meet It step 4, the FOCUS slider. The element moved its true 20 mm on a
 * dish filling the screen, a few pixels, with the rays always meeting at the
 * focus, which read as hitting the element. The tool now carries a close-up
 * of the focus at its own scale: the gap opens to the true mm.
 *
 * This drives the real step hook through a small hook host: move the fader,
 * re-run the hook, then read what the stage is given and work out the pixels.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import React from 'react';

const R = <T,>(m: T): T => ((m as { default?: T }).default ?? m);
const { useDishStep } = R(await import('../src/screens/lab/miking/lessons/shared/sports/sportsTools.tsx'));
const { DishSection, dishFocusInset, focusWindow } = R(await import('../src/screens/lab/miking/lessons/shared/sports/DishArt.tsx'));
const { Dim, fieldXform } = R(await import('../src/screens/lab/miking/lessons/shared/field/FieldStage.tsx'));
const { DISHES, DISH_IDS } = R(await import('../src/screens/lab/miking/lessons/shared/sports/parabolic.ts'));

/** A minimal hook host: useState keeps its slots across runs; effects are not run. */
function hostHook<T>(hook: () => T) {
  const internals = (React as unknown as Record<string, { H: unknown }>).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  const slots: unknown[] = [];
  const run = (): T => {
    let i = 0;
    const was = internals.H;
    internals.H = {
      useState(init: unknown) {
        const at = i++;
        if (!(at in slots)) slots[at] = typeof init === 'function' ? (init as () => unknown)() : init;
        return [slots[at], (v: unknown) => { slots[at] = typeof v === 'function' ? (v as (p: unknown) => unknown)(slots[at]) : v; }];
      },
      useEffect() {},
    };
    try {
      return hook();
    } finally {
      internals.H = was;
    }
  };
  return run;
}

type El = { type: unknown; props: Record<string, unknown> };
function walk(n: unknown, out: El[] = []): El[] {
  if (Array.isArray(n)) n.forEach((c) => walk(c, out));
  else if (n && typeof n === 'object' && 'props' in n) {
    out.push(n as El);
    walk((n as El).props.children, out);
  }
  return out;
}

const STAGE = { w: 355, h: 290 }; // the phone stage measured in the tool
const run = hostHook(() => useDishStep({ onInteractive: () => undefined, done: false }));
function at(v: number) {
  const fader = run().rack.params.find((p: { id: string }) => p.id === 'focus');
  fader.onChange(v);
  const step = run();
  const stage = step.rack.render(STAGE.w, STAGE.h) as El;
  return { step, props: stage.props as { inset: ReturnType<typeof dishFocusInset>; box: never; a11y: string; children: (px: number) => unknown } };
}
/** On-screen px of a span of mm in the inset, at the phone stage. */
function insetPx(inset: ReturnType<typeof dishFocusInset>, mm: number) {
  return mm * fieldXform(inset.view, inset.box, inset.at.w * STAGE.w, inset.at.h * STAGE.h).s;
}

describe('B12 FOCUS slider: the gap is plain to see', () => {
  it('at +20 mm the close-up draws the element 20 mm past where the rays meet, with the true readout', () => {
    const f = DISHES.large.f;
    const { step, props } = at(1);
    assert.ok(props.inset, 'the tool has no close-up');
    const drawn = walk(props.inset.draw(1));
    const section = drawn.find((e) => e.type === DishSection);
    assert.equal(section?.props.elementOffset, 20);
    const dim = drawn.find((e) => e.type === Dim);
    assert.ok(dim, 'no gap is drawn');
    assert.deepEqual([(dim.props.a as { u: number }).u, (dim.props.b as { u: number }).u], [f, f + 20]);
    assert.ok(props.inset.labels?.some((l) => l.text === '20 mm GAP'));
    assert.equal(step.rack.bezel.find((b: { k: string }) => b.k === 'FOCUS').v, '+20 mm');
  });

  it('at the other end the same true gap opens the other way', () => {
    const { step, props } = at(0);
    const dim = walk(props.inset.draw(1)).find((e) => e.type === Dim);
    const f = DISHES.large.f;
    assert.deepEqual([(dim!.props.a as { u: number }).u, (dim!.props.b as { u: number }).u], [f, f - 20]);
    assert.equal(step.rack.bezel.find((b: { k: string }) => b.k === 'FOCUS').v, '−20 mm');
  });

  it('at 0 there is no gap and the label says so', () => {
    const { props } = at(0.5);
    assert.equal(walk(props.inset.draw(1)).find((e) => e.type === Dim), undefined);
    assert.ok(props.inset.labels?.some((l) => l.text === 'AT FOCUS'));
  });

  it('the gap is easy to see at phone size, and far larger than on the whole dish', () => {
    for (const id of DISH_IDS) {
      const inset = dishFocusInset(DISHES[id], 20, 0);
      assert.ok(insetPx(inset, 20) >= 20, `${id}: ${insetPx(inset, 20)} px`);
      assert.ok(insetPx(inset, 2) >= 2, `${id}: the smallest step`);
      const r = Math.sqrt(4 * DISHES[id].f * DISHES[id].depth);
      const whole = fieldXform('side', { u0: -260, u1: DISHES[id].depth + 640, v0: -r - 120, v1: r + 220 }, STAGE.w, STAGE.h);
      assert.ok(insetPx(inset, 20) >= 3 * 20 * whole.s, `${id}: the whole-dish view shows ${20 * whole.s} px`);
    }
  });

  it('the close-up holds the whole element at either end of the slide, on both dishes', () => {
    for (const id of DISH_IDS) {
      const d = DISHES[id];
      const b = focusWindow(d);
      for (const off of [-20, 20]) {
        assert.ok(d.f + off - 6 >= b.u0 && d.f + off + 42 <= b.u1, `${id} ${off}`);
      }
      assert.ok(b.v0 < -10 && b.v1 > 10);
    }
  });

  it('the words stop saying the reflections meet at the element when it has moved', () => {
    const off = at(1).props.a11y;
    assert.doesNotMatch(off, /meet at the element/);
    assert.match(off, /meet at the focus, 20 mm from the element/);
    assert.match(at(0.5).props.a11y, /meet at the element/);
  });

  it('the badge says the close-up is magnified', () => {
    assert.match(at(0.5).step.rack.badge, /magnified/);
  });

  it('the whole-dish drawing still uses the true offset, and other callers stay at 0', () => {
    const main = walk(at(1).props.children(1)).find((e) => e.type === DishSection);
    assert.equal(main?.props.elementOffset, 20);
    for (const file of ['b12Parabolic/pages.tsx', 'shared/sports/sportsPages.tsx']) {
      const src = readFileSync(`src/screens/lab/miking/lessons/${file}`, 'utf8').replace(/\r\n/g, '\n');
      assert.match(src, /<DishSection dish=/);
      assert.doesNotMatch(src, /elementOffset/, file);
    }
  });
});
