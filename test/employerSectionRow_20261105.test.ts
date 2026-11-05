// EmployerSection's chip rows must not be a component declared inside render.
// A new component identity on each render remounts every chip on each state
// change, so a screen-reader user loses focus on each chip tap.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync('src/screens/profile/EmployerSection.tsx', 'utf8').replace(/\r\n/g, '\n');

test('EmployerSection declares no capitalised Row component inside render', () => {
  assert.ok(!/const Row\s*=/.test(src), 'Row must be a plain render function, not a component');
  assert.ok(!/<Row[\s/>]/.test(src), 'Row must not be used as JSX');
});

test('EmployerSection calls row() for the three chip groups, in order', () => {
  const area = src.indexOf("{row('area', copy.areaHead, tax.areas)}");
  const role = src.indexOf("{row('role', copy.roleHead, tax.roles)}");
  const open = src.indexOf("{row('open_to', copy.offerHead, tax.openTo)}");
  assert.ok(area > -1 && role > area && open > role, 'all three rows drawn in the same order');
});

test('the render function keeps the same chip wiring', () => {
  assert.match(src, /const row = \(kind: Kind, title: string, items: \{ slug: string; label: string \}\[\]\) => \(/);
  assert.match(src, /onPress=\{\(\) => void toggle\(kind, i\.slug\)\}/);
  assert.match(src, /on=\{\(picked\[kind\] \?\? \[\]\)\.includes\(i\.slug\)\}/);
});

// The same guard test/accountEvening3_20261002.test.ts holds for the old <Row>
// spelling: a failed read of stored choices never offers chips.
test('the chips still draw only when the stored choices were read', () => {
  assert.match(src, /\{verified && tax && !interestsFailed \? \(\s*<>\s*\{row\('area'/);
  assert.equal((src.match(/\{row\('area'/g) ?? []).length, 1);
});
