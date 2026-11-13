/**
 * cMix — the MIX strip (pages 16, 19, 22): one meter per bus.
 *
 *   NAME  ▕▔▔▔▔▔▔▔▔▔▔▏▎        VALUE
 *
 *   the bar      the bus's COMPUTED level now, on the house loudness ramp
 *                (quiet blue … loud red), over a scale of −42 … +6 dB with a
 *                hairline every 12 dB and a strong one at 0 dB
 *   the tick     where the bus FADER sits (white)
 *   the amber    the DUCK: the gain the bus has lost while a line speaks,
 *   band         drawn from the fader tick down to where the bus is held.
 *                It opens over the model's attack (0.12 s) and closes over
 *                its release (0.45 s), and the bar falls and rises with it
 *   the word     MUTED · SILENT (another bus is soloed) · SOLO · DUCK −10 ·
 *                or the level in dB
 *   the mark     ▸ and amber on the bus the learner chose with the BUS key
 *                (`arg` = that bus's id)
 *
 * Six buses in two columns of three, in the model's order, so each bar is
 * long enough to SEE ten decibels. Read-only. Drawn from cModel `cBusMeters`.
 */
import { memo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useDecorativeMotion } from '../../../../../features/settings/decorativeMotion';
import { levelColorForDb } from '../../../../../features/tools/levelColor';
import { fitValue } from '../../../../../theme/legibility';
import { fonts } from '../../../../../theme/tokens';
import type { GaHudProps } from './gaHudTypes';
import { C_FACE, LevelBar, StripFace, cBarX, cPxPerDb, cType, useRamped, useSceneSeconds, type CType } from './cKit';
import { C_COLOR_MAX_DB, C_COLOR_MIN_DB, cBusMeters, cDbWord, cDuckRampS, cMeterFrac, cMetersSettleAt, cMixSpoken, type CBusMeter } from './cModel';

/** A level that is not the duck moving: a meter's own quick rise and fall. */
const RISE_S = 0.05;
const FALL_S = 0.14;

type RowBox = { w: number; h: number; markW: number; nameW: number; valueW: number; barW: number; barH: number; gap: number };

function valueOf(m: CBusMeter): { text: string; color: string } {
  if (m.silenced === 'mute') return { text: 'MUTED', color: C_FACE.steal };
  if (m.silenced === 'solo') return { text: 'SILENT', color: C_FACE.mute };
  // the last half decibel of a release reads as the level, never "DUCK 0"
  if (m.duckDb <= -0.5) return { text: `DUCK ${cDbWord(m.duckDb, false)}`, color: C_FACE.amber };
  if (m.solo) return { text: 'SOLO', color: C_FACE.amber };
  if (m.db == null) return { text: '—', color: C_FACE.mute };
  return { text: cDbWord(m.db), color: levelColorForDb(m.db, C_COLOR_MIN_DB, C_COLOR_MAX_DB) };
}

const BusRow = memo(function BusRow({ m, box, type, selected, moving, following }: { m: CBusMeter; box: RowBox; type: CType; selected: boolean; moving: boolean; following: boolean }) {
  // what this row showed last: the duck's ramp time is the model's own, any
  // other change is the meter's quick rise or fall
  const frac = cMeterFrac(m.db);
  const was = useRef({ duck: m.duckDb, frac, seconds: 0 });
  if (was.current.duck !== m.duckDb || was.current.frac !== frac) {
    const duckMoved = was.current.duck !== m.duckDb;
    was.current = { duck: m.duckDb, frac, seconds: duckMoved ? cDuckRampS(was.current.duck, m.duckDb) : frac >= was.current.frac ? RISE_S : FALL_S };
  }
  // while the model's own ramp is being followed frame by frame (the duck's
  // attack and release), and on the render that ends it, the bar IS the
  // model's value: no smoothing of ours on top. A change whose ramp was over
  // before it could be drawn (a busy frame) still moves, over the model's time.
  const followed = useRef(false);
  const seconds = moving && !following && !followed.current ? was.current.seconds : 0;
  followed.current = following;

  const level = useRamped(frac, seconds);
  // the duck's attack and release are the MODEL's ramp, read along the scene
  // clock (cModel cMetersSettleAt): the band is drawn where the model is
  const duck = useRamped(-m.duckDb, seconds);
  const perDb = cPxPerDb(box.barW);
  const faderX = cBarX(m.faderDb, box.barW);
  const band = useAnimatedStyle(() => {
    const px = Math.min(faderX, duck.value * perDb);
    return { left: faderX - px, width: px, opacity: px > 0.4 ? 1 : 0 };
  });
  const value = valueOf(m);
  const silent = m.silenced != null;
  return (
    <View style={[styles.row, { width: box.w, height: box.h }, selected && styles.rowSel]}>
      <Text style={[styles.mark, { width: box.markW, fontSize: type.value, lineHeight: type.line, color: selected ? C_FACE.amber : 'transparent' }]} allowFontScaling={false}>
        ▸
      </Text>
      <Text
        style={[styles.name, { width: box.nameW, fontSize: type.label, lineHeight: type.line, color: selected ? C_FACE.amber : silent ? C_FACE.mute : C_FACE.ink }, m.silenced === 'mute' && styles.struck]}
        allowFontScaling={false}
        {...fitValue(type.label)}
      >
        {m.label}
      </Text>
      <View style={{ width: box.barW, height: box.barH + 4, marginHorizontal: box.gap, justifyContent: 'center' }}>
        <LevelBar len={box.barW} thick={box.barH} level={level} dim={silent} />
        <Animated.View style={[styles.duck, { top: 2, height: box.barH }, band]} />
        <View style={[styles.fader, { left: Math.max(0, Math.min(box.barW - 2, faderX - 1)), height: box.barH + 4 }, silent && styles.faderDim]} />
      </View>
      <Text style={[styles.value, { width: box.valueW, fontSize: type.value, lineHeight: type.line, color: value.color }]} allowFontScaling={false} {...fitValue(type.value)}>
        {value.text}
      </Text>
    </View>
  );
});

export function MixStrip({ w, h, state, arg }: GaHudProps) {
  const moving = useDecorativeMotion();
  const type = cType(h);
  // a layer that starts late (the latch rattle, a burst's impacts) and the
  // beds' crossfade change the levels between actions: follow the scene clock
  // until they have settled
  // a ramp, a late layer or a crossfade: follow the scene clock every frame
  // until it has settled (the strip re-renders; it is a few dozen views)
  const settleAt = cMetersSettleAt(state);
  const now = useSceneSeconds(settleAt, state.t, 60);
  const following = settleAt != null && now < settleAt;
  const meters = cBusMeters(state, now);
  const padX = type.full ? 10 : 4;
  const padY = type.full ? 6 : 3;
  const gapX = type.full ? 22 : 8;
  const rows = 3;
  const cellW = Math.floor((w - 2 * padX - gapX) / 2);
  const cellH = Math.floor((h - 2 * padY) / rows);
  const markW = type.full ? 11 : 8;
  const nameW = type.full ? 66 : 47;
  const valueW = type.full ? 62 : 45;
  const inner = type.full ? 8 : 4;
  const box: RowBox = { w: cellW, h: cellH, markW, nameW, valueW, barW: Math.max(20, cellW - markW - nameW - valueW - 2 * inner), barH: type.full ? 10 : 7, gap: inner };
  const cols = [meters.slice(0, rows), meters.slice(rows, rows * 2)];
  return (
    <View style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={cMixSpoken(state, arg, now)}>
      <StripFace w={w} h={h} />
      <View style={[styles.cols, { paddingHorizontal: padX, paddingVertical: padY, gap: gapX }]}>
        {cols.map((col, k) => (
          <View key={k} style={{ width: cellW }}>
            {col.map((m) => (
              <BusRow key={m.bus} m={m} box={box} type={type} selected={arg === m.bus} moving={moving} following={following} />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cols: { flex: 1, flexDirection: 'row' },
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: 3 },
  rowSel: { backgroundColor: 'rgba(255,198,77,0.09)' },
  mark: { fontFamily: fonts.barlowSemiBold, textAlign: 'center' },
  name: { fontFamily: fonts.oswaldMedium, letterSpacing: 0.3 },
  struck: { textDecorationLine: 'line-through' },
  value: { fontFamily: fonts.mono, textAlign: 'right' },
  duck: { position: 'absolute', backgroundColor: 'rgba(255,198,77,0.34)', borderLeftWidth: 1.5, borderLeftColor: C_FACE.amber },
  fader: { position: 'absolute', top: 0, width: 2, borderRadius: 1, backgroundColor: '#f1f2f5' },
  faderDim: { backgroundColor: '#8a8b93' },
});
