/**
 * GlossaryTermPopup — a lightweight, self-contained glossary definition popup
 * (owner 2026-08-07) for surfacing a term WITHOUT leaving the current screen.
 *
 * Built for the calculator ↔︎ glossary round-trip: tapping a term chip inside a
 * Calc Lab workspace shows this overlay, and because it is a transparent Modal
 * layered over the caller (never a navigation push), the caller's state — the
 * user's calculator inputs and scroll position — is preserved for free. Closing
 * returns the user to their exact spot.
 *
 * It fetches only the public fields (term, definition, plain-English) by NAME,
 * case-insensitively (calculator glossary lists carry display names, not ids).
 * For the full detail — Purpose, Common Mistakes, linked labs — the caller keeps
 * its "OPEN THE GLOSSARY ›" link to the Glossary tab.
 *
 * ⚠️ ONCE THE GLOSSARY GATEWAY IS LIVE, THIS OPEN IS METERED. The lookup by
 * name comes from `glossary_browse_v`, which carries only a 120-character
 * teaser for non-members, so the real text has to come through
 * `get_glossary_definition` — and that RPC counts. A term chip opened from a
 * calculator therefore spends one of the free 14, where today it spent nothing.
 * That is consistent with the owner's own rule ("opening a definition to view
 * it = +1") and there is no unmetered path left after the revokes, but it IS a
 * behaviour change worth knowing about rather than discovering.
 * See docs/APE_GLOSSARY_DEVICE_ID_BUILD_PLAN_2026_09_13.md.
 */
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Modal } from '../../components/DimModal';
import { colors, fonts } from '../../theme/tokens';
import { supabase } from '../../lib/supabase';
import { corpusTable, fetchDefinitionViaGateway, probeGateway } from './glossaryGateway';

type Row = { id: string; term: string; definition: string | null; plain_english: string | null };

export function GlossaryTermPopup({
  termName,
  onClose,
  embedded,
}: {
  /** The term to show, or null when the popup is closed. */
  termName: string | null;
  onClose: () => void;
  /** Render as an in-tree overlay instead of its own Modal.
   *
   *  ⛔ REQUIRED WHEN A MODAL IS ALREADY OPEN. On Android every RN Modal is its
   *  own Dialog window, so a second one raised from inside an open sheet is
   *  drawn BENEATH it: tapping a term inside the calculator's formula-key sheet
   *  would appear to do nothing at all. Same rule and the same fix as
   *  `components/PrePaywallPrompt`. Identical look either way. */
  embedded?: boolean;
}) {
  const [row, setRow] = useState<Row | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  // Transient server/transport failure — distinct from a genuinely absent term
  // (QA night 2026-08-31: a 500 told the user a real term "was not found").
  const [loadError, setLoadError] = useState(false);
  /**
   * ⛔ WHETHER THE TEXT ON SCREEN IS THE WHOLE DEFINITION.
   *
   * The row this popup first renders comes from `glossary_browse_v`, which
   * carries a 120-CHARACTER TEASER for anyone who is not a member. The
   * gateway call below replaces it with the real text — and every fault took
   * a silent `return`, leaving the teaser on screen with nothing to say it
   * was one. A free user out of their fourteen weekly lookups read a
   * definition that stopped mid-sentence, with no lock card, no "out of
   * lookups" and no upgrade path; the popup's only control is DONE.
   */
  const [partial, setPartial] = useState<null | 'limit-reached' | 'other'>(null);

  useEffect(() => {
    let cancelled = false;
    if (!termName) {
      setRow(null);
      setNotFound(false);
      setLoadError(false);
      setPartial(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setNotFound(false);
    setLoadError(false);
    setRow(null);
    (async () => {
      // Case-insensitive exact match on the display name. `ilike` with no
      // wildcards is an exact, case-folded compare — the calculator lists and
      // the glossary rows disagree on casing ('Sound pressure level' vs
      // 'Sound Pressure Level'), so a `=` would miss.
      const probe = await probeGateway();
      if (cancelled) return;
      const { data, error } = await supabase
        .from(corpusTable(probe))
        .select('id, term, definition, plain_english')
        .ilike('term', termName)
        .limit(1);
      if (cancelled) return;
      const hit = (data && data[0]) as Row | undefined;
      if (!hit) {
        if (error) setLoadError(true);
        else setNotFound(true);
        setLoading(false);
        return;
      }
      setRow(hit);
      setLoading(false);
      if (probe !== 'deployed') return;
      // The row above is a teaser for anyone who is not a member. Ask the
      // gateway for the real text; a refusal (out of lookups, or no device key)
      // simply leaves the teaser on screen with the caller's "OPEN THE
      // GLOSSARY ›" link, which is where the lock and the upgrade path live.
      const full = await fetchDefinitionViaGateway(hit.id);
      if (cancelled) return;
      if (full.state !== 'ok') {
        // Say which kind of short it is. `sign-in-required` and `not-deployed`
        // both mean the caller's own fallback is in play, so they are not
        // labelled here — only a refusal that genuinely leaves a teaser up.
        if (full.fault === 'limit-reached') setPartial('limit-reached');
        else if (full.fault === 'denied' || full.fault === 'error') setPartial('other');
        return;
      }
      setRow((prev) =>
        prev && prev.id === hit.id
          ? {
              ...prev,
              definition: full.row.definition ?? prev.definition,
              plain_english: full.row.plain_english ?? prev.plain_english,
            }
          : prev,
      );
    })().catch(() => {
      /**
       * ⛔ A THROW HERE USED TO LEAVE A PERMANENT SPINNER.
       *
       * This IIFE had no `catch`, and `setLoading(false)` is only reached on
       * the paths that return normally. So anything that THREW — probeGateway,
       * the gateway fetch, a malformed row — left `loading` true forever: a
       * spinner with no message, no retry and no explanation, on a popup the
       * learner opened by tapping a term mid-sentence.
       *
       * The screen already has an honest error state for exactly this; nothing
       * was reaching it. Failing into it is strictly better than spinning.
       */
      if (cancelled) return;
      setLoadError(true);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [termName]);

  const body = (
    <Pressable
      accessible={false}
      style={[styles.backdrop, embedded ? StyleSheet.absoluteFill : null]}
      onPress={onClose}
      accessibilityViewIsModal
    >
        {/* Inner press swallows taps so tapping the card doesn't dismiss. */}
        <Pressable accessible={false} style={styles.card} onPress={() => {}}>
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
            {loadError ? (
              <Text style={styles.muted}>Couldn’t load this term — please check your connection and try again.</Text>
            ) : null}
            {row?.definition?.trim() ? <Text style={styles.def}>{row.definition.trim()}</Text> : null}
            {partial ? (
              <Text style={styles.partial}>
                {partial === 'limit-reached'
                  ? 'This is the opening of the entry — you’ve used this week’s free definitions. Open the Glossary for the full text and your upgrade options.'
                  : 'This is the opening of the entry — the full definition couldn’t be loaded just now. Open the Glossary to try again.'}
              </Text>
            ) : null}
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
  );

  if (embedded) return termName != null ? body : null;
  return (
    <Modal accessibilityViewIsModal visible={termName != null} transparent animationType="fade" onRequestClose={onClose}>
      {body}
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
  // Amber = the thing to act on, the same rule as the rest of the app.
  partial: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 18, color: colors.amber, marginTop: 8 },
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
