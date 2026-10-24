/**
 * Research and learn more (owner 2026-10-24, build 39): a quiet button on the
 * glossary term page and the flashcard back opens Wikipedia / Google in the
 * phone's own browser. A stored article URL is used only when it is an English
 * Wikipedia article; the flashcard read of it can never fail the deck.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { googleImagesUrlFor, googleUrlFor, safeWikipediaUrl, wikipediaUrlFor } from '../src/features/research/researchUrls.ts';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

test('only an English Wikipedia article URL is ever used as stored', () => {
  assert.equal(safeWikipediaUrl('https://en.wikipedia.org/wiki/Phantom_power'), 'https://en.wikipedia.org/wiki/Phantom_power');
  assert.equal(safeWikipediaUrl('https://en.wikipedia.org/wiki/Microphone#Polar_patterns'), 'https://en.wikipedia.org/wiki/Microphone#Polar_patterns');
  for (const bad of [
    'https://en.m.wikipedia.org/wiki/X',
    'http://en.wikipedia.org/wiki/X',
    'https://de.wikipedia.org/wiki/X',
    'https://evil.example/wiki/X',
    'https://en.wikipedia.org/wiki/X?action=edit',
    'javascript:alert(1)',
    '',
    null,
    42,
  ]) {
    assert.equal(safeWikipediaUrl(bad), null, String(bad));
  }
});

test('Wikipedia: stored article first, else a search for the bare term; Google adds "audio"', () => {
  assert.equal(wikipediaUrlFor('Phantom power', 'https://en.wikipedia.org/wiki/Phantom_power'), 'https://en.wikipedia.org/wiki/Phantom_power');
  assert.equal(wikipediaUrlFor('AED', null), 'https://en.wikipedia.org/w/index.php?search=AED');
  assert.equal(wikipediaUrlFor('Gain & headroom', 'https://bad.example/x'), 'https://en.wikipedia.org/w/index.php?search=Gain%20%26%20headroom');
  assert.equal(googleUrlFor(' Phantom power '), 'https://www.google.com/search?q=Phantom%20power%20audio');
});

test('View images: Google Images with SafeSearch ON, opened directly', () => {
  assert.equal(
    googleImagesUrlFor('XLR connector'),
    'https://www.google.com/search?tbm=isch&safe=active&q=XLR%20connector%20audio',
  );
  const link = read('src/features/research/ResearchMoreLink.tsx');
  assert.match(link, />Research and learn more ↗<\/Text>/);
  assert.match(link, />View images ↗<\/Text>/);
  assert.match(link, /onPress=\{\(\) => openViewImages\(name\)\}/);
  assert.match(read('src/features/research/researchLinks.ts'), /export function openViewImages\(term: string\): void \{\s*const name = term\.trim\(\);\s*if \(name\) open\(googleImagesUrlFor\(name\), 'google\.com'\);/);
});

test('the popup is the owner-approved wording, opened in the system browser', () => {
  const s = read('src/features/research/researchLinks.ts');
  assert.match(s, /'Research and learn more',/);
  assert.match(s, /Keep exploring “\$\{name\}” — see pictures, history and other explanations\. These open in your browser, outside the Academy\./);
  assert.match(s, /'Wikipedia',/);
  assert.match(s, /alt: \{ text: 'Google'/);
  assert.match(s, /cancelText: 'Not now'/);
  assert.match(s, /Linking\.openURL\(url\)/);
  assert.doesNotMatch(s, /expo-web-browser|openBrowserAsync/);
});

test('glossary term page and flashcard back carry it', () => {
  assert.match(read('src/screens/glossary/GlossaryScreen.tsx'), /<ResearchMoreLink term=\{term \?\? ''\} wikipediaUrl=/);
  const f = read('src/screens/study/FlashcardsScreen.tsx');
  assert.match(f, /\{soloReveal \|\| level !== 0 \? \(\s*<ResearchMoreLink\s+term=\{card\.term\}\s+wikipediaUrl=\{card\.wikipedia_url\}\s+style=\{styles\.cardResearch\}\s+textStyle=\{styles\.cardReportText\}/);
});

test('the flashcard link read is separate and non-fatal (never in the study SELECT)', () => {
  const s = read('src/features/study/api.ts');
  const selects = [...s.matchAll(/\.select\(\s*'glossary_id, term, definition[^']*'/g)].map((m) => m[0]);
  assert.ok(selects.length >= 2);
  for (const sel of selects) assert.doesNotMatch(sel, /wikipedia_url/);
  assert.match(s, /select\('glossary_id, wikipedia_url'\)/);
  assert.match(s, /if \(\/wikipedia_url\/\.test\(error\.message \?\? ''\)\) wikipediaColumnAbsent = true;\s*return items;/);
});

test('the shared dialog has an optional second choice, through the same answer guard', () => {
  const d = read('src/components/AppDialog.tsx');
  assert.match(d, /function resolve\(which: 'confirm' \| 'cancel' \| 'alt'\): void \{\s*\/\/[^\n]*\n[^\n]*\n\s*if \(current && Date\.now\(\) - shownAt < ANSWER_GUARD_MS\) return;/);
  assert.match(d, /\{!isNotice && req\.altText \? \(/);
  const c = read('src/lib/confirm.ts');
  assert.match(c, /altText: opts\?\.alt\?\.text,\s*onAlt: opts\?\.alt\?\.onPress,/);
});
