/**
 * M01 Kick Drum — the model and the lesson data (blueprint §11,
 * mikingModelM01). Checks the relationships the sources state:
 *
 *   • validateLesson(M01) is clean (ids resolve, every zone start is inside
 *     its zone AND collision-free in every variant it allows, 8 pages,
 *     every correct answer is an option, credit ids exist);
 *   • the kick proposal's §8 invariants: 10 rods 36° apart, 2 spurs (one each
 *     side), the port wholly inside the head, every zone between the heads,
 *     b52.far ON the beater line and b52.near OFF it;
 *   • zone band edges are inclusive (5.0 and 7.5 cm);
 *   • every sourced zone's quote appears verbatim in kick/SOURCES.md, and
 *     every src key resolves to kick/SOURCES.md or SOURCES_SHARED.md;
 *   • every placeholder dim is listed in the lesson's unknowns, and NO
 *     readout is measured from a placeholder (only the batter / front heads,
 *     the beater line, the drum axis);
 *   • the corrections logged in CORRECTIONS_LOG.md are applied (K-01, K-02);
 *   • no tendency is called a "result"; no "classroom"/"instructor".
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { M01_LESSON } from '../src/screens/lab/miking/lessons/m01Kick/lesson.ts';
import { KICK_DIMS } from '../src/screens/lab/miking/lessons/m01Kick/model.ts';
import { KICK_ANCHORS, KICK_GEOM } from '../src/screens/lab/miking/lessons/m01Kick/geometry.ts';
import { MIC_TYPES } from '../src/screens/lab/miking/data/micTypes.ts';
import { validateLesson, micBodyOf } from '../src/screens/lab/miking/engine/model/validate.ts';
import { checkAssembly, compileScene, pinToSurface } from '../src/screens/lab/miking/engine/geometry/collision.ts';
import { inZone, lineDistance } from '../src/screens/lab/miking/engine/geometry/zones.ts';
import { PAGE_IDS } from '../src/screens/lab/miking/engine/model/types.ts';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const KICK_SOURCES = read('docs/labs/miking/kick/SOURCES.md');
const SHARED = read('docs/labs/miking/SOURCES_SHARED.md');
const LOG = read('docs/labs/miking/CORRECTIONS_LOG.md');
const lesson = M01_LESSON;
const m = lesson.model;

describe('M01 validates', () => {
  it('validateLesson returns no problems', () => {
    assert.deepEqual(validateLesson(lesson, MIC_TYPES), []);
  });
  it('the 10 pages are present (the journey order)', () => {
    assert.deepEqual(Object.keys(lesson.pages).sort(), [...PAGE_IDS].sort());
  });
  it('part ids are unique and stable', () => {
    const ids = m.parts.map((p) => p.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const id of ['kick.batter', 'kick.reso', 'kick.resoPorted', 'kick.port', 'kick.shell', 'kick.pillow']) assert.ok(ids.includes(id), id);
  });
});

describe('the default drum (kick/GEOMETRY_PROPOSAL §2, §8)', () => {
  it('22 × 18 in, exact conversions', () => {
    assert.equal(KICK_DIMS.dNom.mm, 558.8);
    assert.equal(KICK_GEOM.R, 279.4);
    assert.equal(KICK_GEOM.L, 457.2);
    assert.equal(KICK_GEOM.rIn, 272.4);
  });
  it('10 tension rods per head, 36° apart', () => {
    assert.equal(KICK_GEOM.rodAngles.length, 10);
    for (let k = 1; k < 10; k++) assert.equal(Math.round((KICK_GEOM.rodAngles[k] - KICK_GEOM.rodAngles[k - 1]) * 1e9) / 1e9, 36);
  });
  it('two spurs, one on each side of the shell', () => {
    const sides = KICK_GEOM.spurs.map((s) => Math.sign(s.top.z));
    assert.deepEqual(sides.sort(), [-1, 1]);
  });
  it('the port lies wholly inside the head: r_port + d/2 < R', () => {
    const c = KICK_ANCHORS['bd.port.center'];
    assert.ok(Math.hypot(c.y, c.z) + KICK_DIMS.portD.mm / 2 < KICK_GEOM.R);
    assert.equal(c.x, KICK_GEOM.L, 'the port is in the front-head plane');
    assert.equal(KICK_DIMS.portD.mm, 127, 'Remo 5 in');
  });
  it('the beater head touches the batter head at the strike point, 1.5 in above centre (DW range 1–2 in)', () => {
    const h = KICK_ANCHORS['pedal.beater.headAtStrike'];
    assert.equal(h.x + KICK_DIMS.beaterHeadR.mm, 0);
    assert.ok(Math.abs(h.y + 38.1) < 1e-9);
    assert.ok(-KICK_GEOM.strikeY >= 25.4 && -KICK_GEOM.strikeY <= 50.8);
  });
  it('the beater-travel envelope never crosses into the drum (x < 0)', () => {
    const b = KICK_GEOM.beater;
    for (let a = b.restAngle; a <= b.strikeAngle + 1e-9; a += (b.strikeAngle - b.restAngle) / 20) {
      assert.ok(b.axle.x + (b.len + b.headR) * Math.cos(a) <= 0 + 1e-9, `angle ${a}`);
    }
  });
});

describe('the documented zones', () => {
  const zone = (id: string) => lesson.zones.find((z) => z.id === id)!;
  it('every zone band lies between the heads or at the front head (0 … L + 15 cm)', () => {
    for (const z of lesson.zones) {
      const surf = m.surfaces.find((s) => s.id === z.refSurface)!;
      assert.ok(surf.point.x + z.distance.min >= -0.01 && surf.point.x + z.distance.max <= KICK_GEOM.L + 150 + 0.01, z.id);
    }
    assert.ok(zone('b52.far').distance.max < KICK_GEOM.L, 'the 30 cm end is inside an 18 in drum');
  });
  it('b52.far lies ON the beater line, b52.near OFF it (K-01, S-B52-UG)', () => {
    assert.equal(lineDistance(m.lines, 'beater', zone('b52.far').start), 0);
    assert.ok(zone('b52.far').radial!.max! <= 15);
    assert.ok(zone('b52.near').radial!.min! > 0, '"slightly off-center" excludes the line itself');
  });
  it('band edges are inclusive: 5.0 and 7.5 cm in, 4.9 and 7.6 cm out', () => {
    const z = zone('b52.near');
    const scene = compileScene(m, 'ported');
    const ctx = { scene, surfaces: m.surfaces, lines: m.lines, variant: 'ported', micTypeId: 'kickDynSuper', mount: 'stand' };
    const at = (x: number) => ({ ...z.start, p: { ...z.start.p, x } });
    assert.ok(inZone(z, ctx, at(50)));
    assert.ok(inZone(z, ctx, at(75)));
    assert.ok(!inZone(z, ctx, at(49)));
    assert.ok(!inZone(z, ctx, at(76)));
  });
  it('inside zones are unreachable with a stand mic on an INTACT head (no port, no boom route)', () => {
    const scene = compileScene(m, 'intact');
    for (const z of lesson.zones.filter((q) => q.side === 'inside' && q.requires?.mount !== 'surface')) {
      const t = MIC_TYPES[z.requires!.micTypeIds![0]];
      assert.ok(checkAssembly(scene, z.start, micBodyOf(t)), `${z.id} start was clear with an intact head`);
    }
  });
  it('the boundary mic rests on the pillow in both variants, clear (it may touch its own cushioning)', () => {
    const t = MIC_TYPES.boundaryHalf;
    const pillow = m.parts.find((p) => p.id === 'kick.pillow')!.solid as { kind: 'box'; min: { x: number; y: number; z: number }; max: { x: number; y: number; z: number } };
    for (const v of ['ported', 'intact']) {
      const pose = pinToSurface(lesson.zones.find((z) => z.id === 'b91.pillow')!.start, pillow, micBodyOf(t), t.body.width!.mm / 2);
      assert.equal(pose.p.y + 2 * t.body.radius.mm, pillow.min.y, 'the plate sits ON the pillow top');
      assert.equal(checkAssembly(compileScene(m, v), pose, micBodyOf(t)), null, v);
    }
  });
  it('the pillow is the DW 18 in pillow (owner 2026-10-04, K-28): retailer size, sourced, inside the drum, against the batter head', () => {
    const IN = 25.4;
    assert.ok(Math.abs(KICK_DIMS.pillowLen.mm - 18.1 * IN) < 1e-9 && Math.abs(KICK_DIMS.pillowH.mm - 4.8 * IN) < 1e-9 && Math.abs(2 * KICK_DIMS.pillowHalfW.mm - 15.8 * IN) < 1e-9);
    for (const d of [KICK_DIMS.pillowLen, KICK_DIMS.pillowH, KICK_DIMS.pillowHalfW]) {
      assert.equal(d.placeholder, undefined, 'no longer a placeholder');
      assert.equal(d.prov.kind, 'sourced');
      assert.ok(d.prov.kind === 'sourced' && d.prov.src === 'DW-PILLOW');
    }
    assert.match(KICK_SOURCES, /\| DW-PILLOW \|/);
    assert.match(LOG, /\| K-28 \|/);
    const g = KICK_GEOM.pillow;
    // On the shell bottom, against the batter head, never through a head:
    assert.equal(g.bottom, KICK_GEOM.rIn);
    assert.ok(g.x0 > 0.5 && g.x0 <= 1, 'against the batter head, not through it');
    assert.ok(g.x1 < KICK_GEOM.L - 0.5, 'its 18.1 in is pressed inside the 18 in depth, short of the front head');
    assert.ok(Math.abs(g.bottom - g.top - 4.8 * IN) < 1e-9);
    assert.ok(g.halfW < KICK_GEOM.rIn, 'narrower than the inside of the shell');
    // The pillow collides with neither head in either variant (it is a part, not a pose):
    // a stand mic resting at the pillow's far end is still blocked by the pillow, not a head.
    const scene = compileScene(m, 'intact');
    const hit = checkAssembly(scene, { p: { x: g.x1 - 40, y: g.top - 10, z: 0 }, az: 0, el: 0 }, micBodyOf(MIC_TYPES.kickDynSuper));
    assert.ok(hit, 'blocked');
  });
  it('review m16, computed: the strike sits 82° / 72° / 51° above a plate on the pillow at 25 / 60 / 152 mm', () => {
    const top = KICK_GEOM.pillow.top;
    const el = (d: number) => (Math.atan2(top - KICK_GEOM.strikeY, d) * 180) / Math.PI;
    assert.equal(Math.round(el(25)), 82);
    assert.equal(Math.round(el(60)), 72);
    assert.equal(Math.round(el(152)), 51);
    for (const d of [25, 60, 100, 152]) assert.ok(el(d) >= 30, 'within 60° of the plate perpendicular across the whole band');
  });
  it('a stand mic may NOT touch the pillow (S-B52-UG: "does not touch … damping")', () => {
    const scene = compileScene(m, 'ported');
    const hit = checkAssembly(scene, { p: { x: 100, y: KICK_GEOM.pillow.top - 20, z: 0 }, az: 0, el: 0 }, micBodyOf(MIC_TYPES.kickDynSuper));
    assert.equal(hit?.partId, 'kick.pillow');
  });
  it('sourced zone quotes are verbatim in kick/SOURCES.md; trial zones are labelled TRIAL', () => {
    for (const z of lesson.zones) {
      if (z.kind === 'sourced') assert.ok(KICK_SOURCES.includes(z.quote), `${z.id}: quote not found verbatim`);
      else assert.match(z.band, /TRIAL/);
    }
  });
});

describe('sources and unknowns', () => {
  const keys = new Set<string>();
  for (const mm of (KICK_SOURCES + SHARED).matchAll(/^\| ([A-Z0-9][A-Z0-9-]+) \|/gm)) keys.add(mm[1]);
  it('the source tables were parsed', () => assert.ok(keys.size > 30 && keys.has('S-B52-UG') && keys.has('CALC-C')));
  it('every zone, mic-type and part src resolves to a SOURCES key', () => {
    const srcs: string[] = [];
    for (const z of lesson.zones) srcs.push(z.src);
    for (const t of Object.values(MIC_TYPES)) {
      for (const e of t.examples) srcs.push(e.src);
      for (const p of t.patterns) if (p.prov.kind === 'sourced' || p.prov.kind === 'trial') srcs.push(p.prov.src);
    }
    for (const p of m.parts) if (p.prov.kind === 'sourced' || p.prov.kind === 'trial') srcs.push(p.prov.src);
    for (const d of Object.values(KICK_DIMS)) if (d.prov.kind === 'sourced' || d.prov.kind === 'trial') srcs.push(d.prov.src);
    const missing = [...new Set(srcs)].filter((s) => !keys.has(s));
    assert.deepEqual(missing, []);
  });
  it('every placeholder dim is named in the lesson’s unknowns', () => {
    // Named in WORDS on screen; `dims` ties each line to its placeholders (review m11).
    const dims = lesson.unknowns.flatMap((u) => u.dims);
    for (const [name, d] of Object.entries(KICK_DIMS)) if ('placeholder' in d && d.placeholder) assert.ok(dims.includes(name), `${name} not listed`);
    for (const u of lesson.unknowns) assert.doesNotMatch(u.text, /\((?:[a-z]+[A-Z][A-Za-z]*)(?:, [a-z]+[A-Z][A-Za-z]*)*\)/, `a code identifier in learner text: ${u.text}`);
  });
  it('readouts are measured only from sourced planes and lines, never a placeholder', () => {
    assert.deepEqual(m.surfaces.map((s) => s.id).sort(), ['batter', 'reso']);
    assert.deepEqual(m.lines.map((l) => l.id).sort(), ['axis', 'beater']);
    for (const z of lesson.zones) assert.ok(['batter', 'reso'].includes(z.refSurface));
  });
  it('the corrections log lists the kick fixes, and the lesson applies them', () => {
    for (const id of ['K-01', 'K-02', 'K-03', 'K-06', 'K-07', 'K-08']) assert.match(LOG, new RegExp(`\\| ${id} \\|`));
    assert.match(lesson.zones.find((z) => z.id === 'b52.far')!.quote, /on-axis with beater/);
    const reso = lesson.zones.find((z) => z.id === 'e902.reso')!;
    assert.doesNotMatch(reso.label + reso.band, /port/i, 'K-02: the e 902 row never mentions a port');
  });
});

describe('wording', () => {
  const all = JSON.stringify(lesson);
  it('tendencies, never results; no institutional words; no audio promised', () => {
    for (const z of lesson.zones) assert.doesNotMatch(z.tendency, /\bresult\b/i, z.id);
    assert.doesNotMatch(all, /\b(classroom|instructor|student)s?\b/i);
    assert.doesNotMatch(all, /\b(listen to|play the|hear the example)\b/i);
  });
  it('every scenario’s correct answer is one of its options, options unique', () => {
    for (const s of [...lesson.scenarios, ...lesson.symptoms]) {
      assert.ok(s.options.includes(s.correct), s.id);
      assert.equal(new Set(s.options).size, s.options.length, s.id);
    }
  });
});
