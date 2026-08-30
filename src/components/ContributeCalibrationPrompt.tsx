/**
 * ContributeCalibrationPrompt — shown right after a user sets their SPL
 * calibration (owner 2026-08-21: crowdsourced mic catalog, Tier B). Asks, with a
 * plain-language disclosure, whether to contribute the calibration ANONYMOUSLY
 * to the community catalog, and captures the REFERENCE QUALITY (what they matched
 * against) so aggregation can weight it.
 *
 * Consent is opt-in: "Contribute" turns it on and queues this contribution;
 * "Not now" turns it OFF (no nagging — re-enable in Settings). Nothing is sent
 * here — queueContribution only stores locally; upload is a separate, reviewed,
 * consent-gated step. Anonymous by construction: no account/PII/audio/geo.
 */
import { useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { ApeDsp } from '../../modules/ape-dsp';
import {
  buildCapabilityRecord,
  makeContribution,
  queueContribution,
  setCrowdsourceConsent,
  type ReferenceQuality,
} from '../features/tools/measure/deviceProfile';
import { uploadQueuedContributions } from '../features/tools/measure/catalogClient';
import { colors, fonts } from '../theme/tokens';

const REFS: { key: ReferenceQuality; label: string; sub: string }[] = [
  { key: 'calibrator', label: 'Acoustic calibrator', sub: '94 / 114 dB piston or coupler' },
  { key: 'type1_2_meter', label: 'SPL meter', sub: 'a real sound-level meter (Type 1/2)' },
  { key: 'consumer_app', label: 'Another app or phone', sub: 'a consumer SPL app' },
  { key: 'eyeballed', label: 'Rough guess', sub: 'no reference — estimated by ear' },
];

export function ContributeCalibrationPrompt({
  visible,
  onClose,
  offsetDb,
  nominalStart,
}: {
  visible: boolean;
  onClose: () => void;
  offsetDb: number;
  nominalStart: number;
}): ReactNode {
  const [ref, setRef] = useState<ReferenceQuality | null>(null);
  const [busy, setBusy] = useState(false);

  const close = () => {
    setRef(null);
    setBusy(false);
    onClose();
  };

  const contribute = async () => {
    if (ref == null || busy) return;
    setBusy(true);
    try {
      await setCrowdsourceConsent(true); // opting in
      const info = ApeDsp.isAvailable() ? ApeDsp.getInfo() : null;
      const micInfo = ApeDsp.isAvailable() ? ApeDsp.getMicrophoneInfo() : null;
      const record = buildCapabilityRecord(info, { micInfo });
      const c = makeContribution({ record, offsetDb, nominalStart, referenceQuality: ref });
      await queueContribution(c);
      void uploadQueuedContributions(); // best-effort drain now; retries later if offline
    } catch {
      /* best-effort — never block calibration on a contribution write */
    }
    close();
  };

  const decline = async () => {
    try {
      await setCrowdsourceConsent(false); // don't nag; re-enable in Settings
    } catch {
      /* best-effort */
    }
    close();
  };

  return (
    <Modal accessibilityViewIsModal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.scrim}>
        <View style={styles.card}>
          <Text style={styles.title}>HELP CALIBRATE YOUR PHONE MODEL</Text>
          <Text style={styles.body}>
            Contribute this calibration anonymously so other owners of your phone start closer to accurate. We send only
            your offset and phone model — never audio, location, or anything that identifies you.
          </Text>
          <Text style={styles.section}>What did you calibrate against?</Text>
          <View style={styles.opts}>
            {REFS.map((r) => {
              const sel = ref === r.key;
              return (
                <Pressable
                  key={r.key}
                  style={[styles.opt, sel && styles.optSel]}
                  onPress={() => setRef(r.key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: sel }}
                  accessibilityLabel={`${r.label} — ${r.sub}`}
                >
                  <Text style={[styles.optLabel, sel && styles.optLabelSel]}>{r.label}</Text>
                  <Text style={styles.optSub}>{r.sub}</Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            style={[styles.cta, (ref == null || busy) && styles.ctaDisabled]}
            onPress={contribute}
            disabled={ref == null || busy}
            accessibilityRole="button"
            accessibilityLabel="Contribute anonymously"
          >
            <Text style={styles.ctaText}>CONTRIBUTE ANONYMOUSLY</Text>
          </Pressable>
          <Pressable onPress={decline} hitSlop={8} accessibilityRole="button" accessibilityLabel="Not now">
            <Text style={styles.dismiss}>NOT NOW</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2b2b33',
    backgroundColor: '#141418',
    padding: 22,
    gap: 12,
  },
  title: { fontFamily: fonts.oswaldSemiBold, fontSize: 14, letterSpacing: 1.4, color: colors.amber, textAlign: 'center' },
  body: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary, textAlign: 'center' },
  section: { fontFamily: fonts.oswaldSemiBold, fontSize: 11.5, letterSpacing: 1, color: colors.textMuted, textAlign: 'center', marginTop: 2 },
  opts: { gap: 8 },
  opt: { borderRadius: 10, borderWidth: 1, borderColor: '#2b2b33', backgroundColor: '#101014', paddingVertical: 10, paddingHorizontal: 14 },
  optSel: { borderColor: colors.amber, backgroundColor: '#1c1608' },
  optLabel: { fontFamily: fonts.oswaldSemiBold, fontSize: 13.5, letterSpacing: 0.4, color: colors.textPrimary },
  optLabelSel: { color: colors.amber },
  optSub: { fontFamily: fonts.barlowRegular, fontSize: 12, color: colors.textMuted, marginTop: 1 },
  cta: {
    marginTop: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,198,77,.55)',
    backgroundColor: '#1c1608',
    paddingVertical: 12,
    alignItems: 'center',
  },
  ctaDisabled: { opacity: 0.45 },
  ctaText: { fontFamily: fonts.oswaldSemiBold, fontSize: 13.5, letterSpacing: 1.2, color: colors.amber },
  dismiss: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 1, color: colors.textMuted, paddingVertical: 6, textAlign: 'center' },
});
