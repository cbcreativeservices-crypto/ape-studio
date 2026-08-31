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
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Modal } from '../../components/DimModal';
import { colors, fonts } from '../../theme/tokens';
import { getPaceRecords, type PaceRecord } from './paceRecords';
import {
  fmtClock,
  setRunning,
  usePaceSettings,
  type PaceMethodKey,
} from './paceStore';
import { MiniFader, PresetFader } from './PresetFader';

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
  topicId,
}: {
  visible: boolean;
  onClose: () => void;
  method: PaceMethodKey;
  /** The topic under study — passed to the trial so a PASS credits the right
   *  topic. Omit for pseudo-topics with no server row (crediting is a no-op). */
  topicId?: string;
}) {
  const { settings, setEnabled, setPreset } = usePaceSettings(method);
  // The full-size fader popup (shared with the in-container fader button via the
  // same PresetFader component) — opened here by tapping the mini-fader.
  const [faderOpen, setFaderOpen] = useState(false);

  // DONE is what ADDS the timer: finishing the popup turns the pace timer on and
  // starts it running, then closes. (The old top on/off Switch was removed.)
  const handleDone = () => {
    setEnabled(true);
    setRunning(method, true);
    onClose();
  };
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
    <Modal accessibilityViewIsModal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss pace timer settings"
        />
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>OPEN PACE SETTINGS</Text>
          </View>

          {/* ONE container (owner 2026-08-06): all the explanatory text + the
              fader image together, no nested inner container. Tap anywhere opens
              the full-size PresetFader popup. */}
          <Pressable
            style={styles.openPace}
            onPress={() => setFaderOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Open the pace fader"
          >
            <Text style={styles.explain}>
              A practice aid — never a limit. Pick a pace and a thin bar tracks whether you're
              ahead, on pace, or behind as you study. Pace is a multiple of quiz speed (20s per
              question). Stopwatch just counts up and saves your best time.
            </Text>
            <MiniFader preset={settings.preset} onPress={() => setFaderOpen(true)} />
          </Pressable>

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
            onPress={handleDone}
            accessibilityRole="button"
            accessibilityLabel="Done — add the pace timer"
          >
            <Text style={styles.doneText}>DONE</Text>
          </Pressable>
        </View>

        {/* Shared full-size fader popup — same component the container's
            hold-press fader button opens; here it's opened by the mini-fader. */}
        <PresetFader
          visible={faderOpen}
          preset={settings.preset}
          onChange={setPreset}
          onClose={() => setFaderOpen(false)}
        />
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
  explain: { alignSelf: 'stretch', fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 20, color: colors.textSub },

  // ONE container for the explanatory text + the fader image (owner 2026-08-06)
  // — no nested inner holder; the fader sits directly below the copy.
  openPace: {
    alignItems: 'center',
    gap: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(47,155,255,.3)',
    backgroundColor: 'rgba(47,155,255,.05)',
    padding: 12,
  },
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
