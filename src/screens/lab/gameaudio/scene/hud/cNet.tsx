/**
 * cNet — the NET strip (pages 18, 19, 22): an action is a MESSAGE. It takes
 * time to arrive, and it can arrive twice.
 *
 *   YOUR MACHINE              NETWORK              THE OTHER MACHINE
 *   [A1 ▶][A1 ✕] ◂───(A2)──────◆──────(A2)───▸ [A1 ▶][A1 ✕]
 *   A1 ✕ IGNORED · DUPLICATE   0.25 s        A1 ✕ IGNORED · DUPLICATE
 *
 *   a packet     one delivery of an action, labeled with its id. It leaves
 *                the NETWORK at the model's `sent` and reaches a machine at
 *                the model's `due`: its place on the wire is the scene
 *                clock between those two times (cModel `cPacketAt`). An
 *                alert for one player travels one way only
 *   landed       the packet parks at the machine with what became of it:
 *                ▶ PLAYED · ✕ IGNORED (a duplicate, ID CHECK on) · ▶▶ the
 *                same id PLAYED AGAIN, a DOUBLE (ID CHECK off)
 *   the line     under each machine: the newest result there, in words
 *
 * The model plays YOUR machine only. The right-hand end applies the same
 * rule from the other player's side (pages/data/gaNet says the same on the
 * page's card). While the model has no record of actions on their way the
 * strip is drawn empty, and says so. Read-only. Its one clock is cKit's
 * `useSceneClock`, which asks the house motion gate itself: with motion
 * reduced a packet is drawn where it was at the last change of state (at
 * the NETWORK when sent, parked when landed).
 */
import { memo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { fitValue } from '../../../../../theme/legibility';
import { fonts } from '../../../../../theme/tokens';
import type { GaState } from '../../model/gaModel';
import type { GaHudProps } from './gaHudTypes';
import { C_FACE, StripFace, cType, useSceneClock, type CType } from './cKit';
import { cNetBoard, cNetKeep, cNetRemember, cNetSpoken, type CNetEnd, type CPacket } from './cModel';

const END_MARK: Record<CNetEnd, string> = { pending: '', plays: '▶', ignored: '✕', nothing: '' };
const END_COLOR: Record<CNetEnd, string> = { pending: C_FACE.sub, plays: C_FACE.ok, ignored: C_FACE.steal, nothing: C_FACE.mute };

/** What one end reads under its name. */
function endLine(p: CPacket | undefined, side: 'here' | 'there'): { text: string; color: string } {
  if (!p) return { text: 'NOTHING SENT YET', color: C_FACE.mute };
  const e = side === 'here' ? p.here : p.there;
  if (e === 'pending') return { text: `${p.id} · ${p.what} · ON ITS WAY`, color: C_FACE.sub };
  if (e === 'nothing') return { text: `${p.id} ○ NOT FOR ${side === 'here' ? 'YOU' : 'THEM'} · SILENT`, color: C_FACE.mute };
  if (e === 'ignored') return { text: `${p.id} ✕ IGNORED · DUPLICATE`, color: C_FACE.steal };
  if (side === 'here' ? p.double : p.doubleThere) return { text: `${p.id} ▶▶ PLAYED AGAIN · DOUBLE`, color: C_FACE.refuse };
  return { text: `${p.id} ▶ PLAYED`, color: C_FACE.ok };
}

type Pill = { w: number; h: number };
/** A parked packet is wider than a flying one: its id, and up to two marks. */
const parkExtra = (type: CType): number => (type.full ? 20 : 16);

/** A packet on the wire: its place is the scene clock between sent and due. */
const Flying = memo(function Flying({ p, clock, from, to, y, pill, type }: { p: CPacket; clock: SharedValue<number>; from: number; to: number; y: number; pill: Pill; type: CType }) {
  const sent = p.sent;
  const span = Math.max(1e-6, p.due - p.sent);
  const move = useAnimatedStyle(() => {
    const k = Math.max(0, Math.min(1, (clock.value - sent) / span));
    return { transform: [{ translateX: from + (to - from) * k - pill.w / 2 }] };
  });
  return (
    <Animated.View style={[styles.pill, styles.pillFlying, { top: y - pill.h / 2, width: pill.w, height: pill.h }, move]}>
      <Text style={[styles.pillText, { fontSize: type.value, lineHeight: type.line }]} allowFontScaling={false} {...fitValue(type.value)}>
        {p.id}
      </Text>
    </Animated.View>
  );
});

/** A packet that has landed, parked at its machine with its result. */
const Parked = memo(function Parked({ p, end, pill, type, double }: { p: CPacket; end: CNetEnd; pill: Pill; type: CType; double: boolean }) {
  const color = double ? C_FACE.refuse : END_COLOR[end];
  return (
    <View style={[styles.pill, { width: pill.w + parkExtra(type), height: pill.h, borderColor: color }]}>
      <Text style={[styles.pillText, { fontSize: type.value, lineHeight: type.line }]} allowFontScaling={false} {...fitValue(type.value)}>
        {p.id}
        <Text style={{ color }}> {double ? `${END_MARK[end]}${END_MARK[end]}` : END_MARK[end]}</Text>
      </Text>
    </View>
  );
});

/** What the strip remembers while it is on screen: which delivery played
 *  each id first (a double can come after the model has let the first go). */
function useFirstPlays(s: GaState): ReadonlyMap<string, number> {
  const mem = useRef<ReadonlyMap<string, number>>(new Map());
  mem.current = cNetRemember(mem.current, s);
  return mem.current;
}

export function NetStrip({ w, h, state }: GaHudProps) {
  const type = cType(h);
  const first = useFirstPlays(state);
  const board = cNetBoard(state, first);
  const flying = board.packets.filter((p) => !p.landed);
  const runUntil = flying.length ? Math.max(...flying.map((p) => p.due)) : null;
  const clock = useSceneClock(runUntil, state.t);

  const padX = type.full ? 10 : 4;
  const rowH = type.line;
  const wireY = h / 2;
  const pill: Pill = { w: type.full ? 30 : 23, h: type.full ? 18 : 14 };
  const parkedW = pill.w + parkExtra(type);
  const parkGap = 2;
  const dockW = 2 * parkedW + parkGap + 4;
  const xC = w / 2;
  const xL = padX + dockW + pill.w / 2 + 2;
  const xR = w - xL;
  // what landed stays on screen after the model has let it go
  const kept = useRef<readonly CPacket[]>([]);
  kept.current = cNetKeep(kept.current, board);
  const landed = kept.current;
  const hereParked = landed.filter((p) => p.toYou).slice(-2);
  const thereParked = landed.filter((p) => p.toOther).slice(-2);
  const newest = flying.length ? flying[flying.length - 1] : landed[landed.length - 1];
  const left = endLine(newest, 'here');
  const right = endLine(newest, 'there');
  const text = { fontSize: type.value, lineHeight: rowH };
  const sideW = (w - 2 * padX) / 2 - (type.full ? 44 : 30);

  return (
    <View style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={cNetSpoken(state, kept.current, first)}>
      <StripFace w={w} h={h} />
      {/* the three names */}
      <View style={[styles.rowAbs, { top: type.full ? 5 : 2, left: padX, right: padX, height: rowH }]}>
        <Text style={[styles.station, { width: sideW, fontSize: type.label, lineHeight: rowH, color: C_FACE.you }]} allowFontScaling={false} {...fitValue(type.label)}>
          YOUR MACHINE
        </Text>
        <Text style={[styles.station, styles.center, { fontSize: type.label, lineHeight: rowH, color: C_FACE.sub }]} allowFontScaling={false} {...fitValue(type.label)}>
          NETWORK
        </Text>
        <Text style={[styles.station, styles.right, { width: sideW, fontSize: type.label, lineHeight: rowH, color: C_FACE.other }]} allowFontScaling={false} {...fitValue(type.label)}>
          THE OTHER MACHINE
        </Text>
      </View>

      {/* the wire, the network's node, an arrowhead at each machine */}
      <View style={[styles.wire, { left: xL, width: xR - xL, top: wireY - 0.5 }]} />
      <View style={[styles.node, { left: xC - 4, top: wireY - 4 }]} />
      <View style={[styles.headL, { left: xL - 5, top: wireY - 4 }]} />
      <View style={[styles.headR, { left: xR - 1, top: wireY - 4 }]} />

      {/* landed packets, parked at their machine (the newest next to the wire) */}
      <View style={[styles.dock, { left: padX, width: dockW, top: wireY - pill.h / 2, height: pill.h, justifyContent: 'flex-end', gap: parkGap }]}>
        {hereParked.map((p) => (
          <Parked key={p.key} p={p} end={p.here} pill={pill} type={type} double={p.double} />
        ))}
      </View>
      <View style={[styles.dock, { left: w - padX - dockW, width: dockW, top: wireY - pill.h / 2, height: pill.h, justifyContent: 'flex-start', gap: parkGap }]}>
        {[...thereParked].reverse().map((p) => (
          <Parked key={p.key} p={p} end={p.there} pill={pill} type={type} double={p.doubleThere} />
        ))}
      </View>

      {/* packets on their way */}
      {flying.map((p) => (
        <View key={p.key} pointerEvents="none" style={StyleSheet.absoluteFill}>
          {p.toYou ? <Flying p={p} clock={clock} from={xC} to={xL} y={wireY} pill={pill} type={type} /> : null}
          {p.toOther ? <Flying p={p} clock={clock} from={xC} to={xR} y={wireY} pill={pill} type={type} /> : null}
        </View>
      ))}

      {/* what became of the newest action at each machine; the delay between */}
      <View style={[styles.rowAbs, { bottom: type.full ? 5 : 2, left: padX, right: padX, height: rowH }]}>
        <Text style={[styles.result, text, { width: sideW, color: left.color }]} allowFontScaling={false} {...fitValue(type.value)}>
          {board.known ? left.text : 'NO MESSAGE RECORD YET'}
        </Text>
        <Text style={[styles.result, styles.center, text, { color: C_FACE.sub }]} allowFontScaling={false} {...fitValue(type.value)}>
          {newest ? `${Math.max(0, newest.due - newest.sent).toFixed(2)} s` : ''}
        </Text>
        <Text style={[styles.result, styles.right, text, { width: sideW, color: right.color }]} allowFontScaling={false} {...fitValue(type.value)}>
          {board.known ? right.text : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rowAbs: { position: 'absolute', flexDirection: 'row', alignItems: 'center' },
  station: { fontFamily: fonts.oswaldMedium, letterSpacing: 0.7 },
  center: { flex: 1, textAlign: 'center' },
  right: { textAlign: 'right' },
  result: { fontFamily: fonts.mono },
  wire: { position: 'absolute', height: 1, backgroundColor: '#5a5d68' },
  node: { position: 'absolute', width: 8, height: 8, borderRadius: 1.5, backgroundColor: '#c9cbd3', transform: [{ rotate: '45deg' }] },
  headL: { position: 'absolute', width: 0, height: 0, borderTopWidth: 4, borderBottomWidth: 4, borderRightWidth: 6, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderRightColor: C_FACE.you },
  headR: { position: 'absolute', width: 0, height: 0, borderTopWidth: 4, borderBottomWidth: 4, borderLeftWidth: 6, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: C_FACE.other },
  dock: { position: 'absolute', flexDirection: 'row', alignItems: 'center' },
  pill: { borderRadius: 3, borderWidth: 1, borderColor: '#5a5d68', backgroundColor: '#1b1d24', alignItems: 'center', justifyContent: 'center' },
  pillFlying: { position: 'absolute', left: 0, borderColor: C_FACE.amber, backgroundColor: '#2a2208' },
  pillText: { color: C_FACE.ink, fontFamily: fonts.mono },
});
