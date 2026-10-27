/**
 * TopicDeckSheet — the Dashboard topic-deck manager (owner 2026-08-01), opened
 * by the blue Study icon in the header. Lists every topic in the deck and lets
 * the user:
 *   • switch ordering between ALPHABETICAL (default) and CUSTOM;
 *   • in CUSTOM, move a topic toward the far-left (↑) or right (↓) of the deck;
 *   • remove a topic from the deck (and restore it later) — except MY CUSTOM
 *     LIST, which can never be removed (owner 2026-10-19): it has no ✕;
 *   • tap a topic to jump straight to it in the Dashboard.
 * Custom is never the default — the user must engage it here.
 */
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Modal } from '../../components/DimModal';
import { colors, fonts } from '../../theme/tokens';
import { NavIcon } from '../../components/nav/NavIcon';
import { GlassButton } from '../../components/GlassButton';
import type { DeckMode } from '../../features/dashboard/deckOrderStore';
import { popupCard } from '../../theme/readingColumn';
import { canRemoveFromDeck, quizLengthOptions } from '../../features/commercial/studyGate';

type Item = { id: string; name: string };

export function TopicDeckSheet({
  visible,
  onClose,
  mode,
  active,
  removed,
  onSetMode,
  onReorder,
  onRemove,
  onRestore,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  mode: DeckMode;
  /** Deck topics in their current display order (left→right). */
  active: Item[];
  /** Topics the user removed from the deck. */
  removed: Item[];
  onSetMode: (m: DeckMode) => void;
  /** Full new order of active topic IDs (left→right). */
  onReorder: (ids: string[]) => void;
  onRemove: (id: string) => void;
  onRestore: (id: string) => void;
  onSelect: (id: string) => void;
}) {
  const custom = mode === 'custom';

  // The order the LAST tap produced (bug pass 2, 2026-09-30). Two quick ↑/↓
  // taps land before the parent re-renders, so both computed from the same
  // stale `active` and only one move survived. Keyed on the `active` array it
  // was built from: once fresh props arrive they win again.
  const lastOrderRef = useRef<{ src: Item[]; ids: string[] } | null>(null);

  const move = (id: string, dir: -1 | 1) => {
    const prev = lastOrderRef.current;
    const ids = prev && prev.src === active ? [...prev.ids] : active.map((t) => t.id);
    const i = ids.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    lastOrderRef.current = { src: active, ids };
    onReorder(ids);
  };

  return (
    <Modal accessibilityViewIsModal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessible={false}>
        {/* Panel — swallow taps so they don't close the sheet. */}
        <Pressable accessible={false} style={styles.panel} onPress={() => {}}>
          <View style={styles.head}>
            {/* Study icon to the LEFT of the title (owner 2026-08-06) — matches
                the header button that opens this sheet. */}
            <View style={styles.headLeft}>
              <View style={styles.headIcon}>
                <View style={{ transform: [{ scale: 1.2 }] }}>
                  <NavIcon icon="Study" lit showLabel={false} />
                </View>
              </View>
              <Text style={styles.title}>TOPIC DECK</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>

          {/* Ordering mode. */}
          <View style={styles.modeRow}>
            <ModeChip label="A–Z" active={!custom} onPress={() => onSetMode('alpha')} />
            <ModeChip label="CUSTOM" active={custom} onPress={() => onSetMode('custom')} />
          </View>
          <Text style={styles.note}>
            {custom
              ? 'Custom order: ↑ moves a topic earlier in the deck and ↓ moves it later. Tap a topic to jump to it.'
              : 'Alphabetical order. Switch to CUSTOM to arrange the deck yourself. Tap a topic to jump to it.'}
          </Text>

          <ScrollView contentContainerStyle={styles.list}>
            {active.map((t, i) => (
              <View key={t.id} style={styles.row}>
                <Pressable
                  style={styles.rowMain}
                  onPress={() => onSelect(t.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Go to ${t.name}`}
                >
                  <Text style={styles.pos}>{i + 1}</Text>
                  <Text style={styles.rowName} numberOfLines={1}>
                    {t.name}
                  </Text>
                </Pressable>
                {custom ? (
                  <>
                    <RowBtn label="↑" disabled={i === 0} onPress={() => move(t.id, -1)} a11y={`Move ${t.name} left`} />
                    <RowBtn label="↓" disabled={i === active.length - 1} onPress={() => move(t.id, 1)} a11y={`Move ${t.name} right`} />
                  </>
                ) : null}
                {/* The LAST topic cannot be removed (B-041): an empty deck leaves
                    the Dashboard with no topic to show — and no header/deck
                    button to get back here and restore anything. */}
                {/* MY CUSTOM LIST stays (owner 2026-10-19): no ✕ at all — a
                    quiet word where it would sit, so the row still lines up. */}
                {canRemoveFromDeck(t.id) ? (
                  <RowBtn
                    label="✕"
                    tone="danger"
                    disabled={active.length <= 1}
                    onPress={() => onRemove(t.id)}
                    a11y={`Remove ${t.name} from the deck`}
                  />
                ) : (
                  <Text style={styles.fixedTag} accessibilityLabel={`${t.name} always stays in the deck`}>
                    ALWAYS
                  </Text>
                )}
              </View>
            ))}
            {active.length === 0 ? <Text style={styles.empty}>No topics in the deck.</Text> : null}

            {removed.length > 0 ? (
              <>
                <Text style={styles.sectionHead}>REMOVED</Text>
                {removed.map((t) => (
                  <View key={t.id} style={[styles.row, styles.rowRemoved]}>
                    <Text style={[styles.rowName, styles.rowNameRemoved]} numberOfLines={1}>
                      {t.name}
                    </Text>
                    <RowBtn label="+ ADD" tone="ok" onPress={() => onRestore(t.id)} a11y={`Restore ${t.name} to the deck`} wide />
                  </View>
                ))}
              </>
            ) : null}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ModeChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable hitSlop={6}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      aria-pressed={active}
      style={[styles.modeChip, active && styles.modeChipOn]}
    >
      <Text style={[styles.modeChipText, active && styles.modeChipTextOn]}>{label}</Text>
    </Pressable>
  );
}

function RowBtn({
  label,
  onPress,
  disabled,
  tone,
  a11y,
  wide,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'danger' | 'ok';
  a11y: string;
  wide?: boolean;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      style={[styles.rowBtn, wide && styles.rowBtnWide, disabled && styles.rowBtnDisabled]}
    >
      <Text
        style={[
          styles.rowBtnText,
          tone === 'danger' && styles.rowBtnDanger,
          tone === 'ok' && styles.rowBtnOk,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', paddingHorizontal: 18 },
  panel: {
    // Tablet (owner 2026-09-29): centred at the popup width, not edge to edge.
    ...popupCard,
    maxHeight: '80%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2b2b30',
    backgroundColor: '#141416',
    padding: 16,
    gap: 10,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headIcon: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 1.6, color: colors.textPrimary },
  close: { fontFamily: fonts.oswaldSemiBold, fontSize: 20, color: colors.textSub },

  modeRow: { flexDirection: 'row', gap: 8 },
  modeChip: {
    flex: 1,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#33333a',
    backgroundColor: '#1a1a1e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeChipOn: { borderColor: colors.blue, backgroundColor: 'rgba(47,155,255,0.12)' },
  modeChipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1.2, color: colors.textSub },
  modeChipTextOn: { color: colors.blue },
  note: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: colors.textMuted },

  list: { gap: 8, paddingVertical: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a2a30',
    backgroundColor: '#191a1d',
    paddingVertical: 8,
    paddingLeft: 10,
    paddingRight: 8,
  },
  rowRemoved: { opacity: 0.75, borderStyle: 'dashed' },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  pos: { fontFamily: fonts.mono, fontSize: 12, color: colors.amberLabel, width: 18, textAlign: 'right' },
  rowName: { flex: 1, fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 0.3, color: colors.textPrimary },
  rowNameRemoved: { color: colors.textSub, marginLeft: 4 },

  rowBtn: {
    minWidth: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3a3a42',
    backgroundColor: '#202024',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  rowBtnWide: { minWidth: 58 },
  rowBtnDisabled: { opacity: 0.3 },
  rowBtnText: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 0.6, color: colors.textSecondary },
  rowBtnDanger: { color: '#ff6b5e' },
  rowBtnOk: { color: '#37e05f', fontSize: 11.5 },

  fixedTag: { minWidth: 34, fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1, color: colors.textMuted, textAlign: 'center' },
  sectionHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.6, color: colors.textSub, marginTop: 8 },
  empty: { fontFamily: fonts.barlowRegular, fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingVertical: 16 },
});

/**
 * CustomQuizLengthSheet — how long the MY CUSTOM LIST quiz is (owner 2026-10-19:
 * "allow the quiz to go from a minimum of 30 terms up to their total list of
 * terms (randomly selected)").
 *
 * A centred popup (never a pulldown), styled like the Topic Deck sheet: the
 * length as a row of chips — 30 · 50 · 100 · ALL, each capped at the list's
 * count (studyGate.quizLengthOptions) — the quiz rules stated before the
 * clock starts, as every quiz on this screen does, then BEGIN / NOT NOW.
 * The terms themselves are drawn at random by the server from the whole list
 * (start_custom_list_quiz, D12), which substitutes terms that have no question.
 *
 * Lives in this file (not its own module) to stay inside the app-start graph
 * cap (test/perfStartTrim_20261004).
 *
 * Opened only for a list of 30 or more; below that the Dashboard answers with
 * the "needs at least 30 terms" popup instead.
 */
export function CustomQuizLengthSheet({
  visible,
  count,
  onClose,
  onBegin,
}: {
  visible: boolean;
  /** Terms in the list (already read; ≥ 30 when this opens). */
  count: number;
  onClose: () => void;
  /** BEGIN with this many terms (30 … count). */
  onBegin: (n: number) => void;
}) {
  const options = quizLengthOptions(count);
  const [picked, setPicked] = useState<number>(options[0]?.n ?? 0);
  // Each opening starts on the shortest quiz; a list edited meanwhile can never
  // leave a choice above its own count.
  useEffect(() => {
    if (visible) setPicked(quizLengthOptions(count)[0]?.n ?? 0);
  }, [visible, count]);
  const chosen = options.find((o) => o.n === picked) ?? options[0];

  return (
    <Modal accessibilityViewIsModal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={qStyles.backdrop} onPress={onClose} accessible={false}>
        <Pressable accessible={false} style={qStyles.panel} onPress={() => {}}>
          <Text style={qStyles.title}>QUIZ YOUR LIST</Text>
          <Text style={qStyles.note}>
            {`Your list has ${count} terms. Choose how many to be quizzed on — they are picked at random from your list. It’s practice: not counted toward anything.`}
          </Text>
          <View style={qStyles.chips} accessibilityRole="radiogroup">
            {options.map((o) => {
              const on = chosen?.n === o.n;
              return (
                <Pressable
                  key={o.n}
                  hitSlop={6}
                  onPress={() => setPicked(o.n)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  aria-checked={on}
                  accessibilityLabel={o.all ? `All ${o.n} terms` : `${o.n} terms`}
                  style={[qStyles.chip, on && qStyles.chipOn]}
                >
                  <Text style={[qStyles.chipText, on && qStyles.chipTextOn]}>{o.all ? `ALL ${o.n}` : `${o.n}`}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={qStyles.rules}>
            The clock doesn’t pause. If you leave the app twice, the attempt isn’t counted and your list quiz locks for
            15 minutes. Going back wipes your answers, and the clock keeps running.
          </Text>
          <View style={qStyles.actions}>
            <View style={qStyles.action}>
              <GlassButton label="NOT NOW" tint="blue" height={44} fontSize={14} onPress={onClose} />
            </View>
            <View style={qStyles.action}>
              <GlassButton
                label={chosen ? `BEGIN · ${chosen.n}` : 'BEGIN'}
                height={44}
                fontSize={14}
                disabled={!chosen}
                onPress={() => {
                  if (chosen) onBegin(chosen.n);
                }}
              />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const qStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', paddingHorizontal: 18 },
  panel: {
    ...popupCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2b2b30',
    backgroundColor: '#141416',
    padding: 16,
    gap: 12,
  },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 1.6, color: colors.customList },
  note: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minWidth: 64,
    flexGrow: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#33333a',
    backgroundColor: '#1a1a1e',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  chipOn: { borderColor: colors.customList, backgroundColor: 'rgba(63,211,230,0.12)' },
  chipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.2, color: colors.textSub },
  chipTextOn: { color: colors.customList },
  rules: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 18, color: colors.textMuted },
  actions: { flexDirection: 'row', gap: 10 },
  action: { flex: 1 },
});
