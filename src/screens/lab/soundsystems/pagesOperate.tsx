/**
 * Sound Systems Lab — OPERATE mode: power-up, line check, gain structure,
 * ring-out and soundcheck, shutdown and documentation (chapters 9–10, 13
 * in practice). Models from features/soundsystems/operate.ts.
 *
 * Every page opens with its instrument: the rack that lights in order, the
 * stagebox LEDs over the console meters, the chain of meters, the wedge in
 * or out of the microphone's null.
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
import { GearGlyph, type GlyphKind } from './art/gearArt';
import { FeedbackLoop, Orient, StageboxStrip, type LineReading } from './art/diagrams';

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

function SequenceExercise({ steps, title, onCorrect, onOrder }: { steps: readonly PowerStep[]; title: string; onCorrect: () => void; onOrder?: (order: string[], ok: boolean) => void }) {
  const [order, setOrder] = useState<string[]>([]);
  const bin = useMemo(() => [...steps].sort(() => Math.random() - 0.5), [steps]);
  const err = firstSequenceError(order, steps);
  const complete = isSequenceCorrect(order, steps);
  useEffect(() => {
    if (complete) onCorrect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complete]);
  useEffect(() => {
    onOrder?.(order, !err);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order, err]);
  const byId = (id: string) => steps.find((s) => s.id === id)!;
  return (
    <View style={{ gap: 10 }}>
      <Row>
        {bin.map((s) => (
          <Btn key={s.id} label={s.title} disabled={order.includes(s.id) || !!err} onPress={() => setOrder((o) => [...o, s.id])} a11y={`${s.title}${order.includes(s.id) ? ', placed' : ''}`} />
        ))}
        {order.length ? <Btn label="RESET" tone="danger" onPress={() => setOrder([])} a11y="Reset the order" /> : null}
      </Row>
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
    </View>
  );
}

/* ── the rack that lights in order ──────────────────────────────────────── */

const RACK: readonly { step: string; kind: GlyphKind; label: string }[] = [
  { step: 'sources', kind: 'wirelessRx', label: 'Stage devices' },
  { step: 'console', kind: 'console', label: 'Console' },
  { step: 'processor', kind: 'processor', label: 'Processor' },
  { step: 'amps', kind: 'amp', label: 'Amplifiers' },
  { step: 'amps', kind: 'passiveSpeaker', label: 'Loudspeakers' },
];

function PowerRack({ on, direction }: { on: ReadonlySet<string>; direction: 'up' | 'down' }) {
  return (
    <View style={styles.glyphRow} accessible accessibilityLabel={`The rack: ${RACK.map((r) => `${r.label} ${on.has(r.step) ? 'on' : 'off'}`).join(', ')}`}>
      {RACK.map((r, i) => {
        const lit = direction === 'up' ? on.has(r.step) : !on.has(r.step);
        return (
          <View key={i} style={styles.rackItem}>
            <GearGlyph kind={r.kind} size={44} label={r.label} power={lit ? 'on' : 'off'} dim={!lit} />
            <Text style={[styles.rackState, { color: lit ? colors.greenBright : colors.textMuted }]}>{lit ? '● ON' : '○ OFF'}</Text>
          </View>
        );
      })}
    </View>
  );
}

/* ── 1 · Power up ───────────────────────────────────────────────────────── */

function PagePowerUp({ ctx }: { ctx: PageCtx }) {
  const [done, setDone] = useState(false);
  const [on, setOn] = useState<Set<string>>(new Set());
  useOperateCredit('powerup', done, ctx);
  const goals = [{ label: 'Power the system up in the correct order', hit: done }];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={{ gap: 12 }}>
      <ChapterTag n={9}>OPERATE · POWER-UP SEQUENCE</ChapterTag>
      <Orient>The system, everything dark. Each device you switch on lights here — in the order you choose.</Orient>
      <PowerRack on={on} direction="up" />
      <Prompt>Tap the steps in the order that keeps every turn-on thump away from a live amplifier.</Prompt>
      <GoalChips goals={goals} latched={latched} />
      <SequenceExercise steps={POWER_UP} title="POWER UP" onCorrect={() => setDone(true)} onOrder={(order, ok) => setOn(new Set(ok ? order : []))} />
      <KeyFact>Every device makes a noise when it wakes: a thump, a click, a burst of digital hash. Sources and console first, amplifiers last, levels raised after — so that noise never reaches an amplifier that is already awake. If a step feels like it could go either way, ask which device would be listening when the other one thumps.</KeyFact>
    </View>
  );
}

/* ── 2 · Line check ─────────────────────────────────────────────────────── */

type LineItem = { id: string; name: string; short: string; kind: 'vocalMic' | 'instrumentMic' | 'di' | 'playback' | 'wirelessRx' | 'poweredSpeaker' | 'wedge' | 'poweredSub'; healthy: boolean; reads: string; led: boolean; meter: boolean };

const LINE_OUTPUTS: readonly LineItem[] = [
  { id: 'outL', name: 'Main left', short: 'MAIN L', kind: 'poweredSpeaker', healthy: true, reads: 'Plays the talk-mic clean. Processor output 1 shows signal; the box plays.', led: true, meter: true },
  { id: 'outR', name: 'Main right', short: 'MAIN R', kind: 'poweredSpeaker', healthy: true, reads: 'Plays the talk-mic clean.', led: true, meter: true },
  { id: 'outSub', name: 'Subwoofers', short: 'SUBS', kind: 'poweredSub', healthy: true, reads: 'Low end present on pink noise.', led: true, meter: true },
  { id: 'w1', name: 'Wedge 1', short: 'WEDGE 1', kind: 'wedge', healthy: true, reads: 'Plays Aux 1 — the talk-mic sent to Aux 1 comes out of Wedge 1 alone.', led: true, meter: true },
  { id: 'w2', name: 'Wedge 2', short: 'WEDGE 2', kind: 'wedge', healthy: false, reads: 'Plays the HOUSE MIX, not Aux 2 — talk into the announce mic and it comes out of Wedge 2. Patched from Main L.', led: true, meter: false },
  { id: 'w3', name: 'Wedge 3', short: 'WEDGE 3', kind: 'wedge', healthy: true, reads: 'Plays Aux 3.', led: true, meter: true },
];

const LINE_INPUTS: readonly LineItem[] = [
  { id: 'in1', name: 'Ch 1 · Kick', short: 'KICK', kind: 'instrumentMic', healthy: true, reads: 'Stagebox LED 1 lights on the hit; channel 1 meter moves. Good.', led: true, meter: true },
  { id: 'in2', name: 'Ch 2 · Snare', short: 'SNARE', kind: 'instrumentMic', healthy: true, reads: 'LED 2 lights; channel 2 moves. Good.', led: true, meter: true },
  { id: 'in3', name: 'Ch 3 · Bass DI', short: 'BASS', kind: 'di', healthy: true, reads: 'LED 3 lights; channel 3 moves. Good.', led: true, meter: true },
  { id: 'in4', name: 'Ch 4 · Guitar', short: 'GTR', kind: 'instrumentMic', healthy: true, reads: 'LED 4 lights; channel 4 moves. Good.', led: true, meter: true },
  { id: 'in5', name: 'Ch 5 · Keys DI', short: 'KEYS', kind: 'di', healthy: false, reads: 'Stagebox LED 5 lights while the keys play — but channel 5’s meter stays FLAT. The signal reaches the stagebox and not the channel: channel 5 is patched from input 6.', led: true, meter: false },
  { id: 'in6', name: 'Ch 6 · Lead vocal', short: 'VOX', kind: 'vocalMic', healthy: true, reads: 'LED 6 lights; channel 6 moves with the voice. Good.', led: true, meter: true },
  { id: 'in7', name: 'Ch 7 · Backing vocal', short: 'BVOX', kind: 'vocalMic', healthy: false, reads: 'Stagebox LED 7 stays DARK and the meter is flat: nothing reaches the stagebox. Swap the cable: alive. The original reads open on pin 2.', led: false, meter: false },
  { id: 'in8', name: 'Ch 8 · Playback', short: 'PB', kind: 'playback', healthy: true, reads: 'LED 8 lights; channel 8 moves. Good.', led: true, meter: true },
];

function LineCheckList({ items, marks, checked, onCheck, onMark }: { items: readonly LineItem[]; marks: Record<string, 'ok' | 'fault' | undefined>; checked: ReadonlySet<string>; onCheck: (id: string) => void; onMark: (id: string, m: 'ok' | 'fault') => void }) {
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
              <Btn label="PROBE" onPress={() => onCheck(it.id)} a11y={`Probe ${it.name}`} />
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
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const all = [...LINE_OUTPUTS, ...LINE_INPUTS];
  const correct = all.filter((it) => marks[it.id] && (marks[it.id] === 'ok') === it.healthy).length;
  const done = correct >= all.length;
  useOperateCredit('linecheck', done, ctx);
  const goals = [{ label: 'Every output and input probed and correctly marked', hit: done }];
  const latched = useVisitGoals(ctx, goals);
  const inputStrip: LineReading[] = LINE_INPUTS.map((it) => ({ id: it.id, short: it.short, led: it.led, meter: it.meter, revealed: checked.has(it.id) }));
  const outputStrip: LineReading[] = LINE_OUTPUTS.map((it) => ({ id: it.id, short: it.short, led: it.led, meter: it.meter, revealed: checked.has(it.id) }));
  const mark = (id: string, m: 'ok' | 'fault') => setMarks((s) => ({ ...s, [id]: m }));
  const check = (id: string) => setChecked((s) => new Set(s).add(id));
  return (
    <View style={{ gap: 12 }}>
      <ChapterTag n={9}>OPERATE · LINE CHECK</ChapterTag>
      <Orient>Outputs first — the PA has to be proven before there is anything to line-check into — then every input. Each probe reveals two readings: the stagebox LED (did the signal arrive at the stage?) and the console meter (did it arrive at its channel?).</Orient>
      <Eyebrow>OUTPUTS — DOES EACH LOUDSPEAKER PLAY ITS OWN FEED?</Eyebrow>
      <StageboxStrip inputs={outputStrip} title="PROCESSOR · OUTPUT SIGNAL PRESENT" lower="PLAYS THE RIGHT FEED (TALK-MIC TEST)" />
      <LineCheckList items={LINE_OUTPUTS} marks={marks} checked={checked} onCheck={check} onMark={mark} />
      <Eyebrow>INPUTS — DOES EACH SOURCE ARRIVE AT ITS CHANNEL?</Eyebrow>
      <StageboxStrip inputs={inputStrip} />
      <LineCheckList items={LINE_INPUTS} marks={marks} checked={checked} onCheck={check} onMark={mark} />
      <Prompt>Probe each one, read both readings, and mark it honestly — three of these are faults.</Prompt>
      <GoalChips goals={goals} latched={latched} />
      <VerdictLine ok={done} warn={!done}>{done ? 'Line check complete: one mis-patched wedge, one mis-patched input and one dead cable found before the band arrived.' : `${correct} of ${all.length} marked correctly.`}</VerdictLine>
      <KeyFact>A line check is a test of the SYSTEM, one path at a time, with the routing already verified (amplifiers off) before the first output was powered. LED lit but meter flat = the patch. LED dark = the cable or the source. Both moving but the wrong box plays = the output patch. It is the cheapest hour of the day.</KeyFact>
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
      <Orient>The opposite fault from the LEARN chapter: the preamp is cranked and every later stage is pulling it back down. The first CLIP indicator is lit at the preamp, and every meter after it carries the ↑ — the distortion is inherited.</Orient>
      <ChainMeter chain={chain} settings={settings} onChange={(id: GainStageId, db: number) => setSettings((s) => ({ ...s, [id]: db }))} />
      <Prompt>Bring the preamp down until its bracket shows headroom, return the faders and trims to unity, and attenuate the amplifier so it is the last thing to clip.</Prompt>
      <GoalChips goals={goals} latched={latched} />
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
    </View>
  );
}

/* ── 4 · Ring-out and soundcheck ────────────────────────────────────────── */

type WedgeState = { id: string; name: string; geometry: 'live' | 'null'; send: number; notched: boolean };

const WEDGE_LIMIT = (w: WedgeState) => (w.geometry === 'null' ? 0 : -12) + (w.notched ? 4 : 0);

function PageSoundcheck({ ctx }: { ctx: PageCtx }) {
  const [wedges, setWedges] = useState<WedgeState[]>([
    { id: 'w1', name: 'Wedge 1 · Singer', geometry: 'live', send: -18, notched: false },
    { id: 'w2', name: 'Wedge 2 · Guitar', geometry: 'live', send: -18, notched: false },
    { id: 'w3', name: 'Wedge 3 · Bass', geometry: 'null', send: -18, notched: false },
    { id: 'w4', name: 'Wedge 4 · Drums', geometry: 'live', send: -18, notched: false },
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
      <ChapterTag n={13}>OPERATE · RING-OUT, THEN SOUNDCHECK</ChapterTag>
      <Orient>Four wedges, each drawn with its microphone’s pattern. Three sit off to the side, inside the live angle. The ring-out comes BEFORE the band plays: bring each send up to what its performer will need, without a ring.</Orient>
      {wedges.map((w) => {
        const limit = WEDGE_LIMIT(w);
        const ring = w.send > limit;
        const margin = limit - w.send;
        return (
          <Card key={w.id} tone={ring ? 'warn' : w.send >= -6 ? 'ok' : 'plain'}>
            <View style={styles.wedgeHead}>
              <View style={{ flex: 1 }}>
                <Eyebrow>{w.name.toUpperCase()}</Eyebrow>
                <Text style={[styles.wedgeState, ring && { color: colors.red }]}>{ring ? `RINGING at ~2.5 kHz — ${-margin} dB over` : `${margin} dB of margin`}</Text>
              </View>
              <Text style={styles.wedgeSend}>{w.send > 0 ? '+' : ''}{w.send} dB</Text>
            </View>
            <FeedbackLoop compact wedge={w.geometry} ringing={ring} sendDb={w.send} />
            <Row>
              <Btn label="−3" onPress={() => patch(w.id, { send: Math.max(-30, w.send - 3) })} a11y={`${w.name} send down 3 dB`} />
              <Btn label="+3" onPress={() => patch(w.id, { send: Math.min(6, w.send + 3) })} a11y={`${w.name} send up 3 dB`} />
              <Btn label={w.geometry === 'live' ? 'IN THE LIVE ANGLE' : 'IN THE NULL'} selected={w.geometry === 'null'} tone={w.geometry === 'null' ? 'primary' : 'plain'} onPress={() => patch(w.id, { geometry: w.geometry === 'live' ? 'null' : 'live' })} a11y={`${w.name} position: ${w.geometry === 'live' ? 'in the microphone’s live angle, tap to move it into the null' : 'in the null'}`} />
              <Btn label={w.notched ? '● NOTCH' : '○ NOTCH'} selected={w.notched} onPress={() => patch(w.id, { notched: !w.notched })} a11y={`${w.name} narrow notch ${w.notched ? 'on' : 'off'}`} />
            </Row>
          </Card>
        );
      })}
      <Prompt>Reposition first, notch only the frequency that rings, and only then level. Every wedge to −6 dB or louder.</Prompt>
      <GoalChips goals={goals} latched={latched} />
      <VerdictLine ok={done} warn={!done && rang}>{done ? 'Every wedge is loud enough and none rings. Now the band can play — soundcheck order: drums, bass, guitars, keys, vocals, then all together.' : rang ? 'A wedge rang. Geometry first: move it into the null before you reach for a notch.' : 'Bring the sends up and listen for the ring.'}</VerdictLine>
      <Card tone="note">
        <Eyebrow>ILLUSTRATIVE MODEL</Eyebrow>
        <Body>Placement buys 12 dB and a narrow notch buys 4 in this model — teaching proportions, not measurements. Real gain-before-feedback depends on the microphone, the wedge, the stage and the room, and is found with an analyser and your ears.</Body>
      </Card>
    </View>
  );
}

/* ── 5 · Shutdown and documentation ─────────────────────────────────────── */

const DOCS = ['Console scene saved and named for the show', 'Processor preset saved and named for the room', 'Input patch list written (channel · source · stagebox input)', 'Output patch list written (bus · socket · destination)', 'Loudspeaker positions and delay times noted'] as const;

function PageShutdown({ ctx }: { ctx: PageCtx }) {
  const [seq, setSeq] = useState(false);
  const [off, setOff] = useState<Set<string>>(new Set());
  const [docs, setDocs] = useState<Set<string>>(new Set());
  const done = seq && docs.size >= DOCS.length;
  useOperateCredit('shutdown', done, ctx);
  const goals = [{ label: 'Power down in the correct order', hit: seq }, { label: 'Document the configuration', hit: docs.size >= DOCS.length }];
  const latched = useVisitGoals(ctx, goals);
  return (
    <View style={{ gap: 12 }}>
      <ChapterTag n={9}>OPERATE · SHUTDOWN AND DOCUMENTATION</ChapterTag>
      <Orient>The system, everything on. Each device you switch off goes dark here — in the order you choose.</Orient>
      <PowerRack on={off} direction="down" />
      <Prompt>Power-down is the mirror of power-up, for the same reason. Tap the steps in order, then write the show down.</Prompt>
      <GoalChips goals={goals} latched={latched} />
      <SequenceExercise steps={POWER_DOWN} title="POWER DOWN" onCorrect={() => setSeq(true)} onOrder={(order, ok) => setOff(new Set(ok ? order : []))} />
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
      <KeyFact>Before the console goes dark, the show is saved and the configuration is written down — so tomorrow starts from tonight. Documentation is not admin. It is what lets the next person — or you, next week — rebuild the system without re-finding every fault you found today.</KeyFact>
    </View>
  );
}

export const SS_OPERATE_PAGES: PageDef[] = [
  { title: 'Power-up sequence', short: 'POWER UP', Component: PagePowerUp, manualDone: true },
  { title: 'Line check', short: 'LINE CHECK', Component: PageLineCheck, manualDone: true },
  { title: 'Establish gain structure', short: 'GAIN', Component: PageGainStructure, manualDone: true },
  { title: 'Ring-out and soundcheck', short: 'RING-OUT', Component: PageSoundcheck, manualDone: true },
  { title: 'Shutdown and documentation', short: 'SHUTDOWN', Component: PageShutdown, manualDone: true },
];

void Lead;

const styles = StyleSheet.create({
  glyphRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6 },
  rackItem: { alignItems: 'center', gap: 2 },
  rackState: { fontFamily: fonts.oswaldMedium, fontSize: 9, letterSpacing: 1 },
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
