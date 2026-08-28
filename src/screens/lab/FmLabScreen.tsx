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
 *
 * RACK UNIT (APE_LAB_UX_PROPOSAL 2026-08-23, owner-approved): the Bessel
 * spectrum pins on the stage with FC/FM/I/BW on the bezel; the INDEX — the
 * lab's cause→effect dial, continuous in the math (J_k(I)) and ramped
 * natively — rides the pre-bound lane; carrier / ratio / envelope open trays
 * (ratio STICKY: A/B harmonic vs inharmonic while the sticks move IS the
 * lesson); STRIKE is a dock key (retriggers the index-decay envelope, which
 * the header ▶ play/stop can't express). Only the teaching prose scrolls.
 */
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import { ApeDsp, GEN_MODES } from '../../../modules/ape-dsp';
import { useAudioOutputGate } from '../../features/audio/AudioOutputGate';
import { noteAudioActivity } from '../../features/audio/audioOutputStore';
import { GuidedLessonSheet, getLabLesson } from '../../features/lab/guidedLessons';
import { EngineGate } from '../tools/EngineGate';
import type { EngineState } from '../../features/tools/engine/useDspEngine';
import { colors, fonts } from '../../theme/tokens';
import { LabShell, HeaderPlayButton } from './LabShell';

const GEN_LEVEL_DB = -20;
const ACTIVITY_MS = 500;
const NYQUIST = 24000; // display Nyquist (48 kHz engine rate)

const CARRIERS = [110, 220, 440] as const;
// Tray blurbs (owner 2026-08-28): the WHOLE FM lesson lives in this choice —
// integer ratios land the sidebands ON the harmonic series (pitched), while
// irrational ones (✳) land them BETWEEN it (bells, metal).
const RATIOS = [
  { v: 0.5, label: '0.5', blurb: 'Modulator at HALF the carrier: sidebands land an octave down — a sub-octave, still perfectly pitched.' },
  { v: 1, label: '1', blurb: 'Modulator = carrier: sidebands land exactly on the harmonic series. Bright but fully pitched — the vintage FM electric-piano zone.' },
  { v: 1.41, label: '1.41 ✳', blurb: '√2 — irrational, so the sidebands fall BETWEEN the harmonics. Nothing lines up: instant bell / metallic clang.' },
  { v: 2, label: '2', blurb: 'One octave up: only odd-ish partials survive — hollow, square-like, still pitched.' },
  { v: 3.5, label: '3.5 ✳', blurb: 'Another inharmonic ratio: clangorous and gong-like. Compare with 3 or 4 to hear what "in tune with itself" means.' },
  { v: 7, label: '7', blurb: 'A high integer: sidebands spray far up the series — thin, glassy, but still harmonic.' },
] as const;
// INDEX range for the lane (continuous — J_k(I) is exact to I = 8 and the
// native index ramps click-free; the old 0/1/2/4/8 chips were samples of it).
const INDEX_MAX = 8;
const ENVS = [
  { key: 'sustain', label: 'SUSTAIN', decaySec: 0, blurb: 'The index holds steady — the tone keeps its brightness for as long as it sounds.' },
  { key: 'pluck', label: 'PLUCK', decaySec: 0.15, blurb: 'The index decays in ~150 ms: bright attack collapsing to plain — how FM fakes a plucked string.' },
  { key: 'bell', label: 'BELL', decaySec: 0.6, blurb: 'A slow ~0.6 s index decay: a bright strike that dulls as it rings — the classic FM bell.' },
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

  // ── RACK UNIT (APE_LAB_UX_PROPOSAL 2026-08-23) ────────────────────────────
  // Spectrum + FC/FM/I/BW pin on the stage/bezel; INDEX is the pre-bound lane;
  // carrier/ratio/envelope are trays; STRIKE keys the retrigger. Prose scrolls.
  return (
    <LabShell
      labId="fm"
      title="FM SYNTH LAB"
      subtitle="Carrier · Modulator · Ratio · Index · Sidebands"
      intro={INTRO}
      exploreCaption="Pick a ratio and index, watch the Bessel sidebands, then strike the voice — the graph is the exact spectrum of what you hear."
      headerAction={
        <HeaderPlayButton
          playing={running}
          disabled={!fmReady}
          onPress={() => (running ? stop() : void strike())}
          label={running ? 'Stop' : 'Strike the FM voice'}
        />
      }
      rack={{
        initialParam: 'index',
        onHelp: openLesson,
        stage: {
          size: 'L', // the spectrum IS the lab (lockstep hero) — earns the tall glass
          badge: 'SIDEBAND SPECTRUM — EXACT BESSEL AMPLITUDES J_k(I) · THE MATH THE VOICE PLAYS',
          onGuide: () => openLesson('display'),
          bezel: [
            { k: 'FC', v: `${carrier} Hz`, helpKey: 'carrier' },
            { k: 'FM', v: `${fm.toFixed(0)} Hz`, helpKey: 'ratio' },
            { k: 'I', v: index.toFixed(1), helpKey: 'index' },
            {
              k: 'BW',
              v: `${(carson / 1000).toFixed(1)} kHz`,
              // Carson band past Nyquist = folding — the bezel flags it red.
              tint: carson > NYQUIST ? '#ff6b5e' : undefined,
              helpKey: 'display',
            },
          ],
          render: (w, h) => (
            // Tapping the display toggles play/stop (owner 2026-07-31) — same
            // gate as the header button (needs the v7 FM engine).
            <Pressable
              onPress={fmReady ? () => (running ? stop() : void strike()) : undefined}
              accessibilityRole="button"
              accessibilityLabel={running ? 'Tap to stop' : 'Tap to strike the FM voice'}
            >
              <SidebandGraph fc={carrier} fm={fm} index={index} w={w} h={h} />
            </Pressable>
          ),
        },
        params: [
          {
            kind: 'fader',
            id: 'index',
            label: 'INDEX',
            // Linear 0..8 — the Bessel series (and the goldens) cover exactly
            // this range; one decimal keeps the readout (and genSet) calm.
            value: index / INDEX_MAX,
            onChange: (v) => setIndex(Math.round(v * INDEX_MAX * 10) / 10),
            format: () => `I = ${index.toFixed(1)}`,
            formatShort: () => index.toFixed(1),
            helpKey: 'index',
          },
          {
            kind: 'options',
            id: 'carrier',
            label: 'FC',
            valueLabel: `${carrier} Hz`,
            options: CARRIERS.map((c) => ({ id: String(c), label: `${c} Hz` })),
            selectedId: String(carrier),
            onSelect: (id) => setCarrier(Number(id)),
            helpKey: 'carrier',
          },
          {
            kind: 'options',
            id: 'ratio',
            label: 'RATIO',
            valueLabel: RATIOS[ratioIdx].label,
            options: RATIOS.map((r) => ({ id: r.label, label: r.label, blurb: r.blurb })),
            selectedId: RATIOS[ratioIdx].label,
            onSelect: (id) => {
              const i = RATIOS.findIndex((r) => r.label === id);
              if (i >= 0) setRatioIdx(i);
            },
            sticky: true, // A/B harmonic vs inharmonic while the sticks move — the lesson
            helpKey: 'ratio',
          },
          {
            kind: 'options',
            id: 'env',
            label: 'ENV',
            valueLabel: env.label,
            options: ENVS.map((e) => ({ id: e.key, label: e.label, blurb: e.blurb })),
            selectedId: envKey,
            onSelect: (id) => setEnvKey(id as (typeof ENVS)[number]['key']),
            helpKey: 'index_env',
          },
          // STRIKE stays a real key: re-striking a running voice restarts the
          // index-decay envelope, which the header ▶ play/stop can't express.
          { kind: 'action', id: 'strike', label: 'STRIKE', onPress: () => void strike() },
        ],
      }}
    >
      {!engineReady ? <EngineGate state={gate} /> : null}

      <View style={{ gap: 6 }}>
        <Text style={styles.sectionHead}>WHAT YOU’RE SEEING</Text>
        <Text style={styles.caption}>
          {index === 0
            ? 'Index 0 — no modulation: the pure carrier alone.'
            : `Sidebands at ${carrier} ± k·${fm.toFixed(0)} Hz, amplitudes |J_k(${index.toFixed(1)})|. ` +
              (isInt
                ? 'Integer ratio — sidebands land ON a harmonic series (pitched).'
                : 'Non-integer ratio — sidebands fall BETWEEN harmonics (inharmonic: the bell/metallic family). ✳ on a RATIO marks the inharmonic ones.')}
        </Text>
        <Text style={carson > NYQUIST ? styles.advisory : styles.caption}>
          Carson bandwidth ≈ 2·fm·(I+1) = {(carson / 1000).toFixed(1)} kHz
          {carson > NYQUIST
            ? ' — EXCEEDS Nyquist (24 kHz): the top sidebands fold back (audible aliasing — itself a lesson). The BW readout flags it red.'
            : ` of ${NYQUIST / 1000} kHz available.`}
        </Text>
      </View>

      <View style={{ gap: 6 }}>
        <Text style={styles.sectionHead}>THE VOICE</Text>
        {/* AUDIO — engine-gated ≥ v7, honest below. The header ▶ starts/stops;
            STRIKE on the dock is the secondary retrigger. */}
        {engineReady ? (
          fmReady ? (
            <>
              <Text style={styles.caption}>
                {env.decaySec > 0
                  ? `Each STRIKE restarts the index decay (τ = ${env.decaySec}s): bright attack fading to a pure tone — the FM ${envKey}. The header ▶ strikes once and ■ stops.`
                  : 'Sustained index — controls retarget the running voice live (index and ratio glide natively, click-free). The header ▶ starts and ■ stops; STRIKE retriggers.'}{' '}
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
      </View>

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

const PAD = 14;
const LEGEND_H = 18; // color-key strip inside the glass, under the plot

/** The sideband stick spectrum: |J_k(I)| at fc ± k·fm, k = 0..K where K covers
 *  Carson + 2. Folds (negative frequencies / above-Nyquist) are drawn dashed
 *  at their folded position — honest about aliasing rather than hiding it.
 *  Sized by the stage glass (w × h) — never self-measured on the stage. */
function SidebandGraph({ fc, fm, index, w, h }: { fc: number; fm: number; index: number; w: number; h: number }) {
  const gh = h - LEGEND_H;

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
    <View style={{ width: w, height: h }}>
      <Svg width={w} height={gh}>
        <Rect x={0} y={0} width={w} height={gh} fill="#0c0c0f" />
        {/* Baseline + carrier marker. */}
        <Line x1={PAD} y1={gh - 22} x2={w - PAD} y2={gh - 22} stroke="#3a3b46" strokeWidth={1.5} />
        {sticks.map((s, i) => {
          const x = PAD + (s.f / fMax) * (w - 2 * PAD);
          const sh = s.a * (gh - 50);
          const isCarrier = Math.abs(s.f - fc) < 1e-6;
          return (
            <Fragment key={i}>
              <Line
                x1={x}
                y1={gh - 22}
                x2={x}
                y2={gh - 22 - sh}
                stroke={s.folded ? '#ff6b5e' : isCarrier ? '#5bff85' : colors.amber}
                strokeWidth={isCarrier ? 3 : 2}
                strokeDasharray={s.folded ? '3 3' : undefined}
              />
            </Fragment>
          );
        })}
        <SvgText x={PAD + (fc / fMax) * (w - 2 * PAD)} y={gh - 8} fill="#5bff85" fontSize={9.5} textAnchor="middle">
          {`fc ${fc}`}
        </SvgText>
        <SvgText x={w - PAD} y={gh - 8} fill="#4a4a52" fontSize={9.5} textAnchor="end">
          {`${(fMax / 1000).toFixed(1)} kHz`}
        </SvgText>
      </Svg>
      <Text style={styles.legend} numberOfLines={1}>
        green = carrier (J₀) · amber = sidebands (J_k) · red dashed = folded (aliased)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.5, color: colors.amber },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  advisory: { fontFamily: fonts.barlowMedium, fontSize: 12, lineHeight: 16, color: colors.amber },
  error: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: '#ff6b5e' },
  legend: { fontFamily: fonts.barlowRegular, fontSize: 10.5, color: colors.textSub, textAlign: 'center', paddingTop: 2 },
});
