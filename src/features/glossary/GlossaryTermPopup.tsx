/**
 * GlossaryTermPopup — a lightweight, self-contained glossary definition popup
 * (owner 2026-08-07) for surfacing a term WITHOUT leaving the current screen.
 *
 * Built for the calculator ↔ glossary round-trip: tapping a term chip inside a
 * Calc Lab workspace shows this overlay, and because it is a transparent Modal
 * layered over the caller (never a navigation push), the caller's state — the
 * user's calculator inputs and scroll position — is preserved for free. Closing
 * returns the user to their exact spot.
 *
 * It fetches only the public fields (term, definition, plain-English) by NAME,
 * case-insensitively (calculator glossary lists carry display names, not ids).
 * For the full detail — Purpose, Common Mistakes, linked labs — the caller keeps
 * its "OPEN THE GLOSSARY ›" link to the Glossary tab.
 */
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme/tokens';
import { supabase } from '../../lib/supabase';

type Row = { id: string; term: string; definition: string | null; plain_english: string | null };

export function GlossaryTermPopup({
  termName,
  onClose,
}: {
  /** The term to show, or null when the popup is closed. */
  termName: string | null;
  onClose: () => void;
}) {
  const [row, setRow] = useState<Row | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!termName) {
      setRow(null);
      setNotFound(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    setNotFound(false);
    setRow(null);
    (async () => {
      // Case-insensitive exact match on the display name. `ilike` with no
      // wildcards is an exact, case-folded compare — the calculator lists and
      // the glossary rows disagree on casing ('Sound pressure level' vs
      // 'Sound Pressure Level'), so a `=` would miss.
      const { data } = await supabase
        .from('glossary')
        .select('id, term, definition, plain_english')
        .ilike('term', termName)
        .limit(1);
      if (cancelled) return;
      const hit = (data && data[0]) as Row | undefined;
      if (hit) setRow(hit);
      else setNotFound(true);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [termName]);

  return (
    <Modal visible={termName != null} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* Inner press swallows taps so tapping the card doesn't dismiss. */}
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.headerRow}>
            <Text style={styles.term} accessibilityRole="header">
              {row?.term ?? termName}
            </Text>
            <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>
          <Text style={styles.source}>Pro Audio Training Academy Glossary</Text>
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {loading ? <ActivityIndicator color={colors.amber} style={styles.spinner} /> : null}
            {notFound ? <Text style={styles.muted}>No glossary entry was found for this term.</Text> : null}
            {row?.definition?.trim() ? <Text style={styles.def}>{row.definition.trim()}</Text> : null}
            {row?.plain_english?.trim() ? (
              <>
                <Text style={styles.eyebrow}>PLAIN ENGLISH</Text>
                <Text style={styles.def}>{row.plain_english.trim()}</Text>
              </>
            ) : null}
          </ScrollView>
          <Pressable onPress={onClose} style={styles.doneBtn} accessibilityRole="button" accessibilityLabel="Done">
            <Text style={styles.doneText}>DONE</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#101015',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2a2c34',
    padding: 18,
    maxHeight: '76%',
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  term: { flex: 1, fontFamily: fonts.oswaldMedium, fontSize: 21, color: '#f4f5f7' },
  close: { fontFamily: fonts.oswaldSemiBold, fontSize: 20, color: colors.textSub, marginTop: -2 },
  source: { fontFamily: fonts.barlowRegular, fontSize: 12, color: colors.textSub, marginTop: 2 },
  body: { marginTop: 12 },
  bodyContent: { paddingBottom: 8, gap: 4 },
  spinner: { marginTop: 18 },
  muted: { fontFamily: fonts.barlowRegular, fontSize: 14, color: colors.textSub, marginTop: 8 },
  def: { fontFamily: fonts.barlowMedium, fontSize: 15.5, lineHeight: 24, color: colors.textSecondary },
  eyebrow: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 12,
    letterSpacing: 1.6,
    color: colors.amberLabel,
    marginTop: 10,
  },
  doneBtn: {
    marginTop: 14,
    alignSelf: 'flex-end',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.45)',
    backgroundColor: '#17140c',
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  doneText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1, color: colors.amber },
});
