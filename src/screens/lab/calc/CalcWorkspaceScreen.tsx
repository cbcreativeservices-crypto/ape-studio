/**
 * CalcWorkspaceScreen — renders ONE calculator workspace (owner spec
 * 2026-07-29): function picker ("What are you trying to determine?"),
 * unit-aware inputs with feasibility warnings, live results with unit cycling
 * and significant-figure control, worked steps, formula, why-it-matters,
 * practical example, common mistakes, standards honesty block, glossary
 * terms, OS share sheet, and the Calculation Chain (SEND → / USE).
 */
import { useMemo, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from '../../../features/keyboard/keyboardControllerSafe';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../../theme/tokens';
import type { RootStackParamList } from '../../../navigation/types';
import { LabChip } from '../LabShell';
import type { CalcValues, FieldDef, OutputVal, Workspace } from './calcTypes';
import { fmt, unitsFor } from './calcUnits';
import { getWorkspace } from './registry';
import { setChainValue, useChainValue } from './chainStore';
import { useCalcSectionOpen } from './calcPrefs';
// Shared field row + compute path (Phase 3, owner 2026-08-06) — the SAME
// implementation the workflow runner uses. One panel, no fork.
import { FieldRow, buildValues, defaultUnitIdx, formatOutput, runCompute } from './calcPanel';

const SIGS = [3, 4, 5] as const;

export function CalcWorkspaceScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'CalcWorkspace'>>();
  const ws: Workspace | undefined = getWorkspace(route.params.id);
  const chain = useChainValue();

  const [fnIdx, setFnIdx] = useState(0);
  const [raw, setRaw] = useState<Record<string, string>>({});
  const [unitIdx, setUnitIdx] = useState<Record<string, number>>({});
  const [outUnit, setOutUnit] = useState<Record<string, number>>({});
  const [sig, setSig] = useState<number>(4);
  const [stepsOpen, setStepsOpen] = useState(false);
  // Persisted collapse state for the bottom explanation sections (owner 2026-08-05).
  const { open: secOpen, toggle: toggleSec } = useCalcSectionOpen();
  // Once the user starts entering values, hide the intro copy to free the upper
  // screen for inputs (owner 2026-08-05).
  const started = Object.values(raw).some((v) => (v ?? '').trim() !== '');

  // Derivations run UNCONDITIONALLY (hooks must never sit behind an early
  // return — owner 2026-08-05 stability fix; the previous order put a useMemo
  // after `if (!ws) return`, a Rules-of-Hooks violation that could wedge the
  // screen). The "not available" fallback renders below, after every hook.
  const fn = ws ? ws.functions[Math.min(fnIdx, ws.functions.length - 1)] : null;

  // Stable field list — recomputes only when the workspace/function changes, so
  // typing doesn't rebuild it (and the values memo below stays cheap).
  const fields = useMemo<FieldDef[]>(() => {
    if (!ws || !fn) return [];
    return fn.inputs.map((k) => ws.fields.find((f) => f.key === k)).filter((f): f is FieldDef => !!f);
  }, [ws, fn]);

  // Assemble base-unit values (shared path); null until every input parses.
  const values: CalcValues | null = useMemo(() => buildValues(fields, raw, unitIdx), [fields, raw, unitIdx]);

  // Compute once per (function, values) — NOT on every keystroke's re-render.
  const { outputs, steps, table, computeError } = useMemo(() => runCompute(fn, values), [fn, values]);

  if (!ws || !fn) {
    return (
      <View style={styles.root}>
        <Text style={styles.body}>This calculator is not available.</Text>
      </View>
    );
  }

  const shareResult = () => {
    if (!values) return;
    const lines = outputs.map((o) =>
      'value' in o ? `${o.label}: ${formatOut(o, 0)}` : `${o.label}: ${o.text}`,
    );
    Share.share({
      message: `${ws.name} — ${fn.name}\n${lines.join('\n')}\n(Pro Audio Training Academy · Calculator Lab)`,
    }).catch(() => {});
  };

  function formatOut(o: Extract<OutputVal, { value: number }>, extraIdx: number): string {
    return formatOutput(o, sig, (outUnit[o.label] ?? 0) + extraIdx);
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.title}>{ws.name.toUpperCase()}</Text>
          <Text style={styles.subtitle}>{ws.tagline}</Text>
        </View>
      </View>

      {/* Function picker — PINNED below the header so the top button row stays
          visible while the user works (owner 2026-08-05). */}
      <View style={styles.pinnedFns}>
        <Text style={styles.eyebrowTight}>WHAT ARE YOU TRYING TO DETERMINE?</Text>
        <View style={styles.chipRow}>
          {ws.functions.map((f, i) => (
            <LabChip key={f.key} label={f.name.toUpperCase()} selected={i === fnIdx} onPress={() => { setFnIdx(i); setStepsOpen(false); }} />
          ))}
        </View>
      </View>

      <KeyboardAwareScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" bottomOffset={24}>
        {/* Intro copy — hidden once the user begins entering values (owner
            2026-08-05: frees the upper screen for inputs). */}
        {!started ? <Text style={styles.body}>{ws.intro}</Text> : null}

        <View style={styles.panel}>
          {/* Inputs FIRST (owner 2026-08-05). */}
          {fields.map((f) => {
            const units = unitsFor(f.quantity, f.unitIds);
            const canChain = chain && chain.quantity === f.quantity && f.quantity !== 'list';
            // Chain USE rides the shared FieldRow's footer slot. Only rendered
            // while a chain value is armed (footer stays undefined otherwise so
            // the row's memo keeps skipping re-renders).
            const footer = canChain ? (
              <Pressable
                style={styles.chainUse}
                onPress={() => {
                  const u = units[(unitIdx[f.key] ?? defaultUnitIdx(f)) % units.length];
                  setRaw((r) => ({ ...r, [f.key]: fmt(u.fromBase(chain.baseValue), 6) }));
                }}
                accessibilityRole="button"
                accessibilityLabel={`Use ${chain.label} from the calculation chain`}
              >
                <Text style={styles.chainUseText}>⤵ USE {chain.label}</Text>
              </Pressable>
            ) : undefined;
            return (
              <FieldRow
                key={f.key}
                field={f}
                raw={raw[f.key] ?? ''}
                unitIdx={unitIdx[f.key] ?? defaultUnitIdx(f)}
                onText={(t) => setRaw((r) => ({ ...r, [f.key]: t }))}
                onCycleUnit={() => setUnitIdx((u) => ({ ...u, [f.key]: ((u[f.key] ?? defaultUnitIdx(f)) + 1) % units.length }))}
                footer={footer}
              />
            );
          })}

          {/* ANSWER — DIRECTLY under the inputs (owner 2026-08-05). Always shown:
              a labeled destination with a placeholder until every value is
              entered, then the live result. */}
          <View style={styles.resultPanel}>
            <Text style={styles.resultEyebrow}>YOUR ANSWER — {fn.name.toUpperCase()}</Text>
            {!values ? (
              <Text style={styles.resultPlaceholder}>
                Your answer appears here. Fill in the values above to calculate.
              </Text>
            ) : computeError ? (
              <Text style={styles.warnText}>⚠ These values don’t produce a valid result — check for zeros or reversed inputs.</Text>
            ) : (
              <View style={{ gap: 8 }}>
                {outputs.map((o) =>
                  'value' in o ? (
                    <View key={o.label} style={styles.resultRow}>
                      <Text style={styles.resultLabel}>{o.label}</Text>
                      <View style={styles.resultRight}>
                        <Pressable onPress={() => setOutUnit((m) => ({ ...m, [o.label]: (m[o.label] ?? 0) + 1 }))}>
                          <Text style={styles.resultValue}>{formatOut(o, 0)}</Text>
                        </Pressable>
                        {o.chainable !== false ? (
                          <Pressable
                            style={styles.sendBtn}
                            onPress={() => setChainValue({ label: o.label, quantity: o.quantity, baseValue: o.value, fromWorkspace: ws.name })}
                          >
                            <Text style={styles.sendText}>SEND →</Text>
                          </Pressable>
                        ) : null}
                      </View>
                    </View>
                  ) : (
                    <Text key={o.label} style={styles.resultNote}>
                      <Text style={styles.resultLabel}>{o.label}  </Text>
                      {o.text}
                    </Text>
                  ),
                )}
                {table ? (
                  <View style={styles.table}>
                    {table.title ? <Text style={styles.eyebrow}>{table.title}</Text> : null}
                    <View style={styles.tr}>
                      {table.cols.map((c) => (
                        <Text key={c} style={[styles.td, styles.th]}>{c}</Text>
                      ))}
                    </View>
                    {table.rows.map((r, i) => (
                      <View key={i} style={styles.tr}>
                        {r.map((c, j) => (
                          <Text key={j} style={styles.td}>{c}</Text>
                        ))}
                      </View>
                    ))}
                  </View>
                ) : null}
                {steps.length ? (
                  <Pressable onPress={() => setStepsOpen((s) => !s)}>
                    <Text style={styles.stepsToggle}>{stepsOpen ? '▾ WORKED STEPS' : '▸ WORKED STEPS'}</Text>
                  </Pressable>
                ) : null}
                {stepsOpen
                  ? steps.map((s, i) => (
                      <Text key={i} style={styles.stepText}>
                        {i + 1}. {s}
                      </Text>
                    ))
                  : null}
                <Pressable style={styles.shareBtn} onPress={shareResult}>
                  <Text style={styles.sendText}>SHARE / COPY RESULT</Text>
                </Pressable>
              </View>
            )}
          </View>

          <View style={styles.sigRow}>
            <Text style={styles.sigLabel}>SIG. FIGURES</Text>
            {SIGS.map((s) => (
              <LabChip key={s} label={String(s)} selected={sig === s} onPress={() => setSig(s)} />
            ))}
          </View>
        </View>

        <Text style={styles.formula}>FORMULA   {fn.formula}</Text>
        {fn.note ? <Text style={styles.caption}>{fn.note}</Text> : null}
        {chain ? (
          <Text style={styles.chainBanner}>
            CHAIN: {chain.label} from {chain.fromWorkspace} is ready — any matching input offers “USE”.
          </Text>
        ) : null}

        {/* Explanation sections — collapsible, default open, remembered per user
            (owner 2026-08-05). Tap a heading to collapse/expand. */}
        <Pressable onPress={() => toggleSec('why')} accessibilityRole="button" accessibilityState={{ expanded: secOpen.why }} accessibilityLabel="Why this matters">
          <Text style={styles.eyebrow}>{secOpen.why ? '▾' : '▸'} WHY THIS MATTERS</Text>
        </Pressable>
        {secOpen.why ? <Text style={styles.body}>{ws.whyItMatters}</Text> : null}

        <Pressable onPress={() => toggleSec('example')} accessibilityRole="button" accessibilityState={{ expanded: secOpen.example }} accessibilityLabel="Practical example">
          <Text style={styles.eyebrow}>{secOpen.example ? '▾' : '▸'} PRACTICAL EXAMPLE</Text>
        </Pressable>
        {secOpen.example ? <Text style={styles.body}>{ws.example}</Text> : null}

        <Pressable onPress={() => toggleSec('mistakes')} accessibilityRole="button" accessibilityState={{ expanded: secOpen.mistakes }} accessibilityLabel="Common mistakes">
          <Text style={styles.eyebrow}>{secOpen.mistakes ? '▾' : '▸'} COMMON MISTAKES</Text>
        </Pressable>
        {secOpen.mistakes
          ? ws.mistakes.map((m, i) => (
              <Text key={i} style={styles.mistake}>• {m}</Text>
            ))
          : null}
        {ws.warnings ? (
          <View style={styles.warnBlock}>
            <Text style={styles.warnBlockText}>{ws.warnings}</Text>
          </View>
        ) : null}
        <Text style={styles.eyebrow}>IN THE GLOSSARY</Text>
        <View style={styles.chipRow}>
          {ws.glossary.map((g) => (
            <View key={g} style={styles.glossChip}>
              <Text style={styles.glossText}>{g}</Text>
            </View>
          ))}
        </View>
        <Pressable
          onPress={() =>
            // Established hub idiom (ToolsHub): jump to the Glossary tab.
            navigation.navigate('Main', { screen: 'Study', params: { screen: 'Glossary' } } as never)
          }
        >
          <Text style={styles.glossLink}>OPEN THE GLOSSARY ›</Text>
        </Pressable>
        <Text style={styles.caption}>Full definitions, plain-English versions, and linked labs live there.</Text>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingBottom: 8 },
  back: { fontFamily: fonts.oswaldSemiBold, fontSize: 30, color: colors.textSub, marginTop: -4, paddingRight: 2 },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 1.2, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginTop: 1 },
  scroll: { padding: 16, paddingBottom: 34, gap: 10 },
  eyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.4, color: colors.amber, marginTop: 6 },
  // Pinned function-picker bar below the header (owner 2026-08-05).
  pinnedFns: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e22',
    backgroundColor: colors.screenBg,
  },
  eyebrowTight: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.4, color: colors.amber },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  panel: { gap: 10, borderRadius: 10, borderWidth: 1, borderColor: '#26262c', backgroundColor: '#131316', padding: 12 },
  fieldRow: { gap: 4 },
  fieldHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fieldName: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.2, color: colors.textSecondary },
  helpGlyph: { fontFamily: fonts.barlowMedium, fontSize: 13, color: colors.textSub },
  helpText: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  inputLine: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#45495a',
    backgroundColor: '#22242e',
    color: colors.textPrimary,
    fontFamily: fonts.barlowMedium,
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  unitChip: { borderRadius: 8, borderWidth: 1.5, borderColor: '#45495a', paddingHorizontal: 10, paddingVertical: 9, backgroundColor: '#2a2c36' },
  unitText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.6, color: colors.amber },
  chainUse: { alignSelf: 'flex-start', borderRadius: 7, borderWidth: 1, borderColor: '#245a34', backgroundColor: '#10241a', paddingHorizontal: 9, paddingVertical: 5 },
  chainUseText: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 0.8, color: '#5bff85' },
  warnText: { fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 17, color: '#ff9b8f' },
  // Answer destination — pinned at the top of the panel (owner 2026-08-05).
  resultPanel: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.4)',
    backgroundColor: '#17140c',
    padding: 10,
    gap: 6,
  },
  resultEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.2, color: colors.amber },
  resultPlaceholder: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, color: colors.textSub },
  sigRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sigLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 1.1, color: colors.textSub },
  resultRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  resultLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 0.9, color: colors.textSecondary, flexShrink: 1 },
  resultRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resultValue: { fontFamily: fonts.oswaldMedium, fontSize: 19, letterSpacing: 0.4, color: colors.amber },
  resultNote: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, color: colors.textSecondary },
  sendBtn: { borderRadius: 7, borderWidth: 1, borderColor: '#2c2c33', paddingHorizontal: 8, paddingVertical: 5, backgroundColor: '#17171c' },
  sendText: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 0.8, color: colors.textSecondary },
  shareBtn: { alignSelf: 'flex-start', borderRadius: 8, borderWidth: 1, borderColor: '#2c2c33', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#17171c', marginTop: 2 },
  stepsToggle: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1, color: colors.textSecondary },
  stepText: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  formula: { fontFamily: fonts.mono, fontSize: 13, color: colors.textPrimary },
  chainBanner: { fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 17, color: '#5bff85' },
  mistake: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  warnBlock: { borderLeftWidth: 3, borderLeftColor: colors.amber, backgroundColor: '#151310', borderRadius: 6, padding: 10, marginTop: 4 },
  warnBlockText: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 18, color: colors.textSecondary },
  table: { gap: 3, marginTop: 4 },
  tr: { flexDirection: 'row', gap: 6 },
  th: { color: colors.amber, fontFamily: fonts.oswaldSemiBold, fontSize: 10.5 },
  td: { flex: 1, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 17, color: colors.textSecondary },
  glossChip: { borderRadius: 7, borderWidth: 1, borderColor: '#2c2c33', paddingHorizontal: 9, paddingVertical: 5, backgroundColor: '#141419' },
  glossText: { fontFamily: fonts.barlowMedium, fontSize: 12, color: colors.textSecondary },
  glossLink: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1, color: colors.amber, marginTop: 2 },
});
