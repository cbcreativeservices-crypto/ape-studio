/**
 * LAB REQUIREMENTS — what the labs still owe this learner's credential.
 *
 * Opened from the LAB row in My Enrollment (owner 2026-09-20, replacing the
 * OPEN LABS button, which jumped straight to the labs menu and left the
 * learner to work out which of them they actually needed).
 *
 * Two lists, because they answer two different questions:
 *   · AUDIO FUNDAMENTALS — required for every certificate and every program,
 *     no exceptions. If a lab is in that area, it is on this list.
 *   · REQUIRED FOR THIS CREDENTIAL — the member labs this one specifically
 *     needs, each with a line saying why.
 *
 * ⛔ A LAB IS COMPLETED ONCE, AND COUNTS EVERYWHERE. Several credentials may
 * require the same lab; none of them asks for it twice. The tick here is the
 * same tick the lab itself set.
 */
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Modal } from './DimModal';
import { LabChecklist, LabChecklistSummary } from './LabChecklist';
import { StudioButton } from './StudioButton';
import type { LabRequirementRow } from '../features/lab/labRequirementList';
import { colors, fonts } from '../theme/tokens';

export function LabRequirementsSheet({
  visible,
  credentialName,
  fundamentals,
  member,
  onOpenLab,
  onOpenLabsMenu,
  onClose,
}: {
  visible: boolean;
  /** The certificate or program this list is for. Null = fundamentals only. */
  credentialName?: string | null;
  fundamentals: readonly LabRequirementRow[];
  member: readonly LabRequirementRow[];
  onOpenLab: (row: LabRequirementRow) => void;
  onOpenLabsMenu: () => void;
  onClose: () => void;
}) {
  const all = [...fundamentals, ...member];
  return (
    <Modal accessibilityViewIsModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.sheet}>
          <View style={s.head}>
            <View style={{ flex: 1 }}>
              <Text style={s.eyebrow}>LAB REQUIREMENTS</Text>
              <Text style={s.title} numberOfLines={2}>
                {credentialName ?? 'Your credential'}
              </Text>
            </View>
          </View>

          <LabChecklistSummary rows={all} />

          <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator>
            <Text style={s.groupHead}>AUDIO FUNDAMENTALS</Text>
            <Text style={s.groupNote}>
              Required for every certificate and program. Complete a lab once and it counts toward all of them.
            </Text>
            <LabChecklist rows={fundamentals} onOpen={onOpenLab} />

            {member.length > 0 ? (
              <>
                <Text style={s.groupHead}>REQUIRED FOR THIS CREDENTIAL</Text>
                <Text style={s.groupNote}>Member labs this credential needs on top of the fundamentals.</Text>
                <LabChecklist rows={member} onOpen={onOpenLab} />
                {/* ⚠️ Say it rather than let the dashes puzzle them. Member
                    labs record no progress yet, so the summary above counts
                    only the fundamentals — and a learner who finished all of
                    these would otherwise wonder why nothing moved. */}
                {member.some((m) => !m.tracked) ? (
                  <Text style={s.trackNote}>
                    These labs don’t record progress yet, so they aren’t counted in the total above. Work through them
                    from the labs menu — your credential needs them.
                  </Text>
                ) : null}
              </>
            ) : (
              /* Say it plainly. Silence here reads as "the list failed to
                 load" rather than "there is nothing more to do". */
              <Text style={s.noneNote}>
                This credential needs no member labs beyond the Audio Fundamentals above.
              </Text>
            )}
          </ScrollView>

          <View style={s.actions}>
            <View style={{ flex: 1 }}>
              <StudioButton label="Go to labs" onPress={onOpenLabsMenu} />
            </View>
            <View style={{ flex: 1 }}>
              <StudioButton label="Close" variant="secondary" onPress={onClose} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    maxHeight: '88%',
    backgroundColor: '#121214',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2a2e',
    padding: 16,
    gap: 12,
  },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  eyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 10, letterSpacing: 2, color: colors.blue },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 18, color: colors.textPrimary, marginTop: 2 },
  scroll: { gap: 8, paddingBottom: 4 },
  groupHead: { fontFamily: fonts.oswaldSemiBold, fontSize: 11, letterSpacing: 1.6, color: colors.amber, marginTop: 6 },
  groupNote: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 18, color: colors.textSubAlt, marginBottom: 2 },
  trackNote: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 17, color: colors.textSubAlt, marginTop: 6 },
  noneNote: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 19, color: colors.textSubAlt, marginTop: 8 },
  actions: { flexDirection: 'row', gap: 10 },
});
