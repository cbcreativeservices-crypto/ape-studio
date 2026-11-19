#!/usr/bin/env node
/**
 * Copies the app's Career Finder logic and data into the website (owner 2026-11-19:
 * the free web Career Finder at /career-finder uses "the same files, kept in sync").
 *
 * web/ is its own Next.js app (Vercel root directory = web/), so it cannot import
 * from src/. This script copies the PURE Career Finder modules and their two JSON
 * files into web/lib/careerfinder/, changing only import paths. Nothing else.
 *
 *   node scripts/sync-career-finder-web.mjs           write the copies
 *   node scripts/sync-career-finder-web.mjs --check   exit 1 if any copy differs
 *
 * test/webCareerFinder_20261119.test.ts runs --check, so a change to the app's
 * questions, scoring, families, titles or education notes fails the suite until
 * this script is run again.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'web', 'lib', 'careerfinder');

const HEADER =
  '// GENERATED COPY of the app file named below. Do not edit here.\n' +
  '// Change the app file, then run: node scripts/sync-career-finder-web.mjs\n';

/** [source under src/, destination under web/lib/careerfinder/] */
const FILES = [
  ['features/careerfinder/dimensions.ts', 'dimensions.ts'],
  ['features/careerfinder/questions.ts', 'questions.ts'],
  ['features/careerfinder/families.ts', 'families.ts'],
  ['features/careerfinder/scoring.ts', 'scoring.ts'],
  ['features/careerfinder/educationNote.ts', 'educationNote.ts'],
  ['features/careerfinder/careerIndex.ts', 'careerIndex.ts'],
  ['features/careerfinder/labsForDimension.ts', 'labsForDimension.ts'],
  ['data/careerIndex.json', 'data/careerIndex.json'],
  ['data/careerFamilies.json', 'data/careerFamilies.json'],
];

function transform(src, text) {
  const t = text.replace(/\r\n/g, '\n');
  if (src.endsWith('.json')) return t;
  let out = t
    // scoring.ts uses explicit ".ts" endings; the web tsconfig does not allow them.
    .replace(/from '(\.\/[A-Za-z]+)\.ts'/g, "from '$1'")
    // careerIndex.ts reads the JSON from src/data; the copies sit in ./data.
    .replace(/from '\.\.\/\.\.\/data\/(career[A-Za-z]+\.json)'/g, "from './data/$1'");
  if (src.endsWith('labsForDimension.ts')) {
    // The app's route names are typed by its navigator; the web shows the lab by name only.
    out = out
      .replace("import type { RootStackParamList } from '../../navigation/types';\n", '')
      .replace('route: keyof RootStackParamList;', 'route: string;');
  }
  if (/from '\.\.\//.test(out)) throw new Error(`${src}: an import still points outside the Career Finder folder`);
  return `${HEADER}// Source: src/${src}\n${out}`;
}

const check = process.argv.includes('--check');
const drift = [];
for (const [src, dest] of FILES) {
  const want = transform(src, readFileSync(join(ROOT, 'src', src), 'utf8'));
  const path = join(OUT, dest);
  const have = existsSync(path) ? readFileSync(path, 'utf8').replace(/\r\n/g, '\n') : null;
  if (have === want) continue;
  if (check) { drift.push(dest); continue; }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, want);
  console.log(`wrote web/lib/careerfinder/${dest}`);
}
if (check) {
  if (drift.length) {
    console.error(`Career Finder web copies are out of date: ${drift.join(', ')}\nRun: node scripts/sync-career-finder-web.mjs`);
    process.exit(1);
  }
  console.log('Career Finder web copies match the app.');
}
