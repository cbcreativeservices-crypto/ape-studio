/**
 * Screen 11 — Beatgrids, sync and quantize (research DJ17): track analysis,
 * first-beat placement, wrong grids, half/double BPM, synchronization and
 * quantized actions. Two waveforms (the real audio) carry their ANALYSED
 * grids: when a grid is wrong you can SEE the kicks miss the lines — and SYNC,
 * which trusts the grid, puts B's kicks between A's. The learner moves the
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
import { Do, FaultCard, GoalChips, Look, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { boothKey, stopKey } from '../dock';
import { boothNow, getBooth, updateBooth } from '../booth/boothStore';
import { cueAtBar, useScreenSetup } from '../booth/setup';
import { TRACKS } from '../engine/djMusic';
import { analysedGrid, gridCorrect, loopIn, setGrid, sync, trueBeat } from '../model/djDeck';
import { beatAt, phaseOffset, playedBpm } from '../model/djTime';
import { deckPos, type DeckState, type GridMode } from '../model/djModel';
import { useBoothKit } from './shared';
import { halfBpmFaultFixed, loopRealBeats } from './gridFault';

const TERMS = [
  { term: 'Beatgrid', def: 'The software’s map of the beats, made when it analyses a track ahead of time: a thin line on every beat and a bold bar line on the “one” — where a crash, a chord change or a new part lands, and straight after a drum fill. It is an interpretation, and you can edit it.' },
  { term: 'First beat', def: 'Where the grid thinks bar 1 beat 1 is. If it is off, every bar line, loop and sync is off by the same amount.' },
  { term: 'Half / double BPM', def: 'An analyzer can read a tempo at half or double: drum & bass at 174 read as 87, hip-hop at 85 read as 170, dubstep at 140 read as 70. The beat lines then fall on every other beat (or twice per beat), and “4-beat” loops come out the wrong length.' },
  { term: 'SYNC', def: 'Matches one deck’s tempo and beat phase to the other, using their GRIDS. With a wrong grid, sync faithfully lines up the wrong thing.' },
] as const;

export const GOALS_GRID = ['SYNC on a wrong grid — hear the kicks clash', 'Put the first beat right', 'SYNC again — locked', 'Loop with QUANTIZE on, then off', 'Fix a half-BPM reading', 'Pass the check'] as const;

const LOOK = 'You are looking at deck A’s and deck B’s waveforms (Night Ferry on both — its kicks are easy to see), about two bars each, with their beat grids drawn over them (thin white beat lines, bold amber bar lines) and the kicks tinted violet; below, deck B’s SYNC and QUANTIZE keys.';

/** The GRID cell in one word (learning review p11 #4). */
function gridWord(d: DeckState): string {
  if (!d.track) return '—';
  if (gridCorrect(d)) return 'RIGHT';
  const a = analysedGrid(d)!;
  const t = TRACKS[d.track].bpm;
  if (Math.abs(a.bpm - t / 2) < 0.01) return 'HALF BPM';
  if (Math.abs(a.bpm - t * 2) < 0.01) return 'DOUBLE BPM';
  return Math.abs(a.bpm - t) < 0.01 ? 'BEAT 1 OFF' : 'BPM WRONG';
}

function GridTray({ onScenario, onLoop, loopMsg }: { onScenario: (g: GridMode) => void; onLoop: () => void; loopMsg: string | null }) {
  const b = getBooth();
  const d = b.decks.B;
  const g = analysedGrid(d);
  const tb = d.track ? TRACKS[d.track].bpm : 122;
  const scen = SCEN_OF(tb);
  const edit = (patch: Parameters<typeof setGrid>[3]) => updateBooth((x, t) => setGrid(x, t, 'B', patch));
  return (
    <View style={styles.tray}>
      <Text style={styles.head}>DECK B’S ANALYSIS (start a scenario)</Text>
      <View style={styles.row}>
        {scen.map((s) => (
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
        <LabChip label={d.loop ? 'LOOP EXIT' : 'LOOP 4 BEATS'} selected={!!d.loop} onPress={onLoop} compact />
      </View>
      {loopMsg ? <Text style={styles.note}>{loopMsg}</Text> : null}
      <Text style={styles.note}>Watch the waveform: a correct grid puts a thin line on every beat and a bold bar line on the “one” — where a crash or a new part lands, straight after a drum fill. In four-on-the-floor music every kick is equally strong, so the music’s structure finds the one, not the loudest kick.</Text>
    </View>
  );
}

const SCEN_OF = (bpm: number): { id: GridMode; label: string; blurb: string }[] => [
  { id: 'TRUE', label: 'GRID RIGHT', blurb: 'The analysis got it right: every line on a kick.' },
  { id: 'LATE_HALF', label: 'FIRST BEAT LATE', blurb: 'The first beat was placed half a beat late: every line sits on an off-beat hat, not the kick.' },
  { id: 'HALF_BPM', label: 'HALF BPM', blurb: `The analysis read ${bpm / 2} BPM for a ${bpm} BPM track: lines on every other beat.` },
];

function PageGrid({ ctx }: { ctx: PageCtx }) {
  const { booth, audio, tr, motion } = useBoothKit();
  const { ready } = useScreenSetup((b) => {
    // Night Ferry on both decks (A at bar 17, B at bar 41): its kicks stand
    // clear of the rest, so lines against kicks can be SEEN (audio review #5)
    let x = cueAtBar(b, 'A', 'nightFerry', 17);
    x = cueAtBar(x, 'B', 'nightFerry', 41);
    x = { ...x, decks: { A: { ...x.decks.A, pitch: 0 }, B: { ...x.decks.B, pitch: 0, gridMode: 'LATE_HALF', gridShiftBeats: 0, bpmFix: 1, quantize: true } } };
    return { ...x, ch: { 1: { ...x.ch[1], fader: 0.85, xf: 'THRU', cue: false }, 2: { ...x.ch[2], fader: 0.85, xf: 'THRU', cue: false } }, mixer: { ...x.mixer, splitCue: false }, perspective: 'CROWD' };
  });
  const [, setTick] = useState(0);
  const bump = (v: number) => setTick(v);
  useAnimatedReaction(() => Math.floor(motion.clock.value * 4), (n, p) => {
    if (n !== p) runOnJS(bump)(n);
  });
  const story = useRef({ wrongSync: false, fixed: false, lockSync: false, qOn: false, qOff: false });
  const [loopMsg, setLoopMsg] = useState<string | null>(null);
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
  if (ready && B.gridMode === 'LATE_HALF' && gridCorrect(B)) story.current.fixed = true;
  const pressSync = () => {
    const b0 = getBooth();
    if (!b0.decks.A.playing || !b0.decks.B.playing) {
      setMsg('Play both decks first, then SYNC.');
      return;
    }
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
  /** LOOP 4 BEATS / EXIT: where the loop started, against the grid. */
  const pressLoop = () => {
    const b0 = getBooth();
    if (b0.decks.B.loop) {
      updateBooth((x) => ({ ...x, decks: { ...x.decks, B: { ...x.decks.B, loop: null } } }));
      return;
    }
    if (!b0.decks.B.playing) {
      setLoopMsg('Play deck B first, then press LOOP 4 BEATS a little after a grid line.');
      return;
    }
    const t0 = boothNow();
    updateBooth((x, t) => loopIn(x, t, 'B', 4));
    const after = getBooth().decks.B;
    const g = analysedGrid(after);
    if (!after.loop || !g || !after.track) return;
    const beatPos = beatAt(g, after.loop.startSec);
    const fromLine = Math.abs(beatPos - Math.round(beatPos));
    const real = (after.loop.lengthSec * TRACKS[after.track].bpm) / 60;
    if (after.quantize) {
      story.current.qOn = true;
      setLoopMsg(`QUANTIZE on: the loop snapped back to the grid line — its start sits on a beat line. Now turn QUANTIZE off and try again. (${(real).toFixed(0)} real beats long.)`);
    } else {
      const pressed = beatAt(g, deckPos(b0.decks.B, t0));
      const off = pressed - Math.floor(pressed + 1e-6);
      if (fromLine > 0.05) story.current.qOff = true;
      setLoopMsg(fromLine > 0.05 ? `QUANTIZE off: the loop started where you pressed — ${off.toFixed(2)} of a beat after the line. On the dance floor that is a stumble every 4 beats.` : 'QUANTIZE off, but you pressed right on a line — try pressing a little late to see the difference.');
    }
  };
  const hits = [story.current.wrongSync, story.current.fixed, story.current.lockSync, story.current.qOn && story.current.qOff, faultFixed, check];
  const goals = GOALS_GRID.map((label, i) => ({ label, hit: hits[i] }));
  const latched = useVisitGoals(ctx, goals, 'GRID', ready);
  const loopReal = loopRealBeats(B);
  const lanesH = (h: number, k = 1) => Math.round(Math.min(180 * k, h * 0.58));
  // about two bars across each lane, so every beat line and every kick reads
  const span = (8 * 60) / 124;
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
              fit: (W, H, k) => ({ x: 0, y: lanesH(H, k), w: W, h: H - lanesH(H, k) }),
              highlight: { B: ['sync', 'quantize'] },
              syncLit: { B: syncLit },
              callouts: [
                { id: 'sy', text: 'SYNC', at: { x: BOOTH_LAYOUT.B.x + PLAYER.sync.x, y: PLAYER.sync.y + 6 }, dx: -30, dy: 0 },
                { id: 'qz', text: 'QUANTIZE', at: { x: BOOTH_LAYOUT.B.x + PLAYER.quantize.x, y: PLAYER.quantize.y + 5 }, dx: -30, dy: -6 },
              ],
              screenOverlay: (W, H, _xf, k) => {
                const L = lanesH(H, k);
                const lh = (L - 12) / 2;
                const kk = Math.sqrt(k);
                return (
                  <Group>
                    <WaveLane b={{ x: 6, y: 4, w: W - 12, h: lh }} d={A} spanSec={span} k={kk} lowKey label={`A · GRID RIGHT · ${bpmA.toFixed(1)}`} />
                    <WaveLane b={{ x: 6, y: 8 + lh, w: W - 12, h: lh }} d={B} spanSec={span} k={kk} marks label={`B · GRID ${gB ? gB.bpm.toFixed(1) : '—'} BPM${gridCorrect(B) ? ' · RIGHT' : ' · CHECK IT'}${loopReal ? ` · LOOP = ${Math.round(loopReal)} REAL BEATS` : ''}`} />
                  </Group>
                );
              },
              a11y: `${LOOK} Deck B's grid is ${gridCorrect(B) ? 'correct' : 'wrong'}.`,
            }}
          />
        ),
        bezel: [
          { k: 'B GRID BPM', v: gB ? gB.bpm.toFixed(1) : '—', tint: gridCorrect(B) ? colors.green : colors.amber },
          { k: 'GRID', v: gridWord(B), vA11y: gridWord(B) === 'BEAT 1 OFF' ? 'first beat off' : gridWord(B).toLowerCase(), tint: gridCorrect(B) ? colors.green : '#ff8a7e', flex: 1.4 },
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
                onLoop={pressLoop}
                loopMsg={loopMsg}
                onScenario={(gm) => {
                  setSyncLit(false);
                  updateBooth((x, tt) => setGrid({ ...x, decks: { ...x.decks, B: { ...x.decks.B, loop: null, pitch: 0 } } }, tt, 'B', { gridMode: gm, gridShiftBeats: 0, bpmFix: 1 }));
                }}
              />
            ),
          },
          { kind: 'action', id: 'sync', label: 'SYNC B', onPress: pressSync, tint: '#6fa8ff' },
          { kind: 'toggle', id: 'quant', label: 'QUANTIZE', value: B.quantize, onToggle: () => updateBooth((x, tt) => setGrid(x, tt, 'B', { quantize: !x.decks.B.quantize })) },
          boothKey(booth, tr),
          stopKey(tr),
        ],
        initialParam: 'grid',
      }}
    >
      <Step n={1}>
        <Look>{LOOK}</Look>
        <P>Before a track is played the software analyses it — its BPM, its beats, where bar 1 starts — and that BEATGRID drives SYNC, QUANTIZE (snapping your presses to the nearest beat), loops (a stretch of the track that repeats) and beat jumps.</P>
        <P>Deck B’s grid here starts half a beat LATE: look at its waveform, and the violet kick marks fall BETWEEN the lines.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Open DECKS and play both. Press SYNC B and listen as the CROWD: the tempos match, yet each of B’s kicks lands between A’s kicks — sync lined up the GRIDS, and B’s grid was wrong.</Do>
      </Step>
      <Step n={3}>
        <P>Open GRID and move B’s grid until its lines sit on the kicks (◀ ½ BEAT). The readout strip says ON THE KICK when it is right. Press SYNC B again: now the real beats lock.</P>
        <Note>Different programs and players edit grids differently, and some sync by tempo only. The idea is the same everywhere: trust your ears first, then the grid.</Note>
      </Step>
      <Step n={4}>
        <Do>Sync on the wrong grid and hear it, put the first beat right, then sync again until it locks.</Do>
        {msg ? <Text style={styles.warn}>{msg}</Text> : null}
        <Do>Then QUANTIZE: with it on, press GRID → LOOP 4 BEATS a little late — the green loop bracket snaps back to a grid line. Exit, turn QUANTIZE off and try again — it starts where you pressed.</Do>
        {loopMsg ? <Note tone="try">{loopMsg}</Note> : null}
        <GoalChips goals={goals.slice(0, 4)} latched={latched.slice(0, 4)} />
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow="CHECK YOURSELF"
          question="Every kick in a house track is equally loud. How do you find where the grid’s bold bar line — the “one” — belongs?"
          options={['From the music’s structure: where a crash, a chord change or a new part lands, straight after a fill', 'On the loudest kick', 'On the very first sound in the file', 'Anywhere — bar lines are only decoration']}
          correct={0}
          explain="In four-on-the-floor music the kicks are all the same, so loudness cannot find the one. The arrangement does: new parts, crashes and chord changes land on the one, and a drum fill leads into it. Put the bold line there, and loops, jumps and sync count bars correctly."
          wrong={[undefined, 'Every kick is equally strong here — there is no loudest one to find.', 'Many files start with silence or a pickup; the first sound is not always beat 1.', 'Bar lines drive loops, phrases and sync — a wrong one puts all of them off.']}
          onCorrect={() => setCheck(true)}
        />
        <FaultCard
          title="LOOPS TWICE AS LONG"
          symptom="You set a 4-beat loop on deck B, but it loops 8 beats, and its BPM reads about half what you count."
          start={() => {
            void audio.requestSound();
            updateBooth((x, tt) => {
              let y = setGrid({ ...x, decks: { ...x.decks, B: { ...x.decks.B, loop: null, pitch: 0, playing: true, at: tt } } }, tt, 'B', { gridMode: 'HALF_BPM', gridShiftBeats: 0, bpmFix: 1 });
              y = loopIn(y, tt, 'B', 4);
              return y;
            });
          }}
          // the LIVE deck: grid doubled back AND the loop running now is 4
          // real beats (a flag latched earlier made BPM ×2 alone read FIXED
          // with the fault's 8-beat loop still running — toddler pass 10-19)
          fixed={halfBpmFaultFixed(B)}
          hints={['Count the kicks between the grid lines on deck B.', `The analysis read ${B.track ? TRACKS[B.track].bpm / 2 : 61} BPM for a ${B.track ? TRACKS[B.track].bpm : 122} BPM track, so every “beat” it counts is two real beats.`, 'GRID → BPM ×2, then set a NEW loop (LOOP EXIT, then LOOP 4 BEATS): the old one was made on the wrong grid.']}
          why="The analysis had read half the real tempo, so the grid had a line on every other kick and a ‘4-beat’ loop was 8 real beats. Doubling the BPM put a line on every kick, and the new loop is 4 real beats; loops, jumps and sync now count real beats."
          onFixed={() => setFaultFixed(true)}
        />
        <GoalChips goals={goals.slice(4)} latched={latched.slice(4)} />
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
