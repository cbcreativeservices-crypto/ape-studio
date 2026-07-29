/**
 * CalcWorkspaceScreen — renders ONE calculator workspace (owner spec
 * 2026-07-29): function picker ("What are you trying to determine?"),
 * unit-aware inputs with feasibility warnings, live results with unit cycling
 * and significant-figure control, worked steps, formula, why-it-matters,
 * practical example, common mistakes, standards honesty block, glossary
 * terms, OS share sheet, and the Calculation Chain (SEND → / USE).
 */
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../../theme/tokens';
import type { RootStackParamList } from '../../../navigation/types';
import { LabChip } from '../LabShell';
import type { CalcValues, FieldDef, OutputVal, Workspace } from './calcTypes';
import { fmt, parseList, unitsFor } from './calcUnits';
import { getWorkspace } from './registry';
import { setChainValue, useChainValue } from './chainStore';

const SIGS = [3, 4, 5] as const;

function FieldRow({
  field,
  raw,
  unitIdx,
  onText,
  onCycleUnit,
  onUseChain,
  chainLabel,
}: {
  field: FieldDef;
  raw: string;
  unitIdx: number;
  onText: (t: string) => void;
  onCycleUnit: () => void;
  onUseChain: (() => void) | null;
  chainLabel: string | null;
}) {
  const [showHelp, setShowHelp] = useState(false);
  const units = unitsFor(field.quantity, field.unitIds);
  const unit = units[unitIdx % units.length];
  const isList = field.quantity === 'list';
  const baseVal = isList ? NaN : unit.toBase(parseFloat(raw));
  const warn = field.warn && Number.isFinite(baseVal) && field.warn.test(baseVal) ? field.warn.msg : null;
  return (
    <View style={styles.fieldRow}>
      <View style={styles.fieldHead}>
        <Text style={styles.fieldName}>{field.name}</Text>
        {field.help ? (
          <Pressable onPress={() => setShowHelp((s) => !s)} hitSlop={8}>
            <Text style={styles.helpGlyph}>ⓘ</Text>
          </Pressable>
        ) : null}
      </View>
      {showHelp && field.help ? <Text style={styles.helpText}>{field.help}</Text> : null}
      <View style={styles.inputLine}>
        <TextInput
          style={styles.input}
          value={raw}
          onChangeText={onText}
          placeholder={field.placeholder ?? (isList ? 'e.g. 8, 8, 4' : '0')}
          placeholderTextColor="#4c4d55"
          keyboardType={isList ? 'default' : 'numbers-and-punctuation'}
          autoCorrect={false}
        />
        {!isList && units.length > 0 && units[0].label !== '' ? (
          <Pressable style={styles.unitChip} onPress={onCycleUnit} disabled={units.length < 2}>
            <Text style={styles.unitText}>{unit.label}{units.length > 1 ? ' ⇄' : ''}</Text>
          </Pressable>
        ) : null}
      </View>
      {onUseChain && chainLabel ? (
        <Pressable style={styles.chainUse} onPress={onUseChain}>
          <Text style={styles.chainUseText}>⤵ USE {chainLabel}</Text>
        </Pressable>
      ) : null}
      {warn ? <Text style={styles.warnText}>⚠ {warn}</Text> : null}
    </View>
  );
}

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

  if (!ws) {
    return (
      <View style={styles.root}>
        <Text style={styles.body}>This calculator is not available.</Text>
      </View>
    );
  }
  const fn = ws.functions[Math.min(fnIdx, ws.functions.length - 1)];
  const fields = fn.inputs
    .map((k) => ws.fields.find((f) => f.key === k))
    .filter((f): f is FieldDef => !!f);

  // Assemble base-unit values; null until every input parses.
  const values: CalcValues | null = useMemo(() => {
    const out: CalcValues = {};
    for (const f of fields) {
      const text = raw[f.key] ?? '';
      if (f.quantity === 'list') {
        const arr = parseList(text);
        if (arr.length === 0) return null;
        out[f.key] = arr;
      } else {
        const units = unitsFor(f.quantity, f.unitIds);
        const u = units[(unitIdx[f.key] ?? defaultUnitIdx(f)) % units.length];
        const x = u.toBase(parseFloat(text));
        if (!Number.isFinite(x)) return null;
        out[f.key] = x;
      }
    }
    return out;
  }, [fields, raw, unitIdx]);

  function defaultUnitIdx(f: FieldDef): number {
    if (!f.defaultUnit) return 0;
    const units = unitsFor(f.quantity, f.unitIds);
    const i = units.findIndex((u) => u.id === f.defaultUnit);
    return i < 0 ? 0 : i;
  }

  let outputs: OutputVal[] = [];
  let steps: string[] = [];
  let table = null as ReturnType<NonNullable<typeof fn.table>> | null;
  let computeError = false;
  if (values) {
    try {
      outputs = fn.compute(values);
      steps = fn.steps ? fn.steps(values) : [];
      table = fn.table ? fn.table(values) : null;
    } catch {
      computeError = true;
    }
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
    const units = unitsFor(o.quantity);
    const startIdx = o.unit ? Math.max(0, units.findIndex((u) => u.id === o.unit)) : 0;
    const u = units[(startIdx + (outUnit[o.label] ?? 0) + extraIdx) % units.length];
    return `${fmt(u.fromBase(o.value), sig)}${u.label ? ' ' + u.label : ''}`;
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
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.body}>{ws.intro}</Text>

        <Text style={styles.eyebrow}>WHAT ARE YOU TRYING TO DETERMINE?</Text>
        <View style={styles.chipRow}>
          {ws.functions.map((f, i) => (
            <LabChip key={f.key} label={f.name.toUpperCase()} selected={i === fnIdx} onPress={() => { setFnIdx(i); setStepsOpen(false); }} />
          ))}
        </View>

        <View style={styles.panel}>
          {fields.map((f) => {
            const units = unitsFor(f.quantity, f.unitIds);
            const canChain = chain && chain.quantity === f.quantity && f.quantity !== 'list';
            return (
              <FieldRow
                key={f.key}
                field={f}
                raw={raw[f.key] ?? ''}
                unitIdx={unitIdx[f.key] ?? defaultUnitIdx(f)}
                onText={(t) => setRaw((r) => ({ ...r, [f.key]: t }))}
                onCycleUnit={() => setUnitIdx((u) => ({ ...u, [f.key]: ((u[f.key] ?? defaultUnitIdx(f)) + 1) % units.length }))}
                onUseChain={
                  canChain
                    ? () => {
                        const u = units[(unitIdx[f.key] ?? defaultUnitIdx(f)) % units.length];
                        setRaw((r) => ({ ...r, [f.key]: fmt(u.fromBase(chain.baseValue), 6) }));
                      }
                    : null
                }
                chainLabel={canChain ? chain.label : null}
              />
            );
          })}

          <View style={styles.sigRow}>
            <Text style={styles.sigLabel}>SIG. FIGURES</Text>
            {SIGS.map((s) => (
              <LabChip key={s} label={String(s)} selected={sig === s} onPress={() => setSig(s)} />
            ))}
          </View>

          {!values ? (
            <Text style={styles.caption}>Enter every value above to calculate.</Text>
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

        <Text style={styles.formula}>FORMULA   {fn.formula}</Text>
        {fn.note ? <Text style={styles.caption}>{fn.note}</Text> : null}
        {chain ? (
          <Text style={styles.chainBanner}>
            CHAIN: {chain.label} from {chain.fromWorkspace} is ready — any matching input offers “USE”.
          </Text>
        ) : null}

        <Text style={styles.eyebrow}>WHY THIS MATTERS</Text>
        <Text style={styles.body}>{ws.whyItMatters}</Text>
        <Text style={styles.eyebrow}>PRACTICAL EXAMPLE</Text>
        <Text style={styles.body}>{ws.example}</Text>
        <Text style={styles.eyebrow}>COMMON MISTAKES</Text>
        {ws.mistakes.map((m, i) => (
          <Text key={i} style={styles.mistake}>• {m}</Text>
        ))}
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
      </ScrollView>
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
