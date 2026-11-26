/** Owner 2026-11-05: Pink Noise has its own Gate caption; mic and speaker SPL fields use the -20 dB floor. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../src/screens/lab/${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

describe('owner decisions 2026-11-05', () => {
  it('Gate lab: Pink Noise has its own caption, CLICK keeps its words', () => {
    const c = read('fxLabConfigs.tsx');
    assert.match(c, /'PINK NOISE': 'PINK NOISE source: a steady hiss\. Set THRESH above its level and the gate shuts; below it, the gate stays open\.'/);
    // owner 2026-11-25, click tempo: the student can move the CLICK's tempo, so 90 BPM is where it starts.
    assert.match(c, /CLICK source \(90 BPM to start\): the gate opens on each hit/);
    assert.match(read('FxLabScreen.tsx'), /config\.exploreCaptionBySource\?\.\[sources\[sourceIdx\]\?\.label\] \?\? config\.exploreCaption/);
  });
  for (const f of ['micsRf.ts', 'speakers.ts', 'speakersAdv.ts']) {
    it(`${f}: SPL inputs carry the floor`, () => {
      const s = read(`calc/workspaces/${f}`);
      assert.match(s, /\.\.\.SPL_INPUT_RANGE/);
      assert.doesNotMatch(s, /SPL_FIELD_RANGE/);
    });
  }
});
