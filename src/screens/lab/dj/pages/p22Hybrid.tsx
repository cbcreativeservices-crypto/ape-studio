/**
 * Screen 22 — Hybrid DJ systems (research DJ27).
 *
 * A drum machine joins the booth with TWO separate connections: its AUDIO
 * (OUT L / R into CH 2's LINE inputs — deck B's cables come out) and its
 * CLOCK (the mixer's MIDI OUT, sending MIDI clock from the beat counter of
 * the channel its CLOCK switch picks, into the drum machine's MIDI IN). A
 * clock connection carries no sound, and audio carries no tempo.
 *
 * The protocols are SIMULATED (engine/djDrumMachine): MIDI clock is 24 ticks
 * a beat, so an EXT drum machine plays the leader's tempo tick for tick and
 * stops when it stops; it gives the TEMPO, not the bar — where bar 1 falls
 * is set by the START (pressed by ear, or armed for the next bar line). A
 * 3.5 mm TRS-MIDI lead must be the type the device uses (A here); two USB
 * devices cannot talk without a host. On INTERNAL it runs its own tempo and
 * drifts. The fault: the wrong TRS-MIDI type — the plug fits, no clock.
 */
import { useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Group, RoundedRect } from '@shopify/react-native-skia';
import { colors } from '../../../../theme/tokens';
import { LabChip } from '../../LabShell';
import { UnderstandingCheck } from '../../tuning/components/check';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import { Scene, type Callout } from '../art/Scene';
import { MixerRear } from '../art/RearPanels';
import { ClockTicks, clockPath, DM_D, DM_REAR, DM_REAR_H, DM_W, DrumMachineRear, DrumMachineTop } from '../art/DrumMachine';
import { DinPlugFace, IsolatorBarrel } from '../art/eventParts';
import { CableRun, CableFlag } from '../art/cables';
import { Cable, UsbC } from '../art/parts';
import { MIXER_REAR, MIXER_REAR_JACKS, type Box } from '../geometry/boothGeometry';
import { MIXER_REAR_EXTRA } from '../geometry/eventGeometry';
import { DjRack } from '../DjRack';
import { Do, FaultCard, GoalChips, Look, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { stopKey, tempoKey, type Transport } from '../dock';
import { boothNow, getBooth, updateBooth } from '../booth/boothStore';
import { cueAtBar, useScreenSetup } from '../booth/setup';
import { BUILT_PLUGS, connect, type Booth } from '../model/djModel';
import { CLOCK_CABLES, clockArrives, counterBpm, dmBpm, evOf, withDm, type ClockCable } from '../model/djEvent';
import { dmBeatLine, dmPhase, dmRunning, leaderBeatLine, nextLeaderBar } from '../engine/djDrumMachine';
import { EventListen, Row, TrayNote, useEventKit, withFreshEvent } from './eventShared';
import { PEAK_RED } from './shared';

const TERMS = [
  { term: 'Audio connection', def: 'Carries the sound itself: the drum machine’s OUT L / R into a mixer channel. Without it the crowd hears nothing, whatever the clock does.' },
  { term: 'MIDI control', def: 'Messages, not sound: notes, knob moves, start and stop. A MIDI cable can carry them; it never carries audio.' },
  { term: 'Clock / sync', def: 'MIDI clock is 24 ticks a beat from a leader, so a follower plays the leader’s tempo. It sets the tempo, not where bar 1 is — the START does that. Some software and devices sync over a network instead, the same idea.' },
  { term: 'TRS-MIDI', def: 'MIDI on a 3.5 mm jack. There are two wirings (type A and type B): a lead of the wrong type fits but delivers nothing. Check which your device uses.' },
] as const;

export const GOALS_HYBRID = ['Clock in: the drum machine follows deck A', 'Its bar 1 on deck A’s one', 'Its audio in the room', 'Move deck A’s tempo: it follows', 'Fix the ignored clock', 'Pass the check'] as const;

const LOOK = 'You are looking at the back of the mixer (its MIDI OUT and CLOCK switch at the lower left, CH 2’s LINE inputs above), the drum machine’s back panel, and its top: the display, the CLOCK-IN light, and the sixteen step lights that run with its own beat.';

/* ── the stage (mm) ───────────────────────────────────────────────────── */

const FRAME: Box = { x: -44, y: -24, w: 356, h: 400 };
const DMR = { x: -30, y: 152 };
const DMT = { x: -30, y: 214 };
const E = MIXER_REAR_EXTRA;
const J = MIXER_REAR_JACKS;
const dmJack = (k: keyof typeof DM_REAR) => ({ x: DMR.x + DM_REAR[k].x, y: DMR.y + DM_REAR[k].y });

function clockRoute(cable: ClockCable): [number, number][] | null {
  if (cable === 'NONE') return null;
  if (cable === 'USB') {
    const b = dmJack('usb');
    return [[J.usb.x, J.usb.y], [J.usb.x, 138], [b.x, 138], [b.x, b.y]];
  }
  const b = cable === 'DIN' ? dmJack('midiDin') : dmJack('midiTrs');
  return [[E.midiOut.x, E.midiOut.y], [E.midiOut.x, 132], [b.x, 132], [b.x, b.y]];
}

function Stage({ booth, now }: { booth: Booth; now: number }) {
  const ev = evOf(booth);
  const dm = ev.dm;
  const route = clockRoute(dm.cable);
  const arrives = clockArrives(booth);
  const running = dmRunning(booth);
  const steps = running ? dmBeatLine(booth, now) : null;
  const beatClock = leaderBeatLine(booth, now);
  const path = useMemo(() => (route ? clockPath(route) : null), [route?.map((p) => p.join(',')).join(';')]);
  const bLive = booth.decks.B.playing;
  const out = (k: 'outL' | 'outR') => dmJack(k);
  return (
    <Group>
      <MixerRear x={0} y={0} on extras={{ clock: dm.clockSrc === 'OFF' ? 'OFF' : dm.clockSrc }} />
      <DrumMachineRear x={DMR.x} y={DMR.y} />
      <DrumMachineTop x={DMT.x} y={DMT.y} running={running} sync={dm.sync} bpm={dmBpm(booth)} clockIn={dm.sync === 'EXT' && arrives} steps={steps} beatClock={beatClock} level={0.7} tempoKnob={(dm.intBpm - 60) / 120} />
      {/* audio: the drum machine's OUT L / R into CH 2 LINE (TS jack → RCA) */}
      {dm.audio ? (
        <Group>
          <CableRun r={{ id: 'dmL', kind: 'trs', farKind: 'rca', colour: '#e9e9ec', pts: [[out('outL').x, out('outL').y], [out('outL').x, 118], [33, 118], [33, J['ch2.line.L'].y], [J['ch2.line.L'].x, J['ch2.line.L'].y]], plugged: true, live: running, label: 'DM L' }} labelAt={[150, 118]} />
          <CableRun r={{ id: 'dmR', kind: 'trs', farKind: 'rca', colour: '#e2463a', pts: [[out('outR').x, out('outR').y], [out('outR').x, 124], [J['ch2.line.R'].x, 124], [J['ch2.line.R'].x, J['ch2.line.R'].y]], plugged: true, live: running, label: 'DM R', dashed: true }} labelAt={[200, 124]} />
          <CableRun r={{ id: 'bL', kind: 'rca', colour: '#e9e9ec', pts: [[-40, 18], [-14, 18], [-6, 40]], plugged: false, live: false, label: 'B L' }} labelAt={[-28, 18]} />
          <CableRun r={{ id: 'bR', kind: 'rca', colour: '#e2463a', pts: [[-40, 84], [-16, 84], [-8, 104]], plugged: false, live: false, label: 'B R', dashed: true }} labelAt={[-28, 84]} />
        </Group>
      ) : (
        <Group>
          <CableRun r={{ id: 'bL', kind: 'rca', colour: '#e9e9ec', pts: [[-40, 18], [J['ch2.line.L'].x, 18], [J['ch2.line.L'].x, J['ch2.line.L'].y]], plugged: true, live: bLive, label: 'B L' }} labelAt={[-22, 18]} />
          <CableRun r={{ id: 'bR', kind: 'rca', colour: '#e2463a', pts: [[-40, 84], [33, 84], [33, J['ch2.line.R'].y], [J['ch2.line.R'].x, J['ch2.line.R'].y]], plugged: true, live: bLive, label: 'B R', dashed: true }} labelAt={[-22, 84]} />
        </Group>
      )}
      {/* the clock lead: carries timing, never sound */}
      {route && path ? (
        <Group>
          <Cable pts={route} style={{ colour: dm.cable === 'USB' ? '#5c6068' : '#3b3450', width: dm.cable === 'USB' ? 3.6 : 4.4, pattern: 'plain' }} />
          {dm.cable === 'USB' ? (
            <Group>
              <RoundedRect x={J.usb.x - 6} y={J.usb.y - 6} width={12} height={12} r={2} color="#2a2c31" />
              <UsbC cx={dmJack('usb').x} cy={dmJack('usb').y} plugged />
            </Group>
          ) : (
            <Group>
              <DinPlugFace cx={E.midiOut.x} cy={E.midiOut.y} d={14} />
              {dm.cable === 'DIN' ? <DinPlugFace cx={dmJack('midiDin').x} cy={dmJack('midiDin').y} d={14} /> : <Group><IsolatorBarrel x={(E.midiOut.x + dmJack('midiTrs').x) / 2 + 22} y={132} colour="#2a2c31" /><RoundedRect x={dmJack('midiTrs').x - 3} y={dmJack('midiTrs').y - 12} width={6} height={12} r={1.5} color="#141518" /></Group>}
            </Group>
          )}
          {arrives && dm.sync === 'EXT' ? <ClockTicks path={path} beatClock={beatClock} spacing={14} /> : null}
          <CableFlag x={route[1][0] + 30} y={route[1][1] + (dm.cable === 'USB' ? 0 : 0)} text={dm.cable === 'USB' ? 'USB' : dm.cable === 'DIN' ? 'MIDI · CLOCK' : `TRS-MIDI ${dm.cable === 'TRS_A' ? 'A' : 'B'}`} live={false} edge="#7a6aa8" />
        </Group>
      ) : null}
    </Group>
  );
}

/* ── the trays ───────────────────────────────────────────────────────── */

function ClockTray() {
  const b = getBooth();
  const dm = evOf(b).dm;
  const set = (patch: Parameters<typeof withDm>[1]) => updateBooth((x) => withDm(x, patch));
  return (
    <View style={styles.tray}>
      <Row head="THE MIXER’S CLOCK SWITCH (which beat counter sends clock)">
        {(['OFF', 1, 2] as const).map((c) => (
          <LabChip key={String(c)} label={c === 'OFF' ? 'OFF' : `CH ${c}`} selected={dm.clockSrc === c} onPress={() => set({ clockSrc: c })} compact />
        ))}
      </Row>
      <Row head="THE LEAD FROM MIDI OUT TO THE DRUM MACHINE">
        {(['DIN', 'TRS_A', 'TRS_B', 'USB', 'NONE'] as const).map((c) => (
          <LabChip key={c} label={c === 'NONE' ? 'UNPLUG' : CLOCK_CABLES[c].label} selected={dm.cable === c} onPress={() => set({ cable: c })} compact />
        ))}
      </Row>
      {dm.cable !== 'NONE' ? <TrayNote tone="fine">{CLOCK_CABLES[dm.cable].why}</TrayNote> : null}
      <Row head="THE DRUM MACHINE FOLLOWS">
        <LabChip label="ITS OWN TEMPO (INT)" selected={dm.sync === 'INT'} onPress={() => set({ sync: 'INT' })} compact />
        <LabChip label="EXTERNAL CLOCK (EXT)" selected={dm.sync === 'EXT'} onPress={() => set({ sync: 'EXT' })} compact />
      </Row>
      <Row head={`ITS OWN TEMPO ${dm.intBpm.toFixed(1)} BPM`}>
        {[-1, -0.1, 0.1, 1].map((d) => (
          <LabChip key={d} label={`${d > 0 ? '+' : '−'}${Math.abs(d)}`} selected={false} onPress={() => set({ intBpm: Math.round((evOf(getBooth()).dm.intBpm + d) * 10) / 10 })} compact />
        ))}
      </Row>
    </View>
  );
}

function StartTray({ tr, onStart }: { tr: Transport; onStart: (msg: string | null) => void }) {
  const b = getBooth();
  const dm = evOf(b).dm;
  const leaderOk = dm.sync === 'EXT' && clockArrives(b) && b.decks.A.playing;
  return (
    <View style={styles.tray}>
      <Row head="DECK A (THE LEADER)">
        <LabChip label={`${b.decks.A.playing ? '❚❚ PAUSE' : '▶ PLAY'} A`} selected={b.decks.A.playing} onPress={() => tr.toggle('A')} compact />
        {tr.soundDeclined ? <LabChip label="TURN SOUND ON" selected={false} onPress={tr.soundOn} compact /> : null}
      </Row>
      <Row head="THE DRUM MACHINE">
        <LabChip
          label="▶ PLAY NOW"
          selected={dm.startedAt != null}
          onPress={() => {
            updateBooth((x) => withDm(x, { startedAt: boothNow() }));
            onStart('started');
          }}
          compact
        />
        <LabChip
          label={leaderOk ? '⏱ START ON THE NEXT BAR' : 'ARMED START (needs EXT + clock + deck A)'}
          selected={false}
          onPress={() => {
            const g = getBooth();
            const at = nextLeaderBar(g, boothNow());
            if (!leaderOk || at == null) {
              onStart('An armed start waits for the leader’s next bar line — it needs EXT, a clock arriving and deck A playing.');
              return;
            }
            updateBooth((x) => withDm(x, { startedAt: at }));
            onStart('armed');
          }}
          compact
        />
        <LabChip label="■ STOP" selected={false} onPress={() => { updateBooth((x) => withDm(x, { startedAt: null })); onStart(null); }} compact />
      </Row>
    </View>
  );
}

function AudioTray() {
  const b = getBooth();
  const dm = evOf(b).dm;
  const patch = (on: boolean) =>
    updateBooth((x) => {
      let y = withDm(x, { audio: on });
      if (on) {
        y = connect(y, 'B.rcaL', null) ?? y;
        y = connect(y, 'B.rcaR', null) ?? y;
      } else {
        y = connect(y, 'B.rcaL', BUILT_PLUGS['B.rcaL']) ?? y;
        y = connect(y, 'B.rcaR', BUILT_PLUGS['B.rcaR']) ?? y;
      }
      return { ...y, ch: { ...y.ch, 2: { ...y.ch[2], input: 'LINE' } } };
    });
  const f2 = (v: number) => updateBooth((x) => ({ ...x, ch: { ...x.ch, 2: { ...x.ch[2], fader: v } } }));
  return (
    <View style={styles.tray}>
      <Row head="CH 2’S LINE INPUTS GET">
        <LabChip label="DECK B (its RCA leads)" selected={!dm.audio} onPress={() => patch(false)} compact />
        <LabChip label="THE DRUM MACHINE’S OUT L / R" selected={dm.audio} onPress={() => patch(true)} compact />
      </Row>
      <TrayNote tone="fine">Move a lead with CH 2’s fader DOWN — a live input buzzes as the plug goes in.</TrayNote>
      <Row head={`CH 2 FADER ${Math.round(b.ch[2].fader * 100)}% · CUE 2 ${b.ch[2].cue ? 'ON' : 'OFF'}`}>
        <LabChip label="DOWN" selected={b.ch[2].fader <= 0.02} onPress={() => f2(0)} compact />
        <LabChip label="UP 70%" selected={Math.abs(b.ch[2].fader - 0.7) < 0.02} onPress={() => f2(0.7)} compact />
        <LabChip label={b.ch[2].cue ? 'CUE 2 ●' : 'CUE 2'} selected={b.ch[2].cue} onPress={() => updateBooth((x) => ({ ...x, ch: { ...x.ch, 2: { ...x.ch[2], cue: !x.ch[2].cue } } }))} compact />
      </Row>
      <EventListen withRecorder={false} />
    </View>
  );
}

/* ── the page ────────────────────────────────────────────────────────── */

function PageHybrid({ ctx }: { ctx: PageCtx }) {
  const { booth, audio, tr, motion, last } = useEventKit();
  useScreenSetup((b) => {
    let x = cueAtBar(b, 'A', 'nightFerry', 17);
    x = { ...x, ch: { 1: { ...x.ch[1], fader: 0.85, xf: 'THRU', cue: false }, 2: { ...x.ch[2], fader: 0, cue: false, input: 'LINE' } }, mixer: { ...x.mixer, master: 0.6, xf: 0.5 }, perspective: 'CROWD' };
    return withFreshEvent(x);
  });
  const [startMsg, setStartMsg] = useState<string | null>(null);
  const [check, setCheck] = useState(false);
  const [faultFixed, setFaultFixed] = useState(false);
  const ev = evOf(booth);
  const dm = ev.dm;
  const now = booth.decks.A.at; // the booth re-renders on every change; the lines restart from the anchor
  const arrives = clockArrives(booth);
  const running = dmRunning(booth);
  const leader = counterBpm(booth, 1);
  const bpm = dmBpm(booth);
  const phase = dmPhase(booth);
  const pitchAtStart = useRef<number | null>(null);
  if (running && dm.sync === 'EXT' && arrives) {
    if (pitchAtStart.current == null) pitchAtStart.current = booth.decks.A.pitch;
  } else pitchAtStart.current = null;
  const following = running && dm.sync === 'EXT' && arrives && dm.clockSrc === 1 && booth.decks.A.playing;
  const onTheOne = following && !!phase && Math.abs(phase.barBeats) <= 0.125;
  const ch2Live = !!last && last.rmsDb.ch2 > -50 && booth.ch[2].fader > 0.3 && dm.audio && running;
  const hits = [following, onTheOne, ch2Live, following && pitchAtStart.current != null && Math.abs(booth.decks.A.pitch - pitchAtStart.current) >= 1, faultFixed, check];
  const goals = GOALS_HYBRID.map((label, i) => ({ label, hit: hits[i] }));
  const latched = useVisitGoals(ctx, goals, 'HYBRID');
  const phaseText = !phase ? (dm.sync === 'INT' && running ? 'OWN TEMPO' : '—') : Math.abs(phase.barBeats) <= 0.125 ? 'ON THE ONE' : `${phase.barBeats > 0 ? '+' : '−'}${Math.abs(phase.barBeats).toFixed(2)} BEATS`;
  const startNote =
    startMsg === 'started'
      ? phase
        ? Math.abs(phase.barBeats) <= 0.125
          ? 'Its bar 1 landed on deck A’s one.'
          : `Its bar 1 landed ${Math.abs(phase.barBeats).toFixed(2)} beats ${phase.barBeats > 0 ? 'after' : 'before'} deck A’s one: in tempo, out of phase. STOP, then start it on the one — or arm the start.`
        : dm.sync === 'INT'
          ? 'Running on its own tempo — listen for the drift against deck A.'
          : 'Waiting for a clock it can read.'
      : startMsg === 'armed'
        ? 'Armed: it starts on deck A’s next bar line, exactly on the one.'
        : startMsg;

  const DT = (x: number, y: number) => ({ x: DMT.x + x, y: DMT.y + y });
  const callouts: Callout[] = [
    { id: 'mo', text: 'MIDI OUT', at: { x: E.midiOut.x, y: E.midiOut.y - 8 }, dx: 0, dy: -16, tone: 'plain' },
    { id: 'cs', text: `CLOCK ${dm.clockSrc === 'OFF' ? 'OFF' : `FROM CH ${dm.clockSrc}`}`, at: { x: E.clock.x + E.clock.w / 2, y: E.clock.y }, dx: 14, dy: -16, tone: dm.clockSrc === 'OFF' ? 'plain' : 'amber' },
    { id: 'c2', text: dm.audio ? 'CH 2 LINE ← DRUM MACHINE' : 'CH 2 LINE ← DECK B', at: { x: J['ch2.line.L'].x, y: J['ch2.line.L'].y - 8 }, dx: 10, dy: -18, tone: dm.audio ? 'green' : 'plain' },
    { id: 'mi', text: dm.cable === 'NONE' ? 'MIDI IN' : CLOCK_CABLES[dm.cable].works ? 'CLOCK IN ✓' : 'NO CLOCK ARRIVES', at: dm.cable === 'USB' ? dmJack('usb') : dm.cable === 'DIN' ? dmJack('midiDin') : dmJack('midiTrs'), dx: 0, dy: 26, tone: dm.cable === 'NONE' ? 'plain' : CLOCK_CABLES[dm.cable].works ? 'green' : 'red' },
    { id: 'ou', text: 'OUT L · R (AUDIO)', at: { x: (dmJack('outL').x + dmJack('outR').x) / 2, y: dmJack('outL').y + 8 }, dx: 0, dy: 22, tone: dm.audio ? 'blue' : 'plain' },
    { id: 'ds', text: dm.sync === 'EXT' ? (arrives ? 'FOLLOWING THE CLOCK' : 'EXT · NO CLOCK') : 'INTERNAL TEMPO', at: DT(78, 60), dx: 0, dy: 14, tone: dm.sync === 'EXT' && !arrives ? 'red' : 'amber' },
    { id: 'st', text: 'STEP LIGHTS = ITS BEAT', at: DT(170, 129), dx: 0, dy: 22, tone: 'plain' },
  ];

  return (
    <DjRack
      spec={{
        render: (w, h) => (
          <Scene w={w} h={h} frame={FRAME} motion={motion} a11y={`${LOOK} The drum machine is ${running ? `running at ${bpm?.toFixed(1)} BPM` : 'stopped'}, ${dm.sync === 'EXT' ? (arrives ? 'following the clock' : 'waiting for a clock') : 'on its own tempo'}; its audio is ${dm.audio ? 'in CH 2' : 'not connected'}.`} obstacles={[{ x: 0, y: 0, w: MIXER_REAR.w, h: MIXER_REAR.h }, { x: DMR.x, y: DMR.y, w: DM_W, h: DM_REAR_H }, { x: DMT.x, y: DMT.y, w: DM_W, h: DM_D }]} callouts={callouts}>
            <Stage booth={booth} now={now} />
          </Scene>
        ),
        bezel: [
          { k: 'DECK A', v: leader == null ? '—' : leader.toFixed(1), sub: 'BPM', tint: colors.amber },
          { k: 'MACHINE', v: bpm == null ? (dm.sync === 'EXT' ? 'NO CLOCK' : '—') : bpm.toFixed(1), sub: bpm == null ? undefined : dm.sync === 'EXT' ? 'BPM · EXT' : 'BPM · INT', tint: dm.sync === 'EXT' && !arrives ? PEAK_RED : colors.amber },
          { k: 'ITS BAR 1', v: phaseText, tint: onTheOne ? colors.green : colors.amber },
          { k: 'IN THE ROOM', v: ch2Live ? 'AUDIBLE' : dm.audio ? (booth.ch[2].fader > 0.3 ? 'SILENT' : 'CH 2 DOWN') : 'NOT PATCHED', tint: ch2Live ? colors.green : colors.textSub },
        ],
        params: [
          tempoKey(booth, 'A'),
          { kind: 'group', id: 'clock', label: 'CLOCK', valueLabel: dm.cable === 'NONE' ? 'NONE' : dm.sync, render: () => <ClockTray /> },
          { kind: 'group', id: 'start', label: 'START', valueLabel: running ? 'RUNNING' : dm.startedAt != null ? 'WAITING' : 'STOPPED', render: () => <StartTray tr={tr} onStart={setStartMsg} /> },
          { kind: 'group', id: 'audio', label: 'AUDIO', valueLabel: dm.audio ? 'CH 2' : 'NONE', render: () => <AudioTray /> },
          stopKey(tr),
        ],
        initialParam: 'tempoA',
      }}
    >
      <Step n={1}>
        <Look>{LOOK}</Look>
        <P>An extra instrument needs two separate jobs done: its SOUND into a mixer channel, and its TIMING from a leader. A clock lead carries no sound, and an audio lead carries no tempo.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Open CLOCK: set the mixer’s CLOCK switch to CH 1, lead 5-PIN MIDI, and the drum machine to EXTERNAL. Play deck A (START): DRUM MACHINE reads deck A’s tempo, and the step lights run.</Do>
        <P>It follows — but the crowd hears nothing: the clock lead carries no sound. Open AUDIO, give CH 2’s LINE inputs to the drum machine, and bring CH 2 up.</P>
        {startNote ? <Note tone="try">{startNote}</Note> : null}
      </Step>
      <Step n={3}>
        <P>Clock sets the tempo, not the bar. Press PLAY NOW off the beat and read ITS BAR 1: in tempo, out of phase. STOP, and use START ON THE NEXT BAR. Then ride TEMPO A: the drum machine follows, tick for tick.</P>
        <Note>Real setups differ: which device leads, whether start and stop are sent, how many ticks a beat an analogue sync uses, and whether sync runs over MIDI, USB through a computer, or a network. Check both manuals.</Note>
      </Step>
      <Step n={4}>
        <Do>Get the drum machine following deck A, with its bar 1 on the one, its audio in the room, and still following when deck A’s tempo moves.</Do>
        <GoalChips goals={goals.slice(0, 4)} latched={latched.slice(0, 4)} />
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow="CHECK YOURSELF"
          question="The drum machine is on its own INTERNAL tempo at 122.0 BPM; deck A plays at 122.6. You start them together, exactly on the one. What happens over the next minute?"
          options={['They drift apart — about half a beat after a minute', 'Nothing: 0.6 BPM is too small to matter', 'The drum machine speeds up to match', 'They stay together, but the drum machine sounds out of tune']}
          correct={0}
          explain="0.6 BPM apart is 0.6 beats a minute: a flam within seconds, half a beat off within a minute. On its own clock nothing makes it follow — EXTERNAL clock from the leader does."
          wrong={[undefined, 'Small tempo differences add up beat by beat; drift is exactly that.', 'On INTERNAL it listens to nothing; only an external clock moves its tempo.', 'A drum machine’s tempo does not change its pitch; drift is a timing problem.']}
          onCorrect={() => setCheck(true)}
        />
        <FaultCard
          title="THE DRUM MACHINE IGNORES THE CLOCK"
          symptom="Deck A plays, the mixer’s CLOCK is on CH 1 and a lead is in — but the drum machine reads EXT · NO CLOCK and will not run."
          start={() => {
            void audio.requestSound();
            updateBooth((b, t) => {
              const x = withDm(b, { clockSrc: 1, cable: 'TRS_B', sync: 'EXT', startedAt: t });
              return { ...x, decks: { ...x.decks, A: { ...x.decks.A, playing: true, at: t } } };
            });
          }}
          fixed={arrives && dm.sync === 'EXT' && dm.clockSrc !== 'OFF'}
          hints={['Read the callout at the drum machine’s MIDI IN: does any clock arrive?', 'The lead is a TRS-MIDI of type B; this drum machine uses type A. The plug fits — the wiring does not.', 'Open CLOCK and use a type A lead, or a 5-pin MIDI lead into the DIN input.']}
          why="MIDI on a 3.5 mm jack comes in two wirings. The wrong one fits perfectly and delivers nothing — just as a USB lead between two USB devices does (they need a host). When a follower will not follow, check what actually ARRIVES before touching the tempo."
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

export const P22: PageDef = { title: 'Hybrid DJ systems', short: 'HYBRID', Component: PageHybrid, manualDone: true, rack: true };
