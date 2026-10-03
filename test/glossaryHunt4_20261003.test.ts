/**
 * GLOSSARY — toddler hunt 4 (2026-10-03, single pass).
 *
 * 1. A MEMBER WITH NO SIGNAL COULD NOT SHARE A TERM ON SCREEN. Final round B
 *    (8eec742b) made buildShareTerm read EVERY shared definition through the
 *    gateway (readDefinitionOnce), so a free reader's 120-character teaser is
 *    never shared as the definition. But a member's row is never a teaser:
 *    the browse view and the saved-offline copy (owner 2026-09-22, the cruise
 *    case: "work offline after being loaded") hand a member the whole text.
 *    With no signal the gateway read can only fail, so SHARE on a term the
 *    member was reading from their saved glossary answered "couldn't be
 *    loaded … check your connection" and shared nothing. The member's row
 *    text is now used as-is; a blank row, and every non-member, still read
 *    through the session cache (one lookup per share, owner 2026-10-03).
 *
 * R2: the source test FAILED against the pre-fix GlossaryScreen.tsx (copied
 * aside, the old file restored, run, the fixed file put back).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const between = (s: string, a: string, b: string) => {
  const i = s.indexOf(a);
  assert.ok(i >= 0, `missing: ${a}`);
  const j = s.indexOf(b, i + a.length);
  assert.ok(j > i, `missing after ${a}: ${b}`);
  return s.slice(i, j);
};

describe('1 · Glossary share: a member shares the full text already on their row', () => {
  const src = strip(read('src/screens/glossary/GlossaryScreen.tsx'));
  const b = between(src, 'const buildShareTerm = useCallback(', 'const resolveShareTerms');

  it("a member's non-blank row is the definition — no gateway read, so no signal is needed", () => {
    assert.match(
      b,
      /let definition: string \| null =\s*defTierRef\.current === 'member' && e\.definition\.trim\(\) \? e\.definition : null;/,
    );
    // The gateway read happens only when that left nothing.
    const guard = b.indexOf('if (definition == null) {');
    assert.ok(guard > 0, 'the gateway read is not behind the member-row check');
    assert.ok(guard < b.indexOf('await readDefinitionOnce(id, isMemberRef.current)'));
  });

  it('everyone else still reads the full text once, and an unreadable one is still said', () => {
    assert.equal((b.match(/readDefinitionOnce\(/g) ?? []).length, 1);
    assert.match(b, /if \(definition == null\) throw shareDefinitionUnreadable\(/);
    assert.doesNotMatch(b, /definition: e\.definition/);
  });

  it('defTierRef is declared before buildShareTerm (the closure reads the live tier)', () => {
    assert.ok(src.indexOf('const defTierRef = useRef(defTier);') < src.indexOf('const buildShareTerm = useCallback('));
  });
});
