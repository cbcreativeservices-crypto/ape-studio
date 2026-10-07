/**
 * A12 ACOUSTIC PIPE ORGAN — its pages. A room-sized instrument, so the
 * journey keeps its stages but its pictures are the ROOM's:
 *   1 MEET        the façade from the nave, its divisions named by tap
 *   2 HOW IT SOUNDS  open and stopped pipes (why 16′ and 32′ name a pitch);
 *                 a distributed source (arrival times from each division);
 *                 the room and the pedal notes (one lengthwise resonance)
 *   3 THE SETTING the whole nave from above: the case, the console, the
 *                 aisles and exits kept clear, the rear gallery's antiphonal
 *                 division, the PA in a service; then before any mic
 *   4–7           the shared pages (hand-drum factory) with the organ's
 *                 words: the main pair, a division spot, the PA, two mics
 * ROOM (the variant): an empty room for a recording, or a service with a
 * stream and a PA. The electronic organ and its rotary speaker belong to
 * the Amplified speakers & Leslie module: a link, no copy.
 *
 * Suggested starting points in plain words; no sources or badges on screen;
 * FULLY SILENT; nothing loops.
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Canvas, DashPathEffect, Group, Path, Skia } from '@shopify/react-native-skia';
import type { DocumentedZone, SourcePageId } from '../../engine/model/types.ts';
import { fmtLen } from '../../engine/model/units.ts';
import { fitXform, unproject } from '../../engine/geometry/frame.ts';
import { StaticLabels, type StaticLabel } from '../../engine/scene/StaticLabels';
import { useStageTextScale } from '../../../rack/stageAspect';
import { Body, Card, Landing, Note, Point, PredictCard, ScenarioList } from '../../engine/kit';
import { PageSteps, type MikingStep } from '../../engine/steps';
import type { PageProps } from '../../pages/pageTypes';
import { makeHandPages, type HandSpec } from '../shared/hand/handPages';
import { MetalInstrument, VariantChips, VariantContext, type VariantCtx } from '../shared/metal/metalPages';
import { SpkLink } from '../shared/keys/keysPages';
import { OrganTop, HIGHLIGHT } from '../shared/organ/OrganArt';
import { naveMode, pipeHarmonics, pipeLengthM, stopLowC } from '../shared/organ/pipeModel.ts';
import { A12_ART, ArrivalsFigure, arrivals, NaveFigure, ORGAN_FRONT, PipesFigure, type Listen, type PipeCompare } from './art';
import { A12_ZONES } from './geometry.ts';
import { CONSOLE, DIVISIONS, GALLERY, NAVE, ORGAN, PA, PEDAL_NOTES, STUDY } from './model.ts';

const zoneOf = (id: string) => A12_ZONES.find((z) => z.id === id)!;
const DIV = zoneOf('org.div').start;
const LISTEN: Listen[] = [
  { id: 'study', label: 'THE FOURTH PEW (THE CASE STUDY)', short: 'FOURTH PEW', p: STUDY },
  { id: 'spot', label: 'A SPOT IN FRONT OF THE GREAT', short: 'A SPOT', p: DIV.p },
  { id: 'back', label: 'NEAR THE BACK OF THE NAVE', short: 'NEAR THE BACK', p: { x: 22000, y: -2400, z: -1500 } },
];

/* ═══════════════ 2 · HOW IT SOUNDS ═══════════════ */
function OrganSound({ lesson, answers, onAnswered, onInteractive, interactiveDone }: PageProps) {
  const [compare, setCompare] = useState<PipeCompare>('samePitch');
  const [k, setK] = useState(1);
  const [at, setAt] = useState<Listen>(LISTEN[0]);
  const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set(['study']));
  const [note, setNote] = useState<(typeof PEDAL_NOTES)[number]>(PEDAL_NOTES[1]);
  const [pairX, setPairX] = useState(STUDY.x);
  const [predicted, setPredicted] = useState<string | null>(null);
  useEffect(() => {
    if (seen.size >= 3 && !interactiveDone.has('soundPath')) onInteractive('soundPath');
  }, [seen, interactiveDone, onInteractive]);
  const f8 = stopLowC(8);
  const Lopen = pipeLengthM(f8, false);
  const hOpen = pipeHarmonics(false, 3)[k - 1];
  const hStop = pipeHarmonics(true, 3)[k - 1];
  const stopPitch = compare === 'samePitch' ? f8 : f8 / 2;
  const a = arrivals(at.p);
  const spread = Math.max(...a.map((q) => q.ms)) - Math.min(...a.map((q) => q.ms));
  const fNote = stopLowC(note.feet);
  const mode = naveMode(fNote, NAVE.x1 / 1000);
  const S = lesson.sound;
  const steps: MikingStep[] = [
    {
      key: 'pipes',
      title: 'Open and stopped pipes',
      kind: 'TRY',
      layout: 'rack',
      rack: {
        render: (w, h) => <PipesFigure w={w} h={h} compare={compare} k={k} accessibilityLabel={`An open pipe and a stopped pipe ${compare === 'samePitch' ? 'half its length' : 'of the same length'}, each showing its pressure swing in mode ${k}.`} />,
        badge: 'A simplified picture: ideal air columns, no end corrections · blue = pressure swing · silent',
        bezel: [
          { k: 'OPEN', v: `${Math.round(f8 * hOpen)} Hz`, sub: `×${hOpen}`, flex: 1 },
          { k: 'STOPPED', v: `${Math.round(stopPitch * hStop)} Hz`, sub: `×${hStop}`, flex: 1 },
          { k: 'OPEN LENGTH', v: fmtLen(Lopen * 1000), flex: 1.2 },
        ],
        params: [
          { kind: 'options', id: 'compare', label: 'COMPARE', valueLabel: compare === 'samePitch' ? 'SAME PITCH' : 'SAME LENGTH', selectedId: compare, onSelect: (id) => setCompare(id as PipeCompare), sticky: true, options: [{ id: 'samePitch', label: 'SAME PITCH', blurb: 'A stopped pipe half the open pipe’s length sounds the same note.' }, { id: 'sameLength', label: 'SAME LENGTH', blurb: 'At the same length, the stopped pipe sounds an octave lower.' }] },
          { kind: 'fader', id: 'mode', label: 'HARMONIC', value: (k - 1) / 2, onChange: (v) => setK(1 + Math.round(v * 2)), format: () => `the ${k === 1 ? 'lowest' : k === 2 ? 'second' : 'third'} the pipe can sound — open ×${hOpen}, stopped ×${hStop}`, formatShort: () => `#${k}` },
        ],
        initialParam: 'compare',
      },
      well: (
        <>
          {lesson.predictions.sound ? <PredictCard p={lesson.predictions.sound} value={predicted} onPick={setPredicted} /> : null}
          <Landing looking="Two flue pipes, cut open · the mouth at the bottom" prompt="Choose COMPARE and step HARMONIC. Where is the pressure still, and which harmonics can each pipe sound?" />
          <Card>
            <Point title="WHY 16′ AND 32′ NAME A PITCH">{`An open pipe sounds about c ÷ 2L; a stopped pipe — capped at the top — about c ÷ 4L, an octave lower for the same length, and only the odd harmonics. So a stop labelled 8′ made of stopped pipes is only about 4′ long. The low C of an 8′ open stop is about ${Math.round(f8)} Hz, about ${fmtLen(Lopen * 1000)} long here.`}</Point>
          </Card>
          <Note>Read the label as the pitch, not the pipe: verify the real lowest notes by ear, through the real monitoring, rather than inferring them from a label.</Note>
        </>
      ),
    },
    {
      key: 'spread',
      title: 'A distributed source',
      kind: 'WATCH',
      layout: 'rack',
      rack: {
        render: (w, h) => <ArrivalsFigure w={w} h={h} at={at} accessibilityLabel={`The nave from above with straight paths from the organ’s divisions to ${at.label.toLowerCase()}: the first and last arrive ${spread.toFixed(1)} ms apart.`} />,
        badge: 'A simplified picture: straight paths, no reflections · c = 343 m/s · the layout is a drawing',
        bezel: [
          { k: 'LISTEN AT', v: at.short, flex: 1.4 },
          { k: 'SPREAD', v: `${spread.toFixed(1)} ms`, flex: 1 },
          { k: 'SEEN', v: `${seen.size} / 3`, flex: 0.8 },
        ],
        params: [
          {
            kind: 'options',
            id: 'listen',
            label: 'LISTEN AT',
            valueLabel: at.short,
            selectedId: at.id,
            onSelect: (id) => {
              const q = LISTEN.find((x) => x.id === id)!;
              setAt(q);
              setSeen((s) => (s.has(id) ? s : new Set([...s, id])));
            },
            sticky: true,
            options: LISTEN.map((q) => ({ id: q.id, label: q.label, blurb: q.id === 'spot' ? 'Close to the Great: its sound arrives first, the others well after.' : q.id === 'study' ? 'A listening position in the pews.' : 'Farther back: the paths are closer to equal.' })),
          },
        ],
        initialParam: 'listen',
      },
      well: (
        <>
          <Landing looking="The nave from above · paths from each division" prompt="Choose LISTEN AT — try all three. How far apart do the divisions arrive?" />
          <Card>
            <Point title="ONE ORGAN, MANY PLACES">{`A large organ sounds from many ranks in several places — towers, a box behind shutters, a division in front, sometimes one at the far end of the room. At ${at.short.toLowerCase()}, the first and last divisions arrive about ${spread.toFixed(1)} ms apart. A mic a few centimetres from one pipe hears that pipe, not the organ.`}</Point>
          </Card>
          <Body>{`Activity: ${seen.size >= 3 ? 'done — you listened from all three positions' : `${seen.size} of 3 positions`}.`}</Body>
          {seen.size >= 3 && predicted != null ? <Note tone="ok">{`You predicted “${predicted}”. Close to one division, the others arrive much later and quieter; farther back, the paths even out — the room blends them.`}</Note> : null}
        </>
      ),
    },
    {
      key: 'room',
      title: 'The room and the pedal',
      kind: 'TRY',
      layout: 'rack',
      rack: {
        render: (w, h) => <NaveFigure w={w} h={h} n={mode.n} pairX={pairX} accessibilityLabel={`The nave cut along its length with one lengthwise resonance near the ${note.label.toLowerCase()}: still lines every ${mode.spacingM.toFixed(1)} m. The pair, ${fmtLen(pairX)} from the organ, sits at ${Math.round(Math.abs(Math.cos((mode.n * Math.PI * pairX) / NAVE.x1)) * 100)} percent of the strongest swing.`} />,
        badge: 'Illustrative: one lengthwise resonance of an ideal hard-walled room — a real room mixes many · silent',
        bezel: [
          { k: 'NOTE', v: `${fNote.toFixed(1)} Hz`, flex: 1 },
          { k: 'ROOM', v: `${mode.hz.toFixed(1)} Hz`, sub: `n = ${mode.n}`, flex: 1 },
          { k: 'STILL LINES', v: `every ${mode.spacingM.toFixed(1)} m`, flex: 1.3 },
        ],
        params: [
          { kind: 'options', id: 'note', label: 'PEDAL NOTE', valueLabel: note.label, selectedId: note.id, onSelect: (id) => setNote(PEDAL_NOTES.find((q) => q.id === id)!), sticky: true, options: PEDAL_NOTES.map((q) => ({ id: q.id, label: q.label, blurb: `About ${stopLowC(q.feet).toFixed(1)} Hz.` })) },
          { kind: 'fader', id: 'pair', label: 'MOVE THE PAIR', value: (pairX - 7000) / 15000, onChange: (v) => setPairX(Math.round((7000 + v * 15000) / 100) * 100), format: () => `${fmtLen(pairX)} from the organ`, formatShort: () => `${(pairX / 1000).toFixed(1)} m` },
        ],
        initialParam: 'pair',
      },
      well: (
        <>
          <Landing looking="The nave cut along its length · one resonance near a pedal note" prompt="Choose a PEDAL NOTE and drag MOVE THE PAIR. How much does the low note change over a short move?" />
          <Card>
            <Point title="WHY THE PEDAL CAN VANISH">The room has its own resonances. Near a low pedal note, the pressure swings strongly in some places and stays still in others — so a step or two can take the pair from strong pedal to almost none. This picture shows one ideal resonance along the length; a real room mixes many, in every direction.</Point>
          </Card>
          <Note>Compare nearby safe floor positions with the lowest pedal notes and the real monitoring — and do not high-pass the pedal away by reflex.</Note>
        </>
      ),
    },
    {
      key: 'body',
      title: 'Speech and decay',
      kind: 'CHECK',
      layout: 'read',
      body: (
        <>
          <Card>
            {S.stages.map((s) => (
              <Point key={s.title} title={s.title.toUpperCase()}>
                {s.text}
              </Point>
            ))}
          </Card>
          <Card>
            <Point title="ATTACK">{S.attack}</Point>
            <Point title="BODY">{S.body}</Point>
          </Card>
          <Note>This lab never plays a sound and draws no frequency curve: how a real organ sounds depends on the instrument, its registration, the room and the listener’s place. The pictures show where the sound comes from and what the room does to it.</Note>
          <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'sound')} answers={answers} onAnswered={onAnswered} />
        </>
      ),
    },
  ];
  return <PageSteps steps={steps} />;
}

/* ═══════════════ 3 · WHERE IT SITS: the whole nave ═══════════════ */
type PlanItem = { id: string; box: { u0: number; u1: number; v0: number; v1: number }; label: { u: number; v: number }; service?: boolean };
const PLAN_ITEMS: PlanItem[] = [
  { id: 'case', box: { u0: -2600, u1: 200, v0: -4200, v1: 4200 }, label: { u: -1200, v: -5200 } },
  { id: 'console', box: { u0: CONSOLE.x0 - 200, u1: CONSOLE.x1 + 1100, v0: CONSOLE.z0 - 300, v1: CONSOLE.z1 + 300 }, label: { u: 2600, v: CONSOLE.z0 - 900 } },
  { id: 'aisles', box: { u0: 6000, u1: NAVE.x1, v0: ORGAN.aisleZ0.mm, v1: ORGAN.aisleZ1.mm }, label: { u: 17000, v: 4600 } },
  { id: 'exits', box: { u0: 0, u1: NAVE.x1, v0: -NAVE.zHalf, v1: -ORGAN.sideZ.mm }, label: { u: 17000, v: -6600 } },
  { id: 'gallery', box: { u0: GALLERY.x0, u1: GALLERY.x1, v0: -NAVE.zHalf, v1: NAVE.zHalf }, label: { u: 28500, v: 6300 } },
  { id: 'pews', box: { u0: ORGAN.firstPew.mm, u1: 26000, v0: -ORGAN.aisleZ0.mm, v1: ORGAN.aisleZ0.mm }, label: { u: 17000, v: 1400 } },
  { id: 'pa', box: { u0: PA.x - 700, u1: PA.x + 700, v0: PA.z - 700, v1: PA.z + 700 }, label: { u: PA.x, v: PA.z + 1300 }, service: true },
];
const PLAN_BOX = { u0: -3200, u1: NAVE.x1 + 600, v0: -8200, v1: 8200 };

function NavePlan({ w, h, variant, sel, onTap, label }: { w: number; h: number; variant: string; sel: string | null; onTap: (id: string) => void; label: string }) {
  const textScale = useStageTextScale();
  const xf = useMemo(() => fitXform('top', PLAN_BOX, w, h, 6), [w, h]);
  const items = PLAN_ITEMS.filter((i) => !i.service || variant === 'service');
  const hi = items.find((i) => i.id === sel);
  const hiPath = hi ? (() => { const p = Skia.Path.Make(); p.addRRect(Skia.RRectXY(Skia.XYWHRect(hi.box.u0, hi.box.v0, hi.box.u1 - hi.box.u0, hi.box.v1 - hi.box.v0), 300, 300)); return p; })() : null;
  const labels: StaticLabel[] = items.map((i) => ({ id: i.id, text: i.id === 'case' ? 'ORGAN' : i.id === 'gallery' ? 'GALLERY · ANTIPHONAL' : i.id === 'exits' ? 'PASSAGE · EXITS' : i.id.toUpperCase(), short: i.id === 'gallery' ? 'GALLERY' : undefined, u: i.label.u, v: i.label.v, align: 'center', tone: i.id === sel ? 'amber' : 'muted' }));
  const press = (e: { nativeEvent: { locationX: number; locationY: number } }) => {
    const { u, v } = unproject(xf, e.nativeEvent.locationX, e.nativeEvent.locationY);
    const tol = 24 / xf.s;
    const it = items.find((i) => u >= i.box.u0 - tol && u <= i.box.u1 + tol && v >= i.box.v0 - tol && v <= i.box.v1 + tol);
    if (it) onTap(it.id);
  };
  return (
    <View style={{ width: w, height: h }}>
      <Pressable onPress={press} accessibilityRole="image" accessibilityLabel={label} style={{ width: w, height: h }}>
        <Canvas style={{ width: w, height: h }} accessible accessibilityLabel={label}>
          <Group transform={[{ translateX: xf.ox }, { translateY: xf.oy }, { scale: xf.s }]}>
            <OrganTop variant={variant} whole hi={sel === 'gallery' ? 'antiphonal' : sel === 'case' ? 'org.case' : sel === 'console' ? 'org.console' : null} />
            {hiPath && sel !== 'case' && sel !== 'console' ? (
              <Path path={hiPath} style="stroke" strokeWidth={110} color={HIGHLIGHT}>
                <DashPathEffect intervals={[500, 300]} />
              </Path>
            ) : null}
          </Group>
        </Canvas>
      </Pressable>
      <StaticLabels labels={labels} xf={xf} scale={textScale} w={w} />
    </View>
  );
}

function OrganSetting(p: PageProps) {
  const { lesson, answers, onAnswered, variant, setVariant } = p;
  const items = lesson.setting.items.filter((i) => i.scene === 'all' || (variant === 'service' ? i.scene === 'stage' : i.scene === 'studio'));
  const [sel, setSel] = useState<string | null>(null);
  const it = items.find((i) => i.id === sel);
  const idx = Math.max(0, items.findIndex((i) => i.id === sel));
  const service = variant === 'service';
  const steps: MikingStep[] = [
    {
      key: 'plan',
      title: 'The room',
      kind: 'LEARN',
      layout: 'rack',
      rack: {
        render: (w, h) => <NavePlan w={w} h={h} variant={variant} sel={sel} onTap={setSel} label={`The whole nave from above: the organ case at the left, the console in the chancel, pews in three blocks with two aisles and side passages kept clear, the rear gallery with an antiphonal division at the right${service ? ', the PA on the chancel arch, the congregation in the pews' : ''}.${it ? ` Highlighted: ${it.label}.` : ''}`} />,
        badge: 'From above · a stylised church, not a measurement · dashed amber = the item you picked',
        bezel: [
          { k: 'ITEM', v: it ? it.short : 'TAP ONE', flex: 1.4 },
          { k: 'FOR A MIC', v: it ? it.tag : '—', flex: 1.4 },
          { k: 'ROOM', v: service ? 'SERVICE' : 'EMPTY' },
        ],
        params: [
          {
            kind: 'fader',
            id: 'item',
            label: 'ITEM',
            value: items.length > 1 ? idx / (items.length - 1) : 0,
            onChange: (v) => {
              const q = items[Math.round(v * (items.length - 1))];
              if (q) setSel(q.id);
            },
            format: () => (it ? `${it.short} · ${it.tag}` : `step through the ${items.length} items`),
            formatShort: () => (it ? it.short.slice(0, 9) : 'STEP'),
          },
          { kind: 'options', id: 'room', label: 'ROOM', valueLabel: service ? 'SERVICE' : 'EMPTY', selectedId: variant, onSelect: (id) => setVariant(id), sticky: true, options: lesson.model.variants.map((v) => ({ id: v.id, label: v.label, blurb: v.blurb })) },
        ],
        initialParam: 'item',
      },
      well: (
        <>
          <Landing looking="Plan · the whole nave from above" prompt="Tap what is in the room — or step through ITEM — to see what it means for a mic. Switch ROOM for a service." />
          {it ? (
            <Card>
              <Point title={it.label.toUpperCase()}>{it.note}</Point>
            </Card>
          ) : (
            <Note>The organ stands at the front; the congregation fills the pews; the aisles, passages and exits stay clear. Floor stands go where people do not walk.</Note>
          )}
          <Body>{service ? lesson.setting.stage : lesson.setting.studio}</Body>
        </>
      ),
    },
    {
      key: 'before',
      title: 'Before any mic',
      kind: 'CHECK',
      layout: 'read',
      body: (
        <>
          <Card>
            <Point title="MEET THE ORGANIST AND THE VENUE">Ask for the stop list and the divisions, exposed or enclosed pipework, any antiphonal or remote ranks, the pedal range, choir or instruments, and the service, concert or stream routing. Venue and organ staff control the lofts, galleries, chambers and historic fixtures.</Point>
            <Point title="HEAR IT">Ask for soft solo stops, a bright reed or mixture, full organ, the lowest pedal notes and quick changes. Note where a swell shutter opens and whether the room will be full.</Point>
            <Point title="DECIDE WHAT IT IS FOR">A recording, a stream of a service, or local PA? Organs are usually picked up for recording or broadcast rather than amplified in the same room — a common practice, not a rule. Do not add the organ to the PA just because a mic is up.</Point>
            <Point title="SAFE ACCESS">Accessible floor stands whenever they meet the goal. Anything elevated or suspended needs the venue’s approval and competent people with rated supports — never hang a mic from pipes, ornament, sprinklers, lighting or an unverified beam.</Point>
          </Card>
          <Note tone="warn">Protect your hearing during full-organ and PA tests: a widely used guideline is no more than 85 dBA averaged over 8 hours, halving the time for every 3 dBA more — a limit for people where they listen, not a mic’s rating. No deliberate loud feedback test is ever needed.</Note>
          <SpkLink text="An electronic organ and its rotary speaker cabinet are miked like a loudspeaker — covered in full in the Amplified speakers & Leslie module." />
          <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'setting')} answers={answers} onAnswered={onAnswered} />
        </>
      ),
    },
  ];
  return <PageSteps steps={steps} />;
}

/* ═══════════════ the shared pages, in the organ's words ═══════════════ */
const fmtM = (mm: number) => `${(mm / 1000).toFixed(1)} m`;
const AXES: HandSpec['axes'] = {
  x: { label: 'DOWN THE NAVE', short: 'NAVE', blurb: 'Toward or away from the organ, along the nave (x).', fmt: (v) => `${fmtM(Math.abs(v))} from the façade` },
  y: { label: 'UP–DOWN', short: 'HEIGHT', blurb: 'Up or down (y): a floor stand at a modest height.', fmt: (v) => `${fmtM(Math.max(0, -v))} above the floor` },
  z: { label: 'ACROSS', short: 'ACROSS', blurb: 'Across the nave (z): mind the aisles.', fmt: (v) => `${fmtM(Math.abs(v))} ${v >= 0 ? 'right' : 'left'} of the middle` },
};

const worked = (z: DocumentedZone) => [
  { title: 'WHERE TO BEGIN', text: `${z.label}. After our research, this is where we recommend you begin with a pipe organ: the listener’s perspective, a main pair in the body of the room — a practice, with no single distance.`, cell: 3 },
  { title: 'MEASURED FROM', text: 'From the organ’s façade down the nave to the mic’s FRONT (here shown for the pair’s centre). The readout also says how far the pair is off the case’s centre line.', cell: 0 },
  { title: 'THE RANGE', text: z.band, cell: 0 },
  { title: 'ACROSS AND UP', text: 'Over the pews, never in an aisle or an exit, on a safe floor stand at a modest height. Higher is not always better: compare the whole passage.', cell: 1 },
  { title: 'THE AIM', text: 'At the main ranks. Then choose a coherent stereo method for the room and the pipes’ spread, and check the mono sum.', cell: 2 },
  { title: 'CLEARANCE AND ACCESS', text: 'Clear of the aisles, the exits, the wheelchair route, the console and the organist. Nothing hangs from the organ; anything elevated is the venue’s installation, by competent people.', cell: 3 },
];

const STEREO = (
  <>
    <Card>
      <Point title="A COINCIDENT PAIR (X/Y, M/S)">The capsules together: a clear centre and a robust mono sum.</Point>
      <Point title="A NEAR-COINCIDENT PAIR">Two cardioids about 17 cm apart, splayed about 110° (some guides round the spacing to 15 cm): time and level differences for width — check it in mono.</Point>
      <Point title="A SPACED OMNI PAIR">Wider room and low-frequency pickup — and the pair most in need of a mono check.</Point>
    </Card>
    <Body>Omni includes the room with the organ; a wide cardioid helps when the room or the bass balance is less favourable. Choose the method for the room, the pipes’ spread and the delivery format.</Body>
  </>
);

const HAND: HandSpec = {
  art: A12_ART,
  intro: 'This lesson is about a pipe organ — an instrument the size of a room. First the organ itself: its divisions, how pipes speak and why the labels name a pitch, how the room shapes the low notes, and where everything stands. Then the microphones, a worked example and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.',
  figure: { view: 'side', title: 'PIPE ORGAN', badge: '', label: '', box: { u0: -2800, u1: 16800, v0: -11000, v1: 400 } },
  partsBox: { side: { u0: -2800, u1: 16800, v0: -11000, v1: 400 }, top: { u0: -2800, u1: 16800, v0: -7800, v1: 7800 } },
  partsBadge: '',
  partsLooking: () => '',
  partsNote: '',
  partsWarn: '',
  plan: { items: [], label: () => '', looking: () => '', first: '', before: [] },
  mic: {
    intro: 'No brand and no special “organ mic” is required. Choose by what the job needs: the pattern for the room and the pipes’ spread, the power, the size, a floor stand that can reach a modest height. The main pair is the organ’s sound; spots only add to it.',
    mountLine: () => 'Mount: a safe floor stand, outside the aisles and exits; anything elevated or suspended is the venue’s installation',
    extra: STEREO,
  },
  axes: AXES,
  aimWords: { az: 'Swing the front left or right (seen from above).', el: 'Tilt the front up or down (seen from the side).' },
  outside: 'on the nave floor',
  worked: { zone: 'org.cong', mic: 'sdcCard', looking: 'Worked example · the main pair’s centre · the nave from above', label: 'The nave with the main pair placed for you', done: 'That is the whole reading: where to begin, what it is measured from, the range, across and up, the aim, clearance. Next you place the pair yourself.', pieces: worked },
  place: {
    zone: 'org.cong',
    mic: 'sdcCard',
    looking: 'the nave from above',
    prompt: 'Drag the mic — the pair’s centre — (or use POSITION and AIM). Rest it in two different blue zones; switch ROOM below for a service.',
    label: 'The nave and the organ',
    tried: (p) => `You predicted “${p}”. Farther back, more room and decay and a blend of the divisions; closer, clearer attacks — and the low notes change with every move. Compare at matched level.`,
    notes: () => <VariantChips />,
  },
  learnZones: [
    'What you just did, in words. After our research, each blue zone is where we recommend you begin: a main pair over the congregation aimed at the main ranks; a case study’s fourth-pew position; a spot in front of one division. The organ’s own starting points have no universal distances — walk, listen and compare.',
    'Start with one coherent main pair; add a division spot only to solve a stated balance problem, bring it up under the pair, and recheck soft and full registrations in mono. Spots and mains arrive at different times: move or rebalance before reaching for delay or polarity.',
    'Floor stands only, in the pews’ rows or other clear places — never in an aisle, an exit or the wheelchair route, never touching the organ. Anything elevated or suspended is the venue’s installation by competent people.',
  ],
  ctx: {
    pose: { ...DIV, az: DIV.az + 10 },
    mic: 'sdcCard',
    plan: { u0: -2600, u1: 10000, v0: -7700, v1: 7700 },
    side: { u0: -2600, u1: 10000, v0: -11000, v1: 400 },
    creditWedge: 'paR',
    looking: 'From above · a division spot and the PA',
    prompt: 'The PA stays on the arch. Turn the spot mic (AIM) or change its PATTERN until the right-hand PA loudspeaker sits in the rejection — and keep the front on the Great.',
    label: 'the organ with a spot mic in front of the Great and the PA on the chancel arch.',
    learn: [
      { title: 'RECORDING', text: 'One coherent main pair at a balanced listening position; a division spot only for a defined need. Set gain with full organ and the strongest attack, then check the softest stops against ventilation and traffic.' },
      { title: 'STREAM', text: 'A main room pair for the organ’s scale and the room; separate, closer feeds for choir, speech and a selected organ spot — each on its own channel, with scenes for organ solo, accompaniment and speech. A suspended pair above an aisle is an installation by competent people.' },
      { title: 'LOCAL PA', text: 'Reinforce only if the audience needs it. Local division spots give more gain before feedback than a distant pair; never send a distant room pair back into the same room’s PA at high gain. Begin low and listen through the real audience area.' },
    ],
  },
  two: {
    A: { zone: 'org.cong', mic: 'sdcCard' },
    B: { zone: 'org.div', mic: 'sdcCard' },
    names: { A: 'MAIN PAIR', B: 'DIVISION SPOT' },
    looking: 'Two mics · A the main pair, B a spot on the Great',
    prompt: 'Flip B POLARITY both ways, then move a mic. Then change SOURCE: each division gives its own delay.',
    label: 'The nave with the main pair (A) and a division spot (B)',
    warn: 'This simplified graph shows one point source and straight paths, no reflections. A real organ sounds from many places at once and the room answers back — so no single delay suits every registration. Read the notch depths as illustrative only, and judge by ear, in mono.',
    learn: [
      'Distant mains and local spots hear each division at different times, with different room. A polarity flip or a fixed delay may improve one registration and worsen another: move or rebalance first.',
      'If a delay is used for a defined output, measure and verify it at the listening positions instead of assuming a distance formula settles the mix.',
    ],
  },
  practice: {
    orderNote: 'A main pair for an organ recording, as a sequence: put the steps in order. A step tapped too early is answered with why it cannot come yet.',
    gainId: 'org.prac.gain',
    secondId: 'org.prac.3',
    mixIds: ['org.mix.1', 'org.mix.2', 'org.mix.3'],
    mixIntro: 'Three cards from earlier pages, mixed: the stage of a stereo method, what a null can promise, and what removes a delay.',
    sheetNote: 'For a real organ, with the organist’s and the venue’s agreement. Write tendencies in words — what you heard, not a promised result.',
  },
  words: {
    placeBadge: 'Blue = recommended starting points · grey dashes = aisles, passages and exits kept clear · pinch to zoom',
    clearance: 'Clearance and access come first: the aisles, the passages, the exits and the wheelchair route stay clear; nothing touches or hangs from the organ; the console and the organist keep their space. Elevated or suspended mics are the venue’s installation, by competent people.',
    cardioidTried: 'What you just saw: a mic’s rejection sits behind it, or off to the sides of its rear. A spot facing up at the organ turns its back toward the nave — where a PA high on the arch can sit in a null.',
    sourceNote: 'What you just saw: sound reaches two mics at different times. Summed, the delayed copy cancels where it is half a period late: comb-filter notches. Polarity flips the sign — it moves the notches; it does not remove the delay. Change the SOURCE: each division gives its own delay, so no single setting suits every registration.',
  },
};

const base = makeHandPages(HAND, OrganSound);
const meet = MetalInstrument({
  intro: HAND.intro,
  front: ORGAN_FRONT,
  figure: { title: 'PIPE ORGAN', badge: 'A stylised pipe organ seen from the nave · not a particular instrument', label: () => 'A stylised pipe organ seen from the nave: an oak case about 8 m wide and 10 m high, two Pedal towers of tall pipes at the sides, the Great’s flat of pipes in the middle, the Swell’s shuttered box above it, and a small Positive low in front.' },
  partsBadge: 'Tap a division to name it · a stylised layout',
  partsLooking: () => 'From the nave · the main case',
  partsNote: 'A pipe organ is many instruments in one case — and sometimes in several places in the room. Tap each division.',
  partsWarn: 'Never touch the pipes, the shutters, the panels, the wiring or the blower, and never hang anything from the organ. Access to the loft, the gallery and the chambers is the venue’s to give.',
  variantKey: 'ROOM',
});

type PageFn = (p: PageProps) => ReactNode;
const pin = (id: SourcePageId, v?: string): PageFn =>
  function OrganVariantPage(p: PageProps) {
    const vv = v ?? p.variant;
    const P = base[id];
    const ctx: VariantCtx = { variant: vv, setVariant: p.setVariant, options: v ? [] : p.lesson.model.variants.map((q) => ({ id: q.id, label: q.label, blurb: q.blurb })), key: 'ROOM' };
    return (
      <VariantContext.Provider value={ctx}>
        <P key={vv} {...p} variant={vv} />
      </VariantContext.Provider>
    );
  };

export const A12_PAGES: Partial<Record<SourcePageId, PageFn>> = {
  ...base,
  instrument: meet,
  sound: OrganSound,
  setting: OrganSetting,
  placement: pin('placement'),
  context: pin('context', 'service'),
  twoMic: pin('twoMic'),
};
export const A12_STEP_COUNTS = { instrument: 3, sound: 4, setting: 2 } as const;
export const A12_LESSON_ART = { ...A12_ART, pages: A12_PAGES, stepCounts: A12_STEP_COUNTS };
