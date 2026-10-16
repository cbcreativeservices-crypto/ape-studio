/**
 * Miking Labs — owner go 2026-10-15:
 *
 *   • THE PLAN STEPS ARE SHOWN AGAIN. The 2026-10-06 restructure served
 *     STARTING SETUPS with only the setting page's last step ("before any
 *     mic") and its signal path (`setupsKeep`); the plans of the stage, the
 *     studio and the neighbours were hidden. They were redrawn at true scale
 *     in the 10-10 art pass and are composed again, in the order written,
 *     after "what else the mic hears". They are explore steps: STARTING
 *     SETUPS' credit (its checks + every setup looked at) is unchanged, so a
 *     credited page stays credited and nothing new is required.
 *   • IDLE ZONES ARE NAMED. A suggested starting point no mic sits in is
 *     named on the glass, faintly, in the zones' blue, by the same level-of-
 *     detail layout as the part names (after them), at ≥ 9 pt.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { LESSONS } from '../src/screens/lab/miking/data/registry.ts';
import { lessonById } from '../src/screens/lab/miking/data/lessons.ts';
import { pageOf } from '../src/screens/lab/miking/engine/restructure.ts';
import { pageComplete } from '../src/screens/lab/miking/engine/progress/credit.ts';

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');

describe('STARTING SETUPS shows the setting page’s plan steps again', () => {
  it('the composed page keeps every setting step (no keep filter), and the hide rule is gone', () => {
    const screen = read('src/screens/lab/miking/MikingLessonScreen.tsx');
    assert.match(screen, /compose\('StartingSetups', \[\{ key: 'setups', Page: PSetups \}, \{ key: 'setting', Page: src\('setting'\) \}\]\)/);
    assert.doesNotMatch(screen, /setupsKeep/);
    assert.doesNotMatch(read('src/screens/lab/miking/engine/restructure.ts'), /export function setupsKeep/);
  });

  it('credit is unchanged: the checks and every setup looked at — the plans add no requirement', () => {
    for (const meta of LESSONS) {
      const lesson = lessonById(meta.id);
      if (!lesson) continue;
      const c = pageOf(lesson, 'setups').credit;
      if (lesson.pages.setups) continue; // written to the new journey: served as written
      assert.equal(c.interactive, 'setupsSeen', meta.id);
      const all = Object.fromEntries(c.scenarios.map((id) => [id, true]));
      assert.equal(pageComplete(lesson, 'setups', all, new Set(['setupsSeen'])), true, meta.id);
    }
  });

  it('the player’s-space label never shortens to the player’s own name', () => {
    for (const f of ['src/screens/lab/miking/lessons/shared/KitPlan.tsx', 'src/screens/lab/miking/lessons/shared/guitars/StagePlan.tsx', 'src/screens/lab/miking/lessons/shared/lutes/LutePlan.tsx']) {
      assert.doesNotMatch(read(f), /PLAYER’S SPACE', short: 'PLAYER'/, f);
    }
  });
});

describe('idle zones carry their names on the glass', () => {
  const src = read('src/screens/lab/miking/engine/scene/PlacementScene.tsx');
  it('named through the shared level-of-detail layout, after the part names, faint blue', () => {
    assert.match(src, /priority: 3 as const/);
    assert.match(src, /const ZONE_NAME = '#6fa8ffcc'/);
    assert.match(src, /tone === 'zone' \? ZONE_NAME/);
    assert.match(src, /layoutArtLabels\(art, view, variant, authoredBox, base, labelScale/);
  });
  it('only idle zones (no live mic in them), never a band too thin to see, never far from its band', () => {
    assert.match(src, /zones\.filter\(\(z\) => !inZone\.has\(z\.id\)\)/);
    assert.match(src, /ZONE_NAME_MIN_PX/);
    assert.match(src, /ZONE_LEADER_MAX_PX/);
  });
  it('drawn at the scene label size (9.5 pt × a scale of at least 1, through fitValue)', () => {
    assert.match(src, /const labelScale = Math\.max\(1, /);
    assert.match(src, /fontSize: 9\.5 \* scale, textAlign: align, color \}\]\} \{\.\.\.fitValue\(9\.5 \* scale\)\}/);
  });
});
