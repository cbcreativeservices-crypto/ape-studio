/**
 * NoiseLabScreen — Lab 11 "Noise" (v4 MASTER §7) on the shared LabShell.
 * The noise-color lab: hear the colors, see their spectral slopes.
 *
 * AUDIO (honest, real): white / pink / brown / blue / violet are NATIVE
 * generator modes (GEN_MODES 2–6) — every color chip plays the real thing.
 * Grey + the textured real-world sources (speech noise, HVAC, traffic, wind,
 * hum, buzz, RF, crackle, static, ground loop) need new native sources or
 * recorded assets — listed honestly as in development, no dead chips (§1.7).
 *
 * DISPLAY (analytic, labeled): the slope chart draws the IDEALIZED dB/octave
 * lines that DEFINE each color (white 0 · pink −3 · brown −6 · blue +3 ·
 * violet +6, anchored at 1 kHz) — mathematics, not a measurement, and badged
 * as such. The "why does white sound brighter than it looks" moment is the
 * point of the lab.
 *
 * Sound lifecycle = the SignalGen idiom (gate → genSet/genStart → stale
 * guard → 2 Hz keepalive → stop on toggle/blur/unmount).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { ApeDsp, GEN_MODES } from '../../../modules/ape-dsp';
import { GlassButton } from '../../components/GlassButton';
import { useAudioOutputGate } from '../../features/audio/AudioOutputGate';
import { noteAudioActivity } from '../../features/audio/audioOutputStore';
import { guardNoiseLevelForEngine, speakerGuardDb, SPEAKER_HPF_HZ } from '../../features/audio/speakerSafety';
import { GuidedLessonSheet, getLabLesson } from '../../features/lab/guidedLessons';
import { EngineGate } from '../tools/EngineGate';
import type { EngineState } from '../../features/tools/engine/useDspEngine';
import { colors, fonts } from '../../theme/tokens';
import { LabShell, LabChip, SpeakerOutputToggle } from './LabShell';

const GEN_LEVEL_DB = -20;
const ACTIVITY_MS = 500;

type NoiseColor = 'white' | 'pink' | 'brown' | 'blue' | 'violet';

/** The five NATIVE colors: generator mode + defining slope (dB/octave). */
const COLORS: { key: NoiseColor; label: string; mode: number; slope: number }[] = [
  { key: 'white', label: 'WHITE', mode: GEN_MODES.white, slope: 0 },
  { key: 'pink', label: 'PINK', mode: GEN_MODES.pink, slope: -3 },
  { key: 'brown', label: 'BROWN', mode: GEN_MODES.brown, slope: -6 },
  { key: 'blue', label: 'BLUE', mode: GEN_MODES.blue, slope: 3 },
  { key: 'violet', label: 'VIOLET', mode: GEN_MODES.violet, slope: 6 },
];

const PENDING_SOURCES =
  'Grey · Speech noise · HVAC · Traffic · Wind · Hum · Buzz · RF · Crackle · Static · Ground loop';

/** Honest summary of the interim per-color level guard (see speakerSafety.ts). */
const NOISE_GUARD_LABEL = 'brown −14 dB, pink −6 dB, white/blue/violet unchanged';

const INTRO =
  'Hear the colors of noise and see the spectral slopes that define them. White is equal ' +
  'energy per Hz (bright); pink is equal energy per octave (balanced) — switching between ' +
  'them live is the core lesson.';

export function NoiseLabScreen() {
  const { requestAudioOutput } = useAudioOutputGate();

  const [gate] = useState<EngineState>(() => {
    if (!ApeDsp.isAvailable()) return 'absent';
    return ApeDsp.engineVersion() >= 2 ? 'idle' : 'spike';
  });
  const engineReady = gate === 'idle';

  const [color, setColor] = useState<NoiseColor>('pink');
  const [running, setRunning] = useState(false);
  const [genError, setGenError] = useState('');
  // PHONE SPEAKER OUTPUT view — show the roll-off the speaker imposes on noise.
  const [speakerView, setSpeakerView] = useState(false);

  const [lessonKey, setLessonKey] = useState<string | undefined>(undefined);
  const [lessonOpen, setLessonOpen] = useState(false);
  const openLesson = useCallback((key?: string) => {
    setLessonKey(key);
    setLessonOpen(true);
  }, []);

  const selected = COLORS.find((c) => c.key === color)!;

  // -- Noise lifecycle (one tone owner, stale-guarded) -----------------------
  const genRef = useRef(0);

  const startNoise = useCallback(async () => {
    const gen = ++genRef.current;
    const ok = await requestAudioOutput();
    if (!ok || gen !== genRef.current) return;
    setGenError('');
    // Speaker guard: brown/pink pile energy into the sub-bass the built-in
    // speaker can't handle → attenuate by color slope (white/blue/violet safe).
    ApeDsp.genSet({ mode: COLORS.find((c) => c.key === color)!.mode, levelDb: guardNoiseLevelForEngine(GEN_LEVEL_DB, color) });
    try {
      await ApeDsp.genStart();
      if (gen !== genRef.current) {
        void ApeDsp.genStop();
        return;
      }
      setRunning(true);
      noteAudioActivity();
    } catch (e) {
      if (gen === genRef.current) setGenError(e instanceof Error ? e.message : String(e));
    }
  }, [requestAudioOutput, color]);

  const stopNoise = useCallback(() => {
    genRef.current++;
    void ApeDsp.genStop();
    setRunning(false);
  }, []);

  useFocusEffect(useCallback(() => () => stopNoise(), [stopNoise]));
  useEffect(() => {
    if (!running) return;
    const id = setInterval(noteAudioActivity, ACTIVITY_MS);
    return () => clearInterval(id);
  }, [running]);

  // Live color switch while sounding (retune idiom) — THE A/B lesson.
  const pickColor = (c: NoiseColor) => {
    setColor(c);
    if (running) {
      // Re-apply the per-color guard on a live switch (brown/pink are the risk).
      ApeDsp.genSet({ mode: COLORS.find((x) => x.key === c)!.mode, levelDb: guardNoiseLevelForEngine(GEN_LEVEL_DB, c) });
      noteAudioActivity();
    }
  };

  return (
    <LabShell
      labId="noise"
      title="NOISE LAB"
      subtitle="Colors · Slopes · Floor & Masking"
      intro={INTRO}
      exploreCaption="Pick a color — switch colors WHILE it plays to hear the slope change."
    >
      {!engineReady ? <EngineGate state={gate} /> : null}

      <View style={styles.chipRow}>
        <LabChip label="ⓘ GUIDED LESSON" selected={lessonOpen} onPress={() => openLesson()} />
      </View>
      <Text style={styles.caption}>Long-press a color for its guided lesson.</Text>

      <Text style={styles.sectionHead}>NOISE COLOR</Text>
      <View style={styles.chipRow}>
        {COLORS.map((c) => (
          <LabChip
            key={c.key}
            label={c.label}
            selected={color === c.key}
            onPress={() => pickColor(c.key)}
            onLongPress={() => openLesson(c.key)}
          />
        ))}
      </View>

      {/* HONESTY CONTROL — ideal slopes vs the speaker's low-frequency roll-off. */}
      <SpeakerOutputToggle
        value={speakerView}
        onChange={setSpeakerView}
        sub={
          speakerView
            ? `Selected color's slope with the ${SPEAKER_HPF_HZ} Hz high-pass applied — the low end the built-in speaker can't deliver.`
            : 'Reference (ideal) slopes. Tick to see the speaker-output roll-off.'
        }
      />

      {/* SLOPE CHART — the defining mathematics; speaker view adds the HPF. */}
      <View style={styles.panelCard}>
        <Text style={styles.badge}>
          {speakerView
            ? `PHONE SPEAKER OUTPUT — ${SPEAKER_HPF_HZ} Hz HPF ON ${selected.label}`
            : 'IDEALIZED SPECTRAL SLOPES — ANALYTIC, NOT A MEASUREMENT'}
        </Text>
        <SlopeChart selectedKey={color} selectedSlope={selected.slope} speakerView={speakerView} />
        <Text style={styles.caption}>
          {speakerView
            ? `Amber = ${selected.label.toLowerCase()} after the speaker high-pass; the ideal straight slopes stay dim behind it. Below ${SPEAKER_HPF_HZ} Hz the response rolls off at −12 dB/oct — that low energy never reaches the driver.`
            : `${selected.label.charAt(0)}${selected.label.slice(1).toLowerCase()} = ${
                selected.slope > 0 ? '+' : ''
              }${selected.slope} dB per octave (anchored at 1 kHz). Equal energy per Hz sounds bright because every higher octave holds twice the bandwidth.`}
        </Text>
      </View>

      {engineReady ? (
        <>
          <GlassButton
            label={running ? 'STOP' : 'PLAY NOISE'}
            tint="green"
            height={52}
            fontSize={15}
            onPress={() => (running ? stopNoise() : void startNoise())}
          />
          <Text style={styles.caption}>
            {`Output ${GEN_LEVEL_DB} dBFS · uncalibrated — digital output level, not dB SPL.`}
          </Text>
          <Text style={styles.advisory}>
            {`Brown/pink are broadband, so this build reduces their overall LEVEL to protect the speaker ` +
              `(${NOISE_GUARD_LABEL}); a true per-frequency high-pass on noise ships with the native engine ` +
              `update. Tick PHONE SPEAKER OUTPUT to see the ${SPEAKER_HPF_HZ} Hz roll-off the speaker imposes.`}
          </Text>
          {genError ? <Text style={styles.error}>{genError}</Text> : null}
        </>
      ) : null}

      {/* Textured sources — honest status, no dead chips (§1.7). */}
      <View style={styles.devNote}>
        <Text style={styles.devNoteHead}>REAL-WORLD SOURCES — IN DEVELOPMENT</Text>
        <Text style={styles.caption}>
          {PENDING_SOURCES} need new native sources or recorded assets and will appear here when
          they land. Their theory (hum vs buzz vs ground loop on a spectrogram) is in this lab’s
          lesson (ⓘ).
        </Text>
      </View>

      <GuidedLessonSheet
        visible={lessonOpen}
        lesson={getLabLesson('noise')}
        controlKey={lessonKey}
        onClose={() => setLessonOpen(false)}
      />
    </LabShell>
  );
}

/** The five color slopes over a 20 Hz–20 kHz log axis, selected one bright. In
 *  speakerView, the selected color is redrawn with the high-pass applied (a
 *  sampled curve that rolls off below the corner) so the speaker's low-end limit
 *  is visible; the ideal straight slopes stay dim behind it. */
function SlopeChart({
  selectedKey,
  selectedSlope,
  speakerView,
}: {
  selectedKey: NoiseColor;
  selectedSlope: number;
  speakerView: boolean;
}) {
  const W = 320;
  const H = 150;
  const padL = 8;
  const padR = 34; // room for line labels at the right edge
  const OCT_LO = Math.log2(20 / 1000); // ≈ −5.64 octaves re 1 kHz
  const OCT_HI = Math.log2(20000 / 1000); // ≈ +4.32
  const DB_RANGE = 38; // ±38 dB vertical

  const xAt = (oct: number) => padL + ((oct - OCT_LO) / (OCT_HI - OCT_LO)) * (W - padL - padR);
  const yAt = (db: number) => H / 2 - (Math.max(-DB_RANGE, Math.min(DB_RANGE, db)) / DB_RANGE) * (H / 2 - 8);

  // Selected color's response AFTER the speaker high-pass, sampled across the
  // axis (guard is a curve, so a straight line won't do). slope·oct + guardDb(f).
  const filteredPath = useMemo(() => {
    if (!speakerView) return '';
    const N = 64;
    let s = '';
    for (let i = 0; i <= N; i++) {
      const oct = OCT_LO + (i / N) * (OCT_HI - OCT_LO);
      const f = 1000 * Math.pow(2, oct);
      const db = selectedSlope * oct + speakerGuardDb(f);
      s += `${i === 0 ? 'M' : 'L'}${xAt(oct).toFixed(1)} ${yAt(db).toFixed(1)}`;
    }
    return s;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speakerView, selectedSlope]);

  const lines = useMemo(
    () =>
      COLORS.map((c) => ({
        key: c.key,
        label: c.label,
        d: `M${xAt(OCT_LO).toFixed(1)} ${yAt(c.slope * OCT_LO).toFixed(1)} L${xAt(OCT_HI).toFixed(1)} ${yAt(
          c.slope * OCT_HI,
        ).toFixed(1)}`,
        endY: yAt(c.slope * OCT_HI),
      })),
    // Geometry is constant; recompute never needed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const freqTicks = [20, 200, 1000, 2000, 20000];
  return (
    <Svg width="100%" height={H + 16} viewBox={`0 0 ${W} ${H + 16}`}>
      <Rect x={0} y={0} width={W} height={H} fill="#0c0c0f" />
      {/* 0 dB reference + 1 kHz anchor */}
      <Line x1={padL} y1={H / 2} x2={W - padR} y2={H / 2} stroke="#22222a" strokeWidth={1} />
      <Line x1={xAt(0)} y1={4} x2={xAt(0)} y2={H - 4} stroke="#22222a" strokeWidth={1} />
      {lines.map((l) => {
        // In speaker view every ideal slope is dim reference; the bright line is
        // the filtered curve below. Otherwise the selected color is bright.
        const active = !speakerView && l.key === selectedKey;
        return (
          <Path
            key={l.key}
            d={l.d}
            stroke={active ? colors.amber : '#3a3a44'}
            strokeWidth={active ? 2.2 : 1.2}
            fill="none"
            opacity={speakerView ? 0.5 : 1}
          />
        );
      })}
      {filteredPath ? <Path d={filteredPath} stroke={colors.amber} strokeWidth={2.4} fill="none" /> : null}
      {/* corner marker at the high-pass cutoff */}
      {speakerView ? (
        <Line
          x1={xAt(Math.log2(SPEAKER_HPF_HZ / 1000))}
          y1={4}
          x2={xAt(Math.log2(SPEAKER_HPF_HZ / 1000))}
          y2={H - 4}
          stroke="rgba(255,198,77,.35)"
          strokeWidth={1}
        />
      ) : null}
      {lines.map((l) => (
        <SvgText
          key={`t${l.key}`}
          x={W - padR + 3}
          y={Math.min(Math.max(l.endY + 3, 10), H - 4)}
          fill={l.key === selectedKey ? colors.amber : colors.textSub}
          fontSize={8}
        >
          {l.label}
        </SvgText>
      ))}
      {freqTicks.map((f) => (
        <SvgText
          key={f}
          x={xAt(Math.log2(f / 1000))}
          y={H + 12}
          fill={colors.textSub}
          fontSize={8}
          textAnchor="middle"
        >
          {f >= 1000 ? `${f / 1000}k` : `${f}`}
        </SvgText>
      ))}
    </Svg>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sectionHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.5, color: colors.amber },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  advisory: { fontFamily: fonts.barlowMedium, fontSize: 12, lineHeight: 16, color: colors.amber },
  error: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: '#ff6b5e' },
  panelCard: {
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: 12,
  },
  badge: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 1.2, color: colors.textSub },
  devNote: {
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: 12,
  },
  devNoteHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.2, color: colors.textSecondary },
});
