/**
 * MultiBand — EQ Lab lesson 9 (owner spec 2026-08-07): a realistic multi-band
 * parametric — HPF | LOW | LMF | HMF | HIGH | LPF — with the spec's key
 * visual: every enabled band's OWN curve (ghosts) plus the resulting COMBINED
 * response (amber). Filters interact; the composite is the point.
 *
 * RACK UNIT (APE_LAB_UX_PROPOSAL 2026-08-23): renders the RackUnit frame
 * itself. The node-drag graph is a SPATIAL EDITOR, so it owns the PINNED
 * STAGE — the stage lives outside any ScrollView, which structurally ends the
 * drag-vs-scroll race (corrections-audit #8); the old scroll-lock plumbing is
 * gone. Nodes drag DIRECTLY on the glass (spec): touch grabs the nearest
 * enabled band; horizontal = frequency, vertical = gain (bells). The selected
 * band's FREQ/GAIN/Q ride the dock lane (exact pre-rack mappings); the BAND
 * tray (sticky) carries the colour-coded selectors + per-band ON/OFF + RESET;
 * BYPASS is a dock key for instant in/out A-B. EqAuditionBar plays the
 * composite curve in the well on builds with the FX engine.
 */
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import {
  ResponseCurveGraph,
  eqResponseDb,
  responseGraphDb,
  responseGraphF,
  responseGraphPadB,
  responseGraphTextScale,
  responseGraphX,
  responseGraphY,
  type EqBandSpec,
  type ResponseCurve,
} from '../../../../features/lab/fxViz';
import { MiniBtn } from './eqBits';
import { colors, fonts } from '../../../../theme/tokens';
import { RackUnit } from '../../rack/RackUnit';
import type { DockParam } from '../../rack/rackTypes';
import { bwOctFromQ, fmtHz, gainColor, normFromF, fFromNorm } from './eqMath';
import { GlossaryText } from '../../../../features/glossary/glossaryLink';
import { EqAuditionBar } from './eqAudition';
import type { EqModuleComponentProps } from './registry';
import { CheckQuestion } from '../../foundations/bits';

// ---- Graph geometry — fxViz's own pixel-unit helpers (legibility pass
//      2026-09-26: the graph now draws at the width the glass grants, so the
//      node overlay and the touch mapping use the SAME functions, per surface:
//      the glass and the FULL SCREEN view each have their own size) ----------
const DB_RANGE = 18;
const STAGE_PAD_X = 6;
const xForF = (f: number, gw: number) => responseGraphX(f, gw);
const yForDb = (db: number, gh: number) => responseGraphY(db, gh, DB_RANGE);
const fForX = (x: number, gw: number) => responseGraphF(x, gw);
const dbForY = (y: number, gh: number) => responseGraphDb(y, gh, DB_RANGE);

/** One drag surface = one drawn size. The glass and the full-screen view each
 *  mount their own, so a finger is always mapped through the geometry of the
 *  graph it is actually touching. Anchored drag (owner 2026-08-07): the grant
 *  fixes the start point; moves apply dx/dy — locationX/Y re-base when the
 *  finger leaves the graph, which flung nodes across the plot. */
function NodeDragSurface({
  gw,
  gh,
  onGrab,
  onDrag,
  children,
}: {
  gw: number;
  gh: number;
  /** Touch-down at graph pixel (x, y) on a graph gw × gh. */
  onGrab: (x: number, y: number, gw: number, gh: number) => void;
  onDrag: (x: number, y: number, gw: number, gh: number) => void;
  children: ReactNode;
}) {
  const geom = useRef({ gw, gh });
  geom.current = { gw, gh };
  const cb = useRef({ onGrab, onDrag });
  cb.current = { onGrab, onDrag };
  const anchor = useRef({ x: 0, y: 0 });
  const pan = useRef(
    PanResponder.create({
      // Claim on touch-down: on the pinned stage nothing competes for the
      // gesture, but claiming early keeps the grab instant and deliberate.
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const x = e.nativeEvent.locationX;
        const y = e.nativeEvent.locationY;
        anchor.current = { x, y };
        cb.current.onGrab(x, y, geom.current.gw, geom.current.gh);
      },
      onPanResponderMove: (_e, g) => {
        const a = anchor.current;
        cb.current.onDrag(a.x + g.dx, a.y + g.dy, geom.current.gw, geom.current.gh);
      },
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;
  return (
    <View style={{ width: gw }} {...pan.panHandlers}>
      {children}
    </View>
  );
}

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

// Per-band colours (owner 2026-08-07): each parametric band is colour-coded on
// BOTH its button and its node dot — LOW green · LMF amber · HMF blue · HIGH
// purple. HPF/LPF are filters (neutral), not tone bands.
const FILTER_COLOR = '#9aa0ad';
const BAND_META: { key: BandKey; label: string; color: string }[] = [
  { key: 'hpf', label: 'HPF', color: FILTER_COLOR },
  { key: 'b0', label: 'LOW', color: colors.green },
  { key: 'b1', label: 'LMF', color: colors.amber },
  { key: 'b2', label: 'HMF', color: colors.blue },
  { key: 'b3', label: 'HIGH', color: colors.purple },
  { key: 'lpf', label: 'LPF', color: FILTER_COLOR },
];
const BAND_COLOR: Record<BandKey, string> = BAND_META.reduce(
  (m, b) => ((m[b.key] = b.color), m),
  {} as Record<BandKey, string>,
);

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
  // The curve the audition bar plays — bypass = flat (raw signal).
  const auditionBands = useMemo(() => (bypass ? [] : specsFor(bands)), [bands, bypass]);

  const bandsRef = useRef(bands);
  bandsRef.current = bands;
  const selRef = useRef(sel);
  selRef.current = sel;

  // ---- Direct node dragging on the STAGE glass (spec: "drag nodes directly").
  // The stage is pinned outside any ScrollView, so the old scroll-lock
  // plumbing (useScrollLock + lockRef) is REMOVED — a node drag can no longer
  // fight a page scroll by construction (rack conversion 2026-08-23). Each
  // surface (the glass, the FULL SCREEN view) is a NodeDragSurface that hands
  // over graph pixels plus its own drawn size — the mapping here is pure
  // geometry, shared with the node overlay.
  const applyDrag = (x: number, y: number, gw: number, gh: number) => {
    const key = selRef.current;
    const f = fForX(x, gw);
    setBands((prev) => {
      if (key === 'hpf') return { ...prev, hpf: { ...prev.hpf, f } };
      if (key === 'lpf') return { ...prev, lpf: { ...prev.lpf, f } };
      const i = Number(key.slice(1));
      const g = Math.round(dbForY(y, gh) * 2) / 2;
      return { ...prev, bells: prev.bells.map((b, k) => (k === i ? { ...b, f, g } : b)) };
    });
  };
  const grab = (x: number, y: number, gw: number, gh: number) => {
    // Grab the nearest ENABLED band node by horizontal distance.
    const b = bandsRef.current;
    const cands: { key: BandKey; x: number }[] = [];
    if (b.hpf.on) cands.push({ key: 'hpf', x: xForF(b.hpf.f, gw) });
    if (b.lpf.on) cands.push({ key: 'lpf', x: xForF(b.lpf.f, gw) });
    b.bells.forEach((bell, i) => {
      if (bell.on) cands.push({ key: `b${i}` as BandKey, x: xForF(bell.f, gw) });
    });
    if (!cands.length) return;
    let best = cands[0];
    for (const c of cands) if (Math.abs(c.x - x) < Math.abs(best.x - x)) best = c;
    selRef.current = best.key;
    setSel(best.key);
    applyDrag(x, y, gw, gh);
  };

  const curves = useMemo<ResponseCurve[]>(() => {
    const list: ResponseCurve[] = [];
    const b = bands;
    // EVERY band draws its own curve in its OWN MIDI level colour (owner
    // 2026-08-07) — a boost warms with ITS gain, a cut/filter stays blue, and
    // no single band can dictate the colour of the others.
    const each: { spec: EqBandSpec[]; gain: number }[] = [];
    if (b.hpf.on) each.push({ spec: [{ type: 'highPass', freq: b.hpf.f, q: 0.707, gainDb: 0 }], gain: 0 });
    for (const bell of b.bells) {
      if (bell.on && bell.g !== 0) {
        each.push({ spec: [{ type: 'peak', freq: bell.f, q: bell.q, gainDb: bell.g }], gain: bell.g });
      }
    }
    if (b.lpf.on) each.push({ spec: [{ type: 'lowPass', freq: b.lpf.f, q: 0.707, gainDb: 0 }], gain: 0 });
    for (const e of each) {
      list.push({
        at: (f: number) => eqResponseDb(e.spec, f),
        emphasis: 'ghost',
        color: gainColor(e.gain, DB_RANGE),
      });
    }
    const all = specsFor(b);
    if (bypass) {
      // Bypassed: the would-be composite stays as a dim reference, output flat.
      list.push({ at: (f: number) => eqResponseDb(all, f), emphasis: 'ref' });
      list.push({ at: () => 0, emphasis: 'main', color: gainColor(0) });
    } else {
      list.push({
        at: (f: number) => eqResponseDb(all, f),
        emphasis: 'main',
        // The COMBINED curve reads the total the signal actually experiences.
        color: gainColor(Math.max(0, ...b.bells.filter((x) => x.on).map((x) => x.g)), DB_RANGE),
      });
    }
    return list;
  }, [bands, bypass]);

  const isBell = sel.startsWith('b');
  const bellIdx = isBell ? Number(sel.slice(1)) : -1;
  const selBell = isBell ? bands.bells[bellIdx] : null;
  const selMeta = BAND_META.find((m) => m.key === sel)!;
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

  // ---- Dock declaration: the selected band's params ride the lane (exact
  //      pre-rack DragSlider mappings) — GAIN/Q only exist for bells.
  const freqParam: DockParam = {
    kind: 'fader',
    id: 'freq',
    label: 'FREQ',
    value: normFromF(selF),
    onChange: (t) => setSelF(fFromNorm(t)),
    format: () => fmtHz(selF),
    tint: selMeta.color,
  };
  const bellParams: DockParam[] = selBell
    ? [
        {
          kind: 'fader',
          id: 'gain',
          label: 'GAIN',
          level: true,
          value: (selBell.g + DB_RANGE) / (2 * DB_RANGE),
          onChange: (t) =>
            setBands((prev) => ({
              ...prev,
              bells: prev.bells.map((b, k) =>
                k === bellIdx ? { ...b, g: Math.round((t * 2 * DB_RANGE - DB_RANGE) * 2) / 2 } : b,
              ),
            })),
          format: () => `${selBell.g >= 0 ? '+' : ''}${selBell.g.toFixed(1)} dB`,
          formatShort: () => `${selBell.g >= 0 ? '+' : ''}${selBell.g.toFixed(1)}`,
          tint: gainColor(selBell.g, DB_RANGE),
        },
        {
          kind: 'fader',
          id: 'q',
          label: 'Q',
          value: Math.log(selBell.q / 0.3) / Math.log(12 / 0.3),
          onChange: (t) =>
            setBands((prev) => ({
              ...prev,
              bells: prev.bells.map((b, k) =>
                k === bellIdx ? { ...b, q: 0.3 * Math.pow(12 / 0.3, Math.max(0, Math.min(1, t))) } : b,
              ),
            })),
          format: () => `Q ${selBell.q.toFixed(2)} · ${bwOctFromQ(selBell.q).toFixed(2)} oct`,
          formatShort: () => `Q${selBell.q.toFixed(1)}`,
        },
      ]
    : [];
  const params: DockParam[] = [
    freqParam,
    ...bellParams,
    {
      kind: 'group',
      id: 'band',
      label: 'BAND',
      valueLabel: selMeta.label,
      render: () => (
        <View style={{ gap: 10 }}>
          <Text style={styles.trayHead}>BANDS — tap to select · HPF/LPF switch on when tapped</Text>
          <View style={styles.chipRow}>
            {BAND_META.map((m) => {
              const isFilter = m.key === 'hpf' || m.key === 'lpf';
              const on =
                m.key === 'hpf' ? bands.hpf.on : m.key === 'lpf' ? bands.lpf.on : bands.bells[Number(m.key.slice(1))].on;
              const selected = sel === m.key;
              const press = () => {
                setSel(m.key);
                // A filter is inert until enabled — tapping it selects AND switches
                // it on so it does something immediately (owner 2026-08-07).
                if (isFilter && !on) {
                  setBands((prev) =>
                    m.key === 'hpf' ? { ...prev, hpf: { ...prev.hpf, on: true } } : { ...prev, lpf: { ...prev.lpf, on: true } },
                  );
                }
              };
              return (
                <Pressable
                  key={m.key}
                  onPress={press}
                  hitSlop={6}
                  accessibilityRole="button"
                  accessibilityLabel={`${m.label} band${on ? '' : ', off'}`}
                  accessibilityState={{ selected }}
                  aria-pressed={selected}
                  style={[
                    styles.chip,
                    { borderColor: selected ? m.color : '#2c2c33' },
                    selected && { backgroundColor: '#1a1a20' },
                    !on && styles.chipOff,
                  ]}
                >
                  <Text style={[styles.chipText, { color: on ? m.color : colors.textSub }]}>
                    {on ? '●' : '○'} {m.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.chipRow}>
            <MiniBtn label={selOn ? 'BAND ON' : 'BAND OFF'} active={selOn} onPress={toggleSel} />
            {/* Reset-in-container rule: RESET lives in the tray it resets. */}
            <MiniBtn label="RESET" onPress={() => { setBands(DEFAULTS()); setBypass(false); }} />
          </View>
        </View>
      ),
    },
    { kind: 'toggle', id: 'byp', label: 'BYP', value: bypass, onToggle: () => setBypass((v) => !v) },
  ];

  return (
    <RackUnit
      initialParam="freq"
      params={params}
      stage={{
        size: 'L', // the node-drag graph is the star
        fullScreen: true, // legibility pass 2026-09-26 — the rack renders the dock inside
        badge: bypass
          ? 'BYPASSED — output flat · dim = the would-be composite'
          : 'BANDS (dim) + COMBINED (amber)',
        bezel: [
          { k: 'BAND', v: selMeta.label, tint: selMeta.color },
          { k: 'FREQ', v: fmtHz(selF) },
          {
            k: 'GAIN',
            v: selBell ? `${selBell.g >= 0 ? '+' : ''}${selBell.g.toFixed(1)} dB` : '—',
            tint: selBell ? gainColor(selBell.g, DB_RANGE) : undefined,
          },
          { k: 'EQ', v: bypass ? 'BYPASS' : `${specsFor(bands).length} ACTIVE` },
        ],
        render: (w, h) => {
          // The graph fills the glass width; plot height = what is left after
          // the (text-scaled) frequency-label strip. Same helpers as the touch
          // mapping, so nodes and fingers agree at every size.
          const gw = Math.max(120, w - STAGE_PAD_X * 2);
          const padB = responseGraphPadB(gw);
          const gh = Math.max(80, h - padB - 10);
          const ts = responseGraphTextScale(gw);
          // Node markers, drawn over the graph in the SAME pixel space (stays aligned).
          const b = bands;
          const nodes: { key: BandKey; x: number; y: number }[] = [];
          if (b.hpf.on) nodes.push({ key: 'hpf', x: xForF(b.hpf.f, gw), y: yForDb(0, gh) });
          if (b.lpf.on) nodes.push({ key: 'lpf', x: xForF(b.lpf.f, gw), y: yForDb(0, gh) });
          b.bells.forEach((bell, i) => {
            if (bell.on) nodes.push({ key: `b${i}` as BandKey, x: xForF(bell.f, gw), y: yForDb(bell.g, gh) });
          });
          return (
            <View style={{ width: w, height: h, justifyContent: 'center', alignItems: 'center' }}>
              <NodeDragSurface gw={gw} gh={gh} onGrab={grab} onDrag={applyDrag}>
                {/* Every curve carries its OWN MIDI colour (set per-curve above). */}
                <ResponseCurveGraph curves={curves} dbRange={DB_RANGE} width={gw} height={gh} />
                <Svg
                  pointerEvents="none"
                  style={StyleSheet.absoluteFill}
                  width={gw}
                  height={gh + padB}
                  viewBox={`0 0 ${gw} ${gh + padB}`}
                >
                  {nodes.map((n) => {
                    // Node dot colour matches the band's button (owner 2026-08-07).
                    const col = BAND_COLOR[n.key];
                    const selected = n.key === sel;
                    return (
                      <Circle
                        key={n.key}
                        cx={n.x}
                        cy={n.y}
                        r={(selected ? 7 : 5) * ts}
                        fill={col}
                        fillOpacity={selected ? 0.95 : 0.25}
                        stroke={col}
                        strokeWidth={1.5 * ts}
                      />
                    );
                  })}
                </Svg>
              </NodeDragSurface>
            </View>
          );
        },
      }}
    >
      <View style={styles.well}>
        <GlossaryText style={styles.body}>
          Real EQs run several filters at once — and the filters INTERACT. The dim curves are each
          band alone; the amber curve is what they produce TOGETHER. Drag a node right on the glass:
          sideways = frequency, up/down = gain. The BAND tray picks (and switches on) a band; its
          FREQ, GAIN and Q ride the fader.
        </GlossaryText>

        {!selBell && (
          <Text style={styles.caption}>HPF/LPF here are fixed 12 dB/octave — the Slopes lesson covers the rest.</Text>
        )}

        {/* HEAR IT (owner 2026-08-10, test-signal MVP): the current composite
            curve runs live on the native FX EQ — bypass included, so toggling
            BYP while playing is an instant in/out A-B. Renders only when the
            build carries the FX engine. */}
        <EqAuditionBar bands={auditionBands} />

        <Text style={styles.caption}>
          Overlap two boosts and the composite rises HIGHER than either band alone; stack a cut into
          a boost’s skirt and they partly cancel. The combined curve — not any single band — is what
          the signal experiences.
        </Text>

        {/* Retrieval (learning pass 2026-08-31) — NEW COPY, owner review. */}
        <CheckQuestion
          spec={{
            question: 'Two +6 dB bells overlap at 1 kHz. What does the signal experience there?',
            options: [
              'More than +6 dB — the skirts add on top of each other',
              'Exactly +6 dB — the louder band wins',
              '+3 dB — they average',
            ],
            correctIdx: 0,
            reveal:
              'Band responses SUM. Where two boosts overlap, the composite rises above either one — which is how polite-looking bands quietly stack into an ugly bump. Read the combined curve, not the knobs.',
            wrongHint: 'Drag two bells onto the same frequency and watch the composite line.',
          }}
        />
      </View>
    </RackUnit>
  );
}

const styles = StyleSheet.create({
  well: { gap: 12 },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  trayHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.amber },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 8, borderWidth: 1, borderColor: '#2c2c33', paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#17171c' },
  chipOff: { opacity: 0.55 },
  chipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 0.7, color: colors.textSecondary },
});
