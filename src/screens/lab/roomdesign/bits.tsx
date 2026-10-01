/**
 * bits — the small shared pieces of the Room Design & Monitoring Lab's wells
 * and trays: tier tags, observation rows, a numeric entry field, chip rows.
 * Nothing under 9 pt; nothing auto-appears.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import { type Suggestion, type Tier, TIER_NOTE } from './roomModel';

export const TIER_COLOR: Record<Tier, string> = {
  CALCULATED: colors.cyanBright,
  ESTIMATED: colors.amber,
  MEASURED: colors.green,
};

/** The honesty tag on a readout group or a section heading. */
export function TierTag({ tier, compact }: { tier: Tier; compact?: boolean }) {
  return (
    <View style={[styles.tag, { borderColor: TIER_COLOR[tier] }]} accessibilityLabel={`${tier}: ${TIER_NOTE[tier]}`}>
      <Text style={[styles.tagText, { color: TIER_COLOR[tier] }]}>{tier}</Text>
      {compact ? null : <Text style={styles.tagNote}> · {TIER_NOTE[tier]}</Text>}
    </View>
  );
}

export function SectionTitle({ title, tier, children }: { title: string; tier?: Tier; children?: ReactNode }) {
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {tier ? <TierTag tier={tier} compact /> : null}
      {children}
    </View>
  );
}

export function Body({ children }: { children: ReactNode }) {
  return <Text style={styles.body}>{children}</Text>;
}

export function Caption({ children }: { children: ReactNode }) {
  return <Text style={styles.caption}>{children}</Text>;
}

export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

/** A suggestion / observation row: tier tag, level glyph, text. */
export function SuggestionRow({ s }: { s: Suggestion }) {
  const glyph = s.level === 'ok' ? '✓' : s.level === 'try' ? '▸' : '!';
  const col = s.level === 'ok' ? colors.green : s.level === 'try' ? colors.amber : '#ff8a5c';
  return (
    <View style={styles.sugRow}>
      <Text style={[styles.sugGlyph, { color: col }]}>{glyph}</Text>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={styles.sugText}>{s.text}</Text>
        <Text style={[styles.sugTier, { color: TIER_COLOR[s.tier] }]}>{s.tier}</Text>
      </View>
    </View>
  );
}

/** A key / value line for the review sections. */
export function KV({ k, v, tint }: { k: string; v: string; tint?: string }) {
  return (
    <View style={styles.kv}>
      <Text style={styles.kvK}>{k}</Text>
      <Text style={[styles.kvV, tint ? { color: tint } : null]}>{v}</Text>
    </View>
  );
}

/** A numeric entry: commits on blur / submit; shows the current value when
 *  the field is not being edited. The caller owns the unit conversion. */
export function NumField({
  label,
  value,
  unit,
  onCommit,
  placeholder,
  width = 92,
}: {
  label: string;
  value: number | null;
  unit: string;
  onCommit: (v: number) => void;
  placeholder?: string;
  width?: number;
}) {
  const shown = value == null || !Number.isFinite(value) ? '' : String(Math.round(value * 100) / 100);
  const [text, setText] = useState(shown);
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    if (!editing) setText(shown);
  }, [shown, editing]);
  const commit = () => {
    setEditing(false);
    const v = Number(text.replace(',', '.'));
    if (Number.isFinite(v) && v > 0) onCommit(v);
    else setText(shown);
  };
  return (
    <View style={styles.numField}>
      <Text style={styles.numLabel}>{label}</Text>
      <View style={styles.numRow}>
        <TextInput
          style={[styles.numInput, { width }]}
          value={text}
          onChangeText={setText}
          onFocus={() => setEditing(true)}
          onBlur={commit}
          onSubmitEditing={commit}
          keyboardType="decimal-pad"
          placeholder={placeholder}
          placeholderTextColor="#55575f"
          accessibilityLabel={`${label} in ${unit}`}
          returnKeyType="done"
        />
        <Text style={styles.numUnit}>{unit}</Text>
      </View>
    </View>
  );
}

/** A row of choice chips. */
export function Chips<T extends string>({ items, value, onPick }: { items: readonly { id: T; label: string }[]; value: T | null; onPick: (id: T) => void }) {
  return (
    <View style={styles.chips}>
      {items.map((it) => {
        const on = value === it.id;
        return (
          <Pressable key={it.id} onPress={() => onPick(it.id)} style={[styles.chip, on && styles.chipOn]} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={it.label}>
            <Text style={[styles.chipText, on && styles.chipTextOn]}>{it.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function TrayHeading({ children }: { children: ReactNode }) {
  return <Text style={styles.trayHead}>{children}</Text>;
}

/** A plain action key for trays (never a platform Alert behind it). */
export function TrayButton({ label, onPress, tint = 'amber', disabled }: { label: string; onPress: () => void; tint?: 'amber' | 'green' | 'dim'; disabled?: boolean }) {
  const col = tint === 'green' ? colors.green : tint === 'dim' ? colors.textSub : colors.amber;
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.trayBtn, { borderColor: col }, disabled && { opacity: 0.4 }]} accessibilityRole="button" accessibilityLabel={label}>
      <Text style={[styles.trayBtnText, { color: col }]}>{label}</Text>
    </Pressable>
  );
}

export const SAFETY_LEVEL_NOTE =
  'Set your monitoring level with an SPL meter, not by feel: around 75–85 dB C-weighted at the listening position is the usual range for long sessions, and loud bass passages push higher. Hearing damage is cumulative and permanent — turn down before you chase bass by turning up.';

const styles = StyleSheet.create({
  tag: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, flexWrap: 'wrap' },
  tagText: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.3 },
  tagNote: { fontFamily: fonts.barlowRegular, fontSize: 11.5, color: colors.textSub },
  sectionHead: { gap: 6, marginTop: 4 },
  sectionTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4, color: colors.amber },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14.5, lineHeight: 21, color: colors.textSecondary },
  caption: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSub },
  card: { borderRadius: 10, borderWidth: 1, borderColor: '#232329', backgroundColor: '#101014', padding: 12, gap: 8 },
  sugRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingVertical: 4 },
  sugGlyph: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, width: 14, textAlign: 'center', lineHeight: 20 },
  sugText: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.textSecondary },
  sugTier: { fontFamily: fonts.oswaldSemiBold, fontSize: 9.5, letterSpacing: 1.2 },
  kv: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, paddingVertical: 2 },
  kvK: { fontFamily: fonts.barlowRegular, fontSize: 13, color: colors.textSub, flexShrink: 1 },
  kvV: { fontFamily: fonts.mono, fontSize: 13, color: colors.amber, textAlign: 'right' },
  numField: { gap: 3 },
  numLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.2, color: colors.textSub },
  numRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  numInput: { fontFamily: fonts.mono, fontSize: 15, color: colors.amber, borderWidth: 1, borderColor: '#2c2c33', borderRadius: 8, backgroundColor: '#0c0c0f', paddingHorizontal: 10, paddingVertical: 8 },
  numUnit: { fontFamily: fonts.barlowMedium, fontSize: 13, color: colors.textSub },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1, borderColor: '#2c2c33', borderRadius: 8, backgroundColor: '#101114', paddingHorizontal: 10, paddingVertical: 7, minHeight: 36, justifyContent: 'center' },
  chipOn: { borderColor: colors.amber, backgroundColor: '#1d1709' },
  chipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 0.8, color: colors.textSubAlt },
  chipTextOn: { color: colors.amber },
  trayHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.4, color: colors.textSub, marginTop: 4 },
  trayBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, minHeight: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: '#101114' },
  trayBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1 },
});
