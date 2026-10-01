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
import { confirmDialog } from '../../../../lib/confirm';
import { LabNextButton } from '../../kit/LabNavBar';
import { Body, Caption, Card, KV, NumField, SectionTitle, SuggestionRow, TierTag, TrayButton } from '../bits';
import type { RoomLabCtx } from '../labCtx';
import { RoomPlanView } from '../RoomPlanView';
import {
  analyze,
  compareMeasured,
  diffLayouts,
  fmtDelta,
  fmtHz,
  fmtLen,
  MEASURED_RANGE,
  placementConflicts,
  planIsRectangular,
  reflectionSurfaceName,
  rtImbalance,
  SBIR_MAX_HZ,
  SURFACES,
  SYM_TOL,
  type RoomDesign,
} from '../roomModel';
import { treatmentSummary } from './modTreatment';

/** The read-only picture over the behaviour card: reflections and treatment,
 *  no handles (cognitive review 16). */
const MINI_PLAN_H = 180;

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
  const [planW, setPlanW] = useState(0);
  const planRect = planIsRectangular(room);
  const firstCheck = a.suggestions.findIndex((s) => s.level === 'check');
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
        <View style={styles.miniPlan} onLayout={(e) => setPlanW(Math.round(e.nativeEvent.layout.width))}>
          {planW > 40 ? <RoomPlanView w={planW} h={MINI_PLAN_H} design={design} analysis={a} layers={{ reflections: true, treatment: true, triangle: true, dims: false }} edit="none" /> : null}
        </View>
        <Caption>The plan as the behaviour below reads it: reflection paths coloured by level, treatment, the triangle. Edit it in the earlier modules.</Caption>
        <Caption>{a.rectangular ? 'The mode frequencies are CALCULATED (idealized, for this rectangular box); everything else on this card is ESTIMATED.' : 'Everything on this card is ESTIMATED — the mode frequencies included, because the room is not a rectangular box.'}</Caption>
        <Text style={styles.sub}>{a.rectangular ? 'ROOM MODES — IDEALIZED, CALCULATED FOR THIS RECTANGLE' : planRect ? `ROOM MODES — MEAN-HEIGHT ESTIMATE (${room.ceiling.toUpperCase()} CEILING: LESS RELIABLE)` : 'ROOM MODES — BOUNDING BOX ESTIMATE (NOT A RECTANGLE: LESS RELIABLE)'}</Text>
        <Caption>{`c = ${a.c.toFixed(1)} m/s at ${room.tempC} °C · dimensions used ${fmtU(a.modalDims.L)} × ${fmtU(a.modalDims.W)} × ${fmtU(a.modalDims.H)}${a.rectangular ? '' : planRect ? ' (mean ceiling height)' : ' (bounding box, mean ceiling height)'}.`}</Caption>
        {a.modes.slice(0, 12).map((m, i) => (
          <KV key={i} k={`${m.kind} (${m.nx},${m.ny},${m.nz})`} v={fmtHz(m.f)} tint={a.rectangular ? colors.cyanBright : colors.amber} />
        ))}
        {a.coincident.length > 0 ? <Caption>{`Near-coincident (one axial, both ≤ 150 Hz, within 5 %): ${a.coincident.slice(0, 3).map(([x, y]) => `${fmtHz(x.f)} & ${fmtHz(y.f)}`).join(' · ')} — expect a stronger buildup there.`}</Caption> : null}
        <Text style={styles.sub}>WHERE THE MODEL PREDICTS STRONGER OR WEAKER PRESSURE AT THE SEAT</Text>
        {a.listenerZones.map((z, i) => {
          const centred = !st || Math.abs(st.axisOffset) < 0.1;
          const note = z.mode.axis === 'W' && z.zone === 'null' && centred ? ' · centre line: expected, keep it' : z.mode.axis === 'H' && z.zone === 'null' ? ' · ⓘ normal at seated ear height' : z.mode.axis === 'L' && z.zone !== 'between' ? ' · move fore/aft to test' : '';
          const tint = z.mode.axis !== 'L' && z.zone === 'null' ? colors.textSub : z.zone === 'peak' ? '#ff5a48' : z.zone === 'null' ? '#2f74ff' : colors.green;
          return <KV key={i} k={`${z.mode.axis}-axis ${fmtHz(z.mode.f)}`} v={`${Math.round(z.pressure * 100)} % — ${z.zone === 'peak' ? 'pressure peak' : z.zone === 'null' ? 'null' : 'between'}${note}`} tint={tint} />;
        })}
        <Caption>Mode shape only — not how strongly the speakers excite each mode. A centred pair barely drives the odd width modes; the length axis is the one worth moving along.</Caption>
        <Text style={styles.sub}>LIKELY EARLY REFLECTIONS (FIRST ORDER, IMAGE-SOURCE)</Text>
        {a.reflections.slice(0, 8).map((r, i) => (
          <KV key={i} k={`${r.speaker} → ${reflectionSurfaceName(r)}${r.treatedBy ? ' ✓ treated' : ''}`} v={`+${r.delayMs.toFixed(1)} ms · ${r.levelDb.toFixed(0)} dB`} tint={r.treatedBy ? colors.green : undefined} />
        ))}
        <Caption>Levels: distance, surface absorption and a simple directivity curve at the departure angle — toe-in moves them.</Caption>
        <Text style={styles.sub}>SURFACE AND TREATMENT ASSUMPTIONS</Text>
        <KV k="Treatment" v={treatmentSummary(design)} />
        <KV k="RT60 125 Hz · Sabine (indicative)" v={rtText(125)} />
        <KV k="RT60 500 Hz · Sabine" v={rtText(500)} />
        <KV k="RT60 2 kHz · Sabine" v={rtText(2000)} />
        <KV k="Schroeder frequency" v={Number.isFinite(a.schroeder) ? `≈ ${Math.round(a.schroeder)} Hz` : '—'} />
        <Caption>{`Teaching-table absorption, not product data; Sabine and Eyring assume a diffuse field this room does not have below its Schroeder frequency, and Sabine ignores air absorption. First cancellations at the seat (ESTIMATED, woofer band, below ~${SBIR_MAX_HZ} Hz, distances to the woofer): ${a.sbir.length ? a.sbir.slice(0, 4).map((s) => `${s.speaker}/${s.surface} ~${fmtHz(s.notchHz)}`).join(' · ') : 'none below the cap'}.`}</Caption>
        <Text style={styles.sub}>WHAT THIS MAY MEAN FOR THE WORK</Text>
        <Caption>
          {bassJudgement(a)} {imagingJudgement(a)} {translationJudgement(a)}
        </Caption>
      </Card>

      <Card>
        <SectionTitle title="SUGGESTED NEXT STEPS" />
        <Caption>! look at this first · ▸ worth testing · ✓ as it should be · ⓘ normal, not a reason to move anything.</Caption>
        {a.suggestions.map((s, i) => (
          <SuggestionRow key={i} s={s} tag={i === firstCheck ? 'TRY FIRST' : undefined} />
        ))}
      </Card>

      <Card>
        <SectionTitle title="MEASURE VERSUS ESTIMATE" tier="MEASURED" />
        <Caption>{`If you have measured the room — a decay time from a clap or sweep, or a resonance you found with a tone — enter it here and the lab compares it with the model. Leave blank if you have not. The model covers RT60 ${MEASURED_RANGE.rt60Mid.min}–${MEASURED_RANGE.rt60Mid.max} s and resonances ${MEASURED_RANGE.modeHz.min}–${MEASURED_RANGE.modeHz.max} Hz.`}</Caption>
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
                  {/* One stray tap used to erase a saved design for good (bug pass
                      2026-10-01) — the delete asks first, like NEW ROOM. */}
                  <TrayButton label="DELETE" tint="dim" onPress={() => confirmDialog('Delete saved design?', `"${d.name}" is removed from this device. The design on screen is not touched.`, 'DELETE', () => deleteSaved(d.id), { destructive: true })} />
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
                <Caption>{`${design.layouts[0].name.toUpperCase()} → ${l.name.toUpperCase()}:`}</Caption>
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

/** Only the LENGTH axis judges the bass (audio review 7, safety review 1):
 *  the centre-line width null and the seated-height null are inherent. */
function bassJudgement(a: ReturnType<typeof analyze>): string {
  const L = a.listenerZones.find((z) => z.mode.axis === 'L');
  if (L?.zone === 'peak') return `Bass judgement: the seat sits on the pressure peak of the first length mode (${fmtHz(L.mode.f)}) — bass there is likely to sound heavier than the mix really is, so low-end decisions may come out thin elsewhere. Moving fore/aft changes it.`;
  if (L?.zone === 'null') return `Bass judgement: the seat sits in the null of the first length mode (${fmtHz(L.mode.f)}) — that frequency nearly vanishes there, and the temptation is to boost what the room is hiding. Moving fore/aft changes it; the width and height nulls at a centred, seated position are normal.`;
  return 'Bass judgement: the seat avoids the peak and null of the first length mode; the remaining unevenness is the higher modes and the speakers’ boundary cancellations. The width and height nulls at a centred, seated position are normal.';
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
  const imb = rtImbalance(a.rt60);
  if (imb && imb.ratio > 1.5 && a.rt60Mid <= 0.4) return `Mix translation: the mids and highs are damped but the bass still rings about ${imb.ratio.toFixed(1)}× longer (125 Hz ${imb.low.toFixed(2)} s vs 2 kHz ${imb.high.toFixed(2)} s) — a room that sounds dead yet boomy, where low-end decisions drift. Depth (corner traps, thicker panels) evens it, not more thin panels.`;
  if (a.rt60Mid > 0.5) return 'Mix translation: a lively decay like this adds the room to everything you hear, so reverb and balance decisions tend to be too dry when played elsewhere.';
  if (a.rt60Mid < 0.15) return 'Mix translation: a very dead room makes mixes feel dry here and wet everywhere else; keep some life in the room.';
  return 'Mix translation: the decay estimate is in the range small mix rooms aim for, and the bass and treble decays are in step; what remains is the bass and the early reflections above.';
}

const styles = StyleSheet.create({
  doc: { gap: 12 },
  sub: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.3, color: colors.textSub, marginTop: 6 },
  miniPlan: { width: '100%', height: MINI_PLAN_H, borderRadius: 8, overflow: 'hidden', backgroundColor: '#0b0c0f', borderWidth: 1, borderColor: '#1f1f24' },
  numRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  savedRow: { gap: 6, borderTopWidth: 1, borderTopColor: '#1f1f24', paddingTop: 6 },
  savedName: { fontFamily: fonts.barlowMedium, fontSize: 13, color: colors.textSecondary },
  btnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
