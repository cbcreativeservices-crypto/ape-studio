/**
 * FieldRow — renders ONE schema field, whatever its kind.
 *
 * This component is the reason a stage is a data file. Every stage in both
 * production labs is drawn by this and nothing else, so authoring a new stage
 * never means writing a screen (plan §2.1).
 *
 * House rules honoured here: MIN_FONT 12 throughout, and the readiness tint is
 * CATEGORICAL — it must not borrow the blue→red amplitude ramp, which means
 * level in this app and would read as a measurement.
 */
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import type { ResolvedField } from '../../../features/production/schema';
import { STATUS_OPTIONS } from '../../../features/production/schema';
import type { FieldValue, ReadinessState, TableRow } from '../../../features/production/types';

/** Categorical state tints. Never the amplitude ramp. */
export const STATE_TINT: Record<ReadinessState, string> = {
  complete: colors.green,
  attention: colors.amber,
  missing: colors.textMuted,
  conflict: colors.red,
  na: colors.textMutedDeep,
};

export function FieldRow({
  field,
  value,
  naReason,
  state,
  onChange,
  onSetNa,
}: {
  field: ResolvedField;
  value: FieldValue | undefined;
  naReason?: string;
  state: ReadinessState;
  onChange: (v: FieldValue) => void;
  onSetNa: (reason: string) => void;
}) {
  const [naOpen, setNaOpen] = useState(false);
  const [naDraft, setNaDraft] = useState(naReason ?? '');
  const isNa = Boolean(naReason && naReason.trim());

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <View style={[styles.dot, { backgroundColor: STATE_TINT[state] }]} />
        <Text style={styles.label}>
          {field.label}
          {field.required ? <Text style={styles.req}> ·  required</Text> : null}
        </Text>
      </View>
      {field.help ? <Text style={styles.help}>{field.help}</Text> : null}

      {isNa ? (
        <View style={styles.naBox}>
          <Text style={styles.naText}>Not applicable — {naReason}</Text>
          <Pressable
            onPress={() => {
              onSetNa('');
              setNaDraft('');
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Undo not applicable for ${field.label}`}
          >
            <Text style={styles.naUndo}>UNDO</Text>
          </Pressable>
        </View>
      ) : (
        <Editor field={field} value={value} onChange={onChange} />
      )}

      {/* A justified skip is a DECISION, so it asks for a reason rather than
          offering a silent dismiss. readiness.ts only accepts it with one. */}
      {!isNa && field.allowNa !== false ? (
        naOpen ? (
          <View style={styles.naEdit}>
            <TextInput
              style={[styles.input, styles.naInput]}
              value={naDraft}
              onChangeText={setNaDraft}
              placeholder="Why does this not apply?"
              placeholderTextColor={colors.textMuted}
              accessibilityLabel={`Reason ${field.label} does not apply`}
            />
            <Pressable
              style={styles.naSave}
              onPress={() => {
                if (naDraft.trim()) {
                  onSetNa(naDraft.trim());
                  setNaOpen(false);
                }
              }}
              accessibilityRole="button"
              accessibilityLabel="Save reason"
            >
              <Text style={styles.naSaveText}>SAVE</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => setNaOpen(true)} hitSlop={6} accessibilityRole="button">
            <Text style={styles.naLink}>Not applicable to this project</Text>
          </Pressable>
        )
      ) : null}
    </View>
  );
}

function Editor({
  field,
  value,
  onChange,
}: {
  field: ResolvedField;
  value: FieldValue | undefined;
  onChange: (v: FieldValue) => void;
}) {
  switch (field.kind) {
    case 'longText':
      return (
        <TextInput
          style={[styles.input, styles.multiline]}
          value={typeof value === 'string' ? value : ''}
          onChangeText={onChange}
          placeholder={field.placeholder}
          placeholderTextColor={colors.textMuted}
          multiline
          accessibilityLabel={field.label}
        />
      );

    case 'number':
    case 'currency':
    case 'duration':
      return (
        <View style={styles.unitRow}>
          <TextInput
            style={[styles.input, styles.flex]}
            value={value === null || value === undefined ? '' : String(value)}
            onChangeText={(t) => {
              const cleaned = t.replace(/[^0-9.\-]/g, '');
              if (cleaned === '') return onChange(null);
              const n = Number(cleaned);
              onChange(Number.isFinite(n) ? n : cleaned);
            }}
            keyboardType="numeric"
            placeholder={field.placeholder}
            placeholderTextColor={colors.textMuted}
            accessibilityLabel={field.label}
          />
          {field.unit ? <Text style={styles.unit}>{field.unit}</Text> : null}
        </View>
      );

    case 'date':
      return (
        <TextInput
          style={styles.input}
          value={typeof value === 'string' ? value : ''}
          onChangeText={onChange}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={`${field.label}, year month day`}
        />
      );

    case 'choice':
    case 'status': {
      const options =
        field.kind === 'status'
          ? STATUS_OPTIONS.map((s) => ({ value: s, label: s }))
          : (field.options ?? []);
      return (
        <View style={styles.chips}>
          {options.map((o) => {
            const on = value === o.value;
            return (
              <Pressable
                key={o.value}
                style={[styles.chip, on && styles.chipOn]}
                onPress={() => onChange(on ? null : o.value)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={o.label}
              >
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{o.label}</Text>
              </Pressable>
            );
          })}
        </View>
      );
    }

    case 'multiChoice': {
      const chosen = Array.isArray(value) ? (value as string[]) : [];
      return (
        <View style={styles.chips}>
          {(field.options ?? []).map((o) => {
            const on = chosen.includes(o.value);
            return (
              <Pressable
                key={o.value}
                style={[styles.chip, on && styles.chipOn]}
                onPress={() => onChange(on ? chosen.filter((c) => c !== o.value) : [...chosen, o.value])}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={o.label}
              >
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{o.label}</Text>
              </Pressable>
            );
          })}
        </View>
      );
    }

    case 'table':
      return <TableEditor field={field} value={value} onChange={onChange} />;

    case 'text':
    default:
      return (
        <TextInput
          style={styles.input}
          value={typeof value === 'string' ? value : ''}
          onChangeText={onChange}
          placeholder={field.placeholder}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={field.label}
        />
      );
  }
}

/** Repeating rows — input lists, team members, budget lines. */
function TableEditor({
  field,
  value,
  onChange,
}: {
  field: ResolvedField;
  value: FieldValue | undefined;
  onChange: (v: FieldValue) => void;
}) {
  const rows: TableRow[] = Array.isArray(value) ? (value as TableRow[]) : [];
  const cols = field.columns ?? [];

  const setCell = (i: number, columnId: string, cell: string) => {
    const next = rows.map((r, n) => (n === i ? { ...r, [columnId]: cell } : r));
    onChange(next);
  };

  return (
    <View style={styles.table}>
      {rows.map((row, i) => (
        <View key={i} style={styles.tableRow}>
          <View style={styles.flex}>
            {cols.map((c) => (
              <View key={c.columnId} style={styles.cellRow}>
                <Text style={styles.cellLabel}>{c.label}</Text>
                <TextInput
                  style={[styles.input, styles.cellInput]}
                  value={row[c.columnId] === undefined || row[c.columnId] === null ? '' : String(row[c.columnId])}
                  onChangeText={(t) => setCell(i, c.columnId, t)}
                  keyboardType={c.kind === 'number' || c.kind === 'currency' ? 'numeric' : 'default'}
                  placeholderTextColor={colors.textMuted}
                  accessibilityLabel={`${c.label}, row ${i + 1}`}
                />
              </View>
            ))}
          </View>
          <Pressable
            onPress={() => onChange(rows.filter((_, n) => n !== i))}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Remove row ${i + 1}`}
          >
            <Text style={styles.rowRemove}>✕</Text>
          </Pressable>
        </View>
      ))}
      <Pressable
        style={styles.addRow}
        onPress={() => onChange([...rows, Object.fromEntries(cols.map((c) => [c.columnId, ''])) as TableRow])}
        accessibilityRole="button"
        accessibilityLabel={`Add a row to ${field.label}`}
      >
        <Text style={styles.addRowText}>+ ADD ROW</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 18 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 3 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  label: { flex: 1, fontFamily: fonts.barlowSemiBold, fontSize: 14, color: colors.textPrimary },
  req: { fontFamily: fonts.barlowRegular, fontSize: 12, color: colors.textMuted },
  help: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub, marginBottom: 7 },

  input: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 8,
    backgroundColor: '#131316',
    paddingHorizontal: 11,
    paddingVertical: 9,
    fontFamily: fonts.barlowRegular,
    fontSize: 14,
    color: colors.textPrimary,
  },
  multiline: { minHeight: 74, textAlignVertical: 'top' },
  flex: { flex: 1 },
  unitRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  unit: { fontFamily: fonts.barlowMedium, fontSize: 13, color: colors.textSub },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 7,
    paddingVertical: 7,
    paddingHorizontal: 11,
    backgroundColor: '#131316',
  },
  chipOn: { borderColor: colors.amber, backgroundColor: 'rgba(255,198,77,.13)' },
  chipText: { fontFamily: fonts.barlowMedium, fontSize: 12.5, color: colors.textSub },
  chipTextOn: { color: colors.amber },

  naBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.hairlineAlt,
    backgroundColor: '#111114',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  naText: { flex: 1, fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, fontStyle: 'italic' },
  naUndo: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.8, color: colors.amber },
  naLink: { fontFamily: fonts.barlowRegular, fontSize: 12, color: colors.textMuted, marginTop: 7 },
  naEdit: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 8 },
  naInput: { flex: 1 },
  naSave: {
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.5)',
    borderRadius: 7,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  naSaveText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.8, color: colors.amber },

  table: { gap: 10 },
  tableRow: { flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  cellRow: { marginBottom: 7 },
  cellLabel: { fontFamily: fonts.barlowMedium, fontSize: 12, color: colors.textSub, marginBottom: 3 },
  cellInput: { paddingVertical: 7 },
  rowRemove: { fontFamily: fonts.barlowMedium, fontSize: 15, color: colors.textMuted, paddingTop: 22 },
  addRow: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  addRowText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.textSub },
});
