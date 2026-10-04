/**
 * Page 1 — MEET THE INSTRUMENT (blueprint §7 row 1; lesson L6-L8).
 *
 * LEARN (rack): the drum from the side and from above (one model). Tap a part
 * to name it and see what it does; the PART fader steps through the sound
 * sources without a drag (the accessible path). FRONT HEAD switches ported /
 * intact — the drum as it is, never cut to match a diagram.
 * CHECK (read): one scenario.
 * Credit: every sound source found (tapped or stepped to) + the check.
 */
import { useEffect, useMemo, useState } from 'react';
import type { DockParam } from '../../rack/rackTypes';
import type { ViewId } from '../engine/model/types.ts';
import { useRig } from '../engine/scene/useRig.ts';
import { DualView } from '../engine/scene/DualView';
import { sceneLabel } from '../engine/scene/sceneWords.ts';
import { PageSteps, type MikingStep } from '../engine/steps';
import { Body, Card, Landing, Note, Point, ProvenanceTag, ScenarioList } from '../engine/kit';
import type { PageProps } from './pageTypes';

export function PInstrument({ lesson, art, answers, onAnswered, onInteractive, interactiveDone, variant, setVariant, hidden }: PageProps) {
  const model = lesson.model;
  const rig = useRig(lesson, { variant, mics: [{ slot: 'A', typeId: lesson.micTypeIds[0], pattern: 'supercardioid', pose: lesson.zones[0].start }] });
  useEffect(() => {
    if (rig.variant !== variant) rig.setVariant(variant);
  }, [variant, rig]);
  const [view, setView] = useState<ViewId>('side');
  const [partId, setPartId] = useState<string | null>(null);
  const [found, setFound] = useState<ReadonlySet<string>>(() => new Set());
  const regions = model.regions;
  const regionIdx = Math.max(0, regions.findIndex((r) => r.partId === partId));

  const pick = (id: string) => {
    setPartId(id);
    const r = regions.find((q) => q.partId === id);
    if (r) setFound((prev) => (prev.has(r.id) ? prev : new Set([...prev, r.id])));
  };
  const allFound = regions.every((r) => found.has(r.id));
  useEffect(() => {
    if (allFound && !interactiveDone.has('regions')) onInteractive('regions');
  }, [allFound, interactiveDone, onInteractive]);

  const region = regions.find((r) => r.partId === partId);
  // The front head is one tap target; its part differs by variant.
  const shownPart = partId === 'kick.reso' ? model.parts.find((p) => p.id === (variant === 'ported' ? 'kick.resoPorted' : 'kick.reso')) : model.parts.find((p) => p.id === partId);

  const params: DockParam[] = useMemo(
    () => [
      {
        kind: 'fader',
        id: 'part',
        label: 'PART',
        value: regions.length > 1 ? regionIdx / (regions.length - 1) : 0,
        onChange: (v) => {
          const r = regions[Math.round(v * (regions.length - 1))];
          if (r && (!r.variants || r.variants.includes(variant))) pick(r.partId);
        },
        format: () => (region ? `${region.label.toUpperCase()} · ${found.size} of ${regions.length} found` : `step through the ${regions.length} sound sources`),
        formatShort: () => (region ? region.label.toUpperCase().slice(0, 9) : 'STEP'),
      },
      { kind: 'toggle', id: 'view', label: view === 'side' ? 'SIDE VIEW' : 'TOP VIEW', value: view === 'top', onToggle: () => setView((v) => (v === 'side' ? 'top' : 'side')) },
      {
        kind: 'options',
        id: 'head',
        label: 'FRONT HEAD',
        valueLabel: variant === 'ported' ? 'PORTED' : 'INTACT',
        selectedId: variant,
        onSelect: (id) => setVariant(id),
        options: model.variants.map((v) => ({ id: v.id, label: v.label, blurb: v.blurb })),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [regions, regionIdx, region, found, view, variant, model.variants],
  );

  const labelFor = (v: ViewId) => sceneLabel(rig, v, [], partId ? `Highlighted: ${shownPart?.label ?? partId}.` : undefined);
  const steps: MikingStep[] = [
    {
      key: 'learn',
      title: 'Find the sources',
      kind: 'LEARN',
      layout: 'rack',
      rack: {
        render: (w, h) => (
          <DualView rig={rig} art={art} view={view} setView={setView} w={w} h={h} slots={[]} showZones={false} showPolar={false} interactive={!hidden} highlight={partId} onTapPart={pick} labelFor={labelFor} />
        ),
        badge: 'MODEL · 22 × 18 in kick from maker dimensions · grey = illustrative',
        bezel: [
          { k: 'PART', v: shownPart ? shownPart.short.toUpperCase() : 'TAP ONE', flex: 1.4 },
          { k: 'SOURCES FOUND', v: `${found.size} / ${regions.length}` },
          { k: 'FRONT HEAD', v: variant === 'ported' ? 'PORTED' : 'INTACT' },
        ],
        params,
        initialParam: 'part',
      },
      well: (
        <>
          <Landing looking={`a ${model.name}, cut open, from the ${view === 'side' ? 'side' : 'top'}`} prompt="Tap a part — or step through PART — to find where the sound comes from." />
          {shownPart ? (
            <Card>
              <Point title={shownPart.label.toUpperCase()}>{shownPart.role}</Point>
              {region ? <Body>{`SOUND SOURCE · ${region.note}`}</Body> : null}
              <ProvenanceTag kind={shownPart.prov.kind} />
            </Card>
          ) : (
            <Note>The beater strikes the batter head. The resonant head, the air inside, the shell, the tuning and any damping all shape what you hear (L7).</Note>
          )}
          <Body>{`Found: ${regions.map((r) => `${found.has(r.id) ? '✓' : '○'} ${r.label}`).join('   ')}`}</Body>
          {variant === 'intact' && !found.has('r.port') ? <Note tone="warn">The port is a source on a PORTED head — switch FRONT HEAD to see it.</Note> : null}
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
          <Body>Ask the player first: is the front head intact or ported, and what should the kick do — a supportive pulse, a defined attack, a resonant note, or a mix? Hear the drum without reinforcement. If its tuning or damping needs work, agree it with the player (the Drum Tuning Lab covers that): mic placement cannot fix a drum that does not make the wanted sound acoustically (L8).</Body>
          <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'instrument')} answers={answers} onAnswered={onAnswered} />
        </>
      ),
    },
  ];
  return <PageSteps steps={steps} />;
}
