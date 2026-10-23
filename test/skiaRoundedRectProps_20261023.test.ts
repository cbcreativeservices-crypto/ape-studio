/**
 * Every Skia <RoundedRect>, <Oval> and <Image> names its size (and a
 * RoundedRect its corner radius) — owner 2026-10-23: the DJ lab froze black
 * on the Pixel.
 *
 * Native Skia (cpp/api/recorder/Drawings.h) THROWS when one of these has no
 * `rect` and lacks width / height (/ r): "Invalid properties for rounded
 * rect", "Invalid properties received for Oval", "Image node could not
 * resolve image dimension props". The throw lands in the UI-thread replay,
 * the Canvas dies and the screen goes black. CanvasKit on the web draws it
 * anyway, so the web preview never shows the bug. Screen 17's dial loupe
 * shipped that way. A flat band wants <Rect>, not a RoundedRect without r.
 *
 * Scans every src file that imports Skia (brace-aware, so an arrow function
 * inside a prop does not end the tag early). A spread prop is allowed only
 * where it is listed below with its reason.
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Files whose shape takes its props from a spread (none today). */
const SPREAD_OK: readonly string[] = [];

/** What native Skia needs from each shape that has no `rect`. */
const NEEDS: Record<string, readonly string[]> = {
  RoundedRect: ['width', 'height', 'r'],
  Oval: ['width', 'height'],
  Image: ['width', 'height'],
};

function tsxFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) tsxFiles(p, out);
    else if (name.endsWith('.tsx')) out.push(p);
  }
  return out;
}

/** Names this file imports from Skia. */
function skiaImports(src: string): Set<string> {
  const names = new Set<string>();
  for (const m of src.matchAll(/import\s*\{([^}]*)\}\s*from\s*'@shopify\/react-native-skia'/g)) {
    for (const part of m[1].split(',')) {
      const local = part.trim().split(/\s+as\s+/).pop()?.trim();
      if (local) names.add(local);
    }
  }
  return names;
}

/** The text of each `<Tag …>` opening tag in `src`. */
function openingTags(src: string, tag: string): { attrs: string; line: number }[] {
  const out: { attrs: string; line: number }[] = [];
  const re = new RegExp(`<${tag}\\b`, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    let i = m.index + m[0].length;
    let depth = 0;
    for (; i < src.length; i++) {
      const ch = src[i];
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      else if (ch === '>' && depth === 0) break;
    }
    out.push({ attrs: src.slice(m.index + m[0].length, i), line: src.slice(0, m.index).split('\n').length });
  }
  return out;
}

const has = (attrs: string, prop: string) => new RegExp(`(^|\\s)${prop}=`).test(attrs);

test('every Skia RoundedRect / Oval / Image without `rect` sets its size (and r)', () => {
  const bad: string[] = [];
  let seen = 0;
  for (const file of tsxFiles(path.join(ROOT, 'src'))) {
    const src = readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
    const skia = skiaImports(src);
    if (skia.size === 0) continue;
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    for (const [tag, needs] of Object.entries(NEEDS)) {
      if (!skia.has(tag)) continue; // e.g. react-native's Image is out of scope
      for (const { attrs, line } of openingTags(src, tag)) {
        seen++;
        if (/\{\s*\.\.\./.test(attrs)) {
          if (!SPREAD_OK.includes(rel)) bad.push(`${rel}:${line} <${tag}> uses a spread — list it in SPREAD_OK with its reason`);
          continue;
        }
        if (has(attrs, 'rect')) continue;
        const missing = needs.filter((k) => !has(attrs, k));
        if (missing.length) bad.push(`${rel}:${line} <${tag}> is missing ${missing.join(', ')}`);
      }
    }
  }
  assert.ok(seen > 500, `scan sanity: expected hundreds of Skia shapes, found ${seen}`);
  assert.deepEqual(bad, [], `native Skia throws on these (black screen):\n${bad.join('\n')}`);
});
