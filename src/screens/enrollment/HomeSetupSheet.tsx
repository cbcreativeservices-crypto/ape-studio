/**
 * HomeSetupSheet — the paid user's HOME (Course Select) screen customizer (user
 * request 2026-07-22). Opened from the Enrollment screen's "My Enrollment"
 * section. Audio Tools + Glossary are always on Home and locked. The user places
 * up to HOME_MAX (20) topics via a book icon, can sort (custom · A–Z · by
 * subject), reset, and then Save & return or Cancel. Adding a 21st shows a
 * brief warning.
 *
 * Edits a DRAFT held in local state; Save commits to homeCardsStore, Cancel
 * discards. Reads only from the curriculum matrix.
 */
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../theme/tokens';
import { BookIcon } from '../../components/BookIcon';
import { PrePaywallPrompt } from '../../components/PrePaywallPrompt';
import { MATRIX_SUBJECTS } from '../../data/courseTopicMatrix';
import { getHomeGs, HOME_MAX, setHomeGs } from '../../features/home/homeCardsStore';

const GREEN = '#37e05f';
const BLUE = '#7fbfff';
const GRAY = '#54565c';
type Sort = 'custom' | 'az' | 'subject';

export function HomeSetupSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<number[]>([]);
  const [sort, setSort] = useState<Sort>('custom');
  const [openSubject, setOpenSubject] = useState<number | null>(null);
  const [warn, setWarn] = useState(false);

  useEffect(() => {
    if (visible) {
      setDraft(getHomeGs());
      setSort('custom');
    }
  }, [visible]);

  const topicIndex = useMemo(() => {
    const m = new Map<number, { name: string; subject: string }>();
    for (const s of MATRIX_SUBJECTS) for (const t of s.topics) m.set(t.gs, { name: t.name, subject: s.name });
    return m;
  }, []);
  const nameFor = (gs: number) => topicIndex.get(gs)?.name ?? `Topic gs${gs}`;
  const subjectFor = (gs: number) => topicIndex.get(gs)?.subject ?? '';
  const inDraft = (gs: number) => draft.includes(gs);

  const place = (gs: number) =>
    setDraft((prev) => {
      if (prev.includes(gs)) return prev.filter((g) => g !== gs);
      if (prev.length >= HOME_MAX) {
        setWarn(true);
        return prev;
      }
      return [...prev, gs];
    });

  const applySort = (mode: Sort) => {
    setSort(mode);
    if (mode === 'az') setDraft((prev) => [...prev].sort((a, b) => nameFor(a).localeCompare(nameFor(b))));
    else if (mode === 'subject')
      setDraft((prev) => [...prev].sort((a, b) => subjectFor(a).localeCompare(subjectFor(b)) || nameFor(a).localeCompare(nameFor(b))));
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.head}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>HOME SCREEN SETUP</Text>
            <Text style={styles.sub}>Choose which topics appear on your Home screen.</Text>
          </View>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Cancel">
            <Text style={styles.close}>✕</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Always-on, locked. */}
          <Text style={styles.sectionHead}>ALWAYS ON YOUR HOME</Text>
          <View style={styles.lockedRow}>
            <BookIcon color={GREEN} filled size={20} />
            <Text style={styles.lockedName}>Audio Tools</Text>
            <Text style={styles.lock}>🔒</Text>
          </View>
          <View style={styles.lockedRow}>
            <BookIcon color={BLUE} filled size={20} />
            <Text style={styles.lockedName}>Glossary</Text>
            <Text style={styles.lock}>🔒</Text>
          </View>

          {/* Current Home topics. */}
          <View style={styles.rowBetween}>
            <Text style={styles.sectionHead}>ON YOUR HOME</Text>
            <Text style={[styles.count, draft.length >= HOME_MAX && { color: '#ffb43a' }]}>
              {draft.length} / {HOME_MAX}
            </Text>
          </View>
          <View style={styles.sortRow}>
            {([['custom', 'Custom'], ['az', 'A–Z'], ['subject', 'By subject']] as [Sort, string][]).map(([k, label]) => (
              <Pressable key={k} style={[styles.chip, sort === k && styles.chipOn]} onPress={() => applySort(k)} accessibilityRole="button" accessibilityState={{ selected: sort === k }}>
                <Text style={[styles.chipText, sort === k && styles.chipTextOn]}>{label}</Text>
              </Pressable>
            ))}
          </View>
          {draft.length === 0 ? (
            <Text style={styles.empty}>None yet — add topics from the list below.</Text>
          ) : (
            draft.map((gs) => (
              <View key={gs} style={styles.placedRow}>
                <Pressable onPress={() => place(gs)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Remove ${nameFor(gs)} from Home`}>
                  <BookIcon color={GREEN} filled size={20} />
                </Pressable>
                <View style={{ flex: 1 }}>
                  <Text style={styles.placedName} numberOfLines={1}>
                    {nameFor(gs)}
                  </Text>
                  <Text style={styles.placedSubject} numberOfLines={1}>
                    {subjectFor(gs)}
                  </Text>
                </View>
                <Pressable style={styles.removeBtn} onPress={() => place(gs)} accessibilityRole="button" accessibilityLabel={`Remove ${nameFor(gs)}`}>
                  <Text style={styles.removeText}>Remove</Text>
                </Pressable>
              </View>
            ))
          )}

          {/* Add topics — subject → topic, book icon toggles placement. */}
          <Text style={styles.sectionHead}>ADD TOPICS</Text>
          {MATRIX_SUBJECTS.map((s) => {
            const open = openSubject === s.order;
            return (
              <View key={s.order} style={styles.subjectCard}>
                <Pressable style={styles.subjectHead} onPress={() => setOpenSubject((p) => (p === s.order ? null : s.order))} accessibilityRole="button" accessibilityState={{ expanded: open }} accessibilityLabel={s.name}>
                  <Text style={styles.subjectChevron}>{open ? '▾' : '▸'}</Text>
                  <Text style={styles.subjectName}>{s.name}</Text>
                  <Text style={styles.subjectCount}>{s.topics.length}</Text>
                </Pressable>
                {open
                  ? s.topics.map((t) => {
                      const on = inDraft(t.gs);
                      return (
                        <Pressable key={t.gs} style={styles.topicRow} onPress={() => place(t.gs)} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={on ? `Remove ${t.name} from Home` : `Add ${t.name} to Home`}>
                          <BookIcon color={on ? GREEN : GRAY} filled={on} size={18} />
                          <Text style={[styles.topicName, on && styles.topicNameOn]}>{t.name}</Text>
                        </Pressable>
                      );
                    })
                  : null}
              </View>
            );
          })}
        </ScrollView>

        {/* Footer actions. */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
          <Pressable style={styles.resetBtn} onPress={() => setDraft([])} accessibilityRole="button" accessibilityLabel="Reset Home">
            <Text style={styles.resetText}>RESET</Text>
          </Pressable>
          <Pressable style={styles.cancelBtn} onPress={onClose} accessibilityRole="button" accessibilityLabel="Cancel">
            <Text style={styles.cancelText}>CANCEL</Text>
          </Pressable>
          <Pressable
            style={styles.saveBtn}
            onPress={() => {
              setHomeGs(draft);
              onClose();
            }}
            accessibilityRole="button"
            accessibilityLabel="Save and return"
          >
            <Text style={styles.saveText}>SAVE & RETURN</Text>
          </Pressable>
        </View>
      </View>

      <PrePaywallPrompt
        visible={warn}
        onClose={() => setWarn(false)}
        title="Home screen is full"
        lines={[`You can place up to ${HOME_MAX} topics on your Home screen.`, 'Remove one first to add another.']}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#232323',
  },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 1.2, color: colors.textPrimary },
  sub: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textSub, marginTop: 1 },
  close: { fontFamily: fonts.oswaldSemiBold, fontSize: 22, color: colors.textSubAlt },

  scroll: { padding: 16, gap: 8, paddingBottom: 20 },
  sectionHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.6, color: colors.amberLabel, marginTop: 6 },
  rowBetween: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 6 },
  count: { fontFamily: fonts.mono, fontSize: 13, color: colors.textSecondary },

  lockedRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 9, backgroundColor: '#141414' },
  lockedName: { flex: 1, fontFamily: fonts.oswaldMedium, fontSize: 15.5, color: colors.textPrimary },
  lock: { fontSize: 14, color: colors.textSub },

  sortRow: { flexDirection: 'row', gap: 6 },
  chip: { borderWidth: 1, borderColor: '#333', borderRadius: 14, paddingVertical: 4, paddingHorizontal: 11, backgroundColor: '#161616' },
  chipOn: { borderColor: colors.amber, backgroundColor: 'rgba(255,198,77,.12)' },
  chipText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 0.6, color: colors.textSub },
  chipTextOn: { color: colors.amber },
  empty: { fontFamily: fonts.barlowRegular, fontStyle: 'italic', fontSize: 13.5, color: colors.textSub },

  placedRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(55,224,95,.35)', borderRadius: 10, backgroundColor: '#101512' },
  placedName: { fontFamily: fonts.oswaldMedium, fontSize: 15, color: colors.textPrimary },
  placedSubject: { fontFamily: fonts.barlowRegular, fontSize: 12, color: colors.textSub, marginTop: 1 },
  removeBtn: { paddingVertical: 4, paddingHorizontal: 6 },
  removeText: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 0.6, color: colors.textSub },

  subjectCard: { borderWidth: 1, borderColor: '#232323', borderRadius: 9, backgroundColor: '#141414', overflow: 'hidden' },
  subjectHead: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, paddingHorizontal: 12 },
  subjectChevron: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, color: colors.textSub, width: 14 },
  subjectName: { flex: 1, fontFamily: fonts.oswaldMedium, fontSize: 15, color: colors.amber },
  subjectCount: { fontFamily: fonts.mono, fontSize: 12.5, color: colors.textSub },
  topicRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 9, paddingHorizontal: 14, borderTopWidth: 1, borderTopColor: '#1e1e1e' },
  topicName: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 14.5, color: colors.textSecondary },
  topicNameOn: { color: colors.textPrimary },

  footer: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#232323', backgroundColor: '#121212' },
  resetBtn: { borderWidth: 1, borderColor: '#3a3a3a', borderRadius: 9, paddingVertical: 11, paddingHorizontal: 14, alignItems: 'center' },
  resetText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.textSub },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: '#3a3a3a', borderRadius: 9, paddingVertical: 11, alignItems: 'center' },
  cancelText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.textSecondary },
  saveBtn: { flex: 1.4, borderRadius: 9, paddingVertical: 11, alignItems: 'center', backgroundColor: 'rgba(55,224,95,.14)', borderWidth: 1.5, borderColor: 'rgba(55,224,95,.7)' },
  saveText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: GREEN },
});
