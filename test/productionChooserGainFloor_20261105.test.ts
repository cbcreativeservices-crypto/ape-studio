/**
 * Overnight bug group, 2026-11-05.
 *
 * (a) Pre/Post-Production home: + NEW PROJECT stayed open after DUPLICATE or
 *     DELETE changed the open project, and its text promised a chip that does
 *     not exist while there is only one project.
 * (b) Sound Systems gain pages: the HEADROOM figure was rounded to nearest, so
 *     11.5 to 11.99 dB printed "12 dB" beside orange, TIGHT and "Leave at least
 *     12 dB". The figure now rounds down; the comparison and the goals do not
 *     change. (gainDock.tsx imports react-native, so it is pinned from source.)
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { computeGainChain } from '../src/features/soundsystems/operate.ts';

const read = (p: string) => readFileSync(new URL('../' + p, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const LAB = read('src/screens/lab/production/ProductionLabScreen.tsx');
const DOCK = read('src/screens/lab/soundsystems/gainDock.tsx');

test('(a) a successful delete closes the chooser, a refused one leaves it', () => {
  const body = /const confirmDelete = useCallback[\s\S]*?\}, \[project, lab, reload\]\);/.exec(LAB)?.[0] ?? '';
  const refused = body.indexOf("notify('Not deleted'");
  const closes = body.indexOf('setChoosingType(false)');
  assert.ok(refused > 0, 'the refused branch is still there');
  assert.ok(closes > refused, 'closes after the refusal has returned');
});

test('(a) a successful duplicate closes the chooser, a refused one leaves it', () => {
  const body = /const duplicate = useLatchedPress\([\s\S]*?\n {2}\}\);/.exec(LAB)?.[0] ?? '';
  const refused = body.indexOf("notify('Not duplicated'");
  const closes = body.indexOf('setChoosingType(false)');
  assert.ok(refused > 0, 'the refused branch is still there');
  assert.ok(closes > refused, 'closes after the refusal has returned');
});

test('(a) the chooser text is true with one project: the chip comes with the new one', () => {
  const block = /\{choosingType \? \([\s\S]*?\{pathwayRows\}/.exec(LAB)?.[0].replace(/\s+/g, ' ') ?? '';
  assert.match(block, /once the new one starts, tap this project’s chip at the top to switch back/);
  assert.doesNotMatch(block, /its chip switches back to it/);
  // The promise depends on this: a second project is what makes the chips draw.
  assert.match(LAB, /projects\.length > 1\s*\n?\s*\? projects\.map/);
});

test('(b) both printed headroom figures round down, through one rule', () => {
  assert.match(DOCK, /const shownHeadroomDb = \(db: number\) => Math\.floor\(db\);/);
  assert.match(DOCK, /is only \$\{shownHeadroomDb\(least\)\} dB below its clip line/, 'the TIGHT sentence');
  assert.match(DOCK, /const least = shownHeadroomDb\(leastHeadroomDb\(chain\)\);/, 'the bezel');
  assert.doesNotMatch(DOCK, /Math\.round\(least/, 'no nearest-rounded headroom left');
});

test('(b) the comparison and the target stay on the exact value', () => {
  assert.match(DOCK, /export const HEADROOM_GOOD_DB = 12;/);
  assert.match(DOCK, /verdict === 'ok' && leastHeadroomDb\(chain\) < HEADROOM_GOOD_DB \? 'tight' : verdict/);
  assert.match(DOCK, /leastHeadroomDb\(chain\) >= HEADROOM_GOOD_DB \? colors\.green : colors\.orange/);
});

test('(b) rounding down keeps whole-dB chains as printed, and a shortfall below the target', () => {
  const floor = (db: number) => Math.floor(db);
  for (const db of [11.5, 11.75, 11.99]) assert.ok(floor(db) < 12, `${db} must not print as the target`);
  // The textbook settings land on whole dB, so what they print does not move.
  const least = (preamp: number) => Math.min(...computeGainChain({ preamp, fader: 0, main: 0, procIn: 0, procOut: 0 }).map((n) => n.headroomDb));
  assert.equal(floor(least(38)), 12);
  assert.equal(floor(least(40)), 10);
});
