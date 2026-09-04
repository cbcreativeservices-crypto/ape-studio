/**
 * PaywallScreen — academy upgrade paywall (CM7). LIVE (owner 2026-08-21): wired
 * to expo-iap via features/commercial/purchase.ts — CONTINUE starts the store
 * purchase, the server verifies the receipt (validate-purchase edge function)
 * and writes the entitlement, then refreshEntitlement reflects it. Restore
 * Purchases re-grants a prior buy. FAILS SAFE: no native module / un-deployed
 * edge function → nothing is granted and the UI explains; never a fake unlock.
 * The plan prices below are display copy mirroring public.products; the store is
 * the source of truth at purchase. Store product IDs: features/commercial/
 * iapProducts.ts. Owner setup: docs/APE_IAP_PLAN_2026_08_21.md.
 */
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GlassButton } from '../../components/GlassButton';
import { COPY } from '../../lib/copy';
import { colors, fonts } from '../../theme/tokens';
import { useEntitlement } from '../../features/commercial/EntitlementProvider';
import { buyPlan, initPurchases, restorePurchases, teardownPurchases } from '../../features/commercial/purchase';
import type { PlanId } from '../../features/commercial/iapProducts';
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
  const { refreshEntitlement, isMember } = useEntitlement();
  const [selected, setSelected] = useState<Plan['id']>('annual');
  const [busy, setBusy] = useState(false);
  // Whether in-app purchasing is usable in THIS build (native module present +
  // store connection). Assume true until init says otherwise.
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    let alive = true;
    void initPurchases({
      onSuccess: () => {
        // Server verified the receipt + wrote the entitlement — reflect it now.
        void refreshEntitlement().then(() => {
          if (!alive) return;
          setBusy(false);
          Alert.alert('Welcome to Academy', 'Your Academy access is active. Enjoy!', [
            { text: 'Great', onPress: () => navigation.goBack() },
          ]);
        });
      },
      onError: (message) => {
        if (!alive) return;
        setBusy(false);
        if (message) Alert.alert('Purchase', message);
      },
    }).then((ok) => {
      if (alive) setAvailable(ok);
    });
    return () => {
      alive = false;
      void teardownPurchases();
    };
  }, [refreshEntitlement, navigation]);

  const onContinue = () => {
    // A paying member must never be walked into a duplicate store purchase
    // (QA night 2026-08-31).
    if (isMember) {
      Alert.alert(
        'You’re a member',
        'Your Academy access is already active. Manage or cancel in your app-store subscription settings.',
      );
      return;
    }
    if (!available) {
      Alert.alert(
        'Purchasing unavailable',
        'In-app purchases aren’t available in this build yet. Please update the app, or restore a previous purchase.',
      );
      return;
    }
    setBusy(true);
    buyPlan(selected as PlanId).catch((e: unknown) => {
      setBusy(false);
      Alert.alert('Purchase', (e as Error)?.message ?? 'The purchase could not be started.');
    });
  };

  const onRestore = () => {
    setBusy(true);
    restorePurchases()
      .then(async (any) => {
        if (any) await refreshEntitlement();
        setBusy(false);
        Alert.alert(
          any ? 'Purchases restored' : 'Nothing to restore',
          any ? 'Your Academy access has been restored.' : 'No previous Academy purchase was found for this store account.',
          any ? [{ text: 'Great', onPress: () => navigation.goBack() }] : undefined,
        );
      })
      .catch(() => setBusy(false));
  };

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
                accessibilityState={{ checked: active }}
                // Screen readers heard "radio button" ×3 with no plan/price (E2-04).
                accessibilityLabel={`${p.name}${p.badge ? `, ${p.badge}` : ''}, ${p.price}, ${p.sub}`}
                style={[styles.plan, active && styles.planActive]}
              >
                <View style={styles.planHead}>
                  <Text style={styles.planName}>{p.name}</Text>
                  {p.badge && <Text style={styles.planBadge}>{p.badge}</Text>}
                </View>
                <Text style={styles.planPrice}>{p.price}</Text>
                {/* Annual's sub is the savings cue → green; others muted. */}
                <Text style={[styles.planSub, p.id === 'annual' && styles.planSubSave]}>{p.sub}</Text>
                {/* Per-card end-of-year deadline consolidated to ONE note under
                    the plans (owner 2026-08-21) — was repeated on all 3 tiers. */}
                <View style={[styles.radio, active && styles.radioOn]}>
                  {active && <View style={styles.radioDot} />}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Pricing-honesty promise at the decision point (owner 2026-08-21),
            echoing the onboarding "Commitment". The check + hairline divider make
            it read as a commitment, not a stray line. */}
        <View style={styles.promiseRow}>
          <Text style={styles.promiseCheck}>✓</Text>
          <Text style={styles.valueLine}>One membership. Not a series of extra charges.</Text>
        </View>

        {/* Single consolidated pricing/deadline note (Booth 2026-07-18; owner
            2026-08-21 made it the ONE place the end-of-year deadline appears). */}
        <Text style={styles.betaNote}>{COPY.betaPricingNote}</Text>

        {busy ? (
          <View style={styles.busyWrap}>
            <ActivityIndicator color={colors.amber} />
          </View>
        ) : (
          <GlassButton
            label="CONTINUE"
            // Glossary blue (Booth 2026-07-11 #2) — matches UPGRADE TO ACADEMY.
            tint="blue"
            height={54}
            fontSize={15}
            onPress={onContinue}
          />
        )}
        <Pressable onPress={busy ? undefined : onRestore} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.restore}>Restore purchases</Text>
        </Pressable>
        {/* One consolidated renewal/legal line (owner 2026-08-21 — merged the
            two near-duplicate app-store notes). */}
        <Text style={styles.legal}>
          Secure in-app purchase. Subscriptions renew automatically unless cancelled at least 24 hours before the
          period ends — manage or cancel anytime in your app-store settings.
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
  // Pricing-honesty promise (owner 2026-08-21): a check + hairline divider so it
  // reads as a commitment at the decision point.
  promiseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e1e1e',
  },
  promiseCheck: { fontFamily: fonts.oswaldSemiBold, fontSize: 13, color: '#5bff85' },
  valueLine: {
    fontFamily: fonts.oswaldSemiBold,
    fontSize: 14,
    letterSpacing: 0.3,
    lineHeight: 20,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  // Single consolidated pricing/deadline note (Booth 2026-07-18).
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
  // Annual savings cue — green (value signal at a glance).
  planSubSave: { color: '#5bff85' },
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

  busyWrap: { height: 54, alignItems: 'center', justifyContent: 'center' },
  restore: {
    fontFamily: fonts.barlowSemiBold,
    fontSize: 13,
    color: colors.amber,
    textAlign: 'center',
    paddingVertical: 6,
  },
  legal: {
    fontFamily: fonts.barlowRegular,
    fontSize: 11,
    lineHeight: 15,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
});
