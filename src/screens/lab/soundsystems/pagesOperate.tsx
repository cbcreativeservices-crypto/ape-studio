/**
 * Sound Systems Lab — OPERATE mode: power-up, line check, gain structure,
 * ring-out and soundcheck, shutdown and documentation (chapters 9–10, 13
 * in practice), on the Rack Unit (owner 2026-09-25). Models from
 * features/soundsystems/operate.ts.
 *
 * Every page's instrument is on the glass — the rack that lights in order,
 * the stagebox LEDs over the console meters, the chain of meters, the wedge
 * in or out of the microphone's null — and its controls are in the dock.
 */
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import type { PageCtx } from '../kit/PagedLab';
import { Body, Btn, Card, Eyebrow, Prompt } from '../tuning/components/primitives';
import { computeGainChain, firstSequenceError, gainVerdict, gainVerdictCopy, isSequenceCorrect, POWER_DOWN, POWER_UP, type GainSettings, type GainStageId, type PowerStep } from '../../../features/soundsystems/operate';
import { markOperateDone } from '../../../features/soundsystems/progress';
import { levelColorForDb } from '../../../features/tools/levelColor';
import type { DockParam } from '../rack/rackTypes';
import { ChapterTag, DeeperRow, GoalChips, KeyFact, LabLink, useVisitGoals, VerdictLine } from './bits';
import { ChainMeterKey, ChainMeterStage } from './art/ChainMeter';
import { GearGlyph, type GlyphKind } from './art/gearArt';
import { FeedbackLoop, StageboxStrip, type LineReading } from './art/diagrams';
import { dbFader, fmtDb } from './consoleDock';
import { gainBezel, gainStageParam } from './gainDock';
import { flipFader, SoundSystemsRackLayout, StageBox, type SsPageDef } from './rackLayout';
import { StageFit } from '../rack/StageFit';

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

function useSequence(steps: readonly PowerStep[], onCorrect: () => void) {
  const [order, setOrder] = useState<string[]>([]);
  const bin = useMemo(() => [...steps].sort(() => Math.random() - 0.5), [steps]);
  const err = firstSequenceError(order, steps);
  const complete = isSequenceCorrect(order, steps);
  useEffect(() => {
    if (complete) onCorrect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complete]);
  const byId = (id: string) => steps.find((s) => s.id === id)!;
  const last = order[order.length - 1] ?? null;
  const errText = err ? `“${byId(err.id).title}” must come AFTER “${byId(err.mustFollow).title}”. Reset and try again.` : null;
  /** The dock: STEP — a sticky list of the shuffled steps; picking one makes
   *  it the next step, and the list stays open for the one after. */
  const params: DockParam[] = [
    {
      kind: 'options',
      id: 'step',
      label: 'STEP',
      valueLabel: `${order.length}/${steps.length}`,
      options: bin.map((s) => ({
        id: s.id,
        label: `${order.includes(s.id) ? `${order.indexOf(s.id) + 1} · ` : ''}${s.short}`,
        blurb: order.includes(s.id) ? (s.id === last && errText ? errText : s.why) : 'Tap to make this the next step.',
      })),
      selectedId: last,
      onSelect: (id) => {
        if (err || order.includes(id) || complete) return;
        setOrder((o) => [...o, id]);
      },
      sticky: true,
    },
    ...(order.length ? [{ kind: 'action', id: 'reset', label: 'RESET', onPress: () => setOrder([]), tint: colors.red } as DockParam] : []),
  ];
  return { order, bin, err, errText, complete, byId, last, params };
}

function SequenceCard({ seq, title }: { seq: ReturnType<typeof useSequence>; title: string }) {
  return (
    <Card tone={seq.complete ? 'ok' : seq.err ? 'warn' : 'plain'}>
      <Eyebrow>{title} · YOUR ORDER</Eyebrow>
      {seq.order.length === 0 ? <Body>Nothing yet. Open STEP and tap the first one.</Body> : null}
      {seq.order.map((id, i) => (
        <View key={id} style={styles.seqRow}>
          <Text style={styles.seqN}>{i + 1}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.seqTitle}>{seq.byId(id).title}</Text>
            <Text style={styles.seqWhy}>{seq.byId(id).why}</Text>
          </View>
        </View>
      ))}
      {seq.err ? (
        <VerdictLine ok={false}>{seq.errText}</VerdictLine>
      ) : seq.complete ? (
        <VerdictLine ok>Correct order. Every transient happens into a system that cannot pass it to a loudspeaker.</VerdictLine>
      ) : null}
    </Card>
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

function PowerRack({ on, direction, w, h }: { on: ReadonlySet<string>; direction: 'up' | 'down'; w: number; h: number }) {
  const size = Math.round(Math.min(64, Math.max(36, Math.min(h * 0.4, (w - 40) / 5 - 8))));
  return (
    <StageBox w={w} h={h}>
      <View style={styles.glyphRow} accessible accessibilityLabel={`The rack: ${RACK.map((r) => `${r.label} ${on.has(r.step) ? 'on' : 'off'}`).join(', ')}`}>
        {RACK.map((r, i) => {
          const lit = direction === 'up' ? on.has(r.step) : !on.has(r.step);
          return (
            <View key={i} style={styles.rackItem}>
              <GearGlyph kind={r.kind} size={size} label={r.label} power={lit ? 'on' : 'off'} dim={!lit} legends={false} />
              <Text style={styles.rackLabel} numberOfLines={1}>{r.label.toUpperCase()}</Text>
              <Text style={[styles.rackState, { color: lit ? colors.greenBright : colors.textMuted }]}>{lit ? '● ON' : '○ OFF'}</Text>
            </View>
          );
        })}
      </View>
    </StageBox>
  );
}

/* ── 1 · Power up ───────────────────────────────────────────────────────── */

function PagePowerUp({ ctx }: { ctx: PageCtx }) {
  const [done, setDone] = useState(false);
  useOperateCredit('powerup', done, ctx);
  const goals = [{ label: 'Power the system up in the correct order', hit: done }];
  const latched = useVisitGoals(ctx, goals);
  const seq = useSequence(POWER_UP, () => setDone(true));
  const on = new Set(seq.err ? [] : seq.order);
  const lit = RACK.filter((r) => on.has(r.step)).length;
  return (
    <SoundSystemsRackLayout
      rack={{
        size: 'S',
        badge: 'POWER SEQUENCE — ILLUSTRATIVE · devices light in the order you choose',
        initialParam: 'step',
        bezel: [
          { k: 'STEPS', v: `${seq.order.length}/${POWER_UP.length}`, flex: 0.9 },
          { k: 'LAST', v: seq.last ? seq.byId(seq.last).short.toUpperCase() : '—', tint: colors.cyanBright, flex: 2 },
          { k: 'ORDER', v: seq.err ? 'WRONG' : seq.complete ? 'CORRECT' : 'SO FAR OK', tint: seq.err ? colors.red : seq.complete ? colors.green : colors.amber, flex: 1.1 },
          { k: 'LIT', v: `${lit}/${RACK.length}`, tint: lit ? colors.greenBright : undefined, flex: 0.7 },
        ],
        stage: (w, h) => <PowerRack on={on} direction="up" w={w} h={h} />,
        params: seq.params,
      }}
      caption="Open STEP and tap the steps in the order that keeps every turn-on thump away from a live amplifier. Each device you switch on lights above."
      wellTop={<SequenceCard seq={seq} title="POWER UP" />}
    >
      <ChapterTag n={9}>OPERATE · POWER-UP SEQUENCE</ChapterTag>
      <Body>The system, everything dark. Each device you switch on lights here — in the order you choose.</Body>
      <Prompt>Tap the steps in the order that keeps every turn-on thump away from a live amplifier.</Prompt>
      <GoalChips goals={goals} latched={latched} />
      <KeyFact>Every device makes a noise when it wakes: a thump, a click, a burst of digital hash. Sources and console first, amplifiers last, levels raised after — so that noise never reaches an amplifier that is already awake. If a step feels like it could go either way, ask which device would be listening when the other one thumps.</KeyFact>
    </SoundSystemsRackLayout>
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

const ALL_LINES: readonly LineItem[] = [...LINE_OUTPUTS, ...LINE_INPUTS];

function LineCheckList({ items, marks, checked, onCheck, onMark, selectedId, onSelect }: { items: readonly LineItem[]; marks: Record<string, 'ok' | 'fault' | undefined>; checked: ReadonlySet<string>; onCheck: (id: string) => void; onMark: (id: string, m: 'ok' | 'fault') => void; selectedId: string; onSelect: (id: string) => void }) {
  return (
    <View style={{ gap: 6 }}>
      {items.map((it) => {
        const c = checked.has(it.id);
        const m = marks[it.id];
        const right = m && (m === 'ok') === it.healthy;
        const sel = selectedId === it.id;
        return (
          <Pressable key={it.id} onPress={() => onSelect(it.id)} style={[styles.line, m ? (right ? styles.lineOk : styles.lineBad) : null, sel && styles.lineSel]} accessibilityRole="button" accessibilityState={{ selected: sel }} aria-pressed={sel} accessibilityLabel={`${it.name}${c ? `: ${it.reads}` : ', not probed'}${m && right ? `, marked ${m}` : ''}`}>
            <GearGlyph kind={it.kind} size={34} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.lineName, sel && { color: colors.cyanBright }]}>{it.name}</Text>
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
          </Pressable>
        );
      })}
    </View>
  );
}

const STRIP_W = 354;
const STRIP_H = 118;

function PageLineCheck({ ctx }: { ctx: PageCtx }) {
  const [marks, setMarks] = useState<Record<string, 'ok' | 'fault' | undefined>>({});
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [sel, setSel] = useState<string>(LINE_OUTPUTS[0].id);
  const correct = ALL_LINES.filter((it) => marks[it.id] && (marks[it.id] === 'ok') === it.healthy).length;
  const done = correct >= ALL_LINES.length;
  useOperateCredit('linecheck', done, ctx);
  const goals = [{ label: 'Every output and input probed and correctly marked', hit: done }];
  const latched = useVisitGoals(ctx, goals);
  const inputStrip: LineReading[] = LINE_INPUTS.map((it) => ({ id: it.id, short: it.short, led: it.led, meter: it.meter, revealed: checked.has(it.id) }));
  const outputStrip: LineReading[] = LINE_OUTPUTS.map((it) => ({ id: it.id, short: it.short, led: it.led, meter: it.meter, revealed: checked.has(it.id) }));
  const mark = (id: string, m: 'ok' | 'fault') => setMarks((s) => ({ ...s, [id]: m }));
  const check = (id: string) => setChecked((s) => new Set(s).add(id));
  const it = ALL_LINES.find((x) => x.id === sel)!;
  const probed = checked.has(sel);
  const m = marks[sel];
  const right = m && (m === 'ok') === it.healthy;
  const params: DockParam[] = [
    flipFader({
      id: 'line',
      label: 'LINE',
      title: 'OUTPUTS FIRST, THEN EVERY INPUT',
      items: ALL_LINES,
      selectedId: sel,
      onSelect: setSel,
      name: (x) => `${marks[x.id] && (marks[x.id] === 'ok') === x.healthy ? '✓ ' : checked.has(x.id) ? '◐ ' : ''}${x.name}`,
      short: (x) => x.short,
      blurb: (x) => (checked.has(x.id) ? x.reads : 'Not probed yet. Tap PROBE to read the stagebox LED and the console meter.'),
    }),
    ...(!probed ? [{ kind: 'action', id: 'probe', label: 'PROBE', onPress: () => check(sel), tint: colors.cyanBright } as DockParam] : []),
    ...(probed && !right
      ? [
          { kind: 'action', id: 'ok', label: 'MARK OK', onPress: () => mark(sel, 'ok'), tint: colors.green } as DockParam,
          { kind: 'action', id: 'fault', label: 'MARK FAULT', onPress: () => mark(sel, 'fault'), tint: colors.red } as DockParam,
        ]
      : []),
  ];
  return (
    <SoundSystemsRackLayout
      rack={{
        size: 'L',
        badge: 'LINE CHECK — ILLUSTRATIVE · readings revealed by each probe',
        initialParam: 'line',
        hideDragTag: true,
        bezel: [
          { k: 'LINE', v: it.short, tint: colors.cyanBright, flex: 1.2 },
          { k: 'STAGEBOX LED', v: probed ? (it.led ? 'LIT' : 'DARK') : '?', tint: probed ? (it.led ? colors.greenBright : colors.orange) : undefined, flex: 1.3 },
          { k: 'CH METER', v: probed ? (it.meter ? 'MOVING' : 'FLAT') : '?', tint: probed ? (it.meter ? colors.greenBright : colors.orange) : undefined, flex: 1.1 },
          { k: 'MARKED', v: `${correct}/${ALL_LINES.length}`, tint: done ? colors.green : undefined },
        ],
        stage: (w, h) => (
          <StageFit w={w} h={h} aspect={STRIP_W / (STRIP_H * 2 + 8)}>
            <View style={{ gap: 4 }}>
              <StageboxStrip inputs={outputStrip} title="PROCESSOR · OUTPUT SIGNAL PRESENT" lower="PLAYS THE RIGHT FEED (TALK-MIC TEST)" selectedId={sel} />
              <StageboxStrip inputs={inputStrip} selectedId={sel} />
            </View>
          </StageFit>
        ),
        params,
      }}
      caption="Ride LINE across the outputs, then the inputs. PROBE each one, read the LED against the meter, and MARK it honestly — three of these are faults."
      wellTop={
        <Card tone={m ? (right ? 'ok' : 'warn') : probed && !it.healthy ? 'warn' : 'math'}>
          <View style={styles.lineHead}>
            <GearGlyph kind={it.kind} size={40} label={it.name} />
            <View style={{ flex: 1, gap: 2 }}>
              <Eyebrow>{it.name.toUpperCase()}{m && right ? (it.healthy ? ' · ✓ OK' : ' · △ FAULT') : ''}</Eyebrow>
              <Text style={[styles.lineRead, probed && !it.healthy && { color: colors.orange }]}>{probed ? it.reads : 'Not probed yet.'}</Text>
              {m && !right ? <Text style={styles.lineWhy}>Read it again — {it.healthy ? 'that reading is healthy.' : 'that reading is a fault.'}</Text> : null}
            </View>
          </View>
        </Card>
      }
    >
      <ChapterTag n={9}>OPERATE · LINE CHECK</ChapterTag>
      <Body>Outputs first — the PA has to be proven before there is anything to line-check into — then every input. Each probe reveals two readings: the stagebox LED (did the signal arrive at the stage?) and the console meter (did it arrive at its channel?).</Body>
      <Prompt>Probe each one, read both readings, and mark it honestly — three of these are faults.</Prompt>
      <GoalChips goals={goals} latched={latched} />
      <VerdictLine ok={done} warn={!done}>{done ? 'Line check complete: one mis-patched wedge, one mis-patched input and one dead cable found before the band arrived.' : `${correct} of ${ALL_LINES.length} marked correctly.`}</VerdictLine>
      <Eyebrow>OUTPUTS — DOES EACH LOUDSPEAKER PLAY ITS OWN FEED?</Eyebrow>
      <LineCheckList items={LINE_OUTPUTS} marks={marks} checked={checked} onCheck={check} onMark={mark} selectedId={sel} onSelect={setSel} />
      <Eyebrow>INPUTS — DOES EACH SOURCE ARRIVE AT ITS CHANNEL?</Eyebrow>
      <LineCheckList items={LINE_INPUTS} marks={marks} checked={checked} onCheck={check} onMark={mark} selectedId={sel} onSelect={setSel} />
      <KeyFact>A line check is a test of the SYSTEM, one path at a time, with the routing already verified (amplifiers off) before the first output was powered. LED lit but meter flat = the patch. LED dark = the cable or the source. Both moving but the wrong box plays = the output patch. It is the cheapest hour of the day.</KeyFact>
    </SoundSystemsRackLayout>
  );
}

/* ── 3 · Gain structure ─────────────────────────────────────────────────── */

function PageGainStructure({ ctx }: { ctx: PageCtx }) {
  const [settings, setSettings] = useState<GainSettings>({ preamp: 60, fader: -20, main: -10, procIn: 0, procOut: 0, amp: 0 });
  const [stage, setStage] = useState<GainStageId>('preamp');
  const chain = computeGainChain(settings);
  const verdict = gainVerdict(chain);
  const headroomOk = chain.every((n) => n.headroomDb >= 12);
  const done = verdict === 'ok' && headroomOk;
  useOperateCredit('gain', done, ctx);
  const goals = [{ label: 'No stage clipping', hit: !chain.some((n) => n.clipped) }, { label: 'At least 12 dB headroom at every stage', hit: headroomOk }, { label: 'Verdict OK — unity through the middle', hit: verdict === 'ok' }];
  const latched = useVisitGoals(ctx, goals);
  const params: DockParam[] = [gainStageParam(settings, setSettings, stage, setStage)];
  return (
    <SoundSystemsRackLayout
      rack={{
        size: 'L',
        badge: 'GAIN CHAIN — ILLUSTRATIVE MODEL · teaching values, not a specification',
        initialParam: 'stage',
        hideDragTag: true,
        bezel: gainBezel(chain, verdict),
        stage: (w, h) => <ChainMeterStage chain={chain} settings={settings} w={w} h={h} highlight={stage} />,
        params,
      }}
      caption="The lane is the PREAMP: ride it down until its bracket shows headroom. Then tap the key, pick each later stage, return it to unity (double-tap), and attenuate the AMP so it is the last thing to clip."
      wellTop={<VerdictLine ok={verdict === 'ok'} warn={verdict === 'quiet' || verdict === 'noisy'}>{gainVerdictCopy(verdict, chain)}</VerdictLine>}
    >
      <ChapterTag n={10}>OPERATE · ESTABLISH GAIN STRUCTURE</ChapterTag>
      <Body>The opposite fault from the LEARN chapter: the preamp is cranked and every later stage is pulling it back down. The first CLIP indicator is lit at the preamp, and every meter after it carries the ↑ — the distortion is inherited.</Body>
      <Prompt>Bring the preamp down until its bracket shows headroom, return the faders and trims to unity, and attenuate the amplifier so it is the last thing to clip.</Prompt>
      <GoalChips goals={goals} latched={latched} />
      <ChainMeterKey />
      <Card>
        <Eyebrow>THE PROCEDURE</Eyebrow>
        <Body>1 · Faders at unity, main at unity, processor and amplifier at their nominal marks. 2 · Set each PREAMP so the channel peaks around −18 dBFS (about +4 dBu) on the loudest thing the source will do. 3 · Mix with the faders around unity — small moves. 4 · Set the amplifier inputs so the processor’s limiter engages before the amplifier clips. Gain-before-feedback is spent at the preamp too: every dB of gain you do not need is a dB closer to the ring.</Body>
      </Card>
      <DeeperRow>
        <LabLink route="GainLabHome" label="Gain Staging Lab" />
      </DeeperRow>
    </SoundSystemsRackLayout>
  );
}

/* ── 4 · Ring-out and soundcheck ────────────────────────────────────────── */

type WedgeState = { id: string; name: string; short: string; geometry: 'live' | 'null'; send: number; notched: boolean };

const WEDGE_LIMIT = (w: WedgeState) => (w.geometry === 'null' ? 0 : -12) + (w.notched ? 4 : 0);

function PageSoundcheck({ ctx }: { ctx: PageCtx }) {
  const [wedges, setWedges] = useState<WedgeState[]>([
    { id: 'w1', name: 'Wedge 1 · Singer', short: 'W1 SINGER', geometry: 'live', send: -18, notched: false },
    { id: 'w2', name: 'Wedge 2 · Guitar', short: 'W2 GUITAR', geometry: 'live', send: -18, notched: false },
    { id: 'w3', name: 'Wedge 3 · Bass', short: 'W3 BASS', geometry: 'null', send: -18, notched: false },
    { id: 'w4', name: 'Wedge 4 · Drums', short: 'W4 DRUMS', geometry: 'live', send: -18, notched: false },
  ]);
  const [sel, setSel] = useState('w1');
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
  const w = wedges.find((x) => x.id === sel)!;
  const limit = WEDGE_LIMIT(w);
  const ring = w.send > limit;
  const margin = limit - w.send;
  const stateOf = (x: WedgeState) => {
    const l = WEDGE_LIMIT(x);
    return x.send > l ? `RINGING — ${x.send - l} dB over` : `${l - x.send} dB of margin`;
  };
  const params: DockParam[] = [
    {
      kind: 'options',
      id: 'wedge',
      label: 'WEDGE',
      valueLabel: w.short.split(' ')[0],
      options: wedges.map((x) => ({ id: x.id, label: `${x.name} · ${fmtDb(x.send)} dB`, blurb: `${x.geometry === 'null' ? 'In the microphone’s null' : 'In the live angle'}${x.notched ? ', notched' : ''}. ${stateOf(x)}.` })),
      selectedId: sel,
      onSelect: setSel,
      sticky: true,
    },
    dbFader({ id: 'send', label: 'SEND', db: w.send, min: -30, max: 6, onChange: (db) => patch(w.id, { send: db }), home: 0, level: true, of: `to ${w.name.toLowerCase()}` }),
    {
      kind: 'options',
      id: 'position',
      label: 'POSITION',
      valueLabel: w.geometry === 'live' ? 'Live angle' : 'In the null',
      options: [
        { id: 'live', label: 'In the live angle', blurb: 'Off to the side, inside the microphone’s pickup — the loop rings 12 dB sooner in this model.' },
        { id: 'null', label: 'In the null', blurb: 'Directly behind the microphone: geometry first, before any notch.' },
      ],
      selectedId: w.geometry,
      onSelect: (id) => patch(w.id, { geometry: id as 'live' | 'null' }),
      sticky: true,
    },
    { kind: 'toggle', id: 'notch', label: 'NOTCH', value: w.notched, onToggle: () => patch(w.id, { notched: !w.notched }) },
  ];
  return (
    <SoundSystemsRackLayout
      rack={{
        size: 'M',
        badge: 'RING-OUT — ILLUSTRATIVE MODEL · placement buys 12 dB, a notch 4',
        initialParam: 'send',
        hideDragTag: true,
        bezel: wedges.map((x) => {
          const l = WEDGE_LIMIT(x);
          const r = x.send > l;
          return { k: x.short, v: `${fmtDb(x.send)}${x.send > -60 ? ' dB' : ''}${r ? ' !' : ''}`, tint: r ? colors.red : x.send >= -6 ? colors.green : levelColorForDb(x.send, -30, 6) };
        }),
        stage: (w2, h) => (
          <StageFit w={w2} h={h} aspect={354 / 168}>
            <FeedbackLoop wedge={w.geometry} ringing={ring} sendDb={w.send} />
          </StageFit>
        ),
        params,
      }}
      caption="Pick a WEDGE, then ride SEND up to what its performer will need. If it rings: POSITION into the null first, NOTCH only the frequency that rings, and only then level. Every wedge to −6 dB or louder."
      wellTop={
        <>
          <Text style={[styles.wedgeState, ring && { color: colors.red }]}>{w.name.toUpperCase()} · {ring ? `RINGING at ~2.5 kHz — ${-margin} dB over` : `${margin} dB of margin`}</Text>
          <VerdictLine ok={done} warn={!done && rang}>{done ? 'Every wedge is loud enough and none rings. Now the band can play — soundcheck order: drums, bass, guitars, keys, vocals, then all together.' : rang ? 'A wedge rang. Geometry first: move it into the null before you reach for a notch.' : 'Bring the sends up and listen for the ring.'}</VerdictLine>
        </>
      }
    >
      <ChapterTag n={13}>OPERATE · RING-OUT, THEN SOUNDCHECK</ChapterTag>
      <Body>Four wedges, each drawn with its microphone’s pattern. Three sit off to the side, inside the live angle. The ring-out comes BEFORE the band plays: bring each send up to what its performer will need, without a ring.</Body>
      <Prompt>Reposition first, notch only the frequency that rings, and only then level. Every wedge to −6 dB or louder.</Prompt>
      <GoalChips goals={goals} latched={latched} />
      <Card tone="math">
        <Eyebrow>THE FOUR WEDGES</Eyebrow>
        {wedges.map((x) => (
          <Text key={x.id} style={styles.wedgeRow}>
            {x.name} · {fmtDb(x.send)} dB · {x.geometry === 'null' ? 'in the null' : 'live angle'}{x.notched ? ' · notched' : ''} · {stateOf(x)}
          </Text>
        ))}
      </Card>
      <Card tone="note">
        <Eyebrow>ILLUSTRATIVE MODEL</Eyebrow>
        <Body>Placement buys 12 dB and a narrow notch buys 4 in this model — teaching proportions, not measurements. Real gain-before-feedback depends on the microphone, the wedge, the stage and the room, and is found with an analyser and your ears.</Body>
      </Card>
    </SoundSystemsRackLayout>
  );
}

/* ── 5 · Shutdown and documentation ─────────────────────────────────────── */

const DOCS = ['Console scene saved and named for the show', 'Processor preset saved and named for the room', 'Input patch list written (channel · source · stagebox input)', 'Output patch list written (bus · socket · destination)', 'Loudspeaker positions and delay times noted'] as const;

function PageShutdown({ ctx }: { ctx: PageCtx }) {
  const [seqDone, setSeqDone] = useState(false);
  const [docs, setDocs] = useState<Set<string>>(new Set());
  const done = seqDone && docs.size >= DOCS.length;
  useOperateCredit('shutdown', done, ctx);
  const goals = [{ label: 'Power down in the correct order', hit: seqDone }, { label: 'Document the configuration', hit: docs.size >= DOCS.length }];
  const latched = useVisitGoals(ctx, goals);
  const seq = useSequence(POWER_DOWN, () => setSeqDone(true));
  const off = new Set(seq.err ? [] : seq.order);
  const dark = RACK.filter((r) => off.has(r.step)).length;
  const docsCard = (
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
  );
  const params: DockParam[] = [
    ...seq.params,
    { kind: 'group', id: 'docs', label: 'DOCUMENT', valueLabel: `${docs.size}/${DOCS.length}`, render: () => docsCard },
  ];
  return (
    <SoundSystemsRackLayout
      rack={{
        size: 'S',
        badge: 'POWER SEQUENCE — ILLUSTRATIVE · devices go dark in the order you choose',
        initialParam: 'step',
        bezel: [
          { k: 'STEPS', v: `${seq.order.length}/${POWER_DOWN.length}`, flex: 0.9 },
          { k: 'LAST', v: seq.last ? seq.byId(seq.last).short.toUpperCase() : '—', tint: colors.cyanBright, flex: 2 },
          { k: 'ORDER', v: seq.err ? 'WRONG' : seq.complete ? 'CORRECT' : 'SO FAR OK', tint: seq.err ? colors.red : seq.complete ? colors.green : colors.amber, flex: 1.1 },
          { k: 'DARK', v: `${dark}/${RACK.length}`, flex: 0.7 },
        ],
        stage: (w, h) => <PowerRack on={off} direction="down" w={w} h={h} />,
        params,
      }}
      caption="Power-down is the mirror of power-up, for the same reason. Open STEP and tap the steps in order; then open DOCUMENT and write the show down."
      wellTop={<SequenceCard seq={seq} title="POWER DOWN" />}
    >
      <ChapterTag n={9}>OPERATE · SHUTDOWN AND DOCUMENTATION</ChapterTag>
      <Body>The system, everything on. Each device you switch off goes dark here — in the order you choose.</Body>
      <Prompt>Power-down is the mirror of power-up, for the same reason. Tap the steps in order, then write the show down.</Prompt>
      <GoalChips goals={goals} latched={latched} />
      {docsCard}
      <KeyFact>Before the console goes dark, the show is saved and the configuration is written down — so tomorrow starts from tonight. Documentation is not admin. It is what lets the next person — or you, next week — rebuild the system without re-finding every fault you found today.</KeyFact>
    </SoundSystemsRackLayout>
  );
}

export const SS_OPERATE_PAGES: SsPageDef[] = [
  { title: 'Power-up sequence', short: 'POWER UP', Component: PagePowerUp, manualDone: true, rack: true },
  { title: 'Line check', short: 'LINE CHECK', Component: PageLineCheck, manualDone: true, rack: true },
  { title: 'Establish gain structure', short: 'GAIN', Component: PageGainStructure, manualDone: true, rack: true },
  { title: 'Ring-out and soundcheck', short: 'RING-OUT', Component: PageSoundcheck, manualDone: true, rack: true },
  { title: 'Shutdown and documentation', short: 'SHUTDOWN', Component: PageShutdown, manualDone: true, rack: true },
];

const styles = StyleSheet.create({
  glyphRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end' },
  rackItem: { alignItems: 'center', gap: 2, flex: 1 },
  rackLabel: { fontFamily: fonts.oswaldMedium, fontSize: 9, letterSpacing: 0.3, color: colors.textSub },
  rackState: { fontFamily: fonts.oswaldMedium, fontSize: 9, letterSpacing: 1 },
  seqRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingVertical: 3 },
  seqN: { color: colors.amberLabel, fontFamily: fonts.mono, fontSize: 13, width: 18 },
  seqTitle: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 13 },
  seqWhy: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#101013', padding: 8, minHeight: 52 },
  lineOk: { borderColor: colors.green },
  lineBad: { borderColor: colors.red },
  lineSel: { backgroundColor: '#0f1a22' },
  lineHead: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  lineName: { color: colors.textSecondary, fontFamily: fonts.oswaldMedium, fontSize: 11.5, letterSpacing: 0.6 },
  lineRead: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16 },
  lineWhy: { color: colors.red, fontFamily: fonts.barlowMedium, fontSize: 12 },
  lineMark: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 0.8, minWidth: 60, textAlign: 'right' },
  wedgeState: { color: colors.textSub, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 0.6 },
  wedgeRow: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  docBox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1.5, borderColor: '#3a3a44', alignItems: 'center', justifyContent: 'center' },
  docBoxOn: { borderColor: colors.green, backgroundColor: 'rgba(55,224,95,.15)' },
  docCheck: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, color: colors.green, marginTop: -1 },
  docText: { flex: 1, color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18 },
});
