/**
 * LAB 5 ENSEMBLE PAGES — the journey (docs/labs/miking/LESSON_JOURNEY.md) for
 * an ensemble, on the shared stage (EnsembleStage) and the array tool:
 *
 *   MEET IT          START (the journey and the two paths) → WHAT IT IS (the
 *                    ensemble on its stage) → THE SECTIONS (tap a section:
 *                    what it is, where it sits as the conductor faces it) →
 *                    WHERE THE SOUND LEAVES (each family's radiation, and why
 *                    the front desks arrive louder at a main pair) → checks
 *   STARTING SETUPS  real arrays and supports drawn on the stage, one at a
 *                    time: the stand, the bar, the capsules, the aim, the
 *                    height and distance as dimensions, the array's exact
 *                    shape in a corner → what else the mics hear → before any
 *                    mic (the checks)
 *   PLACEMENT STUDIO the worked example (a main array read piece by piece) →
 *                    START from a setup, move the ARRAY (height, distance,
 *                    across; its spacing or angle where the method allows),
 *                    rest it in two recommended starting points → how they
 *                    work → checks
 *   microphones, studio or live, two mics, troubleshoot, practice: the
 *   shared pages (shared/hand/handPages) in the lesson's words.
 *
 * A lesson supplies its stage and setups as DATA (`EnsembleData`, below, on
 * the lesson object: walked by the learner-text test) and its words for the
 * shared pages (`HandSpec`). Groups 2, 4 and 5 build on the same pieces: a
 * new seating preset (seating.ts), its setups and zones, the same pages.
 *
 * Suggested starting points in plain words; no sources or badges on screen;
 * FULLY SILENT; nothing moves by itself.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../../../theme/tokens';
import type { BezelItem, DockParam } from '../../../../rack/rackTypes';
import { ExpandableFigure } from '../../../../kit/ExpandableFigure';
import type { Lesson, SourcePageId, Vec3 } from '../../../engine/model/types.ts';
import { PageSteps, type MikingStep } from '../../../engine/steps';
import { Body, Card, Landing, Note, NowLine, Point, PredictCard, ScenarioList } from '../../../engine/kit';
import type { PageProps } from '../../../pages/pageTypes';
import { aroundItems } from '../../../pages/PSetups';
import { factsStep, startStep } from '../journeyPages';
import { makeHandPages, type HandSpec } from '../hand/handPages';
import { dist, fmtM, fmtStage, sideWords, v3, type StageView } from './frameS.ts';
import { arrayClear, edges, nearFar, seatingOf, seatsOf, soundPoint, type Seating } from './seating.ts';
import { ARRAYS, arrayCapsules, dtLR, frontBackDb, insideRecordingAngle, type ArrayParams, type ArrayPlacement, type ArrayPresetId } from './stereoArray.ts';
import { EnsembleStage, type StageRig, type StageRing, type StageSingle, type StageSpill, type StageZone } from './EnsembleStage';
import { variantShort } from './ensembleModel.ts';
import { MIC_TYPES } from '../../../data/micTypes.ts';
import { nomDb, worstSpill, worstThreeToOne, type Spill } from './stagePlot.ts';
import type { ArrayMount, EnsembleData, EnsembleLesson, EnsembleSetup } from './ensembleData.ts';

/* ═══════════════════ the lesson's DATA (ensembleData.ts) ═══════════════════ */
export type { EnsembleData, EnsembleLesson, EnsembleSetup, PlaceZone } from './ensembleData.ts';
export const ensembleOf = (l: Lesson): EnsembleData => (l as EnsembleLesson).ensemble;
export const seatingFor = (l: Lesson, variant: string): Seating => seatingOf(ensembleOf(l).seatings[variant] ?? Object.values(ensembleOf(l).seatings)[0]);
export const setupsFor = (l: Lesson, variant: string): EnsembleSetup[] => ensembleOf(l).setups.filter((s) => !s.variants || s.variants.includes(variant));

/** A setup as the stage draws it (group 4: a single with a `typeId` is drawn
 *  as that mic — a vocal dynamic, an instrument dynamic — not the pencil). */
export function stageOf(s: EnsembleSetup): { rigs: StageRig[]; singles: StageSingle[] } {
  return {
    rigs: [...(s.rig ? [{ key: `${s.id}:rig`, ...s.rig }] : []), ...(s.extraRigs ?? []).map((r, i) => ({ key: `${s.id}:rig${i + 2}`, ...r }))],
    singles: (s.singles ?? []).map((m) => {
      const t = m.typeId ? MIC_TYPES[m.typeId] : undefined;
      const look = t && t.address === 'end' ? { art: t.art as StageSingle['art'], len: t.body.length.mm, r: t.body.radius.mm } : {};
      // group 5's explicit drawing (art, len, cross, a stand foot) wins over a type's look.
      const own = m.art ? { art: m.art, len: m.len, cross: m.cross, r: undefined } : {};
      return { key: `${s.id}:${m.key}`, p: m.p, dir: m.aim, pattern: m.pattern, label: m.label, ...look, ...own, foot: m.foot };
    }),
  };
}

/* ── group 4: the STAGE-PLOT readouts (stagePlot.ts; every number derived) ── */
/** The sources a stage plot's spill is measured against: every section with
 *  an acoustic (or amplified) sound on the stage — a keyboard on a DI has none. */
export function plotSources(s: Seating): { id: string; label: string; p: Vec3 }[] {
  return s.sections.filter((q) => q.id !== 'keys').map((q) => ({ id: q.id, label: q.label, p: soundPoint(seatsOf(s, q.id)[0]) }));
}
export type PlotReadout = {
  open: number;
  nom: number;
  mics: { key: string; label: string; worst: { id: string; label: string; s: Spill } | null; from: Vec3 | null; to: Vec3 }[];
  three: ReturnType<typeof worstThreeToOne>;
};
export function plotReadout(setup: EnsembleSetup, s: Seating): PlotReadout {
  const caps = setup.rig ? arrayCapsules(setup.rig.id, setup.rig.params, setup.rig.place).length : 0;
  const singles = setup.singles ?? [];
  const open = caps + singles.length;
  const srcs = plotSources(s);
  const mics = singles.map((m) => {
    const own = m.own;
    const others = srcs.filter((q) => q.id !== m.src);
    const worst = own ? worstSpill({ p: m.p, dir: m.aim, pattern: m.pattern }, own, others) : null;
    return { key: m.key, label: m.label, worst, from: worst ? others.find((q) => q.id === worst.id)!.p : null, to: m.p };
  });
  const sep = singles.filter((m) => m.own).map((m) => ({ key: m.label, p: m.p, own: m.own! }));
  return { open, nom: nomDb(open), mics, three: sep.length >= 2 ? worstThreeToOne(sep) : null };
}
/** Group 4: the equal-distance ring round an array's centre (plan), through
 *  the players' sound points, and the spread of their 3-D distances to it. */
export function equalRing(s: Seating, c: Vec3): { ring: StageRing; spread: number; near: number; far: number } {
  const pts = s.seats.filter((q) => q.kind !== 'conductor').map(soundPoint);
  const plan = pts.map((p) => Math.hypot(p.x - c.x, p.z - c.z));
  const d3 = pts.map((p) => dist(p, c));
  const near = Math.min(...d3);
  const far = Math.max(...d3);
  return { ring: { key: 'ring', c: v3(c.x, 0, c.z), r: plan.reduce((a, b) => a + b, 0) / Math.max(1, plan.length) }, spread: far - near, near, far };
}
const dbWords = (x: number) => `${Math.round(x)} dB`;
/** One close mic's spill, in words (equal source levels, straight paths, no room). */
export function spillWords(m: PlotReadout['mics'][number]): string {
  const w = m.worst;
  if (!w) return `${m.label}: no neighbour on this stage.`;
  const pat = w.s.patternDb == null ? 'and it sits in the pattern’s null' : w.s.patternDb < 1 ? 'and it is in front of the mic — the pattern takes almost nothing off' : `and the pattern takes about ${dbWords(w.s.patternDb)} more`;
  return `${m.label}: its own source ${fmtDist(w.s.rOwn)} away; the ${w.label}, ${fmtDist(w.s.rOther)} — about ${dbWords(w.s.distanceDb)} lower by distance alone, ${pat}.`;
}
const fmtDist = (mm: number) => (mm < 1000 ? `${Math.round(mm / 10)} cm` : fmtM(mm));

/** The web preview harness only (`&setup=<n>`, 1-based; never the production router). */
function devSetupIndex(): number {
  if (!(__DEV__ && Platform.OS === 'web' && typeof window !== 'undefined')) return 0;
  const m = /[?&]setup=(\d+)/.exec(window.location.search);
  return m ? Math.max(0, Number(m[1]) - 1) : 0;
}

const VIEW_WORDS: Record<StageView, { label: string; blurb: string; tag: string }> = {
  plan: { label: 'FROM ABOVE', blurb: 'The seating plan as the conductor sees it: the conductor at the bottom, the ensemble beyond.', tag: 'FROM ABOVE · THE CONDUCTOR’S VIEW' },
  section: { label: 'FROM THE SIDE', blurb: 'Cut along the middle and seen from the conductor’s right: heights, rows and how far forward everything is.', tag: 'FROM THE SIDE · ALONG THE MIDDLE' },
  front: { label: 'FROM THE HALL', blurb: 'As the audience sees the stage: heights and how wide everything is.', tag: 'FROM THE HALL' },
};
/** Group 4: a stage plot's views, said as the audience sees the stage. */
const PLOT_VIEW_WORDS: Record<StageView, { label: string; blurb: string; tag: string }> = {
  plan: { label: 'FROM ABOVE', blurb: 'The stage plot: downstage and the audience at the bottom, the back wall at the top.', tag: 'FROM ABOVE · THE STAGE PLOT' },
  section: { label: 'FROM THE SIDE', blurb: 'Cut along the middle and seen from the audience’s right: heights, and how far upstage everything is.', tag: 'FROM THE SIDE · ALONG THE MIDDLE' },
  front: { label: 'FROM THE FRONT', blurb: 'As the audience sees the stage: heights and how wide everything is.', tag: 'FROM THE AUDIENCE' },
};
const viewWordsOf = (s: Seating) => (s.viewer === 'audience' ? PLOT_VIEW_WORDS : VIEW_WORDS);
function viewParam(view: StageView, setView: (v: StageView) => void, W: Record<StageView, { label: string; blurb: string; tag: string }> = VIEW_WORDS): DockParam {
  return {
    kind: 'options',
    id: 'view',
    label: 'VIEW',
    valueLabel: W[view].label.replace('FROM ', ''),
    selectedId: view,
    onSelect: (id) => setView(id as StageView),
    sticky: true,
    options: (['plan', 'section', 'front'] as const).map((v) => ({ id: v, label: W[v].label, blurb: W[v].blurb })),
  };
}
function variantParam(p: PageProps): DockParam[] {
  const vs = p.lesson.model.variants;
  if (vs.length < 2) return [];
  const cur = vs.find((v) => v.id === p.variant);
  return [{ kind: 'options', id: 'variant', label: 'SEATING', valueLabel: cur ? variantShort(p.lesson.model.id, cur.id, cur.label) : '', selectedId: p.variant, onSelect: (id) => p.setVariant(id), options: vs.map((v) => ({ id: v.id, label: v.label, blurb: v.blurb })) }];
}

/** "What it is": the ensemble on its stage, as a static figure. */
function StageFigure({ lesson, variant }: { lesson: Lesson; variant: string }) {
  const s = seatingFor(lesson, variant);
  const E = ensembleOf(lesson);
  const st = s.stage;
  const aspect = (st.x1 - st.x0 + 1000) / (st.z1 - st.z0 + 1000);
  return <ExpandableFigure badge={E.meet.figureBadge} title={E.meet.figureTitle} aspect={aspect} render={(w: number, h: number) => <EnsembleStage w={w} h={h} seating={s} view="plan" accessibilityLabel={`${E.meet.figureTitle}, from above as the ${s.viewer === 'audience' ? 'audience' : 'conductor'} sees it: ${s.sections.map((q) => q.label).join(', ')}.`} />} />;
}

/* ═══════════════════ 1 · MEET IT ═══════════════════ */
export function EnsembleMeet(p: PageProps) {
  const { lesson, journey, variant, answers, onAnswered } = p;
  const E = ensembleOf(lesson);
  const s = seatingFor(lesson, variant);
  const VW = viewWordsOf(s);
  const [view, setView] = useState<StageView>('plan');
  const [secId, setSecId] = useState<string | null>(null);
  const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set());
  const secs = s.sections;
  const sec = secs.find((q) => q.id === secId) ?? null;
  const pick = (id: string) => {
    if (id === 'cond') {
      setSecId('cond');
      return;
    }
    setSecId(id);
    setSeen((prev) => (prev.has(id) ? prev : new Set([...prev, id])));
  };
  const idx = Math.max(0, secs.findIndex((q) => q.id === secId));
  const players = sec ? seatsOf(s, sec.id) : [];
  const centre = sec ? players.map((q) => q.p).reduce((a, b) => v3(a.x + b.x / players.length, 0, a.z + b.z / players.length), v3(0, 0, 0)) : null;

  // WHERE THE SOUND LEAVES: one family at a time, and the main position's view.
  const families = useMemo(() => [...new Set(secs.map((q) => q.family))], [secs]);
  const [fam, setFam] = useState<string>('all');
  const [view2, setView2] = useState<StageView>('section');
  const [showMain, setShowMain] = useState(true);
  const radiate = fam === 'all' ? secs.map((q) => q.id) : secs.filter((q) => q.family === fam).map((q) => q.id);
  const M = E.meet.mainAt;
  const nf = nearFar(s, M);
  const dNear = dist(M, soundPoint(nf.near));
  const dFar = dist(M, soundPoint(nf.far));
  const bias = frontBackDb(M, soundPoint(nf.near), soundPoint(nf.far));
  const famWord = (f: string) => (f === 'all' ? 'EVERY SECTION' : f.toUpperCase());
  const rigM: StageRig[] = showMain ? [{ key: 'main', id: 'ab', place: { c: M, face: 0, tilt: 25 }, mount: s.podium ? { kind: 'boom', reach: 1500 } : { kind: 'stand' } }] : [];

  const steps: MikingStep[] = [
    startStep(lesson, journey, ''),
    factsStep(lesson, <StageFigure lesson={lesson} variant={variant} />),
    {
      key: 'parts',
      title: 'The sections',
      kind: 'TRY',
      layout: 'rack',
      rack: {
        render: (w, h) => <EnsembleStage w={w} h={h} seating={s} view={view} hi={secId} onTapSection={pick} accessibilityLabel={`${lesson.model.name}, ${VW[view].tag.toLowerCase()}.${sec ? ` Highlighted: the ${sec.label}, ${centre ? sideWords(centre, 600, s.viewer) : ''}.` : ''}`} />,
        badge: `${VW[view].tag} · tap a section to name it · amber outline = the one you picked · a typical layout`,
        bezel: [
          { k: 'SECTION', v: secId === 'cond' ? 'CONDUCTOR' : sec ? sec.short : 'TAP ONE', flex: 1.6 },
          { k: 'PLAYERS', v: sec ? `${players.length}` : '—', flex: 0.8 },
          { k: 'LOOKED AT', v: `${seen.size} / ${secs.length}`, flex: 1 },
        ],
        params: [
          {
            kind: 'fader',
            id: 'sec',
            label: 'SECTION',
            value: secs.length > 1 ? idx / (secs.length - 1) : 0,
            onChange: (v) => {
              const q = secs[Math.round(v * (secs.length - 1))];
              if (q) pick(q.id);
            },
            format: () => (sec ? `${sec.short} · ${players.length} ${players.length === 1 ? 'player' : 'players'}` : `step through the ${secs.length} sections`),
            formatShort: () => (sec ? sec.short.slice(0, 9) : 'STEP'),
          },
          viewParam(view, setView, VW),
          ...variantParam(p),
        ],
        initialParam: 'sec',
      },
      well: (
        <>
          <Landing looking={`${VW[view].tag.toLowerCase()} · ${s.label.toLowerCase()}`} prompt="Tap a section on the stage — or step through SECTION — to see what it is and where it sits. Switch VIEW to see heights and rows." />
          {sec && centre ? (
            <Card>
              <Point title={`${sec.label.toUpperCase()} · ${players.length} ${players.length === 1 ? 'PLAYER' : 'PLAYERS'}`}>{`${sideWords(centre, 600, s.viewer)[0].toUpperCase()}${sideWords(centre, 600, s.viewer).slice(1)}. ${sec.radiates}`}</Point>
            </Card>
          ) : secId === 'cond' ? (
            <Card>
              <Point title="THE CONDUCTOR">{s.podium ? 'On the podium in front, facing the ensemble. Everything on this page is said as the conductor faces the players: the conductor’s left is the left of the plan.' : 'This group plays without a conductor.'}</Point>
            </Card>
          ) : (
            <Note>{E.meet.sectionsNote}</Note>
          )}
          <Body>{`${s.blurb} Looked at: ${seen.size} of ${secs.length} sections.`}</Body>
        </>
      ),
    },
    {
      key: 'leaves',
      title: 'Where the sound leaves',
      kind: 'LEARN',
      layout: 'rack',
      rack: {
        render: (w, h) => <EnsembleStage w={w} h={h} seating={s} view={view2} radiate={radiate} rigs={rigM} aims={false} wedge={false} accessibilityLabel={`Where the sound leaves ${famWord(fam).toLowerCase()}: blue arcs from each player's instrument. ${showMain ? `A main pair ${fmtM(-M.y)} up: the nearest player is ${fmtM(dNear)} from it, the farthest ${fmtM(dFar)}, about ${bias.toFixed(0)} dB apart by distance alone.` : ''}`} />,
        badge: 'Blue arcs = where the sound leaves, not how loud · a simplified picture: straight paths, no room',
        bezel: [
          { k: 'FAMILY', v: famWord(fam), flex: 1.4 },
          { k: 'NEAREST', v: showMain ? fmtM(dNear) : '—', flex: 1 },
          { k: 'FARTHEST', v: showMain ? fmtM(dFar) : '—', flex: 1 },
          { k: 'BY DISTANCE', v: showMain ? `${bias.toFixed(0)} dB` : '—', flex: 1 },
        ],
        params: [
          { kind: 'options', id: 'fam', label: 'FAMILY', valueLabel: famWord(fam).split(' ')[0], selectedId: fam, onSelect: setFam, sticky: true, options: [{ id: 'all', label: 'EVERY SECTION', blurb: 'All the arcs at once.' }, ...families.map((f) => ({ id: f, label: f.toUpperCase(), blurb: secs.filter((q) => q.family === f).map((q) => q.label).join(', ') }))] },
          { kind: 'toggle', id: 'main', label: showMain ? 'MAIN PAIR ON' : 'MAIN PAIR OFF', value: showMain, onToggle: () => setShowMain((x) => !x) },
          viewParam(view2, setView2, VW),
          ...variantParam(p),
        ],
        initialParam: 'fam',
      },
      well: (
        <>
          <Landing looking="Where the sound leaves each instrument" prompt="Choose a FAMILY: the arcs show where each instrument’s sound leaves it. Then read how far the nearest and farthest players are from a main pair." />
          <Card>
            {(fam === 'all' ? secs : secs.filter((q) => q.family === fam)).slice(0, 6).map((q) => (
              <Point key={q.id} title={q.label.toUpperCase()}>
                {q.radiates}
              </Point>
            ))}
          </Card>
          <Note>{E.meet.soundNote}</Note>
          {showMain ? <Body>{`At the main pair, ${fmtM(-M.y)} up: the nearest player is ${fmtM(dNear)} away, the farthest ${fmtM(dFar)} — about ${bias.toFixed(0)} dB apart by distance alone (calculated from the drawing). The players and the hall balance much of that; the pair hears the balance they make.`}</Body> : null}
        </>
      ),
    },
    {
      key: 'check',
      title: 'Check',
      kind: 'CHECK',
      layout: 'read',
      body: (
        <>
          <Card>
            {lesson.sound.stages.map((q) => (
              <Point key={q.title} title={q.title.toUpperCase()}>
                {q.text}
              </Point>
            ))}
          </Card>
          <ScenarioList items={lesson.scenarios.filter((q) => q.page === 'meet')} answers={answers} onAnswered={onAnswered} />
        </>
      ),
    },
  ];
  return <PageSteps steps={steps} />;
}

/* ═══════════════════ 2 · STARTING SETUPS ═══════════════════ */
function SetupCard({ s, seating }: { s: EnsembleSetup; seating: Seating }) {
  const r = s.rig;
  return (
    <View style={styles.card}>
      <Text style={styles.role}>{s.role}</Text>
      <Text style={styles.title}>{s.title}</Text>
      <Text style={styles.line}>
        <Text style={styles.key}>{'MICS · '}</Text>
        {s.mics}
      </Text>
      <Text style={styles.line}>
        <Text style={styles.key}>{'START · '}</Text>
        {s.start}
      </Text>
      {r ? (
        <Text style={styles.line}>
          <Text style={styles.key}>{'THE ARRAY · '}</Text>
          {s.arrayWords?.what ?? ARRAYS[r.id].what}
        </Text>
      ) : null}
      <Text style={styles.tendency}>
        <Text style={styles.key}>{'TENDS TO · '}</Text>
        {s.line}
      </Text>
      {r ? (
        <Text style={styles.line}>
          <Text style={styles.key}>{'CHECK · '}</Text>
          {s.arrayWords?.check ?? ARRAYS[r.id].check}
        </Text>
      ) : null}
      {seating.podium && r ? <Text style={styles.small}>{`Height ${fmtStage(-r.place.c.y)} above the floor; ${r.place.c.z >= 0 ? `${fmtStage(r.place.c.z)} in front of the front row` : `${fmtStage(-r.place.c.z)} behind it`}.`}</Text> : null}
      {s.di?.length ? (
        <Text style={styles.line}>
          <Text style={styles.key}>{'DI · '}</Text>
          {`${s.di.map((id) => seating.sections.find((q) => q.id === id)?.label ?? id).join(', ')}: a line output or DI box, no mic.`}
        </Text>
      ) : null}
      {s.roles ? (
        <Text style={styles.line}>
          <Text style={styles.key}>{'ROLES · '}</Text>
          {s.roles}
        </Text>
      ) : null}
    </View>
  );
}

/** Group 4: the stage plot's readouts under a setup card (derived; said once
 *  as a simplified picture). */
function PlotCard({ r }: { r: PlotReadout }) {
  return (
    <Card>
      <Point title={`OPEN MICS · ${r.open}`}>{r.open > 1 ? `Each doubling of open mics costs about 3 dB of gain before feedback: ${r.open} open mics, about ${r.nom.toFixed(1)} dB less than one. Close the ones a song does not need.` : 'One open mic: the most gain before feedback this plot can have.'}</Point>
      {r.mics.length ? (
        <Point title="WHAT ELSE EACH CLOSE MIC HEARS">{r.mics.map((m) => spillWords(m)).join(' ')}</Point>
      ) : null}
      {r.three ? <Point title={`3:1 · ${r.three.ok ? 'MET' : 'NOT MET'}`}>{`The closest pair, ${r.three.a} and ${r.three.b}: ${fmtDist(r.three.apart)} apart, against ${fmtDist(r.three.need)} for 3 × the farther mic’s distance to its own source.${r.three.ok ? '' : ' Move a mic closer to its source, move the sources apart, or accept the bleed as part of the sound.'}`}</Point> : null}
      <Text style={styles.small}>A simplified picture: equal source levels, straight paths, ideal patterns, no room — what the drawing implies, not a measurement.</Text>
    </Card>
  );
}

export function EnsembleSetups(p: PageProps) {
  const { lesson, variant, onInteractive, interactiveDone, chooseStart, answers, onAnswered } = p;
  const E = ensembleOf(lesson);
  const s = seatingFor(lesson, variant);
  const list = setupsFor(lesson, variant);
  const core = list.filter((q) => q.core);
  const [idx, setIdx] = useState(devSetupIndex);
  const i = Math.min(idx, Math.max(0, list.length - 1));
  const sel = list[i] as EnsembleSetup | undefined;
  const [view, setView] = useState<StageView>(sel?.view ?? 'section');
  const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set());
  useEffect(() => {
    if (sel?.view) setView(sel.view);
  }, [sel?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!sel) return;
    setSeen((prev) => (prev.has(`${variant}|${sel.id}`) ? prev : new Set([...prev, `${variant}|${sel.id}`])));
    chooseStart?.(sel.id);
  }, [sel?.id, variant]); // eslint-disable-line react-hooks/exhaustive-deps
  const seenCore = core.filter((q) => seen.has(`${variant}|${q.id}`)).length;
  useEffect(() => {
    if (core.length && seenCore >= core.length && !interactiveDone.has('setupsSeen')) onInteractive('setupsSeen');
  }, [seenCore, core.length, interactiveDone, onInteractive]);
  const st = sel ? stageOf(sel) : { rigs: [], singles: [] };
  const c = sel?.rig?.place.c ?? sel?.singles?.[0]?.p ?? null;
  const a11y = sel ? `${sel.role}: ${sel.title}. ${sel.mics}. ${sel.start}` : 'No setup.';
  const around = aroundItems(lesson.setting.items);
  const VW = viewWordsOf(s);
  // Group 4: a stage plot's derived readouts and the spill paths drawn.
  const plot = E.plot && sel ? plotReadout(sel, s) : null;
  const spillPaths: StageSpill[] = plot ? plot.mics.filter((m) => m.from).map((m) => ({ key: `sp:${m.key}`, from: m.from!, to: m.to })) : [];
  const eq = E.ring && sel?.rig ? equalRing(s, sel.rig.place.c) : null;
  const bezel: BezelItem[] = plot
    ? [
        { k: 'SETUP', v: sel ? `${i + 1} / ${list.length}` : '—', flex: 0.8 },
        { k: 'OPEN MICS', v: `${plot.open}`, flex: 1 },
        { k: 'NOM COST', v: plot.open > 1 ? `${plot.nom.toFixed(1)} dB` : '0 dB', flex: 1 },
        { k: 'LOOKED AT', v: `${seenCore} / ${core.length}`, flex: 1 },
      ]
    : [
        { k: 'SETUP', v: sel ? `${i + 1} / ${list.length}` : '—', flex: 0.8 },
        { k: 'ARRAY', v: sel?.rig ? ARRAYS[sel.rig.id].short : sel ? ((sel.singles?.length ?? 0) > 1 ? 'CLOSE MICS' : 'SPOT') : '—', flex: 1.1 },
        { k: 'HEIGHT', v: c ? fmtM(-c.y) : '—', flex: 0.9 },
        { k: 'LOOKED AT', v: `${seenCore} / ${core.length}`, flex: 1 },
      ];
  const steps: MikingStep[] = [
    {
      key: 'setups',
      title: 'Starting setups',
      kind: 'WATCH',
      layout: 'rack',
      rack: {
        render: (w, h) => (sel ? <EnsembleStage w={w} h={h} seating={s} view={view} rigs={st.rigs} singles={st.singles} spill={spillPaths} rings={eq ? [eq.ring] : []} dims detail={!!sel.rig} lobes={view !== 'plan'} accessibilityLabel={a11y} /> : <Text style={styles.missing}>No starting setup for this seating.</Text>),
        badge: plot ? 'Placed for you · amber dashed = where each mic points · coral dots = the loudest neighbour reaching each close mic · the corner box = the array’s exact shape' : 'Placed for you · amber dashed = where each mic points · white = height and distance · the corner box = the array’s exact shape',
        bezel,
        params: [
          {
            kind: 'fader',
            id: 'setup',
            label: 'SETUP',
            value: list.length > 1 ? i / (list.length - 1) : 0,
            onChange: (v) => setIdx(Math.round(v * (list.length - 1))),
            format: () => (sel ? `${i + 1} of ${list.length} · ${sel.role.toLowerCase()}` : 'no setup'),
            formatShort: () => `${i + 1} / ${list.length}`,
          },
          { kind: 'options', id: 'pick', label: 'SETUPS', valueLabel: sel ? sel.role.split(' ')[0] : '—', selectedId: sel?.id ?? null, onSelect: (id) => setIdx(Math.max(0, list.findIndex((q) => q.id === id))), sticky: true, options: list.map((q) => ({ id: q.id, label: `${q.role} · ${q.title}`, blurb: q.line })) },
          viewParam(view, setView, VW),
          ...variantParam(p),
        ],
        initialParam: 'setup',
      },
      well: (
        <>
          <Landing looking={sel ? `${sel.role} · ${VW[view].tag.toLowerCase()}` : s.label} prompt="Step through SETUP. Each one is drawn on the stage: the stand, the bar or boom, each mic, where it points (amber) and its height and distance (white). Switch VIEW for heights or the plan." />
          {sel ? <SetupCard s={sel} seating={s} /> : <Note>No starting setup for this seating — try another in the dock.</Note>}
          {eq ? (
            <Card>
              <Point title={`EQUAL DISTANCE · ${fmtDist(eq.spread)} SPREAD`}>{`The players are ${fmtDist(eq.near)} to ${fmtDist(eq.far)} from the array’s centre (the white dotted ring, seen from above). The closer those distances, the more evenly the array hears them — moving a player is often the simplest balance control.`}</Point>
            </Card>
          ) : null}
          {plot ? <PlotCard r={plot} /> : null}
          <Body>{`Looked at: ${seenCore} of ${core.length} setups${list.length > core.length ? ` (and ${list.length - core.length} more to explore)` : ''}. The Placement Studio starts from the last one you look at.`}</Body>
        </>
      ),
    },
    {
      key: 'around',
      title: 'What else the mics hear',
      kind: 'LEARN',
      layout: 'read',
      body: (
        <>
          <Body>{`Before you choose a setup: what reaches the mics besides the ${lesson.noun.one}, what the stands and the mics keep clear of, and what changes for a recording or a live show.`}</Body>
          {around.near.length ? (
            <Card>
              <Text style={styles.key}>AROUND IT</Text>
              {around.near.map((it) => (
                <Point key={it.id} title={`${it.tag} · ${it.label.toUpperCase()}`}>
                  {it.note}
                </Point>
              ))}
            </Card>
          ) : null}
          <Card>
            <Text style={styles.key}>LIVE (WITH A PA)</Text>
            <Body>{lesson.setting.stage}</Body>
            {around.stage.map((it) => (
              <Point key={it.id} title={`${it.tag} · ${it.label.toUpperCase()}`}>
                {it.note}
              </Point>
            ))}
          </Card>
          <Card>
            <Text style={styles.key}>A RECORDING</Text>
            <Body>{lesson.setting.studio}</Body>
            {around.studio.map((it) => (
              <Point key={it.id} title={`${it.tag} · ${it.label.toUpperCase()}`}>
                {it.note}
              </Point>
            ))}
          </Card>
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
            {E.before.map((q) => (
              <Point key={q.title} title={q.title}>
                {q.text}
              </Point>
            ))}
          </Card>
          <Note tone="warn">{E.safety}</Note>
          <ScenarioList items={lesson.scenarios.filter((q) => q.page === 'setups')} answers={answers} onAnswered={onAnswered} />
        </>
      ),
    },
  ];
  return <PageSteps steps={steps} />;
}

/* ═══════════════════ 4 · THE PLACEMENT STUDIO (the main array) ═══════════════════ */
type Axis = 'h' | 'z' | 'x';
const AXIS: Record<Axis, { label: string; blurb: string; lo: number; hi: number }> = {
  h: { label: 'UP–DOWN', blurb: 'The array’s height above the floor.', lo: 1200, hi: 4500 },
  z: { label: 'TOWARD–AWAY', blurb: 'Closer to the players, or back toward the hall.', lo: -1500, hi: 4000 },
  x: { label: 'ACROSS', blurb: 'To the conductor’s left or right.', lo: -3000, hi: 3000 },
};

export { arrayClear } from './seating.ts';

export function EnsemblePlacement(p: PageProps) {
  const { lesson, variant, answers, onAnswered, onInteractive, interactiveDone, startFrom } = p;
  const E = ensembleOf(lesson);
  const s = seatingFor(lesson, variant);
  // Group 4: a stage plot's MOVE ranges and its words from the audience's side.
  const who = s.viewer === 'audience' ? 'audience' : 'conductor';
  const front = s.viewer === 'audience' ? 'the front line of the band' : 'the front row';
  const AX: Record<Axis, { label: string; blurb: string; lo: number; hi: number }> = {
    h: { ...AXIS.h, ...E.placeAxes?.h },
    z: { ...AXIS.z, ...E.placeAxes?.z, ...(s.viewer === 'audience' ? { blurb: 'Upstage toward the back wall, or downstage toward the audience.' } : {}) },
    x: { ...AXIS.x, ...E.placeAxes?.x, ...(s.viewer === 'audience' ? { blurb: 'To the audience’s left or right.' } : {}) },
  };
  const VW = viewWordsOf(s);
  const list = setupsFor(lesson, variant).filter((q) => q.rig);
  const workedId = E.worked[variant] ?? list[0]?.id;
  const worked = list.find((q) => q.id === workedId) ?? list[0];
  const fromStart = list.find((q) => q.id === startFrom) ?? worked;
  const zones = E.placeZones.filter((z) => !z.variants || z.variants.includes(variant));

  /* WATCH: the worked example. */
  const [exStep, setExStep] = useState(0);
  const exRig = worked?.rig;
  const exCaps = useMemo(() => (exRig ? arrayCapsules(exRig.id, exRig.params, exRig.place) : []), [exRig]);
  const exC = exRig?.place.c ?? v3(0, -3000, 1000);
  const pieces = exRig
    ? [
        { title: 'WHERE TO BEGIN', text: `${worked!.title}. ${E.workedWords.begin}`, view: 'plan' as StageView, cell: 0 },
        { title: 'THE ARRAY', text: `${ARRAYS[exRig.id].name}: ${ARRAYS[exRig.id].what}`, view: 'plan' as StageView, cell: 0 },
        { title: 'THE HEIGHT', text: E.workedWords.height ?? `${fmtStage(-exC.y)} above the floor — high enough to see past the front players to the rows behind. Higher hears more of the back rows and the hall; lower, more of the front desks.`, view: 'section' as StageView, cell: 1 },
        { title: 'HOW FAR FORWARD', text: E.workedWords.forward ?? `${exC.z >= 0 ? `${fmtStage(exC.z)} in front of the front row` : `${fmtStage(-exC.z)} behind it`}${s.podium ? ', over or just behind the podium' : ''}. Closer tends to more direct sound and more front-row weight; farther back, more blend and more of the room.`, view: 'section' as StageView, cell: 2 },
        { title: 'THE AIM', text: `${ARRAYS[exRig.id].recordingAngle ? `Facing the middle of the ensemble; its ${ARRAYS[exRig.id].recordingAngle}° recording angle (the amber wedge) should take in the whole width.` : 'Facing the middle of the ensemble, tilted down toward it.'} Move the whole array to change what it covers — not one mic of it.`, view: 'plan' as StageView, cell: 3 },
        { title: 'CLEARANCE', text: E.workedWords.clearance, view: 'front' as StageView, cell: 3 },
      ]
    : [];
  const wk = pieces[exStep];
  const exNF = nearFar(s, exC);
  const exBias = frontBackDb(exC, soundPoint(exNF.near), soundPoint(exNF.far));

  /* PLACE: start from a setup and move the array. */
  const [startId, setStartId] = useState(fromStart?.id ?? '');
  const start = list.find((q) => q.id === startId) ?? fromStart;
  const [preset, setPreset] = useState<ArrayPresetId>(start?.rig?.id ?? 'ab');
  const [params, setParams] = useState<ArrayParams>(start?.rig?.params ?? {});
  const [c, setC] = useState<Vec3>(start?.rig?.place.c ?? v3(0, -3000, 1500));
  const [rest, setRest] = useState<Vec3>(c);
  const [axis, setAxis] = useState<Axis>('h');
  const [view, setView] = useState<StageView>('section');
  const [visited, setVisited] = useState<ReadonlySet<string>>(() => new Set());
  const [moved, setMoved] = useState(false);
  const [predicted, setPredicted] = useState<string | null>(null);
  const cRef = useRef(c);
  cRef.current = c;
  const face = start?.rig?.place.face ?? 0;
  const tilt = start?.rig?.place.tilt ?? 25;
  const mount: ArrayMount = start?.rig?.mount ?? { kind: 'stand' };
  const pickStart = (id: string) => {
    const q = list.find((x) => x.id === id);
    if (!q?.rig) return;
    setStartId(id);
    setPreset(q.rig.id);
    setParams(q.rig.params ?? {});
    setC(q.rig.place.c);
    setRest(q.rig.place.c);
  };
  const place: ArrayPlacement = { c, face, tilt };
  const caps = useMemo(() => arrayCapsules(preset, params, place), [preset, params, c.x, c.y, c.z, face, tilt]); // eslint-disable-line react-hooks/exhaustive-deps
  const foot = mount.kind === 'boom' ? v3(c.x - Math.sin(face * (Math.PI / 180)) * mount.reach, 0, c.z + Math.cos(face * (Math.PI / 180)) * mount.reach) : v3(c.x, 0, c.z);
  const blocked = arrayClear(s, caps, foot);
  const zone = zones.find((z) => rest.x >= z.box.min.x && rest.x <= z.box.max.x && rest.y >= z.box.min.y && rest.y <= z.box.max.y && rest.z >= z.box.min.z && rest.z <= z.box.max.z) ?? null;
  useEffect(() => {
    // Only where the learner rested it (the start a setup gives earns nothing).
    if (moved && zone && !blocked) setVisited((prev) => (prev.has(zone.id) ? prev : new Set([...prev, zone.id])));
  }, [zone?.id, blocked, rest, moved]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (visited.size >= 2 && !interactiveDone.has('twoZones')) onInteractive('twoZones');
  }, [visited, interactiveDone, onInteractive]);
  const nf = nearFar(s, c);
  const bias = frontBackDb(c, soundPoint(nf.near), soundPoint(nf.far));
  const ed = edges(s);
  const dtEdge = Math.max(Math.abs(dtLR(caps, soundPoint(ed.left))), Math.abs(dtLR(caps, soundPoint(ed.right))));
  const ra = ARRAYS[preset].recordingAngle;
  const inside = ra ? s.sections.filter((q) => insideRecordingAngle(preset, place, soundPoint(seatsOf(s, q.id)[0])) === true).length : 0;
  const axisVal = axis === 'h' ? -c.y : axis === 'z' ? c.z : c.x;
  const A = AX[axis];
  const withAxis = (q: Vec3, v: number) => (axis === 'h' ? v3(q.x, -v, q.z) : axis === 'z' ? v3(q.x, q.y, v) : v3(v, q.y, q.z));
  const setAxisVal = (v: number) => setC((q) => withAxis(q, v));
  const presets = [...new Set(list.map((q) => q.rig!.id))];
  const def = ARRAYS[preset];
  const geom = def.spacing ? { key: 'spacing' as const, r: def.spacing, unit: 'mm', label: 'SPACING' } : def.angle ? { key: 'angle' as const, r: def.angle, unit: '°', label: 'ANGLE' } : def.turn ? { key: 'turn' as const, r: def.turn, unit: '°', label: 'TURN OUT' } : null;
  const gv = geom ? params[geom.key] ?? geom.r.def : 0;
  const params2: DockParam[] = [
    {
      kind: 'fader',
      id: 'move',
      label: 'MOVE',
      value: Math.max(0, Math.min(1, (axisVal - A.lo) / (A.hi - A.lo))),
      onChange: (v) => setAxisVal(Math.round((A.lo + v * (A.hi - A.lo)) / 50) * 50),
      onCommit: (v) => {
        const n = withAxis(cRef.current, Math.round((A.lo + v * (A.hi - A.lo)) / 50) * 50);
        setC(n);
        setRest(n);
        setMoved(true);
      },
      format: (v) => {
        const x = Math.round((A.lo + v * (A.hi - A.lo)) / 50) * 50;
        return axis === 'h' ? `${fmtStage(x)} above the floor` : axis === 'z' ? (x >= 0 ? `${fmtStage(x)} in front of ${front}` : `${fmtStage(-x)} behind it`) : x === 0 ? 'on the centre line' : `${fmtStage(Math.abs(x))} to the ${who}’s ${x < 0 ? 'left' : 'right'}`;
      },
      formatShort: () => (axis === 'h' ? fmtM(-c.y) : axis === 'z' ? fmtM(c.z) : fmtM(c.x)),
      chooser: { title: 'MOVE THE ARRAY', selectedId: axis, onSelect: (id) => setAxis(id as Axis), options: (['h', 'z', 'x'] as const).map((k) => ({ id: k, label: AX[k].label, blurb: AX[k].blurb })) },
    },
    ...(geom
      ? [
          {
            kind: 'fader' as const,
            id: 'geom',
            label: geom.label,
            value: (gv - geom.r.min) / (geom.r.max - geom.r.min),
            onChange: (v: number) => setParams((q) => ({ ...q, [geom.key]: Math.round(geom.r.min + v * (geom.r.max - geom.r.min)) })),
            format: () => (geom.key === 'spacing' ? `${Math.round(gv / 10)} cm apart` : `${Math.round(gv)}°`),
            formatShort: () => (geom.key === 'spacing' ? `${Math.round(gv / 10)} cm` : `${Math.round(gv)}°`),
            home: (geom.r.def - geom.r.min) / (geom.r.max - geom.r.min),
          },
        ]
      : []),
    { kind: 'options', id: 'array', label: 'ARRAY', valueLabel: def.short, selectedId: preset, onSelect: (id) => setPreset(id as ArrayPresetId), sticky: true, options: presets.map((id) => ({ id, label: ARRAYS[id].name, blurb: ARRAYS[id].what })) },
    { kind: 'options', id: 'start', label: 'START', valueLabel: (start?.role ?? '').split(' ')[0], selectedId: startId, onSelect: pickStart, options: list.map((q) => ({ id: q.id, label: `Start from: ${q.role} · ${q.title}`, blurb: q.start })) },
    viewParam(view, setView, VW),
  ];
  // Group 4: a small group's equal-distance ring and the spread of distances.
  const eqNow = E.ring ? equalRing(s, c) : null;
  const bezel: BezelItem[] = [
    { k: 'HEIGHT', v: fmtM(-c.y), flex: 0.9 },
    eqNow ? { k: 'SPREAD', v: fmtDist(eqNow.spread), flex: 0.9 } : { k: c.z >= 0 ? 'IN FRONT' : 'BEHIND', v: fmtM(Math.abs(c.z)), flex: 0.9 },
    { k: 'NEAR / FAR', v: `${bias.toFixed(0)} dB`, flex: 1 },
    ra ? { k: `IN ${ra}°`, v: `${inside} / ${s.sections.length}`, flex: 0.9 } : { k: 'EDGES Δt', v: `${dtEdge.toFixed(1)} ms`, flex: 1 },
    { k: 'ZONE', v: blocked ? 'BLOCKED' : zone ? 'IN ZONE' : '—', tint: blocked ? '#ff6b5e' : zone ? '#5bff85' : undefined, flex: 1 },
  ];
  const nowWords = `The ${def.name.toLowerCase()} is ${fmtStage(-c.y)} up, ${c.z >= 0 ? `${fmtStage(c.z)} in front of ${front}` : `${fmtStage(-c.z)} behind ${front}`}${Math.abs(c.x) > 50 ? `, ${fmtStage(Math.abs(c.x))} to the ${who}’s ${c.x < 0 ? 'left' : 'right'}` : ''}. The nearest and farthest players arrive about ${bias.toFixed(0)} dB apart by distance; ${ra ? `${inside} of ${s.sections.length} sections sit inside its ${ra}° recording angle` : `the outermost players reach the two sides up to ${dtEdge.toFixed(1)} ms apart`}.${zone ? ` At a recommended starting point: ${zone.label}.` : ' Not at a recommended starting point.'}${blocked ? ` Blocked: it would touch ${blocked}.` : ''}`;
  const zonesDrawn: StageZone[] = zones.map((z) => ({ key: z.id, box: z.box, on: zone?.id === z.id }));
  const rigNow: StageRig[] = [{ key: 'now', id: preset, params, place, mount }];
  const pred = lesson.predictions.placement;
  const exRigs: StageRig[] = exRig ? [{ key: 'ex', ...exRig }] : [];
  const steps: MikingStep[] = [
    {
      key: 'watch',
      title: 'Worked example',
      kind: 'WATCH',
      layout: 'rack',
      rack: {
        render: (w, h) => (wk ? <EnsembleStage w={w} h={h} seating={s} view={wk.view} rigs={exRigs} dims detail lobes={wk.view !== 'plan'} accessibilityLabel={`A worked example, placed for you: ${worked!.title}. ${wk.title.toLowerCase()}: ${wk.text}`} /> : <Text style={styles.missing}>No worked example here.</Text>),
        badge: 'WORKED EXAMPLE · placed for you · white = height and distance · the corner box = the array’s exact shape',
        bezel: [
          { k: exStep === 0 || exStep === 1 ? '▸ ARRAY' : 'ARRAY', v: exRig ? ARRAYS[exRig.id].short : '—', tint: exStep <= 1 ? '#ffc64d' : undefined, flex: 1 },
          { k: exStep === 2 ? '▸ HEIGHT' : 'HEIGHT', v: fmtM(-exC.y), tint: exStep === 2 ? '#ffc64d' : undefined, flex: 0.9 },
          { k: `${exStep === 3 ? '▸ ' : ''}${exC.z >= 0 ? 'IN FRONT' : 'BEHIND'}`, v: fmtM(Math.abs(exC.z)), tint: exStep === 3 ? '#ffc64d' : undefined, flex: 0.9 },
          { k: exStep >= 4 ? '▸ NEAR / FAR' : 'NEAR / FAR', v: `${exBias.toFixed(0)} dB`, tint: exStep >= 4 ? '#ffc64d' : undefined, flex: 1 },
        ],
        params: [{ kind: 'fader', id: 'piece', label: 'STEP', value: pieces.length > 1 ? exStep / (pieces.length - 1) : 0, onChange: (v) => setExStep(Math.round(v * (pieces.length - 1))), format: () => (wk ? `${exStep + 1} of ${pieces.length} · ${wk.title.toLowerCase()}` : ''), formatShort: () => `${exStep + 1} / ${pieces.length}` }],
        initialParam: 'piece',
      },
      well: (
        <>
          <Landing looking={`Worked example · ${worked?.title.toLowerCase() ?? ''}`} prompt="Step through how this starting point is read, piece by piece: the array, its height, how far forward, its aim, the clearance." />
          {wk ? (
            <Card>
              <Point title={`${exStep + 1} · ${wk.title}`}>{wk.text}</Point>
            </Card>
          ) : null}
          {exStep === pieces.length - 1 ? <Note tone="ok">That is the whole reading. Next, start from a setup and move the array yourself.</Note> : null}
          <Body>{`${exCaps.length} capsules in this array.`}</Body>
        </>
      ),
    },
    {
      key: 'place',
      title: 'Move the array',
      kind: 'PLACE',
      layout: 'rack',
      rack: {
        render: (w, h) => <EnsembleStage w={w} h={h} seating={s} view={view} rigs={rigNow} zones={zonesDrawn} rings={eqNow ? [eqNow.ring] : []} dims detail lobes={view !== 'plan'} accessibilityLabel={nowWords} />,
        badge: 'Blue = recommended starting points for the array’s centre · amber dot = the array’s centre · readouts calculated from the drawing',
        bezel,
        params: params2,
        initialParam: 'move',
      },
      well: (
        <>
          {pred ? <PredictCard p={pred} value={predicted} onPick={setPredicted} /> : null}
          <Landing looking={`${def.name} · ${start ? `started from ${start.role.toLowerCase()}` : ''}`} prompt="MOVE the array (choose UP–DOWN, TOWARD–AWAY or ACROSS) and let go to rest it. Rest its centre in two different blue zones. Watch what the readouts do." />
          <NowLine text={nowWords} />
          {eqNow ? <Body>{`Equal distance: the players are ${fmtDist(eqNow.near)} to ${fmtDist(eqNow.far)} from the array’s centre — ${fmtDist(eqNow.spread)} apart. The white dotted ring shows it from above.`}</Body> : null}
          {blocked ? <Note tone="warn">{`It would touch ${blocked}: the players, their bows and the conductor’s space come first. Move it.`}</Note> : null}
          {zone ? (
            <Card>
              <Point title={`RECOMMENDED STARTING POINT · ${zone.label.toUpperCase()}`}>{`${zone.band} ${zone.tendency}`}</Point>
            </Card>
          ) : (
            <Body>{`Not at a recommended starting point. For this seating: ${zones.map((z) => z.label).join('; ')}.`}</Body>
          )}
          <Body>{`Activity: zones rested in, clear of the players — ${visited.size} of 2${visited.size ? ` (${[...visited].map((id) => zones.find((z) => z.id === id)?.label ?? id).join('; ')})` : ''}.`}</Body>
          {predicted != null && visited.size >= 2 && pred ? <Note tone="ok">{pred.after}</Note> : null}
        </>
      ),
    },
    {
      key: 'learn',
      title: 'How the starting points work',
      kind: 'LEARN',
      layout: 'read',
      body: (
        <>
          {E.learnZones.map((t, k) => (
            <Body key={k}>{t}</Body>
          ))}
          <Note tone="warn">{E.safety}</Note>
        </>
      ),
    },
    {
      key: 'check',
      title: 'Check',
      kind: 'CHECK',
      layout: 'read',
      body: <ScenarioList items={lesson.scenarios.filter((q) => q.page === 'placement')} answers={answers} onAnswered={onAnswered} />,
    },
  ];
  return <PageSteps steps={steps} />;
}

/* ═══════════════════ the lesson's page set ═══════════════════ */
type PageFn = (p: PageProps) => ReactNode;
/** Lab 5's pages for a lesson: its own MEET IT, STARTING SETUPS and Placement
 *  Studio; the shared pages for the rest, in the lesson's words. */
export function makeEnsemblePages(spec: HandSpec): Partial<Record<SourcePageId, PageFn>> {
  const base = makeHandPages(spec, () => null) as Partial<Record<SourcePageId, PageFn>>;
  return {
    meet: EnsembleMeet,
    setups: EnsembleSetups,
    microphone: base.microphone,
    placement: EnsemblePlacement,
    context: base.context,
    twoMic: base.twoMic,
    troubleshoot: base.troubleshoot,
    practice: base.practice,
  };
}
/** Steps per page before a page reports (the strip's first count). */
export const ENSEMBLE_STEP_COUNTS = { meet: 5, setups: 3, placement: 4 } as const;

const styles = StyleSheet.create({
  card: { gap: 5, borderLeftWidth: 3, borderLeftColor: colors.amber, paddingLeft: 10 },
  role: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.4 },
  title: { color: colors.textPrimary, fontFamily: fonts.barlowSemiBold, fontSize: 15, lineHeight: 20 },
  key: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.1 },
  line: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 19 },
  tendency: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 19 },
  small: { color: colors.textMuted, fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 17 },
  missing: { color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 13, padding: 12 },
});
