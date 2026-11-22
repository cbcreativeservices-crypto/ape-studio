// Owner 2026-11-21 (iPhone): Classroom + HALL looked the same at DAMPING 0 % and 100 %.
// The physics is right (an added reverb's tail is not shortened by wall treatment), so
// the DAMPING lane says it ("Lane says it"). This pins when it says it.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { waterfallDampingHidden } from '../src/screens/lab/meter/meterEngine.ts';

const o = (room: string, reverb: string) => ({ room, damping01: 0.5, eqGains: {}, eqFilter: 'bell220q6', qRing: false, reverb }) as never;

describe('Waterfall: DAMPING hidden by the reverb', () => {
  it('HALL hides it in Classroom and Studio, not in a Cathedral', () => {
    assert.equal(waterfallDampingHidden(o('classroom', 'hall')), true);
    assert.equal(waterfallDampingHidden(o('studio', 'hall')), true);
    assert.equal(waterfallDampingHidden(o('cathedral', 'hall')), false);
  });
  it('never with no reverb, and not with the short ROOM reverb', () => {
    for (const room of ['classroom', 'studio', 'cathedral', 'theater', 'living']) {
      assert.equal(waterfallDampingHidden(o(room, 'none')), false, room);
      assert.equal(waterfallDampingHidden(o(room, 'room')), false, room);
    }
  });
  it('the lane says it, in amber, and its ⓘ explains reverb tails', () => {
    const b = readFileSync('src/screens/lab/meter/modules/modMeterB.tsx', 'utf8').replace(/\r\n/g, '\n');
    assert.match(b, /\? `\$\{Math\.round\(damping01 \* 100\)\}% · \$\{REVERB_LABELS\[reverb\]\.toUpperCase\(\)\} HIDES IT`/);
    assert.match(b, /tint: dampingHidden \? colors\.amber : undefined,/);
    assert.match(b, /helpKey: dampingHidden \? 'reverb_tails' : 'damping',/);
  });
});
