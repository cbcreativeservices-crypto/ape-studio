/**
 * Gap G1 (S2/S3): STUDIO OR LIVE pages and C04 Meet.
 *
 * 1. PATTERN on every context page must change a picture that shows the shape
 *    at 375 wide: a corner inset on PolarCompare, in all five pages, with the
 *    caption naming it.
 * 2. AIM on a mic aimed steeply down or up: LEFT–RIGHT only spins it on its own
 *    axis, so the page starts on tilt and offers no chooser.
 * 3. C04 Meet, VIEW = LAP STEEL: one part, no PART control, and LOOKED AT counts
 *    the parts of this view.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { arrivalAngle, nearNull } from '../src/screens/lab/miking/engine/physics/polar.ts';
import { copyOf } from '../src/screens/lab/miking/engine/model/copy.ts';
import { compileScene, nearestClear } from '../src/screens/lab/miking/engine/geometry/collision.ts';
import { micBodyOf } from '../src/screens/lab/miking/engine/model/validate.ts';
import { micType } from '../src/screens/lab/miking/data/micTypes.ts';

const M = 'src/screens/lab/miking/';
const read = (f: string) => readFileSync(M + f, 'utf8').replace(/\r\n/g, '\n');

const PAGES = ['pages/PContext.tsx', 'lessons/shared/handdrums/pages/HContext.tsx', 'lessons/shared/hand/handPages.tsx', 'lessons/shared/electric/ampPages.tsx', 'lessons/spk/pages.tsx'];

for (const page of PAGES) {
  test(`${page}: the scene sits under the pattern inset, and the caption names it`, () => {
    const s = read(page);
    assert.match(s, /<PatternInset w=\{w\} h=\{h\} typeId=\{rig\.mics\[0\]\.typeId\} pattern=\{pattern\} view=\{view\}/);
    assert.match(s, /angle=\{live \? theta : 0\}/);
    assert.match(s, /\{\(sceneW\) => [\s\S]{0,40}<PlacementScene[\s\S]{0,120}w=\{sceneW\}/);
    assert.match(s, /badge: live \? `\$\{patternInsetBadge\(true[^`]*` : patternInsetBadge\(false\),/);
    assert.doesNotMatch(s, /A simplified pattern \(white dashed: shape, not range\)/);
  });
}

test('the inset is PolarCompare itself, read-only, and its words stay at 9 pt or more', () => {
  assert.ok(existsSync(M + 'engine/scene/PatternInset.tsx'));
  const s = read('engine/scene/PatternInset.tsx');
  assert.match(s, /import \{ PolarCompare \} from '\.\/PolarCompare'/);
  assert.match(s, /<PolarCompare w=\{inner\} h=\{tall\} typeId=\{typeId\} pattern=\{pattern\} angle=\{angle\}/);
  assert.match(s, /pointerEvents="none"/);
  assert.match(s, /const fs = Math\.max\(9, /);
  assert.doesNotMatch(s, /<(Canvas|Path)\b/);
  assert.doesNotMatch(s, /DualView/);
  assert.match(s, /Corner inset:/);
});

test('the caption names what amber is: the source itself when it is no monitor, and no monitor talk in STUDIO', () => {
  assert.match(read('engine/scene/PatternInset.tsx'), /amber = \$\{live \? source : 'test source'\}/);
  assert.match(read('pages/PContext.tsx'), /patternInsetBadge\(true, wedge\.glyph === 'none' \? wedge\.short : undefined\)/);
});

test('the inset never sits on the mic or the monitor: a clear corner, or else its own column', () => {
  const s = read('engine/scene/PatternInset.tsx');
  assert.match(s, /CORNERS\.find\(\(c\) => !covers\(c\)\) \?\? null/);
  assert.match(s, /children\(corner \? w : w - side - 8\)/);
});

const LESSONS = join('src/screens/lab/miking/lessons');
async function contextLessons() {
  const out: { id: string; lesson: any; X: any }[] = [];
  for (const d of readdirSync(LESSONS)) {
    const f = join(LESSONS, d, 'lesson.ts');
    if (!existsSync(f)) continue;
    let m: any;
    try {
      m = await import(pathToFileURL(join(process.cwd(), f)).href);
    } catch {
      continue;
    }
    const lesson: any = Object.values(m).find((v: any) => v && typeof v === 'object' && v.zones && v.live);
    if (!lesson) continue;
    let X: any = null;
    try {
      X = copyOf(lesson)?.context;
    } catch {
      X = null;
    }
    if (X?.patterns?.length) out.push({ id: lesson.id, lesson, X });
  }
  return out;
}

/** Where useRig really starts the mic: tilted clear of a part it would start
 *  inside. Tilt is tried before any move, and every case here clears on tilt,
 *  so wide-open bounds stand in for the lesson's own. */
const OPEN = { min: { x: -1e6, y: -1e6, z: -1e6 }, max: { x: 1e6, y: 1e6, z: 1e6 } };
function realStart({ lesson, X }: { lesson: any; X: any }) {
  const z = lesson.zones.find((q: any) => q.id === X.zone) ?? lesson.zones[0];
  const scene = compileScene(lesson.model, X.variant ?? lesson.model.defaultVariant);
  return nearestClear(scene, z.start, micBodyOf(micType(X.typeId)), OPEN as never) ?? z.start;
}

test('a steep start: LEFT–RIGHT is no aim at all on the marimba, and tilt reaches a null on every such lesson', async () => {
  const all = await contextLessons();
  const steep = all.filter((l) => Math.abs(realStart(l).el) >= 60);
  assert.ok(steep.length >= 8, `steep lessons found: ${steep.map((s) => s.id)}`);
  for (const l of steep) {
    const { id, lesson, X } = l;
    const start = realStart(l);
    const w = lesson.live.wedges.find((q: any) => q.id === X.target) ?? lesson.live.wedges[0];
    const src = { x: w.p.x, y: w.p.y - w.lift, z: w.p.z };
    let reach = false;
    for (const p of X.patterns) for (let d = -X.elMax; d <= X.elMax; d++) if (nearNull(p.id, arrivalAngle({ ...start, el: start.el + d }, src), 15)) reach = true;
    assert.ok(reach, `${id}: tilt reaches no null`);
  }
  const i08 = steep.find((s) => s.id === 'I08');
  assert.ok(i08);
  const z = i08.lesson.zones.find((q: any) => q.id === i08.X.zone);
  const w = i08.lesson.live.wedges.find((q: any) => q.id === i08.X.target) ?? i08.lesson.live.wedges[0];
  const src = { x: w.p.x, y: w.p.y - w.lift, z: w.p.z };
  const at = (d: { az?: number; el?: number }) => arrivalAngle({ ...z.start, az: z.start.az + (d.az ?? 0), el: z.start.el + (d.el ?? 0) }, src);
  assert.ok(Math.abs(at({ az: 40 }) - at({})) < 5, 'at el -80, 40 degrees of LEFT–RIGHT moves the arrival under 5 degrees');
  assert.ok(Math.abs(at({ el: 40 }) - at({})) > 25, 'tilt moves it well over 25 degrees');
});

test('C11: the zone says -70 but the long dynamic really starts tilted clear of the lid, so LEFT–RIGHT stays', async () => {
  const c11 = (await contextLessons()).find((l) => l.id === 'C11');
  assert.ok(c11);
  assert.ok(Math.abs(c11.lesson.zones.find((q: any) => q.id === c11.X.zone).start.el) >= 60, 'the zone alone reads as steep');
  assert.ok(Math.abs(realStart(c11).el) < 60, `the real start is ${realStart(c11).el}`);
});

test('PContext decides tilt from the real start, once, and leaves no chooser behind', () => {
  const s = read('pages/PContext.tsx');
  assert.match(s, /const TILT_ONLY_EL = 60;/);
  assert.match(s, /const \[tiltOnly\] = useState\(\(\) => Math\.abs\(rig\.mics\[0\]\.pose\.el\) >= TILT_ONLY_EL\);/);
  assert.doesNotMatch(s, /Math\.abs\(z\.start\.el\)/);
  assert.match(s, /useState<'az' \| 'el'>\(tiltOnly \? 'el' : 'az'\)/);
  assert.match(s, /\.\.\.\(tiltOnly\s+\? \{\}\s+: \{\s+chooser: \{/);
});

test('the shared hand page keeps the same rule for its own starting pose', () => {
  const s = read('lessons/shared/hand/handPages.tsx');
  assert.match(s, /const \[tiltOnly\] = useState\(\(\) => Math\.abs\(rig\.mics\[0\]\.pose\.el\) >= 60\);/);
  assert.match(s, /\.\.\.\(tiltOnly\s+\? \{\}\s+: \{\s+chooser: \{/);
});

test('C04 Meet: one part shows no PART control, and LOOKED AT counts this view', () => {
  const s = read('lessons/shared/electric/ampPages.tsx');
  assert.match(s, /const shown = parts\.find\(\(p\) => p\.id === partId\) \?\? \(parts\.length === 1 \? parts\[0\] : undefined\);/);
  assert.match(s, /\.\.\.\(parts\.length > 1\s+\? \[\s+tapsWhenFew\(/);
  assert.doesNotMatch(s, /\/ \$\{spec\.instParts\.length\}/);
  assert.match(s, /highlight=\{shown\?\.id \?\? null\}/);
  assert.match(s, /One part to look at in this view/);
});

test('the amp parts count only listed parts, so the count never passes its total', () => {
  const s = read('lessons/shared/electric/ampPages.tsx');
  assert.doesNotMatch(s, /aSeen\.size/);
});
