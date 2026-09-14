/**
 * Help hub content — the searchable FAQ that stands between a confused user
 * and giving up (docs/design/APE_ONBOARDING_HELP_PLAN_2026_09_07.md §4).
 *
 * What is pinned here and why it matters:
 *  1. filterHelp — the search behavior itself: case-insensitive, whitespace
 *     tolerant, empty categories DROP OUT (a category header above zero
 *     answers reads as "we have nothing for you"), and a no-match returns an
 *     empty list rather than the full unfiltered hub (which would look like
 *     the search silently ignored the query).
 *  2. Entry ids unique — ids key React lists and any future analytics; a
 *     duplicate silently collides.
 *  3. Every jump.route must be a REAL route in RootStackParamList — the jump
 *     button navigates with a cast at the call site, so a typo'd route name
 *     type-checks fine and then throws (or no-ops) on the user's first tap.
 *     The route list is parsed from the source text of navigation/types.ts.
 *  4. Every `<HelpKey search="…">` pre-fill term in the app must match at
 *     least one entry — a screen's "?" key that opens the hub pre-filtered to
 *     NOTHING is worse than no help key at all. The terms are gathered by
 *     scanning src, so a new HelpKey placement is covered automatically.
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  HELP_CATEGORIES,
  filterHelp,
  type HelpCategory,
} from '../src/features/help/helpContent.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ── filterHelp behavior ─────────────────────────────────────────────────────

test('an empty or whitespace-only query returns the whole hub unfiltered', () => {
  assert.equal(filterHelp(''), HELP_CATEGORIES);
  assert.equal(filterHelp('   '), HELP_CATEGORIES);
  assert.equal(filterHelp('\t\n'), HELP_CATEGORIES);
});

test('matching is case-insensitive across question AND answer text', () => {
  const flat = (cats: HelpCategory[]) => cats.flatMap((c) => c.entries.map((e) => e.id));
  // "guest" appears in questions ("What is Guest Mode?") and answers.
  const lower = flat(filterHelp('guest'));
  const upper = flat(filterHelp('GUEST'));
  const mixed = flat(filterHelp('GuEsT'));
  assert.ok(lower.length > 0, 'the seed term must match something');
  assert.deepEqual(upper, lower);
  assert.deepEqual(mixed, lower);
  // An answer-only term: "Trophy Case" never appears in a question's text of
  // the tools category, but does in study answers — answers must be searched.
  const answerHit = flat(filterHelp('trophy case'));
  assert.ok(answerHit.includes('study-certs'), 'answer text is searchable');
});

test('surrounding whitespace in the query is trimmed before matching', () => {
  const ids = (cats: HelpCategory[]) => cats.flatMap((c) => c.entries.map((e) => e.id));
  assert.deepEqual(ids(filterHelp('  guest  ')), ids(filterHelp('guest')));
  // But INTERNAL whitespace is part of the query — "guest mode" is a phrase.
  assert.ok(ids(filterHelp('guest mode')).length > 0);
});

test('a query nothing matches returns an empty list, not the full hub', () => {
  assert.deepEqual(filterHelp('xylophone-quantum-flux'), []);
});

test('categories with zero matching entries drop out entirely', () => {
  // "bluetooth" lives only in TROUBLESHOOTING — every other category must be
  // absent from the result, not present-but-empty.
  const cats = filterHelp('bluetooth');
  assert.equal(cats.length, 1);
  assert.equal(cats[0].key, 'trouble');
  assert.ok(cats[0].entries.every((e) => e.id === 'tr-bluetooth'));
  for (const c of filterHelp('the')) {
    assert.ok(c.entries.length > 0, `category ${c.key} survived with no entries`);
  }
});

test('filtering never mutates the source categories', () => {
  const before = HELP_CATEGORIES.map((c) => c.entries.length);
  filterHelp('bluetooth');
  filterHelp('zzz-no-match');
  const after = HELP_CATEGORIES.map((c) => c.entries.length);
  assert.deepEqual(after, before);
});

// ── Content integrity ───────────────────────────────────────────────────────

test('every help entry id is unique across all categories', () => {
  const seen = new Map<string, string>();
  for (const c of HELP_CATEGORIES) {
    for (const e of c.entries) {
      assert.ok(!seen.has(e.id), `duplicate id "${e.id}" in ${c.key} (first in ${seen.get(e.id)})`);
      seen.set(e.id, c.key);
    }
  }
});

test('every entry has non-empty question and answer text', () => {
  for (const c of HELP_CATEGORIES) {
    for (const e of c.entries) {
      assert.ok(e.q.trim().length > 0, `${e.id} has an empty question`);
      assert.ok(e.a.trim().length > 0, `${e.id} has an empty answer`);
    }
  }
});

// ── jump.route ↔ RootStackParamList ─────────────────────────────────────────

/** Parse the top-level key names out of `export type RootStackParamList = {…}`
 *  from the SOURCE TEXT of navigation/types.ts. Robust to formatting: finds
 *  the opening brace, walks brace depth, and collects identifiers that start
 *  a member at depth 1 (`Name:` or `Name?:`). Nested object params (depth ≥ 2)
 *  are ignored, as are comment lines. */
function rootStackRouteNames(): string[] {
  const src = readFileSync(path.join(ROOT, 'src', 'navigation', 'types.ts'), 'utf8');
  const m = /export\s+type\s+RootStackParamList\s*=\s*\{/.exec(src);
  assert.ok(m, 'RootStackParamList not found in src/navigation/types.ts');
  let i = m!.index + m![0].length;
  let depth = 1;
  const names: string[] = [];
  let inLineComment = false;
  let inBlockComment = false;
  let atMemberStart = true; // just after `{`, `;` or `,` at depth 1
  while (i < src.length && depth > 0) {
    const ch = src[i];
    const two = src.slice(i, i + 2);
    if (inLineComment) {
      if (ch === '\n') inLineComment = false;
      i++;
      continue;
    }
    if (inBlockComment) {
      if (two === '*/') {
        inBlockComment = false;
        i += 2;
        continue;
      }
      i++;
      continue;
    }
    if (two === '//') {
      inLineComment = true;
      i += 2;
      continue;
    }
    if (two === '/*') {
      inBlockComment = true;
      i += 2;
      continue;
    }
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    else if (depth === 1) {
      if (ch === ';' || ch === ',') atMemberStart = true;
      else if (atMemberStart && /[A-Za-z_]/.test(ch)) {
        const rest = src.slice(i);
        const km = /^([A-Za-z_][A-Za-z0-9_]*)\s*\??\s*:/.exec(rest);
        if (km) {
          names.push(km[1]);
          i += km[0].length;
          atMemberStart = false;
          continue;
        }
        atMemberStart = false;
      } else if (!/\s/.test(ch)) {
        atMemberStart = false;
      }
    }
    i++;
  }
  assert.equal(depth, 0, 'unbalanced braces while parsing RootStackParamList');
  return names;
}

test('every help jump.route names a real RootStackParamList route', () => {
  const routes = new Set(rootStackRouteNames());
  // Sanity on the parser itself before trusting its verdicts: routes that
  // have existed since the seed brief must be present.
  for (const known of ['Splash', 'Auth', 'Settings', 'ToolsHub', 'Help']) {
    assert.ok(routes.has(known), `parser sanity: expected route "${known}" missing — parser broke?`);
  }
  for (const c of HELP_CATEGORIES) {
    for (const e of c.entries) {
      if (!e.jump) continue;
      assert.ok(
        routes.has(e.jump.route),
        `${e.id} jumps to "${e.jump.route}" which is not a RootStackParamList route — the cast at the navigate call site hides this from the type checker`,
      );
      assert.ok(e.jump.label.trim().length > 0, `${e.id} jump has an empty label`);
    }
  }
});

// ── HelpKey pre-fill terms actually surface answers ─────────────────────────

/** Every `<HelpKey search="…">` in src, gathered by scanning the tree so new
 *  placements are covered without editing this test. */
function helpKeyTerms(): { term: string; file: string }[] {
  const out: { term: string; file: string }[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = path.join(dir, name);
      const st = statSync(p);
      if (st.isDirectory()) walk(p);
      else if (/\.tsx?$/.test(name)) {
        const src = readFileSync(p, 'utf8');
        for (const m of src.matchAll(/<HelpKey\s+search="([^"]*)"/g)) {
          out.push({ term: m[1], file: p });
        }
      }
    }
  };
  walk(path.join(ROOT, 'src'));
  return out;
}

test('every HelpKey pre-fill term in the app matches at least one FAQ entry', () => {
  const found = helpKeyTerms();
  // The five placements known on 2026-09-13 — if the scan finds fewer, the
  // scan (not the app) is what broke.
  assert.ok(found.length >= 5, `scan sanity: expected at least 5 HelpKey placements, found ${found.length}`);
  const knownTerms = new Set(found.map((f) => f.term));
  for (const expected of ['study', 'tool', 'meter', 'lab', 'enroll']) {
    assert.ok(knownTerms.has(expected), `scan sanity: expected HelpKey term "${expected}" not found in src`);
  }
  for (const { term, file } of found) {
    const hits = filterHelp(term).flatMap((c) => c.entries);
    assert.ok(
      hits.length > 0,
      `HelpKey search="${term}" (${file}) opens the hub pre-filtered to ZERO answers`,
    );
  }
});
