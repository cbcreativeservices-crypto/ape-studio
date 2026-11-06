/**
 * Miking, Starting Setups step 4, gap S2 (2026-11-05). ITEM = AUDIENCE · PA
 * changed the words and the readout while the plan stayed the same to the pixel
 * on every wind and bowed lesson: WindPlan's ring lookup knew neither 'audience'
 * nor 'pa', and BowedPlan's ring only finds objects and wedges. Wind now rings
 * both PA stacks and turns the chairs amber; bowed lights the stage edge and the
 * AUDIENCE · PA name. These read the sources (the plans are Skia, no canvas
 * here); the picture itself was checked by a pixel diff at 375 wide.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const LESSONS = 'src/screens/lab/miking/lessons/';
const src = (p: string) => readFileSync(LESSONS + p, 'utf8').replace(/\r\n/g, '\n');

describe('gap S2: AUDIENCE · PA marks something on the plan', () => {
  const wind = src('shared/woodwinds/WindPlan.tsx');
  const bowed = src('shared/bowed/BowedSettingPage.tsx');

  it('every wind lesson still asks for both the audience and the PA', () => {
    for (const l of ['a06Flute', 'a07Piccolo', 'a08aClarinet', 'a08bBassClarinet', 'a09aOboe', 'a09bBassoon']) {
      const row = src(`${l}/lesson.ts`).split('\n').find((x) => x.includes("id: 'audience'"));
      assert.ok(row?.includes("planIds: ['audience', 'pa']"), l);
    }
  });

  it('WindPlan rings each PA stack, on the stage only', () => {
    assert.match(wind, /id === 'pa' \? \(scene === 'stage' \? STAGE\.pa\.map\(/);
    assert.doesNotMatch(wind, /\[\.\.\.lit\]\.map\(ringAt\)/);
  });

  it('WindPlan turns the chairs amber when the audience is lit, and only then', () => {
    assert.match(wind, /<ChairsTop [^>]*color=\{lit\.has\('audience'\) \? AMBER : '#7d828d'\}/);
  });

  it('BowedPlan lights the stage edge and the name for the audience item', () => {
    assert.match(bowed, /const audienceLit = highlight === 'audience';/);
    assert.match(bowed, /strokeWidth=\{audienceLit \? 34 : 10\} color="#ffc64d" opacity=\{audienceLit \? 1 : 0\.35\}/);
    assert.match(bowed, /text: 'AUDIENCE · PA ↓'[^\n]*tone: audienceLit \? 'amber' : 'muted'/);
  });

  it('the two plans keep their resting look and add no art', () => {
    assert.match(wind, /strokeWidth=\{lit\.has\('audience'\) \? 24 : 10\}/);
    assert.equal((bowed.match(/DashPathEffect intervals=\{\[60, 40\]\}/g) ?? []).length, 1);
  });
});
