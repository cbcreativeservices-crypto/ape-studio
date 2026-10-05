/**
 * Miking Labs — M12 TONBAK and M13 TABLA. Real relationships only (charter
 * §9.2):
 *   • the tonbak is the wooden museum example's size (16 in long, a 10 in
 *     head); its waist and foot follow the brass example's proportions; the
 *     head faces the player's right, tilted up (a drawing default), and the
 *     lower opening is at the far end of the axis;
 *   • the tabla pair is the museum pair's largest extents; the black patch is
 *     CENTRED on the dayan and OFF-CENTRE toward the player on the bayan;
 *   • both lessons validate; every zone's start is clear of the drum, inside
 *     its zone and inside its drawn band, and outside the player's hands and
 *     body;
 *   • the checks follow the item-writing rules, the words name nobody from
 *     the research, the lessons are registered (each on its own line), and
 *     the tabla's sound page draws no plain-head vibration shapes.
 */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { itemRules, learnerStrings, RESEARCH_NAMES } from './_mikingItemRules.ts';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) {
      const candidate = new URL(specifier + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const ROOT = process.cwd();
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const tm = await import('../src/screens/lab/miking/lessons/m12Tonbak/model.ts');
const tg = await import('../src/screens/lab/miking/lessons/m12Tonbak/geometry.ts');
const am = await import('../src/screens/lab/miking/lessons/m13Tabla/model.ts');
const ag = await import('../src/screens/lab/miking/lessons/m13Tabla/geometry.ts');
const { M12_LESSON } = await import('../src/screens/lab/miking/lessons/m12Tonbak/lesson.ts');
const { M13_LESSON } = await import('../src/screens/lab/miking/lessons/m13Tabla/lesson.ts');
const { inPoly } = await import('../src/screens/lab/miking/lessons/shared/handGeom.ts');
const { MIC_TYPES } = await import('../src/screens/lab/miking/data/micTypes.ts');
const { validateLesson, micBodyOf } = await import('../src/screens/lab/miking/engine/model/validate.ts');
const { checkAssembly, compileScene } = await import('../src/screens/lab/miking/engine/geometry/collision.ts');
const { inZone } = await import('../src/screens/lab/miking/engine/geometry/zones.ts');
const { lessonById } = await import('../src/screens/lab/miking/data/lessons.ts');
const { LESSONS } = await import('../src/screens/lab/miking/data/registry.ts');

const IN = 25.4;
const near = (a: number, b: number, tol = 1e-6) => Math.abs(a - b) <= tol;
const len = (v: { x: number; y: number; z: number }) => Math.hypot(v.x, v.y, v.z);

describe('M12 tonbak: the drum is the museum example’s, the posture a drawing default', () => {
  const { TONBAK, T_LEN, T_R, radiusAt } = tm;
  it('16 in (406.4 mm) long with a 10 in (254 mm) head, sourced', () => {
    assert.ok(near(T_LEN, 16 * IN) && near(T_R * 2, 10 * IN));
    assert.equal(TONBAK.length.prov.kind, 'sourced');
    assert.equal(TONBAK.headD.prov.kind, 'sourced');
  });
  it('waist and foot follow the brass example’s 18.5 : 6.5 : 11.1, and the outline passes through them', () => {
    assert.ok(near(TONBAK.waistD.mm / TONBAK.headD.mm, 6.5 / 18.5));
    assert.ok(near(TONBAK.footD.mm / TONBAK.headD.mm, 11.1 / 18.5));
    assert.ok(near(radiusAt(0), T_R) && near(radiusAt(T_LEN), TONBAK.footD.mm / 2));
    assert.ok(near(radiusAt(TONBAK.waistAt.mm * T_LEN), TONBAK.waistD.mm / 2));
  });
  it('posture numbers are flagged placeholders (the owner checks them)', () => {
    for (const k of ['headHeight', 'tilt', 'openingD', 'waistAt'] as const) assert.equal(TONBAK[k].placeholder, true, k);
  });
  it('the head faces the player’s right, tilted up; the opening is at the far end of the axis', () => {
    const { T_H0, T_N, T_F } = tg;
    assert.ok(near(len(T_N), 1));
    assert.ok(T_N.z > 0.9 && T_N.y < 0, 'toward +z (the player’s right), tipped up (−y)');
    assert.ok(near(Math.asin(-T_N.y) * (180 / Math.PI), TONBAK.tilt.mm));
    assert.ok(near(len({ x: T_F.x - T_H0.x, y: T_F.y - T_H0.y, z: T_F.z - T_H0.z }), T_LEN));
    assert.ok(near(T_H0.y, -TONBAK.headHeight.mm));
    assert.ok(T_F.y < 0, 'the opening is above the floor');
  });
});

describe('M13 tabla: the pair’s sizes, and the patch centred on the dayan, off-centre on the bayan', () => {
  const { TABLA } = am;
  const { DAYAN, BAYAN } = ag;
  it('the museum pair’s largest extents: dayan 12¼ × 8 in, bayan 13½ × 10⅛ in', () => {
    assert.ok(near(TABLA.dayanH.mm, 12.25 * IN) && near(TABLA.dayanW.mm, 8 * IN));
    assert.ok(near(TABLA.bayanH.mm, 13.5 * IN) && near(TABLA.bayanW.mm, 10.125 * IN));
    assert.ok(near(DAYAN.height, TABLA.dayanH.mm) && near(BAYAN.maxR * 2, TABLA.bayanW.mm));
    assert.ok(DAYAN.headR * 2 < TABLA.dayanW.mm && BAYAN.headR * 2 < TABLA.bayanW.mm, 'each head fits within its drum');
  });
  it('the dayan’s patch is CENTRED', () => {
    assert.ok(near(len({ x: DAYAN.patchC.x - DAYAN.H.x, y: DAYAN.patchC.y - DAYAN.H.y, z: DAYAN.patchC.z - DAYAN.H.z }), 0));
  });
  it('the bayan’s patch is OFF-CENTRE, toward the player, inside the head', () => {
    const d = { x: BAYAN.patchC.x - BAYAN.H.x, y: BAYAN.patchC.y - BAYAN.H.y, z: BAYAN.patchC.z - BAYAN.H.z };
    assert.ok(near(len(d), BAYAN.headR * TABLA.bayanOffset.mm));
    assert.ok(d.x < 0, 'toward the player (−x)');
    assert.ok(near(d.x * BAYAN.u.x + d.y * BAYAN.u.y + d.z * BAYAN.u.z, 0), 'in the head’s plane');
    assert.ok(len(d) + BAYAN.patchR < BAYAN.headR);
  });
  it('right-handed layout (a drawing default): the dayan to the player’s right, the bayan to the left; both heads tilt toward the audience', () => {
    assert.ok(DAYAN.H.z > 0 && BAYAN.H.z < 0);
    assert.ok(DAYAN.u.x > 0 && BAYAN.u.x > 0 && DAYAN.u.y < 0 && BAYAN.u.y < 0);
    for (const k of ['dayanHeadD', 'bayanHeadD', 'dayanPatch', 'bayanPatch', 'bayanOffset', 'ringH', 'dayanTilt', 'bayanTilt', 'dayanZ', 'bayanZ'] as const) assert.equal(TABLA[k].placeholder, true, k);
  });
});

describe('M12 + M13: the lessons validate; every start is clear, in its zone and in its drawn band', () => {
  for (const lesson of [M12_LESSON, M13_LESSON]) {
    it(`${lesson.id}: validateLesson is clean`, () => assert.deepEqual(validateLesson(lesson, MIC_TYPES), []));
    it(`${lesson.id}: each start is clear of the drum, inside its zone, inside both drawn bands, and outside the player`, () => {
      const m = lesson.model;
      const scene = compileScene(m, m.defaultVariant);
      for (const z of lesson.zones) {
        const t = z.requires?.micTypeIds?.[0] ?? lesson.micTypeIds[0];
        assert.equal(checkAssembly(scene, z.start, micBodyOf(MIC_TYPES[t])), null, z.id);
        assert.ok(inZone(z, { scene, surfaces: m.surfaces, lines: m.lines, variant: m.defaultVariant, micTypeId: t, mount: 'stand' }, z.start), z.id);
        const p = z.start.p;
        assert.ok(z.draw?.side?.some((d) => inPoly(d.poly, p.x, p.y)), `${z.id}: side band`);
        assert.ok(z.draw?.top?.some((d) => inPoly(d.poly, p.x, p.z)), `${z.id}: top band`);
        for (const e of m.envelopes) {
          const b = e.shape as { kind: 'box'; min: typeof p; max: typeof p };
          const inside = p.x > b.min.x && p.x < b.max.x && p.y > b.min.y && p.y < b.max.y && p.z > b.min.z && p.z < b.max.z;
          assert.ok(!inside, `${z.id}: inside ${e.id}`);
        }
      }
    });
    it(`${lesson.id}: six quick-check items, at least one critical`, () => {
      assert.equal(lesson.diagnostic.length, 6);
      assert.ok(lesson.diagnostic.some((q) => q.critical));
    });
  }
  it('the tabla’s close zones are the 3–4 in session distance; the others are the lesson’s own trials', () => {
    for (const id of ['ta.dayan.close', 'ta.bayan.close']) {
      const z = M13_LESSON.zones.find((q) => q.id === id)!;
      assert.ok(near(z.distance.min, 3 * IN) && near(z.distance.max, 4 * IN) && z.kind === 'sourced', id);
    }
    for (const z of M13_LESSON.zones.filter((q) => !q.id.endsWith('.close'))) assert.equal(z.kind, 'trial', z.id);
    for (const z of M12_LESSON.zones) assert.equal(z.kind, 'trial', z.id);
  });
});

describe('M12 + M13: the checks, the words, the registration', () => {
  for (const lesson of [M12_LESSON, M13_LESSON]) {
    it(`${lesson.id}: item-writing rules (LESSON_JOURNEY §5)`, () => itemRules(lesson));
    it(`${lesson.id}: no maker, model or person from the research in learner text`, () => {
      assert.deepEqual(learnerStrings(lesson).filter((t) => RESEARCH_NAMES.test(t)), []);
    });
  }
  it('no research name in the hand-drum pages', () => {
    for (const f of ['lessons/m12Tonbak/pages.tsx', 'lessons/m13Tabla/pages.tsx', 'lessons/m13Tabla/TablaHeads.tsx', 'lessons/shared/hand/handPages.tsx', 'lessons/shared/hand/HandPlan.tsx', 'lessons/shared/hand/HandStrike.tsx']) {
      const text = read(`src/screens/lab/miking/${f}`).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
      assert.deepEqual(text.split('\n').filter((l) => RESEARCH_NAMES.test(l)), [], f);
    }
  });
  it('the tabla’s sound page draws no plain-head vibration shapes (a loaded head does not follow them)', () => {
    assert.doesNotMatch(read('src/screens/lab/miking/lessons/m13Tabla/pages.tsx'), /MembraneFace|HEAD_SHAPES/);
  });
  it('registered in Lab 1, each on its own line, after the speaker module', () => {
    const ids = LESSONS.map((l: { id: string }) => l.id);
    assert.ok(ids.indexOf('M12') > ids.indexOf('SPK') && ids.indexOf('M13') === ids.indexOf('M12') + 1);
    assert.equal(LESSONS.find((l: { id: string }) => l.id === 'M12')!.labId, 'drums');
    assert.equal(lessonById('M12'), M12_LESSON);
    assert.equal(lessonById('M13'), M13_LESSON);
    const reg = read('src/screens/lab/miking/data/registry.ts');
    assert.match(reg, /\n  \{ id: 'M12', [^\n]*\},\n/);
    assert.match(reg, /\n  \{ id: 'M13', [^\n]*\},\n/);
    const art = read('src/screens/lab/miking/data/lessonArt.ts');
    assert.match(art, /\nART\.M12 = \{[^\n]*pages: TONBAK_PAGES \};\n/);
    assert.match(art, /\nART\.M13 = \{[^\n]*pages: TABLA_PAGES \};\n/);
  });
});
