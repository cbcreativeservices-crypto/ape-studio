/**
 * Woodwind "Breath to sound" figure: all four numbered event labels survive
 * the label layout at phone and tablet sizes, for every woodwind and several
 * notes. The bass clarinet's bent neck used to stack ① and ② so the layout
 * dropped "2 REED" (found at the miking-a4 merge, 2026-10-05).
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const R = <T,>(m: T): T => ((m as { default?: T }).default ?? m);
const ws = R(await import('../src/screens/lab/miking/lessons/shared/woodwinds/WindSoundArt.tsx'));
const ph = R(await import('../src/screens/lab/miking/lessons/shared/woodwinds/windPhysics.ts'));
const { fitLabels } = R(await import('../src/screens/lab/miking/engine/scene/labelLayout.ts'));
const { fitXform } = R(await import('../src/screens/lab/miking/engine/geometry/frame.ts'));

const FIGS: [string, string, { u0: number; u1: number; v0: number; v1: number } | null, 1 | -1][] = [
  ['A06', 'a06Flute', { u0: -260, u1: 420, v0: -200, v1: 720 }, -1],
  ['A07', 'a07Piccolo', { u0: -200, u1: 400, v0: -60, v1: 360 }, -1],
  ['A08a', 'a08aClarinet', { u0: -260, u1: 420, v0: -190, v1: 790 }, -1],
  ['A08b', 'a08bBassClarinet', null, 1],
  ['A09a', 'a09aOboe', { u0: -260, u1: 420, v0: -190, v1: 660 }, -1],
  ['A09b', 'a09bBassoon', null, 1],
];

describe('woodwind breath-to-sound step labels', () => {
  for (const [id, dir, box0, side] of FIGS) {
    it(`${id}: all four numbered labels are kept`, async () => {
      const art = R(await import(`../src/screens/lab/miking/lessons/${dir}/art.tsx`));
      const box = box0 ?? art.SOUND_BOX;
      const L = art.SOUND_FIG;
      for (const note of [0, 3, 7, 9, 10]) {
        let st;
        try { st = ph.noteState(L.spec, note); } catch { continue; }
        const labs = ws.breathLabels(L, side, st);
        for (const [w, h] of [[358, 200], [358, 260], [358, 300], [390, 360], [700, 400]]) {
          const kept = fitLabels(labs, fitXform('side', box, w, h, 6), 1, w);
          assert.equal(kept.length, 4, `${id} note ${note} at ${w}x${h}: kept ${kept.map((l: { id: string }) => l.id).join(',')}`);
        }
      }
    });
  }
});
