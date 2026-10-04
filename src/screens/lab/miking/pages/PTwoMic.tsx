/**
 * Page 5 — TWO MICROPHONES (blueprint §6.2, §7 row 5; lesson L70-L72).
 *
 * LEARN (read): Shure's two-mic method, and the limits — polarity is not
 * delay; 3:1 is not coherence.
 * PAIR (rack): two mics (a boundary plate inside, a kick dynamic outside
 * near the port — Shure's described pair) and straight paths from a chosen
 * source (an OVERLAY). The bezel computes, from the drawing, the path
 * difference, the arrival-time difference, the first comb notch and the 3:1
 * ratio; the IDEAL comb graph below follows the drag live.
 * CHECK (read): three scenarios, including polarity vs delay (L89).
 * Credit: polarity flipped BOTH ways and a mic moved (Δt changed) in the same
 * visit + the checks.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import type { BezelItem, DockParam } from '../../rack/rackTypes';
import type { MicSlot, ViewId } from '../engine/model/types.ts';
import type { Blocked } from '../engine/geometry/collision.ts';
import { dist } from '../engine/geometry/vec.ts';
import { C20, EQUAL_PATH_MM, deltaTms, notchesHz, pathDiffMm } from '../engine/physics/twoMic.ts';
import { threeToOneRatio } from '../engine/physics/levels.ts';
import { fmtHz, fmtLen, fmtMs } from '../engine/model/units.ts';
import { useRig } from '../engine/scene/useRig.ts';
import { DualView } from '../engine/scene/DualView';
import { CombPanel } from '../engine/scene/CombPanel';
import { nowText, sceneLabel } from '../engine/scene/sceneWords.ts';
import { placementParams, type AimAxis, type PosAxis } from '../engine/scene/placementDock.ts';
import { PageSteps, type MikingStep } from '../engine/steps';
import { Body, Landing, Note, NowLine, ScenarioList } from '../engine/kit';
import { micType } from '../data/micTypes';
import type { PageProps } from './pageTypes';

export function PTwoMic({ lesson, art, answers, onAnswered, onInteractive, interactiveDone, variant, hidden }: PageProps) {
  const model = lesson.model;
  const inside = lesson.zones.find((z) => z.id === 'b91.pillow') ?? lesson.zones[0];
  const port = model.ports.ported?.c ?? { x: model.interior.x1, y: 0, z: 0 };
  const rig = useRig(lesson, {
    variant,
    mics: [
      { slot: 'A', typeId: inside.requires?.micTypeIds?.[0] ?? 'boundaryHalf', pattern: 'halfCardioid', pose: inside.start },
      { slot: 'B', typeId: 'kickDynSuper', pattern: 'supercardioid', pose: { p: { x: port.x + 90, y: port.y, z: port.z }, az: 0, el: 0 } },
    ],
  });
  useEffect(() => {
    if (rig.variant !== variant) rig.setVariant(variant);
  }, [variant, rig]);
  const [view, setView] = useState<ViewId>('side');
  const [slot, setSlot] = useState<MicSlot>('B');
  const [posAxis, setPosAxis] = useState<PosAxis>('x');
  const [aimAxis, setAimAxis] = useState<AimAxis>('el');
  const [block, setBlock] = useState<Blocked>(null);
  const regions = model.regions.filter((r) => !r.variants || r.variants.includes(variant));
  const [srcId, setSrcId] = useState(regions[0]?.id ?? '');
  const src = (regions.find((r) => r.id === srcId) ?? regions[0]).anchor;

  const A = rig.mics.find((m) => m.slot === 'A')!;
  const B = rig.mics.find((m) => m.slot === 'B')!;
  const dMm = pathDiffMm(src, A.pose.p, B.pose.p);
  const dt = deltaTms(dMm);
  const equal = Math.abs(dMm) < EQUAL_PATH_MM;
  const first = equal ? null : notchesHz(dt, B.polarity, 20000, 4)[B.polarity === 1 ? 0 : 1] ?? null;
  const ratio = threeToOneRatio(dist(A.pose.p, B.pose.p), dist(A.pose.p, src), dist(B.pose.p, src));

  // CREDIT: polarity both ways AND a moved mic (Δt changed), one visit.
  const dt0 = useRef(dt);
  const [flips, setFlips] = useState({ toInv: false, toNorm: false });
  const moved = Math.abs(dt - dt0.current) > 0.05;
  useEffect(() => {
    if (flips.toInv && flips.toNorm && moved && !interactiveDone.has('polarityVsDelay')) onInteractive('polarityVsDelay');
  }, [flips, moved, interactiveDone, onInteractive]);

  const params: DockParam[] = [
    ...placementParams({ rig, slot, posAxis, setPosAxis, aimAxis, setAimAxis, block, setBlock }),
    { kind: 'toggle', id: 'mic', label: `EDIT MIC ${slot}`, value: slot === 'B', onToggle: () => setSlot((s) => (s === 'A' ? 'B' : 'A')) },
    {
      kind: 'toggle',
      id: 'polarity',
      label: B.polarity === 1 ? 'B POLARITY +' : 'B POLARITY −',
      value: B.polarity === -1,
      onToggle: () => {
        const next = B.polarity === 1 ? -1 : 1;
        rig.setPolarity('B', next);
        setFlips((f) => (next === -1 ? { ...f, toInv: true } : { ...f, toNorm: true }));
      },
    },
    {
      kind: 'options',
      id: 'source',
      label: 'SOURCE',
      valueLabel: (regions.find((r) => r.id === srcId)?.label ?? '').toUpperCase().slice(0, 10),
      selectedId: srcId,
      onSelect: setSrcId,
      options: regions.map((r) => ({ id: r.id, label: r.label, blurb: `${r.note} An ideal point source for the path overlay.` })),
    },
  ];
  const bezel: BezelItem[] = [
    { k: 'PATH DIFF Δd', v: equal ? 'NONE' : fmtLen(Math.abs(dMm)), flex: 1.4 },
    { k: 'DELAY Δt', v: equal ? '0 ms' : fmtMs(dt) },
    { k: '1ST NOTCH', v: equal ? 'NO COMB' : first == null ? 'OVER 20 kHz' : fmtHz(first), flex: 1.2 },
    { k: 'SPACING 3:1', v: Number.isFinite(ratio) ? `${ratio.toFixed(1)} : 1` : '—' },
  ];
  const [wellW, setWellW] = useState(0);
  const label = useMemo(
    () => `Ideal two-mic sum, ${equal ? 'no path difference, no comb' : `path difference ${fmtLen(Math.abs(dMm))}, delay ${fmtMs(dt)}, first notch ${first == null ? 'above 20 kHz' : fmtHz(first)}`}, mic B polarity ${B.polarity === 1 ? 'normal' : 'inverted'}.`,
    [equal, dMm, dt, first, B.polarity],
  );
  const labelFor = (v: ViewId) => sceneLabel(rig, v, ['A', 'B'], `Paths from the ${regions.find((r) => r.id === srcId)?.label ?? 'source'} are drawn as an overlay.`);

  const steps: MikingStep[] = [
    {
      key: 'learn',
      title: 'Two perspectives',
      kind: 'LEARN',
      layout: 'read',
      body: (
        <>
          <Body>Shure describes a boundary mic inside for an attack-related component and a kick dynamic near the port for low-frequency weight. The purpose is to blend different perspectives — not to assume two are always better. Start with each mic useful on its own (L71).</Body>
          <Body>When the second channel goes in: hear the pair at the intended levels in MONO, compare both polarity states at a controlled level, and check it with the rest of the kit. If it loses body or turns uneven, adjust position and level — or leave the second mic out (L71).</Body>
          <Note>Sound reaches two mics at different times. Summed, the delayed copy cancels where it is half a period late: comb-filter notches. Polarity inversion flips the sign — it moves the notches, it does not remove the delay (L72).</Note>
        </>
      ),
    },
    {
      key: 'pair',
      title: 'Pair and polarity',
      kind: 'PAIR',
      layout: 'rack',
      rack: {
        render: (w, h) => <DualView rig={rig} art={art} view={view} setView={setView} w={w} h={h} slots={['A', 'B']} showZones={false} pathsFrom={src} interactive={!hidden} labelFor={labelFor} />,
        badge: `IDEAL MODEL · straight paths (OVERLAY), point source, free field · c = ${C20.toFixed(1)} m/s (20 °C, the calculator’s)`,
        bezel,
        params,
        initialParam: 'pos',
      },
      well: (
        <>
          <Landing looking={`two mics on the ${model.name}, with straight paths from the ${regions.find((r) => r.id === srcId)?.label ?? 'source'}`} prompt="Move a mic: watch Δt and the notches. Flip B’s polarity both ways: the notches move, Δt does not." />
          <NowLine text={nowText(rig, ['A', 'B'])} />
          <View onLayout={(e) => setWellW(Math.round(e.nativeEvent.layout.width))}>
            {wellW > 0 ? <CombPanel rig={rig} source={src} w={wellW} h={150} label={label} /> : null}
          </View>
          <Body>{equal ? 'No path difference, no comb: the source reaches both mics at the same instant.' : `B hears it ${fmtMs(dt)} ${dt >= 0 ? 'after' : 'before'} A. ${B.polarity === 1 ? 'Same polarity: notches at odd multiples of 1 ÷ (2 Δt).' : 'B inverted: a low-frequency loss and notches at whole multiples of 1 ÷ Δt.'}`}</Body>
          <Note tone="warn">The inside and outside mics hear DIFFERENT surfaces of the drum, so this ideal graph predicts only the shared part of the sound — never what the pair will sound like. Judge the pair by ear, in mono. 3:1 is a spill guideline for mics on different sources; it does not guarantee coherence for this pair (L72).</Note>
          {micType(A.typeId).mount === 'surface' ? <Body>Mic A’s pattern is a half-cardioid boundary — not modelled; its level here follows distance only.</Body> : null}
        </>
      ),
    },
    {
      key: 'check',
      title: 'Check',
      kind: 'CHECK',
      layout: 'read',
      body: <ScenarioList items={lesson.scenarios.filter((s) => s.page === 'twoMic')} answers={answers} onAnswered={onAnswered} />,
    },
  ];
  return <PageSteps steps={steps} />;
}
