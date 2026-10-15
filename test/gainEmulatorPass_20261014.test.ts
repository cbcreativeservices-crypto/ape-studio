/**
 * Gain Staging Lab — Android emulator pass 2026-10-14.
 *  • The SOURCE column's number (−30 dB) / FIXED tag sat under the bezel
 *    strip on every page with a quiet source, and the X-Ray column's
 *    highlight covered the INPUT header (M6): the column ran past the glass
 *    because the meter's chrome budget (110) was short of the real line
 *    heights (~124) and never counted the second line of "QUIET SOURCE".
 *  • The dock KEY read "+0" while its fader read "+0 dB".
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (rel: string) => readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const body = (file: string, name: string) => {
  const i = file.indexOf(`export function ${name}`);
  return file.slice(i, file.indexOf('\nexport function', i + 10));
};

describe('Gain ChainStage keeps every column on the glass', () => {
  const viz = read('src/screens/lab/gain/gainViz.tsx');
  const stage = body(viz, 'ChainStage');
  it('the chrome budget covers the real line heights', () => {
    const m = /const METER_CHROME = (\d+);/.exec(viz);
    assert.ok(m && Number(m[1]) >= 124, 'METER_CHROME ≥ 124 (sum of the column chrome)');
  });
  it('a two-line region word reserves its second line, or drops to one word', () => {
    assert.match(stage, /const twoLineLabel = cols\.some\(/);
    assert.match(stage, /const shortLabel = twoLineLabel && room - REGION_LINE < MIN_METER;/);
    assert.match(stage, /twoLineLabel && !shortLabel \? REGION_LINE : 0/);
    assert.match(stage, /<StageMeterV node=\{c\.node\} height=\{meterH\} shortLabel=\{shortLabel\} \/>/);
  });
  it('the short label keeps the first word ("QUIET"), the readout/FIXED tag below is untouched', () => {
    const meter = body(viz, 'StageMeterV');
    assert.match(meter, /shortLabel \? regionLabelFor\(node\)\.split\(' '\)\[0\] : regionLabelFor\(node\)/);
    assert.match(stage, /c\.readout \? \(/);
    assert.match(stage, /<Text style=\{s\.fixedTagText\}>FIXED<\/Text>/);
  });
});

describe('Gain dock keys carry the unit', () => {
  for (const f of ['modLearn.tsx', 'modExplore.tsx']) {
    it(f, () => {
      const s = read(`src/screens/lab/gain/modules/${f}`);
      assert.match(s, /const fmtG = fmtDb;/);
      assert.doesNotMatch(s, /formatShort: \(\) => `\$\{source\}`,/);
      for (const m of s.matchAll(/formatShort: \(\) => ([^,\n]+),/g)) {
        assert.ok(/fmtG\(|dB`/.test(m[1]), `formatShort ${m[1]} shows dB`);
      }
    });
  }
});
