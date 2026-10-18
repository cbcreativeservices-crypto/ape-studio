/**
 * MixerTop — the two-channel club-style DJ mixer, seen from above, AUTHORED
 * IN MILLIMETRES (270 × 390, geometry/boothGeometry.MIXER). Generic: no brand
 * likeness, no trade dress.
 *
 * Every control on the drawing is the booth's real state: knob pointers sit
 * at the trim / EQ / filter / level values, fader caps at their positions,
 * the slide switches at the input, assign and curve settings, the CUE keys
 * lit when cued. The LED columns (CH1 · MASTER L · MASTER R · CH2) and the
 * BUS OVER light run from the meter taps under the one clock.
 *
 * The printed legends and the meter scale (−24 · −12 · −6 · −2 · CLIP) are
 * drawn at real silk-screen size (4 mm type, capitals ≈ 3 mm) and appear
 * once the zoom renders them at 9 pt or more (sceneText).
 */
import { memo } from 'react';
import { BlurMask, Circle, Group, Line, LinearGradient, Oval, Path, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import type { Booth, ChannelId } from '../model/djModel';
import { filterQ } from '../model/djModel';
import { MIXER, MIXER_D, MIXER_W, STRIP_X } from '../geometry/boothGeometry';
import { INK } from './ink';
import { Fader, Halo, Key, Knob, LED_DB, Led, LedColumn, SlideSwitch } from './parts';
import { useBusOver, useTapDb } from './motion';
import { SceneText } from './sceneText';

export type MixerPart =
  | 'trim1' | 'trim2' | 'eq1' | 'eq2' | 'filter1' | 'filter2' | 'cue1' | 'cue2' | 'fader1' | 'fader2'
  | 'input1' | 'input2' | 'assign1' | 'assign2' | 'xfader' | 'curve' | 'meters' | 'master' | 'booth'
  | 'cueMix' | 'phones' | 'split' | 'resonance' | 'busOver' | 'phonesJack'
  | 'hi1' | 'mid1' | 'lo1' | 'hi2' | 'mid2' | 'lo2';

/** Every control's box (local mm) — the labels' obstacles. */
export const MIXER_PARTS: readonly MixerPart[] = [
  'trim1', 'trim2', 'hi1', 'mid1', 'lo1', 'hi2', 'mid2', 'lo2', 'filter1', 'filter2', 'cue1', 'cue2', 'fader1', 'fader2',
  'input1', 'input2', 'assign1', 'assign2', 'xfader', 'curve', 'meters', 'master', 'booth', 'cueMix', 'phones', 'split', 'resonance', 'busOver', 'phonesJack',
];

/** Where each highlightable part is (local mm) and how big its halo is. */
export function mixerPartBox(p: MixerPart): { x: number; y: number; w: number; h: number } {
  const s = (ch: ChannelId) => STRIP_X[ch];
  const k = (cx: number, cy: number, d: number) => ({ x: cx - d * 0.85, y: cy - d * 0.85, w: d * 1.7, h: d * 1.7 });
  switch (p) {
    case 'trim1': return k(s(1), MIXER.trim.y, MIXER.trim.d);
    case 'trim2': return k(s(2), MIXER.trim.y, MIXER.trim.d);
    case 'hi1': return k(s(1), MIXER.hi.y, MIXER.hi.d);
    case 'mid1': return k(s(1), MIXER.mid.y, MIXER.mid.d);
    case 'lo1': return k(s(1), MIXER.lo.y, MIXER.lo.d);
    case 'hi2': return k(s(2), MIXER.hi.y, MIXER.hi.d);
    case 'mid2': return k(s(2), MIXER.mid.y, MIXER.mid.d);
    case 'lo2': return k(s(2), MIXER.lo.y, MIXER.lo.d);
    case 'eq1': return { x: s(1) - 18, y: MIXER.hi.y - 18, w: 36, h: MIXER.lo.y - MIXER.hi.y + 36 };
    case 'eq2': return { x: s(2) - 18, y: MIXER.hi.y - 18, w: 36, h: MIXER.lo.y - MIXER.hi.y + 36 };
    case 'filter1': return k(s(1), MIXER.filter.y, MIXER.filter.d);
    case 'filter2': return k(s(2), MIXER.filter.y, MIXER.filter.d);
    case 'cue1': return { x: s(1) - 17, y: MIXER.cue.y - 9, w: 34, h: 18 };
    case 'cue2': return { x: s(2) - 17, y: MIXER.cue.y - 9, w: 34, h: 18 };
    case 'fader1': return { x: s(1) - 14, y: MIXER.fader.top - 16, w: 28, h: MIXER.fader.len + 32 };
    case 'fader2': return { x: s(2) - 14, y: MIXER.fader.top - 16, w: 28, h: MIXER.fader.len + 32 };
    case 'input1': return { x: s(1) - 20, y: MIXER.inputSel.y - 8, w: 40, h: 16 };
    case 'input2': return { x: s(2) - 20, y: MIXER.inputSel.y - 8, w: 40, h: 16 };
    case 'assign1': return { x: s(1) - 20, y: MIXER.assign.y - 8, w: 40, h: 16 };
    case 'assign2': return { x: s(2) - 20, y: MIXER.assign.y - 8, w: 40, h: 16 };
    case 'xfader': return { x: MIXER.xfader.left - 16, y: MIXER.xfader.y - 12, w: MIXER.xfader.len + 32, h: 24 };
    case 'curve': return { x: MIXER.curve.x - 4, y: MIXER.curve.y - 4, w: MIXER.curve.w + 8, h: MIXER.curve.h + 8 };
    case 'meters': return { x: 100, y: MIXER.meters.y - 8, w: 70, h: MIXER.meters.h + 16 };
    case 'master': return k(MIXER.master.x, MIXER.master.y, MIXER.master.d);
    case 'booth': return k(MIXER.booth.x, MIXER.booth.y, MIXER.booth.d);
    case 'cueMix': return k(MIXER.cueMix.x, MIXER.cueMix.y, MIXER.cueMix.d);
    case 'phones': return k(MIXER.phones.x, MIXER.phones.y, MIXER.phones.d);
    case 'split': return { x: MIXER.split.x - 4, y: MIXER.split.y - 4, w: MIXER.split.w + 8, h: MIXER.split.h + 8 };
    case 'resonance': return k(MIXER.resonance.x, MIXER.resonance.y, MIXER.resonance.d);
    case 'busOver': return { x: MIXER.busOver.x - 8, y: MIXER.busOver.y - 8, w: 16, h: 16 };
    case 'phonesJack': return { x: MIXER.front.phones635 - 10, y: MIXER.front.y - 6, w: 36, h: 12 };
  }
}

const ROUND_PARTS = new Set<MixerPart>(['trim1', 'trim2', 'filter1', 'filter2', 'master', 'booth', 'cueMix', 'phones', 'resonance', 'busOver', 'hi1', 'mid1', 'lo1', 'hi2', 'mid2', 'lo2']);

const inputPos = (i: Booth['ch'][1]['input']) => (i === 'PHONO' ? 0 : i === 'LINE' ? 1 : 2);
const assignPos = (a: Booth['ch'][1]['xf']) => (a === 'A' ? 0 : a === 'THRU' ? 1 : 2);
const curvePos = (c: Booth['mixer']['xfCurve']) => (c === 'BLEND' ? 0 : c === 'DIP' ? 1 : 2);
/** Filter knob position (−1 … 1) → knob value (0 … 1). */
const filterKnob = (f: number) => (f + 1) / 2;


/** Printed panel legends — drawn only where they render at 9 pt or more
 *  (sceneText), so a small view shows clean metal and a close view reads
 *  like the real panel. CH1's legends sit left of its knobs, CH2's right.
 *  4 mm type (capitals ≈ 3 mm): real silk-screen size. */
const LEG = 4;
const LEG_S = 3.4;
function StripLegends({ ch }: { ch: ChannelId }) {
  const x = STRIP_X[ch];
  const lx = ch === 1 ? x - 16 : x + 16;
  const al = ch === 1 ? 'right' : 'left';
  const row = (y: number, t: string) => <SceneText key={t} x={lx} y={y + LEG * 0.36} size={LEG} text={t} color={INK.print} face="label" align={al} />;
  return (
    <Group>
      {row(MIXER.trim.y, 'TRIM')}
      {row(MIXER.hi.y, 'HI')}
      {row(MIXER.mid.y, 'MID')}
      {row(MIXER.lo.y, 'LOW')}
      {row(MIXER.filter.y, 'FILTER')}
      {row(MIXER.cue.y, 'CUE')}
      <SceneText x={x} y={MIXER.inputSel.y - 7} size={LEG_S} text="PHONO · LINE · USB" color={INK.printDim} face="label" align="center" />
      <SceneText x={x} y={MIXER.assign.y + 10} size={LEG_S} text="A · THRU · B" color={INK.printDim} face="label" align="center" />
      <SceneText x={x} y={MIXER.trim.y - 14} size={LEG_S} text={'CH ' + ch} color={INK.amber} face="label" align="center" />
      <SceneText x={ch === 1 ? x - 22 : x + 22} y={MIXER.fader.top + 34} size={12} text={String(ch)} color={INK.print} face="label" align="center" />
    </Group>
  );
}

function Strip({ ch, booth }: { ch: ChannelId; booth: Booth }) {
  const c = booth.ch[ch];
  const x = STRIP_X[ch];
  return (
    <Group>
      <StripLegends ch={ch} />
      <SlideSwitch x={x - MIXER.inputSel.w / 2} y={MIXER.inputSel.y - MIXER.inputSel.h / 2} w={MIXER.inputSel.w} h={MIXER.inputSel.h} pos={inputPos(c.input)} />
      <Knob cx={x} cy={MIXER.trim.y} d={MIXER.trim.d} value={c.trim} />
      <Knob cx={x} cy={MIXER.hi.y} d={MIXER.hi.d} value={c.eq.hi} centre />
      <Knob cx={x} cy={MIXER.mid.y} d={MIXER.mid.d} value={c.eq.mid} centre />
      <Knob cx={x} cy={MIXER.lo.y} d={MIXER.lo.d} value={c.eq.lo} centre />
      <Knob cx={x} cy={MIXER.filter.y} d={MIXER.filter.d} value={filterKnob(c.filter)} centre arc={Math.abs(c.filter) > 0.03 ? INK.blue : undefined} capTone="black" />
      <Key x={x - MIXER.cue.w / 2} y={MIXER.cue.y - MIXER.cue.h / 2} w={MIXER.cue.w} h={MIXER.cue.h} lit={c.cue} colour={INK.amber} />
      <Fader x={x} y={MIXER.fader.top} len={MIXER.fader.len} value={c.fader} capW={MIXER.fader.capW} capL={MIXER.fader.capL} />
      <SlideSwitch x={x - MIXER.assign.w / 2} y={MIXER.assign.y - MIXER.assign.h / 2} w={MIXER.assign.w} h={MIXER.assign.h} pos={assignPos(c.xf)} />
    </Group>
  );
}

function Meters() {
  const ch1 = useTapDb('ch1');
  const ch1h = useTapDb('ch1', 'hold');
  const mL = useTapDb('masterL');
  const mLh = useTapDb('masterL', 'hold');
  const mR = useTapDb('masterR');
  const mRh = useTapDb('masterR', 'hold');
  const ch2 = useTapDb('ch2');
  const ch2h = useTapDb('ch2', 'hold');
  const over = useBusOver();
  const { y, h, w, xs } = MIXER.meters;
  return (
    <Group>
      <LedColumn x={xs[0]} y={y} w={w} h={h} level={ch1} hold={ch1h} />
      <LedColumn x={xs[1]} y={y} w={w} h={h} level={mL} hold={mLh} />
      <LedColumn x={xs[2]} y={y} w={w} h={h} level={mR} hold={mRh} />
      <LedColumn x={xs[3]} y={y} w={w} h={h} level={ch2} hold={ch2h} />
      <Led cx={MIXER.busOver.x} cy={MIXER.busOver.y} r={2.4} on={over} colour={INK.peak} />
      {(['1', 'L', 'R', '2'] as const).map((t, i) => (
        <SceneText key={t} x={xs[i] + w / 2} y={y + h + 7} size={LEG} text={t} color={INK.print} face="label" align="center" />
      ))}
      <SceneText x={MIXER.busOver.x + 5} y={MIXER.busOver.y + 1.3} size={LEG_S} text="BUS OVER" color={INK.printDim} face="label" />
      <MeterScale />
    </Group>
  );
}

/** The meters' printed scale, between MASTER L and R: −24 · −12 · −6 · −2
 *  and the CLIP cap on the top (0 dBFS) segment, each beside its segment. */
export const METER_SCALE = [
  { db: -24, t: '−24' },
  { db: -12, t: '−12' },
  { db: -6, t: '−6' },
  { db: -2, t: '−2' },
  { db: 0, t: 'CLIP' },
] as const;
/** The centre (local mm) of the LED segment that lights at `db`. */
export function meterSegY(db: number): number {
  const { y, h } = MIXER.meters;
  const i = (LED_DB as readonly number[]).indexOf(db);
  const pitch = h / LED_DB.length;
  return y + h - (i + 0.5) * pitch;
}
function MeterScale() {
  const { xs, w } = MIXER.meters;
  const cx = (xs[1] + w + xs[2]) / 2;
  return (
    <Group>
      {METER_SCALE.map((m) => (
        <Group key={m.t}>
          <Line p1={vec(xs[1] + w + 0.8, meterSegY(m.db))} p2={vec(xs[1] + w + 2.2, meterSegY(m.db))} color={INK.printDim} strokeWidth={0.4} />
          <Line p1={vec(xs[2] - 2.2, meterSegY(m.db))} p2={vec(xs[2] - 0.8, meterSegY(m.db))} color={INK.printDim} strokeWidth={0.4} />
          <SceneText x={cx} y={meterSegY(m.db) + 1.1} size={m.db === 0 ? 2.9 : 3.1} text={m.t} color={m.db === 0 ? INK.peak : INK.print} face="label" align="center" />
        </Group>
      ))}
    </Group>
  );
}

/** The front edge: a chamfered lip carrying the two headphone jacks (6.35 mm
 *  and 3.5 mm), each a knurled nut round its socket, seen from above. */
function FrontLip() {
  const W = MIXER_W;
  const D = MIXER_D;
  const knurl = (cx: number, r: number) => {
    const p = Skia.PathBuilder.Make();
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      p.moveTo(cx + Math.cos(a) * r * 0.78, D - 6 + Math.sin(a) * r * 0.42);
      p.lineTo(cx + Math.cos(a) * r, D - 6 + Math.sin(a) * r * 0.54);
    }
    return p.detach();
  };
  const jack = (cx: number, r: number, key: string) => (
    <Group key={key}>
      <Oval x={cx - r - 0.6} y={D - 6 - r * 0.54 + 0.9} width={(r + 0.6) * 2} height={r * 1.08} color="rgba(0,0,0,0.7)">
        <BlurMask blur={0.8} style="normal" />
      </Oval>
      <Oval x={cx - r} y={D - 6 - r * 0.54} width={r * 2} height={r * 1.08}>
        <LinearGradient start={vec(cx - r, D - 9)} end={vec(cx + r, D - 3)} colors={[INK.metalHi, INK.metalMid, INK.metalLo]} />
      </Oval>
      <Path path={knurl(cx, r)} style="stroke" strokeWidth={0.35} color="rgba(0,0,0,0.5)" />
      <Oval x={cx - r * 0.56} y={D - 6 - r * 0.3} width={r * 1.12} height={r * 0.6} color="#1a1b1f" />
      <Oval x={cx - r * 0.36} y={D - 6 - r * 0.2} width={r * 0.72} height={r * 0.4} color="#020203" />
    </Group>
  );
  return (
    <Group>
      {/* the chamfer: lit along its top edge, falling into shadow */}
      <RoundedRect x={8} y={D - 11} width={W - 16} height={9} r={2.5}>
        <LinearGradient start={vec(0, D - 11)} end={vec(0, D - 2)} colors={['#3a3d44', '#1a1b1f', '#0b0c0e']} positions={[0, 0.35, 1]} />
      </RoundedRect>
      <Line p1={vec(10, D - 10.6)} p2={vec(W - 10, D - 10.6)} color="rgba(255,255,255,0.16)" strokeWidth={0.5} />
      {jack(MIXER.front.phones635, 5.6, 'j635')}
      {jack(MIXER.front.phones35, 3.6, 'j35')}
      <SceneText x={(MIXER.front.phones635 + MIXER.front.phones35) / 2} y={D - 13} size={LEG_S} text="PHONES" color={INK.printDim} face="label" align="center" />
    </Group>
  );
}

function Screw({ cx, cy }: { cx: number; cy: number }) {
  return (
    <Group>
      <Circle cx={cx} cy={cy} r={2.6}>
        <LinearGradient start={vec(cx - 2, cy - 2)} end={vec(cx + 2, cy + 2)} colors={[INK.metalHi, INK.metalLo]} />
      </Circle>
      <Line p1={vec(cx - 1.6, cy + 1.2)} p2={vec(cx + 1.6, cy - 1.2)} color="#1a1b1f" strokeWidth={0.7} />
    </Group>
  );
}

/** Printed panel lines between the strips and the centre column, and the
 *  crossfader's printed bay (built on first use: never at module scope, where
 *  web Skia may not be loaded yet). */
let sectionLinesPath: ReturnType<typeof Skia.Path.Make> | null = null;
function sectionLines() {
  if (sectionLinesPath) return sectionLinesPath;
  const p = Skia.PathBuilder.Make();
  for (const x of [95, 175]) {
    p.moveTo(x, 14);
    p.lineTo(x, 330);
  }
  p.addRRect(Skia.RRectXY(Skia.XYWHRect(96, 352, 78, 32), 4, 4));
  sectionLinesPath = p.detach();
  return sectionLinesPath;
}

export const MixerTop = memo(function MixerTop({ x, y, booth, highlight = [] }: { x: number; y: number; booth: Booth; highlight?: readonly MixerPart[] }) {
  const W = MIXER_W;
  const D = MIXER_D;
  const m = booth.mixer;
  const res = (filterQ(m.resonance) - 0.7) / 2.8;
  return (
    <Group transform={[{ translateX: x }, { translateY: y }]}>
      {/* contact shadow on the table */}
      <RoundedRect x={4} y={8} width={W} height={D} r={12} color="rgba(0,0,0,0.75)">
        <BlurMask blur={10} style="normal" />
      </RoundedRect>
      {/* body */}
      <RoundedRect x={0} y={0} width={W} height={D} r={11}>
        <LinearGradient start={vec(0, 0)} end={vec(W, D)} colors={[INK.bodyHi, INK.bodyMid, INK.bodyLo]} positions={[0, 0.45, 1]} />
      </RoundedRect>
      <RoundedRect x={0.6} y={0.6} width={W - 1.2} height={D - 1.2} r={10.5} style="stroke" strokeWidth={1.2} color={INK.bevel} />
      {/* the face plate (brushed, recessed a hair) */}
      <RoundedRect x={7} y={7} width={W - 14} height={D - 18} r={6}>
        <LinearGradient start={vec(0, 0)} end={vec(W, 0)} colors={['#1d1f24', '#18191d', '#1c1e22', '#16171b']} positions={[0, 0.35, 0.7, 1]} />
      </RoundedRect>
      <RoundedRect x={7} y={7} width={W - 14} height={D - 18} r={6} style="stroke" strokeWidth={0.8} color="rgba(0,0,0,0.6)" />
      <Path path={sectionLines()} style="stroke" strokeWidth={0.6} color={INK.printDim} opacity={0.6} />
      {/* the front lip and its headphone jacks */}
      <FrontLip />
      {[[14, 14], [W - 14, 14], [14, D - 20], [W - 14, D - 20]].map(([sx, sy]) => (
        <Screw key={`${sx}-${sy}`} cx={sx} cy={sy} />
      ))}
      <Strip ch={1} booth={booth} />
      <Strip ch={2} booth={booth} />
      <Meters />
      <SceneText x={MIXER.master.x} y={MIXER.master.y - 15} size={LEG} text="MASTER" color={INK.print} face="label" align="center" />
      <SceneText x={MIXER.booth.x} y={MIXER.booth.y - 15} size={LEG} text="BOOTH" color={INK.print} face="label" align="center" />
      <SceneText x={MIXER.cueMix.x} y={MIXER.cueMix.y - 13} size={LEG_S} text="CUE ↔ MST" color={INK.print} face="label" align="center" />
      <SceneText x={MIXER.phones.x} y={MIXER.phones.y - 13} size={LEG_S} text="PHONES" color={INK.print} face="label" align="center" />
      <SceneText x={MIXER.split.x + MIXER.split.w / 2} y={MIXER.split.y + MIXER.split.h + 5} size={LEG_S} text="SPLIT CUE" color={INK.printDim} face="label" align="center" />
      <SceneText x={MIXER.resonance.x} y={MIXER.resonance.y + 13} size={LEG_S} text="RESONANCE" color={INK.printDim} face="label" align="center" />
      <SceneText x={MIXER.curve.x + MIXER.curve.w / 2} y={MIXER.curve.y - 3} size={LEG_S} text="X-FADER CURVE" color={INK.printDim} face="label" align="center" />
      <SceneText x={MIXER.curve.x - 3} y={MIXER.curve.y + MIXER.curve.h / 2 + 1.2} size={LEG_S} text="BLEND" color={INK.printDim} face="label" align="right" />
      <SceneText x={MIXER.curve.x + MIXER.curve.w + 3} y={MIXER.curve.y + MIXER.curve.h / 2 + 1.2} size={LEG_S} text="CUT" color={INK.printDim} face="label" />
      <SceneText x={MIXER.xfader.left - 8} y={MIXER.xfader.y + 1.4} size={LEG} text="A" color={INK.print} face="label" align="right" />
      <SceneText x={MIXER.xfader.left + MIXER.xfader.len + 8} y={MIXER.xfader.y + 1.4} size={LEG} text="B" color={INK.print} face="label" />
      <Knob cx={MIXER.master.x} cy={MIXER.master.y} d={MIXER.master.d} value={m.master} />
      <Knob cx={MIXER.booth.x} cy={MIXER.booth.y} d={MIXER.booth.d} value={m.booth} />
      <Knob cx={MIXER.cueMix.x} cy={MIXER.cueMix.y} d={MIXER.cueMix.d} value={m.cueMix} centre />
      <Knob cx={MIXER.phones.x} cy={MIXER.phones.y} d={MIXER.phones.d} value={m.phones} />
      <SlideSwitch x={MIXER.split.x} y={MIXER.split.y} w={MIXER.split.w} h={MIXER.split.h} pos={m.splitCue ? 1 : 0} positions={2} />
      <Knob cx={MIXER.resonance.x} cy={MIXER.resonance.y} d={MIXER.resonance.d} value={res} capTone="black" />
      <SlideSwitch x={MIXER.curve.x} y={MIXER.curve.y} w={MIXER.curve.w} h={MIXER.curve.h} pos={curvePos(m.xfCurve)} />
      <Fader x={MIXER.xfader.y} y={MIXER.xfader.left} len={MIXER.xfader.len} value={m.xf} horizontal capW={MIXER.xfader.capW} capL={MIXER.xfader.capL} ticks={9} />
      {highlight.map((p) => (
        <Halo key={p} b={mixerPartBox(p)} round={ROUND_PARTS.has(p)} />
      ))}
    </Group>
  );
});
