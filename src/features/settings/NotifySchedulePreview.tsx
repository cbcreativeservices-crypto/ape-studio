/**
 * DEV + WEB harness for NotifyScheduleModal (`localhost:8090/#notifyschedulepreview`).
 *
 * The modal lives behind login inside Settings, so it could not be seen in the
 * browser — which is how a layout overflow in the time steppers shipped
 * unnoticed (owner 2026-08-30: "numbers are colliding, hard to click with a
 * finger"). This renders all three modes at a phone width so the spacing can be
 * checked without a device round-trip. Inert on device and in release builds.
 */
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { NotifyScheduleModal } from './NotifyScheduleModal';
import type { NotifyFreqMode } from './store';
import { colors, fonts } from '../../theme/tokens';

const MODES: { mode: NotifyFreqMode; title: string }[] = [
  { mode: 'dayTime', title: 'When each week' },
  { mode: 'time', title: 'When each day' },
  { mode: 'idleDays', title: 'Remind me after this many days of no use' },
];

/** Phone widths worth checking — the narrowest is where things collide. */
const WIDTHS = [360, 393, 412];

/**
 * Mode + width come from the HASH (`#notifyschedulepreview/time/412`), not from
 * on-screen chips: the modal's backdrop covers the whole viewport, so any
 * control rendered behind it is unclickable.
 */
function fromHash(): { idx: number; w: number } {
  const parts = (typeof window !== 'undefined' ? window.location.hash : '').split('/');
  const modeIdx = MODES.findIndex((m) => m.mode === parts[1]);
  const widthIdx = WIDTHS.indexOf(Number(parts[2]));
  return { idx: modeIdx >= 0 ? modeIdx : 0, w: widthIdx >= 0 ? widthIdx : 0 };
}

export function NotifySchedulePreview() {
  const [time, setTime] = useState('08:35');
  const [day, setDay] = useState('Monday');
  const [days, setDays] = useState(3);
  const { idx, w } = fromHash();

  const active = MODES[idx];

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.bar} horizontal>
        <Text style={styles.chipOn}>{`${active.mode} @ ${WIDTHS[w]}px`}</Text>
        <Text style={styles.chip}>#notifyschedulepreview/&lt;dayTime|time|idleDays&gt;/&lt;360|393|412&gt;</Text>
      </ScrollView>

      {/* Constrain to a phone width so the modal card lays out as it would on
          a device rather than stretching to the desktop viewport. */}
      <View style={[styles.phone, { width: WIDTHS[w] }]}>
        <NotifyScheduleModal
          visible
          title={active.title}
          mode={active.mode}
          time={time}
          day={day}
          days={days}
          onSetTime={setTime}
          onSetDay={setDay}
          onSetDays={setDays}
          onClose={() => {}}
        />
      </View>
      <Text style={styles.readout}>{`time=${time}  day=${day}  days=${days}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0c', alignItems: 'center', paddingTop: 12 },
  bar: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingBottom: 10 },
  chip: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    color: colors.textSub,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  chipOn: { color: colors.amber, borderColor: 'rgba(255,198,77,.7)' },
  phone: { flex: 1, alignSelf: 'center', borderWidth: 1, borderColor: '#2a2a2a' },
  readout: { fontFamily: fonts.mono, fontSize: 12, color: colors.textSub, padding: 10 },
});
