/**
 * eqAudition — HEAR the module's EQ curve on a live test signal (owner
 * 2026-08-10, EQ test-signal MVP). Routes the NATIVE generator through the
 * engine's FX EQ (engineVersion ≥ 6 · FX.eq · Effects.hpp kMaxBands = 6) and
 * keeps the bands live-synced to the module's curve while it plays — so a
 * boost/cut you drag is a boost/cut you hear, on the same math the effect
 * labs use.
 *
 * FxLabScreen idiom throughout: request the audio-output gate, genSet with the
 * −20 dBFS house level (core keeps the −12 hard cap + route-aware protection),
 * push band params THEN enable, generation-guarded start, genStop + fxReset on
 * stop, teardown on blur, activity keepalive for Low-Light suppression.
 *
 * On a build without the FX engine, `eqAuditionAvailable()` is false and
 * <EqAuditionBar/> renders NOTHING — callers keep their existing visual-only
 * notes (present-tense honesty; the bar simply exists when the build can hear).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ApeDsp, EQ_BAND_TYPES, FX, FX_PARAM, GEN_MODES, type GenParams } from '../../../../../modules/ape-dsp';
import { useAudioOutputGate } from '../../../../features/audio/AudioOutputGate';
import { noteAudioActivity } from '../../../../features/audio/audioOutputStore';
import type { EqBandSpec } from '../../../../features/lab/fxViz';
import { colors, fonts } from '../../../../theme/tokens';
import { MiniBtn } from './eqBits';

const GEN_LEVEL_DB = -20; // house default; the core enforces the −12 dBFS cap
const ACTIVITY_MS = 500;
const MAX_BANDS = 6; // Effects.hpp kMaxBands — keep in lockstep

/** True when THIS build can play the EQ audibly (native FX engine present). */
export function eqAuditionAvailable(): boolean {
  return ApeDsp.isAvailable() && ApeDsp.fxAvailable();
}

/** Push up to 6 bands into the native EQ; unused slots go to `off`. Enable LAST
 *  (targets-first, the FxLabScreen rule). */
function pushBands(bands: EqBandSpec[]) {
  for (let i = 0; i < MAX_BANDS; i++) {
    const b = bands[i];
    ApeDsp.fxSet(FX.eq, FX_PARAM.eqBand(i, 'type'), b ? EQ_BAND_TYPES[b.type] : EQ_BAND_TYPES.off);
    if (b) {
      ApeDsp.fxSet(FX.eq, FX_PARAM.eqBand(i, 'freq'), b.freq);
      ApeDsp.fxSet(FX.eq, FX_PARAM.eqBand(i, 'q'), b.q);
      ApeDsp.fxSet(FX.eq, FX_PARAM.eqBand(i, 'gain'), b.gainDb);
    }
  }
  ApeDsp.fxSet(FX.eq, FX_PARAM.enabled, 1);
}

type SourceKey = 'pink' | 'sweep';
const SOURCES: { key: SourceKey; label: string; gen: GenParams }[] = [
  { key: 'pink', label: 'PINK NOISE', gen: { mode: GEN_MODES.pink } },
  {
    key: 'sweep',
    label: 'SWEEP',
    gen: { mode: GEN_MODES.sweepLog, sweep: { startHz: 40, endHz: 16000, seconds: 8, repeat: true } },
  },
];

/**
 * The one-row "hear it" bar: source chips + START/STOP. Drop it under a
 * module's controls and pass the CURRENT curve — band changes push live while
 * playing. Renders nothing when the build can't do audio.
 */
export function EqAuditionBar({ bands }: { bands: EqBandSpec[] }) {
  const available = eqAuditionAvailable();
  const { requestAudioOutput } = useAudioOutputGate();
  const [running, setRunning] = useState(false);
  const [source, setSource] = useState<SourceKey>('pink');
  const [error, setError] = useState('');
  const genRef = useRef(0);

  const stop = useCallback(() => {
    genRef.current++;
    void ApeDsp.genStop();
    ApeDsp.fxReset(); // leave NOTHING armed for the next lab (FxLab rule)
    setRunning(false);
  }, []);

  const start = useCallback(
    async (srcKey: SourceKey) => {
      if (!available) return;
      const gen = ++genRef.current;
      const ok = await requestAudioOutput();
      if (!ok || gen !== genRef.current) return;
      setError('');
      const src = SOURCES.find((s) => s.key === srcKey)!;
      ApeDsp.genSet({ levelDb: GEN_LEVEL_DB, ...src.gen });
      pushBands(bands);
      try {
        await ApeDsp.genStart();
        if (gen !== genRef.current) {
          void ApeDsp.genStop();
          ApeDsp.fxReset();
          return;
        }
        setRunning(true);
        noteAudioActivity();
      } catch (e) {
        if (gen === genRef.current) setError(e instanceof Error ? e.message : String(e));
        ApeDsp.fxReset();
      }
    },
    [available, requestAudioOutput, bands],
  );

  // Live-sync: while playing, every curve change lands in the native EQ.
  useEffect(() => {
    if (running && available) pushBands(bands);
  }, [bands, running, available]);

  // Blur/unmount: never leave a test signal running behind another screen.
  useFocusEffect(useCallback(() => () => stop(), [stop]));
  useEffect(() => {
    if (!running) return;
    const id = setInterval(noteAudioActivity, ACTIVITY_MS);
    return () => clearInterval(id);
  }, [running]);

  if (!available) return null;
  return (
    <View style={styles.bar}>
      <Text style={styles.head}>HEAR IT</Text>
      {SOURCES.map((s) => (
        <MiniBtn
          key={s.key}
          label={s.label}
          active={source === s.key}
          onPress={() => {
            setSource(s.key);
            if (running) {
              stop();
              void start(s.key);
            }
          }}
        />
      ))}
      <View style={{ flex: 1 }} />
      <MiniBtn label={running ? '■ STOP' : '▶ PLAY'} active={running} onPress={() => (running ? stop() : void start(source))} />
      {error ? <Text style={styles.err}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  head: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.4, color: colors.green },
  err: { fontFamily: fonts.barlowRegular, fontSize: 12, color: '#ff5a48' },
});
