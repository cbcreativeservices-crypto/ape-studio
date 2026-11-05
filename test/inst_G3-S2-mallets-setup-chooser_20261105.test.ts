/**
 * G3-S2 (2026-11-05). HOW IT SOUNDS on the mallet keyboards: SETUP sat on the
 * strike and tube steps, but those pictures draw one bar and its tube, and the
 * vibraphone's WITH MOTOR and NO MOTOR share both. On I07 the picture stayed
 * frozen while only the words of stages 3 and 4 moved. SETUP now rides on a step
 * only when the variants really draw differently, which is run here on the real
 * lesson geometry. The words keep following the setup picked on the parts step.
 *
 * That holds bar by bar. Each display frames its own bar, so the same note on two
 * setups lands on the same pixels whatever its place on the keyboard: the tube step
 * offers SETUP only where the picture would move by a point or more.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const R = <T,>(m: T): T => ((m as { default?: T }).default ?? m);
const { setupRedraws, midBarOf } = R(await import('../src/screens/lab/miking/lessons/shared/mallets/MSound.tsx'));
const { malletGeom } = R(await import('../src/screens/lab/miking/lessons/shared/mallets/malletModel.ts'));
const { VIBE_FAM } = R(await import('../src/screens/lab/miking/lessons/i07Vibraphone/model.ts'));
const { MARIMBA_FAM } = R(await import('../src/screens/lab/miking/lessons/i08Marimba/model.ts'));
const { XYLO_FAM } = R(await import('../src/screens/lab/miking/lessons/i09Xylophone/model.ts'));
const { GLOCK_FAM } = R(await import('../src/screens/lab/miking/lessons/i10Glockenspiel/model.ts'));
const { lessonById } = R(await import('../src/screens/lab/miking/data/lessons.ts'));

type L = { bars: { key: number }[] };
const barAt = (key: number) => (x: L) => x.bars.find((b) => b.key === key) ?? x.bars[0];
const allKeys = (G: { layouts: Record<string, L> }) => [...new Set(Object.values(G.layouts).flatMap((x) => x.bars.map((b) => b.key)))];

test('I07: WITH MOTOR and NO MOTOR draw the same bar and tube, so neither step offers SETUP', () => {
  const G = malletGeom(VIBE_FAM);
  assert.equal(setupRedraws(G, midBarOf), false, 'strike step');
  for (const key of allKeys(G)) assert.equal(setupRedraws(G, barAt(key)), false, `tube step, bar ${key}`);
});

test('I10: the variants draw differently, so both steps keep SETUP', () => {
  const G = malletGeom(GLOCK_FAM);
  assert.equal(setupRedraws(G, midBarOf), true, 'strike step');
  for (const key of allKeys(G)) assert.equal(setupRedraws(G, barAt(key)), true, `tube step, bar ${key}`);
});

test('I08: the strike step keeps SETUP; the tube step keeps it only on the low bars 4.3 octaves does not have', () => {
  const G = malletGeom(MARIMBA_FAM);
  assert.equal(setupRedraws(G, midBarOf), true, 'strike step');
  const offered = allKeys(G).filter((key) => setupRedraws(G, barAt(key)));
  assert.deepEqual(offered.sort((a, b) => a - b), [16, 17, 18, 19, 20, 21, 22, 23, 24], 'A2 up is the same bar and pipe on both');
});

test('I09: the strike step keeps SETUP; the tube step drops it only on the top bars both setups draw alike', () => {
  const G = malletGeom(XYLO_FAM);
  assert.equal(setupRedraws(G, midBarOf), true, 'strike step');
  const alike = allKeys(G).filter((key) => !setupRedraws(G, barAt(key)));
  assert.deepEqual(alike.sort((a, b) => a - b), [83, 84, 85, 87, 88], 'same bar length; the pipes differ by less than a point');
  assert.equal(setupRedraws(G, barAt(86)), true, 'bar 86 has a pipe on one setup only');
});

test('a variant that differs only in what cannot be seen does not count as a change', () => {
  const G = malletGeom(VIBE_FAM);
  const [a, b] = Object.keys(G.layouts);
  const moved = { ...G.layouts[b], naturals: G.layouts[b].naturals.map((n: { x: number }) => ({ ...n, x: n.x + 500 })) };
  assert.equal(setupRedraws({ ...G, layouts: { [a]: G.layouts[a], [b]: moved } }, midBarOf), false);
});

test('a real change to a damper, a case or a tube does count', () => {
  const G = malletGeom(VIBE_FAM);
  const [a, b] = Object.keys(G.layouts);
  assert.equal(setupRedraws({ ...G, extras: { ...G.extras, [b]: {} } }, midBarOf), true, 'no damper');
  assert.equal(setupRedraws({ ...G, layouts: { [a]: G.layouts[a], [b]: { ...G.layouts[b], row: { ...G.layouts[b].row, stand: 'case' } } } }, midBarOf), true, 'a case');
  assert.equal(setupRedraws({ ...G, layouts: { [a]: G.layouts[a], [b]: { ...G.layouts[b], tubes: [] } } }, midBarOf), true, 'no tube');
});

test('the steps ask before offering SETUP, and the words still follow the chosen setup', () => {
  const src = readFileSync(new URL('../src/screens/lab/miking/lessons/shared/mallets/MSound.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
  assert.equal(/^\s*setupParam,\s*$/m.test(src), false, 'SETUP is never added without the comparison');
  assert.equal((src.match(/setupRedraws\(G, [^\n]*\? \[setupParam\] : \[\]\)/g) ?? []).length, 2, 'both steps compare');
  assert.match(src, /const stageText = \(i: number\) => W\.stages\[i\]\.byVariant\?\.\[v\] \?\? W\.stages\[i\]\.text;/);
  const stages = lessonById('I07').mallet.sound.stages as { byVariant?: Record<string, string> }[];
  const moved = stages.filter((s) => s.byVariant?.nomotor);
  assert.equal(moved.length, 2, 'stages 3 and 4 of I07 have words of their own for NO MOTOR');
});
