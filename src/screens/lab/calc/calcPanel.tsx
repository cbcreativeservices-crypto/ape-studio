/**
 * calcPanel — the SHARED calculator input/compute layer (Phase 3, owner spec
 * 2026-08-06). Extracted from CalcWorkspaceScreen so the workflow RUNNER reuses
 * the exact same field row and compute path as the standalone calculators —
 * one implementation, no fork, no formula duplication.
 *
 *  - FieldRow: one unit-aware input (help ⓘ, unit cycling, feasibility warn,
 *    optional accessory footer — the workspace screen puts the chain USE
 *    button there, the runner its import/override controls).
 *  - defaultUnitIdx / buildValues: field list → base-unit CalcValues (null
 *    until every input parses) — verbatim CalcWorkspaceScreen logic.
 *  - runCompute: guarded compute/steps/table for one function.
 *  - formatOutput: sig-figure display with unit cycling offset.
 */
import { memo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import type { CalcFunction, CalcTable, CalcValues, FieldDef, OutputVal } from './calcTypes';
import { fmt, parseList, unitsFor } from './calcUnits';

export function defaultUnitIdx(f: FieldDef): number {
  if (!f.defaultUnit) return 0;
  const units = unitsFor(f.quantity, f.unitIds);
  const i = units.findIndex((u) => u.id === f.defaultUnit);
  return i < 0 ? 0 : i;
}

/** Assemble base-unit values; null until every input parses. */
export function buildValues(
  fields: FieldDef[],
  raw: Record<string, string>,
  unitIdx: Record<string, number>,
): CalcValues | null {
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
}

export type ComputeResult = {
  outputs: OutputVal[];
  steps: string[];
  table: CalcTable | null;
  computeError: boolean;
};

/** Compute once, guarded — a throwing formula reports an error, never crashes. */
export function runCompute(fn: CalcFunction | null, values: CalcValues | null): ComputeResult {
  if (!fn || !values) return { outputs: [], steps: [], table: null, computeError: false };
  try {
    return {
      outputs: fn.compute(values),
      steps: fn.steps ? fn.steps(values) : [],
      table: fn.table ? fn.table(values) : null,
      computeError: false,
    };
  } catch {
    return { outputs: [], steps: [], table: null, computeError: true };
  }
}

/** Display string for a numeric output at `sig` figures; `unitOffset` cycles
 *  through the quantity's units (0 = the output's preferred unit). */
export function formatOutput(o: Extract<OutputVal, { value: number }>, sig: number, unitOffset: number): string {
  const units = unitsFor(o.quantity);
  const startIdx = o.unit ? Math.max(0, units.findIndex((u) => u.id === o.unit)) : 0;
  const u = units[(startIdx + unitOffset) % units.length];
  return `${fmt(u.fromBase(o.value), sig)}${u.label ? ' ' + u.label : ''}`;
}

/** The unit label a numeric output displays at `unitOffset`. */
export function outputUnitLabel(o: Extract<OutputVal, { value: number }>, unitOffset: number): string {
  const units = unitsFor(o.quantity);
  const startIdx = o.unit ? Math.max(0, units.findIndex((u) => u.id === o.unit)) : 0;
  return units[(startIdx + unitOffset) % units.length].label;
}

// ---------------------------------------------------------------------------
// FieldRow — one unit-aware input row (shared by workspace screen + runner)
// ---------------------------------------------------------------------------

export const FieldRow = memo(
  function FieldRow({
    field,
    raw,
    unitIdx,
    onText,
    onCycleUnit,
    onFocus,
    footer,
  }: {
    field: FieldDef;
    raw: string;
    unitIdx: number;
    onText: (t: string) => void;
    onCycleUnit: () => void;
    /** Fires when this input takes focus (owner 2026-08-07) so the host can
     *  pin the input block to the top of the screen, clear of the keyboard.
     *  Pass a STABLE reference — the memo below compares by identity. */
    onFocus?: () => void;
    /** Optional accessory under the input — chain USE (workspace) or the
     *  import/source controls (runner). Compared by REFERENCE in the memo. */
    footer?: ReactNode;
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
            <Pressable onPress={() => setShowHelp((s) => !s)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`About ${field.name}`}>
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
            onFocus={onFocus}
            accessibilityLabel={field.name}
          />
          {!isList && units.length > 0 && units[0].label !== '' ? (
            <Pressable
              style={styles.unitChip}
              onPress={onCycleUnit}
              disabled={units.length < 2}
              accessibilityRole="button"
              accessibilityLabel={`Unit ${unit.label}${units.length > 1 ? ', tap to change' : ''}`}
            >
              <Text style={styles.unitText}>{unit.label}{units.length > 1 ? ' ⇄' : ''}</Text>
            </Pressable>
          ) : null}
        </View>
        {footer ?? null}
        {warn ? <Text style={styles.warnText}>⚠ {warn}</Text> : null}
      </View>
    );
  },
  // Skip re-render unless THIS field's own inputs changed (perf fix 2026-08-05).
  // `footer` compares by reference — pass a stable/memoized node (or undefined).
  (prev, next) =>
    prev.field === next.field &&
    prev.raw === next.raw &&
    prev.unitIdx === next.unitIdx &&
    prev.onFocus === next.onFocus &&
    prev.footer === next.footer,
);

const styles = StyleSheet.create({
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
  warnText: { fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 17, color: '#ff9b8f' },
});
