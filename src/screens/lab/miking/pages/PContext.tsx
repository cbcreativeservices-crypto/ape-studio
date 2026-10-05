/**
 * Page 4 — STUDIO OR LIVE (blueprint §7 row 4; lesson L51-L69).
 *
 * REBUILT 2026-10-04 (reviews: audio M2, cognitive M1/M7/M8):
 *   • the MONITORS stay where a stage puts them (typical positions); the
 *     learner AIMS THE MIC (left–right, up–down) and picks its PATTERN — "aim
 *     nulls according to the actual pattern" (L68). Moving the monitor round
 *     the mic taught the opposite move.
 *   • The mic is OUTSIDE the front head (the "just outside" starting point),
 *     where free-field reasoning is defensible. The downstage wedge faces the
 *     mic's rear: a null can help. The drummer's own fill sits in FRONT of the
 *     mic: no null reaches it, and the drum itself lies in that path — the
 *     readout says so (solidOnPath) instead of printing a free-field number.
 *   • A null never prints a number: "deep null" (M3/M8).
 *   • STUDIO is a real activity: the decision card for the studio column.
 *   • Try before tell: a prediction first; the NULL cell reads "?" until the
 *     learner has predicted and turned the mic; the explanation follows.
 * Feedback is never provoked (L69).
 * Credit: the downstage wedge within ±15° (illustrative tolerance) of a null
 * BY THE LEARNER'S AIM OR PATTERN, in LIVE + the studio card + two checks.
 */
import { useEffect, useMemo, useState } from 'react';
import type { BezelItem, DockParam } from '../../rack/rackTypes';
import type { MicPattern, MicPose, PatternId, ViewBox, ViewId, Vec3 } from '../engine/model/types.ts';
import { useRig } from '../engine/scene/useRig.ts';
import { PlacementScene } from '../engine/scene/PlacementScene';
import { sceneLabel } from '../engine/scene/sceneWords.ts';
import { solidOnPath } from '../engine/geometry/collision.ts';
import { arrivalAngle, gainDb, nearNull, nullAngles } from '../engine/physics/polar.ts';
import { fmtAngle, fmtDb, fmtIdealPickup, isDeepNull } from '../engine/model/units.ts';
import { PageSteps, type MikingStep } from '../engine/steps';
import { Body, Card, Landing, Note, Point, PredictCard, ScenarioList } from '../engine/kit';
import type { PageProps } from './pageTypes';

const NULL_TOL = 15; // deg: "in the null" tolerance (the lab's, ruling §16.4)
const AZ_MAX = 45; // deg: the mic still faces the front head
const EL_MAX = 30;
const PLAN: ViewBox = { u0: -800, u1: 1650, v0: -780, v1: 1060 };
const SIDE: ViewBox = { u0: -750, u1: 1650, v0: -420, v1: 330 };
const PATTERNS: { id: PatternId; label: string; typeId: string }[] = [
  { id: 'cardioid', label: 'cardioid', typeId: 'kickDynCard' },
  { id: 'supercardioid', label: 'supercardioid', typeId: 'kickDynSuper' },
  { id: 'hypercardioid', label: 'hypercardioid', typeId: 'kickDynSuper' },
];
/** The drum parts that shield a mic (the shell and both heads). */
const DRUM_PARTS = ['kick.shell', 'kick.batter', 'kick.reso', 'kick.resoPorted'] as const;

export function PContext({ lesson, art, answers, onAnswered, onInteractive, interactiveDone, variant }: PageProps) {
  const z = lesson.zones.find((q) => q.id === 'out.edge') ?? lesson.zones[0];
  const rig = useRig(lesson, { variant, mics: [{ slot: 'A', typeId: 'kickDynSuper', pattern: 'supercardioid', pose: z.start }] });
  useEffect(() => {
    if (rig.variant !== variant) rig.setVariant(variant);
  }, [variant, rig]);
  const [live, setLive] = useState(true);
  const [pattern, setPattern] = useState<PatternId>('supercardioid');
  const [wedgeId, setWedgeId] = useState(lesson.live.wedges[0]?.id ?? '');
  const [view, setView] = useState<ViewId>('top');
  const [aimAxis, setAimAxis] = useState<'az' | 'el'>('az');
  const [predicted, setPredicted] = useState<string | null>(null);
  const [aimed, setAimed] = useState(false);
  const pose = rig.mics[0].pose;
  const wedge = lesson.live.wedges.find((w) => w.id === wedgeId) ?? lesson.live.wedges[0];
  const src: Vec3 = useMemo(() => ({ x: wedge.p.x, y: wedge.p.y - wedge.lift, z: wedge.p.z }), [wedge]);

  const theta = arrivalAngle(pose, src);
  const db = gainDb(pattern, theta);
  const inNull = nearNull(pattern, theta, NULL_TOL);
  const nulls = nullAngles(pattern);
  const shield = useMemo(() => solidOnPath(rig.scene, pose.p, src, DRUM_PARTS), [rig.scene, pose.p, src]);
  const tried = predicted != null && aimed;
  useEffect(() => {
    if (live && wedge.id === 'downstage' && inNull && aimed && !interactiveDone.has('wedgeInNull')) onInteractive('wedgeInNull');
  }, [live, wedge.id, inNull, aimed, interactiveDone, onInteractive]);

  const choosePattern = (id: PatternId) => {
    setPattern(id);
    setAimed(true);
    const t = PATTERNS.find((p) => p.id === id)!.typeId;
    if (rig.mics[0].typeId !== t) rig.setType('A', t);
    rig.setPattern('A', id as MicPattern);
  };
  // setType resets the pattern to the type's own: keep the chosen ideal one.
  useEffect(() => {
    if (rig.mics[0].pattern !== pattern) rig.setPattern('A', pattern as MicPattern);
  }, [pattern, rig]);

  const a = aimAxis === 'az' ? pose.az : pose.el;
  const lim = aimAxis === 'az' ? AZ_MAX : EL_MAX;
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'aim',
      label: 'AIM',
      value: (a + lim) / (2 * lim),
      home: 0.5,
      onChange: (v) => {
        const ang = Math.round((v * 2 - 1) * lim);
        const to: MicPose = aimAxis === 'az' ? { ...pose, az: ang } : { ...pose, el: ang };
        rig.moveTo('A', to);
        setAimed(true);
      },
      // Short: the lane prints this beside its label.
      format: () => (a === 0 ? 'facing the head' : `${fmtAngle(Math.abs(a))} ${aimAxis === 'az' ? (a > 0 ? 'right' : 'left') : a > 0 ? 'up' : 'down'}`),
      formatShort: () => fmtAngle(a),
      chooser: {
        title: 'TURN THE MIC',
        selectedId: aimAxis,
        onSelect: (id) => setAimAxis(id as 'az' | 'el'),
        options: [
          { id: 'az', label: 'LEFT–RIGHT', blurb: `Swing the front up to ${AZ_MAX}° either way — it still faces the front head.` },
          { id: 'el', label: 'UP–DOWN', blurb: `Tilt the front up to ${EL_MAX}° up or down.` },
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
      options: PATTERNS.map((p) => ({ id: p.id, label: p.label, blurb: `A kick dynamic with a ${p.id} pattern, drawn as a simplified shape. Its null sits at ≈ ${Math.round(nullAngles(p.id)[0])}° off the front axis.` })),
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

  const pickupCell: BezelItem = shield
    ? { k: 'PICKUP', v: 'SHIELDED', sub: 'drum in path', flex: 1.15 }
    : isDeepNull(db)
      ? { k: 'PICKUP', v: 'DEEP NULL', flex: 1.15 }
      : { k: 'PICKUP', v: fmtDb(db), flex: 1.15 };
  const bezel: BezelItem[] = live
    ? [
        { k: 'OFF AXIS', v: `≈ ${Math.round(theta / 5) * 5}°`, sub: 'monitor', flex: 1 },
        pickupCell,
        { k: 'NULL', v: tried ? `≈ ${Math.round(nulls[0])}°` : '?', flex: 0.8 },
        { k: 'REJECTION', v: inNull && !shield ? 'IN NULL' : 'NO', tint: inNull && !shield ? '#5bff85' : undefined, flex: 1.15 },
      ]
    : [
        { k: 'SCENARIO', v: 'STUDIO' },
        { k: 'PATTERN', v: pattern.toUpperCase() },
      ];
  const label = sceneLabel(
    rig,
    view,
    ['A'],
    live
      ? `${wedge.label}, ${Math.round(theta)} degrees off the mic's front axis: ${shield ? `the ${shield.label} lies in the path, which this free-field model ignores` : fmtIdealPickup(db)}${inNull && !shield ? ', in the rejection region' : ''}.`
      : 'Studio: no monitor.',
  );
  const pred = lesson.predictions.context;
  const studioCard = lesson.scenarios.filter((s) => s.id === 'k.ctx.studio');

  const steps: MikingStep[] = [
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
            boxOverride={view === 'top' ? PLAN : SIDE}
            wedge={live ? { at: wedge.p, faces: wedge.faces, src } : null}
            showLabels={false}
            accessibilityLabel={label}
          />
        ),
        badge: `A simplified pattern (white dashed: shape, not range) · monitors where a stage often puts them · counts within ±${NULL_TOL}° of a null`,
        bezel,
        params,
        initialParam: 'aim',
      },
      well: live ? (
        <>
          {pred ? <PredictCard p={pred} value={predicted} onPick={setPredicted} /> : null}
          <Landing looking={`Top view · mic just outside the front head · ${wedge.short.toLowerCase()}`} prompt="The monitor stays where the stage needs it. Turn the MIC (AIM) or change its PATTERN until the downstage wedge sits in the rejection." />
          <Body>{`Activity: ${interactiveDone.has('wedgeInNull') ? 'done — the downstage wedge sat in a null by your aim or pattern' : 'not yet'}.`}</Body>
          {shield ? (
            <Note tone="warn">{`The ${shield.label} lies between this mic and the ${wedge.short.toLowerCase()}. ${wedge.note} The free-field pattern ignores that shielding, so no pickup number is shown.`}</Note>
          ) : wedge.id === 'fill' ? (
            <Note tone="warn">{wedge.note}</Note>
          ) : null}
          {isDeepNull(db) && !shield ? <Note>On this simplified pattern a null looks infinitely deep. Real microphones reject far less there, and least at low frequencies — where kick feedback lives. Use the null to aim, not to promise silence.</Note> : null}
          {tried ? (
            pattern === 'cardioid' ? (
              <Note tone="ok">{`What you just saw: a cardioid rejects most directly behind (180°). The downstage wedge sits below the mic too, so with a cardioid only a tilt brings it near the null.`}</Note>
            ) : (
              <Note tone="ok">{`What you just saw: a ${pattern} rejects most at ≈ ${Math.round(nulls[0])}° — toward the rear but OFF the axis — and has a pickup lobe directly behind (${fmtDb(gainDb(pattern, 180))} there). The rear is not a universal rejection zone.`}</Note>
            )
          ) : null}
          <Note>A mic INSIDE the drum is also shielded by the shell and both heads, which a free-field pattern ignores. Check placement before the performance; real patterns change with pitch and the stage reflects sound — this is the reasoning, not a prediction.</Note>
        </>
      ) : (
        <>
          <Landing looking="Studio · no monitor" prompt="A studio session has no wedge to reject. The decision changes: what is the room worth?" />
          <ScenarioList items={studioCard} answers={answers} onAnswered={onAnswered} />
          <Note>In the studio, repeated trials are practical when the performer stops; a second mic can offer a complementary perspective if it improves the combined sound. Switch back to LIVE for the monitor exercise.</Note>
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
          <Body>These are scenario-based comparisons, not restrictions: an intact front head may be miked from outside on stage, and an internal close mic may suit a studio session.</Body>
          <Card>
            <Point title="HOW MUCH ROOM">Studio: an outside or more distant perspective may help when the room contributes usefully. Live: stage spill and the available gain before feedback may favour close, directional pickup.</Point>
            <Point title="HOW MANY MICS">Studio: a second mic can offer a complementary perspective if it improves the combined sound. Live: start with the open mics actually needed — extra channels add spill and acoustic interactions.</Point>
            <Point title="WHAT THE KICK NEEDS TO DO">Studio: judge it against the bass and the kit perspective. Live: first consider the acoustic kick the audience already hears, and what the PA needs to add.</Point>
            <Point title="MOUNTING">Studio: repeated trials are practical when the performer stops. Live: stable, repeatable mounting and a protected cable route matter most during a show.</Point>
          </Card>
          <Body>On a real stage the monitors stay where the players need them: you turn the mic or choose its pattern so that a null faces a loud unwanted source. A drummer’s own fill usually sits in front of a kick mic aimed at the drum, where no pattern rejects; the drum itself shields an inside mic.</Body>
          <Note tone="warn">No kick-mic position alone prevents feedback: the monitors and PA, channel gain and EQ, the room and the open mics all matter. Never create feedback deliberately — not as an exercise, not to “find” a frequency.</Note>
        </>
      ),
    },
    {
      key: 'check',
      title: 'Check',
      kind: 'CHECK',
      layout: 'read',
      body: <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'context' && s.id !== 'k.ctx.studio')} answers={answers} onAnswered={onAnswered} />,
    },
  ];
  return <PageSteps steps={steps} />;
}
