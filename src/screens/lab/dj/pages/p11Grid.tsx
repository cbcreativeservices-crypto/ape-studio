/**
 * Screen 11 — Beatgrids, sync and quantize (research DJ17): track analysis,
 * first-beat placement, wrong grids, half/double BPM, synchronization and
 * quantized actions. Two waveforms (the real audio) carry their ANALYSED
 * grids: when a grid is wrong you can SEE the kicks miss the lines — and SYNC,
 * which trusts the grid, makes the real beats flam. The learner moves the
 * grid and fixes the BPM; SYNC then locks for real. The fault: loops twice as
 * long as asked (a half-BPM reading).
 */
import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Group } from '@shopify/react-native-skia';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { colors, fonts } from '../../../../theme/tokens';
import { LabChip } from '../../LabShell';
import { UnderstandingCheck } from '../../tuning/components/check';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import { BoothStage } from '../art/BoothStage';
import { WaveLane } from '../art/plots';
import { BOOTH_LAYOUT, PLAYER } from '../geometry/boothGeometry';
import { DjRack } from '../DjRack';
import { Do, FaultCard, GoalChips, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { BoothTray, stopKey } from '../dock';
import { boothNow, getBooth, updateBooth } from '../booth/boothStore';
import { cueAtBar, useScreenSetup } from '../booth/setup';
import { TRACKS } from '../engine/djMusic';
import { analysedGrid, gridCorrect, loopIn, setGrid, sync, trueBeat } from '../model/djDeck';
import { phaseOffset, playedBpm } from '../model/djTime';
import type { GridMode } from '../model/djModel';
import { useBoothKit } from './shared';

const TERMS = [
  { term: 'Analysis', def: 'The software (or player) listens to a track ahead of time to estimate its BPM, where its beats are and where beat 1 is. It is usually right — not always.' },
  { term: 'Beatgrid', def: 'The software’s map of the beats: a line on every beat, a bold one on every bar. It is an interpretation of the music, and you can edit it.' },
  { term: 'First beat', def: 'Where the grid thinks bar 1 beat 1 is. If it is off, every bar line, loop and sync is off by the same amount.' },
  { term: 'Half / double BPM', def: 'An analyser can read a 126 BPM track as 63 (or 252). The beat lines then fall on every other beat, and “4-beat” loops come out 8 real beats long.' },
  { term: 'SYNC', def: 'Matches one deck’s tempo and beat phase to the other, using their GRIDS. With a wrong grid, sync faithfully lines up the wrong thing.' },
  { term: 'Quantize', def: 'Snaps your actions — cues, loops, jumps — to the nearest beat of the grid, so they land in time even if your press is a little early or late.' },
] as const;

const SCEN: { id: GridMode; label: string; blurb: string }[] = [
  { id: 'TRUE', label: 'GRID RIGHT', blurb: 'The analysis got it right: every line on a kick.' },
  { id: 'LATE_HALF', label: 'FIRST BEAT LATE', blurb: 'The first beat was placed half a beat late: every line sits on an off-beat hat, not the kick.' },
  { id: 'HALF_BPM', label: 'HALF BPM', blurb: 'The analysis read 63 BPM for a 126 BPM track: lines on every other beat.' },
];

function GridTray({ onScenario }: { onScenario: (g: GridMode) => void }) {
  const b = getBooth();
  const d = b.decks.B;
  const g = analysedGrid(d);
  const edit = (patch: Parameters<typeof setGrid>[3]) => updateBooth((x, t) => setGrid(x, t, 'B', patch));
  return (
    <View style={styles.tray}>
      <Text style={styles.head}>DECK B’S ANALYSIS (start a scenario)</Text>
      <View style={styles.row}>
        {SCEN.map((s) => (
          <LabChip key={s.id} label={s.label} selected={d.gridMode === s.id && d.gridShiftBeats === 0 && d.bpmFix === 1} onPress={() => onScenario(s.id)} compact />
        ))}
      </View>
      <Text style={styles.head}>{`EDIT THE GRID · ${g ? g.bpm.toFixed(1) : '—'} BPM · ${gridCorrect(d) ? 'ON THE BEAT' : 'NOT YET'}`}</Text>
      <View style={styles.row}>
        <LabChip label="◀ ½ BEAT" selected={false} onPress={() => edit({ gridShiftBeats: d.gridShiftBeats - 0.5 })} compact />
        <LabChip label="◀ ¼" selected={false} onPress={() => edit({ gridShiftBeats: d.gridShiftBeats - 0.25 })} compact />
        <LabChip label="¼ ▶" selected={false} onPress={() => edit({ gridShiftBeats: d.gridShiftBeats + 0.25 })} compact />
        <LabChip label="½ BEAT ▶" selected={false} onPress={() => edit({ gridShiftBeats: d.gridShiftBeats + 0.5 })} compact />
      </View>
      <View style={styles.row}>
        <LabChip label="BPM ×2" selected={d.bpmFix === 2} onPress={() => edit({ bpmFix: d.bpmFix === 0.5 ? 1 : 2 })} compact />
        <LabChip label="BPM ÷2" selected={d.bpmFix === 0.5} onPress={() => edit({ bpmFix: d.bpmFix === 2 ? 1 : 0.5 })} compact />
        <LabChip label="LOOP 4 BEATS" selected={!!d.loop} onPress={() => updateBooth((x, t) => (x.decks.B.loop ? { ...x, decks: { ...x.decks, B: { ...x.decks.B, loop: null } } } : loopIn(x, t, 'B', 4)))} compact />
      </View>
      <Text style={styles.note}>Watch the waveform: a correct grid puts its bold bar lines on the strongest kicks, and every thin line on a kick.</Text>
    </View>
  );
}

function PageGrid({ ctx }: { ctx: PageCtx }) {
  const { booth, audio, tr, motion } = useBoothKit();
  useScreenSetup((b) => {
    let x = cueAtBar(b, 'A', 'nightFerry', 17);
    x = cueAtBar(x, 'B', 'glassHarbour', 17);
    x = { ...x, decks: { A: { ...x.decks.A, pitch: 0 }, B: { ...x.decks.B, pitch: 0, gridMode: 'LATE_HALF', gridShiftBeats: 0, bpmFix: 1, quantize: true } } };
    return { ...x, ch: { 1: { ...x.ch[1], fader: 0.85, xf: 'THRU', cue: false }, 2: { ...x.ch[2], fader: 0.85, xf: 'THRU', cue: false } }, mixer: { ...x.mixer, splitCue: false }, perspective: 'CROWD' };
  });
  const [, setTick] = useState(0);
  const bump = (v: number) => setTick(v);
  useAnimatedReaction(() => Math.floor(motion.clock.value * 4), (n, p) => {
    if (n !== p) runOnJS(bump)(n);
  });
  const story = useRef({ wrongSync: false, fixed: false, lockSync: false, halfStarted: false });
  const [syncLit, setSyncLit] = useState(false);
  const [check, setCheck] = useState(false);
  const [faultFixed, setFaultFixed] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const A = booth.decks.A;
  const B = booth.decks.B;
  const both = A.playing && B.playing;
  const t = boothNow();
  const ba = trueBeat(booth, 'A', t);
  const bb = trueBeat(booth, 'B', t);
  const off = ba != null && bb != null ? phaseOffset(bb, ba) : 0;
  const gB = analysedGrid(B);
  const bpmA = A.track ? playedBpm(TRACKS[A.track].bpm, A.pitch) : 0;
  const bpmB = B.track ? playedBpm(TRACKS[B.track].bpm, B.pitch) : 0;
  if (B.gridMode === 'LATE_HALF' && gridCorrect(B)) story.current.fixed = true;
  const pressSync = () => {
    const b0 = getBooth();
    const next = sync(b0, boothNow(), 'B');
    if (!next) {
      setMsg('SYNC could not find a tempo inside the ±8 % range.');
      return;
    }
    setMsg(null);
    updateBooth(() => next);
    setSyncLit(true);
    const after = trueBeat(next, 'B', boothNow());
    const aNow = trueBeat(next, 'A', boothNow());
    if (after != null && aNow != null && next.decks.A.playing && next.decks.B.playing) {
      const o = Math.abs(phaseOffset(after, aNow));
      if (!gridCorrect(next.decks.B) && o > 0.2) story.current.wrongSync = true;
      if (gridCorrect(next.decks.B) && o < 1 / 16) story.current.lockSync = true;
    }
  };
  const goals = [
    { label: 'SYNC on a wrong grid — hear the flam', hit: story.current.wrongSync },
    { label: 'Put the first beat right', hit: story.current.fixed },
    { label: 'SYNC again — locked', hit: story.current.lockSync },
    { label: 'Fix a half-BPM reading', hit: faultFixed },
    { label: 'Pass the check', hit: check },
  ];
  const latched = useVisitGoals(ctx, goals);
  const lanesH = (h: number) => Math.round(Math.min(180, h * 0.58));
  return (
    <DjRack
      spec={{
        render: (w, h) => (
          <BoothStage
            w={w}
            h={h}
            booth={booth}
            motion={motion}
            spec={{
              // starts just under deck B's own screen (the lanes above ARE its screen)
              view: { x: BOOTH_LAYOUT.B.x - 8, y: 142, w: PLAYER_W_HALF + 16, h: 134 },
              fit: (W, H) => ({ x: 0, y: lanesH(H), w: W, h: H - lanesH(H) }),
              highlight: { B: ['sync', 'quantize'] },
              syncLit: { B: syncLit },
              callouts: [
                { id: 'sy', text: 'SYNC', at: { x: BOOTH_LAYOUT.B.x + PLAYER.sync.x, y: PLAYER.sync.y + 6 }, dx: -30, dy: 0 },
                { id: 'qz', text: 'QUANTIZE', at: { x: BOOTH_LAYOUT.B.x + PLAYER.quantize.x, y: PLAYER.quantize.y + 5 }, dx: -30, dy: -6 },
              ],
              screenOverlay: (W, H) => {
                const L = lanesH(H);
                const lh = (L - 12) / 2;
                return (
                  <Group>
                    <WaveLane b={{ x: 6, y: 4, w: W - 12, h: lh }} d={A} label={`A · GRID RIGHT · ${bpmA.toFixed(1)}`} />
                    <WaveLane b={{ x: 6, y: 8 + lh, w: W - 12, h: lh }} d={B} marks label={`B · GRID ${gB ? gB.bpm.toFixed(1) : '—'} BPM${gridCorrect(B) ? ' · RIGHT' : ' · CHECK IT'}`} />
                  </Group>
                );
              },
              a11y: `Deck A's and deck B's waveforms with their beat grids, over deck B's SYNC and QUANTIZE buttons. Deck B's grid is ${gridCorrect(B) ? 'correct' : 'wrong'}.`,
            }}
          />
        ),
        bezel: [
          { k: 'B GRID', v: gB ? gB.bpm.toFixed(1) : '—', tint: gridCorrect(B) ? colors.green : colors.amber },
          { k: 'FIRST BEAT', v: gridCorrect(B) ? 'ON THE KICK' : 'OFF', tint: gridCorrect(B) ? colors.green : '#ff8a7e', flex: 1.2 },
          { k: 'REAL BEATS', v: both ? `${off >= 0 ? '+' : '−'}${Math.abs(off).toFixed(2)} beat` : '—', tint: both && Math.abs(off) < 1 / 16 ? colors.green : colors.amber },
          { k: 'B BPM', v: bpmB.toFixed(1), tint: colors.textPrimary },
        ],
        params: [
          {
            kind: 'group',
            id: 'grid',
            label: 'GRID',
            valueLabel: gridCorrect(B) ? 'RIGHT' : 'CHECK',
            render: () => (
              <GridTray
                onScenario={(gm) => {
                  setSyncLit(false);
                  if (gm === 'HALF_BPM') story.current.halfStarted = true;
                  updateBooth((x, tt) => setGrid({ ...x, decks: { ...x.decks, B: { ...x.decks.B, loop: null, pitch: 0 } } }, tt, 'B', { gridMode: gm, gridShiftBeats: 0, bpmFix: 1 }));
                }}
              />
            ),
          },
          { kind: 'action', id: 'sync', label: 'SYNC B', onPress: pressSync, tint: '#6fa8ff' },
          { kind: 'toggle', id: 'quant', label: 'QUANTIZE', value: B.quantize, onToggle: () => updateBooth((x, tt) => setGrid(x, tt, 'B', { quantize: !x.decks.B.quantize })) },
          { kind: 'group', id: 'decks', label: 'DECKS', valueLabel: (['A', 'B'] as const).filter((d) => booth.decks[d].playing).join('+') || '—', render: () => <BoothTray booth={getBooth()} tr={tr} /> },
          stopKey(tr),
        ],
        initialParam: 'grid',
      }}
    >
      <Step n={1}>
        <P>Before a track is played, the software analyses it: its BPM, where its beats are, where bar 1 starts. That BEATGRID drives SYNC, QUANTIZE, loops and beat jumps. It is usually right — and when it is wrong, everything built on it is wrong in the same way.</P>
        <P>Deck B’s grid here starts half a beat LATE. Its lines sit on the off-beat hats, not the kicks. Look at deck B’s waveform: the tall kick peaks fall BETWEEN the lines.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Open DECKS and play both. Press SYNC B and listen as the CROWD: the tempos match, yet every kick flams — sync lined up the GRIDS, and B’s grid was wrong.</Do>
      </Step>
      <Step n={3}>
        <P>Open GRID and move B’s grid until its lines sit on the kicks (◀ ½ BEAT). The readout strip says ON THE KICK when it is right. Press SYNC B again: now the real beats lock.</P>
        <Note>Different programs and players edit grids differently, and some sync by tempo only. The idea is the same everywhere: trust your ears first, then the grid.</Note>
      </Step>
      <Step n={4}>
        <Do>Sync on the wrong grid and hear it, put the first beat right, then sync again until it locks.</Do>
        <GoalChips goals={goals.slice(0, 3)} latched={latched.slice(0, 3)} />
        {msg ? <Text style={styles.warn}>{msg}</Text> : null}
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow="CHECK YOURSELF"
          question="After pressing SYNC, both decks show the same BPM but the kicks flam half a beat apart. What is the most likely cause?"
          options={['One deck’s grid has the wrong first beat', 'The tempo fader is broken', 'SYNC needs pressing three times', 'The tracks are in different keys']}
          correct={0}
          explain="SYNC matches tempo and lines up the GRIDS. If one grid starts half a beat late, sync puts that deck’s real beats half a beat off — a steady flam. Fix the grid, then sync again."
          wrong={[undefined, 'The tempos match exactly — the fader did its job.', 'Pressing again lines up the same wrong grid again.', 'Key affects how the notes fit, not when the kicks land.']}
          onCorrect={() => setCheck(true)}
        />
        <FaultCard
          title="LOOPS TWICE AS LONG"
          symptom="You set a 4-beat loop on deck B, but it loops 8 beats, and its BPM reads about half what you count."
          start={() => {
            void audio.requestSound();
            story.current.halfStarted = true;
            updateBooth((x, tt) => {
              let y = setGrid({ ...x, decks: { ...x.decks, B: { ...x.decks.B, loop: null, pitch: 0, playing: true, at: tt } } }, tt, 'B', { gridMode: 'HALF_BPM', gridShiftBeats: 0, bpmFix: 1 });
              y = loopIn(y, tt, 'B', 4);
              return y;
            });
          }}
          fixed={story.current.halfStarted && B.gridMode === 'HALF_BPM' && gridCorrect(B)}
          hints={['Count the kicks between the grid lines on deck B.', 'The analysis read 63 BPM for a 126 BPM track, so every “beat” it counts is two real beats.', 'GRID → BPM ×2.']}
          why="The analysis had read half the real tempo, so the grid had a line on every other kick and a ‘4-beat’ loop was 8 real beats. Doubling the BPM put a line on every kick; loops, jumps and sync now count real beats."
          onFixed={() => setFaultFixed(true)}
        />
        <GoalChips goals={goals.slice(3)} latched={latched.slice(3)} />
      </Step>
    </DjRack>
  );
}

const PLAYER_W_HALF = 320;

const styles = StyleSheet.create({
  tray: { gap: 8 },
  head: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.2 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  note: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18 },
  warn: { color: '#ff8a7e', fontFamily: fonts.barlowMedium, fontSize: 13.5 },
});

export const P11: PageDef = { title: 'Beatgrids, sync and quantize', short: 'GRID', Component: PageGrid, manualDone: true, rack: true };
