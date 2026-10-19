/**
 * Screen 24 — Troubleshooting and the complete system challenge (research
 * DJ30): the lab's closing EVENT.
 *
 * A small event system (two players, the mixer with a mic and a recorder on
 * REC OUT, the booth's own powered PA and monitors) is set up, cabled and
 * switched OFF. The learner powers it in the safe order, OPENS THE DOORS —
 * which plants a SEEDED fault (one, sometimes two that cannot hide each
 * other: model/djCapstone; the event number replays the same faults) —
 * cues the next track privately, makes a clean transition, makes an
 * announcement that reaches BOTH the room and the recording, finds and fixes
 * each fault from the evidence on the signal-flow board, and debriefs EACH
 * one: cause, evidence, repair, prevention.
 *
 * Second reviews 2026-10-18: nothing latches before the screen's own setup
 * (the power goal also needs a power event this visit, and re-arms once
 * everything is OFF again); OPEN THE DOORS is reachable from Step 2 and the
 * EVENT tray; a failed transition says why and stays failed until re-armed;
 * every planted fault has its own symptom, hint ladder (a question and a
 * place to look, never the answer) and debrief, whose wrong options fit the
 * same symptom; the board's power cords are one line each, in their own
 * lanes, with the wall socket's cord drawn in.
 *
 * It ends the lab: its own check, then WHAT THIS LAB COVERS (every screen in
 * the registry, by its outline number, the optional paths marked), and
 * FINISH › the what's-left screen.
 */
import { useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { LabChip } from '../../LabShell';
import { UnderstandingCheck } from '../../tuning/components/check';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import { Group } from '@shopify/react-native-skia';
import { Scene } from '../art/Scene';
import { INK } from '../art/ink';
import { SceneText, useLabelMm } from '../art/sceneText';
import { BoothStage } from '../art/BoothStage';
import { B24, board24Cords } from '../art/eventBoardGeometry';
import { Cords, FlowBoard, flowBoxes, type Cord, type FlowLink, type FlowNode } from '../art/EventFlow';
import type { TileArt } from '../art/eventTiles';
import { BOOTH_LAYOUT, MIXER_W, type Box } from '../geometry/boothGeometry';
import { DjRack } from '../DjRack';
import { Do, FaultCard, GoalChips, Look, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { decksValue, stopKey, type Transport } from '../dock';
import { PatchTray, PowerTray, type PowerEvent } from '../trays';
import { boothNow, getBooth, updateBooth } from '../booth/boothStore';
import { cueAtBar, preMatched, useScreenSetup } from '../booth/setup';
import { armTake, closeTake, writeChunk } from '../booth/takeStore';
import { load } from '../model/djDeck';
import { BUILT_PLUGS, POWERED, deviceLive, dbStr, speakerFeed, trimDb, trimPos, xfGainFor, type Booth, type ChannelId, type DeviceId, type XfAssign } from '../model/djModel';
import { evOf, micGainPos, recGainDb, recGainPos, withEv, withMic, withRec } from '../model/djEvent';
import { DEBRIEF_PARTS, FAULTS, TRANSITION_FRESH, allFixed, debriefOptions, hintsFor, plant, scenarioFor, transitionStep, type DebriefPart, type FaultId, type Scenario, type TransitionState } from '../model/djCapstone';
import { DJ_COVERS, isOptionalNo } from './registry';
import { getDjRegistry } from './registryRuntime';
import { announce, EventListen, musicOn, Row, TrayNote, useEventKit, voiceIn, withFreshEvent } from './eventShared';
import { PEAK_RED } from './shared';
import type { BoothRender } from '../engine/djRender';
import { isEventRender, type EventRender } from '../engine/djEventRender';

const TERMS = [
  { term: 'Signal tracing', def: 'Follow the music from its source, stage by stage — input, channel, fader, mix, output, cable, speaker — and find the LAST place it is still alive. The fault is just after it.' },
  { term: 'Line check', def: 'Before the doors: every source on its channel, both sides of the PA, the booth, the headphones, the mic, and a short test recording played back.' },
  { term: 'Debrief', def: 'After a fault: what caused it, what evidence showed it, what fixed it, and what will stop it happening again.' },
] as const;

export const GOALS_EVENT = ['Power up safely: speakers last', 'Cue deck B privately', 'A clean transition: no gap, no clip', 'Announce to the room AND the recording', 'Find and fix the fault', 'Debrief: cause, evidence, repair, prevention', 'Pass the check'] as const;

const LOOK_FLOW = 'You are looking at the event’s signal-flow board: the mic and the two players on the left, the mixer’s strips and master section in the middle, the headphones, recorder, PA and booth monitors on the right — each with its live meter — and every power cord, each named under its outlet on the strip below.';
const LOOK_BOOTH = 'You are looking at the DJ booth from above: the mixer, with the inner halves of deck A (left) and deck B (right).';

/* ── the board (board units, about a millimetre) ──────────────────────── */

/** The booth view, cropped to the mixer and the decks' inner halves, so it
 *  fills the glass with no empty band (visual review 2026-10-18 #27). */
const BOOTH_VIEW: Box = { x: BOOTH_LAYOUT.mixer.x - 172, y: -14, w: MIXER_W + 344, h: 438 };

const { FRAME, STRIP, OUT, SPARE, WALL_AT, OUT_X, OUT_W, ROW } = B24;
const mid = (r: { y: number; h: number }) => r.y + r.h / 2;

function eventBoardOf(b: Booth, last: EventRender | null) {
  const ev = evOf(b);
  const on = (d: DeviceId) => deviceLive(b, d);
  const fedL = speakerFeed(b, 'paL');
  const fedR = speakerFeed(b, 'paR');
  const cabledL = b.plugs['mst.xlrL'] === 'paL.in';
  const cabledR = b.plugs['mst.xlrR'] === 'paR.in';
  const xf2 = xfGainFor(b.ch[2].xf, b.mixer.xf, b.mixer.xfCurve);
  const humL = ev.paLWall && !ev.paLIsolator && on('paL');
  const paRClip = !!ev.paRMic && on('paR') && fedR && (last?.ext.clipped.paR ?? 0) > 0;
  const recClip = (last?.ext.clipped.rec ?? 0) > 0;
  const spk = (d: DeviceId, cut: boolean) => (!on(d) ? 'OFF' : cut ? 'NO CABLE' : undefined);
  const deckArt = (d: 'A' | 'B', dev: DeviceId): TileArt => ({ kind: 'player', screen: !on(dev) ? 'off' : d === 'B' && ev.mediaFail ? 'error' : !b.decks[d].track ? 'empty' : b.decks[d].playing ? 'playing' : 'cued', stick: !!b.decks[d].track || (d === 'B' && ev.mediaFail) });
  const chArt = (ch: ChannelId): TileArt => ({ kind: 'channel', input: b.ch[ch].input, trim: b.ch[ch].trim, eq: b.ch[ch].eq, fader: b.ch[ch].fader, cue: b.ch[ch].cue, xf: b.ch[ch].xf });
  const chDetail = (ch: ChannelId): string[] => [`FADER ${Math.round(b.ch[ch].fader * 100)}%`, `CUE ${b.ch[ch].cue ? 'ON' : 'OFF'}`, `X-F ${b.ch[ch].xf}`];
  const nodes: FlowNode[] = [
    { id: 'mic', x: 0, y: 0, w: 100, h: 64, title: 'MIC', sub: ev.mic.on ? 'ON' : 'OFF', art: { kind: 'mic', on: ev.mic.on }, detail: ['DYNAMIC', 'IN MIC 1'] },
    { id: 'A', x: 0, y: 74, w: 100, h: 100, title: 'DECK A', sub: !on('playerA') ? 'OFF' : !b.decks.A.track ? 'NO TRACK' : b.decks.A.playing ? 'PLAYING' : 'CUED', art: deckArt('A', 'playerA'), state: on('playerA') && b.decks.A.playing ? 'live' : 'idle', reserve: ['PLAYING'], detail: ['TO CH 1 LINE'] },
    { id: 'B', x: 0, y: 184, w: 100, h: 100, title: 'DECK B', sub: !on('playerB') ? 'OFF' : ev.mediaFail ? 'FILE ERROR' : !b.decks.B.track ? 'NO TRACK' : b.decks.B.playing ? 'PLAYING' : 'CUED', art: deckArt('B', 'playerB'), state: ev.mediaFail ? 'cut' : on('playerB') && b.decks.B.playing ? 'live' : 'idle', reserve: ['PLAYING'], detail: ['TO CH 2 LINE'] },
    { id: 'mc', x: 140, y: 0, w: 84, h: 64, title: 'MIC CH', sub: `TO REC ${ev.mic.toRec ? 'ON' : 'OFF'}`, art: { kind: 'micch', level: ev.mic.level, on: ev.mic.on, talkover: !!ev.mic.talkover, toBooth: !!ev.mic.toBooth, toRec: !!ev.mic.toRec }, extTap: 'mic', detail: [`LEVEL ${Math.round(ev.mic.level * 100)}%`, `TALK OVER ${ev.mic.talkover ? 'ON' : 'OFF'}`] },
    { id: 'c1', x: 140, y: 74, w: 84, h: 100, title: 'CH 1', sub: [b.ch[1].input, dbStr(trimDb(b.ch[1].trim), 0)], art: chArt(1), tap: 'ch1', reserve: ['PHONO', '+12 dB'], detail: chDetail(1) },
    { id: 'c2', x: 140, y: 184, w: 84, h: 100, title: 'CH 2', sub: [b.ch[2].input, ...(b.ch[2].xf === 'THRU' ? [] : [`X-F ${b.ch[2].xf}`])], art: chArt(2), tap: 'ch2', reserve: ['PHONO', 'X-F A'], detail: chDetail(2) },
    { id: 'mix', x: 240, y: 0, w: 42, h: 284, title: 'MIX', art: { kind: 'master', master: b.mixer.master, booth: b.mixer.booth, phones: b.mixer.phones, cueMix: b.mixer.cueMix, xf: b.mixer.xf }, tap: 'bus' },
    { id: 'ph', x: OUT_X, ...ROW.ph, w: OUT_W, title: 'PHONES', art: { kind: 'phones' }, tap: 'phonesL', detail: [b.mixer.cueMix < 0.1 ? 'BLEND: CUE' : b.mixer.cueMix > 0.9 ? 'BLEND: MASTER' : 'BLEND: MID'] },
    { id: 'rec', x: OUT_X, ...ROW.rec, w: OUT_W, title: 'RECORDER', sub: recClip ? 'CLIPPING' : ev.rec.armedAt != null ? 'REC ON' : 'STOPPED', art: { kind: 'recorder', armed: ev.rec.armedAt != null, clip: recClip }, extTap: 'recL', state: recClip ? 'clip' : undefined, reserve: ['CLIPPING'], detail: [`INPUT ${recGainDb(ev.rec.gain) >= 0 ? '+' : '−'}${Math.abs(recGainDb(ev.rec.gain)).toFixed(0)} dB`] },
    { id: 'paL', x: OUT_X, ...ROW.paL, w: OUT_W, title: 'PA L', sub: spk('paL', !cabledL) ?? (humL ? 'HUM' : undefined), art: { kind: 'speaker', on: on('paL') }, tap: fedL ? 'masterL' : undefined, state: !cabledL ? 'cut' : humL ? 'hum' : undefined, reserve: ['CABLE'], detail: [ev.paLWall ? 'POWER: WALL' : 'POWER: STRIP', 'INPUT LINE'] },
    { id: 'paR', x: OUT_X, ...ROW.paR, w: OUT_W, title: 'PA R', sub: spk('paR', !cabledR) ?? (paRClip ? 'CLIPPING' : undefined), art: { kind: 'speaker', on: on('paR'), clip: !!paRClip }, tap: fedR ? 'masterR' : undefined, state: !cabledR ? 'cut' : paRClip ? 'clip' : undefined, reserve: ['CABLE'], detail: ['POWER: STRIP', `INPUT ${ev.paRMic ? 'MIC' : 'LINE'}`] },
    { id: 'bth', x: OUT_X, ...ROW.bth, w: OUT_W, title: 'BOOTH', sub: !on('boothL') && !on('boothR') ? 'OFF' : undefined, art: { kind: 'monitors', on: on('boothL') || on('boothR') }, tap: 'booth' },
    { id: 'wall', x: WALL_AT.x, y: WALL_AT.y, w: 30, h: 48, title: '', art: { kind: 'wall' }, bare: true },
  ];
  const strip: FlowNode = {
    id: 'strip',
    ...STRIP,
    title: 'BOOTH STRIP',
    sub: 'ONE CIRCUIT',
    strip: {
      on: true,
      textX: 86,
      outlets: [
        { x: OUT.A, label: 'DECK A' },
        { x: OUT.B, label: 'DECK B' },
        { x: OUT.mixer, label: 'MIXER' },
        { x: OUT.boothL, label: 'BOOTH L' },
        { x: OUT.boothR, label: 'BOOTH R' },
        { x: OUT.paR, label: 'PA R' },
        { x: OUT.paL, label: ev.paLWall ? undefined : 'PA L' },
        ...SPARE.map((x) => ({ x })),
      ],
    },
  };
  nodes.push(strip);
  const live = (x: boolean) => (x ? 'live' : 'idle') as 'live' | 'idle';
  const links: FlowLink[] = [
    { from: 'A', to: 'c1', state: live(b.decks.A.playing && on('playerA')), label: 'LINE', fromY: 124, toY: 124 },
    { from: 'B', to: 'c2', state: live(b.decks.B.playing && on('playerB') && b.ch[2].input === 'LINE'), label: 'LINE', fromY: 234, toY: 234 },
    { from: 'mic', to: 'mc', state: live(ev.mic.on), label: 'XLR', fromY: 32, toY: 32 },
    { from: 'mc', to: 'mix', state: live(ev.mic.on), fromY: 32, toY: 32 },
    { from: 'c1', to: 'mix', state: live(b.ch[1].fader > 0.05 && b.decks.A.playing), fromY: 124, toY: 124 },
    { from: 'c2', to: 'mix', state: live(b.ch[2].fader > 0.05 && b.decks.B.playing && xf2 > 0.05), fromY: 234, toY: 234 },
    { from: 'mix', to: 'ph', state: live(on('mixer')), fromY: mid(ROW.ph), toY: mid(ROW.ph) },
    { from: 'mix', to: 'rec', state: ev.rec.tap === 'REC_OUT' && on('mixer') ? (recClip ? 'clip' : 'live') : 'idle', fromY: mid(ROW.rec), toY: mid(ROW.rec) },
    { from: 'mix', to: 'paL', state: !cabledL ? 'cut' : fedL ? (humL ? 'hum' : 'live') : 'idle', fromY: mid(ROW.paL), toY: mid(ROW.paL) },
    { from: 'mix', to: 'paR', state: !cabledR ? 'cut' : fedR ? (paRClip ? 'clip' : 'live') : 'idle', fromY: mid(ROW.paR), toY: mid(ROW.paR) },
    { from: 'mix', to: 'bth', state: live(on('mixer') && on('boothL')), fromY: mid(ROW.bth), toY: mid(ROW.bth) },
  ];
  // ONE cord per device, each in its own lane and with its own pattern
  const hum = ev.paLWall && !ev.paLIsolator && on('paL');
  const dev: Record<string, DeviceId> = { A: 'playerA', B: 'playerB', mixer: 'mixer', boothL: 'boothL', boothR: 'boothR', paR: 'paR', paL: 'paL' };
  const cords: Cord[] = board24Cords(ev.paLWall).map((c) => ({ ...c, tone: c.id === 'paL' && hum ? 'hum' : b.power[dev[c.id]] ? 'plain' : 'off' }));
  return { nodes, links, cords };
}

/** The wall socket's name, in the free margin over its plate (words never
 *  sit on a card or a cord). */
function WallWords({ hum }: { hum: boolean }) {
  const lm = useLabelMm(9);
  const lh = lm * 1.12;
  const x = WALL_AT.x + 30;
  const lines = ['WALL', 'SOCKET', 'OTHER', 'CIRCUIT'];
  return (
    <Group>
      {lines.map((t, i) => (
        <SceneText key={t} x={x} y={WALL_AT.y - 5 - (lines.length - 1 - i) * lh} size={lm} text={t} color={hum ? INK.amber : i < 2 ? INK.white : INK.printDim} face="label" align="right" />
      ))}
    </Group>
  );
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

function EventTray({ lead, onPower, lastPower, view, setView, onNew, onReplay, seed, doorsOpen, onDoors }: { lead: () => number; onPower: (e: PowerEvent) => void; lastPower: PowerEvent | null; view: 'FLOW' | 'BOOTH'; setView: (v: 'FLOW' | 'BOOTH') => void; onNew: () => void; onReplay: () => void; seed: number; doorsOpen: boolean; onDoors: () => void }) {
  const b = getBooth();
  const ev = evOf(b);
  const armed = ev.rec.armedAt != null;
  const micStep = (d: number) => updateBooth((x) => withMic(x, { level: Math.max(0, Math.min(1, Math.round((evOf(x).mic.level + d) * 20) / 20)) }));
  return (
    <View style={styles.tray}>
      <Text style={styles.block}>POWER · speakers last on, first off</Text>
      <PowerTray onEvent={onPower} lastEvent={lastPower} />
      {lastPower?.thump ? <TrayNote>To earn the safe power-up, switch everything OFF, then on again in the safe order — or REPLAY THIS EVENT (below).</TrayNote> : null}
      <Row head="SEE">
        <LabChip label="SIGNAL FLOW" selected={view === 'FLOW'} onPress={() => setView('FLOW')} compact />
        <LabChip label="THE BOOTH" selected={view === 'BOOTH'} onPress={() => setView('BOOTH')} compact />
      </Row>
      <View style={styles.rule} />
      <Text style={styles.block}>THE SHOW</Text>
      <Row head="THE DOORS">
        <LabChip label={doorsOpen ? 'DOORS OPEN' : 'OPEN THE DOORS ›'} selected={doorsOpen} onPress={() => (doorsOpen ? undefined : onDoors())} compact />
      </Row>
      <Row head={`THE MIC · LEVEL ${Math.round(ev.mic.level * 100)}%`}>
        <LabChip label={ev.mic.on ? 'MIC ON ●' : 'MIC OFF'} selected={ev.mic.on} onPress={() => updateBooth((x) => withMic(x, { on: !evOf(x).mic.on }))} compact />
        <LabChip label="LEVEL −" selected={false} onPress={() => micStep(-0.05)} compact />
        <LabChip label="LEVEL +" selected={false} onPress={() => micStep(0.05)} compact />
        <LabChip label="● TALK NOW" selected={false} onPress={() => (musicOn(getBooth()) ? announce(lead()) : undefined)} compact />
        <LabChip label={ev.mic.toRec ? 'MIC → REC ON' : 'MIC → REC OFF'} selected={ev.mic.toRec} onPress={() => updateBooth((x) => withMic(x, { toRec: !evOf(x).mic.toRec }))} compact />
      </Row>
      <Row head={`THE RECORDER · INPUT ${recGainDb(ev.rec.gain) >= 0 ? '+' : '−'}${Math.abs(recGainDb(ev.rec.gain)).toFixed(0)} dB`}>
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
        <LabChip label="REC GAIN −" selected={false} onPress={() => updateBooth((x) => withRec(x, { gain: recGainPos(recGainDb(evOf(x).rec.gain) - 3) }))} compact />
        <LabChip label="REC GAIN +" selected={false} onPress={() => updateBooth((x) => withRec(x, { gain: recGainPos(recGainDb(evOf(x).rec.gain) + 3) }))} compact />
      </Row>
      <View style={styles.rule} />
      <Text style={styles.block}>THE OUTPUTS · turn the MASTER down before you move a cable</Text>
      <PatchTray plugs={['mst.xlrL', 'mst.xlrR', 'bth.trsL', 'bth.trsR']} />
      <Row head="PA L’S POWER CORD">
        <LabChip label="BOOTH STRIP" selected={!ev.paLWall} onPress={() => updateBooth((x) => withEv(x, (e) => ({ ...e, paLWall: false })))} compact />
        <LabChip label="WALL SOCKET (OTHER CIRCUIT)" selected={ev.paLWall} onPress={() => updateBooth((x) => withEv(x, (e) => ({ ...e, paLWall: true })))} compact />
        <LabChip label={ev.paLIsolator ? 'ISOLATION TRANSFORMER IN MST L' : 'NO ISOLATION TRANSFORMER'} selected={ev.paLIsolator} onPress={() => updateBooth((x) => withEv(x, (e) => ({ ...e, paLIsolator: !e.paLIsolator })))} compact />
      </Row>
      <Row head="PA R · ITS OWN INPUT SWITCH (on its back)">
        <LabChip label="LINE" selected={!ev.paRMic} onPress={() => updateBooth((x) => withEv(x, (e) => ({ ...e, paRMic: false })))} compact />
        <LabChip label="MIC" selected={!!ev.paRMic} onPress={() => updateBooth((x) => withEv(x, (e) => ({ ...e, paRMic: true })))} compact />
      </Row>
      <View style={styles.rule} />
      <Text style={styles.block}>{`THIS EVENT · #${seed}`}</Text>
      <Row head="THE SAME FAULTS, OR NEW ONES">
        <LabChip label="REPLAY THIS EVENT" selected={false} onPress={onReplay} compact />
        <LabChip label="A NEW EVENT" selected={false} onPress={onNew} compact />
      </Row>
    </View>
  );
}

/* ── the debrief ─────────────────────────────────────────────────────── */

const PART_HEAD: Record<DebriefPart, string> = { cause: 'THE CAUSE', evidence: 'THE EVIDENCE', repair: 'THE REPAIR', prevention: 'PREVENTION' };

/** One fault's debrief: each part's options fit the same symptom; a wrong
 *  pick says why the evidence rules it out. */
function Debrief({ fault, seed, head, onDone }: { fault: FaultId; seed: number; head: string; onDone: () => void }) {
  const qs = useMemo(() => DEBRIEF_PARTS.map((p) => ({ part: p, ...debriefOptions(fault, p, seed) })), [fault, seed]);
  const [picked, setPicked] = useState<Record<DebriefPart, number | null>>({ cause: null, evidence: null, repair: null, prevention: null });
  const fired = useRef(false);
  const allRight = qs.every((q) => picked[q.part] === q.correct);
  if (allRight && !fired.current) {
    fired.current = true;
    onDone();
  }
  return (
    <View style={styles.debrief}>
      <Text style={styles.debriefHead}>{head}</Text>
      <Text style={styles.note}>{`The symptom was: ${FAULTS[fault].symptom}`}</Text>
      {qs.map((q) => (
        <View key={q.part} style={styles.tray}>
          <Text style={styles.sub}>{PART_HEAD[q.part]}</Text>
          {q.options.map((_, oi) => (
            <LabChip key={oi} label={`${picked[q.part] === oi ? (oi === q.correct ? '✓ ' : '✗ ') : ''}${q.options[oi]}`} selected={picked[q.part] === oi} onPress={() => setPicked((p) => ({ ...p, [q.part]: oi }))} />
          ))}
          {picked[q.part] != null && picked[q.part] !== q.correct ? <Text style={styles.warn}>{q.why[picked[q.part]!]}</Text> : null}
        </View>
      ))}
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

const nudge = (ch: ChannelId, d: number) => updateBooth((b) => ({ ...b, ch: { ...b.ch, [ch]: { ...b.ch[ch], fader: Math.max(0, Math.min(1, Math.round((b.ch[ch].fader + d) * 20) / 20)) } } }));

function PageEvent({ ctx }: { ctx: PageCtx }) {
  const onChunk = useMemo(() => (r: BoothRender) => (isEventRender(r) ? writeChunk(r) : undefined), []);
  const { booth, audio, tr, motion, last } = useEventKit({ lockPhase: true, onChunk });
  const { ready } = useScreenSetup(prepared, false);
  const [seed, setSeed] = useState(() => 1 + Math.floor(Math.random() * 9999));
  const scenario = useMemo(() => scenarioFor(seed), [seed]);
  const [doorsOpen, setDoorsOpen] = useState(false);
  const [view, setView] = useState<'FLOW' | 'BOOTH'>('FLOW');
  const [lastPower, setLastPower] = useState<PowerEvent | null>(null);
  const [check, setCheck] = useState(false);
  const [debriefed, setDebriefed] = useState<Record<number, boolean>>({});
  const thumped = useRef(false);
  const cued = useRef(false);
  const trans = useRef<TransitionState>(TRANSITION_FRESH);
  const ev = evOf(booth);
  const allOn = POWERED.every((d) => deviceLive(booth, d));
  // the power goal re-arms once everything is OFF again (learning #4)
  if (POWERED.every((d) => !booth.power[d])) thumped.current = false;
  // private cue: deck B playing, CUE 2, fader down, the headphones carrying it
  if (doorsOpen && booth.decks.B.playing && booth.ch[2].cue && booth.ch[2].fader <= 0.05 && !!last && last.rmsDb.cue > -55 && Math.max(last.rmsDb.phonesL, last.rmsDb.phonesR) > -60 && booth.mixer.cueMix < 0.5) cued.current = true;
  if (doorsOpen && last) {
    let mn = 0;
    for (const v of last.meter.crowd) if (v < mn) mn = v;
    trans.current = transitionStep(trans.current, booth, { crowdMinDb: mn, clipped: last.clipped.bus + last.clipped.master + last.clipped.ch1 + last.clipped.ch2 > 0 });
  }
  const fixedAll = doorsOpen && allFixed(booth, scenario);
  const allDebriefed = scenario.faults.every((_, i) => debriefed[i]);
  const hits = [
    // a power event THIS visit, in the safe order (the leftover booth of the
    // previous screen can never tick it — learning review 24 #1)
    allOn && lastPower != null && !thumped.current,
    cued.current,
    trans.current.done && !trans.current.failed,
    doorsOpen && ev.rec.armedAt != null && voiceIn(last, 'crowd') && voiceIn(last, 'rec'),
    fixedAll,
    fixedAll && allDebriefed,
    check,
  ];
  const goals = GOALS_EVENT.map((label, i) => ({ label, hit: hits[i] }));
  const latched = useVisitGoals(ctx, goals, 'EVENT', ready);
  const board = eventBoardOf(booth, last);
  const openDoors = () => {
    if (doorsOpen) return;
    setDoorsOpen(true);
    updateBooth((b) => plant(b, scenario));
  };
  const restart = (s: number) => {
    setSeed(s);
    setDoorsOpen(false);
    thumped.current = false;
    cued.current = false;
    trans.current = TRANSITION_FRESH;
    setDebriefed({});
    audio.stop();
    updateBooth((b) => prepared(b));
  };
  const onPower = (e: PowerEvent) => {
    if (e.thump) thumped.current = true;
    setLastPower(e);
  };
  const silentRoom = doorsOpen && musicOn(booth) && !!last && last.rmsDb.crowd < -50;
  const faultLive = doorsOpen && !fixedAll;
  const two = scenario.faults.length > 1;
  const f1 = scenario.faults[0];
  const f2 = scenario.faults[1];
  const hints = two ? [hintsFor(f1)[0], `Fault 1: ${FAULTS[f1].probe}`, `Fault 1: ${FAULTS[f1].where}`, `Fault 2: ${FAULTS[f2].probe}`, `Fault 2: ${FAULTS[f2].where}`] : hintsFor(f1);
  const roomV = !last ? '—' : last.rmsDb.crowd < -50 ? 'SILENT' : last.clipped.master + last.clipped.bus > 0 ? 'CLIPPING' : (last.ext.clipped.paR ?? 0) > 0 ? 'DISTORTED' : last.ext.hum.crowd ? 'HUM' : 'MUSIC';
  const f1v = Math.round(booth.ch[1].fader * 100);
  const f2v = Math.round(booth.ch[2].fader * 100);

  return (
    <DjRack
      spec={{
        render: (w, h) =>
          view === 'FLOW' ? (
            <Scene w={w} h={h} frame={FRAME} motion={motion} focus={{ x: 120, y: 0, w: 200, h: 170 }} a11y={`${LOOK_FLOW} ${allOn ? 'Everything is switched on.' : 'Some of the system is still off.'}${ev.paLWall ? ' PA L is plugged into the wall socket on another circuit.' : ''}`} obstacles={flowBoxes(board.nodes)}>
              <FlowBoard nodes={board.nodes} links={board.links} />
              <Cords cords={board.cords} />
              <WallWords hum={ev.paLWall && !ev.paLIsolator && deviceLive(booth, 'paL')} />
            </Scene>
          ) : (
            <BoothStage w={w} h={h} booth={booth} motion={motion} spec={{ view: BOOTH_VIEW, a11y: LOOK_BOOTH, highlight: { mixer: ['fader1', 'fader2', 'cue1', 'cue2'] } }} />
          ),
        bezel: [
          { k: 'EVENT', v: `#${seed}`, sub: doorsOpen ? 'DOORS OPEN' : 'SETTING UP', tint: colors.amber },
          { k: 'POWER', v: `${POWERED.filter((d) => deviceLive(booth, d)).length}/7`, sub: 'ON', tint: allOn ? colors.green : colors.amber },
          { k: 'THE ROOM', v: roomV, tint: !last ? colors.textSub : roomV === 'MUSIC' ? colors.green : roomV === 'HUM' ? colors.amber : PEAK_RED },
          { k: 'PLAYING', v: decksValue(booth), tint: colors.amber },
        ],
        params: [
          {
            kind: 'fader',
            id: 'fader',
            label: 'FADERS',
            value: booth.ch[2].fader,
            level: true,
            onChange: (v) => updateBooth((b) => ({ ...b, ch: { ...b.ch, 2: { ...b.ch[2], fader: v } } })),
            format: (v) => `CH 2 ${Math.round(v * 100)}% · CH 1 ${f1v}%`,
            formatShort: (v) => `${Math.round(v * 100)}/${f1v}`,
            nudges: [
              { label: 'CH 1 ↓', onPress: () => nudge(1, -0.1), a11y: 'Channel 1 fader down a step' },
              { label: 'CH 1 ↑', onPress: () => nudge(1, 0.1), a11y: 'Channel 1 fader up a step' },
            ],
          },
          { kind: 'group', id: 'mixer', label: 'MIXER', valueLabel: booth.ch[2].input, valueA11y: `channel 1 input ${booth.ch[1].input}, channel 2 input ${booth.ch[2].input}`, render: () => <MixerTray /> },
          { kind: 'group', id: 'decks', label: 'DECKS', valueLabel: decksValue(booth), render: () => <DecksTray tr={tr} /> },
          { kind: 'group', id: 'event', label: 'EVENT', valueLabel: doorsOpen ? 'LIVE' : 'SET UP', render: () => <EventTray lead={audio.leadSec} onPower={onPower} lastPower={lastPower} view={view} setView={setView} onNew={() => restart(1 + Math.floor(Math.random() * 9999))} onReplay={() => restart(seed)} seed={seed} doorsOpen={doorsOpen} onDoors={openDoors} /> },
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
        <Do>Open EVENT → POWER and switch the system on in the safe order: the decks and the mixer first, the speakers LAST. Start RECORD. Then open the doors: EVENT → OPEN THE DOORS (or the red card in Step 5).</Do>
        <P>Then run the show: play deck A to the room; cue deck B in your headphones with its fader down; bring B in and A out with FADERS (CH 1 ↓ under it) — no gap, no clip; switch the mic on and make an announcement the room AND the recorder carry.</P>
        {silentRoom ? <Note tone="try">The room is silent while music plays: trace it on the board — source, channel, mix, output — and find the last live meter.</Note> : null}
        {trans.current.failed ? <Note tone="try">{`${trans.current.failed}${faultLive ? ' — fix the event’s fault first.' : ''} Bring CH 1 back up and CH 2 down to try again.`}</Note> : null}
      </Step>
      <Step n={3}>
        <P>The board is the method: every card’s meter is a tap of the real signal. A dark card after a live one is where to look. The tempos are matched for you, with key lock on — the lesson here is the system.</P>
        <Note tone="safety">Real faults at real events: turn the MASTER down before you touch an output cable, never remove a mains earth, and keep your ears protected while you troubleshoot. A hum here is 60 Hz mains (50 Hz in many countries).</Note>
      </Step>
      <Step n={4}>
        <Do>Power up safely, cue privately, make a clean transition, announce to the room and the recording, fix the event’s fault, and debrief it.</Do>
        <GoalChips goals={goals.slice(0, 4)} latched={latched.slice(0, 4)} />
        {!doorsOpen ? <Note>The show starts when the doors open: cueing, the transition and the announcement count from then.</Note> : null}
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
          title={`EVENT #${seed} · ${doorsOpen ? 'THE DOORS ARE OPEN' : 'THE DOORS ARE SHUT'}`}
          intro="The show starts when the doors open — and something in this event will go wrong. Power up first; then find it from the evidence on the board, and fix it with the controls."
          startLabel="OPEN THE DOORS"
          open={doorsOpen}
          symptom={FAULTS[f1].symptom}
          extra={two ? <Text style={styles.symptom}>{`And a second symptom: ${FAULTS[f2].symptom}`}</Text> : null}
          start={openDoors}
          fixed={fixedAll}
          hints={hints}
          why={two ? 'Both faults are cleared: the room, the booth and the recording carry what they should. Now debrief each one below.' : 'The room, the booth and the recording carry what they should. Now debrief it below — the cause, the evidence, the repair, and how to prevent it.'}
        />
        {fixedAll
          ? scenario.faults.map((f, i) => (
              <Debrief key={`${seed}-${f}`} fault={f} seed={seed} head={two ? `DEBRIEF · FAULT ${i + 1} OF 2` : 'DEBRIEF · THE EVENT’S FAULT'} onDone={() => setDebriefed((d) => ({ ...d, [i]: true }))} />
            ))
          : null}
        <GoalChips goals={goals.slice(4)} latched={latched.slice(4)} />
      </Step>
      <Covers ctx={ctx} />
    </DjRack>
  );
}

const styles = StyleSheet.create({
  tray: { gap: 8 },
  sub: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.2, marginTop: 4 },
  block: { color: colors.amberLabel, fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.3, marginTop: 2 },
  rule: { height: 1, backgroundColor: '#2a2a31', marginVertical: 4 },
  note: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18 },
  symptom: { color: colors.textPrimary, fontFamily: fonts.barlowSemiBold, fontSize: 14.5, lineHeight: 21 },
  warn: { color: '#ff8a7e', fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18 },
  debrief: { borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,198,77,0.45)', backgroundColor: 'rgba(255,198,77,0.05)', padding: 12, gap: 10 },
  debriefHead: { color: colors.amber, fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.3 },
  summary: { borderRadius: 12, borderWidth: 1, borderColor: 'rgba(91,255,133,0.4)', backgroundColor: '#0d1a12', padding: 12, gap: 6 },
  sumHead: { color: colors.green, fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.4 },
  sumItem: { color: colors.textSecondary, fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20 },
  sumFoot: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, marginTop: 4 },
});

export const P24: PageDef = { title: 'Troubleshooting and the complete system challenge', short: 'EVENT', Component: PageEvent, manualDone: true, rack: true };
