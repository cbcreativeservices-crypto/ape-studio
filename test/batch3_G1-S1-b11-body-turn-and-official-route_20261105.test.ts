/**
 * B11 (and every step built on the same hooks), batch 3 G1-S1, 2026-11-05.
 *
 * S1: TURN on A BODY MIC, FRONT AND SIDE fed only the readouts: the figure is
 * drawn from fixed poses. A corner view from above now turns the head, keeps
 * the chest mic on the chest, and draws the mouth-to-mic line, whose length
 * follows the readout. A headset goes round with the head: constant distance.
 *
 * S3: OFFICIAL MIC changed nothing on screen while TRACE stayed on the coach,
 * because RoutingPanel lights only the traced source. A switch that acts on
 * another source now moves the trace to it.
 *
 * Runs the real hooks through a small hook runner (state kept between runs,
 * as a re-render does), reads what the step hands the drawing and presses its
 * real controls.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as React from 'react';

const R = <T,>(m: T): T => ((m as { default?: T }).default ?? m);
const { useBodyStep, useFeedsStep } = R(await import('../src/screens/lab/miking/lessons/shared/broadcast/sportPages.tsx'));
const { RoutingPanel } = R(await import('../src/screens/lab/miking/lessons/shared/broadcast/RoutingPanel.tsx'));
const { chestVsHeadset, TORSO } = R(await import('../src/screens/lab/miking/lessons/shared/broadcast/standing.ts'));
const { turnHead } = R(await import('../src/screens/lab/miking/lessons/shared/broadcast/talkerPose.ts'));
const { Dim, FieldStage } = R(await import('../src/screens/lab/miking/lessons/shared/field/FieldStage.tsx'));

type El = { type?: unknown; props?: Record<string, unknown> };
type Step = {
  rack: {
    render: (w: number, h: number) => unknown;
    params: { id: string }[];
    bezel: { k: string; v: string }[];
  };
};
type Control = { onChange: (v: number) => void; onSelect: (v: string) => void };
type Inset = {
  view: string;
  at: { x: number; y: number; w: number; h: number };
  draw: (px: number) => unknown;
  labels: { text: string }[];
};
const INTERNALS = (React as unknown as Record<string, { H: unknown }>).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;

/** Runs a hook as a component would: useState keeps its cells between runs. */
function runner(hook: () => unknown): () => Step {
  const cells: unknown[] = [];
  let i = 0;
  const dispatcher = {
    useState(init: unknown) {
      const k = i++;
      if (!(k in cells)) cells[k] = typeof init === 'function' ? (init as () => unknown)() : init;
      return [
        cells[k],
        (v: unknown) => {
          cells[k] = typeof v === 'function' ? (v as (q: unknown) => unknown)(cells[k]) : v;
        },
      ];
    },
    useMemo: (f: () => unknown) => f(),
  };
  return () => {
    i = 0;
    const prev = INTERNALS.H;
    INTERNALS.H = dispatcher;
    try {
      return hook() as Step;
    } finally {
      INTERNALS.H = prev;
    }
  };
}

/** Every element of a tree of plain React elements, without rendering them. */
function walk(n: unknown, out: El[] = []): El[] {
  if (Array.isArray(n)) n.forEach((c) => walk(c, out));
  else if (React.isValidElement(n)) {
    out.push(n as El);
    walk((n.props as { children?: unknown }).children, out);
  }
  return out;
}
const param = (step: Step, id: string) => {
  const p = step.rack.params.find((q) => q.id === id);
  assert.ok(p, `no control ${id}`);
  return p as unknown as Control;
};
const drawn = (step: Step, type: unknown) => walk(step.rack.render(355, 290)).find((e) => e.type === type);

const bodySpec = {
  wearers: ['coach', 'official', 'athlete'],
  words: { looking: '', prompt: '', done: '', wearer: { coach: '', official: '', athlete: '' } },
} as never;

describe('B11 TURN is seen on the body-mic step', () => {
  const corner = (step: Step) => {
    const stage = drawn(step, FieldStage);
    assert.ok(stage, 'the step draws a FieldStage');
    const inset = stage.props!.inset as Inset | null | undefined;
    assert.ok(inset, 'a corner view is drawn');
    const dim = walk(inset.draw(1)).find((e) => e.type === Dim);
    assert.ok(dim, 'the corner view draws the mouth-to-mic line');
    const { a, b } = dim.props as { a: { u: number; v: number }; b: { u: number; v: number } };
    return { inset, a, b, plan: Math.hypot(a.u - b.u, a.v - b.v) };
  };
  const yawTo = (step: Step, deg: number) => param(step, 'turn').onChange((deg + 60) / 120);

  it('the corner view is from above and stays in the stage', () => {
    const run = runner(() => useBodyStep(bodySpec));
    const { inset } = corner(run());
    assert.equal(inset.view, 'top');
    assert.ok(inset.at.x >= 0 && inset.at.y >= 0 && inset.at.x + inset.at.w <= 1 && inset.at.y + inset.at.h <= 1);
  });

  it('with a chest mic the mic stays, the mouth goes round, the line follows the readout', () => {
    const run = runner(() => useBodyStep(bodySpec));
    for (const yaw of [0, 30, 60, -60]) {
      yawTo(run(), yaw);
      const c = corner(run());
      const m = turnHead(yaw, 0).mouth;
      assert.ok(Math.hypot(c.a.u - m.x, c.a.v - m.z) < 1e-6, 'the line starts at the turned mouth');
      assert.deepEqual([c.b.u, c.b.v], [TORSO.sternum.x, TORSO.sternum.z], 'the chest mic has not moved');
      const d = chestVsHeadset(yaw, 0, turnHead).chest.d;
      assert.ok(Math.abs(Math.hypot(c.plan, TORSO.sternum.y - m.y) - d) < 1e-6, `with the height, the line is the ${d} mm the readout says`);
      assert.ok(c.inset.labels.some((l) => l.text === `${Math.round(d / 10)} cm`), 'the corner names the distance');
    }
    yawTo(run(), 0);
    const a = corner(run()).plan;
    yawTo(run(), 60);
    const b = corner(run()).plan;
    assert.ok(b > a + 80, `a student sees the line grow (${a} to ${b} mm)`);
  });

  it('with a headset the distance stays the same at every turn', () => {
    const run = runner(() => useBodyStep(bodySpec));
    param(run(), 'at').onSelect('headset');
    const plans = [-60, -30, 0, 30, 60].map((yaw) => {
      yawTo(run(), yaw);
      const c = corner(run());
      const m = turnHead(yaw, 0).mouth;
      assert.ok(Math.hypot(c.a.u - m.x, c.a.v - m.z) < 1e-6, 'the mouth turns');
      return c.plan;
    });
    for (const p of plans) assert.ok(Math.abs(p - plans[0]) < 1e-6, `constant: ${plans.join(', ')}`);
  });
});

const lit = (step: Step) => (drawn(step, RoutingPanel)!.props as { trace: string }).trace;
const reaches = (step: Step) => step.rack.bezel.find((b) => b.k === 'REACHES')!.v;
const b11Feed = {
  feed: {
    commentators: [{ id: 'coach', label: 'Coach', short: 'COACH' }],
    official: { id: 'off', label: 'Official', short: 'OFFICIAL' },
    dests: ['pa', 'program', 'recorder'],
  },
  looks: {},
  controls: ['official', 'priv'],
  privateCircuit: { label: 'Private' },
  words: { looking: '', prompt: '', done: '' },
  points: [],
} as never;
const b09Feed = {
  feed: {
    commentators: [{ id: 'cA', label: 'A', short: 'A' }, { id: 'cB', label: 'B', short: 'B' }],
    crowd: { id: 'crowd', label: 'Crowd', short: 'CROWD' },
    producer: { id: 'prod', label: 'Producer', short: 'PRODUCER' },
    dests: ['program', 'recorder', 'phones', 'ifb', 'talkback'],
  },
  looks: {},
  controls: ['key', 'ret', 'crowd'],
  words: { looking: '', prompt: '', done: '' },
  points: [],
} as never;

describe('a feed switch lights the source it acts on', () => {
  it('B11: OFFICIAL MIC moves the trace to the official, and the lit route changes', () => {
    const run = runner(() => useFeedsStep(b11Feed));
    assert.equal(lit(run()), 'coach', 'starts on the coach');
    param(run(), 'f.official').onSelect('paProgram');
    assert.equal(lit(run()), 'off');
    assert.equal(reaches(run()), '3');
    param(run(), 'f.official').onSelect('off');
    assert.equal(reaches(run()), '0');
  });

  it('the PRIVATE switch has its own strip and leaves the trace alone', () => {
    const run = runner(() => useFeedsStep(b11Feed));
    param(run(), 'f.priv').onSelect('tryAir');
    assert.equal(lit(run()), 'coach');
  });

  it('B09: CROWD, MIC KEY and RETURN each light their own source', () => {
    const run = runner(() => useFeedsStep(b09Feed));
    param(run(), 'f.crowd').onSelect('none');
    assert.equal(lit(run()), 'crowd');
    param(run(), 'f.key').onSelect('cough');
    assert.equal(lit(run()), 'cA');
    param(run(), 'trace').onSelect('crowd');
    param(run(), 'f.ret').onSelect('full');
    assert.equal(lit(run()), 'cA', 'the return changes the commentators’ routes, so one of them is lit');
  });

  it('RETURN leaves the trace on a commentator already traced', () => {
    const run = runner(() => useFeedsStep(b09Feed));
    param(run(), 'trace').onSelect('cB');
    param(run(), 'f.ret').onSelect('full');
    assert.equal(lit(run()), 'cB');
  });

  it('TRACE itself still picks any source', () => {
    const run = runner(() => useFeedsStep(b11Feed));
    param(run(), 'f.official').onSelect('pa');
    param(run(), 'trace').onSelect('coach');
    assert.equal(lit(run()), 'coach');
  });
});
