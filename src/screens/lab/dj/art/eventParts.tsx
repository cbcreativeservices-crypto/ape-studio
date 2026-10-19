/**
 * eventParts — the event rig's extra hardware vocabulary (Stage 2b), drawn
 * like art/parts (the real object, mm, upper-left light): the 5-pin DIN MIDI
 * socket and plug, a 3.5 mm TRS-MIDI socket, a USB-A socket.
 */
import { useMemo } from 'react';
import { BlurMask, Circle, Group, LinearGradient, Path, RadialGradient, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import { INK } from './ink';

/** The five contacts of a DIN-5 (180°) connector: a half circle in the
 *  lower half (y down), the key notch at the top. */
const DIN_PINS = [0, 45, 90, 135, 180].map((a) => (a * Math.PI) / 180);

/** A 5-pin DIN socket face-on (MIDI IN / OUT): the metal shell, the black
 *  insert with its five holes on a half circle, the key notch at the top. */
export function DinSocket({ cx, cy, d }: { cx: number; cy: number; d: number }) {
  const r = d / 2;
  return (
    <Group>
      <Circle cx={cx} cy={cy} r={r * 1.18}>
        <RadialGradient c={vec(cx - r * 0.4, cy - r * 0.4)} r={r * 1.6} colors={[INK.metalHi, INK.metalMid, INK.metalLo]} />
      </Circle>
      <Circle cx={cx} cy={cy} r={r} color="#0b0b0d" />
      <RoundedRect x={cx - r * 0.12} y={cy - r * 1.05} width={r * 0.24} height={r * 0.28} r={r * 0.05} color={INK.metalMid} />
      {DIN_PINS.map((a) => (
        <Group key={a}>
          <Circle cx={cx + Math.cos(a) * r * 0.55} cy={cy + Math.sin(a) * r * 0.55} r={r * 0.12} color="#000" />
          <Circle cx={cx + Math.cos(a) * r * 0.55} cy={cy + Math.sin(a) * r * 0.55} r={r * 0.07} color="#d8b863" />
        </Group>
      ))}
    </Group>
  );
}

/** A plugged DIN plug's back, face-on (its moulded boot toward you). */
export function DinPlugFace({ cx, cy, d, colour = '#2a2c31' }: { cx: number; cy: number; d: number; colour?: string }) {
  const r = d / 2;
  return (
    <Group>
      <Circle cx={cx + r * 0.4} cy={cy + r * 0.55} r={r * 1.3} color="rgba(0,0,0,0.7)">
        <BlurMask blur={r * 0.3} style="normal" />
      </Circle>
      <Circle cx={cx} cy={cy} r={r * 1.22}>
        <RadialGradient c={vec(cx - r * 0.4, cy - r * 0.45)} r={r * 1.6} colors={['#d6dae0', '#7a8089', '#3a3e45']} />
      </Circle>
      <Circle cx={cx + 0.6} cy={cy + 0.8} r={r * 0.75}>
        <RadialGradient c={vec(cx - r * 0.2, cy - r * 0.3)} r={r} colors={[colour, '#060607']} />
      </Circle>
    </Group>
  );
}

/** A USB-A socket face-on (a laptop's port, a charger). */
export function UsbASocket({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <Group>
      <RoundedRect x={x} y={y} width={13 * s} height={5.6 * s} r={0.6 * s} color="#9aa0a8" />
      <RoundedRect x={x + 0.8 * s} y={y + 0.8 * s} width={11.4 * s} height={4 * s} r={0.4 * s} color="#050506" />
      <RoundedRect x={x + 1.6 * s} y={y + 1.1 * s} width={9.8 * s} height={1.6 * s} r={0.3 * s} color="#3c78d8" />
    </Group>
  );
}

/** A small rectangular ISOLATOR barrel in a cable run (USB or audio), drawn
 *  from the side at (x, y) pointing along +x. */
export function IsolatorBarrel({ x, y, label = true, colour }: { x: number; y: number; label?: boolean; colour?: string }) {
  const body = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    p.addRRect(Skia.RRectXY(Skia.XYWHRect(x - 16, y - 7, 32, 14), 3, 3));
    return p.detach();
  }, [x, y]);
  void label;
  return (
    <Group>
      <Path path={body} color="rgba(0,0,0,0.6)" transform={[{ translateX: 1.5 }, { translateY: 2.5 }]}>
        <BlurMask blur={2} style="normal" />
      </Path>
      <Path path={body}>
        <LinearGradient start={vec(x, y - 7)} end={vec(x, y + 7)} colors={colour ? ['#4a4d54', colour] : ['#4a6fa8', '#203a66']} />
      </Path>
      <Path path={body} style="stroke" strokeWidth={0.6} color="rgba(255,255,255,0.3)" />
    </Group>
  );
}
