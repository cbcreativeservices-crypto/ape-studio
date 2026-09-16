/**
 * Module 2 — Nodes, Antinodes & Modes (spec §4). Pick a mode of the
 * reference plate; see its still lines, opposite-phase regions, heat map or
 * 3D motion; hear its frequency.
 */
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { HeaderPlayButton, LabChip } from '../../LabShell';
import { DEFAULT_PLATE, type PlateSpec } from '../../../../features/cymatics/plateModes';
import { formatHz, nearestNote } from '../../../../features/cymatics/music';
import type { PlateViewMode } from '../vizPlate';
import type { CymaticsModuleProps } from '../CymaticsModuleScreen';
import { useDriveTone } from '../useDriveTone';
import { P, PlateDemo, excitableModes } from './shared';

const VIEWS: { id: PlateViewMode; label: string }[] = [
  { id: 'nodes', label: 'Node lines' },
  { id: 'phase', label: 'Phase' },
  { id: 'heat', label: 'Heat map' },
  { id: 'particles', label: 'Sand' },
  { id: 'plate3d', label: '3D' },
];

export function NodesModule({ width, focused, help }: CymaticsModuleProps) {
  const [shape, setShape] = useState<PlateSpec['shape']>('square');
  const spec = useMemo<PlateSpec>(() => ({ ...DEFAULT_PLATE, shape, exciter: shape === 'circle' ? { x: 0.85, y: 0.5 } : { x: 0.5, y: 0.5 } }), [shape]);
  const modes = useMemo(() => excitableModes(spec, 24).slice(0, 8), [spec]);
  const [i, setI] = useState(0);
  const mode = modes[Math.min(i, modes.length - 1)];
  const [view, setView] = useState<PlateViewMode>('nodes');
  const tone = useDriveTone(mode?.hz ?? 300, null, 0.6);

  return (
    <View style={{ gap: 12 }}>
      <Text style={P.body}>
        Each stable Chladni figure is one <Text style={P.strong}>normal mode</Text> of the plate. Pick a mode below. Nodal lines are where the
        plate does not move; the regions between them move — and neighbours across a line move in opposite directions.
      </Text>
      <View style={P.chips}>
        <LabChip label="Square plate" selected={shape === 'square'} onPress={() => { setShape('square'); setI(0); }} onLongPress={() => help('shape')} />
        <LabChip label="Circular plate" selected={shape === 'circle'} onPress={() => { setShape('circle'); setI(0); }} onLongPress={() => help('shape')} />
      </View>
      <View style={P.chips}>
        {modes.map((m, k) => (
          <LabChip key={m.id} label={`${k + 1} · ${formatHz(m.hz)}`} selected={k === i} onPress={() => setI(k)} onLongPress={() => help('modes')} />
        ))}
      </View>
      <View style={P.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={P.strong}>Mode {mode?.label ?? '—'}</Text>
            <Text style={P.caption}>
              {mode ? `${formatHz(mode.hz)} · ${nearestNote(mode.hz).label} ${nearestNote(mode.hz).centsLabel} · ${mode.nodalLines} nodal line${mode.nodalLines === 1 ? '' : 's'}` : ''}
            </Text>
          </View>
          <HeaderPlayButton playing={tone.running} onPress={() => (tone.running ? tone.stop() : void tone.start())} disabled={!tone.engineReady} label="Play this mode’s frequency" />
        </View>
        <View style={P.chips}>
          {VIEWS.map((v) => (
            <LabChip key={v.id} label={v.label} selected={view === v.id} onPress={() => setView(v.id)} onLongPress={() => help('display')} />
          ))}
        </View>
        <View style={{ borderRadius: 8, overflow: 'hidden' }}>
          <PlateDemo width={width - 26} spec={spec} hz={mode?.hz ?? 300} view={view} running={focused} slowMo={view === 'plate3d'} />
          <Text style={[P.badge, { position: 'absolute', left: 8, bottom: 6 }]}>SIMULATION · {shape === 'circle' ? 'DISC, EDGE-DRIVEN' : 'SQUARE, CENTRE-DRIVEN'} · APPROXIMATED</Text>
        </View>
      </View>
      <Text style={P.h}>WHAT TO NOTICE</Text>
      <View style={P.bullet}><Text style={P.dot}>•</Text><Text style={[P.body, { flex: 1 }]}>Higher modes generally carry more nodal lines — more still lines, more lobes, finer figures.</Text></View>
      <View style={P.bullet}><Text style={P.dot}>•</Text><Text style={[P.body, { flex: 1 }]}>Change the shape and the whole family changes: a disc’s modes are nodal circles and diameters; a square’s are the classic crossed and diagonal figures.</Text></View>
      <View style={P.bullet}><Text style={P.dot}>•</Text><Text style={[P.body, { flex: 1 }]}>Boundary conditions matter as much as shape: clamping an edge raises every mode and removes the free-edge figures.</Text></View>
      <View style={P.bullet}><Text style={P.dot}>•</Text><Text style={[P.body, { flex: 1 }]}>The same ideas are used to study violin and guitar plates, bells, gongs, cymbals, and engineering structures.</Text></View>
    </View>
  );
}
