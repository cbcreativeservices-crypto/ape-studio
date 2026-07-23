/**
 * NotifyScheduleModal — the popup that picks a notification's schedule (user
 * request 2026-07-23). Opened from a button on the right of each notification
 * row so the row stays on one line. Modes:
 *   - 'time'     → a specific delivery time (custom hour/minute/AM-PM steppers,
 *                  no native date picker — JS-only, works without a dev build).
 *   - 'dayTime'  → a day of week AND a time.
 *   - 'idleDays' → the "after N days of no use" stepper.
 * All edits write immediately (no Save), matching Settings elsewhere.
 */
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme/tokens';
import { NOTIFY_DAYS, formatClock, shortDay, type NotifyFreqMode } from './store';

function parse(hhmm: string): { h12: number; minute: number; period: 'AM' | 'PM' } {
  const [h, m] = (hhmm || '08:00').split(':').map((n) => parseInt(n, 10));
  const hh = Number.isFinite(h) ? h : 8;
  const mm = Number.isFinite(m) ? m : 0;
  return { h12: ((hh + 11) % 12) + 1, minute: mm, period: hh >= 12 ? 'PM' : 'AM' };
}
function to24(h12: number, period: 'AM' | 'PM', minute: number): string {
  let h = h12 % 12; // 12 → 0
  if (period === 'PM') h += 12;
  return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function Stepper({ onDown, onUp, value, label }: { onDown: () => void; onUp: () => void; value: string; label: string }) {
  return (
    <View style={styles.stepperCol}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepper}>
        <Pressable style={styles.stepBtn} onPress={onDown} accessibilityRole="button" accessibilityLabel={`${label} down`}>
          <Text style={styles.stepGlyph}>−</Text>
        </Pressable>
        <Text style={styles.stepValue}>{value}</Text>
        <Pressable style={styles.stepBtn} onPress={onUp} accessibilityRole="button" accessibilityLabel={`${label} up`}>
          <Text style={styles.stepGlyph}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function NotifyScheduleModal({
  visible,
  title,
  mode,
  time,
  day,
  days,
  onSetTime,
  onSetDay,
  onSetDays,
  onClose,
}: {
  visible: boolean;
  title: string;
  mode: NotifyFreqMode;
  time: string;
  day: string;
  days: number;
  onSetTime: (hhmm: string) => void;
  onSetDay: (day: string) => void;
  onSetDays: (n: number) => void;
  onClose: () => void;
}) {
  const { h12, minute, period } = parse(time);
  const setHour = (next: number) => onSetTime(to24(((next + 11) % 12) + 1, period, minute));
  const setMinute = (next: number) => onSetTime(to24(h12, period, ((next % 60) + 60) % 60));
  const togglePeriod = () => onSetTime(to24(h12, period === 'AM' ? 'PM' : 'AM', minute));

  const showTime = mode === 'time' || mode === 'dayTime';
  const activeDay = NOTIFY_DAYS.includes(day as (typeof NOTIFY_DAYS)[number]) ? day : 'Monday';

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>

          {mode === 'dayTime' ? (
            <>
              <Text style={styles.groupLabel}>DAY</Text>
              <View style={styles.dayWrap}>
                {NOTIFY_DAYS.map((d) => {
                  const on = d === activeDay;
                  return (
                    <Pressable
                      key={d}
                      style={[styles.dayChip, on && styles.dayChipOn]}
                      onPress={() => onSetDay(d)}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                    >
                      <Text style={[styles.dayChipText, on && styles.dayChipTextOn]}>{shortDay(d)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null}

          {showTime ? (
            <>
              <Text style={styles.groupLabel}>TIME</Text>
              <Text style={styles.clock}>{formatClock(time)}</Text>
              <View style={styles.timeRow}>
                <Stepper label="Hour" value={String(h12)} onDown={() => setHour(h12 - 1)} onUp={() => setHour(h12 + 1)} />
                <Stepper
                  label="Min"
                  value={String(minute).padStart(2, '0')}
                  onDown={() => setMinute(minute - 5)}
                  onUp={() => setMinute(minute + 5)}
                />
                <View style={styles.stepperCol}>
                  <Text style={styles.stepperLabel}>AM/PM</Text>
                  <Pressable style={styles.periodBtn} onPress={togglePeriod} accessibilityRole="button" accessibilityLabel={`Set ${period === 'AM' ? 'PM' : 'AM'}`}>
                    <Text style={styles.periodText}>{period}</Text>
                  </Pressable>
                </View>
              </View>
            </>
          ) : null}

          {mode === 'idleDays' ? (
            <>
              <Text style={styles.groupLabel}>REMIND AFTER</Text>
              <View style={{ alignSelf: 'center' }}>
                <Stepper
                  label="Days of no use"
                  value={`${days} ${days === 1 ? 'day' : 'days'}`}
                  onDown={() => onSetDays(Math.max(1, days - 1))}
                  onUp={() => onSetDays(Math.min(30, days + 1))}
                />
              </View>
            </>
          ) : null}

          <Pressable style={styles.doneBtn} onPress={onClose} accessibilityRole="button" accessibilityLabel="Done">
            <Text style={styles.doneText}>DONE</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(8,8,10,0.72)', alignItems: 'center', justifyContent: 'center', padding: 26 },
  card: { width: '100%', maxWidth: 360, backgroundColor: '#17181a', borderRadius: 14, borderWidth: 1, borderColor: '#2c2d30', padding: 18, gap: 10 },
  title: { fontFamily: fonts.oswaldMedium, fontSize: 17, color: colors.textPrimary },
  groupLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.6, color: colors.amberLabel, marginTop: 4 },
  clock: { fontFamily: fonts.oswaldBold, fontSize: 30, color: colors.amber, textAlign: 'center', letterSpacing: 0.5 },

  dayWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dayChip: { borderWidth: 1, borderColor: '#3a3a3a', borderRadius: 7, paddingVertical: 7, paddingHorizontal: 11, backgroundColor: '#141414' },
  dayChipOn: { borderColor: 'rgba(255,198,77,.7)', backgroundColor: 'rgba(255,198,77,.12)' },
  dayChipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.6, color: colors.textSub },
  dayChipTextOn: { color: colors.amber },

  timeRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  stepperCol: { flex: 1, alignItems: 'center', gap: 5 },
  stepperLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1, color: colors.textSub },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#333', borderRadius: 8, paddingVertical: 5, paddingHorizontal: 8, backgroundColor: '#131313' },
  stepBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 6, backgroundColor: '#1e1e1e' },
  stepGlyph: { fontFamily: fonts.oswaldSemiBold, fontSize: 18, color: colors.textSecondary },
  stepValue: { fontFamily: fonts.mono, fontSize: 16, color: colors.textPrimary, minWidth: 44, textAlign: 'center' },
  periodBtn: { borderWidth: 1, borderColor: 'rgba(255,198,77,.6)', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: 'rgba(255,198,77,.1)' },
  periodText: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 1, color: colors.amber },

  doneBtn: { marginTop: 8, borderRadius: 9, backgroundColor: 'rgba(255,198,77,.14)', borderWidth: 1.5, borderColor: 'rgba(255,198,77,.7)', paddingVertical: 11, alignItems: 'center' },
  doneText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 0.8, color: colors.amber },
});
