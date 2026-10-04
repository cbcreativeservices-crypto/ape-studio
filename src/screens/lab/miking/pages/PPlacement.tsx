/**
 * Page 3 — PLACEMENT STUDIO (blueprint §5, §7 row 3; lesson L19-L41).
 *
 * TRY BEFORE TELL (review M1): PLACE comes first, with a prediction; LEARN
 * follows as "what you just did".
 * PLACE (rack): drag the mic in the side or top view (the other is the
 * inset); POSITION and AIM place it with no drag; SETUP picks the mic type,
 * the front head and the head distances are read from; ZONE jumps to a
 * documented zone's starting pose. Collisions stop the mic and say what it
 * would hit. The zone's tendency is written in words.
 * LEARN (read): how documented zones work — a starting point for its own
 * product, measured from a named head; clearance always wins.
 * CHECK (read): three scenarios.
 * Credit: the mic RESTS, clear of every part, in two different documented
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
import { placementBezel } from '../engine/scene/readoutText.ts';
import { placementParams, type AimAxis, type PosAxis } from '../engine/scene/placementDock.ts';
import { PageSteps, type MikingStep } from '../engine/steps';
import { Body, Landing, Note, NowLine, PredictCard, ScenarioList, ZoneCard } from '../engine/kit';
import { MIC_TYPES, micType } from '../data/micTypes';
import type { PageProps } from './pageTypes';

export function PPlacement({ lesson, art, answers, onAnswered, onInteractive, interactiveDone, variant, setVariant, hidden }: PageProps) {
  const start = useMemo(() => {
    const z = lesson.zones.find((q) => q.id === (variant === 'ported' ? 'b52.near' : 'e902.reso')) ?? lesson.zones[0];
    const typeId = z.requires?.micTypeIds?.[0] ?? lesson.micTypeIds[0];
    return { typeId, pose: z.start };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const rig = useRig(lesson, { variant, mics: [{ slot: 'A', typeId: start.typeId, pattern: micType(start.typeId).patterns[0].id, pose: start.pose }] });
  useEffect(() => {
    if (rig.variant !== variant) rig.setVariant(variant);
  }, [variant, rig]);
  const [view, setView] = useState<ViewId>('side');
  const [posAxis, setPosAxis] = useState<PosAxis>('x');
  const [aimAxis, setAimAxis] = useState<AimAxis>('el');
  const [visited, setVisited] = useState<ReadonlySet<string>>(() => new Set());
  const [predicted, setPredicted] = useState<string | null>(null);
  const mic = rig.mics[0];
  const t = micType(mic.typeId);

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

  // CREDIT: a clear resting pose inside a documented zone, counted on release.
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
    { kind: 'toggle', id: 'view', label: view === 'side' ? 'SIDE VIEW' : 'TOP VIEW', value: view === 'top', onToggle: () => setView((v) => (v === 'side' ? 'top' : 'side')) },
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
          <Text style={styles.trayHead}>FRONT HEAD</Text>
          <View style={styles.chips}>
            {lesson.model.variants.map((v) => (
              <Chip key={v.id} on={v.id === variant} label={v.label} onPress={() => setVariant(v.id)} />
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
      valueLabel: zone ? (zone.kind === 'trial' ? 'TRIAL' : 'IN ZONE') : 'GO TO',
      selectedId: zone?.id ?? null,
      onSelect: (id) => {
        const z = lesson.zones.find((q) => q.id === id);
        if (z) rig.jumpTo('A', z.start);
      },
      options: available.map((z) => ({ id: z.id, label: `${z.kind === 'trial' ? 'TRIAL · ' : ''}${z.label}`, blurb: `${z.band}. “${z.quote}”` })),
    },
  ];

  const bezel: BezelItem[] = placementBezel(shown, readoutWords(rig, 'A'), zone, (id) => lesson.model.parts.find((p) => p.id === id)?.short ?? id);

  const labelFor = (v: ViewId) => sceneLabel(rig, v, ['A']);
  const pred = lesson.predictions.placement;
  const tried = predicted != null && visited.size >= 2;
  const steps: MikingStep[] = [
    {
      key: 'place',
      title: 'Place the mic',
      kind: 'PLACE',
      layout: 'rack',
      rack: {
        render: (w, h) => <DualView rig={rig} art={art} view={view} setView={setView} w={w} h={h} slots={['A']} interactive={!hidden} labelFor={labelFor} />,
        badge: 'ZONES: blue = sourced · dotted edge = drawn by the lab · amber dashed = TRIAL reading · grey hatch = ILLUSTRATIVE clearance · white dashed lobe = IDEAL pattern shape, not a range · pinch to zoom, double-tap to reset',
        bezel,
        params,
        initialParam: 'pos',
      },
      well: (
        <>
          {pred ? <PredictCard p={pred} value={predicted} onPick={setPredicted} /> : null}
          <Landing looking={`${t.short} · ${variant === 'ported' ? 'ported' : 'intact'} front head`} prompt="Drag the mic (or use POSITION and AIM; drag the amber ring to turn it). Rest it in two different documented zones." />
          <NowLine text={nowText(rig, ['A'])} />
          {shown.blocked ? <Note tone="warn">{`It would touch the ${shown.blocked.label} — the mic stops there.${variant === 'intact' && t.mount === 'stand' ? ' A stand mic cannot pass an intact head: mic it from outside.' : ''}`}</Note> : null}
          {zone ? <ZoneCard z={zone} /> : <Body>{`Not in a documented zone. Zones for this mic and head: ${available.map((z) => z.label).join('; ') || 'none — try another mic type or front head'}.`}</Body>}
          <Body>{`Activity: zones rested in, clear of every part — ${visited.size} of 2${visited.size ? ` (${[...visited].map((id) => lesson.zones.find((z) => z.id === id)?.label ?? id).join('; ')})` : ''}.`}</Body>
          {tried ? <Note tone="ok">{`You predicted “${predicted}”. The guides document a tendency toward more resonance as the mic moves toward the front head — and drums vary, so “it depends on this drum” is fair too. Read each zone’s TENDENCY: it is the source’s words, never a promised result.`}</Note> : null}
          {mic.typeId === 'kickDynCard' ? <Note>The e 902 manual also lists a few centimetres from the batter head (much attack, dry) and midway between the heads (less attack). An aiming experiment to try on a real drum: turn the mic away from where the beater strikes, and check whether the attack eases — this was in Sennheiser’s 2019 manual; the current manual leaves it out.</Note> : null}
          <Note>Clearance always wins: stop the drummer before moving a real mic. Port air can pop a mic — DPA suggests adjusting the mic’s angle in the hole, not pushing it farther in if that narrows the clearance.</Note>
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
          <Body>What you just did, in words. Each blue band is a manufacturer’s documented STARTING point for its own product, drawn from the head it names. Where the source gives a position in words without numbers, the lab draws its edges and the zone reads SOURCED* (* edges drawn by the lab). An amber dashed band is a TRIAL reading of words without numbers. None of them is a mandatory position, and none predicts another mic or drum.</Body>
          <Body>Height, distance and angle are separate variables: change one at a time. A row that names an orientation (“on-axis with beater”) counts only while the mic faces that head. Distances are measured to the mic’s FRONT and rounded to ≈ 5 mm — a mic’s acoustic centre is not the visible end of its grille, so no millimetre claim is made.</Body>
          <Note tone="warn">Clearance always wins. Stop the drummer before moving a mic; keep the mic, stand and cable clear of both heads, the beater, the port edge, the damping and the pedal. Grey hatched areas are ILLUSTRATIVE keep-outs: no source gives clearance numbers.</Note>
          <Body>Moving toward the beater side often increases the emphasis of attack; toward the front head can reveal more resonance — tendencies, and drums vary. With a directional mic, proximity effect also changes the lows as it nears a radiating surface; how much depends on the source’s size and the mic, and close to a large head it is usually less than a point-source chart suggests.</Body>
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
