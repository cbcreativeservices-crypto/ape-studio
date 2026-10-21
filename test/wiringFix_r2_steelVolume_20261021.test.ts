/**
 * Miking C04, the steel's signal path (owner 2026-10-21): the signal leaves the
 * output jack on the steel's body and runs through the VOLUME PEDAL, a separate
 * box on the floor. The pitch pedals and knee levers are mechanical: on the
 * path the node reads VOL PEDAL, never "PEDALS", and its card says so.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = join(import.meta.dirname, '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const amp = read('src/screens/lab/miking/lessons/shared/electric/ampPages.tsx');

describe('C04 — the steel’s path names the volume pedal, not the pitch pedals', () => {
  it('a volume-pedal chain renames the path node VOL PEDAL (short enough for the dock readout)', () => {
    assert.match(amp, /const volumeOnPath = spec\.chain\.pedals === 'volume';/);
    assert.match(amp, /short: 'VOL PEDAL'/);
    assert.ok('VOL PEDAL'.length <= 9);
  });
  it('its card says the signal leaves the body jack and the pitch pedals carry no signal', () => {
    assert.match(amp, /output jack on the steel’s body/);
    assert.match(amp, /pitch pedals and knee levers only move rods to the changer: no signal goes through them/);
  });
  it('the path drawing, its items and its card all use the path names', () => {
    assert.match(amp, /chainIds\.map\(\(id\) => pathById\(id\)\)/);
    assert.match(amp, /const cs = pathById\(cSel\);/);
    assert.match(amp, /shortOf=\{pathShortOf\}/);
  });
  it('the steel chain is the one that uses the volume pedal', () => {
    assert.match(read('src/screens/lab/miking/lessons/c04Steel/pages.tsx'), /chain: \{ pedals: 'volume'/);
  });
});
