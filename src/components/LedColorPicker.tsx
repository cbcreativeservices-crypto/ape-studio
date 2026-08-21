/**
 * LedColorPicker — the MEMBER LED-meter colour modal (owner 2026-08-20/21). One
 * picker with TWO targets on the tools' LED:
 *   • LEVEL   — the moving loudness peak fill: a preset SCHEME or a flat colour.
 *   • AVERAGE — the average marker/level: a flat colour.
 * The white peak-hold cap is always left white (it's the reference reading).
 *
 * Launched (members only) from a ColorWheelButton's onCustomize; the button
 * owns the entitlement gate + the "MEMBER FEATURE" popup for non-members, so
 * this modal is only ever shown to members. See [[customization-member-rule]].
 */
import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SchemeSwatch } from './ColorWheelButton';
import { LED_AVG_DEFAULT, LED_SCHEMES } from '../features/tools/ledScheme';
import { LOUDNESS_STOPS } from '../features/tools/levelColor';
import { WAVE_COLOR_SWATCHES } from '../features/tools/waveColorPref';
import { colors, fonts } from '../theme/tokens';

export function LedColorPicker({
  visible,
  onClose,
  levelPref,
  onLevelPick,
  avgPref,
  onAvgPick,
}: {
  visible: boolean;
  onClose: () => void;
  /** LEVEL pref: null = loudness ramp | scheme id | '#hex' flat. */
  levelPref: string | null;
  onLevelPick: (c: string | null) => void;
  /** AVERAGE-marker pref: null = default purple | '#hex' flat. */
  avgPref: string | null;
  onAvgPick: (c: string | null) => void;
}): ReactNode {
  const eq = (a: string | null, b: string) => !!a && a.toLowerCase() === b.toLowerCase();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
        {/* Inner card: stop the backdrop tap so picking inside never closes. */}
        <Pressable style={styles.card} onPress={() => {}} accessibilityRole="none">
          <Text style={styles.title}>LED METER COLOUR</Text>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollInner} showsVerticalScrollIndicator={false}>
            {/* ── LEVEL (the moving peak fill) ───────────────────────────── */}
            <Text style={styles.section}>LEVEL</Text>
            <View style={styles.schemeGrid}>
              <Pressable
                style={[styles.schemeChip, !levelPref && styles.chipSel]}
                onPress={() => onLevelPick(null)}
                accessibilityRole="button"
                accessibilityState={{ selected: !levelPref }}
                accessibilityLabel="Loudness (default)"
              >
                <SchemeSwatch stops={LOUDNESS_STOPS} />
                <Text style={styles.schemeLabel}>Loudness</Text>
              </Pressable>
              {LED_SCHEMES.map((s) => {
                const sel = levelPref === s.id;
                return (
                  <Pressable
                    key={s.id}
                    style={[styles.schemeChip, sel && styles.chipSel]}
                    onPress={() => onLevelPick(s.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: sel }}
                    accessibilityLabel={`${s.label} scheme`}
                  >
                    <SchemeSwatch stops={s.stops} />
                    <Text style={styles.schemeLabel}>{s.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.subLabel}>SOLID COLOUR</Text>
            <View style={styles.grid}>
              {WAVE_COLOR_SWATCHES.map((c) => {
                const sel = eq(levelPref, c);
                return (
                  <Pressable
                    key={`lvl-${c}`}
                    style={[styles.swatch, { backgroundColor: c }, sel && styles.chipSel]}
                    onPress={() => onLevelPick(c)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: sel }}
                    accessibilityLabel={`Level colour ${c}`}
                  />
                );
              })}
            </View>

            {/* ── AVERAGE (the average marker/level) ─────────────────────── */}
            <Text style={[styles.section, styles.sectionGap]}>AVERAGE MARKER</Text>
            <View style={styles.grid}>
              <Pressable
                style={[styles.swatch, { backgroundColor: LED_AVG_DEFAULT }, !avgPref && styles.chipSel]}
                onPress={() => onAvgPick(null)}
                accessibilityRole="button"
                accessibilityState={{ selected: !avgPref }}
                accessibilityLabel="Default average colour (purple)"
              >
                <Text style={styles.defText}>DEF</Text>
              </Pressable>
              {WAVE_COLOR_SWATCHES.map((c) => {
                const sel = eq(avgPref, c);
                return (
                  <Pressable
                    key={`avg-${c}`}
                    style={[styles.swatch, { backgroundColor: c }, sel && styles.chipSel]}
                    onPress={() => onAvgPick(c)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: sel }}
                    accessibilityLabel={`Average colour ${c}`}
                  />
                );
              })}
            </View>

            <Text style={styles.note}>Recolours the moving LED. The white peak-hold cap keeps its reference colour.</Text>
          </ScrollView>
          <Pressable onPress={onClose} hitSlop={8} style={styles.doneBtn} accessibilityRole="button" accessibilityLabel="Done">
            <Text style={styles.doneText}>DONE</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '86%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2b2b33',
    backgroundColor: '#141418',
    padding: 20,
  },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.8, color: colors.amber, textAlign: 'center', marginBottom: 6 },
  scroll: { flexGrow: 0 },
  scrollInner: { gap: 8, paddingBottom: 4 },
  section: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.4, color: colors.textSecondary, textAlign: 'center' },
  sectionGap: { marginTop: 12 },
  subLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.2, color: colors.textMuted, textAlign: 'center', marginTop: 2 },
  schemeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  schemeChip: {
    width: 104,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#33333c',
    backgroundColor: '#101014',
    padding: 3,
    alignItems: 'center',
    gap: 2,
    overflow: 'hidden',
  },
  schemeLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 0.8, color: colors.textSecondary, paddingBottom: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, justifyContent: 'center' },
  swatch: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#33333c', alignItems: 'center', justifyContent: 'center' },
  chipSel: { borderColor: '#ffffff', borderWidth: 3 },
  defText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 0.5, color: '#ffffff' },
  note: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 18, color: colors.textMuted, textAlign: 'center', marginTop: 8 },
  doneBtn: { marginTop: 14, alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 28, borderRadius: 10, borderWidth: 1, borderColor: '#3a3a44', backgroundColor: '#1c1c22' },
  doneText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4, color: colors.textSecondary },
});
