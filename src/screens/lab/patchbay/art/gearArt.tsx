/**
 * gearArt — the real equipment at each end of a patch pair (art grading
 * 2026-10-16: "sources and destinations are labelled rectangles"). Each
 * device is drawn as the object it is, at its true outline proportion, with
 * its name set BESIDE it (never on it):
 *
 *   rack gear  — a 19-inch front panel at true 482.6 : 88.9 mm (2U) aspect:
 *                rack ears with their oval mounting slots, and the controls
 *                that identify it (a mic pre's gain knob and XLR input, a
 *                compressor's VU meter, an EQ's two rows of band knobs, an
 *                interface's combo inputs and level LEDs)
 *   console    — a short run of channel strips: knob columns over fader caps
 *   synth      — a keyboard: control panel over a run of keys (black keys
 *                set in the 2 + 3 pattern of a real keyboard)
 *   monitor controller — a desktop controller with its big volume knob
 *
 * The connection point (where the rear wiring meets the pair) is always at
 * `cx`, on the device's bottom edge for a source and its top edge for a
 * destination, so the signal spine never floats off the gear.
 */
import type { ReactNode } from 'react';
import { Circle, G, Line, Path, Rect } from 'react-native-svg';

export type GearKind = 'console' | 'interface' | 'micpre' | 'comp' | 'eq' | 'synth' | 'monitor' | 'rack';

/** The kind of gear a pair-end label names (the labels are the lab's own
 *  scenario names — "CONSOLE OUT 1", "MIC PRE 1 OUT", "COMPRESSOR IN" …). */
export function gearKind(label: string): GearKind {
  const l = label.toUpperCase();
  if (/CONSOLE|MIXER/.test(l)) return 'console';
  if (/INTERFACE/.test(l)) return 'interface';
  if (/MIC PRE|PREAMP|VOCAL/.test(l)) return 'micpre';
  if (/COMP/.test(l)) return 'comp';
  if (/\bEQ\b/.test(l)) return 'eq';
  if (/SYNTH|KEYS|DRUM MACHINE/.test(l)) return 'synth';
  if (/MONITOR/.test(l)) return 'monitor';
  return 'rack';
}

const METAL = '#2b2c31';
const METAL_EDGE = '#4a4b52';
const LIT = '#ffffff';
const KNOB = '#16171a';
const KNOB_EDGE = '#6a6b73';

function Knob({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <G>
      <Circle cx={x} cy={y} r={r} fill={KNOB} stroke={KNOB_EDGE} strokeWidth={0.7} />
      <Line x1={x} y1={y} x2={x - r * 0.55} y2={y - r * 0.75} stroke="#d8d9de" strokeWidth={0.8} strokeLinecap="round" />
    </G>
  );
}

/** A 19-inch rack front panel (2U, true aspect) with its ears. */
function RackPanel({ x, y, w, children }: { x: number; y: number; w: number; children?: ReactNode }) {
  const h = (w * 88.9) / 482.6; // 2U at the true 19-inch width
  const ear = (w * 15.9) / 482.6;
  return (
    <G>
      <Rect x={x} y={y} width={w} height={h} rx={1.2} fill={METAL} stroke={METAL_EDGE} strokeWidth={0.8} />
      <Rect x={x + 0.8} y={y + 0.8} width={w - 1.6} height={1.2} fill={LIT} opacity={0.08} />
      {[x + ear, x + w - ear].map((ex) => (
        <Line key={ex} x1={ex} y1={y + 1} x2={ex} y2={y + h - 1} stroke="#000" strokeWidth={0.7} opacity={0.6} />
      ))}
      {[x + ear / 2, x + w - ear / 2].map((sx) =>
        [y + h * 0.18, y + h * 0.82].map((sy) => (
          <Rect key={`${sx}-${sy}`} x={sx - 1.9} y={sy - 1.1} width={3.8} height={2.2} rx={1.1} fill="#060607" />
        )),
      )}
      {children}
    </G>
  );
}

export const RACK_2U_H = (w: number) => (w * 88.9) / 482.6;

/**
 * One device, drawn in the box (x, y, w, h). `end` says which edge carries
 * the connection to the pair (bottom for a source, top for a destination);
 * the gear sits against that edge.
 */
export function GearArt({ kind, x, y, w, h, cx, end, accent }: {
  kind: GearKind;
  x: number;
  y: number;
  w: number;
  h: number;
  /** x of the connection point (the signal spine). */
  cx: number;
  end: 'bottom' | 'top';
  accent: string;
}) {
  // The connection: a short plug boot on the gear's edge, in the end's colour.
  const boot = (edgeY: number) => (
    <Rect x={cx - 2.6} y={end === 'bottom' ? edgeY - 0.5 : edgeY - 3.5} width={5.2} height={4} rx={1} fill="#0c0c0e" stroke={accent} strokeWidth={0.9} />
  );

  if (kind === 'console') {
    // A run of six channel strips seen from the operator's seat: a sloped
    // meter bridge, knob columns, then fader slots with their caps.
    const top = y;
    const bot = y + h;
    const strips = 6;
    const sw = (w - 8) / strips;
    return (
      <G>
        <Path d={`M ${x + 6} ${top} L ${x + w - 6} ${top} L ${x + w} ${bot} L ${x} ${bot} Z`} fill={METAL} stroke={METAL_EDGE} strokeWidth={0.8} />
        <Line x1={x + 4} y1={top + 5} x2={x + w - 4} y2={top + 5} stroke="#000" strokeWidth={0.7} opacity={0.6} />
        {Array.from({ length: strips }, (_, i) => {
          const sx = x + 4 + sw * (i + 0.5);
          return (
            <G key={i}>
              <Rect x={sx - 1.2} y={top + 1.3} width={2.4} height={2.6} fill={i % 3 === 0 ? '#3fae5a' : '#2a6b3a'} />
              <Knob x={sx} y={top + 9} r={1.9} />
              <Knob x={sx} y={top + 14} r={1.9} />
              <Line x1={sx} y1={top + 19} x2={sx} y2={bot - 2} stroke="#060607" strokeWidth={1.2} />
              <Rect x={sx - 2.6} y={top + 21 + (i % 3) * 2.5} width={5.2} height={3} rx={0.6} fill="#c9cad0" />
              {i < strips - 1 ? <Line x1={sx + sw / 2} y1={top + 6} x2={sx + sw / 2} y2={bot - 1} stroke="#000" strokeWidth={0.5} opacity={0.5} /> : null}
            </G>
          );
        })}
        {boot(end === 'bottom' ? bot : top)}
      </G>
    );
  }

  if (kind === 'synth') {
    // A keyboard: control panel over the keys; black keys in the 2 + 3 group.
    const top = y + (end === 'bottom' ? h - 26 : 0);
    const panelH = 9;
    const keysY = top + panelH;
    const keysH = 26 - panelH - 1;
    const whites = 15;
    const kw = (w - 6) / whites;
    const BLACK_AFTER = [0, 1, 3, 4, 5]; // C#, D#, F#, G#, A# within the octave
    return (
      <G>
        <Rect x={x} y={top} width={w} height={26} rx={2} fill={METAL} stroke={METAL_EDGE} strokeWidth={0.8} />
        {[0, 1, 2, 3].map((k) => <Knob key={k} x={x + 10 + k * 8} y={top + panelH / 2 + 0.5} r={2.2} />)}
        <Rect x={x + w - 34} y={top + 2.4} width={22} height={4.4} rx={0.6} fill="#0b1a12" stroke="#3a3b41" strokeWidth={0.5} />
        <Rect x={x + 3} y={keysY} width={w - 6} height={keysH} fill="#e9e9ec" />
        {Array.from({ length: whites - 1 }, (_, i) => (
          <Line key={i} x1={x + 3 + kw * (i + 1)} y1={keysY} x2={x + 3 + kw * (i + 1)} y2={keysY + keysH} stroke="#8a8b93" strokeWidth={0.5} />
        ))}
        {Array.from({ length: whites - 1 }, (_, i) =>
          BLACK_AFTER.includes(i % 7) ? (
            <Rect key={`b${i}`} x={x + 3 + kw * (i + 1) - kw * 0.3} y={keysY} width={kw * 0.6} height={keysH * 0.62} fill="#121214" />
          ) : null,
        )}
        {boot(end === 'bottom' ? top + 26 : top)}
      </G>
    );
  }

  if (kind === 'monitor') {
    // A desktop monitor controller: a wedge with the big volume knob.
    const bw = 64;
    const bh = 24;
    const bx = Math.min(Math.max(x, cx - bw / 2), x + w - bw);
    const by = end === 'bottom' ? y + h - bh : y;
    return (
      <G>
        <Path d={`M ${bx + 4} ${by} L ${bx + bw - 4} ${by} L ${bx + bw} ${by + bh} L ${bx} ${by + bh} Z`} fill={METAL} stroke={METAL_EDGE} strokeWidth={0.8} />
        <Circle cx={bx + bw / 2} cy={by + bh / 2 + 1} r={8} fill={KNOB} stroke={KNOB_EDGE} strokeWidth={0.8} />
        <Line x1={bx + bw / 2} y1={by + bh / 2 + 1} x2={bx + bw / 2 - 4} y2={by + bh / 2 - 5} stroke="#d8d9de" strokeWidth={1} strokeLinecap="round" />
        {[0, 1].map((k) => <Rect key={k} x={bx + 6} y={by + 6 + k * 7} width={7} height={4} rx={0.8} fill="#1d1e22" stroke="#55565e" strokeWidth={0.5} />)}
        {[0, 1].map((k) => <Rect key={`r${k}`} x={bx + bw - 13} y={by + 6 + k * 7} width={7} height={4} rx={0.8} fill="#1d1e22" stroke="#55565e" strokeWidth={0.5} />)}
        {boot(end === 'bottom' ? by + bh : by)}
      </G>
    );
  }

  // Rack gear: a 2U front panel at true 19-inch aspect, against the end edge.
  const rh = RACK_2U_H(w);
  const ry = end === 'bottom' ? y + h - rh : y;
  const ear = (w * 15.9) / 482.6;
  const fx = x + ear + 2; // face area inside the ears
  const fw = w - 2 * ear - 4;
  const midY = ry + rh / 2;
  let face: ReactNode = null;
  if (kind === 'micpre') {
    face = (
      <G>
        {/* XLR input: the three-pin socket face */}
        <Circle cx={fx + 7} cy={midY} r={5} fill="#0b0b0d" stroke="#8a8b93" strokeWidth={0.8} />
        {[[-1.6, -1.4], [1.6, -1.4], [0, 1.8]].map(([dx, dy], k) => <Circle key={k} cx={fx + 7 + dx} cy={midY + dy} r={0.7} fill="#9a9ba3" />)}
        {/* 48 V and polarity toggles */}
        {[0, 1].map((k) => <Rect key={k} x={fx + 17 + k * 6} y={midY - 3} width={2.4} height={6} rx={1} fill="#c9cad0" />)}
        <Knob x={fx + fw * 0.55} y={midY} r={6.5} />
        <Knob x={fx + fw * 0.78} y={midY} r={3.5} />
        {[0, 1, 2, 3, 4].map((k) => <Rect key={`l${k}`} x={fx + fw - 4} y={ry + 3 + k * 3} width={2.4} height={2} fill={k === 0 ? '#e0a33a' : '#3fae5a'} opacity={k < 2 ? 0.45 : 1} />)}
      </G>
    );
  } else if (kind === 'comp') {
    face = (
      <G>
        {/* VU meter window with its needle */}
        <Rect x={fx + 2} y={ry + 3} width={22} height={rh - 6} rx={1} fill="#d9cfa8" stroke="#0b0b0d" strokeWidth={0.8} />
        <Path d={`M ${fx + 6} ${ry + 9} Q ${fx + 13} ${ry + 5.5} ${fx + 20} ${ry + 9}`} fill="none" stroke="#3a3328" strokeWidth={0.6} />
        <Line x1={fx + 13} y1={ry + rh - 4} x2={fx + 17} y2={ry + 7} stroke="#1a1714" strokeWidth={0.7} />
        {[0, 1, 2, 3].map((k) => <Knob key={k} x={fx + 34 + k * ((fw - 40) / 3)} y={midY} r={3.6} />)}
      </G>
    );
  } else if (kind === 'eq') {
    face = (
      <G>
        {[0, 1, 2, 3].map((k) => (
          <G key={k}>
            <Knob x={fx + 8 + k * ((fw - 16) / 3)} y={midY - 3.8} r={2.8} />
            <Knob x={fx + 8 + k * ((fw - 16) / 3)} y={midY + 4.2} r={2.8} />
          </G>
        ))}
      </G>
    );
  } else if (kind === 'interface') {
    face = (
      <G>
        {/* two combo (XLR + ¼-inch) inputs, gain knobs, level LEDs, phones */}
        {[0, 1].map((k) => (
          <G key={k}>
            <Circle cx={fx + 6 + k * 13} cy={midY} r={5} fill="#0b0b0d" stroke="#8a8b93" strokeWidth={0.8} />
            <Circle cx={fx + 6 + k * 13} cy={midY} r={1.8} fill="#1d1e22" stroke="#6a6b73" strokeWidth={0.5} />
          </G>
        ))}
        {[0, 1].map((k) => <Knob key={`g${k}`} x={fx + 36 + k * 11} y={midY} r={3.6} />)}
        {[0, 1, 2, 3, 4, 5].map((k) => <Rect key={`l${k}`} x={fx + 56 + k * 3.2} y={midY - 1} width={2.2} height={2} fill={k > 4 ? '#e0a33a' : '#3fae5a'} opacity={k > 3 ? 0.4 : 1} />)}
        <Circle cx={fx + fw - 4} cy={midY} r={2.6} fill="#0b0b0d" stroke="#8a8b93" strokeWidth={0.6} />
      </G>
    );
  } else {
    face = (
      <G>
        {[0, 1, 2, 3, 4].map((k) => <Knob key={k} x={fx + 8 + k * ((fw - 16) / 4)} y={midY} r={3.4} />)}
      </G>
    );
  }
  return (
    <G>
      <RackPanel x={x} y={ry} w={w}>{face}</RackPanel>
      {boot(end === 'bottom' ? ry + rh : ry)}
    </G>
  );
}

/** A loose ¼-inch TRS patch-cord plug lying along +x (handle, sleeve,
 *  insulator, ring, insulator, tip), its cord leaving from the handle's left
 *  end at (x, y) — the bay is a ¼-inch bay, so its cords carry ¼-inch plugs
 *  (B-PB-01, 2026-10-21; it used to be drawn as TT/bantam). True proportions at
 *  0.52 units per mm: 6.35 mm shaft (3.3 units) × 32 mm (16.6 units) — tip
 *  6.9 mm with its neck groove, insulators 2.9 mm, ring 4.9 mm, sleeve
 *  14.4 mm — behind a short molded boot ≈ 10.7 mm across. Length 28.6 units. */
export function CordPlug({ x, y, color }: { x: number; y: number; color: string }) {
  const s = x + 12; // the handle face: the shaft starts here
  return (
    <G>
      <Path d={`M ${x} ${y - 1.9} L ${x + 3} ${y - 2.8} L ${s} ${y - 2.8} L ${s} ${y + 2.8} L ${x + 3} ${y + 2.8} L ${x} ${y + 1.9} Z`} fill="#1d1e22" stroke={color} strokeWidth={1} />
      <Rect x={s} y={y - 1.65} width={7.5} height={3.3} fill="#8a8b93" />
      <Rect x={s + 7.5} y={y - 1.65} width={1.5} height={3.3} fill="#141518" />
      <Rect x={s + 9} y={y - 1.65} width={2.55} height={3.3} fill="#c8a24a" />
      <Rect x={s + 11.55} y={y - 1.65} width={1.5} height={3.3} fill="#141518" />
      <Path d={`M ${s + 13.05} ${y - 1.05} L ${s + 14.2} ${y - 1.05} L ${s + 14.6} ${y - 1.65} Q ${s + 16.6} ${y - 1.65} ${s + 16.6} ${y} Q ${s + 16.6} ${y + 1.65} ${s + 14.6} ${y + 1.65} L ${s + 14.2} ${y + 1.05} L ${s + 13.05} ${y + 1.05} Z`} fill={color} />
    </G>
  );
}

