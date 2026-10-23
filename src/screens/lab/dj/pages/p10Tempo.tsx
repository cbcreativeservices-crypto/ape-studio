/**
 * Screen 10 — Tempo, beatmatching and phrasing (research DJ16): BPM, beats,
 * bars and phrases; the tempo fader; jog nudges; beat OFFSET versus tempo
 * DRIFT. Two zoomed waveforms (the real audio, with the grid) scroll above the
 * two jogs and tempo faders; a phase strip shows where deck B's beat sits
 * against deck A's, per frame, from the TRUE grids (what the ear hears).
 * The fault: matched BPMs that still clash (half a beat off).
 */
import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BlurMask, Group, Line, RoundedRect, vec } from '@shopify/react-native-skia';
import { runOnJS, useAnimatedReaction, useDerivedValue } from 'react-native-reanimated';
import { colors, fonts } from '../../../../theme/tokens';
import { LabChip } from '../../LabShell';
import { UnderstandingCheck } from '../../tuning/components/check';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import { BoothStage } from '../art/BoothStage';
import { WaveLane } from '../art/plots';
import { INK } from '../art/ink';
import { useDeckPos } from '../art/motion';
import { SceneText } from '../art/sceneText';
import { BOOTH_LAYOUT, MIXER, PLAYER, PLAYER_D, PLAYER_W, type Box } from '../geometry/boothGeometry';
import { DjRack } from '../DjRack';
import { Do, FaultCard, GoalChips, Look, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { boothKey, stopKey, tempoKey } from '../dock';
import { boothNow, getBooth, updateBooth } from '../booth/boothStore';
import { cueAtBar, useScreenSetup } from '../booth/setup';
import { TRACKS, trueGrid } from '../engine/djMusic';
import { nudge, trueBeat } from '../model/djDeck';
import { BEATS_PER_PHRASE, barInPhrase, phaseOffset, playedBpm } from '../model/djTime';
import type { Booth } from '../model/djModel';
import { useBoothKit } from './shared';

const TERMS = [
  { term: 'BPM', def: 'Beats per minute: the tempo. 122 BPM is about two beats a second.' },
  { term: 'Phrase', def: 'A run of bars that belongs together — here 8 bars of 4 beats (32 beats). The first beat of a bar is the “one”; new parts tend to arrive at the start of a phrase, so blends usually start there too.' },
  { term: 'Drift', def: 'When two tempos differ even slightly, the beats slide apart steadily. Fix drift with the TEMPO fader (here up to ±8 %; without key lock, faster also means higher in pitch).' },
  { term: 'Offset', def: 'When the tempos match but the beats land at different moments — a steady flam. Fix it with a jog nudge (or a quick push of the tempo fader and straight back — leave it moved and you create drift).' },
] as const;

export const GOALS_TEMPO = ['Match the tempo (±0.1 BPM)', 'Line the beats up (≤ 1/16 beat)', 'Start B on a phrase', 'Fix the clash', 'Pass the check'] as const;

/** Deck B whole (the deck you operate); deck A's tempo column and the
 *  mixer from its channel faders down come as insets beside it. */
const VIEW: Box = { x: BOOTH_LAYOUT.B.x - 8, y: -8, w: PLAYER_W + 16, h: PLAYER_D + 16 };
const INSET_TEMPO_A: Box = { x: BOOTH_LAYOUT.A.x + 262, y: BOOTH_LAYOUT.A.y + 206, w: 58, h: 166 };
const INSET_MIXER: Box = { x: BOOTH_LAYOUT.mixer.x - 4, y: BOOTH_LAYOUT.mixer.y + MIXER.fader.top - 16, w: 278, h: 392 - MIXER.fader.top + 16 };
/** The stage below the lanes: [tempo A inset | mixer inset | deck B]. */
function stageLayout(W: number, H: number, L: number) {
  const top = L;
  const hh = H - L;
  const deckW = Math.min(W * 0.48, (hh - 4) * (VIEW.w / VIEW.h));
  const tempoW = Math.max(46, Math.min(70, W * 0.15));
  return {
    deck: { x: W - deckW - 2, y: top, w: deckW + 2, h: hh },
    tempo: { x: 6, y: top + 4, w: tempoW, h: hh - 8 },
    mixer: { x: 12 + tempoW, y: top + 4, w: W - deckW - tempoW - 22, h: hh - 8 },
  };
}

/** The phase strip: where B's beat lands against A's (−½ … +½ beat), per frame. */
function PhaseStrip({ b, booth }: { b: Box; booth: Booth }) {
  const pa = useDeckPos(booth.decks.A);
  const pb = useDeckPos(booth.decks.B);
  const ga = booth.decks.A.track ? trueGrid(booth.decks.A.track) : null;
  const gb = booth.decks.B.track ? trueGrid(booth.decks.B.track) : null;
  const both = booth.decks.A.playing && booth.decks.B.playing && !!ga && !!gb;
  const x = useDerivedValue(() => {
    if (!both || !ga || !gb) return b.x + b.w / 2;
    const ba = ((pa.value - ga.firstBeatSec) * ga.bpm) / 60;
    const bb = ((pb.value - gb.firstBeatSec) * gb.bpm) / 60;
    let d = (bb - ba) % 1;
    if (d > 0.5) d -= 1;
    if (d <= -0.5) d += 1;
    return b.x + b.w / 2 + d * b.w;
  });
  const p1 = useDerivedValue(() => vec(x.value, b.y + 3));
  const p2 = useDerivedValue(() => vec(x.value, b.y + b.h - 3));
  return (
    <Group>
      <RoundedRect x={b.x} y={b.y} width={b.w} height={b.h} r={5} color="#070a0e" />
      <RoundedRect x={b.x + b.w / 2 - b.w / 32} y={b.y + 2} width={b.w / 16} height={b.h - 4} r={3} color="rgba(91,255,133,0.18)" />
      <Line p1={vec(b.x + b.w / 2, b.y)} p2={vec(b.x + b.w / 2, b.y + b.h)} color="rgba(255,255,255,0.4)" strokeWidth={1} />
      {both ? (
        <Group>
          <Line p1={p1} p2={p2} color={INK.blue} strokeWidth={5} opacity={0.4}>
            <BlurMask blur={3} style="normal" />
          </Line>
          <Line p1={p1} p2={p2} color={INK.blue} strokeWidth={2.4} />
        </Group>
      ) : null}
      <SceneText x={b.x + 6} y={b.y + b.h - 4} size={9.5} text="B LATE" color={INK.printDim} face="label" minPt={9.5} />
      <SceneText x={b.x + b.w - 6} y={b.y + b.h - 4} size={9.5} text="B EARLY" color={INK.printDim} face="label" align="right" minPt={9.5} />
    </Group>
  );
}

const LOOK = 'You are looking at two zoomed waveforms, deck A over deck B, with their beat grids and a phase strip; below them deck B whole, with deck A’s tempo fader and the mixer’s faders beside it.';

function JogTray({ onStartB, startMsg }: { onStartB: () => void; startMsg: string | null }) {
  const b = getBooth();
  const n = (ms: number) => updateBooth((x, t) => nudge(x, t, 'B', ms));
  // a quarter of a beat of deck B's track: the BIG PUSH for a big offset
  const quarterMs = b.decks.B.track ? (0.25 * 60 * 1000) / TRACKS[b.decks.B.track].bpm : 120;
  const f2 = (v: number) => updateBooth((x) => ({ ...x, ch: { ...x.ch, 2: { ...x.ch[2], fader: v } } }));
  return (
    <View style={styles.tray}>
      <Text style={styles.head}>DECK B JOG (push or drag the outer ring)</Text>
      <View style={styles.row}>
        <LabChip label="‹‹ HOLD BACK" selected={false} onPress={() => n(-20)} />
        <LabChip label="‹ BACK" selected={false} onPress={() => n(-8)} />
        <LabChip label="PUSH ›" selected={false} onPress={() => n(8)} />
        <LabChip label="PUSH ››" selected={false} onPress={() => n(20)} />
      </View>
      <View style={styles.row}>
        <LabChip label="◀◀ BIG HOLD ¼ BEAT" selected={false} onPress={() => n(-quarterMs)} compact />
        <LabChip label="BIG PUSH ¼ BEAT ▶▶" selected={false} onPress={() => n(quarterMs)} compact />
      </View>
      <Text style={styles.note}>A nudge corrects OFFSET (the beats landing apart); the BIG steps move a quarter of a beat. If the beats keep sliding apart afterwards, that is DRIFT — fix it with TEMPO B. On a real jog, push or drag the outer ring; in VINYL mode pressing the top plate grabs the track like a record — never rest your hand on it.</Text>
      <Text style={styles.head}>START DECK B (or re-drop it on the one)</Text>
      <View style={styles.row}>
        <LabChip label={b.decks.B.playing ? '❚❚ PAUSE B' : '▶ PLAY B NOW'} selected={b.decks.B.playing} onPress={onStartB} />
        <LabChip label="CUE B BACK TO BAR 1" selected={false} onPress={() => updateBooth((x) => cueAtBar(x, 'B', x.decks.B.track ?? 'glassHarbour', 1))} />
      </View>
      {startMsg ? <Text style={styles.note}>{startMsg}</Text> : null}
      <Text style={styles.head}>{`CH2 FADER → ${Math.round(b.ch[2].fader * 100)}% (deck B in the mix)`}</Text>
      <View style={styles.row}>
        <LabChip label="DOWN (FIX IN CUE)" selected={b.ch[2].fader <= 0.02} onPress={() => f2(0)} compact />
        <LabChip label="UP 85%" selected={Math.abs(b.ch[2].fader - 0.85) < 0.02} onPress={() => f2(0.85)} compact />
      </View>
    </View>
  );
}

function useTick(clock: ReturnType<typeof useBoothKit>['motion']['clock']) {
  const [, setT] = useState(0);
  const bump = (v: number) => setT(v);
  useAnimatedReaction(
    () => Math.floor(clock.value * 4),
    (now, prev) => {
      if (now !== prev) runOnJS(bump)(now);
    },
  );
}

function PageTempo({ ctx }: { ctx: PageCtx }) {
  const { booth, audio, tr, motion } = useBoothKit();
  useScreenSetup((b) => {
    let x = cueAtBar(b, 'A', 'nightFerry', 17);
    x = cueAtBar(x, 'B', 'glassHarbour', 1);
    return {
      ...x,
      decks: { A: { ...x.decks.A, pitch: 0 }, B: { ...x.decks.B, pitch: 0 } },
      ch: { 1: { ...x.ch[1], fader: 0.85, xf: 'THRU', cue: false }, 2: { ...x.ch[2], fader: 0, xf: 'THRU', cue: true } },
      mixer: { ...x.mixer, splitCue: true, phones: 0.45 },
      perspective: 'PHONES',
    };
  });
  useTick(motion.clock);
  const [check, setCheck] = useState(false);
  const [faultFixed, setFaultFixed] = useState(false);
  const [phraseStart, setPhraseStart] = useState(false);
  const [startMsg, setStartMsg] = useState<string | null>(null);
  // the clash fault: B pulled out of the mix, fixed in cue, brought back
  const fault = useRef({ on: false, pulled: false });
  const t = boothNow();
  const A = booth.decks.A;
  const B = booth.decks.B;
  const bpmA = A.track ? playedBpm(TRACKS[A.track].bpm, A.pitch) : 0;
  const bpmB = B.track ? playedBpm(TRACKS[B.track].bpm, B.pitch) : 0;
  const both = A.playing && B.playing;
  const ba = trueBeat(booth, 'A', t);
  const bb = trueBeat(booth, 'B', t);
  const off = ba != null && bb != null ? phaseOffset(bb, ba) : 0;
  const tempoOk = both && Math.abs(bpmA - bpmB) < 0.1;
  const aligned = both && Math.abs(bpmA - bpmB) < 0.05 && Math.abs(off) < 1 / 16;
  const startB = () => {
    const b0 = getBooth();
    if (!b0.decks.B.playing) {
      const nowBeat = trueBeat(b0, 'A', boothNow());
      const bBeat = trueBeat(b0, 'B', boothNow());
      if (b0.decks.A.playing && nowBeat != null && bBeat != null) {
        const phrase = Math.round(nowBeat / BEATS_PER_PHRASE) * BEATS_PER_PHRASE;
        const late = nowBeat - phrase;
        const bOnPhrase = Math.abs(bBeat - Math.round(bBeat / BEATS_PER_PHRASE) * BEATS_PER_PHRASE) < 0.1;
        if (Math.abs(late) < 0.35 && bOnPhrase) {
          setPhraseStart(true);
          setStartMsg('On the phrase: B started with A’s phrase. Now match the tempo and line the beats up.');
        } else if (!bOnPhrase) {
          setStartMsg('B was not cued at the start of a phrase. Pause B, press CUE B BACK TO BAR 1, and press PLAY on the ONE when A PHRASE reads 1 / 8.');
        } else {
          setStartMsg(`B started ${Math.abs(late).toFixed(1)} beats ${late > 0 ? 'after' : 'before'} A’s phrase ${late > 0 ? 'began' : 'begins'} — pause B, CUE B BACK TO BAR 1, and press PLAY on the ONE when A PHRASE reads 1 / 8 (it flashes on bar 8 as a count-in).`);
        }
      }
    }
    tr.toggle('B');
  };
  if (fault.current.on && B.playing && booth.ch[2].fader <= 0.05) fault.current.pulled = true;
  const hits = [tempoOk, aligned, phraseStart, faultFixed, check];
  const goals = GOALS_TEMPO.map((label, i) => ({ label, hit: hits[i] }));
  const latched = useVisitGoals(ctx, goals, 'TEMPO');
  const lanesH = (h: number, k = 1) => Math.round(Math.min(160 * k, h * 0.52));
  const aBar = ba != null && ba >= 0 ? barInPhrase(ba) : null;
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
              view: VIEW,
              fullView: 'booth',
              fullFit: (W, H, k) => ({ x: 0, y: lanesH(H, k), w: W, h: H - lanesH(H, k) }),
              fit: (W, H, k) => stageLayout(W, H, lanesH(H, k)).deck,
              insets: [
                { frame: INSET_TEMPO_A, label: 'A TEMPO', at: (W, H, k) => stageLayout(W, H, lanesH(H, k)).tempo },
                { frame: INSET_MIXER, label: 'MIXER', at: (W, H, k) => stageLayout(W, H, lanesH(H, k)).mixer },
              ],
              highlight: { A: ['tempo'], B: ['tempo', 'jog'] },
              callouts: [
                { id: 'tb', text: 'TEMPO B', at: { x: BOOTH_LAYOUT.B.x + PLAYER.tempo.x, y: PLAYER.tempo.top + 40 }, dx: 0, dy: -10 },
                { id: 'jb', text: 'JOG B', at: { x: BOOTH_LAYOUT.B.x + PLAYER.jog.cx - 60, y: PLAYER.jog.cy - 60 }, dx: -10, dy: -10 },
              ],
              screenOverlay: (W, H, _xf, k) => {
                const L = lanesH(H, k);
                const lh = (L - 34) / 2;
                return (
                  <Group>
                    <WaveLane b={{ x: 6, y: 4, w: W - 12, h: lh }} d={A} label={`A · ${bpmA.toFixed(1)} BPM`} k={Math.sqrt(k)} lowKey />
                    <WaveLane b={{ x: 6, y: 8 + lh, w: W - 12, h: lh }} d={B} label={`B · ${bpmB.toFixed(1)} BPM`} k={Math.sqrt(k)} />
                    <PhaseStrip b={{ x: 6, y: 12 + lh * 2, w: W - 12, h: 18 }} booth={booth} />
                  </Group>
                );
              },
              a11y: `${LOOK} Deck A ${bpmA.toFixed(2)} BPM, deck B ${bpmB.toFixed(2)} BPM; B is ${off >= 0 ? 'early' : 'late'} by ${Math.abs(off).toFixed(2)} of a beat.`,
            }}
          />
        ),
        bezel: [
          { k: 'A BPM', v: bpmA.toFixed(2), tint: colors.textPrimary },
          { k: 'B BPM', v: bpmB.toFixed(2), tint: Math.abs(bpmA - bpmB) < 0.05 ? colors.green : '#8fbcff' },
          { k: 'B vs A', v: both ? `${off >= 0 ? '+' : '−'}${Math.abs(off).toFixed(2)} beat` : '—', tint: both && Math.abs(off) < 1 / 16 ? colors.green : colors.amber },
          // bar 8 is the count-in: the cell flashes before the phrase's ONE
          { k: 'A PHRASE', v: aBar == null ? '—' : aBar === 8 ? '8 / 8 ▸' : `${aBar} / 8`, tint: aBar === 8 ? '#ff8a7e' : aBar === 1 ? colors.green : colors.textPrimary },
        ],
        params: [
          tempoKey(booth, 'B'),
          { kind: 'group', id: 'jog', label: 'JOG B', valueLabel: 'NUDGE', render: () => <JogTray onStartB={startB} startMsg={startMsg} /> },
          { kind: 'toggle', id: 'playB', label: 'PLAY B', value: B.playing, onToggle: startB },
          boothKey(booth, tr),
          stopKey(tr),
        ],
        initialParam: 'tempoB',
      }}
    >
      <Step n={1}>
        <Look>{LOOK}</Look>
        <P>Deck A (122 BPM) will play to the crowd; deck B (126 BPM) is cued in your headphones with split cue on — B in your left ear, the room’s mix in your right.</P>
        <P>Two problems sound alike: DRIFT (the tempos differ, so the beats slide apart steadily — the TEMPO fader) and OFFSET (the tempos match but the beats land apart — a jog nudge).</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Open DECKS and play deck A. Deck A is on air — leave its tempo alone; you match B to A. Deck B waits at bar 1: start it on the ONE of one of A’s phrases (PLAY B when A PHRASE turns 1 / 8 — it flashes on bar 8 as a count-in).</Do>
        <P>Missed it? Pause B, open JOG B → CUE B BACK TO BAR 1, and try on the next phrase. Then slow deck B: move TEMPO B toward − (away from you on the player) until its BPM reads like A’s.</P>
        <P>The waveforms show each track’s real kicks under its grid; the PHASE strip shows where B’s beat sits against A’s. Centre and green is together.</P>
      </Step>
      <Step n={3}>
        <P>Listen to the kicks in your two ears. A steady “flam” (a doubled kick) is offset — nudge. A flam that grows, then turns into chaos, is drift — tempo. Use the fine TEMPO steps (±0.05 %) under the fader to stop the last of the drift.</P>
        <Note>On this lab’s players the tempo fader changes speed AND pitch (no key lock): deck B pulled down to 122 BPM also sounds about half a semitone lower — enough to sound sour against deck A’s bass and chords. Blend over drum-only intros, or use key lock (later in the course).</Note>
        <Note>In a big room the PA reaches you late — about 3 ms for every metre. Match against your headphones and the booth monitors, never against the sound coming back off the floor.</Note>
      </Step>
      <Step n={4}>
        <Do>Match the tempo to within 0.1 BPM, line the beats up to within a sixteenth of a beat (the lab’s pass mark — on a real system, until you hear no flam), and start deck B on a phrase.</Do>
        {startMsg ? <Note tone={phraseStart ? 'try' : 'safety'}>{startMsg}</Note> : null}
        <P>Then try the blend: bring B’s fader up (JOG B → CH2 FADER) as the next phrase begins. Where you start is a musical choice — the start of a phrase is a strong suggested starting point.</P>
        <GoalChips goals={goals.slice(0, 3)} latched={latched.slice(0, 3)} />
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow="CHECK YOURSELF"
          question="You line the kicks up, but over the next 8 bars the flam slowly grows again. Which control fixes it?"
          options={['The TEMPO fader — a growing flam is drift: the tempos still differ', 'The jog — nudge again every bar', 'The channel fader', 'The EQ — cut the LOW so the flam is hidden']}
          correct={0}
          explain="A flam that GROWS is drift: one deck is still a little faster. Nudging only resets it for a while; a fine move of the TEMPO fader stops it. A steady flam that never grows would be an offset — a nudge."
          wrong={[undefined, 'Nudging resets the beats, but they keep sliding apart — the tempos still differ.', 'The fader changes how loud B is, not when its beats land.', 'Hiding the kick hides the symptom; the tempos still differ.']}
          onCorrect={() => setCheck(true)}
        />
        <FaultCard
          title="SAME BPM, STILL CLASHING"
          symptom="Both decks show the same BPM, yet the mix sounds like a galloping mess."
          start={() => {
            void audio.requestSound();
            fault.current = { on: true, pulled: false };
            updateBooth((b, tt) => {
              let x = cueAtBar(b, 'A', 'nightFerry', 17);
              x = cueAtBar(x, 'B', 'nightFerry', 41);
              const half = (0.5 * 60) / 122;
              return {
                ...x,
                decks: { A: { ...x.decks.A, playing: true, at: tt, pitch: 0 }, B: { ...x.decks.B, playing: true, at: tt, pitch: 0, posSec: x.decks.B.posSec + half } },
                ch: { 1: { ...x.ch[1], fader: 0.85, cue: false }, 2: { ...x.ch[2], fader: 0.85, cue: true } },
                perspective: 'CROWD',
              };
            });
          }}
          fixed={both && fault.current.pulled && Math.abs(bpmA - bpmB) < 0.05 && Math.abs(off) < 1 / 16 && booth.ch[2].fader >= 0.5}
          hints={['First pull B out of the mix (JOG B → CH2 FADER DOWN) and fix it in your headphones — the crowd should not hear the clash. The BPMs match, so this is not drift.', 'Look at the PHASE strip: B sits about half a beat away from A. Two BIG PUSHes (¼ beat each) cover most of it, or re-drop B on the one.', 'Finish with small nudges until the line sits in the green, then bring CH2 back UP.']}
          why="The tempos matched exactly, but deck B was half a beat late — an offset, not drift. You took B out of the mix, fixed it in your headphones and brought it back. A big offset is quickest fixed by restarting B on the one (or a firm push); small nudges are for the last few milliseconds. The tempo fader would only have made them slide."
          onFixed={() => setFaultFixed(true)}
        />
        <GoalChips goals={goals.slice(3)} latched={latched.slice(3)} />
      </Step>
    </DjRack>
  );
}

const styles = StyleSheet.create({
  tray: { gap: 8 },
  head: { color: colors.textMuted, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.2 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  note: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18 },
});

export const P10: PageDef = { title: 'Tempo, beatmatching and phrasing', short: 'TEMPO', Component: PageTempo, manualDone: true, rack: true };
