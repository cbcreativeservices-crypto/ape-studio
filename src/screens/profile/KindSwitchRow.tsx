/**
 * Employer ⇄ Company, for a verified organization: a Company does not hire, an
 * Employer does. Institutions and instructors have no switch.
 *
 * Draws NOTHING unless the server says the switch is available (`can_switch`).
 * It is closed today (`new_kinds_open` is false), so no control sits on a
 * Profile that would only refuse. The answer of the write decides what is shown:
 * a refusal is said in plain words and the account reads as it was.
 */
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { confirmDialog, notify } from '../../lib/confirm';
import { fonts } from '../../theme/tokens';
import { fetchVerifiedStatus, switchVerifiedKind } from '../../features/employer/api';
import { VERIFIER_COPY, type VerifiedStatus } from '../../features/employer/verifierKind';

const COPY: Record<'company' | 'employer', { label: string; body: string }> = {
  company: {
    label: 'Switch to a Company account',
    body: 'A Company shows a COMPANY plate and does not post jobs. You can switch back after a day.',
  },
  employer: {
    label: 'Switch to an Employer account',
    body: 'An Employer shows an EMPLOYER plate and can post jobs. You can switch back after a day.',
  },
};

export function KindSwitchRow({ onSwitched }: { onSwitched?: () => void }) {
  const [status, setStatus] = useState<VerifiedStatus | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let alive = true;
    void fetchVerifiedStatus().then((s) => {
      if (alive) setStatus(s);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!status?.canSwitch || (status.switchTo !== 'company' && status.switchTo !== 'employer')) return null;
  const to = status.switchTo;
  const copy = COPY[to];
  const waiting = status.nextSwitchAt && new Date(status.nextSwitchAt).getTime() > Date.now();

  const ask = () =>
    confirmDialog(copy.label, copy.body, 'SWITCH', () => {
      setBusy(true);
      void switchVerifiedKind(to).then(async (r) => {
        setBusy(false);
        if (!r.ok) {
          notify('Not switched', r.error);
          return;
        }
        setStatus(await fetchVerifiedStatus());
        onSwitched?.();
        notify('Switched', `Your account now shows ${VERIFIER_COPY[r.kind].badge}.`);
      });
    });

  return (
    <View style={st.wrap}>
      <Pressable
        onPress={ask}
        disabled={busy || !!waiting}
        style={({ pressed }) => [st.row, (busy || !!waiting) && st.off, pressed && st.pressed]}
        accessibilityRole="button"
        accessibilityLabel={copy.label}
        accessibilityState={{ disabled: busy || !!waiting }}
        aria-disabled={busy || !!waiting}
      >
        <Text style={st.label}>{copy.label} ›</Text>
      </Pressable>
      {waiting ? (
        <Text style={st.note}>You switched recently. You can switch again after {new Date(status.nextSwitchAt as string).toLocaleString()}.</Text>
      ) : null}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { marginTop: 10 },
  row: { minHeight: 44, justifyContent: 'center' },
  off: { opacity: 0.5 },
  pressed: { opacity: 0.7 },
  label: { fontFamily: fonts.oswaldMedium, fontSize: 12.5, letterSpacing: 1, color: '#ffc64d' },
  note: { fontFamily: fonts.barlowRegular, fontSize: 12.5, lineHeight: 17, color: '#a6a6ad' },
});
