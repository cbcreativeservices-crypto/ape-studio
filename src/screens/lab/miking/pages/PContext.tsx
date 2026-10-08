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
import { copyOf } from '../engine/model/copy.ts';
import { viewToggle } from '../engine/scene/viewToggle.ts';

const NULL_TOL = 15; // deg: "in the null" tolerance (the lab's, ruling §16.4)

export function PContext({ lesson, art, answers, onAnswered, onInteractive, interactiveDone, variant: shared }: PageProps) {
  const C = copyOf(lesson);
  const X = C.context;
  // A lesson may fix this page's drum (the toms: the rack pair under a crash).
  const variant = X.variant ?? shared;
  const AZ_MAX = X.azMax; // deg: the mic still faces its head
  const EL_MAX = X.elMax;
  const PLAN: ViewBox = X.plan;
  const SIDE: ViewBox = X.side;
  const PATTERNS = X.patterns;
  /** The drum parts that shield a mic (its shell and heads). */
  const DRUM_PARTS = X.shield;
  const z = lesson.zones.find((q) => q.id === X.zone) ?? lesson.zones[0];
  const startPattern: PatternId = PATTERNS.find((p) => p.typeId === X.typeId)?.id ?? 'supercardioid';
  const rig = useRig(lesson, { variant, mics: [{ slot: 'A', typeId: X.typeId, pattern: startPattern, pose: z.start }] });
  useEffect(() => {
    if (rig.variant !== variant) rig.setVariant(variant);
  }, [variant, rig]);
  const [live, setLive] = useState(true);
  const [pattern, setPattern] = useState<PatternId>(startPattern);
  const [wedgeId, setWedgeId] = useState(lesson.live.wedges.find((w) => w.id === X.target)?.id ?? lesson.live.wedges[0]?.id ?? '');
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
    if (live && wedge.id === X.target && inNull && !shield && aimed && !interactiveDone.has('wedgeInNull')) onInteractive('wedgeInNull');
  }, [live, wedge.id, X.target, inNull, shield, aimed, interactiveDone, onInteractive]);

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

  // The fader turns the mic about its starting aim (the kick's starts at 0, 0).
  const a0 = aimAxis === 'az' ? z.start.az : z.start.el;
  const a = Math.round((aimAxis === 'az' ? pose.az : pose.el) - a0);
  const lim = aimAxis === 'az' ? AZ_MAX : EL_MAX;
  const params: DockParam[] = [
    {
      kind: 'fader',
      id: 'aim',
      label: 'AIM',
      value: (a + lim) / (2 * lim),
      home: 0.5,
      // Preview while the finger rides the lane, commit on release (the
      // engine's fader contract, 2026-10-06: no page re-render per move).
      onChange: (v) => {
        const ang = a0 + Math.round((v * 2 - 1) * lim);
        const to: MicPose = aimAxis === 'az' ? { ...pose, az: ang } : { ...pose, el: ang };
        rig.preview('A', to);
      },
      onCommit: () => {
        rig.commit('A');
        setAimed(true);
      },
      // Short: the lane prints this beside its label.
      format: (v) => {
        const x = Math.round((v * 2 - 1) * lim);
        return x === 0 ? C.words.facing : `${fmtAngle(Math.abs(x))} ${aimAxis === 'az' ? (x > 0 ? 'right' : 'left') : x > 0 ? 'up' : 'down'}`;
      },
      formatShort: () => fmtAngle(a),
      chooser: {
        title: 'TURN THE MIC',
        selectedId: aimAxis,
        onSelect: (id) => setAimAxis(id as 'az' | 'el'),
        options: [
          { id: 'az', label: 'LEFT–RIGHT', blurb: X.aimBlurb },
          { id: 'el', label: 'UP–DOWN', blurb: `Tilt the front up to ${EL_MAX}° up or down.` },
        ],
      },
    },
    {
      kind: 'options',
      id: 'pattern',
      label: 'PATTERN',
      // Lab 7b group 1: figure-8 and omni patterns on this page (a lip ribbon,
      // an interview omni) — each named, and an omni's "no null" said.
      valueLabel: pattern === 'cardioid' ? 'CARDIOID' : pattern === 'supercardioid' ? 'SUPER' : pattern === 'figure8' ? 'FIGURE-8' : pattern === 'omni' ? 'OMNI' : 'HYPER',
      selectedId: pattern,
      onSelect: (id) => choosePattern(id as PatternId),
      sticky: true,
      options: PATTERNS.map((p) => ({ id: p.id, label: p.label, blurb: nullAngles(p.id).length ? `${X.micNoun} with a ${p.id} pattern, drawn as a simplified shape. Its null sits at ≈ ${Math.round(nullAngles(p.id)[0])}° off the front axis.` : `${X.micNoun} with an ${p.id} pattern: it hears every direction about equally — it has no null to aim.` })),
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
    ...viewToggle({ view: view, setView: setView, stage: 'single' }),
  ];

  const pickupCell: BezelItem = shield
    ? { k: 'PICKUP', v: 'SHIELDED', sub: C.words.shield, flex: 1.15 }
    : isDeepNull(db)
      ? { k: 'PICKUP', v: 'DEEP NULL', flex: 1.15 }
      : { k: 'PICKUP', v: fmtDb(db), flex: 1.15 };
  const bezel: BezelItem[] = live
    ? [
        { k: 'OFF AXIS', v: `≈ ${Math.round(theta / 5) * 5}°`, sub: wedge.glyph === 'none' ? wedge.short.toLowerCase() : X.targetWord, flex: 1 },
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
  const studioCard = lesson.scenarios.filter((s) => s.id === X.studioId);

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
            wedge={live ? { at: wedge.p, faces: wedge.faces, src, glyph: wedge.glyph } : null}
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
          <Landing looking={`${X.looking} · ${wedge.short.toLowerCase()}`} prompt={X.prompt} />
          <Body>{`Activity: ${interactiveDone.has('wedgeInNull') ? X.activityDone : 'not yet'}.`}</Body>
          {shield ? (
            <Note tone="warn">{`The ${shield.label} lies between this mic and the ${wedge.short.toLowerCase()}. ${wedge.note} The free-field pattern ignores that shielding, so no pickup number is shown.`}</Note>
          ) : X.frontIds.includes(wedge.id) ? (
            <Note tone="warn">{wedge.note}</Note>
          ) : null}
          {isDeepNull(db) && !shield ? <Note>{X.deepNull}</Note> : null}
          {tried ? (
            pattern === 'cardioid' ? (
              <Note tone="ok">{X.cardioidReveal}</Note>
            ) : (
              <Note tone="ok">{`What you just saw: a ${pattern} rejects most at ≈ ${Math.round(nulls[0])}° — toward the rear but OFF the axis — and has a pickup lobe directly behind (${fmtDb(gainDb(pattern, 180))} there). The rear is not a universal rejection zone.`}</Note>
            )
          ) : null}
          <Note>{X.shieldNote}</Note>
        </>
      ) : (
        <>
          <Landing looking="Studio · no monitor" prompt={X.studioPrompt} />
          <ScenarioList items={studioCard} answers={answers} onAnswered={onAnswered} />
          <Note>{X.studioNote}</Note>
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
          <Body>{X.learn.intro}</Body>
          <Card>
            {X.learn.points.map((p) => (
              <Point key={p.title} title={p.title}>
                {p.text}
              </Point>
            ))}
          </Card>
          {X.learn.body ? <Body>{X.learn.body}</Body> : null}
          <Note tone="warn">{X.learn.warn}</Note>
        </>
      ),
    },
    {
      key: 'check',
      title: 'Check',
      kind: 'CHECK',
      layout: 'read',
      body: <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'context' && s.id !== X.studioId)} answers={answers} onAnswered={onAnswered} />,
    },
  ];
  return <PageSteps steps={steps} />;
}
