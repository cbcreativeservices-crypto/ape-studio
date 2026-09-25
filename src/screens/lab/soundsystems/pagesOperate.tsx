/**
 * Sound Systems Lab — OPERATE mode: power-up, line check, gain structure,
 * soundcheck and ring-out, shutdown and documentation (chapters 9–10, 13
 * in practice). Models from features/soundsystems/operate.ts.
 */
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import type { PageCtx, PageDef } from '../kit/PagedLab';
import { Body, Btn, Card, Eyebrow, Lead, Prompt, Row } from '../tuning/components/primitives';
import { computeGainChain, firstSequenceError, gainVerdict, gainVerdictCopy, isSequenceCorrect, POWER_DOWN, POWER_UP, type GainSettings, type GainStageId, type PowerStep } from '../../../features/soundsystems/operate';
import { markOperateDone } from '../../../features/soundsystems/progress';
import { levelColorForDb } from '../../../features/tools/levelColor';
import { ChapterTag, DeeperRow, GoalChips, KeyFact, LabLink, Readout, ReadoutRow, useVisitGoals, VerdictLine } from './bits';
import { ChainMeter } from './art/ChainMeter';
import { GearGlyph } from './art/gearArt';

function useOperateCredit(id: string, done: boolean, ctx: PageCtx) {
  useEffect(() => {
    if (done) {
      markOperateDone(id);
      if (!ctx.isDone) ctx.markDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);
}

/* ── the sequence exercise (power-up and power-down share it) ────────────── */

function SequenceExercise({ steps, title, onCorrect }: { steps: readonly PowerStep[]; title: string; onCorrect: () => void }) {
  const [order, setOrder] = useState<string[]>([]);
  const bin = useMemo(() => [...steps].sort(() => Math.random() - 0.5), [steps]);
  const err = firstSequenceError(order, steps);
  const complete = isSequenceCorrect(order, steps);
  useEffect(() => {
    if (complete) onCorrect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complete]);
  const byId = (id: string) => steps.find((s) => s.id === id)!;
  return (
    <View style={{ gap: 10 }}>
      <Card tone={complete ? 'ok' : err ? 'warn' : 'plain'}>
        <Eyebrow>{title} · YOUR ORDER</Eyebrow>
        {order.length === 0 ? <Body>Nothing yet. Tap the first step.</Body> : null}
        {order.map((id, i) => (
          <View key={id} style={styles.seqRow}>
            <Text style={styles.seqN}>{i + 1}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.seqTitle}>{byId(id).title}</Text>
              <Text style={styles.seqWhy}>{byId(id).why}</Text>
            </View>
          </View>
        ))}
        {err ? (
          <VerdictLine ok={false}>
            “{byId(err.id).title}” must come AFTER “{byId(err.mustFollow).title}”. Reset and try again.
          </VerdictLine>
        ) : complete ? (
          <VerdictLine ok>Correct order. Every transient happens into a system that cannot pass it to a loudspeaker.</VerdictLine>
        ) : null}
      </Card>
      <Row>
        {bin.map((s) => (
          <Btn key={s.id} label={s.title} disabled={order.includes(s.id) || !!err} onPress={() => setOrder((o) => [...o, s.id])} a11y={`${s.title}${order.includes(s.id) ? ', placed' : ''}`} />
        ))}
        {order.length ? <Btn label="RESET" tone="danger" onPress={() => setOrder([])} a11y="Reset the order" /> : null}
      </Row>
    </View>
  );
}

/* ── 1 · Power up ───────────────────────────────────────────────────────── */

function PagePowerUp({ ctx }: { ctx: PageCtx }) {
  const [done, setDone] = useState(false);
  useOperateCredit('powerup', done, ctx);
  const goals = [{ label: 'Power the system up in the correct order', hit: done }];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={{ gap: 12 }}>
      <ChapterTag n={9}>OPERATE · POWER-UP SEQUENCE</ChapterTag>
      <Lead>
        Every device makes a noise when it wakes: a thump, a click, a burst of digital hash. The order of power-up exists so that noise never reaches an amplifier that is already awake. Tap the steps in order.
      </Lead>
      <View style={styles.glyphRow}>
        <GearGlyph kind="wirelessRx" size={44} label="Stage devices" />
        <GearGlyph kind="console" size={44} label="Console" />
        <GearGlyph kind="processor" size={44} label="Processor" />
        <GearGlyph kind="amp" size={44} label="Amplifiers" />
        <GearGlyph kind="passiveSpeaker" size={44} label="Loudspeakers" />
      </View>
      <SequenceExercise steps={POWER_UP} title="POWER UP" onCorrect={() => setDone(true)} />
      <KeyFact>Sources and console first, amplifiers last, levels raised after. If a step feels like it could go either way, ask which device would be listening when the other one thumps.</KeyFact>
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ── 2 · Line check ─────────────────────────────────────────────────────── */

type LineItem = { id: string; name: string; kind: 'vocalMic' | 'instrumentMic' | 'di' | 'playback' | 'wirelessRx' | 'poweredSpeaker' | 'wedge' | 'poweredSub'; healthy: boolean; reads: string };

const LINE_INPUTS: readonly LineItem[] = [
  { id: 'in1', name: 'Ch 1 · Kick', kind: 'instrumentMic', healthy: true, reads: 'Meter moves with the drum. Good.' },
  { id: 'in2', name: 'Ch 2 · Snare', kind: 'instrumentMic', healthy: true, reads: 'Meter moves. Good.' },
  { id: 'in3', name: 'Ch 3 · Bass DI', kind: 'di', healthy: true, reads: 'Meter moves. Good.' },
  { id: 'in4', name: 'Ch 4 · Guitar', kind: 'instrumentMic', healthy: true, reads: 'Meter moves. Good.' },
  { id: 'in5', name: 'Ch 5 · Keys DI', kind: 'di', healthy: false, reads: 'Meter FLAT while the keys play. The stagebox shows signal on input 5 — the channel is patched from input 6.' },
  { id: 'in6', name: 'Ch 6 · Lead vocal', kind: 'vocalMic', healthy: true, reads: 'Meter moves with the voice. Good.' },
  { id: 'in7', name: 'Ch 7 · Backing vocal', kind: 'vocalMic', healthy: false, reads: 'Meter flat. Swap the cable: alive. The original reads open on pin 2.' },
  { id: 'in8', name: 'Ch 8 · Playback', kind: 'playback', healthy: true, reads: 'Meter moves. Good.' },
];

const LINE_OUTPUTS: readonly LineItem[] = [
  { id: 'outL', name: 'Main left', kind: 'poweredSpeaker', healthy: true, reads: 'Plays the talk-mic clean.' },
  { id: 'outR', name: 'Main right', kind: 'poweredSpeaker', healthy: true, reads: 'Plays the talk-mic clean.' },
  { id: 'outSub', name: 'Subwoofers', kind: 'poweredSub', healthy: true, reads: 'Low end present on pink noise.' },
  { id: 'w1', name: 'Wedge 1', kind: 'wedge', healthy: true, reads: 'Plays Aux 1.' },
  { id: 'w2', name: 'Wedge 2', kind: 'wedge', healthy: false, reads: 'Plays the HOUSE MIX, not Aux 2 — patched from Main L.' },
  { id: 'w3', name: 'Wedge 3', kind: 'wedge', healthy: true, reads: 'Plays Aux 3.' },
];

function LineCheckList({ items, marks, onMark }: { items: readonly LineItem[]; marks: Record<string, 'ok' | 'fault' | undefined>; onMark: (id: string, m: 'ok' | 'fault') => void }) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  return (
    <View style={{ gap: 6 }}>
      {items.map((it) => {
        const c = checked.has(it.id);
        const m = marks[it.id];
        const right = m && (m === 'ok') === it.healthy;
        return (
          <View key={it.id} style={[styles.line, m ? (right ? styles.lineOk : styles.lineBad) : null]}>
            <GearGlyph kind={it.kind} size={34} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.lineName}>{it.name}</Text>
              {c ? <Text style={[styles.lineRead, !it.healthy && { color: colors.orange }]}>{it.reads}</Text> : null}
              {m && !right ? <Text style={styles.lineWhy}>Read it again — {it.healthy ? 'that reading is healthy.' : 'that reading is a fault.'}</Text> : null}
            </View>
            {!c ? (
              <Btn label="CHECK" onPress={() => setChecked((s) => new Set(s).add(it.id))} a11y={`Check ${it.name}`} />
            ) : !m || !right ? (
              <View style={{ gap: 4 }}>
                <Btn label="OK" tone="primary" onPress={() => onMark(it.id, 'ok')} a11y={`Mark ${it.name} OK`} />
                <Btn label="FAULT" tone="danger" onPress={() => onMark(it.id, 'fault')} a11y={`Mark ${it.name} as a fault`} />
              </View>
            ) : (
              <Text style={[styles.lineMark, { color: it.healthy ? colors.green : colors.orange }]}>{it.healthy ? '✓ OK' : '△ FAULT'}</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

function PageLineCheck({ ctx }: { ctx: PageCtx }) {
  const [marks, setMarks] = useState<Record<string, 'ok' | 'fault' | undefined>>({});
  const all = [...LINE_INPUTS, ...LINE_OUTPUTS];
  const correct = all.filter((it) => marks[it.id] && (marks[it.id] === 'ok') === it.healthy).length;
  const done = correct >= all.length;
  useOperateCredit('linecheck', done, ctx);
  const goals = [{ label: 'Every input and output checked and correctly marked', hit: done }];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={{ gap: 12 }}>
      <ChapterTag n={9}>OPERATE · LINE CHECK</ChapterTag>
      <Lead>
        Before a musician plays a note: every input arrives at its channel, every output plays its loudspeaker. Nothing is assumed. Check each one, read what it shows, and mark it honestly — three of these are faults.
      </Lead>
      <Eyebrow>INPUTS — DOES EACH SOURCE ARRIVE AT ITS CHANNEL?</Eyebrow>
      <LineCheckList items={LINE_INPUTS} marks={marks} onMark={(id, m) => setMarks((s) => ({ ...s, [id]: m }))} />
      <Eyebrow>OUTPUTS — DOES EACH LOUDSPEAKER PLAY ITS FEED?</Eyebrow>
      <LineCheckList items={LINE_OUTPUTS} marks={marks} onMark={(id, m) => setMarks((s) => ({ ...s, [id]: m }))} />
      <VerdictLine ok={done} warn={!done}>{done ? 'Line check complete: two dead inputs and one mis-patched wedge found before the band arrived.' : `${correct} of ${all.length} marked correctly.`}</VerdictLine>
      <KeyFact>A line check is a test of the SYSTEM, one path at a time, with the routing already verified (amplifiers off) before the first output was powered. It is the cheapest hour of the day.</KeyFact>
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ── 3 · Gain structure ─────────────────────────────────────────────────── */

function PageGainStructure({ ctx }: { ctx: PageCtx }) {
  const [settings, setSettings] = useState<GainSettings>({ preamp: 60, fader: -20, main: -10, procIn: 0, procOut: 0, amp: 0 });
  const chain = computeGainChain(settings);
  const verdict = gainVerdict(chain);
  const headroomOk = chain.every((n) => n.headroomDb >= 12);
  const done = verdict === 'ok' && headroomOk;
  useOperateCredit('gain', done, ctx);
  const goals = [{ label: 'No stage clipping', hit: !chain.some((n) => n.clipped) }, { label: 'At least 12 dB headroom at every stage', hit: headroomOk }, { label: 'Verdict OK — unity through the middle', hit: verdict === 'ok' }];
  const latched = useVisitGoals(ctx, goals);
  const last = chain[chain.length - 1];
  return (
    <View style={{ gap: 12 }}>
      <ChapterTag n={10}>OPERATE · ESTABLISH GAIN STRUCTURE</ChapterTag>
      <Lead>
        The opposite fault from the LEARN chapter: the preamp is cranked and every later stage is pulling it back down. It clips at the first stage, and no fader after it can undo that. Set the preamp for headroom, then bring the rest to unity.
      </Lead>
      <ChainMeter chain={chain} settings={settings} onChange={(id: GainStageId, db: number) => setSettings((s) => ({ ...s, [id]: db }))} />
      <ReadoutRow>
        <Readout k="AT THE LOUDSPEAKER" v={`${Math.round(last.levelDbu)} dBu`} tint={levelColorForDb(last.levelDbu, -40, 20)} />
        <Readout k="LEAST HEADROOM" v={`${Math.round(Math.min(...chain.map((n) => n.headroomDb)))} dB`} tint={headroomOk ? colors.green : colors.orange} />
        <Readout k="VERDICT" v={verdict.toUpperCase()} tint={verdict === 'ok' ? colors.green : verdict === 'clipping' ? colors.red : colors.orange} />
      </ReadoutRow>
      <VerdictLine ok={verdict === 'ok'} warn={verdict === 'quiet' || verdict === 'noisy'}>{gainVerdictCopy(verdict, chain)}</VerdictLine>
      <Card>
        <Eyebrow>THE PROCEDURE</Eyebrow>
        <Body>1 · Faders at unity, main at unity, processor and amplifier at their nominal marks. 2 · Set each PREAMP so the channel peaks around −18 dBFS (about +4 dBu) on the loudest thing the source will do. 3 · Mix with the faders around unity — small moves. 4 · Set the amplifier inputs so the processor’s limiter engages before the amplifier clips. Gain-before-feedback is spent at the preamp too: every dB of gain you do not need is a dB closer to the ring.</Body>
      </Card>
      <DeeperRow>
        <LabLink route="GainLabHome" label="Gain Staging Lab" />
      </DeeperRow>
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ── 4 · Soundcheck and ring-out ────────────────────────────────────────── */

type WedgeState = { id: string; name: string; geometry: 'front' | 'behind'; send: number; notched: boolean };

const WEDGE_LIMIT = (w: WedgeState) => (w.geometry === 'behind' ? 0 : -12) + (w.notched ? 4 : 0);

function PageSoundcheck({ ctx }: { ctx: PageCtx }) {
  const [wedges, setWedges] = useState<WedgeState[]>([
    { id: 'w1', name: 'Wedge 1 · Singer', geometry: 'front', send: -18, notched: false },
    { id: 'w2', name: 'Wedge 2 · Guitar', geometry: 'front', send: -18, notched: false },
    { id: 'w3', name: 'Wedge 3 · Bass', geometry: 'behind', send: -18, notched: false },
    { id: 'w4', name: 'Wedge 4 · Drums', geometry: 'front', send: -18, notched: false },
  ]);
  const [rang, setRang] = useState(false);
  const ringing = wedges.filter((w) => w.send > WEDGE_LIMIT(w));
  useEffect(() => {
    if (ringing.length) setRang(true);
  }, [ringing.length]);
  const loudEnough = wedges.every((w) => w.send >= -6);
  const done = loudEnough && ringing.length === 0;
  useOperateCredit('soundcheck', done, ctx);
  const goals = [{ label: 'Every wedge at −6 dB or louder', hit: loudEnough }, { label: 'No wedge ringing', hit: loudEnough && ringing.length === 0 }];
  const latched = useVisitGoals(ctx, goals);
  const patch = (id: string, p: Partial<WedgeState>) => setWedges((ws) => ws.map((w) => (w.id === id ? { ...w, ...p } : w)));
  return (
    <View style={{ gap: 12 }}>
      <ChapterTag n={13}>OPERATE · SOUNDCHECK AND RING-OUT</ChapterTag>
      <Lead>
        Four performers each want their wedge louder. Three wedges sit in front of their microphones — in the live angle. Bring every send to −6 dB or louder without a ring: reposition first, notch only the frequency that rings, and only then level.
      </Lead>
      {wedges.map((w) => {
        const limit = WEDGE_LIMIT(w);
        const ring = w.send > limit;
        const margin = limit - w.send;
        return (
          <Card key={w.id} tone={ring ? 'warn' : w.send >= -6 ? 'ok' : 'plain'}>
            <View style={styles.wedgeHead}>
              <GearGlyph kind="wedge" size={40} />
              <View style={{ flex: 1 }}>
                <Eyebrow>{w.name.toUpperCase()}</Eyebrow>
                <Text style={[styles.wedgeState, ring && { color: colors.red }]}>{ring ? `RINGING at ~2.5 kHz — ${-margin} dB over` : `${margin} dB of margin`}</Text>
              </View>
              <Text style={styles.wedgeSend}>{w.send > 0 ? '+' : ''}{w.send} dB</Text>
            </View>
            <Row>
              <Btn label="−3" onPress={() => patch(w.id, { send: Math.max(-30, w.send - 3) })} a11y={`${w.name} send down 3 dB`} />
              <Btn label="+3" onPress={() => patch(w.id, { send: Math.min(6, w.send + 3) })} a11y={`${w.name} send up 3 dB`} />
              <Btn label={w.geometry === 'front' ? 'IN THE LIVE ANGLE' : 'IN THE REJECTION ANGLE'} selected={w.geometry === 'behind'} tone={w.geometry === 'behind' ? 'primary' : 'plain'} onPress={() => patch(w.id, { geometry: w.geometry === 'front' ? 'behind' : 'front' })} a11y={`${w.name} position: ${w.geometry === 'front' ? 'in the microphone’s live angle, tap to move' : 'in the rejection angle'}`} />
              <Btn label={w.notched ? '● NOTCH' : '○ NOTCH'} selected={w.notched} onPress={() => patch(w.id, { notched: !w.notched })} a11y={`${w.name} narrow notch ${w.notched ? 'on' : 'off'}`} />
            </Row>
          </Card>
        );
      })}
      <VerdictLine ok={done} warn={!done && rang}>{done ? 'Every wedge is loud enough and none rings. Now the band can play — and the soundcheck order is drums, bass, guitars, keys, vocals, then all together.' : rang ? 'A wedge rang. Geometry first: move it into the rejection angle before you reach for a notch.' : 'Bring the sends up and listen for the ring.'}</VerdictLine>
      <Card tone="note">
        <Eyebrow>ILLUSTRATIVE MODEL</Eyebrow>
        <Body>Placement buys 12 dB and a narrow notch buys 4 in this model — teaching proportions, not measurements. Real gain-before-feedback depends on the microphone, the wedge, the stage and the room, and is found with an analyser and your ears.</Body>
      </Card>
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

/* ── 5 · Shutdown and documentation ─────────────────────────────────────── */

const DOCS = ['Console scene saved and named for the show', 'Processor preset saved and named for the room', 'Input patch list written (channel · source · stagebox input)', 'Output patch list written (bus · socket · destination)', 'Loudspeaker positions and delay times noted'] as const;

function PageShutdown({ ctx }: { ctx: PageCtx }) {
  const [seq, setSeq] = useState(false);
  const [docs, setDocs] = useState<Set<string>>(new Set());
  const done = seq && docs.size >= DOCS.length;
  useOperateCredit('shutdown', done, ctx);
  const goals = [{ label: 'Power down in the correct order', hit: seq }, { label: 'Document the configuration', hit: docs.size >= DOCS.length }];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={{ gap: 12 }}>
      <ChapterTag n={9}>OPERATE · SHUTDOWN AND DOCUMENTATION</ChapterTag>
      <Lead>Power-down is the mirror of power-up, and for the same reason. Before the console goes dark, the show is saved and the configuration is written down — so tomorrow starts from tonight.</Lead>
      <SequenceExercise steps={POWER_DOWN} title="POWER DOWN" onCorrect={() => setSeq(true)} />
      <Card>
        <Eyebrow>DOCUMENT THE FINAL CONFIGURATION</Eyebrow>
        {DOCS.map((d) => {
          const on = docs.has(d);
          return (
            <Pressable key={d} onPress={() => setDocs((s) => new Set(s).add(d))} style={styles.docRow} accessibilityRole="checkbox" accessibilityState={{ checked: on }} aria-checked={on} accessibilityLabel={d}>
              <View style={[styles.docBox, on && styles.docBoxOn]}>{on ? <Text style={styles.docCheck}>✓</Text> : null}</View>
              <Text style={[styles.docText, on && { color: colors.textPrimary }]}>{d}</Text>
            </Pressable>
          );
        })}
      </Card>
      <KeyFact>Documentation is not admin. It is what lets the next person — or you, next week — rebuild the system without re-finding every fault you found today.</KeyFact>
      <GoalChips goals={goals} latched={latched} />
    </View>
  );
}

export const SS_OPERATE_PAGES: PageDef[] = [
  { title: 'Power-up sequence', short: 'POWER UP', Component: PagePowerUp, manualDone: true },
  { title: 'Line check', short: 'LINE CHECK', Component: PageLineCheck, manualDone: true },
  { title: 'Establish gain structure', short: 'GAIN', Component: PageGainStructure, manualDone: true },
  { title: 'Soundcheck and ring-out', short: 'SOUNDCHECK', Component: PageSoundcheck, manualDone: true },
  { title: 'Shutdown and documentation', short: 'SHUTDOWN', Component: PageShutdown, manualDone: true },
];

const styles = StyleSheet.create({
  glyphRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6 },
  seqRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingVertical: 3 },
  seqN: { color: colors.amberLabel, fontFamily: fonts.mono, fontSize: 13, width: 18 },
  seqTitle: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 13 },
  seqWhy: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#101013', padding: 8, minHeight: 52 },
  lineOk: { borderColor: colors.green },
  lineBad: { borderColor: colors.red },
  lineName: { color: colors.textSecondary, fontFamily: fonts.oswaldMedium, fontSize: 11.5, letterSpacing: 0.6 },
  lineRead: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16 },
  lineWhy: { color: colors.red, fontFamily: fonts.barlowMedium, fontSize: 12 },
  lineMark: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 0.8, minWidth: 60, textAlign: 'right' },
  wedgeHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wedgeState: { color: colors.textSub, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 0.6 },
  wedgeSend: { color: colors.amber, fontFamily: fonts.mono, fontSize: 15 },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  docBox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1.5, borderColor: '#3a3a44', alignItems: 'center', justifyContent: 'center' },
  docBoxOn: { borderColor: colors.green, backgroundColor: 'rgba(55,224,95,.15)' },
  docCheck: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, color: colors.green, marginTop: -1 },
  docText: { flex: 1, color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18 },
});
