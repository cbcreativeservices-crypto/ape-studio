/**
 * Miking Labs, Lab 2 — the ELECTRIC PIANOS (I11a Rhodes, I11b Wurlitzer).
 * Real relationships only (charter §9.2):
 *   • the sourced numbers are the research's, converted exactly (the 73-key
 *     model's size, the replacement tine, the escapement, the hammer tip, the
 *     4 × 8 in oval speaker); every drawing default is flagged;
 *   • the cantilever's first shape: zero at the clamp, one at the tip, rising;
 *   • the reed piano in frame W: the two ovals fit the lid's front slope and
 *     the case, sit above the keys and face the player; the lid stands at
 *     most a few mm proud of its true face; the player's envelopes stop a mic
 *     pressed into the hands; a mic against the grille is stopped;
 *   • every zone's start is clear for every mic type, inside its own zone and
 *     inside its drawn band; the close zones share one band (one variable at
 *     a time); the tine piano's close band is the research's 1–6 in;
 *   • the signal chain: the reed piano's amplifier and speakers are drawn as
 *     the instrument's own; the auxiliary output is its own lane; a speaker
 *     output goes only to a speaker;
 *   • each lesson validates, is registered in Lab 2, follows the item-writing
 *     rules, names no maker, model or source, teaches the hearing guideline
 *     and the speaker-output stop, and nothing in the family loops or plays.
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
const ks = await import('../src/screens/lab/miking/lessons/shared/keys/keysSpec.ts');
const wm = await import('../src/screens/lab/miking/lessons/shared/keys/wurliModel.ts');
const rz = await import('../src/screens/lab/miking/lessons/shared/keys/rhodesZones.ts');
const kg = await import('../src/screens/lab/miking/lessons/shared/keys/keysGeometry.ts');
const am = await import('../src/screens/lab/miking/lessons/shared/speakers/ampModel.ts');
const ch = await import('../src/screens/lab/miking/lessons/shared/speakers/signalChain.ts');
const { MIC_TYPES } = await import('../src/screens/lab/miking/data/micTypes.ts');
const { validateLesson, micBodyOf } = await import('../src/screens/lab/miking/engine/model/validate.ts');
const { checkAssembly, compileScene } = await import('../src/screens/lab/miking/engine/geometry/collision.ts');
const { inZone, surfaceDistance } = await import('../src/screens/lab/miking/engine/geometry/zones.ts');
const { sdf } = await import('../src/screens/lab/miking/engine/geometry/sdf.ts');
const { lessonById } = await import('../src/screens/lab/miking/data/lessons.ts');
const { LESSONS, lessonsOf, readyLabs, labMeta } = await import('../src/screens/lab/miking/data/registry.ts');

const near = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) <= tol;
/** Makers, models and sources met in THIS research (beside the shared lists). */
const KEYS_NAMES = /\b(MK ?8|Stage ?61|Fender|Vintage Vibe|Tropical Fish|Vari-?Pan|Deluxe|200A|Shure|PGA ?27|SM ?57|NIOSH|OSHA|CBS|V8)\b/;
const KEYS_LESSONS = ['I11a', 'I11b'];

describe('the sourced numbers, converted exactly; drawing defaults flagged', () => {
  it('the 73-key model: 1153 × 563 × 225 mm, 73 keys (its maker’s manual)', () => {
    const b = ks.RHODES.big;
    assert.deepEqual([b.w.mm, b.d.mm, b.h.mm, b.keys], [1153, 563, 225, 73]);
    assert.equal(b.w.prov.kind, 'sourced');
    assert.match(read('docs/labs/miking/rhodes/SOURCES.md'), /"DIMENSIONS 1153 \(w\) x 563 \(d\) x 225 \(h\)"/);
  });
  it('one replacement tine 4 3/8 in = 111.125 mm; escapement 1/32 in = 0.79375 mm; hammer tip 1/4 in', () => {
    assert.ok(near(ks.TINE.tineL.mm, 111.125));
    assert.ok(near(ks.TINE.escapement.mm, 0.79375));
    assert.ok(near(ks.TINE.hammerTip.mm, 6.35));
    assert.equal(ks.TINE.tineL.prov.kind, 'trial', 'one note’s tine, not every note’s');
  });
  it('the oval speaker is 4 × 8 in (101.6 × 203.2 mm), its depths drawn from the 12 in reference', () => {
    assert.ok(near(ks.SPEAKER_OVAL_4x8.minor.mm, 101.6) && near(ks.SPEAKER_OVAL_4x8.major.mm, 203.2));
    assert.ok(ks.SPEAKER_OVAL_4x8.aCone < ks.SPEAKER_OVAL_4x8.aFrame && ks.SPEAKER_OVAL_4x8.bCone < ks.SPEAKER_OVAL_4x8.bFrame);
    assert.ok(ks.SPEAKER_OVAL_4x8.aDust < ks.SPEAKER_OVAL_4x8.aSur && ks.SPEAKER_OVAL_4x8.bDust < ks.SPEAKER_OVAL_4x8.bSur);
    assert.equal(ks.SPEAKER_OVAL_4x8.depthProv.kind, 'unknown');
  });
  it('the unknowns are flagged placeholders, never sourced', () => {
    for (const d of [ks.RHODES.stage.w, ks.RHODES.stage.d, ks.RHODES.keyTop, ks.RHODES.sideBySide, ks.WHITE_KEY, ks.TINE.tonebarL, ks.TINE.pickupGap, ...wm.WURLI_PLACEHOLDERS, ks.REED.reedL]) assert.ok(d.placeholder && d.prov.kind === 'unknown');
  });
  it('the 61-key model is drawn 36 white keys wide, inside its cheeks', () => {
    assert.equal(kg.RHODES_TOP.keys.whites.length, 36);
    const w = kg.RHODES_TOP.keys.whites;
    assert.ok(w[0].u0 > -kg.RHODES_TOP.half && w[w.length - 1].u1 < kg.RHODES_TOP.half);
    // 25 black keys on a C-to-C 61-note keyboard
    assert.equal(kg.RHODES_TOP.keys.blacks.length, 25);
  });
});

describe('the cantilever’s first shape (a tine, a reed)', () => {
  it('zero at the clamp, one at the tip, rising all the way', () => {
    assert.ok(near(ks.cantileverShape(0), 0, 1e-12));
    assert.ok(near(ks.cantileverShape(1), 1, 1e-12));
    let prev = -1;
    for (let i = 0; i <= 20; i++) {
      const y = ks.cantileverShape(i / 20);
      assert.ok(y >= prev);
      prev = y;
    }
    // the classic first mode: the mid-point moves about a third of the tip
    assert.ok(near(ks.cantileverShape(0.5), 0.3393, 2e-3));
  });
  it('the drawn swing decays and never loops on its own', () => {
    assert.ok(Math.abs(ks.tipSwing(3, 1)) < Math.abs(ks.tipSwing(0, 1)));
  });
});

describe('the reed piano in frame W', () => {
  const m = wm.wurliModel('t', 't');
  const scene = compileScene(m, m.defaultVariant);
  const body = micBodyOf(MIC_TYPES.instDynCard);
  it('the face normal is a unit vector toward the player, tilted up', () => {
    assert.ok(near(Math.hypot(wm.W.n.x, wm.W.n.y, wm.W.n.z), 1));
    assert.ok(wm.W.n.x > 0 && wm.W.n.y < 0);
  });
  it('both ovals fit the lid’s front slope and the case, above the keys', () => {
    const OV = ks.SPEAKER_OVAL_4x8;
    assert.ok(2 * OV.bFrame <= wm.FACE_LEN, `${2 * OV.bFrame} vs ${wm.FACE_LEN}`);
    for (const c of [wm.C_BASS, wm.C_TREBLE]) {
      assert.ok(Math.abs(c.z) + OV.aFrame <= wm.W.halfW);
      assert.ok(c.y < wm.W.keyTopY, 'above the keys');
      assert.ok(near(c.x, wm.faceX(c.y)), 'on the face');
    }
    assert.ok(wm.C_TREBLE.z - OV.aFrame > wm.C_BASS.z + OV.aFrame, 'the two do not overlap');
  });
  it('the lid’s stepped solid stands at most ~5.5 mm proud of its true face', () => {
    for (let k = 0; k < 40; k++) {
      const y = wm.W.caseTopY + ((wm.W.faceFootY - wm.W.caseTopY) * (k + 0.37)) / 40;
      const onFace = { x: wm.faceX(y), y, z: -200 };
      const out6 = { x: onFace.x + wm.W.n.x * 6, y: onFace.y + wm.W.n.y * 6, z: -200 };
      const lid = scene.solids.filter((s: { partId: string }) => s.partId.startsWith('wur.lid'));
      assert.ok(lid.some((s: { shape: unknown }) => sdf(s.shape as never, { x: onFace.x - 1, y, z: -200 }) < 0), `the face is solid at y ${y}`);
      assert.ok(lid.every((s: { shape: unknown }) => sdf(s.shape as never, out6) > 0), `6 mm out is clear at y ${y}`);
    }
  });
  it('a mic against the grille is stopped; one in the player’s hands is stopped', () => {
    assert.ok(checkAssembly(scene, wm.facingPose(wm.C_BASS, 4), body), 'against the grille');
    assert.ok(checkAssembly(scene, { p: { x: -40, y: wm.W.keyTopY - 30, z: -150 }, az: 0, el: -20 }, body), 'in the hands over the keys');
  });
  it('the player is on the speakers’ side, and the room zone on the other', () => {
    const room = wm.wurliZones().find((z: { id: string }) => z.id === 'wur.room')!;
    assert.ok(wm.PLAYER.shoulder.x > 0 && room.start.p.x < wm.W.caseBackX);
  });
});

describe('the zones: clear, inside, drawn round their start; one variable at a time', () => {
  const sets = [
    { name: 'reed piano', m: wm.wurliModel('t', 't'), zones: wm.wurliZones() },
    { name: 'tine piano’s combo', m: am.ampModel('combo', 't', 't'), zones: rz.rhodesZones() },
  ];
  for (const { name, m, zones } of sets) {
    it(`${name}: every start is clear for every mic type and inside its own zone`, () => {
      const v = m.defaultVariant;
      const scene = compileScene(m, v);
      for (const t of ['instDynCard', 'sdcCard'])
        for (const z of zones) {
          assert.equal(checkAssembly(scene, z.start, micBodyOf(MIC_TYPES[t])), null, `${t} ${z.id}`);
          assert.equal(inZone(z, { scene, surfaces: m.surfaces, lines: m.lines, variant: v, micTypeId: t, mount: 'stand' }, z.start), true, `${t} ${z.id}`);
        }
    });
    it(`${name}: each start lies inside its drawn band (in a view that cuts through it) and inside the view`, () => {
      for (const z of zones) {
        const inPoly = (polys: { poly: readonly (readonly [number, number])[] }[], u: number, vv: number) => polys.some((g) => { const us = g.poly.map((q) => q[0]); const vs = g.poly.map((q) => q[1]); return u >= Math.min(...us) - 1e-6 && u <= Math.max(...us) + 1e-6 && vv >= Math.min(...vs) - 1e-6 && vv <= Math.max(...vs) + 1e-6; });
        const p = z.start.p;
        assert.ok(inPoly(z.draw!.side!, p.x, p.y) || inPoly(z.draw!.top!, p.x, p.z), z.id);
        for (const view of ['side', 'top'] as const) {
          const box = m.views[view]!;
          const vv = view === 'side' ? p.y : p.z;
          assert.ok(p.x >= box.u0 && p.x <= box.u1 && vv >= box.v0 && vv <= box.v1, `${z.id} in the ${view} view`);
        }
      }
    });
  }
  it('the reed piano’s close zones share one band round the research’s 1 in', () => {
    const close = wm.wurliZones().filter((z: { id: string }) => ['wur.close', 'wur.centre', 'wur.out', 'wur.other'].includes(z.id));
    assert.equal(close.length, 4);
    for (const z of close) assert.deepEqual(z.distance, close[0].distance);
    assert.ok(close[0].distance.min < 25.4 && close[0].distance.max > 25.4);
    const off = close.find((z: { id: string }) => z.id === 'wur.close')!;
    assert.ok(off.aim!.minOffAxis! > 0, '“at a slight angle” is tested');
  });
  it('the tine piano’s close spots share the research’s 1–6 in band; the rear starts outside the vent', () => {
    const zs = rz.rhodesZones();
    const close = zs.filter((z: { id: string }) => ['rh.boundary', 'rh.centre', 'rh.edge', 'rh.close'].includes(z.id));
    assert.equal(close.length, 4);
    for (const z of close) assert.ok(near(z.distance.min, 25.4) && near(z.distance.max, 152.4), z.id);
    const rear = zs.find((z: { id: string }) => z.id === 'rh.rear')!;
    assert.ok(rear.distance.min > am.COMBO.ventBehind.mm);
    const m = am.ampModel('combo', 't', 't');
    const a = surfaceDistance(m.surfaces, 'grille', { p: { x: 60, y: 0, z: 0 }, az: 0, el: 0 });
    const b = surfaceDistance(m.surfaces, 'grille', { p: { x: 60, y: -118, z: 0 }, az: 0, el: 0 });
    assert.ok(near(a, b), 'sliding across keeps the distance');
  });
});

describe('the signal chain: the reed piano’s own amp and speakers; the aux apart', () => {
  it('icons: a keyboard, the built-in amplifier, the speakers in the lid', () => {
    const c = ch.buildChain({ pedals: null, rig: 'combo', diBox: false, ampDirect: true, icons: { player: 'keys', amp: 'keysAmp', cab: 'lidSpeakers' } });
    const air = c.nodes.filter((n: { lane: string }) => n.lane === 'air').sort((a: { col: number }, b: { col: number }) => a.col - b.col);
    assert.deepEqual(air.map((n: { id: string }) => n.id), ['player', 'amp', 'cab', 'mic', 'desk']);
    assert.deepEqual(air.map((n: { kind: string }) => n.kind), ['keys', 'keysAmp', 'lidSpeakers', 'mic', 'desk']);
    assert.ok(c.nodes.find((n: { id: string }) => n.id === 'ampdi')!.lane !== 'air', 'the aux output is its own lane');
    assert.ok(c.links.filter((l: { kind: string }) => l.kind === 'speaker').every((l: { to: string }) => l.to === 'cab'));
  });
  it('without icons, the chain is unchanged (the guitar lessons)', () => {
    const c = ch.buildChain({ pedals: 'pedals', rig: 'combo', diBox: true, ampDirect: true });
    assert.equal(c.nodes.find((n: { id: string }) => n.id === 'player')!.kind, 'instrument');
  });
});

describe('the electric-piano lessons: valid, registered in Lab 2, clean words', () => {
  it('Lab 2 is listed, with a blurb, and holds both lessons in their own rows', () => {
    assert.ok(readyLabs().some((l: { id: string }) => l.id === 'percussion'));
    assert.ok(labMeta('percussion')!.blurb.length > 40);
    for (const id of KEYS_LESSONS) {
      const row = LESSONS.find((l: { id: string }) => l.id === id);
      assert.ok(row && row.labId === 'percussion', id);
      assert.ok(lessonsOf('percussion').some((l: { id: string }) => l.id === id));
      assert.equal(lessonById(id)!.labId, 'percussion');
    }
  });
  for (const id of KEYS_LESSONS) {
    it(`${id} validates`, () => assert.deepEqual(validateLesson(lessonById(id)!, MIC_TYPES), []));
    it(`${id}: item-writing rules (LESSON_JOURNEY §5)`, () => itemRules(lessonById(id)!));
    it(`${id}: no maker, model or source from the research in learner text`, () => {
      const bad = learnerStrings(lessonById(id)!).filter((s) => RESEARCH_NAMES.test(s) || KEYS_NAMES.test(s));
      assert.deepEqual(bad, []);
    });
    it(`${id}: the hearing guideline, the speaker-output stop and "never open it" are taught; quick-check items are critical`, () => {
      const l = lessonById(id)!;
      const all = learnerStrings(l).join(' ');
      assert.match(all, /85 dBA/);
      assert.match(all, /speaker output/i);
      assert.match(all, /technician/);
      assert.ok(l.diagnostic.filter((q) => q.critical).length >= 2);
    });
  }
  it('the presentation files name no maker or model from this research, and nothing loops or plays', () => {
    const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
    for (const f of ['shared/keys/KeysArt.tsx', 'shared/keys/KeysExplorer.tsx', 'shared/keys/KeysPlan.tsx', 'shared/keys/MechanismDisplay.tsx', 'shared/keys/keysPages.tsx', 'i11aRhodes/pages.tsx', 'i11bWurlitzer/pages.tsx']) {
      const t = strip(read(`src/screens/lab/miking/lessons/${f}`));
      assert.doesNotMatch(t, KEYS_NAMES, f);
      assert.doesNotMatch(t, /withRepeat\(|useFrameCallback\(|setInterval\(|expo-audio|startFenced/, f);
    }
  });
  it('the speaker module is linked from the speaker step', () => {
    assert.match(read('src/screens/lab/miking/lessons/shared/keys/keysPages.tsx'), /StackActions\.push\('MikingLesson', \{ id: 'SPK' \}\)/);
  });
});
