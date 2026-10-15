/**
 * LARGE TEXT (iOS Dynamic Type / Android font scale) — build 36 TestFlight,
 * one tester on an iPhone 13 Pro with Larger Text on (2026-10-09 reports,
 * collected 2026-10-15).
 *
 * 1. Audio Community Directory, "Can't get back to main screen": the ‹ grew
 *    past its fixed 40×44 key and showed as a sliver beside the two-line title.
 *    Every ‹ back glyph now holds at BACK_GLYPH_MAX_SCALE, and the directory
 *    uses the shared HomeOrBackKey (HOME when the back step lands on Home).
 * 2. Flashcards, "the most difficult to navigate and view": chip rows, dock
 *    keys, readouts and the compact CAUTION strip hold at a cap; the term
 *    shrinks to fit the card; the card never draws outside itself.
 * 3. Career Finder, "it listed DJ as 8": the bonus card carries no rank circle.
 * 4. Crash (build 28): a Modal over a landscape screen must allow landscape.
 *    nativeCrashGuards.test.ts checks raw `<Modal`; this closes the alias gap.
 * 5. Glossary title shrinks to its line instead of "GL…".
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, it } from 'node:test';

const SRC = join(process.cwd(), 'src');
const read = (p: string) => readFileSync(join(SRC, p), 'utf8');

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

/** May only SHRINK. DashboardScreen's ‹ is the topic stepper, owned elsewhere. */
const BACK_GLYPH_ALLOW = new Set(['screens/dashboard/DashboardScreen.tsx']);

describe('the way out is never squeezed (large text)', () => {
  it('the cap is one shared constant', () => {
    assert.match(read('theme/tokens.ts'), /export const BACK_GLYPH_MAX_SCALE = BRAND_MAX_FONT_SCALE;/);
  });

  it('every ‹ glyph holds at BACK_GLYPH_MAX_SCALE', () => {
    const offenders: string[] = [];
    for (const f of walk(SRC)) {
      const rel = relative(SRC, f).replace(/\\/g, '/');
      if (BACK_GLYPH_ALLOW.has(rel)) continue;
      readFileSync(f, 'utf8')
        .split(/\r?\n/)
        .forEach((line, i) => {
          if (/>‹<\/Text>/.test(line) && !/maxFontSizeMultiplier=\{BACK_GLYPH_MAX_SCALE\}/.test(line)) {
            offenders.push(`${rel}:${i + 1}`);
          }
        });
    }
    assert.deepEqual(offenders, [], `a ‹ that scales without a cap outgrows its key at the accessibility sizes:\n${offenders.join('\n')}`);
  });

  it('HomeOrBackKey caps the glyph and never shrinks', () => {
    const s = read('components/nav/HomeOrBackKey.tsx');
    assert.match(s, /maxFontSizeMultiplier=\{BACK_GLYPH_MAX_SCALE\}>‹</);
    assert.match(s, /NEVER_SHRINK: ViewStyle = \{ flexShrink: 0 \}/);
    assert.equal((s.match(/style=\{\[NEVER_SHRINK, style\]\}/g) ?? []).length, 2, 'both faces (HOME and ‹) keep their width');
  });

  it('the Community Directory uses HomeOrBackKey in a key that cannot shrink', () => {
    const s = read('screens/directory/AudioCommunityDirectoryScreen.tsx');
    assert.match(s, /<HomeOrBackKey\b[\s\S]*?onPress=\{\(\) => safeGoBack\(navigation\)\}/);
    assert.match(s, /back: \{ minWidth: 44, minHeight: 44,[^}]*flexShrink: 0/);
    assert.doesNotMatch(s, /back: \{ width: 40, height: 44/, 'the fixed 40-pt key is what clipped the ‹');
    assert.match(s, /titleCol: \{ flex: 1, minWidth: 0 \}/);
  });

  it('the study RETURN key holds and the title column takes the slack', () => {
    const s = read('screens/study/StudyHeader.tsx');
    assert.match(s, /maxFontSizeMultiplier=\{BACK_GLYPH_MAX_SCALE\}>‹ RETURN</);
    assert.match(s, /rightCluster: \{[^}]*flexShrink: 0/);
  });
});

describe('Flashcards at large text', () => {
  const s = read('screens/study/FlashcardsScreen.tsx');

  it('chip labels, dock keys and readouts hold at a cap', () => {
    assert.match(s, /const CHIP_MAX_FONT_SCALE = 1\.2;/);
    assert.match(s, /chipStyles\.text, \{ color: fg \}\]\} maxFontSizeMultiplier=\{CHIP_MAX_FONT_SCALE\}/);
    // ‹ PREV, NEXT ›, MARK KNOWN, BOOKMARK TERM.
    assert.equal((s.match(/maxFontSizeMultiplier=\{DOCK_MAX_FONT_SCALE\}/g) ?? []).length >= 6, true);
    assert.match(s, /label="‹ PREV" tint="gold" maxFontSizeMultiplier=\{DOCK_MAX_FONT_SCALE\}/);
    assert.match(s, /label="NEXT ›" tint="green" maxFontSizeMultiplier=\{DOCK_MAX_FONT_SCALE\}/);
  });

  it('the term fits the card instead of running behind ‹ PREV / NEXT ›', () => {
    assert.match(
      s,
      /style=\{styles\.term\}\s+maxFontSizeMultiplier=\{TERM_MAX_FONT_SCALE\}\s+numberOfLines=\{4\}\s+adjustsFontSizeToFit/,
    );
    assert.match(s, /overflow: 'hidden',\s*\n\s*\},/, 'the card clips anything that still overflows');
  });

  it('the compact CAUTION strip holds at 1.35 and keeps every word (no clamp)', () => {
    const c = read('components/CautionBadge.tsx');
    assert.match(c, /maxFontSizeMultiplier=\{compact \? BRAND_MAX_FONT_SCALE : undefined\}/);
    assert.doesNotMatch(c, /numberOfLines=/);
  });
});

describe('Career Finder bonus card', () => {
  it('carries no rank circle (its 8 read as a rank)', () => {
    const s = read('screens/careerfinder/CareerFinderResultsScreen.tsx');
    assert.match(s, /\{ranked \? <RankBadge rank=\{item\.rank\} \/> : null\}/);
    assert.match(s, /familyCard\(\{ item: result\.surprise, size: 'compact', ranked: false,/);
  });
});

describe('modals over a landscape screen (build 28 crash)', () => {
  it('no react-native Modal is imported under another name (the raw-<Modal> ratchet would miss it)', () => {
    const offenders: string[] = [];
    for (const f of walk(SRC)) {
      const rel = relative(SRC, f).replace(/\\/g, '/');
      if (rel === 'components/DimModal.tsx') continue;
      const raw = readFileSync(f, 'utf8');
      if (/import \{[^}]*\bModal as \w+[^}]*\} from 'react-native';/.test(raw)) offenders.push(rel);
    }
    assert.deepEqual(offenders, []);
  });
});

describe('Glossary title', () => {
  it('shrinks to its line instead of truncating', () => {
    assert.match(read('screens/glossary/GlossaryScreen.tsx'), /<Text style=\{styles\.title\} numberOfLines=\{1\} adjustsFontSizeToFit minimumFontScale=\{0\.6\}>GLOSSARY<\/Text>/);
  });
});
