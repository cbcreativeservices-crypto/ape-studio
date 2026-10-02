/**
 * Chapter 3 — The basic tuning method: the lab's main step-by-step
 * practice. LEARN (rack: the seven steps, drawn one by one) → HEAR (rack:
 * tap near each lug — the colour map stays HIDDEN until every lug has been
 * tapped and the learner has named the highest one) → ADJUST (rack: "Tune
 * the head" — tap, hear, turn, read the evenness map and the feedback line,
 * then the other head) → REVIEW.
 *
 * THE TURN IS RELATIVE (cognitive review, critical): the practice head's
 * offsets are hidden, as on a real drum. The TURN fader shows only THIS
 * RUN's cumulative move on the selected rod (0 at the start on every rod);
 * the learner has to tap, read the map and move the right rods the right
 * way. The first two moves on the batter are MODELLED (▶ SHOW ME A MOVE),
 * the next are named by the feedback (rod, direction, amount), and the
 * resonant head is independent (verdict and spread only).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { colors } from '../../../../theme/tokens';
import { faderParam, flipFader, optionsParam } from '../DrumRack';
import { ChapterSteps } from '../steps';
import { Body, Card, DrumStatus, Feedback, KeyButton, KeyTerms, Landing, Point, RecallCard, SectionTitle, WhyCard, YourRun, fmtHz } from '../kit';
import { CAUTION_TEXT, CAUTION_TITLE, DRUM_KEY_TERMS, METHOD_STEPS } from '../drumContent';
import { DRUMS, evenness, lugCents, lugTapHz, meanTension, randomUnevenHead, spreadCents, turnWords, turnsForCents, type HeadState, type StrikeParams } from '../drumEngine';
import { DrumTopStage, STAR_ORDER, TOP_ASPECT } from '../stagesDrum';
import { MODEL_BADGE, fmtTurn, syncOf, useStrike, useTap, type ChapterProps } from './shared';

const DRUM = 'floor' as const;
const SPEC = DRUMS[DRUM];
const EVEN_CENTS = 10;
const GUIDED_MOVES = 2;

/** The head the learner hears and tunes = the hidden starting offsets plus
 *  this run's moves. */
const compose = (base: HeadState, moved: number[]): HeadState => ({ tension: base.tension, turns: base.turns.map((t, i) => t + (moved[i] ?? 0)) });

type Pass = { base: HeadState; moved: number[]; moves: number; startSpread: number };
const freshPass = (tension: number, seed: number): Pass => {
  const base = randomUnevenHead(tension, SPEC.lugs, seed, 0.6);
  return { base, moved: new Array(SPEC.lugs).fill(0), moves: 0, startSpread: spreadCents(base) };
};

export function Ch3Method({ onInteractive }: ChapterProps) {
  const [methodStep, setMethodStep] = useState(0);
  // HEAR: an uneven head, the map hidden until the ear has done its work.
  const [hearLug, setHearLug] = useState(0);
  const [hearHead] = useState<HeadState>(() => randomUnevenHead(2400, SPEC.lugs, 0x51ab, 0.5));
  const [tapped, setTapped] = useState<Set<number>>(() => new Set());
  const [guess, setGuess] = useState<number | null>(null);
  const [mapShown, setMapShown] = useState(false);
  const [revealNote, setRevealNote] = useState<string | null>(null);
  // TUNE: two passes with hidden offsets, a fresh seed per NEW HEADS.
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 0x7fffffff));
  const [batterPass, setBatterPass] = useState<Pass>(() => freshPass(2400, seed));
  const [resoPass, setResoPass] = useState<Pass>(() => freshPass(2900, seed ^ 0x5555));
  const [which, setWhich] = useState<'batter' | 'reso'>('batter');
  const [lug, setLug] = useState(0);
  const [prevSpread, setPrevSpread] = useState<number | undefined>(undefined);
  const [guided, setGuided] = useState(0);
  const [shown, setShown] = useState<string | null>(null);
  const reported = useRef(false);

  const pass = which === 'batter' ? batterPass : resoPass;
  const setPass = which === 'batter' ? setBatterPass : setResoPass;
  const batter = useMemo(() => compose(batterPass.base, batterPass.moved), [batterPass]);
  const reso = useMemo(() => compose(resoPass.base, resoPass.moved), [resoPass]);
  const head = which === 'batter' ? batter : reso;
  const spread = spreadCents(head);
  // Scaffold: the batter pass gets the full feedback (rod, direction, amount);
  // the resonant pass is independent — verdict and spread, the ear finds the rods.
  const even = evenness(head, prevSpread, which === 'batter' ? 'full' : 'brief');
  const batterEven = spreadCents(batter) <= EVEN_CENTS;
  const resoEven = spreadCents(reso) <= EVEN_CENTS;
  const bothEven = batterEven && resoEven;
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

  const hearCents = lugCents(hearHead);
  const hearHighest = hearCents.indexOf(Math.max(...hearCents));
  const hearTapNow = () => {
    setTapped((s) => (s.has(hearLug) ? s : new Set([...s, hearLug])));
    hearTap.play();
  };
  const revealMap = () => {
    if (tapped.size < SPEC.lugs) {
      setRevealNote(`Tap every lug first — ${tapped.size} of ${SPEC.lugs} so far. The map comes after the ear.`);
      return;
    }
    setMapShown(true);
    if (guess == null) setRevealNote(`The map says lug ${hearHighest + 1} is the highest. Tap it and its opposite back to back and hear the gap.`);
    else if (guess === hearHighest) setRevealNote(`You said ${guess + 1}; the map says ${hearHighest + 1} — your ears were right.`);
    else setRevealNote(`You said ${guess + 1}; the map says ${hearHighest + 1}. Tap ${guess + 1} and ${hearHighest + 1} again back to back.`);
  };

  /** A learner move: the fader sets THIS RUN's cumulative move on the rod. */
  const setTurn = (v: number) => {
    const snapped = Math.round(v * 16) / 16;
    if (Math.abs(snapped - (pass.moved[lug] ?? 0)) < 1e-6) return;
    setPrevSpread(spreadCents(head));
    setShown(null);
    setPass((p) => ({ ...p, moved: p.moved.map((t, i) => (i === lug ? snapped : t)), moves: p.moves + 1 }));
  };
  /** The modelled move: the lab moves the furthest-out rod toward the mean
   *  and says what it did, so the first moves are watched, not guessed. */
  const showMe = () => {
    const c = lugCents(head);
    let k = 0;
    for (let i = 1; i < c.length; i++) if (Math.abs(c[i]) > Math.abs(c[k])) k = i;
    const want = -turnsForCents(c[k], meanTension(head));
    const t = Math.sign(want) * Math.min(0.25, Math.max(1 / 16, Math.round(Math.abs(want) * 16) / 16));
    const before = spreadCents(head);
    const next = compose(pass.base, pass.moved.map((m, i) => (i === k ? m + t : m)));
    const after = spreadCents(next);
    const cAfter = lugCents(next)[k];
    setLug(k);
    setPrevSpread(before);
    setPass((p) => ({ ...p, moved: p.moved.map((m, i) => (i === k ? m + t : m)), moves: p.moves + 1 }));
    setGuided((g) => g + 1);
    const fmtC = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(0)} ¢`;
    const spreadNote = after < before - 1 ? `SPREAD goes ${before.toFixed(0)} → ${after.toFixed(0)} ¢` : `SPREAD stays near ${after.toFixed(0)} ¢ because another rod is now the furthest out — tap round and find it`;
    setShown(`Watch: rod ${k + 1} was the furthest out (${fmtC(c[k])}), so the lab ${t < 0 ? 'loosened' : 'tightened'} it ${turnWords(t)} — its wedge goes ${fmtC(c[k])} → ${fmtC(cAfter)} and ${spreadNote}. Now ▶ TAP it to hear the change.`);
  };
  const newHeads = () => {
    const s = Math.floor(Math.random() * 0x7fffffff);
    setSeed(s);
    setBatterPass(freshPass(2400, s));
    setResoPass(freshPass(2900, s ^ 0x5555));
    setPrevSpread(undefined);
    setLug(0);
    setGuided(0);
    setShown(null);
    setWhich('batter');
  };
  const m = METHOD_STEPS[methodStep];
  const sigma = which === 'batter' ? SPEC.sigmaBatter : SPEC.sigmaReso;
  const guidedLeft = which === 'batter' && guided < GUIDED_MOVES && !batterEven;

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
                exploded={m.id === 'seat'}
                title={`step ${methodStep + 1} · ${m.title}`}
              />
            ),
            aspect: TOP_ASPECT,
            size: 'L',
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
              <Landing looking="the floor tom at each step of the method." prompt="Ride STEP." />
              <Card tone="accent">
                <Point title={`${methodStep + 1}. ${m.title}`}>{m.detail}</Point>
              </Card>
              <Card>
                <Point title="Why tap near the lugs">The pitch an inch in from the rim at each rod is set mostly by the tension at that rod. Matching those pitches is how you even the head — the common ground of nearly every published method.</Point>
              </Card>
              <Card tone="warn">
                <Point title={CAUTION_TITLE}>{CAUTION_TEXT}</Point>
              </Card>
            </>
          ),
        },
        {
          key: 'hear', title: 'Tap near each lug', kind: 'HEAR', layout: 'rack',
          rack: {
            render: (w, h) => <DrumTopStage width={w} height={h} drum={DRUM} head={hearHead} tap={hearLug} selected={null} showMap={mapShown ? true : 'hidden'} title="tap round the head" tapSync={syncOf(hearTap)} legend={mapShown ? undefined : `map hidden · tapped ${tapped.size} of ${SPEC.lugs}`} />,
            aspect: TOP_ASPECT,
            size: 'L',
            badge: MODEL_BADGE,
            bezel: [
              { k: 'LUG', v: `${hearLug + 1} / ${SPEC.lugs}` },
              { k: 'TAPPED', v: `${tapped.size} / ${SPEC.lugs}`, tint: tapped.size >= SPEC.lugs ? colors.green : colors.amber },
              { k: 'LUG PITCH', v: mapShown ? `${fmtHz(lugTapHz(hearHead, hearLug, SPEC.diameterIn, SPEC.sigmaBatter))} Hz` : 'listen', tint: colors.cyan, flex: 1.3 },
              { k: 'SPREAD', v: mapShown ? `${spreadCents(hearHead).toFixed(0)} ¢` : 'hidden', tint: mapShown ? colors.red : colors.textMuted },
            ],
            params: [
              optionsParam({ id: 'hlug', label: 'LUG', value: hearLug, options: Array.from({ length: SPEC.lugs }, (_, i) => ({ key: i, label: `Lug ${i + 1}${tapped.has(i) ? ' · tapped' : ''}`, short: `#${i + 1}` })), onChange: setHearLug }),
              { kind: 'action', id: 'tap', label: '▶ TAP', onPress: hearTapNow },
              { kind: 'action', id: 'reveal', label: mapShown ? '◉ MAP SHOWN' : '◉ REVEAL MAP', onPress: revealMap, tint: colors.amber },
            ],
            initialParam: 'hlug',
            hideDragTag: true,
            onTap: () => (hearTap.playing ? hearTap.stop() : hearTapNow()),
            tapLabel: 'Display: tap to hear this lug or stop',
          },
          well: (
            <>
              <Landing looking="an uneven head with its colour map hidden; ● is where the stick taps." prompt="▶ TAP each LUG and listen for the odd ones; then say which sounded highest and ◉ REVEAL MAP." />
              <DrumStatus playing={hearTap.playing} pending={hearTap.pending} rendering={hearTap.status === 'rendering'} idle="stopped · pick a LUG and press ▶ TAP; go round the head" label={`the tap at lug ${hearLug + 1}`} />
              {revealNote ? <Feedback tone={mapShown ? (guess == null || guess === hearHighest ? 'ok' : 'warn') : 'info'}>{revealNote}</Feedback> : null}
              {tapped.size >= SPEC.lugs && !mapShown ? (
                <Card tone="accent">
                  <Point title="WHICH LUG SOUNDED HIGHEST?">Pick one, then ◉ REVEAL MAP. This is a free check of your ears — not credit.</Point>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {Array.from({ length: SPEC.lugs }, (_, i) => (
                      <KeyButton key={i} label={guess === i ? `▸ ${i + 1}` : `${i + 1}`} onPress={() => setGuess(i)} tint={guess === i ? colors.amber : undefined} />
                    ))}
                  </View>
                </Card>
              ) : null}
              <Card>
                <Point title="Same spot, same stroke">An inch in from the rim at every lug, the same light tap each time. On a real drum, rest a finger lightly at the centre of the head while tapping so the lug tone stands out from the whole-head ring.</Point>
              </Card>
            </>
          ),
        },
        {
          key: 'tune', title: 'Tune the head', kind: 'ADJUST', layout: 'rack',
          rack: {
            render: (w, h) => <DrumTopStage width={w} height={h} drum={DRUM} head={head} which={which} selected={lug} tap={lug} title={`tune the ${which === 'batter' ? 'batter' : 'resonant'} head`} tapSync={syncOf(tap)} strikeSync={syncOf(strike)} keyTurn={pass.moved[lug] ?? 0} />,
            aspect: TOP_ASPECT,
            size: 'L',
            badge: MODEL_BADGE,
            bezel: [
              { k: 'LUG', v: `${lug + 1} / ${SPEC.lugs}` },
              { k: 'THIS RUN', v: fmtTurn(pass.moved[lug] ?? 0), flex: 1.3, tint: colors.amber },
              { k: 'LUG PITCH', v: `${fmtHz(lugTapHz(head, lug, SPEC.diameterIn, sigma))} Hz`, tint: colors.cyan, flex: 1.2 },
              { k: 'SPREAD', v: `${spread.toFixed(0)} ¢`, tint: spread <= EVEN_CENTS ? colors.green : spread <= 25 ? colors.amber : colors.red },
              { k: 'HEAD', v: which === 'batter' ? 'BATTER' : 'RESO' },
            ],
            params: [
              faderParam({ id: 'turn', label: 'TURN', value: pass.moved[lug] ?? 0, min: -1, max: 1, step: 0.0625, format: (v) => `${fmtTurn(v)} on rod ${lug + 1} this run — ${v > 0.01 ? 'tighter than you found it' : v < -0.01 ? 'looser than you found it' : 'as you found it'}`, formatShort: (v) => fmtTurn(v), onChange: setTurn, home: 0 }),
              optionsParam({ id: 'lug', label: 'LUG', value: lug, options: Array.from({ length: SPEC.lugs }, (_, i) => ({ key: i, label: `Lug ${i + 1}`, short: `#${i + 1}` })), onChange: setLug }),
              { kind: 'toggle', id: 'which', label: which === 'batter' ? 'BATTER' : 'RESO', value: which === 'reso', onToggle: () => { setWhich((w) => (w === 'batter' ? 'reso' : 'batter')); setPrevSpread(undefined); setShown(null); } },
              { kind: 'action', id: 'tap', label: '▶ TAP', onPress: tap.play },
              { kind: 'action', id: 'strike', label: '▶ STRIKE', onPress: strike.play },
            ],
            initialParam: 'turn',
            onTap: () => (strike.playing ? strike.stop() : strike.play()),
            tapLabel: 'Display: tap to strike the drum or stop',
          },
          well: (
            <>
              <Landing looking="the head you are evening; the key sits on the rod you chose, and TURN is how far YOU have moved it this run." prompt="▶ TAP, turn, ▶ TAP again until the map is one colour and SPREAD is under 10 ¢." />
              <DrumStatus playing={tap.playing || strike.playing} pending={tap.pending || strike.pending} rendering={tap.status === 'rendering' || strike.status === 'rendering'} idle="stopped · ▶ TAP a lug, ride TURN, ▶ TAP again; ▶ STRIKE to hear the whole drum" label={tap.playing || tap.pending ? `the tap at lug ${lug + 1}` : 'the strike'} />
              {shown ? <Feedback tone="info">{shown}</Feedback> : <Feedback tone={even.verdict === 'even' ? 'ok' : even.verdict === 'close' ? 'info' : 'warn'}>{even.message}</Feedback>}
              {guidedLeft ? <KeyButton label={`▶ SHOW ME A MOVE (${GUIDED_MOVES - guided} left)`} onPress={showMe} tint={colors.amber} /> : null}
              {bothEven ? <Feedback tone="ok">Both heads even. Play it from the seat (▶ STRIKE) — now Chapter 4 can tune the two heads against each other.</Feedback> : null}
              <Card>
                <Point title={which === 'batter' ? 'The batter: guided, then on your own' : 'The resonant head: on your own'}>
                  {which === 'batter'
                    ? 'The lab shows you the first two moves, then names the rod, the direction and the amount. Bring a high lug down and its opposite up by the same small amount: the mean — and the pitch — stays put. Then flip to RESO.'
                    : 'No rods are named on this head: tap round it, find the highest and lowest, and move them toward each other a sixteenth at a time. ▶ STRIKE follows this head too — an uneven bottom head warbles the whole drum.'}
                </Point>
              </Card>
              <WhyCard title="CREDIT · and a fresh pair">
                <Body>The chapter is credited the moment the BATTER reads even (every lug within {EVEN_CENTS} ¢). ↺ NEW HEADS deals a fresh uneven pair for practice — credit already earned stays. Only drum-key moves: a sixteenth or an eighth of a turn.</Body>
                <KeyButton label="↺ NEW HEADS (A FRESH PRACTICE PAIR)" onPress={newHeads} />
              </WhyCard>
            </>
          ),
        },
        {
          key: 'review', title: 'Review', kind: 'REVIEW', layout: 'read',
          body: (
            <>
              <YourRun lines={[
                `Batter: ${batterPass.startSpread.toFixed(0)} → ${spreadCents(batter).toFixed(0)} ¢ in ${batterPass.moves} move${batterPass.moves === 1 ? '' : 's'}${batterEven ? ' — even.' : ' — not yet even.'}`,
                `Resonant: ${resoPass.startSpread.toFixed(0)} → ${spreadCents(reso).toFixed(0)} ¢ in ${resoPass.moves} move${resoPass.moves === 1 ? '' : 's'}${resoEven ? ' — even.' : ' — not yet.'}`,
                mapShown ? `Tap round the head: you ${guess == null ? 'did not name a lug' : guess === hearHighest ? 'named the highest lug by ear' : `named lug ${guess + 1}; the map said ${hearHighest + 1}`}.` : 'Tap round the head: the map is still hidden — go back and tap every lug.',
              ]} />
              <SectionTitle>SAY IT BEFORE YOU READ IT</SectionTitle>
              <RecallCard q="What do you tap, and where?" a="Near each tension rod, about an inch in from the rim, the same spot and the same light stroke every time." />
              <RecallCard q="Even first or pitch first?" a="Even first. Small opposing moves keep the mean tension — and the pitch — where it is while the map evens out." />
              <RecallCard q="A lug taps 30 cents high. Which way, and roughly how far?" a="Loosen that rod — about an eighth of a turn on a tom; then tap again." />
              <SectionTitle>KEY IDEAS</SectionTitle>
              <Card>
                <Body>• Seat, finger-tighten, star pattern, tap, adjust, play, repeat on the other head.</Body>
                <Body>• The stroke from the seat is the judge; the lug taps are the diagnosis.</Body>
              </Card>
              <KeyTerms terms={DRUM_KEY_TERMS.method} />
              <Body>TRY NEXT: deal NEW HEADS and do the resonant head FIRST — see whether the batter still needs the same moves.</Body>
            </>
          ),
        },
      ]}
    />
  );
}
