/**
 * Delete account and personal data (exit flow, 2026-10-15; behind
 * EXIT_FLOW_ENABLED). Settings › Account and privacy. Never requires the
 * cancel flow first. Deletion stays IMMEDIATE (owner decision).
 *
 *   D1 Review — spec text, Questions 1 and 2 inline (optional), "Cancel
 *      membership and keep my account" (only while a subscription renews),
 *      and the CERTIFICATE CHOICE when the person holds a certificate (or we
 *      could not tell): two options, NOTHING PRESELECTED.
 *   D2 Billing and identity — each store subscription still billing with its
 *      store's warning + Manage subscription; password re-entry; one "Delete my
 *      account" button, disabled until a certificate outcome is chosen, then a
 *      deliberate confirmDialog.
 *   D3 "Your account has been deleted" — thank-you by first name (held in this
 *      screen's memory only, read before the delete), optional comment sent
 *      without an account, Done → Splash.
 *
 * The device side after the server delete is the hold button's path exactly
 * (features/exit/api finishAccountErasure). Survey answers are sent AFTER the
 * delete, without an account, so the erased account leaves no linked answers.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { safeGoBack } from '../../lib/safeGoBack';
import { useBackWhileFocused } from '../../lib/useBackWhileFocused';
import { useLatchedPress } from '../../lib/latch';
import { confirmDialog, notify } from '../../lib/confirm';
import { TextField } from '../../components/TextField';
import { trackEvent } from '../../features/telemetry/telemetry';
import { MEMBERSHIP_NOT_CONFIRMED } from '../../features/commercial/tier';
import { confirmCurrentPassword } from '../../features/auth/api';
import {
  deleteMyAccount,
  openSubscriptions,
  readFirstName,
  readHasCredential,
  readMembership,
  submitExitFeedback,
} from '../../features/exit/api';
import {
  deleteEnabled,
  membershipView,
  providersStillBilling,
  renewingCard,
  type MembershipView,
} from '../../features/exit/membershipState';
import {
  CERT_CHOICES,
  CERT_QUESTION,
  COMMENT_FAILED,
  COMMENT_THANKS,
  D1_BODY,
  D1_CONTINUE,
  D1_KEEP_ACCOUNT,
  D1_TITLE,
  D2_DELETE,
  D3_TITLE,
  EXIT_FLOW_VERSION,
  Q1_PROMPT,
  deleteFollowUpFor,
  reasonsFor,
  subscriptionWarning,
  thankYou,
  type KeepChoice,
  type Provider,
  type ReasonCode,
} from '../../features/exit/survey';
import { Btn, ChoiceList, CommentBox, ExitHeader, Section, ui } from './exitUi';

type Props = NativeStackScreenProps<RootStackParamList, 'DeleteAccountFlow'>;

export type DeleteStep = 'd1' | 'd2' | 'd3';
type Membership = { state: 'loading' } | { state: 'failed' } | { state: 'ready'; view: MembershipView };

export function DeleteAccountFlowScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<DeleteStep>('d1');
  const [reason, setReason] = useState<ReasonCode | null>(null);
  const [followup, setFollowup] = useState<string | null>(null);
  /** null = not chosen. Never preselected. */
  const [certChoice, setCertChoice] = useState<KeepChoice | null>(null);
  /** true / false, or null when the read failed (the choice is then shown). */
  const [hasCredential, setHasCredential] = useState<boolean | null | undefined>(undefined);
  const [membership, setMembership] = useState<Membership>({ state: 'loading' });
  /** Read BEFORE the delete; lives only in this screen's memory. */
  const [firstName, setFirstName] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [comment, setComment] = useState('');
  const [commentStatus, setCommentStatus] = useState<'idle' | 'sent' | 'failed'>('idle');
  const [commentSending, setCommentSending] = useState(false);
  const alive = useRef(true);
  const scroller = useRef<ScrollView>(null);

  useEffect(() => {
    alive.current = true;
    trackEvent('exit_started', { flow: 'delete', flow_version: EXIT_FLOW_VERSION });
    trackEvent('question_presented', { flow: 'delete', question: 'q1' });
    void readFirstName().then((n) => alive.current && setFirstName(n));
    void readHasCredential().then((h) => alive.current && setHasCredential(h));
    void readMembership().then(
      (res) =>
        alive.current &&
        setMembership(res.ok ? { state: 'ready', view: membershipView(res.rows, res.renewalKnown) } : { state: 'failed' }),
    );
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    scroller.current?.scrollTo?.({ y: 0, animated: false });
  }, [step]);

  /** The certificate choice shows when they hold one — or when we could not tell. */
  const needsCertChoice = hasCredential !== false;
  const view = membership.state === 'ready' ? membership.view : null;
  const renewing = view ? renewingCard(view) : null;
  // Billing warnings: every store subscription still billing. If the read
  // failed, warn for this phone's store (the honest fallback).
  const billing: Provider[] = view
    ? providersStillBilling(view)
    : membership.state === 'failed'
      ? [Platform.OS === 'ios' ? 'apple' : 'google']
      : [];
  const fu = deleteFollowUpFor(reason);

  const done = useCallback(() => {
    navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
  }, [navigation]);

  const back = useCallback((): boolean => {
    if (busy) return true;
    if (step === 'd3') done();
    else if (step === 'd2') setStep('d1');
    else safeGoBack(navigation);
    return true;
  }, [busy, step, done, navigation]);
  useBackWhileFocused(true, back);

  /** Synchronous: a second confirm tap in the same frame is dropped. */
  const deleting = useRef(false);
  const runDelete = async () => {
    if (deleting.current) return;
    deleting.current = true;
    try {
      await runDeleteOnce();
    } finally {
      deleting.current = false;
    }
  };
  const runDeleteOnce = async () => {
    setBusy(true);
    setAuthError(null);
    const authMsg = await confirmCurrentPassword(password);
    if (!alive.current) return;
    if (authMsg) {
      setBusy(false);
      setAuthError(authMsg);
      return;
    }
    const outcome = await deleteMyAccount(needsCertChoice ? certChoice : 'delete_all');
    if (outcome === 'deleted') {
      setPassword('');
      // Answers go now, WITHOUT an account (the session is gone): the erased
      // account leaves nothing linked to it. Best effort.
      if (reason !== null || followup !== null) void submitExitFeedback({ flow: 'delete', reason, followup });
      if (!alive.current) return;
      setBusy(false);
      setStep('d3');
      return;
    }
    if (!alive.current) return;
    setBusy(false);
    if (outcome === 'keep_unavailable') {
      // INVENTED COPY — the server cannot keep a record yet; nothing was deleted.
      notify(
        'Verification record not available yet',
        'We can’t keep a verification record right now, so nothing was deleted. Try again later, or choose Delete everything.',
      );
      return;
    }
    notify(
      // Same words as the hold-to-delete button.
      'Could not delete account',
      'We couldn’t complete the deletion. Check your connection and try again — if it keeps failing, email info@proaudiotrainingacademy.com and we will remove the account for you.',
    );
  };

  const askConfirm = useLatchedPress(() => {
    if (!deleteEnabled({ password, needsCertChoice, certChoice, busy })) return;
    const certLine =
      needsCertChoice && certChoice === 'keep_record'
        ? ' A verification record of your certificates will be kept.'
        : needsCertChoice
          ? ' Your certificates can no longer be verified.'
          : '';
    // INVENTED COPY (spec: "one explicit Delete my account confirmation").
    confirmDialog(
      'Delete your account?',
      `Your account and saved learning data will be removed.${certLine} This cannot be undone.`,
      D2_DELETE,
      () => void runDelete(),
      { destructive: true },
    );
  });

  const sendComment = useLatchedPress(async () => {
    if (!comment.trim()) return;
    setCommentSending(true);
    const ok = await submitExitFeedback({ flow: 'delete', reason: null, followup: null, comment });
    if (!alive.current) return;
    setCommentSending(false);
    setCommentStatus(ok ? 'sent' : 'failed');
  });

  const canDelete = deleteEnabled({ password, needsCertChoice, certChoice, busy });
  const certLabel = certChoice ? CERT_CHOICES.find((c) => c.code === certChoice)?.label ?? null : null;

  return (
    <KeyboardAvoidingView style={ui.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[ui.root, { paddingTop: insets.top + 8 }]}>
        <ExitHeader eyebrow="ACCOUNT AND PRIVACY" onBack={step === 'd3' || busy ? undefined : back} />
        <ScrollView
          ref={scroller}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[ui.scroll, { paddingBottom: insets.bottom + 24 }]}
        >
          {step === 'd1' ? (
            <>
              <Text style={ui.title} accessibilityRole="header">
                {D1_TITLE}
              </Text>
              <Text style={ui.body}>{D1_BODY}</Text>
              {renewing ? (
                <Btn
                  label={D1_KEEP_ACCOUNT}
                  kind="link"
                  onPress={() => navigation.replace('CancelMembership', { provider: renewing.provider, endsAt: renewing.endsAt })}
                />
              ) : null}
              <ChoiceList
                prompt={Q1_PROMPT.delete}
                choices={reasonsFor('delete')}
                value={reason}
                onChange={(r) => {
                  setReason(r);
                  setFollowup(null);
                  if (r) trackEvent('question_presented', { flow: 'delete', question: 'q2' });
                }}
              />
              {fu ? <ChoiceList prompt={fu.prompt} choices={fu.choices} value={followup} onChange={setFollowup} /> : null}

              {hasCredential === undefined ? <Text style={ui.note}>Checking your certificates…</Text> : null}
              {hasCredential !== undefined && needsCertChoice ? (
                <ChoiceList
                  prompt={CERT_QUESTION}
                  choices={CERT_CHOICES}
                  value={certChoice}
                  onChange={setCertChoice}
                  allowClear={false}
                />
              ) : null}

              <Btn label={D1_CONTINUE} kind="danger" onPress={() => setStep('d2')} />
            </>
          ) : null}

          {step === 'd2' ? (
            <>
              {/* INVENTED title (spec names the screen "Billing and identity confirmation"). */}
              <Text style={ui.title} accessibilityRole="header">
                Billing and identity
              </Text>

              {membership.state === 'loading' ? <Text style={ui.note}>Checking your membership…</Text> : null}
              {membership.state === 'failed' ? <Text style={ui.note}>{MEMBERSHIP_NOT_CONFIRMED}</Text> : null}
              {billing.map((p) => (
                <Section key={p}>
                  <Text style={ui.body}>{subscriptionWarning(p)}</Text>
                  <Btn label="Manage subscription" onPress={() => void openSubscriptions(p, 'delete')} />
                </Section>
              ))}

              {needsCertChoice ? (
                <Section>
                  {/* INVENTED COPY — the D1 choice, restated before the final button. */}
                  <Text style={ui.strong}>Your certificates</Text>
                  <Text style={ui.body}>{certLabel ?? 'Choose what happens to your certificates before deleting.'}</Text>
                  <Btn label={certLabel ? 'Change' : 'Choose'} kind="link" onPress={() => setStep('d1')} />
                </Section>
              ) : null}

              {/* INVENTED COPY. */}
              <Text style={ui.body}>Enter your password to confirm it is you.</Text>
              <TextField
                label="Password"
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  setAuthError(null);
                }}
                password
                editable={!busy}
                returnKeyType="done"
              />
              {authError ? (
                <Text style={ui.error} accessibilityLiveRegion="polite">
                  {authError}
                </Text>
              ) : null}

              <Btn label={busy ? 'Deleting…' : D2_DELETE} kind="danger" onPress={askConfirm} disabled={!canDelete} />
            </>
          ) : null}

          {step === 'd3' ? (
            <>
              <Text style={ui.title} accessibilityRole="header" accessibilityLiveRegion="polite">
                {D3_TITLE}
              </Text>
              <Text style={ui.body}>{thankYou(firstName, reason !== null || followup !== null || commentStatus === 'sent')}</Text>
              <CommentBox
                value={comment}
                onChange={setComment}
                onSend={sendComment}
                sending={commentSending}
                status={commentStatus}
                statusText={commentStatus === 'sent' ? COMMENT_THANKS : COMMENT_FAILED}
              />
              <Btn label="Done" kind="primary" onPress={done} />
            </>
          ) : null}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
