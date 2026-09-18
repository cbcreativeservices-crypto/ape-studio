/**
 * Module — Change One Thing (spec §3 item 9, Phase 3), on the RACK (judge
 * panel 2026-09-17: the lab's central discovery had its two plates 500 px
 * below the chips that change them). Two plates share ONE pinned glass at
 * the SAME locked drive frequency; VARY picks the one thing that differs,
 * its prediction question is the tray's own blurb (read while both plates
 * are in view), A and B are sticky trays so you flick B across the options
 * while A holds, and the bezel prints both plates' resonance states. No
 * fader — the drive is locked on purpose (the Echo-module precedent).
 */
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { DEFAULT_PLATE, effectiveQ, plateModes, readResonance, sampleField, type PlateShape, type PlateSpec } from '../../../../features/cymatics/plateModes';
import { formatHz } from '../../../../features/cymatics/music';
import type { DockParam } from '../../rack/rackTypes';
import type { PlateViewMode } from '../vizPlate';
import type { CymaticsModuleProps } from '../CymaticsModuleScreen';
import { requireVizPlate, skiaAvailable } from '../skiaGate';
import { CymaticsRackLayout } from './rackLayout';
import { P } from './shared';
import { RES_TINT } from '../../../../features/cymatics/resTint';

type VarId = 'material' | 'size' | 'thickness' | 'shape' | 'driver' | 'support' | 'damping';
type Variable = { id: VarId; label: string; short: string; question: string; options: { label: string; short: string; patch: Partial<PlateSpec> }[] };

const VARIABLES: Variable[] = [
  { id: 'material', label: 'Material', short: 'Mat', question: 'Same plate, same tone — a different metal. Does the figure survive?', options: [
    { label: 'Aluminum', short: 'Al', patch: { material: 'aluminum' } }, { label: 'Steel', short: 'Steel', patch: { material: 'steel' } }, { label: 'Brass', short: 'Brass', patch: { material: 'brass' } }, { label: 'Acrylic', short: 'Acryl', patch: { material: 'acrylic' } }, { label: 'Glass', short: 'Glass', patch: { material: 'glass' } }, { label: 'Solid wood', short: 'Wood', patch: { material: 'wood' } },
  ] },
  { id: 'size', label: 'Size', short: 'Size', question: 'Same tone — a bigger plate. Where does the resonance go?', options: [
    { label: '160 mm', short: '160', patch: { sizeMm: 160 } }, { label: '240 mm', short: '240', patch: { sizeMm: 240 } }, { label: '320 mm', short: '320', patch: { sizeMm: 320 } }, { label: '400 mm', short: '400', patch: { sizeMm: 400 } },
  ] },
  { id: 'thickness', label: 'Thickness', short: 'Thick', question: 'Same tone — a thicker plate. Up, down, or the same?', options: [
    { label: '0.5 mm', short: '0.5', patch: { thicknessMm: 0.5 } }, { label: '1 mm', short: '1mm', patch: { thicknessMm: 1 } }, { label: '2 mm', short: '2mm', patch: { thicknessMm: 2 } }, { label: '4 mm', short: '4mm', patch: { thicknessMm: 4 } },
  ] },
  { id: 'shape', label: 'Shape', short: 'Shape', question: 'Same tone, same size — a different outline. Same family of figures?', options: [
    { label: 'Square', short: 'Sq', patch: { shape: 'square' } }, { label: 'Disc', short: 'Disc', patch: { shape: 'circle', exciter: { x: 0.85, y: 0.5 } } }, { label: 'Triangle', short: 'Tri', patch: { shape: 'triangle' as PlateShape } }, { label: 'Hexagon', short: 'Hex', patch: { shape: 'hexagon' as PlateShape } }, { label: 'Violin', short: 'Viol', patch: { shape: 'violin' as PlateShape } },
  ] },
  { id: 'driver', label: 'Driver position', short: 'Drvr', question: 'Same tone, same plate — the driver moves. Which modes can it wake?', options: [
    { label: 'Centre', short: 'Ctr', patch: { exciter: { x: 0.5, y: 0.5 } } }, { label: 'Edge', short: 'Edge', patch: { exciter: { x: 0.9, y: 0.5 } } }, { label: 'Corner', short: 'Cnr', patch: { exciter: { x: 0.85, y: 0.85 } } }, { label: 'Off-centre', short: 'Off', patch: { exciter: { x: 0.62, y: 0.5 } } },
  ] },
  { id: 'support', label: 'Support', short: 'Supp', question: 'Same tone — the plate is held differently. What does a clamp do?', options: [
    { label: 'Free on the post', short: 'Free', patch: { support: null, edge: 'free' } }, { label: 'Clamped centre', short: 'ClpC', patch: { support: { x: 0.5, y: 0.5 }, edge: 'free' } }, { label: 'Supported edge', short: 'Supp', patch: { support: null, edge: 'supported' } }, { label: 'Clamped edge', short: 'ClpE', patch: { support: null, edge: 'clamped' } },
  ] },
  { id: 'damping', label: 'Damping', short: 'Damp', question: 'Same tone, same plate — more damping. Does the resonance MOVE, or blur?', options: [
    { label: 'Low', short: 'Low', patch: { damping: 0.1 } }, { label: 'Medium', short: 'Med', patch: { damping: 0.4 } }, { label: 'High', short: 'High', patch: { damping: 0.85 } },
  ] },
];
const VIEWS: { id: PlateViewMode; label: string; short: string }[] = [
  { id: 'overlay', label: 'Sand + heat', short: 'S+H' },
  { id: 'heat', label: 'Heat map', short: 'Heat' },
  { id: 'nodes', label: 'Node lines', short: 'Nodes' },
  { id: 'particles', label: 'Sand', short: 'Sand' },
];
const BASE: PlateSpec = { ...DEFAULT_PLATE };

const N = 44;

function useSide(spec: PlateSpec, hz: number) {
  return useMemo(() => {
    const modes = plateModes(spec, 16);
    const Q = effectiveQ(spec.material, spec.damping);
    const res = readResonance(hz, modes, Q);
    return { res, Q, grid: sampleField(spec, modes, hz, Q, N) };
  }, [spec, hz]);
}

export function ChangeModule({ focused, help }: CymaticsModuleProps) {
  const [varId, setVarId] = useState<VarId>('material');
  const variable = VARIABLES.find((v) => v.id === varId)!;
  const [a, setA] = useState(0);
  const [b, setB] = useState(1);
  /**
   * Has B actually been moved? (2026-09-18, design review #17.)
   *
   * REVEAL used to unlock on arrival, so the explanation could be read before a
   * single comparison had been made — and this module's entire value is the
   * moment B goes dark unexpectedly. The explanation getting there first
   * replaces a felt prediction-error with a paragraph, which is the cheap
   * version of the same information and the one with no retention.
   */
  const [bMoved, setBMoved] = useState(false);
  const [view, setView] = useState<PlateViewMode>('overlay');
  const [revealed, setRevealed] = useState(false);
  const specA = useMemo<PlateSpec>(() => ({ ...BASE, ...variable.options[Math.min(a, variable.options.length - 1)].patch }), [variable, a]);
  const specB = useMemo<PlateSpec>(() => ({ ...BASE, ...variable.options[Math.min(b, variable.options.length - 1)].patch }), [variable, b]);
  // The drive is LOCKED to plate A's second excitable mode and never follows B.
  const hz = useMemo(() => {
    const ex = plateModes(specA, 16).filter((m) => m.drive > 0.05);
    return Math.round((ex[1]?.hz ?? ex[0]?.hz ?? 300) * 10) / 10;
  }, [specA]);
  const A = useSide(specA, hz);
  const B = useSide(specB, hz);
  const viz = skiaAvailable ? requireVizPlate() : null;
  const pick = (id: VarId) => {
    setVarId(id);
    setA(0);
    setB(1);
    setRevealed(false);
  };
  const optA = variable.options[a];
  const optB = variable.options[b];

  const params: DockParam[] = [
    {
      kind: 'options',
      id: 'vary',
      label: 'VARY',
      valueLabel: variable.short,
      // The prediction question IS the tray blurb: read it while both plates are on the glass.
      options: VARIABLES.map((v) => ({ id: v.id, label: v.label, blurb: v.question })),
      selectedId: varId,
      onSelect: (id) => pick(id as VarId),
      helpKey: 'change_one',
    },
    { kind: 'options', id: 'a', label: 'A', valueLabel: optA.short, options: variable.options.map((o, i) => ({ id: `${i}`, label: o.label })), selectedId: `${a}`, onSelect: (id) => setA(Number(id)), sticky: true, helpKey: 'change_one' },
    { kind: 'options', id: 'b', label: 'B', valueLabel: optB.short, options: variable.options.map((o, i) => ({ id: `${i}`, label: o.label })), selectedId: `${b}`, onSelect: (id) => { setB(Number(id)); setBMoved(true); }, sticky: true, helpKey: 'change_one' },
    { kind: 'options', id: 'view', label: 'VIEW', valueLabel: VIEWS.find((v) => v.id === view)!.short, options: VIEWS.map((v) => ({ id: v.id, label: v.label })), selectedId: view, onSelect: (id) => setView(id as PlateViewMode), sticky: true, helpKey: 'display' },
  ];

  const plate = (w: number, h: number, spec: PlateSpec, side: ReturnType<typeof useSide>) =>
    viz ? (
      <viz.PlateView width={w} height={h} spec={spec} grid={side.grid} N={N} strength={side.res.strength} amplitude={0.8} view={view} running={focused} slowMo={false} particleCount={1100} particleSize={0.4} friction={0.4} resetToken={0} sectionY={0.5} dragTarget={null} />
    ) : (
      <View style={{ width: w, height: h, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={P.caption}>Needs the current app build (Skia).</Text>
      </View>
    );

  return (
    <CymaticsRackLayout
      rack={{
        size: 'L',
        badge: 'SIMULATION · one locked tone, two plates — APPROXIMATED (Ritz / Bessel) · CALCULATED (library shapes)',
        onHelp: help,
        onGuide: () => help('change_one'),
        initialParam: 'a', // no fader: the drive is locked on purpose
        bezel: [
          { k: 'LOCKED', v: formatHz(hz), helpKey: 'change_one', flex: 1.1 },
          { k: `A · ${optA.short}`, v: A.res.state.toUpperCase(), tint: RES_TINT[A.res.state], helpKey: 'resonance', flex: 1.2 },
          { k: `B · ${optB.short}`, v: B.res.state.toUpperCase(), tint: RES_TINT[B.res.state], helpKey: 'resonance', flex: 1.2 },
        ],
        stage: (w, h) => {
          const half = Math.floor((w - 6) / 2);
          return (
            <View style={{ width: w, height: h, flexDirection: 'row', gap: 6 }}>
              <View style={{ width: half, height: h }}>
                {plate(half, h, specA, A)}
                <Text style={styles.tag}>A · {optA.label.toUpperCase()}</Text>
              </View>
              <View style={{ width: half, height: h }}>
                {plate(half, h, specB, B)}
                <Text style={styles.tag}>B · {optB.label.toUpperCase()}</Text>
              </View>
            </View>
          );
        },
        params,
      }}
      caption="Pick what VARIES, predict, then flick B across its options while A holds. The tone never changes — read RES for each plate on the bezel."
    >
      <Text style={P.body}>
        Two plates, one tone. The frequency is locked to a resonance of plate A and <Text style={P.strong}>never changes</Text>. The one thing that
        differs between A and B is yours to choose; everything else is identical.
      </Text>
      <View style={[P.card, { borderColor: 'rgba(127,212,255,.5)' }]}>
        <Text style={[P.badge, { color: '#7fd4ff' }]}>PREDICT FIRST · {variable.label.toUpperCase()}</Text>
        <Text style={P.strong}>{variable.question}</Text>
      </View>
      {revealed && bMoved ? (
        <>
          <Text style={P.h}>READ IT</Text>
          <View style={P.bullet}><Text style={P.dot}>•</Text><Text style={[P.body, { flex: 1 }]}>AT RESONANCE with a bright, full heat map: this plate has a mode at the locked frequency. BETWEEN with a dark map: the same tone finds nothing to excite.</Text></View>
          <View style={P.bullet}><Text style={P.dot}>•</Text><Text style={[P.body, { flex: 1 }]}>If B goes dark, the frequency did not change — the plate did. That is the lab’s central discovery, and you just made it.</Text></View>
          <View style={P.bullet}><Text style={P.dot}>•</Text><Text style={[P.body, { flex: 1 }]}>Damping is the exception worth noticing: it does not move the resonance, it blurs and weakens it. Steel is the other: three times stiffer and three times denser, so it lands almost where aluminum does.</Text></View>
        </>
      ) : (
        <Pressable
          onPress={() => setRevealed(true)}
          disabled={!bMoved}
          style={[styles.reveal, !bMoved && styles.revealLocked]}
          accessibilityRole="button"
          accessibilityState={{ disabled: !bMoved }}
          accessibilityLabel={
            bMoved
              ? 'Reveal how to read the comparison'
              : 'Change plate B first, then the explanation unlocks'
          }
        >
          <Text style={[styles.revealText, !bMoved && styles.revealTextLocked]}>
            {bMoved ? 'REVEAL HOW TO READ IT ›' : 'CHANGE B FIRST — THEN READ IT'}
          </Text>
        </Pressable>
      )}
      <Text style={P.caption}>Both plates run whenever this module is open — a comparison, not a drive. The scaling law behind every comparison is exact.</Text>
    </CymaticsRackLayout>
  );
}

const styles = StyleSheet.create({
  tag: { position: 'absolute', left: 6, top: 4, fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.1, color: colors.amber, backgroundColor: 'rgba(11,11,16,0.7)', paddingHorizontal: 4, borderRadius: 3 },
  reveal: { alignSelf: 'flex-start', borderRadius: 8, borderWidth: 1, borderColor: '#3a3a44', paddingHorizontal: 12, paddingVertical: 7 },
  revealText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.1, color: colors.amber },
  revealLocked: { borderColor: '#2a2a32', opacity: 0.75 },
  revealTextLocked: { color: colors.textSub },
});
