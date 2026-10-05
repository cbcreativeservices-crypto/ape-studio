/**
 * Miking Labs — LEARNER-FACING TEXT stays clean (owner ruling 2026-10-04).
 *
 * The owner, after approving the Kick Drum lesson: "remove all of the
 * references and authoritative honesty points by just stating 'after our
 * research, here is where we recommend to begin, and ideas and concepts to
 * consider' … The cross-referencing is too much a distraction."
 *
 * So what a learner SEES names no source, brand or model, carries no
 * SOURCED / TRIAL / ILLUSTRATIVE badge and no "(L39)"-style code, and there
 * is no Sources page. The research itself stays mandatory — it lives in
 * docs/labs/miking/ (SOURCES.md, CORRECTIONS_LOG.md) and in the code-only
 * fields listed in INTERNAL_KEYS below, which this test skips.
 *
 * Scope (learner-facing content only):
 *   • every lesson's DATA (walked; INTERNAL_KEYS skipped), the mic types, the
 *     journey stages and the registry rows;
 *   • every presentation file under src/screens/lab/miking (.tsx, plus the
 *     .ts helpers that build on-screen words), comments stripped.
 *
 * Add a brand to BRAND_NAMES when a later lesson's research meets a new one.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, it } from 'node:test';
import { lessonById } from '../src/screens/lab/miking/data/lessons.ts';
import { LESSONS, MIKING_LABS } from '../src/screens/lab/miking/data/registry.ts';
import { MIC_TYPES } from '../src/screens/lab/miking/data/micTypes.ts';
import { STAGES } from '../src/screens/lab/miking/engine/journey.ts';
import { PAGE_IDS } from '../src/screens/lab/miking/engine/model/types.ts';

/** Brands, models and named authorities that are never shown to a learner
 *  (they stay on the internal record). Regex fragments, matched whole-word. */
export const BRAND_NAMES: readonly string[] = [
  'Shure',
  'Sennheiser',
  'AKG',
  'DPA',
  'Audix',
  'Electro-Voice',
  'Neumann',
  'Beyerdynamic',
  'Yamaha',
  'TAMA',
  'Pearl',
  'Ludwig',
  'Remo',
  'Evans',
  'Aquarian',
  'DW',
  'KickPro',
  'zZounds',
  'Beta ?52A?',
  'Beta ?91A?',
  'e ?902',
  'D112',
  '4055',
  'NIOSH',
  'Rossing',
  // Lab 1 snare and toms research (docs/labs/miking/snare, toms, kit).
  'SM ?57',
  'Beta ?56A?',
  'e ?904',
  'DM ?20',
  'i5',
  'D[246]',
  'MZH ?604',
  '4099',
  'Earthworks',
  'Zildjian',
  'Sabian',
  // Lab 4 guitar-family research (docs/labs/miking/acoustic_guitar, resonator_dobro, banjo, mandolin, ukulele, acoustic_bass_guitar).
  'Taylor',
  'Martin',
  'Cordoba',
  'Gibson',
  'National',
  'Beard',
  'Fishman',
  'Deering',
  'Kala',
  'Eastman',
  'Dobro',
  'KSM ?\\d+',
  'PGA ?27',
  'OSHA',
];

/** The badge system and citation forms the ruling took off the screen. */
export const BANNED_FORMS: readonly RegExp[] = [
  /\bSOURCED\b/,
  /\bTRIAL\b/,
  /\bILLUSTRATIVE\b/,
  /\bIDEAL MODEL\b/,
  /\bideal only\b/i,
  /\blab edges\b/i,
  /\bguide ·/,
  /\(L\d+\)/,
  /\bL\d+-L\d+\b/,
  /\bK-\d\d\b/,
  /\bSources\b/,
  /\bdocumented\b/i,
  /\bcited\b/i,
  /\b(?:the|a|its|this|each) guides?(?:’s|'s)?\b/i,
];

const BRAND_RE = new RegExp(`\\b(?:${BRAND_NAMES.join('|')})\\b`);
const ALL: readonly RegExp[] = [...BANNED_FORMS, BRAND_RE];

/** Code-only fields: the internal research record (never rendered). */
const INTERNAL_KEYS = new Set(['src', 'quote', 'prov', 'bandProv', 'strikeSrc', 'unknowns', 'examples', 'kind']);

function strings(v: unknown, path: string, out: { path: string; text: string }[]): void {
  if (typeof v === 'string') out.push({ path, text: v });
  else if (Array.isArray(v)) v.forEach((x, i) => strings(x, `${path}[${i}]`, out));
  else if (v && typeof v === 'object') {
    for (const [k, x] of Object.entries(v)) if (!INTERNAL_KEYS.has(k)) strings(x, `${path}.${k}`, out);
  }
}

function offences(items: { path: string; text: string }[]): string[] {
  const bad: string[] = [];
  for (const { path, text } of items) for (const re of ALL) if (re.test(text)) bad.push(`${path}: ${re} in "${text.slice(0, 120)}"`);
  return bad;
}

const ROOT = process.cwd();
const MIKING = join(ROOT, 'src/screens/lab/miking');
/** .ts files that BUILD on-screen words (the rest of the .ts are data — walked — or pure maths). */
const TS_PRESENTATION = ['engine/journey.ts', 'engine/scene/readoutText.ts', 'engine/scene/sceneWords.ts', 'engine/a11y/describe.ts', 'engine/model/units.ts', 'engine/model/copy.ts', 'engine/scene/placementDock.ts'];
const stripComments = (s: string) => s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

function tsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) out.push(...tsxFiles(p));
    else if (f.endsWith('.tsx')) out.push(p);
  }
  return out;
}

describe('learner-facing text names no source and carries no badge (owner ruling 2026-10-04)', () => {
  it('the brand list is a constant the patterns are built from', () => {
    assert.ok(BRAND_NAMES.length >= 10);
    for (const b of ['Shure', 'Sennheiser', 'AKG', 'DPA', 'Beta ?52A?', 'Beta ?91A?', 'e ?902', 'D112']) assert.ok(BRAND_NAMES.includes(b), b);
    assert.ok(BRAND_RE.test('the Beta 52A guide') && BRAND_RE.test('e 902') && !BRAND_RE.test('a kick dynamic'));
  });

  it('the patterns catch what the ruling removed, and pass plain starting-point words', () => {
    for (const s of ['SOURCED*', 'TRIAL reading', 'PEDAL · ILLUSTRATIVE', 'Beta 52A guide · near', 'kick L39 (L39)', 'Sources', 'a documented zone']) assert.ok(ALL.some((re) => re.test(s)), s);
    for (const s of ['Inside, near the batter head', 'Start about 5–7.5 cm (2–3 in) from the batter head.', 'After our research, here is where we recommend you begin.', 'follow the manual for your own equipment', 'A widely used guideline: 85 dBA']) assert.deepEqual(ALL.filter((re) => re.test(s)), [], s);
  });

  for (const meta of LESSONS) {
    it(`${meta.id}: every learner-facing string in the lesson data is clean`, () => {
      const lesson = lessonById(meta.id);
      assert.ok(lesson, meta.id);
      const items: { path: string; text: string }[] = [];
      strings(lesson, meta.id, items);
      assert.ok(items.length > 200, 'the walk reached the lesson text');
      assert.deepEqual(offences(items), []);
    });
  }

  it('the mic types, the journey stages and the registry rows are clean', () => {
    const items: { path: string; text: string }[] = [];
    strings(MIC_TYPES, 'MIC_TYPES', items);
    strings(STAGES, 'STAGES', items);
    strings(MIKING_LABS, 'MIKING_LABS', items);
    strings(LESSONS, 'LESSONS', items);
    assert.deepEqual(offences(items), []);
  });

  it('every presentation file under src/screens/lab/miking is clean (comments stripped)', () => {
    const files = [...tsxFiles(MIKING), ...TS_PRESENTATION.map((f) => join(MIKING, f))];
    assert.ok(files.length >= 20, `${files.length} files`);
    const bad: string[] = [];
    for (const f of files) {
      const text = stripComments(readFileSync(f, 'utf8').replace(/\r\n/g, '\n'));
      text.split('\n').forEach((line, i) => {
        for (const re of ALL) if (re.test(line)) bad.push(`${relative(ROOT, f)}:${i + 1}: ${re} in ${line.trim().slice(0, 120)}`);
      });
    }
    assert.deepEqual(bad, []);
  });
});

describe('the journey ends at Practice; one "about these starting points" note', () => {
  it('there is no Sources page, and no page component for one', () => {
    assert.ok(!(PAGE_IDS as readonly string[]).includes('sources'));
    assert.equal(PAGE_IDS[PAGE_IDS.length - 1], 'practice');
    const host = readFileSync(join(MIKING, 'MikingLessonScreen.tsx'), 'utf8');
    assert.doesNotMatch(host, /PSources/);
    assert.doesNotMatch(readFileSync(join(MIKING, 'pages/PReadPages.tsx'), 'utf8'), /export function PSources/);
  });
  it('the ⓘ note says these are starting points from our research — experiment and trust your ears', () => {
    for (const meta of LESSONS) {
      const d = lessonById(meta.id)!.accuracyDetail;
      assert.match(d, /^ABOUT THESE STARTING POINTS\./);
      assert.match(d, /After our research/);
      assert.match(d, /experiment/i);
      assert.match(d, /trust your ears/);
    }
  });
  it('the evidence-badge components are gone from the kit', () => {
    const kit = readFileSync(join(MIKING, 'engine/kit.tsx'), 'utf8');
    assert.doesNotMatch(kit, /export function (ProvenanceTag|HowToRead)\b/);
    assert.match(kit, /RECOMMENDED STARTING POINT/);
  });
});
