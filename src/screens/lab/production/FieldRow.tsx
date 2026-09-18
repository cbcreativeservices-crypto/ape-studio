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
      return <NumberField field={field} value={value} onChange={onChange} />;

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

    /**
     * A clock time on the production day. Free text on purpose — `clockMinutes`
     * reads "16:00", "4pm" and "9:30am" alike, and a picker would be slower than
     * typing for someone laying out a day. The placeholder and the accessibility
     * label do the teaching instead.
     */
    case 'time':
      return (
        <TextInput
          style={styles.input}
          value={typeof value === 'string' ? value : ''}
          onChangeText={onChange}
          placeholder={field.placeholder ?? 'e.g. 16:00 or 4pm'}
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={`${field.label}, clock time`}
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

/**
 * One table cell, drawn according to its COLUMN KIND.
 *
 * ── WHY THIS EXISTS (fixed 2026-09-17) ───────────────────────────────────────
 *
 * Every cell used to be a bare TextInput, and `ColumnDef.options` was never
 * read. Across the two Production labs that is 74 `choice` columns, 3
 * `multiChoice`, 4 `status` and 11 `date` rendered as empty text boxes.
 *
 * That did not merely look wrong — it SILENTLY DEFEATED THE RULES, which is the
 * whole product. The engine compares exact machine values
 * (`cell(r, 'in_capture') === 'condenser_mic'`, `RATE()` returning null for
 * anything `Number()` cannot read), so a user typing "Condenser" or "48 kHz" —
 * the obviously correct answers — produced a row no rule could match, and the
 * readiness meter reported a healthy plan precisely because the user had filled
 * it in properly.
 *
 * `validateSeeds()` already existed to force authored seeds to use real option
 * values. The editor was simply never taught the same contract. Two independent
 * bug-hunting passes found it on the same day.
 */
function Cell({
  col,
  value,
  rowNum,
  onChange,
}: {
  col: NonNullable<ResolvedField['columns']>[number];
  value: TableRow[string];
  rowNum: number;
  onChange: (v: string) => void;
}) {
  const text = value === undefined || value === null ? '' : String(value);

  if (col.kind === 'choice' || col.kind === 'status') {
    const options =
      col.kind === 'status'
        ? STATUS_OPTIONS.map((o) => ({ value: o, label: o }))
        : (col.options ?? []);
    // A choice column with no options authored would render as nothing and trap
    // the user in an unfillable row — fall back to text rather than to a blank.
    if (options.length > 0) {
      return (
        <View style={styles.chips}>
          {options.map((o) => {
            const on = text === o.value;
            return (
              <Pressable
                key={o.value}
                style={[styles.chip, on && styles.chipOn]}
                onPress={() => onChange(on ? '' : o.value)}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${col.label}, ${o.label}, row ${rowNum}`}
              >
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{o.label}</Text>
              </Pressable>
            );
          })}
        </View>
      );
    }
  }

  if (col.kind === 'multiChoice' && (col.options?.length ?? 0) > 0) {
    // A TableRow cell is a scalar, so several picks are stored comma-separated
    // — which is exactly what the logic's `cellMany()` reads back.
    const picked = text
      .split(/[,;|]/)
      .map((t) => t.trim())
      .filter(Boolean);
    return (
      <View style={styles.chips}>
        {(col.options ?? []).map((o) => {
          const on = picked.includes(o.value);
          return (
            <Pressable
              key={o.value}
              style={[styles.chip, on && styles.chipOn]}
              onPress={() =>
                onChange(
                  (on ? picked.filter((v) => v !== o.value) : [...picked, o.value]).join(', '),
                )
              }
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              aria-checked={on}
              accessibilityLabel={`${col.label}, ${o.label}, row ${rowNum}`}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  const numeric = col.kind === 'number' || col.kind === 'currency';
  return (
    <TextInput
      style={[styles.input, styles.cellInput]}
      value={text}
      onChangeText={onChange}
      keyboardType={numeric ? 'numeric' : 'default'}
      placeholder={
        col.kind === 'date' ? 'YYYY-MM-DD' : col.kind === 'time' ? 'e.g. 16:00' : undefined
      }
      placeholderTextColor={colors.textMuted}
      autoCapitalize={col.kind === 'date' || col.kind === 'time' ? 'none' : 'sentences'}
      autoCorrect={!(col.kind === 'date' || col.kind === 'time')}
      accessibilityLabel={`${col.label}, row ${rowNum}`}
    />
  );
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
                <Cell
                  col={c}
                  value={row[c.columnId]}
                  rowNum={i + 1}
                  onChange={(v) => setCell(i, c.columnId, v)}
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

/**
 * A number, currency or duration field.
 *
 * ── WHY THIS IS NOT A ONE-LINE `onChangeText` ──────────────────────────
 *
 * It used to be, and A DECIMAL POINT COULD NOT BE TYPED (found 2026-09-17).
 * The input was value={String(value)} with a handler that did
 * `onChange(Number(cleaned))` on every keystroke — so typing "7." produced
 * Number("7.") = 7, the value became 7, the field re-rendered as "7", and the
 * point the user had just typed was gone before the next digit arrived.
 *
 * "7.5" hours was therefore recorded as 75. "1250.50" became 125050. It affects
 * 45 fields across the two production labs, it drives real rules, and it rides
 * into the exported packet, so nobody would see it as a typo — they would see a
 * budget or a runtime that was simply wrong.
 *
 * The fix is the standard one for a numeric text field: hold the text the user
 * is actually typing while they are typing it, and publish a number only when
 * the text is one. `draft` is the in-progress string and is dropped on blur, so
 * a value set from anywhere else (a seed, a reset, the other lab) still shows
 * through immediately.
 */
function NumberField({
  field,
  value,
  onChange,
}: {
  field: ResolvedField;
  value: FieldValue | undefined;
  onChange: (v: FieldValue) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const committed = value === null || value === undefined ? '' : String(value);

  return (
    <View style={styles.unitRow}>
      <TextInput
        style={[styles.input, styles.flex]}
        value={draft ?? committed}
        onChangeText={(t) => {
          // A COMMA IS NOT NOISE (2026-09-17, bug-hunt pass 4).
          //
          // This stripped every non-digit before looking at it, so a comma just
          // VANISHED: "1,5" — one and a half, to most of the world, and typed on
          // a keypad that puts a comma right there — was committed as 15. A
          // tenfold error, made on the keystroke, across 45 fields, and carried
          // into the client-facing packet. "12,000" became 12000, which is
          // right by luck rather than by rule.
          //
          // A comma between digits is now a decimal point when nothing else in
          // the field is, and a grouping separator when it is followed by three
          // digits. Ambiguity resolves towards the decimal reading, because a
          // grouping separator is cosmetic and a decimal point is not.
          let t2 = t;
          if (t2.includes(',') && !t2.includes('.')) {
            t2 = /(^|\D)\d{1,3}(,\d{3})+(\D|$)/.test(t2)
              ? t2.replace(/,/g, '') // 12,000 → 12000
              : t2.replace(',', '.'); // 1,5 → 1.5
          } else {
            t2 = t2.replace(/,/g, ''); // a comma beside a point is grouping
          }
          // One optional leading sign, digits, at most one point. Anything else
          // the keyboard or a paste produces is simply not accepted.
          let cleaned = t2.replace(/[^0-9.\-]/g, '');
          cleaned = (cleaned.startsWith('-') ? '-' : '') + cleaned.replace(/-/g, '');
          const firstDot = cleaned.indexOf('.');
          if (firstDot >= 0) {
            cleaned =
              cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '');
          }
          setDraft(cleaned);
          if (cleaned === '' || cleaned === '-' || cleaned === '.' || cleaned === '-.') {
            // Not a number yet — and an empty field means empty, not zero.
            onChange(null);
            return;
          }
          const n = Number(cleaned);
          // A trailing point ("7.") is a valid number to `Number` and an
          // in-progress one to the user; publish the number, keep showing the
          // point.
          onChange(Number.isFinite(n) ? n : null);
        }}
        onBlur={() => setDraft(null)}
        keyboardType="decimal-pad"
        placeholder={field.placeholder}
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={field.label}
      />
      {field.unit ? <Text style={styles.unit}>{field.unit}</Text> : null}
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
