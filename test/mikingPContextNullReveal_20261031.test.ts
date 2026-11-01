/**
 * Miking — shared Studio-or-live page (pages/PContext.tsx), 2026-10-31.
 * Two verifiers confirmed: B03/B10 offer OMNI (no null → "≈ NaN°" in the NULL
 * cell and the reveal), and B09 offers FIGURE-8 only, whose null is at the
 * SIDES (90°) with a full rear lobe — the generic reveal called it "toward the
 * rear". The physics below is the reason for each branch.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gainDb, nullAngles } from '../src/screens/lab/miking/engine/physics/polar.ts';
import { fmtDb } from '../src/screens/lab/miking/engine/model/units.ts';

const SRC = readFileSync('src/screens/lab/miking/pages/PContext.tsx', 'utf8').replace(/\r\n/g, '\n');

test('physics: omni has no null; figure-8 nulls at 90° with a 0 dB rear; super/hyper nulls are toward the rear', () => {
  assert.deepEqual(nullAngles('omni'), []);
  assert.equal(Math.round(nullAngles('figure8')[0]), 90);
  assert.equal(fmtDb(gainDb('figure8', 180)), '0.0 dB');
  assert.equal(fmtDb(gainDb('omni', 180)), '0.0 dB');
  assert.equal(Math.round(nullAngles('supercardioid')[0]), 125);
  assert.equal(Math.round(nullAngles('hypercardioid')[0]), 109);
});

test('NULL cell reads NONE when the pattern has no null (never NaN)', () => {
  assert.match(SRC, /k: 'NULL', v: !nulls\.length \? 'NONE' : tried \?/);
});

test('reveal: omni and figure-8 get their own lines before the generic "toward the rear" sentence', () => {
  const omni = SRC.indexOf('an omni hears every direction about equally');
  const fig8 = SRC.indexOf('a figure-8 rejects most at its sides');
  const generic = SRC.indexOf('toward the rear but OFF the axis');
  assert.ok(omni > 0 && fig8 > 0 && generic > 0);
  assert.ok(omni < generic && fig8 < generic, 'specific branches come before the generic one');
  assert.match(SRC, /\) : !nulls\.length \? \(/);
  assert.match(SRC, /\) : pattern === 'figure8' \? \(/);
});
