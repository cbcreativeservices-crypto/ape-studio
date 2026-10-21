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
 *
 * Second reviews 2026-10-18: the take lane uses the shared waveform renderer
 * with a dBFS scale and the capture target; the split lead's 3.5 mm plug is
 * drawn seated in LINE IN; the screen opens on TAP; REC GAIN is locked on
 * LOOPBACK; the playback goal latches once the take has played past its
 * first voice mark; and CHECK YOURSELF is evidence: a BOOTH OUT take with a
 * booth move in it, played back.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { StyleSheet, View } from 'react-native';
import { Group } from '@shopify/react-native-skia';
import { colors } from '../../../../theme/tokens';
import { LabChip } from '../../LabShell';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import { Scene, type Callout } from '../art/Scene';
import { MixerRear } from '../art/RearPanels';
import { Recorder, REC, REC_H, REC_W, SplitLead, TakeLane } from '../art/RecorderGear';
import { Laptop, LAPTOP_W } from '../art/gear';
import { CableRun } from '../art/cables';
import { MIXER_REAR, MIXER_REAR_JACKS, type Box } from '../geometry/boothGeometry';
import { BOOTH_LOOSE, BOOTH_SPLIT_JOG, LOOSE_TRS_LEN, MIXER_REAR_EXTRA, REC_BOOTH_FRAME, boothLooseHang } from '../geometry/eventGeometry';
import { DjRack } from '../DjRack';
import { Do, EvidenceCheck, FaultCard, GoalChips, Look, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { stopKey, type Transport } from '../dock';
import { boothNow, getBooth, updateBooth } from '../booth/boothStore';
import { cueAtBar, useScreenSetup } from '../booth/setup';
import { armTake, closeTake, getTake, takeOpen, useTake, writeChunk } from '../booth/takeStore';
import { useTakePlayer } from '../booth/useTakePlayer';
import { levelKnobGain, type Booth } from '../model/djModel';
import { REC_TAPS, evOf, micGainPos, recGainDb, recGainPos, recHoldsBoothOut, withMic, withRec, type RecTap } from '../model/djEvent';
import { announce, dbCell, EventListen, extPeak, musicOn, Row, TrayNote, useEventKit, useFreshReading, voiceCell, voiceIn, withFreshEvent } from './eventShared';
import { PEAK_RED, peakDb } from './shared';
import type { BoothRender } from '../engine/djRender';
import { isEventRender } from '../engine/djEventRender';

const TERMS = [
  { term: 'Record tap', def: 'Where the recorder takes its feed from. A REC OUT is usually a fixed-level copy of the mix, so your MASTER moves never ride the take; a booth or master output follows its knob. Mixers differ.' },
  { term: 'Capture level', def: 'The recorder’s own input gain. Set it on the loudest part with headroom: peaks around −12 to −3 dBFS on the RECORDER’s meter is a good starting point. A clip there is in the file forever.' },
  { term: 'Loopback', def: 'Software that records what the computer itself is playing. It never hears the mixer, the players or the mic — only the computer’s own output.' },
  { term: 'Monitoring loop', def: 'When an app sends what it records back out to something that feeds it again: an echo that can build into a howl. Monitor the recording in headphones, never back into the mix.' },
] as const;

export const GOALS_REC = ['Tap REC OUT, then move MASTER: the take stays', 'Capture level: peaks −12 … −3 dBFS, no clip', 'The mic in the take', 'Play back a take with music and voice', 'Stop the recorder clipping', 'Pass the check'] as const;

/**
 * R4-DJ-01: what LOOK says follows the TAP, exactly as the drawing shows it
 * (RecorderGear.SplitLead: RCA legs in REC OUT, 6.35 mm jack legs in BOOTH
 * OUT, one 3.5 mm plug in the recorder's LINE IN; LOOPBACK draws the laptop
 * and no recorder; UNPLUG, the recorder with nothing in it).
 */
export function lookFor(tap: RecTap): string {
  switch (tap) {
    case 'REC_OUT':
      return 'You are looking at the back of the mixer and a handheld recorder, joined by a split lead: two RCA plugs (white and red) in the mixer’s REC OUT, into one small stereo plug (3.5 mm) in the recorder’s LINE IN. The take is below.';
    case 'BOOTH':
      return 'You are looking at the back of the mixer and a handheld recorder, joined by a split lead: two ¼-inch (6.35 mm) jack plugs in the mixer’s BOOTH OUT, into one small stereo plug (3.5 mm) in the recorder’s LINE IN. The take is below.';
    case 'LOOPBACK':
      return 'You are looking at the back of the mixer and a laptop. No lead joins them: loopback records only what the computer plays. The take is below.';
    default:
      return 'You are looking at the back of the mixer and a handheld recorder with nothing in its LINE IN. The take is below.';
  }
}

/* ── the stage (mm) ───────────────────────────────────────────────────── */

const REC_AT = { x: 334, y: -14 };
const LAP_AT = { x: 316, y: -60 };
const frameFor = (tap: RecTap): Box => (tap === 'LOOPBACK' ? { x: -10, y: -70, w: 670, h: 380 } : tap === 'BOOTH' ? REC_BOOTH_FRAME : { x: -14, y: -26, w: 432, h: 184 });
/** R3-DJ-01: the strip the loose BOOTH cables hang in (no label sits on it). */
const LOOSE_STRIP: Box = { x: BOOTH_LOOSE.R.x + BOOTH_LOOSE.lean - 8, y: REC_BOOTH_FRAME.y, w: BOOTH_LOOSE.L.x - BOOTH_LOOSE.R.x - BOOTH_LOOSE.lean + 16, h: BOOTH_LOOSE.L.boot + LOOSE_TRS_LEN + 4 - REC_BOOTH_FRAME.y };

/**
 * R3-DJ-01 (owner 2026-10-21): with BOOTH OUT as the tap, the recorder's
 * split lead is in both BOOTH OUT jacks, so the booth monitors' BOOTH cables
 * are out of them — one plug per jack. They hang loose beside the mixer,
 * down from the monitors, each in its own lane, its plug pins-down; the
 * monitors are silent (renderEvent). Another tap puts them back.
 */
function LooseBoothCables() {
  return (
    <Group>
      {(['R', 'L'] as const).map((side) => {
        const dense = boothLooseHang(side);
        return (
          <CableRun
            key={side}
            r={{ id: `bth.trs${side}`, kind: 'trs', colour: '#101113', pts: [dense[0], dense[dense.length - 1]], dense, plugged: false, live: false, noFixedPlug: true, label: `BOOTH ${side}`, dashed: side === 'R' }}
          />
        );
      })}
    </Group>
  );
}
/** The gear's share of the glass; the take lane takes the rest. */
const GEAR_SHARE = 0.56;

export function GearView({ booth, live, elapsed, clip }: { booth: Booth; live: boolean; elapsed: string; clip: boolean }) {
  const ev = evOf(booth);
  const tap = ev.rec.tap;
  const E = MIXER_REAR_EXTRA;
  const J = MIXER_REAR_JACKS;
  const from: [{ x: number; y: number }, { x: number; y: number }] =
    tap === 'BOOTH' ? [{ x: J['booth.L'].x, y: J['booth.L'].y }, { x: J['booth.R'].x, y: J['booth.R'].y }] : [{ x: E['rec.L'].x, y: E['rec.L'].y }, { x: E['rec.R'].x, y: E['rec.R'].y }];
  const boothTaken = recHoldsBoothOut(ev);
  const lineIn = { x: REC_AT.x + REC.lineIn.x, y: REC_AT.y + REC.lineIn.y };
  return (
    <Group>
      <MixerRear x={0} y={0} on extras={{ clock: 'OFF' }} />
      {tap === 'LOOPBACK' ? (
        <Laptop x={LAP_AT.x} y={LAP_AT.y} s={1} />
      ) : (
        <Group>
          <Recorder x={REC_AT.x} y={REC_AT.y} armed={ev.rec.armedAt != null} clip={clip} gain={recGainDb(ev.rec.gain)} elapsed={elapsed} />
          {tap === 'REC_OUT' || tap === 'BOOTH' ? <SplitLead from={from} y0={136} to={lineIn} live={live} trs={tap === 'BOOTH'} jog={tap === 'BOOTH' ? BOOTH_SPLIT_JOG : undefined} /> : null}
        </Group>
      )}
      {boothTaken ? <LooseBoothCables /> : null}
    </Group>
  );
}

/* ── the trays ───────────────────────────────────────────────────────── */

function RecTray({ tr, lead, onPlay, onStop, onArm, playing }: { tr: Transport; lead: () => number; onPlay: () => void; onStop: () => void; onArm: (t: number) => void; playing: boolean }) {
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
      onArm(t);
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
      <Row head={`BOOTH LEVEL ${Math.round(b.mixer.booth * 100)}% (what BOOTH OUT follows)`}>
        <LabChip label="BOOTH −" selected={false} onPress={() => updateBooth((x) => ({ ...x, mixer: { ...x.mixer, booth: Math.max(0, Math.round((x.mixer.booth - 0.1) * 20) / 20) } }))} compact />
        <LabChip label="BOOTH +" selected={false} onPress={() => updateBooth((x) => ({ ...x, mixer: { ...x.mixer, booth: Math.min(1, Math.round((x.mixer.booth + 0.1) * 20) / 20) } }))} compact />
      </Row>
      <EventListen />
    </View>
  );
}

/* ── the page ────────────────────────────────────────────────────────── */

/** Booth seconds into a take of its first voice mark. */
function firstVoiceSec(t: { seconds: number; cols: { voice: Uint8Array } }): number {
  const n = t.cols.voice.length;
  const i = t.cols.voice.findIndex((v) => v === 1);
  return i < 0 ? Infinity : (i / n) * t.seconds;
}

const fmtT = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function PageRec({ ctx }: { ctx: PageCtx }) {
  const onChunk = useCallback((r: BoothRender) => {
    if (isEventRender(r)) writeChunk(r);
  }, []);
  const { booth, audio, tr, motion, last } = useEventKit({ onChunk });
  const { ready } = useScreenSetup((b) => {
    let x = cueAtBar(b, 'A', 'nightFerry', 17);
    x = { ...x, ch: { 1: { ...x.ch[1], fader: 0.85, xf: 'THRU', cue: false }, 2: { ...x.ch[2], fader: 0, cue: false } }, mixer: { ...x.mixer, master: 0.6, booth: 0.45, xf: 0.5 }, perspective: 'CROWD' };
    return withFreshEvent(x, (ev) => ({ ...ev, mic: { ...ev.mic, device: 'DYNAMIC', input: 'MIC1', on: true, gain1: micGainPos(44), toRec: false }, rec: { tap: 'NONE', gain: recGainPos(-10), armedAt: null } }));
  });
  const take = useTake();
  const player = useTakePlayer(audio.stop);
  // A take left RECORDING by a screen the learner walked away from (here, or
  // the capstone) kept filling from every chunk while the recorder read
  // STOPPED: close it on arrival and on leaving (toddler hunt 2026-10-19).
  useEffect(() => {
    if (takeOpen()) closeTake(boothNow());
    return () => {
      if (takeOpen()) closeTake(boothNow());
    };
  }, []);
  // which take was armed on THIS visit, and which one was last played: the
  // playback goals need the take just recorded here, actually played (an
  // old take played to its end left `finished` on for the next one)
  const armedHere = useRef<number | null>(null);
  const playedTake = useRef<number | null>(null);
  const heardThisTake = !!take && armedHere.current === take.armedAt && playedTake.current === take.armedAt && (player.finished || player.playing);
  const fresh = useFreshReading(booth, last);
  const [check, setCheck] = useState(false);
  // the take plays with the booth stopped: re-read its progress as it
  // crosses each half second (the playhead's own value, no polling)
  const [, setTick] = useState(0);
  const bump = (v: number) => setTick(v);
  useAnimatedReaction(
    () => Math.floor(player.pos.value * 2),
    (now, prev) => {
      if (now !== prev) runOnJS(bump)(now);
    },
  );
  const [faultFixed, setFaultFixed] = useState(false);
  const ev = evOf(booth);
  const rec = ev.rec;
  const armed = rec.armedAt != null;
  // the experiment: MASTER moved ≥ 3 dB while recording from REC OUT
  const masterAtArm = useRef<number | null>(null);
  const moved = useRef(false);
  if (ready && armed && rec.tap === 'REC_OUT') {
    if (masterAtArm.current == null) masterAtArm.current = booth.mixer.master;
    const d = Math.abs(20 * Math.log10(levelKnobGain(booth.mixer.master) / Math.max(1e-6, levelKnobGain(masterAtArm.current))));
    if (d >= 3) moved.current = true;
  } else masterAtArm.current = null;
  // the check: a BOOTH OUT take with a booth move of 3 dB or more in it
  const boothAtArm = useRef<number | null>(null);
  const boothTake = useRef<'none' | 'recording' | 'moved' | 'done'>('none');
  if (ready && armed && rec.tap === 'BOOTH') {
    if (boothAtArm.current == null) {
      boothAtArm.current = booth.mixer.booth;
      boothTake.current = 'recording';
    }
    const d = Math.abs(20 * Math.log10(levelKnobGain(booth.mixer.booth) / Math.max(1e-6, levelKnobGain(boothAtArm.current))));
    if (d >= 3) boothTake.current = 'moved';
  } else {
    if (boothTake.current === 'moved' && !armed) boothTake.current = 'done';
    else if (boothTake.current === 'recording' && !armed) boothTake.current = 'none';
    if (armed) boothTake.current = 'none';
    boothAtArm.current = null;
  }
  const recPk = Math.max(extPeak(last, 'recL') ?? -120, extPeak(last, 'recR') ?? -120);
  const recClip = !!last && last.ext.clipped.rec > 0;
  const mPk = Math.max(peakDb(last, 'masterL') ?? -120, peakDb(last, 'masterR') ?? -120);
  const playing = booth.decks.A.playing;
  const hits = [
    rec.tap === 'REC_OUT' && moved.current,
    fresh && armed && playing && recPk >= -12 && recPk <= -3 && !recClip,
    fresh && armed && voiceIn(last, 'rec'),
    heardThisTake && !!take && take.hasVoice && take.peakDb > -30 && player.pos.value >= firstVoiceSec(take) + 2,
    faultFixed,
    check,
  ];
  const goals = GOALS_REC.map((label, i) => ({ label, hit: hits[i] }));
  const latched = useVisitGoals(ctx, goals, 'REC', ready);
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
          { id: 'ro', text: rec.tap === 'REC_OUT' ? 'REC OUT → RECORDER' : 'REC OUT', at: { x: (E['rec.L'].x + E['rec.R'].x) / 2, y: E['rec.L'].y - 6 }, dx: 30, dy: -16, tone: rec.tap === 'REC_OUT' ? 'green' : 'plain' },
          { id: 'bo', text: rec.tap === 'BOOTH' ? 'BOOTH OUT → RECORDER' : 'BOOTH OUT', at: { x: J['booth.L'].x, y: J['booth.L'].y - 12 }, dx: 0, dy: -22, tone: rec.tap === 'BOOTH' ? 'amber' : 'plain' },
          ...(rec.tap === 'BOOTH' ? [{ id: 'bm', text: 'BOOTH MONITORS UNPLUGGED', lines: ['BOOTH MONITORS', 'UNPLUGGED'], at: { x: BOOTH_LOOSE.L.x, y: BOOTH_LOOSE.L.boot + LOOSE_TRS_LEN }, dx: 0, dy: 18, tone: 'amber' as const }] : []),
          { id: 'mo', text: 'MASTER → THE ROOM', at: { x: (J['master.L'].x + J['master.R'].x) / 2, y: J['master.L'].y - 12 }, dx: 0, dy: -22, tone: 'plain' },
          { id: 'rc', text: `RECORDER · INPUT ${recGainDb(rec.gain) >= 0 ? '+' : '−'}${Math.abs(recGainDb(rec.gain)).toFixed(0)} dB`, at: { x: REC_AT.x + REC_W / 2, y: REC_AT.y + REC_H }, dx: 0, dy: 16, tone: recClip ? 'red' : 'amber' },
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
            fit={{ x: 0, y: 0, w, h: h * GEAR_SHARE }}
            aspect={false}
            focus={rec.tap === 'LOOPBACK' ? undefined : { x: REC_AT.x - 40, y: REC_AT.y + 40, w: 120, h: 80 }}
            a11y={`${lookFor(rec.tap)} Tap: ${rec.tap === 'NONE' ? 'nothing plugged in' : REC_TAPS[rec.tap as Exclude<RecTap, 'NONE'>].label}.${rec.tap === 'BOOTH' ? ' The booth monitors’ two cables hang unplugged beside the mixer: BOOTH OUT holds the recorder’s lead, so the monitors are silent.' : ''} ${take ? `The take is ${take.seconds.toFixed(1)} seconds${take.hasVoice ? ', with the voice in it' : ', with no voice in it'}.` : 'No take yet.'}`}
            obstacles={[{ x: 0, y: 0, w: MIXER_REAR.w, h: MIXER_REAR.h }, ...(rec.tap === 'BOOTH' ? [LOOSE_STRIP] : []), ...(rec.tap === 'LOOPBACK' ? [] : [{ x: REC_AT.x - 12, y: REC_AT.y, w: REC_W + 18, h: REC_H }, { x: E['rec.L'].x - 8, y: E['rec.L'].y, w: REC_AT.x - E['rec.L'].x, h: 136 + 14 - E['rec.L'].y }])]}
            callouts={callouts}
            screenOverlay={(sw, sh, _x, kz) => <TakeLane b={{ x: 12, y: sh * GEAR_SHARE + 2, w: sw - 24, h: sh * (1 - GEAR_SHARE) - 10 * Math.sqrt(Math.max(1, kz)) }} take={take} pos={player.pos} k={Math.sqrt(Math.max(1, kz))} recording={armed} />}
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
            locked: rec.tap === 'NONE' ? 'Pick a TAP first — the recorder has nothing in its input.' : rec.tap === 'LOOPBACK' ? 'Loopback records the computer’s own output — there is no recorder input here.' : undefined,
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
          { kind: 'group', id: 'rec', label: 'REC', valueLabel: armed ? '● REC' : player.playing ? '▶ TAKE' : take ? 'TAKE' : 'READY', render: () => <RecTray tr={tr} lead={audio.leadSec} onPlay={() => { const t = getTake(); if (t) { playedTake.current = t.armedAt; player.play(t); } }} onStop={player.stop} onArm={(t) => { armedHere.current = t; }} playing={player.playing} /> },
          stopKey(tr),
        ],
        initialParam: 'tap',
      }}
    >
      <Step n={1}>
        <Look>{lookFor(rec.tap)}</Look>
        <P>A recording is only as good as the feed it takes and the level it takes it at — and only playback proves it. Pick the tap, set the RECORDER’s own level, and listen back.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Pick TAP → REC OUT, open REC, play deck A and press RECORD. Now ride MASTER up and down: the room changes, the RECORDER’s meters do not.</Do>
        <P>Try BOOTH OUT and do the same with the booth — every booth move is in the take. LOOPBACK records only what the computer plays: here, nothing at all.</P>
      </Step>
      <Step n={3}>
        <P>Set REC GAIN so the RECORDER’s peaks sit between −12 and −3 dBFS. Switch MIC → REC on and TALK while you record, then STOP and PLAY THE TAKE: the green marks under the waveform are where the mic is in the file. Listen as RECORDER to hear its input live.</P>
        <Note>On the recorder itself: its LINE input (not MIC), and AUTO LEVEL or its limiter OFF — or it pumps the mix up and down. If you stream from an app, monitor it in headphones, never back into the mix (Terms: Monitoring loop).</Note>
        <Note>Streaming and recording rules depend on the service and on the music: some services will not let you record or stream certain tracks, or need permission. Check the rules of the one you use before the event.</Note>
      </Step>
      <Step n={4}>
        <Do>Record from REC OUT and prove MASTER does not ride it, set a clean capture level, get the mic into the take, and play back a take with music and voice.</Do>
        <GoalChips goals={goals.slice(0, 4)} latched={latched.slice(0, 4)} />
      </Step>
      <Step n={5}>
        <EvidenceCheck
          task="record about 10 s from BOOTH OUT, move the BOOTH level by 3 dB or more while it records, then STOP and play the take back — and find the jump in it."
          met={boothTake.current === 'done' && heardThisTake}
          progress={boothTake.current === 'recording' ? 'Recording from BOOTH OUT — now move the BOOTH (MASTER is not it).' : boothTake.current === 'moved' ? 'The booth move is in the take — STOP, then PLAY THE TAKE.' : null}
          explain="BOOTH OUT follows the BOOTH knob, so every booth move is in the file — the jump is there in the waveform. REC OUT is taken before the knobs: that is why it is the tap for a recording."
          onMet={() => setCheck(true)}
        />
        <FaultCard
          title="THE RECORDER CLIPS, THE ROOM IS FINE"
          symptom="The crowd hears a clean mix, but the recorder’s CLIP light keeps flashing and the take is crunchy."
          start={() => {
            void audio.requestSound();
            const t = boothNow();
            if (!takeOpen()) {
              armTake(t);
              armedHere.current = t;
            }
            updateBooth((b, tt) => {
              const x = withRec(b, { tap: 'REC_OUT', gain: recGainPos(18), armedAt: evOf(b).rec.armedAt ?? t });
              return { ...x, decks: { ...x.decks, A: { ...x.decks.A, playing: true, at: tt } } };
            });
          }}
          // LOOPBACK records nothing, so it cannot be the recorder's cure
          fixed={!!last && playing && last.ext.clipped.rec === 0 && recGainDb(rec.gain) <= 6 && (rec.tap === 'REC_OUT' || rec.tap === 'BOOTH')}
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
