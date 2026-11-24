/**
 * FIGURE V2 — the cross-legged person's own pieces, painted in the approved
 * look (floorSeat.ts plans them): the bare feet seen from the side (the near
 * foot's heel, the far foot's toe end) and the crossed legs and feet seen from
 * above. Skin and cloth are the cast member's own materials (FigureLook); the
 * light is the figure's (upper left).
 */
import { memo } from 'react';
import { ColorMatrix, Group, Paint, Path } from '@shopify/react-native-skia';
import { Form, Soft } from './paint';
import { Blur } from './detail';
import { ellipsePath, smoothClosed, smoothOpen } from './paths.ts';
import { useLook } from './look';
import { FAR_DIM } from './FigureV2Side';
import type { FloorSide, FloorTop } from './floorSeat.ts';
import type { Poly } from './geom.ts';

const dim = (k: number) => (
  <Paint>
    <ColorMatrix matrix={[k, 0, 0, 0, 0, 0, k, 0, 0, 0, 0, 0, k, 0, 0, 0, 0, 0, 1, 0]} />
  </Paint>
);
const cl = (p: Poly, t = 0.5) => smoothClosed(p, t);

/** The near foot's heel (under the far knee, behind the near shin's end): drawn before the near leg. */
export const FloorHeelSide = memo(function FloorHeelSide({ fs }: { fs: FloorSide }) {
  const { MAT } = useLook();
  const h = fs.heel;
  const o = cl(h.outline);
  return (
    <Group layer={dim(0.9)}>
      <Soft path={o} opacity={0.4} blur={5} />
      <Form path={o} mat={MAT.skin} round={{ c: h.c, r: 52 }} rim={3} edge={0.8} />
      <Group clip={o}>
        <Path path={cl(h.sole, 0.4)} color={MAT.skin.rim} opacity={0.35} />
        <Path path={ellipsePath(h.bone)} color={MAT.skin.rim} opacity={0.22} />
      </Group>
    </Group>
  );
});

/** The near leg as TWO forms (the shin folded back under the thigh): over the body, the shin a step into
 *  shade under the thigh, the thigh's own lower edge where it lies over the shin, its soft cast shadow. */
export const FloorFoldSide = memo(function FloorFoldSide({ fs }: { fs: FloorSide }) {
  const { MAT } = useLook();
  const thigh = cl(fs.fold.thigh);
  const shin = cl(fs.fold.shin);
  return (
    <Group clip={shin}>
      <Group clip={thigh} invertClip>
        {/* the shin under the thigh: a step darker, darkest just under the thigh's edge */}
        <Path path={shin} color={MAT.trousers.deep} opacity={0.34} />
        <Group transform={[{ translateX: 3 }, { translateY: 10 }]}>
          <Soft path={thigh} color={MAT.trousers.deep} opacity={0.85} blur={8} />
        </Group>
      </Group>
      {/* the thigh's lower edge over the shin */}
      <Path path={thigh} style="stroke" strokeWidth={1.8} color={MAT.trousers.edge} opacity={0.95} />
      <Group transform={[{ translateX: 0 }, { translateY: -1.6 }]}>
        <Group clip={thigh}>
          <Path path={thigh} style="stroke" strokeWidth={2} color={MAT.trousers.rim} opacity={0.18} />
        </Group>
      </Group>
    </Group>
  );
});

/** The left foot's SOLE (under the near knee, turned up and toward the camera): drawn after the near leg —
 *  the heel's round, the arch's shade, the ball's and the heel's pads in the light, the toes in a row along
 *  its front edge (the big toe on top), told apart by notches at their tips and a soft crease at their bases. */
export const FloorToesSide = memo(function FloorToesSide({ fs }: { fs: FloorSide }) {
  const { MAT } = useLook();
  const t = fs.sole;
  const o = cl(t.outline, 0.35);
  return (
    <Group>
      {/* the foot's soft shadow on the floor and on the leg behind it */}
      <Group transform={[{ translateX: 4 }, { translateY: 5 }]}>
        <Soft path={o} opacity={0.4} blur={6} />
      </Group>
      <Form path={o} mat={MAT.skin} round={{ c: t.c, r: 100 }} rim={3} edge={0.8} />
      <Group clip={o}>
        {/* the arch's hollow, in shade */}
        <Path path={cl(t.arch)} color={MAT.skin.deep} opacity={0.35}>
          <Blur mm={6} />
        </Path>
        {/* the pads of the heel and the ball, and each toe's, catching the light (the big toe's most) */}
        {t.pads.map((e, i) => (
          <Path key={`p${i}`} path={ellipsePath(e)} color={MAT.skin.rim} opacity={0.22}>
            <Blur mm={5} />
          </Path>
        ))}
        {t.toePads.map((e, i) => (
          <Path key={`t${i}`} path={ellipsePath(e)} color={MAT.skin.rim} opacity={0.12 + i * 0.03}>
            <Blur mm={1.6} />
          </Path>
        ))}
        {/* the crease where the toes leave the ball, and the short gaps from the tips */}
        <Path path={smoothOpen(t.toeLine)} style="stroke" strokeWidth={1.1} strokeCap="round" color={MAT.skin.deep} opacity={0.22}>
          <Blur mm={0.8} />
        </Path>
        {t.creases.map((c, i) => (
          <Path key={i} path={smoothOpen(c)} style="stroke" strokeWidth={1.5} strokeCap="round" color={MAT.skin.deep} opacity={0.65} />
        ))}
      </Group>
    </Group>
  );
});

/** From above: the feet under the knees (only their toe ends show past the knees), then the thighs, then
 *  the shins crossing in front of the hips — the left first, the right over it. */
export const FloorLegsTop = memo(function FloorLegsTop({ ft }: { ft: FloorTop }) {
  const { MAT, CLOTH } = useLook();
  const feet = ft.feet.map((f) => ({ o: cl(f.outline), toes: cl(f.toes), f }));
  return (
    <Group>
      {feet.map(({ o, toes, f }, i) => (
        <Group key={`f${i}`}>
          <Soft path={o} opacity={0.35} blur={6} />
          <Form path={o} mat={MAT.skin} axis={f.axis} w={40} rim={3} edge={0.8} />
          <Group clip={o}>
            <Path path={toes} color={MAT.skin.rim} opacity={0.14} />
            {f.creases.map((c, j) => (
              <Path key={j} path={smoothOpen(c)} style="stroke" strokeWidth={1.3} strokeCap="round" color={MAT.skin.deep} opacity={0.38} />
            ))}
          </Group>
        </Group>
      ))}
      {ft.thighs.map((p, i) => (
        <Group key={`t${i}`} layer={i === 1 ? dim(FAR_DIM + 0.14) : undefined}>
          <Form path={cl(p)} mat={CLOTH} axis={ft.thighAxes[i]} w={70} rim={4} />
          <Soft path={ellipsePath(ft.knees[i])} color={MAT.trousers.rim} opacity={0.2} blur={6} />
        </Group>
      ))}
      {[1, 0].map((i) => (
        <Group key={`s${i}`}>
          <Soft path={cl(ft.shins[i])} opacity={0.35} blur={6} />
          <Form path={cl(ft.shins[i])} mat={CLOTH} axis={ft.shinAxes[i]} w={50} rim={4} />
        </Group>
      ))}
    </Group>
  );
});
