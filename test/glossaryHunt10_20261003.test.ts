/**
 * GLOSSARY — hunt 10 (2026-10-03). Re-audit of 3ba06aa9 (deviceKey mintNow
 * timedOut → network; GlossaryLockView rootModalHoldMs), then the area.
 *
 * 1. A term the reader had PAID a lookup for lost its full text inside the same
 *    visit. The metered read patches the full definition onto the corpus entry
 *    OBJECT. The 5-minute background release (CACHE_RELEASE_MS) drops the corpus
 *    cache while the Glossary stays mounted under a pushed screen (Σ to the
 *    Calculator Lab, a lab action, the Paywall); refocusing re-loads FRESH
 *    entries with blank definitions, and ensureDefinitions filled every blank
 *    from the device copy / browse view — for anyone who is not a member, the
 *    120-character teaser. The paid term (even one still expanded on screen)
 *    then showed the opening as its whole definition, with no ShortReadNote,
 *    and a re-tap never re-read it: openViaGateway short-circuits on a detail
 *    plus a session-cache hit. The full text was still in the session cache
 *    (readDefinitionOnce / READ_OK, per uid and standing); ensureDefinitions
 *    now refills a blank from it before it reaches for the disk or the network.
 *
 * Receipts: the two fix tests below FAILED on HEAD d5ade47c (R2); the first
 * test only pins the precondition (the release + blank reload) and passes there.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const SCREEN = readFileSync(new URL('../src/screens/glossary/GlossaryScreen.tsx', import.meta.url), 'utf8');

/** ensureDefinitions' body, comments stripped. */
function ensureDefinitionsBody(): string {
  const start = SCREEN.indexOf('const ensureDefinitions = useCallback(');
  assert.ok(start >= 0, 'ensureDefinitions not found');
  const end = SCREEN.indexOf('ensureDefsRef.current = ensureDefinitions;', start);
  assert.ok(end > start, 'ensureDefinitions end not found');
  return SCREEN.slice(start, end)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

describe('glossary: a paid term keeps its full text after the corpus reloads under a mounted screen', () => {
  it('the precondition holds: the background release drops the corpus cache, and a reload re-creates blank entries', () => {
    assert.match(SCREEN, /releaseTimer = setTimeout\(\(\) => \{[\s\S]*?ENTRIES_CACHE = null;/);
    assert.match(SCREEN, /definition: '',\s+plain_english: null,/);
  });

  it('ensureDefinitions refills a blank from the session cache, for this tier, before deciding what to fetch', () => {
    const body = ensureDefinitionsBody();
    const fromSession = body.search(/sessionDefinition\(id, tier === 'member'\)/);
    const want = body.indexOf('const want = ids.filter(');
    assert.ok(fromSession >= 0, 'ensureDefinitions never consults the session cache of paid reads');
    assert.ok(want > fromSession, 'the session refill must run before the disk/network want list is built');
  });

  it('only a BLANK is refilled (never over text already on the entry), and the rows repaint', () => {
    const body = ensureDefinitionsBody();
    assert.match(body, /e && e\.definition === '' \? sessionDefinition\(id, tier === 'member'\) : null/);
    assert.match(body, /e\.definition = paid\.definition;/);
    assert.match(body, /if \(refilled\) setDefRev\(\(n\) => n \+ 1\);/);
  });
});
