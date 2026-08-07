/**
 * MultiBand — EQ Lab lesson 9 (owner spec 2026-08-07): a realistic multi-band
 * parametric — HPF | LOW | LMF | HMF | HIGH | LPF — with the spec's key
 * visual: every enabled band's OWN curve (ghosts) plus the resulting COMBINED
 * response (amber). Filters interact; the composite is the point.
 *
 * Nodes drag DIRECTLY on the graph (spec): touch grabs the nearest enabled
 * band; horizontal = frequency, vertical = gain (bells). Per-band ON/OFF,
 * whole-EQ BYPASS, RESET. No solo — auditioning arrives with the audio build.
 */
import { useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { ResponseCurveGraph, eqResponseDb, type EqBandSpec, type ResponseCurve } from '../../../../features/lab/fxViz';
import { DragSlider } from '../../foundations/bits';
import { useScrollLock } from '../../LabShell';
import { MiniBtn } from './eqBits';
import { colors, fonts } from '../../../../theme/tokens';
import { bwOctFromQ, fmtHz, normFromF, fFromNorm } from './eqMath';
import type { EqModuleComponentProps } from './registry';

// ---- Graph geometry (mirrors ResponseCurveGraph: viewBox 320, pad 8) -------
const VB_W = 320;
const PAD = 8;
const GRAPH_H = 150;
const PAD_B = 14;
const DB_RANGE = 18;
const xVbForF = (f: number) => PAD + ((Math.log10(f) - Math.log10(20)) / 3) * (VB_W - 2 * PAD);
const yVbForDb = (db: number) =>
  GRAPH_H / 2 - (Math.max(-DB_RANGE, Math.min(DB_RANGE, db)) / DB_RANGE) * (GRAPH_H / 2 - 8);
const fForXVb = (x: number) =>
  Math.max(20, Math.min(20000, 20 * Math.pow(10, ((x - PAD) / (VB_W - 2 * PAD)) * 3)));
const dbForYVb = (y: number) =>
  Math.max(-DB_RANGE, Math.min(DB_RANGE, ((GRAPH_H / 2 - y) / (GRAPH_H / 2 - 8)) * DB_RANGE));

type BandKey = 'hpf' | 'b0' | 'b1' | 'b2' | 'b3' | 'lpf';
type Bands = {
  hpf: { on: boolean; f: number };
  lpf: { on: boolean; f: number };
  bells: { on: boolean; f: number; g: number; q: number }[];
};

const DEFAULTS = (): Bands => ({
  hpf: { on: false, f: 80 },
  lpf: { on: false, f: 12000 },
  bells: [
    { on: true, f: 120, g: 0, q: 1 },
    { on: true, f: 500, g: 0, q: 1 },
    { on: true, f: 2000, g: 0, q: 1 },
    { on: true, f: 8000, g: 0, q: 1 },
  ],
});

const BAND_META: { key: BandKey; label: string }[] = [
  { key: 'hpf', label: 'HPF' },
  { key: 'b0', label: 'LOW' },
  { key: 'b1', label: 'LMF' },
  { key: 'b2', label: 'HMF' },
  { key: 'b3', label: 'HIGH' },
  { key: 'lpf', label: 'LPF' },
];

function specsFor(b: Bands): EqBandSpec[] {
  const out: EqBandSpec[] = [];
  if (b.hpf.on) out.push({ type: 'highPass', freq: b.hpf.f, q: 0.707, gainDb: 0 });
  for (const bell of b.bells) if (bell.on) out.push({ type: 'peak', freq: bell.f, q: bell.q, gainDb: bell.g });
  if (b.lpf.on) out.push({ type: 'lowPass', freq: b.lpf.f, q: 0.707, gainDb: 0 });
  return out;
}

export function MultiBandModule(_p: EqModuleComponentProps) {
  const [bands, setBands] = useState<Bands>(DEFAULTS);
  const [sel, setSel] = useState<BandKey>('b1');
  const [bypass, setBypass] = useState(false);

  const bandsRef = useRef(bands);
  bandsRef.current = bands;
  const selRef = useRef(sel);
  selRef.current = sel;

  // ---- Direct node dragging on the graph (spec: "drag nodes directly") ----
  const [layoutW, setLayoutW] = useState(0);
  const layoutRef = useRef(0);
  layoutRef.current = layoutW;
  const ctxLock = useScrollLock();
  const lockRef = useRef(ctxLock);
  lockRef.current = ctxLock;

  const toVb = (lx: number, ly: number) => {
    const w = layoutRef.current || VB_W;
    const s = Math.min(w / VB_W, 1);
    const ox = (w - VB_W * s) / 2;
    const oy = ((GRAPH_H + PAD_B) * (1 - s)) / 2;
    return { x: (lx - ox) / s, y: (ly - oy) / s };
  };

  const applyDrag = (xVb: number, yVb: number) => {
    const key = selRef.current;
    const f = fForXVb(xVb);
    setBands((prev) => {
      if (key === 'hpf') return { ...prev, hpf: { ...prev.hpf, f } };
      if (key === 'lpf') return { ...prev, lpf: { ...prev.lpf, f } };
      const i = Number(key.slice(1));
      const g = Math.round(dbForYVb(yVb) * 2) / 2;
      return { ...prev, bells: prev.bells.map((b, k) => (k === i ? { ...b, f, g } : b)) };
    });
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        lockRef.current?.(true);
        const { x, y } = toVb(e.nativeEvent.locationX, e.nativeEvent.locationY);
        // Grab the nearest ENABLED band node by horizontal distance.
        const b = bandsRef.current;
        const cands: { key: BandKey; x: number }[] = [];
        if (b.hpf.on) cands.push({ key: 'hpf', x: xVbForF(b.hpf.f) });
        if (b.lpf.on) cands.push({ key: 'lpf', x: xVbForF(b.lpf.f) });
        b.bells.forEach((bell, i) => {
          if (bell.on) cands.push({ key: `b${i}` as BandKey, x: xVbForF(bell.f) });
        });
        if (!cands.length) return;
        let best = cands[0];
        for (const c of cands) if (Math.abs(c.x - x) < Math.abs(best.x - x)) best = c;
        selRef.current = best.key;
        setSel(best.key);
        applyDrag(x, y);
      },
      onPanResponderMove: (e) => {
        const { x, y } = toVb(e.nativeEvent.locationX, e.nativeEvent.locationY);
        applyDrag(x, y);
      },
      onPanResponderRelease: () => lockRef.current?.(false),
      onPanResponderTerminate: () => lockRef.current?.(false),
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  const curves = useMemo<ResponseCurve[]>(() => {
    const list: ResponseCurve[] = [];
    const b = bands;
    const each: EqBandSpec[][] = [];
    if (b.hpf.on) each.push([{ type: 'highPass', freq: b.hpf.f, q: 0.707, gainDb: 0 }]);
    for (const bell of b.bells) if (bell.on && bell.g !== 0) each.push([{ type: 'peak', freq: bell.f, q: bell.q, gainDb: bell.g }]);
    if (b.lpf.on) each.push([{ type: 'lowPass', freq: b.lpf.f, q: 0.707, gainDb: 0 }]);
    for (const spec of each) list.push({ at: (f: number) => eqResponseDb(spec, f), emphasis: 'ghost' });
    const all = specsFor(b);
    if (bypass) {
      // Bypassed: the would-be composite stays as a dim reference, output flat.
      list.push({ at: (f: number) => eqResponseDb(all, f), emphasis: 'ref' });
      list.push({ at: () => 0, emphasis: 'main' });
    } else {
      list.push({ at: (f: number) => eqResponseDb(all, f), emphasis: 'main' });
    }
    return list;
  }, [bands, bypass]);

  // Node markers, drawn over the graph in the SAME viewBox (stays aligned).
  const nodes = useMemo(() => {
    const b = bands;
    const out: { key: BandKey; x: number; y: number }[] = [];
    if (b.hpf.on) out.push({ key: 'hpf', x: xVbForF(b.hpf.f), y: yVbForDb(0) });
    if (b.lpf.on) out.push({ key: 'lpf', x: xVbForF(b.lpf.f), y: yVbForDb(0) });
    b.bells.forEach((bell, i) => {
      if (bell.on) out.push({ key: `b${i}` as BandKey, x: xVbForF(bell.f), y: yVbForDb(bell.g) });
    });
    return out;
  }, [bands]);

  const isBell = sel.startsWith('b');
  const bellIdx = isBell ? Number(sel.slice(1)) : -1;
  const selBell = isBell ? bands.bells[bellIdx] : null;
  const selOn = sel === 'hpf' ? bands.hpf.on : sel === 'lpf' ? bands.lpf.on : bands.bells[bellIdx].on;
  const selF = sel === 'hpf' ? bands.hpf.f : sel === 'lpf' ? bands.lpf.f : bands.bells[bellIdx].f;

  const setSelF = (f: number) =>
    setBands((prev) =>
      sel === 'hpf'
        ? { ...prev, hpf: { ...prev.hpf, f } }
        : sel === 'lpf'
          ? { ...prev, lpf: { ...prev.lpf, f } }
          : { ...prev, bells: prev.bells.map((b, k) => (k === bellIdx ? { ...b, f } : b)) },
    );
  const toggleSel = () =>
    setBands((prev) =>
      sel === 'hpf'
        ? { ...prev, hpf: { ...prev.hpf, on: !prev.hpf.on } }
        : sel === 'lpf'
          ? { ...prev, lpf: { ...prev.lpf, on: !prev.lpf.on } }
          : { ...prev, bells: prev.bells.map((b, k) => (k === bellIdx ? { ...b, on: !b.on } : b)) },
    );

  return (
    <View style={styles.root}>
      <Text style={styles.body}>
        Real EQs run several filters at once — and the filters INTERACT. The dim curves are each
        band alone; the amber curve is what they produce TOGETHER. Drag a node right on the graph:
        sideways = frequency, up/down = gain.
      </Text>

      <View style={styles.chipRow}>
        {BAND_META.map((m) => {
          const on =
            m.key === 'hpf' ? bands.hpf.on : m.key === 'lpf' ? bands.lpf.on : bands.bells[Number(m.key.slice(1))].on;
          return (
            <Pressable
              key={m.key}
              onPress={() => setSel(m.key)}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={`${m.label} band${on ? '' : ', off'}`}
              accessibilityState={{ selected: sel === m.key }}
              style={[styles.chip, sel === m.key && styles.chipActive, !on && styles.chipOff]}
            >
              <Text style={[styles.chipText, sel === m.key && styles.chipTextActive]}>
                {on ? '●' : '○'} {m.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHead}>
          <Text style={styles.panelEyebrow}>BANDS (dim) + COMBINED (amber)</Text>
          <Text style={styles.readout}>{bypass ? 'BYPASSED' : `${specsFor(bands).length} ACTIVE`}</Text>
        </View>
        <View onLayout={(e) => setLayoutW(e.nativeEvent.layout.width)} {...pan.panHandlers}>
          <ResponseCurveGraph curves={curves} dbRange={DB_RANGE} height={GRAPH_H} />
          <Svg
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
            width="100%"
            height={GRAPH_H + PAD_B}
            viewBox={`0 0 ${VB_W} ${GRAPH_H + PAD_B}`}
          >
            {nodes.map((n) => (
              <Circle
                key={n.key}
                cx={n.x}
                cy={n.y}
                r={n.key === sel ? 7 : 5}
                fill={n.key === sel ? colors.amber : 'none'}
                fillOpacity={n.key === sel ? 0.9 : 0}
                stroke={n.key === sel ? colors.amber : '#8f96a3'}
                strokeWidth={1.5}
              />
            ))}
          </Svg>
        </View>
      </View>

      <View style={styles.chipRow}>
        <MiniBtn label={selOn ? 'BAND ON' : 'BAND OFF'} active={selOn} onPress={toggleSel} />
        <MiniBtn label="BYPASS EQ" active={bypass} onPress={() => setBypass((v) => !v)} />
        <MiniBtn label="RESET" onPress={() => { setBands(DEFAULTS()); setBypass(false); }} />
      </View>

      <DragSlider
        label={`${BAND_META.find((m) => m.key === sel)!.label} FREQUENCY`}
        value={normFromF(selF)}
        onChange={(t) => setSelF(fFromNorm(t))}
        readout={fmtHz(selF)}
      />
      {selBell ? (
        <>
          <DragSlider
            label="GAIN"
            value={(selBell.g + DB_RANGE) / (2 * DB_RANGE)}
            onChange={(t) =>
              setBands((prev) => ({
                ...prev,
                bells: prev.bells.map((b, k) =>
                  k === bellIdx ? { ...b, g: Math.round((t * 2 * DB_RANGE - DB_RANGE) * 2) / 2 } : b,
                ),
              }))
            }
            readout={`${selBell.g >= 0 ? '+' : ''}${selBell.g.toFixed(1)} dB`}
          />
          <DragSlider
            label="Q / BANDWIDTH"
            value={Math.log(selBell.q / 0.3) / Math.log(12 / 0.3)}
            onChange={(t) =>
              setBands((prev) => ({
                ...prev,
                bells: prev.bells.map((b, k) =>
                  k === bellIdx ? { ...b, q: 0.3 * Math.pow(12 / 0.3, Math.max(0, Math.min(1, t))) } : b,
                ),
              }))
            }
            readout={`Q ${selBell.q.toFixed(2)} · ${bwOctFromQ(selBell.q).toFixed(2)} oct`}
          />
        </>
      ) : (
        <Text style={styles.caption}>HPF/LPF here are fixed 12 dB/octave — the Slopes lesson covers the rest.</Text>
      )}

      <Text style={styles.caption}>
        Overlap two boosts and the composite rises HIGHER than either band alone; stack a cut into
        a boost’s skirt and they partly cancel. The combined curve — not any single band — is what
        the signal experiences. Band auditioning (solo) arrives with the audio build.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 8, borderWidth: 1, borderColor: '#2c2c33', paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#17171c' },
  chipActive: { borderColor: 'rgba(255,198,77,.55)', backgroundColor: '#1d1708' },
  chipOff: { opacity: 0.55 },
  chipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 0.7, color: colors.textSecondary },
  chipTextActive: { color: colors.amber },
  panel: { borderRadius: 12, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12, gap: 8 },
  panelHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  panelEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1, color: colors.amber, flexShrink: 1 },
  readout: { fontFamily: fonts.mono, fontSize: 11.5, color: colors.textSub },
});
