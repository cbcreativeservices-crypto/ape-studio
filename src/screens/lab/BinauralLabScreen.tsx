/**
 * BinauralLabScreen — WAVE-2 expansion lab "Binaural Panner" (owner 2026-07-26)
 * on the shared LabShell. Up to THREE sound objects placed around the
 * listener's head on an overhead stage, rendered to a binaural HEADPHONE mix by
 * the native bus (ITD + ILD + head shadow — a SIMPLIFIED spherical-head model,
 * deliberately NOT a measured HRTF; badged, per owner decision).
 *
 * INTERACTION: drag a source around the head — azimuth comes from the angle,
 * distance from the radius. Dragging locks the shell's scroll (render-prop
 * setScrollLocked) so the gesture wins — and (layout v2, owner 2026-07-29)
 * the stage sits in an InteractionZone, which claims the touch AT TOUCH-START
 * so the grab beats scroll from the first pixel (the two compose). binSet is
 * drag-rate safe: every target is ramped natively (the ITD delay slews ≤1%
 * Doppler — physically plausible).
 *
 * LAYOUT v2 (owner 2026-07-29): collapsible READOUTS → DISPLAY → CONTROLS →
 * ACTIONS sections; PLAY/STOP is the compact HeaderPlayButton via LabShell's
 * headerAction; the shell renders the Guided-Lesson entry row itself. The
 * honesty badges stay unsectioned at the top — non-negotiable visibility.
 *
 * HONESTY: HEADPHONES-REQUIRED badge (crosstalk collapses the illusion on
 * speakers — the lesson says why); "simplified model" badge; the bus norm is
 * displayed whenever the Q4 sum bound attenuates. Audio needs engineVersion ≥ 7
 * — below it the stage + lessons work and the build requirement is stated.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { ApeDsp, BIN_SRC } from '../../../modules/ape-dsp';
import { useAudioOutputGate } from '../../features/audio/AudioOutputGate';
import { noteAudioActivity } from '../../features/audio/audioOutputStore';
import { GuidedLessonSheet, getLabLesson, DisplayGuideButton } from '../../features/lab/guidedLessons';
import { EngineGate } from '../tools/EngineGate';
import type { EngineState } from '../../features/tools/engine/useDspEngine';
import { colors, fonts } from '../../theme/tokens';
import { LabShell, LabChip, CollapsibleSection, HeaderPlayButton, InteractionZone } from './LabShell';

const ACTIVITY_MS = 500;
const MIN_DIST = 0.5;
const MAX_DIST = 4.0;
const SRC_LEVEL_DB = -16; // ≤ −12 cap; bus norm bounds the sum

const SRC_COLORS = ['#ffc64d', '#5bff85', '#6fa8ff'] as const;
const TYPES = [
  { v: BIN_SRC.sine, label: 'TONE' },
  { v: BIN_SRC.pink, label: 'PINK' },
  { v: BIN_SRC.white, label: 'WHITE' },
] as const;
const TONE_FREQS = [250, 440, 880, 2000] as const;

type Source = {
  on: boolean;
  type: number;
  freq: number;
  azDeg: number; // 0 = front, +90 = right
  dist: number; // meters
};

const DEFAULT_SOURCES: Source[] = [
  { on: true, type: BIN_SRC.pink, freq: 440, azDeg: -60, dist: 1.5 },
  { on: false, type: BIN_SRC.sine, freq: 440, azDeg: 60, dist: 1.5 },
  { on: false, type: BIN_SRC.white, freq: 440, azDeg: 180, dist: 2.5 },
];

const INTRO =
  'Your brain finds a sound with two ear signals: the far ear hears LATER (time difference) ' +
  'and DARKER (head shadow). This lab synthesizes those cues — place up to three sound ' +
  'objects around your head and hear them localize. Headphones required: on speakers the ' +
  'channels mix in the air and the illusion collapses.';

export function BinauralLabScreen() {
  const { requestAudioOutput } = useAudioOutputGate();

  const [gate] = useState<EngineState>(() => {
    if (!ApeDsp.isAvailable()) return 'absent';
    return ApeDsp.engineVersion() >= 2 ? 'idle' : 'spike';
  });
  const engineReady = gate === 'idle';
  const binReady = engineReady && ApeDsp.wave2Available();

  const [sources, setSources] = useState<Source[]>(DEFAULT_SOURCES);
  const [selected, setSelected] = useState(0);
  const [running, setRunning] = useState(false);
  const [busNorm, setBusNorm] = useState(1);
  const [genError, setGenError] = useState('');

  const [lessonKey, setLessonKey] = useState<string | undefined>(undefined);
  const [lessonOpen, setLessonOpen] = useState(false);
  const openLesson = useCallback((key?: string) => {
    setLessonKey(key);
    setLessonOpen(true);
  }, []);

  // Push one source's targets to the native bus (no-op below v7).
  const pushSource = useCallback((i: number, s: Source) => {
    ApeDsp.binSet(i, {
      on: s.on,
      type: s.type,
      freq: s.freq,
      levelDb: SRC_LEVEL_DB,
      azDeg: s.azDeg,
      dist: s.dist,
    });
  }, []);
  const pushAll = useCallback(
    (list: Source[]) => list.forEach((s, i) => pushSource(i, s)),
    [pushSource],
  );

  const start = useCallback(async () => {
    if (!binReady) return;
    const ok = await requestAudioOutput();
    if (!ok) return;
    setGenError('');
    pushAll(sources);
    try {
      const st = await ApeDsp.binStart();
      setRunning(true);
      setBusNorm(st?.busNorm ?? 1);
      noteAudioActivity();
    } catch (e) {
      setGenError(e instanceof Error ? e.message : String(e));
    }
  }, [binReady, requestAudioOutput, pushAll, sources]);

  const stop = useCallback(() => {
    void ApeDsp.binStop();
    setRunning(false);
  }, []);

  useFocusEffect(useCallback(() => () => stop(), [stop]));
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      noteAudioActivity();
      const st = ApeDsp.binStatus();
      if (st) setBusNorm(st.busNorm);
    }, ACTIVITY_MS);
    return () => clearInterval(id);
  }, [running]);

  /** Update source i and (while running) push it live. */
  const updateSource = useCallback(
    (i: number, patch: Partial<Source>) => {
      setSources((prev) => {
        const next = prev.map((s, k) => (k === i ? { ...s, ...patch } : s));
        pushSource(i, next[i]);
        if (running) noteAudioActivity();
        return next;
      });
    },
    [pushSource, running],
  );

  const sel = sources[selected];

  return (
    <LabShell
      labId="binaural"
      title="BINAURAL PANNER LAB"
      subtitle="ITD · ILD · Head Shadow · Localization"
      intro={INTRO}
      exploreCaption="Drag a sound object around the head — angle sets the time/level cues, radius sets distance. Use headphones."
      headerAction={
        <HeaderPlayButton
          playing={running}
          disabled={!binReady}
          onPress={() => (running ? stop() : void start())}
          label={running ? 'Stop' : 'Play the binaural mix'}
        />
      }
    >
      {({ setScrollLocked }) => (
        <>
          {!engineReady ? <EngineGate state={gate} /> : null}

          {/* Honesty badges — both non-negotiable for this lab. */}
          <View style={styles.badgeRow}>
            <Text style={styles.warnBadge}>🎧 HEADPHONES REQUIRED</Text>
            <Text style={styles.modelBadge}>SIMPLIFIED BINAURAL — NOT MEASURED HRTF</Text>
          </View>

          <CollapsibleSection title="READOUTS">
            <Text style={styles.readout}>
              Object {selected + 1}: azimuth {sel.azDeg >= 0 ? '+' : ''}
              {sel.azDeg.toFixed(0)}° ({azimuthWord(sel.azDeg)}) · distance {sel.dist.toFixed(1)} m
            </Text>
            <Text style={styles.caption}>
              Far-ear delay ≈ {itdUs(sel.azDeg).toFixed(0)} µs · far-ear level −
              {ildDb(sel.azDeg).toFixed(1)} dB + head-shadow low-pass — the two cues your brain
              triangulates with. Behind-the-head is only gently hinted (front/back needs HRTF
              pinna cues this model deliberately doesn't fake).
            </Text>
          </CollapsibleSection>

          <CollapsibleSection title="DISPLAY">
            {/* THE STAGE — overhead view, draggable sources. The
                InteractionZone claims the touch at touch-start so grabs beat
                scroll; the Stage's own setScrollLocked wiring keeps the shell
                locked for the drag's duration (they compose). */}
            <View style={styles.panelCard}>
              <Text style={styles.badge}>
                OVERHEAD STAGE — DRAG A SOURCE · ANGLE = AZIMUTH · RADIUS = DISTANCE
              </Text>
              <InteractionZone>
                <Stage
                  sources={sources}
                  selected={selected}
                  onSelect={setSelected}
                  onMove={(i, azDeg, dist) => updateSource(i, { azDeg, dist })}
                  setScrollLocked={setScrollLocked}
                />
              </InteractionZone>
              <DisplayGuideButton onPress={() => openLesson('display')} />
            </View>
          </CollapsibleSection>

          <CollapsibleSection title="CONTROLS">
            <Text style={styles.sectionHead}>SOUND OBJECTS</Text>
            <View style={styles.chipRow}>
              {sources.map((s, i) => (
                <LabChip
                  key={i}
                  label={`${i + 1} ${s.on ? '●' : '○'}`}
                  selected={selected === i}
                  onPress={() => setSelected(i)}
                  onLongPress={() => openLesson('objects')}
                />
              ))}
              <LabChip
                label={sel.on ? 'ON' : 'OFF'}
                selected={sel.on}
                onPress={() => updateSource(selected, { on: !sel.on })}
                onLongPress={() => openLesson('objects')}
              />
            </View>
            <View style={styles.chipRow}>
              {TYPES.map((t) => (
                <LabChip
                  key={t.label}
                  label={t.label}
                  selected={sel.type === t.v}
                  onPress={() => updateSource(selected, { type: t.v })}
                  onLongPress={() => openLesson('source_type')}
                />
              ))}
              {sel.type === BIN_SRC.sine
                ? TONE_FREQS.map((f) => (
                    <LabChip
                      key={f}
                      label={`${f}`}
                      selected={sel.freq === f}
                      onPress={() => updateSource(selected, { freq: f })}
                      onLongPress={() => openLesson('tone_freq')}
                    />
                  ))
                : null}
            </View>
          </CollapsibleSection>

          <CollapsibleSection title="ACTIONS">
            {/* AUDIO — engine-gated ≥ v7, honest below. PLAY lives in the
                header (▶); the honest level captions stay here. */}
            {engineReady ? (
              binReady ? (
                <>
                  <Text style={styles.caption}>
                    PLAY (header ▶) mixes all enabled objects to one binaural bus at {SRC_LEVEL_DB}{' '}
                    dBFS each · uncalibrated.
                    {busNorm < 0.999
                      ? ` Bus norm ${busNorm.toFixed(2)} — the peak bound is attenuating the sum (honest level).`
                      : ''}
                  </Text>
                  {genError ? <Text style={styles.error}>{genError}</Text> : null}
                </>
              ) : (
                <Text style={styles.caption}>
                  Binaural audio needs the v7 engine build — this dev client predates it. The stage
                  and lessons are fully functional; install the v7 build to hear the mix.
                </Text>
              )
            ) : null}
          </CollapsibleSection>

          <GuidedLessonSheet
            visible={lessonOpen}
            lesson={getLabLesson('binaural')}
            controlKey={lessonKey}
            onClose={() => setLessonOpen(false)}
          />
        </>
      )}
    </LabShell>
  );
}

// ── Display mirrors of the native model (Woodworth ITD + sin-θ ILD) ──────────
function foldTheta(azDeg: number): number {
  const a = Math.abs(azDeg);
  const front = a > 90 ? 180 - a : a;
  return (front * Math.PI) / 180;
}
function itdUs(azDeg: number): number {
  const th = foldTheta(azDeg);
  return (0.0875 / 343) * (th + Math.sin(th)) * 1e6;
}
function ildDb(azDeg: number): number {
  return 8 * Math.sin(foldTheta(azDeg));
}
function azimuthWord(az: number): string {
  const a = ((az % 360) + 360) % 360;
  if (a < 25 || a > 335) return 'front';
  if (a < 65) return 'front-right';
  if (a < 115) return 'right';
  if (a < 155) return 'rear-right';
  if (a < 205) return 'behind';
  if (a < 245) return 'rear-left';
  if (a < 295) return 'left';
  return 'front-left';
}

// ─────────────────────────────────────────────────────────────────────────────

const STAGE = 300;

/** The overhead stage: head at center (nose UP = 0° azimuth, +90° right),
 *  distance rings at 1/2/3/4 m, sources draggable. One PanResponder; the grab
 *  picks the nearest source, moves stream angle+radius, release frees scroll. */
function Stage({
  sources,
  selected,
  onSelect,
  onMove,
  setScrollLocked,
}: {
  sources: Source[];
  selected: number;
  onSelect: (i: number) => void;
  onMove: (i: number, azDeg: number, dist: number) => void;
  setScrollLocked: (locked: boolean) => void;
}) {
  const [w, setW] = useState(0);
  const size = Math.min(w, STAGE + 60);
  const c = size / 2;
  const rMax = c - 16; // radius of the 4 m ring

  const toXY = useCallback(
    (s: Source) => {
      const r = (s.dist / MAX_DIST) * rMax;
      const a = (s.azDeg * Math.PI) / 180;
      return { x: c + r * Math.sin(a), y: c - r * Math.cos(a) };
    },
    [c, rMax],
  );

  // Refs so the PanResponder (created once) always sees current state.
  const stateRef = useRef({ sources, toXY, onSelect, onMove, c, rMax });
  stateRef.current = { sources, toXY, onSelect, onMove, c, rMax };
  const dragIdx = useRef(-1);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (e) => {
        const st = stateRef.current;
        const { locationX: x, locationY: y } = e.nativeEvent;
        let best = -1;
        let bestD = 40; // grab radius (px)
        st.sources.forEach((s, i) => {
          const p = st.toXY(s);
          const d = Math.hypot(p.x - x, p.y - y);
          if (d < bestD) {
            bestD = d;
            best = i;
          }
        });
        if (best >= 0) {
          dragIdx.current = best;
          st.onSelect(best);
          setScrollLocked(true);
          return true;
        }
        return false;
      },
      onPanResponderMove: (e) => {
        const st = stateRef.current;
        const i = dragIdx.current;
        if (i < 0) return;
        const { locationX: x, locationY: y } = e.nativeEvent;
        const dx = x - st.c;
        const dy = y - st.c;
        let az = (Math.atan2(dx, -dy) * 180) / Math.PI; // 0 = up (front)
        if (az > 180) az -= 360;
        const r = Math.hypot(dx, dy);
        const dist = Math.max(MIN_DIST, Math.min(MAX_DIST, (r / st.rMax) * MAX_DIST));
        st.onMove(i, az, dist);
      },
      onPanResponderRelease: () => {
        dragIdx.current = -1;
        setScrollLocked(false);
      },
      onPanResponderTerminate: () => {
        dragIdx.current = -1;
        setScrollLocked(false);
      },
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  return (
    <View onLayout={(e) => setW(Math.round(e.nativeEvent.layout.width))} style={{ alignItems: 'center' }}>
      {w > 0 ? (
        <View {...pan.panHandlers}>
          <Svg width={size} height={size}>
            {/* Distance rings (1..4 m). */}
            {[1, 2, 3, 4].map((m) => (
              <Circle
                key={m}
                cx={c}
                cy={c}
                r={(m / MAX_DIST) * rMax}
                stroke="#26262c"
                strokeWidth={1}
                fill="none"
              />
            ))}
            <SvgText x={c + 4} y={c - rMax + 12} fill="#4a4a52" fontSize={9}>
              4 m
            </SvgText>
            {/* Front axis + FRONT/BEHIND labels. */}
            <Line x1={c} y1={c - rMax} x2={c} y2={c + rMax} stroke="#1e1e24" strokeWidth={1} />
            <SvgText x={c} y={12} fill={colors.textSub} fontSize={9.5} textAnchor="middle">
              FRONT 0°
            </SvgText>
            <SvgText x={c} y={size - 4} fill={colors.textSub} fontSize={9.5} textAnchor="middle">
              BEHIND ±180°
            </SvgText>
            <SvgText x={size - 6} y={c + 3} fill={colors.textSub} fontSize={9.5} textAnchor="end">
              +90°
            </SvgText>
            {/* The head (nose up). */}
            <Circle cx={c} cy={c} r={13} fill="#2a2a31" stroke="#55555e" strokeWidth={1.5} />
            <Circle cx={c} cy={c - 13} r={4} fill="#55555e" />
            <Circle cx={c - 13} cy={c} r={3.5} fill="#454550" />
            <Circle cx={c + 13} cy={c} r={3.5} fill="#454550" />
            {/* Sources. */}
            {sources.map((s, i) => {
              const p = toXY(s);
              return (
                <Circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={i === selected ? 13 : 10}
                  fill={s.on ? SRC_COLORS[i] : 'none'}
                  stroke={SRC_COLORS[i]}
                  strokeWidth={2}
                  opacity={s.on ? 0.95 : 0.55}
                />
              );
            })}
          </Svg>
        </View>
      ) : (
        <View style={{ height: STAGE }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sectionHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.5, color: colors.amber },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  readout: { fontFamily: fonts.oswaldSemiBold, fontSize: 13.5, letterSpacing: 0.6, color: colors.textPrimary },
  error: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: '#ff6b5e' },
  warnBadge: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 10.5,
    letterSpacing: 1,
    color: '#ffc64d',
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.5)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  modelBadge: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 10.5,
    letterSpacing: 1,
    color: colors.textSub,
    borderWidth: 1,
    borderColor: '#26262c',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  panelCard: {
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: 12,
  },
  badge: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 1.2, color: colors.textSub },
});
