/**
 * Page 2 — CHOOSE THE MICROPHONE (blueprint §7 row 2; lesson L14-L18).
 *
 * LEARN (read): the mic types BY PROPERTY — transducer, pattern, power,
 * size, mount — with named models only as cited examples.
 * COMPARE (rack): the chosen type's art + its IDEAL lobe and a test source at
 * SOURCE ANGLE; the bezel prints the ideal relative pickup.
 * CHECK (read): three scenarios.
 */
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import type { DockParam } from '../../rack/rackTypes';
import type { MicPattern } from '../engine/model/types.ts';
import { PolarCompare } from '../engine/scene/PolarCompare';
import { PageSteps, type MikingStep } from '../engine/steps';
import { Body, Card, Landing, Note, Point, ProvenanceTag, ScenarioList } from '../engine/kit';
import { gainDb, isModelled, nullAngles, PATTERN_LABELS } from '../engine/physics/polar.ts';
import { fmtDb } from '../engine/model/units.ts';
import { MIC_TYPES, micType } from '../data/micTypes';
import type { PageProps } from './pageTypes';

export function PMicrophone({ lesson, answers, onAnswered }: PageProps) {
  const [typeId, setTypeId] = useState(lesson.micTypeIds[0]);
  const t = micType(typeId);
  const [pattern, setPattern] = useState<MicPattern>(t.patterns[0].id);
  const [angle, setAngle] = useState(0);
  const pat: MicPattern = t.patterns.some((p) => p.id === pattern) ? pattern : t.patterns[0].id;
  const patLabel = t.patterns.find((p) => p.id === pat)?.label ?? PATTERN_LABELS[pat];
  const pickup = isModelled(pat) ? fmtDb(gainDb(pat, angle)) : 'not drawn';
  const nulls = isModelled(pat) ? nullAngles(pat) : [];

  const params: DockParam[] = useMemo(
    () => [
      {
        kind: 'fader',
        id: 'angle',
        label: 'SOURCE ANGLE',
        value: angle / 180,
        onChange: (v) => setAngle(Math.round(v * 180)),
        format: () => `${angle}° off axis · ideal ${pickup}`,
        formatShort: () => `${angle}°`,
        home: 0,
      },
      {
        kind: 'options',
        id: 'type',
        label: 'TYPE',
        valueLabel: t.short,
        selectedId: typeId,
        onSelect: (id) => {
          setTypeId(id);
          setPattern(micType(id).patterns[0].id);
        },
        sticky: true,
        options: lesson.micTypeIds.map((id) => ({ id, label: MIC_TYPES[id].label, blurb: MIC_TYPES[id].blurb })),
      },
      {
        kind: 'options',
        id: 'pattern',
        label: 'PATTERN',
        valueLabel: (isModelled(pat) ? pat : 'NOT DRAWN').toUpperCase().slice(0, 10),
        selectedId: pat,
        onSelect: (id) => setPattern(id as MicPattern),
        sticky: true,
        options: t.patterns.map((p) => ({ id: p.id, label: p.label, blurb: p.prov.kind === 'sourced' ? `Source: “${p.prov.quote}”` : undefined })),
      },
    ],
    [angle, pickup, t, typeId, pat, lesson.micTypeIds],
  );

  const steps: MikingStep[] = [
    {
      key: 'learn',
      title: 'By property, not brand',
      kind: 'LEARN',
      layout: 'read',
      body: (
        <>
          <Body>No brand is required. Choose by what the job needs: the pattern, the power it needs, its size and how it mounts, and what level it is specified for. Models appear here only as the cited source of a number. Do not assume every dynamic is less detailed, every condenser flat, or that a larger diaphragm means better bass (L18).</Body>
          {lesson.micTypeIds.map((id) => {
            const m = MIC_TYPES[id];
            return (
              <Card key={id}>
                <Point title={m.label.toUpperCase()}>{m.blurb}</Point>
                <Body>{`Pattern: ${m.patterns.map((p) => p.label).join(' / ')} · Power: ${m.power} · Mount: ${m.mount === 'surface' ? 'rests on a cushioning surface (its own manual allows it)' : 'stand or approved mount'}`}</Body>
                <Body>{`Drawn size: ${(m.body.radius.mm * 2).toFixed(m.body.radius.mm * 2 < 30 ? 1 : 0)} × ${m.body.length.mm} mm (${m.body.width ? `${m.body.width.mm} mm wide, ` : ''}from the cited example)`}</Body>
                {m.examples.map((e) => (
                  <View key={e.model} style={{ gap: 2 }}>
                    <ProvenanceTag kind="sourced" />
                    <Body>{`${e.model} — ${e.fact}`}</Body>
                  </View>
                ))}
              </Card>
            );
          })}
          <Note>Before connecting, disconnecting or switching phantom power: mute the outputs and lower the monitoring, and follow the actual equipment manual (L12).</Note>
        </>
      ),
    },
    {
      key: 'compare',
      title: 'Patterns',
      kind: 'COMPARE',
      layout: 'rack',
      rack: {
        render: (w, h) => <PolarCompare w={w} h={h} typeId={typeId} pattern={pat} angle={angle} label={`${t.label}, ${patLabel}. Test source ${angle} degrees off the front axis: ideal relative pickup ${pickup}.`} />,
        badge: 'IDEAL first-order pattern · frequency-independent · not this mic’s measured polar plot',
        bezel: [
          { k: 'PATTERN', v: isModelled(pat) ? pat.toUpperCase() : 'NOT DRAWN', flex: 1.3 },
          { k: 'AT ANGLE', v: `${angle}°` },
          { k: 'IDEAL PICKUP', v: pickup, flex: 1.2 },
          { k: 'NULL', v: nulls.length ? `${nulls[0].toFixed(0)}°` : 'NONE' },
        ],
        params,
        initialParam: 'angle',
      },
      well: (
        <>
          <Landing looking={`${t.label.toLowerCase()} with its ${patLabel} pattern`} prompt="Move SOURCE ANGLE round the back. Where does the pickup fall furthest?" />
          {pat === 'supercardioid' ? (
            <Note>The ideal supercardioid rejects most at ≈ 125°, with a small inverted lobe directly behind (−11.4 dB). Shure’s Beta 52A guide puts its greatest rejection at 120° toward the rear; Shure’s live guide says 126°. The maker’s description is “modified supercardioid” — its real pattern changes with frequency.</Note>
          ) : pat === 'cardioid' ? (
            <Note>A cardioid rejects most directly behind (180°).</Note>
          ) : !isModelled(pat) ? (
            <Note>{t.mount === 'surface' ? 'A boundary plate: Shure states “half-cardioid (cardioid in hemisphere above mounting surface)” and “Keep sound sources within a 60° range above this surface.” That is not a free-field lobe, so none is drawn.' : 'The maker calls this pattern “open cardioid” without numbers, so no lobe is drawn. The generic ideal patterns are offered for comparison.'}</Note>
          ) : null}
        </>
      ),
    },
    {
      key: 'check',
      title: 'Check',
      kind: 'CHECK',
      layout: 'read',
      body: <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'microphone')} answers={answers} onAnswered={onAnswered} />,
    },
  ];
  return <PageSteps steps={steps} />;
}
