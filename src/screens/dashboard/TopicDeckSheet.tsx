/**
 * TopicDeckSheet — the Dashboard topic-deck manager (owner 2026-08-01), opened
 * by the blue Study icon in the header. Lists every topic in the deck and lets
 * the user:
 *   • switch ordering between ALPHABETICAL (default) and CUSTOM;
 *   • in CUSTOM, move a topic toward the far-left (↑) or right (↓) of the deck;
 *   • remove a topic from the deck (and restore it later);
 *   • tap a topic to jump straight to it in the Dashboard.
 * Custom is never the default — the user must engage it here.
 */
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Modal } from '../../components/DimModal';
import { colors, fonts } from '../../theme/tokens';
import { NavIcon } from '../../components/nav/NavIcon';
import type { DeckMode } from '../../features/dashboard/deckOrderStore';

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

  const move = (id: string, dir: -1 | 1) => {
    const ids = active.map((t) => t.id);
    const i = ids.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    onReorder(ids);
  };

  return (
    <Modal accessibilityViewIsModal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
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
              ? 'Custom order — use ↑ (further left) and ↓ (further right). Tap a topic to jump to it.'
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
                <RowBtn label="✕" tone="danger" onPress={() => onRemove(t.id)} a11y={`Remove ${t.name} from the deck`} />
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

  sectionHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.6, color: colors.textSub, marginTop: 8 },
  empty: { fontFamily: fonts.barlowRegular, fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingVertical: 16 },
});
