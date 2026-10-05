/**
 * MALLET KEYBOARDS · Page 7 — TWO MICROPHONES, the family's version of
 * pages/PTwoMic.tsx. The research gives ONE published starting geometry for
 * xylophone, marimba and vibraphone, as two ALTERNATIVES: two mics aimed down
 * about 46 cm (1½ ft) above the bars, either about 61 cm (2 ft) apart, or
 * angled 135° apart with their grilles together — a COINCIDENT pair (the
 * guide lists it under coincident techniques; corrections I2-M3 / I2-X3).
 * The glockenspiel has no published pair: its lesson's own suggestion, a
 * near-coincident pair, and a spaced pair, both at drawing-default sizes.
 *
 * TRY BEFORE TELL: PAIR first, with a prediction; LEARN after.
 * PAIR (rack): the two mics over the keyboard, straight paths from one BAR
 * (an overlay). The bezel computes, from the drawing, the path difference,
 * the arrival-time difference, the level difference the patterns and
 * distances give, and the first comb notch. A coincident pair has no path
 * difference for any bar — its picture is made by LEVEL alone; a spaced pair
 * hears an end bar at two different times — a comb when summed in mono.
 * Credit: both of the first two pairs looked at with an END bar as the
 * source (the lowest or the highest) + the checks.
 */
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../../../theme/tokens';
import type { BezelItem, DockParam } from '../../../../rack/rackTypes';
import type { MicSlot, ViewId } from '../../../engine/model/types.ts';
import { dist } from '../../../engine/geometry/vec.ts';
import { C20, EQUAL_PATH_MM, deltaTms, effectivePolarity, micGain, notchesHz, pathDiffMm } from '../../../engine/physics/twoMic.ts';
import { isModelled } from '../../../engine/physics/polar.ts';
import { fmtHz, fmtLen, fmtMs } from '../../../engine/model/units.ts';
import { lenCell } from '../../../engine/scene/readoutText.ts';
import { useRig } from '../../../engine/scene/useRig.ts';
import { DualView } from '../../../engine/scene/DualView';
import { CombPanel } from '../../../engine/scene/CombPanel';
import { nowText, sceneLabel } from '../../../engine/scene/sceneWords.ts';
import { PageSteps, type MikingStep } from '../../../engine/steps';
import { Body, Landing, Note, NowLine, PredictCard, ScenarioList } from '../../../engine/kit';
import type { PageProps } from '../../../pages/pageTypes';
import { malletFamOf, malletWordsOf } from './family.ts';
import { malletGeom } from './malletModel.ts';
import { noteName } from './malletSpec.ts';

export function MTwoMic({ lesson, art, answers, onAnswered, onInteractive, interactiveDone, variant, hidden }: PageProps) {
  const T = malletWordsOf(lesson).two;
  const fam = malletFamOf(art);
  const G = malletGeom(fam);
  const v = G.layouts[variant] ? variant : fam.variants[0].row.id;
  const L = G.layouts[v];
  const presets = T.presets;
  const [presetId, setPresetId] = useState(presets[0].id);
  const preset = presets.find((p) => p.id === presetId) ?? presets[0];
  const rig = useRig(lesson, {
    variant: v,
    mics: [
      { slot: 'A', typeId: preset.typeId, pattern: preset.pattern, pose: preset.A },
      { slot: 'B', typeId: preset.typeId, pattern: preset.pattern, pose: preset.B },
    ],
  });
  useEffect(() => {
    if (rig.variant !== v) rig.setVariant(v);
  }, [v, rig]);
  const choose = (id: string) => {
    const p = presets.find((q) => q.id === id);
    if (!p) return;
    setPresetId(id);
    for (const s of ['A', 'B'] as MicSlot[]) {
      if (rig.mics.find((m) => m.slot === s)?.typeId !== p.typeId) rig.setType(s, p.typeId);
      rig.setPattern(s, p.pattern);
    }
    rig.jumpTo('A', p.A);
    rig.jumpTo('B', p.B);
  };
  const [view, setView] = useState<ViewId>('side');
  /* ── the source: any natural bar, low to high ── */
  const bars = useMemo(() => [...L.naturals].sort((a, b) => a.key - b.key), [L]);
  const [barIdx, setBarIdx] = useState(0);
  const bar = bars[Math.min(barIdx, bars.length - 1)];
  const src = useMemo(() => ({ x: bar.x, y: bar.yTop - 4, z: bar.z }), [bar]);
  const atEnd = barIdx === 0 || barIdx === bars.length - 1;

  const A = rig.mics.find((m) => m.slot === 'A')!;
  const B = rig.mics.find((m) => m.slot === 'B')!;
  const dMm = pathDiffMm(src, A.pose.p, B.pose.p);
  const dt = deltaTms(dMm);
  const equal = Math.abs(dMm) < EQUAL_PATH_MM;
  const gA = isModelled(A.pattern) ? micGain(A.pattern, A.pose, src) : 1000 / Math.max(1, dist(A.pose.p, src));
  const gB = isModelled(B.pattern) ? micGain(B.pattern, B.pose, src) : 1000 / Math.max(1, dist(B.pose.p, src));
  const sEff = effectivePolarity(B.polarity, gA, gB);
  const first = equal ? null : notchesHz(dt, sEff, 20000, 4)[sEff === 1 ? 0 : 1] ?? null;
  const lvl = 20 * Math.log10(Math.max(1e-6, Math.abs(gA)) / Math.max(1e-6, Math.abs(gB)));

  // CREDIT: the first two pairs, each looked at with an END bar as the source.
  const [seenEnd, setSeenEnd] = useState<ReadonlySet<string>>(() => new Set());
  useEffect(() => {
    if (atEnd && !seenEnd.has(presetId)) setSeenEnd(new Set([...seenEnd, presetId]));
  }, [atEnd, presetId, seenEnd]);
  const need = presets.slice(0, 2).map((p) => p.id);
  const done = need.every((id) => seenEnd.has(id));
  useEffect(() => {
    if (done && !interactiveDone.has('pairCompared')) onInteractive('pairCompared');
  }, [done, interactiveDone, onInteractive]);
  const [predicted, setPredicted] = useState<string | null>(null);

  const params: DockParam[] = [
    {
      kind: 'options',
      id: 'pair',
      label: 'PAIR',
      valueLabel: preset.short,
      selectedId: presetId,
      onSelect: choose,
      sticky: true,
      options: presets.map((p) => ({ id: p.id, label: p.label, blurb: p.blurb })),
    },
    {
      kind: 'fader',
      id: 'bar',
      label: 'BAR',
      value: bars.length > 1 ? barIdx / (bars.length - 1) : 0,
      onChange: (x) => setBarIdx(Math.round(x * (bars.length - 1))),
      format: () => `${noteName(bar.key)} · ${barIdx === 0 ? 'the lowest bar' : barIdx === bars.length - 1 ? 'the highest bar' : `bar ${barIdx + 1} of ${bars.length}`}`,
      formatShort: () => noteName(bar.key),
    },
    {
      kind: 'toggle',
      id: 'polarity',
      label: B.polarity === 1 ? 'B POLARITY +' : 'B POLARITY −',
      value: B.polarity === -1,
      onToggle: () => rig.setPolarity('B', B.polarity === 1 ? -1 : 1),
    },
    { kind: 'toggle', id: 'view', label: view === 'side' ? 'FRONT VIEW' : 'TOP VIEW', value: view === 'top', onToggle: () => setView((x) => (x === 'side' ? 'top' : 'side')) },
  ];
  const dCell = lenCell(dMm, true);
  const bezel: BezelItem[] = [
    { k: 'PATH Δd B−A', v: equal ? 'NONE' : dCell.v, sub: equal ? 'same path' : dCell.sub, flex: 1.3 },
    { k: 'DELAY Δt', v: equal ? '0 ms' : fmtMs(dt).replace('≈ ', `≈ ${dt > 0 ? '+' : '−'}`), sub: equal ? 'no comb' : dt > 0 ? 'B later' : 'B earlier', flex: 1.2 },
    { k: 'LEVEL A−B', v: `${lvl >= 0 ? '+' : '−'}${Math.abs(lvl).toFixed(1)} dB`, sub: Math.abs(lvl) < 0.5 ? 'centre' : lvl > 0 ? 'toward A' : 'toward B', flex: 1.15 },
    { k: '1ST NOTCH', v: equal ? 'NO COMB' : first == null ? 'OVER 20 kHz' : `≈ ${fmtHz(first)}`, flex: 1.1 },
  ];
  const [wellW, setWellW] = useState(0);
  const label = `Ideal two-mic sum for the ${noteName(bar.key)} bar: ${equal ? 'no path difference, no comb' : `path difference ${fmtLen(Math.abs(dMm))}, delay ${fmtMs(dt)}, first notch about ${first == null ? 'above 20 kHz' : fmtHz(first)}`}; level difference ${Math.abs(lvl).toFixed(1)} dB.`;
  const labelFor = (x: ViewId) => sceneLabel(rig, x, ['A', 'B'], `${preset.label}. Paths from the ${noteName(bar.key)} bar are drawn as an overlay.`);
  const pred = lesson.predictions.twoMic;
  const tick = (on: boolean) => (on ? '✓' : '○');

  const steps: MikingStep[] = [
    {
      key: 'pair',
      title: 'Spaced or coincident',
      kind: 'PAIR',
      layout: 'rack',
      rack: {
        render: (w, h) => <DualView rig={rig} art={art} view={view} setView={setView} w={w} h={h} slots={['A', 'B']} showZones={false} pathsFrom={src} interactive={!hidden} labelFor={labelFor} />,
        badge: `A simplified picture · dashed = straight paths from one bar · white lobe = pattern shape, not range · no reflections · c = ${C20.toFixed(1)} m/s, 20 °C`,
        bezel,
        params,
        initialParam: 'bar',
      },
      well: (
        <>
          {pred ? <PredictCard p={pred} value={predicted} onPick={setPredicted} /> : null}
          <Landing looking={T.looking} prompt={T.prompt} />
          <Text style={styles.activity} accessibilityLabel={`Activity: ${need.map((id) => `${presets.find((p) => p.id === id)?.short} with an end bar ${seenEnd.has(id) ? 'done' : 'not yet'}`).join(', ')}.`}>
            {`Activity: ${need.map((id) => `${presets.find((p) => p.id === id)?.short} with an end bar ${tick(seenEnd.has(id))}`).join(' · ')}`}
          </Text>
          <NowLine text={nowText(rig, ['A', 'B'])} />
          <Body>{preset.blurb}</Body>
          <View onLayout={(e) => setWellW(Math.round(e.nativeEvent.layout.width))}>{wellW > 0 ? <CombPanel rig={rig} source={src} w={wellW} h={150} label={label} /> : null}</View>
          <Body>
            {equal
              ? `The ${noteName(bar.key)} bar reaches both mics at the same instant: no comb when they are summed. Any difference between them is LEVEL — ${Math.abs(lvl) < 0.5 ? 'here about the same in both' : `here about ${Math.abs(lvl).toFixed(1)} dB more in mic ${lvl > 0 ? 'A' : 'B'}`}.`
              : `The ${noteName(bar.key)} bar reaches mic B ${fmtMs(dt)} ${dt >= 0 ? 'after' : 'before'} mic A. Summed in mono, that delay cuts notches${first == null ? ' above the audible range' : `, the first near ${fmtHz(first)}`}.`}
          </Body>
          {predicted != null && done ? <Note tone="ok">{`You predicted “${predicted}”. ${presets.some((p) => p.coincident) ? 'With the grilles together, no bar has a path difference — the coincident pair’s picture is made by level, and its mono sum has no comb. The spaced pair gives an end bar two arrival times.' : 'Close together, the near-coincident pair gives an end bar only a small time difference; the spaced pair a larger one.'}`}</Note> : null}
          <Note tone="warn">{T.warn}</Note>
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
          <Note>What you just saw: a bar reaches two spaced mics at different times; summed, the late copy cancels where it is half a period late — comb notches. Grilles together, the times match for every bar, and the two mics differ only in level. Polarity flips the sign — it moves the notches; it does not remove a delay.</Note>
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
