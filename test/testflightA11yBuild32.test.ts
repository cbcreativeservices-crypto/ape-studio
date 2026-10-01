/**
 * GUARDS — TestFlight build 32 accessibility report (iPhone 13 Pro, iOS 26.6,
 * Larger Text on; the tester is dyslexic).
 *
 *  T1  "Opening screen with big text on is difficult to read. Scaling issues."
 *      Splash + Home are fixed-geometry brand surfaces: they now follow the OS
 *      text size up to BRAND_MAX_FONT_SCALE (1.35, iOS's largest standard
 *      size) and hold there; single-line labels shrink to fit instead of
 *      truncating or breaking mid-word.
 *  T2  "The info symbol blends in with the page so it makes it hard to find."
 *      AccuracyNote's ⓘ chip (and HelpKey's "?" beside it) wear the header's
 *      gold — amber outline, lighter warm fill — at the same size.
 *
 * Source-text checks in the house style: these modules load React Native.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const blank = (s: string) => s.replace(/[^\n]/g, ' ');
const code = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, pre) => pre + ' '.repeat(m.length - pre.length));

const HOME = 'src/screens/courses/CourseSelectionScreen.tsx';
const SPLASH = 'src/screens/SplashScreen.tsx';

describe('T1 — Splash and Home hold at the largest standard text size', () => {
  test('the cap is the largest STANDARD iOS size, never below the design size', () => {
    const m = code('src/theme/tokens.ts').match(/export const BRAND_MAX_FONT_SCALE = ([\d.]+);/);
    assert.ok(m, 'BRAND_MAX_FONT_SCALE exported from tokens');
    const v = Number(m![1]);
    assert.ok(v >= 1.35, `cap ${v} must honour at least xxxLarge (1.35)`);
    assert.ok(v <= 1.5, `cap ${v} must leave the fixed-height Home deck room`);
  });

  test('every Splash wordmark line is capped and kept on one line', () => {
    const s = code(SPLASH);
    for (const word of ['PRO AUDIO', 'TRAINING ACADEMY', 'PROFESSIONAL AUDIO GLOSSARY']) {
      const re = new RegExp(
        `maxFontSizeMultiplier=\\{BRAND_MAX_FONT_SCALE\\} numberOfLines=\\{1\\} adjustsFontSizeToFit minimumFontScale=\\{[\\d.]+\\}>\\s*${word}\\s*</Text>`,
      );
      assert.match(s, re, `${word} is capped + one line`);
    }
  });

  test('every Text on Home carries the cap (only the error message scales freely)', () => {
    const s = code(HOME);
    assert.match(s, /const HOME_MAX = BRAND_MAX_FONT_SCALE;/);
    // Each <Text …> opening tag, through its closing `>` (attributes may span lines).
    const tags = [...s.matchAll(/<Text\b([^>]*)>/g)].map((m) => m[0]);
    assert.ok(tags.length >= 25, `scan sanity: found ${tags.length} Text tags`);
    const uncapped = tags.filter(
      (t) => !t.includes('maxFontSizeMultiplier={HOME_MAX}') && !t.includes('styles.errorText') && !t.includes('styles.heroAccent'),
    );
    assert.deepEqual(uncapped, [], 'a Home Text without the cap');
  });

  test('every Home card key is capped (GlassButton passes the prop through)', () => {
    const s = code(HOME);
    const keys = [...s.matchAll(/<GlassButton\b([^>]*)/g)].map((m) => m[0]);
    assert.ok(keys.length >= 8, `scan sanity: found ${keys.length} GlassButton`);
    for (const k of keys) assert.match(k, /maxFontSizeMultiplier=\{HOME_MAX\}/);
    const g = code('src/components/GlassButton.tsx');
    assert.match(g, /maxFontSizeMultiplier\?: number;/);
    assert.match(g, /<Text\s+maxFontSizeMultiplier=\{maxFontSizeMultiplier\}/);
    assert.match(g, /textAlign: 'center'/);
  });

  test('the five chips shrink to fit at the cap instead of truncating', () => {
    const s = code(HOME);
    for (const label of ['Explore', 'Certificates', 'Programs', 'Pro Registry', 'Enrollments']) {
      const re = new RegExp(
        `maxFontSizeMultiplier=\\{HOME_MAX\\}\\s+numberOfLines=\\{1\\}\\s+adjustsFontSizeToFit\\s+minimumFontScale=\\{0\\.6\\}\\s*>\\s*${label}\\s*</Text>`,
      );
      assert.match(s, re, `${label} chip`);
    }
  });

  test('the wordmark, glossary line and deck headline never wrap', () => {
    const s = code(HOME);
    assert.match(s, /<Text style=\{styles\.heroWordmark\} maxFontSizeMultiplier=\{HOME_MAX\} numberOfLines=\{1\} adjustsFontSizeToFit/);
    assert.match(s, /<Text style=\{styles\.heroEyebrow\} maxFontSizeMultiplier=\{HOME_MAX\} numberOfLines=\{1\} adjustsFontSizeToFit/);
    assert.match(s, /styles\.academyTitle\} accessibilityLiveRegion="polite" maxFontSizeMultiplier=\{HOME_MAX\} numberOfLines=\{1\} adjustsFontSizeToFit/);
  });

  test('the About corner key is capped (AttractText passes the prop through)', () => {
    assert.match(code(HOME), /<AttractText active=\{attract\.about\} glow style=\{styles\.aboutBtnText\} maxFontSizeMultiplier=\{HOME_MAX\}>/);
    const a = code('src/features/onboarding/AttractCue.tsx');
    assert.match(a, /<Animated\.Text maxFontSizeMultiplier=\{maxFontSizeMultiplier\}/);
  });
});

describe('T2 — the header ⓘ and ? are easy to find', () => {
  test('AccuracyNote chip: amber outline + lighter warm fill, same geometry', () => {
    const s = code('src/components/AccuracyNote.tsx');
    const chip = s.match(/ chip: \{([\s\S]*?)\n  \},/);
    assert.ok(chip, 'chip style found');
    const c = chip![1];
    assert.match(c, /borderColor: 'rgba\(255,198,77,\.75\)'/);
    assert.match(c, /backgroundColor: '#2a2210'/);
    assert.doesNotMatch(c, /colors\.hairline/);
    // Size / hit area unchanged.
    assert.match(c, /paddingVertical: 5,/);
    assert.match(c, /paddingHorizontal: 8,/);
    assert.match(c, /borderWidth: 1,/);
    assert.match(s, /hitSlop=\{8\}/);
    assert.match(s, /chipGlyph: \{ fontFamily: fonts\.barlowSemiBold, fontSize: 13, color: colors\.amber/);
    // The green calc chip keeps its own colour family.
    assert.match(s, /style=\{\[styles\.chip, isCalc && styles\.chipCalc, style\]\}/);
  });

  test('HelpKey "?" wears the amber ring at the same 24-pt size', () => {
    const s = code('src/components/HelpKey.tsx');
    assert.match(s, /width: 24,\s+height: 24,/);
    assert.match(s, /borderColor: 'rgba\(255,198,77,\.75\)'/);
    assert.match(s, /color: colors\.amber,/);
    assert.match(s, /hitSlop=\{10\}/);
  });
});
