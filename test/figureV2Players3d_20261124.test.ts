/**
 * FIGURE V2 — THE PLAYERS, SET 3d (wave 3 of D78, 2026-11-24): the tonbak
 * player on a chair (M12, Kofi) and the tabla player cross-legged on the
 * floor, barefoot (M13, Ana). Pins: the hands lie on the heads where the
 * lessons' drums are (nothing the lesson measures moved), palms toward the
 * heads; the tabla player wears no shoes (the shoes are hidden inside the
 * seat; the feet are drawn bare), the legs fold at the knee to ankles near the
 * floor; both lessons opt in under `sidePlayers`; the hand-drum strike page
 * gives its picture the figure's scale.
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const CAST = await import('../src/screens/lab/miking/lessons/shared/figureV2/cast.ts');
const TON = await import('../src/screens/lab/miking/lessons/m12Tonbak/tonbakV2.ts');
const TG = await import('../src/screens/lab/miking/lessons/m12Tonbak/geometry.ts');
const TM = await import('../src/screens/lab/miking/lessons/m12Tonbak/model.ts');
const TAB = await import('../src/screens/lab/miking/lessons/m13Tabla/tablaV2.ts');
const TBG = await import('../src/screens/lab/miking/lessons/m13Tabla/geometry.ts');
const TBA = await import('../src/screens/lab/miking/lessons/m13Tabla/art.tsx');

const area = (p: { u: number; v: number }[]) => Math.abs(p.reduce((s, a, i) => { const b = p[(i + 1) % p.length]; return s + a.u * b.v - b.u * a.v; }, 0)) / 2;

describe('figure V2 players (set 3d)', () => {
  it('one cast member per lesson', () => {
    assert.equal(CAST.ROLES['player.tonbak'], 'kofi');
    assert.equal(CAST.ROLES['player.tabla'], 'ana');
  });

  it('M12: the drum where the lesson puts it; the right hand on the head’s face, the left on the drum’s top at the head’s rim', () => {
    assert.deepEqual(TG.T_H0, { x: 0, y: -620, z: 0 });
    const p = TON.tonbakSidePlan();
    const R = p.arms.near.placed!;
    const L = p.arms.far.placed!;
    assert.ok(R && L, 'both hands drawn');
    assert.equal(R.art.view, 'restTop', 'the back of the right hand to the camera');
    assert.equal(L.art.view, 'restFlatThumb');
    // the right hand's fingers reach onto the head's face (inside its face-on ellipse)
    const tip = R.at({ u: 150, v: 0 });
    const inHead = ((tip.u - TG.T_H0.x) / TM.T_R) ** 2 + ((tip.v - TG.T_H0.y) / (TM.T_R * 0.954)) ** 2 < 1;
    assert.ok(inHead, `fingertips at ${tip.u.toFixed(0)}, ${tip.v.toFixed(0)}`);
    // the left hand's palm line lies at the head's top edge (± 20 mm)
    const headTop = TG.T_H0.y - TM.T_R * 0.954;
    const palm = L.at({ u: 60, v: 27 });
    assert.ok(Math.abs(palm.v - headTop) < 20, `palm at ${palm.v.toFixed(0)}, head top ${headTop.toFixed(0)}`);
    const top = TON.tonbakTopPlan();
    assert.ok(top.arms.near.placed && top.arms.far.placed, 'both hands drawn from above');
  });

  it('(KeysGuitar3) M12: the far arm reads whole — its elbow drawn up and forward of the near elbow, the far sleeve not cut to a spike', () => {
    const p = TON.tonbakSidePlan();
    const e = p.arms.far.elbow;
    const n = p.arms.near.elbow;
    assert.ok(e.u > n.u + 40 && e.v < n.v - 80, `far elbow ${e.u},${e.v} vs near ${n.u},${n.v}`);
    assert.match(read('src/screens/lab/miking/lessons/m12Tonbak/tonbakV2.ts'), /nod: 10, farBehind: false \}\)/);
  });

  it('M13: the hands on the heads at the lesson’s own wrists, palms toward the heads', () => {
    const fs = TAB.tablaSide();
    const pose = TBA.tablaPose('side');
    for (const [a, h, d] of [[fs.plan.arms.near, pose.handR, TBG.DAYAN], [fs.plan.arms.far, pose.handL, TBG.BAYAN]] as const) {
      const pl = a.placed!;
      assert.ok(pl, 'hand drawn');
      assert.ok(Math.hypot(pl.wrist.u - h.wrist.u, pl.wrist.v - h.wrist.v) < 0.5, 'at the lesson’s wrist');
      // local +y (the palm's side) points into the head: against the head's outward normal
      const y = pl.at({ u: 0, v: 10 });
      const n = { u: d.u.x, v: d.u.y };
      assert.ok((y.u - pl.wrist.u) * n.u + (y.v - pl.wrist.v) * n.v < 0, 'palm toward the head');
    }
    assert.deepEqual([TBG.DAYAN.H.x, TBG.DAYAN.H.z, TBG.BAYAN.H.x, TBG.BAYAN.H.z].map((q) => Math.round(q * 10) / 10), [40.5, 150, 19.5, -170]);
  });

  it('M13: barefoot and cross-legged — the shoes hidden, the legs folded to ankles near the floor, the feet drawn bare', () => {
    const fs = TAB.tablaSide();
    for (const s of [fs.plan.shoes.near, fs.plan.shoes.far]) assert.ok(area(s.upper) < 1 && area(s.sole) < 1, 'no shoe drawn');
    for (const l of [fs.plan.legs.near, fs.plan.legs.far]) {
      assert.ok(l.ankle.v > -80 && l.ankle.v < 0, 'ankle near the floor');
      assert.ok(l.knee.u > l.ankle.u, 'the shin folds back from the knee');
    }
    assert.ok(area(fs.heel.outline) > 3000 && area(fs.toes.outline) > 3000, 'the bare feet');
    const top = TAB.tablaTop();
    assert.equal(top.feet.length, 2);
    assert.ok(top.plan.arms.near.placed && top.plan.arms.far.placed);
  });

  it('both lessons opt in at their call sites; the strike page gives the picture its scale', () => {
    for (const p of ['m12Tonbak/art.tsx', 'm13Tabla/art.tsx']) {
      const src = read(`src/screens/lab/miking/lessons/${p}`);
      assert.match(src, /figureV2On\('sidePlayers'\)/, p);
      assert.match(src, /v2 = V2/, p);
    }
    assert.match(read('src/screens/lab/miking/lessons/shared/hand/HandStrike.tsx'), /<FigureScale ptPerMm=\{xf\.s\}>/);
  });
});
