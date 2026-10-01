/**
 * Module 4 — EXPLORE PLACEMENT. Drag speakers and listener; the stereo
 * triangle, boundary distances, first-order reflection paths (image-source)
 * and the modal pressure field of one mode update at once. Save positions as
 * Current / Option A / Option B, flip between them, and read what changed.
 * Modes of a rectangle are CALCULATED (idealized); reflections and levels
 * are ESTIMATED; a non-rectangular room's modes are ESTIMATED and say so.
 */
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { fieldLevelColor } from '../../../../features/tools/levelColor';
import { flipFader } from '../../soundsystems/rackLayout';
import type { BezelItem, DockParam } from '../../rack/rackTypes';
import { BADGE, type RoomLabCtx } from '../labCtx';
import { RoomRackLayout } from '../rackLayout';
import { PLAN_LEGEND, RoomPlanView, type PlanLayers, type Trace } from '../RoomPlanView';
import { Body, Caption, TrayButton, TrayHeading } from '../bits';
import { clampInside, diffLayouts, fmtHz, fmtLen, modePressure, type Layout, type Pt, type RoomDesign } from '../roomModel';

const OPTION_NAMES = ['Current', 'Option A', 'Option B'] as const;
const TRACE_MS = 1700;

/** Copy the active layout into the named slot (creating it), and switch to it. */
export function saveLayoutAs(d: RoomDesign, name: string): RoomDesign {
  const src = d.layouts[d.active] ?? d.layouts[0];
  const copy: Layout = { ...src, name, speakers: src.speakers.map((s) => ({ ...s })), listener: { ...src.listener } };
  const idx = d.layouts.findIndex((l) => l.name === name);
  const layouts = idx >= 0 ? d.layouts.map((l, i) => (i === idx ? copy : l)) : [...d.layouts, copy];
  return { ...d, layouts, active: idx >= 0 ? idx : layouts.length - 1 };
}

export function ExploreModule({ ctx }: { ctx: RoomLabCtx }) {
  const { design, update, analysis, units } = ctx;
  const room = design.room;
  const lay = design.layouts[design.active] ?? design.layouts[0];
  const [selected, setSelected] = useState<string | null>('listener');
  const [modeIdx, setModeIdx] = useState(0);
  const [layers, setLayers] = useState<PlanLayers>({ triangle: true, boundaries: false, reflections: true, modes: true, dims: false, treatment: true });
  const [trace, setTrace] = useState<Trace>(null);
  const traceRaf = useRef<number | null>(null);
  const traceIdx = useRef(-1);
  useEffect(() => () => {
    if (traceRaf.current != null) cancelAnimationFrame(traceRaf.current);
  }, []);

  const modes = analysis.modes;
  const safeModeIdx = Math.max(0, Math.min(modes.length - 1, modeIdx));
  const mode = modes[safeModeIdx];
  const { L, W, H } = analysis.modalDims;
  const b = analysis.bounds;
  const pAtEars = mode ? modePressure(L, W, H, mode, lay.listener.y - b.minY, lay.listener.x - b.minX, lay.listener.earZ) : 0;
  const early = analysis.reflections.filter((r) => r.delayMs < 15);
  const first = analysis.reflections[0];

  const setLayout = (fn: (l: Layout) => Layout) => update((d) => ({ ...d, layouts: d.layouts.map((l, i) => (i === d.active ? fn(l) : l)) }));
  const onDrag = (id: string, p: Pt) =>
    setLayout((l) => {
      if (id === 'listener') return { ...l, listener: { ...l.listener, ...clampInside(p, room, l.listener) } };
      return { ...l, speakers: l.speakers.map((s) => (s.role === id ? { ...s, ...clampInside(p, room, s) } : s)) };
    });

  // TRACE: animate a pulse along the next reflection path (user-initiated;
  // nothing auto-appears). Cycles through the paths on each press.
  const runTrace = () => {
    if (analysis.reflections.length === 0) return;
    traceIdx.current = (traceIdx.current + 1) % analysis.reflections.length;
    const index = traceIdx.current;
    if (traceRaf.current != null) cancelAnimationFrame(traceRaf.current);
    const t0 = Date.now();
    const step = () => {
      const p = (Date.now() - t0) / TRACE_MS;
      if (p >= 1) {
        setTrace({ index, progress: 1 });
        traceRaf.current = null;
        return;
      }
      setTrace({ index, progress: p });
      traceRaf.current = requestAnimationFrame(step);
    };
    step();
  };
  const traced = trace ? analysis.reflections[trace.index] : undefined;

  const bezel: BezelItem[] = [
    { k: 'MODE', v: mode ? fmtHz(mode.f) : '—', flex: 1.1 },
    { k: 'AT EARS', v: `${Math.round(pAtEars * 100)} %`, tint: fieldLevelColor(pAtEars) },
    { k: 'EARLY', v: `${early.length} < 15 ms` , flex: 1.1 },
    { k: '1ST', v: first ? `+${first.delayMs.toFixed(1)} ms` : '—' },
  ];

  const params: DockParam[] = [
    flipFader({
      id: 'layout',
      label: 'LAYOUT',
      items: design.layouts.map((l, i) => ({ id: String(i), name: l.name })),
      selectedId: String(design.active),
      onSelect: (id) => update((d) => ({ ...d, active: Number(id) })),
      name: (t) => t.name,
      short: (t) => t.name.replace('Option ', 'OPT ').toUpperCase(),
      title: 'SAVED POSITIONS',
      sticky: true,
      blurb: () => 'Flip between saved positions while the plan and the readouts follow. SAVE copies the current positions into a slot.',
    }),
    {
      kind: 'fader',
      id: 'mode',
      label: 'MODE',
      value: modes.length > 1 ? safeModeIdx / (modes.length - 1) : 0,
      onChange: (v) => setModeIdx(Math.round(v * Math.max(0, modes.length - 1))),
      format: (v) => {
        const m = modes[Math.round(v * Math.max(0, modes.length - 1))];
        return m ? `${m.kind} (${m.nx},${m.ny},${m.nz}) ${fmtHz(m.f)}` : '—';
      },
      formatShort: (v) => {
        const m = modes[Math.round(v * Math.max(0, modes.length - 1))];
        return m ? fmtHz(m.f) : '—';
      },
      chooser: {
        title: 'ROOM MODE TO MAP',
        options: modes.slice(0, 24).map((m, i) => ({ id: String(i), label: `${fmtHz(m.f)} · ${m.kind} (${m.nx},${m.ny},${m.nz})`, blurb: modeBlurb(m.kind) })),
        selectedId: String(safeModeIdx),
        onSelect: (id) => setModeIdx(Number(id)),
        sticky: true,
      },
    },
    {
      kind: 'group',
      id: 'layers',
      label: 'LAYERS',
      valueLabel: `${[layers.triangle, layers.boundaries, layers.reflections, layers.modes].filter(Boolean).length} ON`,
      render: () => (
        <View style={{ gap: 8 }}>
          <TrayHeading>SHOW ON THE PLAN</TrayHeading>
          <View style={styles.btnRow}>
            {(
              [
                ['triangle', 'TRIANGLE'],
                ['boundaries', 'WALL DISTANCES'],
                ['reflections', 'REFLECTIONS'],
                ['modes', 'MODE PRESSURE'],
                ['treatment', 'TREATMENT'],
              ] as const
            ).map(([k, label]) => (
              <TrayButton key={k} label={`${layers[k] ? '● ' : '○ '}${label}`} tint={layers[k] ? 'amber' : 'dim'} onPress={() => setLayers((s) => ({ ...s, [k]: !s[k] }))} />
            ))}
          </View>
          <Caption>Mode pressure is the one selected mode, at ear height, on the amplitude colour standard: red = a pressure maximum, blue = a null.</Caption>
        </View>
      ),
    },
    { kind: 'action', id: 'trace', label: 'TRACE', onPress: runTrace, tint: colors.cyanBright },
    {
      kind: 'group',
      id: 'save',
      label: 'SAVE',
      valueLabel: lay.name.replace('Option ', 'OPT ').toUpperCase().slice(0, 7),
      render: () => <SaveTray ctx={ctx} />,
    },
  ];

  const stage = (w: number, h: number) => (
    <RoomPlanView w={w} h={h} design={design} analysis={analysis} layers={layers} modeIndex={safeModeIdx} edit="monitoring" selected={selected} onSelect={setSelected} onDrag={onDrag} trace={trace} />
  );

  const diff = design.active > 0 ? diffLayouts(design, 0, design.active) : [];

  return (
    <RoomRackLayout
      rack={{ stage, badge: analysis.rectangular ? BADGE.exploreRect : BADGE.exploreApprox, bezel, params, initialParam: 'mode', hideDragTag: true }}
      caption="Drag the listener through the pressure field and watch AT EARS change; drag a speaker and the reflection paths follow. MODE picks which room mode is mapped; TRACE animates the next reflection from speaker to surface to ear; SAVE keeps a position as Option A or B."
      wellTop={
        <View style={{ gap: 6 }}>
          {mode ? (
            <Text style={styles.line}>
              {`${mode.kind} mode (${mode.nx},${mode.ny},${mode.nz}) at ${fmtHz(mode.f)}: the listener sits at ${Math.round(pAtEars * 100)} % of its maximum pressure — ${pAtEars > 0.8 ? 'a peak; that frequency will be heavy here' : pAtEars < 0.2 ? 'a null; that frequency nearly disappears here' : 'between peak and null'}.`}
            </Text>
          ) : null}
          {traced ? (
            <Text style={styles.line}>
              {`Traced: ${traced.speaker} → ${surfaceName(traced)} → ears. Path ${fmtLen(traced.pathLen, units)} vs direct ${fmtLen(traced.directLen, units)}: arrives +${traced.delayMs.toFixed(1)} ms, about ${traced.levelDb.toFixed(0)} dB below the direct sound${traced.treatedBy ? ', through treatment' : ''} (ESTIMATED).`}
            </Text>
          ) : null}
          {diff.length > 0 ? (
            <View style={styles.diff}>
              <Text style={styles.diffHead}>{`"${design.layouts[0].name}" → "${lay.name}" — WHAT CHANGED`}</Text>
              {diff.map((l, i) => (
                <Text key={i} style={styles.diffLine}>
                  {`• ${l.text}  `}
                  <Text style={[styles.tier, { color: l.tier === 'CALCULATED' ? colors.cyanBright : colors.amber }]}>{l.tier}</Text>
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      }
    >
      <Body>
        Below a few hundred hertz the room is the biggest equalizer in the chain. Every pair of parallel surfaces holds standing waves — room modes — at f = n·c/2L, with pressure maxima at the walls and corners and nulls at the quarter and half points, depending on the order. The map shows one mode at a time; the real bass response at your seat is all of them at once, driven by where the speakers are.
      </Body>
      <Body>
        Early reflections are drawn by the image-source method: mirror the speaker in each wall, the floor and the ceiling, and the straight line from the image to your ear crosses the surface at the reflection point. The path-length difference is the arrival delay — 1 ms for every 34 cm. Reflections inside about 15 ms blur the stereo image and comb the tone; those are the ones treatment goes after.
      </Body>
      <View style={{ gap: 3 }}>
        {PLAN_LEGEND.map((r) => (
          <View key={r.t} style={styles.legendRow}>
            <View style={[styles.swatch, { backgroundColor: r.c }]} />
            <Caption>{r.t}</Caption>
          </View>
        ))}
      </View>
      <Caption>No coordinate here is a guaranteed optimum. A position is worth testing when it moves the seat off a modal peak or null, evens the two sides, or lengthens the early reflections — then listen, or measure, and compare.</Caption>
    </RoomRackLayout>
  );
}

function modeBlurb(kind: 'axial' | 'tangential' | 'oblique'): string {
  return kind === 'axial'
    ? 'Between one pair of parallel surfaces — the strongest modes and the ones you hear first.'
    : kind === 'tangential'
      ? 'Bouncing between two pairs of surfaces — about half the energy of an axial mode.'
      : 'All three pairs at once — weaker still, but they fill in the gaps.';
}

function surfaceName(r: { surface: { kind: string; edge?: number } }): string {
  return r.surface.kind === 'wall' ? `wall ${(r.surface.edge ?? 0) + 1}` : r.surface.kind;
}

function SaveTray({ ctx }: { ctx: RoomLabCtx }) {
  const { design, update, guest, saveCurrent } = ctx;
  const [saved, setSaved] = useState<string | null>(null);
  return (
    <View style={{ gap: 10 }}>
      <TrayHeading>KEEP THESE POSITIONS AS</TrayHeading>
      <View style={styles.btnRow}>
        {OPTION_NAMES.map((n) => (
          <TrayButton key={n} label={n.toUpperCase()} onPress={() => update((d) => saveLayoutAs(d, n))} />
        ))}
      </View>
      <Caption>{`Flip between them with the LAYOUT key. ${design.layouts.length} position${design.layouts.length === 1 ? '' : 's'} kept in this design.`}</Caption>
      <TrayHeading>SAVE THE WHOLE DESIGN</TrayHeading>
      <TrayButton
        label={guest ? 'SAVE (NOT KEPT — NOT SIGNED IN)' : 'SAVE DESIGN TO THIS DEVICE'}
        tint={guest ? 'dim' : 'green'}
        onPress={() => {
          void saveCurrent().then((ok) => setSaved(ok ? 'Saved on this device.' : 'Kept for this session only — you are not signed in, so designs are not saved.'));
        }}
      />
      {saved ? <Caption>{saved}</Caption> : null}
      <Caption>{guest ? 'You can design freely; nothing is saved until you sign in.' : 'The REVIEW module lists saved designs and compares a saved "before" with the current setup.'}</Caption>
    </View>
  );
}

const styles = StyleSheet.create({
  line: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  diff: { gap: 4, borderRadius: 8, borderWidth: 1, borderColor: '#2a2a30', backgroundColor: '#101014', padding: 8 },
  diffHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.2, color: colors.amber },
  diffLine: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSecondary },
  tier: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 1 },
  btnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  swatch: { width: 14, height: 10, borderRadius: 2 },
});
