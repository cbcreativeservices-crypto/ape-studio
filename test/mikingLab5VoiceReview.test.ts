/**
 * Lab 5 VOICE review (2026-10-07, docs/labs/reviews/REVIEW_2026_10_07_lab5-voice.md):
 * the fixes a test can pin.
 *
 *   V-01  two cardioids back to back: each is ~6 dB down at its side, and the
 *         two summed hear all round (an omni) — so the side is NOT a place
 *         "where both hear less"; the reason to keep singers in front is that
 *         a side voice lands equally in both channels
 *   V-02  nothing hangs over children's heads — E06's words never make it a
 *         matter of having a rigger (E05 and the shared items say the same)
 *   V-03  the lab's tighter handheld is a supercardioid: E04's wedge note
 *         names the pattern the lesson offers
 *   V-04  plain words: E07 says "bleed (the same sound in both mics)", not
 *         "correlated bleed"
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { lessonById } from '../src/screens/lab/miking/data/lessons.ts';
import type { MikingScenario } from '../src/screens/lab/miking/engine/model/types.ts';

const cardioid = (deg: number) => 0.5 + 0.5 * Math.cos((deg * Math.PI) / 180);
const text = (id: string) => JSON.stringify(lessonById(id));
const scenario = (lesson: string, id: string) => (lessonById(lesson)!.scenarios as MikingScenario[]).find((s) => s.id === id)!;

describe('Lab 5 voice review fixes', () => {
  it('V-01 back-to-back cardioids: the side is 6 dB down per mic, and the sum is an omni', () => {
    assert.ok(Math.abs(20 * Math.log10(cardioid(90)) + 6.02) < 0.05);
    for (let a = 0; a <= 180; a += 15) assert.ok(Math.abs(cardioid(a) + cardioid(180 - a) - 1) < 1e-9);
    const s = scenario('E02', 'bv.mic.4');
    assert.match(s.correct, /equally in both/);
    assert.doesNotMatch(text('E02'), /where both hear less/);
  });

  it('V-02 nothing hangs over the children: no "without a competent rigger" permission', () => {
    const t = text('E06');
    assert.doesNotMatch(t, /over the children’s heads without/);
    assert.match(t, /Nothing hangs over the children’s heads/);
  });

  it('V-03 E04 names the supercardioid for the side-placed wedge', () => {
    assert.doesNotMatch(text('E04'), /hypercardioid a little to one side/);
  });

  it('V-04 E07 explains bleed in plain words', () => {
    assert.doesNotMatch(text('E07'), /[Cc]orrelated bleed/);
  });
});
