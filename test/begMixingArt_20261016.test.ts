/**
 * Beginning Mixing art fix (lab-art grading 2026-10-16: "16 modules teach
 * balance, frequency, pan, depth and movement almost entirely in words").
 *
 *  1. Every one of the sixteen pages draws: each Page* component renders a
 *     drawing from begArt.tsx (or the shared advPlots lanes / EQ plot).
 *  2. The compression drawing's snare is the SESSION's snare, sample for
 *     sample (snareStemForDrawing re-synthesises it off the same seed).
 *  3. The drawings follow the page controls: the A/B rows that change the
 *     picture pass onPick.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { sessionStems, snareStemForDrawing } from '../src/screens/lab/mixing/audio/mixAudio.ts';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'screens', 'lab', 'mixing');
const src = (f: string) => readFileSync(join(dir, f), 'utf8');

/** The body of each `function Page…(` up to the next top-level function. */
function pageBodies(file: string): Record<string, string> {
  const s = src(file);
  const out: Record<string, string> = {};
  const re = /^function (Page\w+)\(/gm;
  const hits = [...s.matchAll(re)];
  hits.forEach((m, i) => {
    const start = m.index!;
    const end = i + 1 < hits.length ? hits[i + 1].index! : s.length;
    out[m[1]] = s.slice(start, end);
  });
  return out;
}

describe('Beginning Mixing — every page draws', () => {
  const ART = /<(MixMapArt|PrepArt|FlowArt|HeadroomArt|CompArt|SpaceArt|TermsArt|PrePostArt|BounceArt|AutomationLanes|EqPlot)\b/;
  const pages = { ...pageBodies('pagesA.tsx'), ...pageBodies('pagesB.tsx'), ...pageBodies('pagesC.tsx'), ...pageBodies('pagesD.tsx') };
  it('finds all sixteen pages', () => {
    assert.equal(Object.keys(pages).length, 16, Object.keys(pages).join(', '));
  });
  for (const [name, body] of Object.entries(pages)) {
    it(`${name} renders a drawing`, () => {
      assert.match(body, ART, `${name} is text-only again`);
    });
  }
  it('the pictures that depend on an A/B pick are told the pick', () => {
    const pb = { ...pageBodies('pagesB.tsx'), ...pageBodies('pagesC.tsx'), ...pageBodies('pagesD.tsx') };
    for (const n of ['PagePanning', 'PageEqContext', 'PageCompression', 'PageReverbDelay', 'PageCheckFinish', 'PageFinal']) {
      assert.match(pb[n], /onPick=/, `${n}: the drawing must follow the pressed variant`);
    }
  });
});

describe('Beginning Mixing — the compression drawing draws the real snare', () => {
  it('snareStemForDrawing (cold) equals the session snare sample for sample', () => {
    const drawn = snareStemForDrawing(); // before the cache exists: re-synthesised
    const played = sessionStems().snare;
    assert.equal(drawn.length, played.length);
    let maxDiff = 0;
    for (let i = 0; i < drawn.length; i++) maxDiff = Math.max(maxDiff, Math.abs(drawn[i] - played[i]));
    assert.equal(maxDiff, 0);
  });
});
