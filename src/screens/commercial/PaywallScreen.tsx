/**
 * PaywallScreen — academy upgrade paywall (CM7, Booth 2026-07-11). UI ONLY:
 * monthly + annual plans + the verbatim §2 marketing line. Store wiring
 * (RevenueCat / StoreKit) waits for the products ruling — the purchase buttons
 * are intentionally inert placeholders here. Prices are illustrative until the
 * store products are configured (ROUTE TO GOVERNANCE).
 */
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GlassButton } from '../../components/GlassButton';
import { COPY } from '../../lib/copy';
import { colors, fonts } from '../../theme/tokens';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Paywall'>;

type Plan = { id: 'lifetime' | 'annual' | 'monthly'; name: string; price: string; sub: string; badge?: string };
// Illustrative — real products come from the store config (governance).
const PLANS: Plan[] = [
  { id: 'lifetime', name: 'Lifetime Academy', price: '$99.99', sub: 'One-time payment', badge: 'BEST VALUE' },
  // $59.99/yr vs $9.99×12 = $119.88 → 50.0% saved (Booth 2026-07-11 #6).
  { id: 'annual', name: 'Annual', price: '$59.99 / yr', sub: 'About $5/mo', badge: 'SAVE 50%' },
  { id: 'monthly', name: 'Monthly', price: '$9.99 / mo', sub: 'Cancel anytime' },
];

export function PaywallScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<Plan['id']>('annual');

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <Pressable
        onPress={() => navigation.goBack()}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Close"
        style={styles.close}
      >
        <Text style={styles.closeGlyph}>✕</Text>
      </Pressable>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.eyebrow}>ACADEMY MODE</Text>
        <Text style={styles.title}>{COPY.paywallTitle}</Text>
        <Text style={styles.body}>{COPY.paywallBody}</Text>

        <View style={styles.plans}>
          {PLANS.map((p) => {
            const active = selected === p.id;
            return (
              <Pressable
                key={p.id}
                onPress={() => setSelected(p.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                style={[styles.plan, active && styles.planActive]}
              >
                <View style={styles.planHead}>
                  <Text style={styles.planName}>{p.name}</Text>
                  {p.badge && <Text style={styles.planBadge}>{p.badge}</Text>}
                </View>
                <Text style={styles.planPrice}>{p.price}</Text>
                <Text style={styles.planSub}>{p.sub}</Text>
                {/* End-of-year introductory deadline on every tier (user
                    request 2026-07-17). */}
                <Text style={styles.planDeadline}>{COPY.introDeadline}</Text>
                <View style={[styles.radio, active && styles.radioOn]}>
                  {active && <View style={styles.radioDot} />}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Beta pricing note (Booth 2026-07-18). */}
        <Text style={styles.betaNote}>{COPY.betaPricingNote}</Text>

        <GlassButton
          label="CONTINUE"
          // Glossary blue (Booth 2026-07-11 #2) — matches UPGRADE TO ACADEMY.
          tint="blue"
          height={54}
          fontSize={15}
          // Store wiring pending the RevenueCat/StoreKit ruling — inert for now.
          onPress={undefined}
        />
        <Text style={styles.storeNote}>Secure in-app purchase — available soon.</Text>

        <Text style={styles.legal}>
          Payment is charged to your app-store account. Subscriptions renew automatically unless canceled at least
          24 hours before the period ends. Manage or cancel in your app-store settings.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenBg },
  close: { position: 'absolute', top: 0, right: 0, zIndex: 2, padding: 16, marginTop: 8 },
  closeGlyph: { fontFamily: fonts.oswaldSemiBold, fontSize: 20, color: colors.textSub },
  scroll: { padding: 20, paddingTop: 8, gap: 14 },
  eyebrow: { fontFamily: fonts.oswaldSemiBold, fontSize: 12, letterSpacing: 2.4, color: colors.amber },
  title: { fontFamily: fonts.oswaldMedium, fontSize: 24, lineHeight: 29, color: colors.textPrimary },
  body: { fontFamily: fonts.barlowRegular, fontSize: 15, lineHeight: 22, color: colors.textSecondary },

  plans: { gap: 12, marginTop: 6 },
  // Beta pricing note (Booth 2026-07-18).
  betaNote: { fontFamily: fonts.barlowRegular, fontSize: 13.5, lineHeight: 19, color: colors.amberLabel },
  plan: {
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#2c2c2c',
    backgroundColor: '#151515',
    padding: 16,
    paddingRight: 44,
  },
  planActive: { borderColor: colors.amber, backgroundColor: '#1a1409' },
  planHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planName: { fontFamily: fonts.oswaldSemiBold, fontSize: 16, letterSpacing: 0.5, color: colors.textPrimary },
  planBadge: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 10,
    letterSpacing: 1,
    color: '#5bff85',
    borderWidth: 1,
    borderColor: 'rgba(55,224,95,.5)',
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 5,
  },
  planPrice: { fontFamily: fonts.oswaldBold, fontSize: 20, color: colors.amber, marginTop: 4 },
  planSub: { fontFamily: fonts.barlowRegular, fontSize: 13, color: colors.textSub, marginTop: 2 },
  // End-of-year deadline line — amber, on every plan (user request 2026-07-17).
  planDeadline: { fontFamily: fonts.barlowRegular, fontSize: 12, lineHeight: 16, color: colors.amberLabel, marginTop: 4 },
  radio: {
    position: 'absolute',
    right: 16,
    top: 18,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#4a4a4a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: colors.amber },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: colors.amber },

  storeNote: { fontFamily: fonts.barlowRegular, fontSize: 12.5, color: colors.textMuted, textAlign: 'center' },
  legal: {
    fontFamily: fonts.barlowRegular,
    fontSize: 11,
    lineHeight: 15,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
});
