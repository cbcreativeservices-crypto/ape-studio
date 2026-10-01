/**
 * Module 6 — REVIEW THE ROOM. Three sections, each tagged with its tier:
 * ROOM AND LAYOUT (calculated), LIKELY ACOUSTIC BEHAVIOUR (estimated),
 * SUGGESTED NEXT STEPS. A measured-value entry compares a real RT60 or a
 * found resonance with the model (MEASURED). The saved-design library lives
 * here too: save, load, and compare a saved "before" with the current setup.
 * No single room score — observations and practical next steps.
 */
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { LabNextButton } from '../../kit/LabNavBar';
import { Body, Caption, Card, KV, NumField, SectionTitle, SuggestionRow, TierTag, TrayButton } from '../bits';
import type { RoomLabCtx } from '../labCtx';
import {
  analyze,
  compareMeasured,
  diffLayouts,
  fmtDelta,
  fmtHz,
  fmtLen,
  placementConflicts,
  SURFACES,
  SYM_TOL,
  type RoomDesign,
} from '../roomModel';
import { treatmentSummary } from './modTreatment';

export function ReviewModule({ ctx }: { ctx: RoomLabCtx }) {
  const { design, update, analysis: a, units, guest, saved, saveCurrent, loadSaved, deleteSaved } = ctx;
  const room = design.room;
  const lay = design.layouts[design.active] ?? design.layouts[0];
  const b = a.bounds;
  const st = a.stereo;
  const conflicts = placementConflicts(design, a);
  const measured = compareMeasured(design, a);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [compareId, setCompareId] = useState<string | null>(null);
  const before = saved.find((d) => d.id === compareId) ?? null;
  const beforeAfter = before ? compareDesigns(before, design) : null;
  const fmtU = (m: number) => fmtLen(m, units);
  const rt = (hz: number) => a.rt60.find((r) => r.hz === hz);
  const rtText = (hz: number) => {
    const r = rt(hz);
    return r && Number.isFinite(r.sabine) ? `${r.sabine.toFixed(2)} s (Eyring ${Number.isFinite(r.eyring) ? r.eyring.toFixed(2) : '—'} s)` : '—';
  };

  return (
    <View style={styles.doc}>
      <Card>
        <SectionTitle title="ROOM AND LAYOUT" tier="CALCULATED" />
        <KV k="Plan" v={`${room.shape} · ${fmtU(b.width)} × ${fmtU(b.length)}`} />
        <KV k="Ceiling" v={`${room.ceiling} · ${fmtU(room.height)}${room.ceiling === 'flat' ? '' : ` → ${fmtU(room.heightLow)}`}`} />
        <KV k="Area · volume" v={units === 'metric' ? `${a.area.toFixed(1)} m² · ${a.volume.toFixed(1)} m³` : `${(a.area / 0.09290304).toFixed(0)} ft² · ${(a.volume / 0.028316846592).toFixed(0)} ft³`} />
        <KV k="Surfaces" v={`${SURFACES[room.floor].label} / ${SURFACES[room.walls].label} / ${SURFACES[room.ceilingMat].label}`} />
        <KV k="Openings · objects" v={`${room.openings.length} · ${room.features.length}`} />
        <KV k="Monitoring" v={`${design.monitoring.config.replace('_', ' + ')} · ${design.monitoring.field}${design.monitoring.model ? ` · ${design.monitoring.model}` : ''}`} />
        <KV k="Layout" v={lay.name} />
        {lay.speakers.map((s) => (
          <KV key={s.role} k={`${s.role} speaker (x, y, h)`} v={`${fmtU(s.x - b.minX)}, ${fmtU(s.y - b.minY)}, ${fmtU(s.z)}`} />
        ))}
        <KV k="Listener (x, y, ears)" v={`${fmtU(lay.listener.x - b.minX)}, ${fmtU(lay.listener.y - b.minY)}, ${fmtU(lay.listener.earZ)}`} />
        {st ? (
          <>
            <KV k="Distances L / R" v={`${fmtU(st.distL)} / ${fmtU(st.distR)}`} />
            <KV k="L − R difference" v={fmtDelta(st.distL - st.distR, units)} tint={st.pathDiff > SYM_TOL ? '#ff5a48' : colors.green} />
            <KV k="Listening angle" v={`${st.angleDeg.toFixed(0)}°`} />
            <KV k="Off the centre line" v={fmtLen(Math.abs(st.axisOffset), units, { small: true })} tint={Math.abs(st.axisOffset) > 0.1 ? colors.amber : colors.green} />
            <KV k="Side walls L / R" v={`${fmtU(st.wallL.side)} / ${fmtU(st.wallR.side)}`} />
            <KV k="Front wall L / R" v={`${fmtU(st.wallL.front)} / ${fmtU(st.wallR.front)}`} />
            <KV k="Tweeters vs ears" v={fmtDelta(st.heightDiff, units)} />
            <KV k="Listener to rear wall" v={fmtU(st.listenerRear)} />
          </>
        ) : null}
        {conflicts.length > 0 ? (
          <View style={{ gap: 4, marginTop: 4 }}>
            <Text style={styles.sub}>PLACEMENT OBSERVATIONS</Text>
            {conflicts.map((c, i) => (
              <Caption key={i}>{`! ${c.text}`}</Caption>
            ))}
          </View>
        ) : null}
      </Card>

      <Card>
        <SectionTitle title="LIKELY ACOUSTIC BEHAVIOUR" tier="ESTIMATED" />
        <Text style={styles.sub}>{a.rectangular ? 'ROOM MODES — IDEALIZED, CALCULATED FOR THIS RECTANGLE' : 'ROOM MODES — BOUNDING BOX ESTIMATE (NOT A RECTANGLE: LESS RELIABLE)'}</Text>
        <Caption>{`c = ${a.c.toFixed(1)} m/s at ${room.tempC} °C · dimensions used ${fmtU(a.modalDims.L)} × ${fmtU(a.modalDims.W)} × ${fmtU(a.modalDims.H)}${a.rectangular ? '' : ' (bounding box, mean ceiling height)'}.`}</Caption>
        {a.modes.slice(0, 12).map((m, i) => (
          <KV key={i} k={`${m.kind} (${m.nx},${m.ny},${m.nz})`} v={fmtHz(m.f)} tint={a.rectangular ? colors.cyanBright : colors.amber} />
        ))}
        {a.coincident.length > 0 ? <Caption>{`Near-coincident: ${a.coincident.slice(0, 3).map(([x, y]) => `${fmtHz(x.f)} & ${fmtHz(y.f)}`).join(' · ')} — expect a stronger buildup there.`}</Caption> : null}
        <Text style={styles.sub}>WHERE THE MODEL PREDICTS STRONGER OR WEAKER PRESSURE AT THE SEAT</Text>
        {a.listenerZones.map((z, i) => (
          <KV key={i} k={`${z.mode.axis}-axis ${fmtHz(z.mode.f)}`} v={`${Math.round(z.pressure * 100)} % — ${z.zone === 'peak' ? 'pressure peak' : z.zone === 'null' ? 'null' : 'between'}`} tint={z.zone === 'peak' ? '#ff5a48' : z.zone === 'null' ? '#2f74ff' : colors.green} />
        ))}
        <Text style={styles.sub}>LIKELY EARLY REFLECTIONS (FIRST ORDER, IMAGE-SOURCE)</Text>
        {a.reflections.slice(0, 8).map((r, i) => (
          <KV key={i} k={`${r.speaker} → ${r.surface.kind === 'wall' ? `wall ${r.surface.edge + 1}` : r.surface.kind}${r.treatedBy ? ' ✓ treated' : ''}`} v={`+${r.delayMs.toFixed(1)} ms · ${r.levelDb.toFixed(0)} dB`} tint={r.treatedBy ? colors.green : undefined} />
        ))}
        <Text style={styles.sub}>SURFACE AND TREATMENT ASSUMPTIONS</Text>
        <KV k="Treatment" v={treatmentSummary(design)} />
        <KV k="RT60 125 Hz · Sabine" v={rtText(125)} />
        <KV k="RT60 500 Hz · Sabine" v={rtText(500)} />
        <KV k="RT60 2 kHz · Sabine" v={rtText(2000)} />
        <KV k="Schroeder frequency" v={Number.isFinite(a.schroeder) ? `≈ ${Math.round(a.schroeder)} Hz` : '—'} />
        <Caption>Teaching-table absorption, not product data; Sabine and Eyring assume a diffuse field this room does not have below its Schroeder frequency. Boundary notches (ESTIMATED): {a.sbir.slice(0, 4).map((s) => `${s.speaker}/${s.surface} ~${fmtHz(s.notchHz)}`).join(' · ')}.</Caption>
        <Text style={styles.sub}>WHAT THIS MAY MEAN FOR THE WORK</Text>
        <Caption>
          {bassJudgement(a)} {imagingJudgement(a)} {translationJudgement(a)}
        </Caption>
      </Card>

      <Card>
        <SectionTitle title="SUGGESTED NEXT STEPS" />
        {a.suggestions.map((s, i) => (
          <SuggestionRow key={i} s={s} />
        ))}
      </Card>

      <Card>
        <SectionTitle title="MEASURE VERSUS ESTIMATE" tier="MEASURED" />
        <Caption>If you have measured the room — a decay time from a clap or sweep, or a resonance you found with a tone — enter it here and the lab compares it with the model. Leave blank if you have not.</Caption>
        <View style={styles.numRow}>
          <NumField label="MEASURED RT60 (MID)" value={design.measured.rt60Mid ?? null} unit="s" placeholder="0.45" onCommit={(v) => update((d) => ({ ...d, measured: { ...d.measured, rt60Mid: v } }))} />
          <NumField label="RESONANCE FOUND" value={design.measured.modeHz ?? null} unit="Hz" placeholder="48" onCommit={(v) => update((d) => ({ ...d, measured: { ...d.measured, modeHz: v } }))} />
        </View>
        {design.measured.rt60Mid != null || design.measured.modeHz != null ? (
          <TrayButton label="CLEAR MEASURED VALUES" tint="dim" onPress={() => update((d) => ({ ...d, measured: {} }))} />
        ) : null}
        {measured.map((m, i) => (
          <View key={i} style={{ gap: 3 }}>
            <Caption>{m.text}</Caption>
            <TierTag tier="MEASURED" compact />
          </View>
        ))}
      </Card>

      <Card>
        <SectionTitle title="SAVED DESIGNS — BEFORE AND AFTER" />
        {guest ? (
          <Caption>You are not signed in, so designs are not saved. You can keep working on this one; sign in to save it.</Caption>
        ) : (
          <>
            <TrayButton
              label="SAVE THIS DESIGN"
              tint="green"
              onPress={() => {
                void saveCurrent().then((ok) => setSavedMsg(ok ? `Saved "${design.name}" on this device.` : 'Not saved.'));
              }}
            />
            {savedMsg ? <Caption>{savedMsg}</Caption> : null}
            {saved.length === 0 ? <Caption>No saved designs on this device yet.</Caption> : null}
            {saved.map((d) => (
              <View key={d.id} style={styles.savedRow}>
                <Text style={styles.savedName}>{`${d.name}${d.id === design.id ? ' (this one)' : ''} · ${fmtLen(d.room.vertices.reduce((m, p) => Math.max(m, p.x), 0), d.room.units)} × ${fmtLen(d.room.vertices.reduce((m, p) => Math.max(m, p.y), 0), d.room.units)} · ${new Date(d.updatedAt).toLocaleDateString()}`}</Text>
                <View style={styles.btnRow}>
                  <TrayButton label={compareId === d.id ? 'COMPARING' : 'COMPARE AS "BEFORE"'} tint={compareId === d.id ? 'amber' : 'dim'} onPress={() => setCompareId(compareId === d.id ? null : d.id)} disabled={d.id === design.id} />
                  <TrayButton label="LOAD" tint="dim" onPress={() => loadSaved(d.id)} />
                  <TrayButton label="DELETE" tint="dim" onPress={() => deleteSaved(d.id)} />
                </View>
              </View>
            ))}
          </>
        )}
        {beforeAfter ? (
          <View style={{ gap: 4 }}>
            <Text style={styles.sub}>{`"${before?.name}" (BEFORE) → THIS DESIGN (AFTER)`}</Text>
            {beforeAfter.map((l, i) => (
              <Caption key={i}>{`• ${l}`}</Caption>
            ))}
          </View>
        ) : null}
        {design.layouts.length > 1 ? (
          <View style={{ gap: 4 }}>
            <Text style={styles.sub}>POSITIONS KEPT IN THIS DESIGN</Text>
            {design.layouts.slice(1).map((l, i) => (
              <View key={l.name} style={{ gap: 2 }}>
                <Caption>{`"${design.layouts[0].name}" → "${l.name}":`}</Caption>
                {diffLayouts(design, 0, i + 1).map((d, j) => (
                  <Caption key={j}>{`   • ${d.text}`}</Caption>
                ))}
              </View>
            ))}
          </View>
        ) : null}
      </Card>

      <Body>
        No score, on purpose: a room is never "solved", it is understood. Take the specific observations above into the real room — move the chair, test a panel at the marked point, measure — and let the measurement, not the model, have the last word.
      </Body>
      <LabNextButton />
    </View>
  );
}

/** What changed between a saved design and the current one, in plain words. */
export function compareDesigns(before: RoomDesign, after: RoomDesign): string[] {
  const out: string[] = [];
  const u = after.room.units;
  const ab = analyze(before);
  const aa = analyze(after);
  if (Math.abs(ab.bounds.width - aa.bounds.width) > 0.01 || Math.abs(ab.bounds.length - aa.bounds.length) > 0.01 || Math.abs(before.room.height - after.room.height) > 0.01) {
    out.push(`Room ${fmtLen(ab.bounds.width, u)} × ${fmtLen(ab.bounds.length, u)} × ${fmtLen(before.room.height, u)} → ${fmtLen(aa.bounds.width, u)} × ${fmtLen(aa.bounds.length, u)} × ${fmtLen(after.room.height, u)}.`);
  }
  if (before.room.floor !== after.room.floor || before.room.walls !== after.room.walls || before.room.ceilingMat !== after.room.ceilingMat) {
    out.push(`Surfaces ${SURFACES[before.room.floor].label}/${SURFACES[before.room.walls].label}/${SURFACES[before.room.ceilingMat].label} → ${SURFACES[after.room.floor].label}/${SURFACES[after.room.walls].label}/${SURFACES[after.room.ceilingMat].label}.`);
  }
  // Positions: run the layout diff over a merged design so the words match.
  const merged: RoomDesign = { ...after, layouts: [before.layouts[before.active] ?? before.layouts[0], after.layouts[after.active] ?? after.layouts[0]], active: 1 };
  for (const l of diffLayouts(merged, 0, 1)) if (!/are the same layout/.test(l.text)) out.push(l.text);
  const tb = treatmentSummary(before);
  const ta = treatmentSummary(after);
  if (tb !== ta) out.push(`Treatment: ${tb} → ${ta}.`);
  const mid = (x: ReturnType<typeof analyze>) => x.rt60.find((r) => r.hz === 500)?.sabine ?? NaN;
  if (Number.isFinite(mid(ab)) && Number.isFinite(mid(aa)) && Math.abs(mid(ab) - mid(aa)) > 0.005) out.push(`Mid-band RT60 estimate ${mid(ab).toFixed(2)} s → ${mid(aa).toFixed(2)} s (ESTIMATED).`);
  const tr = (x: ReturnType<typeof analyze>) => x.reflections.filter((r) => r.treatedBy).length;
  if (tr(ab) !== tr(aa)) out.push(`Reflection paths meeting treatment ${tr(ab)} → ${tr(aa)} (ESTIMATED).`);
  if (out.length === 0) out.push('Nothing has changed between the two.');
  return out;
}

function bassJudgement(a: ReturnType<typeof analyze>): string {
  const peaks = a.listenerZones.filter((z) => z.zone === 'peak').length;
  const nulls = a.listenerZones.filter((z) => z.zone === 'null').length;
  if (peaks > 0 && nulls === 0) return `Bass judgement: the seat sits on ${peaks} modal peak${peaks > 1 ? 's' : ''} — bass is likely to sound heavier there than the mix really is, so low-end decisions may come out thin elsewhere.`;
  if (nulls > 0) return `Bass judgement: the seat sits in ${nulls} modal null${nulls > 1 ? 's' : ''} — some bass frequencies nearly vanish there, and the temptation is to boost what the room is hiding.`;
  return 'Bass judgement: the seat avoids the strongest peaks and nulls of the lowest modes; the remaining unevenness is the higher modes and the speakers’ boundary notches.';
}

function imagingJudgement(a: ReturnType<typeof analyze>): string {
  const s = a.stereo;
  if (!s) return '';
  const early = a.reflections.filter((r) => r.surface.kind === 'wall' && r.delayMs < 15 && !r.treatedBy).length;
  const sym = s.pathDiff <= SYM_TOL && Math.abs(s.wallL.side - s.wallR.side) <= 0.15;
  return `Stereo imaging: ${sym ? 'the geometry is matched left and right' : 'the two sides do not match'}${early > 0 ? `, and ${early} untreated wall reflection${early > 1 ? 's' : ''} inside 15 ms will blur the image and widen the centre` : ', and the early wall reflections are treated or late'}.`;
}

function translationJudgement(a: ReturnType<typeof analyze>): string {
  if (!Number.isFinite(a.rt60Mid)) return '';
  if (a.rt60Mid > 0.5) return 'Mix translation: a lively decay like this adds the room to everything you hear, so reverb and balance decisions tend to be too dry when played elsewhere.';
  if (a.rt60Mid < 0.15) return 'Mix translation: a very dead room makes mixes feel dry here and wet everywhere else; keep some life in the room.';
  return 'Mix translation: the decay estimate is in the range small mix rooms aim for; what remains is the bass and the early reflections above.';
}

const styles = StyleSheet.create({
  doc: { gap: 12 },
  sub: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.3, color: colors.textSub, marginTop: 6 },
  numRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  savedRow: { gap: 6, borderTopWidth: 1, borderTopColor: '#1f1f24', paddingTop: 6 },
  savedName: { fontFamily: fonts.barlowMedium, fontSize: 13, color: colors.textSecondary },
  btnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
