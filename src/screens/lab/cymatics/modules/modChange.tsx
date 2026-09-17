/**
 * Module — Change One Thing (spec §3 item 9, Phase 3): the lab's discovery
 * tool for its one principle. Two plates side by side at the SAME drive
 * frequency; every control locked but one. The learner picks which one, sets
 * A and B, and reads what happens to the resonance and the figure — no prose
 * tells them the answer first.
 */
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LabChip } from '../../LabShell';
import { colors, fonts } from '../../../../theme/tokens';
import { levelColor, rampColors } from '../../../../features/tools/levelColor';
import { MATERIALS, type MaterialId } from '../../../../features/cymatics/materials';
import { DEFAULT_PLATE, effectiveQ, plateModes, readResonance, type PlateShape, type PlateSpec } from '../../../../features/cymatics/plateModes';
import { formatHz } from '../../../../features/cymatics/music';
import type { PlateViewMode } from '../vizPlate';
import type { CymaticsModuleProps } from '../CymaticsModuleScreen';
import { P, PlateDemo } from './shared';

type VarId = 'material' | 'size' | 'thickness' | 'shape' | 'driver' | 'support' | 'damping';
type Variable = { id: VarId; label: string; question: string; options: { label: string; patch: Partial<PlateSpec> }[] };

const VARIABLES: Variable[] = [
  { id: 'material', label: 'Material', question: 'Same plate, same tone — a different metal. Does the figure survive?', options: [
    { label: 'Aluminum', patch: { material: 'aluminum' } }, { label: 'Steel', patch: { material: 'steel' } }, { label: 'Brass', patch: { material: 'brass' } }, { label: 'Acrylic', patch: { material: 'acrylic' } }, { label: 'Glass', patch: { material: 'glass' } }, { label: 'Solid wood', patch: { material: 'wood' } },
  ] },
  { id: 'size', label: 'Size', question: 'Same tone — a bigger plate. Where does the resonance go?', options: [
    { label: '160 mm', patch: { sizeMm: 160 } }, { label: '240 mm', patch: { sizeMm: 240 } }, { label: '320 mm', patch: { sizeMm: 320 } }, { label: '400 mm', patch: { sizeMm: 400 } },
  ] },
  { id: 'thickness', label: 'Thickness', question: 'Same tone — a thicker plate. Up, down, or the same?', options: [
    { label: '0.5 mm', patch: { thicknessMm: 0.5 } }, { label: '1 mm', patch: { thicknessMm: 1 } }, { label: '2 mm', patch: { thicknessMm: 2 } }, { label: '4 mm', patch: { thicknessMm: 4 } },
  ] },
  { id: 'shape', label: 'Shape', question: 'Same tone, same size — a different outline. Same family of figures?', options: [
    { label: 'Square', patch: { shape: 'square' } }, { label: 'Disc', patch: { shape: 'circle', exciter: { x: 0.85, y: 0.5 } } }, { label: 'Triangle', patch: { shape: 'triangle' as PlateShape } }, { label: 'Hexagon', patch: { shape: 'hexagon' as PlateShape } }, { label: 'Violin', patch: { shape: 'violin' as PlateShape } },
  ] },
  { id: 'driver', label: 'Driver position', question: 'Same tone, same plate — the driver moves. Which modes can it wake?', options: [
    { label: 'Centre', patch: { exciter: { x: 0.5, y: 0.5 } } }, { label: 'Edge', patch: { exciter: { x: 0.9, y: 0.5 } } }, { label: 'Corner', patch: { exciter: { x: 0.85, y: 0.85 } } }, { label: 'Off-centre', patch: { exciter: { x: 0.62, y: 0.5 } } },
  ] },
  { id: 'support', label: 'Support', question: 'Same tone — the plate is held differently. What does a clamp do?', options: [
    { label: 'Free on the post', patch: { support: null, edge: 'free' } }, { label: 'Clamped centre', patch: { support: { x: 0.5, y: 0.5 }, edge: 'free' } }, { label: 'Supported edge', patch: { support: null, edge: 'supported' } }, { label: 'Clamped edge', patch: { support: null, edge: 'clamped' } },
  ] },
  { id: 'damping', label: 'Damping', question: 'Same tone, same plate — more damping. Does the resonance MOVE, or blur?', options: [
    { label: 'Low', patch: { damping: 0.1 } }, { label: 'Medium', patch: { damping: 0.4 } }, { label: 'High', patch: { damping: 0.85 } },
  ] },
];

const BASE: PlateSpec = { ...DEFAULT_PLATE };
const RES_TINT = { below: colors.textSub, approaching: '#ffc64d', at: '#37e05f', between: '#7fbfff' } as const;

function Side({ title, spec, hz, view, width, running, tag }: { title: string; spec: PlateSpec; hz: number; view: PlateViewMode; width: number; running: boolean; tag: string }) {
  const { res, Q } = useMemo(() => {
    const modes = plateModes(spec, 16);
    const Q = effectiveQ(spec.material, spec.damping);
    return { res: readResonance(hz, modes, Q), Q };
  }, [spec, hz]);
  return (
    <View style={{ width, gap: 6 }}>
      <Text style={styles.side}>{title}</Text>
      <View style={{ borderRadius: 8, overflow: 'hidden' }}>
        <PlateDemo width={width} spec={spec} hz={hz} view={view} running={running} particles={1200} height={Math.round(width * 0.95)} />
        <Text style={[P.badge, { position: 'absolute', left: 6, bottom: 4 }]}>{tag}</Text>
      </View>
      <Text style={[styles.res, { color: RES_TINT[res.state] }]}>{res.state.toUpperCase()}</Text>
      <View style={styles.track}>
        <LinearGradient colors={rampColors(res.strength)} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.fill, { width: `${Math.max(2, Math.round(res.strength * 100))}%` }]} />
      </View>
      <Text style={P.caption}>
        {res.state === 'at' && res.dominant ? `${res.dominant.label} · Q ≈ ${Math.round(Q)}` : res.next ? `nearest ${res.next.label} at ${formatHz(res.next.hz)}` : '—'}
      </Text>
    </View>
  );
}

export function ChangeModule({ width, focused, help }: CymaticsModuleProps) {
  const [varId, setVarId] = useState<VarId>('material');
  const variable = VARIABLES.find((v) => v.id === varId)!;
  const [a, setA] = useState(0);
  const [b, setB] = useState(1);
  const [view, setView] = useState<PlateViewMode>('overlay');
  // The drive frequency is LOCKED to plate A's second excitable mode, and it
  // does not change when B changes — that is the whole point.
  const specA = useMemo<PlateSpec>(() => ({ ...BASE, ...variable.options[Math.min(a, variable.options.length - 1)].patch }), [variable, a]);
  const specB = useMemo<PlateSpec>(() => ({ ...BASE, ...variable.options[Math.min(b, variable.options.length - 1)].patch }), [variable, b]);
  const hz = useMemo(() => {
    const ex = plateModes(specA, 16).filter((m) => m.drive > 0.05);
    return Math.round((ex[1]?.hz ?? ex[0]?.hz ?? 300) * 10) / 10;
  }, [specA]);
  const half = Math.floor((width - 12) / 2);
  const pick = (id: VarId) => {
    setVarId(id);
    setA(0);
    setB(1);
  };

  return (
    <View style={{ gap: 12 }}>
      <Text style={P.body}>
        Two plates, one tone. The frequency is locked to a resonance of plate A and <Text style={P.strong}>never changes</Text>. Pick the one
        thing that differs between A and B, then read what the same tone does to each. Predict before you look.
      </Text>
      <Text style={P.h}>THE ONE THING THAT CHANGES</Text>
      <View style={P.chips}>
        {VARIABLES.map((v) => (
          <LabChip key={v.id} label={v.label} selected={varId === v.id} onPress={() => pick(v.id)} onLongPress={() => help('change_one')} />
        ))}
      </View>
      <View style={[P.card, { borderColor: 'rgba(127,212,255,.5)' }]}>
        <Text style={[P.badge, { color: '#7fd4ff' }]}>PREDICT FIRST</Text>
        <Text style={P.strong}>{variable.question}</Text>
      </View>
      <View style={styles.pickRow}>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={styles.side}>A</Text>
          <View style={P.chips}>
            {variable.options.map((o, i) => (
              <LabChip key={o.label} label={o.label} selected={a === i} onPress={() => setA(i)} />
            ))}
          </View>
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={styles.side}>B</Text>
          <View style={P.chips}>
            {variable.options.map((o, i) => (
              <LabChip key={o.label} label={o.label} selected={b === i} onPress={() => setB(i)} />
            ))}
          </View>
        </View>
      </View>
      <View style={styles.lock}>
        <Text style={styles.lockText}>DRIVE LOCKED · {formatHz(hz)} · everything else identical</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Side title={`A · ${variable.options[a]?.label ?? ''}`} spec={specA} hz={hz} view={view} width={half} running={focused} tag="SIMULATION" />
        <Side title={`B · ${variable.options[b]?.label ?? ''}`} spec={specB} hz={hz} view={view} width={half} running={focused} tag="SIMULATION" />
      </View>
      <View style={P.chips}>
        {(
          [
            { id: 'overlay', l: 'Sand + heat' },
            { id: 'heat', l: 'Heat map' },
            { id: 'nodes', l: 'Node lines' },
            { id: 'particles', l: 'Sand' },
          ] as { id: PlateViewMode; l: string }[]
        ).map((v) => (
          <LabChip key={v.id} label={v.l} selected={view === v.id} onPress={() => setView(v.id)} />
        ))}
      </View>
      <Text style={P.h}>READ IT</Text>
      <View style={P.bullet}><Text style={P.dot}>•</Text><Text style={[P.body, { flex: 1 }]}>AT RESONANCE with a bright, full heat map: this plate has a mode at the locked frequency. BETWEEN with a dark map: the same tone finds nothing to excite.</Text></View>
      <View style={P.bullet}><Text style={P.dot}>•</Text><Text style={[P.body, { flex: 1 }]}>If B goes dark, the frequency did not change — the plate did. That is the lab’s central discovery, and you just made it.</Text></View>
      <View style={P.bullet}><Text style={P.dot}>•</Text><Text style={[P.body, { flex: 1 }]}>Damping is the exception worth noticing: it does not move the resonance, it blurs and weakens it. Steel is the other: three times stiffer and three times denser, so it lands almost where aluminum does.</Text></View>
      <Text style={styles.honest}>SIMULATION · APPROXIMATED (Ritz free-plate and Bessel disc modes) · CALCULATED (library shapes). The scaling law behind every comparison is exact.</Text>
      <Text style={[P.caption, { color: levelColor(0.5) }]}> </Text>
      <Pressable onPress={() => help('change_one')} accessibilityRole="button" accessibilityLabel="Open the lesson for Change One Thing">
        <Text style={P.badge}>ⓘ LONG-PRESS ANY CONTROL FOR ITS LESSON</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  side: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.4, color: colors.amber },
  res: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.2 },
  track: { height: 6, borderRadius: 3, backgroundColor: '#1b1c22', overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  pickRow: { flexDirection: 'row', gap: 12 },
  lock: { alignSelf: 'stretch', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,198,77,.5)', backgroundColor: 'rgba(255,198,77,.07)', paddingVertical: 8, paddingHorizontal: 12 },
  lockText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.3, color: colors.amber, textAlign: 'center' },
  honest: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
});
