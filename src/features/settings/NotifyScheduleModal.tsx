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
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Modal } from '../../components/DimModal';
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

/**
 * FULL-WIDTH stepper row (owner 2026-08-30: "numbers are colliding, hard to
 * click with a finger").
 *
 * The old layout put Hour / Min / AM-PM in three flex:1 columns. On a 393 px
 * phone the card's inner width is 305 px, so each column got ~94 px — while a
 * stepper needs 16 (padding) + 2 (border) + 60 (two 30 px buttons) + 16 (gaps)
 * + 44 (value minWidth) = 138 px. Every stepper overflowed its column by ~44 px,
 * which is what made the glyphs and the number overlap. The 30 px buttons were
 * also under the 44 px minimum touch target.
 *
 * One control per row removes the constraint entirely: the buttons are now
 * 48 px squares at opposite ends with the value floating between them, so
 * there is nothing to collide with at any screen width.
 */
function Stepper({ onDown, onUp, value, label }: { onDown: () => void; onUp: () => void; value: string; label: string }) {
  return (
    <View style={styles.stepperCol}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <View style={styles.stepper}>
        <Pressable
          style={styles.stepBtn}
          onPress={onDown}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={`${label} down`}
        >
          <Text style={styles.stepGlyph}>−</Text>
        </Pressable>
        <Text style={styles.stepValue} numberOfLines={1}>{value}</Text>
        <Pressable
          style={styles.stepBtn}
          onPress={onUp}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={`${label} up`}
        >
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
  // Steppers CARRY (QA night 2026-09-01): 11 PM + 1 hr used to wrap to 12 PM
  // (noon — eleven hours earlier), and 1:00 − 1 min stayed inside the same
  // hour. Hours flip the period on each pass through 12; minutes borrow from
  // the hour, which flips the period in turn.
  const setHour = (next: number) => {
    const wrapped = ((next + 11) % 12) + 1; // 1..12
    const crossed = next === 13 || next === 0; // stepped past 12 in either direction
    onSetTime(to24(wrapped, crossed ? (period === 'AM' ? 'PM' : 'AM') : period, minute));
  };
  const setMinute = (next: number) => {
    const m = ((next % 60) + 60) % 60;
    if (next >= 60) setHour(h12 + 1);
    else if (next < 0) setHour(h12 - 1);
    else onSetTime(to24(h12, period, m));
    if (next >= 60 || next < 0) {
      // setHour already re-emitted the hour/period; re-emit with the new minute.
      const wrapped = ((h12 + (next >= 60 ? 1 : -1) + 11) % 12) + 1;
      const stepped = h12 + (next >= 60 ? 1 : -1);
      const crossed = stepped === 13 || stepped === 0;
      onSetTime(to24(wrapped, crossed ? (period === 'AM' ? 'PM' : 'AM') : period, m));
    }
  };
  const togglePeriod = () => onSetTime(to24(h12, period === 'AM' ? 'PM' : 'AM', minute));

  const showTime = mode === 'time' || mode === 'dayTime';
  const activeDay = NOTIFY_DAYS.includes(day as (typeof NOTIFY_DAYS)[number]) ? day : 'Monday';

  return (
    <Modal accessibilityViewIsModal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
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
                <Stepper label="HOUR" value={String(h12)} onDown={() => setHour(h12 - 1)} onUp={() => setHour(h12 + 1)} />
                <Stepper
                  label="MINUTE"
                  value={String(minute).padStart(2, '0')}
                  onDown={() => setMinute(minute - 5)}
                  onUp={() => setMinute(minute + 5)}
                />
                <View style={styles.stepperCol}>
                  <Text style={styles.stepperLabel}>AM / PM</Text>
                  <View style={styles.periodRow}>
                    {(['AM', 'PM'] as const).map((p) => {
                      const on = p === period;
                      return (
                        <Pressable
                          key={p}
                          style={[styles.periodBtn, on && styles.periodBtnOn]}
                          onPress={() => {
                            if (!on) togglePeriod();
                          }}
                          accessibilityRole="button"
                          accessibilityState={{ selected: on }}
                          accessibilityLabel={`Set ${p}`}
                        >
                          <Text style={[styles.periodText, on && styles.periodTextOn]}>{p}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </View>
            </>
          ) : null}

          {mode === 'idleDays' ? (
            <>
              <Text style={styles.groupLabel}>REMIND AFTER</Text>
              {/* Full width like the time steppers — an alignSelf:'center'
                  wrapper here shrank the row to its content, which pinned the
                  value against both buttons. */}
              <Stepper
                label="DAYS OF NO USE"
                value={`${days} ${days === 1 ? 'day' : 'days'}`}
                onDown={() => onSetDays(Math.max(1, days - 1))}
                onUp={() => onSetDays(Math.min(30, days + 1))}
              />
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

  // All 7 days on ONE row, evenly divided (they used to wrap and orphan "Sun"
  // onto a second row). flex:1 per chip means they share whatever width the
  // card has, so this holds on any phone.
  dayWrap: { flexDirection: 'row', gap: 4 },
  dayChip: {
    flex: 1,
    minHeight: 42,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    borderRadius: 7,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#141414',
  },
  dayChipOn: { borderColor: 'rgba(255,198,77,.7)', backgroundColor: 'rgba(255,198,77,.12)' },
  dayChipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.6, color: colors.textSub },
  dayChipTextOn: { color: colors.amber },

  // One control per ROW (was three side-by-side columns that overflowed).
  timeRow: { gap: 10 },
  stepperCol: { alignSelf: 'stretch', gap: 5 },
  stepperLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1.2, color: colors.textSub },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 5,
    backgroundColor: '#131313',
  },
  // 48 px squares — comfortably over the 44 px minimum touch target, and far
  // enough apart that a fingertip cannot land on both.
  stepBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 6, backgroundColor: '#1e1e1e' },
  stepGlyph: { fontFamily: fonts.oswaldSemiBold, fontSize: 22, color: colors.textSecondary },
  // flex:1 between the two buttons — the number owns all the space left over,
  // so it can never be squeezed into a glyph.
  stepValue: { flex: 1, fontFamily: fonts.mono, fontSize: 20, color: colors.textPrimary, textAlign: 'center' },
  periodRow: { flexDirection: 'row', gap: 10 },
  periodBtn: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#141414',
  },
  periodBtnOn: { borderColor: 'rgba(255,198,77,.7)', backgroundColor: 'rgba(255,198,77,.12)' },
  periodText: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 1, color: colors.textSub },
  periodTextOn: { color: colors.amber },

  doneBtn: { marginTop: 8, borderRadius: 9, backgroundColor: 'rgba(255,198,77,.14)', borderWidth: 1.5, borderColor: 'rgba(255,198,77,.7)', paddingVertical: 11, alignItems: 'center' },
  doneText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 0.8, color: colors.amber },
});
