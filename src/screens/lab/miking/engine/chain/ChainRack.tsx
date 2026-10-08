/**
 * THE CHAIN RACK, drawn (owner decision D-6B-1; the model is chainModel.ts).
 * A rack step with NO mic to drag: the chain runs top to bottom on the glass
 * as the real pieces of equipment, joined by their cables; each slot is a
 * dock key whose tray offers that slot's parts (with what each one is). A
 * REFUSED join turns its cable red and dashed and says why in the well; a
 * part that is safe but does not suit the question is named with why. Once
 * the chain is complete, nothing refused and everything suits the brief,
 * the step reports `credit` once (the page's interactive) and the glass
 * prints the result's honest label.
 *
 * Generic: the lesson hands in its ChainSpec and how to draw each part
 * (`drawPart`, Skia elements in the icon's box). FULLY SILENT; nothing
 * moves by itself. Text over the glass is at least 9 pt and grows with the
 * full-screen zoom (useStageTextScale).
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Canvas, DashPathEffect, Group, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import { colors, fonts } from '../../../../../theme/tokens';
import { fitValue } from '../../../../../theme/legibility';
import { useStageTextScale } from '../../../rack/stageAspect';
import type { BezelItem, DockParam } from '../../../rack/rackTypes';
import type { MikingStep } from '../steps';
import type { Prediction } from '../model/types.ts';
import { Card, Landing, Note, Point, PredictCard } from '../kit';
import { checkChain, type ChainCheck, type ChainPicks, type ChainSpec } from './chainModel.ts';

export type DrawPart = (slot: string, part: string, box: { x: number; y: number; w: number; h: number }) => ReactNode;

export type ChainWords = {
  title: string;
  badge: string;
  looking: string;
  prompt: string;
  /** Said once the chain passes (before the brief's own label). */
  done: string;
};

const RED = '#ff6b5e';
const GREEN = '#5bff85';
const AMBER = '#ffc64d';

/** Which slots a refusal touches (for the red rows). */
function refusedSlots(check: ChainCheck): Set<string> {
  const s = new Set<string>();
  for (const r of check.refused) for (const [slot] of r.all) s.add(slot);
  return s;
}

export function ChainDisplay({ w, h, spec, picks, check, drawPart, label, accessibilityLabel }: { w: number; h: number; spec: ChainSpec; picks: ChainPicks; check: ChainCheck; drawPart: DrawPart; label: string; accessibilityLabel: string }) {
  const k = useStageTextScale();
  const n = spec.slots.length;
  const top = 8;
  const foot = 30 * k;
  const rowH = (h - top - foot) / n;
  const iconW = Math.min(110, w * 0.3);
  const iconH = Math.min(rowH - 10, 54);
  const ix = 12;
  const red = refusedSlots(check);
  const misfit = new Set(check.misfits.map((m) => m.slot));
  // The cable down the icons' left edge, segment by segment: red (dashed) across a refused span.
  const cables = useMemo(() => {
    const ok = Skia.Path.Make();
    const bad = Skia.Path.Make();
    const cx = ix + iconW * 0.5;
    for (let i = 0; i < n - 1; i++) {
      const y0 = top + i * rowH + rowH / 2 + iconH / 2;
      const y1 = top + (i + 1) * rowH + rowH / 2 - iconH / 2;
      const a = spec.slots[i].id;
      const b = spec.slots[i + 1].id;
      const spanRed = check.refused.some((r) => {
        const idx = r.all.map(([s]) => spec.slots.findIndex((q) => q.id === s));
        return Math.min(...idx) <= i && Math.max(...idx) >= i + 1;
      });
      const p = spanRed ? bad : ok;
      if (!picks[a] || !picks[b]) continue;
      p.moveTo(cx, y0);
      p.lineTo(cx, y1);
    }
    return { ok, bad };
  }, [spec, picks, check, n, rowH, iconW, iconH]);
  const frames = useMemo(() => {
    const p = Skia.Path.Make();
    for (let i = 0; i < n; i++) p.addRRect(Skia.RRectXY(Skia.XYWHRect(ix, top + i * rowH + rowH / 2 - iconH / 2, iconW, iconH), 8, 8));
    return p;
  }, [n, rowH, iconW, iconH]);
  return (
    <View style={{ width: w, height: h }}>
      <Canvas style={{ width: w, height: h }} accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel}>
        <Path path={frames} color="#121318" />
        <Path path={frames} style="stroke" strokeWidth={1} color="#2c2e35" />
        <Path path={cables.ok} style="stroke" strokeWidth={6} strokeCap="round" color="#08080a" />
        <Path path={cables.ok} style="stroke" strokeWidth={4} strokeCap="round">
          <LinearGradient start={vec(0, 0)} end={vec(0, h)} colors={['#3c3f47', '#25272c']} />
        </Path>
        <Path path={cables.ok} style="stroke" strokeWidth={1.2} color={GREEN} opacity={0.65} />
        <Path path={cables.bad} style="stroke" strokeWidth={3} strokeCap="round" color={RED}>
          <DashPathEffect intervals={[6, 5]} />
        </Path>
        {spec.slots.map((s, i) => {
          const part = picks[s.id];
          const y = top + i * rowH + rowH / 2 - iconH / 2;
          return (
            <Group key={s.id}>
              {part ? drawPart(s.id, part, { x: ix + 4, y: y + 3, w: iconW - 8, h: iconH - 6 }) : null}
              {red.has(s.id) || misfit.has(s.id) ? (
                <Path path={Skia.Path.Make().addRRect(Skia.RRectXY(Skia.XYWHRect(ix - 2, y - 2, iconW + 4, iconH + 4), 9, 9))} style="stroke" strokeWidth={2} color={red.has(s.id) ? RED : AMBER} />
              ) : null}
            </Group>
          );
        })}
      </Canvas>
      {spec.slots.map((s, i) => {
        const part = s.parts.find((p) => p.id === picks[s.id]);
        const y = top + i * rowH + rowH / 2;
        const state = !part ? 'empty' : red.has(s.id) ? 'refused' : misfit.has(s.id) ? 'misfit' : 'ok';
        return (
          <View key={s.id} style={[styles.row, { left: ix + iconW + 10, right: 8, top: y - 17 * k }]} pointerEvents="none">
            <Text style={[styles.slot, { fontSize: 10 * k }]} {...fitValue(10 * k)}>
              {s.label.toUpperCase()}
            </Text>
            <Text style={[styles.part, { fontSize: 12 * k, color: state === 'refused' ? RED : state === 'misfit' ? AMBER : state === 'ok' ? '#eef0f4' : colors.textMuted }]} numberOfLines={2}>
              {`${state === 'refused' ? '✗ ' : state === 'misfit' ? '! ' : state === 'ok' ? '✓ ' : ''}${part ? part.label : 'choose in the dock'}`}
            </Text>
          </View>
        );
      })}
      <View style={[styles.foot, { height: foot }]} pointerEvents="none">
        <Text style={[styles.result, { fontSize: 11 * k, color: check.pass ? GREEN : check.refused.length ? RED : AMBER }]} {...fitValue(11 * k)}>
          {label}
        </Text>
      </View>
    </View>
  );
}

/**
 * One CHAIN step: the display, a dock key per slot (and BRIEF when there is
 * more than one), the brief and the feedback in the well. Reports `onPass`
 * once, the first time a chain passes any brief.
 */
export function useChainStep({ spec, drawPart, words, prediction, onPass, initial }: { spec: ChainSpec; drawPart: DrawPart; words: ChainWords; prediction?: Prediction; onPass: () => void; initial?: ChainPicks }): MikingStep {
  const [briefId, setBriefId] = useState(spec.briefs[0].id);
  const brief = spec.briefs.find((b) => b.id === briefId) ?? spec.briefs[0];
  const [picks, setPicks] = useState<ChainPicks>(() => initial ?? Object.fromEntries(spec.slots.map((s) => [s.id, null])));
  const [predicted, setPredicted] = useState<string | null>(null);
  const check = useMemo(() => checkChain(spec, brief, picks), [spec, brief, picks]);
  const reported = useRef(false);
  useEffect(() => {
    if (check.pass && !reported.current) {
      reported.current = true;
      onPass();
    }
  }, [check.pass, onPass]);
  const label = check.pass ? `RESULT · ${brief.label}` : check.refused.length ? 'REFUSED · see why below' : !check.complete ? 'CHAIN NOT COMPLETE' : 'DOES NOT SUIT THIS QUESTION · see why';
  const params: DockParam[] = [
    ...(spec.briefs.length > 1
      ? [
          {
            kind: 'options' as const,
            id: 'brief',
            label: 'QUESTION',
            valueLabel: brief.title.toUpperCase(),
            selectedId: brief.id,
            onSelect: setBriefId,
            options: spec.briefs.map((b) => ({ id: b.id, label: b.title, blurb: b.question })),
          },
        ]
      : []),
    ...spec.slots.map((s) => ({
      kind: 'options' as const,
      id: `slot:${s.id}`,
      label: s.short,
      valueLabel: s.parts.find((p) => p.id === picks[s.id])?.short ?? '—',
      selectedId: picks[s.id] ?? null,
      onSelect: (id: string) => setPicks((p) => ({ ...p, [s.id]: id })),
      sticky: true,
      options: s.parts.map((p) => ({ id: p.id, label: p.label, blurb: p.blurb })),
    })),
  ];
  const bezel: BezelItem[] = [
    { k: 'LINKS', v: `${spec.slots.filter((s) => picks[s.id]).length} / ${spec.slots.length}`, flex: 0.8 },
    { k: 'REFUSED', v: String(check.refused.length), tint: check.refused.length ? RED : undefined, flex: 0.8 },
    { k: 'RESULT', v: check.pass ? 'PASSES' : check.complete ? 'NOT YET' : '—', tint: check.pass ? GREEN : undefined, flex: 1.2 },
  ];
  const a11y = `${words.title}. ${spec.slots.map((s) => `${s.label}: ${s.parts.find((p) => p.id === picks[s.id])?.label ?? 'not chosen'}`).join('; ')}. ${label}.`;
  return {
    key: 'chain',
    title: words.title,
    kind: 'TRY',
    layout: 'rack',
    rack: {
      render: (w, h) => <ChainDisplay w={w} h={h} spec={spec} picks={picks} check={check} drawPart={drawPart} label={label} accessibilityLabel={a11y} />,
      badge: words.badge,
      bezel,
      params,
      initialParam: spec.briefs.length > 1 ? 'brief' : `slot:${spec.slots[0].id}`,
    },
    well: (
      <>
        {prediction ? <PredictCard p={prediction} value={predicted} onPick={setPredicted} /> : null}
        <Landing looking={`${words.looking} · ${brief.title}`} prompt={words.prompt} />
        <Card>
          <Point title="THE QUESTION">{brief.question}</Point>
        </Card>
        {check.refused.map((r) => (
          <Note key={r.id} tone="warn">{`✗ REFUSED · ${r.reason}`}</Note>
        ))}
        {check.misfits.map((m) => (
          <Note key={`${m.slot}:${m.part}`} tone="warn">{`! ${spec.slots.find((s) => s.id === m.slot)?.label ?? m.slot}: ${m.why}`}</Note>
        ))}
        {check.pass ? <Note tone="ok">{`✓ ${words.done} ${brief.label}.`}</Note> : null}
      </>
    ),
  };
}

const styles = StyleSheet.create({
  row: { position: 'absolute', gap: 1 },
  slot: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, letterSpacing: 1 },
  part: { fontFamily: fonts.barlowSemiBold, lineHeight: undefined },
  foot: { position: 'absolute', left: 10, right: 10, bottom: 2, justifyContent: 'center' },
  result: { fontFamily: fonts.oswaldMedium, letterSpacing: 1, textAlign: 'center' },
});
