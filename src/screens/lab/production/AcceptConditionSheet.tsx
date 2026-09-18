/**
 * AcceptConditionSheet — record that an authorised person accepted a blocker
 * rather than fixing it.
 *
 * This is how a real production proceeds with a known gap, and it is the ONLY
 * other way a blocker clears. The engine has supported it from the start
 * (readiness.ts counts it, packet.ts prints it) and nothing could create one,
 * so the "Ready With Approved Conditions" verdict was unreachable.
 *
 * It asks for a NAME and a REASON, and the store refuses an acceptance missing
 * either. That is deliberate and worth defending: without it this becomes a
 * dismiss button, and a dismiss button on a safety or legal blocker is the
 * worst control this lab could ship. The acceptance then prints in the packet,
 * so proceeding with a known gap is visible rather than buried.
 */
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Modal } from '../../../components/DimModal';
import { colors, fonts } from '../../../theme/tokens';
import type { Finding } from '../../../features/production/types';

export function AcceptConditionSheet({
  finding,
  onCancel,
  onAccept,
}: {
  /** The blocker being accepted. Null closes the sheet. */
  finding: Finding | null;
  onCancel: () => void;
  onAccept: (acceptedBy: string, reason: string) => void;
}) {
  const [name, setName] = useState('');
  const [reason, setReason] = useState('');
  const ready = name.trim().length > 0 && reason.trim().length > 0;

  const close = () => {
    setName('');
    setReason('');
    onCancel();
  };

  return (
    <Modal
      accessibilityViewIsModal
      visible={finding != null}
      transparent
      animationType="fade"
      onRequestClose={close}
    >
      <Pressable accessible={false} style={styles.backdrop} onPress={close}>
        <Pressable accessible={false} style={styles.card} onPress={() => {}}>
          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.kicker}>ACCEPT A CONDITION</Text>
            <Text style={styles.title}>{finding?.title}</Text>
            <Text style={styles.detail}>{finding?.detail}</Text>

            <View style={styles.warn}>
              <Text style={styles.warnText}>
                This does not fix the problem. It records that a named person decided the production can
                proceed anyway, and it prints in the packet beside the plan.
              </Text>
            </View>

            <Text style={styles.label}>Who is accepting this?</Text>
            <Text style={styles.help}>
              A person, not a role. The one who carries the decision if it turns out to be wrong.
            </Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Name"
              placeholderTextColor={colors.textMuted}
              accessibilityLabel="Name of the person accepting this condition"
            />

            <Text style={styles.label}>Why can the production proceed?</Text>
            <Text style={styles.help}>
              What makes this acceptable, and what has been done instead. Whoever reads the packet has to
              understand the decision without asking you.
            </Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={reason}
              onChangeText={setReason}
              placeholder="Reason"
              placeholderTextColor={colors.textMuted}
              multiline
              accessibilityLabel="Reason this condition is accepted"
            />

            <View style={styles.actions}>
              <Pressable style={styles.cancel} onPress={close} accessibilityRole="button" accessibilityLabel="Cancel">
                <Text style={styles.cancelText}>CANCEL</Text>
              </Pressable>
              <Pressable
                style={[styles.accept, !ready && styles.acceptOff]}
                disabled={!ready}
                onPress={() => {
                  onAccept(name.trim(), reason.trim());
                  setName('');
                  setReason('');
                }}
                accessibilityRole="button"
                accessibilityState={{ disabled: !ready }}
                accessibilityLabel="Record this accepted condition"
              >
                <Text style={[styles.acceptText, !ready && styles.acceptTextOff]}>RECORD IT</Text>
              </Pressable>
            </View>
            {!ready ? (
              // Say WHY the control is unavailable rather than leaving the user
              // to guess at a greyed-out button.
              <Text style={styles.needBoth}>Both a name and a reason are needed.</Text>
            ) : null}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,.66)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '86%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2a2a31',
    backgroundColor: '#101014',
  },
  body: { padding: 18, gap: 9 },
  kicker: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1.1, color: colors.textMuted },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, color: colors.red },
  detail: { fontFamily: fonts.barlowRegular, fontSize: 13, lineHeight: 19, color: colors.textSub },

  warn: {
    borderLeftWidth: 3,
    borderLeftColor: colors.amber,
    backgroundColor: 'rgba(255,198,77,.08)',
    borderRadius: 6,
    padding: 10,
    marginTop: 3,
  },
  warnText: { fontFamily: fonts.barlowMedium, fontSize: 12.5, lineHeight: 18, color: colors.textSecondary },

  label: { fontFamily: fonts.barlowSemiBold, fontSize: 13.5, color: colors.textPrimary, marginTop: 8 },
  help: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 17, color: colors.textSub },
  input: {
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 8,
    backgroundColor: '#131316',
    paddingHorizontal: 11,
    paddingVertical: 9,
    fontFamily: fonts.barlowRegular,
    fontSize: 14,
    color: colors.textPrimary,
  },
  multiline: { minHeight: 74, textAlignVertical: 'top' },

  actions: { flexDirection: 'row', gap: 9, marginTop: 12 },
  cancel: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1, color: colors.textSub },
  accept: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.5)',
    backgroundColor: 'rgba(255,198,77,.12)',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  acceptOff: { borderColor: colors.hairline, backgroundColor: 'transparent' },
  acceptText: { fontFamily: fonts.oswaldSemiBold, fontSize: 12.5, letterSpacing: 1, color: colors.amber },
  acceptTextOff: { color: colors.textMutedDeep },
  needBoth: { fontFamily: fonts.barlowRegular, fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: 5 },
});
