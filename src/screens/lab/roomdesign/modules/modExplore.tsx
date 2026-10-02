/**
 * Module 4 — EXPLORE PLACEMENT. Drag speakers and listener; the stereo
 * triangle, boundary distances, first-order reflection paths (image-source)
 * and the modal pressure field of one mode update at once. Save positions as
 * Current / Option A / Option B, flip between them, and read what changed.
 * Modes of a rectangle are CALCULATED (idealized); reflections and levels
 * are ESTIMATED; a non-rectangular room's modes are ESTIMATED and say so.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { fieldLevelColor } from '../../../../features/tools/levelColor';
import { MAX_SAVED_DESIGNS } from '../../../../features/roomdesign/roomDesignStore';
import { flipFader } from '../../soundsystems/rackLayout';
import type { BezelItem, DockParam } from '../../rack/rackTypes';
import { BADGE, SAVE_FAILED, SAVE_HELD, saveLine, type RoomLabCtx } from '../labCtx';
import { RoomRackLayout } from '../rackLayout';
import { PLAN_LEGEND, RoomPlanView, type PlanLayers, type Trace } from '../RoomPlanView';
import { Body, Caption, SAFETY_LEVEL_POINTER, TrayButton, TrayHeading } from '../bits';
import {
  analyze,
  capLayoutHeights,
  clampInside,
  diffLayouts,
  fmtHz,
  fmtLen,
  modePressure,
  nextTraceKey,
  planReflections,
  reflectionKey,
  reflectionSurfaceName,
  START_LAYOUT,
  type Layout,
  type Pt,
  type RoomDesign,
} from '../roomModel';

/** The slots: START is where the positions began; A and B are kept beside it. */
const OPTION_NAMES = ['Option A', 'Option B', START_LAYOUT] as const;
const TRACE_MS = 1700;
const shortName = (name: string) => (name === START_LAYOUT ? 'START' : name.replace('Option ', '').toUpperCase());

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
  // First entry: the mode map and the triangle only; the reflection paths
  // come on with TRACE or LAYERS (cognitive review 19).
  const [layers, setLayers] = useState<PlanLayers>({ triangle: true, boundaries: false, reflections: false, modes: true, dims: false, treatment: true });
  // The traced path is held by its KEY (speaker + surface), not its index:
  // the list re-sorts by delay on every drag (toddler pass 2, 2026-10-01).
  const [traceState, setTraceState] = useState<{ key: string; progress: number } | null>(null);
  const traceRaf = useRef<number | null>(null);
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

  // Every position write ends under the local ceiling (capLayoutHeights).
  const setLayout = (fn: (l: Layout) => Layout) => update((d) => ({ ...d, layouts: d.layouts.map((l, i) => (i === d.active ? capLayoutHeights(fn(l), d.room) : l)) }));
  const onDrag = (id: string, p: Pt) =>
    setLayout((l) => {
      if (id === 'listener') return { ...l, listener: { ...l.listener, ...clampInside(p, room, l.listener) } };
      return { ...l, speakers: l.speakers.map((s) => (s.role === id ? { ...s, ...clampInside(p, room, s) } : s)) };
    });

  // TRACE: animate a pulse along the next reflection path (user-initiated;
  // nothing auto-appears). Cycles through the paths on each press.
  // Cycles through the paths the plan DRAWS (in multichannel: L, R and the
  // selected speaker's), so the pulse never rides a path that is not shown.
  const shown = planReflections(analysis.reflections, lay.speakers, selected);
  const runTrace = () => {
    const key = nextTraceKey(shown, traceState?.key ?? null);
    if (key == null) return;
    setLayers((s) => (s.reflections ? s : { ...s, reflections: true }));
    if (traceRaf.current != null) cancelAnimationFrame(traceRaf.current);
    const t0 = Date.now();
    const step = () => {
      const p = (Date.now() - t0) / TRACE_MS;
      if (p >= 1) {
        setTraceState({ key, progress: 1 });
        traceRaf.current = null;
        return;
      }
      setTraceState({ key, progress: p });
      traceRaf.current = requestAnimationFrame(step);
    };
    step();
  };
  // Looked up afresh in THIS analysis; a path that no longer exists (or is
  // no longer drawn) drops the "Traced" line rather than naming another.
  const tracedIndex = traceState ? analysis.reflections.findIndex((r) => reflectionKey(r) === traceState.key) : -1;
  const traced = tracedIndex >= 0 && shown.includes(analysis.reflections[tracedIndex]) ? analysis.reflections[tracedIndex] : undefined;
  const trace: Trace = traced && traceState ? { index: tracedIndex, progress: traceState.progress } : null;

  const bezel: BezelItem[] = [
    { k: 'MODE', v: mode ? fmtHz(mode.f) : '—', flex: 1.1 },
    { k: 'AT EARS', v: `${Math.round(pAtEars * 100)} %`, tint: fieldLevelColor(pAtEars) },
    { k: 'EARLY <15ms', v: `${early.length}`, flex: 1.1 },
    { k: '1ST', v: first ? `+${first.delayMs.toFixed(1)} ms` : '—' },
  ];

  const params: DockParam[] = [
    flipFader({
      id: 'layout',
      label: 'LAYOUT',
      items: design.layouts.map((l, i) => ({ id: String(i), name: l.name })),
      selectedId: String(design.active),
      onSelect: (id) => update((d) => ({ ...d, active: Number(id) })),
      name: (t) => t.name.toUpperCase(),
      short: (t) => shortName(t.name),
      title: 'KEPT POSITIONS',
      sticky: true,
      blurb: () => 'Flip between kept positions while the plan and the readouts follow. START is where the positions began; SAVE copies what is on the plan into OPTION A, OPTION B or back into START.',
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
        return m ? `${Math.round(m.f)}Hz` : '—';
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
          <Caption>Mode pressure is the one selected mode, at ear height, on the amplitude colour standard: red = a pressure maximum, blue = a null. The map shows the mode's SHAPE, not how strongly the speakers excite it. In multichannel the plan draws the L and R paths; tap a surround to see its own.</Caption>
        </View>
      ),
    },
    { kind: 'action', id: 'trace', label: 'TRACE', onPress: runTrace, tint: colors.cyanBright },
    {
      kind: 'group',
      id: 'save',
      label: 'SAVE',
      valueLabel: shortName(lay.name),
      render: () => <SaveTray ctx={ctx} />,
    },
  ];

  const stage = (w: number, h: number) => (
    <RoomPlanView w={w} h={h} design={design} analysis={analysis} layers={layers} modeIndex={safeModeIdx} edit="monitoring" selected={selected} onSelect={setSelected} onDrag={onDrag} trace={trace} />
  );

  // START's analysis only changes with the room, the treatment or START
  // itself — not on a drag of the active option; the active one IS the
  // host's analysis. One analysis per drag frame instead of three.
  const startLayout = design.layouts[0];
  const startAnalysis = useMemo(
    () => (design.active > 0 ? analyze({ ...design, active: 0 }, 0) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [design.active > 0, design.room, design.treatment, startLayout],
  );
  const diff = design.active > 0 ? diffLayouts(design, 0, design.active, { from: startAnalysis ?? undefined, to: analysis }) : [];

  return (
    <RoomRackLayout
      rack={{ stage, badge: analysis.rectangular ? BADGE.exploreRect : BADGE.exploreApprox, bezel, params, initialParam: 'mode', hideDragTag: true }}
      caption="Drag the listener through the pressure field and watch AT EARS change; drag a speaker and the reflection paths follow. MODE picks which room mode is mapped; TRACE shows the reflection paths and animates the next one from speaker to surface to ear; SAVE keeps a position as OPTION A or B beside START."
      wellTop={
        <View style={{ gap: 6 }}>
          {mode ? (
            <Text style={styles.line}>
              {`${mode.kind} mode (${mode.nx},${mode.ny},${mode.nz}) at ${fmtHz(mode.f)}: the listener sits at ${Math.round(pAtEars * 100)} % of its maximum pressure — ${pAtEars > 0.8 ? 'a peak; that frequency will be heavy here' : pAtEars < 0.2 ? 'a null; that frequency nearly disappears here' : 'between peak and null'}. The map shows the mode's shape, not how strongly the speakers excite it.`}
            </Text>
          ) : null}
          {traced ? (
            <Text style={styles.line}>
              {`Traced: ${traced.speaker} → ${reflectionSurfaceName(traced)} → ears. Path ${fmtLen(traced.pathLen, units)} vs direct ${fmtLen(traced.directLen, units)}: arrives +${traced.delayMs.toFixed(1)} ms, about ${Math.abs(traced.levelDb).toFixed(0)} dB below the direct sound (${traced.offAxisDeg.toFixed(0)}° off the speaker's aim${traced.treatedBy ? ', through treatment' : ''}) — ESTIMATED.`}
            </Text>
          ) : null}
          {diff.length > 0 ? (
            <View style={styles.diff}>
              <Text style={styles.diffHead}>{`${shortName(design.layouts[0].name)} → ${lay.name.toUpperCase()} · WHAT CHANGED`}</Text>
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
        Early reflections are drawn by the image-source method: mirror the speaker in each wall, the floor, the ceiling and the desk top, and the straight line from the image to your ear crosses the surface at the reflection point. The path-length difference is the arrival delay — 1 ms for every 34 cm. Reflections inside about 15 ms blur the stereo image and comb the tone; those are the ones treatment goes after. In a plan with an alcove, a path that would pass through another wall is dropped.
      </Body>
      <Caption>Levels are a mid-band estimate from distance, surface absorption and a simple directivity curve (0 dB to 30° off the speaker's aim, −6 dB at 90°, −15 dB straight behind), so toe-in moves them; a speaker's measured data would replace the curve.</Caption>
      <Caption>{SAFETY_LEVEL_POINTER}</Caption>
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

function SaveTray({ ctx }: { ctx: RoomLabCtx }) {
  const { design, update, guest, preview, resolved, saved, evicts, saveCurrent } = ctx;
  const [msg, setMsg] = useState<{ text: string; ok: boolean; at: RoomDesign } | null>(null);
  // A "Saved" line ends when that save is deleted (toddler pass 3).
  const line = saveLine(msg, design, saved.some((d) => d.id === design.id));
  return (
    <View style={{ gap: 10 }}>
      <TrayHeading>KEEP THESE POSITIONS AS: OPTION A / OPTION B / START</TrayHeading>
      <View style={styles.btnRow}>
        {OPTION_NAMES.map((n) => (
          <TrayButton key={n} label={n.toUpperCase()} onPress={() => update((d) => saveLayoutAs(d, n))} />
        ))}
      </View>
      <Caption>{`START is the baseline the diff reads from; OPTION A and B are the alternatives. Flip between them with the LAYOUT key. ${design.layouts.length} position${design.layouts.length === 1 ? '' : 's'} kept in this design.`}</Caption>
      <TrayHeading>SAVE THE WHOLE DESIGN</TrayHeading>
      <TrayButton
        label={guest ? (preview ? 'SAVE (NOT KEPT — PREVIEW)' : 'SAVE (SIGN IN TO KEEP IT)') : 'SAVE DESIGN TO THIS DEVICE'}
        tint={guest ? 'dim' : 'green'}
        onPress={() => {
          // Before the tier is known the store is save-blocked for everyone, so
          // a signed-in member read "you are not signed in" (night pass 2,
          // 2026-10-01). Neutral until `resolved`.
          // A signed-in members-only PREVIEW is not "not signed in" (night
          // pass 3, 2026-10-01).
          const known = resolved;
          const asPreview = preview;
          // A member whose device write failed is told THAT, not "you are
          // not signed in" (toddler pass 2): the tier as it was at the tap.
          const asGuest = guest;
          const gone = evicts?.name ?? null;
          // `at` is the design as filed (a clashing name is numbered on —
          // toddler pass 3), which is the one on screen after the save.
          void saveCurrent().then(({ ok, at, held }) =>
            setMsg({
              ok,
              at,
              text: ok
                ? `Saved "${at.name}" on this device.${gone ? ` The library keeps ${MAX_SAVED_DESIGNS}: the oldest, "${gone}", was removed to make room.` : ''}`
                : !known
                  ? 'Not saved yet — still checking your account. Tap SAVE again in a moment.'
                  : asPreview
                    ? 'Kept for this session only — this lab is part of membership, and designs made in a preview are not saved.'
                    : asGuest
                      ? held
                        ? SAVE_HELD
                        : 'Kept on screen only — you are not signed in, so this design is not saved.'
                      : SAVE_FAILED,
            }),
          );
        }}
      />
      {line ? <Caption>{line}</Caption> : null}
      <Caption>{guest ? (preview ? 'You can design freely; designs made in a preview are not saved.' : 'You can design freely. Nothing is saved until you sign in — sign in before you close the app and the designs you SAVE are kept on this device.') : 'The REVIEW module lists saved designs and compares a saved "before" with the current setup.'}</Caption>
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
