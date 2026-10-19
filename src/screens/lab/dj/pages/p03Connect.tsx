/**
 * Screen 3 — Connections and signal types (research DJ03 + DJ04): cable
 * identification; inputs versus outputs; stereo versus balanced mono; mic,
 * phono and line levels; audio versus USB, MIDI and network data. The stage
 * is the back of the source (a player or a turntable) over the back of the
 * mixer, with the source's RCA pair in its own two lanes. The fault: a thin,
 * quiet record (a raw cartridge into a LINE input).
 */
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Line, RoundedRect, vec } from '@shopify/react-native-skia';
import { LinearGradient as ExpoGradient } from 'expo-linear-gradient';
import { colors, fonts } from '../../../../theme/tokens';
import { fitValue } from '../../../../theme/legibility';
import { LabChip } from '../../LabShell';
import { UnderstandingCheck } from '../../tuning/components/check';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import { Scene } from '../art/Scene';
import { MixerRear, PlayerRear, TT_REAR_JACKS, TurntableRear } from '../art/RearPanels';
import { CableRun, type Run } from '../art/cables';
import { Halo } from '../art/parts';
import { INK } from '../art/ink';
import { MIXER_REAR_JACKS, PLAYER_REAR_JACKS, type Box, type Pt } from '../geometry/boothGeometry';
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

/* ── the rear stack geometry (mm) ─────────────────────────────────────── */

const SRC_Y = 0;
const MIX = { x: 25, y: 196 };
const FRAME: Box = { x: -8, y: -8, w: 336, h: 316 };
const mixJack = (j: keyof typeof MIXER_REAR_JACKS): Pt => ({ x: MIX.x + MIXER_REAR_JACKS[j].x, y: MIX.y + MIXER_REAR_JACKS[j].y });

type Source = 'A' | 'TT';
const srcJack = (src: Source, side: 'L' | 'R'): Pt =>
  src === 'A'
    ? { x: PLAYER_REAR_JACKS[side === 'L' ? 'outL' : 'outR'].x, y: SRC_Y + PLAYER_REAR_JACKS[side === 'L' ? 'outL' : 'outR'].y }
    : { x: 10 + TT_REAR_JACKS[side === 'L' ? 'outL' : 'outR'].x, y: SRC_Y + TT_REAR_JACKS[side === 'L' ? 'outL' : 'outR'].y };

function runFor(b: Booth, src: Source, side: 'L' | 'R', live: boolean): Run {
  const plug: PlugId = src === 'A' ? (side === 'L' ? 'A.rcaL' : 'A.rcaR') : side === 'L' ? 'tt.rcaL' : 'tt.rcaR';
  const a = srcJack(src, side);
  const to = b.plugs[plug];
  const lane = side === 'L' ? 142 : 156;
  const colour = side === 'L' ? INK.rcaWhite : INK.rcaRed;
  if (!to || !to.startsWith('ch')) {
    return { id: plug, kind: 'rca', colour, pts: [[a.x, a.y], [a.x, a.y + 36], [a.x + (side === 'L' ? -12 : 12), a.y + 62]], plugged: false, live: false, label: side, dashed: side === 'R' };
  }
  const d = mixJack(to as keyof typeof MIXER_REAR_JACKS);
  return { id: plug, kind: 'rca', colour, pts: [[a.x, a.y], [a.x, lane], [d.x, lane], [d.x, d.y]], plugged: true, live, label: side, dashed: side === 'R' };
}

/* ── what each socket is (the IDENTIFY tray) ──────────────────────────── */

type Sock = { id: string; label: string; short: string; blurb: string; box: (src: Source) => Box | null };
const ring = (p: Pt, r: number): Box => ({ x: p.x - r, y: p.y - r, w: r * 2, h: r * 2 });
const SOCKETS: Sock[] = [
  { id: 'out', label: 'AUDIO OUT', short: 'OUT', blurb: 'An OUTPUT. Analog audio at line level, stereo on a pair of RCA sockets: white is left, red is right.', box: (s) => (s === 'A' ? { x: 56, y: 42, w: 52, h: 28 } : { x: 80, y: 32, w: 52, h: 28 }) },
  { id: 'digital', label: 'DIGITAL OUT', short: 'DIGITAL', blurb: 'An OUTPUT of DIGITAL audio (stereo in one coax cable, orange ring). It goes to a digital input — never into an analog LINE input.', box: (s) => (s === 'A' ? ring({ x: PLAYER_REAR_JACKS.digital.x, y: PLAYER_REAR_JACKS.digital.y }, 10) : null) },
  { id: 'lan', label: 'LINK (LAN)', short: 'LAN', blurb: 'Network DATA both ways. A linked-player network shares track lists and timing — it carries NO audio to the mixer, so the RCA pair is still needed.', box: (s) => (s === 'A' ? { x: PLAYER_REAR_JACKS.lan.x - 11, y: PLAYER_REAR_JACKS.lan.y - 10, w: 22, h: 20 } : null) },
  { id: 'usb', label: 'USB', short: 'USB', blurb: 'DATA to and from a computer. It can carry control messages (knob and button moves), files and, on some devices, audio — it depends on the device and its software.', box: (s) => (s === 'A' ? { x: PLAYER_REAR_JACKS.usb.x - 9, y: PLAYER_REAR_JACKS.usb.y - 9, w: 18, h: 18 } : null) },
  { id: 'ac', label: 'AC IN', short: 'AC', blurb: 'MAINS POWER in (the IEC inlet). Not a signal at all — keep power cords apart from audio cables where you can.', box: (s) => (s === 'A' ? { x: PLAYER_REAR_JACKS.ac.x - 15, y: PLAYER_REAR_JACKS.ac.y - 11, w: 30, h: 22 } : { x: 10 + TT_REAR_JACKS.ac.x - 15, y: TT_REAR_JACKS.ac.y - 3, w: 30, h: 22 }) },
  { id: 'preamp', label: 'PHONO/LINE SWITCH', short: 'SWITCH', blurb: 'On a turntable with its own preamp: PHONO sends the raw cartridge signal (it needs a PHONO input); LINE switches the preamp on (it needs a LINE input). Never both, never neither.', box: (s) => (s === 'TT' ? { x: 10 + TT_REAR_JACKS.preamp.x - 14, y: TT_REAR_JACKS.preamp.y - 4, w: 28, h: 22 } : null) },
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
  const pairBox = (k: 'line' | 'phono'): Box => ({ x: mixJack(`ch1.${k}.L`).x - 9, y: mixJack(`ch1.${k}.L`).y - 9, w: 18, h: 42 });
  const selPair: 'line' | 'phono' | null = booth.ch[1].input === 'LINE' ? 'line' : booth.ch[1].input === 'PHONO' ? 'phono' : null;
  const peak = last ? Math.max(...Array.from(last.raw.ch1)) : null;
  const sideWord = (s: typeof route.L) => (s ? `${s.source === 'TT' ? 'TT' : 'DECK ' + s.source} ${s.side}` : '—');
  const stage = useMemo(
    () => (w: number, h: number) => (
      <Scene
        w={w}
        h={h}
        frame={FRAME}
        motion={motion}
        a11y={`The back of ${src === 'A' ? 'deck A' : 'the turntable'} above the back of the mixer, with the source's white and red RCA plugs. Channel 1 left hears ${sideWord(route.L)}, right hears ${sideWord(route.R)}; input selector ${booth.ch[1].input}.`}
        callouts={[
          { id: 'line', text: selPair === 'line' ? 'SELECTOR → LINE' : 'CH1 LINE', at: { x: mixJack('ch1.line.R').x + 7, y: mixJack('ch1.line.R').y + 6 }, dx: 18, dy: 30, tone: selPair === 'line' ? ('green' as const) : undefined },
          { id: 'phono', text: selPair === 'phono' ? 'SELECTOR → PHONO' : 'CH1 PHONO', at: { x: mixJack('ch1.phono.R').x - 6, y: mixJack('ch1.phono.R').y + 6 }, dx: -30, dy: 30, tone: selPair === 'phono' ? ('green' as const) : undefined },
          ...(box ? [{ id: 'id', text: sock.label, at: { x: box.x + box.w / 2, y: box.y }, dx: 0, dy: -16, tone: 'blue' as const }] : []),
        ]}
      >
        {src === 'A' ? <PlayerRear x={0} y={SRC_Y} on label="DECK A (REAR)" /> : <TurntableRear x={10} y={SRC_Y} on preamp={booth.ttPreamp} />}
        <MixerRear x={MIX.x} y={MIX.y} on />
        {src === 'TT' ? <Line p1={vec(10 + TT_REAR_JACKS.gnd.x, TT_REAR_JACKS.gnd.y)} p2={vec(mixJack('gnd').x, mixJack('gnd').y)} color="#2e7d3a" strokeWidth={1.2} /> : null}
        {(['line', 'phono'] as const).map((k) => {
          const pb = pairBox(k);
          return selPair === k ? null : <RoundedRect key={k} x={pb.x} y={pb.y} width={pb.w} height={pb.h} r={4} color="rgba(6,6,8,0.55)" />;
        })}
        {runs.map((r) => (
          <CableRun key={r.id} r={r} />
        ))}
        {selPair ? <Halo b={pairBox(selPair)} tone="green" /> : null}
        {box ? <Halo b={box} /> : null}
      </Scene>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [src, booth, motion, box, sock.label, liveL, liveR, selPair],
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
