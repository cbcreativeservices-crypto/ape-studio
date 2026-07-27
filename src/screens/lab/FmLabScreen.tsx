/**
 * FmLabScreen — WAVE-2 expansion lab "FM Synth" (owner 2026-07-26) on the
 * shared LabShell. Carrier + modulator FM with full explanations: ratio places
 * the sidebands (harmonic vs inharmonic), index sets brightness, and an index
 * envelope makes the classic bell/pluck.
 *
 * HERO (lockstep rule): the sideband spectrum is computed from the SAME math
 * the native voice implements — amplitudes J_k(I) at fc ± k·fm (Bessel
 * functions, evaluated exactly here in JS) — so the graph IS the audio's
 * spectrum, not an illustration. Carson bandwidth vs Nyquist is displayed
 * honestly (extreme settings can alias; the graph marks it).
 *
 * AUDIO: engineVersion ≥ 7 (GEN_MODES.fm through the existing generator
 * lifecycle — gate → genSet → genStart; STRIKE retriggers the index-decay
 * envelope click-free). Below v7 the visuals + lessons work fully and the
 * audio states the build requirement (§1.7).
 */
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import { ApeDsp, GEN_MODES } from '../../../modules/ape-dsp';
import { GlassButton } from '../../components/GlassButton';
import { useAudioOutputGate } from '../../features/audio/AudioOutputGate';
import { noteAudioActivity } from '../../features/audio/audioOutputStore';
import { GuidedLessonSheet, getLabLesson, DisplayGuideButton } from '../../features/lab/guidedLessons';
import { EngineGate } from '../tools/EngineGate';
import type { EngineState } from '../../features/tools/engine/useDspEngine';
import { colors, fonts } from '../../theme/tokens';
import { LabShell, LabChip } from './LabShell';

const GEN_LEVEL_DB = -20;
const ACTIVITY_MS = 500;
const NYQUIST = 24000; // display Nyquist (48 kHz engine rate)

const CARRIERS = [110, 220, 440] as const;
const RATIOS = [
  { v: 0.5, label: '0.5' },
  { v: 1, label: '1' },
  { v: 1.41, label: '1.41 ✳' }, // √2 — inharmonic (bell)
  { v: 2, label: '2' },
  { v: 3.5, label: '3.5 ✳' },
  { v: 7, label: '7' },
] as const;
const INDICES = [0, 1, 2, 4, 8] as const;
const ENVS = [
  { key: 'sustain', label: 'SUSTAIN', decaySec: 0 },
  { key: 'pluck', label: 'PLUCK', decaySec: 0.15 },
  { key: 'bell', label: 'BELL', decaySec: 0.6 },
] as const;

/** Bessel function of the first kind J_k(x) — ascending series, exact to
 *  double precision for the lab's range (x ≤ 8, k ≤ ~24). THE same identity
 *  the native voice realizes physically (goldens verify J_k(1) to 4 digits). */
function besselJ(k: number, x: number): number {
  if (x === 0) return k === 0 ? 1 : 0;
  const half = x / 2;
  // term_0 = (x/2)^k / k!
  let term = 1;
  for (let i = 1; i <= k; i++) term *= half / i;
  let sum = term;
  for (let m = 1; m <= 40; m++) {
    term *= -(half * half) / (m * (m + k));
    sum += term;
    if (Math.abs(term) < 1e-15) break;
  }
  return sum;
}

const INTRO =
  'FM synthesis makes complex timbres from just two sine waves: a modulator wiggles the ' +
  'phase of a carrier, spraying energy into sidebands at carrier ± k×modulator. The ratio ' +
  'decides WHERE they land, the index HOW MANY you hear — and an envelope on the index is ' +
  'the classic FM bell.';

export function FmLabScreen() {
  const { requestAudioOutput } = useAudioOutputGate();

  const [gate] = useState<EngineState>(() => {
    if (!ApeDsp.isAvailable()) return 'absent';
    return ApeDsp.engineVersion() >= 2 ? 'idle' : 'spike';
  });
  const engineReady = gate === 'idle';
  const fmReady = engineReady && ApeDsp.wave2Available();

  const [carrier, setCarrier] = useState<number>(220);
  const [ratioIdx, setRatioIdx] = useState(3); // ratio 2
  const [index, setIndex] = useState<number>(2);
  const [envKey, setEnvKey] = useState<(typeof ENVS)[number]['key']>('sustain');
  const [running, setRunning] = useState(false);
  const [genError, setGenError] = useState('');

  const [lessonKey, setLessonKey] = useState<string | undefined>(undefined);
  const [lessonOpen, setLessonOpen] = useState(false);
  const openLesson = useCallback((key?: string) => {
    setLessonKey(key);
    setLessonOpen(true);
  }, []);

  const ratio = RATIOS[ratioIdx].v;
  const env = ENVS.find((e) => e.key === envKey)!;
  const fm = carrier * ratio;
  const carson = 2 * fm * (index + 1);
  const isInt = Math.abs(ratio - Math.round(ratio)) < 1e-9;

  // ---- Audio (generator FM mode; strike = retrigger) -------------------------
  const genRef = useRef(0);

  const pushParams = useCallback(() => {
    ApeDsp.genSet({
      mode: GEN_MODES.fm,
      frequency: carrier,
      fm: { ratio, index, decaySec: env.decaySec },
      levelDb: GEN_LEVEL_DB,
    });
  }, [carrier, ratio, index, env]);

  const strike = useCallback(async () => {
    if (!fmReady) return;
    const gen = ++genRef.current;
    const ok = await requestAudioOutput();
    if (!ok || gen !== genRef.current) return;
    setGenError('');
    pushParams();
    try {
      // genStart on a running tone = the STRIKE (click-free retrigger — the
      // env dip restarts the index-decay envelope).
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
  }, [fmReady, requestAudioOutput, pushParams]);

  const stop = useCallback(() => {
    genRef.current++;
    void ApeDsp.genStop();
    setRunning(false);
  }, []);

  useFocusEffect(useCallback(() => () => stop(), [stop]));
  useEffect(() => {
    if (!running) return;
    const id = setInterval(noteAudioActivity, ACTIVITY_MS);
    return () => clearInterval(id);
  }, [running]);

  // Control changes retarget in place while sounding (index/ratio ramp
  // natively; sustained env follows live — decayed envs need a new STRIKE).
  useEffect(() => {
    if (running) {
      pushParams();
      noteAudioActivity();
    }
  }, [carrier, ratioIdx, index, envKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <LabShell
      labId="fm"
      title="FM SYNTH LAB"
      subtitle="Carrier · Modulator · Ratio · Index · Sidebands"
      intro={INTRO}
      exploreCaption="Pick a ratio and index, watch the Bessel sidebands, then strike the voice — the graph is the exact spectrum of what you hear."
    >
      {!engineReady ? <EngineGate state={gate} /> : null}

      <View style={styles.chipRow}>
        <LabChip label="ⓘ GUIDED LESSON" selected={lessonOpen} onPress={() => openLesson()} />
      </View>
      <Text style={styles.caption}>Long-press a labeled control for its guided lesson.</Text>

      <Text style={styles.sectionHead}>CARRIER</Text>
      <View style={styles.chipRow}>
        {CARRIERS.map((c) => (
          <LabChip
            key={c}
            label={`${c} Hz`}
            selected={carrier === c}
            onPress={() => setCarrier(c)}
            onLongPress={() => openLesson('carrier')}
          />
        ))}
      </View>

      <Text style={styles.sectionHead}>RATIO — fm = ratio × carrier (✳ = inharmonic)</Text>
      <View style={styles.chipRow}>
        {RATIOS.map((r, i) => (
          <LabChip
            key={r.label}
            label={r.label}
            selected={ratioIdx === i}
            onPress={() => setRatioIdx(i)}
            onLongPress={() => openLesson('ratio')}
          />
        ))}
      </View>

      <Text style={styles.sectionHead}>MODULATION INDEX (I)</Text>
      <View style={styles.chipRow}>
        {INDICES.map((v) => (
          <LabChip
            key={v}
            label={String(v)}
            selected={index === v}
            onPress={() => setIndex(v)}
            onLongPress={() => openLesson('index')}
          />
        ))}
      </View>

      <Text style={styles.sectionHead}>INDEX ENVELOPE</Text>
      <View style={styles.chipRow}>
        {ENVS.map((e) => (
          <LabChip
            key={e.key}
            label={e.label}
            selected={envKey === e.key}
            onPress={() => setEnvKey(e.key)}
            onLongPress={() => openLesson('index_env')}
          />
        ))}
      </View>

      {/* HERO — Bessel sideband spectrum (exact JS mirror of the voice math). */}
      <View style={styles.panelCard}>
        <Text style={styles.badge}>
          SIDEBAND SPECTRUM — EXACT BESSEL AMPLITUDES J_k(I) · THE MATH THE VOICE PLAYS
        </Text>
        <SidebandGraph fc={carrier} fm={fm} index={index} />
        <Text style={styles.caption}>
          {index === 0
            ? 'Index 0 — no modulation: the pure carrier alone.'
            : `Sidebands at ${carrier} ± k·${fm.toFixed(0)} Hz, amplitudes |J_k(${index})|. ` +
              (isInt
                ? 'Integer ratio — sidebands land ON a harmonic series (pitched).'
                : 'Non-integer ratio — sidebands fall BETWEEN harmonics (inharmonic: the bell/metallic family).')}
        </Text>
        <Text style={carson > NYQUIST ? styles.advisory : styles.caption}>
          Carson bandwidth ≈ 2·fm·(I+1) = {(carson / 1000).toFixed(1)} kHz
          {carson > NYQUIST
            ? ' — EXCEEDS Nyquist (24 kHz): the top sidebands fold back (audible aliasing — itself a lesson).'
            : ` of ${NYQUIST / 1000} kHz available.`}
        </Text>
        <DisplayGuideButton onPress={() => openLesson('display')} />
      </View>

      {/* AUDIO — engine-gated ≥ v7, honest below. */}
      {engineReady ? (
        fmReady ? (
          <>
            <View style={styles.chipRow}>
              <View style={{ flex: 1 }}>
                <GlassButton
                  label={env.decaySec > 0 ? 'STRIKE' : running ? 'RETUNE' : 'PLAY'}
                  tint="green"
                  height={52}
                  fontSize={15}
                  onPress={() => void strike()}
                />
              </View>
              <View style={{ flex: 1 }}>
                <GlassButton label="STOP" tint="orange" height={52} fontSize={15} onPress={stop} disabled={!running} />
              </View>
            </View>
            <Text style={styles.caption}>
              {env.decaySec > 0
                ? `Each STRIKE restarts the index decay (τ = ${env.decaySec}s): bright attack fading to a pure tone — the FM ${envKey}.`
                : 'Sustained index — controls retarget the running voice live (index and ratio glide natively, click-free).'}{' '}
              Output {GEN_LEVEL_DB} dBFS · uncalibrated.
            </Text>
            {genError ? <Text style={styles.error}>{genError}</Text> : null}
          </>
        ) : (
          <Text style={styles.caption}>
            FM audio needs the v7 engine build — this dev client predates it. The sideband graph and
            lessons are fully functional; install the v7 build to hear the voice.
          </Text>
        )
      ) : null}

      <GuidedLessonSheet
        visible={lessonOpen}
        lesson={getLabLesson('fm')}
        controlKey={lessonKey}
        onClose={() => setLessonOpen(false)}
      />
    </LabShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const G_H = 190;
const PAD = 14;

/** The sideband stick spectrum: |J_k(I)| at fc ± k·fm, k = 0..K where K covers
 *  Carson + 2. Folds (negative frequencies / above-Nyquist) are drawn dashed
 *  at their folded position — honest about aliasing rather than hiding it. */
function SidebandGraph({ fc, fm, index }: { fc: number; fm: number; index: number }) {
  const [w, setW] = useState(0);

  const sticks = useMemo(() => {
    const K = Math.min(24, Math.ceil(index + 2) + 2);
    const out: { f: number; a: number; folded: boolean }[] = [];
    for (let k = 0; k <= K; k++) {
      const a = Math.abs(besselJ(k, index));
      if (a < 0.004) continue;
      const push = (f: number) => {
        let folded = false;
        let ff = f;
        if (ff < 0) {
          ff = -ff;
          folded = true;
        }
        if (ff > NYQUIST) {
          ff = 2 * NYQUIST - ff;
          folded = true;
        }
        if (ff < 0) return; // double-fold — out of teaching range
        out.push({ f: ff, a, folded });
      };
      push(fc + k * fm);
      if (k > 0) push(fc - k * fm);
    }
    return out;
  }, [fc, fm, index]);

  // X range: cover the sticks with margin (log would crowd — linear is the
  // honest picture of equal ±k·fm spacing, WHICH IS the lesson).
  const fMax = Math.max(fc * 2, ...sticks.map((s) => s.f)) * 1.15;

  return (
    <View onLayout={(e) => setW(Math.round(e.nativeEvent.layout.width))}>
      {w > 0 ? (
        <Svg width={w} height={G_H}>
          <Rect x={0} y={0} width={w} height={G_H} fill="#0c0c0f" />
          {/* Baseline + carrier marker. */}
          <Line x1={PAD} y1={G_H - 22} x2={w - PAD} y2={G_H - 22} stroke="#2c2c33" strokeWidth={1.5} />
          {sticks.map((s, i) => {
            const x = PAD + (s.f / fMax) * (w - 2 * PAD);
            const h = s.a * (G_H - 50);
            const isCarrier = Math.abs(s.f - fc) < 1e-6;
            return (
              <Fragment key={i}>
                <Line
                  x1={x}
                  y1={G_H - 22}
                  x2={x}
                  y2={G_H - 22 - h}
                  stroke={s.folded ? '#ff6b5e' : isCarrier ? '#5bff85' : colors.amber}
                  strokeWidth={isCarrier ? 3 : 2}
                  strokeDasharray={s.folded ? '3 3' : undefined}
                />
              </Fragment>
            );
          })}
          <SvgText x={PAD + (fc / fMax) * (w - 2 * PAD)} y={G_H - 8} fill="#5bff85" fontSize={9.5} textAnchor="middle">
            {`fc ${fc}`}
          </SvgText>
          <SvgText x={w - PAD} y={G_H - 8} fill="#4a4a52" fontSize={9.5} textAnchor="end">
            {`${(fMax / 1000).toFixed(1)} kHz`}
          </SvgText>
        </Svg>
      ) : (
        <View style={{ height: G_H }} />
      )}
      <Text style={styles.legend}>
        green = carrier (J₀) · amber = sidebands (J_k) · red dashed = folded (aliased)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sectionHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.5, color: colors.amber },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  advisory: { fontFamily: fonts.barlowMedium, fontSize: 12, lineHeight: 16, color: colors.amber },
  error: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: '#ff6b5e' },
  legend: { fontFamily: fonts.barlowRegular, fontSize: 10.5, color: colors.textSub, marginTop: 4 },
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
