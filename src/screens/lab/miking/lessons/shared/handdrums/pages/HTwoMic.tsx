/**
 * HAND DRUMS · TWO MICROPHONES (LESSON_JOURNEY §6 stage 6), the family's
 * version of pages/PTwoMic.tsx (its review fixes kept: the signed rear-lobe
 * polarity, no 3:1 cell on one source, the near-field depth disclosure).
 *
 * PAIR (rack): a lesson PRESET of two mics — one mic per drum, a top and a
 * bottom mic, or a coincident pair — with straight paths from a chosen source
 * (an OVERLAY). The bezel computes, from the drawing, the path difference, the
 * arrival-time difference, the first comb notch and B's polarity. The
 * simplified comb graph follows the drag live.
 * LEARN (read) → CHECK (read).
 * Credit: polarity flipped BOTH ways and a mic moved (Δt changed) in the same
 * visit + the checks.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../../../../theme/tokens';
import type { BezelItem, DockParam } from '../../../../../rack/rackTypes';
import type { MicSlot, ViewId } from '../../../../engine/model/types.ts';
import { dist } from '../../../../engine/geometry/vec.ts';
import { C20, EQUAL_PATH_MM, deltaTms, effectivePolarity, micGain, notchesHz, pathDiffMm } from '../../../../engine/physics/twoMic.ts';
import { isModelled } from '../../../../engine/physics/polar.ts';
import { fmtHz, fmtLen, fmtMs } from '../../../../engine/model/units.ts';
import { lenCell } from '../../../../engine/scene/readoutText.ts';
import { useRig } from '../../../../engine/scene/useRig.ts';
import { DualView } from '../../../../engine/scene/DualView';
import { CombPanel } from '../../../../engine/scene/CombPanel';
import { nowText, sceneLabel } from '../../../../engine/scene/sceneWords.ts';
import { placementParams, type AimAxis, type PosAxis } from '../../../../engine/scene/placementDock.ts';
import { PageSteps, type MikingStep } from '../../../../engine/steps';
import { Body, Landing, Note, NowLine, PredictCard, ScenarioList } from '../../../../engine/kit';
import type { PageProps } from '../../../../pages/pageTypes';
import { handOf, type PairSpec } from '../family.ts';

export function HTwoMic(props: PageProps) {
  const H = handOf(props.lesson);
  const [pairId, setPairId] = useState(H.pairs[0].id);
  const pair = H.pairs.find((p) => p.id === pairId) ?? H.pairs[0];
  // A preset that needs a setup (a raised drum) switches it, like a real rig.
  const { setVariant, variant } = props;
  useEffect(() => {
    if (pair.variant && pair.variant !== variant) setVariant(pair.variant);
  }, [pair, variant, setVariant]);
  return <PairPage key={pair.id} {...props} pair={pair} pairs={H.pairs} setPairId={setPairId} />;
}

function PairPage({ lesson, art, answers, onAnswered, onInteractive, interactiveDone, variant, hidden, pair, pairs, setPairId }: PageProps & { pair: PairSpec; pairs: readonly PairSpec[]; setPairId: (id: string) => void }) {
  const H = handOf(lesson);
  const model = lesson.model;
  const rig = useRig(lesson, {
    variant: pair.variant ?? variant,
    mics: [
      { slot: 'A', typeId: pair.A.typeId, pattern: pair.A.pattern, pose: pair.A.pose },
      { slot: 'B', typeId: pair.B.typeId, pattern: pair.B.pattern, pose: pair.B.pose },
    ],
  });
  useEffect(() => {
    if (rig.variant !== variant) rig.setVariant(variant);
  }, [variant, rig]);
  const [view, setView] = useState<ViewId>('side');
  const [slot, setSlot] = useState<MicSlot>('B');
  const [posAxis, setPosAxis] = useState<PosAxis>('y');
  const [aimAxis, setAimAxis] = useState<AimAxis>('el');
  const regions = model.regions.filter((r) => !r.variants || r.variants.includes(variant));
  const [srcId, setSrcId] = useState(regions.some((r) => r.id === pair.source) ? pair.source : regions[0]?.id ?? '');
  const src = (regions.find((r) => r.id === srcId) ?? regions[0]).anchor;

  const A = rig.mics.find((m) => m.slot === 'A')!;
  const B = rig.mics.find((m) => m.slot === 'B')!;
  const dMm = pathDiffMm(src, A.pose.p, B.pose.p);
  const dt = deltaTms(dMm);
  const equal = Math.abs(dMm) < EQUAL_PATH_MM;
  const gA = isModelled(A.pattern) ? micGain(A.pattern, A.pose, src) : 1000 / Math.max(1, dist(A.pose.p, src));
  const gB = isModelled(B.pattern) ? micGain(B.pattern, B.pose, src) : 1000 / Math.max(1, dist(B.pose.p, src));
  const sEff = effectivePolarity(B.polarity, gA, gB);
  const rearFlip = sEff !== B.polarity;
  const first = equal ? null : notchesHz(dt, sEff, 20000, 4)[sEff === 1 ? 0 : 1] ?? null;

  const dt0 = useRef(dt);
  const [flips, setFlips] = useState({ toInv: false, toNorm: false });
  const [predicted, setPredicted] = useState<string | null>(null);
  const moved = Math.abs(dt - dt0.current) > 0.05;
  useEffect(() => {
    if (flips.toInv && flips.toNorm && moved && !interactiveDone.has('polarityVsDelay')) onInteractive('polarityVsDelay');
  }, [flips, moved, interactiveDone, onInteractive]);

  const params: DockParam[] = [
    ...placementParams({ rig, slot, posAxis, setPosAxis, aimAxis, setAimAxis }),
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
      id: 'pair',
      label: 'PAIR',
      valueLabel: pair.label.toUpperCase().slice(0, 10),
      selectedId: pair.id,
      onSelect: setPairId,
      sticky: true,
      options: pairs.map((p) => ({ id: p.id, label: p.label, blurb: p.blurb })),
    },
    {
      kind: 'options',
      id: 'source',
      label: 'SOURCE',
      valueLabel: (regions.find((r) => r.id === srcId)?.label ?? '').toUpperCase().slice(0, 10),
      selectedId: srcId,
      onSelect: setSrcId,
      options: regions.map((r) => ({ id: r.id, label: r.label, blurb: `${r.note} Drawn as one point for the path overlay.` })),
    },
  ];
  const dCell = lenCell(dMm, true);
  const bezel: BezelItem[] = [
    { k: 'PATH Δd B−A', v: equal ? 'NONE' : dCell.v, sub: equal ? 'same path' : dCell.sub, flex: 1.35 },
    { k: 'DELAY Δt B−A', v: equal ? '0 ms' : fmtMs(dt).replace('≈ ', `≈ ${dt > 0 ? '+' : '−'}`), sub: equal ? 'no comb' : dt > 0 ? 'B later' : 'B earlier', flex: 1.35 },
    { k: '1ST NOTCH', v: equal ? 'NO COMB' : first == null ? 'OVER 20 kHz' : `≈ ${fmtHz(first)}`, flex: 1.2 },
    { k: 'POLARITY', v: `B ${B.polarity === 1 ? '+' : '−'}`, sub: rearFlip ? 'rear lobe: −' : 'switch', flex: 0.95 },
  ];
  const [wellW, setWellW] = useState(0);
  const label = useMemo(
    () => `Ideal two-mic sum, ${equal ? 'no path difference, no comb' : `path difference ${fmtLen(Math.abs(dMm))}, delay ${fmtMs(dt)}, first notch about ${first == null ? 'above 20 kHz' : fmtHz(first)}`}, mic B polarity switch ${B.polarity === 1 ? 'normal' : 'inverted'}${rearFlip ? ', but the source is in a rear lobe, so the sum behaves as inverted' : ''}.`,
    [equal, dMm, dt, first, B.polarity, rearFlip],
  );
  const labelFor = (v: ViewId) => sceneLabel(rig, v, ['A', 'B'], `Paths from the ${regions.find((r) => r.id === srcId)?.label ?? 'source'} are drawn as an overlay.`);
  const pred = lesson.predictions.twoMic;
  const flipped = flips.toInv || flips.toNorm;
  const tick = (on: boolean) => (on ? '✓' : '○');
  const steps: MikingStep[] = [
    {
      key: 'pair',
      title: 'Pair and polarity',
      kind: 'PAIR',
      layout: 'rack',
      rack: {
        render: (w, h) => <DualView rig={rig} art={art} view={view} setView={setView} w={w} h={h} slots={['A', 'B']} showZones={false} pathsFrom={src} interactive={!hidden} labelFor={labelFor} />,
        badge: `A simplified picture · dashed = straight paths · white lobe = pattern shape, not range · one point source, no reflections · c = ${C20.toFixed(1)} m/s (${Math.round(C20 / 0.3048)} ft/s), 20 °C`,
        bezel,
        params,
        initialParam: 'pos',
      },
      well: (
        <>
          {pred ? <PredictCard p={pred} value={predicted} onPick={setPredicted} /> : null}
          <Landing looking={`${pair.label} · paths from the ${regions.find((r) => r.id === srcId)?.label ?? 'source'}`} prompt="Flip B POLARITY both ways, then move a mic. Watch which readout each action changes. PAIR switches to another common pair." />
          <Text style={styles.activity} accessibilityLabel={`Activity: polarity to minus ${flips.toInv ? 'done' : 'not yet'}, back to plus ${flips.toNorm ? 'done' : 'not yet'}, mic moved ${moved ? 'done' : 'not yet'}.`}>
            {`Activity: polarity → − ${tick(flips.toInv)} · back to + ${tick(flips.toNorm)} · mic moved ${tick(moved)}`}
          </Text>
          <Body>{pair.blurb}</Body>
          <NowLine text={nowText(rig, ['A', 'B'])} />
          <View onLayout={(e) => setWellW(Math.round(e.nativeEvent.layout.width))}>{wellW > 0 ? <CombPanel rig={rig} source={src} w={wellW} h={150} label={label} /> : null}</View>
          <Body>{equal ? 'No path difference, no comb: the source reaches both mics at the same instant.' : `B hears it ${fmtMs(dt)} ${dt >= 0 ? 'after' : 'before'} A. ${sEff === 1 ? 'The sum acts as same-polarity: notches at odd multiples of 1 ÷ (2 Δt).' : 'The sum acts as inverted: a low-frequency loss and notches at whole multiples of 1 ÷ Δt.'}`}</Body>
          {rearFlip ? <Note>{`The source is in a mic’s rear lobe: a rear lobe is polarity-inverted, so the notches follow the ${sEff === 1 ? 'same-polarity' : 'inverted'} set even with the switch at ${B.polarity === 1 ? '+' : '−'}.`}</Note> : null}
          {predicted != null && flipped ? <Note tone="ok">{`You predicted “${predicted}”. Δt did not change when you flipped polarity — only moving a mic changes it. Polarity flips the sign: it moves the notches, it does not remove the delay.`}</Note> : null}
          <Note tone="warn">{H.pairWarn}</Note>
        </>
      ),
    },
    {
      key: 'learn',
      title: 'Two perspectives',
      kind: 'LEARN',
      layout: 'read',
      body: (
        <>
          {H.pairLearn.map((p, i) => (i === H.pairLearn.length - 1 ? <Note key={i}>{p}</Note> : <Body key={i}>{p}</Body>))}
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

const styles = StyleSheet.create({
  activity: { color: colors.textSecondary, fontFamily: fonts.barlowMedium, fontSize: 13.5, lineHeight: 19 },
});
