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
 *   WHAT IT IS (read)  the drawing, large, and four sourced facts: what it is,
 *                      where you meet it, its job in the music, its size.
 *   THE PARTS (rack)   the drum from the side and from above, cut open: tap a
 *                      part (or step through PART) to name it; FRONT HEAD
 *                      ported / intact; HOW TO READ THIS LAB (pre-training of
 *                      the evidence labels before any complex scene).
 *
 * Credit: banks on NEXT from the last step (nothing to answer — an orient
 * page, the PagedLab rule for a page with no requirement).
 */
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import type { DockParam } from '../../rack/rackTypes';
import type { ViewId } from '../engine/model/types.ts';
import { useRig } from '../engine/scene/useRig.ts';
import { DualView } from '../engine/scene/DualView';
import { InstrumentFigure } from '../engine/scene/InstrumentFigure';
import { sceneLabel } from '../engine/scene/sceneWords.ts';
import { PageSteps, type MikingStep } from '../engine/steps';
import { Body, Card, HowToRead, Landing, Note, Point, ProvenanceTag } from '../engine/kit';
import { JourneyMap, PathChooser, QuickCheckCard } from '../engine/journeyKit';
import type { PageProps } from './pageTypes';

export function PInstrument({ lesson, art, variant, setVariant, hidden, journey }: PageProps) {
  const model = lesson.model;
  const rig = useRig(lesson, { variant, mics: [{ slot: 'A', typeId: lesson.micTypeIds[0], pattern: 'supercardioid', pose: lesson.zones[0].start }] });
  useEffect(() => {
    if (rig.variant !== variant) rig.setVariant(variant);
  }, [variant, rig]);
  const [view, setView] = useState<ViewId>('side');
  const [partId, setPartId] = useState<string | null>(null);
  const [seen, setSeen] = useState<ReadonlySet<string>>(() => new Set());
  const regions = model.regions;
  const parts = model.parts.filter((p) => !p.variants || p.variants.includes(variant));
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
        label: 'FRONT HEAD',
        valueLabel: variant === 'ported' ? 'PORTED' : 'INTACT',
        selectedId: variant,
        onSelect: (id) => setVariant(id),
        options: model.variants.map((v) => ({ id: v.id, label: v.label, blurb: v.blurb })),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [parts, partIdx, shownPart, seen, view, variant, model.variants],
  );

  const labelFor = (v: ViewId) => sceneLabel(rig, v, [], partId ? `Highlighted: ${shownPart?.label ?? partId}.` : undefined);
  const srcLabel = (key: string) => lesson.sources.find((s) => s.key === key)?.label.replace(/^\[\d+[a-z, ]*\]\s*/, '') ?? '';
  const steps: MikingStep[] = [
    {
      key: 'start',
      title: 'Start here',
      kind: 'READ',
      layout: 'read',
      body: (
        <>
          <Body>{`This lesson is about putting a microphone on a ${lesson.noun.one} — but first the drum itself: what it is, how it makes its sound, and where it sits. Then the microphones, a worked example, and your own placements. Nothing here makes a sound: the lab is silent and shows the physics instead.`}</Body>
          <JourneyMap met={journey.met} here="instrument" />
          <PathChooser journey={journey} />
          {journey.path === 'experienced' ? <QuickCheckCard items={lesson.diagnostic} journey={journey} /> : null}
          {journey.path === 'new' ? <Note tone="ok">Good — NEXT takes you through the drum first. You can change how you started here at any time.</Note> : null}
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
            badge="MODEL · a 22 × 18 in kick from maker dimensions, cut open · grey = ILLUSTRATIVE"
            label={`Side view of a ${model.name}, cut open: the batter head on the player's side with the pedal and beater, the shell, and the front head facing the audience.`}
          />
          {lesson.orient.map((f) => (
            <Card key={f.title}>
              <Point title={f.title}>{f.text}</Point>
              <View style={styles.cite}>
                <ProvenanceTag kind="sourced" />
                <Text style={styles.citeText}>{srcLabel(f.src)}</Text>
              </View>
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
        badge: 'MODEL · 22 × 18 in kick from maker dimensions · grey = illustrative',
        bezel: [
          { k: 'PART', v: shownPart ? shownPart.short.toUpperCase() : 'TAP ONE', flex: 1.4 },
          { k: 'LOOKED AT', v: `${seen.size} / ${parts.length}` },
          { k: 'FRONT HEAD', v: variant === 'ported' ? 'PORTED' : 'INTACT' },
        ],
        params,
        initialParam: 'part',
      },
      well: (
        <>
          <HowToRead />
          <Landing looking={`${view === 'side' ? 'Side' : 'Top'} view · the drum cut open`} prompt="Tap any part — or step through PART — to see what it is and what it does. There is nothing to answer on this page." />
          {shownPart ? (
            <Card>
              <Point title={shownPart.label.toUpperCase()}>{shownPart.role}</Point>
              {region ? <Body>{`WHERE SOUND COMES FROM · ${region.note}`}</Body> : null}
              <ProvenanceTag kind={shownPart.prov.kind} />
            </Card>
          ) : (
            <Note>The beater strikes the batter head. Both heads, the air inside, the shell, the tuning and any damping all shape what you hear — the next page shows how.</Note>
          )}
          {variant === 'intact' ? <Note>An INTACT front head has no port. Switch FRONT HEAD to see a ported one — the drum as the player brings it; never cut a port to match a diagram.</Note> : null}
        </>
      ),
    },
  ];
  return <PageSteps steps={steps} />;
}

const styles = StyleSheet.create({
  cite: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  citeText: { flex: 1, color: colors.textMuted, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16 },
});
