/**
 * Chapter 2 — Prepare before tuning. LEARN (rack: identify the drum and
 * the goal) → LEARN (read: inspect the hardware) → LEARN (rack: seat and
 * tension a new head — the cross-pattern ANIMATED on 6, 8 and 10 lugs) →
 * HEAR (rack: start from a known condition — even rounds vs random turns,
 * STRUCK through the engine) → PRACTICE (rack: the preparation checklist on
 * a simulated drum with seeded faults, each fault revealed only where the
 * learner has LOOKED) → REVIEW.
 *
 * CREDIT: every fault found and nothing extra flagged, on any drum. The
 * CAUTION card (over-tensioning, hoops, inserts, drum key only) sits on the
 * seating page.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { colors } from '../../../../theme/tokens';
import { ExpandableFigure } from '../../kit/ExpandableFigure';
import { faderParam, flipFader, optionsParam } from '../DrumRack';
import { ChapterSteps } from '../steps';
import { Body, Card, Checklist, DrumStatus, Feedback, KeyButton, KeyTerms, Landing, Point, RecallCard, SectionTitle, YourRun, fmtHz } from '../kit';
import { CAUTION_TEXT, CAUTION_TITLE, DRUM_KEY_TERMS, PREP_ITEMS, type PrepFault } from '../drumContent';
import { DRUMS, DRUM_LIST, TURN_NPM, evenHead, fundamentalHz, lugAngle, meanTension, spreadCents, type DrumKind, type HeadState, type LugCount, type StrikeParams } from '../drumEngine';
import { ANAT_ASPECT, AnatomyStage, DrumTopStage, STAR_ORDER, TOP_ASPECT, type DrumFaults, type DrumPart, type LookAt } from '../stagesDrum';
import { MODEL_BADGE, syncOf, useStrike, type ChapterProps } from './shared';

const LUG_OPTIONS: { key: LugCount; label: string; short: string; blurb: string }[] = [
  { key: 6, label: '6 lugs (a 10"–12" tom)', short: '6 LUGS', blurb: 'Three opposite pairs: 1 → 4 → 2 → 5 → 3 → 6.' },
  { key: 8, label: '8 lugs (a 13"–16" tom, many kicks)', short: '8 LUGS', blurb: 'Four pairs, skipping round the star: 1 → 5 → 3 → 7 → 2 → 6 → 4 → 8.' },
  { key: 10, label: '10 lugs (a 14" snare)', short: '10 LUGS', blurb: 'Five pairs: 1 → 6 → 3 → 8 → 5 → 10 → 7 → 2 → 9 → 4.' },
];

const KNOWN_T = 1200;

/** The "known condition" demo: even quarter-turn rounds vs big random turns
 *  on one rod at a time. */
function knownSequence(approach: 'even' | 'random', step: number, lugs: LugCount): HeadState {
  if (approach === 'even') {
    // A quarter turn on EVERY rod per round: the mean rises, the map stays one colour.
    return { tension: KNOWN_T + TURN_NPM * 0.25 * step, turns: new Array(lugs).fill(0) };
  }
  let s = 0x9e37 + lugs;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
  const turns = new Array<number>(lugs).fill(0);
  for (let k = 0; k < step; k++) {
    const i = Math.floor(rnd() * lugs);
    turns[i] += 0.5 + rnd() * 1.0; // a big, random turn on one rod
  }
  return { tension: KNOWN_T, turns };
}

type InspectPoint = { id: string; label: string; short: string; blurb: string };

const HARDWARE_CHIPS: { id: DrumPart; label: string; text: string }[] = [
  { id: 'rods', label: 'RODS', text: 'Each turns freely, none bent. A rod that backs out under playing drops its lug: the drum "will not hold tuning".' },
  { id: 'lugs', label: 'LUGS', text: 'Casings tight on the shell, inserts not stripped, washers present and flat. One bad lug makes one unreliable rod.' },
  { id: 'hoop', label: 'HOOPS', text: 'Flat and round — set one on a table; it should touch all the way round. A bent hoop cannot press the head down evenly.' },
  { id: 'batter', label: 'HEAD', text: 'Coating worn through, dents, a stretched collar, a year cranked high — replace it. Old heads tune unevenly and drift.' },
  { id: 'edge', label: 'EDGE', text: 'Clean, level, no chips. Grit between head and edge is a buzz or a dead spot that LOOKS like a tuning problem.' },
];

export function Ch2Prepare({ onInteractive }: ChapterProps) {
  const [drum, setDrum] = useState<DrumKind>('rack');
  const [hw, setHw] = useState<DrumPart>('rods');
  const [lugs, setLugs] = useState<LugCount>(8);
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [approach, setApproach] = useState<'even' | 'random'>('even');
  const [kStep, setKStep] = useState(0);
  // The practice drum: seeded faults per mount / per NEW DRUM.
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 0x7fffffff));
  const [inspect, setInspect] = useState('head');
  const [inspected, setInspected] = useState<Set<string>>(() => new Set(['head']));
  const [flags, setFlags] = useState<Set<string>>(() => new Set());
  const [revealed, setRevealed] = useState(false);
  const [runs, setRuns] = useState<{ score: number; perfect: boolean }[]>([]);
  const reported = useRef(false);

  const spec = DRUMS[drum];
  const order = STAR_ORDER[lugs];

  // The animated cross-pattern: one rod every 600 ms while RUN is on. Not
  // audio, not a meter — a slow teaching animation on React state.
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setStep((s) => {
        if (s >= order.length - 1) {
          setRunning(false);
          return s;
        }
        return s + 1;
      });
    }, 600);
    return () => clearInterval(t);
  }, [running, order.length]);

  const toggleRun = () => {
    if (!running && step >= order.length - 1) setStep(0);
    setRunning((r) => !r);
  };

  const known = useMemo(() => knownSequence(approach, kStep, 8), [approach, kStep]);
  const knownSpread = spreadCents(known);
  const knownHz = fundamentalHz(16, meanTension(known), DRUMS.floor.sigmaBatter);
  // HEAR the known condition: the floor tom struck with this head.
  const knownParams = useMemo<StrikeParams>(() => ({ drum: 'floor', batter: known, reso: evenHead(2600, 8), resoPresent: true, damping: 0, strike: 0.8, strikeR: 0.3, strikeTheta: 0 }), [known]);
  const knownStrike = useStrike(knownParams, false);

  // Faults for this run: between one and three of the four, seeded.
  const faults = useMemo(() => {
    let s = seed >>> 0 || 1;
    const rnd = () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 0x100000000;
    };
    const present = new Set<PrepFault>();
    const all: PrepFault[] = ['worn', 'loose', 'debris', 'uneven'];
    for (const f of all) if (rnd() < 0.5) present.add(f);
    if (present.size === 0) present.add(all[Math.floor(rnd() * all.length)]);
    if (present.size === 4) present.delete(all[Math.floor(rnd() * all.length)]);
    const looseLug = Math.floor(rnd() * 10);
    const debrisLug = Math.floor(rnd() * 10);
    const uneven = evenHead(4000, 10);
    if (present.has('uneven')) {
      uneven.turns[Math.floor(rnd() * 10)] = 0.45;
      uneven.turns[Math.floor(rnd() * 10)] -= 0.35;
    }
    if (present.has('loose')) uneven.turns[looseLug] = -0.6;
    return { present, looseLug, debrisLug, debrisAngle: lugAngle(debrisLug, 10) + Math.PI / 10, head: uneven };
  }, [seed]);
  // A fault is DRAWN only where the learner has looked (or once the key is
  // revealed): inspection is an act of looking, not a tour of answers.
  const drawFaults: DrumFaults = {
    worn: faults.present.has('worn') && (revealed || inspected.has('head')),
    loose: faults.present.has('loose') && (revealed || inspected.has(`lug${faults.looseLug}`)) ? faults.looseLug : null,
    debris: faults.present.has('debris') && (revealed || inspected.has('edge')) ? faults.debrisAngle : null,
    uneven: faults.present.has('uneven'),
  };
  const inspectPoints = useMemo<InspectPoint[]>(
    () => [
      { id: 'head', label: 'The head surface', short: 'HEAD', blurb: 'Coating wear, dents, a collar that has stretched.' },
      ...Array.from({ length: 10 }, (_, i) => ({ id: `lug${i}`, label: `Rod and lug ${i + 1}`, short: `ROD ${i + 1}`, blurb: 'Is the rod seated, the washer flat, the casing tight on the shell?' })),
      { id: 'edge', label: 'The bearing edge', short: 'EDGE', blurb: 'Grit or a chip where the head meets the shell.' },
      { id: 'map', label: 'The tension map', short: 'MAP', blurb: 'Are the lugs at one pitch, or is the colour mottled?' },
    ],
    [],
  );
  const inspecting = inspectPoints.find((p) => p.id === inspect) ?? inspectPoints[0];
  const selLug = inspect.startsWith('lug') ? Number(inspect.slice(3)) : null;
  const look: LookAt = inspect === 'head' ? 'head' : inspect === 'edge' ? 'edge' : inspect === 'map' ? 'map' : selLug;
  const lookAt = (id: string) => {
    setInspect(id);
    setInspected((s) => (s.has(id) ? s : new Set([...s, id])));
  };
  const seen = (() => {
    if (inspect === 'head') return faults.present.has('worn') ? 'The coating is scuffed and there is a dent near the centre.' : 'The coating is even; no dents.';
    if (inspect === 'edge') return faults.present.has('debris') ? 'Specks of grit sit between the head and the edge on one side.' : 'The edge is clean all the way round.';
    if (inspect === 'map') return faults.present.has('uneven') || faults.present.has('loose') ? 'The map is mottled — the lugs are not at one pitch.' : 'The map is one colour — the lugs agree.';
    if (selLug != null) return faults.present.has('loose') && selLug === faults.looseLug ? `Rod ${selLug + 1} is backed out: a gap under its washer, the rod loose in the lug.` : `Rod ${selLug + 1} is seated; the washer sits flat.`;
    return '';
  })();
  const checkItems = PREP_ITEMS.map((it) => ({ id: it.id, label: it.label, why: it.why, needed: faults.present.has(it.id) }));
  const score = PREP_ITEMS.filter((it) => flags.has(it.id) === faults.present.has(it.id)).length;
  const perfect = score === PREP_ITEMS.length;
  const reveal = () => {
    if (revealed) return;
    setRevealed(true);
    setRuns((r) => [...r, { score, perfect }]);
    // CREDIT needs the flags to be RIGHT — every fault found, nothing extra.
    if (perfect && !reported.current) {
      reported.current = true;
      onInteractive();
    }
  };
  const newDrum = () => {
    setSeed(Math.floor(Math.random() * 0x7fffffff));
    setFlags(new Set());
    setRevealed(false);
    setInspect('head');
    setInspected(new Set(['head']));
  };
  const walked = inspectPoints.filter((p) => inspected.has(p.id)).length;
  // The hardware chips: the SAME elements inline and docked under the figure
  // in FULL SCREEN (owner: full screen is a working surface, controls docked).
  const hardwareChips = (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {HARDWARE_CHIPS.map((c) => (
        <KeyButton key={c.id} label={c.id === hw ? `▸ ${c.label}` : c.label} onPress={() => setHw(c.id)} tint={c.id === hw ? colors.amber : undefined} />
      ))}
    </View>
  );

  return (
    <ChapterSteps
      steps={[
        {
          key: 'identify', title: 'Identify the drum and goal', kind: 'LEARN', layout: 'rack',
          rack: {
            render: (w, h) => <DrumTopStage width={w} height={h} drum={drum} head={evenHead((spec.tensionRange[0] + spec.tensionRange[1]) / 2, spec.lugs)} showMap={false} title={spec.name} scaleBySize />,
            aspect: TOP_ASPECT,
            size: 'L',
            badge: MODEL_BADGE,
            bezel: [
              { k: 'DRUM', v: spec.kind.toUpperCase(), flex: 1.1 },
              { k: 'SIZE', v: `${spec.diameterIn}" × ${spec.depthIn}"`, flex: 1.1 },
              { k: 'LUGS', v: `${spec.lugs}` },
              { k: 'RESPONDS', v: `${fmtHz(spec.usefulHz[0])}–${fmtHz(spec.usefulHz[1])} Hz`, flex: 1.6, tint: colors.cyan },
            ],
            params: [flipFader({ id: 'drum', label: 'DRUM', items: DRUM_LIST.map((d) => ({ id: d.kind, ...d })), selectedId: drum, onSelect: (id) => setDrum(id as DrumKind), name: (d) => d.name, short: (d) => d.kind.toUpperCase(), blurb: (d) => `${d.lugs} lugs · a starting band of ${d.usefulHz[0]}–${d.usefulHz[1]} Hz for the batter's own pitch`, title: 'THE DRUM', sticky: true })],
            initialParam: 'drum',
            hideDragTag: true,
          },
          well: (
            <>
              <Landing looking="the drum you are about to tune, from above, drawn to size." prompt="Ride DRUM." />
              <Card>
                <Point title="Size and type">Before a rod turns, know what you are tuning and for what. Size and type set the band where the drum responds well (RESPONDS is this lab's starting band — a place to begin listening, not a rule); a snare's thin bottom head and wires make it a different instrument; a bass drum is a beater and a decision about the front head.</Point>
                <Point title="Playing style and the sound you want">Hard hitters often choose thicker or two-ply batter heads and more damping; jazz and brush players commonly tune higher and leave the drum open. Short and controlled, open, low and full, a clear bend — Chapter 5 tunes toward each. Decide first; the method is the same.</Point>
              </Card>
            </>
          ),
        },
        {
          key: 'inspect', title: 'Inspect the hardware', kind: 'LEARN', layout: 'read',
          body: (
            <>
              <ExpandableFigure aspect={ANAT_ASPECT} badge={MODEL_BADGE} title="HARDWARE" render={(w, h) => <AnatomyStage width={w} height={h} part={hw} />} controls={hardwareChips} />
              <SectionTitle>BEFORE TUNING, LOOK — TAP A PART</SectionTitle>
              {hardwareChips}
              <Card tone="accent">
                <Point title={HARDWARE_CHIPS.find((c) => c.id === hw)?.label ?? ''}>{HARDWARE_CHIPS.find((c) => c.id === hw)?.text ?? ''}</Point>
              </Card>
              <Body>The next steps put this on a simulated drum: an animated cross-pattern for a new head, a known condition you can hear, and an inspection you carry out yourself.</Body>
            </>
          ),
        },
        {
          key: 'seat', title: 'Seat and tension a new head', kind: 'LEARN', layout: 'rack',
          rack: {
            render: (w, h) => <DrumTopStage width={w} height={h} drum={lugs === 6 ? 'rack' : lugs === 8 ? 'floor' : 'snare'} head={evenHead(2000, lugs)} showMap={false} order={order} orderStep={step} title={`cross-pattern · ${lugs} lugs`} />,
            aspect: TOP_ASPECT,
            size: 'L',
            badge: MODEL_BADGE,
            bezel: [
              { k: 'LUGS', v: `${lugs}` },
              { k: 'STEP', v: `${step + 1} / ${order.length}` },
              { k: 'THIS ROD', v: `#${order[step] + 1}`, tint: colors.amber },
              { k: 'NEXT', v: step + 1 < order.length ? `#${order[step + 1] + 1}` : 'done', tint: colors.cyan },
            ],
            params: [
              faderParam({ id: 'step', label: 'STEP', value: step, min: 0, max: order.length - 1, step: 1, format: (v) => `step ${Math.round(v) + 1} of ${order.length} — rod ${order[Math.round(v)] + 1}`, formatShort: (v) => `${Math.round(v) + 1}/${order.length}`, onChange: (v) => { setRunning(false); setStep(Math.round(v)); }, home: 0 }),
              optionsParam({ id: 'lugs', label: 'LUGS', value: lugs, options: LUG_OPTIONS, onChange: (v) => { setLugs(v); setStep(0); setRunning(false); } }),
              { kind: 'action', id: 'run', label: running ? '■ PAUSE' : '▶ RUN', onPress: toggleRun },
            ],
            initialParam: 'step',
            // Tapping the display runs / pauses the pattern (the house
            // tap-to-toggle rule: this page's "play" is the animation).
            onTap: toggleRun,
            tapLabel: 'Display: tap to run or pause the pattern',
          },
          well: (
            <>
              <Landing looking="the order to tighten the rods on a new head." prompt="Press ▶ RUN, or ride STEP by hand; change LUGS for 6, 8 and 10." />
              <Card>
                <Point title="Seating, then small steps">Clean edge; head on; hoop on, centred; every rod started by hand so none is cross-threaded; finger-tight all round — the known condition. Then half a turn per rod in this opposing order, round and round. Some players press the centre of the head firmly between rounds to seat the collar; a few cracks from the film are normal.</Point>
                <Point title="Why opposing">Tightening neighbours in a row pulls the hoop down on one side first: the head wrinkles there and the far side stays slack. Opposite pairs keep the hoop parallel to the edge. Some manufacturers describe exactly this opposing pattern as the way to apply tension evenly.</Point>
              </Card>
              <Card tone="warn">
                <Point title={CAUTION_TITLE}>{CAUTION_TEXT}</Point>
              </Card>
            </>
          ),
        },
        {
          key: 'known', title: 'Start from a known condition', kind: 'HEAR', layout: 'rack',
          rack: {
            render: (w, h) => <DrumTopStage width={w} height={h} drum="floor" head={known} title={approach === 'even' ? 'even quarter-turns, round the star' : 'big random turns'} strikeSync={syncOf(knownStrike)} />,
            aspect: TOP_ASPECT,
            size: 'L',
            badge: MODEL_BADGE,
            bezel: [
              { k: 'APPROACH', v: approach === 'even' ? 'EVEN STEPS' : 'RANDOM', flex: 1.4 },
              { k: 'STEP', v: `${kStep} / 8` },
              { k: 'SPREAD', v: `${knownSpread.toFixed(0)} ¢`, tint: knownSpread <= 10 ? colors.green : knownSpread <= 40 ? colors.amber : colors.red },
              { k: 'PITCH', v: `${fmtHz(knownHz)} Hz`, tint: colors.cyan },
            ],
            params: [
              faderParam({ id: 'kstep', label: 'STEP', value: kStep, min: 0, max: 8, step: 1, format: (v) => (Math.round(v) === 0 ? 'finger-tight: the known condition' : `after ${Math.round(v)} ${approach === 'even' ? 'even round' : 'random turn'}${Math.round(v) === 1 ? '' : 's'}`), formatShort: (v) => `${Math.round(v)}/8`, onChange: (v) => setKStep(Math.round(v)), home: 0 }),
              { kind: 'toggle', id: 'approach', label: approach === 'even' ? 'EVEN STEPS' : 'RANDOM', value: approach === 'even', onToggle: () => setApproach((a) => (a === 'even' ? 'random' : 'even')) },
              { kind: 'action', id: 'play', label: '▶ STRIKE', onPress: knownStrike.play },
            ],
            initialParam: 'kstep',
            onTap: () => (knownStrike.playing ? knownStrike.stop() : knownStrike.play()),
          },
          well: (
            <>
              <Landing looking="the same head brought up two ways; SPREAD is the gap in cents between its highest and lowest lug." prompt="Ride STEP and ▶ STRIKE at each one, then flip to RANDOM and strike again." />
              <DrumStatus playing={knownStrike.playing} pending={knownStrike.pending} rendering={knownStrike.status === 'rendering'} idle="stopped · ride STEP, press ▶ STRIKE; flip EVEN STEPS / RANDOM" label="the floor tom" />
              <Card>
                <Point title="Even steps vs random turns">From finger-tight (SPREAD 0), EVEN STEPS raise the head as one colour and the pitch climbs clean. RANDOM applies the same eight moves as big turns on single rods: the map goes mottled hundreds of cents apart and the strike warbles — and big turns on one rod are also the way hoops go out of round.</Point>
                <Point title="When a drum is a mess, do not chase it">Back every rod off to finger-tight and come up again in the pattern, an eighth or a quarter of a turn at a time. It is faster than hunting one lug, and it finds hardware faults on the way.</Point>
              </Card>
            </>
          ),
        },
        {
          key: 'checklist', title: 'Preparation checklist', kind: 'PRACTICE', layout: 'rack',
          rack: {
            render: (w, h) => <DrumTopStage width={w} height={h} drum="snare" head={faults.head} showMap={inspect === 'map' || revealed} selected={selLug} faults={drawFaults} title="inspect this drum" look={look} />,
            aspect: TOP_ASPECT,
            size: 'L',
            badge: MODEL_BADGE,
            bezel: [
              { k: 'LOOKING AT', v: inspecting.short, flex: 1.3, tint: colors.amber },
              { k: 'WALKED', v: `${walked} / ${inspectPoints.length}` },
              { k: 'FLAGGED', v: `${flags.size}` },
              { k: 'KEY', v: revealed ? `${score} / ${PREP_ITEMS.length}` : 'hidden', tint: revealed ? (perfect ? colors.green : colors.amber) : colors.textMuted },
            ],
            params: [
              flipFader({ id: 'inspect', label: 'INSPECT', items: inspectPoints, selectedId: inspect, onSelect: lookAt, name: (p) => p.label, short: (p) => p.short, blurb: (p) => p.blurb, title: 'WALK THE DRUM', sticky: true }),
              { kind: 'action', id: 'reveal', label: revealed ? '✓ KEY SHOWN' : '✓ REVEAL KEY', onPress: reveal, tint: colors.amber },
              { kind: 'action', id: 'new', label: '↺ NEW DRUM', onPress: newDrum, tint: colors.green },
            ],
            initialParam: 'inspect',
            hideDragTag: true,
          },
          well: (
            <>
              <Landing looking="a snare with one to three things wrong; the dashed ring is where you are looking." prompt="Ride INSPECT round it, flag what you find in the list, then ✓ REVEAL KEY." />
              <Feedback tone="info">{seen}</Feedback>
              <Checklist items={checkItems} chosen={flags} onToggle={(id) => { if (revealed) return; setFlags((f) => { const n = new Set(f); if (n.has(id)) n.delete(id); else n.add(id); return n; }); }} reveal={revealed} />
              {revealed ? (
                <Feedback tone={perfect ? 'ok' : 'warn'}>{perfect ? 'Every fault found and nothing flagged that was not there. This drum is ready for the method.' : `${score} of ${PREP_ITEMS.length} right — no credit yet. Read the lines above (a loose rod looks like a tuning problem until you walk the hardware), then ↺ NEW DRUM and try another.`}</Feedback>
              ) : null}
              <Card>
                <Point title="Credit">Every fault found and nothing extra flagged, on any drum. A fault is drawn only where you have looked — walk every rod. ↺ NEW DRUM deals another; a repeat never removes credit.</Point>
              </Card>
            </>
          ),
        },
        {
          key: 'review', title: 'Review', kind: 'REVIEW', layout: 'read',
          body: (
            <>
              <YourRun lines={[
                runs.length ? `Checklist: ${runs.length} drum${runs.length === 1 ? '' : 's'} revealed — ${runs.map((r) => `${r.score}/${PREP_ITEMS.length}`).join(', ')}${runs.some((r) => r.perfect) ? ' — one of them perfect.' : ' — none perfect yet.'}` : 'Checklist: no drum revealed yet.',
                `Known condition: you took it to step ${kStep} of 8 on ${approach === 'even' ? 'EVEN STEPS' : 'RANDOM'}; SPREAD reads ${knownSpread.toFixed(0)} ¢.`,
              ]} />
              <SectionTitle>SAY IT BEFORE YOU READ IT</SectionTitle>
              <RecallCard q="A drum will not hold tuning. Name two hardware causes to check before you retune." a="A rod backing out under vibration; a worn or missing washer, a stripped lug insert, a cracked casing." />
              <RecallCard q="Why tighten in an opposing (star) pattern?" a="Opposite pairs keep the hoop parallel to the edge, so the head rises evenly and never wrinkles on one side." />
              <RecallCard q="What is the known condition, and when do you go back to it?" a="Every rod finger-tight, the head flat. Go back to it when a drum is a mess instead of chasing one lug at a time." />
              <SectionTitle>KEY IDEAS</SectionTitle>
              <Card>
                <Body>• Know the drum and the goal before turning a rod.</Body>
                <Body>• Rods, lugs, hoops, head, bearing edge — hardware faults masquerade as tuning faults.</Body>
                <Body>• A head has a working range; drum key and fingers only.</Body>
              </Card>
              <KeyTerms terms={DRUM_KEY_TERMS.prepare} />
              <Body>TRY NEXT: on the checklist, walk every rod BEFORE you read the map — the loose rod and the uneven head look alike on the map and nowhere else.</Body>
            </>
          ),
        },
      ]}
    />
  );
}
