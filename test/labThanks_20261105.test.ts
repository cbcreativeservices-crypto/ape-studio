/**
 * The first-lab-exit thank-you (owner 2026-11-05): fires on a backward exit
 * from any lab, never on the way deeper, and once per device.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const SRC = read('src/features/lab/labThanks.ts');

// The pure rule, lifted out of the module so the test needs no React Native.
const body = SRC.slice(SRC.indexOf('export function leftLabBackward'), SRC.indexOf('let claiming'))
  .replace('export ', '')
  .replace(/prev: StackState \| null \| undefined/, 'prev')
  .replace(/next: StackState/, 'next')
  .replace(/isLab: \(route: string\) => boolean/, 'isLab')
  .replace('): boolean {', ') {');
const leftLabBackward = new Function(`${body}; return leftLabBackward;`)() as (
  p: unknown,
  n: unknown,
  isLab: (r: string) => boolean,
) => boolean;

const isLab = (r: string) => r.endsWith('Lab') || r === 'MikingHub' || r === 'MikingLesson';
const st = (...names: string[]) => ({ index: names.length - 1, routes: names.map((n, i) => ({ key: `${n}-${i}`, name: n })) });

test('a pop from a lab back to the app says thank you', () => {
  assert.equal(leftLabBackward(st('Main', 'EqLab'), st('Main'), isLab), true);
  assert.equal(leftLabBackward(st('Main', 'MikingHub', 'MikingLesson'), st('Main'), isLab), true);
});

test('going deeper, or staying inside a lab, does not', () => {
  assert.equal(leftLabBackward(st('Main'), st('Main', 'EqLab'), isLab), false, 'opening a lab');
  assert.equal(leftLabBackward(st('Main', 'EqLab'), st('Main', 'EqLab', 'Paywall'), isLab), false, 'the paywall on top');
  assert.equal(leftLabBackward(st('Main', 'MikingHub', 'MikingLesson'), st('Main', 'MikingHub'), isLab), false, 'lesson to hub');
  assert.equal(leftLabBackward(st('Main', 'Settings'), st('Main'), isLab), false, 'not a lab');
  assert.equal(leftLabBackward(null, st('Main'), isLab), false, 'first state');
  const s = st('Main');
  assert.equal(leftLabBackward(s, s, isLab), false, 'the same state twice');
});

test('every lab is covered by the catalog list, not a list of its own', () => {
  assert.match(SRC, /labRouteName\(route\) !== undefined/);
  assert.match(read('src/navigation/RootNavigator.tsx'), /screenListeners=\{ROOT_LISTENERS\}/);
});

test('once per device, through a guest wipe and a sign-out', () => {
  const wipe = read('src/features/account/clearLocalAccountData.ts');
  assert.equal(wipe.match(/'ape:labThanksShown'/g)?.length, 2, 'on both KEEP and GUEST_KEEP');
});

test('the words the owner asked for are on it', () => {
  assert.match(SRC, /one of our very first users/);
  assert.match(SRC, /your support and your understanding/);
  assert.match(SRC, /more and more labs, subjects and technology/);
  assert.doesNotMatch(SRC, /\btopics\b/i, 'owner 2026-11-05: we are not adding more of them');
});
