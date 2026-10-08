/**
 * "Knowing When to Bring In a Pro" — the Mixing-family note (owner 2026-10-07).
 *
 * Shown ONCE per device the first time any lab in the Mixing family opens
 * (Beginning Mixing, Advanced Mixing, Mastering, Mixing Guides — one shared
 * seen-flag, `ape:intro:mixingProNote`, through the screen-intro registry, so
 * Low-Light, focus and the guest wipe's intro-flag keep all apply). The learner
 * acknowledges with GOT IT and is already inside the lab they opened.
 *
 * The note stays reachable: `ProNoteButton` sits on the first page of each of
 * those labs and opens the same text again.
 *
 * Copy is the owner's own, word for word (owner chose "original, unchanged").
 * It is long, so the body scrolls and GOT IT is pinned below it — never a
 * tap-anywhere sheet like the other intros.
 */
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { ALL_ORIENTATIONS } from '../../components/modalOrientations';
import { Modal } from '../../components/DimModal';
import { colors, fonts } from '../../theme/tokens';
import { useScreenIntro } from '../intro/ScreenIntroOverlay';
import { SCREEN_INTROS } from '../intro/screenIntros';

const NOTE = SCREEN_INTROS.mixingProNote;

export function ProNoteSheet({ onClose }: { onClose: () => void }) {
  const paragraphs = NOTE.body.split('\n\n');
  return (
    <Modal
      supportedOrientations={ALL_ORIENTATIONS}
      accessibilityViewIsModal
      transparent
      animationType="fade"
      visible
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title} accessibilityRole="header">{NOTE.title}</Text>
          <View style={styles.rule} />
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollBody}>
            {paragraphs.map((p, i) => (
              <Text key={i} style={styles.body}>{p}</Text>
            ))}
          </ScrollView>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.gotIt, pressed && styles.gotItPressed]}
            accessibilityRole="button"
            accessibilityLabel="Got it"
          >
            <Text style={styles.gotItText}>{(NOTE.button ?? 'Got it').toUpperCase()}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/** The first-open popup. `onOwed` lets a host hold its own popups (the guest
 *  reminder) while this one is still to come, so two never present together. */
export function ProNoteIntro({ onOwed }: { onOwed?: (owed: boolean) => void }) {
  const { visible, dismiss, owed } = useScreenIntro('mixingProNote');
  useEffect(() => {
    onOwed?.(owed);
  }, [owed, onOwed]);
  if (!visible) return null;
  return <ProNoteSheet onClose={dismiss} />;
}

/** The small standing link on each Mixing-family lab's first page. */
export function ProNoteButton({ style }: { style?: StyleProp<ViewStyle> }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.link, pressed && styles.linkPressed, style]}
        accessibilityRole="button"
        accessibilityLabel={`${NOTE.title} — opens a note`}
      >
        <Text style={styles.linkText}>When to bring in a pro ›</Text>
      </Pressable>
      {open ? <ProNoteSheet onClose={() => setOpen(false)} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '88%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,180,0,.5)',
    backgroundColor: '#141310',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    gap: 10,
  },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 19, letterSpacing: 0.6, color: colors.textPrimary },
  rule: { height: 1, backgroundColor: 'rgba(255,180,0,.35)' },
  scroll: { flexGrow: 0, flexShrink: 1 },
  scrollBody: { gap: 12, paddingBottom: 4 },
  body: { fontFamily: fonts.barlowRegular, fontSize: 15, lineHeight: 22, color: colors.textPrimary },
  gotIt: {
    marginTop: 4,
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.amberLabel,
  },
  gotItPressed: { opacity: 0.8 },
  gotItText: { fontFamily: fonts.oswaldSemiBold, fontSize: 15, letterSpacing: 2, color: '#141310' },
  link: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,180,0,.45)',
  },
  linkPressed: { opacity: 0.7 },
  linkText: { fontFamily: fonts.barlowMedium, fontSize: 13, color: colors.amberLabel },
});
