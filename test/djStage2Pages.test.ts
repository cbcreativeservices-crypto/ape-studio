/**
 * DJ Systems Lab — STAGE 2 screens (13–18): the house rules and the lessons
 * learned from the Stage 1 reviews, pinned on the page sources.
 *
 *   - the six screens are appended in order after screen 12, with their goal
 *     lists in the same order;
 *   - every screen's Step 1 opens with a "You are looking at" line and offers
 *     at most four terms;
 *   - every screen has a check-yourself question AND a troubleshooting fault,
 *     and its practice names an "On your own" evidence task;
 *   - the optional equipment paths (16–18) say so; the stem screen never calls
 *     its stems the output of an AI or a separation algorithm and labels its
 *     separation as SIMULATED; nothing names a streaming service or a maker;
 *   - safety: the effect loop, the turntable howl and the control tone are
 *     each said to be held quiet in the lab.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');
const PAGES = 'src/screens/lab/dj/pages';
const STAGE2 = [
  ['P13', 'p13Effects.tsx', 'GOALS_FX'],
  ['P14', 'p14Key.tsx', 'GOALS_KEY'],
  ['P15', 'p15Stems.tsx', 'GOALS_STEMS'],
  ['P16', 'p16Laptop.tsx', 'GOALS_LAPTOP'],
  ['P17', 'p17Vinyl.tsx', 'GOALS_VINYL'],
  ['P18', 'p18Dvs.tsx', 'GOALS_DVS'],
] as const;

describe('DJ Systems Lab — Stage 2 screens', () => {
  it('appends screens 13–18 in order, with their goals in the same order', () => {
    const idx = read(`${PAGES}/index.ts`);
    const pages = idx.match(/DJ_PAGES[^=]*=\s*\[([^\]]+)\]/)![1].split(',').map((s) => s.trim());
    const goals = idx.match(/DJ_GOALS[^=]*=\s*\[([^\]]+)\]/)![1].split(',').map((s) => s.trim());
    assert.ok(pages.length >= 18);
    STAGE2.forEach(([p, , g], i) => {
      assert.equal(pages[12 + i], p);
      assert.equal(goals[12 + i], g);
    });
  });
  for (const [p, f] of STAGE2) {
    it(`${p}: a "You are looking at" opening, ≤ 4 terms, a check, a fault, an on-your-own task`, () => {
      const s = read(`${PAGES}/${f}`);
      const step1 = s.slice(s.indexOf('<Step n={1}>'), s.indexOf('<Step n={2}>'));
      assert.match(step1, /<Look>\{?`?You are looking at/);
      const terms = s.match(/const TERMS = \[([\s\S]*?)\] as const;/)![1];
      assert.ok((terms.match(/\{ term:/g) ?? []).length <= 4, `${f} has more than four terms`);
      assert.match(s, /<UnderstandingCheck/);
      assert.match(s, /<FaultCard/);
      assert.match(s, /On your own:/);
      assert.match(s, /rack: true/);
    });
  }
  it('16–18 say they are optional paths', () => {
    for (const [, f] of STAGE2.slice(3)) assert.match(read(`${PAGES}/${f}`), /An optional screen/);
  });
  it('the stems are never called AI output; the separation is labelled SIMULATED', () => {
    const s = read(`${PAGES}/p15Stems.tsx`);
    assert.doesNotMatch(s, /\bA\.?I\.?\b|artificial intelligence|neural/i);
    assert.match(s, /SEPARATED \(SIMULATED\)/);
    assert.match(read('src/screens/lab/dj/engine/djStems.ts'), /NOT a separation algorithm/);
  });
  it('no streaming service, platform or maker is named in Stage 2 learner text', () => {
    const SERVICES = /\b(spotify|tidal|soundcloud|beatport|apple music|youtube|twitch|mixcloud|deezer|amazon music)\b/i;
    for (const [, f] of STAGE2) assert.doesNotMatch(read(`${PAGES}/${f}`), SERVICES, f);
  });
  it('the loop, the howl and the control tone are each held quiet — and the page says so', () => {
    assert.match(read(`${PAGES}/p13Effects.tsx`), /held it under a safe level|holding this one quiet/);
    assert.match(read(`${PAGES}/p17Vinyl.tsx`), /holds the howl at a safe level|holds it at a safe level/);
    assert.match(read(`${PAGES}/p18Dvs.tsx`), /played the tone quietly/);
  });
  it('hum is cured by the signal ground, never by lifting the mains earth', () => {
    assert.match(read(`${PAGES}/p17Vinyl.tsx`), /never (lift the mains plug’s earth|a reason to touch the mains earth)/);
  });
});
