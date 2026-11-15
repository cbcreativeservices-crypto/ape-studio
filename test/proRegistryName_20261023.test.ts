/**
 * Owner 2026-10-22/23 (via Comp A's website fact-check): one name for the
 * registry — "Pro Registry" — on every screen and screen-reader label; the
 * formal "Pro Audio Training Academy Professional Registry" stays where it
 * introduces the registry. The Limiter lab popup is the glossary's
 * plain_english, word for word (Comp A, 2026-10-22).
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const SRC = join(import.meta.dirname, '..', 'src');
const read = (p: string) => readFileSync(join(SRC, p), 'utf8').replace(/\r\n/g, '\n');
const files: string[] = [];
const walk = (d: string) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(f)) files.push(p);
  }
};
walk(SRC);
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

describe('one registry name on screen', () => {
  it('no screen text says "Audio Community Directory" or "Academy Registry"', () => {
    const hits = files.filter((f) => /Audio Community Directory|Academy Registry/.test(strip(readFileSync(f, 'utf8'))));
    assert.deepEqual(hits, []);
  });
  it('the short labels say Pro Registry; the formal name is kept where it introduces the registry', () => {
    const profile = read('screens/profile/ProfileScreen.tsx');
    assert.doesNotMatch(profile, /the Professional Registry/);
    assert.match(profile, /List me in the Pro Registry/);
    assert.match(read('screens/directory/MyProfileView.tsx'), /Include me in the Pro Registry/);
    assert.match(read('features/directory/rules.ts'), /'Sign in to use the Pro Registry\.'/);
    assert.match(read('lib/copy.ts'), /Pro Audio Training Academy Professional Registry/);
  });
});

describe('Limiter popup = the lab’s own two sentences', () => {
  it('owner 2026-11-15: "build waves 1 thru 3" (D62 adoption plan, item LIM-01)', () => {
    assert.match(read('features/intro/labTermIntroData.ts'), /"A limiter is a ceiling for loudness\. Peaks that reach the line you set are pulled back down to it\."/);
  });
});
