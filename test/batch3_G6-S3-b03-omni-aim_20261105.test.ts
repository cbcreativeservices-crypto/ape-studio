/**
 * B03 Meet It step 5, THE ONE-MIC INTERVIEW (batch 3, G6, 2026-11-05).
 *
 * With the omni in hand the mic's aim is ignored, so the AIM chooser looked
 * live and changed nothing a student could see. It now shows LOCKED with the
 * reason until the cardioid is chosen, when it really changes the reading.
 *
 * The real step hook runs here on a tiny useState stand-in, so each test
 * presses the same dock params the phone does and reads what the student reads.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import * as React from 'react';

const R = <T,>(m: T): T => ((m as { default?: T }).default ?? m);
const { useInterviewStep } = R(await import('../src/screens/lab/miking/lessons/shared/broadcast/reporterPages.tsx'));
const { PAIR, SHOULDER_REP } = R(await import('../src/screens/lab/miking/lessons/b03FieldReporter/geometry.ts'));

const internals = (React as unknown as Record<string, { H: unknown }>).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
const art = { art: 'flagHandheld' as const, r: 24, len: 200 };
const SPEC = {
  pair: PAIR,
  shoulder: SHOULDER_REP,
  top: () => null,
  side: () => null,
  box: { u0: -1900, u1: 2700, v0: -2350, v1: 2350 },
  sideBox: { u0: -400, u1: 1200, v0: -420, v1: 700 },
  omni: art,
  dir: art,
  words: { looking: 'looking', prompt: 'prompt', done: 'FINISHED' },
};

type Param = { id: string; locked?: string; onSelect?: (id: string) => void; onChange?: (v: number) => void };

/** One student on the step: the hook's state survives between presses. */
function student() {
  const slots: unknown[] = [];
  let at = 0;
  const useState = (init: unknown) => {
    const i = at++;
    if (!(i in slots)) slots[i] = typeof init === 'function' ? (init as () => unknown)() : init;
    return [slots[i], (v: unknown) => { slots[i] = typeof v === 'function' ? (v as (o: unknown) => unknown)(slots[i]) : v; }];
  };
  const step = () => {
    at = 0;
    internals.H = { useState };
    try {
      return useInterviewStep(SPEC);
    } finally {
      internals.H = null;
    }
  };
  const param = (id: string): Param => step().rack.params.find((p: Param) => p.id === id);
  /** Everything the student reads: the readouts and the well. */
  const seen = () => {
    const s = step();
    return JSON.stringify([s.rack.bezel, s.well]);
  };
  return { param, seen };
}

test('with the omni, AIM cannot change anything, so it is locked and says why', () => {
  const s = student();
  const before = s.seen();
  s.param('aim').onSelect!('between');
  assert.equal(s.seen(), before, 'an omni has no aim: the screen stays the same');
  const reason = s.param('aim').locked;
  assert.ok(reason, 'AIM must be locked while the omni is in hand');
  assert.match(reason!, /cardioid/i, 'the reason names what opens it');
});

test('with the cardioid, AIM is open and each choice changes what the student reads', () => {
  const s = student();
  s.param('pattern').onSelect!('cardioid');
  assert.equal(s.param('aim').locked, undefined);
  const atMouth = s.seen();
  s.param('aim').onSelect!('between');
  const between = s.seen();
  assert.notEqual(between, atMouth);
  assert.match(between, /POINTED BETWEEN/);
});

test('going back to the omni locks AIM again', () => {
  const s = student();
  s.param('pattern').onSelect!('cardioid');
  s.param('pattern').onSelect!('omni');
  assert.ok(s.param('aim').locked);
});

test('the step can still be finished: the cardioid unlocks the BETWEEN it asks for', () => {
  const s = student();
  s.param('at').onChange!(0.5);
  s.param('at').onChange!(1);
  assert.doesNotMatch(s.seen(), /FINISHED/);
  s.param('pattern').onSelect!('cardioid');
  s.param('aim').onSelect!('between');
  assert.match(s.seen(), /FINISHED/);
});

test('the dock honours `locked` on an options key: dimmed, no tray, the reason on tap', () => {
  const src = readFileSync(new URL('../src/screens/lab/rack/RackUnit.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
  const branch = src.slice(src.indexOf("if (p.kind === 'options' && p.locked) {"));
  assert.ok(branch.length < src.length, 'the locked options branch exists');
  const body = branch.slice(0, branch.indexOf('</DockButton') < 0 ? branch.indexOf('/>') : branch.indexOf('</DockButton'));
  assert.match(body, /value="LOCKED"/);
  assert.match(body, /\bdim\b/);
  assert.match(body, /setLockedNoteId/);
  assert.doesNotMatch(body, /setOpenTrayId/);
  assert.match(src, /lp\.kind === 'options'\) && lp\.locked/);
});
