/**
 * ORIENT for the SMALL-PERCUSSION family (LESSON_JOURNEY §6 stage 1): the
 * shared page (pages/PInstrument) with one change — small instruments are
 * drawn CLOSE UP. The lesson's scene views are framed for the microphones'
 * starting points, up to 60–80 cm away, which leaves a shaker or a clave a
 * few points wide on a phone; here the figure and THE PARTS use the family's
 * close-up boxes (`sp.close`), the same art and the same model otherwise.
 * Nothing to answer; no mic (owner 2026-10-04: understanding first).
 */
import { useEffect, useMemo, useState } from 'react';
import type { DockParam } from '../../../../../rack/rackTypes';
import type { ViewId } from '../../../../engine/model/types.ts';
import { copyOf } from '../../../../engine/model/copy.ts';
import { useRig } from '../../../../engine/scene/useRig.ts';
import { DualView } from '../../../../engine/scene/DualView';
import { InstrumentFigure } from '../../../../engine/scene/InstrumentFigure';
import { sceneLabel } from '../../../../engine/scene/sceneWords.ts';
import { PageSteps, type MikingStep } from '../../../../engine/steps';
import { Body, Card, Landing, Note, Point } from '../../../../engine/kit';
import { JourneyMap, PathChooser, QuickCheckCard } from '../../../../engine/journeyKit';
import { journeyIntro } from '../../../../engine/journey.ts';
import type { PageProps } from '../../../../pages/pageTypes';
import { spOf } from '../family.ts';
import { viewToggle } from '../../../../engine/scene/viewToggle.ts';

export function SInstrument({ lesson: full, art, variant, setVariant, hidden, journey }: PageProps) {
  // The same lesson, its views framed close up on the instrument.
  const close = spOf(full).close;
  const lesson = useMemo(() => ({ ...full, model: { ...full.model, views: close, viewsByVariant: undefined } }), [full, close]);
  const model = lesson.model;
  const C = copyOf(lesson);
  const rig = useRig(lesson, { variant, mics: [{ slot: 'A', typeId: lesson.micTypeIds[0], pattern: 'supercardioid', pose: lesson.zones[0].start }] });
  useEffect(() => {
    if (rig.variant !== variant) rig.setVariant(variant);
  }, [variant, rig]);
  const [view, setView] = useState<ViewId>('side');
  const [partId, setPartId] = useState<string | null>(null);
  const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set());
  const regions = model.regions;
  const parts = model.parts.filter((p) => (!p.variants || p.variants.includes(variant)) && (!p.listIn || p.listIn.includes(variant)));
  const variantLabel = model.variants.find((v) => v.id === variant)?.label ?? variant.toUpperCase();
  const partIdx = Math.max(0, parts.findIndex((p) => p.id === partId || (partId === 'kick.reso' && p.id === 'kick.resoPorted')));

  const pick = (id: string) => {
    setPartId(id);
    setSeen((prev) => (prev.has(id) ? prev : new Set([...prev, id])));
  };
  const region = regions.find((r) => r.partId === partId);
  // The front head is one tap target; its part differs by variant.
  const shownPart = partId === 'kick.reso' || partId === 'kick.resoPorted' ? model.parts.find((p) => p.id === (variant === 'ported' ? 'kick.resoPorted' : 'kick.reso')) : model.parts.find((p) => p.id === partId);

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
        id: 'head',
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
          <Body>{journeyIntro(lesson.noun, C.words.instrument)}</Body>
          <JourneyMap met={journey.met} here="meet" />
          <PathChooser journey={journey} />
          {journey.path === 'experienced' ? <QuickCheckCard items={lesson.diagnostic} journey={journey} /> : null}
          {journey.path === 'new' ? <Note tone="ok">{`Good — NEXT takes you through the ${C.words.instrument} first. You can change how you started here at any time.`}</Note> : null}
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
          <InstrumentFigure
            art={art}
            model={model}
            view="side"
            variant={variant}
            title={lesson.title.toUpperCase()}
            badge={C.instrument.figureBadge}
            label={C.instrument.figureLabel}
          />
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
        render: (w, h) => (
          <DualView rig={rig} art={art} view={view} setView={setView} w={w} h={h} slots={[]} showZones={false} showPolar={false} interactive={!hidden} highlight={partId} onTapPart={pick} labelFor={labelFor} />
        ),
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
          <Landing looking={C.instrument.partsLooking[view]} prompt="Tap any part — or step through PART — to see what it is and what it does. There is nothing to answer on this page." />
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
