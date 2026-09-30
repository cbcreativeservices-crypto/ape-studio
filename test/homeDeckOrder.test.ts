/**
 * Owner 2026-09-30: Calculators get their own Home card between Tools and
 * Glossary (purple frame); Career Finder its own card between Glossary and
 * Start Here (green frame). The lab card's headline reads "Start Interactive
 * Laboratories".
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const home = readFileSync('src/screens/courses/CourseSelectionScreen.tsx', 'utf8');

test('fixed deck order: lab, tools, calculators, glossary, careerFinder, startHere', () => {
  const order = ['lab', 'tools', 'calculators', 'glossary', 'careerFinder', 'startHere'].map((k) =>
    home.indexOf(`{ kind: '${k}', id: '${k}' }`),
  );
  assert.ok(order.every((i) => i > 0), 'every fixed card is in the deck');
  for (let i = 1; i < order.length; i++) assert.ok(order[i] > order[i - 1], 'in order');
});

test('frames, routes and the lab headline', () => {
  assert.match(home, /const border = calc \? 'rgba\(150,90,220,\.6\)' : 'rgba\(55,224,95,\.6\)'/);
  assert.match(home, /navigate\('CalcLab'\)/);
  assert.match(home, /navigate\('CareerFinder'\)/);
  assert.match(home, /return 'Start Interactive Laboratories';/);
  assert.match(home, /c\.kind === 'calculators' \|\|/); // survives a member's custom deck
});
