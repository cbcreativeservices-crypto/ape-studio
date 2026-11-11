/**
 * Page 5 — TWO MICROPHONES (blueprint §6.2, §7 row 5; lesson L70-L72).
 *
 * TRY BEFORE TELL (review M1): PAIR first, with a prediction about Δt;
 * LEARN after, as "what you just saw".
 * PAIR (rack): two mics (a boundary plate inside, a kick dynamic outside
 * near the port — a common pair) and straight paths from a chosen
 * source (an OVERLAY). The bezel computes, from the drawing, the path
 * difference, the arrival-time difference, the first comb notch and B's
 * polarity (with the rear-lobe sign, review M8). No 3:1 cell: both mics hear
 * ONE source (reviews M7/M11). The simplified comb graph follows the drag live.
 * LEARN (read): the two-mic idea, and the limits — polarity is not
 * delay; 3:1 is not coherence; louder is not better.
 * CHECK (read): four scenarios, including polarity vs delay (L89).
 * Credit: polarity flipped BOTH ways and a mic moved (Δt changed) in the same
 * visit + the checks.
 */
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import type { BezelItem, DockParam } from '../../rack/rackTypes';
import type { MicSlot, ViewId } from '../engine/model/types.ts';
import { dist } from '../engine/geometry/vec.ts';
import { C20, EQUAL_PATH_MM, deltaTms, effectivePolarity, micGain, notchDepthDb, notchesHz, oppositeSign, pathDiffMm, type OppositePlane } from '../engine/physics/twoMic.ts';
import { copyOf } from '../engine/model/copy.ts';
import { isModelled } from '../engine/physics/polar.ts';
import { fmtHz, fmtLen, fmtMs } from '../engine/model/units.ts';
import { lenCell } from '../engine/scene/readoutText.ts';
import { useRig } from '../engine/scene/useRig.ts';
import { DualView } from '../engine/scene/DualView';
import { CombPanel } from '../engine/scene/CombPanel';
import { nowText, sceneLabel } from '../engine/scene/sceneWords.ts';
import { placementParams, type AimAxis, type PosAxis } from '../engine/scene/placementDock.ts';
import { PageSteps, type MikingStep } from '../engine/steps';
import { Body, Landing, Note, NowLine, PredictCard, ScenarioList, useMicMoved } from '../engine/kit';
import { micType } from '../data/micTypes';
import type { PageProps } from './pageTypes';

export function PTwoMic({ lesson, art, answers, onAnswered, onInteractive, interactiveDone, variant: shared, hidden }: PageProps) {
  const model = lesson.model;
  const T = copyOf(lesson).twoMic;
  // A lesson may fix this page's drum (the toms: the floor tom's top and bottom).
  const variant = T.variant ?? shared;
  const zA = lesson.zones.find((z) => z.id === T.A.zone) ?? lesson.zones[0];
  const zB = T.B.zone ? lesson.zones.find((z) => z.id === T.B.zone) : undefined;
  const poseB = T.B.pose ?? zB?.start ?? zA.start;
  const rig = useRig(lesson, {
    variant,
    mics: [
      { slot: 'A', typeId: T.A.typeId || zA.requires?.micTypeIds?.[0] || lesson.micTypeIds[0], pattern: T.A.pattern, pose: zA.start },
      { slot: 'B', typeId: T.B.typeId || lesson.micTypeIds[0], pattern: T.B.pattern, pose: poseB, surfaceId: zB?.refSurface },
    ],
  });
  // Opposite heads (the lesson's surface): mics on either side of the drum.
  const oppSurface = T.opposite ? model.surfaces.find((s) => s.id === T.opposite!.surface) : undefined;
  const plane: OppositePlane = oppSurface ? { point: oppSurface.point, normal: oppSurface.normal } : null;
  useEffect(() => {
    if (rig.variant !== variant) rig.setVariant(variant);
  }, [variant, rig]);
  const [view, setView] = useState<ViewId>('side');
  const [slot, setSlot] = useState<MicSlot>('B');
  const [posAxis, setPosAxis] = useState<PosAxis>('x');
  const [aimAxis, setAimAxis] = useState<AimAxis>('el');
  const regions = model.regions.filter((r) => !r.variants || r.variants.includes(variant));
  const [srcId, setSrcId] = useState(regions[0]?.id ?? '');
  const src = (regions.find((r) => r.id === srcId) ?? regions[0]).anchor;

  const A = rig.mics.find((m) => m.slot === 'A')!;
  const B = rig.mics.find((m) => m.slot === 'B')!;
  const dMm = pathDiffMm(src, A.pose.p, B.pose.p);
  const dt = deltaTms(dMm);
  const equal = Math.abs(dMm) < EQUAL_PATH_MM;
  // The SIGNED pickups (review M8): a source in an ideal rear lobe arrives
  // inverted, so the notch set follows the EFFECTIVE polarity, not the switch.
  const gA = isModelled(A.pattern) ? micGain(A.pattern, A.pose, src) : 1000 / Math.max(1, dist(A.pose.p, src));
  const gB = isModelled(B.pattern) ? micGain(B.pattern, B.pose, src) : 1000 / Math.max(1, dist(B.pose.p, src));
  const side = oppositeSign(plane, A.pose.p, B.pose.p);
  const sEff = (effectivePolarity(B.polarity, gA, gB) * side) as 1 | -1;
  // Equal paths, inverted: the graph sits flat at this depth. CANCELS only where
  // it is really deep: with the levels apart the line barely drops (the coincident
  // pair's end bar, 11.2 dB apart, is 5 dB down), and the cell must not say more.
  const sumDb = notchDepthDb(gA, gB);
  const eqCell = sEff === 1 ? 'NO COMB' : sumDb <= -20 ? 'CANCELS' : 'PARTIAL';
  const partDb = Math.round(-sumDb);
  const rearFlip = sEff !== B.polarity && side === 1;
  const sideFlip = side === -1;
  const first = equal ? null : notchesHz(dt, sEff, 20000, 4)[sEff === 1 ? 0 : 1] ?? null;
  // No 3:1 readout here: both mics hear ONE source (levels.threeToOneReading
  // is null for that), and the ratio would invite "fixing" it (reviews M7/M11).

  // CREDIT: polarity both ways AND a moved mic (Δt changed), one visit.
  // Changing only the SOURCE moves no mic (owner ruling 2026-10-14, #19).
  const moved = useMicMoved(dt, srcId);
  const [flips, setFlips] = useState({ toInv: false, toNorm: false });
  const [predicted, setPredicted] = useState<string | null>(null);
  useEffect(() => {
    if (flips.toInv && flips.toNorm && moved && !interactiveDone.has('polarityVsDelay')) onInteractive('polarityVsDelay');
  }, [flips, moved, interactiveDone, onInteractive]);

  const params: DockParam[] = [
    ...placementParams({ rig, slot, posAxis, setPosAxis, aimAxis, setAimAxis }),
    { kind: 'toggle', id: 'mic', label: `EDIT MIC ${slot}`, labelLines: 2, value: slot === 'B', onToggle: () => setSlot((s) => (s === 'A' ? 'B' : 'A')) },
    // A value key, not a toggle: beside a toggle's LED this five-key dock has
    // 43 px for a line at 375 wide and 32 at 320, and POLARITY alone is 51 at
    // 12 pt, so MIC B POLARITY wrapped to "MIC B / POLARI…" and lost its sign.
    // The key reads as the bezel cell does. Not sticky: an open tray veils the
    // comb graph in the well and at 320 by 700 covers the bezel, so a pick
    // closes it and the result of the flip shows at once.
    {
      kind: 'options',
      id: 'polarity',
      label: 'POLARITY',
      valueLabel: `MIC B ${B.polarity === 1 ? '+' : '−'}`,
      valueA11y: B.polarity === 1 ? 'MIC B POLARITY +' : 'MIC B POLARITY −',
      selectedId: B.polarity === 1 ? 'normal' : 'inverted',
      onSelect: (id) => {
        const next = id === 'inverted' ? -1 : 1;
        if (next === B.polarity) return;
        rig.setPolarity('B', next);
        setFlips((f) => (next === -1 ? { ...f, toInv: true } : { ...f, toNorm: true }));
      },
      options: [
        { id: 'normal', label: '+ NORMAL', blurb: 'Mic B’s signal passes as wired.' },
        { id: 'inverted', label: '− INVERTED', blurb: 'Mic B’s signal is turned upside down. Δt does not change.' },
      ],
    },
    {
      kind: 'options',
      id: 'source',
      label: 'SOURCE',
      valueLabel: (regions.find((r) => r.id === srcId)?.label ?? '').toUpperCase().slice(0, 10),
      selectedId: srcId,
      onSelect: setSrcId,
      options: regions.map((r) => ({ id: r.id, label: r.label, blurb: `${r.note} Treated as one point when the paths are drawn.` })),
    },
  ];
  // Δd and Δt are B MINUS A (twoMic.ts: Δd = |S − B| − |S − A|), signed, so
  // the cell names both mics and never reads as one mic's distance.
  const dCell = lenCell(dMm, true);
  const bezel: BezelItem[] = [
    { k: 'PATH Δd B−A', v: equal ? 'NONE' : dCell.v, sub: equal ? 'same path' : dCell.sub, flex: 1.35 },
    { k: 'DELAY Δt B−A', v: equal ? '0 ms' : fmtMs(dt).replace('≈ ', `≈ ${dt > 0 ? '+' : '−'}`), sub: equal ? eqCell.toLowerCase() : dt > 0 ? 'B later' : 'B earlier', flex: 1.35 },
    { k: '1ST NOTCH', v: equal ? eqCell : first == null ? 'OVER 20 kHz' : `≈ ${fmtHz(first)}`, flex: 1.2 },
    { k: 'POLARITY', v: `MIC B ${B.polarity === 1 ? '+' : '−'}`, sub: sideFlip ? 'heads: −' : rearFlip ? 'rear lobe: −' : 'switch', flex: 0.95 },
  ];
  const [wellW, setWellW] = useState(0);
  const label = useMemo(
    () => `Ideal two-mic sum, ${equal ? (sEff === 1 ? 'no path difference, no comb' : eqCell === 'CANCELS' ? 'no path difference, and the sum acts as inverted, so the source cancels' : `no path difference, and the sum acts as inverted, so the source partly cancels, about ${partDb} dB down`) : `path difference ${fmtLen(Math.abs(dMm))}, delay ${fmtMs(dt)}, first notch about ${first == null ? 'above 20 kHz' : fmtHz(first)}`}, mic B’s channel polarity ${B.polarity === 1 ? 'normal' : 'inverted'}${sideFlip ? ', and the mics face opposite heads, so the sum behaves as ' + (sEff === 1 ? 'same-polarity' : 'inverted') : rearFlip ? ', but the source is in a rear lobe, so the sum behaves as ' + (sEff === 1 ? 'same-polarity' : 'inverted') : ''}.`,
    [equal, dMm, dt, first, B.polarity, rearFlip, sideFlip, sEff, eqCell, partDb],
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
        render: (w, h) => <DualView rig={rig} art={art} view={view} setView={setView} w={w} h={h} slots={['A', 'B']} showZones={false} pathsFrom={src} editing={slot} interactive={!hidden} labelFor={labelFor} />,
        badge: `Simplified · big amber ring = the mic the keys move · dashed = straight paths · white lobe = pattern shape, not range · one point source, no reflections · speed of sound ${C20.toFixed(1)} m/s (${Math.round(C20 / 0.3048)} ft/s) at 20 °C`,
        bezel,
        params,
        initialParam: 'pos',
      },
      well: (
        <>
          {pred ? <PredictCard p={pred} value={predicted} onPick={setPredicted} /> : null}
          <Landing looking={`Two mics · paths from the ${regions.find((r) => r.id === srcId)?.label ?? 'source'}`} prompt="Use the POLARITY key to flip MIC B both ways, then move a mic. Watch which readout each action changes." />
          <Text style={styles.activity} accessibilityLabel={`Activity: polarity to minus ${flips.toInv ? 'done' : 'not yet'}, back to plus ${flips.toNorm ? 'done' : 'not yet'}, mic moved ${moved ? 'done' : 'not yet'}.`}>
            {`Activity: polarity → − ${tick(flips.toInv)} · back to + ${tick(flips.toNorm)} · mic moved ${tick(moved)}`}
          </Text>
          <NowLine text={nowText(rig, ['A', 'B'])} />
          <View onLayout={(e) => setWellW(Math.round(e.nativeEvent.layout.width))}>
            {wellW > 0 ? <CombPanel rig={rig} source={src} w={wellW} h={150} label={label} opposite={plane} /> : null}
          </View>
          <Body>{equal ? (sEff === -1 ? `No path difference, but the sum acts as inverted: the source reaches both mics at the same instant in opposite polarity, ${eqCell === 'CANCELS' ? 'so it cancels at every frequency, as far as the two levels match' : `and its levels in the two mics differ, so it only partly cancels: about ${partDb} dB down at every frequency`}.` : 'No path difference, no comb: the source reaches both mics at the same instant.') : `Mic B hears it ${fmtMs(dt)} ${dt >= 0 ? 'after' : 'before'} mic A. ${sEff === 1 ? 'The sum acts as same-polarity: notches at odd multiples of 1 ÷ (2 Δt).' : 'The sum acts as inverted: a low-frequency loss and notches at whole multiples of 1 ÷ Δt.'}`}</Body>
          {sideFlip && T.opposite ? <Note>{T.opposite.note}</Note> : null}
          {rearFlip ? <Note>{`The source is in a mic’s rear lobe: a rear lobe is polarity-inverted, so ${equal ? 'the sum acts as' : 'the notches follow the'} ${sEff === 1 ? 'same-polarity' : 'inverted'}${equal ? '' : ' set'} even with the switch at ${B.polarity === 1 ? '+' : '−'}.`}</Note> : null}
          {predicted != null && flipped ? <Note tone="ok">{`You predicted “${predicted}”. Δt did not change when you flipped polarity — only moving a mic changes it. Polarity flips the sign: the notches and peaks swap places, but the delay stays.`}</Note> : null}
          <Note tone="warn">{T.warn}</Note>
          {micType(A.typeId).mount === 'surface' ? <Body>Mic A is a half-cardioid boundary mic; its pattern isn’t included here, so its level follows distance only.</Body> : null}
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
          {T.learn.map((t) => (
            <Body key={t.slice(0, 24)}>{t}</Body>
          ))}
          <Note>What you just saw: sound reaches two mics at different times. Summed, the delayed copy cancels at each frequency where it is half a period late, or 1½, 2½ … periods late: comb-filter notches. Polarity inversion flips the sign — the notches and peaks swap places, and the lows thin out; it does not remove the delay. 0 dB on the graph is the two arrivals in step: at equal level that is 6 dB above either mic alone, so a comb both lifts and cuts.</Note>
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
