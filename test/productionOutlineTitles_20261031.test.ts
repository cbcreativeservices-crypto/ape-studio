/**
 * Production labs — one name per stage (2026-10-31). The home list and the
 * PICK UP WHERE YOU LEFT OFF row read the OUTLINE title; the stage header,
 * NEXT OUTSTANDING, WHAT'S LEFT and the packet read the STAGE DATA title.
 * Pre-Production stages 3 and 4 once carried two names; this pins them equal.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { LABS } from './_productionScreenGuides.ts';

describe('Production outline titles match the authored stage titles', () => {
  for (const lab of ['preprod', 'postprod'] as const) {
    it(`${lab}: every outline title equals the stage data title`, () => {
      const { outline, stages } = LABS[lab];
      assert.ok(outline.length > 0);
      for (const o of outline as { stageId: string; num: number; title: string }[]) {
        const s = (stages as { stageId: string; title: string }[]).find((x) => x.stageId === o.stageId);
        assert.ok(s, `${lab} stage ${o.stageId} is authored`);
        assert.equal(o.title, s!.title, `${lab} stage ${o.num}`);
      }
    });
  }
});
