// SS OPERATE · Line check — an OUTPUT line must not be read as a stagebox LED / channel meter.
// Two verifiers confirmed (2026-10-31): the bezel kept its input names on outputs, so Wedge 2
// (led:true, meter:false = signal present, wrong feed) read "STAGEBOX LED LIT / CH METER FLAT".
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const ops = read('src/screens/lab/soundsystems/pagesOperate.tsx');
const art = read('src/screens/lab/soundsystems/art/diagrams.tsx');
const guide = read('src/screens/lab/soundsystems/soundsystemsScreenGuides.ts');

describe('SS line check: output readings carry output names', () => {
  it('the bezel switches its two reading keys by line kind', () => {
    assert.match(ops, /const isOut = LINE_OUTPUTS\.some\(/);
    assert.match(ops, /k: isOut \? 'PROC OUT' : 'STAGEBOX LED'/);
    assert.match(ops, /k: isOut \? 'RIGHT FEED' : 'CH METER'/);
    assert.match(ops, /isOut \? 'SIGNAL' : 'LIT'/);
    assert.match(ops, /isOut \? 'YES' : 'MOVING'/);
  });
  it('Wedge 2 stays signal-present, wrong-feed (the data was right; only the labels were wrong)', () => {
    assert.match(ops, /id: 'w2'[^\n]*healthy: false[^\n]*led: true, meter: false/);
  });
  it('the KeyFact output rule matches what an output shows', () => {
    assert.doesNotMatch(ops, /Both moving but the wrong box plays/);
    assert.match(ops, /signal present but the wrong feed plays = the output patch/);
  });
  it('the unprobed blurb and the Body name the output readings too', () => {
    assert.match(ops, /Tap PROBE to check for output signal and whether the box plays its own feed/);
    assert.match(ops, /On an output: is there signal at the processor output, and does the box play its own feed\?/);
  });
  it('the strip only speaks "stagebox LED / channel meter" for the input strip', () => {
    assert.match(art, /title === 'STAGEBOX INPUT LEDs' \? `stagebox LED/);
  });
  it('the guide names the output keys', () => {
    assert.match(guide, /On an output, PROC OUT \(SIGNAL or NONE\) and RIGHT FEED \(YES or NO\)/);
  });
});
