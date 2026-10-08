/**
 * HAND-DRUM PAGES (tonbak, tabla) — the Kick journey (LESSON_JOURNEY.md) for
 * a drum played with the hands: meet → how it sounds (the lesson's own) →
 * where it sits → microphones → placement (worked example first) → studio or
 * live → two mics → troubleshoot → practice. One factory, the lesson's words
 * and anchors passed in (`HandSpec`), so each drum keeps its own voice
 * without copying the engine.
 *
 * Suggested starting points in plain words; no sources or badges on screen;
 * FULLY SILENT; nothing loops (the stroke sequence plays ONCE, D8).
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { cancelAnimation, Easing, useAnimatedReaction, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { colors, fonts } from '../../../../../../theme/tokens';
import { useAnimationsAllowed } from '../../../../../../features/settings/a11y';
import type { BezelItem, DockParam } from '../../../../rack/rackTypes';
import type { DocumentedZone, MicPattern, MicPose, MicSlot, SourcePageId, PatternId, Vec3, ViewBox, ViewId } from '../../../engine/model/types.ts';
import { PageSteps, type MikingStep } from '../../../engine/steps';
import { Body, Card, Landing, Note, NowLine, Point, PredictCard, ScenarioList, ZoneCard } from '../../../engine/kit';
import { useRig, type Rig } from '../../../engine/scene/useRig.ts';
import { DualView } from '../../../engine/scene/DualView';
import { PlacementScene } from '../../../engine/scene/PlacementScene';
import { CombPanel } from '../../../engine/scene/CombPanel';
import { InstrumentFigure } from '../../../engine/scene/InstrumentFigure';
import { placementBezel, lenCell, stopShortOf } from '../../../engine/scene/readoutText.ts';
import { readoutWords } from '../../../engine/scene/sceneWords.ts';
import type { LessonArt } from '../../../engine/scene/sceneTypes.ts';
import { zonesAvailable } from '../../../engine/geometry/zones.ts';
import { deriveReadouts } from '../../../engine/geometry/readouts.ts';
import { dist } from '../../../engine/geometry/vec.ts';
import { arrivalAngle, gainDb, isModelled, nearNull, nullAngles } from '../../../engine/physics/polar.ts';
import { C20, EQUAL_PATH_MM, deltaTms, effectivePolarity, micGain, notchesHz, pathDiffMm } from '../../../engine/physics/twoMic.ts';
import { fmtAngle, fmtDb, fmtHz, fmtIdealPickup, fmtLen, fmtMs, isDeepNull } from '../../../engine/model/units.ts';
import { MIC_TYPES, micType } from '../../../data/micTypes';
import { PTroubleshoot } from '../../../pages/PReadPages';
import type { PageProps } from '../../../pages/pageTypes';
import { Chip, GMicrophone, GPractice, factsStep, micSentence, posParams, startStep, type AimAxis, type AxisWords, type MicPageSpec, type PosAxis, type PracticeSpec } from '../journeyPages';
import { HandPlan, type HandPlanItem, type HandScene } from './HandPlan';
import { viewToggle } from '../../../engine/scene/viewToggle.ts';

export function useFocusedSafe(): boolean {
  try {
    return useIsFocused();
  } catch {
    return true; // the web preview harness mounts the page outside a navigator
  }
}

/* ── the stepped sequence (HOW IT SOUNDS): STEP, or PLAY ONCE ── */
const STEP_MS = 1300;
export function useStepper(n: number, hidden: boolean) {
  const motion = useAnimationsAllowed();
  const focused = useFocusedSafe();
  const reveal = useSharedValue(1);
  const [shown, setShown] = useState(1);
  const [playing, setPlaying] = useState(false);
  useAnimatedReaction(
    () => Math.max(1, Math.min(n, Math.floor(reveal.value + 0.001))),
    (cur, prev) => {
      if (cur !== prev) scheduleOnRN(setShown, cur);
    },
  );
  const stop = () => {
    cancelAnimation(reveal);
    setPlaying(false);
  };
  const goTo = (k: number) => {
    cancelAnimation(reveal);
    setPlaying(false);
    reveal.value = k;
    setShown(k);
  };
  const play = () => {
    if (playing) {
      stop();
      return;
    }
    const from = shown >= n ? 1 : Math.floor(reveal.value);
    if (!motion) {
      goTo(Math.min(n, from + (shown >= n ? 0 : 1)));
      return;
    }
    reveal.value = from;
    setPlaying(true);
    reveal.value = withTiming(n, { duration: (n - from) * STEP_MS, easing: Easing.linear }, (done) => {
      if (done) scheduleOnRN(setPlaying, false);
    });
  };
  useEffect(() => {
    if ((hidden || !focused) && playing) stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hidden, focused]);
  useEffect(() => () => cancelAnimation(reveal), []); // eslint-disable-line react-hooks/exhaustive-deps
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'step',
      label: 'STEP',
      value: (shown - 1) / Math.max(1, n - 1),
      onChange: (v) => goTo(1 + Math.round(v * (n - 1))),
      format: () => `${shown} of ${n}`,
      formatShort: () => `${shown} / ${n}`,
    },
    { kind: 'action', id: 'play', label: playing ? 'PAUSE' : shown >= n ? 'REPLAY ONCE' : motion ? 'PLAY ONCE' : 'NEXT STEP', onPress: play, tint: colors.green },
  ];
  return { shown, playing, goTo, play, params };
}

/* ── the lesson's own words and anchors ── */
export type WorkedPiece = { title: string; text: string; cell: number };
export type HandSpec = {
  art: LessonArt;
  /** Page 1. */
  intro: string;
  figure: { view: ViewId; title: string; badge: string; label: string; box: ViewBox };
  /** The parts page's frames: tighter than the placement views (the drum, not the room). */
  partsBox: Record<ViewId, ViewBox>;
  partsBadge: string;
  partsLooking: (view: ViewId) => string;
  partsNote: string;
  partsWarn: string;
  /** Page 3. */
  plan: {
    items: readonly HandPlanItem[];
    label: (scene: HandScene, selLabel: string | null) => string;
    looking: (scene: HandScene) => string;
    first: string;
    before: readonly { title: string; text: string }[];
    /** More steps after the plan (a hook, called on every render): Lab 3's
     *  harmonica adds its three signal paths (added 2026-10-05). */
    useExtra?: (p: PageProps) => MikingStep[];
  };
  /** Words the shared pages would otherwise say about a hand drum (Lab 3,
   *  2026-10-05: a harmonica, an accordion, a pipe organ). Absent = unchanged. */
  words?: { placeBadge?: string; clearance?: string; cardioidTried?: string; sourceNote?: string };
  /** Page 4. */
  mic: MicPageSpec;
  /** Page 5. */
  axes: AxisWords;
  aimWords: { az: string; el: string };
  outside: string;
  worked: { zone: string; mic: string; looking: string; pieces: (z: DocumentedZone) => WorkedPiece[]; done: string; label: string };
  place: { zone: string; mic: string; looking: string; prompt: string; tried: (predicted: string) => string; label: string; notes?: (rig: Rig) => ReactNode };
  learnZones: readonly string[];
  /** Page 6a. */
  ctx: { pose: MicPose; mic: string; plan: ViewBox; side: ViewBox; creditWedge: string; looking: string; prompt: string; label: string; learn: readonly { title: string; text: string }[] };
  /** Page 6b. */
  two: { A: { zone: string; mic: string }; B: { zone: string; mic: string }; names: { A: string; B: string }; looking: string; prompt: string; label: string; warn: string; learn: readonly string[] };
  /** Page 7. */
  practice: PracticeSpec;
};

/* ═══════════════ 1 · MEET THE DRUM ═══════════════ */
function HandInstrument(spec: HandSpec) {
  return function HInstrument({ lesson, journey, variant, hidden }: PageProps) {
    const model = lesson.model;
    const rig = useRig(lesson, { variant, mics: [{ slot: 'A', typeId: lesson.micTypeIds[0], pattern: 'cardioid', pose: lesson.zones[0].start }] });
    const [view, setView] = useState<ViewId>(spec.figure.view);
    const [partId, setPartId] = useState<string | null>(null);
    const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set());
    const parts = model.parts;
    const partIdx = Math.max(0, parts.findIndex((p) => p.id === partId));
    const pick = (id: string) => {
      setPartId(id);
      setSeen((prev) => (prev.has(id) ? prev : new Set([...prev, id])));
    };
    const shown = parts.find((p) => p.id === partId);
    const region = model.regions.find((r) => r.partId === partId);
    const tag = (v: ViewId) => (model.viewTags?.[v] ?? v).toLowerCase();
    const steps: MikingStep[] = [
      startStep(lesson, journey, spec.intro),
      factsStep(lesson, <InstrumentFigure art={spec.art} model={model} view={spec.figure.view} variant={variant} title={spec.figure.title} badge={spec.figure.badge} label={spec.figure.label} box={spec.figure.box} />),
      {
        key: 'parts',
        title: 'The parts',
        kind: 'TRY',
        layout: 'rack',
        rack: {
          render: (w, h) => (
            <PlacementScene rig={rig} art={spec.art} view={view} w={w} h={h} slots={[]} showZones={false} showPolar={false} showEnvelopes={false} showLive={false} interactive={!hidden} boxOverride={spec.partsBox[view]} highlight={partId} onTapPart={pick} accessibilityLabel={`The ${model.name}, ${tag(view)}.${shown ? ` Highlighted: ${shown.label}.` : ''}`} />
          ),
          badge: spec.partsBadge,
          bezel: [
            { k: 'PART', v: shown ? shown.short.toUpperCase() : 'TAP ONE', flex: 1.5 },
            { k: 'LOOKED AT', v: `${seen.size} / ${parts.length}` },
            { k: 'VIEW', v: (model.viewTags?.[view] ?? view).split(' ')[0] === 'FROM' ? (view === 'top' ? 'ABOVE' : 'SIDE') : view.toUpperCase() },
          ],
          params: [
            {
              kind: 'fader',
              id: 'part',
              label: 'PART',
              value: parts.length > 1 ? partIdx / (parts.length - 1) : 0,
              onChange: (v) => {
                const p = parts[Math.round(v * (parts.length - 1))];
                if (p) pick(p.id);
              },
              format: () => (shown ? `${shown.short.toUpperCase()} · ${seen.size} of ${parts.length} looked at` : `step through the ${parts.length} parts`),
              formatShort: () => (shown ? shown.short.toUpperCase().slice(0, 9) : 'STEP'),
            },
            ...viewToggle({ view: view, setView: setView, stage: 'single', labels: ['SIDE VIEW', 'FROM ABOVE'] }),
          ],
          initialParam: 'part',
        },
        well: (
          <>
            <Landing looking={spec.partsLooking(view)} prompt="Tap any part — or step through PART — to see what it is and what it does. There is nothing to answer on this page." />
            {shown ? (
              <Card>
                <Point title={shown.label.toUpperCase()}>{shown.role}</Point>
                {region ? <Body>{`WHERE SOUND COMES FROM · ${region.note}`}</Body> : null}
              </Card>
            ) : (
              <Note>{spec.partsNote}</Note>
            )}
            <Note tone="warn">{spec.partsWarn}</Note>
          </>
        ),
      },
    ];
    return <PageSteps steps={steps} />;
  };
}

/* ═══════════════ 3 · WHERE IT SITS ═══════════════ */
function HandSetting(spec: HandSpec) {
  const useExtra = spec.plan.useExtra ?? (() => [] as MikingStep[]);
  return function HSetting(p: PageProps) {
    const { lesson, answers, onAnswered, variant } = p;
    const extra = useExtra(p);
    const items = lesson.setting.items;
    const byId = (id: string | null) => items.find((i) => i.id === id);
    const [scene, setScene] = useState<HandScene>('stage');
    const [sel, setSel] = useState<string | null>(null);
    const planItems = spec.plan.items.filter((i) => (i.scene === 'all' || i.scene === scene) && byId(i.id));
    const idx = Math.max(0, planItems.findIndex((i) => i.id === sel));
    const it = byId(sel);
    const steps: MikingStep[] = [
      {
        key: 'plan',
        title: 'Stage and studio',
        kind: 'LEARN',
        layout: 'rack',
        rack: {
          render: (w, h) => (
            <HandPlan
              w={w}
              h={h}
              art={spec.art}
              variant={variant}
              scene={scene}
              wedges={lesson.live.wedges}
              items={planItems}
              labelOf={(id) => byId(id)?.short ?? id.toUpperCase()}
              highlight={sel}
              onTap={setSel}
              accessibilityLabel={spec.plan.label(scene, it ? it.label : null)}
            />
          ),
          badge: scene === 'stage' ? 'From above · a typical layout, not a measurement · dashed amber = the item you picked' : 'From above · a typical studio room',
          bezel: [
            { k: 'ITEM', v: it ? it.short : 'TAP ONE', flex: 1.4 },
            { k: 'FOR A MIC', v: it ? it.tag : '—', flex: 1.4 },
            { k: 'WHERE', v: scene === 'stage' ? 'LIVE' : 'STUDIO' },
          ],
          params: [
            {
              kind: 'fader',
              id: 'item',
              label: 'ITEM',
              value: planItems.length > 1 ? idx / (planItems.length - 1) : 0,
              onChange: (v) => {
                const p = planItems[Math.round(v * (planItems.length - 1))];
                if (p) setSel(p.id);
              },
              format: () => (it ? `${it.short} · ${it.tag}` : `step through the ${planItems.length} items`),
              formatShort: () => (it ? it.short.slice(0, 9) : 'STEP'),
            },
            {
              kind: 'options',
              id: 'where',
              label: scene === 'stage' ? 'STAGE' : 'STUDIO',
              valueLabel: scene === 'stage' ? 'LIVE' : 'STUDIO',
              selectedId: scene,
              onSelect: (id) => {
                setScene(id as HandScene);
                setSel(null);
              },
              sticky: true,
              options: [
                { id: 'stage', label: 'ON A STAGE (LIVE)', blurb: lesson.setting.stage },
                { id: 'studio', label: 'IN A STUDIO', blurb: lesson.setting.studio },
              ],
            },
          ],
          initialParam: 'item',
        },
        well: (
          <>
            <Landing looking={spec.plan.looking(scene)} prompt="Tap what sits round the player — or step through ITEM — to see what it means for a mic." />
            {it ? (
              <Card>
                <Point title={it.label.toUpperCase()}>{it.note}</Point>
              </Card>
            ) : (
              <Note>{spec.plan.first}</Note>
            )}
            <Body>{scene === 'stage' ? lesson.setting.stage : lesson.setting.studio}</Body>
          </>
        ),
      },
      ...extra,
      {
        key: 'before',
        title: 'Before any mic',
        kind: 'CHECK',
        layout: 'read',
        body: (
          <>
            <Card>
              {spec.plan.before.map((b) => (
                <Point key={b.title} title={b.title}>
                  {b.text}
                </Point>
              ))}
            </Card>
            <Note tone="warn">Protect your hearing at soundcheck. A widely used guideline: no more than 85 dBA averaged over an 8-hour day, and halve the time for every 3 dBA above that. That is a limit for PEOPLE, measured where a person listens. It has nothing to do with a microphone’s maximum SPL rating. Keep levels and repetitions down, and use hearing protection.</Note>
            <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'setting')} answers={answers} onAnswered={onAnswered} />
          </>
        ),
      },
    ];
    return <PageSteps steps={steps} />;
  };
}

/* ═══════════════ 5 · PLACEMENT ═══════════════ */
function nowLine(rig: Rig, slots: MicSlot[], outside: string): string {
  return slots.map((s) => micSentence(rig, s, { outside })).join(' ');
}

/** One mic of a PAIR in words, measured from ITS OWN zone's surface and line
 *  (the rig measures every mic from one surface; a pair over two heads, or a
 *  head and an opening, needs each from its own). */
function ownSentence(rig: Rig, slot: MicSlot, z: DocumentedZone, outside: string): string {
  const m = rig.mics.find((q) => q.slot === slot) ?? rig.mics[0];
  const lineId = z.radial?.line ?? rig.lineId;
  const r = deriveReadouts(rig.ctx[slot], m.pose, z.refSurface, lineId);
  const s = rig.lesson.model.surfaces.find((q) => q.id === z.refSurface);
  const l = rig.lesson.model.lines.find((q) => q.id === lineId);
  const at = r.zoneId ? rig.lesson.zones.find((q) => q.id === r.zoneId) ?? null : null;
  return `Mic ${slot}: ${micType(m.typeId).label.toLowerCase()}, ${outside}, ${fmtLen(Math.abs(r.distance))} from ${s?.label ?? 'the reference'}, ${fmtLen(r.radial)} off ${l?.label ?? 'the reference line'}, aimed ${fmtAngle(r.offAxis)} off it.${at ? ` At a suggested starting point: ${at.label}.` : ' Not at a suggested starting point.'}${r.blocked ? ` Stopped: it would touch the ${r.blocked.label}.` : ' Clear of every part.'}`;
}

function HandPlacement(spec: HandSpec) {
  return function HPlacement({ lesson, answers, onAnswered, onInteractive, interactiveDone, variant, hidden }: PageProps) {
    const exZone = lesson.zones.find((z) => z.id === spec.worked.zone) ?? lesson.zones[0];
    const ex = useRig(lesson, { variant, mics: [{ slot: 'A', typeId: spec.worked.mic, pattern: 'cardioid', pose: exZone.start }] });
    useEffect(() => {
      if (ex.surfaceId !== exZone.refSurface) ex.setSurfaceId(exZone.refSurface);
    }, [ex, exZone]);
    const [exView, setExView] = useState<ViewId>('top');
    const [exStep, setExStep] = useState(0);
    const pieces = spec.worked.pieces(exZone);
    const wk = pieces[exStep];
    const exBezel: BezelItem[] = placementBezel(ex.shown('A'), readoutWords(ex, 'A'), exZone, stopShortOf(lesson.model)).map((c, i) => (i === wk.cell ? { ...c, k: `▸ ${c.k}`, tint: '#ffc64d' } : c));

    const startZone = lesson.zones.find((z) => z.id === spec.place.zone) ?? lesson.zones[0];
    const rig = useRig(lesson, { variant, mics: [{ slot: 'A', typeId: spec.place.mic, pattern: 'cardioid', pose: startZone.start }] });
    const [view, setView] = useState<ViewId>('top');
    const [posAxis, setPosAxis] = useState<PosAxis>('x');
    const [aimAxis, setAimAxis] = useState<AimAxis>('az');
    const [visited, setVisited] = useState<ReadonlySet<string>>(() => new Set());
    const [predicted, setPredicted] = useState<string | null>(null);
    const mic = rig.mics[0];
    const t = micType(mic.typeId);
    const r0 = rig.readouts('A');
    const zone = r0.zoneId ? lesson.zones.find((z) => z.id === r0.zoneId) ?? null : null;
    useEffect(() => {
      if (zone && zone.refSurface !== rig.surfaceId) rig.setSurfaceId(zone.refSurface);
    }, [zone, rig]);
    useEffect(() => {
      if (rig.surfaceId !== startZone.refSurface && !zone) rig.setSurfaceId(startZone.refSurface);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const shown = rig.shown('A');
    const lastVersion = useRef(-1);
    useEffect(() => {
      if (rig.version === lastVersion.current) return;
      lastVersion.current = rig.version;
      if (r0.zoneId && !r0.blocked) setVisited((prev) => (prev.has(r0.zoneId!) ? prev : new Set([...prev, r0.zoneId!])));
    }, [rig.version, r0.zoneId, r0.blocked]);
    useEffect(() => {
      if (visited.size >= 2 && !interactiveDone.has('twoZones')) onInteractive('twoZones');
    }, [visited, interactiveDone, onInteractive]);
    const available = zonesAvailable(lesson.zones, rig.variant, mic.typeId, t.mount);
    const params: DockParam[] = [
      ...posParams({ rig, slot: 'A', posAxis, setPosAxis, aimAxis, setAimAxis, words: spec.axes, aimWords: spec.aimWords, azCentre: Math.round(startZone.start.az) }),
      ...viewToggle({ view: view, setView: setView, stage: 'dual', labels: ['SIDE VIEW', 'FROM ABOVE'] }),
      {
        kind: 'group',
        id: 'setup',
        label: 'SETUP',
        valueLabel: t.short,
        render: () => (
          <View style={styles.tray}>
            <Text style={styles.trayHead}>MIC TYPE</Text>
            <View style={styles.chips}>
              {lesson.micTypeIds.filter((id) => zonesAvailable(lesson.zones, rig.variant, id, MIC_TYPES[id].mount).length > 0).map((id) => (
                <Chip key={id} on={id === mic.typeId} label={MIC_TYPES[id].label} onPress={() => rig.setType('A', id)} />
              ))}
            </View>
            <Text style={styles.trayHead}>MEASURE FROM (when not in a zone)</Text>
            <View style={styles.chips}>
              {lesson.model.surfaces.map((s) => (
                <Chip key={s.id} on={s.id === rig.surfaceId} label={s.label} onPress={() => rig.setSurfaceId(s.id)} />
              ))}
            </View>
          </View>
        ),
      },
      {
        kind: 'options',
        id: 'zone',
        label: 'ZONE',
        valueLabel: zone ? 'IN ZONE' : 'GO TO',
        selectedId: zone?.id ?? null,
        onSelect: (id) => {
          const z = lesson.zones.find((q) => q.id === id);
          if (z) {
            rig.setSurfaceId(z.refSurface);
            rig.jumpTo('A', z.start);
          }
        },
        options: available.map((z) => ({ id: z.id, label: z.label, blurb: z.band })),
      },
    ];
    const bezel: BezelItem[] = placementBezel(shown, readoutWords(rig, 'A'), zone, stopShortOf(lesson.model));
    const pred = lesson.predictions.placement;
    const tried = predicted != null && visited.size >= 2;
    const steps: MikingStep[] = [
      {
        key: 'watch',
        title: 'Worked example',
        kind: 'WATCH',
        layout: 'rack',
        rack: {
          render: (w, h) => <DualView rig={ex} art={spec.art} view={exView} setView={setExView} w={w} h={h} slots={['A']} interactive={false} labelFor={(v) => `${spec.worked.label}, ${(lesson.model.viewTags?.[v] ?? v).toLowerCase()}. A worked example: the mic is placed for you. ${nowLine(ex, ['A'], spec.outside)}`} />,
          badge: 'WORKED EXAMPLE · placed for you · blue = suggested starting point · dashed lobe = pattern shape',
          bezel: exBezel,
          params: [
            { kind: 'fader', id: 'piece', label: 'STEP', value: exStep / (pieces.length - 1), onChange: (v) => setExStep(Math.round(v * (pieces.length - 1))), format: () => `${exStep + 1} of ${pieces.length} · ${wk.title.toLowerCase()}`, formatShort: () => `${exStep + 1} / ${pieces.length}` },
            ...viewToggle({ view: exView, setView: setExView, stage: 'dual', labels: ['SIDE VIEW', 'FROM ABOVE'] }),
          ],
          initialParam: 'piece',
        },
        well: (
          <>
            <Landing looking={spec.worked.looking} prompt="Step through how this starting point is read, piece by piece. The lit cell on the bezel is the piece being read." />
            <Card>
              <Point title={`${exStep + 1} · ${wk.title}`}>{wk.text}</Point>
            </Card>
            {exStep === pieces.length - 1 ? <Note tone="ok">{spec.worked.done}</Note> : null}
          </>
        ),
      },
      {
        key: 'place',
        title: 'Place it yourself',
        kind: 'PLACE',
        layout: 'rack',
        rack: {
          render: (w, h) => <DualView rig={rig} art={spec.art} view={view} setView={setView} w={w} h={h} slots={['A']} interactive={!hidden} labelFor={(v) => `${spec.place.label}, ${(lesson.model.viewTags?.[v] ?? v).toLowerCase()}. ${nowLine(rig, ['A'], spec.outside)}`} />,
          badge: spec.words?.placeBadge ?? 'Blue = suggested starting points · grey dashes = the player’s hands and body · pinch to zoom',
          bezel,
          params,
          initialParam: 'pos',
        },
        well: (
          <>
            {pred ? <PredictCard p={pred} value={predicted} onPick={setPredicted} /> : null}
            <Landing looking={`${t.short} · ${spec.place.looking}`} prompt={spec.place.prompt} />
            <NowLine text={nowLine(rig, ['A'], spec.outside)} />
            {shown.blocked ? <Note tone="warn">{`It would touch ${shown.blocked.label} — the mic stops there. The player’s space comes first.`}</Note> : null}
            {zone ? <ZoneCard z={zone} /> : <Body>{`Not at a suggested starting point. Starting points for this mic: ${available.map((z) => z.label).join('; ')}.`}</Body>}
            <Body>{`Activity: zones rested in, clear of the player — ${visited.size} of 2${visited.size ? ` (${[...visited].map((id) => lesson.zones.find((z) => z.id === id)?.label ?? id).join('; ')})` : ''}.`}</Body>
            {tried && predicted ? <Note tone="ok">{spec.place.tried(predicted)}</Note> : null}
            {spec.place.notes ? spec.place.notes(rig) : null}
          </>
        ),
      },
      {
        key: 'learn',
        title: 'How zones work',
        kind: 'LEARN',
        layout: 'read',
        body: (
          <>
            {spec.learnZones.map((p, i) => (
              <Body key={i}>{p}</Body>
            ))}
            <Note tone="warn">{spec.words?.clearance ?? 'Clearance comes first: the hands’ whole path — vigorous passages included — the legs, the supports and the player’s normal movement. No stand or cable in the way out.'}</Note>
          </>
        ),
      },
      {
        key: 'check',
        title: 'Check',
        kind: 'CHECK',
        layout: 'read',
        body: <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'placement')} answers={answers} onAnswered={onAnswered} />,
      },
    ];
    return <PageSteps steps={steps} />;
  };
}

/* ═══════════════ 6a · STUDIO OR LIVE ═══════════════ */
const NULL_TOL = 15;
const AZ_MAX = 60;
const EL_MAX = 35;
const PATTERNS: PatternId[] = ['cardioid', 'supercardioid', 'hypercardioid'];

function HandContext(spec: HandSpec) {
  return function HContext({ lesson, answers, onAnswered, onInteractive, interactiveDone, variant }: PageProps) {
    const C = spec.ctx;
    const rig = useRig(lesson, { variant, mics: [{ slot: 'A', typeId: C.mic, pattern: 'cardioid', pose: C.pose }] });
    const [live, setLive] = useState(true);
    const [pattern, setPattern] = useState<PatternId>('cardioid');
    const [wedgeId, setWedgeId] = useState(C.creditWedge);
    const [view, setView] = useState<ViewId>('top');
    const [aimAxis, setAimAxis] = useState<'az' | 'el'>('az');
    const [predicted, setPredicted] = useState<string | null>(null);
    const [aimed, setAimed] = useState(false);
    const pose = rig.mics[0].pose;
    const wedge = lesson.live.wedges.find((w) => w.id === wedgeId) ?? lesson.live.wedges[0];
    const src: Vec3 = useMemo(() => ({ x: wedge.p.x, y: wedge.p.y - wedge.lift, z: wedge.p.z }), [wedge]);
    const theta = arrivalAngle(pose, src);
    const db = gainDb(pattern, theta);
    const inNull = nearNull(pattern, theta, NULL_TOL);
    const nulls = nullAngles(pattern);
    const tried = predicted != null && aimed;
    useEffect(() => {
      if (live && wedge.id === C.creditWedge && inNull && aimed && !interactiveDone.has('wedgeInNull')) onInteractive('wedgeInNull');
    }, [live, wedge.id, inNull, aimed, interactiveDone, onInteractive, C.creditWedge]);
    useEffect(() => {
      if (rig.mics[0].pattern !== pattern) rig.setPattern('A', pattern as MicPattern);
    }, [pattern, rig]);
    const centre = aimAxis === 'az' ? C.pose.az : C.pose.el;
    const a = (aimAxis === 'az' ? pose.az : pose.el) - centre;
    const lim = aimAxis === 'az' ? AZ_MAX : EL_MAX;
    const params: DockParam[] = [
      {
        kind: 'fader',
        id: 'aim',
        label: 'AIM',
        value: (a + lim) / (2 * lim),
        home: 0.5,
        // Preview while the finger rides the lane, commit on release (the
        // engine's fader contract, 2026-10-06: no page re-render per move).
        onChange: (v) => {
          const ang = Math.round((v * 2 - 1) * lim) + centre;
          rig.preview('A', aimAxis === 'az' ? { ...pose, az: ang } : { ...pose, el: ang });
        },
        onCommit: () => {
          rig.commit('A');
          setAimed(true);
        },
        format: (v) => {
          const x = Math.round((v * 2 - 1) * lim);
          return Math.abs(x) < 0.5 ? 'as it started' : `${fmtAngle(Math.abs(x))} ${aimAxis === 'az' ? (x > 0 ? 'right' : 'left') : x > 0 ? 'up' : 'down'} of where it started`;
        },
        formatShort: () => fmtAngle(a),
        chooser: {
          title: 'TURN THE MIC',
          selectedId: aimAxis,
          onSelect: (id) => setAimAxis(id as 'az' | 'el'),
          options: [
            { id: 'az', label: 'LEFT–RIGHT', blurb: `Swing the front up to ${AZ_MAX}° either way (seen from above).` },
            { id: 'el', label: 'UP–DOWN', blurb: `Tilt the front up to ${EL_MAX}° up or down (seen from the side).` },
          ],
        },
      },
      {
        kind: 'options',
        id: 'pattern',
        label: 'PATTERN',
        valueLabel: pattern === 'cardioid' ? 'CARDIOID' : pattern === 'supercardioid' ? 'SUPER' : 'HYPER',
        selectedId: pattern,
        onSelect: (id) => {
          setPattern(id as PatternId);
          setAimed(true);
        },
        sticky: true,
        options: PATTERNS.map((p) => ({ id: p, label: p, blurb: `A mic with a ${p} pattern, drawn as a simplified shape. Its null sits at ≈ ${Math.round(nullAngles(p)[0])}° off the front axis.` })),
      },
      { kind: 'options', id: 'wedge', label: 'MONITOR', valueLabel: wedge.short, selectedId: wedge.id, onSelect: setWedgeId, sticky: true, options: lesson.live.wedges.map((w) => ({ id: w.id, label: w.label, blurb: w.note })) },
      { kind: 'toggle', id: 'scenario', label: live ? 'LIVE' : 'STUDIO', value: live, onToggle: () => setLive((x) => !x) },
      ...viewToggle({ view: view, setView: setView, stage: 'single', labels: ['SIDE VIEW', 'FROM ABOVE'] }),
    ];
    const bezel: BezelItem[] = live
      ? [
          { k: 'OFF AXIS', v: `≈ ${Math.round(theta / 5) * 5}°`, sub: 'monitor', flex: 1 },
          isDeepNull(db) ? { k: 'PICKUP', v: 'DEEP NULL', flex: 1.15 } : { k: 'PICKUP', v: fmtDb(db), flex: 1.15 },
          { k: 'NULL', v: tried ? `≈ ${Math.round(nulls[0])}°` : '?', flex: 0.8 },
          { k: 'REJECTION', v: inNull ? 'IN NULL' : 'NO', tint: inNull ? '#5bff85' : undefined, flex: 1.15 },
        ]
      : [
          { k: 'SCENARIO', v: 'STUDIO' },
          { k: 'PATTERN', v: pattern.toUpperCase() },
        ];
    const label = `${view === 'top' ? 'From above' : 'From the side'}: ${C.label} ${live ? `${wedge.label}, ${Math.round(theta)} degrees off the mic's front axis: ${fmtIdealPickup(db)}${inNull ? ', in the rejection region' : ''}.` : 'Studio: no monitor.'}`;
    const pred = lesson.predictions.context;
    const studioCard = lesson.scenarios.filter((s) => s.page === 'context' && s.id.endsWith('.ctx.studio'));
    const steps: MikingStep[] = [
      {
        key: 'live',
        title: 'Aim the rejection',
        kind: 'LIVE',
        layout: 'rack',
        rack: {
          render: (w, h) => <PlacementScene rig={rig} art={spec.art} view={view} w={w} h={h} slots={['A']} showZones={false} interactive={false} boxOverride={view === 'top' ? C.plan : C.side} wedge={live ? { at: wedge.p, faces: wedge.faces, src } : null} showLabels={false} accessibilityLabel={label} />,
          badge: `A simplified pattern (white dashed: shape, not range) · monitors where a stage often puts them · counts within ±${NULL_TOL}° of a null`,
          bezel,
          params,
          initialParam: 'aim',
        },
        well: live ? (
          <>
            {pred ? <PredictCard p={pred} value={predicted} onPick={setPredicted} /> : null}
            <Landing looking={`${C.looking} · ${wedge.short.toLowerCase()}`} prompt={C.prompt} />
            <Body>{`Activity: ${interactiveDone.has('wedgeInNull') ? 'done — the wedge sat in a null by your aim or pattern' : 'not yet'}.`}</Body>
            {wedge.id !== C.creditWedge ? <Note tone="warn">{wedge.note}</Note> : null}
            {isDeepNull(db) ? <Note>On this simplified pattern a null looks infinitely deep. Real microphones reject far less there, and least at low frequencies. Use the null to aim, not to promise silence.</Note> : null}
            {tried ? (
              pattern === 'cardioid' ? (
                <Note tone="ok">{spec.words?.cardioidTried ?? 'What you just saw: a cardioid rejects most directly behind (180°). A mic aimed down at a drum points its back UP and away — a floor wedge often sits below that.'}</Note>
              ) : (
                <Note tone="ok">{`What you just saw: a ${pattern} rejects most at ≈ ${Math.round(nulls[0])}° — toward the rear but OFF the axis — and picks up a little directly behind (${fmtDb(gainDb(pattern, 180))}). Check the real pattern of the mic in use before you place the wedge.`}</Note>
              )
            ) : null}
          </>
        ) : (
          <>
            <Landing looking="Studio · no monitor" prompt="A studio session has no wedge to reject. The decision changes: what is the room worth?" />
            <ScenarioList items={studioCard} answers={answers} onAnswered={onAnswered} />
            <Note>In a studio you have time to compare positions with the player; a farther mic or a room mic can add the space when the room is good. Switch back to LIVE for the monitor exercise.</Note>
          </>
        ),
      },
      {
        key: 'learn',
        title: 'Studio and live',
        kind: 'LEARN',
        layout: 'read',
        body: (
          <>
            <Body>These are scenario-based comparisons, not restrictions.</Body>
            <Card>
              {C.learn.map((p) => (
                <Point key={p.title} title={p.title}>
                  {p.text}
                </Point>
              ))}
            </Card>
            <Note tone="warn">No mic position alone prevents feedback: the monitors and PA, the gain, the room and the open mics all matter. Begin with the monitor sends down and raise them gradually. If ringing starts, lower the send at once — never create feedback on purpose.</Note>
          </>
        ),
      },
      {
        key: 'check',
        title: 'Check',
        kind: 'CHECK',
        layout: 'read',
        body: <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'context' && !s.id.endsWith('.ctx.studio'))} answers={answers} onAnswered={onAnswered} />,
      },
    ];
    return <PageSteps steps={steps} />;
  };
}

/* ═══════════════ 6b · TWO MICROPHONES ═══════════════ */
function HandTwoMic(spec: HandSpec) {
  return function HTwoMic({ lesson, answers, onAnswered, onInteractive, interactiveDone, variant, hidden }: PageProps) {
    const T = spec.two;
    const zA = lesson.zones.find((z) => z.id === T.A.zone)!;
    const zB = lesson.zones.find((z) => z.id === T.B.zone)!;
    const rig = useRig(lesson, {
      variant,
      mics: [
        { slot: 'A', typeId: T.A.mic, pattern: 'cardioid', pose: zA.start },
        { slot: 'B', typeId: T.B.mic, pattern: 'cardioid', pose: zB.start },
      ],
    });
    const [view, setView] = useState<ViewId>('top');
    const [slot, setSlot] = useState<MicSlot>('B');
    const [posAxis, setPosAxis] = useState<PosAxis>('x');
    const [aimAxis, setAimAxis] = useState<AimAxis>('az');
    // The sources on THIS variant's picture (a region may belong to one).
    const regions = lesson.model.regions.filter((r) => !r.variants || r.variants.includes(variant));
    const [srcId, setSrcId] = useState(regions[0]?.id ?? '');
    const region = regions.find((r) => r.id === srcId) ?? regions[0];
    const src = region.anchor;
    const A = rig.mics.find((m) => m.slot === 'A')!;
    const B = rig.mics.find((m) => m.slot === 'B')!;
    const dMm = pathDiffMm(src, A.pose.p, B.pose.p);
    const dt = deltaTms(dMm);
    const equal = Math.abs(dMm) < EQUAL_PATH_MM;
    const gA = isModelled(A.pattern) ? micGain(A.pattern, A.pose, src) : 1000 / Math.max(1, dist(A.pose.p, src));
    const gB = isModelled(B.pattern) ? micGain(B.pattern, B.pose, src) : 1000 / Math.max(1, dist(B.pose.p, src));
    const sEff = effectivePolarity(B.polarity, gA, gB);
    const rearFlip = sEff !== B.polarity;
    const first = equal ? null : notchesHz(dt, sEff, 20000, 4)[sEff === 1 ? 0 : 1] ?? null;
    const dt0 = useRef(dt);
    const [flips, setFlips] = useState({ toInv: false, toNorm: false });
    const [predicted, setPredicted] = useState<string | null>(null);
    const moved = Math.abs(dt - dt0.current) > 0.05;
    useEffect(() => {
      if (flips.toInv && flips.toNorm && moved && !interactiveDone.has('polarityVsDelay')) onInteractive('polarityVsDelay');
    }, [flips, moved, interactiveDone, onInteractive]);
    const azCentre = Math.round((slot === 'A' ? zA : zB).start.az);
    const params: DockParam[] = [
      ...posParams({ rig, slot, posAxis, setPosAxis, aimAxis, setAimAxis, words: spec.axes, aimWords: spec.aimWords, azCentre }),
      { kind: 'toggle', id: 'mic', label: `EDIT MIC ${slot}`, value: slot === 'B', onToggle: () => setSlot((s) => (s === 'A' ? 'B' : 'A')) },
      {
        kind: 'toggle',
        id: 'polarity',
        label: B.polarity === 1 ? 'B POLARITY +' : 'B POLARITY −',
        value: B.polarity === -1,
        onToggle: () => {
          const next = B.polarity === 1 ? -1 : 1;
          rig.setPolarity('B', next);
          setFlips((f) => (next === -1 ? { ...f, toInv: true } : { ...f, toNorm: true }));
        },
      },
      {
        kind: 'options',
        id: 'source',
        label: 'SOURCE',
        valueLabel: region.label.replace(/^the /, '').toUpperCase().slice(0, 10),
        selectedId: srcId,
        onSelect: setSrcId,
        options: regions.map((r) => ({ id: r.id, label: r.label, blurb: `${r.note} Drawn as one point for the path overlay.` })),
      },
      ...viewToggle({ view: view, setView: setView, stage: 'dual', labels: ['SIDE VIEW', 'FROM ABOVE'] }),
    ];
    const dCell = lenCell(dMm, true);
    const bezel: BezelItem[] = [
      { k: 'PATH Δd B−A', v: equal ? 'NONE' : dCell.v, sub: equal ? 'same path' : dCell.sub, flex: 1.35 },
      { k: 'DELAY Δt B−A', v: equal ? '0 ms' : fmtMs(dt).replace('≈ ', `≈ ${dt > 0 ? '+' : '−'}`), sub: equal ? 'no comb' : dt > 0 ? 'B later' : 'B earlier', flex: 1.35 },
      { k: '1ST NOTCH', v: equal ? 'NO COMB' : first == null ? 'OVER 20 kHz' : `≈ ${fmtHz(first)}`, flex: 1.2 },
      { k: 'POLARITY', v: `B ${B.polarity === 1 ? '+' : '−'}`, sub: rearFlip ? 'rear lobe: −' : 'switch', flex: 0.95 },
    ];
    const [wellW, setWellW] = useState(0);
    const pairNow = `${ownSentence(rig, 'A', zA, spec.outside)} ${ownSentence(rig, 'B', zB, spec.outside)}`;
    const combLabel = `Simplified two-mic sum for ${region.label}: ${equal ? 'no path difference, no comb' : `path difference ${fmtLen(Math.abs(dMm))}, delay ${fmtMs(dt)}, first notch about ${first == null ? 'above 20 kHz' : fmtHz(first)}`}; mic B polarity switch ${B.polarity === 1 ? 'normal' : 'inverted'}.`;
    const pred = lesson.predictions.twoMic;
    const flipped = flips.toInv || flips.toNorm;
    const tick = (on: boolean) => (on ? '✓' : '○');
    const steps: MikingStep[] = [
      {
        key: 'pair',
        title: 'Pair and polarity',
        kind: 'PAIR',
        layout: 'rack',
        rack: {
          render: (w, h) => <DualView rig={rig} art={spec.art} view={view} setView={setView} w={w} h={h} slots={['A', 'B']} showZones={false} showLive={false} pathsFrom={src} interactive={!hidden} labelFor={(v) => `${T.label}, ${(lesson.model.viewTags?.[v] ?? v).toLowerCase()}. Paths from ${region.label} drawn as an overlay. ${pairNow}`} />,
          badge: `A simplified picture · dashed = straight paths from one point · no reflections · c = ${C20.toFixed(1)} m/s, 20 °C`,
          bezel,
          params,
          initialParam: 'pos',
        },
        well: (
          <>
            {pred ? <PredictCard p={pred} value={predicted} onPick={setPredicted} /> : null}
            <Landing looking={T.looking} prompt={T.prompt} />
            <Body>{`Editing mic ${slot}: the ${(slot === 'A' ? T.names.A : T.names.B).toLowerCase()}. EDIT MIC switches.`}</Body>
            <Text style={styles.activity} accessibilityLabel={`Activity: polarity to minus ${flips.toInv ? 'done' : 'not yet'}, back to plus ${flips.toNorm ? 'done' : 'not yet'}, mic moved ${moved ? 'done' : 'not yet'}.`}>
              {`Activity: polarity → − ${tick(flips.toInv)} · back to + ${tick(flips.toNorm)} · mic moved ${tick(moved)}`}
            </Text>
            <NowLine text={pairNow} />
            <View onLayout={(e) => setWellW(Math.round(e.nativeEvent.layout.width))}>{wellW > 0 ? <CombPanel rig={rig} source={src} w={wellW} h={150} label={combLabel} /> : null}</View>
            <Body>{equal ? `No path difference: ${region.label} reaches both mics at the same instant.` : `B hears ${region.label} ${fmtMs(dt)} ${dt >= 0 ? 'after' : 'before'} A. ${sEff === 1 ? 'The sum acts as same-polarity: notches at odd multiples of 1 ÷ (2 Δt).' : 'The sum acts as inverted: a low-frequency loss and notches at whole multiples of 1 ÷ Δt.'}`}</Body>
            {rearFlip ? <Note>{`${region.label} is in a mic’s rear lobe: a rear lobe is polarity-inverted, so the notches follow the ${sEff === 1 ? 'same-polarity' : 'inverted'} set even with the switch at ${B.polarity === 1 ? '+' : '−'}.`}</Note> : null}
            {predicted != null && flipped ? <Note tone="ok">{`You predicted “${predicted}”. Δt did not change when you flipped polarity — only moving a mic changes it. Polarity flips the sign: it moves the notches, it does not remove the delay.`}</Note> : null}
            <Note tone="warn">{T.warn}</Note>
          </>
        ),
      },
      {
        key: 'learn',
        title: 'Two perspectives',
        kind: 'LEARN',
        layout: 'read',
        body: (
          <>
            {T.learn.map((p, i) => (
              <Body key={i}>{p}</Body>
            ))}
            <Note>{spec.words?.sourceNote ?? 'What you just saw: sound reaches two mics at different times. Summed, the delayed copy cancels where it is half a period late: comb-filter notches. Polarity flips the sign — it moves the notches; it does not remove the delay. Change the SOURCE: each part of the drum gives its own delay, so no single setting suits every stroke.'}</Note>
          </>
        ),
      },
      {
        key: 'check',
        title: 'Check',
        kind: 'CHECK',
        layout: 'read',
        body: <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'twoMic')} answers={answers} onAnswered={onAnswered} />,
      },
    ];
    return <PageSteps steps={steps} />;
  };
}

/** The lesson's page set: its own HOW IT SOUNDS, the rest from the spec. */
export function makeHandPages(spec: HandSpec, Sound: (p: PageProps) => ReactNode): Partial<Record<SourcePageId, (p: PageProps) => ReactNode>> {
  return {
    instrument: HandInstrument(spec),
    sound: Sound,
    setting: HandSetting(spec),
    microphone: (p: PageProps) => GMicrophone(p, spec.mic),
    placement: HandPlacement(spec),
    context: HandContext(spec),
    twoMic: HandTwoMic(spec),
    troubleshoot: PTroubleshoot,
    practice: (p: PageProps) => GPractice(p, spec.practice),
  };
}

const styles = StyleSheet.create({
  tray: { gap: 6, paddingVertical: 4 },
  trayHead: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 1.6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  activity: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 19 },
});
