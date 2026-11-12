/**
 * Screen Guides — Game Audio Lab (must-do D60, 2026-11-12). The house
 * pattern (test/screenGuide_djsystems_20261031.test.ts), for this lab:
 *
 *   1. every page file has a guide in its own pure file (pages/guides/pNN.ts,
 *      export GNN) and its PageDef carries it;
 *   2. every guide has the intro card inside its word caps, five sections of
 *      1–5 bullets, 2–3 TRY THIS, and each step inside its no-scroll budget;
 *   3. the house copy rules: the student's voice, knowledge not skills, US
 *      spelling, no citations;
 *   4. a guide names the controls its page really has: every ALL-CAPS dock
 *      word a guide's WHAT YOU CONTROL quotes is in the page's source or the
 *      shared rack (SOUND, ■ STOP, the readouts);
 *   5. the what's-left screen has its own guide, and every button it quotes
 *      is the shared end screen's.
 */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import { SCREEN_GUIDE_BUDGET, SCREEN_GUIDE_SECTIONS, SCREEN_INTRO_WORDS, type ScreenGuide } from '../src/features/lab/screenGuide/types.ts';
import { GA_END_GUIDE } from '../src/screens/lab/gameaudio/pages/guides/end.ts';

const ROOT = process.cwd();
const GA = 'src/screens/lab/gameaudio';
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const PAGE_FILES = readdirSync(join(ROOT, GA, 'pages')).filter((f) => /^p\d\d\w+\.tsx$/.test(f)).sort();
type Page = { file: string; nn: string; title: string; guide: ScreenGuide; src: string };
const PAGES: Page[] = [];
for (const file of PAGE_FILES) {
  const nn = file.slice(1, 3);
  const src = code(`${GA}/pages/${file}`);
  const m = src.match(/export const P\d\d: PageDef = \{\s*title: '([^']+)'/);
  assert.ok(m, `${file}: PageDef title`);
  const gpath = `${GA}/pages/guides/p${nn}.ts`;
  assert.ok(existsSync(join(ROOT, gpath)), `${file}: its guide file ${gpath}`);
  const mod = (await import(pathToFileURL(join(ROOT, gpath)).href)) as Record<string, ScreenGuide>;
  const guide = mod[`G${nn}`];
  assert.ok(guide, `${gpath} exports G${nn}`);
  PAGES.push({ file, nn, title: m[1], guide, src });
}

const SECTION_KEYS = SCREEN_GUIDE_SECTIONS.map((s) => s.key);
const words = (s: string) => s.trim().split(/\s+/).length;
const allText = (g: ScreenGuide) => [g.intro?.learning ?? '', g.intro?.start ?? '', ...SECTION_KEYS.flatMap((k) => g[k])].join('\n');

function checkShape(name: string, g: ScreenGuide): void {
  assert.ok(g.intro, `${name}: intro card`);
  assert.ok(words(g.intro!.learning) <= SCREEN_INTRO_WORDS.learning, `${name}: intro.learning is ${words(g.intro!.learning)} words`);
  assert.ok(words(g.intro!.start) <= SCREEN_INTRO_WORDS.start, `${name}: intro.start is ${words(g.intro!.start)} words`);
  for (const s of SCREEN_GUIDE_SECTIONS) {
    const items = g[s.key];
    assert.ok(Array.isArray(items) && items.length >= 1 && items.length <= 5, `${name}.${s.key}: ${items?.length} bullets`);
    for (const it of items) assert.ok(it.trim().length > 20, `${name}.${s.key}: a real sentence`);
    if (s.key === 'tryThis') {
      assert.ok(items.length >= 2 && items.length <= 3, `${name}.tryThis: ${items.length} experiments`);
      for (const it of items) assert.ok(it.length <= SCREEN_GUIDE_BUDGET.tryItem, `${name}.tryThis item is ${it.length} characters`);
    } else {
      const total = items.join('\n').length;
      const cap = s.place === 'high' ? SCREEN_GUIDE_BUDGET.high : SCREEN_GUIDE_BUDGET.low;
      assert.ok(total <= cap, `${name}.${s.key}: ${total} characters (cap ${cap})`);
    }
  }
}

describe('every Game Audio page has its guide', () => {
  it('the page carries the guide from its own pure file', () => {
    assert.ok(PAGES.length >= 1);
    for (const p of PAGES) {
      assert.match(p.src, new RegExp(`import \\{ G${p.nn} \\} from './guides/p${p.nn}'`), `${p.file} imports G${p.nn}`);
      assert.match(p.src, new RegExp(`guide: G${p.nn}\\b`), `${p.file}: PageDef.guide`);
    }
    assert.equal(new Set(PAGES.map((p) => p.title)).size, PAGES.length, 'titles are unique');
  });
  it('shape and budgets: the intro card, five sections, 2–3 TRY THIS, no step scrolls', () => {
    for (const p of PAGES) checkShape(p.title, p.guide);
  });
  it('house copy rules', () => {
    for (const p of PAGES) {
      const t = allText(p.guide);
      assert.ok(/\byou(r|’re|’ll|’ve)?\b/i.test(t), `${p.title}: speaks to the student`);
      assert.ok(!/you(’|')ll (master|build|mix)|you will (master|be able to)/i.test(t), `${p.title}: knowledge, not skills`);
      assert.ok(!/\b(colour|behaviour|centre|programmes?|grey)\b|\b(organis|recognis)/i.test(t), `${p.title}: US spelling`);
      assert.ok(!/\b(research shows|studies show|according to|survey)\b/i.test(t), `${p.title}: no citations`);
      assert.ok(!/locali[sz]ation/i.test(t), `${p.title}: no "localization" for languages`);
      assert.ok(!/\bthis screen (shows|lists|contains)\b/i.test(p.guide.teaches.join(' ')), `${p.title}: WHAT THIS TEACHES is knowledge, not a description of the screen`);
    }
  });
  it('no two pages share a guide line', () => {
    const seen = new Map<string, string>();
    const SHARED = /^SOUND turns the lab’s sound on or off\./;
    for (const p of PAGES) {
      for (const k of SECTION_KEYS) {
        for (const line of p.guide[k]) {
          if (SHARED.test(line)) continue;
          const was = seen.get(line);
          assert.ok(!was, `"${line.slice(0, 60)}…" is on both ${was} and ${p.title}`);
          seen.set(line, p.title);
        }
      }
    }
  });
  it('WHAT YOU CONTROL names keys the page really has', () => {
    const rack = code(`${GA}/GaLab.tsx`) + code(`${GA}/pages/shared.tsx`);
    for (const p of PAGES) {
      const have = (p.src + rack).toUpperCase();
      const quoted = new Set<string>();
      for (const line of p.guide.control) for (const m of line.matchAll(/\b[A-Z][A-Z0-9]{2,}(?: [A-Z0-9]{2,})*\b/g)) quoted.add(m[0]);
      for (const q of quoted) assert.ok(have.includes(q), `${p.title}: the guide quotes "${q}", which is not a label in ${p.file} or the shared rack`);
    }
  });
});

describe('the what’s-left screen has its own guide', () => {
  it('shape, budgets, and every button it quotes is the shared end screen’s', () => {
    checkShape('END', GA_END_GUIDE);
    const end = read('src/screens/lab/kit/LabEndScreen.tsx') + read('src/screens/lab/kit/labEnd.ts');
    for (const name of ['LAB COMPLETE', 'YOUR PROGRESS', 'DONE · BACK TO LABS', 'REVIEW ▾', 'HIDE ▴']) {
      assert.ok(allText(GA_END_GUIDE).includes(name), `the guide quotes ${name}`);
      assert.ok(end.includes(name), `the end screen says ${name}`);
    }
    assert.ok(end.includes("WHAT'S LEFT") && allText(GA_END_GUIDE).includes('WHAT’S LEFT'));
  });
  it('the lab screen hands PagedLab the end guide', () => {
    assert.match(code(`${GA}/GameAudioLabScreen.tsx`), /endGuide=\{GA_END_GUIDE\}/);
  });
});
