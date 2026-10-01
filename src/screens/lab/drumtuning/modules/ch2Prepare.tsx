/**
 * Chapter 2 — Prepare before tuning. LEARN (rack: identify the drum and
 * the goal) → LEARN (read: inspect the hardware) → LEARN (rack: seat and
 * tension a new head — the cross-pattern ANIMATED on 6, 8 and 10 lugs) →
 * LEARN (rack: start from a known condition) → PRACTICE (rack: the
 * preparation checklist on a simulated drum with seeded faults) → REVIEW.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { colors } from '../../../../theme/tokens';
import { ExpandableFigure } from '../../kit/ExpandableFigure';
import { faderParam, flipFader, optionsParam } from '../DrumRack';
import { ChapterSteps } from '../steps';
import { Body, Card, Checklist, Feedback, KeyButton, KeyTerms, Point, SectionTitle, fmtHz } from '../kit';
import { DRUM_KEY_TERMS, PREP_ITEMS, type PrepFault } from '../drumContent';
import { DRUMS, DRUM_LIST, evenHead, fundamentalHz, lugAngle, spreadCents, type DrumKind, type HeadState, type LugCount } from '../drumEngine';
import { ANAT_ASPECT, AnatomyStage, DrumTopStage, STAR_ORDER, TOP_ASPECT, type DrumFaults } from '../stagesDrum';
import { MODEL_BADGE, type ChapterProps } from './shared';

const LUG_OPTIONS: { key: LugCount; label: string; short: string; blurb: string }[] = [
  { key: 6, label: '6 lugs (a 10"–12" tom)', short: '6 LUGS', blurb: 'Three opposite pairs: 1 → 4 → 2 → 5 → 3 → 6.' },
  { key: 8, label: '8 lugs (a 13"–16" tom, many kicks)', short: '8 LUGS', blurb: 'Four pairs, skipping round the star: 1 → 5 → 3 → 7 → 2 → 6 → 4 → 8.' },
  { key: 10, label: '10 lugs (a 14" snare)', short: '10 LUGS', blurb: 'Five pairs: 1 → 6 → 3 → 8 → 5 → 10 → 7 → 2 → 9 → 4.' },
];

/** The "known condition" demo: even quarter-turn steps vs big random turns. */
function knownSequence(approach: 'even' | 'random', step: number, lugs: LugCount): HeadState {
  const h = evenHead(1200, lugs);
  if (approach === 'even') {
    const t = 1200 * (1 + 0.25 * 0.5 * step); // half a turn per step, evenly
    return { tension: t, turns: new Array(lugs).fill(0) };
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
  return { tension: 1200, turns };
}

type InspectPoint = { id: string; label: string; short: string; blurb: string };

export function Ch2Prepare({ onInteractive }: ChapterProps) {
  const [drum, setDrum] = useState<DrumKind>('rack');
  const [lugs, setLugs] = useState<LugCount>(8);
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [approach, setApproach] = useState<'even' | 'random'>('even');
  const [kStep, setKStep] = useState(0);
  // The practice drum: seeded faults per mount / per NEW DRUM.
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 0x7fffffff));
  const [inspect, setInspect] = useState('head');
  const [flags, setFlags] = useState<Set<string>>(() => new Set());
  const [revealed, setRevealed] = useState(false);
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

  const known = useMemo(() => knownSequence(approach, kStep, 8), [approach, kStep]);
  const knownSpread = spreadCents(known);

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
    return { present, looseLug, debrisAngle: lugAngle(debrisLug, 10) + Math.PI / 10, head: uneven };
  }, [seed]);
  const drawFaults: DrumFaults = { worn: faults.present.has('worn'), loose: faults.present.has('loose') ? faults.looseLug : null, debris: faults.present.has('debris') ? faults.debrisAngle : null, uneven: faults.present.has('uneven') };
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
  const seen = (() => {
    if (inspect === 'head') return faults.present.has('worn') ? 'The coating is scuffed and there is a dent near the centre.' : 'The coating is even; no dents.';
    if (inspect === 'edge') return faults.present.has('debris') ? 'Specks of grit sit between the head and the edge on one side.' : 'The edge is clean all the way round.';
    if (inspect === 'map') return faults.present.has('uneven') || faults.present.has('loose') ? 'The map is mottled — the lugs are not at one pitch.' : 'The map is one colour — the lugs agree.';
    if (selLug != null) return faults.present.has('loose') && selLug === faults.looseLug ? `Rod ${selLug + 1} is backed out: a gap under its washer, the rod loose in the lug.` : `Rod ${selLug + 1} is seated; the washer sits flat.`;
    return '';
  })();
  const checkItems = PREP_ITEMS.map((it) => ({ id: it.id, label: it.label, why: it.why, needed: faults.present.has(it.id) }));
  const score = PREP_ITEMS.filter((it) => flags.has(it.id) === faults.present.has(it.id)).length;
  const reveal = () => {
    setRevealed(true);
    if (!reported.current) {
      reported.current = true;
      onInteractive();
    }
  };
  const newDrum = () => {
    setSeed(Math.floor(Math.random() * 0x7fffffff));
    setFlags(new Set());
    setRevealed(false);
    setInspect('head');
  };

  return (
    <ChapterSteps
      steps={[
        {
          key: 'identify', title: 'Identify the drum and goal', kind: 'LEARN', layout: 'rack',
          rack: {
            render: (w, h) => <DrumTopStage width={w} height={h} drum={drum} head={evenHead((spec.tensionRange[0] + spec.tensionRange[1]) / 2, spec.lugs)} showMap={false} title={spec.name} />,
            aspect: TOP_ASPECT,
            badge: MODEL_BADGE,
            bezel: [
              { k: 'DRUM', v: spec.kind.toUpperCase(), flex: 1.1 },
              { k: 'SIZE', v: `${spec.diameterIn}" × ${spec.depthIn}"`, flex: 1.1 },
              { k: 'LUGS', v: `${spec.lugs}` },
              { k: 'RESPONDS', v: `${fmtHz(spec.usefulHz[0])}–${fmtHz(spec.usefulHz[1])} Hz`, flex: 1.6, tint: colors.cyan },
            ],
            params: [flipFader({ id: 'drum', label: 'DRUM', items: DRUM_LIST.map((d) => ({ id: d.kind, ...d })), selectedId: drum, onSelect: (id) => setDrum(id as DrumKind), name: (d) => d.name, short: (d) => d.kind.toUpperCase(), blurb: (d) => `${d.lugs} lugs · a starting band of ${d.usefulHz[0]}–${d.usefulHz[1]} Hz for the batter's (0,1)`, title: 'THE DRUM', sticky: true })],
            initialParam: 'drum',
            hideDragTag: true,
          },
          well: (
            <>
              <Body>Ride DRUM. Before a single rod turns, know what you are tuning and for what: the drum's size and type set the band where it responds well (RESPONDS is this lab's starting band — a place to begin listening, not a rule), and the playing style and the sound you want set where in that band to aim.</Body>
              <Card>
                <Point title="Size and type">A 12" tom and a 16" floor tom at the same tension are a fifth or more apart; a snare's thin bottom head and wires make it a different instrument again; a bass drum is a beater and a decision about the front head.</Point>
                <Point title="Playing style">Hard hitters want more tension and often more damping; brush and jazz players tune higher and more open. Rimshots need a batter that can take them.</Point>
                <Point title="The sound you want">Short and controlled, open and resonant, low and full, a clear bend — Chapter 5 tunes toward each. Decide first; the method is the same.</Point>
              </Card>
            </>
          ),
        },
        {
          key: 'inspect', title: 'Inspect the hardware', kind: 'LEARN', layout: 'read',
          body: (
            <>
              <ExpandableFigure aspect={ANAT_ASPECT} badge={MODEL_BADGE} title="HARDWARE" render={(w, h) => <AnatomyStage width={w} height={h} part="rods" />} />
              <SectionTitle>BEFORE TUNING, LOOK</SectionTitle>
              <Card>
                <Point title="Tension rods">Each one turns freely with no binding, and none is bent. A rod that backs out under playing drops its lug and the drum "will not hold tuning".</Point>
                <Point title="Lugs">Casings tight on the shell, inserts not stripped, washers present and flat. A cracked casing or a missing washer makes one lug unreliable.</Point>
                <Point title="Hoops">Flat and round. Set a hoop on a table: it should touch all the way round. A bent hoop cannot press the head down evenly, and no amount of tuning fixes that.</Point>
                <Point title="Head condition">Coating worn through, dents, a stretched collar, a head that has been cranked high for a year — replace it. Old heads tune unevenly and drift.</Point>
                <Point title="The bearing edge">Clean, level, no chips. Grit between head and edge is a buzz or a dead spot that LOOKS like a tuning problem.</Point>
              </Card>
              <Body>The next steps put this on a simulated drum: an animated cross-pattern for a new head, a demonstration of starting from a known condition, and an inspection you carry out yourself.</Body>
            </>
          ),
        },
        {
          key: 'seat', title: 'Seat and tension a new head', kind: 'LEARN', layout: 'rack',
          rack: {
            render: (w, h) => <DrumTopStage width={w} height={h} drum={lugs === 6 ? 'rack' : lugs === 8 ? 'floor' : 'snare'} head={evenHead(2000, lugs)} showMap={false} order={order} orderStep={step} title={`cross-pattern · ${lugs} lugs`} />,
            aspect: TOP_ASPECT,
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
              { kind: 'action', id: 'run', label: running ? '■ PAUSE' : '▶ RUN PATTERN', onPress: () => { if (!running && step >= order.length - 1) setStep(0); setRunning((r) => !r); } },
            ],
            initialParam: 'step',
          },
          well: (
            <>
              <Body>Press ▶ RUN PATTERN, or ride STEP by hand. The arrows draw the order on the real lug count: every move goes to the rod OPPOSITE the last one, then round the star, so the head rises evenly and never pulls to one side. Change LUGS: the same idea on 6, 8 and 10.</Body>
              <Card>
                <Point title="Seating a new head">Clean edge; head on; hoop on, centred; every rod started by hand so none is cross-threaded. Then finger-tight all round — the known condition.</Point>
                <Point title="Bring it up in small steps">Half a turn per rod, in this opposing order, round and round. Some players press the centre of the head firmly between rounds to seat the collar; a few cracks from the film are normal on a new head.</Point>
                <Point title="Why opposing">Tightening neighbours in a row pulls the hoop down on one side first: the head wrinkles there and the far side stays slack. Opposite pairs keep the hoop parallel to the edge. Some manufacturers describe exactly this opposing pattern as the way to apply tension evenly.</Point>
              </Card>
            </>
          ),
        },
        {
          key: 'known', title: 'Start from a known condition', kind: 'LEARN', layout: 'rack',
          rack: {
            render: (w, h) => <DrumTopStage width={w} height={h} drum="floor" head={known} title={approach === 'even' ? 'even half-turns, round the star' : 'big random turns'} />,
            aspect: TOP_ASPECT,
            badge: MODEL_BADGE,
            bezel: [
              { k: 'APPROACH', v: approach === 'even' ? 'EVEN STEPS' : 'RANDOM', flex: 1.4 },
              { k: 'STEP', v: `${kStep} / 8` },
              { k: 'SPREAD', v: `${knownSpread.toFixed(0)} ¢`, tint: knownSpread <= 10 ? colors.green : knownSpread <= 40 ? colors.amber : colors.red },
              { k: '(0,1)', v: `${fmtHz(fundamentalHz(16, known.tension * (1 + 0.25 * (known.turns.reduce((a, b) => a + b, 0) / 8)), 0.35))} Hz`, tint: colors.cyan },
            ],
            params: [
              faderParam({ id: 'kstep', label: 'STEP', value: kStep, min: 0, max: 8, step: 1, format: (v) => (Math.round(v) === 0 ? 'finger-tight: the known condition' : `after ${Math.round(v)} ${approach === 'even' ? 'even round' : 'random turn'}${Math.round(v) === 1 ? '' : 's'}`), formatShort: (v) => `${Math.round(v)}/8`, onChange: (v) => setKStep(Math.round(v)), home: 0 }),
              { kind: 'toggle', id: 'approach', label: approach === 'even' ? 'EVEN STEPS' : 'RANDOM', value: approach === 'even', onToggle: () => setApproach((a) => (a === 'even' ? 'random' : 'even')) },
            ],
            initialParam: 'kstep',
          },
          well: (
            <>
              <Body>Ride STEP from the known condition — every rod finger-tight, SPREAD 0 — and watch the map. With EVEN STEPS the head rises as one colour and the pitch climbs; switch the toggle to RANDOM and the same eight moves leave a mottled map hundreds of cents apart.</Body>
              <Card>
                <Point title="Loosen, then retune in small even steps">When a drum is a mess, do not chase it: back every rod off to finger-tight (the known condition) and bring it up again in the pattern. It is faster than hunting one lug at a time, and it finds hardware faults on the way.</Point>
                <Point title="Small moves">An eighth or a quarter of a turn. Large random turns can never be undone evenly, because you no longer know where you are.</Point>
              </Card>
            </>
          ),
        },
        {
          key: 'checklist', title: 'Preparation checklist', kind: 'PRACTICE', layout: 'rack',
          rack: {
            render: (w, h) => <DrumTopStage width={w} height={h} drum="snare" head={faults.head} showMap={inspect === 'map' || revealed} selected={selLug} faults={drawFaults} title="inspect this drum" />,
            aspect: TOP_ASPECT,
            size: 'L',
            badge: MODEL_BADGE,
            bezel: [
              { k: 'LOOKING AT', v: inspecting.short, flex: 1.3, tint: colors.amber },
              { k: 'FLAGGED', v: `${flags.size}` },
              { k: 'KEY', v: revealed ? `${score} / ${PREP_ITEMS.length}` : 'hidden', tint: revealed ? (score === PREP_ITEMS.length ? colors.green : colors.amber) : colors.textMuted },
            ],
            params: [
              flipFader({ id: 'inspect', label: 'INSPECT', items: inspectPoints, selectedId: inspect, onSelect: setInspect, name: (p) => p.label, short: (p) => p.short, blurb: (p) => p.blurb, title: 'WALK THE DRUM', sticky: true }),
              { kind: 'action', id: 'new', label: '↺ NEW DRUM', onPress: newDrum, tint: colors.green },
            ],
            initialParam: 'inspect',
            hideDragTag: true,
          },
          well: (
            <>
              <Feedback tone="info">{seen}</Feedback>
              <Body>Ride INSPECT around the simulated drum — the head, each rod and lug, the bearing edge, the tension map — and read what you see above. Flag every fault you find in the list, then REVEAL THE KEY. ↺ NEW DRUM deals a fresh set of faults; a repeat never removes credit.</Body>
              <Checklist items={checkItems} chosen={flags} onToggle={(id) => { if (revealed) return; setFlags((f) => { const n = new Set(f); if (n.has(id)) n.delete(id); else n.add(id); return n; }); }} reveal={revealed} />
              {!revealed ? <KeyButton label="REVEAL THE KEY" onPress={reveal} tint={colors.green} /> : (
                <Feedback tone={score === PREP_ITEMS.length ? 'ok' : 'warn'}>{score === PREP_ITEMS.length ? 'Every fault found and nothing flagged that was not there. This drum is ready for the method.' : `${score} of ${PREP_ITEMS.length} right. Read the lines above — a loose rod looks like a tuning problem until you walk the hardware.`}</Feedback>
              )}
            </>
          ),
        },
        {
          key: 'review', title: 'Review', kind: 'REVIEW', layout: 'read',
          body: (
            <>
              <SectionTitle>KEY IDEAS</SectionTitle>
              <Card>
                <Body>• Know the drum and the goal before turning a rod.</Body>
                <Body>• Rods, lugs, hoops, head, bearing edge — check them; hardware faults masquerade as tuning faults.</Body>
                <Body>• A new head is seated evenly and brought up in an opposing pattern, small steps, round and round.</Body>
                <Body>• When lost, go back to finger-tight — the known condition — and come up again.</Body>
              </Card>
              <KeyTerms terms={DRUM_KEY_TERMS.prepare} />
            </>
          ),
        },
      ]}
    />
  );
}
