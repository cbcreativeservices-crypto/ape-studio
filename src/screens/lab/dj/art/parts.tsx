/**
 * parts — the DJ Systems Lab's hardware vocabulary in Skia: knobs, faders,
 * buttons, pads, LED meters, panel sockets and plugs. Every part is drawn as
 * the real object (house rule: no primitive stand-ins) — layered shapes,
 * gradients for form, a soft contact shadow, specular highlights on caps —
 * authored in MILLIMETRES (the scene's Group transform scales mm → points).
 *
 * Light comes from the upper left. Parts take plain numbers for their static
 * state (a knob's angle, a fader's position: the dock re-renders them) and a
 * SharedValue only where something moves per frame (a meter, a rotation).
 */
import { useMemo } from 'react';
import { BlurMask, Circle, DashPathEffect, Group, Line, LinearGradient, Path, RadialGradient, Rect, RoundedRect, Skia, vec, type SkPath } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { levelColorForDb } from '../../../../features/tools/levelColor';
import { INK } from './ink';
import { useMotion } from './motion';
import { PLUG_R, type PlugKindMap } from '../geometry/mapGeometry';

const DEG = Math.PI / 180;

/* ── attention halo ───────────────────────────────────────────────── */

/**
 * The lesson's ATTENTION mark around a part: a soft amber glow and a hairline
 * ring — never a fill over the control (the control itself stays readable).
 */
export function Halo({ b, round = false, tone = 'amber' }: { b: { x: number; y: number; w: number; h: number }; round?: boolean; tone?: 'amber' | 'red' }) {
  const r = round ? Math.min(b.w, b.h) / 2 : Math.min(8, Math.min(b.w, b.h) * 0.3);
  const c = tone === 'red' ? INK.peak : INK.amber;
  return (
    <Group>
      <RoundedRect x={b.x} y={b.y} width={b.w} height={b.h} r={r} style="stroke" strokeWidth={3.2} color={c} opacity={tone === 'red' ? 0.6 : 0.35}>
        <BlurMask blur={3.5} style="normal" />
      </RoundedRect>
      <RoundedRect x={b.x} y={b.y} width={b.w} height={b.h} r={r} style="stroke" strokeWidth={tone === 'red' ? 1.6 : 0.8} color={c} opacity={0.95} />
    </Group>
  );
}

/* ── knobs ────────────────────────────────────────────────────────────── */

/** Knob value (0 … 1) → pointer angle in radians, 0 = straight up, over a
 *  300° sweep (the travel of a real rotary pot, stop to stop). */
export const knobAngle = (v: number, sweep = 300): number => (-sweep / 2 + Math.max(0, Math.min(1, v)) * sweep) * DEG;

function ringTicks(cx: number, cy: number, r0: number, r1: number, n: number, a0: number, a1: number): SkPath {
  const p = Skia.PathBuilder.Make();
  for (let i = 0; i < n; i++) {
    const a = a0 + ((a1 - a0) * i) / Math.max(1, n - 1);
    p.moveTo(cx + Math.sin(a) * r0, cy - Math.cos(a) * r0);
    p.lineTo(cx + Math.sin(a) * r1, cy - Math.cos(a) * r1);
  }
  return p.detach();
}

/**
 * A rotary knob seen from above: knurled rubber skirt, metal cap, white
 * pointer, and the printed scale on the panel. `centre` marks a centre detent
 * (EQ, filter); `arc` colours the travel from centre (or from the stop) to
 * the value, like a lit ring.
 */
export function Knob({ cx, cy, d, value, centre = false, arc, scale = true, capTone = 'metal' }: {
  cx: number;
  cy: number;
  d: number;
  value: number;
  centre?: boolean;
  arc?: string;
  scale?: boolean;
  capTone?: 'metal' | 'black';
}) {
  const r = d / 2;
  const knurl = useMemo(() => ringTicks(cx, cy, r * 0.82, r * 0.98, 28, 0, 2 * Math.PI * (27 / 28)), [cx, cy, r]);
  const ticks = useMemo(() => ringTicks(cx, cy, r * 1.22, r * 1.4, 11, -150 * DEG, 150 * DEG), [cx, cy, r]);
  const a = knobAngle(value);
  const arcPath = useMemo(() => {
    if (!arc) return null;
    const from = centre ? 0 : -150 * DEG;
    const p = Skia.PathBuilder.Make();
    const rr = r * 1.31;
    const start = Math.min(from, a);
    const sweep = Math.abs(a - from);
    if (sweep < 0.01) return null;
    p.addArc(Skia.XYWHRect(cx - rr, cy - rr, rr * 2, rr * 2), start / DEG - 90, sweep / DEG);
    return p.detach();
  }, [arc, centre, a, cx, cy, r]);
  return (
    <Group>
      {scale ? <Path path={ticks} style="stroke" strokeWidth={r * 0.07} color={INK.printDim} strokeCap="round" /> : null}
      {centre && scale ? <Circle cx={cx} cy={cy - r * 1.5} r={r * 0.07} color={INK.print} /> : null}
      {arcPath ? (
        <Group>
          <Path path={arcPath} style="stroke" strokeWidth={r * 0.16} color={arc} strokeCap="round" opacity={0.85}>
            <BlurMask blur={r * 0.12} style="solid" />
          </Path>
        </Group>
      ) : null}
      {/* contact shadow (light from the upper left → shadow falls lower right) */}
      <Circle cx={cx + r * 0.12} cy={cy + r * 0.16} r={r * 1.02} color="rgba(0,0,0,0.6)">
        <BlurMask blur={r * 0.22} style="normal" />
      </Circle>
      {/* rubber skirt */}
      <Circle cx={cx} cy={cy} r={r}>
        <RadialGradient c={vec(cx - r * 0.35, cy - r * 0.4)} r={r * 1.5} colors={[INK.knobRubberHi, INK.knobRubberLo]} />
      </Circle>
      <Path path={knurl} style="stroke" strokeWidth={r * 0.06} color="rgba(0,0,0,0.65)" />
      <Circle cx={cx} cy={cy} r={r} style="stroke" strokeWidth={r * 0.04} color="rgba(255,255,255,0.10)" />
      {/* cap */}
      <Circle cx={cx} cy={cy} r={r * 0.66}>
        {capTone === 'metal' ? (
          <RadialGradient c={vec(cx - r * 0.25, cy - r * 0.3)} r={r * 0.95} colors={[INK.capHi, INK.capMid, INK.capLo]} positions={[0, 0.55, 1]} />
        ) : (
          <RadialGradient c={vec(cx - r * 0.25, cy - r * 0.3)} r={r * 0.95} colors={['#4a4d54', '#1d1f23', '#0c0d0f']} positions={[0, 0.6, 1]} />
        )}
      </Circle>
      <Circle cx={cx} cy={cy} r={r * 0.66} style="stroke" strokeWidth={r * 0.035} color="rgba(0,0,0,0.5)" />
      {/* specular highlight */}
      <Circle cx={cx - r * 0.24} cy={cy - r * 0.27} r={r * 0.2} color="rgba(255,255,255,0.55)">
        <BlurMask blur={r * 0.12} style="normal" />
      </Circle>
      {/* pointer: runs across the skirt and the cap, the way a real knob is marked */}
      <Line p1={vec(cx + Math.sin(a) * r * 0.18, cy - Math.cos(a) * r * 0.18)} p2={vec(cx + Math.sin(a) * r * 0.94, cy - Math.cos(a) * r * 0.94)} color={capTone === 'metal' ? '#16181c' : INK.indicator} strokeWidth={r * 0.13} strokeCap="round" />
      <Line p1={vec(cx + Math.sin(a) * r * 0.7, cy - Math.cos(a) * r * 0.7)} p2={vec(cx + Math.sin(a) * r * 0.95, cy - Math.cos(a) * r * 0.95)} color={INK.indicator} strokeWidth={r * 0.13} strokeCap="round" />
    </Group>
  );
}

/* ── faders ───────────────────────────────────────────────────────────── */

/**
 * A fader slot (the recessed groove with its printed scale) and its cap at
 * `value` (0 = bottom/left … 1 = top/right). `len` is the cap's travel.
 */
export function Fader({ x, y, len, value, horizontal = false, capW, capL, ticks = 11, accent }: {
  /** Slot centre line: x (vertical fader) or y (horizontal). */
  x: number;
  /** The travel's START (top end for vertical; left end for horizontal). */
  y: number;
  len: number;
  value: number;
  horizontal?: boolean;
  /** Cap across the slot, and along it (mm). */
  capW: number;
  capL: number;
  ticks?: number;
  accent?: string;
}) {
  const v = Math.max(0, Math.min(1, value));
  const slotW = capW * 0.16;
  const tickPath = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    for (let i = 0; i < ticks; i++) {
      const t = i / (ticks - 1);
      const long = i === 0 || i === ticks - 1 || i === (ticks - 1) / 2;
      const off = capW * 0.62;
      const ext = long ? capW * 0.34 : capW * 0.2;
      if (horizontal) {
        const px = y + t * len;
        p.moveTo(px, x - off);
        p.lineTo(px, x - off - ext);
        p.moveTo(px, x + off);
        p.lineTo(px, x + off + ext);
      } else {
        const py = y + t * len;
        p.moveTo(x - off, py);
        p.lineTo(x - off - ext, py);
        p.moveTo(x + off, py);
        p.lineTo(x + off + ext, py);
      }
    }
    return p.detach();
  }, [x, y, len, horizontal, capW, ticks]);
  // Vertical: value 1 = top (the far end); horizontal: value 1 = right.
  const capC = horizontal ? y + v * len : y + (1 - v) * len;
  const sx = horizontal ? y - capL * 0.3 : x - slotW / 2;
  const sy = horizontal ? x - slotW / 2 : y - capL * 0.3;
  const sw = horizontal ? len + capL * 0.6 : slotW;
  const sh = horizontal ? slotW : len + capL * 0.6;
  const cx = horizontal ? capC - capL / 2 : x - capW / 2;
  const cy = horizontal ? x - capW / 2 : capC - capL / 2;
  const cw = horizontal ? capL : capW;
  const ch = horizontal ? capW : capL;
  return (
    <Group>
      <Path path={tickPath} style="stroke" strokeWidth={capW * 0.05} color={INK.printDim} />
      {/* the slot: a dark groove with a lit lower lip */}
      <RoundedRect x={sx} y={sy} width={sw} height={sh} r={slotW / 2} color="#030304" />
      <RoundedRect x={sx} y={sy} width={sw} height={sh} r={slotW / 2} style="stroke" strokeWidth={slotW * 0.25} color="rgba(255,255,255,0.08)" />
      {/* cap: shadow, body, ridges, the centre line */}
      <RoundedRect x={cx + capW * 0.08} y={cy + capW * 0.12} width={cw} height={ch} r={capW * 0.14} color="rgba(0,0,0,0.65)">
        <BlurMask blur={capW * 0.14} style="normal" />
      </RoundedRect>
      <RoundedRect x={cx} y={cy} width={cw} height={ch} r={capW * 0.14}>
        <LinearGradient start={vec(cx, cy)} end={vec(cx + cw, cy + ch)} colors={['#4b4e55', '#26282d', '#121316']} positions={[0, 0.5, 1]} />
      </RoundedRect>
      {/* the finger dish: a concave band lit on its far edge */}
      <RoundedRect x={cx + cw * 0.12} y={cy + ch * 0.12} width={cw * 0.76} height={ch * 0.76} r={capW * 0.08}>
        <LinearGradient start={horizontal ? vec(cx, cy) : vec(cx, cy)} end={horizontal ? vec(cx + cw, cy) : vec(cx, cy + ch)} colors={['#141518', '#2e3036', '#141518']} />
      </RoundedRect>
      <Line
        p1={horizontal ? vec(cx + cw / 2, cy + ch * 0.1) : vec(cx + cw * 0.1, cy + ch / 2)}
        p2={horizontal ? vec(cx + cw / 2, cy + ch * 0.9) : vec(cx + cw * 0.9, cy + ch / 2)}
        color={accent ?? INK.white}
        strokeWidth={capW * 0.07}
        strokeCap="round"
      />
      <RoundedRect x={cx} y={cy} width={cw} height={ch} r={capW * 0.14} style="stroke" strokeWidth={capW * 0.04} color="rgba(255,255,255,0.16)" />
    </Group>
  );
}

/* ── buttons and pads ─────────────────────────────────────────────────── */

/** A round rubber transport button with a lit ring (PLAY / CUE). */
export function RoundButton({ cx, cy, d, lit, colour, glyph }: { cx: number; cy: number; d: number; lit: boolean; colour: string; glyph: 'play' | 'cue' | 'none' }) {
  const r = d / 2;
  const tri = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    if (glyph === 'play') {
      p.moveTo(cx - r * 0.3, cy - r * 0.32);
      p.lineTo(cx + r * 0.05, cy);
      p.lineTo(cx - r * 0.3, cy + r * 0.32);
      p.close();
      p.addRect(Skia.XYWHRect(cx + r * 0.12, cy - r * 0.3, r * 0.1, r * 0.6));
      p.addRect(Skia.XYWHRect(cx + r * 0.28, cy - r * 0.3, r * 0.1, r * 0.6));
    }
    return p.detach();
  }, [cx, cy, r, glyph]);
  return (
    <Group>
      <Circle cx={cx + r * 0.08} cy={cy + r * 0.12} r={r * 1.02} color="rgba(0,0,0,0.6)">
        <BlurMask blur={r * 0.2} style="normal" />
      </Circle>
      {lit ? (
        <Circle cx={cx} cy={cy} r={r * 1.02} color={colour} opacity={0.55}>
          <BlurMask blur={r * 0.35} style="normal" />
        </Circle>
      ) : null}
      <Circle cx={cx} cy={cy} r={r} color={lit ? colour : '#2a2c31'} />
      <Circle cx={cx} cy={cy} r={r * 0.84}>
        <RadialGradient c={vec(cx - r * 0.3, cy - r * 0.35)} r={r * 1.2} colors={['#3d4046', '#17181b']} />
      </Circle>
      {glyph === 'play' ? <Path path={tri} color={lit ? colour : INK.print} /> : null}
      {glyph === 'cue' ? (
        <Group>
          <RoundedRect x={cx - r * 0.34} y={cy - r * 0.16} width={r * 0.68} height={r * 0.32} r={r * 0.08} color={lit ? colour : INK.print} />
        </Group>
      ) : null}
    </Group>
  );
}

/** A small rectangular rubber key with an optional lit state. */
export function Key({ x, y, w, h, lit = false, colour = INK.amber, dim = false }: { x: number; y: number; w: number; h: number; lit?: boolean; colour?: string; dim?: boolean }) {
  const r = Math.min(w, h) * 0.22;
  return (
    <Group opacity={dim ? 0.55 : 1}>
      <RoundedRect x={x + h * 0.06} y={y + h * 0.12} width={w} height={h} r={r} color="rgba(0,0,0,0.6)">
        <BlurMask blur={h * 0.14} style="normal" />
      </RoundedRect>
      {lit ? (
        <RoundedRect x={x - h * 0.06} y={y - h * 0.06} width={w + h * 0.12} height={h * 1.12} r={r * 1.3} color={colour} opacity={0.5}>
          <BlurMask blur={h * 0.3} style="normal" />
        </RoundedRect>
      ) : null}
      <RoundedRect x={x} y={y} width={w} height={h} r={r}>
        <LinearGradient start={vec(x, y)} end={vec(x, y + h)} colors={lit ? [colour, shade(colour, 0.55)] : [INK.padHi, INK.padLo]} />
      </RoundedRect>
      <RoundedRect x={x} y={y} width={w} height={h} r={r} style="stroke" strokeWidth={h * 0.06} color={lit ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.09)'} />
    </Group>
  );
}

/** Darken a #rrggbb colour by factor k (0 … 1). */
export function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1, 7), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * k))).toString(16).padStart(2, '0');
  return `#${c((n >> 16) & 255)}${c((n >> 8) & 255)}${c(n & 255)}`;
}

/** A 3-position slide switch (input selector, crossfader assign/curve). */
export function SlideSwitch({ x, y, w, h, pos, positions = 3 }: { x: number; y: number; w: number; h: number; pos: number; positions?: number }) {
  const knobW = w / positions;
  const kx = x + pos * knobW;
  return (
    <Group>
      <RoundedRect x={x} y={y} width={w} height={h} r={h * 0.25} color="#050506" />
      <RoundedRect x={x} y={y} width={w} height={h} r={h * 0.25} style="stroke" strokeWidth={h * 0.08} color="rgba(255,255,255,0.08)" />
      <RoundedRect x={kx + knobW * 0.08} y={y + h * 0.12} width={knobW * 0.84} height={h * 0.76} r={h * 0.18}>
        <LinearGradient start={vec(kx, y)} end={vec(kx, y + h)} colors={['#b9bec6', '#5c626b']} />
      </RoundedRect>
      <Line p1={vec(kx + knobW / 2, y + h * 0.22)} p2={vec(kx + knobW / 2, y + h * 0.78)} color="#2a2d33" strokeWidth={knobW * 0.08} />
    </Group>
  );
}

/* ── LED meters ───────────────────────────────────────────────────────── */

/** The 12 segment thresholds of the lab's peak meters (dBFS); the top one
 *  is CLIP (≥ 0 dBFS). */
export const LED_DB = [-36, -30, -24, -18, -15, -12, -9, -6, -4, -2, -1, 0] as const;

/** Segment colour from the house loudness ramp (blue floor); CLIP is peak red. */
export const ledColour = (db: number): string => (db >= 0 ? INK.peak : levelColorForDb(db, -40, 0));

/**
 * A vertical LED column, bottom = quietest. `level` and `hold` are dBFS
 * SharedValues (the meter tap under the clock); lit segments are revealed by
 * a clip that follows `level`, so the column costs one derived value per
 * frame. Off segments stay visible as dark glass.
 */
export function LedColumn({ x, y, w, h, level, hold }: { x: number; y: number; w: number; h: number; level: SharedValue<number>; hold?: SharedValue<number> }) {
  const n = LED_DB.length;
  const pitch = h / n;
  const segH = pitch * 0.72;
  const litClip = useDerivedValue(() => {
    let k = 0;
    const v = level.value;
    for (let i = 0; i < 12; i++) if (v >= LED_DB_W[i]) k = i + 1;
    return Skia.XYWHRect(x - w, y + h - k * pitch, w * 3, k * pitch);
  });
  const holdY = useDerivedValue(() => {
    if (!hold) return -1000;
    let k = 0;
    const v = hold.value;
    for (let i = 0; i < 12; i++) if (v >= LED_DB_W[i]) k = i + 1;
    return k === 0 ? -1000 : y + h - k * pitch + (pitch - segH) / 2;
  });
  const holdOn = useDerivedValue(() => (holdY.value < -100 ? 0 : 1));
  const segs = LED_DB.map((db, i) => ({ db, y: y + h - (i + 1) * pitch + (pitch - segH) / 2 }));
  return (
    <Group>
      <RoundedRect x={x - w * 0.18} y={y - pitch * 0.2} width={w * 1.36} height={h + pitch * 0.4} r={w * 0.2} color="#040405" />
      {segs.map((s) => (
        <RoundedRect key={`o${s.db}`} x={x} y={s.y} width={w} height={segH} r={segH * 0.25} color={INK.ledOff} />
      ))}
      <Group clip={litClip}>
        {segs.map((s) => (
          <Group key={`l${s.db}`}>
            <RoundedRect x={x - w * 0.1} y={s.y - segH * 0.1} width={w * 1.2} height={segH * 1.2} r={segH * 0.3} color={ledColour(s.db)} opacity={0.45}>
              <BlurMask blur={segH * 0.6} style="normal" />
            </RoundedRect>
            <RoundedRect x={x} y={s.y} width={w} height={segH} r={segH * 0.25} color={ledColour(s.db)} />
          </Group>
        ))}
      </Group>
      {hold ? <RoundedRect x={x} y={holdY} width={w} height={segH} r={segH * 0.25} color={INK.white} opacity={holdOn} /> : null}
    </Group>
  );
}
/** Worklet-side copy of LED_DB, pinned equal by test/djLab.test.ts. */
const LED_DB_W = [-36, -30, -24, -18, -15, -12, -9, -6, -4, -2, -1, 0];

/** A single indicator LED with a halo. */
export function Led({ cx, cy, r, on, colour }: { cx: number; cy: number; r: number; on: boolean | SharedValue<number>; colour: string }) {
  if (typeof on === 'boolean') {
    return (
      <Group>
        {on ? (
          <Circle cx={cx} cy={cy} r={r * 2.4} color={colour} opacity={0.4}>
            <BlurMask blur={r * 1.4} style="normal" />
          </Circle>
        ) : null}
        <Circle cx={cx} cy={cy} r={r} color={on ? colour : INK.ledOff} />
        <Circle cx={cx - r * 0.3} cy={cy - r * 0.3} r={r * 0.35} color="rgba(255,255,255,0.35)" />
      </Group>
    );
  }
  return <LedAnimated cx={cx} cy={cy} r={r} on={on} colour={colour} />;
}
function LedAnimated({ cx, cy, r, on, colour }: { cx: number; cy: number; r: number; on: SharedValue<number>; colour: string }) {
  return (
    <Group>
      <Circle cx={cx} cy={cy} r={r} color={INK.ledOff} />
      <Group opacity={on}>
        <Circle cx={cx} cy={cy} r={r * 2.4} color={colour} opacity={0.45}>
          <BlurMask blur={r * 1.4} style="normal" />
        </Circle>
        <Circle cx={cx} cy={cy} r={r} color={colour} />
      </Group>
      <Circle cx={cx - r * 0.3} cy={cy - r * 0.3} r={r * 0.35} color="rgba(255,255,255,0.35)" />
    </Group>
  );
}

/* ── panel sockets (rear panels, face-on) ─────────────────────────────── */

/** An RCA (phono) socket: coloured insulator ring, nickel barrel, the centre
 *  contact. `ring` = white (L) / red (R) / orange (digital coax). */
export function RcaSocket({ cx, cy, d, ring }: { cx: number; cy: number; d: number; ring: string }) {
  const r = d / 2;
  return (
    <Group>
      <Circle cx={cx} cy={cy} r={r} color={ring} />
      <Circle cx={cx} cy={cy} r={r} style="stroke" strokeWidth={r * 0.08} color="rgba(0,0,0,0.5)" />
      <Circle cx={cx} cy={cy} r={r * 0.66}>
        <RadialGradient c={vec(cx - r * 0.25, cy - r * 0.3)} r={r * 0.9} colors={[INK.metalHi, INK.metalMid, INK.metalLo]} />
      </Circle>
      <Circle cx={cx} cy={cy} r={r * 0.38} color="#060607" />
      <Circle cx={cx} cy={cy} r={r * 0.13}>
        <RadialGradient c={vec(cx - r * 0.05, cy - r * 0.05)} r={r * 0.2} colors={['#e9d39a', '#8a7440']} />
      </Circle>
    </Group>
  );
}

/** An XLR socket, face-on. `male` = an OUTPUT (three pins); female = an INPUT
 *  (three holes and the latch). Pin numbers are not printed. */
export function XlrSocket({ cx, cy, d, male }: { cx: number; cy: number; d: number; male: boolean }) {
  const r = d / 2;
  const pins = [
    [-0.33, -0.22],
    [0.33, -0.22],
    [0, 0.36],
  ];
  return (
    <Group>
      {/* the square mounting flange with its two screws */}
      <RoundedRect x={cx - r * 1.3} y={cy - r * 1.3} width={r * 2.6} height={r * 2.6} r={r * 0.25}>
        <LinearGradient start={vec(cx - r, cy - r)} end={vec(cx + r, cy + r)} colors={['#3a3d44', '#15161a']} />
      </RoundedRect>
      {[[-1, -1], [1, 1]].map(([sx, sy]) => (
        <Circle key={`${sx}${sy}`} cx={cx + sx * r * 1.0} cy={cy + sy * r * 1.0} r={r * 0.11} color="#8b9099" />
      ))}
      <Circle cx={cx} cy={cy} r={r * 0.92}>
        <RadialGradient c={vec(cx - r * 0.3, cy - r * 0.3)} r={r * 1.2} colors={[INK.metalHi, INK.metalMid, INK.metalLo]} />
      </Circle>
      <Circle cx={cx} cy={cy} r={r * 0.78} color="#0b0b0d" />
      {/* key */}
      <RoundedRect x={cx - r * 0.09} y={cy - r * 0.84} width={r * 0.18} height={r * 0.16} r={r * 0.04} color={INK.metalMid} />
      {pins.map(([px, py]) =>
        male ? (
          <Circle key={`${px}${py}`} cx={cx + px * r} cy={cy + py * r} r={r * 0.12}>
            <RadialGradient c={vec(cx + px * r - r * 0.03, cy + py * r - r * 0.03)} r={r * 0.16} colors={['#f0dc9e', '#8a7440']} />
          </Circle>
        ) : (
          <Circle key={`${px}${py}`} cx={cx + px * r} cy={cy + py * r} r={r * 0.12} color="#000" />
        ),
      )}
      {male ? null : <RoundedRect x={cx - r * 0.3} y={cy - r * 1.27} width={r * 0.6} height={r * 0.28} r={r * 0.1} color="#6e737c" />}
    </Group>
  );
}

/** A combo input (XLR holes with a 6.35 mm jack hole in the centre), as on a
 *  powered speaker. */
export function ComboSocket({ cx, cy, d }: { cx: number; cy: number; d: number }) {
  const r = d / 2;
  return (
    <Group>
      <XlrSocket cx={cx} cy={cy} d={d} male={false} />
      <Circle cx={cx} cy={cy} r={r * 0.26} color="#2b2e34" />
      <Circle cx={cx} cy={cy} r={r * 0.17} color="#000" />
    </Group>
  );
}

/** A 6.35 mm (1/4-inch) jack socket: knurled nut and the hole. */
export function TrsSocket({ cx, cy, d }: { cx: number; cy: number; d: number }) {
  const r = d / 2;
  const knurl = useMemo(() => ringTicks(cx, cy, r * 0.82, r, 20, 0, 2 * Math.PI * (19 / 20)), [cx, cy, r]);
  return (
    <Group>
      <Circle cx={cx} cy={cy} r={r}>
        <RadialGradient c={vec(cx - r * 0.3, cy - r * 0.3)} r={r * 1.2} colors={[INK.metalHi, INK.metalMid, INK.metalLo]} />
      </Circle>
      <Path path={knurl} style="stroke" strokeWidth={r * 0.06} color="rgba(0,0,0,0.4)" />
      <Circle cx={cx} cy={cy} r={r * 0.58} color="#16171a" />
      <Circle cx={cx} cy={cy} r={r * 0.4} color="#000" />
    </Group>
  );
}

/** USB type-B socket. */
export function UsbB({ x, y, s }: { x: number; y: number; s: number }) {
  const p = useMemo(() => {
    const q = Skia.PathBuilder.Make();
    const w = 12 * s;
    const h = 11 * s;
    const c = 2.6 * s;
    q.moveTo(x + c, y);
    q.lineTo(x + w - c, y);
    q.lineTo(x + w, y + c);
    q.lineTo(x + w, y + h);
    q.lineTo(x, y + h);
    q.lineTo(x, y + c);
    q.close();
    return q.detach();
  }, [x, y, s]);
  return (
    <Group>
      <Path path={p} color="#9aa0a8" />
      <Path path={p} style="stroke" strokeWidth={0.5 * s} color="#4a4f57" />
      <RoundedRect x={x + 2 * s} y={y + 2 * s} width={8 * s} height={7.4 * s} r={0.8 * s} color="#0b0b0d" />
      <RoundedRect x={x + 4 * s} y={y + 4 * s} width={4 * s} height={3.6 * s} r={0.5 * s} color="#e8e8ea" />
    </Group>
  );
}

/** RJ45 network socket (with its latch notch and the gold contacts). */
export function Rj45({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <Group>
      <RoundedRect x={x} y={y} width={16 * s} height={14 * s} r={1 * s} color="#9aa0a8" />
      <Rect x={x + 1.4 * s} y={y + 1.4 * s} width={13.2 * s} height={9.4 * s} color="#0b0b0d" />
      <Rect x={x + 5.5 * s} y={y + 10.8 * s} width={5 * s} height={2.2 * s} color="#0b0b0d" />
      {Array.from({ length: 8 }, (_, i) => (
        <Rect key={i} x={x + (2.6 + i * 1.45) * s} y={y + 1.6 * s} width={0.7 * s} height={2.4 * s} color="#d8b863" />
      ))}
      <Rect x={x + 0.3 * s} y={y + 0.4 * s} width={2.4 * s} height={1.2 * s} color={INK.green} opacity={0.7} />
      <Rect x={x + 13.3 * s} y={y + 0.4 * s} width={2.4 * s} height={1.2 * s} color={INK.amber} opacity={0.7} />
    </Group>
  );
}

/** IEC C14 mains inlet (the "kettle" inlet), three blades. */
export function IecInlet({ x, y, s }: { x: number; y: number; s: number }) {
  const p = useMemo(() => {
    const q = Skia.PathBuilder.Make();
    const w = 24 * s;
    const h = 16 * s;
    const c = 4.5 * s;
    q.moveTo(x, y);
    q.lineTo(x + w, y);
    q.lineTo(x + w, y + h - c);
    q.lineTo(x + w - c, y + h);
    q.lineTo(x + c, y + h);
    q.lineTo(x, y + h - c);
    q.close();
    return q.detach();
  }, [x, y, s]);
  return (
    <Group>
      <RoundedRect x={x - 3 * s} y={y - 3 * s} width={30 * s} height={22 * s} r={2 * s} color="#16171a" />
      <Path path={p} color="#050506" />
      <Path path={p} style="stroke" strokeWidth={0.6 * s} color="#2c2e33" />
      {[6, 18].map((bx) => (
        <Rect key={bx} x={x + bx * s - 0.8 * s} y={y + 5 * s} width={1.6 * s} height={5 * s} color="#c9ccd2" />
      ))}
      <Rect x={x + 12 * s - 0.8 * s} y={y + 2 * s} width={1.6 * s} height={4.2 * s} color="#c9ccd2" />
    </Group>
  );
}

/** A rocker power switch (I / O), shown in its state. */
export function Rocker({ x, y, s, on }: { x: number; y: number; s: number; on: boolean }) {
  return (
    <Group>
      <RoundedRect x={x} y={y} width={13 * s} height={20 * s} r={1.5 * s} color="#050506" />
      <RoundedRect x={x + 1.2 * s} y={y + 1.2 * s} width={10.6 * s} height={17.6 * s} r={1 * s}>
        <LinearGradient start={vec(x, on ? y : y + 20 * s)} end={vec(x, on ? y + 20 * s : y)} colors={['#3c3f46', '#121316']} />
      </RoundedRect>
      <Line p1={vec(x + 6.5 * s, y + 3 * s)} p2={vec(x + 6.5 * s, y + 7 * s)} color={on ? INK.white : INK.printDim} strokeWidth={1 * s} strokeCap="round" />
      <Circle cx={x + 6.5 * s} cy={y + 15 * s} r={2 * s} style="stroke" strokeWidth={0.9 * s} color={on ? INK.printDim : INK.white} />
    </Group>
  );
}

/** The chassis ground post (a knurled thumb screw). */
export function GroundPost({ cx, cy, d }: { cx: number; cy: number; d: number }) {
  return <TrsSocket cx={cx} cy={cy} d={d} />;
}

/* ── cable runs ───────────────────────────────────────────────────────── */

/** A cable's look: jacket colour and width, and its PATTERN — the cable
 *  types are told apart by pattern and label, never by colour alone (D69,
 *  charter §8). */
export type CablePattern = 'plain' | 'stripe' | 'dots' | 'ribs' | 'dash';
export type CableStyle = { colour: string; width: number; pattern?: CablePattern; dash?: number[]; label?: string };

/**
 * A cable as a smooth run through `pts` (mm), with its jacket highlight, so
 * it reads as a round cable. Its own lane: never merged with another. `glow`
 * marks it live; with `flow` the glow carries a slow travelling pulse from
 * the one clock (a signal-flow OVERLAY — it claims no speed; decorative, so
 * the caller passes it only when useDecorativeMotion allows).
 */
export function Cable({ pts, style, glow, flow = false, path: given }: { pts: [number, number][]; style: CableStyle; glow?: string | null; flow?: boolean; path?: SkPath }) {
  const path = useMemo(() => given ?? smoothPath(pts), [pts, given]);
  const w = style.width;
  const pattern = style.pattern ?? (style.dash ? 'dash' : 'plain');
  return (
    <Group>
      {glow ? (
        <Path path={path} style="stroke" strokeWidth={w * 2.6} color={glow} opacity={0.32} strokeCap="round" strokeJoin="round">
          <BlurMask blur={w * 1.2} style="normal" />
        </Path>
      ) : null}
      {/* the soft shadow it casts, then the jacket and its round highlight */}
      <Path path={path} style="stroke" strokeWidth={w * 1.1} color="rgba(0,0,0,0.55)" strokeCap="round" strokeJoin="round" transform={[{ translateX: w * 0.35 }, { translateY: w * 0.5 }]}>
        <BlurMask blur={w * 0.5} style="normal" />
      </Path>
      <Path path={path} style="stroke" strokeWidth={w * 1.22} color="rgba(0,0,0,0.75)" strokeCap="round" strokeJoin="round" />
      <Path path={path} style="stroke" strokeWidth={w} color={style.colour} strokeCap="round" strokeJoin="round" />
      <Path path={path} style="stroke" strokeWidth={w * 0.2} color={INK.cableHi} strokeCap="round" strokeJoin="round" transform={[{ translateX: -w * 0.18 }, { translateY: -w * 0.22 }]} />
      {pattern === 'dash' ? (
        <Path path={path} style="stroke" strokeWidth={w * 0.36} color="rgba(0,0,0,0.55)" strokeCap="butt">
          <DashPathEffect intervals={style.dash ?? [5, 3.5]} />
        </Path>
      ) : pattern === 'stripe' ? (
        <Path path={path} style="stroke" strokeWidth={w * 0.16} color="rgba(190,196,206,0.8)" strokeCap="butt" />
      ) : pattern === 'dots' ? (
        <Path path={path} style="stroke" strokeWidth={w * 0.34} color="rgba(170,176,186,0.85)" strokeCap="round">
          <DashPathEffect intervals={[0.01, w * 1.3]} />
        </Path>
      ) : pattern === 'ribs' ? (
        <Path path={path} style="stroke" strokeWidth={w * 0.78} color="rgba(255,255,255,0.10)" strokeCap="butt">
          <DashPathEffect intervals={[w * 0.18, w * 0.32]} />
        </Path>
      ) : null}
      {glow && flow ? <FlowPulse path={path} w={w} colour={glow} /> : null}
    </Group>
  );
}

/** The travelling pulse along a live cable: dashes moving from the source
 *  end at a slow, readable pace (an overlay of WHERE the signal goes). */
function FlowPulse({ path, w, colour }: { path: SkPath; w: number; colour: string }) {
  const { clock } = useMotion();
  const phase = useDerivedValue(() => -((clock.value * 26) % 40));
  return (
    <Path path={path} style="stroke" strokeWidth={w * 0.55} color={colour} opacity={0.95} strokeCap="round">
      <DashPathEffect intervals={[7, 33]} phase={phase} />
    </Path>
  );
}

/** Rounded polyline: straight runs joined by quadratic corners. */
export function smoothPath(pts: [number, number][]): SkPath {
  const p = Skia.PathBuilder.Make();
  if (pts.length === 0) return p.detach();
  p.moveTo(pts[0][0], pts[0][1]);
  if (pts.length === 2) {
    p.lineTo(pts[1][0], pts[1][1]);
    return p.detach();
  }
  for (let i = 1; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    const d0 = Math.hypot(x1 - x0, y1 - y0);
    const d1 = Math.hypot(x2 - x1, y2 - y1);
    const k = Math.min(d0, d1) * 0.45;
    const ax = x1 - ((x1 - x0) / (d0 || 1)) * k;
    const ay = y1 - ((y1 - y0) / (d0 || 1)) * k;
    const bx = x1 + ((x2 - x1) / (d1 || 1)) * k;
    const by = y1 + ((y2 - y1) / (d1 || 1)) * k;
    p.lineTo(ax, ay);
    p.quadTo(x1, y1, bx, by);
  }
  const last = pts[pts.length - 1];
  p.lineTo(last[0], last[1]);
  return p.detach();
}

/** A loose cable's run: from its fixed end, sagging under its own weight (a
 *  quadratic dipping `sag` mm below the chord) to where its plug lies. */
export function sagPath(a: [number, number], b: [number, number], sag: number): SkPath {
  const p = Skia.PathBuilder.Make();
  p.moveTo(a[0], a[1]);
  const mx = (a[0] + b[0]) / 2;
  const my = Math.max(a[1], b[1]) + sag;
  p.quadTo(mx, my, b[0], b[1]);
  return p.detach();
}

export type PlugKind = PlugKindMap;
export { PLUG_R };

/**
 * A plugged-in connector seen face-on on its panel (the plug's body points
 * at you, in a slight perspective down and to the right, with a blurred
 * shadow cast on the panel by the upper-left light): RCA — coloured collar,
 * metal shell and boot; XLR — barrel, grip rings, boot; 6.35 mm jack —
 * barrel and boot; IEC — the moulded C13 at a device's inlet; MAINS — the
 * moulded plug at the power strip, its strain-relief boot turned toward
 * `dir` (radians, the way its cord leaves).
 */
export function PlugFace({ cx, cy, kind, colour, dir = -Math.PI / 2 }: { cx: number; cy: number; kind: PlugKind; colour: string; dir?: number }) {
  if (kind === 'mains') return <MainsPlug cx={cx} cy={cy} dir={dir} />;
  if (kind === 'iec') {
    return (
      <Group>
        <RoundedRect x={cx - 15 + 3} y={cy - 11 + 4.5} width={30} height={22} r={4} color="rgba(0,0,0,0.7)">
          <BlurMask blur={2.2} style="normal" />
        </RoundedRect>
        {/* the body's side, toward the panel */}
        <RoundedRect x={cx - 15 + 1.2} y={cy - 11 + 1.6} width={30} height={22} r={4} color="#060607" />
        <RoundedRect x={cx - 15} y={cy - 11} width={30} height={22} r={4}>
          <LinearGradient start={vec(cx - 15, cy - 11)} end={vec(cx + 15, cy + 11)} colors={['#2e3035', '#0b0b0d']} />
        </RoundedRect>
        <RoundedRect x={cx - 15} y={cy - 11} width={30} height={22} r={4} style="stroke" strokeWidth={0.7} color="rgba(255,255,255,0.16)" />
        {[-6, 0, 6].map((g) => (
          <Rect key={g} x={cx + g - 0.5} y={cy - 7} width={1} height={14} color="rgba(255,255,255,0.06)" />
        ))}
        <Circle cx={cx} cy={cy + 2} r={4.5} color="#050506" />
      </Group>
    );
  }
  const shell = kind === 'xlr' ? 10.5 : kind === 'trs' ? 6.4 : 5.4;
  const boot = kind === 'xlr' ? 5 : kind === 'trs' ? 3.6 : 2.9;
  const depth = kind === 'xlr' ? 3.4 : 2.6; // the barrel showing in perspective
  const nx = cx + depth * 0.55;
  const ny = cy + depth * 0.75;
  return (
    <Group>
      <Circle cx={cx + shell * 0.45} cy={cy + shell * 0.6} r={shell * 1.08} color="rgba(0,0,0,0.75)">
        <BlurMask blur={shell * 0.35} style="normal" />
      </Circle>
      {/* the barrel's side, from the panel out to its near end */}
      <Line p1={vec(cx, cy)} p2={vec(nx, ny)} strokeWidth={shell * 2} strokeCap="round" color={kind === 'rca' ? shade(colour, 0.45) : '#2c2f34'} />
      {kind === 'rca' ? (
        <Group>
          <Circle cx={nx} cy={ny} r={shell}>
            <RadialGradient c={vec(nx - shell * 0.3, ny - shell * 0.35)} r={shell * 1.3} colors={[colour, shade(colour, 0.55)]} />
          </Circle>
          <Circle cx={nx} cy={ny} r={shell * 0.72}>
            <RadialGradient c={vec(nx - 1, ny - 1)} r={shell} colors={[INK.metalHi, INK.metalLo]} />
          </Circle>
        </Group>
      ) : (
        <Group>
          <Circle cx={nx} cy={ny} r={shell}>
            <RadialGradient c={vec(nx - shell * 0.3, ny - shell * 0.35)} r={shell * 1.3} colors={['#d6dae0', '#7a8089', '#3a3e45']} />
          </Circle>
          <Circle cx={nx} cy={ny} r={shell * 0.84} style="stroke" strokeWidth={shell * 0.08} color="rgba(0,0,0,0.35)" />
          <Circle cx={nx} cy={ny} r={shell * 0.68} style="stroke" strokeWidth={shell * 0.06} color="rgba(0,0,0,0.3)" />
        </Group>
      )}
      <Circle cx={nx} cy={ny} r={boot}>
        <RadialGradient c={vec(nx - boot * 0.3, ny - boot * 0.35)} r={boot * 1.4} colors={['#3a3c42', '#0b0b0d']} />
      </Circle>
      <Circle cx={nx - shell * 0.32} cy={ny - shell * 0.36} r={shell * 0.18} color="rgba(255,255,255,0.45)">
        <BlurMask blur={shell * 0.12} style="normal" />
      </Circle>
    </Group>
  );
}

/** The moulded mains plug in a strip outlet, from above: a 34 × 40 mm body
 *  with grip ribs and the strain-relief boot its cord leaves through. */
function MainsPlug({ cx, cy, dir }: { cx: number; cy: number; dir: number }) {
  const deg = (dir * 180) / Math.PI + 90; // the boot is drawn pointing up (−y) at 0
  const boot = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    p.moveTo(-8, -18);
    p.lineTo(8, -18);
    p.lineTo(4.6, -34);
    p.lineTo(-4.6, -34);
    p.close();
    return p.detach();
  }, []);
  return (
    <Group transform={[{ translateX: cx }, { translateY: cy }]}>
      <RoundedRect x={-17 + 3} y={-20 + 4} width={34} height={40} r={7} color="rgba(0,0,0,0.7)">
        <BlurMask blur={2.4} style="normal" />
      </RoundedRect>
      <Group transform={[{ rotate: (deg * Math.PI) / 180 }]}>
        <Path path={boot}>
          <LinearGradient start={vec(-8, 0)} end={vec(8, 0)} colors={['#2e3035', '#141518', '#060607']} />
        </Path>
        {[-22, -26, -30].map((g) => (
          <Line key={g} p1={vec(-6.5 + (g + 18) * -0.18, g)} p2={vec(6.5 - (g + 18) * -0.18, g)} color="rgba(255,255,255,0.08)" strokeWidth={0.8} />
        ))}
      </Group>
      <RoundedRect x={-17} y={-20} width={34} height={40} r={7}>
        <LinearGradient start={vec(-17, -20)} end={vec(17, 20)} colors={['#34373d', '#17181b', '#0a0a0c']} positions={[0, 0.5, 1]} />
      </RoundedRect>
      <RoundedRect x={-17} y={-20} width={34} height={40} r={7} style="stroke" strokeWidth={0.8} color="rgba(255,255,255,0.16)" />
      {[-13, 13].map((gx) => (
        <Group key={gx}>
          {[-10, -5, 0, 5, 10].map((gy) => (
            <Line key={gy} p1={vec(gx - 2, gy)} p2={vec(gx + 2, gy)} color="rgba(255,255,255,0.10)" strokeWidth={0.8} strokeCap="round" />
          ))}
        </Group>
      ))}
      <Circle cx={-6} cy={-8} r={6} color="rgba(255,255,255,0.06)">
        <BlurMask blur={4} style="normal" />
      </Circle>
    </Group>
  );
}

/**
 * A LOOSE plug lying free at the end of its cable, seen from the side,
 * pointing along `ang` (radians): RCA — boot, coloured collar, nickel barrel
 * with its split ground sleeve and the centre pin; XLR (male) — barrel with
 * grip rings, latch and pins; 6.35 mm jack; mains — moulded body and blades.
 */
export function LoosePlug({ x, y, ang, kind, colour }: { x: number; y: number; ang: number; kind: PlugKind | 'phones'; colour: string }) {
  const body = (() => {
    if (kind === 'rca') {
      return (
        <Group>
          <RoundedRect x={0} y={-3.4} width={9} height={6.8} r={2}>
            <LinearGradient start={vec(0, -3.4)} end={vec(0, 3.4)} colors={['#3a3c42', '#0b0b0d']} />
          </RoundedRect>
          <Rect x={9} y={-4.2} width={4} height={8.4}>
            <LinearGradient start={vec(0, -4.2)} end={vec(0, 4.2)} colors={[colour, shade(colour, 0.5)]} />
          </Rect>
          <Rect x={13} y={-3.8} width={9} height={7.6}>
            <LinearGradient start={vec(0, -3.8)} end={vec(0, 3.8)} colors={['#eef1f4', '#9aa0a8', '#5c626b']} positions={[0, 0.4, 1]} />
          </Rect>
          <Line p1={vec(15, 0)} p2={vec(22, 0)} color="rgba(0,0,0,0.45)" strokeWidth={0.6} />
          <Rect x={22} y={-1} width={6} height={2} color="#d8dce2" />
        </Group>
      );
    }
    if (kind === 'xlr') {
      return (
        <Group>
          <RoundedRect x={0} y={-5} width={12} height={10} r={3}>
            <LinearGradient start={vec(0, -5)} end={vec(0, 5)} colors={['#3a3c42', '#0b0b0d']} />
          </RoundedRect>
          <RoundedRect x={12} y={-9.5} width={34} height={19} r={2.5}>
            <LinearGradient start={vec(0, -9.5)} end={vec(0, 9.5)} colors={['#eef1f4', '#9aa0a8', '#4a4f57']} positions={[0, 0.35, 1]} />
          </RoundedRect>
          {[16, 19, 22].map((g) => (
            <Line key={g} p1={vec(g, -9.5)} p2={vec(g, 9.5)} color="rgba(0,0,0,0.3)" strokeWidth={0.6} />
          ))}
          <RoundedRect x={30} y={-11} width={9} height={2.4} r={1} color="#6e737c" />
          <Rect x={46} y={-4.5} width={6} height={1.6} color="#e9d39a" />
          <Rect x={46} y={2.9} width={6} height={1.6} color="#e9d39a" />
        </Group>
      );
    }
    if (kind === 'mains') {
      return (
        <Group>
          <RoundedRect x={0} y={-5} width={14} height={10} r={3}>
            <LinearGradient start={vec(0, -5)} end={vec(0, 5)} colors={['#2e3035', '#0b0b0d']} />
          </RoundedRect>
          <RoundedRect x={14} y={-12} width={22} height={24} r={5}>
            <LinearGradient start={vec(0, -12)} end={vec(0, 12)} colors={['#34373d', '#0a0a0c']} />
          </RoundedRect>
          <Rect x={36} y={-7} width={15} height={2} color="#c9ccd2" />
          <Rect x={36} y={5} width={15} height={2} color="#c9ccd2" />
          <RoundedRect x={36} y={-1.6} width={17} height={3.2} r={1.6} color="#c9ccd2" />
        </Group>
      );
    }
    // trs / phones / iec: a 6.35 mm jack, or a C13 body for iec
    if (kind === 'iec') {
      return (
        <Group>
          <RoundedRect x={0} y={-5} width={12} height={10} r={3} color="#141518" />
          <RoundedRect x={12} y={-11} width={28} height={22} r={4}>
            <LinearGradient start={vec(0, -11)} end={vec(0, 11)} colors={['#2e3035', '#0b0b0d']} />
          </RoundedRect>
        </Group>
      );
    }
    return (
      <Group>
        <RoundedRect x={0} y={-3.2} width={10} height={6.4} r={2} color="#141518" />
        <RoundedRect x={10} y={-5} width={17} height={10} r={1.6}>
          <LinearGradient start={vec(0, -5)} end={vec(0, 5)} colors={['#eef1f4', '#8a9099', '#5c626b']} />
        </RoundedRect>
        <Rect x={27} y={-3.9} width={2.2} height={7.8} color="#c7ad62" />
        <Rect x={29.2} y={-3.17} width={13.6} height={6.35} color="#c9ced5" />
        <Rect x={42.8} y={-3.17} width={1.3} height={6.35} color="#0b0b0d" />
        <Rect x={44.1} y={-3.17} width={5.6} height={6.35} color="#c9ced5" />
        <Rect x={49.7} y={-3.17} width={1.3} height={6.35} color="#0b0b0d" />
        <RoundedRect x={51} y={-3.17} width={6} height={6.35} r={3} color="#d8dce2" />
      </Group>
    );
  })();
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { rotate: ang }]}>
      <Group transform={[{ translateX: 1.2 }, { translateY: 2.2 }]} opacity={0.6}>
        <RoundedRect x={0} y={-6} width={kind === 'xlr' ? 52 : kind === 'mains' ? 50 : 40} height={12} r={5} color="#000">
          <BlurMask blur={2.2} style="normal" />
        </RoundedRect>
      </Group>
      {body}
    </Group>
  );
}

/** A USB-C socket (face-on); with `plugged`, its plug's overmould seated in
 *  it and its boot toward the viewer. */
export function UsbC({ cx, cy, plugged }: { cx: number; cy: number; plugged: boolean }) {
  return (
    <Group>
      <RoundedRect x={cx - 5.2} y={cy - 2} width={10.4} height={4} r={2} color="#9aa0a8" />
      <RoundedRect x={cx - 4.4} y={cy - 1.3} width={8.8} height={2.6} r={1.3} color="#050506" />
      {plugged ? (
        <Group>
          <RoundedRect x={cx - 6 + 2} y={cy - 4 + 3} width={12} height={8} r={3} color="rgba(0,0,0,0.65)">
            <BlurMask blur={1.6} style="normal" />
          </RoundedRect>
          <RoundedRect x={cx - 6} y={cy - 4} width={12} height={8} r={3}>
            <LinearGradient start={vec(cx - 6, cy - 4)} end={vec(cx + 6, cy + 4)} colors={['#3a3d43', '#121315']} />
          </RoundedRect>
          <Circle cx={cx + 0.6} cy={cy + 0.8} r={2.4} color="#0b0b0d" />
        </Group>
      ) : null}
    </Group>
  );
}
