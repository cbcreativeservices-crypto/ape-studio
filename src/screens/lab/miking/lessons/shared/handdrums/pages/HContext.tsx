/**
 * HAND DRUMS · STUDIO OR LIVE (LESSON_JOURNEY §6 stage 6), the family's
 * version of pages/PContext.tsx (its review fixes kept):
 *   • the MONITORS stay where a stage puts them; the learner AIMS THE MIC and
 *     picks its PATTERN — "position the monitors with respect to the actual
 *     pattern". The mic starts at the drum's far edge, aimed back across the
 *     head; the player's own floor wedge sits in front of the drums facing
 *     them, BELOW and in front of the mic. A cardioid's null (straight
 *     behind) points up into the air; the off-axis nulls of a supercardioid
 *     or a hypercardioid can reach the wedge with a modest tilt.
 *   • A null never prints a number ("deep null"); try before tell.
 *   • STUDIO is a decision card.
 * Feedback is never provoked.
 * Credit: the wedge within ±15° (the lab's tolerance) of a null by the
 * learner's aim or pattern, in LIVE + the studio card + the checks.
 */
import { useEffect, useMemo, useState } from 'react';
import type { BezelItem, DockParam } from '../../../../../rack/rackTypes';
import type { MicPattern, MicPose, PatternId, ViewBox, ViewId, Vec3 } from '../../../../engine/model/types.ts';
import { useRig } from '../../../../engine/scene/useRig.ts';
import { PlacementScene } from '../../../../engine/scene/PlacementScene';
import { sceneLabel } from '../../../../engine/scene/sceneWords.ts';
import { arrivalAngle, gainDb, nearNull, nullAngles } from '../../../../engine/physics/polar.ts';
import { fmtAngle, fmtDb, fmtIdealPickup, isDeepNull } from '../../../../engine/model/units.ts';
import { PageSteps, type MikingStep } from '../../../../engine/steps';
import { Body, Card, Landing, Note, Point, PredictCard, ScenarioList } from '../../../../engine/kit';
import type { PageProps } from '../../../../pages/pageTypes';
import { handOf } from '../family.ts';

const NULL_TOL = 15;
const AZ_MAX = 45;
const EL_MIN = -80;
const EL_MAX = 10;
const PATTERNS: { id: PatternId; label: string; typeId: string }[] = [
  { id: 'cardioid', label: 'cardioid', typeId: 'hdDynCard' },
  { id: 'supercardioid', label: 'supercardioid', typeId: 'hdDynHyper' },
  { id: 'hypercardioid', label: 'hypercardioid', typeId: 'hdDynHyper' },
];

export function HContext({ lesson, art, answers, onAnswered, onInteractive, interactiveDone, variant }: PageProps) {
  const H = handOf(lesson);
  const rig = useRig(lesson, { variant, mics: [{ slot: 'A', typeId: 'hdDynCard', pattern: 'cardioid', pose: H.context.pose }] });
  useEffect(() => {
    if (rig.variant !== variant) rig.setVariant(variant);
  }, [variant, rig]);
  const [live, setLive] = useState(true);
  const [pattern, setPattern] = useState<PatternId>('cardioid');
  const [wedgeId, setWedgeId] = useState(lesson.live.wedges[0]?.id ?? '');
  const [view, setView] = useState<ViewId>('side');
  const [predicted, setPredicted] = useState<string | null>(null);
  const [aimed, setAimed] = useState(false);
  const [aimAxis, setAimAxis] = useState<'az' | 'el'>('el');
  const pose = rig.mics[0].pose;
  const wedge = lesson.live.wedges.find((w) => w.id === wedgeId) ?? lesson.live.wedges[0];
  // Monitors stand on the floor of the current setup.
  const floorY = rig.scene.yFloor;
  const at: Vec3 = useMemo(() => ({ x: wedge.p.x, y: floorY, z: wedge.p.z }), [wedge, floorY]);
  const src: Vec3 = useMemo(() => ({ x: at.x, y: at.y - wedge.lift, z: at.z }), [at, wedge]);
  const theta = arrivalAngle(pose, src);
  const db = gainDb(pattern, theta);
  const inNull = nearNull(pattern, theta, NULL_TOL);
  const nulls = nullAngles(pattern);
  const tried = predicted != null && aimed;
  const first = lesson.live.wedges[0]?.id;
  useEffect(() => {
    if (live && wedge.id === first && inNull && aimed && !interactiveDone.has('wedgeInNull')) onInteractive('wedgeInNull');
  }, [live, wedge.id, first, inNull, aimed, interactiveDone, onInteractive]);

  const choosePattern = (id: PatternId) => {
    setPattern(id);
    setAimed(true);
    const t = PATTERNS.find((p) => p.id === id)!.typeId;
    if (rig.mics[0].typeId !== t) rig.setType('A', t);
    rig.setPattern('A', id as MicPattern);
  };
  useEffect(() => {
    if (rig.mics[0].pattern !== pattern) rig.setPattern('A', pattern as MicPattern);
  }, [pattern, rig]);

  const a = aimAxis === 'az' ? pose.az : pose.el;
  const lo = aimAxis === 'az' ? -AZ_MAX : EL_MIN;
  const hi = aimAxis === 'az' ? AZ_MAX : EL_MAX;
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'aim',
      label: 'AIM',
      value: (a - lo) / (hi - lo),
      home: (H.context.pose.el - EL_MIN) / (EL_MAX - EL_MIN),
      onChange: (v) => {
        const ang = Math.round(lo + v * (hi - lo));
        const to: MicPose = aimAxis === 'az' ? { ...pose, az: ang } : { ...pose, el: ang };
        rig.moveTo('A', to);
        setAimed(true);
      },
      format: () => (aimAxis === 'el' ? `tilted ${a <= 0 ? 'down' : 'up'} ${fmtAngle(Math.abs(a))}` : a === 0 ? 'straight back across the head' : `${fmtAngle(Math.abs(a))} ${a > 0 ? 'right' : 'left'}`),
      formatShort: () => fmtAngle(a),
      chooser: {
        title: 'TURN THE MIC',
        selectedId: aimAxis,
        onSelect: (id) => setAimAxis(id as 'az' | 'el'),
        options: [
          { id: 'el', label: 'UP–DOWN', blurb: `Tilt the front from ${-EL_MIN}° down to ${EL_MAX}° up — it still faces the drum.` },
          { id: 'az', label: 'LEFT–RIGHT', blurb: `Swing the front up to ${AZ_MAX}° either way.` },
        ],
      },
    },
    {
      kind: 'options',
      id: 'pattern',
      label: 'PATTERN',
      valueLabel: pattern === 'cardioid' ? 'CARDIOID' : pattern === 'supercardioid' ? 'SUPER' : 'HYPER',
      selectedId: pattern,
      onSelect: (id) => choosePattern(id as PatternId),
      sticky: true,
      options: PATTERNS.map((p) => ({ id: p.id, label: p.label, blurb: `A compact dynamic with a ${p.id} pattern, drawn as a simplified shape. Its null sits at ≈ ${Math.round(nullAngles(p.id)[0])}° off the front axis.` })),
    },
    {
      kind: 'options',
      id: 'wedge',
      label: 'MONITOR',
      valueLabel: wedge.short,
      selectedId: wedge.id,
      onSelect: setWedgeId,
      sticky: true,
      options: lesson.live.wedges.map((w) => ({ id: w.id, label: w.label, blurb: w.note })),
    },
    { kind: 'toggle', id: 'scenario', label: live ? 'LIVE' : 'STUDIO', value: live, onToggle: () => setLive((x) => !x) },
    { kind: 'toggle', id: 'view', label: view === 'side' ? 'SIDE VIEW' : 'TOP VIEW', value: view === 'top', onToggle: () => setView((v) => (v === 'side' ? 'top' : 'side')) },
  ];
  const pickupCell: BezelItem = isDeepNull(db) ? { k: 'PICKUP', v: 'DEEP NULL', flex: 1.15 } : { k: 'PICKUP', v: fmtDb(db), flex: 1.15 };
  const bezel: BezelItem[] = live
    ? [
        { k: 'OFF AXIS', v: `≈ ${Math.round(theta / 5) * 5}°`, sub: 'monitor', flex: 1 },
        pickupCell,
        { k: 'NULL', v: tried ? `≈ ${Math.round(nulls[0])}°` : '?', flex: 0.8 },
        { k: 'REJECTION', v: inNull ? 'IN NULL' : 'NO', tint: inNull ? '#5bff85' : undefined, flex: 1.15 },
      ]
    : [
        { k: 'SCENARIO', v: 'STUDIO' },
        { k: 'PATTERN', v: pattern.toUpperCase() },
      ];
  const m = lesson.model.views;
  const box: ViewBox = view === 'top' ? { u0: m.top!.u0, u1: Math.max(m.top!.u1, wedge.p.x + 420), v0: Math.min(m.top!.v0, wedge.p.z - 420), v1: Math.max(m.top!.v1, wedge.p.z + 420) } : { u0: m.side!.u0, u1: Math.max(m.side!.u1, wedge.p.x + 360), v0: m.side!.v0, v1: m.side!.v1 };
  const label = sceneLabel(rig, view, ['A'], live ? `${wedge.label}, ${Math.round(theta)} degrees off the mic's front axis: ${fmtIdealPickup(db)}${inNull ? ', in the rejection region' : ''}.` : 'Studio: no monitor.');
  const pred = lesson.predictions.context;
  const studioCard = lesson.scenarios.filter((s) => s.page === 'context' && /\.studio$/.test(s.id));

  const steps: MikingStep[] = [
    {
      key: 'live',
      title: 'Aim the rejection',
      kind: 'LIVE',
      layout: 'rack',
      rack: {
        render: (w, h) => <PlacementScene rig={rig} art={art} view={view} w={w} h={h} slots={['A']} showZones={false} interactive={false} boxOverride={box} wedge={live ? { at, faces: wedge.faces, src } : null} showLabels={false} accessibilityLabel={label} />,
        badge: `A simplified pattern (white dashed: shape, not range) · the monitor where a stage often puts it · counts within ±${NULL_TOL}° of a null`,
        bezel,
        params,
        initialParam: 'aim',
      },
      well: live ? (
        <>
          {pred ? <PredictCard p={pred} value={predicted} onPick={setPredicted} /> : null}
          <Landing looking={H.context.looking} prompt={H.context.prompt} />
          <Body>{`Activity: ${interactiveDone.has('wedgeInNull') ? 'done — the wedge sat in a null by your aim or pattern' : 'not yet'}.`}</Body>
          {wedge.id !== first ? <Note tone="warn">{wedge.note}</Note> : null}
          {isDeepNull(db) ? <Note>On this simplified pattern a null looks infinitely deep. Real microphones reject far less there, and least at low frequencies. Use the null to aim, not to promise silence.</Note> : null}
          {tried ? (
            pattern === 'cardioid' ? (
              <Note tone="ok">What you just saw: a cardioid rejects most directly behind (180°). Aimed at the drum, its back points up into the air — not at a wedge on the floor in front.</Note>
            ) : (
              <Note tone="ok">{`What you just saw: a ${pattern} rejects most at ≈ ${Math.round(nulls[0])}° — toward the rear but OFF the axis — with a pickup lobe directly behind (${fmtDb(gainDb(pattern, 180))} there). With a modest tilt that off-axis null can face the wedge while the front still faces the drum.`}</Note>
            )
          ) : null}
          <Note>Real patterns change with pitch and the stage reflects sound — this is the reasoning, not a prediction. Check it at a controlled level with the system operator; never create feedback to test it.</Note>
        </>
      ) : (
        <>
          <Landing looking="Studio · no monitor" prompt="A studio session has no wedge to reject. The decision changes: what is the room worth?" />
          <ScenarioList items={studioCard} answers={answers} onAnswered={onAnswered} />
          <Note>In the studio, repeated trials are practical when the player stops. Switch back to LIVE for the monitor exercise.</Note>
        </>
      ),
    },
    {
      key: 'learn',
      title: 'Studio and live',
      kind: 'LEARN',
      layout: 'read',
      body: (
        <>
          <Body>These are scenario-based comparisons, not restrictions.</Body>
          <Card>
            {H.context.learn.map((p) => (
              <Point key={p.title} title={p.title}>
                {p.text}
              </Point>
            ))}
          </Card>
          <Note tone="warn">{H.context.closing}</Note>
        </>
      ),
    },
    {
      key: 'check',
      title: 'Check',
      kind: 'CHECK',
      layout: 'read',
      body: <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'context' && !/\.studio$/.test(s.id))} answers={answers} onAnswered={onAnswered} />,
    },
  ];
  return <PageSteps steps={steps} />;
}
