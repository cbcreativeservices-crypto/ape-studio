/**
 * Screen 19 — Microphones, announcements and talkover (research DJ23).
 *
 * A dynamic mic, a condenser and a wireless set into THIS mixer's front
 * panel: MIC 1 (the only input with +48 V phantom — phantom belongs to the
 * input) and MIC 2; gain, level, the ON mute, TALK OVER (a voice-keyed dip
 * of the music) and the mic's sends to the BOOTH and the RECORD output (the
 * MASTER always carries it). Two views of one booth: the MIXER (the front
 * panel, the mic and its cable, the feed meters with their dB scale and the
 * speech target, and the music's dip pinned above) and the ROOM (where the
 * mic is, its cardioid pickup, every speaker that can feed back into it,
 * and the loop margin from model/djEvent.feedbackOf).
 *
 * The fault: the room hears the announcement, the recording does not (the
 * mic is not sent to REC — a common factory default). Feedback is modelled
 * and kept SAFE: the lab plays only a quiet, capped stand-in of a ring.
 *
 * Second reviews 2026-10-18: speech target −18 … −8 dBFS with a SHOUT check
 * (audio #5); line is 40–55 dB over mic (#6); phantom wording (#32); the
 * check is evidence (the wireless overload, fixed on the rig); meters with a
 * scale, horizontal names and the target band; the dip strip out of the
 * gear; the cable round the mixer into MIC 1 from below; the receiver
 * beside the mixer at the same scale (visual #13, #14).
 */
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BlurMask, Group, Line, LinearGradient, Oval, Rect, RoundedRect, vec } from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import { colors } from '../../../../theme/tokens';
import { LabChip } from '../../LabShell';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import { Scene, type Callout } from '../art/Scene';
import { DcPlugged, HandheldMic, MicXlrPlug, MixerFront, ReceiverRear, TableTop, XlrPlugged, FRONT, FRONT_W, FRONT_H, frontPartBox, RX_JACKS, RX_W, RX_H, type FrontPart } from '../art/MicGear';
import { HeatLegend, LEGEND_H, PlanView, PLAN_STAGE, planAt, planObstacles } from '../art/PlanView';
import { CableFlag } from '../art/cables';
import { Cable, LED_DB, LedColumn, LoosePlug } from '../art/parts';
import { useTapDb } from '../art/motion';
import { useDuckDb, useExtTapDb } from '../art/eventMotion';
import { INK } from '../art/ink';
import { SceneText, useLabelMm } from '../art/sceneText';
import type { Box } from '../geometry/boothGeometry';
import { DjRack } from '../DjRack';
import { Do, EvidenceCheck, FaultCard, GoalChips, Look, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { stopKey, type Transport } from '../dock';
import { getBooth, updateBooth } from '../booth/boothStore';
import { cueAtBar, useScreenSetup } from '../booth/setup';
import { type Booth } from '../model/djModel';
import {
  MIC_INPUTS,
  MIC_POS,
  SHOUT_DB,
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
import { PEAK_RED } from './shared';

const TERMS = [
  { term: 'Phantom power (+48 V)', def: 'A small DC voltage some inputs send up the mic cable to power a condenser mic. It belongs to the INPUT: on this mixer only MIC 1 has it. A balanced dynamic mic needs none and ignores it; keep +48 V off for anything not made for it (some ribbon mics, unbalanced adapters, line gear on a combo jack).' },
  { term: 'Talkover (ducking)', def: 'Dips the music while you speak, so the voice sits on top. Here it listens to the mic and comes back up when you stop. Real mixers differ: some dip whenever the mic is on.' },
  { term: 'Feedback', def: 'The speakers play the mic, the mic hears the speakers, round and round. When the sound comes round louder each time, it rings by itself and keeps growing — pull the mic level down at once.' },
  { term: 'Mic send', def: 'Which outputs carry the mic. MASTER always does here; BOOTH and REC only when their switch is on. Many mixers leave the mic OUT of the booth and the record output until you switch it in.' },
] as const;

export const GOALS_MIC = ['Mic live: speech peaks −18 … −8 dBFS', 'Talk over: the music dips, then recovers', 'Power a condenser from the right input', 'Make it ring, then win back 6 dB', 'Fix the voiceless recording', 'Pass the check'] as const;

/** The speech target on the MIC meter (a suggested starting point). */
const TARGET = { lo: -18, hi: -8 } as const;

const LOOK_MIXER = 'You are looking at the mixer’s front panel with its two mic inputs, the mic on its cable, four meters — MIC, CROWD, BOOTH, REC — and the music’s dip above.';
const LOOK_ROOM = 'You are looking down on the room: the booth table, the PA tops and booth monitors, and the mic with its pickup drawn round it. Dashed lines are the speakers it hears.';

/* ── the stage (mm) ───────────────────────────────────────────────────── */

/** The booth table: the mixer and the receiver stand on its back line
 *  (y), the mic and its lead LIE on its top (lab-art grade 2026-10-19: the
 *  mic hung in mid-air, held by nothing). */
const TABLE = { y: 216, depth: 84 } as const;
const FRAME_WIRED: Box = { x: 0, y: 0, w: 390, h: TABLE.y + TABLE.depth + 9 };
const FRAME_WIRELESS: Box = { x: 0, y: -10, w: 630, h: TABLE.y + TABLE.depth + 19 };
/** With the receiver beside the mixer, the meters move right, past it. */
const MET_SHIFT_WIRELESS = 236;
/** The feed meters, at the top RIGHT: the space over the panel's left is
 *  the labels' (each label right above its control, short upright leaders). */
const MET = { y: 17, h: 114, w: 8, xs: [292, 320, 348, 376] as const };
const MET_NAMES = ['MIC', 'CROWD', 'BOOTH', 'REC'] as const;
/** The panel at the left of the table: its labels go above it, the sends'
 *  to its right, and the mic and its lead lie in front of it. */
const FRONT_AT = { x: 4, y: TABLE.y - FRONT_H };
const RX_AT = { x: 290, y: TABLE.y - RX_H };
/** The mic lying on the table, its grille ball to the left: a rigid body
 *  rests on its two lowest points — the ball and the plug's barrel at the
 *  tail (the wireless: its antenna cap) — so it lies tilted a few degrees. */
const CONTACT_Y = 280;
const BALL_X = 112;
const BALL_R: Record<MicDevice, number> = { DYNAMIC: 25, CONDENSER: 23, WIRELESS: 25 };
const TAIL_R: Record<MicDevice, number> = { DYNAMIC: 11, CONDENSER: 11, WIRELESS: 14.5 };
const REST: Record<MicDevice, number> = { DYNAMIC: 205, CONDENSER: 205, WIRELESS: 236 };
const micAt = (d: MicDevice) => ({ x: BALL_X, y: CONTACT_Y - BALL_R[d], ang: Math.asin((BALL_R[d] - TAIL_R[d]) / REST[d]) });
/** The lead's run along the table at the mixer's foot, and where the wired
 *  lead turns back from the mic's tail. */
const LANE_Y = TABLE.y + 5;
const LOOP_X = 374;

const jackAt = (inp: MicInput): { x: number; y: number } | null =>
  inp === 'MIC1' ? { x: FRONT_AT.x + FRONT.mic1.x, y: FRONT_AT.y + FRONT.mic1.y } : inp === 'MIC2' ? { x: FRONT_AT.x + FRONT.mic2.x, y: FRONT_AT.y + FRONT.mic2.y } : null;

/** The mic's tail (scene mm) where its cable leaves, and the plug's far end. */
const tailAt = (d: MicDevice) => {
  const m = micAt(d);
  return { x: m.x + Math.cos(m.ang) * 182, y: m.y + Math.sin(m.ang) * 182 };
};
const plugEnd = (d: MicDevice) => {
  const m = micAt(d);
  const t = tailAt(d);
  return { x: t.x + 44 * Math.cos(m.ang), y: t.y + 44 * Math.sin(m.ang) };
};
const rxOut = () => ({ x: RX_AT.x + RX_JACKS.out.x, y: RX_AT.y + RX_JACKS.out.y });
const rxDc = () => ({ x: RX_AT.x + RX_JACKS.dc.x, y: RX_AT.y + RX_JACKS.dc.y });

type P = [number, number];
const XLR_STYLE = { colour: '#3d4046', width: 4.6, pattern: 'stripe' as const };

/** The mic lead, LYING on the table: from the mic's plug it turns back
 *  toward the mixer, runs along the table at the mixer's foot, and rises
 *  into the front-panel jack (the plug's boot pointing down, the way a lead
 *  hangs from a front jack). The wireless receiver's lead drops from its
 *  BAL OUT to the table and runs the same lane. Unplugged, the free end
 *  lies on the table, its plug pointing at the panel. */
function MicCable({ inp, device, live }: { inp: MicInput; device: MicDevice; live: boolean }) {
  const j = jackAt(inp);
  const wireless = device === 'WIRELESS';
  let run: P[];
  let flag: P;
  if (wireless) {
    const o = rxOut();
    run = [[o.x, o.y + 18], [o.x, LANE_Y]];
    flag = [(FRONT_AT.x + FRONT_W + RX_AT.x) / 2, LANE_Y];
  } else {
    const pe = plugEnd(device);
    run = [[pe.x, pe.y], [pe.x + 20, pe.y + 2], [LOOP_X, pe.y - 10], [LOOP_X, LANE_Y + 12], [LOOP_X - 12, LANE_Y]];
    flag = [LOOP_X, (pe.y + LANE_Y) / 2 + 4];
  }
  // the free end lies on the table in front of the panel's foot, clear of it
  const free: P = [wireless ? rxOut().x - 84 : 300, LANE_Y + 7];
  const pts: P[] = j ? [...run, [j.x, LANE_Y], [j.x, j.y + 18]] : [...run, free];
  return (
    <Group>
      <Cable pts={pts} style={XLR_STYLE} glow={live && !!j ? INK.blue : null} flow={live && !!j} />
      {wireless ? <XlrPlugged cx={rxOut().x} cy={rxOut().y} /> : null}
      {j ? <XlrPlugged cx={j.x} cy={j.y} /> : <LoosePlug x={free[0]} y={free[1]} ang={Math.PI} kind="xlr" colour="#3d4046" />}
      <CableFlag x={flag[0]} y={flag[1]} text="MIC" live={live && !!j} edge="#5c626b" />
    </Group>
  );
}

/** The receiver's power: its supply's DC plug, the lead down to the table
 *  and away to the supply (off the picture, on the far side from the mic
 *  lead — the two never cross). */
function DcLead() {
  const d = rxDc();
  return (
    <Group>
      <Cable pts={[[d.x, d.y + 14], [d.x, LANE_Y + 6], [FRAME_WIRELESS.x + FRAME_WIRELESS.w + 20, LANE_Y + 6]]} style={{ colour: '#101113', width: 2.6, pattern: 'plain' }} />
      <DcPlugged cx={d.x} cy={d.y} />
    </Group>
  );
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
      <TargetBand />
      <LedColumn x={MET.xs[0]} y={MET.y} w={MET.w} h={MET.h} level={mic} hold={micH} />
      <LedColumn x={MET.xs[1]} y={MET.y} w={MET.w} h={MET.h} level={crowd} hold={crowdH} />
      <LedColumn x={MET.xs[2]} y={MET.y} w={MET.w} h={MET.h} level={booth} hold={boothH} />
      <LedColumn x={MET.xs[3]} y={MET.y} w={MET.w} h={MET.h} level={recL} hold={recH} />
      <MeterScale />
      <MeterNames voice={voice} />
    </Group>
  );
}

/** The centre (mm) of the LED segment that lights at `db`, on these ladders. */
function segY(db: number): number {
  const i = (LED_DB as readonly number[]).indexOf(db);
  const pitch = MET.h / LED_DB.length;
  return MET.y + MET.h - (i + 0.5) * pitch;
}
const pitchMm = MET.h / LED_DB.length;

/** The scale strip left of the MIC ladder (Stage 1's −24 · −12 · −6 · −2 · CLIP). */
function MeterScale() {
  const lm = useLabelMm(9);
  const x = MET.xs[0] - 3;
  return (
    <Group>
      {[
        { db: -24, t: '−24' },
        { db: -12, t: '−12' },
        { db: -6, t: '−6' },
        { db: 0, t: 'CLIP' },
      ].map((m) => (
        <Group key={m.t}>
          <Line p1={vec(x, segY(m.db))} p2={vec(x + 2, segY(m.db))} color={INK.printDim} strokeWidth={0.5} />
          <SceneText x={x - 1} y={segY(m.db) + lm * 0.34} size={lm} text={m.t} color={m.db === 0 ? INK.peak : INK.print} face="label" align="right" />
        </Group>
      ))}
    </Group>
  );
}

/** The speech target on the MIC ladder: a green band behind the −18 … −9
 *  segments and a bracket beside them. */
function TargetBand() {
  const top = segY(-9) - pitchMm / 2;
  const bot = segY(TARGET.lo) + pitchMm / 2;
  const x = MET.xs[0];
  return (
    <Group>
      <Rect x={x - 3} y={top} width={MET.w + 6} height={bot - top} color="rgba(91,255,133,0.16)" />
      <Line p1={vec(x + MET.w + 4, top)} p2={vec(x + MET.w + 4, bot)} color={INK.green} strokeWidth={1.2} />
      <Line p1={vec(x + MET.w + 2, top)} p2={vec(x + MET.w + 4, top)} color={INK.green} strokeWidth={1.2} />
      <Line p1={vec(x + MET.w + 2, bot)} p2={vec(x + MET.w + 4, bot)} color={INK.green} strokeWidth={1.2} />
    </Group>
  );
}

/** The ladders' names, horizontal at 9 pt, all ABOVE the ladders in two
 *  staggered rows (MIC and BOOTH on the upper row, CROWD and REC on the
 *  lower), so no two names touch and none meets the panel's labels below. */
function MeterNames({ voice }: { voice: readonly boolean[] }) {
  const lm = useLabelMm(9);
  return (
    <Group>
      {MET.xs.map((x, i) => (
        <SceneText key={x} x={x + MET.w / 2} y={i % 2 === 0 ? MET.y - 3 - lm * 1.15 : MET.y - 3} size={lm} text={MET_NAMES[i]} color={voice[i] ? INK.green : INK.print} face="label" align="center" />
      ))}
    </Group>
  );
}

/** The music's dip while you talk — a strip pinned at the top of the glass
 *  (screen points), out of the gear: a bar growing leftward from 0 dB, with
 *  its scale (the talkover's real gain, block by block). */
export const DIP_H = 30;
function DipStrip({ w, k, idle }: { w: number; k: number; idle: string }) {
  const duck = useDuckDb();
  const fs = 9 * k;
  const x0 = 76 * k;
  const x1 = w - 30 * k;
  const bw = x1 - x0;
  const y = 4 * k;
  const bh = 10 * k;
  const len = useDerivedValue(() => Math.min(1, -duck.value / 24) * bw);
  const bx = useDerivedValue(() => x1 - len.value);
  // with no dip, the bar says so (and why) instead of sitting empty
  const idleOn = useDerivedValue(() => (duck.value > -0.5 ? 1 : 0));
  return (
    <Group>
      <RoundedRect x={4} y={2} width={w - 8} height={DIP_H * k - 4} r={6} color="rgba(8,8,10,0.85)" />
      <SceneText x={10 * k} y={y + bh * 0.82} size={fs} text="MUSIC DIP" color={INK.amber} face="label" />
      <RoundedRect x={x0 - 1} y={y - 1} width={bw + 2} height={bh + 2} r={2} color="#050506" />
      <Rect x={bx} y={y} width={len} height={bh}>
        <LinearGradient start={vec(x0, 0)} end={vec(x1, 0)} colors={['#ff8a3d', INK.amber]} />
      </Rect>
      <Group opacity={idleOn}>
        <SceneText x={x0 + 5 * k} y={y + bh * 0.82} size={fs} text={idle} color={INK.printDim} face="label" />
      </Group>
      {[0, 6, 12, 18, 24].map((d) => (
        <Group key={d}>
          <Line p1={vec(x1 - (d / 24) * bw, y + bh + 1)} p2={vec(x1 - (d / 24) * bw, y + bh + 4 * k)} color={INK.printDim} strokeWidth={1} />
          {d % 12 === 0 ? <SceneText x={x1 - (d / 24) * bw} y={y + bh + 4 * k + fs} size={fs} text={d === 0 ? '0 dB' : `−${d}`} color={INK.printDim} face="label" align="center" /> : null}
        </Group>
      ))}
    </Group>
  );
}

function MixerView({ booth, live, voiceLive, voice }: { booth: Booth; live: boolean; voiceLive: boolean; voice: readonly boolean[] }) {
  const m = evOf(booth).mic;
  const wireless = m.device === 'WIRELESS';
  const frame = wireless ? FRAME_WIRELESS : FRAME_WIRED;
  const at = micAt(m.device);
  const t = tailAt(m.device);
  const pe = plugEnd(m.device);
  const len = wireless ? 250 : pe.x - at.x + 25;
  return (
    <Group>
      <TableTop x0={frame.x - 40} x1={frame.x + frame.w + 40} y={TABLE.y} depth={TABLE.depth} />
      <Group transform={[{ translateX: wireless ? MET_SHIFT_WIRELESS : 0 }]}>
        <Meters voice={voice} />
      </Group>
      <MixerFront x={FRONT_AT.x} y={FRONT_AT.y} mic={m} highlight={hiFront(booth)} />
      {wireless ? (
        <Group>
          <DcLead />
          <ReceiverRear x={RX_AT.x} y={RX_AT.y} rxOut={m.rxOut} on={live} />
        </Group>
      ) : null}
      <MicCable inp={m.input} device={m.device} live={voiceLive} />
      {/* the mic lying on the table: its soft contact shadow, the mic, the plug */}
      <Oval x={at.x - 24} y={CONTACT_Y - 4} width={len} height={8} color="rgba(0,0,0,0.6)">
        <BlurMask blur={3} style="normal" />
      </Oval>
      <HandheldMic x={at.x} y={at.y} ang={at.ang} device={m.device} live={live} />
      {wireless ? null : <MicXlrPlug x={t.x} y={t.y} ang={at.ang} />}
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

function MicTray({ onPop, setView }: { onPop: (pop: boolean) => void; setView: (v: 'MIXER' | 'ROOM') => void }) {
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
      <TrayNote tone="fine">ROOM</TrayNote>
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
      <Row head="SEE">
        <LabChip label="THE MIXER" selected={false} onPress={() => setView('MIXER')} compact />
        <LabChip label="THE ROOM" selected={false} onPress={() => setView('ROOM')} compact />
      </Row>
    </View>
  );
}

function RouteTray() {
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
      <Row head={`BOOTH MONITORS · LEVEL ${Math.round(b.mixer.booth * 100)}%`}>
        <LabChip label="BOOTH −" selected={false} onPress={() => updateBooth((x) => ({ ...x, mixer: { ...x.mixer, booth: Math.max(0, Math.round((x.mixer.booth - 0.05) * 20) / 20) } }))} compact />
        <LabChip label="BOOTH +" selected={false} onPress={() => updateBooth((x) => ({ ...x, mixer: { ...x.mixer, booth: Math.min(1, Math.round((x.mixer.booth + 0.05) * 20) / 20) } }))} compact />
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
        {music ? <LabChip label="● SHOUT (+10 dB)" selected={false} onPress={() => announce(lead(), SHOUT_DB)} /> : null}
      </Row>
      <TrayNote tone="fine">The lab’s voice is a synthesised speech-like sound — rhythm, pitch and syllables, no words. A shout is about 10 dB louder than speech.</TrayNote>
      <EventListen />
    </View>
  );
}

/* ── the page ────────────────────────────────────────────────────────── */

function PageMic({ ctx }: { ctx: PageCtx }) {
  const { booth, audio, tr, motion, last } = useEventKit();
  const { ready } = useScreenSetup((b) => {
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
  const overloadSince = useRef<number | null>(null);
  const m = ev.mic;
  const fb = feedbackOf(booth);
  if (fb.state === 'RINGING' && m.on) ringSeen.current = true;
  const micPk = extPeak(last, 'mic', true);
  const speaking = hadSpeech(last);
  const clean = !!last && last.ext.clipped.micPre === 0 && last.ext.clipped.micInput === 0;
  const lastSay = m.says[m.says.length - 1];
  const shout = !!last && speaking && !!lastSay && (lastSay.db ?? 0) > 0;
  const dip = last ? last.ext.duckMinDb : 0;
  const recovered = !!last && last.ext.duckDb.length > 0 && last.ext.duckDb[last.ext.duckDb.length - 1] > -1;
  if (m.talkover && speaking && dip <= -6 && booth.decks.A.playing) dipped.current = true;
  const inTarget = micPk != null && micPk >= TARGET.lo && micPk <= TARGET.hi;
  const overload = micInputOverload(m);
  if (overload && speaking) overloadSince.current ??= Date.now();
  if (!overload) overloadSince.current = null;
  const showOverload = overloadSince.current != null && Date.now() - overloadSince.current > 10000;
  const hits = [
    speaking && !shout && inTarget && clean,
    dipped.current && recovered,
    m.device === 'CONDENSER' && micAlive(m) && speaking && micPk != null && micPk > -40,
    ringSeen.current && m.on && fb.marginDb >= 6,
    faultFixed,
    check,
  ];
  const goals = GOALS_MIC.map((label, i) => ({ label, hit: hits[i] }));
  const latched = useVisitGoals(ctx, goals, 'MIC', ready);
  const live = micAlive(m) && m.on;
  const voiceLive = live && speaking;
  const gainDb = micGainDb(micGainKnob(m));
  const wireless = m.device === 'WIRELESS';
  const frame = wireless ? FRAME_WIRELESS : FRAME_WIRED;

  const fp = (p: FrontPart) => {
    const bx = frontPartBox(p);
    // the control and its printed legend above it (legends show when zoomed)
    return { x: bx.x + FRONT_AT.x, y: bx.y + FRONT_AT.y - 12, w: bx.w, h: bx.h + 12 };
  };
  const mAt = micAt(m.device);
  const pe = plugEnd(m.device);
  const metShift = wireless ? MET_SHIFT_WIRELESS : 0;
  const mixerObstacles: Box[] = [
    // the whole front panel: a label never sits on it (zoomed in, every
    // label is pushed off it, above or beside)
    { x: FRONT_AT.x, y: FRONT_AT.y, w: FRONT_W, h: FRONT_H },
    ...(['mic1', 'mic2', 'gain1', 'gain2', 'level', 'on', 'talk', 'depth', 'sendBooth', 'sendRec', 'phantom'] as FrontPart[]).map(fp),
    ...MET.xs.map((x) => ({ x: x - 4 + metShift, y: MET.y - 2, w: MET.w + 10, h: MET.h + 4 })),
    { x: MET.xs[0] - 26 + metShift, y: MET.y - 12, w: MET.xs[3] - MET.xs[0] + 40, h: 12 },
    { x: MET.xs[0] - 26 + metShift, y: MET.y - 2, w: 24, h: MET.h + 4 },
    // the mic lying on the table, its lead's lane and turn (no label sits on them)
    { x: mAt.x - 27, y: CONTACT_Y - 54, w: (wireless ? 252 : pe.x - mAt.x) + 30, h: 58 },
    { x: FRONT_AT.x, y: LANE_Y - 6, w: (wireless ? RX_AT.x + RX_JACKS.out.x : LOOP_X) - FRONT_AT.x + 6, h: 12 },
    ...(wireless ? [{ x: RX_AT.x, y: RX_AT.y - 150, w: RX_W, h: RX_H + 150 }] : [{ x: LOOP_X - 8, y: LANE_Y, w: 16, h: pe.y - LANE_Y + 8 }]),
  ];
  const mixerSoft: Box[] = [{ x: FRONT_AT.x, y: FRONT_AT.y, w: FRONT_W, h: FRONT_H }];
  // every panel label ABOVE the panel with a short upright leader, the sends
  // to its right (the table below carries the mic and its lead)
  // every panel label ABOVE its control with a short upright leader (the
  // meters sit at the right, out of their way; MIC ON and TALK OVER in two
  // rows so neither leader crosses the other's words); the sends to the
  // panel's right; the table below carries the mic and its lead. Each
  // mic input's label carries its GAIN while the mic is in it.
  const gainLine = `GAIN +${gainDb.toFixed(0)} dB`;
  const m1Lines = ['MIC 1', m.phantom ? '+48 V ON' : '+48 V OFF', ...(m.input === 'MIC1' ? [gainLine] : [])];
  const m2Lines = ['MIC 2', 'NO +48 V', ...(m.input === 'MIC2' ? [gainLine] : [])];
  const S = wireless ? 0.56 : 0.9; // the stage's pt per mm at 390 wide: asks in points
  const above = (n: number, py: number) => -(py - (156 - (n * 12.5 + 4) / S / 2)) * S;
  const m1At = { x: FRONT_AT.x + FRONT.mic1.x, y: FRONT_AT.y + FRONT.mic1.y - 11 };
  const m2At = { x: FRONT_AT.x + FRONT.mic2.x, y: FRONT_AT.y + FRONT.mic2.y - 10 };
  const onAt = { x: FRONT_AT.x + FRONT.on.x + FRONT.on.w / 2, y: FRONT_AT.y + FRONT.on.y };
  const toAt = { x: FRONT_AT.x + FRONT.talk.x + FRONT.talk.w - 6, y: FRONT_AT.y + FRONT.talk.y };
  const sndAt = { x: FRONT_AT.x + FRONT.sendRec.x + FRONT.sendRec.w, y: FRONT_AT.y + FRONT.sendRec.y + 3 };
  const mixerCallouts: Callout[] = ([
    { id: 'snd', text: `SEND BOOTH ${m.toBooth ? 'ON' : 'OFF'} SEND REC ${m.toRec ? 'ON' : 'OFF'}`, lines: [`SEND BOOTH ${m.toBooth ? 'ON' : 'OFF'}`, `SEND REC ${m.toRec ? 'ON' : 'OFF'}`], at: sndAt, dx: (282 - sndAt.x) * S, dy: (199 - sndAt.y) * S, tone: m.toRec ? 'amber' : 'plain' },
    { id: 'to', text: m.talkover ? 'TALK OVER ON' : 'TALK OVER', at: toAt, dx: 0, dy: (125 - toAt.y) * S, tone: m.talkover ? 'amber' : 'plain' },
    { id: 'm1', text: m1Lines.join(' '), lines: m1Lines, at: m1At, dx: 0, dy: above(m1Lines.length, m1At.y), tone: m.input === 'MIC1' ? 'amber' : 'plain' },
    { id: 'm2', text: m2Lines.join(' '), lines: m2Lines, at: m2At, dx: 0, dy: above(m2Lines.length, m2At.y), tone: m.input === 'MIC2' ? 'amber' : 'plain' },
    { id: 'on', text: m.on ? 'MIC ON' : 'MIC OFF', at: onAt, dx: 0, dy: above(1, onAt.y), tone: m.on ? 'red' : 'plain' },
    ...(wireless ? [{ id: 'rx', text: `RECEIVER OUT: ${m.rxOut}`, at: { x: RX_AT.x + RX_JACKS.sw.x, y: RX_AT.y + 4 }, dx: 0, dy: -30, tone: m.rxOut === 'LINE' && m.input !== 'NONE' ? ('red' as const) : ('plain' as const) }] : []),
    { id: 'mk', text: m.device === 'CONDENSER' ? 'CONDENSER MIC' : m.device === 'WIRELESS' ? 'WIRELESS MIC' : 'DYNAMIC MIC', at: { x: mAt.x + 60, y: CONTACT_Y - 4 }, dx: 0, dy: 16, tone: 'plain' },
  ] as Callout[]).filter((c) => !wireless || !['snd', 'to', 'on'].includes(c.id)); // the wireless view: the receiver's lesson, the panel's lit keys and the dock carry the rest
  const roomCallouts: Callout[] = [
    { id: 'mic', text: `MIC · ${fb.state === 'RINGING' ? 'RINGING' : fb.state === 'EDGE' ? 'ON THE EDGE' : Number.isFinite(fb.marginDb) ? `${fb.marginDb.toFixed(0)} dB SPARE` : 'OFF'}`, at: planAt.mic(m.pos), dx: 0, dy: 34, tone: fb.state === 'RINGING' ? 'red' : fb.state === 'EDGE' ? 'amber' : 'green' },
    { id: 'pl', text: 'PA L', at: planAt.top(ev.venue.place, 'L'), dx: -10, dy: -20, tone: fb.worst?.id === 'topL' && fb.state !== 'SAFE' ? 'red' : 'plain' },
    { id: 'pr', text: 'PA R', at: planAt.top(ev.venue.place, 'R'), dx: 10, dy: -20, tone: fb.worst?.id === 'topR' && fb.state !== 'SAFE' ? 'red' : 'plain' },
    { id: 'ml', text: 'MONITOR L', at: planAt.monitor('L'), dx: 30, dy: 10, tone: m.toBooth ? 'amber' : 'plain' },
    { id: 'mr', text: 'MONITOR R', at: planAt.monitor('R'), dx: -30, dy: 10, tone: m.toBooth ? 'amber' : 'plain' },
    { id: 'tb', text: 'BOOTH TABLE', at: planAt.table(), dx: 0, dy: -46, tone: 'plain' },
  ];

  const marginCell = !live
    ? { k: 'FEEDBACK', v: 'MIC OFF', tint: colors.textSub }
    : { k: 'FEEDBACK', v: fb.state === 'RINGING' ? 'RINGING' : `${fb.marginDb.toFixed(1)} dB`, sub: fb.state === 'RINGING' ? `${Math.round(fb.ringHz)} Hz` : 'SPARE', vA11y: fb.state === 'RINGING' ? `ringing at ${Math.round(fb.ringHz)} hertz` : `${fb.marginDb.toFixed(1)} dB of gain to spare before feedback`, tint: fb.state === 'RINGING' ? PEAK_RED : fb.state === 'EDGE' ? colors.amber : colors.green };
  const shoutClipped = shout && !clean;

  return (
    <DjRack
      spec={{
        render: (w, h) => {
          const k = Math.sqrt(Math.max(1, w / 360));
          return view === 'MIXER' ? (
            <Scene
              w={w}
              h={h}
              frame={frame}
              motion={motion}
              fit={{ x: 0, y: DIP_H * k, w, h: h - DIP_H * k }}
              aspect={false}
              focus={{ x: FRONT_AT.x + 90, y: FRONT_AT.y, w: 120, h: FRONT_H }}
              screenOverlay={(sw, _sh, _xf, kz) => <DipStrip w={sw} k={Math.sqrt(Math.max(1, kz))} idle={m.talkover ? 'NO DIP · TALK TO DIP THE MUSIC' : 'NO DIP · TALK OVER IS OFF'} />}
              a11y={`${LOOK_MIXER} The mic is ${m.input === 'NONE' ? 'not plugged in' : `in ${MIC_INPUTS[m.input].label}`}, ${m.on ? 'on' : 'off'}. The green bracket on the MIC meter is the speech target, ${TARGET.lo} to ${TARGET.hi} dBFS.`}
              obstacles={mixerObstacles}
              soft={mixerSoft}
              callouts={mixerCallouts}
            >
              <MixerView booth={booth} live={live} voiceLive={voiceLive} voice={[voiceLive, voiceIn(last, 'crowd'), voiceIn(last, 'booth'), voiceIn(last, 'rec')]} />
            </Scene>
          ) : (
            <Scene w={w} h={h} frame={PLAN_STAGE} motion={motion} fit={{ x: 0, y: 0, w, h: h - LEGEND_H * k }} aspect={false} focus={{ x: -150, y: 40, w: 300, h: 160 }} screenOverlay={(sw, sh, _xf, kz) => <HeatLegend w={sw} h={sh} k={Math.sqrt(Math.max(1, kz))} mode="TOPS" place={ev.venue.place} feedDbfs={last?.ext.feedRms.master ?? -24} strip />} a11y={`${LOOK_ROOM} The mic is ${MIC_POS[m.pos].label.toLowerCase()}; ${fb.state === 'RINGING' ? 'it is ringing' : fb.state === 'EDGE' ? 'it is on the edge of feedback' : 'it is safe from feedback'}.`} obstacles={[...planObstacles(ev.venue.place, ev.venue.subPos, false, true), { x: -170, y: 300, w: 340, h: 46 }]} callouts={roomCallouts}>
              <PlanView spec={{ map: 'TOPS', place: ev.venue.place, subPos: ev.venue.subPos, subs: false, feedDbfs: last?.ext.feedRms.master ?? -24, monitors: true, mic: live ? { pos: m.pos, fb } : { pos: m.pos, fb: { ...fb, state: 'SAFE' } }, edges: true, hotTop: fb.state !== 'SAFE' && fb.worst?.id.startsWith('top') ? (fb.worst.id as 'topL' | 'topR') : null }} />
            </Scene>
          );
        },
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
          { kind: 'group', id: 'mic', label: 'MIC', valueLabel: m.input === 'NONE' ? 'OUT' : `${m.input === 'MIC2' ? '2' : '1'} · ${m.on ? 'ON' : 'OFF'}`, valueA11y: `${m.device.toLowerCase()} mic ${m.input === 'NONE' ? 'unplugged' : `in ${MIC_INPUTS[m.input].label}, ${m.on ? 'on' : 'off'}`}; ${MIC_POS[m.pos].label.toLowerCase()}`, render: () => <MicTray onPop={setPop} setView={setView} /> },
          { kind: 'group', id: 'route', label: 'ROUTE', valueLabel: `REC ${m.toRec ? 'ON' : 'OFF'}`, valueA11y: `talk over ${m.talkover ? 'on' : 'off'}; mic to booth ${m.toBooth ? 'on' : 'off'}; mic to rec ${m.toRec ? 'on' : 'off'}`, render: () => <RouteTray /> },
          { kind: 'group', id: 'talk', label: 'TALK', valueLabel: announcing(booth) ? 'ON AIR' : musicOn(booth) ? 'READY' : 'PLAY A', render: () => <TalkTray tr={tr} lead={audio.leadSec} /> },
          stopKey(tr),
        ],
        initialParam: 'mic',
      }}
    >
      <Step n={1}>
        <Look>{view === 'MIXER' ? LOOK_MIXER : LOOK_ROOM}</Look>
        <P>A mic makes a tiny signal, so its input adds a lot of gain; the MIC meter is where you set it. Phantom power, talkover and where the mic is sent all belong to this mixer’s design — check the manual of the one you are on.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Open MIC: plug the DYNAMIC mic into MIC 1 and switch it ON. Open TALK, play deck A and press TALK NOW.</Do>
        <P>Set GAIN on your normal speaking voice until its peaks sit around −18 to −8 dBFS — the green bracket on the MIC meter, and MIC PEAK on the strip (a suggested starting point). Then press SHOUT: it should stay out of the red. Announcements get louder than you think. Then turn TALK OVER on (ROUTE) and talk again: watch MUSIC DIP drop while you speak and come back after.</P>
        {shoutClipped ? <Note tone="try">The shout clipped: bring GAIN down a few dB and try again — set for the shout, not just the speech.</Note> : null}
        {pop ? <Note tone="safety">POP — +48 V was switched with the mic channel ON and up. On a real system that crack goes through every speaker carrying the mic. Switch phantom with the mic OFF (or its level down).</Note> : null}
        {showOverload ? <Note tone="safety">The receiver’s LINE output is overloading the mic input before the GAIN knob — turning GAIN down cannot clean it. Set the receiver to MIC.</Note> : null}
      </Step>
      <Step n={3}>
        <P>Swap to the CONDENSER: in MIC 2 it is silent (no phantom there). Move it to MIC 1 and switch +48 V on — with the mic OFF first. It is hotter than the dynamic: GAIN comes down.</P>
        <P>Now make it ring, safely: in MIC → ROOM, point the mic AT A MONITOR, or walk it ON THE FLOOR, and watch FEEDBACK. Win back at least 6 dB: the mic back at the decks with its rear to the speakers, out of the booth send (ROUTE), or the booth lower.</P>
        <Note tone="safety">The lab plays only a quiet stand-in of a ring. Real feedback grows until it hurts ears and speakers: the first move is always the mic level DOWN, then find the loop.</Note>
      </Step>
      <Step n={4}>
        <Do>Set a clean mic level, talk over the music, power the condenser from the right input, and make it ring — then win back 6 dB of margin.</Do>
        <GoalChips goals={goals.slice(0, 4)} latched={latched.slice(0, 4)} />
      </Step>
      <Step n={5}>
        <EvidenceCheck
          task="a wireless receiver is in MIC 2 and the voice crunches, even with GAIN at the bottom. Make it clean: speech peaks −18 … −8 dBFS on the MIC meter, no clip."
          start={() => {
            void audio.requestSound();
            overloadSince.current = null;
            updateBooth((b, tt) => {
              const x = withMic(b, { device: 'WIRELESS', rxOut: 'LINE', input: 'MIC2', gain2: 0, on: true, level: 0.75 });
              return { ...x, decks: { ...x.decks, A: { ...x.decks.A, playing: true, at: tt } } };
            });
            announce(audio.leadSec() + 0.6);
          }}
          met={m.device === 'WIRELESS' && m.rxOut === 'MIC' && speaking && !shout && inTarget && clean}
          progress={m.device === 'WIRELESS' && speaking && !clean ? 'Still clipping — and not at the GAIN knob. What sits before it?' : null}
          explain="A line-level signal is some 40–55 dB hotter than a mic. It overloads the mic input’s first stage, before the GAIN knob can do anything — so the cure is the receiver’s output switch on MIC (or a line input), then GAIN set by the meter."
          onMet={() => setCheck(true)}
        />
        <FaultCard
          title="THE RECORDING HAS NO VOICE"
          symptom="The room heard your announcement clearly, but the recording has the music only."
          start={() => {
            void audio.requestSound();
            updateBooth((b, tt) => {
              const x = withMic(b, { device: 'DYNAMIC', input: 'MIC1', on: true, gain1: micGainPos(44), level: 0.75, toRec: false, pos: 'DECKS' });
              return { ...x, decks: { ...x.decks, A: { ...x.decks.A, playing: true, at: tt } }, ev: { ...x.ev!, rec: { ...x.ev!.rec, tap: 'REC_OUT' } }, perspective: 'CROWD' };
            });
            announce(audio.leadSec() + 0.6);
          }}
          fixed={voiceIn(last, 'rec')}
          hints={['Read VOICE IN on the strip: which feeds carry the mic?', 'The CROWD has it; the recording does not. What decides which outputs carry the mic?', 'Open ROUTE: the mic’s sends. Then TALK again and watch the REC meter.']}
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
