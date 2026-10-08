/**
 * THE CLAIM LADDER, drawn (the model is claimLadder.ts; F15 and F16). A rack
 * step: the ladder stands on the glass — its rungs from the smallest claim
 * to the largest, the rungs the chosen SETUP reaches lit green — and the
 * claim in hand is marked at the rung it needs (or above the ladder, when no
 * setup on it can carry that claim alone). The learner picks a SETUP, steps
 * through the CLAIMS and gives a VERDICT for each; every verdict is answered
 * with why, a wrong one explained and never penalised. `onDone` once every
 * claim is judged right for one setup. FULLY SILENT; nothing moves by itself;
 * text ≥ 9 pt and zooms with full screen.
 */
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Canvas, DashPathEffect, Group, Line, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import { fonts } from '../../../../../../theme/tokens';
import { fitValue } from '../../../../../../theme/legibility';
import { useStageTextScale } from '../../../../rack/stageAspect';
import type { BezelItem, DockParam } from '../../../../rack/rackTypes';
import type { MikingStep } from '../../../engine/steps';
import { Card, Landing, Note, Point } from '../../../engine/kit';
import { gradeLadder, rungIndex, supports, type ClaimLadder, type Verdict } from './claimLadder.ts';

const GREEN = '#5bff85';
const AMBER = '#ffc64d';
const RED = '#ff6b5e';

export type LadderWords = { title: string; badge: string; looking: string; prompt: string };

export function useClaimLadderStep({ ladder, words, onDone }: { ladder: ClaimLadder; words: LadderWords; onDone: () => void }): MikingStep {
  const [setupId, setSetupId] = useState(ladder.setups[0].id);
  const [claimId, setClaimId] = useState(ladder.claims[0].id);
  const [verdicts, setVerdicts] = useState<Readonly<Record<string, Readonly<Record<string, Verdict>>>>>({});
  const setup = ladder.setups.find((s) => s.id === setupId)!;
  const claim = ladder.claims.find((c) => c.id === claimId)!;
  const mine = verdicts[setupId] ?? {};
  const g = gradeLadder(ladder, setupId, mine);
  const done = Object.keys(verdicts).some((s) => gradeLadder(ladder, s, verdicts[s]).done);
  useEffect(() => {
    if (done) onDone();
  }, [done, onDone]);
  const pick = mine[claimId];
  const truth = supports(ladder, setupId, claimId);
  const mark = (cid: string) => {
    const v = mine[cid];
    if (!v) return '○';
    return (v === 'yes') === supports(ladder, setupId, cid) ? '✓' : '✗';
  };
  const params: DockParam[] = [
    { kind: 'options', id: 'setup', label: 'SETUP', valueLabel: setup.short, selectedId: setupId, onSelect: setSetupId, options: ladder.setups.map((s) => ({ id: s.id, label: s.label, blurb: s.blurb })) },
    { kind: 'options', id: 'claim', label: 'CLAIM', valueLabel: claim.short, selectedId: claimId, onSelect: setClaimId, sticky: true, options: ladder.claims.map((c) => ({ id: c.id, label: `${mark(c.id)} ${c.text}` })) },
    {
      kind: 'options',
      id: 'verdict',
      label: 'VERDICT',
      valueLabel: pick === 'yes' ? 'SUPPORTED' : pick === 'no' ? 'NOT YET' : '—',
      selectedId: pick ?? null,
      onSelect: (id) => setVerdicts((all) => ({ ...all, [setupId]: { ...(all[setupId] ?? {}), [claimId]: id as Verdict } })),
      options: [
        { id: 'yes', label: 'This setup supports the claim', blurb: 'The evidence it gives is enough for these words.' },
        { id: 'no', label: 'This setup cannot support it', blurb: 'The claim says more than this evidence can.' },
      ],
    },
  ];
  const bezel: BezelItem[] = [
    { k: 'REACHES', v: ladder.rungs[rungIndex(ladder, setup.reach)].short, tint: GREEN, flex: 1.2 },
    { k: 'JUDGED', v: `${g.judged} / ${ladder.claims.length}`, flex: 0.9 },
    { k: 'RIGHT', v: `${g.right} / ${ladder.claims.length}`, tint: g.done ? GREEN : undefined, flex: 0.9 },
  ];
  const a11y = `A ladder of claims, from ${ladder.rungs.map((r) => r.label.toLowerCase()).join(', up to ')}. ${setup.label} reaches ${ladder.rungs[rungIndex(ladder, setup.reach)].label.toLowerCase()}. The claim “${claim.text}” ${claim.needs === null ? 'needs more than any rung of this ladder' : `needs ${ladder.rungs[rungIndex(ladder, claim.needs)].label.toLowerCase()}`}.`;
  const answer = !pick
    ? 'Give a VERDICT: does this setup support the claim?'
    : (pick === 'yes') === truth
      ? `${truth ? 'Supported' : 'Not supported'} — right. ${claim.why}`
      : `${truth ? 'It does support it' : 'It cannot support it'}: ${claim.why}`;
  return {
    key: 'ladder',
    title: words.title,
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, h) => <LadderDisplay w={w} h={h} ladder={ladder} reach={rungIndex(ladder, setup.reach)} need={rungIndex(ladder, claim.needs)} beyond={claim.needs === null} claimShort={claim.short} label={a11y} />,
      badge: words.badge,
      bezel,
      params,
      initialParam: 'claim',
    },
    well: (
      <>
        <Landing looking={`${words.looking} · ${setup.short.toLowerCase()}`} prompt={words.prompt} />
        <Card>
          <Point title="THE SETUP">{setup.blurb}</Point>
          <Point title={`THE CLAIM · “${claim.text}”`}>{answer}</Point>
        </Card>
        {pick && (pick === 'yes') !== truth ? <Note tone="warn">A retry is fine: change the VERDICT and read why.</Note> : <Note>{`${g.right} of ${ladder.claims.length} claims judged right for this setup${g.done ? ' — all of them.' : '.'}`}</Note>}
      </>
    ),
  };
}

function LadderDisplay({ w, h, ladder, reach, need, beyond, claimShort, label }: { w: number; h: number; ladder: ClaimLadder; reach: number; need: number; beyond: boolean; claimShort: string; label: string }) {
  const k = useStageTextScale();
  const n = ladder.rungs.length;
  const top = 34 * k;
  const bot = h - 14;
  const lx = Math.min(w * 0.3, 120);
  const rw = Math.min(70, w * 0.18);
  const yOf = (i: number) => bot - ((bot - top) * (i + 0.5)) / n;
  const p = useMemo(() => {
    const rails = Skia.Path.Make();
    rails.addRRect(Skia.RRectXY(Skia.XYWHRect(lx - 5, top - 10, 9, bot - top + 10), 3, 3));
    rails.addRRect(Skia.RRectXY(Skia.XYWHRect(lx + rw - 4, top - 10, 9, bot - top + 10), 3, 3));
    const rungs = Skia.Path.Make();
    for (let i = 0; i < n; i++) rungs.addRRect(Skia.RRectXY(Skia.XYWHRect(lx, yOf(i) - 4, rw, 8), 3, 3));
    const lit = Skia.Path.Make();
    for (let i = 0; i <= reach; i++) lit.addRRect(Skia.RRectXY(Skia.XYWHRect(lx, yOf(i) - 4, rw, 8), 3, 3));
    return { rails, rungs, lit };
  }, [w, h, k, n, reach]); // eslint-disable-line react-hooks/exhaustive-deps
  const markY = beyond ? top - 18 * k : yOf(need);
  const ok = !beyond && need <= reach;
  const markColor = ok ? GREEN : beyond ? RED : AMBER;
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={label}>
        <Path path={p.rails}>
          <LinearGradient start={vec(lx - 5, 0)} end={vec(lx + rw + 5, 0)} colors={['#b9a07a', '#7a6446', '#4a3c29']} />
        </Path>
        <Path path={p.rungs}>
          <LinearGradient start={vec(0, top)} end={vec(0, bot)} colors={['#a38a64', '#6b5639']} />
        </Path>
        <Path path={p.lit} color={GREEN} opacity={0.55} />
        <Path path={p.rails} style="stroke" strokeWidth={1.2} color="#07080a" />
        <Line p1={vec(lx + rw + 14, markY)} p2={vec(lx + rw + 40, markY)} color={markColor} strokeWidth={3} />
        {beyond ? (
          <Line p1={vec(lx + rw / 2, top - 8)} p2={vec(lx + rw / 2, markY)} color={RED} strokeWidth={1.5}>
            <DashPathEffect intervals={[4, 3]} />
          </Line>
        ) : null}
        <Group>
          <Line p1={vec(8, bot + 6)} p2={vec(w - 8, bot + 6)} color="#3a3c44" strokeWidth={2} />
        </Group>
      </Canvas>
      {ladder.rungs.map((r, i) => (
        <Text key={r.id} style={[styles.rung, { top: yOf(i) - 13 * k, left: lx + rw + 46, right: 6, fontSize: 10 * k, color: i <= reach ? '#dff7e6' : '#8b909b' }]} numberOfLines={2}>
          {r.label.toUpperCase()}
        </Text>
      ))}
      <Text style={[styles.claim, { top: Math.max(2, markY - 28 * k), left: 6, width: lx - 12, fontSize: 9.5 * k, color: markColor }]} numberOfLines={2}>
        {claimShort.toUpperCase()}
      </Text>
      <Text style={[styles.cap, { top: 3, left: lx + rw + 46, right: 6, fontSize: 9 * k }]} {...fitValue(9 * k)}>
        {beyond ? 'OFF THE LADDER' : 'GREEN = THIS SETUP’S REACH'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  rung: { position: 'absolute', fontFamily: fonts.oswaldMedium, letterSpacing: 0.6 },
  claim: { position: 'absolute', fontFamily: fonts.oswaldMedium, letterSpacing: 0.5, textAlign: 'right' },
  cap: { position: 'absolute', color: '#aab0bd', fontFamily: fonts.oswaldMedium, letterSpacing: 0.6 },
});

