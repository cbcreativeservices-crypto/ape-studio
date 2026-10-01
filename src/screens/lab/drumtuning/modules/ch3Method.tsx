/**
 * Chapter 3 — The basic tuning method: the lab's main step-by-step
 * practice. LEARN (rack: the seven steps, drawn one by one) → HEAR (rack:
 * tap near each lug) → ADJUST (rack: "Tune the head" — tap, hear, turn,
 * read the evenness map and the feedback line, then the other head) →
 * REVIEW.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { colors } from '../../../../theme/tokens';
import { faderParam, flipFader, optionsParam } from '../DrumRack';
import { ChapterSteps } from '../steps';
import { Body, Card, DrumStatus, Feedback, KeyButton, KeyTerms, Point, SectionTitle, fmtHz } from '../kit';
import { DRUM_KEY_TERMS, METHOD_STEPS } from '../drumContent';
import { DRUMS, evenness, lugTapHz, randomUnevenHead, spreadCents, type HeadState, type StrikeParams } from '../drumEngine';
import { DrumTopStage, STAR_ORDER, TOP_ASPECT } from '../stagesDrum';
import { MODEL_BADGE, fmtTurn, useStrike, useTap, type ChapterProps } from './shared';

const DRUM = 'floor' as const;
const SPEC = DRUMS[DRUM];
const EVEN_CENTS = 10;

export function Ch3Method({ onInteractive }: ChapterProps) {
  const [methodStep, setMethodStep] = useState(0);
  const [hearLug, setHearLug] = useState(0);
  const [hearHead] = useState<HeadState>(() => randomUnevenHead(2400, SPEC.lugs, 0x51ab, 0.5));
  // The practice drum: two uneven heads, a fresh seed per NEW HEADS.
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 0x7fffffff));
  const [batter, setBatter] = useState<HeadState>(() => randomUnevenHead(2400, SPEC.lugs, seed, 0.6));
  const [reso, setReso] = useState<HeadState>(() => randomUnevenHead(2900, SPEC.lugs, seed ^ 0x5555, 0.6));
  const [which, setWhich] = useState<'batter' | 'reso'>('batter');
  const [lug, setLug] = useState(0);
  const [prevSpread, setPrevSpread] = useState<number | undefined>(undefined);
  const reported = useRef(false);

  const head = which === 'batter' ? batter : reso;
  const setHead = which === 'batter' ? setBatter : setReso;
  const spread = spreadCents(head);
  const even = evenness(head, prevSpread);
  const bothEven = spreadCents(batter) <= EVEN_CENTS && spreadCents(reso) <= EVEN_CENTS;
  const batterEven = spreadCents(batter) <= EVEN_CENTS;
  // Credit lands the moment the batter reads even — before any navigation.
  useEffect(() => {
    if (batterEven && !reported.current) {
      reported.current = true;
      onInteractive();
    }
  }, [batterEven, onInteractive]);

  const hearTap = useTap(hearHead, hearLug, DRUM);
  const tap = useTap(head, lug, DRUM, which);
  const strikeParams = useMemo<StrikeParams>(() => ({ drum: DRUM, batter, reso, resoPresent: true, damping: 0, strike: 0.8, strikeR: 0.3, strikeTheta: 0 }), [batter, reso]);
  const strike = useStrike(strikeParams, false);

  const setTurn = (v: number) => {
    setPrevSpread(spreadCents(head));
    setHead((h) => ({ ...h, turns: h.turns.map((t, i) => (i === lug ? v : t)) }));
  };
  const newHeads = () => {
    const s = Math.floor(Math.random() * 0x7fffffff);
    setSeed(s);
    setBatter(randomUnevenHead(2400, SPEC.lugs, s, 0.6));
    setReso(randomUnevenHead(2900, SPEC.lugs, s ^ 0x5555, 0.6));
    setPrevSpread(undefined);
    setLug(0);
  };
  const m = METHOD_STEPS[methodStep];
  const sigma = which === 'batter' ? SPEC.sigmaBatter : SPEC.sigmaReso;

  return (
    <ChapterSteps
      steps={[
        {
          key: 'steps', title: 'The seven steps', kind: 'LEARN', layout: 'rack',
          rack: {
            render: (w, h) => (
              <DrumTopStage
                width={w}
                height={h}
                drum={DRUM}
                head={m.id === 'adjust' ? hearHead : { tension: 2400, turns: new Array(SPEC.lugs).fill(0) }}
                which={m.id === 'other' ? 'reso' : 'batter'}
                showMap={m.id === 'adjust'}
                order={m.id === 'star' ? STAR_ORDER[SPEC.lugs] : undefined}
                orderStep={m.id === 'star' ? SPEC.lugs - 1 : undefined}
                tapAll={m.id === 'tap'}
                hitCentre={m.id === 'play'}
                selected={m.id === 'finger' ? 0 : null}
                title={`step ${methodStep + 1} · ${m.title}`}
              />
            ),
            aspect: TOP_ASPECT,
            badge: MODEL_BADGE,
            bezel: [
              { k: 'STEP', v: `${methodStep + 1} / ${METHOD_STEPS.length}` },
              { k: 'DO', v: m.short, flex: 1.2, tint: colors.amber },
              { k: 'HEAD', v: m.id === 'other' ? 'RESONANT' : 'BATTER', flex: 1.2 },
            ],
            params: [flipFader({ id: 'mstep', label: 'STEP', items: METHOD_STEPS, selectedId: m.id, onSelect: (id) => setMethodStep(Math.max(0, METHOD_STEPS.findIndex((x) => x.id === id))), name: (x) => x.title, short: (x) => x.short, blurb: (x) => x.detail, title: 'THE METHOD', sticky: true })],
            initialParam: 'mstep',
            hideDragTag: true,
          },
          well: (
            <>
              <Body>Ride STEP through the method. The drawing shows each step on the floor tom: the head seated, the rods finger-tight, the star pattern, the tap points an inch in from the rim, the evenness map, the stroke from the playing position, and the other head.</Body>
              <Card tone="accent">
                <Point title={`${methodStep + 1}. ${m.title}`}>{m.detail}</Point>
              </Card>
              <Card>
                <Point title="Why tap near the lugs">The pitch an inch in from the rim at each rod is set mostly by the tension at that rod. Matching those pitches is how you even the head. Checking pitch near the tension rods and adjusting for an even response is the common ground of nearly every published method.</Point>
              </Card>
            </>
          ),
        },
        {
          key: 'hear', title: 'Tap near each lug', kind: 'HEAR', layout: 'rack',
          rack: {
            render: (w, h) => <DrumTopStage width={w} height={h} drum={DRUM} head={hearHead} tap={hearLug} selected={null} title="tap round the head" />,
            aspect: TOP_ASPECT,
            badge: MODEL_BADGE,
            bezel: [
              { k: 'LUG', v: `${hearLug + 1} / ${SPEC.lugs}` },
              { k: 'LUG PITCH', v: `${fmtHz(lugTapHz(hearHead, hearLug, SPEC.diameterIn, SPEC.sigmaBatter))} Hz`, tint: colors.cyan, flex: 1.3 },
              { k: 'SPREAD', v: `${spreadCents(hearHead).toFixed(0)} ¢`, tint: colors.red },
            ],
            params: [
              optionsParam({ id: 'hlug', label: 'LUG', value: hearLug, options: Array.from({ length: SPEC.lugs }, (_, i) => ({ key: i, label: `Lug ${i + 1}`, short: `#${i + 1}` })), onChange: setHearLug }),
              { kind: 'action', id: 'tap', label: '▶ TAP', onPress: hearTap.play },
              { kind: 'action', id: 'stop', label: '■ STOP', onPress: hearTap.stop, tint: colors.green },
            ],
            initialParam: 'hlug',
            hideDragTag: true,
            onTap: () => (hearTap.playing ? hearTap.stop() : hearTap.play()),
            tapLabel: 'Display: tap to hear this lug or stop',
          },
          well: (
            <>
              <DrumStatus playing={hearTap.playing} pending={hearTap.pending} rendering={hearTap.status === 'rendering'} idle="stopped · pick a LUG and press ▶ TAP; go round the head" label={`the tap at lug ${hearLug + 1}`} />
              <Body>This head is uneven on purpose. Go round it: ▶ TAP at each LUG and listen for the pitch at that spot. The map tells you what you are hearing — blue lugs tap low, red lugs tap high. Same distance from the rim every time, same light stroke, and listen for the lowest and highest before you touch anything.</Body>
              <Card>
                <Point title="Damp the other spots">On a real drum, rest a finger lightly at the centre of the head while tapping so the lug tone stands out from the whole-head ring. Some players damp the far side with a hand instead.</Point>
              </Card>
            </>
          ),
        },
        {
          key: 'tune', title: 'Tune the head', kind: 'ADJUST', layout: 'rack',
          rack: {
            render: (w, h) => <DrumTopStage width={w} height={h} drum={DRUM} head={head} which={which} selected={lug} tap={lug} title={`tune the ${which === 'batter' ? 'batter' : 'resonant'} head`} />,
            aspect: TOP_ASPECT,
            size: 'L',
            badge: MODEL_BADGE,
            bezel: [
              { k: 'LUG', v: `${lug + 1} / ${SPEC.lugs}` },
              { k: 'TURN', v: fmtTurn(head.turns[lug]), flex: 1.3, tint: colors.amber },
              { k: 'LUG PITCH', v: `${fmtHz(lugTapHz(head, lug, SPEC.diameterIn, sigma))} Hz`, tint: colors.cyan, flex: 1.2 },
              { k: 'SPREAD', v: `${spread.toFixed(0)} ¢`, tint: spread <= EVEN_CENTS ? colors.green : spread <= 25 ? colors.amber : colors.red },
              { k: 'HEAD', v: which === 'batter' ? 'BATTER' : 'RESO' },
            ],
            params: [
              faderParam({ id: 'turn', label: 'TURN', value: head.turns[lug], min: -1, max: 1, step: 0.0625, format: (v) => `${fmtTurn(v)} on rod ${lug + 1}`, formatShort: (v) => fmtTurn(v), onChange: setTurn, home: 0 }),
              optionsParam({ id: 'lug', label: 'LUG', value: lug, options: Array.from({ length: SPEC.lugs }, (_, i) => ({ key: i, label: `Lug ${i + 1}`, short: `#${i + 1}` })), onChange: setLug }),
              { kind: 'toggle', id: 'which', label: which === 'batter' ? 'BATTER' : 'RESONANT', value: which === 'reso', onToggle: () => { setWhich((w) => (w === 'batter' ? 'reso' : 'batter')); setPrevSpread(undefined); } },
              { kind: 'action', id: 'tap', label: '▶ TAP', onPress: tap.play },
              { kind: 'action', id: 'strike', label: '▶ STRIKE', onPress: strike.play },
              { kind: 'action', id: 'stop', label: '■ STOP', onPress: () => { tap.stop(); strike.stop(); }, tint: colors.green },
            ],
            initialParam: 'turn',
            onTap: () => (strike.playing ? strike.stop() : strike.play()),
            tapLabel: 'Display: tap to strike the drum or stop',
          },
          well: (
            <>
              <DrumStatus playing={tap.playing || strike.playing} pending={tap.pending || strike.pending} rendering={tap.status === 'rendering' || strike.status === 'rendering'} idle="stopped · ▶ TAP a lug, ride TURN, ▶ TAP again; ▶ STRIKE to hear the whole drum" label={tap.playing || tap.pending ? `the tap at lug ${lug + 1}` : 'the strike'} />
              <Feedback tone={even.verdict === 'even' ? 'ok' : even.verdict === 'close' ? 'info' : 'warn'}>{even.message}</Feedback>
              <Body>The practice run. Tap each LUG, find the odd ones out, and turn their rods with TURN in small opposing moves — a sixteenth of a turn at a time — until the SPREAD falls under {EVEN_CENTS} cents and the map is one colour. Then flip to the RESONANT head and do it again. ▶ STRIKE plays the whole drum at any point so you hear what evenness buys.</Body>
              {bothEven ? <Feedback tone="ok">Both heads even. Play it from the seat (▶ STRIKE) — now Chapter 4 can tune the two heads against each other.</Feedback> : null}
              <KeyButton label="↺ NEW HEADS (A FRESH PRACTICE PAIR)" onPress={newHeads} />
              <Card>
                <Point title="Credit">The chapter is credited the moment the BATTER reads even. NEW HEADS deals a fresh uneven pair for practice — credit already earned stays.</Point>
                <Point title="Small, opposing">Bring a high lug down and its opposite up by the same small amount: the mean tension — and the drum's pitch — stays put while the map evens out.</Point>
              </Card>
            </>
          ),
        },
        {
          key: 'review', title: 'Review', kind: 'REVIEW', layout: 'read',
          body: (
            <>
              <SectionTitle>KEY IDEAS</SectionTitle>
              <Card>
                <Body>• Seat, finger-tighten, star pattern, tap, adjust, play, repeat on the other head.</Body>
                <Body>• Tap the same spot at every lug; even the pitches with small opposing moves.</Body>
                <Body>• Even first, then the pitch you want.</Body>
                <Body>• The stroke from the seat is the judge; the lug taps are the diagnosis.</Body>
              </Card>
              <KeyTerms terms={DRUM_KEY_TERMS.method} />
            </>
          ),
        },
      ]}
    />
  );
}
