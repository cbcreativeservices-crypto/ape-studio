/**
 * The first-visit WELCOME (mockup screen 0), in the owner's approved words.
 *
 * ⛔ NEVER BESIDE, NEVER DURING A DISMISS: when it comes due it waits out any
 * closing Modal (rootModalHoldMs) and, once up, it stays until ENTER THE FORUM.
 * The host passes `due` false in Low-Light Production Mode, where nothing
 * auto-appears; the message then simply waits, and it is in Announcements.
 */
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Modal, rootModalHoldMs } from '../../../components/DimModal';
import { popupCard } from '../../../theme/readingColumn';
import { fonts } from '../../../theme/tokens';
import {
  WELCOME_BUTTON,
  WELCOME_NOTE,
  WELCOME_PARAGRAPHS,
  WELCOME_ROLE,
  WELCOME_SIGNATURE,
  WELCOME_TITLE,
} from '../../../features/forum/welcome';
import { AmberButton, F } from './forumBits';

export function ForumWelcomePopup({ due, onEnter }: { due: boolean; onEnter: () => void }) {
  const presented = useRef(false);
  if (!due) presented.current = false;
  const holdMs = due && !presented.current ? rootModalHoldMs() : 0;
  const [, tick] = useState(0);
  useEffect(() => {
    if (holdMs <= 0) return undefined;
    const t = setTimeout(() => tick((n) => n + 1), holdMs);
    return () => clearTimeout(t);
  }, [holdMs]);
  const show = due && (presented.current || holdMs <= 0);
  if (show) presented.current = true;

  // The host latches ENTER. A refused write is told by the shared save-failure notice.
  return (
    <Modal visible={show} transparent animationType="fade" onRequestClose={onEnter}>
      <View style={st.dim}>
        <View style={st.wel} accessibilityViewIsModal>
          <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
            <Text style={st.eb}>WELCOME</Text>
            <Text accessibilityRole="header" style={st.h2}>
              {WELCOME_TITLE}
            </Text>
            {WELCOME_PARAGRAPHS.map((p) => (
              <Text key={p} style={st.p}>
                {p}
              </Text>
            ))}
            <Text style={st.sigName}>{WELCOME_SIGNATURE}</Text>
            <Text style={st.sigRole}>{WELCOME_ROLE}</Text>
            <AmberButton label={WELCOME_BUTTON} onPress={onEnter} style={st.button} />
            <Text style={st.later}>{WELCOME_NOTE}</Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  dim: { flex: 1, backgroundColor: F.dimScrim, alignItems: 'center', justifyContent: 'center', padding: 18 },
  wel: {
    ...popupCard,
    width: '100%',
    maxHeight: '92%',
    backgroundColor: F.raised,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.45)',
    borderRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 18,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: 20 },
    elevation: 12,
  },
  eb: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.4, color: F.amber },
  h2: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 21,
    lineHeight: 25,
    color: F.text,
    marginTop: 6,
    marginBottom: 10,
  },
  p: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 20, color: F.body, marginTop: 8 },
  sigName: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 14,
    letterSpacing: 0.28,
    color: F.text,
    marginTop: 12,
  },
  sigRole: { fontFamily: fonts.barlowRegular, fontSize: 13, color: F.sub },
  button: { marginTop: 14 },
  later: { fontFamily: fonts.barlowRegular, fontSize: 12, color: F.muted, textAlign: 'center', marginTop: 10 },
});
