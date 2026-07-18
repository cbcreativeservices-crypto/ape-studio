/**
 * DspDebugScreen — Spike-0 D6 (kickoff brief): dev-only proof screen for the
 * ape-dsp native module. Live dBFS RMS/peak/peak-hold numbers, session info
 * (sample rate, route, measurement-mode verification), warning flags, dropped
 * frames, and a soak timer for the 10-minute S2 test. Deliberately NO design
 * language — plain readouts. Reached only via the __DEV__ row on ToolsHub.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ApeDsp, type DspFrame, type DspInfo } from '../../../modules/ape-dsp';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'DspDebug'>;

const POLL_MS = 100; // 10 Hz — well under the ≤30 Hz cap

function Row({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, warn && styles.warn]}>{value}</Text>
    </View>
  );
}

export function DspDebugScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const available = ApeDsp.isAvailable();
  const [info, setInfo] = useState<DspInfo | null>(null);
  const [frame, setFrame] = useState<DspFrame | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const polling = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (polling.current) clearInterval(polling.current);
    polling.current = null;
  };

  const start = useCallback(async () => {
    setError(null);
    try {
      const i = await ApeDsp.start();
      setInfo(i);
      setStartedAt(Date.now());
      stopPolling();
      polling.current = setInterval(() => {
        setFrame(ApeDsp.getFrame());
        setInfo(ApeDsp.getInfo()); // live — reflects route restarts + lastError
        setNow(Date.now());
      }, POLL_MS);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  const stop = useCallback(async () => {
    stopPolling();
    await ApeDsp.stop();
    setFrame(ApeDsp.getFrame());
    setInfo(ApeDsp.getInfo()); // refresh — otherwise "Session running" goes stale
    setStartedAt(null);
  }, []);

  useEffect(() => {
    return () => {
      stopPolling();
      void ApeDsp.stop();
    };
  }, []);

  const soak = startedAt ? Math.floor((now - startedAt) / 1000) : 0;
  const mm = String(Math.floor(soak / 60)).padStart(2, '0');
  const ss = String(soak % 60).padStart(2, '0');
  const db = (v: number | undefined) => (v == null ? '—' : `${v.toFixed(1)} dBFS`);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Text style={styles.back}>‹ BACK</Text>
        </Pressable>
        <Text style={styles.title}>APE-DSP SPIKE 0 · DEBUG</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {!available ? (
          <Text style={styles.notice}>
            Native module NOT present in this dev client. Install the new EAS development build,
            then reopen this screen.
          </Text>
        ) : (
          <>
            <View style={styles.btnRow}>
              <Pressable style={styles.btn} onPress={start}>
                <Text style={styles.btnText}>START</Text>
              </Pressable>
              <Pressable style={styles.btn} onPress={stop}>
                <Text style={styles.btnText}>STOP</Text>
              </Pressable>
              <Pressable style={styles.btn} onPress={() => ApeDsp.resetPeakHold()}>
                <Text style={styles.btnText}>RESET PEAK</Text>
              </Pressable>
            </View>

            {error ? <Text style={styles.notice}>{error}</Text> : null}

            <Text style={styles.section}>METERS (D4 proof engine)</Text>
            <Row label="RMS" value={db(frame?.rmsDb)} />
            <Row label="Peak" value={db(frame?.peakDb)} />
            <Row label="Peak hold" value={db(frame?.peakHoldDb)} />
            <Row label="Sequence" value={String(frame?.sequence ?? '—')} />
            <Row label="Soak timer" value={`${mm}:${ss}`} />

            <Text style={styles.section}>SESSION (D2 verification)</Text>
            <Row label="Sample rate" value={info ? `${info.sampleRate} Hz` : '—'} />
            <Row label="IO buffer" value={info ? `${(info.ioBufferDuration * 1000).toFixed(1)} ms` : '—'} />
            <Row label="Route" value={info?.routeName ?? '—'} />
            <Row label="Input port" value={info?.inputPortType ?? '—'} />
            <Row
              label="Measurement mode"
              value={info ? (info.measurementMode ? 'VERIFIED' : 'NOT HONORED') : '—'}
              warn={info ? !info.measurementMode : false}
            />
            <Row label="Session running" value={String(info?.running ?? '—')} warn={info ? !info.running : false} />
            {info?.stopReason ? <Row label="stopReason" value={info.stopReason} warn /> : null}
            {info?.lastError ? <Row label="lastError" value={info.lastError} warn /> : null}

            <Text style={styles.section}>NATIVE EVENT LOG</Text>
            {(info?.events ?? []).length === 0 ? (
              <Text style={styles.label}>— no events —</Text>
            ) : (
              (info?.events ?? []).map((e, i) => (
                <Text key={`${i}-${e}`} style={styles.eventLine}>
                  {e}
                </Text>
              ))
            )}

            <Text style={styles.section}>FLAGS</Text>
            <Row label="running" value={String(frame?.running ?? '—')} />
            <Row label="captureStalled" value={String(frame?.captureStalled ?? '—')} warn={!!frame?.captureStalled} />
            <Row label="processedInput" value={String(frame?.processedInput ?? '—')} warn={!!frame?.processedInput} />
            <Row label="bluetoothInput" value={String(frame?.bluetoothInput ?? '—')} warn={!!frame?.bluetoothInput} />
            <Row label="interrupted" value={String(frame?.interrupted ?? '—')} warn={!!frame?.interrupted} />
            <Row label="droppedFrames" value={String(frame?.droppedFrames ?? '—')} warn={(frame?.droppedFrames ?? 0) > 0} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0c0c0c' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingBottom: 10 },
  back: { color: '#8ab4ff', fontSize: 14 },
  title: { color: '#ffffff', fontSize: 14, fontWeight: '700', letterSpacing: 1 },
  scroll: { padding: 16, gap: 6 },
  btnRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  btn: { borderWidth: 1, borderColor: '#555', borderRadius: 6, paddingVertical: 10, paddingHorizontal: 14 },
  btnText: { color: '#eee', fontSize: 13, fontWeight: '700' },
  section: { color: '#ffb400', fontSize: 12, letterSpacing: 1.5, marginTop: 14, marginBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  label: { color: '#9a9a9a', fontSize: 14 },
  value: { color: '#e8e8e8', fontSize: 14, fontVariant: ['tabular-nums'] },
  warn: { color: '#ff6a5e' },
  notice: { color: '#ffb4a8', fontSize: 14, lineHeight: 20, paddingVertical: 8 },
  eventLine: { color: '#8fae8f', fontSize: 12, fontVariant: ['tabular-nums'], paddingVertical: 1 },
});
