/**
 * PaceTimerModal — the pace-timer settings popup.
 *
 * On/off toggle · a plain-English explanation of "pace" · a radio list of pace
 * presets (incl. Stopwatch) · and, for Stopwatch, the encouraging backend
 * records readout (best / average / sessions). Dark modal styling mirrors
 * PrePaywallPrompt (backdrop + rounded card).
 *
 * Settings are device-local (paceStore); only the Stopwatch records are backend
 * (paceRecords). Everything here is a practice aid — nothing blocks study.
 */
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { colors, fonts } from '../../theme/tokens';
import { getPaceRecords, type PaceRecord } from './paceRecords';
import {
  fmtClock,
  PACE_PRESETS,
  usePaceSettings,
  type PaceMethodKey,
} from './paceStore';

const ACCENT = colors.blue; // Study-tab accent

/** Positive, encouraging one-liner from a stopwatch record. */
function encouragingRecord(rec: PaceRecord | undefined): string {
  if (!rec || !rec.sessions) return 'No timed runs yet — finish one to set your first record!';
  const parts: string[] = [];
  if (rec.last_seconds != null && rec.best_seconds != null && rec.last_seconds <= rec.best_seconds) {
    parts.push(`New best ${fmtClock(rec.best_seconds)}! 🎉`);
  } else if (rec.best_seconds != null) {
    parts.push(`Personal best ${fmtClock(rec.best_seconds)}`);
  }
  if (rec.avg_seconds != null) parts.push(`Avg ${fmtClock(rec.avg_seconds)} — keep it up!`);
  return parts.join(' · ') || 'Nice work — keep practicing!';
}

export function PaceTimerModal({
  visible,
  onClose,
  method,
}: {
  visible: boolean;
  onClose: () => void;
  method: PaceMethodKey;
}) {
  const { settings, setEnabled, setPreset } = usePaceSettings(method);
  const [record, setRecord] = useState<PaceRecord | undefined>(undefined);

  // Pull fresh records whenever the modal opens (cheap; encouraging copy only).
  useEffect(() => {
    if (!visible) return;
    let alive = true;
    void getPaceRecords().then((all) => {
      if (alive) setRecord(all[method]);
    });
    return () => {
      alive = false;
    };
  }, [visible, method]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss pace timer settings"
        />
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>PACE TIMER</Text>
            <Switch
              value={settings.enabled}
              onValueChange={setEnabled}
              trackColor={{ true: 'rgba(47,155,255,.6)', false: '#333' }}
              thumbColor={settings.enabled ? ACCENT : '#bbb'}
            />
          </View>

          <Text style={styles.explain}>
            A practice aid — never a limit. Pick a pace and a thin bar tracks whether you're ahead,
            on pace, or behind as you study. Pace is a multiple of quiz speed (20s per question).
            Stopwatch just counts up and saves your best time.
          </Text>

          <ScrollView style={styles.list} contentContainerStyle={{ gap: 6 }}>
            {PACE_PRESETS.map(({ key, label, hint }) => {
              const active = settings.preset === key;
              return (
                <Pressable
                  key={key}
                  style={[styles.option, active && styles.optionActive]}
                  onPress={() => setPreset(key)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`${label}, ${hint}`}
                >
                  <View style={[styles.radio, active && styles.radioActive]}>
                    {active ? <View style={styles.radioDot} /> : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{label}</Text>
                    <Text style={styles.optionHint}>{hint}</Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          {settings.preset === 'stopwatch' ? (
            <View style={styles.records}>
              <Text style={styles.recordsHead}>YOUR TIMES</Text>
              <Text style={styles.recordsBody}>{encouragingRecord(record)}</Text>
              {record?.sessions ? (
                <Text style={styles.recordsMeta}>
                  {record.sessions} timed {record.sessions === 1 ? 'run' : 'runs'} logged
                </Text>
              ) : null}
            </View>
          ) : null}

          <Pressable
            style={styles.doneBtn}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Done"
          >
            <Text style={styles.doneText}>DONE</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(8,8,10,0.72)', alignItems: 'center', justifyContent: 'center', padding: 26 },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#17181a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(47,155,255,.35)',
    padding: 18,
    gap: 12,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 1.4, color: colors.textPrimary },
  explain: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 20, color: colors.textSub },
  list: { maxHeight: 264, alignSelf: 'stretch' },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 9,
    paddingHorizontal: 11,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#2a2a2c',
    backgroundColor: '#141416',
  },
  optionActive: { borderColor: 'rgba(47,155,255,.7)', backgroundColor: 'rgba(47,155,255,.10)' },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#555',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: ACCENT },
  radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: ACCENT },
  optionLabel: { fontFamily: fonts.oswaldMedium, fontSize: 14, color: colors.textSecondary },
  optionLabelActive: { color: colors.textPrimary },
  optionHint: { fontFamily: fonts.barlowCondensedRegular, fontSize: 12, color: colors.textMuted, marginTop: 1 },
  records: {
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(91,176,255,.3)',
    backgroundColor: 'rgba(47,155,255,.07)',
    padding: 12,
    gap: 3,
  },
  recordsHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.4, color: colors.cyanBright },
  recordsBody: { fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 20, color: colors.textSecondary },
  recordsMeta: { fontFamily: fonts.mono, fontSize: 11, color: colors.textSubAlt },
  doneBtn: {
    marginTop: 2,
    borderRadius: 9,
    backgroundColor: 'rgba(47,155,255,.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(47,155,255,.7)',
    paddingVertical: 11,
    alignItems: 'center',
  },
  doneText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 0.8, color: ACCENT },
});
