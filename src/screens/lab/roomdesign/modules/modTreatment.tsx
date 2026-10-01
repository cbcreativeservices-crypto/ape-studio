/**
 * Module 5 — ADD TREATMENT. The Wave lab's absorption concepts attached to
 * the room model: absorbers at the modelled reflection points, corner bass
 * traps, a ceiling cloud, diffusers, a rug, freestanding panels. Adjust size
 * and thickness, switch each item off and on (A/B), and see which modelled
 * paths now meet treatment. Everything here is ESTIMATED.
 */
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { lanePos, laneVal } from '../../soundsystems/rackLayout';
import type { BezelItem, DockParam } from '../../rack/rackTypes';
import { BADGE, type RoomLabCtx } from '../labCtx';
import { RoomRackLayout } from '../rackLayout';
import { RoomPlanView, treatmentCentre } from '../RoomPlanView';
import { Body, Caption, TrayButton, TrayHeading } from '../bits';
import {
  analyze,
  basstrapAt,
  depthLimitHz,
  distToEdge,
  fmtHz,
  fmtLen,
  newId,
  reflectionSurfaceName,
  rt60Bands,
  treatmentAlpha,
  treatmentAtReflection,
  TREATMENT_INFO,
  type Pt,
  type Reflection,
  type RoomDesign,
  type Treatment,
} from '../roomModel';

const THICK_MIN = 0.025;
const THICK_MAX = 0.4;
const SIZE_MIN = 0.4;
const SIZE_MAX = 2.4;
const FLASH_MS = 1000;

/** The reflection ABSORB NEXT would treat: the earliest untreated path the
 *  kit can reach (never the desk bounce), inside 20 ms first. */
export function nextReflectionToTreat(reflections: Reflection[]): Reflection | undefined {
  const treatable = reflections.filter((r) => !r.treatedBy && r.surface.kind !== 'desk');
  return treatable.find((r) => r.delayMs < 20) ?? treatable[0];
}

export function TreatmentModule({ ctx }: { ctx: RoomLabCtx }) {
  const { design, update, analysis, units } = ctx;
  const room = design.room;
  const [selId, setSelId] = useState<string | null>(design.treatment[0]?.id ?? null);
  const sel = design.treatment.find((t) => t.id === selId) ?? design.treatment[0] ?? null;
  // A just-added item wears a ring for a second (answers the learner's tap).
  const [flash, setFlash] = useState<string | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
  }, []);
  const flashItem = (id: string) => {
    setFlash(`tr_${id}`);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), FLASH_MS);
  };

  const setItems = (fn: (ts: Treatment[]) => Treatment[]) => update((d) => ({ ...d, treatment: fn(d.treatment) }));
  const patchSel = (patch: Partial<Treatment>) => {
    if (!sel) return;
    setItems((ts) => ts.map((t) => (t.id === sel.id ? { ...t, ...patch } : t)));
  };

  // With-and-without: the same room with every item switched off.
  const bare = rt60Bands(room, []);
  const now = analysis.rt60;
  const mid = (bands: typeof now) => bands.find((b) => b.hz === 500)?.sabine ?? NaN;
  const low = (bands: typeof now) => bands.find((b) => b.hz === 125)?.sabine ?? NaN;
  const treated = analysis.reflections.filter((r) => r.treatedBy).length;
  const total = analysis.reflections.length;

  const onDrag = (id: string, p: Pt) => {
    const tid = id.replace(/^tr_/, '');
    setItems((ts) =>
      ts.map((t) => {
        if (t.id !== tid) return t;
        if (t.kind === 'absorber' || t.kind === 'diffuser') {
          if (t.wall == null) return t;
          // Slide along its wall: project the finger onto the edge.
          const e = distToEdge(p, room.vertices, t.wall);
          return { ...t, pos: Math.max(0.05, Math.min(0.95, e.t)) };
        }
        if (t.kind === 'basstrap') {
          // Snap to the nearest corner.
          let best = t.wall ?? 0;
          let bd = Infinity;
          room.vertices.forEach((v, i) => {
            const d = Math.hypot(v.x - p.x, v.y - p.y);
            if (d < bd) {
              bd = d;
              best = i;
            }
          });
          return { ...t, wall: best };
        }
        return { ...t, x: p.x, y: p.y };
      }),
    );
  };

  const next = nextReflectionToTreat(analysis.reflections);
  const nextLabel = next
    ? next.surface.kind === 'wall'
      ? `ABSORB NEXT: ${next.speaker} → WALL ${next.surface.edge + 1} (+${next.delayMs.toFixed(1)} ms)`
      : next.surface.kind === 'ceiling'
        ? `ABSORB NEXT: CEILING CLOUD (+${next.delayMs.toFixed(1)} ms)`
        : `ABSORB NEXT: FLOOR RUG (+${next.delayMs.toFixed(1)} ms)`
    : 'ABSORB NEXT: EVERY PATH MEETS TREATMENT';
  const addAtNextReflection = () => {
    if (!next) return;
    const t = treatmentAtReflection(next, room);
    if (!t) return;
    // Judged against the LATEST list, not this render's: a double tap used to
    // stack two identical panels on the same reflection point (bug pass
    // 2026-10-01).
    setItems((ts) => (ts.some((x) => sameSpot(x, t)) ? ts : [...ts, t]));
    setSelId(t.id);
    flashItem(t.id);
  };
  const addTraps = () => {
    const have = new Set(design.treatment.filter((t) => t.kind === 'basstrap').map((t) => t.wall));
    const fresh = room.vertices.map((_, i) => i).filter((i) => !have.has(i)).slice(0, 4).map((i) => basstrapAt(room, i));
    if (fresh.length === 0) return;
    // A double tap read the same stale corner set twice and put two traps in
    // every corner — re-check against the latest list (bug pass 2026-10-01).
    setItems((ts) => {
      const taken = new Set(ts.filter((t) => t.kind === 'basstrap').map((t) => t.wall));
      const add = fresh.filter((t) => !taken.has(t.wall));
      return add.length ? [...ts, ...add] : ts;
    });
    setSelId(fresh[0].id);
    flashItem(fresh[0].id);
  };
  const addKind = (kind: Treatment['kind']) => {
    const lay = design.layouts[design.active] ?? design.layouts[0];
    const lis = lay.listener;
    const L = lay.speakers.find((s) => s.role === 'L') ?? lis;
    let t: Treatment;
    if (kind === 'cloud') t = { id: newId('tr'), kind, x: (analysis.bounds.minX + analysis.bounds.maxX) / 2, y: (L.y + lis.y) / 2, width: 1.2, height: 1.2, thickness: 0.1, z: room.height - 0.25, enabled: true };
    else if (kind === 'rug') t = { id: newId('tr'), kind, x: (analysis.bounds.minX + analysis.bounds.maxX) / 2, y: (L.y + lis.y) / 2, width: 1.6, height: 1.6, thickness: 0.01, z: 0, enabled: true };
    else if (kind === 'diffuser') {
      // The rear wall: the edge whose midpoint is furthest along +y.
      let rear = 0;
      let best = -Infinity;
      room.vertices.forEach((v, i) => {
        const q = room.vertices[(i + 1) % room.vertices.length];
        const my = (v.y + q.y) / 2;
        if (my > best) {
          best = my;
          rear = i;
        }
      });
      t = { id: newId('tr'), kind, wall: rear, pos: 0.5, width: 1.2, height: 1.2, thickness: 0.15, z: 1.2, enabled: true };
    } else if (kind === 'gobo') t = { id: newId('tr'), kind, x: L.x - 0.6, y: lis.y - 0.3, width: 1.2, height: 0.4, thickness: 0.1, z: 1.0, enabled: true };
    else t = { id: newId('tr'), kind: 'absorber', wall: 0, pos: 0.5, width: 0.6, height: 1.2, thickness: 0.1, z: 1.2, enabled: true };
    // A double tap made two items in the same place (bug pass 2026-10-01);
    // a second one goes in once the first has been dragged away.
    setItems((ts) => (ts.some((x) => sameSpot(x, t)) ? ts : [...ts, t]));
    setSelId(t.id);
    flashItem(t.id);
  };

  const bezel: BezelItem[] = [
    { k: 'TREATED', v: `${treated}/${total}`, tint: treated === total && total > 0 ? colors.green : undefined },
    { k: 'RT60 500', v: Number.isFinite(mid(now)) ? `${mid(now).toFixed(2)} s` : '—' },
    // "≈": indicative only — 125 Hz sits under the Schroeder frequency (audio review 13).
    { k: 'RT60 125 ≈', v: Number.isFinite(low(now)) ? `${low(now).toFixed(2)} s` : '—' },
    { k: 'VS NONE', v: Number.isFinite(mid(now)) && Number.isFinite(mid(bare)) ? `${(mid(now) - mid(bare) >= 0 ? '+' : '')}${(mid(now) - mid(bare)).toFixed(2)} s` : '—' },
  ];
  const fmtS = (x: number) => (Number.isFinite(x) ? `${x.toFixed(2)} s` : '—');

  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'thick',
      label: 'THICK',
      value: lanePos(sel?.thickness ?? 0.1, THICK_MIN, THICK_MAX),
      onChange: (v) => patchSel({ thickness: laneVal(v, THICK_MIN, THICK_MAX, 0.005) }),
      format: (v) => {
        const th = laneVal(v, THICK_MIN, THICK_MAX, 0.005);
        if (!sel) return 'ADD an item first';
        // A diffuser scatters; its depth sets how low it works (audio review 14).
        // One lane line: keep it under ~40 characters so it clears the lane's label.
        const down = `≈${Math.round(depthLimitHz(th, analysis.c))} Hz`;
        if (sel.kind === 'diffuser') return `${TREATMENT_INFO[sel.kind].short} ${fmtLen(th, units, { small: true })} deep · scatters to ${down}`;
        if (sel.kind === 'rug') return `${TREATMENT_INFO[sel.kind].short} ${fmtLen(th, units, { small: true })} · α125 ${treatmentAlpha({ kind: sel.kind, thickness: th }, 0).toFixed(2)}`;
        return `${TREATMENT_INFO[sel.kind].short} ${fmtLen(th, units, { small: true })} · α125 ${treatmentAlpha({ kind: sel.kind, thickness: th }, 0).toFixed(2)} · to ${down}`;
      },
      formatShort: (v) => fmtLen(laneVal(v, THICK_MIN, THICK_MAX, 0.005), units, { small: true }),
    },
    {
      kind: 'fader',
      id: 'size',
      label: 'SIZE',
      value: lanePos(sel?.width ?? 0.6, SIZE_MIN, SIZE_MAX),
      onChange: (v) => {
        const w = laneVal(v, SIZE_MIN, SIZE_MAX, 0.05);
        patchSel(sel && (sel.kind === 'cloud' || sel.kind === 'rug') ? { width: w, height: w } : { width: w });
      },
      format: (v) => (sel ? `${TREATMENT_INFO[sel.kind].short} ${fmtLen(laneVal(v, SIZE_MIN, SIZE_MAX, 0.05), units)} wide` : 'ADD an item first'),
      formatShort: (v) => fmtLen(laneVal(v, SIZE_MIN, SIZE_MAX, 0.05), units),
    },
    {
      kind: 'group',
      id: 'add',
      label: 'ADD',
      valueLabel: `${design.treatment.length} ITEMS`,
      render: () => (
        <View style={{ gap: 8 }}>
          <TrayHeading>ADD TREATMENT</TrayHeading>
          <View style={styles.btnRow}>
            <TrayButton label={nextLabel} tint="green" onPress={addAtNextReflection} disabled={!next} />
            <TrayButton label="BASS TRAPS IN THE CORNERS" onPress={addTraps} />
            <TrayButton label="CEILING CLOUD" onPress={() => addKind('cloud')} />
            <TrayButton label="RUG" onPress={() => addKind('rug')} />
            <TrayButton label="DIFFUSER (REAR WALL)" onPress={() => addKind('diffuser')} />
            <TrayButton label="FREESTANDING PANEL" onPress={() => addKind('gobo')} />
          </View>
          <Caption>{`The recommended spots follow your speaker and listening positions: the model puts the first reflection points where they are, and the absorber lands there. ABSORB NEXT names its target${next ? ` — now ${next.speaker} → ${reflectionSurfaceName(next)}` : ''}. The desk bounce is not in the list: nothing in the kit treats a desk top. Drag any item afterwards.`}</Caption>
        </View>
      ),
    },
    {
      kind: 'toggle',
      id: 'ab',
      label: sel ? (sel.enabled ? 'ITEM ON' : 'ITEM OFF') : 'ADD FIRST',
      value: !!sel?.enabled,
      // Flip the LATEST state: a fast double tap read the same render twice
      // and landed one toggle instead of two (bug pass 2026-10-01).
      onToggle: () => {
        if (!sel) return;
        setItems((ts) => ts.map((t) => (t.id === sel.id ? { ...t, enabled: !t.enabled } : t)));
      },
    },
    {
      kind: 'group',
      id: 'items',
      label: 'ITEMS',
      valueLabel: sel ? TREATMENT_INFO[sel.kind].short : '—',
      render: () => (
        <View style={{ gap: 8 }}>
          <TrayHeading>TREATMENT IN THIS ROOM</TrayHeading>
          {design.treatment.length === 0 ? <Caption>Nothing yet — use ADD.</Caption> : null}
          {design.treatment.map((t) => {
            const c = treatmentCentre(t, room);
            const on = sel?.id === t.id;
            return (
              <View key={t.id} style={[styles.itemRow, on && styles.itemRowOn, flash === `tr_${t.id}` && styles.itemRowNew]}>
                <Text style={[styles.itemText, !t.enabled && styles.itemOff]}>
                  {`${TREATMENT_INFO[t.kind].label} · ${fmtLen(t.width, units)} × ${fmtLen(t.height, units)} · ${fmtLen(t.thickness, units, { small: true })} thick${c ? ` · at ${fmtLen(c.x - analysis.bounds.minX, units)}, ${fmtLen(c.y - analysis.bounds.minY, units)}` : ''}${t.enabled ? '' : ' · OFF'}`}
                </Text>
                <View style={styles.btnRow}>
                  <TrayButton label={on ? 'SELECTED' : 'SELECT'} tint={on ? 'amber' : 'dim'} onPress={() => setSelId(t.id)} />
                  <TrayButton label={t.enabled ? 'SWITCH OFF' : 'SWITCH ON'} tint="dim" onPress={() => setItems((ts) => ts.map((x) => (x.id === t.id ? { ...x, enabled: !x.enabled } : x)))} />
                  <TrayButton label="REMOVE" tint="dim" onPress={() => setItems((ts) => ts.filter((x) => x.id !== t.id))} />
                </View>
              </View>
            );
          })}
          {design.treatment.length > 0 ? (
            <View style={styles.btnRow}>
              <TrayButton label="ALL OFF (COMPARE)" tint="dim" onPress={() => setItems((ts) => ts.map((t) => ({ ...t, enabled: false })))} />
              <TrayButton label="ALL ON" tint="dim" onPress={() => setItems((ts) => ts.map((t) => ({ ...t, enabled: true })))} />
            </View>
          ) : null}
        </View>
      ),
    },
  ];

  const stage = (w: number, h: number) => (
    <RoomPlanView w={w} h={h} design={design} analysis={analysis} layers={{ reflections: true, treatment: true, dims: false }} edit="treatment" selected={sel ? `tr_${sel.id}` : null} onSelect={(id) => setSelId(id.replace(/^tr_/, ''))} onDrag={onDrag} highlight={flash} />
  );

  const withoutSel = sel ? analyze({ ...design, treatment: design.treatment.map((t) => (t.id === sel.id ? { ...t, enabled: false } : t)) }) : null;
  const withSel = sel ? analyze({ ...design, treatment: design.treatment.map((t) => (t.id === sel.id ? { ...t, enabled: true } : t)) }) : null;

  return (
    <RoomRackLayout
      // The lane must bind a fader (the rack's contract), so the landing keeps
      // THICK bound and says "ADD an item first" until there is an item.
      rack={{ stage, badge: BADGE.treatment, bezel, params, initialParam: 'thick', hideDragTag: true }}
      caption="ADD places an absorber at the next untreated reflection point the model found (the key names it), bass traps in the corners, a cloud, a rug, a diffuser or a gobo. Drag items on the plan; THICK and SIZE shape the selected one; ITEM ON/OFF compares with and without it. A ✓ on a path means it meets treatment. Keep panels clear of sockets, lights and heaters."
      wellTop={
        sel ? (
          <View style={{ gap: 4 }}>
            <Text style={styles.line}>{`${TREATMENT_INFO[sel.kind].label}: ${TREATMENT_INFO[sel.kind].blurb}`}</Text>
            {withSel && withoutSel ? (
              <Text style={styles.line}>
                {sel.kind === 'diffuser'
                  ? `With it ${withSel.reflections.filter((r) => r.treatedBy).length} of ${withSel.reflections.length} paths meet treatment; without it ${withoutSel.reflections.filter((r) => r.treatedBy).length}. ${fmtLen(sel.thickness, units, { small: true })} deep: diffuses down to ≈ ${fmtHz(depthLimitHz(sel.thickness, analysis.c))} — scattered, not absorbed, so the RT60 barely moves (mid ≈ ${fmtS(mid(withSel.rt60))}).`
                  : `With it ${withSel.reflections.filter((r) => r.treatedBy).length} of ${withSel.reflections.length} paths meet treatment, mid RT60 ≈ ${fmtS(mid(withSel.rt60))}; without it ${withoutSel.reflections.filter((r) => r.treatedBy).length}, ≈ ${fmtS(mid(withoutSel.rt60))}. α at 125 Hz ${treatmentAlpha(sel, 0).toFixed(2)}, at 500 Hz ${treatmentAlpha(sel, 2).toFixed(2)}, at 2 kHz ${treatmentAlpha(sel, 4).toFixed(2)}${sel.kind === 'rug' ? '' : ` · works down to ≈ ${fmtHz(depthLimitHz(sel.thickness, analysis.c))}`}.`}
              </Text>
            ) : null}
            <Text style={styles.safety}>{`Safety: ${TREATMENT_INFO[sel.kind].safety}`}</Text>
          </View>
        ) : (
          <Text style={styles.line}>No treatment yet. ADD an item first — THICK and SIZE shape the selected item, and ITEM ON/OFF compares with and without it.</Text>
        )
      }
    >
      <Body>
        Treatment is bought in square metres that actually absorb, at the frequencies that need it. A thin panel absorbs the highs anywhere; only thickness — or a corner, where every mode has its pressure maximum — reaches the bass. The first-reflection points are where the mids and highs need help; the corners are where the bass does; the ceiling over the desk is both.
      </Body>
      <Body>
        Compare, don't cover: a room with every wall absorbed is fatiguing and makes mixes sound dry everywhere else. Switch each item off and on, read the RT60 estimate and the treated-path count, and keep what changes something. The rear wall is often better scattered (a diffuser) than killed, if there is room for one.
      </Body>
      <Caption>Mount heavy items — bass traps, clouds, wood diffusers — into structure with rated hardware and a safety cable overhead; use fire-rated materials; never block an exit, a heater or a ventilation grille; keep panels clear of sockets, lights and heaters, and never hang a cloud under or over a smoke detector, sprinkler head or light fitting. If in doubt about a fixing, ask someone qualified.</Caption>
      <Caption>{`ESTIMATED throughout: broadband teaching coefficients, and a Sabine/Eyring decay that assumes a diffuse field a small room does not have below its Schroeder frequency (≈ ${Number.isFinite(analysis.schroeder) ? Math.round(analysis.schroeder) : '—'} Hz here) — the 125 Hz figure is indicative only. Sabine also ignores air absorption, which matters above a few kHz in a large room. Measure the real room before and after.`}</Caption>
    </RoomRackLayout>
  );
}

/** Two items in the same place (same kind, same wall spot or same floor /
 *  ceiling point) — the duplicate a double tap on ABSORB NEXT made. */
export function sameSpot(a: Treatment, b: Treatment): boolean {
  if (a.kind !== b.kind) return false;
  if (a.wall != null || b.wall != null) return a.wall === b.wall && Math.abs((a.pos ?? 0) - (b.pos ?? 0)) < 0.02;
  return Math.abs((a.x ?? 0) - (b.x ?? 0)) < 0.05 && Math.abs((a.y ?? 0) - (b.y ?? 0)) < 0.05;
}

export function treatmentSummary(d: RoomDesign): string {
  const live = d.treatment.filter((t) => t.enabled);
  if (live.length === 0) return 'no treatment';
  const counts = new Map<string, number>();
  for (const t of live) counts.set(TREATMENT_INFO[t.kind].label, (counts.get(TREATMENT_INFO[t.kind].label) ?? 0) + 1);
  return [...counts.entries()].map(([k, n]) => `${n} × ${k.toLowerCase()}`).join(', ');
}

const styles = StyleSheet.create({
  line: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  safety: { fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 17, color: '#ff8a5c' },
  btnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  itemRow: { gap: 6, borderTopWidth: 1, borderTopColor: '#1f1f24', paddingTop: 6 },
  itemRowOn: { borderLeftWidth: 2, borderLeftColor: colors.amber, paddingLeft: 8 },
  itemRowNew: { backgroundColor: '#1d1709', borderRadius: 6 },
  itemText: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSecondary },
  itemOff: { color: colors.textSub },
});
