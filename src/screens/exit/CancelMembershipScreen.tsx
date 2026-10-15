/**
 * Cancel membership (exit flow, 2026-10-15; behind EXIT_FLOW_ENABLED).
 * One screen, four steps (spec §3, owner build plan — no pause in v1):
 *
 *   C1 Before you decide — intro + Question 1
 *   C2 one follow-up chosen by the first answer (blank → "Do you expect to return?")
 *   C3 Choose what works for you — Cancel membership / Keep my membership,
 *      neither preselected
 *   C4 the VERIFIED outcome
 *
 * ⛔ A WORKING CANCEL CONTROL ON EVERY STEP BEFORE THE OUTCOME (Cal. B&P
 * 17602(e)(2)). "Continue to {provider} to cancel" is docked at the bottom of
 * C1–C3, always enabled, and works with zero answers. Answers never unlock it.
 *
 * ⛔ NEVER SUCCESS FROM A TAP. Opening the store page proves nothing. On return
 * to the app the entitlement is re-read; "Your membership will not renew." is
 * shown only when the server says will_renew === false for this provider.
 * Until then: "We have not confirmed your membership change yet" + Refresh +
 * Manage subscription.
 *
 * Answers go to the server (best effort, once) when the person continues to
 * the store, cancels or keeps the membership; a failure never blocks anything.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { safeGoBack } from '../../lib/safeGoBack';
import { useBackWhileFocused } from '../../lib/useBackWhileFocused';
import { useLatchedPress } from '../../lib/latch';
import { trackEvent } from '../../features/telemetry/telemetry';
import { useEntitlement } from '../../features/commercial/EntitlementProvider';
import { openSubscriptions, readFirstName, readMembership, submitExitFeedback } from '../../features/exit/api';
import { accessEndFor, cancellationVerified, formatDate } from '../../features/exit/membershipState';
import {
  C1_INTRO,
  C1_TITLE,
  C3_TITLE,
  C4_NOT_CONFIRMED,
  C4_TITLE,
  COMMENT_FAILED,
  COMMENT_THANKS,
  EXIT_FLOW_VERSION,
  FEEDBACK_NOTICE,
  Q1_PROMPT,
  c3Body,
  c4Body,
  completeThereNote,
  continueToCancelLabel,
  followUpFor,
  reasonsFor,
  thankYou,
  type ReasonCode,
} from '../../features/exit/survey';
import { Btn, ChoiceList, CommentBox, ExitHeader, Section, ui } from './exitUi';

type Props = NativeStackScreenProps<RootStackParamList, 'CancelMembership'>;

export type CancelStep = 'c1' | 'c2' | 'c3' | 'c4';
/** The steps that carry the docked "Continue to {provider} to cancel" control. */
export const STEPS_WITH_CANCEL_CONTROL: readonly CancelStep[] = ['c1', 'c2', 'c3'];

type Verify = 'checking' | 'pending' | 'verified';

export function CancelMembershipScreen({ navigation, route }: Props) {
  const { provider, endsAt: endsAtParam } = route.params;
  const insets = useSafeAreaInsets();
  const { refreshEntitlement } = useEntitlement();
  const [step, setStep] = useState<CancelStep>('c1');
  const [reason, setReason] = useState<ReasonCode | null>(null);
  const [followup, setFollowup] = useState<string | null>(null);
  const [verify, setVerify] = useState<Verify>('checking');
  const [accessEnd, setAccessEnd] = useState<string | null>(endsAtParam);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [commentStatus, setCommentStatus] = useState<'idle' | 'sent' | 'failed'>('idle');
  const [commentSending, setCommentSending] = useState(false);
  const answersSent = useRef(false);
  const gaveAnswers = reason !== null || followup !== null;
  const alive = useRef(true);
  const scroller = useRef<ScrollView>(null);

  useEffect(() => {
    alive.current = true;
    trackEvent('exit_started', { flow: 'cancel', flow_version: EXIT_FLOW_VERSION });
    void readFirstName().then((n) => {
      if (alive.current) setFirstName(n);
    });
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    if (step === 'c1' || step === 'c2') trackEvent('question_presented', { flow: 'cancel', question: step === 'c1' ? 'q1' : 'q2' });
    scroller.current?.scrollTo?.({ y: 0, animated: false });
  }, [step]);

  const fu = followUpFor(reason);

  /** Answers, once, best effort — never awaited by the exit itself. */
  const sendAnswersOnce = () => {
    if (answersSent.current) return;
    answersSent.current = true;
    if (reason === null && followup === null) return;
    void submitExitFeedback({ flow: 'cancel', reason, followup });
  };

  // ── Verification after the store page ──────────────────────────────────────
  const verifySeq = useRef(0);
  const runVerify = useCallback(async () => {
    const mine = ++verifySeq.current;
    setVerify('checking');
    await refreshEntitlement().catch(() => false);
    const res = await readMembership();
    if (!alive.current || mine !== verifySeq.current) return;
    if (res.ok && cancellationVerified(res.rows, res.renewalKnown, provider)) {
      setAccessEnd(accessEndFor(res.rows, provider) ?? endsAtParam);
      setVerify('verified');
      trackEvent('cancellation_verified', { flow_version: EXIT_FLOW_VERSION, provider });
    } else {
      setVerify('pending');
    }
  }, [provider, endsAtParam, refreshEntitlement]);

  // Back from the store → re-read (only while on the outcome step).
  useEffect(() => {
    if (step !== 'c4') return;
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void runVerify();
    });
    return () => sub.remove();
  }, [step, runVerify]);

  const continueToStore = useLatchedPress(async () => {
    sendAnswersOnce();
    setStep('c4');
    setVerify('pending');
    const opened = await openSubscriptions(provider, 'cancel');
    // Opening proves nothing; the AppState listener re-reads on return. If the
    // page never opened, check right away so the screen is not left guessing.
    if (!opened) void runVerify();
  });

  const keepMembership = () => {
    sendAnswersOnce();
    trackEvent('membership_kept', { flow_version: EXIT_FLOW_VERSION, reason: reason ?? 'none' });
    safeGoBack(navigation);
  };

  const sendComment = useLatchedPress(async () => {
    if (!comment.trim()) return;
    setCommentSending(true);
    const ok = await submitExitFeedback({ flow: 'cancel', reason: null, followup: null, comment });
    if (!alive.current) return;
    setCommentSending(false);
    setCommentStatus(ok ? 'sent' : 'failed');
  });

  const back = useCallback((): boolean => {
    if (step === 'c2') setStep('c1');
    else if (step === 'c3') setStep('c2');
    else safeGoBack(navigation);
    return true;
  }, [step, navigation]);
  useBackWhileFocused(true, back);

  const endText = formatDate(accessEnd);
  const showCancelControl = STEPS_WITH_CANCEL_CONTROL.includes(step);

  return (
    <KeyboardAvoidingView style={ui.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[ui.root, { paddingTop: insets.top + 8 }]}>
        <ExitHeader eyebrow="CANCEL MEMBERSHIP" onBack={back} />
        <ScrollView ref={scroller} contentContainerStyle={[ui.scroll, { paddingBottom: showCancelControl ? 24 : insets.bottom + 24 }]}>
          {step === 'c1' ? (
            <>
              <Text style={ui.title} accessibilityRole="header">
                {C1_TITLE}
              </Text>
              <Text style={ui.body}>{C1_INTRO}</Text>
              <ChoiceList
                prompt={Q1_PROMPT.cancel}
                choices={reasonsFor('cancel')}
                value={reason}
                onChange={(r) => {
                  setReason(r);
                  setFollowup(null);
                }}
              />
              <Btn label="Continue" kind="primary" onPress={() => setStep('c2')} />
            </>
          ) : null}

          {step === 'c2' ? (
            <>
              <ChoiceList prompt={fu.prompt} choices={fu.choices} value={followup} onChange={setFollowup} />
              <Btn label="Review my options" kind="primary" onPress={() => setStep('c3')} />
            </>
          ) : null}

          {step === 'c3' ? (
            <>
              <Text style={ui.title} accessibilityRole="header">
                {C3_TITLE}
              </Text>
              <Text style={ui.body}>{c3Body(endText)}</Text>
              {/* Equal weight, neither preselected (no pause in v1). */}
              <View style={{ gap: 10 }}>
                <Btn label="Cancel membership" onPress={continueToStore} hint={completeThereNote(provider)} />
                <Btn label="Keep my membership" onPress={keepMembership} />
              </View>
            </>
          ) : null}

          {step === 'c4' && verify !== 'verified' ? (
            <>
              <Text style={ui.title} accessibilityRole="header">
                {verify === 'checking' ? 'Checking your membership…' : C4_NOT_CONFIRMED}
              </Text>
              <Btn label="Refresh" kind="primary" onPress={() => void runVerify()} disabled={verify === 'checking'} />
              <Btn label="Manage subscription" onPress={() => void openSubscriptions(provider, 'cancel')} />
            </>
          ) : null}

          {step === 'c4' && verify === 'verified' ? (
            <>
              <Text style={ui.title} accessibilityRole="header" accessibilityLiveRegion="polite">
                {C4_TITLE}
              </Text>
              <Text style={ui.body}>{c4Body(endText)}</Text>
              <Text style={ui.body}>{thankYou(firstName, gaveAnswers || commentStatus === 'sent')}</Text>
              <CommentBox
                value={comment}
                onChange={setComment}
                onSend={sendComment}
                sending={commentSending}
                status={commentStatus}
                statusText={commentStatus === 'sent' ? COMMENT_THANKS : COMMENT_FAILED}
              />
              <Btn label="Return to the app" kind="primary" onPress={() => navigation.popToTop()} />
            </>
          ) : null}
        </ScrollView>

        {showCancelControl ? (
          <View style={[ui.dock, { paddingBottom: insets.bottom + 12 }]}>
            <Text style={ui.note}>{FEEDBACK_NOTICE}</Text>
            <Btn label={continueToCancelLabel(provider)} kind="danger" onPress={continueToStore} hint={completeThereNote(provider)} />
            <Text style={ui.note}>{completeThereNote(provider)}</Text>
          </View>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}
