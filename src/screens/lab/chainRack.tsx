/**
 * THE CHAIN RACK — the Signal Chain Builder's display drawn as real
 * outboard (art fix 2026-10-16, lab-art grading: "the chain is text chips
 * joined by arrows: no module or signal drawing; the glass is mostly blank
 * with the chain empty; the interaction shows only as three GR numbers").
 *
 * Nine half-rack processors in this rack's fixed order, three to
 * a row, each a lit front panel with ITS controls set where the lab's
 * teaching defaults put them (the EQ's gain knob at +9 dB, the compressor's
 * threshold at −30 dB and ratio at 4:1 …), and a power/active LED. One patch
 * cable — a single traceable lane — runs from the source into the first
 * unit, out of each unit into the next, round the end of each row and on to
 * the output. A bypassed unit stays in the rack, dark; with every unit
 * bypassed the picture still says "the signal passes straight through, dry".
 *
 * The dynamics units (COMP, GATE, LIMIT) carry their own gain-reduction LED
 * row on the panel, lit from the engine's MEASURED fxGrStatus, and their
 * caption swaps the setting for the live GR number while the chain plays —
 * so "the EQ boost makes the compressor work harder" shows AT the compressor,
 * on the patch that feeds it (a scenario lights the patches it is about).
 *
 * Words sit UNDER each unit (≥ 9 pt), never on a drawing. Static except the
 * LEDs, which follow the measured readout (no decorative motion).
 */
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Canvas, Circle, Group, Line, LinearGradient, Path, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import { colors, fonts } from '../../theme/tokens';

export type ChainUnit = {
  id: number;
  label: string;
  /** The teaching default, as printed under the unit. */
  setting: string;
  /** Knob pointer positions 0..1 (the default settings on this unit's
   *  teaching range), left to right. */
  knobs: number[];
  /** A dynamics unit: its GR LED row and live readout key. */
  gr?: 'comp' | 'gate' | 'limiter';
  /** Full-scale GR for the LED row (dB). */
  grMax?: number;
};

const AMBER = '#ffc64d';
const GR_SEGS = 8;

function knobPointer(cx: number, cy: number, r: number, v: number) {
  // A 300° sweep from 7 o'clock (v = 0) to 5 o'clock (v = 1).
  const a = ((-150 + 300 * Math.max(0, Math.min(1, v))) * Math.PI) / 180;
  return { x1: cx + Math.sin(a) * r * 0.25, y1: cy - Math.cos(a) * r * 0.25, x2: cx + Math.sin(a) * r * 0.86, y2: cy - Math.cos(a) * r * 0.86 };
}

/** One half-rack front panel at (x, y), `uw` × `uh`. */
function UnitPanel({ x, y, uw, uh, unit, on, live, grDb, hi }: { x: number; y: number; uw: number; uh: number; unit: ChainUnit; on: boolean; live: boolean; grDb: number; hi: boolean }) {
  const ear = Math.max(5, uw * 0.07);
  const kR = Math.min(uh * 0.24, (uw - ear * 2 - 16) / (unit.knobs.length * 2.6));
  const ledX = x + ear + 6;
  const ledY = y + uh * 0.3;
  const knobsX0 = x + ear + 14 + kR;
  const knobGap = kR * 2.55;
  const knobY = unit.gr ? y + uh * 0.42 : y + uh * 0.52;
  const lit = on && live && unit.gr ? Math.round(Math.min(1, Math.max(0, grDb) / (unit.grMax ?? 24)) * GR_SEGS) : 0;
  const segW = (uw - ear * 2 - 20) / GR_SEGS;
  return (
    <Group opacity={on ? 1 : 0.5}>
      {/* drop shadow */}
      <RoundedRect x={x + 1.5} y={y + 2} width={uw} height={uh} r={2.5} color="#000" opacity={0.55} />
      {/* the anodised panel, lit from the upper left */}
      <RoundedRect x={x} y={y} width={uw} height={uh} r={2.5}>
        <LinearGradient start={vec(x, y)} end={vec(x, y + uh)} colors={on ? ['#4a4d56', '#2e3037', '#1d1e23'] : ['#33353b', '#232429', '#18191d']} />
      </RoundedRect>
      <RoundedRect x={x + 0.5} y={y + 0.5} width={uw - 1} height={uh - 1} r={2.2} style="stroke" strokeWidth={1} color={hi ? AMBER : '#5d616b'} opacity={hi ? 0.95 : 0.7} />
      {/* rack ears with their slotted screw holes */}
      {[x + ear * 0.5, x + uw - ear * 0.5].map((ex) => (
        <Group key={ex}>
          <Line p1={vec(ex === x + ear * 0.5 ? x + ear : x + uw - ear, y + 2)} p2={vec(ex === x + ear * 0.5 ? x + ear : x + uw - ear, y + uh - 2)} color="#16171b" strokeWidth={1} />
          <RoundedRect x={ex - 1.6} y={y + uh * 0.2} width={3.2} height={uh * 0.16} r={1.6} color="#0d0e11" />
          <RoundedRect x={ex - 1.6} y={y + uh * 0.64} width={3.2} height={uh * 0.16} r={1.6} color="#0d0e11" />
        </Group>
      ))}
      {/* active LED (in the chain), lit amber while the chain plays */}
      <Circle cx={ledX} cy={ledY} r={2.1} color={on ? (live ? AMBER : '#8a6a2a') : '#2a2b30'} />
      {on && live ? <Circle cx={ledX} cy={ledY} r={4} color={AMBER} opacity={0.25} /> : null}
      {/* the controls, at the lab's teaching defaults */}
      {unit.knobs.map((v, i) => {
        const cx = knobsX0 + i * knobGap;
        const p = knobPointer(cx, knobY, kR, v);
        return (
          <Group key={i}>
            <Circle cx={cx + 0.6} cy={knobY + 0.9} r={kR} color="#000" opacity={0.5} />
            <Circle cx={cx} cy={knobY} r={kR}>
              <LinearGradient start={vec(cx - kR, knobY - kR)} end={vec(cx + kR, knobY + kR)} colors={['#c9ccd3', '#7d828c', '#3a3d44']} />
            </Circle>
            <Circle cx={cx} cy={knobY} r={kR * 0.72} color="#2a2c32" />
            <Line p1={vec(p.x1, p.y1)} p2={vec(p.x2, p.y2)} color="#f2f3f5" strokeWidth={Math.max(1, kR * 0.22)} strokeCap="round" />
          </Group>
        );
      })}
      {/* the dynamics units' gain-reduction LED row (measured) */}
      {unit.gr
        ? Array.from({ length: GR_SEGS }, (_, i) => (
            <RoundedRect key={i} x={x + ear + 10 + i * segW + 0.6} y={y + uh * 0.76} width={segW - 1.2} height={Math.max(2.4, uh * 0.11)} r={0.8} color={i < lit ? AMBER : '#121317'} />
          ))
        : null}
    </Group>
  );
}

export function ChainRack({
  w,
  h,
  units,
  enabled,
  live,
  gr,
  hotPatches,
}: {
  w: number;
  h: number;
  units: readonly ChainUnit[];
  enabled: Record<number, boolean>;
  live: boolean;
  gr: { comp: number; gate: number; limiter: number };
  /** Patches to light (index i = the patch INTO units[i]; units.length = into OUT). */
  hotPatches: readonly number[];
}) {
  const cols = 3;
  const rows = Math.ceil(units.length / cols);
  // Gutters for the SRC / OUT words under the lane's free ends.
  const g = 20;
  const colW = (w - g * 2) / cols;
  const rowH = h / rows;
  const labelH = 13;
  const uw = Math.min(colW - 18, 96);
  const uh = Math.max(22, Math.min(uw / 2.5, rowH - labelH - 16));
  const cell = (i: number) => {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const x = g + c * colW + (colW - uw) / 2;
    const y = r * rowH + 3;
    return { x, y, r, c };
  };

  // The patch cable: one lane through every unit (jacks at mid-height on the
  // panel's sides), round the end of each row through the gap below it.
  const patches = useMemo(() => {
    const segs: { path: ReturnType<typeof Skia.Path.Make>; into: number }[] = [];
    const cy = (i: number) => cell(i).y + uh / 2;
    // SRC → unit 0
    {
      const p = Skia.Path.Make();
      const c0 = cell(0);
      p.moveTo(2, cy(0));
      p.lineTo(c0.x, cy(0));
      segs.push({ path: p, into: 0 });
    }
    for (let i = 1; i <= units.length; i++) {
      const p = Skia.Path.Make();
      const a = cell(i - 1);
      const outX = a.x + uw;
      const outY = cy(i - 1);
      if (i === units.length) {
        // last unit → OUT
        p.moveTo(outX, outY);
        p.lineTo(w - 2, outY);
      } else {
        const b = cell(i);
        if (b.r === a.r) {
          p.moveTo(outX, outY);
          p.lineTo(b.x, outY);
        } else {
          // round the row end: out right, down into the gap, back left, down
          // into the next row's first input — square turns, one lane.
          const laneY = a.y + uh + labelH + (rowH - uh - labelH) / 2 + 1;
          const rx = Math.min(w - 6, outX + (colW - uw) / 2 + g * 0.5);
          const lx = Math.max(6, b.x - (colW - uw) / 2 - g * 0.5);
          p.moveTo(outX, outY);
          p.lineTo(rx, outY);
          p.lineTo(rx, laneY);
          p.lineTo(lx, laneY);
          p.lineTo(lx, cy(i));
          p.lineTo(b.x, cy(i));
        }
      }
      segs.push({ path: p, into: i });
    }
    return segs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, h, uw, uh, rowH, colW, units.length]);

  const grOf = (u: ChainUnit) => (u.gr ? gr[u.gr] : 0);
  const lastY = cell(units.length - 1).y + uh / 2;
  const firstY = cell(0).y + uh / 2;

  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }}>
        {patches.map((s) => {
          const hot = hotPatches.includes(s.into);
          return (
            <Group key={s.into}>
              <Path path={s.path} style="stroke" strokeWidth={hot ? 4.2 : 3.2} strokeJoin="round" strokeCap="round" color="#060608" />
              <Path path={s.path} style="stroke" strokeWidth={hot ? 2.4 : 1.6} strokeJoin="round" strokeCap="round" color={hot ? AMBER : live ? '#c08a2e' : '#6d717b'} />
            </Group>
          );
        })}
        {units.map((u, i) => {
          const c = cell(i);
          return (
            <UnitPanel
              key={u.id}
              x={c.x}
              y={c.y}
              uw={uw}
              uh={uh}
              unit={u}
              on={!!enabled[u.id]}
              live={live}
              grDb={grOf(u)}
              hi={hotPatches.includes(i) || hotPatches.includes(i + 1)}
            />
          );
        })}
        {/* jack plugs on the panel sides */}
        {units.map((u, i) => {
          const c = cell(i);
          const y = c.y + uh / 2;
          return (
            <Group key={`j${u.id}`}>
              <RoundedRect x={c.x - 3.5} y={y - 2} width={4} height={4} r={1} color="#9aa0aa" />
              <RoundedRect x={c.x + uw - 0.5} y={y - 2} width={4} height={4} r={1} color="#9aa0aa" />
            </Group>
          );
        })}
      </Canvas>
      {/* source and output ends, under the lane's free ends (not on a unit) */}
      <Text style={[st.end, { left: 1, top: firstY + 3 }]}>SRC</Text>
      <Text style={[st.end, { right: 1, top: lastY + 3, textAlign: 'right' }]}>OUT</Text>
      {units.map((u, i) => {
        const c = cell(i);
        const on = !!enabled[u.id];
        const showGr = on && live && !!u.gr;
        const grv = grOf(u);
        return (
          <View key={`l${u.id}`} style={[st.labelRow, { left: g + c.c * colW - 6, top: c.y + uh + 2, width: colW + 12 }]} pointerEvents="none">
            <Text style={[st.name, on && st.nameOn]}>
              {u.label}
            </Text>
            <Text style={[st.setting, showGr && st.grLive]}>
              {showGr ? (grv >= 0.05 ? `GR −${grv.toFixed(1)} dB` : 'GR 0.0 dB') : on ? u.setting : 'bypassed'}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const st = StyleSheet.create({
  end: { position: 'absolute', fontFamily: fonts.oswaldSemiBold, fontSize: 9, letterSpacing: 0.6, color: colors.textSub },
  labelRow: { position: 'absolute', flexDirection: 'row', justifyContent: 'center', alignItems: 'baseline', gap: 4 },
  name: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 0.6, color: colors.textSub },
  nameOn: { color: colors.amber },
  setting: { fontFamily: fonts.oswaldSemiBold, fontSize: 9, letterSpacing: 0.3, color: '#8d8f99' },
  grLive: { color: '#ffd35e' },
});
