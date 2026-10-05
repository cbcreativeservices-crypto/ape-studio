/**
 * Miking Labs, Lab 4 — the AMPLIFIED CHAIN (C02 electric guitar, C08 electric
 * bass, C04 pedal and lap steel). Real relationships only (charter §9.2):
 *   • the combo's outer size is its maker's (inches converted exactly), its
 *     speaker fits the baffle under the control panel, and the rear vent
 *     clearance is the maker's 6 in;
 *   • every zone's start is clear, inside its zone, inside its drawn band;
 *     the three close guitar zones share ONE distance band (one variable at a
 *     time); the rear zone starts outside the vent clearance; the bass
 *     "breathing room" band is the research's 4–18 in;
 *   • the ideal string: harmonic shapes, the pickup's position weighting
 *     (zero at a node), a bar at half the string = the octave, a whole tone
 *     = × 1.26 tension; the low strings' equal-tempered pitches;
 *   • the signal chain: a SPEAKER output goes only to a speaker; the DI lane
 *     is drawn apart from the air lane;
 *   • each lesson validates, is registered in Lab 4, follows the item-writing
 *     rules, and names no maker, model or person from the research.
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
const sm = await import('../src/screens/lab/miking/lessons/shared/speakers/speakerModel.ts');
const cg = await import('../src/screens/lab/miking/lessons/shared/speakers/cabGeometry.ts');
const am = await import('../src/screens/lab/miking/lessons/shared/speakers/ampModel.ts');
const az = await import('../src/screens/lab/miking/lessons/shared/speakers/ampZones.ts');
const ch = await import('../src/screens/lab/miking/lessons/shared/speakers/signalChain.ts');
const str = await import('../src/screens/lab/miking/lessons/shared/electric/stringModel.ts');
const es = await import('../src/screens/lab/miking/lessons/shared/electric/electricSpec.ts');
const { MIC_TYPES } = await import('../src/screens/lab/miking/data/micTypes.ts');
const { validateLesson, micBodyOf } = await import('../src/screens/lab/miking/engine/model/validate.ts');
const { checkAssembly, compileScene } = await import('../src/screens/lab/miking/engine/geometry/collision.ts');
const { inZone, surfaceDistance } = await import('../src/screens/lab/miking/engine/geometry/zones.ts');
const { lessonById } = await import('../src/screens/lab/miking/data/lessons.ts');
const { LESSONS, lessonsOf } = await import('../src/screens/lab/miking/data/registry.ts');

const near = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) <= tol;
/** Makers, models and sources met in THIS research (beside the shared lists). */
const AMP_NAMES = /\b(Peavey|Nashville|Radial|J48|Carter|Jensen|C12K|Deluxe|Venture|SVT|Sennheiser|e ?906|OSHA|NIOSH|Fender|Ampeg|Mills|PGA27|SM57|KSM\d*)\b/;

const AMP_LESSONS = ['C02', 'C08', 'C04'].filter((id) => !!lessonById(id));

describe('the combo: the maker’s outer size, a speaker that fits, the maker’s vent clearance', () => {
  it('24.5 × 17.5 × 9.5 in, converted exactly; one 12 in speaker; open back', () => {
    const c = sm.CABINETS.combo12;
    assert.ok(near(c.w.mm, 622.3) && near(c.h.mm, 444.5) && near(c.d.mm, 241.3));
    assert.equal(c.drivers.length, 1);
    assert.equal(c.drivers[0].nominal, 12);
    assert.deepEqual([...c.backs], ['open']);
    assert.match(read('docs/labs/miking/electric_guitar_amp/SOURCES.md'), /"WIDTH: 24-1\/2 in \(62\.2 cm\)"/);
  });
  it('the speaker fits the baffle and clears the control panel band', () => {
    const k = cg.driverClearances('combo12');
    assert.ok(k.toEdge >= 0, `${k.toEdge}`);
    const { c, panel } = am.comboParts();
    const s = cg.speakerSection(12);
    assert.ok(c.drivers[0].y - s.rFrame >= panel.y1, 'the frame starts below the panel');
    assert.equal(c.floorY, c.box.y1);
  });
  it('the vent clearance is the maker’s 6 in, and the rear zone starts outside it', () => {
    assert.ok(near(am.COMBO.ventBehind.mm, 152.4));
    const rear = az.guitarRearZone();
    assert.ok(rear.distance.min > am.COMBO.ventBehind.mm);
    const m = am.ampModel('combo', 't', 't');
    const vent = m.envelopes.find((e: { id: string }) => e.id === 'ko.vent')!;
    assert.ok(vent && vent.shape.kind === 'box' && near(vent.shape.max.x - vent.shape.min.x, 152.4 - 1));
  });
  it('drawing defaults are flagged, never sourced', () => {
    for (const d of [am.COMBO.panelH, am.COMBO.chassisH, am.COMBO.tubeL, am.BASS_HEAD.w, es.GUITAR.scale, es.BASS.scale, es.PEDAL_STEEL.scale, es.STEEL_FRAME.topY]) assert.ok(d.placeholder && d.prov.kind === 'unknown');
  });
});

describe('the zones: clear, inside, drawn round their start; one variable at a time', () => {
  for (const [rig, set] of [['combo', 'guitar'], ['bass', 'bass']] as const) {
    const m = am.ampModel(rig, `t-${rig}`, 't', rig === 'bass' ? 1150 : 1000);
    const zones = az.zonesFor(rig, set);
    it(`${rig}: every start is clear of every part and inside its own zone`, () => {
      const v = m.defaultVariant;
      const scene = compileScene(m, v);
      for (const z of zones) {
        const body = micBodyOf(MIC_TYPES.instDynCard);
        assert.equal(checkAssembly(scene, z.start, body), null, z.id);
        assert.equal(inZone(z, { scene, surfaces: m.surfaces, lines: m.lines, variant: v, micTypeId: 'instDynCard', mount: 'stand' }, z.start), true, z.id);
      }
    });
    it(`${rig}: each start lies inside its drawn band (side view) and inside the view`, () => {
      for (const z of zones) {
        const u = z.start.p.x;
        const vv = z.start.p.y;
        assert.ok(z.draw!.side!.some((g) => { const us = g.poly.map((q) => q[0]); const vs = g.poly.map((q) => q[1]); return u >= Math.min(...us) && u <= Math.max(...us) && vv >= Math.min(...vs) && vv <= Math.max(...vs); }), z.id);
        const box = m.views.side!;
        assert.ok(u >= box.u0 && u <= box.u1 && vv >= box.v0 && vv <= box.v1, `${z.id} in view`);
      }
    });
  }
  it('the three close guitar zones share one distance band: sliding across keeps the distance', () => {
    const close = az.GUITAR_ZONES.filter((z) => ['eg.boundary', 'eg.midway', 'eg.centre', 'eg.edge'].includes(z.id));
    assert.equal(close.length, 4);
    for (const z of close) assert.deepEqual(z.distance, close[0].distance);
    const m = am.ampModel('combo', 't', 't');
    const a = surfaceDistance(m.surfaces, 'grille', { p: { x: 45, y: 0, z: 0 }, az: 0, el: 0 });
    const b = surfaceDistance(m.surfaces, 'grille', { p: { x: 45, y: -118, z: 0 }, az: 0, el: 0 });
    assert.ok(near(a, b));
  });
  it('the bass “room to breathe” band is the research’s 4–18 in; the close band 1–6 in', () => {
    const br = az.BASS_ZONES.find((z) => z.id === 'bass.breathing')!;
    assert.ok(near(br.distance.min, 101.6) && near(br.distance.max, 457.2));
    const bo = az.BASS_ZONES.find((z) => z.id === 'bass.boundary')!;
    assert.ok(near(bo.distance.min, 25.4) && near(bo.distance.max, 152.4));
  });
  it('a mic pressed against the combo’s cloth is stopped; one at the vents is stopped', () => {
    const m = am.ampModel('combo', 't', 't');
    const scene = compileScene(m, 'open');
    const body = micBodyOf(MIC_TYPES.instDynCard);
    assert.ok(checkAssembly(scene, { p: { x: sm.GRILLE_X.mm + 2, y: 0, z: 0 }, az: 0, el: 0 }, body));
    assert.ok(checkAssembly(scene, { p: { x: am.backX('combo') - 60, y: 0, z: 0 }, az: 180, el: 0 }, body), 'inside the vent clearance');
  });
});

describe('the ideal string and the pickup', () => {
  it('equal-tempered low strings: E2 ≈ 82.41, E1 ≈ 41.20, B0 ≈ 30.87 Hz', () => {
    assert.ok(near(str.LOW_E_GUITAR, 82.4069, 1e-3));
    assert.ok(near(str.LOW_E_BASS, 41.2034, 1e-3));
    assert.ok(near(str.LOW_B_BASS, 30.8677, 1e-3));
    assert.ok(near(es.openHz(es.GUITAR)[0], str.LOW_E_GUITAR) && near(es.openHz(es.BASS)[0], str.LOW_E_BASS));
  });
  it('mode n has n − 1 nodes, and a pickup at a node senses none of it', () => {
    const L = 648;
    assert.deepEqual(str.nodesOf(1, L), []);
    assert.equal(str.nodesOf(4, L).length, 3);
    assert.ok(str.pickupWeight(2, L / 2, L) < 1e-12, 'mid-string, harmonic 2');
    assert.ok(near(str.pickupWeight(1, L / 2, L), 1), 'mid-string, the fundamental is at its peak');
    assert.ok(str.atNode(3, L / 3, L));
  });
  it('a bridge pickup hears the fundamental less, relative to the upper harmonics, than a neck pickup', () => {
    const L = es.GUITAR.scale.mm;
    const [neck, , bridge] = es.GUITAR.pickups;
    const ratio = (q: number) => str.pickupWeight(5, q, L) / str.pickupWeight(1, q, L);
    assert.ok(ratio(bridge.fromBridge) > ratio(neck.fromBridge));
    assert.ok(str.pickupWeight(1, bridge.fromBridge, L) < str.pickupWeight(1, neck.fromBridge, L));
  });
  it('a bar at half the string sounds the octave; at fret 7, a fifth; a whole tone needs × 1.26 tension', () => {
    const L = 610;
    assert.ok(near(str.barHz(100, L, L / 2), 200, 1e-9));
    assert.ok(near(str.barFor(12, L), L / 2, 1e-9));
    assert.ok(near(str.barHz(100, L, str.barFor(7, L)), 100 * Math.pow(2, 7 / 12), 1e-9));
    assert.ok(near(str.tensionRatio(2), 1.2599, 1e-4));
    assert.ok(near(str.centsBetween(100, 200), 1200, 1e-9));
  });
  it('an ideal pluck excites mode n as |sin(nπp/L)| / n²', () => {
    assert.ok(near(str.pluckAmp(1, 324, 648), 1) && near(str.pluckAmp(2, 324, 648), 0, 1e-12) && near(str.pluckAmp(3, 324, 648), 1 / 9));
  });
});

describe('the signal chain: the air lane apart from the wires; a speaker output only to a speaker', () => {
  it('a speaker output may go to a cabinet and nowhere else', () => {
    for (const to of ch.INS) assert.equal(ch.patchVerdict('speakerOut', to), to === 'cabinet' ? 'ok' : 'stop', to);
    for (const from of ch.OUTS) if (from !== 'speakerOut') assert.equal(ch.patchVerdict(from, 'cabinet'), 'stop', from);
    assert.equal(ch.patchVerdict('diOut', 'micIn'), 'ok');
  });
  it('the chain: air lane player → … → amp → speaker cable → cab → air → mic → desk; DI lanes apart', () => {
    const c = ch.buildChain({ pedals: 'pedals', rig: 'combo', diBox: true, ampDirect: true });
    const air = c.nodes.filter((n) => n.lane === 'air').sort((a, b) => a.col - b.col).map((n) => n.id);
    assert.deepEqual(air, ['player', 'pedals', 'amp', 'cab', 'mic', 'desk']);
    assert.equal(c.links.find((l) => l.to === 'cab')!.kind, 'speaker');
    assert.equal(c.links.find((l) => l.from === 'cab')!.kind, 'air');
    assert.ok(c.links.filter((l) => l.kind === 'speaker').every((l) => l.to === 'cab'), 'speaker cable only to the cabinet');
    assert.ok(c.nodes.filter((n) => n.id === 'dibox' || n.id === 'ampdi').every((n) => n.lane !== 'air'));
    assert.ok(!c.links.some((l) => l.from === 'player' && l.to === 'pedals'), 'the DI box sits between');
  });
});

describe('the amplified-chain lessons: valid, registered in Lab 4, clean words', () => {
  it('the lessons are registered in Lab 4 (strings) and served', () => {
    assert.ok(AMP_LESSONS.length >= 1);
    for (const id of AMP_LESSONS) {
      const row = LESSONS.find((l: { id: string }) => l.id === id);
      assert.ok(row && row.labId === 'strings', id);
      assert.ok(lessonsOf('strings').some((l: { id: string }) => l.id === id));
    }
  });
  for (const id of AMP_LESSONS) {
    it(`${id} validates`, () => assert.deepEqual(validateLesson(lessonById(id)!, MIC_TYPES), []));
    it(`${id}: item-writing rules (LESSON_JOURNEY §5)`, () => itemRules(lessonById(id)!));
    it(`${id}: no maker, model or person from the research in learner text`, () => {
      const out = learnerStrings(lessonById(id)!);
      const bad = out.filter((s) => RESEARCH_NAMES.test(s) || AMP_NAMES.test(s));
      assert.deepEqual(bad, []);
    });
    it(`${id}: the hearing guideline and the speaker-output stop are taught, and a quick-check item is critical`, () => {
      const l = lessonById(id)!;
      const all = learnerStrings(l).join(' ');
      assert.match(all, /85 dBA/);
      assert.match(all, /speaker output/i);
      assert.ok(l.diagnostic.filter((q) => q.critical).length >= 1);
    });
  }
  it('the presentation files name no maker or model from this research', () => {
    const files = ['shared/electric/ampPages.tsx', 'shared/electric/ElectricArt.tsx', 'shared/electric/SteelArt.tsx', 'shared/electric/ElectricExplorer.tsx', 'shared/electric/StringDisplay.tsx', 'shared/speakers/ampArt.tsx', 'shared/speakers/DiPath.tsx', 'shared/speakers/BacklinePlan.tsx', 'c02GuitarAmp/pages.tsx', ...(lessonById('C08') ? ['c08BassAmp/pages.tsx'] : []), ...(lessonById('C04') ? ['c04Steel/pages.tsx'] : [])];
    const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
    for (const f of files) {
      const t = strip(read(`src/screens/lab/miking/lessons/${f}`));
      assert.doesNotMatch(t, AMP_NAMES, f);
    }
  });
  it('nothing in the amplified-chain files loops or plays (D8, fully silent)', () => {
    for (const f of ['shared/electric/ampPages.tsx', 'shared/electric/StringDisplay.tsx', 'shared/speakers/DiPath.tsx', 'shared/speakers/BacklinePlan.tsx']) {
      const t = read(`src/screens/lab/miking/lessons/${f}`).replace(/\/\*[\s\S]*?\*\//g, '');
      assert.doesNotMatch(t, /withRepeat\(|useFrameCallback\(|setInterval\(|expo-audio|startFenced/, f);
    }
  });
});
