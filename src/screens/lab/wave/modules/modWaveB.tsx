/**
 * wave/modWaveB — Wave Physics Lab modules 9–15 + the Room Builder (§9.16):
 *   9 Loudspeaker Coverage · 10 Line Array · 11 Delay Alignment ·
 *   12 Cardioid Subwoofer · 13 Beam Steering · 14 Echo · 15 Reverberation ·
 *   ◎ Room Builder (the free sandbox every module is a preset of).
 *
 * NO Skia in this file: the room view loads solely through
 * skiaGate.requireWaveViz(); pre-Skia clients render VizUnavailableCard (§1.7)
 * while every readout (pure waveEngine math) keeps working. The SVG timelines
 * (react-native-svg, as fxViz) render on ANY build.
 *
 * CONTRACTS: all numbers come from waveEngine; dragged/slid METERS round to
 * 0.05 (heat-memo stability); ≤8 sources (line array), otherwise ≤4. Every
 * animated panel carries the honesty badge — these are geometric/analytic
 * illustrative models, never a pressure simulation.
 */
import { useMemo, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Line as SvgLine, Rect as SvgRect, Text as SvgText } from 'react-native-svg';
import { colors } from '../../../../theme/tokens';
import { GlassButton } from '../../../../components/GlassButton';
import { DisplayGuideButton } from '../../../../features/lab/guidedLessons';
import { DecayCurveGraph } from '../../../../features/lab/fxViz';
import { LabChip } from '../../LabShell';
import { CheckQuestion, DragSlider, VizUnavailableCard, type CheckSpec } from '../../foundations/bits';
import { Badge, PanelCard, ReadoutGrid, dstyles } from '../../digital/bits';
import { requireWaveViz, type WaveVizModule } from '../skiaGate';
import type { WaveLayers } from '../vizWave';
import {
  MATERIALS, arrayPositions, arrivalsAt, directivityGain, responseAt, sabineRT, speedOfSound,
  type Arrival, type MaterialKey, type WaveScene, type WaveSource,
} from '../waveEngine';
import type { WaveModuleProps } from '../WaveModuleScreen';

// ─────────────────────────────────────────────────────────────────── helpers ──

const MODEL_BADGE = 'ILLUSTRATIVE MODEL — GEOMETRIC/ANALYTIC, NOT A PRESSURE SIMULATION';
const TEMP_C = 20;

/** Contract: every dragged/slid METER rounds to 0.05 (heat-memo stability). */
const roundM = (v: number) => Math.round(v * 20) / 20;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const logMap = (v: number, lo: number, hi: number) => Math.round(lo * Math.pow(hi / lo, clamp(v, 0, 1)));
const logPos = (f: number, lo: number, hi: number) => Math.log(f / lo) / Math.log(hi / lo);
const fmtHz = (f: number) => (f >= 1000 ? `${Number((f / 1000).toFixed(2))} kHz` : `${Math.round(f)} Hz`);

/** Clamp+round a dragged point into the room, keeping 0.3 m off the walls. */
function dragPoint(scene: { w: number; h: number }, x: number, y: number): { x: number; y: number } {
  return { x: roundM(clamp(x, 0.3, scene.w - 0.3)), y: roundM(clamp(y, 0.3, scene.h - 0.3)) };
}

/** Effective coverage (deg, −6 dB points) at a frequency — backsolved by
 *  probing the REAL engine directivityGain outward from the aim axis. */
function coverageAtFreq(src: WaveSource, freq: number): number {
  const target = Math.pow(10, -6 / 20);
  const aim = ((src.aimDeg ?? 0) * Math.PI) / 180;
  for (let deg = 0; deg <= 180; deg++) {
    const a = aim + (deg * Math.PI) / 180;
    if (directivityGain(src, Math.sin(a), Math.cos(a), freq) < target) return deg * 2;
  }
  return 360; // never falls 6 dB — effectively omnidirectional at this frequency
}

// ───────────────────────────────────────────────────────── shared components ──

/** Hosts the phase clock next to the Skia view — only rendered when viz ≠ null,
 *  so no conditional hooks ever run in the module bodies. */
function SceneHero({
  viz, scene, width, focused, freq, layers, visHz = 0.6, selectedId, onSelect, onDragSource, onDragListener,
}: {
  viz: WaveVizModule;
  scene: WaveScene;
  width: number;
  focused: boolean;
  freq: number;
  layers: WaveLayers;
  visHz?: number;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  onDragSource?: (id: string, x: number, y: number) => void;
  onDragListener?: (x: number, y: number) => void;
}) {
  const phase = viz.usePhaseClock(focused, visHz);
  const height = Math.max(150, Math.min(300, Math.round((width * scene.h) / scene.w)));
  return (
    <viz.RoomSceneView
      scene={scene}
      width={width}
      height={height}
      freq={freq}
      layers={layers}
      phase={phase}
      selectedId={selectedId}
      onSelect={onSelect}
      onDragSource={onDragSource}
      onDragListener={onDragListener}
    />
  );
}

const LAYER_KEYS = ['pressure', 'heat', 'rays', 'arrivals'] as const;

function LayerChips({ layers, onLayers, help }: { layers: WaveLayers; onLayers: (l: WaveLayers) => void; help: (k?: string) => void }) {
  return (
    <View style={dstyles.chipRow}>
      {LAYER_KEYS.map((k) => (
        <LabChip
          key={k}
          label={k.toUpperCase()}
          selected={layers[k]}
          onPress={() => onLayers({ ...layers, [k]: !layers[k] })}
          onLongPress={() => help(k === 'arrivals' ? 'arrivals' : 'layers')}
        />
      ))}
    </View>
  );
}

/** Each module's spec Common Mistakes (v4 MASTER §9), embedded faithfully. */
function Mistakes({ items }: { items: string[] }) {
  return (
    <PanelCard>
      <Text style={dstyles.eyebrow}>COMMON MISTAKES</Text>
      {items.map((m, i) => (
        <Text key={i} style={dstyles.body}>• {m}</Text>
      ))}
    </PanelCard>
  );
}

/** SVG echo/ETC timeline: arrivalsAt stems on a ms axis (any build — no Skia).
 *  First stem = direct; within thresholdMs of it = fused (amber); later = echo
 *  (red). Heights span a 40 dB window under the direct arrival. */
function ArrivalTimeline({ arrivals, thresholdMs = 50 }: { arrivals: Arrival[]; thresholdMs?: number }) {
  if (arrivals.length === 0) return null;
  const W = 340;
  const H = 132;
  const padL = 10;
  const padB = 16;
  const t0 = arrivals[0].t * 1000;
  const lastMs = arrivals[arrivals.length - 1].t * 1000 - t0;
  const span = Math.max(lastMs * 1.12, thresholdMs * 1.6, 20);
  const topDb = arrivals[0].levelDb;
  const xAt = (ms: number) => padL + (ms / span) * (W - padL - 12);
  const hOf = (db: number) => Math.max(3, (1 - clamp(topDb - db, 0, 40) / 40) * (H - padB - 10));
  const base = H - padB;
  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
      <SvgRect x={0} y={0} width={W} height={base} fill="#0f0f13" />
      <SvgLine x1={0} y1={base} x2={W} y2={base} stroke="#232329" strokeWidth={1} />
      <SvgLine x1={xAt(thresholdMs)} y1={6} x2={xAt(thresholdMs)} y2={base} stroke="rgba(255,198,77,.4)" strokeWidth={1} strokeDasharray="4 3" />
      {arrivals.map((a, i) => {
        const ms = a.t * 1000 - t0;
        const echo = ms >= thresholdMs;
        const fill = i === 0 ? '#c8c8d0' : echo ? '#ff6b5e' : '#ffc64d';
        return <SvgRect key={i} x={xAt(ms) - 1.5} y={base - hOf(a.levelDb)} width={3} height={hOf(a.levelDb)} fill={fill} opacity={0.95} />;
      })}
      <SvgText x={xAt(0)} y={H - 4} fill={colors.textSub} fontSize={8} textAnchor="start">direct</SvgText>
      <SvgText x={xAt(thresholdMs)} y={H - 4} fill={colors.amber} fontSize={8} textAnchor="middle">{`${thresholdMs} ms`}</SvgText>
      <SvgText x={W - 4} y={H - 4} fill={colors.textSub} fontSize={8} textAnchor="end">{`${Math.round(span)} ms`}</SvgText>
    </Svg>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 9 — LOUDSPEAKER COVERAGE

const COVERAGE_CHIPS = [40, 60, 90, 120];

const COVERAGE_CHECK: CheckSpec = {
  question: 'A 90° box is aimed at the mix position. At 8 kHz the balcony is dull; at 250 Hz the whole room is even. What is going on?',
  options: [
    'The speaker is broken above 4 kHz',
    'Directivity narrows with frequency — 90° is nominal; the tighter HF beam is what needed aiming',
    'The audience is absorbing only the low frequencies',
    'The balcony needs more level, not a different aim',
  ],
  correctIdx: 1,
  reveal:
    'Coverage is frequency-dependent: lows spill nearly omnidirectionally while highs beam. Sweep ' +
    'the FREQUENCY slider and watch the heat pattern widen at LF and tighten at HF — you aim the ' +
    'HF pattern at the audience, not the cabinet at the room.',
  wrongHint: 'Sweep the FREQUENCY slider and watch the drawn pattern width change.',
};

export function CoverageModule(p: WaveModuleProps) {
  const viz = useState(() => requireWaveViz())[0];
  const [aimV, setAimV] = useState(0.5);
  const [cov, setCov] = useState(90);
  const [freqV, setFreqV] = useState(() => logPos(2000, 80, 8000));
  const [layers, setLayers] = useState<WaveLayers>({ pressure: false, heat: true, rays: false, arrivals: false });
  const [listener, setListener] = useState({ x: 7, y: 7 });

  const aim = Math.round(-60 + aimV * 120);
  const freq = logMap(freqV, 80, 8000);
  const scene = useMemo<WaveScene>(
    () => ({
      w: 14,
      h: 10,
      boundary: ['drywall', 'drywall', 'drywall', 'drywall'],
      sources: [{ id: 'spk', x: 7, y: 1, freq, levelDb: 0, delayMs: 0, polarity: 1, kind: 'speaker', aimDeg: aim, coverageDeg: cov }],
      listener,
      tempC: TEMP_C,
    }),
    [freq, aim, cov, listener],
  );

  const eff = coverageAtFreq(scene.sources[0], freq);
  const lvl = responseAt(scene, listener.x, listener.y, freq);
  const lambda = speedOfSound(TEMP_C) / freq;

  return (
    <View style={{ gap: 12 }}>
      <PanelCard>
        {viz ? (
          <SceneHero
            viz={viz}
            scene={scene}
            width={p.width}
            focused={p.focused}
            freq={freq}
            layers={layers}
            onDragListener={(x, y) => setListener(dragPoint(scene, x, y))}
          />
        ) : (
          <VizUnavailableCard />
        )}
        <Badge text={MODEL_BADGE} />
        <DisplayGuideButton onPress={() => p.help('coverage_pattern')} />
        <LayerChips layers={layers} onLayers={setLayers} help={p.help} />
        <View style={dstyles.chipRow}>
          {COVERAGE_CHIPS.map((c) => (
            <LabChip key={c} label={`${c}°`} selected={cov === c} onPress={() => setCov(c)} onLongPress={() => p.help('coverage_pattern')} />
          ))}
        </View>
        <DragSlider value={aimV} onChange={setAimV} label="AIM" readout={`${aim}°`} onHelp={() => p.help('coverage_pattern')} />
        <DragSlider
          value={freqV}
          onChange={setFreqV}
          label="FREQUENCY — WATCH THE PATTERN WIDTH"
          readout={fmtHz(freq)}
          onHelp={() => p.help('coverage_pattern')}
        />
        <ReadoutGrid
          help={p.help}
          helpKey="coverage_pattern"
          items={[
            { k: 'NOMINAL COVERAGE', v: `${cov}°` },
            { k: `EFFECTIVE @ ${fmtHz(freq)}`, v: eff >= 360 ? '≈360° (omni)' : `${eff}°` },
            { k: 'WAVELENGTH', v: `${lambda.toFixed(2)} m` },
            { k: 'LEVEL @ LISTENER', v: `${lvl.toFixed(1)} dB` },
          ]}
        />
        <Badge text="EFFECTIVE COVERAGE = −6 dB POINTS PROBED FROM THE ENGINE'S DIRECTIVITY MODEL (NOMINAL AT 1 kHz — WIDER LOW, NARROWER HIGH)" />
        <Text style={dstyles.caption}>
          Drag the listener off-axis and sweep the frequency: on-axis it barely changes, off-axis the highs fall away first. Aim the HF pattern, not the cabinet.
        </Text>
      </PanelCard>
      <Mistakes
        items={[
          'Thinking a speaker radiates evenly — directivity NARROWS with frequency.',
          'Confusing on-axis response with off-axis (coverage) response.',
          'Ignoring that lows are nearly omnidirectional.',
          'Aiming by the cabinet rather than the HF pattern.',
        ]}
      />
      <CheckQuestion spec={COVERAGE_CHECK} />
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 10 — LINE ARRAY

const ARRAY_BOX_H = 0.5;
const ARRAY_COVERAGE = 30;

const LINEARRAY_CHECK: CheckSpec = {
  question: 'Four 0.5 m boxes ≈ a 2 m array. Down to roughly what frequency can it CONTROL its vertical coverage?',
  options: [
    'All the way to 40 Hz — arrays handle subs too',
    'Roughly 170 Hz — where the wavelength equals the 2 m array length',
    '2 kHz — arrays only control highs',
    'Any frequency, with good enough DSP',
  ],
  correctIdx: 1,
  reveal:
    'Pattern control needs array LENGTH ≥ wavelength: λ = c/f, so 2 m ≈ 172 Hz. Below that the ' +
    'array behaves like one small source and the lows spill everywhere — length controls the lows, ' +
    'splay shapes the coverage.',
  wrongHint: 'Compare the array length readout to the wavelength readout.',
};

export function LineArrayModule(p: WaveModuleProps) {
  const viz = useState(() => requireWaveViz())[0];
  const [nV, setNV] = useState((4 - 2) / 6);
  const [splayV, setSplayV] = useState(0.5);
  const [hangV, setHangV] = useState(0.2);
  const [freqV, setFreqV] = useState(() => logPos(1000, 60, 8000));
  const [layers, setLayers] = useState<WaveLayers>({ pressure: false, heat: true, rays: false, arrivals: false });
  const [listener, setListener] = useState({ x: 14, y: 7.5 });

  const n = Math.round(2 + nV * 6); // 2..8 boxes (≤ 8 sources contract)
  const splay = Math.round(splayV * 16) / 2; // 0..8° in 0.5° steps
  const yTop = roundM(0.4 + hangV * 2.6); // hang depth 0.4..3.0 m
  const freq = logMap(freqV, 60, 8000);

  const positions = useMemo(() => arrayPositions(1.0, yTop, n, ARRAY_BOX_H, splay), [yTop, n, splay]);
  const scene = useMemo<WaveScene>(
    () => ({
      w: 20,
      h: 9,
      // SECTION view: open sky/sides, an audience "floor" along the bottom.
      boundary: ['open', 'open', 'audience', 'open'],
      sources: positions.map((pos, i) => ({
        id: `box${i}`,
        x: roundM(pos.x),
        y: roundM(pos.y),
        freq,
        levelDb: 0,
        delayMs: 0,
        polarity: 1 as const,
        kind: 'speaker' as const,
        aimDeg: 90 - pos.aimDeg, // 90° = straight down-field; splay tilts each box toward the floor
        coverageDeg: ARRAY_COVERAGE,
      })),
      listener,
      tempC: TEMP_C,
    }),
    [positions, freq, listener],
  );

  const arrayLen = positions.length > 1 ? positions[positions.length - 1].y - positions[0].y + ARRAY_BOX_H : ARRAY_BOX_H;
  const lambda = speedOfSound(TEMP_C) / freq;
  const lvl = responseAt(scene, listener.x, listener.y, freq);

  return (
    <View style={{ gap: 12 }}>
      <PanelCard>
        {viz ? (
          <SceneHero
            viz={viz}
            scene={scene}
            width={p.width}
            focused={p.focused}
            freq={freq}
            layers={layers}
            onDragListener={(x, y) => setListener(dragPoint(scene, x, y))}
          />
        ) : (
          <VizUnavailableCard />
        )}
        <Badge text={MODEL_BADGE} />
        <DisplayGuideButton onPress={() => p.help('line_array')} />
        <Text style={dstyles.caption}>
          SECTION VIEW — x is distance into the venue, y is height (audience floor along the bottom). Drag the listener to a seat.
        </Text>
        <LayerChips layers={layers} onLayers={setLayers} help={p.help} />
        <DragSlider value={nV} onChange={setNV} label="BOXES" readout={`${n}`} onHelp={() => p.help('line_array')} />
        <DragSlider value={splayV} onChange={setSplayV} label="SPLAY (PER BOX)" readout={`${splay.toFixed(1)}°`} onHelp={() => p.help('line_array')} />
        <DragSlider value={hangV} onChange={setHangV} label="HEIGHT (HANG DEPTH)" readout={`${yTop.toFixed(2)} m`} onHelp={() => p.help('line_array')} />
        <DragSlider
          value={freqV}
          onChange={setFreqV}
          label="FREQUENCY — LF COUPLES · HF BEAMS"
          readout={fmtHz(freq)}
          onHelp={() => p.help('line_array')}
        />
        <ReadoutGrid
          help={p.help}
          helpKey="line_array"
          items={[
            { k: 'BOXES', v: `${n}` },
            { k: 'ARRAY LENGTH', v: `${arrayLen.toFixed(2)} m` },
            { k: 'WAVELENGTH', v: `${lambda.toFixed(2)} m` },
            { k: 'LF CONTROL', v: arrayLen >= lambda ? 'YES (len ≥ λ)' : 'NO (len < λ)' },
            { k: 'LEVEL @ LISTENER', v: `${lvl.toFixed(1)} dB` },
          ]}
        />
        <Badge text="EACH BOX = ONE 30°-NOMINAL SOURCE FROM arrayPositions — HEAT SHOWS THE BOXES COUPLING AT LF AND BEAMING AT HF" />
      </PanelCard>
      <Mistakes
        items={[
          'Thinking stacking just makes it louder — splay/geometry SHAPES coverage; wrong splay = gaps or lobes.',
          'Ignoring frequency dependence: the array couples at LF and beams at HF.',
          'Expecting a short array to control lows — it needs length ≥ wavelength.',
          'Over- or under-splaying → coverage holes.',
        ]}
      />
      <CheckQuestion spec={LINEARRAY_CHECK} />
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 11 — DELAY ALIGNMENT

const ALIGN_SUB = { x: 3, y: 0.8 };
const ALIGN_MAIN = { x: 8.5, y: 1.2 };

const ALIGN_CHECK: CheckSpec = {
  question: 'You set the sub/main delay from a tape measure (3.4 m ⇒ ~10 ms) but the crossover null is still there. Most likely culprit?',
  options: [
    'The tape measure was metric',
    'Processing latency in the main’s DSP chain — invisible to any tape measure',
    'The sub simply needs more level',
    'Polarity must always be flipped along with delay',
  ],
  correctIdx: 1,
  reveal:
    'A tape measures DISTANCE; alignment is about TIME. Amp and DSP latency add milliseconds no ' +
    'tape can see — so you verify by measurement: watch the null close in HEAT, then drag the ' +
    'listener to check that the fix holds at more than one seat.',
  wrongHint: 'What does a tape measure fundamentally not know about the signal chain?',
};

export function DelayAlignModule(p: WaveModuleProps) {
  const viz = useState(() => requireWaveViz())[0];
  const [freqV, setFreqV] = useState(0.5); // 80..120 Hz
  const [delayV, setDelayV] = useState(0); // 0..20 ms on the main
  const [mainInv, setMainInv] = useState(false);
  const [layers, setLayers] = useState<WaveLayers>({ pressure: false, heat: true, rays: false, arrivals: false });
  const [listener, setListener] = useState({ x: 8, y: 6 });

  const freq = Math.round(80 + freqV * 40);
  const delayMs = Math.round(delayV * 20 * 20) / 20; // 0..20 ms in 0.05 ms steps

  const scene = useMemo<WaveScene>(
    () => ({
      w: 16,
      h: 10,
      boundary: ['drywall', 'drywall', 'drywall', 'drywall'],
      sources: [
        { id: 'sub', x: ALIGN_SUB.x, y: ALIGN_SUB.y, freq, levelDb: 0, delayMs: 0, polarity: 1, kind: 'sub' },
        { id: 'main', x: ALIGN_MAIN.x, y: ALIGN_MAIN.y, freq, levelDb: 0, delayMs, polarity: mainInv ? -1 : 1, kind: 'speaker', aimDeg: 0, coverageDeg: 90 },
      ],
      listener,
      tempC: TEMP_C,
    }),
    [freq, delayMs, mainInv, listener],
  );

  const c = speedOfSound(TEMP_C);
  const dSub = Math.hypot(listener.x - ALIGN_SUB.x, listener.y - ALIGN_SUB.y);
  const dMain = Math.hypot(listener.x - ALIGN_MAIN.x, listener.y - ALIGN_MAIN.y);
  const reqDelay = ((dSub - dMain) / c) * 1000; // ms the MAIN must wait to land with the sub
  const mismatch = delayMs - reqDelay;
  const lvl = responseAt(scene, listener.x, listener.y, freq);

  return (
    <View style={{ gap: 12 }}>
      <PanelCard>
        {viz ? (
          <SceneHero
            viz={viz}
            scene={scene}
            width={p.width}
            focused={p.focused}
            freq={freq}
            layers={layers}
            onDragListener={(x, y) => setListener(dragPoint(scene, x, y))}
          />
        ) : (
          <VizUnavailableCard />
        )}
        <Badge text={MODEL_BADGE} />
        <DisplayGuideButton onPress={() => p.help('delay_align')} />
        <LayerChips layers={layers} onLayers={setLayers} help={p.help} />
        <DragSlider
          value={freqV}
          onChange={setFreqV}
          label="CROSSOVER REGION"
          readout={`${freq} Hz`}
          onHelp={() => p.help('interference')}
        />
        <DragSlider
          value={delayV}
          onChange={setDelayV}
          label="MAIN DELAY"
          readout={`${delayMs.toFixed(2)} ms`}
          onHelp={() => p.help('delay_align')}
        />
        <View style={dstyles.chipRow}>
          <LabChip
            label="MAIN POLARITY Ø (THE WRONG TOOL)"
            selected={mainInv}
            onPress={() => setMainInv(!mainInv)}
            onLongPress={() => p.help('delay_align')}
          />
        </View>
        <GlassButton
          label={`AUTO-ALIGN — SET ${Math.max(0, Math.min(20, reqDelay)).toFixed(2)} ms`}
          tint="gold"
          height={46}
          fontSize={13.5}
          onPress={() => setDelayV(clamp(reqDelay, 0, 20) / 20)}
        />
        {reqDelay < 0 ? (
          <Text style={dstyles.caption}>
            Here the listener is closer to the SUB than the main — the sub would need the delay. Drag the listener down-field (or AUTO-ALIGN sets 0).
          </Text>
        ) : null}
        <ReadoutGrid
          help={p.help}
          helpKey="delay_align"
          items={[
            { k: 'PATH — SUB', v: `${dSub.toFixed(2)} m` },
            { k: 'PATH — MAIN', v: `${dMain.toFixed(2)} m` },
            { k: 'PATH Δ', v: `${(dSub - dMain).toFixed(2)} m` },
            { k: 'REQUIRED DELAY', v: `${reqDelay.toFixed(2)} ms` },
            { k: 'CURRENT DELAY', v: `${delayMs.toFixed(2)} ms` },
            { k: 'MISMATCH', v: `${mismatch >= 0 ? '+' : ''}${mismatch.toFixed(2)} ms` },
            { k: 'LEVEL @ LISTENER', v: `${lvl.toFixed(1)} dB` },
          ]}
        />
        <Text style={dstyles.caption}>
          Watch the null through the room close in HEAT as the mismatch approaches 0 — then DRAG THE LISTENER: an alignment that only works at one seat is not an alignment.
        </Text>
      </PanelCard>
      <Mistakes
        items={[
          'Aligning by tape-measure distance only — it ignores processing/acoustic delay.',
          'Flipping polarity instead of time-aligning (or vice versa).',
          'Aligning at one point/frequency and assuming it holds everywhere.',
          'Aligning for the mic at the console instead of the audience.',
        ]}
      />
      <CheckQuestion spec={ALIGN_CHECK} />
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 12 — CARDIOID SUBWOOFER

const CSUB_SPACING = 1.2; // m front↔rear
const CSUB_REAR = { x: 7, y: 4.0 };
const CSUB_FRONT = { x: 7, y: 4.0 + CSUB_SPACING };
const CSUB_REAR_PROBE = { x: 7, y: 1.0 }; // fixed, 3 m behind the stack

const CSUB_CHECK: CheckSpec = {
  question: 'Can a single subwoofer be made cardioid with clever DSP?',
  options: [
    'Yes — an all-pass filter rotates its pattern',
    'No — a cardioid needs at least two sources with a time/polarity offset',
    'Yes — just invert its polarity',
    'Only above 100 Hz',
  ],
  correctIdx: 1,
  reveal:
    'Directivity comes from INTERFERENCE between separated sources. One omni sub has nothing to ' +
    'interfere with; two subs with the right spacing, delay and polarity create the forward ' +
    'addition and rear cancellation you see in the HEAT map.',
  wrongHint: 'What physical mechanism creates the rear null in this module?',
};

export function CardioidSubModule(p: WaveModuleProps) {
  const viz = useState(() => requireWaveViz())[0];
  const [freqV, setFreqV] = useState(logPos(63, 40, 120));
  const [delayV, setDelayV] = useState(0); // rear delay 0..8 ms
  const [rearInv, setRearInv] = useState(false);
  const [layers, setLayers] = useState<WaveLayers>({ pressure: false, heat: true, rays: false, arrivals: false });
  const [listener, setListener] = useState({ x: 7, y: 8.2 }); // the FRONT probe — drag it

  const freq = logMap(freqV, 40, 120);
  const rearDelayMs = Math.round(delayV * 8 * 100) / 100; // 0..8 ms, 0.01 ms steps
  const c = speedOfSound(TEMP_C);
  const correctDelayMs = (CSUB_SPACING / c) * 1000;

  const scene = useMemo<WaveScene>(
    () => ({
      w: 14,
      h: 10,
      // Free field (outdoor stack): open boundaries kill every image source, so
      // the HEAT map is the pure two-source pattern.
      boundary: ['open', 'open', 'open', 'open'],
      sources: [
        { id: 'rear', x: CSUB_REAR.x, y: CSUB_REAR.y, freq, levelDb: 0, delayMs: rearDelayMs, polarity: rearInv ? -1 : 1, kind: 'sub' },
        { id: 'front', x: CSUB_FRONT.x, y: CSUB_FRONT.y, freq, levelDb: 0, delayMs: 0, polarity: 1, kind: 'sub' },
      ],
      listener,
      tempC: TEMP_C,
    }),
    [freq, rearDelayMs, rearInv, listener],
  );

  const frontDb = responseAt(scene, listener.x, listener.y, freq);
  const rearDb = responseAt(scene, CSUB_REAR_PROBE.x, CSUB_REAR_PROBE.y, freq);
  const setPreset = (inverted: boolean) => {
    setDelayV(clamp(correctDelayMs, 0, 8) / 8);
    setRearInv(inverted);
  };
  const isCardioid = Math.abs(rearDelayMs - correctDelayMs) < 0.05 && rearInv;
  const isWrongWay = Math.abs(rearDelayMs - correctDelayMs) < 0.05 && !rearInv;

  return (
    <View style={{ gap: 12 }}>
      <PanelCard>
        {viz ? (
          <SceneHero
            viz={viz}
            scene={scene}
            width={p.width}
            focused={p.focused}
            freq={freq}
            layers={layers}
            onDragListener={(x, y) => setListener(dragPoint(scene, x, y))}
          />
        ) : (
          <VizUnavailableCard />
        )}
        <Badge text={MODEL_BADGE} />
        <DisplayGuideButton onPress={() => p.help('cardioid_sub')} />
        <Text style={dstyles.caption}>
          Two subs 1.2 m apart, audience toward the bottom. The listener is the FRONT probe (drag it); the REAR probe sits fixed 3 m behind the stack.
        </Text>
        <LayerChips layers={layers} onLayers={setLayers} help={p.help} />
        <View style={dstyles.chipRow}>
          <LabChip label="CARDIOID" selected={isCardioid} onPress={() => setPreset(true)} onLongPress={() => p.help('cardioid_sub')} />
          <LabChip label="WRONG WAY" selected={isWrongWay} onPress={() => setPreset(false)} onLongPress={() => p.help('cardioid_sub')} />
        </View>
        <Badge text="CARDIOID = REAR DELAYED BY SPACING/c AND POLARITY-INVERTED → BROADBAND REAR CANCEL · WRONG WAY = SAME DELAY, POLARITY NORMAL → THE NULL FLIPS TOWARD THE AUDIENCE (DEEPEST NEAR c/4d ≈ 71 Hz)" />
        <DragSlider value={freqV} onChange={setFreqV} label="FREQUENCY" readout={`${freq} Hz`} onHelp={() => p.help('cardioid_sub')} />
        <DragSlider
          value={delayV}
          onChange={setDelayV}
          label="REAR DELAY"
          readout={`${rearDelayMs.toFixed(2)} ms`}
          onHelp={() => p.help('cardioid_sub')}
        />
        <View style={dstyles.chipRow}>
          <LabChip
            label="REAR POLARITY Ø INVERT"
            selected={rearInv}
            onPress={() => setRearInv(!rearInv)}
            onLongPress={() => p.help('cardioid_sub')}
          />
        </View>
        <ReadoutGrid
          help={p.help}
          helpKey="cardioid_sub"
          items={[
            { k: 'SPACING', v: `${CSUB_SPACING.toFixed(2)} m` },
            { k: 'CORRECT DELAY', v: `${correctDelayMs.toFixed(2)} ms` },
            { k: 'REAR DELAY', v: `${rearDelayMs.toFixed(2)} ms` },
            { k: 'REAR POLARITY', v: rearInv ? 'INVERTED' : 'NORMAL' },
            { k: 'FRONT PROBE', v: `${frontDb.toFixed(1)} dB` },
            { k: 'REAR PROBE', v: `${rearDb.toFixed(1)} dB` },
            { k: 'FRONT − REAR', v: `${(frontDb - rearDb).toFixed(1)} dB` },
          ]}
        />
        <Text style={dstyles.caption}>
          Set CARDIOID and sweep the frequency: the rear stays cancelled across the band while the front rides up and down a little — spacing sets those limits. Set WRONG WAY near 71 Hz and watch the null land on the audience.
        </Text>
      </PanelCard>
      <Mistakes
        items={[
          'Wrong delay/polarity/spacing cancels in the WRONG direction — a front null instead of a rear null.',
          'Thinking one sub can be cardioid — it needs ≥2 sources with a time/polarity offset.',
          'Ignoring the frequency limits set by the spacing.',
          'Expecting perfect rear rejection everywhere — it is band- and geometry-limited.',
        ]}
      />
      <CheckQuestion spec={CSUB_CHECK} />
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 13 — BEAM STEERING

const STEER_SPACING = 2.0; // m between boxes
const STEER_N_CHIPS = [4, 5, 6];

const STEER_CHECK: CheckSpec = {
  question: 'You need the sub array’s beam aimed 20° toward the far corner. What does it?',
  options: [
    'Physically tilt every cabinet 20°',
    'Progressive per-box delays — a few hundred microseconds each',
    'Invert polarity on half of the boxes',
    'A high-shelf EQ on the outer boxes',
  ],
  correctIdx: 1,
  reveal:
    'A linear delay gradient across the array tilts its wavefront: Δt = d·sin θ / c per box. The ' +
    'boxes never move — DSP steers the beam. Over-steer past ~40° and grating lobes spray energy ' +
    'where you never asked (try it and watch HEAT).',
  wrongHint: 'The whole point of this module: the energy moves, the boxes do not.',
};

export function BeamSteerModule(p: WaveModuleProps) {
  const viz = useState(() => requireWaveViz())[0];
  const [n, setN] = useState(5);
  const [steerV, setSteerV] = useState(0.5); // −60..+60°
  const [freqV, setFreqV] = useState(logPos(80, 40, 120));
  const [layers, setLayers] = useState<WaveLayers>({ pressure: false, heat: true, rays: false, arrivals: false });
  const [listener, setListener] = useState({ x: 12, y: 10 });

  const steer = Math.round(-60 + steerV * 120);
  const freq = logMap(freqV, 40, 120);
  const c = speedOfSound(TEMP_C);
  const dtPerBoxMs = ((STEER_SPACING * Math.sin((steer * Math.PI) / 180)) / c) * 1000;

  const scene = useMemo<WaveScene>(() => {
    const x0 = 12 - ((n - 1) * STEER_SPACING) / 2;
    const raw = Array.from({ length: n }, (_, i) => i * dtPerBoxMs);
    const minD = Math.min(...raw);
    return {
      w: 24,
      h: 14,
      boundary: ['open', 'open', 'open', 'open'], // free field: the pure array pattern
      sources: raw.map((d, i) => ({
        id: `sub${i}`,
        x: roundM(x0 + i * STEER_SPACING),
        y: 2,
        freq,
        levelDb: 0,
        delayMs: Math.round((d - minD) * 200) / 200, // 5 µs steps
        polarity: 1 as const,
        kind: 'sub' as const,
      })),
      listener,
      tempC: TEMP_C,
    };
  }, [n, dtPerBoxMs, freq, listener]);

  const lambda = c / freq;
  const grating = lambda < STEER_SPACING * (1 + Math.abs(Math.sin((steer * Math.PI) / 180)));
  const lvl = responseAt(scene, listener.x, listener.y, freq);

  return (
    <View style={{ gap: 12 }}>
      <PanelCard>
        {viz ? (
          <SceneHero
            viz={viz}
            scene={scene}
            width={p.width}
            focused={p.focused}
            freq={freq}
            layers={layers}
            onDragListener={(x, y) => setListener(dragPoint(scene, x, y))}
          />
        ) : (
          <VizUnavailableCard />
        )}
        <Badge text={MODEL_BADGE} />
        <DisplayGuideButton onPress={() => p.help('beam_steer')} />
        <LayerChips layers={layers} onLayers={setLayers} help={p.help} />
        <View style={dstyles.chipRow}>
          {STEER_N_CHIPS.map((k) => (
            <LabChip key={k} label={`${k} BOXES`} selected={n === k} onPress={() => setN(k)} onLongPress={() => p.help('beam_steer')} />
          ))}
        </View>
        <DragSlider value={steerV} onChange={setSteerV} label="STEER" readout={`${steer}°`} onHelp={() => p.help('beam_steer')} />
        <DragSlider value={freqV} onChange={setFreqV} label="FREQUENCY" readout={`${freq} Hz`} onHelp={() => p.help('beam_steer')} />
        <ReadoutGrid
          help={p.help}
          helpKey="beam_steer"
          items={[
            { k: 'STEER ANGLE', v: `${steer}°` },
            { k: 'PER-BOX Δt', v: `${Math.round(Math.abs(dtPerBoxMs) * 1000)} µs` },
            { k: 'TOTAL Δt', v: `${(Math.abs(dtPerBoxMs) * (n - 1)).toFixed(2)} ms` },
            { k: 'ARRAY LENGTH', v: `${((n - 1) * STEER_SPACING).toFixed(1)} m` },
            { k: 'WAVELENGTH', v: `${lambda.toFixed(2)} m` },
            { k: 'GRATING LOBE', v: grating ? 'IN THE FIELD' : 'NONE' },
            { k: 'LEVEL @ LISTENER', v: `${lvl.toFixed(1)} dB` },
          ]}
        />
        <Badge text="Δt = d·sin θ / c PER BOX — A LINEAR DELAY GRADIENT TILTS THE WAVEFRONT; THE CABINETS NEVER MOVE" />
        {Math.abs(steer) > 40 ? (
          <Text style={dstyles.caption}>
            OVER-STEERED (|θ| &gt; ~40°): the delay gradient outruns the array’s geometry — at higher frequencies grating lobes appear in the HEAT map, spraying energy off-beam.
          </Text>
        ) : null}
      </PanelCard>
      <Mistakes
        items={[
          'Thinking you must physically tilt the box — DSP delays steer it.',
          'Over-steering beyond the array’s capability — grating lobes.',
          'Confusing steering (redirect) with widening.',
          'Ignoring the frequency dependence of steering.',
        ]}
      />
      <CheckQuestion spec={STEER_CHECK} />
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 14 — ECHO

type EchoPreset = {
  key: string;
  label: string;
  w: number;
  h: number;
  boundary: [MaterialKey, MaterialKey, MaterialKey, MaterialKey];
};

const ECHO_PRESETS: EchoPreset[] = [
  { key: 'canyon', label: 'CANYON 60 m', w: 60, h: 30, boundary: ['concrete', 'concrete', 'concrete', 'concrete'] },
  { key: 'gym', label: 'GYM 24 m', w: 24, h: 15, boundary: ['concrete', 'glass', 'wood', 'concrete'] },
  { key: 'church', label: 'CHURCH 30 m', w: 30, h: 14, boundary: ['concrete', 'glass', 'wood', 'glass'] },
  { key: 'warehouse', label: 'WAREHOUSE 40 m', w: 40, h: 22, boundary: ['concrete', 'concrete', 'concrete', 'concrete'] },
];
const ECHO_FREQ = 800;

const ECHO_CHECK: CheckSpec = {
  question: 'A strong reflection arrives 20 ms after the direct sound. What do you hear?',
  options: [
    'A distinct slap echo',
    'One fused, slightly thicker sound — precedence (Haas) integrates it',
    'Two separate syllables on every word',
    'Nothing — it cancels the direct sound',
  ],
  correctIdx: 1,
  reveal:
    'Below roughly 50 ms the ear FUSES a reflection with the direct sound — it even reinforces ' +
    'loudness while localization stays on the first arrival (precedence effect). Past ~50 ms, and ' +
    'loud enough, it separates into a discrete echo. Compare CHURCH and CANYON on the timeline.',
  wrongHint: 'Check the 50 ms marker on the timeline — which side of it is 20 ms?',
};

export function EchoModule(p: WaveModuleProps) {
  const viz = useState(() => requireWaveViz())[0];
  const [presetKey, setPresetKey] = useState('canyon');
  const [layers, setLayers] = useState<WaveLayers>({ pressure: false, heat: false, rays: true, arrivals: true });
  const [listener, setListener] = useState({ x: 10, y: 15 });

  const preset = ECHO_PRESETS.find((e) => e.key === presetKey) ?? ECHO_PRESETS[0];
  const pick = (e: EchoPreset) => {
    setPresetKey(e.key);
    setListener({ x: roundM(e.w / 6), y: roundM(e.h / 2) });
  };

  const scene = useMemo<WaveScene>(
    () => ({
      w: preset.w,
      h: preset.h,
      boundary: preset.boundary,
      sources: [{ id: 'src', x: roundM(preset.w / 12), y: roundM(preset.h / 2), freq: ECHO_FREQ, levelDb: 0, delayMs: 0, polarity: 1, kind: 'point' }],
      listener: { x: clamp(listener.x, 0.3, preset.w - 0.3), y: clamp(listener.y, 0.3, preset.h - 0.3) },
      tempC: TEMP_C,
    }),
    [preset, listener],
  );

  const arrivals = useMemo(
    () => arrivalsAt(scene, scene.listener.x, scene.listener.y, ECHO_FREQ, 2),
    [scene],
  );
  const direct = arrivals[0];
  const firstRefl = arrivals[1];
  const gapMs = firstRefl && direct ? (firstRefl.t - direct.t) * 1000 : 0;
  const lvl = responseAt(scene, scene.listener.x, scene.listener.y, ECHO_FREQ);

  return (
    <View style={{ gap: 12 }}>
      <PanelCard>
        {viz ? (
          <SceneHero
            viz={viz}
            scene={scene}
            width={p.width}
            focused={p.focused}
            freq={ECHO_FREQ}
            layers={layers}
            onDragListener={(x, y) => setListener(dragPoint(scene, x, y))}
          />
        ) : (
          <VizUnavailableCard />
        )}
        <Badge text={MODEL_BADGE} />
        <DisplayGuideButton onPress={() => p.help('echo')} />
        <View style={dstyles.chipRow}>
          {ECHO_PRESETS.map((e) => (
            <LabChip key={e.key} label={e.label} selected={presetKey === e.key} onPress={() => pick(e)} onLongPress={() => p.help('echo')} />
          ))}
        </View>
        <LayerChips layers={layers} onLayers={setLayers} help={p.help} />
        <Text style={dstyles.eyebrow}>ECHO TIMELINE — ARRIVALS AT THE LISTENER</Text>
        <ArrivalTimeline arrivals={arrivals} thresholdMs={50} />
        <Badge text="STEMS = arrivalsAt (DIRECT + 1st/2nd-ORDER IMAGE-SOURCE REFLECTIONS) · AMBER FUSES WITH THE DIRECT (<50 ms) · RED READS AS A DISCRETE ECHO" />
        <ReadoutGrid
          help={p.help}
          helpKey="echo"
          items={[
            { k: 'ROOM', v: `${preset.w} × ${preset.h} m` },
            { k: 'DIRECT', v: direct ? `${(direct.t * 1000).toFixed(1)} ms` : '—' },
            { k: '1ST REFLECTION', v: firstRefl ? `${(firstRefl.t * 1000).toFixed(1)} ms` : '—' },
            { k: 'GAP', v: `${gapMs.toFixed(1)} ms` },
            { k: 'VERDICT', v: gapMs >= 50 ? 'DISCRETE ECHO' : 'FUSES (HAAS)' },
            { k: '1ST REFL LEVEL', v: firstRefl && direct ? `${(firstRefl.levelDb - direct.levelDb).toFixed(1)} dB re direct` : '—' },
            { k: 'LEVEL @ LISTENER', v: `${lvl.toFixed(1)} dB` },
          ]}
        />
        <Text style={dstyles.caption}>
          Drag the listener toward and away from the source: the gap to the first reflection crosses ~50 ms and the verdict flips. Big hard rooms make echoes; the same reflections packed tight make reverberation (Module 15).
        </Text>
      </PanelCard>
      <Mistakes
        items={[
          'Confusing a discrete echo (>~50 ms, heard separately) with reverberation (dense, continuous).',
          'Thinking any reflection is an echo — it needs enough delay AND level.',
          'Ignoring the ~50 ms Haas integration threshold below which reflections fuse with the direct sound.',
        ]}
      />
      <CheckQuestion spec={ECHO_CHECK} />
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 15 — REVERBERATION

const REVERB_FREQ = 500;

const REVERB_CHECK: CheckSpec = {
  question: 'Two halls both measure RT60 = 1.4 s. Do they sound the same?',
  options: [
    'Yes — RT60 defines the sound of a room',
    'No — early-reflection pattern and tail density/shape differ even at equal RT60',
    'Only if they are the same size',
    'Yes, above the Schroeder frequency',
  ],
  correctIdx: 1,
  reveal:
    'RT60 is one number: how long the tail takes to fall 60 dB. The BUILDUP — direct → first ' +
    'reflections → early reflections → dense late field — carries the spatial character, and two ' +
    'rooms can share an RT60 with completely different early energy.',
  wrongHint: 'RT60 describes only the decay TIME of the tail. What else did this module show you?',
};

export function ReverbModule(p: WaveModuleProps) {
  const viz = useState(() => requireWaveViz())[0];
  const [absV, setAbsV] = useState(0.25);
  const [layers, setLayers] = useState<WaveLayers>({ pressure: false, heat: false, rays: true, arrivals: true });
  const [listener, setListener] = useState({ x: 8, y: 4.5 });

  const treated = Math.round(absV * 4); // 0..4 walls swap concrete → fiberglass
  const scene = useMemo<WaveScene>(() => {
    const boundary = [0, 1, 2, 3].map((i) => (i < treated ? 'fiberglass' : 'concrete')) as [MaterialKey, MaterialKey, MaterialKey, MaterialKey];
    return {
      w: 12,
      h: 9,
      boundary,
      sources: [{ id: 'src', x: 4, y: 4.5, freq: REVERB_FREQ, levelDb: 0, delayMs: 0, polarity: 1, kind: 'point' }],
      listener,
      tempC: TEMP_C,
    };
  }, [treated, listener]);

  const rt125 = sabineRT(scene, 125);
  const rt500 = sabineRT(scene, 500);
  const rt2k = sabineRT(scene, 2000);
  const hardRt500 = useMemo(
    () => sabineRT({ ...scene, boundary: ['concrete', 'concrete', 'concrete', 'concrete'] }, 500),
    [scene],
  );
  const arrivals = useMemo(
    () => arrivalsAt(scene, scene.listener.x, scene.listener.y, REVERB_FREQ, 2),
    [scene],
  );
  const gapMs = arrivals.length > 1 ? (arrivals[1].t - arrivals[0].t) * 1000 : 0;
  const early = arrivals.length > 0 ? arrivals.filter((a) => (a.t - arrivals[0].t) * 1000 < 80).length - 1 : 0;

  return (
    <View style={{ gap: 12 }}>
      <PanelCard>
        {viz ? (
          <SceneHero
            viz={viz}
            scene={scene}
            width={p.width}
            focused={p.focused}
            freq={REVERB_FREQ}
            layers={layers}
            onDragListener={(x, y) => setListener(dragPoint(scene, x, y))}
          />
        ) : (
          <VizUnavailableCard />
        )}
        <Badge text={MODEL_BADGE} />
        <DisplayGuideButton onPress={() => p.help('reverb_field')} />
        <LayerChips layers={layers} onLayers={setLayers} help={p.help} />
        <DragSlider
          value={absV}
          onChange={setAbsV}
          label="ABSORPTION — TREAT THE WALLS"
          readout={`${treated}/4 walls fiberglass`}
          onHelp={() => p.help('reverb_field')}
        />
        <Badge text="ABSORPTION SLIDER = HOW MANY WALLS SWAP CONCRETE → FIBERGLASS · SABINE MODEL WITH A DISCLOSED 3 m CEILING" />
        <Text style={dstyles.eyebrow}>DECAY — LEVEL VS TIME</Text>
        <DecayCurveGraph rt60={rt500} preDelayMs={gapMs} refRt60={hardRt500} />
        <Badge text="AMBER = CURRENT ROOM (SABINE RT60 @ 500 Hz) · DIM = THE UNTREATED ALL-CONCRETE ROOM · GAP = DIRECT→FIRST-REFLECTION TIME" />
        <Text style={dstyles.eyebrow}>THE BUILDUP — DIRECT → EARLY → LATE</Text>
        <ArrivalTimeline arrivals={arrivals} thresholdMs={80} />
        <ReadoutGrid
          help={p.help}
          helpKey="reverb_field"
          items={[
            { k: 'RT60 @ 125 Hz', v: `${rt125.toFixed(2)} s` },
            { k: 'RT60 @ 500 Hz', v: `${rt500.toFixed(2)} s` },
            { k: 'RT60 @ 2 kHz', v: `${rt2k.toFixed(2)} s` },
            { k: 'EARLY (<80 ms)', v: `${Math.max(0, early)} arrivals` },
            { k: '1ST REFL GAP', v: `${gapMs.toFixed(1)} ms` },
          ]}
        />
        <Text style={dstyles.caption}>
          Reverberation is not one thing — it is the buildup: the direct sound, then discrete early reflections (spatial cues), thickening into the dense late field the model’s image sources only begin to sketch. Note how fiberglass shortens 2 kHz far more than 125 Hz: porous absorption barely touches the lows.
        </Text>
      </PanelCard>
      <Mistakes
        items={[
          'Thinking reverb is “one thing” rather than the BUILDUP from discrete reflections into a diffuse field.',
          'Confusing early reflections (directional spatial cues) with the late diffuse tail.',
          'Believing more reflective surfaces always = better ambience — it can go muddy or harsh.',
          'Expecting RT60 to describe everything — tail shape and early energy also matter.',
        ]}
      />
      <CheckQuestion spec={REVERB_CHECK} />
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ROOM BUILDER (§9.16) — the free mode every module is a preset of

const WALL_NAMES = ['TOP', 'RIGHT', 'BOTTOM', 'LEFT'] as const;
const MATERIAL_KEYS = Object.keys(MATERIALS) as MaterialKey[];
const BUILDER_MAX_SOURCES = 4;

const BUILDER_CHECK: CheckSpec = {
  question: 'The HEAT map shows a deep null exactly at your listener at 63 Hz. The cheapest first fix?',
  options: [
    'Boost 63 Hz on an EQ',
    'Move the listener (or the source) — the null is geometry',
    'Add a second sub at the exact same spot',
    'Raise the source level 6 dB',
  ],
  correctIdx: 1,
  reveal:
    'A null is position-and-frequency-specific interference: at that spot the arrivals cancel, and ' +
    'an EQ boost just burns headroom into a hole. Drag the listener half a meter and watch it ' +
    'climb out — position is the cheapest acoustic tool there is.',
  wrongHint: 'Can any amount of level fill a spot where the arrivals cancel?',
};

function newSource(kind: WaveSource['kind'], id: string, x: number, y: number): WaveSource {
  const base = { id, x, y, levelDb: 0, delayMs: 0, polarity: 1 as const, kind };
  if (kind === 'speaker') return { ...base, freq: 2000, aimDeg: 0, coverageDeg: 90 };
  if (kind === 'sub') return { ...base, freq: 60 };
  return { ...base, freq: 500 };
}

export function RoomBuilderModule(p: WaveModuleProps) {
  const viz = useState(() => requireWaveViz())[0];
  const [wV, setWV] = useState((12 - 3) / 27);
  const [hV, setHV] = useState((8 - 3) / 27);
  const [boundary, setBoundary] = useState<[MaterialKey, MaterialKey, MaterialKey, MaterialKey]>(['drywall', 'drywall', 'drywall', 'drywall']);
  const [selWall, setSelWall] = useState(0);
  const [sources, setSources] = useState<WaveSource[]>([newSource('speaker', 's1', 6, 1.5)]);
  const [selectedId, setSelectedId] = useState<string | null>('s1');
  const [listener, setListener] = useState({ x: 6, y: 5.5 });
  const [viewFreqV, setViewFreqV] = useState(() => logPos(500, 40, 8000));
  const [layers, setLayers] = useState<WaveLayers>({ pressure: true, heat: true, rays: false, arrivals: false });
  const nextId = useRef(2);

  const roomW = roundM(3 + wV * 27);
  const roomH = roundM(3 + hV * 27);
  const viewFreq = logMap(viewFreqV, 40, 8000);

  const scene = useMemo<WaveScene>(
    () => ({
      w: roomW,
      h: roomH,
      boundary,
      sources: sources.map((s) => ({ ...s, x: clamp(s.x, 0.3, roomW - 0.3), y: clamp(s.y, 0.3, roomH - 0.3) })),
      listener: { x: clamp(listener.x, 0.3, roomW - 0.3), y: clamp(listener.y, 0.3, roomH - 0.3) },
      tempC: TEMP_C,
    }),
    [roomW, roomH, boundary, sources, listener],
  );

  const sel = sources.find((s) => s.id === selectedId) ?? null;
  const patchSel = (patch: Partial<WaveSource>) =>
    setSources((prev) => prev.map((s) => (s.id === selectedId ? { ...s, ...patch } : s)));
  const addSource = (kind: WaveSource['kind']) => {
    if (sources.length >= BUILDER_MAX_SOURCES) return;
    const id = `s${nextId.current++}`;
    const pt = dragPoint(scene, roomW / 2 - 1.5 + sources.length * 1.2, roomH * 0.25);
    setSources((prev) => [...prev, newSource(kind, id, pt.x, pt.y)]);
    setSelectedId(id);
  };
  const removeSelected = () => {
    if (!sel) return;
    setSources((prev) => prev.filter((s) => s.id !== sel.id));
    setSelectedId(null);
  };

  const arrivals = useMemo(
    () => (scene.sources.length > 0 ? arrivalsAt(scene, scene.listener.x, scene.listener.y, viewFreq, 2) : []),
    [scene, viewFreq],
  );
  const early = arrivals.length > 0 ? arrivals.filter((a) => (a.t - arrivals[0].t) * 1000 < 80).length - 1 : 0;
  const lvl = scene.sources.length > 0 ? responseAt(scene, scene.listener.x, scene.listener.y, viewFreq) : null;
  const rt500 = sabineRT(scene, 500);

  return (
    <View style={{ gap: 12 }}>
      <PanelCard>
        {viz ? (
          <SceneHero
            viz={viz}
            scene={scene}
            width={p.width}
            focused={p.focused}
            freq={viewFreq}
            layers={layers}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onDragSource={(id, x, y) => {
              const pt = dragPoint(scene, x, y);
              setSources((prev) => prev.map((s) => (s.id === id ? { ...s, x: pt.x, y: pt.y } : s)));
            }}
            onDragListener={(x, y) => setListener(dragPoint(scene, x, y))}
          />
        ) : (
          <VizUnavailableCard />
        )}
        <Badge text={MODEL_BADGE} />
        <DisplayGuideButton onPress={() => p.help('room_builder')} />
        <LayerChips layers={layers} onLayers={setLayers} help={p.help} />
        <DragSlider value={wV} onChange={setWV} label="ROOM WIDTH" readout={`${roomW.toFixed(2)} m`} onHelp={() => p.help('room_builder')} />
        <DragSlider value={hV} onChange={setHV} label="ROOM DEPTH" readout={`${roomH.toFixed(2)} m`} onHelp={() => p.help('room_builder')} />
        <DragSlider
          value={viewFreqV}
          onChange={setViewFreqV}
          label="FREQUENCY OF VIEW"
          readout={fmtHz(viewFreq)}
          onHelp={() => p.help('layers')}
        />
      </PanelCard>

      <PanelCard>
        <Text style={dstyles.eyebrow}>WALL MATERIALS</Text>
        <View style={dstyles.chipRow}>
          {WALL_NAMES.map((w, i) => (
            <LabChip
              key={w}
              label={`${w} · ${MATERIALS[boundary[i]].label.toUpperCase()}`}
              selected={selWall === i}
              onPress={() => setSelWall(i)}
              onLongPress={() => p.help('room_builder')}
            />
          ))}
        </View>
        <View style={dstyles.chipRow}>
          {MATERIAL_KEYS.map((m) => (
            <LabChip
              key={m}
              label={MATERIALS[m].label.toUpperCase()}
              selected={boundary[selWall] === m}
              onPress={() =>
                setBoundary((prev) => prev.map((b, i) => (i === selWall ? m : b)) as [MaterialKey, MaterialKey, MaterialKey, MaterialKey])
              }
              onLongPress={() => p.help('room_builder')}
            />
          ))}
        </View>
        <Badge text="TEXTBOOK-TYPICAL TEACHING α VALUES — NOT ISO 354 PRODUCT DATA" />
      </PanelCard>

      <PanelCard>
        <Text style={dstyles.eyebrow}>SOURCES — {sources.length}/{BUILDER_MAX_SOURCES}</Text>
        <View style={dstyles.chipRow}>
          <LabChip label="+ POINT" selected={false} onPress={() => addSource('point')} onLongPress={() => p.help('room_builder')} />
          <LabChip label="+ SPEAKER" selected={false} onPress={() => addSource('speaker')} onLongPress={() => p.help('room_builder')} />
          <LabChip label="+ SUB" selected={false} onPress={() => addSource('sub')} onLongPress={() => p.help('room_builder')} />
        </View>
        {sources.length >= BUILDER_MAX_SOURCES ? (
          <Text style={dstyles.caption}>Source limit reached (4) — remove one to add another.</Text>
        ) : null}
        <View style={dstyles.chipRow}>
          {sources.map((s, i) => (
            <LabChip
              key={s.id}
              label={`${i + 1} · ${s.kind.toUpperCase()}`}
              selected={selectedId === s.id}
              onPress={() => setSelectedId(selectedId === s.id ? null : s.id)}
              onLongPress={() => p.help('room_builder')}
            />
          ))}
        </View>
        {sel ? (
          <View style={{ gap: 10 }}>
            <DragSlider
              value={logPos(sel.freq, 40, 8000)}
              onChange={(v) => patchSel({ freq: logMap(v, 40, 8000) })}
              label="SOURCE FREQUENCY"
              readout={fmtHz(sel.freq)}
              onHelp={() => p.help('room_builder')}
            />
            <DragSlider
              value={(sel.levelDb + 24) / 30}
              onChange={(v) => patchSel({ levelDb: Math.round((v * 30 - 24) * 2) / 2 })}
              label="LEVEL"
              readout={`${sel.levelDb >= 0 ? '+' : ''}${sel.levelDb.toFixed(1)} dB`}
              onHelp={() => p.help('room_builder')}
            />
            <DragSlider
              value={sel.delayMs / 20}
              onChange={(v) => patchSel({ delayMs: Math.round(v * 20 * 10) / 10 })}
              label="DELAY"
              readout={`${sel.delayMs.toFixed(1)} ms`}
              onHelp={() => p.help('delay_align')}
            />
            <View style={dstyles.chipRow}>
              <LabChip
                label="POLARITY Ø INVERT"
                selected={sel.polarity === -1}
                onPress={() => patchSel({ polarity: sel.polarity === -1 ? 1 : -1 })}
                onLongPress={() => p.help('interference')}
              />
            </View>
            {sel.kind === 'speaker' ? (
              <>
                <DragSlider
                  value={((sel.aimDeg ?? 0) + 90) / 180}
                  onChange={(v) => patchSel({ aimDeg: Math.round(-90 + v * 180) })}
                  label="AIM"
                  readout={`${sel.aimDeg ?? 0}°`}
                  onHelp={() => p.help('coverage_pattern')}
                />
                <View style={dstyles.chipRow}>
                  {COVERAGE_CHIPS.map((c) => (
                    <LabChip
                      key={c}
                      label={`${c}°`}
                      selected={(sel.coverageDeg ?? 90) === c}
                      onPress={() => patchSel({ coverageDeg: c })}
                      onLongPress={() => p.help('coverage_pattern')}
                    />
                  ))}
                </View>
              </>
            ) : null}
            <GlassButton label="REMOVE SELECTED SOURCE" tint="teal" height={42} fontSize={12.5} onPress={removeSelected} />
          </View>
        ) : (
          <Text style={dstyles.caption}>Tap a source (chip or in the room) to edit its frequency, level, delay, polarity and aim.</Text>
        )}
      </PanelCard>

      <PanelCard>
        <Text style={dstyles.eyebrow}>AT THE LISTENER</Text>
        <ReadoutGrid
          help={p.help}
          helpKey="room_builder"
          items={[
            { k: 'ROOM', v: `${roomW.toFixed(1)} × ${roomH.toFixed(1)} m` },
            { k: `LEVEL @ ${fmtHz(viewFreq)}`, v: lvl == null ? '—' : `${lvl.toFixed(1)} dB` },
            { k: '1ST ARRIVAL', v: arrivals.length > 0 ? `${(arrivals[0].t * 1000).toFixed(1)} ms` : '—' },
            { k: 'EARLY (<80 ms)', v: arrivals.length > 0 ? `${Math.max(0, early)} arrivals` : '—' },
            { k: 'RT60 @ 500 Hz', v: `${rt500.toFixed(2)} s` },
            { k: 'SOURCES', v: `${sources.length}/${BUILDER_MAX_SOURCES}` },
          ]}
        />
        <Badge text={MODEL_BADGE} />
      </PanelCard>

      <PanelCard>
        <Text style={dstyles.eyebrow}>WHAT TO TRY</Text>
        <Text style={dstyles.body}>
          • Build a cardioid: two SUBs 1.2 m apart, rear one delayed ~3.5 ms with polarity inverted — HEAT shows energy forward, silence behind.
        </Text>
        <Text style={dstyles.body}>
          • Find a comb: one SPEAKER near a GLASS wall, view ~2 kHz, then drag the listener slowly across the room and watch ARRIVALS and the level readout ripple.
        </Text>
        <Text style={dstyles.body}>
          • Meet your room modes: shrink the room to ~4 × 3 m, view 40–120 Hz, and watch hot/cold bands snap in — then treat two walls with FIBERGLASS and watch RT60 fall.
        </Text>
      </PanelCard>

      <Mistakes
        items={[
          'Measuring reflection angles from the surface instead of the normal.',
          'Thinking absorption and diffusion do the same job — one removes energy, the other redistributes it.',
          'Trying to EQ away comb filtering or a modal null — both are geometry, fix position/timing.',
          'Expecting a barrier to block bass — long wavelengths diffract around anything smaller than themselves.',
          'Believing two sources always sum +6 dB everywhere — only where they arrive in phase.',
          'Aligning a sub by tape measure alone — processing latency is invisible to the tape.',
          'Treating the image source as a real loudspeaker rather than a construction that predicts reflections.',
          'Expecting room modes to matter at 5 kHz — they dominate below the Schroeder frequency.',
        ]}
      />
      <CheckQuestion spec={BUILDER_CHECK} />
    </View>
  );
}
