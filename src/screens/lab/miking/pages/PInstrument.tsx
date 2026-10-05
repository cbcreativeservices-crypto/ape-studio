/**
 * Page 1 — ORIENT: MEET THE INSTRUMENT (LESSON_JOURNEY §6 stage 1).
 *
 * The owner, 2026-10-04: "The user interaction begins too early — there needs
 * to be an understanding of the instrument, the sounds, the layout, then
 * finally the miking." So this page asks NOTHING and places NO mic:
 *
 *   START (read)       the journey map; NEW or EXPERIENCED; the quick check
 *                      (experienced only — it opens the activities, credits
 *                      nothing).
 *   WHAT IT IS (read)  the drawing, large, and four plain facts: what it is,
 *                      where you meet it, its job in the music, its size.
 *   THE PARTS (rack)   the drum from the side and from above, cut open: tap a
 *                      part (or step through PART) to name it; FRONT HEAD
 *                      ported / intact. (Owner ruling 2026-10-04: no source
 *                      names and no evidence badges on screen.)
 *
 * Credit: banks on NEXT from the last step (nothing to answer — an orient
 * page, the PagedLab rule for a page with no requirement).
 */
import { useEffect, useMemo, useState } from 'react';
import type { DockParam } from '../../rack/rackTypes';
import type { ViewId } from '../engine/model/types.ts';
import { copyOf } from '../engine/model/copy.ts';
import { useRig } from '../engine/scene/useRig.ts';
import { DualView } from '../engine/scene/DualView';
import { InstrumentFigure } from '../engine/scene/InstrumentFigure';
import { ExpandableFigure } from '../../kit/ExpandableFigure';
import { sceneLabel } from '../engine/scene/sceneWords.ts';
import { PageSteps, type MikingStep } from '../engine/steps';
import { Body, Card, Landing, Note, Point } from '../engine/kit';
import { JourneyMap, PathChooser, QuickCheckCard } from '../engine/journeyKit';
import type { PageProps } from './pageTypes';

export function PInstrument({ lesson, art, variant, setVariant, hidden, journey }: PageProps) {
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
      { kind: 'toggle', id: 'view', label: view === 'side' ? 'SIDE VIEW' : 'TOP VIEW', value: view === 'top', onToggle: () => setView((v) => (v === 'side' ? 'top' : 'side')) },
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
          <Body>{C.terms?.startIntro ?? C.words.intro ?? `This lesson is about putting a microphone on ${/^[aeiou]/i.test(lesson.noun.one) ? 'an' : 'a'} ${lesson.noun.one} — but first the ${C.words.instrument} itself: what it is, how it makes its sound, and where it sits. Then the microphones, a worked example, and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.`}</Body>
          <JourneyMap met={journey.met} here="instrument" />
          <PathChooser journey={journey} />
          {journey.path === 'experienced' ? <QuickCheckCard items={lesson.diagnostic} journey={journey} /> : null}
          {journey.path === 'new' ? <Note tone="ok">{C.terms?.startNew ?? C.words.newNote ?? `Good — NEXT takes you through the ${C.words.instrument} first. You can change how you started here at any time.`}</Note> : null}
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
          {art.figure ? (
            <ExpandableFigure badge={C.instrument.figureBadge} title={lesson.title.toUpperCase()} aspect={art.figure.aspect} render={art.figure.render} />
          ) : (
            <InstrumentFigure
              art={art}
              model={model}
              view="side"
              variant={variant}
              title={lesson.title.toUpperCase()}
              badge={C.instrument.figureBadge}
              label={C.instrument.figureLabel}
            />
          )}
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
