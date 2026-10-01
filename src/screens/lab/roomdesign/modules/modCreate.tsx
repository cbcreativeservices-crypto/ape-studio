/**
 * Module 2 — CREATE THE ROOM. The room editor on the Rack Unit: the plan (or
 * the side view) pinned on the glass, LENGTH / WIDTH / HEIGHT on the lane,
 * SHAPE and SURFACE trays, drag the corners and the furniture on the glass or
 * type the numbers in the tray. Every number here is CALCULATED.
 */
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { confirmDialog } from '../../../../lib/confirm';
import { lanePos, laneVal } from '../../soundsystems/rackLayout';
import type { BezelItem, DockParam } from '../../rack/rackTypes';
import { BADGE, type RoomLabCtx } from '../labCtx';
import { RoomRackLayout } from '../rackLayout';
import { RoomPlanView } from '../RoomPlanView';
import { RoomSideView } from '../RoomSideView';
import { Body, Caption, Chips, NumField, TrayButton, TrayHeading } from '../bits';
import {
  bounds,
  CEILING_OPTIONS,
  defaultDesign,
  FLOOR_OPTIONS,
  fmtLen,
  freeOpeningSlot,
  fromMetres,
  keepDesignInside,
  newId,
  polygonArea,
  polygonIsValidRoom,
  resizeDesign,
  ROOM_MAX_M,
  roomVolume,
  shapeVertices,
  SURFACES,
  toMetres,
  WALL_OPTIONS,
  type CeilingType,
  type Pt,
  type Room,
  type RoomDesign,
  type SurfaceKey,
  type Units,
  type WallShape,
} from '../roomModel';

const SHAPES: { id: WallShape; label: string }[] = [
  { id: 'rect', label: 'RECTANGLE' },
  { id: 'angled', label: 'ANGLED' },
  { id: 'irregular', label: 'IRREGULAR' },
  { id: 'curved', label: 'CURVED' },
];
const CEILINGS: { id: CeilingType; label: string }[] = [
  { id: 'flat', label: 'FLAT' },
  { id: 'sloped', label: 'SLOPED' },
  { id: 'vaulted', label: 'VAULTED' },
  { id: 'mixed', label: 'MIXED' },
];
const UNITS: { id: Units; label: string }[] = [
  { id: 'metric', label: 'METRES · CM' },
  { id: 'imperial', label: 'FEET · INCHES' },
];

// Lane ranges, metres.
const LEN_MIN = 2;
const LEN_MAX = ROOM_MAX_M;
const H_MIN = 2;
const H_MAX = 6;
const SHAPE_SHORT: Record<WallShape, string> = { rect: 'RECT', angled: 'ANGLD', irregular: 'IRREG', curved: 'CURVD' };
const FLASH_MS = 1000;

export function CreateModule({ ctx }: { ctx: RoomLabCtx }) {
  const { design, update, analysis, units } = ctx;
  const room = design.room;
  const b = analysis.bounds;
  const [view, setView] = useState<'plan' | 'side'>('plan');
  const [selected, setSelected] = useState<string | null>(null);
  // A just-added opening flashes for a second so the learner sees where it
  // landed (user-initiated: it answers their own tap).
  const [flash, setFlash] = useState<string | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
  }, []);
  const flashId = (id: string) => {
    setFlash(id);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), FLASH_MS);
  };

  // Room edits that can move a wall re-validate every layout (cognitive
  // review 1): speakers, listener and free-standing treatment are pushed back
  // inside the polygon.
  const setRoom = (fn: (r: Room) => Room) => update((d) => keepDesignInside({ ...d, room: fn(d.room) }));
  const setDims = (width: number, length: number) => update((d) => resizeDesign(d, width, length));
  const onCeiling = (ceiling: CeilingType) => {
    setRoom((r) => ({ ...r, ceiling }));
    // A ceiling shape is invisible on the plan: show the side view for it
    // (cognitive review 8).
    if (ceiling !== 'flat' && view === 'plan') setView('side');
  };

  const unitLabel = units === 'metric' ? 'm' : 'ft';
  const fmtU = (m: number) => fmtLen(m, units);

  const bezel: BezelItem[] = [
    { k: 'VIEW', v: view === 'plan' ? 'PLAN' : 'SIDE', onPress: () => setView((v) => (v === 'plan' ? 'side' : 'plan')) },
    { k: 'AREA', v: units === 'metric' ? `${analysis.area.toFixed(1)} m²` : `${(analysis.area / 0.09290304).toFixed(0)} ft²`, flex: 1.2 },
    { k: 'VOLUME', v: units === 'metric' ? `${analysis.volume.toFixed(1)} m³` : `${(analysis.volume / 0.028316846592).toFixed(0)} ft³`, flex: 1.2 },
    { k: 'L:W:H', v: ratioText(b.length, b.width, analysis.modalDims.H), flex: 1.3 },
  ];

  const onDrag = (id: string, p: Pt) => {
    if (id.startsWith('v')) {
      const i = Number(id.slice(1));
      setRoom((r) => {
        // Corners live in 0 … ROOM_MAX_M; a drag that would cross the walls
        // (a bow-tie) or shrink the plan under 1 m² is refused (safety review 5).
        const q = { x: Math.max(0, Math.min(ROOM_MAX_M, p.x)), y: Math.max(0, Math.min(ROOM_MAX_M, p.y)) };
        const vertices = r.vertices.map((v, j) => (j === i ? q : v));
        if (!polygonIsValidRoom(vertices)) return r;
        // A corner moved by hand: the plan is whatever it is now.
        const shape: WallShape = r.shape === 'rect' && !isStillRect(vertices) ? 'irregular' : r.shape;
        return { ...r, vertices, shape };
      });
    } else if (id.startsWith('f_')) {
      const fid = id.slice(2);
      setRoom((r) => ({ ...r, features: r.features.map((f) => (f.id === fid ? { ...f, x: p.x, y: p.y } : f)) }));
    }
  };

  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'length',
      label: 'LENGTH',
      value: lanePos(b.length, LEN_MIN, LEN_MAX),
      onChange: (v) => setDims(b.width, laneVal(v, LEN_MIN, LEN_MAX, 0.05)),
      format: (v) => fmtU(laneVal(v, LEN_MIN, LEN_MAX, 0.05)),
      formatShort: (v) => fmtLen(laneVal(v, LEN_MIN, LEN_MAX, 0.05), units),
    },
    {
      kind: 'fader',
      id: 'width',
      label: 'WIDTH',
      value: lanePos(b.width, LEN_MIN, LEN_MAX),
      onChange: (v) => setDims(laneVal(v, LEN_MIN, LEN_MAX, 0.05), b.length),
      format: (v) => fmtU(laneVal(v, LEN_MIN, LEN_MAX, 0.05)),
      formatShort: (v) => fmtLen(laneVal(v, LEN_MIN, LEN_MAX, 0.05), units),
    },
    {
      kind: 'fader',
      id: 'height',
      label: 'CEILING',
      value: lanePos(room.height, H_MIN, H_MAX),
      onChange: (v) =>
        setRoom((r) => {
          const height = laneVal(v, H_MIN, H_MAX, 0.05);
          return { ...r, height, heightLow: Math.min(r.heightLow, height - 0.1) };
        }),
      format: (v) => `${fmtU(laneVal(v, H_MIN, H_MAX, 0.05))}${room.ceiling === 'flat' ? '' : ' (high point)'}`,
      formatShort: (v) => fmtLen(laneVal(v, H_MIN, H_MAX, 0.05), units),
    },
    {
      kind: 'group',
      id: 'shape',
      label: 'SHAPE',
      valueLabel: SHAPE_SHORT[room.shape],
      render: () => <ShapeTray room={room} units={units} setRoom={setRoom} setDims={setDims} b={b} onCeiling={onCeiling} onAddedOpening={flashId} update={update} />,
    },
    {
      kind: 'group',
      id: 'surface',
      label: 'FINISH',
      valueLabel: SURFACES[room.floor].short,
      render: () => <SurfaceTray room={room} setRoom={setRoom} />,
    },
  ];

  const stage = (w: number, h: number) =>
    view === 'plan' ? (
      <RoomPlanView w={w} h={h} design={design} analysis={analysis} layers={{ dims: true, treatment: false }} edit="room" selected={selected} onSelect={setSelected} onDrag={onDrag} highlight={flash} />
    ) : (
      <RoomSideView w={w} h={h} design={design} analysis={analysis} showReflections={false} />
    );

  const notRect = !analysis.rectangular;

  return (
    <RoomRackLayout
      rack={{ stage, badge: BADGE.create, bezel, params, initialParam: 'length', hideDragTag: true }}
      caption="Drag a corner to reshape the room, or ride LENGTH / WIDTH / CEILING. SHAPE opens the plan presets, the ceiling, doors and windows, furniture, typed dimensions and a fresh default room; FINISH sets the floor, walls and ceiling material. Tap VIEW on the readouts for the side view."
      wellTop={
        <View style={styles.summary}>
          <Text style={styles.summaryLine}>
            {`${room.shape.toUpperCase()} plan · ${fmtU(b.width)} wide × ${fmtU(b.length)} long · ${room.ceiling} ceiling ${fmtU(room.height)}${room.ceiling === 'flat' ? '' : ` to ${fmtU(room.heightLow)}`}`}
          </Text>
          <Text style={styles.summaryLine}>
            {`Floor ${SURFACES[room.floor].label} · walls ${SURFACES[room.walls].label} · ceiling ${SURFACES[room.ceilingMat].label} · ${room.openings.length} opening${room.openings.length === 1 ? '' : 's'} · ${room.features.length} object${room.features.length === 1 ? '' : 's'}`}
          </Text>
          {notRect ? <Text style={styles.warn}>{room.ceiling !== 'flat' && room.shape === 'rect' ? `A ${room.ceiling} ceiling: the mode estimates later use the mean ceiling height and are LESS reliable.` : 'Not a rectangle: the mode estimates later use the bounding box and are LESS reliable.'}</Text> : null}
        </View>
      }
    >
      <Body>
        Build the room you actually have. Start from the quick rectangle and set its length, width and ceiling, or choose an angled, irregular or curved plan and drag the corners to match. Doors, windows and large objects matter: a window is a hard, slightly bass-leaky surface; an open doorway absorbs everything that reaches it; a desk is a reflecting shelf under the speakers — the model draws that bounce.
      </Body>
      <Body>
        The numbers on the bezel — area, volume, the length : width : height ratio — are plain arithmetic from your entries. Ratios near 1 : 1 : 1 or 2 : 1 stack room modes on the same frequencies; the famous "good ratios" (for example 1 : 1.4 : 1.9) spread them out. You cannot usually move walls, but knowing the ratio tells you what to expect in the bass.
      </Body>
      <Caption>Units convert exactly (1 ft = 0.3048 m, 1 in = 25.4 mm). Dimension entry accepts decimals in the chosen unit.</Caption>
    </RoomRackLayout>
  );
}

function isStillRect(v: Pt[]): boolean {
  if (v.length !== 4) return false;
  const xs = new Set(v.map((p) => Math.round(p.x * 1000)));
  const ys = new Set(v.map((p) => Math.round(p.y * 1000)));
  return xs.size === 2 && ys.size === 2;
}

function ratioText(L: number, W: number, H: number): string {
  if (!(H > 0)) return '—';
  // Compact on purpose: a bezel cell on a 390 phone has ~9 mono characters,
  // and a cropped readout must never cut its number.
  const sorted = [L, W, H].sort((a, b) => a - b);
  const base = sorted[0] || 1;
  return `1:${(sorted[1] / base).toFixed(1)}:${(sorted[2] / base).toFixed(1)}`;
}

/* ───────────────────────────────── trays ───────────────────────────────── */

function ShapeTray({
  room,
  units,
  setRoom,
  setDims,
  b,
  onCeiling,
  onAddedOpening,
  update,
}: {
  room: Room;
  units: Units;
  setRoom: (fn: (r: Room) => Room) => void;
  setDims: (w: number, l: number) => void;
  b: ReturnType<typeof bounds>;
  onCeiling: (c: CeilingType) => void;
  onAddedOpening: (id: string) => void;
  update: (fn: (d: RoomDesign) => RoomDesign) => void;
}) {
  const u = units === 'metric' ? 'm' : 'ft';
  const pickShape = (shape: WallShape) =>
    setRoom((r) => {
      const bb = bounds(r);
      return { ...r, shape, vertices: shapeVertices(shape, bb.width, bb.length), curvedWall: shape === 'curved' ? 2 : undefined };
    });
  const addOpening = (kind: 'door' | 'window' | 'opening') => {
    const id = newId('op');
    setRoom((r) => {
      const n = r.vertices.length;
      const preferred = kind === 'window' ? 1 % n : (n - 2 + n) % n;
      const spec = kind === 'door' ? { width: 0.9, height: 2.05, sill: 0 } : kind === 'window' ? { width: 1.2, height: 1.1, sill: 0.95 } : { width: 1.6, height: 2.1, sill: 0 };
      // The first free slot: never on top of an opening already there.
      const slot = freeOpeningSlot(r, preferred, spec.width);
      return { ...r, openings: [...r.openings, { id, kind, wall: slot.wall, pos: slot.pos, ...spec }] };
    });
    onAddedOpening(`op_${id}`);
  };
  const newRoom = () =>
    confirmDialog('New room?', `Replace this design with the default ${fmtLen(4, units)} × ${fmtLen(5, units)} room. Saved designs are not touched; nothing you have earned changes.`, 'NEW ROOM', () => update((d) => ({ ...defaultDesign(d.room.units), name: d.name })));
  const addFeature = (kind: 'desk' | 'sofa' | 'bookshelf' | 'rack') =>
    setRoom((r) => {
      const bb = bounds(r);
      const spec = kind === 'desk' ? { w: 1.5, d: 0.7, h: 0.74 } : kind === 'sofa' ? { w: 1.8, d: 0.9, h: 0.85 } : kind === 'bookshelf' ? { w: 0.9, d: 0.35, h: 2.0 } : { w: 0.6, d: 0.6, h: 1.2 };
      const y = kind === 'desk' ? bb.minY + 1.4 : bb.maxY - 0.8;
      return { ...r, features: [...r.features, { id: newId('ft'), kind, x: (bb.minX + bb.maxX) / 2 + (r.features.length % 2 ? 0.8 : -0.8), y, ...spec }] };
    });
  return (
    <View style={{ gap: 10 }}>
      <TrayHeading>UNITS</TrayHeading>
      <Chips items={UNITS} value={room.units} onPick={(id) => setRoom((r) => ({ ...r, units: id }))} />
      <TrayHeading>TYPE THE DIMENSIONS</TrayHeading>
      <View style={styles.numRow}>
        <NumField label="LENGTH" value={fromMetres(b.length, units)} unit={u} onCommit={(v) => setDims(b.width, clampLen(toMetres(v, units)))} />
        <NumField label="WIDTH" value={fromMetres(b.width, units)} unit={u} onCommit={(v) => setDims(clampLen(toMetres(v, units)), b.length)} />
        <NumField label="CEILING" value={fromMetres(room.height, units)} unit={u} onCommit={(v) =>
            setRoom((r) => {
              // Typed like the CEILING lane: the low point stays under the
              // high point (a typed 2.0 m over a 2.2 m low point inverted a
              // sloped ceiling — bug pass 2026-10-01).
              const height = Math.max(H_MIN, Math.min(H_MAX, toMetres(v, units)));
              return { ...r, height, heightLow: Math.min(r.heightLow, height - 0.1) };
            })
          }
        />
      </View>
      <TrayHeading>WALL SHAPE</TrayHeading>
      <Chips items={SHAPES} value={room.shape} onPick={pickShape} />
      <Caption>Angled splays the front wall; irregular adds an alcove; curved bows the rear wall. Drag any corner afterwards to match your room — a corner cannot cross another wall or shrink the plan under 1 m².</Caption>
      <TrayButton label={`NEW ROOM (DEFAULT ${fmtLen(4, units)} × ${fmtLen(5, units)})`} tint="dim" onPress={newRoom} />
      <TrayHeading>CEILING</TrayHeading>
      <Chips items={CEILINGS} value={room.ceiling} onPick={onCeiling} />
      {room.ceiling !== 'flat' ? <Caption>The ceiling shape shows in the SIDE view (VIEW on the readouts); the plan cannot draw it.</Caption> : null}
      {room.ceiling !== 'flat' ? (
        <NumField label={room.ceiling === 'mixed' ? 'LOW SECTION HEIGHT' : 'LOW POINT'} value={fromMetres(room.heightLow, units)} unit={u} onCommit={(v) => setRoom((r) => ({ ...r, heightLow: Math.max(1.8, Math.min(r.height - 0.1, toMetres(v, units))) }))} />
      ) : null}
      <TrayHeading>DOORS · WINDOWS · OPENINGS</TrayHeading>
      <View style={styles.btnRow}>
        <TrayButton label="+ DOOR" onPress={() => addOpening('door')} />
        <TrayButton label="+ WINDOW" onPress={() => addOpening('window')} />
        <TrayButton label="+ OPENING" onPress={() => addOpening('opening')} />
      </View>
      {room.openings.map((o) => (
        <View key={o.id} style={styles.itemRow}>
          <Text style={styles.itemText}>{`${o.kind.toUpperCase()} · W${o.wall + 1} on the plan · ${fmtLen(o.width, units)} × ${fmtLen(o.height, units)}`}</Text>
          <View style={styles.btnRow}>
            <TrayButton label="WALL ›" tint="dim" onPress={() => setRoom((r) => ({ ...r, openings: r.openings.map((x) => (x.id === o.id ? { ...x, wall: (x.wall + 1) % r.vertices.length } : x)) }))} />
            <TrayButton label="SLIDE" tint="dim" onPress={() => setRoom((r) => ({ ...r, openings: r.openings.map((x) => (x.id === o.id ? { ...x, pos: x.pos >= 0.75 ? 0.2 : x.pos + 0.15 } : x)) }))} />
            <TrayButton label="REMOVE" tint="dim" onPress={() => setRoom((r) => ({ ...r, openings: r.openings.filter((x) => x.id !== o.id) }))} />
          </View>
        </View>
      ))}
      <TrayHeading>FURNITURE · LARGE OBJECTS</TrayHeading>
      <View style={styles.btnRow}>
        <TrayButton label="+ DESK" onPress={() => addFeature('desk')} />
        <TrayButton label="+ SOFA" onPress={() => addFeature('sofa')} />
        <TrayButton label="+ SHELF" onPress={() => addFeature('bookshelf')} />
        <TrayButton label="+ RACK" onPress={() => addFeature('rack')} />
      </View>
      {room.features.map((f) => (
        <View key={f.id} style={styles.itemRow}>
          <Text style={styles.itemText}>{`${f.kind.toUpperCase()} · ${fmtLen(f.w, units)} × ${fmtLen(f.d, units)} · ${fmtLen(f.h, units)} tall — drag it on the plan`}</Text>
          <TrayButton label="REMOVE" tint="dim" onPress={() => setRoom((r) => ({ ...r, features: r.features.filter((x) => x.id !== f.id) }))} />
        </View>
      ))}
      <Caption>The desk is modelled: its top bounces the sound to the ears (the strongest early reflection in most nearfield setups), and the model draws that path. Every other object is drawn with a dotted outline and blocks nothing in the model — the reflection paths treat it as transparent. Its effect on the sound is real but not modelled here — one more reason to measure.</Caption>
    </View>
  );
}

function clampLen(m: number): number {
  return Math.max(LEN_MIN, Math.min(LEN_MAX, m));
}

function SurfaceTray({ room, setRoom }: { room: Room; setRoom: (fn: (r: Room) => Room) => void }) {
  const opts = (keys: SurfaceKey[]) => keys.map((k) => ({ id: k, label: SURFACES[k].label.toUpperCase() }));
  const alphaLine = (k: SurfaceKey) => `α 125 Hz ${SURFACES[k].alpha[0].toFixed(2)} · 500 Hz ${SURFACES[k].alpha[2].toFixed(2)} · 2 kHz ${SURFACES[k].alpha[4].toFixed(2)}`;
  const area = polygonArea(room.vertices);
  return (
    <View style={{ gap: 10 }}>
      <TrayHeading>FLOOR</TrayHeading>
      <Chips items={opts(FLOOR_OPTIONS)} value={room.floor} onPick={(id) => setRoom((r) => ({ ...r, floor: id }))} />
      <Caption>{`${SURFACES[room.floor].blurb} ${alphaLine(room.floor)}`}</Caption>
      <TrayHeading>WALLS</TrayHeading>
      <Chips items={opts(WALL_OPTIONS)} value={room.walls} onPick={(id) => setRoom((r) => ({ ...r, walls: id }))} />
      <Caption>{`${SURFACES[room.walls].blurb} ${alphaLine(room.walls)}`}</Caption>
      <TrayHeading>CEILING</TrayHeading>
      <Chips items={opts(CEILING_OPTIONS)} value={room.ceilingMat} onPick={(id) => setRoom((r) => ({ ...r, ceilingMat: id }))} />
      <Caption>{`${SURFACES[room.ceilingMat].blurb} ${alphaLine(room.ceilingMat)}`}</Caption>
      <Caption>{`ESTIMATED: textbook teaching coefficients, not ISO 354 product data. Floor and ceiling ${area.toFixed(1)} m² each; volume ${roomVolume(room).toFixed(1)} m³.`}</Caption>
    </View>
  );
}

const styles = StyleSheet.create({
  summary: { gap: 3 },
  summaryLine: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  warn: { fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 17, color: colors.amber },
  numRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  btnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  itemRow: { gap: 6, borderTopWidth: 1, borderTopColor: '#1f1f24', paddingTop: 6 },
  itemText: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSecondary },
});
