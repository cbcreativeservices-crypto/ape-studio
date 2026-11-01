/**
 * Screen Guide rollout — Mixing Guides (owner 2026-10-31) — receipts.
 * Pattern: test/screenGuide_patchbay_20261031.test.ts.
 *
 *   1. both screens the learner reaches (the hub and the reader — one
 *      template for every style) have a complete guide inside its no-scroll
 *      budget, in the house copy rules (Mixing: starting points, not rules);
 *   2. each guide quotes the screen's REAL names (guide AND source);
 *   3. the search results TRY THIS quotes are what filterGuides returns;
 *   4. wiring: the hub and the reader hand their guide to LabHeader and host
 *      the overlay (no ⓘ on the what's-left screen); the hand-edited guide
 *      data and the owner's world map are only read, never touched;
 *   5. the accuracy chip: the reader KEEPS it (live SPL and loudness figures);
 *      the hub has none (no measurement shown).
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const MG = 'src/screens/lab/mixingGuides';
const { MIXING_GUIDES_HUB_GUIDE, MIXING_GUIDE_READER_GUIDE } = await import(`../${MG}/mixingGuidesScreenGuides.ts`);
const { SCREEN_GUIDE_SECTIONS, SCREEN_GUIDE_BUDGET } = await import('../src/features/lab/screenGuide/types.ts');
const { filterGuides } = await import(`../${MG}/guideSearch.ts`);
const { MIXING_GUIDE_INDEX } = await import(`../${MG}/data/index.ts`);

type Guide = Record<string, string[]>;
const GUIDES: Record<string, Guide> = { hub: MIXING_GUIDES_HUB_GUIDE, reader: MIXING_GUIDE_READER_GUIDE };
const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s: { key: string }) => s.key);
const textOf = (gd: Guide) => SECTION_KEYS.map((k) => gd[k].join('\n')).join('\n');

describe('1. both screens have a complete guide', () => {
  for (const [id, gd] of Object.entries(GUIDES)) {
    it(`${id}: all five sections, 1–5 bullets each, 2–3 TRY THIS`, () => {
      assert.deepEqual(Object.keys(gd).sort(), [...SECTION_KEYS].sort());
      for (const k of SECTION_KEYS) {
        assert.ok(Array.isArray(gd[k]) && gd[k].length >= 1, `${id}.${k} is empty`);
        assert.ok(gd[k].length <= 5, `${id}.${k} has ${gd[k].length} bullets (max 5)`);
        for (const line of gd[k]) assert.ok(typeof line === 'string' && line.trim().length > 10, `${id}.${k}: a blank bullet`);
      }
      assert.ok(gd.tryThis.length >= 2 && gd.tryThis.length <= 3, `${id}: TRY THIS is 2–3 experiments`);
    });
  }
  it('every step fits its no-scroll budget (375 × 812)', () => {
    const over: string[] = [];
    for (const [id, gd] of Object.entries(GUIDES)) {
      for (const s of SCREEN_GUIDE_SECTIONS as readonly { key: string; place: string }[]) {
        if (s.place === 'strip') {
          for (const item of gd.tryThis) if (item.length > SCREEN_GUIDE_BUDGET.tryItem) over.push(`${id}.tryThis (${item.length})`);
          continue;
        }
        const n = gd[s.key].join(' ').length;
        const cap = s.place === 'high' ? SCREEN_GUIDE_BUDGET.high : SCREEN_GUIDE_BUDGET.low;
        if (n > cap) over.push(`${id}.${s.key}: ${n} > ${cap}`);
      }
    }
    assert.deepEqual(over, []);
  });
  it('house copy rules, and Mixing copy says starting points, not rules', () => {
    for (const [id, gd] of Object.entries(GUIDES)) {
      const t = textOf(gd);
      assert.doesNotMatch(t, /\byou(’|')?ll (master|build|mix|be able)|\bmastery\b|\byou mastered\b|\byou will learn to\b/i, `${id}: claims a skill`);
      assert.doesNotMatch(t, /\b\d+\s+of\s+\d+\b|\b\d+\s*\/\s*\d+\b/i, `${id}: an "N of total"`);
      assert.doesNotMatch(t, /\brecommend/i, `${id}: "recommend"`);
      assert.doesNotMatch(t, /\b(TODO|FIXME|placeholder|owner 20\d\d|hunt 20\d\d|edits\.py|convert\.py)\b/i, `${id}: a build note`);
      assert.match(t, /starting points?, not (a )?rules?/i, `${id}: no “starting points, not rules”`);
    }
  });
  it('the reader guide names the template, never one style', () => {
    const t = textOf(GUIDES.reader);
    for (const g of MIXING_GUIDE_INDEX as { title: string }[]) assert.ok(!t.includes(g.title + ' '), `reader names the style “${g.title}”`);
  });
});

describe('2. each guide quotes its screen’s real names', () => {
  const HUB_SRC = [`${MG}/MixingGuidesHubScreen.tsx`, `${MG}/GuideWorldMap.tsx`, `${MG}/data/types.ts`, 'src/features/lab/ProNote.tsx'].map(code).join('\n');
  const READER_SRC = [`${MG}/MixingGuideScreen.tsx`, `${MG}/data/types.ts`, 'src/screens/lab/kit/labNav.ts', 'src/screens/lab/kit/LabNavBar.tsx'].map(code).join('\n');
  const NAMES: Record<string, [string, string[]]> = {
    hub: [HUB_SRC, ['MIXING GUIDES', '✓ READ', 'Hide map', 'Show map ›', 'Find a style — salsa, metal, k-pop…', '✕', 'When to bring in a pro ›', 'Starting points, not rules']],
    reader: [READER_SRC, ['WHAT THE AUDIENCE EXPECTS', 'MIX PRIORITY #1', 'AT A GLANCE', 'Origin / region', 'Typical tempo', 'Typical ensemble size', 'Live SPL (FOH, average)', 'Studio / streaming loudness', 'THE GUIDE', 'Purpose & audience expectations', 'Reference recordings', 'OPEN ALL ▾', 'CLOSE ALL ▴', 'MARK AS READ', '✓ READ', 'EQ starting points', 'Compression & dynamics processing', 'Effects & amounts', 'Live vs studio', 'Cut', 'Boost', 'Notes', '‹ PREV', 'NEXT ›', 'FINISH ›']],
  };
  for (const [id, [src, names]] of Object.entries(NAMES)) {
    it(`${id}: every pinned name is on the screen AND in the guide`, () => {
      const gt = textOf(GUIDES[id]);
      for (const n of names) {
        assert.ok(src.includes(n), `${id}: "${n}" is no longer in the source — update the guide`);
        assert.ok(gt.includes(n), `${id}: the guide never names "${n}"`);
      }
    });
  }
  it('the reader’s WHO note and the starting-points line are the template’s own', () => {
    const types = code(`${MG}/data/types.ts`);
    assert.match(types, /WHO recommends audiences be exposed to no more than 100 dB LAeq over 15 minutes/);
    assert.match(types, /'Starting points, not rules\. Put on a reference track in the style, match its level/);
  });
});

describe('3. the search results TRY THIS quotes are what filterGuides returns', () => {
  const titles = (q: string) => filterGuides(MIXING_GUIDE_INDEX, q).map((g: { title: string }) => g.title);
  it('“brazil” → exactly the four styles the guide names, in index order', () => {
    const hits = titles('brazil');
    assert.deepEqual(hits, ['Latin Pop', 'Sertanejo', 'Brazilian Funk (Baile Funk)', 'MPB / Bossa Nova']);
    assert.ok(GUIDES.hub.tryThis[0].includes('four styles stay — Latin Pop, Sertanejo, Brazilian Funk (Baile Funk) and MPB / Bossa Nova'));
  });
  it('“hip hop” → four cards, Hip-Hop / Rap first (the guide says so)', () => {
    const hits = titles('hip hop');
    assert.equal(hits.length, 4);
    assert.equal(hits[0], 'Hip-Hop / Rap');
    assert.ok(GUIDES.hub.tryThis[1].includes('four cards stay, Hip-Hop / Rap first'));
  });
  it('the hub guide never says sliding across the cards moves the highlight (owner 2026-10-08: only the card pressed is lit)', () => {
    const hub = Object.values(GUIDES.hub).flat().join(' ');
    assert.doesNotMatch(hub, /swipe across the cards|slide a finger/);
    const hubCode = code(`${MG}/MixingGuidesHubScreen.tsx`);
    // The map is set on touch-DOWN only; no move handler follows the finger.
    assert.match(hubCode, /onTouchStart=\{onFinger\}/);
    assert.match(hubCode, /onScrollEndDrag=\{onFingerUp\}/);
    assert.doesNotMatch(hubCode, /onTouchMove|onResponderMove/);
  });
  it('an unmatched search says so and suggests a shorter word', () => {
    assert.match(code(`${MG}/MixingGuidesHubScreen.tsx`), /No style matches “\{deferredQuery\}”\. Try a shorter word/);
  });
  it('opened sections are kept across styles (the reader’s TRY THIS), and NEXT › marks the guide left as read', () => {
    const r = code(`${MG}/MixingGuideScreen.tsx`);
    assert.match(r, /const \[open, setOpen\] = useState<ReadonlySet<GuideSectionKey>>\(\(\) => new Set<GuideSectionKey>\(\['purpose'\]\)\);/);
    assert.match(r, /beforeAdvance: \(from\) => \{\n\s*void markGuideRead\(MIXING_GUIDE_INDEX\[from\]\.id\);/);
    assert.match(code(`${MG}/data/types.ts`), /eq: \[\n\s*\{ key: 'source', label: 'Source' \},\n\s*\{ key: 'cut', label: 'Cut' \},\n\s*\{ key: 'boost', label: 'Boost' \},\n\s*\{ key: 'notes', label: 'Notes' \},/);
  });
});

describe('4. wiring', () => {
  const HUB = code(`${MG}/MixingGuidesHubScreen.tsx`);
  const READER = code(`${MG}/MixingGuideScreen.tsx`);
  it('the hub hands its guide to LabHeader inside a ScreenGuideHost', () => {
    assert.match(HUB, /import \{ MIXING_GUIDES_HUB_GUIDE \} from '\.\/mixingGuidesScreenGuides';/);
    assert.match(HUB, /<ScreenGuideHost regions=\{false\} resetKey="hub">\s*<LabHeader title="MIXING GUIDES"[^>]*guide=\{MIXING_GUIDES_HUB_GUIDE\} \/>/);
    assert.match(HUB, /<\/ScreenGuideHost>\s*(\{\})?\s*<ProNoteIntro \/>/);
  });
  it('the reader hands its guide to LabHeader, never on the what’s-left screen', () => {
    assert.match(READER, /import \{ MIXING_GUIDE_READER_GUIDE \} from '\.\/mixingGuidesScreenGuides';/);
    assert.match(READER, /<ScreenGuideHost regions=\{false\} resetKey=\{ending \? 'end' : 'guide'\}>/);
    assert.match(READER, /guide=\{ending \? undefined : MIXING_GUIDE_READER_GUIDE\}/);
    assert.match(READER, /<\/ScreenGuideHost>\s*<\/View>\s*<\/LabNavProvider>/);
  });
  it('the guide file only reads the template: it imports nothing from the hand-edited guide data or the map', () => {
    const src = read(`${MG}/mixingGuidesScreenGuides.ts`);
    assert.doesNotMatch(src, /from '\.\/data\//);
    assert.doesNotMatch(src, /from '\.\/GuideWorldMap'/);
  });
});

describe('5. the accuracy chip', () => {
  it('the reader KEEPS it — each guide prints live SPL and loudness figures', () => {
    assert.match(code(`${MG}/MixingGuideScreen.tsx`), /right=\{<AccuracyNote compact detail=\{ACCURACY_DETAIL\} \/>\}/);
    assert.match(code(`${MG}/data/types.ts`), /\{ key: 'liveSpl', label: 'Live SPL \(FOH, average\)' \}/);
  });
  it('the hub has no chip (no measurement on the menu)', () => {
    assert.doesNotMatch(code(`${MG}/MixingGuidesHubScreen.tsx`), /AccuracyNote/);
  });
});
