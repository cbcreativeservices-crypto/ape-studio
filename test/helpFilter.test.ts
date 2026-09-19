/**
 * The Help manual's keyword filter.
 *
 * ── WHY THIS EXISTS ─────────────────────────────────────────────────────────
 *
 * Owner: "the help search implies we have a smart search and we dont… it just
 * returns that it cant find anything anyway (remove this frustration)."
 *
 * The old implementation lowercased the WHOLE query and asked whether the text
 * `includes()` it, so any natural sentence looked for that literal string and
 * found nothing — in a manual that answers the question being asked. These
 * tests pin the two properties that fix it: a real question finds its answer,
 * and NOTHING the user can type produces an empty screen.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]s$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { filterHelp, HELP_CATEGORIES } = await import('../src/features/help/helpContent.ts');

const count = (cats: { entries: unknown[] }[]) => cats.reduce((n, c) => n + c.entries.length, 0);
const ALL = count(HELP_CATEGORIES);

describe('a whole question finds its answer', () => {
  // The exact failure the owner reported: sentences returned nothing. These
  // are questions the manual DOES answer, phrased the way a person types.
  for (const q of ['how do I log out', 'are the meters calibrated', 'where are my certificates']) {
    it(`"${q}" finds its answer`, () => {
      const hit = filterHelp(q);
      assert.ok(count(hit) > 0, 'a question the manual answers must not come back empty');
      assert.ok(count(hit) < ALL, 'and it must actually narrow');
    });
  }

  it('⚠️ a topic the manual does NOT cover still finds nothing — that is a content gap', () => {
    // "cancel" appears nowhere in the manual. A filter cannot reach an answer
    // nobody wrote, and pretending otherwise would hide the real problem.
    assert.equal(count(filterHelp('how do I cancel my membership')), 0);
  });

  it('punctuation and case do not matter', () => {
    const a = count(filterHelp('Cancel?'));
    const b = count(filterHelp('cancel'));
    assert.equal(a, b);
  });

  it('two meaningful words NARROW rather than widen (AND, not OR)', () => {
    const one = count(filterHelp('certificate'));
    const two = count(filterHelp('certificate membership'));
    assert.ok(two <= one, `${two} should be <= ${one}`);
  });
});

describe('⛔ the filter can never produce an empty screen', () => {
  it('an empty query returns the whole manual', () => {
    assert.equal(count(filterHelp('')), ALL);
    assert.equal(count(filterHelp('   ')), ALL);
  });

  it('a query of ONLY stop words returns the whole manual, not nothing', () => {
    // "how do I" carries no signal. The honest answer to nothing is
    // everything — an empty result here would be the original bug.
    for (const q of ['how do I', 'what is the', 'can you', 'i']) {
      assert.equal(count(filterHelp(q)), ALL, `"${q}" should not narrow`);
    }
  });

  it('single letters are ignored rather than matching everything', () => {
    assert.equal(count(filterHelp('a')), ALL);
  });

  it('a genuinely absent word still returns zero — the screen shows the manual instead', () => {
    // filterHelp is allowed to return nothing for a real miss; HelpScreen is
    // what guarantees the user still sees the manual. Pinned so nobody
    // "fixes" this by making the filter match everything.
    assert.equal(count(filterHelp('zzzzqqq')), 0);
  });
});

describe('a category title still keeps its whole category', () => {
  // Regression from the 2026-09-13 audit: the ToolsHub "?" pre-fill "tool"
  // missed entries whose ratified answers never use the word.
  it('"tool" keeps every entry of the tools category', () => {
    const hit = filterHelp('tool');
    const cat = hit.find((c) => c.title.toLowerCase().includes('tool'));
    if (cat) {
      const full = HELP_CATEGORIES.find((c) => c.key === cat.key)!;
      assert.equal(cat.entries.length, full.entries.length);
    }
  });
});
