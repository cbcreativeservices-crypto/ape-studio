/**
 * Module 5 — SUGGESTED SETUPS (owner request + plan agreed 2026-11-14). Reads
 * the room, the monitoring setup and the layout the learner already entered,
 * and proposes up to three setups worked out with the lab's own model
 * (suggestSetups.ts): smoothest bass, clearest stereo image, least change.
 * Each card draws its layout (the plan style, current positions faint beneath
 * it), says what it improves, and opens a detailed report (SetupReport, a
 * popup). TRY THIS SETUP puts it in a kept slot beside START (owner Q3).
 *
 * Rack Unit: the selected setup on the stage, SETUP / REPORT / TRY in the
 * dock, the cards in the well. The search runs once per change of the design,
 * off the render path (runSoon). The module counts as done when a report is
 * opened or a setup is tried ("done = work done"); nothing is ever removed.
 */
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import { runSoon } from '../../../../lib/afterInteractions';
import { flipFader } from '../../soundsystems/rackLayout';
import type { BezelItem, DockParam } from '../../rack/rackTypes';
import { useLabNavContext } from '../../kit/LabNavBar';
import { BADGE, type RoomLabCtx } from '../labCtx';
import { RoomRackLayout } from '../rackLayout';
import { RoomPlanView, type PlanLayers } from '../RoomPlanView';
import { Body, Caption, SAFETY_LEVEL_POINTER } from '../bits';
import { analyze, fmtLen, keepDesignInside, type Layout } from '../roomModel';
import { applySetup, FLAG_LEVEL, freeTrySlot, FRONT_CLEAR_M, seatDesk, SETUP_MIN_DIFF_M, suggestSetups, type FlagKey, type Setup, type SetupResult, type TrySlot } from '../suggestSetups';
import { SetupReport } from '../SetupReport';
import { ROOM_MODULES } from '../registry';

const STAGE_LAYERS: PlanLayers = { triangle: true, boundaries: false, reflections: false, modes: false, dims: true, treatment: true };
const CARD_LAYERS: PlanLayers = { triangle: true, boundaries: false, reflections: false, modes: false, dims: false, treatment: true };
const CARD_PLAN_H = 170;

export const WORKING_LINE = 'Working out setups for your room…';
/** Every setup drawing carries its key (owner rule: a drawing's key is part of it). */
export const DRAWING_KEY = 'Bright: this setup. Faint and dashed: where everything stands now.';

export function SuggestModule({ ctx }: { ctx: RoomLabCtx }) {
  const { design, update, analysis, units, markWork } = ctx;
  const nav = useLabNavContext();
  const lay = design.layouts[design.active] ?? design.layouts[0];
  const [result, setResult] = useState<SetupResult | null>(null);
  const [pick, setPick] = useState(0);
  const [reportOf, setReportOf] = useState<number | null>(null);
  const [askOnOpen, setAskOnOpen] = useState(false);
  const [tried, setTried] = useState<{ letter: string; title: string; slot: TrySlot } | null>(null);
  const [cardW, setCardW] = useState(0);

  // The search reads the room, the monitoring setup, the layout being edited
  // and the treatment; it runs again only when one of them changes.
  useEffect(() => {
    setResult(null);
    const h = runSoon(() => setResult(suggestSetups(design)));
    return () => h.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [design.room, design.layouts, design.active, design.monitoring, design.treatment]);

  const setups = result?.setups ?? [];
  const sel: Setup | null = setups[Math.min(pick, setups.length - 1)] ?? null;
  const selAnalysis = useMemo(() => (sel ? analyze(sel.design) : null), [sel]);
  const desk = useMemo(() => {
    const f = seatDesk(design.room, lay.listener);
    return f ? { x: f.x, y: f.y, w: f.w, d: f.d } : null;
  }, [design.room, lay.listener]);

  const openReport = (i: number, ask = false) => {
    setAskOnOpen(ask);
    setPick(i);
    markWork();
    setReportOf(i);
  };
  const tryIt = (s: Setup, slot: TrySlot) => {
    update((d) => keepDesignInside(applySetup(d, s, slot)));
    setTried({ letter: s.letter, title: s.title, slot });
    setReportOf(null);
  };
  const exploreIdx = ROOM_MODULES.findIndex((m) => m.id === 'explore');

  const bezel: BezelItem[] = sel
    ? [
        { k: 'SETUP', v: sel.letter, flex: 0.8 },
        { k: 'DIPS+PEAKS', v: `${result!.base.bassHits.length}→${sel.metrics.bassHits.length}`, flex: 1.1 },
        { k: 'STRONG <15ms', v: `${result!.base.earlyStrong}→${sel.metrics.earlyStrong}`, flex: 1.1 },
        { k: 'WARNINGS !', v: `${countChecks(result!.base.flags)}→${countChecks(sel.metrics.flags)}` },
      ]
    : [{ k: 'SETUP', v: result ? 'NONE' : '…', caption: result ? 'none better here — see the notes' : 'working it out' }];

  const params: DockParam[] = setups.length
    ? [
        flipFader({
          id: 'setup',
          label: 'SETUP',
          items: setups.map((s, i) => ({ id: String(i), name: `${s.letter} · ${s.title.toUpperCase()}`, s })),
          selectedId: String(Math.min(pick, setups.length - 1)),
          onSelect: (id) => setPick(Number(id)),
          name: (t) => t.name,
          short: (t) => t.s.letter,
          title: 'SUGGESTED SETUPS',
          sticky: true,
          blurb: (t) => t.s.goalLine,
        }),
        { kind: 'action', id: 'report', label: 'REPORT', onPress: () => openReport(Math.min(pick, setups.length - 1)), tint: colors.cyanBright, leavesFull: true },
        {
          kind: 'action',
          id: 'try',
          label: 'TRY',
          tint: colors.green,
          leavesFull: true,
          onPress: () => {
            if (!sel) return;
            const slot = freeTrySlot(design);
            // Both slots taken: the report asks which one goes (owner Q3).
            if (slot) tryIt(sel, slot);
            else openReport(Math.min(pick, setups.length - 1), true);
          },
        },
      ]
    : [{ kind: 'action', id: 'explore', label: 'OPEN EXPLORE', onPress: () => nav?.jump(exploreIdx), tint: colors.cyanBright }];

  const stage = (w: number, h: number) =>
    sel && selAnalysis ? (
      <RoomPlanView w={w} h={h} design={sel.design} analysis={selAnalysis} layers={STAGE_LAYERS} edit="none" ghost={{ layout: lay, desk: sel.deskMoved ? desk : null }} />
    ) : (
      <RoomPlanView w={w} h={h} design={design} analysis={analysis} layers={STAGE_LAYERS} edit="none" />
    );

  const room = design.room;
  const readsLine = `Worked out from your room (${fmtLen(analysis.bounds.width, units)} × ${fmtLen(analysis.bounds.length, units)}, ${room.ceiling} ceiling ${fmtLen(room.height, units)}), ${design.monitoring.config === 'stereo' ? 'STEREO' : design.monitoring.config === 'stereo_sub' ? 'STEREO + SUB' : 'MULTICHANNEL'}, ${design.monitoring.field.toUpperCase()}, the layout “${lay.name}” and your treatment.`;

  return (
    <>
      <RoomRackLayout
        rack={{ stage, badge: BADGE.suggest, bezel, params, initialParam: setups.length ? 'setup' : 'explore', hideDragTag: true }}
        caption="Tap a setup to open its full report: what to move, the numbers before and after, why it is better and what it costs. SETUP flips the drawing between them; TRY puts one in a kept slot beside START so you can drag it in Explore."
        captionFirst
        wellTop={
          <View style={{ gap: 10 }}>
            <Text style={styles.reads}>{readsLine}</Text>
            {setups.length ? <Text style={styles.key}>{DRAWING_KEY}</Text> : null}
            {tried ? (
              <View style={styles.tried}>
                <Text style={styles.triedText}>{`Setup ${tried.letter} (${tried.title}) is now kept as ${tried.slot.toUpperCase()} and showing (SAVE in Explore or Review keeps the whole design on this device). The suggestions below now start from it, so they may change. Open Explore to drag it, TRACE its reflections, and compare it with START in WHAT CHANGED.`}</Text>
                <Pressable onPress={() => nav?.jump(exploreIdx)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Open Explore placement">
                  <Text style={styles.link}>OPEN EXPLORE ›</Text>
                </Pressable>
              </View>
            ) : null}
            {!result ? <Text style={styles.working}>{WORKING_LINE}</Text> : null}
            {result?.blocked ? <Body>{result.blocked}</Body> : null}
            {setups.map((s, i) => (
              <Pressable
                key={s.goal}
                onPress={() => openReport(i)}
                onLayout={(e) => setCardW(e.nativeEvent.layout.width)}
                style={[styles.card, i === Math.min(pick, setups.length - 1) && styles.cardOn]}
                accessibilityRole="button"
                accessibilityLabel={`Setup ${s.letter}, ${s.title}. ${s.better.join('. ')}. Opens the full report.`}
              >
                <Text style={styles.cardTitle}>{`SETUP ${s.letter} · ${s.title.toUpperCase()}`}</Text>
                <Text style={styles.cardGoal}>{s.goalLine}</Text>
                {cardW > 40 ? <CardPlan s={s} w={cardW - 22} current={lay} desk={desk} /> : <View style={{ height: CARD_PLAN_H }} />}
                <Text style={styles.key}>{DRAWING_KEY}</Text>
                {s.better.map((b, k) => (
                  <Text key={k} style={styles.better}>{`▲ ${b}`}</Text>
                ))}
                <Text style={styles.link}>OPEN THE FULL REPORT ›</Text>
              </Pressable>
            ))}
            {result && !result.blocked
              ? result.missing.map((m) => (
                  <Text key={m.goal} style={styles.missing}>{m.text}</Text>
                ))
              : null}
            {result && !result.blocked && result.missing.length > 0 ? (
              <Caption>{`Only the setups that are really better are shown${setups.length ? '' : ' — none was found for this room and layout'}.`}</Caption>
            ) : null}
          </View>
        }
      >
        <Body>
          Each setup is a search over positions inside your walls. The lab tries a grid of seat and speaker positions, keeps only the ones a learner could use (inside the room, the speakers' woofers at least {fmtLen(0.2, units, { small: true })} from any wall and {fmtLen(FRONT_CLEAR_M, units, { small: true })} from the front wall, nothing standing in the furniture), and scores each one with the same model Explore and Review use. A setup is shown only when it beats your current layout on its own goal, adds no new “!” warning and no new placement problem, and is clearly different from the setups above it: the seat or a speaker at least {fmtLen(SETUP_MIN_DIFF_M, units, { small: true })} apart, or one moves the desk and the other does not.
        </Body>
        <Body>
          Smoother bass counts the length modes up to 150 Hz whose dip or peak your seat sits in (under 30% or over 70% of the mode's pressure: a little stricter than the Review page's 20% / 80%, so no setup wins by a hair). The first length mode, the lowest, counts first, then dips (EQ cannot fill them), then peaks. The usual starting point for the seat is about 35–40% of the room length — the “38% rule” — and the report says when this room does better elsewhere. Clearer stereo image keeps the pair symmetrical on the center line at 60°, tweeters at ear height, aimed at your ears, and then looks for the fewest strong early wall reflections. Least change makes the smallest moves that clear the Review page's “!” warnings and never moves the desk.
        </Body>
        <Caption>Bass and image setups may move the desk with your chair; the report says so, and trying one moves the desk for every kept layout, because the desk is part of the room.</Caption>
        <Caption>No setup is a guaranteed optimum. The search tries a grid of positions, not every position. The distances are to the woofer: leave the rear-port clearance your monitor's maker gives behind the cabinet. The model knows the room you entered, not the wall that flexes or the cupboard full of clothes, and it uses a generic speaker spread rather than your monitors' data. Try a setup, listen, and measure.</Caption>
        <Caption>{SAFETY_LEVEL_POINTER}</Caption>
      </RoomRackLayout>
      <SetupReport
        setup={reportOf != null ? setups[reportOf] ?? null : null}
        current={lay}
        currentDesk={desk}
        design={design}
        askOnOpen={askOnOpen}
        onClose={() => setReportOf(null)}
        onTry={(slot) => {
          const s = reportOf != null ? setups[reportOf] : null;
          if (s) tryIt(s, slot);
        }}
      />
    </>
  );
}

/** The Review page's "!" items among the flags. */
function countChecks(flags: FlagKey[]): number {
  return flags.filter((f) => FLAG_LEVEL[f] === 'check').length;
}

function CardPlan({ s, w, current, desk }: { s: Setup; w: number; current: Layout; desk: { x: number; y: number; w: number; d: number } | null }) {
  const a = useMemo(() => analyze(s.design), [s]);
  return (
    <View style={styles.cardPlan} pointerEvents="none">
      <RoomPlanView w={w} h={CARD_PLAN_H} design={s.design} analysis={a} layers={CARD_LAYERS} edit="none" ghost={{ layout: current, desk: s.deskMoved ? desk : null }} />
    </View>
  );
}

const styles = StyleSheet.create({
  reads: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  key: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16, color: colors.textSub },
  working: { fontFamily: fonts.barlowMedium, fontSize: 14, color: colors.amber },
  card: { borderRadius: 10, borderWidth: 1, borderColor: '#232329', backgroundColor: '#101014', padding: 10, gap: 6 },
  cardOn: { borderColor: colors.amber },
  cardTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.3, color: colors.amber },
  cardGoal: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  cardPlan: { borderRadius: 8, overflow: 'hidden', backgroundColor: '#08080a' },
  better: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18, color: colors.green },
  link: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.1, color: colors.cyanBright, marginTop: 2 },
  missing: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  tried: { borderRadius: 8, borderWidth: 1, borderColor: colors.green, backgroundColor: '#0d1510', padding: 10, gap: 6 },
  triedText: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
});
