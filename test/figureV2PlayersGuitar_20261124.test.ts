/**
 * FIGURE V2 — THE GUITAR FAMILY'S PLAYERS (wave 3, set 3c of D78,
 * 2026-11-24): C01 guitar, C03 resonator, C05a banjo, C05b mandolin, C05c
 * ukulele, C07 acoustic bass drawn as cast members on the shared "player who
 * holds an instrument" renderer. Pins: each lesson opts in (E07 does not yet);
 * one person per lesson; the picking hand per instrument lands every pad on its
 * string; the passed flat-pick hand and fretting hand are kept exactly (the
 * fretting hand's pads stay where the passed quarter-turned view put them);
 * nothing of the scene's model (anchors, envelopes) is read differently.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const L = 'src/screens/lab/miking/lessons';

const CAST = await import('../src/screens/lab/miking/lessons/shared/figureV2/cast.ts');
const GP = await import('../src/screens/lab/miking/lessons/shared/guitars/guitarPlayer.ts');
const V = await import('../src/screens/lab/miking/lessons/shared/guitars/guitarPlayerV2.ts');
const HM = await import('../src/screens/lab/miking/lessons/shared/players/handModel.ts');
const PH = await import('../src/screens/lab/miking/lessons/shared/guitars/pluckHands.ts');
const HP = await import('../src/screens/lab/miking/lessons/shared/players/handPoses.ts');

const LESSONS = { c01Guitar: 'C01_BUILT', c03Resonator: 'C03_BUILT', c05aBanjo: 'C05A_BUILT', c05bMandolin: 'C05B_BUILT', c05cUkulele: 'C05C_BUILT', c07AcousticBass: 'C07_BUILT' } as const;
const built: Record<string, { scenes: Record<string, unknown> }> = {};
for (const [d, k] of Object.entries(LESSONS)) built[d] = (await import(`../src/screens/lab/miking/lessons/${d}/geometry.ts`))[k];

describe('figure V2 — the guitar family (set 3c)', () => {
  it('each guitar-family lesson opts in at its call sites; E07 (converted whole, 2026-11-24) passes v2 too', () => {
    for (const d of Object.keys(LESSONS)) {
      const src = read(`${L}/${d}/art.tsx`);
      assert.match(src, /figureV2On\('sidePlayers'\)/, d);
      assert.match(src, /makeGuitarArt\(\w+, \{ zones: \w+, v2: V2 \}\)/, d);
      assert.match(src, /makeStagePlanPage\(\w+, \{ plan: [^}]*v2: V2 \}\)/, d);
    }
    assert.match(read(`${L}/e07SingerInstrument/art.tsx`), /makeGuitarArt\(E07_GUITAR, \{ zones: E07_GUITAR_ZONES, v2: V2 \}\)/);
    // the shared drawing defaults to the old look
    assert.match(read(`${L}/shared/guitars/GuitarArt.tsx`), /v2 = false, assumePtPerMm/);
  });

  it('one cast member per lesson (roles fixed)', () => {
    const R = CAST.ROLES as Record<string, string>;
    assert.deepEqual(['player.guitar', 'player.resonator', 'player.banjo', 'player.mandolin', 'player.ukulele', 'player.acousticBass'].map((k) => R[k]), ['kofi', 'drummer', 'ana', 'mei', 'ruth', 'kofi']);
  });

  it('the picking hand is the instrument’s own technique: every pad on its string, the wrist easy, the arm hanging', () => {
    // (follow-up 2026-11-24: the picking hands read as blocks — clenched fists bent 47–64° at the wrist, the
    // forearm straight at the audience; re-posed: loosely curled fanned fingers, the wrist in line with an adult
    // arm hanging from the shoulder over the bout)
    const want: Record<string, string> = { steel: 'flat', twelve: 'flat', nylon: 'classical', round: 'fingerpicks', reso: 'banjo', open: 'banjo', a: 'flat', f: 'flat', soprano: 'uke', bass: 'bass' };
    for (const B of Object.values(built)) {
      for (const [vid, sc0] of Object.entries(B.scenes)) {
        const sc = sc0 as Parameters<typeof V.pickStyleOf>[0];
        if (sc.o.lap) continue;
        const style = V.pickStyleOf(sc);
        assert.equal(style, want[vid], vid);
        const F = GP.guitarPlayerPose(sc, 'side');
        const h = PH.pickHandOf(sc, style, F);
        for (const m of h.sk.miss) assert.ok(m <= 1.5, `${vid}: a pad misses by ${m.toFixed(1)} mm`);
        const e = h.elbow;
        const w = h.sk.frame.o;
        assert.ok(HM.wristBendDeg(h.sk, e) <= 30, `${vid}: the wrist bent ${HM.wristBendDeg(h.sk, e).toFixed(0)}°`);
        assert.ok(Math.abs(Math.hypot(w.x - e.x, w.y - e.y, w.z - e.z) - 260) < 40, `${vid}: an adult forearm`);
        assert.ok(e.y > F.shoulderR.v + 50, `${vid}: the elbow below the shoulder`);
        if (style === 'flat') {
          assert.ok(h.pick, `${vid}: a flat pick`);
          // the pick pinched between the thumb's pad and the index
          const c = { x: (h.pick!.a.x + h.pick!.b.x) / 2, y: (h.pick!.a.y + h.pick!.b.y) / 2, z: (h.pick!.a.z + h.pick!.b.z) / 2 };
          const t = h.sk.thumb.joints[h.sk.thumb.joints.length - 1];
          assert.ok(Math.hypot(t.x - c.x, t.y - c.y, t.z - c.z) < 16, `${vid}: the thumb on the pick`);
        }
      }
    }
  });

  it('the fretting hand keeps the passed pads (each on its string behind its fret), the wrist easy', () => {
    for (const B of Object.values(built)) {
      for (const sc0 of Object.values(B.scenes)) {
        const sc = sc0 as Parameters<typeof V.guitarFamParts>[0];
        if (sc.o.lap) continue;
        const F = GP.guitarPlayerPose(sc, 'side');
        const old = F.handL.posed!;
        const top = V.guitarFamParts(sc, 'top').L;
        const H = sc.g.h((GP.fretTips(sc.g.L)[1] + GP.fretTips(sc.g.L)[2]) / 2);
        old.sk.fingers.forEach((f, i) => {
          const a = f.joints[f.joints.length - 1];
          const b = top.sk.fingers[i].joints[top.sk.fingers[i].joints.length - 1];
          assert.ok(Math.hypot(a.x - b.x, a.y - b.y, a.z + H - b.z) < 1.6, `pad ${i}: ${Math.hypot(a.x - b.x, a.y - b.y, a.z + H - b.z).toFixed(1)} mm`);
        });
        assert.ok(HM.wristBendDeg(top.sk, top.elbow) <= 30.5, `the fretting wrist bent ${HM.wristBendDeg(top.sk, top.elbow).toFixed(0)}°`);
        // the elbow hangs by the side, never swung up or in across the body
        assert.ok(top.elbow.y > top.shoulder.y + 150, 'the fretting elbow hangs');
      }
    }
    void HP;
  });

  it('PROBE', () => {
    const f = (q: { x: number; y: number; z: number }) => `(${q.x.toFixed(0)},${q.y.toFixed(0)},${q.z.toFixed(0)})`;
    const h3m = (q: { x: number; y: number; z: number }) => ({ x: q.x * 100, y: q.y * 100, z: q.z * 100 });
    const d = (a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z).toFixed(0);
    for (const [ln, B] of Object.entries(built)) {
      for (const [vid, sc0] of Object.entries(B.scenes)) {
        const sc = sc0 as Parameters<typeof V.guitarFamParts>[0];
        const p = V.guitarFamParts(sc, 'front');
        const pt = V.guitarFamParts(sc, 'top');
        for (const side of ['L', 'R'] as const) {
          const a = p[side];
          const w = a.sk.frame.o;
          console.log(ln, vid, side, 'sh', f(a.shoulder), 'el', f(a.elbow), 'wr', f(w), 'U', d(a.shoulder, a.elbow), 'F', d(a.elbow, w), 'bend', HM.wristBendDeg(a.sk, a.elbow).toFixed(0), 'topEl', f(pt[side].elbow));
        }
        const tk = pt.L.sk;
        console.log(ln, vid, 'Ltop fx', f(h3m(tk.frame.x)), 'fz', f(h3m(tk.frame.z)), 'pads', tk.fingers.map((q) => f(q.joints[q.joints.length - 1])).join(' '), 'thumb', f(tk.thumb.joints[tk.thumb.joints.length - 1]), 'bendTop', HM.wristBendDeg(tk, pt.L.elbow).toFixed(0));
        console.log(ln, vid, 'head', f(p.s.head), 'neck', f(p.s.neck), 'pelvis', f(p.s.pelvis), 'floor', sc.floorY);
      }
    }
  });

  it('the lap steel keeps its passed bar and picking hands (read into the renderer’s frame)', () => {
    const sc = built.c03Resonator.scenes.lap as Parameters<typeof V.guitarFamParts>[0];
    const l3 = GP.lapHands(sc);
    const p = V.guitarFamParts(sc, 'front');
    const q = l3.L.fingers[0].joints[3];
    const r = p.L.sk.fingers[0].joints[3];
    assert.deepEqual([r.x, r.y, r.z].map((n) => +n.toFixed(6)), [q.x, -q.z, q.y].map((n) => +n.toFixed(6)));
  });
});
