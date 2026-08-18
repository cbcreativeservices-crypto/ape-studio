/**
 * wave/modWaveA — Wave Physics Laboratory MODULES 1–8 (v4 MASTER §9.1–9.8):
 * Reflection · Absorption · Diffusion · Refraction · Diffraction ·
 * Interference · Comb Filtering · Standing Waves.
 *
 * Every module is a PRESET of the one Room Builder engine (waveEngine.ts) —
 * a small WaveScene in state, the shared scene views from vizWave, layer
 * chips, DragSliders/LabChips driving the scene, and a ReadoutGrid of real
 * engine numbers. Each module carries the spec's Common Mistakes verbatim-
 * faithful, one CheckQuestion, and the honesty badge (§1.7): everything drawn
 * here is an ILLUSTRATIVE MODEL — geometric/analytic, not a pressure sim.
 *
 * NO Skia in this file: the scene views load solely through
 * skiaGate.requireWaveViz(); pre-Skia clients render VizUnavailableCard and
 * every readout (pure waveEngine math) keeps working.
 *
 * Memo stability contract: all dragged/slid METER values snap to 0.05 m so
 * the heat-map memo key stays stable; scenes keep ≤ 2 sources.
 */
import { useCallback, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { DisplayGuideButton } from '../../../../features/lab/guidedLessons';
import { ResponseCurveGraph, type ResponseCurve } from '../../../../features/lab/fxViz';
import { LabChip } from '../../LabShell';
import { CheckQuestion, DragSlider, VizUnavailableCard, type CheckSpec } from '../../foundations/bits';
import { Badge, PanelCard, ReadoutGrid, dstyles } from '../../digital/bits';
import { useLabPhoto } from '../../labPhoto';
import { MATERIAL_PHOTOS } from '../materialPhotos';
import { WaveLayout } from './waveLayout';
import {
  MATERIALS,
  alphaAt,
  arrivalsAt,
  fieldAt,
  fieldDb,
  imageSources,
  maekawaAttenuationDb,
  modeFrequency,
  modePressure,
  refractedRayHeight,
  responseAt,
  sabineRT,
  speedOfSound,
  type MaterialKey,
  type WaveScene,
  type WaveSource,
} from '../waveEngine';
import { requireWaveViz, type WaveVizModule } from '../skiaGate';
import type { WaveLayers } from '../vizWave';
import type { WaveModuleProps } from '../WaveModuleScreen';

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers (formatting + the 0.05 m snap contract — no physics here;
// every acoustic number comes from waveEngine).

const HONESTY = 'ILLUSTRATIVE MODEL — GEOMETRIC/ANALYTIC, NOT A PRESSURE SIMULATION';

/** Meter-value snap (0.05 m) — keeps the heat-map memo key stable (contract). */
const snap05 = (v: number) => Math.round(v / 0.05) * 0.05;
const clampSnap = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, snap05(v)));

const fmtM = (m: number) => `${m.toFixed(2)} m`;
const fmtMs = (s: number) => `${(s * 1000).toFixed(1)} ms`;
const fmtHz = (f: number) => (f >= 1000 ? `${Number((f / 1000).toFixed(2))} kHz` : `${Math.round(f)} Hz`);
const fmtDb = (db: number) => `${db >= 0 ? '+' : ''}${db.toFixed(1)} dB`;

const logFrac = (f: number, lo: number, hi: number) =>
  Math.max(0, Math.min(1, Math.log(f / lo) / Math.log(hi / lo)));
const fracLog = (v: number, lo: number, hi: number) => Math.round(lo * Math.pow(hi / lo, v));

/** Slowed visual wavefront rate for the phase clock — faster for higher ƒ. */
const visHzFor = (f: number) => 0.35 + 0.9 * logFrac(f, 63, 8000);

function pt(id: string, x: number, y: number, freq: number): WaveSource {
  return { id, x, y, freq, levelDb: 0, delayMs: 0, polarity: 1, kind: 'point' };
}

/** Source/listener drag handlers with the 0.05 m snap + in-room clamping. */
function useSceneDrag(setScene: React.Dispatch<React.SetStateAction<WaveScene>>) {
  const onDragSource = useCallback(
    (id: string, x: number, y: number) => {
      setScene((sc) => ({
        ...sc,
        sources: sc.sources.map((s) =>
          s.id === id
            ? { ...s, x: clampSnap(x, 0.3, sc.w - 0.3), y: clampSnap(y, 0.3, sc.h - 0.3) }
            : s,
        ),
      }));
    },
    [setScene],
  );
  const onDragListener = useCallback(
    (x: number, y: number) => {
      setScene((sc) => ({
        ...sc,
        listener: { x: clampSnap(x, 0.3, sc.w - 0.3), y: clampSnap(y, 0.3, sc.h - 0.3) },
      }));
    },
    [setScene],
  );
  return { onDragSource, onDragListener };
}

// ── Inner scene hosts — only rendered when viz loaded, so the phase-clock
//    hook (from the viz module) is called unconditionally within them. ──────

function RoomView({
  viz,
  width,
  focused,
  scene,
  freq,
  layers,
  height,
  mode,
  modal,
  onDragSource,
  onDragListener,
}: {
  viz: WaveVizModule;
  width: number;
  focused: boolean;
  scene: WaveScene;
  freq: number;
  layers: WaveLayers;
  height?: number;
  mode?: 'interference' | 'modal';
  modal?: { nx: number; ny: number };
  onDragSource?: (id: string, x: number, y: number) => void;
  onDragListener?: (x: number, y: number) => void;
}) {
  const phase = viz.usePhaseClock(focused, visHzFor(freq));
  return (
    <viz.RoomSceneView
      scene={scene}
      width={width}
      height={height}
      freq={freq}
      layers={layers}
      phase={phase}
      mode={mode}
      modal={modal}
      onDragSource={onDragSource}
      onDragListener={onDragListener}
    />
  );
}

function BarrierView({
  viz,
  width,
  focused,
  freq,
  barrierH01,
}: {
  viz: WaveVizModule;
  width: number;
  focused: boolean;
  freq: number;
  barrierH01: number;
}) {
  const phase = viz.usePhaseClock(focused, visHzFor(freq));
  return <viz.BarrierSceneView width={width} freq={freq} barrierH01={barrierH01} phase={phase} />;
}

function GradientView({
  viz,
  width,
  focused,
  gradient01,
  wind01,
}: {
  viz: WaveVizModule;
  width: number;
  focused: boolean;
  gradient01: number;
  wind01: number;
}) {
  const phase = viz.usePhaseClock(focused, 0.5);
  return <viz.GradientSceneView width={width} gradient01={gradient01} wind01={wind01} phase={phase} />;
}

/** PRESSURE / HEAT / RAYS / ARRIVALS layer chips (v4 §10.1 launch set). */
function LayerChips({
  layers,
  onChange,
  help,
  raysKey = 'layers',
}: {
  layers: WaveLayers;
  onChange: (l: WaveLayers) => void;
  help: (k?: string) => void;
  raysKey?: string;
}) {
  const t = (k: keyof WaveLayers) => onChange({ ...layers, [k]: !layers[k] });
  return (
    <View style={dstyles.chipRow}>
      <LabChip label="PRESSURE" selected={layers.pressure} onPress={() => t('pressure')} onLongPress={() => help('layers')} />
      <LabChip label="WAVE FIELD" selected={layers.heat} onPress={() => t('heat')} onLongPress={() => help('layers')} />
      <LabChip label="RAYS" selected={layers.rays} onPress={() => t('rays')} onLongPress={() => help(raysKey)} />
      <LabChip label="ARRIVALS" selected={layers.arrivals} onPress={() => t('arrivals')} onLongPress={() => help('arrivals')} />
    </View>
  );
}

/** The spec's per-module Common Mistakes (§9) — embedded verbatim-faithful. */
function MistakesCard({ items }: { items: string[] }) {
  return (
    <PanelCard>
      <Text style={dstyles.eyebrow}>COMMON MISTAKES</Text>
      {items.map((m) => (
        <Text key={m} style={dstyles.body}>
          {'•'} {m}
        </Text>
      ))}
    </PanelCard>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 1 — REFLECTION VISUALIZER (§9.1)

const REFLECTION_MATS: MaterialKey[] = ['concrete', 'glass', 'wood', 'drywall', 'curtain', 'foam', 'fiberglass'];

const REFLECTION_MISTAKES = [
  'Measuring the reflection angle from the surface instead of the NORMAL.',
  'Thinking reflection is lossless — energy is absorbed at each bounce.',
  'Treating the image source as a real second source rather than a modeling construct.',
  'Forgetting the path-length difference creates the time delay behind comb filtering.',
];

const REFLECTION_CHECK: CheckSpec = {
  question:
    'RAYS draws each reflection as a straight line from an "image source" mirrored behind the wall. What is that image source?',
  options: [
    'A real second sound source that the wall creates',
    'A modeling construct that predicts the reflection’s path, arrival time and level',
    'The listener’s mirror image',
    'A rendering error in the simulation',
  ],
  correctIdx: 1,
  reveal:
    'No second loudspeaker exists. Mirroring the source across the wall turns the bent reflection path into ONE straight line — handing you path length, arrival time and level in a single construction. Treating it as a real source is this module’s classic mistake.',
  wrongHint: 'Nothing new is emitting sound — the wall only redirects what the one source made.',
};

export function ReflectionModule(p: WaveModuleProps) {
  const viz = useState(() => requireWaveViz())[0];
  const openPhoto = useLabPhoto();
  const [scene, setScene] = useState<WaveScene>(() => ({
    w: 8,
    h: 6,
    boundary: ['concrete', 'concrete', 'concrete', 'concrete'],
    sources: [pt('s1', 2.2, 3.6, 1000)],
    listener: { x: 5.8, y: 2.6 },
    tempC: 20,
  }));
  const [layers, setLayers] = useState<WaveLayers>({ pressure: true, heat: false, rays: true, arrivals: true });
  const { onDragSource, onDragListener } = useSceneDrag(setScene);

  const freq = scene.sources[0].freq;
  const setFreq = (f: number) =>
    setScene((sc) => ({ ...sc, sources: sc.sources.map((s) => ({ ...s, freq: f })) }));
  const mat = scene.boundary[0];
  const setMat = (m: MaterialKey) => setScene((sc) => ({ ...sc, boundary: [m, m, m, m] }));
  const alpha = alphaAt(mat, freq);

  const arrivals = useMemo(
    () => arrivalsAt(scene, scene.listener.x, scene.listener.y, freq, 1),
    [scene, freq],
  );
  const direct = arrivals.find((a) => a.bounces.length === 0);
  const first = arrivals.find((a) => a.bounces.length === 1);
  // The 1st reflection's LEVEL relative to the direct sound — the arrival number
  // that moves with EVERYTHING: spreading (position), material gain, and
  // frequency-dependent α. So changing any setting re-solves the arrivals.
  const firstRelDb = direct && first ? first.levelDb - direct.levelDb : null;

  const readouts = [
    { k: 'DIRECT PATH', v: direct ? `${fmtM(direct.pathLen)} · ${fmtMs(direct.t)}` : '—' },
    { k: '1ST REFLECTION', v: first ? `${fmtM(first.pathLen)} · ${fmtMs(first.t)}` : '—' },
    {
      k: '1ST REFL. LEVEL',
      v: firstRelDb != null ? `${firstRelDb <= -0.05 ? '−' : ''}${Math.abs(firstRelDb).toFixed(1)} dB` : '—',
    },
    {
      k: 'PATH DIFFERENCE',
      v:
        direct && first
          ? `+${(first.pathLen - direct.pathLen).toFixed(2)} m · +${((first.t - direct.t) * 1000).toFixed(1)} ms`
          : '—',
    },
    { k: 'REFLECTION LOSS', v: alpha >= 0.999 ? 'TOTAL' : `${(-10 * Math.log10(1 - alpha)).toFixed(1)} dB / bounce` },
  ];

  return (
    <WaveLayout
      explain={
        <PanelCard>
          <Text style={dstyles.eyebrow}>ANGLE FROM THE NORMAL</Text>
          <Text style={dstyles.body}>
            Angle in equals angle out — measured from the NORMAL, the line perpendicular to the wall,
            never from the surface itself. A ray grazing along a wall has a large angle of incidence,
            not a small one. And no bounce is free: the wall keeps a share of the energy (α), so every
            reflection arrives late AND weakened — the REFLECTION LOSS readout is that per-bounce toll.
          </Text>
          <Text style={dstyles.eyebrow}>THE IMAGE SOURCE — A CONSTRUCT, NOT A SOURCE</Text>
          <Text style={dstyles.body}>
            The RAYS layer builds each reflection by mirroring the source across the wall and drawing a
            straight line from that IMAGE. It is a modeling device that predicts path length, delay and
            level in one move — nothing behind the wall is making sound. The PATH DIFFERENCE it predicts
            is the exact time offset that carves comb filters in Module 7.
          </Text>
        </PanelCard>
      }
      readouts={<ReadoutGrid items={readouts} help={p.help} helpKey="reflection" />}
      layers={<LayerChips layers={layers} onChange={setLayers} help={p.help} raysKey="image_source" />}
      display={
        <>
          {viz ? (
            <RoomView
              viz={viz}
              width={p.width}
              focused={p.focused}
              scene={scene}
              freq={freq}
              layers={layers}
              onDragSource={onDragSource}
              onDragListener={onDragListener}
            />
          ) : (
            <VizUnavailableCard />
          )}
          <Badge text={HONESTY} />
          <Text style={dstyles.caption}>
            Drag the source and the listener — the rays and arrival numbers re-solve instantly.
          </Text>
        </>
      }
      guide={<DisplayGuideButton onPress={() => p.help('layers')} />}
      controls={
        <>
          <DragSlider
            value={logFrac(freq, 63, 8000)}
            onChange={(v) => setFreq(fracLog(v, 63, 8000))}
            label="REFLECTED FREQUENCY"
            readout={fmtHz(freq)}
            onHelp={() => p.help('reflection')}
          />
          <View style={dstyles.chipRow}>
            {REFLECTION_MATS.map((m) => (
              <LabChip
                key={m}
                label={MATERIALS[m].label.toUpperCase()}
                selected={mat === m}
                onPress={() => setMat(m)}
                // foam/fiberglass long-press → their reference photo; others → the lesson.
                onLongPress={() => {
                  const photo = MATERIAL_PHOTOS[m];
                  if (photo) openPhoto(photo.file, photo.caption);
                  else p.help('materials');
                }}
              />
            ))}
          </View>
        </>
      }
      mistakes={<MistakesCard items={REFLECTION_MISTAKES} />}
      check={<CheckQuestion spec={REFLECTION_CHECK} />}
    />
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 2 — ABSORPTION LABORATORY (§9.2)

const ABSORB_MATS: MaterialKey[] = [
  'concrete', 'glass', 'drywall', 'wood', 'curtain', 'carpet', 'foam', 'fiberglass', 'audience',
];

const ABSORB_MISTAKES = [
  'Thinking thicker/denser absorbs everything — absorption is FREQUENCY-DEPENDENT; porous absorbers work highs, not lows.',
  'Trying to absorb bass with thin foam — lows need thick/tuned membrane/Helmholtz absorbers or distance from the boundary.',
  'Confusing absorption (reduces reflections inside) with soundproofing/isolation (stops transmission).',
  'Over-absorbing → a dead, unnatural room.',
];

const ABSORB_CHECK: CheckSpec = {
  question: 'A control room booms at 60 Hz. You cover every wall in 5 cm acoustic foam. What changes?',
  options: [
    'The boom disappears — foam absorbs everything',
    'The highs get drier but the 60 Hz boom barely moves',
    'The boom gets louder',
    'Outside noise stops getting in',
  ],
  correctIdx: 1,
  reveal:
    'Check foam’s α row: 0.11 at 125 Hz vs 0.98–0.99 above 2 kHz. Thin porous absorbers work where air particle velocity is high — roughly a quarter wavelength off the wall. At 60 Hz that is about 1.4 m out; a 5 cm panel sits in nearly still air and does almost nothing. Bass needs thickness, depth, or tuned traps.',
  wrongHint: 'Read the α @ 125 Hz cell with FOAM selected — then the α @ 4 kHz cell.',
};

export function AbsorptionModule(p: WaveModuleProps) {
  const viz = useState(() => requireWaveViz())[0];
  const openPhoto = useLabPhoto();
  const [scene, setScene] = useState<WaveScene>(() => ({
    w: 7,
    h: 5,
    boundary: ['drywall', 'drywall', 'drywall', 'drywall'],
    sources: [pt('s1', 2, 2.5, 500)],
    listener: { x: 5, y: 2.5 },
    tempC: 20,
  }));
  const [layers, setLayers] = useState<WaveLayers>({ pressure: true, heat: false, rays: true, arrivals: false });
  const { onDragSource, onDragListener } = useSceneDrag(setScene);

  const freq = scene.sources[0].freq;
  const setFreq = (f: number) =>
    setScene((sc) => ({ ...sc, sources: sc.sources.map((s) => ({ ...s, freq: f })) }));
  const mat = scene.boundary[0];
  const setMat = (m: MaterialKey) => setScene((sc) => ({ ...sc, boundary: [m, m, m, m] }));
  const alpha = alphaAt(mat, freq);

  const readouts = [
    { k: `α @ ${fmtHz(freq)}`, v: alpha.toFixed(2) },
    { k: 'ENERGY AFTER 1 BOUNCE', v: `${((1 - alpha) * 100).toFixed(0)} %` },
    { k: 'α @ 125 HZ', v: alphaAt(mat, 125).toFixed(2) },
    { k: 'α @ 4 KHZ', v: alphaAt(mat, 4000).toFixed(2) },
    { k: 'RT60 @ 125 HZ', v: `${sabineRT(scene, 125).toFixed(2)} s` },
    { k: 'RT60 @ 500 HZ', v: `${sabineRT(scene, 500).toFixed(2)} s` },
    { k: 'RT60 @ 2 KHZ', v: `${sabineRT(scene, 2000).toFixed(2)} s` },
  ];

  return (
    <WaveLayout
      explain={
        <PanelCard>
          <Text style={dstyles.eyebrow}>WHY BASS SURVIVES</Text>
          <Text style={dstyles.body}>
            Slide the frequency down with a porous material selected (foam, fiberglass, curtains,
            carpet) and watch α collapse: those materials absorb by friction where air particle
            VELOCITY is high — about a quarter wavelength off the wall. At 4 kHz that is ~2 cm; at
            125 Hz it is ~69 cm. Thin panels simply sit in still air at low frequencies. That is why
            the RT60 table stays long at 125 Hz while the mids and highs die — and why real bass
            control means thickness, air gaps, or tuned membrane/Helmholtz traps.
          </Text>
          <Text style={dstyles.eyebrow}>ABSORPTION ≠ SOUNDPROOFING</Text>
          <Text style={dstyles.body}>
            α describes what happens to reflections INSIDE the room. Stopping sound from crossing the
            wall is isolation — mass, decoupling and sealing — a different job entirely. A foam-lined
            room can sound dead inside and still leak like a sieve.
          </Text>
        </PanelCard>
      }
      readouts={
        <>
          <ReadoutGrid items={readouts} help={p.help} helpKey="absorption" />
          <Badge text="SABINE RT TREATS THE 2-D ROOM AS 3 m TALL — TEXTBOOK TEACHING α VALUES, NOT ISO 354 PRODUCT DATA" />
        </>
      }
      layers={<LayerChips layers={layers} onChange={setLayers} help={p.help} />}
      display={
        <>
          {viz ? (
            <RoomView
              viz={viz}
              width={p.width}
              focused={p.focused}
              scene={scene}
              freq={freq}
              layers={layers}
              onDragSource={onDragSource}
              onDragListener={onDragListener}
            />
          ) : (
            <VizUnavailableCard />
          )}
          <Badge text={HONESTY} />
          <Text style={dstyles.caption}>Treat the walls — every boundary takes the material you pick.</Text>
        </>
      }
      guide={<DisplayGuideButton onPress={() => p.help('layers')} />}
      controls={
        <>
          <DragSlider
            value={logFrac(freq, 63, 8000)}
            onChange={(v) => setFreq(fracLog(v, 63, 8000))}
            label="ABSORPTION FREQUENCY"
            readout={fmtHz(freq)}
            onHelp={() => p.help('absorption')}
          />
          <View style={dstyles.chipRow}>
            {ABSORB_MATS.map((m) => (
              <LabChip
                key={m}
                label={MATERIALS[m].label.toUpperCase()}
                selected={mat === m}
                onPress={() => setMat(m)}
                // foam/fiberglass long-press → their reference photo; others → the lesson.
                onLongPress={() => {
                  const photo = MATERIAL_PHOTOS[m];
                  if (photo) openPhoto(photo.file, photo.caption);
                  else p.help('materials');
                }}
              />
            ))}
          </View>
        </>
      }
      mistakes={<MistakesCard items={ABSORB_MISTAKES} />}
      check={<CheckQuestion spec={ABSORB_CHECK} />}
    />
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 3 — DIFFUSION LABORATORY (§9.3)

const DIFFUSION_MISTAKES = [
  'Thinking diffusion absorbs/removes energy — it SCATTERS and PRESERVES it.',
  'Confusing diffusion with absorption (scatter vs remove).',
  'Placing diffusers too close to the listener — the scattered field needs distance to form.',
  'Expecting a diffuser to work BELOW its design frequency — well depth sets the low limit.',
];

const DIFFUSION_CHECK: CheckSpec = {
  question: 'You swap an absorber panel for a diffuser of the same size. The total reflected energy…',
  options: [
    'Drops to nearly zero — diffusers are better absorbers',
    'Stays almost the same, but spreads over many directions and times',
    'Doubles — diffusers amplify reflections',
    'Only the bass is removed',
  ],
  correctIdx: 1,
  reveal:
    'Diffusion REDISTRIBUTES energy; absorption REMOVES it. A diffuser breaks one hard specular bounce into many weaker, time-smeared ones — the room keeps its life and energy without the harsh mirror reflection. Watch the ENERGY RETURNED readout: it does not move when you toggle the diffuser.',
  wrongHint: 'Scatter vs remove — which one is the diffuser’s job?',
};

export function DiffusionModule(p: WaveModuleProps) {
  const viz = useState(() => requireWaveViz())[0];
  const [scene, setScene] = useState<WaveScene>(() => ({
    w: 7,
    h: 5,
    boundary: ['concrete', 'concrete', 'concrete', 'concrete'],
    sources: [pt('s1', 2, 2.2, 1000)],
    listener: { x: 5, y: 2.2 },
    tempC: 20,
  }));
  const [layers, setLayers] = useState<WaveLayers>({ pressure: false, heat: false, rays: true, arrivals: true });
  const [diffuser, setDiffuser] = useState(true);
  const [depth, setDepth] = useState(0.2); // meters, snapped 0.05
  const { onDragSource, onDragListener } = useSceneDrag(setScene);

  const freq = scene.sources[0].freq;
  const setFreq = (f: number) =>
    setScene((sc) => ({ ...sc, sources: sc.sources.map((s) => ({ ...s, freq: f })) }));
  const alpha = alphaAt('concrete', freq);
  const fLow = speedOfSound(scene.tempC) / (2 * depth);
  const scatters = diffuser && freq >= fLow;

  const readouts = [
    { k: 'TOP WALL', v: diffuser ? 'DIFFUSER' : 'FLAT — SPECULAR' },
    { k: 'DIFFUSER DEPTH', v: fmtM(depth), helpKey: 'diffusion_depth' },
    { k: 'LOWEST SCATTERED ƒ', v: `${fmtHz(fLow)} (c / 2·depth)` },
    {
      k: `THIS ƒ (${fmtHz(freq)})`,
      v: !diffuser ? 'ONE SPECULAR RAY' : scatters ? 'SCATTERED — MANY DIM RAYS' : 'SPECULAR — BELOW DESIGN ƒ',
    },
    { k: 'ENERGY RETURNED', v: `${((1 - alpha) * 100).toFixed(0)} % — SAME ON OR OFF` },
  ];

  return (
    <WaveLayout
      explain={
        <PanelCard>
          <Text style={dstyles.eyebrow}>SCATTER ≠ REMOVE</Text>
          <Text style={dstyles.body}>
            A flat hard wall returns one strong mirror-image (SPECULAR) reflection. A diffuser breaks
            that single ray into many weaker ones fanning from the bounce point, smeared slightly in
            time — the ENERGY RETURNED readout proves nothing was absorbed. That is the whole point:
            keep the room alive while killing the harsh discrete slap. If you want energy GONE, that
            is absorption (Module 2) — a different tool for a different problem.
          </Text>
          <Text style={dstyles.eyebrow}>DEPTH SETS THE LOW LIMIT — AND DISTANCE MATTERS</Text>
          <Text style={dstyles.body}>
            A diffuser only scatters waves short enough to feel its wells: the lowest scattered
            frequency is roughly c / (2 × depth). Slide the depth and watch the limit move — below it
            the surface acts like a plain flat wall. And give the scattered field room to form: seated
            against the diffuser you hear the wells individually, not a diffuse blend. Keep roughly a
            wavelength or more of distance.
          </Text>
        </PanelCard>
      }
      readouts={<ReadoutGrid items={readouts} help={p.help} helpKey="diffusion" />}
      layers={<LayerChips layers={layers} onChange={setLayers} help={p.help} />}
      display={
        <>
          {viz ? (
            <RoomView
              viz={viz}
              width={p.width}
              focused={p.focused}
              scene={scene}
              freq={freq}
              layers={layers}
              onDragSource={onDragSource}
              onDragListener={onDragListener}
            />
          ) : (
            <VizUnavailableCard />
          )}
          <Badge text={HONESTY} />
          <Badge text="THE ENGINE DRAWS THE SPECULAR RAY — A DIFFUSER FANS THAT SAME ENERGY INTO MANY DIM RAYS FROM THE BOUNCE POINT: SPREAD, NOT REMOVED" />
        </>
      }
      guide={<DisplayGuideButton onPress={() => p.help('diffusion')} />}
      controls={
        <>
          <DragSlider
            value={(depth - 0.05) / 0.55}
            onChange={(v) => setDepth(clampSnap(0.05 + v * 0.55, 0.05, 0.6))}
            label="DIFFUSER DEPTH"
            readout={fmtM(depth)}
            onHelp={() => p.help('diffusion_depth')}
          />
          <DragSlider
            value={logFrac(freq, 125, 8000)}
            onChange={(v) => setFreq(fracLog(v, 125, 8000))}
            label="FREQUENCY"
            readout={fmtHz(freq)}
            onHelp={() => p.help('diffusion')}
          />
          <View style={dstyles.chipRow}>
            <LabChip
              label={diffuser ? 'DIFFUSER ON (TOP WALL)' : 'DIFFUSER OFF'}
              selected={diffuser}
              onPress={() => setDiffuser(!diffuser)}
              onLongPress={() => p.help('diffusion')}
            />
          </View>
        </>
      }
      mistakes={<MistakesCard items={DIFFUSION_MISTAKES} />}
      check={<CheckQuestion spec={DIFFUSION_CHECK} />}
    />
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 4 — REFRACTION LABORATORY (§9.4)

const REFRACTION_MISTAKES = [
  'Thinking sound only travels straight — gradients bend it.',
  'Confusing refraction (gradual bending through a medium) with reflection or diffraction.',
  'Not grasping why sound carries far at night/over water — the inversion bends it DOWN.',
  'Assuming wind "blows sound" — it is the GRADIENT → upwind/downwind asymmetry.',
];

const REFRACTION_CHECK: CheckSpec = {
  question: 'An outdoor concert across a lake sounds startlingly close at night. Why?',
  options: [
    'Water reflects sound like a mirror straight to you',
    'Cool air at the surface under warmer air bends the sound back down toward the water',
    'Night air is denser, so sound is simply louder',
    'The wind carries the sound at its own speed',
  ],
  correctIdx: 1,
  reveal:
    'A temperature INVERSION: the water cools the air at the surface while the air above stays warm. Sound runs faster in the warm layer aloft, so wavefronts tilt and rays curve back DOWN instead of lifting away — energy that would have escaped overhead returns to ear level, kilometer after kilometer.',
  wrongHint: 'Think about which layer of air is faster — and which way that bends the ray.',
};

export function RefractionModule(p: WaveModuleProps) {
  const viz = useState(() => requireWaveViz())[0];
  const [grad, setGrad] = useState(0.5); // −1 lapse … +1 inversion (snapped 0.05)
  const [wind, setWind] = useState(0); // 0..1 shear (snapped 0.05)

  const tempC = 20;
  const tempAloft = tempC + grad * 8; // disclosed teaching model: ±8 °C aloft
  const cGround = speedOfSound(tempC);
  const cAloft = speedOfSound(tempAloft);
  const rayH = refractedRayHeight(2, 150, grad * 0.08, tempC);
  const bend =
    grad > 0.1 ? 'DOWN — SOUND CARRIES' : grad < -0.1 ? 'UP — LIFTS OVER HEADS' : 'STRAIGHT';

  const readouts = [
    { k: 'c @ GROUND (20 °C)', v: `${cGround.toFixed(1)} m/s` },
    { k: `c ALOFT (${tempAloft.toFixed(0)} °C)`, v: `${cAloft.toFixed(1)} m/s` },
    { k: 'BEND DIRECTION', v: bend },
    { k: 'RAY @ 150 m (FROM 2 m)', v: rayH <= 0 ? 'AT THE GROUND — HEARD' : `${rayH.toFixed(1)} m UP` },
  ];

  return (
    <WaveLayout
      explain={
        <PanelCard>
          <Text style={dstyles.eyebrow}>WHY SOUND CARRIES AT NIGHT AND OVER WATER</Text>
          <Text style={dstyles.body}>
            Sound runs faster in warm air. Daytime (LAPSE — warm ground, cool aloft) the upper part of
            each wavefront lags, tilting rays UP and away: the show gets quiet two fields over. At
            night, and especially over water, the surface air cools under a warm layer (INVERSION):
            now the wavefront tops run faster, rays curve back DOWN, and sound that should have
            escaped overhead lands at ear level far away. Same source, same level — the atmosphere is
            the lens.
          </Text>
          <Text style={dstyles.eyebrow}>WIND DOES NOT BLOW SOUND — GRADIENTS BEND IT</Text>
          <Text style={dstyles.body}>
            Wind moves at a few m/s; sound at ~343 m/s — the breeze cannot carry it anywhere. What
            matters is wind SHEAR: wind is faster aloft, so downwind the effective sound speed grows
            with height (bends rays down — louder) while upwind it shrinks with height (bends rays up
            — quieter). The upwind/downwind asymmetry at every outdoor show is refraction, not
            transport.
          </Text>
        </PanelCard>
      }
      readouts={<ReadoutGrid items={readouts} help={p.help} helpKey="refraction" />}
      display={
        <>
          {viz ? (
            <GradientView viz={viz} width={p.width} focused={p.focused} gradient01={grad} wind01={wind} />
          ) : (
            <VizUnavailableCard />
          )}
          <Badge text={HONESTY} />
          <Badge text="LINEAR-GRADIENT RAY MODEL — ALOFT ≈ ±8 °C AT HEIGHT (DISCLOSED TEACHING SCALE)" />
        </>
      }
      guide={<DisplayGuideButton onPress={() => p.help('refraction')} />}
      controls={
        <>
          <DragSlider
            value={(grad + 1) / 2}
            onChange={(v) => setGrad(clampSnap(v * 2 - 1, -1, 1))}
            label="GRADIENT — LAPSE ↔︎ INVERSION"
            readout={grad > 0.1 ? 'INVERSION (warm aloft)' : grad < -0.1 ? 'LAPSE (cool aloft)' : 'NEUTRAL'}
            onHelp={() => p.help('refraction')}
          />
          <DragSlider
            value={wind}
            onChange={(v) => setWind(clampSnap(v, 0, 1))}
            label="WIND SHEAR"
            readout={wind < 0.05 ? 'CALM' : `${(wind * 12).toFixed(0)} m/s aloft`}
            onHelp={() => p.help('refraction')}
          />
        </>
      }
      mistakes={<MistakesCard items={REFRACTION_MISTAKES} />}
      check={<CheckQuestion spec={REFRACTION_CHECK} />}
    />
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 5 — DIFFRACTION LABORATORY (§9.5)

const DIFFRACTION_MISTAKES = [
  'Thinking a barrier fully blocks sound — lows WRAP AROUND; only highs are shadowed.',
  'Weak wavelength intuition — long wavelengths diffract around objects near/smaller than the wavelength.',
  'Expecting a small object to block bass.',
  'Believing a "shadow zone" is silence — it is attenuation, mostly of highs.',
];

const DIFFRACTION_CHECK: CheckSpec = {
  question: 'Standing well behind a tall highway noise barrier, what do you actually hear?',
  options: [
    'Silence — the wall blocks the road completely',
    'Mostly the low rumble — long wavelengths bend over the top; the highs are shadowed',
    'Mostly tire hiss — highs bend over the top; the lows are blocked',
    'Exactly the same as without the barrier',
  ],
  correctIdx: 1,
  reveal:
    'Wavelength decides. An 80 Hz rumble is ~4.3 m long — comparable to the barrier itself — and wraps over the edge nearly unbothered. A 4 kHz hiss is 8.6 cm and casts a real shadow. Compare the LOSS @ 80 HZ and LOSS @ 8 KHZ readouts: the shadow zone is a high-frequency dimmer, never an off switch.',
  wrongHint: 'Which wavelength is comparable to the barrier — the rumble’s or the hiss’s?',
};

export function DiffractionModule(p: WaveModuleProps) {
  const viz = useState(() => requireWaveViz())[0];
  const [barrierH, setBarrierH] = useState(4); // meters 2..8, snapped 0.05
  const [freq, setFreq] = useState(1000);

  const tempC = 20;
  const lambda = speedOfSound(tempC) / freq;
  // Fixed side-view geometry (disclosed): source 10 m before the barrier,
  // listener 10 m beyond, both at 1.5 m — Maekawa knife-edge over the top.
  const pathDirect = 20;
  const pathOver = 2 * Math.hypot(10, barrierH - 1.5);
  const delta = pathOver - pathDirect;
  const N = (2 * delta) / lambda;
  const loss = maekawaAttenuationDb(pathOver, pathDirect, freq, tempC);

  const readouts = [
    { k: 'WAVELENGTH', v: fmtM(lambda) },
    { k: 'BARRIER HEIGHT', v: fmtM(barrierH) },
    { k: 'DETOUR OVER TOP δ', v: `+${delta.toFixed(2)} m` },
    { k: 'FRESNEL N (2δ/λ)', v: N.toFixed(2) },
    { k: `LOSS @ ${fmtHz(freq)}`, v: `${loss.toFixed(1)} dB` },
    { k: 'LOSS @ 80 HZ', v: `${maekawaAttenuationDb(pathOver, pathDirect, 80, tempC).toFixed(1)} dB` },
    { k: 'LOSS @ 8 KHZ', v: `${maekawaAttenuationDb(pathOver, pathDirect, 8000, tempC).toFixed(1)} dB` },
  ];

  return (
    <WaveLayout
      explain={
        <PanelCard>
          <Text style={dstyles.eyebrow}>LOWS WRAP, HIGHS SHADOW</Text>
          <Text style={dstyles.body}>
            Waves bend around anything comparable to or smaller than their own wavelength. Slide the
            frequency: at 80 Hz (λ ≈ 4.3 m) the wave barely notices a 4 m wall — the detour over the
            top is a tiny fraction of a wavelength, so the loss stays small. At 8 kHz (λ ≈ 4 cm) the
            same detour is hundreds of wavelengths and the shadow gets deep. One barrier, one
            geometry — the wavelength alone decides who gets through.
          </Text>
          <Text style={dstyles.eyebrow}>A SHADOW ZONE IS NOT SILENCE</Text>
          <Text style={dstyles.body}>
            Even at its best, the barrier ATTENUATES — the Maekawa numbers top out around 20-something
            dB, and mostly on the highs. Behind any wall you keep the rumble and lose the sparkle.
            That is also why a pillar in front of the PA punches a hole in the highs for the seats
            behind it while the bass sails around as if it weren’t there.
          </Text>
        </PanelCard>
      }
      readouts={<ReadoutGrid items={readouts} help={p.help} helpKey="diffraction" />}
      display={
        <>
          {viz ? (
            <BarrierView
              viz={viz}
              width={p.width}
              focused={p.focused}
              freq={freq}
              barrierH01={(barrierH - 2) / 6}
            />
          ) : (
            <VizUnavailableCard />
          )}
          <Badge text={HONESTY} />
          <Badge text="MAEKAWA KNIFE-EDGE · FIXED GEOMETRY: SOURCE 10 m BEFORE THE BARRIER, LISTENER 10 m BEYOND, BOTH AT 1.5 m" />
        </>
      }
      guide={<DisplayGuideButton onPress={() => p.help('diffraction')} />}
      controls={
        <>
          <DragSlider
            value={(barrierH - 2) / 6}
            onChange={(v) => setBarrierH(clampSnap(2 + v * 6, 2, 8))}
            label="BARRIER HEIGHT"
            readout={fmtM(barrierH)}
            onHelp={() => p.help('diffraction')}
          />
          <DragSlider
            value={logFrac(freq, 63, 8000)}
            onChange={(v) => setFreq(fracLog(v, 63, 8000))}
            label="FREQUENCY"
            readout={fmtHz(freq)}
            onHelp={() => p.help('diffraction')}
          />
        </>
      }
      mistakes={<MistakesCard items={DIFFRACTION_MISTAKES} />}
      check={<CheckQuestion spec={DIFFRACTION_CHECK} />}
    />
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 6 — INTERFERENCE LABORATORY (§9.6)

const INTERFERENCE_MISTAKES = [
  'Treating constructive/destructive as simply "loud/quiet" regardless of frequency + position.',
  'Thinking nulls are everywhere — they are POSITION + FREQUENCY specific.',
  'Forgetting that moving the listener changes the pattern.',
  'Assuming two sources always sum to +6 dB (only in-phase at that point).',
];

const INTERFERENCE_CHECK: CheckSpec = {
  question: 'You find a dead spot at 500 Hz between two speakers. You step half a meter sideways. Now what?',
  options: [
    'Still dead — a null kills that frequency everywhere in the room',
    'The null moves — cancellation depends on THIS position and THIS frequency',
    'All frequencies are now cancelled',
    'Both speakers get louder',
  ],
  correctIdx: 1,
  reveal:
    'A null is a place where the two path lengths differ by an odd half-wavelength AT THAT FREQUENCY. Step aside and the path difference changes: the 500 Hz null relocates while other frequencies null where you just stood. Drag the listener through the HEAT map and watch the bands slide under it.',
  wrongHint: 'What did your step change — the sources, or the two path lengths?',
};

export function InterferenceModule(p: WaveModuleProps) {
  const viz = useState(() => requireWaveViz())[0];
  const [scene, setScene] = useState<WaveScene>(() => ({
    w: 8,
    h: 6,
    // 'open' boundaries (α = 1) → image gains 0 → honest FREE FIELD: only the
    // two direct waves interfere.
    boundary: ['open', 'open', 'open', 'open'],
    sources: [pt('s1', 2.5, 3, 500), pt('s2', 5.5, 3, 500)],
    listener: { x: 4, y: 4.5 },
    tempC: 20,
  }));
  const [layers, setLayers] = useState<WaveLayers>({ pressure: true, heat: true, rays: false, arrivals: false });
  const { onDragSource, onDragListener } = useSceneDrag(setScene);

  const s1 = scene.sources[0];
  const s2 = scene.sources[1];
  const freq = s1.freq;
  const setFreq = (f: number) =>
    setScene((sc) => ({ ...sc, sources: sc.sources.map((s) => ({ ...s, freq: f })) }));
  const setDelay = (ms: number) =>
    setScene((sc) => ({
      ...sc,
      sources: sc.sources.map((s) => (s.id === 's2' ? { ...s, delayMs: ms } : s)),
    }));
  const flipPolarity = () =>
    setScene((sc) => ({
      ...sc,
      sources: sc.sources.map((s) => (s.id === 's2' ? { ...s, polarity: s.polarity === 1 ? -1 : 1 } : s)),
    }));

  const { x: lx, y: ly } = scene.listener;
  const c = speedOfSound(scene.tempC);
  const lambda = c / freq;
  const r1 = Math.hypot(lx - s1.x, ly - s1.y);
  const r2 = Math.hypot(lx - s2.x, ly - s2.y);
  const images = useMemo(
    () => scene.sources.map((s) => imageSources(scene, s, freq, 1)),
    [scene, freq],
  );
  const level = fieldDb(fieldAt(scene, lx, ly, freq, images));
  let phi =
    (2 * Math.PI * freq * ((r2 - r1) / c + s2.delayMs / 1000) + (s2.polarity === -1 ? Math.PI : 0)) %
    (2 * Math.PI);
  if (phi < 0) phi += 2 * Math.PI;
  const phiDeg = (phi * 180) / Math.PI;

  const readouts = [
    { k: 'PATH FROM S1', v: fmtM(r1) },
    { k: 'PATH FROM S2', v: fmtM(r2) },
    { k: 'PATH DIFFERENCE', v: `${(r2 - r1).toFixed(2)} m · ${((r2 - r1) / lambda).toFixed(2)} λ` },
    { k: 'PHASE DIFF @ LISTENER', v: `${phiDeg.toFixed(0)}°` },
    { k: 'LEVEL @ LISTENER', v: fmtDb(level) },
  ];

  return (
    <WaveLayout
      explain={
        <PanelCard>
          <Text style={dstyles.eyebrow}>NULLS ARE APPOINTMENTS — A PLACE AND A FREQUENCY</Text>
          <Text style={dstyles.body}>
            Where the two paths differ by whole wavelengths the waves arrive in step and ADD — up to
            +6 dB over one source. Where they differ by an odd half-wavelength they arrive opposed and
            CANCEL. Neither is a property of the room or the speakers alone: change the frequency, the
            delay, the polarity, or simply where you stand, and the whole HEAT map redraws. A null is
            not "the sound is quiet" — it is "these two arrivals disagree HERE, at THIS frequency."
          </Text>
          <Text style={dstyles.eyebrow}>+6 dB IS EARNED, NOT AUTOMATIC</Text>
          <Text style={dstyles.body}>
            Two sources only sum fully where they arrive in phase. Every other spot gets something
            between +6 dB and a dead null — which is exactly why system techs walk the venue instead
            of trusting one measurement position.
          </Text>
        </PanelCard>
      }
      readouts={<ReadoutGrid items={readouts} help={p.help} helpKey="interference" />}
      layers={<LayerChips layers={layers} onChange={setLayers} help={p.help} />}
      display={
        <>
          {viz ? (
            <RoomView
              viz={viz}
              width={p.width}
              focused={p.focused}
              scene={scene}
              freq={freq}
              layers={layers}
              onDragSource={onDragSource}
              onDragListener={onDragListener}
            />
          ) : (
            <VizUnavailableCard />
          )}
          <Badge text={HONESTY} />
          <Badge text="BOUNDARIES SET TO OPENINGS (FREE FIELD) — ONLY THE TWO DIRECT WAVES INTERFERE · LEVEL IS dB RE ONE SOURCE AT 1 m" />
          <Text style={dstyles.caption}>
            Drag BOTH sources and the listener. Source 2 carries the delay and polarity controls.
          </Text>
        </>
      }
      guide={<DisplayGuideButton onPress={() => p.help('layers')} />}
      controls={
        <>
          <DragSlider
            value={s2.delayMs / 10}
            onChange={(v) => setDelay(Math.round(v * 100) / 10)}
            label="DELAY — S2"
            readout={`${s2.delayMs.toFixed(1)} ms`}
            onHelp={() => p.help('interference')}
          />
          <DragSlider
            value={logFrac(freq, 63, 2000)}
            onChange={(v) => setFreq(Math.max(63, Math.round(fracLog(v, 63, 2000) / 5) * 5))}
            label="OUTPUT FREQUENCY — BOTH SOURCES"
            readout={fmtHz(freq)}
            onHelp={() => p.help('interference')}
          />
          <View style={dstyles.chipRow}>
            <LabChip
              label="POLARITY Ø — S2"
              selected={s2.polarity === -1}
              onPress={flipPolarity}
              onLongPress={() => p.help('interference')}
            />
          </View>
        </>
      }
      mistakes={<MistakesCard items={INTERFERENCE_MISTAKES} />}
      check={<CheckQuestion spec={INTERFERENCE_CHECK} />}
    />
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 7 — COMB FILTERING LABORATORY (§9.7)

const COMB_MISTAKES = [
  'Thinking comb filtering is a tone problem to EQ AWAY — it is position/time-based: fix geometry/timing.',
  'Not realizing a tiny movement shifts the notch frequencies drastically.',
  'Confusing comb filtering (delay+sum) with resonance/room modes.',
  'Ignoring it when using two mics on one source (the 3:1 rule).',
];

const COMB_CHECK: CheckSpec = {
  question: 'A vocal mic near a reflective wall sounds hollow and phasey. The engineering fix is…',
  options: [
    'Boost the notch frequencies with EQ until the response is flat',
    'Move the mic (or treat the wall) — change the geometry that sets the delay',
    'Compress it — dynamics will fill in the notches',
    'Turn the vocal up 6 dB',
  ],
  correctIdx: 1,
  reveal:
    'The notches exist because a delayed copy sums with the direct sound — they are set by the PATH GEOMETRY, and they move the moment the mic does. EQ boost pushes energy into frequencies that still cancel (and wrecks everything at other positions). Press MOVE MIC and watch every notch jump: that is the fix, six inches of it.',
  wrongHint: 'The notches are made of time, not tone. What changes the time?',
};

export function CombModule(p: WaveModuleProps) {
  const viz = useState(() => requireWaveViz())[0];
  const [scene, setScene] = useState<WaveScene>(() => ({
    w: 6,
    h: 4,
    // Only the RIGHT wall reflects — one direct sound + exactly one reflection.
    boundary: ['open', 'concrete', 'open', 'open'],
    sources: [pt('s1', 1, 2, 500)],
    listener: { x: 1.8, y: 2 },
    tempC: 20,
  }));
  const [layers, setLayers] = useState<WaveLayers>({ pressure: true, heat: false, rays: true, arrivals: true });
  const { onDragListener } = useSceneDrag(setScene);

  const freq = scene.sources[0].freq;
  const setRoomW = (w: number) =>
    setScene((sc) => ({
      ...sc,
      w,
      listener: { ...sc.listener, x: Math.min(sc.listener.x, w - 0.3) },
      sources: sc.sources.map((s) => ({ ...s, x: Math.min(s.x, w - 0.6) })),
    }));
  const nudgeMic = (d: number) =>
    setScene((sc) => ({
      ...sc,
      listener: { ...sc.listener, x: clampSnap(sc.listener.x + d, 0.3, sc.w - 0.3) },
    }));

  const { x: lx, y: ly } = scene.listener;
  const arrivals = useMemo(() => arrivalsAt(scene, lx, ly, freq, 1), [scene, lx, ly, freq]);
  const direct = arrivals.find((a) => a.bounces.length === 0);
  const wallRef = arrivals.find((a) => a.bounces.length === 1 && a.bounces[0] === 1);
  const dt = direct && wallRef ? wallRef.t - direct.t : 0;
  const firstNull = dt > 0 ? 1 / (2 * dt) : 0;
  const spacing = dt > 0 ? 1 / dt : 0;

  // Response at the listener, normalized to the direct-sound-only level so the
  // comb reads around 0 dB. All physics via responseAt (waveEngine).
  const rDirect = Math.max(0.15, direct ? direct.pathLen : 0.15);
  const directDb = 20 * Math.log10(1 / rDirect);
  const curves = useMemo<ResponseCurve[]>(
    () => [{ at: (f: number) => responseAt(scene, lx, ly, f, 1) - directDb, emphasis: 'main' }],
    [scene, lx, ly, directDb],
  );

  const readouts = [
    { k: 'REFLECTION DELAY', v: dt > 0 ? `${(dt * 1000).toFixed(2)} ms` : '—' },
    { k: 'EXTRA PATH', v: direct && wallRef ? `+${(wallRef.pathLen - direct.pathLen).toFixed(2)} m` : '—' },
    { k: 'FIRST NULL', v: firstNull > 0 ? fmtHz(firstNull) : '—' },
    { k: 'NOTCH SPACING', v: spacing > 0 ? fmtHz(spacing) : '—' },
    { k: 'MIC → WALL', v: fmtM(scene.w - lx) },
  ];

  return (
    <WaveLayout
      explain={
        <PanelCard>
          <Text style={dstyles.body}>
            The direct sound and its one reflection sum at every frequency — in phase they add, an odd
            half-cycle apart they cancel. The result is a comb: the first notch sits at 1/(2Δt) and
            its brothers repeat every 1/Δt above it. Move the wall and the whole comb stretches; press
            MOVE MIC — six inches, 0.15 m — and every notch jumps to a new frequency. That is the
            payoff line of this module: you cannot EQ a comb away, but you can MOVE it away.
          </Text>
          <Text style={dstyles.eyebrow}>WHERE YOU WILL MEET IT</Text>
          <Text style={dstyles.body}>
            A mic near a music stand, a podium mic over a hard desk, two open mics on one source (keep
            the second mic at least 3× the source distance away — the 3:1 rule), a speaker against a
            bare wall. Comb filtering is delay-plus-sum, not resonance: the room stores nothing here —
            unlike the standing waves of Module 8.
          </Text>
        </PanelCard>
      }
      readouts={<ReadoutGrid items={readouts} help={p.help} helpKey="comb" />}
      layers={<LayerChips layers={layers} onChange={setLayers} help={p.help} raysKey="image_source" />}
      display={
        <>
          {viz ? (
            <RoomView
              viz={viz}
              width={p.width}
              focused={p.focused}
              scene={scene}
              freq={freq}
              layers={layers}
              onDragListener={onDragListener}
            />
          ) : (
            <VizUnavailableCard />
          )}
          <Badge text={HONESTY} />
          <Badge text="ONE SOURCE + ONE REFLECTIVE WALL (RIGHT) — THE OTHER BOUNDARIES ARE OPENINGS" />
        </>
      }
      secondary={
        <>
          <Text style={dstyles.eyebrow}>RESPONSE AT THE LISTENER — 100 Hz TO 8 kHz AND BEYOND</Text>
          <ResponseCurveGraph curves={curves} dbRange={18} height={150} />
          <Badge text="COMPUTED FROM THE SCENE’S DIRECT + REFLECTED ARRIVALS (responseAt) · 0 dB = DIRECT SOUND ALONE" />
        </>
      }
      guide={<DisplayGuideButton onPress={() => p.help('comb')} />}
      controls={
        <>
          <DragSlider
            value={(scene.w - 3) / 7}
            onChange={(v) => setRoomW(clampSnap(3 + v * 7, 3, 10))}
            label="MOVE THE WALL — ROOM WIDTH"
            readout={fmtM(scene.w)}
            onHelp={() => p.help('comb')}
          />
          <View style={dstyles.chipRow}>
            <LabChip label="MOVE MIC ← 0.15 m" selected={false} onPress={() => nudgeMic(-0.15)} onLongPress={() => p.help('comb')} />
            <LabChip label="MOVE MIC → 0.15 m" selected={false} onPress={() => nudgeMic(0.15)} onLongPress={() => p.help('comb')} />
          </View>
        </>
      }
      mistakes={<MistakesCard items={COMB_MISTAKES} />}
      check={<CheckQuestion spec={COMB_CHECK} />}
    />
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 8 — STANDING WAVE LABORATORY (§9.8)

const MODE_LIST: { nx: number; ny: number }[] = [
  { nx: 1, ny: 0 }, { nx: 0, ny: 1 }, { nx: 1, ny: 1 }, { nx: 2, ny: 0 }, { nx: 2, ny: 1 }, { nx: 3, ny: 0 },
];

const STANDING_MISTAKES = [
  'Thinking modes are about absorption — they are about DIMENSIONS/GEOMETRY.',
  'Confusing NODES (pressure min) with ANTINODES (pressure max) — a mic at a node misses that frequency.',
  'Believing bass traps "remove" modes — they DAMP, not eliminate.',
  'Expecting modes to matter at high frequencies — they dominate the low end, below the Schroeder frequency.',
];

const STANDING_CHECK: CheckSpec = {
  question: 'A kick drum mic ends up parked at a NODE of the room’s 80 Hz mode. The recording…',
  options: [
    'Booms at 80 Hz — nodes are the loud spots',
    'Nearly loses 80 Hz at that spot — the mode’s pressure minimum lives there',
    'Loses all bass below 200 Hz',
    'Is unaffected — modes only exist at the walls',
  ],
  correctIdx: 1,
  reveal:
    'A node is the mode’s pressure MINIMUM: at that spot the 80 Hz component barely exists to be captured, however loud it booms elsewhere. Antinodes (walls, corners) are the maxima. Drag the listener across the map and watch the verdict flip — that is why moving a mic or a chair half a meter can transform the bass.',
  wrongHint: 'Node = pressure minimum. What does a pressure mic capture there?',
};

export function StandingWaveModule(p: WaveModuleProps) {
  const viz = useState(() => requireWaveViz())[0];
  const [scene, setScene] = useState<WaveScene>(() => ({
    w: 5,
    h: 4,
    boundary: ['concrete', 'concrete', 'concrete', 'concrete'],
    sources: [pt('s1', 0.35, 0.35, 100)],
    listener: { x: 2.5, y: 2 },
    tempC: 20,
  }));
  const [modeIdx, setModeIdx] = useState(0);
  const { onDragListener } = useSceneDrag(setScene);
  const layers: WaveLayers = { pressure: false, heat: true, rays: false, arrivals: false };

  const { nx, ny } = MODE_LIST[modeIdx];
  const freq = modeFrequency(scene, nx, ny);
  const lambda = speedOfSound(scene.tempC) / freq;
  const { x: lx, y: ly } = scene.listener;
  const pressure = modePressure(scene, nx, ny, lx, ly);
  const mag = Math.abs(pressure);
  const verdict = mag < 0.2 ? 'NODE — QUIET AT THIS ƒ' : mag > 0.8 ? 'ANTINODE — MAXIMUM' : 'BETWEEN';
  // Schroeder estimate from the engine's Sabine RT (disclosed teaching figure).
  const schroeder = 2000 * Math.sqrt(sabineRT(scene, 500) / (scene.w * scene.h * 3));

  const setW = (w: number) =>
    setScene((sc) => ({ ...sc, w, listener: { ...sc.listener, x: Math.min(sc.listener.x, w - 0.3) } }));
  const setH = (h: number) =>
    setScene((sc) => ({ ...sc, h, listener: { ...sc.listener, y: Math.min(sc.listener.y, h - 0.3) } }));

  const readouts = [
    { k: `MODE (${nx},${ny})`, v: fmtHz(freq) },
    { k: 'TYPE', v: nx > 0 && ny > 0 ? 'TANGENTIAL (4 WALLS)' : 'AXIAL (2 WALLS)' },
    { k: 'WAVELENGTH', v: fmtM(lambda) },
    { k: 'LISTENER PRESSURE', v: `${(mag * 100).toFixed(0)} % OF MAX` },
    { k: 'VERDICT', v: verdict },
    { k: 'SCHROEDER ≈', v: fmtHz(schroeder) },
  ];

  return (
    <WaveLayout
      explain={
        <PanelCard>
          <Text style={dstyles.eyebrow}>NODES vs ANTINODES — POSITION IS EVERYTHING</Text>
          <Text style={dstyles.body}>
            At a mode frequency the room’s reflections stack into a STATIONARY pressure pattern:
            maxima at the walls and corners (antinodes), near-silence along the null lines (nodes).
            Drag the listener across the map and watch the readout swing from MAXIMUM to QUIET without
            the source changing at all. A mic at a node simply misses that frequency; a listening
            chair at an antinode drowns in it. Resize the room and every mode frequency moves —
            modes are made of DIMENSIONS, not materials.
          </Text>
          <Text style={dstyles.eyebrow}>TRAPS DAMP · SCHROEDER BOUNDS</Text>
          <Text style={dstyles.body}>
            Bass traps do not delete a mode — they absorb energy each cycle so it rings down faster
            and its peaks flatten: DAMPED, never eliminated. The geometry (and thus the frequency)
            stays. And modes are a LOW-frequency story: above the Schroeder frequency (estimated in
            the readouts from this room’s RT and volume) the mode density is so high that discrete
            patterns blur into a statistical reverberant field — nobody chases the (47, 12) mode at
            5 kHz.
          </Text>
        </PanelCard>
      }
      readouts={<ReadoutGrid items={readouts} help={p.help} helpKey="standing_wave" />}
      layers={
        <View style={dstyles.chipRow}>
          {MODE_LIST.map((m, i) => (
            <LabChip
              key={`${m.nx}-${m.ny}`}
              label={`(${m.nx},${m.ny})`}
              selected={modeIdx === i}
              onPress={() => setModeIdx(i)}
              onLongPress={() => p.help('standing_wave')}
            />
          ))}
        </View>
      }
      display={
        <>
          {viz ? (
            <RoomView
              viz={viz}
              width={p.width}
              focused={p.focused}
              scene={scene}
              freq={freq}
              layers={layers}
              mode="modal"
              modal={{ nx, ny }}
              onDragListener={onDragListener}
            />
          ) : (
            <VizUnavailableCard />
          )}
          <Badge text={HONESTY} />
          <Badge text="MODAL PRESSURE MAP — BRIGHT = ANTINODE (PRESSURE MAX), DARK = NODE (PRESSURE MIN) · DRAG THE LISTENER THROUGH IT" />
        </>
      }
      guide={<DisplayGuideButton onPress={() => p.help('standing_wave')} />}
      controls={
        <>
          <DragSlider
            value={(scene.w - 2) / 8}
            onChange={(v) => setW(clampSnap(2 + v * 8, 2, 10))}
            label="ROOM WIDTH"
            readout={fmtM(scene.w)}
            onHelp={() => p.help('room_builder')}
          />
          <DragSlider
            value={(scene.h - 2) / 8}
            onChange={(v) => setH(clampSnap(2 + v * 8, 2, 10))}
            label="ROOM DEPTH"
            readout={fmtM(scene.h)}
            onHelp={() => p.help('room_builder')}
          />
        </>
      }
      mistakes={<MistakesCard items={STANDING_MISTAKES} />}
      check={<CheckQuestion spec={STANDING_CHECK} />}
    />
  );
}
