/**
 * Screen 6 — Set gain and read meters (research topics DJ11 + DJ12).
 * Input selection, trim, channel meters, master meters, headroom, clipping,
 * and matching two tracks recorded at different levels — by their AVERAGE
 * level, set in the headphones with the fader down; the peak is only a
 * ceiling (audio review 2026-10-18 #1, #6). The fault: the
 * crowd hears crackle while the MASTER meter looks fine (the mix bus clipped
 * first; a lower master cannot repair it).
 */
import { useRef, useState } from 'react';
import { colors } from '../../../../theme/tokens';
import { levelColorForDb } from '../../../../features/tools/levelColor';
import type { BezelItem } from '../../rack/rackTypes';
import { UnderstandingCheck } from '../../tuning/components/check';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import { Group, Line, vec } from '@shopify/react-native-skia';
import { BOOTH_MIXER_LEGENDS, BoothStage } from '../art/BoothStage';
import { METER_SCALE, meterSegY } from '../art/MixerTop';
import { INK } from '../art/ink';
import { SceneText } from '../art/sceneText';
import type { Xf } from '../art/Scene';
import { BOOTH_LAYOUT, onMixer, STRIP_X, MIXER } from '../geometry/boothGeometry';
import { DjRack } from '../DjRack';
import { Do, FaultCard, GoalChips, Look, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { ChipRow, boothKey, pct, stopKey, trimKey } from '../dock';
import { boothNow, getBooth, updateBooth } from '../booth/boothStore';
import { renderedSince } from './s1Guards';
import { cueAtBar, preMatched, useScreenSetup } from '../booth/setup';
import { TRIM_UNITY, dbStr, faderGain, levelKnobGain, trimPos, type InputSel } from '../model/djModel';
import { alignPhase } from '../model/djDeck';
import { averagesMatched, chanLevels, levelSet, type ChanLevels } from '../model/djLessons';
import { anyClip, peakCell, peakDb, useBoothKit } from './shared';

const TERMS = [
  { term: 'Trim (gain)', def: 'How much of the incoming signal the channel takes in. Set it once for each track — in your headphones, with that channel’s fader down — so the fader is left for the mix.' },
  { term: 'Average level', def: 'Where a meter sits most of the time: what your ears judge as loudness. Peaks are not loudness — a loud master reaches the same peak as a quiet one but sounds several dB louder.' },
  { term: 'Headroom', def: 'The space between your normal level and the top of the scale, where a stage clips (flattens the tops of the waveform: harsh, and turning a later stage down only makes the damage quieter). The loudest peaks must fit inside it.' },
  { term: 'dBFS', def: 'Decibels relative to digital full scale. 0 dBFS is the top of a digital stage; everything below is a negative number. This lab’s meters read dBFS.' },
] as const;

export const GOALS_GAIN = ['Find why CH2 is silent', 'Deck A: average −21…−15, peaks under −3', 'Deck B matched to A in cue, fader down', 'CH1 fader down: meter stays, MASTER falls', 'Fix the hidden overload', 'Pass the check'] as const;

/** The meters' scale and column names at phone size (screen points, 9.5 pt
 *  and up): dB marks level with their segments to the left of the CH1
 *  column, and CH1 · L · R · CH2 under the four columns. */
function MeterScaleStrip({ xf, k }: { xf: Xf; k: number }) {
  const X = (mx: number) => xf.ox + (BOOTH_LAYOUT.mixer.x + mx) * xf.s;
  const Y = (my: number) => xf.oy + (BOOTH_LAYOUT.mixer.y + my) * xf.s;
  const { xs, w, y, h } = MIXER.meters;
  const fs = Math.max(9.5, 9.5 * Math.sqrt(k));
  const names = ['CH1', 'L', 'R', 'CH2'];
  return (
    <Group>
      {METER_SCALE.map((m) => (
        <Group key={m.t}>
          <Line p1={vec(X(xs[0]) - 4, Y(meterSegY(m.db)))} p2={vec(X(xs[0]) - 1, Y(meterSegY(m.db)))} color={INK.print} strokeWidth={1} />
          <SceneText x={X(xs[0]) - 6} y={Y(meterSegY(m.db)) + fs * 0.36} size={fs} text={m.db === 0 ? 'CLIP' : m.t} color={m.db === 0 ? INK.peak : INK.print} face="label" align="right" minPt={9} />
        </Group>
      ))}
      {names.map((t, i) => (
        <SceneText key={t} x={X(xs[i] + w / 2)} y={Y(y + h) + fs * 1.25} size={fs} text={t} color={INK.amber} face="label" align="center" minPt={9} />
      ))}
    </Group>
  );
}

/** An AVERAGE readout with its peak under it (audio review #1: match by
 *  the average; the peak is only a ceiling). */
function avgCell(k: string, l: ChanLevels): BezelItem {
  const sub = l.peak == null ? undefined : l.peak >= 0 ? 'PK CLIP' : `PK ${l.peak.toFixed(1)}`;
  if (l.avg == null) return { k, v: '—', tint: colors.textSub, sub };
  return { k, v: l.avg.toFixed(1), vA11y: `average ${l.avg.toFixed(1)} dBFS${l.peak != null ? `, peak ${l.peak.toFixed(1)} dBFS` : ''}`, tint: levelSet(l) ? colors.green : levelColorForDb(l.avg + 12, -40, 0), sub };
}

type Lvl = 'f1' | 'f2' | 'master';
const LVL_WORD: Record<Lvl, string> = { f1: 'CH1 FADER', f2: 'CH2 FADER', master: 'MASTER' };

/** The input selectors (the top of each strip) and deck B's headphone cue,
 *  on the DECKS tray. */
function InputRows() {
  const b = getBooth();
  const setIn = (ch: 1 | 2, input: InputSel) => updateBooth((x) => ({ ...x, ch: { ...x.ch, [ch]: { ...x.ch[ch], input } } }));
  return (
    <>
      {([1, 2] as const).map((ch) => (
        <ChipRow key={ch} head={`CH${ch} INPUT SELECTOR (top of the strip) → ${b.ch[ch].input}`} chips={(['LINE', 'PHONO', 'USB'] as const).map((i) => ({ label: i, on: b.ch[ch].input === i, onPress: () => setIn(ch, i) }))} />
      ))}
      <ChipRow head="CUE 2 (deck B in your headphones)" chips={[{ label: b.ch[2].cue ? 'CUE 2 ON' : 'CUE 2 OFF', on: b.ch[2].cue, onPress: () => updateBooth((x) => ({ ...x, ch: { ...x.ch, 2: { ...x.ch[2], cue: !x.ch[2].cue } } })) }]} />
    </>
  );
}

function PageGain({ ctx }: { ctx: PageCtx }) {
  const { booth, audio, tr, motion } = useBoothKit({ lockPhase: true });
  const { wiredForYou } = useScreenSetup((b) => {
    let x = cueAtBar(b, 'A', 'nightFerry', 17);
    x = preMatched(cueAtBar(x, 'B', 'glassHarbour', 17));
    return {
      ...x,
      // both trims start where the last DJ left them; channel 2 is on the
      // wrong input (the find-it task), cued, with its fader down
      ch: { 1: { ...x.ch[1], input: 'LINE', trim: trimPos(-8), fader: 0.85, xf: 'THRU', cue: false }, 2: { ...x.ch[2], input: 'PHONO', trim: TRIM_UNITY, fader: 0, xf: 'THRU', cue: true } },
      mixer: { ...x.mixer, master: 0.6, cueMix: 0.5, splitCue: false },
      perspective: 'CROWD',
    };
  });
  const last = audio.last;
  const l1 = chanLevels(last, 1);
  const l2 = chanLevels(last, 2);
  const p1 = l1.peak;
  const pm = Math.max(peakDb(last, 'masterL') ?? -Infinity, peakDb(last, 'masterR') ?? -Infinity);
  const bothPlaying = booth.decks.A.playing && booth.decks.B.playing;
  const [lvl, setLvl] = useState<Lvl>('f1');
  const [foundInput, setFoundInput] = useState(false);
  const [checkDone, setCheckDone] = useState(false);
  const [faultFixed, setFaultFixed] = useState(false);
  // the booth time the fault was started at: "fixed" is judged only on a
  // render made after it (a chunk from before showed the clean booth, so
  // START THE FAULT read Fixed at once — toddler test 2026-10-19)
  const faultAt = useRef<number | null>(null);
  const c2 = booth.ch[2];
  if (!foundInput && booth.decks.B.playing && c2.input === 'LINE' && l2.avg != null) setFoundInput(true);
  const hits = [
    foundInput,
    booth.decks.A.playing && levelSet(l1),
    bothPlaying && c2.cue && c2.fader <= 0.05 && c2.input === 'LINE' && averagesMatched(l1, l2) && !!last && !anyClip(last),
    booth.decks.A.playing && booth.ch[1].fader <= 0.3 && p1 != null && p1 > -40 && (pm === -Infinity || pm < p1 - 6),
    faultFixed,
    checkDone,
  ];
  const goals = GOALS_GAIN.map((label, i) => ({ label, hit: hits[i] }));
  const latched = useVisitGoals(ctx, goals, 'GAIN');
  const busOver = !!last && last.clipped.bus > 0;
  const wrongInput = c2.input !== 'LINE';
  const lvlValue = lvl === 'master' ? booth.mixer.master : booth.ch[lvl === 'f1' ? 1 : 2].fader;

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
              view: 'mixerUpper',
              highlight: { mixer: ['trim1', 'trim2', 'meters', 'busOver', 'master', ...(wrongInput ? (['input2'] as const) : [])] },
              callouts: [
                { id: 't1', text: 'TRIM 1', at: onMixer(STRIP_X[1] - 9, MIXER.trim.y), dx: -16, dy: 0 },
                { id: 't2', text: 'TRIM 2', at: onMixer(STRIP_X[2] + 9, MIXER.trim.y), dx: 16, dy: 0 },
                { id: 'bo', text: 'BUS OVER', at: onMixer(MIXER.busOver.x + 3, MIXER.busOver.y), dx: 26, dy: -6, tone: 'red' },
                { id: 'ms', text: 'MASTER', at: onMixer(MIXER.master.x - 10, MIXER.master.y + 4), dx: -14, dy: 22 },
                ...(wrongInput && booth.decks.B.playing ? [{ id: 'in2', text: `CH2 INPUT: ${c2.input}`, at: onMixer(STRIP_X[2] + 16, MIXER.inputSel.y), dx: 18, dy: -6, tone: 'red' as const }] : []),
              ],
              obstacles: [{ x: BOOTH_LAYOUT.mixer.x + 64, y: BOOTH_LAYOUT.mixer.y + MIXER.meters.y - 6, w: 44, h: MIXER.meters.h + 12 }, { x: BOOTH_LAYOUT.mixer.x + 100, y: BOOTH_LAYOUT.mixer.y + MIXER.meters.y + MIXER.meters.h, w: 72, h: 16 }],
              // the printed legends (TRIM, CH 1, MASTER …) keep the callouts
              // off them once a zoom makes them legible (as on Screens 2 and 7)
              printed: BOOTH_MIXER_LEGENDS,
              screenOverlay: (_W, _H, xf, k) => <MeterScaleStrip xf={xf} k={k} />,
              a11y: `The mixer from above: the two input selectors, the two TRIM knobs, the four meters (channel 1, master left, master right, channel 2) and the BUS OVER light. Channel 2 listens to ${c2.input}.`,
            }}
          />
        ),
        bezel: [avgCell('CH1 AVG', l1), avgCell('CH2 AVG', l2), { ...peakCell('MASTER', pm === -Infinity ? null : pm), flex: 1.35 }, { k: 'MIX BUS', v: busOver ? 'OVER' : last ? 'CLEAN' : '—', tint: busOver ? '#ff5a48' : last ? '#5bff85' : colors.textSub, flex: 0.85 }],
        params: [
          trimKey(booth, 1),
          trimKey(booth, 2),
          {
            kind: 'fader',
            id: 'levels',
            label: 'LEVELS',
            value: lvlValue,
            level: true,
            home: lvl === 'master' ? 0.75 : undefined,
            onChange: (v) =>
              updateBooth((b) => (lvl === 'master' ? { ...b, mixer: { ...b.mixer, master: v } } : { ...b, ch: { ...b.ch, [lvl === 'f1' ? 1 : 2]: { ...b.ch[lvl === 'f1' ? 1 : 2], fader: v } } })),
            format: (v) => `${LVL_WORD[lvl]} ${pct(v)} · ${dbStr(20 * Math.log10(Math.max(1e-6, lvl === 'master' ? levelKnobGain(v) : faderGain(v))))}`,
            formatShort: (v) => `${lvl === 'master' ? 'MST' : lvl === 'f1' ? 'CH1' : 'CH2'} ${pct(v)}`,
            chooser: {
              title: 'WHICH LEVEL',
              options: [
                { id: 'f1', label: 'CH1 FADER', blurb: 'Channel 1 into the mix. Its meter reads BEFORE it, so the CH1 meter does not move.' },
                { id: 'f2', label: 'CH2 FADER', blurb: 'Channel 2 into the mix. Keep it down while you set TRIM 2 in your headphones.' },
                { id: 'master', label: 'MASTER', blurb: 'The output to the PA, after the mix bus. It cannot undo a clip that happened earlier.' },
              ],
              selectedId: lvl,
              onSelect: (id) => setLvl(id as Lvl),
            },
          },
          boothKey(booth, tr, ['A', 'B'], () => <InputRows />),
          stopKey(tr),
        ],
        initialParam: 'trim1',
      }}
    >
      {wiredForYou ? <Note>The booth is wired and powered for you on this screen (Screen 4 shows how).</Note> : null}
      <Step n={1}>
        <Look>You are looking at the mixer from above: the two input selectors at the top, the two TRIM knobs, the four meters (channel 1, master left, master right, channel 2) with their scale, and the BUS OVER light.</Look>
        <P>The TRIM sets how much of a track comes into its channel; set it once per track, so the channel fader is left for the mix.</P>
        <P>On this mixer each channel’s meter reads after TRIM, EQ and FILTER, before the fader; the MASTER meters read the output, after the MASTER knob. Match two tracks by their AVERAGE level — where the meter sits most of the time — and use the peak only as a ceiling.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Open DECKS and play deck A. Ride TRIM 1 and watch CH1 AVG on the readout strip: the average in dBFS, with the peak (PK) under it.</Do>
        <P>Then open LEVELS → CH1 FADER and pull it down: the CH1 meter stays where it was while MASTER falls — the channel meter reads BEFORE the fader. Bring it back up.</P>
        <P>Now play deck B too. CH2 reads “—”: something BEFORE its trim decides what channel 2 listens to. Find it (it is at the top of the strip; its switch is in DECKS).</P>
      </Step>
      <Step n={3}>
        <P>Deck B is cued in your headphones with its fader down, so the crowd never hears you set it — LISTEN as PHONES to hear it against the mix. Glass Harbor was mastered LOUD: at the same trim it sits about 11 dB higher on average, though its peaks are only about 6 dB higher.</P>
        <Note>Peaks are not loudness. A loud master reaches the same peak as a quiet one but sounds several dB louder. Match where each meter sits most of the time, and check by ear in your headphones; use the peak only to stay out of the red.</Note>
        <P>Push both trims and both faders up and watch BUS OVER: the channels can be clean while their SUM is too big. On this mixer the mix bus (where the channels add up after their faders) has its own limit — many analog mixers do; many digital ones have more room inside. Wherever a stage clips, a later control cannot undo it.</P>
        <Note>Every meter in this lab reads dBFS of this mixer’s own scale: 0 dBFS is where a stage clips. A real analog mixer’s meter often puts 0 at a reference level with room above it, so check how your own mixer is marked.</Note>
      </Step>
      <Step n={4}>
        <Do>Bring deck A’s average into −21…−15 dBFS with its peaks under −3. Then, with deck B cued and its fader down, set TRIM 2 until CH2 AVG sits within 2 dB of CH1 AVG — the crowd never hears you do it.</Do>
        <P>That leaves headroom for EQ boosts and for the moment both tracks play together. These are suggested starting points, not rules — use your ears and the room.</P>
        <Note>Deck B’s tempo has been matched to deck A for you — Screen 10 shows how.</Note>
        <GoalChips goals={goals.slice(0, 4)} latched={latched.slice(0, 4)} />
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow="CHECK YOURSELF"
          question="Two tracks both peak at −6 dBFS, but one sounds much louder. Why, and how do you match them?"
          options={[
            'One has a higher average level — match where the meters sit most of the time, and check by ear in cue',
            'The peaks match, so they are already matched — the ear is wrong',
            'Turn the louder one up until it clips, then back off',
            'Match them with the channel faders during the mix',
          ]}
          correct={0}
          explain="Loudness follows the average level, not the peak. A loud, heavily mastered track sits high on the meter most of the time; a dynamic one only touches the same peak now and then. Set the trims so the averages match, check in your headphones, and keep the peaks under the ceiling."
          wrong={[undefined, 'Equal peaks say nothing about loudness: the average decides how loud it sounds.', 'Clipping is the one place you never want to go; the peak is only a ceiling.', 'The faders are for the performance; set the trims so both tracks start matched.']}
          onCorrect={() => setCheckDone(true)}
        />
        <FaultCard
          title="CRACKLE, BUT THE MASTER LOOKS FINE"
          symptom="Both decks are playing. The sound is harsh and crackly, yet the MASTER meters stay well below the top."
          start={() => {
            void audio.requestSound();
            faultAt.current = boothNow();
            updateBooth((b, t) => {
              let x = b;
              for (const d of ['A', 'B'] as const) x = { ...x, decks: { ...x.decks, [d]: { ...x.decks[d], playing: true, at: t } } };
              x = alignPhase(x, t, 'B');
              return { ...x, ch: { 1: { ...x.ch[1], input: 'LINE', trim: trimPos(9), fader: 1 }, 2: { ...x.ch[2], input: 'LINE', trim: trimPos(4), fader: 1 } }, mixer: { ...x.mixer, master: 0.32 } };
            });
          }}
          fixed={bothPlaying && !!last && renderedSince(last, faultAt.current) && last.clipped.bus === 0 && last.clipped.ch1 === 0 && last.clipped.ch2 === 0}
          hints={['Look past the MASTER meters: is the BUS OVER light flashing?', 'Turning the MASTER down made it quieter, not cleaner.', 'Bring the TRIMS down until the channel meters and the bus stay out of the red.']}
          why="On this mixer the mix bus was clipping before the MASTER knob. Lowering the trims (the stage that was too hot) removed the clipping; the master only ever set how loud the damage was."
          onFixed={() => setFaultFixed(true)}
        />
        <GoalChips goals={goals.slice(4)} latched={latched.slice(4)} />
      </Step>
    </DjRack>
  );
}

export const P06: PageDef = { title: 'Set gain and read meters', short: 'GAIN', Component: PageGain, manualDone: true, rack: true };
