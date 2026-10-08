/**
 * BROADCAST MICROPHONES for the Miking Labs — Lab 7 group 1 (B01 radio and
 * podcast hosts, B07 voiceover, B06 panels). Same conventions as
 * micDrawings.tsx (which switches to these through MikingMicArt): LOCAL
 * coordinates, the mic's FRONT at the origin, its body toward +y; `r` the
 * radius, `len` the length front to tail.
 *
 * Illustrations, never glyphs (house rule): layered gradients lit from the
 * upper left, a rim light on the lit edge, a contour, a soft lift shadow.
 * Generic — no maker's likeness, no badge.
 *
 *   BroadcastDynamicMic  an end-address broadcast dynamic: a large foam
 *                        windscreen over the front (a stippled open-cell
 *                        foam), a chrome trim ring, a long satin body held in
 *                        a YOKE (its side plate and the knurled pivot knob),
 *                        a rounded rear cap with the connector recess and two
 *                        small response switches.
 */
import { useMemo } from 'react';
import { BlurMask, Circle, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';

type SkPathT = ReturnType<typeof Skia.Path.Make>;
const make = () => Skia.Path.Make();
const LIT = (r: number) => ({ start: vec(r, 0), end: vec(-r, 0) });

function buildBroadcastDynamic(r: number, len: number) {
  const fw = len * 0.36; // the foam windscreen's length
  const br = r * 0.84; // the body's radius
  const foam: SkPathT = make();
  foam.addRRect(Skia.RRectXY(Skia.XYWHRect(-r, 0, r * 2, fw), r * 0.72, r * 0.6));
  // Open-cell foam: a field of small pores (one path).
  const pores: SkPathT = make();
  const step = Math.max(1.4, r * 0.16);
  let row = 0;
  for (let y = step * 0.6; y < fw - step * 0.3; y += step * 0.86, row++) {
    for (let x = -r + step * (row % 2 ? 0.5 : 1); x < r - step * 0.4; x += step) {
      const q = Math.max(0.25, r * 0.035);
      pores.addOval(Skia.XYWHRect(x - q, y - q, q * 2, q * 2));
    }
  }
  const body: SkPathT = make();
  body.addRRect(Skia.RRectXY(Skia.XYWHRect(-br, fw - r * 0.2, br * 2, len - fw + r * 0.2 - r * 0.02), br * 0.28, br * 0.28));
  const ring: SkPathT = make();
  ring.addRRect(Skia.RRectXY(Skia.XYWHRect(-br * 1.04, fw - r * 0.08, br * 2.08, r * 0.2), r * 0.06, r * 0.06));
  // The yoke's side plate along the body, and its pivot knob.
  const y0 = len * 0.47;
  const y1 = len * 0.83;
  const yoke: SkPathT = make();
  yoke.addRRect(Skia.RRectXY(Skia.XYWHRect(-br * 0.42, y0, br * 0.84, y1 - y0), br * 0.3, br * 0.3));
  const knobY = len * 0.64;
  const knob = { cx: 0, cy: knobY, r: br * 0.5 };
  const knurl: SkPathT = make();
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2;
    knurl.moveTo(Math.cos(a) * knob.r * 0.72, knobY + Math.sin(a) * knob.r * 0.72);
    knurl.lineTo(Math.cos(a) * knob.r, knobY + Math.sin(a) * knob.r);
  }
  // The rear cap: a slightly darker band, the connector recess, two switches.
  const cap: SkPathT = make();
  cap.addRRect(Skia.RRectXY(Skia.XYWHRect(-br * 0.98, len - r * 0.55, br * 1.96, r * 0.53), br * 0.24, br * 0.24));
  const recess: SkPathT = make();
  recess.addRRect(Skia.RRectXY(Skia.XYWHRect(-br * 0.36, len - r * 0.2, br * 0.72, r * 0.18), r * 0.05, r * 0.05));
  const switches: SkPathT = make();
  for (const s of [-1, 1]) switches.addRRect(Skia.RRectXY(Skia.XYWHRect(s * br * 0.52 - br * 0.12, len - r * 0.48, br * 0.24, r * 0.16), r * 0.03, r * 0.03));
  const shadow: SkPathT = make();
  shadow.addPath(foam);
  shadow.addPath(body);
  return { foam, pores, body, ring, yoke, knob, knurl, cap, recess, switches, shadow, fw, br };
}

/** END-ADDRESS BROADCAST DYNAMIC: radius `r` (the windscreen's), overall
 *  length `len`, the windscreen's front at the origin. */
export function BroadcastDynamicMic({ r, len, tint }: { r: number; len: number; tint?: string }) {
  const p = useMemo(() => buildBroadcastDynamic(r, len), [r, len]);
  const lit = LIT(r);
  const hair = Math.max(0.35, r * 0.03);
  return (
    <Group>
      <Group transform={[{ translateX: -r * 0.12 }, { translateY: r * 0.1 }]}>
        <Path path={p.shadow} color="#000000" opacity={0.5}>
          <BlurMask blur={r * 0.18} style="normal" />
        </Path>
      </Group>
      {/* The body: dark satin, lit from the upper left. */}
      <Path path={p.body}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#6d727d', '#3d414a', '#22242a', '#101114']} positions={[0, 0.3, 0.66, 1]} />
      </Path>
      <Path path={p.cap}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#4f535c', '#26282e', '#0d0e11']} />
      </Path>
      <Path path={p.recess} color="#060607" />
      <Path path={p.switches}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#b9bec8', '#5b5f69', '#25272d']} />
      </Path>
      {/* The yoke's side plate and its knurled pivot knob. */}
      <Path path={p.yoke}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#5a5f69', '#2c2f36', '#14151a']} />
      </Path>
      <Path path={p.yoke} style="stroke" strokeWidth={hair} color="#08080a" opacity={0.9} />
      <Circle cx={p.knob.cx} cy={p.knob.cy} r={p.knob.r}>
        <LinearGradient start={vec(p.knob.r, p.knob.cy - p.knob.r)} end={vec(-p.knob.r, p.knob.cy + p.knob.r)} colors={['#d9dde5', '#7d828c', '#2a2c32']} />
      </Circle>
      <Path path={p.knurl} style="stroke" strokeWidth={hair * 0.8} color="#1b1c21" opacity={0.85} />
      <Circle cx={p.knob.cx} cy={p.knob.cy} r={p.knob.r * 0.32} color="#3a3d45" />
      {/* The chrome trim ring where the windscreen meets the body. */}
      <Path path={p.ring}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#f4f6fa', '#a3a8b2', '#3a3d45']} />
      </Path>
      {/* The foam windscreen: charcoal open-cell foam, a soft highlight. */}
      <Path path={p.foam}>
        <LinearGradient start={lit.start} end={lit.end} colors={['#55595f', '#33363c', '#1d1e22', '#111214']} positions={[0, 0.3, 0.68, 1]} />
      </Path>
      <Group clip={p.foam}>
        <Path path={p.pores} color="#0a0a0c" opacity={0.6} />
        <Circle cx={r * 0.42} cy={p.fw * 0.3} r={r * 0.5} color="#ffffff" opacity={0.1}>
          <BlurMask blur={r * 0.35} style="normal" />
        </Circle>
      </Group>
      {/* Edges: a crisp dark outline, and a rim light on the lit side. */}
      <Path path={p.foam} style="stroke" strokeWidth={hair * 1.4} color="#08080a" opacity={0.9} />
      <Path path={p.body} style="stroke" strokeWidth={hair * 1.4} color="#08080a" opacity={0.9} />
      <Path path={p.foam} style="stroke" strokeWidth={hair} color={tint ?? '#e3e7ef'} opacity={tint ? 0.95 : 0.28} />
      <Path path={p.body} style="stroke" strokeWidth={hair * 0.8} color={tint ?? '#e3e7ef'} opacity={tint ? 0.6 : 0.18} />
    </Group>
  );
}
