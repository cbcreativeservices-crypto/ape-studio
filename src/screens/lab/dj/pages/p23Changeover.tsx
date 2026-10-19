/**
 * Screen 23 — Performer changeovers and backup playback (research DJ29, with
 * the media backups of DJ10 and the handling and power of DJ24).
 *
 * The outgoing DJ plays from a laptop on the mixer's USB 1 (CH 1); the
 * incoming DJ brings a laptop for USB 2 (CH 2) and a BACKUP stick in deck B
 * (CH 2's LINE input) — playback that needs no computer. Two computer paths,
 * so nobody unplugs the music to change over. Drawn as the event's signal-
 * flow board (art/EventFlow) with the power row under it, where a GROUND
 * LOOP (DJ 2's charger in a wall socket on another circuit) shows as a loop.
 *
 * Tasks: predict which disconnection would stop the music (model/
 * djChangeover.wouldStop); connect with the channel down; kill the hum
 * SAFELY (an earth lift is refused, never applied); match levels in the
 * headphones; change over without a gap; and the fault — DJ 2's laptop
 * freezes — recovered without the program stopping.
 */
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { DashPathEffect, Group, Path, Skia } from '@shopify/react-native-skia';
import { colors } from '../../../../theme/tokens';
import { LabChip } from '../../LabShell';
import { UnderstandingCheck } from '../../tuning/components/check';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import { Scene, type Callout } from '../art/Scene';
import { FlowBoard, flowBoxes, type FlowLink, type FlowNode, type FlowState } from '../art/EventFlow';
import { INK } from '../art/ink';
import type { Box } from '../geometry/boothGeometry';
import { DjRack } from '../DjRack';
import { Do, FaultCard, GoalChips, Look, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { stopKey, trimKey, type Transport } from '../dock';
import { boothNow, getBooth, updateBooth } from '../booth/boothStore';
import { cueAtBar, useScreenSetup } from '../booth/setup';
import { TRACKS } from '../engine/djMusic';
import { chanLevels } from '../model/djLessons';
import { pitchFor, playedBpm } from '../model/djTime';
import { setPlaying } from '../model/djDeck';
import { type Booth, type ChannelId } from '../model/djModel';
import { EARTH_LIFT_REFUSAL, evOf, lapPlay, withLap } from '../model/djEvent';
import { CHANGE_ITEMS, CHANGE_NAMES, changeoverHum, gradePrediction, onAir, programOn, sourceOf, type ChangeItem } from '../model/djChangeover';
import { TRANSITION_FRESH, transitionStepBy, type TransitionState } from '../model/djCapstone';
import { EventListen, Row, TrayNote, useEventKit, withFreshEvent } from './eventShared';
import { PEAK_RED } from './shared';

const TERMS = [
  { term: 'Input list', def: 'Which source is on which channel and input, written down and agreed before the night — so nobody has to guess what a cable feeds.' },
  { term: 'Backup playback', def: 'A way to keep music going that does not depend on the thing most likely to fail: a stick in a player, ready on a channel, while a laptop plays.' },
  { term: 'Protective earth', def: 'The mains earth wire that keeps a fault from making metal live. It is SAFETY, never the hum’s cure — never remove it.' },
  { term: 'Ground loop', def: 'Two earthed paths between pieces of gear (a charger in another circuit, and the USB or audio lead): a loop that picks up mains hum. Break it in the audio or USB path — an isolator or a DI’s ground lift — or power everything from one strip.' },
] as const;

export const GOALS_CHANGE = ['Predict what would stop the music', 'Connect with CH 2 down', 'Kill the hum safely', 'Match levels in the headphones', 'Change over with no gap', 'Recover from the frozen laptop', 'Pass the check'] as const;

const LOOK = 'You are looking at the event’s signal-flow board: the two laptops and the two players on the left, the mixer’s two channels and its mix in the middle, the PA, the booth and your headphones on the right — each with its live meter — and the power under it: the booth strip and a wall socket on another circuit.';

/* ── the board (board units, about a millimetre) ──────────────────────── */

const FRAME: Box = { x: -10, y: -12, w: 404, h: 272 };
const TAG: Record<ChangeItem, number> = { 'lap1.usb': 1, 'lap1.charger': 2, 'lap2.usb': 3, 'deckA.stick': 4, 'deckB.stick': 5, 'mixer.power': 6, master: 7, booth: 8 };

function boardOf(b: Booth, hum: boolean, verdict: Record<ChangeItem, boolean> | null) {
  const ev = evOf(b);
  const lapState = (k: 1 | 2): FlowState => {
    const l = k === 1 ? ev.lap1 : ev.lap2;
    if (!l.usb) return 'idle';
    if (!l.alive) return 'clip';
    return l.deck.playing ? 'live' : 'idle';
  };
  const lapSub = (k: 1 | 2) => {
    const l = k === 1 ? ev.lap1 : ev.lap2;
    if (!l.usb) return 'NOT CONNECTED';
    if (!l.alive) return 'FROZEN';
    return l.deck.playing ? `PLAYING · USB ${k}` : `READY · USB ${k}`;
  };
  const deckSub = (d: 'A' | 'B') => (!b.decks[d].track ? 'NO STICK' : b.decks[d].playing ? 'PLAYING' : d === 'B' ? 'BACKUP CUED' : 'CUED');
  const nodes: FlowNode[] = [
    { id: 'lap1', x: 4, y: 4, w: 96, h: 40, title: 'LAPTOP · DJ 1', sub: lapSub(1), icon: 'laptop', state: lapState(1) },
    { id: 'deckA', x: 4, y: 52, w: 96, h: 36, title: 'DECK A', sub: deckSub('A'), icon: 'player', state: b.decks.A.playing ? 'live' : 'idle' },
    { id: 'lap2', x: 4, y: 100, w: 96, h: 40, title: 'LAPTOP · DJ 2', sub: lapSub(2), icon: 'laptop', state: hum ? 'hum' : lapState(2) },
    { id: 'deckB', x: 4, y: 148, w: 96, h: 36, title: 'DECK B · BACKUP', sub: deckSub('B'), icon: 'player', state: b.decks.B.playing ? 'live' : 'idle' },
    { id: 'ch1', x: 136, y: 16, w: 86, h: 56, title: 'CH 1', sub: `INPUT ${b.ch[1].input === 'USB' ? 'USB 1' : b.ch[1].input}`, icon: 'mixer', tap: 'ch1', onAir: onAir(b, 1) },
    { id: 'ch2', x: 136, y: 112, w: 86, h: 56, title: 'CH 2', sub: hum ? 'HUM · USB 2' : `INPUT ${b.ch[2].input === 'USB' ? 'USB 2' : b.ch[2].input}`, icon: 'mixer', tap: 'ch2', onAir: onAir(b, 2), state: hum ? 'hum' : undefined },
    { id: 'bus', x: 250, y: 66, w: 48, h: 56, title: 'MIX', tap: 'bus' },
    { id: 'pa', x: 318, y: 10, w: 74, h: 40, title: 'PA', icon: 'speaker', tap: 'crowd' },
    { id: 'mon', x: 318, y: 60, w: 74, h: 40, title: 'BOOTH', icon: 'monitor', tap: 'booth' },
    { id: 'ph', x: 318, y: 110, w: 74, h: 40, title: 'PHONES', icon: 'phones', tap: 'phonesL' },
    { id: 'wall', x: 4, y: 214, w: 110, h: 34, title: 'WALL SOCKET', sub: 'ANOTHER CIRCUIT', icon: 'wall' },
    { id: 'strip', x: 158, y: 214, w: 110, h: 34, title: 'BOOTH STRIP', sub: 'MIXER · DJ 1', icon: 'strip' },
  ];
  const lap2Charger = ev.lap2.charger;
  const links: FlowLink[] = [
    { from: 'lap1', to: 'ch1', state: !ev.lap1.usb ? 'idle' : b.ch[1].input === 'USB' && ev.lap1.alive && ev.lap1.deck.playing ? 'live' : 'idle', label: 'USB 1', tag: TAG['lap1.usb'] },
    { from: 'deckA', to: 'ch1', state: b.ch[1].input === 'LINE' && b.decks.A.playing ? 'live' : 'idle', label: 'LINE', toY: 58 },
    { from: 'lap2', to: 'ch2', state: !ev.lap2.usb ? 'idle' : hum ? 'hum' : b.ch[2].input === 'USB' && ev.lap2.alive && ev.lap2.deck.playing ? 'live' : 'idle', label: ev.lap2.isolator ? 'USB 2 · ISOLATOR' : 'USB 2', tag: TAG['lap2.usb'] },
    { from: 'deckB', to: 'ch2', state: b.ch[2].input === 'LINE' && b.decks.B.playing ? 'live' : 'idle', label: 'LINE', toY: 154 },
    { from: 'ch1', to: 'bus', state: onAir(b, 1) ? 'live' : 'idle' },
    { from: 'ch2', to: 'bus', state: onAir(b, 2) ? (hum ? 'hum' : 'live') : 'idle' },
    { from: 'bus', to: 'pa', state: programOn(b) ? 'live' : 'idle' },
    { from: 'bus', to: 'mon', state: 'live' },
    { from: 'bus', to: 'ph', state: 'live' },
  ];
  const tags: Record<string, { num: number; verdict?: 'right' | 'wrong' | null }> = {
    deckA: { num: TAG['deckA.stick'], verdict: verdict ? (verdict['deckA.stick'] ? 'right' : 'wrong') : null },
    deckB: { num: TAG['deckB.stick'], verdict: verdict ? (verdict['deckB.stick'] ? 'right' : 'wrong') : null },
    strip: { num: TAG['mixer.power'], verdict: verdict ? (verdict['mixer.power'] ? 'right' : 'wrong') : null },
    pa: { num: TAG.master, verdict: verdict ? (verdict.master ? 'right' : 'wrong') : null },
    mon: { num: TAG.booth, verdict: verdict ? (verdict.booth ? 'right' : 'wrong') : null },
  };
  for (const it of ['lap1.usb', 'lap2.usb', 'lap1.charger'] as ChangeItem[]) tags[`link:${TAG[it]}`] = { num: TAG[it], verdict: verdict ? (verdict[it] ? 'right' : 'wrong') : null };
  // DJ 1's charger is drawn on the lap1 card's tag (it is in the strip)
  tags.lap1 = { num: TAG['lap1.charger'], verdict: verdict ? (verdict['lap1.charger'] ? 'right' : 'wrong') : null };
  return { nodes, links, tags, lap2Charger };
}

/** The power row: the chargers' cords, and the GROUND LOOP when there is one. */
function PowerRow({ b, hum }: { b: Booth; hum: boolean }) {
  const ev = evOf(b);
  const cord = (pts: [number, number][]) => {
    const p = Skia.PathBuilder.Make();
    p.moveTo(pts[0][0], pts[0][1]);
    for (const q of pts.slice(1)) p.lineTo(q[0], q[1]);
    return p.detach();
  };
  const lap1 = cord([[60, 44], [60, 50], [118, 50], [118, 206], [200, 206], [200, 214]]);
  const lap2 = ev.lap2.charger === 'WALL' ? cord([[40, 140], [40, 214]]) : ev.lap2.charger === 'STRIP' ? cord([[70, 140], [70, 196], [228, 196], [228, 214]]) : null;
  const loop = cord([[30, 214], [30, 146], [116, 146], [130, 140], [180, 168], [210, 168], [240, 206], [240, 248], [30, 252], [30, 214]]);
  return (
    <Group>
      <Path path={lap1} style="stroke" strokeWidth={2} color="#2a2c31" />
      {lap2 ? <Path path={lap2} style="stroke" strokeWidth={2} color="#2a2c31" /> : null}
      {hum ? (
        <Path path={loop} style="stroke" strokeWidth={2.4} color={INK.amber} opacity={0.9}>
          <DashPathEffect intervals={[6, 4]} />
        </Path>
      ) : null}
    </Group>
  );
}

/* ── the trays ───────────────────────────────────────────────────────── */

function PlugTray({ onHot, onEarth }: { onHot: (w: string | null) => void; onEarth: (w: string | null) => void }) {
  const b = getBooth();
  const ev = evOf(b);
  const l2 = ev.lap2;
  const sel = (ch: ChannelId, input: 'LINE' | 'USB') => {
    const g = getBooth();
    onHot(g.ch[ch].fader > 0.02 && g.ch[ch].input !== input ? `HOT — CH ${ch}’s selector moved with its fader up: a jump of sound (or a crack) straight to the room. Selector and cables move with the fader DOWN.` : null);
    updateBooth((x) => ({ ...x, ch: { ...x.ch, [ch]: { ...x.ch[ch], input } } }));
  };
  return (
    <View style={styles.tray}>
      <Row head="DJ 2’S LAPTOP → THE MIXER’S USB 2">
        <LabChip label={l2.usb ? 'USB 2: CONNECTED' : 'CONNECT USB 2'} selected={l2.usb} onPress={() => { const g = getBooth(); onHot(!l2.usb && g.ch[2].input === 'USB' && g.ch[2].fader > 0.02 ? 'HOT — a source plugged in on a channel that is up. Fader DOWN first.' : null); updateBooth((x) => withLap(x, 2, { usb: !evOf(x).lap2.usb })); }} compact />
        <LabChip label={l2.isolator ? 'USB ISOLATOR IN' : 'NO ISOLATOR'} selected={l2.isolator} onPress={() => updateBooth((x) => withLap(x, 2, { isolator: !evOf(x).lap2.isolator }))} compact />
      </Row>
      <Row head="CH 1 · CH 2 INPUT SELECTORS">
        <LabChip label={`CH 1: ${b.ch[1].input === 'USB' ? 'USB 1' : 'LINE'}`} selected={false} onPress={() => sel(1, b.ch[1].input === 'USB' ? 'LINE' : 'USB')} compact />
        <LabChip label={`CH 2: ${b.ch[2].input === 'USB' ? 'USB 2' : 'LINE (DECK B)'}`} selected={false} onPress={() => sel(2, b.ch[2].input === 'USB' ? 'LINE' : 'USB')} compact />
      </Row>
      <Row head="DJ 2’S LAPTOP CHARGER">
        {(['WALL', 'STRIP', 'NONE'] as const).map((c) => (
          <LabChip key={c} label={c === 'WALL' ? 'WALL SOCKET' : c === 'STRIP' ? 'BOOTH STRIP' : 'UNPLUG (BATTERY)'} selected={l2.charger === c} onPress={() => updateBooth((x) => withLap(x, 2, { charger: c }))} compact />
        ))}
      </Row>
      <Row head="SOMEONE SUGGESTS">
        <LabChip label="LIFT THE MAINS EARTH" selected={false} onPress={() => onEarth(EARTH_LIFT_REFUSAL)} compact />
      </Row>
    </View>
  );
}

function PredictTray({ marked, setMarked, onCheck, verdict }: { marked: ReadonlySet<ChangeItem>; setMarked: (s: Set<ChangeItem>) => void; onCheck: () => void; verdict: { right: boolean; perItem: Record<ChangeItem, boolean> } | null }) {
  return (
    <View style={styles.tray}>
      <TrayNote>Mark every one that would stop the music the CROWD hears right now, then check. (Numbers match the board.)</TrayNote>
      <View style={styles.list}>
        {CHANGE_ITEMS.map((it) => (
          <LabChip
            key={it}
            label={`${TAG[it]} · ${CHANGE_NAMES[it]}${verdict ? (verdict.perItem[it] ? ' ✓' : ' ✗') : ''}`}
            selected={marked.has(it)}
            onPress={() => {
              const s = new Set(marked);
              if (s.has(it)) s.delete(it);
              else s.add(it);
              setMarked(s);
            }}
            compact
          />
        ))}
      </View>
      <Row head="">
        <LabChip label="CHECK MY ANSWER" selected={false} onPress={onCheck} compact />
      </Row>
      {verdict ? <TrayNote tone={verdict.right ? undefined : 'warn'}>{verdict.right ? 'Right. Only what feeds the room NOW matters: the on-air laptop’s USB, the mixer’s power and the MASTER lines. A charger is not a source (the battery carries on), the idle sources are not on air, and the booth feeds only you.' : 'Not yet — the ✗ ones are wrong. Ask of each: does the crowd’s music pass through it right now?'}</TrayNote> : null}
    </View>
  );
}

function MixTray({ tr, req }: { tr: Transport; req: () => void }) {
  const b = getBooth();
  const ev = evOf(b);
  const f = (ch: ChannelId, v: number) => updateBooth((x) => ({ ...x, ch: { ...x.ch, [ch]: { ...x.ch[ch], fader: v } } }));
  const cue = (ch: ChannelId) => updateBooth((x) => ({ ...x, ch: { ...x.ch, [ch]: { ...x.ch[ch], cue: !x.ch[ch].cue } } }));
  const lap = (k: 1 | 2) => {
    req();
    updateBooth((x, t) => lapPlay(x, t, k, !(k === 1 ? evOf(x).lap1 : evOf(x).lap2).deck.playing, k === 2 ? 1 : undefined));
  };
  return (
    <View style={styles.tray}>
      <Row head="PLAY">
        <LabChip label={`${ev.lap1.deck.playing ? '❚❚' : '▶'} DJ 1 (LAPTOP 1)`} selected={ev.lap1.deck.playing} onPress={() => lap(1)} compact />
        <LabChip label={`${ev.lap2.deck.playing ? '❚❚' : '▶'} DJ 2 (LAPTOP 2)`} selected={ev.lap2.deck.playing} onPress={() => lap(2)} compact />
        <LabChip label={`${b.decks.B.playing ? '❚❚' : '▶'} DECK B (BACKUP)`} selected={b.decks.B.playing} onPress={() => { req(); updateBooth((x, t) => setPlaying(x, t, 'B', !x.decks.B.playing)); }} compact />
      </Row>
      <Row head={`CH 1 FADER ${Math.round(b.ch[1].fader * 100)}% · CH 2 FADER ${Math.round(b.ch[2].fader * 100)}%`}>
        <LabChip label="CH 1 DOWN" selected={b.ch[1].fader <= 0.02} onPress={() => f(1, 0)} compact />
        <LabChip label="CH 1 UP" selected={Math.abs(b.ch[1].fader - 0.85) < 0.02} onPress={() => f(1, 0.85)} compact />
        <LabChip label="CH 2 DOWN" selected={b.ch[2].fader <= 0.02} onPress={() => f(2, 0)} compact />
        <LabChip label="CH 2 UP" selected={Math.abs(b.ch[2].fader - 0.85) < 0.02} onPress={() => f(2, 0.85)} compact />
      </Row>
      <Row head="HEADPHONE CUE">
        <LabChip label={b.ch[1].cue ? 'CUE 1 ●' : 'CUE 1'} selected={b.ch[1].cue} onPress={() => cue(1)} compact />
        <LabChip label={b.ch[2].cue ? 'CUE 2 ●' : 'CUE 2'} selected={b.ch[2].cue} onPress={() => cue(2)} compact />
      </Row>
      {tr.soundDeclined ? <LabChip label="TURN SOUND ON" selected={false} onPress={tr.soundOn} compact /> : null}
      <EventListen withRecorder={false} />
    </View>
  );
}

/* ── the page ────────────────────────────────────────────────────────── */

function PageChange({ ctx }: { ctx: PageCtx }) {
  const { booth, audio, tr, motion, last } = useEventKit();
  useScreenSetup((b) => {
    // deck B holds DJ 2's backup copy, cued, at laptop 1's tempo
    let x = cueAtBar(b, 'B', 'glassHarbour', 17);
    x = { ...x, decks: { A: { ...x.decks.A, track: null, playing: false }, B: { ...x.decks.B, pitch: pitchFor(TRACKS.glassHarbour.bpm, TRACKS.nightFerry.bpm) } } };
    x = { ...x, ch: { 1: { ...x.ch[1], input: 'USB', fader: 0.85, xf: 'THRU', cue: false }, 2: { ...x.ch[2], input: 'LINE', fader: 0, xf: 'THRU', cue: false } }, mixer: { ...x.mixer, master: 0.6, booth: 0.45, xf: 0.5, cueMix: 0 }, perspective: 'CROWD' };
    const leadIn = (id: 'nightFerry' | 'glassHarbour') => TRACKS[id].leadInSec + 16 * ((4 * 60) / TRACKS[id].bpm);
    return withFreshEvent(x, (ev) => ({
      ...ev,
      lap1: { ...ev.lap1, usb: true, charger: 'STRIP', deck: { ...ev.lap1.deck, posSec: leadIn('nightFerry'), cueSec: leadIn('nightFerry') } },
      lap2: { ...ev.lap2, usb: false, charger: 'WALL', deck: { ...ev.lap2.deck, posSec: leadIn('glassHarbour'), cueSec: leadIn('glassHarbour'), pitch: pitchFor(TRACKS.glassHarbour.bpm, playedBpm(TRACKS.nightFerry.bpm, 0)) } },
    }));
  });
  const [hot, setHot] = useState<string | null>(null);
  const [earth, setEarth] = useState<string | null>(null);
  const [marked, setMarked] = useState<Set<ChangeItem>>(new Set());
  const [verdict, setVerdict] = useState<{ right: boolean; perItem: Record<ChangeItem, boolean> } | null>(null);
  const [check, setCheck] = useState(false);
  const [faultFixed, setFaultFixed] = useState(false);
  const [gapNote, setGapNote] = useState<string | null>(null);
  const hotSeen = useRef(false);
  const humSeen = useRef(false);
  const trans = useRef<TransitionState>(TRANSITION_FRESH);
  const freezeAt = useRef<number | null>(null);
  const ev = evOf(booth);
  const hum = changeoverHum(booth);
  if (hum) humSeen.current = true;
  if (hot) hotSeen.current = true;
  const ch1 = chanLevels(last, 1);
  const ch2 = chanLevels(last, 2);
  const matched = ev.lap2.usb && booth.ch[2].input === 'USB' && ev.lap2.deck.playing && booth.ch[2].cue && booth.ch[2].fader <= 0.05 && ch1.avg != null && ch2.avg != null && Math.abs(ch1.avg - ch2.avg) <= 2 && (ch2.peak ?? 0) < -1;
  // the changeover (DJ 1 → DJ 2), read chunk by chunk
  if (last) {
    let mn = 0;
    for (const v of last.meter.crowd) if (v < mn) mn = v;
    trans.current = transitionStepBy(trans.current, onAir(booth, 1), onAir(booth, 2), booth.ch[2].fader, { crowdMinDb: mn, clipped: last.clipped.bus + last.clipped.master > 0 });
  }
  const hits = [
    !!verdict?.right,
    ev.lap2.usb && booth.ch[2].input === 'USB' && !hotSeen.current,
    humSeen.current && ev.lap2.usb && !hum,
    matched,
    trans.current.done && !trans.current.failed,
    faultFixed,
    check,
  ];
  const goals = GOALS_CHANGE.map((label, i) => ({ label, hit: hits[i] }));
  const latched = useVisitGoals(ctx, goals, 'CHANGE');
  const board = boardOf(booth, hum, verdict?.perItem ?? null);
  const callouts: Callout[] = hum ? [{ id: 'gl', text: 'GROUND LOOP · HUM', at: { x: 30, y: 180 }, dx: 30, dy: 0, tone: 'amber' }] : [];

  return (
    <DjRack
      spec={{
        render: (w, h) => (
          <Scene w={w} h={h} frame={FRAME} motion={motion} a11y={`${LOOK} ${programOn(booth) ? 'The crowd hears music.' : 'The crowd hears nothing.'}${hum ? ' There is a ground-loop hum on CH 2.' : ''}`} obstacles={flowBoxes(board.nodes)} callouts={callouts}>
            <PowerRow b={booth} hum={hum} />
            <FlowBoard nodes={board.nodes} links={board.links} tags={board.tags} />
          </Scene>
        ),
        bezel: [
          { k: 'ON AIR', v: onAir(booth, 1) && onAir(booth, 2) ? 'DJ 1 + DJ 2' : onAir(booth, 1) ? (sourceOf(booth, 1)?.kind === 'lap' ? 'DJ 1' : 'CH 1') : onAir(booth, 2) ? (sourceOf(booth, 2)?.kind === 'lap' ? 'DJ 2' : 'BACKUP') : 'NOTHING', tint: programOn(booth) ? colors.red : colors.textSub },
          { k: 'CH 1 AVG', v: ch1.avg == null ? '—' : ch1.avg.toFixed(1), sub: 'dBFS', tint: colors.amber },
          { k: 'CH 2 AVG', v: ch2.avg == null ? '—' : ch2.avg.toFixed(1), sub: 'dBFS', tint: ch1.avg != null && ch2.avg != null && Math.abs(ch1.avg - ch2.avg) <= 2 ? colors.green : colors.amber },
          { k: 'HUM', v: hum ? 'ON CH 2' : 'NONE', tint: hum ? PEAK_RED : colors.green },
        ],
        params: [
          trimKey(booth, 2),
          { kind: 'group', id: 'plug', label: 'PLUG', valueLabel: ev.lap2.usb ? 'USB 2' : 'NOT IN', render: () => <PlugTray onHot={setHot} onEarth={setEarth} /> },
          { kind: 'group', id: 'predict', label: 'PREDICT', valueLabel: verdict ? (verdict.right ? 'RIGHT' : 'TRY AGAIN') : `${marked.size} MARKED`, render: () => <PredictTray marked={marked} setMarked={(s) => { setMarked(s); setVerdict(null); }} onCheck={() => setVerdict(gradePrediction(getBooth(), marked))} verdict={verdict} /> },
          { kind: 'group', id: 'mix', label: 'MIX', valueLabel: programOn(booth) ? 'ON AIR' : 'SILENT', render: () => <MixTray tr={tr} req={() => void audio.requestSound()} /> },
          stopKey(tr),
        ],
        initialParam: 'trim2',
      }}
    >
      <Step n={1}>
        <Look>{LOOK}</Look>
        <P>A changeover is two DJs sharing one mixer without the room noticing. Agree the input list with the engineer, connect only what is not on air, match levels in the headphones, and keep the outgoing music alive until the new one is safely in.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Open MIX and start DJ 1’s laptop — it is on air on CH 1. Then open PREDICT: which disconnection would stop the music right now? Check your answer.</Do>
        <P>Now connect DJ 2 (PLUG): USB 2 in, CH 2’s selector to USB 2 — with CH 2’s fader DOWN. A hum appears on CH 2: read the power row.</P>
        {hot ? <Note tone="safety">{hot}</Note> : null}
        {earth ? <Note tone="safety">{earth}</Note> : null}
      </Step>
      <Step n={3}>
        <P>The hum is a ground loop: DJ 2’s charger is earthed in another circuit, and the USB lead closes the loop. Break it safely — the battery, the booth strip, or a USB isolator. Never the mains earth.</P>
        <P>Play DJ 2 with CUE 2 on and CH 2 down; set TRIM 2 until CH 2 AVG sits within 2 dB of CH 1 AVG. Then bring CH 2 up and CH 1 down — the room should never go quiet.</P>
        <Note>Talk to the engineer before you start: which channel is yours, where your level should sit, and that you will not touch the MASTER. Keep the outgoing laptop connected and playing until the new set is running.</Note>
      </Step>
      <Step n={4}>
        <Do>Predict what would stop the music, connect DJ 2 with the channel down, kill the hum safely, match levels, and change over with no gap.</Do>
        <GoalChips goals={goals.slice(0, 5)} latched={latched.slice(0, 5)} />
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow="CHECK YOURSELF"
          question="The incoming DJ’s tracks come in about 6 dB louder than the outgoing DJ’s. What should change?"
          options={['The incoming channel’s TRIM, set in the headphones before it goes on air', 'The MASTER, every time the next DJ starts', 'The engineer’s gain, once the new DJ is on', 'Nothing — louder is better at a changeover']}
          correct={0}
          explain="Each channel’s gain matches its own source; the MASTER and the engineer’s gain stay where they were agreed. Match by average level in the headphones, so the room hears no jump."
          wrong={[undefined, 'Moving the MASTER changes everything the room hears, mid-mix — and the engineer’s system was set for it.', 'The engineer’s gain is set for the whole night; a jump between DJs is the DJs’ job to avoid.', 'A sudden 6 dB jump is a shock to the room and to ears, and it eats the system’s headroom.']}
          onCorrect={() => setCheck(true)}
        />
        <FaultCard
          title="DJ 2’S LAPTOP FREEZES"
          symptom="Mid-set, the music stops dead: DJ 2’s laptop has frozen. DJ 1’s laptop is still connected; the backup stick is in deck B."
          start={() => {
            setGapNote(null);
            updateBooth((b, t) => {
              let x = withLap(b, 2, { usb: true, alive: true, charger: 'STRIP' });
              x = lapPlay(x, t, 1, true);
              x = lapPlay(x, t, 2, true, 1);
              x = withLap(x, 2, { alive: false });
              return { ...x, ch: { 1: { ...x.ch[1], input: 'USB', fader: 0, cue: false }, 2: { ...x.ch[2], input: 'USB', fader: 0.85, cue: false } } };
            });
            freezeAt.current = boothNow();
          }}
          fixed={!ev.lap2.alive && programOn(booth)}
          hints={['Read ON AIR: what is the crowd hearing? Which sources are still running?', 'DJ 1’s laptop is still playing on CH 1 — its fader is just down. And deck B holds the backup.', 'Bring CH 1 up at once (or start deck B and switch CH 2 to LINE), then sort the laptop out off air.']}
          why={`${gapNote ? `${gapNote} ` : ''}Never let the outgoing source go until the new one has run safely for a while — and keep a backup that needs no computer, cued on a channel. The quickest recovery is the one already playing.`}
          onFixed={() => {
            if (freezeAt.current != null) setGapNote(`The room was quiet for about ${Math.max(0, boothNow() - freezeAt.current).toFixed(1)} s.`);
            setFaultFixed(true);
          }}
        />
        <GoalChips goals={goals.slice(5)} latched={latched.slice(5)} />
      </Step>
    </DjRack>
  );
}

const styles = StyleSheet.create({
  tray: { gap: 10 },
  list: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});

export const P23: PageDef = { title: 'Performer changeovers and backup playback', short: 'CHANGE', Component: PageChange, manualDone: true, rack: true };
