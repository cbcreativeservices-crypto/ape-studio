/**
 * Function audit 2026-11-05, decisions 11 and 12, Microphones step 1.
 *   11  TYPE = parabolic dish draws the dish, and stops reading NOT DRAWN,
 *       without claiming a pattern the app does not model.
 *   12  On a site-sized drawing a small read-only box shows the chosen mic's
 *       own body, so TYPE can be seen.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isModelled } from '../src/screens/lab/miking/engine/physics/polar.ts';
import { SPORTS_MIC_TYPES } from '../src/screens/lab/miking/lessons/shared/sports/sportsMics.ts';
import { FIELD2_MIC_TYPES } from '../src/screens/lab/miking/lessons/shared/field/dishMics.ts';

const DIR = join(process.cwd(), 'src/screens/lab/miking');
const read = (f: string) => readFileSync(join(DIR, f), 'utf8').replace(/\r\n/g, '\n');
const onIt = read('pages/PMicOnIt.tsx');
const mic = read('pages/PMicrophone.tsx');
const stage = read('engine/scene/SetupStage.tsx');
const closeUp = read('engine/scene/MicCloseUp.tsx');
const micTypesOf = (f: string) => /micTypeIds: \[([^\]]*)\]/.exec(read(f))?.[1] ?? '';

describe('decision 11: the dish is drawn and named honestly', () => {
  it('both dishes are types with no modelled pattern, so a readout must not name one', () => {
    for (const t of [SPORTS_MIC_TYPES.spDish, FIELD2_MIC_TYPES.dishMic]) {
      assert.equal(t.patterns.length, 1);
      assert.equal(isModelled(t.patterns[0].id), false, t.id);
    }
  });

  it('the lessons offering a dish are the ones the type check covers', () => {
    assert.match(micTypesOf('lessons/b13FieldDiamond/lesson.ts'), /'spDish'/);
    assert.match(micTypesOf('lessons/b12Parabolic/lesson.ts'), /'spDish'/);
    assert.match(micTypesOf('lessons/f07Wildlife/lesson.ts'), /'dishMic'/);
    assert.doesNotMatch(micTypesOf('lessons/b14CourtIce/lesson.ts'), /[dD]ish/);
    assert.match(closeUp, /isDishType = .*t\.art === 'dish' \|\| t\.id === 'spDish'/);
  });

  it('the readout word is BY PITCH for a dish and NOT DRAWN for the rest', () => {
    const fn = /export function patternReadout[\s\S]*?\n\}/.exec(mic)?.[0] ?? '';
    assert.match(fn, /isModelled\(p\)\) return p\.toUpperCase\(\)/);
    assert.match(fn, /isDishType\(m\) \? 'BY PITCH' : 'NOT DRAWN'/);
  });

  it('no bezel or dock key on either page spells NOT DRAWN past that one word', () => {
    assert.ok(!onIt.includes('NOT DRAWN'), 'PMicOnIt');
    assert.equal(mic.split("'NOT DRAWN'").length - 1, 1, 'PMicrophone');
    for (const src of [onIt, mic]) {
      assert.match(src, /k: 'PATTERN', v: patternReadout\(t, pat\)/);
      assert.match(src, /valueLabel: \(isModelled\(pat\) \? pat : patternReadout\(t, pat\)\)/);
    }
  });

  it('the words under the dish say the pickup changes with pitch, not a pattern', () => {
    assert.match(mic, /isDishType\(m\)\s*\? 'Pattern: none fixed — the dish narrows as the pitch rises'/);
    assert.match(mic, /isDishType\(t\) \? 'changes with pitch' : 'not drawn'/);
    assert.match(mic, /A dish narrows as the pitch rises, so it has no one shape and no lobe is drawn\./);
  });

  it('the stage draws the sports dish at its pose through the art, so it frames and pinches with the scene', () => {
    assert.match(stage, /typeId === 'spDish'\)\?\.pose/);
    assert.match(stage, /<DishMark pose=\{dishPose\} view=\{p\.view\}/);
    assert.match(stage, /art=\{stageArt\}/);
    assert.match(stage, /return \{ \.\.\.art, Instrument \}/);
  });

  it('the dish is the lessons’ own art, reused and not redrawn', () => {
    assert.match(closeUp, /import \{ DishSection \} from '\.\.\/\.\.\/lessons\/shared\/sports\/DishArt'/);
    assert.ok(closeUp.split('<DishSection').length - 1 === 2, 'the close-up and the stage mark');
    assert.doesNotMatch(closeUp, /Skia\.Path|<Path\b/);
  });
});

describe('decision 12: the chosen mic close up', () => {
  it('Microphones step 1 asks for the box, under the scene and not over it', () => {
    assert.match(onIt, /<SetupStage [^>]*\bcloseUp\b/);
    assert.match(stage, /const stageH = strip \? h - CLOSE_UP_H : h;/);
    assert.match(stage, /h=\{stageH\}/);
    assert.match(stage, /strip \? <MicCloseUp type=\{micType\(/);
  });

  it('it is decided on the lesson’s longest mic, so it does not come and go with TYPE', () => {
    assert.match(stage, /Math\.max\(\.\.\.lesson\.micTypeIds\.map/);
    assert.match(stage, /< CLOSE_UP_BELOW_PT/);
  });

  it('a type with no starting point still shows its body', () => {
    const missing = onIt.indexOf('This mic type has no starting point');
    assert.ok(missing > 0);
    assert.match(onIt.slice(missing, missing + 200), /<MicCloseUp type=\{t\} w=\{w\} \/>/);
  });

  it('it uses the engine’s mic art, holds no control, and says it is not to scale', () => {
    assert.match(closeUp, /<MikingMicArt art=\{b\.art\}/);
    assert.doesNotMatch(closeUp, /Pressable|onPress|Touchable|Gesture/);
    assert.match(closeUp, /CLOSE-UP · NOT TO SCALE/);
  });

  it('its words stay at 9 pt or more', () => {
    const sizes = [...closeUp.matchAll(/fontSize: Math\.max\((\d+)/g)].map((m) => Number(m[1]));
    assert.equal(sizes.length, 2);
    assert.ok(sizes.every((s) => s >= 9), String(sizes));
    assert.doesNotMatch(closeUp, /numberOfLines/);
  });

  it('a lavalier is framed on its clip and cable, so it stays in the box', () => {
    assert.match(closeUp, /t\.art === 'lavalier'\) return \{ .*cross: r \* 2\.9, fore: 0, tail: r \* 10 \}/);
    assert.match(closeUp, /const along = b\.len \+ b\.tail \+ b\.fore;/);
  });

  it('the shared display PolarCompare is left to its own run', () => {
    assert.ok(!read('engine/scene/PolarCompare.tsx').includes('MicCloseUp'));
  });

  it('the miking source says learner', () => {
    for (const src of [closeUp, onIt, stage]) assert.doesNotMatch(src, /student/i);
  });
});
