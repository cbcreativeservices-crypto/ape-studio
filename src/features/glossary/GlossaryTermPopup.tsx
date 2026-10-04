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
import { useEffect, useRef, useState } from 'react';
import { useMemberGate } from '../commercial/useTier';
import { MEMBERSHIP_NOT_CONFIRMED } from '../commercial/tier';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Modal } from '../../components/DimModal';
import { colors, fonts } from '../../theme/tokens';
import { supabase } from '../../lib/supabase';
import {
  classifyGatewayError,
  corpusTable,
  probeGateway,
  readDefinitionOnce,
  sessionChargeUnanswered,
  sessionDefinition,
  type DefinitionResult,
} from './glossaryGateway';
import { popupCard } from '../../theme/readingColumn';
import { softDeadline } from '../../lib/boundedCall';
import { safeSessionResult } from '../../lib/getSessionSafe';

type Row = { id: string; term: string; definition: string | null; plain_english: string | null };

/** A one-row read a tap is waiting on — same budget as the metered read. */
const LOOKUP_DEADLINE_MS = 8000;

/**
 * ⛔ ONE LOOKUP PER TERM PER SESSION (bug hunt 2026-09-30).
 *
 * Every gateway call charges a weekly lookup, and this popup made one on every
 * open: tap a calculator chip, DONE, tap it again — two of the fourteen for one
 * term. Closing mid-load made it worse: the charge still landed, the result was
 * thrown away, and the reopen paid again. The Glossary screen's rule is that a
 * term already read this session is free; this keeps the same rule here.
 *
 * Keyed to the signed-in uid, so another identity on the phone (a sign-out, a
 * new guest key) never inherits the last one's full text. Faults are not kept.
 * The cache is SHARED with the Glossary screen (evening hunt 2, 2026-10-02 —
 * see readDefinitionOnce): a term paid for here is free there, and back.
 */
function readOnce(id: string): Promise<DefinitionResult> {
  return readDefinitionOnce(id);
}

/**
 * PERF (2026-10-03): which entry a chip's NAME resolved to, for this app
 * session. Ids and term names are public and the same for every reader, so
 * nothing tier- or identity-specific is kept here — no definition text. It
 * lets a RE-OPEN of a term already read this session paint at once from the
 * shared session read (below) instead of waiting on the by-name lookup again.
 * `plainNull`: the lookup's own plain-English was empty, so the instant paint
 * may show the session read's plain-English alone, exactly as the slow path
 * would have ended up showing it.
 */
const NAME_HITS = new Map<string, { id: string; term: string; plainNull: boolean }>();

export function GlossaryTermPopup({
  termName,
  onClose,
  embedded,
  preloaded,
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
  /** A full entry the caller already has (owner 2026-09-29: Start Here's
   *  starter words open FREE). Shown as-is: no corpus read, no metered
   *  gateway call, so it never spends a weekly lookup. */
  preloaded?: { term: string; definition: string; plain_english: string } | null;
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
  const [partial, setPartial] = useState<null | 'limit-reached' | 'unconfirmed' | 'checking' | 'unanswered' | 'other'>(null);
  /**
   * "You've used this week's free definitions" + upgrade options only to a
   * KNOWN non-member (owner 2026-10-03 #1). A learner whose membership read
   * failed gets the honest not-confirmed words instead — and only once it has
   * failed: while the retries still run it is "still being checked" (hunt 5).
   * A ref: the read below lands after the effect that started it.
   */
  const memberGate = useMemberGate();
  const gateRef = useRef(memberGate);
  gateRef.current = memberGate;
  /**
   * ⛔ A GUEST WITH NO DEVICE KEY IS NOT OFFLINE (bug hunt 2026-09-30).
   *
   * `glossary_browse_v` is granted to `authenticated` only, so a guest who has
   * not yet agreed to the glossary's temporary device ID gets 42501 here — and
   * every lab / calculator term link told them to "check your connection" on a
   * connection that was fine. The consent lives on the Glossary screen, so
   * that is where this sends them.
   */
  const [needsKey, setNeedsKey] = useState(false);

  /**
   * PERF (2026-10-03): warm the gateway probe while the host screen (a lab, a
   * calculator) is open, so the FIRST term tap does not wait a round trip for
   * it before its own lookup. One cached read per app session, never metered;
   * a failed probe is not cached, exactly as when a tap asks.
   */
  useEffect(() => {
    void probeGateway();
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!termName) {
      setRow(null);
      setNotFound(false);
      setLoadError(false);
      setNeedsKey(false);
      setPartial(null);
      setLoading(false);
      return;
    }
    if (preloaded) {
      setRow({ id: 'preloaded', term: preloaded.term, definition: preloaded.definition, plain_english: preloaded.plain_english });
      setNotFound(false);
      setLoadError(false);
      setNeedsKey(false);
      setPartial(null);
      setLoading(false);
      return;
    }
    // A re-open of a term this session already read (here or in the Glossary —
    // one shared cache): the slow path below would look the name up again and
    // then answer from that same cache, so paint its end state now. The same
    // session read, the same `readDefinitionOnce` rule — no lookup is spent.
    const known = NAME_HITS.get(termName);
    const paid = known ? sessionDefinition(known.id) : null;
    if (known && paid?.definition && (known.plainNull || paid.plain_english)) {
      setRow({ id: known.id, term: known.term, definition: paid.definition, plain_english: paid.plain_english ?? null });
      setNotFound(false);
      setLoadError(false);
      setNeedsKey(false);
      setPartial(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setNotFound(false);
    setLoadError(false);
    setNeedsKey(false);
    // A new term must not inherit the last one's "this is only the opening"
    // note — it was only ever cleared on close.
    setPartial(null);
    setRow(null);
    (async () => {
      // Case-insensitive exact match on the display name. `ilike` with no
      // wildcards is an exact, case-folded compare — the calculator lists and
      // the glossary rows disagree on casing ('Sound pressure level' vs
      // 'Sound Pressure Level'), so a `=` would miss.
      const probe = await probeGateway();
      if (cancelled) return;
      // ⛔ BOUNDED (full-app run 2, 2026-10-01). The probe and the metered read
      // are bounded; this lookup was not, and a stalled one left the spinner
      // up for good — no error, no retry, only DONE. A stall is the
      // connection failure the error line already describes.
      const { data, error } = await softDeadline<{ data: Row[] | null; error: { code?: string; message: string } | null }>(
        // `async () =>`: the Supabase builder is a thenable, not a Promise.
        async () => {
          const r = await supabase
            .from(corpusTable(probe))
            .select('id, term, definition, plain_english')
            .ilike('term', termName)
            .limit(1);
          return { data: r.data as Row[] | null, error: r.error };
        },
        { data: null, error: { message: 'glossary term lookup timeout' } },
        'glossary term popup lookup',
        LOOKUP_DEADLINE_MS,
      );
      if (cancelled) return;
      const hit = (data && data[0]) as Row | undefined;
      if (!hit) {
        if (error && classifyGatewayError(error) === 'denied') {
          /**
           * ⛔ A 42501 IS ONLY "NO DEVICE ID" WHEN THERE IS NO SESSION (hunt 13,
           * 2026-10-04; K1/K6). The browse view is granted to every signed-in
           * reader — an account or a device key — so a refusal reaches one only
           * when the request went out WITHOUT their token: an expired token
           * whose refresh could not reach the server, or a stalled keychain
           * read. That reader was told to "allow its temporary device ID" — a
           * signed-in member sent to a consent they never need. Ask who is
           * here: a session that is present or unknown is the connection
           * failure the error line describes; only a known no-session reader
           * needs the key.
           */
          const { result, timedOut } = await safeSessionResult(supabase.auth.getSession(), 'glossary term popup');
          if (cancelled) return;
          if (result.data.session || timedOut) setLoadError(true);
          else setNeedsKey(true);
        } else if (error) setLoadError(true);
        else setNotFound(true);
        setLoading(false);
        return;
      }
      setRow(hit);
      NAME_HITS.set(termName, { id: hit.id, term: hit.term, plainNull: !hit.plain_english?.trim() });
      setLoading(false);
      /**
       * ⛔ 'absent' MAY ONLY HAVE BEEN A SLOW PROBE (hunt 7, 2026-10-03; the
       * screen's twin of this was hunt 6). probeGateway answers 'absent' for a
       * transient fault (a stall past 8 s, a dropped link) without caching it,
       * and the row above came from the browse view — the 120-character teaser
       * for anyone who is not a member. Returning here showed that teaser as
       * the whole definition, with no note. Ask once more: a real 'absent' is
       * cached and costs nothing; a gateway that is there fetches the text.
       */
      const live = probe === 'deployed' || (await probeGateway()) === 'deployed';
      if (cancelled || !live) return;
      // The row above is a teaser for anyone who is not a member. Ask the
      // gateway for the real text; a refusal (out of lookups, or no device key)
      // simply leaves the teaser on screen with the caller's "OPEN THE
      // GLOSSARY ›" link, which is where the lock and the upgrade path live.
      const full = await readOnce(hit.id);
      if (cancelled) return;
      if (full.state !== 'ok') {
        // Say which kind of short it is. `sign-in-required` and `not-deployed`
        // both mean the caller's own fallback is in play, so they are not
        // labelled here — only a refusal that genuinely leaves a teaser up.
        const gate = gateRef.current;
        if (full.fault === 'limit-reached') {
          setPartial(gate === 'locked' ? 'limit-reached' : gate === 'checking' ? 'checking' : 'unconfirmed');
          return;
        }
        // ⛔ A MEMBER'S ROW IS NEVER A TEASER (hunt 5, 2026-10-03; same rule as
        // the screen's SHARE, hunt 4): the browse view hands a member the whole
        // definition, so a failed gateway read left nothing short — and the
        // note told a paying member their full entry was "the opening" that
        // "isn't fetched again… so you're never charged twice".
        if (gate === 'open') return;
        // Its open was sent and never answered (owner 2026-10-03 #2): it is not
        // read again this session, so "try again" would be a promise that
        // either fails or charges twice.
        else if (full.fault === 'error' && sessionChargeUnanswered(hit.id)) setPartial('unanswered');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termName, preloaded?.term]);

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
            {needsKey ? (
              <Text style={styles.muted}>
                Open the Glossary once and allow its temporary device ID — then terms open here too.
              </Text>
            ) : null}
            {row?.definition?.trim() ?<Text style={styles.def}>{row.definition.trim()}</Text> : null}
            {partial ? (
              <Text style={styles.partial}>
                {partial === 'limit-reached'
                  ? 'This is the opening of the entry — you’ve used this week’s free definitions. Open the Glossary for the full text and your upgrade options.'
                  : partial === 'unconfirmed'
                  ? `This is the opening of the entry. ${MEMBERSHIP_NOT_CONFIRMED}`
                  : partial === 'checking'
                  ? 'This is the opening of the entry. Your account is still being checked — try this term again in a moment.'
                  : partial === 'unanswered'
                  ? 'This is the opening of the entry — the full definition didn’t arrive when this term was opened. So you’re never charged twice, it isn’t fetched again until you next open the app.'
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
    // Tablet (owner 2026-09-29): centred at the popup width, not edge to edge.
    ...popupCard,
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
