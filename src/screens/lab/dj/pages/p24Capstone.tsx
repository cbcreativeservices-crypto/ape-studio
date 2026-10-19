/**
 * Screen 24 — Troubleshooting and the complete system challenge (research
 * DJ30): the lab's closing EVENT.
 *
 * A small event system (two players, the mixer with a mic and a recorder on
 * REC OUT, the booth's own powered PA and monitors) is set up, cabled and
 * switched OFF. The learner powers it in the safe order, opens the doors —
 * which plants a SEEDED fault (one, sometimes two that cannot hide each
 * other: model/djCapstone; the event number replays the same faults) —
 * cues the next track privately, makes a clean transition, makes an
 * announcement that reaches BOTH the room and the recording, finds and fixes
 * the fault from the evidence on the signal-flow board, and debriefs it:
 * cause, evidence, repair, prevention.
 *
 * It ends the lab: its own check, then WHAT THIS LAB COVERS (every screen in
 * the registry, by its outline number, the optional paths marked), and
 * FINISH › the what's-left screen.
 */
import { useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Group } from '@shopify/react-native-skia';
import { colors, fonts } from '../../../../theme/tokens';
import { LabChip } from '../../LabShell';
import { UnderstandingCheck } from '../../tuning/components/check';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import { Scene } from '../art/Scene';
import { BoothStage } from '../art/BoothStage';
import { FlowBoard, flowBoxes, type FlowLink, type FlowNode } from '../art/EventFlow';
import type { Box } from '../geometry/boothGeometry';
import { DjRack } from '../DjRack';
import { Do, FaultCard, GoalChips, Look, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { decksValue, stopKey, type Transport } from '../dock';
import { PatchTray, PowerTray, type PowerEvent } from '../trays';
import { boothNow, getBooth, updateBooth } from '../booth/boothStore';
import { cueAtBar, preMatched, useScreenSetup } from '../booth/setup';
import { armTake, closeTake, writeChunk } from '../booth/takeStore';
import { load, setPlaying } from '../model/djDeck';
import { BUILT_PLUGS, POWERED, deviceLive, dbStr, speakerFeed, trimDb, trimPos, xfGainFor, type Booth, type ChannelId, type XfAssign } from '../model/djModel';
import { evOf, micGainPos, recGainDb, recGainPos, withEv, withMic, withRec } from '../model/djEvent';
import { DEBRIEF_PARTS, FAULTS, TRANSITION_FRESH, allFixed, debriefOptions, plant, scenarioFor, transitionStep, type DebriefPart, type Scenario, type TransitionState } from '../model/djCapstone';
import { DJ_COVERS, isOptionalNo } from './registry';
import { getDjRegistry } from './registryRuntime';
import { announce, EventListen, musicOn, Row, TrayNote, useEventKit, voiceIn, withFreshEvent } from './eventShared';
import { PEAK_RED } from './shared';
import type { BoothRender } from '../engine/djRender';
import { isEventRender } from '../engine/djEventRender';

const TERMS = [
  { term: 'Signal tracing', def: 'Follow the music from its source, stage by stage — input, channel, fader, mix, output, cable, speaker — and find the LAST place it is still alive. The fault is just after it.' },
  { term: 'Line check', def: 'Before the doors: every source on its channel, both sides of the PA, the booth, the headphones, the mic, and a short test recording played back.' },
  { term: 'Debrief', def: 'After a fault: what caused it, what evidence showed it, what fixed it, and what will stop it happening again.' },
] as const;

export const GOALS_EVENT = ['Power up safely: speakers last', 'Cue deck B privately', 'A clean transition: no gap, no clip', 'Announce to the room AND the recording', 'Find and fix the fault', 'Debrief: cause, evidence, repair, prevention', 'Pass the check'] as const;

const LOOK_FLOW = 'You are looking at the event’s signal-flow board: decks A and B and the mic on the left, the mixer’s channels and its mix in the middle, and the PA’s two sides, the booth, your headphones and the recorder on the right — each with its live meter.';
const LOOK_BOOTH = 'You are looking at the DJ booth from above: deck A on the left, the mixer, deck B on the right.';

/* ── the board ────────────────────────────────────────────────────────── */

const FRAME: Box = { x: -10, y: -12, w: 388, h: 246 };

function eventBoardOf(b: Booth) {
  const ev = evOf(b);
  const on = (d: Parameters<typeof deviceLive>[1]) => deviceLive(b, d);
  const fedL = speakerFeed(b, 'paL');
  const fedR = speakerFeed(b, 'paR');
  const cabledL = b.plugs['mst.xlrL'] === 'paL.in';
  const cabledR = b.plugs['mst.xlrR'] === 'paR.in';
  const xf2 = xfGainFor(b.ch[2].xf, b.mixer.xf, b.mixer.xfCurve);
  const nodes: FlowNode[] = [
    { id: 'A', x: 4, y: 4, w: 92, h: 38, title: 'DECK A', sub: !on('playerA') ? 'OFF' : !b.decks.A.track ? 'NO TRACK' : b.decks.A.playing ? 'PLAYING' : 'CUED', icon: 'player', state: on('playerA') ? (b.decks.A.playing ? 'live' : 'idle') : 'idle' },
    { id: 'B', x: 4, y: 50, w: 92, h: 38, title: 'DECK B', sub: !on('playerB') ? 'OFF' : ev.mediaFail ? 'FILE ERROR' : !b.decks.B.track ? 'NO TRACK' : b.decks.B.playing ? 'PLAYING' : 'CUED', icon: 'player', state: ev.mediaFail ? 'cut' : on('playerB') ? (b.decks.B.playing ? 'live' : 'idle') : 'idle' },
    { id: 'mic', x: 4, y: 100, w: 92, h: 34, title: 'MIC', sub: ev.mic.on ? 'ON' : 'OFF', icon: 'mic' },
    { id: 'c1', x: 122, y: 4, w: 86, h: 40, title: 'CH 1', sub: `${b.ch[1].input} · ${dbStr(trimDb(b.ch[1].trim), 0)}`, tap: 'ch1' },
    { id: 'c2', x: 122, y: 50, w: 86, h: 40, title: 'CH 2', sub: `${b.ch[2].input} · X-F ${b.ch[2].xf}`, tap: 'ch2' },
    { id: 'mc', x: 122, y: 100, w: 86, h: 34, title: 'MIC CH', sub: `TO REC ${ev.mic.toRec ? 'ON' : 'OFF'}`, extTap: 'mic' },
    { id: 'mix', x: 226, y: 30, w: 44, h: 78, title: 'MIX', icon: 'mixer', tap: 'bus' },
    { id: 'paL', x: 288, y: 0, w: 92, h: 30, title: 'PA L', icon: 'speaker', tap: fedL ? 'masterL' : undefined, state: !cabledL ? 'cut' : ev.paLWall && !ev.paLIsolator && on('paL') ? 'hum' : undefined },
    { id: 'paR', x: 288, y: 34, w: 92, h: 30, title: 'PA R', icon: 'speaker', tap: fedR ? 'masterR' : undefined, state: !cabledR ? 'cut' : undefined },
    { id: 'bth', x: 288, y: 68, w: 92, h: 30, title: 'BOOTH', icon: 'monitor', tap: 'booth' },
    { id: 'ph', x: 288, y: 102, w: 92, h: 30, title: 'PHONES', icon: 'phones', tap: 'phonesL' },
    { id: 'rec', x: 288, y: 140, w: 92, h: 36, title: 'RECORDER', sub: ev.rec.armedAt != null ? 'RECORDING' : 'STOPPED', icon: 'recorder', extTap: 'recL' },
    { id: 'strip', x: 122, y: 196, w: 112, h: 32, title: 'BOOTH STRIP', icon: 'strip' },
    ...(ev.paLWall ? [{ id: 'wall', x: 288, y: 196, w: 92, h: 32, title: 'WALL', sub: 'OTHER CIRCUIT', icon: 'wall' as const }] : []),
  ];
  const live = (x: boolean) => (x ? 'live' : 'idle') as 'live' | 'idle';
  const links: FlowLink[] = [
    { from: 'A', to: 'c1', state: live(b.decks.A.playing && on('playerA')), label: 'LINE' },
    { from: 'B', to: 'c2', state: live(b.decks.B.playing && on('playerB') && b.ch[2].input === 'LINE'), label: 'LINE' },
    { from: 'mic', to: 'mc', state: live(ev.mic.on) },
    { from: 'c1', to: 'mix', state: live(b.ch[1].fader > 0.05 && b.decks.A.playing) },
    { from: 'c2', to: 'mix', state: live(b.ch[2].fader > 0.05 && b.decks.B.playing && xf2 > 0.05) },
    { from: 'mc', to: 'mix', state: live(ev.mic.on) },
    { from: 'mix', to: 'paL', state: !cabledL ? 'cut' : fedL ? (ev.paLWall && !ev.paLIsolator ? 'hum' : 'live') : 'idle' },
    { from: 'mix', to: 'paR', state: !cabledR ? 'cut' : fedR ? 'live' : 'idle' },
    { from: 'mix', to: 'bth', state: live(on('mixer') && on('boothL')) },
    { from: 'mix', to: 'ph', state: live(on('mixer')) },
    { from: 'mix', to: 'rec', state: ev.rec.tap === 'REC_OUT' && on('mixer') ? 'live' : 'idle' },
  ];
  return { nodes, links };
}

/* ── the trays ───────────────────────────────────────────────────────── */

function MixerTray() {
  const b = getBooth();
  const setCh = (ch: ChannelId, patch: Partial<Booth['ch'][ChannelId]>) => updateBooth((x) => ({ ...x, ch: { ...x.ch, [ch]: { ...x.ch[ch], ...patch } } }));
  const trim = (ch: ChannelId, d: number) => updateBooth((x) => ({ ...x, ch: { ...x.ch, [ch]: { ...x.ch[ch], trim: trimPos(Math.round(trimDb(x.ch[ch].trim)) + d) } } }));
  const lvl = (k: 'master' | 'booth' | 'phones', d: number) => updateBooth((x) => ({ ...x, mixer: { ...x.mixer, [k]: Math.max(0, Math.min(1, Math.round((x.mixer[k] + d) * 20) / 20)) } }));
  return (
    <View style={styles.tray}>
      {([1, 2] as const).map((ch) => (
        <Row key={ch} head={`CH ${ch} · INPUT ${b.ch[ch].input} · TRIM ${dbStr(trimDb(b.ch[ch].trim), 0)} · X-FADER ${b.ch[ch].xf}`}>
          {(['LINE', 'PHONO'] as const).map((i) => (
            <LabChip key={i} label={i} selected={b.ch[ch].input === i} onPress={() => setCh(ch, { input: i })} compact />
          ))}
          <LabChip label="TRIM −" selected={false} onPress={() => trim(ch, -2)} compact />
          <LabChip label="TRIM +" selected={false} onPress={() => trim(ch, 2)} compact />
          {(['A', 'THRU', 'B'] as XfAssign[]).map((a) => (
            <LabChip key={a} label={`X-F ${a}`} selected={b.ch[ch].xf === a} onPress={() => setCh(ch, { xf: a })} compact />
          ))}
          <LabChip label={b.ch[ch].cue ? `CUE ${ch} ●` : `CUE ${ch}`} selected={b.ch[ch].cue} onPress={() => setCh(ch, { cue: !b.ch[ch].cue })} compact />
        </Row>
      ))}
      <Row head={`CROSSFADER ${b.mixer.xf < 0.02 ? 'FULL A' : b.mixer.xf > 0.98 ? 'FULL B' : 'CENTRE'}`}>
        <LabChip label="FULL A" selected={b.mixer.xf < 0.02} onPress={() => updateBooth((x) => ({ ...x, mixer: { ...x.mixer, xf: 0 } }))} compact />
        <LabChip label="CENTRE" selected={Math.abs(b.mixer.xf - 0.5) < 0.02} onPress={() => updateBooth((x) => ({ ...x, mixer: { ...x.mixer, xf: 0.5 } }))} compact />
        <LabChip label="FULL B" selected={b.mixer.xf > 0.98} onPress={() => updateBooth((x) => ({ ...x, mixer: { ...x.mixer, xf: 1 } }))} compact />
      </Row>
      <Row head={`HEADPHONES · BLEND ${b.mixer.cueMix < 0.1 ? 'CUE' : b.mixer.cueMix > 0.9 ? 'MASTER' : 'MID'} · LEVEL ${Math.round(b.mixer.phones * 100)}%`}>
        <LabChip label="BLEND CUE" selected={b.mixer.cueMix < 0.1} onPress={() => updateBooth((x) => ({ ...x, mixer: { ...x.mixer, cueMix: 0 } }))} compact />
        <LabChip label="BLEND MID" selected={Math.abs(b.mixer.cueMix - 0.5) < 0.1} onPress={() => updateBooth((x) => ({ ...x, mixer: { ...x.mixer, cueMix: 0.5 } }))} compact />
        <LabChip label="BLEND MASTER" selected={b.mixer.cueMix > 0.9} onPress={() => updateBooth((x) => ({ ...x, mixer: { ...x.mixer, cueMix: 1 } }))} compact />
        <LabChip label="PHONES −" selected={false} onPress={() => lvl('phones', -0.05)} compact />
        <LabChip label="PHONES +" selected={false} onPress={() => lvl('phones', 0.05)} compact />
      </Row>
      <Row head={`MASTER ${Math.round(b.mixer.master * 100)}% · BOOTH ${Math.round(b.mixer.booth * 100)}%`}>
        <LabChip label="MASTER −" selected={false} onPress={() => lvl('master', -0.05)} compact />
        <LabChip label="MASTER +" selected={false} onPress={() => lvl('master', 0.05)} compact />
        <LabChip label="BOOTH −" selected={false} onPress={() => lvl('booth', -0.05)} compact />
        <LabChip label="BOOTH +" selected={false} onPress={() => lvl('booth', 0.05)} compact />
      </Row>
    </View>
  );
}

function DecksTray({ tr }: { tr: Transport }) {
  const b = getBooth();
  const ev = evOf(b);
  const [again, setAgain] = useState(false);
  return (
    <View style={styles.tray}>
      <Row head="THE DECKS">
        {(['A', 'B'] as const).map((d) => (
          <LabChip key={d} label={`${b.decks[d].playing ? '❚❚ PAUSE' : '▶ PLAY'} ${d}`} selected={b.decks[d].playing} onPress={() => tr.toggle(d)} compact />
        ))}
        {tr.soundDeclined ? <LabChip label="TURN SOUND ON" selected={false} onPress={tr.soundOn} compact /> : null}
      </Row>
      {ev.mediaFail || !b.decks.B.track ? (
        <Row head="DECK B · THE NEXT TRACK">
          <LabChip label="LOAD THE SAME FILE AGAIN" selected={false} onPress={() => setAgain(true)} compact />
          <LabChip
            label="LOAD FROM THE BACKUP STICK"
            selected={false}
            onPress={() =>
              updateBooth((x, t) => {
                const y = withEv(load(x, t, 'B', 'glassHarbour'), (e) => ({ ...e, mediaFail: false }));
                return preMatched(cueAtBar(y, 'B', 'glassHarbour', 1));
              })
            }
            compact
          />
        </Row>
      ) : null}
      {ev.mediaFail ? <TrayNote tone="warn">{again ? 'Still FILE ERROR — that copy is damaged. Loading it again will not help.' : 'FILE ERROR — this copy of the file will not load.'}</TrayNote> : null}
      <EventListen />
    </View>
  );
}

function EventTray({ lead, onPower, lastPower, view, setView, onNew, onReplay, seed }: { lead: () => number; onPower: (e: PowerEvent) => void; lastPower: PowerEvent | null; view: 'FLOW' | 'BOOTH'; setView: (v: 'FLOW' | 'BOOTH') => void; onNew: () => void; onReplay: () => void; seed: number }) {
  const b = getBooth();
  const ev = evOf(b);
  const armed = ev.rec.armedAt != null;
  return (
    <View style={styles.tray}>
      <Text style={styles.sub}>POWER (speakers last on, first off)</Text>
      <PowerTray onEvent={onPower} lastEvent={lastPower} />
      <Row head="SEE">
        <LabChip label="SIGNAL FLOW" selected={view === 'FLOW'} onPress={() => setView('FLOW')} compact />
        <LabChip label="THE BOOTH" selected={view === 'BOOTH'} onPress={() => setView('BOOTH')} compact />
      </Row>
      <Row head="THE MIC AND THE RECORDER">
        <LabChip label={ev.mic.on ? 'MIC ON ●' : 'MIC OFF'} selected={ev.mic.on} onPress={() => updateBooth((x) => withMic(x, { on: !evOf(x).mic.on }))} compact />
        <LabChip label="● TALK NOW" selected={false} onPress={() => (musicOn(getBooth()) ? announce(lead()) : undefined)} compact />
        <LabChip label={ev.mic.toRec ? 'MIC → REC ON' : 'MIC → REC OFF'} selected={ev.mic.toRec} onPress={() => updateBooth((x) => withMic(x, { toRec: !evOf(x).mic.toRec }))} compact />
        <LabChip
          label={armed ? '■ STOP RECORDING' : '● RECORD'}
          selected={armed}
          onPress={() => {
            const t = boothNow();
            if (armed) {
              closeTake(t);
              updateBooth((x) => withRec(x, { armedAt: null }));
            } else {
              armTake(t);
              updateBooth((x) => withRec(x, { armedAt: t }));
            }
          }}
          compact
        />
        <LabChip label={`REC GAIN − (${recGainDb(ev.rec.gain).toFixed(0)} dB)`} selected={false} onPress={() => updateBooth((x) => withRec(x, { gain: recGainPos(recGainDb(evOf(x).rec.gain) - 3) }))} compact />
        <LabChip label="REC GAIN +" selected={false} onPress={() => updateBooth((x) => withRec(x, { gain: recGainPos(recGainDb(evOf(x).rec.gain) + 3) }))} compact />
      </Row>
      <Row head="PA L’S POWER CORD">
        <LabChip label={ev.paLWall ? 'IN A WALL SOCKET (OTHER CIRCUIT)' : 'IN THE BOOTH STRIP'} selected={false} onPress={() => updateBooth((x) => withEv(x, (e) => ({ ...e, paLWall: !e.paLWall })))} compact />
        <LabChip label={ev.paLIsolator ? 'ISOLATION TRANSFORMER IN MST L' : 'NO ISOLATION TRANSFORMER'} selected={ev.paLIsolator} onPress={() => updateBooth((x) => withEv(x, (e) => ({ ...e, paLIsolator: !e.paLIsolator })))} compact />
      </Row>
      <Text style={styles.sub}>OUTPUT CABLES (turn the MASTER down before you move one)</Text>
      <PatchTray plugs={['mst.xlrL', 'mst.xlrR', 'bth.trsL', 'bth.trsR']} />
      <Row head={`THIS IS EVENT #${seed}`}>
        <LabChip label="REPLAY THIS EVENT" selected={false} onPress={onReplay} compact />
        <LabChip label="A NEW EVENT" selected={false} onPress={onNew} compact />
      </Row>
    </View>
  );
}

/* ── the debrief ─────────────────────────────────────────────────────── */

const PART_HEAD: Record<DebriefPart, string> = { cause: 'THE CAUSE', evidence: 'THE EVIDENCE', repair: 'THE REPAIR', prevention: 'PREVENTION' };

function Debrief({ scenario, onDone }: { scenario: Scenario; onDone: () => void }) {
  const fault = scenario.faults[0];
  const qs = useMemo(() => DEBRIEF_PARTS.map((p) => ({ part: p, ...debriefOptions(fault, p, scenario.seed) })), [fault, scenario.seed]);
  const order = useMemo(() => qs.map((q) => q.options.map((_, i) => i).sort((a, b) => ((a * 7919 + scenario.seed) % 13) - ((b * 7919 + scenario.seed) % 13))), [qs, scenario.seed]);
  const [picked, setPicked] = useState<Record<DebriefPart, number | null>>({ cause: null, evidence: null, repair: null, prevention: null });
  const fired = useRef(false);
  const allRight = qs.every((q) => picked[q.part] === q.correct);
  if (allRight && !fired.current) {
    fired.current = true;
    onDone();
  }
  return (
    <View style={styles.debrief}>
      <Text style={styles.debriefHead}>DEBRIEF · THE EVENT’S FAULT</Text>
      {qs.map((q, qi) => (
        <View key={q.part} style={styles.tray}>
          <Text style={styles.sub}>{PART_HEAD[q.part]}</Text>
          {order[qi].map((oi) => (
            <LabChip key={oi} label={`${picked[q.part] === oi ? (oi === q.correct ? '✓ ' : '✗ ') : ''}${q.options[oi]}`} selected={picked[q.part] === oi} onPress={() => setPicked((p) => ({ ...p, [q.part]: oi }))} />
          ))}
          {picked[q.part] != null && picked[q.part] !== q.correct ? (
            <Text style={styles.warn}>{q.options[picked[q.part]!].startsWith('Lift the mains earth') ? 'Never: the mains earth is the safety, not the hum’s cure.' : 'That belongs to a different fault. Look at what the board showed for this one.'}</Text>
          ) : null}
        </View>
      ))}
      {scenario.faults.length > 1 ? <Text style={styles.note}>{`This event had a second fault too: ${FAULTS[scenario.faults[1]].cause}`}</Text> : null}
    </View>
  );
}

/* ── what the lab covers (from the registry) ──────────────────────────── */

function Covers({ ctx }: { ctx: PageCtx }) {
  const { pages, numbers } = getDjRegistry();
  const me = pages.length - 1;
  return (
    <View style={styles.summary}>
      <Text style={styles.sumHead}>WHAT THIS LAB COVERS</Text>
      <Text style={styles.sumFoot}>✓ marks a screen you have done; • one still to do. Optional equipment paths are marked — the lab is complete without them.</Text>
      {pages.map((p, i) => {
        const n = numbers[i];
        const line = DJ_COVERS[n] ?? p.title;
        const done = i === me ? ctx.isDone || !!ctx.isPageDone?.(i) : !!ctx.isPageDone?.(i);
        const opt = isOptionalNo(n);
        return (
          <Text key={`${n}-${p.short}`} style={[styles.sumItem, done && { color: colors.textPrimary }]} accessibilityLabel={`Screen ${n}${opt ? ', optional' : ''}: ${line} ${done ? 'Done.' : 'Not done yet.'}`}>
            {`${done ? '✓' : '•'}  ${n}. ${line}${opt ? ' (optional)' : ''}`}
          </Text>
        );
      })}
      <Text style={styles.sumFoot}>FINISH › shows what is left in this lab, screen by screen. Every screen can be done again for practice — credit you have earned stays.</Text>
    </View>
  );
}

/* ── the page ────────────────────────────────────────────────────────── */

const prepared = (b: Booth): Booth => {
  let x = cueAtBar(b, 'A', 'nightFerry', 17);
  x = cueAtBar(x, 'B', 'glassHarbour', 1);
  x = preMatched(x);
  const power = { ...x.power };
  for (const d of POWERED) power[d] = false;
  x = { ...x, plugs: { ...BUILT_PLUGS }, power, ch: { 1: { ...x.ch[1], input: 'LINE', trim: 0.5, fader: 0.85, xf: 'THRU', cue: false }, 2: { ...x.ch[2], input: 'LINE', trim: trimPos(-5), fader: 0, xf: 'THRU', cue: false } }, mixer: { ...x.mixer, master: 0.6, booth: 0.4, phones: 0.45, xf: 0.5, cueMix: 0, splitCue: false }, perspective: 'CROWD' };
  return withFreshEvent(x, (ev) => ({ ...ev, mic: { ...ev.mic, device: 'DYNAMIC', input: 'MIC1', on: false, gain1: micGainPos(44), toRec: true, talkover: true }, rec: { tap: 'REC_OUT', gain: recGainPos(0), armedAt: null } }));
};

function PageEvent({ ctx }: { ctx: PageCtx }) {
  const onChunk = useMemo(() => (r: BoothRender) => (isEventRender(r) ? writeChunk(r) : undefined), []);
  const { booth, audio, tr, motion, last } = useEventKit({ lockPhase: true, onChunk });
  useScreenSetup(prepared, false);
  const [seed, setSeed] = useState(() => 1 + Math.floor(Math.random() * 9999));
  const scenario = useMemo(() => scenarioFor(seed), [seed]);
  const [doorsOpen, setDoorsOpen] = useState(false);
  const [view, setView] = useState<'FLOW' | 'BOOTH'>('FLOW');
  const [lastPower, setLastPower] = useState<PowerEvent | null>(null);
  const [check, setCheck] = useState(false);
  const [debriefed, setDebriefed] = useState(false);
  const thumped = useRef(false);
  const cued = useRef(false);
  const trans = useRef<TransitionState>(TRANSITION_FRESH);
  const ev = evOf(booth);
  const allOn = POWERED.every((d) => deviceLive(booth, d));
  // private cue: deck B playing, CUE 2, fader down, the headphones carrying it
  if (doorsOpen && booth.decks.B.playing && booth.ch[2].cue && booth.ch[2].fader <= 0.05 && !!last && last.rmsDb.cue > -55 && Math.max(last.rmsDb.phonesL, last.rmsDb.phonesR) > -60 && booth.mixer.cueMix < 0.5) cued.current = true;
  if (doorsOpen && last) {
    let mn = 0;
    for (const v of last.meter.crowd) if (v < mn) mn = v;
    trans.current = transitionStep(trans.current, booth, { crowdMinDb: mn, clipped: last.clipped.bus + last.clipped.master + last.clipped.ch1 + last.clipped.ch2 > 0 });
  }
  const fixedAll = doorsOpen && allFixed(booth, scenario);
  const hits = [
    allOn && !thumped.current,
    cued.current,
    trans.current.done && !trans.current.failed,
    doorsOpen && ev.rec.armedAt != null && voiceIn(last, 'crowd') && voiceIn(last, 'rec'),
    fixedAll,
    debriefed,
    check,
  ];
  const goals = GOALS_EVENT.map((label, i) => ({ label, hit: hits[i] }));
  const latched = useVisitGoals(ctx, goals, 'EVENT');
  const board = eventBoardOf(booth);
  const restart = (s: number) => {
    setSeed(s);
    setDoorsOpen(false);
    thumped.current = false;
    cued.current = false;
    trans.current = TRANSITION_FRESH;
    setDebriefed(false);
    audio.stop();
    updateBooth((b) => prepared(b));
  };
  const onPower = (e: PowerEvent) => {
    if (e.thump) thumped.current = true;
    setLastPower(e);
  };
  const silentRoom = doorsOpen && musicOn(booth) && !!last && last.rmsDb.crowd < -50;

  return (
    <DjRack
      spec={{
        render: (w, h) =>
          view === 'FLOW' ? (
            <Scene w={w} h={h} frame={FRAME} motion={motion} a11y={`${LOOK_FLOW} ${allOn ? 'Everything is switched on.' : 'Some of the system is still off.'}`} obstacles={flowBoxes(board.nodes)}>
              <FlowBoard nodes={board.nodes} links={board.links} />
            </Scene>
          ) : (
            <BoothStage w={w} h={h} booth={booth} motion={motion} spec={{ view: 'booth', a11y: LOOK_BOOTH, highlight: { mixer: ['fader1', 'fader2', 'cue1', 'cue2'] } }} />
          ),
        bezel: [
          { k: 'EVENT', v: `#${seed}`, sub: doorsOpen ? 'DOORS OPEN' : 'SETTING UP', tint: colors.amber },
          { k: 'POWER', v: `${POWERED.filter((d) => deviceLive(booth, d)).length}/7`, tint: allOn ? colors.green : colors.amber },
          { k: 'THE ROOM', v: !last ? '—' : last.rmsDb.crowd < -50 ? 'SILENT' : last.clipped.master + last.clipped.bus > 0 ? 'CLIPPING' : ev.paLWall && !ev.paLIsolator ? 'HUM' : 'MUSIC', tint: !last ? colors.textSub : last.rmsDb.crowd < -50 || last.clipped.master + last.clipped.bus > 0 ? PEAK_RED : colors.green },
          { k: 'ON AIR', v: decksValue(booth), tint: colors.amber },
        ],
        params: [
          {
            kind: 'fader',
            id: 'fader',
            label: 'FADER',
            value: booth.ch[2].fader,
            level: true,
            onChange: (v) => updateBooth((b) => ({ ...b, ch: { ...b.ch, 2: { ...b.ch[2], fader: v } } })),
            format: (v) => `CH 2 FADER ${Math.round(v * 100)}%`,
            formatShort: (v) => `2·${Math.round(v * 100)}%`,
            nudges: [
              { label: 'CH 1 ↓', onPress: () => updateBooth((b) => ({ ...b, ch: { ...b.ch, 1: { ...b.ch[1], fader: Math.max(0, Math.round((b.ch[1].fader - 0.1) * 20) / 20) } } })), a11y: 'Channel 1 fader down a step' },
              { label: 'CH 1 ↑', onPress: () => updateBooth((b) => ({ ...b, ch: { ...b.ch, 1: { ...b.ch[1], fader: Math.min(1, Math.round((b.ch[1].fader + 0.1) * 20) / 20) } } })), a11y: 'Channel 1 fader up a step' },
            ],
          },
          { kind: 'group', id: 'mixer', label: 'MIXER', valueLabel: booth.ch[2].input, valueA11y: `channel 1 input ${booth.ch[1].input}, channel 2 input ${booth.ch[2].input}`, render: () => <MixerTray /> },
          { kind: 'group', id: 'decks', label: 'DECKS', valueLabel: decksValue(booth), render: () => <DecksTray tr={tr} /> },
          { kind: 'group', id: 'event', label: 'EVENT', valueLabel: doorsOpen ? 'LIVE' : 'SET UP', render: () => <EventTray lead={audio.leadSec} onPower={onPower} lastPower={lastPower} view={view} setView={setView} onNew={() => restart(1 + Math.floor(Math.random() * 9999))} onReplay={() => restart(seed)} seed={seed} /> },
          stopKey(tr),
        ],
        initialParam: 'fader',
      }}
    >
      <Step n={1}>
        <Look>{view === 'FLOW' ? LOOK_FLOW : LOOK_BOOTH}</Look>
        <P>This is the whole job in one event. Everything is cabled and switched off; when the doors open, something will be wrong — find it from the evidence, not by guessing.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Open EVENT → POWER and switch the system on in the safe order: the decks and the mixer first, the speakers LAST. Start RECORD. Then open the doors (below).</Do>
        <P>Then run the show: play deck A to the room; cue deck B in your headphones with its fader down; bring B in and A out with the FADER (and CH 1 ↓) — no gap, no clip; switch the mic on and make an announcement the room AND the recorder carry.</P>
        {silentRoom ? <Note tone="try">The room is silent while music plays: trace it on the board — source, channel, mix, output — and find the last live meter.</Note> : null}
      </Step>
      <Step n={3}>
        <P>The board is the method: every card’s meter is a tap of the real signal. A dark card after a live one is where to look. The tempos are matched for you — the lesson here is the system.</P>
        <Note tone="safety">Real faults at real events: turn the MASTER down before you touch an output cable, never remove a mains earth, and keep your ears protected while you troubleshoot.</Note>
      </Step>
      <Step n={4}>
        <Do>Power up safely, cue privately, make a clean transition, announce to the room and the recording, fix the event’s fault, and debrief it.</Do>
        <GoalChips goals={goals.slice(0, 4)} latched={latched.slice(0, 4)} />
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow="CHECK YOURSELF"
          question="Mid-set the room goes silent. The MASTER meters still move and the booth monitors still play. Where do you look first?"
          options={['After the mixer: the MASTER cables, the PA’s power and its input', 'The channel’s input selector', 'The headphone blend', 'The trim of the deck that is playing']}
          correct={0}
          explain="The MASTER meters and the booth prove the music reaches the mixer’s outputs. The loss is downstream of the last live meter: the MASTER cables, the PA’s power, its input setting or its level."
          wrong={[undefined, 'A wrong selector would silence the channel meter too — and the booth.', 'The headphones are a separate bus; they cannot silence the room.', 'A trim changes the channel’s level; the MASTER meters show the music is there.']}
          onCorrect={() => setCheck(true)}
        />
        <FaultCard
          title={`EVENT #${seed} · THE DOORS ARE OPEN`}
          symptom={FAULTS[scenario.faults[0]].symptom}
          start={() => {
            setDoorsOpen(true);
            updateBooth((b) => plant(b, scenario));
          }}
          fixed={fixedAll}
          hints={['Trace it on the board: from the source, card by card, to the room. Where is the last live meter?', FAULTS[scenario.faults[0]].evidence, FAULTS[scenario.faults[0]].repair]}
          why={`${FAULTS[scenario.faults[0]].cause}${scenario.faults.length > 1 ? ` And a second fault: ${FAULTS[scenario.faults[1]].cause}` : ''}`}
        />
        {fixedAll ? <Debrief scenario={scenario} onDone={() => setDebriefed(true)} /> : null}
        <GoalChips goals={goals.slice(4)} latched={latched.slice(4)} />
      </Step>
      <Covers ctx={ctx} />
    </DjRack>
  );
}

const styles = StyleSheet.create({
  tray: { gap: 8 },
  sub: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.2, marginTop: 4 },
  note: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18 },
  warn: { color: '#ff8a7e', fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18 },
  debrief: { borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,198,77,0.45)', backgroundColor: 'rgba(255,198,77,0.05)', padding: 12, gap: 10 },
  debriefHead: { color: colors.amber, fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.3 },
  summary: { borderRadius: 12, borderWidth: 1, borderColor: 'rgba(91,255,133,0.4)', backgroundColor: '#0d1a12', padding: 12, gap: 6 },
  sumHead: { color: colors.green, fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.4 },
  sumItem: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20 },
  sumFoot: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, marginTop: 4 },
});

export const P24: PageDef = { title: 'Troubleshooting and the complete system challenge', short: 'EVENT', Component: PageEvent, manualDone: true, rack: true };
