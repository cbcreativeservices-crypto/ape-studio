/**
 * Mixing Guides — expert review 2026-10-07 (docs/labs/reviews/
 * REVIEW_2026_10_07_mixing.md). Pins what the review corrected so a
 * regeneration from the owner's guides cannot bring it back:
 *
 *   • PHYSICS: delay times match their tempo; the hearing-safety time at
 *     97 dBA follows the 3 dB exchange rate; the 140 dB peak is C-weighted.
 *   • OWNER RULE (no brands, engineers, publications in learner text): the
 *     names the first passes missed stay out; the gospel artist Fred Hammond
 *     keeps his name in the references.
 *   • CONVERSION LEFTOVERS: no stray initial, no doubled "graphical".
 *   • SEARCH: "rnb" and "dnb" find their styles.
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const GUIDE_DIR = 'src/screens/lab/mixingGuides/data/guides';
const FILES = readdirSync(join(process.cwd(), GUIDE_DIR)).filter((f) => f.endsWith('.ts')).sort();
type Guide = { id: string; references: string[]; [k: string]: unknown };
const GUIDES: Guide[] = [];
for (const f of FILES) GUIDES.push(((await import(`../${GUIDE_DIR}/${f}`)) as { GUIDE: Guide }).GUIDE);
const byId = (id: string) => {
  const g = GUIDES.find((x) => x.id === id);
  assert.ok(g, id);
  return g;
};
/** All learner text of a guide (references excluded) as one string. */
const learner = (g: Guide) => JSON.stringify({ ...g, references: [] });

describe('review 2026-10-07 — physics corrections', () => {
  it('delay times agree with the stated tempo (60000 / BPM per quarter note)', () => {
    const q = (bpm: number) => 60000 / bpm;
    // Amapiano 108–115 BPM: quarter 522–556 ms, dotted eighth 391–417 ms.
    assert.match(learner(byId('amapiano')), /about 520–555 ms for 1\/4, 390–415 ms for dotted 1\/8/);
    assert.ok(Math.round(q(115)) >= 520 && Math.round(q(108)) <= 556);
    // Reggae at a 75 BPM pulse: dotted eighth 600 ms, quarter 800 ms.
    assert.equal(q(75) * 0.75, 600);
    assert.equal(q(75), 800);
    assert.match(learner(byId('reggae')), /600 ms dotted-eighth and 800 ms quarter/);
    assert.doesNotMatch(learner(byId('reggae')), /350–700 ms/);
    // Brazilian funk: the quoted times are eighth notes.
    assert.equal(Math.round(q(130) / 2), 231);
    assert.match(learner(byId('brazilian-funk')), /1\/8 ≈ 230 ms at 130 BPM, 200 ms at 150/);
  });
  it('safe exposure follows 85 dBA / 8 h with a 3 dB exchange: 97 dBA ≈ 30 min', () => {
    const minutes = (dba: number) => 480 / 2 ** ((dba - 85) / 3);
    assert.equal(minutes(97), 30);
    assert.equal(minutes(94), 60);
    assert.equal(minutes(100), 15);
    assert.match(learner(byId('mpb-bossa-nova')), /about 30 minutes at 97 dBA/);
    assert.doesNotMatch(learner(byId('mpb-bossa-nova')), /1 hour at 97 dBA/);
  });
  it('the 140 dB peak limit is C-weighted peak, not LAmax', () => {
    for (const g of GUIDES) assert.doesNotMatch(learner(g), /140 dB LAmax/, g.id);
    assert.match(learner(byId('hip-hop-rap')), /140 dB LCpeak/);
  });
});

describe('review 2026-10-07 — owner rule: no brands, engineers, publications', () => {
  const MISSED = /Maserati|\b160-style|\b3A-style|\b480-style|Live Design|\bSOS\b|Decca|Dimension-style|Hamilton’s album|Jin’s|Drake’s|Firkins|study average|research measured|loudness-matched test/;
  it('none of the names the first passes missed is back in learner text', () => {
    for (const g of GUIDES) {
      const m = learner(g).match(MISSED);
      assert.equal(m, null, `${g.id}: ${m?.[0]}`);
    }
  });
  it('the gospel artist Fred Hammond keeps his name (the organ rewrite skips him)', () => {
    const refs = byId('gospel').references.join(' | ');
    assert.match(refs, /Fred Hammond & Radical for Christ/);
    assert.doesNotMatch(refs, /Fred tonewheel/);
  });
  it('owner 2026-10-07: "Hammond" is allowed and survives the conversion (never "tonewheel organ")', async () => {
    const all = GUIDES.map(learner).join(' ');
    assert.doesNotMatch(all, /tonewheel/i);
    for (const id of ['rock', 'soul', 'blues', 'hard-rock', 'jazz', 'funk', 'reggae']) assert.match(learner(byId(id)), /\bHammond\b/, id);
    assert.doesNotMatch(all, /\bB-?3\b|Leslie/);
    const { readFileSync } = await import('node:fs');
    const edits = readFileSync('scripts/mixing-guides/edits.py', 'utf8');
    const flags = readFileSync('scripts/mixing-guides/flags.py', 'utf8');
    assert.doesNotMatch(edits, /"tonewheel organ"/);
    assert.doesNotMatch(flags, /Hammond/);
    const rules = readFileSync('test/_mikingItemRules.ts', 'utf8').match(/RESEARCH_NAMES = (.*);/)![1];
    assert.doesNotMatch(rules, /Hammond/);
    assert.doesNotMatch(readFileSync('test/mikingLearnerText.test.ts', 'utf8'), /'Hammond/);
  });
});

describe('review 2026-10-07 — conversion leftovers', () => {
  it('no stray initial left by a removed name, no doubled "graphical"', () => {
    for (const g of GUIDES) {
      assert.doesNotMatch(learner(g), /[;,] [A-Z]\. [A-Z]/, g.id);
      assert.doesNotMatch(learner(g), /graphical correction \(graphical/, g.id);
    }
  });
  it('Afrobeats points to the Amapiano guide, not a "report"', () => {
    assert.match(learner(byId('afrobeats')), /its own guide \(Amapiano\)/);
  });
  it('the compression column reads "Use it", not "Use?:"', async () => {
    const { TABLE_COLUMNS } = (await import('../src/screens/lab/mixingGuides/data/types.ts')) as unknown as { TABLE_COLUMNS: Record<string, { key: string; label: string }[]> };
    assert.equal(TABLE_COLUMNS.compression.find((c) => c.key === 'use')?.label, 'Use it');
  });
});

describe('review 2026-10-07 — search short forms', () => {
  it('"rnb" finds Contemporary R&B and "dnb" finds Drum & Bass', async () => {
    const { filterGuides } = (await import('../src/screens/lab/mixingGuides/guideSearch.ts')) as {
      filterGuides: <T extends { title: string; line: string; origin: string }>(e: readonly T[], q: string) => T[];
    };
    const { MIXING_GUIDE_INDEX } = (await import('../src/screens/lab/mixingGuides/data/index.ts')) as { MIXING_GUIDE_INDEX: { title: string; line: string; origin: string }[] };
    assert.deepEqual(filterGuides(MIXING_GUIDE_INDEX, 'rnb').map((g) => g.title), ['Contemporary R&B']);
    assert.deepEqual(filterGuides(MIXING_GUIDE_INDEX, 'dnb').map((g) => g.title), ['Drum & Bass']);
    assert.ok(filterGuides(MIXING_GUIDE_INDEX, 'hip hop').some((g) => g.title === 'Hip-Hop / Rap'));
  });
});
