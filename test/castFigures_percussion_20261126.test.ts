/**
 * CAST FIGURES — the percussion area (owner 2026-11-26: "fix the figures to our cast"). What was converted:
 *   • M04b Bongos, the KNEES setup: the player's legs (side and from above) were the old figure's trouser mass
 *     (FigureMass); they are now painted in the cast's approved look — the person who plays the hand drums on
 *     the lesson's Setting plan (Kofi), his trousers and shoes, by the figure's own paint (Form). The legs'
 *     outlines and boxes are unchanged (the old look stays for comparison behind `v2`).
 *   • I02 Cajón, the Setting plan: the guitarist beside the cajón was the old plan marker (an oval of shoulders
 *     and a head); the small-percussion station plan now asks HandPlan for the cast's plan marker (`v2`).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const L = join(process.cwd(), 'src', 'screens', 'lab', 'miking', 'lessons');
const read = (rel: string) => readFileSync(join(L, rel), 'utf8').replace(/\r\n/g, '\n');

test('M04b bongos: the knees legs are the cast member in the approved look', () => {
  const src = read('m04bBongos/art.tsx');
  assert.match(src, /export const V2 = figureV2On\('sidePlayers'\);/);
  assert.match(src, /export const BONGO_PLAYER = castFor\('plan\.handDrums'\);/);
  assert.match(src, /import \{ Form \} from '\.\.\/shared\/figureV2\/paint';/);
  // the new look paints each leg mass with the person's own trousers and shoes
  assert.match(src, /const \{ MAT, CLOTH \} = BONGO_PLAYER\.look;/);
  assert.match(src, /<Form key=\{i\} path=\{m\.path\} mat=\{m\.tone === 'shoe' \? MAT\.leather : CLOTH\} axis=\{m\.axis\} w=\{m\.w\} rim=\{4\} \/>/);
  // the legs' geometry is unchanged (the same outlines on the same boxes)
  assert.match(src, /path: limb\(\[hip, knee, ankle\], \[82, 62, 40\]\), tone: 'trousers'/);
  // the near leg stays a dashed phantom
  assert.match(src, /<DashPathEffect intervals=\{\[18, 12\]\} \/>/);
});

test('I02 cajón: the station plan draws its neighbor player as the cast marker', () => {
  const src = read('shared/smallperc/StationPlan.tsx');
  assert.match(src, /const PLAN_V2 = figureV2On\('familySmallPerc'\);/);
  assert.match(src, /<HandPlan [^>]*v2=\{PLAN_V2\} \/>/);
  // the only player neighbor on a small-percussion plan is I02's guitarist
  const cajon = read('i02Cajon/lesson.ts');
  assert.match(cajon, /\{ id: 'guitar', kind: 'player', u: -100, v: 1150, scene: 'all' \}/);
});
