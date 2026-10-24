/**
 * Both phones identical (owner hard rule): Android does NOT synthesize an
 * italic for a custom font — fontStyle:'italic' on Barlow drew UPRIGHT there
 * while iOS slanted it. Italic Barlow text must use the true italic faces
 * (fonts.barlowItalic / barlowMediumItalic / barlowSemiBoldItalic), which are
 * preloaded with the other fonts. RATCHET over src/: no style object may pair
 * a Barlow family with fontStyle:'italic'.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../src/', import.meta.url));
const files: string[] = [];
const walk = (d: string) => {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(tsx?|ts)$/.test(n)) files.push(p);
  }
};
walk(root);

/** The style object around position i (innermost braces). */
function enclosing(s: string, i: number): string {
  let a = i;
  let depth = 0;
  for (; a > 0; a--) {
    if (s[a] === '}') depth++;
    else if (s[a] === '{') {
      if (depth === 0) break;
      depth--;
    }
  }
  let b = i;
  depth = 0;
  for (; b < s.length; b++) {
    if (s[b] === '{') depth++;
    else if (s[b] === '}') {
      if (depth === 0) break;
      depth--;
    }
  }
  return s.slice(a, b + 1);
}

test('no Barlow style relies on a synthetic italic', () => {
  const bad: string[] = [];
  for (const f of files) {
    const s = readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
    for (const m of s.matchAll(/fontStyle:\s*'italic'/g)) {
      const obj = enclosing(s, m.index!);
      if (/fontFamily:\s*fonts\.barlow(Regular|Medium|SemiBold)\b/.test(obj)) bad.push(`${f.slice(root.length)}: ${obj.slice(0, 80)}`);
    }
  }
  assert.deepEqual(bad, []);
});

test('the true italic faces are preloaded', () => {
  const t = readFileSync(new URL('../src/theme/tokens.ts', import.meta.url), 'utf8');
  for (const face of ['Barlow_400Regular_Italic', 'Barlow_500Medium_Italic', 'Barlow_600SemiBold_Italic']) {
    assert.match(t, new RegExp(`${face}: require\\('@expo-google-fonts/barlow/`));
  }
});
