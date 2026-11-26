/**
 * CAST FIGURES — the percussion area (owner 2026-11-26: "fix the figures to our cast"). What was converted:
 *   • M04b Bongos, the KNEES setup: the player's legs (side and from above) were the old figure's trouser mass
 *     (FigureMass); they are now painted in the cast's approved look — the person who plays the hand drums on
 *     the lesson's Setting plan (Kofi), his trousers and shoes, by the figure's own paint (Form). The legs'
 *     outlines and boxes are unchanged (the old look stays for comparison behind `v2`).
 *   • I02 Cajón, the Setting plan: the guitarist beside the cajón was the old plan marker (an oval of shoulders
 *     and a head); the small-percussion station plan now asks HandPlan for the cast's plan marker (`v2`).
 *   • (owner ruling 2026-11-26) that guitarist now HOLDS an acoustic guitar: the thing's `holds: 'aguitar'` draws
 *     the guitar family's own seated C01 player and steel-string guitar from above, on the C01 plan's chair, at
 *     the same point and facing; no other plan player changes.
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
  assert.match(cajon, /\{ id: 'guitar', kind: 'player', u: -100, v: 1150, scene: 'all', holds: 'aguitar' \}/);
});

test('I02 cajón: the guitarist holds an acoustic guitar (owner ruling 2026-11-26), reused, and only I02 changes', () => {
  // the thing's optional field; I02's guitarist is the only thing that sets it
  assert.match(read('shared/handdrums/family.ts'), /holds\?: 'aguitar';/);
  const cajon = read('i02Cajon/lesson.ts');
  assert.equal((cajon.match(/holds: 'aguitar'/g) ?? []).length, 1);
  // the same place and facing: the person stays at u −100, v 1150
  assert.match(cajon, /\{ id: 'guitar', kind: 'player', u: -100, v: 1150, scene: 'all', holds: 'aguitar' \}/);
  const plan = read('shared/handdrums/HandPlan.tsx');
  // the drawing is REUSED: C01's own seated steel-string player from above in the approved look, on the C01 plan's chair
  assert.match(plan, /import \{ GuitarSceneArt \} from '\.\.\/guitars\/GuitarArt';/);
  assert.match(plan, /import \{ ChairPlan, type PlanObject \} from '\.\.\/guitars\/StagePlan';/);
  assert.match(plan, /import \{ C01_VARIANTS \} from '\.\.\/\.\.\/c01Guitar\/model\.ts';/);
  assert.match(plan, /sceneOf\(C01_VARIANTS\.find\(\(x\) => x\.id === 'steel'\) \?\? C01_VARIANTS\[0\]\)/);
  assert.match(plan, /<ChairPlan o=\{chair\} hi=\{false\} \/>\s*<GuitarSceneArt sc=\{sc\} view="top" v2 assumePtPerMm=\{ptPerMm\} \/>/);
  // the head at the marker's point, a quarter turn so the player faces +u (the marker's facing), the neck to −v
  assert.match(plan, /\{ translateX: u \}, \{ translateY: v \}, \{ rotate: -Math\.PI \/ 2 \}, \{ translateX: -F\.head\.x \}, \{ translateY: -F\.head\.z \}/);
  // only a thing that holds the guitar takes this branch; every other plan player draws exactly as before
  assert.match(plan, /if \(v2 && t\.holds === 'aguitar'\) return <AcousticGuitaristTop u=\{t\.u\} v=\{t\.v\} ptPerMm=\{ptPerMm\} \/>;\s*if \(v2\)\s+return <PlayerTopV2 player=\{handDrumPlayer\(t\.u, t\.v\)\} who=\{who \?\? castFor\('plan\.handDrums'\)\} \/>;/);
  // its name goes round what is drawn, and the person and chair keep other words off; in a studio the floor feeds
  // run under the held neck and his own headphones are drawn over him
  assert.match(plan, /const held = v2 \? shown\.filter\(\(t\) => t\.kind === 'player' && t\.holds === 'aguitar'\) : \[\];/);
  assert.match(plan, /rig && held\.includes\(t\) \? null :/);
  // the only drawing change outside this folder is an `export` on the guitar plan's chair
  assert.match(read('shared/guitars/StagePlan.tsx'), /^export function ChairPlan\(\{ o, hi \}: \{ o: PlanObject; hi: boolean \}\) \{$/m);
});

test('I02 cajón: the guitarist is the guitar family\'s player (Kofi), never the cajón player on the same plan', () => {
  const cast = read('shared/figureV2/cast.ts');
  const role = (k: string) => cast.match(new RegExp(`'${k.replace('.', '\\.')}': '(\\w+)'`))?.[1];
  assert.equal(role('player.guitar'), 'kofi');
  assert.notEqual(role('player.guitar'), role('player.cajon'));
  // the same person the plan's marker already used
  assert.equal(role('player.guitar'), role('plan.handDrums'));
  // the guitar family's player is chosen by the scene's instrument (no lesson cast for C01's steel body)
  assert.match(read('shared/guitars/guitarSceneV2.tsx'), /: 'player\.guitar';/);
});
