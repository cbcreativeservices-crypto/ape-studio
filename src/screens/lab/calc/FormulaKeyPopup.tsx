/**
 * FormulaKeyPopup — the per-formula key (owner 2026-08-13). The purple key
 * beside a calculator's formula opens THIS, unique to that one formula, instead
 * of the whole symbol key. It shows, top to bottom:
 *   1. the formula in symbols,
 *   2. the formula spelled out in plain English (words, no symbols),
 *   3. what the calculation does + each of its elements (variables), and
 *   4. only the symbol-key entries whose glyph appears in THIS formula.
 *
 * Sections 3 (element list) and 4 (symbol subset) are DERIVED from existing
 * data — the function's input fields + their `help`, and symbolsInFormula() —
 * so every one of the 163 formulas has a useful popup immediately. The prose
 * (2 and the lead of 3) is authored per function via `plainFormula` / `explain`.
 */
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../theme/tokens';
import type { CalcFunction, FieldDef } from './calcTypes';
import { symbolsInFormula } from './symbolsKey';
import { GlossaryTermPopup } from '../../../features/glossary/GlossaryTermPopup';
import { linkifyGlossary } from '../../../features/glossary/glossaryLink';
import { SuggestCorrectionButton } from '../../../features/study/SuggestCorrectionButton';

export function FormulaKeyPopup({
  fn,
  fields,
  workspaceName,
  onClose,
  onOpenFullKey,
}: {
  fn: CalcFunction | null;
  fields: FieldDef[];
  workspaceName?: string;
  onClose: () => void;
  onOpenFullKey: () => void;
}) {
  const [popupTerm, setPopupTerm] = useState<string | null>(null);
  if (!fn) return null;

  // Glossary hyper-links inside the popup's prose (owner 2026-08-13): the first
  // mention of any known glossary term becomes a tappable blue link opening the
  // in-place definition popup, returning to this spot.
  const renderGlossary = (text: string) =>
    linkifyGlossary(text).map((s, i) =>
      s.term ? (
        <Text key={i} style={styles.glossaryLink} suppressHighlighting onPress={() => setPopupTerm(s.term!)}>
          {s.text}
        </Text>
      ) : (
        <Text key={i}>{s.text}</Text>
      ),
    );

  const elements = fn.inputs
    .map((k) => fields.find((f) => f.key === k))
    .filter((f): f is FieldDef => !!f);
  const symbols = symbolsInFormula(fn.formula, fn.keySymbols);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.glyph} accessibilityElementsHidden importantForAccessibility="no">
              π
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>FORMULA KEY</Text>
              <Text style={styles.subtitle}>{fn.name}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.scroll}>
            {/* 1 — the formula, in symbols */}
            <Text style={styles.eyebrow}>THE FORMULA</Text>
            <View style={styles.formulaCard}>
              <Text style={styles.formula}>{fn.formula}</Text>
            </View>

            {/* 2 — spelled out in plain English */}
            {fn.plainFormula ? (
              <>
                <Text style={styles.eyebrow}>IN PLAIN ENGLISH</Text>
                <Text style={styles.plain}>{renderGlossary(fn.plainFormula)}</Text>
              </>
            ) : null}

            {/* 3 — what it calculates + its elements */}
            {fn.explain ? (
              <>
                <Text style={styles.eyebrow}>WHAT IT CALCULATES</Text>
                <Text style={styles.body}>{renderGlossary(fn.explain)}</Text>
              </>
            ) : null}
            {fn.note ? <Text style={styles.note}>{fn.note}</Text> : null}

            {elements.length ? (
              <>
                <Text style={styles.eyebrow}>FORMULA ELEMENTS</Text>
                {elements.map((f) => (
                  <View key={f.key} style={styles.elementRow}>
                    <Text style={styles.elementName}>{f.name}</Text>
                    {f.help ? <Text style={styles.elementHelp}>{renderGlossary(f.help)}</Text> : null}
                  </View>
                ))}
              </>
            ) : null}

            {/* 4 — only the symbols used in THIS formula, from the main key */}
            {symbols.length ? (
              <>
                <Text style={styles.eyebrow}>SYMBOLS USED HERE</Text>
                {symbols.map((e) => (
                  <Pressable
                    key={`${e.symbol}-${e.name}`}
                    style={styles.symbolRow}
                    onPress={e.glossaryTerm ? () => setPopupTerm(e.glossaryTerm!) : undefined}
                    accessibilityRole={e.glossaryTerm ? 'button' : undefined}
                    accessibilityLabel={e.glossaryTerm ? `${e.name} — open the glossary definition` : undefined}
                  >
                    <Text style={styles.symbol}>{e.symbol}</Text>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.symbolName}>{e.name}</Text>
                      <Text style={styles.symbolMeaning}>{e.meaning}</Text>
                      {e.glossaryTerm ? <Text style={styles.linkHint}>ⓘ TAP FOR GLOSSARY DEFINITION</Text> : null}
                    </View>
                  </Pressable>
                ))}
              </>
            ) : null}

            {/* Report a problem with THIS formula's popup — bottom-right, just
                above the full-key button (owner 2026-08-13). */}
            <SuggestCorrectionButton
              tag={fn.name}
              context={{
                Method: 'Calculator formula key',
                Workspace: workspaceName,
                Function: fn.name,
                Formula: fn.formula,
              }}
              style={styles.correctionBtn}
            />

            <Pressable
              onPress={onOpenFullKey}
              style={styles.fullKeyBtn}
              accessibilityRole="button"
              accessibilityLabel="Open the full symbol key"
            >
              <Text style={styles.fullKeyText}>π  OPEN THE FULL SYMBOL KEY  ›</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
      <GlossaryTermPopup termName={popupTerm} onClose={() => setPopupTerm(null)} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '88%',
    backgroundColor: colors.screenBg,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: 1,
    borderColor: '#2a2a30',
    paddingTop: 14,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 10 },
  glyph: { fontFamily: fonts.oswaldSemiBold, fontSize: 22, lineHeight: 26, color: colors.purple },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 1.2, color: colors.textPrimary },
  subtitle: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginTop: 1 },
  close: { fontFamily: fonts.oswaldSemiBold, fontSize: 18, color: colors.textSub, paddingHorizontal: 4 },
  scroll: { paddingHorizontal: 16, paddingBottom: 30, gap: 8 },

  eyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.3, color: colors.amber, marginTop: 12 },
  formulaCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a2a30',
    backgroundColor: '#101014',
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  formula: { fontFamily: fonts.mono, fontSize: 17, color: colors.textPrimary, textAlign: 'center' },
  plain: { fontFamily: fonts.barlowMedium, fontSize: 15, lineHeight: 22, color: colors.textPrimary },
  body: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 20, color: colors.textSecondary },
  // App glossary-link blue (matches GlossaryText / the glossary screen).
  glossaryLink: { color: '#9fbede', textDecorationLine: 'underline', textDecorationColor: 'rgba(159,190,222,0.4)' },
  note: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 18, color: colors.textSub, fontStyle: 'italic' },

  elementRow: {
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#242429',
    backgroundColor: '#131316',
    paddingVertical: 9,
    paddingHorizontal: 11,
    gap: 2,
  },
  elementName: { fontFamily: fonts.oswaldMedium, fontSize: 13.5, letterSpacing: 0.4, color: colors.textPrimary },
  elementHelp: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textSecondary },

  symbolRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262c',
    backgroundColor: '#131316',
    padding: 12,
  },
  symbol: { fontFamily: fonts.barlowSemiBold, fontSize: 22, color: colors.textPrimary, minWidth: 40, textAlign: 'center' },
  symbolName: { fontFamily: fonts.oswaldMedium, fontSize: 14, letterSpacing: 0.4, color: colors.textPrimary },
  symbolMeaning: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17.5, color: colors.textSecondary },
  linkHint: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 0.8, color: colors.cyanBright, marginTop: 3 },

  correctionBtn: { marginTop: 14, alignSelf: 'flex-end' },
  fullKeyBtn: {
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.purple,
    paddingVertical: 12,
    alignItems: 'center',
  },
  fullKeyText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 0.8, color: colors.purple },
});
