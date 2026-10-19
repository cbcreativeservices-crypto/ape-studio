/**
 * Screen 19 — Microphones, announcements and talkover (research DJ23).
 *
 * A dynamic mic, a condenser and a wireless set into THIS mixer's front
 * panel: MIC 1 (the only input with +48 V phantom — phantom belongs to the
 * input) and MIC 2; gain, level, the ON mute, TALK OVER (a voice-keyed dip
 * of the music) and the mic's sends to the BOOTH and the RECORD output (the
 * MASTER always carries it). Two views of one booth: the MIXER (the front
 * panel, the mic and its cable, the feed meters and the music's dip) and the
 * ROOM (where the mic is, its cardioid pickup, every speaker that can feed
 * back into it, and the loop margin from model/djEvent.feedbackOf).
 *
 * The fault: the room hears the announcement, the recording does not (the
 * mic is not sent to REC — a common factory default). Feedback is modelled
 * and kept SAFE: the lab plays only a quiet, capped stand-in of a ring.
 */
import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Group, Line, LinearGradient, Rect, RoundedRect, vec } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import { colors, fonts } from '../../../../theme/tokens';
import { LabChip } from '../../LabShell';
import { UnderstandingCheck } from '../../tuning/components/check';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import { Scene, type Callout } from '../art/Scene';
import { HandheldMic, MicXlrPlug, MixerFront, ReceiverRear, FRONT, frontPartBox, RX_JACKS, RX_W, RX_H, type FrontPart } from '../art/MicGear';
import { HeatLegend, PlanView, PLAN_STAGE, planAt, planObstacles } from '../art/PlanView';
import { CableRun } from '../art/cables';
import { LedColumn } from '../art/parts';
import { useTapDb } from '../art/motion';
import { useDuckDb, useExtTapDb } from '../art/eventMotion';
import { INK } from '../art/ink';
import { SceneText, useLabelMm } from '../art/sceneText';
import type { Box } from '../geometry/boothGeometry';
import { DjRack } from '../DjRack';
import { Do, FaultCard, GoalChips, Look, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { stopKey, type Transport } from '../dock';
import { getBooth, updateBooth } from '../booth/boothStore';
import { cueAtBar, useScreenSetup } from '../booth/setup';
import { connect, type Booth } from '../model/djModel';
import {
  MIC_INPUTS,
  MIC_POS,
  duckDepthDb,
  evOf,
  feedbackOf,
  micAlive,
  micGainDb,
  micGainKnob,
  micGainPos,
  micInputOverload,
  phantomPop,
  withMic,
  type MicDevice,
  type MicInput,
  type MicPos,
} from '../model/djEvent';
import { announce, announcing, dbCell, EventListen, extPeak, hadSpeech, musicOn, Row, TrayNote, useEventKit, voiceCell, voiceIn, withFreshEvent } from './eventShared';

const TERMS = [
  { term: 'Phantom power (+48 V)', def: 'A small DC voltage some inputs send up the mic cable to power a condenser mic. It belongs to the INPUT: on this mixer only MIC 1 has it. A dynamic mic needs none.' },
  { term: 'Talkover (ducking)', def: 'Dips the music while you speak, so the voice sits on top. Here it listens to the mic and comes back up when you stop. Real mixers differ: some dip whenever the mic is on.' },
  { term: 'Feedback', def: 'The speakers play the mic, the mic hears the speakers, round and round. When that loop gains 0 dB or more it rings by itself and keeps growing — pull the mic level down at once.' },
  { term: 'Mic send', def: 'Which outputs carry the mic. MASTER always does here; BOOTH and REC only when their switch is on. Many mixers leave the mic OUT of the booth and the record output until you switch it in.' },
] as const;

export const GOALS_MIC = ['Mic live: speech peaks −10 … −3 dBFS', 'Talk over: the music dips, then recovers', 'Power a condenser from the right input', 'Make it ring, then win back 6 dB', 'Fix the voiceless recording', 'Pass the check'] as const;

const LOOK_MIXER = 'You are looking at the front of the mixer (MIC 2, the headphone jacks, MIC 1 with its +48 V switch, and the mic channel’s controls), the microphone on its cable, the music’s dip while you talk, and four meters: the mic, and the three feeds — crowd, booth and recorder.';
const LOOK_ROOM = 'You are looking down on the room: the booth table, the DJ’s listening point, the two PA tops with their coverage edges, the booth monitors, and the mic with its pickup pattern drawn round it — the dashed lines are the speakers it can hear.';

/* ── the stage ───────────────────────────────────────────────────────── */

const FRAME: Box = { x: 0, y: 0, w: 340, h: 240 };
const MET = { y: 14, h: 126, w: 7, xs: [8, 25, 42, 59] as const };
const MET_NAMES = ['MIC', 'CROWD', 'BOOTH', 'REC'] as const;
const FRONT_AT = { x: 40, y: 174 };
const MIC_AT = { x: 104, y: 58, ang: 0.12 };
const WMIC_AT = { x: 96, y: 36, ang: 0 };
const RX_AT = { x: 104, y: 96 };
const DIP = { x: 100, y: 152, w: 168 };

const jackAt = (inp: MicInput): { x: number; y: number } | null =>
  inp === 'MIC1' ? { x: FRONT_AT.x + FRONT.mic1.x, y: FRONT_AT.y + FRONT.mic1.y } : inp === 'MIC2' ? { x: FRONT_AT.x + FRONT.mic2.x, y: FRONT_AT.y + FRONT.mic2.y } : null;

/** The mic's tail (scene mm) where its cable leaves. */
const tailAt = () => ({ x: MIC_AT.x + Math.cos(MIC_AT.ang) * 182, y: MIC_AT.y + Math.sin(MIC_AT.ang) * 182 });

function MicCable({ inp, wireless, live }: { inp: MicInput; wireless: boolean; live: boolean }) {
  const j = jackAt(inp);
  const start = wireless ? { x: RX_AT.x + RX_JACKS.out.x, y: RX_AT.y + RX_JACKS.out.y } : (() => { const t = tailAt(); return { x: t.x + 44 * Math.cos(MIC_AT.ang), y: t.y + 44 * Math.sin(MIC_AT.ang) }; })();
  const lane = 162;
  const pts: [number, number][] = j
    ? wireless
      ? [[start.x, start.y], [start.x, lane], [j.x, lane], [j.x, j.y]]
      : [[start.x, start.y], [start.x + 6, start.y + 16], [start.x + 4, lane - 18], [start.x - 6, lane], [j.x, lane], [j.x, j.y]]
    : wireless
      ? [[start.x, start.y], [start.x, lane - 4], [start.x - 40, lane + 2]]
      : [[start.x, start.y], [start.x + 6, start.y + 26], [start.x - 4, lane - 8]];
  return <CableRun r={{ id: 'mic', kind: 'xlr', colour: '#3d4046', pts, plugged: !!j, live, label: 'MIC', noFixedPlug: !wireless }} labelAt={j ? [Math.min(start.x, j.x) + Math.abs(start.x - j.x) / 2, lane] : undefined} />;
}

function Meters({ voice }: { voice: readonly boolean[] }) {
  const mic = useExtTapDb('mic');
  const micH = useExtTapDb('mic', 'hold');
  const crowd = useTapDb('crowd');
  const crowdH = useTapDb('crowd', 'hold');
  const booth = useTapDb('booth');
  const boothH = useTapDb('booth', 'hold');
  const recL = useExtTapDb('recL');
  const recH = useExtTapDb('recL', 'hold');
  return (
    <Group>
      <LedColumn x={MET.xs[0]} y={MET.y} w={MET.w} h={MET.h} level={mic} hold={micH} />
      <LedColumn x={MET.xs[1]} y={MET.y} w={MET.w} h={MET.h} level={crowd} hold={crowdH} />
      <LedColumn x={MET.xs[2]} y={MET.y} w={MET.w} h={MET.h} level={booth} hold={boothH} />
      <LedColumn x={MET.xs[3]} y={MET.y} w={MET.w} h={MET.h} level={recL} hold={recH} />
      <MeterNames voice={voice} />
    </Group>
  );
}

/** The meter bridge's names, printed up each column's right side at 9 pt
 *  (they grow with the full-screen zoom). */
function MeterNames({ voice }: { voice: readonly boolean[] }) {
  const lm = useLabelMm(9);
  return (
    <Group>
      {MET.xs.map((x, i) => (
        <Group key={x} transform={[{ translateX: x + MET.w + 2 + lm * 0.78 }, { translateY: MET.y + MET.h }, { rotate: -Math.PI / 2 }]}>
          <SceneText x={0} y={0} size={lm} text={MET_NAMES[i]} color={voice[i] ? INK.green : INK.print} face="label" minPt={8.9} />
        </Group>
      ))}
    </Group>
  );
}

/** The music's dip while you talk: a bar that grows leftward from 0 dB, with
 *  its scale (the talkover's real gain, block by block). */
function DipBar() {
  const duck = useDuckDb();
  const lm = useLabelMm(9);
  const w = useDerivedValue(() => Math.min(1, -duck.value / 24) * DIP.w);
  const x = useDerivedValue(() => DIP.x + DIP.w - w.value);
  return (
    <Group>
      <RoundedRect x={DIP.x - 1} y={DIP.y - 4.5} width={DIP.w + 2} height={9} r={2} color="#050506" />
      <Rect x={x} y={DIP.y - 3.5} width={w} height={7}>
        <LinearGradient start={vec(DIP.x, 0)} end={vec(DIP.x + DIP.w, 0)} colors={['#ff8a3d', INK.amber]} />
      </Rect>
      {[0, 6, 12, 18, 24].map((d) => (
        <Line key={d} p1={vec(DIP.x + DIP.w - (d / 24) * DIP.w, DIP.y + 5)} p2={vec(DIP.x + DIP.w - (d / 24) * DIP.w, DIP.y + 8)} color={INK.printDim} strokeWidth={0.6} />
      ))}
      <SceneText x={DIP.x + DIP.w} y={DIP.y + 8 + lm} size={lm} text="0" color={INK.printDim} face="label" align="center" minPt={8.9} />
      <SceneText x={DIP.x} y={DIP.y + 8 + lm} size={lm} text="−24 dB" color={INK.printDim} face="label" align="center" minPt={8.9} />
    </Group>
  );
}

function MixerView({ booth, live, voiceLive, voice }: { booth: Booth; live: boolean; voiceLive: boolean; voice: readonly boolean[] }) {
  const m = evOf(booth).mic;
  const wireless = m.device === 'WIRELESS';
  const t = tailAt();
  return (
    <Group>
      <Meters voice={voice} />
      <DipBar />
      <MixerFront x={FRONT_AT.x} y={FRONT_AT.y} mic={m} highlight={hiFront(booth)} />
      {wireless ? (
        <Group>
          <ReceiverRear x={RX_AT.x} y={RX_AT.y} rxOut={m.rxOut} on={live} />
          <HandheldMic x={WMIC_AT.x} y={WMIC_AT.y} ang={WMIC_AT.ang} device="WIRELESS" live={live} />
        </Group>
      ) : (
        <Group>
          <HandheldMic x={MIC_AT.x} y={MIC_AT.y} ang={MIC_AT.ang} device={m.device} live={live} />
          <MicXlrPlug x={t.x} y={t.y} ang={MIC_AT.ang} />
        </Group>
      )}
      <MicCable inp={m.input} wireless={wireless} live={voiceLive} />
    </Group>
  );
}

/** What to ring on the front panel now. */
function hiFront(b: Booth): FrontPart[] {
  const m = evOf(b).mic;
  if (m.input === 'NONE') return ['mic1', 'mic2'];
  const out: FrontPart[] = [m.input === 'MIC2' ? 'gain2' : 'gain1'];
  if (m.device === 'CONDENSER' && !micAlive(m)) out.push('phantom');
  if (!m.on) out.push('on');
  return out;
}

/* ── the trays ───────────────────────────────────────────────────────── */

function MicTray({ onPop }: { onPop: (pop: boolean) => void }) {
  const b = getBooth();
  const m = b.ev!.mic;
  const set = (patch: Parameters<typeof withMic>[1]) => updateBooth((x) => withMic(x, patch));
  const step = (d: number) => set({ level: Math.max(0, Math.min(1, Math.round((m.level + d) * 20) / 20)) });
  return (
    <View style={styles.tray}>
      <Row head="PLUG THE MIC CABLE INTO">
        {(['MIC1', 'MIC2', 'NONE'] as const).map((k) => (
          <LabChip key={k} label={k === 'NONE' ? 'UNPLUG' : `${MIC_INPUTS[k].label}${MIC_INPUTS[k].phantom ? ' (+48 V)' : ''}`} selected={m.input === k} onPress={() => set({ input: k })} compact />
        ))}
      </Row>
      <Row head="WHICH MICROPHONE">
        {(['DYNAMIC', 'CONDENSER', 'WIRELESS'] as const).map((d: MicDevice) => (
          <LabChip key={d} label={d} selected={m.device === d} onPress={() => set({ device: d })} compact />
        ))}
      </Row>
      {m.device === 'WIRELESS' ? (
        <Row head="RECEIVER OUTPUT LEVEL (its rear switch)">
          {(['MIC', 'LINE'] as const).map((o) => (
            <LabChip key={o} label={o} selected={m.rxOut === o} onPress={() => set({ rxOut: o })} compact />
          ))}
        </Row>
      ) : null}
      <Row head="MIC 1 PHANTOM POWER">
        <LabChip
          label={m.phantom ? '+48 V ON' : '+48 V OFF'}
          selected={m.phantom}
          onPress={() => {
            onPop(phantomPop(getBooth().ev!.mic));
            set({ phantom: !m.phantom });
          }}
          compact
        />
      </Row>
      <Row head={`MIC CHANNEL · LEVEL ${Math.round(m.level * 100)}%`}>
        <LabChip label={m.on ? 'MIC ON ●' : 'MIC OFF'} selected={m.on} onPress={() => set({ on: !m.on })} compact />
        <LabChip label="LEVEL −" selected={false} onPress={() => step(-0.05)} compact />
        <LabChip label="LEVEL +" selected={false} onPress={() => step(0.05)} compact />
      </Row>
    </View>
  );
}

function RouteTray({ setView }: { setView: (v: 'MIXER' | 'ROOM') => void }) {
  const b = getBooth();
  const m = b.ev!.mic;
  const set = (patch: Parameters<typeof withMic>[1]) => updateBooth((x) => withMic(x, patch));
  const depths = [0, 1 / 3, 2 / 3, 1];
  return (
    <View style={styles.tray}>
      <Row head="TALK OVER (dips the music while you speak)">
        <LabChip label={m.talkover ? 'TALK OVER ON' : 'TALK OVER OFF'} selected={m.talkover} onPress={() => set({ talkover: !m.talkover })} compact />
        {depths.map((d) => (
          <LabChip key={d} label={`${duckDepthDb(d).toFixed(0)} dB`} selected={Math.abs(m.depth - d) < 0.02} onPress={() => set({ depth: d })} compact />
        ))}
      </Row>
      <Row head="MIC SENDS (MASTER always carries the mic)">
        <LabChip label={m.toBooth ? 'MIC → BOOTH ON' : 'MIC → BOOTH OFF'} selected={m.toBooth} onPress={() => set({ toBooth: !m.toBooth })} compact />
        <LabChip label={m.toRec ? 'MIC → REC ON' : 'MIC → REC OFF'} selected={m.toRec} onPress={() => set({ toRec: !m.toRec })} compact />
      </Row>
      <Row head="WHERE IS THE MIC (shows the room)">
        {(['DECKS', 'MONITOR', 'FLOOR'] as const).map((p: MicPos) => (
          <LabChip
            key={p}
            label={MIC_POS[p].label}
            selected={m.pos === p}
            onPress={() => {
              set({ pos: p });
              setView('ROOM');
            }}
            compact
          />
        ))}
      </Row>
      <TrayNote>{MIC_POS[m.pos].blurb}</TrayNote>
      <Row head={`BOOTH LEVEL ${Math.round(b.mixer.booth * 100)}%`}>
        <LabChip label="BOOTH −" selected={false} onPress={() => updateBooth((x) => ({ ...x, mixer: { ...x.mixer, booth: Math.max(0, Math.round((x.mixer.booth - 0.05) * 20) / 20) } }))} compact />
        <LabChip label="BOOTH +" selected={false} onPress={() => updateBooth((x) => ({ ...x, mixer: { ...x.mixer, booth: Math.min(1, Math.round((x.mixer.booth + 0.05) * 20) / 20) } }))} compact />
      </Row>
      <Row head="SEE">
        <LabChip label="THE MIXER" selected={false} onPress={() => setView('MIXER')} compact />
        <LabChip label="THE ROOM" selected={false} onPress={() => setView('ROOM')} compact />
      </Row>
    </View>
  );
}

function TalkTray({ tr, lead }: { tr: Transport; lead: () => number }) {
  const b = getBooth();
  const music = musicOn(b);
  return (
    <View style={styles.tray}>
      <Row head="THE MUSIC">
        <LabChip label={`${b.decks.A.playing ? '❚❚ PAUSE' : '▶ PLAY'} A`} selected={b.decks.A.playing} onPress={() => tr.toggle('A')} compact />
        {tr.soundDeclined ? <LabChip label="TURN SOUND ON" selected={false} onPress={tr.soundOn} compact /> : null}
      </Row>
      <Row head="THE ANNOUNCEMENT (about 4 seconds)">
        <LabChip label={music ? '● TALK NOW' : 'PLAY THE MUSIC FIRST'} selected={announcing(b)} onPress={() => (music ? announce(lead()) : tr.play('A'))} />
      </Row>
      <TrayNote tone="fine">The lab’s voice is a synthesised speech-like sound — rhythm, pitch and syllables, no words.</TrayNote>
      <EventListen />
    </View>
  );
}

/* ── the page ────────────────────────────────────────────────────────── */

function PageMic({ ctx }: { ctx: PageCtx }) {
  const { booth, audio, tr, motion, last } = useEventKit();
  useScreenSetup((b) => {
    let x = cueAtBar(b, 'A', 'nightFerry', 17);
    x = { ...x, ch: { 1: { ...x.ch[1], fader: 0.85, xf: 'THRU', cue: false }, 2: { ...x.ch[2], fader: 0, cue: false } }, mixer: { ...x.mixer, master: 0.6, booth: 0.45, xf: 0.5 }, perspective: 'CROWD' };
    return withFreshEvent(x, (ev) => ({ ...ev, rec: { tap: 'REC_OUT', gain: 0.5, armedAt: null } }));
  });
  const [view, setView] = useState<'MIXER' | 'ROOM'>('MIXER');
  const [pop, setPop] = useState(false);
  const [check, setCheck] = useState(false);
  const [faultFixed, setFaultFixed] = useState(false);
  const ev = evOf(booth);
  const ringSeen = useRef(false);
  const dipped = useRef(false);
  const m = ev.mic;
  const fb = feedbackOf(booth);
  if (fb.state === 'RINGING' && m.on) ringSeen.current = true;
  const micPk = extPeak(last, 'mic', true);
  const speaking = hadSpeech(last);
  const clean = !!last && last.ext.clipped.micPre === 0 && last.ext.clipped.micInput === 0;
  const dip = last ? last.ext.duckMinDb : 0;
  const recovered = !!last && last.ext.duckDb.length > 0 && last.ext.duckDb[last.ext.duckDb.length - 1] > -1;
  if (m.talkover && speaking && dip <= -6 && booth.decks.A.playing) dipped.current = true;
  const hits = [
    speaking && micPk != null && micPk >= -10 && micPk <= -3 && clean,
    dipped.current && recovered,
    m.device === 'CONDENSER' && micAlive(m) && speaking && micPk != null && micPk > -40,
    ringSeen.current && m.on && fb.marginDb >= 6,
    faultFixed,
    check,
  ];
  const goals = GOALS_MIC.map((label, i) => ({ label, hit: hits[i] }));
  const latched = useVisitGoals(ctx, goals, 'MIC');
  const live = micAlive(m) && m.on;
  const voiceLive = live && speaking;
  const gainDb = micGainDb(micGainKnob(m));
  const overload = micInputOverload(m);

  const mixerCallouts: Callout[] = [
    { id: 'm1', text: m.phantom ? 'MIC 1 · +48 V ON' : 'MIC 1 · +48 V', at: { x: FRONT_AT.x + FRONT.mic1.x, y: FRONT_AT.y + FRONT.mic1.y + 11 }, dx: 0, dy: 16, tone: m.input === 'MIC1' ? 'amber' : 'plain' },
    { id: 'm2', text: 'MIC 2 · NO +48 V', at: { x: FRONT_AT.x + FRONT.mic2.x, y: FRONT_AT.y + FRONT.mic2.y + 10 }, dx: 0, dy: 16, tone: m.input === 'MIC2' ? 'amber' : 'plain' },
    { id: 'g', text: m.input === 'NONE' ? 'GAIN' : `GAIN ${m.input === 'MIC2' ? '2' : '1'} +${gainDb.toFixed(0)} dB`, at: { x: FRONT_AT.x + (m.input === 'MIC2' ? FRONT.gain2.x : FRONT.gain1.x), y: FRONT_AT.y + FRONT.gain1.y - 7 }, dx: 0, dy: -18 },
    { id: 'on', text: m.on ? 'MIC ON' : 'MIC OFF', at: { x: FRONT_AT.x + FRONT.on.x + FRONT.on.w / 2, y: FRONT_AT.y + FRONT.on.y }, dx: 0, dy: -16, tone: m.on ? 'red' : 'plain' },
    { id: 'to', text: m.talkover ? 'TALK OVER ON' : 'TALK OVER', at: { x: FRONT_AT.x + FRONT.talk.x + FRONT.talk.w / 2, y: FRONT_AT.y + FRONT.talk.y }, dx: 14, dy: -16, tone: m.talkover ? 'amber' : 'plain' },
    { id: 'snd', text: `SEND: BOOTH ${m.toBooth ? 'ON' : 'OFF'} · REC ${m.toRec ? 'ON' : 'OFF'}`, at: { x: FRONT_AT.x + FRONT.sendRec.x, y: FRONT_AT.y + FRONT.sendRec.y + 6 }, dx: 0, dy: 14, tone: 'plain' },
    { id: 'dip', text: 'MUSIC DIP', at: { x: DIP.x + DIP.w / 2, y: DIP.y - 4 }, dx: 0, dy: -10, tone: 'amber' },
    m.device === 'WIRELESS'
      ? { id: 'rx', text: `RECEIVER OUT: ${m.rxOut}`, at: { x: RX_AT.x + 77, y: RX_AT.y + 23 }, dx: 0, dy: -22, tone: m.rxOut === 'LINE' && m.input !== 'NONE' ? 'red' : 'plain' }
      : { id: 'mk', text: m.device === 'CONDENSER' ? 'CONDENSER MIC' : 'DYNAMIC MIC', at: { x: MIC_AT.x, y: MIC_AT.y - 24 }, dx: -6, dy: -12, tone: 'plain' },
  ];
  const roomCallouts: Callout[] = [
    { id: 'pl', text: 'PA L', at: planAt.top(ev.venue.place, 'L'), dx: 10, dy: -20, tone: fb.worst?.id === 'topL' && fb.state !== 'SAFE' ? 'red' : 'plain' },
    { id: 'pr', text: 'PA R', at: planAt.top(ev.venue.place, 'R'), dx: -10, dy: -20, tone: fb.worst?.id === 'topR' && fb.state !== 'SAFE' ? 'red' : 'plain' },
    { id: 'ml', text: 'MONITOR L', at: planAt.monitor('L'), dx: 30, dy: 10, tone: m.toBooth ? 'amber' : 'plain' },
    { id: 'mr', text: 'MONITOR R', at: planAt.monitor('R'), dx: -30, dy: 10, tone: m.toBooth ? 'amber' : 'plain' },
    { id: 'mic', text: `MIC · ${fb.state === 'RINGING' ? 'RINGING' : fb.state === 'EDGE' ? 'ON THE EDGE' : Number.isFinite(fb.marginDb) ? `${fb.marginDb.toFixed(0)} dB SPARE` : 'OFF'}`, at: planAt.mic(m.pos), dx: 0, dy: 34, tone: fb.state === 'RINGING' ? 'red' : fb.state === 'EDGE' ? 'amber' : 'green' },
    { id: 'tb', text: 'BOOTH TABLE', at: planAt.table(), dx: 0, dy: -46, tone: 'plain' },
  ];

  const marginCell = !live
    ? { k: 'FEEDBACK', v: 'MIC OFF', tint: colors.textSub }
    : { k: 'FEEDBACK', v: fb.state === 'RINGING' ? 'RINGING' : `${fb.marginDb.toFixed(1)} dB`, sub: fb.state === 'RINGING' ? `${Math.round(fb.ringHz)} Hz` : 'SPARE', vA11y: fb.state === 'RINGING' ? `ringing at ${Math.round(fb.ringHz)} hertz` : `${fb.marginDb.toFixed(1)} dB of gain to spare before feedback`, tint: fb.state === 'RINGING' ? '#ff5a48' : fb.state === 'EDGE' ? colors.amber : colors.green };

  return (
    <DjRack
      spec={{
        render: (w, h) =>
          view === 'MIXER' ? (
            <Scene w={w} h={h} frame={FRAME} motion={motion} a11y={`${LOOK_MIXER} The mic is ${m.input === 'NONE' ? 'not plugged in' : `in ${MIC_INPUTS[m.input].label}`}, ${m.on ? 'on' : 'off'}.`} obstacles={[...(['mic1', 'mic2', 'gain1', 'gain2', 'level', 'on', 'talk', 'depth', 'sendBooth', 'sendRec', 'phantom'] as FrontPart[]).map((p) => { const bx = frontPartBox(p); return { ...bx, x: bx.x + FRONT_AT.x, y: bx.y + FRONT_AT.y }; }), ...MET.xs.map((x) => ({ x: x - 2, y: MET.y - 2, w: MET.w + 4, h: MET.h + 4 })), { x: DIP.x, y: DIP.y - 5, w: DIP.w, h: 10 }]} callouts={mixerCallouts}>
              <MixerView booth={booth} live={live} voiceLive={voiceLive} voice={[voiceLive, voiceIn(last, 'crowd'), voiceIn(last, 'booth'), voiceIn(last, 'rec')]} />
            </Scene>
          ) : (
            <Scene w={w} h={h} frame={PLAN_STAGE} motion={motion} screenOverlay={(sw, sh, _xf, kz) => <HeatLegend w={sw} h={sh} k={Math.sqrt(Math.max(1, kz))} mode="TOPS" place={ev.venue.place} feedDbfs={last?.ext.feedRms.master ?? -24} />} a11y={`${LOOK_ROOM} The mic is ${MIC_POS[m.pos].label.toLowerCase()}; ${fb.state === 'RINGING' ? 'it is ringing' : fb.state === 'EDGE' ? 'it is on the edge of feedback' : 'it is safe from feedback'}.`} obstacles={planObstacles(ev.venue.place, ev.venue.subPos, false, true)} callouts={roomCallouts}>
              <PlanView spec={{ map: 'TOPS', place: ev.venue.place, subPos: ev.venue.subPos, subs: false, feedDbfs: last?.ext.feedRms.master ?? -24, monitors: true, mic: live ? { pos: m.pos, fb } : { pos: m.pos, fb: { ...fb, state: 'SAFE' } }, edges: true, hotTop: fb.state !== 'SAFE' && fb.worst?.id.startsWith('top') ? (fb.worst.id as 'topL' | 'topR') : null }} />
            </Scene>
          ),
        bezel: [dbCell('MIC PEAK', speaking ? micPk : null), { k: 'MUSIC DIP', v: last && last.ext.duckMinDb < -0.5 ? `${last.ext.duckMinDb.toFixed(0)} dB` : '0 dB', tint: colors.amber }, marginCell, voiceCell(last)],
        params: [
          {
            kind: 'fader',
            id: 'gain',
            label: 'GAIN',
            value: micGainKnob(m),
            locked: m.input === 'NONE' ? 'Plug the mic into MIC 1 or MIC 2 first (MIC).' : undefined,
            onChange: (v) => updateBooth((b) => withMic(b, b.ev!.mic.input === 'MIC2' ? { gain2: v } : { gain1: v })),
            format: (v) => `GAIN ${m.input === 'MIC2' ? '2' : '1'} +${micGainDb(v).toFixed(0)} dB`,
            formatShort: (v) => `+${micGainDb(v).toFixed(0)}`,
            nudges: [
              { label: '−1 dB', onPress: () => updateBooth((b) => { const g = micGainDb(micGainKnob(b.ev!.mic)) - 1; return withMic(b, b.ev!.mic.input === 'MIC2' ? { gain2: micGainPos(g) } : { gain1: micGainPos(g) }); }), a11y: 'Gain down one decibel' },
              { label: '+1 dB', onPress: () => updateBooth((b) => { const g = micGainDb(micGainKnob(b.ev!.mic)) + 1; return withMic(b, b.ev!.mic.input === 'MIC2' ? { gain2: micGainPos(g) } : { gain1: micGainPos(g) }); }), a11y: 'Gain up one decibel' },
            ],
          },
          { kind: 'group', id: 'mic', label: 'MIC', valueLabel: m.input === 'NONE' ? 'OUT' : `${MIC_INPUTS[m.input].label}${m.on ? '' : ' OFF'}`, valueA11y: `${m.device.toLowerCase()} mic ${m.input === 'NONE' ? 'unplugged' : `in ${MIC_INPUTS[m.input].label}, ${m.on ? 'on' : 'off'}`}`, render: () => <MicTray onPop={setPop} /> },
          { kind: 'group', id: 'route', label: 'ROUTE', valueLabel: MIC_POS[m.pos].label.replace('AT THE ', '').replace('AT A ', '').replace('ON THE ', ''), valueA11y: `talk over ${m.talkover ? 'on' : 'off'}; mic to booth ${m.toBooth ? 'on' : 'off'}; mic to rec ${m.toRec ? 'on' : 'off'}; mic ${MIC_POS[m.pos].label.toLowerCase()}`, render: () => <RouteTray setView={setView} /> },
          { kind: 'group', id: 'talk', label: 'TALK', valueLabel: announcing(booth) ? 'ON AIR' : musicOn(booth) ? 'READY' : 'PLAY A', render: () => <TalkTray tr={tr} lead={audio.leadSec} /> },
          stopKey(tr),
        ],
        initialParam: 'gain',
      }}
    >
      <Step n={1}>
        <Look>{view === 'MIXER' ? LOOK_MIXER : LOOK_ROOM}</Look>
        <P>A mic makes a tiny signal, so its input adds a lot of gain; the MIC meter is where you set it. Phantom power, talkover and where the mic is sent all belong to this mixer’s design — check the manual of the one you are on.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Open MIC: plug the DYNAMIC mic into MIC 1 and switch it ON. Open TALK, play deck A and press TALK NOW.</Do>
        <P>Ride GAIN until the MIC meter’s speech peaks sit between −10 and −3 dBFS — read MIC PEAK on the strip. Then turn TALK OVER on (ROUTE) and talk again: watch the MUSIC DIP bar drop while you speak and come back after.</P>
        {pop ? <Note tone="safety">POP — +48 V was switched with the mic channel ON and up. On a real system that crack goes through every speaker carrying the mic. Switch phantom with the mic OFF (or its level down).</Note> : null}
        {overload ? <Note tone="safety">The receiver’s LINE output is overloading the mic input before the GAIN knob — turning GAIN down cannot clean it. Set the receiver to MIC.</Note> : null}
      </Step>
      <Step n={3}>
        <P>Swap to the CONDENSER: in MIC 2 it is silent (no phantom there). Move it to MIC 1 and switch +48 V on — with the mic OFF first. It is hotter than the dynamic: GAIN comes down.</P>
        <P>Now make it ring, safely: in ROUTE, point the mic AT A MONITOR, or walk it ON THE FLOOR, and watch FEEDBACK. Win back at least 6 dB: the mic back at the decks with its rear to the speakers, out of the booth send, or the booth lower.</P>
        <Note tone="safety">The lab plays only a quiet stand-in of a ring. Real feedback grows until it hurts ears and speakers: the first move is always the mic level DOWN, then find the loop.</Note>
      </Step>
      <Step n={4}>
        <Do>Set a clean mic level, talk over the music, power the condenser from the right input, and make it ring — then win back 6 dB of margin.</Do>
        <GoalChips goals={goals.slice(0, 4)} latched={latched.slice(0, 4)} />
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow="CHECK YOURSELF"
          question="A wireless receiver is plugged into MIC 2. The voice is distorted — even with MIC 2’s GAIN turned all the way down. What is wrong?"
          options={['The receiver’s output is set to LINE, which overloads the mic input before the gain knob', 'MIC 2 needs +48 V for a wireless receiver', 'The talkover depth is too deep', 'The mic is too far from the mouth']}
          correct={0}
          explain="A line-level signal is about 38 dB hotter than a mic. It overloads the mic input’s first stage, before the GAIN knob can do anything. Set the receiver’s output switch to MIC (or plug it into a line input)."
          wrong={[undefined, 'A wireless receiver powers itself; phantom does nothing for it.', 'Talkover changes the MUSIC’s level, not the voice’s distortion.', 'Distance would make it quieter and thinner, not distorted with the gain at minimum.']}
          onCorrect={() => setCheck(true)}
        />
        <FaultCard
          title="THE RECORDING HAS NO VOICE"
          symptom="The room heard your announcement clearly, but the recording has the music only."
          start={() => {
            void audio.requestSound();
            updateBooth((b, t) => {
              const x = withMic(b, { device: 'DYNAMIC', input: 'MIC1', on: true, gain1: micGainPos(44), level: 0.75, toRec: false, pos: 'DECKS' });
              return { ...x, decks: { ...x.decks, A: { ...x.decks.A, playing: true, at: t } }, ev: { ...x.ev!, rec: { ...x.ev!.rec, tap: 'REC_OUT' } }, perspective: 'CROWD' };
            });
            announce(audio.leadSec() + 0.6);
          }}
          fixed={voiceIn(last, 'rec')}
          hints={['Compare VOICE IN on the strip: which feeds carry the mic?', 'CRD (the crowd) has it; REC does not — the mic is not sent to the record output.', 'Open ROUTE, switch MIC → REC on, then TALK again and watch the REC meter.']}
          why="On this mixer, as on many, the mic is NOT sent to the record output (or the booth) until you switch it in. The crowd hearing the mic proves nothing about the recording: check the feed you are recording, on its own meter."
          onFixed={() => setFaultFixed(true)}
        />
        <GoalChips goals={goals.slice(4)} latched={latched.slice(4)} />
      </Step>
    </DjRack>
  );
}

const styles = StyleSheet.create({
  tray: { gap: 10 },
});

export const P19: PageDef = { title: 'Microphones, announcements and talkover', short: 'MIC', Component: PageMic, manualDone: true, rack: true };
