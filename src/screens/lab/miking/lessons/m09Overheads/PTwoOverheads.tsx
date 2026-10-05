/**
 * M09 — TWO OVERHEADS (the journey's stage 6, `twoMic`): the two-mic physics
 * of the engine (arrival time → comb, polarity vs delay) applied to a pair
 * over the kit.
 *
 *   EQUAL SNARE DISTANCE (rack)  the floor-tom method's two mics, both 40 in
 *       from the snare's centre. The SNARE-DISTANCE AID reads each mic's
 *       distance to the snare and to the kick (the bezel: their differences
 *       as arrival times); the comb follows the chosen source. Activity: move
 *       a mic so the snare distances differ, bring them level again, and look
 *       at the kick as a source — equal for the snare is not equal for all.
 *   STEREO PAIRS (rack)  X/Y (90°–135°), ORTF (17 cm, 110°), a spaced pair
 *       (each 4 ft from the snare), the floor-tom method, the shoulder method
 *       (32 in) and Mid-Side, drawn over the kit with the time difference each
 *       pair gives a source.
 *   WHAT EQUAL DISTANCE CANNOT DO (read), then the CHECK.
 * Credit: the activity + the four checks. Silent; simplified (said once).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../../theme/tokens';
import type { BezelItem, DockParam } from '../../../rack/rackTypes';
import type { MicSlot, ViewId } from '../../engine/model/types.ts';
import { dist } from '../../engine/geometry/vec.ts';
import { C20, EQUAL_PATH_MM, deltaTms, effectivePolarity, micGain, notchesHz, pathDiffMm } from '../../engine/physics/twoMic.ts';
import { isModelled } from '../../engine/physics/polar.ts';
import { fmtHz, fmtLen, fmtMs } from '../../engine/model/units.ts';
import { copyOf } from '../../engine/model/copy.ts';
import { useRig } from '../../engine/scene/useRig.ts';
import { DualView } from '../../engine/scene/DualView';
import { CombPanel } from '../../engine/scene/CombPanel';
import { nowText, sceneLabel } from '../../engine/scene/sceneWords.ts';
import { placementParams, type AimAxis, type PosAxis } from '../../engine/scene/placementDock.ts';
import { PageSteps, type MikingStep } from '../../engine/steps';
import { Body, Card, Landing, Note, NowLine, Point, PredictCard, ScenarioList } from '../../engine/kit';
import type { PageProps } from '../../pages/pageTypes';
import { O, S0 } from '../shared/kitScene/kitSceneModel.ts';
import { KIT_PLACED_CYMBALS } from '../shared/cymbals/cymbalSpec.ts';
import { M09_VIEWS } from './geometry.ts';
import { PAIRS_WORDS, TWO_WORDS } from './copyPairs.ts';
import { PairsScene } from './PairsScene';
import { PAIR_IDS, includedAngle, pairOf, pathDiff, shoulderClearance, snareKick, spacing, type PairId } from './pairs.ts';

/** A signed arrival difference for a bezel cell ("+0.35 ms"); the cell's
 *  sub line carries the distance, so the value stays short enough to keep
 *  its key (D36). */
const signedMs = (mm: number) => (Math.abs(mm) < Math.max(EQUAL_PATH_MM, 2.5) ? '0 ms' : fmtMs(deltaTms(mm)).replace('≈ ', mm > 0 ? '+' : '−'));

export function PTwoOverheads({ lesson, art, answers, onAnswered, onInteractive, interactiveDone, hidden }: PageProps) {
  const model = lesson.model;
  const T = copyOf(lesson).twoMic;
  const variant = T.variant ?? model.defaultVariant;
  const zA = lesson.zones.find((z) => z.id === T.A.zone)!;
  const zB = lesson.zones.find((z) => z.id === T.B.zone)!;
  const rig = useRig(lesson, {
    variant,
    mics: [
      { slot: 'A', typeId: T.A.typeId, pattern: T.A.pattern, pose: zA.start },
      { slot: 'B', typeId: T.B.typeId, pattern: T.B.pattern, pose: zB.start },
    ],
  });
  const [view, setView] = useState<ViewId>('side');
  const [slot, setSlot] = useState<MicSlot>('B');
  const [posAxis, setPosAxis] = useState<PosAxis>('z');
  const [aimAxis, setAimAxis] = useState<AimAxis>('el');
  const regions = model.regions;
  const [srcId, setSrcId] = useState('src.snare');
  const srcRegion = regions.find((r) => r.id === srcId) ?? regions[0];
  const src = srcRegion.anchor;
  const A = rig.mics.find((m) => m.slot === 'A')!;
  const B = rig.mics.find((m) => m.slot === 'B')!;

  // The SNARE-DISTANCE AID: each mic's distance to the snare and to the kick.
  const sA = dist(A.pose.p, S0);
  const sB = dist(B.pose.p, S0);
  const kA = dist(A.pose.p, O);
  const kB = dist(B.pose.p, O);
  const dSnare = sB - sA;
  const dKick = kB - kA;
  const dMm = pathDiffMm(src, A.pose.p, B.pose.p);
  const dt = deltaTms(dMm);
  const equal = Math.abs(dMm) < EQUAL_PATH_MM;
  const gA = isModelled(A.pattern) ? micGain(A.pattern, A.pose, src) : 1000 / Math.max(1, dist(A.pose.p, src));
  const gB = isModelled(B.pattern) ? micGain(B.pattern, B.pose, src) : 1000 / Math.max(1, dist(B.pose.p, src));
  const sEff = effectivePolarity(B.polarity, gA, gB);
  const first = equal ? null : notchesHz(dt, sEff, 20000, 4)[sEff === 1 ? 0 : 1] ?? null;

  // ACTIVITY: snare distances pulled apart (> 25 mm), then level again
  // (≤ 10 mm), and the kick looked at as a source.
  const [apart, setApart] = useState(false);
  const [matched, setMatched] = useState(false);
  const [kickSeen, setKickSeen] = useState(false);
  const [predicted, setPredicted] = useState<string | null>(null);
  const last = useRef(-1);
  useEffect(() => {
    if (rig.version === last.current) return;
    last.current = rig.version;
    if (Math.abs(dSnare) > 25) setApart(true);
    else if (apart && Math.abs(dSnare) <= 10) setMatched(true);
  }, [rig.version, dSnare, apart]);
  useEffect(() => {
    if (srcId === 'src.kick') setKickSeen(true);
  }, [srcId]);
  useEffect(() => {
    if (apart && matched && kickSeen && !interactiveDone.has('snareMatched')) onInteractive('snareMatched');
  }, [apart, matched, kickSeen, interactiveDone, onInteractive]);

  const params: DockParam[] = [
    ...placementParams({ rig, slot, posAxis, setPosAxis, aimAxis, setAimAxis }),
    { kind: 'toggle', id: 'mic', label: `EDIT MIC ${slot}`, value: slot === 'B', onToggle: () => setSlot((s) => (s === 'A' ? 'B' : 'A')) },
    {
      kind: 'options',
      id: 'source',
      label: 'SOURCE',
      valueLabel: srcRegion.label.toUpperCase().slice(0, 10),
      selectedId: srcId,
      onSelect: setSrcId,
      options: regions.map((r) => ({ id: r.id, label: r.label, blurb: `${r.note} Drawn as one point for the path overlay.` })),
    },
    {
      kind: 'toggle',
      id: 'polarity',
      label: B.polarity === 1 ? 'B POLARITY +' : 'B POLARITY −',
      value: B.polarity === -1,
      onToggle: () => rig.setPolarity('B', B.polarity === 1 ? -1 : 1),
    },
  ];
  const bezel: BezelItem[] = [
    { k: 'SNARE B−A', v: signedMs(dSnare), sub: Math.abs(dSnare) <= 10 ? 'matched' : fmtLen(Math.abs(dSnare)), tint: Math.abs(dSnare) <= 10 ? '#5bff85' : undefined, flex: 1.15 },
    { k: 'KICK B−A', v: signedMs(dKick), sub: fmtLen(Math.abs(dKick)), flex: 1.1 },
    { k: '1ST NOTCH', v: equal ? 'NO COMB' : first == null ? '> 20 kHz' : `≈ ${fmtHz(first)}`, sub: srcRegion.label, flex: 1.2 },
    { k: 'POLARITY', v: `B ${B.polarity === 1 ? '+' : '−'}`, flex: 0.8 },
  ];
  const [wellW, setWellW] = useState(0);
  const combLabel = `Simplified two-mic sum for the ${srcRegion.label}: ${equal ? 'no path difference, no comb' : `path difference ${fmtLen(Math.abs(dMm))}, delay ${fmtMs(dt)}, first notch about ${first == null ? 'above 20 kHz' : fmtHz(first)}`}.`;
  const tick = (on: boolean) => (on ? '✓' : '○');

  /* ── step 2: the pairs ── */
  const [pid, setPid] = useState<PairId>('xy');
  const [xyAngle, setXyAngle] = useState<number>(90);
  const [pview, setPview] = useState<ViewId>('top');
  const [psrc, setPsrc] = useState<'snare' | 'kick' | 'hihat' | 'ride'>('hihat');
  const pair = useMemo(() => pairOf(pid, xyAngle), [pid, xyAngle]);
  const psrcP = psrc === 'snare' ? S0 : psrc === 'kick' ? O : KIT_PLACED_CYMBALS[psrc].c;
  const pd = pathDiff(pair, psrcP);
  const sk = snareKick(pair);
  const clear = shoulderClearance(pair);
  const W = PAIRS_WORDS[pid];
  const pairParams: DockParam[] = [
    {
      kind: 'options',
      id: 'pair',
      label: 'PAIR',
      valueLabel: W.short,
      selectedId: pid,
      onSelect: (id) => setPid(id as PairId),
      sticky: true,
      options: PAIR_IDS.map((id) => ({ id, label: PAIRS_WORDS[id].label, blurb: PAIRS_WORDS[id].blurb })),
    },
    {
      kind: 'fader',
      id: 'angle',
      label: 'X/Y ANGLE',
      value: (xyAngle - 90) / 45,
      home: 0,
      onChange: (v) => setXyAngle(Math.round(90 + v * 45)),
      format: () => (pid === 'xy' ? `${xyAngle}° between the capsules` : 'X/Y only — choose X/Y under PAIR'),
      formatShort: () => `${xyAngle}°`,
    },
    {
      kind: 'options',
      id: 'psrc',
      label: 'SOURCE',
      valueLabel: psrc.toUpperCase(),
      selectedId: psrc,
      onSelect: (id) => setPsrc(id as typeof psrc),
      sticky: true,
      options: [
        { id: 'snare', label: 'SNARE' },
        { id: 'kick', label: 'KICK' },
        { id: 'hihat', label: 'HI-HATS' },
        { id: 'ride', label: 'RIDE' },
      ],
    },
    { kind: 'toggle', id: 'pview', label: pview === 'side' ? 'SIDE VIEW' : 'TOP VIEW', value: pview === 'top', onToggle: () => setPview((v) => (v === 'side' ? 'top' : 'side')) },
  ];
  const pairBezel: BezelItem[] = [
    { k: 'SPACING', v: spacing(pair) < 10 ? 'TOGETHER' : fmtLen(spacing(pair)).split(' (')[0], flex: 1 },
    { k: 'ANGLE', v: `${Math.round(includedAngle(pair))}°`, flex: 0.8 },
    { k: `${psrc.toUpperCase()} B−A`, v: signedMs(pd), sub: Math.abs(pd) < EQUAL_PATH_MM ? 'no difference' : 'arrival', flex: 1.15 },
    { k: 'SNARE B−A', v: signedMs(sk.snareB - sk.snareA), flex: 1.1 },
  ];
  const pairLabel = `${W.label} over the kit, ${pview === 'side' ? 'side' : 'top'} view: capsules ${fmtLen(spacing(pair))} apart, ${Math.round(includedAngle(pair))} degrees between them. The ${psrc} reaches B ${signedMs(pd)} relative to A. Snare distances ${fmtLen(sk.snareA)} and ${fmtLen(sk.snareB)}; kick distances ${fmtLen(sk.kickA)} and ${fmtLen(sk.kickB)}.`;

  const pred = lesson.predictions.twoMic;
  const steps: MikingStep[] = [
    {
      key: 'pair',
      title: TWO_WORDS.title,
      kind: 'PAIR',
      layout: 'rack',
      rack: {
        render: (w, h) => <DualView rig={rig} art={art} view={view} setView={setView} w={w} h={h} slots={['A', 'B']} showZones={false} pathsFrom={src} interactive={!hidden} labelFor={(v) => sceneLabel(rig, v, ['A', 'B'], `Paths from the ${srcRegion.label} are drawn as an overlay.`)} />,
        badge: `A simplified picture · dashed = straight paths · white lobe = pattern shape, not range · one point source, no room · c = ${C20.toFixed(1)} m/s (${Math.round(C20 / 0.3048)} ft/s), 20 °C`,
        bezel,
        params,
        initialParam: 'pos',
      },
      well: (
        <>
          {pred ? <PredictCard p={pred} value={predicted} onPick={setPredicted} /> : null}
          <Landing looking={TWO_WORDS.looking} prompt={TWO_WORDS.prompt} />
          <Text style={styles.activity} accessibilityLabel={`Activity: snare distances pulled apart ${apart ? 'done' : 'not yet'}, matched again ${matched ? 'done' : 'not yet'}, the kick looked at ${kickSeen ? 'done' : 'not yet'}.`}>
            {`Activity: snare distances apart ${tick(apart)} · level again ${tick(matched)} · kick as SOURCE ${tick(kickSeen)}`}
          </Text>
          <Card>
            <Point title="THE SNARE-DISTANCE AID">{`To the snare’s centre: A ${fmtLen(sA)} · B ${fmtLen(sB)}${Math.abs(dSnare) <= 10 ? ' — matched.' : '.'}\nTo the kick: A ${fmtLen(kA)} · B ${fmtLen(kB)} — ${fmtMs(Math.abs(deltaTms(dKick)))} apart.`}</Point>
          </Card>
          <NowLine text={nowText(rig, ['A', 'B'])} />
          <View onLayout={(e) => setWellW(Math.round(e.nativeEvent.layout.width))}>{wellW > 0 ? <CombPanel rig={rig} source={src} w={wellW} h={150} label={combLabel} /> : null}</View>
          <Body>{equal ? `No path difference for the ${srcRegion.label}: it reaches both mics at the same instant — no comb for this source.` : `B hears the ${srcRegion.label} ${fmtMs(dt)} ${dt >= 0 ? 'after' : 'before'} A. ${sEff === 1 ? 'Summed, notches fall at odd multiples of 1 ÷ (2 Δt).' : 'Summed as inverted: a low-frequency loss and notches at whole multiples of 1 ÷ Δt.'}`}</Body>
          {predicted != null && kickSeen ? <Note tone="ok">{`You predicted “${predicted}”. ${TWO_WORDS.reveal}`}</Note> : null}
          <Note tone="warn">{T.warn}</Note>
        </>
      ),
    },
    {
      key: 'pairs',
      title: TWO_WORDS.pairsTitle,
      kind: 'COMPARE',
      layout: 'rack',
      rack: {
        render: (w, h) => <PairsScene w={w} h={h} view={pview} box={pview === 'side' ? M09_VIEWS.side : M09_VIEWS.top} pair={pair} typeId="ohPencil" source={psrcP} accessibilityLabel={pairLabel} />,
        badge: 'A simplified picture · capsules drawn at their fronts · white lobes = pattern shapes, not range · straight paths at 20 °C',
        bezel: pairBezel,
        params: pairParams,
        initialParam: 'pair',
      },
      well: (
        <>
          <Landing looking={`${W.label} · source: ${psrc}`} prompt={TWO_WORDS.pairsPrompt} />
          <Card>
            <Point title={W.label.toUpperCase()}>{W.how}</Point>
            <Body>{`TRADE-OFF · ${W.tradeoff}`}</Body>
            <Body>{`MONO · ${W.mono}`}</Body>
            <Body>{`To the snare: ${fmtLen(sk.snareA)} and ${fmtLen(sk.snareB)} · to the kick: ${fmtLen(sk.kickA)} and ${fmtLen(sk.kickB)}.`}</Body>
          </Card>
          {pid === 'shoulder' && clear.inReach ? <Note tone="warn">{TWO_WORDS.shoulderWarn}</Note> : null}
          {pid === 'xy' && xyAngle > 120 ? <Note>{TWO_WORDS.xyWide}</Note> : null}
        </>
      ),
    },
    {
      key: 'learn',
      title: 'What equal distance cannot do',
      kind: 'LEARN',
      layout: 'read',
      body: (
        <>
          {T.learn.map((t) => (
            <Body key={t.slice(0, 24)}>{t}</Body>
          ))}
          <Card>
            <Point title="MID-SIDE, DECODED">{TWO_WORDS.ms}</Point>
          </Card>
          <Note>{TWO_WORDS.comb}</Note>
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
