/**
 * VenueView — the lab's signature plot: a stage plan the way a production
 * drawing reads it. The deck across the top with its drum riser, masking
 * legs and offstage wings (racks and stagebox in the stage-left wing, power
 * in the stage-right wing); the audience below in seating blocks with a
 * centre aisle and a cross-aisle; front of house on the centre line
 * two-thirds back. Every loudspeaker is a plan glyph rotated to its aim,
 * its coverage drawn as the −6 dB sector lit from the cabinet and fading
 * with distance, subwoofers as a broad glow, the floor tinted by the
 * summed field on the app's amplitude ramp. Live boxes launch wavefronts.
 *
 * ⛔ STAGE LEFT IS THE PERFORMER'S LEFT — the plot's right. House left and
 * right are the audience's. The plot labels both.
 *
 * Pure react-native-svg + the lab's motion helpers. Tap targets carry
 * accessibility labels (the only accessibility prop react-native-svg
 * elements accept), so a screen reader — and the browser harness — can
 * place gear by name.
 */
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, Line, LinearGradient, Path, Pattern, Polygon, RadialGradient, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../../../theme/tokens';
import { heatColor } from '../../../../features/tools/levelColor';
import { SLOTS, slotDef } from '../../../../features/soundsystems/system';
import { fieldValue, overlapValue, patternOutline, type Beam } from '../../../../features/soundsystems/coverage';
import type { Link, Placed, SignalLevel, SlotId } from '../../../../features/soundsystems/types';
import { gearSpec } from '../../../../features/soundsystems/gear';
import { PlanGlyph } from './planArt';
import { Wavefronts } from './motion';
import { placedRotation } from '../plot';

export const PLOT_W = 360;
export const PLOT_H = 330;

/* the room's furniture, in plot units */
const DECK = { x: 70, y: 14, w: 220, h: 94 }; // the stage deck; lip at y = 108
const LIP_Y = DECK.y + DECK.h;
const AUD = { top: 140, bottom: 314, left: 22, right: 338 };
const AISLE = { left: 172, right: 188 }; // centre aisle
/** Floor-field levels per unit of the window — one <Path> per level drawn. */
const FIELD_LEVELS = 48;
const CROSS = { top: 206, bottom: 222 }; // cross-aisle (the delays stand in it)

export type PlotBeam = Beam & {
  color: string;
  /** Feed tag printed beside the loudspeaker (L, R, SUB, FILL…). */
  feed?: string;
  /** Set delay, ms (delays only). */
  delayMs?: number;
  /** A live box launches wavefronts; a silent one is drawn dark. */
  live?: boolean;
  /** How far past the throw distance the sector is drawn (default 1.8 — a
   *  main reaches the back wall; a monitor stops at the performer). */
  reach?: number;
};

export type VenueViewProps = {
  placed?: readonly Placed[];
  links?: readonly Link[];
  beams?: readonly PlotBeam[];
  /** Tint the audience floor by the summed field. */
  field?: boolean;
  /** Draw the seam where the first two directional beams overlap. */
  seam?: boolean;
  /** Empty slots to offer as targets (drawn as dotted rings). */
  targets?: readonly SlotId[];
  selectedId?: string | null;
  /** Ids a trace found live (lit) vs silent (dimmed). */
  liveIds?: ReadonlySet<string>;
  /** Draw performer marks at the stage source slots (monitor pages). */
  performers?: boolean;
  onTapSlot?: (slot: SlotId) => void;
  onTapPlaced?: (id: string) => void;
  onTapLink?: (link: Link) => void;
  /** Extra overlay, drawn last (timing rings, callouts). */
  overlay?: React.ReactNode;
  badge?: string;
  caption?: string;
  /** One line printed over the plot's top-left: what am I looking at. */
  orientation?: string;
  a11y: string;
  /** Run the wavefront animations. */
  animate?: boolean;
};

const LEVEL_COLOR: Record<SignalLevel, string> = {
  acoustic: '#8a8b93',
  mic: colors.greenBright,
  instrument: '#9ad36a',
  line: colors.amber,
  speaker: '#ff7a5c',
  digital: '#6fa8ff',
  wireless: '#7fd4ff',
};

function xy(slot: SlotId) {
  const s = slotDef(slot);
  return { x: s.x, y: s.y };
}

/** Cables follow the room. A run to or from FRONT OF HOUSE rides the snake
 *  loom along the stage-left wall; a rack-to-loudspeaker tail or a stage
 *  patch is a short curve. */
function cablePath(a: Placed, b: Placed): string {
  const pa = xy(a.slot);
  const pb = xy(b.slot);
  const fohEnd = a.slot === 'foh' ? 'a' : b.slot === 'foh' ? 'b' : null;
  if (fohEnd) {
    const stageEnd = fohEnd === 'a' ? pb : pa;
    const foh = fohEnd === 'a' ? pa : pb;
    const wallX = 354;
    const backY = 268;
    return `M ${stageEnd.x} ${stageEnd.y} L ${wallX - 8} ${stageEnd.y} Q ${wallX} ${stageEnd.y} ${wallX} ${stageEnd.y + 8} L ${wallX} ${backY - 8} Q ${wallX} ${backY} ${wallX - 8} ${backY} L ${foh.x + 26} ${backY} Q ${foh.x + 18} ${backY} ${foh.x + 14} ${backY + 6} L ${foh.x} ${foh.y}`;
  }
  const mx = (pa.x + pb.x) / 2;
  const my = (pa.y + pb.y) / 2;
  const dx = pb.x - pa.x;
  const dy = pb.y - pa.y;
  const len = Math.max(1, Math.hypot(dx, dy));
  const bow = Math.min(10, len * 0.12);
  return `M ${pa.x} ${pa.y} Q ${mx - (dy / len) * bow} ${my + (dx / len) * bow} ${pb.x} ${pb.y}`;
}

function sectorPath(cx: number, cy: number, r0: number, r1: number, aimDeg: number, halfDeg: number): string {
  const a0 = ((aimDeg - halfDeg) * Math.PI) / 180;
  const a1 = ((aimDeg + halfDeg) * Math.PI) / 180;
  const large = halfDeg * 2 > 180 ? 1 : 0;
  const p = (r: number, a: number) => `${cx + Math.sin(a) * r} ${cy + Math.cos(a) * r}`;
  if (r0 <= 0) return `M ${cx} ${cy} L ${p(r1, a0)} A ${r1} ${r1} 0 ${large} 0 ${p(r1, a1)} Z`;
  return `M ${p(r0, a0)} L ${p(r1, a0)} A ${r1} ${r1} 0 ${large} 0 ${p(r1, a1)} L ${p(r0, a1)} A ${r0} ${r0} 0 ${large} 1 ${p(r0, a0)} Z`;
}

export function VenueView(p: VenueViewProps) {
  const placed = p.placed ?? [];
  const links = p.links ?? [];
  const beams = p.beams ?? [];
  const animate = p.animate ?? true;
  const byId = useMemo(() => new Map(placed.map((x) => [x.id, x])), [placed]);
  // The field's inputs as one string. Pages rebuild their beams array on
  // every render (a fader step, a card opening), so keying on array identity
  // recomputed the ~780-cell field for nothing — on the alignment page every
  // DELAY step did it though no beam had moved. Only what moves the field
  // counts here; colour, feed tag and delay text are drawn elsewhere.
  const beamKey = beams.map((b) => (b.live === false ? '' : [b.x, b.y, b.aimDeg, b.coverDeg, b.gain ?? 1, b.throw ?? '', b.spread ?? '', b.rig ?? '', b.pattern ?? ''].join(','))).join('|');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const liveBeams = useMemo(() => beams.filter((b) => b.live !== false), [beamKey]);

  // The field over the whole room — the deck included, because a sub
  // arrangement's rear rejection (or an omni sub's stage rumble) is the
  // teaching. A cell below the window's floor is left transparent — dark
  // means "not covered".
  // The cells are drawn as ONE path per level, not one rect per cell
  // (2026-09-25): ~780 individually reconciled <Rect>s cost ~1,500 DOM
  // attribute writes on every step of the COVERAGE and AIM faders — the
  // slowest ride in the lab. Level is quantised to FIELD_LEVELS steps of the
  // window (an opacity step of ~0.013 and a colour step the eye cannot
  // separate); the seam hatch is a second path over the seam cells.
  const cells = useMemo(() => {
    if (!p.field || liveBeams.length === 0) return { fills: [] as { k: string; d: string; c: string; o: number }[], hatch: '' };
    const cols = 30;
    const top = DECK.y;
    const rows = Math.round((AUD.bottom - top) / 11.6);
    const cw = (AUD.right - AUD.left) / cols;
    const ch = (AUD.bottom - top) / rows;
    const buckets = new Map<number, string[]>();
    let hatch = '';
    const dir = liveBeams.filter((b) => b.coverDeg < 360);
    // On the deck only the subwoofers count: a top's rear at mid/high
    // frequencies is below the window, and drawing it would read as leakage.
    const subs = liveBeams.filter((b) => b.coverDeg >= 360 || (b.pattern && b.pattern !== 'horn'));
    const w = (cw + 0.7).toFixed(2);
    const hh = (ch + 0.7).toFixed(2);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = AUD.left + c * cw;
        const y = top + r * ch;
        const px = x + cw / 2;
        const py = y + ch / 2;
        const onDeck = py < LIP_Y + 4;
        if (onDeck && subs.length === 0) continue;
        const v = fieldValue(onDeck ? subs : liveBeams, px, py);
        if (v <= 0.03) continue;
        const cell = `M${x.toFixed(2)} ${y.toFixed(2)}h${w}v${hh}h-${w}z`;
        const q = Math.round(v * FIELD_LEVELS);
        const list = buckets.get(q);
        if (list) list.push(cell);
        else buckets.set(q, [cell]);
        if (!!p.seam && dir.length >= 2 && overlapValue(dir[0], dir[1], px, py) > 0.5) hatch += cell;
      }
    }
    const fills = [...buckets.entries()].map(([q, parts]) => {
      const v = q / FIELD_LEVELS;
      return { k: `f${q}`, d: parts.join(''), c: heatColor(v), o: 0.18 + v * 0.62 };
    });
    return { fills, hatch };
  }, [liveBeams, p.field, p.seam]);

  const occupied = new Set(placed.map((x) => x.slot));

  return (
    <View style={styles.wrap} accessible accessibilityRole="image" accessibilityLabel={p.a11y}>
      {p.orientation ? <Text style={styles.orientText}>{p.orientation}</Text> : null}
      <Svg width="100%" viewBox={`0 0 ${PLOT_W} ${PLOT_H}`} style={{ aspectRatio: PLOT_W / PLOT_H }}>
        <Defs>
          <LinearGradient id="vv-deck" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#1e2331" />
            <Stop offset="1" stopColor="#12151d" />
          </LinearGradient>
          <LinearGradient id="vv-floor" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#0f1116" />
            <Stop offset="1" stopColor="#0a0b0e" />
          </LinearGradient>
          <ClipPath id="vv-room">
            <Rect x={3} y={3} width={PLOT_W - 6} height={PLOT_H - 6} rx={11} />
          </ClipPath>
          <Pattern id="vv-hatch" patternUnits="userSpaceOnUse" width={4} height={4}>
            <Path d="M0 4 L4 0" stroke="#fff" strokeWidth={0.6} opacity={0.35} />
          </Pattern>
        </Defs>

        {/* the room */}
        <Rect x={0} y={0} width={PLOT_W} height={PLOT_H} rx={12} fill="url(#vv-floor)" />
        <Rect x={0.5} y={0.5} width={PLOT_W - 1} height={PLOT_H - 1} rx={12} fill="none" stroke={colors.hairline} />

        {/* wings, offstage */}
        <Rect x={8} y={DECK.y} width={58} height={DECK.h} fill="#0e1016" />
        <Rect x={294} y={DECK.y} width={58} height={DECK.h} fill="#0e1016" />
        {/* the deck and its riser */}
        <Rect x={DECK.x} y={DECK.y} width={DECK.w} height={DECK.h} fill="url(#vv-deck)" stroke="#2a3040" strokeWidth={1} />
        <Rect x={118} y={20} width={124} height={34} rx={2} fill="#222838" stroke="#2f3646" strokeWidth={0.8} />
        <SvgText x={180} y={30} fontSize={6} fill="#6a7186" fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={1.6}>RISER</SvgText>
        {/* masking legs, with the entrance gap */}
        {[66, 290].map((x) => (
          <G key={x}>
            <Rect x={x} y={DECK.y} width={4} height={44} fill="#05060a" />
            <Rect x={x} y={DECK.y + 58} width={4} height={36} fill="#05060a" />
          </G>
        ))}
        {/* lip highlight and apron face */}
        <Line x1={DECK.x} y1={LIP_Y - 1} x2={DECK.x + DECK.w} y2={LIP_Y - 1} stroke="#fff" strokeWidth={1.2} opacity={0.14} />
        <Rect x={DECK.x} y={LIP_Y} width={DECK.w} height={4} fill="#0a0b0e" />
        {/* the barrier: the sub line (and an end-fire's front box) stands in the pit before it */}
        <Line x1={AUD.left} y1={162} x2={AUD.right} y2={162} stroke="#2a2e38" strokeWidth={0.8} />
        <SvgText x={AUD.right - 4} y={159} fontSize={5} fill="#4a505c" fontFamily={fonts.oswaldMedium} textAnchor="end" letterSpacing={1}>BARRIER</SvgText>

        {/* seating blocks, aisles, the centre line and the mix riser */}
        {Array.from({ length: 12 }, (_, i) => 170 + i * 12).map((y) =>
          y > CROSS.top - 4 && y < CROSS.bottom + 4 ? null : (
            <G key={y}>
              <Line x1={AUD.left + 4} y1={y} x2={AISLE.left - 4} y2={y} stroke="#fff" strokeWidth={0.6} opacity={0.07} />
              <Line x1={AISLE.right + 4} y1={y} x2={AUD.right - 4} y2={y} stroke="#fff" strokeWidth={0.6} opacity={0.07} />
            </G>
          ),
        )}
        <Line x1={180} y1={LIP_Y + 4} x2={180} y2={PLOT_H - 8} stroke="#fff" strokeWidth={0.7} opacity={0.12} strokeDasharray="2 4" />
        <Rect x={156} y={268} width={48} height={30} rx={2} fill="none" stroke="#3a3f4a" strokeWidth={0.7} strokeDasharray="2 2" />

        {/* labels — both conventions, because the plot uses both */}
        <SvgText x={37} y={26} fontSize={7} fill={colors.textMuted} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={2}>SR</SvgText>
        <SvgText x={323} y={26} fontSize={7} fill={colors.textMuted} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={2}>SL</SvgText>
        <SvgText x={37} y={DECK.y + DECK.h - 4} fontSize={5.5} fill="#4a505c" fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={1}>WING</SvgText>
        <SvgText x={323} y={DECK.y + DECK.h - 4} fontSize={5.5} fill="#4a505c" fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={1}>WING</SvgText>
        <SvgText x={180} y={LIP_Y + 14} fontSize={6.5} fill={colors.textMuted} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={2}>LIP</SvgText>
        <SvgText x={40} y={PLOT_H - 8} fontSize={6.5} fill={colors.textMuted} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={1.6}>HOUSE L</SvgText>
        <SvgText x={320} y={PLOT_H - 8} fontSize={6.5} fill={colors.textMuted} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={1.6}>HOUSE R</SvgText>
        <SvgText x={180} y={PLOT_H - 8} fontSize={6.5} fill={colors.textMuted} fontFamily={fonts.oswaldMedium} textAnchor="middle" letterSpacing={1.6}>FOH · MIX</SvgText>

        {/* the floor field and the seam */}
        {cells.fills.map((c) => (
          <Path key={c.k} d={c.d} fill={c.c} opacity={c.o} />
        ))}
        {cells.hatch ? <Path d={cells.hatch} fill="url(#vv-hatch)" /> : null}

        {/* coverage: the −6 dB sector of each loudspeaker, lit from the cabinet */}
        <G clipPath="url(#vv-room)">
          {beams.map((b, i) => {
            const omni = b.coverDeg >= 360 || b.pattern === 'omni' || b.pattern === 'cardioid' || b.pattern === 'endfire';
            const live = b.live !== false;
            const thr = b.throw ?? 120;
            const R = omni ? thr * 1.3 : thr * (b.reach ?? 1.8);
            const d0 = b.rig === 'flown' ? 22 : 0;
            const half = b.coverDeg / 2;
            const gid = `vv-bm-${i}`;
            const tint = live ? 1 : 0.25;
            const a = (b.aimDeg * Math.PI) / 180;
            const ax = Math.sin(a);
            const ay = Math.cos(a);
            const tipX = b.x + ax * R * 0.7;
            const tipY = b.y + ay * R * 0.7;
            return (
              <G key={i}>
                <Defs>
                  <RadialGradient id={gid} gradientUnits="userSpaceOnUse" cx={b.x} cy={b.y} r={R}>
                    <Stop offset="0" stopColor={b.color} stopOpacity={0.32 * tint} />
                    <Stop offset={String(Math.max(0.05, d0 / R))} stopColor={b.color} stopOpacity={0.32 * tint} />
                    <Stop offset="0.55" stopColor={b.color} stopOpacity={0.13 * tint} />
                    <Stop offset="1" stopColor={b.color} stopOpacity="0" />
                  </RadialGradient>
                </Defs>
                {omni ? (
                  <Polygon points={patternOutline(b, R).map((q) => `${q.x},${q.y}`).join(' ')} fill={`url(#${gid})`} />
                ) : (
                  <>
                    <Path d={sectorPath(b.x, b.y, d0, R * 0.92, b.aimDeg, half * 1.3)} fill={`url(#${gid})`} opacity={0.35} />
                    <Path d={sectorPath(b.x, b.y, d0, R, b.aimDeg, half)} fill={`url(#${gid})`} />
                    <Path d={sectorPath(b.x, b.y, d0, R, b.aimDeg, half * 0.55)} fill={`url(#${gid})`} opacity={0.5} />
                    {[-half, half].map((k) => {
                      const e = ((b.aimDeg + k) * Math.PI) / 180;
                      return <Line key={k} x1={b.x + Math.sin(e) * d0} y1={b.y + Math.cos(e) * d0} x2={b.x + Math.sin(e) * R} y2={b.y + Math.cos(e) * R} stroke={b.color} strokeWidth={0.7} opacity={0.5 * tint} />;
                    })}
                    <G opacity={0.45 * tint}>
                      <Line x1={b.x + ax * d0} y1={b.y + ay * d0} x2={tipX} y2={tipY} stroke={b.color} strokeWidth={0.8} strokeDasharray="1.5 3" />
                      <Polygon points={`${tipX},${tipY} ${tipX - ax * 5 - ay * 2.5},${tipY - ay * 5 + ax * 2.5} ${tipX - ax * 5 + ay * 2.5},${tipY - ay * 5 - ax * 2.5}`} fill={b.color} />
                    </G>
                  </>
                )}
                {live ? <Wavefronts cx={b.x} cy={b.y} aimDeg={b.aimDeg} coverDeg={omni ? 360 : b.coverDeg} color={b.color} run={animate} reach={omni ? R * 0.8 : R * 0.75} period={omni ? 3600 : 2400} /> : null}
              </G>
            );
          })}
        </G>

        {/* cables */}
        {links.map((l) => {
          const a = byId.get(l.from);
          const b = byId.get(l.to);
          if (!a || !b) return null;
          const live = !p.liveIds || p.liveIds.has(b.id);
          const col = LEVEL_COLOR[l.level];
          const d = cablePath(a, b);
          return (
            <G key={`${l.from}-${l.to}`}>
              <Path d={d} stroke="#000" strokeWidth={3.6} fill="none" opacity={0.45} />
              <Path d={d} stroke={col} strokeWidth={2} fill="none" opacity={live ? 0.95 : 0.35} strokeDasharray={l.level === 'wireless' ? '3 4' : undefined} strokeLinecap="round" strokeLinejoin="round" />
              {live && l.level !== 'wireless' ? <Path d={d} stroke="#fff" strokeWidth={0.6} fill="none" opacity={0.3} /> : null}
              {p.onTapLink ? <Path d={d} stroke="transparent" strokeWidth={14} fill="none" onPress={() => p.onTapLink?.(l)} accessibilityLabel={`Cable from ${gearSpec(a.kind).name} to ${gearSpec(b.kind).name}, ${l.level} level — tap to remove`} /> : null}
            </G>
          );
        })}

        {/* target slots */}
        {(p.targets ?? []).map((s) => {
          if (occupied.has(s)) return null;
          const { x, y } = xy(s);
          const def = slotDef(s);
          return (
            <G key={s}>
              <Circle cx={x} cy={y} r={13} fill={colors.amber} opacity={0.08} />
              <Circle cx={x} cy={y} r={13} fill="none" stroke={colors.amber} strokeWidth={1} strokeDasharray="3 3" opacity={0.85} />
              <SvgText x={x} y={y + 21} fontSize={5.5} fill={colors.amberLabel} fontFamily={fonts.oswaldMedium} textAnchor="middle">{def.label.toUpperCase()}</SvgText>
              <Circle cx={x} cy={y} r={18} fill="transparent" onPress={() => p.onTapSlot?.(s)} accessibilityLabel={`Place at ${def.label}`} />
            </G>
          );
        })}

        {/* every other empty slot: a faint ring so the plot reads as a plan */}
        {SLOTS.filter((s) => !occupied.has(s.id) && !(p.targets ?? []).includes(s.id)).map((s) => (
          <Circle key={s.id} cx={s.x} cy={s.y} r={3} fill="none" stroke="#2f343f" strokeWidth={0.8} />
        ))}

        {/* performers on the stage source slots */}
        {p.performers
          ? (['stageC', 'stageL', 'stageR', 'riserC'] as SlotId[]).map((s) => {
              const q = xy(s);
              return (
                <G key={s} opacity={0.8}>
                  <Circle cx={q.x} cy={q.y - 3} r={4.5} fill="none" stroke="#9aa3ad" strokeWidth={1.2} />
                  <Path d={`M ${q.x - 7} ${q.y + 8} C ${q.x - 7} ${q.y + 1} ${q.x + 7} ${q.y + 1} ${q.x + 7} ${q.y + 8}`} fill="none" stroke="#9aa3ad" strokeWidth={1.2} />
                </G>
              );
            })
          : null}

        {/* placed gear, as plan glyphs rotated to aim */}
        {placed.map((x) => {
          const { x: px, y: py } = xy(x.slot);
          const spec = gearSpec(x.kind);
          const live = !p.liveIds || p.liveIds.has(x.id) || !spec.radiates;
          const sel = p.selectedId === x.id;
          const beam = beams.find((b) => Math.abs(b.x - px) < 0.5 && Math.abs(b.y - py) < 0.5);
          return (
            <G key={x.id}>
              <PlanGlyph kind={x.kind} id={`vv-${x.id}`} x={px} y={py} rotateDeg={placedRotation(x)} dim={!live} lit={live} rig={beam?.rig === 'flown' ? 'flown' : 'stack'} highlight={sel ? colors.cyanBright : undefined} />
              {beam?.feed ? (
                <SvgText x={px} y={py + 22} fontSize={6.5} fill={beam.color} fontFamily={fonts.oswaldSemiBold} textAnchor="middle" letterSpacing={1}>
                  {beam.feed}
                </SvgText>
              ) : null}
              {beam?.delayMs != null ? (
                <SvgText x={px} y={py + 30} fontSize={5.5} fill={colors.textMuted} fontFamily={fonts.mono} textAnchor="middle">
                  {`${beam.delayMs} ms`}
                </SvgText>
              ) : null}
              <Circle cx={px} cy={py} r={22} fill="transparent" onPress={() => p.onTapPlaced?.(x.id)} accessibilityLabel={`${spec.name} at ${slotDef(x.slot).label}${sel ? ', selected' : ''}${spec.radiates ? (live ? ', live' : ', silent') : ''}`} />
            </G>
          );
        })}

        {p.overlay}
      </Svg>
      {p.badge ? (
        <View style={styles.badge} pointerEvents="none">
          <Text style={styles.badgeText}>{p.badge}</Text>
        </View>
      ) : null}
      {p.caption ? <Text style={styles.caption}>{p.caption}</Text> : null}
    </View>
  );
}

/** Legend row for cable colours — paired with words, never colour alone. */
export function CableLegend({ levels }: { levels: readonly SignalLevel[] }) {
  const words: Record<SignalLevel, string> = {
    acoustic: 'air',
    mic: 'mic level',
    instrument: 'instrument',
    line: 'line level',
    speaker: 'SPEAKER LEVEL',
    digital: 'network',
    wireless: 'radio',
  };
  return (
    <View style={styles.legend} accessibilityRole="list">
      {levels.map((l) => (
        <View key={l} style={styles.legendItem} accessible accessibilityLabel={`${words[l]} cable`}>
          <View style={[styles.swatch, { backgroundColor: LEVEL_COLOR[l] }]} />
          <Text style={styles.legendText}>{words[l]}</Text>
        </View>
      ))}
    </View>
  );
}

/** How the floor tint reads — printed under every field plot. */
export function FieldKey() {
  const rows = [
    { c: heatColor(0.98), w: 'too hot' },
    { c: heatColor(0.63), w: 'in the window' },
    { c: heatColor(0.44), w: 'the −6 dB edge' },
    { c: heatColor(0.25), w: 'quiet' },
    { c: '#0a0b0e', w: 'not covered' },
  ];
  return (
    <View style={styles.legend} accessibilityRole="list">
      {rows.map((r) => (
        <View key={r.w} style={styles.legendItem} accessible accessibilityLabel={r.w}>
          <View style={[styles.swatchSq, { backgroundColor: r.c }]} />
          <Text style={styles.legendText}>{r.w}</Text>
        </View>
      ))}
    </View>
  );
}

export const CABLE_COLORS = LEVEL_COLOR;

const styles = StyleSheet.create({
  wrap: { width: '100%', gap: 6 },
  badge: { position: 'absolute', top: 30, right: 10, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,198,77,.45)', backgroundColor: 'rgba(12,12,14,.85)', paddingHorizontal: 7, paddingVertical: 3 },
  badgeText: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 8.5, letterSpacing: 1.2 },
  orientText: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 1.2, textTransform: 'uppercase' },
  caption: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  swatch: { width: 14, height: 4, borderRadius: 2 },
  swatchSq: { width: 10, height: 10, borderRadius: 2, borderWidth: 0.5, borderColor: '#2a2e38' },
  legendText: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 10, letterSpacing: 0.8 },
});
