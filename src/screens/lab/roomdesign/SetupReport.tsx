/**
 * SetupReport — the detailed report a SUGGESTED SETUPS card opens (owner
 * request 2026-11-14: "a brief description that then open up into more
 * detailed report"). A centered popup, never a pulldown (DimModal, so the
 * Low-Light wash and every orientation come with it):
 *   the setup drawn large with the current positions faint beneath it ·
 *   WHAT TO MOVE · BEFORE → AFTER (each row with its honesty tier) ·
 *   WHY IT IS BETTER · TRADE-OFFS · the measure line · TRY THIS SETUP.
 * TRY THIS SETUP asks before it replaces a kept position (owner Q3); the ask
 * is inline in the popup, never a second dialog on top of it.
 */
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Modal } from '../../../components/DimModal';
import { colors, fonts } from '../../../theme/tokens';
import { RoomPlanView, type PlanLayers } from './RoomPlanView';
import { TIER_COLOR, TrayButton } from './bits';
import { analyze, type Layout, type RoomDesign } from './roomModel';
import { freeTrySlot, type Setup, type SetupRow, type TrySlot } from './suggestSetups';

export type { TrySlot };


/** A row's verdict: better / worse; "same" only when the two values read
 *  the same; nothing for a row that only informs (the seat %, a distance the
 *  goal does not judge). */
export function rowMark(r: Pick<SetupRow, 'before' | 'after' | 'better'>): string | null {
  if (r.better === true) return '✓ better';
  if (r.better === false) return '▼ worse';
  return r.before === r.after ? '= same' : null;
}

export const MEASURE_LINE = 'The model shows where problems are LIKELY; only a measurement shows what your room does. Try the setup, listen, and measure before you move furniture for good.';

const REPORT_LAYERS: PlanLayers = { triangle: true, boundaries: false, reflections: false, modes: false, dims: true, treatment: true };

export function SetupReport({
  setup,
  current,
  currentDesk,
  design,
  onClose,
  onTry,
  askOnOpen = false,
}: {
  setup: Setup | null;
  /** The positions being edited now (drawn faintly under the setup). */
  current: Layout;
  currentDesk: { x: number; y: number; w: number; d: number } | null;
  design: RoomDesign;
  onClose: () => void;
  onTry: (slot: TrySlot) => void;
  /** Opened from the dock's TRY with both slots full: show the ask at once. */
  askOnOpen?: boolean;
}) {
  const { width, height } = useWindowDimensions();
  const [asking, setAsking] = useState(false);
  useEffect(() => {
    setAsking(!!setup && !!askOnOpen);
  }, [setup, askOnOpen]);
  const cardW = Math.min(560, width - 32);
  const planW = cardW - 28;
  const planH = Math.round(Math.min(320, planW * 0.85, height * 0.42));
  const analysis = useMemo(() => (setup ? analyze(setup.design) : null), [setup]);
  const free = freeTrySlot(design);
  const close = () => {
    setAsking(false);
    onClose();
  };
  return (
    <Modal accessibilityViewIsModal visible={!!setup} transparent animationType="fade" onRequestClose={close}>
      <Pressable accessible={false} style={styles.backdrop} onPress={close}>
        <Pressable accessible={false} style={[styles.sheet, { width: cardW, maxHeight: height * 0.9 }]} onPress={() => {}}>
          {setup && analysis ? (
            <>
              <View style={styles.head}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.title} accessibilityRole="header">{`SETUP ${setup.letter} · ${setup.title.toUpperCase()}`}</Text>
                  <Text style={styles.goal}>{setup.goalLine}</Text>
                </View>
                <Pressable onPress={close} hitSlop={10} style={styles.close} accessibilityRole="button" accessibilityLabel="Close the report">
                  <Text style={styles.closeText}>✕</Text>
                </Pressable>
              </View>
              <ScrollView contentContainerStyle={styles.body}>
                <View style={styles.plan}>
                  <RoomPlanView w={planW} h={planH} design={setup.design} analysis={analysis} layers={REPORT_LAYERS} edit="none" ghost={{ layout: current, desk: setup.deskMoved ? currentDesk : null }} />
                </View>
                <Text style={styles.key}>Bright: this setup. Faint and dashed: where everything stands now.</Text>

                <Text style={styles.h}>WHAT TO MOVE</Text>
                <Text style={styles.small}>Left and right are as you sit facing the speakers.</Text>
                {setup.moves.map((m, i) => (
                  <Text key={i} style={styles.bullet}>{`• ${m}`}</Text>
                ))}

                <Text style={styles.h}>BEFORE → AFTER</Text>
                <View style={styles.table}>
                  {setup.rows.map((r, i) => (
                    <View key={i} style={[styles.row, i > 0 && styles.rowRule]}>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={styles.rowLabel}>{r.label}</Text>
                        <Text style={[styles.rowTier, { color: TIER_COLOR[r.tier] }]}>{r.tier}</Text>
                      </View>
                      <View style={styles.rowVals}>
                        <Text style={styles.rowVal}>{`${r.before} → ${r.after}`}</Text>
                        {rowMark(r) ? (
                          <Text style={[styles.rowMark, { color: r.better === true ? colors.green : r.better === false ? '#ff8a5c' : colors.textSub }]}>{rowMark(r)}</Text>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>

                <Text style={styles.h}>WHY IT IS BETTER</Text>
                {setup.why.map((w, i) => (
                  <Text key={i} style={styles.para}>{w}</Text>
                ))}

                <Text style={styles.h}>TRADE-OFFS</Text>
                {setup.tradeoffs.map((t, i) => (
                  <Text key={i} style={styles.bullet}>{`• ${t}`}</Text>
                ))}

                <Text style={styles.measure}>{MEASURE_LINE}</Text>

                {asking ? (
                  <View style={styles.ask}>
                    <Text style={styles.para}>OPTION A and OPTION B already hold positions. Which one should this setup replace? START is never touched.</Text>
                    <View style={styles.btnRow}>
                      <TrayButton label="REPLACE OPTION A" onPress={() => { setAsking(false); onTry('Option A'); }} />
                      <TrayButton label="REPLACE OPTION B" onPress={() => { setAsking(false); onTry('Option B'); }} />
                      <TrayButton label="CANCEL" tint="dim" onPress={() => setAsking(false)} />
                    </View>
                  </View>
                ) : (
                  <View style={styles.btnRow}>
                    <TrayButton label="TRY THIS SETUP" tint="green" onPress={() => (free ? onTry(free) : setAsking(true))} />
                    <TrayButton label="CLOSE" tint="dim" onPress={close} />
                  </View>
                )}
                <Text style={styles.small}>{free ? `TRY THIS SETUP puts it in ${free.toUpperCase()} beside START and shows it; your own positions stay where they are.` : 'TRY THIS SETUP asks which kept position to replace; START stays as it is.'}</Text>
              </ScrollView>
            </>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  sheet: { borderRadius: 14, borderWidth: 1, borderColor: '#2c2c33', backgroundColor: '#0e0e12', overflow: 'hidden' },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#232329' },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 1.3, color: colors.amber },
  goal: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  close: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#2c2c33', alignItems: 'center', justifyContent: 'center' },
  closeText: { fontFamily: fonts.barlowMedium, fontSize: 16, color: colors.textSecondary },
  body: { padding: 14, gap: 8, paddingBottom: 22 },
  plan: { borderRadius: 10, overflow: 'hidden', backgroundColor: '#08080a', alignSelf: 'center' },
  key: { fontFamily: fonts.barlowRegular, fontSize: 12, color: colors.textSub },
  h: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.4, color: colors.amber, marginTop: 8 },
  bullet: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  para: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  table: { borderRadius: 10, borderWidth: 1, borderColor: '#232329', backgroundColor: '#101014', paddingHorizontal: 10 },
  row: { flexDirection: 'row', gap: 10, paddingVertical: 8, alignItems: 'flex-start' },
  rowRule: { borderTopWidth: 1, borderTopColor: '#1d1d22' },
  rowLabel: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSecondary },
  rowTier: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 1.1 },
  rowVals: { alignItems: 'flex-end', gap: 2, maxWidth: '48%' },
  rowVal: { fontFamily: fonts.mono, fontSize: 12.5, color: colors.amber, textAlign: 'right' },
  rowMark: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1 },
  measure: { fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 17, color: colors.green, marginTop: 8 },
  ask: { gap: 8, marginTop: 6 },
  btnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  small: { fontFamily: fonts.barlowRegular, fontSize: 11.5, lineHeight: 16, color: colors.textSub },
});
