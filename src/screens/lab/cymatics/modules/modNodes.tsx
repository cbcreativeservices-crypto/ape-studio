/**
 * Module 2 — Nodes, Antinodes & Modes (spec §4), on the RACK (judge panel
 * 2026-09-17: the same plate as the studio was driven by six rows of chips
 * that scrolled it off screen). The plate PINS on the glass; FREQ rides the
 * lane with a sticky JUMP TO A MODE chooser so modes can be A/B'd while the
 * figure re-forms; SHAPE and VIEW are sticky trays; PLAY / SILENT are dock
 * toggles. Riding the lane between modes shows the figure dissolve — the
 * Intro's point, now in the learner's thumb.
 */
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { DEFAULT_PLATE, effectiveQ, plateModes, readResonance, sampleField, type PlateSpec } from '../../../../features/cymatics/plateModes';
import { formatHz, nearestNote } from '../../../../features/cymatics/music';
import type { DockParam } from '../../rack/rackTypes';
import type { PlateViewMode } from '../vizPlate';
import type { CymaticsModuleProps } from '../CymaticsModuleScreen';
import { requireVizPlate, skiaAvailable } from '../skiaGate';
import { useDriveTone } from '../useDriveTone';
import { CymaticsRackLayout } from './rackLayout';
import { P, excitableModes } from './shared';
import { RES_TINT } from '../../../../features/cymatics/resTint';
import { START_LEVEL_01 } from '../../../../features/audio/startLevel';

const F_MIN = 30;
const F_MAX = 3000;
const N = 48;
const hzFromPos = (v: number) => F_MIN * Math.pow(F_MAX / F_MIN, Math.max(0, Math.min(1, v)));
const posFromHz = (hz: number) => Math.log(Math.max(F_MIN, Math.min(F_MAX, hz)) / F_MIN) / Math.log(F_MAX / F_MIN);
const VIEWS: { id: PlateViewMode; label: string; short: string; blurb: string }[] = [
  { id: 'nodes', label: 'Node lines', short: 'Nodes', blurb: 'The still lines of the nearest mode — the Chladni figure that would form. Fades between resonances.' },
  { id: 'phase', label: 'Phase', short: 'Phase', blurb: 'Amber rises while violet falls — neighbours across a nodal line move in opposite directions. Neither colour is on the amplitude ramp: this is direction, not level.' },
  { id: 'heat', label: 'Heat map', short: 'Heat', blurb: 'How far each point moves, on the Academy ramp: black = still, red = the most. Dark between resonances.' },
  { id: 'particles', label: 'Sand', short: 'Sand', blurb: 'Sand walks off the moving regions and settles on the still lines.' },
  { id: 'plate3d', label: '3D plate', short: '3D', blurb: 'Exaggerated motion, strobed to a few hertz so you can see it.' },
];


export function NodesModule({ width, focused, help }: CymaticsModuleProps) {
  const [shape, setShape] = useState<PlateSpec['shape']>('square');
  const spec = useMemo<PlateSpec>(() => ({ ...DEFAULT_PLATE, shape, exciter: shape === 'circle' ? { x: 0.85, y: 0.5 } : { x: 0.5, y: 0.5 } }), [shape]);
  const modes = useMemo(() => excitableModes(spec, 24).slice(0, 8), [spec]);
  const allModes = useMemo(() => plateModes(spec, 14), [spec]);
  const Q = useMemo(() => effectiveQ(spec.material, spec.damping), [spec]);
  const [hz, setHz] = useState(() => Math.round((modes[0]?.hz ?? 300) * 10) / 10);
  const [view, setView] = useState<PlateViewMode>('nodes');
  const [silent, setSilent] = useState(false);
  const tone = useDriveTone(hz, null, START_LEVEL_01);
  const res = useMemo(() => readResonance(hz, allModes, Q), [hz, allModes, Q]);
  const grid = useMemo(() => sampleField(spec, allModes, hz, Q, N), [spec, allModes, hz, Q]);
  const viz = skiaAvailable ? requireVizPlate() : null;
  const note = nearestNote(hz);
  const land = (f: number) => setHz(Math.round(f * 10) / 10);
  // When the shape changes the modes move: land on the first one again.
  const pickShape = (s: PlateSpec['shape']) => {
    setShape(s);
    const ex = excitableModes({ ...DEFAULT_PLATE, shape: s, exciter: s === 'circle' ? { x: 0.85, y: 0.5 } : { x: 0.5, y: 0.5 } }, 24);
    if (ex[0]) land(ex[0].hz);
  };

  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'freq',
      label: 'FREQ',
      value: posFromHz(hz),
      onChange: (v) => setHz(Math.round(hzFromPos(v) * 10) / 10),
      format: () => `${formatHz(hz)} · ${note.label} ${note.centsLabel}`,
      formatShort: () => (hz >= 1000 ? `${(hz / 1000).toFixed(1)}k` : `${Math.round(hz)}Hz`),
      helpKey: 'modes',
      chooser: {
        title: 'JUMP TO A MODE',
        sticky: true,
        options: modes.map((m, k) => ({ id: m.id, label: `${k + 1} · ${formatHz(m.hz)} · ${m.label}`, blurb: `${m.nodalLines} nodal line${m.nodalLines === 1 ? '' : 's'}. Tap to land on it; ride the lane away from it to watch the figure dissolve.` })),
        selectedId: res.state === 'at' && res.dominant ? res.dominant.id : null,
        onSelect: (id) => {
          const m = modes.find((x) => x.id === id);
          if (m) land(m.hz);
        },
      },
    },
    {
      kind: 'options',
      id: 'shape',
      label: 'SHAPE',
      valueLabel: shape === 'circle' ? 'Disc' : 'Sq',
      options: [
        { id: 'square', label: 'Square plate', blurb: 'The classic crossed and diagonal figures — degenerate pairs combine into ± Chladni figures.' },
        { id: 'circle', label: 'Circular plate', blurb: 'Nodal circles and diameters — Bessel modes, edge-driven so the diameter modes wake.' },
      ],
      selectedId: shape,
      onSelect: (id) => pickShape(id as PlateSpec['shape']),
      sticky: true,
      helpKey: 'shape',
    },
    {
      kind: 'options',
      id: 'view',
      label: 'VIEW',
      valueLabel: VIEWS.find((v) => v.id === view)!.short,
      options: VIEWS.map((v) => ({ id: v.id, label: v.label, blurb: v.blurb })),
      selectedId: view,
      onSelect: (id) => setView(id as PlateViewMode),
      sticky: true,
      helpKey: 'display',
    },
    ...(tone.engineReady ? [{ kind: 'toggle', id: 'play', label: 'PLAY', value: tone.running, onToggle: () => (tone.running ? tone.stop() : void tone.start()) } as DockParam] : []),
    { kind: 'toggle', id: 'silent', label: 'SILENT', value: silent, onToggle: () => setSilent((s) => !s), helpKey: 'silent' },
  ];

  return (
    <CymaticsRackLayout
      rack={{
        size: 'M',
        badge: `SIMULATION · APPROXIMATED — ${shape === 'circle' ? 'Bessel disc modes, edge-driven' : 'Ritz square-plate modes, centre-driven'}`,
        onHelp: help,
        onGuide: () => help('display'),
        initialParam: 'freq',
        hideDragTag: true,
        bezel: [
          { k: 'MODE', v: res.state === 'at' && res.dominant ? res.dominant.label : '—', helpKey: 'modes', flex: 1.5 },
          { k: 'DRIVE', v: formatHz(hz), helpKey: 'frequency' },
          { k: 'LINES', v: res.state === 'at' && res.dominant ? `${res.dominant.nodalLines}` : '—', helpKey: 'modes', flex: 0.8 },
          {
            k: 'RES',
            v: res.state.toUpperCase(),
            tint: RES_TINT[res.state],
            helpKey: 'resonance',
            // Tap the cell to land on the nearest mode (the panel's bezel-cell verb).
            onPress: res.state !== 'at' && res.next ? () => land(res.next!.hz) : undefined,
            flex: 1.2,
          },
        ],
        stage: (w, h) =>
          viz ? (
            <viz.PlateView
              width={w}
              height={h}
              spec={spec}
              grid={grid}
              N={N}
              strength={res.strength}
              amplitude={0.8}
              view={view}
              running={tone.running || silent}
              slowMo={view === 'plate3d'}
              particleCount={1800}
              particleSize={0.4}
              friction={0.4}
              resetToken={0}
              sectionY={0.5}
              dragTarget={null}
            />
          ) : (
            <View style={{ width: w, height: h, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={P.caption}>Live plate needs the current app build (Skia).</Text>
            </View>
          ),
        params,
      }}
      caption="Ride FREQ onto a mode and watch the figure snap in; ride away and watch it dissolve. Tap RES to land on the nearest one."
    >
      <Text style={P.body}>
        Each stable Chladni figure is one <Text style={P.strong}>normal mode</Text> of the plate. Nodal lines are where the plate does not move; the
        regions between them move — and neighbours across a line move in opposite directions.
      </Text>
      <Text style={P.h}>WHAT TO NOTICE</Text>
      <View style={P.bullet}><Text style={P.dot}>•</Text><Text style={[P.body, { flex: 1 }]}>Higher modes generally carry more nodal lines — more still lines, more lobes, finer figures.</Text></View>
      <View style={P.bullet}><Text style={P.dot}>•</Text><Text style={[P.body, { flex: 1 }]}>Change the shape and the whole family changes: a disc’s modes are nodal circles and diameters; a square’s are the classic crossed and diagonal figures.</Text></View>
      <View style={P.bullet}><Text style={P.dot}>•</Text><Text style={[P.body, { flex: 1 }]}>Between two modes nothing organises — the RES cell reads BETWEEN and the heat map goes dark. A pattern belongs to a resonance, not to a frequency.</Text></View>
      <View style={P.bullet}><Text style={P.dot}>•</Text><Text style={[P.body, { flex: 1 }]}>The same ideas are used to study violin and guitar plates, bells, gongs, cymbals, and engineering structures.</Text></View>
      <Text style={P.caption}>
        {tone.engineReady ? 'PLAY drives the plate with the tone you hear; SILENT drives it without sound.' : 'Sound needs the native engine — SILENT still drives the plate.'} Nothing moves without a drive.
      </Text>
    </CymaticsRackLayout>
  );
}
