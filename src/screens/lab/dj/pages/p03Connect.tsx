/**
 * Screen 3 — Connections and signal types (research DJ03 + DJ04): cable
 * identification; inputs versus outputs; stereo versus balanced mono; mic,
 * phono and line levels; audio versus USB, MIDI and network data. The stage
 * is the back of the source (a player or a turntable) over the back of the
 * mixer, with the source's RCA pair in its own two lanes. The fault: a thin,
 * quiet record (a raw cartridge into a LINE input).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Group, LinearGradient, Path, Rect, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import { useDerivedValue, useSharedValue, withSpring } from 'react-native-reanimated';
import { LinearGradient as ExpoGradient } from 'expo-linear-gradient';
import { colors, fonts } from '../../../../theme/tokens';
import { fitValue } from '../../../../theme/legibility';
import { LabChip } from '../../LabShell';
import { UnderstandingCheck } from '../../tuning/components/check';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import { Scene } from '../art/Scene';
import { GndPost, MixerRear, PlayerRear, TT_REAR_JACKS, TurntableRear } from '../art/RearPanels';
import { CableRun, type Run } from '../art/cables';
import { Halo, PlugFace } from '../art/parts';
import { INK } from '../art/ink';
import { MIXER_REAR, PLAYER_REAR_JACKS, type Box, type Pt } from '../geometry/boothGeometry';
import { GND_LUG, S3, TT3_INSET, TT3_REAR_W, groundLane3, groundRun3, lane3, mixJack3, pairBox3, parked3, run3, srcBox3, srcJack3, ttGnd3, type Parked3, type Source3 } from '../geometry/dressGeometry';
import { DjRack } from '../DjRack';
import { Do, FaultCard, GoalChips, Look, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { stopKey } from '../dock';
import { getBooth, updateBooth } from '../booth/boothStore';
import { useScreenSetup } from '../booth/setup';
import { channelRoute, connect, hotPatchSpeakers, JACK_NAMES, LEVELS, type Booth, type JackId, type PlugId } from '../model/djModel';
import { peakShort, useBoothKit } from './shared';

const TERMS = [
  { term: 'Line level', def: 'The everyday level between audio devices — players, mixers, interfaces. Consumer gear works around −10 dBV (about 0.3 V), professional gear around +4 dBu (about 1.2 V); dBu and dBV are voltages in the cable (0 dBu is 0.775 V, 0 dBV is 1 V), not loudness in the room and not the digital dBFS of a meter.' },
  { term: 'Phono level', def: 'The tiny signal straight from a turntable’s cartridge — a few thousandths of a volt. Records are also cut with the bass turned down and the treble up (the RIAA curve), so a PHONO input adds about 36 dB and undoes that curve. Without it a record is quiet, thin and bright.' },
  { term: 'Mic level', def: 'A microphone’s signal: around phono level or a little lower — about 1–3 thousandths of a volt for close speech, far more for a shout — so a mic input adds roughly 40–60 dB of gain.' },
  { term: 'Balanced (mono)', def: 'One channel on three conductors (XLR, or a TRS jack used this way): two signal wires and a shield. The input takes the DIFFERENCE between the two wires, so hum picked up equally on both cancels. A stereo feed needs TWO balanced cables — and a stereo headphone TRS is the same plug shape doing a different job.' },
] as const;

/* ── the rear stack (geometry/dressGeometry: pure, tested) ──────────── */

const FRAME = S3.frame;
const mixJack = mixJack3;
type Source = Source3;

/** One RCA lead as drawn: its own lane, DRESSED (a real bend radius, a
 *  catenary sag across the gap); a lead for a BOTTOM-row jack comes down its
 *  own column beside the stack and hooks in, so it never covers the plug
 *  above; a loose lead hangs straight down from its socket. */
function runFor(b: Booth, src: Source, side: 'L' | 'R', live: boolean): Run {
  const plug: PlugId = src === 'A' ? (side === 'L' ? 'A.rcaL' : 'A.rcaR') : side === 'L' ? 'tt.rcaL' : 'tt.rcaR';
  const to = b.plugs[plug];
  const into = to && to.startsWith('ch') ? to : null;
  const colour = side === 'L' ? INK.rcaWhite : INK.rcaRed;
  return { id: plug, kind: 'rca', colour, pts: lane3(src, side, into), dense: run3(src, side, into), plugged: !!into, live: !!into && live, label: side, dashed: side === 'R', looseSag: 1 };
}

/** The OTHER source's lead, still in its jack after a SOURCE switch (round
 *  2, grades screen 3: the bezel said "CH1 L GETS DECK A L" while the drawing
 *  showed the jack empty). Its plug stays in the jack; its lead leaves the
 *  plug and fades out, because its source is off this picture. Round 3: it is
 *  drawn as a SOLID cable for most of its length (a faint stub read as
 *  glare), in front of the selector's ring, and it keeps off the panel's
 *  printed legends (geometry: dressGeometry.parked3). */
function ParkedLead({ p }: { p: Parked3 }) {
  const colour = p.side === 'L' ? INK.rcaWhite : INK.rcaRed;
  const jacket = p.side === 'L' ? ['rgb(141,144,151)', 'rgb(141,144,151)', 'rgba(141,144,151,0)'] : ['rgb(122,32,24)', 'rgb(122,32,24)', 'rgba(122,32,24,0)'];
  const [a, b] = p.stub;
  const path = useMemo(() => {
    const pb = Skia.PathBuilder.Make();
    pb.moveTo(a[0], a[1]);
    pb.lineTo(b[0], b[1]);
    return pb.detach();
  }, [a, b]);
  return (
    <Group opacity={0.9}>
      <Path path={path} style="stroke" strokeWidth={3.8} strokeCap="butt">
        <LinearGradient start={vec(a[0], a[1])} end={vec(b[0], b[1])} colors={['rgba(0,0,0,0.75)', 'rgba(0,0,0,0.75)', 'rgba(0,0,0,0)']} positions={[0, 0.6, 1]} />
      </Path>
      <Path path={path} style="stroke" strokeWidth={3.2} strokeCap="butt">
        <LinearGradient start={vec(a[0], a[1])} end={vec(b[0], b[1])} colors={jacket} positions={[0, 0.6, 1]} />
      </Path>
      <PlugFace cx={a[0]} cy={a[1]} kind="rca" colour={colour} dir={Math.atan2(b[1] - a[1], b[0] - a[0])} />
    </Group>
  );
}

/** A spade (fork) lug, crimped onto the ground wire, clamped under a GND
 *  post's thumb nut: its tongue round the stud, the crimp barrel and the
 *  wire's insulation sleeve toward the wire (`up`: the wire leaves upward). */
function SpadeLug({ cx, cy, up }: { cx: number; cy: number; up: boolean }) {
  return (
    <Group transform={[{ translateX: cx }, { translateY: cy }, { rotate: up ? Math.PI : 0 }]}>
      <RoundedRect x={-3.9} y={-3.9} width={7.8} height={8.6} r={3.4} color="rgba(0,0,0,0.55)" transform={[{ translateX: 0.6 }, { translateY: 0.9 }]} />
      <RoundedRect x={-3.6} y={-3.6} width={7.2} height={8.4} r={3.2}>
        <LinearGradient start={vec(-3.6, -3.6)} end={vec(3.6, 4.8)} colors={['#e9d9a8', '#b49a5c', '#7a6438']} />
      </RoundedRect>
      {/* the fork's slot, open away from the wire */}
      <Rect x={-1.25} y={-3.7} width={2.5} height={3.7} color="#0b0b0d" />
      <RoundedRect x={-1.7} y={4.2} width={3.4} height={2.2} r={0.6}>
        <LinearGradient start={vec(-1.7, 0)} end={vec(1.7, 0)} colors={['#7a6438', '#e9d9a8', '#7a6438']} />
      </RoundedRect>
      {/* the crimp barrel inside its sleeve */}
      <RoundedRect x={-2.3} y={6} width={4.6} height={GND_LUG - 5.4} r={1.2}>
        <LinearGradient start={vec(-2.3, 0)} end={vec(2.3, 0)} colors={['#1d4a26', '#3f8a4c', '#1d4a26']} />
      </RoundedRect>
    </Group>
  );
}

/** The turntable's ground wire: a thin insulated wire with a spade lug at
 *  each end, hanging in its own lane from post to post. */
function GroundWire() {
  const dense = useMemo(() => groundRun3(), []);
  const path = useMemo(() => {
    const pb = Skia.PathBuilder.Make();
    pb.moveTo(dense[0][0], dense[0][1]);
    for (let i = 1; i < dense.length; i++) pb.lineTo(dense[i][0], dense[i][1]);
    return pb.detach();
  }, [dense]);
  const m = mixJack('gnd');
  return (
    <Group>
      <Path path={path} style="stroke" strokeWidth={2.2} color="rgba(0,0,0,0.6)" strokeCap="round" strokeJoin="round" transform={[{ translateX: 0.6 }, { translateY: 1 }]} />
      <Path path={path} style="stroke" strokeWidth={1.9} color="#2d6a38" strokeCap="round" strokeJoin="round" />
      <Path path={path} style="stroke" strokeWidth={0.45} color="rgba(255,255,255,0.28)" strokeCap="round" transform={[{ translateX: -0.35 }, { translateY: -0.4 }]} />
      <SpadeLug cx={ttGnd3.x} cy={ttGnd3.y} up={false} />
      <SpadeLug cx={m.x} cy={m.y} up />
      {/* the thumb nuts, screwed down onto the lugs */}
      <GndPost cx={ttGnd3.x} cy={ttGnd3.y} d={7.6} />
      <GndPost cx={m.x} cy={m.y} d={7.2} />
    </Group>
  );
}

/** A lead just pulled out swings on its socket and settles (a damped
 *  pendulum: about 1.8 Hz for the drawn drop, half its swing gone in about
 *  a second). Decorative motion only. */
function SwingingLead({ r, pivot, swing }: { r: Run; pivot: Pt; swing: boolean }) {
  const ang = useSharedValue(0);
  const was = useRef(r.plugged);
  useEffect(() => {
    if (was.current && !r.plugged && swing) {
      ang.value = 0.24 * (r.label === 'L' ? -1 : 1);
      ang.value = withSpring(0, { mass: 1, stiffness: 128, damping: 1.6 });
    }
    was.current = r.plugged;
  }, [r.plugged, r.label, swing, ang]);
  const tf = useDerivedValue(() => [{ rotate: ang.value }]);
  if (r.plugged) return <CableRun r={r} />;
  return (
    <Group origin={vec(pivot.x, pivot.y)} transform={tf}>
      <CableRun r={r} />
    </Group>
  );
}

/* ── what each socket is (the IDENTIFY tray) ──────────────────────────── */

type Sock = { id: string; label: string; short: string; blurb: string; box: (src: Source) => Box | null };
const ring = (p: Pt, r: number): Box => ({ x: p.x - r, y: p.y - r, w: r * 2, h: r * 2 });
const SOCKETS: Sock[] = [
  { id: 'out', label: 'AUDIO OUT', short: 'OUT', blurb: 'An OUTPUT. Analog audio at line level, stereo on a pair of RCA sockets: white is left, red is right.', box: (s) => (s === 'A' ? { x: 56, y: 42, w: 52, h: 28 } : { x: 80, y: 32, w: 52, h: 28 }) },
  { id: 'digital', label: 'DIGITAL OUT', short: 'DIGITAL', blurb: 'An OUTPUT of DIGITAL audio (stereo in one coax cable, orange ring). It goes to a digital input — never into an analog LINE input.', box: (s) => (s === 'A' ? ring({ x: PLAYER_REAR_JACKS.digital.x, y: PLAYER_REAR_JACKS.digital.y }, 10) : null) },
  { id: 'lan', label: 'LINK (LAN)', short: 'LAN', blurb: 'Network DATA both ways. A linked-player network shares track lists and timing — it carries NO audio to the mixer, so the RCA pair is still needed.', box: (s) => (s === 'A' ? { x: PLAYER_REAR_JACKS.lan.x - 11, y: PLAYER_REAR_JACKS.lan.y - 10, w: 22, h: 20 } : null) },
  { id: 'usb', label: 'USB', short: 'USB', blurb: 'DATA to and from a computer. It can carry control messages (knob and button moves), files and, on some devices, audio — it depends on the device and its software.', box: (s) => (s === 'A' ? { x: PLAYER_REAR_JACKS.usb.x - 9, y: PLAYER_REAR_JACKS.usb.y - 9, w: 18, h: 18 } : null) },
  { id: 'ac', label: 'AC IN', short: 'AC', blurb: 'MAINS POWER in (the IEC inlet). Not a signal at all — keep power cords apart from audio cables where you can.', box: (s) => (s === 'A' ? { x: PLAYER_REAR_JACKS.ac.x - 15, y: PLAYER_REAR_JACKS.ac.y - 11, w: 30, h: 22 } : { x: S3.ttX + TT_REAR_JACKS.ac.x - 15, y: TT_REAR_JACKS.ac.y - 3, w: 30, h: 22 }) },
  { id: 'preamp', label: 'PHONO/LINE SWITCH', short: 'SWITCH', blurb: 'On a turntable with its own preamp: PHONO sends the raw cartridge signal (it needs a PHONO input); LINE switches the preamp on (it needs a LINE input). Never both, never neither.', box: (s) => (s === 'TT' ? { x: S3.ttX + TT_REAR_JACKS.preamp.x - 14, y: TT_REAR_JACKS.preamp.y - 4, w: 28, h: 22 } : null) },
  { id: 'line', label: 'CH1 LINE IN', short: 'LINE IN', blurb: 'An INPUT at line level, stereo on an RCA pair. Players, interfaces, a turntable with its preamp ON.', box: () => ({ x: mixJack('ch1.line.L').x - 9, y: mixJack('ch1.line.L').y - 9, w: 18, h: 42 }) },
  { id: 'phono', label: 'CH1 PHONO IN', short: 'PHONO', blurb: 'An INPUT for a raw turntable cartridge: it adds about 36 dB of gain and undoes the record’s RIAA curve. A line-level source here overloads it.', box: () => ({ x: mixJack('ch1.phono.L').x - 9, y: mixJack('ch1.phono.L').y - 9, w: 18, h: 42 }) },
  { id: 'gnd', label: 'GND POST', short: 'GND', blurb: 'Where a turntable’s thin ground wire goes (a SIGNAL ground, against hum). It is not the mains earth, and nothing replaces that.', box: () => ring(mixJack('gnd'), 9) },
  { id: 'master', label: 'MASTER OUT (XLR)', short: 'MASTER', blurb: 'OUTPUTS, balanced, line level: one XLR per side, left and right. Each is a MONO balanced channel — a stereo feed is two cables.', box: () => ({ x: Math.min(mixJack('master.L').x, mixJack('master.R').x) - 14, y: mixJack('master.L').y - 14, w: Math.abs(mixJack('master.R').x - mixJack('master.L').x) + 28, h: 28 }) },
  { id: 'booth', label: 'BOOTH OUT (TRS)', short: 'BOOTH', blurb: 'OUTPUTS, balanced, line level, on 6.35 mm TRS jacks — here each TRS is ONE mono channel (L or R). The same plug shape as stereo headphones, a different job.', box: () => ({ x: mixJack('booth.L').x - 10, y: mixJack('booth.L').y - 10, w: 20, h: mixJack('booth.R').y - mixJack('booth.L').y + 20 }) },
];

/** Find-the-socket questions (learning review p03 #3): answered by picking
 *  the socket in IDENTIFY — the halo shows where it is. */
const FINDS: { ask: string; bezel: string; ids: readonly string[]; why: string }[] = [
  { ask: 'Which socket sends the mix to the PA?', bezel: 'MIX → PA', ids: ['master'], why: 'MASTER OUT: one balanced XLR per side, to the PA speakers.' },
  { ask: 'Which socket carries no audio at all?', bezel: 'NO AUDIO', ids: ['ac', 'lan'], why: 'Mains power (AC IN) and the player link (LAN) carry no sound to the mixer.' },
  { ask: 'Where does a raw turntable go?', bezel: 'RAW TT', ids: ['phono'], why: 'CH1 PHONO IN: about 36 dB of gain and the RIAA curve undone.' },
];

export const GOALS_CONNECT = ['Find three sockets by their job', 'Deck A into CH1 LINE, both sides', 'Hear one side go missing', 'Raw turntable into PHONO', 'Fix the thin, quiet record', 'Pass the check'] as const;

/* ── the level ladder (well figure) ───────────────────────────────────── */

function LevelLadder() {
  const rows = [LEVELS.mic, LEVELS.phono, LEVELS.consumerLine, LEVELS.proLine];
  // a log scale from 0.6 mV to 2 V, so a thousand-fold step is visible
  const frac = (v: number) => Math.max(0.03, (Math.log10(v) - Math.log10(0.0006)) / (Math.log10(2) - Math.log10(0.0006)));
  return (
    <View style={styles.ladder} accessible accessibilityRole="image" accessibilityLabel="Typical signal levels on a log scale: a microphone about 2 millivolts, a phono cartridge about 5 millivolts, consumer line level about 0.3 volts, professional line level about 1.2 volts.">
      <Text style={styles.ladderHead}>TYPICAL LEVELS IN THE CABLE (LOG SCALE)</Text>
      {rows.map((r) => (
        <View key={r.label} style={styles.ladderRow}>
          <Text style={styles.ladderLabel} {...fitValue(11)}>{r.label}</Text>
          <View style={styles.ladderTrack}>
            <ExpoGradient colors={['#1e3a66', '#6fa8ff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.ladderBar, { width: `${Math.round(frac(r.volts) * 100)}%` }]} />
          </View>
          <Text style={styles.ladderVal} {...fitValue(12)}>{r.volts < 0.1 ? `${(r.volts * 1000).toFixed(0)} mV` : `${r.volts.toFixed(2)} V`}</Text>
        </View>
      ))}
    </View>
  );
}

/* ── the screen ───────────────────────────────────────────────────────── */

const JACK_CHOICES: (JackId | null)[] = ['ch1.line.L', 'ch1.line.R', 'ch1.phono.L', 'ch1.phono.R', null];

function PatchRca({ src }: { src: Source }) {
  const b = getBooth();
  const plugs: PlugId[] = src === 'A' ? ['A.rcaL', 'A.rcaR'] : ['tt.rcaL', 'tt.rcaR'];
  const [hot, setHot] = useState(false);
  const patch = (p: PlugId, j: JackId | null) => {
    setHot(hotPatchSpeakers(getBooth(), p, j).length > 0);
    updateBooth((x) => connect(x, p, j));
  };
  return (
    <View style={styles.tray}>
      {hot ? <Text style={styles.warn}>HOT-PATCH — that plug moved on a channel the crowd is hearing. The lab keeps it quiet; on a real system it would pop or buzz through the PA. Pull the channel fader down first.</Text> : null}
      {plugs.map((p) => (
        <View key={p} style={styles.tray}>
          <Text style={styles.trayHead}>{`${p.endsWith('L') ? 'WHITE (LEFT)' : 'RED (RIGHT)'} PLUG → ${b.plugs[p] ? JACK_NAMES[b.plugs[p]!] : 'not plugged in'}`}</Text>
          <View style={styles.row}>
            {JACK_CHOICES.map((j) => (
              <LabChip key={j ?? 'out'} label={j ? JACK_NAMES[j].replace('CH1 ', '') : 'UNPLUG'} selected={b.plugs[p] === j} onPress={() => patch(p, j)} compact />
            ))}
          </View>
        </View>
      ))}
      <Text style={styles.trayHead}>{`CH1 INPUT SELECTOR (on the mixer’s top) → ${b.ch[1].input}`}</Text>
      <View style={styles.row}>
        {(['LINE', 'PHONO', 'USB'] as const).map((i) => (
          <LabChip key={i} label={i} selected={b.ch[1].input === i} onPress={() => updateBooth((x) => ({ ...x, ch: { ...x.ch, 1: { ...x.ch[1], input: i } } }))} compact />
        ))}
      </View>
    </View>
  );
}

function PageConnect({ ctx }: { ctx: PageCtx }) {
  const { booth, audio, tr, motion } = useBoothKit();
  useScreenSetup((b) => {
    let x = connect(connect(b, 'A.rcaL', null)!, 'A.rcaR', null)!;
    x = connect(connect(x, 'tt.rcaL', null)!, 'tt.rcaR', null)!;
    return { ...x, ttPreamp: 'PHONO', tt: { ...x.tt, playing: false }, ch: { ...x.ch, 1: { ...x.ch[1], input: 'LINE', fader: 0.8, xf: 'THRU' } }, perspective: 'CROWD' };
  });
  const [src, setSrc] = useState<Source>('A');
  const [ident, setIdent] = useState<string>('out');
  const [find, setFind] = useState(0);
  const [findMsg, setFindMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [oneSide, setOneSide] = useState(false);
  const [check, setCheck] = useState(false);
  const [faultFixed, setFaultFixed] = useState(false);
  const route = channelRoute(booth, 1);
  const last = audio.last;
  const sourcePlaying = src === 'A' ? booth.decks.A.playing : booth.tt.playing;
  const liveL = sourcePlaying && !!route.L && route.L.source === src;
  const liveR = sourcePlaying && !!route.R && route.R.source === src;
  const runs = [runFor(booth, src, 'L', liveL), runFor(booth, src, 'R', liveR)];
  // the other source's plugs stay in their jacks when you switch SOURCE
  const other: Source = src === 'A' ? 'TT' : 'A';
  const plugOf = (s: Source, side: 'L' | 'R'): PlugId => (s === 'A' ? (side === 'L' ? 'A.rcaL' : 'A.rcaR') : side === 'L' ? 'tt.rcaL' : 'tt.rcaR');
  const parked = parked3(src, { L: booth.plugs[plugOf(src, 'L')] ?? null, R: booth.plugs[plugOf(src, 'R')] ?? null }, { L: booth.plugs[plugOf(other, 'L')] ?? null, R: booth.plugs[plugOf(other, 'R')] ?? null });
  const parkedKey = parked.map((q) => `${q.side}${q.jack}`).join(',');
  const otherName = other === 'A' ? 'DECK A' : 'TURNTABLE';
  const aBoth = booth.plugs['A.rcaL'] === 'ch1.line.L' && booth.plugs['A.rcaR'] === 'ch1.line.R' && booth.ch[1].input === 'LINE' && booth.decks.A.playing && !!last && last.rmsDb.masterL > -60 && last.rmsDb.masterR > -60;
  const lOnly = booth.decks.A.playing && !!last && (last.rmsDb.masterL > -60) !== (last.rmsDb.masterR > -60);
  if (lOnly && !oneSide) setOneSide(true);
  const ttOk = booth.tt.playing && booth.ttPreamp === 'PHONO' && booth.plugs['tt.rcaL'] === 'ch1.phono.L' && booth.plugs['tt.rcaR'] === 'ch1.phono.R' && booth.ch[1].input === 'PHONO' && !!last && last.rmsDb.ch1 > -40 && last.clipped.phono1 === 0;
  const hits = [find >= FINDS.length, aBoth, oneSide, ttOk, faultFixed, check];
  const goals = GOALS_CONNECT.map((label, i) => ({ label, hit: hits[i] }));
  const latched = useVisitGoals(ctx, goals, 'CONNECT');
  const sock = SOCKETS.find((s) => s.id === ident)!;
  const box = sock.box(src);
  const answer = (id: string) => {
    if (find >= FINDS.length) return;
    const q = FINDS[find];
    const picked = SOCKETS.find((s) => s.id === id)!;
    if (q.ids.includes(id)) {
      setFindMsg({ ok: true, text: `Yes — ${q.why}` });
      setFind((n) => n + 1);
    } else setFindMsg({ ok: false, text: `Not ${picked.label}: ${picked.blurb}` });
  };
  // the input selector, shown on the rear panel: the pair it listens to is
  // outlined green, the other pair is dimmed (learning review p03 #2)
  const pairBox = pairBox3;
  const selPair: 'line' | 'phono' | null = booth.ch[1].input === 'LINE' ? 'line' : booth.ch[1].input === 'PHONO' ? 'phono' : null;
  const peak = last ? Math.max(...Array.from(last.raw.ch1)) : null;
  const sideWord = (s: typeof route.L) => (s ? `${s.source === 'TT' ? 'TT' : 'DECK ' + s.source} ${s.side}` : '—');
  // the leads (and the ground wire) are obstacles too: no word sits on a cable
  const leadBoxes: Box[] = [];
  for (const l of [lane3(src, 'L', runs[0].plugged ? (booth.plugs[runs[0].id as PlugId] as JackId) : null), lane3(src, 'R', runs[1].plugged ? (booth.plugs[runs[1].id as PlugId] as JackId) : null), ...(src === 'TT' ? [groundLane3()] : [])]) {
    for (let i = 1; i < l.length; i++) {
      const [x0, y0] = l[i - 1];
      const [x1, y1] = l[i];
      leadBoxes.push({ x: Math.min(x0, x1) - 4, y: Math.min(y0, y1) - 4, w: Math.abs(x1 - x0) + 8, h: Math.abs(y1 - y0) + 12 });
    }
  }
  for (const q of parked) {
    const [a, b] = q.stub;
    leadBoxes.push({ x: Math.min(a[0], b[0]) - 7, y: Math.min(a[1], b[1]) - 7, w: Math.abs(b[0] - a[0]) + 14, h: Math.abs(b[1] - a[1]) + 14 });
  }
  const stage = useMemo(
    () => (w: number, h: number) => (
      <Scene
        w={w}
        h={h}
        frame={FRAME}
        motion={motion}
        a11y={`The back of ${src === 'A' ? 'deck A' : 'the turntable'} above the back of the mixer, with the source's white and red RCA plugs.${parked.length ? ` ${otherName === 'DECK A' ? 'Deck A' : 'The turntable'} is still plugged into ${parked.map((q) => q.jack.replace('ch1.', 'channel 1 ').replace('.', ' ')).join(' and ')}.` : ''} Channel 1 left hears ${sideWord(route.L)}, right hears ${sideWord(route.R)}; input selector ${booth.ch[1].input}.`}
        // labels keep OFF both panels (they sit in the gap or the margins,
        // with a leader) and prefer the space clear of the leads
        obstacles={[srcBox3(src), { x: S3.mix.x, y: S3.mix.y, w: MIXER_REAR.w, h: MIXER_REAR.h }, ...leadBoxes]}
        soft={[{ x: 52, y: srcBox3(src).h, w: 104, h: S3.mix.y - srcBox3(src).h }]}
        callouts={[
          // the picked socket's name, unless the panel already prints it right
          // there (AUDIO OUT: the halo marks it; a callout covered the
          // hanging plugs and the patched lead, round 2)
          ...(box && sock.id !== 'out' ? [{ id: 'id', text: sock.label, at: { x: box.x + box.w / 2, y: box.y + box.h / 2 }, dx: 0, dy: -16, tone: 'blue' as const }] : []),
          ...(parked.length ? [{ id: 'park', text: `${otherName}’S PLUGS`, at: parked[0].at, dx: 22, dy: -14, tone: 'plain' as const }] : []),
          { id: 'line', text: selPair === 'line' ? 'SELECTOR → LINE' : 'CH1 LINE', at: { x: mixJack('ch1.line.L').x + 8, y: mixJack('ch1.line.L').y - 8 }, dx: 26, dy: -26, tone: selPair === 'line' ? ('green' as const) : undefined },
          { id: 'phono', text: selPair === 'phono' ? 'SELECTOR → PHONO' : 'CH1 PHONO', at: { x: mixJack('ch1.phono.L').x - 8, y: mixJack('ch1.phono.L').y - 8 }, dx: -26, dy: -26, tone: selPair === 'phono' ? ('green' as const) : undefined },
          ...(src === 'TT' ? [{ id: 'gw', text: 'GROUND WIRE', at: { x: groundLane3()[0][0], y: S3.lane.gnd - 14 }, dx: -20, dy: -6, tone: 'plain' as const }] : []),
        ]}
      >
        {/* the turntable's rear at its true 450 mm: it runs past both edges of the picture (round 3) */}
        {src === 'A' ? <PlayerRear x={0} y={S3.srcY} on label="DECK A (REAR)" /> : <TurntableRear x={S3.ttX - TT3_INSET} y={S3.srcY} on preamp={booth.ttPreamp} w={TT3_REAR_W} inset={TT3_INSET} />}
        <MixerRear x={S3.mix.x} y={S3.mix.y} on />
        {src === 'TT' ? <GroundWire /> : null}
        {(['line', 'phono'] as const).map((k) => {
          const pb = pairBox(k);
          return selPair === k ? null : <RoundedRect key={k} x={pb.x} y={pb.y} width={pb.w} height={pb.h} r={4} color="rgba(6,6,8,0.55)" />;
        })}
        {runs.map((r) => (
          <SwingingLead key={r.id} r={r} pivot={srcJack3(src, r.label as 'L' | 'R')} swing={audio.flowMotion} />
        ))}
        {selPair ? <Halo b={pairBox(selPair)} tone="green" /> : null}
        {/* the other source's leads lie in FRONT of the selector's ring (round 3) */}
        {parked.map((q) => (
          <ParkedLead key={`${q.side}${q.jack}`} p={q} />
        ))}
        {box ? <Halo b={box} /> : null}
      </Scene>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [src, booth, motion, box, sock.label, sock.id, liveL, liveR, selPair, parkedKey],
  );
  return (
    <DjRack
      spec={{
        render: stage,
        bezel: [
          find < FINDS.length ? { k: `FIND ${find + 1}/3`, v: FINDS[find].bezel, tint: findMsg && !findMsg.ok ? '#ff8a7e' : colors.amber } : { k: 'CH1 INPUT', v: booth.ch[1].input, tint: colors.amber },
          { k: 'CH1 L GETS', vA11y: `channel 1 left gets ${sideWord(route.L)}`, v: sideWord(route.L), tint: route.L ? colors.green : colors.textSub },
          { k: 'CH1 R GETS', vA11y: `channel 1 right gets ${sideWord(route.R)}`, v: sideWord(route.R), tint: route.R ? colors.green : colors.textSub },
          peakShort('CH1 PEAK', peak == null ? null : peak <= -59.9 ? -Infinity : peak),
        ],
        params: [
          {
            kind: 'options',
            id: 'src',
            label: 'SOURCE',
            valueLabel: src === 'A' ? 'DECK A' : 'TURNTBL',
            valueA11y: src === 'A' ? 'Deck A' : 'Turntable',
            options: [
              { id: 'A', label: 'DECK A (PLAYER)', blurb: 'A media player: its AUDIO OUT is line level.' },
              { id: 'TT', label: 'TURNTABLE', blurb: 'A turntable with a PHONO/LINE switch on the back. The tray below starts and stops it.' },
            ],
            selectedId: src,
            onSelect: (id) => setSrc(id as Source),
          },
          { kind: 'group', id: 'patch', label: 'PATCH', valueLabel: booth.ch[1].input, render: () => <PatchRca src={src} /> },
          {
            kind: 'options',
            id: 'ident',
            label: 'IDENTIFY',
            valueLabel: sock.short,
            valueA11y: sock.label,
            options: SOCKETS.filter((s) => s.box(src)).map((s) => ({ id: s.id, label: s.label, blurb: s.blurb })),
            selectedId: ident,
            sticky: true,
            onSelect: (id) => {
              setIdent(id);
              answer(id);
            },
          },
          {
            kind: 'group',
            id: 'decks',
            label: 'PLAY',
            valueLabel: src === 'A' ? (booth.decks.A.playing ? 'A ▶' : 'STOPPED') : booth.tt.playing ? 'TT ▶' : 'STOPPED',
            render: () => (
              <View style={styles.tray}>
                {src === 'A' ? (
                  <LabChip label={booth.decks.A.playing ? '❚❚ PAUSE DECK A' : '▶ PLAY DECK A'} selected={booth.decks.A.playing} onPress={() => tr.toggle('A')} />
                ) : (
                  <>
                    <LabChip label={getBooth().tt.playing ? '■ STOP TURNTABLE' : '▶ START TURNTABLE'} selected={getBooth().tt.playing} onPress={() => {
                      if (!getBooth().tt.playing) void audio.requestSound();
                      updateBooth((x, t) => ({ ...x, tt: { ...x.tt, playing: !x.tt.playing, at: t } }));
                    }} />
                    <Text style={styles.trayHead}>{`PREAMP SWITCH (turntable rear) → ${getBooth().ttPreamp}`}</Text>
                    <View style={styles.row}>
                      {(['PHONO', 'LINE'] as const).map((m) => (
                        <LabChip key={m} label={m} selected={getBooth().ttPreamp === m} onPress={() => updateBooth((x) => ({ ...x, ttPreamp: m }))} compact />
                      ))}
                    </View>
                  </>
                )}
              </View>
            ),
          },
          stopKey(tr),
        ],
        initialParam: 'src',
      }}
    >
      <Step n={1}>
        <Look>{`You are looking at the back of ${src === 'A' ? 'deck A' : 'the turntable'} above the back of the mixer, with the source’s white and red RCA plugs. Seen from behind, the mixer is mirrored: channel 2 and MASTER R are on the left.`}</Look>
        <P>Every socket has a DIRECTION, a CONNECTOR, a SIGNAL (audio, data or power), a LEVEL and a number of CHANNELS — read all five before you plug in, because the shape alone never proves two things belong together.</P>
        <P>Levels differ by thousands of times, which is why a mixer has separate PHONO and LINE inputs.</P>
        <LevelLadder />
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>{find < FINDS.length ? `${FINDS[find].ask} Open IDENTIFY and pick it — the halo shows each socket on the drawing.` : 'All three found. Now open PATCH and plug deck A’s white and red plugs into CH1 LINE.'}</Do>
        {findMsg ? <Note tone={findMsg.ok ? 'try' : 'safety'}>{findMsg.text}</Note> : null}
        <P>USB, LAN and the digital coax carry DATA or DIGITAL audio. A linked-player network shares track lists and timing — it does not carry the music to the mixer, so the analog RCA pair is still needed.</P>
      </Step>
      <Step n={3}>
        <P>Open PLAY, start deck A and watch CH1 L GETS and CH1 R GETS (what channel 1’s left and right inputs get) on the readout strip. Pull the red plug: the right side of the crowd’s sound disappears, and the cable stops glowing.</P>
        <Note tone="safety">The lab keeps this quiet. On a real system, pull the channel fader (or the MASTER) down before you plug or unplug any audio cable — a half-inserted RCA plug buzzes loudly through the PA.</Note>
        <P>The green outline on the mixer’s back is the pair the CH1 INPUT selector is listening to; the other pair is dimmed.</P>
        <P>Switch SOURCE to the TURNTABLE with its switch on PHONO. Into a LINE input it is tiny and thin; into PHONO (with the selector on PHONO) it is full and even.</P>
        <Note>A line-level player plugged into PHONO is the opposite mistake: the phono stage overloads before the TRIM — turning the trim down cannot fix it.</Note>
      </Step>
      <Step n={4}>
        <Do>Find three sockets by their job, patch deck A into CH1 LINE on both sides, hear what one plug out does, then patch the raw turntable into PHONO correctly.</Do>
        <GoalChips goals={goals.slice(0, 4)} latched={latched.slice(0, 4)} />
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow="CHECK YOURSELF"
          question="A turntable’s rear switch is set to LINE (its own preamp is on). Which mixer input should it use?"
          options={['LINE — the turntable already did the phono stage', 'PHONO — turntables always go to PHONO', 'Either — the mixer sorts it out', 'MASTER OUT']}
          correct={0}
          explain="With its preamp on, the turntable sends a line-level signal that has already had its RIAA curve undone. A PHONO input would add the gain and the curve a SECOND time — loud, boomy and distorted."
          wrong={[undefined, 'Only a RAW cartridge signal (switch on PHONO) goes to a PHONO input.', 'The mixer cannot tell — the two inputs do very different things.', 'MASTER OUT is an output; inputs and outputs never connect directly like that.']}
          onCorrect={() => setCheck(true)}
        />
        <FaultCard
          title="THE RECORD SOUNDS TINY AND THIN"
          symptom="The turntable is playing into channel 1. It is very quiet, and what you can hear has no bass."
          start={() => {
            void audio.requestSound();
            setSrc('TT');
            updateBooth((x, t) => {
              let y = connect(connect(x, 'A.rcaL', null)!, 'A.rcaR', null)!;
              y = connect(connect(y, 'tt.rcaL', 'ch1.line.L')!, 'tt.rcaR', 'ch1.line.R')!;
              return { ...y, ttPreamp: 'PHONO', tt: { ...y.tt, playing: true, at: t }, ch: { ...y.ch, 1: { ...y.ch[1], input: 'LINE', fader: 0.8 } } };
            });
          }}
          fixed={(() => {
            const r = channelRoute(booth, 1);
            return booth.tt.playing && !!r.L && !!r.R && r.L.source === 'TT' && r.R.source === 'TT' && !r.tooQuiet && !r.tooHot;
          })()}
          hints={['Look at the turntable’s PHONO/LINE switch, and at which jacks its plugs are in.', 'A raw cartridge needs the phono stage’s gain and RIAA curve.', 'Either move the plugs to PHONO (and set the selector to PHONO), or switch the turntable to LINE.']}
          why="A raw cartridge signal was going into a LINE input: no phono gain (so about 36 dB too quiet) and no RIAA curve (so the bass the record holds back never came back). One phono stage — the mixer’s or the turntable’s — fixes both."
          onFixed={() => setFaultFixed(true)}
        />
        <GoalChips goals={goals.slice(4)} latched={latched.slice(4)} />
      </Step>
    </DjRack>
  );
}

const styles = StyleSheet.create({
  tray: { gap: 8 },
  trayHead: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.1 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  ladder: { borderRadius: 12, borderWidth: 1, borderColor: '#2c2c33', backgroundColor: '#0b0b0e', padding: 10, gap: 7 },
  ladderHead: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.3 },
  ladderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ladderLabel: { width: 86, color: colors.textSecondary, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 0.4 },
  ladderTrack: { flex: 1, height: 14, borderRadius: 4, backgroundColor: '#15161a', overflow: 'hidden' },
  ladderBar: { height: 14, borderRadius: 4 },
  ladderVal: { width: 56, textAlign: 'right', color: colors.textPrimary, fontFamily: fonts.mono, fontSize: 12 },
  warn: { color: '#ff8a7e', fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18 },
});

export const P03: PageDef = { title: 'Connections and signal types', short: 'CONNECT', Component: PageConnect, manualDone: true, rack: true };
