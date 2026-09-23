/**
 * ShareTermSheet — the glossary SHARE hub (owner spec 2026-08-06, "Improve
 * Glossary Sharing"). Replaces the old text-only, single-definition sheet that
 * signed off with "— from the Pro Audio Training Academy glossary" (retired).
 *
 * It now:
 *   • Previews the share as a card FIRST (kept from the 2026-07-17 request).
 *   • Lets the user choose SECTIONS (Definition + Related Terms on by default;
 *     Plain English, Purpose & Application, and — only when permitted — Common
 *     Mistakes are optional).
 *   • Offers SHARE AS TEXT (always), SHARE AS IMAGE (gated on native modules,
 *     like the calc share), and COPY (gated on expo-clipboard) — honest gating,
 *     never a dead control.
 *   • Lets the user pull MORE terms into one multi-term share from their
 *     Bookmarks / Custom list / Recent lists and from the term's Related terms,
 *     via a selectable picker → SHARE SELECTED.
 *
 * All formatting lives in features/glossary/glossaryShare (pure) and the image
 * capture reuses the calc shareImage chain. Definitions are never rewritten.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { ALL_ORIENTATIONS } from './modalOrientations';
import { notify } from '../lib/confirm';
import { GlassButton } from './GlassButton';
import { StudioButton } from './StudioButton';
import { ShareIcon } from './ShareIcon';
import { colors, fonts } from '../theme/tokens';
import { LowLightDim } from '../features/settings/LowLightLayer';
import {
  DEFAULT_SECTIONS,
  LARGE_SHARE_THRESHOLD,
  shareText,
  termHeading,
  type GlossaryShareTerm,
  type ShareSections,
} from '../features/glossary/glossaryShare';
import { GlossaryShareCard } from '../features/glossary/GlossaryShareCard';
import * as shareImage from '../screens/lab/calc/shareImage';
import { copyText, isCopyAvailable } from '../features/glossary/shareCopy';

export type NamedTerm = { id: string; term: string };

export type ShareTermPayload = {
  /** Terms initially staged to share. 1 → single layout; >1 → multi layout. */
  terms: GlossaryShareTerm[];
  /** True iff the viewer may read Common Mistakes (academy). Gates the toggle. */
  mistakesAllowed: boolean;
  /** Extra sources the user can pull MORE terms from (single-term entry). */
  lists?: { bookmarks: NamedTerm[]; custom: NamedTerm[]; recent: NamedTerm[] };
  /** The primary term's related terms that resolve to real glossary entries. */
  related?: NamedTerm[];
  /** Resolve selected term ids → full shareable terms (fetches details). */
  resolve?: (ids: string[]) => Promise<GlossaryShareTerm[]>;
};

type SourceKey = 'bookmarks' | 'custom' | 'recent' | 'related';
const SOURCE_LABEL: Record<SourceKey, string> = {
  bookmarks: 'Bookmarks',
  custom: 'Custom list',
  recent: 'Recent',
  related: 'Related terms',
};

function SectionToggle({
  label,
  on,
  onToggle,
}: {
  label: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      style={styles.toggleRow}
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      aria-checked={on}
      accessibilityLabel={label}
      hitSlop={6}
    >
      <View style={[styles.box, on && styles.boxOn]}>{on ? <Text style={styles.check}>✓</Text> : null}</View>
      <Text style={styles.toggleLabel}>{label}</Text>
    </Pressable>
  );
}

export function ShareTermSheet({
  payload,
  onClose,
}: {
  payload: ShareTermPayload | null;
  onClose: () => void;
}) {
  const [view, setView] = useState<'main' | 'picker'>('main');
  const [sections, setSections] = useState<ShareSections>(DEFAULT_SECTIONS);
  const [staged, setStaged] = useState<GlossaryShareTerm[]>([]);
  const [busy, setBusy] = useState(false);

  // Picker state
  const [pickerSource, setPickerSource] = useState<SourceKey | null>(null);
  const [pickerRows, setPickerRows] = useState<NamedTerm[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const captureRef = useRef<View>(null);

  // Reset internal state whenever a new share is opened.
  useEffect(() => {
    if (payload) {
      setStaged(payload.terms);
      setSections(DEFAULT_SECTIONS);
      setView('main');
      setPickerSource(null);
    }
  }, [payload]);

  const mistakesAvailable =
    !!payload?.mistakesAllowed && staged.some((t) => t.commonMistakes.length > 0);

  // Effective sections — never emit Common Mistakes when not permitted/available.
  const effSections: ShareSections = useMemo(
    () => ({ ...sections, commonMistakes: sections.commonMistakes && mistakesAvailable }),
    [sections, mistakesAvailable],
  );

  const message = useMemo(
    () => (staged.length ? shareText(staged, effSections) : ''),
    [staged, effSections],
  );

  if (!payload) return <Modal supportedOrientations={ALL_ORIENTATIONS} accessibilityViewIsModal visible={false} transparent onRequestClose={onClose} />;

  /** The action waiting on the long-message confirm, or null. Stored as a
   *  function IN a function, or React would call it as a state updater. */
  const [pendingLargeShare, setPendingLargeShare] = useState<(() => void) | null>(null);

  const multi = staged.length > 1;
  const isLarge = staged.length >= LARGE_SHARE_THRESHOLD;

  const sources: { key: SourceKey; rows: NamedTerm[] }[] = [
    { key: 'bookmarks' as const, rows: payload.lists?.bookmarks ?? [] },
    { key: 'custom' as const, rows: payload.lists?.custom ?? [] },
    { key: 'recent' as const, rows: payload.lists?.recent ?? [] },
    { key: 'related' as const, rows: payload.related ?? [] },
  ].filter((s) => s.rows.length > 0);

  /**
   * ⚠️ ANDROID: THIS CONFIRM IS DRAWN BEHIND THE SHEET THAT RAISED IT.
   *
   * Every RN <Modal> is its own Dialog window, and AppDialogHost is mounted as
   * a SIBLING in the navigator's screenLayout, so it attaches to the activity
   * window BELOW this open sheet (device-verified, PrePaywallPrompt:9-14). So
   * past the 25-term threshold, SHARE AS TEXT / Share as image / Copy do
   * nothing on Android — the same dead-button symptom the comment below says
   * was fixed for RN-web, re-created by a different mechanism.
   *
   * ⛔ NOT FIXED BY CLOSING THE SHEET FIRST, and that matters: the image path
   *    captures `captureRef.current`, which only exists while this sheet is
   *    mounted.
   *
   * ✅ FIXED 2026-09-22 (owner go): the confirm is now an IN-SHEET overlay,
   *    rendered inside this component's own <Modal> — the same shape
   *    PrePaywallPrompt's `embedded` mode uses, and for the same reason. It
   *    cannot land behind the sheet because it is not a separate window, and
   *    the sheet stays mounted so the image capture still works. The pending
   *    action is held in state until the learner answers.
   *
   *    ⚠️ Android layering is the whole point of this fix, and it has NOT been
   *    checked on a device — verify on the Pixel that the confirm appears
   *    above the sheet past 25 staged terms, and that SHARE AS TEXT, Share as
   *    image and Copy all complete from it.
   */
  const confirmLargeThen = (run: () => void) => {
    if (!isLarge) return run();
    // ⛔ IN-SHEET, NOT A SEPARATE WINDOW — see the note above. Holding the
    // pending action in state and drawing the confirm INSIDE this Modal keeps
    // the sheet mounted, which the image path requires: it captures
    // `captureRef.current`, and that only exists while this sheet is rendered.
    // That is why "close the sheet first" was not a fix.
    setPendingLargeShare(() => run);
  };

  const doShareText = () =>
    confirmLargeThen(() => {
      // .catch: a rejected share sheet (cancel on some platforms) must not
      // surface as an unhandled rejection; onClose still runs.
      void Share.share({ message }).catch(() => {}).finally(onClose);
    });

  const doShareImage = () =>
    confirmLargeThen(() => {
      setBusy(true);
      void shareImage
        .captureAndShare(captureRef.current, multi ? 'Glossary terms' : 'Glossary term')
        .then((ok) => {
          if (!ok) {
            /**
             * ⛔ DO THE FALLBACK, DO NOT HANG IT OFF A DIALOG'S OK HANDLER.
             *
             * The text share used to ride on this notify's OK — so on Android,
             * where the dialog renders behind the open sheet, the image path
             * ended in exactly the silence the comment here says it was
             * written to prevent: no image, no text, no message. (It was fixed
             * for RN-web's no-op Alert and then re-broken by the Android
             * window rule.)
             *
             * Share first, then say what happened. The notice is now purely
             * informational, and it is raised AFTER onClose, so nothing is
             * waiting on a dialog nobody can see.
             */
            void Share.share({ message })
              .catch(() => {})
              .finally(() => {
                onClose();
                notify(
                  'Shared as text',
                  'Sharing as an image isn’t available on this device, so this went out as text instead.',
                );
              });
          } else {
            onClose();
          }
        })
        // Without this a rejected capture was an unhandled rejection AND left
        // the sheet open with no explanation.
        // Close first: a notice raised over this open sheet is invisible on
        // Android, and there is nothing left to do inside the sheet anyway.
        .catch(() => {
          onClose();
          notify('Share failed', 'The image could not be prepared. Try sharing as text.');
        })
        .finally(() => setBusy(false));
    });

  const doCopy = () =>
    confirmLargeThen(() => {
      void copyText(message)
        .then((ok) => {
          // Close BEFORE the notice — see the image path above. On Android a
          // notice raised over this sheet is drawn underneath it.
          onClose();
          notify(
            ok ? 'Copied' : 'Copy unavailable',
            ok ? 'Share text copied to clipboard.' : 'Copying isn’t available on this device.',
          );
        })
        .catch(() => {
          onClose();
          notify('Copy unavailable', 'The share text could not be copied.');
        });
    });

  const openPicker = (key: SourceKey, rows: NamedTerm[]) => {
    setPickerSource(key);
    setPickerRows(rows);
    setSelected(new Set(rows.map((r) => r.id))); // opened to share the list → default all
    setView('picker');
  };

  const toggleSelected = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allSelected = pickerRows.length > 0 && pickerRows.every((r) => selected.has(r.id));
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(pickerRows.map((r) => r.id)));

  const useSelected = () => {
    const ids = pickerRows.filter((r) => selected.has(r.id)).map((r) => r.id);
    if (!ids.length || !payload.resolve) {
      setView('main');
      return;
    }
    setBusy(true);
    void payload
      .resolve(ids)
      .then((terms) => {
        if (terms.length) {
          // ADD to the share (dedupe by term), keeping the original term first —
          // pulling extra terms in builds ONE multi-term share, it doesn't
          // replace the staged term (owner 2026-08-06).
          setStaged((prev) => {
            const seen = new Set(prev.map((t) => t.term.trim().toLowerCase()));
            const merged = [...prev];
            for (const t of terms) {
              const k = t.term.trim().toLowerCase();
              if (!seen.has(k)) {
                seen.add(k);
                merged.push(t);
              }
            }
            return merged;
          });
        }
      })
      // A rejected resolve() was an unhandled rejection; say plainly that the
      // extra terms did not load.
      //
      // ⛔ CLOSE FIRST — the same rule the three call sites above follow, and
      // the only one of the four that was still breaking it. `.finally` returns
      // to the main view but leaves the <Modal> MOUNTED, so a notice raised
      // here is drawn on the activity window UNDERNEATH the sheet on Android
      // and the user simply watches the picker close with no explanation. The
      // selection is unaffected either way; this is only about whether the
      // sentence can be seen.
      .catch(() => {
        onClose();
        notify(
          'Some terms weren’t added',
          'Those extra terms could not be loaded. The terms you already selected are still here — try adding them again.',
        );
      })
      .finally(() => {
        setBusy(false);
        setView('main');
      });
  };

  /** Remove one term from the staged share (never below the first/original). */
  const removeStaged = (term: string) =>
    setStaged((prev) => (prev.length <= 1 ? prev : prev.filter((t) => t.term !== term)));

  return (
    <Modal supportedOrientations={ALL_ORIENTATIONS} accessibilityViewIsModal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Dismiss" />

        <View style={styles.card}>
          <View style={styles.headRow}>
            <ShareIcon size={17} color={colors.amber} />
            <Text style={styles.eyebrow}>
              {view === 'picker'
                ? `SELECT · ${SOURCE_LABEL[pickerSource ?? 'bookmarks'].toUpperCase()}`
                : multi
                  ? `SHARE ${staged.length} TERMS`
                  : 'SHARE THIS TERM'}
            </Text>
          </View>

          {view === 'main' ? (
            <>
              <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
                {/* Preview — what the recipient reads. When several terms are
                    staged (the user pulled extras from Recent/Related/etc.), the
                    main page CONFIRMS every included term with a removable row. */}
                <View style={styles.preview}>
                  {multi ? (
                    <>
                      <Text style={styles.includedHead}>TERMS INCLUDED ({staged.length})</Text>
                      {staged.map((t, i) => (
                        <View key={i} style={styles.includedRow}>
                          <Text style={styles.includedTerm} numberOfLines={1}>
                            {termHeading(t.term)}
                          </Text>
                          <Pressable
                            onPress={() => removeStaged(t.term)}
                            hitSlop={10}
                            accessibilityRole="button"
                            accessibilityLabel={`Remove ${t.term}`}
                          >
                            <Text style={styles.includedRemove}>✕</Text>
                          </Pressable>
                        </View>
                      ))}
                    </>
                  ) : (
                    <>
                      <Text style={styles.previewTerm}>{termHeading(staged[0]?.term ?? '')}</Text>
                      <Text style={styles.previewDef} numberOfLines={6}>
                        {staged[0]?.definition ?? ''}
                      </Text>
                    </>
                  )}
                </View>

                {/* Sections */}
                <Text style={styles.sectionHead}>INCLUDE</Text>
                {/* Order matches the term-detail view (owner 2026-08-06):
                    Definition → Plain English → Purpose → Common Mistakes →
                    Related terms (related sits LAST, not above Plain English). */}
                <SectionToggle
                  label="Definition"
                  on={sections.definition}
                  onToggle={() => setSections((s) => ({ ...s, definition: !s.definition }))}
                />
                <SectionToggle
                  label="Plain English"
                  on={sections.plainEnglish}
                  onToggle={() => setSections((s) => ({ ...s, plainEnglish: !s.plainEnglish }))}
                />
                <SectionToggle
                  label="Purpose & application"
                  on={sections.purpose}
                  onToggle={() => setSections((s) => ({ ...s, purpose: !s.purpose }))}
                />
                {mistakesAvailable ? (
                  <SectionToggle
                    label="Common mistakes"
                    on={sections.commonMistakes}
                    onToggle={() => setSections((s) => ({ ...s, commonMistakes: !s.commonMistakes }))}
                  />
                ) : null}
                <SectionToggle
                  label="Related terms"
                  on={sections.relatedTerms}
                  onToggle={() => setSections((s) => ({ ...s, relatedTerms: !s.relatedTerms }))}
                />

                {/* Pull more terms into one multi-term share. */}
                {sources.length ? (
                  <>
                    <Text style={styles.sectionHead}>SHARE SEVERAL</Text>
                    <View style={styles.sourceWrap}>
                      {sources.map(({ key, rows }) => (
                        <Pressable
                          key={key}
                          style={styles.sourceBtn}
                          onPress={() => openPicker(key, rows)}
                          accessibilityRole="button"
                          accessibilityLabel={`Select from ${SOURCE_LABEL[key]}, ${rows.length} terms`}
                        >
                          <Text style={styles.sourceText}>
                            {SOURCE_LABEL[key]} ({rows.length})
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </>
                ) : null}

                {isLarge ? (
                  <Text style={styles.warn}>⚠ {staged.length} terms — this will be a long message.</Text>
                ) : (
                  <Text style={styles.note}>Sent via your share sheet. Glossary content stays the focus.</Text>
                )}
              </ScrollView>

              <View style={styles.actionsCol}>
                <GlassButton label="SHARE AS TEXT" tint="blue" height={44} fontSize={13} onPress={doShareText} disabled={busy} />
                <View style={styles.actionRow}>
                  {shareImage.isAvailable() ? (
                    <View style={{ flex: 1 }}>
                      <StudioButton label="Share as image" variant="secondary" small onPress={doShareImage} disabled={busy} />
                    </View>
                  ) : null}
                  {isCopyAvailable() ? (
                    <View style={{ flex: 1 }}>
                      <StudioButton label="Copy" variant="secondary" small onPress={doCopy} disabled={busy} />
                    </View>
                  ) : null}
                  <View style={{ flex: 1 }}>
                    <StudioButton label="Cancel" variant="secondary" small onPress={onClose} />
                  </View>
                </View>
              </View>
            </>
          ) : (
            /* Picker */
            <>
              <Pressable style={styles.selectAll} onPress={toggleAll} accessibilityRole="button">
                <View style={[styles.box, allSelected && styles.boxOn]}>{allSelected ? <Text style={styles.check}>✓</Text> : null}</View>
                <Text style={styles.toggleLabel}>{allSelected ? 'Deselect all' : 'Select all'}</Text>
              </Pressable>
              <ScrollView style={styles.pickerScroll} keyboardShouldPersistTaps="handled">
                {pickerRows.map((r) => {
                  const on = selected.has(r.id);
                  return (
                    <Pressable
                      key={r.id}
                      style={styles.toggleRow}
                      onPress={() => toggleSelected(r.id)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: on }}
                      aria-checked={on}
                      accessibilityLabel={r.term}
                    >
                      <View style={[styles.box, on && styles.boxOn]}>{on ? <Text style={styles.check}>✓</Text> : null}</View>
                      <Text style={styles.toggleLabel} numberOfLines={1}>
                        {r.term}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <View style={styles.actionRow}>
                <View style={{ flex: 1 }}>
                  <StudioButton label="Back" variant="secondary" small onPress={() => setView('main')} />
                </View>
                <View style={{ flex: 1.4 }}>
                  <GlassButton
                    label={`SHARE SELECTED (${selected.size})`}
                    tint="blue"
                    height={42}
                    fontSize={12}
                    onPress={useSelected}
                    disabled={busy || selected.size === 0}
                  />
                </View>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Off-screen capture target for SHARE AS IMAGE — laid out but not visible.
          Only mount once terms are staged (avoids a terms[0] crash on the first
          render frame, before the payload→staged effect runs). */}
      {staged.length ? (
        <View style={styles.captureHost} pointerEvents="none">
          <GlossaryShareCard ref={captureRef} terms={staged} sections={effSections} />
        </View>
      ) : null}

      {pendingLargeShare ? (
        <View style={styles.confirmBackdrop} accessibilityViewIsModal>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setPendingLargeShare(null)}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          />
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Long message</Text>
            <Text style={styles.confirmBody}>
              You&apos;re sharing {staged.length} terms — this will create a very long message. Continue?
            </Text>
            <Pressable
              style={styles.confirmBtn}
              onPress={() => {
                const run = pendingLargeShare;
                setPendingLargeShare(null);
                run();
              }}
              accessibilityRole="button"
              accessibilityLabel="Share"
            >
              <Text style={styles.confirmBtnText}>SHARE</Text>
            </Pressable>
            <Pressable
              style={styles.confirmBtnSecondary}
              onPress={() => setPendingLargeShare(null)}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.confirmBtnSecondaryText}>CANCEL</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <LowLightDim />
    </Modal>
  );
}

const styles = StyleSheet.create({
  // The long-message confirm, drawn INSIDE this sheet's own Modal window so it
  // cannot land behind it on Android. Same shape as PrePaywallPrompt's
  // `embedded` overlay, which exists for exactly this reason.
  confirmBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#15161a',
    borderColor: '#3a3d45',
    borderWidth: 1,
    borderRadius: 12,
    padding: 18,
    gap: 10,
  },
  confirmTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 18, color: colors.amber },
  confirmBody: { fontFamily: fonts.barlowRegular, fontSize: 14, color: colors.textSub, lineHeight: 20 },
  confirmBtn: {
    marginTop: 6,
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.amber,
    alignItems: 'center',
  },
  confirmBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, color: colors.amber, letterSpacing: 1 },
  confirmBtnSecondary: { paddingVertical: 10, alignItems: 'center' },
  confirmBtnSecondaryText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, color: colors.textSub, letterSpacing: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.74)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '86%',
    backgroundColor: '#161719',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2c2d31',
    padding: 18,
  },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  eyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1.4, color: colors.amber },

  scroll: { flexGrow: 0 },
  preview: {
    backgroundColor: '#1e1f22',
    borderWidth: 1,
    borderColor: '#33343a',
    borderRadius: 10,
    padding: 16,
    gap: 8,
  },
  previewTerm: { fontFamily: fonts.oswaldMedium, fontSize: 18, letterSpacing: 0.4, color: colors.textPrimary },
  previewDef: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  // Confirmation list of every term that will be sent (multi-term share).
  includedHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.4, color: colors.amber, marginBottom: 4 },
  includedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 3, gap: 10 },
  includedTerm: { flex: 1, fontFamily: fonts.oswaldMedium, fontSize: 15, letterSpacing: 0.3, color: colors.textPrimary },
  includedRemove: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, color: colors.textMuted },

  sectionHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.4, color: colors.textMuted, marginTop: 16, marginBottom: 6 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  box: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#4a4b52',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: { borderColor: colors.amber, backgroundColor: 'rgba(255,180,0,0.16)' },
  check: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, color: colors.amber, lineHeight: 16 },
  toggleLabel: { fontFamily: fonts.barlowMedium, fontSize: 14.5, color: colors.textSecondary, flexShrink: 1 },

  sourceWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sourceBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3a5a86',
    backgroundColor: '#12213a',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sourceText: { fontFamily: fonts.barlowSemiBold, fontSize: 13, color: '#9fc3ff' },

  note: { fontFamily: fonts.barlowRegular, fontSize: 12, color: colors.textMuted, marginTop: 14 },
  warn: { fontFamily: fonts.barlowSemiBold, fontSize: 12.5, color: '#f2b24a', marginTop: 14 },

  actionsCol: { gap: 10, marginTop: 14 },
  actionRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },

  selectAll: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, marginBottom: 2, borderBottomWidth: 1, borderBottomColor: '#2c2d31' },
  pickerScroll: { flexGrow: 0, marginBottom: 12 },

  // Kept in the tree (laid out) so react-native-view-shot can capture it, but
  // pushed off-screen so it never shows over the sheet.
  captureHost: { position: 'absolute', left: -9999, top: 0, width: 360 },
});
