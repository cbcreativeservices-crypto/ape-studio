/**
 * The "?" on My Enrollments Dashboard (owner 2026-10-15): a small centred
 * popup (popups, never pulldowns) with
 *   • "How Your Learning Is Organized" → the first-visit intro again, and
 *   • the help for THIS screen shown right below it, in the popup (owner
 *     2026-10-23: "already show the help with this screen list") — the same
 *     answers the Help hub lists for "enroll", each opening in place. Before,
 *     this was a second button that left for the Help hub.
 */
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { filterHelp } from '../../features/help/helpContent';
import { GlassButton } from '../../components/GlassButton';
import { useNavigation } from '@react-navigation/native';
import { Modal, useAfterModalsClose } from '../../components/DimModal';
import { IntroSheet } from '../../features/intro/ScreenIntroOverlay';

import { ALL_ORIENTATIONS } from '../../components/modalOrientations';
import { useModalHandoff } from '../../lib/confirm';
import { colors, fonts } from '../../theme/tokens';

/** The answers about THIS screen: the `enroll-*` entries plus `start-first-steps`. */
export function isEnrollmentScreenHelp(id: string): boolean {
  return id.startsWith('enroll-') || id === 'start-first-steps';
}

export function EnrollmentHelpMenu() {
  const navigation = useNavigation<any>();
  const afterClose = useAfterModalsClose();
  // Opening a SCREEN from inside a popup goes through the house handoff (P5).
  const handoff = useModalHandoff();
  const [menu, setMenu] = useState(false);
  const [intro, setIntro] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  // The Help hub's own search for this screen (what "Help with this screen" opened),
  // narrowed BY ID (popup review 2 A5, 2026-10-27): the word "enroll" also
  // matched the privacy answer `pv-leaves` and `start-account`.
  const screenHelp = useMemo(
    () =>
      filterHelp('enroll')
        .map((c) => ({ ...c, entries: c.entries.filter((e) => isEnrollmentScreenHelp(e.id)) }))
        .filter((c) => c.entries.length > 0),
    [],
  );
  return (
    <>
      <Pressable
        onPress={() => setMenu(true)}
        hitSlop={10}
        style={({ pressed }) => [styles.key, pressed && { opacity: 0.7 }]}
        accessibilityRole="button"
        accessibilityLabel="Help for this screen"
      >
        <Text style={styles.glyph}>?</Text>
      </Pressable>

      <Modal
        visible={menu}
        transparent
        animationType="fade"
        supportedOrientations={ALL_ORIENTATIONS}
        onRequestClose={() => setMenu(false)}
      >
        {/* The scrim is not an accessibility element (the keys inside must be
            reachable on iOS); CLOSE and the escape gesture close it. */}
        <Pressable style={styles.backdrop} onPress={() => setMenu(false)} accessible={false} onAccessibilityEscape={() => setMenu(false)}>
          <Pressable style={styles.card} onPress={() => {}} accessible={false}>
            <Text style={styles.tag}>HELP</Text>
            {/* The amber glass glow (owner 2026-10-23) — the same backlit gold key
                as Home's CERTIFICATES & PROGRAMS. */}
            <GlassButton
              label="UNDERSTAND WHAT YOU’LL ENCOUNTER"
              tint="gold"
              height={50}
              fontSize={13}
              onPress={() => {
                setMenu(false);
                afterClose(() => setIntro(true));
              }}
            />
            <Text style={styles.subhead} accessibilityRole="header">HELP WITH THIS SCREEN</Text>
            <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
              {screenHelp.map((c) => (
                <View key={c.key} style={styles.group}>
                  <Text style={styles.groupTitle}>{c.title}</Text>
                  {c.entries.map((e) => {
                    const open = openId === e.id;
                    return (
                      <View key={e.id} style={styles.entry}>
                        <Pressable
                          onPress={() => setOpenId(open ? null : e.id)}
                          accessibilityRole="button"
                          accessibilityState={{ expanded: open }}
                          aria-expanded={open}
                          style={styles.qRow}
                        >
                          <Text style={styles.caret}>{open ? '▾' : '▸'}</Text>
                          <Text style={styles.q}>{e.q}</Text>
                        </Pressable>
                        {open ? <Text style={styles.a}>{e.a}</Text> : null}
                        {open && e.jump ? (
                          <Pressable
                            style={styles.jump}
                            onPress={() => {
                              setMenu(false);
                              const j = e.jump!;
                              handoff(() => navigation.navigate(j.route, j.params, { pop: true }));
                            }}
                            accessibilityRole="button"
                          >
                            <Text style={styles.jumpText}>{e.jump.label} ›</Text>
                          </Pressable>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
            <Pressable style={styles.close} onPress={() => setMenu(false)} accessibilityRole="button">
              <Text style={styles.closeText}>CLOSE</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {intro ? <IntroSheet introKey="enrollments" onDismiss={() => setIntro(false)} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  // Same key as HelpKey (amber ring), so the header looks unchanged.
  key: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.75)',
    backgroundColor: '#2a2210',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, lineHeight: 15, color: colors.amber },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,.72)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,180,0,.5)',
    backgroundColor: '#141310',
    padding: 18,
    gap: 10,
  },
  tag: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 2, color: '#b98a20' },
  // Help-with-this-screen list, in the popup (owner 2026-10-23).
  subhead: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 2, color: '#b98a20', marginTop: 6 },
  list: { maxHeight: 360 },
  listContent: { gap: 12, paddingBottom: 4 },
  group: { gap: 6 },
  groupTitle: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.6, color: colors.textSub },
  entry: { borderWidth: 1, borderColor: colors.hairline, borderRadius: 10, backgroundColor: '#1a1814', paddingVertical: 10, paddingHorizontal: 12, gap: 8 },
  qRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  caret: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, lineHeight: 20, color: colors.amber, width: 12 },
  q: { flex: 1, fontFamily: fonts.barlowMedium, fontSize: 15, lineHeight: 20, color: colors.textPrimary },
  a: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary, marginLeft: 20 },
  jump: { alignSelf: 'flex-start', marginLeft: 20, paddingVertical: 4 },
  jumpText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.amber },
  close: { alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 16 },
  closeText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.5, color: colors.textSub },
});
