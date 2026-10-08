/**
 * HAND DRUMS · PLACEMENT STUDIO (LESSON_JOURNEY §6 stage 5: guided, then
 * free), the family's version of pages/PPlacement.tsx.
 *
 * WATCH (rack, worked example): the mic placed FOR the learner at a
 * suggested starting point (its own rig, never credit); STEP reads it piece
 * by piece — where to begin, the head it is measured from, the distance, the
 * line, the aim, clearance — with the bezel cell for the piece lit.
 * PLACE (rack): PREDICT FIRST, then drag the mic (or POSITION / AIM; ZONE
 * jumps; SETUP picks the mic, the drums' setup and the head distances are
 * read from). Collisions stop the mic and say what it would hit.
 * LEARN (read) → CHECK (read).
 * Credit: the mic RESTS, clear of every part, in two different suggested
 * zones (on release) + the checks.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../../../../theme/tokens';
import type { BezelItem, DockParam } from '../../../../../rack/rackTypes';
import type { ViewId } from '../../../../engine/model/types.ts';
import { zonesAvailable } from '../../../../engine/geometry/zones.ts';
import { useRig } from '../../../../engine/scene/useRig.ts';
import { DualView } from '../../../../engine/scene/DualView';
import { nowText, readoutWords, sceneLabel } from '../../../../engine/scene/sceneWords.ts';
import { placementBezel, stopShortOf } from '../../../../engine/scene/readoutText.ts';
import { placementParams, type AimAxis, type PosAxis } from '../../../../engine/scene/placementDock.ts';
import { PageSteps, type MikingStep } from '../../../../engine/steps';
import { Body, Card, Landing, Note, NowLine, Point, PredictCard, ScenarioList, ZoneCard } from '../../../../engine/kit';
import { MIC_TYPES, micType } from '../../../../data/micTypes';
import type { PageProps } from '../../../../pages/pageTypes';
import { handOf } from '../family.ts';
import { viewToggle } from '../../../../engine/scene/viewToggle.ts';

export function HPlacement({ lesson, art, answers, onAnswered, onInteractive, interactiveDone, variant, setVariant, hidden }: PageProps) {
  const H = handOf(lesson);
  const workedId = H.worked[variant] ?? H.worked.default;
  const exZone = lesson.zones.find((q) => q.id === workedId) ?? lesson.zones[0];
  const exType = exZone.requires?.micTypeIds?.[0] ?? lesson.micTypeIds[0];
  const start = useMemo(() => ({ typeId: exType, pose: exZone.start }), []); // eslint-disable-line react-hooks/exhaustive-deps
  const rig = useRig(lesson, { variant, mics: [{ slot: 'A', typeId: start.typeId, pattern: micType(start.typeId).patterns[0].id, pose: start.pose }] });
  useEffect(() => {
    if (rig.variant !== variant) rig.setVariant(variant);
  }, [variant, rig]);
  const [view, setView] = useState<ViewId>('side');
  const [posAxis, setPosAxis] = useState<PosAxis>('y');
  const [aimAxis, setAimAxis] = useState<AimAxis>('el');
  const [visited, setVisited] = useState<ReadonlySet<string>>(() => new Set());
  const [predicted, setPredicted] = useState<string | null>(null);
  const mic = rig.mics[0];
  const t = micType(mic.typeId);
  const multi = lesson.model.variants.length > 1;
  const vLabel = lesson.model.variants.find((v) => v.id === variant)?.label ?? '';

  /* ── WATCH: the worked example, on its own rig (never credit) ── */
  const ex = useRig(lesson, { variant, mics: [{ slot: 'A', typeId: exType, pattern: micType(exType).patterns[0].id, pose: exZone.start }] });
  const [exView, setExView] = useState<ViewId>('side');
  const [exStep, setExStep] = useState(0);
  useEffect(() => {
    if (ex.variant !== variant) ex.setVariant(variant);
    if (ex.mics[0].typeId !== exType) ex.setType('A', exType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, exType]);
  useEffect(() => {
    if (ex.variant !== variant || ex.mics[0].typeId !== exType) return;
    ex.jumpTo('A', exZone.start);
    if (ex.surfaceId !== exZone.refSurface) ex.setSurfaceId(exZone.refSurface);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ex.variant, ex.mics[0].typeId, exZone.id]);
  const exShown = ex.shown('A');
  const exHead = lesson.model.surfaces.find((q) => q.id === exZone.refSurface)?.label ?? 'its head';
  const exLine = exZone.radial ? lesson.model.lines.find((l) => l.id === exZone.radial!.line)?.label ?? 'its line' : null;
  const worked: { title: string; text: string; cell: number }[] = [
    { title: 'WHERE TO BEGIN', text: `${exZone.label}. After our research, this is one place we suggest you begin with this kind of mic — a starting point, not a rule, and not a promise of a sound.`, cell: 3 },
    { title: 'THE HEAD', text: `The distance is measured from ${exHead}, straight up from it. The same number from somewhere else would put the mic somewhere else entirely.`, cell: 0 },
    { title: 'THE DISTANCE', text: `${exZone.band} The readout measures to the mic’s FRONT, rounded to ≈ 5 mm, and it reads inside that range.`, cell: 0 },
    { title: 'THE LINE', text: exLine ? `This starting point also places the mic near ${exLine}: how far it may stray is drawn as the blue region you can see in both views.` : 'This starting point names no line to measure from, so only the head and the distance place the mic.', cell: 1 },
    { title: 'THE AIM', text: exZone.aim ? `Aim it as the starting point says — the lab counts anything within ±${exZone.aim.maxOffAxis}°. Distance, height and angle are separate things to try.` : 'This starting point gives no aim, so the mic simply faces the drum. Distance, height and angle are still separate things to try.', cell: 2 },
    { title: 'CLEARANCE', text: H.clearWords, cell: 3 },
  ];
  const wk = worked[exStep];
  // The piece being read is marked on the drawing too (PPlacement's rule,
  // 2026-10-06): the head it is measured from (2, 3), the keep-outs (6).
  const exHeadPart = lesson.model.surfaces.find((q) => q.id === exZone.refSurface)?.partId ?? null;
  const exEnvelope = lesson.model.envelopes.find((e) => !e.variants || e.variants.includes(variant))?.id ?? null;
  const exHighlight = exStep === 1 || exStep === 2 ? exHeadPart : exStep === 5 ? exEnvelope : null;
  const partShort = stopShortOf(lesson.model, { gooseneck: 'REACH' });
  const exBezel: BezelItem[] = placementBezel(exShown, readoutWords(ex, 'A'), exZone, partShort).map((c, i) => (i === wk.cell ? { ...c, k: `▸ ${c.k}`, tint: '#ffc64d' } : c));
  const exParams: DockParam[] = [
    {
      kind: 'fader',
      id: 'piece',
      label: 'STEP',
      value: exStep / (worked.length - 1),
      onChange: (v) => setExStep(Math.round(v * (worked.length - 1))),
      format: () => `${exStep + 1} of ${worked.length} · ${wk.title.toLowerCase()}`,
      formatShort: () => `${exStep + 1} / ${worked.length}`,
    },
    ...viewToggle({ view: exView, setView: setExView, stage: 'dual' }),
  ];

  const r0 = rig.readouts('A');
  const zone = r0.zoneId ? lesson.zones.find((z) => z.id === r0.zoneId) ?? null : null;
  useEffect(() => {
    if (zone && zone.refSurface !== rig.surfaceId) rig.setSurfaceId(zone.refSurface);
  }, [zone, rig]);
  const r = rig.readouts('A');
  const shown = rig.shown('A');

  const lastVersion = useRef(-1);
  useEffect(() => {
    if (rig.version === lastVersion.current) return;
    lastVersion.current = rig.version;
    if (r.zoneId && !r.blocked) setVisited((prev) => (prev.has(r.zoneId!) ? prev : new Set([...prev, r.zoneId!])));
  }, [rig.version, r.zoneId, r.blocked]);
  useEffect(() => {
    if (visited.size >= 2 && !interactiveDone.has('twoZones')) onInteractive('twoZones');
  }, [visited, interactiveDone, onInteractive]);

  const available = zonesAvailable(lesson.zones, variant, mic.typeId, t.mount);
  const params: DockParam[] = [
    ...placementParams({ rig, slot: 'A', posAxis, setPosAxis, aimAxis, setAimAxis }),
    ...viewToggle({ view: view, setView: setView, stage: 'dual' }),
    {
      kind: 'group',
      id: 'setup',
      label: 'SETUP',
      valueLabel: t.short,
      render: () => (
        <View style={styles.tray}>
          <Text style={styles.trayHead}>MIC TYPE</Text>
          <View style={styles.chips}>
            {lesson.micTypeIds.map((id) => (
              <Chip key={id} on={id === mic.typeId} label={MIC_TYPES[id].label} onPress={() => rig.setType('A', id)} />
            ))}
          </View>
          {multi ? (
            <>
              <Text style={styles.trayHead}>{H.variantKey}</Text>
              <View style={styles.chips}>
                {lesson.model.variants.map((v) => (
                  <Chip key={v.id} on={v.id === variant} label={v.label} onPress={() => setVariant(v.id)} />
                ))}
              </View>
            </>
          ) : null}
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
        if (z) rig.jumpTo('A', z.start);
      },
      options: available.map((z) => ({ id: z.id, label: z.label, blurb: z.band })),
    },
  ];
  const bezel: BezelItem[] = placementBezel(shown, readoutWords(rig, 'A'), zone, partShort);
  const labelFor = (v: ViewId) => sceneLabel(rig, v, ['A']);
  const pred = lesson.predictions.placement;
  const tried = predicted != null && visited.size >= 2;
  const idea = H.ideas[mic.typeId];
  const steps: MikingStep[] = [
    {
      key: 'watch',
      title: 'Worked example',
      kind: 'WATCH',
      layout: 'rack',
      rack: {
        render: (w, h) => <DualView rig={ex} art={art} view={exView} setView={setExView} w={w} h={h} slots={['A']} interactive={false} highlight={exHighlight} labelFor={(v) => sceneLabel(ex, v, ['A'], 'A worked example: the mic is placed for you.')} />,
        badge: 'WORKED EXAMPLE · placed for you · blue = suggested starting point · dashed lobe = pattern shape',
        bezel: exBezel,
        params: exParams,
        initialParam: 'piece',
      },
      well: (
        <>
          <Landing looking={`Worked example · ${micType(exType).short}${multi ? ` · ${vLabel.toLowerCase()}` : ''}`} prompt="Step through how this starting point is read, piece by piece. The lit cell on the bezel is the piece being read." />
          <Card>
            <Point title={`${exStep + 1} · ${wk.title}`}>{wk.text}</Point>
          </Card>
          {exStep === worked.length - 1 ? <Note tone="ok">That is the whole reading: where to begin, head, distance, line, aim, clearance. On the next step you place the mic yourself — in two different zones.</Note> : null}
        </>
      ),
    },
    {
      key: 'place',
      title: 'Place the mic',
      kind: 'PLACE',
      layout: 'rack',
      rack: {
        render: (w, h) => <DualView rig={rig} art={art} view={view} setView={setView} w={w} h={h} slots={['A']} interactive={!hidden} labelFor={labelFor} />,
        badge: 'Blue = suggested starting points · keep-clear areas show as a mic comes near · dashed lobe = pattern shape · pinch to zoom',
        bezel,
        params,
        initialParam: 'pos',
      },
      well: (
        <>
          {pred ? <PredictCard p={pred} value={predicted} onPick={setPredicted} /> : null}
          <Landing looking={`${t.short}${multi ? ` · ${vLabel.toLowerCase()}` : ''}`} prompt="Drag the mic (or use POSITION and AIM; drag the amber ring to turn it). Rest it in two different blue zones — try another mic type in SETUP for the others — then move it and see what changes." />
          <NowLine text={nowText(rig, ['A'])} />
          {shown.blocked ? <Note tone="warn">{shown.blocked.partId === 'gooseneck' ? 'A clip-on mic reaches only as far as its gooseneck from the rim it clamps to — it stops there.' : `It would touch the ${shown.blocked.label} — the mic stops there.`}</Note> : null}
          {zone ? <ZoneCard z={zone} /> : <Body>{`Not at a suggested starting point. Starting points for this mic${multi ? ' and setup' : ''}: ${available.map((z) => z.label).join('; ') || 'none — try another mic type or setup'}.`}</Body>}
          <Body>{`Activity: zones rested in, clear of every part — ${visited.size} of 2${visited.size ? ` (${[...visited].map((id) => lesson.zones.find((z) => z.id === id)?.label ?? id).join('; ')})` : ''}.`}</Body>
          {tried && pred ? <Note tone="ok">{`You predicted “${predicted}”. ${pred.after}`}</Note> : null}
          {idea ? <Note>{idea}</Note> : null}
          <Note>Clearance comes first: stop the player before moving a real mic, and check again while they play their loudest, most animated passage.</Note>
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
          {H.placeLearn.map((p, i) => (i === 2 ? <Note key={i} tone="warn">{p}</Note> : <Body key={i}>{p}</Body>))}
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
}

function Chip({ on, label, onPress }: { on: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, on && styles.chipOn]} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={label}>
      <Text style={[styles.chipText, on && { color: colors.amber }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tray: { gap: 6, paddingVertical: 4 },
  trayHead: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 10.5, letterSpacing: 1.6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: '#2c2c33', backgroundColor: '#101114' },
  chipOn: { borderColor: colors.amber, backgroundColor: '#1d1709' },
  chipText: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 13 },
});
