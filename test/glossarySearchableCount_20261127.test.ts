/**
 * Owner 2026-11-27: the glossary total counts every searchable term — each card's
 * headword AND its "Also called" names (the merged names are searchable and
 * findable). Live 2026-11-27: 30,534 cards + 4,645 also-called entries =
 * 35,145 different searchable names.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const { countSearchableNames } = await import('../src/features/glossary/searchableNames.ts');
const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

describe('the glossary total counts every searchable name', () => {
  it('counts each headword and each "Also called" name', () => {
    assert.equal(
      countSearchableNames([
        { term: 'GBIC', also_called: ['Gigabit Interface Converter', 'gigabit interface connector'] },
        { term: 'Sub kick', also_called: ['Subkick'] },
        { term: 'Decibel' },
      ]),
      6,
    );
  });

  it('a name that appears twice counts once (never overstates)', () => {
    assert.equal(
      countSearchableNames([
        { term: 'Low-cut filter', also_called: ['High-pass filter', 'HPF'] },
        { term: 'High-pass filter', also_called: [' hpf '] },
      ]),
      3,
    );
  });

  it('blank names and missing lists are ignored', () => {
    assert.equal(countSearchableNames([{ term: 'Gain', also_called: ['', '  '] }, { term: 'Trim', also_called: null }]), 2);
  });

  it('the glossary header and the offline line use it; the device-copy check stays cards-only', () => {
    const src = read('src/screens/glossary/GlossaryScreen.tsx');
    assert.match(src, /const searchableTotal = useMemo\(\(\) => countSearchableNames\(entries\), \[entries\]\);/);
    assert.match(src, /`\$\{searchableTotal\.toLocaleString\(\)\} term\$\{searchableTotal === 1 \? '' : 's'\}`/);
    assert.match(src, /all \$\{Math\.max\(searchableTotal, offlineStats\.terms\)\.toLocaleString\(\)\} terms work with no connection/);
    // revalidateCorpus still compares the stored card count with the cards-only RPC.
    assert.match(src, /async function revalidateCorpus[\s\S]{0,500}supabase\.rpc\('get_glossary_term_count'\)[\s\S]{0,160}data !== haveCount/);
    // The loading screen shows the display total, the same number as the curriculum hero.
    assert.match(src, /supabase\.rpc\('get_academy_stats'\)/);
    assert.match(src, /const n = await readShownTotal\(\);\s*if \(alive && n != null\) setCachedCount\(n\);/);
  });

  it('not static: the copy re-downloads when the shown total moves, at most once per change', () => {
    const src = read('src/screens/glossary/GlossaryScreen.tsx');
    const body = src.slice(src.indexOf('async function revalidateCorpus'), src.indexOf('async function revalidateCorpus') + 1600);
    // an "Also called" change moves academy_stats.terms but not the card count
    assert.match(body, /const namesChanged = shown != null && String\(shown\) !== lastShown;/);
    assert.match(body, /if \(!cardsChanged && !namesChanged\) return;/);
    // the marker is the server total the copy was downloaded FOR, written only after a full save
    assert.match(body, /await saveStoredTerms\(table, fresh\);[\s\S]{0,300}setStoredMeta\(corpusShownKey\(table\), String\(shown\)\)/);
    // a first download records it too, so a new install does not download twice
    assert.match(src, /Promise\.all\(\[fetchCorpusTerms\(table\), readShownTotal\(\)\]\)[\s\S]{0,600}setStoredMeta\(corpusShownKey\(table\), String\(shown\)\)/);
  });
});

describe('update 17: the open Glossary switches to a fresh copy the moment it is saved', () => {
  const src = read('src/screens/glossary/GlossaryScreen.tsx');

  it('the refresh hands the saved copy to the open screen (no wait for the next cold start)', () => {
    const body = src.slice(src.indexOf('async function revalidateCorpus'), src.indexOf('async function revalidateCorpus') + 2000);
    assert.match(body, /setStoredMeta\(corpusShownKey\(table\), String\(shown\)\);\s*\/\/[^\n]*\n\s*await adoptFreshCorpus\(table, fresh\);/);
  });

  it('definitions already fetched carry over by id, and only the same table\'s cache is replaced', () => {
    const fn = src.slice(src.indexOf('async function adoptFreshCorpus'), src.indexOf('async function adoptFreshCorpus') + 1200);
    assert.match(fn, /if \(ENTRIES_TABLE !== table\) return;/);
    assert.match(fn, /e\.definition = was\.definition;\s*e\.plain_english = was\.plain_english;/);
    assert.match(fn, /ENTRIES_CACHE = Promise\.resolve\(fresh\);\s*freshCorpusListeners\.forEach\(\(fn\) => fn\(table, fresh\)\);/);
  });

  it('the screen listens while open, takes the list for its own table, and stops listening when closed', () => {
    assert.match(src, /const onFresh = \(t: 'glossary' \| 'glossary_browse_v', list: Entry\[\]\) => \{\s*if \(t !== table\) return;\s*setEntries\(list\);\s*refreshOfflineStats\(\);\s*\};\s*freshCorpusListeners\.add\(onFresh\);\s*return \(\) => \{\s*freshCorpusListeners\.delete\(onFresh\);/);
  });
});
