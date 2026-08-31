/**
 * BinauralLabScreen — WAVE-2 expansion lab "Binaural Panner" (owner 2026-07-26)
 * on the shared LabShell. Up to THREE sound objects placed around the
 * listener's head on an overhead stage, rendered to a binaural HEADPHONE mix by
 * the native bus (ITD + ILD + head shadow — a SIMPLIFIED spherical-head model,
 * deliberately NOT a measured HRTF; badged, per owner decision).
 *
 * RACK UNIT (APE_LAB_UX_PROPOSAL 2026-08-23): the overhead stage IS the lab,
 * so it pins on the tall glass ('L') with OBJ / AZ / DIST / ITD readouts on
 * the bezel. Azimuth and distance become lane faders (AZ pre-bound — the
 * localization cue is the teaching parameter) while dragging on the glass
 * keeps working — the two compose, both routes stream through updateSource.
 * Object pick/enable and source type/frequency are GROUP trays composing the
 * original LabChips (long-press lessons intact). Only the teaching prose,
 * the headphones advisory, and the honest audio captions scroll in the well.
 *
 * INTERACTION: drag a source around the head — azimuth comes from the angle,
 * distance from the radius. The stage is pinned OUTSIDE the scroll well, so
 * the PanResponder owns the touch with no scroll to fight (the old
 * InteractionZone + setScrollLocked wiring retired with the scrolling
 * layout). binSet is drag-rate safe: every target is ramped natively (the
 * ITD delay slews ≤1% Doppler — physically plausible).
 *
 * HONESTY: the "SIMPLIFIED BINAURAL — NOT MEASURED HRTF" badge is
 * silk-screened under the glass (per-display, non-negotiable); the
 * HEADPHONES-REQUIRED advisory stays prominent at the top of the well
 * (crosstalk collapses the illusion on speakers — the lesson says why); the
 * bus norm is displayed whenever the Q4 sum bound attenuates. Audio needs
 * engineVersion ≥ 7 — below it the stage + lessons work and the build
 * requirement is stated.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import { ApeDsp, BIN_SRC } from '../../../modules/ape-dsp';
import { useAudioOutputGate } from '../../features/audio/AudioOutputGate';
import { noteAudioActivity } from '../../features/audio/audioOutputStore';
import { GuidedLessonSheet, getLabLesson } from '../../features/lab/guidedLessons';
import { CheckQuestion } from './foundations/bits';
import { EngineGate } from '../tools/EngineGate';
import type { EngineState } from '../../features/tools/engine/useDspEngine';
import { colors, fonts } from '../../theme/tokens';
import { LabShell, LabChip, HeaderPlayButton } from './LabShell';

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

  // Generation guard (fix 2026-08-28) — start() awaits the audio-output request
  // and the native binStart(); leaving the lab during that window fired
  // binStop() FIRST, so the bus was left sounding with no UI path back to stop.
  // Same pattern as BassLabScreen/AutotuneLabScreen.
  const genRef = useRef(0);

  const start = useCallback(async () => {
    if (!binReady) return;
    const gen = ++genRef.current;
    const ok = await requestAudioOutput();
    if (!ok || gen !== genRef.current) return;
    setGenError('');
    pushAll(sources);
    try {
      const st = await ApeDsp.binStart();
      if (gen !== genRef.current) {
        void ApeDsp.binStop(); // we left while the native start was in flight
        return;
      }
      setRunning(true);
      setBusNorm(st?.busNorm ?? 1);
      noteAudioActivity();
    } catch (e) {
      if (gen === genRef.current) setGenError(e instanceof Error ? e.message : String(e));
    }
  }, [binReady, requestAudioOutput, pushAll, sources]);

  const stop = useCallback(() => {
    genRef.current++;
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
  const azSign = sel.azDeg >= 0 ? '+' : '';
  const azWord = azimuthWord(sel.azDeg);
  const typeLabel = TYPES.find((t) => t.v === sel.type)!.label;

  // ── RACK UNIT (APE_LAB_UX_PROPOSAL 2026-08-23) ────────────────────────────
  // The overhead stage + its cue readouts pin on the glass/bezel; AZ and DIST
  // ride the lane (drag-on-glass still works — same updateSource stream); the
  // object and source pickers are group trays of the original chips. The well
  // keeps the headphones advisory, the cue teaching, and the honest audio
  // captions.
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
      rack={{
        initialParam: 'az',
        onHelp: openLesson,
        stage: {
          size: 'L', // the overhead stage IS the lab — earns the tall glass
          badge: 'SIMPLIFIED BINAURAL — NOT MEASURED HRTF',
          onGuide: () => openLesson('display'),
          bezel: [
            {
              k: 'OBJ',
              v: `${selected + 1} ${sel.on ? 'ON' : 'OFF'}`,
              tint: SRC_COLORS[selected],
              helpKey: 'objects',
            },
            { k: 'AZ', v: `${azSign}${sel.azDeg.toFixed(0)}° ${azWord}`, flex: 1.5, helpKey: 'display' },
            { k: 'DIST', v: `${sel.dist.toFixed(1)} m`, helpKey: 'display' },
            { k: 'ITD', v: `${itdUs(sel.azDeg).toFixed(0)} µs`, helpKey: 'display' },
          ],
          render: (w, h) => (
            // The stage is pinned outside the scroll well — the PanResponder
            // owns the touch outright (no InteractionZone/scroll-lock needed).
            <View style={{ width: w, height: h, alignItems: 'center', justifyContent: 'center' }}>
              <Stage
                size={Math.min(w, h)}
                sources={sources}
                selected={selected}
                onSelect={setSelected}
                onMove={(i, azDeg, dist) => updateSource(i, { azDeg, dist })}
              />
            </View>
          ),
        },
        params: [
          {
            kind: 'fader',
            id: 'az',
            label: 'AZ',
            // Linear lane over the full circle, −180°..+180° (0 = front). The
            // fader and the glass drag stream through the same updateSource,
            // so either route retunes the live bus.
            value: (sel.azDeg + 180) / 360,
            onChange: (v) => updateSource(selected, { azDeg: Math.round(v * 360 - 180) }),
            format: () => `${azSign}${sel.azDeg.toFixed(0)}° ${azWord}`,
            formatShort: () => `${azSign}${sel.azDeg.toFixed(0)}°`,
            tint: SRC_COLORS[selected],
            helpKey: 'display',
          },
          {
            kind: 'fader',
            id: 'dist',
            label: 'DIST',
            value: (sel.dist - MIN_DIST) / (MAX_DIST - MIN_DIST),
            onChange: (v) =>
              updateSource(selected, {
                dist: Math.round((MIN_DIST + v * (MAX_DIST - MIN_DIST)) * 10) / 10,
              }),
            format: () => `${sel.dist.toFixed(1)} m`,
            tint: SRC_COLORS[selected],
            helpKey: 'display',
          },
          {
            kind: 'group',
            id: 'obj',
            label: 'OBJ',
            valueLabel: `${selected + 1} ${sel.on ? '●' : '○'}`,
            helpKey: 'objects',
            render: () => (
              <View style={{ gap: 10 }}>
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
              </View>
            ),
          },
          {
            kind: 'group',
            id: 'src',
            label: 'SRC',
            valueLabel: `${typeLabel}${sel.type === BIN_SRC.sine ? ` ${sel.freq}` : ''}`,
            helpKey: 'source_type',
            render: () => (
              <View style={{ gap: 10 }}>
                <Text style={styles.sectionHead}>SOURCE TYPE</Text>
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
                </View>
                {/* Standing tray-blurb pattern (2026-08-31): the lab's key
                    discrimination — tone vs noise localizability — lived only
                    in LEARN prose. NEW COPY — owner review. */}
                <Text style={styles.caption}>
                  {sel.type === BIN_SRC.sine
                    ? sel.freq <= 440
                      ? 'A smooth low tone is the HARDEST thing to localize — the ITD is ambiguous and the head barely shadows it. Notice how vague it feels.'
                      : 'A higher tone gives the head shadow something to work with — level difference starts carrying the location.'
                    : 'Broadband noise feeds BOTH cues at once — timing at the low end, shadow at the top. The easiest source to place.'}
                </Text>
                {sel.type === BIN_SRC.sine ? (
                  <>
                    <Text style={styles.sectionHead}>TONE FREQUENCY (Hz)</Text>
                    <View style={styles.chipRow}>
                      {TONE_FREQS.map((f) => (
                        <LabChip
                          key={f}
                          label={`${f}`}
                          selected={sel.freq === f}
                          onPress={() => updateSource(selected, { freq: f })}
                          onLongPress={() => openLesson('tone_freq')}
                        />
                      ))}
                    </View>
                  </>
                ) : null}
              </View>
            ),
          },
        ],
      }}
    >
      {!engineReady ? <EngineGate state={gate} /> : null}

      {/* Headphones advisory — non-negotiable visibility, stays at the top of
          the well (the model badge lives on the stage faceplate). */}
      <View style={styles.badgeRow}>
        <Text style={styles.warnBadge}>🎧 HEADPHONES REQUIRED</Text>
      </View>

      {sources.every((src) => !src.on) ? (
        // Every object OFF used to mean PLAY silently mixed silence (fix
        // 2026-08-31). NEW COPY — owner review.
        <Text style={styles.caption}>All three objects are OFF — PLAY would mix silence. Flip one ON in the OBJ tray.</Text>
      ) : null}
      <View style={{ gap: 6 }}>
        <Text style={styles.sectionHead}>THE TWO CUES</Text>
        <Text style={styles.caption}>
          Object {selected + 1}: far-ear delay ≈ {itdUs(sel.azDeg).toFixed(0)} µs · far-ear level{' '}
          {ildDb(sel.azDeg) >= 0.05 ? `−${ildDb(sel.azDeg).toFixed(1)}` : '0.0'} dB + head-shadow
          low-pass — the two cues your brain triangulates with. Behind-the-head is only gently
          hinted (front/back needs HRTF pinna cues this model deliberately doesn't fake).
        </Text>
      </View>

      <View style={{ gap: 6 }}>
        <Text style={styles.sectionHead}>THE MIX, HONESTLY</Text>
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
      </View>

{/* Retrieval (learning pass 2026-08-31) — NEW COPY, owner review. */}
      <CheckQuestion
        spec={{
          question: 'A studio pan-pot and this binaural panner both "move" a sound. What does the pan-pot NOT do?',
          options: [
            'Change the timing between the ears — it only changes level',
            'Change the level between speakers',
            'Work on headphones',
          ],
          correctIdx: 0,
          reveal:
            'A pan-pot is level-only. Binaural rendering adds the inter-ear TIME difference and the head-shadow filtering — the cues that make a sound sit outside your head instead of sliding along a line between your ears.',
          wrongHint: 'THE TWO CUES panel above shows what the pan-pot leaves out.',
        }}
      />
      <CheckQuestion
        spec={{
          question: 'Which source is EASIEST to localize with your eyes closed?',
          options: [
            'Broadband noise — it feeds both cues at once',
            'A 250 Hz sine tone',
            'They are all equal',
          ],
          correctIdx: 0,
          reveal:
            'Noise spans the spectrum: its low end carries the timing cue and its top end casts a real head shadow. A smooth low tone gives the brain almost nothing — which is why finding a humming subwoofer by ear is so hard.',
          wrongHint: 'Flip SRC between TONE 250 and PINK while dragging the object.',
        }}
      />

      <GuidedLessonSheet
        visible={lessonOpen}
        lesson={getLabLesson('binaural')}
        controlKey={lessonKey}
        onClose={() => setLessonOpen(false)}
      />
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

/** The overhead stage: head at center (nose UP = 0° azimuth, +90° right),
 *  distance rings at 1/2/3/4 m, sources draggable. One PanResponder; the grab
 *  picks the nearest source, moves stream angle+radius. Sized by the rack
 *  glass (square of the smaller glass dimension) — pinned, so no scroll-lock
 *  wiring remains. */
function Stage({
  size,
  sources,
  selected,
  onSelect,
  onMove,
}: {
  size: number;
  sources: Source[];
  selected: number;
  onSelect: (i: number) => void;
  onMove: (i: number, azDeg: number, dist: number) => void;
}) {
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
  const dragBase = useRef({ x: 0, y: 0 }); // finger pos at grab — anchored-drag base

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
          dragBase.current = { x, y }; // this fires at touch start (dx=0)
          st.onSelect(best);
          return true;
        }
        return false;
      },
      onPanResponderMove: (_e, g) => {
        const st = stateRef.current;
        const i = dragIdx.current;
        if (i < 0) return;
        // Anchored delta (owner 2026-08-23): base + gestureState reproduces the
        // true finger position without re-basing, so dragging past the pad bounds
        // no longer teleports the source to the far side.
        const x = dragBase.current.x + g.dx;
        const y = dragBase.current.y + g.dy;
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
      },
      onPanResponderTerminate: () => {
        dragIdx.current = -1;
      },
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  return (
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
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sectionHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.5, color: colors.amber },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
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
});
