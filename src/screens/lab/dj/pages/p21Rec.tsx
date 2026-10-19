/**
 * Screen 21 — Recording and streaming (research DJ28).
 *
 * Where a recording is TAPPED (this mixer's REC OUT: a fixed-level copy of
 * the mix before the MASTER knob; the BOOTH output, which follows the BOOTH
 * knob; or the computer's LOOPBACK, which hears only what the computer
 * plays), the recorder's OWN input gain and clip, the mic's send to REC,
 * and PLAYBACK VERIFICATION: the take is the captured samples themselves
 * (booth/takeStore), drawn from them and played back from them.
 *
 * The fault: the recorder clips while the room sounds clean (its own input
 * gain is far up — the MASTER is not the fix). Service rules vary: the lab
 * names no service.
 */
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Group } from '@shopify/react-native-skia';
import { colors } from '../../../../theme/tokens';
import { LabChip } from '../../LabShell';
import { UnderstandingCheck } from '../../tuning/components/check';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import { Scene, type Callout } from '../art/Scene';
import { MixerRear } from '../art/RearPanels';
import { Recorder, REC, REC_H, REC_W, SplitLead, TakeLane } from '../art/RecorderGear';
import { Laptop, LAPTOP_W } from '../art/gear';
import { MIXER_REAR, MIXER_REAR_JACKS, type Box } from '../geometry/boothGeometry';
import { MIXER_REAR_EXTRA } from '../geometry/eventGeometry';
import { DjRack } from '../DjRack';
import { Do, FaultCard, GoalChips, Look, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { stopKey, type Transport } from '../dock';
import { boothNow, getBooth, updateBooth } from '../booth/boothStore';
import { cueAtBar, useScreenSetup } from '../booth/setup';
import { armTake, closeTake, getTake, takeOpen, useTake, writeChunk } from '../booth/takeStore';
import { useTakePlayer } from '../booth/useTakePlayer';
import { levelKnobGain, type Booth } from '../model/djModel';
import { REC_TAPS, evOf, micGainPos, recGainDb, recGainPos, withMic, withRec, type RecTap } from '../model/djEvent';
import { announce, dbCell, EventListen, extPeak, musicOn, Row, TrayNote, useEventKit, voiceCell, voiceIn, withFreshEvent } from './eventShared';
import { PEAK_RED, peakDb } from './shared';
import type { BoothRender } from '../engine/djRender';
import { isEventRender } from '../engine/djEventRender';

const TERMS = [
  { term: 'Record tap', def: 'Where the recorder takes its feed from. A REC OUT is usually a fixed-level copy of the mix, so your MASTER moves never ride the take; a booth or master output follows its knob. Mixers differ.' },
  { term: 'Capture level', def: 'The recorder’s own input gain. Set it on the loudest part with headroom: peaks around −12 to −3 dBFS on the RECORDER’s meter. A clip there is in the file forever.' },
  { term: 'Loopback', def: 'Software that records what the computer itself is playing. It never hears the mixer, the players or the mic — only the computer’s own output.' },
  { term: 'Monitoring loop', def: 'When an app sends what it records back out to something that feeds it again: an echo that can build into a howl. Monitor the recording in headphones, never back into the mix.' },
] as const;

export const GOALS_REC = ['Tap REC OUT, then move MASTER: the take stays', 'Capture level: peaks −12 … −3 dBFS, no clip', 'The mic in the take', 'Play back a take with music and voice', 'Stop the recorder clipping', 'Pass the check'] as const;

const LOOK = 'You are looking at the back of the mixer (REC OUT at its lower left, BOOTH OUT, MASTER) and a handheld recorder with its input meters, joined by a split lead into its LINE IN — and below, the take itself, drawn from what the recorder captured.';

/* ── the stage (mm) ───────────────────────────────────────────────────── */

const REC_AT = { x: 334, y: -14 };
const LAP_AT = { x: 316, y: -60 };
const frameFor = (tap: RecTap): Box => (tap === 'LOOPBACK' ? { x: -10, y: -70, w: 670, h: 380 } : { x: -10, y: -30, w: 430, h: 200 });

function GearView({ booth, live, elapsed, clip }: { booth: Booth; live: boolean; elapsed: string; clip: boolean }) {
  const ev = evOf(booth);
  const tap = ev.rec.tap;
  const E = MIXER_REAR_EXTRA;
  const J = MIXER_REAR_JACKS;
  const from: [{ x: number; y: number }, { x: number; y: number }] =
    tap === 'BOOTH' ? [{ x: J['booth.L'].x, y: J['booth.L'].y }, { x: J['booth.R'].x, y: J['booth.R'].y }] : [{ x: E['rec.L'].x, y: E['rec.L'].y }, { x: E['rec.R'].x, y: E['rec.R'].y }];
  const lineIn = { x: REC_AT.x + REC.lineIn.x, y: REC_AT.y + REC.lineIn.y };
  return (
    <Group>
      <MixerRear x={0} y={0} on extras={{ clock: 'OFF' }} />
      {tap === 'LOOPBACK' ? (
        <Laptop x={LAP_AT.x} y={LAP_AT.y} s={1} />
      ) : (
        <Group>
          <Recorder x={REC_AT.x} y={REC_AT.y} armed={ev.rec.armedAt != null} clip={clip} gain={recGainDb(ev.rec.gain)} elapsed={elapsed} />
          {tap === 'REC_OUT' || tap === 'BOOTH' ? <SplitLead from={from} y0={136} to={lineIn} live={live} trs={tap === 'BOOTH'} /> : null}
        </Group>
      )}
    </Group>
  );
}

/* ── the trays ───────────────────────────────────────────────────────── */

function RecTray({ tr, lead, onPlay, onStop, playing }: { tr: Transport; lead: () => number; onPlay: () => void; onStop: () => void; playing: boolean }) {
  const b = getBooth();
  const ev = evOf(b);
  const m = ev.mic;
  const armed = ev.rec.armedAt != null;
  const take = getTake();
  const record = () => {
    if (armed) {
      closeTake(boothNow());
      updateBooth((x) => withRec(x, { armedAt: null }));
    } else {
      const t = boothNow();
      armTake(t);
      updateBooth((x) => withRec(x, { armedAt: t }));
      if (!musicOn(getBooth())) tr.play('A');
    }
  };
  return (
    <View style={styles.tray}>
      <Row head="THE RECORDER">
        <LabChip label={armed ? '■ STOP RECORDING' : '● RECORD'} selected={armed} onPress={record} compact />
        <LabChip label={playing ? '■ STOP PLAYBACK' : '▶ PLAY THE TAKE'} selected={playing} onPress={() => (playing ? onStop() : take && take.seconds > 0.5 && !armed ? onPlay() : undefined)} compact />
      </Row>
      {armed ? <TrayNote tone="fine">Recording. Stop it before you play it back.</TrayNote> : !take ? <TrayNote tone="fine">No take yet: pick a TAP, then RECORD for ten seconds or so.</TrayNote> : null}
      <Row head="THE MUSIC AND THE MIC">
        <LabChip label={`${b.decks.A.playing ? '❚❚ PAUSE' : '▶ PLAY'} A`} selected={b.decks.A.playing} onPress={() => tr.toggle('A')} compact />
        <LabChip label="● TALK NOW" selected={false} onPress={() => (musicOn(getBooth()) ? announce(lead()) : tr.play('A'))} compact />
        <LabChip label={m.toRec ? 'MIC → REC ON' : 'MIC → REC OFF'} selected={m.toRec} onPress={() => updateBooth((x) => withMic(x, { toRec: !evOf(x).mic.toRec }))} compact />
        {tr.soundDeclined ? <LabChip label="TURN SOUND ON" selected={false} onPress={tr.soundOn} compact /> : null}
      </Row>
      <EventListen />
    </View>
  );
}

/* ── the page ────────────────────────────────────────────────────────── */

const fmtT = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function PageRec({ ctx }: { ctx: PageCtx }) {
  const onChunk = useCallback((r: BoothRender) => {
    if (isEventRender(r)) writeChunk(r);
  }, []);
  const { booth, audio, tr, motion, last } = useEventKit({ onChunk });
  useScreenSetup((b) => {
    let x = cueAtBar(b, 'A', 'nightFerry', 17);
    x = { ...x, ch: { 1: { ...x.ch[1], fader: 0.85, xf: 'THRU', cue: false }, 2: { ...x.ch[2], fader: 0, cue: false } }, mixer: { ...x.mixer, master: 0.6, booth: 0.45, xf: 0.5 }, perspective: 'CROWD' };
    return withFreshEvent(x, (ev) => ({ ...ev, mic: { ...ev.mic, device: 'DYNAMIC', input: 'MIC1', on: true, gain1: micGainPos(44), toRec: false }, rec: { tap: 'NONE', gain: recGainPos(-10), armedAt: null } }));
  });
  const take = useTake();
  const player = useTakePlayer(audio.stop);
  const [check, setCheck] = useState(false);
  const [faultFixed, setFaultFixed] = useState(false);
  const ev = evOf(booth);
  const rec = ev.rec;
  const armed = rec.armedAt != null;
  // the experiment: MASTER moved ≥ 3 dB while recording from REC OUT
  const masterAtArm = useRef<number | null>(null);
  const moved = useRef(false);
  if (armed && rec.tap === 'REC_OUT') {
    if (masterAtArm.current == null) masterAtArm.current = booth.mixer.master;
    const d = Math.abs(20 * Math.log10(levelKnobGain(booth.mixer.master) / Math.max(1e-6, levelKnobGain(masterAtArm.current))));
    if (d >= 3) moved.current = true;
  } else masterAtArm.current = null;
  const recPk = Math.max(extPeak(last, 'recL') ?? -120, extPeak(last, 'recR') ?? -120);
  const recClip = !!last && last.ext.clipped.rec > 0;
  const mPk = Math.max(peakDb(last, 'masterL') ?? -120, peakDb(last, 'masterR') ?? -120);
  const playing = booth.decks.A.playing;
  const hits = [
    rec.tap === 'REC_OUT' && moved.current,
    armed && playing && recPk >= -12 && recPk <= -3 && !recClip,
    armed && voiceIn(last, 'rec'),
    player.finished && !!take && take.hasVoice && take.peakDb > -30,
    faultFixed,
    check,
  ];
  const goals = GOALS_REC.map((label, i) => ({ label, hit: hits[i] }));
  const latched = useVisitGoals(ctx, goals, 'REC');
  const elapsed = armed ? fmtT(Math.max(0, boothNow() - (rec.armedAt ?? 0))) : take ? fmtT(take.seconds) : '0:00';
  const live = playing && (rec.tap === 'REC_OUT' || rec.tap === 'BOOTH');

  const J = MIXER_REAR_JACKS;
  const E = MIXER_REAR_EXTRA;
  const callouts: Callout[] =
    rec.tap === 'LOOPBACK'
      ? [
          { id: 'lb', text: 'LOOPBACK: THE COMPUTER RECORDS ITS OWN OUTPUT', at: { x: LAP_AT.x + LAPTOP_W / 2, y: LAP_AT.y + 40 }, dx: 0, dy: -28, tone: 'amber' },
          { id: 'ro', text: 'REC OUT (NOT USED)', at: { x: (E['rec.L'].x + E['rec.R'].x) / 2, y: E['rec.L'].y + 6 }, dx: 0, dy: 26, tone: 'plain' },
        ]
      : [
          { id: 'ro', text: rec.tap === 'REC_OUT' ? 'REC OUT → RECORDER' : 'REC OUT', at: { x: (E['rec.L'].x + E['rec.R'].x) / 2, y: E['rec.L'].y + 6 }, dx: -10, dy: 30, tone: rec.tap === 'REC_OUT' ? 'green' : 'plain' },
          { id: 'bo', text: rec.tap === 'BOOTH' ? 'BOOTH OUT → RECORDER' : 'BOOTH OUT', at: { x: J['booth.L'].x, y: J['booth.L'].y - 12 }, dx: 0, dy: -22, tone: rec.tap === 'BOOTH' ? 'amber' : 'plain' },
          { id: 'mo', text: 'MASTER → THE ROOM', at: { x: (J['master.L'].x + J['master.R'].x) / 2, y: J['master.L'].y - 12 }, dx: 0, dy: -22, tone: 'plain' },
          { id: 'rc', text: `RECORDER · INPUT ${recGainDb(rec.gain) >= 0 ? '+' : '−'}${Math.abs(recGainDb(rec.gain)).toFixed(0)} dB`, at: { x: REC_AT.x + REC_W / 2, y: REC_AT.y + REC_H }, dx: 0, dy: 16, tone: recClip ? 'red' : 'amber' },
          { id: 'li', text: 'LINE IN', at: { x: REC_AT.x + REC.lineIn.x - 2, y: REC_AT.y + REC.lineIn.y }, dx: -16, dy: 16, tone: 'plain' },
        ];

  return (
    <DjRack
      spec={{
        render: (w, h) => (
          <Scene
            w={w}
            h={h}
            frame={frameFor(rec.tap)}
            motion={motion}
            fit={{ x: 0, y: 0, w, h: h * 0.64 }}
            aspect={false}
            a11y={`${LOOK} Tap: ${rec.tap === 'NONE' ? 'nothing plugged in' : REC_TAPS[rec.tap as Exclude<RecTap, 'NONE'>].label}. ${take ? `The take is ${take.seconds.toFixed(1)} seconds${take.hasVoice ? ', with the voice in it' : ', with no voice in it'}.` : 'No take yet.'}`}
            obstacles={[{ x: 0, y: 0, w: MIXER_REAR.w, h: MIXER_REAR.h }, ...(rec.tap === 'LOOPBACK' ? [] : [{ x: REC_AT.x, y: REC_AT.y, w: REC_W, h: REC_H }])]}
            callouts={callouts}
            screenOverlay={(sw, sh, _x, kz) => <TakeLane b={{ x: 14, y: sh * 0.64 + 26 * Math.sqrt(Math.max(1, kz)), w: sw - 28, h: sh * 0.36 - 40 * Math.sqrt(Math.max(1, kz)) }} take={take} pos={player.pos} k={Math.sqrt(Math.max(1, kz))} recording={armed} />}
          >
            <GearView booth={booth} live={live} elapsed={elapsed} clip={recClip} />
          </Scene>
        ),
        bezel: [dbCell('REC PEAK', armed || live ? (recPk > -100 ? recPk : null) : null), { k: 'RECORDER', v: recClip ? 'CLIPPING' : armed ? 'RECORDING' : 'STOPPED', tint: recClip ? PEAK_RED : armed ? colors.red : colors.textSub }, dbCell('MASTER PEAK', mPk > -100 ? mPk : null), voiceCell(last)],
        params: [
          {
            kind: 'fader',
            id: 'recGain',
            label: 'REC GAIN',
            value: rec.gain,
            level: true,
            home: 0.5,
            locked: rec.tap === 'NONE' ? 'Pick a TAP first — the recorder has nothing in its input.' : undefined,
            onChange: (v) => updateBooth((b) => withRec(b, { gain: v })),
            format: (v) => `RECORDER INPUT ${recGainDb(v) >= 0 ? '+' : '−'}${Math.abs(recGainDb(v)).toFixed(1)} dB`,
            formatShort: (v) => `${recGainDb(v) >= 0 ? '+' : '−'}${Math.abs(recGainDb(v)).toFixed(0)}`,
            nudges: [
              { label: '−1 dB', onPress: () => updateBooth((b) => withRec(b, { gain: recGainPos(recGainDb(evOf(b).rec.gain) - 1) })), a11y: 'Recorder gain down one decibel' },
              { label: '+1 dB', onPress: () => updateBooth((b) => withRec(b, { gain: recGainPos(recGainDb(evOf(b).rec.gain) + 1) })), a11y: 'Recorder gain up one decibel' },
            ],
          },
          {
            kind: 'fader',
            id: 'master',
            label: 'MASTER',
            value: booth.mixer.master,
            level: true,
            home: 0.75,
            onChange: (v) => updateBooth((b) => ({ ...b, mixer: { ...b.mixer, master: v } })),
            format: (v) => `MASTER ${Math.round(v * 100)}% · ${(20 * Math.log10(Math.max(1e-6, levelKnobGain(v)))).toFixed(1)} dB`,
            formatShort: (v) => `${Math.round(v * 100)}%`,
          },
          {
            kind: 'options',
            id: 'tap',
            label: 'TAP',
            valueLabel: rec.tap === 'NONE' ? 'NONE' : rec.tap === 'REC_OUT' ? 'REC OUT' : rec.tap,
            options: [
              { id: 'REC_OUT', label: 'REC OUT', blurb: REC_TAPS.REC_OUT.blurb },
              { id: 'BOOTH', label: 'BOOTH OUT', blurb: REC_TAPS.BOOTH.blurb },
              { id: 'LOOPBACK', label: 'LOOPBACK', blurb: REC_TAPS.LOOPBACK.blurb },
              { id: 'NONE', label: 'UNPLUG', blurb: 'Nothing goes to the recorder.' },
            ],
            selectedId: rec.tap,
            onSelect: (id) => updateBooth((b) => withRec(b, { tap: id as RecTap })),
            sticky: true,
          },
          { kind: 'group', id: 'rec', label: 'REC', valueLabel: armed ? '● REC' : player.playing ? '▶ TAKE' : take ? 'TAKE' : 'READY', render: () => <RecTray tr={tr} lead={audio.leadSec} onPlay={() => { const t = getTake(); if (t) player.play(t); }} onStop={player.stop} playing={player.playing} /> },
          stopKey(tr),
        ],
        initialParam: 'recGain',
      }}
    >
      <Step n={1}>
        <Look>{LOOK}</Look>
        <P>A recording is only as good as the feed it takes and the level it takes it at — and only playback proves it. Pick the tap, set the RECORDER’s own level, and listen back.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Pick TAP → REC OUT, open REC, play deck A and press RECORD. Now ride MASTER up and down: the room changes, the RECORDER’s meters do not.</Do>
        <P>Try BOOTH OUT and do the same with the booth — every booth move is in the take. LOOPBACK records only what the computer plays: here, nothing at all.</P>
      </Step>
      <Step n={3}>
        <P>Set REC GAIN so the RECORDER’s peaks sit between −12 and −3 dBFS. Switch MIC → REC on and TALK while you record, then STOP and PLAY THE TAKE: the green marks under the waveform are where the mic is in the file. Listen as RECORDER to hear its input live.</P>
        <Note>Streaming and recording rules depend on the service and on the music: some services will not let you record or stream certain tracks, or need permission. Check the rules of the one you use before the event.</Note>
      </Step>
      <Step n={4}>
        <Do>Record from REC OUT and prove MASTER does not ride it, set a clean capture level, get the mic into the take, and play back a take with music and voice.</Do>
        <GoalChips goals={goals.slice(0, 4)} latched={latched.slice(0, 4)} />
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow="CHECK YOURSELF"
          question="You stream from a laptop. You hear yourself twice, a fraction of a second apart, and it keeps getting louder. The app is set to monitor its input, and the laptop’s output feeds a channel on the mixer that is up. What do you change?"
          options={['Turn the app’s input monitoring off (or take that channel down) — the recording is being fed back into the mix', 'Turn the recorder’s input gain up', 'Switch the mic to the booth', 'Lower the crossfader curve']}
          correct={0}
          explain="That is a monitoring loop: the app sends what it records back out, the mixer plays it again, and the app records it again — a delayed echo that can grow into a howl. Monitor the stream in headphones, never back into the mix."
          wrong={[undefined, 'More gain feeds the loop more.', 'The loop runs through the computer and the mixer, not the booth monitors.', 'The crossfader curve does not change a loop through the computer.']}
          onCorrect={() => setCheck(true)}
        />
        <FaultCard
          title="THE RECORDER CLIPS, THE ROOM IS FINE"
          symptom="The crowd hears a clean mix, but the recorder’s CLIP light keeps flashing and the take is crunchy."
          start={() => {
            void audio.requestSound();
            const t = boothNow();
            if (!takeOpen()) armTake(t);
            updateBooth((b, tt) => {
              const x = withRec(b, { tap: 'REC_OUT', gain: recGainPos(18), armedAt: evOf(b).rec.armedAt ?? t });
              return { ...x, decks: { ...x.decks, A: { ...x.decks.A, playing: true, at: tt } } };
            });
          }}
          fixed={!!last && playing && last.ext.clipped.rec === 0 && recGainDb(rec.gain) <= 6 && rec.tap !== 'NONE'}
          hints={['Compare MASTER PEAK and REC PEAK on the strip: which one is in the red?', 'The MASTER is fine — the overload is the RECORDER’s own input gain.', 'Bring REC GAIN down until REC PEAK sits around −6 dBFS. Leave the MASTER where it is.']}
          why="Every stage has its own limit: a clean MASTER says nothing about a recorder whose own input is turned up too far. Fix the stage that clips — and know that the clipped seconds already in the file stay clipped."
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

export const P21: PageDef = { title: 'Recording and streaming', short: 'REC', Component: PageRec, manualDone: true, rack: true };
