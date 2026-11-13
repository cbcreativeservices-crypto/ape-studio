/**
 * cVoices — the VOICES strip (pages 17, 19, 22): the budget as slots.
 *
 *   VOICE BUDGET 8     WAITING ┆ROOM┆ ┆WIND┆ ┆FOUNT┆        ✕ REFUSED 4
 *   ┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐
 *   │CRATE││CRATE││ALARM││ …                            one slot per voice
 *   │PRI45││STOLEN││PRI90▮│                             of the budget
 *   └▂▂──┘└▂▂──┘└▂───┘
 *
 *   a slot       holds one voice: what it is, and its priority. The MODEL
 *                seats the voices: a voice keeps its slot for as long as it
 *                sounds, and a sound that steals takes the slot it freed
 *   the line     under a name: that voice's computed level on the house
 *                ramp. A voice at zero level still holds its slot
 *   the lock     a protected voice: never taken
 *   STOLEN       the slot changed hands: its voice was taken and the new
 *                sound sits in it. The mark lasts a moment (and stays until
 *                the next change when motion is reduced)
 *   WAITING      loops whose voice was taken: tracked, silent, outside the
 *                slots. They come back when a slot is free
 *   NO OWNER     a generator's loop whose generator was removed (page 19's
 *                fault 5, GA2 B-10): its slot is rimmed orange, a two-line
 *                slot says ORPHAN instead of its priority, and the head
 *                names it after NO OWNER
 *   REFUSED      sounds that found no voice to take, counted on this visit
 *   FREE         a slot of the budget with no voice in it
 *   ┆  ┆         a slot the budget does not have (lower BUDGET: more of these)
 *
 * Up to eight slots have two lines; twelve, sixteen or no limit draw two
 * rows of eight with one line each. Read-only.
 */
import { memo, useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useDecorativeMotion } from '../../../../../features/settings/decorativeMotion';
import { levelColorForDb } from '../../../../../features/tools/levelColor';
import { fitValue } from '../../../../../theme/legibility';
import { fonts } from '../../../../../theme/tokens';
import type { GaState } from '../../model/gaModel';
import type { GaHudProps } from './gaHudTypes';
import { C_FACE, StripFace, cType, useSceneSeconds, type CType } from './cKit';
import { C_COLOR_MAX_DB, C_COLOR_MIN_DB, cCapacity, cMeterFrac, cMetersSettleAt, cSeatStep, cVoiceBoard, cVoicesSpoken, type CSeating, type CSlot } from './cModel';

const COLS = 8;

/** A small padlock, drawn (the fonts have no such sign). */
const Lock = memo(function Lock({ size, color }: { size: number; color: string }) {
  const bw = Math.max(1, size * 0.16);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
      <View style={{ width: size * 0.56, height: size * 0.5, borderTopLeftRadius: size * 0.3, borderTopRightRadius: size * 0.3, borderWidth: bw, borderBottomWidth: 0, borderColor: color, marginBottom: -bw / 2 }} />
      <View style={{ width: size * 0.86, height: size * 0.52, borderRadius: 1.5, backgroundColor: color }} />
    </View>
  );
});

type SlotBox = { w: number; h: number; compact: boolean };

const Slot = memo(function Slot({ slot, taken, kind, box, type, flash }: { slot: CSlot | null; taken: boolean; kind: 'slot' | 'absent'; box: SlotBox; type: CType; flash: ReturnType<typeof useAnimatedStyle> }) {
  if (kind === 'absent') return <View style={[styles.absent, { width: box.w, height: box.h }]} />;
  if (!slot) {
    return (
      <View style={[styles.free, { width: box.w, height: box.h }]}>
        <Text style={[styles.freeText, { fontSize: type.size, lineHeight: type.line }]} allowFontScaling={false} {...fitValue(type.size)}>
          FREE
        </Text>
      </View>
    );
  }
  const frac = cMeterFrac(slot.db);
  const lockSize = type.full ? 10 : 7;
  const name = (
    <Text style={[styles.name, { fontSize: type.label, lineHeight: type.line }]} allowFontScaling={false} {...fitValue(type.label)}>
      {type.full ? slot.name : slot.short}
    </Text>
  );
  const pri = (
    <Text style={[styles.pri, { fontSize: type.size, lineHeight: type.line }, slot.orphan && !box.compact && styles.priOrphan]} allowFontScaling={false} {...fitValue(type.size)}>
      {slot.orphan && !box.compact ? 'ORPHAN' : box.compact ? String(slot.priority) : `PRI ${slot.priority}`}
    </Text>
  );
  return (
    <View style={[styles.slot, { width: box.w, height: box.h }, box.compact && styles.slotTight, slot.protected && styles.slotProtected, slot.orphan && styles.slotOrphan, slot.state === 'requested' && styles.slotAsked]}>
      {box.compact ? (
        <View style={styles.lineRow}>
          <View style={styles.grow}>{name}</View>
          {slot.protected ? <Lock size={lockSize} color={C_FACE.amber} /> : pri}
        </View>
      ) : (
        <>
          {name}
          {pri}
          {slot.protected ? (
            <View style={styles.lockCorner}>
              <Lock size={lockSize} color={C_FACE.amber} />
            </View>
          ) : null}
        </>
      )}
      <View style={styles.levelTrack}>
        {slot.db != null ? <View style={{ width: `${Math.max(4, frac * 100)}%`, height: 2, backgroundColor: levelColorForDb(slot.db, C_COLOR_MIN_DB, C_COLOR_MAX_DB) }} /> : null}
      </View>
      {taken ? (
        <Animated.View style={[styles.takenBox, !box.compact && styles.takenLower, flash]}>
          <Text style={[styles.takenText, { fontSize: type.size, lineHeight: type.line }]} allowFontScaling={false} {...fitValue(type.size)}>
            STOLEN
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
});

/** The strip's memory, advanced once per state (safe to render twice). */
function useSeating(s: GaState): CSeating {
  const mem = useRef<{ state: GaState; seating: CSeating } | null>(null);
  if (!mem.current || mem.current.state !== s) mem.current = { state: s, seating: cSeatStep(mem.current, s) };
  return mem.current.seating;
}

export function VoicesStrip({ w, h, state }: GaHudProps) {
  const moving = useDecorativeMotion();
  const type = cType(h);
  // a slot's level line follows the model's clock while a ramp or a late layer settles
  const now = useSceneSeconds(cMetersSettleAt(state), state.t, 12);
  const board = cVoiceBoard(state, now);
  const seating = useSeating(state);
  const base = useRef<number | null>(null);
  if (base.current == null) base.current = state.facts.refused ?? 0;
  const refused = Math.max(0, (state.facts.refused ?? 0) - base.current);

  // the STOLEN mark fades after a moment; the REFUSED count lights when it grows
  const newestTake = Object.values(seating.taken).reduce((a, b) => Math.max(a, b), -1);
  const mark = useSharedValue(1);
  const hit = useSharedValue(0);
  useEffect(() => {
    cancelAnimation(mark);
    mark.value = 1;
    if (moving && newestTake >= 0) mark.value = withDelay(1000, withTiming(0, { duration: 450 }));
    return () => cancelAnimation(mark);
  }, [newestTake, moving, mark]);
  useEffect(() => {
    cancelAnimation(hit);
    if (!moving || refused === 0) {
      hit.value = 0;
      return;
    }
    hit.value = 1;
    hit.value = withDelay(500, withTiming(0, { duration: 700 }));
    return () => cancelAnimation(hit);
  }, [refused, moving, hit]);
  const flash = useAnimatedStyle(() => ({ opacity: mark.value }));
  const refusedGlow = useAnimatedStyle(() => ({ opacity: hit.value }));

  const cap = cCapacity(board.limit);
  const compact = cap > COLS;
  const padX = type.full ? 10 : 4;
  // two rows of slots need every point of a 48 pt strip: a 9 pt line and its
  // level line must both fit inside each slot's rim
  const padY = type.full ? 5 : compact ? 1 : 2;
  const gap = type.full ? 4 : 2;
  const gapY = type.full ? 4 : compact ? 1 : 2;
  const headH = type.line + (compact && !type.full ? 0 : 1);
  const slotW = Math.floor((w - 2 * padX - (COLS - 1) * gap) / COLS);
  const areaH = h - 2 * padY - headH - gapY;
  const slotH = compact ? Math.floor((areaH - gapY) / 2) : areaH;
  const box: SlotBox = { w: slotW, h: slotH, compact };
  const drawn = compact ? COLS * 2 : COLS;
  const cells = Array.from({ length: drawn }, (_, k) => k);
  const rows = compact ? [cells.slice(0, COLS), cells.slice(COLS)] : [cells];

  // the loops that wait, as many names as the line has room for; an orphan
  // (a removed generator's loop, GA2 B-10) is named first, after NO OWNER
  const room = Math.max(0, Math.floor((w - 2 * padX - (type.full ? 300 : 210)) / (type.full ? 50 : 36)));
  const orphans = board.seats.filter((x): x is CSlot => x != null && x.orphan);
  const orphanShown = orphans.slice(0, Math.max(0, room - (orphans.length ? 1 : 0)));
  const waitRoom = Math.max(0, room - (orphans.length ? orphanShown.length + 1 : 0));
  const waitShown = board.waiting.slice(0, waitRoom);
  const waitMore = board.waiting.length - waitShown.length;

  return (
    <View style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={cVoicesSpoken(state, refused)}>
      <StripFace w={w} h={h} />
      <View style={{ paddingHorizontal: padX, paddingVertical: padY, gap: gapY }}>
        <View style={[styles.head, { height: headH }]}>
          <Text style={[styles.headLabel, { fontSize: type.label, lineHeight: type.line }]} allowFontScaling={false} {...fitValue(type.label)}>
            {board.limit ? `VOICE BUDGET ${board.limit}` : 'NO VOICE LIMIT'}
            {seating.over ? ` · +${seating.over} MORE` : ''}
          </Text>
          <View style={styles.waitRow}>
            {orphans.length ? (
              <>
                <Text style={[styles.orphanWord, { fontSize: type.size, lineHeight: type.line }]} allowFontScaling={false} {...fitValue(type.size)}>
                  NO OWNER
                </Text>
                {orphanShown.map((x) => (
                  <View key={x.v} style={[styles.waitChip, styles.orphanChip]}>
                    <Text style={[styles.waitName, { fontSize: type.size, lineHeight: type.line - 1 }]} allowFontScaling={false} {...fitValue(type.size)}>
                      {x.short}
                    </Text>
                  </View>
                ))}
              </>
            ) : null}
            {board.waiting.length ? (
              <>
                <Text style={[styles.waitWord, { fontSize: type.size, lineHeight: type.line }]} allowFontScaling={false} {...fitValue(type.size)}>
                  WAITING
                </Text>
                {waitShown.map((x) => (
                  <View key={x.v} style={styles.waitChip}>
                    <Text style={[styles.waitName, { fontSize: type.size, lineHeight: type.line - 1 }]} allowFontScaling={false} {...fitValue(type.size)}>
                      {x.short}
                    </Text>
                  </View>
                ))}
                {waitMore > 0 ? (
                  <Text style={[styles.waitWord, { fontSize: type.size, lineHeight: type.line }]} allowFontScaling={false} {...fitValue(type.size)}>
                    +{waitMore}
                  </Text>
                ) : null}
              </>
            ) : null}
          </View>
          <View style={styles.refused}>
            <Animated.View style={[styles.refusedGlow, refusedGlow]} />
            <Text style={[styles.refusedText, { fontSize: type.size, lineHeight: type.line, color: refused ? C_FACE.refuse : C_FACE.mute }]} allowFontScaling={false} {...fitValue(type.size)}>
              ✕ REFUSED {refused}
            </Text>
          </View>
        </View>
        {rows.map((row, r) => (
          <View key={r} style={[styles.slots, { gap }]}>
            {row.map((k) => {
              return <Slot key={k} slot={k < cap ? (board.seats[k] ?? null) : null} taken={seating.taken[k] != null} kind={k < cap ? 'slot' : 'absent'} box={box} type={type} flash={flash} />;
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headLabel: { color: C_FACE.sub, fontFamily: fonts.oswaldMedium, letterSpacing: 0.6 },
  waitRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 3, overflow: 'hidden' },
  waitWord: { color: C_FACE.steal, fontFamily: fonts.oswaldMedium, letterSpacing: 0.4 },
  waitChip: { borderWidth: 1, borderStyle: 'dashed', borderColor: C_FACE.steal, borderRadius: 3, paddingHorizontal: 3 },
  waitName: { color: C_FACE.ink, fontFamily: fonts.oswaldMedium, letterSpacing: 0.2 },
  refused: { paddingHorizontal: 4, borderRadius: 3, overflow: 'hidden' },
  refusedGlow: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(255,90,72,0.38)' },
  refusedText: { fontFamily: fonts.mono },
  slots: { flexDirection: 'row' },
  slot: { borderRadius: 3, borderWidth: 1, borderTopColor: '#4a4d59', borderLeftColor: '#42454f', borderRightColor: '#17181d', borderBottomColor: '#101114', backgroundColor: '#20222a', paddingHorizontal: 3, justifyContent: 'center', overflow: 'hidden' },
  slotTight: { paddingHorizontal: 2 },
  slotProtected: { borderTopColor: C_FACE.amber, borderLeftColor: C_FACE.amber, borderRightColor: '#a87f22', borderBottomColor: '#a87f22' },
  slotAsked: { borderStyle: 'dashed' },
  slotOrphan: { borderTopColor: C_FACE.steal, borderLeftColor: C_FACE.steal, borderRightColor: C_FACE.steal, borderBottomColor: C_FACE.steal },
  priOrphan: { color: C_FACE.steal, fontFamily: fonts.oswaldMedium },
  orphanWord: { color: C_FACE.steal, fontFamily: fonts.oswaldMedium, letterSpacing: 0.4 },
  orphanChip: { borderStyle: 'solid' },
  free: { borderRadius: 3, borderWidth: 1, borderColor: C_FACE.wellRim, backgroundColor: C_FACE.well, alignItems: 'center', justifyContent: 'center' },
  freeText: { color: '#6f717b', fontFamily: fonts.oswaldMedium, letterSpacing: 0.8 },
  absent: { borderRadius: 3, borderWidth: 1, borderStyle: 'dashed', borderColor: '#24262d' },
  // 3 pt between a name and its priority: "HUM 2" and "40" read as one word at 1 pt (GA2 B-10)
  lineRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  grow: { flex: 1 },
  // a protected voice's padlock sits in the slot's upper right corner, clear of a five-letter name
  lockCorner: { position: 'absolute', top: 3, right: 2 },
  name: { color: C_FACE.ink, fontFamily: fonts.oswaldMedium, letterSpacing: 0.2 },
  pri: { color: C_FACE.sub, fontFamily: fonts.mono },
  levelTrack: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, backgroundColor: '#0a0b0e' },
  takenBox: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: '#3a1c05', borderWidth: 1, borderColor: C_FACE.steal, borderRadius: 2, alignItems: 'center', justifyContent: 'center' },
  // two-line slots keep the new sound's name in view: the mark covers the priority line
  takenLower: { top: '48%' },
  takenText: { color: C_FACE.steal, fontFamily: fonts.oswaldSemiBold, letterSpacing: 0.8 },
});
