/**
 * Screen 23 — Performer changeovers and backup playback (research DJ29, with
 * the media backups of DJ10 and the handling and power of DJ24).
 *
 * The outgoing DJ plays from a laptop on the mixer's USB 1 (CH 1); the
 * incoming DJ brings a laptop for USB 2 (CH 2) and a BACKUP stick in deck B
 * (CH 2's LINE input) — playback that needs no computer. Two computer paths,
 * so nobody unplugs the music to change over. Drawn as the event's signal-
 * flow board (art/EventFlow) with the power row under it, where a GROUND
 * LOOP (DJ 2's charger in a wall socket on another circuit) is drawn round
 * its real path: the charger cord to the wall, the building's earth to the
 * booth strip, the mixer's cord, and USB 2 back to the laptop.
 *
 * Tasks: predict which disconnection would stop the music (model/
 * djChangeover.wouldStop); connect with the channel down (retry after an
 * unplug); kill the hum SAFELY (an earth lift is refused, never applied);
 * match levels in the headphones; change over without a gap (a gap fails it
 * until it is re-armed, and says why); on your own, prove the backup needs
 * no computer; and the fault — DJ 2's laptop freezes — recovered without the
 * program stopping.
 */
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Group, Line, vec } from '@shopify/react-native-skia';
import { colors } from '../../../../theme/tokens';
import { LabChip } from '../../LabShell';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import { Scene, type Callout } from '../art/Scene';
import { Cords, FlowBoard, Tag, flowBoxes, type Cord, type FlowLink, type FlowNode, type FlowState } from '../art/EventFlow';
import { INK } from '../art/ink';
import { SceneText, useLabelMm } from '../art/sceneText';
import { DashPathEffect } from '@shopify/react-native-skia';
import type { Box } from '../geometry/boothGeometry';
import { DjRack } from '../DjRack';
import { Do, EvidenceCheck, FaultCard, GoalChips, Look, Note, P, Step, Terms, useVisitGoals } from '../bits';
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
  { term: 'USB audio', def: 'A laptop’s music reaching the mixer over its USB cable: the mixer’s USB 1 feeds CH 1 and USB 2 feeds CH 2 when that channel’s input selector is on USB. (Screen 16 shows more.)' },
  { term: 'Backup playback', def: 'A way to keep music going that does not depend on the thing most likely to fail: a stick in a player, ready on a channel, while a laptop plays.' },
  { term: 'Ground loop', def: 'Two earthed paths between pieces of gear — a charger on another circuit, and the USB or audio lead — make a loop that picks up mains hum (60 Hz, 50 Hz in many countries). Break it in the audio or USB path with an isolator (a small box that breaks the ground in the lead), or power everything from one strip, which often cures it. A charger can still whine on the same strip: then try the battery. Never remove the protective earth — the mains earth that keeps a fault from making metal live.' },
] as const;

export const GOALS_CHANGE = ['Predict what would stop the music', 'Connect with CH 2 down', 'Kill the hum safely', 'Match levels in the headphones', 'Change over with no gap', 'Recover from the frozen laptop', 'Pass the check'] as const;

const LOOK = 'You are looking at the signal-flow board: the laptops and players on the left, the mixer’s channels and mix in the middle, the outputs on the right, and the power cords below.';

/* ── the board (board units, about a millimetre) ──────────────────────── */

const FRAME: Box = { x: -22, y: -8, w: 426, h: 372 };
const TAG: Record<ChangeItem, number> = { 'lap1.usb': 1, 'lap1.charger': 2, 'lap2.usb': 3, 'deckA.stick': 4, 'deckB.stick': 5, 'mixer.power': 6, master: 7, booth: 8 };
const WALL: Box = { x: 4, y: 300, w: 112, h: 58 };
const STRIP: Box = { x: 158, y: 300, w: 200, h: 58 };
const SOCK = { wall: 40, lap1: 168, lap2: 186, mixer: 284 } as const;

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
    return l.deck.playing ? 'PLAYING' : 'READY';
  };
  const deckSub = (d: 'A' | 'B') => (!b.decks[d].track ? 'NO STICK' : b.decks[d].playing ? (d === 'B' ? 'BACKUP PLAYING' : 'PLAYING') : d === 'B' ? 'BACKUP CUED' : 'CUED');
  const nodes: FlowNode[] = [
    { id: 'lap1', x: 4, y: 6, w: 104, h: 50, title: 'LAPTOP · DJ 1', sub: lapSub(1), icon: 'laptop', state: lapState(1) },
    { id: 'deckA', x: 4, y: 70, w: 104, h: 42, title: 'DECK A', sub: deckSub('A'), icon: 'player', state: b.decks.A.playing ? 'live' : 'idle' },
    { id: 'lap2', x: 4, y: 128, w: 104, h: 50, title: 'LAPTOP · DJ 2', sub: lapSub(2), icon: 'laptop', state: hum ? 'hum' : lapState(2) },
    { id: 'deckB', x: 4, y: 192, w: 104, h: 46, title: 'DECK B', sub: deckSub('B'), icon: 'player', state: b.decks.B.playing ? 'live' : 'idle' },
    { id: 'ch1', x: 158, y: 14, w: 82, h: 66, title: 'CH 1', sub: `INPUT ${b.ch[1].input === 'USB' ? 'USB 1' : b.ch[1].input}`, tap: 'ch1', onAir: onAir(b, 1) },
    { id: 'ch2', x: 158, y: 140, w: 82, h: 66, title: 'CH 2', sub: hum ? 'HUM · USB 2' : `INPUT ${b.ch[2].input === 'USB' ? 'USB 2' : b.ch[2].input}`, tap: 'ch2', onAir: onAir(b, 2), state: hum ? 'hum' : undefined },
    { id: 'bus', x: 262, y: 70, w: 44, h: 104, title: 'MIX', tap: 'bus' },
    { id: 'pa', x: 320, y: 10, w: 80, h: 46, title: 'PA', icon: 'speaker', tap: 'crowd' },
    { id: 'mon', x: 320, y: 76, w: 80, h: 46, title: 'BOOTH', icon: 'monitor', tap: 'booth' },
    { id: 'ph', x: 320, y: 142, w: 80, h: 46, title: 'PHONES', icon: 'phones', tap: 'phonesL' },
    { id: 'wall', ...WALL, title: 'WALL SOCKET', sub: 'ANOTHER CIRCUIT', icon: 'wall', sockets: [SOCK.wall], state: hum ? 'hum' : undefined },
    { id: 'strip', ...STRIP, title: 'BOOTH STRIP', sub: 'ALSO THE DECKS · PA · BOOTH', icon: 'strip', sockets: [SOCK.lap1, SOCK.lap2, SOCK.mixer] },
  ];
  const links: FlowLink[] = [
    { from: 'lap1', to: 'ch1', state: !ev.lap1.usb ? 'idle' : b.ch[1].input === 'USB' && ev.lap1.alive && ev.lap1.deck.playing ? 'live' : 'idle', label: 'USB 1', tag: TAG['lap1.usb'], toY: 31 },
    { from: 'deckA', to: 'ch1', state: b.ch[1].input === 'LINE' && b.decks.A.playing ? 'live' : 'idle', label: 'LINE', toY: 70 },
    { from: 'lap2', to: 'ch2', state: !ev.lap2.usb ? 'idle' : hum ? 'hum' : b.ch[2].input === 'USB' && ev.lap2.alive && ev.lap2.deck.playing ? 'live' : 'idle', label: ev.lap2.isolator ? 'USB 2\nISOLATOR' : 'USB 2', tag: TAG['lap2.usb'], toY: 153 },
    { from: 'deckB', to: 'ch2', state: b.ch[2].input === 'LINE' && b.decks.B.playing ? 'live' : 'idle', label: 'LINE', toY: 194 },
    { from: 'ch1', to: 'bus', state: onAir(b, 1) ? 'live' : 'idle', toY: 100 },
    { from: 'ch2', to: 'bus', state: onAir(b, 2) ? (hum ? 'hum' : 'live') : 'idle', toY: 146 },
    { from: 'bus', to: 'pa', state: programOn(b) ? 'live' : 'idle', fromY: 96 },
    { from: 'bus', to: 'mon', state: 'live', fromY: 122 },
    { from: 'bus', to: 'ph', state: 'live', fromY: 148 },
  ];
  const v = (it: ChangeItem) => (verdict ? (verdict[it] ? 'right' : 'wrong') : null) as 'right' | 'wrong' | null;
  const tags: Record<string, { num: number; verdict?: 'right' | 'wrong' | null }> = {
    deckA: { num: TAG['deckA.stick'], verdict: v('deckA.stick') },
    deckB: { num: TAG['deckB.stick'], verdict: v('deckB.stick') },
    strip: { num: TAG['mixer.power'], verdict: v('mixer.power') },
    pa: { num: TAG.master, verdict: v('master') },
    mon: { num: TAG.booth, verdict: v('booth') },
  };
  for (const it of ['lap1.usb', 'lap2.usb'] as ChangeItem[]) tags[`link:${TAG[it]}`] = { num: TAG[it], verdict: v(it) };
  // ONE cord per device, each in its own lane; DJ 2's charger goes to the
  // wall (another circuit), to the strip, or nowhere (the battery)
  const top = STRIP.y + 5;
  const cords: Cord[] = [{ id: 'lap1', pts: [[4, 44], [-8, 44], [-8, 280], [SOCK.lap1, 280], [SOCK.lap1, top]] }];
  if (ev.lap2.charger === 'WALL') cords.push({ id: 'lap2', pts: [[4, 166], [-15, 166], [-15, 288], [SOCK.wall, 288], [SOCK.wall, WALL.y + 5]], tone: hum ? 'hum' : 'plain' });
  else if (ev.lap2.charger === 'STRIP') cords.push({ id: 'lap2', pts: [[4, 166], [-3, 166], [-3, 272], [SOCK.lap2, 272], [SOCK.lap2, top]] });
  cords.push({ id: 'mixer', pts: [[SOCK.mixer, 174], [SOCK.mixer, top]], tone: hum ? 'hum' : 'plain' });
  return { nodes, links, tags, cords, chargerTag: v('lap1.charger') };
}

/** The building's earth between the two outlets (always there; amber when
 *  it closes the ground loop), and the charger's prediction tag on DJ 1's
 *  cord. */
function BoardExtras({ hum, chargerVerdict }: { hum: boolean; chargerVerdict: 'right' | 'wrong' | null }) {
  const lm = useLabelMm(9);
  const y = WALL.y + WALL.h / 2 + 6;
  return (
    <Group>
      <Line p1={vec(WALL.x + WALL.w, y)} p2={vec(STRIP.x, y)} color={hum ? INK.amber : '#555a63'} strokeWidth={hum ? 2 : 1.4}>
        <DashPathEffect intervals={[3, 2.5]} />
      </Line>
      <SceneText x={(WALL.x + WALL.w + STRIP.x) / 2} y={y - 3} size={lm} text="EARTH" color={hum ? INK.amber : INK.printDim} face="label" align="center" />
      <Tag x={124} y={280} num={TAG['lap1.charger']} verdict={chargerVerdict} />
    </Group>
  );
}

/* ── the trays ───────────────────────────────────────────────────────── */

function PlugTray({ onHot, onEarth, onUnplug2 }: { onHot: (w: string | null) => void; onEarth: (w: string | null) => void; onUnplug2: () => void }) {
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
        <LabChip
          label={l2.usb ? 'USB 2: CONNECTED (UNPLUG)' : 'CONNECT USB 2'}
          selected={l2.usb}
          onPress={() => {
            const g = getBooth();
            if (l2.usb) onUnplug2();
            else onHot(g.ch[2].input === 'USB' && g.ch[2].fader > 0.02 ? 'HOT — a source plugged in on a channel that is up. Fader DOWN first. Unplug USB 2, pull CH 2 down and connect again.' : null);
            updateBooth((x) => withLap(x, 2, { usb: !evOf(x).lap2.usb }));
          }}
          compact
        />
        <LabChip label={l2.isolator ? 'USB ISOLATOR IN' : 'NO ISOLATOR'} selected={l2.isolator} onPress={() => updateBooth((x) => withLap(x, 2, { isolator: !evOf(x).lap2.isolator }))} compact />
      </Row>
      <TrayNote tone="fine">A USB isolator breaks the ground in the USB lead. Check it supports your interface’s USB speed — many run only at the slower one.</TrayNote>
      <Row head="DJ 1’S LAPTOP → THE MIXER’S USB 1">
        <LabChip label={ev.lap1.usb ? 'USB 1: CONNECTED (UNPLUG)' : 'CONNECT USB 1'} selected={ev.lap1.usb} onPress={() => updateBooth((x) => withLap(x, 1, { usb: !evOf(x).lap1.usb }))} compact />
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
      {verdict ? (
        <TrayNote tone={verdict.right ? undefined : 'warn'}>
          {verdict.right
            ? 'Right. Only what feeds the room NOW matters: the on-air laptop’s USB, the mixer’s power and the MASTER lines. A charger is not a source — the battery carries on — though on many laptops the change of power mode can cause a click or dropouts, so leave the on-air laptop’s charger alone. The idle sources are not on air, and the booth feeds only you.'
            : 'Not yet — the ✗ ones are wrong. Ask of each: does the crowd’s music pass through it right now?'}
        </TrayNote>
      ) : null}
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
  const { ready } = useScreenSetup((b) => {
    // deck B holds DJ 2's backup copy, cued, at laptop 1's tempo
    let x = cueAtBar(b, 'B', 'glassHarbour', 17);
    x = { ...x, decks: { A: { ...x.decks.A, track: null, playing: false }, B: { ...x.decks.B, pitch: pitchFor(TRACKS.glassHarbour.bpm, TRACKS.nightFerry.bpm), keyLock: true } } };
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
  // the backup proof (on your own): armed once deck B is on air and USB 1 is still in
  const backupArmed = useRef(false);
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
  const backupOnAir = onAir(booth, 2) && sourceOf(booth, 2)?.kind === 'deck';
  if (backupOnAir && ev.lap1.usb && programOn(booth)) backupArmed.current = true;
  if (!programOn(booth)) backupArmed.current = false;
  const backupProved = backupArmed.current && !ev.lap1.usb && backupOnAir && programOn(booth) && !!last && last.rmsDb.crowd > -45;
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
  const latched = useVisitGoals(ctx, goals, 'CHANGE', ready);
  const board = boardOf(booth, hum, verdict?.perItem ?? null);
  // the loop's cause: DJ 2's charger cord to the wall (its vertical run)
  const callouts: Callout[] = hum ? [{ id: 'gl', text: 'GROUND LOOP · HUM', at: { x: -15, y: 250 }, dx: 26, dy: 4, tone: 'amber' }] : [];

  return (
    <DjRack
      spec={{
        render: (w, h) => (
          <Scene w={w} h={h} frame={FRAME} motion={motion} focus={{ x: 0, y: 130, w: 250, h: 170 }} a11y={`${LOOK} ${programOn(booth) ? 'The crowd hears music.' : 'The crowd hears nothing.'}${hum ? ' There is a ground-loop hum on CH 2: DJ 2’s charger is in a wall socket on another circuit.' : ''}`} obstacles={flowBoxes(board.nodes)} callouts={callouts}>
            <Cords cords={board.cords} />
            <BoardExtras hum={hum} chargerVerdict={board.chargerTag} />
            <FlowBoard nodes={board.nodes} links={board.links} tags={board.tags} />
          </Scene>
        ),
        bezel: [
          { k: 'ON AIR', v: onAir(booth, 1) && onAir(booth, 2) ? 'DJ 1 + DJ 2' : onAir(booth, 1) ? (sourceOf(booth, 1)?.kind === 'lap' ? 'DJ 1' : 'CH 1') : onAir(booth, 2) ? (sourceOf(booth, 2)?.kind === 'lap' ? 'DJ 2' : 'BACKUP') : 'NOTHING', tint: programOn(booth) ? colors.red : colors.textSub },
          { k: 'CH 1 AVG', v: ch1.avg == null ? '—' : ch1.avg.toFixed(1), sub: 'dBFS', tint: colors.amber },
          { k: 'CH 2 AVG', v: ch2.avg == null ? '—' : ch2.avg.toFixed(1), sub: 'dBFS', tint: ch1.avg != null && ch2.avg != null && Math.abs(ch1.avg - ch2.avg) <= 2 ? colors.green : colors.amber },
          { k: 'HUM', v: hum ? 'ON CH 2' : 'NONE', sub: hum ? '60 Hz' : undefined, tint: hum ? PEAK_RED : colors.green },
        ],
        params: [
          trimKey(booth, 2),
          { kind: 'group', id: 'plug', label: 'PLUG', valueLabel: ev.lap2.usb ? 'USB 2 IN' : 'NOT IN', render: () => <PlugTray onHot={setHot} onEarth={setEarth} onUnplug2={() => { hotSeen.current = false; setHot(null); }} /> },
          { kind: 'group', id: 'predict', label: 'PREDICT', valueLabel: verdict ? (verdict.right ? 'RIGHT' : 'RETRY') : `${marked.size} OF 8`, render: () => <PredictTray marked={marked} setMarked={(s) => { setMarked(s); setVerdict(null); }} onCheck={() => setVerdict(gradePrediction(getBooth(), marked))} verdict={verdict} /> },
          { kind: 'group', id: 'mix', label: 'MIX', valueLabel: programOn(booth) ? 'ON AIR' : 'SILENT', render: () => <MixTray tr={tr} req={() => void audio.requestSound()} /> },
          stopKey(tr),
        ],
        initialParam: 'trim2',
      }}
    >
      <Step n={1}>
        <Look>{LOOK}</Look>
        <P>A changeover is two DJs sharing one mixer without the room noticing. Each laptop’s music reaches the mixer over its USB cable, on the channel whose input selector is set to USB (Screen 16 shows more). Agree the input list, connect only what is not on air, match levels in the headphones, and keep the outgoing music alive until the new one is in.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Open MIX and start DJ 1’s laptop — it is on air on CH 1. Then open PREDICT: which disconnection would stop the music right now? Check your answer.</Do>
        <P>Now connect DJ 2 (PLUG): USB 2 in, CH 2’s selector to USB 2 — with CH 2’s fader DOWN. A 60 Hz hum appears on CH 2 (50 Hz in many countries): follow its loop on the board.</P>
        {hot ? <Note tone="safety">{`${hot}${hot.includes('Unplug USB 2') ? '' : ' To try again: unplug USB 2, pull CH 2 down and connect again.'}`}</Note> : null}
        {earth ? <Note tone="safety">{earth}</Note> : null}
      </Step>
      <Step n={3}>
        <P>The hum is a ground loop: DJ 2’s charger is earthed in another circuit, the building’s earth joins it to the booth strip, the mixer is on that strip, and the USB lead closes the loop. Break it safely — the battery, the booth strip, or a USB isolator. Never the mains earth.</P>
        <P>Play DJ 2 with CUE 2 on and CH 2 down; set TRIM 2 until CH 2 AVG sits within 2 dB of CH 1 AVG. Then bring CH 2 up and CH 1 down — the room should never go quiet.</P>
        {trans.current.failed ? <Note tone="try">{`${trans.current.failed} Bring CH 1 back up and CH 2 down to try again.`}</Note> : null}
        <Note>Talk to the engineer before you start: which channel is yours, where your level should sit, and that you will not touch the MASTER. Many changeovers are a mix: agree the last track, and the incoming DJ beatmatches into it from their own channel. Keep the outgoing laptop connected and playing until the new set is running.</Note>
      </Step>
      <Step n={4}>
        <Do>Predict what would stop the music, connect DJ 2 with the channel down, kill the hum safely, match levels, and change over with no gap.</Do>
        <GoalChips goals={goals.slice(0, 5)} latched={latched.slice(0, 5)} />
      </Step>
      <Step n={5}>
        <EvidenceCheck
          task="prove the backup needs no computer. With DJ 1’s laptop on air, put the backup stick (deck B, CH 2 on LINE) on air with no gap, take CH 1 down — then unplug USB 1. The music must not stop."
          start={() => {
            void audio.requestSound();
            backupArmed.current = false;
            updateBooth((b, t) => {
              let x = withLap(b, 1, { usb: true, alive: true });
              x = withLap(x, 2, { usb: false });
              if (!evOf(x).lap1.deck.playing) x = lapPlay(x, t, 1, true);
              x = cueAtBar(x, 'B', 'glassHarbour', 17);
              return { ...x, ch: { 1: { ...x.ch[1], input: 'USB', fader: 0.85 }, 2: { ...x.ch[2], input: 'LINE', fader: 0, cue: true } } };
            });
          }}
          met={backupProved}
          progress={backupArmed.current ? 'The backup is on air — now unplug USB 1 (PLUG).' : ev.lap1.usb ? null : 'USB 1 is out — the backup must be on air BEFORE the laptop goes.'}
          explain="The stick plays with no computer at all: a frozen or unplugged laptop cannot stop it. It would NOT save you from the mixer’s power or the MASTER cables — every source goes through those."
          onMet={() => setCheck(true)}
        />
        <FaultCard
          title="DJ 2’S LAPTOP FREEZES"
          symptom="Mid-set, the music stops dead: DJ 2’s laptop has frozen. DJ 1’s laptop is still connected; the backup stick is in deck B."
          start={() => {
            setGapNote(null);
            updateBooth((b, t) => {
              let x = withLap(b, 2, { usb: true, alive: true, charger: 'STRIP' });
              x = withLap(x, 1, { usb: true });
              x = lapPlay(x, t, 1, true);
              x = lapPlay(x, t, 2, true, 1);
              x = withLap(x, 2, { alive: false });
              return { ...x, ch: { 1: { ...x.ch[1], input: 'USB', fader: 0, cue: false }, 2: { ...x.ch[2], input: 'USB', fader: 0.85, cue: false } } };
            });
            freezeAt.current = boothNow();
          }}
          fixed={!ev.lap2.alive && programOn(booth)}
          hints={['Read ON AIR: what is the crowd hearing? Which sources are still running?', 'Look at the board: which source is still playing, with its channel down?', 'Open MIX: the quickest recovery is a source that is already running.']}
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
