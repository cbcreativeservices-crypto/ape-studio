/**
 * Batch 3, G3-S2 (2026-11-05). Placement Studio's first step, the worked example:
 * the STEP slider moved only a text card and the bezel's marker on F06, F07, B08,
 * B12 and B13. A student has to SEE each piece on the drawing, so every piece
 * must now mark something, at a size that reads on a 20 m site, and the next
 * piece must mark something else. The pure rules are run on the real lesson data.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { join } from 'node:path';
import { test } from 'node:test';
import { guideFor } from '../src/screens/lab/miking/engine/geometry/guides.ts';
import type { InstrumentModel, RefLine, Shape3, Vec3 } from '../src/screens/lab/miking/engine/model/types.ts';
import { F06_MODEL } from '../src/screens/lab/miking/lessons/f06Ambience/geometry.ts';
import { F06_ZONES } from '../src/screens/lab/miking/lessons/f06Ambience/model.ts';
import { F07_MODEL } from '../src/screens/lab/miking/lessons/f07Wildlife/geometry.ts';
import { STUDIO, STUDIO_SCENE } from '../src/screens/lab/miking/lessons/shared/broadcast/venue.ts';
import { PF, PF_ARC, PRACTICE_CROWD, PRACTICE_FIELD, PRACTICE_LINE, PRACTICE_SMALL } from '../src/screens/lab/miking/lessons/shared/sports/practiceScenes.ts';
import type { P2, VenueScene } from '../src/screens/lab/miking/lessons/shared/sports/venuePlan.ts';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const read = (p: string) => readFileSync(join(root, p), 'utf8').replace(/\r\n/g, '\n');
const PLACEMENT = read('src/screens/lab/miking/pages/PPlacement.tsx');
const SPORTS = read('src/screens/lab/miking/lessons/shared/sports/sportsPages.tsx');

const region = (src: string, from: string, to: string) => {
  const a = src.indexOf(from);
  const b = src.indexOf(to, a);
  assert.ok(a >= 0 && b > a, `${from} is defined`);
  return stripTypeScriptTypes(src.slice(a, b).replace(/^export /gm, ''));
};

type Mark = { showZones: boolean; guides: boolean; highlight: string | null; pathsFrom: Vec3 | null; label: { text: string; at: Vec3 } | null };
type Ctx = { mic: Vec3; head: string; headPart: string | null; guide: ReturnType<typeof guideFor> | null; line: { label: string; foot: Vec3 } | null; envelope: { id: string; shape: Shape3 } | null };
const placed = new Function(`${region(PLACEMENT, 'export function lineFoot', 'export function PPlacement')}; return { lineFoot, workedMark };`)() as {
  lineFoot: (l: RefLine, p: Vec3) => Vec3;
  workedMark: (step: number, x: Ctx) => Mark;
};

type PlanMark = { rings: P2[]; aim?: boolean; dim?: [P2, P2]; path?: [P2, P2]; arc?: boolean; footprint?: string | null; label: { text: string; at: P2 } };
const workedPlanMark = new Function(`${region(SPORTS, 'function nearestOn', 'export function useWorkedStep')}; return workedPlanMark;`)() as (key: string, value: string, mic: { at: P2; aimAt: P2 }, scene: VenueScene) => PlanMark;

const siteCtx = (model: InstrumentModel, variant: string, pose: { p: Vec3; az: number; el: number }, surfaceId: string): Ctx => {
  const surface = model.surfaces.find((s) => s.id === surfaceId)!;
  const line = model.lines[0];
  const envelope = model.envelopes.find((e) => !e.variants || e.variants.includes(variant))!;
  return { mic: pose.p, head: surface.label, headPart: surface.partId, guide: guideFor(surface, pose), line: { label: line.label, foot: placed.lineFoot(line, pose.p) }, envelope };
};

test('every piece on a site scene has a mark that keeps its size on the screen', () => {
  // highlight and pathsFrom are drawn in millimetres: alone, they vanish on a 20 m site.
  const z = F06_ZONES.find((q) => q.requires?.variant === 'woodland')!;
  const ctx = siteCtx(F06_MODEL, 'woodland', z.start, z.refSurface);
  for (let i = 0; i < 6; i++) {
    const m = placed.workedMark(i, ctx);
    assert.ok(m.label || m.guides || m.showZones, `step ${i + 1} marks the drawing`);
  }
  const bird = F07_MODEL.surfaces[0];
  const pose = { p: { x: 0, y: -1500, z: 0 }, az: 180, el: 0 };
  assert.ok(placed.workedMark(1, siteCtx(F07_MODEL, F07_MODEL.variants[0].id, pose, bird.id)).label?.text.startsWith('FROM '), 'the reference is named on the drawing');
});

test('each step of the slider changes the drawing, not only the card', () => {
  const z = F06_ZONES.find((q) => q.requires?.variant === 'woodland')!;
  const ctx = siteCtx(F06_MODEL, 'woodland', z.start, z.refSurface);
  const seen = new Set<string>();
  for (let i = 0; i < 6; i++) seen.add(JSON.stringify(placed.workedMark(i, ctx)));
  assert.equal(seen.size, 6, 'six pieces, six different marks');
});

test('the pieces mark the right things', () => {
  const z = F06_ZONES.find((q) => q.requires?.variant === 'woodland')!;
  const ctx = siteCtx(F06_MODEL, 'woodland', z.start, z.refSurface);
  assert.equal(placed.workedMark(0, ctx).showZones, true, 'where to begin shows the blue zone');
  assert.equal(placed.workedMark(1, ctx).showZones, false, 'and only that piece does');
  assert.equal(placed.workedMark(2, ctx).guides, true, 'the distance draws its dimension');
  assert.equal(placed.workedMark(3, ctx).label?.at.y, 0, 'off the line points at the ground under the mic');
  assert.equal(placed.workedMark(3, ctx).label?.at.x, z.start.p.x);
  assert.deepEqual(placed.workedMark(4, ctx).pathsFrom, ctx.guide!.aimEnd, 'the aim runs along the axis');
  assert.equal(placed.workedMark(5, ctx).highlight, ctx.envelope!.id, 'clearance pins the keep-out');
});

test('a starting point with no line still marks that piece', () => {
  const z = F06_ZONES.find((q) => q.requires?.variant === 'woodland')!;
  const m = placed.workedMark(3, { ...siteCtx(F06_MODEL, 'woodland', z.start, z.refSurface), line: null });
  assert.equal(m.label?.text, 'NO LINE NAMED');
  assert.equal(m.guides, true);
});

test('lineFoot: a plane, an endless line and a finite line', () => {
  const p = { x: 300, y: 40, z: -70 };
  const base = { id: 'l', label: 'l', point: { x: 0, y: 0, z: 0 }, dir: { x: 1, y: 0, z: 0 } };
  assert.deepEqual(placed.lineFoot({ ...base, plane: true }, p), { x: 0, y: 40, z: -70 });
  assert.deepEqual(placed.lineFoot(base, p), { x: 300, y: 0, z: 0 });
  assert.deepEqual(placed.lineFoot({ ...base, segment: 100 }, p), { x: 100, y: 0, z: 0 });
});

/** The worked piece keys of a lesson, read from its own page. */
const piecesOf = (file: string) => {
  const src = read(`src/screens/lab/miking/lessons/${file}/pages.tsx`);
  const call = src.slice(src.indexOf('useWorkedStep({'));
  const list = call.slice(call.indexOf('pieces: ['), call.indexOf('],\n  });'));
  return [...list.matchAll(/\{ key: '([^']+)', value: '([^']+)'/g)].map((m) => ({ key: m[1], value: m[2] }));
};
const drawn = (m: PlanMark) => JSON.stringify(m);

test('every worked plan piece in the sports labs marks the plan, each differently', () => {
  const mic = { at: PF.M, aimAt: PF.A };
  const lessons: [string, VenueScene, { at: P2; aimAt: P2 }][] = [
    ['b08Audience', STUDIO_SCENE, { at: STUDIO.M, aimAt: STUDIO.S }],
    ['b12Parabolic', PRACTICE_FIELD, mic],
    ['b13FieldDiamond', PRACTICE_FIELD, mic],
    ['b14CourtIce', PRACTICE_LINE, mic],
    ['b15TrackGymCombat', PRACTICE_SMALL, mic],
    ['b16MotorHorseWater', PRACTICE_SMALL, mic],
    ['b17CrowdComplete', PRACTICE_CROWD, mic],
  ];
  for (const [file, scene, m] of lessons) {
    const pieces = piecesOf(file);
    assert.ok(pieces.length >= 5, `${file}: pieces read (${pieces.length})`);
    const marks = pieces.map((p) => workedPlanMark(p.key, p.value, m, scene));
    for (const [i, q] of marks.entries()) {
      assert.ok(q.rings.length || q.dim || q.path || q.arc || q.aim, `${file} ${pieces[i].key} draws a mark`);
      assert.ok(q.label.text, `${file} ${pieces[i].key} is labelled`);
      if (i) assert.notEqual(drawn(q), drawn(marks[i - 1]), `${file}: ${pieces[i].key} differs from the piece before it`);
    }
  }
});

test('the plan marks sit on the real things', () => {
  const m = { at: STUDIO.M, aimAt: STUDIO.S };
  const pa = workedPlanMark('PA', 'OFF ITS FRONT', m, STUDIO_SCENE);
  assert.deepEqual(pa.rings[0], STUDIO_SCENE.sectors.find((s) => s.kind === 'pa')!.c, 'the PA ring is on the PA');
  const where = workedPlanMark('WHERE', 'THE BAR', m, STUDIO_SCENE);
  assert.ok(STUDIO_SCENE.footprints.some((f) => f.id === where.footprint), 'the approved footprint lights');
  const f = { at: PF.M, aimAt: PF.A };
  assert.deepEqual(workedPlanMark('RANGE', '10.0 m', f, PRACTICE_FIELD).dim, [PF.M, PF.A], 'the range is a dimension from the mic to the target');
  assert.equal(workedPlanMark('ARC', '±40°', f, PRACTICE_FIELD).arc, true);
  assert.deepEqual(PF_ARC.at, PF.M, 'the arc drawn is the marked arc, from the same place');
  const clear = workedPlanMark('CLEAR', 'APPROVED', f, PRACTICE_FIELD);
  assert.ok(clear.path && Math.hypot(clear.path[1].x - PF.M.x, clear.path[1].y - PF.M.y) > 0, 'clearance points at the nearest edge');
});

test('the marks reach the drawings', () => {
  for (const prop of ['showZones={exMark.showZones}', 'guides={exMark.guides}', 'pathsFrom={exMark.pathsFrom}', 'highlight={exMark.highlight}', 'art={exArt}']) assert.ok(PLACEMENT.includes(prop), prop);
  const step = SPORTS.slice(SPORTS.indexOf('export function useWorkedStep'), SPORTS.indexOf('type Axis ='));
  assert.ok(step.includes('workedPlanMark(pc.key, pc.value, mic, scene)'), 'the mark follows the slider');
  assert.ok(step.includes('labels={[markLabel, ...venueLabels(scene)]}') && step.includes('mark.rings.map'), 'and is drawn on the plan');
});
