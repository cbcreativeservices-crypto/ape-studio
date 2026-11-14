/**
 * The recap and next-lab card for the two cable labs that draw their own end
 * screen (Cable & Connector Fundamentals' lesson 12, Cable Dressing's
 * COMPLETE / WHAT IS LEFT stage). Same words, look and behavior as the shared
 * LabEndScreen's blocks (kit/LabEndScreen.tsx, S2 2026-11-14): WHAT YOU
 * LEARNED once complete, WHAT THIS LAB COVERS before that; UP NEXT / AFTER
 * THIS LAB, which leaves this lab through the shared one-exit window
 * (claimLabLeave) and opens the next one off the tap (runSoon).
 *
 * Content: labEndContent.ts (S4), keyed by the lab's credit key.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, fonts } from '../../../theme/tokens';
import { labEndContentFor } from '../../../features/lab/labEndContent';
import { runSoon } from '../../../lib/afterInteractions';
import { claimLabLeave } from '../kit/LabNavBar';

export function LabRecapNext({ labId, complete, beforeLeave }: { labId: string; complete: boolean; beforeLeave?: () => void }) {
  const navigation = useNavigation();
  const { recap, next } = labEndContentFor(labId);
  const openNext = () => {
    if (!next || !claimLabLeave()) return;
    beforeLeave?.();
    runSoon(() => (navigation as unknown as { navigate: (route: string) => void }).navigate(next.route));
  };
  const nextHead = complete ? 'UP NEXT' : 'AFTER THIS LAB';
  return (
    <View style={{ gap: 10 }}>
      {recap && recap.length > 0 ? (
        <View style={styles.recap} accessibilityRole="summary">
          <Text style={styles.sectionHead}>{complete ? 'WHAT YOU LEARNED' : 'WHAT THIS LAB COVERS'}</Text>
          {recap.map((line) => (
            <View key={line} style={styles.recapRow}>
              <Text style={styles.recapDot}>•</Text>
              <Text style={styles.recapText}>{line}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {next ? (
        <Pressable
          onPress={openNext}
          style={styles.next}
          accessibilityRole="button"
          accessibilityLabel={`${nextHead}: ${next.title}${next.why ? `, ${next.why}` : ''}. Leaves this lab and opens it.`}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.sectionHead}>{nextHead}</Text>
            <Text style={styles.nextTitle}>{next.title}</Text>
            {next.why ? <Text style={styles.rowDetail}>{next.why}</Text> : null}
          </View>
          <Text style={styles.rowGo}>›</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHead: { color: colors.amberLabel, fontFamily: fonts.oswaldMedium, fontSize: 11, letterSpacing: 1.4 },
  recap: { gap: 6, borderWidth: 1, borderColor: 'rgba(55,224,95,.3)', borderRadius: 10, backgroundColor: '#0f1d14', padding: 12 },
  recapRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  recapDot: { color: colors.green, fontFamily: fonts.barlowMedium, fontSize: 14, lineHeight: 20 },
  recapText: { flex: 1, color: colors.textPrimary, fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20 },
  next: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, borderWidth: 1, borderColor: '#2a2a2e', borderRadius: 10, backgroundColor: '#141416', paddingVertical: 10, paddingHorizontal: 12 },
  nextTitle: { color: colors.textPrimary, fontFamily: fonts.barlowMedium, fontSize: 15, lineHeight: 20 },
  rowDetail: { color: colors.textSub, fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16 },
  rowGo: { color: colors.amber, fontFamily: fonts.oswaldSemiBold, fontSize: 18 },
});
