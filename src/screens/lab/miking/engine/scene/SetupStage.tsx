/**
 * A STARTING SETUP drawn on the instrument (owner restructure 2026-10-06):
 * the lesson's own art with the setup's mic(s) at their starting points —
 * each mic's generic drawing, its stand, boom or clip (the same mount the
 * collision model uses, so nothing floats and the stand stands on the floor),
 * its pickup shape, its AIM (amber, dashed, with an arrowhead) and its
 * DISTANCE as a dimension (white, ticked, with the number) to the surface its
 * starting point is measured from. Only the setup's own zones are drawn. The
 * view is framed to the instrument plus the whole setup, so the mic and its
 * distance are always on the glass. Not dragged (pinch / the full-screen zoom
 * still work): it is a worked example, the Placement Studio is where the
 * learner moves a mic.
 */
import { useEffect, useMemo } from 'react';
import type { ViewBox, ViewId, Vec3 } from '../model/types.ts';
import type { LessonArt } from './sceneTypes.ts';
import type { StartingSetup } from '../setups.ts';
import { useRig } from './useRig.ts';
import { DualView } from './DualView';
import { assembly } from '../geometry/collision.ts';
import { guideFor } from '../geometry/guides.ts';
import { setupFrame } from '../geometry/contentFrame.ts';
import { viewsOf } from '../model/types.ts';
import { aimVec } from '../geometry/vec.ts';
import { sceneLabel } from './sceneWords.ts';
import type { Lesson } from '../model/types.ts';

export function SetupStage({ lesson, art, setup, view, setView, w, h, label }: { lesson: Lesson; art: LessonArt; setup: StartingSetup; view: ViewId; setView: (v: ViewId) => void; w: number; h: number; label: string }) {
  const rig = useRig(lesson, {
    variant: setup.variant,
    mics: setup.mics.map((m) => ({ slot: m.slot, typeId: m.typeId, pattern: m.pattern, pose: m.pose, polarity: m.polarity, surfaceId: m.surfaceId })),
  });
  const first = setup.mics[0];
  useEffect(() => {
    if (first && rig.surfaceId !== first.surfaceId) rig.setSurfaceId(first.surfaceId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [first?.surfaceId]);
  const slots = setup.mics.map((m) => m.slot);
  const model = lesson.model;
  // Every point the setup draws: each mic's front and tail, its mount down to
  // the floor, and the point its distance is measured to.
  const key = rig.mics.map((m) => `${m.slot}:${m.pose.p.x},${m.pose.p.y},${m.pose.p.z},${m.pose.az},${m.pose.el}`).join(';');
  const frames = useMemo(() => {
    const pts: Vec3[] = [];
    for (const m of rig.mics) {
      if (!slots.includes(m.slot)) continue;
      const body = rig.body[m.slot];
      const a = aimVec(m.pose.az, m.pose.el);
      pts.push(m.pose.p, { x: m.pose.p.x - a.x * body.length, y: m.pose.p.y - a.y * body.length, z: m.pose.p.z - a.z * body.length });
      for (const s of assembly(rig.scene, m.pose, body)) pts.push(s.a, s.b);
      const sf = model.surfaces.find((q) => q.id === rig.refOf(m.slot).surfaceId);
      if (sf) {
        const g = guideFor(sf, m.pose);
        pts.push(g.foot, g.aimEnd);
      }
    }
    const v = viewsOf(model, rig.variant);
    const out: { side?: ViewBox; top?: ViewBox } = {};
    if (v.side) out.side = setupFrame(model, rig.variant, 'side', pts);
    if (v.top) out.top = setupFrame(model, rig.variant, 'top', pts);
    // Side and top share x (the full-screen pair lines up on one scale).
    if (out.side && out.top) {
      const u0 = Math.min(out.side.u0, out.top.u0);
      const u1 = Math.max(out.side.u1, out.top.u1);
      out.side = { ...out.side, u0, u1 };
      out.top = { ...out.top, u0, u1 };
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- by the committed poses
  }, [key, rig.variant, rig.scene, model]);
  return (
    <DualView
      rig={rig}
      art={art}
      view={view}
      setView={setView}
      w={w}
      h={h}
      slots={slots}
      interactive={false}
      showLive={false}
      zoneIds={setup.zones.map((z) => z.id)}
      guides
      frames={frames}
      labelFor={(v) => sceneLabel(rig, v, slots, label)}
    />
  );
}
