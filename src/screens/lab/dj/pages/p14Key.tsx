/**
 * Screen 14 — Playback speed, pitch and key (research DJ20, first half): how
 * speed moves pitch (12·log2 of the rate), KEY LOCK (a real time-stretch:
 * engine/djStretch's WSOLA), KEY SHIFT, the stretch's artifacts at big
 * changes, and musical choices — Glass Harbour (D minor) matched to Night
 * Ferry (A minor) without key lock sits half a semitone flat, OUT OF TUNE;
 * with it, the two keys are neighbours. The fault: a deck left without key
 * lock after a big tempo change. Matching the tempo is one tap here (MATCH
 * TO A): this screen is about pitch, not beatmatching.
 */
import { useRef, useState } from 'react';
import { View } from 'react-native';
import { Group } from '@shopify/react-native-skia';
import { colors } from '../../../../theme/tokens';
import { LabChip } from '../../LabShell';
import { UnderstandingCheck } from '../../tuning/components/check';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import { BoothStage } from '../art/BoothStage';
import { KeyStrip, PitchPlot } from '../art/keyArt';
import { KEY_LOCK_KEYS } from '../art/PlayerTop';
import { BOOTH_LAYOUT, PLAYER } from '../geometry/boothGeometry';
import { DjRack } from '../DjRack';
import { Do, FaultCard, GoalChips, Look, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { ChipRow, boothKey, stopKey } from '../dock';
import { getBooth, updateBooth } from '../booth/boothStore';
import { cueAtBar, useScreenSetup } from '../booth/setup';
import { TRIM_UNITY, trimPos, type Booth } from '../model/djModel';
import { TRACKS } from '../engine/djMusic';
import { alignPhase } from '../model/djDeck';
import { pitchFor, playedBpm } from '../model/djTime';
import { KEY_SHIFT_MAX, STRETCH_AUDIBLE, keyRelation, keyWords, playedSemis, soundingTonic, speedPlan } from '../model/djKey';
import { useBoothKit } from './shared';
import { Choices, TrayNote, s2styles } from './s2kit';

const TERMS = [
  { term: 'Key lock', def: 'The player stretches the sound in time so the tempo can move while the pitch stays. Also called master tempo.' },
  { term: 'Semitone', def: 'The smallest step between two piano keys. A tempo change of about 6 % moves the pitch one semitone.' },
  { term: 'Key shift', def: 'Moves the pitch in semitone steps without touching the tempo — the same stretch, used the other way.' },
  { term: 'Artifacts', def: 'What a stretch leaves behind: smeared drum hits, a phasey or doubled sound. Small changes hide them; big ones show them.' },
] as const;

export const GOALS_KEY = ['Match B to A and hear it go flat', 'Lock the key', 'Hear the stretch at −14 %', 'Shift the key a step', '4 % faster, same key', 'Fix the sour blend', 'Pass the check'] as const;

const bpmOf = (b: Booth, d: 'A' | 'B') => (b.decks[d].track ? playedBpm(TRACKS[b.decks[d].track!].bpm, b.decks[d].pitch) : 0);

function setB(f: (d: Booth['decks']['B']) => Partial<Booth['decks']['B']>) {
  updateBooth((b, t) => {
    const B = b.decks.B;
    const next = { ...b, decks: { ...b.decks, B: { ...B, ...f(B) } } };
    return b.decks.A.playing && B.playing ? alignPhase(next, t, 'B') : next;
  });
}

function KeyTray() {
  const b = getBooth();
  const B = b.decks.B;
  const range = B.tempoRange ?? 8;
  const shift = B.keyShift ?? 0;
  return (
    <View style={s2styles.tray}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        <LabChip label="MATCH TEMPO TO A" selected={false} onPress={() => setB(() => ({ pitch: pitchFor(TRACKS.glassHarbour.bpm, bpmOf(getBooth(), 'A')) }))} />
        <LabChip label="TEMPO 0 %" selected={Math.abs(B.pitch) < 0.01} onPress={() => setB(() => ({ pitch: 0 }))} />
      </View>
      <TrayNote>MATCH sets deck B’s tempo fader so its BPM reads like deck A’s (Screen 10 shows doing it by hand).</TrayNote>
      <Choices head="KEY SHIFT (semitones)" value={shift} items={Array.from({ length: KEY_SHIFT_MAX * 2 + 1 }, (_, i) => i - KEY_SHIFT_MAX).map((v) => ({ id: v, label: v > 0 ? `+${v}` : String(v) }))} onPick={(v) => setB(() => ({ keyShift: v as number }))} note="A shift moves the pitch only; the tempo stays where the fader is." />
      <Choices head="TEMPO RANGE" value={range} items={[{ id: 8, label: '±8 %' }, { id: 16, label: '±16 %' }]} onPick={(v) => setB((d) => ({ tempoRange: v as number, pitch: Math.max(-(v as number), Math.min(v as number, d.pitch)) }))} note="A wider range moves further, but every millimetre of the fader is a bigger change." />
    </View>
  );
}

function PageKey({ ctx }: { ctx: PageCtx }) {
  const { booth, audio, tr, motion } = useBoothKit({ lockPhase: true });
  useScreenSetup((b) => {
    let x = cueAtBar(b, 'A', 'nightFerry', 17);
    x = cueAtBar(x, 'B', 'glassHarbour', 17);
    const flat = { hi: 0.5, mid: 0.5, lo: 0.5 };
    return {
      ...x,
      decks: { ...x.decks, B: { ...x.decks.B, pitch: 0, keyLock: false, keyShift: 0, tempoRange: 8 } },
      ch: { 1: { ...x.ch[1], trim: TRIM_UNITY, fader: 0.85, xf: 'THRU', eq: flat, filter: 0, cue: false }, 2: { ...x.ch[2], trim: trimPos(-11), fader: 0.85, xf: 'THRU', eq: flat, filter: 0, cue: false } },
      perspective: 'CROWD',
    };
  });
  const [check, setCheck] = useState(false);
  const [faultFixed, setFaultFixed] = useState(false);
  const h = useRef({ flat: false, lock: false, stretch: false, shift: false, own: false });
  const A = booth.decks.A;
  const B = booth.decks.B;
  const both = A.playing && B.playing;
  const matched = Math.abs(bpmOf(booth, 'A') - bpmOf(booth, 'B')) < 0.06;
  const rel = keyRelation(A, B);
  const range = B.tempoRange ?? 8;
  if (both && matched && !B.keyLock && rel === 'OUT OF TUNE') h.current.flat = true;
  if (both && matched && B.keyLock && rel !== 'OUT OF TUNE') h.current.lock = true;
  if (B.playing && B.keyLock && B.pitch <= -12) h.current.stretch = true;
  if (B.playing && (B.keyShift ?? 0) !== 0) h.current.shift = true;
  if (B.playing && B.keyLock && Math.abs(B.pitch - 4) <= 0.3 && Math.abs(B.keyShift ?? 0) < 0.01) h.current.own = true;
  const hits = [h.current.flat, h.current.lock, h.current.stretch, h.current.shift, h.current.own, faultFixed, check];
  const goals = GOALS_KEY.map((label, i) => ({ label, hit: hits[i] }));
  const latched = useVisitGoals(ctx, goals, 'KEY');
  const plan = speedPlan(B);
  const stretchPct = (plan.stretch - 1) * 100;
  const audible = Math.abs(plan.stretch - 1) > STRETCH_AUDIBLE;
  const tempoKey = {
    kind: 'fader' as const,
    id: 'tempoB',
    label: 'TEMPO B',
    value: (B.pitch + range) / (2 * range),
    home: 0.5,
    onChange: (v: number) => setB(() => ({ pitch: Math.round((v * 2 - 1) * range * 100) / 100 })),
    format: (v: number) => {
      const p = (v * 2 - 1) * range;
      return `TEMPO B ${p >= 0 ? '+' : '−'}${Math.abs(p).toFixed(2)} % · ${(TRACKS.glassHarbour.bpm * (1 + p / 100)).toFixed(1)} BPM`;
    },
    formatShort: (v: number) => {
      const p = (v * 2 - 1) * range;
      return `${p >= 0 ? '+' : '−'}${Math.abs(p).toFixed(1)}`;
    },
    nudges: [
      { label: '−0.5%', onPress: () => setB((d) => ({ pitch: Math.max(-range, Math.round((d.pitch - 0.5) * 100) / 100) })), a11y: 'Tempo down half a percent' },
      { label: '+0.5%', onPress: () => setB((d) => ({ pitch: Math.min(range, Math.round((d.pitch + 0.5) * 100) / 100) })), a11y: 'Tempo up half a percent' },
    ],
  };
  const st = playedSemis(B);
  const bx = BOOTH_LAYOUT.B.x;
  // the tempo column of deck B: the fader, KEY LOCK and KEY −/+, the range key
  const view = { x: bx + 222, y: 140, w: 104, h: 252 };
  const plotW = (W: number, k: number) => Math.round(W - Math.min(150 * Math.sqrt(k), W * 0.4));
  const kl = KEY_LOCK_KEYS;
  return (
    <DjRack
      spec={{
        render: (w, hh) => (
          <BoothStage
            w={w}
            h={hh}
            booth={booth}
            motion={motion}
            spec={{
              view,
              fit: (W, H, k) => ({ x: plotW(W, k), y: 0, w: W - plotW(W, k), h: H }),
              highlight: { B: ['tempo'] },
              obstacles: [
                { x: bx + kl.lock.x - 2, y: kl.lock.y - 2, w: kl.lock.w + 4, h: kl.lock.h + 4 },
                { x: bx + kl.minus.x - 2, y: kl.minus.y - 2, w: kl.plus.x + kl.plus.w - kl.minus.x + 4, h: kl.minus.h + 4 },
              ],
              callouts: [
                { id: 'tp', text: 'TEMPO B', at: { x: bx + PLAYER.tempo.x, y: PLAYER.tempo.top - 6 }, dx: 0, dy: -14 },
                { id: 'kl', text: B.keyLock ? 'KEY LOCK ON' : 'KEY LOCK', at: { x: bx + kl.lock.x + kl.lock.w / 2, y: kl.lock.y + kl.lock.h }, dx: 0, dy: 16, tone: B.keyLock ? ('blue' as const) : ('plain' as const) },
                { id: 'ks', text: 'KEY − / +', at: { x: bx + kl.minus.x + 18, y: kl.minus.y + kl.minus.h }, dx: 0, dy: 14, tone: 'plain' as const },
              ],
              screenOverlay: (W, H, _xf, k) => {
                const kk = Math.sqrt(k);
                const pw = plotW(W, k) - 6;
                const ph = Math.round((H - 12) * 0.52);
                return (
                  <Group>
                    <PitchPlot b={{ x: 6, y: 4, w: pw - 6, h: ph }} pitch={B.pitch} range={range} keyLock={!!B.keyLock} shift={B.keyShift ?? 0} k={kk} />
                    <KeyStrip b={{ x: 6, y: ph + 10, w: pw - 6, h: H - ph - 14 }} a={soundingTonic(A)} bTonic={soundingTonic(B)} aWord={keyWords(A)} bWord={keyWords(B)} relation={rel ?? '—'} k={kk} />
                  </Group>
                );
              },
              a11y: `You are looking at deck B’s pitch plotted against its tempo, a strip of the twelve semitones with each deck’s key marked where it sounds, and deck B’s tempo column. Deck B is ${keyWords(B)}; deck A ${keyWords(A)}; ${rel ?? ''}.`,
            }}
          />
        ),
        bezel: [
          { k: 'B BPM', v: bpmOf(booth, 'B').toFixed(1), sub: `A ${bpmOf(booth, 'A').toFixed(1)}`, tint: matched ? colors.green : colors.textPrimary },
          { k: 'B PITCH', v: `${st >= 0 ? '+' : '−'}${Math.abs(st).toFixed(2)} st`, tint: Math.abs(st - Math.round(st)) > 0.15 ? '#ff8a7e' : colors.textPrimary },
          { k: 'B KEY', v: keyWords(B).replace(/ [+−][0-9.]+ st$/, ''), vA11y: keyWords(B), sub: keyWords(B).match(/[+−][0-9.]+ st$/)?.[0] ?? (rel ?? undefined), tint: rel === 'OUT OF TUNE' ? '#ff8a7e' : '#8fbcff' },
          { k: 'STRETCH', v: B.keyLock || B.keyShift ? `${stretchPct >= 0 ? '+' : '−'}${Math.abs(stretchPct).toFixed(1)} %` : 'NONE', sub: audible ? 'AUDIBLE' : undefined, tint: audible ? '#ff8a7e' : colors.textSub },
        ],
        params: [
          tempoKey,
          { kind: 'toggle', id: 'keylock', label: 'KEY LOCK', value: !!B.keyLock, onToggle: () => setB((d) => ({ keyLock: !d.keyLock })) },
          { kind: 'group', id: 'key', label: 'KEY', valueLabel: `${(B.keyShift ?? 0) > 0 ? '+' : ''}${B.keyShift ?? 0} · ±${range}`, valueA11y: `key shift ${B.keyShift ?? 0} semitones, tempo range ${range} percent`, render: () => <KeyTray /> },
          boothKey(booth, tr, ['A', 'B'], () => (
            <ChipRow head="LISTEN TO DECK B ALONE?" chips={[{ label: 'CH1 DOWN', on: getBooth().ch[1].fader < 0.02, onPress: () => updateBooth((x) => ({ ...x, ch: { ...x.ch, 1: { ...x.ch[1], fader: 0 } } })) }, { label: 'CH1 UP', on: getBooth().ch[1].fader > 0.5, onPress: () => updateBooth((x) => ({ ...x, ch: { ...x.ch, 1: { ...x.ch[1], fader: 0.85 } } })) }]} />
          )),
          stopKey(tr),
        ],
        initialParam: 'tempoB',
      }}
    >
      <Step n={1}>
        <Look>You are looking at deck B’s pitch plotted against its tempo fader, a strip of the twelve semitones with each deck’s key marked where it SOUNDS, and deck B’s tempo column with its KEY LOCK and KEY − / + keys.</Look>
        <P>Played faster, a record or a track sounds higher: about one semitone for every 6 % of tempo. KEY LOCK keeps the pitch while the tempo moves, by stretching the sound in time; KEY SHIFT moves the pitch alone.</P>
        <P>Glass Harbour (deck B) is in D minor at 126 BPM; Night Ferry (deck A) in A minor at 122.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Open DECKS and play both. Open KEY and tap MATCH TEMPO TO A: deck B slows 3.2 % to 122 BPM. Watch B’s dot slide down the white curve and its key marker slip below D.</Do>
        <P>B PITCH reads −0.56 st: half a semitone flat. Against deck A’s bass and chords that sounds sour — OUT OF TUNE — though both keys on their own are fine.</P>
      </Step>
      <Step n={3}>
        <P>Press KEY LOCK. The dot jumps to the blue line: the tempo stays at 122, the pitch goes back to D minor, and A minor and D minor are NEIGHBOURS — keys that share most of their notes.</P>
        <P>Now open KEY, choose the ±16 % range and pull TEMPO B toward −14 %. Listen to deck B alone (DECKS → CH1 DOWN): the kicks soften and smear, and the sound gets phasey. That is the stretch working hard.</P>
        <Note>This lab’s key lock is a real, simple time-stretch. Better ones hide the artifacts further, but every stretch has some — small tempo changes stay cleanest.</Note>
      </Step>
      <Step n={4}>
        <Do>Match B to A without key lock and hear it go flat; lock the key; hear the stretch at −14 %; then shift B’s key a step with KEY − or KEY +.</Do>
        <P>Key matching is a choice, not a rule. Many blends over drum-only intros never need it; some DJs shift a key to make two melodies agree, others never touch it. Listen, and decide.</P>
        <GoalChips goals={goals.slice(0, 4)} latched={latched.slice(0, 4)} />
      </Step>
      <Step n={5}>
        <Do>On your own: make deck B play 4 % faster without changing its key.</Do>
        <UnderstandingCheck
          eyebrow="CHECK YOURSELF"
          question="For a blend you need deck B 12 % slower than its own tempo, with key lock on. What should you listen for before you commit to it?"
          options={['Smeared, phasey drums and a doubled sound — the stretch working hard', 'Nothing — key lock makes any tempo sound the same', 'The track going about two semitones flat', 'The track getting louder']}
          correct={0}
          explain="Key lock keeps the pitch, but a 12 % stretch is big: drum hits smear and the sound turns phasey. Listen in your headphones first; a shorter blend, a smaller tempo change or another track may serve the floor better."
          wrong={[undefined, 'Every stretch leaves artifacts; small changes hide them, big ones show them.', 'That is what happens with key lock OFF (12·log2(0.88) ≈ −2.2 semitones).', 'A stretch does not change the level.']}
          onCorrect={() => setCheck(true)}
        />
        <FaultCard
          title="THE NEW TRACK SOUNDS SOUR"
          symptom="Both decks are in the mix and the beats line up, but the melodies clash — the new track sounds slightly out of tune with the one playing."
          start={() => {
            void audio.requestSound();
            updateBooth((b, t) =>
              alignPhase(
                { ...b, decks: { A: { ...b.decks.A, playing: true, at: t }, B: { ...b.decks.B, playing: true, at: t, keyLock: false, keyShift: 0, pitch: pitchFor(TRACKS.glassHarbour.bpm, bpmOf(b, 'A')) } }, ch: { 1: { ...b.ch[1], fader: 0.85 }, 2: { ...b.ch[2], fader: 0.85 } }, perspective: 'CROWD' },
                t,
                'B',
              ),
            );
          }}
          fixed={both && matched && rel != null && rel !== 'OUT OF TUNE'}
          hints={['Read B PITCH and B KEY on the readout strip.', 'Deck B was slowed 3.2 % to match — without key lock it dropped half a semitone.', 'Press KEY LOCK on deck B.']}
          why="Matching the tempo without key lock lowered deck B by 0.56 of a semitone — between two keys, so it clashed with everything deck A was playing. Key lock kept the tempo and gave the key back."
          onFixed={() => setFaultFixed(true)}
        />
        <GoalChips goals={goals.slice(4)} latched={latched.slice(4)} />
      </Step>
    </DjRack>
  );
}

export const P14: PageDef = { title: 'Playback speed, pitch and key', short: 'KEY', Component: PageKey, manualDone: true, rack: true };
