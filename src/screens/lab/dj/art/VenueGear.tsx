/**
 * VenueGear — the venue side of screen 20, drawn as the real objects and
 * AUTHORED IN MILLIMETRES (class dimensions in SOURCES.md, "Drawings,
 * Stage 2b"):
 *
 *   StageBox      the venue's tie-in box at the side of the stage, about
 *                 20 m of cable from the booth (200 × 116 face):
 *                 four XLR female inputs numbered and labelled on its
 *                 scribble strip (DJ L · DJ R · MIC · SPARE), the snake's
 *                 boot out of its side to the engineer's position.
 *   Subwoofer     an 18-inch subwoofer, front (550 × 700): the cabinet, the
 *                 driver behind its grille, the port slots, the castors.
 *   PowerAmp      a 2U rack power amplifier front (482 × 88) — what a
 *                 PASSIVE system needs between the processor and the boxes.
 *   PowerAmpRear  the same amp from BEHIND (R3-DJ-02): its Speakon NL4
 *                 outputs, XLR inputs, mains inlet and fan.
 *   PassiveTopRear a passive top's BACK (365 × 600): no amplifier, no power,
 *                 no LED — only the recessed cup with its NL4 INPUT and LINK.
 *   SpeakerLead   the Speakon speaker lead (heavy, unshielded two-core) with
 *                 an NL4FC connector seated at each end, true size.
 *   XoverPlot     the venue processor's crossover, plotted from the SAME
 *                 biquads the render uses (djEventRender.xoverResp) (tops above 100 Hz, the mono sub
 *                 below; without the crossover, their own natural roll-offs
 *                 overlap and the sum bulges).
 *
 * Generic: no brand, no logo.
 */
import { memo, useContext, useMemo } from 'react';
import { BlurMask, Circle, DashPathEffect, Group, Line, LinearGradient, Path, RadialGradient, Rect, RoundedRect, Skia, SweepGradient, vec } from '@shopify/react-native-skia';
import { INK } from './ink';
import { Cable, IecInlet, Knob, Led, Rocker, XlrSocket } from './parts';
import { CableFlag } from './cables';
import { SPEAKER_H, SPEAKER_W } from '../geometry/gearGeometry';
import { AMP_REAR, NL4, PASSIVE_REAR, SPEAKER_TAG, speakerLeadXAt, speakerTagBox } from '../geometry/eventGeometry';
import { SceneFontsContext, SceneText, useLabelMm } from './sceneText';
import { textWidthPt } from './Scene';
import { xoverResp } from '../engine/djEventRender';
import { XOVER_HZ } from '../model/djEvent';

/** Legends read from the 2x full-screen step (visual review #22). */
const LEG = 4.2;

/* ── the stage box ────────────────────────────────────────────────────── */

export const SB_W = 200;
export const SB_H = 116;
export const SB_IN = [
  { n: 13, label: 'DJ L', x: 32, y: 62 },
  { n: 14, label: 'DJ R', x: 78, y: 62 },
  { n: 15, label: 'MIC', x: 124, y: 62 },
  { n: 16, label: 'SPARE', x: 170, y: 62 },
] as const;
/** How far left of its socket's centre each printed channel number sits (mm):
 *  a cable plugged in from above runs down the socket's centre line. */
export const SB_NUM_DX = 9;

export const StageBox = memo(function StageBox({ x, y, hot = [] }: { x: number; y: number; hot?: readonly number[] }) {
  // the scribble strips are written in marker at 9 pt, so they read on the
  // glass (the lesson is the inputs LABELLED DJ L and DJ R — review #15)
  const marker = useLabelMm(9);
  return (
    <Group transform={[{ translateX: x }, { translateY: y }]}>
      {/* the snake leaving its side */}
      <Path path={useMemo(() => { const p = Skia.PathBuilder.Make(); p.moveTo(SB_W - 4, SB_H - 30); p.cubicTo(SB_W + 30, SB_H - 30, SB_W + 26, SB_H + 30, SB_W + 60, SB_H + 34); return p.detach(); }, [])} style="stroke" strokeWidth={13} color="#0b0c0e" strokeCap="round" />
      <Path path={useMemo(() => { const p = Skia.PathBuilder.Make(); p.moveTo(SB_W - 4, SB_H - 30); p.cubicTo(SB_W + 30, SB_H - 30, SB_W + 26, SB_H + 30, SB_W + 60, SB_H + 34); return p.detach(); }, [])} style="stroke" strokeWidth={10} color="#1d1f23" strokeCap="round" />
      <RoundedRect x={4} y={7} width={SB_W} height={SB_H} r={6} color="rgba(0,0,0,0.65)">
        <BlurMask blur={6} style="normal" />
      </RoundedRect>
      <RoundedRect x={0} y={0} width={SB_W} height={SB_H} r={6}>
        <LinearGradient start={vec(0, 0)} end={vec(SB_W, SB_H)} colors={['#3a3d43', '#22242a', '#16171a']} />
      </RoundedRect>
      <RoundedRect x={0.6} y={0.6} width={SB_W - 1.2} height={SB_H - 1.2} r={5.5} style="stroke" strokeWidth={1} color={INK.bevel} />
      {[[8, 8], [SB_W - 8, 8], [8, SB_H - 8], [SB_W - 8, SB_H - 8]].map(([sx, sy]) => (
        <Circle key={`${sx}${sy}`} cx={sx} cy={sy} r={2.2} color="#8b9099" />
      ))}
      {/* the title right-aligned, clear of the DJ L / DJ R runs that come
          down into inputs 13 and 14 from above (DJ-R2-06) */}
      <SceneText x={SB_W - 12} y={20} size={6} text="STAGE BOX · TO FOH" color={INK.amber} face="label" align="right" />
      {SB_IN.map((j) => (
        <Group key={j.n}>
          <XlrSocket cx={j.x} cy={j.y} d={22} male={false} />
          {/* the scribble strip */}
          <RoundedRect x={j.x - 21} y={j.y + 17} width={42} height={Math.max(15, marker * 1.35)} r={2} color={hot.includes(j.n) ? '#f4ecd0' : '#cfc9b6'} />
          <Group transform={[{ translateX: j.x }, { translateY: j.y + 17 + Math.max(15, marker * 1.35) / 2 + marker * 0.36 }, { rotate: -0.04 }]}>
            <SceneText x={0} y={0} size={marker} text={j.label} color={hot.includes(j.n) ? '#16306e' : '#5b5f6a'} face="label" align="center" />
          </Group>
          {/* the channel number above the socket's left corner, off the
              cable's line into it (DJ-R2-06) */}
          <SceneText x={j.x - SB_NUM_DX} y={j.y - 18} size={LEG + 1} text={String(j.n)} color={INK.print} face="label" align="center" />
        </Group>
      ))}
    </Group>
  );
});

/* ── an 18-inch subwoofer (front) ─────────────────────────────────────── */

export const SUB_W = 550;
export const SUB_H = 700;

export const Subwoofer = memo(function Subwoofer({ x, y, s = 1, on }: { x: number; y: number; s?: number; on: boolean }) {
  const W = SUB_W;
  const H = SUB_H;
  const g = { x: 26, y: 26, w: W - 52, h: H - 120 };
  const holes = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    const pitch = 9;
    let row = 0;
    for (let yy = g.y + 6; yy < g.y + g.h - 4; yy += pitch * 0.87, row++) for (let xx = g.x + 6 + (row % 2) * (pitch / 2); xx < g.x + g.w - 4; xx += pitch) p.addCircle(xx, yy, pitch * 0.33);
    return p.detach();
  }, [g.x, g.y, g.w, g.h]);
  const webs = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    p.addRRect(Skia.RRectXY(Skia.XYWHRect(g.x, g.y, g.w, g.h), 12, 12));
    p.addPath(holes);
    p.setFillType(1);
    return p.detach();
  }, [g.x, g.y, g.w, g.h, holes]);
  const R = 457 / 2; // an 18-inch driver
  const cx = W / 2;
  const cy = g.y + g.h / 2;
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { scale: s }]}>
      <RoundedRect x={8} y={14} width={W} height={H} r={14} color="rgba(0,0,0,0.7)">
        <BlurMask blur={14} style="normal" />
      </RoundedRect>
      <RoundedRect x={0} y={0} width={W} height={H} r={14}>
        <LinearGradient start={vec(0, 0)} end={vec(W, H)} colors={['#2f3237', '#1a1b1f', '#0f1012']} />
      </RoundedRect>
      <Rect x={3} y={14} width={9} height={H - 28}>
        <LinearGradient start={vec(3, 0)} end={vec(12, 0)} colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.02)']} />
      </Rect>
      <RoundedRect x={0} y={0} width={W} height={H} r={14} style="stroke" strokeWidth={2.4} color={INK.bevel} />
      {/* the driver behind the grille */}
      <Circle cx={cx} cy={cy} r={R} color="#050506" />
      <Circle cx={cx} cy={cy} r={R * 0.97}>
        <SweepGradient c={vec(cx, cy)} colors={['#3a3d43', '#202226', '#3a3d43', '#1a1b1f', '#3a3d43']} />
      </Circle>
      <Circle cx={cx} cy={cy} r={R * 0.88}>
        <RadialGradient c={vec(cx - R * 0.35, cy - R * 0.4)} r={R * 1.25} colors={['#5a5e66', '#26282d', '#101113']} positions={[0, 0.5, 1]} />
      </Circle>
      <Circle cx={cx} cy={cy} r={R * 0.26}>
        <RadialGradient c={vec(cx - R * 0.08, cy - R * 0.09)} r={R * 0.3} colors={['#6a6e76', '#202226']} />
      </Circle>
      <Path path={holes} color="rgba(0,0,0,0.25)" />
      <Path path={webs} opacity={0.84}>
        <LinearGradient start={vec(g.x, g.y)} end={vec(g.x + g.w, g.y + g.h)} colors={['#3a3d43', '#26282d', '#1a1b1f']} />
      </Path>
      <RoundedRect x={g.x} y={g.y} width={g.w} height={g.h} r={12} style="stroke" strokeWidth={3} color="#3a3d43" />
      {/* the port slots under the grille, and the castors */}
      {[0, 1].map((i) => (
        <RoundedRect key={i} x={60 + i * 230} y={H - 82} width={200} height={34} r={10} color="#050506" />
      ))}
      {[60, W - 60].map((cxx) => (
        <Group key={cxx}>
          <Circle cx={cxx} cy={H + 12} r={14} color="#0b0c0e" />
          <Circle cx={cxx} cy={H + 12} r={8}>
            <RadialGradient c={vec(cxx - 3, H + 9)} r={10} colors={[INK.metalHi, INK.metalLo]} />
          </Circle>
        </Group>
      ))}
      <Led cx={W / 2} cy={H - 24} r={5} on={on} colour={INK.blue} />
    </Group>
  );
});

/* ── a 2U power amplifier (front) ─────────────────────────────────────── */

export const AMP_W = 482;
export const AMP_H = 88;

export const PowerAmp = memo(function PowerAmp({ x, y, s = 1, on, signal }: { x: number; y: number; s?: number; on: boolean; signal: boolean }) {
  return (
    <Group transform={[{ translateX: x }, { translateY: y }, { scale: s }]}>
      <RoundedRect x={4} y={7} width={AMP_W} height={AMP_H} r={4} color="rgba(0,0,0,0.65)">
        <BlurMask blur={6} style="normal" />
      </RoundedRect>
      <RoundedRect x={0} y={0} width={AMP_W} height={AMP_H} r={4}>
        <LinearGradient start={vec(0, 0)} end={vec(0, AMP_H)} colors={['#34373d', '#1c1e22', '#121316']} />
      </RoundedRect>
      <RoundedRect x={0.6} y={0.6} width={AMP_W - 1.2} height={AMP_H - 1.2} r={3.5} style="stroke" strokeWidth={1} color={INK.bevel} />
      {/* rack ears and handles */}
      {[0, AMP_W - 22].map((ex) => (
        <Group key={ex}>
          <Rect x={ex} y={0} width={22} height={AMP_H} color="#26282d" />
          <RoundedRect x={ex + 7} y={18} width={8} height={10} r={4} color="#060607" />
          <RoundedRect x={ex + 7} y={AMP_H - 28} width={8} height={10} r={4} color="#060607" />
        </Group>
      ))}
      {[34, AMP_W - 48].map((hx) => (
        <RoundedRect key={hx} x={hx} y={8} width={14} height={AMP_H - 16} r={7}>
          <LinearGradient start={vec(hx, 0)} end={vec(hx + 14, 0)} colors={['#6f757e', '#d8dce2', '#4a4f57']} />
        </RoundedRect>
      ))}
      {/* the vent grille */}
      {Array.from({ length: 14 }, (_, i) => (
        <RoundedRect key={i} x={70 + i * 12} y={18} width={6} height={AMP_H - 36} r={3} color="#060607" />
      ))}
      <Knob cx={290} cy={44} d={28} value={0.78} />
      <Knob cx={346} cy={44} d={28} value={0.78} />
      <SceneText x={290} y={20} size={LEG + 1} text="CH A" color={INK.print} face="label" align="center" />
      <SceneText x={346} y={20} size={LEG + 1} text="CH B" color={INK.print} face="label" align="center" />
      <Led cx={384} cy={34} r={3} on={on} colour={INK.green} />
      <Led cx={384} cy={50} r={3} on={on && signal} colour={INK.green} />
      <Rocker x={402} y={30} s={1.4} on={on} />
    </Group>
  );
});

/* ── Speakon NL4 (R3-DJ-02) ───────────────────────────────────────────── */

/** An NL4MP chassis socket, face-on (true size): the D-size flange with its
 *  two screws and latch slot, the round insert and its key. */
export function Nl4Socket({ cx, cy }: { cx: number; cy: number }) {
  const fw = NL4.flangeW;
  const fh = NL4.flangeH;
  const r = NL4.insertD / 2;
  return (
    <Group>
      <RoundedRect x={cx - fw / 2} y={cy - fh / 2} width={fw} height={fh} r={2.6}>
        <LinearGradient start={vec(cx - fw / 2, cy - fh / 2)} end={vec(cx + fw / 2, cy + fh / 2)} colors={['#4a4e55', '#2a2c31', '#17181b']} />
      </RoundedRect>
      <RoundedRect x={cx - fw / 2} y={cy - fh / 2} width={fw} height={fh} r={2.6} style="stroke" strokeWidth={0.5} color="rgba(255,255,255,0.14)" />
      {[[cx - fw / 2 + 3, cy - fh / 2 + 3], [cx + fw / 2 - 3, cy + fh / 2 - 3]].map(([sx, sy]) => (
        <Circle key={String(sx)} cx={sx} cy={sy} r={1.3} color="#8b9099" />
      ))}
      <RoundedRect x={cx - 4} y={cy - fh / 2 + 0.8} width={8} height={1.6} r={0.6} color="#08090a" />
      <Circle cx={cx} cy={cy} r={r} color="#060607" />
      <Circle cx={cx} cy={cy} r={r * 0.78}>
        <RadialGradient c={vec(cx - r * 0.2, cy - r * 0.25)} r={r} colors={['#2c2e33', '#121315']} />
      </Circle>
      <Circle cx={cx} cy={cy} r={r * 0.3} color="#060607" />
      <RoundedRect x={cx - 1.8} y={cy - r + 0.6} width={3.6} height={3.4} r={0.8} color="#060607" />
    </Group>
  );
}

/** An NL4FC cable connector seated in its socket, seen from its cable end
 *  in the same slight perspective as parts.PlugFace: the locking body
 *  (⌀ 30) with its grip ribs, its grey release latch, the boot (⌀ 15) the
 *  cable leaves by. */
export function Nl4PlugFace({ cx, cy }: { cx: number; cy: number }) {
  const R = NL4.plugD / 2;
  const boot = NL4.bootD / 2;
  const depth = 4;
  const nx = cx + depth * 0.55;
  const ny = cy + depth * 0.75;
  return (
    <Group>
      <Circle cx={cx + R * 0.45} cy={cy + R * 0.6} r={R * 1.06} color="rgba(0,0,0,0.75)">
        <BlurMask blur={R * 0.35} style="normal" />
      </Circle>
      <Line p1={vec(cx, cy)} p2={vec(nx, ny)} strokeWidth={R * 2} strokeCap="round" color="#1a1b1f" />
      <Circle cx={nx} cy={ny} r={R}>
        <RadialGradient c={vec(nx - R * 0.3, ny - R * 0.35)} r={R * 1.3} colors={['#3e4147', '#1a1b1f', '#0b0b0d']} positions={[0, 0.55, 1]} />
      </Circle>
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return <Line key={i} p1={vec(nx + Math.cos(a) * R * 0.8, ny + Math.sin(a) * R * 0.8)} p2={vec(nx + Math.cos(a) * R * 0.97, ny + Math.sin(a) * R * 0.97)} color="rgba(255,255,255,0.10)" strokeWidth={0.8} />;
      })}
      <RoundedRect x={nx - 3.2} y={ny - R - 1.2} width={6.4} height={4.4} r={1.2}>
        <LinearGradient start={vec(0, ny - R - 1.2)} end={vec(0, ny - R + 3.2)} colors={['#c3c7ce', '#6e737c']} />
      </RoundedRect>
      <Circle cx={nx} cy={ny} r={boot}>
        <RadialGradient c={vec(nx - boot * 0.3, ny - boot * 0.35)} r={boot * 1.4} colors={['#34363c', '#0b0b0d']} />
      </Circle>
      <Circle cx={nx - R * 0.34} cy={ny - R * 0.38} r={R * 0.14} color="rgba(255,255,255,0.35)">
        <BlurMask blur={R * 0.1} style="normal" />
      </Circle>
    </Group>
  );
}

/** The Speakon speaker lead along pts (dense, mm): a heavy unshielded
 *  two-core cable at its true diameter, an NL4FC seated at each end, and its
 *  flag. */
export function SpeakerLead({ pts, live, labelAt }: { pts: [number, number][]; live: boolean; labelAt?: [number, number] }) {
  const path = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    p.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]);
    return p.detach();
  }, [pts]);
  const a = pts[0];
  const b = pts[pts.length - 1];
  return (
    <Group>
      <Cable pts={pts} path={path} style={{ colour: '#141518', width: NL4.cableD, pattern: 'plain' }} glow={live ? INK.blue : null} />
      <Nl4PlugFace cx={a[0]} cy={a[1]} />
      <Nl4PlugFace cx={b[0]} cy={b[1]} />
      {labelAt ? <CableFlag x={labelAt[0]} y={labelAt[1]} text="SPEAKER CABLE · NL4" live={live} edge="#5c626b" /> : null}
    </Group>
  );
}

/** The speaker lead's tag's widest line, in points at text scale k. */
export const speakerTagWidestPt = (k: number) => Math.max(...SPEAKER_TAG.lines.map((l) => textWidthPt(l, k)));

/**
 * R4-DJ-02 follow-up: the speaker lead's name — a two-line tag standing
 * LEFT of the passive top (geometry/eventGeometry.speakerTagBox), clear of
 * the top, the sub, the amp and its leads at every glass size, tied to the
 * lead by a thin line across the top's plain rear that ends in a dot ON the
 * lead. 9.5 pt × k.
 */
export function SpeakerLeadTag({ live }: { live: boolean }) {
  const { s, textScale } = useContext(SceneFontsContext);
  const b = speakerTagBox(s, textScale, speakerTagWidestPt(textScale));
  const y = SPEAKER_TAG.tieY;
  const lx = speakerLeadXAt(y);
  const hair = 1 / Math.max(1e-6, s);
  const tint = live ? '#8fbcff' : INK.print;
  return (
    <Group>
      <Line p1={vec(b.x + b.w, y)} p2={vec(lx, y)} color="rgba(255,255,255,0.55)" strokeWidth={hair} />
      <Circle cx={lx} cy={y} r={2.2 * hair} color="#e8ebef" />
      <RoundedRect x={b.x} y={b.y} width={b.w} height={b.h} r={b.mm * 0.4} color="rgba(10,11,13,0.92)" />
      <RoundedRect x={b.x} y={b.y} width={b.w} height={b.h} r={b.mm * 0.4} style="stroke" strokeWidth={b.mm * 0.12} color="#5c626b" />
      {SPEAKER_TAG.lines.map((t, i) => (
        <SceneText key={t} x={b.x + b.w / 2} y={b.y + b.mm * (1.12 + i * 1.15)} size={b.mm} text={t} color={tint} face="label" align="center" />
      ))}
    </Group>
  );
}

/* ── the power amp, from behind (R3-DJ-02) ────────────────────────────── */

export const PowerAmpRear = memo(function PowerAmpRear({ x, y }: { x: number; y: number }) {
  const R = AMP_REAR;
  const fanR = R.fan.d / 2;
  return (
    <Group transform={[{ translateX: x }, { translateY: y }]}>
      <RoundedRect x={4} y={7} width={AMP_W} height={AMP_H} r={4} color="rgba(0,0,0,0.65)">
        <BlurMask blur={6} style="normal" />
      </RoundedRect>
      {/* the rack ears' backs, then the chassis between them */}
      {[0, AMP_W - 22].map((ex) => (
        <Rect key={ex} x={ex} y={0} width={22} height={AMP_H} color="#1f2125" />
      ))}
      <RoundedRect x={24} y={2} width={AMP_W - 48} height={AMP_H - 4} r={3}>
        <LinearGradient start={vec(0, 2)} end={vec(0, AMP_H - 2)} colors={['#2c2f34', '#1a1b1f', '#111214']} />
      </RoundedRect>
      <RoundedRect x={24.6} y={2.6} width={AMP_W - 49.2} height={AMP_H - 5.2} r={2.6} style="stroke" strokeWidth={1} color={INK.bevel} />
      {/* the fan behind its guard */}
      <Circle cx={R.fan.x} cy={R.fan.y} r={fanR} color="#060607" />
      {[0.92, 0.66, 0.4].map((k) => (
        <Circle key={k} cx={R.fan.x} cy={R.fan.y} r={fanR * k} style="stroke" strokeWidth={1.4} color="#4a4e55" />
      ))}
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI;
        return <Line key={i} p1={vec(R.fan.x - Math.cos(a) * fanR * 0.92, R.fan.y - Math.sin(a) * fanR * 0.92)} p2={vec(R.fan.x + Math.cos(a) * fanR * 0.92, R.fan.y + Math.sin(a) * fanR * 0.92)} color="#4a4e55" strokeWidth={1.2} />;
      })}
      <IecInlet x={R.ac.x - 12} y={R.ac.y - 8} s={1} />
      <SceneText x={R.ac.x} y={R.ac.y - 16} size={LEG} text="AC IN" color={INK.print} face="label" align="center" />
      {/* the outputs: Speakon only (a speaker lead, never a line cable) */}
      <SceneText x={(R.outB.x + R.outA.x) / 2} y={14} size={LEG + 1} text="SPEAKER OUT" color={INK.amber} face="label" align="center" />
      {([['outB', 'CH B'], ['outA', 'CH A']] as const).map(([k, t]) => (
        <Group key={k}>
          <Nl4Socket cx={R[k].x} cy={R[k].y} />
          {/* beside the socket, off the lead that hangs down from its plug */}
          <SceneText x={R[k].x - NL4.flangeW / 2 - 4} y={R[k].y + 1.5} size={LEG} text={t} color={INK.print} face="label" align="right" />
        </Group>
      ))}
      {/* the inputs: balanced XLR, from the processor */}
      <SceneText x={(R.inB.x + R.inA.x) / 2} y={14} size={LEG + 1} text="INPUT (BAL)" color={INK.amber} face="label" align="center" />
      {([['inB', 'CH B'], ['inA', 'CH A']] as const).map(([k, t]) => (
        <Group key={k}>
          <XlrSocket cx={R[k].x} cy={R[k].y} d={19} male={false} />
          <SceneText x={R[k].x} y={R[k].y + NL4.flangeH / 2 + 7} size={LEG} text={t} color={INK.print} face="label" align="center" />
        </Group>
      ))}
      <SceneText x={418} y={50} size={LEG} text="MIN LOAD 4 OHMS" color={INK.print} face="label" align="center" />
    </Group>
  );
});

/* ── a passive top, from behind (R3-DJ-02) ────────────────────────────── */

export const PassiveTopRear = memo(function PassiveTopRear({ x, y }: { x: number; y: number }) {
  const W = SPEAKER_W;
  const H = SPEAKER_H;
  const taper = W * 0.035;
  const shell = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    const r = W * 0.05;
    p.moveTo(r, 0);
    p.lineTo(W - r, 0);
    p.quadTo(W, 0, W, r);
    p.lineTo(W - taper, H - r);
    p.quadTo(W - taper, H, W - taper - r, H);
    p.lineTo(taper + r, H);
    p.quadTo(taper, H, taper, H - r);
    p.lineTo(0, r);
    p.quadTo(0, 0, r, 0);
    p.close();
    return p.detach();
  }, [W, H, taper]);
  const handle = { w: W * 0.36, h: 22 };
  const c = PASSIVE_REAR.cup;
  return (
    <Group transform={[{ translateX: x }, { translateY: y }]}>
      <Path path={shell} color="rgba(0,0,0,0.7)" transform={[{ translateX: 8 }, { translateY: 14 }]}>
        <BlurMask blur={14} style="normal" />
      </Path>
      <Path path={shell}>
        <LinearGradient start={vec(0, 0)} end={vec(W, H)} colors={['#2a2c31', '#1a1b1f', '#101113']} />
      </Path>
      <Path path={shell} style="stroke" strokeWidth={2} color={INK.bevel} />
      {/* the carry handle cut into the top */}
      <RoundedRect x={W / 2 - handle.w / 2} y={H * 0.025} width={handle.w} height={handle.h} r={handle.h / 2}>
        <LinearGradient start={vec(0, H * 0.025)} end={vec(0, H * 0.025 + handle.h)} colors={['#020203', '#0d0e10', '#2a2c31']} positions={[0, 0.7, 1]} />
      </RoundedRect>
      {/* the back panel's screws */}
      {[[30, 60], [W - 30, 60], [34, H - 40], [W - 34, H - 40]].map(([sx, sy]) => (
        <Circle key={sx + "-" + sy} cx={sx} cy={sy} r={3} color="#5c626b" />
      ))}
      {/* the recessed connector cup: INPUT and LINK, and nothing else — no
          amplifier, no mains, no power LED */}
      <RoundedRect x={c.x} y={c.y} width={c.w} height={c.h} r={10}>
        <LinearGradient start={vec(0, c.y)} end={vec(0, c.y + c.h)} colors={['#040405', '#0d0e10']} />
      </RoundedRect>
      <RoundedRect x={c.x} y={c.y} width={c.w} height={c.h} r={10} style="stroke" strokeWidth={1.2} color="rgba(255,255,255,0.10)" />
      {([['input', 'INPUT'], ['link', 'LINK']] as const).map(([k, t]) => (
        <Group key={k}>
          <SceneText x={PASSIVE_REAR[k].x - NL4.flangeW / 2 - 4} y={PASSIVE_REAR[k].y + 1.5} size={LEG} text={t} color={INK.print} face="label" align="right" />
          <Nl4Socket cx={PASSIVE_REAR[k].x} cy={PASSIVE_REAR[k].y} />
        </Group>
      ))}
      {/* the rating plate */}
      <RoundedRect x={W / 2 - 64} y={c.y + c.h + 18} width={128} height={34} r={3} color="#c9c4b2" />
      <SceneText x={W / 2} y={c.y + c.h + 31} size={LEG + 1} text="PASSIVE · 8 OHMS" color="#24262b" face="label" align="center" />
      <SceneText x={W / 2} y={c.y + c.h + 44} size={LEG} text="400 W (AES)" color="#24262b" face="label" align="center" />
    </Group>
  );
});

/* ── the crossover plot (screen overlay) ──────────────────────────────── */

export { xoverResp };

/**
 * Second visual review 2026-10-18 (#17): each curve is named at its end
 * (TOPS, SUB, SUM), the y axis is marked at 0, -6, -12, -18 dB with its
 * floor, the curves LEAVE through the floor (a 24 dB/oct slope keeps
 * falling; they are clipped by the plot, never clamped into a flat line),
 * the x axis is marked at 20, 50, 100, 200, 500 Hz and 2 kHz, and the -6 dB
 * point where an LR4 sub and tops meet is marked with a dot.
 */
export function XoverPlot({ b, xover, subs, k = 1 }: { b: { x: number; y: number; w: number; h: number }; xover: boolean; subs: boolean; k?: number }) {
  const f0 = 20;
  const f1 = 2000;
  const lo = -24;
  const hi = 9;
  const fx = (f: number) => b.x + (Math.log(f / f0) / Math.log(f1 / f0)) * b.w;
  // unclamped: a curve below the floor runs on out of the (clipped) plot
  const dy = (d: number) => b.y + ((hi - Math.max(lo - 60, Math.min(hi, d))) / (hi - lo)) * b.h;
  const paths = useMemo(() => {
    const t = Skia.PathBuilder.Make();
    const s = Skia.PathBuilder.Make();
    const u = Skia.PathBuilder.Make();
    for (let i = 0; i <= 120; i++) {
      const f = f0 * Math.pow(f1 / f0, i / 120);
      const r = xoverResp(f, xover, subs);
      const x = fx(f);
      if (i === 0) {
        t.moveTo(x, dy(r.tops));
        s.moveTo(x, dy(r.sub));
        u.moveTo(x, dy(r.sum));
      } else {
        t.lineTo(x, dy(r.tops));
        s.lineTo(x, dy(r.sub));
        u.lineTo(x, dy(r.sum));
      }
    }
    return { t: t.detach(), s: s.detach(), u: u.detach() };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [b.x, b.y, b.w, b.h, xover, subs]);
  const fs = 9 * k;
  const rTop = xoverResp(f1 * 0.92, xover, subs);
  // where each curve's name sits: TOPS and SUM at the right end, SUB where
  // it is still inside the plot on the left
  const subLabelF = 34;
  const subAt = xoverResp(subLabelF, xover, subs).sub;
  const axisX = b.x - 3;
  return (
    <Group>
      <RoundedRect x={b.x - 30 * k} y={b.y - 4} width={b.w + 34 * k} height={b.h + 8 + fs + 6} r={6} color="rgba(8,8,10,0.82)" />
      {[50, 100, 200, 500, 1000].map((f) => (
        <Line key={f} p1={vec(fx(f), b.y)} p2={vec(fx(f), b.y + b.h)} color={f === XOVER_HZ ? 'rgba(255,198,77,0.45)' : 'rgba(255,255,255,0.08)'} strokeWidth={1} />
      ))}
      {[6, 0, -6, -12, -18].map((d) => (
        <Group key={d}>
          <Line p1={vec(b.x, dy(d))} p2={vec(b.x + b.w, dy(d))} color={d === 0 ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.07)'} strokeWidth={1}>
            {d === 0 ? <DashPathEffect intervals={[4, 3]} /> : null}
          </Line>
          <SceneText x={axisX} y={dy(d) + fs * 0.36} size={fs} text={d > 0 ? `+${d}` : d === 0 ? '0 dB' : `−${-d}`} color={INK.printDim} face="label" align="right" />
        </Group>
      ))}
      {/* the plot's floor: below it the slopes simply run on */}
      <Line p1={vec(b.x, b.y + b.h)} p2={vec(b.x + b.w, b.y + b.h)} color="rgba(255,255,255,0.18)" strokeWidth={1} />
      <SceneText x={axisX} y={b.y + b.h + fs * 0.36} size={fs} text={`−${-lo}`} color={INK.printDim} face="label" align="right" />
      <Group clip={Skia.XYWHRect(b.x, b.y - 2, b.w, b.h + 2)}>
        {subs ? <Path path={paths.s} style="stroke" strokeWidth={2 * k} color="#c9a2ff" /> : null}
        <Path path={paths.t} style="stroke" strokeWidth={2 * k} color={INK.blue} />
        <Path path={paths.u} style="stroke" strokeWidth={2.6 * k} color={INK.white} />
      </Group>
      {xover && subs ? (
        <Group>
          <Circle cx={fx(XOVER_HZ)} cy={dy(-6)} r={3.4 * k} color="#050506" />
          <Circle cx={fx(XOVER_HZ)} cy={dy(-6)} r={2.4 * k} color={INK.amber} />
          <SceneText x={fx(XOVER_HZ) + 5 * k} y={dy(-6) + fs + 2 * k} size={fs} text="−6 dB EACH" color={INK.amber} face="label" />
        </Group>
      ) : null}
      {/* the curves' names, at their ends */}
      <SceneText x={b.x + b.w - 2} y={dy(rTop.sum) - 4 * k} size={fs} text="SUM" color={INK.white} face="label" align="right" />
      <SceneText x={b.x + b.w - 2} y={Math.min(b.y + b.h - 3, dy(rTop.tops) + fs + 3 * k)} size={fs} text="TOPS" color={INK.blue} face="label" align="right" />
      {subs ? <SceneText x={fx(subLabelF)} y={Math.min(b.y + b.h - 3, dy(subAt) + fs + 3 * k)} size={fs} text="SUB" color="#c9a2ff" face="label" /> : null}
      {[20, 50, 100, 200, 500].map((f) => (
        <SceneText key={f} x={fx(f)} y={b.y + b.h + fs + 3} size={fs} text={f === 20 ? '20' : `${f}`} color={f === XOVER_HZ ? INK.amber : INK.printDim} face="label" align={f === 20 ? 'left' : 'center'} />
      ))}
      <SceneText x={b.x + b.w} y={b.y + b.h + fs + 3} size={fs} text="2k Hz" color={INK.printDim} face="label" align="right" />
    </Group>
  );
}
