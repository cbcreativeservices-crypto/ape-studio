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
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { colors } from '../../../../theme/tokens';
import { LabChip } from '../../LabShell';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import { Scene, type Callout } from '../art/Scene';
import { DcPlugged, HandheldMic, MicXlrPlug, MixerFront, ReceiverRear, TableTop, XlrPlugged, FRONT, FRONT_W, FRONT_H, MIC_PLUG_LEN, MIC_TRUE, frontPartBox, RX_JACKS, RX_W, RX_H, type FrontPart } from '../art/MicGear';
import { HeatLegend, LEGEND_H, PlanView, planAt, planObstacles } from '../art/PlanView';
import { CableFlag } from '../art/cables';
import { Cable, LED_DB, LedColumn, LoosePlug } from '../art/parts';
import { useTapDb } from '../art/motion';
import { useDuckDb, useExtTapDb } from '../art/eventMotion';
import { INK } from '../art/ink';
import { SceneText, useLabelMm } from '../art/sceneText';
import { fitView, type Box } from '../geometry/boothGeometry';
import { DjRack } from '../DjRack';
import { Do, EvidenceCheck, FaultCard, GoalChips, Look, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { stopKey, type Transport } from '../dock';
import { boothNow, getBooth, updateBooth } from '../booth/boothStore';
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
import { announce, announcing, dbCell, EventListen, extPeak, hadSpeech, musicOn, Row, TrayNote, useEventKit, useFreshReading, voiceCell, voiceIn, withFreshEvent } from './eventShared';
import { PEAK_RED } from './shared';
import { renderedSince } from './s1Guards';

const TERMS = [
  { term: 'Phantom power (+48 V)', def: 'A small DC voltage some inputs send up the mic cable to power a condenser mic. It belongs to the INPUT: on this mixer only MIC 1 has it. A balanced dynamic mic needs none and ignores it; keep +48 V off for anything not made for it (some ribbon mics, unbalanced XLR adapters, line gear on an XLR lead), and off while you patch. On most combo jacks it is on the XLR pins only: a jack plug in the centre gets none.' },
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

/*
 * Lab-art grade 2026-10-19 (round 2): the mic at TRUE size from the combo
 * jack (MicGear.MIC_TRUE: 170 mm overall, a Ø 50 mm grille, against the
 * 24 mm jack), one mm-per-mm scale for the mic and the panel in both views;
 * the meters a horizontal block in the empty top-left, so the panel takes
 * the width and is drawn about 18 % larger than before; every label in clear
 * air on a short upright (or level) leader.
 */

/** The display's shape at a 390-wide phone (the fit area under the dip
 *  strip, points): each view's frame is cut to it, so no empty band. */
const GLASS_390 = { w: 356, h: 277 } as const;
const ASPECT = GLASS_390.w / GLASS_390.h;

/** The meter block, authored in POINTS at 390 (converted per view), so it
 *  reads the same in both views: the names at the left, four horizontal LED
 *  bars (MIC, CROWD, BOOTH, REC; quiet at the left), the dB scale above
 *  them at 10 pt with at least 25 pt between marks. */
const MET_PT = { nameRight: 36, x: 40, scaleBase: 12, bracket: 16, y: 20, thick: 10, pitch: 15 } as const;
const MET_NAMES = ['MIC', 'CROWD', 'BOOTH', 'REC'] as const;

type Stage = {
  wireless: boolean;
  /** pt per mm at 390. */
  S: number;
  frame: Box;
  met: { nameRight: number; x: number; len: number; y: number; thick: number; pitch: number; scaleBase: number; bracket: number; bottom: number };
  front: { x: number; y: number };
  tableY: number;
  rx: { x: number; y: number };
  laneY: number;
  /** The mic lying on the table: its ball's centre x and the contact line. */
  ballX: number;
  contactY: number;
  /** Where the wired lead turns up from the table to the lane (x). */
  loopX: number;
};

function stageOf(wireless: boolean): Stage {
  // the width the gear needs: the panel and the sends' label (wired), or
  // the panel and the receiver beside it (wireless)
  const x0 = wireless ? -4 : -4;
  const w = wireless ? 512 : 336;
  const S = GLASS_390.w / w;
  const mm = (pt: number) => pt / S;
  const f = wireless ? 1.3 : 1;
  const met = {
    nameRight: x0 + mm(MET_PT.nameRight),
    x: x0 + mm(MET_PT.x),
    len: mm(wireless ? 152 : 250),
    y: mm(MET_PT.y * f),
    thick: mm(MET_PT.thick * f),
    pitch: mm(MET_PT.pitch * f),
    scaleBase: mm(MET_PT.scaleBase * f),
    bracket: mm(MET_PT.bracket * f),
    bottom: 0,
  };
  met.bottom = met.y + 3 * met.pitch + met.thick;
  // the panel under the block, with room for a three-line label over it
  const frontY = met.bottom + mm(4 + 3 * 12.5 + 4 + 9);
  const tableY = frontY + FRONT_H;
  const contactY = tableY + 62;
  const contentH = contactY + 12;
  const h = Math.max(contentH, w / ASPECT);
  // seat the drawing in the glass's shape, most of the spare height
  // under it, where the table runs on (never an empty band)
  const y0 = -(h - contentH) * 0.3;
  return {
    wireless,
    S,
    frame: { x: x0, y: y0, w, h },
    met,
    front: { x: 4, y: frontY },
    tableY,
    rx: { x: 4 + FRONT_W + 18, y: tableY - RX_H },
    laneY: tableY + 4,
    ballX: wireless ? 252 : 215,
    contactY,
    loopX: 14,
  };
}
const STAGE_WIRED = stageOf(false);
const STAGE_WIRELESS = stageOf(true);
const stageFor = (d: MicDevice): Stage => (d === 'WIRELESS' ? STAGE_WIRELESS : STAGE_WIRED);

/** The mic lying on the table, its grille ball to the RIGHT and its tail
 *  (and the lead) to the left: a rigid body rests on its two lowest points
 *  — the ball and the plug's barrel at the tail (the wireless: its antenna
 *  cap) — so it lies tilted a few degrees. Drawn mirrored (scaleX −1), so
 *  its light still comes from above. */
const TAIL_R: Record<MicDevice, number> = { DYNAMIC: 11, CONDENSER: 11, WIRELESS: 14.5 };
const REST: Record<MicDevice, number> = { DYNAMIC: MIC_TRUE.tail.DYNAMIC + 23, CONDENSER: MIC_TRUE.tail.CONDENSER + 23, WIRELESS: MIC_TRUE.tail.WIRELESS };
const micAt = (d: MicDevice) => {
  const st = stageFor(d);
  const R = MIC_TRUE.grilleR[d];
  return { x: st.ballX, y: st.contactY - R, ang: Math.asin((R - TAIL_R[d]) / REST[d]) };
};
/** A point on the mic's own axis (mic mm from the ball's centre) in the
 *  scene: the mic is mirrored, so its +x runs to the scene's left. */
const onMic = (d: MicDevice, lx: number) => {
  const m = micAt(d);
  return { x: m.x - Math.cos(m.ang) * lx, y: m.y + Math.sin(m.ang) * lx };
};
const tailAt = (d: MicDevice) => onMic(d, MIC_TRUE.tail[d]);
const plugEnd = (d: MicDevice) => onMic(d, MIC_TRUE.tail[d] + MIC_PLUG_LEN);

const jackAt = (st: Stage, inp: MicInput): { x: number; y: number } | null =>
  inp === 'MIC1' ? { x: st.front.x + FRONT.mic1.x, y: st.front.y + FRONT.mic1.y } : inp === 'MIC2' ? { x: st.front.x + FRONT.mic2.x, y: st.front.y + FRONT.mic2.y } : null;

const rxOut = (st: Stage) => ({ x: st.rx.x + RX_JACKS.out.x, y: st.rx.y + RX_JACKS.out.y });
const rxDc = (st: Stage) => ({ x: st.rx.x + RX_JACKS.dc.x, y: st.rx.y + RX_JACKS.dc.y });

type P = [number, number];
const XLR_STYLE = { colour: '#3d4046', width: 4.6, pattern: 'stripe' as const };

/** The mic lead, LYING on the table: from the mic's plug at the left it
 *  curls up to the lane at the mixer's foot, runs along it, and rises into
 *  the front-panel jack (the plug's boot pointing down, the way a lead
 *  hangs from a front jack). The wireless receiver's lead drops from its
 *  BAL OUT to the table and runs the same lane. Unplugged, the free end
 *  lies on the lane, its plug pointing at the jacks. */
function MicCable({ st, inp, device, live }: { st: Stage; inp: MicInput; device: MicDevice; live: boolean }) {
  const j = jackAt(st, inp);
  const wireless = device === 'WIRELESS';
  const lane = st.laneY;
  let run: P[];
  let flag: P;
  if (wireless) {
    const o = rxOut(st);
    run = [[o.x, o.y + 18], [o.x, lane]];
    flag = [(st.front.x + FRONT_W + st.rx.x) / 2, lane];
  } else {
    const pe = plugEnd(device);
    const lx = st.loopX;
    run = [[pe.x, pe.y], [pe.x - 6, pe.y + 1], [lx, pe.y - 8], [lx, lane + 12], [lx + 10, lane]];
    flag = [lx, (pe.y + lane) / 2 + 2];
  }
  const free: P = wireless ? [rxOut(st).x - 84, lane + 7] : [st.loopX + 58, lane + 3];
  const pts: P[] = j ? [...run, [j.x, lane], [j.x, j.y + 18]] : [...run, free];
  return (
    <Group>
      <Cable pts={pts} style={XLR_STYLE} glow={live && !!j ? INK.blue : null} flow={live && !!j} />
      {wireless ? <XlrPlugged cx={rxOut(st).x} cy={rxOut(st).y} /> : null}
      {j ? <XlrPlugged cx={j.x} cy={j.y} /> : <LoosePlug x={free[0]} y={free[1]} ang={wireless ? Math.PI : 0} kind="xlr" colour="#3d4046" />}
      <CableFlag x={flag[0]} y={flag[1]} text="MIC" live={live && !!j} edge="#5c626b" />
    </Group>
  );
}

/** The receiver's power: its supply's DC plug, the lead down to the table
 *  and away to the supply (off the picture, on the far side from the mic
 *  lead — the two never cross). */
function DcLead({ st }: { st: Stage }) {
  const d = rxDc(st);
  return (
    <Group>
      <Cable pts={[[d.x, d.y + 14], [d.x, st.laneY + 6], [st.frame.x + st.frame.w + 20, st.laneY + 6]]} style={{ colour: '#101113', width: 2.6, pattern: 'plain' }} />
      <DcPlugged cx={d.x} cy={d.y} />
    </Group>
  );
}

/** The x (mm) of the centre of the LED segment that lights at `db`. */
const segX = (st: Stage, db: number): number => {
  const i = (LED_DB as readonly number[]).indexOf(db);
  return st.met.x + (i + 0.5) * (st.met.len / LED_DB.length);
};

/** One horizontal LED bar: the house LED column turned a quarter (quiet at
 *  the left, CLIP at the right). */
function LedBar({ st, row, level, hold }: { st: Stage; row: number; level: SharedValue<number>; hold: SharedValue<number> }) {
  const M = st.met;
  const y = M.y + row * M.pitch;
  return (
    <Group transform={[{ translateX: M.x + M.len }, { translateY: y }, { rotate: Math.PI / 2 }]}>
      <LedColumn x={0} y={0} w={M.thick} h={M.len} level={level} hold={hold} />
    </Group>
  );
}

function Meters({ st, voice }: { st: Stage; voice: readonly boolean[] }) {
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
      <TargetBand st={st} />
      <LedBar st={st} row={0} level={mic} hold={micH} />
      <LedBar st={st} row={1} level={crowd} hold={crowdH} />
      <LedBar st={st} row={2} level={booth} hold={boothH} />
      <LedBar st={st} row={3} level={recL} hold={recH} />
      <MeterScale st={st} />
      <MeterNames st={st} voice={voice} />
    </Group>
  );
}

/** The dB scale over the bars (Stage 1's −24 · −12 · −6 · CLIP), 10 pt,
 *  each mark over its segment, with "dBFS" where the names stand. */
function MeterScale({ st }: { st: Stage }) {
  const lm = useLabelMm(10);
  const M = st.met;
  return (
    <Group>
      <SceneText x={M.nameRight} y={M.scaleBase} size={lm} text="dBFS" color={INK.printDim} face="label" align="right" />
      {[
        { db: -24, t: '−24' },
        { db: -12, t: '−12' },
        { db: -6, t: '−6' },
        { db: 0, t: 'CLIP' },
      ].map((m) => (
        <Group key={m.t}>
          <SceneText x={segX(st, m.db)} y={M.scaleBase} size={lm} text={m.t} color={m.db === 0 ? INK.peak : INK.print} face="label" align="center" />
          <Line p1={vec(segX(st, m.db), M.y - M.pitch * 0.12)} p2={vec(segX(st, m.db), M.y + 3 * M.pitch + M.thick + M.pitch * 0.12)} color="rgba(255,255,255,0.10)" strokeWidth={0.5} />
        </Group>
      ))}
    </Group>
  );
}

/** The speech target on the MIC bar: a green band behind the −18 … −9
 *  segments and a bracket over them. */
function TargetBand({ st }: { st: Stage }) {
  const M = st.met;
  const seg = M.len / LED_DB.length;
  const x0 = segX(st, TARGET.lo) - seg / 2;
  const x1 = segX(st, -9) + seg / 2;
  const by = M.bracket;
  return (
    <Group>
      <Rect x={x0} y={M.y - 2} width={x1 - x0} height={M.thick + 4} color="rgba(91,255,133,0.16)" />
      <Line p1={vec(x0, by)} p2={vec(x1, by)} color={INK.green} strokeWidth={1.2} />
      <Line p1={vec(x0, by)} p2={vec(x0, by + 2)} color={INK.green} strokeWidth={1.2} />
      <Line p1={vec(x1, by)} p2={vec(x1, by + 2)} color={INK.green} strokeWidth={1.2} />
    </Group>
  );
}

/** The bars' names, horizontal at 10 pt, one per row at the bar's left —
 *  never staggered, never touching. */
function MeterNames({ st, voice }: { st: Stage; voice: readonly boolean[] }) {
  const lm = useLabelMm(10);
  const M = st.met;
  return (
    <Group>
      {MET_NAMES.map((n, i) => (
        <SceneText key={n} x={M.nameRight} y={M.y + i * M.pitch + M.thick / 2 + lm * 0.36} size={lm} text={n} color={voice[i] ? INK.green : INK.print} face="label" align="right" />
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
  const st = stageFor(m.device);
  const frame = st.frame;
  const at = micAt(m.device);
  const tail = MIC_TRUE.tail[m.device];
  const pe = wireless ? tailAt(m.device) : plugEnd(m.device);
  const R = MIC_TRUE.grilleR[m.device];
  return (
    <Group>
      {/* the table runs on below the picture: no empty band under it */}
      <TableTop x0={frame.x - 40} x1={frame.x + frame.w + 40} y={st.tableY} depth={frame.y + frame.h - st.tableY + 600} />
      <Meters st={st} voice={voice} />
      <MixerFront x={st.front.x} y={st.front.y} mic={m} highlight={hiFront(booth)} />
      {wireless ? (
        <Group>
          <DcLead st={st} />
          <ReceiverRear x={st.rx.x} y={st.rx.y} rxOut={m.rxOut} on={live} />
        </Group>
      ) : null}
      <MicCable st={st} inp={m.input} device={m.device} live={voiceLive} />
      {/* the mic lying on the table: its soft contact shadow, the mic, the plug */}
      <Oval x={pe.x - 4} y={st.contactY - 4} width={at.x + R - pe.x + 4} height={8} color="rgba(0,0,0,0.6)">
        <BlurMask blur={3} style="normal" />
      </Oval>
      <Group transform={[{ translateX: at.x }, { translateY: at.y }, { scaleX: -1 }, { rotate: at.ang }]}>
        <HandheldMic x={0} y={0} device={m.device} live={live} tail={tail} />
        {wireless ? null : <MicXlrPlug x={tail} y={0} />}
      </Group>
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

/** The ROOM view's frame (plan cm): the booth and both PA tops, cut to the
 *  glass's shape — closer than the whole room, so every speaker reads. */
const ROOM_FRAME: Box = { x: -520, y: -30, w: 1040, h: Math.round(1040 / ASPECT) };
/** Each speaker symbol, booth monitors included, at least this many points
 *  across (lab-art grade 2026-10-19). */
const ROOM_SYMBOL_PT = 20;

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
  // a reading counts only when it was rendered from the booth as it is now,
  // and nothing is judged before this screen's own setup (toddler hunt
  // 2026-10-19: the dynamic mic's speech ticked the condenser goal the
  // moment the condenser went into MIC 1)
  const freshNow = useFreshReading(booth, last);
  const fresh = ready && freshNow;
  const faultAt = useRef<number | null>(null);
  if (ready && fb.state === 'RINGING' && m.on) ringSeen.current = true;
  const micPk = extPeak(last, 'mic', true);
  const speaking = hadSpeech(last);
  const clean = !!last && last.ext.clipped.micPre === 0 && last.ext.clipped.micInput === 0;
  const lastSay = m.says[m.says.length - 1];
  const shout = !!last && speaking && !!lastSay && (lastSay.db ?? 0) > 0;
  const dip = last ? last.ext.duckMinDb : 0;
  const recovered = !!last && last.ext.duckDb.length > 0 && last.ext.duckDb[last.ext.duckDb.length - 1] > -1;
  if (fresh && m.talkover && speaking && dip <= -6 && booth.decks.A.playing) dipped.current = true;
  const inTarget = micPk != null && micPk >= TARGET.lo && micPk <= TARGET.hi;
  const overload = micInputOverload(m);
  if (overload && speaking) overloadSince.current ??= Date.now();
  if (!overload) overloadSince.current = null;
  const showOverload = overloadSince.current != null && Date.now() - overloadSince.current > 10000;
  const hits = [
    fresh && speaking && !shout && inTarget && clean,
    dipped.current && fresh && recovered,
    fresh && m.device === 'CONDENSER' && micAlive(m) && speaking && micPk != null && micPk > -40,
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
  const frame = stageFor(m.device).frame;

  const st = stageFor(m.device);
  const S = st.S; // the stage's pt per mm at 390 wide: label asks in points
  const F0 = st.front;
  const fp = (p: FrontPart) => {
    const bx = frontPartBox(p);
    // the control and its printed legend above it (legends show when zoomed)
    return { x: bx.x + F0.x, y: bx.y + F0.y - 12, w: bx.w, h: bx.h + 12 };
  };
  const mAt = micAt(m.device);
  const R = MIC_TRUE.grilleR[m.device];
  const micLeft = (wireless ? tailAt(m.device) : plugEnd(m.device)).x;
  const rxO = rxOut(st);
  // the antennas (thin, so only they block a label, not the air between)
  const antennas: Box[] = [
    { x: st.rx.x + 14 - 30, y: st.rx.y - 140, w: 34, h: 152 },
    { x: st.rx.x + RX_W - 14 - 10, y: st.rx.y - 140, w: 16, h: 152 },
  ];
  const mixerObstacles: Box[] = [
    // the whole front panel: a label never sits on it (zoomed in, every
    // label is pushed off it, above or beside)
    { x: F0.x, y: F0.y, w: FRONT_W, h: FRONT_H },
    ...(['mic1', 'mic2', 'gain1', 'gain2', 'level', 'on', 'talk', 'depth', 'sendBooth', 'sendRec', 'phantom'] as FrontPart[]).map(fp),
    // the meter block, its scale and names
    { x: st.frame.x, y: st.frame.y, w: st.met.x + st.met.len + 4 - st.frame.x, h: st.met.bottom + 3 - st.frame.y },
    // the mic lying on the table, its lead's lane and turn (no label sits on them)
    { x: micLeft - 4, y: st.contactY - 2 * R - 4, w: mAt.x + R - micLeft + 8, h: 2 * R + 8 },
    { x: wireless ? F0.x : st.loopX - 6, y: st.laneY - 6, w: (wireless ? rxO.x : Math.max(...[FRONT.mic1.x, FRONT.mic2.x].map((v) => v + F0.x))) - (wireless ? F0.x : st.loopX - 6) + 6, h: 12 },
    ...(wireless ? [{ x: st.rx.x, y: st.rx.y, w: RX_W, h: RX_H + 4 }, { x: rxO.x - 8, y: rxO.y, w: 16, h: st.laneY - rxO.y + 6 }, ...antennas] : [{ x: st.loopX - 8, y: st.laneY, w: 16, h: plugEnd(m.device).y - st.laneY + 8 }]),
  ];
  const mixerSoft: Box[] = [{ x: F0.x, y: F0.y, w: FRONT_W, h: FRONT_H }];
  // every panel label ABOVE its control on a short upright leader, in rows
  // counted up from the panel (MIC ON nearest, TALK OVER the row above, so
  // neither leader crosses the other's words); the sends to the panel's
  // right on a level leader under DEPTH; the mic's name to the right of its
  // grille, on the table. Each mic input's label carries its GAIN while the
  // mic is in it.
  const gainLine = `GAIN +${gainDb.toFixed(0)} dB`;
  const m1Lines = ['MIC 1', m.phantom ? '+48 V ON' : '+48 V OFF', ...(m.input === 'MIC1' ? [gainLine] : [])];
  const m2Lines = ['MIC 2', 'NO +48 V', ...(m.input === 'MIC2' ? [gainLine] : [])];
  /** dy (pt) that seats an n-line label in `row` above the panel. */
  const above = (n: number, row: number, py: number) => (F0.y - (3 + row * 19.5 + (n * 12.5 + 4) / 2) / S - py) * S;
  const m1At = { x: F0.x + FRONT.mic1.x, y: F0.y + FRONT.mic1.y - FRONT.mic1.d * 0.65 };
  const m2At = { x: F0.x + FRONT.mic2.x, y: F0.y + FRONT.mic2.y - FRONT.mic2.d * 0.65 };
  const onAt = { x: F0.x + FRONT.on.x + FRONT.on.w / 2, y: F0.y + FRONT.on.y };
  const toAt = { x: F0.x + FRONT.talk.x + FRONT.talk.w - 5, y: F0.y + FRONT.talk.y };
  const sndAt = { x: F0.x + FRONT.sendRec.x + FRONT.sendRec.w, y: F0.y + 44 };
  const swAt = { x: st.rx.x + RX_JACKS.sw.x - 1, y: st.rx.y + RX_JACKS.sw.y - 5 };
  const rxLines = ['RECEIVER OUT', m.rxOut];
  const mixerCallouts: Callout[] = ([
    { id: 'snd', text: `SENDS BOOTH ${m.toBooth ? 'ON' : 'OFF'} REC ${m.toRec ? 'ON' : 'OFF'}`, lines: ['MIC SENDS', `BOOTH ${m.toBooth ? 'ON' : 'OFF'}`, `REC ${m.toRec ? 'ON' : 'OFF'}`], at: sndAt, dx: (F0.x + FRONT_W + 5 - sndAt.x) * S, dy: 0, tone: m.toRec ? 'amber' : 'plain' },
    { id: 'm1', text: m1Lines.join(' '), lines: m1Lines, at: m1At, dx: 0, dy: above(m1Lines.length, 0, m1At.y), tone: m.input === 'MIC1' ? 'amber' : 'plain' },
    { id: 'm2', text: m2Lines.join(' '), lines: m2Lines, at: m2At, dx: 0, dy: above(m2Lines.length, 0, m2At.y), tone: m.input === 'MIC2' ? 'amber' : 'plain' },
    { id: 'on', text: m.on ? 'MIC ON' : 'MIC OFF', at: onAt, dx: 0, dy: above(1, 0, onAt.y), tone: m.on ? 'red' : 'plain' },
    { id: 'to', text: m.talkover ? 'TALK OVER ON' : 'TALK OVER', at: toAt, dx: 0, dy: above(1, 1, toAt.y), tone: m.talkover ? 'amber' : 'plain' },
    // the receiver's switch: its label in the clear air between the
    // antennas, straight above the switch (left edge on the leader's line)
    ...(wireless ? [{ id: 'rx', text: rxLines.join(': '), lines: rxLines, at: swAt, dx: 0.5, dy: (st.rx.y - (6 + (2 * 12.5 + 4) / 2) / S - swAt.y) * S, tone: m.rxOut === 'LINE' && m.input !== 'NONE' ? ('red' as const) : ('plain' as const) }] : []),
    { id: 'mk', text: m.device === 'CONDENSER' ? 'CONDENSER MIC' : m.device === 'WIRELESS' ? 'WIRELESS MIC' : 'DYNAMIC MIC', at: { x: mAt.x + R, y: mAt.y }, dx: 8, dy: 0, tone: 'plain' },
  ] as Callout[]).filter((c) => !wireless || !['snd', 'to', 'on'].includes(c.id)); // the wireless view: the receiver's lesson, the panel's lit keys and the dock carry the rest
  const roomCallouts: Callout[] = [
    { id: 'mic', text: `MIC · ${fb.state === 'RINGING' ? 'RINGING' : fb.state === 'EDGE' ? 'ON THE EDGE' : Number.isFinite(fb.marginDb) ? `${fb.marginDb.toFixed(0)} dB SPARE` : 'OFF'}`, at: planAt.mic(m.pos), dx: 0, dy: 34, tone: fb.state === 'RINGING' ? 'red' : fb.state === 'EDGE' ? 'amber' : 'green' },
    { id: 'pl', text: 'PA L', at: planAt.top(ev.venue.place, 'L'), dx: -10, dy: -24, tone: fb.worst?.id === 'topL' && fb.state !== 'SAFE' ? 'red' : 'plain' },
    { id: 'pr', text: 'PA R', at: planAt.top(ev.venue.place, 'R'), dx: 10, dy: -24, tone: fb.worst?.id === 'topR' && fb.state !== 'SAFE' ? 'red' : 'plain' },
    { id: 'ml', text: 'MONITOR L', at: planAt.monitor('L'), dx: 34, dy: 14, tone: m.toBooth ? 'amber' : 'plain' },
    { id: 'mr', text: 'MONITOR R', at: planAt.monitor('R'), dx: -34, dy: 14, tone: m.toBooth ? 'amber' : 'plain' },
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
              focus={{ x: st.front.x + 90, y: st.front.y, w: 120, h: FRONT_H }}
              screenOverlay={(sw, _sh, _xf, kz) => <DipStrip w={sw} k={Math.sqrt(Math.max(1, kz))} idle={m.talkover ? 'NO DIP · TALK TO DIP THE MUSIC' : 'NO DIP · TALK OVER IS OFF'} />}
              a11y={`${LOOK_MIXER} The mic is ${m.input === 'NONE' ? 'not plugged in' : `in ${MIC_INPUTS[m.input].label}`}, ${m.on ? 'on' : 'off'}. The green bracket on the MIC meter is the speech target, ${TARGET.lo} to ${TARGET.hi} dBFS.`}
              obstacles={mixerObstacles}
              soft={mixerSoft}
              callouts={mixerCallouts}
            >
              <MixerView booth={booth} live={live} voiceLive={voiceLive} voice={[voiceLive, voiceIn(last, 'crowd'), voiceIn(last, 'booth'), voiceIn(last, 'rec')]} />
            </Scene>
          ) : (
            <Scene w={w} h={h} frame={ROOM_FRAME} motion={motion} fit={{ x: 0, y: 0, w, h: h - LEGEND_H * k }} aspect={false} focus={{ x: -150, y: 40, w: 300, h: 160 }} screenOverlay={(sw, sh, _xf, kz) => <HeatLegend w={sw} h={sh} k={Math.sqrt(Math.max(1, kz))} mode="TOPS" place={ev.venue.place} feedDbfs={last?.ext.feedRms.master ?? -24} strip />} a11y={`${LOOK_ROOM} The mic is ${MIC_POS[m.pos].label.toLowerCase()}; ${fb.state === 'RINGING' ? 'it is ringing' : fb.state === 'EDGE' ? 'it is on the edge of feedback' : 'it is safe from feedback'}.`} obstacles={[...planObstacles(ev.venue.place, ev.venue.subPos, false, true, fitView(ROOM_FRAME, w, h - LEGEND_H * k, 6).s, ROOM_SYMBOL_PT), { x: -170, y: 300, w: 340, h: 46 }]} callouts={roomCallouts}>
              <PlanView spec={{ map: 'TOPS', place: ev.venue.place, subPos: ev.venue.subPos, subs: false, feedDbfs: last?.ext.feedRms.master ?? -24, monitors: true, mic: live ? { pos: m.pos, fb } : { pos: m.pos, fb: { ...fb, state: 'SAFE' } }, edges: true, symbolPt: ROOM_SYMBOL_PT, hotTop: fb.state !== 'SAFE' && fb.worst?.id.startsWith('top') ? (fb.worst.id as 'topL' | 'topR') : null }} />
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
        {showOverload ? <Note tone="safety">On this lab’s mixer (and many), the receiver’s LINE output overloads the mic input before the GAIN knob — turning GAIN down cannot clean it. Set the receiver to MIC.</Note> : null}
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
          met={fresh && m.device === 'WIRELESS' && m.rxOut === 'MIC' && speaking && !shout && inTarget && clean}
          progress={m.device === 'WIRELESS' && speaking && !clean ? 'Still clipping — and not at the GAIN knob. What sits before it?' : null}
          explain="A line-level signal is some 40–55 dB hotter than a mic. On this lab’s mixer (and many), it overloads the mic input’s first stage, before the GAIN knob can do anything — so the cure is the receiver’s output switch on MIC (or a line input), then GAIN set by the meter."
          onMet={() => setCheck(true)}
        />
        <FaultCard
          title="THE RECORDING HAS NO VOICE"
          symptom="The room heard your announcement clearly, but the recording has the music only."
          start={() => {
            void audio.requestSound();
            faultAt.current = boothNow();
            updateBooth((b, tt) => {
              const x = withMic(b, { device: 'DYNAMIC', input: 'MIC1', on: true, gain1: micGainPos(44), level: 0.75, toRec: false, pos: 'DECKS' });
              return { ...x, decks: { ...x.decks, A: { ...x.decks.A, playing: true, at: tt } }, ev: { ...x.ev!, rec: { ...x.ev!.rec, tap: 'REC_OUT' } }, perspective: 'CROWD' };
            });
            announce(audio.leadSec() + 0.6);
          }}
          // only a voice rendered AFTER the fault began: the voice still sounding
          // from before it fixed it on the spot (toddler hunt 2026-10-19)
          fixed={renderedSince(last, faultAt.current) && voiceIn(last, 'rec')}
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
