/**
 * THE CAMERA FRAME — the look (charter §2 layer 3). Lab 7 group 2 (B04, B02);
 * group 3 reuses it. The model is cameraFrame.ts; the camera body is the
 * location kit's (shared/field/LocationArt: CameraRig — a video camera on a
 * fluid head and tripod), placed from a BroadcastCamera. Static (D8).
 *
 *   cameraSpec(cam, floor)   the location kit's CameraSpec for a camera
 *                            (its body box behind the lens point);
 *   BroadcastCameraRig       the camera on its tripod — turned, from above,
 *                            when it does not look along −x;
 *   FrameWedge               the frame's edges from the lens (dashed), the
 *                            shot as a faint area, and — from the side — the
 *                            HEADROOM band above the talker's head (red,
 *                            faint): where a boom would show in the picture.
 */
import { useMemo } from 'react';
import { DashPathEffect, Group, Path, Skia } from '@shopify/react-native-skia';
import type { ViewId, Vec3 } from '../../../engine/model/types.ts';
import { CameraRig, type CameraSpec } from '../field/LocationArt';
import { cameraAxes, cameraBody, frameEdgeRays, type BroadcastCamera } from './cameraFrame.ts';

const make = () => Skia.Path.Make();
const RED = '#ff6b5e';
const vOf = (view: ViewId, p: Vec3) => (view === 'side' ? p.y : p.z);

/** The camera body behind the lens (a drawing default: 32 cm long, 19 cm
 *  tall, 16 cm wide — the location kit's camera). For a camera looking
 *  along −x; others are turned from above by BroadcastCameraRig. */
export function cameraSpec(cam: BroadcastCamera, floor: number, spread = 520): CameraSpec {
  return { box: cameraBody(cam), lens: cam.lens, floor, spread };
}

export function BroadcastCameraRig({ view, cam, floor }: { view: ViewId; cam: BroadcastCamera; floor: number }) {
  const spec = useMemo(() => cameraSpec(cam, floor), [cam, floor]);
  if (view === 'side' || Math.abs(cam.yawDeg - 180) < 0.5 || Math.abs(cam.yawDeg + 180) < 0.5) return <CameraRig view={view} spec={spec} />;
  // From above, turn the rig about its lens so the lens points along the yaw.
  const turn = ((cam.yawDeg - 180) * Math.PI) / 180;
  return (
    <Group transform={[{ translateX: cam.lens.x }, { translateY: cam.lens.z }, { rotate: turn }, { translateX: -cam.lens.x }, { translateY: -cam.lens.z }]}>
      <CameraRig view={view} spec={spec} />
    </Group>
  );
}

/** The frame from the lens out to `reach` mm: dashed edges, the shot faint,
 *  and from the side the headroom band (between the ray to `headTop` and the
 *  top edge, from `from` mm out). */
export function FrameWedge({ view, cam, reach, headTop, show = 'all' }: { view: ViewId; cam: BroadcastCamera; reach: number; headTop?: Vec3; show?: 'all' | 'lines' }) {
  const p = useMemo(() => {
    const edges = make();
    const area = make();
    const band = make();
    const rays = frameEdgeRays(cam, view, reach);
    const L = cam.lens;
    for (const r of rays) {
      edges.moveTo(r.a.x, vOf(view, r.a));
      edges.lineTo(r.b.x, vOf(view, r.b));
    }
    area.moveTo(L.x, vOf(view, L));
    area.lineTo(rays[0].b.x, vOf(view, rays[0].b));
    area.lineTo(rays[1].b.x, vOf(view, rays[1].b));
    area.close();
    if (view === 'side' && headTop) {
      // The headroom: from 40 cm out from the lens to the far end, between
      // the top edge and the ray through the head's top.
      const top = rays.find((r) => r.edge === 'top')!;
      const { fwd } = cameraAxes(cam);
      const d = { x: headTop.x - L.x, y: headTop.y - L.y };
      const dl = Math.hypot(d.x, d.y) || 1;
      const tdir = { x: (top.b.x - L.x) / reach, y: (top.b.y - L.y) / reach };
      const f0 = 400;
      const at = (dir: { x: number; y: number }, k: number) => ({ x: L.x + dir.x * k, y: L.y + dir.y * k });
      const hdir = { x: d.x / dl, y: d.y / dl };
      // Scale each ray so both reach the same forward distance.
      const kOf = (dir: { x: number; y: number }, f: number) => f / Math.max(1e-6, dir.x * fwd.x + dir.y * fwd.y);
      const fEnd = reach * (tdir.x * fwd.x + tdir.y * fwd.y);
      const a0 = at(tdir, kOf(tdir, f0));
      const a1 = at(tdir, kOf(tdir, fEnd));
      const b1 = at(hdir, kOf(hdir, fEnd));
      const b0 = at(hdir, kOf(hdir, f0));
      band.moveTo(a0.x, a0.y);
      band.lineTo(a1.x, a1.y);
      band.lineTo(b1.x, b1.y);
      band.lineTo(b0.x, b0.y);
      band.close();
    }
    return { edges, area, band };
  }, [view, cam, reach, headTop]);
  return (
    <Group>
      {show === 'all' ? <Path path={p.area} color="#e8eaee" opacity={0.035} /> : null}
      {show === 'all' && view === 'side' && headTop ? <Path path={p.band} color={RED} opacity={0.09} /> : null}
      <Path path={p.edges} style="stroke" strokeWidth={5} color="#e8eaee" opacity={0.55}>
        <DashPathEffect intervals={[26, 16]} />
      </Path>
    </Group>
  );
}
