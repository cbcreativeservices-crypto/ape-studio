/**
 * ExposureMonitorScreen — the full Listening Exposure Monitor (owner spec
 * 2026-08-12 §13/§28/§29). Current session · Today · timeline · route
 * breakdown · 7/30-day history · guidance · settings · privacy controls.
 *
 * Every value on this screen is an EDUCATIONAL ESTIMATE unless a calibrated
 * reference is set — and even then it is labeled estimated at the ear (§1.7:
 * time is tracked exactly; level is estimated, labeled, never fabricated).
 * No engagement mechanics, no rewards for exposure (§28).
 */
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { confirmDialog } from '../../lib/confirm';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../theme/tokens';
import { splColorForDba } from '../../features/tools/levelColor';
import {
  DEFAULT_SETTINGS,
  deleteExposureHistory,
  deleteExposureToday,
  EXPOSURE_HONESTY_LINE,
  exportExposureHistory,
  fmtDuration,
  fmtRemaining,
  getExposureHistory,
  getExposureSnapshot,
  ROUTE_LABELS,
  STANDARD_LABELS,
  subscribeExposure,
  type RouteKey,
  updateExposureSettings,
  type DayRecord,
  type ExposureSnapshot,
  type ExposureStandard,
} from '../../features/audio/exposureMonitor';

function Row({
  label,
  value,
  strong,
  levelDba,
}: {
  label: string;
  value: string;
  strong?: boolean;
  /** Pass the dBA behind the value when this row reads a LEVEL, so the number
   *  carries the amplitude ramp (owner 2026-08-12) instead of flat amber. */
  levelDba?: number | null;
}) {
  const tint = levelDba != null ? splColorForDba(levelDba) : undefined;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, strong && { color: colors.amber }, tint ? { color: tint } : null]}>{value}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable
      style={styles.row}
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.toggleText, value ? { color: colors.green } : { color: '#5a5b63' }]}>{value ? 'ON' : 'OFF'}</Text>
    </Pressable>
  );
}

const INTERVALS: { label: string; v: number }[] = [
  { label: '15 min', v: 15 },
  { label: '30 min', v: 30 },
  { label: '60 min', v: 60 },
  { label: 'Elevated only', v: 0 },
  { label: 'Off', v: -1 },
];

const STANDARDS: ExposureStandard[] = ['niosh3', 'osha5', 'conservative3'];

export function ExposureMonitorScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [snap, setSnap] = useState<ExposureSnapshot>(getExposureSnapshot());
  const [history, setHistory] = useState<DayRecord[]>([]);
  const [range, setRange] = useState<7 | 30>(7);

  useEffect(() => subscribeExposure(() => setSnap(getExposureSnapshot())), []);
  useEffect(() => {
    void getExposureHistory().then(setHistory);
  }, [snap.todayActiveSec === 0]); // refresh after deletes; live today rides the snapshot

  const s = snap.settings;
  const dosePct = Math.round(snap.todayDose * 100);
  const shownHistory = useMemo(() => history.slice(0, range), [history, range]);
  const today = history.find((d) => d.date === new Date().toISOString().slice(0, 10));
  const maxSessionSec = Math.max(60, ...(today?.sessions.map((x) => x.activeSec) ?? []));

  const confLabel = snap.confidence === 'calibrated' ? 'Calibrated reference' : 'General estimate';

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1, flexGrow: 1 }}>
          <Text style={styles.title}>LISTENING EXPOSURE MONITOR</Text>
          <Text style={styles.subtitle}>Listening dose · exposure time · hearing conservation</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.honesty}>{EXPOSURE_HONESTY_LINE}</Text>

        <Section title="CURRENT SESSION">
          {snap.sessionStartMs != null ? (
            <>
              <Row label="Session duration" value={fmtDuration(snap.sessionActiveSec)} />
              <Row
                label="Current level"
                value={
                  snap.currentDb != null ? `${Math.round(snap.currentDb)} dBA ${snap.measured ? 'measured' : 'estimated'}` : 'quiet'
                }
                levelDba={snap.currentDb}
              />
              <Row
                label="Session maximum"
                value={snap.sessionMaxDb > 0 ? `${Math.round(snap.sessionMaxDb)} dBA` : '—'}
                levelDba={snap.sessionMaxDb > 0 ? snap.sessionMaxDb : null}
              />
              <Row label="Source" value={snap.routeLabel} />
              <Row label="Confidence" value={confLabel} />
            </>
          ) : (
            <Text style={styles.body}>
              No active listening session. Tracking begins automatically whenever the app produces audible sound.
            </Text>
          )}
        </Section>

        <Section title="TODAY">
          <Row label="Active listening" value={fmtDuration(snap.todayActiveSec)} strong />
          <Row label="Daily dose" value={`${dosePct}%`} strong />
          {/* Dose bar — labeled, never color-only.
              DELIBERATELY NOT the amplitude ramp (checked 2026-08-28). That
              standard governs displays of AMPLITUDE; dose is accumulated
              exposure against a legal limit, and its green/amber/red steps ARE
              the 80% warning and 100% limit thresholds. A smooth ramp would
              erase exactly the two boundaries a listener needs to act on. */}
          <View style={styles.doseTrack} accessibilityLabel={`Daily dose ${dosePct} percent`}>
            <View
              style={[
                styles.doseFill,
                {
                  width: `${Math.min(100, dosePct)}%`,
                  backgroundColor: dosePct >= 100 ? '#ff2a2a' : dosePct >= 80 ? colors.amber : colors.green,
                },
              ]}
            />
          </View>
          <Row
            label="Average level (energy)"
            value={snap.todayAvgDb != null ? `${Math.round(snap.todayAvgDb)} dBA est.` : 'no data yet'}
            levelDba={snap.todayAvgDb}
          />
          <Row
            label="Highest level"
            value={snap.todayMaxDb > 0 ? `${Math.round(snap.todayMaxDb)} dBA est.` : '—'}
            levelDba={snap.todayMaxDb > 0 ? snap.todayMaxDb : null}
          />
          <Row label="Check-ins today" value={String(snap.checkinsToday)} />
          <Row label="Time remaining" value={fmtRemaining(snap.remainingSec, snap.confidence, snap.todayDose)} />
          {snap.hadGap ? (
            <Text style={styles.note}>
              The microphone stream dropped samples during this session, so measured time may be undercounted — treat
              this dose as a conservative estimate and restart monitoring for an uninterrupted reading.
            </Text>
          ) : null}
          <Text style={styles.note}>
            Quiet breaks reduce continuous strain, but today’s accumulated dose remains accumulated — it resets at
            midnight, not after a pause.
          </Text>
        </Section>

        {today && today.sessions.length > 0 ? (
          <Section title="TODAY’S SESSIONS">
            {today.sessions.slice(-8).map((sess, i) => {
              const t = new Date(sess.startMs);
              const hh = `${t.getHours()}:${String(t.getMinutes()).padStart(2, '0')}`;
              return (
                <View key={i} style={{ gap: 2 }}>
                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>{`${hh} · ${sess.route}`}</Text>
                    <Text style={styles.rowValue}>{`${fmtDuration(sess.activeSec)} · max ${Math.round(sess.maxDb)} dBA est.`}</Text>
                  </View>
                  <View style={styles.sessTrack}>
                    <View style={[styles.sessFill, { width: `${Math.min(100, (sess.activeSec / maxSessionSec) * 100)}%` }]} />
                  </View>
                </View>
              );
            })}
            <Row label="Longest continuous session" value={fmtDuration(today.longestSessionSec)} />
          </Section>
        ) : null}

        <Section title="EXPOSURE BY SOURCE — TODAY">
          {today ? (
            (Object.entries(today.routeSec) as [RouteKey, number][])
              .filter(([, sec]) => sec > 0)
              .map(([r, sec]) => <Row key={r} label={ROUTE_LABELS[r] ?? r} value={fmtDuration(sec)} />)
          ) : (
            <Text style={styles.body}>No exposure recorded yet today.</Text>
          )}
          <Text style={styles.note}>
            The monitor tracks BOTH what the app plays and what the microphone measures while you monitor a room or
            venue — using the SPL meter at a concert IS tracked. Environmental levels are measured (approximate) when the
            SPL meter is field-calibrated, otherwise estimated. Bluetooth and external outputs are never assumed to be
            headphones.
          </Text>
        </Section>

        <Section title="HISTORY">
          <View style={styles.chipRow}>
            {([7, 30] as const).map((r) => (
              <Pressable
                key={r}
                onPress={() => setRange(r)}
                accessibilityRole="button"
                accessibilityState={{ selected: range === r }}
                style={[styles.chip, range === r && styles.chipActive]}
              >
                <Text style={[styles.chipText, range === r && { color: colors.amber }]}>{`${r} days`}</Text>
              </Pressable>
            ))}
          </View>
          {shownHistory.length === 0 ? (
            <Text style={styles.body}>No history yet.</Text>
          ) : (
            shownHistory.map((d) => (
              <Row
                key={d.date}
                label={d.date}
                value={`${fmtDuration(d.activeSec)} · dose ${Math.round(d.dose * 100)}% · max ${d.maxDb > 0 ? `${Math.round(d.maxDb)} dBA` : '—'}`}
              />
            ))
          )}
        </Section>

        <Section title="GUIDANCE">
          <Text style={styles.body}>
            Duration matters as much as level: exposure accumulates. A 3 dB increase roughly HALVES the recommended
            listening time; lowering the level 3 dB roughly doubles it.
          </Text>
          <Text style={styles.body}>
            Estimates vary between headphones — sensitivity, fit and seal change the level at your ear for the same
            volume setting. Setting your reference point in Measurement below improves the estimate.
          </Text>
          <Text style={styles.body}>
            Occasional audience exposure and repeated occupational exposure are different problems: crew accumulate dose
            every working day. Quiet recovery periods between sessions are genuinely useful.
          </Text>
        </Section>

        <Section title="SETTINGS · TRACKING & CHECK-INS">
          <Toggle label="Listening Exposure Monitor" value={s.enabled} onChange={(v) => updateExposureSettings({ enabled: v })} />
          <Text style={styles.rowLabel}>Routine check-in interval (active minutes)</Text>
          <View style={styles.chipRow}>
            {INTERVALS.map((iv) => (
              <Pressable
                key={iv.label}
                onPress={() => updateExposureSettings({ checkinMinutes: iv.v })}
                accessibilityRole="button"
                accessibilityState={{ selected: s.checkinMinutes === iv.v }}
                style={[styles.chip, s.checkinMinutes === iv.v && styles.chipActive]}
              >
                <Text style={[styles.chipText, s.checkinMinutes === iv.v && { color: colors.amber }]}>{iv.label}</Text>
              </Pressable>
            ))}
          </View>
          <Toggle
            label="Critical dose warnings (separate from routine)"
            value={s.criticalWarnings}
            onChange={(v) => updateExposureSettings({ criticalWarnings: v })}
          />
          <Toggle label="Elevated-level advisories" value={s.advisoryWarnings} onChange={(v) => updateExposureSettings({ advisoryWarnings: v })} />
          <Toggle label="Gentle haptic on check-in" value={s.haptics} onChange={(v) => updateExposureSettings({ haptics: v })} />
        </Section>

        <Section title="SETTINGS · MEASUREMENT">
          <Text style={styles.rowLabel}>Exposure standard</Text>
          {STANDARDS.map((st) => (
            <Pressable
              key={st}
              style={styles.row}
              onPress={() => updateExposureSettings({ standard: st })}
              accessibilityRole="radio"
              accessibilityState={{ selected: s.standard === st }}
            >
              <Text style={[styles.rowLabel, s.standard === st && { color: colors.amber }]}>
                {s.standard === st ? '●' : '○'} {STANDARD_LABELS[st]}
              </Text>
            </Pressable>
          ))}
          <Text style={[styles.rowLabel, { marginTop: 8 }]}>
            {`Reference point: 0 dBFS at your usual volume ≈ ${s.refSplAt0Dbfs} dB SPL`}
          </Text>
          <View style={styles.chipRow}>
            {[-3, -1, +1, +3].map((d) => (
              <Pressable
                key={d}
                onPress={() =>
                  updateExposureSettings({
                    refSplAt0Dbfs: Math.max(70, Math.min(115, s.refSplAt0Dbfs + d)),
                    refCalibrated: true,
                  })
                }
                accessibilityRole="button"
                style={styles.chip}
              >
                <Text style={styles.chipText}>{d > 0 ? `+${d}` : d} dB</Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => updateExposureSettings({ refSplAt0Dbfs: DEFAULT_SETTINGS.refSplAt0Dbfs, refCalibrated: false })}
              accessibilityRole="button"
              style={styles.chip}
            >
              <Text style={styles.chipText}>Reset</Text>
            </Pressable>
          </View>
          <Text style={styles.note}>
            To calibrate: play the tone generator at a known level, compare against a trusted SPL meter at your ear
            position, and adjust the reference until they agree. Model selection alone cannot guarantee accuracy — fit,
            seal and device gain differ unit to unit.
          </Text>
          <Row label="Current confidence" value={confLabel} />
        </Section>

        <Section title="PRIVACY">
          <Text style={styles.body}>
            Exposure history is personal usage data, stored only on this device. It is never shared with instructors,
            institutions or profiles.
          </Text>
          <Toggle label="Save exposure history" value={s.saveHistory} onChange={(v) => updateExposureSettings({ saveHistory: v })} />
          <View style={styles.chipRow}>
            <Pressable
              style={styles.chip}
              accessibilityRole="button"
              onPress={() => {
                void exportExposureHistory().then((json) => Share.share({ message: json }));
              }}
            >
              <Text style={styles.chipText}>Export history</Text>
            </Pressable>
            <Pressable
              style={styles.chip}
              accessibilityRole="button"
              onPress={() =>
                // Alert.alert is a no-op on RN-web (QA night 2026-09-01).
                confirmDialog(
                  'Delete today’s exposure?',
                  'Today’s tracked time and dose will be cleared.',
                  'Delete',
                  () => void deleteExposureToday(),
                  { destructive: true },
                )
              }
            >
              <Text style={styles.chipText}>Delete today</Text>
            </Pressable>
            <Pressable
              style={styles.chip}
              accessibilityRole="button"
              onPress={() =>
                confirmDialog(
                  'Delete ALL exposure history?',
                  'Every stored day will be removed. This cannot be undone.',
                  'Delete all',
                  () => void deleteExposureHistory().then(() => setHistory([])),
                  { destructive: true },
                )
              }
            >
              <Text style={styles.chipText}>Delete all</Text>
            </Pressable>
          </View>
        </Section>

        <Text style={styles.honesty}>{EXPOSURE_HONESTY_LINE}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 8 },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 30, color: colors.textSub, marginTop: -4, paddingRight: 2 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 15.5, letterSpacing: 1, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.barlowRegular, fontSize: 12, color: colors.textSub, marginTop: 1 },
  scroll: { padding: 16, paddingBottom: 30, gap: 12 },
  honesty: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 9.5,
    letterSpacing: 0.8,
    color: '#8a8b93',
    textAlign: 'center',
    lineHeight: 14,
  },
  section: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#232329',
    backgroundColor: '#101014',
    padding: 12,
    gap: 7,
  },
  sectionTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.5, color: colors.amberLabel },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  rowLabel: { fontFamily: fonts.barlowRegular, fontSize: 13.5, color: colors.textSecondary, flexShrink: 1 },
  rowValue: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 0.4, color: colors.textPrimary },
  toggleText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1 },
  body: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  note: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16.5, color: colors.textSub, fontStyle: 'italic' },
  doseTrack: { height: 10, borderRadius: 5, backgroundColor: '#1b1c20', overflow: 'hidden' },
  doseFill: { height: '100%', borderRadius: 5 },
  sessTrack: { height: 5, borderRadius: 2.5, backgroundColor: '#1b1c20', overflow: 'hidden' },
  sessFill: { height: '100%', borderRadius: 2.5, backgroundColor: colors.blue },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  chipActive: { borderColor: 'rgba(255,198,77,.65)', backgroundColor: '#1a1409' },
  chipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 0.7, color: colors.textSecondary },
});
