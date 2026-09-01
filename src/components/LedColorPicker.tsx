/**
 * LedColorPicker — the MEMBER LED-meter colour modal (owner 2026-08-20/21;
 * "show, don't label" redesign 2026-09-01 — spec at
 * docs/APE_COLOR_PICKER_REDESIGN_SPEC_2026_09_01.md). One picker with TWO
 * targets on the tools' LED, each now a grouped card headed by a LIVE mini
 * meter showing exactly which pixels that card recolours:
 *   • LEVEL   — the moving loudness peak fill: a preset SCHEME or a flat colour.
 *   • AVERAGE — the average marker/level: a flat colour.
 * The white peak-hold cap is always left white (it's the reference reading) —
 * and the diagrams draw it white in every state so that promise is visible.
 *
 * Launched (members only) from a ColorWheelButton's onCustomize; the button
 * owns the entitlement gate + the "MEMBER FEATURE" popup for non-members, so
 * this modal is only ever shown to members. See [[customization-member-rule]].
 */
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Modal } from './DimModal';
import { SchemeSwatch } from './ColorWheelButton';
import { LedAvgDiagram, LedLevelDiagram, PickerSectionHeader } from './ColorTargetDiagrams';
import { SpectrumColorPicker } from './SpectrumColorPicker';
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
  const [spectrumFor, setSpectrumFor] = useState<null | 'level' | 'avg'>(null);
  // Transient wheel-drag candidate — feeds ONLY the diagram; USE commits.
  const [previewHex, setPreviewHex] = useState<string | null>(null);
  const levelHex = levelPref && levelPref.startsWith('#') ? levelPref : null;
  const closeSpectrum = () => {
    setSpectrumFor(null);
    setPreviewHex(null);
  };
  // Critique fix (design review 2026-09-01 #3): every dismissal resets the
  // spectrum sub-view too — otherwise reopening lands in the wheel with the
  // diagram showing a never-committed candidate colour.
  const handleClose = () => {
    closeSpectrum();
    onClose();
  };
  // NEW COPY (owner review): section subtitles — the plain-language "what this
  // colours" line beside each live diagram.
  const levelHeader = (diagramPref: string | null) => (
    <PickerSectionHeader diagram={<LedLevelDiagram pref={diagramPref} />} title="LEVEL" subtitle="The moving loudness fill" />
  );
  const avgHeader = (diagramTint: string | null) => (
    <PickerSectionHeader diagram={<LedAvgDiagram tint={diagramTint} />} title="AVERAGE MARKER" subtitle="The average-level line and its readout" />
  );
  return (
    <Modal accessibilityViewIsModal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.scrim} onPress={handleClose} accessible={false}>
        {/* Inner card: stop the backdrop tap so picking inside never closes. */}
        <Pressable style={styles.card} onPress={() => {}} accessibilityRole="none">
          <Text style={styles.title}>LED METER COLOUR</Text>
          {spectrumFor ? (
            <View style={styles.spectrumWrap}>
              {/* Keep the target's diagram in view while the wheel drags — the
                  candidate colour previews live, before USE commits. */}
              <View style={styles.spectrumHeader}>
                {spectrumFor === 'level' ? levelHeader(previewHex ?? levelHex) : avgHeader(previewHex ?? avgPref)}
              </View>
              <SpectrumColorPicker
                value={spectrumFor === 'level' ? levelHex : avgPref}
                onLiveChange={setPreviewHex}
                onPick={(c) => {
                  if (spectrumFor === 'level') onLevelPick(c);
                  else onAvgPick(c);
                  closeSpectrum();
                }}
              />
              <Pressable onPress={closeSpectrum} hitSlop={8} style={styles.doneBtn} accessibilityRole="button" accessibilityLabel="Back">
                <Text style={styles.doneText}>‹ BACK</Text>
              </Pressable>
            </View>
          ) : (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollInner} showsVerticalScrollIndicator={false}>
            {/* ── CARD 1 · LEVEL (the moving peak fill) ─────────────────── */}
            <View style={styles.sectionCard}>
              {levelHeader(levelPref)}
              <View style={styles.schemeGrid}>
                <Pressable
                  style={[styles.schemeChip, !levelPref && styles.chipSel]}
                  onPress={() => onLevelPick(null)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: !levelPref }}
                  accessibilityLabel="Loudness (default)"
                >
                  <SchemeSwatch stops={LOUDNESS_STOPS} w={68} h={26} />
                  <Text style={styles.schemeLabel}>Loudness</Text>
                  {/* NEW COPY (owner review): the governed default wears its tag. */}
                  <Text style={styles.defaultTag}>DEFAULT</Text>
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
                      <SchemeSwatch stops={s.stops} w={68} h={26} />
                      <Text style={styles.schemeLabel}>{s.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {/* NEW COPY (owner review): solids are a sub-option of the SAME
                  target, so they inherit the section diagram — no second drawing. */}
              <Text style={styles.subLabel}>SOLID COLOUR — one colour instead of a scheme</Text>
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
              <Pressable
                onPress={() => setSpectrumFor('level')}
                style={styles.spectrumBtn}
                accessibilityRole="button"
                accessibilityLabel="Custom level colour from the spectrum"
              >
                <Text style={styles.spectrumLink}>＋ SPECTRUM</Text>
              </Pressable>
            </View>

            {/* ── CARD 2 · AVERAGE MARKER ───────────────────────────────── */}
            <View style={styles.sectionCard}>
              {avgHeader(avgPref)}
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
              <Pressable
                onPress={() => setSpectrumFor('avg')}
                style={styles.spectrumBtn}
                accessibilityRole="button"
                accessibilityLabel="Custom average colour from the spectrum"
              >
                <Text style={styles.spectrumLink}>＋ SPECTRUM</Text>
              </Pressable>
            </View>

            <Text style={styles.note}>The white peak-hold cap keeps its reference colour.</Text>
          </ScrollView>
          )}
          {/* Critique fix #4: in spectrum view BACK is the only sensible
              action — two identically-chromed buttons stacked read ambiguous. */}
          {spectrumFor ? null : (
            <Pressable onPress={handleClose} hitSlop={8} style={styles.doneBtn} accessibilityRole="button" accessibilityLabel="Done">
              <Text style={styles.doneText}>DONE</Text>
            </Pressable>
          )}
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
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.8, color: colors.amber, textAlign: 'center', marginBottom: 10 },
  scroll: { flexGrow: 0 },
  scrollInner: { gap: 14, paddingBottom: 4 },
  spectrumWrap: { alignItems: 'center', gap: 6, paddingVertical: 6 },
  spectrumHeader: { alignSelf: 'stretch' },
  // The two grouped section cards — a lifted surface so the two targets read
  // as two OBJECTS instead of one run-on list.
  sectionCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#26262e',
    backgroundColor: '#17171c',
    padding: 12,
  },
  spectrumBtn: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start', paddingHorizontal: 4 },
  spectrumLink: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1.2, color: colors.amber },
  subLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.2, color: colors.textMuted, marginTop: 10, marginBottom: 6 },
  schemeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-start' },
  schemeChip: {
    // 76×3 + two 8pt gaps = 244 ≤ the 246pt card content width of a 360pt
    // phone (critique fix #2 — 88pt chips wrapped 2/2/1 with a dead rail).
    width: 76,
    // Uniform lattice (critique fix #1): the Loudness chip is taller (DEFAULT
    // tag), and flexWrap stretch made row 1 tall and row 2 short without this.
    // 74 ≥ the Loudness chip's measured height, so BOTH rows land identical.
    minHeight: 74,
    justifyContent: 'center',
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
  defaultTag: { fontFamily: fonts.oswaldSemiBold, fontSize: 8.5, letterSpacing: 1, color: colors.textMuted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, justifyContent: 'flex-start' },
  swatch: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#33333c', alignItems: 'center', justifyContent: 'center' },
  chipSel: { borderColor: '#ffffff', borderWidth: 3 },
  defText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 0.5, color: '#ffffff' },
  note: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 18, color: colors.textMuted, marginTop: 2 },
  doneBtn: {
    marginTop: 14,
    alignSelf: 'center',
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 28,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3a3a44',
    backgroundColor: '#1c1c22',
  },
  doneText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4, color: colors.textSecondary },
});
