/**
 * ONE NAME for the Study screen: "Study Dashboard" (owner 2026-10-27). The
 * screen's header says it (not the app's name), and learner-facing text no
 * longer calls it "the dashboard", "your Dashboard" or "the study deck".
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const read = (p: string) => readFileSync(join(root, p), 'utf8').replace(/\r\n/g, '\n');

test('the Study screen header shows its own title', () => {
  assert.match(read('src/screens/dashboard/DashboardScreen.tsx'), /<AppHeader[\s\S]{0,200}title=\{\['Study', 'Dashboard'\]\}/);
  assert.match(read('src/components/AppHeader.tsx'), /title \? \(/);
});

test('no learner-facing string calls it anything else', () => {
  const bad: string[] = [];
  const walk = (dir: string) => {
    for (const n of readdirSync(join(root, dir))) {
      const rel = join(dir, n);
      if (statSync(join(root, rel)).isDirectory()) walk(rel);
      else if (/\.tsx?$/.test(n)) {
        const code = read(rel).replace(/\/\*[\s\S]*?\*\//g, '').split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
        for (const m of code.matchAll(/'[^'\n]*'|"[^"\n]*"|`[^`]*`/g)) {
          const s = m[0];
          if (/\b(your|the|to|from) [Dd]ashboard\b|\bstudy deck\b(?! \w+ glossary)|\bstudy dashboard\b|Study dashboard\b/.test(s) && !/Study Dashboard|Enrollments Dashboard/.test(s.replace(/\b(your|the|to|from) Study Dashboard/g, ''))) {
            if (/(This is your|Your) own study deck/.test(s)) continue; // My Custom List = a deck of flashcards, not this screen
            bad.push(`${rel}: ${s.slice(0, 90)}`);
          }
        }
      }
    }
  };
  walk('src');
  assert.deepEqual(bad, []);
});
