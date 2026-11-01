/**
 * LabCheckEnd — the "what's left" end screen for a LabShell lab whose one
 * credited unit is its understanding check (Binaural, FM, Stereo Imaging;
 * D41, owner-approved 2026-11-01). Passed to LabShell as `checkEnd`, so it is
 * drawn under the CHECK. Built like ModularLabEnd and kit/ReviewLabEnd.
 *
 * Its own file, not LabShell.tsx: LabShell imports kit/LabNavBar, and the lab
 * navigation law (test/labNavLaw) bans the retired "‹ BACK" wording in any
 * LabNavBar host; this layer's "‹ BACK TO THE LAB" is the same label the other
 * end layers use.
 */
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Modal } from '../../../components/DimModal';
import { ScreenGuideHost, ScreenGuideKey, type ScreenGuide } from '../../../features/lab/screenGuide';
import { useLabClearedUnits, useLabCompletionUnreadable } from '../../../features/lab/labCompletion';
import { UNDERSTANDING_UNIT } from '../../../features/lab/understanding';
import type { LabId } from '../../../features/lab/guidedLessons';
import { safeGoBack } from '../../../lib/safeGoBack';
import { runSoon } from '../../../lib/afterInteractions';
import { colors, fonts } from '../../../theme/tokens';
import { LabEndLink, LabEndScreen } from './LabEndScreen';
import type { LabEndUnit } from './labEnd';

/** The one credited unit of a LabShell lab: its understanding check. */
const CHECK_END_UNITS: LabEndUnit[] = [
  {
    id: UNDERSTANDING_UNIT,
    label: 'Understanding check',
    detail: 'The CHECK tab at the top of this lab — every answer correct, retry until you are.',
    kind: 'check',
  },
];

/**
 * The "what's left" END SCREEN for a LabShell lab whose one unit is its
 * understanding check; pass it as `checkEnd` (owner hard rule: every lab ends
 * on a what's-left screen; D41 #3/#12, owner-approved 2026-11-01). The same
 * shape as ModularLabEnd and kit/ReviewLabEnd: a FINISH · SEE WHAT'S LEFT link
 * under the CHECK opens the shared LabEndScreen as a full-screen layer, so the
 * lab stays as left underneath. The unit is read from the banked record (never
 * cleared; practising again only returns to the lab). Nothing auto-appears
 * (Low-Light): only a tap opens it. `endGuide` puts the ⓘ on the layer.
 *
 * ANDROID BACK CLOSES THE GUIDE FIRST (D41 K7, 2026-11-01). Inside a Modal the
 * hardware BACK reaches only the Modal's onRequestClose, never the in-layer
 * guide overlay's BackHandler, so one BACK closed the whole layer. The layer's
 * own ScreenGuideHost hands back a `backRef`; onRequestClose asks it first
 * (closes an open guide → done), and only then closes the layer. The guide
 * stays in-tree (never Modal over Modal, K10).
 */
export function LabCheckEnd({
  labId,
  labTitle,
  onOpen,
  endGuide,
}: {
  labId: LabId;
  /** As the learner reads it, e.g. "FM Synth Lab". */
  labTitle: string;
  /** e.g. stop the lab's sound. */
  onOpen?: () => void;
  endGuide?: ScreenGuide;
}) {
  const [open, setOpen] = useState(false);
  // "Close the open guide, if any" — filled by the layer's ScreenGuideHost.
  const guideBack = useRef<(() => boolean) | null>(null);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const cleared = useLabClearedUnits(labId);
  const unreadable = useLabCompletionUnreadable();
  const close = () => setOpen(false);
  return (
    <>
      <LabEndLink
        onPress={() => {
          onOpen?.();
          setOpen(true);
        }}
      />
      <Modal
        visible={open}
        animationType="none"
        // BACK: the open guide first, then the layer on the next press.
        onRequestClose={() => {
          if (guideBack.current?.()) return;
          close();
        }}
        statusBarTranslucent
      >
        <View style={[styles.endRoot, { paddingTop: insets.top + 8 }]}>
          {/* Its own guide host: the layer sits above the shell's. */}
          <ScreenGuideHost regions={false} resetKey={open ? 'end' : 'closed'} backRef={guideBack}>
            <View style={styles.endHeader}>
              <Pressable onPress={close} hitSlop={12} accessibilityRole="button" accessibilityLabel={`Back to the ${labTitle}`}>
                <Text style={styles.endBack}>‹ BACK TO THE LAB</Text>
              </Pressable>
              <View style={styles.endTitleRow}>
                <Text style={styles.endTitle} accessibilityRole="header">Where you are</Text>
                {endGuide ? <ScreenGuideKey title="WHERE YOU ARE" guide={endGuide} /> : null}
              </View>
            </View>
            <LabEndScreen
              labTitle={labTitle}
              units={CHECK_END_UNITS}
              cleared={cleared}
              unreadable={unreadable}
              mode="credit"
              noun="check"
              onJump={close}
              onPracticeAgain={close}
              onDone={() => {
                close();
                // Off this tap, once the layer is closing (never two screens at once).
                runSoon(() => safeGoBack(navigation));
              }}
              bottomInset
            />
          </ScreenGuideHost>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  endRoot: { flex: 1, backgroundColor: colors.screenBg },
  endHeader: { paddingHorizontal: 16, paddingBottom: 4, gap: 4 },
  endBack: { color: colors.amber, fontFamily: fonts.oswaldSemiBold, fontSize: 13, letterSpacing: 1, minHeight: 44, textAlignVertical: 'center', paddingTop: 12 },
  endTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  endTitle: { color: colors.textPrimary, fontFamily: fonts.oswaldSemiBold, fontSize: 18, letterSpacing: 1 },
});
