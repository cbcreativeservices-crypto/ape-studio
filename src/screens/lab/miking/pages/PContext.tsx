/**
 * Page 4 — STUDIO OR LIVE (blueprint §7 row 4; lesson L51-L69).
 *
 * LEARN (read): the lesson's studio/live comparison — scenario-based, not
 * restrictions.
 * LIVE (rack): the drum in PLAN with the mic at a documented starting point
 * and a monitor wedge on a circle around it. WEDGE ANGLE moves the wedge;
 * PATTERN picks an ideal pattern. The bezel reads the wedge's angle off the
 * mic's axis, the ideal pickup there, and whether it sits in the pattern's
 * rejection: a cardioid's null is directly behind; a supercardioid's and a
 * hypercardioid's are OFF the rear axis (L68, L97: never the rear as a
 * universal rejection zone).
 * Feedback is never provoked (L69).
 * Credit: the wedge within ±15° (illustrative tolerance) of a null of a
 * directional pattern, in the live scenario + two checks.
 */
import { useEffect, useMemo, useState } from 'react';
import type { BezelItem, DockParam } from '../../rack/rackTypes';
import type { MicPattern, PatternId, ViewBox, ViewId, Vec3 } from '../engine/model/types.ts';
import { useRig } from '../engine/scene/useRig.ts';
import { PlacementScene } from '../engine/scene/PlacementScene';
import { sceneLabel } from '../engine/scene/sceneWords.ts';
import { arrivalAngle, gainDb, nearNull, nullAngles } from '../engine/physics/polar.ts';
import { fmtDb } from '../engine/model/units.ts';
import { PageSteps, type MikingStep } from '../engine/steps';
import { Body, Card, Landing, Note, Point, ScenarioList } from '../engine/kit';
import type { PageProps } from './pageTypes';

const WEDGE_R = 700; // mm: the wedge's circle round the mic (illustrative)
const NULL_TOL = 15; // deg: "in the null" tolerance (illustrative, ruling §16.4)
const PLAN: ViewBox = { u0: -900, u1: 1050, v0: -900, v1: 900 };
const PATTERNS: { id: PatternId; label: string }[] = [
  { id: 'cardioid', label: 'cardioid (ideal)' },
  { id: 'supercardioid', label: 'supercardioid (ideal)' },
  { id: 'hypercardioid', label: 'hypercardioid (ideal)' },
];

export function PContext({ lesson, art, answers, onAnswered, onInteractive, interactiveDone, variant }: PageProps) {
  const z = lesson.zones.find((q) => q.id === (variant === 'ported' ? 'b52.near' : 'dpa.outside')) ?? lesson.zones[0];
  const typeId = z.requires?.micTypeIds?.[0] ?? lesson.micTypeIds[0];
  const rig = useRig(lesson, { variant, mics: [{ slot: 'A', typeId, pattern: 'supercardioid', pose: z.start }] });
  useEffect(() => {
    if (rig.variant !== variant) rig.setVariant(variant);
  }, [variant, rig]);
  const [live, setLive] = useState(true);
  const [phi, setPhi] = useState(60);
  const [pattern, setPattern] = useState<PatternId>('supercardioid');
  const [view, setView] = useState<ViewId>('top');
  const pose = rig.mics[0].pose;
  useEffect(() => {
    if (rig.mics[0].pattern !== pattern) rig.setPattern('A', pattern as MicPattern);
  }, [pattern, rig]);

  // The wedge on a circle round the mic, at the mic's height (a plan slice).
  const wedge: Vec3 = useMemo(() => {
    const ax = -Math.cos((pose.az * Math.PI) / 180);
    const az = Math.sin((pose.az * Math.PI) / 180);
    // +φ swings the wedge toward +z, the player's right.
    const psi = Math.atan2(az, ax) - (phi * Math.PI) / 180;
    return { x: pose.p.x + WEDGE_R * Math.cos(psi), y: pose.p.y, z: pose.p.z + WEDGE_R * Math.sin(psi) };
  }, [pose, phi]);
  const theta = arrivalAngle(pose, wedge);
  const pickup = gainDb(pattern, theta);
  const inNull = nearNull(pattern, theta, NULL_TOL);
  const nulls = nullAngles(pattern);
  useEffect(() => {
    if (live && inNull && !interactiveDone.has('wedgeInNull')) onInteractive('wedgeInNull');
  }, [live, inNull, interactiveDone, onInteractive]);

  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'wedge',
      label: 'WEDGE ANGLE',
      value: (phi + 180) / 360,
      home: 0.5,
      onChange: (v) => setPhi(Math.round(v * 360 - 180)),
      format: () => `${Math.abs(phi)}° ${phi >= 0 ? 'right' : 'left'} of the mic’s axis`,
      formatShort: () => `${phi}°`,
    },
    { kind: 'toggle', id: 'scenario', label: live ? 'LIVE' : 'STUDIO', value: live, onToggle: () => setLive((x) => !x) },
    {
      kind: 'options',
      id: 'pattern',
      label: 'PATTERN',
      valueLabel: pattern === 'cardioid' ? 'CARDIOID' : pattern === 'supercardioid' ? 'SUPER' : 'HYPER',
      selectedId: pattern,
      onSelect: (id) => setPattern(id as PatternId),
      sticky: true,
      options: PATTERNS.map((p) => ({ id: p.id, label: p.label, blurb: `Ideal null at ≈ ${Math.round(nullAngles(p.id)[0])}° off the front axis.` })),
    },
    { kind: 'toggle', id: 'view', label: view === 'side' ? 'SIDE VIEW' : 'TOP VIEW', value: view === 'top', onToggle: () => setView((v) => (v === 'side' ? 'top' : 'side')) },
  ];
  const bezel: BezelItem[] = live
    ? [
        { k: 'WEDGE OFF AXIS', v: `≈ ${Math.round(theta)}°`, flex: 1.4 },
        { k: 'PICKUP', v: fmtDb(pickup), sub: 'ideal model', flex: 1 },
        { k: 'NULL', v: `≈ ${Math.round(nulls[0])}°`, flex: 0.85 },
        { k: 'IN REJECTION', v: inNull ? 'YES' : 'NO', tint: inNull ? '#5bff85' : undefined, flex: 1.25 },
      ]
    : [
        { k: 'SCENARIO', v: 'STUDIO' },
        { k: 'PATTERN', v: pattern.toUpperCase() },
      ];
  const label = sceneLabel(rig, view, ['A'], live ? `A monitor wedge ${Math.round(theta)} degrees off the mic's front axis: ideal pickup ${fmtDb(pickup)}${inNull ? ', in the rejection region' : ''}.` : 'Studio: no wedge.');

  const steps: MikingStep[] = [
    {
      key: 'learn',
      title: 'Studio and live',
      kind: 'LEARN',
      layout: 'read',
      body: (
        <>
          <Body>These are scenario-based comparisons, not restrictions: an intact front head may be miked from outside on stage, and an internal close mic may suit a studio session (L68).</Body>
          <Card>
            <Point title="HOW MUCH ROOM">Studio: an outside or more distant perspective may help when the room contributes usefully. Live: stage spill and the available gain before feedback may favour close, directional pickup.</Point>
            <Point title="HOW MANY MICS">Studio: a second mic can offer a complementary perspective if it improves the combined sound. Live: start with the open mics actually needed — extra channels add spill and acoustic interactions.</Point>
            <Point title="WHAT THE KICK MUST DO">Studio: judge it against the bass and the kit perspective. Live: first consider the acoustic kick the audience already hears, and what the PA must add.</Point>
            <Point title="MOUNTING">Studio: repeated trials are practical when the performer stops. Live: stable, repeatable mounting and a protected cable route matter most during a show.</Point>
          </Card>
          <Note tone="warn">No kick-mic position alone prevents feedback: the monitors and PA, channel gain and EQ, the room and the open mics all matter. Never create feedback deliberately — not as an exercise, not to “find” a frequency (L69).</Note>
        </>
      ),
    },
    {
      key: 'live',
      title: 'Aim the rejection',
      kind: 'LIVE',
      layout: 'rack',
      rack: {
        render: (w, h) => (
          <PlacementScene
            rig={rig}
            art={art}
            view={view}
            w={w}
            h={h}
            slots={['A']}
            showZones={false}
            interactive={false}
            boxOverride={view === 'top' ? PLAN : undefined}
            wedge={live && view === 'top' ? wedge : null}
            showLabels={false}
            accessibilityLabel={label}
          />
        ),
        badge: `IDEAL pattern in plan · wedge at mic height · ±${NULL_TOL}° tolerance is ILLUSTRATIVE`,
        bezel,
        params,
        initialParam: 'wedge',
      },
      well: (
        <>
          <Landing looking={`the drum from above, a mic at a documented starting point (${z.label})${live ? ', and a monitor wedge round it' : ''}`} prompt={live ? 'Move WEDGE ANGLE until the wedge sits in the pattern’s rejection.' : 'Studio: no wedge. Switch to LIVE to place one.'} />
          {pattern === 'cardioid' ? (
            <Body>A cardioid rejects most directly behind the mic (180°).</Body>
          ) : (
            <Body>{`An ideal ${pattern} rejects most at ≈ ${Math.round(nulls[0])}° — toward the rear but OFF the axis — and has a pickup lobe directly behind (${fmtDb(gainDb(pattern, 180))} there). The rear is not a universal rejection zone (L97).${pattern === 'supercardioid' ? ' The Beta 52A guide gives 120° for that mic.' : ''}`}</Body>
          )}
          <Note>Check placement before the performance (Beta 52A guide). Real patterns change with frequency, and the stage reflects sound: this is the reasoning, not a prediction.</Note>
        </>
      ),
    },
    {
      key: 'check',
      title: 'Check',
      kind: 'CHECK',
      layout: 'read',
      body: <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'context')} answers={answers} onAnswered={onAnswered} />,
    },
  ];
  return <PageSteps steps={steps} />;
}
