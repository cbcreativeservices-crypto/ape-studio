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
import { Line, vec } from '@shopify/react-native-skia';
import { LinearGradient as ExpoGradient } from 'expo-linear-gradient';
import { colors, fonts } from '../../../../theme/tokens';
import { fitValue } from '../../../../theme/legibility';
import { LabChip } from '../../LabShell';
import { UnderstandingCheck } from '../../tuning/components/check';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import { DBU_REF_V } from '../../calc/calcUnits';
import { Scene } from '../art/Scene';
import { MixerRear, PlayerRear, TT_REAR_JACKS, TurntableRear } from '../art/RearPanels';
import { CableRun, type Run } from '../art/cables';
import { Halo } from '../art/parts';
import { INK } from '../art/ink';
import { MIXER_REAR_JACKS, PLAYER_REAR_JACKS, type Box, type Pt } from '../geometry/boothGeometry';
import { DjRack } from '../DjRack';
import { Do, FaultCard, GoalChips, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { stopKey } from '../dock';
import { getBooth, updateBooth } from '../booth/boothStore';
import { useScreenSetup } from '../booth/setup';
import { channelRoute, connect, JACK_NAMES, LEVELS, type Booth, type JackId, type PlugId } from '../model/djModel';
import { peakCell, useBoothKit } from './shared';

const TERMS = [
  { term: 'Line level', def: 'The everyday level between audio devices — players, mixers, interfaces. Consumer gear works around −10 dBV (about 0.3 V); professional gear around +4 dBu (about 1.2 V).' },
  { term: 'Phono level', def: 'The tiny signal straight from a turntable’s cartridge — a few thousandths of a volt — and tilted by the record’s RIAA curve. It needs a PHONO input (or the turntable’s own preamp).' },
  { term: 'Mic level', def: 'A microphone’s signal: smaller still, about a thousandth of a volt for speech, so a mic input adds a lot of gain.' },
  { term: 'dBu / dBV', def: 'Voltage levels for analog connections. 0 dBu is 0.775 V; 0 dBV is 1 V. They describe the cable’s voltage, not loudness in the room (that is dBA) and not a digital level (that is dBFS).' },
  { term: 'Balanced (mono)', def: 'One channel carried on three conductors (XLR, or a TRS jack used this way): the signal plus a flipped copy, so noise cancels. A stereo feed needs TWO balanced cables, left and right.' },
  { term: 'Stereo on one jack', def: 'A headphone TRS jack carries left (tip) and right (ring) on one plug. Same shape as a balanced TRS — different job. The connector shape alone never proves two things are compatible.' },
  { term: 'RIAA curve', def: 'Records are cut with the bass turned down and the treble turned up; a phono input undoes it exactly. Without it, a record sounds thin and bright.' },
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

type Sock = { id: string; label: string; blurb: string; box: (src: Source) => Box | null };
const ring = (p: Pt, r: number): Box => ({ x: p.x - r, y: p.y - r, w: r * 2, h: r * 2 });
const SOCKETS: Sock[] = [
  { id: 'out', label: 'AUDIO OUT', blurb: 'An OUTPUT. Analog audio at line level, stereo on a pair of RCA sockets: white is left, red is right.', box: (s) => (s === 'A' ? { x: 56, y: 42, w: 52, h: 28 } : { x: 80, y: 32, w: 52, h: 28 }) },
  { id: 'digital', label: 'DIGITAL OUT', blurb: 'An OUTPUT of DIGITAL audio (stereo in one coax cable, orange ring). It goes to a digital input — never into an analog LINE input.', box: (s) => (s === 'A' ? ring({ x: PLAYER_REAR_JACKS.digital.x, y: PLAYER_REAR_JACKS.digital.y }, 10) : null) },
  { id: 'lan', label: 'LINK (LAN)', blurb: 'Network DATA both ways. A linked-player network shares track lists and timing — it carries NO audio to the mixer, so the RCA pair is still needed.', box: (s) => (s === 'A' ? { x: PLAYER_REAR_JACKS.lan.x - 11, y: PLAYER_REAR_JACKS.lan.y - 10, w: 22, h: 20 } : null) },
  { id: 'usb', label: 'USB', blurb: 'DATA to and from a computer. It can carry control (MIDI-style or HID messages), files and, on some devices, audio — it depends on the device and its software.', box: (s) => (s === 'A' ? { x: PLAYER_REAR_JACKS.usb.x - 9, y: PLAYER_REAR_JACKS.usb.y - 9, w: 18, h: 18 } : null) },
  { id: 'ac', label: 'AC IN', blurb: 'MAINS POWER in (the IEC inlet). Not a signal at all — keep power cords apart from audio cables where you can.', box: (s) => (s === 'A' ? { x: PLAYER_REAR_JACKS.ac.x - 15, y: PLAYER_REAR_JACKS.ac.y - 11, w: 30, h: 22 } : { x: 10 + TT_REAR_JACKS.ac.x - 15, y: TT_REAR_JACKS.ac.y - 3, w: 30, h: 22 }) },
  { id: 'preamp', label: 'PHONO/LINE SWITCH', blurb: 'On a turntable with its own preamp: PHONO sends the raw cartridge signal (it needs a PHONO input); LINE switches the preamp on (it needs a LINE input). Never both, never neither.', box: (s) => (s === 'TT' ? { x: 10 + TT_REAR_JACKS.preamp.x - 14, y: TT_REAR_JACKS.preamp.y - 4, w: 28, h: 22 } : null) },
  { id: 'line', label: 'CH1 LINE IN', blurb: 'An INPUT at line level, stereo on an RCA pair. Players, interfaces, a turntable with its preamp ON.', box: () => ({ x: mixJack('ch1.line.L').x - 9, y: mixJack('ch1.line.L').y - 9, w: 18, h: 42 }) },
  { id: 'phono', label: 'CH1 PHONO IN', blurb: 'An INPUT for a raw turntable cartridge: it adds about 36 dB of gain and undoes the record’s RIAA curve. A line-level source here overloads it.', box: () => ({ x: mixJack('ch1.phono.L').x - 9, y: mixJack('ch1.phono.L').y - 9, w: 18, h: 42 }) },
  { id: 'gnd', label: 'GND POST', blurb: 'Where a turntable’s thin ground wire goes (a SIGNAL ground, against hum). It is not the mains earth, and nothing replaces that.', box: () => ring(mixJack('gnd'), 9) },
  { id: 'master', label: 'MASTER OUT (XLR)', blurb: 'OUTPUTS, balanced, line level: one XLR per side, left and right. Each is a MONO balanced channel — a stereo feed is two cables.', box: () => ({ x: mixJack('master.L').x - 14, y: mixJack('master.L').y - 14, w: mixJack('master.R').x - mixJack('master.L').x + 28, h: 28 }) },
  { id: 'booth', label: 'BOOTH OUT (TRS)', blurb: 'OUTPUTS, balanced, line level, on 6.35 mm TRS jacks — here each TRS is ONE mono channel (L or R). The same plug shape as stereo headphones, a different job.', box: () => ({ x: mixJack('booth.L').x - 10, y: mixJack('booth.L').y - 10, w: 20, h: mixJack('booth.R').y - mixJack('booth.L').y + 20 }) },
];

/* ── the level ladder (well figure) ───────────────────────────────────── */

const dbu = (v: number) => 20 * Math.log10(v / DBU_REF_V);
const dbv = (v: number) => 20 * Math.log10(v);

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
      {rows.map((r) => (
        <Text key={`n${r.label}`} style={styles.ladderNote}>{`${r.label}: ${dbu(r.volts).toFixed(0)} dBu · ${dbv(r.volts).toFixed(0)} dBV — ${r.note}.`}</Text>
      ))}
    </View>
  );
}

/* ── the screen ───────────────────────────────────────────────────────── */

const JACK_CHOICES: (JackId | null)[] = ['ch1.line.L', 'ch1.line.R', 'ch1.phono.L', 'ch1.phono.R', null];

function PatchRca({ src }: { src: Source }) {
  const b = getBooth();
  const plugs: PlugId[] = src === 'A' ? ['A.rcaL', 'A.rcaR'] : ['tt.rcaL', 'tt.rcaR'];
  return (
    <View style={styles.tray}>
      {plugs.map((p) => (
        <View key={p} style={styles.tray}>
          <Text style={styles.trayHead}>{`${p.endsWith('L') ? 'WHITE (LEFT)' : 'RED (RIGHT)'} PLUG → ${b.plugs[p] ? JACK_NAMES[b.plugs[p]!] : 'not plugged in'}`}</Text>
          <View style={styles.row}>
            {JACK_CHOICES.map((j) => (
              <LabChip key={j ?? 'out'} label={j ? JACK_NAMES[j].replace('CH1 ', '') : 'UNPLUG'} selected={b.plugs[p] === j} onPress={() => updateBooth((x) => connect(x, p, j))} compact />
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
  const [identSeen, setIdentSeen] = useState<Set<string>>(() => new Set(['out']));
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
  const goals = [
    { label: 'Identify six sockets', hit: identSeen.size >= 6 },
    { label: 'Deck A into CH1 LINE, both sides', hit: aBoth },
    { label: 'Hear one side go missing', hit: oneSide },
    { label: 'Raw turntable into PHONO', hit: ttOk },
    { label: 'Fix the thin, quiet record', hit: faultFixed },
    { label: 'Pass the check', hit: check },
  ];
  const latched = useVisitGoals(ctx, goals);
  const sock = SOCKETS.find((s) => s.id === ident)!;
  const box = sock.box(src);
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
          { id: 'line', text: 'CH1 LINE', at: { x: mixJack('ch1.line.R').x + 7, y: mixJack('ch1.line.R').y + 6 }, dx: 18, dy: 30 },
          { id: 'phono', text: 'CH1 PHONO', at: { x: mixJack('ch1.phono.R').x - 6, y: mixJack('ch1.phono.R').y + 6 }, dx: -30, dy: 30 },
          ...(box ? [{ id: 'id', text: sock.label, at: { x: box.x + box.w / 2, y: box.y }, dx: 0, dy: -16, tone: 'blue' as const }] : []),
        ]}
      >
        {src === 'A' ? <PlayerRear x={0} y={SRC_Y} on label="DECK A (REAR)" /> : <TurntableRear x={10} y={SRC_Y} on preamp={booth.ttPreamp} />}
        <MixerRear x={MIX.x} y={MIX.y} on />
        {src === 'TT' ? <Line p1={vec(10 + TT_REAR_JACKS.gnd.x, TT_REAR_JACKS.gnd.y)} p2={vec(mixJack('gnd').x, mixJack('gnd').y)} color="#2e7d3a" strokeWidth={1.2} /> : null}
        {runs.map((r) => (
          <CableRun key={r.id} r={r} />
        ))}
        {box ? <Halo b={box} /> : null}
      </Scene>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [src, booth, motion, box, sock.label, liveL, liveR],
  );
  return (
    <DjRack
      spec={{
        render: stage,
        bezel: [
          { k: 'CH1 INPUT', v: booth.ch[1].input, tint: colors.amber },
          { k: 'LEFT ←', v: sideWord(route.L), tint: route.L ? colors.green : colors.textSub },
          { k: 'RIGHT ←', v: sideWord(route.R), tint: route.R ? colors.green : colors.textSub },
          peakCell('CH1 PEAK', peak == null ? null : peak <= -59.9 ? -Infinity : peak),
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
            valueLabel: sock.label.split(' ')[0],
            valueA11y: sock.label,
            options: SOCKETS.filter((s) => s.box(src)).map((s) => ({ id: s.id, label: s.label, blurb: s.blurb })),
            selectedId: ident,
            sticky: true,
            onSelect: (id) => {
              setIdent(id);
              setIdentSeen((p) => new Set(p).add(id));
            },
          },
          {
            kind: 'group',
            id: 'decks',
            label: 'PLAY',
            valueLabel: src === 'A' ? (booth.decks.A.playing ? 'A ▶' : '—') : booth.tt.playing ? 'TT ▶' : '—',
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
        <P>Every socket has a DIRECTION (out or in), a CONNECTOR, a SIGNAL (analog audio, digital audio, data or power), a LEVEL and a number of CHANNELS. Read all five before you plug in — the shape alone never proves two things belong together.</P>
        <P>Levels differ by thousands of times: a cartridge gives a few thousandths of a volt; line level is around a third of a volt to a volt. That is why a mixer has separate PHONO and LINE inputs.</P>
        <LevelLadder />
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Open IDENTIFY and step through the sockets — the halo shows each one on the drawing. Then open PATCH and plug deck A’s white and red plugs into CH1 LINE.</Do>
        <P>USB, LAN and the digital coax carry DATA or DIGITAL audio. A linked-player network shares track lists and timing — it does not carry the music to the mixer, so the analog RCA pair is still needed.</P>
      </Step>
      <Step n={3}>
        <P>Open PLAY, start deck A and watch LEFT ← and RIGHT ← on the bezel. Pull the red plug: the right side of the crowd’s sound disappears, and the cable stops glowing.</P>
        <P>Switch SOURCE to the TURNTABLE with its switch on PHONO. Into a LINE input it is tiny and thin; into PHONO (with the selector on PHONO) it is full and even.</P>
        <Note>A line-level player plugged into PHONO is the opposite mistake: the phono stage overloads before the TRIM — turning the trim down cannot fix it.</Note>
      </Step>
      <Step n={4}>
        <Do>Identify six sockets, patch deck A into CH1 LINE on both sides, hear what one plug out does, then patch the raw turntable into PHONO correctly.</Do>
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
  ladderNote: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17 },
});

export const P03: PageDef = { title: 'Connections and signal types', short: 'CONNECT', Component: PageConnect, manualDone: true, rack: true };
