/**
 * Membership and billing (exit flow, 2026-10-15; EXIT_FLOW_ENABLED, ON 2026-10-24).
 *
 * Shows the REAL state from the entitlement record — plan, billing provider,
 * renewal — and only the action that state allows:
 *   renewing     → "Renews on {date}" + Cancel membership
 *   renewal off  → "Your paid access ends on {date}" (no cancel)
 *   lifetime     → "Lifetime membership — no renewal to cancel"
 *   unknown      → "We couldn't confirm your renewal status" (never renews/ends)
 *                  + Cancel membership (still billed as far as we know)
 *   lapsed       → the store's terms, never "cancelled"
 *   none         → "No active payment" + delete-account link
 * Manage subscription is always offered. Re-reads on return to the app (the
 * person may have changed it in the store).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { safeGoBack } from '../../lib/safeGoBack';
import { MEMBERSHIP_NOT_CONFIRMED } from '../../features/commercial/tier';
import { openSubscriptions, readMembership } from '../../features/exit/api';
import { formatDate, membershipView, type MembershipCard, type MembershipView, type PlanKind } from '../../features/exit/membershipState';
import { PROVIDER_NAME, type Provider } from '../../features/exit/survey';
import { Btn, ExitHeader, Section, ui } from './exitUi';

type Props = NativeStackScreenProps<RootStackParamList, 'MembershipBilling'>;

type Load = { state: 'loading' } | { state: 'failed' } | { state: 'ready'; view: MembershipView };

const PLAN_NAME: Record<Exclude<PlanKind, null>, string> = {
  monthly: 'Monthly membership',
  annual: 'Annual membership',
  lifetime: 'Lifetime membership',
};
const planName = (p: PlanKind) => (p ? PLAN_NAME[p] : 'Academy membership');
const billedBy = (p: Provider) => `Billed through ${PROVIDER_NAME[p]}`;

export function MembershipBillingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [load, setLoad] = useState<Load>({ state: 'loading' });
  const alive = useRef(true);
  const seq = useRef(0);

  const refresh = useCallback(async () => {
    const mine = ++seq.current;
    const res = await readMembership();
    if (!alive.current || mine !== seq.current) return;
    setLoad(res.ok ? { state: 'ready', view: membershipView(res.rows, res.renewalKnown) } : { state: 'failed' });
  }, []);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // On every focus (first open, and back from the cancel flow) and on return
  // to the app from the store page.
  useFocusEffect(
    useCallback(() => {
      void refresh();
      const sub = AppState.addEventListener('change', (s) => {
        if (s === 'active') void refresh();
      });
      return () => sub.remove();
    }, [refresh]),
  );

  const view = load.state === 'ready' ? load.view : null;
  const firstProvider: Provider | null =
    view?.state === 'active'
      ? ((view.cards.find((c) => 'provider' in c && c.provider) as { provider: Provider } | undefined)?.provider ?? null)
      : view?.state === 'lapsed'
        ? view.provider
        : null;

  const renderCard = (c: MembershipCard, i: number) => {
    switch (c.kind) {
      case 'renewing': {
        const d = formatDate(c.endsAt);
        return (
          <Section key={i}>
            <Text style={ui.strong}>{planName(c.plan)}</Text>
            <Text style={ui.note}>{billedBy(c.provider)}</Text>
            <Text style={ui.body}>{d ? `Renews on ${d}` : 'Renews automatically'}</Text>
            <Btn
              label="Cancel membership"
              onPress={() => navigation.navigate('CancelMembership', { provider: c.provider, endsAt: c.endsAt })}
            />
          </Section>
        );
      }
      case 'renewal_off': {
        const d = formatDate(c.endsAt);
        return (
          <Section key={i}>
            <Text style={ui.strong}>{planName(c.plan)}</Text>
            <Text style={ui.note}>{billedBy(c.provider)}</Text>
            <Text style={ui.body}>{d ? `Your paid access ends on ${d}` : 'Your membership will not renew.'}</Text>
          </Section>
        );
      }
      case 'unknown':
        return (
          <Section key={i}>
            <Text style={ui.strong}>{planName(c.plan)}</Text>
            <Text style={ui.note}>{billedBy(c.provider)}</Text>
            <Text style={ui.body}>We couldn’t confirm your renewal status.</Text>
            {/* Still billed as far as we know: the cancel flow stays reachable
                (it never claims an outcome the server has not confirmed). */}
            <Btn
              label="Cancel membership"
              onPress={() => navigation.navigate('CancelMembership', { provider: c.provider, endsAt: c.endsAt })}
            />
          </Section>
        );
      case 'lifetime':
        return (
          <Section key={i}>
            <Text style={ui.strong}>Lifetime membership — no renewal to cancel</Text>
            {c.provider ? <Text style={ui.note}>{`Bought through ${PROVIDER_NAME[c.provider]}`}</Text> : null}
          </Section>
        );
      case 'granted': {
        const d = formatDate(c.endsAt);
        return (
          <Section key={i}>
            <Text style={ui.strong}>No active payment</Text>
            {d ? <Text style={ui.body}>{`Your access ends on ${d}`}</Text> : null}
          </Section>
        );
      }
    }
  };

  return (
    <View style={[ui.root, { paddingTop: insets.top + 8 }]}>
      <ExitHeader eyebrow="MEMBERSHIP AND BILLING" onBack={() => safeGoBack(navigation)} />
      <ScrollView contentContainerStyle={[ui.scroll, { paddingBottom: insets.bottom + 24 }]}>
        <Text style={ui.title} accessibilityRole="header">
          Membership and billing
        </Text>

        {load.state === 'loading' ? <Text style={ui.body}>Checking your account…</Text> : null}

        {load.state === 'failed' ? (
          <Section>
            <Text style={ui.body}>{MEMBERSHIP_NOT_CONFIRMED}</Text>
            <Btn
              label="Try again"
              onPress={() => {
                setLoad({ state: 'loading' });
                void refresh();
              }}
            />
          </Section>
        ) : null}

        {view?.state === 'active' ? view.cards.map(renderCard) : null}

        {view?.state === 'lapsed' ? (
          <Section>
            <Text style={ui.strong}>No active payment</Text>
            {/* OWNER-APPROVED COPY (2026-10-24) — the store's own terms, never "cancelled". */}
            <Text style={ui.body}>
              {view.provider
                ? `Your paid access has ended. If a payment did not go through, ${PROVIDER_NAME[view.provider]} shows the details in your subscription settings.`
                : 'Your paid access has ended.'}
            </Text>
          </Section>
        ) : null}

        {view?.state === 'none' ? (
          <Section>
            <Text style={ui.strong}>No active payment</Text>
          </Section>
        ) : null}

        <Btn label="Manage subscription" kind="primary" onPress={() => void openSubscriptions(firstProvider, 'membership')} />

        {view && view.state !== 'active' ? (
          <Btn label="Delete account and personal data" kind="link" onPress={() => navigation.navigate('DeleteAccountFlow')} />
        ) : null}
      </ScrollView>
    </View>
  );
}
