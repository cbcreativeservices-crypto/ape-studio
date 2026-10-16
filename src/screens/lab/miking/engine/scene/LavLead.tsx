/**
 * A BODY MIC'S CABLE (art fix 2026-10-16, Lab 7 body mics: the lav sat on the
 * shirt with no cable to a pack — graded "the lav floats"). When a clip mic
 * is clipped to a rim that has a `lead` (Rim.lead: the lesson's route under
 * the clothes to the bodypack), the scene draws its cable: out of the
 * capsule's tail past the clip, a small loop of spare cable under it (the
 * broadcast loop), then in under the shirt — dashed from there on, the way
 * every body-worn drawing marks a hidden run — down the chest, round the
 * waist and up into the pack's input. The pack itself is the lesson's art.
 *
 * Drawn at a constant screen weight (a 3 mm cable is under a pixel on a set
 * drawn metres wide): about 2.2 px solid, 2 px dashed. It follows the mic as
 * it is dragged (the rim it clips to is found the way the clip arm is,
 * collision.assembly). Static otherwise (D8).
 */
import { DashPathEffect, Group, Path, Skia } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import type { MicPose, MicSlot, ViewId } from '../model/types.ts';
import { assembly } from '../geometry/collision.ts';
import type { ViewXform } from '../geometry/frame.ts';
import type { Rig } from './useRig.ts';

export function LavLead({ rig, slot, pose, view, xf }: { rig: Rig; slot: MicSlot; pose: SharedValue<MicPose>; view: ViewId; xf: SharedValue<ViewXform> }) {
  const scene = rig.scene;
  const body = rig.body[slot];
  const has = body.mount === 'clip' && (scene.rims ?? []).some((r) => r.lead && r.lead.length > 0);
  const paths = useDerivedValue(() => {
    const out = Skia.Path.Make();
    const under = Skia.Path.Make();
    if (!has) return { out, under };
    const segs = assembly(scene, pose.value, body);
    for (let i = 0; i < segs.length; i++) {
      if (segs[i].piece !== 'arm') continue;
      const a = segs[i].a;
      const b = segs[i].b;
      const rims = scene.rims ?? [];
      for (let k = 0; k < rims.length; k++) {
        const r = rims[k];
        const lead = r.lead;
        if (!lead || lead.length === 0) continue;
        if (Math.abs(r.c.x - b.x) + Math.abs(r.c.y - b.y) + Math.abs(r.c.z - b.z) > 1) continue;
        const V = (p: { y: number; z: number }) => (view === 'side' ? p.y : p.z);
        const e = lead[0];
        // Out of the capsule's tail, past the clip, a small loop below it
        // (away from the body, +x), then in at the shirt.
        out.moveTo(a.x, V(a));
        out.lineTo(b.x, V(b));
        const lv = V(b) + (view === 'side' ? 22 : 0);
        out.lineTo(b.x - 1, lv);
        out.cubicTo(b.x + 26, lv + 18, b.x + 24, lv + 52, b.x + 4, lv + 50);
        out.cubicTo(b.x - 10, lv + 48, e.x + 6, V(e) - 14, e.x, V(e));
        // Under the clothes: through the route, its corners rounded.
        under.moveTo(e.x, V(e));
        for (let j = 1; j < lead.length; j++) {
          const p = lead[j];
          if (j < lead.length - 1) {
            const q = lead[j + 1];
            under.quadTo(p.x, V(p), (p.x + q.x) / 2, (V(p) + V(q)) / 2);
          } else {
            under.lineTo(p.x, V(p));
          }
        }
        return { out, under };
      }
    }
    return { out, under };
  });
  const dOut = useDerivedValue(() => paths.value.out);
  const dUnder = useDerivedValue(() => paths.value.under);
  const wEdge = useDerivedValue(() => 3.6 / xf.value.s);
  const wOut = useDerivedValue(() => 2.2 / xf.value.s);
  const wUnder = useDerivedValue(() => 2 / xf.value.s);
  const dash = useDerivedValue(() => [7 / xf.value.s, 5 / xf.value.s]);
  if (!has) return null;
  return (
    <Group>
      <Path path={dUnder} style="stroke" strokeWidth={wUnder} strokeCap="round" strokeJoin="round" color="#9aa0aa" opacity={0.8}>
        <DashPathEffect intervals={dash} />
      </Path>
      <Path path={dOut} style="stroke" strokeWidth={wEdge} strokeCap="round" strokeJoin="round" color="#08090b" />
      <Path path={dOut} style="stroke" strokeWidth={wOut} strokeCap="round" strokeJoin="round" color="#5a5e68" />
    </Group>
  );
}
