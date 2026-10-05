/**
 * HAND DRUMS · Page 1 — ORIENT: MEET THE INSTRUMENT (LESSON_JOURNEY §6
 * stage 1), the family's version of pages/PInstrument.tsx. Asks NOTHING and
 * places NO mic:
 *
 *   START (read)       the journey map; NEW or EXPERIENCED; the quick check.
 *   WHAT IT IS (read)  the drawing, large, and four plain facts.
 *   THE PARTS (rack)   the set from the side and from above: tap a part (or
 *                      step through PART) to name it; the SETUP switch
 *                      (floor / raised, knees / stand …) when there is one.
 * Credit: banks on NEXT from the last step (nothing to answer).
 */
import { useEffect, useMemo, useState } from 'react';
import type { DockParam } from '../../../../../rack/rackTypes';
import type { Part, ViewId } from '../../../../engine/model/types.ts';
import { useRig } from '../../../../engine/scene/useRig.ts';
import { DualView } from '../../../../engine/scene/DualView';
import { InstrumentFigure } from '../../../../engine/scene/InstrumentFigure';
import { sceneLabel } from '../../../../engine/scene/sceneWords.ts';
import { PageSteps, type MikingStep } from '../../../../engine/steps';
import { Body, Card, Landing, Note, Point } from '../../../../engine/kit';
import { JourneyMap, PathChooser, QuickCheckCard } from '../../../../engine/journeyKit';
import type { PageProps } from '../../../../pages/pageTypes';
import { handOf } from '../family.ts';

/** One entry per distinct part (three stand legs are one STAND). */
export function uniqueParts(parts: Part[]): Part[] {
  const seen = new Set<string>();
  return parts.filter((p) => (seen.has(p.label) ? false : (seen.add(p.label), true)));
}

export function HInstrument({ lesson, art, variant, setVariant, hidden, journey }: PageProps) {
  const H = handOf(lesson);
  const model = lesson.model;
  const rig = useRig(lesson, { variant, mics: [{ slot: 'A', typeId: lesson.micTypeIds[0], pattern: 'cardioid', pose: lesson.zones[0].start }] });
  useEffect(() => {
    if (rig.variant !== variant) rig.setVariant(variant);
  }, [variant, rig]);
  const [view, setView] = useState<ViewId>('side');
  const [partId, setPartId] = useState<string | null>(null);
  const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set());
  const parts = uniqueParts(model.parts.filter((p) => !p.variants || p.variants.includes(variant)));
  // A tap on a second leg of a stand names the stand (its first entry).
  const canon = (id: string) => {
    const p = model.parts.find((q) => q.id === id);
    return p ? parts.find((q) => q.label === p.label)?.id ?? id : id;
  };
  const shown = parts.find((p) => p.id === partId) ?? null;
  const partIdx = Math.max(0, parts.findIndex((p) => p.id === partId));
  const pick = (raw: string) => {
    const id = canon(raw);
    setPartId(id);
    setSeen((prev) => (prev.has(id) ? prev : new Set([...prev, id])));
  };
  const region = model.regions.find((r) => r.partId === partId);
  const multi = model.variants.length > 1;
  const vLabel = model.variants.find((v) => v.id === variant)?.label ?? '';

  const params: DockParam[] = useMemo(
    () => [
      {
        kind: 'fader',
        id: 'part',
        label: 'PART',
        value: parts.length > 1 ? partIdx / (parts.length - 1) : 0,
        onChange: (v) => {
          const p = parts[Math.round(v * (parts.length - 1))];
          if (p) pick(p.id);
        },
        format: () => (shown ? `${shown.label.toUpperCase()} · ${seen.size} of ${parts.length} looked at` : `step through the ${parts.length} parts`),
        formatShort: () => (shown ? shown.short.toUpperCase().slice(0, 9) : 'STEP'),
      },
      { kind: 'toggle', id: 'view', label: view === 'side' ? 'SIDE VIEW' : 'TOP VIEW', value: view === 'top', onToggle: () => setView((v) => (v === 'side' ? 'top' : 'side')) },
      ...(multi
        ? [
            {
              kind: 'options' as const,
              id: 'setup',
              label: H.variantKey,
              valueLabel: vLabel.split(' ')[0],
              selectedId: variant,
              onSelect: (id: string) => setVariant(id),
              options: model.variants.map((v) => ({ id: v.id, label: v.label, blurb: v.blurb })),
            },
          ]
        : []),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [parts, partIdx, shown, seen, view, variant, model.variants],
  );

  const labelFor = (v: ViewId) => sceneLabel(rig, v, [], partId ? `Highlighted: ${shown?.label ?? partId}.` : undefined);
  const steps: MikingStep[] = [
    {
      key: 'start',
      title: 'Start here',
      kind: 'READ',
      layout: 'read',
      body: (
        <>
          <Body>{`This lesson is about putting microphones on ${lesson.noun.many} — but first the drums themselves: what they are, how they make their sound, and where they sit. Then the microphones, a worked example, and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.`}</Body>
          <JourneyMap met={journey.met} here="instrument" />
          <PathChooser journey={journey} />
          {journey.path === 'experienced' ? <QuickCheckCard items={lesson.diagnostic} journey={journey} /> : null}
          {journey.path === 'new' ? <Note tone="ok">Good — NEXT takes you through the drums first. You can change how you started here at any time.</Note> : null}
        </>
      ),
    },
    {
      key: 'what',
      title: 'What it is',
      kind: 'LEARN',
      layout: 'read',
      body: (
        <>
          <InstrumentFigure art={art} model={model} view={H.figure.view} variant={variant} title={lesson.title.toUpperCase()} badge={H.figure.badge} label={H.figure.label} />
          {lesson.orient.map((f) => (
            <Card key={f.title}>
              <Point title={f.title}>{f.text}</Point>
            </Card>
          ))}
        </>
      ),
    },
    {
      key: 'parts',
      title: 'The parts',
      kind: 'TRY',
      layout: 'rack',
      rack: {
        render: (w, h) => <DualView rig={rig} art={art} view={view} setView={setView} w={w} h={h} slots={[]} showZones={false} showPolar={false} interactive={!hidden} highlight={partId} onTapPart={pick} labelFor={labelFor} />,
        badge: H.partsBadge,
        bezel: [
          { k: 'PART', v: shown ? shown.short.toUpperCase() : 'TAP ONE', flex: 1.4 },
          { k: 'LOOKED AT', v: `${seen.size} / ${parts.length}` },
          ...(multi ? [{ k: H.variantKey, v: vLabel.split(' ')[0] }] : []),
        ],
        params,
        initialParam: 'part',
      },
      well: (
        <>
          <Landing looking={`${view === 'side' ? 'Side' : 'Top'} view · ${vLabel.toLowerCase() || lesson.title.toLowerCase()}`} prompt={H.partsPrompt} />
          {shown ? (
            <Card>
              <Point title={shown.label.toUpperCase()}>{shown.role}</Point>
              {region ? <Body>{`WHERE SOUND COMES FROM · ${region.note}`}</Body> : null}
            </Card>
          ) : (
            <Note>{H.partsNote}</Note>
          )}
          {multi ? <Note>{model.variants.find((v) => v.id === variant)?.blurb ?? ''}</Note> : null}
        </>
      ),
    },
  ];
  return <PageSteps steps={steps} />;
}
