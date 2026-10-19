/**
 * Screen 9 — EQ isolators and filters (research DJ15): frequency bands, boosts
 * and cuts, isolator kills, high- and low-pass filters, resonance, and
 * managing two bass lines. The response plot is the channel's real EQ +
 * filter magnitude from the same model the audio uses (djDsp.isolatorMag ×
 * filterMag): bands at 250 Hz and 2.5 kHz, +6 dB to −26 dB then a kill,
 * filters at 12 dB/oct. The fault: a boomy, muddy blend (two full low ends).
 * Deck B starts tempo-matched and phase-locked to deck A (audio review #2):
 * an EQ blend is never judged on drifting beats.
 */
import { useRef, useState } from 'react';
import { colors } from '../../../../theme/tokens';
import { UnderstandingCheck } from '../../tuning/components/check';
import type { PageCtx, PageDef } from '../../kit/PagedLab';
import { BoothStage } from '../art/BoothStage';
import { EqPlot } from '../art/plots';
import { BOOTH_LAYOUT, MIXER, MIXER_W, STRIP_X, onMixer } from '../geometry/boothGeometry';
import { DjRack } from '../DjRack';
import { Do, FaultCard, GoalChips, Look, Note, P, Step, Terms, useVisitGoals } from '../bits';
import { boothKey, stopKey } from '../dock';
import { updateBooth } from '../booth/boothStore';
import { cueAtBar, preMatched, useScreenSetup } from '../booth/setup';
import { TRIM_UNITY, dbStr, eqDb, filterQ, trimPos, type Booth, type ChannelId } from '../model/djModel';
import { alignPhase } from '../model/djDeck';
import { filterOf } from '../engine/djDsp';
import { useBoothKit } from './shared';

const TERMS = [
  { term: 'EQ band', def: 'A slice of the frequency range with its own knob. This mixer has three: LOW (below about 250 Hz), MID, and HIGH (above about 2.5 kHz).' },
  { term: 'Isolator', def: 'An EQ whose cut goes all the way: at the end stop a band is removed — a “kill” — not just turned down. Boost is small (+6 dB here); cut is deep.' },
  { term: 'Filter', def: 'One knob for a sweep: a high-pass (right) lets the highs through and removes the lows — thinner; a low-pass (left) removes the highs — darker, further away.' },
  { term: 'Resonance', def: 'A peak at the filter’s edge. A little adds character to a sweep; a lot whistles — and costs headroom. It does nothing while the filter is off.' },
] as const;

export const GOALS_EQ = ['Kill deck B’s LOW', 'Hand the bass from A to B', 'Hear the resonance', 'Make deck A sound far away (no EQ)', 'Clean up the muddy blend', 'Pass the check'] as const;

type Band = 'hi' | 'mid' | 'lo';
const BAND_WORD: Record<Band, string> = { hi: 'HIGH', mid: 'MID', lo: 'LOW' };
/** What the EQ+FILTER key moves (the LOWs have keys of their own). */
type Sel = '1hi' | '1mid' | '2hi' | '2mid' | 'f1' | 'f2' | 'res';
type Focus = Sel | 'lo1' | 'lo2';
const SEL_WORD: Record<Sel, string> = { '1hi': 'CH1 HIGH', '1mid': 'CH1 MID', '2hi': 'CH2 HIGH', '2mid': 'CH2 MID', f1: 'CH1 FILTER', f2: 'CH2 FILTER', res: 'RESONANCE' };
const chOf = (f: Focus): ChannelId => (f === 'res' ? 1 : f === 'lo1' || f === 'f1' || f.startsWith('1') ? 1 : 2);

function PageEq({ ctx }: { ctx: PageCtx }) {
  const { booth, audio, tr, motion } = useBoothKit({ lockPhase: true });
  useScreenSetup((b) => {
    let x = cueAtBar(b, 'A', 'nightFerry', 17);
    x = preMatched(cueAtBar(x, 'B', 'glassHarbour', 17));
    const flat = { hi: 0.5, mid: 0.5, lo: 0.5 };
    // the trims matched by average (Screen 6), so the two low ends are equals
    return { ...x, ch: { 1: { ...x.ch[1], trim: TRIM_UNITY, fader: 0.85, xf: 'THRU', eq: flat, filter: 0 }, 2: { ...x.ch[2], fader: 0.85, xf: 'THRU', eq: flat, filter: 0, trim: trimPos(-11) } }, mixer: { ...x.mixer, resonance: 0.1 }, perspective: 'CROWD' };
  });
  const [sel, setSel] = useState<Sel>('f1');
  const [focus, setFocus] = useState<Focus>('lo2');
  const [check, setCheck] = useState(false);
  const [faultFixed, setFaultFixed] = useState(false);
  const hand = useRef({ start: false, done: false, res: false, far: false });
  const both = booth.decks.A.playing && booth.decks.B.playing;
  const lo1 = booth.ch[1].eq.lo;
  const lo2 = booth.ch[2].eq.lo;
  if (both && lo1 >= 0.45 && lo2 <= 0.1) hand.current.start = true;
  if (hand.current.start && both && lo1 <= 0.1 && lo2 >= 0.45) hand.current.done = true;
  const anyPlay = booth.decks.A.playing || booth.decks.B.playing;
  if (anyPlay && booth.mixer.resonance >= 0.6 && (Math.abs(booth.ch[1].filter) > 0.2 || Math.abs(booth.ch[2].filter) > 0.2)) hand.current.res = true;
  // the independent challenge (learning p09 #6): far away = CH1 low-pass past 60 %
  if (booth.decks.A.playing && booth.ch[1].filter < -0.6) hand.current.far = true;
  const hits = [booth.decks.B.playing && lo2 <= 0.04, hand.current.done, hand.current.res, hand.current.far, faultFixed, check];
  const goals = GOALS_EQ.map((label, i) => ({ label, hit: hits[i] }));
  const latched = useVisitGoals(ctx, goals, 'EQ');
  const plotCh = chOf(focus);
  const c = booth.ch[plotCh];
  const filtersOff = booth.ch[1].filter === 0 && booth.ch[2].filter === 0;
  const fWord = (ch: ChannelId) => {
    const fs = filterOf(booth.ch[ch].filter, filterQ(booth.mixer.resonance));
    return fs.kind === 'off' ? 'OFF' : `${fs.kind === 'lp' ? 'LP' : 'HP'} ${fs.hz >= 1000 ? `${(fs.hz / 1000).toFixed(1)}k` : Math.round(fs.hz)}`;
  };
  const filtCh: ChannelId = sel === 'f2' ? 2 : sel === 'f1' ? 1 : booth.ch[2].filter !== 0 && booth.ch[1].filter === 0 ? 2 : 1;
  const bandDb = (v: number) => (eqDb(v) === -Infinity ? 'KILL' : dbStr(eqDb(v)));
  const shortDb = (v: number) => (eqDb(v) === -Infinity ? 'KILL' : `${Math.round(eqDb(v))}`);
  const plotH = (h: number, k = 1) => Math.round(Math.min(132 * k, h * 0.42));
  // every label follows the knob it names, on its strip's OUTER side (CH1 left, CH2 right)
  const outer = (ch: ChannelId) => (ch === 1 ? -1 : 1);
  const knobY = { hi: MIXER.hi.y, mid: MIXER.mid.y, lo: MIXER.lo.y } as const;
  const focusBand: Band | null = focus === 'lo1' || focus === 'lo2' ? 'lo' : focus.endsWith('hi') ? 'hi' : focus.endsWith('mid') ? 'mid' : null;
  const setLow = (ch: ChannelId, v: number) => updateBooth((b: Booth) => ({ ...b, ch: { ...b.ch, [ch]: { ...b.ch[ch], eq: { ...b.ch[ch].eq, lo: v } } } }));
  const lowKey = (ch: ChannelId) => ({
    kind: 'fader' as const,
    id: `lo${ch}`,
    label: `LOW ${ch}`,
    value: booth.ch[ch].eq.lo,
    home: 0.5,
    onChange: (v: number) => {
      if (focus !== `lo${ch}`) setFocus(`lo${ch}` as Focus);
      setLow(ch, v);
    },
    format: (v: number) => `CH${ch} LOW ${bandDb(v)}`,
    formatShort: (v: number) => (eqDb(v) === -Infinity ? 'KILL' : `${shortDb(v)} dB`),
  });
  const selValue = sel === 'res' ? booth.mixer.resonance : sel === 'f1' || sel === 'f2' ? (booth.ch[sel === 'f1' ? 1 : 2].filter + 1) / 2 : booth.ch[Number(sel[0]) as ChannelId].eq[sel.slice(1) as Band];
  const onSel = (v: number) => {
    if (focus !== sel) setFocus(sel);
    if (sel === 'res') return updateBooth((b) => ({ ...b, mixer: { ...b.mixer, resonance: v } }));
    if (sel === 'f1' || sel === 'f2') {
      const ch: ChannelId = sel === 'f1' ? 1 : 2;
      return updateBooth((b: Booth) => ({ ...b, ch: { ...b.ch, [ch]: { ...b.ch[ch], filter: Math.abs(v * 2 - 1) < 0.015 ? 0 : v * 2 - 1 } } }));
    }
    const ch = Number(sel[0]) as ChannelId;
    const band = sel.slice(1) as Band;
    updateBooth((b: Booth) => ({ ...b, ch: { ...b.ch, [ch]: { ...b.ch[ch], eq: { ...b.ch[ch].eq, [band]: v } } } }));
  };
  const fmtSel = (v: number, short: boolean) => {
    if (sel === 'res') return short ? `RES ${Math.round(v * 100)}%` : `RESONANCE ${Math.round(v * 100)}%`;
    if (sel === 'f1' || sel === 'f2') {
      const ch = sel === 'f1' ? 1 : 2;
      const k = v * 2 - 1;
      if (Math.abs(k) <= 0.03) return `CH${ch} OFF`;
      return short ? `${ch} ${k < 0 ? 'LP' : 'HP'} ${Math.round(Math.abs(k) * 100)}` : `CH${ch} ${k < 0 ? 'LOW-PASS' : 'HIGH-PASS'} ${Math.round(Math.abs(k) * 100)}%`;
    }
    const ch = sel[0];
    const band = BAND_WORD[sel.slice(1) as Band];
    return short ? `${ch} ${band} ${shortDb(v)}` : `CH${ch} ${band} ${bandDb(v)}`;
  };
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
              // the EQ and filter knobs down to the RESONANCE knob
              view: { x: BOOTH_LAYOUT.mixer.x - 6, y: 84, w: MIXER_W + 12, h: 198 },
              fit: (W, H, k) => ({ x: 0, y: plotH(H, k), w: W, h: H - plotH(H, k) }),
              // only the knob being moved is ringed, and it carries the callout
              highlight: { mixer: [focusBand ? (`${focusBand}${plotCh}` as 'hi1') : focus === 'res' ? 'resonance' : (`filter${filtCh}` as 'filter1')] },
              callouts: [
                ...(focusBand ? [{ id: 'eq', text: `CH${plotCh} ${BAND_WORD[focusBand]}`, at: onMixer(STRIP_X[plotCh] + outer(plotCh) * 11, knobY[focusBand]), dx: outer(plotCh) * 12, dy: 0 }] : []),
                { id: 'fl', text: `CH${filtCh} FILTER`, at: onMixer(STRIP_X[filtCh] + outer(filtCh) * 12, MIXER.filter.y), dx: outer(filtCh) * 12, dy: 0, tone: 'blue' as const },
                ...(focus === 'res' ? [{ id: 'rs', text: filtersOff ? 'RESONANCE (NO FILTER ON)' : 'RESONANCE', at: onMixer(MIXER.resonance.x + 8, MIXER.resonance.y), dx: 16, dy: 0, tone: (filtersOff ? 'red' : 'amber') as 'red' | 'amber' }] : []),
                { id: 's1', text: 'CH1', at: onMixer(STRIP_X[1], MIXER.hi.y - 14), dx: 0, dy: -8, tone: 'plain' as const },
                { id: 's2', text: 'CH2', at: onMixer(STRIP_X[2], MIXER.hi.y - 14), dx: 0, dy: -8, tone: 'plain' as const },
              ],
              screenOverlay: (W, H, _xf, k) => <EqPlot b={{ x: 8, y: 6, w: W - 16, h: plotH(H, k) - 10 }} ch={c} resonance={booth.mixer.resonance} label={`CH${plotCh} EQ + FILTER`} />,
              a11y: `You are looking at the mixer’s EQ and filter knobs for both channels, under the frequency response of channel ${plotCh}; ${focusBand ? `the CH${plotCh} ${BAND_WORD[focusBand]} knob` : focus === 'res' ? 'the resonance knob' : `the CH${filtCh} filter`} is marked.`,
            }}
          />
        ),
        bezel: [
          { k: 'CH1 LOW', v: bandDb(lo1), tint: lo1 <= 0.04 ? '#ff8a7e' : colors.textPrimary },
          { k: 'CH2 LOW', v: bandDb(lo2), tint: lo2 <= 0.04 ? '#ff8a7e' : colors.textPrimary },
          { k: `CH${filtCh} FILTER`, v: fWord(filtCh), tint: booth.ch[filtCh].filter === 0 ? colors.textSub : '#8fbcff' },
          { k: 'RES', v: filtersOff ? 'NO FILTER' : `${Math.round(booth.mixer.resonance * 100)}%`, tint: filtersOff ? colors.textSub : colors.amber },
        ],
        params: [
          lowKey(1),
          lowKey(2),
          {
            kind: 'fader',
            id: 'eqf',
            label: 'EQ+FILT',
            value: selValue,
            home: sel === 'res' ? undefined : 0.5,
            // resonance moves nothing until a filter is on (D75: locked, never silent)
            locked: sel === 'res' && filtersOff ? 'RESONANCE does nothing with both filters off — turn a FILTER first (pick CH1 or CH2 FILTER here); resonance only shows at the filter’s edge' : undefined,
            onChange: onSel,
            format: (v) => fmtSel(v, false),
            formatShort: (v) => fmtSel(v, true),
            chooser: {
              title: 'EQ + FILTER — WHICH KNOB',
              options: (['1hi', '1mid', '2hi', '2mid', 'f1', 'f2', 'res'] as const).map((id) => ({
                id,
                label: SEL_WORD[id],
                blurb:
                  id === 'res'
                    ? 'A peak at the filter’s edge. Turn a filter first: with both filters off it changes nothing.'
                    : id.startsWith('f')
                      ? 'Left of centre: low-pass (darker). Right: high-pass (thinner). Centre: off.'
                      : id.endsWith('hi')
                        ? 'Above about 2.5 kHz: hats, cymbals, air.'
                        : 'About 250 Hz – 2.5 kHz: chords, voices, the body of a track.',
              })),
              selectedId: sel,
              onSelect: (id) => {
                setSel(id as Sel);
                setFocus(id as Sel);
              },
            },
          },
          boothKey(booth, tr),
          stopKey(tr),
        ],
        initialParam: 'lo2',
      }}
    >
      <Step n={1}>
        <Look>{`You are looking at the mixer’s EQ and filter knobs for both channels (CH1 on the left, CH2 on the right), under the frequency response of channel ${plotCh}. The ring marks the knob you are moving.`}</Look>
        <P>Each channel’s EQ splits its sound into three bands — LOW, MID and HIGH, crossing over at about 250 Hz and 2.5 kHz on this mixer — and each knob boosts a little (+6 dB) and cuts a lot, killing the band at its end stop.</P>
        <P>The FILTER is one knob: left for a low-pass, right for a high-pass, centre for off; RESONANCE adds a peak at its edge.</P>
        <Terms items={TERMS} />
      </Step>
      <Step n={2}>
        <Do>Open DECKS and play both. Turn LOW 2 down to KILL. Watch the plot: the low end falls away; the mids and highs stay.</Do>
        <P>LOW 1 and LOW 2 have keys of their own, so a bass handover is two keys side by side. EQ+FILT holds the other bands, both filters and RESONANCE.</P>
      </Step>
      <Step n={3}>
        <P>Listen as the CROWD with both lows up: two kicks and two bass lines fight — louder, but blurry, because each hides part of the other (masking). Kill one LOW and the blend clears up.</P>
        <P>Sweep a FILTER slowly (EQ+FILT → CH1 FILTER), then raise RESONANCE and sweep again: you hear the peak ride up and down. A little adds movement; a lot whistles and eats headroom.</P>
        <Note>Deck B’s tempo has been matched to deck A for you — Screen 10 shows how — so what you hear is the EQ, not two drifting beats.</Note>
      </Step>
      <Step n={4}>
        <Do>Kill deck B’s LOW, then hand the bass over: bring LOW 2 up as you take LOW 1 down. Then sweep a filter with resonance.</Do>
        <P>A bass handover is one way to blend, not the only way. Some tracks blend fine with both lows partly down; some sound better with a filter. Compare at the same level and trust what you hear in the room — suggested starting points, not rules.</P>
        <GoalChips goals={goals.slice(0, 3)} latched={latched.slice(0, 3)} />
        <Note>These ranges, crossovers and slopes are this lab’s mixer. Real mixers differ — some isolators cut to −∞ across the whole knob, some EQs only cut −12 dB. Check your own.</Note>
      </Step>
      <Step n={5}>
        <Do>On your own: make deck A sound far away, as if from the next room — without touching its EQ.</Do>
        <UnderstandingCheck
          eyebrow="CHECK YOURSELF"
          question="You turn deck B’s FILTER to the right (a high-pass) and keep going. What disappears first?"
          options={['The kick and the bass — a high-pass removes the lows first', 'The hi-hats — the highs go first', 'Everything at once, equally', 'Nothing — a filter only adds a peak']}
          correct={0}
          explain="A high-pass lets the highs through and removes everything below its edge. As you sweep it up, the edge climbs from the sub-bass: the kick and the bass go first, then the mids, leaving a thin, bright sound."
          wrong={[undefined, 'That is a low-pass (turning LEFT): it removes the highs first.', 'A filter works from one edge; it never removes all frequencies equally.', 'The peak is the resonance; the filter itself removes one side of the spectrum.']}
          onCorrect={() => setCheck(true)}
        />
        <FaultCard
          title="A BOOMY, MUDDY BLEND"
          symptom="Both decks are up for a blend and the low end turns to mud — the kicks blur and the bass booms."
          start={() => {
            void audio.requestSound();
            updateBooth((b, t) =>
              alignPhase(
                {
                  ...b,
                  decks: { A: { ...b.decks.A, playing: true, at: t }, B: { ...b.decks.B, playing: true, at: t } },
                  ch: { 1: { ...b.ch[1], fader: 1, xf: 'THRU', eq: { hi: 0.5, mid: 0.5, lo: 0.75 }, filter: 0 }, 2: { ...b.ch[2], fader: 1, xf: 'THRU', eq: { hi: 0.5, mid: 0.5, lo: 0.75 }, filter: 0 } },
                  perspective: 'CROWD',
                },
                t,
                'B',
              ),
            );
          }}
          fixed={booth.decks.A.playing && booth.decks.B.playing && booth.ch[1].fader > 0.5 && booth.ch[2].fader > 0.5 && Math.min(booth.ch[1].eq.lo, booth.ch[2].eq.lo) <= 0.35}
          hints={['Look at CH1 LOW and CH2 LOW on the readout strip.', 'Both lows are boosted, on two bass-heavy tracks at full faders.', 'Take one deck’s LOW well down (or kill it) for the blend.']}
          why="Two boosted low ends were masking each other. With one deck’s LOW cut, its kick and bass make room for the other’s — the blend is cleaner and you have headroom back."
          onFixed={() => setFaultFixed(true)}
        />
        <GoalChips goals={goals.slice(3)} latched={latched.slice(3)} />
      </Step>
    </DjRack>
  );
}

export const P09: PageDef = { title: 'EQ isolators and filters', short: 'EQ', Component: PageEq, manualDone: true, rack: true };
