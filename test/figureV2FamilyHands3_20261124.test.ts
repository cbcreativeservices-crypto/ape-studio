import './_mikingTsxLoader.ts';
import { describe, it } from 'node:test';

const R = <T>(m: T): T => (m as { default?: T }).default ?? m;
const FV = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/familyV2.tsx'));
const GP = R(await import('../src/screens/lab/miking/lessons/shared/guitars/guitarPlayerV2.ts'));
const C01 = R(await import('../src/screens/lab/miking/lessons/c01Guitar/geometry.ts'));
const CAST = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/cast.ts'));

const HP = R(await import('../src/screens/lab/miking/lessons/c10Harp/harpistPose.ts'));
const FH = R(await import('../src/screens/lab/miking/lessons/shared/figureV2/familyHand.ts'));
const TRI = R(await import('../src/screens/lab/miking/lessons/i06aTriangle/playerV2.ts'));
const MP = R(await import('../src/screens/lab/miking/lessons/shared/metal/MetalPlayerV2.tsx'));
const BP = R(await import('../src/screens/lab/miking/lessons/shared/brass/brassPosture.ts'));
const BS = R(await import('../src/screens/lab/miking/lessons/shared/brass/brassSpec.ts'));
describe('diag trumpet', () => {
  it('trumpet R', () => {
    const f = (n: number) => n.toFixed(0);
    const P = BP.valvedPose(BS.TRUMPET);
    const keys = Object.keys(P);
    console.log('keys', keys.join(','));
    const hands = (P as { hands?: Record<string, { sk: { frame: unknown; fingers: { name: string; r: number[]; joints: { x: number; y: number; z: number }[] }[]; thumb: { joints: { x: number; y: number; z: number }[] } } }> }).hands;
    if (!hands) return;
    const sk = hands.R.sk;
    console.log('frame', JSON.stringify(sk.frame));
    for (const d of [...sk.fingers, { ...sk.thumb, name: 'thumb', r: [] }]) console.log(d.name, d.joints.map((q) => `${f(q.x)},${f(q.y)},${f(q.z)}`).join(' | '), d.r.map((x: number) => x.toFixed(1)).join(','));
  });
});
describe('diag fist', () => {
  it('triangle fist', () => {
    const f = (n: number) => n.toFixed(0);
    const fp = MP.metalPlan(TRI.triFig('front', 'mounted'), 'metal.triangle');
    for (const a of fp.arms) {
      const sk = (TRI.triFig('front', 'mounted').arms as Record<string, { sk: { fingers: { name: string; joints: { x: number; y: number; z: number }[] }[] } }>)[a.side].sk;
      console.log('ARM', a.side);
      for (const d of sk.fingers) console.log(d.name, d.joints.map((q) => `${f(q.x)},${f(q.y)},${f(q.z)}`).join(' | '));
      for (const p of a.hand.parts) console.log(' part', p.name, p.layer, f(p.depth), p.pieces.length);
    }
  });
});
describe('diag harp', () => {
  it('harp hands', () => {
    const f = (n: number) => n.toFixed(0);
    for (const w of ['R', 'L'] as const) {
      const sk = HP.harpHands(false)[w].sk;
      console.log('HAND', w, 'frame x', JSON.stringify(sk.frame.x), 'z', JSON.stringify(sk.frame.z));
      for (const d of [...sk.fingers, sk.thumb]) console.log(d.name, d.joints.map((q: { x: number; y: number; z: number }) => `${f(q.x)},${f(q.y)},${f(q.z)}`).join(' | '));
      const h = FH.familyHand(sk, (p: { x: number; y: number; z: number }) => ({ u: p.x, v: p.y, d: p.z }), `diag${w}`, {});
      for (const p of h.parts) console.log(' part', p.name, p.layer, f(p.depth), p.pieces.length);
    }
  });
});
describe('diag', () => {
  it('guitar fretting hand parts', () => {
    const fi = GP.guitarFamIn(C01.C01_BUILT.scenes.steel, 'side', CAST.castFor('lute.oud'));
    const fp = FV.famPlan(fi);
    const a = fp.arms.find((x: { side: string }) => x.side === 'L');
    const f = (n: number) => n.toFixed(1);
    console.log('handFront', a.handFront, 'cut', JSON.stringify(fi.arms.L.cut));
    for (const d of fi.arms.L.sk.fingers) console.log(d.name, d.joints.map((q: { x: number; y: number; z: number }) => `${f(q.x)},${f(q.y)},${f(q.z)}`).join(' | '));
    console.log('shoulder', f(a.arm.shoulder.u), f(a.arm.shoulder.v), 'elbow', f(a.arm.elbow.u), f(a.arm.elbow.v), 'wrist', f(a.arm.wrist.u), f(a.arm.wrist.v), 'f0', a.f0 && f(a.f0.u), a.f0 && f(a.f0.v), 'cap', !!a.cap, !!a.capTop);
    console.log('capHide', (a.capHide ?? []).map((pl: { u: number; v: number }[]) => pl.map((q) => `${f(q.u)},${f(q.v)}`).join(' ')).join(' || '));
    for (const p of a.hand.parts) {
      const us = p.pieces.flat().map((q: { u: number }) => q.u);
      const vs = p.pieces.flat().map((q: { v: number }) => q.v);
      console.log(p.name, p.layer, f(p.depth), 'u', f(Math.min(...us)), f(Math.max(...us)), 'v', f(Math.min(...vs)), f(Math.max(...vs)));
    }
  });
});
