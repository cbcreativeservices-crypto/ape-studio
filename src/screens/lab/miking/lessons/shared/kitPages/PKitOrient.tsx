/**
 * Page 1 — ORIENT for a KIT-LEVEL lesson (overheads, room, complete kit):
 * the journey's stage 1 (LESSON_JOURNEY §6) with the whole kit as the
 * "instrument". Asks nothing and places no mic:
 *
 *   START (read)       the journey map; NEW or EXPERIENCED; the quick check
 *                      (experienced only — it opens the activities, credits
 *                      nothing).
 *   WHAT IT IS (read)  the lesson's own figure, large, and its plain facts.
 *   THE PARTS (rack)   the kit from the side and from above (the lesson's
 *                      art): tap a part — or step through PART — to read what
 *                      it means for THIS lesson's mics; the lesson's variant
 *                      (studio or live) switches the scene.
 *
 * Credit: banks on NEXT from the last step (nothing to answer).
 */
import { useEffect, useMemo, useState } from 'react';
import type { DockParam } from '../../../../rack/rackTypes';
import type { ViewId } from '../../../engine/model/types.ts';
import { copyOf } from '../../../engine/model/copy.ts';
import { useRig } from '../../../engine/scene/useRig.ts';
import { DualView } from '../../../engine/scene/DualView';
import { InstrumentFigure } from '../../../engine/scene/InstrumentFigure';
import { sceneLabel } from '../../../engine/scene/sceneWords.ts';
import { PageSteps, type MikingStep } from '../../../engine/steps';
import { Body, Card, Landing, Note, Point } from '../../../engine/kit';
import { JourneyMap, PathChooser, QuickCheckCard } from '../../../engine/journeyKit';
import { micType } from '../../../data/micTypes';
import type { PageProps } from '../../../pages/pageTypes';
import { viewToggle } from '../../../engine/scene/viewToggle.ts';

export type KitOrientWords = {
  /** START: what this lesson is about, before the journey map. */
  start: string;
  /** NEW path, once chosen. */
  newPath: string;
  /** THE PARTS prompt. */
  partsPrompt: string;
};

export function PKitOrient({ lesson, art, variant, setVariant, hidden, journey, words }: PageProps & { words: KitOrientWords }) {
  const model = lesson.model;
  const C = copyOf(lesson);
  const z0 = lesson.zones[0];
  const t0 = z0.requires?.micTypeIds?.[0] ?? lesson.micTypeIds[0];
  const rig = useRig(lesson, { variant, mics: [{ slot: 'A', typeId: t0, pattern: micType(t0).patterns[0].id, pose: z0.start }] });
  useEffect(() => {
    if (rig.variant !== variant) rig.setVariant(variant);
  }, [variant, rig]);
  const [view, setView] = useState<ViewId>('side');
  const [partId, setPartId] = useState<string | null>(null);
  const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set());
  const parts = model.parts.filter((p) => (!p.variants || p.variants.includes(variant)) && (!p.listIn || p.listIn.includes(variant)));
  const variantLabel = model.variants.find((v) => v.id === variant)?.label ?? variant.toUpperCase();
  const partIdx = Math.max(0, parts.findIndex((p) => p.id === partId));
  const shownPart = parts.find((p) => p.id === partId);
  const region = model.regions.find((r) => r.partId === partId);

  const pick = (id: string) => {
    if (!parts.some((p) => p.id === id)) return;
    setPartId(id);
    setSeen((prev) => (prev.has(id) ? prev : new Set([...prev, id])));
  };

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
        format: () => (shownPart ? `${shownPart.short.toUpperCase()} · ${seen.size} of ${parts.length} looked at` : `step through the ${parts.length} parts`),
        formatShort: () => (shownPart ? shownPart.short.toUpperCase().slice(0, 9) : 'STEP'),
      },
      ...viewToggle({ view: view, setView: setView, stage: 'dual' }),
      {
        kind: 'options',
        id: 'where',
        label: C.variantKey,
        valueLabel: variantLabel,
        selectedId: variant,
        onSelect: (id) => setVariant(id),
        options: model.variants.map((v) => ({ id: v.id, label: v.label, blurb: v.blurb })),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [parts, partIdx, shownPart, seen, view, variant, model.variants, C.variantKey, variantLabel],
  );

  const labelFor = (v: ViewId) => sceneLabel(rig, v, [], partId ? `Highlighted: ${shownPart?.label ?? partId}.` : undefined);
  const steps: MikingStep[] = [
    {
      key: 'start',
      title: 'Start here',
      kind: 'READ',
      layout: 'read',
      body: (
        <>
          <Body>{words.start}</Body>
          <JourneyMap met={journey.met} here="meet" />
          <PathChooser journey={journey} />
          {journey.path === 'experienced' ? <QuickCheckCard items={lesson.diagnostic} journey={journey} /> : null}
          {journey.path === 'new' ? <Note tone="ok">{words.newPath}</Note> : null}
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
          <InstrumentFigure art={art} model={model} view="side" variant={variant} title={lesson.title.toUpperCase()} badge={C.instrument.figureBadge} label={C.instrument.figureLabel} />
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
        badge: C.instrument.partsBadge,
        bezel: [
          { k: 'PART', v: shownPart ? shownPart.short.toUpperCase() : 'TAP ONE', flex: 1.4 },
          { k: 'LOOKED AT', v: `${seen.size} / ${parts.length}` },
          { k: C.variantKey, v: variantLabel },
        ],
        params,
        initialParam: 'part',
      },
      well: (
        <>
          <Landing looking={C.instrument.partsLooking[view]} prompt={words.partsPrompt} />
          {shownPart ? (
            <Card>
              <Point title={shownPart.label.toUpperCase()}>{shownPart.role}</Point>
              {region ? <Body>{`WHERE SOUND COMES FROM · ${region.note}`}</Body> : null}
            </Card>
          ) : (
            <Note>{C.instrument.partsIdle}</Note>
          )}
          {C.instrument.variantNotes[variant] ? <Note>{C.instrument.variantNotes[variant]}</Note> : null}
        </>
      ),
    },
  ];
  return <PageSteps steps={steps} />;
}
