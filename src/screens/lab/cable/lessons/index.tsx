/**
 * Lesson body registry for the Cable & Connector Fundamentals Lab.
 * One component per lesson, keyed by CableLessonId — the stepped shell mounts
 * ONLY the active lesson (Foundations/MicSelect per-step mount rule, so the
 * ~dozens of connector illustrations never coexist in the tree).
 *
 * BUILD STATE (plan B1, 2026-08-15): scaffold bodies — each renders the
 * lesson's teaching goal while the full interactive content lands phase by
 * phase (B3–B8 in docs/APE_CABLE_LAB_PLAN_2026_08_15.md). The lab is NOT
 * listed as complete anywhere while scaffolds remain; completion units only
 * clear from real solved checks, so the lab cannot complete in this state
 * (§1.7 honesty holds structurally).
 */
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../../../theme/tokens';
import type { CableLessonId } from '../cableTypes';
import { CORE_PRINCIPLE } from '../data/lessons';

/** The central principle, shown as the amber lesson banner (MicSelect idiom). */
export function PrincipleBanner() {
  return (
    <View style={styles.banner}>
      <Text style={styles.bannerText}>{CORE_PRINCIPLE}</Text>
    </View>
  );
}

function Scaffold({ goal }: { goal: string }) {
  return (
    <View style={styles.goalCard}>
      <Text style={styles.goalEyebrow}>THIS LESSON TEACHES</Text>
      <Text style={styles.goalText}>{goal}</Text>
    </View>
  );
}

const L01 = () => (
  <>
    <PrincipleBanner />
    <Scaffold goal="Sorting every connection by WHAT travels through it — signal, data, or power — before any connector is named." />
  </>
);
const L02 = () => (
  <Scaffold goal="Naming every part of a connector and cable, and seeing each internal layer of seven cable constructions." />
);
const L03 = () => (
  <Scaffold goal="Reading XLR, TS, TRS, 3.5 mm, RCA and combo connectors contact by contact — what each can and cannot carry." />
);
const L04 = () => (
  <>
    <PrincipleBanner />
    <Scaffold goal="Telling look-alike cables apart, and the technically honest consequence of swapping them." />
  </>
);
const L05 = () => (
  <Scaffold goal="Line-level vs speaker-level vs mains on and around loudspeakers — and the connectors that keep them apart." />
);
const L06 = () => (
  <Scaffold goal="Connector versus protocol: USB, Ethernet, BNC, TOSLINK, HDMI and MIDI, and what compatibility really requires." />
);
const L07 = () => (
  <Scaffold goal="Identifying, inspecting and safely using power connectors — with hard boundaries around qualified-person work." />
);
const L08 = () => (
  <Scaffold goal="Choosing a defensible cable end-to-end for real source→destination scenarios, with trade-offs explained." />
);
const L09 = () => (
  <Scaffold goal="Professional handling habits and a trained inspection eye — find every fault in the scene." />
);
const L10 = () => (
  <Scaffold goal="Reading a cable tester's continuity map, naming the fault, and deciding the cable's disposition." />
);
const L11 = () => (
  <Scaffold goal="Cabling a small live show and a small studio correctly — routing, power separation, power-up order, fault hunts." />
);
const L12 = () => (
  <Scaffold goal="The final knowledge check — including the electrical-safety decisions that must each be answered correctly." />
);

export const LESSON_BODIES: Record<CableLessonId, () => React.JSX.Element> = {
  l01_what_travels: L01,
  l02_anatomy: L02,
  l03_analog: L03,
  l04_same_plug: L04,
  l05_loudspeaker: L05,
  l06_digital: L06,
  l07_power: L07,
  l08_selection: L08,
  l09_handling: L09,
  l10_tester: L10,
  l11_challenge: L11,
  l12_final: L12,
};

const styles = StyleSheet.create({
  banner: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,180,0,.45)',
    backgroundColor: '#1a1409',
    padding: 11,
  },
  bannerText: { fontFamily: fonts.barlowMedium, fontSize: 13, lineHeight: 18.5, color: colors.textSecondary },
  goalCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#232329',
    backgroundColor: '#101014',
    padding: 12,
    gap: 6,
  },
  goalEyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 10.5, letterSpacing: 1.6, color: colors.amberLabel },
  goalText: { fontFamily: fonts.barlowRegular, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
});
