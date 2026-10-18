/**
 * Screen 9 — EQ isolators and filters (research DJ15): frequency bands, boosts
 * and cuts, isolator kills, high- and low-pass filters, resonance, and
 * managing two bass lines. The response plot is the channel's real EQ +
 * filter magnitude from the same model the audio uses (djDsp.isolatorMag ×
 * filterMag): bands at 250 Hz and 2.5 kHz, +6 dB to −26 dB then a kill,
 * filters at 12 dB/oct. The fault: a boomy, muddy blend (two full low ends).
 */
import { useRef, useState } from 'react';
import { colors } from '../../../../theme/tokens';
import { UnderstandingCheck } from '../../tuning/components/check';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import { BoothStage } from '../art/BoothStage';
import { EqPlot } from '../art/plots';
import { BOOTH_LAYOUT, MIXER, MIXER_W, STRIP_X, onMixer } from '../geometry/boothGeometry';
import { DjRack } from '../DjRack';
import { Do, FaultCard, GoalChips, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { BoothTray, stopKey } from '../dock';
import { getBooth, updateBooth } from '../booth/boothStore';
import { cueAtBar, useScreenSetup } from '../booth/setup';
import { dbStr, eqDb, filterQ, type Booth, type ChannelId } from '../model/djModel';
import { filterOf } from '../engine/djDsp';
import { useBoothKit } from './shared';

const TERMS = [
  { term: 'EQ band', def: 'A slice of the frequency range with its own knob. This mixer has three: LOW (below about 250 Hz), MID, and HIGH (above about 2.5 kHz).' },
  { term: 'Isolator', def: 'An EQ whose cut goes all the way: at the end stop a band is removed (a “kill”), not just turned down. Boost is small (+6 dB here); cut is deep.' },
  { term: 'Kill', def: 'A band switched fully off. Killing deck B’s LOW lets its kick and bass wait while deck A’s carry the floor.' },
  { term: 'High-pass / low-pass filter', def: 'A high-pass lets the highs through and removes the lows (the sound gets thinner); a low-pass lets the lows through and removes the highs (the sound gets darker and further away).' },
  { term: 'Resonance', def: 'A peak at the filter’s edge. A little adds character to a sweep; a lot whistles — and costs headroom.' },
  { term: 'Masking', def: 'When two sounds share the same range, each hides part of the other. Two kicks and two bass lines at once is the classic case: louder, but blurred.' },
] as const;

type Band = 'hi' | 'mid' | 'lo';
const BANDS: Band[] = ['hi', 'mid', 'lo'];
const BAND_WORD: Record<Band, string> = { hi: 'HIGH', mid: 'MID', lo: 'LOW' };

function PageEq({ ctx }: { ctx: PageCtx }) {
  const { booth, audio, tr, motion } = useBoothKit();
  useScreenSetup((b) => {
    let x = cueAtBar(b, 'A', 'nightFerry', 17);
    x = cueAtBar(x, 'B', 'glassHarbour', 17);
    const flat = { hi: 0.5, mid: 0.5, lo: 0.5 };
    return { ...x, ch: { 1: { ...x.ch[1], fader: 0.85, xf: 'THRU', eq: flat, filter: 0 }, 2: { ...x.ch[2], fader: 0.85, xf: 'THRU', eq: flat, filter: 0, trim: 0.47 } }, mixer: { ...x.mixer, resonance: 0.1 }, perspective: 'CROWD' };
  });
  const [eqSel, setEqSel] = useState<{ ch: ChannelId; band: Band }>({ ch: 2, band: 'lo' });
  const [filtCh, setFiltCh] = useState<ChannelId>(1);
  const [plotCh, setPlotCh] = useState<ChannelId>(2);
  const [check, setCheck] = useState(false);
  const [faultFixed, setFaultFixed] = useState(false);
  const hand = useRef({ start: false, done: false, swept: false, res: false });
  const both = booth.decks.A.playing && booth.decks.B.playing;
  const lo1 = booth.ch[1].eq.lo;
  const lo2 = booth.ch[2].eq.lo;
  if (both && lo1 >= 0.45 && lo2 <= 0.1) hand.current.start = true;
  if (hand.current.start && both && lo1 <= 0.1 && lo2 >= 0.45) hand.current.done = true;
  const anyPlay = booth.decks.A.playing || booth.decks.B.playing;
  if (anyPlay && (Math.abs(booth.ch[1].filter) > 0.6 || Math.abs(booth.ch[2].filter) > 0.6)) hand.current.swept = true;
  if (anyPlay && booth.mixer.resonance >= 0.6 && (Math.abs(booth.ch[1].filter) > 0.2 || Math.abs(booth.ch[2].filter) > 0.2)) hand.current.res = true;
  const goals = [
    { label: 'Kill deck B’s LOW', hit: booth.decks.B.playing && lo2 <= 0.04 },
    { label: 'Hand the bass from A to B', hit: hand.current.done },
    { label: 'Sweep a filter', hit: hand.current.swept },
    { label: 'Hear the resonance', hit: hand.current.res },
    { label: 'Clean up the muddy blend', hit: faultFixed },
    { label: 'Pass the check', hit: check },
  ];
  const latched = useVisitGoals(ctx, goals);
  const c = booth.ch[plotCh];
  const fs = filterOf(c.filter, filterQ(booth.mixer.resonance));
  const filtWord = fs.kind === 'off' ? 'OFF' : `${fs.kind === 'lp' ? 'LP' : 'HP'} ${fs.hz >= 1000 ? `${(fs.hz / 1000).toFixed(1)}k` : Math.round(fs.hz)} Hz`;
  const bandDb = (v: number) => (eqDb(v) === -Infinity ? 'KILL' : dbStr(eqDb(v)));
  const plotH = (h: number) => Math.round(Math.min(132, h * 0.42));
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
              view: { x: BOOTH_LAYOUT.mixer.x - 6, y: 44, w: MIXER_W + 12, h: 178 },
              fit: (W, H) => ({ x: 0, y: plotH(H), w: W, h: H - plotH(H) }),
              highlight: { mixer: [`eq${eqSel.ch}` as 'eq1', `filter${filtCh}` as 'filter1'] },
              callouts: [
                { id: 'hi', text: 'HIGH', at: onMixer(STRIP_X[1] + 10, MIXER.hi.y), dx: 10, dy: 0 },
                { id: 'mid', text: 'MID', at: onMixer(STRIP_X[1] + 10, MIXER.mid.y), dx: 10, dy: 0 },
                { id: 'lo', text: 'LOW', at: onMixer(STRIP_X[1] + 10, MIXER.lo.y), dx: 10, dy: 0 },
                { id: 'fl', text: 'FILTER', at: onMixer(STRIP_X[2] - 11, MIXER.filter.y), dx: -10, dy: 0 },
              ],
              screenOverlay: (W, H) => <EqPlot b={{ x: 8, y: 6, w: W - 16, h: plotH(H) - 10 }} ch={c} resonance={booth.mixer.resonance} label={`CH${plotCh} EQ + FILTER`} />,
              a11y: `The mixer's EQ and filter knobs, under the frequency response of channel ${plotCh}.`,
            }}
          />
        ),
        bezel: [
          { k: `CH${plotCh} LOW`, v: bandDb(c.eq.lo), tint: c.eq.lo <= 0.04 ? '#ff8a7e' : colors.textPrimary },
          { k: 'MID', v: bandDb(c.eq.mid), tint: colors.textPrimary },
          { k: 'HIGH', v: bandDb(c.eq.hi), tint: colors.textPrimary },
          { k: 'FILTER', v: filtWord, tint: fs.kind === 'off' ? colors.textSub : '#8fbcff' },
        ],
        params: [
          {
            kind: 'fader',
            id: 'eq',
            label: 'EQ',
            value: booth.ch[eqSel.ch].eq[eqSel.band],
            home: 0.5,
            onChange: (v) => updateBooth((b: Booth) => ({ ...b, ch: { ...b.ch, [eqSel.ch]: { ...b.ch[eqSel.ch], eq: { ...b.ch[eqSel.ch].eq, [eqSel.band]: v } } } })),
            format: (v) => `CH${eqSel.ch} ${BAND_WORD[eqSel.band]} ${bandDb(v)}`,
            formatShort: (v) => `${eqSel.ch}${BAND_WORD[eqSel.band][0]} ${eqDb(v) === -Infinity ? 'KILL' : Math.round(eqDb(v))}`,
            chooser: {
              title: 'WHICH EQ KNOB',
              options: ([1, 2] as const).flatMap((ch) => BANDS.map((bd) => ({ id: `${ch}${bd}`, label: `CH${ch} ${BAND_WORD[bd]}`, blurb: bd === 'lo' ? 'Below about 250 Hz: the kick and the bass line.' : bd === 'mid' ? 'About 250 Hz – 2.5 kHz: chords, voices, the body of a track.' : 'Above about 2.5 kHz: hats, cymbals, air.' }))),
              selectedId: `${eqSel.ch}${eqSel.band}`,
              onSelect: (id) => {
                const ch = Number(id[0]) as ChannelId;
                setEqSel({ ch, band: id.slice(1) as Band });
                setPlotCh(ch);
              },
            },
          },
          {
            kind: 'fader',
            id: 'filter',
            label: 'FILTER',
            value: (booth.ch[filtCh].filter + 1) / 2,
            home: 0.5,
            onChange: (v) => updateBooth((b: Booth) => ({ ...b, ch: { ...b.ch, [filtCh]: { ...b.ch[filtCh], filter: Math.abs(v * 2 - 1) < 0.015 ? 0 : v * 2 - 1 } } })),
            format: (v) => {
              const k = v * 2 - 1;
              return Math.abs(k) <= 0.03 ? `CH${filtCh} FILTER OFF` : `CH${filtCh} ${k < 0 ? 'LOW-PASS' : 'HIGH-PASS'} ${Math.round(Math.abs(k) * 100)}%`;
            },
            formatShort: (v) => {
              const k = v * 2 - 1;
              return Math.abs(k) <= 0.03 ? `${filtCh} OFF` : `${filtCh} ${k < 0 ? 'LP' : 'HP'}`;
            },
            chooser: {
              title: 'WHICH FILTER',
              options: [
                { id: '1', label: 'CH1 FILTER', blurb: 'Left of centre: low-pass (darker). Right: high-pass (thinner). Centre: off.' },
                { id: '2', label: 'CH2 FILTER', blurb: 'Left of centre: low-pass (darker). Right: high-pass (thinner). Centre: off.' },
              ],
              selectedId: String(filtCh),
              onSelect: (id) => {
                setFiltCh(Number(id) as ChannelId);
                setPlotCh(Number(id) as ChannelId);
              },
            },
          },
          {
            kind: 'fader',
            id: 'res',
            label: 'RESONANCE',
            value: booth.mixer.resonance,
            onChange: (v) => updateBooth((b) => ({ ...b, mixer: { ...b.mixer, resonance: v } })),
            format: (v) => `RESONANCE ${Math.round(v * 100)}% (Q ${filterQ(v).toFixed(1)})`,
            formatShort: (v) => `${Math.round(v * 100)}%`,
          },
          { kind: 'group', id: 'decks', label: 'DECKS', valueLabel: (['A', 'B'] as const).filter((d) => booth.decks[d].playing).join('+') || '—', render: () => <BoothTray booth={getBooth()} tr={tr} /> },
          stopKey(tr),
        ],
        initialParam: 'eq',
      }}
    >
      <Step n={1}>
        <P>Each channel’s EQ splits its sound into three bands — LOW, MID and HIGH. On this mixer they cross over at about 250 Hz and 2.5 kHz. Each knob boosts a little (up to +6 dB) and cuts a lot (down to −26 dB), and at its end stop it KILLS the band. That deep cut is what makes it an isolator.</P>
        <P>The FILTER is one knob: turn left for a low-pass (darker, further away), right for a high-pass (thinner), centre for off. Its slope here is 12 dB per octave; RESONANCE adds a peak at its edge.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Open DECKS and play both. Pick EQ → CH2 LOW and turn it down to KILL. Watch the plot: the low end falls away; the mids and highs stay.</Do>
      </Step>
      <Step n={3}>
        <P>Listen as the CROWD with both lows up: two kicks and two bass lines fight — louder, but blurry. Kill one LOW and the blend clears up: that is masking going away.</P>
        <P>Sweep a FILTER slowly, then raise RESONANCE and sweep again: you hear the peak ride up and down. A little adds movement; a lot whistles and eats headroom.</P>
      </Step>
      <Step n={4}>
        <Do>Kill deck B’s LOW, then hand the bass over: bring B’s LOW up as you take A’s LOW down. Then sweep a filter, and try it with resonance.</Do>
        <P>A bass handover is one way to blend, not the only way. Some tracks blend fine with both lows partly down; some sound better with a filter. Compare at the same level and trust what you hear in the room.</P>
        <GoalChips goals={goals.slice(0, 4)} latched={latched.slice(0, 4)} />
        <Note>These ranges, crossovers and slopes are this lab’s mixer. Real mixers differ — some isolators cut to −∞ across the whole knob, some EQs only cut −12 dB. Check your own.</Note>
      </Step>
      <Step n={5}>
        <UnderstandingCheck
          eyebrow="CHECK YOURSELF"
          question="Both decks play with every EQ at 12 o’clock. The mix sounds loud but muddy in the low end. What is the most likely cause, and a first fix to try?"
          options={['Two low ends masking each other — cut the LOW on one deck', 'The HIGH is too quiet — boost both HIGHs', 'The filter is broken — reset the mixer', 'The MASTER is too high — that is all']}
          correct={0}
          explain="Two kicks and two bass lines share the same range and blur each other. Cutting one deck’s LOW (or killing it, then handing over) clears it. A HIGH boost only adds more level on top."
          wrong={[undefined, 'More high end makes it louder and harsher; the mud is still in the lows.', 'Nothing is broken — this is what two full low ends sound like.', 'Turning everything down keeps the mud, just quieter.']}
          onCorrect={() => setCheck(true)}
        />
        <FaultCard
          title="A BOOMY, MUDDY BLEND"
          symptom="Both decks are up for a blend and the low end turns to mud — the kicks blur and the bass booms."
          start={() => {
            void audio.requestSound();
            updateBooth((b, t) => ({
              ...b,
              decks: { A: { ...b.decks.A, playing: true, at: t }, B: { ...b.decks.B, playing: true, at: t } },
              ch: { 1: { ...b.ch[1], fader: 1, xf: 'THRU', eq: { hi: 0.5, mid: 0.5, lo: 0.75 }, filter: 0 }, 2: { ...b.ch[2], fader: 1, xf: 'THRU', eq: { hi: 0.5, mid: 0.5, lo: 0.75 }, filter: 0 } },
              perspective: 'CROWD',
            }));
          }}
          fixed={booth.decks.A.playing && booth.decks.B.playing && booth.ch[1].fader > 0.5 && booth.ch[2].fader > 0.5 && Math.min(booth.ch[1].eq.lo, booth.ch[2].eq.lo) <= 0.35}
          hints={['Look at both LOW knobs.', 'Both lows are boosted, on two bass-heavy tracks at full faders.', 'Take one deck’s LOW well down (or kill it) for the blend.']}
          why="Two boosted low ends were masking each other. With one deck’s LOW cut, its kick and bass make room for the other’s — the blend is cleaner and you have headroom back."
          onFixed={() => setFaultFixed(true)}
        />
        <GoalChips goals={goals.slice(4)} latched={latched.slice(4)} />
      </Step>
    </DjRack>
  );
}

export const P09: PageDef = { title: 'EQ isolators and filters', short: 'EQ', Component: PageEq, manualDone: true, rack: true };
