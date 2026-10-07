/**
 * PLACEMENT STUDIO (blueprint §5, §7 row 3; lesson L19-L41) — stage 5 of the
 * journey: GUIDED, THEN FREE (LESSON_JOURNEY §6).
 *
 * WATCH (rack, worked example): the mic is placed FOR the learner at a
 * recommended starting point, on its own rig (it earns nothing), and STEP
 * reads that position piece by piece — where to begin, the head it is
 * measured from, the distance, the line, the aim, the clearance — with the
 * bezel cell for the current piece lit. Then the help FADES:
 * TRY BEFORE TELL (review M1): PLACE comes next, with a prediction; LEARN
 * follows as "what you just did".
 * PLACE (rack): drag the mic in the side or top view (the other is the
 * inset); POSITION and AIM place it with no drag; SETUP picks the mic type,
 * the front head and the head distances are read from; ZONE jumps to a
 * recommended starting point's pose. Collisions stop the mic and say what it
 * would hit. The zone's tendency is written in words.
 * LEARN (read): how the starting points work — where we recommend you
 * begin, measured from a named head; clearance comes first. Owner ruling
 * 2026-10-04: no source names and no SOURCED / TRIAL marks on screen.
 * CHECK (read): three scenarios.
 * Credit: the mic RESTS, clear of every part, in two different recommended
 * zones (on release) + the checks.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import type { BezelItem, DockParam } from '../../rack/rackTypes';
import type { ViewId } from '../engine/model/types.ts';
import { zonesAvailable } from '../engine/geometry/zones.ts';
import { useRig } from '../engine/scene/useRig.ts';
import { DualView } from '../engine/scene/DualView';
import { nowText, readoutWords, sceneLabel } from '../engine/scene/sceneWords.ts';
import { placementBezel, stopShortOf } from '../engine/scene/readoutText.ts';
import { placementParams, type AimAxis, type PosAxis } from '../engine/scene/placementDock.ts';
import { PageSteps, type MikingStep } from '../engine/steps';
import { Body, Card, Landing, Note, NowLine, Point, PredictCard, ScenarioList, ZoneCard } from '../engine/kit';
import { MIC_TYPES, micType } from '../data/micTypes';
import { copyOf } from '../engine/model/copy.ts';
import type { PageProps } from './pageTypes';
import { viewToggle } from '../engine/scene/viewToggle.ts';
import { ROLE_LABEL } from '../engine/setups.ts';
import { useSetups } from './PSetups';

/** "{line}" / "{head}" / "{tol}" in a copy line. */
const fill = (s: string, v: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k: string) => v[k] ?? '');

export function PPlacement({ lesson, art, answers, onAnswered, onInteractive, interactiveDone, variant, setVariant, hidden, startFrom, chooseStart }: PageProps) {
  const C = copyOf(lesson);
  // The worked example's zone for a variant (the lesson's choice; else the
  // first zone available in it).
  const workedFor = (v: string) => lesson.zones.find((q) => q.id === C.placement.workedZone[v]) ?? lesson.zones.find((q) => !q.requires || ((!q.requires.variant || q.requires.variant === v) && (!q.requires.variants || q.requires.variants.includes(v)))) ?? lesson.zones[0];
  // START FROM (owner restructure 2026-10-06): the Placement Studio begins
  // at the starting setup the learner last looked at (its first mic), and
  // the learner moves it from there.
  const setups = useSetups(lesson, variant);
  const fromSetup = setups.find((s) => s.id === startFrom) ?? setups[0] ?? null;
  const start = useMemo(() => {
    if (fromSetup) return { typeId: fromSetup.mics[0].typeId, pattern: fromSetup.mics[0].pattern, pose: fromSetup.mics[0].pose };
    const z = workedFor(variant);
    const typeId = z.requires?.micTypeIds?.[0] ?? lesson.micTypeIds[0];
    return { typeId, pattern: micType(typeId).patterns[0].id, pose: z.start };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const variantShort = C.variantShort[variant] ?? (lesson.model.variants.find((v) => v.id === variant)?.label ?? '').toLowerCase();
  const rig = useRig(lesson, { variant, mics: [{ slot: 'A', typeId: start.typeId, pattern: start.pattern, pose: start.pose }] });
  useEffect(() => {
    if (rig.variant !== variant) rig.setVariant(variant);
  }, [variant, rig]);
  // A START FROM pick: the type first (its body changes the collision), then
  // the setup's pose and its reference surface.
  const [fromId, setFromId] = useState<string | null>(null);
  const wanted = fromId ? setups.find((s) => s.id === fromId) ?? null : null;
  useEffect(() => {
    if (!wanted) return;
    const m = wanted.mics[0];
    if (rig.mics[0].typeId !== m.typeId) {
      rig.setType('A', m.typeId);
      return;
    }
    rig.setPattern('A', m.pattern);
    rig.jumpTo('A', m.pose);
    if (rig.surfaceId !== m.surfaceId) rig.setSurfaceId(m.surfaceId);
    setFromId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wanted?.id, rig.mics[0].typeId]);
  const [fromShown, setFromShown] = useState<string | null>(fromSetup?.id ?? null);
  const fromNow = setups.find((s) => s.id === fromShown) ?? null;
  const [view, setView] = useState<ViewId>('side');
  const [posAxis, setPosAxis] = useState<PosAxis>('x');
  const [aimAxis, setAimAxis] = useState<AimAxis>('el');
  const [visited, setVisited] = useState<ReadonlySet<string>>(() => new Set());
  const [predicted, setPredicted] = useState<string | null>(null);
  const mic = rig.mics[0];
  const t = micType(mic.typeId);

  /* ── WATCH: the worked example, on its own rig (never credit) ── */
  const exZone = workedFor(variant);
  const exType = exZone.requires?.micTypeIds?.[0] ?? lesson.micTypeIds[0];
  const ex = useRig(lesson, { variant, mics: [{ slot: 'A', typeId: exType, pattern: micType(exType).patterns[0].id, pose: exZone.start }] });
  const [exView, setExView] = useState<ViewId>('side');
  const [exStep, setExStep] = useState(0);
  useEffect(() => {
    if (ex.variant !== variant) ex.setVariant(variant);
    if (ex.mics[0].typeId !== exType) ex.setType('A', exType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, exType]);
  // Once the rig has the new variant and type (its scene recompiled), place
  // the mic at the zone's validated start and read from the zone's head.
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
    { title: 'WHERE TO BEGIN', text: `${exZone.label}. After our research, this is one place we recommend you begin with this kind of mic — a starting point, not a rule, and not a promise of a sound.`, cell: 3 },
    { title: C.terms?.refTitle ?? (C.words.workedHead ? 'THE SURFACE' : `THE ${C.words.reference.toUpperCase()}`), text: C.words.workedHead ? fill(C.words.workedHead, { head: exHead }) : `The distance is measured from ${exHead}. ${C.terms?.otherRef ?? `The same number from another ${C.words.reference} would put the mic somewhere else entirely.`}`, cell: 0 },
    { title: 'THE DISTANCE', text: `${exZone.band} The readout measures to the mic’s FRONT, rounded to ≈ 5 mm, and it reads inside that range.`, cell: 0 },
    { title: 'OFF THE LINE', text: exLine ? fill(C.placement.workedLine, { line: exLine }) : 'This starting point names no line to measure from, so only the head and the distance place the mic.', cell: 1 },
    { title: 'THE AIM', text: exZone.aim || exZone.aimAt ? fill(C.placement.workedAim, { head: exHead, tol: `${exZone.aim?.maxOffAxis ?? ''}` }) : C.terms?.noAim ?? C.words.workedNoAim ?? `This starting point gives no aim, so the mic simply faces the ${C.words.instrument}. Distance, height and angle are still separate things to try.`, cell: 2 },
    { title: 'CLEARANCE', text: C.placement.workedClear, cell: 3 },
  ];
  const wk = worked[exStep];
  // The piece being read is marked ON THE DRAWING too (owner, Pixel
  // 2026-10-06: "sliders not working" — this STEP fader only lit a bezel
  // cell, so the picture never moved): the head it is measured from (2, 3),
  // the keep-outs the clearance is about (6).
  const exHeadPart = lesson.model.surfaces.find((q) => q.id === exZone.refSurface)?.partId ?? null;
  const exEnvelope = (lesson.model.envelopes.find((e) => !e.variants || e.variants.includes(variant)) ?? null)?.id ?? null;
  const exHighlight = exStep === 1 || exStep === 2 ? exHeadPart : exStep === 5 ? exEnvelope : null;
  const exBezel: BezelItem[] = placementBezel(exShown, readoutWords(ex, 'A'), exZone, stopShortOf(lesson.model)).map((c, i) => (i === wk.cell ? { ...c, k: `▸ ${c.k}`, tint: '#ffc64d' } : c));
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

  // Distances are read from the head the active zone names (lesson L39), else from
  // the head chosen in SETUP.
  const r0 = rig.readouts('A');
  const zone = r0.zoneId ? lesson.zones.find((z) => z.id === r0.zoneId) ?? null : null;
  useEffect(() => {
    if (zone && zone.refSurface !== rig.surfaceId) rig.setSurfaceId(zone.refSurface);
  }, [zone, rig]);
  const r = rig.readouts('A');
  // What every readout PRINTS (bezel, NOW line, strip): the same pose, the
  // same reference head and line, plus the stop reason (readoutText.ts).
  const shown = rig.shown('A');

  // CREDIT: a clear resting pose inside a recommended zone, counted on release.
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
    ...(setups.length
      ? [
          {
            kind: 'options' as const,
            id: 'from',
            label: 'START FROM',
            valueLabel: fromNow ? ROLE_LABEL[fromNow.role].split(' ')[0] : 'CHOOSE',
            selectedId: fromShown,
            onSelect: (id: string) => {
              setFromShown(id);
              setFromId(id);
              chooseStart?.(id);
            },
            options: setups.map((s) => ({ id: s.id, label: `${ROLE_LABEL[s.role]} · ${s.title}`, blurb: s.mics.length > 1 ? `Starts from its first mic: ${s.line}` : s.line })),
          },
        ]
      : []),
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
          <Text style={styles.trayHead}>{C.variantKey}</Text>
          <View style={styles.chips}>
            {lesson.model.variants.map((v) => (
              <Chip key={v.id} on={v.id === variant} label={v.label} onPress={() => setVariant(v.id)} />
            ))}
          </View>
          <Text style={styles.trayHead}>MEASURE FROM (when not in a zone)</Text>
          <View style={styles.chips}>
            {lesson.model.surfaces
              .filter((s) => !s.variants || s.variants.includes(variant))
              .map((s) => (
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

  const bezel: BezelItem[] = placementBezel(shown, readoutWords(rig, 'A'), zone, stopShortOf(lesson.model));

  const labelFor = (v: ViewId) => sceneLabel(rig, v, ['A']);
  const pred = lesson.predictions.placement;
  const tried = predicted != null && visited.size >= 2;
  const steps: MikingStep[] = [
    {
      key: 'watch',
      title: 'Worked example',
      kind: 'WATCH',
      layout: 'rack',
      rack: {
        render: (w, h) => <DualView rig={ex} art={art} view={exView} setView={setExView} w={w} h={h} slots={['A']} interactive={false} highlight={exHighlight} labelFor={(v) => sceneLabel(ex, v, ['A'], 'A worked example: the mic is placed for you.')} />,
        badge: 'WORKED EXAMPLE · placed for you · blue = recommended starting point · dashed lobe = pattern shape',
        bezel: exBezel,
        params: exParams,
        initialParam: 'piece',
      },
      well: (
        <>
          <Landing looking={`Worked example · ${micType(exType).short} · ${variantShort}`} prompt="Step through how this starting point is read, piece by piece. The lit cell on the bezel is the piece being read." />
          <Card>
            <Point title={`${exStep + 1} · ${wk.title}`}>{wk.text}</Point>
          </Card>
          {exStep === worked.length - 1 ? <Note tone="ok">{`That is the whole reading: where to begin, ${C.words.reference}, distance, line, aim, clearance. On the next step you place the mic yourself — in two different zones.`}</Note> : null}
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
        badge: 'Blue = recommended starting points · keep-clear areas show as a mic comes near · dashed lobe = pattern shape · pinch to zoom',
        bezel,
        params,
        initialParam: 'pos',
      },
      well: (
        <>
          {pred ? <PredictCard p={pred} value={predicted} onPick={setPredicted} /> : null}
          {fromNow ? <Body>{`START FROM · ${ROLE_LABEL[fromNow.role].toLowerCase()}: ${fromNow.title}${fromNow.mics.length > 1 ? ' (its first mic)' : ''}. Choose another in START FROM.`}</Body> : null}
          <Landing looking={`${t.short} · ${variantShort}`} prompt="Move the mic from its starting setup: drag it (or use POSITION and AIM; drag the amber ring to turn it). Rest it in two different blue zones — then move it around and listen for what changes." />
          <NowLine text={nowText(rig, ['A'])} />
          {shown.blocked ? <Note tone="warn">{`It would touch the ${shown.blocked.label} — the mic stops there.${t.mount === 'stand' ? C.placement.blocked[variant] ?? '' : ''}`}</Note> : null}
          {zone ? <ZoneCard z={zone} /> : <Body>{`Not at a recommended starting point. ${C.placement.availableLead}: ${available.map((z) => z.label).join('; ') || `none — try another mic type or ${C.variantKey.toLowerCase()}`}.`}</Body>}
          <Body>{`Activity: zones rested in, clear of every part — ${visited.size} of 2${visited.size ? ` (${[...visited].map((id) => lesson.zones.find((z) => z.id === id)?.label ?? id).join('; ')})` : ''}.`}</Body>
          {tried && C.placement.reveal ? <Note tone="ok">{`You predicted “${predicted}”. ${C.placement.reveal}`}</Note> : null}
          {C.placement.typeNotes[mic.typeId] ? <Note>{C.placement.typeNotes[mic.typeId]}</Note> : null}
          <Note>{C.placement.note}</Note>
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
          <Body>{C.placement.learn.intro}</Body>
          <Body>{C.placement.learn.separate}</Body>
          <Note tone="warn">{C.placement.learn.clearance}</Note>
          <Body>{C.placement.learn.tendencies}</Body>
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
