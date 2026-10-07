/**
 * Miking Labs — every placement FADER moves the mic from where a page puts
 * it (owner, Pixel 7 Pro, 2026-10-06: "many of them their sliders are not
 * working").
 *
 * The POSITION and AIM faders (engine/scene/placementDock.ts) move the mic
 * through `constrainMove`, which stops a move at the last clear pose. A mic
 * whose starting pose has ANY rotation blocked by its own clamp, boom or a
 * neighbouring part therefore had an AIM fader that did nothing in either
 * direction — a dead control (the congas, timbales and djembe were stuck at
 * their zone starts). For every lesson, every recommended starting point and
 * every mic type that zone allows, this test asks the same question the
 * learner's thumb does: from the start pose, does each fader move the mic in
 * at least one direction?
 */
import './_mikingTsxLoader.ts';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const R = <T,>(m: T): T => ((m as { default?: T }).default ?? m);
const { LESSONS } = R(await import('../src/screens/lab/miking/data/registry.ts'));
const { lessonById } = R(await import('../src/screens/lab/miking/data/lessons.ts'));
const { compileScene, constrainMove, pinToSurface } = R(await import('../src/screens/lab/miking/engine/geometry/collision.ts'));
const { boundsOf } = R(await import('../src/screens/lab/miking/engine/scene/useRig.ts'));
const { micType } = R(await import('../src/screens/lab/miking/data/micTypes.ts'));
const { micBodyOf } = R(await import('../src/screens/lab/miking/engine/model/validate.ts'));

type Pose = { p: { x: number; y: number; z: number }; az: number; el: number };
const same = (a: Pose, b: Pose) => Math.abs(a.p.x - b.p.x) + Math.abs(a.p.y - b.p.y) + Math.abs(a.p.z - b.p.z) < 0.5 && Math.abs(a.az - b.az) + Math.abs(a.el - b.el) < 0.5;

export function stuckFaders(): string[] {
  const out: string[] = [];
  for (const { id } of LESSONS as { id: string }[]) {
    const L = lessonById(id);
    if (!L) continue;
    for (const z of L.zones) {
      const variants: string[] = z.requires?.variants ?? (z.requires?.variant ? [z.requires.variant] : L.model.variants.map((v: { id: string }) => v.id));
      const types: string[] = z.requires?.micTypeIds ?? [L.micTypeIds[0]];
      for (const variant of variants) {
        const scene = compileScene(L.model, variant);
        const bounds = boundsOf(L, variant);
        for (const typeId of types) {
          const t = micType(typeId);
          if (z.requires?.mount && z.requires.mount !== t.mount) continue;
          const body = micBodyOf(t);
          let start: Pose = z.start;
          const pinPart = t.mount === 'surface' && t.surfacePartId ? L.model.parts.find((p: { id: string }) => p.id === t.surfacePartId) : null;
          if (pinPart?.solid?.kind === 'box') start = pinToSurface(start, { min: pinPart.solid.min, max: pinPart.solid.max }, body, (t.body.width?.mm ?? 0) / 2);
          const moves = (to: Pose) => !same(constrainMove(scene, body, start, to, bounds).pose, start);
          const where = `${id} ${variant} ${z.id} ${typeId}`;
          if (t.mount !== 'surface') {
            // The AIM lane's own range (placementDock.ts): ±80° about the
            // model's aim home (left–right: ±aimAzLimit).
            const home = L.model.aimHome ?? { az: 0, el: 0 };
            const azLim = L.model.aimAzLimit ?? 80;
            if (!moves({ ...start, el: home.el + 80 }) && !moves({ ...start, el: home.el - 80 })) out.push(`${where}: AIM up–down`);
            if (!moves({ ...start, az: home.az + azLim }) && !moves({ ...start, az: home.az - azLim })) out.push(`${where}: AIM left–right`);
          }
          for (const a of ['x', 'y', 'z'] as const) {
            if (t.mount === 'surface' && a === 'y') continue;
            const d = (k: number) => ({ ...start, p: { ...start.p, [a]: start.p[a] + k } });
            if (!moves(d(60)) && !moves(d(-60))) out.push(`${where}: POSITION ${a}`);
          }
        }
      }
    }
  }
  return out;
}

describe('placement faders move the mic from every recommended starting point', () => {
  it('no AIM or POSITION fader is dead at a zone start', () => {
    assert.deepEqual(stuckFaders(), []);
  });
  it('a mic that starts inside a part can always be moved out (constrainMove escapes)', () => {
    const L = lessonById('C11');
    const scene = compileScene(L.model, 'grand');
    const bounds = boundsOf(L, 'grand');
    const body = micBodyOf(micType('instDynCard'));
    const z = L.zones.find((q: { id: string }) => q.id === 'gp.bass');
    const { checkAssembly } = R(collision);
    // The long dynamic at the bass-strings start touches the raised lid…
    assert.ok(checkAssembly(scene, z.start, body), 'precondition: this start is inside the lid for the long dynamic');
    // …and a pull away from it still moves, and comes out clear.
    const r = constrainMove(scene, body, z.start, { ...z.start, p: { ...z.start.p, y: z.start.p.y + 120 } }, bounds);
    assert.ok(Math.abs(r.pose.p.y - z.start.p.y) > 100, 'moved');
    assert.equal(checkAssembly(scene, r.pose, body), null);
  });
  it('a clear mic is still stopped at the first part it meets', () => {
    const L = lessonById('M01');
    const v = L.model.defaultVariant;
    const scene = compileScene(L.model, v);
    const bounds = boundsOf(L, v);
    const body = micBodyOf(micType(L.micTypeIds[0]));
    const z = L.zones[0];
    // Drive the mic a long way along x: it stops (blocked) or reaches the bound, never inside a part.
    for (const dx of [-3000, 3000]) {
      const r = constrainMove(scene, body, z.start, { ...z.start, p: { ...z.start.p, x: z.start.p.x + dx } }, bounds);
      assert.equal(R(collision).checkAssembly(scene, r.pose, body), null);
    }
  });
});

const collision = await import('../src/screens/lab/miking/engine/geometry/collision.ts');
