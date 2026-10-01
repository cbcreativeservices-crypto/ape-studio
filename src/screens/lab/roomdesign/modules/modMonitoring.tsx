/**
 * Module 3 — MONITORING SETUP. Stereo, stereo + sub or multichannel; speaker
 * and listener positions, heights, toe-in; nearfield / midfield; the
 * speaker-to-listener distances, listening angle, left/right symmetry and
 * clear placement conflicts, live. Drag on the plan or the side view, or
 * ride the lane. Distances and angles are CALCULATED.
 */
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { lanePos, laneVal } from '../../soundsystems/rackLayout';
import type { BezelItem, DockParam } from '../../rack/rackTypes';
import { BADGE, type RoomLabCtx } from '../labCtx';
import { RoomRackLayout } from '../rackLayout';
import { RoomPlanView } from '../RoomPlanView';
import { RoomSideView } from '../RoomSideView';
import { Body, Caption, Chips, SAFETY_LEVEL_NOTE, TrayHeading } from '../bits';
import {
  bounds,
  channelGeometry,
  clampInside,
  fmtDelta,
  fmtHz,
  fmtLen,
  keepDesignInside,
  placementConflicts,
  SBIR_MAX_HZ,
  subBoundaries,
  surroundPosition,
  SYM_TOL,
  type Layout,
  type MonitoringConfig,
  type MonitoringField,
  type Pt,
  type RoomDesign,
  type Speaker,
} from '../roomModel';

const CONFIGS: { id: MonitoringConfig; label: string }[] = [
  { id: 'stereo', label: 'STEREO' },
  { id: 'stereo_sub', label: 'STEREO + SUB' },
  { id: 'multichannel', label: 'MULTICHANNEL' },
];
const FIELDS: { id: MonitoringField; label: string }[] = [
  { id: 'nearfield', label: 'NEARFIELD' },
  { id: 'midfield', label: 'MIDFIELD' },
  { id: 'other', label: 'OTHER' },
];
const TOES: { id: '0' | '15' | '30'; label: string }[] = [
  { id: '0', label: 'STRAIGHT' },
  { id: '15', label: 'TOE-IN 15°' },
  { id: '30', label: 'TOE-IN 30°' },
];
type HeightTarget = 'tweeter' | 'ears' | 'sub';

/** Rebuild the speaker list for a configuration, keeping L, R and the
 *  listener. The surrounds spawn on the ITU-R BS.775 circle (the L/R radius
 *  at ±110°, audio review 8); every spawn is clamped inside the polygon
 *  (cognitive review 2). */
export function applyConfig(d: RoomDesign, config: MonitoringConfig): RoomDesign {
  const b = bounds(d.room);
  const inside = (p: Pt) => clampInside(p, d.room, { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 });
  const layouts = d.layouts.map((l): Layout => {
    const L = l.speakers.find((s) => s.role === 'L') ?? { role: 'L' as const, ...inside({ x: b.minX + b.width * 0.3, y: b.minY + 0.9 }), z: 1.2, toeDeg: 30 };
    const R = l.speakers.find((s) => s.role === 'R') ?? { role: 'R' as const, ...inside({ x: b.maxX - b.width * 0.3, y: b.minY + 0.9 }), z: 1.2, toeDeg: 30 };
    const keep = (role: Speaker['role'], make: () => Speaker) => l.speakers.find((s) => s.role === role) ?? make();
    const spk: Speaker[] = [L, R];
    if (config !== 'stereo') spk.push(keep('SUB', () => ({ role: 'SUB', ...inside({ x: b.minX + 0.45, y: b.minY + 0.45 }), z: 0.25, toeDeg: 0 })));
    if (config === 'multichannel') {
      spk.push(keep('C', () => ({ role: 'C', ...inside({ x: (L.x + R.x) / 2, y: L.y }), z: L.z, toeDeg: 0 })));
      const base = { ...l, speakers: [L, R] };
      spk.push(keep('LS', () => ({ role: 'LS', ...surroundPosition(d.room, base, 'LS'), z: L.z, toeDeg: 0 })));
      spk.push(keep('RS', () => ({ role: 'RS', ...surroundPosition(d.room, base, 'RS'), z: R.z, toeDeg: 0 })));
    }
    return { ...l, speakers: spk };
  });
  return keepDesignInside({ ...d, layouts, monitoring: { ...d.monitoring, config } });
}

export function MonitoringModule({ ctx }: { ctx: RoomLabCtx }) {
  const { design, update, analysis, units } = ctx;
  const room = design.room;
  const lay = design.layouts[design.active] ?? design.layouts[0];
  const b = analysis.bounds;
  const [view, setView] = useState<'plan' | 'side'>('plan');
  const [selected, setSelected] = useState<string | null>('listener');
  const [heightTarget, setHeightTarget] = useState<HeightTarget>('tweeter');
  const st = analysis.stereo;
  const conflicts = placementConflicts(design, analysis);
  const multi = design.monitoring.config === 'multichannel';
  const channels = multi ? channelGeometry(lay).filter((c) => c.role !== 'L' && c.role !== 'R') : [];

  const setLayout = (fn: (l: Layout) => Layout) => update((d) => ({ ...d, layouts: d.layouts.map((l, i) => (i === d.active ? fn(l) : l)) }));
  const L = lay.speakers.find((s) => s.role === 'L');
  const R = lay.speakers.find((s) => s.role === 'R');
  const SUB = lay.speakers.find((s) => s.role === 'SUB');
  const subGain = SUB ? subBoundaries(room, SUB) : null;
  const spread = L && R ? Math.hypot(R.x - L.x, R.y - L.y) : 1.6;
  const front = L && R ? (L.y + R.y) / 2 - b.minY : 1;
  const listenY = lay.listener.y - b.minY;

  const onDrag = (id: string, p: Pt) => {
    setLayout((l) => {
      if (id === 'listener') return { ...l, listener: { ...l.listener, ...clampInside(p, room, l.listener) } };
      return { ...l, speakers: l.speakers.map((s) => (s.role === id ? { ...s, ...clampInside(p, room, s) } : s)) };
    });
  };
  const onSideDrag = (id: string, p: { y: number; z: number }) => {
    const zMax = room.height - 0.1;
    setLayout((l) => {
      if (id === 'listener') return { ...l, listener: { ...l.listener, ...clampInside({ x: l.listener.x, y: p.y }, room, l.listener), earZ: Math.max(0.6, Math.min(zMax, p.z)) } };
      return { ...l, speakers: l.speakers.map((s) => (s.role === id ? { ...s, ...clampInside({ x: s.x, y: p.y }, room, s), z: Math.max(0.1, Math.min(zMax, p.z)) } : s)) };
    });
  };

  const bezel: BezelItem[] = st
    ? [
        { k: 'VIEW', v: view === 'plan' ? 'PLAN' : 'SIDE', onPress: () => setView((v) => (v === 'plan' ? 'side' : 'plan')) },
        { k: 'DIST L', v: fmtLen(st.distL, units), flex: 1.1 },
        { k: 'DIST R', v: fmtLen(st.distR, units), flex: 1.1 },
        { k: 'ANGLE', v: `${st.angleDeg.toFixed(0)}°` },
        { k: 'L−R', v: fmtDelta(st.distL - st.distR, units), tint: st.pathDiff > SYM_TOL ? '#ff5a48' : colors.green, flex: 1.1 },
      ]
    : [{ k: 'VIEW', v: view === 'plan' ? 'PLAN' : 'SIDE', onPress: () => setView((v) => (v === 'plan' ? 'side' : 'plan')) }];

  const heightVal = heightTarget === 'ears' ? lay.listener.earZ : heightTarget === 'sub' ? (SUB?.z ?? 0.25) : (L?.z ?? 1.2);
  const setHeight = (z: number) =>
    setLayout((l) => {
      if (heightTarget === 'ears') return { ...l, listener: { ...l.listener, earZ: z } };
      const roles: Speaker['role'][] = heightTarget === 'sub' ? ['SUB'] : ['L', 'R', 'C', 'LS', 'RS'];
      return { ...l, speakers: l.speakers.map((s) => (roles.includes(s.role) ? { ...s, z } : s)) };
    });
  const H_MAX = Math.max(1.2, room.height - 0.1);

  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'spread',
      label: 'SPREAD',
      value: lanePos(spread, 0.6, Math.max(1.2, b.width - 0.4)),
      onChange: (v) => {
        const s = laneVal(v, 0.6, Math.max(1.2, b.width - 0.4), 0.01);
        setLayout((l) => {
          const l0 = l.speakers.find((x) => x.role === 'L');
          const r0 = l.speakers.find((x) => x.role === 'R');
          if (!l0 || !r0) return l;
          const mx = (l0.x + r0.x) / 2;
          // Every lane write lands inside the polygon (cognitive review 2).
          return { ...l, speakers: l.speakers.map((x) => (x.role === 'L' ? { ...x, ...clampInside({ x: mx - s / 2, y: x.y }, room, x) } : x.role === 'R' ? { ...x, ...clampInside({ x: mx + s / 2, y: x.y }, room, x) } : x)) };
        });
      },
      format: (v) => `${fmtLen(laneVal(v, 0.6, Math.max(1.2, b.width - 0.4), 0.01), units)} between L and R`,
      formatShort: (v) => fmtLen(laneVal(v, 0.6, Math.max(1.2, b.width - 0.4), 0.01), units),
    },
    {
      kind: 'fader',
      id: 'front',
      label: 'FRONT',
      value: lanePos(front, 0.2, Math.max(0.6, b.length - 1)),
      onChange: (v) => {
        const y = b.minY + laneVal(v, 0.2, Math.max(0.6, b.length - 1), 0.01);
        setLayout((l) => ({ ...l, speakers: l.speakers.map((x) => (x.role === 'L' || x.role === 'R' || x.role === 'C' ? { ...x, ...clampInside({ x: x.x, y }, room, x) } : x)) }));
      },
      format: (v) => `${fmtLen(laneVal(v, 0.2, Math.max(0.6, b.length - 1), 0.01), units)} from the front wall`,
      formatShort: (v) => fmtLen(laneVal(v, 0.2, Math.max(0.6, b.length - 1), 0.01), units),
    },
    {
      kind: 'fader',
      id: 'listen',
      label: 'LISTENER',
      value: lanePos(listenY, 0.4, Math.max(0.8, b.length - 0.3)),
      onChange: (v) => {
        const y = b.minY + laneVal(v, 0.4, Math.max(0.8, b.length - 0.3), 0.01);
        setLayout((l) => ({ ...l, listener: { ...l.listener, ...clampInside({ x: l.listener.x, y }, room, l.listener) } }));
      },
      format: (v) => `${fmtLen(laneVal(v, 0.4, Math.max(0.8, b.length - 0.3), 0.01), units)} from the front wall`,
      formatShort: (v) => fmtLen(laneVal(v, 0.4, Math.max(0.8, b.length - 0.3), 0.01), units),
      tint: colors.green,
    },
    {
      kind: 'fader',
      id: 'height',
      label: 'HEIGHT',
      value: lanePos(heightVal, 0.1, H_MAX),
      onChange: (v) => setHeight(laneVal(v, 0.1, H_MAX, 0.01)),
      format: (v) => `${heightTarget === 'ears' ? 'ears' : heightTarget === 'sub' ? 'sub driver' : 'tweeters'} ${fmtLen(laneVal(v, 0.1, H_MAX, 0.01), units)}`,
      formatShort: (v) => fmtLen(laneVal(v, 0.1, H_MAX, 0.01), units),
      chooser: {
        title: 'WHICH HEIGHT',
        options: [
          { id: 'tweeter', label: 'Tweeter height (all speakers)', blurb: 'The acoustic centre of each monitor. Most makers design for the tweeter at or just above ear height.' },
          { id: 'ears', label: 'Seated ear height', blurb: 'Where your ears are when you sit to mix — measure it; typical seated ear height is 1.1–1.3 m.' },
          ...(SUB ? [{ id: 'sub', label: 'Subwoofer driver height', blurb: 'A sub usually sits on the floor; its height barely matters below 80 Hz.' }] : []),
        ],
        selectedId: heightTarget,
        onSelect: (id) => setHeightTarget(id as HeightTarget),
      },
    },
    {
      kind: 'group',
      id: 'setup',
      label: 'SETUP',
      valueLabel: design.monitoring.config === 'stereo' ? 'STEREO' : design.monitoring.config === 'stereo_sub' ? '2.1' : 'MULTI',
      render: () => <SetupTray ctx={ctx} />,
    },
  ];

  const stage = (w: number, h: number) =>
    view === 'plan' ? (
      <RoomPlanView w={w} h={h} design={design} analysis={analysis} layers={{ triangle: true, boundaries: true, dims: true, treatment: false }} edit="monitoring" selected={selected} onSelect={setSelected} onDrag={onDrag} />
    ) : (
      <RoomSideView w={w} h={h} design={design} analysis={analysis} edit selected={selected} onSelect={setSelected} onDrag={onSideDrag} showReflections={false} />
    );

  const sbirL = analysis.sbir.filter((s) => s.speaker === 'L');
  const sbirLine =
    sbirL.length > 0
      ? `First cancellations at the seat, L (ESTIMATED, woofer band): ${sbirL.map((s) => `${s.surface} ${fmtLen(s.distance, units, { small: true })} → ~${fmtHz(s.notchHz)}`).join(' · ')}. Shown below ~${SBIR_MAX_HZ} Hz, where the woofer radiates in every direction; higher nulls at odd multiples. Distances are to the woofer/baffle.`
      : `No boundary cancellation below ~${SBIR_MAX_HZ} Hz at the seat (ESTIMATED).`;

  return (
    <RoomRackLayout
      rack={{ stage, badge: BADGE.monitoring, bezel, params, initialParam: 'spread', hideDragTag: true }}
      caption="Drag the speakers and the listener on the plan (tap VIEW for heights in the side view), or ride SPREAD, FRONT, LISTENER and HEIGHT. SETUP picks stereo, stereo + sub or multichannel, nearfield or midfield, and toe-in."
      captionFirst
      wellTop={
        <View style={{ gap: 6 }}>
          {st ? (
            <Text style={styles.line}>
              {`Listening angle ${st.angleDeg.toFixed(0)}° · L ${fmtLen(st.distL, units)} · R ${fmtLen(st.distR, units)} · difference ${fmtLen(st.pathDiff, units, { small: true })} ${st.pathDiff > SYM_TOL ? '— beyond the ' + fmtLen(SYM_TOL, units, { small: true }) + ' tolerance, the centre image pulls' : '— within tolerance'}.`}
            </Text>
          ) : null}
          {st ? (
            <Text style={styles.line}>
              {`Listener ${fmtLen(Math.abs(st.axisOffset), units, { small: true })} ${Math.abs(st.axisOffset) < 0.02 ? 'from' : st.axisOffset > 0 ? 'right of' : 'left of'} the centre line · side walls L ${fmtLen(st.wallL.side, units)} / R ${fmtLen(st.wallR.side, units)} · front wall (to the woofer) L ${fmtLen(st.wallL.front, units)} / R ${fmtLen(st.wallR.front, units)} · tweeters ${fmtDelta(st.heightDiff, units)} vs ears.`}
            </Text>
          ) : null}
          {channels.length > 0 ? (
            <Text style={styles.line}>
              {`BS.775 check · ${channels.map((c) => `${c.role} ${c.angleDeg.toFixed(0)}° ${fmtLen(c.distance, units)}${c.flags.length ? ` ! ${c.flags.join(', ')}` : ' ✓'}`).join(' · ')}. Surrounds belong at ±100–120°, all speakers equidistant from the ears or delay-aligned.`}
            </Text>
          ) : null}
          {subGain ? (
            <Text style={styles.line}>
              {subGain.count > 0
                ? `SUB boundary gain (ESTIMATED): within λ/4 of ${subGain.count} boundar${subGain.count === 1 ? 'y' : 'ies'} (${subGain.names.join(', ')}) → about +6 dB per boundary below ~190 Hz. A floor sub gets gain from its boundaries, not a notch.`
                : 'SUB away from every boundary: no boundary gain, and the middle of the room drives the first modes weakly (ESTIMATED).'}
            </Text>
          ) : null}
          <Caption>{sbirLine}</Caption>
          {conflicts.length > 0 ? (
            <View style={styles.conflicts}>
              <Text style={styles.conflictHead}>PLACEMENT CONFLICTS</Text>
              {conflicts.map((c, i) => (
                <Text key={i} style={styles.conflict}>
                  {`! ${c.text}`}
                </Text>
              ))}
            </View>
          ) : (
            <Text style={styles.ok}>No placement conflicts in the model.</Text>
          )}
        </View>
      }
    >
      <Body>
        A good starting point, not a law: the two speakers and your head form an equilateral triangle (a 60° listening angle), the two speakers sit at the same distance from their side walls and from the front wall, and the listening position is on the room's centre line. Matched left and right geometry is what the makers of monitors ask for first, because the two early-reflection sets then arrive alike and the centre image stays put.
      </Body>
      <Body>
        Nearfield monitors are meant to be heard from about 1–1.5 m, midfields from about 2–4 m; further away the room takes over from the speaker. Tweeters at or slightly above ear height, with the speakers toed in so their axes cross at or just behind your head, is where most people begin — then they listen, and move things.
      </Body>
      <Caption>A stand must be rated for the monitor's mass with a wide or weighted base; midfields and anything on a wall bracket go into structure with rated hardware. Route cables along the wall, never across a walkway.</Caption>
      <Caption>{SAFETY_LEVEL_NOTE}</Caption>
      <Caption>{`The cancellation guide above comes from the image-source path difference at the seat: the bounce arrives Δ = path − direct late and cancels where Δ is half a wavelength, f = c ÷ (2 × Δ). Only straight out from the wall does that reduce to the familiar c ÷ (4 × distance).`}</Caption>
    </RoomRackLayout>
  );
}

function SetupTray({ ctx }: { ctx: RoomLabCtx }) {
  const { design, update } = ctx;
  const lay = design.layouts[design.active] ?? design.layouts[0];
  const L = lay.speakers.find((s) => s.role === 'L');
  const toe = String(L?.toeDeg ?? 30) as '0' | '15' | '30';
  const toeOn = TOES.some((t) => t.id === toe) ? toe : null;
  return (
    <View style={{ gap: 10 }}>
      <TrayHeading>CONFIGURATION</TrayHeading>
      <Chips items={CONFIGS} value={design.monitoring.config} onPick={(id) => update((d) => applyConfig(d, id))} />
      <Caption>Stereo + sub adds a subwoofer you can drag anywhere; multichannel adds a centre and two surrounds. The sub's position changes which room modes it drives — try it in a corner and in the middle and compare. Two subs in mirrored positions even the bass out; or do the sub crawl: play a bass loop with the sub at the seat and crawl the floor for the evenest spot, then put the sub there.</Caption>
      <Caption>Set the sub's crossover, polarity and phase/delay by measuring at the seat — the wrong polarity makes a hole at the crossover frequency.</Caption>
      <Caption>ITU-R BS.775: centre 0°, L/R ±30°, surrounds ±100–120°, all equidistant from the ears or delay-aligned. The surrounds spawn on that circle; the readouts above flag an angle or a distance that drifts.</Caption>
      <Caption>After calibrating, leave the monitors' own gain alone and set level at the monitor controller; red clip lights on a monitor mean turn down, not treat the room.</Caption>
      <TrayHeading>LISTENING DISTANCE CLASS</TrayHeading>
      <Chips items={FIELDS} value={design.monitoring.field} onPick={(id) => update((d) => ({ ...d, monitoring: { ...d.monitoring, field: id } }))} />
      <TrayHeading>TOE-IN</TrayHeading>
      <Chips
        items={TOES}
        value={toeOn}
        onPick={(id) => {
          const deg = Number(id);
          update((d) => ({ ...d, layouts: d.layouts.map((l) => ({ ...l, speakers: l.speakers.map((s) => (s.role === 'SUB' ? s : { ...s, toeDeg: s.role === 'C' ? 0 : deg })) })) }));
        }}
      />
      <TrayHeading>MONITOR MODEL (OPTIONAL)</TrayHeading>
      <TextInput
        style={styles.input}
        value={design.monitoring.model}
        onChangeText={(t) => update((d) => ({ ...d, monitoring: { ...d.monitoring, model: t.slice(0, 40) } }))}
        placeholder="e.g. 5-inch two-way nearfield"
        placeholderTextColor="#55575f"
        accessibilityLabel="Monitor model or type"
      />
      <Caption>Just a label for your notes — the model does not look up speaker data.</Caption>
    </View>
  );
}

const styles = StyleSheet.create({
  line: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  conflicts: { gap: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,90,72,0.45)', backgroundColor: '#1a1110', padding: 8 },
  conflictHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.3, color: '#ff8a5c' },
  conflict: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSecondary },
  ok: { fontFamily: fonts.barlowMedium, fontSize: 12.5, color: colors.green },
  input: { fontFamily: fonts.barlowMedium, fontSize: 14, color: colors.textPrimary, borderWidth: 1, borderColor: '#2c2c33', borderRadius: 8, backgroundColor: '#0c0c0f', paddingHorizontal: 10, paddingVertical: 8 },
});
